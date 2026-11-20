# P3-T review and playtest: Phase 3 inbox triage

Read-only review of the inbox triage overlay, the scorer, the playerSent replay, the defender board and the sync-then-emit path, then a playtest of `scenarios/test_social_slice` on the keyless server at :3001. Judged against Phase 3 "Done when" in `planning_notes/phishing_and_social_engineering/IMPLEMENTATION_PLAN.md` and designs 00, 03 and 05. No game file was edited.

Kind of game: a lab. Education first, browser only, no VMs, no combat.

## Checks run

- `bundle exec node --test` on `test/js/social-triage-scoring.test.mjs`, `social-triage-starter.test.mjs`, `social-player-sent.test.mjs`, `social-triage-ui.test.mjs`, `validator-social-triage.test.mjs`: 84 tests, 0 failures.
- `bin/rails test test/controllers/break_escape/social_sync_then_emit_test.rb`: 5 runs, 41 assertions, 0 failures.
- `ruby scripts/validate_scenario.rb scenarios/test_social_slice/scenario.json.erb --strict-social --no-graph --skip-ink`: exit 0. Warnings are the pre-existing ones (generic-npc `asked_question`; brandt and quinn pretext VARs; unused call globals). No social error.
- Browser runs on :3001, listed under Playtest. `tools/playtest/verify-run.rb --tasks` and `tools/playtest/count-task-posts.sh` were run after the plays. The :3000 server was not touched.

## Findings

