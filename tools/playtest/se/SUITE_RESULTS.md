# SE bridge regression suite results

Run 2026-10-22 against the working tree, keyless server on :3001, headless, Node 24, 3 at a time. Each bridge had a fresh game from `tools/playtest/new-game.rb`, scored with `check-bridge.mjs --expect`. Rerun with `tools/playtest/se/run-suite.sh [out_dir]` (`ONLY="1b 4 6"` limits it). bridge-3b resumes the game bridge-1b leaves behind, so it shares 1b's game id. bridge-5-600 runs at a 600 px viewport (`VW=600`).

Result: all 17 bridges pass. The first run of the suite had three stale failures (1b, 4, 6); those bridges were reworked to the current intended behaviour and rerun (see the rework section below). The other 14 rows are from the first run.

| Bridge | Scenario | Game id | Passed/expected | Result |
|---|---|---|---|---|
| bridge-1a | test_social_slice | 3358 | 38/38 | PASS |
| bridge-1b | test_social_slice | 3418 | 86/86 | PASS |
| bridge-2 | test_social_slice | 3360 | 15/15 | PASS |
| bridge-3 | test_social_slice | 3361 | 32/32 | PASS |
| bridge-3b | test_social_slice | 3418 (1b's game) | 8/8 | PASS |
| bridge-3c | test_social_slice | 3362 | 4/4 | PASS |
| bridge-4 | test_social_slice | 3419 | 30/30 | PASS |
| bridge-5 | test_social_slice | 3364 | 29/29 | PASS |
| bridge-5-600 | test_social_slice | 3365 | 9/9 | PASS |
| bridge-6 | lab_social_engineering | 3420 | 36/36 | PASS |
| bridge-board-indicators | test_social_board_indicators | 3369 | 13/13 | PASS |
| bridge-freetext | test_social_freetext | 3370 | 8/8 | PASS |
| bridge-m5-channels | test_social_m5_channels | 3371 | 20/20 | PASS |
| bridge-m5-slice | test_social_slice | 3366 | 12/12 | PASS |
| bridge-p7-channels | test_social_p7_channels | 3372 | 17/17 | PASS |
| bridge-p9 | test_social_p9 | 3373 | 13/13 | PASS |
| bridge-r4-door | lab_social_engineering | 3368 | 3/3 | PASS |

## Repeated runs

An unrelated `pkill -f playtest-session.js` ran during this task. None of the 17 runs was cut short: every log ends with `quit`/`session-closed` and every run produced its full eval count (the 3 fails are false or throwing evals, not missing ones). bridge-1b, 4 and 6 were nevertheless rerun once (games 3374/3376/3375) and gave identical counts (61/82, 26/30, 32/35, with 3b 8/8), so the failures are reproducible.

## Rework of bridges 1b, 4 and 6

Rerun with `ONLY="1b 4 6" tools/playtest/se/run-suite.sh`, headless, Node 24: 1b 86/86, 3b 8/8, 4 30/30, 6 36/36. No check was loosened; each changed eval asserts the current behaviour. Eval counts rose (1b 82 to 86, 6 35 to 36) because new evals were added.

### bridge-1b

- **L3, L5**: Confirm is enabled from the start. L5 presses Confirm with nothing picked and asserts "Pick an address first." (role alert) in the panel, nothing written, panel still open; picking an address then leaves Confirm enabled.
- **N2**: Esc on the checklist closes the whole client. It now asserts a normal exit (`minigame_completed`, no `minigame_failed`, no `aborted`), no client left open, and the failed send, the attempt count and the Sent record still in mail state. New steps reopen the client and Compose (N2b: composer fresh after a judged send, one record in Sent, toolbar inert behind it) and refill the message through the pickers and the attachment (N2c) so S2 can send it.
- **S2** now expects `sentThisSession === 1` (a new client session). **N3**: the old second Esc is replaced by clicking Done on the landed checklist, which closes the composer and keeps the client open. S3 comment reworded ("after a send").
- **Cascade, 18 evals** (S2, N3, N4, K1, J0-J3, J5, K4, K4b, S3, D1, D2, H6, N6, B1, B2): all run now and all pass on their own assertions. Three further steps in the tail had also assumed the old Esc behaviour, none an engine fault:
  - **H6**: Esc on the revealed checklist then Compose. The composer was already closed by browsing Sent (K5), so it is now "Edit & resend" (new H5b: checklist gone, client open, nothing inert) then Compose.
  - **N6**: three Esc presses to leave. Now one Esc, with new N6b asserting a normal exit.
  - **B1**: assumed the client reopens on the Operator account. It reopens on the last account used (the created freemail account; `_rememberAccount`, lab R1 F11), so new B0 asserts that, that the Operator is listed as reported, and switches to the Operator through the select before B1 and B2 run unchanged.
- No real regression found among the 18.

### bridge-4

Q1 and P1 expect `closeMode === 'close'`. Q4 and P4 now expect the prep to close as `minigame_completed` (success true) with no `minigame_failed` and no `aborted`; Q4 also checks nothing else completed (no person-chat), P4 that no call outcome is written.

### bridge-6

- **SC7**: after the right stop-rule answer, `scope_cards` completes but `stop_rule` stays active and `fairbairn_condition_heard` is false. New steps then talk to Gareth (`converse`, which plays the sign scene and leaves with "I'll leave you to it"), and new SC10 asserts `fairbairn_condition_heard` set, `stop_rule` completed and `scope_cards` still completed.
- **PL1**: objectives order is `disrupt_payroll,how_far_gaps,collect_passwords`. The measures order had also changed and is now asserted as `names,how_far,passwords_collected,did_staff_report` (live probe; matches the authored order in `scenario.json.erb`).
- **PL4**: the four reworded "why" texts from the current scenario (the `bar disruption` check is unchanged).

## Original findings (first run, before the rework)

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

No fixes were made in that run.
