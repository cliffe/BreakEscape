# Handover L2b (ops log seed rows and anomalies): all six work points DONE

Branch `ops-logs`. No browser run (a separate tester does the PLAYTEST beats 14 to 19).

## Commits
1. `1bed4cf2e` schema `seedRows`, validator checks, node tests
2. `e894aeef2` seed rows in the reader, controller tests
3. `93cff8c26` the anomaly and the server-judged flag, controller tests
4. `ba8adf534` the viewer's flag flow, `ApiClient.logFlag`, node tests
5. `5927c8f22` graph note node, node tests
6. `e1829f45a` scenario night log, PLAYTEST beats 14-19, leak-check rules (R4-1, R4-2), scenario and scanner tests, docs

## R1 fix (2026-11-23): the flag is back to the plan
The server-judged flag of `93cff8c26` and its viewer flow were removed after review R1 (`reviews/L2b_R1.md`, "R1 outcomes" table
at its end). Now: `anomaly.rowId`, `flagActions` and `completionActions` reach the browser with the reader (plan section 7); the
viewer checks the flag itself (best effort, like log-filter); no route, policy method, state key or `flaggedRow`. `routes.rb`,
`games_controller.rb`, `game.rb`, `game_policy.rb`, `policy_test.rb` and the plan are exactly their text on main. Fix commits:
`62105c898` (removal, seed-row bound S-1, schema V-1, controller tests), `6c868d7f9` (viewer, CSS, node tests), `06aee2c62`
(leak check), then PLAYTEST, docs and this note. A seed row's id in the answer is its authored id (`s1`), unchanged.

## Seed row shape
`logSources.<id>.seedRows[]`: `{ id: "s1".."s999", at: "[Day ]HH:MM", event, result, as?, where?, detail? }`. `as` is an NPC id (shown by
the NPC's name) or, for a `signin_*` event, a plain username (shown in normalised form). Answer row: the same seven keys with
`at` for `elapsedMs`, authored `id`. Built by `ops_log_client_seed_row` (`app/models/break_escape/ops_log.rb`), never
through `ops_log_client_as` / the `flagged` rule; seed rows come first, then play rows; no cap, no `xN`, no `+`. A malformed entry in a
live snapshot is skipped (`ops_log_seed_rows`). Validator: `scripts/validate_log_rows.rb` `log_check_seed_rows` (line ~169) and
`log_check_anomaly` (~140). Seed rows need `gameClock.start`; rows ascend, end at or before it (day arithmetic mod 7).

## How the flag is checked (viewer, `ops-log-minigame.js`)
`_confirmFlag(rowId)`: wrong pick (`rowId !== anomaly.rowId`, or no row id) -> note `NOT THIS ONE`, nothing marked, nothing run.
Right pick -> `_flaggedId`, `flagActions` then `completionActions` run once through `_runActions` (log-filter's path:
`set_global` through `npcManager.setGlobalVariable`, `complete_task` through `objectivesManager.completeTask`), table and detail
re-rendered, focus on the flagged row. "Done" on a reopen after a reload: the first `set_global` to `true` in `flagActions`, else in
`completionActions` (`_doneGlobal`), true in `window.gameState.globalVariables` -> `_flaggedId = anomaly.rowId`. In-page reopen: the
answer cache holds `flaggedId`. The "Task Complete" toast is held by `notifications.js` while a minigame is open and shows when the
viewer closes (log-filter auto-closes 1.4 s after completion, which is why it seemed to show at once).

## Viewer DOM hooks (CSS `ops-log-minigame.css`)
In the detail pane, only with `minigameData.anomaly` and a selected row: `.ol-flag[data-ops-log=flag]` holding `button[data-action=flag]`
(label `flagActionLabel` or `FLAG AS ANOMALY`), then `button[data-action=flag-confirm]` / `flag-cancel`, and `[data-ops-log=flag-note]`
with `data-state` confirm | wrong | done (`FLAG THIS ROW AS THE ANOMALY?`, `NOT THIS ONE`, `FLAGGED`). A flagged row:
`tr[data-flagged=true].ol-row-flagged` (hatched green, left bar, no radius or shadow); none before a right flag.

## Scenario (`scenarios/test_ops_logs/`)
Third source `night_log` ("Night door log", `where.rooms: ["lobby"]` so play never writes to it), four seed rows (dana at office/security; `s3`
`Mon 23:58` is the anomaly), reader `night_log_pc` in the **office** (not security: the L2a test asserts security's readers), task
`l3_flagged_night_swipe`. Validator: 0 errors, 1 warning (the old `maxAttempts` one). `PLAYTEST.md` beats 14-19.
One existing L2a assertion edited: `ops_logs_scenario_test.rb` first test, the `logSources.keys` list now includes `night_log`
(unavoidable with a third source). The L2a viewer test "no row is tinted ... no flag button in this stage" is rewritten (it asserted the
absence of the flag button); the no-tint half stays.

## Leak check (`tools/playtest/lib/access_leak_scanner.rb`)
Back to the L2a `/log_rows` rules plus R4-1 (detail keys found by `\b(word)\s*[:=]`) and R4-2 (`log_stored_only_keys` adds the
registry's `show: false` keys). No rule about the anomaly, the flag or `flaggedRow`.

## Tests run in the original build (before R1; see the report of the fix for the R1 counts)
`log_rows_test`, `ops_log_test`, `ops_logs_scenario_test` (19 runs, 204+ assertions), `log_seed_flag_test` (16 runs, 120 assertions),
scanner tests (log_rows 19/114, whole scanner set 189/953), `policy_test`, `ops_scan_scenario_test`, `network_ops_unchanged`: 373 runs, 3367
assertions, 0 failures. `bin/ops-golden-compare` 12 runs pass after each engine edit. Node: `validator-log-sources` 47, `ops-log-viewer`
36, `dungeon-graph-ops-logs` 5 (+ the other 7 graph tests), `ops-unchanged-validator`, `minigame-font-16-default`, the two log-filter
tests pass; `git diff --stat main -- public/break_escape/js/minigames/log-filter/` empty. Rubocop clean.

## Gotchas
- jsonb reorders detail keys (shorter key first): a seed row's detail shows in stored order (`route: ..., method: ...`).
- The viewer cache survives a reopen but not a reload; after a reload the flagged mark comes from the done global (it must have been synced).
- Merge: the shared files (routes, controller, game.rb, policy, plan) are identical to main; the schema, the validator and the docs are this stream's only edits there.
- A source with one seed row and an anomaly warns (the flag has a single candidate).

## R2 tidy pass (2026-11-23)
- N-2: a reader that opens with its done global true re-runs the `complete_task` entries of `flagActions` and `completionActions` (constructor, `ops-log-minigame.js`); no `set_global`, no "flagged just now" note. Contract change: opening done is no longer silent for tasks.
- N-1: `validate_log_rows.rb` `log_check_anomaly` warns for an anomaly with no actions and for one whose actions set no global to true.
- N-3, N-5: A24 docs text; N-4: PLAYTEST beat 17 reworded.
