#!/bin/bash
# A2b R1 live proofs on test_phone_calls (:3024): M1 (brief held in the answer gap), M2 (decline / ring-out then the thread),
# M3 (a text sent during a connected call toasts only after End). Source of the 100 ms in-page log: __r1.
#   PC_PORT=3024 tools/phone_calls/routes/a2b_r1_live.sh m1|m2|m3
export OUT=${OUT:-docs/agents/phone_calls/proofs/A2b_r1/live} NODE_PATH=$PWD/node_modules BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle
source "$(dirname "${BASH_SOURCE[0]}")/a2b_lib.sh"
LOGJS='window.__r1=[]; setInterval(()=>{ const r=window.phoneRinger, c=r&&r.current&&r.current(); const mg=window.MinigameFramework.currentMinigame; window.__r1.push({t:Math.round(performance.now()), st:c?c.npcId+':'+c.state+(c.opening?'*':''):null, mg:mg?mg._sceneType:null, brief:/Mission Brief/.test(document.body.innerText), barks:document.querySelectorAll(".npc-bark").length}); }, 100); return true;'
collapse() { a2b_ev 'const o=[]; let p=""; for (const e of window.__r1) { const k=[e.st,e.mg,e.brief,e.barks].join("|"); if (k!==p) { o.push((e.t/1000).toFixed(1)+"s "+k); p=k; } } return o;' | jq -r '.[]'; }
node_npc() { a2b_ev "const n=window.npcManager.getNPC('$1'); return {currentKnot:n.currentKnot, homeKnot:n.homeKnot};"; }
wait_ring() { for i in $(seq 1 ${2:-60}); do a2b_ev "const c=window.phoneRinger.current(); return !!c && c.npcId==='$1' && c.state==='ringing';" | grep -qx true && return 0; sleep 1; done; return 1; }
# the timed caller rings first when it was offered during the briefing; if another call rings first, end it and wait on
ring_timed() { for i in $(seq 1 90); do a2b_ev "const c=window.phoneRinger.current(); return c ? c.npcId+':'+c.state : null;" | tr -d '"' | { read v; echo "$v" >> $OUT/${LABEL}_ringseq.txt; [ "$v" = "timed_caller:ringing" ]; } && return 0; sleep 1; done; return 1; }
case $1 in
m1)
  AUTOBRIEF=true a2b_open m1 --set skip_timed=false; a2b_ev "$LOGJS" >/dev/null
  ring_timed && echo "timed_caller ringing after ${i}s"; uniq $OUT/${LABEL}_ringseq.txt; a2b_shot ringing
  a2b_ev "document.querySelector('.incoming-call-answer').click(); return 'answer';"; sleep 4
  a2b_shot connected; a2b_status
  echo "--- timeline (t state|minigame|briefOpen|barks)"; collapse | tee "$OUT/m1_timeline.txt"
  a2b_ev "const m=window.MinigameFramework.currentMinigame; if (m) { window.MinigameFramework.endMinigame(true); } return !!m;" >/dev/null; sleep 4; a2b_shot after_end
  echo "--- after End"; collapse | tail -6 | tee -a "$OUT/m1_timeline.txt"; a2b_quit ;;
m2)
  for how in decline ringout; do
    AUTOBRIEF=true a2b_open m2_$how --set skip_timed=false
    ring_timed && echo "[$how] timed_caller ringing after ${i}s"; echo "knot while ringing:"; node_npc timed_caller
    if [ $how = decline ]; then a2b_decline; else sleep 24; fi
    sleep 3; echo "[$how] ringer:"; a2b_status | cut -c1-200; echo "knot after:"; node_npc timed_caller
    a2b_ev "window.MinigameFramework.startMinigame('phone-chat', null, {npcId:'timed_caller', phoneId:'player_phone', title:'Phone'}); return true;" >/dev/null; sleep 4
    a2b_text | tee "$OUT/m2_${how}_thread.json" | cut -c1-500; a2b_shot thread; a2b_quit
  done ;;
m3)
  AUTOBRIEF=true a2b_open m3; a2b_ev "$LOGJS" >/dev/null
  a2b_lever lever_basic_again caller_basic || { a2b_quit; exit 1; }; wait_ring caller_basic 20 || { echo "no ring" >&2; a2b_quit; exit 1; }; a2b_answer; sleep 3
  a2b_status | cut -c1-260
  a2b_ev "window.eventDispatcher.emit('send_text', {}); return 'send_text emitted during the call';"; sleep 5
  echo "during call: barks=$(a2b_ev 'return document.querySelectorAll(".npc-bark").length;') callActive=$(a2b_ev 'return window.phoneRinger.callActive();')"; a2b_shot during_call
  a2b_ev "window.MinigameFramework.endMinigame(true); return true;" >/dev/null; sleep 3
  echo "after End: barks=$(a2b_ev 'return document.querySelectorAll(".npc-bark").length;') callActive=$(a2b_ev 'return window.phoneRinger.callActive();')"; a2b_shot after_end
  collapse | tee "$OUT/m3_timeline.txt"; a2b_quit ;;
esac
