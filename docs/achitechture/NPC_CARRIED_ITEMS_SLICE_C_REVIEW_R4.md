# NPC carried items, slice C: review R4

Branch `build/ol-carry-c`, tip `66bd24cc2`. Scope: `git diff main...HEAD` as a whole, with the focus on
`b4cbf5961` (the R3 fixes), checked against R1 to R3 and their Outcomes. Includes a render check of
the rewritten scenario objects.

**Counts: Blocker 0, Major 1, minor 3.**

## R3 findings

- **M1 (pixel-style positions): partly fixed.** All 15 values are now tiles inside the map, the new
  scenario test passes, and no object falls back to a random spot. But five of the new spots (and
  the CEO Desk) are on the bottom tile rows of a room that has a room to its south, and the render
  shows them hidden under that room's top wall. See M1 below.
- **m1 (server and client bounds): fixed.** The server keeps a stored tile pair only when both values
  are in `0..64` (`game.rb:1373`); the client keeps it only when it is in `0..room size` (at most 20).
  The server range contains the client range, so nothing the client would accept is dropped by the
  server, and the comment says which check is stricter. Hostile input is still handled server-side:
  `valid_ko_coord?` (`game.rb:5713`) rejects non-Numeric, NaN and infinite values before `between?`
  runs, so a string, `true`, a huge Integer or `-1e308` cannot reach the stored `fromPos`. The three
  new controller tests (negative x, y of 65, the 0 and 64 edges) pass.
- **m2 (comment order): fixed.** The `CARRY_DISQUALIFYING_TYPES` comment sits directly above that
  constant (`game.rb:1204-1206`).

## Does the scenario test match rooms.js?

`test/unit/scenario_object_tile_bounds_test.rb` against `rooms.js:577-605`, `rooms.js:1978` and
`game.js` preload:

- **Room size.** rooms.js builds the map with `make.tilemap({ key: roomData.type })` (`rooms.js:1978`),
  and `roomPixelSize` reads `width`/`height` from it, falling back to 10 x 10 tiles. All 144
  `tilemapTiledJSON` keys in `game.js` equal their file's basename in lower case, so the test's
  "basename, downcased" lookup gives the same size as the runtime for every key. I rendered all 183
  scenario files: every room type is exactly a loaded key (none differs only in case), so the
  test's case folding and the runtime's exact match agree today. See m2 for the gap.
- **Fallback size.** The runtime falls back to 10 x 10 for a type with no map; the test fails instead
  (`assert size`). Stricter than the runtime, which is the right way round.
- **`as-type:` string positions.** The test skips any non-Hash `position`; `applyScenarioObjectPosition`
  returns on a non-object. Same.
- **Value types.** The client needs `Number.isFinite`, the test needs `Numeric` in `0..limit`, both
  inclusive. A quoted `"5"` fails both.
- **tableItems.** The test does not walk `tableItems`, which is right for the bound. Its comment says
  tableItems "use table-relative pixels ... matching how rooms.js reads them", but rooms.js reads a
  table item's top-level `x`/`y` (`rooms.js:2378-2384`), not `position.x`/`position.y`. The
  `position` blocks inside `tableItems` in `test_table_items` (lines 45, 104, 113, 150, 159) are
  never read. See m3.
- **contents.** The test also checks positions inside `contents`, which rooms.js never places. It finds
  none today, so this only costs a false positive later.
- **Dynamic tables.** The test checks the table's own `position` (Executive Desk, CEO Desk). rooms.js
  places a dynamic table without the bound (`rooms.js:2289-2294`), which is unchanged from main.

## Real missions

The only scenario files the branch changes are the three test scenarios (plus two README/PLAYTEST
notes). The new client bound applies to every authored object, so I checked that it rejects none:
the scenario test passes over all 183 files, and no m01 to m10 or lab scenario authors `px`/`py`.
In-bound tile values are placed exactly as on main (`roomPos + v * TILE_SIZE`), so no mission
object moves. Objects near an edge in real missions are wall fixtures at y 0.25 to 0.95 (m01
filing cabinet, chalkboards and bookshelf; lab_physical_pentest P4 safe and notices; sis02 alarm
panel) and the lab hall fire extinguisher at y 5.3 that props a door; all are inside the bound and
unchanged.

## Render check

