#!/bin/bash
# Engine sweep review R1 live proofs (committed code). Keyless server on :3027 only.
#   PC_PORT=3027 docs/agents/phone_calls/proofs/ENGINE_SWEEP_R1/r1_live.sh <case>
# conversation_closed:* emissions are counted by wrapping eventDispatcher.emit after bootstrap.
export PC_PORT=${PC_PORT:?set PC_PORT}
export OUT=${OUT:-docs/agents/phone_calls/proofs/ENGINE_SWEEP_R1}
source "$(dirname "${BASH_SOURCE[0]}")/../../../../../tools/phone_calls/routes/m10_lib.sh"
COUNT="window.__cc={}; window.__ccLog=[]; const d=window.eventDispatcher; if(!d.__wrapped){ const o=d.emit.bind(d); d.emit=function(n,x){ if(typeof n==='string'&&n.startsWith('conversation_closed:')){ window.__cc[n]=(window.__cc[n]||0)+1; window.__ccLog.push(n+'@'+Math.round(performance.now()/100)/10); } return o(n,x); }; d.__wrapped=true; } return true;"
cc() { a2b_ev "return {counts: window.__cc, log: window.__ccLog};"; }
calm_guard() { a2b_ev "window.gameState.globalVariables.guard_off = true; const m=window.MinigameFramework.currentMinigame; if (m && m._sceneType==='person-chat') window.MinigameFramework.endMinigame(false); return 'guard calm';" >/dev/null; }
wait_ring() { for i in $(seq 1 ${2:-60}); do a2b_ev "const c=window.phoneRinger.current(); return !!c && c.npcId==='$1' && c.state==='ringing';" | grep -qx true && return 0; sleep 1; done; return 1; }
clear_basic() { calm_guard; wait_ring caller_basic 40 && a2b_decline >/dev/null; sleep 1; }
panel_answer() { a2b_ev "const b=document.querySelector('.phone-incoming-call-answer, .incoming-call-answer'); if(!b) return 'no answer'; b.click(); return 'answered';"; }
end_call() { a2b_ev "const b=document.getElementById('call-end-button'); if(!b) return 'no End'; b.click(); return 'End pressed';"; }
open_tpc() { AUTOBRIEF=true a2b_open "$@"; gate clear_basic; a2b_ev "$COUNT" >/dev/null; }
case $1 in
tpc_own_hit|tpc_other_hit|tpc_own_reopen)
  # item 1: a call answered over a thread; with a hit the phone is not reopened (dropDisplaced runs)
  open_tpc $1
  THREAD=caller_thread; [ $1 = tpc_other_hit ] && THREAD=texter
  open_phone; open_thread $THREAD; echo "thread open: $(mgc)"
  a2b_ev "window.eventDispatcher.emit('ring_thread', {}); return true;" >/dev/null
  gate wait_ring caller_thread 25; echo "ringing; counts=$(cc | jq -c .counts)"
  panel_answer; sleep 3; gate wait_screen "$IN_CALL" 20; echo "call open; counts=$(cc | jq -c .counts)"
  [ $1 != tpc_own_reopen ] && { a2b_ev "window.playerHealth.damage(5); return 'hit';"; sleep 0.5; }
  end_call; sleep 4; echo "after End: mg=$(mgc) counts=$(cc | jq -c .counts)"; a2b_shot after_end
  sleep 8; echo "12 s after End: mg=$(mgc) $(cc)"
  if [ $1 = tpc_own_reopen ]; then
    a2b_ev "const m=window.MinigameFramework.currentMinigame; if(m) m.complete(false); return 'phone closed';"; sleep 1.5
    echo "after the real close of the reopened thread: $(cc)"
  fi
  cc > "$OUT/${1}_counts.json"; a2b_quit ;;
