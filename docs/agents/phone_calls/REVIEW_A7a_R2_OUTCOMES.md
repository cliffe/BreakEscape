# A7a review round 2: outcomes

Fixer, 2026-11-12. Files: `scripts/validate_phone_calls.rb`, `scripts/ink_runtime_check/dialoguelint.mjs`, `test/js/validator-phone-calls.test.mjs` (28 tests), `test/js/dialoguelint.test.mjs` (54). Every new test failed against the old script before the fix, except the m2 plumbing tests; those were checked by mutation (each of five `home` removals fails a test).

| Finding | Status | Where and test |
|---|---|---|
| N1 call promises | Fixed | `CALL_PROMISE` (`call/ring/phone [me] anytime/whenever/if/when/once`), `phone me`, and from the orchestrator's R3 note `call/ring/phone back` and `call it in`. A match inside `CALL_NOUN` ("your call if") or `SELF_RING` ("I'll ring when", "I'll call back") is excused for the promise pattern only; "call me" still warns as before. Test N1 (positives, negatives, choice text, contact with a `call` entry). |
| N2 undeclared `globalVars.X` | Fixed | `call.when`: error; mapping/timedConversation `condition` on a ring or phone-chat mapping: warn. Known names: `globalVariables`, `importGlobals` names, `importedGlobals` keys, any `setGlobal` key, `#set_global:` tags in any contact's ink. Says so when X is an ink VAR. Tests N2 (two). |
| N3 "The line stays quiet" | Fixed | `the line (stays/goes/went/falls/fell) (quiet/silent/still)` and `you read it back/out to her/him/them`. "Line's open" left alone. Test N3. |
| m1 spread stops only at home | Fixed | `callKnotSet` also stops at every knot the home knot reaches. Test m1. |
| m2 `home` untested | Fixed | Tests for `lintInk`, `structureFindings`/delivery checks, `scenarioInfo` (currentKnot before and after storyPath) and the CLI `lintTargets` path. |
| m3 INCLUDE'd functions | Fixed | `function_names` also takes the `f()` diverts of the compiled ink. Test with a function in an included file. |
| m4 empty `npcIds` | Fixed | Unlisted-contact warning skipped when the list is empty. Test. |

## Carryover global names (N2 exemption)

`m\d\d_` is not the rule. `app/models/break_escape/carry_over.rb` writes imported names into `scenario_data['globalVariables']` at game creation, from the scenario's `importGlobals`. The name is `completed` if the entry has it, else `as`, else `(m|sis)NN_` + `var` (`CarryOver.import_name`; `tts_line_extractor.rb:55-65` reads the same). `completed` names such as `m06_completed` fit a prefix, but `as` can be anything, and a name that merely starts `m05_` is not imported. The validator mirrors `import_name` over the scenario's `importGlobals` instead of a regex; test "carryover" covers `var`, `as` and `completed`, and a lookalike that is not imported still errors. No SecGen XML was opened.

## Reruns

Baseline update: `A7_VALIDATOR_BASELINE.md`, "Round 2 update". This branch 93 phone-call lines, 0 errors, 30 lint hits; writing branch (ae6694921) 80 lines, 11 errors (`#place_call` without config), 3 lint hits. No false positives from the new patterns across all 28 scenarios. `lab_social_engineering` identical; `test_phone_calls` clean here. `bin/test-js`: 506 passed before the last pattern addition; both edited test files pass after it.

Noticed, not changed: `scenarioInfo` reads `currentKnot` within 1500 characters either side of the `storyPath`, so a contact with no `currentKnot` can take a neighbour's. No scenario hits it today.
