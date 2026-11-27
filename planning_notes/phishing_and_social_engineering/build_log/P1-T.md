# P1-T: Phase 1a slice playtest

Date 2026-10-21. Sonnet, headless, keyless server on :3001. Scenario `test_social_slice`. Source for the steps: IMPLEMENTATION_PLAN.md §4 row P1-T and the "Done when (1a)" playtest steps 1 to 6 (no TESTING_WALKTHROUGH.md exists for the slice).

## Which questions this run answers

1. Plumbing: yes. The slice's route works end to end, and the bridge script passes.
2. Unexpected behaviour: partly (a failing send first, then a reload mid-wait, then the landing send). No off-path softlock hunt.
3. Solvability without doing the work: not applicable. No VM, no flags.

## Evidence

| Run | Game | Session log | Result |
|---|---|---|---|
| Player-style playtest (steps 1 to 6) | 2886 | `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P1-T/play.log` (196 lines) | all six steps pass |
| `bridge-1a.jsonl` + `check-bridge.mjs` | 2887 | `.../se-P1-T/bridge.log` | 37 of 37 pass, RESULT: PASS (two expected reload `waitFor` warnings) |

Both games were fresh `new-game.rb test_social_slice` games (`PREFLIGHT OK`, no VM flags). Run setup as in P1-T0: Node 24 from the Playwright Go cache first on PATH, `PLAYWRIGHT_BROWSERS_PATH` pointed at the P1-T0 wrapper folder. Nothing outside the scratch folder changed. The browser's root PID was 1099587 (harness 1099559); `session-stop.sh` ended both and `ps` showed no `headless_shell` left afterwards (so no PID kill was needed). The bridge run was the same: no `headless_shell` remained.

### verify-run.rb --tasks (game 2886)

```
game            2886  (mission 83)
current room    "slice_room"
unlocked rooms  1: slice_room
inventory       1: Notepad
NPCs met        1: slice_host
flags submitted 0:
globals set     7: engine_tutorial_declined, osint_done, phish_hampshire_landed, se_intel_careers_attachment, se_intel_hampshire_careers, se_intel_hampshire_cv_backlog, target_ready_hampshire
tasks           2 in objectivesState, 2 completed
  ready_hampshire                    "completed"  at 2026-10-21T14:01:59Z
  hampshire_landed                   "completed"  at 2026-10-21T14:04:01Z
tasks_completed 2
score           100
social scenario true (completed tasks count toward the verdict)
VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 2 tasks completed.   (exit 0)
```

Game 2887 (bridge run) gave the same: both tasks completed (14:05:19Z and 14:06:14Z), `tasks_completed 2`, exit 0. Full output in `se-P1-T/verify-2886.txt` and `verify-2887.txt`.

### count-task-posts.sh

```
game 2886 task hampshire_landed: 1 completed POST(s) with 200 (0 refused)
game 2886 task ready_hampshire: 1 completed POST(s) with 200 (0 refused)
game 2887 task hampshire_landed: 1 completed POST(s) with 200 (0 refused)
game 2887 task ready_hampshire: 1 completed POST(s) with 200 (0 refused)
```

Server start Mon Oct 19 10:23:48 (pid 3337332), so the counts cover both runs.

Server row for 2886 after the run (read with a runner script): `phish_hampshire_attempts` 2, `phish_hampshire_landed` true, `se_board_state` `{v:1, recon:{seenReady:[hampshire]}}`, `mailState.jobs` empty, `metrics.hampshire` `{sent:2, failed:1, landed:1, firstTryLanded:false}`, both sends in Sent, both replies in the inbox.

## Earned-secrets table

Nothing in this slice is a PIN, key or flag. The "secrets" are the three intel facts and the CV kit item. All were obtained by walking to and interacting with the in-game objects. Nothing was typed from a guide or set from the console. I did read the scenario file first (so I knew which note gives which fact); that is a regression run, not a blind one.

