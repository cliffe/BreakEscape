# Code review R3: needs NPC walking home stalls behind a standing NPC (delta)

Branch fix/needs-return-npc-stall at b9cdbf597. Scope: `git diff ee425f13e..a97e9f8d8` (b8a345be7 engine, tests and docs; a97e9f8d8 live table, outcomes, drivers), then the merge of main.
Read-only review. Probes ran on `git archive` copies of the engines under review in a scratch folder (real EasyStar, real `_planMovePath`, the helpers from `npc-needs-return-standing-npc.test.mjs`). Nothing from the probes is committed.

| Severity | Count |
|---|---|
| B (blocker) | 0 |
| M (major) | 0 |
| m (minor) | 2 |
| n (nit) | 3 |

Recommendation: mergeable. One more live run is worth doing, but it is a confidence check on the old fault, not a gate on the fix (section 3).

## 0. Merge check

`git diff a97e9f8d8 b9cdbf597` on npc-pathfinding.js, npc-behavior.js, npc-needs-return-standing-npc.test.mjs, npc-local-avoidance.test.mjs and npc-needs-reroute-held.test.mjs is empty. Main's merge did not touch or undo any of them.

## 1. R2 findings

| R2 | Status | Notes |
|---|---|---|
| m1 standing NPC touching the home side | Resolved | `standingRing` and the `nearGoal && !nearStart` branch (npc-pathfinding.js:536-545, 563-564, 595-596). "R2 m1" fails on ee425f13e's engine (not ok 11, plain path) and passes on HEAD; I ran both. See section 2 for the soundness of the rule. |
| m2 repeated failing floods | Resolved as decided (no cap) | The doc states the held, tight, moving chain for every needs detour and the flood costs. Live timing: 0.1 to 0.6 ms for later plans, 5.7 to 14 ms for the cold first plan, no failed search seen. Reasonable. |
| m3 same-session contrast, the 6 s hold | Run, did not discriminate | See section 3. The 6 s hold stays unexplained and is correctly labelled "unconfirmed". |
| m4 references to gitignored files | Resolved | DIAGNOSIS.md, DIAGNOSIS_M08.md and the drivers are under docs/achitechture/reviews/return-stall/. `grep tmp/rs` in the committed code and tests now finds only the drivers' own `cd tmp/rs` lines, which the outcomes note admits (the drivers need the scratch layout). |
| n1 "a pixel or two" | Resolved | Test comment, doc and R1 outcomes now give the depth. |
| n2 local avoidance and the touching start | Resolved | Corrected in the same places. |
| n3 'plain' detour tier | Resolved | Renamed 'moving' (npc-behavior.js:2043-2067); the test in npc-local-avoidance.test.mjs follows. |
| n4 stale line numbers | Resolved in the docs copy. |
| Touching-start todo | Resolved | Now a passing test that bounds the overlap at 1 px and asserts no lane stop. |

## 2. The goal-side rule

Definition (npc-pathfinding.js:528-545). `nearStart` and `nearGoal` are each the 5 by 5 cell block (END_RING_CELLS 2, 8 px cells) round the start and goal cells, and only when `includeHeld`. A standing, movable NPC's ring cell is released only when `nearGoal && !nearStart` and the cell fails `standingRing`: no box overlap with the walker and not within 14 px of his centre on both axes. The body's own cells are never released.

Can "near the goal" cover the start side of a short walk? Two cases.
- Start and goal within 4 cells of each other: every cell near the goal is also near the start, so `!nearStart` keeps the full ring. A walk this short (under 32 px) also ends at once in `updatePatrol`: the tile guard at npc-behavior.js:1432-1445 triggers arrival when `arriveWithin` is 0, and the return home walk (npc-needs.js:4214) sets none. It is checked before `_handleBlockerAhead` (:1493).
- Start and goal 5 to 8 cells apart (40 to 64 px): the cells 3 or more cells from the start but within 2 of the goal are on the start side and get the lane rule instead of the whole ring. This does not undo the m08 fix. The m08 fault was a path 11.3 px from the standing NPC; the lane rule keeps every released cell outside a 14 px square round his centre, and two adjacent open cells (8 px step, diagonals included) cannot be joined by a chord closer than 14.1 px to his centre (worst case the corner chord x+y = 20.2, 14.3 px away). The lane is 13 px. Measured on short walks (start 40, 48 and 56 px from the home, standing NPC 11 to 12 px from the start) the planned path is identical to the previous engine's in two of three cases and differs by one waypoint after the start in the third; the lane hit in those probes is the start's own adjacency, present on both engines and unavoidable.

