#!/usr/bin/env bash
# Stop only the keyless :3001 server, using its own pid file. Never touches :3000.
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PIDFILE="$ROOT/test/dummy/tmp/pids/server-3001.pid"
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
