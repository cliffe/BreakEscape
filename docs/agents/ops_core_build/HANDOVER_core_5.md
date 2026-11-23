# Handover core step 5 (S1, N13): the feature scenario, tooling and docs. Done

Branch `ops-core`. No engine file under `app/`, `lib/break_escape/` or `public/` was touched.

## The scenario `scenarios/test_ops_scan/`
Files: `scenario.json.erb`, `mission.json`, `ink/ian.ink` + `ian.json`, `PLAYTEST.md`, `dungeon_graph.{html,json,md}`.
- Networks: `guest_lan` (open), `office_lan` (discovery), `plant_lan` (discovery); link `office_lan` - `plant_lan`.
- `lobby` (start): `kit_dropbox` (the one box), jacks `guest_port` (network `guest_lan`, foothold `jack_guest_port`) and `office_port`
  (`office_lan`, foothold `jack_office_port`), `guest_kiosk` (sign-in PC on `guest_lan`, one service), wall switch `camrec_switch`
  (sets global `camrec_off`), note `it_note` (Ian's sign-in `iokafor` / `Dockyard-Ian-41`), sign, NPC `ian` (role it, owns the
  account; his `eventMappings` complete the three tasks `s1_sweep_office`, `s2_scan_printer`, `s3_sweep_plant`).
- `comms_room` (north, open, network `office_lan`): `files01` (headless sign-in, one service). `back_office` (east, PIN door nobody is
  given, never entered): `desk01` (sign-in PC, tiles, one service).
- `hosts`: `printer01` (2 services) and `camrec01` (1 service, `offWhen: camrec_off`) on `office_lan`; `doorctl01` (2 services) on
  `plant_lan`. Share `office_drop` on `office_lan`. Log source `network_audit` (`network_swept`, `host_scanned`, no `where`). Policy
  `managed` = `remote: allowed`. No `weaknesses`, `decoys`, `techniques` or `cli`.
- Game: `env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/swap-scenario-game.rb test_access_signin test_ops_scan`
  (prints `GAME_ID=`; the scenario has no Mission row until seeded).
- Validator: 0 errors, 1 warning: `guest_kiosk` runs services on the open network `guest_lan` with no weakness (scenery). Intended: S1 has
  no weakness and the open-network scan beat needs a service.

## Departures from the plan's beat table
- A sweep of `office_lan` lists FIVE rows (two devices, two PCs and the share `office_drop`), not four: the plan's beat 2 names an open
  share on `office_lan`, and a share is a row after the sweep.
- Beat 2b (sign-in by name before the sweep, the 11.5 beat) is a separate short game in PLAYTEST.md, so beat 6 keeps its unswept `plant_lan`.
- Only `opsDiscovered` joins `ACCESS_KEYS` in `verify-run.rb`: `opsFindings` and `opsUsed` do not exist until S2 and S3 (the plan's three names
  and the session line's `access`/`technique` keys are theirs). `--access` and `--ops-log` are two runs of the script (it takes one at a time).
- Leak collector: the `check`, `confirm`, `card held` and `never` tags (S2, S3) and the realism catalogue strings are not built. `cli` strings
  are collected from any scenario that carries them (the schema does not declare `cli`; tests merge the fixture overlay).
- `scripts/generate_dungeon_graph.rb`: 9.3 gives S1 two things and both are built (the "(sweep to list)" line, `host_<id>` container with
  an `exposes` edge from its network). Nothing else (no weakness, card or grant nodes).

## Validator edits (`scripts/validate_network.rb`, plan 9.2)
- `carries` also counts `hosts_on` (devices); `host_on` does not (a device opens no pivot). Test: `validator-network-model.test.mjs`
  "a device-only network ..." (fails without the edit: checked).
- Two hosts with one label: sign-in objects as before (message unchanged for a pure sign-in clash) plus `hosts` devices by `name`; the message
  says "hosts" instead of "sign-in objects" when a device is in the list. Test "a hosts device (N13) shares a host label ...".
- `NETWORK_OPS_BUILT`: N13 true (`scripts/validate_network_ops.rb:25`); the node test now pins `{N13:true, N14:false, N15:false}`.
- `ops-unchanged-validator` and `pretext-verdicts-unchanged` pass WITHOUT re-record.

## Leak scanner (`tools/playtest/lib/access_leak_scanner.rb`)
`collect_ops_secrets` (+ `add_ops_string`, `collect_ops_services`, `ops_service_words`), `note_ops_steps`, `scan_ops_strings`; rule `ops_string`;
`scan(lines, ops_steps: nil)` takes extra earned steps (`sweep:<net>`, `scan:<host>`, `listed:<net|host>`, `held:<host>`); earned steps are
otherwise read from the log in order (a POST `/network/scan` answer; a GET `/network` answer's blocks and rows; a pc row with `session`).
`services` was added to `WITHHELD_ROOM_KEYS` (room data never carries it, so a service string is not "public room text"). A string several
hosts share (a version) is clear once any owner is earned. Two scanner details: sweep strings leak anywhere before their sweep; `listed` strings leak
in any non-/network answer, even after earning.

## Tests (all run under the lock; counts)
- `test/unit/access_leak_scanner_ops_test.rb` 14; `test/models/break_escape/ops_discovered_verify_run_test.rb` 4;
  `test/controllers/break_escape/ops_scan_scenario_test.rb` 14 (the real scenario, beats 1 to 11, a re-read game each time; beat 11 feeds the
  real answers through the scanner and checks a premature listing is a finding).
- Node: `validator-network-ops`, `validator-declared-top-level`, `ops-unchanged-validator`, `pretext-verdicts-unchanged`,
  `validator-network-model` (+2), `dungeon-graph-ops-hosts` (new, 3), `dungeon-graph-networks`, `lock-key-diff` pass.

## Gotchas for the playtester
- One drop box only: unplug before planting in the other jack. The scan beats read `getTestState().rows[].scan` and `ownNetwork.sweep`
  (selectors named by the state; absent means not offered).
- `access_leak_scanner` finds a host name before its sweep only where the string is not public room text; PC names and `host` labels of sign-in
  objects are in room data, so only devices, addresses, shares and service strings are checked by name.
- No engine bug found.
