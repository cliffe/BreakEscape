# NPC carried items slice C: live reload proof

Driver: `tools/playtest/npc-carry-reload-proof.mjs` (headless, `setFPS(20)`, fixed steps on).
A reload is `about:blank` then back to the game URL. Every beat records each `update_room`
status, page and console errors, the needs job snapshot used to time the reload, and the room
fetch and client world before and after.

## Status: live run done on port 3094 (16 Nov 2026)

Port 3091 was held by another session's server, so the run used a keyless server from this
worktree on port 3094 (`rails server -b 127.0.0.1 -p 3094`, port passed to the driver as its
third argument). Headless, `setFPS(20)`, fixed steps on. Fresh game per beat. Server log:
0 x 422 across every game below; 0 page errors. The only console error in each lab game is one
503 from the keyless `/tts` (no key, expected); the test_needs_sims games had none.

Driver changes (test code only, no feature code): `REPICK_MS` env var for the post-reload
re-pick wait (default 120000), and after each lab reload the driver now walks back to
open_plan (a reload restarts the player in the briefing room, and Sofia's room is not simulated
until it is loaded, so the first L1/L2 run, games 5678 and 5679, never re-picked; that was a
driver gap, not a feature fault).

| Beat | Game | Reload point | Object after reload | NPC free, re-picks | usb_foothold |
|---|---|---|---|---|---|
| T1 | 5722 | Grace walking the mug to the tray (office) | once, office, at (4,7), which is also its fromPos (first pick-up) | NOT SEEN: job null, no carry in 300 s | n/a |
| T2 | 5723 | Grace re-carrying the mug put down at (131.99, 220.73) | once, office, px (131.99, 220.73) = the put-down spot, not the scenario spot (4,7) | NOT SEEN: job null, no carry in 300 s | n/a |
| L1 | 5702 | stick dropped, Sofia heading to it (goto_item), not yet picked up | once, open_plan (0.469, 2.188) | yes, carry then consume | true, remote session in inventory |
| L2 | 5703 | Sofia just picked it up (goto_target) | once, open_plan (0.469, 2.188), the drop spot | yes, second carry_object then consume | true, remote session in inventory |
| L3 | 5704 | Sofia mid-use (phase using) | once, open_plan (0.469, 2.188) | yes, second carry_object then consume | true, remote session in inventory |
| L4 | 5709 | straight after kp_usb_foothold set | none (consumed, not resurrected) | n/a, job null | true, remote session in inventory |
| L5 | 5710 | after records_remote_session arrived | none (not resurrected) | n/a | true, remote session in inventory |

(An earlier T1 run, game 5647, and T2 run, game 5661, with the default 120 s wait gave the same
object positions and the same missing re-pick. In 5661 the reload put the mug back at
px (43.99, 138.99), the position of Grace's last put-down before the pick-up that the reload
cut off. Grace had made one carry every 80 to 130 s before the reload.)

Counts: 0 x 422, 0 carry-action 4xx/5xx (`badCarryStatuses` empty in every beat), 0 page
errors, one object copy after every reload.

### T1/T2: the re-pick was not observed

Put-back is right (one mug, at the pick-up position, not at the scenario spot in T2). Grace was
free (`job` null, nothing held, in the office) but did not start another carry within 300 s of
the reload in either run; her needs log shows only parked rest and thirst needs with
`no_source`. Before the reload she picked up a mug within about a minute of the player
arriving. Not investigated further (brief: record and stop). It may be the needs scheduler
cadence after a reload or the dirty_mugs task needing a trigger, so check this before treating
T1/T2 as passed.

### Sofia's pick-up bark

Plays once. In L2 and L3 (reload after the pick-up) the keyless server logged exactly one
`/tts` request for "Someone's dropped a memory stick. Whose is this?" per game and none after
the reload. Caveat: this is indirect (a client-side cache could hide a repeat). In L1, L4 and
L5 no request for that line appeared at all, so the bark may be skipped or cached there; the
driver does not record barks directly.

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
