#!/bin/bash
# A6 live proofs on test_phone_calls: callback and voicemail (plan 2.6), and a reload mid-call (A5 R1 M1).
#   PC_PORT=3024 tools/phone_calls/routes/a6_live.sh patient|decline|debrief_ko|voicemail|terminal|midcall_out|midcall_in|voicemail_open|voicemail_held_reload
# Each route fires the ring event, uses the real banner buttons, the real header and row buttons, and logs the rows, the
# thread, the callback and the /tts requests (the keyless server answers 503; the request list is the evidence).
export OUT=${OUT:-docs/agents/phone_calls/proofs/A6} NODE_PATH=$PWD/node_modules BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle
source "$(dirname "${BASH_SOURCE[0]}")/a2b_lib.sh"
wait_ring() { for i in $(seq 1 ${2:-60}); do a2b_ev "const c=window.phoneRinger.current(); return !!c && c.npcId==='$1' && c.state==='ringing';" | grep -qx true && return 0; sleep 1; done; return 1; }
calm_guard() { a2b_ev "window.gameState.globalVariables.guard_off = true; const m=window.MinigameFramework.currentMinigame; if (m && m._sceneType==='person-chat') window.MinigameFramework.endMinigame(false); return 'guard calm';" >/dev/null; }
clear_basic() { calm_guard; wait_ring caller_basic 40 && a2b_decline >/dev/null; sleep 1; }
gate() { "$@" || { echo "GATE FAILED: $*" >&2; a2b_quit; exit 1; }; }
open_phone() { $S $GID '{"cmd":"openInventoryItem","item":"phone"}' >/dev/null; sleep 2; }
open_thread() { a2b_ev "const c=document.querySelector('.contact-item[data-npc-id=\"$1\"]'); if(!c) return 'no contact $1'; c.click(); return 'opened $1';" >/dev/null; sleep 2; }
close_phone() { a2b_ev "const m=window.MinigameFramework.currentMinigame; if(m) m.complete(false); return 'closed';" >/dev/null; sleep 1; }
fire() { a2b_ev "window.eventDispatcher.emit('$1', {}); return true;" >/dev/null; }
sync_now() { a2b_ev "await window.stateSync.sync(); return true;" >/dev/null; sleep 1; }
reload() {
  sync_now
  $S $GID '{"cmd":"waitFor","kind":"condition","fn":"() => { setTimeout(() => location.assign(location.pathname + \"?skip_resume=1\"), 50); return true; }"}' >/dev/null
  sleep 8
  $S $GID '{"cmd":"bootstrap","tutorial":"decline","resume":"resume","autoBrief":true}' 120 >/dev/null
}
wait_screen() { for i in $(seq 1 ${2:-30}); do a2b_ev "return $1;" | grep -qx true && return 0; sleep 1; done; return 1; }
IN_CALL="!!document.getElementById('call-end-button') && !!document.querySelector('.choice-button')"
LOGEV="window.__ev=[]; for (const n of ['phone_call_answered:caller_decline','phone_call_declined:caller_decline','phone_call_missed:caller_decline','phone_call_declined:caller_patient','phone_call_declined:caller_voicemail','phone_call_declined:caller_terminal','phone_call_missed:caller_debrief','phone_call_answered:caller_debrief','conversation_closed:caller_debrief']) window.eventDispatcher.on(n, d => window.__ev.push([n, d && d.callback === true ? 'callback' : ''])); window.__toasts=[]; const sn=window.showNotification; window.showNotification=function(t){ window.__toasts.push(String(t)); return sn.apply(this, arguments); }; return true;"
evs() { a2b_ev "return {events: window.__ev, toasts: window.__toasts};"; }
# per contact: rows, callback, saved slot, the knot the thread opens on
state() { a2b_ev "const out={}; for (const id of ['caller_patient','caller_decline','caller_voicemail','caller_terminal','caller_debrief','caller_thread','desk_contact']) { const o=window.npcManager.getNPC(id); const h=window.npcManager.getConversationHistory(id)||[]; out[id]={rows:h.filter(m=>m.type==='call').map(m=>m.text+(m.read?'':' [unread]')), lines:h.filter(m=>m.type!=='call').map(m=>m.text), callback:window.phoneRinger.callbackFor(id), slot:o&&o.pendingCall?JSON.parse(JSON.stringify(o.pendingCall)):null, currentKnot:o&&o.currentKnot}; } const m=window.MinigameFramework.currentMinigame; out._open=m?{type:m._sceneType,npc:m.params&&m.params.npcId||null}:null; return out;"; }
# the open thread: header button, row buttons, the text on screen, the choices
thread() { a2b_ev "const m=document.querySelector('.messages-container'); const hb=document.querySelector('.call-button'); const rb=[...document.querySelectorAll('.call-row-callback')].map(b=>b.getAttribute('aria-label')); return {header: hb?{text:hb.innerText.trim(),aria:hb.getAttribute('aria-label')}:null, rowButtons:rb, text:m?m.innerText.replace(/\n+/g,' | '):null, choices:[...document.querySelectorAll('.choice-button')].map(b=>b.innerText.trim())};"; }
screen() { a2b_ev "const bar=document.getElementById('call-status-bar'); const subs=[...document.querySelectorAll('.call-subtitle')].map(s=>s.innerText.replace(/\n+/g,' ')); return {bar:bar?bar.innerText.replace(/\n+/g,' '):null, subs, choices:[...document.querySelectorAll('.choice-button')].map(b=>b.innerText.trim())};"; }
press() { a2b_ev "const b=document.querySelector('$1'); if(!b) return 'no $1'; b.click(); return 'pressed $1';"; }
end_call() { press '#call-end-button' >/dev/null; sleep 4; }
tts_log() { echo "/tts requests ($OUT/${LABEL}_tts.jsonl): $(jq -c '[.npc_id // .npcId, .text] ' "$OUT/${LABEL}_tts.jsonl" 2>/dev/null | tr '\n' ' ')"; }
start() { AUTOBRIEF=true a2b_open "$@"; gate clear_basic; a2b_ev "$LOGEV" >/dev/null; }
# A6 R1 M1: a voicemail while the caller's own thread is open is held until the thread closes
vm_vars() { a2b_ev "const o=window.npcManager.getNPC('caller_voicemail'); const ss=typeof o.storyState==='string'?o.storyState:''; const m=/\"heard_vm\":(true|false)/.exec(ss); const st=window.npcConversationStateManager.conversationStates.get('caller_voicemail'); const h=window.npcManager.getConversationHistory('caller_voicemail')||[]; return {storyState_heard_vm: m?m[1]:null, savedInkVars_heard_vm: st&&st.variables?st.variables.heard_vm:null, rows:h.filter(x=>x.type==='call').map(x=>x.text), lines:h.filter(x=>x.type!=='call').map(x=>x.text), slot:o.pendingCall?JSON.parse(JSON.stringify(o.pendingCall)):null, toasts:window.__toasts};"; }
case $1 in
patient)
  start patient
  fire ring_patient; gate wait_ring caller_patient 25; a2b_shot ringing; echo "ringing 30 s, then Decline"; sleep 30
  echo "still ringing: $(a2b_ev "const c=window.phoneRinger.current(); return c&&{npc:c.npcId,state:c.state};")"
  a2b_decline >/dev/null; sleep 1
  echo "after Decline: $(state | jq -c '.caller_patient')"; evs
  open_phone; open_thread caller_patient; echo "thread: $(thread)"; a2b_shot thread_missed; tts_log; a2b_quit ;;
