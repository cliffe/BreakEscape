# Handover L2b (ops log seed rows and anomalies): all six work points DONE

Branch `ops-logs`. No browser run (a separate tester does the PLAYTEST beats 14 to 19).

## Commits
1. `1bed4cf2e` schema `seedRows`, validator checks, node tests
2. `e894aeef2` seed rows in the reader, controller tests
3. `93cff8c26` the anomaly and the server-judged flag, controller tests
4. `ba8adf534` the viewer's flag flow, `ApiClient.logFlag`, node tests
5. `5927c8f22` graph note node, node tests
6. `e1829f45a` scenario night log, PLAYTEST beats 14-19, leak-check rules (R4-1, R4-2), scenario and scanner tests, docs

## Departure from the plan (orchestrator's direction)
The plan (section 7) has the client check the flag. This build judges it on the server: a new route
`POST /games/:id/log_rows/flag` (`config/routes.rb` after `get 'log_rows'`; `GamePolicy#log_flag?` = `show?`; in
`set_game` and `with_game_lock` lists, each on its own added line). The plan carries an "L2b ruling" paragraph after
section 7's last sentence.

## Seed row shape
`logSources.<id>.seedRows[]`: `{ id: "s1".."s999", at: "[Day ]HH:MM", event, result, as?, where?, detail? }`. `as` is an NPC id (shown by
the NPC's name) or, for a `signin_*` event, a plain username (shown in normalised form). Answer row: the same seven keys with
`at` for `elapsedMs`, authored `id`. Built by `ops_log_client_seed_row` (`app/models/break_escape/ops_log.rb`), never
through `ops_log_client_as` / the `flagged` rule; seed rows come first, then play rows; no cap, no `xN`, no `+`. A malformed entry in a
live snapshot is skipped (`ops_log_seed_rows`). Validator: `scripts/validate_log_rows.rb` `log_check_seed_rows` (line ~169) and
`log_check_anomaly` (~140). Seed rows need `gameClock.start`; rows ascend, end at or before it (day arithmetic mod 7).

## How the anomaly is judged and what each answer reveals
- Browser copies: `OpsLog.strip_reader_judgement!` (called from `filter_requires_recursive` in the controller, and
  `filter_inventory_for_client!`, `filter_requires_and_contents_recursive` in `game.rb`) drops `flagActions`, `completionActions` and
  `anomaly.rowId` from an `ops_log_terminal`'s `minigameData`; `anomaly` becomes `{}` (the viewer's cue to show the flag control).
- `log_flag` (`games_controller.rb` ~1934): 400 `invalid_object` / `invalid_row` for a malformed id; one 404 `not_found` for an
  invented, non-reader, undeclared or unreached reader (`reached_log_reader`, shared with `log_rows`); then `Game#ops_log_flag!`
  (`ops_log.rb` ~452): wrong row (anything but the reader's anomaly, including a play row, another source's id, an unknown id, a reader
  with no anomaly) -> `{ correct: false }`, nothing written; right row first time -> `{ correct: true, rowId, flagActions,
  completionActions }`, `player_state['opsLogFlagged']` gains the reader id (server-only, never sent), saved; repeat ->
  `{ correct: true, already: true, rowId }`, no actions. No attempt cap.
- `GET /log_rows` adds `flaggedRow: <row id>` only for a reader flagged right (not in the `unchanged` answer).

## Viewer DOM hooks (`ops-log-minigame.js`, CSS `ops-log-minigame.css`)
In the detail pane, only with `minigameData.anomaly` and a selected row: `.ol-flag[data-ops-log=flag]` holding `button[data-action=flag]`
(label `flagActionLabel` or `FLAG AS ANOMALY`), then `button[data-action=flag-confirm]` / `flag-cancel` (disabled while CHECKING),
and `[data-ops-log=flag-note]` with `data-state` confirm | wrong | error | done (texts `FLAG THIS ROW AS THE ANOMALY?` / `CHECKING...`,
`NOT THIS ONE`, `NO SIGNAL - TRY AGAIN`, `FLAGGED`). A flagged row: `tr[data-flagged=true].ol-row-flagged`; none before a right flag.
Actions run once from the right answer via `_runActions` (`set_global`, `complete_task`), even if the viewer closed meanwhile. State:
`_flaggedId`, cached with the answer; `_deny()` resets it.

## Scenario (`scenarios/test_ops_logs/`)
Third source `night_log` ("Night door log", `where.rooms: ["lobby"]` so play never writes to it), four seed rows (dana at office/security; `s3`
`Mon 23:58` is the anomaly), reader `night_log_pc` in the **office** (not security: the L2a test asserts security's readers), task
`l3_flagged_night_swipe`. Validator: 0 errors, 1 warning (the old `maxAttempts` one). `PLAYTEST.md` beats 14-19.
One existing L2a assertion edited: `ops_logs_scenario_test.rb` first test, the `logSources.keys` list now includes `night_log`
(unavoidable with a third source). The L2a viewer test "no row is tinted ... no flag button in this stage" is rewritten (it asserted the
absence of the flag button); the no-tint half stays.

## Leak check (`tools/playtest/lib/access_leak_scanner.rb`)
New `log_row` owners: `log:anomaly_key:<k>`, `log:anomaly_named:flaggedRow` (before a right flag answer in the run),
`log:anomaly_id_pattern:seed|play`, `log:anomaly_order:seed_after_play|not_authored`, `log:anomaly_candidate:single`,
`log:flag_answer_key:<k>`, `log:flag_answers_differ`, `log:anomaly_in_object:<id>:rowId|flagActions|completionActions` (any non-flag
answer). R4-1: detail keys found by `\b(word)\s*[:=]`. R4-2: `log_stored_only_keys` adds the registry's `show: false` keys
(`BreakEscape::OpsLog.events`, so a `with_events` overlay is seen).

## Tests run (all pass, under the lock)
`log_rows_test`, `ops_log_test`, `ops_logs_scenario_test` (19 runs, 204+ assertions), `log_seed_flag_test` (16 runs, 120 assertions),
scanner tests (log_rows 19/114, whole scanner set 189/953), `policy_test`, `ops_scan_scenario_test`, `network_ops_unchanged`: 373 runs, 3367
assertions, 0 failures. `bin/ops-golden-compare` 12 runs pass after each engine edit. Node: `validator-log-sources` 47, `ops-log-viewer`
36, `dungeon-graph-ops-logs` 5 (+ the other 7 graph tests), `ops-unchanged-validator`, `minigame-font-16-default`, the two log-filter
tests pass; `git diff --stat main -- public/break_escape/js/minigames/log-filter/` empty. Rubocop clean.

## Gotchas
- jsonb reorders detail keys (shorter key first): a seed row's detail shows in stored order (`route: ..., method: ...`).
- The viewer cache survives a reopen but not a reload; after a reload the flagged mark comes from `flaggedRow`.
- Merge note: the core stream's edits to `games_controller.rb` lists, `routes.rb`, schema and docs were added as separate lines.
- A source with one seed row and an anomaly warns (the flag has a single candidate); the leak check calls it a finding.
