# Ops log L2b: delta review R2 (the flag back on the plan's client check)

Reviewer: read-only. Branch `ops-logs`, head `f9d6ce8af`. Fix commits read: `62105c898`, `6c868d7f9`, `06aee2c62`, `0bf994549`, `f9d6ce8af`.
Plan: `docs/achitechture/OPS_LOG_ROWS_PLAN.md` (identical to main), sections 4.2, 5.2, 7, 9, 11.

Status: complete (all nine checks done; see "Not checked").

## 1. The removal is complete: yes

- `git diff --stat main ops-logs -- config/routes.rb app/controllers/break_escape/games_controller.rb app/models/break_escape/game.rb app/policies/break_escape/game_policy.rb test/unit/break_escape/policy_test.rb docs/achitechture/OPS_LOG_ROWS_PLAN.md` is empty. `public/break_escape/js/api-client.js` is not in `git diff --stat main ops-logs` either.
- `git grep "opsLogFlagged\|flaggedRow\|log_rows/flag\|logFlag" ops-logs -- app lib public test tools scripts docs scenarios`: no hit in `app`, `lib`, `public`, `tools`, `scripts`, `scenarios`. The hits left are (a) tests that assert the absence (`log_seed_flag_test.rb:192-200`, `ops_logs_scenario_test.rb:345-351`, `ops-log-viewer.test.mjs:834-835`) and (b) history in the stream brief, `HANDOVER_L2b.md` and `reviews/L2b_R1.md`. Both are right to stay.
- The only engine files the stage changes against main are `app/models/break_escape/ops_log.rb` (seed rows, additions only), the viewer and its CSS. No strip call exists anywhere: the controller and `game.rb` are main's, so a reader object is served exactly as main serves it (L2a), with all of `minigameData`.
- The reader reaches the browser with `anomaly.rowId`, `flagActionLabel`, `flagActions`, `completionActions` (plan 7, lines 388-391): asserted whole for the room answer in `ops_logs_scenario_test.rb:330-339` (the real scenario) and `log_seed_flag_test.rb:176-187`. The bootstrap and a container or desktop copy are not asserted by a test (see N-4); nothing in the code can strip them, since no stage code touches those answers.

## 2. The client check against plan 5.2

Code: `public/break_escape/js/minigames/ops-log/ops-log-minigame.js` `_renderFlag`, `_confirmFlag`, `_runActions`, `_setGlobalAndNotify` (about lines 432-512), constructor lines 57-73.

- **Comparison.** `rowId !== this._anomalyId`, strict, `_anomalyId` only when `anomaly.rowId` is a string. A non-string or missing `rowId` makes every pick wrong. Sound.
- **Right pick.** Sets `_flaggedId` first, then `_runActions(flagActions)`, then `_runActions(completionActions)`, then re-renders and focuses the row. `_runActions` handles `set_global` and `complete_task` exactly as log-filter's `_executeActions` (`log-filter-minigame.js:1418-1427`), and `_setGlobalAndNotify` is a copy of log-filter's (`:1441-1452`). Log-filter is untouched (`git diff --stat main ops-logs -- public/break_escape/js/minigames/log-filter/` empty). Matches plan lines 285-286.
- **Wrong pick.** `_flagState = 'wrong'`, re-render of the detail pane only, nothing marked, nothing run. Selecting another row clears the note (`_select`).
- **No row marked before a right flag.** `_flaggedId` is null at construction and set only by `_confirmFlag` on a right pick, by the done global at construction, or from the page cache of a right pick. Mutation-checked (below).
- **Flag button only with an anomaly.** `_renderFlag` returns unless `minigameData.anomaly` is an object. Matches plan line 284.
- **"Already flagged" after a reload.** Read from `window.gameState.globalVariables[<key>] === true`, where the key is the first `set_global` with `value: true` in `flagActions`, else in `completionActions`. Log-filter reads `completedGlobal`, else the first `set_global true` of `completionActions` ONLY (`log-filter-minigame.js:221-222`, `:281-284`); it never looks in `flagActions`. The plan says nothing about a reload at all (5.2 has no line on it). So this is the fixer's reading of the stream brief's "reads done from the action's global, as log-filter does": the same mechanism, a wider search. It is needed for the plan's own example (4.2 lines 166-168 has only a `flagActions` global), so I accept it, but it changes which step "done" stands for: see N-2.
- **Twice?** A double click: the second click lands on a detached CONFIRM whose handler returns at `if (this._flaggedId || this._closed)`. A reopen before the sync: the global is already true in `window.gameState` (set synchronously), and the page cache holds `flaggedId`, so no control is offered. A reload before the sync: the global is lost, the flag is offered again and a right pick runs the actions again; `set_global true` is idempotent and `completeTask` returns early for a completed task (`objectives-manager.js:789`), so this heals rather than harms. Two readers of one source: each has its own `minigameData`; see N-3. A reader with no done global: see N-1.
- `window.npcManager.setGlobalVariable` is defined nowhere in the engine (every caller guards it), so at run time the fallback branch runs, as in log-filter. Not a finding (copied behaviour), noted so nobody trusts the first branch.

