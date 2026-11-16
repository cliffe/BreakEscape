# NPC carried items: review round 3

R3: 0/2/4

Scope: `git diff main...HEAD` on branch `build/ol-carry` (main merged at
`4ddee1096`, so the diff is the feature alone): the server carry actions and
allowlist in `app/models/break_escape/game.rb`, the `update_room` branches and
the `npcCarry` sync section in `games_controller.rb`, the client wiring in
`npc-needs.js`, `npc-hostile.js` and `room-state-sync.js`, and the Rails and JS
tests. Reviewed for correctness, sync and tests; read-only, no server started.

## R2 fixes confirmed

| R2 item | State | Evidence |
|---|---|---|
| M1 stale sync re-mints an ended carry | Fixed | `merge_npc_carry!` (game.rb:1425) keeps an incoming entry only when it matches the stored one; tests at npc_carried_items_test.rb:340 and :356 replay after a consume and after a put-down |
| m1 KO record in a room the NPC is not in | Fixed for the KO record | game.rb:1368 adds `npc_in_room?`; tests at :373 and :387. The drop itself still lands and ends the carry with no KO, see m1 below |
| m2 lock cross-reference keys | Fixed | LOCK_REFERENCE_KEYS (game.rb:1197) gains `requiresItem targetObject targetId objectId unlockedBy`; test at :404 covers `requiresItem` and `targetObject` |
| m3 consume refusal leaves an invisible held item | Fixed | `consumeHeld` hides the sprite and destroys it only on a non-refusal; JS tests "a refused consume keeps the sprite" and "a confirmed consume destroys the sprite" |
| m4 reconcile on transport errors | Fixed | `postRoomAction` returns false only on a definite refusal, null otherwise; callers test `=== false`; `room-state-sync-refusal.test.mjs` covers 200, 422, success:false, 500, 429, network throw |
| m5 KO drop ignores a refusal | Fixed | `koDropCarried` reinstates the held record on false; JS test "a refused koDrop removes the floor copy" |

### The two fixer choices

**`unlockedBy` in LOCK_REFERENCE_KEYS: acceptable, keep.** The schema describes
`unlockedBy` as the global that unlocks an account (scripts/scenario-schema.json:1358),
so its values are global names, not object ids. Adding it can only remove
candidates from the allowlist, never admit one, so it errs the safe way. A
cross-check of every scenario with a `needsTag` object (lab_physical_pentest,
test_access_work, test_capture_log, test_needs_attack, test_needs_sims,
test_npc_needs, test_secret_leaks) found no needs-tagged id named by any of the 19
reference keys, so no shipped carry is excluded by the wider list today. The only
cost is a false exclusion if an author ever names a global after a needs-tagged
object; the refusal then shows as a carry 422, which the M1 fix below would make
visible in the log.

**`postRoomAction` returning null on transport errors: correct.** A 5xx, 408, 429,
thrown fetch or unparseable 200 may have committed, so leaving the optimistic state
alone is the right default; a 4xx (including a CSRF 422 and the 409 format refusal)
commits nothing, so reconciling on it is right. The limit to note: "the next room
fetch reconciles" in practice means the next page load, because a room already
loaded is not re-fetched. A null on a carry that did not commit therefore leaves the
client carrying while the server does not until a reload. Low frequency; no change
asked.

## Major

### M1. A carry from any room other than the object's scenario room is refused, which breaks the lab's dropped-device beat

`app/models/break_escape/game.rb:1274` (`carry_object!`:
`return false unless info && info['room'] == from_room`), with the same check in
`merge_npc_carry!` at game.rb:1459. Client side:
`public/break_escape/js/systems/npc-needs.js:5616` (the refusal runs
`_uncarryToOrigin`).

`carriable_object_index` records each object's scenario room, and `carry_object!`
refuses unless the client's `fromRoom` is that room. Objects move: a player drop
lands an object in another room's `objects_added`, and this feature's own put-down
and KO drop land it in a room other than its origin. From then on the object can
never be carried again, and every attempt is a 422.

