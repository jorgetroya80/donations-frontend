#!/bin/bash
# Stop hook shared by Claude Code (.claude/settings.json) and Codex (.codex/hooks.json).
# Both send JSON with `stop_hook_active` on stdin and treat exit 2 + stderr as "keep
# going, with this as the next instruction".
set -uo pipefail

input=$(cat)

# Already re-entered once after a block — let the turn end rather than loop forever.
[ "$(jq -r '.stop_hook_active // false' <<<"$input" 2>/dev/null)" = "true" ] && exit 0

root=$(git rev-parse --show-toplevel 2>/dev/null) || exit 0

if ! report=$(bash "$root/scripts/agent/verify-changed.sh" 2>&1 >/dev/null); then
  printf 'Verification failed on the files you changed. Fix this before finishing.\n\n%s' "$report" >&2
  exit 2
fi

exit 0
