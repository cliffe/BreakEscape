#!/bin/bash
# M1 live proofs on m09 (Nightshade, Torres, Gary incoming rings). Own server port required:
#   PC_PORT=3025 tools/phone_calls/routes/m09_m1_live.sh gary_hold|gary_popup|gary_decline|torres_box|nightshade|reload
# Carry-over branches come from proofs/M1/imports.json (m02_gary_protected, m05_torres_turned, m08_nightshade_triple_agent).
# Real path: the keypad door and the lid are driven with moveToNear/interact. Only gary_popup emits door_unlock_attempt
# itself (the engine event the door raises), because the player cannot open the CyberChef popup and the keypad together.
export OUT=${OUT:-docs/agents/phone_calls/proofs/M1} NODE_PATH=$PWD/node_modules BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle
source "$(dirname "${BASH_SOURCE[0]}")/a2b_lib.sh"
IMP=${IMP:-$OUT/imports.json}
open_m09() { LABEL=$1; shift; mkdir -p $OUT
  GID=$(tools/phone_calls/newgame.sh m09_digital_archaeology --imports=$IMP "$@" | sed -n 's/^GAME_ID=//p'); [ -n "$GID" ] || { echo "no game" >&2; exit 1; }
  echo $GID > $OUT/${LABEL}_game_id.txt
  tools/phone_calls/open.sh $GID $OUT/${LABEL}_session.jsonl $OUT/${LABEL}_tts.jsonl true >/dev/null; echo "game $GID ($LABEL)"; }
wait_ring() { for i in $(seq 1 ${2:-40}); do a2b_ev "const c=window.phoneRinger.current(); return !!c && c.npcId==='$1' && c.state==='ringing';" | grep -qx true && return 0; sleep 1; done; return 1; }
wait_state() { for i in $(seq 1 ${3:-40}); do a2b_ev "const c=window.phoneRinger.current(); return !!c && c.npcId==='$1' && c.state==='$2';" | grep -qx true && return 0; sleep 1; done; return 1; }
gate() { "$@" || { echo "GATE FAILED: $*" >&2; a2b_status | cut -c1-400; a2b_quit; exit 1; }; }
mgc() { a2b_ev "const m=window.MinigameFramework.currentMinigame; return m ? m.constructor.name : null;"; }
tl() { a2b_ev "const c=window.phoneRinger.current(); const m=window.MinigameFramework.currentMinigame; const l=document.getElementById('phone-ring-layer'); return {t:Math.round(performance.now()/100)/10, ringer:c?c.npcId+':'+c.state:null, mg:m?m.constructor.name+':'+(m._sceneType||''):null, layer:l?l.innerText.replace(/\n+/g,' | '):null, laptop:getComputedStyle(document.getElementById('laptop-popup')||document.body).display};"; }
call_screen() { a2b_ev "const bar=document.getElementById('call-status-bar'); const subs=[...document.querySelectorAll('.call-subtitle')].map(s=>s.innerText.replace(/\n+/g,' ')); return {bar:bar?bar.innerText.replace(/\n+/g,' '):null, subs:subs.slice(-2), choices:[...document.querySelectorAll('.choice-button')].map(b=>b.innerText.trim()), end:!!document.getElementById('call-end-button')};"; }
end_call() { a2b_ev "const b=document.getElementById('call-end-button'); if(!b) return 'no End button'; b.click(); return 'end';" >/dev/null; sleep 3; }
close_mg() { a2b_ev "window.MinigameFramework.endMinigame(false); return true;" >/dev/null; }
# play the open call: take the first choice until none is left (max 12), then End
play_call() { for i in $(seq 1 12); do sleep 3; c=$(a2b_ev "const b=document.querySelector('.choice-button'); if(!b) return null; const t=b.innerText.trim(); b.click(); return t;"); [ "$c" = "null" ] && continue; echo "chose: $c"; done; }
tts() { echo "/tts requests: $(jq -rc '[.npc_id, .text[0:60]]' $OUT/${LABEL}_tts.jsonl 2>/dev/null | grep -E 'gary|torres|nightshade' | tr '\n' ' ')"; }
open_door() { $S $GID '{"cmd":"moveToNear","id":"door:tape_room->salvage_cage"}' 30 >/dev/null; $S $GID '{"cmd":"interact","id":"door:tape_room->salvage_cage"}' 30 >/dev/null; sleep 1.5; }
sync_now() { a2b_ev "await window.stateSync.sync(); return true;" >/dev/null; sleep 1; }
reload() { sync_now
  $S $GID '{"cmd":"waitFor","kind":"condition","fn":"() => { setTimeout(() => location.assign(location.pathname + \"?skip_resume=1\"), 50); return true; }"}' >/dev/null
  sleep 8; $S $GID '{"cmd":"bootstrap","tutorial":"decline","resume":"resume","autoBrief":true}' 120 >/dev/null; sleep 3; }
