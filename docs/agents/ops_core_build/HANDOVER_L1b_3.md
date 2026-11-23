# Handover L1b build item 3 (test_ops_logs scenario, tests, playtest, docs): DONE

## Built
- `scenarios/test_ops_logs/`: `mission.json`, `scenario.json.erb`, `ink/dana.ink` + `dana.json`, `PLAYTEST.md`, and the three
  generated `dungeon_graph.*` files (other test scenarios commit theirs). Lobby (card copier, sign, Dana with
  creds username/password/card `FIN-DANA-01`), `office` east behind an rfid door (`access: roles finance`), `office_pc`
  (login, no tiles, `corp_default` maxAttempts 5, sticky note). `gameClock` Tue 08:30 rate 1. `logSources`:
  `door_controller` (`badge_swipe`), `signin_audit` (`signin_*`, `session_*`, `where.objects: [office_pc]`). No reader.
- Test: `test/controllers/break_escape/ops_logs_scenario_test.rb`, 7 runs, 56 assertions, pass. It renders the real scenario
  file and drives routes (clone_card, unlock, login, lock_session, logout), reading `Game.find`.
- Docs: README feature index row A24 and `docs/ACCESS_AND_NETWORKS.md` index row plus an "A24 Ops log: write side" section
  (after A17).
- Scenarios are found by folder and no `db:` task is needed, but `test_ops_logs` has no Mission row until it is seeded after landing, so make its game with `tools/playtest/swap-scenario-game.rb test_access_signin test_ops_logs` (brief, "Games").

## Proof (all run)
- Validator: 0 errors, 1 warning (maxAttempts lockout warning on `office_pc`, expected, same as test_access_signin).
- `ops_logs_scenario_test` 7 runs pass; `validator-declared-top-level` and `validator-log-sources` pass; `bin/ops-golden-compare`
  3 runs pass; rubocop clean on the test file.
- `ops_log_test.rb`: 43 runs, ONE FAILURE not from this step: "secret_values holds the L1a secrets..." expects
  `Cred-Value-3318`. The worktree has uncommitted edits by another session to `app/models/break_escape/ops_log.rb`,
  `lib/break_escape/ops_log_events.rb`, `scripts/validate_log_rows.rb`, `test/support/ops_log_assertions.rb`,
  `tools/playtest/verify-run.rb` (I did not touch or commit them). The failure is in that in-progress work. The
  "no scenario outside test_ops_* declares logSources" check passes.

## Gotchas
- A held keycard only counts if the scenario defines it; tests that need a non-admitting card add one to the lobby objects of
  a scenario copy (the real scenario has only Dana's card, copied).
- Right password on a locked session unlocks it and writes a second `signin_ok` (`start_login_session!` via password); it merges into the earlier row, so `n` becomes 2 and no new row appears (R1 M1; the earlier "no row" statement was wrong).
- A PC sign-in needs the office in `unlockedRooms` ("PC not reachable" otherwise).
- Stored `logSources` key order is not declaration order (jsonb): sort in tests.
- PLAYTEST: Lock and Sign out are in the desktop taskbar start panel (`.pc-start-btn`, `#pc-start-lock`,
  `#pc-start-signout`); `mg clickSelector` is documented as scoped to the overlay, so the script gives an `eval` fallback
  for the tester to try if it cannot reach it. The clock check reads `window.gameClock.elapsedMs()` through `eval` (no named
  bridge call exists for it). Not run in a browser by me. Make the game with `swap-scenario-game.rb`, not `new-game.sh` (no Mission row yet).
- Door id for `interact` is `door:lobby->office`; the dialogue choice text to match is "scan your badge".
