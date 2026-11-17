# Slice 6 part A handover (partial: stopped at the context limit)

Worktree p-build-access, branch build/demo-access-tour. Commit fb3ca4751 (reception props on the counter). Server :3095 and the session are stopped. Game 7537 (full route) is saved at stop 7: door controller sign-in screen open (password minigame, account list: Lorna "In file"); resume it with tools/playtest/session-start.sh --url http://127.0.0.1:3095/break_escape/games/7537 --headless true (never edit its row). Helper scripts were in /tmp/claude-1000/*.sh (c.sh, d.sh, adv.sh, mgs.sh, shot.sh, open.sh); recreate if gone. Drive pattern: cmd.sh, mg getState/clickText/clickControl(index)/type, interact id, enter room, openInventoryItem/inventoryAct, dismiss label.

## Full route steps done (game 7537)
| # | Step | Result |
|---|---|---|
| 1 | Briefing, choose full walk (tour_full set), phone badge 1 | PASS |
| 2 | Visitor card picked up; partner door refused ("Julian's office. His card only."); meeting room opens with the card, t_kit done, kit items taken (6) | PASS |
| 3 | Plant dropbox via meeting_jack confirm; network view opens; t_drop_box done | PASS |
| 4 | Finance share shows "Needs account", cannot be opened from the bare box | PASS |
| 5 | Delphine PC sign-in (postit password), facilities.txt read, julian.rdp Copy to inventory; sign out | PASS |
| 6 | Inventory julian.rdp Connect: Julian's PC opens "Remote session through Drop box"; Finance share opens (q3_accounts.txt); Start panel has Lock | PASS |
| 7 | Network view from the box now lists server network (MS-DOOR-01 Sign in); sign-in screen reached | IN PROGRESS (password not typed yet: Lorna password Faclab-Tarn-905 from facilities.txt) |
| 8 to 19 | keypad, Lorna, comms, Thandiwe, open session, Yasmin, USB, rogue AP, Staff Wi-Fi, unplug, ports, debrief, credits | NOT RUN |
Quick route: NOT RUN.

Ama phone history so far (phoneState): "Ask me where next whenever you're stuck." (preloaded), then timed "Box is talking. Have a look at the network view before you sign in anywhere." (after the plant). Later hints not yet seen.

Screens (screens6/): 01_reception, 02_meeting_room, 03_network_view, 04_front_desk_signin, 05_front_desk_desktop, 06_julian_desktop. Not taken: server_room, kitchen, open_plan, comms, partner_office, credits.

## Nits
- visitor_card, guest Wi-Fi sign, USB hub: FIXED in fb3ca4751 (card y 4.3, sign x5.95 y3.95, hub y 4.4; all now on the counter, sign verified in 01_reception.png crop; the card is small and sits by Delphine at the counter's right end, check once more). Run the demo_access_tour*_test.rb files: NOT yet re-run after the move (devices_test and validator-access-work.test.mjs mention usb_hub/guest_wifi_card).
- nil-id inventory entry: the server player_state inventory has two entries with id nil, the phone ("Your phone", type phone) and the Notepad. Client ids are inventory_inventory_phone_<ts> and inventory_notepad_inventory, and their scenarioData has no id. Probably engine-wide default items, not tour-specific; not yet confirmed against another mission's game, and not fixed.
- Thandiwe's laptop one-click failure: NOT investigated.
- LED on the rogue AP: not looked at.
- Observations: injector and USB stick tray icons look near-identical (two white router icons); capture_tablet interact opens the Harvested Credentials minigame, fine.

## Cake reload (task 4): NOT run
Coordinator note: reuse tools/playtest/showcase-bc1-cake-reload.mjs from /home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/p-ol-showcase (args scenario, room, cake, port, eaters, rooms, task). AC4 found page.reload() does not rebuild the Phaser scene on office_life_showcase even after dismissing the resume overlay (another agent is investigating). If it happens here, spend at most a few calls, record "blocked on the shared reload rebuild issue (AC4 investigating)", and say exactly how any working reload was done.

## Ink or line issues seen
None so far. Briefing text appeared once per click (adv sampling showed a repeated "The full walk-round, then." line; probably my polling, unverified).

## Continuation (live walk, server :3096, game 7537)

Run by the slice 6A continuation agent. Headless, setFPS(20), fixed steps on. Server: keyless Rails from this worktree on 127.0.0.1:3096 (log in /tmp/claude-1000/server-3096.log). Session log: tmp/handover/demo_access_build/s6a_7537.jsonl. The session was resumed on game 7537 and reloaded to reception (expected after a reload).

### Full route, steps 7 to 19

| Step | Result | Notes |
|---|---|---|
| 7 Pivot: door controller from the box | PASS | Network view at meeting_jack lists MS-DOOR-01 under Server network. Lorna Easton (in file), password Faclab-Tarn-905 typed. `t_door_controller` done. Door codes file opened: server room keypad 3822. |
| 8 Server room keypad | PASS | One mis-entry first (4933, a 4-digit auto-submit: "Incorrect PIN. 4 attempts remaining"). Then 3822 opened the door. `t_server_room` done. |
| 9 Lorna's card, cloner | PASS | Lorna's chat, "Chat with Lorna ... cloner" then "Stand close ... cloner reads her card". RFID read saved on the second try (the first Save was a mis-click on "Abandon read", so the read was redone). `t_copy_badge` done. |
| 10 Comms cupboard | NOT RUN | |
| 11 to 19 | NOT RUN | Stops after 9 were not reached within the call budget. |
| Quick route | NOT RUN | |
| Walk behind open_plan back wall | NOT RUN | |

STUCK: none. Nothing was stuck; the route stopped at the budget.

### Where next? answers seen

- Opening Ama's thread at stop 7 (after `t_door_controller`): "Where next?" gave "Have a word with Lorna by the comms door. Bring the cloner." That is W9 (plan 2.9). W9 sits ahead of W7 and W8 in the built order, so it is the expected line.
- Preloaded and timed texts seen in the same thread: "Ask me where next whenever you're stuck." / "Box is talking. Have a look at the network view before you sign in anywhere." / "Before you use that, sign out of Delphine's PC."

### Cake reload

Script: a copy of tools/playtest/showcase-bc1-cake-reload.mjs and m01-ol-lib.mjs in the scratchpad (cake/ folder), run with `--scenario demo_access_tour --room open_plan --cake cake --port 3096 --cases 2,4 --eaters thandiwe,yasmin --rooms open_plan,kitchen --task t_open_session`. Log: <scratchpad>/cake/run.log. Its case 2 made game 7555, then it waited 22 s before the reload. Result: see the update below if the run finished.

### Screenshots (tmp/handover/demo_access_build/screens6/)

- 07_door_controller_desktop.png (Door controller remote desktop, after sign-in)
- 08_open_plan.png (first entry, open plan)
- 09_server_room.png (first entry, server room)
- 10_lorna_clone_saved.png (after the card read was saved)

Earlier, from the first session: 01_reception to 06_julian_desktop.

### Harness notes for the next run

- `mg clickControl` index is 0-based over the non-close controls. In the phone it sent "2. Thanks" for index 3 and on the keypad index 3 gave "4". Use `clickText` with an exact label, or count from 0 without the × control.
- `mg clickText` takes plain text; regex anchors (`^Save$`) do not match.
- `mg close` closes the top minigame (notes, phone). `clickControl` on × did nothing for the notes overlay.
- The state command is `brief`; there is no `getState` in the bridge command set.
- A 4-digit PIN auto-submits on the fourth digit.
