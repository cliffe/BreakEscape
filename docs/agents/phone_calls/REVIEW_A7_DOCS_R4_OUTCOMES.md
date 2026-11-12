# Review A7 docs R4: outcomes

- m1: fixed. `A7_DOCS_NOTES.md` ringWhile bullet replaced; the setGlobal-restore bullet added under playtest-scenario.
- n1: fixed. `README_scenario_design.md` 1878 and 1879 now say "declared in `globalVariables`".
- n2: fixed. Several-calls paragraph (1989) rewritten; double full stop gone, m07 aside moved out of the connected-call clause.
- n3: fixed. 1979 and 1884 now say the mapping's own `setGlobal` keys are put back on a `ringWhile` drop.
- n4: fixed. `callbackWhen` clause says "the callback would be cleared at once"; `ringWhile` says "the ring would never drop". Checked against `callConditionHolds` and `ringConditionHolds`.
- n5: fixed. Grammar now "a single `globalVars.<name>`, optionally negated or compared to a literal or another `globalVars.<name>`".
- n6: fixed. "(it runs once per call and again on each later thread visit)".
- n7: fixed in the validator first (`scripts/validate_phone_calls.rb`: `call.when` containing `||` is an error saying to write two entries with the same knot), test added in `test/js/validator-phone-calls.test.mjs` (35 pass), then the doc line. No scenario gained a `call.when` error.
