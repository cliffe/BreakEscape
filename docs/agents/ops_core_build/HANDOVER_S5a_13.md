# Handover S5a unit 13: schema and validator

Done. Files: `scripts/scenario-schema.json` (one line, `creds.properties.admin`, boolean, before `card`), `scripts/validate_privilege.rb` (new, `check_privilege`), `scripts/validate_scenario.rb` (one `require_relative` after `validate_network_ops`, one `run.call('check_privilege')` after `check_network_ops`), `test/js/validator-privilege.test.mjs` (17 tests).

## Warning and error texts (for unit 17)
All lines start `⚠️ WARNING: privilege: ` or `❌ ERROR: privilege: `.
- (a) `sign-in PC '<pc>': profiles '<A>' and '<B>' both hold a top-level item named '<name>', and they meet on this PC only in an admin session by '<npc>'. Rename one so the admin desktop does not show two of them.` Fires when the PC's `owner` is admitted by A, an admin account (a `creds.admin: true` account the PC admits, or the `grants.session` account of an `access: "admin"` weakness on that PC) is admitted by B, no profile admits both, and A and B hold an item of the same (trimmed, case-folded) name. Name is lower-cased in the message.
- (b) `<path> (<id>): a remove_item that is not the first action of its list on a USB-governed object. ...Put the remove_item first.` One per list (top level and each `confirm_action` `onConfirm`). Governed = `AccessWork.usb_governed?`.
- (c) `<path> (<id>): its needsSession grants name more than one PC (a, b). The engine judges only the first, 'a'.`
- Not built (errors): `<where>: "cachedAccounts" is not built yet (privilege plan stage S5b)`; `credentials/<id>: "harvested" is not built yet (... S5b)`; `<npc path>: creds."accountKind" | creds."localTo" | creds."domain" is not built yet (... S5c)`; `<npc path>: "accountOnly" is not built yet (... S5c)` (room NPCs, top-level `npcs`, `phoneNPCs`); `<object path>: "domain" is not built yet (... S5c)` on a sign-in PC.

## Notes
- The (c) walk is local to the validator (it needs every grant, not the first), so it does not call `CaptureModel.session_grant_pc` (unit 04's); it follows the same rule (depth-first, `confirm_action` `onConfirm`, a `condition` still counts).
- Schema stays closed to the S5b/S5c fields; only `creds.admin` added.
- Proof run: `validator-privilege` 17/17; `ops-unchanged-validator` and `validator-network-ops` pass unmodified; `test/unit/scenario_schema_test.rb` 10 runs 0 failures; `bin/ops-golden-compare` 16 runs 0 failures; rubocop clean on `validate_privilege.rb`.
