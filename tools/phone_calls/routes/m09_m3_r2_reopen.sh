#!/bin/bash
# Phone calls M3 review R2 m1: close HaX's read-out at its first choice, change a global the story
# holds, reopen. Expect the choices and the rest of the read-out (once), then the hub on the next reopen.
#   tools/phone_calls/routes/m09_m3_r2_reopen.sh <outdir>
cd "$(dirname "$0")/../../.."
OUT=${1:?outdir}; mkdir -p "$OUT"; S=tools/playtest/cmd.sh; P=$OUT/r2
GID=$(tools/phone_calls/newgame.sh m09_digital_archaeology | sed -n 's/^GAME_ID=//p'); [ -n "$GID" ] || exit 1
echo $GID > ${P}_game_id.txt
tools/phone_calls/open.sh $GID ${P}_session.jsonl ${P}_tts.jsonl true >/dev/null
shot() { $S $GID "{\"cmd\":\"screenshot\",\"path\":\"${P}_$1.png\"}" >/dev/null; }
ev() { echo "$2" > ${P}_$1.js; tools/phone_calls/ev.sh $GID ${P}_$1.js | tail -1 | jq -c '.result'; }
emit() { ev emit "window.gameState.globalVariables['$1'] = true; window.eventDispatcher.emit('global_variable_changed:$1', {name:'$1', value:true}); return true;" >/dev/null; }
state() { ev state "return (window.gameState.notes||[]).filter(x=>(x.title||'').includes('salvage cage')).length + ' salvage notes | ' + ['flag1_read_heard','ledger_guide_offered','ledger_read_heard','stacks_entered'].map(k=>k+'='+window.gameState.globalVariables[k]).join(' ');"; }
thread() { $S $GID '{"cmd":"mg","action":"getState"}' | tail -1 | python3 -c "import sys,json; t=json.loads(sys.stdin.read())['result'].get('text',''); print('   thread: Tomb Beta x'+str(t.count('Tomb Beta'))+' | HL2015 x'+str(t.count('HL2015'))+' | tail:', t[-$1:].replace(chr(10),' / '))"; }
open_hax() { $S $GID '{"cmd":"openInventoryItem","item":"phone"}' >/dev/null; sleep 2; $S $GID '{"cmd":"mg","action":"clickText","args":["HaX"]}' >/dev/null; sleep ${1:-8}; }
close() { $S $GID '{"cmd":"mg","action":"clickText","args":["Close"]}' >/dev/null 2>&1; sleep 1; }
finish() { # answer choice 1 until the phone closes
  for i in 1 2 3 4; do $S $GID '{"cmd":"mg","action":"getState"}' | tail -1 | grep -q '"available":false' && break
    $S $GID '{"cmd":"mg","action":"choose","args":[1]}' >/dev/null; sleep 7; done; }
beat() { # beat <name> <toast wait> <wait after close>
  echo "== $1: toast, open, close at the first choice"; sleep $2
  open_hax 12; shot "$1_1_first_choice"; thread 200; close
  echo "== $1: wait for the global to flip"; [ -n "$4" ] && ev set "$4" >/dev/null; sleep $3; state
  echo "== $1: reopen"; open_hax 8; shot "$1_2_reopen_choices"; thread 300
  finish; shot "$1_3_finished"; thread 400; close; state
  echo "== $1: reopen again (hub expected)"; open_hax 6; shot "$1_4_reopen_hub"; thread 250; close
}
emit flag1_submitted
beat flag1 8 22
emit flag2_submitted
beat ledger 8 4 "window.gameState.globalVariables['stacks_entered']=true; return true;"
$S $GID '{"cmd":"quit"}' 20 >/dev/null
echo $GID
