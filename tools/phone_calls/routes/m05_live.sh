#!/bin/bash
# M5 live proofs: m05 Recruiter first call + ring-back, Patricia callable, HaX root-flag ring
# (untilAnswered) and HaX bring-in (plan 8, M5). Rings, call button, hub choices and banner are real;
# preconditions are head-start globals only.
#   PC_PORT=3024 tools/phone_calls/routes/m05_live.sh <case>
# cases: recruiter_decline recruiter_reload root_slow root_row31 root_reload bring_clear bring_end bring_reload patricia
export OUT=${OUT:-docs/agents/phone_calls/proofs/M5}
source "$(dirname "${BASH_SOURCE[0]}")/m10_lib.sh"
LOGEV="window.__ev=[]; for (const n of ['conversation_closed:agent_0x99_handler','conversation_closed:recruiter','conversation_closed:patricia_phone','global_variable_changed:mission_complete','global_variable_changed:flag4_submitted','phone_call_answered:recruiter','phone_call_declined:recruiter','phone_call_missed:recruiter','phone_call_answered:agent_0x99_handler','phone_call_declined:agent_0x99_handler','phone_call_missed:agent_0x99_handler','phone_call_answered:patricia_phone','objective_task_completed:call_in_after_sweep','game_loaded']) window.eventDispatcher.on(n, (d)=>window.__ev.push(n+'@'+Math.round(performance.now()/100)/10+(d&&d.callback?' callback':'')+(d&&d.reload?' reload':'')+(d&&typeof d.answerSeconds==='number'?' as='+d.answerSeconds:''))); return true;"
evs() { a2b_ev "return window.__ev;"; }
end_call() { a2b_ev "const b=document.getElementById('call-end-button'); if(!b) return 'no End'; b.click(); return 'End pressed';"; }
call_up() { gate wait_screen "$IN_CALL && document.querySelectorAll('.choice-button').length>0" ${1:-40}; }
hdr_btn() { a2b_ev "const b=document.querySelector('.call-button'); return b ? b.innerText.trim() : null;"; }
press_call() { a2b_ev "const b=document.querySelector('.call-button'); if(!b) return 'no call button'; b.click(); return 'Call pressed';"; }
banner() { a2b_ev "const b=document.querySelector('.incoming-call, .phone-incoming-call'); return b ? b.innerText.replace(/\n+/g,' | ') : null;"; }
wait_ring() { gate wait_screen "!!(window.phoneRinger.current() && window.phoneRinger.current().state==='ringing')" ${1:-40}; }
emit() { a2b_ev "window.eventDispatcher.emit('$1',$2); return true;" >/dev/null; }
ringer_now() { a2b_ev "const c=window.phoneRinger.current(); return c?{npc:c.npcId,state:c.state,knot:c.knot}:null; "; }
opt_open() { a2b_ev "return window.endingCheck.openOptional().map(t=>t.taskId);"; }
clear_optionals() { a2b_ev "const o=window.endingCheck.openOptional(); for(const t of o){ try{ window.objectivesManager.completeTask(t.taskId);}catch(e){} } return window.endingCheck.openOptional().map(t=>t.taskId);"; }
task_state() { a2b_ev "return window.objectivesManager.aims.flatMap(a=>a.tasks).filter(t=>t.taskId==='call_in_after_sweep').map(t=>t.status);"; }
ALLF="--set flag1_submitted=true --set flag2_submitted=true --set flag3_submitted=true --set flag4_submitted=true"

