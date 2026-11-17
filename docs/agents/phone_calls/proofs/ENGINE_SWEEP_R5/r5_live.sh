#!/bin/bash
# Engine sweep review R5 live proofs (committed code). Keyless server on :3027 only.
#   PC_PORT=3027 OUT=docs/agents/phone_calls/proofs/ENGINE_SWEEP_R5 bash docs/agents/phone_calls/proofs/ENGINE_SWEEP_R5/r5_live.sh <case>
# cases:
#   a_ring_reload  m05 Recruiter rings; reload while it rings -> one Missed call row, a Call back that dials
#   a_cb_reload    m05 Recruiter declined -> Call back; reload -> the Call back is still there and dials
#   b_vm_reload    m07 T-30 (withheld) declined inside the Architect's open thread -> voicemail held;
#                  reload -> the voicemail arrives once, no toast, no second Missed row
#   c_vance        m04 Robert Vance from the contact list -> device look; Call -> handset call screen
#   d_self, d_back m07 terminal call end: self-close read beat (2600 ms) and an immediate close on the back arrow
# Preconditions are head-start globals and the event a mapping listens for (named per case); the ring,
# banner, decline, reload, thread and Call back press are real.
export PC_PORT=${PC_PORT:?set PC_PORT}
export OUT=${OUT:-docs/agents/phone_calls/proofs/ENGINE_SWEEP_R5}
source "$(dirname "${BASH_SOURCE[0]}")/../../../../../tools/phone_calls/routes/m10_lib.sh"
hdr_btn() { a2b_ev "const b=document.querySelector('.call-button'); return b ? b.innerText.trim() : null;"; }
press_call() { a2b_ev "const b=document.querySelector('.call-button'); if(!b) return 'no call button'; b.click(); return 'Call pressed: '+b.innerText.trim();"; }
inline_cb() { a2b_ev "return [...document.querySelectorAll('.messages-container button')].map(b=>b.innerText.trim()).filter(Boolean);"; }
ringer_now() { a2b_ev "const c=window.phoneRinger.current(); return c?{npc:c.npcId,state:c.state,knot:c.knot}:null;"; }
emit() { a2b_ev "window.eventDispatcher.emit('$1',$2); return true;" >/dev/null; }
wait_ring() { gate wait_screen "!!(window.phoneRinger.current() && window.phoneRinger.current().state==='ringing')" ${1:-40}; }
HOOK="window.__ev=window.__ev||[]; window.__toasts=window.__toasts||[]; for (const n of ['phone_call_answered:NPCID','phone_call_declined:NPCID','phone_call_missed:NPCID']) window.eventDispatcher.on(n,(d)=>window.__ev.push(n+(d&&d.callback?' callback':'')+(d&&d.reload?' reload':''))); if(!window.__toastWrapped){ const o=window.showNotification; window.showNotification=function(t,...r){window.__toasts.push(t); return o&&o.call(this,t,...r);}; window.__toastWrapped=true; } return true;"
hook() { a2b_ev "$(echo "$HOOK" | sed "s/NPCID/$1/g")" >/dev/null; }
evs() { a2b_ev "return {ev: window.__ev, toasts: window.__toasts};"; }
slot() { a2b_ev "const n=window.npcManager.getNPC('$1'); return n ? n.pendingCall : 'no npc';"; }
toast_dom() { a2b_ev "return [...document.querySelectorAll('#notification-container .notification')].map(e=>e.innerText.replace(/\n+/g,' | '));"; }
cbfor() { a2b_ev "return window.phoneRinger.callbackFor('$1');"; }
# reload, then poll the notification container from the moment bootstrap returns
reload_watch() {
  a2b_ev "await window.stateSync.sync(); return true;" >/dev/null; sleep 1
  $S $GID '{"cmd":"waitFor","kind":"condition","fn":"() => { setTimeout(() => location.assign(location.pathname + \"?skip_resume=1\"), 50); return true; }"}' >/dev/null
  sleep 8
  $S $GID '{"cmd":"bootstrap","tutorial":"decline","resume":"resume","autoBrief":true}' 120 >/dev/null
  echo "toasts on screen just after load: $(toast_dom)"
  hook "$1"
  for t in 2 4 6; do sleep 2; echo "  +${t}s toasts on screen: $(toast_dom)"; done
}
dial_back() { # $1 npc: press the header Call back, follow it to the call screen
  echo "header button: $(hdr_btn); inline buttons: $(inline_cb)"
  press_call; sleep 1; echo "dialling: $(screen | jq -c '{bar}')"; a2b_shot dialling
  gate wait_screen "$IN_CALL && document.querySelectorAll('.choice-button').length>0" 40
  echo "call back connected: $(screen | jq -c '{bar,subs,choices}')"; a2b_shot callback_call
  echo "events: $(evs)"; echo "callback after connect: $(cbfor $1)"
}
case $1 in
a_ring_reload|a_cb_reload)
  # precondition: torres_identified head start, and HaX's thread-close event the Recruiter mapping waits for
  m10_open $1 m05_insider_trading --set torres_identified=true; hook recruiter
  emit 'conversation_closed:agent_0x99_handler' '{"npcId":"agent_0x99_handler"}'
  wait_ring 25; echo "ringing: $(ringer_now) rows=$(rows recruiter)"; a2b_shot ringing
  if [ $1 = a_cb_reload ]; then
    a2b_decline >/dev/null; sleep 2; echo "declined: ringer=$(ringer_now) rows=$(rows recruiter) callback=$(cbfor recruiter) events=$(evs)"
  fi
  echo "slot before reload: $(slot recruiter)"
  reload_watch recruiter
  echo "after reload: ringer=$(ringer_now) mg=$(mgc) rows=$(rows recruiter) callback=$(cbfor recruiter) slot=$(slot recruiter)"
  open_phone; open_thread recruiter; echo "thread: $(screen | jq -c '{header,thread}')"; a2b_shot after_reload
  dial_back recruiter
  echo "rows at the end: $(rows recruiter)"
  tts_log | cut -c1-800; a2b_quit ;;
