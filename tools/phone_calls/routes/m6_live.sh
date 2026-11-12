#!/bin/bash
# M6 live proofs: m07 Architect withheld voiced taunts + voicemails, sign-off, seattle, HaX bring-in (plan 8, M6).
#   PC_PORT=3028 tools/phone_calls/routes/m6_live.sh <replay|replace|decline_vm|later_first|vm_play|back_row|reload|signoff|bring>
# The ring mappings react to events; we fire the real events the countdown timers would (global_variable_changed:architect_tXX_played,
# room_entered:operations_floor, countdown_expired) instead of waiting the real minutes. grid_saved stays false so taunts fire.
export OUT=${OUT:-docs/agents/phone_calls/proofs/M6} NODE_PATH=$PWD/node_modules
source "$(dirname "${BASH_SOURCE[0]}")/m10_lib.sh"
SC=m07_architects_gambit
AID=the_architect
setg() { a2b_ev "window.gameState.globalVariables['$1']=$2; return window.gameState.globalVariables['$1'];" >/dev/null; }
fire() { setg "$1" true; a2b_ev "window.eventDispatcher.emit('global_variable_changed:$1',{value:true}); return true;" >/dev/null; }
enter_ops() { a2b_ev "window.eventDispatcher.emit('room_entered:operations_floor',{roomId:'operations_floor'}); return true;" >/dev/null; }
ringer() { a2b_ev "const r=window.phoneRinger; const c=r&&r.current&&r.current(); const b=document.querySelector('.incoming-call'); return {cur:c?{npc:c.npcId,state:c.state,knot:c.knot,opened:c.opened}:null, q:r&&r.queueLength&&r.queueLength(), banner:b?b.innerText.replace(/\n+/g,' | '):null, bimg:b&&b.querySelector('img')?b.querySelector('img').getAttribute('src'):null};"; }
wait_banner() { for i in $(seq 1 ${1:-25}); do a2b_ev "return !!document.querySelector('.incoming-call');" | grep -qx true && return 0; sleep 1; done; return 1; }
wait_call() { for i in $(seq 1 ${1:-25}); do a2b_ev "return $IN_CALL;" | grep -qx true && return 0; sleep 1; done; return 1; }
back_arrow() { a2b_ev "const b=document.getElementById('back-button'); if(!b) return 'no back'; b.click(); return 'back clicked';"; }
vm_bubbles() { a2b_ev "return [...document.querySelectorAll('.voice-message-display .transcript')].map(t=>t.innerText.trim());"; }
play_first_vm() { a2b_ev "const c=document.querySelector('.voice-message-display .audio-controls'); if(!c) return 'no vm'; c.click(); return 'played';"; }
thread_text() { a2b_ev "const m=document.querySelector('.messages-container'); return m?m.innerText.replace(/\n+/g,' | '):null;"; }
drive_taunt() { for i in $(seq 1 10); do a2b_ev "return $IN_CALL;" | grep -qx true || break; n=$(a2b_ev "return document.querySelectorAll('.choice-button').length;"); if [ "$n" != "0" ]; then sleep 2; a2b_ev "const b=document.querySelector('.choice-button'); if(b)b.click(); return 'c';" >/dev/null; fi; sleep 2; done; }
COUNTDOWN="--set briefing_played=true --set team_assigned=true --set team_assignment=fracture --set delegation_registered=true --set inside_reached=true"
FLAGS="--set briefing_played=true --set grid_saved=true --set flag1_submitted=true --set flag2_submitted=true --set flag3_submitted=true --set flag4_submitted=true"
arch_tts() { jq -c 'select((.npc_id // .npcId)=="the_architect") | .text' "$OUT/${LABEL}_tts.jsonl" 2>/dev/null | tr '\n' ' '; }
hax_tts() { jq -c 'select((.npc_id // .npcId)=="agent_0x99") | .text' "$OUT/${LABEL}_tts.jsonl" 2>/dev/null | tr '\n' ' '; }

