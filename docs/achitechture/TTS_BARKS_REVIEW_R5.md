# TTS barks, review round 5 (final)

Scope: `git diff d4269aabc..b630b0c52 -- app` (comment-only), then a whole-branch skim of `git diff 637935717..b630b0c52 -- app lib test .claude/skills/tts-audio`. Read-only; no suites run, no servers, no /tts.

## 1. R4 m1 comment fix

I re-derived the differing inputs rather than trusting R4. Ruby 2.7.8 (the project ruby, `fold_char` rules) against node 22.23.4 (`toUpperCase`, Unicode 17) over the whole BMP, surrogates skipped. Exactly 16 inputs differ:

U+019B, U+0264, U+1C8A, U+2C5F, U+A7C1, U+A7C8, U+A7CA, U+A7CD, U+A7CF, U+A7D1, U+A7D3, U+A7D5, U+A7D7, U+A7D9, U+A7DB, U+A7F6.

That is R4's list, character for character. The new comment (`scenario_bark_validator.rb:97-98`) says "16 inputs, among them U+019B, U+0264, U+1C8A, U+2C5F, U+A7C1 and most of U+A7C8 to U+A7F6".

- The count, the four named inputs and the U+1C8A correction (input, not the U+1C89 result) are right. The mixed input/result confusion is gone.
- "most of U+A7C8 to U+A7F6" is loose. 11 of the 16 inputs fall in that span (A7C8, CA, CD, CF, D1, D3, D5, D7, D9, DB, F6), so "most of the 16" is true, but the span is 47 code points and only 11 differ, so a reader can take "most of" to mean most of the range. Behaviourally harmless (no effect on scenarios, and a grep of earlier rounds found no scenario name using any of them).

## Findings

- **[n1] Comment wording, optional.** `scenario_bark_validator.rb:97-98`: "most of U+A7C8 to U+A7F6" reads as most of the range differing. Safer: "and 11 letters between U+A7C8 and U+A7F6". Not worth a round. Ship as is, or fix in the merge commit.
- **[n2] Redundant guard kept on purpose.** `tts_line_extractor.rb:123` `t.is_a?(String) && !t.empty?` repeats what `event_bark_texts` already guarantees. R4 n1 stays as accepted cheap defence. No action.
- **[n3] Long comment line.** `tts_line_extractor.rb` header comment: "its story is a host like a person-chat one, read as phone-call-voice.js voices it (no" runs well past the other lines, left from inserting the bark sentences into a reflowed paragraph. Cosmetic.
- **[n4] Naming.** `npc.bark` is added to `CHATTER_PATHS` in the rake report's constants. Barks are not chatter, so the constant name now misleads slightly. It works (barks are excluded from the person-chat batch keys, as the tests pin). Cosmetic.

No blockers, no majors, no minors.

## 2. Whole-branch skim

Checked `app`, `lib`, `test` and the `tts-audio` skill diff for TODO/FIXME, debug output (`puts`, `byebug`, `console.log`, `debugger`), em and en dashes, and model names. None found. The only grep hits were `Mission::ScenarioBinding...get_binding` in a test (legitimate ERB rendering). No dead code seen: `raw_event_bark_texts`, `event_bark_texts`, `each_bark_line`, `spoken_bark_text`, `fold_char`, `own_names`, `strip_own_prefix` and `js_strip` are all used. Rake `desc`, extractor header and skill text agree on what is listed and on the STRICT behaviour. Worktree status: only untracked `node_modules`.

## Verdict

Counts: blocker 0, major 0, minor 0, nit 4 (n1 to n4). The m1 fix is accurate on the count and inputs; one phrase is loose but harmless. Verdict: **clean, ready to merge** (after the train check that is running).
