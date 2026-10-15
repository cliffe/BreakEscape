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

# Is the harness process still alive? A dead one leaves the FIFO behind, and writing
# to a FIFO nobody reads blocks forever, so only talk to a live session.
ALIVE=0
if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then ALIVE=1; fi

if [ "$ALIVE" = 1 ] && [ -p "$DIR/in" ]; then
  # cmd.sh waits ~60s for a reply; bound the whole exchange too.
  timeout 20 tools/playtest/cmd.sh "$TAG" '{"cmd":"sync"}' || true
  timeout 20 tools/playtest/cmd.sh "$TAG" '{"cmd":"quit"}' || true
elif [ -e "$DIR" ] || [ -f "$PIDFILE" ]; then
  echo "session $TAG: harness process is gone, skipping sync (cleaning stale files)"
fi

for f in "$DIR/holder.pid" "$PIDFILE"; do
  [ -f "$f" ] && kill "$(cat "$f")" 2>/dev/null
done
[ "$ALIVE" = 1 ] && sleep 1
rm -rf "$DIR" "$PIDFILE"

# Put back the demo user's sprite if new-game.rb switched it for this game.
if [ -f "tools/playtest/sprite-restore-$TAG.txt" ]; then
  BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/restore-sprite.rb "$TAG" 2>&1 | tail -1
fi
echo "session $TAG stopped"
