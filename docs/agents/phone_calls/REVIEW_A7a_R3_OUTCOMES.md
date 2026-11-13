# A7a review round 3: outcomes

Fixer, 2026-11-12. Files: `scripts/validate_phone_calls.rb`, `test/js/validator-phone-calls.test.mjs` (now 29 tests). `validate_scenario.rb`, `dialoguelint.mjs` and `dialoguelint.test.mjs` needed no change.

| Finding | Status | Where and test |
|---|---|---|
| m1 someone else's "call back" | Fixed | New `OTHER_RING` excuse (`he/she/they/we/it [will/would/...]` or `<word> to`, but not `you to`) joins `CALL_NOUN` and `SELF_RING`. `CALL_NOUN` also takes one adjective (judgement, conference, phone, video, voice, quick, short and similar) so "a judgement call if" is a noun. Test N1: "Tell him to call back", "Did she call back?", "If they call back, stall.", "Ask Dev to ring back once he has it.", "We will call back.", "a judgement call if", "a conference call if" are quiet; "Call back when you're sure." and "Call back when" still warn. Failed before the change. |
| m2 N2 setter coverage | Fixed | `known_globals` now walks the engine's setters: `setGlobal` and `setVariable` hashes (names are the keys), any `setGlobal*` or `globalVarOnKO` string (not `setGlobalPrefix`), `{type: set_global, key:}` nodes, and `#set_variable:` ink tags beside `#set_global:`. Engine check: `npc-manager.js` (`setGlobalOnStart`), `npc-hostile.js` (`globalVarOnKO`), `objectives-manager.js` (`onComplete.setGlobal`), `interactions.js` (`setVariable`), `apply-actions.js` (`set_global`), `mail-bridge.js` (`outcome.setGlobal` string). Test "N2 (R3 m2)" has one case per setter and a `setGlobalPrefix` negative. Failed before the change. |
| Nit 1 "phone me" | Fixed | Test N1 adds "Phone me." and "Phone me tonight."; removing `phone` from `CALL_ME` now fails it (checked). |
| Nit 2 `importedGlobals` keys | Fixed | First case of the new N2 test. |
| Nits 3, 4 | Not done | Plan wording (`PHONE_CALLS_PLAN.md:626`) and the `carry_over_name` duplicate are outside this task's file list. |

## Reruns

All 177 `scenario.json.erb` files through `validate_scenario.rb --no-graph`, old and new `validate_phone_calls.rb` on the 10 scenarios that report phone-call lines: 92 lines either way, and `diff` of the sorted lines is empty. Nothing changed because no real text uses a third-person "call back" or an adjective-led call noun, and no call.when reads a name only the new setters declare. Errors 0. Lint hits (30) are untouched, since `dialoguelint.mjs` is unchanged. `bin/test-js`: 507 passed, 0 failed.

Noticed, not changed: `OTHER_RING` matches "<word> to call" generally ("Remember to call back" is excused). That errs quiet, in line with the other excuses.