Failure scenario (shipped content): in `lab_physical_pentest` the player takes
`kit_deviceB` (the BadUSB) from its kit room, walks to `open_plan` and drops it
(player_drop: `open_plan` `objects_added`). Sofia's `tag_deviceB` interest
(noticeRooms `open_plan`) picks it up; the client sends
`carry_object {roomId: open_plan}`; the server compares `open_plan` with the kit
room and answers 422. The refusal arrives while Sofia walks away: `_uncarryToOrigin`
puts the device back on the `open_plan` floor, but the needs job already set
`job.carrying = true` and carries on to `usb_target_pc`. The `npc_used` event fires,
so `usb_foothold` still completes, but the device is still lying on the floor after
she "plugs it in", `consume_carried` is never sent (no held record), and any later
notice repeats the 422. On main this beat worked: the client-only carry ended with a
`remove_object` on `open_plan`, which `objects_added` satisfied. The same applies to
`kit_usb`, `kit_qr` and `kit_cable` there, the devices in `test_access_work`, and
`player_mugs` in `test_needs_sims`; and to `office_mugs` once an abandoned job has
set it down in the kitchen (`dropHeld` names the behaviour room). This is the
E-carry-422 symptom the feature set out to remove, moved to a new action.

No test covers it: every Rails carry test picks up from the scenario room, and the
live proof only put the mug down in its origin room.

Fix: accept a pick-up from the room the object is actually in. In `carry_object!`,
replace the scenario-room equality with "the object is carriable and
`item_in_room?(from_room, item_id)`" (the scenario room with no removal, or any room
whose `objects_added` holds it; both copies are server-built, never client fields).
`remove_item_from_room!` already handles an `objects_added` copy and records the id
in that room's `objects_removed`, so `apply_npc_carry!`'s
`object_removed_from_room?(fromRoom, …)` invariant still holds with `fromRoom` set to
the real pick-up room. Put-down reachability then measures from that real room,
which matches the plan's intent. Drop the matching equality in `merge_npc_carry!`.
Tests: carry a player-dropped device from the drop room (200, served held, gone
from the floor, consume leaves it gone); put a mug down in the kitchen, then carry
it again from the kitchen.

### M2. A reload mid-carry strands the object in the hand and stops that NPC from ever carrying again

`app/models/break_escape/game.rb:1474` (`apply_npc_carry!`), game.rb:1279
(second item refused while a carry is stored), game.rb:2680 to 2683 (koDropPending
computed before the carried item is added), with `npc-needs.js:5580` (`pickUp`) and
`npc-hostile.js:737` (`plainDrop`).

Serving the carried object in `itemsHeld` after a reload is correct and is not the
issue (resuming the walk is out of scope). The issue is that nothing can end that
carry afterwards. The plan's claim that "the needs system may stow/drop it on its
next tick" holds only for reveal slots: a non-slot held item served from the server
has no `_needsCarried` record and no sprite, so `consumeHeld`, `dropHeld`,
`placeHeld` and `koDropCarried` all return early. The stored `npcCarry` entry then
lives for the rest of the game, with three effects:

1. The object is gone from the world for good (removed from its origin, never put
   down).
2. That NPC can never carry anything again: every later pick-up hits "a second
   item while already carrying is refused" (game.rb:1279), 422, and the client
   un-carries.