case $1 in
replay)  # T-30..T-1 in order, answering each; each ends on the back arrow (own-path "Call" row), which
         # frees the ringer for the next taunt. Driving the reply choices parks the phone open and holds the
         # ringer (no next ring); the back arrow is the player action that both ends the call and closes the phone.
  m10_open replay $SC $COUNTDOWN; sleep 1
  rep_step() { # $1 label
    wait_banner 20 && echo "$1 banner: $(ringer)" || { echo "$1 NO BANNER: $(ringer)"; return 1; }
    [ "$1" = T-30 ] && a2b_shot t30_banner
    a2b_answer >/dev/null; wait_call 15; sleep 2
    echo "$1 call: $(screen|jq -c '{bar,subs,choices}')"; a2b_shot ${1}_call
    back_arrow >/dev/null; sleep 2; echo "$1 rows: $(rows $AID)"
  }
  echo "T-30: enter ops"; enter_ops; rep_step T-30
  echo "fire architect_t20_played"; fire architect_t20_played; rep_step T-20
  echo "fire architect_t10_played"; fire architect_t10_played; rep_step T-10
  echo "fire architect_t5_played"; fire architect_t5_played; rep_step T-5
  echo "fire architect_t1_played"; fire architect_t1_played; rep_step T-1
  echo "rows after T-1: $(rows $AID)"; echo "architect /tts: $(arch_tts)"; a2b_quit ;;

replace)  # T-5 then T-1 queued behind an open person-chat; only T-1 rings
  m10_open replace $SC $COUNTDOWN; open_phone; sleep 1
  echo "open a person-chat to hold the ringer"; a2b_ev "const n=window.npcManager; return Object.keys(n.npcs||{});" | head -c 300; echo
  # open HaX thread as the held UI (a conversation/minigame open)
  open_thread agent_0x99; sleep 1; echo "mg open: $(mgc)"
  echo "fire T-5 then T-1 while thread open"; fire architect_t5_played; sleep 1; fire architect_t1_played; sleep 1
  echo "ringer while held: $(ringer)"
  # close the thread -> the queued call rings; must be T-1 (taunt_t1), not T-5
  a2b_ev "const m=window.MinigameFramework.currentMinigame; if(m) window.MinigameFramework.endMinigame(false); return 'closed';" >/dev/null; sleep 2
  wait_banner 20 && echo "ringing after close: $(ringer)"; a2b_shot ringing_after_close
  a2b_answer >/dev/null; wait_call 15; echo "opened call knot: $(ringer) screen=$(screen|jq -c '{subs}')"; a2b_shot opened; a2b_quit ;;

decline_vm)  # decline T-20, open his thread by hand: voicemail + dead air, never taunt_t20 as text
  m10_open decline_vm $SC $COUNTDOWN; sleep 1
  echo "fire T-20"; fire architect_t20_played; wait_banner 20 && echo "banner: $(ringer)"; a2b_shot t20_banner
  a2b_decline >/dev/null; sleep 3; echo "after decline: $(ringer) rows=$(rows $AID)"
  open_phone; open_thread $AID; sleep 2; echo "thread text: $(thread_text)"; a2b_shot thread
  echo "voice bubbles: $(vm_bubbles)"
  echo "taunt_t20 live text leaked? (should be empty): $(a2b_ev "const m=document.querySelector('.messages-container'); return m && /A word, Agent/.test(m.innerText);")"
  echo "architect /tts: $(arch_tts)"; a2b_quit ;;

later_first)  # a later taunt (T-10), with no earlier contact, must open its own narration, not a first-contact line
  m10_open later_first $SC $COUNTDOWN; sleep 1
  echo "fire T-10 as the first contact"; fire architect_t10_played; wait_banner 20 && echo "banner: $(ringer)"
  a2b_answer >/dev/null; wait_call 15; echo "T-10 opener: $(screen|jq -c '{subs,choices}')"; a2b_shot t10_open; drive_taunt
  echo "architect /tts: $(arch_tts)"; a2b_quit ;;

vm_play)  # a voicemail bubble in the terminal look plays (requests /tts)
  m10_open vm_play $SC $COUNTDOWN; sleep 1
  echo "fire T-30 via enter, decline -> voicemail"; enter_ops; wait_banner 20; a2b_decline >/dev/null; sleep 3
  open_phone; open_thread $AID; sleep 2; echo "theme: $(a2b_ev "return document.querySelector('.phone-screen')?document.querySelector('.phone-screen').className:null;")"; a2b_shot thread
  echo "voice bubbles: $(vm_bubbles)"; echo "play first vm: $(play_first_vm)"; sleep 2; a2b_shot playing
  echo "architect /tts after play: $(arch_tts)"; a2b_quit ;;

back_row)  # answer a taunt, end it with the back arrow -> leaves its call row
  m10_open back_row $SC $COUNTDOWN; sleep 1
  enter_ops; wait_banner 20; a2b_answer >/dev/null; wait_call 15; echo "in call: $(ringer)"; a2b_shot in_call
  echo "press back arrow: $(back_arrow)"; sleep 3; echo "after back: $(ringer) mg=$(mgc)"; echo "rows: $(rows $AID)"; a2b_shot after_back; a2b_quit ;;

