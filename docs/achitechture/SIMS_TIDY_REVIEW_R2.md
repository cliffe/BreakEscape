# Sims tidy, review round 2

Branch build/ol-sims-tidy at aa849748f. Delta review of the R1 fixes (`git diff af5344f84..HEAD`) and the
two open live problems from the R1 Outcomes. Stopped at the context guard: the row 3 live probe did not
finish (see "Row 3" below).

**Counts: B 0, M 0, m 4.**

| # | Sev | Where | One line |
|---|-----|-------|----------|
| m1 | minor | path-doorways.js:155, core/player.js:1471 | The direct walk stall window counts render frames, so a free walk on a high refresh display reads as a stall |
| m2 | minor | npc-pathfinding.js:583 to 587 | Directional conditions also forbid diagonal steps beside every seated cell, padding included; stricter than before and tested only with stubs |
| m3 | minor | seating.js:1882 | A sweep glide that ends blocked inside the gap is retried, and logged, every second with no limit |
| m4 | minor | tools/playtest/needs-tour-regression.mjs:207 | Row 3 counts `npc_need_parked` as a turn-back, and records nothing about why no queue formed |

Main merges since af5344f84 (616b971d6): clean, hampshire ink and train-check.sh only, no engine file.

Live problems:
- **Row 3: not shown to be a regression from this branch; cause not proved.** The failure is that no
  queue formed, not that a walk failed. Details below.
- **Doorway jam (5970): not a regression.** The same lane jam is in tours from before this branch's
  pathfinding change, and no seated chair (so no seated cell) was near.

## Findings

### m1. The direct walk stall window is frame-counted

`directWalkStall` (path-doorways.js:155) replans when the distance gained over the last 10 calls is under
5 px, and core/player.js:1471 calls it once per render frame. The player moves at MOVEMENT_SPEED 150 px/s
under fixed-step Arcade physics (60 steps a second), so the gain per render frame is 150 / refresh rate.

Failure scenario: a 360 Hz display. A clear straight walk gains about 0.42 px a frame, 4.2 px per window,
so the first window replans the walk through the grid: the walk loses its straight line and the click
indicator, and the one replan per walk is spent before any chair turns solid. At 240 Hz the margin is
1.25 px. The unit test "a shallow 0.4 px/frame slide does replan" is the same signal as a free walk at
360 Hz.

Fix: measure the window in time, not frames. Keep (time, distance) pairs and call it a stall when, over
the last 150 to 200 ms, the gain is under a third of `MOVEMENT_SPEED * elapsed`. Pass `loop.delta` (or
`scene.game.loop.time`) in from player.js. Test: a free walk at 0.42 px per 2.8 ms frame
never replans; a blocked one does.

### m2. Directional conditions are stricter than the old avoided points

npc-pathfinding.js:583 to 587 blocks every seated cell, padding included, with a directional condition
that allows no direction. With `disableCornerCutting` (npc-pathfinding.js:416), EasyStar 0.4.4 checks
both orthogonal neighbours of a diagonal step with `isTileWalkable`, which honours directional
conditions but not `avoidAdditionalPoint`. So before a80f4ddb0 a route could step diagonally past the
corner of a seated chair's padding; now it cannot. The touch probe is right (the corner test reads the
condition's length too, so the rerun still fires), but a gap that only a diagonal step joined now fails,
and the rerun drops all seated chairs and may route straight through the chair it was avoiding.

Failure scenario: a seated colleague's padded cells end one cell from a desk corner, leaving a diagonal
gap. The first search fails, touched is true, the rerun ignores every seated chair and the NPC walks into
the seated chair (walk_rerouted then walk_stuck). Not seen in the three tours (no stall had a seated
chair within 64 px), so this is a latent change, not a proved fault.

Fix: put the condition only on the chair body cells (the cells a collider must never clip), and keep the
padding as `avoidAdditionalPoint` cells, which a diagonal can still pass. Touch tracking then fires on
body cells only, which is when a rerun can matter. Add one test that runs the real EasyStar 0.4.4 code
(vendor the single file under test/js/vendor; the CDN copy is what the game loads), with a diagonal-only
gap beside a padded chair. path-seated-chairs.test.mjs uses a stub that reads the condition only when
told to, so it cannot catch a semantics change in the library.

### m3. A blocked sweep glide retries forever

The sweep moves a chair with `glideChairFootTo` (seating.js:1882), which stops where blocked (8 still
frames). Only the target box is checked, not the line to it. If the chair stops still inside the gap (a
wall corner square across the line, or a walker in the doorway), the next second's sweep sees the same
foot in the gap, picks the same spot, glides again and writes another `chair_out_of_doorway` line.

Failure scenario: a chair resting at the office end of a side gap, its spot 0 across the wall strip
corner (the 5971 proof slid round it, a squarer hit would not). The chair nudges at the corner once a
second and the capped needs log fills with the same line, pushing out the stall lines the tours read.

Fix: keep `chair._doorSweep = { from, tries }`; after three tries from the same rounded foot, log
`chair_in_doorway_no_spot` once (as the no-spot path does) and skip that foot until the chair moves. Or
try the next candidate on each retry. Unit test with a stub glide that never moves the chair.

### m4. The tour's row 3 report misreads parks as turn-backs

