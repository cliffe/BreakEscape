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
5. lines that print a value the server cannot know. `InkLineWalker` now records a template for such a line (`Unresolved#template`): the ink text around each value and the value's kind. A request must be that ink text around values of the right kind: `player_name()` takes only a name the client can print (`TtsService::PLAYER_NAME_VALUES`, the list the pruner already used), game state and arithmetic take a number, a string variable changed in play takes up to 32 plain ASCII characters. The voiced text is the ink's text with those values put in. This keeps the intent of the earlier user decision to let runtime values validate, without voicing free client text: the `:text` slot is the only request text ever voiced, it is ASCII so every voiced character is in the key, and it is bounded.

The narrator's text must now be a line of the scenario's stories (spoken as the narrator, else any story line).

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
