# Keyholder Trials: playtest segment 1 (start to L5 library door)

Date: 2026-10-06. Tester: Sonnet subagent. Source of steps: `TESTING_WALKTHROUGH.md` (steps 1-9).

**Question answered:** plumbing, as a regression run. Every answer was fetched from its in-game source and decoded in the in-game CyberChef before it was typed into the lock. A few deliberate wrong guesses probed lock feedback.

- Game id: **1578** (mission 79), server :3001 (keyless), headless browser (machine load average was 13-15 during the run, so wall-clock times are inflated).
- Session log: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/6fd2619b-d6ba-4c71-be4b-f1c8e1689252/scratchpad/playtest-p1/session-1578.jsonl` (941 commands; the briefing is lines 1-~60, the reload is around the 520s mark of the run, the L5 door is the last ~40 lines).
- Scratch folder: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/6fd2619b-d6ba-4c71-be4b-f1c8e1689252/scratchpad/playtest-p1/` (helper scripts `h.sh`, `b.sh`, `adv.sh`, `notes.sh`, `cc.py`; `verify-1578.txt`).
- Screenshots, same folder: `01-notes-after-briefing.png` (Mission Brief note after the briefing), `02-teaching-lab.png` and `03-lab.png` (lab, Tom, camera mid-scroll), `04-laptop-try.png` (empty Crypto Workstation), `05-after-device.png` (Keyholder chat with HaX toast), `06-l2-unsplit.png` (L2 unsplit recipe error), `07-after-reload-title.png` ("Continue?" title after reload), `08-library.png` (library, two stacked toasts, aims panel).

## How CyberChef was driven

The laptop is an iframe (`.laptop-screen iframe`, same origin). I pasted the clue with a synthetic paste event into the Input editor, typed the operation name in Search and double-clicked the result, then read the Output pane. Each clue text came from the game: the notepad (leaflet, poster), a viewer (Trial II/III cards), or the guest terminal file. Nothing was taken from the walkthrough or from a render.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| L1 lockbox word | `falcon` | Keyholder Leaflet in notepad (`102 97 108 99 111 110`, from Jordan Pike), From Decimal | step 3 (03:36) | yes |
| L2 locker PIN | `6476` | Trial II Card from lockbox (`54525554`), split to pairs `54 52 55 54`, From Decimal | step 5 (03:37, input fetched) | yes |
| L3 guest terminal word | `lantana` | Trial III Card from locker (7 bytes of binary), From Binary | step 6 (03:39) | yes |
| L4 corridor passphrase | `turret` | `trial_iv.hex` on guest terminal, From Hex gives `corridor door passphrase: turret`; last word typed | step 7 (03:41) | yes |
| L5 library PIN | `5565` | Trial V Poster in corridor (Base64), From Base64 gives `Library keypad: 5565. ...` | step 8 (03:42) | yes |

No row is "no". There are no flags or VM work in this scenario. The values are per-game; they differ from the seed-42 examples in the walkthrough. I never read the walkthrough's seed-42 answers into the game. Every other value in the walkthrough (the answer words) was unknown to me before decoding.

Exercised, not earned: nothing. Deliberate wrong guesses (probing feedback, not shortcuts): `hawk` at L1 (feedback "Incorrect password. 4 attempts remaining."), `5452` at L2 (three wrong tries, lockout, see finding 7), the whole decoded line `corridor door passphrase: turret` at L4 ("Incorrect password. 2 attempts remaining.").

## Step results

Times are wall clock for the segment, headless and under load. Total from first command to library door unlocked: 03:30:56 to 03:42:38, 11 min 42 s.