tpc_refused_dial)
  # item 4: the Call button is pressed while the dial is refused (knockout stub: openBlocked) but the entry still applies
  open_tpc $1; open_phone; open_thread desk_contact
  echo "header: $(a2b_ev "const b=document.querySelector('.call-button'); return b?b.innerText.trim():null;")"
  a2b_ev "window.__realKO=window.playerIsKnockedOut; window.playerIsKnockedOut=()=>true; return 'KO stub on';"
  a2b_ev "window.__toasts=[]; const o=window.showNotification; window.showNotification=function(t,...r){window.__toasts.push(t); return o&&o.call(this,t,...r);}; return true;" >/dev/null
  a2b_ev "const b=document.querySelector('.call-button'); if(!b) return 'no call button'; b.click(); return 'Call pressed';"; sleep 0.6
  echo "after press: mg=$(mgc) ringer=$(a2b_ev "const c=window.phoneRinger.current(); return c?c.state:null;") toasts=$(a2b_ev "return window.__toasts;") notif=$(a2b_ev "return [...document.querySelectorAll('.phone-notification, .notification, .toast')].map(e=>e.innerText.trim()).filter(Boolean);") header=$(a2b_ev "const b=document.querySelector('.call-button'); return b?b.innerText.trim():null;")"
  a2b_shot toast
  a2b_ev "window.playerIsKnockedOut=window.__realKO; return 'KO stub off';"
  a2b_ev "const b=document.querySelector('.call-button'); if(!b) return 'no call button'; b.click(); return 'Call pressed';"; sleep 3
  echo "after second press (no stub): mg=$(mgc) ringer=$(a2b_ev "const c=window.phoneRinger.current(); return c?c.state+' '+c.npcId:null;") call=$(a2b_ev "return $IN_CALL;")"
  a2b_quit ;;
m04_close_stub)
  # item 2 on m04: Robert Vance's home stub "(Close.)" posts no bubble
  m10_open $1 m04_critical_failure --set vance_phone_available=true; a2b_ev "$COUNT" >/dev/null
  close_brief() { for i in 1 2 3 4 5 6; do r=$(a2b_ev "const m=window.MinigameFramework.currentMinigame; if(!m) return 'none'; const b=[...document.querySelectorAll('button')].find(x=>/End Conversation/.test(x.innerText)); if(b){b.click(); return 'closed briefing';} try{m.complete(false);}catch(e){} return 'closed '+m.constructor.name;"); echo "$r" | grep -q none && break; sleep 3; done; }
  close_brief
  for i in $(seq 1 10); do open_phone; a2b_ev "return !!document.querySelector('.contact-item[data-npc-id=\"robert_vance_phone\"]');" | grep -qx true && break; close_brief; sleep 2; done
  open_thread robert_vance_phone; echo "thread: $(screen | jq -c '{choices,thread}')"; a2b_shot before
  BEFORE=$(a2b_ev "return document.querySelectorAll('.message-bubble.player, .message.player, .player-message').length;")
  HB=$(a2b_ev "return (window.npcManager.getConversationHistory('robert_vance_phone')||[]).filter(m=>m.sender==='player'||m.type==='player').length;")
  choose_text "(Close.)"; sleep 2
  echo "after (Close.): mg=$(mgc) player bubbles before=$BEFORE after=$(a2b_ev "return document.querySelectorAll('.message-bubble.player, .message.player, .player-message').length;") history player msgs before=$HB after=$(a2b_ev "return (window.npcManager.getConversationHistory('robert_vance_phone')||[]).filter(m=>m.sender==='player'||m.type==='player').length;") history=$(a2b_ev "return (window.npcManager.getConversationHistory('robert_vance_phone')||[]).map(m=>(m.sender||m.type)+':'+String(m.text||'').slice(0,40));") $(cc)"
  a2b_shot after
  # the thread again: no "(Close.)" bubble in it
  open_thread robert_vance_phone 2>/dev/null; echo "reopened thread: $(screen | jq -c '{thread}')"; a2b_shot reopened
  a2b_quit ;;