Keyless server on :3092 (own pidfile, stopped by that PID afterwards). Games created with
`new-game.rb`, rooms unlocked at creation with its `--unlock` option: 5897 (test-rfid), 5898 and 5904
(test-rfid-multiprotocol; 5898 left `mifare_custom_room` locked by mistake, so 5904 repeats it with
all rooms open). Headless Chromium, every room loaded through `tools/playtest/lib/all-rooms-loader.mjs`
with NPC updates stubbed, `setFPS(20)` with fixed steps on, the player moved to each room's centre,
the HUD hidden and each moved object outlined. Script and shots:
`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/r4/`.

| Scenario, room (type) | Object, tile | Result |
|---|---|---|
| test-rfid, test_lobby (room_reception) | Security Notice (7,5) | Clear floor, right of centre, beside the plant's leaves. OK |
| test-rfid, test_secure (room_servers) | Success Note (3,8) | **Hidden** under test_lobby's top wall |
| test-rfid, test_secure | CEO Keycard (7,8) | **Hidden** under test_lobby's top wall |
| multiprotocol, lobby (room_reception) | Protocol Guide (5,5) | Clear floor (under the player's spawn point). OK |
| multiprotocol, lobby | RFID Flipper (7,5) | Not created: `rfid_cloner` is in `startItemsInInventory`, so rooms.js skips it (as on main) |
| multiprotocol, em4100_room (room_office) | Success - EM4100 (5,6) | Clear aisle floor. OK |
| multiprotocol, mifare_weak_room (room_office) | Success - MIFARE Weak (5,6) | Clear aisle floor. OK |
| multiprotocol, mifare_custom_room (room_office) | Success - MIFARE Custom (4,6) | Visible, touching a swivel chair's bounds; reachable from the aisle. OK |
| multiprotocol, mifare_custom_room | Test Corporate Badge (5,5) | Clear aisle floor. OK |
| multiprotocol, desfire_room (room_servers) | Success - All Levels Passed (3,8) | **Hidden** under mifare_custom_room's top wall |
| multiprotocol, desfire_room | Executive Card (DESFire) (6,8) | **Hidden** under mifare_custom_room's top wall |
| multiprotocol, desfire_room | Master Override Card (8,8) | **Hidden** under mifare_custom_room's top wall, in the door's column |
| test_table_items, office / ceo | Floor Safe (8,8), Executive Desk (4,4), CEO Desk (4,7) | **Not rendered**: no Mission row for `test_table_items`, so `new-game.rb` cannot start it, and creating one is outside this review's rules. Geometry checked from the Tiled maps instead (below) |

With 5898, where mifare_custom_room was not loaded, the three desfire_room objects showed on the
room's own bottom rows. With 5904, once the south room loads, its top wall draws over them. In play
the player always arrives from mifare_custom_room, so it is always loaded.

Geometry for `test_table_items` (Tiled maps `room_office.json`, `room_ceo.json`, both 10 x 10):

- Floor Safe (8,8) in `office`: `office` has no room to its south, so rows 8 and 9 are its own floor.
  A 24 px safe at x 256..280 fits inside the right wall (about x 289). Probably fine.
- Executive Desk (4,4) in `office`: `desk-ceo2` is 78 x 61 px, origin top-left, so it covers x 128..206,
  y 128..189. That is the central aisle between the two Tiled desk banks (x 30..109 and 210..288,
  y 117..205), leaving gaps of about 19 px on the left and 4 px on the right. Whether the player can
  still pass depends on the table body box. Unproven either way.
- CEO Desk (4,7) in `ceo`: covers y 224..285. `ceo` is north of `office`, so its bottom two rows
  (y 256..320) sit under office's top wall, the same case as M1. Its two table items have no top-level
  `x`/`y`, so rooms.js puts their bottom edge at the desk's bottom edge (y 285), inside the hidden band.

## Findings

### Blocker

None.

### Major

**M1. Five rewritten objects (and probably the CEO Desk) sit under the south neighbour's wall and
cannot be seen** (`scenarios/test-rfid/scenario.json.erb:77`, `:93`;
`scenarios/test-rfid-multiprotocol/scenario.json.erb:218`, `:231`, `:240`;
`scenarios/test_table_items/scenario.json.erb:145`).

Rooms stack with a two-tile overlap: a room's bottom rows 8 and 9 (of 10) sit under the top wall of
the room to its south. The R3 Outcomes chose "interior y 2..8", but objects are placed by their
top-left corner, so y 8 puts the whole sprite in the hidden band whenever there is a south
neighbour. In the render, test_secure's Success Note and CEO Keycard and desfire_room's three
objects are drawn beneath the neighbour's wall: the outlines are empty.

Failure scenario: a tester opens the RFID door into test_secure (or desfire_room), sees no keycard
or success note, and concludes the reward did not spawn. The CEO Keycard and the Master Override
Card are takeable items the scenario hands over as the payoff. Picking them up would need an
interaction through the wall, if range allows it at all. Before slice C these objects were also
unreachable (about 8000 px off the room), so this is not a regression on main. It is a fix that does
not achieve what its Outcomes claim ("free floor"), and the scenario test cannot catch it, because
it bounds y to 0..10. The CEO Desk at y 7 reaches y 285 in a room whose floor ends at 256, so its
lower part and both table items probably land in the same band (geometry only, not rendered).

Fix: move the five objects to y 7 on open floor, using the shots as a guide. In room_servers, row 7
(y 224..256 px) is clear across the room, below both small desks (for example (2,7), (4,7), (6,7)); keep the Master
Override Card out of the south door's column (x 8). Move the CEO Desk up to y 5 or less (desk bottom
at most 256 px, so y <= 6.0 for a 61 px sprite) and keep it clear of the Tiled `desk-ceo2` at
x 118..196, y 86..147 and the sofa and plant on the left. For the Executive Desk, either render it
or place it in the open band below the desk banks (y >= 6.5) away from the chairs. To render
`test_table_items`, have the orchestrator decide how to give it a game, since it has no Mission row.
Optionally, extend the scenario test (or the validator) to warn when a non-wall object's top-left
y is beyond `height - 2` in a room that has a `south` connection. A plain error would trip the lab
hall fire extinguisher (y 5.3 in a 6-row hall), which props a door on purpose.

