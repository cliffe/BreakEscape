# NPC carried items, slice C: delta review R3

Branch `build/ol-carry-c`, tip `d7a8b381f`. Scope: `1aebf2793` diffed against `c182c2d0a`, checked
against the R2 review and its Outcomes.

**Counts: Blocker 0, Major 1, minor 2.**

## Scenario audit (priority 1)

Script: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/audit.rb`
(not in the repo). It renders every `scenarios/*/scenario.json.erb`, `scenario.json` and top-level
`scenarios/*.json[.erb]` through `BreakEscape::ScenarioBinding` (183 files, 0 failed to render),
walks each room's objects (and nested `contents`), and compares tile `x`/`y` with the width and
height of the room type's Tiled JSON. The map is the one `rooms.js` loads with
`tilemapTiledJSON(<room type>)`; `room_it` resolves to `room_IT.json`, and no room type was
without a map. `x`/`y` are tiles relative to the room origin (`roomPos.x + x * TILE_SIZE`); the
test is `0 <= v <= size`, inclusive, exactly as `applyScenarioObjectPosition` reads it.

- Objects with an object-form `position`: 539, all with tile x/y. None uses `px`/`py` (that form
  is only written at runtime). 204 more use the `as-type:` string form and are not affected.
- Rejected by the new bound: **15 objects in 3 scenarios** (list under M1).
- Elevation: 29 authored values, range 18..40, all numeric. The 0..256 range covers all of them.
- Largest room: 20 x 10 tiles (`room_aes_hall1`, `room_aes_hall2`, `room_m10_hall` and others;
  `room_uni_library` is 20 x 6). A server bound of 200 covers it ten times over.

## Findings

### Blocker

None.

### Major

**M1. The client tile bound rejects 15 authored objects in three test scenarios, which fall back to a
random spot** (`public/break_escape/js/core/rooms.js:588-600`, called from `rooms.js:2484` and
`rooms.js:2498`). The coordinates are far outside the 10 x 10 tile rooms they sit in:

- `scenarios/test-rfid/scenario.json.erb`: `notes` "Security Notice" (250,300), `notes` "Success
  Note" (300,300), `keycard` "CEO Keycard" (350,300).
- `scenarios/test-rfid-multiprotocol/scenario.json.erb`: `notes` "Protocol Guide" (250,250),
  `rfid_cloner` "RFID Flipper" (300,200), `notes` x3 "Success - EM4100 / MIFARE Weak / MIFARE
  Custom" (300,300), `keycard` "Test Corporate Badge" (350,250), `notes` "Success - All Levels
  Passed" (300,300), `keycard` "Executive Card (DESFire)" (350,250), `keycard` "Master Override
  Card" (350,350).
- `scenarios/test_table_items/scenario.json.erb`: `safe` "Floor Safe" (50,80).

(The `table` objects in `test_table_items` with x=50 or 60 also exceed the room but take the
dynamic-table branch at `rooms.js:2289`, which does not call this helper, so they are unchanged.)

Failure scenario: before `1aebf2793` these objects were placed at `roomPos + 250 * 32` px, about
8000 px off a 320 px room, so they were unreachable. After it they are placed at a random spot in
the room. For the two RFID scenarios that includes the keycards and the cloner, so a tester who
used to see them missing now finds them scattered, and any hard-coded expectation about position
changes on each load. The values look like pixels, not tiles. The only tests that load `test-rfid` (`sync_payload_size_test.rb`, `sync-request-sizes.test.mjs`)
check payload sizes, not object positions, so no suite catches it. It is a behaviour change on authored
data, hence a major under the brief, although the earlier state was already broken.

Fix: either correct the 15 coordinates to in-room tiles (roughly pixel / 32, so 250,300 becomes
about 8,9), or accept the change and say so in the Outcomes. Add a Rails or node test that renders
every scenario and asserts each object-form tile `x`/`y` is within its room type's map size, so
the bound and the data cannot drift apart again; the audit script is the starting point.

### minor

**m1. Server and client bounds disagree on what is "in range"**
(`app/models/break_escape/game.rb:1202`, `game.rb:1371`; `rooms.js:593-594`). The server keeps any
tile value with `abs <= 200`, so `x = -5` or `x = 150` is stored as `fromPos`. The client rejects
negatives and anything above the room size (at most 20). Failure scenario: a tampered record with
`x = 150` passes the server, is written back on put-back, and the client then ignores it and uses a
random spot every reload. No harm beyond the object landing somewhere else, and the R2 Outcomes
call the bound "generous" on purpose, but "agree" holds only for 0..20. Fix: tighten the server to
`0..CARRY_TILE_BOUND` with the bound at 64 (still three times the largest room), or state in the
comment that the client is the stricter check.

**m2. Comment displaced above the new constants** (`app/models/break_escape/game.rb:1198-1204`).
The two-line "Object types that may never be carried..." comment, which documented
`CARRY_DISQUALIFYING_TYPES`, now sits above the new "Stored carry positions" comment and the two
new constants, so it reads as describing `CARRY_TILE_BOUND`. Fix: move the new comment and
constants above the old comment, or below the `CARRY_DISQUALIFYING_TYPES` line.

## Other checks

- `createSpriteAtRandomPosition` refactor: no regression. The old probe was `map.json`, else
  `map.data`, else `map`, taking the size only when both width and height were truthy, with a
  10 x 10 tile fallback. `roomPixelSize` uses `map && (map.json || map.data || map)` with the same
  truthiness test and the same fallback, so results are identical for every input, including a
  null map. The new source test pins the call. One copy of the old probe survives in the dynamic
  table branch (`rooms.js:2285-2288`); it behaves the same today, but it is the duplication this
  slice set out to remove. Not raised as a finding, since it is outside the diff.
- Off-by-one: `v * TILE_SIZE <= limit` and `v >= 0` make both edges inclusive, matching the
  `px`/`py` rule; the test covers `x: 20, y: 15` on a 20 x 15 room and rejects 21 and -1. The
  server `abs > 200` keeps 200 and rejects 201, consistent with `CARRY_TILE_BOUND = 200`.
  `elevation.between?(0, 256)` keeps both ends.
- With only one of x/y present, the other is `undefined` and passes `tileOk`, as before. If either
  present value is bad, neither axis moves (whole-position rejection), which matches the tests.
- Tile wins over `px`/`py` when both are present and valid; a bad tile pair returns before `px`/`py`
  is read, so a valid `px`/`py` beside a bad `x`/`y` is ignored. The server drops the bad tile pair
  and keeps `px`/`py`, so this case cannot arise from a server-sanitised record.

## Suites

- `node --test test/js/room-object-position.test.mjs`: 15 pass, 0 fail.
- `bin/rails test test/controllers/break_escape/npc_carried_items_test.rb`: 48 runs, 178
  assertions, 0 failures, 0 errors.
- `bin/test-js` full: 687 files passed, 0 failed.

R3: 0/1/2
