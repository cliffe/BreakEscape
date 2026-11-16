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

## Handover 5 (fifth session)

Games this session (keyless :3093): 5793 (tour, direct board route, report lost), 5817 (tour, direct
board route, full report), 5827 (click probe and Marek seat), 5839 (job_beat GL=1, crashed), 5859
(job_beat GL=1 rerun). One unrecorded id from the first new-game call was not driven.
Scratch: /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/sims-tidy5/
(tour-5793.out, tour-5817/, click.mjs, click/, item4/, item4b/, testjs.txt, testjs2.txt).

### Suites
- bin/test-js on ee76e1cce plus the async tests: 682 of 683; door-gates failed because its path-avoid
  stub had no `seatedAvoidCells` export (22724fa2f added the import). Fixed in 13a1ffbc8.
- bin/test-js after the fix (alongside tour 5793): 683 of 683. path-seated-chairs 8 of 8, door-gates 22 of 22.
- The new test file needed no listing: bin/test-js runs test/js/*.test.mjs.

### Path grid fix (22724fa2f)
- Unit tests (e533e3197): async mode with the player's NPC-avoid points. Both sets apply to the first
  search; seated cells come off after calculate(), NPC cells stay until the timer callback; a failed
  search reruns with the NPC cells and without seated ones; the caller hears once; nothing is left
  avoided. Also: no rerun when the first search finds a path, and only one rerun (null once) when
  nothing is found either way. Reading the code, the async case is sound: the callback runs after the
  finally, `_calcDepth` is 0 there, so the rerun starts straight from the callback.
- Live, old direct board route (BOARD_ROUTE=direct FRONT_CLICK=1, no waypoints):
  - 5793: row 3 try 1 from (200,176) stopped at sprite (216..220,103), the 5748 stop; try 2 from (264,176)
    read the board; board2 from (200,176) read first try. The report (path searches) was lost to a
    driver crash at the end.
  - 5817: both row 3 reads and row 5 read first try from (200,176)/(232,176). The player path search log
    shows no player (avoidNPCs) search between (200,176) and the front at all: the approach was taken on
    straight line of sight. The only player searches near the board were from (220,76) to the board
    itself (behind the wall), which found nothing, reran without seated chairs and found nothing again,
    as expected. 4 reruns in the whole tour, all of that kind; no player path crossed a seated chair.
  - 5827 click probe: player at (200,176), real click at (220,100) with Amara seated (chair
    office_chair-white-1-rotate6_154, box 217..239 x 118..129), three times: seated avoid on, forced off
    (old behaviour), on. All three arrived north of her chair (sprite (218..223,69..73)); each time
    hasPlayerLineOfSight said clear and no player grid search ran. The click landed on her chair
    ("A chair." label), so the bridge's click point was not the feet target the probe meant.
  - Conclusion: on this approach the player's walk is decided by line of sight, not by the grid search,
    so the engine change is not what gets the player past Amara, and the 5793 stop happened with it in
    place. The waypoints stay in the tour driver (default route); BOARD_ROUTE=direct is opt-in.
- The fix does still matter for NPC routes and player clicks that need a grid search; no live run here
  produced a player search that crossed a seated chair, with or without the fix.

### Marek's post (5659540bd)
- 5817: fetch_start at 0 s for office_chair-white-1-rotate7_152 (from 115,223), fetch_end arrived 3 s,
  seated at 4 s. No Marek walk_stuck. 5827: seated in office_chair-white-2-rotate1_155 at feet (69,218),
  facing west (sit_west frame). So the chair he fetches varies by run (152 or 155).
- Facing: west, toward the west wall, side-on to the spare desk north of him (shot
  click/marek-5827.png: he sits at the desk's south-west corner, legs to the west). A coordinate home
  has no face point. Not changed.
- Rosa: no doorway stall from Marek. Her two walk_rerouted at (63..65,84) were round walking Grace and
  Sanjay in the doorway; she resumed. No Rosa stuck.

### Grace beside seated Amara
- 5817: no Grace return_stuck (stuck list empty for the whole tour; Amara seated from 59 s). One clean
  tour, so cured or not hit; the player LOS finding above means it cannot be credited to the grid fix.

### Item 5, doorway chair sweep (e131ef703)
- No `chair_out_of_doorway` on 5817 (sweeps 0). Unit-test only.

### Item 4
- 5839 (GL=1): crashed at the wake (driver bug, fixed in 87d4d4006); no 02a shot.
- 5859 (GL=1, fixed driver): ran to the end, no errors, but still no 02a-jodie-locker-trip shot. The
  50 ms watch logged one record only, already at the lockers: {target staff_lockers, kind use, phase
  using, moving false} at needs clock 199 s. So the watch saw nothing during the walk: either it is
  installed after she has already walked (her use started 14.3 s after the call), or her state or
  sprite lookup returned nothing until then. Next: install the watch before the call is made.
- Shot 02-jodie-at-lockers-5859 (looked at): Jodie stands at the blue lockers with a red toolbox icon
  above her head, debug label "using 2s staff_lockers"; Keith sits at the table, the player stands by
  the boiler. So the job icon shows at the lockers; the walk itself is still not shown.
- Lockers: use started by Jodie 14.3 s after the call, used by Jodie. Light: flicker on (faulty 1).

### Driver fixes this session
- 7d4245ea3, 541a07a52: tour route switch, player search log, Marek report and shot, row 6 doorway snapshot,
  report written before the end shots.
- 87d4d4006: job_beat used `window.game.loop` and `window.game.scene.scenes`; window.game is the scene,
  so 5839 crashed at the wake. Now through window.game.sys.game.

## Status for review

### Commits (branch build/ol-sims-tidy, over main)
- Engine: bd2b3a61e and 397597ba6 (item 3, seat walk route and home wait), e131ef703 (item 2, doorway
  chair sweep), 22724fa2f (item 1, seated chairs out of the live grid, avoided per search, rerun).
- Scenario: 5659540bd (Marek's post to the spare desk's south side).
- Tests: e533e3197 (async search), 13a1ffbc8 (door-gates stub).
- Drivers: ef0d9e168, bc0e56ed4, bd54ae5cb, bdced76e0, d5ae71088, c08b665fb, 7d4245ea3, 541a07a52, 87d4d4006.

### Proved, and how
- Item 3 (Tom's seat): live, 5733 (seated at 5 s, no mount_stuck) and 5817 (tom_sat 5 s). Unit tests.
- Item 2: Marek's post: live, 5817 and 5827 (no walk_stuck, no Rosa doorway stall from him). Rows 5 and 6
  cooler park: live, 5733 and 5817 (no Sanjay return_stuck at the cooler).
- Item 1 (board read): the tour reads the board first try with the waypoints (5764) and mostly with the
  direct route (5817 all first try; 5793 one miss). Engine path grid fix: unit tests only; live runs
  show the player's approach goes by line of sight, so it is not exercised there.
- Suites: bin/test-js 683 of 683.

### Unit-test only
- Doorway chair sweep (e131ef703): no live occurrence.
- Path grid fix (22724fa2f), sync and async rerun.

### Backlog
- Player line-of-sight walks past seated chairs: 5793 stopped at Amara's chair on a straight walk. LOS
  tests immovable bodies, so either the chair was not immovable at that moment or the feet started
  elsewhere; needs a probe that logs the LOS call with the chair state on a failing try.
- Marek faces the wall when seated; a face point for coordinate homes, or a home with a desk chair.
- Row 6 (kitchen rota) failed all tries on 5793 at x 41, the doorway's office end; passed on 5817 and
  earlier tours. The row 6 doorway snapshot (541a07a52) will show the grid and bodies next time.

- Item 4 trip shot: the job_beat watch starts too late to see Jodie's walk (5859).

### Open questions
- Keep 22724fa2f given that the live gain is not shown? It is unit-tested, the suites pass, and it
  stops stale seated chairs being baked into the grid (the 5753 finding), so I would keep it.
- Marek's facing: leave, or add a face point (scenario or engine)?

## Handover 6a (R1 fix session, stopped at the context guard)

Code for every R1 finding is in a80f4ddb0, UNTESTED: no bin/test-js run, no live run, no games made.
Next agent: update tests, run the suites, do the live proofs, then write "R1 Outcomes" in
SIMS_TIDY_REVIEW_R1.md and Handover 6 here.

### What a80f4ddb0 does
- M1 (seating.js): `sweepDoorwayChairs(now)` is exported. It picks a spot with the pure
  `doorwayChairSpot(foot, rects, half, clear)`. The candidates come from `doorwayChairCandidates`:
  straight out first (doorGapExit), then a tile further out with a tile sideways each way, then a tile
  sideways each way, the foot's side first. A candidate inside any doorway's approach lane
  (`doorLaneRect`, the gap band run DOOR_LANE_PX 48 into each room) is refused. `chairSpotClear` is
  the box test: chair half size plus 2 px against every enabled static and dynamic body except the
  chair (walls, desks, chairs, NPCs, the player), and the spot must lie on a loaded room's floor.
  The chair moves with `glideChairFootTo` (the new `glideTarget(chair)` reads its target). With no
  clear spot it logs `chair_in_doorway_no_spot` once per foot position and stays put. The
  `chair_out_of_doorway` log line now carries `spot` (the candidate index). `resetDoorSweep()` is
  for tests.
- m1: `doorGapRects(doorProps[])` merges sprites that join the same two rooms on the same line
  (same axis, within 16 px across and 64 px along) into one gap centred between them.
  NOT YET PROBED LIVE: log both kitchen doorway sprites' doorProperties.worldX.
- M2: `postHomePending(stop, home, now, since)` always waits while the home is null. A provisional
  home waits POST_HOME_WAIT_MS from `since`. The caller sets `behavior._postWaitSince` on the first
  check at each post stop key (`_postWaitKey`).
- m6: postHomePending's JSDoc now sits above it, and needsSeatRef has its own doc again.
- m2 (npc-pathfinding.js findWorldPath): seated cells are blocked with
  `setDirectionalCondition(cx, cy, none)`, where `none` has a `length` getter that sets
  `probe.touched`. EasyStar 0.4.4's isTileWalkable reads it only when the search reaches a cell next
  to a seated one. The rerun without seated chairs runs only when `probe.touched` is set. They come
  off with `removeAllDirectionalConditions()` in the finally; nothing else in the engine uses
  directional conditions. A pathfinder without setDirectionalCondition (old stubs) falls back to
  avoid points and always reruns. Side effect: seated cells now also block diagonal corner
  checks.
- m3: `seatedAvoidCells(..., ends, { keep })` skips a rect near the start always, and near the goal
  only when it is in `keep` (findWorldPath `opts.keepSeated`; planSeatWalk passes its chair body).
  `findNearestWalkableWorldCell(x, y, r, { avoidSeated })` treats seated chair body cells as blocked
  (path-avoid `seatedBodyCellKeys`). The player's click snap and planSeatWalk's goal snap use it.
- m4 (core/player.js): pure `directWalkStall` in path-doorways.js (no new imports). Only
  movePlayerToPoint's straight walk arms the watch (`directWalk.armed`); hold walks and
  cancelClickToMove disarm it. A walk that is blocked, or makes less than 0.5 px of progress, for 10
  frames calls `movePlayerToPoint(goal, { replan: true })` once. That call skips the line-of-sight
  branch and the click indicator, and bumps `window.__playerWalkReplans` (for the live proof).
  After the replan, a contact stops the walk as before.

### Tests still to write or fix (m5)
- path-seated-chairs.test.mjs: the `pfm` stub has only avoid points, so it takes the fallback path.
  Add setDirectionalCondition/removeAllDirectionalConditions to the stub, and have calculate() read
  `.length` on the conditions next to the path to simulate a touch. Then test: a rerun when touched,
  no rerun when untouched, conditions cleared after. Add `keep` tests for seatedAvoidCells (a goal
  inside someone else's seated chair is still avoided) and an avoidSeated snap test.
- seating.test.mjs: postHomePending (null always waits, provisional first seen at 120000 waits until
  125000); update any old assertion that expects the clock-0 behaviour. Write
  doorwayChairSpot/doorGapRects tests (two sprites at x -16 and +16: a foot at (8,79) exits east),
  and sweepDoorwayChairs tests with stub window.chairs, rooms[..].doorSprites, chair.scene.physics.world
  and npcBehaviorManager (a resting chair glides; seated, fetching, mounting, gliding, the player's
  and moving chairs stay). Add a two-leg advanceSeatMove test that fails without `m.leg++`, and a
  behavioural post-wait test through updateSeatedNPC.
- path-doorways: directWalkStall unit test (a chair that turns solid mid-walk: blocked for 10
  frames gives replan once, then stop).
- Check each new test fails with `git apply -R` on a80f4ddb0's diff.

### Still to do
- Marek face point (scenario only): an object on the spare desk with affordance.useFrom dy 1, and
  Marek's needsHome set to its id. Line 734 of scenario.json.erb has his comment; the spare desk
  objects are near spare_phone (line 252). Validate it, then check he sits facing north.
- A late-room home-wait case in test_needs_sims (none found yet).
- The tour's row 6 snapshot: add each door sprite's doorProperties (worldX, open) and the last
  chair_out_of_doorway lines (tools/playtest/needs-tour-regression.mjs).
- Live proofs on :3093 (start-keyless-server, own pidfile, new-game.rb), as the R1 brief lists.

## Handover 6b (tests done, stopped at the context guard before the scenario and live work)

### Done
- 5c5df47d0: the m5 tests. path-seated-chairs (15 tests): a `pfmCond` stub with
  setDirectionalCondition/removeAllDirectionalConditions whose calculate() reads `.length` when told
  the search touched a seated cell; rerun when touched, none when untouched (sync and async),
  conditions cleared, keep rule, seatedBodyCellKeys, avoidSeated snap. seating (69 tests):
  postHomePending new semantics, a behavioural late-room wait through updateSeatedNPC (home null at
  needs clock 120000, provisional until 125000), doorGapRects merge (sprites at x -16 and +16, foot
  (8,79) exits east), doorwayChairCandidates, doorwayChairSpot, sweepDoorwayChairs (glide target,
  log with spot, blocked spot, no-spot log once, skip rules: seated, fetching, mounting, moving,
  inactive, gliding; stale reservation moves; once a second), sweep call wiring, two-leg seat walk.
  path-doorways (12 tests): directWalkStall, player.js wiring.
- Old-code checks: `git apply -R` of each file's a80f4ddb0 hunk fails the new tests (npc-pathfinding
  5, path-avoid keep line 1, path-doorways 2, player.js 1, seating 10). Targeted mutations also fail:
  no `m.leg++`, caller without `_postWaitSince`, no sweep call, no fetch/velocity/glide skip.
- Not tested: the player's-own-chair skip (`state?.chair`, module state with no test hook).
- bin/test-js result: see the line appended below.

### Noticed in review (not changed)
- doorwayChairSpot candidate 0 (straight out) is always refused: the foot is inside the gap's band,
  so a chair box at foot.y always overlaps that doorway's own lane. Harmless, but the `spot` index in
  `chair_out_of_doorway` will never be 0. Either drop it or keep it as documentation.
- directWalkStall counts blocked frames even with progress, so a straight walk sliding along a wall
  replans after 10 frames rather than stopping on first contact; a straight walk into a clicked
  object's body now pushes 10 frames, then paths to a snapped cell beside it. Watch for this live.

### Still to do (unchanged from 6a, in order)
1. Marek face point (scenario only). His post (2.15, 6.65) is the south side of the south-west desk
   (Tom's badge sits on a desk at (1.75, 5.25), so check the desk extents live first). Add an object
   on that desk with `affordance.useFrom` dy 1 and set his needsHome to its id; validate.
2. Late-room home-wait case in test_needs_sims (none exists).
3. Tour driver row 6 snapshot: door sprites' doorProperties and chair_out_of_doorway /
   chair_in_doorway_no_spot lines (tools/playtest/needs-tour-regression.mjs).
4. Live proofs on :3093 (tools/playtest/start-keyless-server.sh, tools/playtest/new-game.rb), then
   R1 Outcomes and Handover 6.
- bin/test-js on 5c5df47d0: 686 of 687; door-gates failed because its path-avoid stub had no
  `seatedBodyCellKeys` export (a80f4ddb0 imports it). Stub fixed in the next commit; door-gates then
  passes on its own. The full suite has not been rerun after that fix: rerun it first.
- No server was started and no game was made this session.

## Handover 6c (fix round, stopped at the context guard before the live tour runs)

### Done
- Merge of main e0f05538e: 616b971d6, clean (hampshire ink, train-check.sh). bin/test-js on the merge:
  687 of 687 files pass (run started just before the next commit's edits; rerun once more at the end).
- 22a9b4866, the two code points from 6b:
  - doorwayChairSpot: the straight-out point is no longer a candidate (the foot is inside the gap's
    band, so a chair there always sits in that doorway's own lane; a new test proves the overlap for
    feet across the side and front gaps). The four candidates are now indices 0..3, so
    `chair_out_of_doorway` spot 0 is "a tile beyond straight out, a tile towards the near wall".
  - directWalkStall: a stall is now "under limit * minStep (5 px) gained towards the goal over the last
    10 frames", kept in `st.hist`. Blocked while sliding along a wall still gains ground, so it returns
    'wait' (keep walking) and never replans; the corner it ends in replans. New tests: a 40-frame
    blocked slide never replans, the corner does, a shallow 0.4 px/frame slide does, a 5-frame bump does
    not. Both test files fail on the old code (path-doorways 2, seating 4). player.js state is
    `{ armed, hist, replanned }`.
- 615807990, Marek: `marek_tool_roll` (m10_tool_roll1, interactable false, owner marek, private,
  position (2.0, 5.4) elevation 24, useFrom 0,1) on office_desk1_91 (sprite 30..108 x 166..205; the
  desk Tom's PC, badge and phone and Grace's laptop sit on, so it is not a spare desk), and his
  needsHome is its id. Validator 0 errors, 36 warnings. README row updated.
  LIVE (game 5932): approach cell (76,212), home resolved non-provisional, he fetched chair 155 and sat
  facing north (frame sit_north_frame_000, feet 76,216); screenshot
  scratchpad/sims-tidy6/marek-5932.png, looked at: his back to the camera, facing the desk.
- Tour driver (uncommitted until this note's commit): row 6 now always records `doors` (each door
  sprite's doorProperties, the merged gaps via a dynamic import of seating.js, and the
  chair_out_of_doorway / chair_in_doorway_no_spot lines); the report has `player_walk_replans`, and
  the summary line prints replans and row6_doors.

### Still to do, in order
1. Late-room home wait: no new scenario case is needed. Rosa (lounge, home rosa_laptop) and Neil
   (it_room, home neil_mug) are already object homes in rooms that load late (at start only the
   office's door sprites exist). Prove it live: wait until the needs clock passes 8 s, enterRoom
   lounge (and it_room), then poll each 250 ms: state.home.provisional, behaviour._postWaitKey /
   _postWaitSince, and the first fetch_start / seat for rosa and neil must come after their
   home_resolved log line. There is no log line for the wait itself.
2. Tour with BOARD_ROUTE=direct, 3 or more games (new-game.rb via `BREAK_ESCAPE_STANDALONE=true
   bin/rails runner tools/playtest/new-game.rb test_needs_sims`, BUNDLE_PATH set to the main
   checkout's vendor/bundle). Run in the background (it takes minutes). Read replans, stuck, sweeps,
   row 6 doors (both kitchen sprites' worldX and the merged gap) from tour-<gid>.json.
3. Sweep proof: if no tour run logs chair_out_of_doorway, stage one in a probe (place a loose chair's
   foot at (8,79) in the browser, no game record edit), then check the logged `to` and that the
   chair's box at rest overlaps no body.
4. R1 Outcomes in SIMS_TIDY_REVIEW_R1.md and the final Handover 6; rerun bin/test-js.

### Gotchas
- Pressing Escape six times at load (as my first probe and click.mjs did) can leave the pause menu
  open: the scene is paused, the needs clock stops at about 3 s, and NPCs freeze mid-walk. Use
  dismissBlockingUi only, then press Escape only while scene.sys.isPaused(). The tour's closeUi is
  fine (it presses Escape only while something blocks).
- Server: start it from the worktree with BUNDLE_PATH=<main>/vendor/bundle, `-P` a pidfile in the
  scratchpad; new-game.rb needs `bin/rails runner`, not plain ruby.
- Games this session: 5928 (old roll position), 5932 (current). One earlier new-game call printed
  no id (probably 5927). Server on :3093 stopped. Probe scripts: scratchpad/sims-tidy6/probe.mjs
  (Marek and doors), eval.mjs (runs an expression file after a wait).

## Handover 6 (fix round complete: live proofs and write-up done)

- `bin/test-js` on c0813f38c: 687 of 687 files pass.
- Live, keyless :3093 (stopped), games 5967, 5969 to 5972. Results are in "R1 Outcomes" in
  SIMS_TIDY_REVIEW_R1.md:
  - sweep: chair staged at (8,79) moved to (-83,106), spot 1, clear (screenshots in the scratchpad);
  - doorway merge: the kitchen doorway has one sprite (worldX 16), merged gap x -16..48, y 64..96;
  - late-room wait: Rosa waited on home null at clock 11250, resolved 11500, sat 12500, no fetch, no mount_stuck;
  - board approach, BOARD_ROUTE=direct x3 (5969, 5970, 5971): replans 0, board read first try each;
  - row 6: passes in all three, in-page seating.js import works, no sweep lines.
- Open, not fixed: row 3 fails in all three tours (see_coffee_off); one doorway NPC jam in 5970 (Rosa,
  Grace, Sanjay at y 84, walk_stuck and return_stuck, no chair near).
- Neil's room (it_room) is behind a closed door, so the late-room proof used Rosa only.
- Game 5956 was reported dirty by another session; not used.
- Ready for review round 2.

## Handover 7 (R2 fixes committed; row 3 probe half done, stopped at the context guard)

- Commit 22a9815ba: m1 (directWalkStall now takes `now`, 180 ms window, a third of free-walk gain; tests at 20, 60
  and 360 Hz), m2 (seated chair body cells keep the directional condition, padding is an avoid point; a padding
  cost whose valueOf flags the touch probe, so a corridor blocked by padding still reruns; real EasyStar 0.4.4
  vendored in test/js/vendor, test/js/path-seated-easystar.test.mjs), m3 (three glides from one foot, then one
  chair_in_doorway_no_spot line), m4 (tour row 3: turned_back is npc_turned_back reason off only, parked listed
  apart, needs_at_read, needs_samples every 5 s, no_queue_why). New tests fail on the old code (git apply -R).
- bin/test-js was still running in the background at the guard (output in the scratchpad file testjs.out, last
  line at the time was a PASS; no FAIL so far). Read its Files line before merging.
- Row 3 probe, HEAD, BOARD_ROUTE=direct, game 6019: the board read succeeded (board true, clock 105 s) but the
  needs did not change: caffeine at the first snapshot 88 (Amara), 93 (Tom), 79 (Marek), decaying slowly after,
  never 10. So the `object_interacted` mapping with needs set caffeine 10 (scenario.json.erb:588, 668) did not
  take effect, whatever the cause. Nobody queued.
- Not done: the same probe on af5344f84 (worktree made and removed; server on :3093 started and stopped; game 6022
  was created there for it and not played). Next: start a keyless server from a hand-made worktree at af5344f84,
  run row3b.mjs with BOARD_ROUTE=direct on game 6022 (or a new one), compare caffeine after the read. If it
  drops to 10 there and not on HEAD, bisect; if not, it is the mapping (cooldown 30000, or the event not
  reaching the mapping) on main. Check the mapping cooldown and where npc-manager matches object_interacted.
- Not done: R2 Outcomes section in SIMS_TIDY_REVIEW_R2.md.
- Servers on :3093 stopped; the temporary worktree removed.

## Handover 8 (row 3 cause found and fixed; one tour re-run left)

- Cause: Activity Board out of reach from the floor (see R2 Outcomes in SIMS_TIDY_REVIEW_R2.md). Fixed with
  `wallMounted` on the board and a tour driver event-name fix, commit 0e4b26bce, plus the docs commit after it.
- bin/test-js: Files 689 passed, 0 failed, 689 total (run after the board fix, before the driver helper).
- Left: rerun `BOARD_ROUTE=direct node tools/playtest/needs-tour-regression.mjs <new game> 3093 <out>` and
  check row 3 ok true; rerun bin/test-js for the final figure (new test needs-tour-rows added since). The Deadline
  Memo is also back-wall and was left unmarked (its mapping sets caffeine 20); check it only if it proves unreadable.
- Games this session (keyless :3093): 6024 (probe), 6032 (probe), 6035 (live read proof), 6036 (tour). Server and
  tour stopped; temporary af5344f84 worktree removed.
- Gotcha: __test.interact reports ok on any stray event; check object_interacted itself.
