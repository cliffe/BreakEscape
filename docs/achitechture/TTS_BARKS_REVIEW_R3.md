# TTS barks: delta review, round 3

Branch `build/tts-barks`, delta `63d402aec..HEAD` (ed894752a, ad0f1fb72). Read only. No server, no `/tts`, no audio, no Rails credentials, no SecGen files. Round 2 is committed (`docs/achitechture/TTS_BARKS_REVIEW_R2.md`).

## Verdict first

All three round 2 minors (m1 rake desc, m2 independent cross-check, m3 Unicode) and the nits n2 to n4 are fixed. The new `JS_SPACE` class and `js_strip` are exactly the ECMAScript whitespace set that `trim()` uses. `fold_char` reproduces JS non-`u` `/i` on every case I could construct except 16 letter pairs that Ruby 2.7.8's Unicode tables are too old to know (nit). No scenario name hits any of them.

Counts: 0 blocker, 0 major, 0 minor, 4 nit. No finding adds a design decision.

## How this was checked

Scripts are in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/r3/`. Node 22 (Unicode 17) imports the real `phoneBarkText` from `public/break_escape/js/minigames/phone-chat/phone-chat-speaker.js` (it has no imports). Ruby is plain `ruby -r` on `scenario_bark_validator.rb` (2.7.8, matching `.ruby-version`, Unicode 12.1), so no Rails, no DB, no credentials.

- `ws_js.mjs` / `ws_rb.rb`: every BMP code point except surrogates (63,488), each in 20 shapes: as the separator before and after the colon (`Nia<c>: x`, `Nia:<c>x`, `Nia<c>:<c>x`), as leading and trailing space, as a blank middle line, inside `You`, `Player` and `Narrator` prefixes (`You<c>:`, `You:<c>x`, `Narrator<c>[a]:`, `Narrator[<c>]:`, `Narrator [a]<c>:`), as the whole text, inside and around a two-word name (`dr<c>chen`), and as leading or trailing space in `displayName`. 1,269,760 cases.
- `ws_trim.json`: the set of code points JS `trim()` removes, compared with Ruby `js_strip`.
- `fold_js.mjs` / `fold_rb.rb`: 7,399,735 (name, line prefix) pairs. All of U+0020 to U+024F, Greek and Cyrillic (U+0370 to U+052F), Latin Extended Additional and Greek Extended (U+1E00 to U+1FFF), letterlike symbols (U+2100 to U+218F), ligatures and fullwidth forms, squared against each other; every BMP character against its own upper and lower case and A to z; and 41 multi-character names (Straße, İpek, Łukasz, Ørsted, José, Muñoz, Kim with U+212A, ſam, ΑΣ/ας and others) against each other.
- `named.mjs` / `named.rb`: 286 hand-picked case variants of 26 names (é, ñ, ø, ł, ı, ſ, Kelvin sign, ß, ẞ, İ, ǅ, ﬃ, decomposed é and others).
- `tests.mjs`: the delta's own test expectations run through node.
- `perf.rb`: timing.

## Results

1. **Whitespace.** 0 mismatches in 1,269,760 cases. The set `js_strip` removes equals the `trim()` set exactly: U+0009 to U+000D, U+0020, U+00A0, U+1680, U+2000 to U+200A, U+2028, U+2029, U+202F, U+205F, U+3000, U+FEFF (25 code points); no extras, none missing. U+0085 and U+180E are not whitespace on either side, so `\u0085Nia: x` keeps the NEL and the prefix is not stripped, as in JS (the second commit's fix, `tts_line_extractor_barks_test.rb:133-134`). The comment's claim at `scenario_bark_validator.rb:82-84` is accurate: Ruby `[[:space:]]` differs from JS by gaining U+0085 and losing U+FEFF, and `\s` is ASCII only. `PLAYER_LINE` and `NARRATOR_LINE` use Ruby `/i` on the literals `you|player|narrator`, which contain no k, s or i, so Ruby's extra folds (Kelvin, long s, dotless i, ligatures) cannot leak in there.
2. **`fold_char`.** The rule (single-unit `upcase`, keep the original when the result is longer than one character or maps a non-ASCII character to ASCII) is the ECMAScript `Canonicalize` for non-`u` regexps. 0 mismatches in the 286 named cases and in the Latin-1 and Latin Extended ranges. Spot values: é to É, ñ to Ñ, ø to Ø, ł to Ł, ı stays ı (upcase is ASCII I), ſ stays ſ (upcase is ASCII S), Kelvin sign stays itself (so it does not match k, in JS or Ruby), ß stays ß (upcase is SS), ǅ to Ǆ. In the big run 16 pairs differ, all in Ruby's data and not in the rule: U+019B/U+A7DC, U+0264/U+A7CB, U+1C89/U+1C8A, U+A7CC/U+A7CD, U+A7CE/U+A7CF, U+A7D2/U+A7D3, U+A7D4/U+A7D5, U+A7DA/U+A7DB. These are letters added to Unicode after 12.1 (Ruby 2.7.8 reports 12.1.0, node reports 17.0). See n2.
3. **m3 cross-check.** Independent now, and `missions_data` does not change what the "eleven missions" test asserts. Detail below.
4. **Docs.** Accurate. Detail below.
5. **Performance.** Negligible. Detail below.
6. **Style.** The added lines have no em dash, no en dash, no ` -- `, no model name, and use UK spelling. The commit messages are fine.

### The m3 cross-check (`test/unit/break_escape/tts_mission_lines_test.rb:265-305`)

The texts now come from `raw_event_bark_texts` through `each_bark(game_data, raw: true)` (`:280`, `:317`). The hand strip at `:288` is the only thing that removes a prefix; the code under test is used in two places only, as the batch's side (`ex.keys`) and inside the resolver (the endpoint's side). The new `sent_key` assertion (`:294`, `:298`) keys the text the client would send and demands the batch lists it. Both failure directions are caught:

- Under-strip in `spoken_bark_text`: the batch lists `Eleanor Vance: x`, the client sends `x`. `sent_key` is absent, and the resolver also refuses `x` (match form differs), so both assertions fail.
- Over-strip (a prefix naming someone else, or a line the client keeps): the batch lists the shorter text, `sent` is the longer one, `sent_key` is absent, and the resolver's canonical differs from `sent`. Fails.

Limits, not findings: the hand strip is the plain displayName-or-id form, so the test pins that path only, and the comment at `:284-287` says so, pointing at `tts_line_extractor_barks_test.rb` for the id-with-spaces, You:/Narrator: and Unicode rules. The `Regexp.union(...).source` form escapes names correctly. `missions_data` (`:89-91`) is memoised, `+` builds a new array so the memo is not mutated, and the bark test only reads it; no test in the file mutates `raw` or `game_data` (grep for assignment, `<<`, `delete`, `merge!`, `dup` finds only local arrays and failure strings). The assertion at `:98` still sees 11, since `MISSIONS` (`:19`) does not include sis03 and sis03 is appended to a copy. `checked['sis03_cyber_insurance'] >= 3` (`:304`) still depends on the three Eleanor lines. I could not run the Rails test (it needs the database), so this is by reading; the node check below covers what the tests assert about the strip.

The new unit tests in `tts_line_extractor_barks_test.rb:123-144` all match real `phoneBarkText` output (`tests.mjs`): `x`, `hello`, `x`, `x`, `x`, NEL kept, `You:`, `x\nYou:`, `STRASSE: x` kept, `İPEK: x` kept, `STRAßE: x` stripped.

### Docs

- Rake desc (`lib/tasks/break_escape_tasks.rake:103-108`): says event barks are listed as kind "bark", count in the totals and in STRICT, and that STRICT=1 exits 1 when any clip, bark included, is uncached. The task agrees: `TtsOfficeLines` adds them as kind `bark` (`app/services/break_escape/tts_office_lines.rb:99`), `report.uncached` includes every clip, and the exit is `exit 1 if ENV['STRICT'] == '1' && report.uncached.any?` (`break_escape_tasks.rake:134`). "As the client voices them" matches the keyed text.
- `SKILL.md:22` says the bark is keyed on the text with the NPC's own speaker-name prefix stripped and You:/Narrator: lines removed (`spoken_bark_text`), the same text the client sends, listed in the batch at path `npc.bark` and in `keys`. All true (`tts_line_extractor.rb:119-126`, `:573`). "Always listed" holds because barks are not behind `ttsPregenerateChatter`.
- Round 2 n2 (the broken comment wrap) is fixed, though the paragraph at `tts_line_extractor.rb:19-22` now has a long line (about 120 characters). Cosmetic.

### Performance

829 texts (the real bark count) through `spoken_bark_text`: 54 ms unprefixed, 62 ms prefixed, measured while another CPU-bound job was running (about 65 to 75 microseconds a bark). The per-request path (`canonical` to `bark_texts` to `spoken_bark_text` for every bark of one NPC) costs about 1.3 ms for a 20-bark NPC. The per-character fold only runs while the prefix keeps matching (`all?` short-circuits), and `line.chars` is the one allocation per line. Negligible against a `/tts` request or a batch run. No change needed.

## Findings

### Nit

**n1. The "non-ASCII maps to ASCII" half of `fold_char` is not pinned by a test.** `scenario_bark_validator.rb:117-122`. The new test (`tts_line_extractor_barks_test.rb:140-144`) covers ß (upcase is two characters) and İ (no match), but not the guard `char.ord >= 128 && up.ord < 128`. Remove it and `ſam` would match `SAM`, `ısmail` would match `ISMAIL`, and all the new tests still pass; node says neither matches. Add one case, for example name `ſam` against `SAM: x` (kept), and `Kim` against Kelvin-sign `Kim: x` (kept, though that one holds with or without the guard).

**n2. The comment names the UTF-16 difference but not the Unicode-version one.** `scenario_bark_validator.rb:85-88`. Ruby 2.7.8 folds with Unicode 12.1 tables, node 22 with 17, so 16 letter pairs added since (Georgian Mtavruli U+1C89/1C8A, Latin Extended-D U+A7CB to U+A7DC, U+019B, U+0264) differ. I demonstrated the astral difference too (Deseret 𐐀 against 𐐨: JS keeps the prefix, Ruby strips it), as the comment says. No scenario `displayName` or `id` has any of these (the only non-ASCII names are `Tomás Carvalho` and `Tomasz Wiśniewski`). One extra clause in the comment is enough.

**n3. Stale comment and a redundant `strip` at the batch edge.** `app/services/break_escape/tts_line_extractor.rb:116-118` says the text is "as the scenario has it (stripped, as the endpoint's canonical form)"; it is the client-voiced form now. Line `:124` then calls Ruby `String#strip` on text `js_strip` already trimmed. It is harmless except for one case: Ruby 2.7 `strip` removes a trailing NUL, which JS does not, so a bark ending in U+0000 would be keyed without it (checked: `"\0x\0".strip` gives `"\0x"`). No real text has a NUL. Drop the `.strip` calls or use `js_strip`, and reword the comment.

**n4. New helpers are public and the constants sit after their first use.** `js_strip` and `fold_char` (`scenario_bark_validator.rb:109`, `:117`) are used only inside the class, and `JS_SPACE`, `PLAYER_LINE`, `NARRATOR_LINE`, `PREFIX_TAIL` (`:103-107`) are defined below `spoken_bark_text` (`:91`) which reads them. It works because the method body runs later, but a reader expects constants first. Making the two helpers `private_class_method` would shrink the public surface; the comment on `JS_SPACE` could add that the string is single-quoted on purpose so the regexp engine reads the `\u` escapes.

## Design decisions

None added. The strip, the fold rule and the key text are the choices rounds 1 and 2 already settled; this delta makes the port match the client more closely and tightens one test.

## Verdict

Approve. No finding blocks the sis03 batch or the merge. The nits can ride along or wait.
