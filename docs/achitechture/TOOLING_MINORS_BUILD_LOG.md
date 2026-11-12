# Tooling minors build log (q49, 2026-11-12)

Branch `build/tooling-minors`. The user's answer to q49: fix both sets now. Sources: docs/achitechture/TTS_R3_MINORS_REVIEW_R2.md (6 minors, 6 nits) and docs/achitechture/HABITS_VALIDATOR_GAPS_REVIEW_R2.md (3 minors, 5 nits). Tooling only, so no live browser proof.

## TTS (commit a14d5f8fe)

- m1: `scripts/compile-ink.sh` compiles X.json and copies it over X.ink.json when both exist (the 8 `scenarios/test_scenarios/ink` pairs). `scripts/compile-ink.sh test_scenarios` leaves the tree clean.
- m2: `TtsLineExtractor#resolve_ink_path` tries `InkStoryFile.find(story_path, compile: false)` first and keeps its two scenario-folder fallbacks after it. The old `Engine.root.join(story_path)` fallback is gone, so the batch reads what `#ink` serves. Test: a storyPath naming X.json with only X.ink.json on disk is found.
- m3: inklecate runs with `-o` (no `-j`); stdout and stderr both go into the error log, the raised message and the warnings log. Test: a broken divert raises with "Divert target not found".
- m4: compile into `<output>.<pid>.<thread>.tmp`, then `File.rename` into place, inside a per-output-path mutex, with `needs_compilation?` checked again inside the lock. Test: 4 threads on one stale story compile once and leave no temporary file.
- m5: a storyPath must end in `.json` and resolve inside `InkStoryFile.allowed_roots` (default `scenarios/`). `find` takes an `allowed_root:` keyword. `test/test_helper.rb` adds `test/fixtures`, `Engine.root/tmp` and `Dir.tmpdir` to the roots, because the TTS tests keep stories there. The only shipped storyPaths outside `scenarios/` (npc-hub-demo-ghost-protocol, `story_design/ink/*_hub.json`) name files that do not exist, so nothing changes for them.
- m6: `TtsExpectedLines` maps X.ink.json to X.ink (both places). New test `tts_expected_lines_ink_json_test.rb`; it fails on the old code.
- n1, n2: the includes walker moved into `InkStoryFile.includes`. It resolves every INCLUDE against the root story's folder and allows names with spaces. `needs_compilation?` checks the newest mtime of the .ink and its includes, and the staleness test uses the same walker.
- n3: `compiled_json` returns only a `.json` path that is a file.
- n4: a narrator line has its `voice:` marker stripped too, so batch and endpoint agree. No content has one.
- n5: `compile!` has no default output path; `find` passes it.
- n6: no change. `InkTextValidator.canonical` caches its index per file and `placed` flag, and both lookups for a non-host record use `placed: true`, so the second lookup costs one hash read.

## Habits validator (commit 99ada76d5)

- m1: corrected the comment: a gate's card is the room's `requires`. A door-entry `requires` warns only when it differs from the connected room's (compared as sorted strings), so the shipped copies stay quiet. `locked`, `lockType`, `keyPins`, `key_pins`, `difficulty`, `lockedHint`, `biometricMatchThreshold`, `maxAttempts`, `passwordHint`, `showHint`, `postitNote`, `showPostit`, `showKeyboard` and `pinLength` on a door entry warn (constant `DOOR_ENTRY_LOCK_FIELDS`). `access` and `acceptsUIDOnly` stay errors. Tests cover a mismatch and its mirror, a room with no requires, and every field on the entry against the same fields on the room.
- m2: `null` is an error ("doors.js throws reading its connectedRoom"). Any other non-object is a warning that the engine skips it. The test comments say the schema stops the command line first and that the tests cover the `check_access_model` path.
- m3: test in `test/js/dungeon-graph-habits.test.mjs`. A gate with an authored `noHold` and no `direction` gets no "gate:" label; with `direction: 'north'` it gets the label back. No change to `scripts/generate_dungeon_graph.rb` was needed.
- n1: dropped the unused `index:` from `NpcHabits.gate_entries`.
- n2: the side-gate check in the no-connection test now uses `east`, so it shows the dead-gate warning replaces the side-gate warning.
- n3: `doorway_problem` treats `nil` or `""` under `connections[dir]` as no doorway (unit test).
- n4: reworded the schema's `doors` description.
- n5: the warning now reads "which the game never reads on a door entry (the bootstrap scenario has no doors)".

## Tests

- `bin/rails test` (under the lock): 1803 runs, 25610 assertions, 0 failures, 0 errors, 1 skip.
- `bin/test-js -j 3` (under the lock): 507 files passed, 0 failed.
- Validator on all 176 `scenarios/**/scenario.json.erb` files, before and after, with `--no-graph`: no ❌ or ⚠️ line added or removed in any file (106 ❌ lines both times). So there are no new warnings to list for any scenario.

## Open

Nothing from the two reviews is left open.
