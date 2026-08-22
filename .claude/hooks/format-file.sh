#!/bin/bash
# PostToolUse(Edit|Write): format and organize imports on the file the agent just touched.
# Fast enough to run on every edit. Always exits 0 — formatting is never a reason to block.
set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}" || exit 0

file=$(jq -r '.tool_input.file_path // empty')
[ -n "$file" ] || exit 0

# Only source files Biome is configured for.
case "$file" in
  "$PWD"/src/*.ts | "$PWD"/src/*.tsx | src/*.ts | src/*.tsx) ;;
  *) exit 0 ;;
esac

[ -f "$file" ] || exit 0

pnpm exec biome check --write "$file" >/dev/null 2>&1
exit 0