decline)
  start decline
  fire ring_decline; gate wait_ring caller_decline 25; a2b_decline >/dev/null; sleep 1
  echo "declined: $(state | jq -c '.caller_decline')"; evs
  open_phone; open_thread caller_decline; echo "thread: $(thread)"; a2b_shot buttons
  press .call-button >/dev/null; sleep 1; echo "dialling: $(screen)"; a2b_shot calling
  gate wait_screen "$IN_CALL" 14; echo "header button -> connected: $(screen)"; a2b_shot callback_call
  echo "callback while on the line: $(state | jq -c '.caller_decline | {callback,slot}')"
  end_call; echo "after End: $(state | jq -c '.caller_decline | {rows,callback,slot,currentKnot}')"; echo "thread: $(thread)"; a2b_shot thread_after
  close_phone
  # the row's own button
  fire ring_decline; gate wait_ring caller_decline 25; a2b_decline >/dev/null; sleep 1
  open_phone; open_thread caller_decline; echo "thread (second miss): $(thread)"
  press .call-row-callback >/dev/null; gate wait_screen "$IN_CALL" 14; echo "row button -> connected: $(screen)"; a2b_shot row_button_call
  end_call; close_phone
  # row 7: a new ring while a callback is pending clears it
  fire ring_decline; gate wait_ring caller_decline 25; a2b_decline >/dev/null; sleep 1
  echo "callback pending: $(state | jq -c '.caller_decline.callback')"
  fire ring_decline; gate wait_ring caller_decline 25; echo "ringing again, callback cleared: $(state | jq -c '.caller_decline | {callback,slot}')"
  a2b_decline >/dev/null; sleep 1
  # a reload with the callback pending
  sync_now; reload; sleep 3
  echo "after reload: $(state | jq -c '.caller_decline | {rows,callback,slot}')"
  open_phone; open_thread caller_decline; echo "thread after reload: $(thread)"; a2b_shot buttons_after_reload
  press .call-button >/dev/null; gate wait_screen "$IN_CALL" 14; echo "after reload, callback connected: $(screen)"; a2b_shot callback_call_after_reload
  end_call; evs; tts_log; a2b_quit ;;
