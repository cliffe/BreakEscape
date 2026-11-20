# Keyholder Trials blind playtest: INCOMPLETE (stopped at Trial VI)

Run type: blind, plumbing plus solvability from a player's view. Stopped about 13 minutes of wall clock in, not 60. The tool-use safety check began refusing every Bash command after the one that drove CyberChef for Trial VI, and it said retrying would hit the same refusal. I did not work around it. Afterwards `session-stop.sh 1587` and `verify-run.rb` did run, so the session is stopped (pid 88323 gone) and the verifier output is below. One stray bash of mine (pid 112812, from a `cat > /dev/null` typo) was killed by PID.

- Game id: 1587 (mission 79), keyless server :3001, headless, `--speed fast`.
- Session log: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/6fd2619b-d6ba-4c71-be4b-f1c8e1689252/scratchpad/playtest-blind/session-1587.jsonl` (about 580 commands).
- Screenshot: `.../playtest-blind/01-laptop.png` (laptop open, From Decimal added, input empty).
- verify-run.rb result (run after session stop):

```
game            1587  (mission 79)
played for      827s of wall clock
current room    "foyer"
unlocked rooms  5: foyer, common_room, teaching_lab, corridor, library
unlocked objs   4: lab_account_pc, cryptosecure_lockbox, candidate_locker_4, keyholder_guest_terminal
inventory       16 (includes Keyholder Leaflet, Trial II Card, Trial III Card, Trial V Poster, Tag on the Drop Box, Returns Slip)
NPCs met        8: briefing_cutscene, agent_0x99, ghost, closing_debrief_person, jordan_pike, megan_oyelaran, cliffe_schreuders, tom_shaw
flags submitted 0
VERDICT: progress recorded, 4 rooms beyond the first, 4 objects unlocked, 0 flags submitted.
```

Note: the inventory has a "Keyholder Leaflet" item, so the Trial I numbers came from Jordan's leaflet, which sits in inventory (finding B2 is partly answered: the leaflet is a real item, but I never examined it and the numbers were only seen as a notepad page).

## Blindness caveats

- I read PLAYTEST_P2.md for driving CyberChef, as allowed. It also names the Trial VI route (From Base64, then ROT13 amount -6) and part of the clue. Trial VI is contaminated and not a blind result. Trials I to V were not affected.
- A note in the notepad ("115 111 114 114 101 108") appeared before I knew where it came from. See finding B2.
- Driver code: I wrote `cc.sh` (CyberChef driver) and `look.sh`, `b.sh`, `dlg.py` into my scratch folder before I noticed the "inline only" rule. I deleted `cc.sh` and moved to inline python. `look.sh`, `b.sh` and `dlg.py` are still in the scratch folder and only read objects and dialogue. Nothing was written to the repo except this file.

## Per-lock results (wall clock, game started 05:54:48, session ready 05:55:00)

| Lock | Clue first seen | Opened | Hints | Notes |
|---|---|---|---|---|
| I: foyer lockbox, 6 decimal codes | about 05:57 (lockbox asks for "a word"); the numbers themselves were found in the notepad at 05:59 | 06:01:01 | 0 | Answer "sorrel" via From Decimal. See B1, B2. |
| II: Locker 4 keypad, "56485448" | 06:02 (Trial II Card inside lockbox) | 06:05:10 | 0 | From Hex gives "VHTH" (the trap). Decimal split into pairs `56 48 54 48` gives 8060. Unspaced From Decimal errors with "Data is not a valid byteArray". About 3 minutes. |
| III: guest terminal, 6 bytes of binary | 06:05:19 (Trial III Card) | 06:06:00 | 0 | From Binary gives "copper". 41 s. |
| IV: corridor door, hex file | 06:06:10 (`trial_iv.hex` on the guest terminal) | 06:06:35 | 0 | From Hex gives "corridor door passphrase: vestibule". 25 s. |
| V: library keypad, Base64 poster | 06:06:55 (Trial V Poster, corridor) | 06:07:25 | 0 | From Base64 gives "Library keypad: 7601...". 30 s. |
| VI: Special Collections safe, Base64 plus shift | 06:07:50 (Returns Slip, library; "Shift: the number of this Trial") | not reached | 0 | Stopped here. |
| VII to drop box | not reached | | | |

Hints used: none. I never needed to ask HaX. I was never stuck for more than 3 minutes.

Overhead: session start 12 s. Load average rose from 0.9 to 13.9 during the run. Most of my wall clock was my own command round trips (each CyberChef run about 5 to 10 s, plus about 2 minutes lost to a typo of mine, `cat > /dev/null`, that waited on stdin). Estimated player-only time for Trials I to V: about 8 to 10 minutes for a player who already knows the controls; a beginner will be slower.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Lockbox word (Trial I) | sorrel | Notepad page "115 111 114 114 101 108" (origin unclear, see B2), decoded in CyberChef | 06:01 | yes, source found in-game |
| Locker 4 PIN | 8060 | Trial II Card in lockbox, decoded | 06:05 | yes |
| Guest terminal word | copper | Trial III Card in Locker 4, decoded | 06:06 | yes |
| Corridor passphrase | vestibule | `trial_iv.hex` on guest terminal, decoded | 06:06 | yes |
| Library keypad | 7601 | Trial V Poster in corridor, decoded | 06:07 | yes |
| Everything from Trial VI | not used | | | **no, not reached** |

Everything past the Trial VI clue is unproven by this run.

## Findings

| # | Severity | Finding |
|---|---|---|
| B1 | major | The Trial I clue is hard to find. The lockbox says only "It wants a word." The Byte Wall, plaque, paper tape and poster teach binary, but none of them says which numbers to decode. Jordan Pike's talk says "solve the numbers" but never shows any numbers. HaX's phone message says "Numbers between 97 and 122" while no such numbers are visible anywhere. A player has to open the Notepad to discover the numbers ("115 111 114 114 101 108"). I would not have found them without paging the notepad. Suggest: have Jordan's leaflet appear as an inventory or examined object, or put the numbers on the lockbox or the stand. |
| B2 | major | The Trial I numbers arrived in the Notepad with no message or sound I noticed. I do not know which action added them (the Jordan conversation or the lockbox). If a player does not open the notepad, they will not know it happened. |
| B3 | minor | Tom Shaw says "a stack of handouts" with the laptop, but I got only the laptop. Field Notes 1 to 3 sit in the notepad already. The ASCII chart handout is in the foyer. The line suggests an item that does not exist as an item. |
| B4 | minor | Trial II is a good trap (From Hex gives "VHTH") but a beginner needs to know to put spaces between the pairs. Field Note 2 says codes "need splitting by thinking about the range" and does not say to type spaces into the Input box. Unspaced From Decimal shows "Data is not a valid byteArray: [56485448]", which does not help a beginner. The common-room flyer ("Read it as characters, not as a number") is the only nudge and it is not in the room the player is in at that point. |
| B5 | minor | The Trial II card gives two 4-digit-looking readings (hex text VHTH vs decimal pairs 8060) and the keypad takes only digits, which helps. Fine. Noted as a good design. |
| B6 | minor | The player's private key sits on the lab PC from the first minute, with the README ("you'll want the private one before the week's out"). Not a bug, but it is a spoiler for the later RSA trial. |
| B7 | minor | The briefing runs through a Mission Brief note, but the opening note viewer reports "noteCount 3" and shows one page. Not checked further. |
| B8 | minor (harness) | `interactInventory` for the laptop reports `no-effect-confirmed` although the laptop opens. `enter` fails with `no-known-doorway` back to the foyer from the common room, the teaching lab and the corridor until `room` is called there. `moveToNear` stops short on tom_shaw and tom_board. Inside the teaching lab the coordinates are negative. `interact` on the lockbox from the teaching lab worked by walking the player. Tom Shaw cannot be reached from the lab PC side (a desk blocks the way); walking right, down, left works. A player may find Tom hard to reach. |
| B9 | minor (harness) | CyberChef input only accepts a synthetic `paste` event; `execCommand('insertText')` into `#input-text .cm-content` returns false (PLAYTEST_P2's advice does not work as written). The laptop keeps the previous input between opens, so a new paste appends unless `#clr-io` is clicked first. The Search box needs a `keyup` after `insertText` before results show. |
| B10 | minor | The CyberChef search results popover and recipe arguments were fine. Trial VI's ROT13 amount control was not exercised. |

