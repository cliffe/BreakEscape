#!/bin/bash
# PS R3: m03 hub calls show the contact callLabel ("SAFETYNET secure line") on the call screen.
#   PC_PORT=3023 OUT=docs/agents/phone_calls/proofs/PS_m01_m03 docs/agents/phone_calls/proofs/PS_m01_m03/m03_caption.sh
source /home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-phone-calls/tools/phone_calls/routes/m10_lib.sh
SC=m03_ghost_in_the_machine
cap() { a2b_ev "const c=document.querySelector('.call-caption'); return {caption: c?c.innerText:null, bar:(document.getElementById('call-status-bar')||{}).innerText};"; }
close_brief() { for i in 1 2 3 4 5 6; do r=$(a2b_ev "const m=window.MinigameFramework.currentMinigame; if(!m) return 'none'; const b=[...document.querySelectorAll('button')].find(x=>/End Conversation/.test(x.innerText)); if(b){b.click(); return 'closed briefing';} try{m.complete(false);}catch(e){} return 'closed';"); echo "$r" | grep -q none && break; sleep 3; done; a2b_ev "const b=[...document.querySelectorAll('button')].find(x=>/NO, I.LL FIGURE/.test(x.innerText)); if(b&&b.offsetParent){b.click();} return 1;" >/dev/null; sleep 1; }
# 1. revelation hub topic call
m10_open cap_topic $SC; close_brief
a2b_ev "window.eventDispatcher.emit('objective_task_completed:submit_distcc_flag', {taskId:'submit_distcc_flag'}); return true;" >/dev/null; sleep 6
open_phone; open_thread agent_0x99; choose_text "distcc logs"; sleep 1; echo "dialling: $(cap)"; a2b_shot calling
gate wait_screen "$IN_CALL" 40; sleep 2; echo "topic call: $(cap)"; a2b_shot call; a2b_quit
# 2. bring-in hub call
m10_open cap_bring $SC --set victoria_ko=true --set night_confrontation_ready=true --set revelation_heard=true --set flag_distcc_submitted=true --set flag_scan_submitted=true --set flag_ftp_submitted=true --set flag_http_submitted=true --set victoria_fate=ko --set exec_wing_night=true --set night_explored=true --set clone_call_done=true; close_brief
open_phone; open_thread agent_0x99; choose_text "Bring me in"; sleep 1; echo "dialling: $(cap)"
gate wait_screen "$IN_CALL" 40; sleep 2; echo "bring-in call: $(cap)"; a2b_shot call; a2b_quit
