#!/bin/bash
# M8 R1 live proofs (keyless :3027): the tutorial holds the ring; the tour text follows the call.
#   PC_PORT=3027 tools/phone_calls/routes/m08r1_live.sh tut_accept|tut_skip
# The three openings (answered at once, after 12 s, declined then called back) are m08_live.sh ring_now|ring_slow|ring_decline
# run with OUT=docs/agents/phone_calls/proofs/M8_r1.
export OUT=${OUT:-docs/agents/phone_calls/proofs/M8_r1}
source "$(dirname "${BASH_SOURCE[0]}")/m10_lib.sh"
LOGEV="window.__ev=[]; for (const n of ['conversation_closed:agent_0x99','phone_call_answered:agent_0x99','phone_call_declined:agent_0x99','phone_call_missed:agent_0x99']) window.eventDispatcher.on(n, ()=>window.__ev.push(n+'@'+Math.round(performance.now()/100)/10)); window.confirm=()=>true; return true;"
tut() { a2b_ev "const t=window.getTutorialManager(); return {active:t.active, prompt:t.promptOpen, step:t.currentStep, skip: !!document.body.innerText.match(/SKIP TUTORIAL/i)};"; }
bn() { a2b_ev "const b=document.querySelector('.incoming-call'); const c=window.phoneRinger.current(); return {banner: b?b.innerText.replace(/\n+/g,' | '):null, ringer: c?c.state:null, queued: window.phoneRinger.queueLength()};"; }
msgs() { a2b_ev "return (window.npcManager.getConversationHistory('agent_0x99')||[]).map(m=>(m.type||'')+': '+String(m.text).slice(0,70));"; }
mkdir -p "$OUT"; LABEL=$1
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
