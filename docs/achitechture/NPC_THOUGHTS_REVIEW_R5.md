# NPC thoughts flag, round 5 final review (HEAD a50a19149)

Counts: B 0, M 0, m 0, n 0. Verdict: ready for a train. Paths are relative to the worktree p-npc-thoughts.

## Scope

- Delta since the R4 review (R4 covered ee03e77ec..166f53ab9): the main merge 7c3e1fc32 and the R4 commit a50a19149.
- a50a19149 touches two docs only: NPC_THOUGHTS_REVIEW_R4.md (new) and NPC_THOUGHTS_REVIEW_R3.md (six lines added under the proof table, "Reading the table"). No code.
- Main merge 7c3e1fc32: what main brought is the field-labels work (minigame CSS and JS under public/break_escape/css and js/minigames, plus minigame-field-labels, minigame-html-sweep-c, minigame-title-escape and network-view tests) and TTS cache. None of it touches npc-action-icons.js, npc-needs.js, the scenario flag, the validator or the thought tests.

## Tests

- bin/test-js: Files: 750 passed, 0 failed, 750 total.
- Validator (scripts/validate_scenario.rb on each scenario.json.erb): m01_first_contact 0 errors (19 warnings), m02_ransomed_trust 0 errors (33), sis01_healthcare 0 errors (17), test_npc_thoughts_off 0 errors (2).

## R4 minors, checked

- m1 (proof heading and the player-is-walked caveat): R3.md now says under the table that a picture count means a bubble was in view with the player near. Addressed.
- m2 (start y and turns not in the table): the new text says they live in each run's summary JSON under tmp/ and are not copied into the doc. Honest wording; the evidence is out of the repo, which is acceptable for a proof note.
- m3 (idle rows versus the valid-run rule): the new text says the rule applies to reruns from now on and idle rows are reported as they ran. Addressed.

## Whole-branch sanity pass

- Flag read: `npcThoughtsOn` (npc-action-icons.js:356) is `scenario?.npcThoughts !== false`, so an absent flag, null or true leaves behaviour unchanged. The same test is used for picture chat (npc-needs.js:5567 and `_thoughtsOn` at 4414). Both fall back to on when the hook is missing.
- Icons and thought bubbles: npc-action-icons.js:583 returns early when the flag is off, before showPressingNeeds is consulted.
- Picture chat: `chatterPool` (npc-needs.js:288, 296) takes `thoughtsOn` as a parameter defaulting to true, and every caller in npc-needs.js (1001, 2123, 2135, 2183, 2285, 2384, 2918, 3009, 4747) passes `this._thoughtsOn()`. The failure-mutter path (2257) is covered, so a mutter with no spoken line shows nothing when off.
- Scenarios: `"npcThoughts": false` is present in m01 to m10, sis01, sis02, sis03 and the test scenario (14 files), and nowhere set to true. No other scenario sets it.
- Validator and schema: validate_npc_needs.rb:1082 rejects non-boolean values and warns when showPressingNeeds or actionIcons is set alongside false; scripts/scenario-schema.json:224 documents it. Tests exist for the flag, the pictures and the validator (npc-thoughts-flag, npc-thoughts-pictures, validator-npc-thoughts).
- Not affected, as documented: barks, speech bubbles, spoken chatter lines, conversation UI, held items.

## Findings

None at any level.

## Unchanged caveats (not findings)

- The live proof counts come from a script that walks the player beside a picture speaker, and idle runs are reported as they ran; both are stated in R3.md.
- No flag-on m02 picture count exists (admitted in R2). The flag-absent path is covered by unit tests and the control scenario, not by a live m02 run.
- OUT_DIR in tools/playtest/npc-thoughts-proof.mjs remains an unchecked opt-in env override (R3, accepted).
