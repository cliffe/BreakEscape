# demo_ops_passwords: guided tour and scripted playtest ("What a password store gives away")

A demo scenario (about 30 minutes) and, since the showcase tour (`docs/agents/ops_core_build/SHOWCASE_TOUR_PLAN.md` 2.5), a guided demo: a working day at Merrin & Sallow in four aims in this order, morning, midday, afternoon, evening. At each beat Ama's "What's next?" and the objectives panel name the next undone thing; when it is done a short "what you just saw" line follows (a bark on the tick, or the knot when you tell Ama). "Call it a day" refuses with "Not yet" until every morning, midday and afternoon task is done ("Skip them and call it a day anyway." overrides it); only the sign-in log (P9) comes after. The old three-run split is gone: play the aims in one game. Run C, the cracker beats alone, is still given to the `opus48` agent from `planning/CRACKER_RUNBOOK.md` (tray and toast entry points added in the tour).

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
- **Lunch departures are immediate: do not arm `waitFor npc_left_post:graham_whitfield` after the lever.** Graham, Delphine, Jun and Niamh start their lunch trips within a second or two of act_midday, so a wait started after the chat closes misses the event and times out (a Haiku run reported "no lunch" this way, game 239). Check `{"cmd":"eval","fn":"() => window.__test.needs.state('graham_whitfield').job"}` (need hunger, target microwave) in the seconds after the lever. Also: `hunger` is a satisfaction level, 100 is full, so lunch sets it to 20 and eating RAISES it to about 80 to 98; it falling is the wrong thing to look for. All four are back at their desks in about 60 to 90 s. Verified live in game 240.
- **Lunch needs the rooms seen first.** An NPC's needs only pick targets in rooms the player has loaded, and an NPC in a room not yet loaded hears no event. So "Send them to lunch." only works once you have walked into the kitchen, the IT room and the partner's office (Ama's mappings set `kitchen_seen`, `it_room_seen`, `partner_office_seen`). Before that, Ama says "Walk round first, so you know who sits where. The kitchen, the IT room and the partner's office." and offers the lever again.
- **Report-back choices.** Ama's "I cracked Delphine's record.", "I cracked Graham's record.", "I tried Julian's record twice." are offered only once the records are taken (Delphine's also needs both facts); "Here's what I learnt about Delphine." only once both facts are held; "I opened Julian's client files." only after Graham's sign-in at the partner's PC.
- **Capture log and cracker.** `{"cmd":"openInventoryItem","item":"Capture log"}`, then `{"cmd":"mg","action":"getState"}`. Press Crack on a hash row with `{"cmd":"mg","action":"clickControl","args":["Crack"]}`; pick a fact with `clickControl` on its chip label; close with `{"cmd":"mg","action":"close"}`. The shorter paths also work: the held record file in the tray offers Crack, and the "Hash collected" toast carries a Crack button (only when it names one record). A cracked password is offered by the sign-in screen: the account's tile is tagged Cracked and a click fills the password box (do not type it).
- **Taking from a container.** `moveToNear`, `interact` on `secure_bin` or `printer_cupboard`; the container opens about a second after the reply (the first `interact` unlocks it: `getState` may say `no-active-minigame`, so wait and read again, or `interact` once more). Then `{"cmd":"mg","action":"take","args":["delphine_record.dat"]}` (the names are `delphine_record.dat`, `graham_record.dat`, `julian_record.dat`, `Printer admin.txt`), then close. The photo is not taken with `take`: `moveToNear` and `interact` on `delphine_photo` opens it as a note (read it), and closing it keeps the fact (toast `Noted: Delphine's dog`). Rooms are walked with `{"cmd":"enter","room":"it_room"}`; an object in another room answers `unknown-entity`.
- **The feed.** `interact` on `feed_kiosk`; click `Delphine Arvanitis`, then read her post. Open the kiosk once before a post is due, so that the "Delphine posted on Office feed" toast shows for the next one. The first post she serves carries the year fact.
- **Sign-in screen.** `interact` the PC; `{"cmd":"mg","action":"getState"}` has a `signIn` block with `tiles`. Choose a tile with `clickText` on the account name (`Delphine Arvanitis`, `Graham Whitfield`), then press `Sign in` (a cracked tile is already filled). Wait about 2 seconds for the desktop. The marker "Administrator" is `span.pc-taskbar-admin`: `{"cmd":"eval","fn":"() => document.querySelector('.pc-taskbar-admin')?.textContent ?? null"}`.
- **Plugging in.** The keystroke socket (`partner_pc_socket`) asks first: `interact`, then `{"cmd":"dismiss","label":"Plug it in"}`. Delphine's desk port (`desk_usb_port`, `portOf: delphine_pc`) asks nothing while the policy refuses: with the stick held and no session or a user session, `interact` is refused at once with the toast "USB storage is disabled on this PC."; the stick stays in the tray. In Graham's (administrator) session at Delphine's PC it asks "Plug the stick into the desk port?": `dismiss` "Plug it in" (P8b). Read toasts with `{"cmd":"toasts"}`.
- **Waits.** Delphine's coffee: `{"cmd":"waitFor","kind":"event","name":"npc_left_post:delphine_arvanitis","timeoutMs":90000}` (third argument of `cmd.sh` 300); it answers `expectedAwayMs` (about 28000 in the first run). Graham's lunch: the same with `npc_left_post:graham_whitfield`. A timed pause is `{"cmd":"waitFor","kind":"global","name":"__nope","timeoutMs":N}` (its `ok:false` timeout is expected). Away times are estimates (the build did not measure them): write the real seconds in the report. Delphine's screen locks as soon as she leaves (no screen habit: every owned PC locks on every leave).
- **Reload.** `{"cmd":"sync"}`, then `{"cmd":"eval","fn":"() => { location.reload(); return true; }"}`, wait about 15 s, then `{"cmd":"bootstrap","tutorial":"decline","resume":"resume"}`.
- **After a click** wait for `pending` to go away (about a second).


## The guided path (one run, one fresh game)

Each row: the pointer Ama gives, what to do, the line you should hear, and the tick. Lines marked (bark) come on the tick from Ama's mappings (held while a minigame is open, shown when it closes; the bark's condition is read again at release, so a bark for a step you have already moved past is dropped). Lines marked (Ama) are said in her report-back knot after you tell her. Pointers are Ama's "What's next?" in this order. Every `<task>_done` global is declared in the scenario and the ink.

