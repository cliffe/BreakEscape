#!/bin/bash
# Phone calls M3: a reload during a read-out beat sends no second text.
#   tools/phone_calls/routes/m09_m3_reload.sh <outdir> early|pending|delivered
# early (R1): reload 1 s after the event, before the mapping's 2.5 s delay ends (the drop terminal still open):
#   the latch is unset, so the game_loaded backstop sends the text once.
# pending: reload 3 s after the ledger event (text still counting down, restored from the server save).
# delivered: reload after the text arrived. Prints how many times the ledger text is in HaX's thread.
cd "$(dirname "$0")/../../.."
OUT=${1:?outdir}; WHEN=${2:?pending|delivered}; S=tools/playtest/cmd.sh; P=$OUT/reload_$WHEN; mkdir -p "$OUT"
GID=$(tools/phone_calls/newgame.sh m09_digital_archaeology | sed -n 's/^GAME_ID=//p'); [ -n "$GID" ] || exit 1
tools/phone_calls/open.sh $GID ${P}_session.jsonl ${P}_tts.jsonl true >/dev/null
# R1: flag 1's beat is marked done without its events (no read-out, no text), and HaX's thread keeps the history it
# has in a real game (the dock opening, preloaded at pickup). With an EMPTY history the engine preloads the pending
# read-out silently on load, which is a test artefact, not a player path.
echo "const g=window.gameState.globalVariables; g.flag1_submitted=true; g.flag1_texted=true; g.flag1_read_heard=true; return (window.npcManager.getConversationHistory('agent_0x99')||[]).length;" > ${P}_pre.js
sleep 10; echo "history before flag 2: $(tools/phone_calls/ev.sh $GID ${P}_pre.js | tail -1 | jq -r .result)"
echo "window.gameState.globalVariables['flag2_submitted']=true; window.eventDispatcher.emit('global_variable_changed:flag2_submitted',{name:'flag2_submitted',value:true}); return true;" > ${P}_emit.js
tools/phone_calls/ev.sh $GID ${P}_emit.js >/dev/null
case $WHEN in early) sleep 1;; pending) sleep 3;; *) sleep 11;; esac
$S $GID '{"cmd":"sync"}' >/dev/null
$S $GID '{"cmd":"waitFor","kind":"condition","fn":"() => { setTimeout(() => location.assign(location.pathname + \"?skip_resume=1\"), 50); return true; }"}' >/dev/null
sleep 8
$S $GID '{"cmd":"bootstrap","tutorial":"decline","resume":"resume","autoBrief":true}' 120 >/dev/null
sleep 20
$S $GID "{\"cmd\":\"screenshot\",\"path\":\"${P}_after_reload.png\"}" >/dev/null
$S $GID '{"cmd":"openInventoryItem","item":"phone"}' >/dev/null; sleep 2; $S $GID '{"cmd":"mg","action":"clickText","args":["HaX"]}' >/dev/null; sleep 6
$S $GID "{\"cmd\":\"screenshot\",\"path\":\"${P}_thread.png\"}" >/dev/null
$S $GID '{"cmd":"mg","action":"getState"}' | tail -1 | python3 -c "import sys,json; t=json.loads(sys.stdin.read())['result']['text']; print('$WHEN: ledger text count =', t.count(\"Their ledger's open on my screen\"), '| ledger lines played:', 'The ledger\'s live' in t)"
$S $GID '{"cmd":"quit"}' 20 >/dev/null
echo $GID > ${P}_game_id.txt
