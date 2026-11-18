# Review: NPC squeeze-past, round 2 (delta of bec16cb2e over d35f8eae0)

B0 M0 m3

## Method

Read the R1 file and its Outcomes, the fix diff, `_tickPlayerPass`, `_notePlayerBlock`, `_updatePlayerPass`, `goToAndStay`, `cancelMove`, `_triggerGoToStayArrival`, `_dynamicBlockers`, the update-loop arrival guards and the pin minigame restore/dust code. Ran both suites on the current tree: `node test/js/npc-local-avoidance.test.mjs` 62/62, `node test/js/pin-dust.test.mjs` 24/24. Then ran the post-fix tests against the pre-fix sources (`git archive bec16cb2e^` plus the new test files, in the scratchpad): npc-local-avoidance fails tests 56 to 61 (M1, m1 x2, m2, m3, m5 slow path), pin-dust fails 23 and 24 (m7, m8). The "real lapse still restarts" test passes on both, as it should. So every new test fails without the fix.

## Each claimed fix

- **M1** works. `_tickPlayerPass` runs before the arrival guard and path follow, arrives at 48 px (`AVOID_PLAYER_ARRIVE_PX`, equal to `NEEDS_COLLISION_ARRIVE_PX`, the radius npc-needs already accepts), and `_triggerGoToStayArrival` clears the pass.
- **m1** works for hostile (`setHostile`), `cancelMove`, a non-needs or different-destination `goToAndStay`, and distance with no path. KO is handled lazily: `isPassingPlayer` checks `_mayPassPlayer`, so the collider returns at once, and the stale object is dropped at the next tick.
- **m2** works (timer kept only for owner `needs` and a destination within 1 px). A stall nudge or reroute goes to a different cell, so it resets, which is right.
- **m3** works for `squeezePastPlayer: false`. See m3 below for the other exempt NPCs.
- **m5** works for the gap. `reissued` is cleared on the first `_notePlayerBlock` call after the path returns, so a later true lapse is still caught.
- **m7** works: `dustRestoring` is awaited, the `.finally` runs after the assignment, `_restoreDust` swallows its own errors so there is no unhandled rejection.
- **m8** works: object `id`, then `objectId`; a door is its `connectedRoom`.

No new stale state across room changes: the player is one global body in a shared world frame, so an NPC in another room never reads as touching or ahead, and the first tick of any later walk drops the pass. Per-frame cost: the tick returns at once without an active pass; with one it costs a hypot, plus one `_dynamicBlockers()` only while no path is followed. Negligible.

## m

**m1. A 3 s needs re-issue that lands in the approach phase of an active pass drops the pass and restarts the wait.**
`goToAndStay` keeps the pass on a same-destination needs re-issue and marks it `reissued`, but also empties `currentPath`. `_tickPlayerPass` then runs with no path and ends the pass unless the player is within 28 px (touching). Just after activation the player is still ahead at 28 to 42 px, not yet touching. Failure: Sofia has waited 2.5 s in the aisle, the pass turns active, 0.1 s later her 3 s re-issue fires, the tick sees "no path, not touching" and clears the pass, the collider returns, and the next blocked frame starts a fresh 2.5 s (0.6 s near target) wait. It repeats if the re-issue phase lines up again; the window is about 0.3 s in 3 s per cycle, so it is rare but it is the original bug in miniature.
Fix: in the tick's distance branch also require `!p.reissued` (the flag is cleared by `_notePlayerBlock` once the path is back), or keep the pass for the same-destination re-issue and let `_updatePlayerPass` end it once the path returns. Add a test: active pass, player ahead at 35 px, `goToAndStay(..., {owner:'needs'})` same dest, tick, assert the pass survives.

**m2. The pass arrives the walk from 48 px even when the player is not what is near the target, and a use or queue cell can be left 48 px short.**
The arrival test is `distance to _goToStayDest <= 48` while any pass is active; it does not require the player to be at the target. The old collision rule needed contact. An `arriveWithin: 6` walk (use, queue and pair cells) otherwise deliberately walks onto the cell "so two NPCs at one machine stand where they were sent". Failure: two NPCs queue at a printer with cells 32 px apart; the second has an active pass because the player stands in the aisle; it arrives 48 px out and the two can stack on the same side. The use is still accepted (npc-needs takes 48), so this is cosmetic or an ordering glitch, not a stuck NPC; chairs, PCs and doorways are fine because those use the seating walker or the default 32 px guard.
Fix: arrive early only if the player is also within 48 px of the destination (`Math.hypot(player - d) <= 48`), which is exactly the case the old collision covered; otherwise let the walk continue and rely on the pass until contact clears.

**m3. m3's restore covers only `squeezePastPlayer: false`.**
Before d35f8eae0 the near-target `mustReach` squeeze applied to every needs-owned walk. Now a needs walk by an NPC that turns hostile mid-walk (setHostile does not cancel the move) or is KO'd gets neither the pass nor the bounded squeeze with the player on its target cell; it holds or detours until the job times out. Hostile NPCs mostly do not run needs, so this is minor. Fix: drop the `squeezePastPlayer === false` condition and apply the near-target `mustReach` whenever `!this._mayPassPlayer()` for a needs walk.

## Still open from R1

- **m6 live half**: no headless Phaser proof of `test_npc_squeeze_past` is recorded in the tree (Sam reaches the coffee with the player parked in the west gap, Opal does not). The unit tests drive the behaviour object with a fake pathfinder, so the real collider (`isPassingPlayer` returning false plus velocity) is still unproven. Per the live-proof rule, hold the merge claim until that run is attached.
- **m4** (README wording) and **m9** (client event sets a debrief global) stand as R1 left them. The `fresh` flag for a restore request that fails on the network is also still open.

## Outcomes

- **m1**: `_tickPlayerPass` skips the distance clear while `p.reissued`. Test: an active pass with the player 35 px ahead survives a same-destination needs re-issue.
- **m2**: the early arrival at 48 px now also needs the player within 48 px of the destination (`_dynamicBlockers`). Test: player in the aisle, the NPC walks on; player on the cell, it arrives.
- **m3**: the near-target `mustReach` squeeze applies whenever `!_mayPassPlayer()` on a needs walk (opt-out, hostile, KO). Test: a hostile needs walk squeezes up to a player on its cell.
- **R1 m4**: `README_scenario_design.md` now says every needs-owned walk passes, including the walk home and the chair fetch.
- All three new tests fail on the pre-fix source (63 to 65 of `npc-local-avoidance.test.mjs`); the file passes 65/65 with the fix.
- Still open: m6 live half (needs the headless Phaser proof), m9, and the `fresh` flag.
