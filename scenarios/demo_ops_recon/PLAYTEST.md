# demo_ops_recon: scripted playtest ("What's on the network?")

A demo scenario (about 20 minutes guided): a working day at Merrin & Sallow, in which the player plugs a drop box in at the hot desk, lists and scans what answers on the office network, tests which reported weaknesses are real, uses technique cards, and reads their own trail in the network log. The plan is `docs/agents/ops_core_build/SHOWCASE_PLAN.md` section 5; the beats R1 to R8 below are its table 5.4. Three runs (A morning, B midday, C evening), each 10 to 15 minutes, in one game or in three fresh ones. Run B ends with a reload check and the Terminal-lasts check.

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
| `office` (start) | Ama (host); Chidi, Jun (hot desk), Agnieszka; the hot desk network port (a network jack); the printer and its wall socket (a power lever); the printer cupboard below the printer (unlocked, one card); the office coffee machine and its wall socket; the notice board | `ama_owusu`, `hotdesk_jack`, `office_printer`, `printer_socket`, `printer_cupboard`, `office_coffee`, `office_coffee_socket`, `tour_notice`, `agnieszka_pc` |
| `kitchen` | the kitchen network port (the one the seed log rows name), fridge, microwave, kitchen coffee, water cooler | `kitchen_jack`, `kitchen_coffee`, `water_cooler` |
| `server_room` | the file server (no screen; it only appears in the network view), the camera, Zainab, her tool roll (unlocked, one card) | `file_server`, `zainab_hussain`, `zainab_tool_roll` |
| `it_room` | Graham, his PC, the network log PC | `graham_whitfield`, `graham_pc`, `network_log_pc` |

Network: `office_lan` (discovery by sweep). Foothold id after plugging in at the hot desk: `jack_hotdesk_jack`. The printer is host `printer_host` (services `print`, `admin_page`); the camera is `lobby_camera` (service `stream`); the file server is `file_server` (service `storage`); there are four sign-in PCs as rows (`chidi_pc`, `jun_pc`, `agnieszka_pc`, `graham_pc`). The shared drive is the resource `shared_drive`.

