# Handover L3 part B (scenario rows, tests, playtest beats, docs): DONE

## Added
- `scenarios/test_ops_logs/scenario.json.erb`: `networks` (`office_lan`, `guest_wifi` with SSID and key), `resources.scanned_inbox` (share on `office_lan`, a note and an unlocked folder `inbox_letters` "Letters" with one file), a `comms_room` north of the lobby (not locked, `network: office_lan`) with jack `comms_port` and reader `net_log_pc`, and in the lobby `kit_dropbox` (device), `guest_ap` and `wifi_note` (the key). One new source `network_log` (`net_*`, `share_*`, `where.places` `jack:comms_port`, `ap:guest_ap`, `share:scanned_inbox`; no prefix warning). Validator: 0 errors, the one old `maxAttempts` warning. Graph files regenerated and committed.
- `test/controllers/break_escape/ops_logs_scenario_test.rb`: 23 runs, 304 assertions (5 L3 tests added to the 18 earlier). L3 tests: reader open and empty; plant, unplug, replant, wrong key, join, share open, folder open read back from `/log_rows` with shown text (`OK x2` on the merged plant, `-` identity, `Spare wall port`, `Guest access point`, `Scanned-Inbox`, `folder: Letters`); repeat opens write and save nothing; card copy writes no net row; cross-source isolation both ways; leak scanner over a whole run (plant, view, share, folder, log answer).
- Edited earlier assertions: (1) the first test's `logSources.keys` list now includes `network_log`; (2) `build` puts `comms_room` in the default `unlockedRooms` (a helper change; a player's open room is listed once entered). Nothing else changed.
- `tools/playtest/lib/access_leak_scanner.rb` + `test/unit/access_leak_scanner_log_rows_test.rb` (+1 test): the leak check DID flag a share's name in a `/log_rows` LOCATION cell (`network_string`, `resource:<id>`). Now a cell `rows[n].where` equal to a resource's own `name` is allowed (the row exists only after an admitted open); host, observations and network names, and the name in any other cell, are still findings. `scan_network_strings` and new `share_name?`.
- `PLAYTEST.md`: beats 20 to 27 and L3 gotchas (title line updated).
- Docs: `docs/ACCESS_AND_NETWORKS.md` new section "A24 Ops log: network and share rows", index row, and the read-side "Known limits" line; `README_scenario_design.md` index row.

## Not done
- An implant writes no row: asserted in part A's tests (`network_log_rows_test.rb`), not here, because the scenario has no USB device. A card copy is asserted here.
- No browser run (a separate tester does beats 20 to 27). The folder icon click, the exact count wording and the share name's appearance in the view are unverified in a browser.

## Gotchas for the tester
- A replant merges into the first `NET_LINK_UP` row (`OK x2`); beats expect five rows, not six.
- The guest network has no share, so the view after the join is empty.
- Open `Plug it in` with a dismiss label; the plant prompt is a `gameConfirm`.
- Leak check: name every capture file, oldest first.
