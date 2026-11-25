# demo_ops_passwords: scripted playtest ("What a password store gives away")

A demo scenario (15 minutes, 20 with the afternoon of Run D, beats P10 to P15): a working day at Merrin & Sallow, in which the player takes a box of old password records from the confidential-waste bin, earns what Delphine gives away on the office feed and on her desk, cracks what will crack (one at once, one after a wait, one never), signs in with what they cracked, sees the desk policy refuse a stick, reads what an administrator's sign-in reaches that a user's cannot, and reads their own trail in the sign-in log. The plan is `docs/agents/ops_core_build/SHOWCASE_PLAN.md` section 6; the beats P1 to P9 below are its table 6.4. Two runs, each 10 to 15 minutes, in two fresh games (Run A morning and midday to the cracking; Run B sign-ins, the administrator, the log, and a reload). Run C is the cracker beats alone, which the orchestrator gives to the `opus48` agent from `planning/CRACKER_RUNBOOK.md`.

Request-level checks (every refusal code, a run started before the note ending "No match", the printer account refused at every PC, the admin profile read logged once, the keystroke device refused with no session, the log rows, no password in any answer) are in `test/controllers/break_escape/demo_ops_passwords_scenario_test.rb`, and the leak scanner over a whole run is its last case. This script plays only what a player can click. It sends no forged or replayed request.

No password appears in this file. Where a beat needs one, it says where in the game it is earned: Delphine's and Graham's come from the cracker (never typed from a guide), and the printer note is a readable item in the office. Julian's is never available: that is the lesson.

## Setup

Keyless server on a free port (never :3000, :3001, :3002, :3085 or :3086; use the port the orchestrator names). Make each game with `swap-scenario-game.rb` (host scenario `test_access_signin`), not `new-game.sh`: the scenario has no Mission row.

```bash
export PATH=/opt/rbenv/bin:/opt/rbenv/shims:$PATH RBENV_VERSION=3.1.6
tools/playtest/start-keyless-server.sh
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/swap-scenario-game.rb test_access_signin demo_ops_passwords   # prints GAME_ID=
S=<scratchpad>/demo_ops_passwords
tools/playtest/session-start.sh --url <URL> --headless \
  --log $S/session-<game_id>.jsonl --capture-responses $S/responses-<game_id>.jsonl
tools/playtest/cmd.sh <game_id> '{"cmd":"bootstrap","tutorial":"decline","resume":"new"}'
```

After each run read the server's record and run the leak check. A session resumed in a new browser writes a new capture file: give the leak check every capture file of the game, oldest first, named one by one (never a glob). Keyboard sign-ins must be named to the check (`--signin <npc id>@<pc id>#<n>`; the listing script in `scenarios/test_ops_privilege/PLAYTEST.md` "Setup" prints them).

```bash
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id> --access
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb <game_id> --ops-log
env -u BUNDLE_PATH BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/access-leak-check.rb <game_id> \
  --signin <npc>@<pc>#<n> ... $S/responses-<game_id>.jsonl
```

Take a screenshot at every beat and write each finding as the run goes. Write every password as `[redacted N chars]`.

## Layout

```
                 [partner_office]
                        |
 [kitchen] ------- [office] ------- [it_room]
```

| Room | What matters | Ids |
|---|---|---|
| `office` (start) | Ama (host); Delphine and her desk PC, her desk photo and the USB port on her desk; Jun and Niamh; the printer cupboard (unlocked, one note); the office coffee machine and its wall socket; the notice board | `ama_owusu`, `delphine_arvanitis`, `delphine_pc`, `delphine_photo`, `desk_usb_port`, `printer_cupboard`, `printer_admin_note`, `office_coffee`, `office_coffee_socket`, `tour_notice` |
| `kitchen` | the office feed tablet, fridge, microwave, kitchen coffee, water cooler | `feed_kiosk`, `kitchen_coffee`, `water_cooler` |
| `it_room` | Graham and his PC; the confidential-waste bin with three record files; the sign-in log terminal; the printer service account (a person who has no desk) | `graham_whitfield`, `graham_pc`, `secure_bin`, `signin_log_pc`, `printer_svc` |
| `partner_office` | Julian's PC (`partner_pc`) and the USB socket beside it (`partner_pc_socket`); Julian | `partner_pc`, `partner_pc_socket`, `julian_sallow` |

