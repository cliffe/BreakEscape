# Credential keyring K1: review round 3 (delta)

Scope: `git log --no-merges 3ba8192a2..bcdf5ee08` on `build/keyring-k1`, restricted to the keyring commits (b05aa507e, a81e3c0c7, 0c4bfbc1b, 2d30e585c). Read only.

## Verdict: SHIP (B0 / M0 / m3)

The held proof now fires through the real request path, and I found no way for a client to earn a credential it has not legitimately taken. The three minors are hardening, none blocks the slice.

Tests run one by one: `keyring_take_route_test.rb` 3 runs / 0 failures; `access_leak_scanner_test.rb` 52 / 0; `game_test.rb` 100 / 0; `sync_payload_size_test.rb` (controllers) 3 / 0; `node test/js/validator-credentials.test.mjs` fail 0.

## 1. restamp_item_credential! (app/models/break_escape/game.rb:671-689)

- Forged credential: every stored item has `credential` deleted first (line 676), then restored only from the scenario's own definition. On the main route the stored item is the server's own copy (`canonical_inventory_item`, games_controller.rb:3045-3063) and `credential` is also in `FORGEABLE_ITEM_FIELDS` (lib/break_escape/item_identity.rb:31), so the fallback `client_item.except(...)` drops it too. Confirmed by the forgery tests.
- Forged id or type on another item: the definition is looked up by the stored item's id and must match on both `type` and `id` (lines 685-686). Stored type and id come from the server copy, so a client cannot relabel a plain item. Fail closed: no definition, empty id, or a type mismatch leaves the item without a credential.
- Item from another room or scenario: `item_definition` walks the whole scenario, so room is not a factor here, but it does not need to be. Whether the player may take the item is decided earlier by `validate_item_collectible` (room unlocked, container unlocked, NPC encountered, takeable). Restamp only adds the field to an item that already passed that. The scenario is the game's own `scenario_data`, so another scenario is unreachable.
- Duplicates: restamp runs before the `inventory_includes?` dedupe but only mutates the incoming hash; an existing stored item is never changed, and a repeat add returns early in the controller (games_controller.rb:1345). No duplication path.
- Writers to `player_state['inventory']`: all item adds go through `add_inventory_item!` (route at games_controller.rb:1368, flag-station reward at 3736) or `initialize_player_state` (game.rb:7116, restamped after the filter). The other writers are network_access.rb (link items and a returned planted device, both server-built or already held), removes, and wearables. The only other `add_inventory_item!` caller is Api::GamesController, which is unrouted (comment at its head; routes.rb has no Api scope), so it is not reachable.
- Match strictness: type and id, both strict string compare. Good.

### m1. Fallback add paths restamp by a client-chosen id (games_controller.rb:3047-3048, 3086-3099)
`ALWAYS_ALLOWED_ITEMS` (`notepad`) and the decor-cup path skip the collectible lookup, so `@collectible_item` is nil and the stored item is the client's hash minus forbidden fields. Restamp then looks up the client's id. It only mints a credential if the scenario author gave a `notepad` or cup-typed item a `credential` (the type check blocks everything else). Nobody does today. Failure scenario: an author puts `credential` on a `notepad` item sitting in a locked room; a client posts `{type:'notepad', id:<that id>}` and holds it without visiting. Fix: validator error when an item with a `credential` has type `notepad` or a decor-cup type, or skip restamp when `@collectible_item` is nil.

### m2. No test for the start-item path or a nested/NPC-held credential item
The restamp in `initialize_player_state` (game.rb:7116) and the lookup into `contents` / `itemsHeld` (credential_model.rb:202-203) have no route-level test; `keyring_take_route_test.rb` covers a room object only. Add one start-item case and one container case. Saves made before this fix hold the item without `credential` and are not repaired; fine while K1 is unreleased, note it if a save ever predates it.

## 2. keyring_take_route_test.rb
It goes through the real route: `POST /break_escape/games/:id/inventory` with `as: :json` and the item as the client sends it (no `credential`), then reads `GET /keyring`. It asserts the stored credential, the keyring listing, and two forgeries (credential on a plain item, a wrong registry id on the real item). `validate_item_collectible` runs for real (scenario has a takeable room object in the unlocked current room). It does not seed player_state with the credential, so it would have failed before the fix. Sound.

## 3. Leak scanner (tools/playtest/lib/access_leak_scanner.rb)

- Capture exemption (lines 742-753, 1229-1241): limited to `GET .../keyring`, a scanner given a game, and entries whose `source` is exactly `capture`; the path is the one entry's `password`. A registry-sourced entry is still flagged (test at access_leak_scanner_test.rb:852-875).
- credential_field (lines 1198-1201): catches the singular `credential` key when its value is a String, at any depth. No server answer legitimately carries that key (the keyring entries use `id`/`kind`; capture `kind: 'credential'` is a value, not a key). A non-string `credential` (hash, array) would slip past; both client filters strip the key whole, so this is theoretical.

### m3. The capture exemption trusts the entry's label, not its value (lines 746-753)
It exempts any password string on a `source: 'capture'` entry. It does not check that the value equals the captured account's own password, or that the capture has been earned (the `/capture_secrets` rule applies the capture proofs). A server bug that put another NPC's password on a capture entry would pass. Fix: exempt only when the value equals the password of the entry's captured account and `@game` holds that capture. Test: a capture entry carrying a different NPC's password is flagged.

## 4. Validator bare-id warning and class rename
- Warning (scripts/validate_scenario.rb, `when 'foothold'`, about lines 7298-7308): prefixed runtime forms pass, bare source ids warn, unknown ids still error. Correct, and `validator-credentials.test.mjs` passes. Trivial: the warning suggests `wifi_<apid>` but the runtime key is `wifi_<network>` (the set is built from `e[:network]`), so the suggestion can be wrong for an AP whose id differs from its network. Reword to say "the network name".
- Rename: `KeyringSyncSizeTest` (test/controllers/break_escape/sync_payload_size_test.rb:11) no longer collides with `SyncPayloadSizeTest` in test/integration/sync_payload_size_test.rb:15. Both files run clean.

## Summary of findings
- m1: fallback add paths (notepad, decor cup) restamp by a client-chosen id; reachable only with an odd authored item. Validator rule or skip.
- m2: no tests for the start-item or nested credential item; pre-fix saves not repaired.
- m3: capture exemption keys on the label, not on the account's own password.
- Trivial: wifi suggestion in the bare-id warning names the wrong key.
