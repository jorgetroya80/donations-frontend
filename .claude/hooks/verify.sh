#!/bin/bash
# Stop: before the turn ends, typecheck and run the tests related to what changed.
# Exit 2 hands the failure back to the agent so it fixes it instead of stopping.
set -uo pipefail

# The local binaries are called directly rather than through `pnpm exec`: the eval
# worktrees symlink node_modules, and pnpm aborts there trying to purge it.

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}" || exit 0

input=$(cat)

# Already re-entered once after a block — let the turn end rather than loop forever.
[ "$(jq -r '.stop_hook_active // false' <<<"$input")" = "true" ] && exit 0

# Bash 3.2 on macOS: no mapfile, keep the list newline-separated.
changed=$(
  {
    git diff --name-only --diff-filter=ACMR -- src
    git diff --cached --name-only --diff-filter=ACMR -- src
    git ls-files --others --exclude-standard -- src
  } | sort -u | grep -E '\.tsx?$'
)

[ -n "$changed" ] || exit 0

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
  printf 'Verification failed on the files you changed. Fix this before finishing.\n\n%s' "$failed" >&2
  exit 2
fi

exit 0
