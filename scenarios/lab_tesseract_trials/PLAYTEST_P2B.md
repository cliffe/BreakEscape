# Keyholder Trials playtest, segment 2b (library: L6, Trial VII, L7): PASS

Run type: regression, plumbing question, read with a first-year beginner in mind. Script: `TESTING_WALKTHROUGH.md` steps 10 to 14, with the driving notes from `PLAYTEST_P2.md`. Stopped once L7 (pigeonholes) opened, as briefed.

- Game id: **1588** (mission 79), keyless server :3001. Headless, because another playtest (game 1587) was running at the same time. Load average was about 2.
- Scratch folder: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/6fd2619b-d6ba-4c71-be4b-f1c8e1689252/scratchpad/playtest-p2b/`
- Session logs (same folder): `session-1588.jsonl` (31 commands: Tom Shaw) and `session-1588b.jsonl` (289 commands: library onwards). Line numbers below are from `session-1588b.jsonl` unless stated.
- Screenshots (same folder): `00-lab-stuck.png`, `01-returns-slip.png`, `02-l6-cyberchef.png`, `03-trial-vii.png`, `04-trial-vii-notepad.png`, `05-ledger-whiteboard.png`, `06-whiteboard-open.png`, `07-trial-vii-decoded.png`, `08-pigeonholes-lock.png`, `09-pigeonholes-open.png`.
- Sessions stopped with `session-stop.sh` (browser pid 90254 confirmed gone). Nothing committed.

## verify-run.rb (after the last session stopped)

```
game            1588  (mission 79)
created         2026-10-06 04:55:22 UTC
last write      2026-10-06 05:12:00 UTC
played for      998s of wall clock
current room    "foyer"
unlocked rooms  5: foyer, teaching_lab, corridor, library, sidhu_office
unlocked objs   5: cryptosecure_lockbox, keyholder_guest_terminal, candidate_locker_4, special_collections_safe, pigeonholes
inventory       8: Your Phone, Notepad, Comms Discipline, Lab Laptop (CyberChef), Field Note 1: Bits, Bytes, Bases, CyberChef, Field Note 2: Characters Are Numbers, Field Note 3: Hex and Binary, Returns Slip
NPCs met        7: briefing_cutscene, agent_0x99, ghost, closing_debrief_person, jordan_pike, tom_shaw, sidhu_selvarajan
flags submitted 0: 
globals set     14: briefing_played, comms_had, ending, engine_tutorial_declined, fn04_offered, fn05_offered, fn06_offered, fn08_offered, fn09_offered, megan_choice, pigeonholes_open, player_name, report_read_claimed, special_collections_open

