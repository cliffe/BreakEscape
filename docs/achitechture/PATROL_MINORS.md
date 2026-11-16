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

## Handover: waypoint_fast 87 s stand-still (follow-up, not resolved)

Status: not reproduced, no code change. T100 log evidence (wp2.log seq 15 to 23) read; the guess above (squeeze resets the stall mark) is not supported.

What the T100 state shows at the stall, waypoint_fast at (174,174), player at (156,169), waypoint_with_face at (156,164):
- v = 0, `_avoid` null, state patrol, 350 samples (87 s) at one position.
- `currentPath` starts at (172,172), 3 px from the NPC, yet `pathIndex` stayed 0. updatePatrol's path-following branch advances the index when within 8 px, so that branch was not running. The squeeze theory needs `_avoid` set, so it does not fit.
- The path was the same 36 s apart (seq 19 and 23), so it was not being re-planned; `_stuckWatch` was stale (not called), and `lastUnstuckCheck` was current (update() runs).
- So something returns early before path-following, every frame, with velocity 0.

Leading suspect to check next: `isSettling`. `updatePatrol` returns early with velocity 0 while settling, and `triggerSettling` (npc-behavior.js about 3212) is called from `handleNPCCollision` and three other sites in `npc-sprites.js` (lines 1380, 1477, 1606, 1664). `settleOnContact` already exempts held bodies; a body that is neither held nor pushable, here waypoint_with_face in face_player state (immovable false, 5 px from the player) or the player, may re-collide every frame and re-arm the settle for ever. The guard at the top of updatePatrol only caps `settleEndTime` to `time + settleDuration`, so a re-arm each frame never ends. Check: `settleOnContact` and the player-collision path in npc-sprites.js.

Also noted: calling `body.reset` on an NPC through the page froze the game clock (scene time stopped) in the live page; teleport only the player. Live script: scratchpad `stall-live.mjs` (env PX, PY, SECS). The natural run with the player at (156,169) for 60 s did not stall (waypoint_fast never came within 37 px of the player).

Suggested next step: a node test that puts two NPCs (one in face_player, one patrolling) overlapping, calls `handleNPCCollision` every frame and runs `updatePatrol`, and asserts the walker moves within a second or two; then fix `settleOnContact` or add a settle cap. Live proof: player parked at (156,169) beside waypoint_with_face, watch waypoint_fast for a stand-still over 90 s.

## 3. waypoint_fast stand-still: cause found and fixed

Cause: the settle was re-armed in step with the pause. The behaviour manager updates every 50 ms and physics runs at 60 fps. When a settle ended, `updatePatrol` set the walker's velocity, then the very next overlap callback (contact with a face_player NPC, or the player, that does not move away) called `triggerSettling` again and zeroed the velocity before the body integrated it. The walker never moved. A path point under 8 px away was still stepped past, but one further away (the sprite and body positions differ, so the 3 px read in T100 was not the body distance) kept `pathIndex` at 0 with `_stuckWatch` re-armed by each settle.

Test: `test/js/npc-patrol-settle.test.mjs`, "continuous contact ... for ever": 0.0 px moved in 10 s with `settling true` on the old code, passes on the new. Two guards: a single contact still pauses for `settleDuration` then resumes; contact after the grace settles as before and a settle in progress is not extended.

Fix: `triggerSettling` returns false for `SETTLE_GRACE_MS` (600 ms) after a settle ends, and the four contact sites in `npc-sprites.js` only zero the velocity when it returns anything but false. The avoidance-waypoint logic in `handleNPCCollision` is untouched.

### Live check of the settle fix, and a second stand-still still open

Suites on 44c4f618e: `bin/test-js` 713 passed, 0 failed; `bin/rails test` 2940 runs, 48173 assertions, 0 failures, 0 errors, 3 skips.

Live on :3095 (keyless, game 6188 from new-game.rb, headless, setFPS(20), fixed steps on, only the player teleported, server stopped): no settle freeze in 70 s with the player parked at (170,170) beside waypoint_with_face. Two things stop this being a clean proof:

- In 3 of 5 runs the page's game clock stopped after about 10 to 14 s (`scene.time.now` constant), so those rows prove nothing. This is the harness loop, not the NPC.
- In the one run with a live clock, from about 50 s waypoint_fast stood at (175,161) for 20 s: v 0, `pathIndex` 0, `_avoid` null, `_playerBeside` true (player 44 px away), waypoint_with_face 18 px away, and its target and path changed every 5 s or so (re-targets that never moved it). `isSettling` was not recorded in that run, so it is not known whether this is the settle (the fix should prevent it) or the local-avoidance and stall-reset path (`_checkPathStuck` re-armed by `_playerBeside`, `_stuckWatch` reset on each new path). Next step: rerun with `isSettling`, `_settleGraceUntil` and `_stuckWatch` in the row (scratchpad `stall-live2.mjs` has the first two) and a game clock that stays live.

## 4. Second stand-still: cause found and fixed (avoidance re-plan inside the settle grace)

### The page clock

Cause of the stopped game clock: the harness, not the NPC and not `body.reset`. It pressed Escape six times to dismiss UI, and Escape toggles the game menu, which calls `scene.scene.pause()` (`ui/game-menu.js` `open()`). Depending on timing the sixth press left the menu open, so the scene was PAUSED (`scene.sys.settings.status` 6) while the game loop still ran: `scene.time.now` stood still, the NPCs froze, and every row after that proved nothing. Fix in the harness: no Escape presses. It calls `__test.dismissBlockingUi()`, then checks `scene.sys.isPaused()` and presses Escape once more only if the scene is paused, aborting if it still is. Every row now logs the scene status and the loop state, and the analysis checks that `scene.time.now` advanced. Clock live in all 11 runs since (scratchpad `stall-live4.mjs` and later). Only the player is teleported.

### Reproduction

Game 6330 (new-game.rb, :3095, keyless, headless, setFPS(20), fixed steps on), player parked at (170,170) beside waypoint_with_face, logged each second with `isSettling`, the grace, `_playerBeside`, `_avoid`, path and blocker fields. Stand-still reproduced in 3 of 5 long runs (about 100 s in), clock live in each: waypoint_fast at (173,160), v 0, `pathIndex` 0, `_avoid` null, `isSettling` false half the time, target and path changing every second, the walker touching waypoint_with_face (face_player, 12 to 16 px).

An in-page ring buffer (wrapped `updatePatrol`, `triggerSettling`, `_planMovePath`) showed the early return. After a settle ends the 600 ms grace lets `triggerSettling` return false, but `handleNPCCollision` (and `handleNPCPlayerCollision`) did more than settle: on every overlap frame they inserted an avoidance waypoint, cleared `currentPath`, set `patrolTarget` null, set `_needsPathRecalc` and called `chooseWaypointTarget`. The next `updatePatrol` took the `_needsPathRecalc` branch, re-planned, and returned before the path-following code that sets the velocity. With contact on every physics frame that happens before each behaviour update, so the walker never reached the path-following branch: velocity 0, `pathIndex` 0, a new target each second, `_stuckWatch` re-armed by `_playerBeside`. The settle fix of section 3 stopped the velocity being zeroed but not this.

### Fix and test

Both collision handlers return right after the settle step while the grace is running (`settleGraceRunning` in `npc-sprites.js`: not settling and `_settleGraceUntil` still ahead). The walker follows the path planned at the first contact and pulls away; after the grace, new contact re-plans as before.

Test: `test/js/npc-patrol-settle.test.mjs`, "settle grace: contact inside the grace does not wipe the path and replan every frame". It fails on the old code (avoidance re-plans during the grace, walker does not move) and passes now. The earlier settle tests used an empty `window.rooms`, which skipped the avoidance block, so they could not see this.

### Live proof of the fix