Can a final leg end in the lane so the walker stops short? Only through the goal cell, which is exempt by design. Local avoidance looks 42 px ahead (AVOID_LOOKAHEAD_PX), and the last segment is extended past the final waypoint for the look-ahead that is left. For a standing NPC to be counted, the extension has to reach his centre. When the walker is 32 px or more from home (the arrival guard has not fired) at most 10 px of look-ahead is left beyond the home, so a standing NPC more than 10 px past the home is never counted, and one closer than that overlaps the home, which no planner can fix and which the stall watch already handles. Nothing in the rule plans a stop short of home. The head-on approach (guard 20 px beyond the home, no chair) is unchanged from the previous engine (probe A, A2: same path, same 4.00 px overlap on both).

The 3.2 px graze. In the probes the same final turn, and a plain head-on arrival at a home 20 px short of him, overlap by 3.2 to 4.0 px; the 4.0 is the 4 px snap between the home point and its cell centre, so it exists on the previous engine too. In play: the walker is already inside the 32 px arrival radius when it happens, so the walk has ended and the needs layer places or settles it; if the walker is still moving, the Arcade NPC to NPC collider separates the two bodies by at most the overlap depth in one step, no velocity is carried (movable bodies, small depth). Hostility: `npc-hostile.js` attack range and damage act on the player only, and punch detection lives in `player-combat.js` on a player punch; a body overlap between two NPCs reaches neither. So a graze cannot trip a hit, a push of the player, or hostility. No finding.

