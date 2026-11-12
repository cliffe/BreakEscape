#!/bin/bash
# lab_social_engineering Dev call regression route (plan 5.4, "lab SE Dev call").
#   tools/phone_calls/routes/se_dev.sh <outdir>
# New game on :3023 (head start: start room operations_room, only a precondition), then for real:
# desk phone -> pretext card -> Make the call -> choices 1,4,5,6 -> Done -> contact list and Dev thread
# -> Close -> sync -> reload -> dump. Writes screenshots, tts.json, storystate_after_call.json,
# storystate_after_reload.json into <outdir>.
cd "$(dirname "$0")/../../.."
OUT=${1:?outdir}; mkdir -p "$OUT"
S=tools/playtest/cmd.sh
GID=$(tools/phone_calls/newgame.sh lab_social_engineering --start-room operations_room | sed -n 's/^GAME_ID=//p')
[ -n "$GID" ] || { echo "no game id" >&2; exit 1; }
echo "game $GID"
tools/phone_calls/open.sh "$GID" "$OUT/se_dev_session.jsonl" "$OUT/tts.jsonl" >/dev/null
last() { tail -n 1; }
$S $GID '{"cmd":"moveToNear","id":"desk_phone"}' >/dev/null
$S $GID '{"cmd":"interact","id":"desk_phone"}' >/dev/null
$S $GID '{"cmd":"waitFor","kind":"minigame","id":"pretext-prep","timeoutMs":20000}' >/dev/null
$S $GID '{"cmd":"mg","action":"clickText","args":["Make the call"]}' >/dev/null
sleep 5
$S $GID "{\"cmd\":\"screenshot\",\"path\":\"$OUT/se_dev_call_open.png\"}" >/dev/null
for c in 1 4 5 6; do $S $GID "{\"cmd\":\"mg\",\"action\":\"choose\",\"args\":[$c]}" 30 >/dev/null; sleep 6; done
$S $GID "{\"cmd\":\"screenshot\",\"path\":\"$OUT/se_dev_call_end.png\"}" >/dev/null
$S $GID '{"cmd":"mg","action":"clickText","args":["Done"]}' >/dev/null; sleep 2
tools/phone_calls/ev.sh $GID tools/phone_calls/js/storystate-dump.js | last | jq '.result' > "$OUT/storystate_after_call.json"
$S $GID '{"cmd":"openInventoryItem","item":"phone"}' >/dev/null; sleep 2
$S $GID "{\"cmd\":\"screenshot\",\"path\":\"$OUT/se_phone_contacts.png\"}" >/dev/null
$S $GID '{"cmd":"mg","action":"clickText","args":["Sorry, I'"'"'m going"]}' >/dev/null; sleep 2
$S $GID "{\"cmd\":\"screenshot\",\"path\":\"$OUT/se_dev_thread.png\"}" >/dev/null
$S $GID '{"cmd":"mg","action":"clickText","args":["Close"]}' >/dev/null
$S $GID '{"cmd":"sync"}' >/dev/null
$S $GID '{"cmd":"waitFor","kind":"condition","fn":"() => { window.__preReload = true; setTimeout(() => location.assign(location.pathname + \"?skip_resume=1\"), 50); return true; }"}' >/dev/null
sleep 8
$S $GID '{"cmd":"bootstrap","tutorial":"decline","resume":"resume","autoBrief":true}' 120 >/dev/null
tools/phone_calls/ev.sh $GID tools/phone_calls/js/storystate-dump.js | last | jq '.result' > "$OUT/storystate_after_reload.json"
$S $GID '{"cmd":"quit"}' 20 >/dev/null
echo "$GID" > "$OUT/se_dev_game_id.txt"
for f in after_call after_reload; do jq -r --arg f $f 'to_entries[] | "\($f) \(.key) \(.value.currentKnot) \(.value.sha256_noseed)"' "$OUT/storystate_$f.json"; done
jq -r '"\(.status) \(.npc_id) | \(.text) | \(.delivery)"' "$OUT/tts.jsonl"
