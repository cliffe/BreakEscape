#!/bin/bash
# A5 live proofs on test_phone_calls: outgoing calls and the post-call thread (plan 2.5, row 31).
#   PC_PORT=3025 tools/phone_calls/routes/a5_live.sh desk|row31|away|placed_ringout|debrief|ending_keep|ending_end
# Each route opens the phone as the player would, uses the real call button or the real hub choice, and logs the
# call rows, the thread and the events. Logs and shots go to $OUT.
export OUT=${OUT:-docs/agents/phone_calls/proofs/A5} NODE_PATH=$PWD/node_modules BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle
source "$(dirname "${BASH_SOURCE[0]}")/a2b_lib.sh"
wait_ring() { for i in $(seq 1 ${2:-60}); do a2b_ev "const c=window.phoneRinger.current(); return !!c && c.npcId==='$1' && c.state==='ringing';" | grep -qx true && return 0; sleep 1; done; return 1; }
calm_guard() { a2b_ev "window.gameState.globalVariables.guard_off = true; const m=window.MinigameFramework.currentMinigame; if (m && m._sceneType==='person-chat') window.MinigameFramework.endMinigame(false); return 'guard calm';" >/dev/null; }
clear_basic() { calm_guard; wait_ring caller_basic 40 && a2b_decline >/dev/null; sleep 1; }
gate() { "$@" || { echo "GATE FAILED: $*" >&2; a2b_quit; exit 1; }; }
mgc() { a2b_ev "const m=window.MinigameFramework.currentMinigame; return m ? m.constructor.name : null;"; }
open_phone() { $S $GID '{"cmd":"openInventoryItem","item":"phone"}' >/dev/null; sleep 2; }
open_thread() { a2b_ev "const c=document.querySelector('.contact-item[data-npc-id=\"$1\"]'); if(!c) return 'no contact $1'; c.click(); return 'opened $1';"; sleep 2; }
IDS="desk_contact away_contact hidden_contact caller_debrief"
LOGEV="window.__ev=[]; for (const n of ['conversation_closed:desk_contact','conversation_closed:away_contact','conversation_closed:hidden_contact','conversation_closed:caller_debrief','phone_call_answered:desk_contact','phone_call_declined:desk_contact','phone_call_missed:desk_contact','phone_call_answered:away_contact','phone_call_missed:away_contact','minigame_failed','minigame_completed','global_variable_changed:debrief_go','global_variable_changed:end_go']) window.eventDispatcher.on(n, ()=>window.__ev.push(n+'@'+Math.round(performance.now()/100)/10)); return true;"
evs() { a2b_ev "return window.__ev;"; }
# per contact: call rows, the saved story position, the ringer's state
state() { a2b_ev "const out={}; for (const id of ['desk_contact','away_contact','hidden_contact','caller_debrief']) { const o=window.npcManager.getNPC(id); const h=window.npcManager.getConversationHistory(id)||[]; out[id]={rows:h.filter(m=>m.type==='call').map(m=>m.text), lines:h.filter(m=>m.type!=='call').length, currentKnot:o.currentKnot, homeKnot:o.homeKnot, pending:o.pendingCall||null}; } const r=window.phoneRinger; const c=r.current(); out._ringer=c?{npc:c.npcId,state:c.state,dir:c.direction,knot:c.knot}:null; out._queue=r.queueLength(); out._callActive=r.callActive(); const m=window.MinigameFramework.currentMinigame; out._open=m?{type:m._sceneType,npc:m.params&&m.params.npcId||null,ringerCall:m.params&&m.params.ringerCall||null,thread:m.currentNPCId||null}:null; return out;"; }
screen() { a2b_ev "const m=document.querySelector('.messages-container'); const bar=document.getElementById('call-status-bar'); const cap=document.getElementById('call-caption'); const subs=[...document.querySelectorAll('.call-subtitle')].map(s=>s.innerText.replace(/\n+/g,' ')); const choices=[...document.querySelectorAll('.choice-button')].map(b=>b.innerText.trim()); const btn=document.querySelector('.call-button'); return {bar: bar?bar.innerText.replace(/\n+/g,' | '):null, caption: cap?cap.innerText:null, subs, choices, callButton: btn?{text:btn.innerText.trim(), aria:btn.getAttribute('aria-label')}:null, thread: m && !bar ? m.innerText.replace(/\n+/g,' | ').slice(-300) : null};"; }
press_call() { a2b_ev "const b=document.querySelector('.call-button'); if(!b) return 'no call button'; b.click(); return 'Call pressed';"; }
end_call() { a2b_ev "const b=document.getElementById('call-end-button'); if(!b) return 'no End button'; b.click(); return 'End pressed';"; }
choose_text() { a2b_ev "const b=[...document.querySelectorAll('.choice-button')].find(x=>x.innerText.includes('$1')); if(!b) return 'no choice $1'; b.click(); return 'chose $1';"; }
wait_screen() { for i in $(seq 1 ${2:-30}); do a2b_ev "return $1;" | grep -qx true && return 0; sleep 1; done; return 1; }
IN_CALL="!!document.getElementById('call-end-button') && !!document.querySelector('.choice-button')"
CALLING="(document.getElementById('call-status-bar')||{innerText:''}).innerText.includes('CALLING')"
start() { AUTOBRIEF=true a2b_open $1; gate clear_basic; a2b_ev "$LOGEV" >/dev/null; }
case $1 in
desk)
  start desk
  open_phone; open_thread desk_contact; echo "thread: $(screen)"; a2b_shot thread_button
  press_call >/dev/null; sleep 0.8; echo "dialling: $(screen) open: $(state | jq -c '._open')"; a2b_shot calling
  gate wait_screen "$IN_CALL" 12; echo "connected: $(screen)"; a2b_shot connected
  echo "state mid-call: $(state | jq -c '{o:._open,r:._ringer,desk:.desk_contact}')"
  end_call >/dev/null; sleep 3.5
  echo "after End mid-choice: $(state | jq -c '{o:._open,r:._ringer,desk:.desk_contact}')"; echo "thread: $(screen)"; a2b_shot thread_after_end
  echo "events: $(evs)"
  # close the phone for real, reopen the thread: home knot, no call choices
  a2b_ev "const m=window.MinigameFramework.currentMinigame; if(m) m.complete(false); return 'phone closed';" >/dev/null; sleep 1.5
  echo "after the real close: events: $(evs)"
  open_phone; open_thread desk_contact; echo "reopened: $(screen)"; a2b_shot thread_reopened
  # second call: visit count carries over
  press_call >/dev/null; gate wait_screen "$IN_CALL" 12; echo "second call: $(screen)"; a2b_shot second_call
  choose_text Goodbye >/dev/null; sleep 4
  echo "after Goodbye: $(state | jq -c '{o:._open,r:._ringer,desk:.desk_contact}')"; echo "thread: $(screen)"; a2b_shot thread_after_second
  a2b_ev "return window.__ev;" > "$OUT/desk_events.json"; a2b_quit ;;
