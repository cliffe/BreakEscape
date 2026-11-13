#!/bin/bash
# M10 live proofs: m06 fund call and bring-in, m08 door audit (plan 8, M10). Real hub choices, real call screen.
#   PC_PORT=3026 tools/phone_calls/routes/m10_live.sh m06_fund|m06_bring_clear|m06_bring_optional|m06_reload|m08_audit|m08_reload
export OUT=${OUT:-docs/agents/phone_calls/proofs/M10}
source "$(dirname "${BASH_SOURCE[0]}")/m10_lib.sh"
M6="--set guard_resolved=true --set first_contact=false"
M6_READY="$M6 --set assets_decided=true --set irina_fate_decided=true --set flag1_submitted=true --set flag2_submitted=true --set flag3_submitted=true --set flag4_submitted=true --set ready_to_extract=true --set architect_identity_found=true"
M8="--set first_call=false --set netherton_hostile=true --set found_badge_audit=true --set found_timeline=true"
LOGEV="window.__ev=[]; for (const n of ['conversation_closed:agent_0x99_handler','conversation_closed:agent_0x99','global_variable_changed:start_debrief_cutscene','global_variable_changed:mole_identified','global_variable_changed:reacted_fund','minigame_completed','objective_task_completed:call_in_after_sweep','objective_task_completed:name_the_mole']) window.eventDispatcher.on(n, ()=>window.__ev.push(n+'@'+Math.round(performance.now()/100)/10)); return true;"
evs() { a2b_ev "return window.__ev;"; }
end_call() { a2b_ev "const b=document.getElementById('call-end-button'); if(!b) return 'no End'; b.click(); return 'End pressed';"; }
# wait for the call screen to show a choice list
call_up() { gate wait_screen "$IN_CALL && document.querySelectorAll('.choice-button').length>0" ${1:-40}; }
case $1 in
m06_fund)
  m10_open m06_fund m06_follow_the_money $M6 --set fund_debrief_available=true --set found_architects_fund=true; a2b_ev "$LOGEV" >/dev/null
  open_phone; open_thread agent_0x99_handler; echo "hub: $(screen)"; a2b_shot hub
  choose_text "Architect" >/dev/null; sleep 1; echo "dialling: $(screen | jq -c '{bar,thread}')"; a2b_shot calling
  call_up; echo "call: $(screen)"; a2b_shot call
  press_when "advances already"; sleep 3; echo "mid-call: $(screen | jq -c '{subs,choices}')"; a2b_shot call_mid
  # an early hang-up keeps the hub choice (writer R1 M5): the call can be replayed
  end_call >/dev/null; sleep 4; echo "after End: rows=$(rows agent_0x99_handler) mg=$(mgc)"; echo "thread: $(screen | jq -c '{choices}')"; a2b_shot hub_after_end
  choose_text "Architect" >/dev/null; call_up; echo "second call: $(screen | jq -c '{subs,choices}')"
  press_when "projection"; press_when "recommend" 40; sleep 3
  echo "end of call: $(screen | jq -c '{bar,subs,choices}')"; a2b_shot call_end
  gate wait_screen "!document.getElementById('call-end-button')" 60; sleep 2
  echo "after call: mg=$(mgc) rows=$(rows agent_0x99_handler)"; echo "thread: $(screen | jq -c '{choices,header}')"; a2b_shot hub_final
  tts_log; evs; a2b_quit ;;
m06_bring_clear|m06_bring_optional)
  EXTRA=""; [ $1 = m06_bring_optional ] && EXTRA="--complete-task meet_irina"
  m10_open $1 m06_follow_the_money $M6_READY $EXTRA; a2b_ev "$LOGEV" >/dev/null
  echo "optional open: $(a2b_ev "return window.endingCheck.openOptional().map(t=>t.taskId);")"
  open_phone; open_thread agent_0x99_handler; echo "hub: $(screen | jq -c '{choices,header}')"; a2b_shot hub
  choose_text "Bring me in" >/dev/null; sleep 1; echo "dialling: $(screen | jq -c '{bar}')"; a2b_shot calling
  call_up; echo "call: $(screen | jq -c '{bar,subs,choices}')"; a2b_shot call
  press_when "Not yet"; sleep 3
  echo "after Not yet: mg=$(mgc) call-open=$(a2b_ev "return !!document.getElementById('call-end-button');") debrief=$(a2b_ev "return window.gameState.globalVariables.start_debrief_cutscene;")"; a2b_shot not_yet
  open_phone; open_thread agent_0x99_handler; echo "hub again: $(screen | jq -c '{choices}')"
  choose_text "Bring me in" >/dev/null; call_up; echo "redial: $(screen | jq -c '{subs,choices}')"
  press_when "Bring me in"; echo "confirm: $(screen | jq -c '{subs,choices}')"; a2b_shot confirm
  choose_text "On my way" >/dev/null; sleep 2
  echo "overlay: $(ending_overlay)"; a2b_shot after_on_my_way
  if [ $1 = m06_bring_optional ]; then
    click_overlay "Keep going" >/dev/null; sleep 2
    echo "after Keep going: call-open=$(a2b_ev "return !!document.getElementById('call-end-button');") choices=$(screen | jq -c '.choices') debrief=$(a2b_ev "return window.gameState.globalVariables.start_debrief_cutscene;") task=$(a2b_ev "return window.objectivesManager.aims.flatMap(a=>a.tasks).filter(t=>t.taskId==='call_in_after_sweep').map(t=>t.status);")"; a2b_shot kept_going
    echo "tts so far (agent_0x99_handler): $(jq -c 'select((.npc_id // .npcId)=="agent_0x99_handler") | .text' $OUT/${LABEL}_tts.jsonl | tr '\n' ' ')"
    end_call >/dev/null; sleep 4; echo "after End: mg=$(mgc) debrief=$(a2b_ev "return window.gameState.globalVariables.start_debrief_cutscene;") ending=$(a2b_ev "return !!window.endingCheck.hasHeld && window.endingCheck.hasHeld();")"; echo "thread: $(screen | jq -c '{choices}')"; a2b_shot after_end
  else
    gate wait_screen "!document.getElementById('call-end-button')" 40; sleep 4
    echo "after call: debrief=$(a2b_ev "return window.gameState.globalVariables.start_debrief_cutscene;") mg=$(mgc) task=$(a2b_ev "return window.objectivesManager.aims.flatMap(a=>a.tasks).filter(t=>t.taskId==='call_in_after_sweep').map(t=>t.status);")"; a2b_shot debrief
    sleep 6; echo "debrief later: mg=$(mgc)"; a2b_shot debrief2
  fi
  tts_log | cut -c1-100; echo "handler /tts: $(jq -c 'select((.npc_id // .npcId)=="agent_0x99_handler") | .text' $OUT/${LABEL}_tts.jsonl | tr '\n' ' ')"; evs; a2b_quit ;;
