#!/bin/bash
# Phone calls M3 review R1 (M1): HaX's thread opened before her flag 1 text arrives.
#   tools/phone_calls/routes/m09_m3_early_open.sh <outdir>
# Emits flag1_submitted, opens HaX's thread at ~4 s (the text would land at ~7.5 s: 2.5 s mapping delay
# plus 5 s message delay), plays the read-out, closes, waits out the delay. Expect: no toast, no
# "First box is in" text in the thread, one salvage-line note. Then a stale toast is forced (a bark
# for the same knot) and tapped: expect the hub, still one note.
cd "$(dirname "$0")/../../.."
OUT=${1:?outdir}; mkdir -p "$OUT"; S=tools/playtest/cmd.sh; P=$OUT/early
GID=$(tools/phone_calls/newgame.sh m09_digital_archaeology | sed -n 's/^GAME_ID=//p'); [ -n "$GID" ] || exit 1
echo $GID > ${P}_game_id.txt
tools/phone_calls/open.sh $GID ${P}_session.jsonl ${P}_tts.jsonl true >/dev/null
shot() { $S $GID "{\"cmd\":\"screenshot\",\"path\":\"${P}_$1.png\"}" >/dev/null; }
state() { echo "const n=(window.gameState.notes||[]); return { salvageNoteEntries: n.filter(x=>(x.title||'').includes('salvage cage')).length, noteTitles: n.map(x=>x.title||x.id).join('|'), toast: [...document.querySelectorAll('body *')].filter(e=>e.children.length<6 && (e.textContent||'').includes('First box is in') && e.offsetParent!==null).length, g: ['flag1_submitted','flag1_read_heard','flag1_texted'].map(k=>k+'='+window.gameState.globalVariables[k]).join(' ') };" > ${P}_state.js
  tools/phone_calls/ev.sh $GID ${P}_state.js | tail -1 | jq -c '.result'; }
thread() { $S $GID '{"cmd":"mg","action":"getState"}' | tail -1 | python3 -c "import sys,json; t=json.loads(sys.stdin.read())['result']['text']; print('   thread: First box is in count =', t.count('First box is in'), '| tail:', t[-$1:].replace(chr(10),' / '))"; }
echo "window.gameState.globalVariables['flag1_submitted'] = true; window.eventDispatcher.emit('global_variable_changed:flag1_submitted', {name:'flag1_submitted', value:true}); return true;" > ${P}_emit.js
tools/phone_calls/ev.sh $GID ${P}_emit.js >/dev/null
sleep 3
$S $GID '{"cmd":"openInventoryItem","item":"phone"}' >/dev/null; sleep 2; $S $GID '{"cmd":"mg","action":"clickText","args":["HaX"]}' >/dev/null; sleep 6
echo "== thread open before the text; read-out"; shot 1_thread_open; thread 300
for i in 1 2 3 4; do
  $S $GID '{"cmd":"mg","action":"getState"}' | tail -1 | grep -q '"available":false' && break
  $S $GID '{"cmd":"mg","action":"choose","args":[1]}' >/dev/null; sleep 7
done
shot 2_after_readout; state
$S $GID '{"cmd":"mg","action":"clickText","args":["Close"]}' >/dev/null 2>&1; sleep 14
echo "== after the text's due time (closed phone)"; shot 3_after_delay; state
echo "== stale toast forced and tapped"
cat > ${P}_stale.js <<'JS'
const npc = window.npcManager.getNPC('agent_0x99');
window.npcManager.barkSystem.showBark({ npcId: npc.id, npcName: npc.displayName, message: 'First box is in. It came with a list.', avatar: npc.avatar,
  inkStoryPath: npc.storyPath, startKnot: 'flag1_read', phoneId: npc.phoneId });
await new Promise(r => setTimeout(r, 1200));
const t = [...document.querySelectorAll('body *')].filter(e => e.children.length < 6 && (e.textContent||'').includes('First box is in') && e.offsetParent !== null).sort((a,b) => a.textContent.length - b.textContent.length)[0];
if (!t) return 'no toast'; t.click(); return 'clicked: ' + t.className;
JS
tools/phone_calls/ev.sh $GID ${P}_stale.js | tail -1 | cut -c1-200; sleep 8
shot 4_stale_tap; thread 400; state
$S $GID '{"cmd":"quit"}' 20 >/dev/null
echo $GID
