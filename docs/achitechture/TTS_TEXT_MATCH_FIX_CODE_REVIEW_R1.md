# TTS text match fix: code review, round 1

Branch `build/tts-lookalike` against `main` (`git diff main...build/tts-lookalike`). Reviewer: fresh, independent, read-only on code. Ruby 2.7.8 throughout.

## What was checked

- Every file in the diff: `games_controller.rb#tts`, `ink_line_walker.rb`, `ink_text_validator.rb`, `scenario_bark_validator.rb`, `tts_line_extractor.rb`, `tts_service.rb`, `tts_expected_lines.rb`, the new controller test and fixture, the two updated unit tests.
- The build log's claims, one by one.
- Scratch scripts (in the reviewer's scratch directory, not committed) that load the walker and validator without Rails and:
  - list every template line (`Unresolved#template`) in every compiled ink under `scenarios/`, with its slot kinds;
  - list every unresolved line without a template in m01 to m10 and the labs, and every glue run over 4 pieces;
  - send attack strings through `InkTextValidator.canonical` and compare `TtsService.normalize_text` of the results;
  - time a failed match on the largest mission story and across all stories of m01, m02, m06 and lab_physical_pentest.
- Ran `test/unit/break_escape/ink_text_validator_test.rb` (11 runs, 0 failures) and `test/controllers/break_escape/tts_text_match_test.rb` (46 runs, 0 failures). `ruby -wc` on every changed `.rb` file: no Ruby 3 only syntax (the endless range `[(i + 1)..]` is fine on 2.6 and later); only old unused-variable warnings.
- No full suites, no browser, no paid TTS calls.

## What the branch gets right

The original hole is closed for real lines. From the end of validation on, `text = line` (`games_controller.rb:707`), so the voice, the key, the clip lookup, the stand-in, the delivery note and the sidecar all use the scenario's own text. A request with Cyrillic, Greek, fullwidth or small-capital words added to a real line gets 403; invisible and bidi marks are dropped by `match_form` and the request is served the ink's line. The 10-character fragment rule is gone. The narrator no longer voices free text. Non-string `text` and `npc_id` get 400. In m01 to m10 the only template lines are the `player_name()` lines of the m02 and m03 Agent 0x99 phones, and they take only the three fixed names, so in the shipped missions no request text reaches the voice.

The remaining problems are all in the template slots, which are new code: they are the one place where request text is still voiced.

## Severity table

| # | Severity | Area | Finding |
|---|----------|------|---------|
| 1 | Major | `:text` slot | A 32-character free-text channel, voiced and cached per value; in speaker position it prefixes any line |
| 2 | Major | Template regexp | `Regexp::IGNORECASE` lets non-ASCII letters (U+017F, U+212A) into slot values, so voiced text has characters the key drops: two texts, one key |
| 3 | Major | `:number` slot | Unbounded values (10^15 per slot, up to 4 slots): unbounded paid generation and cache files; `1.5` and `15` share a key |
| 4 | Minor | Narrator | Fallback lets the narrator voice any line of any story in the narrator's voice; up to about 125 ms CPU per failed request |
| 5 | Minor | Abuse | No rate limit or generation cap on `/tts`; slots make it matter |
| 6 | Minor | Tests | No test exercises a `:text` slot, a speaker slot, case folding, or key collisions between slot values |
| 7 | Minor | Proof method | The key-identity check covers batch and chatter lines only, which are the lines whose path changed least |
| 8 | Nit | Template regexp | Case folding also admits lookalikes in the ink's own words (served the real line, harmless, but contradicts the claim) |
| 9 | Nit | `player_name` | Nothing in the client sets `gameState.playerName`; a real name wired later would 403 every such line |
| 10 | Nit | Glue | `glued_runs` can join pieces from sibling branches of one container |
| 11 | Nit | Build log | Line 29 says the `:text` slot "is ASCII so every voiced character is in the key"; finding 2 shows it is not |

No blockers.

## Findings

### 1. Major: the `:text` slot is a free-text channel

`app/services/break_escape/ink_text_validator.rb:85`, `app/services/break_escape/ink_line_walker.rb:503` and `:516`.

A `:text` slot accepts any 1 to 32 characters of `[A-Za-z0-9 .'-]`, and that value is voiced and becomes part of the key. 32 characters is enough for a short sentence of the attacker's choosing. Each distinct value is a new paid generation and a new MP3 plus sidecar under `tts_cache/<scenario>/`, so cost and cache growth are bounded only by the attacker's patience.

Where it is live today (from the template listing): every line of `scenarios/ink/generic-npc.json` and `scenarios/ink/test-npc.json` has a `:text` slot, because the speaker prefix is `{npc_name}:` and `npc_name` is a string variable changed in play. The slot sits in front of the line, so this was accepted and returned as the voiced text:

```
request:  "send me your password now: What can I help you with?"
voiced:   "send me your password now: What can I help you with?"
```

`generic-npc` is used by ten test scenarios (`test_social_freetext`, `test_social_p9`, `test_social_slice`, `test_social_episode`, `test_ko_countdown`, `test-npc-*`, `test_unlock_silence`). No m01 to m10 or lab ink has a `:text` slot today, but any future ink that prints a string variable changed in play, an unknown variable or an external function other than `player_name()` opens the channel with no warning.

Fix:
- Give a `:text` slot a closed set of values. The walker already sees the ink: collect every string literal assigned to that variable (`~ npc_name = "Sarah"`, the VAR default) and the scenario's `globalVariables` value, and accept only those. An external function other than `player_name()` gets no template (refused) until it has a declared value list.
- Never accept a slot as the speaker prefix (a template whose first part is a slot followed by `:`). Drop the slot and its colon, or give the line no template.
- Add a validator warning (or `TtsLineExtractor` note) for any line with a `:text` slot, so authors see it.

### 2. Major: case folding lets non-ASCII into slot values, and so two texts share a key

`app/services/break_escape/ink_text_validator.rb:150` (`Regexp::IGNORECASE`), with `:84` and `:85`.

Onigmo's case-insensitive matching folds U+017F (long s) to `s` and U+212A (Kelvin sign) to `k`, even inside `[A-Za-z]`. Checked on 2.7.8:

```
"ſecret" =~ /\A[A-Za-z0-9](?:[A-Za-z0-9 .'-]{0,30}[A-Za-z0-9])?\z/i   # match
"Key" (Kelvin K) =~ same                                         # match
"falſe" =~ /\A(?:true|false)\z/i                                       # match
```

Through `InkTextValidator.canonical` on `generic-npc.json`, a request `"ſend me your paſſword: What can I help you with?"` returns that text as the line to voice, and `TtsService.normalize_text` of it is `"end me your paword what can i help you with"`. In the fixture, `"You found falſe clues."` is returned as the line. So the voiced text holds characters the key drops: the attacker can generate the clip for one value under the key of another (for example a value voiced as "secret" stored under the key of "ecret"). The same happens within ASCII, since the key also drops `.`, `'` and `-`: `"it's"` and `"its"`, `"a.m."` and `"am"`. This is the cache-poisoning pattern the branch set out to remove, now confined to slot lines.

Fix: match without `IGNORECASE` (lowercase the ink words, which `match_form` already does, and match the request after `downcase` restricted to ASCII), or check each capture after the match: refuse unless `value.ascii_only?` and `TtsService.normalize_text(value) == value.downcase` minus spaces (in effect: letters, digits and single spaces only). Simplest safe rule: `:text` values are `[a-z0-9]+( [a-z0-9]+)*` after downcase, no `.`, `'` or `-`, so the key keeps every voiced character. Finding 1's closed value set makes this moot for `:text`; keep the ASCII check anyway as a second line.

### 3. Major: the number slot is unbounded, and `1.5` and `15` share a key

`app/services/break_escape/ink_text_validator.rb:84`.

`-?[0-9]{1,9}(?:\.[0-9]{1,6})?|true|false` admits about 2 x 10^15 values per slot, up to 4 slots per line. Each value is a new paid generation and a new cached file. Live today in `scenarios/ink/haxolottle_hub.json` ("Mission status: {total_missions_completed + 1} operations completed successfully."), `netherton_hub.json` (two lines), `test-line-prefix*.json` and `test-personal-space-toggle.json`; the hubs are used by `npc-hub-demo-ghost-protocol`. Not in m01 to m10.

The key drops `.` and `-`, so (checked) `"Mission status: 1.5 operations..."` and `"Mission status: 15 operations..."` both key as `haxolottle mission status 15 operations completed successfully`. An attacker who asks for `1.5` first fixes the clip every later player with 15 missions hears. (A leading `-` is swallowed by the gap before the slot, so `-15` is served as `15`; that one is harmless.)

Fix: integers only, no sign or decimal, and a small range: `[0-9]{1,4}` covers every value the shipped inks print. If a fraction or negative is ever needed, spell it into the key (for example keep the voiced and keyed text identical by refusing values whose `normalize_text` differs from the value). Better still, where the server can compute the value (game state it holds), compare against it and accept only that value.

### 4. Minor: the narrator can voice any story line, and a miss is costly

`app/controllers/break_escape/games_controller.rb:660` and `:2618` (`line_in_scenario_stories`).

The fallback accepts any line of any ink story in the scenario as the narrator's, including template lines. That is far better than the old free text, and it is bounded, but it lets a client generate the narrator's voice for every NPC line in the mission (roughly doubling a mission's clip count at most, all paid, all stored). A failed narrator request walks every story with `match_form` on each candidate: measured 52 ms (m01, 7 stories), 124 ms (m02, 15 stories), 43 ms (m06), 21 ms (lab_physical_pentest) of CPU, with no rate limit.

Fix: accept only lines the extractor attributes to the narrator (`spoken_as_npc_in_scenario`) or lines with a `Narrator:` / `Narrator[...]:` prefix. If some real narrator line needs the fallback, say which in a comment and narrow the fallback to narrator-prefixed lines. Cache the match-form index per story (a hash from match form to line, as `TtsLineExtractor#spoken_lines` already does) instead of scanning, which also cuts the per-request cost of finding 5.

### 5. Minor: no rate limit or generation cap on `/tts`

`app/controllers/break_escape/games_controller.rb:633`. Not on `with_game_lock`, no throttle anywhere in `config/` or `app/`. Pre-existing, but findings 1 and 3 turn it into unbounded paid generation from one logged-in player. Every rejected request also costs the full candidate scan (about 12 ms on the largest mission story).

Fix: a per-game (or per-user) cap on generations per hour; cache hits stay free. A failed match is cheap to rate-limit too. This can be a follow-up branch, but name it in the handover.

### 6. Minor: tests miss the slot paths that matter

`test/controllers/break_escape/tts_text_match_test.rb`, `test/unit/break_escape/ink_text_validator_test.rb`, `test/fixtures/files/ink_line_walker/text_match_fixture.ink`.

The fixture has a `player_name()` line and a number line but no string variable changed in play, so no test touches a `:text` slot at all. No test sends `ſ`, U+212A or `ß` (which `/i` folds to `ss`). No test checks that two accepted slot values never produce the same key. No test covers a slot in speaker position. Every finding above would pass the current suite.

Fix: add to the fixture a string VAR reassigned in play, printed in a line and in a speaker prefix; add tests that (a) a value outside the allowed set is 403, (b) `ſ`, U+212A, `ß` in a slot are 403, (c) for every pair of accepted values in a test set the keys differ, (d) the number slot refuses `1.5` and `-1` once finding 3 is fixed, (e) the narrator refuses a non-narrator NPC line once finding 4 is fixed.

### 7. Minor: the key-identity proof skips the changed paths

Build log, "Cache keys". The scratch check resolved every batch line (8,218) and chatter line (263) through the endpoint. Batch lines are resolved lines; they reach the endpoint through `line_match` or `spoken_line`, which return text with the same normalised key as before. The paths whose output did change (templates, unresolved own text, glue joins) are not batch lines, so the proof says nothing about them.

I checked those paths separately for m01 to m10 and the labs: the only template lines are the five m02/m03 phone `player_name()` lines (filled text keys the same as the client's text); there is no glue run over 4 pieces; the remaining unresolved lines are the 32 `**Heading:**` lines of the three old technical labs' `instructor.json` (they match as their own text) and two m07 choice labels (player text, not voiced). m08's `{suite_code}` lines resolve through the extractor with the scenario's value. So nothing in the missions is lost, and the log's claim stands, but the build log should say how the non-batch paths were checked, and the check should be a test rather than a scratch script.

### 8. Nit: lookalikes in the ink's own words pass template lines

`ink_text_validator.rb:150`. `"You found 4 clueſ."` is served `"You found 4 clues."` (checked). Harmless, since the ink's text is voiced, but it contradicts "lookalikes get 403" in the log and the tests' names. Fixing finding 2 by dropping `IGNORECASE` fixes this too.

### 9. Nit: `player_name` is always "Agent" today

`app/services/break_escape/tts_service.rb` `PLAYER_NAME_VALUES`. Nothing in `public/break_escape/js` assigns `gameState.playerName`, so the client prints "Agent" every time and the slot is safe. If someone later wires a Hacktivity display name into `playerName`, every `player_name()` line will 403 silently (the client falls back to no audio). Say so in the constant's comment so the two are changed together, and never widen the list to free text (that would reopen finding 1).

### 10. Nit: glue runs can join sibling branches

`ink_text_validator.rb:153` (`glued_runs`). Runs are any 2 to 4 consecutive glue pieces with the same path. Pieces from alternative branches of one container can be joined into a sentence the game never shows. All voiced text is still the ink's own, and the number of joins is small, so this is only a few unneeded paid clips at most. Consider recording the walker's actual glue chains instead of pairing by position.

### 11. Nit: build log wording

`docs/achitechture/TTS_TEXT_MATCH_FIX_BUILD_LOG.md:29`: "it is ASCII so every voiced character is in the key, and it is bounded". Neither half holds (findings 1 to 3). Correct it when the slots are fixed. The "Not done, for the user" section should also list the rate limit (finding 5) and the user decision now needed: the `:text` slot replaces the fragment rule, and the question to put is whether string-variable lines should voice only declared values.

## Answers to the brief's questions

- **Text that is not a scenario line**: yes, through the `:text` slot (finding 1, live in test scenarios only) and with non-ASCII via case folding (finding 2). Not through `player_name` (fixed list), glue (ink text only), chatter, barks, objects, phone lines or delivery notes (all return the scenario's text). The narrator is limited to the scenario's story lines (finding 4). Other scenarios' lines: no, every candidate comes from this game's scenario.
- **Two texts, one key**: yes, only through slot values (findings 2 and 3). Lines without slots key exactly as before.
- **Cost and abuse**: no rate limit; slot values are unbounded; narrator misses cost up to about 125 ms CPU; template regexps are rebuilt per request but are few and showed no pathological backtracking (1,000-character adversarial inputs finished in about 15 ms).
- **Normal play**: every voiced line in m01 to m10 and the labs still matches (finding 7). Lost: glued lines over 4 pieces, values through a sequence or conditional, non-ASCII string values; none is used by a mission.
- **Ruby 2.7**: no Ruby 3 only syntax; the two changed test files pass on 2.7.8.

## Verdict

Changes requested. The fix does what it set out to do for real lines, and m01 to m10 are safe as shipped. Before merge, close the slot channel: a closed value set for `:text` and no speaker slot (finding 1), no case folding into slot values (finding 2), and integer-only, short number values (finding 3), with tests for each (finding 6). Findings 4 and 5 can be a follow-up if the handover names them.