Findings (ids are `<host>.<service>.<id>`; read the aliases on screen): `printer_host.admin_page.factory_login` (real, a saved connection to Agnieszka's PC), `printer_host.admin_page.old_build` (false), `file_server.storage.update_lag` (real, a user session as Agnieszka), `file_server.storage.link_setting` (real, needs that user session, an admin session as Graham), `file_server.storage.release_line` (false), and a camera decoy.

Cards: "Factory accounts" (printer cupboard; fits default accounts), "Known update gap" (held by Zainab; fits the file server's update finding), "Left-open settings" (Zainab's tool roll; fits `link_setting`).

Log: source `network_log`, three seed rows 07:10, 07:12, 07:14, all from the kitchen network port; the 07:12 row (the sweep) is the odd one out.

## Harness notes

- **Talk.** `{"cmd":"moveToNear","id":"ama_owusu"}`, `{"cmd":"interact","id":"ama_owusu"}`, then `{"cmd":"mg","action":"chooseMatching","args":["Send them for coffee"]}`. Close with `{"cmd":"mg","action":"close"}` or the exit choice.
- **The jack asks first.** Answer the plug prompt with `{"cmd":"dismiss","label":"Plug it in"}`. Take the drop box first: it is in the start inventory (read it from `getState().inventory`, id `kit_dropbox`); use it on the jack with `moveToNear` and `interact` on `hotdesk_jack`.
- **The view** is the `network-view` minigame: `{"cmd":"mg","action":"getState"}`, or `window.__test.network.state()`. Use `window.__test.network.run(offer)` for any sweep, scan, check or confirm, `network.setSkin("cli")` for the header switch, `network.log()` to read the Terminal, `network.type(line)` to type. The selectors of `test_ops_access/PLAYTEST.md` (Harness notes) hold: Sweep `[data-network-id="office_lan"] [data-action="sweep"]`; Scan `[data-host-id="<id>"] [data-action="scan"]`; Check `[data-host-id="<id>"] [data-service="<name>"] [data-action="check"]`; Confirm `[data-finding="<alias>"] [data-action="confirm"]`; card `[data-technique="<card id>"] [data-action="select-technique"]`; finding `[data-finding="<alias>"] [data-action="select-finding"]`; Use `[data-techniques] [data-action="use"]`; the share's Open `[data-resource-id="shared_drive"] [data-action="open"]`.
- **Taking a card** from a container: `moveToNear`, `interact` on the container, then `{"cmd":"mg","action":"take","args":["<card name>"]}` and `{"cmd":"mg","action":"close"}`. The container window prints "Added <name> to inventory" for three seconds; screenshot straight after the take. No toast is raised for a container take.
- **The coffee run** is a window, not a button: Ama's lever raises Chidi's and Jun's caffeine need. Wait for the event: `{"cmd":"waitEvent","name":"npc_left_post:jun_watanabe"}` (or poll the NPC's position with `getState()`). Jun is away for some tens of seconds; the walk back is the end of the window. Away times are estimates (the build did not measure them): write the real seconds in the report.
- **Rooms must be loaded before the levers that need them.** An NPC's needs only pick targets in rooms the player has opened, and a `fireOnlyWhenLoaded` mapping does nothing for an unopened room. So Ama offers "Send them to lunch" only after the kitchen has been seen (food is there), and "Call it a day" only after both the kitchen and the server room have been seen (Zainab is in the server room and her evening coffee is in the kitchen). Before that she says where to look first. This is the `office_life_showcase` pattern (its lunch waits on `kitchen_seen`).
- **Evening.** "Call it a day" switches the office coffee off and sends Chidi, Jun and Agnieszka home (they vanish). About 1.5 s later Zainab barks "Quiet now. Time for a coffee in peace." (as a toast when you are not in the server room), and about 8 s later she walks to the kitchen coffee (measured in round 1: she left at once, expected away about 27 s, then walks back to the server room). Her card hand-over works wherever she is.
- **Ama's barks** after each beat (sweep, scan, both confirms, the card, the file server scan, the share) are held while the network view is open and show when it closes, one every 2.5 s; a bark whose next step is already done is dropped as stale. Read them from `npcManager` conversation history if the bubble has gone (`isBark` messages).
- **After a click** wait for `pending` to go away (about a second).
- **Reload.** `{"cmd":"sync"}`, then `{"cmd":"eval","fn":"() => { location.reload(); return true; }"}`, wait about 15 s, then `{"cmd":"bootstrap","tutorial":"decline","resume":"resume"}`.

## Guided path (the tour, 2026-11-25)

Play only what Ama points at. After each tick she barks one "what you just saw" line (held while the network view is open, shown when it closes). Order is the same on the panel, the "Things to try" board and "What's next?". Live-checked in game 283 on :3051 (stopped); beats marked (static) are asserted in the Rails test or a story run, not clicked this round.

