# Habits validator gaps: code review round 2

Branch `build/habits-validator-gaps`, whole `git diff main...build/habits-validator-gaps` (merge base `708b154e8`, head `a773a1f12`). Read fresh, without the round 1 review.

Counts: 0 blockers, 0 majors, 3 minors, 5 nits.

## What was checked

- `doorway_problem` against `calculateDoorPositionsForRoom` and both `find` calls in `createDoorSpritesForRoom` (doors.js:328-384, 493, 564): four directions, a string or list under `connections`, strict equality on `connectedRoom` and `direction`, first entry per doorway wins, a disabled gate on the first entry still shadows (door-gates.js declines it at register). These match.
- The bootstrap filter (`Game#filtered_scenario_for_bootstrap`, game.rb:844-894) keeps no `doors`, so `lockProps` in doors.js:497 is always `{}` in Rails play and every lock field comes from the connected room. The gate comes only from `/room/:id` (`fullRoomData`, doors.js:564). `validate_unlock` (game.rb:2239 onward) reads `room_data(target_id)` and never a door entry. So "door-entry locks are not soft-locks" holds.
- `locked == true`: interactions.js:477 and 1724 open an object lock on `locked === true`; doors.js and the server lock a room on a truthy `locked`. The schema types both `locked` fields as boolean (scenario-schema.json:4002, 4918), so the stricter test loses nothing.
- `other_requiring` walks everything outside rooms, door entries and `room_objects` (which already covers object contents and NPC `itemsHeld`), so a start item or top-level lock lands in the object gap. The removed "the locked room" fallback is now covered by that walk; door entries drop out on purpose.
- `expand!`, the habits report and the graph all drop dead gates through `gate[:doorway]`; `validate_npc_habits.rb:178` then reports `holdsDoors` false with no gate for a guard whose only gate is dead, next to the dead-gate warning. That is accurate.

Validator on all 175 `scenarios/**/scenario.json.erb`, merge-base validator against this branch's validator on the same files: 1135 ❌/⚠️ lines each, no line added or removed in any file. No shipped scenario has a dead gate, a door-entry `locked`/`lockType`, or a start-item rfid lock, so the change neither adds false positives nor drops true positives there.

Probes on a copy of `test_gate_tailgate` (scratchpad, not committed): `locked`, `lockType` on the gate entry warn twice as intended; a missing `direction` gives the dead-gate warning; a gate-entry `requires` different from the room's draws nothing (minor 1); `null`, `"x"` and `"North"` entries stop at schema validation (minor 2).

Tests: `bin/rails test test/unit/npc_habits_test.rb` 32 runs, 135 assertions, 0 failures; `node --test test/js/door-gates-validator.test.mjs` 31 pass; `test/js/dungeon-graph-habits.test.mjs` plus `dungeon-graph-identities.test.mjs` 13 pass.

## Minors

### Minor 1: door-entry `requires` (and every other lock field) is just as dead, and a mismatch is silent

scripts/validate_scenario.rb:6326-6334. The comment says `requires` "on a gate entry names the gate's card". It does not. door-gates.js:251 and 290 take `requires` from the door's `doorProperties`, and doors.js:527 fills that from `lockProps.requires || connectedRoomData.requires`, where `lockProps` is always empty in Rails play. The gate's card is the room's `requires`. Shipped gate entries (test_gate_tailgate:51, lab_physical_pentest:1177) repeat the room's value, which is why nothing breaks today. An author who writes a different card on the gate entry than on the room gets no warning, and the gate opens for the room's card. The same goes for `keyPins`/`key_pins`, `difficulty`, `lockedHint`, `acceptsUIDOnly`, `biometricMatchThreshold` and the pad options (`maxAttempts`, `passwordHint`, `showHint`, `postitNote`, `showPostit`, `showKeyboard`, `pinLength`): doors.js reads each from `lockProps` first, and none is ever there. The probe with `keyPins` on the entry drew no warning.

Fix: correct the comment (the gate's card is the room's `requires`; the entry's copy is never read). Warn on `requires` only when it differs from the room's, comparing `Array(x).map(&:to_s).sort`, so the shipped duplicates stay quiet: "'rooms/A/doors[i]' requires X but room 'B' requires Y; the gate and the door use the room's". Extend the unused-field loop from `%w[locked lockType]` to the lock fields above. Add a test for the mismatch and its mirror (same value, no warning) in test/js/door-gates-validator.test.mjs.

### Minor 2: the "not an object" error and the "North" branch never run from the command line

scripts/validate_scenario.rb:6317-6323 and 6350-6355. The schema types each `doors` item as an object with `direction` in a lower-case enum (scenario-schema.json:4006-4010). A `null`, a string or `"North"` fails schema validation, and the script stops there, before `check_access_model`. The new error and the "not north, south, east or west (lower case)" wording are reachable only from a harness that calls `check_access_model` directly, which is what test/js/door-gates-validator.test.mjs:333 and :436 do. The error text is also wrong for anything but `null`: `"x".connectedRoom` is `undefined` in JS, so doors.js:564 skips a string entry; only `null` (or `undefined`) throws.

Fix: say in both test comments that the schema catches these first and the test covers the harness path. Either drop the error (the schema owns it) or narrow it: an error for `nil` ("doors.js throws reading connectedRoom on null"), a warning that a non-object non-null entry is skipped. Keep the `:no_direction` "missing direction" branch, which is the reachable one.

### Minor 3: the dungeon graph change has no test

scripts/generate_dungeon_graph.rb:487. `next if entry[:doorway]` only matters for an authored `noHold` (expand! no longer fills a dead gate), and no test reaches it. Fix: in test/js/dungeon-graph-habits.test.mjs, next to the case at line 141, add a gate with an authored `noHold` on an entry with no `direction` and assert the `door_store_a` label has no "gate:" part; mirror with `direction: 'north'` and assert the label is back.

## Nits

1. lib/break_escape/npc_habits.rb:221: `index:` is added to every gate entry and nothing reads it (the validator calls `doorway_problem(room, i)` itself). Drop it, or use `entry[:index]` where the validator rebuilds the path.
2. test/js/door-gates-validator.test.mjs:346: the assertion that the side-gate warning is absent is vacuous, because the entry is moved to `south`, which never draws it. Use `east` with no matching connection, so the test proves the dead-gate `next` replaces the side-gate warning, or drop the line.
3. lib/break_escape/npc_habits.rb:245-247: doors.js:333 skips a falsy `connections[dir]`, so `"north": ""` builds no doorway, but `doorway_problem` reads `[""]` and calls an entry with `connectedRoom: ""` live. Treat a non-array value as `[]` when it is `nil` or `""`. No scenario does this.
4. scripts/scenario-schema.json:4005: "Per-door overrides for this room's doorways" now contradicts the validator. Reword to say the entry carries the gate; lock fields belong on the room the door leads into.
5. scripts/validate_scenario.rb:6331 "play never reads": true for Rails play. The legacy standalone path (core/game.js:1602-1621) loads a raw `.json` scenario, and there doors.js:493 does read `lockProps`. Current scenarios are all `.json.erb`, so this is wording only; "the game never reads ... (the bootstrap scenario has no doors)" would be exact.
