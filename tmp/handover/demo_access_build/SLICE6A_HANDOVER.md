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

## Cake reload (task 4): RAN, cases 2 and 4 FAIL, reload executed

Run by a cake-reload agent on keyless server 127.0.0.1:3099 (worktree p-build-access, started with $S/start3099.sh, pid file tmp/pids/server-3099.pid; RBENV_VERSION=2.7.8, BUNDLE_PATH=<main>/vendor/bundle). Command (run from the worktree root):
`node $S/cake/showcase-bc1-cake-reload.mjs --scenario demo_access_tour --room open_plan --cake cake --port 3099 --cases 2,4 --eaters thandiwe,yasmin --rooms open_plan,kitchen --task t_open_session`
Probe copy: $S/cake/showcase-bc1-cake-reload.mjs (identical to p-ol-showcase). Full output: $S/cake/cake_run.txt. Result JSON: tmp/bc1/demo_access_tour-case2-game7557.json, tmp/bc1/demo_access_tour-case4-game7564.json.

Early exit (last run): not reproduced. The script only reaches its exit at the end, and that exit is `process.exit(rows.every(pass) ? 0 : 1)`. The earlier silent exit 0 is probably the calling wrapper, not the script (inference, not checked further).

Key output (verbatim):
```
case 2: game 7557
  wait 22s (before reload)
  case 2: FAIL {"pass":false,"placed":false,"kept":true,"eat":{"npc":"thandiwe","walked":false,"ate":false},"dropEvents":["item_dropped:cake"],"before":{"found":[{"room":"reception","x":172.5,"y":260.5,"elevation":0}],"inv":false,"loaded":["reception"],"servings":2,"magnet":true,"magnetServings":2},"after":{"found":[{"room":"reception","x":160,"y":247,"elevation":0}],"inv":false,"loaded":["reception"],"servings":2,"magnet":true,"magnetServings":2},"events":[],"errs":["console: Failed to load resource: the server responded with a status of 400 (Bad Request)","console: Failed to load resource: net::ERR_FAILED"]}
case 4: game 7564
  wait 22s (before reload)
  case 4: FAIL {"pass":false,"gone":false,"finishedEvent":false,"taskBefore":"active","taskAfter":"active","after":{"found":[{"room":"reception","x":160,"y":247,"elevation":0}],"inv":false,"loaded":["reception","open_plan"],"servings":2,"magnet":true,"magnetServings":2},"errs":["console: Failed to load resource: the server responded with a status of 400 (Bad Request)","console: Failed to load resource: net::ERR_FAILED"]}
| 2 | 7557 | FAIL |
| 4 | 7564 | FAIL |
```

What it shows:
- Reload ran and the scene rebuilt. `window.rooms` loaded, `whereAll` ran, and the cake stayed in reception with magnet and servings intact in both cases. Not the shared "scene never rebuilds" issue.
- Case 2: cake kept on the magnet (servings 2, not in inventory). Position changed from (172.5, 260.5) to (160, 247). The "before" read was taken 3 s after the drop and the "after" read 22 s later, so the move may come from the settle wait, not the reload. Not separated. `placed` failed on that move. The NPC eat step did not start (thandiwe `walked:false`).
- Case 4: the cake was not eaten within the 150 s timeout, both eaters were set to hunger 60, and the task stayed `active`. Not reloaded into a finished state, so the case cannot pass. The probe never reaches the post-finish assertions.
- Console errors are the same in both cases: one 400 and one ERR_FAILED (the /tts abort route is the likely source; not confirmed).
- player_state size was not measured. The probe does not record it, so the "grew or not" question is open.

