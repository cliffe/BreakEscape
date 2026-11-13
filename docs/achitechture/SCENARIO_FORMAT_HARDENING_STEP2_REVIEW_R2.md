# Scenario format hardening, step 2: code review, round 2

Date: 2026-11-12. Branch `build/harden-step2` at 793b1f059. Round 1: `SCENARIO_FORMAT_HARDENING_STEP2_REVIEW_R1.md` (0/3/6). Fixes reviewed: 35c7c20fa (code, README, two older tests), df825084c (strict-keys tests), 793b1f059 (build log).

Open: B=0 M=0 m=1 n=3

## R1 findings, checked in the full validator

Each crafted fixture below was run through `scripts/validate_scenario.rb --no-graph --no-lint --skip-ink --no-known-failures` and diffed line by line against the clean base fixture (the test's own `scenario()`), so every line a slip adds is counted, not only schema lines.

| R1 | Status | Full-validator evidence | Test fails without the fix? |
|---|---|---|---|
| M1 | Closed | `habits` with `phishable` and `locksscreen`: two schema lines, nothing from the habits module. screenHabit and printHabit slips: one schema line each. | Yes. Old `validate_npc_habits.rb` alone: strict-keys tests 3 and 4 fail. Old `validate_npc_needs.rb` alone: the same two fail. |
| M2 | Closed | Base fixture (`_why` and `_comment` in every block): no line names either. `screenHabit._old: { lockChance: 'bad' }` adds nothing. | Yes, test 4 (with either old module). |
| M3 | Closed | `pc: 5` in a triggerOnInteract grant_foothold: one schema line (plus validate_network's own `names pc '5'`, a different check). `condition: ""`: one schema line plus the existing empty-condition error. | Yes. Removing `out.uniq` fails test 5 only. |
| m1 | Closed | `ssdi`: hint, no "required" line; validate_network adds `has no 'ssid'`, which README now describes. `od` in role and NPC workarounds: hint, no "required"; validate_access_work adds `do is nil`. | Yes. Removing the swap step fails test 6 only. |
| m2 | Closed (see m1 below) | `_example` and `_draft` grant_foothold slips: no schema line. | Yes. Removing the skip fails test 7 only. |
| m3 | Closed | README line 56 now says one schema line, with the `At` example. | Wording. |
| m4 | Accepted by the orchestrator | Test 8 pins the map-level failure. | n/a |
| m5 | Closed | `comment` in policies: `did you mean '_comment'?`. | Partly: see n2. |
| m6 | Closed | Tests 3 to 8 run the full validator; the corpus test collects render failures. | Yes, as above. |

Method for the "fails without the fix" column: copies of `scripts/`, `lib/` and `test/js/` at 793b1f059 in the scratchpad, one mutant per fix (old module file restored, or one line of the fix removed), then `node test/js/validator-strict-keys.test.mjs`. On the scripts at ff052383b, tests 3 to 8 fail and 1, 2, 9 to 13 pass.

## Fix commits, reviewed fresh

- **Removed hand checks.** `validate_npc_habits.rb` dropped only the unknown-name branch; value checks remain for every name in `NH::HABITS` and `NH::PARAMETERS`. The schema's `npc.habits` lists exactly `locksScreen`, `writesDown`, `password`, `holdsDoors`, `passwordPattern`, `_comment`, with enums or types, so no name loses a value check. `validate_npc_needs.rb` dropped only the two key-list checks; every value check stays. The hand checks covered room NPCs only (`AI.room_npcs`, and `json['rooms'][*]['npcs']` in the needs module), the same records `#/definitions/npc` covers. No sub-block is open: printHabit's one structured value, `fetchAfterSeconds`, is an array checked both by the schema and by `fetch_range_ok?`. Nothing the removed code checked is now unchecked.
- **Damerau (OSA) distance and hints.** Fuzzed every non-`_` key the schema declares anywhere (1244) as an unknown key in each of the 18 closed blocks: old Levenshtein and new OSA give the same suggestion for all of them, so the change adds no new hint between real keys. Every adjacent swap of every declared key in those blocks hints back to the key meant. No unknown key can draw a hint on a declared key that is present, since hints are computed only for keys json-schema rejected.
- **`uniq`.** A formatted line holds the pointer and json-schema's message, so two lines are merged only when the same rule fails at the same place; that is a duplicate, never two problems. On the corpus, no scenario has a repeated formatted schema line before `uniq`, so known-failures counts are unaffected.
- **`_` skipping in the walker.** Correct for notes; one gap, m1 below.
- **Edited older tests.** `npc-office-visuals.test.mjs:570` and `validator-npc-habits.test.mjs:92-103` now assert the module stays silent on an unknown key; every other assertion in both tests is unchanged. The one-line rule is now pinned by strict-keys tests 3 and 4 in a full run, so coverage moved, it was not dropped. df825084c deletes no assertion.

## Findings

### m1. The walker skips a room (or any id-keyed entry) whose id starts with `_`

- **Where.** `scripts/validate_scenario.rb:255` (`next if k.to_s.start_with?('_')` applies at every level, including the keys of `rooms`).
- **Failure.** `rooms: { "_annex": { ... objects: [{ triggerOnInteract: [{ type: "confirm_action", onConfirm: [{ type: "grant_foothold", pcc: "pc9", needsDropped: "stick" }] }] }] } }`, connected from `r1`, is a real room: the schema checks it as a room, the engine loads it (no engine code skips `_` room ids), and the connection warning names it. The `pcc` slip prints no schema line; the only trace is validate_network's indirect `names pc ''`. A typo'd key in a grant_foothold under timers, onConfirm or eventMappings in that room is silent at the schema stage. No corpus scenario has a `_` room id or any non-string `_` value, so nothing changes today.
- **Fix.** Skip `_` keys only where they are notes, not where the keys are ids: walk every entry of `rooms` (and of the other id maps), or, simpler and in line with the later "server ignores `_` keys" ruling, make a room id starting with `_` an error now ("ids may not start with `_`, which marks a note"). Add a fixture with a `_` room id.

### n1. `comments` draws `did you mean 'contents'?` in two blocks

- **Where.** `scripts/validate_scenario.rb:390-395`: the distance hint runs before the `_comment` rule, and `comments` is two edits from `contents` (resources and accountProfiles declare it).
- **Failure.** An author who writes a plural note key is pointed at an item list. The line is still an error, so no slip passes; the hint only misleads. Distance 2 under both the old and new metric, so not introduced by the swap change.
- **Fix.** Check note-like keys (`comment`, `comments`, `note`, `notes`, case-insensitive) for the `_<key>`/`_comment` hint before the distance step.

### n2. The `low == 'comment'` branch is not tested

- **Where.** `scripts/validate_scenario.rb:395`; test `validator-strict-keys.test.mjs:213`.
- **Failure.** Every closed block declares `_comment`, so the `"_#{key}"` branch already answers `comment`; deleting line 395 leaves every test green. The branch matters only for `Comment` or `COMMENT` (and for an open block with no `_comment` property), which no test covers.
- **Fix.** Add `Comment` to the test (expects `did you mean '_comment'?`).

### n3. A value slip in habits, screenHabit or printHabit still prints two lines

- **Where.** `scripts/validate_npc_habits.rb:126-127`, `scripts/validate_npc_needs.rb:396-402` and `:533-538`, against the typed properties in `scripts/scenario-schema.json` (npc.habits, printHabit, screenHabit).
- **Failure.** `holdsDoors: "no"` prints the schema type line and `habit 'holdsDoors' has value "no"`; `screenHabit.lockChance: 2` and `printHabit.forgetChance: "x"` do the same. This predates the branch (main's schema already typed these) and the step's promise covers key slips, so it is not a regression.
- **Fix.** Later step: drop the hand value checks the schema duplicates, or drop the schema bounds and keep the friendlier hand messages. Not needed for step 2.

## Runs

- **Corpus.** All 177 `scenarios/*/scenario.json.erb`, ink on, `--no-graph`, default known-failures list, 6 in parallel with `/usr/bin/ruby3.2`: 177 exit 0; 81 `❌` lines, 81 known, in 13 scenarios; no `stale`, `could not run` or `unknown key` line; m01 to m10 each exit 0 with 0 `❌`. `git status` clean afterwards.
- **Node tests.** No lock (single files, per the test lock rule), `RBENV_VERSION=2.7.8`, plain `node`: the 68 `test/js` files that load `validate_scenario.rb`, `validate_npc_habits`, `validate_npc_needs` or the validator path, 3 at a time: 1099 pass, 0 fail, every file exit 0. `validator-strict-keys.test.mjs`: 14 pass.
- **Sync size.** Validator and tests only; nothing reaches player_state.

Counts: 0 blockers, 0 majors, 1 minor, 3 nits.
