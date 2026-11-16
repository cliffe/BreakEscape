# Sims tidy: round 3 delta review

Branch build/ol-sims-tidy, tip 6e8691061, diff 00f7a7b82..HEAD (commits 22a9815ba and 0e4b26bce).

**Counts: B 0, M 0, m 3.** The R2 fixes (m1 to m4) and the board fix hold. Nothing blocks merging.

## Confirming run

- `bin/test-js` on the tip: Files 690 passed, 0 failed, 690 total.
- Tour, BOARD_ROUTE=direct, fresh test_needs_sims game 6044 (keyless server on :3093, own pidfile, stopped after;
  no page errors): row 1 ok true (68 s), row 3 ok true, row 5 ok true, row 6 ok true.
  Row 3 detail: the board read succeeded from (226,48) with `read: true`, the queue formed, marek and tom
  turned back with reason off, and both are also listed under `parked` (reason no_source), apart from the
  turn-backs. `no_queue_why` null.
- Rows 2 and 4 are not part of this tour script.

## Tests fail on the old code

Source files from the two commits reverted in a scratch copy, new tests kept:

- path-seated-easystar: test 1 (diagonal gap between two chairs' padding) fails.
- path-doorways: the four new directWalkStall tests fail (10 to 13).
- seating: the three-tries sweep test fails.
- needs-sims-board-reach: tests 1 and 2 fail (mark and reach).
- needs-tour-rows tests the new helper file, so there is no old-code form to run.

Mutation check: removing `probe.touched = true` from the cost `valueOf` fails path-seated-easystar test 2
("a corridor blocked by a seated chair or its padding reruns without it"), so the touch detection is covered.

## Judgements

**Cost `valueOf` touch probe (npc-pathfinding.js:594): acceptable.** In EasyStar 0.4.4 the expansion code
evaluates `1 * getTileCost(x, y)` (and `1.4 *` for diagonals) for every in-bounds neighbour before
`checkAdjacentNode` tests avoid points or walkability, so any search that expands a node next to a padding
cell reads the cost and trips the flag. `getTileCost` returns the object because it is truthy, and the
arithmetic coerces it to 1, so path costs are unchanged. It can only give false positives (an extra rerun on
a failed search), never skip a needed rerun while the library behaves this way. Per-frame cost is nil: the
setup is one object per call plus one `setAdditionalPointCost` per padding cell, only when a chair is seated,
and `valueOf` is a boolean store. Cleanup is correct (`padCosted` leads to `removeAllAdditionalPointCosts`;
the avoid points are removed per cell).
The weakness is the fail direction: if a future EasyStar stops reading the cost for avoided neighbours, the
flag never trips and a blocked-by-padding failure silently skips the rerun. See m3 for the guard. A cleaner
alternative exists but costs more: on any failed search while padded chairs exist, rerun without them, with no
probe. That doubles every failed search near a seated chair, which is why the probe is worth keeping.

**Vendored easystar-0.4.4.js: acceptable.** `cmp` against
`https://cdn.jsdelivr.net/npm/easystarjs@0.4.4/bin/easystar-0.4.4.js` (the URL games/show.html.erb:317 loads)
shows the files are byte-identical (25142 bytes). The file carries its MIT licence header (copyright Bryce
Neal, full permission notice), which MIT requires on copies, and it sits under test/js, not shipped to
players.

**time-based directWalkStall (path-doorways.js:158 to 170): correct.** The history holds one sample at or
before the window start, so `elapsed` is at least 180 ms before a verdict, and the threshold scales with
`elapsed`, so a long frame does not cause a false replan. A free walk gains 150 px/s against a 50 px/s
threshold at any refresh rate (tests at 20, 60 and 360 Hz). Cost per frame is a push and a shift on a list of
at most about 65 entries at 360 Hz. `now` comes from `gameRef.loop.time`, falling back to
`performance.now()`, both in ms.

**Body-cell conditions plus padding avoid points: correct.** Padding is no longer a directional condition, so
the no-corner-cutting test ignores it and diagonal steps past padding work as before (real EasyStar test).
`seatedAvoidCells` now returns `{cx, cy, pad}` and the only other consumer path in npc-pathfinding.js uses
the new field.

**Sweep giving up (seating.js:1872 to 1896): works, with one weak spot (m1).**

**Board reach (0e4b26bce): correct.** `wallMounted` is read only by `reachY` in interaction-reach.js. For the
board (sprite y 13, height 52, span 13 to 65) the player's y is clamped into the span, so only the horizontal
gap counts. Live: the real click read succeeded (`read: true`). The test reproduces the failing numbers and
asserts the unmarked board is out of reach.

**Deadline Memo: does not need the mark.** Measured live on game 6044: sprite at x 262, y 22, 42 x 31
(span 22 to 53), origin top-left. The lowest stand point is y 49 to 52, so the distance to the top edge is 27
to 30 px against the 32 px range, with x clamped into the sprite's span. It is reachable, with a margin of 2 px
at worst. The tour does not read the memo (row 1 uses the socket and queue), so this rests on the geometry,
not on a driven click. If the margin worries you, adding `"wallMounted": true` to scenarios/test_needs_sims/
scenario.json.erb at the `deadline_memo` entry is harmless (no other code reads the flag).

## Findings

### m1. The doorway sweep's give-up resets when the foot moves by one pixel (seating.js:1877 to 1879)

`sweepKey` is the rounded foot `"x,y"`. The counter lives in `chair._doorSweep` and is replaced whenever the
key changes. Failure scenario: a glide that ends blocked inside the gap but is pushed 1 px by physics (a
resolved overlap, a sitter's body shifting) gives a new key on the next sweep, so `tries` restarts at 0 and
the chair keeps gliding once a second, never reaching the give-up and never logging. The test only covers an
exactly stationary foot. Fix: key on a coarse cell (`Math.round(x / 4)`, `Math.round(y / 4)`), or keep
`tries` on the chair and reset only when the chair has moved more than a few px from the first failed foot.
Add a test where each failed glide shifts the foot by 1 px.

### m2. DIRECT_WALK_SPEED duplicates MOVEMENT_SPEED (path-doorways.js:142)

The stall threshold compares against a hard-coded 150 that the comment says is `MOVEMENT_SPEED`
(utils/constants.js:39). player.js drives the body with the constant (core/player.js:1405). If the walk speed
is retuned, the threshold stays at the old figure: a faster walk is never wrongly flagged, but a slower one
(for example 100 px/s, against a 50 px/s stall threshold) gains 33 px/s over 180 ms and is flagged as stalled
and replanned on every direct walk. The path-doorways module has no imports so node tests can load it, which
is the reason for the copy. Fix: pass `speed: MOVEMENT_SPEED` from player.js at the call site (the helper
already takes `speed` in its options) and keep the default only for tests, or add a test that reads
constants.js and asserts equality.

### m3. Nothing ties the vendored EasyStar copy to the CDN version the game loads (app/views/break_escape/games/show.html.erb:317)

The `valueOf` probe depends on 0.4.4 internals and the real-library test runs the vendored copy, but a bump
of the CDN URL (for example to 0.4.5) would leave the test running 0.4.4 and green, while the live game gets
a library that may no longer read costs for avoided neighbours, silently skipping reruns (see the judgement
above). Fix: add a node test that reads show.html.erb, extracts the `easystarjs@x.y.z` version, and asserts
it equals the version in the vendored filename, with a message to re-vendor and re-run the probe tests on a
bump. Optionally add a comment beside `trip` (npc-pathfinding.js:594) naming that test.

## Outcomes

All three minors fixed, plus the extra margin.

- **m1 fixed.** seating.js keys the doorway sweep's give-up on a 4 px cell (`Math.round(x / 4)`, `Math.round(y / 4)`),
  not the exact rounded foot. New seating test: the foot is nudged 1 px after every failed glide (8, 9, 8, 9) and the
  sweep still stops at three tries with one give-up line. It fails on the old code.
- **m2 fixed.** player.js passes `{ speed: MOVEMENT_SPEED }` to `directWalkStall`. The helper keeps its default of 150
  for the node tests, which cannot import constants.js. New path-doorways test: the call site passes the constant, and
  the default equals the value in constants.js. It fails on the old code.
- **m3 fixed.** New `test/js/easystar-version.test.mjs` reads the EasyStar version from
  app/views/break_escape/games/show.html.erb and asserts that it matches the vendored file name under test/js/vendor.
  The message says to re-vendor and re-run the probe tests. Checked by changing the URL to 0.4.5 (fails), then reverting.
- **Extra margin.** The Deadline Memo in scenarios/test_needs_sims/scenario.json.erb is marked `wallMounted: true`.