gstate() { a2b_ev "const o=window.npcManager.getNPC('gary_phone'); const h=window.npcManager.getConversationHistory('gary_phone')||[]; return {rows:h.map(m=>m.type+':'+m.text.slice(0,50)), callback:window.phoneRinger.callbackFor('gary_phone'), currentKnot:o&&o.currentKnot, ringer:(window.phoneRinger.current()||{}).state||null, mg:window.MinigameFramework.currentMinigame?window.MinigameFramework.currentMinigame.constructor.name:null};"; }
# --- M1 R2 real-path helpers: the player walks from the drop terminal, flags are never set by hand ---
room() { a2b_ev "return window.currentPlayerRoom"; }
ns_flags() { a2b_ev "const g=window.gameState.globalVariables; return 'flag1_submitted='+!!g.flag1_submitted+' flag1_read_heard='+!!g.flag1_read_heard+' flag1_read_done='+!!g.flag1_read_done+' nightshade_rang='+!!g.nightshade_rang;"; }
submit_flag1() { # real path: type catalogue flag 1 into the drop terminal in the reading room.
  # The flag is the game's own per-game stand-in for catalogue_server flag 1 (new-game.rb
  # synthesises it, exactly as a real VM solve would hand it over); we read it by game id and
  # type it, so the player genuinely submits at the terminal — no global is set by hand.
  local flag
  flag=$(BREAK_ESCAPE_STANDALONE=true bin/rails runner "puts BreakEscape::Game.find($GID).player_state['flags_by_vm']['catalogue_server'][0]" 2>/dev/null | grep '^flag{')
  [ -n "$flag" ] || { echo "  no catalogue stand-in flag for game $GID" >&2; return 1; }
  $S $GID '{"cmd":"moveToNear","id":"drop_terminal"}' 30 >/dev/null; $S $GID '{"cmd":"interact","id":"drop_terminal"}' 30 >/dev/null; sleep 1.5
  [ "$(mgc)" = '"FlagStationMinigame"' ] || echo "  WARN terminal mg: $(mgc)"
  a2b_ev "const inp=document.getElementById('flag-input'); const btn=document.getElementById('flag-submit-btn'); if(!inp||!btn) return 'no field'; inp.value='$flag'; inp.dispatchEvent(new Event('input',{bubbles:true})); btn.click(); return 'submitted';" >/dev/null; sleep 3
  echo "  flag1_submitted=$(a2b_ev "return !!window.gameState.globalVariables.flag1_submitted") (terminal still open: $(mgc))"; }
# Cross a room: open the near door, then moveToNear a door INSIDE the target room so the engine paths across (room_entered fires). Retry until currentPlayerRoom matches.
enter_stacks()  { for n in 1 2 3 4; do [ "$(room)" = '"restricted_stacks"' ] && break
  $S $GID '{"cmd":"moveToNear","id":"door:reading_room->restricted_stacks"}' 30 >/dev/null; $S $GID '{"cmd":"interact","id":"door:reading_room->restricted_stacks"}' 30 >/dev/null; sleep 1
  $S $GID '{"cmd":"moveToNear","id":"door:restricted_stacks->restricted_cage"}' 40 >/dev/null; sleep 2; done; echo "  room: $(room)"; }
