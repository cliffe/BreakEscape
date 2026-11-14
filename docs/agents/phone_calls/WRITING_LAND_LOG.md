# Phone calls writing land log

Brings the accepted writing review rounds on `build/phone-calls-writing` (tip 734b6e922; HaX writer R1 to R4, callers R1 to R4) onto main, mission by mission. Branch `build/phone-writing-land`, from main 896ec3cd8.

## Method

- The common ancestor of main and the writing tip is 39eedbb9a (A2b R1 fixes on `build/phone-calls`). The writing side changes 55 files: 16 new docs under `docs/agents/phone_calls/` and the phone ink, compiled JSON and four `scenario.json.erb` files for m01 to m10. No audio.
- Each ink and ERB was merged three ways (`git merge-file --diff3`, ancestor 39eedbb9a, main, writing tip). Every conflict and every main-only difference was traced to its main commit before deciding.
- Changed ink recompiled with `scripts/compile-ink.sh <mission>`; only the changed stories' JSON moved.
- The engine track's per-mission landings (f883591d8, 2a92e3de2, 1688a442c, 1002c920f, 5024fe152, 0fa40e812 and later R1 to R4 fix commits) had already taken nearly all of the writing rounds. What was left were the A7a R2 N1 text rewords in m02 and the R2 m6 hax_post line in m10, plus the docs.
- The writing branch is recorded as merged with `git merge -s ours` after the per-mission commits, so the merge adds nothing the commits below did not already decide.

## Per mission

| Mission | Came over | Kept from main | Judgement calls |
|---|---|---|---|
| m01 | nothing (already on main) | `#set_global:m01_first_ring_done:true` in `first_ring` (engine M8); `+ [On my way. #ending_check]` bracket form (M8 R2, 7a984280d); player_name removals (cc7c30e4f) | The `first_ring` conflict was both sides adding the same knot; main's copy is the writing copy plus the set_global. Took main. |
| m02 | R2 A7a N1 hub texts: "Copy. Call when you need me." to "Copy. Message me when you need me."; "Copy that. Call anytime, {player_name()}." to "Copy that. I'm here, {player_name()}." (fdb3c673d) | config untouched; `{player_name()}` stays, since m02 HaX has no call entry and these are text lines | None. Main never edited this ink after the fork. The validator's two "player can't call" warnings on these lines are gone. |
| m03 | nothing (already on main) | `callLabel`, `call` entries, revelation ring mappings, `revelation_ring_offered`, `extract_call` comments, PC hosts, validSprites | None. |
| m04 | nothing (already on main) | `on_anomaly_confirmed`: "ENTROPY are feeding the control room. That dial isn't on their network." | Conflict: writing R2 m3 had "ENTROPY feed the control room."; main's 57e29d189 (M4 R5 nit) re-keyed it to "are feeding" so it cannot be heard as an order. Both drop the third "screens"; main is the later, voiced decision. Took main. Vance ink already identical to the writing tip. |
| m05 | nothing (already on main) | Two later HaX rewords ("TalentStack's line is still open", dd2ba4ae5 M5 R2 n1; "That TalentStack number's still there"), Recruiter/Patricia call config | None. |
| m06 | nothing (already on main) | "Watching still works if we detain him." and the call-in task comment (96afeaa70, M10 R1) | None. |
| m07 | nothing (already on main) | `[(Hang up.)]` parenthesised stubs with no narration after (7fecbed08, 6b6394ae9); "Seattle will tell you in the morning" (2eff0b186); T-20 voicemail skips its naming line when T-10 folded it (2eff0b186); sign-off redirect line "And you moved them. Not everyone does." (c22f606bc) | Both conflicts were main having taken the writing block and then fixed it in engine R1 to R4. Took main. The callers R3 teacher-echo fix (5c6327184) is already on main. |
| m08 | nothing (already on main) | Hostile door-audit text "Call me when you've got both." (96afeaa70) | Conflict: writing R2 N1 changed "Call when" to "Message me when"; the engine track's M10 R1 m2 then made it "Call me" on purpose, because `agent_0x99` has a `call` entry (`hax_read_1`) so the call is real, and matched the KO text. Took main. |
| m09 | nothing (already on main) | Voiced-call host headers, "Conversation ended" wording, Nightshade's call-back branches (`cage_opened`, `nightshade_file_held`) | Conflicts were header comments and the later m2 call-back branches. Took main. Recruiter ink identical. |
| m10 | R2 m6 hax_post breach line: "Agent HaX: I'm on your phone now. Ring me." to "Agent HaX: From here I'm on your phone. Message me." (a1fbadd1a) | config untouched | Main never edited this ink. m10 HaX only rings the player (phone-chat mappings with `voiced: true`) and has no player-placed `call` entry, so "Ring me" promised a call the player cannot make. Landed. |
| docs | the 16 review and writer docs (`REVIEW_WRITER_HAX_R1` to `R4`, `REVIEW_WRITER_CALLERS_R1` to `R4` with outcomes, `WRITER_HAX_CALLS.md`, `WRITER_CALLERS.md`), carried with only dash and model-name edits | | Their text predates this land; the line tables in `WRITER_*` describe the writing tip, and the main-side decisions above supersede them where they differ. |

