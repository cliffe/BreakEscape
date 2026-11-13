# Review: A7a (validator check, dialoguelint rule), round 3

Reviewer: Opus, 2026-11-12. Work under review: 721899a30 (the R2 fixes) and 68cadad4a (`test-phone-terminal/handler.ink:15` reworded), on `build/phone-calls`. Scope: `scripts/validate_phone_calls.rb`, `scripts/validate_scenario.rb` (the hook), `scripts/ink_runtime_check/dialoguelint.mjs`, `test/js/validator-phone-calls.test.mjs`, `test/js/dialoguelint.test.mjs`. Read against plan 3, 4.3, 4.4, `REVIEW_A7a_R2.md`, its outcomes, the baseline's "Round 2 update" and `app/models/break_escape/carry_over.rb`.

How I checked, all in scratch copies, so nothing compiled into either tree:

- Two trees: this branch's working tree, and `build/phone-calls-writing` at **734b6e922** (`git archive`), each with this branch's `scripts/` copied over.
- Validator (`--no-graph`) over all 177 scenarios on each tree. A wrapper logged the matched span of every call-promise hit, so each hit could be judged on its actual words, not on the 80-character excerpt in the warning.
- `dialoguelint.mjs --json` over every scenario folder on each tree.
- Rendered JSON (`-o`) for all 177 scenarios on each tree, compared with `scenarioInfo`'s home-knot guess for every NPC record.
- Mutation runs, one at a time: I broke each fix in a copy of the scripts and ran the two test files.
- `flock /tmp/be-test-suite.lock bin/test-js` in the worktree.

## Verdict: accept

Every R2 finding is fixed and every fix but one detail has a test that fails when it is undone. N1 has no false positives on either tree. N2 matches `CarryOver.import_name` wherever the difference could matter. The two minors below are latent, with no hits in either tree, and the nits are optional.

## Results

**`bin/test-js`:** 507 files passed, 0 failed (507 total). This ran after the last pattern change, against the worktree as it stood, A2c's in-flight edits included.

**`lab_social_engineering`:** no phone-call lines and no lint hits on either tree. **`test_phone_calls`:** clean on this branch (0 and 0). On the writing branch it still shows the old fixture's `legacy_voiced.ink:8` "Ring me", which clears on merge.

| Tree | Phone-call lines | Errors | Lint hits |
|---|---|---|---|
| This branch | 92 (93 at R2; `test-phone-terminal` reworded) | 0 | 30 |
| Writing branch (734b6e922) | 77 | 11 (`#place_call` with no `call` entry, as before) | 3 (m10 `:302`, `:763`, test_finale `hax_call.ink:15`; all clear on merge) |

No scenario crashed the validator on either tree.

## N1: call promises

**No false positives on either tree.** The logged hits that match only the new patterns (not "call/ring/phone me"):