m04_dial_own|m04_esd_ringing)
  # item 1 on m04: HaX's dial ring answered over her own thread, End; item 8 gap: esd_authorized goes true while it rings
  m10_open $1 m04_critical_failure --start-room battery_hall_1 --set vance_met=true; a2b_ev "$COUNT" >/dev/null
  $S $GID '{"cmd":"moveToNear","id":"analog_thermometer"}' 40 >/dev/null
  $S $GID '{"cmd":"interact","id":"analog_thermometer"}' 40 >/dev/null; sleep 2
  echo "dial read: anomaly_detected=$(glob anomaly_detected) esd=$(glob esd_authorized)"
  a2b_ev "const b=document.querySelector('.minigame-close-button, .close-button'); if(b){b.click(); return 'closed popup';} return 'no popup';"
  if [ $1 = m04_dial_own ]; then
    open_phone; open_thread agent_0x99; echo "thread: $(mgc)"
    gate wait_ring agent_0x99 40; echo "ringing in phone: $(a2b_ev "const p=document.querySelector('.phone-incoming-call'); return p?p.innerText.replace(/\n+/g,' | '):null;")"
    panel_answer; gate wait_screen "$IN_CALL && document.querySelectorAll('.choice-button').length>0" 40
    echo "call: $(screen | jq -c '{subs,choices}') counts=$(cc | jq -c .counts)"; a2b_shot call
    end_call; sleep 4; echo "after End: mg=$(mgc) counts=$(cc | jq -c .counts)"; sleep 6; echo "10 s after End: mg=$(mgc) $(cc)"
    a2b_ev "const m=window.MinigameFramework.currentMinigame; if(m) m.complete(false); return 'phone closed';"; sleep 1.5
    echo "after the real close: $(cc)"
  else
    gate wait_ring agent_0x99 40; echo "ringing: $(a2b_ev "const c=window.phoneRinger.current(); return c&&{state:c.state,knot:c.knot,ringCondition:c.ringCondition||null};")"
    a2b_ev "window.gameState.globalVariables.esd_authorized = true; return 'esd_authorized set true';"
    for t in 2 4 6; do sleep 2; echo "t+${t}s: ringer=$(a2b_ev "const c=window.phoneRinger.current(); return c?c.state:null;") holds=$(a2b_ev "return window.npcManager.ringConditionHolds('value === true && globalVars.esd_authorized !== true');")"; done
    a2b_shot esd_ringing
  fi
  a2b_quit ;;
m01_tut_idle)
  # item 9 on m01: accept the tutorial, leave the step panel idle; the HaX ring comes at about 20 s, clear of SKIP TUTORIAL
  LABEL=$1; mkdir -p "$OUT"
  GID=$(tools/phone_calls/newgame.sh m01_first_contact --unlock main_office_area | sed -n 's/^GAME_ID=//p'); echo "$GID" > "$OUT/${LABEL}_game_id.txt"
  tools/phone_calls/session-start.sh --url "http://127.0.0.1:$PC_PORT/break_escape/games/$GID" --headless true --log "$OUT/${LABEL}_session.jsonl" --tts-log "$OUT/${LABEL}_tts.jsonl" 2>&1 | tail -1
  $S $GID '{"cmd":"bootstrap","tutorial":"accept","resume":"new","autoBrief":true}' 120 | cut -c1-200
  tut() { a2b_ev "const t=window.getTutorialManager(); return {active:t.active, prompt:t.promptOpen, step:t.currentStep, progress:(document.querySelector('.tutorial-progress')||{}).innerText||null};"; }
  bn() { a2b_ev "const b=document.querySelector('.incoming-call'); const c=window.phoneRinger.current(); return {banner: !!b, ringer: c?c.state:null, queued: window.phoneRinger.queueLength(), under: document.getElementById('phone-ring-layer').classList.contains('under-tutorial'), paused: !!window.phoneRinger.isPaused && window.phoneRinger.isPaused()};"; }
  sleep 3; echo "after bootstrap: $(tut) mg=$(mgc)"
  $S $GID '{"cmd":"enter","room":"main_office_area"}' 60 | jq -c '{ok,reason}'; T0=$(date +%s.%N); echo "entered main_office_area, t=0; $(tut)"
  RANG=""
  for i in $(seq 1 45); do
    sleep 1; B=$(bn); TS=$(echo "$(date +%s.%N) - $T0" | bc | cut -c1-5)
    echo "t=${TS}s tut=$(tut | jq -c '{active,step}') ring=$(echo "$B" | jq -c .)"
    echo "$B" | jq -e '.banner' >/dev/null && { RANG=$TS; break; }
  done
  echo "RING AT t=${RANG}s after entering"
  echo "geometry: $(a2b_ev "const r=e=>{if(!e)return null; const b=e.getBoundingClientRect(); return {x:Math.round(b.left),y:Math.round(b.top),w:Math.round(b.width),h:Math.round(b.height)};}; const ov=(a,b)=>!!a&&!!b&&!(a.x+a.w<=b.x||b.x+b.w<=a.x||a.y+a.h<=b.y||b.y+b.h<=a.y); const ban=r(document.querySelector('.incoming-call')); const skip=r(document.querySelector('.tutorial-skip')); const prog=r(document.querySelector('.tutorial-progress')); const panel=r(document.querySelector('.tutorial-panel')); const nxt=r(document.querySelector('.tutorial-next')); return {banner:ban, skip, progress:prog, panel, next:nxt, overlapsSkip:ov(ban,skip), overlapsProgress:ov(ban,prog), overlapsPanel:ov(ban,panel), overlapsContinue: nxt&&nxt.w?ov(ban,nxt):null, skipVisible: !!document.querySelector('.tutorial-skip') && document.querySelector('.tutorial-skip').offsetParent!==null};")"
  a2b_shot ring_over_tutorial
  a2b_ev "const b=document.querySelector('.tutorial-skip'); return b ? (document.elementFromPoint(b.getBoundingClientRect().left+5,b.getBoundingClientRect().top+5)===b ? 'SKIP is topmost at its corner' : 'SKIP covered by '+document.elementFromPoint(b.getBoundingClientRect().left+5,b.getBoundingClientRect().top+5).className) : 'no skip';"
  a2b_quit ;;