case $1 in
recruiter_decline|recruiter_reload)
  m10_open $1 m05_insider_trading --set torres_identified=true; a2b_ev "$LOGEV" >/dev/null
  emit 'conversation_closed:agent_0x99_handler' '{"npcId":"agent_0x99_handler"}'
  wait_ring 25; echo "banner: $(banner)"; a2b_shot ringing
  if [ $1 = recruiter_reload ]; then
    reload; sleep 3; echo "after reload: ringer=$(ringer_now) mg=$(mgc)"
    open_phone; open_thread recruiter; echo "thread: $(screen | jq -c '{choices,header,thread}')"; a2b_shot after_reload
    echo "rows=$(rows recruiter) recruiter_texted=$(glob recruiter_texted)"; evs; a2b_quit; exit 0
  fi
  a2b_decline >/dev/null; sleep 2; echo "after decline: ringer=$(ringer_now) mg=$(mgc)"
  sleep 9; open_phone; open_thread recruiter
  echo "thread after decline: $(screen | jq -c '{choices,header,thread}')"; a2b_shot thread_after_decline
  echo "header=$(hdr_btn) rows=$(rows recruiter)"
  press_call >/dev/null; sleep 1; echo "dialling: $(screen | jq -c '{bar}')"; a2b_shot callback_dialling
  call_up 40; echo "callback call: $(screen | jq -c '{bar,subs,choices}')"; a2b_shot callback_call
  tts_log | cut -c1-700; evs; a2b_quit ;;

root_slow|root_reload)
  m10_open $1 m05_insider_trading --set torres_identified=true; a2b_ev "$LOGEV" >/dev/null
  emit 'global_variable_changed:flag4_submitted' '{"name":"flag4_submitted","value":true}'
  wait_ring 25; echo "banner: $(banner) architect_approval_confirmed=$(glob architect_approval_confirmed)"; a2b_shot ringing
  if [ $1 = root_reload ]; then
    reload; sleep 3; echo "after reload: ringer=$(ringer_now) mg=$(mgc)"
    open_phone; open_thread agent_0x99_handler; echo "thread: $(screen | jq -c '{choices,header,thread}')"; a2b_shot after_reload
    echo "rows=$(rows agent_0x99_handler)"; evs; a2b_quit; exit 0
  fi
  echo "leaving it to ring 40 s (untilAnswered)..."; sleep 40; echo "banner after 40s: $(banner)"; a2b_shot ringing_40s
  a2b_answer >/dev/null; call_up 40; echo "call: $(screen | jq -c '{bar,subs,choices}')"; a2b_shot call
  echo "answer_seconds dispatched: see evs"
  tts_log | cut -c1-700; evs; a2b_quit ;;

root_row31)
  m10_open $1 m05_insider_trading --set torres_identified=true --set architect_approval_confirmed=true $ALLF; a2b_ev "$LOGEV" >/dev/null
  # offer the ring (queued, delayMs 1500), then dial the hub choice before/while it is pending (row 31 drops it)
  emit 'global_variable_changed:flag4_submitted' '{"name":"flag4_submitted","value":true}'
  open_phone; open_thread agent_0x99_handler
  echo "hub: $(screen | jq -c '{choices}' | head -c 400)"; a2b_shot hub
  choose_text "Architect signed off" >/dev/null; sleep 1; echo "dialling: $(screen | jq -c '{bar}') ringer=$(ringer_now)"; a2b_shot dialling
  call_up 40; echo "placed call: $(screen | jq -c '{bar,subs,choices}') ringer=$(ringer_now) queue=$(a2b_ev 'return window.phoneRinger.queueLength();')"; a2b_shot call
  tts_log | cut -c1-500; evs; a2b_quit ;;

