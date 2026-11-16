# NPC carried items: server serving and security review (D3)

Scope: the Rails side of `git diff main...HEAD` on `build/ol-carry` (merge base
`9a20b4967`, main merge excluded): `app/models/break_escape/game.rb`,
`app/controllers/break_escape/games_controller.rb`, and the new tests. Reviewed
against `NPC_CARRIED_ITEMS_PLAN.md` section 3 (the client is untrusted) and the
cheat-resistance policy (secrets, keys and forged items hard-enforced; ink-gated
steps best-effort).

## Verdict

The security-critical properties all hold and are tested. No object outside the
server-computed carriable allowlist can enter `carry_object` / `put_down_object` /
`consume_carried` / `ko_drop_carried`; the sync path is reconcile-only so a forged
delta cannot mint a carry; the delta is ring-keyed and bounded; put-down and the
served held item are built from the scenario definition, never client fields; the
client position is the only client-supplied value and it is coordinate-clamped.
The three minors below are defence-in-depth hardening, all confined to ordinary
office dressing (the only class of object the allowlist admits), so none can move,
duplicate or destroy a key, credential, locked item or forged item.

## Properties verified (hard-enforced, with tests)

- Carriable allowlist (`carriable_object_index`, game.rb:1160): an object is
  carriable only if it carries a `needsTag`, passes `carriable_object?`
  (game.rb:1247: not a key/credential type, not `locked`, no `requires` /
  `opens_lock` / `keyPins` / `key_id` / `card_id` / `lockType`, no non-empty
  `contents`, not a reveal slot), and its id is not named as a requirement
  anywhere (`lock_referenced_object_ids`, game.rb:1200, over `LOCK_REFERENCE_KEYS`
  including the added `unlockedBy`, `requiresItem`, `targetObject`, `targetId`,
  `objectId`). Tests: npc_carried_items_test.rb:144, 240, 404.
- Object must really be present and its room unlocked to pick up: `carry_object!`
  requires `carriable_object_index[item_id]['room'] == from_room` and
  `item_in_room?(from_room, item_id)` (game.rb:1289-1300); the controller's
  `room_unlocked?` gate (games_controller.rb:1044) still applies. Tests:
  npc_carried_items_test.rb:154, 161.
- Only needs NPCs, only this game: `needs_npc_ids` (game.rb:1266) is the scenario's
  own needs/needsHome NPCs; a stranger or another game's id is refused. Tests:
  npc_carried_items_test.rb:185, 192.
- Put-down reachability and unlocked target: `put_down_carried!` requires
  `scenario_room_ids.include?(to_room)` and `put_down_room_reachable?` (same or
  adjacent room), on top of the controller unlocked gate (game.rb:1317-1320).
  Tests: npc_carried_items_test.rb:168, 176.
- No forged items: put-down, KO drop and the served held item are
  `info['object'].deep_dup.except('texture')` from the scenario definition; only
  `position` is taken from the client, through `apply_carry_position` ->
  `valid_ko_coord?` (finite, range-clamped). Test: npc_carried_items_test.rb:223.
- One item per NPC, must match: a second item while carrying is refused
  (game.rb:1297); put-down/consume/KO act only when
  `npcCarry[npc_id]['itemId'] == item_id` (game.rb:1316, 1340, 1358). Tests:
  npc_carried_items_test.rb:199, 214.
- Sync is reconcile-only and cannot re-mint: `merge_npc_carry!` (game.rb:1403)
  keeps an incoming entry only when a matching stored entry already exists
  (`matches_stored`), so a forged or stale/replayed-after-reload delta writes
  nothing; `npcCarry` is in `RING_KEYED_SECTIONS` and bounded by
  `MAX_NPC_VISIBILITY`. The serve path (`apply_npc_carry!`, game.rb:1462)
  re-validates every stored entry against the allowlist under full scenario_data
  and serves held only when the object is actually recorded removed from its
  origin (`object_removed_from_room?`), so a non-carriable or unbacked stored
  entry is inert. Tests: npc_carried_items_test.rb:297, 309, 321, 340, 356.
- No leak on load: the served held object is ordinary dressing from a room the
  player had to have unlocked to pick it up, served only in the carrying NPC's
  `itemsHeld` and only when `object_removed_from_room?` holds. It cannot surface a
  hidden item or the contents of an unreached/locked room.
- KO drop: `ko_drop_carried!` requires `npc_defeated?` or `npc_ko_claimable?` and
  records the KO only for an NPC actually in the drop room (`npc_in_room?`), the
  R2 m1 fix. Tests: npc_carried_items_test.rb:261, 283, 373, 387.
