#!/bin/bash
# A2c live proofs on test_phone_calls (hold, popups, forced, damage). Server on your own port:
#   PC_PORT=3025 tools/phone_calls/routes/a2c_live.sh hold|banners|popup|forced|hit|guard|brief
# Every route first clears caller_basic's opening ring (declines it) so the ringer is idle.
export OUT=${OUT:-docs/agents/phone_calls/proofs/A2c} NODE_PATH=$PWD/node_modules BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle
source "$(dirname "${BASH_SOURCE[0]}")/a2b_lib.sh"
wait_ring() { for i in $(seq 1 ${2:-60}); do a2b_ev "const c=window.phoneRinger.current(); return !!c && c.npcId==='$1' && c.state==='ringing';" | grep -qx true && return 0; sleep 1; done; return 1; }
wait_state() { for i in $(seq 1 ${3:-40}); do a2b_ev "const c=window.phoneRinger.current(); return !!c && c.npcId==='$1' && c.state==='$2';" | grep -qx true && return 0; sleep 1; done; return 1; }
calm_guard() { a2b_ev "window.gameState.globalVariables.guard_off = true; const m=window.MinigameFramework.currentMinigame; if (m && m._sceneType==='person-chat') window.MinigameFramework.endMinigame(false); return 'guard calm';" >/dev/null; }
clear_basic() { calm_guard; wait_ring caller_basic 40 && a2b_decline >/dev/null; sleep 1; }
mg() { a2b_ev "const m=window.MinigameFramework.currentMinigame; return m ? m._sceneType : null;"; }
mgc() { a2b_ev "const m=window.MinigameFramework.currentMinigame; return m ? m.constructor.name : null;"; }
# open_obj <id> [expected minigame class]: when a neighbouring object opens instead, close it and try again (objects sit 2 tiles apart)
open_obj() { local n; for n in 1 2 3; do
  $S $GID "{\"cmd\":\"moveToNear\",\"id\":\"$1\"}" 30 >/dev/null; $S $GID "{\"cmd\":\"interact\",\"id\":\"$1\"}" 30 >/dev/null; sleep 1.5
  [ -z "$2" ] && return 0
  [ "$(mgc)" = "\"$2\"" ] && return 0
  a2b_ev "window.MinigameFramework.endMinigame(false); return true;" >/dev/null; sleep 1
done; echo "open_obj $1 did not open $2 (got $(mgc); status $(a2b_status | cut -c1-300))" >&2; return 1; }
gate() { "$@" || { echo "GATE FAILED: $*" >&2; a2b_quit; exit 1; }; }
labstate() { a2b_ev "const f=document.getElementById('lab-frame'); let y=null; try{y=f.contentWindow.scrollY}catch(e){y='x-origin'} return {srcProp:f.src, srcAttr:f.getAttribute('src'), scrollY:y, loads:window.__labLoads||0};"; }
timeline() { a2b_ev "const c=window.phoneRinger.current(); const m=window.MinigameFramework.currentMinigame; const l=document.getElementById('phone-ring-layer'); return {t:Math.round(performance.now()/100)/10, ringer:c?c.npcId+':'+c.state:null, mg:m?m._sceneType:null, layer:l?l.innerText.replace(/\n+/g,' | '):null, laptop:getComputedStyle(document.getElementById('laptop-popup')||document.body).display, lab:(document.getElementById('lab-popup')||{style:{}}).style.display||null};" ; }
# hold_over <object id> <minigame class>: ring caller_hold over that minigame and Answer (puts it on hold)
LOGEV="window.__ev=[]; for (const n of ['phone_call_declined:caller_hold','phone_call_missed:caller_hold','conversation_closed:caller_hold','conversation_closed:legacy_voiced']) window.eventDispatcher.on(n, ()=>window.__ev.push(n+'@'+Math.round(performance.now()/100)/10)); return true;"
hold_over() { a2b_ev "$LOGEV" >/dev/null; gate open_obj $1 $2; a2b_ev "window.eventDispatcher.emit('ring_hold', {}); return true;" >/dev/null; gate wait_ring caller_hold 20; a2b_answer >/dev/null; sleep 1; }
evs() { a2b_ev "return window.__ev;"; }
pill() { a2b_ev "const l=document.getElementById('phone-ring-layer'); return l?l.innerText.replace(/\n+/g,' | '):null;"; }
case $1 in
v14)  # row 14: a note opened from a container: closing it reopens the container; the call stays held until the container closes
  AUTOBRIEF=true a2b_open v14; gate clear_basic; hold_over open_case ContainerMinigame; a2b_shot held_over_container; echo "pill: $(pill)"
  a2b_ev "const i=document.querySelector('.container-content-item'); if(!i) return 'no icon'; i.click(); return 'clicked';"; sleep 1.5; echo "note open: $(mgc) pill: $(pill)"; a2b_shot note_open
  a2b_ev "window.MinigameFramework.endMinigame(false); return true;" >/dev/null; sleep 2.5
  echo "after note closed: mg=$(mgc) ringer=$(timeline | cut -c1-120) pill: $(pill)"; a2b_shot container_back
  a2b_ev "window.MinigameFramework.endMinigame(false); return true;" >/dev/null; sleep 0.3; echo "0.3s after container closed: mg=$(mgc)"; sleep 1.8
  echo "call opened: $(timeline | cut -c1-140)"; a2b_shot call_opened; echo "events: $(evs)"; a2b_quit ;;
