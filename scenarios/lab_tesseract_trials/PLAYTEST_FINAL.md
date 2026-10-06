# Keyholder Trials: final end-to-end confirmation playtest (ten-room layout)

Result: **PASS, 0 blockers, 1 major, 10 minors.** One fresh game went from the briefing to the credits. I earned every answer in the game and decoded it in the in-game CyberChef, then took the double-agent ending.

- **Question answered:** plumbing and solvability on the critical path. This was a regression run: I knew the route, but fetched every secret from its in-game source before using it.
- **Script:** `TESTING_WALKTHROUGH.md` (ten-room version, as read at 10:59 UTC on 2026-10-06).
- **Game id:** **1607** (mission 79), keyless server :3001. Chromium was headed, `--speed fast`, load average about 2, and no other playtest was running.
- **Scenario version:** the ERB as rendered at game creation (09:59:41 UTC). Other agents changed `scenario.json.erb` and added `npc_oleg.ink` during or after the run, so this run says nothing about those changes.
- **Scratch folder:** `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/6fd2619b-d6ba-4c71-be4b-f1c8e1689252/scratchpad/playtest-final/`
- **Session logs (same folder):** `session-1607.jsonl` (440 lines: briefing to the guest terminal) and `session-1607b.jsonl` (812 lines: restart onwards, see H1). Below, "a:" means the first log and "b:" the second.
- **Screenshots (same folder):** `01-briefing.png`, `02-campus.png`, `03-byte-wall.png`, `04-lecture-theatre.png`, `05-lecture-theatre.png`, `06-common-room.png`, `07-teaching-lab.png`, `08-foyer-west.png`, `09-stuck-west-door.png`, `10-teaching-lab.png`, `11-corridor.png`, `12-library.png`, `13-special-collections.png`, `14-safe-open.png`, `15-corridor-east-door.png`, `16-sidhu-office.png`, `17-seminar-room.png`, `18-ledger.png`, `19-pigeonholes-open.png`, `20-after-reload.png`, `21-corridor-after-reload.png`, `22-workshop.png`, `23-ghost-call.png`, `24-debrief.png`, `25-credits.png`.
- **CyberChef:** driven through its own page elements: a paste event into the input box, the operation search with a double-click, the argument fields, and the output lines. The driver was a `window.__cc` object defined by an inline `eval` command, re-sent after each reload. Nothing was written to disk.
- **Clean-up:** both sessions were stopped with `session-stop.sh`, and browser pids 605674 and 636355 were confirmed gone. Nothing was committed.

## verify-run.rb (after the session stopped)

```
game            1607  (mission 79)
created         2026-10-06 09:59:41 UTC
last write      2026-10-06 10:40:19 UTC
played for      2438s of wall clock
current room    "foyer"
unlocked rooms  10: foyer, lecture_theatre, common_room, teaching_lab, corridor, library, special_collections, sidhu_office, seminar_room, workshop
unlocked objs   9: cryptosecure_lockbox, candidate_locker_4, keyholder_guest_terminal, special_collections_safe, pigeonholes, lab_account_pc, cryptosecure_drop_box, relay_terminal, hacktivity_scoreboard
inventory       19: Your Phone, Notepad, Comms Discipline, Keyholder Leaflet, Lab Laptop (CyberChef), Field Note 1: Bits, Bytes, Bases, CyberChef, Field Note 2: Characters Are Numbers, Field Note 3: Hex and Binary, Trial II Card, Keyholder Device, Trial III Card, Trial V Poster, Returns Slip, Field Note 7: Hashes, Field Note 10: Signatures, Tag on the Drop Box, Brass Key, Final Trial Card, Field Note 9: Public Keys
NPCs met        10: briefing_cutscene, agent_0x99, ghost, closing_debrief_person, jordan_pike, tom_shaw, megan_oyelaran, cliffe_schreuders, sidhu_selvarajan, cliffe_workshop
flags submitted 0: 
globals set     30: briefing_played, comms_had, corridor_open, decision_made, drop_box_open, ending, engine_tutorial_declined, fn04_offered, fn05_offered, fn06_offered, fn07_had, fn08_offered, fn09_offered, fn10_had, ghost_greeted, ghost_offer_heard, ghost_offer_made, guest_terminal_open, library_open, lockbox_open, locker_open, megan_choice, pigeonholes_open, player_name, relay_opened, report_read_claimed, special_collections_open, start_debrief_cutscene, warned_out_of_band, workshop_open

VERDICT: progress recorded — 9 rooms beyond the first, 9 objects unlocked, 0 flags submitted.
Cross-check the specifics above against the report.
```