row31)
  start row31
  open_phone; open_thread desk_contact
  a2b_ev "window.eventDispatcher.emit('ring_desk', {}); return true;" >/dev/null
  gate wait_ring desk_contact 25; echo "ringing in the phone: $(a2b_ev "const p=document.querySelector('.phone-incoming-call'); return p?p.innerText.replace(/\n+/g,' | '):null;")"; a2b_shot ringing
  press_call >/dev/null; sleep 0.8; echo "after Call pressed: $(state | jq -c '{o:._open,r:._ringer,q:._queue}')"
  gate wait_screen "$IN_CALL" 12; echo "connected: $(state | jq -c '{r:._ringer,q:._queue}') $(screen | jq -c '.subs')"; a2b_shot connected
  end_call >/dev/null; sleep 4
  echo "after End: $(state | jq -c '{o:._open,r:._ringer,q:._queue,desk:.desk_contact}')"; echo "events: $(evs)"
  sleep 6; echo "6 s later: $(state | jq -c '{o:._open,r:._ringer,q:._queue}') (no second ring)"
  a2b_ev "return window.__ev;" > "$OUT/row31_events.json"; a2b_quit ;;
away)
  start away
  open_phone; open_thread away_contact; echo "away thread: $(screen)"; a2b_shot away_button
  open_phone 2>/dev/null; a2b_ev "const m=window.MinigameFramework.currentMinigame; return m ? m.constructor.name : null;" >/dev/null
  press_call >/dev/null; sleep 3.5; echo "dialling, past the dial (rings on): $(screen)"; a2b_shot ringing_on
  gate wait_screen "document.getElementById('call-status-bar') && document.getElementById('call-status-bar').innerText.includes('NO ANSWER')" 12; echo "no answer: $(screen)"; a2b_shot no_answer
  sleep 2.5; echo "back in the phone: $(state | jq -c '{o:._open,r:._ringer,away:.away_contact}')"; echo "thread: $(screen)"; a2b_shot thread_after_no_answer
  echo "hidden contact before: $(open_thread hidden_contact >/dev/null 2>&1; screen | jq -c '.callButton')"
  a2b_ev "const m=window.MinigameFramework.currentMinigame; if(m) m.complete(false); return 'phone closed';" >/dev/null; sleep 1
  a2b_lever lever_back; sleep 1; echo "away_back: $(a2b_ev "return window.gameState.globalVariables.away_back;")"
  open_phone; open_thread hidden_contact; echo "hidden after: $(screen | jq -c '.callButton')"; a2b_shot hidden_button
  a2b_ev "const m=window.MinigameFramework.currentMinigame; if(m) m.complete(false); return 'phone closed';" >/dev/null; sleep 1
  open_phone; open_thread away_contact; press_call >/dev/null; gate wait_screen "$IN_CALL" 12; echo "away now connects: $(screen)"; a2b_shot away_connected
  end_call >/dev/null; sleep 3.5; echo "after End: $(state | jq -c '{o:._open,away:.away_contact}')"
  a2b_ev "return window.__ev;" > "$OUT/away_events.json"; a2b_quit ;;
