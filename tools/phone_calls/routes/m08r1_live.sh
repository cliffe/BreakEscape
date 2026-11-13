#!/bin/bash
# M8 R1 live proofs (keyless :3027): the tutorial holds the ring; the tour text follows the call.
#   PC_PORT=3027 tools/phone_calls/routes/m08r1_live.sh tut_accept|tut_skip
# M8 R2 (keyless :3026): quick_cb (decline, call back within 3 s, tour text must not land mid-call), order_answer,
#   order_decline, order_miss (tour count 1 at the end of each); the bring-in cases are m08_live.sh bring_keep|bring_end
#   and the "SAFETYNET secure line" caption check is in m08_live.sh bring_end (OUT=docs/agents/phone_calls/proofs/M8_r2).
# The three openings (answered at once, after 12 s, declined then called back) are m08_live.sh ring_now|ring_slow|ring_decline
# run with OUT=docs/agents/phone_calls/proofs/M8_r1.
export OUT=${OUT:-docs/agents/phone_calls/proofs/M8_r1}
source "$(dirname "${BASH_SOURCE[0]}")/m10_lib.sh"
LOGEV="window.__ev=[]; for (const n of ['conversation_closed:agent_0x99','phone_call_answered:agent_0x99','phone_call_declined:agent_0x99','phone_call_missed:agent_0x99']) window.eventDispatcher.on(n, ()=>window.__ev.push(n+'@'+Math.round(performance.now()/100)/10)); window.confirm=()=>true; return true;"
tut() { a2b_ev "const t=window.getTutorialManager(); return {active:t.active, prompt:t.promptOpen, step:t.currentStep, skip: !!document.body.innerText.match(/SKIP TUTORIAL/i)};"; }
bn() { a2b_ev "const b=document.querySelector('.incoming-call'); const c=window.phoneRinger.current(); return {banner: b?b.innerText.replace(/\n+/g,' | '):null, ringer: c?c.state:null, queued: window.phoneRinger.queueLength()};"; }
msgs() { a2b_ev "return (window.npcManager.getConversationHistory('agent_0x99')||[]).map(m=>(m.type||'')+': '+String(m.text).slice(0,70));"; }
mkdir -p "$OUT"; LABEL=$1
tourn() { a2b_ev "return (window.npcManager.getConversationHistory('agent_0x99')||[]).filter(m=>/get a feel for the place/.test(m.text)).length;"; }
callout() { a2b_ev "return {inCall: !!document.getElementById('call-end-button'), bar: (document.getElementById('call-status-bar')||{}).innerText, tourRows: (window.npcManager.getConversationHistory('agent_0x99')||[]).filter(m=>/get a feel for the place/.test(m.text)).length, thread: [...document.querySelectorAll('.message-bubble, .message')].map(x=>x.innerText.slice(0,50))};"; }
case $1 in
caption)  # the bring-in call placed from her hub carries the contact-level callLabel
  source "$(dirname "${BASH_SOURCE[0]}")/m10_lib.sh"
  m10_open caption m01_first_contact --complete-task access_main_office --set first_contact=false --set entropy_reveal_read=true --set player_launched_attack=true
  open_phone; open_thread agent_0x99; choose_text "ready for debrief" >/dev/null; sleep 1
  gate wait_screen "$IN_CALL" 40; echo "call screen text: $(a2b_ev "const r=document.querySelector('.phone-chat-minigame, .call-screen')||document.body; return r.innerText.replace(/\\n+/g,' | ').slice(0,300);")"
  echo "label elements: $(a2b_ev "return [...document.querySelectorAll('[class*=call]')].map(e=>e.className+'='+e.innerText.slice(0,40)).filter(x=>/secure|Voice/i.test(x));")"
  a2b_shot call; a2b_quit; exit 0 ;;
