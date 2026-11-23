# Handover L1a build item 1: the unchanged-scenario golden mechanism

Done (plan OPS_LOG_ROWS_PLAN.md sections 10, 11 "Golden helper, L1a", 12 item 1). No engine file edited.

## What was built
- `test/support/ops_golden.rb`: `OpsGolden` (play a fixture through the real routes under a frozen
  clock, scrub the game id, compare with the two normalisations). Fixture format is in its header.
- `test/support/ops_unchanged_cases.rb`: the scripts (scenario, playerState, steps) behind each fixture.
- `test/fixtures/files/ops_unchanged/log_unlock_refusals.json` (/unlock pin, rfid door and object cases,
  then /login refusals up to lockout) and `log_container_cases.json` (/container before and after a
  sign-in, locked and opened safe, profile folders, invented id), each with a bootstrap before and
  after, both captured on unmodified main code. Scenario is `AccessModelScenario.routes_scenario`, built
  by `create_access_game` as the controller tests build it.
- `lib/tasks/ops_unchanged.rake`: `ops:unchanged:capture` (`bin/rails app:ops:unchanged:capture`,
  `ONLY=name` for one). It shells out to `test/lib/ops_unchanged_capture_test.rb` in RAILS_ENV=test under
  the shared lock; no `db:` task, no development database. How to add a fixture is in its header.
- `bin/ops-golden-compare [name ...]` replays fixtures (`test/lib/ops_unchanged_replay_test.rb`, under
  the lock); `bin/ops-golden-compare --diff A.json B.json` compares two files.
- `test/lib/ops_golden_compare_test.rb` (helper spec, 12 tests), `ops_unchanged_replay_test.rb` (one test
  per fixture), `ops_unchanged_capture_test.rb` (skips unless OPS_UNCHANGED_CAPTURE is set).

## Capture and replay
- Capture (unmodified code only): `bin/rails app:ops:unchanged:capture`. Replay: `bin/ops-golden-compare`.
- Run from /data/be-ops-core with no BUNDLE_PATH set (gems are the system gems; main's config says
  BUNDLE_PATH__SYSTEM). Setting BUNDLE_PATH to vendor/bundle fails (timeout-0.6.1 not found).
- Never recapture to silence a diff.

## Gotchas
- `git rev-parse --path-format=absolute` is not supported by the installed git; the lock path is derived
  from `--git-common-dir`.
- Rails 7.0 forbids nested `travel_to` with a block, so the "different wall times" spec sleeps 1.1 s
  between two plays instead of shifting the clock; `play` freezes at the fixture's `clock`.
- The cases avoid randomness (no `/login` claim: jake_pc has `lockChance`).
- Fixture scenarios are inlined, so editing `AccessModelScenario` later does not change a captured fixture.
- Strip normalisation is one way: a default key empty live and absent from the fixture is dropped;
  a default key the fixture holds must match.

## Next
Steps 3 to 5 edit `app/models/break_escape/game.rb` (and `network_access.rb`, `games_controller.rb`);
the next builder is whoever the orchestrator assigns to L1a build item 3 onwards. Run
`bin/ops-golden-compare` after each such edit; both fixtures must stay green.
