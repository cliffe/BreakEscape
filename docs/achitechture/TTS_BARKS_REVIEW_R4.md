# TTS barks review, round 4

Branch `build/tts-barks`, delta `bb012dd70..d4269aabc` (one commit, three files). Read only. No server, no `/tts`, no audio, no Rails credentials, no SecGen files. Round 3 is `docs/achitechture/TTS_BARKS_REVIEW_R3.md`.

## Summary

All four R3 nits are fixed and the new test is correct. One new comment is inaccurate in detail and one guard is now redundant. Nothing changes behaviour.

Counts: 0 blocker, 0 major, 1 minor, 1 nit.

I could not run the test file (it needs the DB). I loaded `scenario_bark_validator.rb` alone under Ruby 2.7.8 and ran the new test's three cases, which return the expected values (below).

## R3 nits

| Nit | Result | Evidence |
|---|---|---|
| n1 fold_char non-ASCII guard untested | Fixed | `tts_line_extractor_barks_test.rb:146-155`. Exercises both sides of the guard `char.ord >= 128 && up.ord < 128` (`scenario_bark_validator.rb:123`) with ſ (U+017F, upcases to S) and ı (U+0131, upcases to I). |
| n2 Unicode version gap not noted | Fixed, but see m1 | `scenario_bark_validator.rb:94-97` |
| n3 stale comment, redundant `t.strip` | Fixed | `tts_line_extractor.rb:116-118` now describes `spoken_bark_text` output; `t.strip` gone at `:123`. |
| n4 helpers public, constants below user | Fixed | `JS_SPACE`, `PLAYER_LINE`, `NARRATOR_LINE`, `PREFIX_TAIL` at `scenario_bark_validator.rb:76-79`, above `spoken_bark_text` (`:101`). `js_strip`, `fold_char`, `own_names`, `strip_own_prefix` are `private_class_method` (`:113,121,130,137`). |

## Checks

**1. Test expectations against real JS.** I called the real `phoneBarkText(text, contact)` in node 22.23.4 with that argument order (text first, contact second) on the three inputs:

- `("ſam: x", {id:'sam', displayName:'Sam'})` gives `ſam: x`. The test expects the same (`:151`).
- `("SAM: x", sam)` gives `x` (`:152`).
- `("ısmail: x", {id:'ismail', displayName:'Ismail'})` gives `ısmail: x` (`:154`).

The Ruby side returns the same three values under Ruby 2.7.8. The test comment (`:146-148`) is accurate: ſ upcases to S and ı to I in both engines, and JS refuses the match.

**2. `private_class_method def self.x` on Ruby 2.7.8.** `def` returns its symbol (since 2.1), so the form is valid. Verified with `ruby 2.7.8p225`: `V.js_strip("x")` and `V.fold_char("x")` raise `NoMethodError: private method`. Every caller uses an implicit receiver from inside a class method, including the `map { |l| js_strip(l) }` block (`:105`), `own_names` (`:133-134`), `strip_own_prefix` (`:142,148`), and `spoken_bark_text` calling `own_names`/`strip_own_prefix` (`:104,108`). A repo-wide grep finds no other caller of any of the four, in app, lib, test or rake. `spoken_bark_text` still returns the right values (above), and `event_bark_texts` (`:45-50`) and the tests (`tts_line_extractor_barks_test.rb:127,141-154`) use only the public method.

**3. Dropping `t.strip` cannot change a key.** `each_bark_line` has one source, `event_bark_texts` (`tts_line_extractor.rb:123`). That method returns only `spoken_bark_text` output, with empty results dropped (`scenario_bark_validator.rb:46-49`). `spoken_bark_text` joins lines that were each `js_strip`ped and non-empty (`:105-109`), so the text has no JS whitespace at either end and is non-empty. `String#strip` removes only ASCII whitespace and trailing NUL, all of which is either JS whitespace (already gone) or NUL. A trailing NUL is the one theoretical difference: `"ab\0".strip` is `"ab"` in 2.7.8, and `js_strip` keeps it, which is what JS `trim()` does, so the new text is the more faithful one. No scenario file contains a NUL. Keys are unchanged. The other consumer, `tts_office_lines.rb:99`, reads the same iterator and is unaffected.

**4. Comments.** `tts_line_extractor.rb:116-118` and the `JS_SPACE` comment (`:74-75`) are accurate. The Unicode comment is not exact (m1).

**5. Style.** The added lines contain no em or en dashes and no model names. UK English holds ("canonicalisation" was already there).

## Findings

### m1 (minor) The Unicode comment lists the wrong code points

`scenario_bark_validator.rb:95-97` says the letters that fold differently are "U+019B, U+0264, U+1C89, U+A7CB to U+A7DC". I diffed `toUpperCase` in node 22.23.4 against Ruby 2.7.8 `upcase` over the whole BMP. The 16 inputs that differ are:

- U+019B, U+0264, U+1C8A, U+2C5F;
- U+A7C1, U+A7C8, U+A7CA, U+A7CD, U+A7CF, U+A7D1, U+A7D3, U+A7D5, U+A7D7, U+A7D9, U+A7DB, U+A7F6.

The comment mixes input and result code points. U+1C89 is the capital that U+1C8A maps to, not a differing input. "U+A7CB to U+A7DC" is a range of results and misses U+2C5F, U+A7C1, U+A7C8, U+A7CA and U+A7F6. (R3's list in its point 2 has the same mixed-up form.) There is no behaviour effect, and a grep of `scenarios`, `app` and the engine JS finds none of these characters, so "no scenario name uses them" holds. Suggest: "(sixteen lowercase letters, U+019B, U+0264, U+1C8A, U+2C5F and U+A7C1 to U+A7F6)", or just drop the list and say "a few lowercase letters added after Unicode 12.1".

### n1 (nit) Redundant guard in `each_bark_line`

`tts_line_extractor.rb:123`: `if t.is_a?(String) && !t.empty?`. `event_bark_texts` already returns only non-empty Strings (`scenario_bark_validator.rb:46-49`), so both tests are dead. Harmless defence. Drop it or keep it.

## Verdict

Approve. All R3 nits are closed, the new test matches the real `phoneBarkText`, the private helpers work on Ruby 2.7.8 for every caller, and removing `t.strip` changes no key. m1 and n1 can ride along or wait.