You start holding the capture log, a USB stick (`kit_stick`), a keystroke device (`kit_badusb`) and the cake. All four rooms are open (no locks). Network `office_lan` covers the office, the IT room and the partner's office; it has no sweep (no discovery): the only network view is the one the keystroke device opens in beat P8.

Records (item ids): `delphine_record_file` (guessable, two facts, unsalted: every answer is at once), `graham_record_file` (reused, salted, a countdown of about 20 seconds), `julian_record_file` (strong: "No match" once, then "This one will not fall to guessing. Try another way in."). Facts (cracker chips): "Delphine's dog" (from the desk photo) and "Delphine's dog's year" (from her first feed post).

Accounts: Delphine (user; her PC admits her and the `it` role), Graham (`gwhitfield`, the administrator, role `it`), Julian (owner of the partner's PC, strong), the printer service account (`svc_printer`, role `service`: no PC admits it). The printer note holds the service account's login; its password equals Graham's.

Log: source `signin_log`, six seed rows; the Tue 02:10 failed sign-in on Graham's PC is the only night-time failure and the odd one out (the Tue 08:01 failure at Delphine's PC is an ordinary morning typo).

## Harness notes

- **Talk.** `{"cmd":"moveToNear","id":"ama_owusu"}`, `{"cmd":"interact","id":"ama_owusu"}`, press `{"cmd":"mg","action":"continue"}` until a numbered list shows, then `{"cmd":"mg","action":"chooseMatching","args":["Send them for coffee"]}`. Close with `{"cmd":"mg","action":"close"}` or the exit choice. Lever labels: "Send them for coffee.", "Could you ask Delphine about her weekend?", "Send them to lunch.", "Call it a day." (that one asks "Yes, call it a day."). The coffee and weekend levers go once the evening starts. The levers are windows, not switches: Delphine goes to the coffee machine; at lunch Graham, Jun, Delphine and Niamh all go to the kitchen to eat and come back; Julian vanishes at lunch (he never comes back).
- **Lunch needs the rooms seen first.** An NPC's needs only pick targets in rooms the player has loaded, and an NPC in a room not yet loaded hears no event. So "Send them to lunch." only works once you have walked into the kitchen, the IT room and the partner's office (Ama's mappings set `kitchen_seen`, `it_room_seen`, `partner_office_seen`). Before that, Ama says "Walk round first, so you know who sits where. The kitchen, the IT room and the partner's office." and offers the lever again.
- **Report-back choices.** Ama's "I cracked Delphine's record.", "I cracked Graham's record.", "I tried Julian's record twice." are offered only once the records are taken (Delphine's also needs both facts); "Here's what I learnt about Delphine." only once both facts are held; "I opened Julian's client files." only after Graham's sign-in at the partner's PC.
- **Capture log and cracker.** `{"cmd":"openInventoryItem","item":"Capture log"}`, then `{"cmd":"mg","action":"getState"}`. Press Crack on a hash row with `{"cmd":"mg","action":"clickControl","args":["Crack"]}`; pick a fact with `clickControl` on its chip label; close with `{"cmd":"mg","action":"close"}`. The shorter paths also work: the held record file in the tray offers Crack, and the "Hash collected" toast carries a Crack button (only when it names one record). A cracked password is offered by the sign-in screen: the account's tile is tagged Cracked and a click fills the password box (do not type it).
- **Taking from a container.** `moveToNear`, `interact` on `secure_bin` or `printer_cupboard`; the container opens about a second after the reply (the first `interact` unlocks it: `getState` may say `no-active-minigame`, so wait and read again, or `interact` once more). Then `{"cmd":"mg","action":"take","args":["delphine_record.dat"]}` (the names are `delphine_record.dat`, `graham_record.dat`, `julian_record.dat`, `Printer admin.txt`), then close. The photo is not taken with `take`: `moveToNear` and `interact` on `delphine_photo` opens it as a note (read it), and closing it keeps the fact (toast `Noted: Delphine's dog`). Rooms are walked with `{"cmd":"enter","room":"it_room"}`; an object in another room answers `unknown-entity`.
- **The feed.** `interact` on `feed_kiosk`; click `Delphine Arvanitis`, then read her post. Open the kiosk once before a post is due, so that the "Delphine posted on Office feed" toast shows for the next one. The first post she serves carries the year fact.
- **Sign-in screen.** `interact` the PC; `{"cmd":"mg","action":"getState"}` has a `signIn` block with `tiles`. Choose a tile with `clickText` on the account name (`Delphine Arvanitis`, `Graham Whitfield`), then press `Sign in` (a cracked tile is already filled). Wait about 2 seconds for the desktop. The marker "Administrator" is `span.pc-taskbar-admin`: `{"cmd":"eval","fn":"() => document.querySelector('.pc-taskbar-admin')?.textContent ?? null"}`.
- **Plugging in.** The keystroke socket (`partner_pc_socket`) asks first: `interact`, then `{"cmd":"dismiss","label":"Plug it in"}`. Delphine's desk port asks nothing: with the stick held, `interact` is refused at once with the toast "USB storage is disabled on this PC." (no teaching toast follows); the stick stays in the tray. Read toasts with `{"cmd":"toasts"}`.
- **Waits.** Delphine's coffee: `{"cmd":"waitFor","kind":"event","name":"npc_left_post:delphine_arvanitis","timeoutMs":90000}` (third argument of `cmd.sh` 300); it answers `expectedAwayMs` (about 28000 in the first run). Graham's lunch: the same with `npc_left_post:graham_whitfield`. A timed pause is `{"cmd":"waitFor","kind":"global","name":"__nope","timeoutMs":N}` (its `ok:false` timeout is expected). Away times are estimates (the build did not measure them): write the real seconds in the report. Delphine's screen locks as soon as she leaves (no screen habit: every owned PC locks on every leave).
- **Reload.** `{"cmd":"sync"}`, then `{"cmd":"eval","fn":"() => { location.reload(); return true; }"}`, wait about 15 s, then `{"cmd":"bootstrap","tutorial":"decline","resume":"resume"}`.
- **After a click** wait for `pending` to go away (about a second).

## Run A: morning and midday (P1 to P5)

Fresh game.

| Beat | Do | Expect | Record |
|---|---|---|---|
| A0 | Read the notice board (`interact` on `tour_notice`). Talk to Ama: "What's next?". | The board lists the beats in plain words and names no control. Ama introduces herself and says to come back and tell her what you find; "What's next?" gives only the lines for the fact still missing: with neither fact held, the feed nudge ("Delphine posts on the office feed. Read it on the tablet in the kitchen.", then "If she hasn't posted yet, ask me to ask about her weekend.") and the photo line ("Her desk photo tells you more. Ask me to send them for coffee, and take it while she's away."); once Delphine has posted by herself (usually within the first minute) the year fact is held and only the photo line is said. "What did that show?" is not offered until a fact or the records are held. Objectives show one morning task. | none |
| P2a | Open the office feed tablet in the kitchen once and read Delphine's profile (`interact` `feed_kiosk`, then click her name, then click the post itself: reading it does not hold the fact, the click does, and there is no toast for it). Talk to Ama: "Could you ask Delphine about her weekend?" The reply is "I'll ask Delphine how her weekend went. Give her a minute." and nothing visible follows. | Delphine also posts on her own within the first minute or two (her feed need falls due by itself): in the first real run her first post was already out by the time the records were taken. The toast "Delphine posted on Office feed" shows only after the tablet has been opened once. Her first post mentions the year her dog came home: read it. | none |
| P2b | Talk to Ama: "Send them for coffee." Wait for `npc_left_post:delphine_arvanitis`. Read the photo on her desk (`delphine_photo`). | The photo shows a dog with a readable collar tag; the toast "Noted: Delphine's dog" shows. Delphine leaves about 3 s after the lever. Delphine is away from her desk while you take it. If she is back before you arrive, press the coffee lever again (a counter: every press sends her). | `--access`: no session yet |
| A2c | Talk to Ama: "Here's what I learnt about Delphine." (offered only once both facts are held). | Ama is pleased and names no fact. The morning task ticks. | none |
| P1 | Walk into the kitchen, the IT room and the partner's office (if not yet done), back to Ama: "Send them to lunch." Wait for `npc_left_post:graham_whitfield`. Walk to the IT room, open `secure_bin`, take all three files. Open the capture log. | Ama: "Right. Lunch for everyone. Watch the rooms empty.", then about six seconds later the bark "Lunch. Graham's off to the kitchen, and Julian's gone to his client lunch." (not caught in the second playtest: poll the toasts at about six seconds). Graham was away about 25 to 33 s on the first lunch and about 60 s on a second Graham, Jun, Delphine and Niamh head for the kitchen; Julian disappears. The bin lists three record files. Taking the first one ticks "Take the stored records" by itself. The Hashes section shows three rows, each Ready, none showing a password; Graham's says Salted. | none (a take writes no row) |
| P3a | Press Crack on Delphine's row with nothing picked. | "You have not learned anything about this account yet. You can still press Crack." if no fact is held; otherwise the chips. With one fact held (photo only), picking it and pressing Crack gives "1 fact still missing" at once, no wait. | none |
| P3b | With both chips held: pick only "Delphine's dog", Crack. Then pick both, Crack. | First "No match" at once, no countdown. Then "Cracked" at once with her name and username. The row reads Cracked and a Cracked password row appears under Sign-ins. | no log row for either |
| P4a | Press Crack on Graham's row before the note and wait out its countdown (about 20 seconds). Do not take the note during it. | A countdown of about 20 seconds, then "No match". | none |
| P4b | Take the note from the printer cupboard in the office (`Printer admin.txt`) and read it. Press Crack on Graham's row again; wait out a second countdown. | "Cracked": the printer service account's password, already held, was the same. The row reads Cracked. Talk to Ama: "I cracked Graham's record." (she says one person used one password on two accounts). Do not take the note during the first countdown: that run's verdict is fixed when it starts. | none |
| P5 | Press Crack on Julian's row, then again. | First "No match", then "This one will not fall to guessing. Try another way in." The row reads Not feasible and offers no Crack. Talk to Ama: "I tried Julian's record twice." | none |

End of Run A: `{"cmd":"sync"}`, then the leak check (no `--signin` names are needed: no sign-in yet) and `verify-run.rb <game_id> --access --ops-log`: two accounts cracked, Julian's record infeasible (two runs).

## Run B: sign-ins, the administrator, the log (P6 to P9)

Fresh game, with the Run A records already taken and cracked by the same clicks (about five minutes), then:

| Beat | Do | Expect | Record |
|---|---|---|---|
| P6a | Talk to Ama: "Send them for coffee." While Delphine is away (her screen is locked), `interact` `delphine_pc`; pick the Delphine tile (tagged Cracked) and sign in. Screenshot the taskbar. | Desktop opens; the taskbar shows her name and no "Administrator" (the eval returns null). Task "Sign in at Delphine's PC" ticks. Sign out (`#pc-start-signout`). | `--access`: a session at `delphine_pc`, no `access`; a `signin_ok` row |
| P6b | Take the stick (it is in your tray: `kit_stick`). `interact` `desk_usb_port`. | A toast with the policy line; no confirm; the stick stays in the tray. Task "Plug the stick into Delphine's desk" ticks. | none |
| P6c | Free play: sign in at any PC as the printer account (type its login from the note). | "This account can't sign in on this PC." at every PC, however many you try (at a PC whose user is present it says "<Name> is using this PC." instead). The refusal writes no log row. | none |
| P7a | Talk to Ama: "Send them to lunch" (if not already pressed in this game; the three rooms must have been seen first). Wait until Julian is gone. Walk to the partner's office. `interact` `partner_pc`; pick the Graham Whitfield tile (Cracked); sign in. | Taskbar shows "Administrator". Task "Sign in at the partner's PC as Graham, an administrator" ticks at once (a toast). The desktop opens about two seconds after the click. | `--access`: `level admin` |
| P7b | Click "Client files" on the desktop (`clickText`), then open its file. | The folder opens and the file ("Harrow Lane accounts.txt") reads: "Harrow Lane Dental: year-end accounts are with the partners for sign-off. Fee note to follow once the draft is approved." Talk to Ama: "I opened Julian's client files." The task ticks after she answers. | `--ops-log`: one `admin_profile_read` row (a reopen adds none) |
| P8 | `interact` `partner_pc_socket`, answer "Plug it in". | Accepted: the device leaves the tray; a network view opens on the office network (close it); Ama: "His PC blocks devices, but an administrator's session let it through. That window's the office network. Close it for today." (about two seconds later). Task "Use the keystroke device" ticks. | `--ops-log`: one `usb_install_overridden` row; a foothold `implant_partner_pc` |
| P8b | Reload (`sync`, reload, bootstrap resume). `interact` `partner_pc`. | The desktop opens with the "Administrator" marker back and no sign-in screen. | `--access`: `level admin` again |
| P9 | Talk to Ama: "Call it a day." Go to the IT room, talk to Graham ("What about the sign-in log?": he says someone tried his PC in the night). `interact` `signin_log_pc`. Find your own rows, open the Tue 02:10 row and flag it ("Flag the odd sign-in"). | Reader table with SIGN_IN, ADMIN_READ and USB_OVERRIDE rows beside the six seed rows (a failed sign-in shows as SIGN_IN with FAIL). To flag: `{"cmd":"mg","action":"clickSelector","args":["tr[data-row-id=\"s2\"]"]}`, then `button[data-action=\"flag\"]`, then `button[data-action=\"flag-confirm\"]` (the note reads FLAGGED). Flagging 02:10 ticks "Find your own trail in the sign-in log, and flag the night-time failure". Ama's "What did that show?" (offered once a fact or the records are held) recaps up to two beats per ask, newest first, each once; "Give me the short version." is the whole summary. Staff have gone home except Graham. | `--ops-log` ends `ops log OK` |

End of run: `{"cmd":"sync"}`, the leak check (name every keyboard sign-in: Delphine at `delphine_pc`, Graham at `partner_pc`), `verify-run.rb <game_id> --access` and `--ops-log`.

## Run D: what a PC remembers, the borrow and the shared desk account (P10 to P15; plan 6.5 and 6.6)

New rooms' objects: the office also holds the hot desk (`hot_desk`, no owner, a sign-in PC that admits Jun, Niamh and the `it` role), the wall socket by Jun's desk (`jun_pc_socket`, the same confirm as the coffee socket; Ama has a lever for it too) and Jun's phone; the IT room also holds the rota sheet (`desk_rota`, a notice) and the old backups cabinet (`backups_cabinet`, unlocked, one file `desk_rounds_record.dat`). Every PC shows "Domain: merrin" on its sign-in screen and lock screen, and the five person accounts are domain accounts, so every sign-in of Runs A to C works as before. Run D starts after P8, in the same game, signed in as Graham at the partner's PC (Run B's end state); it must all happen before "Call it a day" (Jun goes home at the evening). New cracker records: Delphine's and Julian's cached records at the partner's PC, Niamh's and Jun's at the hot desk, the shared account's file. Jun's one fact is his cat, from his first feed post.

| Beat | Do | Expect | Record |
|---|---|---|---|
| P10 | At the partner's PC (Graham's admin session from P7 still open; if the desktop shows a sign-in screen, sign in as Graham again), click "Cached accounts" on the desktop bar. Press it a second time. Open the capture log. Talk to Ama: "I collected what Julian's PC remembers." | A toast "Hash collected (2)" shows after the desktop closes; two rows, "Julian Sallow" and "Delphine Arvanitis", each tagged "hash" with a "Crack" button and the line "The password comes from cracking the hash." The second press says "Nothing new is cached here." The capture log lists two more hash rows. Ama says an administrator gets records, never passwords; the task "collect_partner" ticks after her answer. Press Crack on Delphine's cached row: "Cracked" at once if you cracked her in P3 (no pick needed); on Julian's: "No match" then "This one will not fall to guessing" (a repeat of P5 in a new place). | `--ops-log`: one `CRED_COLLECT` row, `count: 2`; `--access`: a collect answer with two rows |
| P11 | Talk to Ama: "Switch Jun's PC off." (or click `jun_pc_socket`, "Switch off"). Watch Jun: he mutters ("Who switched my PC off?"), leaves his desk and sits at the hot desk. Wait for the task "Switch Jun's PC off and watch him borrow the hot desk" to tick (`npc_workaround:jun_watanabe` with `phase: done`). Walk to the hot desk: the desktop shows Jun's screen left open ("You're on the screen Jun left open..."). Start, "Switch user", the Graham tile (Cracked), sign in. Click "Cached accounts". Talk to Ama: "I collected at the hot desk." | The collect lists "Niamh Doherty" and "Jun Watanabe" (Niamh's was cached from the start, Jun's only because he borrowed this PC; a collect made before the borrow lists Niamh alone). The expected seconds from the switch to the tick are NOT measured: expect between 1 and 3 minutes (two failed uses at least 25 s apart, his walk, a dwell at the desk); read the real figure from `{"cmd":"eval","fn":"() => window.__test.needs.log().slice(-8)"}` (`borrow_set`, `using`, `borrow_done`) and write it in the findings. Do not touch the hot desk while Jun is walking to it ("Someone's in the way."). Switch his PC back on afterwards (the socket, "Switch on") or he keeps coming back. | `--access`: a collect row for each of the two collects at `hot_desk`; `--ops-log`: `CRED_COLLECT` (the two collects at one PC merge into one row `x2`) |
| P12 | Open the feed tablet in the kitchen and read Jun's profile (Ama: "Could you ask Jun what he's been up to?" makes him post; click the post itself, as in P2a). In the capture log, Crack Niamh's hot desk row with nothing picked, then Jun's with the one chip "Jun's cat". Talk to Ama: "I cracked one of those records." | Niamh's: "Cracked" at once, no pick (a weak password falls whatever the PC). Jun's with no chip: "1 facts still missing"; with the chip: "Cracked". Cracked accounts get a tile on the sign-in screens that admit them. Ama: a weak password falls whatever the PC. | none (a crack writes none) |
| P13 | Take `desk_rounds_record.dat` from the old backups cabinet in the IT room (Graham: "What's the rota sheet by the door?" points at it; the sheet says which desks the shared desk account covers). Open the capture log: a row "Desk administrator", with its username, tagged "hash". Crack it with nothing picked: "Cracked" at once, and the cracker shows its username and password. At Delphine's PC (while she is away from it, with Ama's coffee lever) choose "Other user" and type them (a cracked account with no person has no tile). | The desktop opens; the taskbar shows "Desk administrator" and "Administrator" (this account is an administrator on the desks). The task "Sign in at Delphine's PC with the shared desk account" ticks by itself. The same account also opens Jun's PC and the hot desk. | `--access`: a session at `delphine_pc` with `access: admin`; `signin_ok` row |
| P14 | Click the partner's PC (not signed in there; sign out of Graham's session first with Start, "Sign out"), choose "Other user" and type the same name and password. | "This account can't sign in on this PC." The sign-in screen says "Domain: merrin" above the tiles (P15). No lockout is counted however many times it is tried. The account is refused at Graham's PC too. Talk to Ama: "I tried the shared desk account at Julian's PC." She says a local account stays on its own PCs. | `--ops-log`: a `signin_refused` row (read as SIGN_IN, DENIED, "kind: local") per try; no failed-sign-in row |
| P15 | The text "Domain: merrin" on the sign-in screen of every PC and on the lock screen at Delphine's PC. | Seen at any PC's keyboard sign-in. A domain person (Graham, Jun, Niamh, Delphine, Julian) works on every PC that admitted them before. | none |

