#!/bin/bash
# A2b R1 live proofs, finish pass (M2 thread, M3 toast hold, Call ended beat). Port 3024.
#   PC_PORT=3024 tools/phone_calls/routes/a2b_r1_finish.sh m2|m3|ended
export OUT=${OUT:-docs/agents/phone_calls/proofs/A2b_r1/live} NODE_PATH=$PWD/node_modules BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle
source "$(dirname "${BASH_SOURCE[0]}")/a2b_lib.sh"
LOGJS='window.__r1=[]; setInterval(()=>{ const r=window.phoneRinger, c=r&&r.current&&r.current(); const mg=window.MinigameFramework.currentMinigame; window.__r1.push({t:Math.round(performance.now()), st:c?c.npcId+":"+c.state:null, mg:mg?mg._sceneType:null, ca:r?r.callActive():null, barks:document.querySelectorAll(".npc-bark").length}); }, 100); return true;'
collapse() { a2b_ev 'const o=[]; let p=""; for (const e of window.__r1) { const k=[e.st,e.mg,"callActive="+e.ca,"barks="+e.barks].join(" | "); if (k!==p) { o.push((e.t/1000).toFixed(1)+"s "+k); p=k; } } return o;' | jq -r '.[]'; }
node_npc() { a2b_ev "const n=window.npcManager.getNPC('$1'); return {currentKnot:n.currentKnot, homeKnot:n.homeKnot, path:(n.storyState&&n.storyState.currentPath)||(n.story&&n.story.state&&n.story.state.currentPathString)||null};"; }
# 0 when timed_caller rings; 2 when another caller got there first (retry with a fresh game)
ring_timed() { for i in $(seq 1 70); do v=$(a2b_ev "const c=window.phoneRinger.current(); return c ? c.npcId+':'+c.state : null;" | tr -d '"'); echo "$v" >> $OUT/${LABEL}_ringseq.txt; [ "$v" = "timed_caller:ringing" ] && return 0; [ "$v" = "caller_basic:ringing" ] && a2b_decline >/dev/null; sleep 1; done; return 2; }
wait_ring() { for i in $(seq 1 ${2:-40}); do a2b_ev "const c=window.phoneRinger.current(); return !!c && c.npcId==='$1' && c.state==='ringing';" | grep -q true && return 0; sleep 1; done; return 1; }
case $1 in
r2m1)
  # R2 M1: decline caller_decline before the phone has ever been opened, then open its thread by hand
  LABEL0=r2m1_${HOW:-decline}; AUTOBRIEF=true a2b_open $LABEL0
  a2b_lever lever_decline
  # caller_basic's first ring (3 s after the briefing) can come first: decline that one, then caller_decline rings
  for i in $(seq 1 60); do v=$(a2b_ev "const c=window.phoneRinger.current(); return c ? c.npcId+':'+c.state : null;" | tr -d '"'); [ "$v" = "caller_decline:ringing" ] && break; [ "$v" = "caller_basic:ringing" ] && a2b_decline >/dev/null; sleep 1; done
  echo "ringing: $v"
  echo "knot while ringing:"; node_npc caller_decline | tee "$OUT/${LABEL}_node_ringing.json"; a2b_shot ringing
  if [ "${HOW:-decline}" = decline ]; then a2b_decline; sleep 3; else sleep 24; fi; a2b_status | cut -c1-700
  echo "knot after $HOW:"; node_npc caller_decline | tee "$OUT/${LABEL}_node_after.json"
  $S $GID '{"cmd":"openInventoryItem","item":"phone"}' >/dev/null; sleep 2; a2b_shot contacts
  a2b_click "Caller Decline"; sleep 2
  a2b_text | tee "$OUT/${LABEL}_thread.json" | cut -c1-500; a2b_shot thread
  echo "knot with thread open:"; node_npc caller_decline | tee "$OUT/${LABEL}_node_thread.json"; a2b_quit ;;
m2)
  # R3 m3: a timed opening ring rings out inside bootstrap, so the watcher goes into the page BEFORE bootstrap.
  # It clicks Decline 1.5 s into timed_caller's ring (HOW=decline) or leaves it to ring out, and logs the ring.
  for how in decline ringout; do
    W=/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2dd9046d-5103-4a95-9363-70f3aa5c1f4a/scratchpad/m2_watch_$how.js
    cat > $W <<JS
window.__tc = { ringAt: null, goneAt: null, declinedAt: null };
setInterval(() => {
  const c = window.phoneRinger && window.phoneRinger.current && window.phoneRinger.current();
  const t = Math.round(performance.now());
  const ringing = !!c && c.npcId === 'timed_caller' && c.state === 'ringing';
  if (ringing && window.__tc.ringAt === null) window.__tc.ringAt = t;
  if (ringing && '$how' === 'decline' && window.__tc.declinedAt === null && t - window.__tc.ringAt > 1500) {
    const b = document.querySelector('.incoming-call-decline'); if (b) { b.click(); window.__tc.declinedAt = t; }
  }
  if (!ringing && window.__tc.ringAt !== null && window.__tc.goneAt === null) window.__tc.goneAt = t;
}, 100);
return true;
JS
    PRE_EV=$W AUTOBRIEF=true a2b_open m2_$how --set skip_timed=false
    sleep $([ $how = decline ] && echo 6 || echo 30)
    echo "[$how] watcher:"; a2b_ev "return window.__tc;" | tee "$OUT/m2_${how}_watch.json"
    echo "[$how] ringer:"; a2b_status | cut -c1-200; echo "knot after:"; node_npc timed_caller | tee "$OUT/m2_${how}_node_after.json"
    # open the thread by hand the way a player does: the phone item in the inventory, then the contact
    $S $GID '{"cmd":"openInventoryItem","item":"phone"}' >/dev/null; sleep 2; a2b_shot contacts
    a2b_click "Timed Caller" ; sleep 2
    a2b_text | tee "$OUT/m2_${how}_thread.json" | cut -c1-500; a2b_shot thread
    echo "knot with thread open:"; node_npc timed_caller | tee "$OUT/m2_${how}_node_thread.json"
    a2b_quit
  done ;;
