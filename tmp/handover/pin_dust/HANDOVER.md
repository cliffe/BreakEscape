# PIN dust action: handover

Branch build/pin-dust-action, worktree .claude/worktrees/p-pin-dust.

## Done (committed)
- Server: app/models/break_escape/pin_dust.rb (concern, included in Game), POST pin_dust (route, controller, policy pin_dust?), player_state 'pinDusted' {lockKey=>digits} server-only (ACCESS_STATE_DEFAULTS). Keyed on item type `fingerprint_kit` (server-side non-forged inventory check). Peek (apply false) restores after reload; apply true dusts once per lock.
- Client: pin-minigame.js (Dust button, greyed keys, restoreDust, test-state fields dustAvailable/dustDigits/greyedKeyDigits; helpers exported, no new imports so no harness copy-list change), minigame-starters.js, doors.js (dustable/dustHint on doorProperties), api-client.js pinDust, css/pin.css.
- Tests: test/js/pin-dust.test.mjs (16 pass), test/controllers/break_escape/pin_dust_test.rb (+ policy_test DEVICE_ACTIONS), all pass.
- Scenario scenarios/test_pin_dust (vault door 4172, wall_safe 3883 with dustHint, clean_safe dustable false, kit + cracker on lobby table); validator 0 errors.

## Open
1. validate_scenario.rb: dustable/dustHint give "unknown field" warnings on objects (and rooms); add them to the known fields and a check_pin_locks rule (dustable boolean, dustHint string, only on pin locks). Also DOOR_ENTRY_LOCK_FIELDS (line ~6809) should list them.
2. README_scenario_design.md: document `dustable`/`dustHint` where PIN locks are (lock table ~line 678, tool table line 1591 fingerprint_kit/pin-cracker rows); say the cracker combination: greyed keys take no input so the cracker's search space is automatically the dusted digits only (independent otherwise).
3. Full bin/test-js was started once and not read (run `bin/test-js` in the background, check CSS tests like minigame-text-crisp-css).
4. Live proof (not done): keyless server from the worktree on :3082 (see memory worktree-live-proof-3002; no db create/migrate), fresh game in test_pin_dust, headless setFPS(20) fixed steps; screenshots before/after dust, reload persistence, no Dust button without the kit, dustable false pad. Sound: uses playUISound('item') on dusting.
5. Run wider Rails tests touching unlock/games_controller (e.g. games_controller_test, policy tests).

## Update (agent 2): items 1-4 done, then R1 review arrived

Commits after 5db7881f4: 70e1f4d99 (validator, schema, README, validator test), then schema duplicate-key fix, 631ec9abe and 7365558ac (server fix below).

1. Validator: dustable/dustHint in scripts/scenario-schema.json (rooms and objects share one properties block; do not add twice, it gave a JSON duplicate-key warning), DOOR_ENTRY_LOCK_FIELDS, check_pin_locks (type errors on PIN locks, warning on non-PIN locks). Test: test/js/validator-pin-dust.test.mjs (4 pass).
2. README_scenario_design.md: lock table pin row, fingerprint_kit and pin-cracker rows. Wording still says dust is default-on: B1 (opt-in) means rewrite it.
3. Tests: games_controller_test 64/0, unlock tests 14+3+7+4 all 0 failures, policy_test 38/0, pin_dust_test 12/0. bin/test-js: 762 pass, 1 fail (minigame-pixel-art.test.mjs). It passes when run alone (48/48), so it failed under load or on a file that moved during the run; rerun bin/test-js on its own before treating it as real.
4. Live proof found a real bug: the pad sends targetType 'item' for a safe (not 'object'), the server answered 404 for every dust. Fixed server-side: any non-door target is an object (same as unlock). Helper tests used 'object' and missed it. Live proof then passed on :3082 (server and session stopped by PID; port free), game 8267, test_pin_dust. Needed `rails db:seed` once to register the mission (273).
   Screenshots in scratchpad/pin-dust/: 01 no kit (no Dust button), 02 before dust, 03 after dust (wall_safe 3 and 8 lit, rest greyed, hint shown), 04 after reload (still greyed, restored via peek), 05 clean_safe (no button, ApiClient.pinDust refused 422), 06 cracker plus dust (typed 5,3,3,7,8,8: greyed 5 and 7 ignored, 3388 gave 2 right place 2 right number), 07 vault door dusted (1 2 4 7 lit). Greyed key click adds nothing. Note 03 shows a stale "The dust does not take." message left from the earlier 404s.

## Open: R1 review fixes (scratchpad/reviews/pin-dust-R1.md, B1 M4 m7), ruled by AC0
- B1: dust becomes OPT-IN. Needs `dustable: true` on the lock (room for a door). Absent or false: no button, server 422. Reason: m05-m08 and biometric_breach have a kit, no cracker, clue/VM-gated PINs, guess limit resets on reopen. Update test_pin_dust (true on vault and wall_safe; clean_safe absent or false), the validator rule, README, server (pin_dust.rb `lock['dustable'] == false` becomes `!= true`), client (`this.dustable = params.dustable === true`), JS and Rails tests.
- M1: carry dustable/dustHint through the bootstrap room whitelist (game.rb ~2373) so doors see them; dustHint only after dusting if cheap, else note as m2.
- M2: stretched 10x24 kit icon (pin.css ~640-644): keep native aspect, never resize.
- M3: Rails tests for sign-in-scope and route-room gates: same 404 body, pinDusted unchanged.
- M4: cracker+dust JS test runs a real attempt and checks the pips.
- m1 clear typed digits on dust; m3; m4 use the 8px grid; m5 key the record by canonical lock id; m6 hostile-input, growth and other-user tests; m7 document only.
- Then rerun tests and redo the live proof (recipe above; fresh game; setFPS(20) with fixed steps on).

## Update (agent 3): R1 fixes done, proofs open
Commits: opt-in/M1/M2/m1/m3/m5 + validator + README + scenario; JS tests; "apply only on a real true; test fixes".
Done: B1 (server `dustable == true`, client `=== true`, scenario vault+wall_safe true, clean_safe false, plain_safe in Rails fixture), M1 (bootstrap whitelist dustable/dustHint, room schema), M2 (width auto, 24px tall), M3, M4 (real cracker attempt in pin-dust.test.mjs), m1, m3 (restore without kit, no button), m4 (already 8px), m5 (canonical lock id key), m6 (hostile, growth, other-user; controller apply only on true/'true'), stale message cleared, validator warns (dustHint without dustable; 1 repeated digit). m2/m7 doc only: not yet written into README (dustHint is client-readable; doors have no reach gate).
Tests: pin_dust_test 22/0 after fixes; earlier run policy_test + games_controller_test had only the 2 pin_dust failures since fixed; pin-dust.test.mjs 20 pass, validator-pin-dust 6 pass. bin/test-js full run was started (log scratchpad/pindust-js.log, 763 files), result not read.
Open: read pindust-js.log (check minigame-pixel-art); live proof: driver scratchpad/pd_drive.py (needs playtest-session args fixed: it has no --log flag, drop it; use cwd for session.jsonl). Server on :3082 was started and stopped by PID; game 8315 (test_pin_dust) is unused. Save v2_*.png into scratchpad/pin-dust/. Add m2/m7 doc lines to README.
