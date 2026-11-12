#!/bin/bash
# M4 live proofs: m04 Vance callable, HaX dial ring, HaX bring-in call (plan 8, M4). Real call button, hub choices and banner.
#   PC_PORT=3023 tools/phone_calls/routes/m04_live.sh vance_before|vance_ally|vance_ko|dial_decline|dial_slow|dial_plain|dial_reload_ring|dial_reload_call|bring_blocked|bring_clear|bring_end|bring_keep|bring_reload
# Preconditions are head-start globals (precondition only); the ring, the call button, the hub choices and the endings are real.
export OUT=${OUT:-docs/agents/phone_calls/proofs/M4}
source "$(dirname "${BASH_SOURCE[0]}")/m10_lib.sh"
LOGEV="window.__ev=[]; for (const n of ['conversation_closed:agent_0x99','conversation_closed:robert_vance_phone','global_variable_changed:mission_complete','global_variable_changed:anomaly_detected','global_variable_changed:anomaly_call_heard','phone_call_answered:agent_0x99','phone_call_declined:agent_0x99','phone_call_missed:agent_0x99','phone_call_answered:robert_vance_phone','objective_task_completed:call_in_after_sweep','game_loaded']) window.eventDispatcher.on(n, (d)=>window.__ev.push(n+'@'+Math.round(performance.now()/100)/10+(d&&d.callback?' callback':'')+(d&&d.reload?' reload':''))); return true;"
evs() { a2b_ev "return window.__ev;"; }
end_call() { a2b_ev "const b=document.getElementById('call-end-button'); if(!b) return 'no End'; b.click(); return 'End pressed';"; }
call_up() { gate wait_screen "$IN_CALL && document.querySelectorAll('.choice-button').length>0" ${1:-40}; }
hdr_btn() { a2b_ev "const b=document.querySelector('.call-button'); return b ? b.innerText.trim() : null;"; }
press_call() { a2b_ev "const b=document.querySelector('.call-button'); if(!b) return 'no call button'; b.click(); return 'Call pressed';"; }
banner() { a2b_ev "const b=document.querySelector('.incoming-call, .phone-incoming-call'); return b ? b.innerText.replace(/\n+/g,' | ') : null;"; }
wait_ring() { gate wait_screen "!!(window.phoneRinger.current() && window.phoneRinger.current().state==='ringing')" ${1:-40}; }
anom() { a2b_ev "return window.gameState.globalVariables.anomaly_detected;"; }
sub_now() { a2b_ev "return [...document.querySelectorAll('.call-subtitle')].map(s=>s.innerText.replace(/\n+/g,' '));"; }
mp() { open_phone; open_thread "$1"; }
vance_thread() { gate wait_screen "true" 1; for i in $(seq 1 40); do open_phone; a2b_ev "return !!document.querySelector('.contact-item[data-npc-id=\"robert_vance_phone\"]');" | grep -qx true && break; a2b_ev "const x=document.querySelector('.phone-close-button, .minigame-close-button, #minigame-close'); if(x) x.click(); return 1;" >/dev/null; sleep 2; done; open_thread robert_vance_phone; }
dial_dial() {  # real examine of the thermometer in Hall 1
  $S $GID '{"cmd":"moveToNear","id":"analog_thermometer"}' 40 >/dev/null
  $S $GID '{"cmd":"interact","id":"analog_thermometer"}' 40 >/dev/null; sleep 2
  echo "dial read: anomaly_detected=$(anom) mg=$(mgc)"
  a2b_ev "const b=document.querySelector('.minigame-close-button, .close-button'); if(b){b.click(); return 'closed popup';} return 'no popup';"
}
HUB_BRING="--set attack_prevented=true --set vance_is_ally=true --set vance_met=true"
start_bring() {  # $1 label, rest: extra opts. Then unlock the call-in task by the real mapping's event
  local l=$1; shift
  m10_open $l m04_critical_failure --set attack_prevented=true "$@"; a2b_ev "$LOGEV" >/dev/null
  a2b_ev "window.eventDispatcher.emit('global_variable_changed:attack_prevented',{name:'attack_prevented',value:true}); return true;" >/dev/null; sleep 4
  echo "optional open: $(a2b_ev "return window.endingCheck.openOptional().map(t=>t.taskId);") call_in_after_sweep=$(a2b_ev "return window.objectivesManager.aims.flatMap(a=>a.tasks).filter(t=>t.taskId==='call_in_after_sweep').map(t=>t.status);")"
}
task_state() { a2b_ev "return window.objectivesManager.aims.flatMap(a=>a.tasks).filter(t=>t.taskId==='call_in_after_sweep').map(t=>t.status);"; }
case $1 in
vance_before|vance_ally|vance_ko)
  case $1 in
    vance_before) OPTS="--set vance_phone_available=true";;
    vance_ally) OPTS="--set vance_phone_available=true --set vance_is_ally=true --set vance_met=true";;
    vance_ko) OPTS="--set vance_phone_available=true --set vance_is_ally=true --set vance_met=true --set robert_vance_ko=true";;
  esac
  m10_open $1 m04_critical_failure $OPTS; a2b_ev "$LOGEV" >/dev/null
  vance_thread; echo "thread: $(screen | jq -c '{choices,header,thread}')"; a2b_shot thread
  press_call >/dev/null; sleep 1; echo "dialling: $(screen | jq -c '{bar,thread}')"; a2b_shot calling
  if [ $1 = vance_ally ]; then
    call_up; echo "call: $(screen | jq -c '{bar,subs,choices}')"; a2b_shot call
    press_when "charge controls"; sleep 3; echo "mid: $(screen | jq -c '{subs,choices}')"
    end_call >/dev/null; sleep 4; echo "after End: mg=$(mgc) rows=$(rows robert_vance_phone)"
    open_phone; open_thread robert_vance_phone; echo "thread after: $(screen | jq -c '{choices,header,thread}')"; a2b_shot thread_after
    press_call >/dev/null; call_up 30; echo "second call: $(screen | jq -c '{bar,subs,choices}')"; a2b_shot call2
    end_call >/dev/null; sleep 3
  else
    wait_screen "!document.getElementById('call-end-button') && !!document.querySelector('.messages-container') && /No answer/i.test(document.querySelector('.messages-container').innerText)" 30 || echo "no No-answer row"
    echo "after ring out: $(screen | jq -c '{bar,thread,header}') rows=$(rows robert_vance_phone) conn=$(a2b_ev "return window.phoneRinger.callActive();")"; a2b_shot no_answer
  fi
  tts_log | cut -c1-400; evs; a2b_quit ;;
