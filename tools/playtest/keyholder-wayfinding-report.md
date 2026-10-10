# The Keyholder Trials: wayfinding confirmation run

Which question this answers: plumbing (does the chained objectives list, the new Keyholder lines and the room names work on the intended route). It is a regression run, not a blind one. I read the solution guide for how each lock works; the values below were derived in-game.

- Mission: `lab_tesseract_trials`, game 1, http://127.0.0.1:3001/break_escape/games/1, headless, speed fast, one mid-run reload.
- Session log: `tools/playtest/keyholder-wayfinding-session.jsonl` (557 commands). The reload is at line 310.
- Screenshots: `tools/playtest/keyholder-wayfinding-01-after-device.png` to `-07-credits.png`.
- Setup note: the first load redirected to the character-select page because the demo player had no sprite chosen. I submitted the normal configuration form over HTTP (sprite `female_hacker_hood_v2`) and carried on. Nothing under the source directories was touched.

## verify-run.rb output (full)

```
game            1  (mission 17)
created         2026-10-10 15:29:14 UTC
last write      2026-10-10 15:43:02 UTC
played for      828s of wall clock
current room    "foyer"
unlocked rooms  10: foyer, lecture_theatre, common_room, teaching_lab, corridor, library, special_collections, sidhu_office, seminar_room, workshop
unlocked objs   8: cryptosecure_lockbox, candidate_locker_4, keyholder_guest_terminal, special_collections_safe, pigeonholes, lab_account_pc, cryptosecure_drop_box, relay_terminal
inventory       18: Your Phone, Notepad, Comms Discipline, Keyholder Leaflet, Lab Laptop (CyberChef), Field Note 1: Bits, Bytes, Bases, CyberChef, Field Note 2: Characters Are Numbers, Field Note 3: Hex and Binary, Keyholder Device, Trial II Card, Trial III Card, Trial V Poster, Returns Slip, Field Note 7: Hashes, Field Note 10: Signatures, Tag on the Drop Box, Brass Key, Final Trial Card
NPCs met        10: briefing_cutscene, agent_0x99, ghost, closing_debrief_person, jordan_pike, tom_shaw, megan_oyelaran, cliffe_schreuders, sidhu_selvarajan, cliffe_workshop
flags submitted 0: 
globals set     30: briefing_played, comms_had, corridor_open, decision_made, drop_box_open, ending, engine_tutorial_declined, fn04_offered, fn05_offered, fn06_offered, fn07_had, fn08_offered, fn09_offered, fn10_had, ghost_greeted, ghost_offer_heard, ghost_offer_made, guest_terminal_open, library_open, lockbox_open, locker_open, megan_choice, pigeonholes_open, player_name, refusal_reported, relay_opened, report_read_claimed, special_collections_open, start_debrief_cutscene, workshop_open

VERDICT: progress recorded — 9 rooms beyond the first, 8 objects unlocked, 0 flags submitted.
```

Game record: `status = completed`, `mission_concluded_at = 2026-10-10 15:43:01 UTC`. Ending reached: refusal (said no to the Keyholder, reported to HaX, "That's everything", credits showing).

## Earned-secrets table

All values came from clues read in-game. Decoding was done with my own tools (Python: base64, ASCII, Vigenère, RSA-OAEP, AES-CBC, SHA-256), not the in-game CyberChef. The game does not check how the answer was derived, so "earned" here means "fetched from the in-game source first, then used".

| Secret | Value used | In-game source | Obtained at | Earned? |
| --- | --- | --- | --- | --- |
| Lockbox word | `thistle` | Keyholder Leaflet (notepad page), decimal codes | before lockbox | yes |
| Locker 4 PIN | `8249` | Trial II Card from the lockbox (`56505257`, ASCII codes) | after lockbox | yes |
| Guest terminal word | `pumice` | Trial III Card from locker 4 (binary) | after locker | yes |
| Corridor door word | `clocktower` | `trial_iv.hex` on the guest terminal (hex, last word) | after terminal | yes |
| Library PIN | `3847` | Trial V Poster in the corridor (Base64) | after corridor | yes |
| Safe word | `octavo` | Returns Slip in the library (Base64, then shift -6) | after library | yes |
| Vigenère key | `merkle` | Ledger whiteboard, Seminar Room 2, block 4 data word | before pigeonholes | yes |
| Pigeonhole password | `letterbox-76` | `trial_vii.txt` from the safe, decoded with `merkle` | after safe + whiteboard | yes |
| Pigeonhole number | 5 | same decode | same | yes |
| Drop box IV | `77d7d95b6bf5a7a1852d09df0865fc8d` | same decode | same | yes |
| AES key | `80564efc9c0fc758d001be29e7395e5d` | Pigeonhole 5 envelope, RSA-OAEP with `private_key.pem` from "Your Lab Account" PC | after pigeonholes | yes |
| Drop box passphrase | `skeleton-68` | tag on the drop box, AES-128-CBC with the key and IV above | after tag | yes |
| Relay terminal fingerprint | `3b973e3d` | first eight hex of SHA-256 of `skeleton-68` (Final Trial Card) | after drop box | yes |
| Brass Key | (item) | CryptoSecure drop box | after drop box | yes |
| Ending choice | refuse | Ghost's call, option 4 | at call | n/a (a decision) |