End of Run D: the leak check names every keyboard sign-in with the account's own count (the Rails test names them the same way): Delphine at `delphine_pc` #1, Graham at `partner_pc` #1, then `gwhitfield` at `hot_desk` (#2 before the borrow if you collected before it, and #3 after it), the shared account at `delphine_pc` #1; and every sign-out made while another PC holds an administrator session needs a `--logout` entry (`deskadmin@delphine_pc#<n>`, `graham_whitfield@hot_desk#<n>`, where n is the number of the sign-out among all the successful logouts in the capture). The Rails test names these in `play_afternoon`. Then `verify-run.rb <game_id> --access` and `--ops-log`.

## Free play checks (any time, in either run)

- Type the printer note's password at Graham's PC as Graham while he is away from his desk (lunch is the only window: back at his desk the PC says "Graham Whitfield is using this PC.", and his lunch is only about 25 to 60 seconds): it signs in (the reuse done by hand). Read the password from the note, never from a guide.
- Type a wrong password at Graham's PC three times: the failures merge into one log row with a count (shown as xN).
- Sign in at Delphine's PC as Graham: it opens (desks admit IT).
- Press the coffee lever, then switch the office coffee off at the wall socket while Delphine is on her way: she turns back, and goes to the kitchen machine instead if you have been in the kitchen. (Switching it off before the lever just sends her to the kitchen machine.)