| Beat | Pointer (Ama, "What's next?") | Action | Tick | What you just saw (bark) |
|---|---|---|---|---|
| R1 | Find the hot desk port, plug in while Jun is away; "If Jun comes back while you're at his port, he'll ask what you're doing." | Plug in at the hot desk (or kitchen) port | `plug_in` on `network_foothold_gained:hotdesk_jack` or `:kitchen_jack`; `box_at_kitchen` set by an appended mapping at each | "You're on the office network now. The box is your foothold. Anything it can reach, you can look at. Now sweep the network." (kitchen: its own wording). Live: kitchen bark seen, `box_at_kitchen` true |
| R2 | Sweep the office network | Sweep | `sweep` | "Those are the machines that answered. One spare port showed you every PC, the printer, a camera and a file share. Scan the printer next." (live) |
| R3 | Scan the printer | Scan | `scan_printer` | "Each tile is something the printer offers, with its product and version. The admin page is the one to check." (live) |
| R3b | Optional, while `printer_off` is false: "Want to see an outage? Switch the printer off at its wall socket and sweep again. Then switch it back on." | Wall socket, re-sweep | none | existing "Printer's off. It won't answer on the network now." |
| R4 | Check the admin page, test both | Check, confirm both | `confirm_both` | "Two reports that looked the same. Only testing showed which was real and why the other was a false alarm. There's a technique card in the printer cupboard." (live) |
| R5 | Cupboard card, use on the real one | Take card, Use | `use_card` | "The card fitted the real weakness. ... that link is in your keyring now." then "Try the same card on the false one, if you like. It won't take. Then open Agnieszka's PC row and connect with that saved link." (live; the false card answered "That finding turned out to be false.") |
| R5c | "Open the sign-in control on Agnieszka's PC row and connect with the printer's saved link." | Sign-in tile "Agnieszka Duda, Saved", "Printer's saved link" | `remote_signin` on `pc_signed_in:agnieszka_pc` (via `credential`; any sign-in there counts) | "That's her desktop, and you never knew her password. A saved connection works like one." (live) |
| R6 | "Now try the file server the same way, in the Terminal view. Same moves, typed." then tell Ama | Terminal, scan, tell Ama | `terminal_view` (ink tag) | in the knot: "Same findings, same names, printed the way a console prints them. Its scan came back as a table, lined up in columns." then "Switch to Panels and back again. The Terminal keeps its log for as long as the view is open." (ticked live; the new lines are in the served ink) |
| Gate | "Call it a day" | Only after kitchen and server room are seen | none | Until `plug_in`, `sweep`, `scan_printer`, `confirm_both`, `use_card`, `remote_signin`, `terminal_view` are done she says "Not yet." and one line per undone beat, with "Skip them and call it a day anyway." (story run: refusal lists exactly the undone beats; skip reaches "Seen what you wanted?"; all done passes straight through) |
| R7a | as now (Zainab's card) | Use "Known update gap" on the update finding | none (bark only) | `pc_signed_in:file_server` with `via technique`, `npcId agnieszka_duda`: "A session on the file server as Agnieszka, an ordinary user. The red frame means a technique got you in, not a sign-in." (static) |
| R7b | as now (tool roll card) | Use "Left-open settings" | none (bark only) | same event, `npcId graham_whitfield`: "Now you're Graham, an administrator. The user session was what that weakness needed first." (static) |
| R7c | as now | Open the shared drive from the file server desktop | `open_share` | "The shared drive opens only for Graham. The foothold and Agnieszka's session weren't enough. Now see Graham for the log." (static) |
| R8 | Go and see Graham | Flag the 07:12 row | `read_log` | "Every move you made is in that log, after the stranger's. ... Then ask me what's next." (static) |
| R8c | "Last thing. Go back to the kitchen or hot desk port (by where the box is) and unplug the box." | Unplug at the port | `unplug`: `network_device_unplugged:hotdesk_jack` or `:kitchen_jack` with `open_share_done` true (an unplug before the share neither ticks nor spends the once-only line) | "Unplugging ended every session that ran through the box. Your keyring keeps what you found." (static) |

Time: about 20 minutes. Measured waits: the lever windows (coffee run, lunch) were not re-measured this round (no change to any routine number); the live run used the kitchen port so no wait on Jun. The evening beats R7 to R8c were not clicked this round: run them from a game that has done R1 to R6.

Not in the tour: the realism text (`demo_ops_terminal` shows it), tokens and the assist invite (`demo_ops_terminal`), passwords and cracking (`demo_ops_passwords`), second steps (`demo_ops_second_step`). Free play: A5 printer socket, Jun caught at his desk, reload check, B7 and B8 below.

The three runs below keep the harness detail of each beat.

## Run A: morning (R1 to R4)

Fresh game.

| Beat | Do | Expect | Record |
|---|---|---|---|
| A0 | Read the notice board (`interact` on `tour_notice`). Talk to Ama: "What's next?". | She introduces herself ("I'm Ama, from Fenlow."). The board lists the beats in plain words and does name the controls (round 2 text: "Morning: - Ask Ama to send them for coffee, then plug the drop box into the hot desk's network port while Jun is away. - Sweep the office network, then scan the printer. ..."). Ama says "I'm Ama, from Fenlow. Merrin and Sallow want to know what an outsider could learn from one spare network port." and points at the hot desk's network port. The objectives panel shows all eight tasks at once, in three aims (morning, midday, evening); no task is hidden until its turn. | none |
| R1a | Free check, optional: after R1b's "Send them for coffee", walk to the hot desk network port and stay beside it until Jun walks back. | He catches you (bark "Er, that's my desk. Can I help you?"). Two mappings give it: `npc_caught_at_post:jun_watanabe` when you stand within 1.5 tiles of his chair, and, on `npc_returned_post:jun_watanabe`, when you are within 80 px of him as he sits (round 1 live check: player at the port, `playerDistance` 35; round 2: Jun left, came back, `npc_returned_post` with `playerDistance` 43, bark given once). The same bark has a 90 s cooldown on both mappings (round 2: it had appeared four times in one run with nothing changing between). No penalty. Note `playerDistance` from the event. Then run R1b again with a fresh "Send them for coffee" (the lever is repeatable). | none |
| R1b | Talk to Ama: "Send them for coffee." Wait for `npc_left_post:jun_watanabe`. Walk to the hot desk network port, plug the drop box in. | The prompt reads "Plug the drop box into the hot desk's network port?" with "Plug it in" and "Leave it". The view opens as "Drop box: hot desk", "On Office network, at Hot desk network port", with the sweep offered and no host rows. Toast "Task Complete: Plug the drop box in where nobody will notice". Task "Plug the drop box in where nobody will notice" ticks. Ama's bark: "You're in. Now see what answers." (shows when the view closes). Plugging in at the kitchen port instead also ticks the task, with the bark "That works too. Nobody's watching the kitchen port." | `--access`: one foothold `jack_hotdesk_jack`; `--ops-log`: a link-up row |
| R2 | Sweep "Office network". | Eight rows (round 2 read): under Computers AGNIESZKA-PC, CHIDI-PC, FILESRV01 ("File server"), HOTDESK-PC ("Hot desk PC") and IT-PC ("Graham's PC"); under Devices "Office printer" and "Reception camera"; under file shares Shared-Drive, "Needs account". Task "List what answers on the office network" ticks. On closing the view, Ama: "That's everything that answers. Pick the printer and scan it." | `opsDiscovered` holds `office_lan`; one swept row |
| R3 | Scan the printer. | One tile per service ("print · 9100 · Inkvale JetServe 1.4" and "Admin page · 80 · Inkvale WebPanel 2.0"). Task "Find out what the printer runs" ticks. Ama's bark points at the admin page. Scan `chidi_pc`: "There is nothing more to find out here." (The plan's R3 opening, Agnieszka walking to the printer, is not built: she has no print habit. Do not wait for it.) | one scanned row for `printer_host` |
| R4 | On the admin page tile, Check. Confirm the two findings (either order). | Two unconfirmed tiles under aliases (note them: `f1`, `f2`) that look alike. The unconfirmed tiles read "Default login, High: The admin page still accepts the account it shipped with." and "Out of date, Low: The page reports a build number with known problems.". Confirming the real one shows only "Confirmed" and its description (no "what it grants" text: the grant shows when the card is used). Confirming the false one shows "False positive: The build listed is older than the one this printer runs. The page only shows a stale label.". Task "Test both of the printer's reported weaknesses" ticks on the second confirm, in either order (try the other order in Run C's fresh game). | one checked row, two confirmed rows (in the reader: `SVC_CHECK`, `FINDING_CONFIRMED`) |
| A5 | Free play: the printer's wall socket (`interact` on `printer_socket`, "Printer wall socket", accept the prompt). Re-sweep. | The wall prompt reads "Switch off the printer at the wall?" ("Switch off" / "Leave it") and a toast "Wall socket: The printer is switched off at the wall..." confirms it. The row reads "Office printer (powered down)" with no Scan. Ama is meant to bark once ("Printer's off. It won't answer on the network now."), but round 2 did not see it in the bark history: treat the toast as the sure feedback and report whether the bark shows. Switching it back on gives the toast "The printer is switched back on." Agnieszka's work need on the printer fails while it is off (her frustration in `--access`); she may grumble from the scenario's work pools, but no printer line is promised. Switch it back on. | `npcFrustration` for `agnieszka_duda` |
| A6 | Reload: `sync`, reload, resume ("RESUME SESSION?", then Resume). Reopen the view from the drop box in the inventory. | Findings, aliases (`f1`, `f2`) and statuses unchanged. The player is back at the start position, and only the office is loaded again. Ama's room-seen flags (kitchen, server room) are cleared on load for that reason, so walk into the kitchen and the server room again before lunch or "Call it a day"; until then she says where to look. | unchanged |

## Run B: midday (R5, R6)

Continue Run A, or start fresh and repeat R1 to R4 first (it is quick). Walk into the kitchen once, then say to Ama "Send them to lunch"; staff drift off their desks, Jun included (a second hot desk window). Before the kitchen has been seen she says "Have a look in the kitchen first." (The task titles are in act order, but no task gates the next.)

| Beat | Do | Expect | Record |
|---|---|---|---|
| R5a | Open the printer cupboard (`printer_cupboard`), take the "Factory accounts" card. | "Added Technique card: factory accounts to inventory" for three seconds. | inventory holds `card_factory` |
| R5b | In the view pick the card, then the real printer finding, Use. | The notice reads "That gave you a saved sign-in. It is in your keyring." and a toast "Saved connection found: Printer's saved link for Agnieszka Duda on AGNIESZKA-PC.". Task "Use a technique on the one that is real" ticks. On closing the view, Ama: "The printer kept a saved link to Agnieszka's PC. Try it from her row." | `opsUsed` holds the finding; one used row; keyring has `print_admin` |
| R5c | In the view find Agnieszka's PC row. It has no Open (only a session grant adds one). Open the sign-in control from that row: "Agnieszka Duda (aduda) Saved", then "Connect with / Printer's saved link". | A window "Remote session through Drop box: hot desk" with her desktop. Round 2 saw "Desktop is empty", which reads as a bug, so the PC now holds a file `print-queue.txt` (not yet seen in a browser: report what shows). | a credential session at `agnieszka_pc` |
| R5d | Pick the card against the false printer finding. | Refused with the notice "That finding turned out to be false." (Read the notice text with `eval` on `document.querySelector('.network-view-notice').textContent`.) A card on an unconfirmed finding is refused "That finding has not been confirmed yet." (use this on the file server in R6 before you confirm there.) | refused rows |
| R6a | Switch the header to the Terminal (`network.setSkin("cli")`). Scan the file server, then check its `storage` service (the quick-command buttons, or type the offered command). | The service line shows the lower-case word `filehold` and the authored banner "Tarnwick FileHold 4.2 file service ready"; the findings print under the same aliases Panels showed. The addresses shown are the authored ones (the file server is 10.30.0.10, service word `filehold`). No catalog realism text appears: that is accepted for this showcase (realism text is shown by `test_ops_skin`). On closing the view, Ama: "That's the file server. Try it in the Terminal too, then tell me what it said." | scanned and checked rows |
| R6b | In the Terminal, confirm `update_lag` and `release_line` (use the aliases the check printed). | The first prints "Confirmed". The false one prints a failure line and the reason "The build number is only a label. The service was updated last month.". Screenshot the log. | two confirmed rows |
| R6c | Talk to Ama: "I looked at the file server in the Terminal." (offered only once the file server has been scanned). Answer with either of the first two choices. | She asks "What did the file server say?" and ticks "Look at the file server in the Terminal". The third choice, "Actually, I haven't yet.", goes back to the hub without ticking. | none |
| R6d | Switch back to Panels. | The same findings as tiles, same aliases and statuses. | unchanged |
| B7 | Terminal-lasts check (plan 8.6): switch to the Terminal, run one command, close the view with the X, reopen it from the drop box. | The Terminal log is still there. If it is gone, write it down as the known gap (docs line 1446), not as a failure of this scenario. | none |
| B8 | Panels-default check (plan 8.6): in a fresh browser profile start a session with `--net-skin default` and open the view. | Panels opens (the scenario sets no `networkView`). | none |

## Run C: evening (R7, R8)

Continue Run B (the findings must be confirmed: a card on an unconfirmed finding is refused).

| Beat | Do | Expect | Record |
|---|---|---|---|
| C0 | Make sure you have walked into the kitchen and the server room since the last reload. Talk to Ama: "Call it a day" (confirm "Yes, call it a day."). | Before both rooms are seen she says "Look in on the kitchen and the server room first. ..." (the ink is checked with a story run; round 2 read only the next hub greeting after it, so read the whole exchange from the conversation text). She asks "Seen what you wanted? Once they've gone home, it's just Zainab and Graham." and, on yes, says "Right. Home time for nearly everyone." After: her lines name Zainab ("Zainab will head for the kitchen coffee") and Graham. Chidi, Jun and Agnieszka go. The office lights change to the evening look. | none |
| R7a | Wait in the office or go to the kitchen. | About 1.5 s after "Call it a day", Zainab's bark ("Quiet now. Time for a coffee in peace."), and about 8 s after, `npc_left_post:zainab_hussain` with target `kitchen_coffee`, then `npc_use_started:kitchen_coffee` (round 1 live check: both arrived). Round 2 saw her parked (`no_source`) and walking only about 85 s later after the player re-entered the kitchen: the cause was a reload, which left the room-seen flags set while only the office was loaded. Round 2 fix: the flags clear on load, so "Call it a day" cannot be said until both rooms are entered again after a reload. The engine cannot load rooms on resume, so that is the behaviour. She is alone; the other staff are gone. She walks back to the server room after her coffee. | none |
| R7b | Talk to Zainab (kitchen or server room): "You're on your own tonight." | She gives the "Known update gap" card ("Added ..." line) and says the next card is in her tool roll. Task still open. | inventory holds `card_update_gap` |
| R7c | Try to open the shared drive from the view (`shared_drive` row) now. | Locked (a padlock badge), not Open. | none |
| R7d | Use the "Known update gap" card on `update_lag`. | A window "Remote view: Agnieszka Duda through Drop box: hot desk" and the file server row reads "Open (Agnieszka Duda)". The share is still locked: an access list admits only Graham, and this is Agnieszka's session. | one session, access `user` |
| R7e | Confirm `link_setting` if it is not yet confirmed (its need is now met). In the server room open Zainab's tool roll, take the "Left-open settings" card. Use it on `link_setting`. | "Remote view: Graham Whitfield ... Administrator" and the file server row reads "ADMIN". | the session is now `admin`, as Graham; two used rows |
| R7f | Open the shared drive from the file server's own desktop (the Shared-Drive icon in the admin remote view). The `shared_drive` row in the network list has no Open. | The window "\\FILESRV01\Shared-Drive" holds `readme.txt`. Task "Open the shared drive" ticks. | one share-open row |
| R8a | Talk to Graham (it_room): "Ama said you'd show me the network log." He tells you to find the sweep someone ran from the kitchen port before you came. Open the network log PC (`network_log_pc`). | Three seed rows (07:10 `NET_LINK_UP`, 07:12 `NET_SWEEP`, 07:14 `HOST_SCAN`, all from the "Kitchen wall network port") first, then your own rows (from the "Hot desk network port"): plug, sweep, scans, checks, confirms, technique use, share open. The reader writes no row when opened. | no new row for the reading |
| R8b | Filter to the link rows (the harness could not set the location filter in round 2; the row was reachable unfiltered). Select the 07:12 row ("FLAG THIS ROW AS THE ANOMALY? CONFIRM / CANCEL", then CONFIRM) and flag it (the flag button, then confirm). | `FLAGGED`; the row is marked; the task "Find yourself in the network log" ticks (close the viewer for the toast). A wrong pick (07:10 or 07:14) answers "NOT THIS ONE". | the flag is browser-only: no request |
| R8c | Free beat: back in the office, plug and unplug. Open the view at the hot desk network port (the Unplug button is only there when the view is opened at the port; from the inventory the view says "You can unplug the box at its port") and press Unplug. | The view closes, toast "Unplugged. Your sessions on FILESRV01 and AGNIESZKA-PC ended.", the keyring entry stays and "Network drop box" is back in the inventory. Ama's one bark: "Unplugged. Every session through that box has ended with it." | no foothold; `opsUsed` and the keyring stay |
| R8d | Talk to Ama: "What did that show?" (she asks which part: the morning, midday or the evening) and "Give me the short version." | Each part gives its lines (morning: the foothold line, the sweep line, the scan line; midday: confirm, card, Terminal; evening: share, log); round 2 read only the sweep and scan lines, the card and Terminal lines, and the log line, so the first line of each part did not show in the history read-out although a story run emits it: read each part on screen. The short version is four lines ("One cable shows a lot. ..."). Lunch and its menu entry are gone after use, and "Send them for coffee" and "Call it a day" go after the evening starts. | none |

Every beat's objective ticks are client events; if one does not tick, read `getState().objectives` and report which event did not arrive (the contract is in the scenario's Ama mappings).

