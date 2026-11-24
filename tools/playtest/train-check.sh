#!/usr/bin/env bash
# One command for the whole train check. The last line of summary.txt is the verdict:
#   GREEN                       every step ran and nothing failed, and the tree is clean   (exit 0)
#   RED: <reasons>              something failed                                          (exit 1)
#   PARTIAL: <skipped steps>    nothing failed but a step was skipped; not green          (exit 3)
# Setup errors (bad arguments, a busy port) exit 2. Scripts can use `train-check.sh ... && merge`.
#
#   tools/playtest/train-check.sh <worktree> <outdir> <port>
#   TESTS_LOCK=/path/to/tests.lock tools/playtest/train-check.sh ...   (serialise with other batches;
#   the default is the shared lock <main checkout>/tmp/tests.lock, which every session uses; the main
#   checkout is the parent of `git rev-parse --git-common-dir`, which works on old and new git)
#   TRAIN_CHECK_PRINT_LOCK=1 tools/playtest/train-check.sh ...   (dry mode: checks the arguments, prints
#   TESTS_LOCK=<path or none> and BUNDLE_PATH=<value or (unset)>, exits 0; no lock, server or test)
#
# Under the lock it records HEAD, starts a keyless server from the worktree
# on <port>, makes games for m01_first_contact, sis01_healthcare and sis02_energy, then runs:
#   0. tools/playtest/shell-x-check.mjs on the m01 game, once, in the background beside step 1 (shellx.txt),
#      only when the train changes a UI path (SHELLX_PATHS below, compared with main...HEAD); otherwise
#      the summary says "shell-x not needed". SHELL_X=always or SHELL_X=never overrides.
#   0b. bin/rubocop (the CI lint job), in the background beside step 1; any offence is RED (rubocop.txt)
#   1. the Rails suite                      (rails.txt)
#   1b. RUN_OPENED_SCAN=1 test/models/break_escape/payload_scan_opened_state_test.rb, after step 1 and
#      in the background beside steps 2 and 3 (the only other test-database user is step 1); a
#      missing file is RED, so a rename cannot switch the scan off (opened_scan.txt)
#   2. MERGE_BATCH=1 SHELL_X_SEPARATE=1 bin/test-js -j $TRAIN_CHECK_JS_JOBS (default 8)   (js.txt)
#   3. tools/playtest/train-smoke.mjs       (smoke.txt)
#   4. the scenario validator over every scenarios/*/scenario.json.erb (v_<scenario>.txt)
#   4b. tools/check_mapping_index_drift.rb main: eventMappings inserted or removed before existing ones
#      (shifts once-only keys) is RED; skipped with the corpus (mapdrift.txt; MAPDRIFT_BASE overrides main)
#   4c. tools/run-ink-routes.sh: every scripts/ink_runtime_check/m*_routes/*.json with its route.js;
#      any failing route is RED; skipped with the corpus (ink_routes.txt)
# and writes <outdir>/summary.txt. It kills only the server it started. It never touches ports 3000,
# 3085 or 3086 and runs no db: task.
# Env: PLAYWRIGHT_CHROMIUM_EXECUTABLE (default: the chrome-headless-shell in $HOME/.cache/ms-playwright),
#      RUBY (the ruby for the validator corpus; default /usr/bin/ruby3.2 if present, else ruby on PATH),
#      BUNDLE_PATH (default: <main checkout>/vendor/bundle when the worktree has no .bundle/config),
#      TESTS_LOCK (default: <main checkout>/tmp/tests.lock, shared by every session and worktree; if the
#      main checkout cannot be worked out the script exits 2 and asks for TESTS_LOCK;
#      TESTS_LOCK=none runs unlocked, with a warning in summary.txt and on stderr),
#      TRAIN_CHECK_JS_JOBS (JS files run at once; default 8, lower it on a loaded machine),
#      TRAIN_CHECK_SKIP_RAILS=1 / _SKIP_JS=1 / _SKIP_CORPUS=1 for a partial run (summary says SKIPPED;
#      a partial run exits 3 and is not a green train).
# Green also needs a clean tree afterwards (nothing in git status but node_modules and .bundle): the
# validator compiles ink in the worktree and renames the JSON into place, so a stale compiled file on
# the branch shows up there instead of failing a test. Stray *.tmp-* files are listed in the summary.
set -uo pipefail

