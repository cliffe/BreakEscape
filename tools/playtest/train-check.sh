#!/usr/bin/env bash
# One command for the whole train check. "Green" means zero failures in every line of summary.txt.
#
#   tools/playtest/train-check.sh <worktree> <outdir> <port>
#   TESTS_LOCK=/path/to/tests.lock tools/playtest/train-check.sh ...   (serialise with other batches)
#
# Under the lock (if TESTS_LOCK is set) it records HEAD, starts a keyless server from the worktree
# on <port>, makes games for m01_first_contact, sis01_healthcare and sis02_energy, then runs:
#   1. the Rails suite                      (rails.txt)
#   2. MERGE_BATCH=1 bin/test-js -j 3       (js.txt; shell-x-check gets SHELL_X_PORT and the m01 game)
#   3. tools/playtest/train-smoke.mjs       (smoke.txt)
#   4. the scenario validator over every scenarios/*/scenario.json.erb (v_<scenario>.txt)
# and writes <outdir>/summary.txt. It kills only the server it started. It never touches ports 3000,
# 3085 or 3086 and runs no db: task.
# Env: PLAYWRIGHT_CHROMIUM_EXECUTABLE (default: the chrome-headless-shell in ~/.cache/ms-playwright),
#      TRAIN_CHECK_SKIP_RAILS=1 / _SKIP_JS=1 / _SKIP_CORPUS=1 for a partial run (summary says SKIPPED;
#      a partial run is not a green train).
set -uo pipefail

if [ "$#" -ne 3 ]; then echo "usage: $0 <worktree> <outdir> <port>" >&2; exit 2; fi
WT="$(cd "$1" && pwd)" || exit 2
mkdir -p "$2" || exit 2
OUT="$(cd "$2" && pwd)"
PORT="$3"
case "$PORT" in ''|*[!0-9]*) echo "port must be a number" >&2; exit 2;; esac
case "$PORT" in 3000|3085|3086) echo "port $PORT is reserved" >&2; exit 2;; esac
TOOLS="$WT/tools/playtest"

export PLAYWRIGHT_CHROMIUM_EXECUTABLE="${PLAYWRIGHT_CHROMIUM_EXECUTABLE:-/home/cliffe/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell}"

if [ -n "${TESTS_LOCK:-}" ]; then
  exec 9>"$TESTS_LOCK"
  flock 9
fi