### Aim 1, morning: the facts (order 0)

| Beat | Pointer (Ama) | Do | Line and tick |
|---|---|---|---|
| P2a | "Delphine posts on the office feed. Read it on the tablet in the kitchen." (and "If she hasn't posted yet, ask me to ask about her weekend.") | Open `feed_kiosk` once, read Delphine's profile and click the post itself (the click holds the fact). Lever: "Could you ask Delphine about her weekend?" | no line; `se_intel_delphine_dog_year` |
| P2b | "Her desk photo tells you more. Ask me to send them for coffee, and take it while she's away." | Lever "Send them for coffee."; wait for `npc_left_post:delphine_arvanitis`; read `delphine_photo`. | toast "Noted: Delphine's dog" |
| P2 | "You've got two things about Delphine. Tell me what you learnt." | Ama: "Here's what I learnt about Delphine." | (Ama) the existing `tell_facts` lines; `earn_facts` ticks |

### Aim 2, midday: crack and sign in (order 1)

Before "Send them to lunch." walk into the kitchen, the IT room and the partner's office (Ama says so: "Walk round the kitchen, the IT room and the partner's office first.").

| Beat | Pointer (Ama) | Do | Line and tick |
|---|---|---|---|
| P1 | "Search the confidential-waste bin in the IT room. Take all three record files." | Lever "Send them to lunch." then take the three record files from `secure_bin`. | (bark) "Three stored records, scrambled. None shows a password. Cracking is guessing, checked against them." `get_records` ticks on the first file taken |
| P3 | "Open the capture log in your inventory. Crack Delphine's record with both things you learnt, then tell me." | Crack with nothing, with one fact (no match), with both (cracked, at once). Tell Ama. | (Ama) "Her dog's name and the year it came home. Two facts she shared without a thought were enough." `crack_guessable` |
| P4 | "There's a printer admin note in the cupboard by the printers. Take it." then "Then crack Graham's record from the file in your inventory. It's salted, so every guess takes longer. Wait for it." | Take the note in the office; crack Graham's row, from the capture log or from the held record file in the tray; wait about 20 s. A press made before the note ends "No match": press again. | (Ama) "The cracker finished by itself when the wait ran out, and said what it found. Graham's password was the printer account's too." then "One person, one password, two accounts. That's reuse." `crack_reused` |
| P5 | "Try Julian's record. Try it twice, then tell me." | Crack twice: "No match", then "This one will not fall to guessing." | (Ama) "Long and random. The cracker gives up on it, and says so." `crack_strong` |
| P6 | "Sign in at Delphine's PC with her password once she's left it." | Coffee lever; sign in at `delphine_pc` with the tile tagged Cracked. | (bark) "Her tile said Cracked and filled the password in for you. A cracked password works like any you hold. And no Administrator on the taskbar." `user_signin` |
| P6b | "Plug the USB stick into the port on Delphine's desk." | `interact` `desk_usb_port` with the stick held (a user session, or none). | (bark) "The desk policy refused the stick. That's a rule doing its job." `usb_refused` |
| P7 | "Julian's out at his client lunch. Sign in at his PC as Graham." (before lunch: "Julian's at his desk until his client lunch. Ask me to send them to lunch.") | At `partner_pc`, pick Graham's Cracked tile. | (bark) "Graham is an administrator, so this session is one. Look at the taskbar." `admin_signin`; taskbar shows Administrator |
| P7b | "Open Client files in Julian's profile, then tell me. Delphine's sign-in never could." | Open Client files and the file; tell Ama. | (Ama) existing `tell_profile`; `profile_read` |
| P8 | "Still at Julian's PC as Graham? Plug the keystroke device into the socket beside it." | `partner_pc_socket`, "Plug it in". | (bark, 2.5 s) "His PC blocks devices, but an administrator's session let it through. That window's the office network. Close it for today." `override` |
| P8b (new) | "Ask me to send them for coffee, then sign in at Delphine's PC as Graham and try the stick in her port again." | Coffee lever; sign out of the partner PC if you like; sign in at `delphine_pc` as Graham (desks admit IT); `interact` `desk_usb_port`, answer "Plug it in". | (bark) "Same stick, same port. Signed in as an administrator, the policy let it through, and the log keeps an override row." `stick_override` (the confirm's `set_global`; the client refuses a stick before the confirm unless the session is admin, so the global is only set on an admin plant). `--ops-log`: a second `usb_install_overridden` row |

### Aim 3, afternoon: what a PC remembers (order 2)

All before "Call it a day" (Jun goes home with the others).

| Beat | Pointer (Ama) | Do | Line and tick |
|---|---|---|---|
| P10 | "Still signed in at Julian's PC as Graham? Use Cached accounts on its desktop, then tell me." | At `partner_pc` as Graham, "Cached accounts" twice (second: "Nothing new is cached here."); tell Ama. | (Ama) existing `tell_collect_partner`; `collect_partner`. Crack Delphine's cached row (at once) and Julian's (never) if you like |
| P11a | "Sign in at the hot desk as Graham and collect what it remembers. Then sign out, and tell me." | At `hot_desk` as Graham, "Cached accounts"; toast "Hash collected" names one record (Niamh's) with a Crack button; tell Ama: "I collected at the hot desk." | (Ama) "One record, Niamh's. The toast has a Crack button when it names one record. Try it." `collect_hot_desk` (self-report; the engine does not check it) |
| P11b | "Now ask me to switch Jun's PC off, and watch where he goes. Do it before you call it a day." | Lever "Switch Jun's PC off." (offered only after P11a); watch Jun walk to the hot desk (about one minute). | (bark) "His PC was down, so he borrowed the hot desk. That's a workaround, and it leaves something behind." `see_borrow`. Switch his PC back on afterwards (lever "Switch Jun's PC back on.") |
| P11c (new) | "Collect at the hot desk again, then tell me." | Sign in at the hot desk again (Jun's session was displaced by the borrow, see probe 1), "Cached accounts" (the toast names one record, Jun's, since Niamh's was collected before), tell Ama: "I collected there again." | (Ama) "Now it remembers Jun as well. He signed in there, so it cached him." `collect_after_borrow` |
| P12 | "Crack one of the records you collected. A weak one falls at once. Then tell me." | Crack Niamh's (at once) or Jun's (with "Jun's cat", from his feed post); tell Ama. | (Ama) "A weak password falls whatever PC it came from." `crack_cached` |
| P13 | "Graham's rota talks about a shared desk account. Its record is in the IT room. Crack it, then sign in at Delphine's PC." and "Type the name and password under Other user." | Take `desk_rounds_record.dat` from `backups_cabinet`, crack it, "Other user" at `delphine_pc`. | (bark) "A shared desk account, cracked like any other. It works on Delphine's PC." `local_account` |
| P14 | "Now try the same account at Julian's PC. Look at what the sign-in screen says, then tell me." | "Other user" at `partner_pc` (sign out of Graham's session first); tell Ama. | (Ama) "Refused, with no lockout counted. Read the line above the tiles. It names the domain, and a local account isn't in it." `local_refused`. The "Domain: merrin" line (P15) is named here |

If Jun's PC was switched off before the first collect (the hub lever or the wall socket), P11a's knot answers "Two records this time, Niamh's and Jun's. He'd already borrowed it, so both were cached. No Crack button when a toast names two." and ticks `collect_after_borrow` as well; P11c is then done and Ama skips it.

### Aim 4, evening: the trail (order 3)

| Beat | Pointer (Ama) | Do | Line and tick |
|---|---|---|---|
| gate | "You've done the hands-on part. Tell me to call it a day." | Lever "Call it a day." with a beat undone: "Not yet. Some of the morning, midday and afternoon things are still undone, and staff won't be back once they've gone home." with "Skip them and call it a day anyway." and "Not yet."; done: "Yes, call it a day." | `act_evening` |
| P9 | "Open the sign-in log terminal in the IT room. Find your own rows, then flag the night-time failure." | Graham's line about the night; `signin_log_pc`; open the 02:10 row and flag it. | existing Graham lines; `read_log`. Ama's "That's everything." now adds "Try the printer account anywhere. No PC lets it in." |

End of run: `{"cmd":"sync"}`, the leak check naming every keyboard sign-in (Delphine at `delphine_pc`, Graham at `partner_pc`, Graham at `delphine_pc` for P8b, Graham at `hot_desk` once or twice, the shared account at `delphine_pc`) and every sign-out made while another PC held an admin session (`--logout`), then `verify-run.rb <game_id> --access` and `--ops-log`. The Rails test names the same sign-ins in `play_afternoon`.

## Probe answers recorded by the tour build (U2)

1. Jun borrows the hot desk while the player holds a session there: yes. `_borrowCandidate` (`systems/npc-needs.js:1866-1871`) needs the PC on, not hidden, free of other NPC claims and reachable; a player's session is none of those. On sitting down the borrower emits `npc_sat_at` and the workstation layer displaces the held session (`systems/pc-sessions.js:955`, message "Jun Watanabe has signed in at this PC"). So signing out first is courtesy, not a requirement; P11c says to sign in again. Read from code; not re-run in a browser by this unit.
2. A dropped borrow: the borrow is dropped only if not started within `BORROW_START_MS` (60 s of the needs clock, `npc-needs.js:196`, `_tickBorrow` `:1929`), for example because the hot desk is claimed by another NPC or Jun cannot reach it. Jun has one workaround (`at: 60`, `scenario.json.erb`), started once per (npc, index, hand) (`npc-workarounds.js:26-28`), so the way back is: switch his PC on again (lever "Switch Jun's PC back on."), then off again; the next failed use hands over a new hand. If it still does not come, restart the showcase.

## Free play (any time)

- Type the printer note's password at Graham's PC as Graham while he is away from his desk (lunch only): it signs in (the reuse done by hand). Read the password from the note, never from a guide.
- Wrong password three times at one PC: the failures merge into one log row with a count (xN).
- The printer account is refused at every PC (a service account has no PC); at a PC whose user is present it says "<Name> is using this PC." instead (shown properly in `demo_ops_second_step`).
- Admin session kept over a reload: `{"cmd":"sync"}`, reload, bootstrap resume, `interact` `partner_pc`: Administrator mark back, no sign-in screen.
- Press the coffee lever, then switch the office coffee off at the wall socket while Delphine is on her way: she turns back (or goes to the kitchen machine).

## Not in the tour

| Feature | Shown in |
|---|---|
| A shared local administrator opens every PC it is on (A20) | `test_ops_privilege` (`deskadmin`, `localTo` two desks) |
| A `common` record and its unsalted pair crack together (A21) | `test_ops_crack` |
| Failed sign-ins and lockout in detail | free play above |
| Second step and the helpdesk | `demo_ops_second_step` |

## Expected timings (to be measured live and written here)

Not yet measured: Delphine's coffee away time (about 28 s in the first run), Graham's lunch (25 to 60 s), the salted countdown (about 20 s), the borrow (about 60 s from the switch). Recorded in the first live playtest of the tour; the passwords showcase waits on no routine for more than about a minute by design.


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
