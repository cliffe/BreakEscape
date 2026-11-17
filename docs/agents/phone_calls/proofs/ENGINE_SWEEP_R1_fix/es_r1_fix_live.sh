#!/bin/bash
# Engine sweep review R1 fix live proofs (committed code). Keyless server on :3027 only, own pidfile.
#   PC_PORT=3027 docs/agents/phone_calls/proofs/ENGINE_SWEEP_R1_fix/es_r1_fix_live.sh <case>
# cases:
#   m04      — M1 R4: the dial ring has ring.ringWhile; it drops when the ESD goes live while ringing.
#   m09      — M1 R4 rule 7: Torres's lid ring (no ringWhile) does NOT drop when the box is opened while
#              it rings; Nightshade still rings.
#   m1_held  — R1 m1: the ending closing over a held offer that put the phone aside owes one conversation_closed.
#   m2_twin  — R1 m2: a ringWhile ring dropped quietly restores its own setGlobal latch, so a twin rings.
export PC_PORT=${PC_PORT:?set PC_PORT}
export OUT=${OUT:-docs/agents/phone_calls/proofs/ENGINE_SWEEP_R1_fix}
source "$(dirname "${BASH_SOURCE[0]}")/../../../../../tools/phone_calls/routes/m10_lib.sh"
COUNT="window.__cc={}; const d=window.eventDispatcher; if(!d.__ccWrapped){ const o=d.emit.bind(d); d.emit=function(n,x){ if(typeof n==='string'&&n.startsWith('conversation_closed:')){ window.__cc[n]=(window.__cc[n]||0)+1; } return o(n,x); }; d.__ccWrapped=true; } return true;"
cc() { a2b_ev "return window.__cc;"; }
rs() { a2b_ev "const c=window.phoneRinger.current(); return c?{npcId:c.npcId,state:c.state,opened:c.opened}:null;"; }
wr() { for i in $(seq 1 ${2:-40}); do a2b_ev "const c=window.phoneRinger.current(); return !!c && c.npcId==='$1' && c.state==='ringing';" | grep -qx true && return 0; sleep 1; done; return 1; }
setg() { a2b_ev "const g=window.gameState.globalVariables; g['$1']=$2; window.eventDispatcher.emit('global_variable_changed:$1',{name:'$1',value:$2,oldValue:!$2}); return '$1=$2';"; }
# test_phone_calls auto-rings caller_basic on load: clear it before firing our own ring.
clear_initial() { for i in $(seq 1 20); do a2b_ev "const c=window.phoneRinger.current(); return c?c.npcId:null;" | grep -qx '"caller_basic"' && { a2b_ev "window.phoneRinger.decline('caller_basic'); return 'declined';" >/dev/null; sleep 1; return 0; }; sleep 1; done; }

case $1 in
m04)
  m10_open m04 m04_critical_failure --start-room battery_hall_1 --set vance_met=true
  $S $GID '{"cmd":"moveToNear","id":"analog_thermometer"}' 40 >/dev/null
  $S $GID '{"cmd":"interact","id":"analog_thermometer"}' 40 >/dev/null; sleep 2
  echo "dial read: anomaly_detected=$(glob anomaly_detected) esd=$(glob esd_authorized)"
  a2b_ev "const b=document.querySelector('.minigame-close-button, .close-button'); if(b){b.click(); return 'closed popup';} return 'no popup';" >/dev/null
  gate wr agent_0x99 40; echo "HaX dial ring (has ringWhile): $(rs)"
  setg esd_authorized true >/dev/null; echo "ESD set live while ringing"
  for t in 2 4 6; do sleep 2; echo "t+${t}s: ringer=$(rs) rows=$(rows agent_0x99)"; done
  a2b_shot m04_after_esd
  echo "m04 result: ringer should be null (ringWhile dropped it), no Missed/Call back row"
  a2b_quit ;;
