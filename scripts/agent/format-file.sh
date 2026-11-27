#!/bin/bash
# Lint-fix and format one file the agent just wrote: `format-file.sh <path>`.
# Called by the Claude Code PostToolUse hook and by OpenCode as its formatter
# (opencode.json). Only src .ts/.tsx; always exits 0 — formatting never blocks.
set -uo pipefail

file=${1:-}
[ -n "$file" ] || exit 0

cd "$(git rev-parse --show-toplevel)" || exit 0

case "$file" in
  "$PWD"/src/*.ts | "$PWD"/src/*.tsx | src/*.ts | src/*.tsx) ;;
  *) exit 0 ;;
esac

[ -f "$file" ] || exit 0

./node_modules/.bin/oxlint --fix "$file" >/dev/null 2>&1
./node_modules/.bin/oxfmt "$file" >/dev/null 2>&1
exit 0