A Rails runner check confirmed `Game#status` = `completed`, `ending` = `double`, `warned_out_of_band` = true and `late_warning` = false. The run has no flag stations, so "flags submitted 0" is correct. Megan and Cliffe appear under "NPCs met" because I entered the common room; I didn't talk to them.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Lab laptop, FN1 to FN3 | (items) | Tom Shaw, lecture theatre, dialogue | a:168 | yes |
| L1 lockbox word | `heather` | Keyholder Leaflet (notepad, page 4: `104 101 97 116 104 101 114`), From Decimal | a:~200 to 225 | yes |
| Keyholder device, Trial II card | (items) | lockbox | a:232 on | yes |
| L2 locker PIN | `7407` | Trial II card `55524855`, split into pairs, From Decimal. Unsplit input gives "Data is not a valid byteArray" | a:~270 | yes |
| L3 terminal word | `pumice` | Trial III card (binary), From Binary | a:~300 | yes |
| L4 corridor word | `clocktower` | `trial_iv.hex` on the guest terminal, From Hex, "corridor door passphrase: clocktower" | b:~30 to 45 (re-read after the restart) | yes |
| L5 library PIN | `2609` | Trial V poster (corridor), From Base64, "…Library keypad: 2609" | b:~70 | yes |
| L6 safe word | `flyleaf` | Returns slip (library), From Base64 then ROT13 Amount -6, "Special Collections safe password: flyleaf" | b:~100 | yes |
| Trial VII ciphertext | `Lchtw vg ckkr…fcxpvrn-27` | `trial_vii.txt` in the Special Collections safe, taken with the viewer's Copy button | b:~125 | yes |
| Vigenère key | `nonce` | ledger whiteboard, seminar room, Block 4 | b:~270 | yes |
| Pigeonhole password | `satchel-27` | Vigenère Decode (key nonce): "…the pigeonholes open with satchel-27" | b:284 | yes |
| Your pigeonhole | five | same decode | b:284 | yes |
| IV | `4a11a896a112c88d616c9f464d4868fa` | same decode | b:284 | yes |
| Envelope | Base64 (344 B) | Pigeonhole 5 in the opened pigeonholes, Copy button | b:~320 | yes |
| RSA private key | PEM, 27 lines | `private_key.pem` on Your Lab Account (teaching lab), read after the README | b:364 | yes |
| AES key | `b8084326d12e45b9928046ca13ef7ad3` | From Base64, RSA Decrypt (OAEP, SHA-1 defaults) | b:392 | yes |
| L8b drop box passphrase | `tumbler-41` | Tag on the Drop Box (`9c08071e…3836`), AES Decrypt with the key and IV above (CBC, Hex in, Raw out, all defaults) | b:~420 | yes |
| Brass key, Final Trial Card | (items) | drop box | b:444 | yes |
| L9 workshop door | Brass Key | drop box | b:~455 | yes |
| L10 relay fingerprint | `53b6a63f` | SHA2 (Size 256) appended under AES Decrypt in the same recipe. Cross-checked with `sha256sum` | b:~480 | yes |
| Beacon token / scoreboard flag | `osprey-7204` | `report.b64` on the relay terminal, From Base64, `<img src=".../px/locate/osprey-7204/1x1.png">` | b:~610 | yes |

No row is marked "no". Every lock on the critical path was opened with a value read in the game and decoded in the in-game CyberChef, so this run is a solvability pass for the double-agent route.

## Act times (wall clock)

| Act | From | To | Time | Notes |
|---|---|---|---|---|
| 1. Freshers' Week (briefing, Jordan, Byte Wall, Tom) | 10:59:53 | 11:03:04 | 3 min 11 s | |
| 2. Bits and Bytes (L1 to L4) | 11:03:04 | 11:18:13 | 15 min 09 s | About 5 min lost to the harness hang and restart (H1), and about 4 min to the foyer west door (F1) |
| 3. Secrets and Keys (L5 to L8b) | 11:18:13 | 11:33:14 | 15 min 01 s | Includes the planned reload (about 1 min) and the corridor east door (F1, about 2 min) |
| 4. The Keyholder and The Offer (L9, L10, call, report, scoreboard, send, debrief) | 11:33:14 | 11:39:08 | 5 min 54 s | The credits then ran for about 2.5 min |
| Total | 10:59:53 | ~11:42 | ~42 min | The server's "played for" is 2438 s. Fast harness speed, no TTS. A human player would be much slower on reading and on CyberChef. |

