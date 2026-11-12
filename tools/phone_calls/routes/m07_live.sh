#!/bin/bash
# M7 live proofs: m03 revelation call, two-minute fallback ring, bring-in (plan 8, M7). Real hub choices, real call screen.
#   PC_PORT=3029 tools/phone_calls/routes/m07_live.sh call_button|hub_topic|fallback_ring|reload_ring|bring_clear|bring_optional
# The distcc flag is raised by emitting objective_task_completed:submit_distcc_flag (the real mapping chain runs from there:
# the text, flag_distcc_submitted, the ring mapping); the VM flag submission itself needs a VM.
export OUT=${OUT:-docs/agents/phone_calls/proofs/M7}
source "$(dirname "${BASH_SOURCE[0]}")/m10_lib.sh"
SC=m03_ghost_in_the_machine
LOGEV="window.__ev=[]; for (const n of ['conversation_closed:agent_0x99','global_variable_changed:revelation_heard','global_variable_changed:start_debrief_cutscene','global_variable_changed:victoria_choice_made','phone_call_missed','phone_call_answered','minigame_completed','objective_task_completed:call_in_after_sweep']) window.eventDispatcher.on(n, (d)=>window.__ev.push(n+'@'+Math.round(performance.now()/100)/10)); return true;"
evs() { a2b_ev "return window.__ev;"; }
distcc() { a2b_ev "window.eventDispatcher.emit('objective_task_completed:submit_distcc_flag', {taskId:'submit_distcc_flag'}); return window.gameState.globalVariables.flag_distcc_submitted;"; }
ringer() { a2b_ev "const c=window.phoneRinger.current(); const b=document.querySelector('.incoming-call'); return {cur:c?{npc:c.npcId,state:c.state,knot:c.knot}:null, banner:b?b.innerText.replace(/\n+/g,' | '):null, pending:(window.phoneRinger.pendingTimers&&window.phoneRinger.pendingTimers())||undefined};"; }
call_up() { gate wait_screen "$IN_CALL && document.querySelectorAll('.choice-button').length>0" ${1:-40}; }
end_call() { a2b_ev "const b=document.getElementById('call-end-button'); if(!b) return 'no End'; b.click(); return 'End pressed';"; }
# the opening briefing person-chat and the mission-brief notes popup are up after autoBrief: close them
close_brief() { for i in 1 2 3 4 5 6 7 8; do r=$(a2b_ev "const m=window.MinigameFramework.currentMinigame; if(!m) return 'none'; const b=[...document.querySelectorAll('button')].find(x=>/End Conversation/.test(x.innerText)); if(b){b.click(); return 'closed briefing';} try{m.complete(false);}catch(e){} return 'closed '+m.constructor.name;"); echo "  close_brief: $r"; echo "$r" | grep -q none && break; sleep 3; done; a2b_ev "const b=[...document.querySelectorAll('button')].find(x=>/NO, I.LL FIGURE/.test(x.innerText)); if(b&&b.offsetParent){b.click(); return 'declined tutorial';} return 'no tutorial prompt';"; sleep 1; }
# phone and thread, retrying the phone once if the contact list did not draw
open_hax() { open_phone; r=$(open_thread agent_0x99); echo "$r" | grep -q opened || { sleep 3; open_phone; r=$(open_thread agent_0x99); }; echo "$r"; }
header_call() { a2b_ev "const b=document.querySelector('.call-button'); if(!b) return 'no header button'; b.click(); return 'header: '+b.innerText.trim();"; }
tasks() { a2b_ev "return window.objectivesManager.aims.flatMap(a=>a.tasks).filter(t=>['call_in_after_sweep','copy_staff_badge','danny_choice_made','decode_directive','zero_detection','submit_distcc_flag','decode_distcc_logs','find_operational_logs'].includes(t.taskId)).map(t=>t.taskId+':'+t.status);"; }
run_revelation() {
  press_when "Phase" 60 2>/dev/null || true
}
# play the revelation call to its end, pressing whichever choice shows
drive_call() {
  for i in $(seq 1 12); do
    a2b_ev "return $IN_CALL;" | grep -qx true || break
    n=$(a2b_ev "return document.querySelectorAll('.choice-button').length;")
    if [ "$n" != "0" ]; then
      echo "  choices: $(screen | jq -c '.choices')"; sleep 3
      a2b_ev "const b=document.querySelector('.choice-button'); if(b) b.click(); return 'first choice';" >/dev/null
    fi
    sleep 4
  done
}
case $1 in
call_button)
  m10_open call_button $SC; close_brief; a2b_ev "$LOGEV" >/dev/null
  echo "distcc raised: $(distcc)"; sleep 6
  open_hax; echo "thread: $(screen)"; a2b_shot thread
  echo "header call: $(header_call)"; sleep 1; echo "dialling: $(screen | jq -c '{bar}')"; a2b_shot calling
  call_up; echo "call: $(screen)"; a2b_shot call
  drive_call
  gate wait_screen "!document.getElementById('call-end-button')" 90; sleep 3
  echo "after call: mg=$(mgc) revelation_heard=$(glob revelation_heard) rows=$(rows agent_0x99)"; echo "thread: $(screen | jq -c '{choices,header}')"; a2b_shot after_call
  echo "ringer now: $(ringer)"
  echo "waiting 125 s: the fallback ring must not come (row 31 / revelation_heard)"; sleep 125; echo "ringer after 125 s: $(ringer)"
  echo "handler /tts: $(jq -c 'select((.npc_id // .npcId)=="agent_0x99") | .text' $OUT/${LABEL}_tts.jsonl | tr '\n' ' ')"; evs; a2b_quit ;;
