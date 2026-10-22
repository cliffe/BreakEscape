# SE bridge regression suite results

Run 2026-10-22 against the working tree, keyless server on :3001, headless, Node 24, 3 at a time. Each bridge had a fresh game from `tools/playtest/new-game.rb`, scored with `check-bridge.mjs --expect`. Rerun with `tools/playtest/se/run-suite.sh [out_dir]` (`ONLY="1b 4 6"` limits it). bridge-3b resumes the game bridge-1b leaves behind, so it shares 1b's game id. bridge-5-600 runs at a 600 px viewport (`VW=600`).

Result: 14 of 17 bridges pass. Three fail (1b, 4, 6). Every failure traced so far is a stale test, not an engine regression.

| Bridge | Scenario | Game id | Passed/expected | Result |
|---|---|---|---|---|
| bridge-1a | test_social_slice | 3358 | 38/38 | PASS |
| bridge-1b | test_social_slice | 3359 | 61/82 | FAIL |
| bridge-2 | test_social_slice | 3360 | 15/15 | PASS |
| bridge-3 | test_social_slice | 3361 | 32/32 | PASS |
| bridge-3b | test_social_slice | 3359 (1b's game) | 8/8 | PASS |
| bridge-3c | test_social_slice | 3362 | 4/4 | PASS |
| bridge-4 | test_social_slice | 3363 | 26/30 | FAIL |
| bridge-5 | test_social_slice | 3364 | 29/29 | PASS |
| bridge-5-600 | test_social_slice | 3365 | 9/9 | PASS |
| bridge-6 | lab_social_engineering | 3367 | 32/35 | FAIL |
| bridge-board-indicators | test_social_board_indicators | 3369 | 13/13 | PASS |
| bridge-freetext | test_social_freetext | 3370 | 8/8 | PASS |
| bridge-m5-channels | test_social_m5_channels | 3371 | 20/20 | PASS |
| bridge-m5-slice | test_social_slice | 3366 | 12/12 | PASS |
| bridge-p7-channels | test_social_p7_channels | 3372 | 17/17 | PASS |
| bridge-p9 | test_social_p9 | 3373 | 13/13 | PASS |
| bridge-r4-door | lab_social_engineering | 3368 | 3/3 | PASS |

## Repeated runs

An unrelated `pkill -f playtest-session.js` ran during this task. None of the 17 runs was cut short: every log ends with `quit`/`session-closed` and every run produced its full eval count (the 3 fails are false or throwing evals, not missing ones). bridge-1b, 4 and 6 were nevertheless rerun once (games 3374/3376/3375) and gave identical counts (61/82, 26/30, 32/35, with 3b 8/8), so the failures are reproducible.

## Failures

Scenario mapping was inferred from each bridge's `interact` ids and fixtures (slice ids such as `slice_*`, `quinn_desk`; lab ids such as `roe_sheet`, `engagement_office`), and the m5-slice and r4-door bridges from their ids; the build log names most of them.

### bridge-1b (61/82, 21 failing evals) - stale

Root causes are three evals; the rest follow from the mail client closing early.

- **L3, L5** (Create-account panel): expect the Confirm button `disabled` until an address is picked. The panel now leaves Confirm enabled on purpose and shows a line if nothing is picked (comment in `mail-client-minigame.js` `openCreateAccount`: lab R1 F11). Stale. Live probe: `confirm.disabled === false`, everything else in L3 matched.
- **N2** (Esc on the checklist): expects Esc to close the checklist only, leaving the composer open. The checklist layer now calls `requestClose()`, so Esc closes the whole client (comment in `_showChecklist`: lab R4 F4/A5). Stale. Live probe: layers were `[compose, checklist]` before Esc and the client was gone after one Esc.
- **Cascade** (S2, N3, N4, K1, J0-J3, J5, K4, K4b, S3, D1, D2, H6, N6, B1, B2): all run against a mail client that N2's Esc has closed (`currentMinigame` is null, or the second send never happened, so there are no Teague replies and no landing). Not individually verified; they should be rechecked once N2 is rewritten to Esc twice, or to click Edit & resend. A real regression in one of them would be hidden until then.

### bridge-4 (26/30, 4 failing evals) - stale

- **Q1, Q4, P1, P4**: expect `overlay.closeMode === 'abort'` and a `minigame_failed` with `result.aborted` on Close. `PretextPrepMinigame.closeMode` is now `'close'` on purpose: a plain Close or Esc is a clean exit that records nothing (comment in `pretext-prep-minigame.js`, F11). Live probe on Q1: every other conjunct matched; only `closeMode` was `close`. Stale.

### bridge-6 (32/35, 3 failing evals) - stale (SC7 needs a decision)

- **SC7**: expects the `stop_rule` task completed once the right stop-rule answer is picked. Live probe: `roe_stoprule_done`, `roe_signed`, `roe_scope_done` all true, board complete 6/6, other options locked, `scope_cards` completed, but `stop_rule` still `active`. The task is now titled "Answer the stop-rule, then get Gareth to sign" and completes on `global_variable_changed:fairbairn_condition_heard` (scenario.json.erb lines 36 and 1322). Likely a stale test, but it is the one failure worth a human glance: confirm that completing the task only on Gareth's condition is the intended design.
- **PL1**: expects the objectives options in order `how_far_gaps,disrupt_payroll,collect_passwords`. Live order is `disrupt_payroll,how_far_gaps,collect_passwords`; every other PL1 conjunct matched (text, mode, 2 items, keyboard owned). Stale ordering assertion.
- **PL4**: the wrong-answer "why" texts were reworded. Expected `simulated and reported, not stored` (now "simulated, reported and dropped"), `Naming people suppresses reporting` (now "Name people and they stop reporting"), `never what was submitted` (now "never what was typed"), `cannot observe` (now "Ledgerwell has no report button yet, so there is nothing to count"). The first expectation (`bar disruption`) and the state checks still hold. Stale wording.

No fixes were made.
