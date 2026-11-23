# Handover L1a build items 5 to 8: DONE (L1a complete)

## Built
- Item 5, clock stamp (`app/models/break_escape/game.rb`): `OPS_LOG_CLOCK_REFRESH_MS`; seed in
  `initialize_player_state` (only when `scenario_data['logSources']` is a Hash); refresh line in
  `merge_scenario_clock!` inside the `elapsedMs` branch, gated on `player_state.key?('opsLogClockAt')`
  (refreshes on every valid incoming elapsedMs, including an equal or stale one: the saved value only grows
  but the key still moves; see gotchas); `ops_log_clock_stale?` ORed into `bootstrap_state_needs_write?`,
  `refresh_ops_log_clock!` called last in `run_bootstrap_writers!`. First stored row in a game with no key
  seeds it (`ops_log.rb`, `ops_log_store`, after `return nil if touched.empty?`).
- Item 6: `logSources` in `NetworkAccess::WITHHELD_SCENARIO_KEYS`.
- Item 7: `scripts/scenario-schema.json` top-level `logSources` block (before `networks`; closed source and
  `where`; event name pattern only; no seedRows yet); `scripts/validate_log_rows.rb` (`check_log_rows(json,
  events:, kinds:)`, registry injectable for tests) plus one `run.call` line and one `require_relative` in
  `validate_scenario.rb`; `tools/playtest/verify-run.rb --ops-log <game_id>` (prints rows, runs the helper's
  secret matcher, caps and ordering, exits 1 on failure, a hit shows key path only and the row is masked).
- Item 8 tests below.

## Tests (all run, all pass)
- `test/controllers/break_escape/ops_log_clock_test.rb` 10 runs (seed, sync move, +30 s row stamp within 2 s,
  stale sync, no-key sync with 0 scenario_data loads, bootstrap refresh at 10 s, none without key,
  nothing shipped, first-write seed, check 1 over EVENTS).
- `test/models/break_escape/ops_log_test.rb` 43 runs (added check 2: no scenario outside `test_ops_*` declares
  `logSources`); check 1 already existed there (line ~146) and is extended by the clock test over `EVENTS`.
- `test/models/break_escape/ops_log_verify_run_test.rb` 3 runs; `network_withholding_test.rb` 7 runs (+1).
- `test/js/validator-log-sources.test.mjs` 17 tests (each error and warning, clean fixture, hook, schema pattern).
  `validator-declared-top-level`, `validator-access-model`, `validator-capture-log` still pass.
- Last combined Rails run: 56 runs, 569 assertions, 0 failures. `access_model_*` plus withholding: 131 runs pass.
  `bin/ops-golden-compare`: 3 runs pass (after the game.rb and network_access.rb edits). rubocop clean.
- Validator on `test_access_signin` and `m01_first_contact`: output identical to main's validator copy
  (git archive of main with the worktree's other dirs symlinked) apart from the two path lines.

## Departures and open
- Reader warnings (a source no reader names; a reader whose source records nothing the scenario can produce)
  and all seed-row, anomaly, `ops_log_terminal` and graph checks are L2: not built.
- "Limited places" in the protected-row warning, and the save-counter key count, are approximations from the
  scenario (doors from rooms, object/pc from object ids, npc from NPC ids; other kinds count none).
- The secret-collision warning uses `CaptureModel.hard_access_raw_values` plus NPC passwords, not the full
  helper registry.
- Plan says `GET /scenario` refresh is in `prepare_bootstrap_state!`; it lives in `run_bootstrap_writers!`
  (called by it), as the other bootstrap writers do.

## Gotchas for L1b
- `write_log_row!` needs `as:` and `where:` keywords (nil allowed) and never saves; the call site saves.
- Node here: `/usr/bin/node` is v10; use `PATH=/home/deploy/.local/node-v22.11.0-linux-x64/bin:$PATH bin/test-js <file>`.
- Tests that stub time use `OpsLog.with_clock(ms) { }`; `serverMs` and the key use the same clock.
- The shipped `EVENTS` is still empty: a scenario with `logSources` fails the validator ("not registered")
  until L1b registers events.
- `verify-run.rb --ops-log` is loaded in a test with `load` and `ARGV`; keep its top-level flow stable.
