#!/bin/bash
# A4 live proofs on test_phone_calls: thread rows (rows 20, 21, 25) and phone state across a reload (row 27).
#   PC_PORT=3025 tools/phone_calls/routes/a4_live.sh rows|reload_ringing|reload_held|reload_connected|reload_forced|reload_timed|settle
# A reload is: sync, location.assign(?skip_resume=1), bootstrap resume (as se_dev.sh does).
export OUT=${OUT:-docs/agents/phone_calls/proofs/A4} NODE_PATH=$PWD/node_modules BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle
source "$(dirname "${BASH_SOURCE[0]}")/a2b_lib.sh"
wait_ring() { for i in $(seq 1 ${2:-60}); do a2b_ev "const c=window.phoneRinger.current(); return !!c && c.npcId==='$1' && c.state==='ringing';" | grep -qx true && return 0; sleep 1; done; return 1; }
wait_state() { for i in $(seq 1 ${3:-40}); do a2b_ev "const c=window.phoneRinger.current(); return !!c && c.npcId==='$1' && c.state==='$2';" | grep -qx true && return 0; sleep 1; done; return 1; }
calm_guard() { a2b_ev "window.gameState.globalVariables.guard_off = true; const m=window.MinigameFramework.currentMinigame; if (m && m._sceneType==='person-chat') window.MinigameFramework.endMinigame(false); return 'guard calm';" >/dev/null; }
clear_basic() { calm_guard; wait_ring caller_basic 40 && a2b_decline >/dev/null; sleep 1; }
gate() { "$@" || { echo "GATE FAILED: $*" >&2; a2b_quit; exit 1; }; }
mgc() { a2b_ev "const m=window.MinigameFramework.currentMinigame; return m ? m.constructor.name : null;"; }
st() { a2b_ev "$(cat tools/phone_calls/js/a4-state.js)"; }
fire() { a2b_ev "window.eventDispatcher.emit('$1', {}); return true;" >/dev/null; }
open_obj() { local n; for n in 1 2 3; do
  $S $GID "{\"cmd\":\"moveToNear\",\"id\":\"$1\"}" 30 >/dev/null; $S $GID "{\"cmd\":\"interact\",\"id\":\"$1\"}" 30 >/dev/null; sleep 1.5
  [ -z "$2" ] && return 0
  [ "$(mgc)" = "\"$2\"" ] && return 0
  a2b_ev "window.MinigameFramework.endMinigame(false); return true;" >/dev/null; sleep 1
done; return 1; }
open_phone() { $S $GID '{"cmd":"openInventoryItem","item":"phone"}' >/dev/null; sleep 2; }
sync_now() { a2b_ev "await window.stateSync.sync(); return true;" >/dev/null; sleep 1; }
reload() {
  sync_now
  $S $GID '{"cmd":"waitFor","kind":"condition","fn":"() => { setTimeout(() => location.assign(location.pathname + \"?skip_resume=1\"), 50); return true; }"}' >/dev/null
  sleep 8
  $S $GID '{"cmd":"bootstrap","tutorial":"decline","resume":"resume","autoBrief":true}' 120 >/dev/null
}
saved_server() { # what the server holds for the contact(s), after a sync
  sync_now
  BUNDLE_PATH=$BUNDLE_PATH bin/rails runner "g = BreakEscape::Game.find($GID); puts JSON.pretty_generate(g.player_state['phoneState'].slice(*ARGV))" "$@" 2>/dev/null
}
case $1 in
rows)
  AUTOBRIEF=true a2b_open rows; calm_guard
  gate wait_ring caller_basic 40; a2b_decline >/dev/null; sleep 1; echo "decline: $(st | jq -c '.caller_basic')"
  fire ring_thread; gate wait_ring caller_thread 25; a2b_answer >/dev/null; sleep 5
  gate a2b_ev "return document.getElementById('call-end-button') !== null;"
  a2b_ev "const b=document.getElementById('call-end-button'); b.click(); return 'End pressed';"; sleep 3.5
  echo "answered then End: $(st | jq -c '.caller_thread')"
  fire ring_decline; gate wait_ring caller_decline 25; echo "ringing caller_decline; letting it ring out"; sleep 25
  echo "ring-out: $(st | jq -c '.caller_decline') missed_seen=$(st | jq -c '._missed_seen')"
  open_phone; a2b_shot contacts; echo "contact previews: $(a2b_ev "return [...document.querySelectorAll('.contact-item')].map(c=>({id:c.dataset.npcId, preview:c.querySelector('.contact-last-message').innerText, red:c.querySelector('.contact-last-message').classList.contains('missed'), badge:(c.querySelector('.unread-badge')||{}).innerText||null, color:getComputedStyle(c.querySelector('.contact-last-message')).color}));" )"
  echo "badge on the phone item: $(a2b_ev "const b=document.querySelector('.phone-badge'); return b ? b.innerText : null;")"
  a2b_ev "const c=document.querySelector('.contact-item[data-npc-id=\"caller_decline\"]'); c.click(); return 'opened';" >/dev/null; sleep 2
  echo "caller_decline thread: $(a2b_ev "const r=document.querySelector('.message-call-row'); return r ? {text:r.innerText, cls:r.className, event:r.dataset.callEvent, color:getComputedStyle(r).color} : null;")"
  a2b_shot thread_missed
  a2b_ev "const m=window.MinigameFramework.currentMinigame; if(m) m.complete(false); return 'closed';" >/dev/null; sleep 1
  echo "after opening: $(st | jq -c '.caller_decline.rows')  badge: $(a2b_ev "const b=document.querySelector('.phone-badge'); return b ? b.innerText : null;")"
  open_phone; a2b_ev "document.querySelector('.contact-item[data-npc-id=\"caller_thread\"]').click(); return 1;" >/dev/null; sleep 2; a2b_shot thread_incoming
  echo "caller_thread rows in the DOM: $(a2b_ev "return [...document.querySelectorAll('.message-call-row')].map(r=>r.innerText);")"
  a2b_quit ;;
