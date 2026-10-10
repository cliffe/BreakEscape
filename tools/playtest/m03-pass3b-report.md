# m03 pass-3b playtest: PARTIAL, stopped early (auto-mode block)

Status: INCOMPLETE. Mid-run, auto mode's safety check began refusing Bash ("blocked because of
earlier conversation content", will repeat for the rest of the conversation). This is the same
block the previous run (m03-pass3-report.md) hit. I stopped rather than work around it.
The trigger is probably the decode work I did on the Hidden USB Drive (I used the in-game
CyberChef iframe, driven by page `eval` setting its URL hash, not a local script).

- Question answered: plumbing plus unexpected-behaviour probing, game A only.
- Game: 1218 (flags `tools/playtest/m03_ghost_in_the_machine-flags-game1218.xml`).
- Session log: `tools/playtest/m03-pass3b-gameA-session.jsonl`. Screenshot: `tools/playtest/m03-pass3b-postit.png`.
- verify-run.rb: NOT RUN (Bash blocked). Per the skill this report is void as a solvability claim.
- `session-stop.sh 1218` was NOT run: the headless browser session for game 1218 is still open and no final `sync` was sent. Please run `tools/playtest/session-stop.sh 1218` then `BREAK_ESCAPE_STANDALONE=true bin/rails runner tools/playtest/verify-run.rb 1218`.
- status=completed / mission_concluded_at: not reached. No game completed. Checks 4, 5 (safe), 6, 7, 8 NOT run.
- I did not read PUZZLE_CHAINS_PLAN.md or the Pass 3 section of the walkthrough.

## Earned-secrets table (game A)

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Reception badge clone | cloner card | Receptionist hub: "Is anyone here after business hours?" then "Lean across the desk to examine the directory", flipper Save | before conference room | yes |
| Conference room door | emulate Staff Access Badge | cloned above, flipper Saved > Emulate | after clone | yes |
| Victoria's Executive Keycard | cloner card | Victoria conference scene, whiteboard keep-talking beats, flipper Save after "Capture done" | after the 2b recovery | yes |
| Server room door | emulate Executive Keycard | cloned above | after clone | yes |
| Server whiteboard text | read by eye (ROT13) | Server Room Whiteboard, "NIGHT TEAM: CATALOGUE STAYS IN THE WALL SAFE. SABLE HAS CHANGED THE CODE. NEW ONE COMES BY MAIL - DO NOT WRITE IT ON THIS BOARD." | server room | read yes |
| Executive-office door | pick (assisted) | not a secret; guard KO'd with debugKO first, then completeLockpick | - | assisted |
| Hidden USB Drive text | in-game CyberChef, From Base64 then ROT13 | Desk Drawer, executive office | exec office | yes (via in-game CyberChef; output "PHASE 2 -- INFRASTRUCTURE... Zero Day supplies. Critical Mass executes... -- A") |
| Executive Computer password | `Sterling2010` | plaque in reception ("Founded 2010 by Victoria Sterling") + receptionist ("2010... plaque") + helpdesk slip text on the PC | exec office | yes (accepted first try, `victoria_computer` locked:false) |
| Wall safe / server filing cabinet code | not found | whiteboard says the new code comes by mail; no source found yet | - | **no** |
| Flags 1 to 4 | not submitted | VM work impossible in standalone | - | **no** |

Rows marked "no": the safe and the catalogue, the flags, and everything downstream
(find_operational_logs, night confrontation, endings, credits) are unproven by this run.

## Check results

1. PC password from clues alone: **PASS** (in game A). The briefing was auto-clicked by bootstrap
   so I did not read it, but I did not need it: plaque ("Founded 2010 by Victoria Sterling") plus the
   slip printed inside the Executive Computer minigame ("surname plus the year we were founded,
   e.g. Smith1999") plus the sticky note "IT reset: Surname + year founded (e.g. Smith1999). Change it!"
   gave `Sterling2010`, accepted on the first submit. Screenshot `tools/playtest/m03-pass3b-postit.png`:
   the post-it text fits and is legible. The note sits half over the bottom edge of the monitor
   image, slightly overlapping it, and is readable. Contents of the computer: "Unsent draft (raw
   message source)" and "Client Roster" (not read, see below).
   Note the clue is also given in plain words in the minigame description, so the post-it is not
   the only source.
