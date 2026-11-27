#!/bin/bash
# M8 live proofs: m01 first ring and bring-in call (plan 8, M8). Real room entry, real call screen.
#   PC_PORT=3027 tools/phone_calls/routes/m08_live.sh ring_now|ring_slow|ring_decline|bring_end|bring_keep|reload_ring|reload_bring
export OUT=${OUT:-docs/agents/phone_calls/proofs/M8}
source "$(dirname "${BASH_SOURCE[0]}")/m10_lib.sh"
LOGEV="window.__ev=[]; for (const n of ['conversation_closed:agent_0x99','phone_call_answered:agent_0x99','phone_call_declined:agent_0x99','phone_call_missed:agent_0x99','global_variable_changed:start_debrief_cutscene','conversation_closed:closing_debrief_person','objective_task_completed:use_launch_device']) window.eventDispatcher.on(n, ()=>window.__ev.push(n+'@'+Math.round(performance.now()/100)/10)); return true;"
evs() { a2b_ev "return window.__ev;"; }
ring_state() { a2b_ev "const c=window.phoneRinger.current(); const b=document.querySelector('.incoming-call'); return {ringer: c?{npc:c.npcId,state:c.state,knot:c.knot}:null, banner: b?b.innerText.replace(/\n+/g,' | '):null, pendingCb: JSON.stringify((window.phoneRinger.pendingCallbacks&&window.phoneRinger.pendingCallbacks())||null)};"; }
end_call() { a2b_ev "const b=document.getElementById('call-end-button'); if(!b) return 'no End'; b.click(); return 'End pressed';"; }
enter_office() { $S $GID '{"cmd":"enter","room":"main_office_area"}' 60 | jq -c '{ok,reason}'; }
open_game() { m10_open "$@"; a2b_ev "$LOGEV" >/dev/null; }
# BR: --set for the bring-in hub choice
BR="--complete-task access_main_office --set first_contact=false --set entropy_reveal_read=true --set player_launched_attack=true"
case $1 in
ring_now|ring_slow|ring_decline)
  open_game $1 m01_first_contact --unlock main_office_area
  echo "start: room=$(a2b_ev "return window.currentPlayerRoom||window.gameState.currentRoom;") mg=$(mgc)"
  enter_office; echo "entered, t=0"; a2b_shot entered
  sleep 8; echo "diag: $(a2b_ev "const c=window.phoneRinger.current(); return {room:window.gameState.currentRoom, cur:c&&{n:c.npcId,s:c.state}, q:window.phoneRinger.queueLength(), mg:window.MinigameFramework.currentMinigame&&window.MinigameFramework.currentMinigame.constructor.name, g:window.gameState.globalVariables.briefing_played};")"
  gate wait_screen "!!document.querySelector('.incoming-call')" 30; echo "banner: $(ring_state)"; a2b_shot banner
  case $1 in
  ring_now)
    a2b_answer; gate wait_screen "$IN_CALL" 20; sleep 4; echo "call: $(screen)"; a2b_shot call
    press_when "Texts it is"; sleep 4; echo "end: $(screen | jq -c '{subs,choices}')"; a2b_shot end
    gate wait_screen "!document.getElementById('call-end-button')" 30; sleep 2; echo "after: mg=$(mgc) rows=$(rows agent_0x99)" ;;
  ring_slow)
    sleep 12; echo "after 12 s: $(ring_state | jq -c .ringer)"; a2b_answer; gate wait_screen "$IN_CALL" 20; sleep 4; echo "call: $(screen)"; a2b_shot call
    press_when "What if I need you fast"; sleep 4; echo "end: $(screen | jq -c '{subs,choices}')"
    gate wait_screen "!document.getElementById('call-end-button')" 30 ;;
  ring_decline)
    a2b_decline; sleep 3; echo "declined: $(ring_state)"; echo "rows=$(rows agent_0x99)"; a2b_shot declined
    open_phone; open_thread agent_0x99; echo "thread: $(screen)"; a2b_shot thread_after_decline
    a2b_ev "const b=document.querySelector('.call-button'); if(!b) return 'no header button'; b.click(); return 'header: '+b.innerText;"; sleep 2
    gate wait_screen "$IN_CALL" 30; sleep 4; echo "callback: $(screen)"; a2b_shot callback
    press_when "Texts it is"; sleep 4
    gate wait_screen "!document.getElementById('call-end-button')" 30; sleep 2; echo "after: mg=$(mgc) rows=$(rows agent_0x99)"; echo "thread: $(screen | jq -c '{thread}')" ;;
  esac
  echo "handler /tts:"; jq -c 'select((.npc_id // .npcId)=="agent_0x99") | .text' $OUT/${LABEL}_tts.jsonl; evs; a2b_quit ;;
