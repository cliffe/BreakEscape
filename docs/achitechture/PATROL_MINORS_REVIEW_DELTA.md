# Patrol minors: delta review (settle grace early return)

Scope: 105d8e945 (fix and test), 5029d91f3 and f9eb3da31 (doc), on top of the merge 79a996239. Claim under review: section 4 of `PATROL_MINORS.md`. Review only, nothing fixed.

Result: 0 blocking, 0 major, 4 minor. The fix is correct and the test fails on the old code.

## Checks

**Is the fix correct?** Yes. `settleGraceRunning` (`public/break_escape/js/systems/npc-sprites.js:1375`) is true only when the walker is not settling and `_settleGraceUntil` is still ahead. Both handlers call it straight after the settle step (`npc-sprites.js:1434`, `:1624`). In the old code the avoidance block (`:1494` onwards, `:1650` onwards) set `currentPath = []`, `patrolTarget = null` and `_needsPathRecalc = true` on every overlap frame, and `updatePatrol` returns from its recalc branch before it sets a velocity. The return removes exactly that. A first contact still gets the avoidance waypoint: `triggerSettling` returns true, so `isSettling` is true and the guard is false. Overlap frames during the 300 ms settle still run the avoidance block, which is harmless because `updatePatrol` returns early while settling (`npc-behavior.js:1200`).

**Can the early return leave an overlap for good?** No new way found.
- The grace is stamped only at settle end (`npc-behavior.js:1207`) and `triggerSettling` refuses a new settle while it runs (`:3220`). It cannot re-arm itself. The longest stretch without avoidance is 600 ms per settle, then the next overlap frame settles again and re-plans as before.
- Two walkers each in grace: each follows the path it planned at its first contact, and Phaser separation still pushes them apart. Neither handler holds the other. After 600 ms each re-settles and avoids, which is the pre-fix behaviour.
- A held (immovable) other body: `settleOnContact` returns false, so only a walker already in grace from some other contact skips avoidance, for at most 600 ms.

**Does it skip anything the handlers must do?** Only the arrival guard (finding 2). Hostile contact, damage, knock-back and chase are not in these handlers: the colliders at `npc-sprites.js:861` and `:1146` only call them, and the push process callback (`shouldAllowNPCPush`, `:866`) is separate. The player-blocked wait is `_handleBlockerAhead` in the behaviour, not here. The settle step and the velocity zero run before the return.

**Does the test fail on the old code?** Yes. I ran the new test file against a scratch worktree of 105d8e945~1 (removed afterwards): tests 1 to 3 pass, test 4 fails with `no avoidance re-plan while the settle grace is running: 234 !== 0`. On the branch tip all 4 pass. It fails for the right reason (234 re-plans in grace), not an import error. The earlier tests could not see it because `window.rooms` was empty (as the doc says).

Tests run: `npc-patrol-settle` 4/4, `npc-patrol-clock` 6/6, `npc-behavior-arrival` 4/4, all with `--max-old-space-size=2048`. No db task was run.

## Findings

### Minor 1: the player handler is untested
`test/js/npc-patrol-settle.test.mjs:129` only calls `handleNPCCollision`. The same guard at `npc-sprites.js:1624` (in the non-exported `handleNPCPlayerCollision`) has no unit test, so removing it would pass the suite. Export it for tests (as the NPC handler is) and add the mirror case.

### Minor 2: the go-to-stay arrival guard is skipped for up to 600 ms
The return at `npc-sprites.js:1434` and `:1624` sits before the arrival-tolerance guard (`:1506`, `:1692`) that calls `_triggerGoToStayArrival`. A goToAndStay walker that is close enough but touching a body inside the grace waits until the grace ends. It self-heals on the next overlap after the grace, so this is a delay, not a stall. A comment at the return, or moving the guard above it, would record the choice.

### Minor 3: the grace is stamped and read on two clock paths
The stamp uses the `time` argument of `updatePatrol` (`npc-behavior.js:1207`, fed from `update` at `:1105`); the reader uses `clockNow()` (`npc-sprites.js:1375`). They are meant to be the same timeline (`npc-behavior.js:1127`), and `updatePatrol` clamps a future `settleEndTime` (`:1196`) but nothing clamps `_settleGraceUntil`. A stamp from another clock far in the future would turn off both settling and avoidance for that walker. It would not stall (the walker would follow its path) but it would shove against bodies. `npc-patrol-clock.test.mjs` does not cover the grace. Low likelihood; a clamp beside `:1196` would close it.

### Minor 4: the live proof is thinner than the doc suggests
Three fixed runs with no settle or avoidance stall, against a reproduction rate of 3 in 5 on the old code. Three clean runs at that rate has roughly a 6 per cent chance of happening anyway. All runs use one pair (waypoint_fast beside waypoint_with_face) with the player parked, so the player-collision half of the fix (Minor 1) had no live proof either. The 5 s stop in run 3 matches the deliberate player-wait the doc describes, and nothing here contradicts it. The unit test, which fails 234 to 0, is the stronger evidence; I would call the fix proven and the live check supporting only. A further run with the player walking into the walker would cover the other handler.