| Secret | Value used | In-game source | Obtained at (play.log line) | Earned? |
|---|---|---|---|---|
| Fact `hampshire_careers` | "The careers inbox accepts CVs from anyone." | Careers Page Printout (`careers_inbox`), toast "Noted: ..." | 33 (before the To list was checked a second time, lines 40 to 49) | yes |
| Fact `hampshire_cv_backlog` | "Chris is behind on CVs before Friday." | Chris's Social Post (`post_hampshire_cvs`) | 73 | yes |
| Fact `careers_attachment` | "Chris takes .odt and .docx files." | How To Apply Page (`apply_format`) | 81 | yes |
| Contact Hampshire in To list | (revealed) | `revealedBy` `se_intel_hampshire_careers`, i.e. the first note | appears at line 48 | yes |
| `kit_cv` attachment | CV.docx | Offered by the composer's Attach list from the start (`payloadKit`); no in-game source needed | line 160 | n/a, not gated |

No rows marked "no". One caveat: the player is never told in game that the CV is the right file; the `careers_attachment` fact says ".odt and .docx" and the kit item is "CV.docx (document)". A player has to connect those. That is fair, not a defect.

## Step results (Done when 1a, playtest steps 1 to 6)

| # | Step | Result | Evidence |
|---|---|---|---|
| 1 | Before any fact the To list does not offer Hampshire; after the careers stand-in only she appears | PASS | Before: composer state `contactId null`, To select holds only "No contacts yet — find someone first.", Send disabled, gate line "Pick someone to write to." (lines 18 to 25, screenshot `02`). After reading only the careers printout: Contacts lists Chris Hampshire (Careers) and To offers "Chris Hampshire (Careers)" (lines 40 to 55, screenshots `04`, `05`). The board at that point shows 1 of 3 slots done, "Not ready" (`06`). |
| 2 | After the other two stand-ins the board shows Hampshire ready and `target_ready_hampshire` is true | PASS | Lines 72 to 85: the global and the task `ready_hampshire` both completed. Board: "Recon complete. 1 of 1 targets ready to approach", "Ready to approach", all three slots ticked (lines 90 to 97, screenshot `09`). |
| 3 | A `pretext_enquiry` send shows the full checklist at once, `pretextRelevant` failing on her authored line | PASS | Lines 104 to 115, screenshot `11`: "It did not land." then four lines at once: "They would open it", "An open inbox accepts any sender", "✗ This isn't about the role. I only handle applications." (her authored `pretextRelevant.fail`), "✗ You mention a CV, but there's nothing attached." Attempts 1, one job, one Sent record. |
| 4 | A reload during the 15-second wait still delivers the reply into the `guest` mailbox | PASS | Send 15:02:30. Reload started about 14 s later (lines 120 to 125; the Resume overlay avoided with `?skip_resume=1`, bootstrap `resume:"resume"`). After the reload: jobs empty, inbox holds "Re: Application" with her authored line, one Sent entry, attempts 1 (line 126 eval). The reply's id timestamp is about 30 s after the send, which means it was created after the reload, not before. Mailbox `guest`, one reply only. The bridge's F3/F4 rows also pass (the reply lands once). |
| 5 | A `pretext_apply` send with `kit_cv` lands | PASS | Lines 152 to 161, screenshot `17`: "It landed. They acted on it." and four ticks, job `Thanks, I'll get to this CV before Friday.` with `outcomeGlobal phish_hampshire_landed`. About 15 s later (7.8 s waited, line 173) the global and task `hampshire_landed` fire, with the toasts "New mail from Chris Hampshire: Re: Application", "Task Complete", "Objective Complete!" (`18`). |
| 6 | `verify-run.rb --tasks` lists both tasks completed with `tasks_completed` 2; `count-task-posts.sh` one POST per task | PASS | Output above, both games. |
| Bridge | `bridge-1a.jsonl` and `check-bridge.mjs` all true | PASS | 37 of 37. D3 (draft comes back after a reload), which failed in P1-T0, now passes. |

## As a player

Is it clear what to do next?

- Start: yes. The Objectives panel names "Learn enough about Careers to approach" and "Land a message on the Careers inbox". The three paper notes are small (about 16 px) and look like litter; I walked to them because I knew where they were. A fresh player has no pointer to them. The mission brief screen did not show (bootstrap cleared it), so I cannot judge it.
- After the third note: the toast says "Task Complete: Learn enough about Careers to approach". Nothing says what to do next. The only guide is the second objective line, and nothing says the board shows "ready" or that the terminal is where to write. The board is the one place that confirms readiness and no prompt sends the player there.
- At the terminal: Compose is clear once Hampshire is a contact. The To list with "No contacts yet — find someone first." is a good nudge.
- After a failed send: the checklist and her reply say what to change. Clear enough. The first reply ("I only handle applications.") is a fair hint.
- After the landing send: clear, but see finding 3 on timing.

