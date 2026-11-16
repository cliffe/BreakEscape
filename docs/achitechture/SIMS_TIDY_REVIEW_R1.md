# Sims tidy, review round 1

Branch build/ol-sims-tidy at 8f608acac, scope `git diff main...HEAD`. Read-only review; no live runs.

**Counts: B 0, M 2, m 6.**

| # | Sev | Where | One line |
|---|-----|-------|----------|
| M1 | major | seating.js:1716, 1755, 1978 | Doorway sweep teleports the chair with no clearance check, along the doorway's own lane |
| M2 | major | seating.js:2001, 2148 | Post home wait counts from needs clock 0, so NPCs whose room loads later get no wait |
| m1 | minor | seating.js:1699, 1716, 1740 | Side doorways have two door sprites, so two gap rects whose midlines disagree; a chair can be sent into the other room |
| m2 | minor | npc-pathfinding.js:576, 585, 595 | Every failed search is run twice whenever any chair anywhere is seated |
| m3 | minor | path-avoid.js:172; npc-pathfinding.js (findNearestWalkableWorldCell) | Goal snapping no longer sees seated chairs, and a goal inside someone else's seated chair skips that chair's avoidance |
| m4 | minor | core/player.js:811 (not in the diff) | Direct player walks check line of sight once, against immovable bodies only: the 5793 stop at Amara's chair |
| m5 | minor | test/js/seating.test.mjs, path-seated-chairs.test.mjs | The sweep's wiring and skip rules, and the routed walk's leg advance, have no test that would fail on a regression |
| m6 | minor | seating.js:1987 to 2006 | needsSeatRef's JSDoc is now above postHomePending |

Synced state: nothing in the diff writes player_state. Chair moves (slideChairFootTo) stay client-side, the
sweep's log line goes to the capped in-memory needs log (npc-needs.js:4948), and the path searches hold
no state between calls. No growth.

Suites: bin/test-js on 8f608acac, 687 of 687 files pass.

## Majors

### M1. The doorway sweep teleports a chair, with no clearance check, into the doorway's lane

seating.js:1716 (`doorGapExit`) sends the chair straight out along the crossing axis, keeping its y (side
door) or x (front door), and seating.js:1755 moves it with `slideChairFootTo` (seating.js:1978), which sets
`chair.x/y` and calls `placeBody`. Nothing checks the target, and nothing glides. The doc comment says the
chair "slides out"; it jumps 50 to 70 px in one frame.

Failure scenario: the test case itself, Sanjay's chair at foot (13,79), goes to (67,79), box about 56..78 x
73..85. That is the office end of the doorway's approach lane at y 84, where the log already records Rosa's
`walk_rerouted` at (63..65,84) round walkers (5817). The chair stops blocking the gap and starts blocking
the lane 35 px further in. Elsewhere the target can be under a desk, a seated NPC, a wall strip or the
player: Arcade then separates the overlap, which pushes the player, or pushes the chair through a thin
wall body if it lands mostly inside it.

Suggested fix: pick the target from a few candidates (straight out as now, then one tile out plus one tile
sideways each way, nearer wall first), test each with a chair-sized box clear test (the `walkBoxClear`
pattern, ignoring the chair itself, and refusing any candidate that overlaps the player or an NPC), and
move the chair with the existing glide (`glides`, CHAIR_GLIDE_SPEED) instead of a teleport. When no
candidate is clear, leave it and try next second. Add a unit test for the candidate choice (pure, like
doorGapExit).

### M2. The post home wait counts from needs clock 0, not from when the NPC appears

`postHomePending` (seating.js:2001) waits while `now < POST_HOME_WAIT_MS`, and the caller passes the
global needs clock (seating.js:2147 to 2148). All needs states register at once at start
(npc-needs.js:587, registerAll), with `home: null`; an object home stays provisional until its room's
objects load, then retries once a second (npc-needs.js:1411, HOME_RETRY_TICKS 4).

Failure scenario: any needs NPC with an object home (`"needsHome": "<pc id>"`) in a room the player first
enters after 5 s. Its sprite and behaviour start when the room loads; its home is still provisional (the
spawn feet) for up to a second, the clock is long past 5000, so the wait is skipped and the first seat try
runs from the spawn spot. That is exactly the item 3 failure (fetch from beside the desk, `mount_stuck`),
proved on 5691. In test_needs_sims the office is the start room and Tom is fine; the next user of office
life (the m02 pilot, lab missions) has staff in rooms loaded later.

Suggested fix: wait unconditionally while `home` is null (it lasts one needs tick), and time the
provisional wait from the NPC's first seat check, for example
`behavior._postWaitSince ??= now; return now - behavior._postWaitSince < POST_HOME_WAIT_MS`
(clear it once the stop is tried). Keep postHomePending pure by passing the start time in. Add a test for a
provisional home first seen at clock 120000.