v15)  # row 15: a legacy scripted call opens as the keypad closes; the held call waits, the pill hides, then it opens
  AUTOBRIEF=true a2b_open v15; gate clear_basic; a2b_ev "window.gameState.globalVariables.legacy_on=true; return true;" >/dev/null
  hold_over keypad_safe $(echo ""); echo "pill: $(pill)"
  a2b_ev "const m=window.MinigameFramework.currentMinigame; m.complete(true); return 'completed '+m.constructor.name;"
  for i in 1 2 3 4 5 6; do sleep 0.7; echo "$i: mg=$(mgc) ringer=$(timeline | cut -c1-100) pill=$(pill)"; done; a2b_shot legacy_over_hold
  a2b_ev "window.MinigameFramework.endMinigame(true); return true;" >/dev/null
  for i in 1 2 3 4 5; do sleep 1; echo "after legacy $i: mg=$(mgc) ringer=$(timeline | cut -c1-100)"; done; a2b_shot call_after_legacy; echo "events: $(evs)"; a2b_quit ;;
v16)  # row 16: a hit closes the keypad while the call is held: it opens only after HIT_QUIET_MS (4 s) with no hit
  AUTOBRIEF=true a2b_open v16; gate clear_basic; hold_over keypad_safe ""
  # an NPC cannot reach a player inside a keypad (physics wait), so hit through the engine's own damage call (what an attack calls)
  a2b_ev "window.playerHealth.damage(3); return 'first hit';"; sleep 0.3; echo "after the hit: mg=$(mgc) ringer=$(timeline | cut -c1-90)"
  for i in $(seq 1 10); do sleep 0.7; [ $i -le 5 ] && a2b_ev "window.playerHealth.damage(3); return 1" >/dev/null; echo "$i: mg=$(mgc) ringer=$(timeline | cut -c1-90) hp=$(a2b_ev 'return window.playerHealth.getHP()') sinceHit=$(a2b_ev 'return Math.round(performance.now()-(window.lastPlayerHitAt?window.lastPlayerHitAt():0))')"; done
  a2b_shot during_fight
  a2b_ev "window.npcHostileSystem.setNPCHostile('brute', false); const m=window.MinigameFramework.currentMinigame; if (m && m._sceneType==='person-chat') window.MinigameFramework.endMinigame(false); return 'calm';"
  for i in $(seq 1 12); do sleep 1; echo "quiet $i: mg=$(mgc) ringer=$(timeline | cut -c1-90) sinceHit=$(a2b_ev 'return Math.round(performance.now()-(window.lastPlayerHitAt?window.lastPlayerHitAt():0))')"; done; a2b_shot after_quiet; a2b_quit ;;
v17)  # row 17: Hang up on the pill = decline
  AUTOBRIEF=true a2b_open v17; gate clear_basic; hold_over keypad_safe ""; echo "pill: $(pill)"
  a2b_ev "const b=[...document.querySelectorAll('#phone-ring-layer button')].find(x=>/hang up/i.test(x.innerText)); if(!b) return 'no Hang up'; b.click(); return 'hung up';"; sleep 1.5
  echo "after: ringer=$(timeline | cut -c1-120) pill=$(pill) mg=$(mgc)"; echo "events: $(evs)"; a2b_shot hung_up
  a2b_ev "window.MinigameFramework.endMinigame(false); return true;" >/dev/null; sleep 4; echo "keypad closed: $(timeline | cut -c1-120)"; a2b_quit ;;
