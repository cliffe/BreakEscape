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

## R7 follow-up (commit 28dac1dab)

Round 7's delta review (`M03_REVIEW_R7.md`) raised two minor guards and a test fix. All three are now in.

### What changed

`public/break_escape/js/systems/npc-needs.js` and `test/js/npc-needs-pair-side-swap.test.mjs`:

- M1: `_sideBlocker` skips any user whose `mode === 'frozen'`. A staff member the player is talking to while it walks to the machine is no longer re-routed mid-conversation; it keeps the main cell and the later claimant takes the side cell.
- M2: before returning a swap, `_sideBlocker` confirms the re-routed user can get a side cell of its own (its own position, leash and avoided rooms, with the other users' cells counted as taken). With no free side cell for it the swap is skipped, so the first user keeps walking to the main cell rather than being failed with `no_beside_cell`.
- N1: the "fresh move id" assertion now reads `clerkMoves[0].moveId` (the stub records the id at the top level of the move, not under `opts`), so it can actually fail. Three tests were added.

### Tests and fail-before evidence

`node --test test/js/npc-needs-pair-side-swap.test.mjs`: 6 tests, all pass. Each guard was proven by reverting its lines locally, running the file, then restoring (no git stash):

- Frozen user not re-routed (M1): removing `if (o.mode === 'frozen') continue;` makes "a user frozen in a conversation is not re-routed" fail (the frozen clerk is swapped off the main cell).
- No side cell, no swap (M2): removing the `besideCell` check makes "the first user has no side cell of its own" fail (the first user is swapped with nowhere of its own to stand).
- Stale pre-swap arrival ignored: disabling the move-id guard in `_acceptArrival` makes "an arrival from the pre-swap move is ignored" fail (the old move's arrival is no longer dropped as `arrival_ignored`).

In each case the other five tests stayed green and the file returned to its committed state (clean diff).

### Live proof (port 3094, fresh m03 game 6719, keyless server)

Two coffee breaks in one game, both needs set to 5 each time through `__test.needs.set`. Both runs had Zainab and Yusuf use `reception_coffee` together: the nearer claimant (Zainab, claims second) took the main cell and Yusuf took the west side cell, with `npc_use_started:reception_coffee` fired for both. Screenshot `pairfix2/proof-caffeine-rep0.png` shows the pair side by side at the machine (kept in the session scratchpad, not the repo).

| Rep | Pair using together | Zainab cell | Yusuf cell | Expected away (Zainab) | Real away (Zainab) | Laptop locked while away |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | yes, from 4.0 s | 276 (main) | 244 (side) | 18.6 s | 30.8 s | no |
| 1 | yes, from 4.0 s | 276 | 244 | 18.6 s | 27.3 s | no |

The real-away overshoot (the pair's shared walk home, review minor M3) is unchanged and stays in the backlog.

### Suites

`bin/test-js`: 737 files passed, 0 failed. `bin/rails test`: 3187 runs, 50683 assertions, 0 failures, 0 errors, 4 skips.