placed_ringout)
  start placed_ringout
  open_phone; open_thread away_contact; echo "before: $(screen)"
  choose_text "Place the call from here" >/dev/null; sleep 0.8
  echo "just after the choice: $(state | jq -c '{o:._open,r:._ringer}') $(screen | jq -c '{bar,subs}')"; a2b_shot calling
  gate wait_screen "document.getElementById('call-status-bar') && document.getElementById('call-status-bar').innerText.includes('NO ANSWER')" 15
  echo "lines typed during the dial: $(state | jq -c '.away_contact.lines')"
  sleep 2.5; echo "back: $(state | jq -c '{o:._open,r:._ringer,away:.away_contact}')"; echo "thread: $(screen)"; a2b_shot thread_on_hub
  a2b_ev "const m=window.MinigameFramework.currentMinigame; if(m) m.complete(false); return 'phone closed';" >/dev/null; sleep 1
  open_phone; open_thread away_contact; echo "reopened: $(screen)"; a2b_shot reopened
  a2b_ev "return window.__ev;" > "$OUT/placed_ringout_events.json"; a2b_quit ;;
debrief)
  start debrief
  open_phone; open_thread caller_debrief; echo "hub: $(screen)"
  choose_text "Ring the debrief line" >/dev/null; sleep 0.8; echo "dialling: $(state | jq -c '{o:._open}')"
  gate wait_screen "$IN_CALL" 12; echo "call: $(screen)"; a2b_shot call
  choose_text "I'm done here" >/dev/null; sleep 6
  echo "after the hand-off: $(state | jq -c '{o:._open,r:._ringer}') debrief_go=$(a2b_ev "return window.gameState.globalVariables.debrief_go;")"; a2b_shot after_handoff
  echo "events: $(evs)"; a2b_ev "return window.__ev;" > "$OUT/debrief_events.json"; a2b_quit ;;
ending_keep|ending_end)
  start $1
  open_phone; open_thread desk_contact
  choose_text "Close the file" >/dev/null; gate wait_screen "$IN_CALL" 15; echo "extract call: $(screen)"; a2b_shot call
  choose_text "Yes, close it" >/dev/null; sleep 1.5
  echo "ending check: $(a2b_ev "const o=document.getElementById('ending-check-overlay'); return o ? o.innerText.replace(/\n+/g,' | ') : null;")"; a2b_shot ending_check
  if [ $1 = ending_keep ]; then
    a2b_ev "const b=[...document.querySelectorAll('#ending-check-overlay button')].find(x=>x.innerText.includes('Keep going')); if(!b) return 'no keep'; b.click(); return 'Keep going';" >/dev/null; sleep 2
    echo "after Keep going: $(state | jq -c '{o:._open,r:._ringer}') $(screen | jq -c '{bar,choices}') end_go=$(a2b_ev "return window.gameState.globalVariables.end_go;")"; a2b_shot kept_going
    choose_text "Not yet" >/dev/null; sleep 4
    echo "after Not yet: $(state | jq -c '{o:._open,r:._ringer,desk:.desk_contact}')"; a2b_shot after_not_yet
  else
    a2b_ev "const b=[...document.querySelectorAll('#ending-check-overlay button')].find(x=>x.innerText.includes('End the mission now')); if(!b) return 'no end'; b.click(); return 'End now';" >/dev/null; sleep 6
    echo "after End now: $(state | jq -c '{o:._open,r:._ringer}') end_go=$(a2b_ev "return window.gameState.globalVariables.end_go;") ringer closed=$(a2b_ev "return window.phoneRinger.isClosed();")"; a2b_shot credits
  fi
  echo "events: $(evs)"; a2b_ev "return window.__ev;" > "$OUT/${1}_events.json"; a2b_quit ;;
esac
