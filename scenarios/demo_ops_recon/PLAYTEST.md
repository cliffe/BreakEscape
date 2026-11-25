# demo_ops_recon: scripted playtest ("What's on the network?")

A demo scenario (15 minutes): a working day at Merrin & Sallow, in which the player plugs a drop box in at the hot desk, lists and scans what answers on the office network, tests which reported weaknesses are real, uses technique cards, and reads their own trail in the network log. The plan is `docs/agents/ops_core_build/SHOWCASE_PLAN.md` section 5; the beats R1 to R8 below are its table 5.4. Three runs (A morning, B midday, C evening), each 10 to 15 minutes, in one game or in three fresh ones. Run B ends with a reload check and the Terminal-lasts check.

The request-level checks (the same 404 for a real and an invented host before the sweep, every refusal code, the share refused before the admin session and served after it, the log rows, the unplug) are in `test/controllers/break_escape/demo_ops_recon_scenario_test.rb`, and the leak scanner over a whole run is its last test. This script plays only what a player can click. It sends no forged or replayed request.

No password appears in this file. Nothing in a run needs one: the file server and Agnieszka's PC are reached by cards and the saved connection, and the player never types a password. Where a beat shows a secret, it says where in the game to read it.

## Setup

Keyless server on a free port (never :3000, :3001, :3002, :3085 or :3086; for a Haiku run on the plan's :3001, use the port the orchestrator names). Make each game with `swap-scenario-game.rb` (host scenario `test_access_signin`), not `new-game.sh`: the scenario has no Mission row.

```bash
export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6
tools/playtest/start-keyless-server.sh
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/swap-scenario-game.rb test_access_signin demo_ops_recon   # prints GAME_ID=
S=<scratchpad>/demo_ops_recon
tools/playtest/session-start.sh --url <URL> --headless --net-skin gui \
  --log $S/session-<game_id>.jsonl --capture-responses $S/responses-<game_id>.jsonl
tools/playtest/cmd.sh <game_id> '{"cmd":"bootstrap","tutorial":"decline","resume":"new"}'
tools/playtest/cmd.sh <game_id> '{"cmd":"eval","fn":"() => window.__test.throttleFps(20)"}'
```

Start in the office. The three other rooms are open (no locks). After every beat read the server's record and the leak check; the leak check must report nothing after every beat. A session resumed in a new browser writes a new capture file: give the leak check every capture file of the game, oldest first, named one by one (never a glob).

```bash
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id> --access
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id> --ops-log
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/access-leak-check.rb <game_id> $S/responses-<game_id>.jsonl
```

Take a screenshot at every beat and write each finding as the run goes.

## Layout

```
                 [server_room]
                       |
 [kitchen] ------- [office] ------- [it_room]
```

| Room | What matters | Ids |
|---|---|---|
| `office` (start) | Ama (host); Chidi, Jun (hot desk), Agnieszka; the hot-desk wall socket; the printer and its wall socket; the printer cupboard (unlocked, one card); the office coffee machine and its wall socket; the notice board | `ama_owusu`, `hotdesk_jack`, `office_printer`, `printer_socket`, `printer_cupboard`, `office_coffee`, `office_coffee_socket`, `tour_notice`, `agnieszka_pc` |
| `kitchen` | the second wall socket (the one the seed log rows name), fridge, microwave, kitchen coffee, water cooler | `kitchen_jack`, `kitchen_coffee`, `water_cooler` |
| `server_room` | the file server (no screen; it only appears in the network view), the camera, Zainab, her tool roll (unlocked, one card) | `file_server`, `zainab_hussain`, `zainab_tool_roll` |
| `it_room` | Graham, his PC, the network log PC | `graham_whitfield`, `graham_pc`, `network_log_pc` |

Network: `office_lan` (discovery by sweep). Foothold id after plugging in at the hot desk: `jack_hotdesk_jack`. The printer is host `printer_host` (services `print`, `admin_page`); the camera is `lobby_camera` (service `stream`); the file server is `file_server` (service `storage`); there are four sign-in PCs as rows (`chidi_pc`, `jun_pc`, `agnieszka_pc`, `graham_pc`). The shared drive is the resource `shared_drive`.

Findings (ids are `<host>.<service>.<id>`; read the aliases on screen): `printer_host.admin_page.factory_login` (real, a saved connection to Agnieszka's PC), `printer_host.admin_page.old_build` (false), `file_server.storage.update_lag` (real, a user session as Agnieszka), `file_server.storage.link_setting` (real, needs that user session, an admin session as Graham), `file_server.storage.release_line` (false), and a camera decoy.

Cards: "Factory accounts" (printer cupboard; fits default accounts), "Known update gap" (held by Zainab; fits the file server's update finding), "Left-open settings" (Zainab's tool roll; fits `link_setting`).

Log: source `network_log`, three seed rows 07:10, 07:12, 07:14, all from the kitchen socket; the 07:12 row (the sweep) is the odd one out.

## Harness notes

- **Talk.** `{"cmd":"moveToNear","id":"ama_owusu"}`, `{"cmd":"interact","id":"ama_owusu"}`, then `{"cmd":"mg","action":"chooseMatching","args":["Send them for coffee"]}`. Close with `{"cmd":"mg","action":"close"}` or the exit choice.
- **The jack asks first.** Answer the plug prompt with `{"cmd":"dismiss","label":"Plug it in"}`. Take the drop box first: it is in the start inventory (read it from `getState().inventory`, id `kit_dropbox`); use it on the jack with `moveToNear` and `interact` on `hotdesk_jack`.
- **The view** is the `network-view` minigame: `{"cmd":"mg","action":"getState"}`, or `window.__test.network.state()`. Use `window.__test.network.run(offer)` for any sweep, scan, check or confirm, `network.setSkin("cli")` for the header switch, `network.log()` to read the Terminal, `network.type(line)` to type. The selectors of `test_ops_access/PLAYTEST.md` (Harness notes) hold: Sweep `[data-network-id="office_lan"] [data-action="sweep"]`; Scan `[data-host-id="<id>"] [data-action="scan"]`; Check `[data-host-id="<id>"] [data-service="<name>"] [data-action="check"]`; Confirm `[data-finding="<alias>"] [data-action="confirm"]`; card `[data-technique="<card id>"] [data-action="select-technique"]`; finding `[data-finding="<alias>"] [data-action="select-finding"]`; Use `[data-techniques] [data-action="use"]`; the share's Open `[data-resource-id="shared_drive"] [data-action="open"]`.
- **Taking a card** from a container: `moveToNear`, `interact` on the container, then `{"cmd":"mg","action":"take","args":["<card name>"]}` and `{"cmd":"mg","action":"close"}`. The container window prints "Added <name> to inventory" for three seconds; screenshot straight after the take. No toast is raised for a container take.
- **The coffee run** is a window, not a button: Ama's lever raises Chidi's and Jun's caffeine need. Wait for the event: `{"cmd":"waitEvent","name":"npc_left_post:jun_watanabe"}` (or poll the NPC's position with `getState()`). Jun is away for some tens of seconds; the walk back is the end of the window. Away times are estimates (the build did not measure them): write the real seconds in the report.
- **Evening.** "Call it a day" switches the office coffee off and sends Chidi, Jun and Agnieszka home (they vanish). Zainab walks to the kitchen coffee only after the player next enters the server room in the evening (she is outside the start room: her relay fires on `room_entered:server_room`). Her card hand-over works wherever she is.
- **After a click** wait for `pending` to go away (about a second).
- **Reload.** `{"cmd":"sync"}`, then `{"cmd":"eval","fn":"() => { location.reload(); return true; }"}`, wait about 15 s, then `{"cmd":"bootstrap","tutorial":"decline","resume":"resume"}`.

## Run A: morning (R1 to R4)

Fresh game.

| Beat | Do | Expect | Record |
|---|---|---|---|
| A0 | Read the notice board (`interact` on `tour_notice`). Talk to Ama: "What's next?". | The board lists the beats in plain words and names no control. Ama points at the hot desk and says Jun must be away. Objectives show three morning tasks. | none |
| R1a | Free check, optional: after R1b's "Send them for coffee", walk to the hot desk jack and stay beside it until Jun walks back. | He catches you (bark "Er, that's my desk. Can I help you?", event `npc_caught_at_post:jun_watanabe`). No penalty. Screenshot the bark and note how close you stood (the build did not render-check the 1.5-tile distance). Then run R1b again with a fresh "Send them for coffee" (the lever is repeatable). | none |
| R1b | Talk to Ama: "Send them for coffee." Wait for `npc_left_post:jun_watanabe`. Walk to the hot desk jack, plug the drop box in. | The view opens on "Office network" with the sweep offered and no host rows. Task "Plug the drop box in where nobody will notice" ticks. Ama's bark: "You're in. Now see what answers." | `--access`: one foothold `jack_hotdesk_jack`; `--ops-log`: a link-up row |
| R2 | Sweep "Office network". | Rows for the printer, the file server, the camera, four PCs and the shared drive (a locked share). Task "List what answers on the office network" ticks. | `opsDiscovered` holds `office_lan`; one swept row |
| R3 | Scan the printer. | One tile per service (`print` port 9100, `admin_page` port 80, with the product). Agnieszka's trips to the printer show it is in use (note any you see). Task "Find out what the printer runs" ticks. Scan `chidi_pc`: nothing listed. | one scanned row for `printer_host` |
| R4 | On the admin page tile, Check. Confirm the two findings (either order). | Two unconfirmed tiles under aliases (note them: `f1`, `f2`) that look alike. Confirming shows one real (what it grants) and one false (its reason: the build listed is older than the one the printer runs). Task "Test both of the printer's reported weaknesses" ticks on the second confirm, in either order (try the other order in Run C's fresh game). | one checked row, two confirmed rows (in the reader: `SVC_CHECK`, `FINDING_CONFIRMED`) |
| A5 | Free play: Ama's wall socket for the printer (`interact` on `printer_socket`, accept the prompt). Re-sweep. | The printer no longer answers; Agnieszka mutters one of the "printer's off" lines; Ama barks once ("Printer's off. It won't answer on the network now."). Switch it back on. | none |
| A6 | Reload: `sync`, reload, resume. Reopen the view from the drop box in the inventory. | Findings, aliases (`f1`, `f2`) and statuses unchanged. | unchanged |

## Run B: midday (R5, R6)

Continue Run A, or start fresh and repeat R1 to R4 first (it is quick). Say to Ama "Send them to lunch" first; staff drift off their desks (the task titles are in act order, but no task gates the next).

| Beat | Do | Expect | Record |
|---|---|---|---|
| R5a | Open the printer cupboard (`printer_cupboard`), take the "Factory accounts" card. | "Added Technique card: factory accounts to inventory" for three seconds. | inventory holds `card_factory` |
| R5b | In the view pick the card, then the real printer finding, Use. | A toast says a saved connection was found. Task "Use a technique on the one that is real" ticks. | `opsUsed` holds the finding; one used row; keyring has `print_admin` |
| R5c | In the view find Agnieszka's PC row. It has no Open (only a session grant adds one). Open the sign-in control from that row and choose the "Connect with ..." entry. | Her desktop in the remote-view frame. | a credential session at `agnieszka_pc` |
| R5d | Pick the card against the false printer finding. | Refused: "That finding turned out to be false." (Read the notice text with `eval` on `document.querySelector('.network-view-notice').textContent`.) A card on an unconfirmed finding is refused "That finding has not been confirmed yet." (use this on the file server in R6 before you confirm there.) | refused rows |
| R6a | Switch the header to the Terminal (`network.setSkin("cli")`). Scan the file server, then check its `storage` service (the quick-command buttons, or type the offered command). | The service line shows the lower-case word `filehold` and the authored banner "Tarnwick FileHold 4.2 file service ready"; the findings print under the same aliases Panels showed. The addresses shown are the authored ones (the sweep range `10.30.0.0/24`). No catalog text appears (see "Plan was wrong" below). | scanned and checked rows |
| R6b | In the Terminal, confirm `update_lag` and `release_line` (use the aliases the check printed). | The second shows why it is false. Screenshot the log. | two confirmed rows |
| R6c | Talk to Ama: "I looked at the file server in the Terminal." Answer either way. | She asks "What did the file server say?" and ticks "Look at the file server in the Terminal". | none |
| R6d | Switch back to Panels. | The same findings as tiles, same aliases and statuses. | unchanged |
| B7 | Terminal-lasts check (plan 8.6): switch to the Terminal, run one command, close the view with the X, reopen it from the drop box. | The Terminal log is still there. If it is gone, write it down as the known gap (docs line 1446), not as a failure of this scenario. | none |
| B8 | Panels-default check (plan 8.6): in a fresh browser profile start a session with `--net-skin default` and open the view. | Panels opens (the scenario sets no `networkView`). | none |

## Run C: evening (R7, R8)

Continue Run B (the findings must be confirmed: a card on an unconfirmed finding is refused).

| Beat | Do | Expect | Record |
|---|---|---|---|
| C0 | Talk to Ama: "Call it a day" (confirm "Yes, call it a day."). | Her two lines name Zainab and Graham. Chidi, Jun and Agnieszka go. The office lights change to the evening look. | none |
| R7a | Walk into the server room. After about ten seconds Zainab's bark ("Quiet now. Time for a coffee in peace.") and she walks to the kitchen coffee. Follow her to the kitchen. | She is alone; the other staff are gone. | none |
| R7b | Talk to Zainab: "You're on your own tonight." | She gives the "Known update gap" card. "Added ..." line. Task still open. | inventory holds `card_update_gap` |
| R7c | Try to open the shared drive from the view (`shared_drive` row) now. | Locked (a padlock badge), not Open. | none |
| R7d | Use the "Known update gap" card on `update_lag`. | A user session on the file server row, compromise mark on it. The share is still locked: an access list admits only Graham, and this is Agnieszka's session. | one session, access `user` |
| R7e | Confirm `link_setting` if it is not yet confirmed (its need is now met). In the server room open Zainab's tool roll, take the "Left-open settings" card. Use it on `link_setting`. | An "Admin" session on the file server row. | the session is now `admin`, as Graham; two used rows |
| R7f | Open the shared drive (`shared_drive`, Open). | A file `readme.txt`. Task "Open the shared drive" ticks. | one share-open row |
| R8a | Talk to Graham (it_room): "Want to see what you looked like from here?" Open the network log PC (`network_log_pc`). | Three seed rows (07:10 `NET_LINK_UP`, 07:12 `NET_SWEEP`, 07:14 `HOST_SCAN`, all from the "Kitchen wall network port") first, then your own rows (from the "Live wall network port"): plug, sweep, scans, checks, confirms, technique use, share open. The reader writes no row when opened. | no new row for the reading |
| R8b | Filter to the link rows. Select the 07:12 row and flag it (the flag button, then confirm). | `FLAGGED`; the row is marked; the task "Find yourself in the network log" ticks (close the viewer for the toast). A wrong pick (07:10 or 07:14) answers "NOT THIS ONE". | the flag is browser-only: no request |
| R8c | Free beat: back in the office, plug and unplug. Use `unplug` on the drop box (the view's Unplug button). | The view closes, the file server session ends, the keyring entry stays. Ama's one bark: "Unplugged. Every session through that box has ended with it." | no foothold; `opsUsed` and the keyring stay |
| R8d | Talk to Ama: "What did that show?" and "Give me the short version." | One line per ticked beat, then four lines. | none |

Every beat's objective ticks are client events; if one does not tick, read `getState().objectives` and report which event did not arrive (the contract is in the scenario's Ama mappings).

## End of run

After Run C: all eight tasks ticked; the keyring holds the printer's saved connection; the log shows your rows after the seed rows. Run the three server checks once more, then `access-leak-check.rb` over every capture file; it must report no leak. Write the earned-secrets table (the player earns no password in this scenario: write "none" and the in-game place each card was read from).

## Plan was wrong

- Plan 5.3 and 5.4 R6 promise realism text from the catalog in the Terminal. The validator requires realism on every finding or none, and the catalog has only three entries for six findings, so the file server has no realism links. R6 shows the Terminal with the authored banner and the false reason only.
- The four PCs are sign-in PCs (only those appear as sweep rows), so Chidi and Jun have no open-screen behaviour.
- Zainab and Graham are outside the start room, so their evening and midday needs start when the player next enters their room.
- The hot-desk jack's distance from Jun's approach cell (1.5 tiles) was not render-checked in the build: R1a is the check. Report the distance at which he catches you.
- The task ticks for R4 and R5 listen to the bare confirm and use events and read the payload (`status`, `findingId` prefix, `grant`), not the suffixed event named with a finding id: a finding id in an NPC's mapping reaches the browser with the office room, before the player has checked anything, and the leak scanner reports it (rule `ops_string`). The plan's R4 and `use_card` mappings (5.4) named the ids and were changed for that reason.
- The sweep lists the shared drive as a row beside the hosts (a locked share until the admin session), so R2 shows eight rows, not seven.
