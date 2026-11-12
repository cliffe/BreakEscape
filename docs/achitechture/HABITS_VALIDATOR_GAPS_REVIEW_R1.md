# Habits validator gaps: review round 1

Branch build/habits-validator-gaps, commit 518d39e9c (`git diff main...build/habits-validator-gaps`).

Counts: 0 blockers, 1 major, 3 minor, 4 nits.

## What was checked

- `doorway_problem` (lib/break_escape/npc_habits.rb:235) against doors.js `calculateDoorPositionsForRoom` (doors.js:328) and `createDoorSpritesForRoom` (doors.js:394). They agree on everything I tested:
  - Doorways come from `connections.north/south/east/west` only. A string or a list both work, and so does a one-item list.
  - The match is `d.connectedRoom === connectedRoom && d.direction === direction` and is case-sensitive, so `North` makes no doorway.
  - `find` returns the first matching entry. Both `lockProps` (doors.js:493) and `fullDoorDefinition` (doors.js:564) use the same predicate, so the gate is always taken from the first entry. If the first entry carries `gate: { enabled: false }`, that disabled gate wins and a later live gate is ignored, which matches `:shadowed`.
  - A room listed twice under one direction makes two doorways, and both read entry 0. The validator gives no warning there, which is correct.
  - An east or west gate that does match a doorway still gets the existing side-door warning. One that matches no doorway gets only the new warning (`next`), which is the right priority.
- Gate registration (door-gates.js:224) joins the two rooms' sprites by position, so a gate on an unmatched entry is never registered from either side. The `:no_connection` reading is right even when the far room lists the doorway.
- Validator on all 175 `scenarios/*/scenario.json.erb`, on this branch and on main, comparing every ❌ and ⚠️ line: **no line differs in any scenario**. Branch totals are 106 ❌ and 1029 ⚠️, all already on main. The gated scenarios are unchanged: test_gate_tailgate 0 ❌ / 4 ⚠️, test_access_habits 0 / 3, lab_physical_pentest 0 / 7, m10_full_disclosure 0 / 68. No real scenario has a dead gate or an rfid lock outside the rooms and objects, so the new checks produce no false positives on shipped content.
- Tests: `node --test test/js/door-gates-validator.test.mjs` 27/27 pass; `bin/rails test test/unit/npc_habits_test.rb` 31 runs, 129 assertions, 0 failures.
- Probes (scratchpad script, not committed) for the cases below.

## Major

### M1. A lock on a door entry is reported as a soft-lock, but the engine never reads lock fields on door entries

scripts/validate_scenario.rb:1960-1975 (`other_requiring`) and test/js/door-gates-validator.test.mjs:401-404.

`other_requiring` walks every hash that is not a room or a room object, and that includes `rooms/*/doors[*]`. The engine ignores lock fields on a door entry:

- The bootstrap filter keeps a fixed list of room fields, and `doors` is not on it (app/models/break_escape/game.rb:872).
- doors.js:493 reads `roomData.doors` from `window.gameScenario`, the bootstrap scenario. So `lockProps` is `{}` in live play, and `locked`, `lockType` and `requires` all come from the connected room. Only `gate` is read from the full room data (doors.js:564).
- `validate_unlock` for a door reads the target room only (game.rb, `if target_type == 'door'`).

Gate entries also carry `requires` by design (test_gate_tailgate scenario.json.erb:51, lab_physical_pentest scenario.json.erb:1177). An author who adds `"lockType": "rfid"` there gets this warning (probe output):

> 'rooms/office/doors[0]' is locked with rfid 'SAM-1', a card only an NPC carries. Following someone through a gate does not give the player the card ... nothing opens it.

That fires on a careless guard's open gate into the room the card locks. The player can get through, and the warning tells the author to add a cloner. The new test at :401-404 fixes this false positive in place as expected behaviour.