Next: the eat step needs its own check (why thandiwe and yasmin do not walk to the cake on this worktree's build), and the drop position needs a read after the settle, before and after the reload.

## Continuation 2 (full route 10-19, game 7537)

Run by the continuation 2 agent. Headless, setFPS(20) with fixed steps on (returned `fixedStep` true, not changed). Keyless server from this worktree on 127.0.0.1:3096, stopped afterwards (pids 189862 and 210768, port free). Start needs `BUNDLE_PATH=/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/vendor/bundle`; without it bundler fails on the worktree's missing gems. Session log: tmp/handover/demo_access_build/s6b_7537.jsonl. Server log: scratchpad server-3096.log.

Mid-run, the server went down (another agent's `pkill -f`); it was restarted with the same recipe and game 7537 resumed. No step was failed for that.

### Step table

| Step | Result | Notes |
|---|---|---|
| 10 Comms cupboard | PASS | Walked through open plan, `interact` on the comms door (RFID). Reader offered "Emulate Lorna Easton FAC card": Access Granted. `t_comms` done. Screenshot 11_comms_cupboard.png. |
| 11 Thandiwe's laptop | PASS | `interact` on thandiwe_laptop while she sat: events `pc_in_use`, `pc_in_use:thandiwe_laptop`. |
| 12 The open session | STUCK | Tried three ways, Thandiwe stayed at her desk (chair at 122,-120, mode idle, atPost true). (1) Read the coffee rota: overlay showed, `thandiwe_laptop_owner_away` and `yasmin_pc_owner_away` set, but no move. Her caffeine was 79 (the rota adds 10). (2) Waited about 5 minutes in total: no move. (3) Dropped the cake in open plan: `item_dropped:cake`, `npc_saw_magnet:thandiwe`, `npc_left_post:thandiwe` fired, but she was still at 122,-120 and the laptop still reported `pc_in_use` 20 s later. Not reached: `t_open_session`. |
| 13 Yasmin's PC | BLOCKED (same as 12) | `interact` on yasmin_pc gave `pc_in_use`, `pc_in_use:yasmin_pc`. Yasmin sat at 221,-171 (idle, atPost). Not reached the padlock or the note. |
| 14 Front desk USB, injector | NOT RUN | Budget reached. |
| 15 Rogue AP, Staff Wi-Fi clone | NOT RUN | Budget reached. |
| 16 Staff Wi-Fi key | NOT RUN | Budget reached. |
| 17 Unplug | NOT RUN | Budget reached. |
| 18 Comms ports (guest VLAN) | NOT RUN | Budget reached. |
| 19 Debrief and credits | NOT RUN | Budget reached. |
| Walk behind open_plan back wall | NOT RUN | Budget reached. |
| Kitchen, partner office, credits first entries | NOT RUN | Kitchen was not visited. |

Stop 12 is the only blocker found. It may be the open-session trigger rather than a route fault, since she did not leave even after the cake drop fired `npc_left_post`. Worth a second look by someone who can read the office-life state for Thandiwe. Stop 13 has the same cause, because the plan needs both away.

Caveat on stop 12: the NPC-needs log showed Yasmin using `coffee_station_open_plan` (in the open plan, not the kitchen) at t=624 before this run's rota read. The rota did not send either of them to the kitchen.

### Phone answers ("Where next?")

- After step 10 (comms cupboard done), first ask: "Have a word with Lorna by the comms door. Bring the cloner." (stale line from stop 7, shown above the new one).
- After step 10, second ask: "Thandiwe's at her desk in the open plan. Try her laptop, then watch what happens when she gets up. Skip any of that you like, and pull the box out when you're ready."

Not asked again after step 11, because the run stopped at step 12. The second answer names the laptop and the unplug. The plan's W11 and W12 lines were not checked against it.

### Screenshots

- tmp/handover/demo_access_build/screens6/11_comms_cupboard.png (first entry, comms cupboard, after access granted).
- None other this run. The open_plan back-wall walk shot was not taken.

### Harness notes

- `interact` on a door with an RFID lock opens the reader minigame; `mg clickText` with the exact label "Emulate Lorna Easton FAC card" grants access. `mg close` then clears it.
- `moveToNear` takes `id`, and works with the door id (`door:open_plan->comms_cupboard`) and object ids.
- Phone: `openInventoryItem` `phone`, then `mg clickText` "Ama Owusu", then `mg clickText` "Where next?" (it repeats the top line first; read the last lines of the text).
- `dismiss` with label "×" closes the rota board overlay (it is not a minigame).
- An `eval` that uses a bare identifier fails when the name is not defined in the page; use string keys like `["thandiwe","yasmin"]`.

## Full route 12-19 (game 7537, server :3096)

Run by the full-route 12-19 agent. Keyless Rails from this worktree on 127.0.0.1:3096 (pid 243468, stopped afterwards; port free). Headless, setFPS(20) applied as `game.physics.world.setFPS(20)` with `smoothStep` off and fixed steps on (`fixedStep` read back true). Session log: tmp/handover/demo_access_build/s7_7537.jsonl. Game 7537 was not edited by script; all moves were through the harness.

Stopped at the call budget (about 60 calls). Steps 14 (part) to 19 not run.

### Step table

| Step | Result | Notes |
|---|---|---|
| 12 Open session | PASS | Read the rota (`rota_board`), dismissed with ×, then `moveToNear thandiwe_laptop` and `interact` in one shell call, no brief between. Session opened first try; `done_t_open_session` set. Screenshot 12. |
| 13 Yasmin's PC | PASS | Done straight after the laptop (after closing the laptop container). Locked sign-in; post-it added with "Add Postit to notepad" (the notes overlay opened on its own). Typed `Saffron-Ledger-31` into field 0, Enter. Desktop shows Client-Letters, Finance, Start. Screenshots 13, 14. Did not check that Yasmin was away at the time. |
| 14 Front desk USB and injector | STUCK (budget) | Signed in at the front desk keyboard as Delphine (`Merrin-Desk-4417`, field 0). USB hub: `interact usb_hub` opened the default examine ("USB hub") with no refusal toast and no `usb_refused:usb_hub` event. The USB stick has only an Examine action, so `inventoryAct` "Use" was refused as "no-menu". Injector at the implant socket not tried. Probable cause (inference, not checked): the hub has `requiresItem` but no `triggerOnInteract`, and the refusal sits in the triggerOnInteract branch (interactions.js ~1036). |
| 15 Rogue AP, Staff Wi-Fi clone | NOT RUN | |
| 16 Staff Wi-Fi key | NOT RUN | |
| 17 Unplug | NOT RUN | |
| 18 Comms ports (guest VLAN) | NOT RUN | |
| 19 Debrief and credits | NOT RUN | |
| Walk behind open_plan back wall | PARTIAL | Walked north in open plan to (171,-218). Screenshot 15 taken. Not confirmed that the player is behind the back wall; check the image. |

### Phone answers ("Where next?") and Ama's debrief

None captured this run. The phone was not asked after stop 12.

### Mistake to know about

One stray `interactNearest` call (typed by mistake in a shell call that was meant to search the scenario) ran an interact on the nearest chair in open plan before the rota read. It moved the player to a chair and did not touch any task or global that I saw. Not repeated.

### Harness notes

- `pressKey` Enter clears the "Continue?" title screen; the Mission Brief notes then need `mg close`.
- Headless recipe that worked: `const g=window.game.sys.game; g.loop.smoothStep=false; g.loop.minFps=1; window.game.physics.world.setFPS(20);` (`window.__test.setFPS` does not exist).
- `enter` with a room id walks through the doorway; `walk up` alone stopped short of a closed door.
- `mg close` on a notes overlay also closes the password screen beneath it (as before). Re-run `interact` on the PC after.
- A minigame (the laptop container) blocks `moveToNear` and `interact` until it is closed with `mg close`.
- `mg type` takes field index 0 for the password field on both PCs.

### Screenshots (screens6/)

- 12_open_session_thandiwe_laptop.png
- 13_yasmin_pc.png (locked sign-in)
- 14_yasmin_pc_desktop.png
- 15_open_plan_back_wall_walk.png
- 16_front_desk_signin_delphine.png

Not taken: rota board, USB hub, server and later stops, debrief, credits.

## Quick route 12-end (game 7558, server :3098)

Run by the quick-route 12-end agent. Keyless Rails from this worktree on 127.0.0.1:3098 (pid 243094, stopped and checked after the run; log in scratchpad server-3098.log). Session `tools/playtest/cmd.sh 7558`, headless, `game.physics.world.setFPS(20)` returned `[20, true]` (fixed steps on, not changed). Session log: tmp/handover/demo_access_build/s6r_7558.jsonl. No row, player state, need or unlock was edited by script. Game 7558 was resumed as is (reception, the Mission Brief notes after the reload, closed by `mg close`).

### Step table

| Step | Result | Notes |
|---|---|---|
| 12 Open session | PASS | Read the rota (`rota_board`), `dismiss` ×, then `moveToNear thandiwe_laptop` and `interact` in one shell call with no brief between. Laptop: "You're on Thandiwe Moyo's open screen. It ends when they come back or the screen locks." `done_t_open_session` set. No MISSED-WINDOW. Screenshot 07. |
| 17 Unplug | PASS | `moveToNear meeting_jack`, `interact meeting_jack` (network view "Drop box: meeting room"), `mg clickText "Unplug"`. Toasts: "Unplugged. Your session on MS-PARTNER-01 ended.", "Task Complete: Unplug the drop box", and "Task Complete: Use a laptop its owner left signed in". Screenshot 08. |
| Debrief | PASS, no debrief screenshot | "I'm done, let's talk." chosen twice (the first time the "Before the mission ends" overlay was kept, to ask the phone). Overlay listed seven optional full-route items. Ended with `endingOverlay end`. Screenshot 09 was not taken: I stepped through the lines by reading state, and the chat had closed before I went back for a shot. |
| Credits | PASS | `brief` shows `missionEnd: credits, creditsShowing: true`. Screenshot 10. |

Screenshot numbering: stop 12 took 07, so the unplug, debrief and credits are 08, 09 and 10 (no 09 debrief image exists).

### Ama's debrief lines (verbatim, in order)

1. "The doors only ever checked the card. Copy Lorna's and you're Lorna, as far as the reader's concerned. Julian's door held only because nobody copied his card."
2. "A saved connection on the front desk got you into Julian's PC. His door never came into it."
3. "And when the box came out, everything you'd opened through it went with it."
4. "Thanks. I'll write it up for the partners."

Line 3 is the `julian_ended_by_unplug` variant of the recap (ama.ink, `=== recap ===`). The optional "Anything you'd reached another way didn't need the box." line did not play because `done_t_implant`, `done_t_staff_wifi` and `done_t_yasmin_pc` were all unset. The labels D3, D4 and D5 do not exist in ama.ink, so the lines are not mapped to them.

### "Where next?" answers (phone)

- My one ask, after the unplug: "That's the lot. Come and find me at reception."
- Earlier thread lines (from the previous run, not asked again by me): "When you've had enough, pull the box out and see what drops." (the stop 12 ask) and "Box is out. Have a last look if you like, then come back to reception." (timed, after the unplug).

### Harness notes

- `pressKey` Space clears the "Continue?" title screen. The Mission Brief notes then need `mg close`.
- `enter` and `converse` are refused while a minigame is open ("minigame-active"). Close it first.
- `mg choose ["^I.m done"]` works for Ama's choices. `endingOverlay` takes `action` "keep" or "end".
- `mg clickText ["Skip"]` advances the debrief one line at a time. `mg getState` `dialogue.text` gives each line.

### Screenshots (screens6/quick/)

- 07_stop12_open_session.png
- 08_unplug_meeting_room.png
- 10_credits.png
- (09 not taken, see above)

## Full route 14-19 (game 7537, server :3096)

Run by the full-route 14-19 agent. Keyless Rails from this worktree on 127.0.0.1:3096, harness session log tmp/handover/demo_access_build/s8_7537.jsonl. Headless, setFPS(20), fixed steps on. Stopped at the context guard with Ama's first debrief choice on screen: step 19 not finished (no debrief lines, no credits).

### Real fault found and fixed (scenario data)

Step 14 hub: `usb_hub` had `requiresItem` and `policy: desk` but no `triggerOnInteract`. The engine's refusal (interactions.js, the `plantRefusal` branch) sits inside the `hasTriggerOnInteract` branch, so a plain interact gave only the examine text and no `usb_refused` event. The stick has only Examine in the tray, so there was no other way for a player to reach the refusal. Fix: added `"triggerOnInteract": [{ "type": "set_global", "key": "hub_stick_accepted", "value": true }]` to `usb_hub` (same shape as `priya_dock` in test_access_work). It can never fire, since the desk policy refuses the stick. Commit ed7ab5b12. NOT yet proved live: game 7537 holds its own scenario copy (re-checked: interact still gave "examine"), so a fresh game is needed (new-game, take the stick from the meeting room, interact `usb_hub`, expect the toast and `usb_refused:usb_hub`, then the phone line "Storage is blocked on that hub. A keyboard isn't storage."). The demo_access_tour test files and the validator were NOT run after this change; run them (flock, command in the brief).

### Step table

| Step | Result | Notes |
|---|---|---|
| 14 Hub refusal | FAIL on 7537 (fixed in data, unproved) | See above. |
| 14 Injector at implant socket | PASS | Was already signed in at the front desk (Delphine). `interact implant_socket` raised the confirm "Plug the keystroke injector into the front desk PC? ..."; `dismiss` "Plug it in"; injector became "Keystroke injector: Reception" (network link); `t_implant` done, `reception_pc_planted` set; the network view opened by itself. Screens 17 (confirm), 18, 19 (network view). |
| 15 Rogue AP | PASS with snag | `interact reception_plant_east` raised "Hide the pocket rogue AP in this plant?", `dismiss` "Hide it"; second interact opened the console (Recon, Clone, Log). Clone lists all four networks, MerrinSallow-Guest shown "Chosen" by default: must click Staff, then Start. Log: "Copy of MerrinSallow-Staff up (open), showing the key page. Waiting for someone to pick the copy." Screens 20-24. |
| 15 Thandiwe joins | PASS with snag | While I stayed in reception nothing happened for about 2 minutes. The global-change nudge is `fireOnlyWhenLoaded` (her room must be loaded). Entering open_plan fired the room-entry nudge and `done_t_capture_key` set within about 30 s. |
| 16 Capture and join | PASS | The tablet is in the meeting room (interact opens "Captures"): "Merrin & Sallow, reception / MerrinSallow-Staff / MerrinSallow-Staff, rogue access point / VZ4h0GqB / Thandiwe's laptop picked the copy and the key page took the Staff key (proof: planted)." Typed the key at `staff_ap` ("Join Wi-Fi", Network key, Submit, field 0): "Joined. Reaches 6 hosts." Guest AP: "Joined. Reaches 0 hosts. Nothing answers on this network." Both tasks done. Screens 25-30. |
| 17 Unplug | PASS with snag | `interact meeting_jack` opens the drop box network view with an "Unplug" button; `mg clickText` "Unplug" unplugged at once, with NO "Unplug it" confirm (a `dismiss` "Unplug it" found nothing). Box returned as "Network drop box". `t_debrief` opened, `julian_ended_by_unplug` set. Screens 31, 32. |
| 18 Managed port | PASS | `interact managed_port`: confirm "Try the network drop box in this managed switch port?", Plug it in; toast "Port security: this device is not the one registered to this port." Examine line: "A wall port running to a managed switch with port security on." Patch panel: ports M01 (managed, box icon), G02 (guest), D03 (not patched), 04-24 empty. Click G02: "Plug the network drop box into the patch panel's guest port?" Plug it in: "Drop box: guest VLAN port ... On Merrin & Sallow guest network ... Nothing answers on this network." `t_guest_port` done. Screens 33-39. |
| 19 Debrief | NOT FINISHED | Back at reception, `converse ama` gave: "Right. Before we wrap up, anything else you want to try?" with options "1. I'll have another look round." and "2. I'm done, let's talk." The conversation is still open on game 7537 (harness session 7537 may still be up). Debrief lines and credits not captured. |

### Phone answers ("Where next?"), word for word

- After the clone: "She's signed in and sitting right there. Give it a minute, or read the coffee rota on the wall and watch her go." (stale stop 12 line), then asked again: "Give it a moment. Thandiwe's about to check her email, and her laptop should join your copy." then "If she doesn't, carry on. The Wi-Fi stops still work after the box comes out."
- After the capture: "You've got the Staff key. Join the Staff Wi-Fi and compare it with the guest one."
- After the unplug (timed): "Box is out. Take it to the comms cupboard and see what the ports in there make of it. Then come back to reception." Asked: "Take the box to the comms cupboard. Try the managed port, then the patch panel."
- After the managed port refusal (timed): "That port knows what's meant to be plugged into it. Try the patch panel, see where its spare port goes." Asked after both ports: "That's the lot. Come and find me at reception."

### Run sheet corrections (DEMO_ACCESS_TOUR_RUN_SHEET.md, not yet edited)

- Row 14: "Try the USB stick at the hub" works only after the data fix; the refusal toast text was not seen live (not proved). Keep, but retest on a fresh game.
- Row 15: add the snag "Clone shows Guest as Chosen; click Staff, then Start." Add: "Thandiwe only joins if open plan is loaded. If you stay in reception, walk into open plan; the entry nudges her. About 30 s."
- Row 15 phone: add the stale first reply ("She's signed in and sitting right there...") shown above the right one.
- Row 16: the Staff key is shown on the capture tablet in the meeting room (also in the captures viewer), not in reception; say "go back to the meeting room tablet". The join is at the Staff access point in reception.
- Row 17 (quick and full): no "Unplug it" confirm. Click the box, then "Unplug". Phone line quoted in the quick row is correct.
- Row 18: the refusal is a toast "Port security: this device is not the one registered to this port." The phone follow-up after 4 s matches. The patch panel's spare port is G02; click it, confirm "Plug it in". Result "Nothing answers on this network."
- Row 19: unchecked (debrief and credits).

### Left for the next agent

1. Fresh game on :3096 (do not use db tasks other than new-game.rb): prove the hub refusal, then run all demo_access_tour*_test.rb under flock with the brief's env, and the validator with --no-graph.
2. Finish step 19 on game 7537 (pick "I'm done, let's talk.", read the "Before the mission ends" panel, debrief lines, credits) or on a fresh game; add screens 40+ and the debrief lines here.
3. Edit the run sheet with the corrections above.
4. Stop the server: pid 317772 (port 3096) and harness `tools/playtest/session-stop.sh 7537`.

### Screenshots (screens6/)

17_implant_confirm, 18_implant_done, 19_implant_network_view, 20_hide_ap_confirm, 21_ap_console, 22_ap_clone_list, 23_ap_clone_started, 24_ap_log, 25_phone_after_clone, 26_phone_after_capture, 27_capture_tablet, 28_join_staff_wifi, 29_join_staff_result, 30_guest_wifi, 31_unplug_confirm (network view with the Unplug button), 32_unplugged, 33_phone_after_unplug, 34_managed_port_refusal (the confirm), 35_managed_port_result (the toast), 36_patch_panel, 37_patch_panel_g02, 38_patch_panel_plugged, 39_phone_after_port. The hub refusal shot (the brief's first) does not exist: the refusal did not fire on 7537.

## Step 19 and hub proof (live checks A and B, server :3096)

Keyless Rails from this worktree on 127.0.0.1:3096 (pid 348308, stopped by PID afterwards, port free). Started with `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true BUNDLE_PATH=<worktree>/vendor/bundle RBENV_VERSION=2.7.8 bundle exec rails server -b 127.0.0.1 -p 3096`. Headless, `game.physics.world.setFPS(20)` via `eval` (fixed steps left on). No row, player state, need or unlock edited by script. Sessions: game 7537 log `s9_7537.jsonl`; game 7585 log `s9b_7585.jsonl` (both in tmp/handover/demo_access_build/). Server log: scratchpad `server-3096.log`.

### Check A: step 19 on game 7537 (result: PARTIAL)

- Resumed at Ama's first debrief question. `converse` with choices `I.m done, let.s talk` chose "I'm done, let's talk." The conversation then ran through the debrief and closed the mission in that one call, so the "Before the mission ends" panel was never on screen to a screenshot. Missed: no screen 40 for the panel or the debrief.
- `brief` after the call: `missionEnd: credits, creditsShowing: true`. The server log shows `mission_concluded_at` written.
- Screen 41 (credits): `screens6/41_credits.png`.

Ama's lines after the choice, verbatim and in order (from the converse transcript):

1. "The doors only ever checked the card. Copy Lorna's and you're Lorna, as far as the reader's concerned. Julian's door held only because nobody copied his card."
2. "A saved connection on the front desk got you into Julian's PC. His door never came into it."
3. "And when the box came out, everything you'd opened through it went with it."
4. "Anything you'd reached another way didn't need the box."
5. "Thanks. I'll write it up for the partners."

Line 4 played this time, where the earlier run on 7537 did not. The harness chose no option after the first choice.

### Check B: hub refusal in a fresh game (result: PASS)

- Game 7585, created with `new-game.rb demo_access_tour` (fixed scenario copy at HEAD). Tutorial prompt dismissed ("NO, I'LL FIGURE IT OUT").
- Quick start: Ama `^Quick version`; visitor card picked up from the counter; meeting room door opened with VISITOR-07 (`enter meeting_room`; a plain `interact` on the RFID door did not open it); USB stick (`demo_stick`) taken, inventory "USB stick".
- Back to reception, `interact usb_hub`:
  - Try 1 (interact sent 19:12:34.0, returned 19:12:38.4): harness reported `no-effect-confirmed`. The phone line is in the phone history with a client timestamp of 19:12:38.9, about 4 s after this refusal. The toast was not captured on this try.
  - Try 2 (19:12:53.7): same harness reply. Screenshot taken straight after: toast "USB storage is disabled on this PC." Screen `screens6/42_hub_refusal.png`.
- Event log: server sync at 19:12:59 carries `triggeredEvents` `"ama_phone:usb_refused:usb_hub:14"`.
- Phone line in the same sync: "Storage is blocked on that hub. A keyboard isn't storage."
- Expected from the brief: all three items seen (toast, event, phone line). The one oddity is the harness's `no-effect-confirmed` on both tries, even though the effect happened. Recorded as a harness-reporting quirk, not a game fault.

### Left open

- Check A: the debrief panel and debrief screenshot (screen 40) are missing. Replaying needs a new game run to the debrief, which I did not do.
- The demo_access_tour test files and the validator were not run in this pass.

## Cake reload (fixed probe)

Run by a Haiku agent on keyless server 127.0.0.1:3099 (worktree p-build-access, puma PID 245962 at time of run, pid file in scratch; started with `-P` because test/dummy/tmp/pids/server.pid belongs to another live server on 3098). BUNDLE_PATH=<main>/vendor/bundle, RBENV_VERSION=2.7.8. Probe: copy of tools/playtest/showcase-bc1-cake-reload.mjs at p-ol-showcase commit 5b5381664 (scratch copy, not committed). Command:
`node <scratch>/cake/showcase-bc1-cake-reload.mjs --scenario demo_access_tour --room open_plan --cake cake --port 3099 --cases 1,2,3,4 --eaters thandiwe,yasmin --staff thandiwe,yasmin --rooms open_plan,kitchen --task t_open_session --calm 1`
Note: `--staff` and `--calm` are read in the probe source (lines 39 to 40) but not in its header comment.

Results: case 1 PASS (game 7575). Cases 2, 3 and 4 FAIL (games 7576, 7582, 7592). The first run was killed by an outer 590 s timeout during case 3 (exit 124); cases 3 and 4 were rerun separately (output scratch cake34.txt).

Cake persistence across reload: case 1 (held) kept in inventory; case 2 (down, untouched) kept at the same place in reception (160,247) and servings 2; case 3 (one slice gone) was not measured because the cake had never been eaten (see below); case 4 not measured for the same reason.

Staff eating after reload: no NPC ever walked to the cake in any case (walked:false, ate:false for thandiwe and yasmin). Cause in the probe: `drop()` runs before `whereAll()` enters the target room, so the cake is dropped in the start room (reception), which open-plan staff never see. Every failing case has it in reception.

player_state growth: NOT measured. The probe does not record it, and no GET endpoint returns player_state (routes.rb has no state route; show renders HTML). Needs a before and after snapshot added to the probe or a read-only rails runner query.

22 s wait: did not hang in this run. Each case printed "wait 22s (before reload)" and continued. Not reproduced.

Key output (verbatim):
```
case 1: game 7575
  wait 22s (before reload)
  case 1: PASS {"pass":true,"before":{"found":[],"inv":true,"loaded":["reception","open_plan"],"servings":2,"magnet":false},"after":{"found":[],"inv":true,"loaded":["reception","open_plan"],"servings":2,"magnet":false},"errs":["console: Failed to load resource: the server responded with a status of 400 (Bad Request)","console: Failed to load resource: net::ERR_FAILED"]}
case 2: game 7576
  wait 22s (before reload)
  case 2: FAIL {"pass":false,"placed":true,"kept":true,"eat":{"npc":"thandiwe","walked":false,"ate":false},"dropEvents":["item_dropped:cake"],"before":{"found":[{"room":"reception","x":160,"y":247,"elevation":0}],"inv":false,"loaded":["reception"],"servings":2,"magnet":true,"magnetServings":2},"after":{"found":[{"room":"reception","x":160,"y":247,"elevation":0}],"inv":false,"loaded":["reception","open_plan"],"servings":2,"magnet":true,"magnetServings":2},"events":[],"errs":["console: Failed to load resource: the server responded with a status of 400 (Bad Request)","console: Failed to load resource: net::ERR_FAILED"]}
case 3: game 7582
  wait 22s (before reload)
  case 3: FAIL {"pass":false,"first":{"npc":"thandiwe","walked":false,"ate":false},"kept":false,"second":{"npc":"yasmin","walked":false,"ate":false},"gone":false,"finishedEvent":false,"task":"active","before":{"found":[{"room":"reception","x":160,"y":247,"elevation":0}],"inv":false,"loaded":["reception"],"servings":2,"magnet":true,"magnetServings":2},"mid":{"found":[{"room":"reception","x":160,"y":247,"elevation":0}],"inv":false,"loaded":["reception"],"servings":2,"magnet":true,"magnetServings":2},"after":{"found":[{"room":"reception","x":160,"y":247,"elevation":0}],"inv":false,"loaded":["reception","open_plan"],"servings":2,"magnet":true,"magnetServings":2}
case 4: game 7592
  wait 22s (before reload)
  case 4: FAIL {"pass":false,"gone":false,"finishedEvent":false,"taskBefore":"active","taskAfter":"active","after":{"found":[{"room":"reception","x":160,"y":247,"elevation":0}],"inv":false,"loaded":["reception","open_plan"],"servings":2,"magnet":true,"magnetServings":2}}

BC1 demo_access_tour
| Case | Game | Result |
|---|---|---|
| 3 | 7582 | FAIL |
| 4 | 7592 | FAIL |
```


## Cake reload (probe a8d7caae8)

Probe: `tools/playtest/showcase-bc1-cake-reload.mjs` at a8d7caae8 (scratch copy). Re-run at d3fadda9d (staff held again right after reload; the only diff). Size reader: `player-state-size.rb` at a8d7caae8, read-only (`Game.find`, `to_json`); copied into this worktree for the run, moved to `tmp/delete/`, not committed. Server: keyless, :3099, started with `BUNDLE_PATH=<main>/vendor/bundle RBENV_VERSION=2.7.8`, stopped by PID 506349 afterwards. Args: `--scenario demo_access_tour --room open_plan --cake cake --port 3099 --eaters thandiwe,yasmin --staff thandiwe,yasmin --rooms open_plan,kitchen --task t_open_session --calm 1` (wait 22 s, grow 2048 by default). Result files: `tmp/bc1/demo_access_tour-case<N>-game<id>.json`.

| Probe | Case | Game | Result | Servings before / after reload | Cake before / after reload | Staff ate it | player_state bytes | Growth per key |
|---|---|---|---|---|---|---|---|---|
| a8d7caae8 | 1 | 7597 | PASS | 2 / 2 | in inventory / in inventory | no | 4493 -> 4829 (+336) | notes +335, syncWrites +1 |
| a8d7caae8 | 2 | 7600 | FAIL | 0 / 0 | dropped in open_plan, then none (no room object, no magnet) / none | not recorded; both staff walked to the magnet and left their posts; servings fell 2 -> 0 during the drop and settle wait | 4471 -> 4935 (+464) | notes +335, syncWrites +126, globalVariables +3 |
| a8d7caae8 | 3 | 7606 | FAIL | 2 / 0 (one visit took it from 2 to 0) | open_plan, then none | Thandiwe (walked and ate); Yasmin did not walk | 4471 -> 4935 (+464) | notes +335, syncWrites +126, globalVariables +3 |
| d3fadda9d | 2 | 7612 | FAIL | 0 / 0 | dropped in open_plan, then none | not recorded; both staff saw the magnet and left their posts before the reload | 4471 -> 4935 (+464) | notes +335, syncWrites +126, globalVariables +3 |
| d3fadda9d | 3 | 7617 | FAIL | 2 / 0 (Thandiwe ate it in one visit, 2 -> 0; magnet kept at 0 servings until the reload) | open_plan, then none | Thandiwe (walked and ate); Yasmin did not walk | 4593 -> 5057 (+464) | notes +335, syncWrites +126, globalVariables +3 |

Findings:
- Case 1 passes on a8d7caae8. The cake stays in the inventory across the reload and no one eats it.
- Cases 2 and 3 fail before the reload and do not test what they were written to test. In both probe commits the cake's servings are already 0 at the reload point. The loss happens between the drop and the reload (the 22 s settle), so the d3fadda9d hold after reload does not change the result. Its effect on the reload is not measured here.
- The probe assumes one slice per visit. In this build a visit takes the whole cake (2 -> 0), so case 3's "kept, one fewer serving" check cannot pass as written.
- `calm()` sets hunger and social to 100 for the listed staff before the drop. Both staff still walked to the cake, so the cause is not explained here.
- player_state growth: each reload adds 335 bytes to `notes` (one Mission Brief entry). Case 2 and 3 runs also add 126 bytes to `syncWrites` and 3 to `globalVariables`. Every run stays under the 2048-byte limit. Growth in `syncWrites` is not reload-specific and was not checked further.

Key output (verbatim, from `<scratch>/cake3.txt`; the d3fadda9d case 3 run is in the same file):
```
=== CASE 1 19:24:57
case 1: game 7597
  wait 22s (before reload)
  player_state 4493 -> 4829 bytes (+336) {"notes":335,"syncWrites":1}
  case 1: PASS {"pass":true,"before":{"found":[],"inv":true,"loaded":["reception","open_plan"],"servings":2,"magnet":false},"after":{"found":[],"inv":true,"loaded":["reception","open_plan"],"servings":2,"magnet":false},"errs":["console: Failed to load resource: the server responded with a status of 400 (Bad Request)","console: Failed to load resource: net::ERR_FAILED"],"playerState":{"before":4493,"after":4829,"grew":336,"growKeys":{"notes":335,"syncWrites":1},"ok":true}}
| Case | Game | Result | player_state bytes |
| 1 | 7597 | PASS | 4493 -> 4829 |
=== CASE 2 19:26:26
case 2: game 7600
  wait 22s (before reload)
  player_state 4471 -> 4935 bytes (+464) {"notes":335,"syncWrites":126,"globalVariables":3}
  case 2: FAIL {"pass":false,"placed":false,"kept":false,"eat":{"npc":"thandiwe","walked":false,"ate":false},"dropEvents":["item_dropped:cake"],"before":{"found":[],"inv":false,"loaded":["reception","open_plan"],"servings":0,"magnet":false},"after":{"found":[],"inv":false,"loaded":["reception"],"servings":0,"magnet":false},"events":[],"errs":["console: Failed to load resource: the server responded with a status of 400 (Bad Request)","console: Failed to load resource: net::ERR_FAILED"],"playerState":{"before":4471,"after":4935,"grew":464,"growKeys":{"notes":335,"syncWrites":126,"globalVariables":3},"ok":true}}
| Case | Game | Result | player_state bytes |
| 2 | 7600 | FAIL | 4471 -> 4935 |
=== CASE 3 19:33:31
case 3: game 7606
  wait 22s (before reload)
  player_state 4471 -> 4935 bytes (+464) {"notes":335,"syncWrites":126,"globalVariables":3}
  case 3: FAIL {"pass":false,"first":{"npc":"thandiwe","walked":true,"ate":true},"kept":false,"second":{"npc":"yasmin","walked":false,"ate":false},"gone":true,"finishedEvent":false,"task":"active","before":{"found":[{"room":"open_plan","x":32,"y":23,"elevation":0}],"inv":false,"loaded":["reception","open_plan"],"servings":2,"magnet":true,"magnetServings":2},"mid":{"found":[],"inv":false,"loaded":["reception","open_plan"],"servings":0,"magnet":false},"after":{"found":[],"inv":false,"loaded":["reception","open_plan"],"servings":0,"magnet":false},"events":[],"errs":["console: Failed to load resource: the server responded with a status of 400 (Bad Request)","console: Failed to load resource: net::ERR_FAILED"],
| Case | Game | Result | player_state bytes |
| 3 | 7606 | FAIL | 4471 -> 4935 |
=== d3fadda9d CASE 2 19:40:35
case 2: game 7612
  wait 22s (before reload)
  player_state 4471 -> 4935 bytes (+464) {"notes":335,"syncWrites":126,"globalVariables":3}
  case 2: FAIL {"pass":false,"placed":false,"kept":false,"eat":{"npc":"thandiwe","walked":false,"ate":false},"dropEvents":["item_dropped:cake","npc_saw_magnet:thandiwe","npc_left_post:thandiwe","global_variable_changed:thandiwe_laptop_screen_locked","global_variable_changed:thandiwe_laptop_owner_away","workstation_owner_left:thandiwe_laptop","npc_stood","npc_saw_magnet:yasmin","npc_left_post:yasmin","global_variable_changed:yasmin_pc_screen_locked","global_variable_changed:yasmin_pc_owner_away","workstation_owner_left:yasmin_pc","workstation_screen_changed:yasmin_pc","workstation_lock_heard:yasmin_pc","npc_stood"],"before":{"found":[],"inv":false,"loaded":["reception","open_plan"],"servings":0,"magnet":fal
| Case | Game | Result | player_state bytes |
| 2 | 7612 | FAIL | 4471 -> 4935 |
=== d3fadda9d CASE 3 19:47:38
case 3: game 7617
  wait 22s (before reload)
  player_state 4593 -> 5057 bytes (+464) {"notes":335,"syncWrites":126,"globalVariables":3}
  case 3: FAIL {"pass":false,"first":{"npc":"thandiwe","walked":true,"ate":true},"kept":false,"second":{"npc":"yasmin","walked":false,"ate":false},"gone":true,"finishedEvent":false,"task":"active","before":{"found":[{"room":"open_plan","x":40,"y":23,"elevation":0}],"inv":false,"loaded":["reception","open_plan"],"servings":2,"magnet":true,"magnetServings":2},"mid":{"found":[{"room":"open_plan","x":40,"y":23,"elevation":0}],"inv":false,"loaded":["reception","open_plan"],"servings":0,"magnet":true,"magnetServings":0},"after":{"found":[],"inv":false,"loaded":["reception","open_plan"],"servings":0,"magnet":false},"events":[],"errs":["console: Failed to load resource: net::ERR_FAILED","console: Failed to load re
| Case | Game | Result | player_state bytes |
| 3 | 7617 | FAIL | 4593 -> 5057 |
exit=1
```

## Cake reload (probe 8e264d2e4)

Run on keyless server 127.0.0.1:3099 from this worktree (build/demo-access-tour, engine main a0290141b), stopped afterwards by PID. Probe: tools/playtest/showcase-bc1-cake-reload.mjs at 8e264d2e4, run from a scratchpad copy with m01-ol-lib.mjs. The probe calls tools/playtest/player-state-size.rb, which is not on main, so a copy from 8e264d2e4 was placed in the worktree for the run and moved to tmp/delete/ afterwards. Games are made by the probe through new-game.rb. Command: `node <scratch>/cake4/showcase-bc1-cake-reload.mjs --scenario demo_access_tour --room open_plan --cake cake --port 3099 --eaters thandiwe,yasmin --rooms open_plan,kitchen --staff thandiwe,yasmin` with `--cases 1,2` (task t_open_session) and `--cases 3,4 --task ""`.

Final results (games whose JSON is in tmp/bc1/):

| Case | Game | Result | Servings before / after reload | Cake | Eater | player_state bytes before -> after (growth by key) |
|---|---|---|---|---|---|---|
| 1 cake held | 7640 | PASS | 2 / 2 | In inventory before and after, in no room | none | 4493 -> 4971 (+478: notes +335, syncWrites +76, globalVariables +67) |
| 2 cake down, untouched | 7643 | FAIL | 2 / 2 | open_plan (40,23) before; after reload only reception was loaded and no cake was found, magnet false | none (thandiwe did not walk) | 4687 -> 5165 (+478: notes +335, syncWrites +76, globalVariables +67) |
| 3 one slice taken | 7648 | PASS | 2 -> 1 / 1 | open_plan (40,23), same spot before and after | thandiwe, first slice (before reload); thandiwe, second slice (after reload, event magnet_serving thandiwe left 0; yasmin turned back, reason gone) | 4856 -> 5269 (+413: notes +335, syncWrites +77, globalVariables +1) |
| 4 cake finished | 7650 | PASS | 0 / 0 | gone from every room and the inventory after reload; magnet_finished:cake fired | not recorded (case 4 returns no event list) | 4471 -> 4935 (+464: notes +335, syncWrites +126, globalVariables +3) |

Discarded games: 7636 to 7639 (first attempt, player-state script missing from the worktree, so player_state is null and cases 1 to 3 were marked FAIL by the probe; the attempt was stopped during case 4). Earlier 7555 to 7600 games are from prior runs.

Notes:
- Case 4 on the first full run (game 7647) failed only on the task check. `t_open_session` is the laptop task, not a cake task. The scenario has no cake task, so the task check must be off for this scenario (`--task ""`). Case 1 and 2 do not read the task.
- Case 2 is not stable. Game 7637 (first attempt) passed placed, kept and eat; game 7643 (second run, same setup) failed with no cake found after reload. In 7643 only reception was loaded when the after-read ran, so the read may have come before open_plan loaded. Not separated; the probe does not re-read after entering open_plan.
- Case 3 is not stable either. Game 7644 (second run) failed: 1 serving before reload, 0 after, and the last slice went during the 22 s wait after reload. Game 7648 passed, but the second slice was eaten by thandiwe, not yasmin, which breaks the one-slice-each expectation. The probe marks it PASS because it checks servings, not who ate. The probe does not record the pre-reload serving event (its recorder is reinstalled after reload).
- The growth by key is the one-time Mission Brief note (notes +335) plus syncWrites (+76 to +152) and globalVariables (+1 to +68) on each reload. syncWrites growth is not explained here and should be checked against the delta rule. All growth is under the 2048 limit.
- Warnings: none. No unknown or unregistered id warning appeared in the final runs.
- Staff held after reload: the probe holds staff with calm() after the reload wait, yet an NPC ate during the post-reload wait in game 7644, and thandiwe ate after the reload in 7648. Consistent with the probe comment about needs resetting on reload. Not diagnosed.

## Cake reload run 5 (main 69d8bf05a)

Run on keyless server 127.0.0.1:3090 from this worktree (build/demo-access-tour, head f99f9b5fd, main 69d8bf05a with the magnet perPerson fix), stopped by PID 2235970 afterwards (port free; the :3001 server was not touched). Started with `env -u GEMINI_API_KEY BREAK_ESCAPE_STANDALONE=true BUNDLE_PATH=<main>/vendor/bundle RBENV_VERSION=2.7.8 bundle exec rails server -b 127.0.0.1 -p 3090`. Headless, setFPS(20), fixed steps on. Probe: `showcase-bc1-cake-reload.mjs` at 8e264d2e4 with m01-ol-lib.mjs (identical on HEAD), run from a scratch copy in tmp/delete/cake5/ (gitignored, not committed). `player-state-size.rb` is on this branch, so no copy was needed.

Command (both runs): `node <scratch>/probe.mjs --scenario demo_access_tour --room open_plan --cake cake --port 3090 --eaters thandiwe,yasmin --staff thandiwe,yasmin --rooms open_plan,reception --task ""`, with `--cases 1,2,3,4` (run A) and `--cases 2,3` (run B, fresh games). Each case made its own game through new-game.rb.

Scratch copy changes (no repo file changed): (a) case 3 keeps the event list read just before the reload, because reload resets the recorder; (b) `STOP_AFTER_DROP` stops case 2 after the drop and settle, used only to make the growth game; (c) the growth script prints every player_state key per load, not only notes.

Eaters are read from `magnet_serving:cake` (npcId, left). Case 3 has one slice before the reload, so only one eater is possible there.

| Run | Case | Game | Result | Servings before / after reload | Eaters (magnet_serving) | player_state bytes before -> after (growth by key) |
|---|---|---|---|---|---|---|
| A | 1 cake held | 7694 | PASS | 2 / 2 | none (held) | 4493 -> 4829 (+336: notes +335, syncWrites +1) |
| A | 2 cake down | 7700 | PASS | 2 / 2 | thandiwe, after reload (left 1) | 4687 -> 5165 (+478: notes +335, syncWrites +76, globalVariables +67) |
| A | 3 one slice | 7706 | FAIL (kept check, see below) | 2 -> 1 before; 0 after | before: thandiwe (left 1); after: yasmin (left 0), inside the post-reload settle | 4978 -> 5391 (+413: notes +335, syncWrites +77, globalVariables +1) |
| A | 4 finished | 7715 | PASS | 0 / 0 | not recorded (probe returns no event list) | 4471 -> 5077 (+606: notes +335, syncWrites +201, globalVariables +70) |
| B | 2 cake down | 7719 | FAIL (placed, kept, walk) | 2 / 2 by count; cake not found after reload | none (no walk) | 4688 -> 5024 (+336: notes +335, syncWrites +1) |
| B | 3 one slice | 7730 | PASS | 2 -> 1 / 1 | before: thandiwe (left 1); after: thandiwe (left 0), yasmin turned back (reason gone) | 4977 -> 5390 (+413: notes +335, syncWrites +77, globalVariables +1) |

Notes on each row:
- 7706 (case 3, run A): the probe's `kept` check reads servings after the reload's 22 s settle, and yasmin took the last slice inside that settle. The 0 is therefore not the state right after the reload. The reload did not lose the cake. Not counted as a persistence failure, but the case does not prove the post-reload count.
- 7730 (case 3, run B): the probe's `second.npc` says yasmin, but the event shows thandiwe ate the second slice after the reload. This is the known accepted limit (per-person `ate` resets on reload). The probe's `ate` check only sees the count, so it passes.
- 7719 (case 2, run B): the drop landed at (40,-33), not (40,23) as in every other game in this run. After the reload the after-read loaded only reception and found no cake. This is the same read-before-load race seen in run 4 (7643). The probe's `whereAll` enters open_plan with 1.2 s waits and ignores errors. Not diagnosed further.
- 7700 (case 2): the cake was untouched until the probe's own walk test, so thandiwe's slice is the first after the reload, not a second.

Eater summary against the expectation:
- Before any reload, only thandiwe ate (one slice, in both case 3 games). Yasmin did not eat before a reload in either game. Case 3 takes one slice before the reload by design, so "one each before any reload" cannot be seen in case 3 as written.
- After a reload, the second slice went to thandiwe in 7730 (accepted limit) and to yasmin in 7706 (during the settle).

Stability:
- Case 2: 1 pass, 1 fail (room-load race in 7719).
- Case 3: 1 pass (7730), 1 fail (7706, settle eat).

Growth check (game 7733, case 2 stopped after the drop and settle, cake down, untouched; `brief-note-reload-growth.mjs`, 5 reloads, output per key via the scratch copy):

| Load | notes | syncWrites | scenarioClock | globalVariables | total bytes |
|---|---|---|---|---|---|
| 0 | 599 | 221 | 19 | 721 | 4208 |
| 1 | 598 | 277 | 19 | 721 | 4263 |
| 2 | 598 | 277 | 19 | 721 | 4263 |
| 3 | 598 | 277 | 19 | 721 | 4263 |
| 4 | 598 | 277 | 20 | 721 | 4264 |
| 5 | 598 | 277 | 20 | 721 | 4264 |

- Script result: PASS (notes flat after the first load; 0 page errors; client shows 1 Mission Brief note of 2 notes, mode on_resume).
- 47 keys in total. Only notes, syncWrites and scenarioClock changed. globalVariables is flat at 721 bytes in all six loads.
- notes: -1 byte on the first reload, then flat.
- syncWrites: +56 on the first reload, then flat. It does not grow per reload.
- scenarioClock: +1 at load 4 only. A clock value, not growth.
- Steady state from load 1: total 4263 to 4264 bytes. Nothing keeps growing in this check. The per-reload growth in the probe (+336 to +606) is the one-off Mission Brief note (+335) plus a one-time syncWrites step and, in some cases, a globalVariables step.

Odd things:
- The first attempt (run chain with no bundler env) made no games. `new-game.rb` failed under the probe because the child `bin/rails` needs `BUNDLE_PATH` and `RBENV_VERSION` exported. Re-run with them exported.
- The probe's `second.npc` in case 3 is the assumed eater (EATERS[1]), not the real one. Use the magnet_serving events.
- The probe does not record case 4 eaters.
- Console `ERR_FAILED` entries are the aborted /tts requests (expected). Server log holds only Ruby gem warnings.
- The primary working directory changed to the main checkout during the run. The worktree was used through absolute paths only.

## Cake reload run 6 (probe b1db1c1eb)

Probe: `tools/playtest/showcase-bc1-cake-reload.mjs` at b1db1c1eb, copied unchanged to tmp/delete/cake6/ with its helper `m01-ol-lib.mjs` (not committed). Run from the worktree root. Keyless server on 127.0.0.1:3093 (puma PID 2470609, pid file tmp/delete/cake6/server.pid), stopped by PID afterwards. Port 3001 was not touched. BUNDLE_PATH and RBENV_VERSION=2.7.8 exported; BREAK_ESCAPE_STANDALONE=true. The probe header lists the same options as run 5 (`--at`, `--near`, `--wait`, `--timeout`, `--staff`, `--calm`, `--grow`); none were used beyond run 5's args.

Commands:
- Run 6A (cases 1 to 4, one game each): `node <scratch>/showcase-bc1-cake-reload.mjs --scenario demo_access_tour --room open_plan --cake cake --port 3093 --cases 1,2,3,4 --eaters thandiwe,yasmin --staff thandiwe,yasmin --rooms open_plan,reception --task ""` (log tmp/delete/cake6/run6a.txt)
- Run 6B (cases 2 and 3, fresh games): same with `--cases 2,3` (log tmp/delete/cake6/run6b.txt)

Eaters are read from `magnet_serving:cake` events. Servings before are the probe's read after the 22 s settle, before the reload. "Read after reload" is the probe's whereAll read, which runs after its 22 s post-reload settle.

| Run | Case | Game | Result | Servings before / after reload | Eaters (magnet_serving) | enterRoom refusals / unloaded rooms | player_state bytes before -> after (growth by key) |
|---|---|---|---|---|---|---|---|
| 6A | 1 cake held | 7786 | PASS | 2 / 2 | none (held) | none / none | 4635 -> 4971 (+336: notes +335, syncWrites +1) |
| 6A | 2 cake down | 7791 | FAIL (kept) | 2 / 1 | yasmin (left 1) during the post-reload settle; thandiwe (left 0) in the probe's post-reload walk | none / none | 4829 -> 5165 (+336: notes +335, syncWrites +1) |
| 6A | 3 one slice | 7798 | FAIL (kept) | 2 -> 1 before reload (thandiwe, left 1) / 0 | yasmin (left 0) during the post-reload settle; probe's second-slice check saw 0 servings, ate false | none / none | 4856 -> 5411 (+555: notes +335, syncWrites +152, globalVariables +68) |
| 6A | 4 cake finished | 7807 | PASS | not read / 0 | not recorded (no event list) | none / none | 4471 -> 4690 (+219: notes +335, syncWrites -119, globalVariables +3) |
| 6B | 2 cake down | 7817 | FAIL (kept) | 2 / 1 | yasmin (left 1) during the post-reload settle; thandiwe (left 0) in the probe's post-reload walk | none / none | 4687 -> 5023 (+336: notes +335, syncWrites +1) |
| 6B | 3 one slice | 7821 | FAIL (kept) | 2 -> 1 before reload (thandiwe, left 1) / 0 | thandiwe (left 0) during the post-reload settle: same NPC, second slice after a reload (accepted limit); probe's yasmin walk did not start | none / none | 4853 -> 5266 (+413: notes +335, syncWrites +77, globalVariables +1) |

Results against the expected all-pass: cases 1 and 4 pass in both runs. Cases 2 and 3 fail in both runs (games 7791, 7798, 7817, 7821), all on the `kept` check.

Reading of the failures:
- The cake is not lost. `placed` passes in both case 2 games (same spot in open_plan at 40,23 before and after the reload). Nothing is in the inventory and the magnet is still registered after the reload.
- The count drops during the probe's post-reload 22 s settle, before whereAll reads it. In every failing game a staff member took a slice in that settle. `kept` compares against the earlier count, so it fails.
- The post-reload hold does not take effect. In all six games `window.__test.needs.ids()` is empty right after the reload (`atReload.ids` = []), and the probe's calm wait for the staff's needs states ends in a 90 s TimeoutError (`diag.calmedAt`). The staff are not held through the settle, so they are free to eat. The probe's calm only works once their rooms have loaded. Root cause not diagnosed further.
- Case 3 in 7821 is the accepted limit: thandiwe ate the second slice after the reload, as the same NPC. It is recorded as the accepted limit, not a failure, but the probe still marks it FAIL because the count moved during the settle.
- The earlier 7643 read-before-load race (case 2) did not recur. No game in run 6 shows an enterRoom refusal or an unloaded room.

Other observations:
- enterRoom: no refusal and no unloaded room in any of the six games (`enterFails` absent, `unloaded` empty).
- player_state: every reload adds the one-off Mission Brief note (notes +335) plus a syncWrites step (+1 to +152) and, in some games, globalVariables (+1 to +68). Every run is under the 2048 byte limit (`ok` true). The syncWrites growth in 7798 (+152) and 7821 (+77) is larger than in run 5 and was not checked against the delta rule.
- Console: 400 and ERR_FAILED entries from the aborted /tts route, the same as earlier runs.
- No game record was edited. Scenario and engine files were not changed. The uncommitted dungeon_graph changes were left alone.

## Cake reload run 7 (probe 7ebdae49e)

Probe: `tools/playtest/showcase-bc1-cake-reload.mjs` at 7ebdae49e (commit "hold present staff continuously after a reload until the eat step"), copied unchanged to tmp/delete/cake7/ with its helper `m01-ol-lib.mjs` from the same commit (not committed). Run from the worktree root. Keyless server on 127.0.0.1:3093 (puma PID 2906649, pid file tmp/delete/cake7/server.pid), stopped by PID afterwards; port 3093 free. Port 3001 was not touched. BUNDLE_PATH=<main>/vendor/bundle and RBENV_VERSION=2.7.8 exported; BREAK_ESCAPE_STANDALONE=true. Same args as run 6B.

Commands (each invocation makes one game per case, so each gives two games):
- Run 7A: `node <scratch>/showcase-bc1-cake-reload.mjs --scenario demo_access_tour --room open_plan --cake cake --port 3093 --cases 2,3 --eaters thandiwe,yasmin --staff thandiwe,yasmin --rooms open_plan,reception --task ""` (log tmp/delete/cake7/run7a.txt, exit 0)
- Run 7B: same command, fresh games (log tmp/delete/cake7/run7b.txt, exit 0)

Full records: tmp/bc1/demo_access_tour-case{2,3}-game{7854,7861,7873,7879}.json.

| Run | Case | Game | Result | Servings before / after reload | Eaters (magnet_serving) | diag.calmedAt | player_state bytes before -> after (growth by key) |
|---|---|---|---|---|---|---|---|
| 7A | 2 cake down | 7854 | PASS | 2 / 2 | thandiwe (left 1) during the test step | {partial: true, missing: [thandiwe, yasmin]} | 4830 -> 5166 (+336: notes +335, syncWrites +1) |
| 7A | 3 one slice | 7861 | PASS | 2 -> 1 before reload / 1 | thandiwe (left 1) before reload; yasmin (left 0) after reload, first slice after the reload by a different NPC | {partial: true, missing: [thandiwe, yasmin]} | 4857 -> 5074 (+217: notes +335, syncWrites -119, globalVariables +1) |
| 7B | 2 cake down | 7873 | PASS | 2 / 2 | thandiwe (left 1) during the test step | {partial: true, missing: [thandiwe, yasmin]} | 4829 -> 5165 (+336: notes +335, syncWrites +1) |
| 7B | 3 one slice | 7879 | PASS | 2 -> 1 before reload / 1 | thandiwe (left 1) before reload; yasmin (left 0) after reload, same as 7A | {partial: true, missing: [thandiwe, yasmin]} | 4975 -> 5137 (+162: notes +335, syncWrites -174, globalVariables +1) |

Check results: placed, kept, eat (walked and ate) true in every game. enterRoom: no refusal and no unloaded room (`unloaded` empty in the reads). Every reload is under the 2048 byte limit (`ok` true). No second slice by the same NPC after a reload occurred, so the accepted limit did not arise in this run.

Compared with run 6: the case 2 and case 3 failures on `kept` (count dropping during the post-reload settle) did not recur in any of the four games. Staff were not held before the settle, though, so the failure is not explained by the hold. The probe's post-reload settle appears to have been free of eating in these games.

Odd:
- The post-reload hold still does not take. In all four games `window.__test.needs.ids()` is empty right after the reload (`diag.atReload.ids` = []), the staff read as null, and `diag.calmedAt` is `{partial: true, missing: [thandiwe, yasmin]}`. This is the same as run 6, so the fix in 7ebdae49e did not change this symptom. Root cause not diagnosed.
- Each game's cake read after reload is at the same tile as before the reload. The drop coordinate and the found coordinate differ by a constant offset (for example drop 53,-19 reads back as 40,-33 in 7854), which looks like a coordinate convention, not a move.
- Console: the same 400 and ERR_FAILED entries from the aborted /tts route as earlier runs.
- No game record was edited. Scenario and engine files were not changed. The uncommitted dungeon_graph changes were left alone.
