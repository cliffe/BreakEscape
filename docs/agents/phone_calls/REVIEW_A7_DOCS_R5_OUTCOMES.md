# Review A7 docs R5 outcomes

- n1: done. `README_scenario_design.md` ringWhile grammar now says single `globalVars.<name>` terms and a comparison to a literal or another `globalVars.<name>`.
- n2: done. `call.when` row says an `||` is a validator error and why.
- n3: done. `A7_DOCS_NOTES.md` heading and items 1-2 rewritten as "Merged from main (done)".
- n4: done. `call.when` bullet added after the `ringWhile` bullet in the validate-scenario and scenario-design-review notes.
- n5: done. tts-audio voicemail bullet now ends with the instruction to delete "(no ink has `voice:` lines)" from skill line 21.
- n6: done. Validator warning reworded to "it runs once per call and again on each later thread visit (plan 3.2)"; the test asserting "can fire twice" now asserts the new fragment (`test/js/validator-phone-calls.test.mjs`, 35 pass, 0 fail).
- n7: done. Comment now says the callback is "cleared at once"; error message names single `globalVars.<name>` terms and the comparison to another `globalVars.<name>`.
