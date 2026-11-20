# add_object key-forge fix: adversarial code review R2

Branch `build/addobject-keys` against `main`. Round 2, after the R1 follow-up.

Reviewed the server id + `clientAdded` marker fix (`Game#add_item_to_room!`), the
marker and `client_forged?` helper (`lib/break_escape/item_identity.rb`), the six
guarded matchers (`has_key_in_inventory?`, `has_lockpick_in_inventory?`,
`has_pin_cracker_in_inventory?`, `rfid_cloner_held?`, `held_keycard_ids`,
`NetworkAccess#inventory_item_matching`), the strong-params change, the inventory
add path (`find_accessible_item` Priority 0, `canonical_inventory_item`),
`sync_state`, the wear path, the capture-proof path, and the new regression test.

## Verdict

The R1 blocker (forged `id`/`name`/`scenarioData.id` equal to a lock reference)
is closed well: the unsourced branch forces a server id, drops `scenarioData.id`,
stamps `clientAdded`, and six matchers skip a marked item. Marker integrity holds:
no client path sets or clears `clientAdded` on a credential item (`sync_state`
does not merge `inventory` or `objects_added`; `/inventory add` rebuilds from the
server's stored object, which carries the marker; a `player_drop` of a forged item
is refused because `droppable` was stripped, so it cannot be laundered). The
drop-and-repickup regression is real and passes.

But the sweep is incomplete. It claims "every credential matcher now ignores a
client-forged item", and that invariant is false: at least one inventory-reading
matcher that mints an access credential was not guarded, and a second relies on the
id replacement rather than the marker. One blocker.

## Blocker

### B1. `record_planted_item!` does not skip a client-forged item: a forged device mints a capture proof

`CaptureProofs#record_planted_item!` (`app/models/break_escape/capture_proofs.rb`,
~26) reads `player_state['inventory']` to decide whether a plant happened, and it
has no `client_forged?` guard. It finds the held item by id, then calls
`CaptureModel.object_takes_item?(found[:object], held_data)`, which matches the
object's `requiresItem` against the held item's `[id, type, name]`
(`lib/break_escape/capture_model.rb`, 205-218). `type` and `name` are
client-chosen on an unsourced add and are not stripped, so the forced server id
does not help here.

Path, no real device needed:

1. `POST /update_room` `add_object`, unsourced, `data: {type: "<device type a
   plant target's requiresItem names>", name: "...", takeable: true, x, y}`. The
   object is stored with a server id and `clientAdded: true`, but keeps the
   client `type` and `name`.
2. `POST /inventory` `add` for it. Priority 0 resolves the stored added object;
   `canonical_inventory_item` keeps it (marker and all); it is takeable, so it
   enters the inventory.
3. `POST /inventory` `remove` with `used_on: "<target object id>"`.
   `record_planted_item!` finds the forged item by its (now known) server id,
   `object_takes_item?` matches on `type`/`name`, the target consumes an item and
   its room is unlocked, so a `plantedItems` entry is recorded.
4. `capture_proof_holds?` returns `true` for that `planted` proof, and the
   captured account password gated behind it is served.

So a tampered client forges the plant the capture proof is meant to prove, and
collects a credential it never earned, through the same forged-item vector this
branch exists to close. Capture-proof plants are a shipping mechanic (the social
engineering / physical pentest lab), so this is live, not theoretical.

Caveats on reach, which lower but do not remove it: the target must consume the
item (`consumesItem`/`remove_item` in `triggerOnInteract`) and must not have a USB
policy that `AccessWork.plant_refused?` rejects the bare forged device by. A plant
target without a restrictive USB policy is enough. I did not build a live PoC; the
read is from the code path, which is unambiguous about the missing guard.

Fix direction (not prescriptive): add `next false if
BreakEscape::ItemIdentity.client_forged?(inv)` to the `held` lookup in
`record_planted_item!`, the same one-line guard used in the six swept matchers.
Add a regression test: a forged `clientAdded` device whose `type`/`name` matches a
plant target's `requiresItem` records no `plantedItems` entry and `capture_proof_holds?`
stays false.

## Minor

### m1. `held_rogue_device` is protected by the id replacement, not the marker

`NetworkAccess#held_rogue_device` (`network_access.rb`, 132-148) decides whether
the player holds a plantable rogue device (and feeds `plant_device!`, which grants
a network foothold). It matches with `ItemIdentity.held_in?(definition, [item])`
and has no `client_forged?` guard. A forged device is blocked here only
incidentally: `held_in?` compares the definition id to the item id first, and the
forced server id never equals the definition id, so the name fallback is skipped
whenever the device definition has an id (they normally do). If a scenario ever
defines a rogue device with no id, a forged `clientAdded` item with a matching
`type`+`name` would be accepted and `plant_device!` would grant a foothold. This
sits outside the stated "every credential matcher ignores a forged item"
invariant, which is what makes it fragile. Same one-line guard closes it.

### m2. The client can set `clientAdded` on an always-allowed add

`clientAdded` is not in `CLIENT_ITEM_FORBIDDEN_FIELDS`. For items that reach the
non-Hash branch of `canonical_inventory_item` (`@collectible_item` nil, e.g.
`ALWAYS_ALLOWED_ITEMS` like a notepad), the client's own hash is stored after only
`except(*CLIENT_ITEM_FORBIDDEN_FIELDS)`, so a client-supplied `clientAdded: true`
survives into the inventory item. No escalation today (always-allowed items are
not credentials, and marking an item forged only makes credential checks ignore
it, which is self-defeating for the attacker). But a security-relevant marker the
client can set at all is an avoidable foot-gun. Add `CLIENT_ADDED_MARKER` to
`CLIENT_ITEM_FORBIDDEN_FIELDS` so only the server ever writes it.

## Nit

### n1. Regression coverage for drop-then-repickup is keys only

The new test proves a real key survives drop-and-repickup unmarked, which is the
regression that would break missions. It does not cover a keycard or a network
device dropped and picked up again, and the brief called those out. Both route
through the same `player_drop` branch (rebuilt from the server copy, no marker),
so I expect them green, but a keycard (RFID lock) and a device (`needsHeld`)
drop-and-repickup case would nail down that a legitimately authored card or device
is never wrongly marked forged.

## Checks run

- Marker cannot be set or cleared by the client on a credential item: `sync_state`
  merges neither `inventory` nor `room_states.objects_added`; `/inventory add`
  copies the server's stored object (marker preserved) via `canonical_inventory_item`;
  `player_drop` of a forged item is refused (`droppable` stripped), so no laundering.
- Wear path is safe without a marker guard: `WearableModel.spec` needs the
  `wearable` field (stripped) and a server-defined `disguises` costume, so a forged
  item is refused with "not something you can wear".
- Keycard/clone matchers (`held_keycard_ids`, `held_clone_source_keycard`) are
  guarded or gated behind `held_keycard_ids`, and `card_id` is stripped, so the
  forged-item trick does not transfer to RFID or card copies.
- Affected Rails tests, run without the lock, all green:
  `add_object_key_forge_test`, `capture_proofs_test`, `network_footholds_test`,
  `network_implants_test` (81 runs, 592 assertions, 0 failures, 0 errors).

## Counts

Blocker 1, Major 0, Minor 2, Nit 1.