hub_topic)
  m10_open hub_topic $SC; close_brief; a2b_ev "$LOGEV" >/dev/null
  echo "distcc raised: $(distcc)"; sleep 6
  open_hax; echo "hub: $(screen)"; a2b_shot hub
  choose_text "distcc logs" >/dev/null; sleep 1; echo "dialling: $(screen | jq -c '{bar,thread}')"; a2b_shot calling
  call_up; echo "call: $(screen)"; a2b_shot call
  drive_call
  gate wait_screen "!document.getElementById('call-end-button')" 90; sleep 3
  echo "after call: revelation_heard=$(glob revelation_heard) rows=$(rows agent_0x99)"; echo "thread: $(screen | jq -c '{choices,header}')"
  echo "ringer: $(ringer)"
  echo "handler /tts: $(jq -c 'select((.npc_id // .npcId)=="agent_0x99") | .text' $OUT/${LABEL}_tts.jsonl | tr '\n' ' ')"; evs; a2b_quit ;;
fallback_ring)
  m10_open fallback_ring $SC; close_brief; a2b_ev "$LOGEV" >/dev/null
  T0=$(date +%s); echo "distcc raised: $(distcc)"
  sleep 100; echo "t=100s ringer: $(ringer)"
  for i in $(seq 1 40); do a2b_ev "return !!document.querySelector('.incoming-call');" | grep -qx true && break; sleep 2; done
  echo "ring appeared at t=$(( $(date +%s) - T0 )) s: $(ringer)"; a2b_shot banner
  a2b_decline >/dev/null; sleep 3; echo "after decline: $(ringer) missed-rows=$(rows agent_0x99)"
  open_hax; echo "thread: $(screen | jq -c '{header,thread}')"; a2b_shot thread_after_decline
  echo "header call: $(header_call)"; call_up; echo "callback call: $(screen | jq -c '{bar,subs,choices}')"; a2b_shot callback_call
  echo "handler /tts: $(jq -c 'select((.npc_id // .npcId)=="agent_0x99") | .text' $OUT/${LABEL}_tts.jsonl | tr '\n' ' ')"; evs; a2b_quit ;;
reload_ring)
  m10_open reload_ring $SC; close_brief; a2b_ev "$LOGEV" >/dev/null
  echo "distcc raised: $(distcc)"; sleep 20
  T0=$(date +%s); reload; sleep 3
  echo "after reload: distcc=$(glob flag_distcc_submitted) heard=$(glob revelation_heard) ringer=$(ringer)"
  close_brief; a2b_ev "$LOGEV" >/dev/null
  for i in $(seq 1 70); do a2b_ev "return !!document.querySelector('.incoming-call');" | grep -qx true && break; sleep 2; done
  echo "ring appeared $(( $(date +%s) - T0 )) s after the reload: $(ringer)"; a2b_shot banner
  a2b_ev "const b=document.querySelector('.incoming-call-answer'); if(b) b.click(); return 'answered';" >/dev/null; call_up; echo "answered: $(screen | jq -c '{bar,subs,choices}')"; a2b_shot answered
  echo "handler /tts: $(jq -c 'select((.npc_id // .npcId)=="agent_0x99") | .text' $OUT/${LABEL}_tts.jsonl | tr '\n' ' ')"; evs; a2b_quit ;;
