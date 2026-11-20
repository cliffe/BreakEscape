# add_object key-forge fix

Branch `build/addobject-keys`. Server-side access-model hardening: an unsourced
`add_object` let a tampered client mint a working key for any key lock.

## The gap (confirmed on main)

A tampered client can POST `/games/:id/update_room` with `actionType: "add_object"`
and no server-known source (no `sourceNpcId`, no `sourceType: "player_drop"`).

- `GamesController#item_add_params` permitted `scenarioData.opens_lock`,
  `scenarioData.key_id` and `scenarioData.keyPins` straight from the client
  (`app/controllers/break_escape/games_controller.rb`, `item_add_params`).
- `Game#add_item_to_room!` (`app/models/break_escape/game.rb`) rebuilds the item
  from the server's own copy only in its two source branches (NPC drop,
  `player_drop`). An unsourced add fell through and stored the client hash raw
  into `player_state['room_states'][room]['objects_added']`.
- `GamesController#find_accessible_item` Priority 0 trusts anything in
  `objects_added` as "already security-validated by add_item_to_room!", so a
  later `/inventory add` resolved the forged object as `@collectible_item`.
- `canonical_inventory_item` keeps `@collectible_item`'s own fields (it only
  filters `requires`/`contents`), so the forged `opens_lock` reached the
  inventory, and `has_key_in_inventory?` then matched it.

Proven end to end before the fix: a forged `{type:key, scenarioData:{opens_lock:
"vault_lock"}}` added to an unlocked room, picked up, made
`validate_unlock("door","vault",nil,"key")` return `true`.

### Other lock-bearing fields checked

- **Key ids / `opens_lock` / `keyPins`** — forgeable (the gap above). Fixed.
- **Keycard / badge RFID credentials (`card_id`)** — not reachable: `card_id`
  was not in `item_add_params`, and `held_rfid_cards` only counts an inventory
  keycard whose `card_id` matches a scenario keycard definition. Now also
  stripped on an unsourced add as defence in depth.
- **PIN / password hints (`requires`)** — not forgeable: the server compares the
  attempt to `room['requires']` / `object['requires']` from the scenario
  snapshot, never from the client. `requires`/`lockType`/`locked` were not in
  `item_add_params`. Now also stripped on an unsourced add.
- **`requires` items / `contents` / `itemsHeld` / `flags`** — not permitted by
  the params filter; now stripped as well.
- **Cloned card data** — recorded server-side only by `record_card_clone!`
  (`POST /clone_card`), which copies from the source's own scenario card and
  needs the card copier held; untouched by this path.
- **Network devices** — the `planted_device?` check on `/inventory add` is
  unchanged.

## The fix (server-side)

1. `Game#add_item_to_room!`: for an add that is neither an NPC drop nor a
   `player_drop` of a held item, strip lock-relevant and authored-behaviour
   fields (top level and inside `scenarioData`) via
   `strip_forgeable_lock_fields` / `FORGEABLE_LOCK_FIELDS`. The two source
   branches already rebuild the item from the server's scenario copy, so they are
   unaffected.
2. `GamesController#item_add_params`: dropped `opens_lock`, `key_id` and
   `keyPins` from the permitted `scenarioData` keys. Only identity and placement
   come from the client; a legitimate drop takes its lock fields from the server
   copy. Defence in depth behind (1).

Legitimate paths kept working: room/container pickups, NPC gives, timer and
declared grants, the card copier's clone, and drop-then-pick-up-again all route
their lock fields from the server's own definition, not from `item_add_params`.

## Tests

- New: `test/controllers/break_escape/add_object_key_forge_test.rb` (5 tests):
  forged `scenarioData.opens_lock`, forged top-level `opens_lock`, and forged
  `card_id`/`requires`/`lockType` are all stored without their lock fields and
  open nothing; an NPC drop of a real held key and a player drop + re-pickup of a
  real held key still open the lock.
- Existing, rerun green: `inventory_canonical_item_test`, `capture_proofs_test`
  (player_drop), `wearable_test`, `reload_persistence_test`,
  `network_implants_test`, `network_footholds_test`.
- Full `bin/rails test` and `bin/test-js` under the shared lock: see "Results".

## Live proof (keyless server on :3044)