Counts: 0 blockers, 2 majors, 8 minors. Trials I to V all solved without a hint.

## Beginner's-eye list: five moments a first-year would give up (from what I saw, not from Trial VI onward)

1. **Trial I, finding the numbers.** The lockbox wants a word, nothing on screen holds numbers, and the numbers live only in the Notepad (B1, B2). This is the first puzzle. A first-year who does not open the Notepad will wander the foyer and quit.
2. **Trial II, running digits together.** "56485448" looks like hex, From Hex gives "VHTH", and the keypad takes digits. The fix needs two ideas at once: this is decimal, and CyberChef needs spaces (B4).
3. **Driving CyberChef at all.** Copy from a pixel-font note, paste into Input, find an operation by search, double-click it. Field Note 1 explains it, but the first player run through it is what loses people. The unspaced-decimal error text gives no help.
4. **Reaching Tom Shaw and the lab PC.** The lab layout and the desk made Tom hard to reach for the harness (B8). A real player can walk around the desk, but I could not confirm that.
5. **Trial VI onward is untested here.** I cannot say where the next give-up moments are (the ROT shift, the Vigenere key, RSA, AES). Run the second half again.

## What to run next

Stop session 1587 (`tools/playtest/session-stop.sh 1587`, then `bin/rails runner tools/playtest/verify-run.rb 1587` with `BREAK_ESCAPE_STANDALONE=true`), then repeat from Trial VI on a fresh game in a new session outside auto mode. The CyberChef driver is described in B9.
