#!/bin/bash
# M5 R3 (post-sweep light round) live route on committed code. Real Patricia naming call through the Call
# button, bare reloads (no stateSync.sync() first, as F5), root flag set as a global with its change event.
#   PC_PORT=3025 docs/agents/phone_calls/proofs/PS_m05/route.sh <case>
# cases: rec_decline rec_reload root_slow bring_label   (row 31 and patricia use tools/phone_calls/routes/m05_live.sh)
export OUT=${OUT:-docs/agents/phone_calls/proofs/PS_m05}
source tools/phone_calls/routes/m10_lib.sh
eval "$(sed -n '/^LOGEV=/p;/^evs()/p;/^end_call()/p;/^call_up()/p;/^hdr_btn()/p;/^press_call()/p;/^banner()/p;/^wait_ring()/p;/^ringer_now()/p;/^emit()/p;/^opt_open()/p;/^clear_optionals()/p;/^task_state()/p;/^ALLF=/p' tools/phone_calls/routes/m05_live.sh)"
HEAD="--set patricia_phone_available=true --set found_medical_bills=true --set found_upload_schedule=true"
bare_reload() {
  $S $GID '{"cmd":"waitFor","kind":"condition","fn":"() => { setTimeout(() => location.assign(location.pathname + \"?skip_resume=1\"), 50); return true; }"}' >/dev/null
  sleep 8
  $S $GID '{"cmd":"bootstrap","tutorial":"decline","resume":"resume","autoBrief":true}' 120 >/dev/null
}
# watch_rings <secs>: count distinct ringing episodes (any npc) over the window
watch_rings() {
  local n=0 prev=none cur
  for i in $(seq 1 $1); do
    cur=$(a2b_ev "const c=window.phoneRinger.current(); return c && c.state==='ringing' ? c.npcId : 'none';" | tr -d '"')
    [ "$cur" != none ] && [ "$cur" != "$prev" ] && { n=$((n+1)); echo "  ring #$n at ${i}s: $cur banner=$(banner)"; }
    prev=$cur
    [ -n "$2" ] && [ "$cur" != none ] && { echo "$n"; return; }
    sleep 1
  done
  echo "rings in ${1}s: $n"
}
naming_call() {
  open_phone; open_thread patricia_phone; echo "patricia header=$(hdr_btn)"
  press_call >/dev/null; call_up 40; echo "patricia call: $(screen | jq -c '{bar,choices}')"
  for c in "know who it is" "David Torres" "Money" "upload schedule"; do press_when "$c" 60 || { echo "stuck at $c: $(screen | jq -c '{subs,choices}')"; }; done
  echo "after naming: torres_identified=$(glob torres_identified) $(screen | jq -c '{subs,choices}')"; a2b_shot named
  # let the call end on its own; press End only if it does not
  press_when "On my way" 30; wait_screen "!document.getElementById('call-end-button')" 30 || { echo "call still up, pressing End: $(screen | jq -c '{choices}')"; end_call; sleep 3; }
  a2b_ev "window.__closeT=performance.now(); return true;" >/dev/null
  echo "naming call closed; mg=$(mgc) recruiter_texted=$(glob recruiter_texted)"
}

case $1 in
rec_decline)
  m10_open $1 m05_insider_trading $HEAD; a2b_ev "$LOGEV" >/dev/null
  naming_call
  # close the phone so the ring lands in the world
  a2b_ev "window.MinigameFramework.currentMinigame && window.MinigameFramework.endMinigame && window.MinigameFramework.endMinigame(); return true;" >/dev/null
  wait_ring 25; echo "ring after close: +$(a2b_ev "return Math.round((performance.now()-window.__closeT)/100)/10;")s banner: $(banner) ringer=$(ringer_now)"; a2b_shot ringing
  a2b_decline >/dev/null; sleep 2; echo "after decline: ringer=$(ringer_now) recruiter_texted=$(glob recruiter_texted)"
  watch_rings 12
  open_phone; open_thread recruiter
  echo "recruiter thread: $(screen | jq -c '{header,thread}')"; a2b_shot thread_after_decline
  echo "rows=$(rows recruiter)"
  press_call >/dev/null; sleep 1; echo "dialling: $(screen | jq -c '{bar}')"; a2b_shot callback_dialling
  call_up 40; echo "callback call: $(screen | jq -c '{bar,subs,choices}') contacted=$(glob recruiter_contacted_player)"; a2b_shot callback_call
  tts_log | cut -c1-900; evs; a2b_quit ;;
rec_reload)
  m10_open $1 m05_insider_trading $HEAD; a2b_ev "$LOGEV" >/dev/null
  naming_call
  a2b_ev "window.MinigameFramework.currentMinigame && window.MinigameFramework.endMinigame && window.MinigameFramework.endMinigame(); return true;" >/dev/null
  sleep 3; echo "3 s after close, before reload: ringer=$(ringer_now) recruiter_texted=$(glob recruiter_texted)"
  bare_reload; a2b_ev "$LOGEV" >/dev/null
  echo "after reload: torres=$(glob torres_identified) recruiter_texted=$(glob recruiter_texted) ringer=$(ringer_now) rows=$(rows recruiter)"
  watch_rings 30; a2b_shot after_window
  echo "end: recruiter_texted=$(glob recruiter_texted) rows=$(rows recruiter) queue=$(a2b_ev 'return window.phoneRinger.queueLength();')"
  evs; a2b_quit ;;
