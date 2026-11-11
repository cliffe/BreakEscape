# TTS text match fix: build log

Branch `build/tts-lookalike`, from `main` at `0ddb3ba93`. The issue is from `docs/handover/2026-11-10_ACCESS_MODEL_HANDOVER.md` ("Separate open issue") and review m3 in `physical_pentest_followup/VOICE_DELIVERY_TAG_CODE_REVIEW_R2.md`.

## The issue

`POST /games/:id/tts` checked the requested `text` against the scenario after a normaliser that keeps only ASCII letters, digits, `_` and spaces. It then voiced the request text and keyed the clip on the same normaliser. Anything that normaliser drops passed the check, was spoken (paid generation) and was cached under the real line's key, which every other player then heard. Examples: Cyrillic, Greek, fullwidth or small-capital "lookalike" words appended or prepended to a real line. Three more holes on the same path:

- `InkTextValidator` accepted any text that contained a story fragment of 10 or more characters, so plain ASCII could be added around a real line.
- The narrator (`skipTextValidation: true`, in 14 scenarios) accepted any text at all.
- Barks, chatter, co-speaker lines and fixed object messages also voiced the request text.

## The fix

The request only chooses a line. From the end of validation on, the controller uses the scenario's own text for that line (`line`): for the voice, the cache key, the clip lookup, the stand-in and legacy lookups, the `#delivery:` lookup and the sidecar. The delivery note already worked this way.

