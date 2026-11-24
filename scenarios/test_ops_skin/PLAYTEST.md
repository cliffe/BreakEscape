# test_ops_skin: scripted playtest (stage S6, feature N16)

The feature scenario for the network view's two looks: Panels (`gui`) and the Terminal (`cli`). Run beats T1 to T9 twice in fresh games,
once with `--net-skin gui` and once with `--net-skin cli` (unit 07's flag), and compare the two runs beat for beat. About 30 minutes a run.
Beats name actions and targets, never controls, so one script runs in either look. Aliases, statuses, refusal codes and sentences, sessions,
the keyring entry and the server's record must be equal in the two runs.

The scenario is for testing, not play. No sign, task title or brief names a host, product, version, class or summary: those strings reach
the browser only from `GET /network`, `POST /network/scan`, `/network/check` and `/network/confirm`, and a card's works-on line only once
a card is held. Since unit 23 the scenario has `networkView.defaultSkin: "cli"`, authored `cli` fields (the office range, the file
server's address and service, an open guest network with one camera) and a `realism` link on each finding. The look comes from
`--net-skin`, then the stored pick, then that default (Terminal). Panels draws none of the authored text, so a Panels run proves only that
the authored fields change nothing the Panels look shows or the game records.

**Not played in the browser.** No beat sends a forged, hand-built or replayed request. The request-level checks (the same 404 for a real and an
invented host before the sweep, the refusal codes, the sealed host's sign-in, the unplug) are in
`test/controllers/break_escape/ops_skin_scenario_test.rb`; the leak scanner over a real run is
`test/controllers/break_escape/access_leak_scanner_ops_skin_real_test.rb`.

## Setup

Keyless server on a free port (never :3000, :3001, :3002, :3085 or :3086), started from `/data/be-ops-skin`. The scenario has no Mission row,
so make each game with `swap-scenario-game.rb` (host scenario `test_access_signin`); do not use `new-game.sh`.

```bash
export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6
tools/playtest/start-keyless-server.sh
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/swap-scenario-game.rb test_access_signin test_ops_skin   # prints GAME_ID=
S=<scratchpad>/test_ops_skin
tools/playtest/session-start.sh --url <URL> --headless --net-skin <gui|cli> \
  --log $S/session-<game_id>.jsonl --capture-responses $S/responses-<game_id>.jsonl
tools/playtest/cmd.sh <game_id> '{"cmd":"bootstrap","tutorial":"decline","resume":"new"}'
```

After every beat read the screen (`network.state()`, `network.log()`, `getTestState()`) and the server's record:

```bash
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id> --access
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id> --ops-log
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/access-leak-check.rb <game_id> $S/responses-<game_id>.jsonl
```

`--access` prints the `opsDiscovered`, `opsFindings` and `opsUsed` lines and each session with its level and the finding that granted it;
`--ops-log` prints the `network_audit` rows. The leak check must report no leaks after every beat.

## Layout

Lobby (start): the drop box (`kit_dropbox`), the office wall port (`office_port`), the cabinet by the door (`lobby_cabinet`, holds both field notes),
a sign and Ian. The comms room (north): the file server `files01` and the records server `records01`. Two networks: `office_lan` (discovery by sweep) and the open guest network `guest_lan` (below).
Two resources on `office_lan`: the open share `office_drop` and the printer `floor_printer`. Both servers sign in as Ian (`iokafor`; the password is on
Ian's own record, not on a sign). Take both notes from the cabinet before T5.
`guest_lan` (range 10.40.0.0/28, linked to the office network) holds one camera, `guest_cam01`. It is listed only after
T7's session on `files01`, which pivots to it. The validator gives one warning for this scenario (the guest camera runs a service and nothing on that network has a weakness): the camera is scenery by design, so the scenario validates with 0 errors and that 1 warning.

## Ids for the tester and units 19, 23 and 25

| Thing | Id |
|---|---|
| Game | `swap-scenario-game.rb test_access_signin test_ops_skin` |
| Jack, foothold | `office_port`, `jack_office_port` |
| Network | `office_lan` |
| Hosts | `files01` (file server, remote sign-in allowed), `records01` (remote sign-in blocked) |
| Service | `files01` service `storage` |
| Findings (server aliases come from the answers) | `files01.storage.entry_a` (grants a user session), `entry_b` (the decoy, false), `entry_c` (grants the saved connection `file_link`) |
| Cards | `card_update` (technique `update_notes`, fits `entry_a`), `card_settings` (technique `settings_review`, fits `entry_b` and `entry_c`) |
| Resources | `office_drop` (open share), `floor_printer` |
| Open network | `guest_lan`, host `guest_cam01` (service `stream`); reached only through the session on `files01` |
| Authored text (Terminal only) | office range `10.20.0.0/24`; `files01` address `10.20.0.10`; its `storage` service word `filehold` with a banner naming Tarnwick FileHold 4.2; guest range `10.40.0.0/28`, camera address `10.40.0.4` |
| Realism links | `entry_a` links `filehold_update_lag`, `entry_b` (the decoy) `filehold_release_line`, `entry_c` `filehold_link_setting` |

## Beats

| Beat | Action | Panels shows | Terminal shows | `verify-run.rb` prints |
|---|---|---|---|---|
| T1 | Take the drop box and plug it into the office port. | The view opens with the header switch; the office block lists no host and offers the sweep. | The same, as a prompt whose log holds only the opening line ("Type help, or pick a command below."); the block lists no host. | A foothold at `jack_office_port`; no `opsDiscovered`, no audit rows. |
| T2 | Terminal run only, before any sweep: type a verb with a typo; scan an invented host id; scan `files01`; use the read-targets-from-a-file form. | (Panels run: skip.) | The nearest verb offered; the invented id and `files01` print the SAME unlisted-target answer; the file form prints its answer. | Unchanged; no request is sent. |
| T3 | Sweep the office network (Terminal: with one unknown flag, which prints one "Ignored" note and sweeps). Scan `files01`. Terminal run only: sign in on `records01`. | The Scanning bar while the request is out, then four rows (two servers, the share, the printer); `files01` shows its service after the scan. | The start lines, then the report; the sign-in on `records01` prints the status sentence its Panels row shows. | `opsDiscovered` holds the network and `files01`; audit rows `network_swept`, `host_scanned`; no request for the typed sign-in. |
| T4 | Check the `storage` service. Confirm the first real finding and the decoy. Leave the third unconfirmed. Terminal run only: a mistyped confirm. | Three findings under the server's aliases, each offering Confirm; the decoy settles as false with its reason. | The same aliases and statuses in the check report and in `show`; a mistyped confirm sends nothing. | `opsFindings`: two settled, one not; two `finding_confirmed` rows. |
| T5 | Take both notes. Use the settings note on the decoy, then on the unconfirmed finding. Confirm that finding. | Refusals `false_positive` and `not_confirmed` as notice lines. | The same codes and sentences. | Two `technique_refused` rows; `opsUsed` empty; all three settled after the confirm. |
| T6 | Switch look, check, switch back. | The same hosts, service, findings (same aliases and statuses) and cards in the other look. | As Panels. | Unchanged; no request is sent. |
| T7 | Use the update note on its finding (Panels: select, then Use; Terminal: at the framework prompt, ending in the session line). Use the settings note on the remaining finding (Panels: drag; Terminal: the quick commands). | A user session on `files01` with the compromised mark (`compromiseMarks()`); a keyring entry. | The same session line and mark. | One session on `files01` at level user, via `technique`, granted by `entry_a`; `opsUsed` holds both; the keyring has `file_link`; two `technique_used` rows. |
| T8 | Open the share; look at the printer. | The share's file and the printer's text. | The same. | Unchanged apart from the share being opened. |
| T9 | Unplug. | The view closes; the mark clears. | The same. | No foothold; the session on `files01` ended; `opsUsed` and the keyring entry stay. |

Objectives tick in order: sweep, scan, check, confirm, use.

## K3 beats: the authored fields and the default look

D1 is run once, in its own fresh game and a fresh browser profile, with NO `--net-skin` value and no stored pick. The K3 checks are read in
the Terminal run of T1 to T9 (and compared with the Panels run).

| Beat | Action | Terminal shows | Panels shows | Server record |
|---|---|---|---|---|
| D1 | Fresh profile, no URL value. Plant the box and open the view. Press the header switch once. Reload. | The view opens in the Terminal (the scenario default). One press of the switch gives Panels and is stored; after the reload it opens in Panels. | The same rows and statuses as the Terminal had. | No request names a skin; unchanged by the switch. |
| K3a | At the first view, before the sweep. | The office range `10.20.0.0/24` in the sweep's start lines when the sweep runs; no host address, banner or finding text yet. | Nothing authored. | Foothold only. |
| K3b | After the sweep. | `files01` printed with `10.20.0.10`; the printer, share and `records01` print their default lines. The camera and the guest range are NOT shown. | The same four rows, no address. | `opsDiscovered` holds the network. |
| K3c | After the scan of `files01`. | The service line with the word `filehold` and its banner naming the product and version. No advisory or output line yet. | The service tile as before. | `files01` scanned. |
| K3d | After the check. | A version scan table, then (script scan) each finding's title and an `IDs:` line and its output lines; the decoy prints the same number of lines as the two weaknesses. At the framework prompt `search`, `info` and `use` print each finding's module and references before any confirm, the decoy and the weaknesses alike. | Three findings under the server's aliases, no extra text. | Three findings, unconfirmed. |
| K3e | After T7's session on `files01`. | The guest network is listed with its range; its camera shows `10.40.0.4` (the open network lists its host without a sweep). | The same block and row, no address. | One session on `files01`; no extra scan row for the guest network. |

After the run, give the leak scanner the captured responses (`access-leak-check.rb`): it must report no leak, and no answer may hold a link id
(`filehold_update_lag`, `filehold_release_line`, `filehold_link_setting`), the key `realism`, or the text of any catalog entry no finding links.
The request-level serving checks are in `test/controllers/break_escape/network_realism_link_test.rb`; the stages are also pinned in
`access_leak_scanner_ops_skin_real_test.rb`.

## Switch beats (once, with no `--net-skin`, on `test_ops_scan`) and reruns

W1 to W3 and the reruns of the older scenarios with a stored Terminal pick are the S6 brief's section 7; they use `test_ops_scan`
and `test_access_networks`, not this scenario.
