# test_access_work: scripted playtest (slice 9.2, U1 to U3, W1 to W7 and X1 to X4)

The scripted runs for access model slice 9.2 (`docs/achitechture/ACCESS_MODEL_SLICE_9_2_PLAN.md`,
section 11.1 and the build steps of sub-slices U, A and B). One room per beat, each with a sign.
The scenario is for testing, not play. After every beat check what is on screen, what the server
recorded and what reached the browser.

**The needs clock is never stepped while an outage holds or a failure park is running** (plan 11,
point 4). The server's pace floors measure server time; a stepped needs clock outruns it, the
NPC's next failure comes sooner than the floor allows and the report is refused as `tooSoon`. A
run that steps the needs clock by hand is not an honest client. The clock is stepped only for
the auto lock, and such moves are marked "exercised, not earned".

## Setup (each run)

A keyless server on a free port (never touch :3000; use :3001 or another free port). In a
container, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/opt/pw-browsers/chromium` and pass `--headless`.

```bash
export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6
tools/playtest/start-keyless-server.sh
PLAYTEST_PORT=3001 BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/new-game.rb test_access_work
S=<scratchpad>/test_access_work
tools/playtest/session-start.sh --url <URL> --headless \
  --log $S/session-<game_id>.jsonl --capture-responses $S/<run>-responses.jsonl