The matching rule is `TtsService.match_form`: Unicode NFC, lowercase, every run of whitespace (any script's spaces) becomes one space, then only letters, combining marks, digits and `_` (any script) are kept. So:

- case, punctuation, spacing and invisible characters (zero-width, bidi controls, BOM, soft hyphen) do not affect a match; the request is served the real line, voiced from the ink;
- lookalike letters, stray combining marks, other-script digits and compatibility forms (fullwidth) are kept, so the request matches no line and gets the existing 403;
- text that is not valid Unicode, or not a string, is refused (400 for a non-string).

Candidates, all returning the scenario's text (`InkTextValidator.canonical`, `ScenarioBarkValidator.canonical` / `canonical_shared`, `TtsLineExtractor#spoken_line`, object `voice`):

1. whole ink lines, with or without the speaker prefix (as before);
2. single ink fragments (as before);
3. lines the walker leaves unresolved, as their own text (glue pieces, a divert mid-line);
4. glued pieces joined (2 to 4 in a row from one container), replacing the fragment rule for glued lines;
5. lines whose only printed value is `player_name()`: the ink's text with the game's player name, as the server holds it, put in. Round 1 (below) replaced the original rule here, which also took request text into number and string slots.

The narrator's text must now be a narrator line of the scenario (round 1 narrowed this from any story line).

## Cache keys

- Batch keys: the identity check (`identity_check.sh`, copy in scratch) against base `f86912dd4` gives 8,408 of 8,416 untagged matched, because the ink changed since (stage-direction rewrite), not because of this branch. Run against this branch's own base `0ddb3ba93`, the key dumps are byte-identical: 8,481 rows, 8,416 untagged all matched, 65 tagged identical.
- Endpoint keys: a scratch script resolves every batch line (8,218) and chatter line (263) through the new endpoint chain with the batch's text as the request: all 8,481 give the batch's key, none refused.
- Pruner dry run (`tts:prune_cache`, `NO_WALK=1`): 45 more committed clips count as orphans than at base (lab_physical_pentest 5, m02 32, m03 8). All 45 hold old lines with inline stage directions (`*very still* Reeves.`), since rewritten with `#delivery:` tags. The endpoint never served them under their own keys; only the pruner's fragment rule kept them. Nothing was pruned.

## Lines that no longer voice

Glued lines longer than 4 pieces, lines printing a value through a sequence or conditional, and string-variable lines whose value is not plain ASCII. None of these is in m01 to m10: the affected unresolved lines are in demo and hub inks (`netherton_hub`, `chen_hub`, `haxolottle_hub`, `instructor`) and test scenarios. m02 and m03 Agent HaX phone lines with `player_name()` still match.

## Tests

- `test/controllers/break_escape/tts_text_match_test.rb` (new, 46 tests, fixture `test/fixtures/files/ink_line_walker/text_match_fixture.ink`): six lookalike scripts appended and prepended, single-letter substitutions, combining marks, words hidden behind bidi or zero-width marks, fullwidth (NFKC) forms, fragment-containing text, narrator free text, phone, object and bark lookalikes, bad `player_name` and number values, non-string text; nine invisible characters served as the ink's line; case and spacing; NFD to NFC; a tagged line with its note; `player_name`, number and glued lines; narrator, phone, object and bark lines voiced from the scenario; a clip served by the line's key without generation and not overwritten; generation under the line's key with the line's text in the sidecar; `match_form` itself. On the unfixed code 40 fail and 1 errors.
- Updated: `ink_text_validator_test.rb` (the fragment rule test replaced by template, known-value and glue tests), `tts_cache_pruner_test.rb` (a fragment-containing sidecar is now an orphan).
- Full suites (under the shared lock): Rails 1,455 runs, 0 failures, 0 errors, 1 skip; JS 483 of 483 files passed.

## Not done, for the user

- Skill and doc wording (not edited, skills need the user's say-so): `tts-audio` could say "the server matches the text by `TtsService.match_form` and voices the scenario's own line"; `docs/agents/TTS_38_MIGRATION.md` line 11 (the fragment gap, "ignore for now") is now closed.
- Decision to confirm: the earlier "keep the 10-character fragment looseness" user decision is replaced by the template rule above.

## Round 1 fixes

Review: `TTS_TEXT_MATCH_FIX_CODE_REVIEW_R1.md`. Commits `d95ef1aa3`, `f7ed127c6`, `a798800a3` and this log.

### Orchestrator decisions (2026-11-11)

Following the user's standing rule that voiced lines never print variables:

- No free-text (`:text`) slot and no number slot is ever voiced. A request for a line whose template needs one gets the endpoint's existing 403, and the client shows the line unvoiced as for any refused line.
- A player-name slot holds only the current game's own player name as the server holds it, never a name from a list.
- Case folding only for ASCII letters. Any non-ASCII character must match exactly after NFC.
- A per-game rate limit on `/tts` cache misses; cache hits stay unlimited.
- The narrator voices only lines the scenario gives the narrator.

### What changed

- `InkTextValidator` no longer builds regexps. Each story's candidates are put once into a hash from match form to the story's text (cached per compiled file, rebuilt when the file changes), and a request is one lookup. A line that prints a value goes in only when every printed value is `player_name()`, filled with the name the caller passes; any other printed value (number, game state, string variable changed in play, unknown variable, other external function) keeps the line out. Glue runs stop at a piece that prints a value. `InkLineWalker::Unresolved` gained `slots` (the kinds of every printed value in the line, template or not), so a glued or retracted line with a value is caught too.
- The voiced text of a `player_name()` line is the ink's text with the server's name, never the request's spelling; the request only has to have the same match form.
- `TtsService.match_form` folds ASCII case only (`downcase(:ascii)`). U+017F (long s) and other Unicode case folds no longer match. U+212A (Kelvin sign) still matches "K", because NFC maps it to "K" (canonical equivalence, not case folding); the line voiced is the ink's.
- `TtsService::PLAYER_NAME_DEFAULT` ("Agent") is the name the server holds: nothing sets `gameState.playerName`, so the client prints this fallback. `GamesController#tts_player_name` returns it; the comment on the constant says what must change together if a real name is ever wired in. `PLAYER_NAME_VALUES` stays for the cache pruner only.
- Narrator: `spoken_as_npc_in_scenario` (lines the client voices as the narrator: `Narrator:` / `Narrator[...]:` prefix or a `#speaker:narrator` tag), then the narrator's own barks, then `Narrator:` lines of the stories the extractor can't place (`InkTextValidator.canonical(..., narrator_only: true)`). Another speaker's line is refused. A miss on m02 (15 stories) now costs about 0.1 ms once the indexes are built (85 ms the first time, which includes walking the stories); it was 124 ms per request.
- `TtsGenerationLimit`: at most 1,500 cache misses per game in a rolling hour, counted per server process, cache hits not counted. Over it, `/tts` answers 429 with `Retry-After` (a tagged line plays its untagged clip if there is one). Sizing: one game can only ask for its own scenario's lines; the largest has 1,195 (m10), m02 1,048, the rest under 610. Misses on a server with no key count too (they get no audio either way, 429 instead of 503).
- The cache pruner's "is this still requestable" check passes all of `PLAYER_NAME_VALUES`, so its results are unchanged.

### What this changes for real content

Every compiled story of m01 to m10 and lab_physical_pentest, every line the walker can't place: no line is newly refused. The only lines that print a value are seven `player_name()` lines, all still voiced (with "Agent"): `m02_phone_agent0x99.ink:102` and `:204`, `m03_phone_agent0x99.ink:99`, `:153`, `:177`, `:467` and `:493`. They already break the no-printed-variables rule (for the user to decide whether to reword them). No mission prints a number or string variable in a voiced line, and no glue run is broken. This is now a test (`tts_mission_lines_test.rb`), which also answers review finding 7.

A line whose speaker prefix is a string variable (`{npc_name}: What can I help you with?`, the test-only `generic-npc` ink) is still voiced from its fragment after the variable, the text the client sends once it strips the prefix. That text is the ink's, with no variable in it.

### Checks

- Key identity (`identity_check_mb.sh`, base `0ddb3ba93`): key dumps byte-identical, 8,481 rows (8,416 untagged, 65 tagged).
- Endpoint resolution of every batch line (8,218) and chatter line (263) through the round 1 chain, narrator rule included: all give the batch's key, none refused.
- Pruner dry run (`NO_WALK=1`): the same as before round 1 (one expected-line count in lab_tesseract_trials differs from the earlier scratch run, and the round 0 commit gives the new count too, so it is not this change).
- New tests: `:text` values, speaker slot, number values (including `1.5`, `-1`, `15`), player name other than the game's, Unicode case folds (long s, mathematical bold, non-ASCII capitals, `ß`), Kelvin sign, narrator refusing other speakers' lines and voicing its own `player_name()` line, the generation limit (429, cache hit not counted, every miss counted, rolling window), the per-story index rebuilt on a file change, and a property test: 2,400 lookalike mutations (U+017F, U+212A, fullwidth, Cyrillic and Greek letters, combining marks, invisibles, punctuation, ASCII case) of eight real requests, where every accepted request voices one of the base lines, its match form equals the base request's, and no cache key has two voiced texts.
- Full suites under the shared lock: Rails 1,471 runs, 0 failures, 0 errors, 1 skip; JS 483 of 483 files passed.

### Outcome of every round 1 finding

| # | Outcome |
|---|---------|
| 1 Major, `:text` slot | Fixed: a line with a `:text` slot is never voiced (speaker position included). Validator warning not added: the dialogue linter already flags printed variables in voiced lines. |
| 2 Major, case folding | Fixed: no regexp, ASCII-only folding in `match_form`, property test over lookalikes. |
| 3 Major, number slot | Fixed: a line with a number slot is never voiced, so no value reaches a key. |
| 4 Minor, narrator | Fixed: narrator lines only; per-story index bounds the cost of a miss. |
| 5 Minor, rate limit | Fixed: `TtsGenerationLimit`, 1,500 misses per game per hour, per process. |
| 6 Minor, tests | Fixed: the tests listed above. |
| 7 Minor, proof method | Fixed: `tts_mission_lines_test.rb` covers the non-batch paths; the batch checks were rerun. |
| 8 Nit, lookalikes in ink words | Fixed with 2 (no `IGNORECASE`). |
| 9 Nit, `player_name` | Fixed: the server's name only, with a comment on what must change together. |
| 10 Nit, glue siblings | Not changed: every joined text is the ink's own and printed values now end a run; at most a few unneeded clips. Recording the walker's real glue chains is a larger walker change. |
| 11 Nit, build log wording | Fixed: candidate 5 and the narrator line above. |

### Not done, for the user

- The seven `player_name()` lines above print a variable in a voiced line. They play with "Agent" today; rewording them would remove the last printed value in the missions.
- The rate limit is per server process, so with several workers the real cap is 1,500 times the worker count. A shared store would need the host's cache (the test environment uses a null store) or a new column, so it was left in process.