bring_clear|bring_end|bring_reload)
  m10_open $1 m05_insider_trading --set torres_identified=true --set final_choice=arrest $ALLF; a2b_ev "$LOGEV" >/dev/null
  echo "optional open before: $(opt_open)"; echo "cleared -> still open: $(clear_optionals)"
  open_phone; open_thread agent_0x99_handler; echo "hub: $(screen | jq -c '{choices}' | head -c 300)"; a2b_shot hub
  choose_text "Bring me in" >/dev/null; sleep 1; echo "dialling: $(screen | jq -c '{bar}')"; a2b_shot calling
  call_up 40; echo "call: $(screen | jq -c '{bar,subs,choices}')"; a2b_shot call
  if [ $1 = bring_reload ]; then
    reload; sleep 3; echo "after reload: ringer=$(ringer_now) mg=$(mgc) mission_complete=$(glob mission_complete) task=$(task_state) knot=$(a2b_ev "return window.npcManager.getNPC('agent_0x99_handler').currentKnot;")"
    open_phone; open_thread agent_0x99_handler; echo "thread: $(screen | jq -c '{choices,header,thread}')"; a2b_shot after_reload; echo "rows=$(rows agent_0x99_handler)"
    choose_text "Bring me in" >/dev/null; call_up 40; echo "redial: $(screen | jq -c '{subs,choices}')"; a2b_shot redial
    tts_log | cut -c1-400; evs; a2b_quit; exit 0
  fi
  press_when "Bring me in"; echo "after Bring me in: $(screen | jq -c '{subs,choices}') task=$(task_state)"; a2b_shot confirm
  if [ $1 = bring_clear ]; then
    choose_text "On my way" >/dev/null; sleep 2
    echo "overlay (expect null = no question): $(ending_overlay)"; a2b_shot after_on_my_way
    gate wait_screen "!document.getElementById('call-end-button')" 40; sleep 4
    echo "after call: mission_complete=$(glob mission_complete) mg=$(mgc) task=$(task_state)"; a2b_shot debrief
    sleep 6; echo "debrief later: mg=$(mgc) phone-open=$(a2b_ev "return !!document.querySelector('.phone-chat-container, .contact-item');")"; a2b_shot debrief2
  else # bring_end : force an optional open so the question appears
    a2b_ev "window.objectivesManager.aims[0].tasks.push({taskId:'__probe_opt',status:'in_progress',optional:true,text:'probe'}); return true;" >/dev/null
    choose_text "On my way" >/dev/null; sleep 2; echo "overlay: $(ending_overlay)"; a2b_shot overlay
    click_overlay "End the mission now" >/dev/null; sleep 3
    gate wait_screen "!document.getElementById('call-end-button')" 40; sleep 5
    echo "after End: mission_complete=$(glob mission_complete) mg=$(mgc)"; a2b_shot debrief
  fi
  tts_log | cut -c1-200; echo "HaX /tts: $(jq -c 'select((.npc_id // .npcId)=="agent_0x99_handler") | .text' $OUT/${LABEL}_tts.jsonl | tr '\n' ' ')"; evs; a2b_quit ;;

patricia)
  m10_open $1 m05_insider_trading --set patricia_phone_available=true; a2b_ev "$LOGEV" >/dev/null
  open_phone; open_thread patricia_phone; echo "thread: $(screen | jq -c '{choices,header,thread}')"; a2b_shot thread
  echo "header=$(hdr_btn)"; press_call >/dev/null; sleep 1; echo "dialling: $(screen | jq -c '{bar}')"; a2b_shot calling
  call_up 40; echo "call: $(screen | jq -c '{bar,subs,choices}')"; a2b_shot call
  tts_log | cut -c1-500; evs; a2b_quit ;;

twin_reload)
  # M5 R1 M1 proof A: Torres named (torres_identified set at runtime, so the initial-load twin does not fire
  # first), her first ring armed, then the page reloaded inside the 7.5 s window before the ring is offered
  # (recruiter_texted still false). The new game_loaded twin re-arms her on load and she rings once.
  m10_open $1 m05_insider_trading; a2b_ev "$LOGEV" >/dev/null
  a2b_ev "window.gameState.globalVariables.torres_identified=true; return window.gameState.globalVariables.torres_identified;" >/dev/null
  emit 'conversation_closed:agent_0x99_handler' '{"npcId":"agent_0x99_handler"}'
  sleep 2; echo "armed in window (pending, not yet offered): ringer=$(ringer_now) recruiter_texted=$(glob recruiter_texted)"; a2b_shot armed
  reload; a2b_ev "$LOGEV" >/dev/null
  sleep 3; echo "after reload: torres=$(glob torres_identified) recruiter_texted=$(glob recruiter_texted) ringer=$(ringer_now) mg=$(mgc)"; a2b_shot after_reload
  wait_ring 20; echo "twin ring banner: $(banner)"; a2b_shot twin_ring
  echo "at offer: ringer=$(ringer_now) recruiter_texted=$(glob recruiter_texted) queue=$(a2b_ev 'return window.phoneRinger.queueLength();')"
  a2b_decline >/dev/null; sleep 2; echo "after decline: ringer=$(ringer_now) rows=$(rows recruiter)"; a2b_shot after_decline
  sleep 12; echo "12 s later (no second ring expected): ringer=$(ringer_now) banner=$(banner) recruiter_texted=$(glob recruiter_texted)"; a2b_shot settled
  evs; a2b_quit ;;