## Minors

### m1. A side doorway has two door sprites, so two gap rects that disagree on the door line

Each room makes its own door sprite: a west door at `room.x + 16` (doors.js:289) and an east door at
`room.x + width - 16` (doors.js:248). Unless the two rooms overlap by a tile, the office's and the
kitchen's sprites for one doorway sit 32 px apart, and `sweepDoorwayChairs` (seating.js:1740) builds a gap
rect from each. `doorGapExit` returns on the first rect that holds the foot and picks the side by that
rect's own midline.

Failure scenario: door sprites at x -16 (kitchen) and +16 (office). A chair foot at (8,79), on the office
side of a door line at 0, falls in the office sprite's rect first (mid 16), counts as west of it, and is
sent to 16 - 67 = -51: into the kitchen. The chair's room bookkeeping (and any post that counted it as
near) is then wrong. The unit test models one rect at x 0, so it does not see this.

Suggested fix: first log the real `doorProperties.worldX` of both kitchen doorway sprites on a live game (one
probe). If they differ, merge sprites that share a `connectedRoom` pair into one rect centred between them,
or choose the exit side by the chair's own room (the side whose floor holds it) instead of a midline.

### m2. A failed search runs twice whenever any chair anywhere is seated

npc-pathfinding.js:576 collects every seated chair in the world; npc-pathfinding.js:585 and 595 rerun any
search that finds nothing while that list is non-empty, whether or not the chairs were anywhere near the
route.

Failure scenario: the 5817 tour logged four reruns, all of the player's board searches behind the wall:
each was a full failed flood of the world grid, done twice. NPC replans towards a goal that is shut away
(a closed door, a return_stuck replan loop) pay double the same way, every replan. Cheap today with a few
seated staff; it scales with failed searches, which are the expensive kind.

Suggested fix: only rerun when the avoided cells could have mattered, for example when at least one seated
rect intersects the bounding box of start and goal grown by a few tiles, or skip the rerun when the goal
cell is blocked in the grid. A small cache of (start cell, goal cell) pairs that failed both ways, kept for a
second, also works.

### m3. Goal snapping no longer sees seated chairs

