# NPC carried items slice C: delta review, round 2

Branch `build/ol-carry-c`, tip `05c9da6f4` (clean merge of main). Scope: the R1 fixes in
`8a0d38bb5` (diffed against `458e1592b`), checked against `NPC_CARRIED_ITEMS_SLICE_C_REVIEW_R1.md`
and read in the context of `rooms.js`, `game.rb`, their tests and the live driver.

R2: 0 blockers / 0 majors / 4 minors.

## R1 findings: fixed?

- **m1 (px/py room bound): fixed.** `roomPixelSize(map)` (`rooms.js:583`) reproduces the dimension
  logic of `createSpriteAtRandomPosition` (json, data, bare map; 10 tile fallback). The bound is
  inclusive on all four edges, uses `roomPos` as origin, and refuses `px`/`py` when no size is
  passed. Both call sites pass `roomPixelSize(map)`; `map` is the Phaser tilemap in scope for
  `createRoom` (`rooms.js:1991`), whose `width`/`height` are tiles, so the third branch of the
  helper is the one that runs live. Tile `x`/`y` behaviour is untouched. No off-by-one: edge
  values are accepted and tested. The `sprite.x` computation after the check is unchanged.
- **m2 (unpaired coordinates): fixed.** `sanitised_carry_position` (`game.rb:1361-1370`) keeps
  `x`+`y` and `px`+`py` only as valid pairs and `elevation` only beside a kept pair, returning nil
  otherwise. Downstream nil handling is safe: `carry_object!` writes `fromPos` only `if from_pos`
  (`game.rb:1342`), and `end_stranded_carries!` uses `from_pos.is_a?(Hash) && from_pos.any?`
  (`game.rb:1785`), so nil, `{}` and a missing key all fall back to the scenario position. Nothing
  else reads `fromPos` (grep of `app/` and `public/`). A pair is not dropped wrongly: the keys the
  put-down, KO-drop and player-drop writers produce are always whole pairs.
- **m3 (call sites): fixed.** `room-object-position.test.mjs` pins both calls by exact text and
  checks the creating call precedes and the placing call follows each (`rooms.js:2484/2501` and
  `2506/2514`). It would fail if either call were removed, lost the size argument, or moved after
  the placing call. It is a source-text check, so it cannot prove runtime order; acceptable given
  `createRoom` needs Phaser. The live branch (matched or fallback) taken by the T2 mug is still
  unrecorded, as the Outcomes say.
- **m4 (JSDoc): fixed.** The `createSpriteAtRandomPosition` block is directly above it.
- **m5 (plan text): fixed.** Matches `game.rb:1514-1518`.
- **m6 (driver paths): fixed.** `REPO_ROOT` from `import.meta.url`, `PLAYWRIGHT_NODE_MODULES` and
  `PLAYWRIGHT_CHROMIUM_EXECUTABLE`/`CHROMIUM` overrides. `new URL(...).pathname` is not
  percent-decoded, so a checkout path containing a space would break it (not the case here;
  noted only).

## Would the tests fail on the old code?

- `room-object-position.test.mjs`: yes. It slices from `function roomPixelSize(`, which does not
  exist in `458e1592b`, so the file fails to load; the out-of-room, other-room and no-size cases
  would also fail on the old unbounded helper. I ran it here: 12 pass, 0 fail.
- Controller tests: the renamed hostile test expects nil where the old code returned
  `{x, py, elevation}`; the new pair test expects `{px, py, elevation}` where the old code also
  kept the bad `x`. Both fail on the old code by reading. I could not run them (see Suites).

## Hostile input

Still covered server-side by `valid_ko_coord?` (finite Numeric within +/-100000) on every kept
key, with unknown keys dropped and `fromPos` never read from a request. The new client bound
covers `px`/`py` only; see m1 and m2 for what remains.

## Findings

### Blocker

None.

### Major

None.

### minor

**m1. Tile `x`/`y` in a stored position have no room bound** (`rooms.js:604-605`; copied into
`fromPos` at `game.rb:1365-1368`). `applyScenarioObjectPosition` still places `x: 99999` at
`roomPos.x + 99999 * 32`, so a tampered player-drop record (pre-existing writer) puts the object
off the map after a reload, and the carry/put-back path now preserves that spot instead of
re-seating it at the scenario position. Impact is the player's own game, but a carried gating
object (the `lab_physical_pentest` USB) could be stranded. Fix: in `sanitised_carry_position`
(or `end_stranded_carries!`) keep a tile pair only when both are within a small tile bound (for
example 0..200), or have the client refuse tile values outside `roomSize / TILE_SIZE`; add a
test for `x: 99999, y: 3`.

**m2. `elevation` accepts +/-100000** (`game.rb:1369`). Beside a valid pair, a stored
`elevation: 100000` is kept and `setDepthAndStore` (`rooms.js:451`) adds it to the depth, so the
object draws above every sprite and UI-adjacent layer; a large negative value sinks it under the
floor. Cosmetic, own game only. Fix: bound elevation to a small range (for example 0..256) in
the sanitiser and test a hostile value.

**m3. `roomPixelSize` duplicates the dimension logic of `createSpriteAtRandomPosition`**
(`rooms.js:583-592` and `rooms.js:612-626`). Two copies of the json/data/bare-map probe and the
10 tile fallback will drift. Worse, the fallback is a wrong bound if both ever diverge: a legit
`px`/`py` in a room larger than 10 tiles would be refused. Fix: have `createSpriteAtRandomPosition`
call `roomPixelSize`.

**m4. Test gaps around the new rules.** (a) No case for `elevation` alone or `elevation` beside
a half pair (should yield nil); (b) no case for a valid `x`/`y` pair beside bad `px`/`py`; (c)
no JS case for a `px` inside the room with `py` non-finite when a size is present beyond the
`NaN` px case. All three pass by reading the code, but nothing pins them. Fix: add one controller
test for (a) and (b) and one unit case for (c).

## Notes, no action needed

- A put-down while the NPC straddles a doorway is stored under `to_room` with a centre in the
  neighbour's rectangle, so on reload it takes the random spot in `to_room`. That is the
  documented intent of the R1 m1 fix.
- The server adds no room geometry, as the Outcomes say. Agreed: it has none.
- The loop in `end_stranded_carries!` and the bootstrap path are unchanged; no new duplicate or
  loss path. A second bootstrap still `reject!`s then appends.

## Suites

- `node --test test/js/room-object-position.test.mjs`: 12 pass, 0 fail.
- `bin/test-js` full: started but exceeded the 120 s tool limit and was not completed in this
  review; the R1 Outcomes report 683 files passed after the fixes.
- Rails: `bin/rails test` could not start in this shell (bundler cannot find the pinned gems
  under Ruby 2.7.8), so the controller tests were reviewed by reading, not run. The Outcomes
  report 2925 runs, 0 failures.

R2: 0/0/4
