#!/bin/bash
# Send one JSON command to a running playtest session and print its reply.
#
#   tools/playtest/cmd.sh <session> '{"cmd":"brief"}'
#
# <session> is the tag printed by session-start.sh (normally the game id). The
# reply may span several lines; everything the harness wrote for this command
# is printed. TIMEOUT means the harness did not answer within ~60s — check
# tools/playtest/pipes-<session>/err before retrying the same command.
set -uo pipefail
cd "$(dirname "$0")/../.."

TAG=${1:?usage: cmd.sh <session> '<json>'}
JSON=${2:?usage: cmd.sh <session> '<json>'}
DIR=tools/playtest/pipes-$TAG
[ -p "$DIR/in" ] || { echo "no session $TAG (expected $DIR/in)" >&2; exit 1; }

BEFORE=$(wc -l < "$DIR/out" 2>/dev/null || echo 0)
echo "$JSON" > "$DIR/in"
for _ in $(seq 1 300); do
  AFTER=$(wc -l < "$DIR/out" 2>/dev/null || echo 0)
  if [ "$AFTER" -gt "$BEFORE" ]; then
    tail -n +$((BEFORE+1)) "$DIR/out"
    exit 0
  fi
  sleep 0.2
done
echo "TIMEOUT"
exit 1
