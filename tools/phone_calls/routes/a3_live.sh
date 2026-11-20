#!/bin/bash
# A3 live proofs on test_phone_calls: a call ringing inside the player's phone (plan 2.3 row 10).
#   PC_PORT=3025 tools/phone_calls/routes/a3_live.sh own|other|list|desk|hit|closed
# Each route opens the phone as the player would (inventory item), rings caller_thread (the `ring_thread` event, 8 s
# delay), answers, ends the call and checks the phone reopens on the screen it was on. Logs conversation_closed
# events with times, takes screenshots under $OUT.
export OUT=${OUT:-docs/agents/phone_calls/proofs/A3} NODE_PATH=$PWD/node_modules BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle
source "$(dirname "${BASH_SOURCE[0]}")/a2b_lib.sh"
wait_ring() { for i in $(seq 1 ${2:-60}); do a2b_ev "const c=window.phoneRinger.current(); return !!c && c.npcId==='$1' && c.state==='ringing';" | grep -qx true && return 0; sleep 1; done; return 1; }
wait_state() { for i in $(seq 1 ${3:-40}); do a2b_ev "const c=window.phoneRinger.current(); return !!c && c.npcId==='$1' && c.state==='$2';" | grep -qx true && return 0; sleep 1; done; return 1; }
calm_guard() { a2b_ev "window.gameState.globalVariables.guard_off = true; const m=window.MinigameFramework.currentMinigame; if (m && m._sceneType==='person-chat') window.MinigameFramework.endMinigame(false); return 'guard calm';" >/dev/null; }
clear_basic() { calm_guard; wait_ring caller_basic 40 && a2b_decline >/dev/null; sleep 1; }
gate() { "$@" || { echo "GATE FAILED: $*" >&2; a2b_quit; exit 1; }; }
mgc() { a2b_ev "const m=window.MinigameFramework.currentMinigame; return m ? m.constructor.name : null;"; }
dump() { a2b_ev "$(cat tools/phone_calls/js/thread-dump.js)"; }
LOGEV="window.__ev=[]; for (const n of ['conversation_closed:caller_thread','conversation_closed:texter','conversation_closed:desk_line','phone_call_answered:caller_thread','phone_call_declined:caller_thread','phone_call_missed:caller_thread','minigame_failed','minigame_completed']) window.eventDispatcher.on(n, ()=>window.__ev.push(n+'@'+Math.round(performance.now()/100)/10)); return true;"
evs() { a2b_ev "return window.__ev;"; }
open_phone() { $S $GID '{"cmd":"openInventoryItem","item":"phone"}' >/dev/null; sleep 2; }
open_thread() { a2b_ev "const c=document.querySelector('.contact-item[data-npc-id=\"$1\"]'); if(!c) return 'no contact $1'; c.click(); return 'opened $1';"; sleep 2; }
panel() { a2b_ev "const p=document.querySelector('.phone-incoming-call'); return p ? p.innerText.replace(/\n+/g,' | ') : null;"; }
panel_answer() { a2b_ev "const b=document.querySelector('.phone-incoming-call-answer'); if(!b) return 'no panel answer'; b.click(); return 'answered';"; }
thread_text() { a2b_ev "const m=document.querySelector('.messages-container'); const c=[...document.querySelectorAll('.choice-button')].map(b=>b.innerText.trim()); return {thread: m ? m.innerText.replace(/\n+/g,' | ').slice(-400) : null, choices:c};"; }
call_text() { a2b_ev "const c=[...document.querySelectorAll('.choice-button')].map(b=>b.innerText.trim()); const s=document.querySelector('.call-subtitles, .call-subtitle, #call-caption'); return {choices:c, screen: !!document.getElementById('call-end-button')};"; }
case $1 in
own|other|list)
  AUTOBRIEF=true a2b_open $1; gate clear_basic; a2b_ev "$LOGEV" >/dev/null
  open_phone; echo "phone open: $(mgc) $(dump | jq -c '._open')"
  case $1 in
    own) open_thread caller_thread ;;
    other) open_thread texter ;;
  esac
  echo "before: $(dump | jq -c '.')"; a2b_shot phone_before
  echo "thread before: $(thread_text)"
  a2b_ev "window.eventDispatcher.emit('ring_thread', {}); return true;" >/dev/null
  gate wait_ring caller_thread 25; echo "panel: $(panel)  layer banner: $(a2b_ev "return !!document.querySelector('#phone-ring-layer .incoming-call')")"; a2b_shot panel
  # a number key must not pick a reply under the panel
  a2b_ev "document.dispatchEvent(new KeyboardEvent('keydown',{key:'1',bubbles:true})); return 'key 1';" >/dev/null; sleep 0.5; echo "after key 1: $(dump | jq -c '.caller_thread')"
  panel_answer; sleep 0.3; echo "0.3 s after Answer: mg=$(mgc)"; sleep 2.5
  echo "call open: $(dump | jq -c '._open') events: $(evs)"; a2b_shot call_open; echo "call choices: $(call_text)"
  if [ $1 = own ]; then
    gate a2b_ev "return document.querySelectorAll('.choice-button').length > 0;"
    echo "choices showing: $(call_text)"; a2b_shot call_choices
  fi
  a2b_ev "const b=document.getElementById('call-end-button'); if(!b) return 'no End button'; b.click(); return 'End pressed';"; sleep 3.5
  echo "after End: $(dump | jq -c '.')"; echo "events: $(evs)"; a2b_shot phone_after
  echo "thread after: $(thread_text)"
  echo "storyState dump: $(dump | jq -c '.caller_thread')"
  # close the phone for real: conversation_closed for the open thread fires now, once
  a2b_ev "const m=window.MinigameFramework.currentMinigame; if(m) m.complete(false); return 'phone closed';"; sleep 1.5
  echo "after the real close: events: $(evs)"
  a2b_ev "return window.__ev;" > "$OUT/${1}_events.json"; a2b_quit ;;
