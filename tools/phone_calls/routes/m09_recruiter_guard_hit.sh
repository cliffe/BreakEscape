#!/bin/bash
# A2b R1 M4: the Recruiter's forced call and a real guard attack (Cody, open_stacks), same route on any server.
#   PC_PORT=3025 tools/phone_calls/routes/m09_recruiter_guard_hit.sh <outdir> <label> [hostile_after_s]
# Start room open_stacks with the ring-c preconditions; ring c rings 15 s after load. Once the call is the open
# minigame, Cody is made hostile through the engine's own setNPCHostile and chases/attacks. A timeline is written
# every 2 s: minigame, call state (ringer where it exists), health, the Recruiter's flags, the last /tts requests.
cd "$(dirname "$0")/../../.."
export NODE_PATH=$PWD/node_modules
OUT=${1:?outdir}; LABEL=${2:?label}; AFTER=${3:-3}; mkdir -p "$OUT"; S=tools/playtest/cmd.sh
GID=$(tools/phone_calls/newgame.sh m09_digital_archaeology --start-room ${START_ROOM:-open_stacks} --set ledger_read_heard=true --set cage_opened=true | sed -n 's/^GAME_ID=//p')
[ -n "$GID" ] || { echo "no game id" >&2; exit 1; }
echo "$GID" > "$OUT/${LABEL}_game_id.txt"
tools/phone_calls/open.sh "$GID" "$OUT/${LABEL}_session.jsonl" "$OUT/${LABEL}_tts.jsonl" true >/dev/null
cat > /tmp/pc-tl-$GID.js <<'J'
const mg = window.MinigameFramework && window.MinigameFramework.currentMinigame;
const r = window.phoneRinger; const cur = r && r.current && r.current();
const g = window.gameState.globalVariables;
const n = window.npcManager && window.npcManager.getNPC('recruiter');
const cody = window.npcHostileSystem && window.npcHostileSystem.isNPCHostile && window.npcHostileSystem.isNPCHostile('old_coyote');
return { t: Math.round(performance.now()/1000), mg: mg ? (mg._sceneType || mg.constructor.name) + ':' + ((mg.params && mg.params.npcId) || '') : null,
  ringer: r ? (cur ? cur.state : 'none') : 'n/a', hp: window.playerHealth && window.playerHealth.getHP(),
  started: g.recruiter_call_started, said_yes: g.recruiter_said_yes, gone: g.recruiter_gone,
  recKnot: n && n.currentKnot, pending: !!(n && n.pendingCall), codyHostile: cody,
  sub: (document.querySelector('.call-subtitle, #call-subtitle, .call-line') || {}).innerText || null,
  ended: !!document.querySelector('.call-ended'), bubbles: document.querySelectorAll('#messages-container .message, .phone-message').length };
J
tl() { tools/phone_calls/ev.sh $GID /tmp/pc-tl-$GID.js 30 | tail -n 1 | jq -c 'if type == "object" and has("result") then .result else . end'; }
echo "const c = window.npcManager.getNPC('old_coyote'); if (c && c.los) c.los.enabled = false; return !!(c && c.los);" > /tmp/pc-los-$GID.js
tools/phone_calls/ev.sh $GID /tmp/pc-los-$GID.js | tail -n 1
for i in $(seq 1 90); do T=$($S $GID '{"cmd":"brief"}' 20 | jq -r '.result.activeMinigame.id // empty'); [ "$T" = "phone-chat" ] && break; sleep 1; done
echo "call open after ${i}s ($T)" | tee "$OUT/${LABEL}_timeline.txt"
tl | tee -a "$OUT/${LABEL}_timeline.txt"
$S $GID "{\"cmd\":\"screenshot\",\"path\":\"$OUT/${LABEL}_1_call.png\"}" >/dev/null
sleep "$AFTER"
echo "const c = window.npcManager.getNPC('old_coyote'); const los = c && c.los ? (c.los.enabled = false, 'los off') : 'no los'; window.npcHostileSystem.setNPCHostile('old_coyote', true); return 'hostile set, ' + los;" > /tmp/pc-host-$GID.js
tools/phone_calls/ev.sh $GID /tmp/pc-host-$GID.js | tail -n 1 | tee -a "$OUT/${LABEL}_timeline.txt"
for k in $(seq 1 5); do tl | tee -a "$OUT/${LABEL}_timeline.txt"; sleep 2; done
$S $GID '{"cmd":"mg","action":"getState"}' 20 | jq -c '.result | {id,title,text}' | tee -a "$OUT/${LABEL}_timeline.txt" | cut -c1-300
$S $GID "{\"cmd\":\"screenshot\",\"path\":\"$OUT/${LABEL}_2_after_hit.png\"}" >/dev/null
# End whatever the hit opened and calm the guard, then watch 24 s: does the call come back by itself (quiet time)?
echo "window.npcHostileSystem.setNPCHostile('old_coyote', false); const m = window.MinigameFramework.currentMinigame; if (m) window.MinigameFramework.endMinigame(false); return 'ended ' + (m && m._sceneType);" > /tmp/pc-end-$GID.js
tools/phone_calls/ev.sh $GID /tmp/pc-end-$GID.js | tail -n 1 | tee -a "$OUT/${LABEL}_timeline.txt"
echo "--- quiet watch (no room change)" >> "$OUT/${LABEL}_timeline.txt"
for k in $(seq 1 8); do tl | tee -a "$OUT/${LABEL}_timeline.txt"; sleep 3; done
# The mapping's own re-ring trigger (re-ring 1: room_exited, next room not the cage), then watch.
echo "window.eventDispatcher.emit('room_exited', {roomId:'open_stacks', nextRoom:'reading_room'}); return true;" > /tmp/pc-exit-$GID.js
tools/phone_calls/ev.sh $GID /tmp/pc-exit-$GID.js >/dev/null
echo "--- after room_exited (re-ring 1)" >> "$OUT/${LABEL}_timeline.txt"
for k in $(seq 1 8); do tl | tee -a "$OUT/${LABEL}_timeline.txt"; sleep 2; done
$S $GID "{\"cmd\":\"screenshot\",\"path\":\"$OUT/${LABEL}_3_rering.png\"}" >/dev/null
$S $GID '{"cmd":"mg","action":"getState"}' 20 | jq -c '.result | {id,title,text}' | tee -a "$OUT/${LABEL}_timeline.txt" | cut -c1-300
echo "--- tts so far" >> "$OUT/${LABEL}_timeline.txt"; jq -r '"\(.status) \(.npc_id) | \(.text)"' "$OUT/${LABEL}_tts.jsonl" >> "$OUT/${LABEL}_timeline.txt"
echo "$GID"
$S $GID '{"cmd":"quit"}' 20 >/dev/null
