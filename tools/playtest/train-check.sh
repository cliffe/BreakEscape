#!/usr/bin/env bash
# One command for the whole train check. The last line of summary.txt is the verdict:
#   GREEN                       every step ran and nothing failed, and the tree is clean   (exit 0)
#   RED: <reasons>              something failed                                          (exit 1)
#   PARTIAL: <skipped steps>    nothing failed but a step was skipped; not green          (exit 3)
# Setup errors (bad arguments, a busy port) exit 2. Scripts can use `train-check.sh ... && merge`.
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
# Env: PLAYWRIGHT_CHROMIUM_EXECUTABLE (default: the chrome-headless-shell in $HOME/.cache/ms-playwright),
#      RUBY (the ruby for the validator corpus; default /usr/bin/ruby3.2 if present, else ruby on PATH),
#      TESTS_LOCK (strongly advised: without it two trains can share the test database; a warning is
#      written to summary.txt and stderr when it is unset),
#      TRAIN_CHECK_SKIP_RAILS=1 / _SKIP_JS=1 / _SKIP_CORPUS=1 for a partial run (summary says SKIPPED;
#      a partial run exits 3 and is not a green train).
# Green also needs a clean tree afterwards (nothing in git status but node_modules and .bundle): the
# validator compiles ink in the worktree and renames the JSON into place, so a stale compiled file on
# the branch shows up there instead of failing a test. Stray *.tmp-* files are listed in the summary.
set -uo pipefail

if [ "$#" -ne 3 ]; then echo "usage: $0 <worktree> <outdir> <port>" >&2; exit 2; fi
WT="$(cd "$1" && pwd)" || exit 2
mkdir -p "$2" || exit 2
OUT="$(cd "$2" && pwd)"
PORT="$3"
case "$PORT" in ''|*[!0-9]*) echo "port must be a number" >&2; exit 2;; esac
case "$PORT" in 3000|3085|3086) echo "port $PORT is reserved" >&2; exit 2;; esac
TOOLS="$WT/tools/playtest"

export PLAYWRIGHT_CHROMIUM_EXECUTABLE="${PLAYWRIGHT_CHROMIUM_EXECUTABLE:-$HOME/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell}"
if [ -n "${RUBY:-}" ]; then TC_RUBY="$RUBY"; elif [ -x /usr/bin/ruby3.2 ]; then TC_RUBY=/usr/bin/ruby3.2; else TC_RUBY=ruby; fi
export TC_RUBY

if [ -n "${TESTS_LOCK:-}" ]; then
  exec 9>"$TESTS_LOCK"
  flock 9
else
  echo "WARNING: TESTS_LOCK is not set; another train check or test batch may share the test database" >&2
  NOLOCK_WARN=1
fi

