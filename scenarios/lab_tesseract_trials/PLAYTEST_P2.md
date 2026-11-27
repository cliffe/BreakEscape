# Keyholder Trials playtest, segment 2 (library to drop box): INCOMPLETE

Run type: regression, plumbing question. **Stopped early.** The run reached the library and read the L6 clue. Steps L6 to L8b and Sidhu were not played. Reason: the tool-use safety check refused the command that wrote the CyberChef helper (`cc.py`) and ran it. It said it could not evaluate the action and that retrying would hit the same refusal. I did not work around it. Someone needs to run this segment outside auto mode, or in a fresh session.

- Game id: 1579 (mission 79), keyless server :3001, headless (machine load average 10 to 19 from other playtests).
- Session logs: `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/6fd2619b-d6ba-4c71-be4b-f1c8e1689252/scratchpad/playtest-p2/session-1579.jsonl` (first session, Tom conversation) and `session-1579b.jsonl` (after reload, 49 commands).
- Screenshots (same folder): `01-returns-slip.png`, `02-laptop-open.png`.
- Sessions stopped with `session-stop.sh`; no browsers of mine left running.

## verify-run.rb (run after the session stopped)

```
game            1579  (mission 79)
played for      461s of wall clock
current room    "foyer"
unlocked rooms  4: foyer, teaching_lab, corridor, library
unlocked objs   3: cryptosecure_lockbox, keyholder_guest_terminal, candidate_locker_4
inventory       8: Your Phone, Notepad, Comms Discipline, Lab Laptop (CyberChef), Field Note 1..3, Returns Slip
NPCs met        6: briefing_cutscene, agent_0x99, ghost, closing_debrief_person, jordan_pike, tom_shaw
flags submitted 0
VERDICT: progress recorded, 3 rooms beyond the first, 3 objects unlocked
```

The rooms and objects listed are mostly from my setup (below), not from play.

## Setup: exercised, not earned

Done with `Game#unlock_room!`, `unlock_object!` and `complete_task!` through a rails runner (the test bridge has no give/unlock command), then a session restart to reload state:

- corridor and library unlocked (L4, L5 not earned)
- cryptosecure_lockbox, keyholder_guest_terminal, candidate_locker_4 marked unlocked
- tasks visit_stand, open_lockbox, open_locker, open_guest_terminal, open_corridor, open_library completed

Earned in play: the lab laptop and Field Notes 1 to 3, from a real `converse` with Tom Shaw (about 03:35). `fn04_offered` and `fn05_offered` were set by entering the corridor and the library.

## Earned-secrets table

| Secret | Value used | In-game source | Obtained at | Earned? |
|---|---|---|---|---|
| L6 clue (Base64 text) | `WXZraW9nciBJdXJya2l6b3V0eSB5Z2xrIHZneXljdXhqOiBya2RvaXV0` | `returns_slip`, library, opened as a note | 03:37 (log 49 commands in) | read, not yet decoded |
| L6 shift | 6 | slip observation: "Shift: the number of this Trial", Trial VI | 03:37 | read, not yet used |
| L6 password, Vigenère key, pigeonhole password, hole number, IV, private key, envelope, AES key, drop box passphrase | not reached | | | **no** |

Everything from the L6 decode onward is unproven by this run.

## Step results

| Step | Result |
|---|---|
| Setup to library | done (exercised, not earned) |
| Tom Shaw conversation, laptop pickup | pass |
| Library: take Returns Slip, read it | pass |
| Open laptop from inventory | pass: CyberChef v10.19.4 loads, recipe and input empty |
| L6 decode and safe | not run |
| Trial VII, whiteboard key | not run |
| L7 pigeonholes, reload check | not run |
| L8a RSA, L8b AES | not run |
| Sidhu conversation | not run |
| Laptop keeps recipe on close and reopen | not run |

## Timings (wall clock, headless, loaded machine)

- 03:34:49 session ready; bootstrap about 40 s
- 03:35 Tom conversation done (first approach needed a manual `moveTo`)
- 03:36 setup, restart, bootstrap
- 03:36:26 to 03:37:39 corridor, library, slip, laptop open: about 70 s

## Findings

| # | Severity | Finding |
|---|---|---|
| P1 | minor | The Returns Slip note shows the Base64 in the pixel font. In `01-returns-slip.png` capital I and lower-case l, and 0 and O, are hard to tell apart. A player who retypes by eye will fail. The text is selectable (`user-select: auto` on `.notes-minigame-text`), so copy and paste works, but nothing tells a beginner to copy rather than type. Worth a line in Field Note 4 or 5. |
| P2 | minor | The slip is a notes viewer with no Copy button, unlike the text-file viewer the walkthrough mentions for Trial VII. A beginner has to know to drag-select inside a pixel-art notebook page. |
| P3 | minor | `brief().nearby` in the library lists corridor objects (trial_v_poster, pigeonholes, drop box) as "nearby" with distances of 100 to 180 px. They are not in the room. Harness or scan quirk, not a player-facing issue. |
| P4 | minor (harness) | `moveToNear` stopped 34 px short of `returns_slip` and of `tom_shaw`; a manual `moveTo` then `interact` worked. `interactInventory("workstation")` reported `no-effect-confirmed` although the laptop opened. |
| P5 | minor (harness) | Session start timed out once at 60 s with `window.__test never appeared` while the machine load was about 10; headless restart worked. |

Counts: 0 blockers, 0 majors, 5 minors. This is not a pass or a fail for L6 to L8b; those steps were not run.

## What to run next

Resume game 1579 (or a fresh game) with the same setup. The CyberChef iframe is same-origin, so the in-game recipe can be driven with `eval` against `#cyberchef-frame` (`contentDocument`): paste via `execCommand('insertText')` into `#input-text .cm-content`, add operations with the search box and a double-click, read `#output-text .cm-content`. L6 input is above; expected route is From Base64, then ROT13 amount -6, last word is the safe password.
