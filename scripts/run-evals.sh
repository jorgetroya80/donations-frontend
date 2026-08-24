#!/bin/bash
# Run the agent-harness eval cases, each in a throwaway git worktree.
#
#   bash scripts/run-evals.sh                     # all cases
#   bash scripts/run-evals.sh donor-phone-field   # one case
#   EVAL_LABEL=baseline bash scripts/run-evals.sh # tag the run for A/B comparison
#
# Each case is a markdown file in .claude/evals/cases/ with an optional "## Setup" bash
# block, a "## Prompt" block and an "## Assertions" bash block. A case passes when every
# assertion command exits 0.
#
# Claude runs with --permission-mode acceptEdits. It edits files freely and does run
# shell commands, so a case can expect the agent to run the suite itself. Override with
# EVAL_PERMISSION_MODE=bypassPermissions to drop every permission check for the run —
# only worth it inside the disposable worktree.
#
# EVAL_NO_HARNESS=1 deletes CLAUDE.md and .claude/settings.json inside the worktree before
# the agent starts, so the case runs with no project context and no hooks. That is the
# control arm: same cases, same model, harness off, to compare against a labelled run.
set -uo pipefail

ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT" || exit 1

CASES_DIR=.claude/evals/cases
RESULTS_DIR=.claude/evals/results
LABEL=${EVAL_LABEL:-run}
PERMISSION_MODE=${EVAL_PERMISSION_MODE:-acceptEdits}
NO_HARNESS=${EVAL_NO_HARNESS:-0}
STAMP=$(date +%Y%m%d-%H%M%S)
OUT="$RESULTS_DIR/$LABEL-$STAMP.json"

command -v claude >/dev/null || { echo "claude CLI not on PATH" >&2; exit 1; }
command -v jq >/dev/null || { echo "jq not on PATH" >&2; exit 1; }

mkdir -p "$RESULTS_DIR"

# Extract the first fenced block that follows a given "## Heading".
section() {
  awk -v want="$1" '
    $0 ~ "^## " want "$" { in_sec = 1; next }
    in_sec && /^```/     { fence = !fence; if (!fence) exit; next }
    in_sec && fence      { print }
  ' "$2"
}

cases=()
if [ $# -gt 0 ]; then
  for name in "$@"; do cases+=("$CASES_DIR/$name.md"); done
else
  for f in "$CASES_DIR"/*.md; do cases+=("$f"); done
fi

results="[]"
pass_count=0
fail_count=0

for case_file in "${cases[@]}"; do
  name=$(basename "$case_file" .md)
  [ -f "$case_file" ] || { echo "no such case: $name" >&2; exit 1; }

  work=$(mktemp -d "${TMPDIR:-/tmp}/eval-$name.XXXXXX")
  tree="$work/repo"

  echo "▸ $name"
  git worktree add --quiet --detach "$tree" HEAD || { echo "  worktree failed"; continue; }
  # Reuse the installed dependencies instead of a 60s pnpm install per case. This is a
  # copy, not a symlink: a symlinked node_modules is the *host* repo's, so an agent that
  # runs pnpm inside the worktree rewrites it and leaves the real checkout with links
  # into a temp dir that is about to be deleted. On APFS, -c clones (~8s, no real bytes).
  cp -Rc "$ROOT/node_modules" "$tree/node_modules" 2>/dev/null ||
    cp -R "$ROOT/node_modules" "$tree/node_modules"

  # Control arm: strip the project context and the hooks from the worktree. Personal
  # skills and agents are gitignored, so they are absent from the worktree already.
  if [ "$NO_HARNESS" = "1" ]; then
    rm -f "$tree/CLAUDE.md" "$tree/.claude/settings.json"
  fi

  prompt=$(section Prompt "$case_file")
  setup=$(section Setup "$case_file")
  asserts=$(section Assertions "$case_file")

  if [ -n "$setup" ]; then
    ( cd "$tree" && bash -e -c "$setup" ) >"$work/setup.log" 2>&1 || {
      echo "  ✗ setup failed — see $work/setup.log"
      fail_count=$((fail_count + 1))
      git worktree remove --force "$tree" 2>/dev/null
      continue
    }
  fi

  agent_json=$(
    cd "$tree" && claude -p "$prompt" \
      --output-format json \
      --permission-mode "$PERMISSION_MODE" 2>"$work/agent.err"
  )

  # A session that returns nothing (or an is_error result) never produced output to judge.
  # Report that as "error" so a dead session is not filed as a failed case.
  if [ -z "$agent_json" ] || [ "$(jq -r '.is_error // false' <<<"$agent_json" 2>/dev/null)" = "true" ]; then
    echo "  ! error  agent session produced no result — logs: $work"
    fail_count=$((fail_count + 1))
    results=$(jq --arg name "$name" --arg logs "$work" \
      '. + [{name: $name, status: "error", cost_usd: 0, turns: 0, duration_ms: 0, logs: $logs}]' \
      <<<"$results")
    continue
  fi

  cost=$(jq -r '.total_cost_usd // 0' <<<"$agent_json" 2>/dev/null || echo 0)
  turns=$(jq -r '.num_turns // 0' <<<"$agent_json" 2>/dev/null || echo 0)
  duration=$(jq -r '.duration_ms // 0' <<<"$agent_json" 2>/dev/null || echo 0)

  # Assertions run one per line, with -e so the first failure ends the case.
  if ( cd "$tree" && bash -e -c "$asserts" ) >"$work/assert.log" 2>&1; then
    status=pass
    pass_count=$((pass_count + 1))
    echo "  ✓ pass  \$$cost  ${turns} turns"
    git worktree remove --force "$tree" 2>/dev/null
    rm -rf "$work"
    logs=""
  else
    status=fail
    fail_count=$((fail_count + 1))
    echo "  ✗ fail  \$$cost  ${turns} turns  — logs: $work"
    # Keep the worktree so the failure can be inspected.
    logs="$work"
  fi

  results=$(jq \
    --arg name "$name" --arg status "$status" --arg logs "$logs" \
    --argjson cost "${cost:-0}" --argjson turns "${turns:-0}" --argjson duration "${duration:-0}" \
    '. + [{name: $name, status: $status, cost_usd: $cost, turns: $turns, duration_ms: $duration, logs: $logs}]' \
    <<<"$results")
done

jq -n \
  --arg label "$LABEL" --arg stamp "$STAMP" --arg mode "$PERMISSION_MODE" \
  --arg commit "$(git rev-parse --short HEAD)" \
  --arg no_harness "$NO_HARNESS" \
  --argjson results "$results" \
  '{label: $label, timestamp: $stamp, commit: $commit, permission_mode: $mode, no_harness: ($no_harness == "1"), results: $results}' \
  >"$OUT"

echo
echo "$pass_count passed, $fail_count failed → $OUT"
[ "$fail_count" -eq 0 ]
