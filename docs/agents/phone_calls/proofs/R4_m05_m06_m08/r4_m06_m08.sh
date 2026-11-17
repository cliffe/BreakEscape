#!/bin/bash
# R4 scratch: m06 fund call "Let me think about it" branch; m08 door audit via the real found_badge_audit text (KO / hostile).
#   PC_PORT=3024 bash r4_m06_m08.sh m06_think|m08_ko|m08_hostile
export OUT=docs/agents/phone_calls/proofs/R4_m05_m06_m08
source tools/phone_calls/routes/m10_lib.sh
eval "$(sed -n '/^M6=/p;/^LOGEV=/p;/^evs()/p;/^end_call()/p;/^call_up()/p' tools/phone_calls/routes/m10_live.sh)"
setg() { a2b_ev "const g=window.gameState.globalVariables; const o=g['$1']; g['$1']=$2; window.eventDispatcher.emit('global_variable_changed:$1',{name:'$1',value:$2,oldValue:o}); return true;" >/dev/null; }
case $1 in
m06_think)
  m10_open $1 m06_follow_the_money $M6 --set fund_debrief_available=true --set found_architects_fund=true; a2b_ev "$LOGEV" >/dev/null
  open_phone; open_thread agent_0x99_handler; echo "hub: $(screen | jq -c '{choices}')"
  choose_text "Architect" >/dev/null; sleep 1; echo "dialling: $(screen | jq -c '{bar}') caption=$(a2b_ev "const c=document.getElementById('call-caption'); return c?c.textContent:null;")"
  call_up; press_when "advances already"; press_when "think about it" 40; sleep 2
  echo "end of call: $(screen | jq -c '{subs:.subs[-3:],choices}') reacted_fund=$(glob reacted_fund)"; a2b_shot call_end
  gate wait_screen "!document.getElementById('call-end-button')" 40; sleep 2
  echo "after call: mg=$(mgc) rows=$(rows agent_0x99_handler)"; echo "thread: $(screen | jq -c '{choices}')"; a2b_shot hub_final
  echo "handler /tts: $(jq -c 'select((.npc_id // .npcId)=="agent_0x99_handler") | .text' $OUT/${LABEL}_tts.jsonl | tr '\n' ' ')"; evs; a2b_quit ;;
m08_ko|m08_hostile)
  if [ $1 = m08_ko ]; then ST="--set netherton_ko=true --set netherton_hostile=true"; else ST="--set netherton_hostile=true"; fi
  m10_open $1 m08_the_mole --set first_call=false --set found_timeline=true $ST; a2b_ev "$LOGEV" >/dev/null
  setg found_badge_audit true; sleep 5
  open_phone; open_thread agent_0x99; echo "thread: $(screen | jq -c '{choices,thread}')"; a2b_shot thread_call_me
  echo "header call buttons: $(a2b_ev "return document.querySelectorAll('.call-button').length;")"
  [ $1 = m08_hostile ] && { evs; a2b_quit; exit 0; }
  choose_text "name the leak" >/dev/null; sleep 1; echo "dialling: $(screen | jq -c '{bar}') caption=$(a2b_ev "const c=document.getElementById('call-caption'); return c?c.textContent:null;")"; a2b_shot calling
  call_up; echo "call: $(screen | jq -c '{subs,choices}')"
  press_when "10:38"; echo "who: $(screen | jq -c '{subs:.subs[-1:],choices}')"
  press_when "Nightshade"; gate wait_screen "!document.getElementById('call-end-button')" 40; sleep 3
  echo "after: mole=$(glob mole_identified) named_by_hax=$(glob named_by_hax) task=$(a2b_ev "return window.objectivesManager.aims.flatMap(a=>a.tasks).filter(t=>t.taskId==='name_the_mole').map(t=>t.status);") rows=$(rows agent_0x99)"
  echo "thread: $(screen | jq -c '{choices}')"; a2b_shot after
  echo "HaX /tts: $(jq -c 'select((.npc_id // .npcId)=="agent_0x99") | .text' $OUT/${LABEL}_tts.jsonl | tr '\n' ' ')"; evs; a2b_quit ;;
esac
