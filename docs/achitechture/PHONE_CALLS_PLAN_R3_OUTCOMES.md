# Phone calls plan: outcomes of review R3

Plan: `docs/achitechture/PHONE_CALLS_PLAN.md`, draft 4. Review: `docs/achitechture/PHONE_CALLS_PLAN_REVIEW_R3.md`. Every finding was checked against the code at aa2d7502a (engine and scenarios unchanged since the plan's line base, 74152ab15).

Counts: 15 findings (1 blocker, 6 major, 8 minor). 14 fixed, 1 withdrawn.

## R3 findings

| Id | Severity | Outcome | Where in the plan |
|---|---|---|---|
| X1 | blocker | Fixed. Confirmed: `_scriptedCallBusy()` (`npc-manager.js:740-748`) only counts scripted conversations, so a mapping fired by a call's own `#set_global` (tags apply before lines, `phone-chat-minigame.js:753-757, 1118-1122`) closes the call (`npc-manager.js:683-691`). The busy rule makes legacy scripted conversations queue behind a ringer call; row 25's reopen runs only with `openBlocked()` false and an empty scripted queue; new row 32 covers a connected call closed by anything else (knockout, another `startMinigame`, `forceCloseMinigame`); `caller_debrief` added to the test scenario, and the hand-off check added to every bring-in slice. | 1.2, 1.4, 2.1 (principle 4), 2.2 (`callActive`), 2.3 rows 25 and 32, 2.9 "Busy rule", 3.5, 5.1 `phone-call-busy.test.mjs`, 5.3 `caller_debrief`, A2b, A5, A6, section 8 step 4, M4–M8, M10, C27 |
| Y1 | major | Fixed. Confirmed: End and the back arrow call `closeConversation()` (`:217-227`), which shows the contact list and leaves the minigame open (`:1439-1455`); the five story-end branches only close forced calls through `_releaseForcedCall()` (`:1219-1224`). The plan names the change: for `params.ringerCall`, `closeConversation()` completes the minigame after its emit, `_releaseForcedCall()` also closes ringer calls (covering all five branches), and `#exit_conversation` marks `_endedByCall`. Tests for each path, and for legacy and `callLaunch` calls staying as today. | 1.5a, 2.1 (principle 2), 2.5 "Ending", A2b, 5.1 `phone-outgoing-call.test.mjs`, 5.3 `caller_basic`, `legacy_voiced` |
| Y2 | major | Fixed with the simple option. Confirmed: the only conversation persistence is the `conversation_closed` listener (`npc-manager.js:1061-1063`, `:1668-1677`). A `ring` mapping now sets `triggered.persist = true` when the call is offered, as at `:1059`. Rows 3, 4, 20, 21, 25, 27 and 31 reworded. | 1.7, 2.2, 2.3, 2.7 first bullet, 3.1, 5.1 `phone-call-persistence.test.mjs`, A2b, C28 |
| Y3 | major | Fixed. The reset runs only in the ringer's row 25 handler, for calls with `params.ringerCall`; `callLaunch` and legacy voiced calls are untouched. The lab SE proof compares Dev's and Ruth's `storyState` with A0 after a pretext call and after a reload. | 2.5 "Story position after a call", 5.4 lab SE route, 5.3 `legacy_voiced`, A2b |
| Y4 | major | Fixed. Debrief table for m01–m10 (host, mode, setting, beat before it, why), with the rule: in person by default, varied by story, a bring-in call never reviews the mission. m01's `closing_debrief` rewritten as a hand-off ("Come back to HQ" / "Pack up and come in", then "There's a car at the front. See you at HQ."). "Debrief call" renamed "bring-in call" throughout. m09's on-the-line HaX is kept under the "vary by story" decision (she has gone ahead to the Citadel, which sets up m10), so no question goes to the user. | 7.1, 7.2 m01 rows, 7.3 m01 rows, 7.5, 3.6, M8, C9, C23 |
| Y5 | major | Fixed, with the user's correction: ring-out after 20 s stays the default, and `ring.untilAnswered` (boolean, optional) is the ring-until-answered setting, rather than the review's `ringFor`. `call_answer_seconds` (int) is written through the existing `applyEngineVariables` writer mechanism, run-scoped by exact name (a `call_` prefix would break `test_finale_calls_credits`' saved `call_started`/`call_done`). Tests and `caller_basic` / `caller_patient` proofs. | 1.7a, 2.2, 2.3 rows 9, 12, 21, 26, 27, 2.4, 2.11, 3.1, 3.3, 4.1, 4.3, 5.1 `phone-call-vars.test.mjs`, 5.3, A2a, A2b, C24, C25 |
| Y6 | major | Fixed. The header button reads "Call back" while a callback is pending and the missed row has its own "Call back" button; `call_is_callback` (bool) is true only when a callback connects. Every path that leaves a callback is listed. Proofs in `caller_decline`, M4, M5, M8. | 2.5 "Button", 2.6, 2.7, 2.11, 5.1, 5.3 `caller_decline`, A6, C26 |
| n1 | minor | Fixed. No Hang up on a forced call's hold pill. | 2.3 rows 12 and 17, 2.4 hold pill, 5.1 |
| n2 | minor | Fixed. In A2b any open minigame or popup blocks ringing; A2c and A3 lift it. | 2.2 "Built in stages", A2b, A2c, A3 |
| n3 | minor | Fixed. An answered offer never rings again: rows 15, 19 and 24 keep it `held` (pill hidden while a conversation or the knockout screen is up). | 2.2 `held`, 2.3 rows 15, 19, 24, 2.4, 5.1, C29 |
| n4 | minor | Fixed. Hooks schedule the re-check with `queueMicrotask`. | 2.2 (hooks paragraph), 2.9, 5.1 |
| n5 | minor | Fixed. Save the frame's `src` property; the brief window of game input after a popup closes is stated as expected. | 1.9, 2.4 workstation popup |
| n6 | minor | Fixed. One form: tag on its own line, then `-> DONE`; the phone dials before the exit and story-end checks; a rung-out call returns the thread on its home knot. Validator error for the tag inside brackets, warning when the next line is not `-> DONE`. | 1.9, 2.5, 3.2, 4.3, 5.1, A5 |
| n7 | minor | Withdrawn. The plan already names `m07_phone_agent_0x99.ink` in the m07 bring-in row; no occurrence of `m07_phone_agent0x99.ink` exists in draft 3 (grep). | — |
| n8 | minor | Fixed. 24 "call me" / "ring me" ink lines listed with an outcome each (18 stay, 6 reworded). The review's 39 hits include "Bring me in" choices and comments, which are not calls to the player. | 7.3 second table; section 8 step 2; M4–M8 scopes |

## R2 items R3 marked closed only in text

| R2 item | R3 status | Outcome | Where in the plan |
|---|---|---|---|
| X2 held call opening over a minigame | closed for held calls; a connected call closed by something else still open | Closed by R3 X1: row 32 and the busy rule | 2.3 row 32, 2.9 |
| Y1 popups | closed, with n5 | Closed by n5 | 2.4 |
| Y3 (2) "reload persists the trigger" | partly; no mechanism | Closed by R3 Y2: trigger persisted at offer | 2.7 |
| Y4 "Call me" texts | closed for ERB texts; ink lines delegated | Closed by R3 n8: ink lines listed | 7.3 |
| Y5 split A2 | closed, with n2 | Closed by n2 | 2.2, A2b |
| z4 terminal call ends on the back arrow | partly; no code path | Closed by R3 Y1: `closeConversation()` completes a ringer call | 2.5 "Ending", "Terminal-look calls" |
