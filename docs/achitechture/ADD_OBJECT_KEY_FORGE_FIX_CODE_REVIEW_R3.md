# add_object key-forge fix: adversarial code review R3

Branch `build/addobject-keys` against `main`, round 3, after the R2 follow-up
(commit `31384a231`). Reviewed the R2 fixes to the capture-proof plant
(`CaptureProofs#record_planted_item!`, `CaptureModel.object_takes_item?`), the
B1 sweep (`held_grant_items`, `update_cloner_saved_cards!`,
`find_flag_station_by_id`'s inventory branch), the rogue-device guard
(`NetworkAccess#held_rogue_device`), the marker field change
(`CLIENT_ITEM_FORBIDDEN_FIELDS`), the two new drop-and-repickup regressions, and
then swept `git diff main...HEAD` and the whole server for any other route where
a client-added item, or an item whose type or name was forged, can grant access,
a credential, a foothold or a flag.

## Verdict

Every R2 finding is closed. The blocker, both minors and the nit are fixed
exactly as directed, and the fixes read correctly against the code paths. The
forged-item vector this branch exists to close is now shut on every
credential-minting and access-minting route I could find: each inventory read
that grants anything either carries an explicit `client_forged?` guard or is
provably unreachable by a forged item (it needs a field the strip removes, or it
is gated behind an already-guarded matcher). No blocker, no major.

The remaining notes are a documented best-effort gap (objective counting, which
is already fully client-trusted and mints no credential, so it is in policy) and
two cosmetic points in `capture_model.rb`.

## R2 findings, re-checked

### Blocker (R2 B1): capture-proof plant forge. Fixed.

`CaptureProofs#record_planted_item!` now skips a client-forged held item
(`capture_proofs.rb`, ~31), and `CaptureModel.object_takes_item?` returns false
for an item carrying `clientAdded` (`capture_model.rb`, ~212). Two independent
guards on the same path. `planted_target_object` resolves the plant target from
`scenario_data['rooms']` by id only, never from `objects_added`, so the target is
always a genuine scenario object. `capture_proof_holds?`'s `planted` branch reads
`plantedItems`, which only `record_planted_item!` writes; its `gainedFootholds`
fallback is fed by the guarded foothold matchers. New test in
`capture_proofs_test.rb` drives the full unsourced add, pick up, remove-used-on
path and asserts `plantedItems` stays empty and the gated password is withheld.
Verified: the test passes, and the code review live-proof (keyless server, device
named `kit_logger`) in the build log matches the path.

### Minor (R2 m1): `held_rogue_device` protected by id replacement, not the marker. Fixed.

`NetworkAccess#held_rogue_device` now guards explicitly with
`ItemIdentity.client_forged?(item)` before `held_in?` (`network_access.rb`,
~149), so a scenario that defined a rogue device with no id would no longer let a
forged `type`+`name` device through. New regression in `network_footholds_test.rb`
proves a real dropped-and-repickup device is not marked forged and still plants.

### Minor (R2 m2): client could set `clientAdded` on an always-allowed add. Fixed.

`CLIENT_ADDED_MARKER` is now in `CLIENT_ITEM_FORBIDDEN_FIELDS`
(`games_controller.rb`, ~2183), so the non-Hash branch of
`canonical_inventory_item` strips a client-supplied `clientAdded` before storing.
Only `Game#add_item_to_room!` writes the marker. The marker now sits in the single
source via `ItemIdentity::CLIENT_ADDED_MARKER`.

### Nit (R2 n1): drop-then-repickup coverage was keys only. Fixed.

Added a keycard round-trip (`access_model_rfid_test.rb`: re-picked badge still
opens its rfid door, `card_id` survives, not marked forged) and a network-device
round-trip (`network_footholds_test.rb`, above). Both exercise the `player_drop`
rebuild-from-server-copy path, which is what guarantees a real item is never
tagged forged.

## Sweep of the whole server

Every inventory read that grants something was checked against the policy
(hard-enforce secrets, keys and forged items; best-effort client-flow steps the
server still checks; never break the intended path):

- Keys and locks: `has_key_in_inventory?`, `has_lockpick_in_inventory?`,
  `has_pin_cracker_in_inventory?` all guard (`game.rb` ~226, ~251, ~2567).
- Keycards and card copies: `held_keycard_ids` and `rfid_cloner_held?` guard
  (`game.rb` ~1880, ~1896); `held_rfid_cards`, `held_clone_source_keycard` and
  `clone_source_keycard` are gated behind those, and a forged item has `card_id`
  stripped, so it never enters `held_keycard_ids` and cannot be a clone source.
- Flag stations: `find_flag_station_by_id`'s inventory branch guards
  (`games_controller.rb` ~2955); its scenario and NPC-held searches read
  `scenario_data`, which `objects_added` never joins.
- Capture secrets: covered above.
- Wearables and network devices: `wear!` needs the `wearable` field (stripped)
  and a server-defined `disguises` costume, so a forged item is refused;
  `held_rogue_device` and `inventory_item_matching` both guard
  (`network_access.rb` ~149, ~399).
- Grants: `held_grant_items` guards (`game.rb` ~2618) so a forged item cannot
  impersonate a no-id grant item and draw its server-side contents;
  `update_cloner_saved_cards!` guards (`game.rb` ~3103).
- Give and drop routes: the NPC-sourced add verifies the NPC actually holds the
  item (`find_npc_held_item`) and rebuilds from the server copy; the player-drop
  route requires a held `droppable` item and rebuilds from the server copy, and a
  forged item has `droppable` stripped, so it can neither be dropped nor laundered
  into an unmarked copy. Neither route marks a genuine item forged.
- Room-object reads that only hide (`filtered_room_data`, the container-contents
  filter, `planted_device?`) grant nothing, so they need no guard.

The forged room object only becomes dangerous once it reaches the inventory;
`find_accessible_item` Priority 0 returns the stored added object and
`canonical_inventory_item` deep-dups it, carrying the `clientAdded` marker into
the inventory item, where every grant matcher above skips it. That is the single
choke point the fix relies on, and it holds.

## Minor

None.

## Nit

### n1. `object_takes_item?` uses the literal `'clientAdded'`, not the constant. Acceptable.

`capture_model.rb` matches `item['clientAdded'] == true` rather than
`ItemIdentity::CLIENT_ADDED_MARKER`. This is the right call, not a slip:
`capture_model.rb` is deliberately plain Ruby with no ActiveSupport
(`validate_capture_log.rb` and `validate_scenario.rb` require it on its own), and
`item_identity.rb` uses `blank?`/`present?`, so referencing the constant would
pull ActiveSupport into the validator and break that constraint. Confirmed the
file still loads AS-free under ruby3.2 and the guard returns false for a marked
item. The residual cost is a second place the marker string lives: a future rename
of `clientAdded` must touch both, and nothing fails if one is missed. A one-line
test asserting `CaptureModel`'s guard rejects an item carrying
`ItemIdentity::CLIENT_ADDED_MARKER` would couple them without touching the
file's dependencies. Worth adding, not blocking.

### n2. Objective collect count is not guarded, by design and in policy. Acceptable.

`Game#validate_collection` (`game.rb` ~4027) counts inventory items by type, id or
name, so a forged `clientAdded` item could be counted toward a `collect_items`
objective. This is in policy: the same method already returns true on a
client-supplied `currentCount` at or above the target (line 4019), so the
objective count is fully client-trusted regardless of this branch, and completing
an objective mints no secret, key, card or foothold. Guarding the count would add
nothing while the `currentCount` short-circuit stands. Left unguarded correctly;
recorded so a future change that makes an objective gate a credential knows to
revisit it.

### n3. Unrelated reindent bundled into the security commit. Cosmetic.

`capture_model.rb`'s `shorthand_proofs` had its `elsif`/`end` de-indented to
column 8 while the branch bodies stay at column 19 (`capture_model.rb` ~115-117),
so the `if` expression is now misaligned. It is semantically identical and looks
like a formatter artifact, but it is scope creep in a security commit and reads
slightly worse than before. Trivial.

## Checks run

- Affected Rails tests, run without the lock, all green:
  `capture_proofs_test`, `access_model_rfid_test`, `network_footholds_test`,
  `add_object_key_forge_test` (99 runs, 662 assertions, 0 failures, 0 errors);
  `network_implants_test`, `inventory_canonical_item_test` (23 runs, 98
  assertions, 0 failures, 0 errors).
- `capture_model.rb` loads under `/usr/bin/ruby3.2` with no ActiveSupport and
  `object_takes_item?` returns false for an item carrying `clientAdded`.
- Full suites not rerun here (test-lock congestion rule); the orchestrator runs
  them once per merge batch.

## Counts

Blocker 0, Major 0, Minor 0, Nit 3.
