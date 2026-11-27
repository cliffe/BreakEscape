#!/bin/bash
# A1 R2 M1 live proof: a preloaded voiced opening that carries a #delivery: note keeps it across a reload.
#   PC_PORT=3024 tools/phone_calls/routes/note_preload_reload.sh <outdir>
# test_phone_call_notes, skip_hax=true (HaX stays quiet). Agent Dee's opening is preloaded on pickup. Then:
# sync -> reload (before the thread is opened) -> check the restored history still holds deliveryTags ->
# emit ring_dee (a voiced phone-chat open of the preloaded thread) -> the /tts request must carry the note.
cd "$(dirname "$0")/../../.."
OUT=${1:?outdir}; mkdir -p "$OUT"
S=tools/playtest/cmd.sh
GID=$(tools/phone_calls/newgame.sh test_phone_call_notes --set skip_hax=true | sed -n 's/^GAME_ID=//p')
[ -n "$GID" ] || { echo "no game id" >&2; exit 1; }
echo "game $GID"
tools/phone_calls/open.sh "$GID" "$OUT/session.jsonl" "$OUT/tts.jsonl" false >/dev/null
sleep 6
cat > /tmp/pc-hist-$GID.js <<'J'
const h = window.npcManager.getConversationHistory('agent_dee') || [];
return { history: h.map(m => ({ text: m.text, preloaded: m.preloaded, deliveryTags: m.deliveryTags || null })),
         minigame: window.MinigameFramework?.currentMinigame?.constructor?.name || null };
J
tools/phone_calls/ev.sh $GID /tmp/pc-hist-$GID.js | tail -n 1 | jq '.result' > "$OUT/history_before_reload.json"
$S $GID '{"cmd":"sync"}' >/dev/null
$S $GID '{"cmd":"waitFor","kind":"condition","fn":"() => { window.__preReload = true; setTimeout(() => location.assign(location.pathname + \"?skip_resume=1\"), 50); return true; }"}' >/dev/null
sleep 8
$S $GID '{"cmd":"bootstrap","tutorial":"decline","resume":"resume","autoBrief":false}' 120 >/dev/null
sleep 3
tools/phone_calls/ev.sh $GID /tmp/pc-hist-$GID.js | tail -n 1 | jq '.result' > "$OUT/history_after_reload.json"
echo "window.eventDispatcher.emit('ring_dee', {}); return true;" > /tmp/pc-emit-$GID.js
tools/phone_calls/ev.sh $GID /tmp/pc-emit-$GID.js >/dev/null
for i in $(seq 1 30); do
  T=$($S $GID '{"cmd":"brief"}' 20 | jq -r '.result.activeMinigame.id // empty' 2>/dev/null)
  [ "$T" = "phone-chat" ] && break; sleep 1
done
echo "minigame=$T after ${i}s"; sleep 5
$S $GID "{\"cmd\":\"screenshot\",\"path\":\"$OUT/dee_open.png\"}" >/dev/null
$S $GID '{"cmd":"quit"}' 20 >/dev/null
jq -r '"\(.status) \(.npc_id) | \(.text) | \(.delivery)"' "$OUT/tts.jsonl"
