# Code review R1: needs NPC walking home stalls behind a standing NPC

Branch fix/needs-return-npc-stall, `git diff main...HEAD` (engine fix f48c80af8; scenario 06039b92a, 0ed00fdd2; proof b647a6eef).
Read-only review. Tests: `bin/test-js test/js/npc-*.test.mjs test/js/needs-*.test.mjs test/js/path*.test.mjs`: 94 files passed, 0 failed.
Extra probes: a scratch copy of the new test's harness (real EasyStar, real `_planMovePath`) with the engine's waypoint advance, a walker pressed against the guard, other body sizes, and a home hemmed by chairs. Not committed; outside the repo.

| Severity | Count |
|---|---|
| B (blocker) | 0 |
| M (major) | 3 |
| m (minor) | 6 |
| n (nit) | 4 |

## Diagnosis check

The diagnosis matches the code.
- `_planMovePath` (npc-behavior.js:2065) runs the held-aware search only when `_moveOwner === 'needs' && _moveReroute`, and on no path fell back to the plain search.
- `_avoidDynamicPositions` (npc-pathfinding.js:513) avoids every other body's cells plus one cell all round, the ring opened only within `END_RING_CELLS` (2) of the start and goal. Standing NPCs are included (movable bodies pass the `immovable` check).
- The new test's third aisle size confirms the numbers: 40 px (5 cells) gives no ring path, 56 px and up gives one.
- Line numbers for the stall watch are stale after the merge: `_watchReturn` is now npc-needs.js:4224, `_goHome` 4198 (see n1).

## Scope of the new tier

- Runs only inside the `_moveReroute` branch of `_planMovePath`. Normal routing, patrol legs, chase paths (`smoothWorldPathForPlayer`, npc-behavior.js:3040), the player's search and the local detour (`_requestDetour`, npc-behavior.js:2029) are unchanged.
- `_moveReroute` is set by the needs stall watch on return (npc-needs.js:4271, 4229, 4319, 770), by outbound `walk_rerouted` (npc-needs.js:4393), and by the wedge recovery for any needs goToAndStay (npc-behavior.js:1603). It stays set for the whole move, so the `_needsPathRecalc` re-plan (npc-behavior.js:1344) also runs three tiers. Wider than "walk home" (m5).
- Patrol and chase walkers: their own plans are untouched. As obstacles they are avoided at their position at plan time, as before.
- Doors: the tier adds avoid points only; door grid edits (doors.js) are unaffected.
- Local avoidance lane (`AVOID_LANE_HALF_PX` 13) is narrower than the tight reach for 20x10 bodies (14 vertical, 24 horizontal), so a walker on a tight path is not flagged as blocked by the body it passes. Checked; no conflict.

## Geometry of `tight`

At cell centres the margin is right. A cell is free when the centre-to-centre gap on either axis is at least the two half-extents plus 4 px. EasyStar's no-corner-cutting test ignores avoid points (vendor easystar-0.4.4.js, `isTileWalkable` checks the grid only), so diagonal steps between two free cells happen; the midpoint of such a step loses 4 px on each axis, which lands exactly on touching. So the half-cell margin is the minimum for straight-line steps between centres, with no slack.

Body sizes: the walker uses its own `body.width/height`; others use their own box, so a smaller seated body gives a smaller reach. A guard 20x16 in a 40 px aisle gives no tight path (falls to plain), as does a 16x8 seated body in a 32 px aisle; a 24x12 walker past a 20x10 guard in 40 px gets a path whose centres keep clear. I found no case where `tight` plans a route through a gap the walker's box cannot pass at the waypoints. The gaps are in how the path is followed (m1) and near the ends (M1).

## Cost per stalled re-plan

Up to three `findWorldPath` calls (ring, tight, plain), and each can rerun once with `ignoreSeated` when seated cells were touched (npc-pathfinding.js:680-696): up to six EasyStar searches, against four before. A failing search floods the whole reachable region synchronously (`iterationsPerCalculation` is unlimited). There is no cap beyond the callers' cadence: the stall watch every `RETURN_YIELD_MS` (3 s), the wedge recovery every `NPC_STUCK_MS` (4 s), and collision re-plans. Acceptable for one walker; see m2 for many.

## Findings

