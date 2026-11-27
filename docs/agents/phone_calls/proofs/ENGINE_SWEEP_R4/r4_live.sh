#!/bin/bash
# Engine sweep review R4 live proof: m04 HaX dial ring left to ring out (onMissed callback), then dialled back
# with the thread's Call back button. Keyless server on :3027 only.
#   PC_PORT=3027 OUT=docs/agents/phone_calls/proofs/ENGINE_SWEEP_R4 bash docs/agents/phone_calls/proofs/ENGINE_SWEEP_R4/r4_live.sh m04_ringout
# Precondition only: head start in battery_hall_1 with vance_met. The dial read, the ring, the ring-out, the
# Call back press and the call are real.
export PC_PORT=${PC_PORT:?set PC_PORT}
export OUT=${OUT:-docs/agents/phone_calls/proofs/ENGINE_SWEEP_R4}
source "$(dirname "${BASH_SOURCE[0]}")/../../../../../tools/phone_calls/routes/m10_lib.sh"
LOGEV="window.__ev=[]; for (const n of ['phone_call_answered:agent_0x99','phone_call_declined:agent_0x99','phone_call_missed:agent_0x99','conversation_closed:agent_0x99']) window.eventDispatcher.on(n, (d)=>window.__ev.push(n+'@'+Math.round(performance.now()/100)/10+(d&&d.callback?' callback':''))); window.__toasts=[]; const o=window.showNotification; window.showNotification=function(t,...r){window.__toasts.push(t); return o&&o.call(this,t,...r);}; return true;"
evs() { a2b_ev "return {ev: window.__ev, toasts: window.__toasts};"; }
ringer() { a2b_ev "const c=window.phoneRinger.current(); return c?{npc:c.npcId,state:c.state,ringMs:Math.round(c.ringMs)}:null;"; }
hdr_btn() { a2b_ev "const b=document.querySelector('.call-button'); return b ? b.innerText.trim() : null;"; }
press_call() { a2b_ev "const b=document.querySelector('.call-button'); if(!b) return 'no call button'; b.click(); return 'Call pressed: '+b.innerText.trim();"; }
case $1 in
m04_ringout)
  m10_open $1 m04_critical_failure --start-room battery_hall_1 --set vance_met=true; a2b_ev "$LOGEV" >/dev/null
  $S $GID '{"cmd":"moveToNear","id":"analog_thermometer"}' 40 >/dev/null
  $S $GID '{"cmd":"interact","id":"analog_thermometer"}' 40 >/dev/null; sleep 2
  echo "dial read: anomaly_detected=$(glob anomaly_detected)"
  a2b_ev "const b=document.querySelector('.minigame-close-button, .close-button'); if(b){b.click(); return 'closed popup';} return 'no popup';"
  gate wait_screen "!!(window.phoneRinger.current() && window.phoneRinger.current().state==='ringing')" 40
  T0=$(date +%s); echo "ringing: $(ringer)"; a2b_shot ringing
  # leave it alone until it rings out
  for i in $(seq 1 40); do sleep 1; R=$(ringer); [ "$R" = "null" ] && break; done
  echo "rang out after ~$(( $(date +%s) - T0 )) s: ringer=$(ringer) banner=$(a2b_ev "return !!document.querySelector('.incoming-call');")"
  echo "events: $(evs)"
  echo "rows: $(rows agent_0x99) callback: $(a2b_ev "return window.phoneRinger.callbackFor ? window.phoneRinger.callbackFor('agent_0x99') : 'n/a';")"
  a2b_shot after_ringout
  open_phone >/dev/null; open_thread agent_0x99 >/dev/null
  echo "thread header button: $(hdr_btn)"; a2b_shot thread_callback
  press_call; sleep 1; echo "dialling: $(screen | jq -c '{bar}')"; a2b_shot dialling
  gate wait_screen "$IN_CALL && document.querySelectorAll('.choice-button').length>0" 40
  echo "call back connected: $(screen | jq -c '{bar,subs,choices}')"; a2b_shot callback_call
  press_when "where do I start"; gate wait_screen "!document.getElementById('call-end-button')" 40; sleep 2
  echo "after the call: rows=$(rows agent_0x99) header=$(hdr_btn) mg=$(mgc)"
  echo "events: $(evs)"; a2b_shot after_call
  tts_log | cut -c1-600; a2b_quit ;;
*) echo "unknown case $1" >&2; exit 2 ;;
esac