dial_decline|dial_slow|dial_plain)
  m10_open $1 m04_critical_failure --start-room battery_hall_1 --set vance_met=true; a2b_ev "$LOGEV" >/dev/null
  dial_dial; wait_ring 40; echo "banner: $(banner)"; a2b_shot banner
  case $1 in
    dial_decline)
      a2b_decline >/dev/null; sleep 4; echo "after decline: $(a2b_status | jq -c '{ringer,mg}')"
      mp agent_0x99; echo "thread: $(screen | jq -c '{choices,header,thread}')"; a2b_shot thread_after_decline
      echo "hub choice on the dial: $(screen | jq -c '[.choices[]|select(test("dial"))]')"
      press_call >/dev/null; sleep 1; echo "dialling: $(screen | jq -c '{bar}')"; a2b_shot callback_dialling
      call_up 40; echo "callback call: $(screen | jq -c '{bar,subs,choices}')"; a2b_shot callback_call
      press_when "where do I start" ; sleep 4; echo "end: $(screen | jq -c '{bar,subs}')"
      gate wait_screen "!document.getElementById('call-end-button')" 40; sleep 2
      echo "after: rows=$(rows agent_0x99) anomaly_call_heard=$(glob anomaly_call_heard) header=$(hdr_btn)";;
    dial_slow)
      sleep 12; echo "banner after 12s: $(banner)"; a2b_answer; call_up 40; echo "call: $(screen | jq -c '{bar,subs,choices}')"; a2b_shot call
      echo "answer seconds: $(a2b_ev "return window.npcManager.getNPC('agent_0x99').storyState ? 'storyState present' : 'n/a';")"
      press_when "where do I start"; gate wait_screen "!document.getElementById('call-end-button')" 40; sleep 2; echo "after: rows=$(rows agent_0x99) heard=$(glob anomaly_call_heard)";;
    dial_plain)
      a2b_answer >/dev/null; call_up 40; echo "call: $(screen | jq -c '{bar,subs,choices}')"; a2b_shot call
      press_when "where do I start"; gate wait_screen "!document.getElementById('call-end-button')" 40; sleep 2; echo "after: rows=$(rows agent_0x99) heard=$(glob anomaly_call_heard)";;
  esac
  tts_log | cut -c1-600; evs; a2b_quit ;;