### M1. `tight` has no near-end softening: a pinch on the route plus a home beside a chair still falls through to the plain path
- Where: npc-pathfinding.js:554-569 (`avoidTight`), against the ring's `nearEnd` rule at 528-530 and 541.
- The ring tier keeps ring cells within 2 cells of the start and goal open (round 7, game 5439: a home always has the NPC's own chair, often a seated neighbour, next to it). `avoidTight` exempts only the start and goal cells themselves. Its reach (other half + walker half + 4 px) round the NPC's own chair or a seated neighbour covers the cells next to the home cell, so the goal is sealed.
- Failure scenario: the m08 shape the diagnosis describes, a standing NPC in a 40 px aisle on the way to a desk post with a chair beside it. Ring tier fails at the aisle, tight fails at the home, plain runs into the standing NPC: the original loop. Reproduced on real EasyStar: 40 px aisle with a 20x10 guard, home with a 16x12 chair 14 px north and one 14 px south. Without the guard the ring tier finds a path. With the guard the calls go ring (no path), tight (no path), plain. `tight` alone, no guard, same home: no path.
- The live proof room does not have this (the clerk's chair is fetched, not beside a sealed home), and the unit test has no chairs.
- Fix: give `tight` the same end rule. Within `END_RING_CELLS` of the start or goal, avoid only the cells the other body itself covers (as the ring tier does), or shrink the reach there to the bare half-extent sum without the half cell. Add a unit case: pinch plus a home flanked by two chairs, expecting the tight path, not the plain one.

### M2. No live proof that the fix changes anything
- Where: scenarios/test_npc_needs/LIVE_PROOF_RETURN_STALL.md, section "Contrast with the pre-fix engine".
- The pre-fix engine also got the clerk home in 3 of 3 runs plus three probes, so the test_npc_needs rig shows no regression but not a fix. The only evidence for the fix is the new unit test, whose motion model is idealised (m1) and whose layout lacks chairs (M1).
- Failure scenario: the change lands, m08 still stalls (for example by M1), and the proof note reads as if it was proven.
- Fix: hold the merge on the m08 contrast now running (pre-fix stalls, fixed engine gets home). If m08 cannot be reproduced, build a rig where the guard cannot be slid past (desk and chair either side, as the note itself says) and show the before/after there.

### M3. The stall rig changes the core needs regression scenario
- Where: scenarios/test_npc_needs/scenario.json.erb:104-107 (four tables) and 175-186 (`aisle_guard`).
- test_npc_needs is a capture target for the needs regression runs (tools/playtest/needs-baseline-capture.js:55, profile `test_npc_needs`; docs/achitechture/access_model_needs_baseline/*/test_npc_needs.*.json), the seat-box baselines (tools/playtest/baselines/seatbox-s0/s1/s5-stand.json include its 12 chairs), and the near/far `npc_used` proof in NEW_FEATURES_TEST_MATRIX.md:11, 43-45.
- The desk column now splits the room: every clerk coffee trip squeezes past a standing NPC through a 40 px gap, and the guard is not static (the proof saw it shoved from y 78 to y 109 during the chair fetch). Chair `test_room_chair-white-1-rotate8_153` has its castor at (117, 108.7) and approach (100, 92), right at the top of the new column (x 108 to 140): its seat-box result may change or the chair may be shoved at spawn.
- Failure scenario: the next before/after needs capture or seat-box comparison on test_npc_needs reports differences that come from the layout, not the engine, or an unrelated regression is hidden in the new pathing noise.
- Fix: move the rig into its own scenario (for example `test_needs_return_stall`) or a separate room off the existing routes, and leave test_npc_needs as it was. If it stays, re-capture the seat-box and needs baselines for test_npc_needs on this branch and say so in the proof note. No Ruby test or Hacktivity fixture loads test_npc_needs (grep of test/, tools/, docs/); test/js/inventory-menu.test.mjs reads the file for droppables and still passes.

### m1. The new test walks the path more precisely than the engine does
- Where: test/js/npc-needs-return-standing-npc.test.mjs:75-84 (advance at 1 px of each waypoint, walker starts 15 cells from the guard), against npc-behavior.js:1457 (advance at `distance < 8`).
- The engine turns for the next waypoint up to 8 px early, cutting the inside of each corner, and the half-cell margin has no slack for that. In the real stall the walker starts pressed against the standing body. Probe: walker touching the guard (centres 20 px apart), 40 px aisle, 8 px advance: the step at (262, 189) enters the guard's box. With 1, 4 or 6 px advance, or 21 px apart, it does not. A graze, which physics may slide off, but the test cannot see it.
- Fix: step with the engine's 8 px advance; add cases that start touching the guard on each side; add a different-sized pair. If the touching case clips, raise the margin near corners or advance at a smaller radius on rerouted walks.

### m2. Search count grows and is uncapped
- Where: npc-behavior.js:2069-2086; npc-pathfinding.js:680-696.
- Up to six EasyStar searches per re-plan; a failing tier floods the region synchronously. With several office-life NPCs stalled at one choke (a kitchen queue, a corridor at shift change), their 3 s re-issues and 4 s wedge recoveries line up.
- Fix: skip the tight tier when no movable or held body lies within a few cells of the straight start-goal line (the ring search failed for a static reason), or remember per walker that tight failed for this goal until a body moves. At least log the tier used, so a live run shows how often tight runs.

### m3. The local detour has no tight tier
- Where: npc-behavior.js:2029-2062 (`_requestDetour`: held ring, then plain ring).
- Mid-walk, a needs walker that meets a standing NPC in a 40 px aisle runs the local detour, which still uses the ring and gives up; it then backs off or squeezes. Only a later stall re-issue reaches the tight tier, after `RETURN_YIELD_MS`.
- Fix: for needs walks, add the tight search between held and plain in `_requestDetour`, or document why the stall watch is the only entry.

### m4. Players and seated colleagues get the tight reach too
- Where: npc-pathfinding.js:571-582 (`avoidBody(pb)` and NPC sprites both go through `avoidTight`).
- A rerouted needs walker now passes a player who stands in an aisle of 40 px or more with 4 px of clearance; before, it ran into the player and went through the `_notePlayerBlock` pass logic. That changes the office-life body-block lever. Seated bodies are smaller than their sprites, so the walker can pass visibly through a seated colleague's legs.
- Fix: decide per body. Keep the ring for the player (or add the player's berth), and pad seated bodies to the sprite footprint, or say in the plan that both are intended.

### m5. The tier also changes outbound walks and wedge recoveries
- Where: npc-needs.js:4393 (`walk_rerouted`), npc-behavior.js:1603, 1344.
- The commit message, comment and diagnosis talk about the walk home. The same three tiers run on rerouted outbound trips and on any wedged needs goToAndStay, and on collision re-plans while `_moveReroute` stays set.
- Fix: say so in the comment at npc-behavior.js:2072 and in OFFICE_LIFE_STUCK_RETURN.md; the regression captures in M3 should cover an outbound trip.

### m6. The leash on the tight tier is untested
- Where: npc-behavior.js:2081 (`tight.avoidRooms = rooms`); test/js/npc-needs-reroute-held.test.mjs:139-152 sets `_moveAvoidRooms = []`.
- Failure scenario: a later edit drops the leash from the tight options and a rerouted walk cuts through a forbidden room; no test fails.
- Fix: one assertion with `_moveAvoidRooms = ['x']` that `calls[1].avoidRooms` is `['x']`.

The updated expectation in npc-needs-reroute-held.test.mjs (three searches, the second `tight`, the third plain) is right: it states the intended change and hides nothing, because the stub returns no path for every held-aware call.

### n1. Diagnosis line numbers are stale
tmp/rs/DIAGNOSIS.md:4 cites npc-needs.js:4198 for `_watchReturn`; it is now 4224 (4198 is `_goHome`), and the `return_stuck`/`return_abandoned` lines moved by about 26.

### n2. The third new test asserts the bad behaviour
test/js/npc-needs-return-standing-npc.test.mjs:112-116 asserts `stalled === true` for a 16 px aisle. It locks in "runs into the body" rather than "plans the plain path when nothing fits". Assert only that the plain path is returned (the third call has no `avoidDynamic`).

### n3. Uncleared timers in the new test
npc-needs-return-standing-npc.test.mjs:69-72 leaves a 1.5 s `setTimeout` per walk; the file waits about 6 s for nothing. Clear the timer on resolve.

### n4. The guard borrows the clerk's ink and a new voice
scenario.json.erb:182-185: talking to `aisle_guard` plays the clerk's "I will be at my desk, mostly." in the Charon voice, which has no cached TTS. Give it a one-line ink of its own or no `storyPath`, and no `voice` unless voicing is approved.