## Step results (checks asked for first)

| Check | Result | Evidence |
|---|---|---|
| Briefing on the field HQ background | **pass** | `01-briefing.png`: HaX on the hq4 office (brick, tall windows, pinboard). Starts by itself after the title screen; `comms_discipline` arrives with the first line |
| Campus narrator transition | **pass** | `02-campus.png`: `miskatonic_campus` background, Narrator in italics. The scene closed by itself and the Mission Brief opened. I captured three of the four narrator lines; see N1 |
| Briefing not replayed after a reload | **pass** | after both reloads: title screen "Continue?", then straight into the world |
| Tom in the lecture theatre | **pass** | a:168. "Tom Shaw. I look after the first-years this week." Laptop and FN1 to FN3 given; the key-pair line comes after the first choice; `freshers_week` completes; `trials_bits` opens |
| Byte Wall panel | **pass** (minor F3) | `03-byte-wall.png`: eight lamps, 01001101, "Task Complete: Look at the Byte Wall" |
| Safe in Special Collections | **pass** | `13-special-collections.png`, `14-safe-open.png`: the safe stands by the door, `flyleaf` opened it, and it holds `trial_vii.txt`, Candidate Assessments and `job_0412.hex`. Ghost texted "Special Collections. Fourteen left…" |
| Sidhu and the ledger in the seminar room | **pass** | `17-seminar-room.png`, `18-ledger.png`: Sidhu gave FN7 and FN10 (`consult_sidhu` done). The ledger dialog reads cleanly, one sentence per block; Block 4 = "nonce" |
| Hub greetings not reprinting after a topic | **partial** | Jordan, Tom, Sidhu, Cliffe and the debrief hub: pass (a topic returns straight to the choices, with at most a one-line prompt). HaX's phone hub and the Keyholder device: **fail**, see F2 |
| Mid-game reload after the pigeonholes | **pass** | b:336 to 360, `20-after-reload.png`. Inventory (4 items), all 13 notes, open tasks and globals were unchanged; the pigeonholes reopened without a password (b:~400). Lost: the player position (back at the foyer start) and the CyberChef recipe (F10) |
| Ghost's call and offer | **pass** | b:494 onwards, `23-ghost-call.png`. The call opened by itself on L10. The "No name at St Catherine's…" refusal and all four prices were there, ending "Send it and you start Monday. So does she." "What's in it?" and "Could I change it first?" loop back. "I'll think about it." closes on "Take your time. The relay closes when you leave the building. I don't." (see F8). `ghost_offer_heard` is true |
| Debrief | **pass** | b:674, `24-debrief.png`: hq4 background. The opening is the `double` text ("…a flat in Leeds we rent for the purpose." / "Thank you for the flag." / "Ghost withdrew the studentship last night anyway…"). Both questions answered. `hear_debrief` completed on "Term starts Monday…" |
| Credits ("Never awarded") | **pass** | read with a MutationObserver on `#bv-cr-label`: KEYHOLDER: OFFER WITHDRAWN / THE KEYHOLDER TRIALS / ── HANDLER ── / DECOY FLAT, LEEDS: One visitor at four. Photographed. / AGENT HaX: Still your handler. / **THE KEYHOLDER STUDENTSHIP: Never awarded.** / ── CAMPUS ── / MEGAN OYELARAN: Took the CryptoSecure placement. / JORDAN PIKE: Referral bonus paid. / DR TOM SHAW: Reported the stand to the department. / DR SIDHU SELVARAJAN: Still checks everything twice. / MISKATONIC UNIVERSITY: Term starts Monday. / On the map, a room you haven't been in has a light on. / Ghost remains at large. `25-credits.png` |

## Step results (walkthrough steps)