- Take-then-duplicate is closed: a take routes through `record_npc_gift!`
  (games_controller.rb:1372), which calls `clear_npc_carry_on_delivery!`
  (game.rb:708); `identity_candidates(item).first` is `item['id']`, equal to the
  stored `itemId`, so the carry entry is cleared on every normal take, and
  `apply_npc_carry!` additionally skips serving while
  `carried_item_in_inventory?`.

## Findings

### minor 1 - put_down_carried! / ko_drop_carried! do not mirror the serve-path inventory guard
game.rb:1312 (`put_down_carried!`), game.rb:1348 (`ko_drop_carried!`).
Scenario: `apply_npc_carry!` refuses to serve a carried item once it is in the
player's inventory (`carried_item_in_inventory?`, game.rb:1511), but put-down and
KO drop have no equivalent check. The carry entry is reliably cleared on the
normal take path (`record_npc_gift!` -> `clear_npc_carry_on_delivery!`), so a
replayed put-down after a take already fails on the missing entry; this is only
reachable if a carry entry ever outlives a take (an id-match divergence in the
delivery hook). Impact is confined to a duplicated dressing object (one floor
copy beside the inventory copy), never a key or forged item.
Suggested fix: in `put_down_carried!` and `ko_drop_carried!`, after confirming the
entry, `return false if carried_item_in_inventory?(item_id)` (clearing the stale
entry), matching the serve-path guard.

### minor 2 - carry_object! does not require the NPC to be in the pick-up room
game.rb:1289.
Scenario: `carry_object!` checks the NPC is a needs NPC and the object is in an
unlocked `from_room`, but not that the NPC is in `from_room` (`npc_in_room?`). A
client can make any needs NPC "pick up" a carriable object from any unlocked room
the object sits in, regardless of where that NPC actually is, after which it is
served in that NPC's hand in the player's current room. The plan's prose ("the
needs system only ever...") is not enforced server-side. Impact is cosmetic and
dressing-only: no key/credential/forged object can enter the path, and the object
had to be in a room the player reached.
Suggested fix: add `return false unless npc_in_room?(npc_id, from_room)` to
`carry_object!`, consistent with the put-down reachability bound and the R2 m1 KO
rule. If needs NPCs legitimately reach across an open doorway, allow the same
same-or-adjacent bound used for put-down.

### minor 3 - ko_drop_carried! places the object in any named unlocked room, not only where the NPC is
game.rb:1375-1390.
Scenario: the KO-record write is gated on `npc_in_room?(npc_id, room_id)`, but the
object drop into `room_id` is not: an already-defeated/claimable carrying NPC's
object can be landed in any unlocked scenario room the client names, not only the
room the NPC fell in. The code comment states this is intentional (a hostile NPC
chased through doors), and the impact is dressing-only, so this is noted rather
than a defect.
Suggested fix (optional): if the KO-drop room should be the body's room, gate the
`objects_added` write on `npc_in_room?` too, or fall back to the carry's
`fromRoom` when the NPC is not in `room_id`.

## Test coverage

Hostile cases are covered in `test/controllers/break_escape/npc_carried_items_test.rb`
(25 examples): non-carriable ids (key, locked, contents, credential, lock-referenced,
objective-referenced), item not in room, carry from and put-down into a locked
room, non-adjacent put-down, non-needs NPC, another game's NPC, second item while
carrying, put-down/consume of an uncarried item, forged put-down fields, KO without
a record, forged sync not re-minting, replay after consume, replay after put-down,
extra keys dropped and bounded, KO-record room gating. JS wiring and the
sync-refusal path are covered by `test/js/npc-carry-wiring.test.mjs` and
`test/js/room-state-sync-refusal.test.mjs`. No additional hostile Rails case is
needed for the minors above; each is a hardening suggestion, not an exploit.

Serving: 0/0/3

## Outcomes (serving minors)

- minor 1: `put_down_carried!` and `ko_drop_carried!` now `return false if
  carried_item_in_inventory?(item_id)`, mirroring the serve-path guard. Test:
  "put down and KO drop refuse when the player already holds the carried object".
- minor 2: `carry_object!` now requires `npc_can_reach_room?(npc_id, from_room)`
  (the NPC's scenario room or one adjacent to it) and refuses a KO'd NPC. Chosen
  over a strict same-room rule because the server sees only an NPC's scenario
  placement, not its live simulated position, and a needs walk only ever crosses
  into a neighbouring room. Tests: "a carry from a room the NPC cannot reach is
  refused", "a KOd NPC cannot pick up a carriable object".
- minor 3: `ko_drop_carried!` now bounds the drop to the same reachability rule
  (`npc_can_reach_room?`) rather than any named unlocked room. Test: "a KO drop
  into a room the NPC cannot reach is refused with the carry intact".
