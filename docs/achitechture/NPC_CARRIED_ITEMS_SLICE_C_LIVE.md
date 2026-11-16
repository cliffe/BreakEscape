# NPC carried items slice C: live reload proof

Driver: `tools/playtest/npc-carry-reload-proof.mjs` (headless, `setFPS(20)`, fixed steps on).
A reload is `about:blank` then back to the game URL. Every beat records each `update_room`
status, page and console errors, the needs job snapshot used to time the reload, and the room
fetch and client world before and after.

## Status: the live run is BLOCKED (port conflict)

The brief pins the keyless server to port 3091 only, from this worktree. At the time of this
run port 3091 was already held by another session's Rails server (PID 1830947, serving
`.claude/worktrees/p-ol-carry/test/dummy`, the sibling `build/ol-carry` slice, up over an hour).
Binding 3091 from this worktree fails with `Errno::EADDRINUSE` and the server exits at once.

Per the brief's hard rules I did not use any other port and did not kill a PID I had not
launched, so the T1/T2 and L1 to L5 beats could not be driven here. My own server process exited
on the bind conflict, so there was nothing of mine left to stop.

To finish the live proof the orchestrator needs 3091 free (coordinate with or retire the
`p-ol-carry` session's server), then from this worktree:

```
env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true \
  BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle \
  bundle exec rails server -b 127.0.0.1 -p 3091
# fresh game per beat:
BUNDLE_PATH=... bundle exec rails runner tools/playtest/new-game.rb test_needs_sims
BUNDLE_PATH=... bundle exec rails runner tools/playtest/new-game.rb lab_physical_pentest
# then, with the ids printed above:
node tools/playtest/npc-carry-reload-proof.mjs test_needs_sims <gid> 3091 T1
node tools/playtest/npc-carry-reload-proof.mjs test_needs_sims <gid> 3091 T2
node tools/playtest/npc-carry-reload-proof.mjs lab_physical_pentest <gid> 3091 L1   # L1..L5
```

Pass across all beats: every `carry_object` / `put_down_object` / `consume_carried` answers 200,
no 4xx/5xx for carry actions, 0 page errors, exactly one copy of each carried object after each
reload; for the lab, `usb_foothold` completes (kp_usb_foothold true, the remote-session item in
the inventory) after a reload at each point L1 to L5.

## Open questions settled from the code (the live beats would confirm)

### Is tile (2.55, 0.95) in open_plan reachable?

The C1 defect position: before the fix a reload mid-carry rebuilt `kit_deviceB` from its scenario
definition and dropped it into `open_plan` at the briefing-table coordinates `{ x: 2.55, y: 0.95,
elevation: 30 }`. In open_plan y = 0.95 is the top tile row: the north wall, which carries the two
north doors (secure_area, P2). Every wall fixture and object in open_plan sits at y >= 1.2 (the
fire-alarm point is at (2, 1.2), the nearest desks lower still); nothing stands above that line.
An elevation-30 object at (2.55, 0.95) therefore lands on/behind the back wall, which `_nearestReachable`
does not select, so Sofia would never pick it up and `usb_foothold` would stall on the player
noticing the stick, picking it up and dropping it again. This is exactly the failure C1 removes:
with the fix the stick returns to its real drop spot on the open-plan floor, which Sofia reaches.
(Reasoned from the room layout; the definitive check is live beat L2, blocked above.)

### Do onceOnly event mappings survive a reload? Does Sofia's bark play twice?

Yes, a fired onceOnly handler survives a reload, so the bark does not normally replay. The chain
is in `npc-manager.js`: a onceOnly/maxTriggers handler that fires is marked `persist` and counted
(`triggeredEvents`); `exportTriggeredEvents()` sends every persisted, fired handler to the server;
`triggeredEvents` is a synced keyed section (`state-sync.js` KEYED_SECTIONS); and
`restoreTriggeredEvents()` restores the counts on load before any mapping can fire. So once Sofia's
`npc_picked_up:kit_deviceB` bark ("Someone's dropped a memory stick...") has fired and that
triggeredEvents record has reached the server, a reload restores it and the replayed carry does not
sound the bark again.

The one window where it can sound a second time is a reload that lands after the pick-up fired the
bark but before its triggeredEvents record synced (the periodic/debounced sync, with a pagehide
flush on an ordinary reload). The slice-C plan calls this acceptable. Note C2 (the consume
requestSoon) narrows the equivalent gap only for the use's globals, not for triggeredEvents, so the
bark's at-most-once-extra replay is unchanged by this slice.
