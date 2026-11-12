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
done; echo "open_obj $1 did not open $2" >&2; return 1; }
gate() { "$@" || { echo "GATE FAILED: $*" >&2; a2b_quit; exit 1; }; }
timeline() { a2b_ev "const c=window.phoneRinger.current(); const m=window.MinigameFramework.currentMinigame; const l=document.getElementById('phone-ring-layer'); return {t:Math.round(performance.now()/100)/10, ringer:c?c.npcId+':'+c.state:null, mg:m?m._sceneType:null, layer:l?l.innerText.replace(/\n+/g,' | '):null, laptop:getComputedStyle(document.getElementById('laptop-popup')||document.body).display, lab:(document.getElementById('lab-popup')||{style:{}}).style.display||null};" ; }
case $1 in
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
    gate wait_ring caller_popup 20; a2b_shot ring_over_$obj; timeline
    a2b_answer >/dev/null; sleep 1.5; a2b_shot call_$obj; echo "call open, popup aside: $(timeline)"
    a2b_ev "const b=document.getElementById('call-end-button'); if(!b) return 'no End button'; b.click(); return 'end';"; sleep 3
    a2b_shot back_$obj; echo "after End, popup back: $(timeline)"
    a2b_ev "(window.closeLaptop&&window.closeLaptop()); (window.closeLabWorkstation&&window.closeLabWorkstation()); return true;" >/dev/null; sleep 1
  done; a2b_quit ;;
forced)
  AUTOBRIEF=true a2b_open forced; gate clear_basic
  a2b_lever lever_forced; gate wait_ring caller_forced 10; a2b_shot ring_forced; echo "$(timeline)"
  gate wait_state caller_forced connected 15; sleep 1; a2b_shot forced_connected; timeline
  a2b_ev "window.__pcHit=performance.now(); window.npcManager.getNPC('brute'); const c=window.npcManager.getNPC('brute'); if(c&&c.los) c.los.enabled=false; window.npcHostileSystem.setNPCHostile('brute', true); return 'brute hostile';"
  for i in $(seq 1 30); do sleep 1; echo "$i: $(timeline | cut -c1-170)"; done
  a2b_ev "window.npcHostileSystem.setNPCHostile('brute', false); return 'calm';"; a2b_quit ;;
esac