| id | sev | file:line | finding | evidence | suggested fix |
|----|-----|-----------|---------|----------|---------------|
| T3-1 | blocker | `scenarios/test_social_slice/scenario.json.erb:427-430`, `scenario.json.erb:245`, `public/break_escape/js/systems/phish-rules.js:409-415`, `public/break_escape/js/minigames/inbox-triage/triage-messages.js:77`, `triage-messages.js:130` | A real landed send to Hampshire is not replayed, so the playerSent card never appears. Phase 3 "Done when" requires the playtest to triage the four-message set and to see the message the tester sent, with its stored tells. The set has four entries (`pay_today`, `own_hampshire`, `parking`, `laptop`). The round that opened had three. Hampshire's only From template is `from_own` (`{account_name} <{account_address}>`, no slots), and `primedFor.trusts` is `["*"]`. The tell list is built only from a claimed sender that is not the account's person, an auth read of `would-fail`, a link domain that differs from `expectedLink.realDomain`, or urgency over the advisory maximum. This send sets none of those: own identity, no link, no urgency maximum, auth stays `would-pass`. The stored record has `tells: []`. `sentCandidates` drops a record with an empty tell list, and `resolvePlayerSent` then reports `no-sent-record` even though a sent record exists. | Game 2940, server `mailState`: sent `msg_mvij1kzn_1`, mailbox `guest`, target `hampshire`, from Operator `<guest@workstation.example>`, subject Application, body "Hello, I'm applying for the open role. Could you review my CV when you have a moment?", `tells=[]`, `link=nil`, `landed=true`. `phish_hampshire_landed` true and task `hampshire_landed` completed at 2026-10-21T19:50:56Z. Session `playersent2.log` seq 11: `total: 3`, `skipped: [{id: own_hampshire, reason: no-sent-record}]`, `ids: [pay_today, parking, laptop]`, `sentTells: [[]]`. | Give the slice a send that stores at least one tell (a spoofable From, a `would-fail` auth read, a link, or urgency over the advisory maximum), or store the deceptions this Hampshire send is meant to show. When sent records exist and none have tells, skip with a reason that says so, rather than `no-sent-record`. |
| T3-2 | major | `public/break_escape/js/minigames/inbox-triage/inbox-triage-minigame.js:505-508`, `inbox-triage-minigame.js:521-524`, `public/break_escape/css/inbox-triage-minigame.css:149` | The review card marks Report on real mail as a failure. `_isRight` treats a phish as right only for Report or Verify, and real mail as right only for Trust or Verify. Report on real mail gets the class `wrong` and a red cross (`--ui-danger`). The sentence beside the cross says reporting is never wrong (`inbox-triage-minigame.js:495-497`). Under the awareness profile that Report scores 60 verdict points plus 40 reason points, which is 100 (`triage-scoring.js:38-39`, `triage-scoring.js:70`). The worked example's fourth message is this case. Delete on a phish is also marked wrong; that is easier to defend, because Report is the full-marks call and the line says deleting protects only you. The cross on a full-marks Report is the defect. | `social-triage-ui.test.mjs:197` asserts the words "reporting is never wrong" and does not assert the class or the icon. The slice set is `scoringProfile: "analyst"` (`scenario.json.erb:587`), where Report on real mail is 20 verdict points, and the same cross still sits beside "reporting is never wrong". | Treat Report on real mail as consistent with the teaching line. Do not paint a danger-coloured cross on a call the scorer marks full under awareness. Pair the icon with the sentence. |
| T3-3 | minor | `scenarios/test_social_slice/scenario.json.erb:586-596`, `public/break_escape/js/minigames/inbox-triage/inbox-triage-minigame.js:143` | The slice is the analyst set, and the glossary stays closed. Design 05 says student rounds show the SPF, DKIM and DMARC glossary open (`designs/05_inbox_triage_defender.md:81`), and the student-lab row sets `glossary` to `open` (`:711`). The set leaves `glossary` unset. The overlay opens it only when `set.glossary === 'open'`. The What's this? button is implemented (`header-panel.js:94-102`) and the header panel itself is `open`. | The round on game 2948 sorted the laptop message (SPF fail, DKIM pass, DMARC pass) with the glossary closed unless the player opened it. | Set `glossary` to `open` on this analyst set, or default an analyst set to open when the field is absent. |
| T3-4 | minor | `scenarios/test_social_slice/scenario.json.erb:667-680`, `public/break_escape/js/minigames/inbox-triage/header-panel.js:90-91` | The laptop message is real mail with SPF fail, DKIM pass and DMARC pass, and it has no `auth.summary`. The header panel prints that sentence only when `auth.summary` is a non-empty string. During the sort the player sees the fail with the per-check explainers and without the one line that says what the three results add up to. The review card does explain it afterwards, through `whyFine.senderAuth` ("SPF failed. DKIM and DMARC passed."). The message is not marked forwarded, so the forwarded banner (`header-panel.js:42-43`) correctly stays off. Design 05 puts the plain-English line under the three results for this kind of fail (`designs/05_inbox_triage_defender.md:276-280`). | Auth block at `scenario.json.erb:673`. `whyFine` at `:677-680`. | Add `auth.summary` on the laptop message, in the words the design uses for a fail that is still fine. |
| T3-5 | minor | `public/break_escape/js/minigames/inbox-triage/inbox-triage-minigame.js:762-763` | "Saving your result..." is shown for the whole save, including a first attempt that succeeds. Design 05 shows that notice while `syncConfirmed` is retrying (`designs/05_inbox_triage_defender.md:648-649`). `_notifyResult` calls `setSavingState('saving')` as soon as `persistResult` returns a promise. Finish stays disabled until the promise settles, which is the right hold. | Game 2948, result step at 100 percent, Sharp, pass true, note text already "Saving your result..." before the task wait returned. The note then cleared and one `triage_sorted` POST completed. The blocked run (2942) showed the notice across four retries and cleared it when the block lifted. The 403 run (2943) showed the failed copy and did not retry. | Show the saving notice on a retry, and leave the result screen quiet while the first attempt is in flight. Keep Finish disabled until the save confirms. |

## Done when