reload_ringing)
  AUTOBRIEF=true a2b_open reload_ringing; gate clear_basic
  fire ring_decline; gate wait_ring caller_decline 25; echo "before: $(st | jq -c '.caller_decline, ._current')"
  saved_server caller_decline > "$OUT/reload_ringing_server.json"; jq -c '.caller_decline.pendingCall' "$OUT/reload_ringing_server.json"
  reload; sleep 3
  echo "after reload: $(st | jq -c '.caller_decline, ._current, ._missed_seen')"; a2b_shot after_reload
  a2b_quit ;;
ringing_autosync)
  # A4 R1 m1: the slot reaches the server about 0.5 s after the ring, with no sync_now and no reload
  AUTOBRIEF=true a2b_open ringing_autosync; gate clear_basic
  fire ring_decline; gate wait_ring caller_decline 25; sleep 2
  echo "server slot, no manual sync: $(BUNDLE_PATH=$BUNDLE_PATH bin/rails runner "g = BreakEscape::Game.find($GID); puts JSON.generate(g.player_state['phoneState'].dig('caller_decline','pendingCall'))" 2>/dev/null)"
  a2b_decline >/dev/null; sleep 2
  echo "server slot after Decline: $(BUNDLE_PATH=$BUNDLE_PATH bin/rails runner "g = BreakEscape::Game.find($GID); puts JSON.generate(g.player_state['phoneState'].dig('caller_decline','pendingCall'))" 2>/dev/null)"
  a2b_quit ;;
reload_held)
  AUTOBRIEF=true a2b_open reload_held; gate clear_basic
  a2b_lever lever_hold; gate open_obj keypad_safe
  gate wait_ring caller_hold 20; a2b_answer >/dev/null; sleep 1.5
  echo "before: $(st | jq -c '.caller_hold, ._current')"; a2b_shot held_before
  saved_server caller_hold > "$OUT/reload_held_server.json"; jq -c '.caller_hold.pendingCall' "$OUT/reload_held_server.json"
  reload; sleep 3
  echo "after reload: $(st | jq -c '.caller_hold, ._current, ._open')"; a2b_shot after_reload
  a2b_quit ;;
reload_connected)
  AUTOBRIEF=true a2b_open reload_connected; gate clear_basic
  fire ring_thread; gate wait_ring caller_thread 25; a2b_answer >/dev/null; sleep 4
  gate a2b_ev "return document.getElementById('call-end-button') !== null;"
  echo "before: $(st | jq -c '.caller_thread, ._current, ._open')"; a2b_shot connected_before
  saved_server caller_thread > "$OUT/reload_connected_server.json"; jq -c '.caller_thread.pendingCall' "$OUT/reload_connected_server.json"
  reload; sleep 3
  echo "after reload: $(st | jq -c '.caller_thread, ._current, ._open')"; a2b_shot after_reload
  a2b_quit ;;