The live grid now leaves seated chairs out (npc-pathfinding.js:346), so `findNearestWalkableWorldCell`
(used by the player's click, core/player.js:821, and by `planSeatWalk`, seating.js:1408) can return a cell
inside a seated chair. `seatedAvoidCells` then skips that whole chair because the goal is within a cell of it
(path-avoid.js:172), so the route goes straight in.

Failure scenario: a tap on Amara's seated chair (5827 shows the bridge's click landing on her chair, "A
chair."), or an NPC approach cell beside a seated colleague: the path ends inside the chair, the walker
stops against it. Before 22724fa2f a chair that was seated when the grid was last built was blocked, and the
snap moved the goal off it. (A chair seated after the last rebuild behaved as now, so this is a narrow
regression.)

Suggested fix: in `seatedAvoidCells`, skip a rect for being near the goal only when it is the walker's own
chair or the seat being walked to (pass that chair in), and give the snap a version that treats seated
cells as blocked (snap with the seated cells marked, then search).

### m4. The player's direct walk checks line of sight once (the 5793 stop)

Not in the diff, but it answers the open question. `movePlayerToPoint` takes the straight walk when
`hasPlayerLineOfSight` is clear (core/player.js:811) and never checks again on that walk: the per-frame
check at core/player.js:1323 runs only while following a grid path. `hasWorldPhysicsLineOfSight` tests
static bodies and immovable dynamic ones only (npc-pathfinding.js, the `body.immovable` test after the
static pass). A wheeled chair is movable at rest (core/rooms.js:2808) and becomes immovable only when its
sitter mounts (seating.js:1596).

Failure scenario: the player starts up x 220 while Amara is pulling out or mounting her chair: line of
sight is clear, the walk is straight, then she sits and the chair turns solid in the lane. The player stops
with the feet at y 134 against box 217..239 x 118..129, as 5748 and 5793 recorded. The grid fix cannot help,
since no grid search runs.

Suggested fix: on a direct walk, if the body is blocked or makes no progress for about 10 frames, replan
once to the same target through `findWorldPath` (which now avoids seated chairs). Test: a stub chair that
becomes immovable mid-walk.

### m5. Tests that would not catch a regression in the wiring

- `sweepDoorwayChairs` is not exported or called by any test. Removing the `sweepDoorwayChairs()` call from
  `updateSeatedNPC` (seating.js:1766), or any of its skip rules (seated, fetching, mounting, gliding, the
  player's chair, moving), leaves every test green.
- The routed seat walk's leg advance (seating.js:1525 to 1527) is checked only by a source regex for the
  `planSeatWalk` call (seating.test.mjs, "a post seat waits..."). Dropping `m.leg++` passes.
- The post wait's wiring is a source-text match, so a reorder that keeps the line text passes.

Suggested fix: export the sweep with an injectable clock (or reset `doorSweepAt`), and test it with stub
`window.chairs`, `window.rooms[..].doorSprites` and a behaviour manager: a resting chair in the gap moves,
each skip case stays put. For the walk, a stubbed behaviour through `advanceSeatMove` with a two-leg route.

### m6. Orphaned JSDoc

postHomePending and its comment were inserted between needsSeatRef's JSDoc and needsSeatRef
(seating.js:1987 to 2007), so the "Where a parked needs NPC looks for a chair from" doc now sits above the
wrong function and has two doc blocks in a row. Move postHomePending above it.

## Other checks, no finding

- Async search: the seated cells come off in the finally, the callback runs from a timer with `_calcDepth`
  0, so the rerun starts from the callback and the caller hears once. In sync mode (planSeatWalk) the retry
  waits for calculate() to return and runs while sync is still enabled, so `path` is set before
  `disableSync`. A callback that starts its own search keeps the depth count right.
- Chairs moved, or NPCs standing, mid-search: EasyStar runs the whole search inside calculate()
  (npc-pathfinding.js comment at the leash rings), and the seated set is read at the start of each call, so
  nothing stale survives a search. A chair a sitter leaves is movable, so it is out of the grid either way.
- Rooms with no doors: the sweep returns before touching chairs. Reload: the needs clock restarts at 0
  (npc-needs.js:630) and the sweep timer is module state, so both start clean.
- Grid rebuild cost: `onSeat` is bodies x seated chairs per rebuild, a few thousand comparisons, only on
  rebuilds. Per search, `seatedChairBodies` filters window.chairs and pads each seated chair: small.
- The sweep runs from every NPC's behaviour update but returns on a Date.now() check except once a second.
- The 22724fa2f grid change only affects grid searches; the string-pull and every line-of-sight check still
  test physics bodies, which include seated chairs, so NPC shortcuts did not lose them.
- An immovable NPC body that overlaps a seated chair is left out of the live grid even if that NPC is
  standing (held by a conversation). NPC bodies in a baked grid are stale anyway, so this is harmless.
- Drivers: the job_beat watch is installed after the exchange that calls the job; install it before the
  call (as the log says). The tour's search logger wraps the instance method, and the rerun goes through
  `this.findWorldPath`, so reruns are logged too.

## Open questions

**Keep 22724fa2f?** Yes. It is small, the async and sync paths read correctly, and it fixes a real defect
the live runs did prove (5753: a chair seated at a door-open rebuild stays solid in the grid after its
sitter stands; one seated later was never there). That is a correctness fix for NPC routes and grid player
paths whether or not the board approach uses it. Take m2 (the double search) and m3 (snapping) with it.

**Face point for Marek?** Yes, and it can be scenario data only. Marek's coordinate home has no target
object, so `facePointFor` returns null (seating.js:2180, 1912) and the seat keeps the chair's own facing.
Every other office post is an object home on the desk (amara_pc, tom_pc, grace_laptop, rosa_laptop). Give
Marek an object on the spare desk (a toolbag or clipboard, with `affordance.useFrom` pointing south, dy 1) and
set `needsHome` to its id; he then faces north to the desk like the others. Check the approach cell lands on
the south side (the validator and one live seat), and keep the `chair 155` note in his comment honest. An
engine `face` field on coordinate homes is the alternative, but it is a new feature and needs its own tests.

**Row 6 at x 41, and 5793 at Amara's chair: anything in the code?**
- 5793 at Amara's chair: yes, m4. The straight walk is chosen once, line of sight ignores movable chairs, and
  her chair turns solid at mount. The waypoint route in the driver avoids it by not walking up x 220.
- Row 6 at x 41: nothing conclusive. Row 6's `read('kitchen_rota')` starts from the office mid points
  (232,176) and walks west, so a stop with the feet at x 41 puts the body's west edge at x 32, the office face
  of the doorway, three tries running. A fixed edge like that points to a body filling the doorway mouth
  rather than a walker. Candidates in the code: a resting chair in the gap that the sweep had not moved (it
  only moves chairs at rest, once a second, while an NPC update runs), or a chair the sweep moved there from
  the kitchen side because of m1. Next run, the row 6 snapshot (541a07a52) should also record each door
  sprite's `doorProperties` (worldX, open) and the last `chair_out_of_doorway` lines, so m1 can be ruled in or
  out.
