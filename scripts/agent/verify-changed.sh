#!/bin/bash
# Typecheck and run the tests related to the src files changed in the working tree
# (unstaged, staged and untracked). Agent-neutral: `pnpm check:agent` runs it, and the
# Claude Code and Codex Stop hooks call it through scripts/agent/stop-hook.sh.
#
# Exit: 0 clean or nothing changed, 1 failure (report on stderr).
set -uo pipefail

# The local binaries are called directly rather than through `pnpm exec`: the eval
# worktrees copy node_modules, and pnpm can abort there trying to purge it.

cd "$(git rev-parse --show-toplevel)" || exit 0

# Bash 3.2 on macOS: no mapfile, keep the list newline-separated.
changed=$(
  {
    git diff --name-only --diff-filter=ACMR -- src
    git diff --cached --name-only --diff-filter=ACMR -- src
    git ls-files --others --exclude-standard -- src
  } | sort -u | grep -E '\.tsx?$'
)

if [ -z "$changed" ]; then
  echo "check:agent: no changed src files"
  exit 0
fi

failed=""

if ! tsc_out=$(./node_modules/.bin/tsc --build --force 2>&1); then
  failed+="--- typecheck ---
$tsc_out
"
fi

# Paths carry no spaces in this repo (kebab-case rule), so word splitting is safe here.
# shellcheck disable=SC2086
if ! test_out=$(./node_modules/.bin/vitest related --run $changed 2>&1); then
  failed+="--- vitest related ---
$test_out
"
fi

if [ -n "$failed" ]; then
  printf '%s' "$failed" >&2
  exit 1
fi

echo "check:agent: typecheck and related tests pass"
exit 0