m07_taunt|m07_signoff)
  # item 10 on m07 (terminal look): a taunt's last line stays up for the read beat; the forced sign-off still closes itself;
  # the next taunt is offered during the beat and must ring once the beat is over.
  source tools/phone_calls/routes/m6_live.sh __none__ 2>/dev/null
  BEATJS=docs/agents/phone_calls/proofs/ENGINE_SWEEP_R1/beat_probe.js
  beat() { a2b_ev "return window.__beat;"; }
  if [ $1 = m07_taunt ]; then
    m10_open $1 $SC $COUNTDOWN; sleep 1; tools/phone_calls/ev.sh $GID $BEATJS >/dev/null
    enter_ops; wait_banner 25 && echo "T-30 banner: $(ringer)"; a2b_answer >/dev/null; wait_call 15; sleep 2; echo "T-30 call: $(tscreen)"
    # walk it; the moment the beat starts, offer T-20 (its ring must wait for the close, not be lost)
    for i in $(seq 1 40); do
      B=$(beat | jq -r '.[0].beatAt // empty'); [ -n "$B" ] && break
      n=$(a2b_ev "return document.querySelectorAll('.choice-button').length;"); [ "$n" != "0" ] && [ -n "$n" ] && a2b_ev "const b=document.querySelector('.choice-button'); if(b)b.click(); return 'c';" >/dev/null
      sleep 1
    done
    echo "beat started: $(beat | jq -c '.[0] | {beatAt,clipPlayingAtBeat,lastLineAtBeat}')"; sleep 1; a2b_shot during_beat; echo "1 s into beat: mg=$(mgc) last=$(tscreen | jq -c '.lines[-1]')"
    fire architect_t20_played; echo "T-20 offered during the beat: $(ringer)"
    for i in $(seq 1 12); do [ "$(mgc)" = "null" ] && break; sleep 0.5; done; echo "closed: mg=$(mgc)"
    wait_banner 15 && echo "T-20 banner after close: $(ringer)" || echo "T-20 NO BANNER: $(ringer)"
    echo "records: $(beat)"; beat > "$OUT/${LABEL}_beat.json"
    echo "architect /tts: $(arch_tts)"; jq -c '{status, text: (.text|tostring|.[0:50])}' "$OUT/${LABEL}_tts.jsonl" | tail -5
  else
    m10_open $1 $SC $COUNTDOWN $FLAGS; open_phone; sleep 1; tools/phone_calls/ev.sh $GID $BEATJS >/dev/null
    a2b_ev "window.eventDispatcher.emit('minigame_completed',{}); return true;" >/dev/null; sleep 3
    echo "ringer: $(ringer)"; wait_call 15; echo "sign_off: $(tscreen)"
    drive_taunt
    for i in $(seq 1 20); do [ "$(mgc)" = "null" ] && break; sleep 0.5; done
    echo "closed itself: mg=$(mgc) signoff_done=$(glob architect_signoff_done)"; a2b_shot after_signoff
    echo "records: $(beat)"; beat > "$OUT/${LABEL}_beat.json"
  fi
  a2b_quit ;;