debrief_ko)
  start debrief_ko
  fire ring_debrief; gate wait_ring caller_debrief 25; a2b_answer >/dev/null; gate wait_screen "$IN_CALL" 20; echo "on the line: $(screen)"; a2b_shot on_the_line
  a2b_ev "return window.closeMinigameForKnockout();" >/dev/null; sleep 3
  echo "after the knockout close: $(state | jq -c '.caller_debrief | {rows,callback,slot,currentKnot}')"; evs
  open_phone; open_thread caller_debrief; echo "thread: $(thread)"; a2b_shot thread_home
  press .call-button >/dev/null; gate wait_screen "$IN_CALL" 14; echo "calling back: $(screen)"; a2b_shot callback_call
  end_call; tts_log; a2b_quit ;;
voicemail|terminal)
  if [ "$1" = voicemail ]; then ID=caller_voicemail; EV=ring_voicemail; else ID=caller_terminal; EV=ring_terminal; fi
  start $1
  fire $EV; gate wait_ring $ID 25; echo "banner: $(a2b_ev "const b=document.querySelector('.incoming-call'); return b ? b.innerText.replace(/\n+/g,' | ') : null;")"; a2b_shot banner
  a2b_decline >/dev/null; sleep 4
  echo "after Decline: $(state | jq -c ".$ID")"; evs
  open_phone; echo "contact list: $(a2b_ev "return [...document.querySelectorAll('.contact-item')].filter(c=>c.dataset.npcId==='$ID').map(c=>c.innerText.replace(/\n+/g,' | '));")"
  open_thread $ID; echo "thread: $(thread)"; a2b_shot thread
  echo "voice bubbles: $(a2b_ev "return document.querySelectorAll('.voice-message-display').length;")"
  for n in 0 1; do
    a2b_ev "const c=[...document.querySelectorAll('.voice-message-display .audio-controls')]; if (!c[$n]) return 'no bubble $n'; c[$n].click(); return 'tapped bubble $n';" >/dev/null; sleep 4
    a2b_ev "const c=[...document.querySelectorAll('.voice-message-display .audio-controls')]; const p=window.MinigameFramework.currentMinigame && window.MinigameFramework.currentMinigame.ui; if (p && p.isPlaying) { p.stopVoiceMessage(p.currentPlayButton); } return true;" >/dev/null; sleep 1
  done
  echo "the VAR the voicemail knot set, read by the thread's home knot: $(thread | jq -c '.text')"
  tts_log; a2b_quit ;;
