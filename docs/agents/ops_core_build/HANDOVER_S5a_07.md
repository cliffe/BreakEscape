# Handover S5a unit 07: the controller (`games_controller.rb`)

Done. Files: `app/controllers/break_escape/games_controller.rb`, `test/controllers/break_escape/privilege_inventory_remove_test.rb` (10 tests), `test/controllers/break_escape/privilege_profile_read_test.rb` (9 tests). No route, policy or lock-list change.

## Answer shapes that changed or were added (for units 10, 11 and 16)
1. `POST /inventory` `action_type: 'remove'` with `used_on` present, when `Game#plant_policy_refusal(item_id, used_on)` answers a line:
   `422 { "success": false, "reason": "usb_refused", "error": "<policy line>" }` (exactly those three keys; no `message`). Nothing is removed or recorded. Lines are `NetworkAccess::USB_REFUSAL_LINES` (e.g. "USB devices are disabled on this PC.", "USB storage is disabled on this PC."). Every other remove (no `used_on`, hideable item, item not held, forged item, object that does not take the item, policy accepts, admin override live) answers `200 { success: true }` as before. A retry of a processed gated remove answers 200 and records nothing more. This is stricter than before for a USER session at a blocked PC (was a silent 200 that removed the item): the client sends no such remove after `plantRefusal`.
2. `GET /container/:id` of a folder in an account profile: the body is unchanged. Side effect only: one `admin_profile_read` row (see below).

## The log row
- Written in `#container` by private `record_admin_profile_read(located)`, after `container_reach_refusal` passed, only when the scope is `profile`, and only when `@game.admin_profile_reader(profile_id)` answers (nil when any live session's own identity is admitted by the profile, so an owner's own read, or an owner session alongside the admin one, writes nothing).
- `write_log_row!('admin_profile_read', as: { account: <username> }, where: { kind: 'pc', id: pc_id }, detail: { 'profile' => id }, once: true)`; `@game.save!` only when `row&.stored?`. `once` returns nil for a repeat, so a repeating client causes no further saves (test counts UPDATEs on the games table: 1 then 0). Row holds an account name, PC id and profile id only (test asserts neither password nor item text appears).
- Not written by `GET /log_rows`, `render_login_desktop`, a refused open (locked admin session, unknown id) or a scenario with no `logSources` (no save).
- Guard added beyond the brief: a profile id not matching `OpsLogEvents::ID_PATTERN` (over 40 characters) writes no row and the read still succeeds (the helper would raise in test and development).

## Findings and questions
1. **capture_proofs_test.rb:75** (helper `remove`, `assert_response :success`) now fails for the test at `:221` ("a plant the PC's USB policy refuses is never recorded") because its refused plant now answers 422 `usb_refused` (brief section 4 item 2/4). Not edited (not mine). One-line fix for its owner: in the helper, replace `assert_response :success, response.body` with `assert_includes [200, 422], response.status, response.body` (the test's own `assert_equal [], planted` assertions stay valid). That is the only failure in 601 runs of the related controller files.
2. **The brief's claim that the validator already refuses a 41-character profile id is wrong.** `scripts/validate_log_rows.rb` `log_stored_id_names` covers `rooms`, `networks`, `resources` keys and ids inside rooms/resources only, not `accountProfiles` keys. I verified with a scenario holding `logSources` and a 41-character profile id: no error. The controller guard above makes it safe at runtime; the validator should gain `accountProfiles` keys in `log_stored_id_names` (unit 13 owns validate_scenario, `validate_log_rows.rb` is nobody's in S5a: orchestrator to rule). My test pins the runtime behaviour instead.
3. `ops_account_as` is private on `Game`, so the controller builds `{ account: username }` itself from the reader's NPC `creds.username`.

## Proof run
- New files: 19 runs, 141+ assertions, 0 failures (remove 10, profile 9).
- Related controller files (capture_proofs, log_rows, access_model_desktop/login/rfid, keyring_folder_route, hide_device_controller, games_controller, npc_container_unlock, inventory_canonical_item, lab_plant_hiding, usb_habit, network_implants, ops_access_scenario, credential_from_route, add_object_key_forge, reload_persistence, network_shares, game_state_locking, authorization, network_inventory_delta, demo_access_tour_devices, network_technique_session): 601 runs, 1 failure (item 1 above).
- `bin/ops-golden-compare` 16 runs 0 failures, nothing re-recorded. Node `ops-unchanged-validator` passes. Rubocop clean on the three files.
