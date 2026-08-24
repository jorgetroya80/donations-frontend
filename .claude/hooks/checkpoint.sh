#!/bin/bash
# PreCompact: the window filled anyway and the session is about to be summarised. The agent
# gets no turn in between, so commit whatever is in the tree — a compaction that loses
# uncommitted work is the one failure mode with no recovery.
#
# The commit is deliberately blunt (`git add -A`, generic message): it is a safety net, not
# history. Rebase or amend it afterwards.
set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}" || exit 0

branch=$(git rev-parse --abbrev-ref HEAD 2>/dev/null) || exit 0

# Never on main: the pre-push hook blocks it anyway, and a stray checkpoint there is worse
# than losing the diff.
if [ "$branch" = "main" ] || [ "$branch" = "HEAD" ]; then
  echo "checkpoint skipped: on $branch"
  exit 0
fi

if [ -z "$(git status --porcelain)" ]; then
  echo "checkpoint skipped: nothing to commit"
  exit 0
fi

git add -A
if git -c core.hooksPath=/dev/null commit -q -m "chore(agent): checkpoint before context compaction" \
  -m "Automatic commit from the PreCompact hook. Not reviewed, may not build."; then
  echo "checkpoint committed on $branch: $(git rev-parse --short HEAD)"
else
  echo "checkpoint failed — the working tree is still dirty, do not lose it" >&2
fi

exit 0
