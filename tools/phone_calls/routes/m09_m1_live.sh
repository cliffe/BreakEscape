#!/bin/bash
# M1 live proofs on m09 (Nightshade, Torres, Gary incoming rings). Own server port required:
#   PC_PORT=3025 tools/phone_calls/routes/m09_m1_live.sh gary_hold|gary_popup|gary_decline|torres_box|nightshade|reload
# Carry-over branches come from proofs/M1/imports.json (m02_gary_protected, m05_torres_turned, m08_nightshade_triple_agent).
# Real path: the keypad door and the lid are driven with moveToNear/interact. Only gary_popup emits door_unlock_attempt
# itself (the engine event the door raises), because the player cannot open the CyberChef popup and the keypad together.
export OUT=${OUT:-docs/agents/phone_calls/proofs/M1} NODE_PATH=$PWD/node_modules BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle
source "$(dirname "${BASH_SOURCE[0]}")/a2b_lib.sh"
IMP=$OUT/imports.json
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
esac
