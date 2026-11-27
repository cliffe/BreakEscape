# m09 Digital Archaeology: Act 2 playtest R1-B

Regression-style mechanical run, game 2962 on :3001 (keyless), headless, fast speed. Head start: `--start-room front_desk --set briefing_played=true --submit-flag drop_terminal:catalogue_server-flag1`. Source of steps: the brief (no walkthrough read). Session log: `tools/playtest/m09_r1b-session.jsonl` (1293 commands). Screenshots: `scenarios/m09_digital_archaeology/playtest_r1_b/`. `verify-run.rb 2962`: "progress recorded, 6 rooms beyond the first, 1 object unlocked, 1 flag submitted"; 8 of 10 tasks complete (open: match_the_hand, stop_the_shredding).

Setup notes (not game findings):
- The m09 Mission row was missing from the DB; `new-game.rb` aborted. I ran `db/seeds.rb` (non-interactive, no prune). It updated 73 missions and created m09 (id 84). It also printed `ERROR: test_table_items - Difficulty level is not included in the list` (unrelated).
- System Node is 18; Playwright needs 20+. I used the playwright-go bundled Node 24 through a PATH shim in the scratchpad. No repo change.
- Two page reloads, not one: the second was needed to escape B1.
- Head-start artefacts, not bugs: `set_up_drop_terminal` stayed open until I opened the field laptop; a reload respawns at front_desk; the Mission Brief reopens after every reload.

## Counts

Blocker 1, major 2, minor 6, plus 5 notes.

## Findings

### B1 BLOCKER: the restricted cage is a one-way room (player cannot walk back out)
- Steps: clone Sorensen's card (Darkside), emulate it at the cage door, `enter restricted_cage`, then walk anywhere (plan cabinet, ledger, Sorensen). Try to return west.
- Result: `enter restricted_stacks` fails with `did-not-cross`, three attempts. Feet stop at (370,-388) and the doorway gap needs feet y -439..-425. Arrow keys: up stops at sprite y -426, left stops at x 361, down at -404. Holding up+left gives velocity but no movement. Pointer moves to (340,-432) stop at (361,-426), 43-50 px short. Reproduced twice (before and after the cabinet).
- The entry spawn at (337,-463) is outside the walkable strip, so the way in works and the way out does not. The doorway sits north of the room's walkable floor, behind the black cabinet at the NW corner. `enter` from that spawn spot works (I left once straight away), so the trap is "moved even one step".
- Recovery that worked: reload (respawn at front_desk) and walk back. Cage exit is needed for the tape room, Sorensen's office and the catalogue-server ledger, so this strands anyone who steps in.
- Screenshots: `playtest_r1_b/11_cage_exit_blocked.png`, `12_cage_stuck_at_361.png`.

