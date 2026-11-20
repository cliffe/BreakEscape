# Step 7 review (R2): the format subsystem made inert at current 0

Counts: blockers 0, majors 0, minors 1, nits 3

Range reviewed: commits 0cac10b5d (R1 nit fixes) and 01ed87d65 (merge-batch 17 fixes) on
branch build/harden-7 (worktree p-harden-7); 745aa006b is a merge of main and carries no step 7
change. Reviewer stance: the load and save path stays safe, and nothing is bent to pass.

## The design change

`before_create :stamp_format_version` now writes nothing while `FormatUpgrade.current` is 0, and
`sync_format_refusal` returns `nil` at once at current 0, reading no `scenario_data`. Both are the
principled dual of the subsystem reading a missing `formatVersion` as 0: at current 0 there is
nothing to stamp and nothing a sync could refuse.

## Guarantees held (confirmations, no finding)

- Too-new / unreadable still refused at load at current 0. `set_game` is unchanged and still calls
  `ensure_current_format!` (game.rb:1231), which calls `version_of` (raises `Unreadable`) and compares
  `stored > cur`; at cur 0 any `stored > 0` raises `TooNew`. The stamping change does not touch this
  path. 409 / header / refusal page all still fire.
- Client guard still works. `set_format_header` (application_controller.rb:62) emits `current` (0); the
  bootstrap's `formatVersion` is `version_of(scenario_data)` = 0 for a game with no key (games_controller.rb:305),
  so held == header and nothing reloads. A too-new game never boots (loaderror -> showBootstrapRefusal).
- Step 8a (current becomes 1): a game created at 0 has no key, `version_of` reads it as 0, so
  `ensure_current_format!` sees `stored 0 < cur 1` and upgrades. The upgrade runs inside `with_lock`
  with a reload-and-recheck (game.rb:1236-1246). An old client syncing a too-new game is refused
  correctly at current 1 (the `noop_steps` sync tests prove the 409 and header '1'); a game below
  current is synced and upgraded on the next load, as the comment states.
- Not stamping at 0 leaves hand-set `scenario_data` byte for byte, which is what the two loader tests
  (`access_model_loader_test`, `npc_habits_loader_test`) require.

## Minors

- m1. `test/controllers/break_escape/capture_proofs_test.rb:74` (`count_scenario_loads`), asserted at
  :387. Once step 8a makes current 1, `sync_format_refusal` runs its pluck on every sync:
  `SELECT jsonb_typeof(scenario_data -> 'formatVersion'), scenario_data ->> 'formatVersion' FROM "break_escape_games" ...`.
  The counter matches any `SELECT` that includes the substring `scenario_data` and no `*`, so this
  pluck counts as a scenario load and the `assert_equal 0, loads` ("no scenario_data query when the
  request brought no new phish evidence") will fail the moment current goes non-zero. The build log
  handover flags this and asks for a decision. Recommended fix: accept the pluck and narrow the counter
  to the full-column load only, changing line 74 from `sql.include?('scenario_data')` to
  `sql.include?('"scenario_data"')` (the quoted column). The full-blob load selects
  `"break_escape_games"."scenario_data"` (quoted), the pluck uses the raw, unquoted `scenario_data -> ...`,
  so the quoted test excludes the scalar pluck. This is exactly the distinction
  `reload_persistence_test.rb:841` already draws (`refute ... include?('"break_escape_games"."scenario_data"')`).
  A dedicated `format_version` column is cleaner but needs the user's go-ahead for a migration (agents
  run none); per-request caching of the version is more fragile than the one-scalar pluck. Narrow the
  counter.

## Nits

- n1. `tools/playtest/swap-scenario-game.rb:56-57`. The comment "the first `g.save!` below is a create
  and runs `before_create :stamp_format_version`, which stamps current" is now inaccurate at current 0:
  `stamp_format_version` returns early and stamps nothing while current is 0. Behaviour is still correct
  (the override is written by the second `save!` overwriting `scenario_data` with `sd`), so this is the
  R1 n3 comment re-staled by the inert change. Doc-only; reword to "stamps current only once current is
  non-zero; at step 7 it stamps nothing and the override is written by the second `save!`".
- n2. `docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md:448, 578-579`. The plan still says the server
  "stamps every game" at creation and "a `before_create` stamps CURRENT if the field is absent". The
  implementation no longer stamps at current 0 (equivalent via `version_of` reading a missing key as 0).
  Update the wording when step 8 lands: nothing is stamped while current is 0; a game is stamped by the
  first step that raises current. Doc-only.
- n3. `app/controllers/break_escape/games_controller.rb:2038` (`sync_format_refusal`). Skipping the sync
  check at current 0 is correct and acceptable, but it makes the sync path asymmetric with `set_game`:
  a game hand-edited to a too-new or unreadable version mid-session (the open-tab case) has its syncs
  accepted at current 0, while a fresh load still refuses it. Unreachable for real games (none is ever
  too-new at current 0) and documented and tested (`sync_state does not refuse a too-new game at current
  0`), so it is a sound trade, not a defect. No change needed; noted as the small defence-in-depth
  reduction the design accepts.

## Tests changed: sound, not bent

- `format_version_test.rb`. The old `creation stamps current (0 in step 7)` is replaced by two tests:
  `creation at current 0 writes no formatVersion and the version reads as 0` (asserts the key is absent
  and `version_of` reads 0) and `creation stamps current once current is non-zero` (stubs a one-step
  list, asserts the key is stamped 1). The two sync-refusal tests now wrap the `put` in
  `FU.stub(:steps, noop_steps)` and assert header '1' instead of '0', because the sync check is inert at
  current 0; a new `sync_state does not refuse a too-new game at current 0` pins the inert path. These
  track the deliberate behaviour change and add coverage of both the inert and the non-zero path. Sound.
- `reload_persistence_test.rb:838-840`. The save-query count drops from 2 to 1 because the inert sync
  check issues no pluck at current 0. The comment states the honest count and that a landed step adds one
  jsonb-scalar pluck (never the blob). Sound, not bent.

## Tests run (test-lock rule, targeted files, RBENV_VERSION=2.7.8, BREAK_ESCAPE_FORMAT_TEST_STEP=1)

`format_version_test`, `format_upgrade_test`, `reload_persistence_test`, `capture_proofs_test`,
`access_model_loader_test`, `npc_habits_loader_test`: 155 runs, 629 assertions, 0 failures, 0 errors,
0 skips.