enter_reading() { for n in 1 2 3 4; do [ "$(room)" = '"reading_room"' ] && break
  $S $GID '{"cmd":"moveToNear","id":"door:restricted_stacks->reading_room"}' 30 >/dev/null; $S $GID '{"cmd":"interact","id":"door:restricted_stacks->reading_room"}' 30 >/dev/null; sleep 1
  $S $GID '{"cmd":"moveToNear","id":"door:reading_room->staff_passage"}' 40 >/dev/null; sleep 2; done; echo "  room: $(room)"; }
try_cage_gate() { $S $GID '{"cmd":"moveToNear","id":"door:restricted_stacks->restricted_cage"}' 30 >/dev/null; $S $GID '{"cmd":"interact","id":"door:restricted_stacks->restricted_cage"}' 30 >/dev/null; sleep 2; }
tap_readout() { # tap HaX's flag-1 read-out toast to open it at the flag1_read knot (the real player action)
  local hit=
  for i in $(seq 1 ${1:-15}); do sleep 1
    hit=$(a2b_ev "const t=[...document.querySelectorAll('body *')].filter(e=>e.children.length<6&&(e.textContent||'').includes('First box is in')&&e.offsetParent!==null).sort((a,b)=>a.textContent.length-b.textContent.length)[0]; if(!t) return 'none'; t.click(); return 'tapped';")
    [ "$hit" = '"tapped"' ] && { echo "  read-out toast tapped at ${i}s"; sleep 4; return 0; }
  done; echo "  WARN read-out toast never appeared"; return 1; }
reload_fast() { # reload with no leading sync (caller syncs first): close-to-navigate gap is milliseconds, inside the 3 s ring delay
  $S $GID '{"cmd":"waitFor","kind":"condition","fn":"() => { setTimeout(() => location.assign(location.pathname + \"?skip_resume=1\"), 50); return true; }"}' >/dev/null
  sleep 8; $S $GID '{"cmd":"bootstrap","tutorial":"decline","resume":"resume","autoBrief":true}' 120 >/dev/null; sleep 3; }
no_ring_for() { local n=0; for i in $(seq 1 ${1:-12}); do sleep 1; r=$(a2b_ev "const c=window.phoneRinger.current(); return c?c.npcId+':'+c.state:null"); [ "$r" != "null" ] && { echo "  RANG at ${i}s: $r"; n=1; }; done; [ $n = 0 ] && echo "  no ring in ${1:-12}s (good)"; }
wait_choice() { for i in $(seq 1 ${2:-25}); do a2b_ev "return [...document.querySelectorAll('.choice-button,.choice')].some(b=>/$1/.test(b.innerText))" | grep -qx true && return 0; sleep 1; done; echo "  WARN choice /$1/ never showed"; return 1; }
case $1 in
gary_hold)   # rings over the keypad, Answer puts it on hold, closing the keypad opens the call
  open_m09 gary_hold --start-room tape_room
  open_door; echo "keypad: $(mgc)"; gate wait_ring gary_phone 15; a2b_shot ring_over_keypad; tl
  a2b_answer; sleep 1.5; a2b_shot hold_pill; echo "on hold: $(tl)"; echo "keypad still open: $(mgc)"
  close_mg; sleep 1.5; a2b_shot call_opened; echo "after closing keypad: $(tl)"; call_screen
  play_call; a2b_shot call_end; echo "end: $(tl)"; end_call; echo "after End: $(tl)"; tts; a2b_quit ;;
gary_popup)  # rings while CyberChef is open; Answer hides the popup, the call opens, End brings it back
  open_m09 gary_popup --start-room tape_room
  $S $GID '{"cmd":"openInventoryItem","item":"CyberChef"}' 30 >/dev/null; sleep 2; echo "popup open: $(tl)"; a2b_shot cyberchef_open
  a2b_ev "window.eventDispatcher.emit('door_unlock_attempt', {connectedRoom:'salvage_cage', roomId:'tape_room'}); return true;" >/dev/null
  gate wait_ring gary_phone 15; a2b_shot ring_over_cyberchef; tl
  a2b_answer >/dev/null; sleep 1.5; a2b_shot call_popup_aside; echo "call open, popup aside: $(tl)"
  play_call; end_call; a2b_shot popup_back; echo "after End, popup back: $(tl)"; tts; a2b_quit ;;
