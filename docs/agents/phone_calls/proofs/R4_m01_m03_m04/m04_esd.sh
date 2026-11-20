#!/bin/bash
# R4 m04: the ESD goes live (a) while the dial ring is ringing, (b) after the ring was declined.
# esd_authorized is set by the real voltage_neutralised mapping (scenario.json.erb ~:1445); voltage_neutralised
# stands in for Voltage's conversation. attack_mechanism_known is a head-start global.
#   PC_PORT=3023 OUT=docs/agents/phone_calls/proofs/R4_m01_m03_m04 docs/agents/phone_calls/proofs/R4_m01_m03_m04/m04_esd.sh ring_esd|decline_esd
source /home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-phone-calls/tools/phone_calls/routes/m10_lib.sh
LOGEV="window.__ev=[]; for (const n of ['conversation_closed:agent_0x99','global_variable_changed:esd_authorized','phone_call_answered:agent_0x99','phone_call_declined:agent_0x99','phone_call_missed:agent_0x99']) window.eventDispatcher.on(n, ()=>window.__ev.push(n+'@'+Math.round(performance.now()/100)/10)); return true;"
evs() { a2b_ev "return window.__ev;"; }
rs() { a2b_ev "const c=window.phoneRinger.current(); return c?{npc:c.npcId,state:c.state}:null;"; }
banner() { a2b_ev "const b=document.querySelector('.incoming-call'); return b ? b.innerText.replace(/\n+/g,' | ') : null;"; }
hdr_btn() { a2b_ev "const b=document.querySelector('.call-button'); return b ? b.innerText.trim() : null;"; }
voltage_down() { a2b_ev "const g=window.gameState.globalVariables; g.voltage_neutralised=true; window.eventDispatcher.emit('global_variable_changed:voltage_neutralised',{name:'voltage_neutralised',value:true,oldValue:false}); return true;" >/dev/null; }
m10_open $1 m04_critical_failure --start-room battery_hall_1 --set vance_met=true --set attack_mechanism_known=true; a2b_ev "$LOGEV" >/dev/null
$S $GID '{"cmd":"moveToNear","id":"analog_thermometer"}' 40 >/dev/null
$S $GID '{"cmd":"interact","id":"analog_thermometer"}' 40 >/dev/null; sleep 2
echo "dial read: anomaly_detected=$(glob anomaly_detected) esd=$(glob esd_authorized)"
a2b_ev "const b=document.querySelector('.minigame-close-button, .close-button'); if(b){b.click(); return 'closed popup';} return 'no popup';" >/dev/null
gate wait_screen "!!(window.phoneRinger.current() && window.phoneRinger.current().state==='ringing')" 40
echo "ringing: $(rs) banner=$(banner)"; a2b_shot ringing
case $1 in
ring_esd)
  voltage_down; sleep 1; echo "voltage down: esd_authorized=$(glob esd_authorized)"
  for t in 1 2 3 4 6 10 25; do sleep 2; echo "t+~${t}: ringer=$(rs) banner=$(banner)"; done
  a2b_shot after_esd
  open_phone; open_thread agent_0x99; echo "thread: $(screen | jq -c '{header,thread}')"; echo "rows=$(rows agent_0x99)"; a2b_shot thread ;;
decline_esd)
  a2b_decline >/dev/null; sleep 4; open_phone; open_thread agent_0x99
  echo "after decline: header=$(hdr_btn) rows=$(rows agent_0x99)"; a2b_shot after_decline
  voltage_down; sleep 4; echo "voltage down: esd_authorized=$(glob esd_authorized)"
  open_phone; open_thread agent_0x99; echo "after ESD: header=$(hdr_btn) thread=$(screen | jq -c '.thread')"; a2b_shot after_esd
  echo "row call buttons: $(a2b_ev "return document.querySelectorAll('.call-row .call-back, .call-back-button, [data-action=callback]').length;")"
  a2b_ev "const b=document.querySelector('.call-button'); if(!b) return 'no header button'; b.click(); return 'pressed';"; sleep 4
  echo "after press: ringer=$(rs) in-call=$(a2b_ev "return $IN_CALL;")" ;;
esac
evs; a2b_quit
