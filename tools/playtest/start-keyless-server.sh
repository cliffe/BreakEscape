#!/usr/bin/env bash
# Start the keyless Break Escape server (no GEMINI_API_KEY, so no TTS requests are
# generated or billed). Usage: start-keyless-server.sh [PORT]   (default $PLAYTEST_PORT, else 3001; never 3000).
# Idempotent: exits 0 if the port is already up.
# Agents may start and stop this server. Never touch the :3000 server.
#
# Note: ./start_server.sh runs `pkill -9 -f puma`, which kills this server too.
# Re-run this script afterwards.
set -euo pipefail

PORT="${1:-${PLAYTEST_PORT:-3001}}"
case "$PORT" in
  ""|*[!0-9]*) echo "FAIL: port must be a number, got '$PORT'" >&2; exit 2 ;;
esac
[ "${#PORT}" -le 6 ] || { echo "FAIL: port has too many digits" >&2; exit 2; }
PORT="$((10#$PORT))"   # 03000 is 3000 to Rails
if [ "$PORT" -eq 3000 ] || [ "$PORT" -lt 1024 ] || [ "$PORT" -gt 65535 ]; then
  echo "FAIL: pick a port from 1024 to 65535 other than 3000 (:3000 is the user's server)" >&2; exit 2
fi
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
# A fresh worktree has no .bundle/config, so bundler would look for gems in the worktree's own
# vendor/bundle and the server would not start. Default to the main checkout's gems.
if [ -z "${BUNDLE_PATH:-}" ] && [ ! -f "$ROOT/.bundle/config" ]; then
  COMMON="$(git -C "$ROOT" rev-parse --path-format=absolute --git-common-dir 2>/dev/null || true)"
  [ -n "$COMMON" ] && [ -d "$(dirname "$COMMON")/vendor/bundle" ] && export BUNDLE_PATH="$(dirname "$COMMON")/vendor/bundle"
fi
[ -z "${RBENV_VERSION:-}" ] && [ -f "$ROOT/.ruby-version" ] && export RBENV_VERSION="$(cat "$ROOT/.ruby-version")"
LOG="$ROOT/tmp/keyless-${PORT}.log"
PIDFILE="tmp/pids/server-${PORT}.pid"   # relative to the dummy app, as rails resolves it

# Check with curl as well as ss: some containers have no ss, and without this
# check the script would truncate the running server's log and then fail.
if ss -ltn 2>/dev/null | grep -qE "[:.]${PORT}\s" \
   || curl -s -o /dev/null --max-time 2 "http://127.0.0.1:${PORT}/"; then
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
