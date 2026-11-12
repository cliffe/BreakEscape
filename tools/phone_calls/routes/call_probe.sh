#!/bin/bash
# Generic voiced-call capture: new game with a head start, bootstrap, wait for a call, record what it says.
#   tools/phone_calls/routes/call_probe.sh <outdir> <label> <wait_s> <scenario> [new-game.rb options...]
# Writes <outdir>/<label>.png, <label>_tts.jsonl, <label>_state.json (minigame text) and <label>_game_id.txt.
cd "$(dirname "$0")/../../.."
OUT=$1; LABEL=$2; WAIT=$3; shift 3
mkdir -p "$OUT"; S=tools/playtest/cmd.sh
GID=$(tools/phone_calls/newgame.sh "$@" | sed -n 's/^GAME_ID=//p')
[ -n "$GID" ] || { echo "no game id" >&2; exit 1; }
tools/phone_calls/open.sh "$GID" "$OUT/${LABEL}_session.jsonl" "$OUT/${LABEL}_tts.jsonl" "${AUTOBRIEF:-false}" >/dev/null
# TRIGGER="name=value name2=value2": globals set through the game's own proxy after bootstrap (emits global_variable_changed)
# EMIT='eventName|{"json":"data"}': dispatch a game event after bootstrap.
if [ -n "$TRIGGER" ]; then
  JS=""; for kv in $TRIGGER; do JS="$JS window.gameState.globalVariables['${kv%%=*}'] = ${kv#*=};"; done
  echo "$JS return true;" > /tmp/pc-trigger-$GID.js; tools/phone_calls/ev.sh $GID /tmp/pc-trigger-$GID.js >/dev/null
fi
if [ -n "$EMIT" ]; then
  echo "window.eventDispatcher.emit('${EMIT%%|*}', ${EMIT#*|}); return true;" > /tmp/pc-emit-$GID.js; tools/phone_calls/ev.sh $GID /tmp/pc-emit-$GID.js >/dev/null
fi
for i in $(seq 1 $WAIT); do
  T=$($S $GID '{"cmd":"brief"}' 20 | jq -r '.result.activeMinigame.id // empty' 2>/dev/null)
  [ "$T" = "phone-chat" ] || [ "$T" = "person-chat" -a -n "$WANT_PERSON" ] && break
  sleep 1
done
echo "game $GID minigame=$T after ${i}s"
sleep 8
$S $GID "{\"cmd\":\"screenshot\",\"path\":\"$OUT/${LABEL}.png\"}" >/dev/null
$S $GID '{"cmd":"mg","action":"getState"}' 20 | jq '.result | {id,title,text}' > "$OUT/${LABEL}_state.json"
echo "$GID" > "$OUT/${LABEL}_game_id.txt"
jq -r '"\(.status) \(.npc_id) | \(.text) | \(.delivery)"' "$OUT/${LABEL}_tts.jsonl"
$S $GID '{"cmd":"quit"}' 20 >/dev/null
