#!/bin/bash
# M6 R5 reviewer check (m07, light round on 88033afb3). Keyless :3024 only.
#   bash docs/agents/phone_calls/proofs/R5_m06_m07_m08/m07_r5.sh signoff_redirect
# Forced sign-off with the team redirected to Trojan Horse and all four flags in, then the HaX bring-in in the same game.
cd /home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-phone-calls
export PC_PORT=3024 OUT=docs/agents/phone_calls/proofs/R5_m06_m07_m08
source tools/phone_calls/routes/m6_live.sh none
snap() { a2b_ev "const l=[...document.querySelectorAll('.message-text, .message-narration')].map(m=>m.innerText.trim()).filter(Boolean).slice(-1)[0]||null; const c=[...document.querySelectorAll('.choice-button')].map(b=>b.innerText.trim()); const r=window.phoneRinger; const m=window.MinigameFramework.currentMinigame; return {t:Date.now()%1000000, last:l, ch:c, active:r.callActive(), mg:m?m.constructor.name:null};"; }
fine_walk() { local ended=0; for i in $(seq 1 220); do s=$(snap); echo "$s"; if echo "$s" | grep -q '"active":false'; then ended=$((ended+1)); [ $ended -ge 6 ] && return 0; fi; if echo "$s" | grep -q '"ch":\["'; then sleep 1.5; a2b_ev "const bs=[...document.querySelectorAll('.choice-button')]; const b=bs.find(x=>/${PREF:-.}/.test(x.innerText))||bs[0]; if(!b) return null; const t=b.innerText.trim(); b.click(); return t;" | sed 's/^/CLICK /'; fi; sleep 0.4; done; }
REDIR="--set team_assigned=true --set team_assignment=trojan_horse --set team_redirected=true --set delegation_registered=true --set inside_reached=true"
case $1 in
signoff_redirect)
  m10_open signoff_redirect $SC $FLAGS $REDIR; sleep 1
  echo "globals: team_assignment=$(glob team_assignment) team_redirected=$(glob team_redirected)"
  a2b_ev "window.eventDispatcher.emit('minigame_completed',{}); return true;" >/dev/null; sleep 2
  echo "ringer: $(ringer) mg=$(mgc)"; a2b_shot signoff_call
  fine_walk; a2b_shot signoff_after_end
  echo "architect_signoff_done=$(glob architect_signoff_done) mg=$(mgc)"; echo "rows: $(rows $AID)"
  echo "architect /tts: $(arch_tts)"
  echo "--- bring-in"
  open_phone; open_thread agent_0x99; sleep 1; echo "first HaX call (team_assigned set by the route, so his first call is still owed): $(screen|jq -c '{choices}')"
  choose_text "Understood" >/dev/null; sleep 3; echo "hub: $(screen|jq -c '{choices,header}')"; a2b_shot hub
  choose_text "Bring me in" >/dev/null; sleep 1; echo "dialling: $(screen|jq -c '{bar}')"; a2b_shot calling
  wait_call 20; sleep 2; echo "call: $(screen|jq -c '{bar,subs,choices,thread}')"; a2b_shot bring_call
  gate wait_screen "!document.getElementById('call-end-button')" 40; sleep 2
  echo "after call: debrief_requested=$(glob debrief_requested) start_debrief=$(glob start_debrief_cutscene) mg=$(mgc)"; a2b_shot bring_after
  echo "HaX rows: $(rows agent_0x99)"; echo "HaX /tts: $(hax_tts)"
  echo "armed ending: $(a2b_ev "return window.endingCheck.heldRecord();")"
  a2b_quit ;;
esac
