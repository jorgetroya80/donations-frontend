#!/bin/bash
# PostToolUse(Edit|Write): pass the edited file to the shared formatter.
set -uo pipefail
file=$(jq -r '.tool_input.file_path // empty')
[ -n "$file" ] || exit 0
bash "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}/scripts/agent/format-file.sh" "$file"
exit 0