reload_forced)
  AUTOBRIEF=true a2b_open reload_forced; gate clear_basic
  fire ring_forced; gate wait_state caller_forced connected 40; sleep 6
  echo "before: $(st | jq -c '.caller_forced, ._current, ._open')"; a2b_shot forced_before
  saved_server caller_forced > "$OUT/reload_forced_server.json"; jq -c '.caller_forced.pendingCall' "$OUT/reload_forced_server.json"
  reload
  for t in 1 2 3 4 5 6 7 8 9 10 11 12; do echo "t+$t: $(st | jq -c '[.caller_forced.ringer, ._current, ._open]')"; sleep 2; done
  a2b_shot after_reload
  echo "rows: $(st | jq -c '.caller_forced.rows')"
  a2b_quit ;;
reload_timed)
  # timed_caller rings 2 s after game_loaded (opening: true), and rings out inside bootstrap, so a watcher goes into the page
  # first: 1.5 s into the ring it syncs and reloads the page (the ring is still up).
  W=$A2B_TMP/timed_watch.js
  cat > $W <<'JS'
window.__tc = { ringAt: null };
setInterval(async () => {
  const c = window.phoneRinger && window.phoneRinger.current && window.phoneRinger.current();
  const t = Math.round(performance.now());
  if (!!c && c.npcId === 'timed_caller' && c.state === 'ringing' && window.__tc.ringAt === null) window.__tc.ringAt = t;
  if (window.__tc.ringAt !== null && t - window.__tc.ringAt > 1500 && !window.__tc.reloading) {
    window.__tc.reloading = true;
    try { await window.stateSync.sync(); } catch (e) {}
    setTimeout(() => location.assign(location.pathname + '?skip_resume=1'), 100);
  }
}, 100);
return true;
JS
  PRE_EV=$W AUTOBRIEF=true timeout 100 bash -c 'source tools/phone_calls/routes/a2b_lib.sh; a2b_open reload_timed --set skip_timed=false' ; GID=$(cat $OUT/reload_timed_game_id.txt); LABEL=reload_timed
  sleep 10
  $S $GID '{"cmd":"bootstrap","tutorial":"decline","resume":"resume","autoBrief":true}' 120 >/dev/null
  saved_server timed_caller > "$OUT/reload_timed_server.json"; echo "server: $(jq -c '.timed_caller.pendingCall' "$OUT/reload_timed_server.json")"
  for t in 1 2 3 4 5 6 7 8; do echo "t+$t: $(st | jq -c '[.timed_caller.ringer, .timed_caller.rows, ._current, ._timed_ringing]')"; sleep 2; done
  echo "timed conversation delivered ids saved: $(a2b_ev "return window.npcManager.exportTimedMessages().delivered;")"
  a2b_shot after_reload; a2b_quit ;;
settle)
  # settleOnSeenLines after a reload: ring_thread, Answer, End (phone never opened), sync, reload, then the thread
  AUTOBRIEF=true a2b_open settle; gate clear_basic
  fire ring_thread; gate wait_ring caller_thread 25; a2b_answer >/dev/null; sleep 3
  gate a2b_ev "return document.getElementById('call-end-button') !== null;"
  a2b_ev "const b=document.getElementById('call-end-button'); b.click(); return 'End pressed';"; sleep 3.5
  echo "before reload: $(st | jq -c '.caller_thread')"
  reload; sleep 2
  echo "after reload: $(st | jq -c '.caller_thread')"
  open_phone; a2b_ev "document.querySelector('.contact-item[data-npc-id=\"caller_thread\"]').click(); return 1;" >/dev/null; sleep 2
  echo "thread: $(a2b_ev "const m=document.querySelector('.messages-container'); const c=[...document.querySelectorAll('.choice-button')].map(b=>b.innerText.trim()); return {thread: m ? m.innerText.replace(/\n+/g,' | ') : null, choices:c};")"
  a2b_shot thread
  a2b_ev "const m=window.MinigameFramework.currentMinigame; if(m) m.complete(false); return 'closed';" >/dev/null; sleep 1
  open_phone; a2b_ev "document.querySelector('.contact-item[data-npc-id=\"caller_thread\"]').click(); return 1;" >/dev/null; sleep 2
  echo "second open: $(a2b_ev "const m=document.querySelector('.messages-container'); const c=[...document.querySelectorAll('.choice-button')].map(b=>b.innerText.trim()); return {thread: m ? m.innerText.replace(/\n+/g,' | ') : null, choices:c};")"
  a2b_quit ;;
esac