Driven over HTTP as a signed-in browser console would (session cookie + CSRF
token from the real game page):

- Tampered: unsourced `add_object` of a forged key -> inventory add -> the stored
  item's `scenarioData` has no `opens_lock`; `POST /unlock` key -> `422 Invalid
  attempt`, vault stays locked.
- Legit: pick up the real vault key (keeps `opens_lock: "vault_lock"` from the
  server copy) -> `POST /unlock` key -> `200`, door opens.

## Files touched

- `app/models/break_escape/game.rb` — `add_item_to_room!`, new
  `FORGEABLE_LOCK_FIELDS` + `strip_forgeable_lock_fields`.
- `app/controllers/break_escape/games_controller.rb` — `item_add_params`.
- `test/controllers/break_escape/add_object_key_forge_test.rb` — new.

## Results

- Full `bin/rails test` (under the shared lock): 1806 runs, 25624 assertions,
  0 failures, 0 errors, 1 skip (post-R1).
- Full `bin/test-js -j 3` (under the shared lock): 507 files passed, 0 failed.
- `add_object_key_forge_test.rb`: 10 runs, 0 failures.
- Live proof on :3044: forged key (via `opens_lock` and via an `id` equal to the
  lock reference) refused (422 Invalid attempt); real key opens the door (200).

Commit `54f722db6` carried the first fix; `8430283ac` its suite numbers; the R1
follow-up (B1 + sweep + m1/n1) and these numbers are in the later commit.

## Review R1 follow-up

R1 (`ADD_OBJECT_KEY_FORGE_FIX_CODE_REVIEW_R1.md`) found the first fix incomplete:
stripping the lock fields left the client's `id`, and `has_key_in_inventory?`
accepts an item's own id as a lock reference (the pre-rename compat leg), so a
forged key with `id` equal to the lock's `requires` value still opened it
(blocker B1). The same held for `scenarioData.id`.

Closed in both directions, plus a sweep:

- **Unsourced add now gets a server id and a marker** (`Game#add_item_to_room!`):
  the client `id` is replaced with a fresh `"<room>_cadd_<hex>"`, `scenarioData.id`
  is dropped, and the object is stamped `clientAdded: true`
  (`ItemIdentity::CLIENT_ADDED_MARKER`). The marker travels into the inventory
  through `canonical_inventory_item` and cannot be set or cleared by the client
  (`item_add_params` does not permit it; sourced drops rebuild from the server
  copy and never carry it).
- **Every credential matcher now ignores a client-forged item**
  (`ItemIdentity.client_forged?`): `has_key_in_inventory?`,
  `has_lockpick_in_inventory?`, `has_pin_cracker_in_inventory?`,
  `rfid_cloner_held?`, `held_keycard_ids` (which feeds `held_rfid_cards`), and
  the network `needsHeld` matcher `NetworkAccess#inventory_item_matching`. So a
  forged key, lockpick, PIN cracker, card copier, keycard or `needsHeld` device
  is inert. The pre-rename bare-id leg still opens a real scenario key
  (regression-tested).
- **m1**: the two strip lists are now one source,
  `ItemIdentity::FORGEABLE_ITEM_FIELDS`; `FORGEABLE_LOCK_FIELDS` is that list and
  `CLIENT_ITEM_FORBIDDEN_FIELDS` is it plus `scenarioData`.
- **n1**: the authored-behaviour strip on the unsourced branch is intentional
  (no client path and no scenario performs a sourceless add); documented in the
  code comment.

New tests in `add_object_key_forge_test.rb`: forged id, forged `scenarioData.id`
and forged `name` collisions with the lock reference, a forged lockpick, and a
real pre-rename key (bare id, no `opens_lock`) that still opens. Live proof on
:3044: a tampered console forge with `id: "vault_lock"` is stored with a
server id and `clientAdded: true`, pickup by id and by name both yield one inert
item, and `/unlock` returns 422.

### Note for scheduling

The forged-lockpick vector (B1's type-based cousin: a forged `{type: "lockpick"}`
would have opened any key lock, since `has_lockpick_in_inventory?` keys on type,
not id) was in the same family and is closed here by the `clientAdded` skip, not
only the id fix. Flagging it because it was beyond R1's stated identity_candidates
sweep.

