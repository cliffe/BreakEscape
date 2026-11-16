# Sims tidy pass: build log

Branch build/ol-sims-tidy (from main 177c13f6a). Scenario scenarios/test_needs_sims. Keyless server :3093.

## Handover (first session stopped at the context limit)

### Done
- Item 1 (driver only): `tools/playtest/needs-tour-regression.mjs` `read()` takes a mid-point order; row 3
  (both board reads) tries (200,176) first, then (264,176), then (232,176). Not yet proved live.
- The tour report now records each NPC's first `npc_sat` (needs clock, s), the seating log lines
  (fetch_start, fetch_end, seat_move_end, seat_gave_up) and the stall lines with positions; the last
  console line prints `stuck` in full and `tom_sat`.

### Item 3 diagnosis (proved on games 5640 and 5645, player parked at 232,176)
- Tick 1 (needs clock 0.25 s): Tom's home is still provisional, so `needsSeatRef` gives his spawn feet
  (96,192) as the work spot. That spot overlaps desk `office_desk1_91` (body 40..98 x 195..205) by
  2 px: Tom's 20 x 10 body spans y 187..197.
- The push leg arrives at once (1-tile arrival guard: Tom at 116,204 is 23 px from 96,192), so
  `endFetch` starts the seat move with stage `walk`, a straight line to (96,192).
- The straight walk catches the desk's top-right corner (98,195) and logs
  `seat_move_end walk_stuck` at (108,193), about 3.5 s. The centre line is clear of the desk; the body
  edge is not.
- He then stands until the post fetch retry. With home resolved to (92,164) that fetch sits him at
  about 17 to 18 s in a quiet run. In the tour it is about 65 s, per the brief; not yet re-measured.
- Proposed fix (not written): in `startSeatMove`, when stage is `walk`, check the straight line with
  18 x 10 `walkBoxClear` samples every 4 px (ignoring Tom and the chair). If it is blocked, plan a grid
  path synchronously, the same enableSync/disableSync pattern as npc-needs.js `routeLength`. Aim
  `findWorldPath` at `findNearestWalkableWorldCell(ref, 2)`, drop points within 4 px of the start,
  collapse collinear points and append `ref`. The `walk` case then ticks through `m.route` legs
  (`resetWalk` per leg), keeping the existing walk_stuck rule and the straight-walk fallback.
  Unit-test a pure `seatWalkWaypoints(path, from, ref)` in test/js/seating.test.mjs. Ask whether the
  first fetch should also wait for a resolved home; that would be a second, separate fix.

### Item 2 (in progress, no fix yet)
- Kitchen doorway geometry (game 5634, after opening it): the door is at x 0 (the kitchen is at x -320).
  The gap is y 68..92, with wall strips 60..68 and 92..100 for x -32..32. Feet y must stay in 73..87.
  The grid opens only the cell rows y 72..88. The row y 88..96 is blocked for x -40..40, and row 64
  is blocked.
- Tom's (14,83) is inside the corridor. Grace's (34,86) is just east of its office end: her body's
  bottom is at 91, 1 px above the strip.
- Walkable wall-band cells: x -16..16, y 104..128 is walkable (the seam between the two rooms'
  walls), but it is an enclosed pocket, with blocked rows at y 88 and 96 above it. It is not on the
  doorway route, so it is unlikely to cause these stalls.
- Next step: hook `npcNeedsSystem._log` in the driver for `return_stuck|walk_stuck|walk_rerouted|
  return_resumed`, and snapshot the nearby bodies (the player, NPCs, chairs) and the path. The
  tour's `enterRoom` parks the player at feet (+/-19,80), in the doorway corridor, which is one
  suspect.
- The baseline tour on game 5633 was stopped before it finished; re-run it for the before counts.

### Item 4: not started (`tools/playtest/needs-sims-staff-room.mjs` beat `job_beat` is the place to start)