3. A KO after the reload sends the held object through the generic `plainDrop`
   path as an `npc_defeated` add, which `add_item_to_room!` refuses (the object is
   not in the NPC's scenario `itemsHeld`); the client has drawn an unbacked floor
   sprite that vanishes on the next load, and koDropPending never lists the item
   because it is computed before `apply_npc_carry!` runs.

Failure scenario: once M1 is fixed, in `lab_physical_pentest` the player drops the
BadUSB, Sofia picks it up, and the player reloads during her walk to the PC (a
window of several seconds). After the reload the BadUSB sits in Sofia's hand
forever; she never reaches the PC with it, and dropping a second device does not
help because she can no longer carry anything. `usb_foothold`, a core task, can no
longer be completed in that game.

Fix (the smallest that holds): end any stored carry when the game is loaded fresh,
by putting the object back where it was picked up. In the bootstrap/state-prepare
path, for each `npcCarry` entry, add the object to `fromRoom` from the scenario
definition (as `put_down_carried!` does, scenario position) and delete the entry.
That keeps the carry server-tracked during play, never duplicates, and needs no
client resume code. If the integrator prefers the object to stay in the hand, the
client must instead adopt a served carried item (mark it `carried: true` on serve,
build a `_needsCarried` record and a sprite on room load) so the needs world can
put it down or consume it, and `with_ko_drop_pending` must see the carried item.
Tests: carry, reload (fresh room fetch or bootstrap), assert the object is back in
`fromRoom` once and the entry is gone, then a second carry by the same NPC answers
200.

## Minor

### m1. `ko_drop_carried` still ends a carry, with no KO, in any unlocked room

`app/models/break_escape/game.rb:1344` to 1385.

The R2 fix gates only the KO record. For an encountered, KO-claimable needs NPC
that is not KO'd and not in the named room, the action skips the record but still
lands the object in the client-named room and deletes the carry. That is a put-down
with no reachability check: a client can move a carried object into any unlocked
room. The test at npc_carried_items_test.rb:373 asserts no KO is recorded but not
the response or where the object went, so it passes on this path.

Impact is low (the object is server-built dressing, and with M1 fixed the player can
carry a dropped device anywhere themselves), but it contradicts the plan's
reachability rule. Fix: when `defeated` is false and the NPC is not in `room_id`,
refuse (return false) instead of dropping; the client already reinstates the held
record on a refusal, and the legitimate KO path records the KO through
`update_npc_state` or the hostility sync first. Extend the :373 test to assert a 422,
the carry intact and nothing added to the kitchen.

### m2. The `npcCarry` sync section is dead code

`app/controllers/break_escape/games_controller.rb:2237` and :2598 to 2603,
`app/models/break_escape/game.rb:1425` (`merge_npc_carry!`).

No client code sends `npcCarry` in `sync_state` (only the four `update_room` actions
write it). After the R2 fix `merge_npc_carry!` starts from the stored map and keeps
an incoming entry only when it equals the stored one, so it can neither add, change
nor remove anything; its `MAX_NPC_VISIBILITY` cap can never trip. The section still
registers a ring claim key and a code path a forged client can exercise. There is no
growth or re-send problem (nothing is sent), so the delta rule is met, but the
section suggests a sync contract that does not exist. Fix: drop `npcCarry` from
`RING_KEYED_SECTIONS`, the `sync_state` branch and `merge_npc_carry!`, keeping the
forged-sync test as an assertion that a sent `npcCarry` is ignored. If the section is
kept for a future client resume, say so in the method comment and in the plan.

### m3. The delivery clear has no test

`app/models/break_escape/game.rb:710` and :717 (`clear_npc_carry_on_delivery!`).

`record_npc_gift!` clears a carry when the delivered entry's id matches, using
`ItemIdentity.identity_candidates(item).first`. No test drives a gift of a carried
object, so neither the id match nor the early `return if entries.any?` (a repeat
gift skips the clear) is covered. Fix: a Rails test that carries `office_mugs`,
records it as given to the player, and asserts the entry is gone and the NPC no
longer serves it held after the item later leaves the inventory.

### m4. A KO'd NPC can still be recorded carrying

`app/models/break_escape/game.rb:1269` (`carry_object!`).

`carry_object!` checks the NPC is a needs NPC but not that it is still in play. A
client can make a KO'd NPC pick up a carriable object, which then leaves its room and
is served in the hand of an NPC that can never put it down (the KO drop has already
happened). Fix: `return false if npc_defeated?(npc_id)` after the needs-NPC check,
with a hostile-input test.

## Security note

Nothing beyond m1 and m4. Every object that enters a room through these actions is
rebuilt from the scenario definition with only `px`/`py` taken from the client
(`apply_carry_position`, finite coordinates via `valid_ko_coord?`); the allowlist
rejects key and credential types, lock fields, contents, reveal slots and
lock-referenced ids; the unlocked-room gate covers every action that names a room
except `consume_carried`, which names none.

## Tests

The R2 fix tests are real and HTTP-driven, and the JS tests exercise the engine
world through `RoomStateSync` stubs plus `postRoomAction` against a mocked fetch.
Gaps: the M1 cross-room carry (no test picks up anywhere but the scenario room),
the M2 reload-then-act path, the m1 response and placement, the m3 delivery clear,
and `targetId`/`objectId`/`unlockedBy` in the allowlist test (it covers two of the
five new keys).

Schema slice 1: the four new actions are `update_room` action types, a server API,
not scenario keys, and the branch adds no scenario key. The keys the allowlist reads
(`needsTag`, `requiresItem`, `targetObject`, `targetId`, `objectId`, `unlockedBy`)
are already declared in `scripts/scenario-schema.json`, so
`test/js/validator-schema-known-keys.test.mjs` needs nothing new.

## Outcomes (R3 fixes)

All nine findings (R3 0/2/4 plus serving 0/0/3) fixed on `build/ol-carry`. Code in
`app/models/break_escape/game.rb` and `app/controllers/break_escape/games_controller.rb`;
tests in `test/controllers/break_escape/npc_carried_items_test.rb`.

| Finding | Outcome |
|---|---|
| M1 cross-room carry refused | `carry_object!` drops the scenario-room equality; it now accepts any room the object is actually in (`item_in_room?`) that the NPC can reach. New test: pick up a mug from the kitchen after a put-down there (200, served held, gone from the kitchen floor). |
| M2 reload strands a carry | New bootstrap writer `end_stranded_carries!` (run by `prepare_bootstrap_state!`) puts each carried object back in its `fromRoom` (scenario position) and deletes the entry. New test: carry, GET /scenario, object back on the floor once, carry again returns 200. Reload behaviour documented in the plan (slice C resume-carry remains future work). |
| R3 m1 / serving m3 KO drop lands anywhere | `ko_drop_carried!` now requires `npc_can_reach_room?` (NPC room or adjacent); refuses a far room. New test: KO drop into the non-adjacent storeroom is 422, carry intact, nothing added. |
| R3 m2 dead sync path | Removed `merge_npc_carry!`, the `npcCarry` sync branch and `npcCarry` from `RING_KEYED_SECTIONS`. An incoming `npcCarry` is ignored; existing forged/stale/replay sync tests now assert it is dropped. |
| R3 m3 delivery clear untested | New test: `record_npc_gift!` of a carried object clears the entry and stops it being served held. |
| R3 m4 / serving m2 KO'd NPC and NPC-not-in-room | `carry_object!` now refuses a KO'd NPC (`npc_defeated?`) and requires `npc_can_reach_room?` (NPC room or adjacent). New tests: a KO'd NPC cannot carry; a carry from an unreachable room is refused. |
| serving m1 inventory guard | `put_down_carried!` and `ko_drop_carried!` return false when `carried_item_in_inventory?`. New test: both refuse once the player holds the object, nothing duplicated. |
| R2 m2 test gap | New test covers `targetId`, `objectId` and `unlockedBy` in `LOCK_REFERENCE_KEYS` (requiresItem/targetObject already covered). |

Reachability rule (m1 / m4 / serving m2/m3): "the NPC's scenario room or one
adjacent to it". The server tracks only an NPC's scenario placement, not its live
simulated position; a needs walk only ever steps into a neighbouring room, so
same-or-adjacent admits every legitimate walk while refusing a client that names a
far, unreachable room.

Suites: npc_carried_items_test 33/0, forged_ko_drop + game_test + reload_persistence
191/0, bin/test-js green, rubocop 368 files 0 offences.