quick_cb|order_answer|order_decline|order_miss)
  GID=$(tools/phone_calls/newgame.sh m01_first_contact --unlock main_office_area | sed -n 's/^GAME_ID=//p'); echo "$GID" > "$OUT/${LABEL}_game_id.txt"
  tools/phone_calls/session-start.sh --url "http://127.0.0.1:$PC_PORT/break_escape/games/$GID" --headless true --log "$OUT/${LABEL}_session.jsonl" --tts-log "$OUT/${LABEL}_tts.jsonl" 2>&1 | tail -1
  $S $GID '{"cmd":"bootstrap","tutorial":"skip","resume":"new","autoBrief":true}' 120 | cut -c1-200
  a2b_ev "$LOGEV" >/dev/null; sleep 3
  $S $GID '{"cmd":"enter","room":"main_office_area"}' 60 | jq -c '{ok,reason}'
  gate wait_screen "!!document.querySelector('.incoming-call')" 40; echo "banner: $(bn)"
  case $1 in
  order_answer) a2b_answer; gate wait_screen "$IN_CALL" 20; sleep 4; press_when "Texts it is"; sleep 4
    gate wait_screen "!document.getElementById('call-end-button')" 30; sleep 5 ;;
  order_miss) for i in $(seq 1 60); do a2b_ev "return !document.querySelector('.incoming-call');" | grep -qx true && break; sleep 2; done
    echo "banner gone after ~$((i*2)) s: $(bn)"; sleep 5 ;;
  order_decline) a2b_decline; sleep 5; echo "after decline: tour rows=$(tourn)" ;;
  quick_cb) a2b_decline; T0=$(date +%s.%N)
    if [ -n "$FAST" ]; then $S $GID '{"cmd":"openInventoryItem","item":"phone"}' >/dev/null; open_thread agent_0x99   # FAST=1: no settle sleep, so the call-back follows within about 3 s
    else open_phone; open_thread agent_0x99; fi
    a2b_ev "const b=document.querySelector('.call-button'); if(!b) return 'no header button'; b.click(); return 'header: '+b.innerText;"
    echo "called back $(echo "$(date +%s.%N) - $T0" | bc) s after decline"
    for i in 1 2 3 4 5 6 7 8; do echo "t+${i}s ($(echo "$(date +%s.%N) - $T0" | bc | cut -c1-4) s after decline): $(callout | jq -c '{inCall,tourRows}')"; sleep 1; done
    a2b_shot midcall; echo "call screen: $(screen | jq -c '{subs,choices}')"
    press_when "Texts it is"; sleep 4
    gate wait_screen "!document.getElementById('call-end-button')" 30; sleep 5 ;;
  esac
  echo "thread: $(msgs)"; echo "tour rows=$(tourn)"; a2b_ev "return window.__ev;"; a2b_shot end; a2b_quit; exit 0 ;;
esac
GID=$(tools/phone_calls/newgame.sh m01_first_contact --unlock main_office_area | sed -n 's/^GAME_ID=//p'); echo "$GID" > "$OUT/${LABEL}_game_id.txt"
tools/phone_calls/session-start.sh --url "http://127.0.0.1:$PC_PORT/break_escape/games/$GID" --headless true --log "$OUT/${LABEL}_session.jsonl" --tts-log "$OUT/${LABEL}_tts.jsonl" 2>&1 | tail -1
$S $GID '{"cmd":"bootstrap","tutorial":"accept","resume":"new","autoBrief":true}' 120 | cut -c1-300
a2b_ev "$LOGEV" >/dev/null
sleep 3; echo "after bootstrap: $(tut) mg=$(mgc)"; a2b_shot start
$S $GID '{"cmd":"enter","room":"main_office_area"}' 60 | jq -c '{ok,reason}'; echo "entered, t=0"
for t in 4 9 14; do sleep 5; echo "t~$t s: tut=$(tut) ring=$(bn)"; done; a2b_shot during_tutorial
case $1 in
tut_accept) a2b_ev "window.getTutorialManager().complete(); return 'tutorial completed';" ;;
tut_skip) a2b_ev "window.getTutorialManager().skip(); return 'tutorial skipped';" ;;
esac
sleep 1; echo "just after end: tut=$(tut) ring=$(bn)"
gate wait_screen "!!document.querySelector('.incoming-call')" 40; echo "banner: $(bn)"; a2b_shot banner_after_tutorial
a2b_answer; gate wait_screen "$IN_CALL" 20; sleep 4; echo "call: $(screen | jq -c '{subs,choices}')"; a2b_shot call
press_when "Texts it is"; sleep 4
gate wait_screen "!document.getElementById('call-end-button')" 30; sleep 5
echo "thread after call (tour expected): $(msgs)"; a2b_ev "return window.__ev;"; a2b_shot thread_after
a2b_quit
