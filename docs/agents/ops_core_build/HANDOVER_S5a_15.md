# Handover S5a unit 15: the feature scenario `test_ops_privilege`

Done. Files: `scenarios/test_ops_privilege/` (`scenario.json.erb`, `mission.json`, `PLAYTEST.md`, `ink/{olu,uma,adel}.{ink,json}` one-line stubs, `dungeon_graph.{json,md,html}`),
`test/controllers/break_escape/ops_privilege_scenario_test.rb` (21 tests, 1152 assertions with the other file), `ops_privilege_no_exposure_test.rb` (5 tests). No engine file edited.

## Layout
`lobby` (drop box, `office_port` jack, cabinet with `card_stale` and `assist_code`), `bay` (`bay_pc` owned by `olu`, USB `blocked`, `offWhen: bay_off`; `bay_dock` BadUSB socket, grant in a confirm naming `bay_pc`;
`bay_port` governed stick port, `remove_item` first in a confirm; `bay_breaker`; `kit_badusb`, `kit_stick_a`, `kit_stick_b`), `store` (`store_pc` desk PC with one service and the step-up weakness `stale_build`;
two login notes; `uma` user, `adel` with `creds.admin`). Profiles `uma_files`, `adel_files`, `olu_files` (top-level file plus a folder `olu_folder`, `locked: false`). Credentials `adel_token` (token, 4 min, foothold proof) and
`uma_assist` (assist invite, so `store_pc` has a screen). Log source `priv_audit`.

## Validator
0 errors, 2 warnings (both intended, explained in PLAYTEST.md): owner `olu` has no needs so never leaves (`bay_pc`); the implant grant targets a PC whose USB policy refuses `hid` (true for all but a keyboard admin).
`check_privilege` gives nothing. Graph has `admin@bay_pc` and `admin@store_pc`. `check_mapping_index_drift` passes (no eventMappings).

## Tests (run under the lock)
Scenario test 21/0, no-exposure 5/0 (26 runs, 1152 assertions). Node `dungeon-graph-*` (10 files), `validator-privilege`, `ops-unchanged-validator` pass. `bin/ops-golden-compare` 16 runs 0 failures, nothing re-recorded. Rubocop clean on both test files.
Covered through real routes on the real file: user vs admin desktop and profile folder, one `admin_profile_read` row and none on reopen or for the owner, other PC gives nothing; BadUSB refused (user), accepted under keyboard admin with one
`usb_install_overridden` row, refused locked, `needs_console` remote, `not_ready` after token expiry (`travel_to`), refused after the power global; stick port refused for user and admin, nothing recorded; step up from a typed user session, relay
does not step up, a hand-set claim does (technique record, not keyboard admin); unearned requests write nothing; re-read game; no-exposure at each step; forged sync body; stored `access` on a password record ignored.

## Engine/design findings (not fixed)
1. **A stick refused by policy can never be accepted for a remote admin or a keyboard admin in a validator-clean scenario.** `CapturePlant#plant_admin_pc` (`app/models/break_escape/capture_proofs.rb:186-191`) names the override PC only for an object with a `needsSession` grant or a sign-in PC; `scripts/validate_scenario.rb:8301` makes `triggerOnInteract` on a sign-in PC an error, and one grant per [pc, shape] leaves the one session socket to the BadUSB. So plan beats 5 and 8 (remote admin plants a stick; token admin lapses before a plant) have no browser path. The Rails tests make them on a copy where `bay_pc` gets `requiresItem` + `triggerOnInteract` (`with_pc_stick_target`). Question for the orchestrator: allow a stick-taking sign-in PC in the validator, or accept this and make the stick port overridable another way.
2. `bay_port` (governed, no grant) is refused for every session, admin or not: correct by the code, shown in beat 3.
3. Unit 07's finding on the `accountProfiles` 41-character id stays open (not in my files).

## Gotchas for the playtester
- Passwords come from `note_uma` and `note_adel` in `store`; the admin one is the only place the admin password appears in an answer (the room answer for `store`). The leak scanner may flag `access: admin` until unit 16 lands.
- `plant`, `office_port` and the sockets ask first: `dismiss` "Plug it in". One session per PC: a remote sign-in and a keyboard sign-in displace each other.
- Token expiry is 4 game minutes from the first foothold-gain; the browser beat is optional and the server read is the proof.
- The `verify-run` level words arrive with unit 16.
- Beats named in PLAYTEST.md that carry an "expect" about toast wording come from the Rails answers (`USB devices are disabled on this PC.`, `Nobody is signed in at this keyboard.`); no browser has run this.