| Step | Walkthrough | Result | Time |
|---|---|---|---|
| 1 Briefing | Plays by itself, `comms_discipline` note on the first line, `briefing_played` | **PASS** with a difference: the briefing ends on its last HaX line with no "On my way." choice (see finding 8). Notepad got Mission Brief and Comms Discipline. Tutorial prompt then appeared, declined. | 03:30:56 to 03:31:57 (about 1 min) |
| 2 Foyer exhibits | Optional | **PASS.** Plaque, Byte Wall alarm panel, poster, ASCII chart, paper tape all open and read. `read_byte_wall` task completed on the panel (gone from open tasks). | 03:31:57 to 03:32:19 |
| 2 Jordan Pike | `visit_stand` complete, leaflet in notepad, HaX text "Numbers between 97 and 122..." | **PASS.** Task complete, leaflet note in notepad (`102 97 108 99 111 110`, fingerprint in observations). HaX toast seen. All three questions answered, then "Thanks. I'll have a go." | 03:32:19 to about 03:33:00 |
| 3 Tom Shaw | `get_lab_laptop`, laptop in inventory, FN1-3 in notepad | **PASS.** Laptop (`Lab Laptop (CyberChef)`) in inventory, three induction field notes in notepad. Aim `freshers_week` completed and `trials_bits` opened (open tasks `open_lockbox`, `open_locker`, `open_guest_terminal`, `open_corridor`). See finding 1 for the approach problem. | 03:33:15 to 03:34:44 (1 min 29 s, 40 s of it lost approaching Tom) |
| 4 L1 lockbox | Word opens it, `open_lockbox`, `lockbox_open`, HaX L2 nudge | **PASS.** `falcon` opens it; contents auto-opened (Keyholder Device, Trial II Card). HaX toast "Eight digits for a four-digit keypad. Read it as characters. Bring the black box too; I want to know who's on the other end." | 03:35:13 to 03:36:29 (1 min 16 s, includes opening the laptop and a wrong guess) |
| 5 Lockbox contents | Take card and device, Keyholder chat opens | **PASS.** Both taken; chat opened a few seconds after taking the device (see finding 6), `ghost_greeted` true. Closed with "Close the device." D1 check: laptop closed and reopened, recipe (From Decimal) and input (`102 97 108 99 111 110`) were still there. | 03:36:29 to 03:37:15 |
| 6 L2 locker | PIN from paired digits, `open_locker`, take Trial III card | **PASS.** Unsplit input gives "Data is not a valid byteArray: [54525554]" (screenshot 06). Split to pairs gives `6476`. Locker opens; Trial III Card taken (`open_locker` complete, `locker_open` true). Common noticeboard and Megan visited first. | 03:37:15 to 03:39:34 (2 min 19 s, includes Megan, noticeboard, accidental lockout) |
| Reload after L2 | Check nothing lost | **PASS with caveats.** Synced, reloaded at 03:39:53. Briefing did not replay. Tasks, globals, inventory (4 items), notepad (now 11 notes including both cards) all intact. Player returned to the foyer start position, not the common room. Title screen showed "The Keyholder Trials / Continue?" with no resume overlay. The CyberChef recipe and input were **not** kept (empty workspace). See findings 3, 4. | 03:39:53 to 03:40:47 (54 s) |
| 7 L3 guest terminal | From Binary, word, `open_guest_terminal`, then read `trial_iv_hex` | **PASS.** `lantana` opens it; terminal opens again by itself as a container showing `trial_iv.hex` (hex text file, 64 B). `open_guest_terminal` complete. | 03:40:47 to 03:41:08 (21 s) |
| 8 L4 corridor door | From Hex, last word, `open_corridor`, `trials_keys` unlocks | **PASS.** Decoded text `corridor door passphrase: turret`; typing the whole line is refused ("Incorrect password. 2 attempts remaining."), `turret` opens the door. Open tasks now include `open_library`, `open_special_collections`, `open_pigeonholes`, `open_drop_box`. | 03:41:08 to 03:41:53 (45 s) |
| 9 L5 library door | Poster Base64 gives PIN, `open_library`, `library_open` | **PASS.** Poster auto-added to notepad as note 12/12; From Base64 gives `Library keypad: 5565. The returns shelf has your next trial.` PIN `5565` opens the door; `open_library` complete; library entered. HaX toast "That poster's in Base64: six bits a symbol. Field note on request." (fn04 offer). | 03:41:53 to 03:42:38 (45 s) |

## verify-run.rb (game 1578, after `sync`)

