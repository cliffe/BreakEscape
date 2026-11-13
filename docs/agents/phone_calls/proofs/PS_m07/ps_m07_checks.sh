#!/bin/bash
# PS_m07 reviewer checks: fine-grained read-beat timing, look of his thread.
cd /home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-phone-calls
export PC_PORT=3028 OUT=docs/agents/phone_calls/proofs/PS_m07
source tools/phone_calls/routes/m6_live.sh none
# snap: one-line state of the call, with ms timestamp
snap() { a2b_ev "const l=[...document.querySelectorAll('.message-text, .message-narration')].map(m=>m.innerText.trim()).filter(Boolean).slice(-1)[0]||null; const c=document.querySelectorAll('.choice-button').length; const r=window.phoneRinger; const m=window.MinigameFramework.currentMinigame; const sh=document.querySelector('.phone-terminal-theme'); return {t:Date.now()%1000000, last:l, ch:c, active:r.callActive(), mg:m?m.constructor.name:null, term:!!sh};"; }
# fine walk: click the first choice when one shows (after 1.5 s), log every poll, stop 6 s after the call ends
fine_walk() { local ended=0; for i in $(seq 1 200); do s=$(snap); echo "$s"; if echo "$s" | grep -q '"active":false'; then ended=$((ended+1)); [ $ended -ge 8 ] && return 0; fi; if echo "$s" | grep -q '"ch":[1-9]'; then sleep 1.5; a2b_ev "const b=document.querySelector('.choice-button'); if(b)b.click(); return 'c';" >/dev/null; echo "CLICK"; fi; sleep 0.4; done; }
theme() { a2b_ev "const sh=document.querySelector('.phone-terminal-theme'); const h=document.querySelector('.phone-header, .minigame-header'); const m=window.MinigameFramework.currentMinigame; return {terminal:!!sh, params_theme:m&&m.params?m.params.theme:null, appTheme:m?m.appTheme:null, view:m&&m.ui?m.ui.currentView:null};"; }
case $1 in
t30)
  m10_open t30 $SC $COUNTDOWN; sleep 1; enter_ops
  wait_banner 20 && echo "banner: $(ringer)"; a2b_answer >/dev/null; wait_call 15
  fine_walk; a2b_shot after_end
  echo "rows: $(rows $AID)"; echo "fire T-20"; fire architect_t20_played
  wait_banner 20 && echo "T-20 rings: $(ringer)"; a2b_shot t20_banner
  echo "architect /tts: $(arch_tts)"; a2b_quit ;;
signoff)
  m10_open signoff $SC $COUNTDOWN $FLAGS; sleep 1
  echo "phone closed: mg=$(mgc)"; a2b_ev "window.eventDispatcher.emit('minigame_completed',{}); return true;" >/dev/null; sleep 2
  echo "ringer: $(ringer) mg=$(mgc) back=$(a2b_ev "const b=document.getElementById('back-button'); return b?getComputedStyle(b).display:null;")"
  fine_walk; a2b_shot after_end
  echo "architect_signoff_done=$(glob architect_signoff_done) debrief_requested=$(glob debrief_requested) mg=$(mgc) ringer=$(ringer)"
  echo "rows: $(rows $AID)"; echo "architect /tts: $(arch_tts)"; a2b_quit ;;
look)
  m10_open look $SC $COUNTDOWN; sleep 1; enter_ops; wait_banner 20; a2b_decline >/dev/null; sleep 3
  open_phone; echo "list (inventory phone): $(theme)"; a2b_shot list
  open_thread $AID; sleep 1; echo "his thread from the list: $(theme)"; a2b_shot thread_from_list
  a2b_ev "window.MinigameFramework.endMinigame(false); return 1;" >/dev/null; sleep 2; echo "closed: mg=$(mgc)"
  a2b_ev "const n=window.npcManager.getNPC('the_architect'); window.MinigameFramework.startMinigame('phone-chat', null, {npcId:'the_architect', npcName:n.displayName, theme:n.phoneTheme, phoneId:n.phoneId}); return n.phoneTheme;"; sleep 3
  echo "phone opened directly on his thread (bark path params): $(theme)"; a2b_shot thread_direct
  a2b_ev "window.MinigameFramework.endMinigame(false); return 1;" >/dev/null; sleep 2
  echo "fire T-20, answer: in-call look"; fire architect_t20_played; wait_banner 20; a2b_answer >/dev/null; wait_call 15; sleep 3; echo "in call: $(theme)"; a2b_shot in_call
  a2b_quit ;;
esac
