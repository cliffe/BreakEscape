#!/usr/bin/env bash
# Stop only a keyless server, using its own pid file: stop-keyless-server.sh [PORT] (default 3001).
# Never touches :3000.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PORT="${1:-3001}"
case "$PORT" in
  ''|*[!0-9]*|3000) echo "FAIL: give a numeric port other than 3000" >&2; exit 2 ;;
esac
PIDFILE="$ROOT/test/dummy/tmp/pids/server-${PORT}.pid"
if [ ! -f "$PIDFILE" ]; then
  echo "No pid file at $PIDFILE - nothing to stop."
  exit 0
fi
PID="$(cat "$PIDFILE")"
if kill -0 "$PID" 2>/dev/null; then
  kill "$PID"
  echo "Sent TERM to keyless server pid $PID."
else
  echo "Pid $PID not running; removing stale pid file."
  rm -f "$PIDFILE"
fi