## Checks

- `scripts/validate_scenario.rb --no-graph`: m02 0 errors, 28 warnings (main 0 errors, 30; the two removed are the N1 "player can't call" warnings). m10 0 errors, 65 warnings (main 0 errors, 65; same findings).
- `node test/js/phone-*.test.mjs`: 52 of 52 pass (includes `phone-call-knots-parity`).
- `bin/rails test` on `tts_mission_lines_test.rb`, `tts_phone_text_variables_test.rb`, `tts_line_extractor_voicemail_test.rb`: 13 runs, 0 failures.

## TTS: lines whose clips no longer match

No audio generated. Counts from `bin/rails "app:break_escape:tts:wasted[<scenario>]"` (keyless) against the voiced-line extractor.

| Mission | Voiced lines changed | New voiced lines needing a clip | Orphaned clips | Notes |
|---|---|---|---|---|
| m01 | 0 | 0 | 0 | |
| m02 | 0 | 0 | 0 | Both lines are in the HaX text thread; m02 HaX is not a voiced call host. `wasted`: 0 of 1087 unrequested. |
| m03 to m09 | 0 | 0 | 0 | No text changed. |
| m10 | 1 | 1 | 1 | `hax_post` (Aoede, in person): new "From here I'm on your phone. Message me." needs a clip; `tts_cache/m10_full_disclosure/e8817b27926b470b490d8ff2c36c89b7.mp3` ("I'm on your phone now. Ring me.") is now unrequested. Not pruned. |

Total: 1 clip to generate (m10), 1 orphan to prune after it.

## R1 outcomes

Review: `WRITING_LAND_REVIEW_R1.md` (REVISE, 1 major, 1 minor, 3 nits).

- **M1** (dcc249934): every em and en dash is out of the seven copied docs. Dash-only table cells became `(new)` in old-text columns of `WRITER_HAX_CALLS.md` and `n/a` elsewhere (including rows whose new text is "unchanged"); headings and bold labels take a colon; prose asides take a comma, colon or parentheses; the six ranges read "X to Y"; quoted superseded ink takes a comma. `WRITER_CALLERS.md:253` now says "the VM-track agent". The table row above now says the docs were "carried with only dash and model-name edits".
- **m1** (dcc249934): `WRITER_CALLERS.md:306` "Judgement". The quoted validator text and old ink spellings are unchanged.
- **n2** (dcc249934): the 23 U+2212 minus signs are now ASCII `-`.
- **n1**: overtaken. The one m10 clip was voiced on its own (57ae308a7, coordinator's call with the user's approval): `tts_cache/m10_full_disclosure/237841eb748a3037039fb6eadb0c0568.mp3` (2.8 s, Aoede, `hax_post`), generated through `TtsService#generate` for that single extractor entry only. The old "Ring me." clip `e8817b27...` moved to `tmp/delete/`. `tts:wasted[m10_full_disclosure]`: 0 of 117 current-model clips unrequested. The rest of m10's unvoiced backlog is untouched.
- **n3**: no change, as the review advised.

Check: `grep -nP "[\x{2013}\x{2014}\x{2212}]"` and the model-name grep from the review over the 16 carried docs and this log find nothing. Across the whole `docs/agents/phone_calls/` folder both still hit files that were already on main before this branch (handovers, engine-sweep and mission reviews) and the R1 review, which quotes the dashes; those are outside this land.
