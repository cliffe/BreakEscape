# TTS text match fix: code review, round 2

Branch `build/tts-lookalike` against `main` (`git diff main...build/tts-lookalike`, head `22662310a`). Reviewer: fresh, independent, read-only on code. Ruby 2.7.8 throughout.

## What was checked

- Every file in the diff, with the round 1 review (`TTS_TEXT_MATCH_FIX_CODE_REVIEW_R1.md`) and the build log's round 1 section claim by claim.
- Single test files, each run alone: `tts_mission_lines_test.rb` (1 run, 19 assertions), `tts_generation_limit_test.rb` (3 runs), `tts_text_match_test.rb` (55 runs), `ink_text_validator_test.rb` (14 runs). All pass. `ruby -wc` on every changed `.rb` file: no Ruby 3 only syntax (`downcase(:ascii)`, `unicode_normalize`, the endless range and `Concurrent::Map#compute_if_absent` are all fine on 2.7); only old unused-variable warnings.
- Scratch probes through `bin/rails runner` in the test environment (scripts in the reviewer's scratch directory, not committed):
  - `TtsService.match_form` on 24 Unicode edge cases (U+212A, U+2126, U+212B, U+FB01, fullwidth, U+00B5, U+017F, U+0130, U+1E9E, superscripts, circled and Roman numerals, Arabic-Indic digits, NBSP, U+3000, ZWJ, tag characters, variation selectors, U+3164, U+034F, NFD, U+180E, U+2028).
  - For m01 to m10 and lab_physical_pentest: every batch entry and chatter row (8,449 rows) sent through a copy of the controller's chain (narrator, story, voice-only and object branches) with the batch's text as the request. Also: story paths outside the mission folder, and voiced scenario strings (barks, chatter, object voices) that differ between two `generate_scenario_data` runs.
  - Glue runs in every mission story; requests carrying the ink's own speaker prefix.
  - Size of `InkTextValidator`'s index cache once every mission story is indexed.
- No full suites, no browser, no paid TTS calls, no edits.

## Round 1 findings, verified in the code

| R1 # | Status | Evidence |
|------|--------|----------|
| 1 `:text` slot | Closed | `build_index` (`ink_text_validator.rb:84` to `:95`) adds an unresolved line only with no slots, or with a template whose slots are all `:player_name`. The fixture's `Ask {visitor} at the front desk.` and `{visitor}: ...` lines return nil for any value (probed). |
| 2 case folding | Closed | No regexp remains. `match_form` uses `downcase(:ascii)`; U+017F, U+1E9E and U+0130 keep their own form and match nothing. U+212A, U+2126 and U+212B still match K, Ω and Å, because NFC maps them (canonical singletons); the line voiced is the ink's, so this is harmless. |
| 3 number slot | Closed | A `:number` slot keeps the line out of the index. |
| 4 narrator | Closed for the narrator | `games_controller.rb:658` to `:671`: extractor lines for `narrator`, the narrator's barks, then `Narrator:` lines only (`narrator_only: true`). See new finding 1 for the reverse direction. |
| 5 rate limit | Closed, with limits | `TtsGenerationLimit`, called only on a cache miss (`games_controller.rb:751`). Per process, per game; see the answers below. |
| 6 tests | Closed | The new controller tests cover `:text`, speaker slot, numbers, case folds, Kelvin sign, narrator refusals and the limit. |
| 7 proof method | Partly closed | `tts_mission_lines_test.rb` covers only lines the walker could not place (finding 3). The batch-line check is still a scratch script; my own re-run of it agrees with the build log (0 refused, 0 key changes). |
| 8 lookalikes in ink words | Closed | Follows from 2. |
| 9 `player_name` | Closed | `PLAYER_NAME_DEFAULT` filled by the server; the comment on it names what must change together. |
| 10 glue siblings | Open, accepted | No mission story has a glue run at all (0 in 137 compiled stories of m01 to m10 and the lab), so this touches demo and test inks only. |
| 11 build log wording | Closed | Candidate 5 and the narrator line are correct now. |

Every one of the 8,449 mission rows is accepted and keys exactly as the batch does. No mission story lives outside its mission folder, and no voiced scenario string varies between games. The index for every mission story (118 stories) is about 3.9 MB.

## Severity table

| # | Severity | Area | Finding |
|---|----------|------|---------|
| 1 | Minor | Story candidates | An NPC voices any line of its own story: other speakers' lines, `Narrator:` lines, and each line again with its speaker prefix spoken aloud |
| 2 | Minor (latent) | Extractor variables | Imported string globals are player-written text, and the extractor resolves lines that print them with the game's value |
| 3 | Minor | Tests | `tts_mission_lines_test.rb` checks 19 unplaced lines; the 8,449 normal lines and every non-story path are untested over the missions |
| 4 | Nit | Rate limit | Idle games' stamps are kept until 10,000 games are tracked, after which every allowed call prunes the whole map under the lock |
| 5 | Nit | Narrator branch | `skipTextValidation` is honoured on any NPC, not just the narrator |
| 6 | Nit | Index read | `File.exist?` then `File.mtime` can raise `Errno::ENOENT` (500) if a recompile replaces the file between them |
| 7 | Nit | Glue | R1 nit 10 stands (demo and test inks only) |

No blockers, no majors.

## Findings

### 1. Minor: an NPC voices every line of its own story, prefixes included

`app/services/break_escape/ink_text_validator.rb:104` to `:116` (`add_line`), reached from `games_controller.rb:684`.

`add_line` indexes the whole raw line, the line without its prefix, and the line without a second prefix, and returns the variant matched as the text to voice. `InkTextValidator` does not look at who speaks a line. So with `npc_id` set to the story's host:

```
"Narrator: The lights hum overhead."            => voiced "Narrator: The lights hum overhead."   (Kevin's voice)
"The lights hum overhead."                      => voiced in Kevin's voice
"Kevin Park: The server room is down the hall." => voiced with "Kevin Park:" spoken
```

(fixture, probed). In the missions, 6,491 lines of 137 stories are returned with their prefix when the request carries it; one example is `m07_npc_ray_hollis.json`, `Narrator: He clocks you at thirty feet...`, voiced in Ray's voice. Round 1 stopped the narrator voicing other speakers; the reverse, any NPC voicing the narrator's lines and its co-speakers' lines, is still open. Fragments of a line that prints a value are also voiced alone (`"Ask"`, `"at the front desk."`).

Every text is still the ink's own and every variant has its own key (the voice name and the spoken prefix are in it), so nothing is poisoned. The cost is that the set of clips a player can force is about two to three times the batch's per voiced NPC, plus cross-speaker clips, all paid and kept on disk. That multiplies the ceiling the rate limit's sizing comment relies on (see the rate limiter answer below).

Fix: index only what the client sends. For a line with a speaker prefix (`InkLineWalker.split_prefix`), index the full form but map it to the text without the prefix, so the prefix is never voiced. Then make a story line count for `npc_id` only when the extractor attributes it to that speaker: try `spoken_as_npc_in_scenario` first, and keep `InkTextValidator` as the fallback for lines the extractor cannot place, with lines carrying another speaker's or the narrator's prefix left out of that fallback. Add a controller test: Kevin's request for `"The lights hum overhead."` and for `"Kevin Park: ..."` gets 403, or is served the unprefixed line.

### 2. Minor (latent): imported string globals reach voiced lines through the extractor

`app/services/break_escape/tts_line_extractor.rb:61` and `:415`, with `app/models/break_escape/carry_over.rb` (`resolve_imported_globals`) and `app/models/break_escape/game.rb:296`.

`merge_global_variables!` stores any value the client syncs for any global name. A source mission's exported string global (m01 `final_choice`, m03 `victoria_fate` and `danny_fate`, m05 `final_choice`, m07 `team_assignment`) is then copied into the next game's `scenario_data['globalVariables']` at creation, when the type matches (any string matches a `""` default). `TtsLineExtractor` walks the stories with those variables, and an imported name is never reassigned in the reading mission's ink, so the walker treats it as a constant and resolves a line that prints it with the player's string. `spoken_as_npc_in_scenario` would then accept and voice that line: request text, by way of the previous mission.

No mission ink prints an imported global today (they appear only in choice conditions, for example `m09_phone_agent0x99.ink:456`), so nothing is exposed now. The guard that would catch a future line is missing on both sides: `InkTextValidator` reads the same line as resolved (the ink's `""` default, no slot), and `tts_mission_lines_test.rb` only inspects unresolved lines, so a line printing an ink-constant string VAR never reaches its `printed` list. The build log's reason for skipping a validator warning ("the dialogue linter already flags printed variables") was not verified here: the linter excuses constants (`dialoguelint.mjs:683`), and an imported VAR is constant in the reading mission's ink.

Fix: in `TtsLineExtractor#initialize`, leave out of `@variables` every name in `scenario_data['importedGlobals']` (or pass them in `dynamic`), so such a line is unresolved and never voiced. Add a test over the missions that walks each story with the scenario's variables and fails on any voiced line that prints a variable outside an allow-list (today `suite_code` in m08 only).

### 3. Minor: the mission test does not cover the paths normal play uses

`test/unit/break_escape/tts_mission_lines_test.rb`.

The test checks unplaced lines (19 assertions in total) and asserts no unplaced line prints a value. It never sends a resolved line, a co-speaker line, a narrator line, a bark, chatter or an object message through the endpoint's chain, and never compares keys. A regression in `match_form`, `spoken_line`, `narrator_line_in_scenario_stories`, `canonical_shared` or the branch order in `GamesController#tts` would pass it, while every mission line went silent. It also reads committed compiled JSON, so a stale `.json` next to an edited `.ink` is what gets tested.

Fix: turn the batch check into the test. For each mission, build `TtsLineExtractor#entries` plus `each_chatter_line`, send each row's text through the controller's own chain (extract the branch logic of `GamesController#tts` into a service method both use, so the test cannot drift from it), and assert the line is found and `TtsService.normalize_text(line) == TtsService.normalize_text(text)`. My scratch version of this ran all 8,449 rows in about 4 seconds. Add finding 2's printed-variable check to the same test.

### 4. Nit: stamp retention and pruning in the rate limiter

`app/services/break_escape/tts_generation_limit.rb:32` and `:58`.

A game's stamps stay in memory until that game asks again or more than 10,000 games are tracked. Floats are immediates on 64-bit Ruby, so a full game costs about 12 KB and the bound is about 120 MB per process at worst; realistic use is far lower. Once more than 10,000 games are live within the hour, every allowed call runs `prune` over the whole map while holding the one mutex. Fix: prune on a clock (for example at most once a minute) rather than on size, and drop a game whose newest stamp is older than `WINDOW`.

### 5. Nit: the narrator branch keys on a flag, not the id

`app/controllers/break_escape/games_controller.rb:658`. Any NPC carrying `skipTextValidation: true` gets the narrator's rules, including voicing every `Narrator:` line of every story in its own voice. Only the 15 top-level narrators carry it today. Fix: `if npc_id == 'narrator' && npc['skipTextValidation']`, or drop the flag and key on the id.

### 6. Nit: a recompile between the exists check and the read

`app/services/break_escape/ink_text_validator.rb:44` and `:49`. `File.exist?` then `InkLineWalker.cached_for_file` (which calls `File.mtime` and reads). If the file is replaced or removed in between, `Errno::ENOENT` is not rescued and the request gets 500; a half-written file gives `JSON::ParserError`, rescued as a 403 for that one request. Fix: rescue `Errno::ENOENT` beside `JSON::ParserError`.

### 7. Nit: glue across sibling branches

Round 1 nit 10 is unchanged. No mission is affected (0 glue runs), so this can wait for the walker change the build log names.

## Answers to the brief's questions

- **Non-scenario text voiced**: no path found in the current content. Unicode edge cases only select a line: U+212A, U+2126 and U+212B match by NFC equivalence and are served the ink's line; every compatibility form (fullwidth, ligatures, superscripts, circled and Roman numerals, U+00B5, Arabic-Indic digits) keeps its own form and is refused. Invisibles (ZWJ, tag characters, U+180E, separators) drop out and are served the ink's line. Variation selectors and U+034F are kept as marks and refused unless the ink has them. Delivery notes come from the ink (`ink_delivery_note` runs on the scenario's `line`). Phone lines, barks, chatter and object voices return the scenario's string. Cross-scenario: every candidate comes from the game's own `scenario_data` and its stories, all inside the mission folder. The one latent route is finding 2.
- **Two texts, one key**: not through the request. Slot values are gone, and the voiced text is always one ink string per match form (`index[form] ||=`, first wins). Two ink lines that differ only in non-ASCII letters would share a key as before this branch; none was found in the missions (no row's key changed).
- **Speaker-prefix variables in generic-npc**: `{npc_name}: What can I help you with?` is never voiced whole; its fragment `: What can I help you with?` is, and that is the ink's text.
- **Rate limiter**: per process, so with several Puma workers the cap is 1,500 times the worker count, and a restart resets it; the build log says so. One player cannot touch another player's game (`GamePolicy#tts?` is owner, admin or the player's account manager), but a new session is a new game with a new budget. What bounds the cost is that only the scenario's own lines can miss, and each misses once; finding 1 is what widens that set. On a keyless server the count only turns 503 into 429 after 1,500 misses an hour; the client treats both as "no audio", and cached and stand-in clips are served before the limit is consulted.
- **Index**: built once per story file and per `(player_names, narrator_only)` pair, at most three pairs today; rebuilt when the walker is (mtime and size); `Concurrent::Map#compute_if_absent` makes concurrent first requests safe (a race on the outer entry only rebuilds once more). About 3.9 MB for all mission stories.
- **Normal play**: all 8,449 batch and chatter rows of m01 to m10 and lab_physical_pentest are accepted with unchanged keys (scratch check, finding 3 asks for it as a test). The seven `player_name()` lines voice "Agent".
- **Ruby 2.7**: no Ruby 3 only syntax.

## Verdict

Approve, with two cheap changes before merge: finding 2 (leave imported names out of the extractor's variables) and finding 3 (the mission test sends every normal line through the endpoint's chain). Finding 1 can be a follow-up, but name it in the handover, since it is what decides the real ceiling on paid generation. The nits can wait.
