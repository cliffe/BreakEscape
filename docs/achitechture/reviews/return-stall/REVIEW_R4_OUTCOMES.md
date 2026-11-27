# Outcomes of code review R4 (needs NPC walking home stalls behind a standing NPC)

Branch fix/needs-return-npc-stall. 0 B, 0 M, 2 m, 3 n in the review. Test, comment and dead-argument changes only; no live run needed.

| Finding | Outcome |
|---|---|
| m1 no cap on the flood cost of a failed ring search, now on every first resume | Accepted, no code change. The cost is bounded: at most one extra pair of searches per resume, resumes are at most every `RETURN_YIELD_MS` (3 s), 3 tries per place, then the 15 s back-off and `RETURN_STUCK_MAX_BACKOFFS`. Future option if a profile shows a spike on a many-NPC mission: cache the "no ring path" result for the stall place so the ring tier is skipped on later resumes at the same place. |
| m2 no test for a caller that omits `laneHalf` | Added "R4 m2: no laneHalf passed: the whole ring round the standing NPC stays (no goal-side release)" in test/js/npc-needs-return-standing-npc.test.mjs. It calls `findWorldPath` with `avoidDynamic` and no `laneHalf` on the R3 m1 (a) geometry (standing NPC 20 px west of the home), asserts the path keeps at least 24 px from his centre, and, as a control, that passing `laneHalf` lets the path pass closer (the release is real). A refactor turning the null default into a number fails it. |
| n1 dead `laneHalf` argument on the `moving` tier | Dropped. npc-behavior.js now adds `laneHalf` only when `includeHeld` is true. The planner discards the options for the `moving` tier (npc-pathfinding.js:670 passes `undefined`), and the goal-side rule belongs to the held-body search, so passing it through would have changed nothing. A comment at the line says so. |
| n2 R4 test leaks `window.seating` | The test now saves `seating`, `rooms`, `player` and `chairs` before stubbing and restores them in a `finally` (deleting a key that was unset). |
| n3 `reroute` is now the default on every stall re-issue | Comment added to the `_goHome` doc block in npc-needs.js: every stall re-issue passes `reroute: true`, so the option matters only for the first walk home, which stays plain. It points at the new backlog entry. |

## Backlog

"Plan the first needs walk home ring-first" added to docs/IDEAS_BACKLOG.md. It removes the last short hold seen on m08 (game 9568, trip 1; REVIEW_R3_OUTCOMES.md), but changes every needs walk home in every mission, so it needs its own tests and a mission-wide live run.