```
game            1578  (mission 79)
created         2026-10-06 02:30:32 UTC
last write      2026-10-06 02:42:56 UTC
played for      744s of wall clock
current room    "foyer"
unlocked rooms  5: foyer, teaching_lab, common_room, corridor, library
unlocked objs   3: cryptosecure_lockbox, candidate_locker_4, keyholder_guest_terminal
inventory       14: Your Phone, Notepad, Comms Discipline, ASCII Chart Handout, Punched Paper Tape (1979), Keyholder Leaflet, Lab Laptop (CyberChef), Field Note 1: Bits, Bytes, Bases, CyberChef, Field Note 2: Characters Are Numbers, Field Note 3: Hex and Binary, Trial II Card, Keyholder Device, Trial III Card, Trial V Poster
NPCs met        8: briefing_cutscene, agent_0x99, ghost, closing_debrief_person, jordan_pike, tom_shaw, megan_oyelaran, cliffe_schreuders
flags submitted 0: 
globals set     15: briefing_played, comms_had, corridor_open, ending, engine_tutorial_declined, fn04_offered, fn05_offered, ghost_greeted, guest_terminal_open, library_open, lockbox_open, locker_open, megan_choice, player_name, report_read_claimed

VERDICT: progress recorded — 4 rooms beyond the first, 3 objects unlocked, 0 flags submitted.
```

Note: the server record says `current room "foyer"` although the player was in the library when the run ended; the room appears to be saved only on some events (see finding 4). `fn05_offered` is set although I only entered the library for the screenshot; the HaX L6 offer fires on room entry as designed.

## Findings

Counts: **0 blockers, 0 majors, 11 minors.**

| # | Severity | Finding | Evidence |
|---|---|---|---|
| 1 | minor | **Tom Shaw is hard to reach from the door.** `moveToNear tom_shaw` twice stopped at (-107,94), 95 px from Tom, with "down" blocked (desk and chair row). I got to him by walking left to x=-265, then down, then along y=172. The reported room coordinates and the screen layout also looked mirrored (Tom sits at the top of the screen at the whiteboard, yet the bridge puts him below the player). Could not classify: suspect layout or pathing, not confirmed as an engine fault. A first-year clicking Tom from the door may stall. | log: first `moveToNear tom_shaw`; screenshots 02, 03 |
| 2 | minor | **The Mission Brief and Comms Discipline notes give the ending-B mechanism at minute one.** Both say to submit "what HaX most needs to know as a flag" on the Hacktivity terminal in Dr Schreuders' workshop, "lower case, exactly as found: a word, a dash and some digits". It is the same reveal the debrief and workshop later make useful. A beginner reads a sentence about flags before they have a laptop. It may be too early to land. | notepad notes 1, 2 |
| 3 | minor | **CyberChef workspace is lost on page reload.** D1 works: closing and reopening the laptop kept From Decimal and its input. A full reload wiped recipe and input. Walkthrough steps 18 and 21 say to "keep this recipe open"; a reload between L8b and L10 loses the AES recipe. The notepad pencil is the stated store, but the player is not told that reload clears the laptop. | before reload: state showed From Decimal + input; after reload: `ops: []`, empty input |
| 4 | minor | **After a reload the player restarts at the foyer start position (160,144) behind a "Continue?" title screen.** Everything else is kept. Position isn't restored (I was in the common room), and the server's `current room` stayed `"foyer"` even at the end when I was in the library. The harness `pressKey " "` is refused while the title is up; a synthetic keydown on document/window continued the game. | screenshot 07; verify-run line `current room "foyer"` |
| 5 | minor | **Trial II is over-hinted from four directions, and the CyberChef error is unhelpful.** HaX toast ("Read it as characters"), the noticeboard flyer ("Read it as characters, not as a number"), Megan ("it's characters... that hex thing and got four capital letters"), and Field Note 2 all point the same way. Megan names the exact two wrong routes in the walkthrough's recipe note, which removes the puzzle for anyone who talks to her. Meanwhile the one thing a beginner will see, "Data is not a valid byteArray: [54525554]", doesn't say that the numbers need spaces. If the intended lesson is "split the digits yourself", only the field note and HaX's two-digit remark teach it, and neither says "put a space after every two digits". | screenshot 06; Megan transcript; noticeboard text |
| 6 | minor | **Ghost's device chat opens several seconds after taking the device, not on take.** Right after `take Keyholder Device` the minigame was closed and no dialogue showed; the chat appeared a few seconds later with `ghost_greeted` set. A player who moves away in that gap may be pulled into a chat mid-walk. The chat then loops: "Who are you?" gives one reply, then "Still watching." returns and "Who are you?" is offered again, with nothing new on a second ask. | log around the `take Keyholder Device` call; screenshot 05 |
| 7 | minor | **(harness, not game)** `{"cmd":"lock","code":"5452"}` on the locker retried the wrong PIN three times in one call ("tap 5452" x3), which locked the pad. Reopening the pad reset it as the walkthrough says. I did not see the "System locked" text itself because the pad closed. Noted so a later runner doesn't read it as a game fault. The right PIN then worked on reopen. | log: `lock` at the locker |
| 8 | minor | **Walkthrough and game differ on the briefing end.** Walkthrough step 1 says to click through to "On my way."; in the build the last HaX line ("Get a lab laptop from Dr Shaw ... Then go and be found.") ends the briefing and the Mission Brief note opens on its own, with no "On my way." choice. Update the walkthrough, or the choice has gone missing. | briefing transcript, log lines near start |
| 9 | minor | **Toast timing and stacking.** In the library screenshot two HaX/Keyholder toasts were stacked on screen after I had entered: the Base64 note ("That poster's in Base64...") arrived after I had already decoded the poster, and Ghost's Trial IV line ("Thirty-one candidates left. Most of them asked the Magic button. I can tell which.") arrived during Trial V, a room and two locks after L4. The Ghost line is about the Magic button, which a beginner meets at L2 and L4. It lands late rather than at the point it refers to. | screenshot 08 |
| 10 | minor | **`trial_iv.hex` is not added to the notepad automatically.** Trial II, Trial III cards and the Trial V poster land in the notepad on pickup (note count went 9 to 11, and 12 after the poster). The hex file on the guest terminal needs "Add to Notepad", or a copy via the file viewer's Copy button. It is 64 hex characters; a beginner without Copy may retype it. If the intention is "paste into CyberChef", say so. | inventory list in verify-run has no `trial_iv` entry |
| 11 | minor | **Tom looks like Ghost.** Tom uses the hooded black figure (placeholder art, see `ART_NEEDED.md`), the same shape as the Ghost portrait on the HUD and the Keyholder toast. A first-year could read the friendly lab technician as the villain, or Ghost's sighting in the lab as Tom. (Placeholder art, expected to change.) | screenshots 02, 03 |