### minor

**m1. `assert_equal nil` in the new bounds tests** (`test/controllers/break_escape/npc_carried_items_test.rb:669`).
Two of the three parameterised cases pass `nil` as `expected`, and Minitest prints "DEPRECATED: Use
assert_nil if expecting nil ... This will fail in Minitest 6." twice per run. Failure scenario: the
Minitest 6 upgrade turns two passing tests into failures. Fix: `expected.nil? ? assert_nil(actual) :
assert_equal(expected, actual)`.

**m2. The test folds case on the room type but the runtime does not**
(`test/unit/scenario_object_tile_bounds_test.rb:19` and `:41`; `rooms.js:1978`). The test finds the
map by `room['type'].downcase` against file basenames; rooms.js asks Phaser for the exact key from
`game.js`. Failure scenario: a scenario with `"type": "room_IT"` passes the test (it finds
`room_it.json`), but at runtime no `room_IT` key is loaded, the map is empty, the bound falls back
to 10 x 10, and an object at x 15 in what should be a 20-wide room lands at a random spot. No
current scenario does this. Fix: build `MAPS` from the `tilemapTiledJSON('<key>', '<file>')` pairs
in `game.js` and look the type up exactly.

**m3. Test comment misdescribes tableItems; their `position` blocks are dead data**
(`test/unit/scenario_object_tile_bounds_test.rb:12-13`; `rooms.js:2378-2384`;
`scenarios/test_table_items/scenario.json.erb:45`, `:104`, `:113`, `:150`, `:159`). rooms.js reads a
table item's top-level `x`/`y`, so the `position` objects inside `tableItems` are ignored (the items
are auto-spread along the table). The laptop text still claims "table-relative (x=5, y=5)" while its
`position` says (30,10), and neither is used. This predates the slice, but the new comment repeats
the wrong model. Failure scenario: an author copies `test_table_items` as the reference for
table-relative placement, writes `position`, and the item ignores it. Fix: correct the comment
("rooms.js reads a table item's top-level x/y as table-relative pixels; `position` inside
tableItems is not read"), and either move the test scenario's values to top-level `x`/`y` or drop
them.

## Other checks

- The rest of the slice diff (put-back to `fromPos`, `end_stranded_carries!`, the `npc-needs.js`
  `requestSoon` after a consume, `roomPixelSize` refactor) is unchanged since R3, which reviewed it.
- `createSpriteAtRandomPosition` still calls `roomPixelSize`; the dynamic-table branch keeps its own
  copy of the probe (`rooms.js:2280-2286`), outside the diff, as R3 noted.

## Suites

- `bin/rails test test/unit/scenario_object_tile_bounds_test.rb test/controllers/break_escape/npc_carried_items_test.rb`:
  52 runs, 687 assertions, 0 failures, 0 errors (two deprecation warnings, m1).
- `node --test test/js/room-object-position.test.mjs`: 15 pass, 0 fail.
- `bin/test-js` full: still running when this file was committed; not recorded here (no code changed since b4cbf5961, where the R3 Outcomes report 687 passed).

R4: 0/1/3