## End of run

After Run C: all eight tasks ticked; the keyring holds the printer's saved connection; the log shows your rows after the seed rows. Run the three server checks once more, then `access-leak-check.rb` over every capture file; it must report no leak. Write the earned-secrets table (the player earns no password in this scenario: write "none" and the in-game place each card was read from).

## Plan was wrong

- Plan 5.3 and 5.4 R6 promise realism text from the catalog in the Terminal. The validator requires realism on every finding or none, and the catalog has only three entries for six findings, so the file server has no realism links. Accepted for this showcase (round 1 decision): realism text is shown by `test_ops_skin`. R6 shows the Terminal with the authored banner and the false reason only.
- The four PCs are sign-in PCs (only those appear as sweep rows), so Chidi and Jun have no open-screen behaviour.
- An NPC's needs only pick targets in rooms the player has loaded, and `fireOnlyWhenLoaded` mappings do nothing for an unloaded room. Lunch and the evening therefore wait until the kitchen (and, for the evening, the server room) has been seen; Ama says so.
- Jun's chair (the hot desk's approach point) is about 1.5 tiles from where a player stands to use any port beside the desk, and a player can plug in from about 1.5 tiles away, so the engine's caught check (48 px from the chair) does not see a player at the port reliably. Round 1 moved the port beside the desk (3.0, 5.9) and added a second catch on Jun's return (within 80 px of him as he sits).
- Agnieszka's trips to the printer (R3 opening) are not built: she has a work need on the printer resource but no print habit. R3 does not need them.
- The task ticks for R4 and R5 listen to the bare confirm and use events and read the payload (`status`, `findingId` prefix, `grant`), not the suffixed event named with a finding id: a finding id in an NPC's mapping reaches the browser with the office room, before the player has checked anything, and the leak scanner reports it (rule `ops_string`).
- The sweep lists the shared drive as a row beside the hosts (a locked share until the admin session), so R2 shows eight rows, not seven.
- Player lines in a conversation carry the label "Agent 0x00" (the engine's player name).
- The Terminal skin shows msf-style command lines; a first-time player may read them as real attacks. Panels is the clearer first view and is the default.
- Round 2 playtest could not measure Zainab's expected away time (about 27 s, 8 s to walk); do not rely on those numbers.