## Review R2 follow-up

R2 (`ADD_OBJECT_KEY_FORGE_FIX_CODE_REVIEW_R2.md`) confirmed the R1 blocker closed
but found the "every credential matcher ignores a forged item" sweep incomplete.
One blocker, two minors, one nit, all fixed.

- **B1 (blocker): capture-proof plant forge.** `CaptureProofs#record_planted_item!`
  read the inventory and matched a plant target's `requiresItem` by type/name, with
  no `client_forged?` guard, so a forged `clientAdded` device named after the target
  minted a `plantedItems` entry and served the gated account password. Both the
  inventory read (`record_planted_item!`, guards the held entry) and
  `CaptureModel.object_takes_item?` (guards on `item['clientAdded'] == true`, a
  literal to keep `capture_model.rb` ActiveSupport-free for `validate_capture_log.rb`)
  now skip a forged item.
- **B1 sweep.** Swept every inventory read that grants anything, matching by type or
  name. Newly guarded: `held_grant_items` (a grant serves its server-side contents by
  id/name; a forged item could impersonate a grant item with no id),
  `update_cloner_saved_cards!` (a forged `rfid_cloner` must not be picked as the
  cloner), and `find_flag_station_by_id`'s inventory branch (a forged
  flag-station/launch-device must not stand in). Explained safe, not guarded:
  `held_clone_source_keycard` / `clone_source_keycard` (gated behind the guarded
  `held_keycard_ids` and `card_id` is stripped), `planted_device?` and the room
  reload filter (hide, never grant), the objective `collect_items` count (already
  client-trusted via `currentCount`, grants no access credential), and the wear path
  (needs the stripped `wearable` field).
- **m1.** `NetworkAccess#held_rogue_device` now guards explicitly on the marker,
  rather than relying incidentally on the forced server id never equalling a device
  definition id.
- **m2.** `CLIENT_ADDED_MARKER` added to `CLIENT_ITEM_FORBIDDEN_FIELDS`, so a client
  cannot set `clientAdded` on an always-allowed item it builds. The server
  (`add_item_to_room!`) is the only writer of the marker.
- **n1.** Drop-and-repickup regressions added for a keycard (opens its rfid door
  after the round trip, not marked forged) and a network device (still plants a
  foothold after the round trip, not marked forged).

### Tests (R2)

- New: `capture_proofs_test.rb` (forged clientAdded device matching a plant target
  records no plant and serves no secret), `access_model_rfid_test.rb` (keycard
  drop-and-repickup), `network_footholds_test.rb` (network device drop-and-repickup).
- Affected files rerun without the lock, all green:
  `capture_proofs_test`, `access_model_rfid_test`, `network_footholds_test`,
  `network_implants_test`, `add_object_key_forge_test` (113 runs, 718 assertions, 0
  failures); `inventory_canonical_item_test`, `lab_physical_pentest_secrets_test`,
  `capture_secret_test` (52 runs, 868 assertions, 0 failures).
- `validate_capture_log.rb`'s shared `capture_model.rb` still loads AS-free under
  ruby3.2 and `object_takes_item?` skips a `clientAdded` item.
- Full suites not rerun here (test-lock congestion rule); the orchestrator runs them
  once per merge batch.

### Live proof (keyless server on :3044, test_capture_log mission)

Driven over HTTP as a signed-in browser console would (session cookie + CSRF token
from the real game page). Same correctly-keyed capture claim on both runs; the only
difference is the device.

- Tampered: unsourced `add_object` of a device named `kit_logger` (chris_desk's
  `requiresItem`) -> stored with a server id and `clientAdded: true` -> pick up ->
  `/inventory remove used_on: chris_desk` -> `plantedItems` stays `[]`,
  `/capture_secrets` returns `{}` (chris's password withheld).
- Legit: the real start-item `kit_logger` -> same plant -> `plantedItems` records
  `{item: kit_logger, on: chris_desk}`, `/capture_secrets` returns
  `{hampshire: "Test-Chris-Keys-41"}`.

## Open / left undone

- None known. The fix is a strict strip on a path with no legitimate client
  caller (every client `addItemToRoom` call passes a source), so no behaviour
  change for real play is expected.
