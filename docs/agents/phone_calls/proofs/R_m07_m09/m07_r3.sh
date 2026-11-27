#!/bin/bash
# M6 R3 reviewer checks (m07, light round on 464c42064 + 2eff0b186 + 7fecbed08). Keyless :3028 only.
#   bash docs/agents/phone_calls/proofs/R_m07_m09/m07_r3.sh <t30|back|decline_hang|seattle|signoff>
# bring / bring_notyet run through tools/phone_calls/routes/m6_live.sh with the same OUT.
cd /home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-phone-calls
export PC_PORT=3028 OUT=docs/agents/phone_calls/proofs/R_m07_m09
source tools/phone_calls/routes/m6_live.sh none
snap() { a2b_ev "const l=[...document.querySelectorAll('.message-text, .message-narration')].map(m=>m.innerText.trim()).filter(Boolean).slice(-1)[0]||null; const c=[...document.querySelectorAll('.choice-button')].map(b=>b.innerText.trim()); const r=window.phoneRinger; const m=window.MinigameFramework.currentMinigame; return {t:Date.now()%1000000, last:l, ch:c, active:r.callActive(), mg:m?m.constructor.name:null};"; }
# fine walk: when choices show, wait 1.5 s and click the one matching $PREF (regex) or the first; log every poll; stop 6 polls after the call ends
fine_walk() { local ended=0; for i in $(seq 1 220); do s=$(snap); echo "$s"; if echo "$s" | grep -q '"active":false'; then ended=$((ended+1)); [ $ended -ge 6 ] && return 0; fi; if echo "$s" | grep -q '"ch":\["'; then sleep 1.5; a2b_ev "const bs=[...document.querySelectorAll('.choice-button')]; const b=bs.find(x=>/${PREF:-.}/.test(x.innerText))||bs[0]; if(!b) return null; const t=b.innerText.trim(); b.click(); return t;" | sed 's/^/CLICK /'; fi; sleep 0.4; done; }
playerBubbles() { a2b_ev "return {dom:document.querySelectorAll('.message-bubble.player').length, hist:(window.npcManager.getConversationHistory('the_architect')||[]).filter(m=>m.type==='player').map(m=>m.text)};"; }
case $1 in
t30)
  m10_open t30 $SC $COUNTDOWN; sleep 1; enter_ops
  wait_banner 20 && echo "banner: $(ringer)"; a2b_answer >/dev/null; wait_call 15
  fine_walk; a2b_shot after_end
  echo "rows: $(rows $AID)"; echo "architect /tts: $(arch_tts)"; a2b_quit ;;
back)
  m10_open back $SC $COUNTDOWN; sleep 1; enter_ops
  wait_banner 20; a2b_answer >/dev/null; wait_call 15; sleep 4; echo "in call: $(ringer) $(snap)"; a2b_shot in_call
  echo "back arrow, polled in page: $(a2b_ev "const b=document.getElementById('back-button'); if(!b) return 'no back'; const t0=performance.now(); b.click(); for(let i=0;i<400;i++){ if(!window.phoneRinger.callActive() && !window.MinigameFramework.currentMinigame) return {closedAfterMs:Math.round(performance.now()-t0)}; await new Promise(r=>setTimeout(r,10)); } return 'still open after 4 s';")"
  sleep 2; echo "after: $(ringer) mg=$(mgc) rows=$(rows $AID)"; a2b_shot after_back; a2b_quit ;;
decline_hang)
  m10_open decline_hang $SC $COUNTDOWN; sleep 1
  enter_ops; wait_banner 20; a2b_answer >/dev/null; wait_call 15; PREF=. fine_walk >/dev/null; echo "T-30 done: rows=$(rows $AID)"
  echo "fire T-20"; fire architect_t20_played; wait_banner 20 && echo "banner: $(ringer)"; a2b_shot t20_banner
  a2b_decline >/dev/null; sleep 3; echo "after decline: $(ringer) rows=$(rows $AID)"
  open_phone; open_thread $AID; sleep 6; echo "thread: $(thread_text)"; echo "voice bubbles: $(vm_bubbles)"; a2b_shot thread
  echo "choices: $(a2b_ev "return [...document.querySelectorAll('.choice-button')].map(b=>b.innerText.trim());")  player bubbles before: $(playerBubbles)"
  echo "click: $(choose_text 'Hang up')"; sleep 3
  echo "player bubbles after (expect none): $(playerBubbles)"; echo "thread after: $(thread_text)"; echo "mg=$(mgc)"; a2b_shot after_hangup
  echo "architect /tts: $(arch_tts)"; a2b_quit ;;
