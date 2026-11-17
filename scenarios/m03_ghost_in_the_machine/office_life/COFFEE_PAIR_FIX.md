# m03 reception coffee pair: cause and fix

Finding: SLICE6_DRESSING_LIGHTING.md, minor 2. `reception_coffee` (capacity 2) did not always serve Zainab and Yusuf together; in two of three runs Yusuf stood at (220,244) for 15 to 20 s with the main cell free.

## Cause (engine, not the scenario)

`_moveForPhase` in `public/break_escape/js/systems/npc-needs.js` (the shared-object block near line 3394) gives the first claimant the approach cell and the second the `besideCell`. At reception the machine's east side is a wall, so the only side cell is the west one (244,244). Both staff walk in from the west along the same lane at y 244.

Yusuf (id order) claims first and heads for the main cell (276,244). Zainab claims a tick later, is often the nearer, and stops at the west cell, which is in Yusuf's path. Yusuf waits behind her until his walk's deadline passes (npc_job_failed timeout), so only one person ever used the machine. When Yusuf was far enough behind to route round her (y 252) the pair worked, hence "once in three".

The scenario's `useFrom` and the preset's `queue.cells` (offsets -1,+1 and -2,+1) are not involved: the coffee affordance has no queue in play here and the use cell is the intended one. Nothing in the scenario changed.

## Fix

`_moveForPhase` now takes `noSwap`, and a new `_sideBlocker(s, cell, alt)` returns the other user, still in `goto_target` towards the same main cell, who is farther from it than the new claimant and for whom the side cell lies on the way (detour under half a tile). When one exists, the nearer NPC keeps the main cell and the first user is routed again (fresh move id, so its old arrival is ignored) to the side cell, with `pair_side_swap` logged. No swap when the first user is already nearer, has arrived, or the side cell is not on its way. It applies to any affordance with capacity 2 or more that goes through the `besideCell` branch; no m03 data involved.

Expected away time is unchanged: `_expectedAwayMs` uses the approach cell, not the side cell.

## Test

`test/js/npc-needs-pair-side-swap.test.mjs` (3 tests; the first fails on the code before the fix, the other two guard the no-swap cases). No new static import.

## Live proof (port 3094, fresh m03 game 6703, keyless server)

Three coffee breaks in one game, both needs set to 5 each time through `__test.needs.set`. Screenshots in `scenarios/m03_ghost_in_the_machine/office_life/coffee_pair_proof/`.

| Rep | Pair using together | Zainab cell | Yusuf cell | Expected away (Zainab) | Real away (Zainab) | Laptop locked while away |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | yes, from 3.0 s | 276 (main) | 244 (side) | 18.6 s | 30.4 s | no |
| 1 | yes, from 4.0 s | 276 | 244 | 18.6 s | 27.4 s | no |
| 2 | yes, from 2.6 s | 276 | 244 | 18.6 s | 22.3 s | no |

Screenshot `proof-caffeine-rep0.png` shows the pair side by side with the "coffee" chatter. The laptop stays open: the lock decision uses the expected 18.6 s against `lockIfAwayOverSeconds` 24.

Real away runs 4 to 12 s over the expectation. The extra time is the walk home: both leave within a second of each other along the same lane and `_watchReturn` re-issues a stalled return after 3 s (`return_resumed` in the log). The same stall appeared in the unfixed runs (a solo trip measured about 22 s). It is not changed here.

Cooler check: `hallway_cooler` is a capacity-2 cooler (preset). With the player in the hallway, both set thirsty: both used it together in 2 of 2 runs (Zainab 236, Yusuf 204), screenshots `proof-thirst-rep0.png`, `proof-thirst-rep1.png`. Expected away there is 28.7 s, over 24, so the laptop locks on that trip, as designed.

## Suites

`bin/test-js`: 736 files passed, 0 failed. `bin/rails test`: 3186 runs, 50670 assertions, 0 failures, 0 errors, 4 skips (LabPhysicalPentestSecretsTest did not flake).
