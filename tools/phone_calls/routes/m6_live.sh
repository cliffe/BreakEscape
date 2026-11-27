#!/bin/bash
# M6 live proofs: m07 Architect withheld voiced taunts + voicemails, sign-off, seattle, HaX bring-in (plan 8, M6).
#   PC_PORT=3028 tools/phone_calls/routes/m6_live.sh <replay|replace|decline_vm|later_first|vm_play|back_row|reload|signoff|bring|bring_notyet|seattle>
# The ring mappings react to events; we fire the real events the countdown timers would (global_variable_changed:architect_tXX_played,
# room_entered:operations_floor, countdown_expired) instead of waiting the real minutes. grid_saved stays false so taunts fire.
export OUT=${OUT:-docs/agents/phone_calls/proofs/M6} NODE_PATH=$PWD/node_modules
source "$(dirname "${BASH_SOURCE[0]}")/m10_lib.sh"
# Terminal-look taunt calls never draw #call-end-button (phone-call-ui.js only draws the call
# screen off the terminal look), so m10_lib's #call-end-button IN_CALL times out for the Architect
# and drive_taunt leaves on its first check without ever clicking a reply. Read the ringer instead:
# callActive() is true from the moment the ringer opens a call until its minigame ends (R1 M1).
IN_CALL="(window.phoneRinger&&window.phoneRinger.callActive&&window.phoneRinger.callActive())||!!document.getElementById('call-end-button')"
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
# Walk a connected terminal-look call the way a player does: as each reply set appears, click the first
# choice, until the story reaches #exit_conversation and the call ends on its own (IN_CALL false). The budget
# (~60 s) covers the longest taunt's typed narration before its choice; it returns the moment the call ends.
drive_taunt() { for i in $(seq 1 30); do a2b_ev "return $IN_CALL;" | grep -qx true || return 0; n=$(a2b_ev "return document.querySelectorAll('.choice-button').length;"); if [ "$n" != "0" ] && [ "$n" != "null" ] && [ -n "$n" ]; then a2b_ev "const b=document.querySelector('.choice-button'); if(b)b.click(); return 'c';" >/dev/null; fi; sleep 2; done; }
# Terminal-look calls draw no call-status bar/subtitles (phone-call-ui.js), so read the typed lines and reply buttons directly.
tscreen() { a2b_ev "const l=[...document.querySelectorAll('.message-text')].map(m=>m.innerText.trim()).filter(Boolean).slice(-2); const c=[...document.querySelectorAll('.choice-button')].map(b=>b.innerText.trim()); return {lines:l, choices:c};"; }
COUNTDOWN="--set briefing_played=true --set team_assigned=true --set team_assignment=fracture --set delegation_registered=true --set inside_reached=true"
FLAGS="--set briefing_played=true --set grid_saved=true --set flag1_submitted=true --set flag2_submitted=true --set flag3_submitted=true --set flag4_submitted=true"
arch_tts() { jq -c 'select((.npc_id // .npcId)=="the_architect") | .text' "$OUT/${LABEL}_tts.jsonl" 2>/dev/null | tr '\n' ' '; }
hax_tts() { jq -c 'select((.npc_id // .npcId)=="agent_0x99") | .text' "$OUT/${LABEL}_tts.jsonl" 2>/dev/null | tr '\n' ' '; }

case $1 in
replay)  # T-30..T-1 in order, answering each and walking the reply choices to #exit_conversation the way a
         # player would (drive_taunt). A taunt's own end -- the player answers, he hangs up -- leaves one
         # "Call: No caller ID" row, closes the phone and frees the ringer, so the next taunt rings. (The back
         # arrow is the player's early cut, proved separately in back_row; it is not a taunt's normal end.)
  m10_open replay $SC $COUNTDOWN; sleep 1
  rep_step() { # $1 label
    wait_banner 20 && echo "$1 banner: $(ringer)" || { echo "$1 NO BANNER: $(ringer)"; return 1; }
    [ "$1" = T-30 ] && a2b_shot t30_banner
    a2b_answer >/dev/null; wait_call 15; sleep 2
    echo "$1 call: $(tscreen)"; a2b_shot ${1}_call
    drive_taunt; sleep 2
    echo "$1 ended: mg=$(mgc) ringer=$(ringer)"; echo "$1 rows: $(rows $AID)"
  }
  echo "T-30: enter ops"; enter_ops; rep_step T-30
  echo "fire architect_t20_played"; fire architect_t20_played; rep_step T-20
  echo "fire architect_t10_played"; fire architect_t10_played; rep_step T-10
  echo "fire architect_t5_played"; fire architect_t5_played; rep_step T-5
  echo "fire architect_t1_played"; fire architect_t1_played; rep_step T-1
  echo "rows after T-1: $(rows $AID)"; echo "architect /tts: $(arch_tts)"; a2b_quit ;;