hit)
  # A3 R1 M1: texter thread open, caller_thread rings in the phone, Answer, a hit, End. The phone is not reopened (a hit
  # inside HIT_QUIET_MS), so the ringer must emit conversation_closed:texter itself, once.
  AUTOBRIEF=true a2b_open hit; gate clear_basic; a2b_ev "$LOGEV" >/dev/null
  open_phone; open_thread texter; echo "before: $(dump | jq -c '._open')"
  a2b_ev "window.eventDispatcher.emit('ring_thread', {}); return true;" >/dev/null
  gate wait_ring caller_thread 25; panel_answer; sleep 3
  echo "call open: $(dump | jq -c '._open') events: $(evs)"
  gate a2b_ev "return document.getElementById('call-end-button') !== null;"
  a2b_ev "window.playerHealth.damage(5); return 'hit';"; sleep 0.5
  a2b_ev "const b=document.getElementById('call-end-button'); if(!b) return 'no End button'; b.click(); return 'End pressed';"; sleep 3.5
  echo "after End: $(dump | jq -c '._open') events: $(evs)"; a2b_shot after_end; sleep 8
  echo "8 s later: $(dump | jq -c '._open') events: $(evs)"
  a2b_ev "return window.__ev;" > "$OUT/hit_events.json"; a2b_quit ;;
closed)
  # A3 R1 m1: the phone is closed the whole time. caller_thread rings (banner), Answer, End, then the phone and the thread are
  # opened: the thread must show the hub line once, and the home knot's choices.
  AUTOBRIEF=true a2b_open closed; gate clear_basic; a2b_ev "$LOGEV" >/dev/null
  a2b_ev "window.eventDispatcher.emit('ring_thread', {}); return true;" >/dev/null
  gate wait_ring caller_thread 25; a2b_answer >/dev/null; sleep 3
  gate a2b_ev "return document.getElementById('call-end-button') !== null;"
  a2b_ev "const b=document.getElementById('call-end-button'); b.click(); return 'End pressed';"; sleep 3.5
  echo "after End: $(dump | jq -c '.')"
  open_phone; open_thread caller_thread; sleep 1
  echo "thread: $(thread_text)"; a2b_shot thread
  a2b_ev "const m=window.MinigameFramework.currentMinigame; if(m) m.complete(false); return 'phone closed';"; sleep 1
  open_phone; open_thread caller_thread; sleep 1
  echo "thread on a second open: $(thread_text)"
  a2b_ev "return window.__ev;" > "$OUT/closed_events.json"; a2b_quit ;;
desk)
  AUTOBRIEF=true a2b_open desk; gate clear_basic; a2b_ev "$LOGEV" >/dev/null
  $S $GID '{"cmd":"moveToNear","id":"desk_phone"}' 30 >/dev/null; $S $GID '{"cmd":"interact","id":"desk_phone"}' 30 >/dev/null; sleep 2
  echo "desk phone: $(mgc) $(dump | jq -c '._open')"
  a2b_ev "window.eventDispatcher.emit('ring_thread', {}); return true;" >/dev/null
  gate wait_ring caller_thread 25; echo "banner: $(a2b_status | jq -c '.banner') panel: $(panel)"; a2b_shot desk_banner
  a2b_answer >/dev/null; sleep 1.5; echo "after Answer: $(dump | jq -c '._open') ringer: $(a2b_status | jq -c '.ringer')"; a2b_shot desk_held
  a2b_ev "window.MinigameFramework.endMinigame(false); return 'desk phone closed';" >/dev/null; sleep 3
  echo "after desk closed: $(dump | jq -c '._open')"; a2b_shot desk_call
  a2b_ev "const b=document.getElementById('call-end-button'); if(!b) return 'no End'; b.click(); return 'End';"; sleep 3.5
  echo "after End: $(dump | jq -c '._open') events: $(evs)"; a2b_shot desk_after
  a2b_quit ;;
esac
