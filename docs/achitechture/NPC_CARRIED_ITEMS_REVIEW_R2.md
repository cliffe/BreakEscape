# R2: 0/1/5

Review of the R1 fix delta (`git diff 64635429e..7fdbcc1e0 -- app public test tools`)
and the whole feature against main (`git diff 513996713...HEAD -- app public`) on
branch build/ol-carry: server-held NPC carried items (D3), slices A to C pulled
forward.

The enforced core still holds, as R1 found: the allowlist (`carriable_object?`)
rejects keys, credentials, locked objects, lock references, contents and reveal
slots; put-down, KO drop and the served held item are all rebuilt from the
scenario definition, so forged client fields are ignored; the delta is ring-keyed,
bounded by `MAX_NPC_VISIBILITY` and rebuilt field by field. Nothing that matters
for progression or secrets can be moved, duplicated or deleted today, so no
Blocker.

The R1 fixes M1, m1 to m5 landed and read correctly. The exception is M2: the
reconcile-only merge closes the "mint a carry from nothing" case the R1 test
covers, but not the case where a carry genuinely happened and then ended. That is
the one Major below. The minors are a looser KO-record path than its two siblings,
a gap in the lock cross-reference, and a client reconcile that still diverges on
two paths.

## Major

### M1. `merge_npc_carry!` re-mints a carry after it has ended, re-duplicating the object

`app/models/break_escape/game.rb:1442` (`merge_npc_carry!`), with
`app/models/break_escape/game.rb:1383` (`object_removed_from_room?`) and `:1478`
(`apply_npc_carry!`). Test gap:
`test/controllers/break_escape/npc_carried_items_test.rb:297`.

The reconcile guard keeps an incoming sync entry when
`matches_stored || object_removed_from_room?(from_room, item_id)`. The second
alternative is a permanent marker: `objects_removed` is append-only, and none of
`consume_carried!`, `put_down_carried!` or `ko_drop_carried!` ever clears the
origin-room removal written at pick-up. So once any object has been carried from
its origin room, `object_removed_from_room?` stays true for the rest of the game,
and a later sync re-mints the carry even though the stored entry was deleted when
the carry ended.

Scenario (no forgery needed, a race is enough): `grace` carries `office_mugs`
(entry written, `office` `objects_removed` gains `office_mugs`), then consumes it
(entry deleted, removal stays). A `sync_state` the client had already queued
before the consume arrives with `npcCarry: { grace: { itemId: office_mugs,
fromRoom: office } }`. `matches_stored` is false (entry gone), but
`object_removed_from_room?('office','office_mugs')` is true, so the entry is
re-minted. `apply_npc_carry!` then serves the mug held again:
`object_removed_from_room?` holds and `carried_item_in_inventory?` is false (it was
consumed, not taken). A consumed object reappears in the NPC's hand. The same
sequence after a put-down leaves one copy on the floor and a second served held,
so the object is duplicated; a forged sync reproduces it deliberately. Practical
ceiling today is duplicate office dressing, but this is the exact invariant the M2
fix claims closed ("a forged sync_state cannot mint a carry"), and it becomes a
real duplication the moment the allowlist admits anything of value.

The R1 forged-sync test at line 297 does not catch it: it drives only the
never-carried case (object still in the office, nothing removed) and asserts the
entry is dropped. It never carries then ends a carry before replaying the sync.

Fix: in `merge_npc_carry!` drop the `object_removed_from_room?` alternative and
keep only `matches_stored`. The carry action writes the stored `npcCarry` entry
atomically with the removal, so `matches_stored` already covers every live carry;
once the carry ends the entry is gone and a replayed sync must not revive it. Keep
the `apply_npc_carry!` removal check as the serve-time guard. Add a test that
carries, then consumes (and separately puts down), then replays the stale
`npcCarry` sync and asserts the object is not served held again and not
duplicated.

## Minor

### m1. `ko_drop_carried!` records a KO in a room the NPC need not be in, a looser trust than its two siblings

`app/models/break_escape/game.rb:1343` (`ko_drop_carried!`, the claimable branch
at `:1364`). Compare `app/models/break_escape/game.rb:1538` (`update_npc_state!`)
and `:982` (`add_item_to_room!`).

Both existing KO-record paths require `npc_in_room?(npc_id, room_id)` as well as
`npc_ko_claimable?` before they write `isKO`. `ko_drop_carried!` requires only
`scenario_room_ids.include?(room_id)` (plus the controller's `room_unlocked?`
gate) and `defeated || claimable`, then writes `isKO => true, currentHP => 0` for
the NPC in the client-named room. So a client can mark an encountered, unfought
needs NPC that is carrying a carriable object as knocked out in any unlocked room,
including one the NPC was never in, by claiming a KO-drop. The drop room is a
client claim, not the server-recorded KO room (contrast `ko_room_reachable?` and
the stored `koRoom`, which `merge_ko_position!` bounds to a reached room).

Failure scenario: `grace` (met, carrying a mug, never fought) is marked KO'd in
the start room; she is now `npc_defeated?` and removed from play without any
combat, in a room she never entered. Low impact because the carriers are office
dressing NPCs and combat is client-trusted anyway, but it is a wider KO surface
than the siblings and relocates the KO record.

Fix: in the claimable-but-unrecorded branch of `ko_drop_carried!`, require
`npc_in_room?(npc_id, room_id)` before writing `isKO`, matching
`add_item_to_room!` and `update_npc_state!`. The object drop can still land in
`room_id`; only the fake-KO record needs the NPC-in-room check.

### m2. The lock cross-reference misses item-requirement and objective-target keys

`app/models/break_escape/game.rb:1197` (`LOCK_REFERENCE_KEYS`).

