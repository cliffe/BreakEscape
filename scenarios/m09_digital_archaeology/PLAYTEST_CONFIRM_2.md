# m09 Digital Archaeology: confirmation playtest 2 (after the fix round)

Mechanical run on :3001 (keyless), headless, fast speed, session `m09c2`. Game 2973 for items 1-4 and 6 (head start: `--start-room restricted_stacks --set briefing_played=true`, flags 1-2 submitted via `--submit-flag`). Game 3001 for the Reel Deck's `deck_pulled = none` case (start in tape_room, `deck_choice_made=true`). Flags 3-4 were typed into the real Tomb Beta Drop Link. Codes used as given in the scenario file (office door was already open after the Recruiter call; safe 060216; salvage LEWISANDCLARK), so those steps are "exercised, not earned". Session logs and screenshots: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/m09c2/` (`session.jsonl`, `session2.jsonl`, `shots/`).

## Result

| # | Item | Result |
|---|------|--------|
| 1 | Restricted cage: walk in, move around, walk out west, several times | PASS |
| 2 | Sorensen at the hatch: clone after her reply with a narrator line; bin buttons gone after a pick | PASS |
| 3 | Sorensen's exit line | PASS |
| 4 | Printed folder and mirror printout before/after flags; rent ledger; property label; annotation sheets; after a reload | PASS |
| 5 | Reel Deck on first use | PASS |
| 6 | Debrief to the end: last line before the closing card, credits roll once | PASS |

## Detail

1. Seven round trips through the cage door with `enter`, each with `moveTo` calls to three spots inside (including the NW corner at y 60, where B1 used to trap). Every `enter restricted_stacks` returned `crossed: true` on the first attempt. Four of the trips were after a page reload. Cage door left via `enter`; no stuck feet.
2. "Lean on the counter..." gives Sorensen's two lines ("Series R, to the last box." / "Take the print if you like..."), then the Narrator line ("You lean on the counter. The card reel at her hip swings a hand's width from the cloner in your jacket."), then the RFID flipper opens. Darkside, Save, and the chat resumes at "Take your time. The shredder won't." After picking "Pull Derek's file through" the menu was down to three options (clone, WREN, leave); both bin buttons were gone. Her line: "Of course. He'd want to be read." plus "She passes the file through the hatch and tips the other bin into the feed without looking at it."
3. In the cage, "I'm done here." gives "Pull the gate to on your way out." (the hatch exit, "I'll leave you to it.", gives "Watch the step on your way."). Reads as British "pull the gate to" (shut), but see m1.
4. Before the flags: folder "Printer tray, empty." / "PRINTER READY. TRAY EMPTY."; mirror printout the same. After flag 3 the folder reads "Three documents printed off the box, stapled together." with the catalogue entry and memo; after flag 4 the mirror printout reads "Two pages in the printer tray. The first is signed." with the projected deaths page. Both objects stay in place and re-open. Rent ledger shows header "Lease start: 06/02/16" and the two rows. Property label shows ASSET 0412 text, before and after the flags. Annotation sheets: "Blank label stock." before the identity scene, then the ALPHA text with the enciphered line after it. After a full reload (Resume, Enter on title, close brief) all of rent ledger, property label, annotation sheets, folder, mirror printout and the print-copy ledger (pencil notes variant) showed the same text.
5. Game 2973 (`deck_pulled = alpha_tapes`): first interact set `alpha_deck_used`, person-chat opened under a second later with the Narrator/HaX lines. Game 3001 (`deck_pulled = none`, the R1-C case): first interact opened "Empty spools. Degaussed." Replays work too. Note a `brief` taken in the same instant as the interact shows no minigame; it appears about 0.5 s later.
6. "Bring me in." set `start_debrief`; the debrief opened on entering the loading dock (see head-start note). Ran through Kowalczyk, the memo question, Send it, the four questions, the Montana card, HaX's last two lines and Netherton's closer. The last visible line "He caps the pen." was on screen with the credits overlay not yet present (`#bv-credits-overlay` absent). One Continue later the overlay appeared. A MutationObserver on `#bv-cr-label` recorded one overlay start (`__crstarts = 1`) and one pass through the closing card and credits ("MISSION COMPLETE", the cast lines, "WHAT THE PURGE TOOK", "ELSEWHERE"), no repeat at 90 s.

## Findings

No blockers or majors.

- m1 (minor): the exit line "Pull the gate to on your way out." could read as a typo to a player who doesn't use "pull to" for "shut". Consider "Pull the gate shut on your way out." Not blocking.
- m2 (minor, not re-tested): after the clone has been made, "Lean on the counter, close to her card reel..." is still offered at the hatch. Choosing it again may reopen the flipper. I did not pick it a second time.
- Head-start artefacts, not game bugs: the debrief NPC (`closing_debrief`) lives in the loading dock, so in a game that starts elsewhere it only opens once the dock is entered (the room-entry backstop then reopens it); the Mission Brief and title screen come back after a reload; the Recruiter's and HaX's forced phone calls open after leaving the cage and block `enter` and `moveTo` (`minigame-active`) until finished.