v18)  # row 18: HOLD_MAX_MS (90 s) of unpaused hold rings off
  AUTOBRIEF=true a2b_open v18; gate clear_basic; hold_over keypad_safe ""; echo "pill: $(pill)"
  for i in $(seq 1 24); do sleep 4; echo "$i: ringer=$(timeline | cut -c1-110) pill=$(pill)"; [ "$(a2b_ev 'return !window.phoneRinger.current()')" = true ] && break; done
  echo "events: $(evs)"; a2b_shot rang_off; a2b_ev "return [...document.querySelectorAll('.notification, .toast, [class*=toast]')].map(x=>x.innerText).join(' | ');"; a2b_quit ;;
guard)  # the guard's challenge is dropped while a call is connected, and fires on the next sighting after
  AUTOBRIEF=true a2b_open guard
  a2b_ev "window.__sight=[]; window.eventDispatcher.on('player_in_view:guard', ()=>window.__sight.push(Math.round(performance.now()/100)/10)); return true;" >/dev/null
  a2b_ev "window.__g=[]; setInterval(()=>{const m=window.MinigameFramework.currentMinigame; const c=window.phoneRinger.current(); window.__g.push({t:Math.round(performance.now()/100)/10, mg:m?m._sceneType+':'+((m.params&&m.params.npcId)||''):null, ringer:c?c.npcId+':'+c.state:null});},500); return true;" >/dev/null
  gate wait_ring caller_basic 40; a2b_answer >/dev/null; sleep 2; a2b_shot call_connected
  for i in $(seq 1 14); do sleep 3; echo "$i: $(a2b_ev "const g=window.npcManager.getNPC('guard'); return {mg:(window.MinigameFramework.currentMinigame||{})._sceneType||null, ringer:(window.phoneRinger.current()||{}).state||null, guardX:g&&g.sprite?Math.round(g.sprite.x):null, guardY:g&&g.sprite?Math.round(g.sprite.y):null}")"; done
  a2b_shot during; echo "challenge opened during the call? $(a2b_ev "return window.__g.filter(e=>/person-chat:guard/.test(e.mg||'')).map(e=>e.t)")"
  a2b_ev "const b=document.getElementById('call-end-button'); if(b) b.click(); return !!b;"; echo "call ended; watching for the next sighting"
  for i in $(seq 1 25); do sleep 2; echo "after $i: $(a2b_ev "return (window.MinigameFramework.currentMinigame||{})._sceneType||null")"; done
  echo "player_in_view:guard emitted at (s): $(a2b_ev 'return window.__sight')"
  echo "timeline:"; a2b_ev "const o=[]; let p=''; for (const e of window.__g){const k=e.mg+'|'+e.ringer; if(k!==p){o.push(e.t+'s '+k); p=k;}} return o;"; a2b_shot after; a2b_quit ;;
brief)  # the Mission Brief opening while a non-opening call rings: banner stays, ring paused, resumes with its elapsed time
  AUTOBRIEF=true a2b_open brief; gate clear_basic
  a2b_lever lever_basic_again caller_basic; gate wait_ring caller_basic 20; sleep 4
  ringms() { a2b_ev "const c=window.phoneRinger.current(); return c?Math.round(c.ringMs/100)/10:null"; }
  echo "ringing, ringMs=$(ringms)"; a2b_ev "window.showMissionBrief(); return true;" >/dev/null; sleep 1
  echo "brief open: mg=$(mgc) title=$(a2b_ev 'return (window.MinigameFramework.currentMinigame.params||{}).title') banner: $(timeline | cut -c1-140)"; a2b_shot brief_over_ring
  r1=$(ringms); sleep 25; echo "25 s later (past RING_TIMEOUT_MS 20 s): ringMs $r1 -> $(ringms), ringer=$(timeline | cut -c1-100)"
  a2b_ev "window.MinigameFramework.endMinigame(false); return true;" >/dev/null; sleep 2; echo "brief closed: ringMs=$(ringms) $(timeline | cut -c1-120)"; a2b_shot after_brief
  sleep 18; echo "18 s later: $(timeline | cut -c1-120) (missed after the remaining ~16 s)"; a2b_quit ;;
