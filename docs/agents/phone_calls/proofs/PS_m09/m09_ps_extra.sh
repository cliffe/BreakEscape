#!/bin/bash
# Review M1 R4 (post-sweep, m09): extra routes. Sources the M1 route's helpers.
#   PC_PORT=3026 OUT=docs/agents/phone_calls/proofs/PS_m09 X=<route> bash docs/agents/phone_calls/proofs/PS_m09/m09_ps_extra.sh
source tools/phone_calls/routes/m09_m1_live.sh  # no arg: falls through its case
pick() { a2b_ev "const b=[...document.querySelectorAll('.choice-button')].find(b=>/$1/.test(b.innerText)); if(!b) return 'no choice /$1/: '+[...document.querySelectorAll('.choice-button')].map(b=>b.innerText.trim()).join(' / '); b.click(); return 'picked '+b.innerText.trim();"; }
timeline_on() { a2b_ev "window.__r4=[]; window.__r4t0=performance.now(); const log=(k)=>window.__r4.push(k+'@'+((performance.now()-window.__r4t0)/1000).toFixed(1)); window.__r4log=log; let last=''; window.__r4iv=setInterval(()=>{ const c=window.phoneRinger.current(); const g=window.gameState.globalVariables; const s=(c?c.npcId+':'+c.state:'-')+'|toast:'+(window.npcManager.getConversationHistory('agent_0x99')||[]).some(m=>/First box is in/.test(m.text||''))+'|room:'+window.currentPlayerRoom+'|heard:'+!!g.flag1_read_heard+'|cage:'+!!g.cage_opened+'|rang:'+!!g.nightshade_rang; if(s!==last){ last=s; log(s);} },100); window.eventDispatcher.on('door_unlock_attempt',(d)=>log('door_unlock_attempt:'+(d&&d.connectedRoom))); return true;" >/dev/null; }
case $X in
gate_direct)  # terminal straight to the cage gate, read-out never opened; watch 25 s for the fallback
  open_m09 gate_direct --start-room reading_room
  submit_flag1; timeline_on
  close_mg; a2b_ev "window.__r4log('terminal_closed'); return true" >/dev/null
  $S $GID '{"cmd":"moveToNear","id":"door:reading_room->restricted_stacks"}' 30 >/dev/null; $S $GID '{"cmd":"interact","id":"door:reading_room->restricted_stacks"}' 30 >/dev/null
  for n in 1 2 3; do $S $GID '{"cmd":"moveToNear","id":"door:restricted_stacks->restricted_cage"}' 40 >/dev/null; [ "$(room)" = '"restricted_stacks"' ] && break; done; a2b_ev "window.__r4log('arrived_at_gate'); return true" >/dev/null
  $S $GID '{"cmd":"interact","id":"door:restricted_stacks->restricted_cage"}' 30 >/dev/null; close_mg
  sleep 22; echo "timeline: $(a2b_ev "return window.__r4")"; a2b_shot ring_at_gate; echo "  $(ns_flags)"
  a2b_answer >/dev/null; sleep 2; echo "call: $(call_screen)"; play_call; end_call
  echo "rings once (walk back, expect none):"; enter_reading; no_ring_for 8; echo "  $(ns_flags)"; tts; a2b_quit ;;