Mutation check (a scratch copy of the tree, not the worktree; `node --test test/js/ops-log-viewer.test.mjs`): a wrong pick accepted fails tests 29 and 34; actions run twice fails 30; a row marked before a flag fails 15, 27-30, 32, 33; the done global not read fails 31 and 32; the done global read from `completionActions` only fails 31. The flow's tests can fail.

## 3. The seed row id: as the plan says

`ops_log.rb` `ops_log_client_seed_row`: `id: row['id']`, the authored id, only for ids matching `SEED_ID` (`^s[0-9]{1,3}$`). `ops_log_client_row` (play rows) has no hunk in `git diff main ops-logs -- app/models/break_escape/ops_log.rb`: a written row's id is unchanged from L2a. Tests: `log_seed_flag_test.rb:135-139`, `ops_logs_scenario_test.rb:339`.

## 4. The leak check

`git diff main ops-logs -- tools/playtest/lib/access_leak_scanner.rb` is 28 lines: a comment, `log_stored_only_keys` (R4-2: the hand list plus every registry detail key marked `show: false`), `log_detail_keys` by a word before `:` or `=` (R4-1), and the two call sites switched to the new method. No anomaly or flag rule, no `@log_flag_right`. Nothing removed or loosened against main: `LOG_ANSWER_KEYS`, `LOG_ROW_KEYS` (which already allowed the `at` form, `:1963`) and `LOG_STORED_ONLY_KEYS` are main's. R4-1 and R4-2 each have a test that can fail (`access_leak_scanner_log_rows_test.rb`, "R4-1: ..." with two separators and a clean control, "R4-2: ..." with and without the registry entry). The L2a rules keep their ten tests (count on main 10, at head 15). The four scanner tests removed since the pre-fix commit are the removed rule's own (flag answer bodies, `flaggedRow`, the strip); "a seed row with a key beyond its seven is still a finding" keeps the one part that still applies.

## 5. R1 findings: outcome of each

| R1 id | R2 result | Checked at |
|---|---|---|
| F-1 (major) lost right-flag answer | moot, confirmed (no request carries the actions; but see N-2 for the small relative of it that the new design has) | `ops-log-minigame.js` `_confirmFlag`; `ops-log-viewer.test.mjs` "a lost request cannot lose it" |
| D-2 (major) server judging protects nothing | moot, confirmed | no route: `config/routes.rb` equals main |
| D-1 plan contradicts itself | moot, confirmed | plan file equals main; brief decision at `OPS_LOGS_STREAM_BRIEF.md:83-94` |
| F-3 `opsLogFlagged` undocumented | moot, confirmed | key absent from `app`, `lib`, `public` |
| F-4 focus lost after a right flag | confirmed fixed | `_confirmFlag` last three lines focus the row; CANCEL and a wrong pick focus FLAG; tests 28 and 30 assert `__focused` |
| F-5 note on a row that was not flagged | moot, confirmed (the check is synchronous) and `_select` clears the note; test 29 |
| F-6 `unchanged` and `rev` ignore flag state | moot, confirmed | `flaggedRow` gone |
| S-1 seed rows unbounded | confirmed fixed for id, stamp and result | `ops_log.rb` `ops_log_seed_rows` (`SEED_ID`, `SEED_AT`, `definition[:results]`, a repeated id skipped); `log_seed_flag_test.rb:122-133`. Left as R1 allowed: a non-NPC `as` is cut at 64 by `normalise_username` and a free detail value is `value.to_s`; authored text only |
| V-1 schema `as` at 32 | confirmed fixed | `scripts/scenario-schema.json` `seedRows.items.properties.as`: `maxLength: 40`, description names the 32 |
| T-1 weak rev test | confirmed fixed | `log_seed_flag_test.rb:141-151`: same reader, one seed row's `at` changed, revs differ |
| T-2 strip tested in two places | moot, confirmed (no strip); the opposite is asserted for the room answer; see N-4 for the other copies |
| L-1 leak rule run-wide | moot, confirmed | rule gone, scanner diff above |
| P-1 beat 17 overclaims | confirmed fixed | `PLAYTEST.md:287-289`: no absence asserted; one loose phrase left, see N-4 |

