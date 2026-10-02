#!/bin/bash
# Close a playtest session started by session-start.sh and clear its scratch.
#
#   tools/playtest/session-stop.sh <session>
#
# Sends {"cmd":"sync"} then {"cmd":"quit"} so globals and notes are persisted
# before the browser closes — without the sync they are lost to a 30s flush
# timer and the run looks less far along than it was.
set -uo pipefail
cd "$(dirname "$0")/../.."

TAG=${1:?usage: session-stop.sh <session>}
DIR=tools/playtest/pipes-$TAG
PIDFILE=tools/playtest/$TAG.pid

if [ -p "$DIR/in" ]; then
  tools/playtest/cmd.sh "$TAG" '{"cmd":"sync"}' || true
  tools/playtest/cmd.sh "$TAG" '{"cmd":"quit"}' || true
fi

for f in "$DIR/holder.pid" "$PIDFILE"; do
  [ -f "$f" ] && kill "$(cat "$f")" 2>/dev/null
done
sleep 1
rm -rf "$DIR" "$PIDFILE"
echo "session $TAG stopped"