| Bar | Result |
|-----|--------|
| Scorer passes the worked example and both profiles; validator-social-triage passes | Holds. 84/84, including analyst 68% (100, 73, 57, 40) and awareness 86% (100, 87, 57, 100). |
| The slice has a four-message set and a defender board, and a playtest triages it with the playerSent card showing the sent message and its tells | The data has four messages and two defender facts (`hampshire_careers`, `teague_role`). The play did not show the fourth card. T3-1. |
| Reload with the done global already stored and the task incomplete completes the task once | Holds. Game 2941. One `triage_sorted` POST, 200. `verify-run.rb` lists the task completed. |
| With `sync_state` blocked, the result screen shows "Saving your result..." and no task completes until the block lifts; a 403 stops retries | Holds. Games 2942 and 2943, and `tools/playtest/se/triage-sync-regress.js` on 2940 (starter-level, RESULT PASS). |

Phase 3 "Done when" does not hold while T3-1 and T3-2 are open.

## Playtest

Server: keyless, 127.0.0.1:3001, pid 1178210, started Wed Oct 21 16:06:28 2026. Log `tmp/keyless-3001.log`. Mission `test_social_slice` (id 83). No VM flags. Scratch scripts and session logs are under the session scratchpad `se-P3-T/`, outside the repo.

`tools/playtest/se/bridge-3.jsonl` was run twice (games 2939 and 2948). Both stopped at the first reload: the script calls `location.assign(?skip_resume=1)` inside a `waitFor` that returns immediately, and the next eval starts before the new document has `__test` ("Execution context was destroyed"). On 2948 the evals through one mid-round answer passed, and the rows after that reload did not. That is a script race. The completion path and the reopen were re-run with `page.reload` and a click on Resume, below. P3-T0 recorded bridge-3 as 32/32 on game 2920; this session did not reproduce that full script.

Fix round 2 (2026-10-21) confirms this race still reproduces and files the command: `PLAYWRIGHT_BROWSERS_PATH unset, Node 24 (ms-playwright-go/1.57.0/node), chromium 1248 headless shell, bundle exec … playtest-session.js --headless < bridge-3.jsonl` fails at the first reload (RELOAD eval destroyed by the navigation; `window.__test` then undefined) on games 2978, 2985 and 2997. It is a browser-timing issue specific to reloading *while an overlay is open* — reloads with no overlay (bridge-1b D1/D2, bridge-4) pass in the same environment, and the untouched bridge-1a fails at its reload the same way. REVIEW_grok_P2P3's clean 32/32 was a different browser build. Not a script defect; the mid-round-reload coverage depends on the browser.

### Game 2940: Hampshire send, then triage

The careers contact was already on the server from browsing the company site (`se_intel_hampshire_careers` true). The send used the composer's own templates (`from_own`, `pretext_apply`, attachment `kit_cv`), not a typed secret. The message landed. Opening the triage workstation showed three messages and skipped `own_hampshire`.

Session log: `playersent2.log` (the earlier `playersent.log` missed the workstation because the player was 38px out of range; `moveToNear` fixed that, and it is not a product defect).

`verify-run.rb --tasks 2940`:

```
game            2940  (mission 83)
created         2026-10-21 19:47:10 UTC
last write      2026-10-21 20:03:49 UTC
played for      999s of wall clock
current room    "slice_room"
unlocked rooms  1: slice_room
unlocked objs   0:
inventory       1: Notepad
NPCs met        3: slice_host, brandt_desk, quinn_desk
flags submitted 0:
globals set     15: acct_freemail_choice, brandt_latched, brandt_lockout_channel, engine_tutorial_declined, p3c_blocked_done, p3c_blocked_pass, p3c_offline_done, p3c_refused_done, p3c_refused_pass, phish_hampshire_landed, pretext_brandt_desk_call_outcome, pretext_quinn_floor_call_outcome, quinn_latched, se_intel_hampshire_careers, teague_latched
tasks           1 in objectivesState, 1 completed
  hampshire_landed                   "completed"  at 2026-10-21T19:50:56Z
tasks_completed 1
score           18
social scenario true (completed tasks count toward the verdict)

VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed.
```

