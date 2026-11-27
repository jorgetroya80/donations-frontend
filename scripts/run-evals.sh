#!/bin/bash
# Run the agent-harness eval cases, each in a throwaway git worktree.
#
#   bash scripts/run-evals.sh                         # all cases, Claude Code
#   bash scripts/run-evals.sh donor-phone-field       # one case
#   EVAL_AGENT=codex bash scripts/run-evals.sh        # same cases, another agent
#   EVAL_LABEL=baseline bash scripts/run-evals.sh     # tag the run for A/B comparison
#
# Each case is a markdown file in evals/cases/ with an optional "## Setup" bash block, a
# "## Prompt" block and an "## Assertions" bash block. A case passes when every assertion
# command exits 0. Assertions only use grep, git, tsc and vitest, so they judge every agent
# the same way.
#
# EVAL_AGENT picks the agent CLI (default claude):
#   claude    claude -p --output-format json --permission-mode $EVAL_PERMISSION_MODE
#             (default acceptEdits; bypassPermissions drops every check, only worth it
#             inside the disposable worktree). Records cost and turns.
#   codex     codex exec --json --sandbox workspace-write. The worktree is marked trusted
#             and hook trust is bypassed for the run, so .codex/ loads as in a trusted
#             checkout. Records token usage.
#   opencode  opencode run --format json, plus $EVAL_AGENT_ARGS
#             (default --dangerously-skip-permissions). Records pass/fail only.
# EVAL_AGENT_ARGS replaces the default extra flags for codex and opencode.
#
# EVAL_NO_HARNESS=1 deletes the harness inside the worktree before the agent starts:
# CLAUDE.md, AGENTS.md, .claude/settings.json, the repo skills, .codex/ and opencode.json.
# The case then runs with no project context, no hooks and no repo skills. That is the
# control arm: same cases, same agent, harness off, to compare against a labelled run.
# AGENTS.md must go too: since Claude Code 2.1.277 it loads whenever no CLAUDE.md is present.
set -uo pipefail

ROOT=$(git rev-parse --show-toplevel)
cd "$ROOT" || exit 1

CASES_DIR=evals/cases
RESULTS_DIR=evals/results
AGENT=${EVAL_AGENT:-claude}
LABEL=${EVAL_LABEL:-run}
PERMISSION_MODE=${EVAL_PERMISSION_MODE:-acceptEdits}
NO_HARNESS=${EVAL_NO_HARNESS:-0}
STAMP=$(date +%Y%m%d-%H%M%S)
OUT="$RESULTS_DIR/$LABEL-$AGENT-$STAMP.json"

case "$AGENT" in
  claude) AGENT_ARGS=() ;;
  codex) read -r -a AGENT_ARGS <<<"${EVAL_AGENT_ARGS:-}" ;;
  opencode) read -r -a AGENT_ARGS <<<"${EVAL_AGENT_ARGS:---dangerously-skip-permissions}" ;;
  *) echo "EVAL_AGENT must be claude, codex or opencode (got: $AGENT)" >&2; exit 1 ;;
esac

command -v "$AGENT" >/dev/null || { echo "$AGENT CLI not on PATH" >&2; exit 1; }
command -v jq >/dev/null || { echo "jq not on PATH" >&2; exit 1; }