Same setup, 3 runs on the fixed code: 120 s, 120 s and 110 s, clock live, longest stand-still 3 s, 4 s and 5 s. The 5 s one (run 3) is the deliberate player-wait: `_handleBlockerAhead` held the walker for the parked player, then `_patrolStalled` re-targeted and it walked on; `isSettling` and the grace were not involved. No stand-still of the settle or avoidance kind.

Suites on the fix commit (105d8e945 plus doc): `bin/test-js` 717 passed, 0 failed; `bin/rails test` 3003 runs, 48495 assertions, 0 failures, 0 errors, 3 skips. Server on :3095 stopped.

### Delta minors

The delta review (`PATROL_MINORS_REVIEW_DELTA.md`) found 0 blocking, 0 major and 4 minor. All four are dealt with.

1. **Player handler untested.** `handleNPCPlayerCollision` is now exported and `test/js/npc-patrol-settle.test.mjs` has a mirror of the NPC case ("the player collision handler does not replan inside the grace either"). It needs `window.player.currentRoom`, otherwise the handler returns before the avoidance block and the test proves nothing. Checked by removing the `settleGraceRunning` return from the player handler: the test fails with "no avoidance re-plan while the settle grace is running", and passes again with the guard restored.
2. **Go-to-stay arrival inside the grace.** Fixed rather than excused. Both handlers now run the `collisionArrives` check straight after the settle step, before the grace return, so a goToAndStay walker close to its destination arrives at once instead of up to 600 ms later. The existing guard further down is untouched. Test: "a goToAndStay walker arrives inside the grace, not 600 ms later", run against both handlers.
3. **One clock for the grace.** `_settleGraceUntil` is stamped with `clockNow()` (it was the `time` argument) and `updatePatrol` clamps it to `clockNow() + SETTLE_GRACE_MS`, the same way it clamps `settleEndTime`. Test: stamp on a scene clock that differs from the `time` argument, then a stamp of 1.8e12 is pulled back.
4. **More live runs.** `tools/playtest/patrol-stall-live.mjs` (the fixed harness: no Escape presses, scene paused check, setFPS(20) with fixed steps on, headless). Keyless server on :3095 only, game 6364 from new-game.rb, `test-npc-waypoints`, 120 s each, clock confirmed advancing in every run, no page errors. `park` resets the player to (156,169) beside waypoint_with_face each second. `ahead` puts the player on waypoint_fast's current patrol target every 500 ms, so the player-collision and player-wait code run. Longest stand-still is the longest stretch of identical position with zero velocity in the 1 s rows.

| Run | Mode | Longest still | Settle or grace flag in the stretch | Player beside | Reading |
|---|---|---|---|---|---|
| 1 | park | 2 s | yes | no | brief settle, then moved |
| 2 | park | 2 s | no | yes | player wait |
| 3 | park | 2 s | no | yes | player wait |
| 4 | park | 3 s | yes | no | settle plus grace plus re-plan, then moved |
| 5 | park | 2 s | yes | no | brief settle, then moved |
| 6 | park | 2 s | no | no | avoidance back-off |
| 7 | ahead | 4 s | no | yes | player wait |
| 8 | ahead | 4 s | no | yes | player wait |
| 9 | ahead | 3 s | yes | no | settle plus grace, then moved |

Telling the two apart: a deliberate player wait has `_playerBeside` true and no settle or grace in the stretch (runs 2, 3, 7, 8; the 4 s ones end at the 5 s `_patrolStalled` re-target). A settle stall would show `isSettling` or a grace for far longer than 300 ms plus 600 ms and a path that is wiped every second. The settle-flagged stretches (runs 1, 4, 5, 9) are 2 to 3 s at 1 s sampling, which is one settle and its grace, and the walker then moves on. The stand-still seen before the fix was 87 to 100 s. None of the nine runs is near that. Run 7 and 8 are the first live exercise of the player-collision half.

Suites on the code commit 4ed0eb388: `bin/test-js` 717 files passed, 0 failed; `bin/rails test` 3003 runs, 48495 assertions, 0 failures, 0 errors, 3 skips. No db task was run. Server on :3095 stopped.