m07_in_beat|m07_back)
  # m07_in_beat: T-20 is offered from inside the page the instant T-30's read beat starts; it must ring after the close.
  # m07_back: the player hangs up a taunt early with the back arrow; how long does the dead thread stay up?
  source tools/phone_calls/routes/m6_live.sh __none__ 2>/dev/null
  beat() { a2b_ev "return window.__beat;"; }
  m10_open $1 $SC $COUNTDOWN; sleep 1; tools/phone_calls/ev.sh $GID docs/agents/phone_calls/proofs/ENGINE_SWEEP_R1/beat_probe.js >/dev/null
  [ $1 = m07_in_beat ] && a2b_ev "window.__onBeat=(rec)=>{ if(rec.npc!=='the_architect'||window.__fired) return; window.__fired=true; window.gameState.globalVariables.architect_t20_played=true; window.eventDispatcher.emit('global_variable_changed:architect_t20_played',{value:true}); rec.offeredInBeatAt=Math.round(performance.now()); }; return true;" >/dev/null
  enter_ops; wait_banner 25; a2b_answer >/dev/null; wait_call 15; sleep 3
  if [ $1 = m07_back ]; then
    a2b_ev "window.__backAt=Math.round(performance.now()); const b=document.getElementById('back-button'); if(!b) return 'no back'; b.click(); return 'back clicked';"
    sleep 1; a2b_shot after_back_1s; sleep 4
    echo "back at $(a2b_ev "return window.__backAt;"); records: $(beat | jq -c '[.[] | {beatAt,completeAt,goneAt}]') rows: $(rows $AID)"
  else
    drive_taunt; sleep 1
    for i in $(seq 1 15); do a2b_ev "return !!document.querySelector('.incoming-call');" | grep -qx true && break; sleep 1; done
    echo "records: $(beat | jq -c '[.[] | {npc,beatAt,offeredInBeatAt,completeAt,goneAt,nextRingAt}]')"; echo "ringer now: $(ringer)"
  fi
  beat > "$OUT/${LABEL}_beat.json"; a2b_quit ;;
m07_theme)
  # item 11 decision: device list -> device look; tap the Architect in that session -> stays device look;
  # a phone opened directly on his contact (the bark/notification path, barkSystem.openPhoneChat) -> terminal; his call -> terminal.
  source tools/phone_calls/routes/m6_live.sh __none__ 2>/dev/null
  look() { a2b_ev "const m=window.MinigameFramework.currentMinigame; const c=document.querySelector('.phone-messages-container, .messages-container'); const root=document.querySelector('.phone-chat-minigame, .minigame-container'); return {mg: m?m.constructor.name:null, paramsTheme: m&&m.params?m.params.theme||null:null, appTheme: m?m.appTheme||null:null, terminalEls: document.querySelectorAll('[class*=terminal]').length, firstContact: [...document.querySelectorAll('.contact-item')].map(e=>e.dataset.npcId)[0]||null, contacts: document.querySelectorAll('.contact-item').length};"; }
  m10_open $1 $SC $COUNTDOWN; sleep 1
  open_phone; echo "inventory phone, contact list: $(look)"; a2b_shot list
  open_thread $AID; echo "tapped the Architect in that session: $(look)"; a2b_shot tapped
  a2b_ev "const m=window.MinigameFramework.currentMinigame; if(m) m.complete(false); return 'closed';" >/dev/null; sleep 1.5
  a2b_ev "window.barkSystem.openPhoneChat({npcId:'$AID'}); return 'opened via barkSystem.openPhoneChat';"; sleep 2
  echo "opened directly on his contact: $(look)"; a2b_shot direct
  a2b_ev "const m=window.MinigameFramework.currentMinigame; if(m) m.complete(false); return 'closed';" >/dev/null; sleep 1.5
  enter_ops; wait_banner 25; a2b_answer >/dev/null; wait_call 15; sleep 2; echo "his call: $(look)"; a2b_shot call
  a2b_quit ;;
esac