dial_reload_ring)
  m10_open $1 m04_critical_failure --start-room battery_hall_1 --set vance_met=true; a2b_ev "$LOGEV" >/dev/null
  dial_dial; wait_ring 40; echo "ringing: $(banner)"; a2b_shot before_reload
  reload; sleep 4; echo "after reload: ringer=$(a2b_ev "const c=window.phoneRinger.current(); return c?{npc:c.npcId,state:c.state}:null;") mg=$(mgc) anomaly=$(anom)"
  mp agent_0x99; echo "thread: $(screen | jq -c '{choices,header,thread}')"; a2b_shot after_reload
  echo "rows=$(rows agent_0x99)"; evs; a2b_quit ;;
dial_reload_call)
  m10_open $1 m04_critical_failure --start-room battery_hall_1 --set vance_met=true; a2b_ev "$LOGEV" >/dev/null
  dial_dial; wait_ring 40; a2b_answer >/dev/null; call_up 40; echo "mid-call: $(screen | jq -c '{bar,subs,choices}')"; a2b_shot before_reload
  reload; sleep 4; echo "after reload: ringer=$(a2b_ev "const c=window.phoneRinger.current(); return c?{npc:c.npcId,state:c.state}:null;") mg=$(mgc) knot=$(a2b_ev "return window.npcManager.getNPC('agent_0x99').currentKnot;")"
  mp agent_0x99; echo "thread: $(screen | jq -c '{choices,header,thread}')"; a2b_shot after_reload; echo "rows=$(rows agent_0x99)"
  press_call >/dev/null; call_up 40; echo "callback after reload: $(screen | jq -c '{bar,subs,choices}')"; a2b_shot callback
  tts_log | cut -c1-500; evs; a2b_quit ;;
bring_blocked)
  start_bring $1 --set relay_engaged=true --set vance_is_ally=true --set vance_met=true
  mp agent_0x99; echo "hub: $(screen | jq -c '{choices,header}')"; a2b_shot hub
  choose_text "Bring me in" >/dev/null; sleep 1; call_up 40; echo "blocked: $(screen | jq -c '{bar,subs,choices}')"; a2b_shot blocked
  press_when "Understood"; gate wait_screen "!document.getElementById('call-end-button')" 40; sleep 3
  echo "after Understood: mg=$(mgc) mission_complete=$(glob mission_complete) task=$(task_state) rows=$(rows agent_0x99)"
  mp agent_0x99; echo "hub again: $(screen | jq -c '{choices}')"
  a2b_ev "window.gameState.globalVariables.relay_engaged=false; return true;" >/dev/null
  choose_text "Bring me in" >/dev/null; call_up 40; echo "once clear: $(screen | jq -c '{subs,choices}')"; a2b_shot clear
  tts_log | cut -c1-600; evs; a2b_quit ;;
