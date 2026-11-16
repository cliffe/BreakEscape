# NPC carried items, slice C: round 5 delta review

Branch `build/ol-carry-c`, tip 3ad84388a. Scope: commit 3bc1b6ea5 against the R4 review and its
Outcomes, plus a sanity pass over `git diff main...HEAD`. Last round: only what is wrong.

**Counts: Blocker 0, Major 0, minor 2.**

## R4 findings

- **M1 (objects under the south wall): fixed for the objects it named.** The five moved objects are
  at row 7 and the CEO Desk is at (4,5) (y 160..221 px, inside the 256 px floor). See m1 for a gap in
  the new guard.
- **m1, m2, m3: fixed.** `assert_nil` is used; the room lookup is built from the `game.js`
  `tilemapTiledJSON` pairs and matched exactly; the tableItems comment is correct.

## Checks asked for

- **game.js key parsing.** `scenario_object_tile_bounds_test.rb:21-24` scans for
  `tilemapTiledJSON('<key>', 'rooms/<file>')`. The file has 144 such lines, all single-line and
  single-quoted, no ERB, and none commented out; the scan yields 144 keys, all with a size. If the
  pattern stops matching (a loop, double quotes, a line break), `MAPS` shrinks and the first test's
  `assert size` fails for every affected room type, so it fails loudly. There is no explicit
  `MAPS.size` assertion, but the per-room assert covers it. A commented-out `load.tilemapTiledJSON`
  line would still match, which could hide a missing key; none exists. Not a finding.
- **Overlap rule and the skip.** Rooms stack vertically with a two-tile overlap, so only a room with
  a `south` connection has a neighbour whose top wall covers its bottom rows. Rooms without one
  (for example `office` in `test_table_items`, whose Floor Safe at (8,8) is fine) are correctly
  skipped. The rule has an off-by-one, see m1.
- **Real missions.** The branch changes no real mission scenario. The test run prints only the two
  `lab_physical_pentest` hall fire extinguisher entries (y 5.3, 6-row hall, the deliberate door
  prop), as in R4. No real mission is newly affected.
- **Executive Desk at (4,6.5).** A fractional tile is fine for the client. A dynamic table does not use
  the bound; `rooms.js:2290-2295` computes `Math.round(position + y * TILE_SIZE)`, and 6.5 * 32 = 208
  is a whole pixel. The desk covers x 128..206, y 208..269 (`desk-ceo2` is 78 x 61), inside the
  floor (`office` has no south room, so rows 8 and 9 are its own). The Tiled item slot at
  x 99.2..131.2, y 228..260 overlaps it by 3 px at x 128..131. That slot is a spawn position for a
  floor item, not a collider, and the item stays visible and reachable from the left, so this is not a
  finding.
- **Suites.** `bin/rails test` on the two files: 53 runs, 689 assertions, 0 failures, 0 errors.

## Findings

### minor

**m1. The south-neighbour rule misses y equal to height - 2, the row it was written to catch**
(`test/unit/scenario_object_tile_bounds_test.rb:101`). The condition is `pos['y'] > size[1] - 2`. In a
10-row room the hidden band is rows 8 and 9, and an object placed by its top-left corner at y 8 is
fully inside it (that was the R3 state of test-rfid and the desfire room). `8 > 8` is false, so the
test would not have caught the bug it was added for. The comment says "the last two rows".
Failure scenario: someone sets a test object to y 8 in a room with a south connection, the test
passes, and the object is hidden. One existing test scenario relies on the gap on purpose:
`scenarios/test_behind_wall_fade/scenario.json.erb:47` (`office_n` keycard at y 8, "drawn under the
hall's back wall"). Fix: use `>= size[1] - 2`, and exempt `test_behind_wall_fade` (or objects whose
`observations` say they are meant to sit under the wall) in the same way as `REPORT_ONLY`, then add a
case that proves y 8 is flagged. Real missions are unaffected by the change (report only).

**m2. Stale text in `test_table_items` after the R4 moves**
(`scenarios/test_table_items/scenario.json.erb:107`, `:153`, `:2`). The Executive Desk laptop says
"room-relative tile (x=4, y=4)" but the desk is at (4, 6.5); the CEO Desk laptop says (x=4, y=7) but
the desk is at (4, 5). The scenario brief still says floor item x/y are "room-relative pixel
offsets", and the Test Guide note lists the safe at "x=50, y=80", though the slice changed them to
tile values. Failure scenario: a tester or author reads the in-game text, trusts it as the reference
for placement, and writes pixel values that the client bound then discards for a random spot. Fix:
update the two laptop texts to (4, 6.5) and (4, 5), and change the brief and Test Guide to say tile
coordinates (safe at x=8, y=8).

## Slice coherence

The diff is coherent for training: server put-back to `fromPos` with bounds (`game.rb`), client
`roomPixelSize` and `applyScenarioObjectPosition` with matching bounds (server `0..64` contains the
client `0..room size`), the `npc-needs.js` consume re-request, tests at server, unit and node level,
the three test scenarios moved to tile values, and the plan/live/review docs. No dead code or
leftover debug found in the changed files.

## Suites

- `bin/rails test test/unit/scenario_object_tile_bounds_test.rb test/controllers/break_escape/npc_carried_items_test.rb`:
  53 runs, 689 assertions, 0 failures, 0 errors.
- `bin/test-js`: run in the background; result noted in the hand-off message.

R5: 0/0/2

## Outcomes

- **m1: fixed.** The rule is now `y >= rows - 2`, held in `hidden_under_south_wall?` so the test and the
  new case share it. `test_behind_wall_fade` `office_n` `north_card` (y 8) is exempt through the named
  `DELIBERATE_UNDER_WALL` list, with a comment giving the reason. A new test proves y 8 and y 9 are
  flagged in a 10-row room and y 7 is not. With the exemption emptied the main test fails on that
  keycard, so the exemption is needed. No other scenario is newly flagged. `test_objectives` and
  `test_simple_success` are untouched. Real missions stay warn-only: the only entries are the two
  `lab_physical_pentest` hall `fire_extinguisher1` objects (y 5.3, 6-row hall), unchanged.
- **m2: fixed.** The laptop texts now say (4, 6.5) and (4, 5). The brief says tile coordinates. The
  Test Guide lists the safe at x=8, y=8 and the CEO desk at tile (4, 5). The guide also named a
  keycard at (x=160, y=240) that does not exist in the scenario, so that line was removed.
- **Suites on the final tip:** `bin/test-js` 687 passed, 0 failed, 687 total. `bin/rails test`
  2936 runs, 48082 assertions, 0 failures, 0 errors, 3 skips. Rubocop on the changed Ruby file: no offences.