tools/playtest/cmd.sh <game_id> '{"cmd":"bootstrap"}'
```

The two checks after every beat:

```bash
BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id> --access
BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/access-leak-check.rb <game_id> $S/<run>-responses.jsonl
```

The leak check must say `VERDICT: no leaks found` after every beat.

Watch an NPC with
`{"cmd":"eval","fn":"() => window.__test.needs.state('lena')"}` (its `job`, `mode` and `talking`).
Every beat ticks a task in the one aim; `window.__test.getState().objectives` lists them.

## Expected validator output

`LANG=C.UTF-8 ruby scripts/validate_scenario.rb scenarios/test_access_work/scenario.json.erb --no-graph`:
no errors and these six warnings, each expected:

1. Dana has two `onceOnly` mappings on `npc_frustration_changed:dana` that can pass together
   (`w2_fed_up` and `w3_eased`): they tick different tasks, so firing together is intended.
2. `pat_pc` is owned by `temp_user`, who has no needs, so the owner never leaves (H2's plain
   account holder; nothing in W6 claims that PC).
3. `temp_user` owns `pat_pc` but stands in `temp_office` (the same record, by design).
4. The `finance_share` access list has no sign-in object on its network to map it (no beat browses
   the share).
5. U3's `lost_property_tray` takes a storage stick and is governed by no policy although the default
   blocks storage: that is the beat's point (plan 7, "Which objects a usb policy governs").
6. "Work never succeeds" for Kai (W5).

X3's Ellis puts the `intranet` resource in a work list, so the "in no NPC's work list" warning of
sub-slice A is gone. After the issues the validator prints the work report: one `Work` line per
NPC with a work plan, and one `Workaround` line per workaround (Mei's `writes_down` and Tom's
`prop_door`: three failed uses, tell 1, tell 2, about 75 s of outage; Ellis's `emit`: one failed
use, "no warning", about 5 s).

## Run U: U1 to U3 (one new game, about 5 minutes)

Pick up the five USB devices on the lobby floor first: `kit_usb` and `kit_badusb` (Lena's),
`vault_usb` and `vault_usb_2` (Priya's, and the spare for the dock), `post_usb` (Kofi's). Each is
named for its beat. Drop a device with
`{"cmd":"inventoryAct","item":"kit_usb","entry":"Drop here"}`.

| Beat | Do | Expect on screen | Events and tasks | Server record afterwards |
|---|---|---|---|---|
| U1 | Enter `usb_room` (north). Drop `kit_usb`. Wait about 15 seconds. Then drop `kit_badusb` | Lena picks the stick up and works at her PC for five seconds; she says a `usb_refused` line ("USB's disabled. Typical." or "Blocked again. Brilliant.") and carries it to the kiosk, which takes it. Then she takes the keyboard-type device to her own PC, which takes it with no line | `npc_use_refused:lena_pc` (`usbClass: "storage"`), then `npc_used:kiosk_pc` (`tag: "dev_usb"`), then `npc_used:lena_pc` (`tag: "dev_badusb"`). Tasks `u1_refused`, `u1_kiosk`, `u1_hid` | None |
| U2 | Enter `vault_room` (east of the lobby). Drop `vault_usb`. Wait about 20 seconds. Then, holding `vault_usb_2`, click the USB dock | Priya takes the stick to her PC, says a `usb_refused` line and puts it down by her PC; she does not pick it up again. The dock click shows "USB devices are disabled on this PC." and `vault_usb_2` stays in the inventory | `npc_use_refused:priya_pc`, then `usb_refused:priya_dock`. The global `u2_dock_planted` stays false. Tasks `u2_refused`, `u2_dock` | None |
| U3 | Enter `post_room` (south). Drop `post_usb` | Kofi carries it to the lost property tray and leaves it there, with no line | `npc_used:lost_property_tray`, no `npc_use_refused`. Task `u3_tray` | None |

Request budget: sub-slice U sends no new request. The leak check finds nothing.

## Run W: W1 to W7 (two new games, about 10 minutes each)

Game one: W2, W3, W4, then a reload (navigate to the game URL with `?skip_resume=1`; a plain
`location.reload()` shows the resume overlay and `bootstrap` picks "New Session", which starts a
new game), then W1. Game two: W5, W6, W7. Each switch is a `confirm_action`: after `interact`,
click `.game-confirm-ok` (the harness may report the close button as the confirmation). Halls A to
C run west from the lobby.

| Beat | Do | Expect | Events and tasks | Server record afterwards |
|---|---|---|---|---|
| W1 | Enter `ok_room` (hall A, north). Wait 30 s | Amy works about every 20 s, no line, no icon | `npc_used:amy_pc` with `met: true`; `w1_met` | No `npcFrustration` entry for Amy |
| W2 | Enter `share_room` (hall B, north). Throw the breaker. Wait about 90 s (about 150 s to see her coffee: the fourth failure, sent to nobody once she is settled, still drains caffeine below its `urgentAt` and she drinks about 7 minutes before her outage-free schedule) | "Share's down again." twice, then a fed-up line; the icon from the first failure, pulsing from the second | `npc_use_failed:dana` (`finance_share`, `down`); `w2_failed`, `w2_fed_up` | `dana.level` 34, 68, 100; 3 report requests |
| W3 | Reset the breaker. Wait 30 s | Her uses are met; the icon goes at 0 | `npc_frustration_changed:dana` falling; `w3_eased` | `level` 90, then 80 |
| W4 | Enter `copy_room` (south of `print_room`, hall B south). Jam the printer. Stand by `omar_pc`; when `workstation_owner_left:omar_pc` fires, click the PC and open `Cupboard.txt`. Type its code on the cupboard | He fails, walks to the printer once and comes back; his desktop opens by claim | `npc_checked:office_printer`; `pc_signed_in` via `claim`; `w4_checked`, `w4_cupboard` | The claim (gone once he returns); cupboard in `unlockedObjects`; `omar.level` 20 (re-arm: 20, 10, 30) |
| Reload | As above, then walk back to `print_room` | Omar's level kept; the claim gone; the printer still jammed | A settled NPC sends no report after the reload | As before the reload |
| W5 | Enter `starter_room` (hall A, south). Wait about 3 minutes | Kai fails from his first use, "Still no access. Nobody listens." | `w5_settled` | `kai.level` 100; the request count flat after `settled` |
| W6 | Enter `cable_room` (hall C, north). Switch the socket off. Open a door elsewhere. Switch it back on | He parks at his desk with "This PC is useless.", never walks to another PC; the door does not wake him; one use time after the socket comes back he works, met | `npc_need_parked:ian` (`off`, `ian_pc`), no `npc_use_failed`; `w6_off`, `w6_back` | `ian.level` 20, then 10 |
| W7 | Enter `slow_room` (hall C, south). Wait for Nia's first use and for her to rest. Jam the printer with the lever here (the slow room's own printer, `printer_w7`, global `printer_w7_jammed`, so W4's lever and this one never clear each other) | Within about one use time she works, fails and names the printer | `npc_need_urgent:nia` at once, `npc_use_failed:nia`; `w7_failed` | `nia.level` 20 |

Request budget: never more than one `/npc_frustration` request every two seconds; W5's count stays
flat after `settled`. Run W types one code, W4's, read from Omar's desktop. Last run:
`reports/2026-11-11_run_w.md`.

## Run X: X1 to X4 (two new games, about 12 minutes and 5 minutes)

Hall D is west of Hall C: X1 Mei north, X2 and X4 Tom south, X3 Ellis west. Each outage is a
switch in the beat's room (a `confirm_action`, as in run W). Game one: X2, X3, X1. Game two: X4
alone. Hear the events with a listener on `npc_workaround:*`, `door_propped:*`,
`npc_use_failed:*` and `npc_frustration_changed:*` installed through `eval` after each load.

| Beat | Do | Expect | Events and tasks | Server record afterwards |
|---|---|---|---|---|
| X2 | Enter `store_lobby`. Check the fire extinguisher `store_wedge` is not in `nearby`. Switch the stores system off. Wait about 90 s. Walk into `store_room` | Tom fails three times, about 35 s apart: tell 1, tell 2, then at the third he says "I'm not badging in every time.", walks to the extinguisher by the stores door and stands there 4 s. The extinguisher appears and the door opens; Una is inside | `npc_use_failed:tom` (`stores`, `down`) x3; `npc_workaround:tom` `started` (with the third fail), `npc_visit_done:tom` at `store_wedge`, `global_variable_changed:store_door_propped`, `npc_workaround:tom` `done`, `door_propped:store_room`. Tasks `x2_started`, `x2_propped` | `unlockedRooms` has `store_room`; `encounteredNPCs` has `una`; `store_door_propped` true; `tom` level 60 (rising to 100 as the outage holds), done `[0]` |
| X3 | Enter `event_room`. Switch the intranet off. Wait about 20 s | One failed use; at that same failure (tell goes from 0 straight to 2, because the workaround is then in force) the event fires and the task ticks. No icon or pulse comes before it | `npc_use_failed:ellis` (`intranet`, `down`), `npc_frustration_changed:ellis` 50, `npc_workaround:ellis` `started`, `ellis_gave_up` with `{ npcId, level: 50 }`, `npc_workaround:ellis` `done`. Task `x3_gave_up` | `ellis` level 50, done `[0]` |
| X1 | Enter `note_room`. Check `mei_pc` has no `hasPostit` and `postitMarks` has no mark. Switch the rota system off. Wait about 80 s. Then wait for Mei to leave her desk (the global `mei_pc_owner_away` true; her thirst takes her to the boiler every few minutes; in the last run she left about 3 minutes after her first trip). Click her PC, read the note on the sign-in screen, sign in as Mei with it, open `Nook.txt`, and type its code on the `records_nook` door | Tell 1, tell 2, then at the third failure "I'll never remember this one.", she sits writing for 6 s and a yellow note appears on her monitor. While she is away the sign-in screen shows her username and password on the note; her desktop holds `Nook.txt`; its code opens the nook | `npc_workaround:mei` `started`, `npc_visit_done:mei` at `mei_pc`, `npc_workaround:mei` `done`; `postitMarks` has `mei_pc`; `pc_signed_in`. Tasks `x1_wrote_down`, `x1_nook` | `mei` done `[0]`; `sessions.mei_pc` Mei by password; `unlockedRooms` has `records_nook` |
| X4 | Game two. Enter `store_lobby` and install a listener that, on `npc_workaround:tom` with `phase: "started"`, calls `window.__test.needs.setManualClock(true)`. Switch the stores system off and wait for the third failure. Reload (navigate to `/break_escape/games/<id>?skip_resume=1`, then `bootstrap`; never a query string on the `session-start.sh` URL) and walk back to `store_lobby`. Then reload again and walk back | Before the first reload Tom has stopped on his way (`visiting` the wedge) and the server holds the hand-over unspent. After it, as soon as `store_lobby` loads, Tom sets off again (`npc_workaround_due:tom` with `restored: true`) and props the door. After the second reload the extinguisher is shown at once and the stores door is unlocked: its sprite is shut, as every door is after a reload, and opens with no lock | First reload: `npc_workaround:tom` `started`, then `done` and `door_propped:store_room`. Second: no `npc_workaround` event; `store_door_propped` true from load | Before the first reload: `tom` handed 1, done `[]`. After: as X2, and only one `POST /npc_workaround` in the game |

Request budget (counted from the captured responses): `/npc_frustration`, at most one request
every two seconds overall, and per NPC one per counted failure until it is settled (Mei and Tom 5
each to reach 100, Ellis 2); `/npc_workaround`, exactly one per done workaround (3 in game one, 1
in game two, none for the hand-over that the first X4 reload interrupted). Every answer 200. Last
run: `reports/2026-11-11_run_x.md`.

## Earned secrets

Run U types no secret. Run W types the W4 cupboard code, read from `Cupboard.txt` on Omar's desktop after a claim.
Run X types two secrets, each read in the game first: Mei's password from the sticky note on her
sign-in screen (after her `writes_down`), and the records nook code from `Nook.txt` on her desktop.
