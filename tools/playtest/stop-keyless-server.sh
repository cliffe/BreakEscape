#!/usr/bin/env bash
# Stop only a keyless server, using its own pid file: stop-keyless-server.sh [PORT] (default 3001).
# Never touches :3000.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PORT="${1:-3001}"
case "$PORT" in
  ""|*[!0-9]*) echo "FAIL: port must be a number, got '$PORT'" >&2; exit 2 ;;
esac
[ "${#PORT}" -le 6 ] || { echo "FAIL: port has too many digits" >&2; exit 2; }
PORT="$((10#$PORT))"   # 03000 is 3000 to Rails
if [ "$PORT" -eq 3000 ] || [ "$PORT" -lt 1024 ] || [ "$PORT" -gt 65535 ]; then
  echo "FAIL: pick a port from 1024 to 65535 other than 3000 (:3000 is the user's server)" >&2; exit 2
fi
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
