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

### Cake reload result (update)

INCOMPLETE. The run exited 0 after "case 2: game 7555 / wait 22s (before reload)" and printed nothing further. No tmp/bc1 result file was written, so no cake case was measured. Not diagnosed: the call budget ran out first. Next step: rerun the script in the foreground with stderr captured, or check whether the wait loop failed silently. Do not record it as blocked on the shared reload rebuild issue until the reload step has actually run. Log: /tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/cake/run.log (scratchpad).

## Quick route (live walk, game 7558, server :3098)

Run by the quick-route agent. Keyless Rails from this worktree on 127.0.0.1:3098 (log /tmp/claude-1000/server-3098.log), stopped afterwards. Headless, setFPS(20), fixed steps on. Game 7558 created with `new-game.rb demo_access_tour` (id 271); no row or player state edited, nothing unlocked by script. Session log: tmp/handover/demo_access_build/s6q_7558.jsonl. Screenshots: tmp/handover/demo_access_build/screens6/quick/. Stopped at the call budget (about 70 calls) with stop 12 STUCK; stops 17 and 19 not run.

### Quick route step table

| Stop | Step | Result | Notes |
|---|---|---|---|
| 1 | Ama's briefing, choose quick | PASS | `converse` with `^Quick version`. Ama: "The quick version's about fifteen minutes. The full walk-round is nearer thirty-five ... Which?" Reply "Quick version." then "Quick it is. Doors, a desk, the box, and back to me." No screenshot of the choice screen (it closed before I could take one). 00_after_route_choice.png is the reception view after it. |
| 2 | Visitor card; partner door refused; meeting room; kit | PASS | Partner's door: "None of your cards is on this door's list. It opens for named people only. Julian's office. His card only." Meeting room: "Access Granted: Door opened with Visitor card 07", t_meet_ama done. Five kit items taken (RFID cloner, drop box, injector, USB stick, rogue AP). The capture tablet opens the Harvested Credentials minigame when clicked, not a pickup; closed it. t_kit done. |
| 3 | Plant drop box in meeting_jack | PASS | Confirm "Plug the network drop box into this live port?" then "Plug it in". Network view "Drop box: meeting room" opens, t_drop_box done. |
| 4 | Finance share refused | not on quick route | Full route only. |
| 5 | Front desk: Delphine's note, facilities.txt, Copy julian.rdp, sign out | PASS | Login screen: "Add Postit to notepad", then open the notepad to read it (it reads "darvanitis / Merrin-Desk-4417"). Note: `mg close` on the notes also closed the password screen; re-interact to reopen it. Select Delphine's row (clickControl 0), type the password with `mg type` at field index 0 (control index 1 gives no-field-at-index-1). facilities.txt read: Lorna's login printed in the file. julian.rdp: Copy to inventory (not Connect). Start, Sign out: t_front_desk done, toast "Lorna Easton's password is in facilities.txt." |
| 6 | Saved connection, julian_pc through the box | PASS | `inventoryAct julian.rdp Connect`: toast "Saved connection found: julian.rdp for Julian Sallow on MS-PARTNER-01." Julian's PC opens "Remote session through Drop box: meeting room". t_julian_pc done. The Lock button in the Start panel was not checked. |
| 7, 8 | Pivot, server room keypad | not on quick route | Full route only. |
| 9 | Lorna's badge with the cloner | PASS | Converse, choice "Chat with Lorna, close enough for the cloner in your pocket to read her card." RFID read at 100%: clicked Save by exact label (not Abandon read). Toast "Card copied: Lorna Easton FAC card is saved on your RFID cloner." t_copy_badge done. Then "Just passing through, thanks." |
| 10 | Comms cupboard | PASS | Door at open plan: RFID reader "Your badge was refused. Try a saved card." Clicked "Emulate Lorna Easton FAC card". "Access Granted: Opened with your copy of Lorna Easton FAC card." enter comms_cupboard; t_comms done. Toast "Objective Complete! Test the office". |
| 11 | Thandiwe's laptop while seated | PASS | Toast "Thandiwe Moyo is using this PC." |
| 12 | Open session: read the rota board, Thandiwe leaves | STUCK | Rota board: display panel opened, dismissed with `dismiss ×`. Within about 30 s the globals `thandiwe_laptop_owner_away` and `yasmin_pc_owner_away` were set. Thandiwe then stood still at (122,-150) beside her empty chair (106,-150) and did not move for about 90 s more. Yasmin moved (about 219,-196). Thandiwe's laptop still answered "Thandiwe Moyo is using this PC." on four interacts over about 3 minutes. Not tried: waiting for her to return, the network view's Sign in on Thandiwe's laptop, Yasmin's PC (stop 13, not on quick route). |
| 13 to 16, 18 | | not on quick route | |
| 17 | Unplug at the meeting room | NOT RUN | Stopped at the call budget. Required task t_unplug still open. |
| 19 | Debrief and credits | NOT RUN | |

Stop 12 looks like the same symptom as the "Thandiwe's laptop one-click failure" noted above. It has not been investigated.

### Where next? answers (quick route)

- After t_julian_pc (about stop 6), not checked.
- At stop 12: "Where next?" gave "When you've had enough, pull the box out and see what drops."
- Ama's phone thread at stop 12 held these lines: "Ask me where next any time." / "Box is talking. Have a look at the network view before you sign in anywhere." / "Before you use that, sign out of Delphine's PC." / "She's signed in and sitting right there. Give it a minute, or read the coffee rota on the wall and watch her go."

### Ama's debrief lines (D4, D5a to D5c)

Not reached. The run stopped before the unplug, so no debrief line was seen.

### Harness notes from this run

- `enter` takes a room id (`{"cmd":"enter","id":"partner_office"}`), not a door id. A door id gives `no-doorway`.
- `mg type` takes the field index (0 for the password field here), not the control index.
- `mg close` on a notes overlay also closes the password minigame beneath it.
- The Start panel on a PC lists Lock, Switch user and Sign out; the sign-out clickText is exact.
- The RFID reader after a card is saved opens on the next door click, with "Emulate <name> card" as its only control.

### Screenshots (screens6/quick/)

- 00_after_route_choice.png: reception after the quick choice
- 01_front_desk_desktop.png: Delphine's desktop
- 02_after_front_desk_signout.png: reception after signing out
- 03_network_view_keyring.png: network view with the box, Julian's PC shows "Sign in"
- 04_julian_desktop_via_box.png: Julian's desktop via the box
- 05_rota_board_read.png: rota board display, before dismiss
- 06_phone_at_stop12.png: Ama's thread at stop 12

Not taken: the route choice itself and the debrief (not reached).