cd "$WT" || exit 2
SUM="$OUT/summary.txt"
SERVER_PID=""
RED=()
SKIPPED=()
cleanup() {
  if [ -n "$SERVER_PID" ] && kill -0 "$SERVER_PID" 2>/dev/null; then
    kill "$SERVER_PID" 2>/dev/null
    for _ in 1 2 3 4 5 6 7 8 9 10; do kill -0 "$SERVER_PID" 2>/dev/null || break; sleep 1; done
    kill -9 "$SERVER_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT
trap 'exit 130' INT TERM

HEAD0="$(git rev-parse HEAD)"
echo "HEAD $HEAD0" > "$SUM"
[ "${NOLOCK_WARN:-0}" = 1 ] && echo "WARNING: TESTS_LOCK not set, test database not serialised" >> "$SUM"

# ---- keyless server on <port> ----
if curl -s -o /dev/null --max-time 2 "http://127.0.0.1:${PORT}/"; then
  echo "SETUP: something already answers on :${PORT}; pick a free port" | tee -a "$SUM" >&2
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
if [ "$up" -ne 1 ]; then echo "server FAILED to start on :${PORT} (see server.log)" | tee -a "$SUM" >&2; echo "RED: server did not start" >> "$SUM"; exit 1; fi
echo "server pid $SERVER_PID on :${PORT}" >> "$SUM"

# ---- games ----
declare -A GAME
for m in m01_first_contact sis01_healthcare sis02_energy; do
  PLAYTEST_PORT="$PORT" RBENV_VERSION=2.7.8 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb "$m" > "$OUT/newgame_$m.txt" 2>&1
  GAME[$m]="$(sed -n 's/^GAME_ID=//p' "$OUT/newgame_$m.txt" | head -1)"
  if [ -z "${GAME[$m]}" ]; then echo "new-game FAILED for $m (see newgame_$m.txt)" >> "$SUM"; RED+=("new-game $m"); fi
done
echo "games m01=${GAME[m01_first_contact]:-none} sis01=${GAME[sis01_healthcare]:-none} sis02=${GAME[sis02_energy]:-none}" >> "$SUM"

# ---- 1. Rails ----
if [ "${TRAIN_CHECK_SKIP_RAILS:-0}" = 1 ]; then
  echo "rails SKIPPED" >> "$SUM"; SKIPPED+=(rails)
else
  RBENV_VERSION=2.7.8 bin/rails test > "$OUT/rails.txt" 2>&1; rc=$?
  echo "rails exit $rc: $(grep -E '^[0-9]+ runs, ' "$OUT/rails.txt" | tail -1)" >> "$SUM"
  [ "$rc" -ne 0 ] && RED+=("rails exit $rc")
fi

# ---- 2. JS ----
if [ "${TRAIN_CHECK_SKIP_JS:-0}" = 1 ]; then
  echo "js SKIPPED" >> "$SUM"; SKIPPED+=(js)
else
  MERGE_BATCH=1 SHELL_X_PORT="$PORT" SHELL_X_GAME="${GAME[m01_first_contact]:-}" bin/test-js -j 3 > "$OUT/js.txt" 2>&1; rc=$?
  echo "js exit $rc: $(grep -E '^Files: ' "$OUT/js.txt" | tail -1)" >> "$SUM"
  grep -E '^Failed: ' "$OUT/js.txt" >> "$SUM" || true
  [ "$rc" -ne 0 ] && RED+=("js exit $rc")
fi

# ---- 3. smoke ----
SMOKE_ARGS=()
for m in m01_first_contact sis01_healthcare sis02_energy; do [ -n "${GAME[$m]:-}" ] && SMOKE_ARGS+=(--game "${GAME[$m]}"); done
if [ "${#SMOKE_ARGS[@]}" -gt 0 ]; then
  node "$TOOLS/train-smoke.mjs" --port "$PORT" "${SMOKE_ARGS[@]}" > "$OUT/smoke.txt" 2>&1; rc=$?
  echo "smoke exit $rc: $(grep -E '^TRAIN-SMOKE ' "$OUT/smoke.txt" | tail -1)" >> "$SUM"
  grep -E '^SMOKE .* FAIL' "$OUT/smoke.txt" >> "$SUM" || true
  [ "$rc" -ne 0 ] && RED+=("smoke exit $rc")
else
  echo "smoke FAILED: no games to boot" >> "$SUM"; RED+=("smoke: no games")
fi

# ---- 4. validator corpus (three at a time) ----
if [ "${TRAIN_CHECK_SKIP_CORPUS:-0}" = 1 ]; then
  echo "corpus SKIPPED" >> "$SUM"; SKIPPED+=(corpus)
else
  rm -f "$OUT/corpus_fails.txt"
  # $OUT travels as $2, never spliced into the command string.
  ls scenarios/*/scenario.json.erb | xargs -P 3 -I{} bash -c '
    f="$1"; out="$2"; d=$(basename "$(dirname "$f")")
    LANG=C.UTF-8 "$TC_RUBY" scripts/validate_scenario.rb "$f" --no-graph > "$out/v_$d.txt" 2>&1 || echo "FAIL $f" >> "$out/corpus_fails.txt"
  ' _ {} "$OUT"
  cf=0; [ -f "$OUT/corpus_fails.txt" ] && cf=$(wc -l < "$OUT/corpus_fails.txt")
  echo "corpus fails $cf of $(ls scenarios/*/scenario.json.erb | wc -l)" >> "$SUM"
  [ -f "$OUT/corpus_fails.txt" ] && sort "$OUT/corpus_fails.txt" >> "$SUM"
  [ "$cf" -ne 0 ] && RED+=("corpus fails $cf")
  # Dialogue-lint ERROR lines (word caps and house rules) all count against green.
  dl=$(cat "$OUT"/v_*.txt | grep -cE '^ +ERROR ')
  echo "dialogue-lint ERROR lines: $dl" >> "$SUM"
  [ "$dl" -ne 0 ] && RED+=("dialogue-lint ERROR lines $dl")
  # Validator ERROR lines: the ones tagged "(known: ...)" are reported, only unknown ones count.
  ke=$(cat "$OUT"/v_*.txt | grep '❌ ERROR' | grep -c '(known:')
  ue=$(cat "$OUT"/v_*.txt | grep '❌ ERROR' | grep -vc '(known:')
  echo "validator ERROR lines: known $ke, unknown $ue" >> "$SUM"
  [ "$ue" -ne 0 ] && RED+=("unknown validator ERROR lines $ue")
fi

HEAD1="$(git rev-parse HEAD)"
echo "HEAD after $HEAD1" >> "$SUM"
[ "$HEAD1" != "$HEAD0" ] && RED+=("HEAD moved during the run")
echo "git status:" >> "$SUM"
DIRTY="$(git status --short | grep -vE '^\?\? (node_modules|\.bundle)/?$')"
[ -n "$DIRTY" ] && echo "$DIRTY" >> "$SUM"
[ -n "$DIRTY" ] && RED+=("git status not clean")
STRAY="$(find scenarios -name '*.tmp-*' 2>/dev/null)"
if [ -n "$STRAY" ]; then
  echo "stray temp files (a validator or test was killed mid-compile):" >> "$SUM"; echo "$STRAY" >> "$SUM"
  RED+=("stray *.tmp-* files")
fi
echo DONE >> "$SUM"
if [ "${#RED[@]}" -gt 0 ]; then
  RC=1; VERDICT="RED: $(IFS=';'; echo "${RED[*]}" | sed 's/;/; /g')"
elif [ "${#SKIPPED[@]}" -gt 0 ]; then
  RC=3; VERDICT="PARTIAL: skipped ${SKIPPED[*]}"
else
  RC=0; VERDICT="GREEN"
fi
echo "$VERDICT" >> "$SUM"
cat "$SUM"
exit "$RC"