gary_decline)  # Decline, thread shows the missed call with Call back, Call back connects, reload afterwards
  open_m09 gary_decline --start-room tape_room
  open_door; gate wait_ring gary_phone 15; a2b_decline >/dev/null; sleep 1.5; echo "declined: $(tl)"; close_mg
  a2b_ev "return {callback: window.phoneRinger.callbackFor('gary_phone'), rows:(window.npcManager.getConversationHistory('gary_phone')||[]).map(m=>m.type+':'+m.text)};"
  $S $GID '{"cmd":"openInventoryItem","item":"phone"}' >/dev/null; sleep 2
  a2b_ev "const c=document.querySelector('.contact-item[data-npc-id=\"gary_phone\"]'); if(!c) return 'no contact'; c.click(); return 'opened';" >/dev/null; sleep 2
  a2b_ev "const hb=document.querySelector('.call-button'); const m=document.querySelector('.messages-container'); return {header:hb&&hb.innerText.trim(), rowButtons:[...document.querySelectorAll('.call-row-callback')].map(b=>b.getAttribute('aria-label')), text:m&&m.innerText.replace(/\n+/g,' | '), choices:[...document.querySelectorAll('.choice-button')].map(b=>b.innerText.trim())};"; a2b_shot thread_missed
  a2b_ev "document.querySelector('.call-button').click(); return 'dial';" >/dev/null; sleep 5; echo "callback: $(call_screen)"; a2b_shot callback_connected
  play_call; end_call; a2b_shot after_callback; tts; a2b_quit ;;
gary_noanswer)  # ring out 20 s: missed call and callback
  open_m09 gary_noanswer --start-room tape_room
  open_door; gate wait_ring gary_phone 15; echo "ringing 24 s"; sleep 24; echo "after: $(tl)"; close_mg
  a2b_ev "return {callback: window.phoneRinger.callbackFor('gary_phone'), rows:(window.npcManager.getConversationHistory('gary_phone')||[]).map(m=>m.type+':'+m.text)};"; a2b_quit ;;
torres_box)  # first ring at the shut lid is declined; the lid's unlock rings again over the open container
  open_m09 torres_box --start-room open_stacks --set flag2_submitted=true
  $S $GID '{"cmd":"moveToNear","id":"hl_box"}' 30 >/dev/null; $S $GID '{"cmd":"interact","id":"hl_box"}' 30 >/dev/null; sleep 1.5; echo "lid: $(mgc)"
  gate wait_ring torres_phone 15; a2b_shot ring_over_lid; tl; a2b_decline >/dev/null; sleep 1; echo "declined: $(tl)"
  echo "callback after decline: $(a2b_ev "return window.phoneRinger.callbackFor('torres_phone')")"
  $S $GID '{"cmd":"mg","action":"type","args":[0,"HL2015-0477",{"submit":true}]}' 30 | cut -c1-160; sleep 2.5; echo "lid opened: $(mgc)"
  gate wait_ring torres_phone 15; a2b_shot ring_over_container; tl
  a2b_answer >/dev/null; sleep 1.5; a2b_shot hold_pill; echo "on hold: $(tl)"
  close_mg; sleep 2; a2b_shot call_opened; echo "after closing the container: $(tl)"; call_screen
  play_call; end_call; a2b_shot after_end; echo "after End: $(tl)"; tts; a2b_quit ;;
reload_ring)  # reload while Gary rings over the keypad: back in the world, a Missed call row and a callback, no ring
  open_m09 reload_ring --start-room tape_room
  open_door; gate wait_ring gary_phone 15; echo "before reload: $(gstate)"; a2b_shot before_reload
  reload; echo "after reload: $(gstate)"; a2b_shot after_reload; sleep 25; echo "25 s later: $(gstate)"; a2b_quit ;;