root_slow)
  m10_open $1 m05_insider_trading --set torres_identified=true --set recruiter_texted=true; a2b_ev "$LOGEV" >/dev/null
  a2b_ev "const g=window.gameState.globalVariables; const o=g.flag4_submitted; g.flag4_submitted=true; window.eventDispatcher.emit('global_variable_changed:flag4_submitted',{name:'flag4_submitted',value:true,oldValue:o}); return true;" >/dev/null
  wait_ring 25; echo "banner: $(banner) architect_approval_confirmed=$(glob architect_approval_confirmed)"; a2b_shot ringing
  echo "leaving it to ring 40 s (untilAnswered)..."; sleep 40; echo "banner after 40s: $(banner) ringer=$(ringer_now)"; a2b_shot ringing_40s
  a2b_answer >/dev/null; call_up 40; echo "call: $(screen | jq -c '{bar,subs,choices}')"; a2b_shot call
  tts_log | cut -c1-500; evs; a2b_quit ;;
bring_label)
  # Twin rings her at load (Torres named, not yet rung); decline; then the real bring-in from the hub.
  m10_open $1 m05_insider_trading --set torres_identified=true --set final_choice=arrest $ALLF; a2b_ev "$LOGEV" >/dev/null
  wait_ring 20; echo "twin ring at load: $(banner)"; a2b_decline >/dev/null; sleep 2
  echo "after decline: recruiter_texted=$(glob recruiter_texted) contacted=$(glob recruiter_contacted_player) rows=$(rows recruiter)"
  echo "optional open: $(opt_open) -> cleared, still open: $(clear_optionals)"
  open_phone; open_thread agent_0x99_handler; echo "hub: $(screen | jq -c '{choices}' | head -c 400)"
  choose_text "Bring me in" >/dev/null; sleep 1; echo "dialling bar: $(screen | jq -c '{bar}')"; a2b_shot dialling
  call_up 40; echo "call bar: $(screen | jq -c '{bar}')"; a2b_shot call
  press_when "Bring me in"; echo "after Bring me in: $(screen | jq -c '{subs,choices}')"; a2b_shot confirm
  choose_text "On my way" >/dev/null; sleep 2; echo "overlay (expect null): $(ending_overlay)"
  gate wait_screen "!document.getElementById('call-end-button')" 40; sleep 4
  echo "after bring-in: mission_complete=$(glob mission_complete) mg=$(mgc) ringer=$(ringer_now)"; a2b_shot debrief
  watch_rings 15; echo "debrief later: mg=$(mgc) queue=$(a2b_ev 'return window.phoneRinger.queueLength();')"; a2b_shot debrief_later
  echo "HaX /tts: $(jq -c 'select((.npc_id // .npcId)=="agent_0x99_handler") | .text' $OUT/${LABEL}_tts.jsonl | tr '\n' ' ')"
  echo "recruiter /tts after load: $(jq -c 'select((.npc_id // .npcId)=="recruiter") | .text' $OUT/${LABEL}_tts.jsonl | tr '\n' ' ')"
  evs; a2b_quit ;;
captions)
  # HaX's caption on the root ring banner, the answered ring's call screen, and a call placed from her hub.
  m10_open $1 m05_insider_trading --set torres_identified=true --set recruiter_texted=true; a2b_ev "$LOGEV" >/dev/null
  cap() { a2b_ev "const c=document.getElementById('call-caption'); return c ? c.textContent : null;"; }
  a2b_ev "const g=window.gameState.globalVariables; const o=g.flag4_submitted; g.flag4_submitted=true; window.eventDispatcher.emit('global_variable_changed:flag4_submitted',{name:'flag4_submitted',value:true,oldValue:o}); return true;" >/dev/null
  wait_ring 25; echo "ring banner: $(banner)"; a2b_shot ring_banner
  a2b_answer >/dev/null; call_up 40; echo "answered ring caption: $(cap)"; a2b_shot ring_call
  end_call >/dev/null; sleep 4; a2b_ev "window.MinigameFramework.currentMinigame && window.MinigameFramework.endMinigame(); return true;" >/dev/null; sleep 2
  open_phone; open_thread agent_0x99_handler; echo "hub: $(screen | jq -c '{choices}' | head -c 400)"
  choose_text "Where do I stand" >/dev/null; sleep 1; echo "hub dialling caption: $(cap) $(screen | jq -c '{bar}')"; a2b_shot hub_dialling
  call_up 40; echo "hub call caption: $(cap) $(screen | jq -c '{bar}')"; a2b_shot hub_call
  evs; a2b_quit ;;
row31_probe)
  # m05_live.sh root_row31, plus: what the queued offer is, the hub call's caption, and what rings once the call ends.
  m10_open $1 m05_insider_trading --set torres_identified=true --set architect_approval_confirmed=true $ALLF; a2b_ev "$LOGEV" >/dev/null
  cap() { a2b_ev "const c=document.getElementById('call-caption'); return c ? c.textContent : null;"; }
  emit 'global_variable_changed:flag4_submitted' '{"name":"flag4_submitted","value":true}'
  open_phone; open_thread agent_0x99_handler
  choose_text "Architect signed off" >/dev/null; sleep 1; echo "dialling caption: $(cap) $(screen | jq -c '{bar}')"
  call_up 40; echo "connected caption: $(cap) ringer=$(ringer_now) queue=$(a2b_ev 'return window.phoneRinger.queueLength();') stateOf(HaX)=$(a2b_ev "return window.phoneRinger.stateOf('agent_0x99_handler');") stateOf(recruiter)=$(a2b_ev "return window.phoneRinger.stateOf('recruiter');") recruiter_texted=$(glob recruiter_texted)"
  a2b_shot call
  end_call >/dev/null; sleep 3; echo "after End: ringer=$(ringer_now) queue=$(a2b_ev 'return window.phoneRinger.queueLength();')"
  watch_rings 25
  echo "rows HaX=$(rows agent_0x99_handler) rows recruiter=$(rows recruiter)"; a2b_shot after
  evs; a2b_quit ;;
esac