`count-task-posts.sh 2940 triage_sorted`: 0 completed POSTs with 200. The `p3c_*` globals were written by `triage-sync-regress.js` on this same game. They are exercised, not earned.

Server mail row: `msg_mvij1kzn_1`, tells `[]`, landed true, link nil, body as in T3-1.

### Game 2948: a full round, then a second open

Answers, read off the messages: Report on `pay_today` with the link and urgency chips, Trust on `parking` with nothing wrong, Trust on `laptop` with nothing wrong. Result: 100 percent, headline Sharp, pass true, phish caught 1 of 1, report rate 1, false alarms 0. One `objective_task_completed` for `triage_sorted`. Globals `slice_triage_done`, `slice_triage_pass`, percent 100, report rate 1. The note on that screen already read "Saving your result..." (T3-5).

A reload in the same sitting kept those globals and the completed task. The check also saw a minigame still active, so a second open in that same script timed out. A later load of 2948 (`again`) found no minigame, opened the workstation on a fresh brief (`step: brief`, `stored: null`, `answered: 0`), and closing it did not complete the task again. A mission set stays replayable. The read-only stored screen is for `pre` and `post` only.

`verify-run.rb --tasks 2948`:

```
game            2948  (mission 83)
created         2026-10-21 19:54:12 UTC
last write      2026-10-21 20:08:16 UTC
played for      844s of wall clock
current room    "slice_room"
unlocked rooms  1: slice_room
unlocked objs   0:
inventory       1: Notepad
NPCs met        3: slice_host, brandt_desk, quinn_desk
flags submitted 0:
globals set     11: acct_freemail_choice, brandt_latched, brandt_lockout_channel, defender_profile_done, engine_tutorial_declined, pretext_brandt_desk_call_outcome, pretext_quinn_floor_call_outcome, quinn_latched, slice_triage_done, slice_triage_pass, teague_latched
tasks           1 in objectivesState, 1 completed
  triage_sorted                      "completed"  at 2026-10-21T19:58:24Z
tasks_completed 1
score           28
social scenario true (completed tasks count toward the verdict)

VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed.
```

`count-task-posts.sh 2948 triage_sorted`: 1 completed POST with 200. Server values: `slice_triage_percent=100`, `slice_triage_reportRate=1`.

### Game 2941: reopen re-emit

Planted with `deferEmit`, then `syncConfirmed`, with the dispatcher wrapped so a `slice_triage_*` or `inbox_triage_completed` emit would have been recorded: confirmed true, emitted none, task incomplete. After reload: `slice_triage_done` true, `slice_triage_pass` true, percent 72, task still incomplete. Opening the workstation completed `triage_sorted` once. Closing it did not complete it again. The client log did not show `inbox_triage_completed`, because the test bridge only records events matching its interesting list (`test-bridge/log.js:38-44`) and that name is not on the list. The server POST is the check the plan asks for.

The planted globals are exercised, not earned.

`verify-run.rb --tasks 2941`:

```
game            2941  (mission 83)
created         2026-10-21 19:47:13 UTC
last write      2026-10-21 20:13:57 UTC
played for      1604s of wall clock
current room    "slice_room"
unlocked rooms  1: slice_room
unlocked objs   0:
inventory       1: Notepad
NPCs met        3: slice_host, brandt_desk, quinn_desk
flags submitted 0:
globals set     10: acct_freemail_choice, brandt_latched, brandt_lockout_channel, engine_tutorial_declined, pretext_brandt_desk_call_outcome, pretext_quinn_floor_call_outcome, quinn_latched, slice_triage_done, slice_triage_pass, teague_latched
tasks           1 in objectivesState, 1 completed
  triage_sorted                      "completed"  at 2026-10-21T20:13:56Z
tasks_completed 1
score           28
social scenario true (completed tasks count toward the verdict)

VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed.
```

`count-task-posts.sh 2941 triage_sorted`: 1 completed POST with 200. Server percent 72, report rate 1.

### Game 2942: sync blocked on the result screen