reload_call)  # reload in the middle of the answered call: the thread is back on its home knot, the call is not resumed, a Missed call row is left
  open_m09 reload_call --start-room tape_room
  open_door; gate wait_ring gary_phone 15; a2b_answer >/dev/null; sleep 1; close_mg; sleep 3; echo "in call: $(gstate)"; call_screen
  reload; echo "after reload: $(gstate)"; a2b_shot after_reload; sleep 10; echo "10 s later: $(gstate)"; tts; a2b_quit ;;
nightshade)
  open_m09 nightshade --start-room loading_dock
  a2b_ev "window.gameState.globalVariables.flag1_submitted=true; window.eventDispatcher.emit('global_variable_changed:flag1_submitted',{name:'flag1_submitted',value:true}); return true;" >/dev/null
  for i in $(seq 1 30); do sleep 2; echo "$i: $(tl | cut -c1-160)"; done; a2b_shot nightshade_state; tts; a2b_quit ;;
nightshade_order)  # M1 R1: HaX's flag-1 read-out is heard first, THEN Nightshade rings on the thread close; else-branch lines (cage not open)
  open_m09 nightshade_order --start-room loading_dock
  # the drop terminal submits flag 1
  a2b_ev "window.gameState.globalVariables.flag1_submitted=true; window.eventDispatcher.emit('global_variable_changed:flag1_submitted',{name:'flag1_submitted',value:true}); return true;" >/dev/null
  sleep 9   # HaX read-out text is scheduled (delay 2500 + msg_delay 5000)
  echo "HaX read-out text present: $(a2b_ev "return (window.npcManager.getConversationHistory('agent_0x99')||[]).some(m=>/First box is in/.test(m.text||''))")"
  echo "nightshade ringing yet (want false): $(a2b_ev "const c=window.phoneRinger.current(); return c?c.npcId+':'+c.state:false")"
  echo "flag1_read_heard yet (want false): $(a2b_ev "return !!window.gameState.globalVariables.flag1_read_heard")"
  # open HaX's thread -> the hub guard plays flag1_read, which sets flag1_read_heard
  $S $GID '{"cmd":"openInventoryItem","item":"phone"}' >/dev/null; sleep 2
  a2b_ev "const c=document.querySelector('.contact-item[data-npc-id=\"agent_0x99\"]'); if(!c) return 'no contact'; c.click(); return 'opened';" >/dev/null; sleep 3
  echo "HaX thread last rows: $(a2b_ev "return (window.npcManager.getConversationHistory('agent_0x99')||[]).slice(-3).map(m=>m.type+':'+(m.text||'').slice(0,46))")"
  echo "flag1_read_heard now (want true): $(a2b_ev "return !!window.gameState.globalVariables.flag1_read_heard")"
  echo "nightshade ringing while HaX thread open (want false): $(a2b_ev "const c=window.phoneRinger.current(); return c?c.npcId+':'+c.state:false")"
  a2b_shot hax_readout_open
  # close HaX's thread -> conversation_closed:agent_0x99 -> Nightshade rings 3 s later
  close_mg; sleep 1
  gate wait_ring nightshade_phone 15; a2b_shot nightshade_ring_after_readout; echo "ring: $(tl)"
  a2b_answer >/dev/null; sleep 2; a2b_shot ns_call; echo "call: $(call_screen)"
  play_call; end_call; a2b_shot ns_after_end; tts; a2b_quit ;;
