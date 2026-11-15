# R1: 0/2/5

Review of `git diff 358dca77c..0ae48e166` (commits d86a1bacc, 018b240b9,
1956a6e84, b8f8801b0, 0ae48e166) on branch build/ol-carry: server-held NPC
carried items, slices A and B.

The enforced core holds. Keys, keycards, credentials, locked objects, objects
with a lock reference (`requires`/`opens_lock`/`keyPins`/`key_id`/`card_id`/
`lockType`), objects with contents and reveal slots are all refused by
`carriable_object?`, with Rails hostile-input coverage for each. Put-down and the
served held item are rebuilt from the scenario definition, so forged fields are
ignored (test covers a forged `type`/`opens_lock`). The delta is ring-keyed,
bounded by `MAX_NPC_VISIBILITY`, rebuilt field by field, and idempotent. No
Blocker: nothing that matters for progression or secrets can be moved, duplicated
or deleted through the enforced allowlist. The two Majors below are duplication
paths that admit only office dressing today, but each breaks a server invariant
the plan claims is safe, and each becomes a real exploit the moment the allowlist
admits anything of value (see m1).

## Major

### M1. Knocking out a carrying NPC duplicates the carried item

`public/break_escape/js/systems/npc-needs.js:5366`,
`public/break_escape/js/systems/npc-hostile.js:719` and `729`,
`app/models/break_escape/game.rb:1340` (`apply_npc_carry!`).

Slice B now pushes the carried object into `rec.itemsHeld`
(`{ id, type, name, _needsCarried: true }`). `dropNPCItems` drops everything in
`npc.itemsHeld` on a knockout (`toDrop = npc.itemsHeld`, line 729) and calls
`addItemToRoom(npcRoomId, ..., sourceType: 'npc_defeated')`, which the server adds
to the knockout room's `objects_added`. Nothing clears `npcCarry` on a knockout
(slice C is not built), so the server still serves the same object in that NPC's
`itemsHeld` via `apply_npc_carry!`.

Scenario: a needs NPC is carrying a mug and is knocked out. The mug is written to
the floor (server `objects_added`) and remains in the NPC's served hand
(`npcCarry`). After a reload the object appears twice and both copies are
takeable. This contradicts the plan's "never lost and never duplicated" and the
slice C hook's premise that a carried object "lives in `_needsCarried`, not in
that `itemsHeld` array, so it is not dropped today" (slice B broke that premise).

Fix: until slice C lands, make `dropNPCItems` skip `_needsCarried` entries
(`toDrop` filter at npc-hostile.js:729), or clear `npcCarry[npc_id]` on the
knockout drop and let the needs world drop it once. Do not rely on the client not
dropping it.

### M2. A synced npcCarry entry creates a carry with no origin removal, duplicating the object

`app/models/break_escape/game.rb:1309` (`merge_npc_carry!`) and `1340`
(`apply_npc_carry!`).

The carry action path maintains an invariant: an entry in `npcCarry` goes with
the object being written to its origin room's `objects_removed`
(`carry_object!` does both, game.rb:1210). `merge_npc_carry!` writes an entry
from a synced body but never writes `objects_removed`, and `apply_npc_carry!`
serves the held item without checking that the object has actually left its origin
room. So a crafted `sync_state` with `npcCarry: { grace: { itemId, fromRoom } }`
for a real needs NPC and a real carriable id serves that object both on its origin
floor and in the NPC's hand. A following `put_down_object` then lands a copy in an
adjacent room while the origin copy stays, so the object is duplicated and can be
relocated.

Only allowlisted dressing is admitted today, so the practical gain is duplicate
mugs, but it is a client-forgeable break of the server's authoritative state
through an endpoint the plan presents as reconcile-only ("the carry actions own
the authoritative writes").

Fix: treat the sync as reconcile-only. `merge_npc_carry!` should keep an incoming
entry only when it matches what an action already wrote (an existing `npcCarry`
entry, or the object already recorded in its `fromRoom` `objects_removed`), and
drop any entry the action path did not create, rather than minting a new carry.
Alternatively, have `apply_npc_carry!` serve the held item only when the object is
recorded removed from its origin room.

## Minor

### m1. The allowlist checks only the candidate's own fields, never cross-references

`app/models/break_escape/game.rb:1180` (`carriable_object?`).

`carriable_object?` rejects keys, credentials, locked objects, lock references and
contents by inspecting the candidate object itself. It never checks whether the
candidate's id is referenced as a requirement elsewhere (a door or object with
`requires`/`key_id`/`card_id` equal to this id, or an objective target). An item
that is a de facto key (a usb stick, a code chit, a required clue) but carries
none of the disqualifying fields on its own definition is carriable if it has a
`needsTag`, and `consume_carried!` would delete it for good (its origin
`objects_removed` stays). No current mission does this, and `needsTag` is author
controlled, so this is defence in depth, but it is the honest answer to "could a
mission give a needsTag to something that matters": yes, for anything another lock
references by id. Fix: also reject any candidate whose id appears as a
`requires`/`key_id`/`card_id`/lock value anywhere in the scenario, or as an
objective requirement.