seattle)
  m10_open seattle $SC $COUNTDOWN; sleep 1
  echo "fire T-1, let it ring"; fire architect_t1_played; wait_banner 20 && echo "T-1 banner: $(ringer)"
  echo "fire countdown_expired"; fire countdown_expired; sleep 2; echo "ringer: $(ringer)"; a2b_shot seattle_banner
  a2b_answer >/dev/null; wait_call 15; PREF='How many' fine_walk; a2b_shot after_end
  echo "rows: $(rows $AID)"; echo "architect /tts: $(arch_tts)"; a2b_quit ;;
signoff)
  m10_open signoff $SC $COUNTDOWN $FLAGS; sleep 1
  echo "phone closed: mg=$(mgc)"; a2b_ev "window.eventDispatcher.emit('minigame_completed',{}); return true;" >/dev/null; sleep 2
  echo "ringer: $(ringer) mg=$(mgc) back=$(a2b_ev "const b=document.getElementById('back-button'); return b?getComputedStyle(b).display:null;")"
  fine_walk; a2b_shot after_end
  echo "architect_signoff_done=$(glob architect_signoff_done) debrief_requested=$(glob debrief_requested) mg=$(mgc) ringer=$(ringer)"
  echo "rows: $(rows $AID)"; echo "held ending: $(a2b_ev "return window.endingCheck.heldRecord();")"; echo "architect /tts: $(arch_tts)"; a2b_quit ;;

hang_hist)  # T-30 declined, his thread opened, "(Hang up.)": history tail before and after, then reopen
  m10_open hang_hist $SC $COUNTDOWN; sleep 1; enter_ops; wait_banner 20; a2b_decline >/dev/null; sleep 3
  hist() { a2b_ev "return (window.npcManager.getConversationHistory('the_architect')||[]).slice(-4).map(m=>m.type+': '+(m.text||'').slice(0,70));"; }
  open_phone; open_thread $AID; sleep 6; echo "history before: $(hist)"; echo "choices: $(a2b_ev "return [...document.querySelectorAll('.choice-button')].map(b=>b.innerText.trim());")"
  a2b_ev "const b=[...document.querySelectorAll('.choice-button')].find(x=>/Hang up/.test(x.innerText)); b.click(); window.__hs=[]; const t0=performance.now(); const iv=setInterval(()=>{ const m=document.querySelector('.messages-container'); window.__hs.push(Math.round(performance.now()-t0)+'ms '+(m?[...m.querySelectorAll('.message-bubble.player, .message-narration')].slice(-2).map(e=>e.className.split(' ').pop()+':'+e.innerText.trim().slice(0,50)).join(' || '):'closed')); if(performance.now()-t0>4000) clearInterval(iv); },250); return 'clicked';" >/dev/null
  sleep 5; echo "screen after click (every 250 ms): $(a2b_ev "return window.__hs;")"; echo "history after: $(hist)"; echo "mg=$(mgc)"
  open_phone; open_thread $AID; sleep 4; echo "reopened: player bubbles=$(playerBubbles) tail=$(thread_text | tail -c 300)"; a2b_shot reopened; a2b_quit ;;

notyet_after)  # lab sheet check: after "Not yet", can the player call again? what happens when the last flag lands?
  m10_open notyet_after $SC --set briefing_played=true --set grid_saved=true --set flag1_submitted=true --set flag2_submitted=true --set flag3_submitted=true --set architect_signoff_started=true --set architect_signoff_done=true
  open_phone; open_thread agent_0x99; sleep 1; choose_text "Bring me in" >/dev/null; wait_call 20; gate wait_screen "!document.getElementById('call-end-button')" 40; sleep 3
  echo "after Not yet: debrief_requested=$(glob debrief_requested) mg=$(mgc)"
  a2b_ev "window.MinigameFramework.endMinigame(false); return 1;" >/dev/null; sleep 2; open_phone; open_thread agent_0x99; sleep 3
  echo "hub on reopen: $(screen|jq -c '{choices,thread:(.thread|.[-250:])}')"; a2b_shot hub_reopen
  a2b_ev "window.MinigameFramework.endMinigame(false); return 1;" >/dev/null; sleep 2
  echo "last flag lands (global set + its event), then the player walks into the ops floor"; fire flag4_submitted; sleep 3; enter_ops; sleep 4
  echo "after: start_debrief=$(glob start_debrief_cutscene) mg=$(mgc) held=$(a2b_ev "return window.endingCheck.heldRecord();") overlay=$(ending_overlay)"; a2b_shot after_flag4; a2b_quit ;;
esac
