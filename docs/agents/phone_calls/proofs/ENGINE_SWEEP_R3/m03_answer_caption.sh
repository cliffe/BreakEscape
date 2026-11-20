#!/bin/bash
# Engine sweep R3: m03 HaX revelation ring (the distcc flag event, as PS_m01_m03/m03_caption.sh raises it), answered,
# then screenshotted at once. The ring has delayMs 120000, so the route waits up to 150 s. caption_raf_pre.js logs #call-caption on the first painted frames of the call screen.
#   PC_PORT=3027 OUT=docs/agents/phone_calls/proofs/ENGINE_SWEEP_R3 bash .../m03_answer_caption.sh
source tools/phone_calls/routes/m10_lib.sh
SC=m03_ghost_in_the_machine
close_brief() { for i in 1 2 3 4 5 6; do r=$(a2b_ev "const m=window.MinigameFramework.currentMinigame; if(!m) return 'none'; const b=[...document.querySelectorAll('button')].find(x=>/End Conversation/.test(x.innerText)); if(b){b.click(); return 'closed briefing';} try{m.complete(false);}catch(e){} return 'closed';"); echo "$r" | grep -q none && break; sleep 3; done; a2b_ev "const b=[...document.querySelectorAll('button')].find(x=>/NO, I.LL FIGURE/.test(x.innerText)); if(b&&b.offsetParent){b.click();} return 1;" >/dev/null; sleep 1; }
wr() { for i in $(seq 1 ${2:-40}); do a2b_ev "const c=window.phoneRinger.current(); return !!c && c.npcId==='$1' && c.state==='ringing';" | grep -qx true && return 0; sleep 1; done; return 1; }
m10_open m03_answer $SC; close_brief
a2b_ev "$(cat $OUT/caption_raf_pre.js)" >/dev/null
a2b_ev "window.eventDispatcher.emit('objective_task_completed:submit_distcc_flag', {taskId:'submit_distcc_flag'}); return true;" >/dev/null
echo "waiting for the 120 s revelation ring"; gate wr agent_0x99 150; echo "banner: $(a2b_ev "const b=document.querySelector('.incoming-call'); return b?b.innerText.replace(/\n+/g,' / '):null")"; a2b_shot banner
a2b_ev "const b=document.querySelector('.incoming-call-answer'); if(!b) return 'no answer button'; window.__ansAt=performance.now(); b.click(); return 'answered';"
# The call screen opens ~0.5 s after Answer: poll the bridge until #call-caption is in the page, then shoot at once
for i in $(seq 1 40); do a2b_ev "return !!document.getElementById('call-caption');" | grep -qx true && break; done
a2b_shot answer_first
echo "shot taken by $(a2b_ev "return Math.round(performance.now()-window.__ansAt)") ms after Answer (incl. this query)"
echo "frames: $(a2b_ev "return window.__capf.slice(0,12)")"
echo "mutations: $(a2b_ev "return window.__capm")"
sleep 2; a2b_shot answer_2s; echo "frames at +2 s: $(a2b_ev "return window.__capf.slice(0,12)")"
a2b_quit
