#!/bin/bash
# UserPromptSubmit: put the current branch and working tree in front of the agent,
# so it never assumes it is on a feature branch when it is on main.
set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}" || exit 0

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || exit 0
status=$(git status --short | head -20)

echo "Branch: $branch"
[ "$branch" = "main" ] && echo "On main — branch before committing (pre-push blocks main)."
[ -n "$status" ] && printf 'Working tree:\n%s\n' "$status"

exit 0