victoria)  # m03 Victoria recruited: the hub plays the read-out first, so the code path rings via mapping 1 (cage_opened mapping stays dark)
  open_m09 victoria --start-room reading_room
  submit_flag1; close_mg; sleep 1; enter_stacks; timeline_on
  # Run 1: --start-room skips the dock call, so HaX's thread sat on the dock choices; run 2: the harness took
  # about 10 s to cross into the stacks and the read-out toast had been replaced by later HaX texts.
  # Run 3: open her thread from the contact list and walk the choices (dock first, then the read-out, then the hub).
  $S $GID '{"cmd":"openInventoryItem","item":"phone"}' >/dev/null; sleep 2
  a2b_ev "const c=document.querySelector('.contact-item[data-npc-id=\"agent_0x99\"]'); if(!c) return 'no contact'; c.click(); return 'opened';"; sleep 3
  for i in $(seq 1 20); do
    cs=$(a2b_ev "return [...document.querySelectorAll('.choice-button')].map(b=>b.innerText.trim()).join(' / ')")
    case "$cs" in
      *Victoria*) echo "  $(pick 'Victoria')"; sleep 5; break ;;
      *"Something else"*) echo "  read-out reached: $(ns_flags)"; echo "  $(pick 'Something else')"; sleep 6 ;;
      '""') if [ "$(mgc)" = "null" ]; then echo "  thread closed (dock done); reopen HaX"; $S $GID '{"cmd":"openInventoryItem","item":"phone"}' >/dev/null; sleep 2
              a2b_ev "const c=document.querySelector('.contact-item[data-npc-id=\"agent_0x99\"]'); if(!c) return 'no contact'; c.click(); return 'opened';" >/dev/null; sleep 3; else sleep 2; fi ;;
      *) echo "  $(a2b_ev "const b=document.querySelector('.choice-button'); b.click(); return 'took '+b.innerText.trim();")"; sleep 4 ;;
    esac
  done
  echo "  after the code: $(a2b_ev "const g=window.gameState.globalVariables; return 'maintenance_code_used='+!!g.maintenance_code_used+' cage_opened='+!!g.cage_opened")  $(ns_flags)"
  a2b_shot hub_after_code; close_mg; a2b_ev "window.__r4log('hax_closed'); return true" >/dev/null
  gate wait_ring nightshade_phone 12; a2b_shot ring; echo "  ring: $(tl)"
  a2b_answer >/dev/null; sleep 2; echo "call: $(call_screen)"; play_call; end_call
  echo "no second ring (cage_opened mapping +10 s, room moves):"; no_ring_for 12; enter_reading; no_ring_for 6
  echo "timeline: $(a2b_ev "return window.__r4")"; echo "  $(ns_flags)"; tts; a2b_quit ;;
file_held)  # seeded nightshade_file_held (the late arm): decline, then call back; the new line is requested from /tts
  open_m09 file_held --start-room reading_room --set nightshade_file_held=true
  submit_flag1; close_mg; sleep 1; enter_stacks; tap_readout
  wait_choice "Ledger or stacks"; $S $GID '{"cmd":"mg","action":"choose","args":[1]}' >/dev/null; wait_choice "Got it"; $S $GID '{"cmd":"mg","action":"choose","args":[1]}' >/dev/null; sleep 2
  gate wait_ring nightshade_phone 10; a2b_decline >/dev/null; sleep 1.5; echo "declined: $(tl)"; close_mg
  echo "  callback: $(a2b_ev "return window.phoneRinger.callbackFor('nightshade_phone')")"
  $S $GID '{"cmd":"openInventoryItem","item":"phone"}' >/dev/null; sleep 2
  a2b_ev "const c=document.querySelector('.contact-item[data-npc-id=\"nightshade_phone\"]'); if(!c) return 'no contact'; c.click(); return 'opened';" >/dev/null; sleep 2
  a2b_ev "const hb=document.querySelector('.call-button'); if(!hb) return 'no Call back'; hb.click(); return 'dial';"; sleep 5; echo "callback: $(call_screen)"; a2b_shot file_arm
  play_call; end_call; tts; a2b_quit ;;
hax_label)  # a HaX voiced call (identity scene, seeded state; its own room_entered mapping opens it): caption
  open_m09 hax_label --start-room reading_room --set flag1_submitted=true --set flag3_submitted=true --set nightshade_file_held=true
  # run 1 polled after the walk and saw nothing; record every call caption and minigame as it appears
  a2b_ev "window.__cap=[]; const t0=performance.now(); setInterval(()=>{ const e=document.getElementById('call-caption'); const m=window.MinigameFramework.currentMinigame; const k=(e?e.innerText:'-')+'|'+(m?m.constructor.name+':'+(m.params&&m.params.npcId)+':'+(m.params&&m.params.targetKnot||m.params&&m.params.startKnot||''):'-'); if(window.__cap[window.__cap.length-1]?.k!==k) window.__cap.push({k, t:((performance.now()-t0)/1000).toFixed(1)}); },100); return true;" >/dev/null
  # The seeded state starts the identity scene on load (room_entered fires on load) and bootstrap closes it,
  # so identity_scene_started is already true: the scene comes back through HaX's re-ring on closing her thread.
  echo "  identity_scene_started=$(a2b_ev "return !!window.gameState.globalVariables.identity_scene_started")"
  $S $GID '{"cmd":"openInventoryItem","item":"phone"}' >/dev/null; sleep 2
  a2b_ev "const c=document.querySelector('.contact-item[data-npc-id=\"agent_0x99\"]'); if(!c) return 'no contact'; c.click(); return 'opened HaX';"; sleep 3; close_mg; sleep 3
  echo "seen: $(a2b_ev "return window.__cap")"
  for i in $(seq 1 10); do c=$(a2b_ev "const e=document.getElementById('call-caption'); return e?e.innerText:null"); [ "$c" != "null" ] && break; sleep 1; done
  echo "caption: $c"; echo "call: $(call_screen)"; echo "  mg: $(a2b_ev "const m=window.MinigameFramework.currentMinigame; return m?m.constructor.name+' '+(m.params&&m.params.npcId)+' voiced='+!!(m.params&&m.params.voiced):null")"
  a2b_shot hax_call; a2b_quit ;;
