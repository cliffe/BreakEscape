#!/bin/bash
# m09 Recruiter hit-and-resume (plan 5.4): the call rings (ring c), a hit closes it, the re-ring fires on reload.
#   tools/phone_calls/routes/m09_recruiter_hit_resume.sh <outdir>
# Head start: loading_dock, ledger_read_heard and cage_opened (preconditions). The hit is window.playerHealth.damage(),
# the engine's own damage path. The re-ring is caught after a real save, reload and resume (game_loaded mapping, re-ring 1).
cd "$(dirname "$0")/../../.."
OUT=${1:?outdir}; mkdir -p "$OUT"; S=tools/playtest/cmd.sh
GID=$(tools/phone_calls/newgame.sh m09_digital_archaeology --start-room loading_dock --set ledger_read_heard=true --set cage_opened=true | sed -n 's/^GAME_ID=//p')
[ -n "$GID" ] || { echo "no game id" >&2; exit 1; }
tools/phone_calls/open.sh "$GID" "$OUT/m09_hit_session.jsonl" "$OUT/m09_hit_tts.jsonl" true >/dev/null
waitmg() { for i in $(seq 1 ${2:-150}); do T=$($S $GID '{"cmd":"brief"}' 20 | jq -r '.result.activeMinigame.id // empty'); [ "$T" = "$1" ] && return 0; sleep 1; done; return 1; }
waitmg phone-chat 150 && echo "ring 1: phone-chat open after ${i}s" || echo "ring 1: no call"
sleep 3
$S $GID "{\"cmd\":\"screenshot\",\"path\":\"$OUT/m09_hit_1_ring.png\"}" >/dev/null
echo "return window.playerHealth.damage(10) ?? true;" > /tmp/pc-hit-$GID.js; tools/phone_calls/ev.sh $GID /tmp/pc-hit-$GID.js >/dev/null
sleep 3
echo "after hit: minigame=$($S $GID '{"cmd":"brief"}' 20 | jq -r '.result.activeMinigame.id // "none"')"
$S $GID "{\"cmd\":\"screenshot\",\"path\":\"$OUT/m09_hit_2_after_hit.png\"}" >/dev/null
# A bare playerHealth.damage() leaves the call open (A0 finding), so close it with the call screen's own Close button
$S $GID '{"cmd":"mg","action":"clickText","args":["Close"]}' >/dev/null; sleep 3
echo "after Close: minigame=$($S $GID '{"cmd":"brief"}' 20 | jq -r '.result.activeMinigame.id // "none"')"
$S $GID '{"cmd":"sync"}' >/dev/null
$S $GID '{"cmd":"waitFor","kind":"condition","fn":"() => { setTimeout(() => location.assign(location.pathname + \"?skip_resume=1\"), 50); return true; }"}' >/dev/null
sleep 8
$S $GID '{"cmd":"bootstrap","tutorial":"decline","resume":"resume","autoBrief":true}' 120 >/dev/null
waitmg phone-chat 60 && echo "re-ring: phone-chat open after ${i}s" || echo "re-ring: none"
sleep 3
$S $GID "{\"cmd\":\"screenshot\",\"path\":\"$OUT/m09_hit_3_rering.png\"}" >/dev/null
$S $GID '{"cmd":"mg","action":"getState"}' 20 | jq '.result | {id,title,text}' > "$OUT/m09_hit_rering_state.json"
$S $GID '{"cmd":"quit"}' 20 >/dev/null
echo "$GID" > "$OUT/m09_hit_game_id.txt"
jq -r '"\(.status) \(.npc_id) | \(.text) | \(.delivery)"' "$OUT/m09_hit_tts.jsonl"