if [ "$#" -ne 3 ]; then echo "usage: $0 <worktree> <outdir> <port>" >&2; exit 2; fi
WT="$(cd "$1" && pwd)" || exit 2
# The main checkout: the parent of git's common dir. Old git answers a relative ".git" in the main
# checkout and an absolute path in a worktree; new git may answer either. Fails closed.
main_checkout() {
  local common abs
  common="$(git -C "$WT" rev-parse --git-common-dir 2>/dev/null)" || common=""
  case "$common" in
    "") ;;
    /*) ;;
    *) common="$WT/$common" ;;
  esac
  abs=""
  if [ -n "$common" ]; then abs="$(cd "$common" 2>/dev/null && pwd)" || abs=""; fi
  if [ -z "$abs" ] || [ ! -d "$abs" ]; then
    echo "cannot work out the main checkout from $WT: set TESTS_LOCK" >&2
    exit 2
  fi
  dirname "$abs"
}
# A fresh worktree has no .bundle/config, so bundler would look for gems in the worktree's own
# vendor/bundle and the server would fail to start. Default to the main checkout's gems.
if [ -z "${BUNDLE_PATH:-}" ] && [ ! -f "$WT/.bundle/config" ]; then
  MAIN="$(main_checkout)" || exit 2
  export BUNDLE_PATH="$MAIN/vendor/bundle"
fi
mkdir -p "$2" || exit 2
OUT="$(cd "$2" && pwd)"
PORT="$3"
case "$PORT" in ''|*[!0-9]*) echo "port must be a number" >&2; exit 2;; esac
case "$PORT" in 3000|3085|3086) echo "port $PORT is reserved" >&2; exit 2;; esac
TOOLS="$WT/tools/playtest"

export PLAYWRIGHT_CHROMIUM_EXECUTABLE="${PLAYWRIGHT_CHROMIUM_EXECUTABLE:-$HOME/.cache/ms-playwright/chromium_headless_shell-1248/chrome-headless-shell-linux64/chrome-headless-shell}"
if [ -n "${RUBY:-}" ]; then TC_RUBY="$RUBY"; elif [ -x /usr/bin/ruby3.2 ]; then TC_RUBY=/usr/bin/ruby3.2; else TC_RUBY=ruby; fi
export TC_RUBY

if [ -z "${TESTS_LOCK:-}" ]; then
  MAIN="$(main_checkout)" || exit 2
  TESTS_LOCK="$MAIN/tmp/tests.lock"
  [ "${TRAIN_CHECK_PRINT_LOCK:-0}" = 1 ] || mkdir -p "$(dirname "$TESTS_LOCK")"
fi
if [ "${TRAIN_CHECK_PRINT_LOCK:-0}" = 1 ]; then
  echo "TESTS_LOCK=$TESTS_LOCK"
  echo "BUNDLE_PATH=${BUNDLE_PATH:-(unset)}"
  exit 0
fi
if [ "$TESTS_LOCK" != none ]; then
  exec 9>"$TESTS_LOCK"
  flock 9
else
  echo "WARNING: TESTS_LOCK=none; another train check or test batch may share the test database" >&2
  NOLOCK_WARN=1
fi

cd "$WT" || exit 2
SUM="$OUT/summary.txt"
SERVER_PID=""
RED=()
SKIPPED=()
cleanup() {
  if [ -n "${SHELLX_PID:-}" ] && kill -0 "$SHELLX_PID" 2>/dev/null; then kill "$SHELLX_PID" 2>/dev/null || true; fi
  if [ -n "${RUBOCOP_PID:-}" ] && kill -0 "$RUBOCOP_PID" 2>/dev/null; then kill "$RUBOCOP_PID" 2>/dev/null || true; fi
  if [ -n "${OPENED_PID:-}" ] && kill -0 "$OPENED_PID" 2>/dev/null; then kill "$OPENED_PID" 2>/dev/null || true; fi
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
[ "${NOLOCK_WARN:-0}" = 1 ] && echo "WARNING: TESTS_LOCK=none, test database not serialised" >> "$SUM"

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

# ---- 0. shell X check, once, beside the Rails suite ----
SHELLX_PID=""
# Shell X guards the minigame shell's close X, so it runs only when the train touches the shell's files.
SHELLX_PATHS='^(public/break_escape/(css|js/minigames|js/ui|assets/ui)/|app/views/|tools/playtest/shell-x-check\.mjs$|test/js/shell-x-check\.test\.mjs$)'
SHELLX_NEEDED=1
case "${SHELL_X:-auto}" in
  always) SHELLX_WHY="SHELL_X=always" ;;
  never) SHELLX_NEEDED=0; SHELLX_WHY="SHELL_X=never" ;;
  *)
    SHELLX_HITS="$(git diff --name-only main...HEAD 2>/dev/null | grep -cE "$SHELLX_PATHS")"
    if [ "${SHELLX_HITS:-0}" -gt 0 ]; then SHELLX_WHY="$SHELLX_HITS UI file(s) changed against main"
    else SHELLX_NEEDED=0; SHELLX_WHY="no UI file changed against main"; fi ;;
esac
if [ "$SHELLX_NEEDED" = 1 ] && [ "${TRAIN_CHECK_SKIP_JS:-0}" != 1 ] && [ -n "${GAME[m01_first_contact]:-}" ]; then
  node "$TOOLS/shell-x-check.mjs" --port "$PORT" --game "${GAME[m01_first_contact]}" > "$OUT/shellx.txt" 2>&1 &
  SHELLX_PID=$!
fi

# ---- 0b. rubocop (the CI lint job), beside the Rails suite ----
RBENV_VERSION=2.7.8 bin/rubocop --format simple > "$OUT/rubocop.txt" 2>&1 &
RUBOCOP_PID=$!

# ---- 1. Rails ----
if [ "${TRAIN_CHECK_SKIP_RAILS:-0}" = 1 ]; then
  echo "rails SKIPPED" >> "$SUM"; SKIPPED+=(rails)
else
  RBENV_VERSION=2.7.8 bin/rails test > "$OUT/rails.txt" 2>&1; rc=$?
  echo "rails exit $rc: $(grep -E '^[0-9]+ runs, ' "$OUT/rails.txt" | tail -1)" >> "$SUM"
  [ "$rc" -ne 0 ] && RED+=("rails exit $rc")
fi

# ---- 1b. opened-state payload scan, in the background beside steps 2 and 3 ----
OPENED_PID=""
OPENED_TEST=test/models/break_escape/payload_scan_opened_state_test.rb
if [ "${TRAIN_CHECK_SKIP_RAILS:-0}" != 1 ] && [ -f "$OPENED_TEST" ]; then
  RUN_OPENED_SCAN=1 RBENV_VERSION=2.7.8 bin/rails test "$OPENED_TEST" > "$OUT/opened_scan.txt" 2>&1 &
  OPENED_PID=$!
fi

# ---- 2. JS ----
if [ "${TRAIN_CHECK_SKIP_JS:-0}" = 1 ]; then
  echo "js SKIPPED" >> "$SUM"; SKIPPED+=(js)
else
  # Own temp dir: a shared /tmp clean-up removed bin/test-js's mktemp folder mid-run (T237, exit 143).
  mkdir -p "$OUT/tmp"
  TMPDIR="$OUT/tmp" MERGE_BATCH=1 SHELL_X_SEPARATE=1 bin/test-js -j "${TRAIN_CHECK_JS_JOBS:-8}" > "$OUT/js.txt" 2>&1; rc=$?
  echo "js exit $rc: $(grep -E '^Files: ' "$OUT/js.txt" | tail -1)" >> "$SUM"
  grep -E '^Failed: ' "$OUT/js.txt" >> "$SUM" || true
  [ "$rc" -ne 0 ] && RED+=("js exit $rc")
fi

# ---- shell X result (started at step 0) ----
if [ "${TRAIN_CHECK_SKIP_JS:-0}" = 1 ]; then
  echo "shell-x SKIPPED" >> "$SUM"
elif [ "$SHELLX_NEEDED" = 0 ]; then
  echo "shell-x not needed: $SHELLX_WHY" >> "$SUM"
elif [ -n "$SHELLX_PID" ]; then
  wait "$SHELLX_PID"; rc=$?
  echo "shell-x exit $rc ($SHELLX_WHY): $(grep -E '^SHELL-X-CHECK ' "$OUT/shellx.txt" | tail -1)" >> "$SUM"
  [ "$rc" -ne 0 ] && RED+=("shell-x exit $rc")
else
  echo "shell-x FAILED: no m01 game" >> "$SUM"; RED+=("shell-x: no m01 game")
fi

# ---- rubocop result (started at step 0b) ----
wait "$RUBOCOP_PID"; rc=$?
echo "rubocop exit $rc: $(grep -E 'files? inspected' "$OUT/rubocop.txt" | tail -1)" >> "$SUM"
[ "$rc" -ne 0 ] && RED+=("rubocop exit $rc (see rubocop.txt; bin/rubocop -a fixes safe layout offences)")

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

# ---- opened-state scan result (started at step 1b) ----
if [ -n "$OPENED_PID" ]; then
  wait "$OPENED_PID"; rc=$?
  echo "opened-scan exit $rc: $(grep -E '^[0-9]+ runs, ' "$OUT/opened_scan.txt" | tail -1)" >> "$SUM"
  [ "$rc" -ne 0 ] && RED+=("opened-scan exit $rc")
  grep -qE ', [1-9][0-9]* skips' "$OUT/opened_scan.txt" && RED+=("opened-scan skipped tests")
elif [ "${TRAIN_CHECK_SKIP_RAILS:-0}" = 1 ]; then
  echo "opened-scan SKIPPED (rails skipped)" >> "$SUM"
else
  echo "opened-scan FAILED: $OPENED_TEST is missing" >> "$SUM"; RED+=("opened-scan test file missing")
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

# ---- 4b. eventMappings index drift against the train base (main) ----
# Once-only records are keyed npc:pattern:handlerIndex, so a mapping inserted or removed before
# existing ones re-fires saved games' once-only texts. Appends and content edits pass.
if [ "${TRAIN_CHECK_SKIP_CORPUS:-0}" = 1 ]; then
  echo "mapdrift SKIPPED" >> "$SUM"; SKIPPED+=(mapdrift)
else
  LANG=C.UTF-8 "$TC_RUBY" tools/check_mapping_index_drift.rb "${MAPDRIFT_BASE:-main}" > "$OUT/mapdrift.txt" 2>&1; rc=$?
  echo "mapdrift exit $rc: $(tail -1 "$OUT/mapdrift.txt")" >> "$SUM"
  [ "$rc" -ne 0 ] && RED+=("mapdrift exit $rc (see mapdrift.txt; append new eventMappings, never insert before existing ones)")
fi

# ---- 4c. ink route pins (scripts/ink_runtime_check/m*_routes) ----
if [ "${TRAIN_CHECK_SKIP_CORPUS:-0}" = 1 ]; then
  echo "ink-routes SKIPPED" >> "$SUM"; SKIPPED+=(ink-routes)
else
  tools/run-ink-routes.sh "$WT" > "$OUT/ink_routes.txt" 2>&1; rc=$?
  echo "$(grep -E '^ink-routes exit ' "$OUT/ink_routes.txt" | tail -1 || true)" >> "$SUM"
  grep -E '^  failing: ' "$OUT/ink_routes.txt" >> "$SUM" || true
  [ "$rc" -ne 0 ] && RED+=("ink-routes exit $rc (see ink_routes.txt)")
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
