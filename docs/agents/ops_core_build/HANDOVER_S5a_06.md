# Handover S5a unit 06: the USB override on the server

Done. Files: `app/models/break_escape/network_access.rb`, `app/models/break_escape/capture_proofs.rb`, `test/models/break_escape/admin_usb_test.rb` (new, 15 tests, 119 assertions), and two assertions (below).

## What was built
- Implant path (`network_access.rb`, session shape): a record with a present `foothold` or a `remote_route_session?` answers `422 needs_console` ("Nobody is signed in at this keyboard.", constant `IMPLANT_NEEDS_CONSOLE`, helper `implant_needs_console`) when `session_access(pc_id)` is not nil; otherwise the old `not_ready`. Refused before the device is copied. The policy call passes `admin: keyboard_admin?(pc_id)`; when the override let a refused device through, `usb_install_overridden` is written (`as` the session account, `where` pc, detail `device` = usbClass), saved by the path's own `save!`.
- `capture_proofs.rb`: private `plant_target_for` (the early returns shared by both methods), `plant_admin_pc(obj)` (first `needsSession` grant pc, else the object when a sign-in PC), `keyboard_or_session_admin?`, `plant_admin?`, `write_usb_override_row!`. `record_planted_item!` passes `admin: plant_admin?` and writes the row before its `save!` when the override mattered. Public `plant_policy_refusal(item_id, used_on)` answers a String line (`NetworkAccess::USB_REFUSAL_LINES`) or nil; writes nothing.

## For unit 07
`@game.plant_policy_refusal(item['id'], used_on)` returns a String line or nil. It judges exactly what the plant proof judges before the room check.

## Existing assertions changed (M26)
- `test/controllers/break_escape/network_technique_session_test.rb:110` `'not_ready'` to `'needs_console'` (live technique session).
- `test/controllers/break_escape/demo_access_tour_devices_test.rb:341` same (live foothold session).
- `network_implants_test.rb:116` NOT changed: it still passes because its session names a foothold (`jack_comms_port`) that is not in `footholds`, so the route is down, `session_access` is nil and the answer stays `not_ready` (open item 3 of the brief: only a live session gets the toast).

## Proof
admin_usb_test 15/0; with capture_record, hide_device, network_withholding, ops_access_scenario, the two changed files, network_implants, capture_proofs (controller): 187 runs 0 failures; credential_sessions, network_technique_hostile, credential_token, demo_access_tour(_tasks), network_link_names, network_no_exposure, network_ops_unchanged: 163 runs 0 failures. `bin/ops-golden-compare` 16 runs 0 failures, nothing re-recorded. Node `ops-unchanged-validator` passes. Rubocop clean on all Ruby files touched.

## Gotchas
- `plant_policy_refusal` and `record_planted_item!` refer to `NetworkAccess::USB_REFUSAL_LINES` by full name (the constant is not visible lexically from `CaptureProofs`).
- The implant path's override row uses `session['id']` (account npc id) through `ops_account_as`.