cd "$WT" || exit 2
SUM="$OUT/summary.txt"
SERVER_PID=""
cleanup() {
  if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null
    for _ in 1 2 3 4 5 6 7 8 9 10; do kill -0 "$SERVER_PID" 2>/dev/null || break; sleep 1; done
    kill -9 "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT
trap 'exit 130' INT TERM

echo "HEAD $(git rev-parse HEAD)" > "$SUM"

# ---- keyless server on <port> ----
if curl -s -o /dev/null --max-time 2 "http://127.0.0.1:${PORT}/"; then
  echo "FAIL: something already answers on :${PORT}; pick a free port" | tee -a "$SUM" >&2
  exit 2
fi
rm -f "tmp/pids/server-${PORT}.pid"
mkdir -p tmp/pids
env -u GEMINI_API_KEY -u GOOGLE_API_KEY -u GOOGLE_GENERATIVE_AI_API_KEY RBENV_VERSION=2.7.8 BREAK_ESCAPE_STANDALONE=true \
  bundle exec rails server -b 127.0.0.1 -p "$PORT" -P "tmp/pids/server-${PORT}.pid" > "$OUT/server.log" 2>&1 &
SERVER_PID=$!
up=0
for _ in $(seq 1 120); do
  kill -0 "$SERVER_PID" 2>/dev/null || break
  if curl -s -o /dev/null --max-time 3 "http://127.0.0.1:${PORT}/"; then up=1; break; fi
  sleep 1
done
if [ "$up" -ne 1 ]; then echo "server FAILED to start on :${PORT} (see server.log)" | tee -a "$SUM" >&2; exit 1; fi
echo "server pid $SERVER_PID on :${PORT}" >> "$SUM"

# ---- games ----
declare -A GAME
FAILS=0
for m in m01_first_contact sis01_healthcare sis02_energy; do
  PLAYTEST_PORT="$PORT" RBENV_VERSION=2.7.8 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb "$m" > "$OUT/newgame_$m.txt" 2>&1
  GAME[$m]="$(sed -n 's/^GAME_ID=//p' "$OUT/newgame_$m.txt" | head -1)"
  if [ -z "${GAME[$m]}" ]; then echo "new-game FAILED for $m (see newgame_$m.txt)" >> "$SUM"; FAILS=$((FAILS+1)); fi
done
echo "games m01=${GAME[m01_first_contact]:-none} sis01=${GAME[sis01_healthcare]:-none} sis02=${GAME[sis02_energy]:-none}" >> "$SUM"

# ---- 1. Rails ----
if [ "${TRAIN_CHECK_SKIP_RAILS:-0}" = 1 ]; then
  echo "rails SKIPPED" >> "$SUM"
else
  RBENV_VERSION=2.7.8 bin/rails test > "$OUT/rails.txt" 2>&1; rc=$?
  echo "rails exit $rc: $(grep -E '^[0-9]+ runs, ' "$OUT/rails.txt" | tail -1)" >> "$SUM"
fi

# ---- 2. JS ----
if [ "${TRAIN_CHECK_SKIP_JS:-0}" = 1 ]; then
  echo "js SKIPPED" >> "$SUM"
else
  MERGE_BATCH=1 SHELL_X_PORT="$PORT" SHELL_X_GAME="${GAME[m01_first_contact]:-}" bin/test-js -j 3 > "$OUT/js.txt" 2>&1; rc=$?
  echo "js exit $rc: $(grep -E '^Files: ' "$OUT/js.txt" | tail -1)" >> "$SUM"
  grep -E '^Failed: ' "$OUT/js.txt" >> "$SUM" || true
fi

# ---- 3. smoke ----
SMOKE_ARGS=()
for m in m01_first_contact sis01_healthcare sis02_energy; do [ -n "${GAME[$m]:-}" ] && SMOKE_ARGS+=(--game "${GAME[$m]}"); done
if [ "${#SMOKE_ARGS[@]}" -gt 0 ]; then
  node "$TOOLS/train-smoke.mjs" --port "$PORT" "${SMOKE_ARGS[@]}" > "$OUT/smoke.txt" 2>&1; rc=$?
  echo "smoke exit $rc: $(grep -E '^TRAIN-SMOKE ' "$OUT/smoke.txt" | tail -1)" >> "$SUM"
  grep -E '^SMOKE .* FAIL' "$OUT/smoke.txt" >> "$SUM" || true
else
  echo "smoke FAILED: no games to boot" >> "$SUM"
fi

# ---- 4. validator corpus (three at a time) ----
if [ "${TRAIN_CHECK_SKIP_CORPUS:-0}" = 1 ]; then
  echo "corpus SKIPPED" >> "$SUM"
else
  rm -f "$OUT/corpus_fails.txt"
  ls scenarios/*/scenario.json.erb | xargs -P 3 -I{} bash -c '
    f="$1"; d=$(basename "$(dirname "$f")")
    LANG=C.UTF-8 /usr/bin/ruby3.2 scripts/validate_scenario.rb "$f" --no-graph > "'"$OUT"'/v_$d.txt" 2>&1 || echo "FAIL $f" >> "'"$OUT"'/corpus_fails.txt"
  ' _ {}
  cf=0; [ -f "$OUT/corpus_fails.txt" ] && cf=$(wc -l < "$OUT/corpus_fails.txt")
  echo "corpus fails $cf of $(ls scenarios/*/scenario.json.erb | wc -l)" >> "$SUM"
  [ -f "$OUT/corpus_fails.txt" ] && sort "$OUT/corpus_fails.txt" >> "$SUM"
  echo "validator ERROR lines: $(cat "$OUT"/v_*.txt | grep -cE '^ +ERROR ')" >> "$SUM"
fi

echo "HEAD after $(git rev-parse HEAD)" >> "$SUM"
echo "git status:" >> "$SUM"
git status --short | grep -v node_modules >> "$SUM" || true
echo DONE >> "$SUM"
cat "$SUM"