The round reached the result screen with `sync_state` aborted. Note "Saving your result...", Finish disabled, `saving` true, `slice_triage_done` already true locally (the writer runs before the sync), task not completed, four attempts while blocked. After the route was restored the note cleared and Finish unlocked. The server then has one completion.

`verify-run.rb --tasks 2942`:

```
game            2942  (mission 83)
created         2026-10-21 19:47:15 UTC
last write      2026-10-21 20:02:48 UTC
played for      934s of wall clock
current room    "slice_room"
unlocked rooms  1: slice_room
unlocked objs   0:
inventory       1: Notepad
NPCs met        3: slice_host, brandt_desk, quinn_desk
flags submitted 0:
globals set     10: acct_freemail_choice, brandt_latched, brandt_lockout_channel, engine_tutorial_declined, pretext_brandt_desk_call_outcome, pretext_quinn_floor_call_outcome, quinn_latched, slice_triage_done, slice_triage_pass, teague_latched
tasks           1 in objectivesState, 1 completed
  triage_sorted                      "completed"  at 2026-10-21T20:02:48Z
tasks_completed 1
score           28
social scenario true (completed tasks count toward the verdict)

VERDICT: progress recorded — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 1 tasks completed.
```

`count-task-posts.sh 2942 triage_sorted`: 1 completed POST with 200.

### Game 2943: forced 403

One PUT carrying `slice_triage_done`, status 403, no second attempt. Note: "We couldn't save your result yet. It will save the next time you open this round." Finish enabled, `saveFailed` true, task still incomplete a moment later (`later: 1` attempt). The server has no `slice_triage_done` and no task. `verify-run.rb` scores this as bootstrap only, which is what a refused save leaves behind: the checker counts rooms, objects, flags and tasks, and this run completed none.

```
game            2943  (mission 83)
created         2026-10-21 19:47:17 UTC
last write      2026-10-21 20:03:07 UTC
played for      950s of wall clock
current room    "slice_room"
unlocked rooms  1: slice_room
unlocked objs   0:
inventory       1: Notepad
NPCs met        3: slice_host, brandt_desk, quinn_desk
flags submitted 0:
globals set     8: acct_freemail_choice, brandt_latched, brandt_lockout_channel, engine_tutorial_declined, pretext_brandt_desk_call_outcome, pretext_quinn_floor_call_outcome, quinn_latched, teague_latched
tasks           0 in objectivesState, 0 completed
tasks_completed 0
score           0
social scenario true (completed tasks count toward the verdict)

VERDICT: BOOTSTRAP ONLY — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 0 tasks completed.
```

`count-task-posts.sh 2943 triage_sorted`: 0 completed POSTs with 200.

### Starter regress on 2940

`node tools/playtest/se/triage-sync-regress.js http://127.0.0.1:3001/break_escape/games/2940`: RESULT PASS. Blocked sync emitted nothing across four attempts and showed the saving notice, then emitted percent, report rate, pass, done (done last) and `inbox_triage_completed`. Offline ran out of attempts and emitted nothing. A 403 was one PUT, nothing emitted, straight to the failed notice.

### Narrow layout on 2940