- This branch: m01 ×5 ("Call anytime", "Call if you hit a wall", "Call if you get stuck", "Call if you hit anything unexpected", "call if you need a steer"); m02 ×2; m03 ×2; m04 "Call when you've got something", "Call it in when you have something"; m05 HaX "Call when you have something", "Call back when you're sure" ×2, Patricia "Ring back when you're sure" ×2; m06 "Call anytime" ×2; m08 "Call when you've got both".
- Writing branch: Patricia "Ring back when you're sure" ×2, and `test-phone-terminal/handler.ink:15` "Call if you need anything" (the writing branch doesn't have 68cadad4a yet; it clears on merge).

Every one asks the player to call a contact who has no `call` entry. The excuses hold up on the real data: "I'll ring ...", "your call", "on the phone" and choice brackets produce nothing.

**Tests fail on regression.** Each of these mutations fails test "N1" (or the older call-me test): dropping `call back`, dropping `call it in`, dropping `anytime`, ignoring the excuses, dropping `SELF_RING` from the excuses, dropping `CALL_NOUN`, reverting `message_texts` to `CALL_ME` only, reverting the ink scan to `CALL_ME` only, and no longer stripping choice brackets. The one mutation that survives is removing `phone` from `CALL_ME` (nit 1).

## N2: undeclared `globalVars.X`

**Mirror of `CarryOver.import_name`:** the order and logic match: `completed` (when the key is present), then `as`, then the `(m|sis)NN_` prefix plus `var`. The differences are all edge cases that cannot matter:

- Blank and whitespace handling: `presence` and `present?` against `to_s.empty?`. A whitespace-only `as` or `completed` makes a name that `globalVars\.(\w+)` can never match.
- `resolve_imported_globals` also skips an entry whose `from` is not a string. The validator's own carry-over check already errors on that (`validate_scenario.rb:5256-5257`), so the scenario fails validation anyway.

Mutations: dropping the `completed` branch, the `as` branch, the `setGlobal` walk, the `#set_global` scan, the `call.when` error, the mapping-condition warning or the VAR hint each fail an N2 test. Dropping the `importedGlobals` keys passes (nit 2).

## N3, m1–m4

| Item | Status | Fails if undone? |
|---|---|---|
| N3 "the line stays quiet", "you read it back to her" | Fixed | Yes, both patterns (test N3) |
| m1 spread stops at knots the home knot reaches | Fixed (`dialoguelint.mjs:176-191`) | Yes (test m1) |
| m2 `home` plumbing | Tests added for `lintInk`, `structureFindings`, `scenarioInfo` and the CLI | Mutation-checked by the fixer; I did not repeat it |
| m3 INCLUDE'd functions | Fixed (`f()` diverts of the compiled ink) | Yes (test m3) |
| m4 empty `npcIds` | Fixed | Yes (test m4) |

## The `scenarioInfo` window (fixer's note): not worth fixing now

The concern is real: a contact with no `currentKnot` can take a neighbour's from within 1500 characters, and `npcType` and `displayName` are found the same way. But the data shows no exposure:

- Phone records: the guess matches the rendered `currentKnot` for all 70 on this branch and all 67 on the writing branch. Only 3 phone contacts have no `currentKnot`, and none of their inks has a `// lint: call-knot` mark.
- Person records: 50 mismatches per tree. 49 come from m10 files that many NPCs share (one `storyPath` with up to ten different homes), so no single guess can be right for all of them. The other is lab_tesseract `npc_cliffe`. None of these inks has a mark.
- `home` is read only by `callKnotSet`, and that returns an empty set for a file with no marks. A wrong home changes nothing unless the file has a call mark.
- When it does go wrong, the result is a quieter lint (the spread can pass a home it doesn't recognise), never a false hit.

If it is picked up later, a cheap fix is to give each `currentKnot` only to the `storyPath` nearest to it, and default to `start` otherwise.

## Minors (latent, no hits today)

### m1. Someone else's call back still warns

`validate_phone_calls.rb:25-27`. `SELF_RING` covers only "I'll/we'll/she'll/he'll/they'll/I'd" before the verb. These warn: "Tell him to call back.", "Did she call back?", "If they call back, stall.", "Ask Dev to ring back once he has it.", "We will call back." and "It is a judgement call if ever there was one." None appears in a phone ink or text on either tree. If one turns up, widen the excuse to a subject pronoun or name before the verb (`\b(?:he|she|they|we|it|\w+ to)\s+(?:call|ring|phone)\s+back\b`) and add a few adjectives to `CALL_NOUN` ("judgement", "phone", "conference").

### m2. N2 knows fewer setters than the rest of the validator

`known_globals` (`:64-89`) collects `setGlobal` hash keys and `#set_global` tags. It misses `setGlobalOnStart` and `globalVarOnKO` (string values), `setGlobal` in its string form, a note's `setVariable`, `applyActions` `set_global` and `#set_variable`. `check_globals_never_read` (`validate_scenario.rb:4735-4760`) already lists all of these. The engine writes a `setGlobalOnStart` name into `window.gameState.globalVariables` even when it is undeclared (`npc-manager.js:2165-2166`). So a `call.when` reading such a name would be a false **error**. Today the corpus has 91 `setGlobalOnStart` and `globalVarOnKO` setters, every one for a declared name, so nothing fires. Fix: widen the walk to the same key set (`k =~ /\AsetGlobal/` or `globalVarOnKO` with a string value, `setVariable` hash keys, `type: "set_global"` nodes, and `#set_variable:` tags).

## Nits

1. `CALL_ME` "phone me" is untested: "Phone me when ..." also matches `CALL_PROMISE`, so removing `phone` from `CALL_ME` fails nothing. Add a bare "Phone me." positive.
2. The `importedGlobals` keys branch of `known_globals` (`:68-69`) has no test.
3. Plan 4.3's call-me bullet (`PHONE_CALLS_PLAN.md:626`) still says `\b(call|ring) me\b`; R2 asked for the wider wording.
4. `carry_over_name` repeats `carry_over_import_name` (`validate_scenario.rb:5028-5035`), and the two already differ slightly (`as` must be a String in one of them). Either use one, or comment that this copy mirrors the model rather than the validator.

## Writing branch

Nothing new for the writers from this round. The N1 lines listed in the baseline's Round 2 update still belong to the same slices. The writing branch now shows only Patricia's two "Ring back when you're sure" lines (until her `call` entry lands) and the `test-phone-terminal` line, which clears on merge.