m06_reload)
  m10_open m06_reload m06_follow_the_money $M6_READY --set fund_debrief_available=true --set found_architects_fund=true; a2b_ev "$LOGEV" >/dev/null
  for CALL in Architect "Bring me in"; do
    open_phone; open_thread agent_0x99_handler; choose_text "$CALL" >/dev/null; call_up
    echo "[$CALL] mid-call: $(screen | jq -c '{bar,choices}') knot=$(a2b_ev "return window.npcManager.getNPC('agent_0x99_handler').currentKnot;")"; a2b_shot ${CALL%% *}_before_reload
    reload; sleep 3
    echo "[$CALL] after reload: mg=$(mgc) call-open=$(a2b_ev "return !!document.getElementById('call-end-button');") ringer=$(a2b_ev "const c=window.phoneRinger.current(); return c?{npc:c.npcId,state:c.state}:null;") knot=$(a2b_ev "return window.npcManager.getNPC('agent_0x99_handler').currentKnot;") rows=$(rows agent_0x99_handler)"
    open_phone; open_thread agent_0x99_handler; echo "[$CALL] thread: $(screen | jq -c '{choices}')"; a2b_shot ${CALL%% *}_after_reload
    a2b_ev "const m=window.MinigameFramework.currentMinigame; if(m) m.complete(false); return 'closed';" >/dev/null; sleep 1
  done
  a2b_quit ;;
m08_audit)
  m10_open m08_audit m08_the_mole $M8; a2b_ev "$LOGEV" >/dev/null
  place() { open_phone; open_thread agent_0x99; echo "hub: $(screen | jq -c '{choices,header}')"; choose_text "name the leak" >/dev/null; sleep 1; echo "dialling: $(screen | jq -c '{bar}')"; call_up; }
  endwait() { gate wait_screen "!document.getElementById('call-end-button')" 40; sleep 3; echo "after call: mg=$(mgc) rows=$(rows agent_0x99) mole=$(a2b_ev "return window.gameState.globalVariables.mole_identified;")"; }
  place; a2b_shot call1; echo "call 1: $(screen | jq -c '{subs,choices}')"
  press_when "10:15"; endwait; echo "thread: $(screen | jq -c '{choices}')"; a2b_shot hub_after_wrong1
  place; echo "call 2 (redial): $(screen | jq -c '{subs,choices}')"; press_when "10:38"; echo "who: $(screen | jq -c '{subs,choices}')"; a2b_shot who
  press_when "Vector"; endwait; echo "thread: $(screen | jq -c '{choices}')"; a2b_shot hub_after_wrong2
  place; echo "call 3: $(screen | jq -c '{subs,choices}')"; press_when "10:38"; press_when "Nightshade"; endwait; a2b_shot right
  echo "thread: $(screen | jq -c '{choices}')"; echo "task: $(a2b_ev "return window.objectivesManager.aims.flatMap(a=>a.tasks).filter(t=>t.taskId==='name_the_mole').map(t=>t.status);")"
  echo "handler /tts: $(jq -c 'select((.npc_id // .npcId)=="agent_0x99") | .text' $OUT/${LABEL}_tts.jsonl | tr '\n' ' ')"; evs; a2b_quit ;;
m08_reload)
  m10_open m08_reload m08_the_mole $M8; a2b_ev "$LOGEV" >/dev/null
  open_phone; open_thread agent_0x99; choose_text "name the leak" >/dev/null; call_up; press_when "10:38"
  echo "mid-call: $(screen | jq -c '{bar,subs:.subs[-2:],choices}') knot=$(a2b_ev "return window.npcManager.getNPC('agent_0x99').currentKnot;")"; a2b_shot before_reload
  reload; sleep 3
  echo "after reload: mg=$(mgc) call-open=$(a2b_ev "return !!document.getElementById('call-end-button');") ringer=$(a2b_ev "const c=window.phoneRinger.current(); return c?{npc:c.npcId,state:c.state}:null;") knot=$(a2b_ev "return window.npcManager.getNPC('agent_0x99').currentKnot;") rows=$(rows agent_0x99)"
  open_phone; open_thread agent_0x99; echo "thread: $(screen | jq -c '{choices}')"; a2b_shot after_reload
  choose_text "name the leak" >/dev/null; call_up; echo "redial: $(screen | jq -c '{subs,choices}')"; a2b_shot redial
  a2b_quit ;;
esac