## 6. The flagged-row look and the toast

- CSS `ops-log-minigame.css:99-112`: hard-stop 4px hatch in two dark greens, text `#aaeecc`, a 2px bottom border and a 6px left bar in `#44bb88`; selected is a flat `#1e2244`. No radius, blur or shadow (a node test asserts that); borders are 2px or a multiple. `repeating-linear-gradient` is already used in 11 places in the project's CSS. Distinct from a selected row in colour, pattern and the bar; a row both flagged and selected adds a 2px light top border. Absent before a right flag (class and `data-flagged` come only from `_flaggedId`). Acceptable. Cosmetic only: the 6px left border on the first cell moves that cell's text 6px when the row becomes flagged; not worth a finding.
- The plan's words are "No row is ever tinted" (5.2 line 286; section 11 "no row tinted"). The flagged look after a right flag goes past the letter of that and has no ruling in the stream brief. See N-5.
- Toast: `notifications.js:13-20` and `:253-264`: every `info` and `success` toast raised while a conversation, a minigame or a workstation popup is open is held and shown when it closes. That is the engine's rule for all minigames since 2026-10-16, not something this viewer does. Log-filter gets its toast 1.4 s later because it closes itself; this viewer stays open, so the toast waits for the player to close it. Acceptable: the player has immediate feedback in the viewer (`FLAGGED`, the marked row, the task ticked in the objectives panel), and auto-closing a log browser the plan describes as browsable would be the worse choice. The docs and beat 17 say where the toast appears.

## 7. Tests

Counts (main / before the fix pass `146bdc4de` / head): `log_seed_flag_test.rb` 0 / 16 / 9; `ops_logs_scenario_test.rb` 14 / 19 / 18; `access_leak_scanner_log_rows_test.rb` 10 / 19 / 15; `ops-log-viewer.test.mjs` 26 / 36 / 37; `validator-log-sources.test.mjs` 29 / 47 / 47; `dungeon-graph-ops-logs.test.mjs` 0 / 5 / 5; `policy_test.rb` 42 / 42 / 42 (equal to main). Every drop since `146bdc4de` is a case of the removed route, strip or flag rule; no L2a test count fell below main's. The controller and scenario tests assert the reader's fields in the room answer and that the route is gone (a 404 or a routing error, no state key). Node files run here at head: `ops-log-viewer`, `validator-log-sources`, `dungeon-graph-ops-logs` all pass.

## 8. PLAYTEST beats 14 to 19

`scenarios/test_ops_logs/PLAYTEST.md:263-304`. Followable in order from beat 13; every action is a real control (`moveToNear`, `interact`, row clicks, the three buttons by `data-action`, the harness `sync` and resume); no beat sends a request of its own; beat 17 states that the toast shows when the viewer closes, and beats 15 to 17 say the capture file gains no request. Beat 18 covers the same-page reopen and the reload after a sync. One loose phrase: N-4.

## 9. Merge readiness

Trial three-way merge of `ops-logs` with the other stream's branch `ops-build` at `1acac5791` (`git merge-tree <base> ops-logs ops-build`, base `e61cfe5ae` = main): **no conflict markers**. Files changed on both sides, all merged by git with no conflict: `docs/ACCESS_AND_NETWORKS.md`, `README_scenario_design.md`, `scripts/generate_dungeon_graph.rb`, `scripts/scenario-schema.json`, `tools/playtest/lib/access_leak_scanner.rb`. `scripts/validate_log_rows.rb` is changed on this side only. The shared engine files (`routes.rb`, the controller, `game.rb`, `game_policy.rb`, `policy_test.rb`, `api-client.js`, `interactions.js`, `container-minigame.js`, `core/game.js`, `ops_log_events.rb`) are untouched on this side, so they cannot conflict.

