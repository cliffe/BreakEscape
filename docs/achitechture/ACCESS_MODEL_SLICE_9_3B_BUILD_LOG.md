# Access model slice 9.3b build log

Plan: `docs/achitechture/ACCESS_MODEL_SLICE_9_3B_PLAN.md`. Each sub-slice has its own section.
Sub-slices K (links/pivot), O (outages), W (Wi-Fi) and P (port security) are built on their own
branches; this log holds only the section for the sub-slice built here.

## Sub-slice I: implants (branch `build/9-3b-i`, from `main` ecc009d10)

Built on top of 9.3a only (K and O's reach model is not on this branch). An implant grants a
foothold on the target PC's own network through 9.3a's single-network reach, which is exactly
"the PC's own network and nothing else" with no links present. Reused `AccessWork#plant_refused?`
(9.2 U, on main) for the USB hook. `reach_conditions` was not touched (K/O own it).

### What was built

- **Model** (`lib/break_escape/network_model.rb`): `NetworkModel.grant_foothold_actions(data)`, a
  walk that keeps a `grant_foothold` only where `DeclaredGrants.executed?` says the path is
  server-run (the same test the validator uses), returning `{ pc, shape, needs_dropped, needs_held,
  name, path }`. `reach_conditions` left unchanged.
- **Server** (`app/models/break_escape/network_access.rb`): `implant_foothold!(pc_id, shape, path)`
  with the preconditions of 5.5 (action exists by path; already-held before the preconditions; the
  dropped shape reads `droppedItems`; the session shape needs a non-foothold session and the held
  `needsHeld`, which it removes; the USB hook via `plant_refused?`). `link_item_for` branches on
  `via == 'implant'` into `implant_link_item`, reading the `name`/`sprite` stored on the foothold
  record so a reload and the tray are right. New helpers: `implant_foothold_id_for`, `dropped_items`,
  `grant_foothold_action_for`, `inventory_item_matching`, `implant_sprite`.
- **Route and policy**: `POST network/implant` (`config/routes.rb`), `network_implant` controller
  action (locked, in the before_action and `with_game_lock` lists), `network_implant?` policy.
- **Validator** (`scripts/validate_network.rb`): dropped the `grant_foothold` reservation; added the
  path-aware checks (not server-run, neither/both shape, pc not a sign-in host on a network, missing
  or unknown `needsHeld`, the action on the sign-in PC it targets, `consumesItem` on its host, two of
  the same pc and shape) and the USB-policy warning, all reusing `DeclaredGrants.executed?`.
- **Schema** (`scripts/scenario-schema.json`): `grant_foothold` added to the triggerOnInteract action
  `type` enum, with `pc`/`needsDropped`/`needsSession`/`needsHeld`/`name` property docs. Not added to
  the `flagReward` enum (the validator refuses it there).
- **Client**: `ApiClient.networkImplant` (`api-client.js`); the `grant_foothold` case in
  `systems/apply-actions.js` delegating to `networkLinks.implant`; `NetworkLinks.implant(pcId, shape,
  path)` in `systems/network-links.js` (one retry on a network error, syncs the inventory, adds the
  foothold, emits `network_foothold_gained`/`network_device_refused`, opens the view on the first).

### Tests

- Unit: `test/unit/network_model_test.rb` (`grant_foothold_actions` keeps server-run paths, reads the
  shape and needs).
- Rails: `test/controllers/break_escape/network_implants_test.rb` (12 tests: the enumerator; the
  dropped shape; the session shape and its consume; the non-foothold-session rule; the USB refusal;
  the already-held idempotence; reach to the PC's own network only; forged/bad-shape/never-granted
  tampered checks). 12 runs, 46 assertions, 0 failures.
- Validator fixtures: `test/js/validator-network-model.test.mjs` (a clean implant scenario raising no
  error, one fixture per new error, and the USB warning). 38 of 38 pass.
- Client: `test/js/network-links.test.mjs` (4 implant tests: grant and emit, already, usb_refused
  toast, not_ready quiet). 38 of 38 pass.

### Feature scenario and browser proof

`scenarios/test_access_networks` gained beats N11 (dropped), N12 (BadUSB), N13 (USB refusal), with a
`kit_badusb` and a droppable `kit_stick` in the lobby, props `sam_dock`/`kiosk_dock`/`door_dock`, and
a `kiosk_locked` USB-blocking policy. `PLAYTEST.md` documents them; the expected validator output
notes the one deliberate USB warning (N13). Validator: 0 errors.

Browser proof on :3026 through the real `window.__test` bridge (game 1262, :3026, headless, 17/17 checks): picked up both
USB items; signed in at the kiosk and used `kiosk_dock` (N13: refused, no foothold, device kept);
signed in at `sam_pc` and used `sam_dock` (N12: `implant_sam_pc` on `office_lan`, device consumed);
dropped `kit_stick` and used `door_dock` (N11: `implant_door_box` on `office_lan`, no session); the
implant view listed only office hosts/shares; tampered requests (a forged session implant, a non
sign-in target, a never-granted foothold view) all refused; a reload with `?skip_resume=1` kept both
implant footholds with their `via` and network.

Leak scanner (`access-leak-check.rb` over the 39 captured responses): VERDICT no leaks found. The network name appears only in the `$.footholds[*].network.name` of `GET /scenario` for held footholds, which section 7 allows and the scanner exempts.

### Suites

Under the shared lock: `bin/rails test` 1619 runs, 23653 assertions, 0 failures, 0 errors, 1 skip. `bin/test-js -j 3` 493 files passed, 0 failed. Phone reopen check: the 4 problems are all m09 phone ink files, unrelated to this change (no ink/phone code touched).

### Open / not done

- The dungeon graph's implant node (plan 9.3, stream T) is not added here; the generator does not
  error on `grant_foothold` and no shipping scenario uses it. The scenario's `dungeon_graph.*` were
  regenerated to match the new objects.
- No-exposure controller test (`network_no_exposure_test.rb`) was not extended with an implant case;
  the implant's "a foothold and nothing else" and the no-leak of preconditions are covered by
  `network_implants_test.rb` and the live leak scan. Worth adding when K/O land.
