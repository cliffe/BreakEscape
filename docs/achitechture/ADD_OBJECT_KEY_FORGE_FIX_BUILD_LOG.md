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

- Full `bin/rails test` (under the shared lock): 1801 runs, 25607 assertions,
  0 failures, 0 errors, 1 skip.
- Full `bin/test-js -j 3` (under the shared lock): 507 files passed, 0 failed.
- New `add_object_key_forge_test.rb`: 5 runs, 0 failures.
- Live proof on :3044: forged key refused (422 Invalid attempt), real key opens
  the door (200).

Commit `54f722db6` carries the fix, test and this log; the Results numbers above
were added as a follow-up commit.

## Open / left undone

- None known. The fix is a strict strip on a path with no legitimate client
  caller (every client `addItemToRoom` call passes a source), so no behaviour
  change for real play is expected.
