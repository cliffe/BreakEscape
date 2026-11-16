# NPC carried items slice C: implementation review, round 1

Branch `build/ol-carry-c`, tip `458e1592b` (main `1cc3ae166` merged in). Scope: `git diff main...HEAD`.

## What slice C does

A needs NPC can pick up an ordinary dressing object, carry it, and put it down, use it up
(consume) or drop it when knocked out. The server tracks each carry in
`player_state['npcCarry'][npc_id]`, written only by the four `update_room` carry actions
(never by a client sync). On a reload the bootstrap ends every stored carry and puts the
object back where it was picked up (decision D32 (a): put back, not resumed).

Slice C adds:

- **C1, put-back position.** `carry_object!` (`app/models/break_escape/game.rb:1309`) now
  stores an optional `fromPos`, read by `sanitised_carry_position` (`game.rb:1353`) from the
  server's own `objects_added` record of the object, before the object leaves the room. Only
  `x`, `y`, `px`, `py` and `elevation` survive, each checked with `valid_ko_coord?` (finite
  Numeric within +/-100000). `end_stranded_carries!` (`game.rb:1760`) writes the object back
  into `fromRoom` at `fromPos` when the entry has one, else at the scenario position, and now
  skips the floor copy when the player already holds the object.
- **C2, prompt sync after a consume.** `consumeHeld` (`public/break_escape/js/systems/npc-needs.js:5640`)
  calls `stateSync.requestSoon()` once the server confirms the consume, so the globals the
  `npc_used` mapping writes straight after reach the server before a tab close.
- **rooms.js `applyScenarioObjectPosition`** (`public/break_escape/js/core/rooms.js:582`, commit
  `b585d672e`). Both `createRoom` branches (`rooms.js:2481`, `rooms.js:2495`) call it. Tile
  `x`/`y` keep their old meaning and win; with neither present, a finite `px`/`py` pair places the
  sprite centre at those absolute world pixels. Before this, a put-down or KO-drop record
  (which stores only `px`/`py`) was rebuilt at a random spot.
- The dead `merge_npc_carry!` is already gone on main (removed in `cf40b8e54`); this branch adds
  nothing there.
- Tests: 9 controller tests in `test/controllers/break_escape/npc_carried_items_test.rb`, a C2
  wiring test in `test/js/npc-carry-wiring.test.mjs`, 6 unit tests in
  `test/js/room-object-position.test.mjs`, and the live driver
  `tools/playtest/npc-carry-reload-proof.mjs`.

## Verdict on the checks asked for

- **Cheat resistance.** Holds. `fromPos` is never read from the request (tested with a forged
  `fromPos` and `position` in the `carry_object` body) and a sync delta with `npcCarry` writes
  nothing (tested). The put-back object is rebuilt from the scenario definition through
  `carriable_object_index`, the allowlist that excludes keys, credentials, locked objects and
  lock-referenced ids; only the position comes from the stored record, and extra keys in that
  record are dropped (tested with `flags`/`type` injected into the stored position). No path in
  the diff can mint or duplicate an object.
- **player_state growth.** Bounded. A carry entry gains at most five numeric keys and is deleted
  when the carry ends; `npcCarry` is server-written and not synced from the client. The put-back
  does `reject!` then `<<` on `objects_added`, so a second bootstrap does not add again (tested).
- **Reachability and room checks.** Unchanged. The put-back room is the pick-up room, which
  passed `room_unlocked?` and `npc_can_reach_room?` at pick-up.
- **Duplicates and losses.** Reload: one copy, at `fromPos` or the scenario spot (tested, and
  live T1/T2 games 5755 and 5756). Consume: entry cleared, origin `objects_removed` kept, no floor
  copy (tested). KO drop and put-down: their own position wins over `fromPos` (tested). Object
  already in the inventory at reload: entry dropped, no floor copy (tested). Room change: the
  put-back always targets `fromRoom`, never a room the client names. I found no duplicate or
  loss path.
- **rooms.js regressions.** None for authored objects. For every object with a tile `x` or `y`,
  the helper does exactly what the two removed lines did (including the `x: null` and string
  position cases). No shipped scenario authors `px`/`py` on a room object (searched
  `scenarios/`), and no other server writer stores `px`/`py` in `objects_added`: the player drop
  and NPC KO-drop paths go through `item_add_params`, which permits only `position: [:x, :y]`.
  The only records whose rebuild changes are the carry put-down and carry KO-drop records, which
  is the intent.
- **Position values reaching rooms.js from player-controlled state.** Two routes, both bounded
  only by `valid_ko_coord?` (+/-100000): tile `x`/`y` from a player drop (pre-existing, not
  widened here; `fromPos` copies the same values) and world `px`/`py` from a put-down or KO drop.
  The second is new reach: see m1.

## Findings

### Blocker

None.

### Major

None.

### minor

