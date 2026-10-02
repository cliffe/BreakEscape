#!/bin/bash
# Start a playtest session in the background and expose it as a FIFO pair, so a
# single long-lived browser can be driven one command per tool call.
#
#   tools/playtest/session-start.sh --url <URL> [--flags <XML>] [--speed human] ...
#
# Every argument is passed straight through to playtest-session.js. The session
# is keyed by the game id in the URL (falling back to the PID), giving each run
# its own pipe directory so two sessions never cross wires.
#
# Prints the session tag; drive it with cmd.sh:
#
#   tools/playtest/session-start.sh --url http://127.0.0.1:3001/break_escape/games/1047 ...
#   tools/playtest/cmd.sh 1047 '{"cmd":"brief"}'
#   tools/playtest/cmd.sh 1047 '{"cmd":"sync"}'
#   tools/playtest/cmd.sh 1047 '{"cmd":"quit"}'
#
# Everything it writes (pipes-<tag>/, <tag>.pid) is gitignored scratch. The
# session log named by --log is the evidence and is kept.
set -euo pipefail
cd "$(dirname "$0")/../.."

HARNESS=.claude/skills/playtest-scenario/scripts/playtest-session.js
[ -f "$HARNESS" ] || { echo "harness not found: $HARNESS" >&2; exit 1; }

# Tag from the game id in --url, so the pipes match the run that owns them.
TAG=
prev=
for a in "$@"; do
  case "$prev" in --url) TAG=$(printf '%s' "$a" | grep -oE '[0-9]+/?$' | tr -d /);; esac
  case "$a" in --url=*) TAG=$(printf '%s' "${a#--url=}" | grep -oE '[0-9]+/?$' | tr -d /);; esac
  prev=$a
done
TAG=${TAG:-$$}

DIR=tools/playtest/pipes-$TAG
PIDFILE=tools/playtest/$TAG.pid

if [ -f "$PIDFILE" ] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
  echo "session $TAG already running (pid $(cat "$PIDFILE")); quit it first" >&2
  exit 1
fi

rm -rf "$DIR"; mkdir -p "$DIR"
mkfifo "$DIR/in"
: > "$DIR/out"; : > "$DIR/err"

# The `sleep infinity` holds the write end open, so the harness does not see
# EOF between commands and the browser stays up for the whole playtest.
#
# Every descriptor of both children is redirected away from ours. A background
# child that inherits this script's stdout or stderr keeps the caller's pipe
# open, so `session-start.sh | tail` would hang forever after we exit.
( sleep infinity > "$DIR/in" 2>/dev/null < /dev/null & echo $! > "$DIR/holder.pid" )
node "$HARNESS" "$@" < "$DIR/in" > "$DIR/out" 2> "$DIR/err" &
echo $! > "$PIDFILE"
disown -a 2>/dev/null || true

# The harness emits one session-open line when the browser is ready.
for _ in $(seq 1 300); do
  if [ -s "$DIR/out" ]; then
    head -1 "$DIR/out"
    echo "SESSION=$TAG"
    exit 0
  fi
  if ! kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
    echo "harness exited during startup:" >&2; cat "$DIR/err" >&2; exit 1
  fi
  sleep 0.2
done
echo "TIMEOUT waiting for session-open; see $DIR/err" >&2
exit 1