esac
# --- added after 45ece8b8a (21:07, ring re-check now covers the global half of mixed conditions) ---
tstate() { a2b_ev "const g=window.gameState.globalVariables; const c=window.phoneRinger.current(); return {ringer:c?c.npcId+':'+c.state:null, torres_rang:!!g.torres_rang, hl_box_opened:!!g.hl_box_opened, torres_called:!!g.torres_called, callback:window.phoneRinger.callbackFor('torres_phone'), rows:(window.npcManager.getConversationHistory('torres_phone')||[]).map(m=>m.type+':'+(m.text||'').slice(0,40)), mg:window.MinigameFramework.currentMinigame?window.MinigameFramework.currentMinigame.constructor.name:null};"; }
case $X in
torres_ring_open|torres_hold_open)  # Torres rings over the lid; the player types the lid code while it rings (or after Answer -> hold)
  open_m09 $X --start-room open_stacks --set flag2_submitted=true
  echo "engine HEAD: $(git rev-parse --short HEAD)"
  $S $GID '{"cmd":"moveToNear","id":"hl_box"}' 30 >/dev/null; $S $GID '{"cmd":"interact","id":"hl_box"}' 30 >/dev/null; sleep 1.5; echo "lid: $(mgc)"
  gate wait_ring torres_phone 15; echo "ringing: $(tstate)"; a2b_shot ring_over_lid
  [ $X = torres_hold_open ] && { a2b_answer >/dev/null; sleep 1.5; echo "answered (hold): $(tstate)"; }
  $S $GID '{"cmd":"mg","action":"type","args":[0,"HL2015-0477",{"submit":true}]}' 30 | cut -c1-120; sleep 2.5; echo "lid opened: $(tstate)"; a2b_shot after_lid
  sleep 3; echo "3 s later: $(tstate)"; close_mg; sleep 4; echo "container closed: $(tstate)"
  echo "walk out of the stacks and back (room_exited fallback needs sorensen_office):"; no_ring_for 10; echo "final: $(tstate)"; a2b_shot final; a2b_quit ;;
esac
case $X in
gate_ring_readout)  # the gate fallback rings; instead of answering, the player opens HaX's thread (the read-out plays)
  open_m09 $X --start-room reading_room
  echo "engine HEAD: $(git rev-parse --short HEAD)"
  submit_flag1; close_mg; enter_stacks; try_cage_gate; close_mg
  gate wait_ring nightshade_phone 20; echo "ringing: $(tl)  $(ns_flags)"
  $S $GID '{"cmd":"openInventoryItem","item":"phone"}' >/dev/null; sleep 2
  a2b_ev "const c=document.querySelector('.contact-item[data-npc-id=\"agent_0x99\"]'); if(!c) return 'no contact'; c.click(); return 'opened HaX';"; sleep 4
  echo "HaX thread open: $(tl)  $(ns_flags)"; a2b_shot hax_open_over_ring
  wait_choice "Ledger or stacks" 10; $S $GID '{"cmd":"mg","action":"choose","args":[1]}' >/dev/null; wait_choice "Got it" 15; $S $GID '{"cmd":"mg","action":"choose","args":[1]}' >/dev/null; sleep 2
  close_mg; sleep 1; echo "read-out done, phone closed: $(tl)  $(ns_flags)"
  echo "  callback: $(a2b_ev "return window.phoneRinger.callbackFor('nightshade_phone')")  rows: $(a2b_ev "return (window.npcManager.getConversationHistory('nightshade_phone')||[]).map(m=>m.type+':'+(m.text||'').slice(0,30))")"
  no_ring_for 8; enter_reading; no_ring_for 6; echo "final: $(ns_flags)"; a2b_shot final; a2b_quit ;;
esac