### m2. Client carry calls are fire-and-forget; a server refusal diverges state until reload

`public/break_escape/js/systems/npc-needs.js:5375` (consumeHeld), `5407`
(dropHeld), `5441` (placeHeld), and the `.catch(() => {})` on every call.

`consumeHeld` destroys the sprite, `dropHeld`/`placeHeld` set it down locally and
`pickUp` removes it from the origin room, all before the server call, and each
ignores the server result. If the server refuses (for example a put-down into a
room not adjacent to the pick-up room, which the as-built reachability rejects as
422, or a race), the client shows one state and the server holds another until a
reload reconciles. This is the exact class of symptom the change set out to fix.
Fix: on a false result from `putDownObject`/`consumeCarried`/`carryObject`,
reconcile the client (reinstate the held item or refetch the room) rather than
leaving it diverged.

### m3. The consume unlocked-room gate uses a client-named room

`app/controllers/break_escape/games_controller.rb:1112` and `consumeCarried`
(room-state-sync.js:411).

For `consume_carried` the only use of `roomId` is the controller's
`room_unlocked?(room_id)` gate, and the client supplies the room. A client can
always name any unlocked room (the start room is always unlocked), so the gate
does nothing for consume. It is not a vulnerability, because consume only clears a
server-verified `npcCarry` entry, but the gate gives a false sense of protection.
Fix: drop the gate for consume, or resolve and check the NPC's own room server
side rather than trusting the body.

### m4. Delivery that does not land in inventory re-serves the carried item held

`app/models/break_escape/game.rb:1340` (`apply_npc_carry!`) and `1368`
(`carried_item_in_inventory?`).

`apply_npc_carry!` runs after the `npc_given_items` filter in
`apply_room_state_changes!` and re-injects the carried object into `itemsHeld`
whenever `carried_item_in_inventory?` is false. The take-from-hand flow adds the
item to inventory, so that case is covered, but a delivery recorded only in
`npc_given_items`/`delivered_item_ids` without an inventory entry would be
re-served held. The plan's slice C hook ("on delivery the server should also clear
the npcCarry entry") is not built. Low risk for the current carriables, which are
not delivered. Fix: when slice C lands, clear `npcCarry[npc_id]` on delivery, or
have `apply_npc_carry!` also honour `delivered_item_ids`.

### m5. pickUp fires a carry call and mirrors into itemsHeld for reveal slots too

`public/break_escape/js/systems/npc-needs.js:5344` (pickUp) and `5366`.

`pickUp` pushes every carried object into `itemsHeld` and calls `carryObject`
unconditionally, including reveal slots, which `carriable_object?` excludes. The
server carry is refused (a harmless 422 the client ignores), so the slot keeps its
client-only flow as intended, but the reveal-slot sprite is still mirrored into
`itemsHeld`, which feeds the M1 knockout path for slots as well. Fix: skip the
`itemsHeld` mirror and the `carryObject` call for `isSlot(sp)` so reveal slots
touch neither the server carry nor `itemsHeld`.

## Tests

Rails coverage is good and matches AC0's hostile-input list: a key, a locked
container, an object with contents and a credential are each refused with nothing
written (`npc_carried_items_test.rb`, "a key, a locked container ..."), plus
wrong-room, locked-room, non-needs NPC, cross-game NPC, non-adjacent put-down,
put-down/consume without a carry, forged fields and delta hygiene. Gaps that would
have caught the Majors above: no test knocks out a carrying NPC (M1), and no test
drives `merge_npc_carry!`/`sync_state` with a carry the action path never wrote
and then checks the object is not served in both places (M2). The JS test proves
the wiring and that no carry path calls `removeItemFromRoom`, but it stubs
`RoomStateSync`, so it does not exercise a server refusal (m2) or the knockout
drop (M1). Add a knockout-while-carrying model test and a forged-sync duplication
test.
