#!/bin/bash
# M1 R5 reviewer checks (m09). Keyless :3028 only. Sources the M1 route and the PS_m09 extra helpers.
#   X=<hax_label|hax_banner> bash docs/agents/phone_calls/proofs/R_m07_m09/m09_r5.sh
cd /home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-phone-calls
export PC_PORT=3028 OUT=docs/agents/phone_calls/proofs/R_m07_m09
X0=$X; X=none; source docs/agents/phone_calls/proofs/PS_m09/m09_ps_extra.sh; X=$X0
REC="window.__cap=[]; const t0=performance.now(); setInterval(()=>{ const e=document.getElementById('call-caption'); const b=document.querySelector('.incoming-call'); const m=window.MinigameFramework.currentMinigame; const k='caption='+(e?e.innerText:'-')+' | banner='+(b?b.innerText.replace(/\n+/g,' / '):'-')+' | mg='+(m?m.constructor.name+':'+(m.params&&m.params.npcId):'-'); if(window.__cap[window.__cap.length-1]?.k!==k) window.__cap.push({k, t:((performance.now()-t0)/1000).toFixed(1)}); },100); return true;"
case $X in
hax_label)  # HaX's identity scene as a voiced forced call (seeded as in PS_m09 hax_label): record caption and any banner
  open_m09 hax_label --start-room reading_room --set flag1_submitted=true --set flag3_submitted=true --set nightshade_file_held=true
  a2b_ev "$REC" >/dev/null
  echo "identity_scene_started=$(a2b_ev "return !!window.gameState.globalVariables.identity_scene_started")"
  $S $GID '{"cmd":"openInventoryItem","item":"phone"}' >/dev/null; sleep 2
  a2b_ev "const c=document.querySelector('.contact-item[data-npc-id=\"agent_0x99\"]'); if(!c) return 'no contact'; c.click(); return 'opened HaX';"; sleep 3; close_mg; sleep 4
  echo "seen: $(a2b_ev "return window.__cap")"; a2b_shot hax_call
  echo "voiced mg: $(a2b_ev "const m=window.MinigameFramework.currentMinigame; return m?m.constructor.name+' '+(m.params&&m.params.npcId)+' voiced='+!!(m.params&&m.params.voiced):null")"
  a2b_quit ;;
hax_banner)  # m09 has no HaX ring mapping (her calls are forced); offer one ring on her contact to read the banner caption (synthetic, d05dad42d fallback)
  open_m09 hax_banner --start-room reading_room
  a2b_ev "$REC" >/dev/null
  a2b_ev "window.npcManager._handleEventMapping('agent_0x99','r5_probe',{handlerIndex:99, knot:'support_hub', targetKnot:'support_hub', conversationMode:'phone-chat', voiced:true, ring:{onMissed:'callback'}, once:true, cooldown:0},{}); return 'offered';" >/dev/null
  gate wait_ring agent_0x99 20; sleep 1; echo "banner: $(a2b_ev "const b=document.querySelector('.incoming-call'); return b?b.innerText.replace(/\n+/g,' / '):null")"; a2b_shot banner
  a2b_answer >/dev/null; sleep 3; echo "seen: $(a2b_ev "return window.__cap")"; a2b_shot call
  a2b_quit ;;
esac
