# Outcomes of code review R3 (needs NPC walking home stalls behind a standing NPC)

Branch fix/needs-return-npc-stall. Engine and test changes in 5bb5cf541. 0 B, 0 M, 2 m, 3 n in the review; all five addressed, plus the one more live run.

| Finding | Outcome |
|---|---|
| m1 the goal-side rule has one test geometry | Three tests added to test/js/npc-needs-return-standing-npc.test.mjs. (a) "R3 m1 (a)": the standing NPC between the start and the home (on the line, 10 px above and 10 px below), ring tier, no lane hit. (b) "R3 m1 (b)": the NPC on the 14 to 20 px diagonal of the home (four offsets), ring tier, no lane hit. (c) "R3 m1 (c)": the m08 start with the home 5, 6, 7 and 8 cells away, no lane hit. All three pass on HEAD. On f48c80af8 (tier asserts removed, since that engine has no `_planTier`): (a) fails (a lane hit, Vector-style standing NPC 10 px off the path), (b) passes, (c) fails (path along y 164, lat 11.3 from Vector). Note on (a): with the NPC behind the home (20 px past it) the path ends in his lane on every engine, because the goal cell is exempt and the 32 px arrival guard ends the walk; that case is not asserted. |
| m2 DIAGNOSIS_M08 "Vector's height decides" | Last bullet of "Why she holds" now says "Vector's height is necessary, not sufficient" and cites the m3 runs; an R3 section records the instrumented result. |
| n1 4 px bound on the unavoidable value | "R2 m1" bound is now 3.5 px (measured graze 3.2, plain head-on 4.00), with the reason in the comment. A single bound was chosen over a separate graze assert because the test has one path and one number. |
| n2 `LANE_PX` duplicates the lane width | `AVOID_LANE_HALF_PX` is exported from npc-behavior.js and the test imports it. The planner (npc-pathfinding.js) cannot import it: npc-behavior.js imports the planner, and 14 test harnesses stub the planner with a one-class module, so a new import either way would break them. Instead npc-behavior.js passes it in the three `avoidDynamic` option objects as `laneHalf`; `findWorldPath` hands it to `_avoidDynamicPositions`, which sets `LANE_PX = laneHalf + 1`. Without `laneHalf` the goal-side release is off and the whole ring stays (safe default). No new static import, so no harness copy list changed. |
| n3 "timer" wording | The planner comment and REVIEW_R2_OUTCOMES.md now say the 32 px arrival guard ends a return walk at once and that the 1.5 s timer applies only to walks with `arriveWithin`. |

Full suite on 5bb5cf541: `bin/test-js` 825 files passed, 0 failed, 825 total.

## The one more live run

Result in scenarios/m08_the_mole/office_life/LIVE_RETURN_STALL.md and DIAGNOSIS_M08.md. 18 trips, six fresh games alternating f48c80af8 and HEAD. Vector was a movable, enabled blocker in `_dynamicBlockers()` on all of them, so R3 reason 1 (immovable at rest) is ruled out.
- f48c80af8: 0 of 9 held. No old-engine stall to snapshot; the log shows why: the first return plan was clear of the lane in 7 of 9 trips and at its edge in 2, and the stalling plan (plain, from the start cell (508,164), 10 to 11 px from Vector) did not occur.
- HEAD: 1 of 9 held, 9.6 s home, two return_resumed, no return_stuck. Cause visible in the plan record: a plain re-issue plan along y 164 (nearest agent_vector lat 10.6, fwd 21.6) after a clear ring plan. The criterion "HEAD must not hold" is not met; the 30 s loop did not recur.

Open for the owner (not changed here): the first re-issue after `return_resumed` is a plain plan; it can walk into a standing NPC's lane for a few seconds. Making that re-issue use the held-aware (ring) plan first would remove the residual hold. It needs its own unit test and a live run, so it is left as a follow-up.