To do at the merge, since a clean text merge is not a checked one: (a) regenerate `scenarios/test_ops_logs/dungeon_graph.*` after the merge, because both streams changed the generator and the committed graph was drawn by this side's alone; (b) run `dungeon-graph-ops-logs.test.mjs`, `validator-log-sources.test.mjs` and the scanner unit tests on the merged tree (the scanner gained about 600 lines on the other side); (c) check the two A24 rows in the README index and `ACCESS_AND_NETWORKS.md` sit in order beside whatever rows the other stream added. `ops-build` moves; repeat the trial merge on the day.

## New findings

### N-1 (minor) A reader whose actions set no global to `true` can be flagged more than once, and nothing warns the author

- Where: `ops-log-minigame.js:62-64` (`_doneGlobal` is null with no `set_global ... true`), `:70-72` (no memory at open), `_deny` (deletes the page cache entry, and with it `flaggedId`), `_cacheKey` at `:74` (the key holds the route, so the same reader opened from a desk and from a desktop over a foothold or relay has two entries). `scripts/validate_log_rows.rb:140-162` (`log_check_anomaly`) judges only the shape of `anomaly`.
- What happens: for such a reader the flag is offered again after a reload, after a `NO ACCESS` answer in the same page, and from a second route in the same page. A right pick runs both lists again. `complete_task` is safe (returns early when done). A `set_global` to a value other than `true` (a string state, a number, `false`) is written again and can put back a value that later play had moved on from. A reader with an `anomaly` and no actions at all is also accepted silently: its flag does nothing.
- The orchestrator's question (should the validator warn, per plan section 9): section 9 does not list this warning, so it is an addition, but it sits in this stream's own file, costs a few lines, and is the only place an author would learn of it (the docs sentence in `ACCESS_AND_NETWORKS.md` A24 is easy to miss). **Yes: warn, do not error.**
- Fix: in `log_check_anomaly`, after the shape check: warn when `flagActions` and `completionActions` together are empty ("the flag does nothing"), and warn when they hold no `{ type: set_global, value: true }` ("the flagged mark and the once-only guard do not last past a reload"). Two node tests in `validator-log-sources.test.mjs`; `test_ops_logs` must stay clean (it has `found_night_swipe`). No viewer change needed.

### N-2 (minor) "Done" is read from the FIRST step, so a completion that failed is never retried after a reload

- Where: `ops-log-minigame.js:62-64` (`flagActions` searched before `completionActions`), `:70-72`; `_renderFlag` offers nothing once `_flaggedId` is set. In `test_ops_logs` the global is in `flagActions` and the task in `completionActions` (`scenario.json.erb:140-141`), the shape the plan's example invites.
- What happens: a right flag sets `found_night_swipe` in the page and calls `completeTask`, which posts to the server with retries (`objectives-manager.js:787-830`). If that post fails for good (connection lost for longer than the retries) and a later sync saves the global, then after a reload the reader shows `FLAGGED`, offers no control, and nothing ever calls `completeTask` again: the task stays open with no way to finish it. This is the small relative of R1's F-1. It needs a failed task post, a later good sync and a reload, so it is rare; log-filter avoids it by reading "done" only from `completionActions` (the last step), at the cost of the plan's example then having no memory.
- Fix (small, viewer only): when the reader opens with the done global already true, run the `complete_task` entries of both lists once (`completeTask` returns early for a task that is completed or completing, so a healthy game sends nothing). Add a node test: done global true at open, `completeTask` called with the task id, no `set_global` written. Keep the search order as it is.

### N-3 (minor) A done global that is true for any other reason marks the anomaly row with no flag