bring_guard)
  # M5 R1 M1 proof B (real bring-in): reload-miss aftermath. The twin rings her at load; decline it; then the
  # real bring-in sets mission_complete and she does NOT ring into the debrief.
  m10_open $1 m05_insider_trading --set torres_identified=true --set final_choice=arrest $ALLF; a2b_ev "$LOGEV" >/dev/null
  wait_ring 20; echo "twin ring at load: $(banner)"; a2b_shot twin_ring
  a2b_decline >/dev/null; sleep 2; echo "after decline: recruiter_texted=$(glob recruiter_texted) rows=$(rows recruiter)"
  open_phone; open_thread agent_0x99_handler; echo "hub: $(screen | jq -c '{choices}' | head -c 300)"; a2b_shot hub
  choose_text "Bring me in" >/dev/null; sleep 1; call_up 40
  press_when "Bring me in"; echo "after Bring me in: $(screen | jq -c '{subs,choices}')"; a2b_shot confirm
  choose_text "On my way" >/dev/null; sleep 2
  gate wait_screen "!document.getElementById('call-end-button')" 40; sleep 4
  echo "after bring-in: mission_complete=$(glob mission_complete) mg=$(mgc) ringer=$(ringer_now) queue=$(a2b_ev 'return window.phoneRinger.queueLength();')"; a2b_shot debrief
  sleep 8; echo "debrief later (expect no recruiter ring): ringer=$(ringer_now) banner=$(banner) queue=$(a2b_ev 'return window.phoneRinger.queueLength();')"; a2b_shot debrief_later
  evs; a2b_quit ;;

guard_only)
  # M5 R1 M1 proof B (guard in isolation): Torres named, recruiter still un-rung (recruiter_texted false), but
  # mission_complete already set. The HaX-thread close does NOT ring her — the new guard term rejects it.
  m10_open $1 m05_insider_trading --set torres_identified=true --set mission_complete=true; a2b_ev "$LOGEV" >/dev/null
  echo "before: ringer=$(ringer_now) recruiter_texted=$(glob recruiter_texted) mission_complete=$(glob mission_complete)"
  emit 'conversation_closed:agent_0x99_handler' '{"npcId":"agent_0x99_handler"}'
  sleep 10; echo "after close (expect no ring): ringer=$(ringer_now) banner=$(banner) recruiter_texted=$(glob recruiter_texted) queue=$(a2b_ev 'return window.phoneRinger.queueLength();')"; a2b_shot no_ring
  evs; a2b_quit ;;

tts_reword)
  # M5 R1 M2 proof C: the reworded HaX bring-in line (extract_call :987) is accepted by TtsLineResolver and
  # requested from /tts (503 keyless = recognised, no cache). The old wording is no longer in HaX's ink.
  m10_open $1 m05_insider_trading
  NEW="That TalentStack number's still open. She's lost him. Ring her if you want to hear her lose."
  OLD="That TalentStack text never got an answer. She's lost him. Ring her if you want to hear her lose."
  for tag in NEW OLD; do
    txt=${!tag}
    st=$(a2b_ev "const c=document.querySelector('meta[name=csrf-token]'); const r=await fetch('/break_escape/games/$GID/tts',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':c?c.content:'','Accept':'application/json'},credentials:'same-origin',body:JSON.stringify({npc_id:'agent_0x99_handler',text:$(printf '%s' "$txt" | jq -Rs .)})}); let b=''; try{b=(await r.text()).slice(0,120);}catch(e){} return r.status+' | '+b.replace(/\n+/g,' ');")
    echo "$tag /tts: $st"
  done
  a2b_quit ;;
esac