Fix:
- Mark every door entry as counted before the walk: `rooms.each_value { |r| Array(r['doors']).each { |d| counted[d] = true if d.is_a?(Hash) } if r.is_a?(Hash) }`.
- Drop "a lock on a door entry" from the comments at :1929-1930, :1961 and :2010-2011.
- Change the test at :401-404 to assert that `'rooms/vault/doors[0]'` does not appear.
- If door-entry locks need a warning at all, make it a separate one in `check_access_model` next to the `access`/`acceptsUIDOnly` error (:6313-6318): "`locked`/`lockType` on a door entry is not read in play (the bootstrap scenario has no doors); put the lock on room X". Leave `requires` out of it: on a gate entry, `requires` documents the gate's card.

## Minor

### m1. Dead gates still count as gates in the habits expansion, its report and the dungeon graph

lib/break_escape/npc_habits.rb:135, :272-285; scripts/validate_npc_habits.rb:177; scripts/generate_dungeon_graph.rb:485.

`gate_entries` still returns gates on entries `doorway_problem` rejects. As a result:
- `doors_entry` lists them as gates the NPC holds.
- `check_holds_doors` loses its "holdsDoors false but no gate opens for it" warning when the only gate is dead. The new dead-gate warning in `check_access_model` partly covers this, but the habits report still says the habit applies.
- The graph labels the secured room's door node with "gate: held by ...".
- `expand!` writes a `noHold` onto a gate nobody reads. That is harmless, but it is noise.

Fix: add `doorway: doorway_problem(room, i)` to each `gate_entries` record. Then skip records with a truthy `:doorway` in `doors_entry`, in the graph loop, and in `check_lock_credentials` (that replaces the second `rooms[g[:room]]` lookup at validate_scenario.rb:1982). Add one unit test with a dead gate where the holdsDoors report says `:no_gate`.

### m2. The mirror edits removed the only test of "one gate of several into the same room is open"

test/js/door-gates-validator.test.mjs:175-177, :190-191.

The old mirrors pushed a second gate into vault2. That was a dead (shadowed) entry, so rewriting them was right, and both mirrors still check the positive case (an open gate into vault2 clears the warning). But nothing now exercises `states.include?(:open)` over two real gates into one room, from two different doorways. The probe shows the code handles it: a careful gate from office plus a careless gate from a second room into vault gives no warning.

Fix: add a test in which vault2 also connects north to a `lobby` with a careless guard and a south gate entry into vault2. Assert that the careful-only warning for vault2 goes away. As a mirror, drop the lobby gate's `openFor` and assert it comes back. Also add a `:shadowed` case where the first entry has `gate: { enabled: false }` (doors.js still reads that first entry).

### m3. An unlocked object with `lockType: 'rfid'` is still treated as a lock

scripts/validate_scenario.rb:1950 (`requires_card`), applied through the new walk at :1971.

The probe shows a start item with `locked: false, lockType: 'rfid', requires: 'SAM-1'` warned as "nothing opens it". `rooms_requiring` and `objects_requiring` had the same habit before. The new whole-tree walk reaches more places where an author leaves `lockType` on an unlocked item.

Fix: in `requires_card`, require `lock['locked'] == true`. Check first how unlock-system.js treats an object with `locked` missing and do the same: if missing means unlocked there, test `== true`, otherwise test `!= false`. Add a mirror to the start-item test.

## Nits

### n1. A wrong-case direction gets the "no direction" message

scripts/validate_scenario.rb:6327-6330. For `"direction": "North"` the warning says the entry has "no 'direction'". Fix: when `door['direction']` is present, say "direction 'North' is not one of north, south, east or west (lower case)".

### n2. A null entry in `doors` crashes door creation, and the validator skips it silently

doors.js:493 and :564 call `d.connectedRoom` on every entry, so a `null` throws a TypeError. `createDoorSpritesForRoom` then fails for that room. validate_scenario.rb:6310 does `next unless door.is_a?(Hash)`. This was there before the diff, but the diff now models doors.js reading these entries. Fix: raise ❌ for a non-object entry in `doors`.

### n3. The `doorway_problem` comment sits above the constant, not the method

lib/break_escape/npc_habits.rb:226-235. Move `DOOR_DIRECTIONS` above the comment so the comment leads straight into `def doorway_problem`.

### n4. Over-long comment lines left from the edit

scripts/validate_scenario.rb:1926 and :1930 run well past the file's usual width. Reflow them.