No "no" rows. No VM flags exist in this mission. Not exercised: the optional scoreboard, the report hash/signature checks, the other endings, the in-game CyberChef itself.

## Pass criteria

### A. Chained objectives: PASS

At every step exactly one non-optional Trial task was open for the current aim. Each task completed and the next appeared. No task got stuck. Panel text is read from `#objectives-panel`. Completed tasks stay on the list, struck through (tick), so "shows exactly one" means one open, not one line.

| After | Panel for the current Trial aim |
| --- | --- |
| Start | Freshers' Week: Get a lab laptop (Lecture Theatre 1), Visit the CryptoSecure stand (Foyer), Look at the Byte Wall (Foyer, optional) |
| Tom's laptop | Bits and Bytes appears: Open the CryptoSecure lockbox (Foyer) |
| Lockbox | tick lockbox; Open candidate locker 4 (Student Common Room) |
| Locker 4 | tick; Get into the guest terminal (Teaching Lab 1) |
| Guest terminal | tick; Open the Computing Corridor door (Foyer) |
| Corridor door | Bits and Bytes ticked and collapsed. Secrets and Keys: Get into the library (Computing Corridor), Talk to Dr Selvarajan (Seminar Room 2, optional) |
| Library door | tick; Open the Special Collections safe (through the Library); the optional Selvarajan task still listed |
| Safe | tick; Open the pigeonholes (Computing Corridor) |
| Pigeonholes | tick; Open the CryptoSecure drop box (Computing Corridor) |
| Drop box | Secrets and Keys ticked. The Keyholder: Get into the workshop (Computing Corridor) |
| Workshop door | tick; Open the relay terminal (Workshop) |
| Relay terminal | The Offer: Answer the Keyholder, Use the fallback channel (optional), Report back to Agent HaX |

Screenshot `keyholder-wayfinding-02-aim2-start.png` and `-03-library-open.png` show the panel on screen. The panel updates a moment after the unlock, so a read taken straight after a successful lock briefly showed the previous state (the guest terminal and the safe). Reading again two seconds later showed the next task. That is timing, not a stuck task.

### B. Keyholder intro line: PASS

After taking the device the chat opened straight away and read:

> DEVICE ACTIVE. Candidate. You opened a box most of your year walked past. The rest get harder.
> I'll be watching. You won't see me do it.
> Trial II is in the student common room. Locker 4.

(`keyholder-wayfinding-01-after-device.png`.) It reads naturally as a third beat in the same voice. HaX's toast arrived on top of it ("Eight digits for a four-digit keypad. Odd. Bring the black box too; I want to know who's on the other end.") and does not clash: HaX talks about the card, the Keyholder about the place. HaX's toast mentions the eight digits although I had not yet taken the card; harmless.

Small overlap: the device later pushes "Trial II. Two hundred and twelve candidates picked up a card. Forty opened the locker...", so "Trial II" appears twice in the chat. It reads as the examiner commenting once you have done it, so I do not count it as a fault.

### C. Library message: PASS

About four seconds after the library door opened, a toast appeared: "Keyholder: Trial V. Twenty-two of you through that door. Trial VI is on the returns counter." The device showed three unread. In the chat it reads in order after the Trial IV line (`keyholder-wayfinding-04-device-messages.png`). The slip really is on the library's returns counter ("Left on the returns counter, beside a returned copy of The Codebreakers"), so the line is accurate.

### D. Room names match the rooms: PASS, with two wording notes

Door names seen in `room`/`brief`: Student Common Room, Teaching Lab 1, Computing Corridor, Lecture Theatre 1, Library, Special Collections, "Dr S. Selvarajan" (corridor door to his office), Seminar Room 2, "Workshop (knock)".