bring_clear|bring_optional)
  DONE_OPT="--complete-task copy_staff_badge --complete-task danny_choice_made --complete-task decode_directive --complete-task zero_detection"
  EXTRA="$DONE_OPT"; [ $1 = bring_optional ] && EXTRA="--complete-task copy_staff_badge"  # leaves danny_choice_made and decode_directive open
  m10_open $1 $SC --set victoria_ko=true --set night_confrontation_ready=true --set revelation_heard=true --set flag_distcc_submitted=true --set flag_scan_submitted=true --set flag_ftp_submitted=true --set flag_http_submitted=true --set victoria_fate=ko --set exec_wing_night=true --set night_explored=true --set clone_call_done=true $EXTRA; close_brief; a2b_ev "$LOGEV" >/dev/null
  echo "optional open: $(a2b_ev "return window.endingCheck.openOptional().map(t=>t.taskId);")"; echo "tasks: $(tasks)"
  open_hax; echo "hub: $(screen | jq -c '{choices,header}')"; a2b_shot hub
  choose_text "Bring me in" >/dev/null; sleep 1; echo "dialling: $(screen | jq -c '{bar}')"; a2b_shot calling
  call_up; echo "call: $(screen | jq -c '{bar,subs,choices}')"; a2b_shot call
  press_when "Not yet"; sleep 3
  echo "after Not yet: mg=$(mgc) call-open=$(a2b_ev "return $IN_CALL;") debrief=$(glob start_debrief_cutscene) task=$(tasks | jq -c '.[0]')"; a2b_shot not_yet
  open_hax; echo "hub again: $(screen | jq -c '{choices}')"
  choose_text "Bring me in" >/dev/null; call_up; echo "redial: $(screen | jq -c '{subs,choices}')"; a2b_shot redial
  press_when "Bring me in"; echo "confirm: $(screen | jq -c '{subs,choices}')"; a2b_shot confirm
  echo "task now: $(tasks | jq -c '.[0]')"
  choose_text "On my way" >/dev/null; sleep 2
  echo "overlay: $(ending_overlay)"; a2b_shot after_on_my_way
  if [ $1 = bring_optional ]; then
    echo "handler /tts before Keep going: $(jq -c 'select((.npc_id // .npcId)=="agent_0x99") | .text' $OUT/${LABEL}_tts.jsonl | tr '\n' ' ')"
    click_overlay "Keep going" >/dev/null; sleep 2
    echo "after Keep going: call-open=$($S $GID '{"cmd":"noop"}' >/dev/null 2>&1; a2b_ev "return $IN_CALL;") choices=$(screen | jq -c '.choices') debrief=$(glob start_debrief_cutscene) mission_complete=$(glob mission_complete)"; a2b_shot kept_going
    echo "handler /tts after Keep going: $(jq -c 'select((.npc_id // .npcId)=="agent_0x99") | .text' $OUT/${LABEL}_tts.jsonl | tr '\n' ' ')"
    end_call >/dev/null; sleep 4; echo "after End: mg=$(mgc) debrief=$(glob start_debrief_cutscene)"; echo "thread: $(screen | jq -c '{choices}')"; a2b_shot after_end
    open_hax; choose_text "Bring me in" >/dev/null; call_up; echo "second redial: $(screen | jq -c '{subs,choices}')"
    press_when "Bring me in"; choose_text "On my way" >/dev/null; sleep 2
    echo "overlay again: $(ending_overlay)"; a2b_shot overlay_again
    click_overlay "End the mission" >/dev/null; sleep 3; echo "after End the mission: $(screen | jq -c '{subs}') debrief=$(glob start_debrief_cutscene)"
    gate wait_screen "!document.getElementById('call-end-button')" 40; sleep 4
    echo "after call: debrief=$(glob start_debrief_cutscene) mg=$(mgc)"; a2b_shot debrief
  else
    gate wait_screen "!document.getElementById('call-end-button')" 40; sleep 4
    echo "after call: debrief=$(glob start_debrief_cutscene) mg=$(mgc) victoria_choice_made=$(glob victoria_choice_made)"; a2b_shot debrief
    sleep 6; echo "debrief later: mg=$(mgc)"; a2b_shot debrief2
  fi
  echo "handler /tts: $(jq -c 'select((.npc_id // .npcId)=="agent_0x99") | .text' $OUT/${LABEL}_tts.jsonl | tr '\n' ' ')"; evs; a2b_quit ;;
esac