At a 600px viewport, on the result step: document scroll width matched the viewport, the verdict row was `column`, chip height 58px (the stylesheet's 44px minimum is at `inbox-triage-minigame.css:214`, and the stack breakpoint is `max-width: 767px` at `:235`).

### Game 2952: defender board

Fresh game. The board opened in defender mode with two exposures, nothing picked: `hampshire_careers` options filter and hide, `teague_role` options rolebox and leave. Hide stayed changeable and the why-line was "The address is already on old pages and in old mail. Hiding the page does not stop mail sent to it." Filter then locked hide (`pickMitigation` returned false for a further hide). Rolebox set `defender_profile_done`. Close left the flag set.

An earlier open on 2948 found both cards already picked, so that game was not used for the wrong-pick check. 2952 started from an empty board.

`verify-run.rb --tasks 2952` scores the run bootstrap only. The checker does not count globals. `defender_profile_done` is true on the server, and the five script checks passed. No task POST was expected.

```
game            2952  (mission 83)
created         2026-10-21 20:17:09 UTC
last write      2026-10-21 20:17:34 UTC
played for      24s of wall clock
current room    "slice_room"
unlocked rooms  1: slice_room
unlocked objs   0:
inventory       1: Notepad
NPCs met        3: slice_host, brandt_desk, quinn_desk
flags submitted 0:
globals set     9: acct_freemail_choice, brandt_latched, brandt_lockout_channel, defender_profile_done, engine_tutorial_declined, pretext_brandt_desk_call_outcome, pretext_quinn_floor_call_outcome, quinn_latched, teague_latched
tasks           0 in objectivesState, 0 completed
tasks_completed 0
score           0
social scenario true (completed tasks count toward the verdict)

VERDICT: BOOTSTRAP ONLY — 0 rooms beyond the first, 0 objects unlocked, 0 flags submitted, 0 tasks completed.
```

### Earned secrets

| Game | Item | How it got there |
|------|------|------------------|
| 2940 | `se_intel_hampshire_careers` | Earned. Browsing the company site set the careers fact before the send. |
| 2940 | Hampshire send (`msg_mvij1kzn_1`) | Earned as a send. The wording came from the composer's templates, not from a typed secret. `tells` empty. |
| 2940 | `p3c_blocked_*`, `p3c_offline_done`, `p3c_refused_*` | Exercised. Written by `triage-sync-regress.js`. |
| 2941 | `slice_triage_percent` 72, `slice_triage_reportRate` 1, `slice_triage_pass`, `slice_triage_done` | Exercised. Planted with `deferEmit` for the reopen check. |
| 2948 | `slice_triage_*` at 100 percent | Earned by sorting the three authored messages in the round. No typed secret. |
| 2942 | `slice_triage_*` | Earned by the same sort, saved after the blocked route was lifted. |
| 2943 | none of the triage globals | The 403 refused the save. Local state was not kept. |
| 2952 | `defender_profile_done` | Earned by picking filter and rolebox on the board. |
| all | VM flags | None. This slice has no VM. |

No VM-side claim in this packet needs checking against SecGen.

## Verdict

Do not mark Phase 3 done. One blocker (T3-1: the playerSent card does not show the Hampshire send) and one major (T3-2: Report on real mail is drawn as a failure). Three minors (T3-3, T3-4, T3-5). The scorer, the validator, the one-shot reopen, the blocked save, the 403 stop, the narrow layout and the defender picks held.

## Fix round 1

| Finding | Outcome |
|---------|---------|
| T3-1 | Fixed in data; verified in a browser in Fix round 2. The Fix round 1 approach (relabel Hampshire's CV ask as urgent so a tell is stored) was superseded: the review (REVIEW_grok_P2P3 R-1/R-2) found that taught a false tell, so Fix round 2 reverted the urgency change and pointed the playerSent entry at Teague's spoofed send, which carries honest `senderTrust`/`senderAuth` tells (`own_teague`, `targetId: "teague"`). A sent record with no tells is still skipped as `sent-without-tells`. The replayed card is now opened in a browser by `tools/playtest/se/bridge-3b.jsonl` (8/8, after bridge-1b lands a Teague send). |
| T3-2 | Fixed. Report on real mail uses the class `acceptable` and a tick. The score is unchanged. `inbox-triage-minigame.js:515-516`; `inbox-triage-minigame.css:149`. |
| T3-3 | Fixed. The slice set sets `"glossary": "open"`. `scenario.json.erb:626`. |
| T3-4 | Fixed. The laptop message has `auth.summary` in the design's words for a fail that is still fine. `scenario.json.erb:710-712`. |
| T3-5 | Fixed. The first save sets `pending`: Finish stays disabled and the note stays blank. "Saving your result..." is only the `saving` state, which the starter uses on a retry. `inbox-triage-minigame.js:776`. |
