#!/bin/bash
# Scratch (review M1 R3): source the M1 route's helpers, then run two cage-gate timing checks.
source tools/phone_calls/routes/m09_m1_live.sh
t0=$(date +%s.%N)
el() { printf '%.1f' $(echo "$(date +%s.%N) - $t0" | bc); }
snap() { echo "  +$(el)s room=$(room) $(ns_flags) toast=$(a2b_ev "return (window.npcManager.getConversationHistory('agent_0x99')||[]).some(m=>/First box is in/.test(m.text||''))") $(tl)"; }
case $X in
gate_race)  # fastest path: terminal, straight through the stacks to the cage gate, read-out never opened
  open_m09 gate_race --start-room reading_room
  submit_flag1; close_mg; t0=$(date +%s.%N); echo "terminal closed (t0)"
  enter_stacks; snap; try_cage_gate; echo "  cage gate tried at +$(el)s"; close_mg; snap
  for i in $(seq 1 14); do sleep 1; snap; done; a2b_shot gate_race_end; a2b_quit ;;
gate_then_tap)  # try the gate, then open HaX's read-out at once (inside the 3 s delay): where does the ring land?
  open_m09 gate_then_tap --start-room reading_room
  submit_flag1; close_mg; t0=$(date +%s.%N); echo "terminal closed (t0)"
  enter_stacks; snap
  echo "wait for HaX's toast without opening it:"; for i in $(seq 1 15); do sleep 1; a2b_ev "return (window.npcManager.getConversationHistory('agent_0x99')||[]).some(m=>/First box is in/.test(m.text||''))" | grep -qx true && break; done; snap
  echo "  geometry: $(a2b_ev "const p=window.player; const ds=[]; const scan=(o)=>{ if(o&&o.doorProperties) ds.push({id:o.doorProperties.connectedRoom+'<'+o.doorProperties.roomId, x:Math.round(o.x), y:Math.round(o.y)}); }; Object.values(window.rooms||{}).forEach(r=>{ (r.doorSprites||[]).forEach(scan); }); return {player:{x:Math.round(p.x),y:Math.round(p.y)}, terminal:(()=>{const o=Object.values(window.rooms.reading_room.objects||{}).find(o=>o.scenarioData&&o.scenarioData.id==='drop_terminal'); return o?{x:Math.round(o.x),y:Math.round(o.y)}:null})(), doors:ds.filter(d=>/stacks|cage|reading/.test(d.id))};")"
  try_cage_gate; echo "  cage gate tried at +$(el)s"; close_mg
  tap_readout 5; snap
  for i in $(seq 1 8); do sleep 1; snap; done; a2b_shot gate_then_tap_ring; a2b_quit ;;
esac
case $X in
gate_direct)  # one cross-room move from the terminal straight to the cage gate; page-time stamps
  open_m09 gate_direct --start-room reading_room
  submit_flag1
  a2b_ev "window.__r3=[]; window.__r3t0=performance.now(); const log=(k)=>window.__r3.push(k+'@'+((performance.now()-window.__r3t0)/1000).toFixed(1)); window.__r3log=log; let last=''; window.__r3iv=setInterval(()=>{ const c=window.phoneRinger.current(); const s=(c?c.npcId+':'+c.state:'-')+'|toast:'+(window.npcManager.getConversationHistory('agent_0x99')||[]).some(m=>/First box is in/.test(m.text||''))+'|room:'+window.currentPlayerRoom; if(s!==last){ last=s; log(s);} },100); window.eventDispatcher.on('door_unlock_attempt',(d)=>log('door_unlock_attempt:'+(d&&d.connectedRoom))); return true;" >/dev/null
  close_mg; a2b_ev "window.__r3log('terminal_closed'); return true" >/dev/null
  $S $GID '{"cmd":"moveToNear","id":"door:reading_room->restricted_stacks"}' 30 >/dev/null; $S $GID '{"cmd":"interact","id":"door:reading_room->restricted_stacks"}' 30 >/dev/null
  for n in 1 2 3; do $S $GID '{"cmd":"moveToNear","id":"door:restricted_stacks->restricted_cage"}' 40 >/dev/null; [ "$(room)" = '"restricted_stacks"' ] && break; done; a2b_ev "window.__r3log('arrived_at_gate'); return true" >/dev/null
  $S $GID '{"cmd":"interact","id":"door:restricted_stacks->restricted_cage"}' 30 >/dev/null; close_mg
  sleep 14; echo "timeline: $(a2b_ev "return window.__r3")"; a2b_shot gate_direct_end; a2b_quit ;;
esac