replace)  # T-5 then T-1 queued behind a real person-chat (ray_hollis); only T-1 rings on close.
  # R1 m1: the old route held HaX's PHONE thread, which is a phone-chat, so the taunt rang INSIDE the
  # phone (state: ringing) rather than queuing. A3 holds the ringer behind a conversation, so hold an
  # in-person chat instead. The phone stays closed throughout.
  m10_open replace $SC $COUNTDOWN; sleep 1
  echo "open ray_hollis person-chat to hold the ringer"
  a2b_ev "window.eventDispatcher.emit('player_spotted:ray_hollis',{npcId:'ray_hollis'}); return true;" >/dev/null
  for i in $(seq 1 15); do a2b_ev "const m=window.MinigameFramework.currentMinigame; return !!m&&m.constructor.name==='PersonChatMinigame';" | grep -qx true && break; sleep 1; done
  echo "person-chat open: $(mgc)"
  echo "fire T-5 then T-1 while the person-chat is open"; fire architect_t5_played; sleep 1; fire architect_t1_played; sleep 1
  echo "ringer while held (T-1 should have replaced the queued T-5): $(ringer)"
  # close the person-chat -> the queued call rings; must be T-1 (taunt_t1), not T-5
  a2b_ev "const m=window.MinigameFramework.currentMinigame; if(m) window.MinigameFramework.endMinigame(false); return 'closed';" >/dev/null; sleep 2
  wait_banner 20 && echo "ringing after close (should be taunt_t1): $(ringer)"; a2b_shot ringing_after_close
  a2b_answer >/dev/null; wait_call 15; echo "opened call knot: $(ringer) call=$(tscreen)"; a2b_shot opened
  drive_taunt; sleep 2; echo "thread rows after (one Call only): $(rows $AID)"; a2b_quit ;;

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

signoff)  # the forced sign-off auto-answers, is walked to its own #exit_conversation (drive_taunt) and closes
  # itself (disableClose). No debrief_requested preset: all_in needs it, so the debrief must NOT open on the
  # sign-off's close -- it waits for the bring-in (proved in `bring`). architect_signoff_done is set at the top.
  m10_open signoff $SC $COUNTDOWN $FLAGS; open_phone; sleep 1
  echo "console close with grid saved, no signoff yet"; a2b_ev "window.eventDispatcher.emit('minigame_completed',{}); return true;" >/dev/null; sleep 3
  echo "ringer (should be sign_off forced, NOT debrief): $(ringer)"; echo "debrief open? mg=$(mgc) start_debrief=$(glob start_debrief_cutscene)"; a2b_shot after_console
  wait_call 15; echo "sign_off call: $(tscreen)"; a2b_shot signoff_call
  drive_taunt
  # The forced sign-off ends on its own #exit_conversation; the terminal look holds the last line for the
  # TERMINAL_CALL_END_READ_MS (2600 ms) read beat, then closes itself. Wait past the beat before reading mg.
  for i in $(seq 1 10); do [ "$(mgc)" = "null" ] && break; sleep 1; done
  echo "sign_off walked to its end -- it closed itself (null = no force-close needed): mg=$(mgc)"; a2b_shot after_signoff
  echo "architect_signoff_done=$(glob architect_signoff_done) debrief_requested=$(glob debrief_requested) start_debrief=$(glob start_debrief_cutscene)"
  echo "held ending (unarmed until the bring-in sets debrief_requested): $(a2b_ev "return window.endingCheck.heldRecord();")"
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
  # The hand-off set debrief_requested. With all four flags in, the closing_debrief (Netherton) endingCheck
  # trigger is now the armed ending: heldRecord names it, so "End the mission" opens Netherton's secure link
  # (endHeld() -> person-chat, proved unchanged by M6 in the reviewer's real-order run and the prior 2102 proof).
  # The not-yet branch leaves it unarmed (null): the debrief waits for the last flag, as HaX says.
  echo "armed ending: $(a2b_ev "return window.endingCheck.heldRecord();")"
  a2b_quit ;;

seattle)  # post-countdown: seattle_call replaces a ringing T-1 and opens withheld (M8: replaces the old bark)
  m10_open seattle $SC $COUNTDOWN; sleep 1
  echo "fire T-1, let it ring"; fire architect_t1_played; wait_banner 20 && echo "T-1 banner: $(ringer)"
  echo "fire countdown_expired -> seattle_call replaces the ringing T-1"; fire countdown_expired; sleep 2
  echo "ringer (should be seattle_call): $(ringer)"; a2b_shot seattle_banner
  a2b_answer >/dev/null; wait_call 15; echo "seattle call: $(tscreen)"; a2b_shot seattle_call
  drive_taunt; sleep 2; echo "seattle ended: mg=$(mgc) rows=$(rows $AID)"
  echo "architect /tts: $(arch_tts)"; a2b_quit ;;
esac
