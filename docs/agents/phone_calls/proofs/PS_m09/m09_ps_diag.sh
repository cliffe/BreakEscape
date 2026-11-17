#!/bin/bash
# Review M1 R4: where did HaX's read-out toast go? Poll toast DOM and HaX's history after the terminal.
source tools/phone_calls/routes/m09_m1_live.sh
open_m09 ${LBL:-diag} --start-room reading_room
submit_flag1; close_mg; t0=$(date +%s)
for i in $(seq 1 24); do sleep 1
  echo "+$(( $(date +%s)-t0 ))s $(a2b_ev "const vis=[...document.querySelectorAll('body *')].filter(e=>e.children.length<6&&/First box is in|Victoria|field guide/.test(e.textContent||'')&&e.offsetParent!==null).map(e=>e.className+':'+e.textContent.trim().slice(0,40)).slice(0,3); const h=(window.npcManager.getConversationHistory('agent_0x99')||[]).slice(-3).map(m=>m.type+':'+(m.text||'').slice(0,30)); return {room:window.currentPlayerRoom, vis, h};")"
  [ $i = 2 ] && { enter_stacks >/dev/null; }
done; a2b_quit
