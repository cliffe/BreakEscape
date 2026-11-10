# test_access_habits: scripted run report (2026-11-10)

Slice 9.1 step 7 (`docs/achitechture/ACCESS_MODEL_SLICE_9_1_PLAN.md`, section 11), run by the
builder with a Playwright script through the `window.__test` bridge on the keyless server on
:3001, responses captured with the playtest harness's `response-capture.js`. After every beat the
script ran `verify-run.rb <game> --access` and `access-leak-check.rb <game> <responses>`.
Beat H9 waits for step 5.

| Run | Game | Beats | Checks |
|---|---|---|---|
| 1 | 100 | H1 to H5, reload after H3 | 43 of 44 passed |
| 2 | 97 | H6 to H8, reload inside H8 | 13 of 18 passed |
| 2b | 101 | H7 alone | 6 of 6 passed |

The leak check said `VERDICT: no leaks found` after every beat of every run, including after the
reload in run 1 (Omar's saved note in `savedNotes`) and with Omar's password served as the note.

## What the failures were

All six were in the script, none in the game:

- Run 1, H4: the script expected Priya's `screenHabit` to be filled with lockChance 0, as the
  plan's H4 row says. The game left it unfilled, which is the rule in plan 5.2: when every PC the
  NPC owns sets its own lock field, nothing is filled. The validator's report says the same
  ("priya_pc: the PC sets lockChance, habit not applied there"). The plan's H4 row and 5.2
  disagree; `PLAYTEST.md` now follows 5.2.
- Run 2, H7 (four checks): the locker note had `addToNotes: true`, so a click opened the notes
  view instead of the display the script read. The note now has `addToNotes: false` like every
  other note, and run 2b passed H7 in full (locker opened, the same password signed in at
  `tom_pc`, `tom_locker` in `unlockedObjects`, `sessions.tom_pc = tom (password)`).
- Run 2, H8: the script numbered the leaves it saw. Lena's clock had started when the script
  walked through her room on the way to Tom, so the first leave it saw was her second. By
  `away.leaves` it saw open (2), locked (3), locked (4), exactly the computed sequence (open,
  open, locked, locked). After the reload her first leave was open with `leaves` 1: the sequence
  starts again. `PLAYTEST.md` now says to read the leave number from `away.leaves`.

## Beat by beat

- **H1** Dana (level from role `front_desk`): no note picture; she left with the screen open
  (`screenLocked` false, `lockedLook` false, no transition, no cue); a click opened her desktop
  by a claim. Server: `dana_pc = dana (claim)`; habits block `screenHabit {"lockChance":0}`,
  `dana_pc ... no lock field alwaysLocks false`.
- **H2** Ian (`high`): padlock (`texture pc_desktop_locked`), transition `locked: true, sound:
  null`, cue `how: leave, locked: true, glyph: true, chime volume 0.065`; sign-in screen with no
  note; task done. Server: no session, `alwaysLocks true`.
- **H3** Omar (`high`, `writesDown`): note picture on his monitor from the start; "Omar Haddad is
  using this PC" while seated; padlock on his leave; the sign-in screen showed the note and
  `pc_signin_shown` carried `hasPostit: true`; Add to Notepad, then a second click and a sign-in
  with the note's username and password. Server: `omar_pc = omar (password)`, habits block
  `hasPostit true`.
- **Reload after H3**: Omar back at his desk; Dana's claim gone, Omar's password session kept;
  the saved note in the notebook; on his next leave his desktop opened with no password and
  Switch user showed the note again.
- **H4** Priya: locked, sign-in screen, no note; `priya_pc lockChance 1 alwaysLocks true`.
- **H5** Kai: locked in the leave roll by `instant_lock`; sign-in screen; no session;
  `kai_pc no lock field alwaysLocks false` (the policy refuses the claim).
- **H6** Mei: the password built from the photo caption, the calendar year and the IT notice's
  symbol signed in at the first try; `loginFailures 0`.
- **H7** Tom (run 2b): as above.
- **H8** Lena: a claim on an open leave (task done), gone when she returned; locked leaves after;
  the sequence restarted after the reload.

## Not covered here

- Screenshots were taken by the script and looked at by the builder; they are kept out of the
  repo.
- A persona-tier run and the first slice's scripted suite (`test_access_signin`,
  `test_access_sessions`) were not rerun by the builder (rerun after review round 1, below).

## Rerun after code review round 1 (2026-11-10)

Review finding m8. Run on a keyless server on :3009 with the session harness
(`tools/playtest/session-start.sh`, headless Chromium), after the round 1 fixes (the scenario's
never-typed passwords changed, nothing a run types). `verify-run.rb --access` and
`access-leak-check.rb` after every beat; the leak check said `VERDICT: no leaks found` every time.

| Run | Game | Beats | Result |
|---|---|---|---|
| `test_access_habits` run 2 | 114 | H6, H7, H8 with the reload | all pass |
| `test_access_signin` Run A | 116 | S1 to S4, reload | all pass |
| `test_access_signin` Run B | 117 | set-up, S5 to S8 | all pass |
| `test_access_sessions` Run 1 | 118 | T1 to T5, T11 | all pass |
| `test_access_sessions` Run 2 | 121 | T6, H3 Ian, T7, reload, T8 to T10 | all pass, see the note on sounds |

- **H6**: the password worked out from the photo, the calendar and the IT notice signed in at
  `mei_pc` through Other user at the first try; `mei_pc = mei (password)`, `loginFailures 0`.
- **H7**: the locker opened with the note's code and the same code signed in at `tom_pc`;
  `tom_locker` in `unlockedObjects`, `tom_pc = tom (password)`.
- **H8**: by `away.leaves`, open (1, a claim, task done, gone when she returned), open (2),
  locked (3), locked (4), with a lock cue and a `screen_lock` chime on 3 and 4 only. After the
  reload her first leave was open again with `leaves` 1 and gave a claim.
- **Signin and sessions**: every message, tile list, transfer choice, lockout sequence, session
  line and task the two PLAYTEST files expect, including the restored desktop after each reload
  and the claim ended on load. T4's H3 line marked UNCONFIRMED is now seen: after the password
  sign-in `ian_pc`'s `lockedLook` is false and its newest transition is `locked: false`.

**Note on sounds (not a fault).** `test_access_sessions/PLAYTEST.md` still expects
`sound: "lockpick_set"` / `"ui_confirm"` in `screenTransitions()` for a lock heard in the room.
Since office life's lock cues were installed, `screen-states.js` leaves the sound to them, so
every transition now has `sound: null`; the cue log has the `screen_lock` / `screen_unlock`
chime on a leave and a return, and no chime on T6's auto-lock (by design in
`npc-office-visuals.js`). The sessions PLAYTEST's H3 lines need the same wording as this
scenario's PLAYTEST.

Harness notes: a reload must call `bootstrap` with `"resume": "resume"` when the run started
with `"resume": "new"`, or the resume overlay's New Session makes a new game (it did once in
the habits run; the run went back to game 114). Two `404 (Not Found)` console lines follow each
reload in `test_access_sessions` (a static file; not looked into).
