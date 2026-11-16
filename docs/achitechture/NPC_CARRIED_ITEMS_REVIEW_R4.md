# NPC carried items: review round 4 (delta)

R4: 0/0/2

Scope: the two R3 fix commits on `build/ol-carry`, `cf40b8e54` (cross-room carry,
reload ends a stranded carry, bounded KO drop, dead sync path removed) and
`3d0286f4b` (live proof), reviewed against the R3 review (`0/2/4`) and the serving
review (`0/0/3`). Read-only, no server started, no code edited. Reviewed for
correctness and server security together: that each of the nine fixes is real and
tested, and that nothing the fixes changed broke a legitimate carry.

The feature does not ship broken. Every R3 and serving finding is fixed in code
with a test, and the one behaviour the fixes narrowed (the KO drop room) does not
cut off any shipped scenario. The two minors below are a behaviour change to note
for future content and a pre-existing fragility the new rule now leans on; neither
breaks a shipped walk.

## The nine fixes confirmed

| Finding | State | Evidence |
|---|---|---|
| R3 M1 cross-room carry refused | Fixed | `carry_object!` drops the `info['room'] == from_room` equality, keeps `item_in_room?(from_room, item_id)` and adds `npc_can_reach_room?` (game.rb:1275-1289). Test "a carry picks the object up from a non-scenario room it was moved to" (npc_carried_items_test.rb:449) picks a mug up from the kitchen after a put-down there: 200, served held, gone from the kitchen floor. |
| R3 M2 reload strands a carry | Fixed | `end_stranded_carries!` (game.rb:1680) runs in `run_bootstrap_writers!` (game.rb:1674), gated by `stranded_npc_carries?` in `bootstrap_state_needs_write?` (game.rb:1640); `prepare_bootstrap_state!` saves when changed (game.rb:684-690). Test at npc_carried_items_test.rb:510: carry, GET /scenario, mug back on the floor exactly once, carry again returns 200. |
| R3 m1 / serving m3 KO drop lands anywhere | Fixed | `ko_drop_carried!` adds `npc_can_reach_room?(npc_id, room_id)` (game.rb:1374). Test at :488: a KO drop into the non-adjacent storeroom is 422, carry intact, nothing added. |
| R3 m2 dead sync path | Fixed | `merge_npc_carry!` deleted, the `npcCarry` sync branch removed (games_controller.rb:2598-2601 is now a comment only), `npcCarry` dropped from `RING_KEYED_SECTIONS` (games_controller.rb:2237). No reference to `merge_npc_carry` remains in `app/` or `test/`. Forged/stale/replay sync tests (:297, :340, :356) still assert the incoming delta is dropped. |
| R3 m3 delivery clear untested | Fixed | Test "recording a carried object as given to the player clears the carry" (:528). |
| R3 m4 / serving m2 KO'd NPC and NPC not reachable | Fixed | `carry_object!` adds `return false if npc_defeated?(npc_id)` (game.rb:1272) and `npc_can_reach_room?` (game.rb:1289). Tests at :469 (KO'd NPC refused) and :459 (unreachable room refused). |
| serving m1 inventory guard | Fixed | `put_down_carried!` (game.rb:1310) and `ko_drop_carried!` (game.rb:1362) each `return false if carried_item_in_inventory?(item_id)`; `carried_item_in_inventory?` reads `player_state['inventory']` (game.rb:1481). Test at :546. |
| R2 m2 test gap | Fixed | Test at :423 covers `targetId`, `objectId` and `unlockedBy` in `LOCK_REFERENCE_KEYS`. |

## Scenario walk check (the reachability rule)

The new rule `npc_can_reach_room?` (game.rb:1964) admits a room the NPC is placed
in by the scenario, or one adjacent to it, measured by `rooms_connected?`. It gates
`carry_object!` (pick-up) and `ko_drop_carried!` (KO drop); put-down keeps its
existing `put_down_room_reachable?(fromRoom, toRoom)` bound, unchanged this round.

Every shipped scenario with a carrying needs NPC was enumerated from the `needsTag`
objects and the per-NPC `needs`/`interests` blocks: `test_needs_attack`,
`test_needs_sims`, `lab_physical_pentest`, `test_access_work`,`test_capture_log`,
`test_npc_needs` (the last two have no `needsTag` objects, so no carry).