hold)
  AUTOBRIEF=true a2b_open hold; gate clear_basic
  a2b_lever lever_hold; open_obj keypad_safe; echo "open: $(mg)"
  gate wait_ring caller_hold 20; a2b_shot ring_over_keypad; timeline
  a2b_answer; sleep 1; a2b_shot hold_pill; timeline; echo "mg: $(mg)"
  # close the keypad; the call must open after ~0.5 s
  a2b_ev "window.MinigameFramework.endMinigame(false); return true;" >/dev/null; sleep 0.3; echo "0.3s: $(mg)"; sleep 1.5
  a2b_shot call_opened; echo "after: $(mg)"; timeline
  a2b_status | cut -c1-260; a2b_quit ;;
banners)
  # the banner over a lockpick, a container and, from `popup`, the two popups
  AUTOBRIEF=true a2b_open banners; gate clear_basic
  for spec in pick_case:LockpickingMinigamePhaser open_case:ContainerMinigame terminal_pc:ContainerMinigame; do
    obj=${spec%%:*}; cls=${spec##*:}
    a2b_lever lever_hold; gate open_obj $obj $cls; echo "$obj open: $(mgc)"
    gate wait_ring caller_hold 20; a2b_shot over_$obj; a2b_answer >/dev/null; sleep 1; a2b_shot pill_$obj
    a2b_ev "window.phoneRinger.hangUp('caller_hold'); window.MinigameFramework.endMinigame(false); return true;" >/dev/null; sleep 2
  done; a2b_quit ;;
popup)
  AUTOBRIEF=true a2b_open popup; gate clear_basic
  for obj in cyberchef_ws lab_ws; do
    a2b_lever lever_popup; open_obj $obj; echo "$obj: $(timeline)"
    if [ $obj = lab_ws ]; then sleep 2; a2b_ev "const f=document.getElementById('lab-frame'); f.contentWindow.scrollTo(0,300); window.__labLoads=0; f.addEventListener('load',()=>window.__labLoads++); return true;" >/dev/null; sleep 0.5; echo "lab before: $(labstate)"; fi
    gate wait_ring caller_popup 20; a2b_shot ring_over_$obj; timeline
    a2b_answer >/dev/null; sleep 1.5; a2b_shot call_$obj; echo "call open, popup aside: $(timeline)"
    a2b_ev "const b=document.getElementById('call-end-button'); if(!b) return 'no End button'; b.click(); return 'end';"; sleep 3
    a2b_shot back_$obj; echo "after End, popup back: $(timeline)"
    [ $obj = lab_ws ] && echo "lab after: $(labstate)"
    a2b_ev "(window.closeLaptop&&window.closeLaptop()); (window.closeLabWorkstation&&window.closeLabWorkstation()); return true;" >/dev/null; sleep 1
  done; a2b_quit ;;
forced)
  AUTOBRIEF=true a2b_open forced; gate clear_basic
  a2b_lever lever_forced; gate wait_ring caller_forced 10; a2b_shot ring_forced; echo "$(timeline)"
  gate wait_state caller_forced connected 15; sleep 1; a2b_shot forced_connected; timeline
  a2b_ev "window.__pcHit=performance.now(); window.npcManager.getNPC('brute'); const c=window.npcManager.getNPC('brute'); if(c&&c.los) c.los.enabled=false; window.npcHostileSystem.setNPCHostile('brute', true); return 'brute hostile';"
  # row 26: the hit closes the forced call; with the brute still hostile it must not come back
  for i in $(seq 1 20); do sleep 1; echo "hit $i: $(timeline | cut -c1-150) hp=$(a2b_ev 'return window.playerHealth&&window.playerHealth.getHP()')"; [ "$(mgc)" != '"PhoneChatMinigame"' ] && break; done
  a2b_shot after_hit
  for i in $(seq 1 6); do sleep 1; echo "fight $i: $(timeline | cut -c1-150) hp=$(a2b_ev 'return window.playerHealth&&window.playerHealth.getHP()')"; done
  a2b_ev "window.npcHostileSystem.setNPCHostile('brute', false); const m=window.MinigameFramework.currentMinigame; if (m && m._sceneType==='person-chat') window.MinigameFramework.endMinigame(false); return 'calm';"
  # quiet time: it should ring again and, being forced, auto-answer and resume
  for i in $(seq 1 25); do sleep 1; echo "quiet $i: $(timeline | cut -c1-150)"; done
  a2b_shot after_quiet; a2b_text | cut -c1-300; a2b_quit ;;
esac
