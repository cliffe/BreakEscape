# Fixes review R1 (branch `ops-fixes`)

Verdict: **clean**. No blocker or major findings. Four minor findings follow, two of them about code that was already there before this branch.

Commits reviewed (`git log --oneline main..HEAD`):

- 4983e0df5 verify-run counts ops progress
- 0490a8d27 Playtest tools: swapped games are prepared like new games (habits expanded)
- 624f42310 Server refuses a plug-in on a port that is still hidden
- 075ea5c7c Notes opened from a container are not added to the inventory unless takeable

## Tests run

- `flock .../tests.lock bin/rails test test/tools/swap_scenario_game_test.rb test/models/break_escape/verify_run_ops_progress_test.rb test/controllers/break_escape/network_plant_hidden_port_test.rb`: 7 runs, 0 failures.
- `flock ... bin/rails test test/controllers/break_escape/network_*_test.rb lab_physical_pentest_network_test.rb`: 547 runs, 0 failures. This checks that nothing else changed in the network routes.
- `bin/ops-golden-compare`, run outside flock: 45 runs, 0 failures.
- `bin/test-js` on `container-*`, `note*` and `capture-log`, with Node 22 (`/usr/bin/node` is v10 and fails every file): 13 files pass. `capture-log.test.mjs` fails ("secret is masked until /capture_secrets answers"). It fails the same way on `main` in a clean worktree, so the failure is older than this branch and does not come from the note fix.

## Per commit

### Swapped-game preparation (0490a8d27): correct

`swap-scenario-game.rb` now calls `inject_player_preferences(scenario_data)` and then `prepare_scenario_data!`. That is the same order as `Game#generate_scenario_data`, and nothing follows those two calls there. `prepare_scenario_data!` is idempotent. The format version is stamped on `sd` before the swap, so it matches `stamp_format_version` on a fresh game. The new test checks that the swapped game's `scenario_data` equals a fresh game's. Only the tool changed, so games already created are not touched. The PLAYTEST.md note is documentation only.

### Non-takeable notes (075ea5c7c): correct

`noteWasTakeable` is captured when `containerState` is built. That happens before `handleObjectInteraction` runs, and `interactions.js` clears `scenarioData.takeable` on that same object (line ~2163). So a takeable note still records `true` and is still added. The guard is `!== false`, so the other `pendingContainerReturn` setters, which have no such key, behave as before. The new JS test covers both cases.

### Hidden-port refusal (624f42310): correct

A jack whose `revealOnGlobal` is not `=== true` in `frustration_globals` (scenario defaults merged with the live `player_state['globalVariables']`) gets the same `:forbidden` response with `{ success: false, reason: 'unreachable', error: 'Jack not reachable' }` as an unreachable jack. The check runs before any write. It matches the client rule `isGlobalTrue` in `rooms.js`, which is strict `=== true`. Unplug, access points and every other route are unchanged. The test asserts that the status and body are identical to the locked-room refusal. In the current scenarios, no object with `networkJack: true` has `revealOnGlobal`, so no shipped mission behaves differently.

### verify-run (4983e0df5): correct, with one small output change

The six counts are read from the real state shapes: `opsDiscovered.networks/hosts/services` arrays, the `opsFindings` hash, the `gainedFootholds` array (which only grows), and `opsLog` rows per source. Entries that are zero are left out, so a game with no ops work prints the same VERDICT lines as before. Bad values count as 0. Every `opsLog` row writer I checked runs after a player request (sign-in, badge swipe, lock, logout, share, helpdesk, MFA, ops routes), so the rows are evidence of play.

## Findings

- **minor**: `tools/playtest/verify-run.rb` changes one BOOTSTRAP ONLY explanation line: "...or submitted a flag." became "...submitted a flag, or did any ops work.". The brief asked for the output lines to stay unchanged. No tool parses this line; it appears only in old reports. Either revert the wording or accept it. The new line is also longer than the lines around it.
- **minor**: the comment above `signals` in `verify-run.rb` still says that only rooms, opened objects and flags can come from playing. It should mention ops work.
- **minor** (test): `network_plant_hidden_port_test.rb#snapshot` slices `networkFootholds` and `logRows`, but neither key exists. The real keys are `footholds` and `gainedFootholds`, so the "no state change" assertion is weaker than its name suggests. `inventory` and `opsLog` are checked correctly.
- **minor** (pre-existing, not introduced here):
  - In `returnToContainerAfterNotes`, a non-takeable note is still removed from the container's displayed list and `contents` after it is read, and the "note added" notice is still shown, because the notepad did gain it.
  - A takeable note is added twice: once by `interactions.js` and once by the container return.

  The server handles both cases. They are not changed by this fix.
- **minor** (theoretical): the server reads the reveal global from its own copy. A jack revealed by a global set only on the client could be refused until the next sync reaches the server. No shipped scenario has such a jack.