- Lockbox (Foyer): correct. Locker 4 (Student Common Room): correct. Guest terminal (Teaching Lab 1): correct. Corridor door (Foyer): correct, the door is on the foyer's north wall.
- Library (Computing Corridor): correct. Pigeonholes and drop box (Computing Corridor): correct. Workshop (Computing Corridor): correct. Relay terminal (Workshop): correct. Seminar Room 2: correct, reached through the door in Dr Selvarajan's office.
- Note 1: the safe's bracket reads "(through the Library)", which is a route, not a room. The room the student stands in is Special Collections (the door sign says so). It works, but it is the one title that does not name a room.
- Note 2: the corridor door to Dr Selvarajan's office is signed with his name, while the optional task says "Seminar Room 2". A student has to walk through the office to find the Seminar Room 2 sign. Not wrong.

### E. Conclusion, verifier, reload: PASS

- Played to the end (refusal ending, credits showing, `status = completed`). Verifier output above.
- Reload after the pigeonholes (log line 310): after reload and Enter on the title screen the panel still showed Bits and Bytes ticked, Secrets and Keys with the first four ticked and "Open the CryptoSecure drop box (Computing Corridor)" as the one open task. Chained state kept. (`keyholder-wayfinding-05-reload.png` is the title screen; the panel text was read from the DOM.) The player is back at the foyer start spot after a reload, as before.

### F. Wayfinding judgement

I knew the answers, so I did not wander and cannot time a lost first-year. What I can say from the screen:

| Transition | Clear where to go next? |
| --- | --- |
| Jordan to lockbox | Yes. Panel says "Open the CryptoSecure lockbox (Foyer)" after Tom. Before Tom the panel offers laptop, stand and Byte Wall, which is the existing intro. |
| Lockbox to locker 4 | Yes, and doubly so: the panel and the Keyholder both say common room, locker 4. |
| Locker to guest terminal | Yes. "Teaching Lab 1" matches the door sign; the Trial III card also says the terminal is in the teaching lab. |
| Terminal to corridor door | Yes. The panel names the Foyer, so the student knows to go back. |
| Corridor door to library | Yes. The panel says library, the poster is on the corridor wall, and the Trial V poster text names the keypad. |
| Library to safe | Yes. The Keyholder says "Trial VI is on the returns counter", the panel says Special Collections is through the library, and the slip names the safe. |
| Safe to pigeonholes | Mostly. The task says pigeonholes (Computing Corridor), but the key is in another room. The clue is in the file's own note ("the man who checks everything twice") and the optional "Talk to Dr Selvarajan (Seminar Room 2)" task stays listed. I would expect a first-year to need a few minutes here, and the optional task is the only on-screen pointer. This is the step most likely to still send a student wandering. |
| Pigeonholes to drop box to workshop | Yes, though the student must carry the AES key, IV and tag back to the same corridor. |
| Workshop to relay terminal | Yes. Panel names the Workshop. |
| Relay terminal to the end | The Offer aim shows three tasks at once (Answer, optional fallback, Report back to HaX), with no room names. It is clear because the call opens by itself. |

## Findings

| # | Severity | Finding | Evidence |
| --- | --- | --- | --- |
| 1 | minor | After the Trial V message, the Keyholder chat ends with an older state line, "The corridor. Fewer candidates every hour." The device's waiting bark picks the highest state it knows (`corridor_open` in `phone_ghost.ink` lines 87 to 95) and has no `library_open` case, so it reads as an anticlimax straight after the new library line. | `keyholder-wayfinding-04-device-messages.png` |
| 2 | minor | The safe task title ends "(through the Library)", not a room name; the room is Special Collections. | panel after library opens |
| 3 | minor | "The Offer" aim (after the relay terminal) lists all three tasks together and none has a room bracket. Harmless because the call is automatic, but it is not chained like the Trials. | panel after relay terminal |
| 4 | minor (design note) | Safe to pigeonholes is the one transition with no direct pointer to the Seminar Room. Only the optional Selvarajan task and the file's own note lead there. | step table above |
| 5 | note (setup, not a game bug) | A fresh keyless-server database has no sprite chosen for the demo player, so the game URL redirects to the character-select page and the harness reports `window.__test never appeared`. Submitting the configuration form fixes it. | first session start |

Counts: 0 blockers, 0 majors, 4 minors, 1 setup note.