bring_clear|bring_end|bring_keep|bring_reload)
  EXTRA="--set vance_is_ally=true --set vance_met=true"
  case $1 in bring_clear) EXTRA="$EXTRA --set vance_met=true --complete-task meet_robert_vance";; esac
  start_bring $1 $EXTRA
  mp agent_0x99; echo "hub: $(screen | jq -c '{choices,header}')"; a2b_shot hub
  choose_text "Bring me in" >/dev/null; sleep 1; echo "dialling: $(screen | jq -c '{bar}')"; a2b_shot calling
  call_up 40; echo "call: $(screen | jq -c '{bar,subs,choices}')"; a2b_shot call
  if [ $1 = bring_reload ]; then
    reload; sleep 4; echo "after reload: ringer=$(a2b_ev "const c=window.phoneRinger.current(); return c?{npc:c.npcId,state:c.state}:null;") mg=$(mgc) mission_complete=$(glob mission_complete) task=$(task_state) knot=$(a2b_ev "return window.npcManager.getNPC('agent_0x99').currentKnot;")"
    mp agent_0x99; echo "thread: $(screen | jq -c '{choices,header,thread}')"; a2b_shot after_reload; echo "rows=$(rows agent_0x99)"
    choose_text "Bring me in" >/dev/null; call_up 40; echo "redial: $(screen | jq -c '{subs,choices}')"; a2b_shot redial
    press_when "Bring me in"; press_when "On my way"; sleep 3; echo "overlay: $(ending_overlay)"; a2b_shot overlay
    tts_log | cut -c1-600; evs; a2b_quit; exit 0
  fi
  if [ $1 = bring_keep ]; then
    press_when "Not yet"; sleep 3; echo "after Not yet: mg=$(mgc) mission_complete=$(glob mission_complete) task=$(task_state)"; a2b_shot not_yet
    mp agent_0x99; echo "hub again: $(screen | jq -c '{choices}')"; choose_text "Bring me in" >/dev/null; call_up 40; echo "redial: $(screen | jq -c '{subs,choices}')"; a2b_shot redial
  fi
  press_when "Bring me in" ; echo "confirm: $(screen | jq -c '{subs,choices}') task=$(task_state)"; a2b_shot confirm
  choose_text "On my way" >/dev/null; sleep 2
  echo "overlay: $(ending_overlay)"; a2b_shot after_on_my_way
  case $1 in
  bring_clear)
    gate wait_screen "!document.getElementById('call-end-button')" 40; sleep 4
    echo "after call: mission_complete=$(glob mission_complete) mg=$(mgc) task=$(task_state)"; a2b_shot debrief
    sleep 6; echo "debrief later: mg=$(mgc) phone-open=$(a2b_ev "return !!document.querySelector('.phone-chat-container, .contact-item');")"; a2b_shot debrief2;;
  bring_end)
    click_overlay "End the mission now" >/dev/null; sleep 3
    gate wait_screen "!document.getElementById('call-end-button')" 40; sleep 5
    echo "after End: mission_complete=$(glob mission_complete) mg=$(mgc) task=$(task_state)"; a2b_shot debrief
    sleep 6; echo "debrief later: mg=$(mgc) phone-open=$(a2b_ev "return !!document.querySelector('.phone-chat-container, .contact-item');")"; a2b_shot debrief2;;
  bring_keep)
    click_overlay "Keep going" >/dev/null; sleep 2
    echo "after Keep going: call-open=$(a2b_ev "return !!document.getElementById('call-end-button');") screen=$(screen | jq -c '{subs,choices}') mission_complete=$(glob mission_complete)"; a2b_shot kept_going
    echo "tts so far (agent_0x99): $(jq -c 'select((.npc_id // .npcId)=="agent_0x99") | .text' $OUT/${LABEL}_tts.jsonl | tr '\n' ' ')"
    end_call >/dev/null; sleep 4; echo "after End: mg=$(mgc) mission_complete=$(glob mission_complete)"; echo "thread: $(screen | jq -c '{choices}')"; a2b_shot after_end
    # hang up done; ring HaX again from the hub choice and confirm; the question shows again, End hands over
    open_phone; open_thread agent_0x99; choose_text "Bring me in" >/dev/null; call_up 40; press_when "Bring me in"; choose_text "On my way" >/dev/null; sleep 2
    echo "overlay again: $(ending_overlay)"; a2b_shot overlay_again
    click_overlay "End the mission now" >/dev/null; gate wait_screen "!document.getElementById('call-end-button')" 40; sleep 5
    echo "after End now: mission_complete=$(glob mission_complete) mg=$(mgc)"; a2b_shot debrief_after_again;;
  esac
  tts_log | cut -c1-100; echo "HaX /tts: $(jq -c 'select((.npc_id // .npcId)=="agent_0x99") | .text' $OUT/${LABEL}_tts.jsonl | tr '\n' ' ')"; evs; a2b_quit ;;
esac