voicemail_open)
  start voicemail_open
  open_phone; open_thread caller_voicemail; echo "thread open: $(thread | jq -c '{text,choices}')"
  echo "before the ring: $(vm_vars)"
  fire ring_voicemail; gate wait_ring caller_voicemail 25; a2b_shot ringing_in_phone
  press 'button[aria-label="Decline call"]' >/dev/null; sleep 5
  echo "after the in-phone Decline, thread still open (voicemail must be held): $(vm_vars)"; echo "open: $(state | jq -c '._open')"; a2b_shot held_thread
  a2b_ev "const b=[...document.querySelectorAll('.choice-button')].find(x=>/Anything new/.test(x.innerText)); if(!b) return 'no choice'; b.click(); return 'chose';" >/dev/null; sleep 3
  echo "after choosing in the open thread (its own save): $(vm_vars)"; echo "thread: $(thread | jq -c '.text')"
  close_phone; sleep 5
  echo "after the thread closed (voicemail runs now): $(vm_vars)"
  open_phone; open_thread caller_voicemail; echo "reopened thread: $(thread | jq -c '{text,choices}')"; a2b_shot thread_after_close
  echo "voice bubbles: $(a2b_ev "return document.querySelectorAll('.voice-message-display').length;")"
  a2b_ev "const b=[...document.querySelectorAll('.choice-button')].find(x=>/Anything new/.test(x.innerText)); if(b) b.click(); return true;" >/dev/null; sleep 2
  echo "home line after a choice: $(thread | jq -c '.text')"; a2b_shot home_line
  tts_log; a2b_quit ;;
voicemail_held_reload)
  start voicemail_held_reload
  open_phone; open_thread caller_voicemail
  fire ring_voicemail; gate wait_ring caller_voicemail 25
  press 'button[aria-label="Decline call"]' >/dev/null; sleep 4
  echo "held, thread open: $(vm_vars)"
  reload; sleep 6
  echo "after the reload (delivered, quiet): $(vm_vars)"
  open_phone; open_thread caller_voicemail; echo "thread: $(thread | jq -c '{text,choices}')"; a2b_shot thread_after_reload
  echo "server: $(BUNDLE_PATH=$BUNDLE_PATH bin/rails runner "g = BreakEscape::Game.find($GID); e = g.player_state['phoneState']['caller_voicemail']; puts JSON.generate({pendingCall: e['pendingCall']})" 2>/dev/null)"
  tts_log; a2b_quit ;;
midcall_out)
  start midcall_out
  open_phone; open_thread desk_contact; press .call-button >/dev/null; gate wait_screen "$IN_CALL" 14; echo "outgoing call connected: $(screen)"
  echo "before reload: $(state | jq -c '.desk_contact | {currentKnot,rows}')"
  reload; sleep 5
  echo "after reload: $(state | jq -c '.desk_contact | {currentKnot,rows,callback}')"
  open_phone; open_thread desk_contact; echo "thread: $(thread)"; a2b_shot thread_after_reload
  close_phone; sync_now
  echo "server: $(BUNDLE_PATH=$BUNDLE_PATH bin/rails runner "g = BreakEscape::Game.find($GID); e = g.player_state['phoneState']['desk_contact']; puts JSON.generate({currentKnot: e['currentKnot'], pendingCall: e['pendingCall']})" 2>/dev/null)"
  a2b_quit ;;
midcall_in)
  start midcall_in
  fire ring_thread; gate wait_ring caller_thread 25; a2b_answer >/dev/null; gate wait_screen "$IN_CALL" 20; echo "incoming call connected: $(screen)"
  echo "before reload: $(state | jq -c '.caller_thread | {currentKnot,rows}')"
  reload; sleep 5
  echo "after reload: $(state | jq -c '.caller_thread | {currentKnot,rows,callback,slot}')"
  open_phone; open_thread caller_thread; echo "thread: $(thread)"; a2b_shot thread_after_reload
  a2b_quit ;;
esac
