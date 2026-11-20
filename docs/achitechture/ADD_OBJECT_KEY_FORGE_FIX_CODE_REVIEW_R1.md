# add_object key-forge fix: adversarial code review R1

Branch `build/addobject-keys` against `main`. Reviewed the server-side strip
(`Game#strip_forgeable_lock_fields` / `FORGEABLE_LOCK_FIELDS`,
`app/models/break_escape/game.rb`), the strong-params change
(`GamesController#item_add_params`), the Priority 0 path
(`find_accessible_item`), the key check (`Game#has_key_in_inventory?`),
`lib/break_escape/item_identity.rb`, and the new test
`test/controllers/break_escape/add_object_key_forge_test.rb`.

Verdict: the strip is correct as far as it goes, but it does not close the
forge. A tampered client can still mint a working key for any key lock. One
blocker.

## Blocker

### B1. A forged key whose `id` equals the lock's reference still opens the lock

The strip removes `opens_lock`, `key_id` and the other lock fields, but it
deliberately keeps `id` and `name` (identity and placement come from the
client). The key check does not read `opens_lock` only: `has_key_in_inventory?`
(game.rb ~211) matches on `ItemIdentity.identity_candidates`, which is
`[id, lock_ref]`. So an item whose own `id` equals the lock's `requires`
reference counts as a key for that lock, with no `opens_lock` at all. This is
the backward-compatibility leg documented in both `has_key_in_inventory?` and
`ItemIdentity` ("an item's own id is accepted too").

Attack, no `opens_lock` anywhere:

1. `POST /update_room` `add_object`, unsourced, `data: {type: "key",
   id: "vault_lock"}` where `vault_lock` is the locked door's `requires`
   value (already known to the tampered client, it is the same id it used to
   send in `opens_lock`). The strip removes nothing of use; the stored object
   is `{type: key, id: "vault_lock", name: ...}`.
2. `POST /inventory` `add`, item `{type: "key", id: "vault_lock"}`. Priority 0
   of `find_accessible_item` matches the stored added object by `id`, returns
   it as `@collectible_item`; `canonical_inventory_item` keeps it (it is a
   Hash, so it is deep-duped and only `requires`/`contents` are filtered); the
   inventory now holds `{type: key, id: "vault_lock"}`.
3. `POST /unlock` door `vault` method `key`: `has_key_in_inventory?(room['requires'])`
   = `has_key_in_inventory?("vault_lock")`, `identity_candidates` of the
   inventory item is `["vault_lock"]`, match, `200`, vault opens.

Proven end to end with a focused integration test on this branch (the same
`ceo_exfil`/`vault` harness as the shipped test, forged key `id: "vault_lock"`,
no `opens_lock`): pickup `200`, unlock `200`, `unlockedRooms` includes `vault`.
The stored inventory item was the forged object (name "Shiny key"), not the
real `vault_key`, so the forged stripped object is itself acting as the key.
The same works via `scenarioData.id`, which is permitted and not stripped.

The branch's own test passes only because it gives the forged key a
non-colliding `id` (`forged_key`), so it never exercises the `id`-as-lock-ref
leg. The build log's claim "no forged key reaches a lock" and the test comment
"opens nothing" are therefore not true for the realistic case.

Fix direction (not prescriptive): on an unsourced add, do not let the client
choose an `id` (or `scenarioData.id`) that can serve as a lock reference. The
cleanest options are to force a server-generated `id` on the unsourced branch
(overwrite the client `id` and `scenarioData.id` before storing), or to make
`has_key_in_inventory?` not honour the bare-`id` leg for an item that carries
no `opens_lock` and has no scenario copy, or to tag unsourced added objects so
Priority 0 and the key check never treat them as keys. Forcing a fresh server
`id` also closes the separate "client id collides with a real scenario item id"
concern in one move. Whatever the fix, add a test with the forged `id` equal to
the lock's `requires` value.

## Major

### M1. Test coverage misses the live hole

`add_object_key_forge_test.rb` asserts the strip removes the fields and that a
random-id forged key opens nothing, but never tries an `id` (or `name`, or
`scenarioData.id`) that collides with the lock reference or with a real
scenario item id, which is exactly the case B1 exploits. The suite is green
while the forge is open. Add the collision cases before closing this review.

## Minor

### m1. The two forbidden-field lists have drifted and are not a single source

`FORGEABLE_LOCK_FIELDS` (model) and `CLIENT_ITEM_FORBIDDEN_FIELDS` (controller,
`canonical_inventory_item`) overlap but differ: the model adds `keyId`,
`access`, `card_id`, `rfid_protocol`, `acceptsUIDOnly`; the controller list
adds `scenarioData` and omits those. The model comment says it "Mirrors the
controller's CLIENT_ITEM_FORBIDDEN_FIELDS", which is no longer accurate. Two
hand-maintained lists of security-relevant fields will drift again; a shared
constant (or one referencing the other) would keep them in step and make the
comment true. Note this is defence in depth only, the real matching is through
`ItemIdentity`, so a missing entry here is not itself the hole (B1 is).

## Nit

### n1. `access` / `needsTag` / `holds` / `storeIn` stripped on unsourced adds

These authored-behaviour fields are stripped on the unsourced branch. No
legitimate client path hits that branch (every client `addItemToRoom` call in
`public/break_escape/js/` passes a source: `npc_defeated`, `player_drop`, or an
NPC give through `addToInventory`), and no scenario performs a sourceless
`add_object` (`scenarios/` has no engine-driven sourceless add), so the strip
is harmless to real play. Recorded only so a future sourceless-add feature
knows these are dropped.

## Checks run

- Scenario / client grep: every `addItemToRoom` call site passes a source; the
  only `scenarios/` "add_object" hit is `#add_objective` in m01 ink (false
  positive). The strip breaks no authored behaviour.
- Legit-path tests on this branch, all green: `add_object_key_forge_test` (14,
  shared file count), `inventory_canonical_item_test`, `capture_proofs_test`,
  `wearable_test` (55 runs combined, 0 failures). NPC drop and player
  drop-then-repickup still open the lock.
- RFID/keycard: `card_id` is stripped and `held_rfid_cards` derives nothing
  from `id`, so the `id`-collision trick does not transfer to RFID locks.
- Full `bin/rails test` / `bin/test-js` not re-run here; the build log records
  them green, and the blocker is a logic hole the suite does not cover rather
  than a regression the suite would catch.

## Counts

Blocker 1, Major 1, Minor 1, Nit 1.
