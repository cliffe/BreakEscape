# m06 office life: live proof of build review R3 fixes

Fix commit `4ed61aa0d` (on tip `1f159f902`). Keyless server on port 3096, headless, `setFPS(20)` with fixed steps on. The script (modes queue, fridge, print) is kept in the build scratch, not in the repo. Server stopped by PID afterwards.

## Change
- `floor_coffee` `queue.cells`: `{dx 2, dy 1}, {dx 3, dy 1}` to `{dx 2, dy 0}, {dx 3, dy 0}` (M1).
- `floor_fridge`: added `"affordance": { "useFrom": { "dx": 1, "dy": 0 } }` (m1).
- Static: validator 0 errors, 44 warnings (unchanged); office summary identical to the previous tip; lock/key diff empty; positions identical to the previous tip.

## M1 (coffee queue cells)
- `world.queueCells(floor_coffee, [...])` returns (148, -132) and (180, -132), both walkable, both `roomId: trading_floor`. Both cells kept.
- Game 8405: Dani talked to at post (first talk), Lerato and Tomasz caffeine set to 5 through the test bridge. Dani queued at (147, -162) sprite, feet -131; Tomasz and Lerato using. Every sample for all three read `trading_floor` while going, queued and using (0 `security_checkpoint` samples in 40 polls). Dani then reached `using` at feet -134. All three reached `using`.
- Game 8406 (second fresh game): all three reached `using`. Dani queued at feet -139, `trading_floor`. One sample while Dani stepped up from the queue (sprite (134, -157), feet -126) read `security_checkpoint`; the next samples and the whole `using` phase read `trading_floor`. So a one-second transient remains on the step-up (the stop-short of `arriveWithin: 6`), not for the use itself.
- `heard_ex_dani_tomasz_late_shift` true in both games (exchange 1 still plays). The two Lerato exchanges stay false, as expected (they need Irina taken or the seizure).

## m1 (fridge use cell)
- Merged affordance read live: `satisfies: hunger, restores 80, useSeconds 15, capacity 1, useFrom {dx 1, dy 0}, useSound eat_snack`. The preset keys survive; only `useFrom` changed.
- Game 8410: Lerato and Tomasz set to hunger 5. Lerato used the fridge at sprite (140, -195), then Tomasz at (141, -195), one at a time (capacity 1), 2 of 2. Both read `trading_floor` throughout (0 checkpoint samples). Neither walked into Dani's seat (Dani held (160, -192)).

## Observation: coffee pair and Tomasz's print errand
Game 8415: the Irina talk was done while Lerato and Tomasz were at the machine, but Tomasz never started a `print` job in 90 s, so the observation was not exercised (the errand did not fire in this run, with or without the pair). Not resolved; left as an open observation. The static reading stands: the second user's beside cell is the right side (116, -132) first, the copier cell second.

## m2 (engine note, no code edited)
See BUILD_LOG.md: the behaviour room label is the first `roomBounds` entry holding the feet (`npc-behavior.js:996`), so a bottom walkable row of a room that overlaps its southern neighbour reads as the neighbour. Not fixed here.

Closed in round 4: with `forget: true` the print happens at once and creates no errand, so a coffee pair on the copier cell cannot block it (REVIEW_BUILD_R4.md item 2).