# Run the agent on $1 (prompt) inside $2 (worktree), raw output to $3. Sets ok (1 when the
# session produced a usable result) and metrics (a JSON object for the results file).
run_agent() {
  local prompt=$1 tree=$2 out=$3
  ok=0
  metrics='{}'
  case "$AGENT" in
    claude)
      (cd "$tree" && claude -p "$prompt" --output-format json \
        --permission-mode "$PERMISSION_MODE") >"$out" 2>"$out.err"
      # A session that returns nothing (or an is_error result) produced nothing to judge.
      if [ -s "$out" ] && [ "$(jq -r '.is_error // false' "$out" 2>/dev/null)" = "false" ]; then
        ok=1
        metrics=$(jq -c '{cost_usd: (.total_cost_usd // 0), turns: (.num_turns // 0),
                          duration_ms: (.duration_ms // 0)}' "$out")
      fi
      ;;
    codex)
      # Trust is keyed by path: use the resolved one (macOS $TMPDIR sits behind /var → /private/var).
      local real
      real=$(cd "$tree" && pwd -P)
      (cd "$tree" && codex exec --json --sandbox workspace-write \
        --dangerously-bypass-hook-trust \
        -c "projects.\"$real\".trust_level=\"trusted\"" \
        ${AGENT_ARGS[@]+"${AGENT_ARGS[@]}"} "$prompt") >"$out" 2>"$out.err"
      local status=$?
      # JSONL events. A failed turn or a non-zero exit is a dead session, not a failed case.
      if [ "$status" -eq 0 ] && [ -s "$out" ] &&
        ! jq -e 'select(.type == "turn.failed" or .type == "error")' "$out" >/dev/null 2>&1; then
        ok=1
        metrics=$(jq -s -c '[.[] | select(.type == "turn.completed") | .usage]
                  | {tokens: {input: (map(.input_tokens // 0) | add // 0),
                              cached_input: (map(.cached_input_tokens // 0) | add // 0),
                              output: (map(.output_tokens // 0) | add // 0)}}' "$out" 2>/dev/null ||
          echo '{}')
      fi
      ;;
    opencode)
      (cd "$tree" && opencode run --format json ${AGENT_ARGS[@]+"${AGENT_ARGS[@]}"} "$prompt") >"$out" 2>"$out.err"
      [ $? -eq 0 ] && [ -s "$out" ] && ok=1
      ;;
  esac
}

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

  # Control arm: strip the project context, the hooks and the repo skills from the
  # worktree. Personal skills and agents are gitignored, so they are absent already.
  # Global config (~/.claude, ~/.codex, ~/.config/opencode) is not touched.
  if [ "$NO_HARNESS" = "1" ]; then
    rm -f "$tree/CLAUDE.md" "$tree/AGENTS.md" "$tree/.claude/settings.json" "$tree/opencode.json"
    rm -rf "$tree/.agents" "$tree/.claude/skills" "$tree/.codex"
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

  run_agent "$prompt" "$tree" "$work/agent.out"

  if [ "$ok" != "1" ]; then
    echo "  ! error  agent session produced no result — logs: $work"
    fail_count=$((fail_count + 1))
    results=$(jq --arg name "$name" --arg logs "$work" \
      '. + [{name: $name, status: "error", logs: $logs}]' <<<"$results")
    continue
  fi

  # Assertions run one per line, with -e so the first failure ends the case.
  if ( cd "$tree" && bash -e -c "$asserts" ) >"$work/assert.log" 2>&1; then
    status=pass
    pass_count=$((pass_count + 1))
    echo "  ✓ pass  $metrics"
    git worktree remove --force "$tree" 2>/dev/null
    rm -rf "$work"
    logs=""
  else
    status=fail
    fail_count=$((fail_count + 1))
    echo "  ✗ fail  $metrics  — logs: $work"
    # Keep the worktree so the failure can be inspected.
    logs="$work"
  fi

  results=$(jq \
    --arg name "$name" --arg status "$status" --arg logs "$logs" --argjson metrics "$metrics" \
    '. + [{name: $name, status: $status, logs: $logs} + $metrics]' <<<"$results")
done

jq -n \
  --arg label "$LABEL" --arg stamp "$STAMP" --arg agent "$AGENT" --arg mode "$PERMISSION_MODE" \
  --arg commit "$(git rev-parse --short HEAD)" \
  --arg no_harness "$NO_HARNESS" \
  --argjson results "$results" \
  '{label: $label, timestamp: $stamp, commit: $commit, agent: $agent,
    permission_mode: (if $agent == "claude" then $mode else null end),
    no_harness: ($no_harness == "1"), results: $results}' \
  >"$OUT"

echo
echo "$pass_count passed, $fail_count failed → $OUT"
[ "$fail_count" -eq 0 ]