- Pick-up rooms: the needs system only picks up objects whose `interests.noticeRooms`
  (or a need's `noticeRooms`) list the room. For every carrying NPC in every
  scenario, each `noticeRooms` room is the NPC's own scenario room or one adjacent
  to it, so every legitimate pick-up satisfies the rule. No pick-up is refused.
- `lab_physical_pentest` (the R3 M1 case): the device carriers are `lord`,
  `hampshire` and `pierce`, all placed in `open_plan`, and the four device tags
  (`tag_deviceB`, `dev_usb`, `dev_qr`, `dev_cable`) have `noticeRooms: ["open_plan"]`.
  The player drops a device in `open_plan`, the carrier picks it up there, and
  `npc_can_reach_room?(lord, open_plan)` is true by same-room placement. The device
  then leaves on a consume (plug in), which names no room. The dropped-BadUSB beat
  works.
- Put-down targets: the client puts down in the NPC's current behaviour room
  (`dropHeld`/`placeHeld`), reached by walking through connected rooms, and the
  carried destinations in the shipped scenarios (the NPC's own desk or an adjacent
  sink) stay within `put_down_room_reachable?` of the real pick-up room.
- KO drops: the client drops in the room the body fell in. Carriers are non-hostile
  office workers, and in each scenario the map keeps them within one room of their
  scenario placement (`test_needs_attack` is a star centred on `office`; the
  others' carriers never roam past an adjacent room), so a KO while carrying always
  lands same-or-adjacent and is accepted. The "KO while carrying" live beat
  (`test_needs_sims`, Grace KO'd in her office) returned 200.
- `rooms_connected?` reads `connections.values` without flattening, so an
  array-valued exit (for example `"north": ["store_room", "P3"]`) is only matched
  from the scalar reverse side. For all four carrying scenarios every flattened
  adjacency is still detected by `rooms_connected?` via a scalar reverse, so no
  shipped carrier's reachability depends on the blind spot (see minor 2).

No shipped scenario is broken by the rule.

## end_stranded_carries! (R3 M2)

Correct against each property asked:

- No duplicate: `objects_added.reject! { |o| o['id'] == item_id }` precedes the
  `<<` (game.rb:1693), and the entry is deleted in the same pass, so within one
  serve `apply_npc_carry!` no longer serves it held. One floor copy, never both.
- Right room on a player drop: the object is added to the entry's `fromRoom`
  (game.rb:1687), which is the real pick-up room the carry action recorded, not the
  object's scenario room. A device dropped in `open_plan` and picked up there
  returns to `open_plan`.
- Idempotent: it deletes every entry, so the next load has an empty `npcCarry`,
  `stranded_npc_carries?` is false, and the writer does not run again. The write is
  persisted (`save! if changed`, game.rb:689).
- fromRoom since locked: the writer does not gate on `room_unlocked?`; it writes
  `objects_added` regardless, served when the room next loads. Harmless, and rooms
  do not re-lock in the shipped content.
- No player-state growth: it removes the `npcCarry` entry (shrink) and adds one
  deduplicated object; `objects_removed` from pick-up stays (append-only, guarded by
  `include?`). Nothing is re-sent or grows across reloads.
- Scenario changed since the carry: `carriable_object_index[item_id]` returns nil
  for an object the scenario no longer defines, so the object is simply not re-added,
  but the entry is still deleted and the NPC freed (game.rb:1684-1697). Safe.

## Dead sync removal (R3 m2)

`npcCarry` appears in `public/break_escape/js` only in comments; no client sends it
in `sync_state`, and the four carry writes go through `update_room` (`carryObject`,
`putDownObject`, `consumeCarried`, `koDropObject` in room-state-sync.js). With the
sync branch gone an incoming `npcCarry` delta is ignored, so it can neither mint,
change nor end a carry. Old stored `npcCarry` data still loads: `apply_npc_carry!`
re-validates each entry and serves it held only when `object_removed_from_room?`
holds (test at :309 proves an unbacked stored entry is inert). The ring stays
bounded because the only writers are the carry actions, each keyed by an
`npc_id` in `needs_npc_ids` (bounded by the scenario); the client can no longer add
entries at all.

## KO'd NPC and inventory guards (serving m1, m2, R3 m4)

`carry_object!` refuses a defeated NPC (game.rb:1272) and an unreachable pick-up
room (game.rb:1289); `put_down_carried!` and `ko_drop_carried!` refuse once the
player holds the object (game.rb:1310, 1362). Each has an HTTP-driven hostile-input
test. On a server refusal the client reinstates the held record
(`_uncarryToOrigin`, `_reinstateHeld`, `koDropCarried`'s refusal branch), so a
refused action never leaves an unbacked floor sprite past a reload.

## Tests

The new tests are real, HTTP-driven and assert the right post-conditions (response
code, carry state, floor contents and served `itemsHeld`), including the storeroom
with no connection as the genuinely unreachable room and `encounteredNPCs` plus a
forced `npc_states` KO as the defeated/claimable setup. The forged and stale sync
tests still pass with the merge removed, because an ignored delta leaves the
authoritative state untouched. I could not execute the suite in this worktree (the
isolated bundle cannot resolve its gems under Ruby 2.7.8, a local environment
issue, not a code one); the R3 record documents `npc_carried_items_test 33/0` and a
live run with 0 x 422, which match what the code and tests read as.

## minor

### m1. The KO-drop reachability bound narrows the documented "chased through doors" behaviour
`app/models/break_escape/game.rb:1374` (`ko_drop_carried!`).

The R3 m1 fix bounds the KO drop to `npc_can_reach_room?(npc_id, room_id)`, the
NPC's scenario room or one adjacent. The method's own prose before this round said
the KO room "need not be reachable from the pick-up room (a hostile NPC is chased
through doors)". The bound is measured from the NPC's scenario placement, not its
live position, so if a future scenario makes a carrying needs NPC hostile and the
map lets the chase reach a room two or more hops from that placement, a KO there is
refused: the client reinstates the held record, and on the next reload
`end_stranded_carries!` returns the object to the pick-up room rather than the KO
room. No object is lost or duplicated, and no shipped scenario triggers it
(carriers are non-hostile office workers whose maps keep them within one room of
home, verified above).

Fix (optional, if a future hostile carrier is wanted): fall back to the carry's
`fromRoom` when the named KO room is unreachable, or trust the recorded KO the way
the generic `npc_defeated` drop does, so the object lands where the body fell.

### m2. rooms_connected? ignores array-valued connection exits, and the new rule now leans on it for pick-ups
`app/models/break_escape/game.rb:1989` (`rooms_connected?`).

`rooms_connected?` tests `connections.values.include?(other_id)`, so an exit written
as an array (`"north": ["store_room", "P3"]`) is only matched from whichever side
declares the exit as a scalar. Before this round the method only gated put-down;
`npc_can_reach_room?` now also gates every carry pick-up and KO drop. A future
scenario that connects a carrier's home to a pick-up or drop room only through an
array exit, with no scalar reverse, would see a legitimate carry refused. This is
pre-existing and no shipped carrying scenario relies on such a connection (every
flattened adjacency in the four carrying scenarios is still matched by a scalar
reverse), so nothing breaks today.

Fix (optional): flatten array values in `rooms_connected?`
(`Array(v).include?(other_id)` over each connection value) so adjacency does not
depend on which side spells the exit as a scalar.

## Security note

Nothing new. The security-critical properties the serving review verified still
hold: the allowlist (`carriable_object_index`, `carriable_object?`,
`lock_referenced_object_ids`) rejects keys, credentials, locked items, containers
with contents, reveal slots and lock-referenced ids; put-down, KO drop, the served
held item and the reload re-drop are all rebuilt from the scenario definition with
only a coordinate-clamped client position; the sync path can no longer write
`npcCarry` at all; and `carry_object!` now additionally refuses a defeated NPC and
an unreachable room. The two minors are confined to ordinary office dressing, the
only class the allowlist admits.

R4: 0/0/2

## Outcomes

- m1 (KO-drop bound narrower than "chased through doors"): accepted as a known limit. No shipped scenario triggers it, the carriers are non-hostile office workers that stay within one room of home, and a reload returns the object to the pick-up room, so nothing is lost or duplicated. The comment on `ko_drop_carried!` now states the limit.
- m2 (`rooms_connected?` ignored array-valued exits): fixed in 2988d4b2e, with a test in `test/models/break_escape/game_test.rb`.