Not tested in this segment: Tom's hub choice about the guest terminal ("That CryptoSecure terminal on your desk"), the briefing closed early, opening the lockbox before visiting Tom, the HaX hint ladder and field-note requests, Cliffe's laptop and the Cliffe NPC, and the workshop. Megan's `[Why do you want it so much?]` and `[How are you getting on with Trial II?]` were both read; the "Walk away" choice for the side aim was not offered yet.

## Confusing, slow or odd (beginner view)

- Fastest honest route once the facts are known is about 11-12 minutes under load. A first-year will take longer, mainly on L2 and on finding the "pop CyberChef out into its own tab" arrow that Tom and Field Note 1 mention (I never popped it out; the in-game laptop pane worked fine for everything).
- Where to find the answers is clear at every step: the leaflet, the cards and the poster each say which lock they belong to. The only stall was Tom's location in the room.
- The password-lock feedback ("Incorrect password. N attempts remaining.") is fine and the attempt counters differ per lock (lockbox 5, corridor door 3). The L4 door says nothing about what kind of word it wants; the passphrase reads "corridor door passphrase: turret" and a beginner may type the whole line first. They will be told it's wrong but not why.
- Jordan's referral-bonus joke, Tom's northern phrasing ("owt", "nowt"), and Megan's overdraft/care-home lines read well and are clear to a beginner. Megan's auto-opening "You after the Keyholder money as well?" when I walked past her to the noticeboard interrupted my walk; harmless.
- Hearts in the HUD (5) sit above the inventory on every screenshot though combat is disabled. Cosmetic.

## Housekeeping

Session 1578 stopped with `session-stop.sh` (synced first, 941 commands, 0 flags used); its browser PID tree was torn down by it. Other `playtest-session.js` processes still running belong to other segments (game 1580) and were left alone. Edited only this file. Nothing committed. The :3000 server was not touched.
