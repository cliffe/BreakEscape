#!/usr/bin/env bash
# Re-run every committed SE bridge check as a regression suite.
#
#   tools/playtest/se/run-suite.sh [out_dir]
#
# Needs the keyless server on :3001 (tools/playtest/start-keyless-server.sh) and Node 24 at
# ~/.cache/ms-playwright-go/1.57.0/node. Each bridge gets a fresh game from new-game.rb for its
# scenario and a headless playtest-session.js run, then is scored with
# `check-bridge.mjs --expect <bridge> <log>`. Up to 3 run at once. bridge-3b resumes the game
# bridge-1b leaves behind, so it runs straight after 1b on the same game. bridge-5-600 runs at
# a 600 px wide viewport (VW=600).
#
# Writes <out_dir>/<bridge>.{log,out,err,check} and <out_dir>/table.md (default out_dir:
# tmp/se-suite-<timestamp>). ONLY="1b 4" limits the run to those bridges. Exit status is 1 if any bridge fails.
set -uo pipefail
cd "$(dirname "$0")/../../.."
NODE=${NODE:-$HOME/.cache/ms-playwright-go/1.57.0/node}
PORT=3001
OUT=${1:-tmp/se-suite-$(date +%Y%m%d-%H%M%S)}
mkdir -p "$OUT"; OUT=$(cd "$OUT" && pwd)
HARNESS=.claude/skills/playtest-scenario/scripts/playtest-session.js
SE=tools/playtest/se
tools/playtest/start-keyless-server.sh >/dev/null || { echo "keyless server not available on :$PORT" >&2; exit 2; }

# name:scenario[:VW]. bridge-3b is chained after 1b below, not listed here.
JOBS=(
  1a:test_social_slice 1b:test_social_slice 2:test_social_slice 3:test_social_slice
  3c:test_social_slice 4:test_social_slice 5:test_social_slice 5-600:test_social_slice:600
  m5-slice:test_social_slice 6:lab_social_engineering r4-door:lab_social_engineering
  board-indicators:test_social_board_indicators freetext:test_social_freetext
  m5-channels:test_social_m5_channels p7-channels:test_social_p7_channels p9:test_social_p9
  p7-episode:test_social_episode
  e1-full:awareness_e1_invoice_fraud e2-full:awareness_e2_cv_lures
  e3-full:awareness_e3_helpdesk_reset e4-full:awareness_e4_exec_whaling
  e5-full:awareness_e5_signin_pages e6-full:awareness_e6_texts_and_qr
  e7-full:awareness_e7_voice_ceo
  e8-full:awareness_e8_after_the_click
  e9-full:awareness_e9_passwords
  e11-full:awareness_e11_misdirected_data
  e15-full:awareness_e15_shadow_it
  e16-full:awareness_e16_insider_risk
  e19-full:awareness_e19_malware_and_updates
  e20-full:awareness_e20_remote_and_mobile_working
  e17-defend:awareness_e17_acceptable_use_defend
)

new_game() { # scenario -> game id
  local o; o=$(PLAYTEST_PORT=$PORT BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb "$1" 2>&1)
  echo "$o" | grep -oP 'GAME_ID=\K\d+' || { echo "new-game failed for $1: $o" >&2; return 1; }
}

run_bridge() { # name scenario game_id [vw]
  local name=$1 scen=$2 gid=$3 vw=${4:-}
  VW=$vw timeout 600 "$NODE" "$HARNESS" --url "http://127.0.0.1:$PORT/break_escape/games/$gid" --headless true \
    --log "$OUT/$name.log" < "$SE/bridge-$name.jsonl" > "$OUT/$name.out" 2> "$OUT/$name.err"
  "$NODE" "$SE/check-bridge.mjs" --expect "$SE/bridge-$name.jsonl" "$OUT/$name.log" > "$OUT/$name.check" 2>&1
  local rc=$? ; local line; line=$(grep -oP 'passed: \K\d+(?=, failed)' "$OUT/$name.check" | head -1)
  local exp; exp=$(grep -oP 'expected: \K\d+' "$OUT/$name.check" | head -1)
  printf '%s\t%s\t%s\t%s\t%s\t%s\n' "$name" "$scen" "$gid" "${line:-0}" "${exp:-?}" "$([ $rc = 0 ] && echo PASS || echo FAIL)" > "$OUT/$name.row"
}

job() { # name:scenario[:vw]
  IFS=: read -r name scen vw <<< "$1"
  local gid; gid=$(new_game "$scen") || { printf '%s\t%s\t-\t0\t?\tFAIL\n' "$name" "$scen" > "$OUT/$name.row"; return; }
  run_bridge "$name" "$scen" "$gid" "$vw"
  if [ "$name" = 1b ]; then run_bridge 3b "$scen" "$gid"; fi   # 3b resumes 1b's game
}

# ONLY="1b 4 6" reruns just those bridges (3b rides with 1b).
running=0
for j in "${JOBS[@]}"; do
  # Bridges still being written (e3-full, e5-full) are skipped until their file exists.
  [ -f "$SE/bridge-${j%%:*}.jsonl" ] || { echo "skip ${j%%:*}: no $SE/bridge-${j%%:*}.jsonl" >&2; continue; }
  if [ -n "${ONLY:-}" ]; then case " $ONLY " in *" ${j%%:*} "*) ;; *) continue;; esac; fi
  job "$j" &
  running=$((running+1))
  if [ $running -ge 3 ]; then wait -n; running=$((running-1)); fi
done
wait

{
  echo '| Bridge | Scenario | Game id | Passed/expected | Result |'
  echo '|---|---|---|---|---|'
  cat "$OUT"/*.row | sort -V | awk -F'\t' '{printf "| bridge-%s | %s | %s | %s/%s | %s |\n",$1,$2,$3,$4,$5,$6}'
} | tee "$OUT/table.md"
! grep -q FAIL "$OUT/table.md"