**m1. A put-down or KO-drop `px`/`py` is now applied with no room bound** (`public/break_escape/js/core/rooms.js:587-590`;
the value is written by `apply_carry_position`, `app/models/break_escape/game.rb:1500-1508`).
The server accepts any finite `px`/`py` within +/-100000 from the client's `put_down_object` or
`ko_drop_carried` body. Before `b585d672e` the rebuild ignored it and used the random in-room
spot; now the sprite is placed exactly there. Failure scenarios:
(a) a tampered client puts its NPC's carried object down at (90000, 90000), or inside a wall,
and after a reload the object is off the map or out of reach; (b) a legitimate put-down while
the NPC is crossing a doorway names `to_room` from the behaviour's `roomId`, so the object is
stored in one room but drawn inside the neighbour's area, and appears only once its owning room
is built; (c) absolute world pixels go stale if a scenario update moves the room's origin after
the save. The impact is limited to the player's own game and to ordinary dressing (the allowlist
keeps keys and credentials out), but a carried object that gates something (the
`lab_physical_pentest` USB foothold is a carried object) could be lost to a bad value.
Fix: in `applyScenarioObjectPosition`, accept `px`/`py` only when the centre lies inside the
owning room's rectangle (origin `roomPos`, size from the map, which `createSpriteAtRandomPosition`
already computes), otherwise keep the random fallback; optionally clamp to the same padded
area the random placement uses. Add a unit test for an out-of-room `px`/`py`.

**m2. `sanitised_carry_position` keeps unpaired coordinates** (`app/models/break_escape/game.rb:1365-1369`).
Each key is checked alone, so a stored `{ x: 5.0, y: "nope" }` becomes `fromPos { x: 5.0 }`, and
`{ px: 1_000_000, py: 60 }` becomes `{ py: 60 }`. On rebuild, a lone `x` sets only the sprite's
x (`rooms.js:584-586`) and y stays random; a lone `py` is ignored. The test at
`test/controllers/break_escape/npc_carried_items_test.rb` ("a hostile stored drop position is
sanitised") asserts the mixed `{ x, py, elevation }` result as correct. `apply_carry_position`
already requires both `px` and `py`. Fix: keep `x`/`y` only as a valid pair and `px`/`py` only as
a valid pair (and `elevation` only alongside a kept pair); return nil when no pair survives;
update the test to expect `nil` (scenario position) or a whole pair.

**m3. The rooms.js unit test does not prove the live call sites** (`test/js/room-object-position.test.mjs:14-18`).
The test slices the helper's source text out of `rooms.js` and evaluates it, which is the real
function body, but nothing checks that `createRoom` still calls it on both branches
(`rooms.js:2481`, `rooms.js:2495`). If either call is removed or reordered after
`placeMatchedScenarioItem`, the unit tests stay green; only the one live run (T2, game 5755)
proves the matched-item branch or the fallback branch, and the doc does not say which branch the
mug took. This is the same pattern as the earlier lesson where helper tests passed while the live
path broke. Fix: add a source-level assertion that both `createRoom` branches call
`applyScenarioObjectPosition` before `placeMatchedScenarioItem`/`setDepthAndStore`, and record in
the live doc which branch built the mug (or run one beat per branch).

**m4. The new helper splits `createSpriteAtRandomPosition` from its JSDoc** (`public/break_escape/js/core/rooms.js:568-582`).
The `/** Helper: Create sprite at random position ... */` block now sits directly above
`applyScenarioObjectPosition`, so editors and doc tools attach it to the wrong function. Fix:
move the helper and its comment above that JSDoc block.

**m5. The background plan still describes `merge_npc_carry!` as live** (`docs/achitechture/NPC_CARRIED_ITEMS_PLAN.md:49-53`).
The bullet says the sync merge validates carries and rebuilds entries on the narrow load; the
method was removed in `cf40b8e54` and a sync `npcCarry` delta is now ignored. A reader could
assume a sync path exists and test or harden the wrong thing. Fix: replace the bullet with one
line saying there is no sync merge and carries are written only by the four carry actions.

**m6. The live driver hard-codes this worktree's paths** (`tools/playtest/npc-carry-reload-proof.mjs:15-17`).
`createRequire` points at `.claude/worktrees/p-ol-carry-c/node_modules/` and the browser at a
specific `chromium_headless_shell-1248` build. Once the worktree is cleaned up after landing, the
driver fails on main with a module-not-found error, so the reload proof cannot be re-run. Fix:
resolve `node_modules` from the script's own repo root (`new URL('../../', import.meta.url)`)
and take the browser path from an environment variable, with the current value as the default.

## Notes, no action needed

- C2 fires `requestSoon` only after the consume response, so a tab killed during the request
  still relies on the pagehide flush. The window is one round trip, and the global is set
  client-side before the response either way. Acceptable.
- After a put-back of a scenario-spot carry, the next carry captures the scenario position as
  `fromPos` (it is now an `objects_added` copy). Same spot, so harmless; the updated test says so.
- The C2 test drives the real `createEngineWorld().consumeHeld` with a stubbed `stateSync`, and
  checks a refused consume makes no request. Good.
- The carry controller tests exercise the real `update_room` and `scenario` endpoints and the
  bootstrap path, not helper copies. Good.

## Suites

- `bin/test-js`: 683 files passed, 0 failed (including `npc-carry-wiring` and `room-object-position`).
- Rails (`bin/rails test`): 2924 runs, 47542 assertions, 0 failures, 0 errors, 3 skips.
- rubocop on `app/models/break_escape/game.rb` and
  `test/controllers/break_escape/npc_carried_items_test.rb`: 2 files, no offences.

R1: 0/0/6