VERDICT: progress recorded — 4 rooms beyond the first, 5 objects unlocked, 0 flags submitted.
```

From play: `sidhu_office`, `special_collections_safe`, `pigeonholes`. From setup: corridor, library and the first three objects.

## Setup: exercised, not earned

- **Earned in play:** the lab laptop and Field Notes 1 to 3, from a real `converse` with Tom Shaw (`session-1588.jsonl` lines 12 to 25).
- **Not earned:** a `bin/rails runner` script (`setup.rb` in the scratch folder, copied from P2) unlocked the corridor and library, marked cryptosecure_lockbox, keyholder_guest_terminal and candidate_locker_4 unlocked, and completed tasks visit_stand, open_lockbox, open_locker, open_guest_terminal, open_corridor and open_library. The session was then restarted to load that state. L1 to L5 are not tested by this run.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| Lab laptop | (item) | Tom Shaw, teaching lab, dialogue | `session-1588.jsonl` l.24 | yes |
| Corridor, library access | (rooms) | rails runner setup | before l.1 | **no, exercised, not earned** |
| L6 Base64 text | `WXZraW9nciBJdXJya2l6b3V0eSB5Z2xrIHZneXljdXhqOiBpdWprZA==` | `returns_slip`, library (notes viewer) | l.26 | yes |
| L6 shift | 6 (ROT13 amount 20) | slip observation "Shift: the number of this Trial" + "Trial VI" | l.26 | yes |
| L6 safe password | `codex` | CyberChef: From Base64, ROT13 amount 20 → "Special Collections safe password: codex" | l.46 to 56 | yes |
| Trial VII ciphertext | `Flv ztkqserzpqw … h43n710fw9l622ph70398n4j96v05p69` | `trial_vii_txt` in the safe (text-file viewer) | l.100 | yes |
| Vigenère key | `merkle` | `ledger_whiteboard`, Sidhu's office, Block 4 data | l.222 | yes |
| Pigeonhole password | `postmark-39` | CyberChef: Vigenère Decode, key merkle | l.232 | yes |
| Your pigeonhole | two | same decode | l.232 | yes (not used; segment ends at L7) |
| IV | `d43b710bf9b622ed70398b4f96e05f69` | same decode | l.232 | yes (not used) |

The only "no" row is the setup. Everything from the library on was read in the game, decoded in the in-game CyberChef (driven through its input box, operation search and output box), and typed into the lock.

## Step results

| Step | Result | Log |
|---|---|---|
| Setup: Tom → laptop (earned), runner → library (not earned) | pass | `1588.jsonl` 1 to 31; `1588b` 1 to 17 |
| Enter library: HaX offers FN5 (`fn05_offered`) | pass | 13 to 17 |
| 10a. Take/read `returns_slip` | pass (needed a manual `moveTo`, as in P2) | 18 to 30 |
| 10b. Open laptop from inventory, paste, From Base64 | pass ("Yvkiogr Iurrkizouty yglk vgyycuxj: iujkd") | 42 to 50 |
| 10c. ROT13, Amount 20 | pass ("Special Collections safe password: codex") | 52 to 58 |
| 10d. Safe, wrong case `Codex` | refused, "Incorrect password. 4 attempts remaining." (case-sensitive) | 80 to 82 |
| 10e. Safe, `codex` | pass: `open_special_collections` done, `special_collections_open` true, `fn06_offered` set; container opened by itself | 84 to 92 |
| 11. Safe contents: open `trial_vii.txt`, Copy, Add to Notepad | pass (Copy not checkable headless, see B8) | 100 to 120 |
| Reload after L6 | pass with caveats: safe still unlocked and opens with no password, notepad kept 8 notes, tasks and globals kept. Player back in the foyer, CyberChef recipe and input empty (B6) | 130 to 180 |
| 12. Sidhu's office, `ledger_whiteboard` | pass: Block 4 data = `merkle` | 196 to 226 |
| 13. Vigenère Decode, key merkle | pass: "The pigeonholes open with postmark-39. Yours is number two. Your envelope is sealed to your public key. The IV travels with this letter: d43b…5f69" | 230 to 232 |
| 13x. Decode the notepad copy instead | garbled (B3) | 238 |
| D1: close and reopen laptop | pass: recipe, key and input kept | 242 to 246 |
| 14a. Pigeonholes, `postmark-39.` (full stop copied from the sentence) | refused, 4 attempts left | 266 to 268 |
| 14b. Pigeonholes, `postmark-39` | pass: `open_pigeonholes` done, `pigeonholes_open` true, `fn08_offered` and `fn09_offered` set; container lists Pigeonholes 2 to 5 | 270 to 280 |

## Findings

| # | Severity | Finding | Evidence |
|---|---|---|---|
| B3 | **major** | **"Add to Notepad" on `trial_vii.txt` saves the ciphertext wrapped in a header and footer** ("Text File: trial_vii.txt / Source: Unknown Source / Type: TEXT / Date … / FILE CONTENTS: … / End of File"). Vigenère runs the key across every letter, so pasting that note into CyberChef shifts the key and garbles the whole message: "Uhj vcafosniffs tvyh xiyn jittrgle-39 …". The walkthrough warns "an extra header line garbles the whole decode", but the game's own button produces that header, and the notepad is where Tom and the walkthrough tell players to keep things. A beginner sees mostly-garbage output with no idea why. The observation does say "Keep everything it tells you", which pushes players towards the notepad. Fixes to consider: save only the file body for this item, or a line in the observation or FN6 ("paste only the ciphertext line"). | l.112 to 116, l.238; `04-trial-vii-notepad.png` |
| B4 | minor (may be major for a beginner) | **The ledger whiteboard's line breaks are lost in the examine dialog.** The `observations` text is a four-line table, but the dialog shows it as one paragraph: "…Block 3 \| data: bob->carol \| prev: 9b04 \| hash: e21d Block 4 \| data: merkle \| prev: e21d \| hash: 51a8 Change one letter…". The clue is "the last entry in the ledger", and without the rows it is hard to see where an entry starts and ends. A beginner could take `51a8`, the last value, or "Change". The scroll-text banner under the dialog runs it together too. | `06-whiteboard-open.png`, l.222 |
| B5 | minor | **Open containers still show their locked text.** The open safe reads "Special Collections. It wants a password." above its contents, and the open pigeonholes read "Locked. A sign: Porter's code required…" above Pigeonholes 2 to 5. It makes a player wonder whether the lock worked. | l.94, l.276; `09-pigeonholes-open.png` |
| B6 | minor | **After a page reload the player is back in the foyer and CyberChef is empty.** Progress, unlocked objects and notes are kept, but the player has to walk back from the start and rebuild the recipe. D1 only promises close-and-reopen persistence, which works (l.242 to 246). This is probably engine-wide, but for this mission it means a student who reloads mid-decode loses the work in progress. | l.132 to 180 |
| B7 | minor | **Passwords are exact, and the decoded sentences put punctuation next to them.** `Codex` and `postmark-39.` (the full stop is part of the sentence "…open with postmark-39.") were both refused with only "Incorrect password". Five attempts is generous, but a hint that passwords are case-sensitive and have no punctuation would save beginners a guess. | l.80, l.266 |
| B2 | minor | Returns Slip: as P2 finding P1. The Base64 is shown in the pixel font, where `l` and `I` look alike (`…a2l6b3V0…`, `…HZneXljd…`). It is selectable text, but nothing tells the player to copy rather than retype. | `01-returns-slip.png` |
| B9 | minor | FN5 (on request from HaX) says "-6 undoes a shift of 6". That gives away the Roman-numeral step (Trial VI = 6) if the player asks for the note first. It may be intended scaffolding. In CyberChef, searching "caesar" lists "Caesar Box Cipher" first and ROT13 third, so a player who knows the name Caesar but not ROT13 may pick the wrong operation. FN5 names ROT13, which covers this if it has been read. | search check l.234 |
| B1 | minor (harness/layout) | Teaching lab: after `enter` the player stands behind the desks and Tom stands in front. `moveToNear` and the keyboard `moveTo` stop at the desks; a pointer `moveTo(-120, 215)` pathfinds round. A mouse player would not notice. | `00-lab-stuck.png`, `1588.jsonl` 7 to 11 |
| B8 | minor (harness) | The text viewer's Copy button can't be checked headless (clipboard read permission denied), so I took the ciphertext from the viewer's visible `pre.file-text`. `interactInventory("workstation")` again reported `no-effect-confirmed` although the laptop opened every time. `execCommand('insertText')` into CyberChef returned false in headless mode; a synthetic `paste` ClipboardEvent with a DataTransfer worked. Bootstrapping after a reload looped on "◀ Prev" for 7 minutes (the documented resume-overlay gotcha, my mistake); clicking Resume by exact text fixed it. Leaving the library and Sidhu's office needed `moveTo` to the remembered doorway then `walk`, because unlocked doors are not listed. | l.42, 102 to 106, 140 to 150 |

Counts: **0 blockers, 1 major, 7 minors** (2 of the minors are harness notes).

## Beginner notes (no severity)

- The L6 route itself is clear: slip, "Shift: the number of this Trial", "Trial VI", ROT13 with an amount. The ROT13 amount defaults to 13, so a player has to know to change it; FN5 covers this.
- "The man who checks everything twice" points at Sidhu only if the player has met him or knows his character. In this run the objective list already says "Talk to Dr Selvarajan", which helps.
- The Trial VII plaintext gives three values. Only the password is needed at L7, so a player who doesn't copy the hole number and IV now will have to decode again later. The observation says "Keep everything it tells you", which is the right nudge, but see B3 for what happens when they do.
- CyberChef search does match "vigenere" without the accent.