Confusing text (see table below):
- The facts toast reads "Noted" then "Noted: The careers inbox accepts...". Doubled prefix.
- Every checklist line has a doubled tick: "✓ ✓ They would open it". The authored strings carry "✓ " and the UI adds a mark.
- The checklist headline says "It landed. They acted on it." at once, but the task only completes about 15 s later when the reply arrives. If the player closes the mail client right away, nothing says a reply is coming. The "New mail from..." toast does show when the overlay is closed.
- "Edit & resend" appears after a message that landed, where "Done" or "Back" would read better.
- The note objects only say "A printout of the careers page." The fact appears only as a short toast and in the board, so the player never reads the printout itself.

Looks wrong (screenshots in `se-P1-T/shots/`):
- The Compose panel and the Contacts panel are see-through. The inbox rows (Facilities, IT, Select a message...) and the Close button show through the form (`02`, `04`, `05`, `10`). In the Contacts view the heading overlaps the account line and tab buttons ghost through. After a send the result panel has the same ghosting (`11`, `17`). This is the most visible defect.
- The composer covers the top of the mail window: the tab buttons (Inbox, Sent, Contacts, Compose) are cut off at the bottom edge while it is open (`05`).
- Board cards repeat every line: the three slot lines, then "Done: ..." and "Missing: ..." for the same facts (`06`, `09`). The empty slot shows "???" and "Not yet found" and then "Missing: ..." again.
- The pin-board card has a pixel artefact at its bottom-right corner (a torn corner that looks cropped) on both the person card and the Company card (`06`, `09`).
- The Greeting and Ask dropdowns look greyed out because they hold one choice each (`05`).
- Sent list rows have no time. The two "Re: Application" rows in the inbox look identical apart from the time (`19`).
- Composer defaults to `pretext_apply` and the subject "Application", so the correct choice is pre-selected. The enquiry step needs a deliberate change, which is fine for a test fixture but it means a player who just clicks Send lands on the first try.
- The composer opens with the previous send's choices (draft kept after a send; `mailState.drafts.guest` still holds the landed pretext and `kit_cv`). Fine for resend; stated so it is not a surprise.

## Findings

| # | Severity | Finding | Repro |
|---|---|---|---|
| T1 | minor | Compose, Contacts and result panels are semi-transparent; text from the inbox shows through and overlaps | game 2886, shots `02`, `04`, `05`, `10`, `11`, `17` |
| T2 | minor | Composer panel covers the lower edge of the tab buttons | shot `05` |
| T3 | minor | "✓ ✓" doubled tick on every pass line | lines 115, 164 (state text); shots `11`, `17` |
| T4 | minor | Result headline says "It landed" about 15 s before the task completes, with no "waiting for a reply" line | lines 161 to 175 |
| T5 | minor | Fact toast reads "Noted: Noted: ..." | shots `03`, `08` |
| T6 | minor | Board card repeats each slot line as "Done:" and "Missing:" | shots `06`, `09` |
| T7 | minor | Board card corner artefact | shots `06`, `09` |
| T8 | minor | No cue after "ready" to go to the terminal; notes are tiny; notes show a one-line description, not their text | shot `08` |
| T9 | minor | "Edit & resend" shown after a landed send | shot `17` |
| T10 | minor | Sent rows show no time | shot `14` |

0 blockers, 0 majors, 10 minors. I make no classification of these as game bugs; they are what I saw.

## Limits

- Headless run, so no sound and no real Tab-key walk. Synthetic input only, as the harness does.
- Step 4's reload was timed by hand about 14 s after the send, so it sat close to the 15 s line. The reply's id timestamp (about 30 s after the send) shows the reply was created after the reload, but the reload came a second or so before the due time. The bridge script's F3/F4 rows cover the same ground with the same margin.
- The first reply was delivered during the reload, so I did not see its "New mail" toast; I saw the toast on the second reply only.
- Draft restore after a reload was covered only by bridge row D3 (pass), not by my own play.
- Not covered (1b): blank picker, account switcher, narrow layout, influence bar.
- Scratch files are all under `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/2133f16a-52c8-44a8-bdee-8461b326389a/scratchpad/se-P1-T/` (shots, logs, verify and count outputs, `c.sh` helper). No game files were edited and nothing was committed.
