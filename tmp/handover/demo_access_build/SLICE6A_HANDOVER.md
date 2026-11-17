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