### Scratch probes (not in the repo)
/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/sims-tidy/geo.mjs (grid and bodies in a rectangle), tomtrace.mjs (Tom's fetch trace with an arrival hook).

### Games
Created this session: 5633 (tour, partial), 5634 (geometry), 5640 and 5645 (Tom traces), plus one
unrecorded id from the first new-game call, which was not driven.

## Handover 2 (second session stopped at the context limit)

Games this session (keyless :3093): 5655, 5656, 5657, 5658, 5691, 5693. Scratch:
/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/sims-tidy2/
(tomtrace.mjs with `home` in its log filter, board.mjs, tour JSONs, item4/ shots).

### Item 3: committed bd2b3a61e, partly proved
- seating.js: `seatWalkClear` (18 x 10 box every 4 px, last 8 px not checked) and `seatWalkWaypoints`
  (pure, unit-tested); `planSeatWalk` plans a sync grid route when the line is blocked; the `walk`
  stage goes leg by leg (log line `seat_walk_routed`). updateNeedsSeat: at the post the first try
  waits for a resolved home, up to POST_HOME_WAIT_MS = 5000 (needs clock), before the stop is marked
  tried. Three tests in test/js/seating.test.mjs. bin/test-js: 680 of 681; validator-office-life
  failed under load (two live runs going) and passes alone, 32 of 32.
- Before (old seating.js, game 5655, quiet trace): fetch at 0.25 s from the provisional spot,
  walk_stuck at 4 s, seated at 18 s. Before tour 5657: tom_sat 18, walk_stuck 3 (tom x2, grace, all in
  the kitchen doorway corridor at y 84).
- After, quiet trace 5656: home_resolved and fetch_start both at 1.25 s, seated at 5.3 s. After tour
  5658: tom_sat 5, walk_stuck 0, one Sanjay return_stuck.
- Route only (home wait set to 0, game 5655): `seat_walk_routed legs 4`, no walk_stuck, the walk
  reaches the spot, then `mount_stuck` at (98,190): the provisional spawn spot against the desk is
  not seatable, so the home wait is the fix that matters; the route removes the walk stall.
- OPEN: tour 5691 (after) shows tom_sat 18 again: fetch_start at s 0 from (96,192), mount_stuck at
  5 s. So the home wait did not hold on that run. Check whether `stop.post` is false for that first
  stop, or the home resolved at tick 0 to a spot that is still against the desk (log the ref in
  fetch_start). Also in 5656 Tom fetched office_chair-white-2-rotate3_157 from (234,168), 140 px
  away; check that chair is not another NPC's.

### Item 1: not proved; board read from (200,176) fails in every run
- Board activity_board: x 210..250, y 13..65 (back wall). Probe board.mjs on 5655 at game start:
  reads work from the floor at (212..220, 75); moveToNear aims behind the wall (y 41) and returns
  arrived-but-outside-plain-range.
- Tours 5657, 5658, 5691: in row 3 the player stops at (212..228, 103..104) from every mid point
  (moveToNear, and in 5691 the new driver `BOARD_FRONT` moveTo(220,76), reason `stuck`). Amara sits
  in her pulled-out chair at (228,123) then. Row 5 (later) reads fine, the player at (220,37).
  Next: snapshot every body between y 64 and 104, x 190..260, at the row 3 stop (something is in the
  aisle north of the player only then).

### Item 2: stall snapshots in the tour driver (report.stalls), committed with this note
- After tour 5658: no kitchen doorway stall. Two rosa walk_rerouted at (39..41,84), office end of the
  doorway: Grace in the corridor, and Sanjay's reserved chair office_chair-white-1-rotate8_153 parked at
  box (2..24, 68..79), inside the gap (feet band 73..87). Player in the kitchen far away.
- Sanjay return_stuck at (-244,254) in the kitchen: the player stood beside him at the water cooler
  (box -257..-239 x 239..249): a driver cause (rows 5 and 6 park at moveToNear water_cooler).
- Tour 5691: stalls moved to (44..64,138) in the office (tom x3, grace), round Marek seated at
  (42..64,122..133) in chair rotate3_157 and loose chairs; player in the kitchen. Not the player.
- The (+/-19,80) park suspect is not supported: no doorway stall had the player within 64 px.
  Options for the chair-in-gap and seated-in-aisle stalls are not written yet.

### Item 4: shot not taken
- job_beat on 5693 (GL=1): Jodie took the lockers (start 14.5 s after the call), job cleared; shots
  01..06 in sims-tidy2/item4/. The new `02a-jodie-locker-trip` hook never fired: it needs
  job.targetId === 'staff_lockers' and isMoving at a 1 s poll; check the job shape on her walk
  (maybe the target id differs or phase is 'walking' with a different field). 02-jodie-at-lockers
  exists but was taken at the lockers, not on the trip.

## Handover 3 (third session stopped at the context guard)

Games this session (keyless :3093): 5730 (posts probe), 5731 (tour, page load timed out, not used),
5733 (after tour), 5748 (board probe). One unrecorded id from the first new-game call was not driven.
Scratch: /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/sims-tidy3/
(posts.mjs, board3.mjs, tour-5733/, board3-5748.json/png). The worktree has no .bundle/config: start
rails with BUNDLE_PATH=<main checkout>/vendor/bundle.

### Item 3: done and proved (397597ba6)
- Cause of 5691: the needs state registers with home null; the seat check ran before the first needs
  tick, and the guard only tested `home.provisional`, so the wait never held. `postHomePending(stop,
  home, now)` waits while home is null or provisional (unit test).
- The 140 px chair (office_chair-white-2-rotate3_157 at 234,168) is no NPC's post chair: 44 px from
  Amara's home, outside NEAR_CHAIR 36. Marek (coordinate home, no desk chair) fetches it on 5730; Tom
  got there first on 5656. The claim rule keeps them apart.
- After tour 5733: Tom fetch_start at 1 s, seated at 5 s, no mount_stuck (before 5691: 0 s, 18 s).

### Item 2: two fixes in, partly proved
- e131ef703: a resting chair whose foot is in a door gap slides out to its own side, 24 px clear of
  the mouth, once a second (`doorGapRect`, `doorGapExit`, `sweepDoorwayChairs`, log
  `chair_out_of_doorway`). Unit tests. 5733 had no chair in the doorway, so the sweep was not seen firing.
- bd54ae5cb: tour rows 5 and 6 park 80 px off the cooler (`parkByCooler`). 5733: both rows pass, no
  Sanjay return_stuck at the cooler.
- OPEN: Marek seated at (42..64,122..133) still turns Rosa back at the kitchen doorway's office end
  (5733 walk_rerouted at 47..49,84), and Marek himself walk_stuck at (77..89,134) between Sanjay's
  seat and loose chair 152. Grace return_stuck at (254,100) beside seated Amara (217..239 x 118..129).
  Not fixed. Options: Marek as a stander (no fetch), or his post moved off the aisle (scenario).

### Item 1: cause found, driver fix written, NOT proved live
- Probe 5748: `arrivedAt` (220,103) is the sprite; the feet are at y 134, against Amara's seated chair
  (immovable, box 217..239 x 118..129). The path grid is clear there: seated NPCs and their chairs are
  not in it, so the planner walks straight up x 220.
- Driver change (committed with this note): BOARD_FRONT is now waypoints [[200,104],[220,76]]. Next:
  run the tour and check row 3. Engine follow-up to consider: the player's click path also ignores
  seated NPCs.

### Item 4: driver change committed (bdced76e0), not run
- job_beat now watches Jodie's job every 50 ms in the page, logs each change (r.jodie_jobs), and on
  her first moving frame with target staff_lockers sleeps the game loop for the shot
  (02a-jodie-locker-trip), then wakes it. Run it with GL=1 on a fresh game. If it never fires,
  jodie_jobs shows the real job shape on the trip.

### Suites
bin/test-js 681 of 681 (run alongside tour 5733). test/js/seating.test.mjs 59 of 59.

## Handover 4 (fourth session stopped at the context guard)

Games this session (keyless :3093): 5753 (office geometry probe), 5764 (tour, stopped after row 3 at the
guard). Scratch: /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/sims-tidy4/
(geo4.mjs, geo-5753.txt, tour-5764.out, val.txt). Server and tour stopped.

### Item 2, Marek: post moved (5659540bd), not yet proved live
- needsHome and position (1.65, 4.0) to (2.15, 6.65): south side of the spare desk office_desk1_91
  (40..98 x 195..205), a dead-end corner. Chair 152 is at Sanjay's post, so he should fetch loose chair
  155 from (227,278). 73 px from the mugs, so outside Sanjay's 2-tile avoid radius (only Sanjay has a
  radius; `_avoidedAt` uses the avoider's own). README rows and PROOF_HISTORY line 881 updated.
- Validator: 0 errors, 36 warnings (no Marek warning about the post).
- 5764 (old engine, page loaded before 22724fa2f): row 1 ok, row 3 ok (see item 1); the run was cut
  before the stall summary, so Rosa's and Marek's stalls are NOT yet checked. Unchecked: whether
  Marek fetches 155 and which way he faces (a coordinate home has no face point).

### Path grid: engine fix built (22724fa2f), unit-tested, not yet live
- Finding (5753): rebuildWorldGrid bakes whatever is immovable at rebuild time, so a chair seated at a
  door-open rebuild stays blocked after its sitter stands, and one seated later is never in the grid.
  `_avoidNPCPositions` (player) skips immovable bodies. That is why 5748 saw a clear column at x 220.
- Fix: `buildWorldGrid({ skipSeated })` (rebuildWorldGrid passes it; the seat-box stand-up grid does not)
  leaves out seated chairs (seatedBy, body immovable) and NPC bodies overlapping them. `findWorldPath`
  avoids `seatedAvoidCells(...)` (path-avoid.js) per search: padded like avoidCells, a chair within one
  cell of the start or goal skipped whole, end cells and padding within 2 cells of an end kept open,
  cells cleared after calculate(). A search that finds nothing reruns with `opts.ignoreSeated`; in sync
  mode the rerun waits until calculate() returns (EasyStar calls back inside calculate). About 55 engine
  lines. No new static import (path-avoid.js was already imported).
- Tests: test/js/path-seated-chairs.test.mjs 5 of 5; path-avoid 9, npc-needs-reroute-held 11,
  npc-pathfinding-world-grid 9, door-gates 20, npc-local-avoidance 29, npc-room-leash 4, seating 59,
  all pass. bin/test-js NOT run yet.
- Check whether bin/test-js needs the new test file listed anywhere (it ran by glob before).

### Item 1: row 3 read the board on 5764 with the driver waypoints (old engine)
- Board try 1 from (200,176): moved, arrived (219,47), read true. Then off/turn-back ok (Marek and Tom
  queued, both turned back, Marek grumbled). This is the waypoint driver fix, before the engine change.

### Next, in order
1. bin/test-js (alone, no live run).
2. Fresh game, full tour on the new engine: rows 1, 3, 5, 6; check stuck list for rosa/marek/grace
   (Grace's return_stuck by seated Amara should go with the engine fix), tom_sat, row 3 read.
   Also look for `chair_out_of_doorway` in the log (e131ef703); if none, say unit-test only.
3. Item 4: GL=1 fresh game, needs-sims-staff-room.mjs job_beat, look at 02a-jodie-locker-trip.
4. "Status for review" section.