2. Victoria's afternoon (done in game A, not B): **PASS**.
   - Chose "Sounds like you sell vulnerabilities" (narrator warning once: "Her smile stays exactly
     where it was. Her eyes don't. A recruit wouldn't have said that.").
   - IGNORED the warning: chose "Ask about Zero Day's mission", "The free market argument", then
     "Move closer to examine the whiteboard". Read stalled: "She walks back to the table. The cloner's
     read stalls halfway, then drops. Out of range." Options then: Question the ethics / Play the
     eager recruit again / End the conversation.
   - Reload right after the failed read (I closed the chat and did `location.reload()`, then
     bootstrap resume): inventory intact, player put back in reception_lobby (known, same as the
     previous run). Back in conference room, Victoria opened with "Back for more conversation?" and
     the same three options.
   - "Play the eager recruit again" gave the recovery lines ("I came in swinging earlier...",
     "She doesn't warm to you. But she stops watching your hands."), then "Drift back to the whiteboard"
     appeared and worked ("Back at the board. The cloner finds her card again and picks up where it left
     off."), then the keep-talking beats ("Halfway.", "Keep her talking.", "Capture done"), and the clone
     succeeded (`victoria_card_cloned`). No repeated lines, no soft-lock.
   - Minor: after "Drift back" the three whiteboard questions all re-appeared including the already-asked
     "What kind of services do you run in the lab environment?" (not harmful).
3. Night guard caught lockpicking: **PASS for the warning conversation; hostile survival NOT measured**.
   - First catch (game A, standing at (564,-90), guard on his west leg at about 93px): conversation "A torch beam
     lands on your hands, and on the pick in them." / "Oi. Away from the door. Now." with options
     "Ms. Sterling locked her keys in. She asked me to fetch her forms." / "Sorry. Wrong door. I'm going." /
     "Shove past him." I chose the cover story: "With a pick set. Course she did. I'm writing it down. Do that
     again where I can see it and I'm calling it in." No hostility. `guard_detection_count` = 1.
     Perfect Stealth lost: the optional task `zero_detection` stayed open and the count is 1.
   - Second catch immediately after (the same door, about 0.4 s after interact): "Again? I told you once."
     with "Put the picks away and back off." / "Stand your ground." I chose back off: "Last warning. Next time
     I'm not asking." `guard_detection_count` = 2. So the second catch also talks down.
   - Note both catches happened with the lockpicking minigame never opening (interact returned ok, no
     minigame, then the conversation). A third attempt was not tried. I did not test the hostile path,
     so "how long do you survive" is not answered; the previous run saw 100 to 0 HP in about 3 s.
   - Guard loop observed again: idle at east end (580,-34), walks west along y=-27, idle west (484,-52),
     walks east along y=-59, period about 12 s. The door is at (592,-96), directly beside the east end.
4. Night confrontation recruit option: NOT RUN.
5. Safe code from clues: NOT FOUND in the places I looked (server room whiteboard, conference whiteboard,
   Presentation Materials, Danny's office, plaque). Not opened. Executive filing cabinet and exec computer
   contents not read; the wall safe was not opened (interacting next to it opened the Filing Cabinet pick
   minigame instead: the two objects are about 25px apart at (10,-184) and (11,-209); I closed it).
6. Perfect Stealth: NOT RUN (game A already had 2 detections).
7. Two completed games with different Victoria fates: NOT RUN.
8. KO Victoria before the clone: NOT RUN.

## Other observations

- The in-game CyberChef (laptop in the server room, then the inventory item "CyberChef Workstation") works as
  intended: the USB text decodes with From Base64 then ROT13. I set the recipe by loading the iframe URL hash from
  page `eval`, rather than dragging operations. The inventory item opens it from anywhere. Not tested: the
  whiteboard text through the laptop (read by eye instead).
- A page console message "Failed to load resource: 500 (Internal Server Error)" appeared in the log around the
  second catch (not diagnosed).
- Danny Foster (night): talking gives the evidence, SAFETYNET reveal, and "Come in on your own..." choice worked;
  no repeated lines. His workstation files (Folder: GHOST, Personal notes) are readable via the inventory.
- On every room entry the harness needed `room` first and the server-room back door is not in the known doorways
  after unlocking (walk down from the doorway instead).
- Harness: flipper menu items ("Saved", "Staff Access Badge", "Emulate") are not in `controls`, so `clickText`
  and `clickControl` fail ("no-control-matching:Saved"); I clicked `.flipper-menu-item` by eval.
- Same classifier block as the previous run. Both runs died around decoding encoded text. Suggest running
  the rest outside auto mode.

## Was it fun / where did I get stuck

The afternoon (badge clone, Victoria's scene, the failed-read recovery) reads well and the recovery option is
clear. The password puzzle is satisfying and easy: plaque + helpdesk slip gives it quickly. The guard door is
still the sharp edge: the lockpick never even opens before the catch, so there is no way to start a pick in the
guard's range, and the warning conversation is a good softener. I got stuck only at the tooling block, before the
safe and the night confrontation.