torres_once)  # m1 R1: one ring at the box; decline leaves only the callback; no second ring at the lid or on leaving the office
  open_m09 torres_once --start-room open_stacks --set flag2_submitted=true
  $S $GID '{"cmd":"moveToNear","id":"hl_box"}' 30 >/dev/null; $S $GID '{"cmd":"interact","id":"hl_box"}' 30 >/dev/null; sleep 1.5; echo "lid: $(mgc)"
  gate wait_ring torres_phone 15; a2b_shot ring_over_lid; tl; a2b_decline >/dev/null; sleep 1; echo "declined: $(tl)"
  echo "torres_rang latched (want true): $(a2b_ev "return !!window.gameState.globalVariables.torres_rang")"
  echo "callback after decline: $(a2b_ev "return window.phoneRinger.callbackFor('torres_phone')")"
  # open the lid: the item_unlocked mapping must NOT ring again (torres_rang gates it)
  $S $GID '{"cmd":"mg","action":"type","args":[0,"HL2015-0477",{"submit":true}]}' 30 | cut -c1-120; sleep 2.5; echo "lid opened: $(mgc)"; close_mg; sleep 1
  echo "second ring within 8 s? (want none):"; for i in $(seq 1 8); do sleep 1; r=$(a2b_ev "const c=window.phoneRinger.current(); return c?c.npcId+':'+c.state:null"); [ "$r" != "null" ] && echo "  RANG AGAIN: $r"; done; echo "  done"
  echo "missed rows (want 1): $(a2b_ev "return (window.npcManager.getConversationHistory('torres_phone')||[]).filter(m=>/Missed call|Incoming call/.test(m.text||'')).length")"
  a2b_shot after_decline_no_second_ring
  # callback works
  $S $GID '{"cmd":"openInventoryItem","item":"phone"}' >/dev/null; sleep 2
  a2b_ev "const c=document.querySelector('.contact-item[data-npc-id=\"torres_phone\"]'); if(!c) return 'no contact'; c.click(); return 'opened';" >/dev/null; sleep 2
  a2b_ev "const hb=document.querySelector('.call-button'); if(!hb) return 'no callback'; hb.click(); return 'dial';" >/dev/null; sleep 5; echo "callback: $(call_screen)"; a2b_shot callback_connected
  play_call; end_call; a2b_shot after_callback; tts; a2b_quit ;;

# ===== M1 R2: state-driven order checks on the REAL path (walk from the drop terminal, no hand-set flags) =====
race)  # walk straight in with the read-out unopened: no premature ring; the cage-gate fallback rings once
  open_m09 race --start-room reading_room
  echo "start room: $(room)"; echo "submit flag 1 at the drop terminal (real path):"; submit_flag1; close_mg; sleep 1
  echo "after flag1: $(ns_flags)"; a2b_shot flag1_done
  echo "walk into the restricted stacks (read-out NOT opened):"; enter_stacks
  echo "no Nightshade ring while the read-out is unopened (flag1_read_heard false):"; no_ring_for 12
  echo "  $(ns_flags)"; echo "  HaX read-out toast arrived: $(a2b_ev "return (window.npcManager.getConversationHistory('agent_0x99')||[]).some(m=>/First box is in/.test(m.text||''))")"; a2b_shot in_stacks_no_ring
  echo "try the restricted cage gate (fallback moment: his 'crack the keys first' advice):"; try_cage_gate
  gate wait_ring nightshade_phone 15; a2b_shot ring_at_cage_gate; echo "  ring: $(tl)"; echo "  $(ns_flags)"
  a2b_answer >/dev/null; sleep 2; a2b_shot ns_call; echo "call: $(call_screen)"; play_call; end_call; a2b_shot after_end
  echo "rings once (walk back to the reading room, expect no second ring):"; enter_reading; no_ring_for 6; echo "  $(ns_flags)"; tts; a2b_quit ;;