m3)
  AUTOBRIEF=true a2b_open m3; a2b_ev "$LOGJS" >/dev/null
  a2b_lever lever_basic_again caller_basic; wait_ring caller_basic 20; a2b_answer; sleep 3
  a2b_status | cut -c1-260
  # one in-page evaluation: record callActive at the instant of the emit, in the same tick
  a2b_ev "const ca = window.phoneRinger.callActive(); window.__emitAt = Math.round(performance.now()); window.__emitCallActive = ca; window.eventDispatcher.emit('send_text', {}); return {callActiveAtEmit: ca, mgAtEmit: window.MinigameFramework.currentMinigame && window.MinigameFramework.currentMinigame._sceneType};" | tee "$OUT/m3_emit.json"
  sleep 6
  echo "during call: barks=$(a2b_ev 'return document.querySelectorAll(".npc-bark").length;') callActive=$(a2b_ev 'return window.phoneRinger.callActive();')"; a2b_shot during_call
  a2b_ev 'window.__endAt=Math.round(performance.now()); const b=document.querySelector("#call-end-button, #minigame-close[title=\"End call\"]"); if(b){b.click(); return "clicked End call";} return "no End button";'; sleep 4
  echo "after End: barks=$(a2b_ev 'return document.querySelectorAll(".npc-bark").length;') callActive=$(a2b_ev 'return window.phoneRinger.callActive();')"; a2b_shot after_end
  a2b_ev 'return {emitAt:window.__emitAt, emitCallActive:window.__emitCallActive, endAt:window.__endAt};' | tee -a "$OUT/m3_emit.json"
  collapse | tee "$OUT/m3_timeline.txt"; a2b_quit ;;
ended)
  AUTOBRIEF=true a2b_open ended; a2b_lever lever_basic_again caller_basic; wait_ring caller_basic 20; a2b_answer; sleep 3
  a2b_ev 'const b=document.querySelector("#call-end-button"); if(!b) return "no end button"; b.click(); return "clicked End call";'
  a2b_shot end_beat_hangup
  a2b_ev 'return document.body.innerText.match(/Call ended[^\n]*/g);'
  sleep 3; a2b_ev 'return window.phoneRinger.callActive();'; a2b_quit ;;
ended_story|ended_exit)
  # R3 M1: the "Call ended" beat after a story end (choice 2) and after #exit_conversation (choice 3)
  CH=$([ $1 = ended_story ] && echo 2 || echo 3)
  AUTOBRIEF=true a2b_open r3_$1${HOLD:+_held}; a2b_lever lever_basic_again caller_basic; wait_ring caller_basic 20; a2b_answer; sleep 3
  a2b_ev 'window.__ce=[]; setInterval(()=>{ const m=window.MinigameFramework.currentMinigame; window.__ce.push({t:Math.round(performance.now()), mg:m?m._sceneType:null, ended:/CALL ENDED/i.test(document.body.innerText)}); }, 100); return true;' >/dev/null
  # HOLD=1: screenshot-only run; complete() is delayed 4 s in the page so the 0.9 s beat can be captured (timeline runs leave it unpatched)
  [ -n "$HOLD" ] && a2b_ev 'const m=window.MinigameFramework.currentMinigame; const c=m.complete.bind(m); m.complete=(...a)=>setTimeout(()=>c(...a),4000); return true;' >/dev/null
  a2b_choose $CH >/dev/null
  for i in $(seq 1 40); do a2b_ev 'return /CALL ENDED/i.test(document.body.innerText);' | grep -qx true && { [ -n "$HOLD" ] && sleep 1; a2b_ev 'const b=document.getElementById("call-status-bar"); return b && b.innerText;' | tee "$OUT/r3_${1}${HOLD:+_held}_statusbar.txt"; a2b_shot call_ended_beat; break; }; done
  sleep 4
  a2b_ev 'const o=[]; let p=""; for (const e of window.__ce) { const k=e.mg+" callEnded="+e.ended; if (k!==p) { o.push((e.t/1000).toFixed(1)+"s "+k); p=k; } } return o;' | tee "$OUT/r3_${1}_timeline.json"
  a2b_ev 'return window.phoneRinger.callActive();'; a2b_quit ;;
ended2)
  AUTOBRIEF=true a2b_open ended2; a2b_lever lever_basic_again caller_basic; wait_ring caller_basic 20; a2b_answer; sleep 3
  a2b_ev 'window.__ce=[]; setInterval(()=>{ const m=window.MinigameFramework.currentMinigame; window.__ce.push({t:Math.round(performance.now()), mg:m?m._sceneType:null, ended:/Call ended/.test(document.body.innerText)}); }, 100); return true;' >/dev/null
  a2b_choose 2 >/dev/null; a2b_shot storyend_screen
  sleep 4
  a2b_ev 'const o=[]; let p=""; for (const e of window.__ce) { const k=e.mg+" callEndedText="+e.ended; if (k!==p) { o.push((e.t/1000).toFixed(1)+"s "+k); p=k; } } return o;' | tee "$OUT/ended2_timeline.json"
  a2b_ev 'return window.phoneRinger.callActive();'; a2b_quit ;;
esac
