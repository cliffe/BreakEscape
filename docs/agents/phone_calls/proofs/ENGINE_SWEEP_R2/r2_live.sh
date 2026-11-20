#!/bin/bash
# Engine sweep review R2 live proofs (committed code 7fecbed08). Keyless server on :3027 only, own pidfile.
#   PC_PORT=3027 bash docs/agents/phone_calls/proofs/ENGINE_SWEEP_R2/r2_live.sh <case>
# cases:
#   m04_drop  ringWhile drops HaX's dial ring once the ESD goes live. The ESD is authorised by the real
#             mapping (attack_mechanism_known lands last; voltage_neutralised seeded), not by poking the global.
#             Every event emitted after the ring starts is logged: no phone_call_*, no conversation_closed.
#   m04_cb    the dial ring is declined (Missed row + Call back), then the ESD goes live the same way:
#             the Call back is cleared by callbackWhen when the thread's button is built.
#   m07_hangup / m07_taunt / m07_stub  run r1_live_r2probe.sh (R1 route + fixed beat probe) m07_back, m07_taunt, m07_theme with OUT here.
export PC_PORT=${PC_PORT:?set PC_PORT}
export OUT=${OUT:-docs/agents/phone_calls/proofs/ENGINE_SWEEP_R2}
source "$(dirname "${BASH_SOURCE[0]}")/../../../../../tools/phone_calls/routes/m10_lib.sh"
EVLOG="window.__ev=[]; const d=window.eventDispatcher; if(!d.__r2){ const o=d.emit.bind(d); d.emit=function(n,x){ if(window.__evOn) window.__ev.push(n+(x&&x.value!==undefined?'='+JSON.stringify(x.value):'')); return o(n,x); }; d.__r2=true; } return true;"
rs() { a2b_ev "const c=window.phoneRinger.current(); return c?{npcId:c.npcId,state:c.state,knot:c.knot,ringCondition:c.ringCondition||null}:null;"; }
wr() { for i in $(seq 1 ${2:-40}); do a2b_ev "const c=window.phoneRinger.current(); return !!c && c.npcId==='$1' && c.state==='ringing';" | grep -qx true && return 0; sleep 1; done; return 1; }
emitg() { a2b_ev "const g=window.gameState.globalVariables; const old=g['$1']; g['$1']=$2; window.eventDispatcher.emit('global_variable_changed:$1',{name:'$1',value:$2,oldValue:old}); return '$1=$2';"; }
dial() {
  m10_open $1 m04_critical_failure --start-room battery_hall_1 --set vance_met=true --set voltage_neutralised=true
  a2b_ev "$EVLOG" >/dev/null
  $S $GID '{"cmd":"moveToNear","id":"analog_thermometer"}' 40 >/dev/null
  $S $GID '{"cmd":"interact","id":"analog_thermometer"}' 40 >/dev/null; sleep 2
  echo "dial read: anomaly_detected=$(glob anomaly_detected) voltage_neutralised=$(glob voltage_neutralised) attack_mechanism_known=$(glob attack_mechanism_known) esd=$(glob esd_authorized)"
  a2b_ev "const b=document.querySelector('.minigame-close-button, .close-button'); if(b){b.click(); return 'closed popup';} return 'no popup';" >/dev/null
  gate wr agent_0x99 40; echo "HaX dial ring: $(rs)"
}
case $1 in
m04_drop)
  dial $1; a2b_shot ringing
  a2b_ev "window.__evOn=true; return true;" >/dev/null
  emitg attack_mechanism_known true >/dev/null; echo "attack_mechanism_known landed while ringing -> esd_authorized=$(glob esd_authorized)"
  for t in 1 2 4 6; do sleep $([ $t = 1 ] && echo 1 || echo 2); [ $t = 1 ] && T=1 || T=$t; echo "t+${t}s: ringer=$(rs) banner=$(a2b_ev "return !!document.querySelector('.incoming-call');") rows=$(rows agent_0x99) callback=$(a2b_ev "return window.phoneRinger.callbackFor('agent_0x99');")"; done
  echo "events after the ring started: $(a2b_ev "return window.__ev;")"
  a2b_shot after_esd
  # 25 s on: nothing comes back (no ring-out, no missed, no voicemail)
  sleep 22; echo "t+28s: ringer=$(rs) rows=$(rows agent_0x99) callback=$(a2b_ev "return window.phoneRinger.callbackFor('agent_0x99');") phone_events=$(a2b_ev "return window.__ev.filter(e=>/^phone_call|^conversation_closed/.test(e));")"
  a2b_quit ;;
m04_cb)
  dial $1
  a2b_decline >/dev/null; sleep 2
  echo "declined: ringer=$(rs) rows=$(rows agent_0x99) callback=$(a2b_ev "return window.phoneRinger.callbackFor('agent_0x99');")"
  open_phone; open_thread agent_0x99 >/dev/null; echo "thread before ESD: header=$(a2b_ev "const b=document.querySelector('.call-button'); return b?b.innerText.trim():null;")"; a2b_shot before_esd
  a2b_ev "const m=window.MinigameFramework.currentMinigame; if(m) m.complete(false); return 'closed';" >/dev/null; sleep 1.5
  emitg attack_mechanism_known true >/dev/null; echo "ESD live: esd_authorized=$(glob esd_authorized)"; sleep 3
  echo "callbackFor before the button is built (in-memory, not yet re-checked): $(a2b_ev "return window.phoneRinger.callbackFor('agent_0x99');")"
  open_phone; open_thread agent_0x99 >/dev/null
  echo "thread after ESD: header=$(a2b_ev "const b=document.querySelector('.call-button'); return b?b.innerText.trim():null;") callback=$(a2b_ev "return window.phoneRinger.callbackFor('agent_0x99');") rows=$(rows agent_0x99)"
  a2b_shot after_esd
  a2b_quit ;;
m07_hangup) OUT=$OUT bash docs/agents/phone_calls/proofs/ENGINE_SWEEP_R2/r1_live_r2probe.sh m07_back ;;
m07_taunt)  OUT=$OUT bash docs/agents/phone_calls/proofs/ENGINE_SWEEP_R2/r1_live_r2probe.sh m07_taunt ;;
m07_stub)
  # 7fecbed08: the Architect's thread, tapped from the contact list (device look, item 11), shows the
  # parenthesised "(Hang up.)" stub; pressing it posts no player bubble and adds no player history line.
  source tools/phone_calls/routes/m6_live.sh __none__ 2>/dev/null
  pb() { a2b_ev "return document.querySelectorAll('.message-bubble.player, .message.player, .player-message, .message.sent').length;"; }
  ph() { a2b_ev "return (window.npcManager.getConversationHistory('$AID')||[]).filter(m=>m.sender==='player'||m.type==='player').map(m=>m.text);"; }
  m10_open $1 $SC $COUNTDOWN; sleep 1; a2b_ev "$EVLOG" >/dev/null; a2b_ev "window.__evOn=true; return true;" >/dev/null
  open_phone; open_thread $AID >/dev/null; sleep 1
  echo "thread choices: $(a2b_ev "return [...document.querySelectorAll('.choice-button')].map(b=>b.innerText.trim());") player bubbles=$(pb) player history=$(ph)"; a2b_shot before
  choose_text "(Hang up.)"; sleep 2.5
  echo "after (Hang up.): mg=$(mgc) player bubbles=$(pb) player history=$(ph) closed events=$(a2b_ev "return window.__ev.filter(e=>/^conversation_closed/.test(e));")"
  a2b_shot after; a2b_quit ;;
esac