b_vm_reload)
  source tools/phone_calls/routes/m6_live.sh __none__ 2>/dev/null
  m10_open $1 $SC $COUNTDOWN; sleep 1; hook the_architect
  open_phone; open_thread the_architect; echo "thread open: $(mgc) theme=$(a2b_ev "return window.MinigameFramework.currentMinigame.params.theme||null;")"
  enter_ops   # precondition: the room_entered event the T-30 mapping listens for
  gate wait_screen "!!document.querySelector('.phone-incoming-call-decline')" 25
  echo "ringing inside the open thread: $(ringer_now)"; a2b_shot ringing_in_thread
  a2b_ev "const b=document.querySelector('.phone-incoming-call-decline'); b.click(); return 'declined in thread';"; sleep 3
  echo "after decline: ringer=$(ringer_now) mg=$(mgc) rows=$(rows the_architect) vm bubbles=$(vm_bubbles) events=$(evs)"
  echo "slot before reload (voicemail held): $(slot the_architect)"; a2b_shot thread_after_decline
  reload_watch the_architect
  sleep 2; echo "after reload: rows=$(rows the_architect) slot=$(slot the_architect) events=$(evs)"
  echo "history: $(a2b_ev "return (window.npcManager.getConversationHistory('the_architect')||[]).map(m=>(m.type||m.sender)+':'+String(m.text||'').slice(0,50));")"
  open_phone; open_thread the_architect; sleep 1; echo "voice bubbles: $(vm_bubbles)"; echo "thread: $(thread_text | cut -c1-600)"; a2b_shot after_reload_thread
  echo "architect /tts: $(arch_tts)"; a2b_quit ;;
c_vance)
  look() { a2b_ev "const m=window.MinigameFramework.currentMinigame; return {mg: m?m.constructor.name:null, theme: m&&m.params?m.params.theme||null:null, appTheme: m?m.appTheme||null:null, terminalEls: document.querySelectorAll('[class*=terminal]').length, callScreen: !!document.getElementById('call-end-button')};"; }
  m10_open $1 m04_critical_failure --set vance_phone_available=true --set vance_is_ally=true; hook robert_vance_phone
  close_brief() { for i in 1 2 3 4 5 6; do r=$(a2b_ev "const m=window.MinigameFramework.currentMinigame; if(!m) return 'none'; const b=[...document.querySelectorAll('button')].find(x=>/End Conversation/.test(x.innerText)); if(b){b.click(); return 'closed briefing';} try{m.complete(false);}catch(e){} return 'closed '+m.constructor.name;"); echo "$r" | grep -q none && break; sleep 3; done; }
  close_brief
  for i in $(seq 1 10); do open_phone; a2b_ev "return !!document.querySelector('.contact-item[data-npc-id=\"robert_vance_phone\"]');" | grep -qx true && break; close_brief; sleep 2; done
  echo "contact list: $(look) contacts=$(a2b_ev "return [...document.querySelectorAll('.contact-item')].map(e=>e.dataset.npcId);")"; a2b_shot list
  open_thread robert_vance_phone; echo "thread from the list: $(look) header=$(hdr_btn)"; a2b_shot thread
  press_call; sleep 1; echo "dialling: $(look) $(screen | jq -c '{bar}')"; a2b_shot dialling
  wait_screen "$IN_CALL && document.querySelectorAll('.choice-button').length>0" 40
  echo "call: $(look) $(screen | jq -c '{bar,subs,choices}')"; a2b_shot call
  echo "events: $(evs)"; tts_log | cut -c1-500; a2b_quit ;;
d_self|d_back)
  # m07 terminal call end with the R5 probe (beat_probe.js, arguments forwarded). d_self: T-30 answered and
  # walked to its #exit_conversation (the call closes itself: 2600 ms read beat). d_back: the player hangs up
  # with the back arrow 3 s in (closes at once). Precondition: the room_entered event the T-30 mapping listens for.
  source tools/phone_calls/routes/m6_live.sh __none__ 2>/dev/null
  beat() { a2b_ev "return window.__beat;"; }
  m10_open $1 $SC $COUNTDOWN; sleep 1; tools/phone_calls/ev.sh $GID docs/agents/phone_calls/proofs/ENGINE_SWEEP_R5/beat_probe.js >/dev/null
  enter_ops; wait_banner 25; a2b_answer >/dev/null; wait_call 15; sleep 3
  if [ $1 = d_back ]; then
    a2b_ev "window.__backAt=Math.round(performance.now()); const b=document.getElementById('back-button'); if(!b) return 'no back'; b.click(); return 'back clicked';"
    sleep 1; a2b_shot after_back_1s; sleep 3; echo "back at $(a2b_ev "return window.__backAt;")"
  else
    drive_taunt; for i in $(seq 1 12); do [ "$(mgc)" = "null" ] && break; sleep 0.5; done
  fi
  echo "records: $(beat | jq -c '[.[] | {npc,theme,selfClose,beatAt,completeAt,goneAt,laterCalls,clipPlayingAtBeat,lastLineAtBeat, read_ms:(.completeAt-.beatAt)}]')"
  echo "rows: $(rows $AID) mg=$(mgc)"; beat > "$OUT/${LABEL}_beat.json"; a2b_quit ;;
*) echo "unknown case $1" >&2; exit 2 ;;
esac