bring_end|bring_keep)
  EXTRA=""; [ $1 = bring_keep ] && EXTRA=""
  open_game $1 m01_first_contact $BR
  echo "optional open: $(a2b_ev "return window.endingCheck.openOptional().map(t=>t.taskId);")"
  open_phone; open_thread agent_0x99; echo "hub: $(screen | jq -c '{choices,header}')"; a2b_shot hub
  choose_text "ready for debrief" >/dev/null; sleep 1; echo "dialling: $(screen | jq -c '{bar}')"; a2b_shot calling
  gate wait_screen "$IN_CALL && document.querySelectorAll('.choice-button').length>0" 40; echo "call: $(screen | jq -c '{bar,subs,choices}')"; a2b_shot call
  choose_text "On my way" >/dev/null; sleep 2
  echo "overlay: $(ending_overlay)"; a2b_shot overlay
  if [ $1 = bring_end ]; then
    click_overlay "End the mission" >/dev/null; sleep 3
    echo "after End: call-open=$(a2b_ev "return !!document.getElementById('call-end-button');") subs=$(screen | jq -c '.subs') debrief=$(glob start_debrief_cutscene)"; a2b_shot last_line
    gate wait_screen "!document.getElementById('call-end-button')" 40; sleep 5
    echo "after call: mg=$(mgc) debrief=$(glob start_debrief_cutscene) phone-reopen=$(a2b_ev "return !!document.querySelector('.phone-chat-minigame, .call-screen');")"; a2b_shot debrief
    sleep 6; echo "later: mg=$(mgc)"; a2b_shot debrief2
  else
    click_overlay "Keep going" >/dev/null; sleep 2
    echo "after Keep going: call-open=$(a2b_ev "return !!document.getElementById('call-end-button');") choices=$(screen | jq -c '.choices') debrief=$(glob start_debrief_cutscene)"; a2b_shot kept_going
    end_call >/dev/null; sleep 4; echo "after End: mg=$(mgc) debrief=$(glob start_debrief_cutscene)"; open_phone; open_thread agent_0x99; echo "thread: $(screen | jq -c '{choices}')"; a2b_shot hub_after
  fi
  echo "handler /tts:"; jq -c 'select((.npc_id // .npcId)=="agent_0x99") | .text' $OUT/${LABEL}_tts.jsonl; evs; a2b_quit ;;
reload_ring)
  # By design (plan 2.3 row 27) a non-forced ring that is reloaded becomes a missed call with a callback.
  open_game reload_ring m01_first_contact --unlock main_office_area
  enter_office; gate wait_screen "!!document.querySelector('.incoming-call')" 30; echo "ringing: $(ring_state | jq -c .ringer)"; a2b_shot ringing_before
  reload; sleep 4; echo "after reload (was ringing): ringer=$(ring_state | jq -c .ringer) rows=$(rows agent_0x99)"
  open_phone; open_thread agent_0x99; echo "thread: $(screen | jq -c '{header,choices}')"; a2b_shot ringing_after
  a2b_ev "const b=document.querySelector('.call-button'); if(!b) return 'no header button'; b.click(); return 'header: '+b.innerText;"; sleep 2
  gate wait_screen "$IN_CALL" 30; sleep 4; echo "callback: $(screen | jq -c '{bar,subs}')"; a2b_shot call_before
  reload; sleep 3; echo "after reload (mid-call): mg=$(mgc) call-open=$(a2b_ev "return $IN_CALL;") ringer=$(ring_state | jq -c .ringer) rows=$(rows agent_0x99)"; a2b_shot call_after
  open_phone; open_thread agent_0x99; echo "thread: $(screen | jq -c '{choices,header}')"
  echo "handler /tts:"; jq -c 'select((.npc_id // .npcId)=="agent_0x99") | .text' $OUT/${LABEL}_tts.jsonl; a2b_quit ;;
reload_bring)
  open_game reload_bring m01_first_contact $BR
  open_phone; open_thread agent_0x99; choose_text "ready for debrief" >/dev/null
  gate wait_screen "$IN_CALL && document.querySelectorAll('.choice-button').length>0" 40
  echo "mid-call: $(screen | jq -c '{bar,choices}')"; a2b_shot before_reload
  reload; sleep 3; echo "after reload: mg=$(mgc) call-open=$(a2b_ev "return $IN_CALL;") ringer=$(ring_state | jq -c .ringer) debrief=$(glob start_debrief_cutscene) rows=$(rows agent_0x99)"
  open_phone; open_thread agent_0x99; echo "thread: $(screen | jq -c '{choices,header}')"; a2b_shot after_reload; a2b_quit ;;
esac
