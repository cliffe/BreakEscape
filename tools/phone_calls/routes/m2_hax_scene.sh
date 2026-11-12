#!/bin/bash
# Phone calls M2 gap (review R1 m5): screenshot a HaX line in a person-chat scene where she is a co-speaker.
#   [PRE='js'] [WALK='room room ...'] tools/phone_calls/routes/m2_hax_scene.sh <outdir> <label> <scenario> <event|json|-> <line regex> [new-game.rb options...]
# PRE runs in the page after bootstrap (g = gameState.globalVariables); WALK enters those rooms in order with the
# bridge's `enter` (a scene's NPC is only registered once its room has loaded, so an event alone can't start it).
# New game WITHOUT --start-room (it moves the phone records and changes which record voices her: TTS_403_DIAGNOSIS.md),
# autoBrief true, then the event is emitted and the scene is advanced until the line matching <regex> is on screen.
cd "$(dirname "$0")/../../.."
OUT=$1; LABEL=$2; SC=$3; EV=$4; RX=$5; shift 5; S=tools/playtest/cmd.sh; mkdir -p "$OUT"
GID=$(tools/phone_calls/newgame.sh $SC "$@" | sed -n 's/^GAME_ID=//p'); [ -n "$GID" ] || { echo no game id; exit 1; }
echo $GID > $OUT/${LABEL}_game_id.txt
tools/phone_calls/open.sh $GID $OUT/${LABEL}_session.jsonl $OUT/${LABEL}_tts.jsonl ${AUTOBRIEF:-true} >/dev/null
if [ -n "$PRE" ]; then echo "const g = window.gameState.globalVariables; $PRE; return true;" > $OUT/${LABEL}_pre.js; tools/phone_calls/ev.sh $GID $OUT/${LABEL}_pre.js >/dev/null; fi
for r in $WALK; do echo "enter $r: $($S $GID "{\"cmd\":\"enter\",\"room\":\"$r\"}" 60 | tail -1 | cut -c1-120)"; done
if [ "$EV" != "-" ]; then echo "window.eventDispatcher.emit('${EV%%|*}', ${EV#*|}); return true;" > $OUT/${LABEL}_emit.js; tools/phone_calls/ev.sh $GID $OUT/${LABEL}_emit.js >/dev/null; fi
for i in $(seq 1 ${LOOPS:-60}); do
  B=$($S $GID '{"cmd":"brief"}' 30 | tail -1)
  echo "$B" | jq -r '.result.activeMinigame.id // empty' | grep -q person-chat || { sleep 2; continue; }
  SPK=$(echo "$B" | jq -r '.result.dialogue.speaker // empty'); TXT=$(echo "$B" | jq -r '.result.dialogue.text // empty')
  echo "[$i] $SPK: ${TXT:0:90}"
  if echo "$TXT" | grep -Eq "$RX"; then $S $GID "{\"cmd\":\"screenshot\",\"path\":\"$OUT/${LABEL}.png\"}" >/dev/null; echo "SHOT $SPK: $TXT"; break; fi
  if echo "$B" | jq -e '.result.dialogue.awaitingChoice' >/dev/null 2>&1; then $S $GID '{"cmd":"mg","action":"choose","args":[1]}' >/dev/null; else $S $GID '{"cmd":"mg","action":"continue"}' >/dev/null; fi
  sleep 1
done
jq -r '"\(.status) \(.npc_id) | \(.text)"' $OUT/${LABEL}_tts.jsonl | tail -8
$S $GID '{"cmd":"quit"}' 20 >/dev/null