| Step | Result | Log |
|---|---|---|
| 1 Briefing | pass | a:1 to ~120 |
| 2 Jordan: `visit_stand`, leaflet in the notepad, HaX text "Jordan's leaflet is in your notepad…" | pass | a:~140 |
| 3 Tom: laptop, FN1 to FN3, aim done | pass | a:168 |
| 4 L1 lockbox `heather` (`open_lockbox`, `lockbox_open`) | pass | a:232 |
| 5 Lockbox contents: Trial II card; device opens Ghost's chat ("DEVICE ACTIVE. Candidate…") | pass | a:~240 to 260 |
| 6 L2 Locker 4 `7407`; Ghost "Trial II. Two hundred and twelve…"; HaX "That phrasing…" | pass | a:288 |
| 7 L3 guest terminal `pumice`; `trial_iv.hex` readable | pass | a:420 |
| 8 L4 corridor door `clocktower`; `trials_bits` complete; Ghost "Trial IV. Thirty-one candidates left…" | pass | b:50 |
| 9 L5 library `2609`; HaX "Not decimal, not hex, not binary…" on entering the corridor | pass | b:86 |
| 10 L6 safe `flyleaf` | pass | b:120 |
| 11 Safe contents: `trial_vii.txt` copied with Copy ("File content copied to clipboard!") | pass | b:~125 |
| 12 Seminar room, ledger: Block 4 = nonce; Sidhu optional task done | pass | b:~240 to 280 |
| 13 Vigenère Decode → password, hole five, IV | pass | b:284 |
| 14 L7 pigeonholes `satchel-27` (`open_pigeonholes`, `fn08_offered`, `fn09_offered`) | pass | b:312 |
| (reload) | pass | b:336 |
| 15 Pigeonhole 5 envelope | pass | b:~320 (read before the reload) |
| 16 Lab account PC: README, `private_key.pem` | pass | b:364 |
| 17 RSA Decrypt → AES key | pass | b:392 |
| 18 L8b drop box `tumbler-41`; `trials_keys` done; HaX "Brass. Old-fashioned…", Ghost "Hybrid encryption. Nine candidates…" | pass | b:438 |
| 19 Brass key, Final Trial Card | pass | b:444 |
| 20 Workshop door (key lock, Brass Key); Cliffe "Door was locked for a reason, mate…" | pass | b:~455 to 470 |
| 21 L10 `53b6a63f`; call opens by itself | pass | b:494 |
| 22 Call (see above) | pass | b:494 to ~560 |
| 23 Relay terminal reopened: four files; `report.b64` decoded; token `osprey-7204` | pass | b:~600 to 615 |
| 24 Ending B: scoreboard `osprey-7204` (`warned_out_of_band`; receipt "Submission accepted. +50 points…"), then HaX "Sending you my report now." → "Copy." with no greeting after it; texts "Received. Opening it now." / "My phone just did something it shouldn't…" / Ghost "Opened. Thank you, Candidate…"; Cliffe "Interesting choice of channel." `ending` = `double` | pass | b:624 to 670 |
| 25 Debrief | pass | b:674 to ~740 |
| 26 Credits; server `completed` | pass | b:~740 to 811 |

## Findings