needs-tour-regression.mjs:207 builds `turned_back` from `npc_turned_back` and `npc_need_parked`. In 5969,
5970 and 5971 the list is `tom, sanjay`, but both lines are `npc_need_parked` with reason `no_source`, at
266 s and 300 s, and no `npc_turned_back` with reason `off` was logged. The R1 Outcomes line "Tom and Sanjay
do turn back" comes from this. The row also records no board-read clock and no need levels, so it cannot
show why nobody queued.

Fix: keep the two lists apart (`turned_back` from `npc_turned_back` reason `off` only, `parked` separately),
and record the needs clock, each of amara/tom/marek's caffeine and job phase at the board read and every
5 s until the switch-off. The probe at scratchpad `r2/row3b.mjs` does the second half.

## Part A, other checks (no finding)

- Doorway sweep: candidates, lanes and spot choice are pure and tested; `chairSpotClear` counts every
  enabled body but the chair's own (conservative), and the floor test rejects wall rows. The sweep runs
  once a second on wall time from every NPC update and only tests boxes for chairs in a gap: no per-frame
  cost worth noting. `doorGapRects` merges by room pair, axis and distance, and a single sprite (the live
  case) passes through unchanged.
- `postHomePending`: null home waits, provisional waits from `_postWaitSince`, set on the first seat check
  at the post. The key is per stop, so a return to the post does not wait again. Correct.
- Touch tracking: the condition object's `length` getter is read both when the search tries to enter a
  seated cell and in the corner test beside one, so an untouched failure skips the rerun. Conditions are
  cleared in the `finally` after `calculate()`, which in 0.4.4 runs the whole search. No other code sets
  directional conditions on the world pathfinder, so `removeAllDirectionalConditions` clears nothing else.
- `keepSeated`: `seatedChairBodies` returns the bodies themselves (npc-pathfinding.js:111), so
  `keep.includes(r)` matches `chair.body`. The start end still skips any rect it is in; the goal end only
  the kept one. `findNearestWalkableWorldCell(..., { avoidSeated })` builds the key set per call: small.
- Player: the replan clears `onMoveIntent` and the click indicator, skips line of sight, and is once per
  walk; hold-walk and cancel disarm it. Cost: an 11-entry array per frame while armed.
- Marek's face point: data only (`marek_tool_roll`, `useFrom 0,1`); the tours show him fetching chair 155.
- Tests failing on old code: taken from Handover 6c (path-doorways 2, seating 4); not rerun here.

## Row 3: verdict and evidence

Every earlier tour with a row 3 ticked `see_coffee_off`: 5472, 5475, 5480, 5523, 5554, 5657, 5658, 5691,
5733, 5817 (`wait.ok` true, `queued_at_off` non-empty, a `npc_turned_back` reason `off` in `after_off`).
5817 is the last pass before the R1 fixes, on the same direct board route. All three new tours (5969, 5970,
5971) end the 150 s wait with `queued_at_off: []`, after two board reads that both report `read: true`.
The switch then goes off with nobody queued, so no `off` turn-back can happen and the task cannot tick.

Why nobody queued: the board read sets Tom's and Amara's caffeine to 10 (scenario.json.erb:588 and 668),
which should send them to the coffee within seconds. Tom's park at 266 s instead fits plain decay from his
row 1 cup (return at about 89 s, 20 a minute down to urgentAt 40 takes about 3 min), and Amara refetched her
chair at 284 s. So in these runs the board read left no sign in the needs, or they went one at a time
without overlapping. No stuck line, no `walk_rerouted` and no stall touches Tom or Amara between the board
reads and the switch-off, so the movement changes (directional conditions included) did not stop a walk.

No commit since 5817 touches the needs system, the event mappings or the board: the diff is seating,
pathfinding, the player's direct walk, Marek's home and the tour driver's row 6. So there is no line of
reasoning from the diff to "nobody queues". Verdict: **not shown to be a regression; cause open.**

Next step: run scratchpad `r2/row3b.mjs <gid> 3093 <out>` with BOARD_ROUTE=direct on HEAD and on af5344f84
(a hand-made worktree). It is the tour cut after the board read, then a 4 s snapshot of each of
amara/tom/marek (caffeine, job, phase, seated) for 2 minutes and the needs log from the read on. If the
caffeine never drops to 10 on HEAD but does on af5344f84, bisect the 13 commits; if it drops and they drink
one at a time, the driver's "two in the queue" premise is what changed, not the engine.

## Doorway jam: verdict and evidence

**Not a regression.** In 5970 at needs clock 375 to 387, Grace (41..44,84) and Rosa behind her (56..60,84)
walk west into the kitchen doorway corridor while Sanjay (5..7,84) returns east through it. The corridor is
the gap between static strips at y 60..68 and 92..100, and every snapshot lists only those strips, the two
other walkers and wall bodies: no chair, seated or loose, within 64 px. Seated cells are the only cells the
directional conditions touch, so they play no part here. The same head-on in that lane is in tours that
predate the branch's grid change (22724fa2f) and the R1 fixes: 5472 (tom, sanjay, marek at y 73 to 90),
5475 (tom, grace at y 83 to 86), 5554 (tom at -38,84), 5657 (the pre-fix baseline: tom twice, grace at y 84).
5658, 5733, 5817, 5969 and 5971 have none. It is the known two-way doorway problem (office life backlog),
not something this branch introduced.

## Runs this round

Keyless server on :3093 from the worktree (stopped). Games: 6001 (probe crashed at the row 3 hook, a
script bug), 6005 (probe stopped at the context guard before row 1 finished). One earlier new-game call
printed no id (probably 6000); not driven. Scripts in the session scratchpad `r2/`.
