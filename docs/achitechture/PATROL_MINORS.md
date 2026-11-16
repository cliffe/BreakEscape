# Patrol minors (T100 live check)

Branch `build/ol-patrol-minors`, off main 65f9ad80e (includes sims tidy).

## 1. waypoint_line_horizontal never moved

Cause: test data. In `scenarios/test-npc-waypoints/scenario.json.erb` its position and all three waypoints sat at tile y=2. The back wall is two tiles deep (`VISUAL_TOP_TILES`, rows 0 and 1) and every other NPC in the scenario patrols at y=3 or lower, so y=2 is the wall edge and `findWorldPath` returned null.

Fix: the position and waypoints moved to y=3 (x 3, 5, 7 unchanged, so the line is still horizontal and the same length). The validator reports 0 errors, 0 warnings.

Sims tidy: not involved. Scenario data only, untouched by sims tidy.

Live (game 6175, :3095): over 20 s the NPC walked x 96 to 224 at y 96 to 105, patrolling.

## 2. waypoint_fast stood still for about 87 s with an idle player in its path

Comparison of the player-blocker logic in `npc-behavior.js`, 8bcfbc85d (main before sims tidy) against 65f9ad80e: the player branch of `_handleBlockerAhead` is the same. Sims tidy's changes (head-on yield, pin, yield hold, back-off step) are all inside `!hit.isPlayer && amYielder`. A player blocker still goes to the older path: wait, detour via `_requestDetour`, else a 450 ms squeeze toward the waypoint, then a cooldown wait. The patrol's `_patrolStalled` re-target after `changeDirectionInterval` is also unchanged.

Old against new, two new tests in `test/js/npc-local-avoidance.test.mjs` (a waypoint patrol, a still player in the lane, collision stops the NPC 20 px short):

| Test | 8bcfbc85d file | 65f9ad80e file |
| --- | --- | --- |
| detour exists on open floor: NPC leaves the lane and gets past | pass | pass |
| no detour: NPC re-targets after the stall window | pass | pass |

(The 16 sims tidy tests in that file fail on the old file, as expected; they test the new yield code.)

Verdict: sims tidy did not cause it, and the stall is not reproduced. Both behaviours hold on both versions.

Live (game 6175): with the player parked 40 px ahead of waypoint_fast on its heading and re-parked each second for 30 s, the NPC detoured (44 detours logged in the run, none stuck) and re-targeted through seven different targets, moving up to 84 px from its start; it never stood for more than a few seconds.

Not found: the 87 s stand-still. The likely shape is a spot where no detour exists (player against a wall or a furniture pocket) and the squeeze moves the NPC more than 4 px each cycle, which resets `_patrolStalled`'s progress mark so it never re-targets. At speed 200 a 450 ms squeeze at 0.45 speed covers about 40 px if not blocked. This is a guess from reading, not a reproduction. A fix would touch the stall mark, and the game-state to test it is missing, so no code change was made. If T100 has the game id and position, reproduce there first.

## Proof

- `ruby scripts/validate_scenario.rb scenarios/test-npc-waypoints/scenario.json.erb`: 0 errors, 0 warnings.
- `bin/test-js`: 712 passed, 0 failed (includes the two new tests).
- `bin/rails test`: 2940 runs, 48173 assertions, 0 failures, 0 errors, 3 skips.
- Live check on :3095, keyless, one fresh game (6175, made by tools/playtest/new-game.rb), headless, setFPS(20), fixed steps on. Server stopped; port 3095 closed.