reload)  # reload during a connected taunt -> missed row; withheld leaves nothing to call back
  m10_open reload $SC $COUNTDOWN; sleep 1
  enter_ops; wait_banner 20; a2b_answer >/dev/null; wait_call 15; echo "connected: $(ringer)"; a2b_shot connected
  echo "reload mid-call"; reload; sleep 3
  open_phone; open_thread $AID; sleep 2; echo "after reload rows: $(rows $AID)"; echo "callback button: $(a2b_ev "const b=document.querySelector('.call-button'); return b?b.innerText.trim():null;")"; a2b_shot after_reload; a2b_quit ;;

signoff)  # debrief waits for architect_signoff_done; sign-off is forced (auto-answers, no close)
  m10_open signoff $SC $COUNTDOWN $FLAGS --set debrief_requested=true; open_phone; sleep 1
  echo "console close with grid saved, no signoff yet"; a2b_ev "window.eventDispatcher.emit('minigame_completed',{}); return true;" >/dev/null; sleep 3
  echo "ringer (should be sign_off forced, NOT debrief): $(ringer)"; echo "debrief open? mg=$(mgc) start_debrief=$(glob start_debrief_cutscene)"; a2b_shot after_console
  wait_call 15; echo "sign_off call: $(screen|jq -c '{subs,choices}')"; a2b_shot signoff_call; drive_taunt; sleep 2
  echo "architect_signoff_done=$(glob architect_signoff_done)"
  # The sign_off call parks the phone open; close it so the person-chat debrief can take the screen.
  a2b_ev "const m=window.MinigameFramework.currentMinigame; if(m) window.MinigameFramework.endMinigame(false); return 'c';" >/dev/null; sleep 2; echo "phone closed: mg=$(mgc)"
  # The closing_debrief endingCheck trigger fired during setup and, with optional objectives open, held the
  # ending (window.endingCheck). It opens when the player settles the last optional objective or clicks the
  # objectives-panel "End the mission" button; endHeld() is that button. So the debrief waited for the sign-off
  # (and for the player), then opens as Netherton.
  echo "held ending: $(a2b_ev "return window.endingCheck.heldRecord();")"
  echo "run objectives-panel End the mission: $(a2b_ev "return window.endingCheck.endHeld();")"; sleep 4
  echo "debrief: start_debrief=$(glob start_debrief_cutscene) scene=$(a2b_ev "const m=window.MinigameFramework.currentMinigame; return m?{scene:m._sceneType,npc:(m.params||{}).npcId}:null;")"; a2b_shot debrief
  echo "architect /tts: $(arch_tts)"; a2b_quit ;;

bring|bring_notyet)  # HaX bring-in placed from the hub choice -> one-shot hand-off, debrief_requested.
  # architect_signoff_started too, or the forced sign_off re-rings on load (grid_saved && !started) and blocks the HaX thread.
  # bring       : all four flags in  -> "Putting you through. He's waiting." (flags-in branch)
  # bring_notyet: a flag still out   -> "Not yet. Put the rest of the flags through the relay..." (not-yet branch)
  if [ "$1" = bring ]; then BRINGFLAGS="$FLAGS"; else BRINGFLAGS="--set briefing_played=true --set grid_saved=true --set flag1_submitted=true --set flag2_submitted=true --set flag3_submitted=true"; fi
  m10_open $1 $SC $BRINGFLAGS --set architect_signoff_started=true --set architect_signoff_done=true; open_phone; sleep 1
  open_thread agent_0x99; sleep 1; echo "hub: $(screen|jq -c '{choices,header}')"; a2b_shot hub
  choose_text "Bring me in" >/dev/null; sleep 1; echo "dialling: $(screen|jq -c '{bar}')"; a2b_shot calling
  wait_call 20; sleep 2; echo "call: $(screen|jq -c '{bar,subs,choices,thread}')"; a2b_shot call
  gate wait_screen "!document.getElementById('call-end-button')" 40; sleep 2
  echo "after call: debrief_requested=$(glob debrief_requested) start_debrief=$(glob start_debrief_cutscene) mg=$(mgc)"; a2b_shot after
  echo "HaX rows: $(rows agent_0x99)"
  echo "HaX /tts: $(hax_tts)"
  # The hand-off set debrief_requested. The closing_debrief (Netherton) endingCheck trigger is now the armed
  # ending: heldRecord names it, so Netherton's secure link takes over once the player ends the mission. The
  # signoff case proves endHeld() then opens that person-chat; here we show Netherton is the ending now armed.
  echo "armed ending: $(a2b_ev "return window.endingCheck.heldRecord();")"
  a2b_quit ;;
esac