`lock_referenced_object_ids` is the R1 m1 defence that drops a candidate whose id
is named as a requirement elsewhere. The key list covers `requires`/`required`/
`key_id`/`card_id`/`opens_lock`/`unlocks`/`target` and so on, but omits
`requiresItem` (7 uses in scenarios, each naming an item id such as `kit_badusb`
or `usb`), `targetObject` (48 uses, naming objective-target object ids),
`targetId` and `objectId`. A needs-tagged object whose id matches one of these is
still admitted to the allowlist and `consume_carried!` would delete it for good,
its origin removal left standing.

Failure scenario: an author gives a `needsTag` to an object a terminal names with
`requiresItem` or an objective names with `targetObject`; a needs NPC carries and
consumes it, and the lock or objective can no longer be satisfied. No current
mission tags a required object this way, so this is defence in depth, the same
severity class as R1 m1, but the fix's own claim ("objective-requirement fields
across the scenario") is not met.

Fix: add `requiresItem requiredItem targetObject targetId objectId` to
`LOCK_REFERENCE_KEYS` (keep the soft `requiresItemHint*` out, they are prose).

### m3. Client consume reconcile reinstates a held record with no sprite

`public/break_escape/js/systems/npc-needs.js:5622` (`consumeHeld`), reconciling to
`:5738` (`_reinstateHeld`).

`consumeHeld` destroys the carried sprite (`held.sprite.destroy?.()`, line 5628)
before the server answers, and on a `false` result calls `_reinstateHeld` without
a sprite (it passes only `roomId/key/type/name`). The held record and `itemsHeld`
entry come back, but the physical object is gone until a reload. The server still
holds the carry, so client and server diverge on what the hand shows.

Failure scenario: the server refuses a consume (the carry entry is already gone,
or a lock race), `_reinstateHeld` restores the record with `sprite: null`, and the
NPC holds an invisible item until the room is re-fetched.

Fix: in `consumeHeld`, detach and hide the sprite rather than destroying it until
the server confirms, and pass it to `_reinstateHeld` on a refusal; or refetch the
room on a refused consume.

### m4. Fire-and-forget reconcile fires on transient errors, diverging the other way

`public/break_escape/js/systems/npc-needs.js:5616`, `:5638`, `:5666`, `:5708`
(the `.then(ok => { if (ok === false) ... })` calls), with
`public/break_escape/js/systems/room-state-sync.js:370` (`postRoomAction` returns
`false` on a network error as well as a true refusal).

`postRoomAction` returns `false` both when the server refuses and when the
response is lost (the `catch` at line 370 to 373). The carry calls reconcile the
local state on any `false`. On a transient network error after the request
actually reached the server, the client undoes a change the server committed: a
carry the server recorded is un-carried on the client
(`_uncarryToOrigin`), or a put-down the server landed is reinstated held. The
client then shows the opposite of the server until a reload.

Failure scenario: `carryObject` reaches the server (carry written, object removed
from origin) but the response is dropped; `_uncarryToOrigin` puts the object back
in its origin room client-side while the server holds it carried. Reload
reconciles, so this is a transient visual divergence, not persisted corruption.

Fix: distinguish a true refusal (`success: false` from the server) from a
transport error in `postRoomAction`, and only reconcile the local state on a true
refusal; on a transport error, leave the optimistic state and let the next room
fetch reconcile.

### m5. The KO-drop client call does not reconcile on a server refusal

`public/break_escape/js/systems/npc-needs.js:5784` (`koDropCarried`).

`koDropCarried` re-shows the carried sprite on the floor and clears the local
held record, then fires `koDropObject` with `.catch(() => {})` and ignores the
result. If the server refuses the `ko_drop_carried` (no KO record and not
claimable, or a carry mismatch), the server keeps the `npcCarry` entry while the
client has placed the object on the floor and emptied the hand. A reload then
re-serves the object held (the carry survives), dropping the client's floor copy,
so the two converge on "still held" rather than corrupting, but the live frame
after a refused KO-drop diverges.

Failure scenario: an NPC is KO'd on the client but the server has not yet recorded
the KO and does not find it claimable; the floor object the client drew is not
server-backed and vanishes on reload.

Fix: on a `false` result from `koDropObject`, reinstate the held record (as the
put-down path does with `_reinstateHeld`) so the live state matches the server
until the KO record catches up.

## Tests

The new Rails tests are real and HTTP-driven: the KO-drop test carries, records
the KO as `update_npc_state` would, drives `ko_drop_carried`, and asserts the
carry is cleared, exactly one object lands at the sent position, and it is not
also served in the hand; the no-KO-record test asserts a 422 and the carry intact.
The forged-sync test drives `sync_state` with an entry no action backed and
asserts it is dropped and not served in both places, and a second test forces a
stored entry with no removal and asserts `apply_npc_carry!` leaves it inert. Delta
hygiene (idempotent repeat, extra keys dropped, bounded by NPC count) is covered.

The forged-KO-drop test is genuine but narrow: it refuses a drop for an NPC with
no KO record and no encounter, so it does not probe the claimable-but-unfought
path (m1), and nothing asserts the NPC must be in the drop room. The forged-sync
test is genuine but misses the M1 case entirely: it never ends a real carry before
replaying the sync, which is where the re-mint happens. Add the carry-then-consume
and carry-then-put-down replay tests described in M1, and an m1 test that an
encountered unfought NPC cannot be marked KO'd via `ko_drop_carried` in a room it
is not in.

Delta sync stays bounded and idempotent: `merge_npc_carry!` rebuilds each entry to
`{itemId, fromRoom}` only, caps at `MAX_NPC_VISIBILITY` and returns without
writing when exceeded. M1 is a correctness break in which entries are kept, not a
growth or idempotency break.