## Harness notes (from the second playtest)

- Walking past `signin_log_pc` in the IT room can re-open it and block the route: use `moveTo` around it, or `moveToNear` it only when you mean to read it.
- After a reload the player stands at the office start point (160,192), not the last position.
- In the cracker, a file row is not opened by a click; `take` is the call. After the partner PC's sign-in, the keystroke device's network view reads "Keystroke injector: Partner's office".
- `verify-run.rb` reports `loginFailures 0` even when the ops log holds a "FAIL x3" row: read failures from `--ops-log`.
- The second and third wrong-password attempts at one PC fail the `clickText` step (the tile is already selected) but the typing still goes through.
- Ama's recap after the evening reads, in order: "The desk policy refused the stick. That's a rule doing its job." then "That's all of it so far." then "And the log remembers all of it."

## Beats that cannot be played by clicking

None. Three beats rest on the office-life windows (Delphine's post, Delphine's absence, Julian's and Graham's absence at lunch); each has a lever, and the play above names it. Delphine's coffee and weekend levers act in the start room, which is always loaded. The lunch lever waits until the kitchen, the IT room and the partner's office have been seen, so every NPC it moves is listening and the kitchen's food is a target. The keystroke device's override and the profile read are single clicks once signed in as Graham. A salted countdown is waited out for real (about 20 seconds); no test `travel_to`.

## Expected validator output

`ruby scripts/validate_scenario.rb scenarios/demo_ops_passwords/scenario.json.erb`: 0 errors. The warnings are listed in `planning/BUILD_REPORT.md`, each with its reason.