readout_reload)  # read-out heard in full, reload inside the 3 s ring delay, backstop rings once on the next room entry
  open_m09 readout_reload --start-room reading_room
  submit_flag1; close_mg; sleep 1; echo "after flag1: $(ns_flags)"
  echo "walk into the stacks and open HaX's read-out:"; enter_stacks; tap_readout
  # advance to the choice menu, then take the first choice so the card line + Tomb Beta line play and
  # flag1_read_done is set, but the thread stays open at [Got it] -- do NOT take [Got it], or the thread
  # self-closes and mapping A rings before the reload.
  echo "play past the card line (thread stays open at [Got it]):"; wait_choice "Ledger or stacks"; $S $GID '{"cmd":"mg","action":"choose","args":[1]}' >/dev/null; wait_choice "Got it"
  echo "  after the card line: $(ns_flags)  (flag1_read_done expected true, nightshade_rang still false)"; a2b_shot readout_played
  echo "persist state, then close + reload with a millisecond gap (inside the 3 s ring delay):"; sync_now; close_mg >/dev/null 2>&1; reload_fast
  echo "  after reload: $(ns_flags)  (the close mapping's +3 s timer died with the page)"; a2b_shot after_reload
  echo "the room_entered backstop rings on resume or the next room move (one ring):"
  wait_ring nightshade_phone 6 || { echo "  not ringing on resume; walk to trigger the backstop:"; enter_reading; }
  gate wait_ring nightshade_phone 20; a2b_shot ring_after_reload; echo "  ring: $(tl)"; echo "  $(ns_flags)"
  a2b_answer >/dev/null; sleep 2; play_call; end_call; a2b_shot after_end
  echo "one ring only (walk to another room, expect none):"; enter_stacks; no_ring_for 6; echo "  $(ns_flags)"; tts; a2b_quit ;;

readout_full)  # the normal path: hear the read-out in full, close at [Got it]; mapping A rings once, after the card line
  open_m09 readout_full --start-room reading_room
  submit_flag1; close_mg; sleep 1
  echo "walk into the stacks and open HaX's read-out:"; enter_stacks; tap_readout
  echo "play it to the end ([Got it] closes the thread):"; wait_choice "Ledger or stacks"; $S $GID '{"cmd":"mg","action":"choose","args":[1]}' >/dev/null; wait_choice "Got it"; $S $GID '{"cmd":"mg","action":"choose","args":[1]}' >/dev/null; sleep 4
  echo "  after the read-out: $(ns_flags)  (flag1_read_done expected true)"
  gate wait_ring nightshade_phone 10; a2b_shot ring_after_readout; echo "  ring (mapping A, after the card line): $(tl)"
  a2b_answer >/dev/null; sleep 2; a2b_shot ns_call; echo "call: $(call_screen)"; play_call; end_call; a2b_shot after_end
  echo "rings once (walk to another room, expect none):"; enter_reading; no_ring_for 6; echo "  $(ns_flags)"; tts; a2b_quit ;;

first_choice_close)  # close the read-out at its first choice (before the card line): no immediate ring; backstop rings on the next room move
  open_m09 first_choice_close --start-room reading_room
  submit_flag1; close_mg; sleep 1
  echo "walk into the stacks and open HaX's read-out:"; enter_stacks; tap_readout
  echo "wait for the first choice menu (before the card line; no pick, so no timing slop):"; for i in $(seq 1 20); do a2b_ev "return [...document.querySelectorAll('.choice-button,.choice')].some(b=>/Ledger or stacks/.test(b.innerText))" | grep -qx true && break; sleep 1; done
  echo "  choices: $(a2b_ev "return [...document.querySelectorAll('.choice-button,.choice')].map(b=>b.innerText.trim().slice(0,28))")"
  echo "  $(ns_flags)  (expect flag1_read_heard true, flag1_read_done false)"
  echo "close at the first choice (do not pick one):"; close_mg >/dev/null 2>&1; sleep 1
  echo "close mapping does NOT ring (keyed flag1_read_done, false here):"; no_ring_for 8; echo "  $(ns_flags)"; a2b_shot no_immediate_ring
  echo "walk to another room -> room_entered backstop rings once (flag1_read_heard):"; enter_reading
  gate wait_ring nightshade_phone 15; a2b_shot ring_on_move; echo "  ring: $(tl)"; echo "  $(ns_flags)"
  a2b_answer >/dev/null; sleep 2; a2b_shot ns_call; echo "call: $(call_screen)"; play_call; end_call
  echo "rings once (walk back, expect none):"; enter_stacks; no_ring_for 6; echo "  $(ns_flags)"; tts; a2b_quit ;;
esac
