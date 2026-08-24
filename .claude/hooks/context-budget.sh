#!/bin/bash
# PostToolUse: watch how full the context window is and land the plane before it fills.
#
# An autonomous run has no human to notice that the session is about to compact, so this
# reads the token usage the CLI already records in the transcript and, past a threshold,
# hands the agent an instruction to stop implementing, commit, and write a handoff.
#
#   under 80%  silent
#   80-89%     one visible warning line, the turn continues
#   90%+       exit 2: the agent is told to stop, commit and summarise. Fires once.
#
# Overrides: CONTEXT_WINDOW (default 200000), CONTEXT_WARN_PCT, CONTEXT_STOP_PCT.
set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}" || exit 0

WINDOW=${CONTEXT_WINDOW:-200000}
WARN_PCT=${CONTEXT_WARN_PCT:-80}
STOP_PCT=${CONTEXT_STOP_PCT:-90}

input=$(cat)
transcript=$(jq -r '.transcript_path // empty' <<<"$input")
[ -n "$transcript" ] && [ -f "$transcript" ] || exit 0

# Context in use is what the last assistant message actually sent: fresh input, both cache
# buckets, and its own output. Only the tail of the transcript is read — these files reach
# hundreds of MB in a long session.
used=$(
  tail -n 400 "$transcript" 2>/dev/null |
    jq -s -r '[.[] | select(.message.usage)] | last
              | if . == null then 0
                else (.message.usage
                      | (.input_tokens // 0)
                        + (.cache_read_input_tokens // 0)
                        + (.cache_creation_input_tokens // 0)
                        + (.output_tokens // 0))
                end' 2>/dev/null
)
[ -n "$used" ] && [ "$used" -gt 0 ] 2>/dev/null || exit 0

pct=$((used * 100 / WINDOW))

if [ "$pct" -lt "$WARN_PCT" ]; then
  exit 0
fi

# One shot per session: past the threshold every later tool call would re-block the turn.
sentinel=".git/agent-context-budget-$(jq -r '.session_id // "unknown"' <<<"$input")"

if [ "$pct" -lt "$STOP_PCT" ]; then
  echo "context ${pct}% (${used}/${WINDOW} tokens) — wrap up soon"
  exit 0
fi

[ -f "$sentinel" ] && exit 0
touch "$sentinel"

cat >&2 <<EOF
Context is at ${pct}% (${used}/${WINDOW} tokens). Stop implementing now — do not start
another task, another file, or another fix.

Land what you have, in this order:

1. Leave the tree buildable: revert or finish any half-applied edit.
2. Commit what works, in coherent commits, following the repo's commit convention. Do not
   commit a broken state; if something cannot compile, back it out and say so.
3. Write, as your final message, a handoff that says: what is done and committed, what is
   half-done and where, what is not started, and the exact next step someone would take.

The handoff is the deliverable of this turn. Nothing else.
EOF
exit 2
