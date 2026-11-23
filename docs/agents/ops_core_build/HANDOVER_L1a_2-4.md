# Handover L1a build items 2 to 4 (ops log helper): written, NOT yet run

STATUS: all code and tests are written and rubocop-clean, but no test has run. The shared test lock
is deadlocked: pids 3889866 (`flock tests.lock bin/ops-golden-compare`) holds it and its child 3889868
(`flock tests.lock bin/rails test test/lib/ops_unchanged_replay_test.rb`) waits for it. `bin/ops-golden-compare`
takes the lock itself, so wrapping it in `flock` again self-deadlocks; run it WITHOUT an outer flock.
Kill 3889866 (my kill was refused by the permission classifier), then run the proofs below.
Nothing is committed except this note.

## Files (uncommitted, by explicit path)
- lib/break_escape/ops_log_events.rb: EVENTS (empty), KINDS (door object pc jack ap account npc card
  foothold), `OpsLogEvents.problems` (13.5 spec checker, reusable by the validator).
- app/models/break_escape/ops_log.rb: concern, `write_log_row!`, Result, checks, guard, once/save counter,
  merge, eviction, clamp (`OpsLog.sources_for`), `log_rows_for`, `ops_log_elapsed_ms`, secret registry
  (`register_secret_source`, `with_secret_source(name, lambda)`, `note_issued_secret`, `Current`),
  matcher `find_secret_hit`, `with_clock`, `with_guard`, `with_events` (test overlay), L1a secret sources.
- app/models/break_escape/game.rb: one line, `include OpsLog` (first in the list so NpcFrustration::EVENTS keeps its lookup).
- test/support/ops_log_assertions.rb: `assert_ops_log_holds_no_secret`.
- test/models/break_escape/ops_log_test.rb: spec tests plus the helper tests.

## To do next
1. `flock /home/deploy/BreakEscape/tmp/tests.lock bin/rails test test/models/break_escape/ops_log_test.rb`; fix failures (never run).
   Unknowns: `create_access_game` (prepare_scenario_data!) may drop `logSources`, `capture_holder` or `credentials`
   keys from the fixture; `login_scope_of` on a safe's contents; Ruby 2.7 syntax.
2. `bin/ops-golden-compare` (no outer flock), `bin/rubocop` on the files, access_model_* controller tests.
3. Commit items 2, 3, 4 (messages "Ops log L1a: ...").

## Departures and gotchas
- Tests use a thread-local overlay (`OpsLog.events/kinds`, set in test setup), not a stub of the constants; EVENTS stays empty.
- One switch, `OpsLog.with_guard(bool)`: on = failed checks and secret hits raise (Malformed / SecretInRow, both ArgumentError); off = production behaviour (warn, nil).
- Placeless row with a source that has a `where` filter is not taken (plan silent).
- Typed username: `cut: true` is also set when control characters were stripped (plan test needs it).
- A plain merge into a row marked `p` does not refresh `last` (13.2 step 6); only a save_limit merge does.
- Account `as` is stored as the declared username (canonical), not the caller's spelling.
- The `p` / `+` reader display and `log_rows_for_client` are L2a: not built, not tested.
- Clock-stamp (item 5), WITHHELD keys, schema, validator, verify-run: not touched.
