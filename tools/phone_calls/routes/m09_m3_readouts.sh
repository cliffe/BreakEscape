#!/bin/bash
# Phone calls M3: HaX's read-out texts (m09), ignoring the toast.
#   tools/phone_calls/routes/m09_m3_readouts.sh <outdir> [tap]
# New game on :3023, then per beat: emit the real trigger event (the global is set first, as the bridge
# notes in ROUTES.md require), wait for the toast (phone closed), screenshot, and either open HaX's
# thread by hand (default) or tap the toast ("tap"). Prints the thread tail, the flags and the notes.
# env RING_ONLY=1 stops after the ledger beat and goes to the Recruiter ring; TAG=_x suffixes the output names.
# Beats: flag1_read (item), ledger_read (ledger_read_heard), afterwards, hour_read.
cd "$(dirname "$0")/../../.."
OUT=${1:?outdir}; MODE=${2:-hand}; mkdir -p "$OUT"; S=tools/playtest/cmd.sh
P=$OUT/${MODE}${TAG:-}
GID=$(tools/phone_calls/newgame.sh m09_digital_archaeology | sed -n 's/^GAME_ID=//p'); [ -n "$GID" ] || exit 1
echo $GID > ${P}_game_id.txt
tools/phone_calls/open.sh $GID ${P}_session.jsonl ${P}_tts.jsonl true >/dev/null
shot() { $S $GID "{\"cmd\":\"screenshot\",\"path\":\"${P}_$1.png\"}" >/dev/null; }
emit() { # emit <global> [more globals set first, space separated name=value]
  local js=""; for kv in $2; do js="$js window.gameState.globalVariables['${kv%%=*}'] = ${kv#*=};"; done
  echo "$js window.gameState.globalVariables['$1'] = true; window.eventDispatcher.emit('global_variable_changed:$1', {name:'$1', value:true}); return true;" > ${P}_emit.js
  tools/phone_calls/ev.sh $GID ${P}_emit.js >/dev/null; }
state() { echo "return { notes: (window.gameState.notes||[]).map(n=>n.title||n.id).join('|'), g: ['flag1_submitted','flag2_submitted','ledger_read_heard','deck_choice_made','afterwards_heard','flag4_submitted','identity_scene_done','hour_read_started','hour_read_done'].map(k=>k+'='+window.gameState.globalVariables[k]).join(' ') };" > ${P}_state.js
  tools/phone_calls/ev.sh $GID ${P}_state.js | tail -1 | jq -c '.result'; }
tail_thread() { $S $GID '{"cmd":"mg","action":"getState"}' | tail -1 | python3 -c "import sys,json; t=json.loads(sys.stdin.read())['result']['text']; print('   thread tail:', t[-$1:].replace(chr(10),' / '))"; }
open_hax() { $S $GID '{"cmd":"openInventoryItem","item":"phone"}' >/dev/null; sleep 2; $S $GID '{"cmd":"mg","action":"clickText","args":["HaX"]}' >/dev/null; sleep 6; }
beat() { # beat <name> <toast text> <wait s> <closing choice regex>
  echo "== $1"; sleep $3; shot "$1_1_toast"
  $S $GID '{"cmd":"mg","action":"getState"}' | tail -1 | grep -q '"available":false' && echo "   phone closed when the toast arrived: yes"
  if [ "$MODE" = tap ]; then
    # the toast is a plain DOM element with an onClick: click the smallest element that holds its text
    echo "const t = [...document.querySelectorAll('body *')].filter(e => e.children.length < 6 && (e.textContent||'').includes('$2') && e.offsetParent !== null).sort((a,b) => a.textContent.length - b.textContent.length)[0]; if (!t) return 'no toast'; t.click(); return 'clicked: ' + t.className;" > ${P}_tap.js
    tools/phone_calls/ev.sh $GID ${P}_tap.js | tail -1 | cut -c1-160; sleep 8
  else open_hax; fi
  shot "$1_2_thread"; tail_thread 400
  # answer with choice 1 until the read-out ends and the phone closes (at most 4 answers)
  for i in 1 2 3 4; do
    $S $GID '{"cmd":"mg","action":"getState"}' | tail -1 | grep -q '"available":false' && break
    $S $GID '{"cmd":"mg","action":"choose","args":[1]}' >/dev/null; sleep 7
    [ $i = 1 ] && shot "$1_3_after_first_answer"
  done
  shot "$1_3_after"
  $S $GID '{"cmd":"mg","action":"clickText","args":["Close"]}' >/dev/null 2>&1; sleep 1
  state
  echo "   reopen (no replay expected):"; open_hax; shot "$1_4_reopen"; tail_thread 250
  $S $GID '{"cmd":"mg","action":"clickText","args":["Close"]}' >/dev/null; sleep 1
}
emit flag1_submitted
beat flag1 "It came with a list" 12 "^Got it|^Something else|^Ledger or"
emit flag2_submitted
beat ledger "entry you need" 11 "^TF Null|^Understood|^Got it"
if [ -z "$RING_ONLY" ]; then
emit deck_choice_made "m08_completed=false"
beat afterwards "A word when you can" 11 x
emit flag4_submitted "identity_scene_done=true flag3_submitted=true"
beat hour_read "has a clock on it" 11 x
fi
# Recruiter ring (c): ledger_read_heard + cage_opened, any room entry outside the cage, 15 s on
echo "== recruiter ring"
echo "window.gameState.globalVariables['cage_opened'] = true; window.eventDispatcher.emit('room_entered', {roomId:'loading_dock'}); return true;" > ${P}_ring.js
tools/phone_calls/ev.sh $GID ${P}_ring.js >/dev/null
for i in $(seq 1 40); do jq -r '"\(.npc_id)"' ${P}_tts.jsonl 2>/dev/null | grep -q recruiter && { echo "   recruiter /tts request seen after ${i}x1s"; break; }; sleep 1; done
sleep 3; shot ring_call
$S $GID '{"cmd":"quit"}' 20 >/dev/null
echo $GID
