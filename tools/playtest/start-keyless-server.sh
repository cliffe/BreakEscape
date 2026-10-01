#!/usr/bin/env bash
# Start the keyless Break Escape server on :3001 (no GEMINI_API_KEY, so no TTS
# requests are generated or billed). Idempotent: exits 0 if :3001 is already up.
# Agents may start and stop this server. Never touch the :3000 server.
#
# Note: ./start_server.sh runs `pkill -9 -f puma`, which kills this server too.
# Re-run this script afterwards.
set -euo pipefail

PORT=3001
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG="$ROOT/tmp/keyless-3001.log"
PIDFILE="tmp/pids/server-${PORT}.pid"   # relative to the dummy app, as rails resolves it

if ss -ltn 2>/dev/null | grep -qE "[:.]${PORT}\s"; then
  echo "Already listening on :${PORT} - nothing to do."
  exit 0
fi

cd "$ROOT"
mkdir -p tmp
: > "$LOG"
env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true \
  nohup bundle exec rails server -b 127.0.0.1 -p "$PORT" -P "$PIDFILE" > "$LOG" 2>&1 &

for _ in $(seq 1 60); do
  if curl -s -o /dev/null "http://127.0.0.1:${PORT}/"; then
    if grep -q "GEMINI_API_KEY environment variable is not set" "$LOG"; then
      echo "Keyless server up on :${PORT} (TTS disabled). Log: $LOG"
      exit 0
    fi
    echo "FAIL: server answers on :${PORT} but the boot log has no GEMINI warning; it may have a key. See $LOG" >&2
    exit 1
  fi
  sleep 1
done
echo "FAIL: nothing answered on :${PORT} within 60 s. See $LOG" >&2
exit 1