### M1 MAJOR: hatch bin choice contradicts itself and can be redone
- Steps: at the hatch, pick "Pull Derek's file through", then pick "Pull the letters through".
- Result: first pick says she "tips the other bin into the feed". The menu then still offers both bins. Picking the letters says "She passes them through the hatch and tips Derek Lawson's file into the feed", though Derek's file is already in the player's hands. Final `cage_bin` = letters, `bin_chosen` stays true. Both files ended up in the inventory (verify-run lists Derek's file and the Handoff 14 letters).
- The choice is meant to be a sacrifice; it can be undone by asking again, and the destroyed bin text is untrue. Screenshot: `07_hatch_bin_after_choice.png`.

### M2 MAJOR: RFID clone prompts fire from unrelated-looking dialogue options with no lead-in
- Noor: picking "Which boxes are next on that list?" opens the flipper read at once, with no line from Noor first. Sorensen at the hatch: "What's in tonight's run?" does the same (a MIFARE read that needs Darkside). Nothing in the choice text says "clone her card", and the player never sees a reply to their question. A player not hunting for the card would not know why the flipper appeared, or that it was the clone. Screenshots: `02_noor_rfid_read.png`, `06_sorensen_clone.png`.
- Clone requires clicking through flipper menus (Saved > card > Emulate) that the `mg` control list does not expose (DOM click needed). Known harness gotcha.

### Minor
- m1. Sorensen (cage), after "I'm done here": "The gate sticks." Unclear to a player, who has just walked through an open gate. It ends the conversation and sets `sorensen_fate`; I did not confirm that is intended.
- m2. Sorensen (cage): "Torres cost us one hospital bill..." with all carryover flags false (default imports, no m05 history). Check it is guarded by the right variable.
- m3. Rubber stamp: dusting minigame says "Surface: Glazed white ceramic" for a rubber stamp.
- m4. Field Laptop opens the generic vm-launcher text ("You've discovered a computer terminal in the game...", kali, 172.16.0.3) with no mission framing.
- m5. Old Coyote walks his patrol, so `moveToNear` needs a retry (first call ended 134 px away). Not a blocker. Choice numbers shift after a branch is used (I hit "You don't want to be a witness tonight. Go and sit in your truck." by mistake; he agrees at once and leaves).
- m6. Noor's "How long have you worked for Sorensen?" branch inserts an Agent HaX line mid-chat that spells out the right move ("Tell her and she's a witness..."), so the warn-or-not choice is given away by HaX.

### Notes (no defect, for the record)
- n1. Plan cabinet interact via harness says `mismatch:true wrong-target-opened`; the "Fingerprint Reader" is the cabinet's own lock UI. False positive.
- n2. First plan cabinet click without a print shows the toast "A steel plan cabinet with a fingerprint reader she fitted herself. Not on any schedule." The harness calls that `no-effect-confirmed`. Fine for a player, though there is no pointer to the stamp on Sorensen's counter.
- n3. Dusting minigame: I used `debug.printCentre` and `debug.pattern` from the bridge, so the identification step is "exercised, not earned". Coverage plateaued at 28% until strokes were widened.
- n4. Console: only TTS 503s (expected on :3001). No other page errors.
- n5. After a reload: Noor stays gone, staff door and cage door stay unlocked, cloned cards persist, Sorensen still at the hatch, hatch bins persisted. Reload put the player back at front_desk. Needed `Resume` click and Enter on title.

## Route results

| Step | Result |
|---|---|
| Noor: talk, choice 1 (cover story), options 1-2, warn branch ("That bonus wasn't for filing...") | Works; `noor_told` set, Noor leaves |
| Clone Noor's card (EM4100), emulate at staff door | Works (Save > Saved > Emulate); door opens, `enter staff_passage` then `reading_room` fine |
| Field laptop | Opens VM launcher; task ticks |
| Open stacks, Old Coyote | Reachable (retry); talked; he leaves for his truck |
| Restricted stacks via reading room | Works |
| Sorensen at hatch: can she be reached? | Yes, `moveToNear` + `interact` work at (264,-336) |
| Clone Sorensen card (MIFARE custom keys) | Works: Crack keys, Darkside about 30 s, Save |
| Cage gate with cloned card | Works after reload |
| Plan cabinet: print from stamp, dust, lift, compare, present at reader | Works; Candidate Assessment taken and read |
| Bins choice | Works but see M1 |
| Reload mid-run | State persisted, see n5 |

Earned-secrets: Noor's card (EM4100) cloned at front desk, yes. Sorensen's card cloned at hatch, yes. Sorensen's print lifted from the stamp, yes except the pattern and candidate picks used bridge debug values. Catalogue flag 1 was head-start seeded, so everything past the catalogue server is not tested here. The tape room, Sorensen's office, the cage conversation's `Put the stamp down` branch and the ledger flag were not run.

## Top five
1. B1 cage is one-way: nobody can leave once they step in (reload is the only exit).
2. M1 bin choice is redoable and the "tips the other bin" line is untrue.
3. M2 clone prompts hide behind innocuous dialogue choices with no preceding reply.
4. m6 HaX gives away the Noor choice.
5. m1 "The gate sticks." leaves the player unsure whether the cage conversation ended or failed.