### m1. The goal-side rule has one test geometry
- Where: test/js/npc-needs-return-standing-npc.test.mjs, "R2 m1" (last test).
- The test covers a home with a chair on the west side and the walker arriving from the east. It does not cover (a) the walker arriving from the side of the standing NPC, (b) the standing NPC at the 14 to 20 px boundary on the diagonal, or (c) the m08 start case with the goal 5 to 8 cells away. My probes (section 2) show the previous and current engines agree on a, b and c, so nothing is wrong today; the risk is a later edit to `nearStart`/`nearGoal` or `LANE_PX` that changes one of them silently.
- Fix: add the three probes as cases (a `probe()` helper over `floor()`, `walker()`, `plan()` and `inLane()`; the expected result is the ring tier and no lane hit beyond the start's own adjacency), or at least (c), because it is the one that protects the m08 fix from the new rule.

### n1. The 4 px bound sits on the unavoidable value
- Where: "R2 m1", `assert.ok(worst <= 4, ...)`.
- The measured graze is 3.2 px and a straight head-on arrival gives 4.00 (the home cell snap), so the bound passes a change that raises the graze from 3.2 to 4.0. Fine as a guard against a large regression; say so in the comment, or bound at 3.5 if the aim is to hold the current value.

### n2. `LANE_PX` duplicates the lane width
- Where: npc-pathfinding.js:538 (`LANE_PX = 14`) against npc-behavior.js:65 (`AVOID_LANE_HALF_PX = 13`, not exported). If the lane is widened the planner keeps releasing cells inside it and the m08 loop returns without a test failing, except the m08 case if its numbers happen to land there. Export the constant from one place or add a test that reads both.

### n3. The near-arrival comment says "timer"
- Where: npc-pathfinding.js:~533 ("the near-arrival timer (32 px) ends the walk") and REVIEW_R2_OUTCOMES.md. For the return home walk (`arriveWithin` 0) the 32 px guard fires at once (npc-behavior.js:1440, `!tol`); the 1.5 s timer applies only to walks with `arriveWithin` (use, queue and pair cells). Say "the 32 px arrival guard".

## 3. The live m3 run

Result: 4 of 4 trips on the old engine and 4 of 4 on the branch engine went home in 3.5 to 3.6 s, with Vector placed at body y 152.7 and 157 (the stalling height). Earlier natural run: 4 of 9 trips stalled on f48c80af8 and 1 of 9 on the unfixed engine.

What the drivers show. `trip.js` (natural) and `trip3.js` (placed) both wait until she is home and idle plus 3 s, then set thirst to 5 on julian_sallow and agnieszka_duda. `trip3.js` adds (a) a wrapper round `findWorldPath` that logs each plan from her position, (b) `V.body.reset(PLACE - (centre - sprite))` on Vector followed by 1.5 s, (c) probes installed only at a hold of 3 s or more. No hold occurred, so no snapshot was taken on any trip. The log of the old trips says only "a plain first plan, then at most one ring plan". It does not record whether the first plain plan passed within 13 px of Vector, and it does not record `_dynamicBlockers()`.

Most likely reasons, in order.
1. The placed Vector was not a lane blocker, or the first plain path did not pass within 13 px of him. The stall needs both (DIAGNOSIS_M08: path along body y 164, Vector's centre 11.3 px off it, Vector in `_dynamicBlockers()`, which skips any body that is `immovable` or not `enable`d, npc-behavior.js:1737-1758). `body.reset` leaves `immovable` and the NPC's behaviour state alone, so if Vector was idle with his body immovable at rest, he was invisible to the lane check on both engines. In the natural runs he had been shoved by earlier trips and was a movable body. The driver does not log `immovable` outside a hold snapshot, which is the missing fact. Her natural start (sprite near (532,188) before the diagonal onto y 164) may also differ from a thirst trip begun from a slightly different idle spot.
2. The fault is intermittent in the old engine, and the sample is small. On the unfixed engine the earlier natural rate was 1 of 9; four clean placed trips is likely at that rate (about 0.63 at p 0.11, about 0.1 at 4 of 9). The DIAGNOSIS_M08 sentence "Vector's height decides stall or no stall" is now contradicted by four old-engine trips at the stalling height that did not stall, so it needs softening (m2 below).
3. The comparison engine is f48c80af8^ (main), while the stalls and the diagnosis come from f48c80af8. The two differ only by the tight tier in `_planMovePath`, which the diagnosis says never ran, so this is unlikely to matter, but it is not the engine R2 asked to run.

Evidence to merge. Sufficient. Reasons: (1) with the tier asserts removed, the two m08 tests ("never planned into the avoidance lane", "the local detour is not the same blocked path") fail on f48c80af8 and pass on HEAD (run here), and "R2 m1" fails on the previous HEAD; all fail on main when run as written. These tests use real EasyStar, the real planner and the lane function the engine uses, on the diagnosed geometry (Vector at (486.4,152.7), start (508,164)). (2) The branch engine took 11 of 11 natural-plus-placed trips home with no `return_stuck`, 8 of them at the stalling height or above, and 8 more in the m3 run. (3) The fix removes a rule that was wrong on its face (a standing NPC's ring softened near the start), so the live contrast would add confidence about the old fault, not about the new behaviour.

One more live run: yes, cheap, not blocking. Set-up.
- Engines: f48c80af8 (not main) against HEAD, alternating, 3 fresh games each, same driver (`trip3.js`).
- Before each trip, log from the page: Vector's `body.immovable`, `body.enable`, `body.velocity`, whether `behavior._dynamicBlockers()` contains `agent_vector`, and Agnieszka's body centre. Right after her first plan, log `nearestBlockerOnPath(pos, path, _dynamicBlockers(), 42, 13, 0)` for that path. If that is null on f48c80af8, the first plain plan avoids the lane and the placed set-up cannot reproduce the fault; if it is non-null and she still does not hold 3 s, the lane check is not firing (check the arrival guard and `_avoid` state).
- Get the natural condition instead of the reset: run one full trip first (as the earlier games did) so Vector has been shoved, then read his height; use `reset` only to nudge the final y, and keep his `immovable` value as found.
- Record the start of the walk (body centre when she turns `returning`) in every row, so a different start cell is visible.
- Pass: either f48c80af8 stalls at least once with a hold snapshot (then HEAD must not), or the log shows why it cannot (Vector not a blocker, or the path outside the lane), which closes m3 either way.

### m2. DIAGNOSIS_M08 still says Vector's height decides stall or no stall
- Where: docs/achitechture/reviews/return-stall/DIAGNOSIS_M08.md, last bullet of "Why she holds".
- It reads "That, not the engine, decides stall or no stall, so 1 of 9 against 4 of 9 is noise from his position." The m3 run (a97e9f8d8) put Vector at 152.7 and 157 and got no stall on the old engine in 4 of 4, so the height alone does not decide it. The conclusion the branch rests on (the planner puts the path inside the lane, shown by unit tests) stands; the stall rule as written does not.
- Fix: one sentence: the height is necessary, not sufficient; the 4 of 4 clean placed old-engine trips in LIVE_RETURN_STALL.md are unexplained until the run above.

## 4. Tests

- `bin/test-js` (full) on b9cdbf597: 825 files passed, 0 failed, 825 total. (R2 reported 812; main's merge added the rest.)
- `node test/js/npc-needs-return-standing-npc.test.mjs`: 11 pass, 0 fail, 0 todo on HEAD; on the ee425f13e engine 10 pass and "R2 m1" fails; on f48c80af8 with tier asserts removed the two m08 tests fail.
- `ruby scripts/validate_scenario.rb scenarios/m08_the_mole/scenario.json.erb`: 0 errors (0 known), 17 warnings. `git status` shows no modified or new dungeon_graph files, so nothing to restore.