m09)
  m10_open m09 m09_digital_archaeology --start-room sorensen_office --set flag2_submitted=true --set m05_torres_turned=true
  # A loaded phone NPC in m09 to ring on (torres_phone when its branch loads it, else HaX's contact).
  NPC=$(a2b_ev "const nm=window.npcManager; return nm.getNPC('torres_phone')?'torres_phone':(nm.getNPC('agent_0x99')?'agent_0x99':null);" | tr -d '"')
  echo "ringing on loaded phone NPC: $NPC"
  a2b_ev "window.gameState.globalVariables.hl_box_opened=false; return 'reset';" >/dev/null
  # The real Torres lid-ring shape: a trigger-time guard (!hl_box_opened) in the mapping condition, and
  # NO ring.ringWhile. The ringer must not re-check the trigger condition (M1 R4 rule 7).
  a2b_ev "window.npcManager._handleEventMapping('$NPC','es_torres',{handlerIndex:9, knot:'call', targetKnot:'call', conversationMode:'phone-chat', ring:{onMissed:'callback'}, once:true, cooldown:0, condition:'globalVars.hl_box_opened !== true', setGlobal:{es_torres_rang:true}},{}); return 'lid ring fired';" >/dev/null
  gate wr "$NPC" 40; echo "lid ring (no ringWhile): $(rs) hl_box_opened=$(glob hl_box_opened)"
  # Open the box while it rings: the trigger guard flips. With no ring.ringWhile the call must NOT drop.
  setg hl_box_opened true >/dev/null
  for t in 2 4 6; do sleep 2; echo "t+${t}s after the box is opened: $(rs)"; done
  echo "m09 result: still ringing = the trigger guard is not re-checked (M1 R4 rule 7)"; a2b_shot m09_torres_noDrop
  a2b_quit ;;
m1_held)
  a2b_open m1_held; clear_initial; a2b_ev "$COUNT" >/dev/null
  open_phone; open_thread caller_thread >/dev/null; echo "own thread open: $(mgc)"
  a2b_ev "const fw=window.MinigameFramework; if(!fw.__refuseCalls){ fw.__refuseCalls=true; const o=fw.startMinigame.bind(fw); fw.startMinigame=function(t,c,p){ if(p&&p.ringerCall) return false; return o(t,c,p); }; } return 'calls refused';"
  a2b_ev "window.eventDispatcher.emit('ring_thread', {}); return 'rang';" >/dev/null
  gate wr caller_thread 25; echo "ringing; counts=$(cc)"
  a2b_ev "window.phoneRinger.answer('caller_thread'); return 'answered';" >/dev/null; sleep 2
  echo "after Answer (held, phone put aside, call never opened): $(rs) phoneOpen=$(a2b_ev "return !!window.MinigameFramework.currentMinigame;") counts=$(cc)"
  a2b_ev "window.phoneRinger.close(); return 'ending';" >/dev/null; sleep 2
  echo "after the ending closed over the held offer: ringer=$(rs) counts=$(cc)"
  cc > "$OUT/m1_held_counts.json"; a2b_shot after
  a2b_quit ;;
m2_twin)
  a2b_open m2_twin; clear_initial
  a2b_ev "const g=window.gameState.globalVariables; g.es_read_heard=false; g.es_rang=false; return 'reset';" >/dev/null
  # Mapping A: ring.ringWhile guards on the non-latch state; the mapping's setGlobal is its latch.
  a2b_ev "window.npcManager._handleEventMapping('caller_thread','es_ev_a',{handlerIndex:0, knot:'ring_call', targetKnot:'ring_call', conversationMode:'phone-chat', ring:{onMissed:'callback', ringWhile:'globalVars.es_read_heard !== true'}, once:true, cooldown:0, setGlobal:{es_rang:true}},{}); return 'A fired';" >/dev/null
  gate wr caller_thread 20; echo "A rings: $(rs); es_rang=$(a2b_ev "return window.gameState.globalVariables.es_rang;")"
  setg es_read_heard true >/dev/null; sleep 2
  echo "after ringWhile fails: ringer=$(rs) es_rang=$(a2b_ev "return window.gameState.globalVariables.es_rang;") (restored to falsy = R1 m2)"
  a2b_ev "window.npcManager._handleEventMapping('caller_thread','es_ev_b',{handlerIndex:1, knot:'ring_call', targetKnot:'ring_call', conversationMode:'phone-chat', ring:{onMissed:'callback'}, once:true, cooldown:0, condition:'globalVars.es_rang !== true', setGlobal:{es_rang:true}},{}); return 'B fired';" >/dev/null
  gate wr caller_thread 20; echo "twin B rings after the quiet drop: $(rs) es_rang=$(a2b_ev "return window.gameState.globalVariables.es_rang;")"
  a2b_shot twin_ringing
  a2b_quit ;;
esac