- Where: `ops-log-minigame.js:70-72`.
- What happens: if the key is also set by another action (an NPC line, another reader sharing the key, a scenario default of `true`), the reader opens with its anomaly row marked `FLAGGED` and its other actions never run. Two readers of one source that share a flag global is the likely case: flagging on the first marks the second's row and the second's `completionActions` are skipped (N-2's fix covers its tasks, not its other globals).
- Fix: one sentence in the A24 "Known limits" (`docs/ACCESS_AND_NETWORKS.md`): the reader's first `set_global true` key must be set by that reader alone. Optional validator warning when two `ops_log_terminal` readers share that key, or when `globalVariables` declares it `true`. Docs alone is enough to land.

### N-4 (minor) The bootstrap and container copies of the reader are stated but not tested

- Where: `PLAYTEST.md:289` ("The reader object in the bootstrap and the office room answer holds `anomaly.rowId` ..."); `log_seed_flag_test.rb:176-187` and `ops_logs_scenario_test.rb:330-339` assert the room answer only.
- What is wrong: the office is locked at the start, so whether the bootstrap holds `night_log_pc` at all is not shown by any test, and the beat states it as fact. No beat asserts it, so a tester cannot fail on it; it can mislead a reader. A reader inside a container or on a PC desktop (plan 5.2 lines 296-303) has no test that its `minigameData` arrives whole either; no stage code can strip it (the controller is main's), so this is a gap in proof, not a suspected fault.
- Fix: reword beat 17 to "the office room answer (and any other copy of the reader the browser is given)". Optional: one controller case in `log_seed_flag_test.rb` with a reader inside an open container, asserting `anomaly.rowId` and both lists in the `/container` answer.

### N-5 (minor) The flagged-row look goes past the plan's "No row is ever tinted" and has no ruling

- Where: plan 5.2 line 286 and section 11 ("no row tinted"); `ops-log-minigame.css:106-112`; `ACCESS_AND_NETWORKS.md` A24 "What the player sees" and "Plan vs code" ("the build follows the plan").
- What is wrong: the plan's sentence is unconditional; the build marks the right row after a right flag (and the node test title was changed to "... before a right flag"). The intent of the plan line (never tell the player which row is odd) is kept, and the mark is needed for the reload state to be visible, so I would keep it. But the plan file must stay equal to main, so the departure needs to be written down where rulings live.
- Fix: one "Decisions" line in `OPS_LOGS_STREAM_BRIEF.md` (the row is marked only after a right flag; the plan's "never tinted" is read as "never before a right flag"), and the A24 "Plan vs code" line should name it instead of saying the build follows the plan with no exception.

## Not checked

- No Ruby test was run (no claim needed it; the lock is shared and the playtester's server is up). The Ruby test reading above is from the test source.
- `bin/ops-golden-compare` was not run.
- Nothing was checked in a browser: the hatch look, the focus ring on the flagged row and the toast timing are from the CSS, the code and `notifications.js`, and are for the playtest rerun to see.
- The merged tree (with `ops-build`) was not built or tested; only the text merge was tried.
- Whether the bootstrap holds a locked room's objects was not traced (N-4).

## Severity count

Blockers 0. Majors 0. Minors 5 (N-1 to N-5). R1's 13 findings: 5 confirmed fixed (F-4, S-1, V-1, T-1, P-1), 8 moot and confirmed (F-1, D-2, D-1, F-3, F-5, F-6, T-2, L-1); none "not fixed", none "fixed wrongly".

## Verdict

**Ready to land after the playtest rerun.** The server-judged flag is gone without trace in code, the shared files and the plan equal main, and the client check is what plan 5.2 and 7 describe, with tests that fail when it is broken.

Recommended in one tidy pass before or with the landing (none blocks it): N-2 (re-run `complete_task` at open when the done global is set; viewer and one node test), N-1 (two validator warnings and their tests), and the three wording items N-3, N-4, N-5 (docs and the brief only). If only one is done, do N-2: it is the one that can leave a player's task unfinishable.

## R2 outcomes

| Id | Outcome | Where |
|---|---|---|
| N-2 | fixed: a reader opened done re-runs its `complete_task` entries only; node test (mutation: re-run removed, two tests fail) | `ops-log-minigame.js` constructor; `ops-log-viewer.test.mjs` |
| N-1 | fixed: two validator warnings, one node test each; `test_ops_logs` gains none | `validate_log_rows.rb` `log_check_anomaly`; `validator-log-sources.test.mjs` |
| N-3 | fixed: one sentence in A24 | `docs/ACCESS_AND_NETWORKS.md` |
| N-4 | fixed: beat 17 reworded; the optional container test not added | `PLAYTEST.md` |
| N-5 | fixed: the flagged look stays; A24 "Plan vs code" names the reading | `docs/ACCESS_AND_NETWORKS.md` |