| # | Severity | Finding | Evidence |
|---|---|---|---|
| F1 | **major** (suspect layout; needs a check by eye) | **Side doors are hard to walk through.** In both rooms the walkable gap sits about 25 px above the door's listed position. Foyer west to the teaching lab (door listed at y=80): walking left stopped at x=41 for every y from 61 to 105 except a narrow band near y≈50 to 56. A pointer click into the lab (-60,80) stalled for 9 s, and a click at (44,75) for 13 s; neither got through. Corridor east to Sidhu's office (door listed at y=-48): walking right stopped at x=279 for y = -51, -44, -34 and -26, and only got through at y≈-74. On the visible door frame (`15-corridor-east-door.png`, `09-stuck-west-door.png`), the player sprite stands right at the door yet can't go through. About 4 minutes were lost the first time at the foyer west door. Approaching from the foyer centre with `enter` worked on later trips. I haven't ruled out the harness completely, because `enter` aims at the door's listed y, but pointer clicks failed too. A beginner would see a door they can't walk through. | a:~312 to 400, b:~200 to 215; `08-foyer-west.png`, `09-stuck-west-door.png`, `15-corridor-east-door.png` |
| F2 | minor | **HaX's hub greeting reprints after each topic.** After "Send me that field note." → "Public keys… Sent.", the line "I'm here. Careful what you say on this line." prints again before the choices. The Keyholder device does the same: after "Who are you?" → "The examiner…", "Still watching." prints again (and it already followed "I'll be watching" on the device's first open). Every person-chat hub (Jordan, Tom, Sidhu, Cliffe, debrief) did not repeat its greeting. | b:~640 to 650; a:~250 |
| F3 | minor | **The Byte Wall's explanation is almost invisible.** The footer "Each lamp is one bit. Eight bits make a byte. Read top to bottom, write it left to right: 01001101." is tiny dark-blue text on near-black. It is the panel's teaching line. | `03-byte-wall.png` |
| F4 | minor | **The corridor door's password pad has no prompt text** (only "Password:") and allows 3 attempts, where the containers have a sentence and 5 attempts. Nothing on the pad reminds a beginner that `trial_iv.hex` opens it, though the objective and Ghost's lines help. | b:~45 |
| F5 | minor | **The CryptoSecure stand is in the walking line to the lecture theatre door.** From the foyer start, walking to the south-west door stopped at (106,194) against the stand and lockbox, and a detour round the west side worked. From the lecture theatre doorway, `moveToNear` Tom failed until the player stepped down into the room. Possibly partly the harness. | a:~150 to 166; `04-lecture-theatre.png` |
| F6 | minor | **The Special Collections safe is awkward to reach from the door side.** Pathing went round to the north of the safe and stopped 32 px off, and a click towards the door side stalled for 9 s. It opened from (-96,-195). | b:~108 to 118 |
| F7 | minor | **After the restart, every phone message carries the same timestamp** (all "11:36" when the chat was reopened). HaX's post-send texts arrived as pop-ups but were not added to the HaX chat while it was open (seen after 16 s). Not verified after closing and reopening. | b:~630 to 660 |
| F8 | minor (doc) | **Walkthrough step 22 says "I'll think about it." exits on "Your terminal's still open. Read what I gave you."** In the ink (`phone_ghost.ink` 173 to 178), `#exit_conversation` comes before that line, so the call closes on "Take your time. The relay closes when you leave the building. I don't." and the other line belongs to the device's next opening. The game is fine; the walkthrough wording is off. (`TESTING_WALKTHROUGH.md` changed on disk during this run; this refers to the version read at the start.) | b:~560 |
| F9 | minor | **In the double ending, HaX's "My phone just did something it shouldn't. Get out of the building." reads like the bad outcome.** The player has just used the scoreboard, and HaX's receipt said "we'll be the ones who open it". A beginner may think the warning failed until the debrief explains the Leeds decoy, about a minute later. Arguably intended. | b:~660 |
| F10 | minor (known, as P2B B6 / P3 m5) | **After a reload the player is back at the foyer start and the CyberChef recipe and input are empty.** Close-and-reopen persistence (D1) works: the AES recipe survived three close and reopen cycles. | b:~360, ~392 ("kept: []") |
| F11 | minor (known, as P3 m6) | **The text viewer opened from a container closes to the world**, not back to the container (guest terminal, safe, pigeonholes, lab PC, relay terminal). Notes viewers (cards) do return. | throughout |

Counts: **0 blockers, 1 major, 10 minors.**

### Notes (not counted)

- **N1:** I captured three of the four campus Narrator lines. Without TTS the person-chat lines advance on a timer, and the fourth line ("The Computing building is through the columns…", `opening_briefing.ink` line 70) was shown and closed between my reads. The debrief also skipped past "Someone came to look at four…" before I read it. This is a pacing note: on the keyless server, lines move on by themselves faster than a slow reader can read them. Worth a look by eye on :3000.
- **N2:** The debrief says "Megan Oyelaran took a CryptoSecure summer placement… You could have warned her." I never read Candidate Assessments, so the Megan side aim never opened. Ghost did name her on the call, so the line is fair, but a player who skipped the safe's other file never got the chance.
- **N3:** The game view sits low and to the right of the browser window, with black space top-left, and some top-wall objects are cut off (`17-seminar-room.png`, `22-workshop.png`). The page has a vertical scrollbar, so this is probably the Playwright window size rather than the game. Not counted.
- **N4:** Megan, Cliffe (common room), the EBCDIC tape, the report hash and signature checks, and the other three endings were not exercised. P3 covered the endings.

### Harness notes (not findings)

- **H1:** In the first session I sent `navigator.clipboard.readText()` to check the Copy button. In a headed browser that waits on a permission prompt, and the harness hung, with every later command timing out. I stopped the session (synced state survived) and restarted on the same game at 11:16:14, which added an unplanned reload before the planned one. Afterwards I read copied text from the viewer's visible `.file-text`, after clicking Copy, and the viewer showed "File content copied to clipboard!". Don't read the clipboard in a headed run.
- **H2:** `lock` often reported `ok:false` and `interact` reported `ok:false` or `no-effect-confirmed` (lockbox, terminal, safe, pigeonholes, relay, scoreboard, laptop) although the lock or minigame had opened. I checked each one with `mg getState` and the task list.
- **H3:** After a reload the URL loses `?skip_resume=1`, so the Resume / Restart / New Session overlay appears. I clicked Resume by its exact text through the DOM.
