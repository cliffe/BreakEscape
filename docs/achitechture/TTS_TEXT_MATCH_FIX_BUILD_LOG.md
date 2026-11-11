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

Glued lines longer than 4 pieces, lines printing a value through a sequence or conditional, and string-variable lines whose value is not plain ASCII. None of these is in m01 to m10: the affected unresolved lines are in demo and hub inks (`netherton_hub`, `chen_hub`, `haxolottle_hub`, `instructor`) and test scenarios. m02 and m03 Agent HaX phone lines with `player_name()` still matched at this round; round 2 refuses them by design (see the round 1 correction below).

## Tests

- `test/controllers/break_escape/tts_text_match_test.rb` (new, 46 tests, fixture `test/fixtures/files/ink_line_walker/text_match_fixture.ink`): six lookalike scripts appended and prepended, single-letter substitutions, combining marks, words hidden behind bidi or zero-width marks, fullwidth (NFKC) forms, fragment-containing text, narrator free text, phone, object and bark lookalikes, bad `player_name` and number values, non-string text; nine invisible characters served as the ink's line; case and spacing; NFD to NFC; a tagged line with its note; `player_name`, number and glued lines; narrator, phone, object and bark lines voiced from the scenario; a clip served by the line's key without generation and not overwritten; generation under the line's key with the line's text in the sidecar; `match_form` itself. On the unfixed code 40 fail and 1 errors.
- Updated: `ink_text_validator_test.rb` (the fragment rule test replaced by template, known-value and glue tests), `tts_cache_pruner_test.rb` (a fragment-containing sidecar is now an orphan).
- Full suites (under the shared lock): Rails 1,455 runs, 0 failures, 0 errors, 1 skip; JS 483 of 483 files passed.

## Not done, for the user

- (Done before merge, user approval q24: both edits below are applied; see "Round 4 review outcomes".) Skill and doc wording: `tts-audio` could say "the server matches the text by `TtsService.match_form` and voices the scenario's own line"; `docs/agents/TTS_38_MIGRATION.md` line 11 (the fragment gap, "ignore for now") is now closed.
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

Every compiled story of m01 to m10 and lab_physical_pentest, every line the walker can't place: no line is newly refused. The only lines that print a value are seven `player_name()` lines: `m02_phone_agent0x99.ink:102` and `:204`, `m03_phone_agent0x99.ink:99`, `:153`, `:177`, `:467` and `:493`. (Corrected in round 4: they are text lines of a phone contact with no voiced call, which the game never sends to `/tts`, since a text thread voices only `voice:` messages. Round 2 refuses them by design, and no audio is lost. The earlier wording here said they were all still voiced.) No mission prints a number or string variable in a voiced line, and no glue run is broken. This is now a test (`tts_mission_lines_test.rb`), which also answers review finding 7.

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

- (Withdrawn in round 4.) The seven `player_name()` lines above are phone text, never voiced, and refused since round 2, so there is nothing to decide.
- The rate limit is per server process, so with several workers the real cap is 1,500 times the worker count. A shared store would need the host's cache (the test environment uses a null store) or a new column, so it was left in process.

## Round 2 fixes

Review: `TTS_TEXT_MATCH_FIX_CODE_REVIEW_R2.md` (no blockers, no majors). Commit `cfac02d57` and this log.

### What changed

- `TtsLineResolver` (new) holds the endpoint's whole line-finding chain, and `GamesController#tts` calls it, so the mission test runs the endpoint's own code. `TtsLineResolver.find_npc` is the NPC lookup the controller's `find_npc_in_scenario` now uses.
- An NPC voices only its own lines. In order: lines the scenario's stories voice as that NPC (`TtsLineExtractor#spoken_line`, the batch's own reading, co-speakers included); then lines of its own story that the extractor can't place (glue, a divert mid-line, `player_name()`) which the client would voice as that NPC (`TtsLineExtractor#voiced_as`, the same speaker rules with no tags); then its barks; then shared chatter. A story that hosts no voiced conversation is read whole with the same speaker rule. A phone contact's text conversation voices only its `voice:` messages, as the transcript after the marker (phone-chat-ui.js). Narrator lines, other speakers' lines and fragments of a line that prints a value are refused.
- The speaker prefix is never voiced. A request carrying the speaker's own prefix (`Kevin Park: ...`, `Narrator: ...`) is served the line without it, which is the batch's text, so no existing key changes. Another speaker's prefix finds nothing.
- `InkTextValidator` indexes each candidate under its whole form and its form without the prefix, maps both to the raw ink line, and picks the voiced text per request: `narrator_only` keeps `Narrator:` lines, `voiced_as` keeps the NPC's own, and the text after the prefix is returned. Single `^text` fragments and the "second colon" variant are no longer candidates. `placed: false` leaves out lines the walker places.
- The narrator branch is keyed on the id: `npc_id == 'narrator' && skipTextValidation`.
- Carried-over globals: `TtsLineExtractor` leaves every name in `importedGlobals` and every name `importGlobals` declares out of its variables and treats them as changed in play, so a line printing one stays unresolved and is never voiced (with the player's value or with the ink's default). Both the batch and the endpoint use this.
- `TtsGenerationLimit` prunes on a clock (at most once a minute) and drops a game whose newest stamp is older than the window, instead of pruning the whole map on every call past 10,000 games.
- `InkTextValidator.canonical` rescues `Errno::ENOENT` (a recompile replacing the file between reads) beside `JSON::ParserError`: the request gets 403, not 500. The separate `File.exist?` check is gone.

### What this changes for real content

- `tts_mission_lines_test.rb` now sends every line normal play voices in m01 to m10 and lab_physical_pentest through `TtsLineResolver` and compares keys: 5,547 host lines, 405 co-speaker lines, 643 narrator lines, 54 chatter lines, 527 barks and 2 unplaced lines (7,178 rows, about 3 s). None is refused and every key equals the batch's (for barks and chatter, the key of the scenario's own text). The batch and chatter rows are the same 6,649 the key dump lists for these missions; the reviewer's 8,449 counted a wider set.
- Only one voiced mission line set prints a variable: m08 Netherton's `suite_code` lines, now an explicit allow-list in the test. The test fails on any other voiced line that prints a variable, and on any carried-over global read as a constant.
- Lines voiced before and refused now, none of them in the batch: any NPC asking for the narrator's or another speaker's line in its own story, the prefixed form voiced with its prefix, fragments, and a non-call phone contact's ordinary text lines. The test-only `generic-npc` line whose speaker is a variable (`{npc_name}: ...`) is now refused, since its speaker is not known.
- Two controller tests set up requests the client never makes (a `Narrator:` line asked for as an NPC, and an unknown `Sarah:` prefix the client voices whole); they now give the NPC its own line and display name. The fixture's phone contact is marked as a voiced call, which is what its test describes.

### Checks

- Key identity against the branch base `0ddb3ba93` (`identity_check_mb.sh`): key dumps byte-identical, 8,481 rows (8,416 untagged, 65 tagged). Against `f86912dd4` (`identity_check.sh`): 8,408 of 8,416 untagged matched, as in round 1 (ink edits since that base).
- New tests: `tts_line_resolver_test.rb` (phone voice messages, a story with no voiced conversation, missing story, narrator rules on the id only), `tts_carried_globals_test.rb` with fixture `carried_global_fixture.ink` (the extractor and the endpoint refuse a line printing a carried-over global; the same line with an ordinary constant is voiced, so the guard is what refuses it), controller tests for own-prefix requests, narrator lines asked for by an NPC, other speakers' lines and prefixes, and fragments, validator tests for `voiced_as`, `placed: false` and the `Errno::ENOENT` race, and a limiter test for clock pruning.
- Full suites under the shared lock: Rails 1,490 runs, 0 failures, 0 errors, 1 skip; JS 483 of 483 files passed.

### Outcome of every round 2 finding

| # | Outcome |
|---|---------|
| 1 Minor, NPC voices every line of its story | Fixed: own lines only, prefix never voiced, fragments gone; proved over the missions by the full test (none refused, no key changed). |
| 2 Minor, imported string globals | Fixed: imported names left out of the extractor's variables and made dynamic; mission test for printed variables (allow-list `suite_code`, m08) and a fixture test. |
| 3 Minor, mission test | Fixed: the full check through the endpoint's own chain (`TtsLineResolver`), 7,178 rows, about 3 s. It reads the committed compiled JSON; the endpoint recompiles a newer `.ink` first, so a stale `.json` is still what the test sees. |
| 4 Nit, limiter pruning | Fixed: clock-based pruning, idle games dropped. |
| 5 Nit, narrator branch | Fixed: keyed on `npc_id == 'narrator'`. |
| 6 Nit, `Errno::ENOENT` race | Fixed: rescued, 403. |
| 7 Nit, glue siblings | Not changed, as in round 1: no mission story has a glue run. |

## Round 4: video calls (live proof regression)

Found by the live browser proof (keyless server, games 1211 to 1213): in m02, Ghost's video calls (`on_recovery_console`, `on_console_again`) got 403 for every Ghost line. Ghost is `npcType: "phone"`, and `TtsLineExtractor.voiced_call?` counted only `voiced: true` phone-chat mappings, so Ghost was not a host and `TtsLineResolver#own_story_line` treated it as a text contact that may voice only `voice:` messages. Main voiced these lines.

### Which client paths voice lines (read in the client)

- `npc-manager.js`: an eventMapping with `conversationMode: "video-call"` opens person-chat with `videoCall: true` for any npcType; a timedConversation with `videoCall: true` or that mode does the same (`scheduleTimedConversation`). Person-chat voices every NPC line it shows, narration as the narrator, with the line's `#delivery:` note, whatever `voiced` says, and follows every divert (no home-knot stop).
- `phone-chat` mappings and timed conversations voice only with `voiced: true`, only in the call's knots, no narration (unchanged).
- `person-chat` mappings open only for `npcType: "person"`, already hosts. The other person-chat openers (sprite interaction, the resume after an RFID or container tag) are for person NPCs or the conversation already open. `#transition_to_person_chat` is used by no scenario.

### What changed

- `TtsLineExtractor.voiced_call?` is now a voiced phone call (`voiced_phone_call?`, the old rule) or a video call (`video_call_mapping?`, `video_call_timed?`). Pretext outcome lines still need a voiced phone call.
- A phone host's lines come from its phone call knots (`call_knots`, read as the phone reads them) and its video call knots (`video_call_knots`, every knot reachable from each video call's target, read as person-chat reads them: narration as the narrator, `#delivery:` kept). The shared walk is `reachable_knots`.
- The batch gains these lines: m02 38 rows (Ghost 37, narrator 1), lab_tesseract_trials 47, chat_minigame_demo 7. None has a committed clip yet; a `tts-audio` top-up would generate them. No other key changes.

### Tests

- `tts_mission_lines_test.rb`: a new test builds every voiced conversation from the scenario's own mappings (not the extractor's host list): person-chat over a person NPC's story, video calls from their knots, voiced phone calls up to the home knot. It sends every line as the client does and requires the same text back, counts person-chat, video-call and phone-call rows (each must be above zero), and fails on a conversationMode it does not know. On the unfixed extractor it fails with every m02 Ghost video-call line refused.
- `ink_line_walker_test.rb`: a video-call mapping on a phone contact is voiced as person-chat voices it (narration included, a lookalike refused); a video call has no home-knot stop; timedConversation video calls count, and a voiced phone-chat timed call is still a phone call.

### Live proof (keyless, :3017, game 1220)

Ghost's scene fired through its real mapping (`object_interacted` with `objectType: "backup_recovery"` and the manifest global, as in the proof), then the second ask on the next console use. Every request answered 503 (accepted, no key): 30 Ghost lines and 1 narrator line across both calls. Crafted requests as Ghost got 403: the real line with a Cyrillic word appended, free text, and a misspelt line; the exact line got 503. Evidence: `tts-proof/m02-r4-session.jsonl` and `tts-proof/server-3017-r4.log` in the session scratch directory.

### Merge and suites

- Merged `main` (90 commits) into the branch; no conflicts (`games_controller.rb` merged cleanly).
- Full suites under the shared lock after the merge: Rails 1,541 runs, 0 failures, 0 errors, 1 skip; JS 486 of 486 files passed.

### Build log corrections

Round 1 said the seven `player_name()` lines were all still voiced and listed them as open. They are text lines of a phone contact with no voiced call, never sent to `/tts` by the game and refused by design since round 2; both places are corrected above.

## Round 4 review outcomes

Review: `TTS_TEXT_MATCH_FIX_CODE_REVIEW_R4.md` (approve; no blockers, no majors).

| # | Outcome |
|---|---------|
| 1 Minor, 14 unheard lab_tesseract_trials lines | Accepted, ink unchanged. `intro`, `waiting` and `who_reply` are reachable on paper from Ghost's video call, so their 14 lines are batch rows and accepted for Ghost. Reasons: the lines are the scenario's own text, keyed correctly; the cost is 14 clips once per voice in a lab scenario, with nothing refused or mis-keyed; a general stop rule would refuse lines person-chat really voices; and rewriting the trial's ink to dodge the walk is a content change for this branch to avoid. |
| 2 Minor, video-call note untested | Fixed: `tts_delivery_test.rb` "a phone contact's video-call lines keep their note, and only a tagged line's key has one" (tagged line keeps its note and keyed with it, untagged line has none and the plain key, narration keeps its note, the same knot as a voiced phone call has no note). It fails if `line_delivery`'s person-chat branch is removed or the old `!phone` rule comes back (both checked). The independent reachable walk in the mission test was not added. |
| 3 Nit, client `callStartKnots` | Fixed (one line): the client leaves out a `voiced: true` timedConversation that is a video call, as the server does. |
| 4 Nit, unknown-mode guard | Left: no scenario uses a timedConversation mode or `#transition_to_person_chat`; the guard needs more than a one-line change. |
| 5 Nit, status banners voiced | Left: a content question for the voice pass (tag as narrator, or accept). |
| 6 Nit, knot in both kinds of call | Left: no scenario has both kinds of call on one contact; the review says no fix is needed now. |

Also done on merge, with the user's approval (q24): the `tts-audio` skill now says the server matches by `TtsService.match_form` and voices the scenario's own line, and how a video call is voiced; `docs/agents/TTS_38_MIGRATION.md` line 11 marks the fragment gap closed.

## Handover

- State: round 4 fix done and committed; full suites green (counts in round 4).
- The real ceiling on paid generation per game: a game can only make the endpoint generate its own scenario's reachable clips, each once (a generated clip is cached for every game). With round 2 that set is the batch's lines, the untagged form of each tagged line, barks, chatter, `Narrator:` lines of every story and lines the walker can't place: 1,274 clips for m10, 1,145 for m02, under 640 for each other mission (lab_physical_pentest 269). Before round 2, m02 reached 1,553 (non-call phone stories and prefixed and cross-speaker variants), past the limit. Per game and per hour the cap is `LIMIT` 1,500 misses per server process, so with several workers 1,500 times the worker count, and a restart or a new game gives a new budget; but since every reachable clip is generated once and then served from the cache, the real ceiling for a mission across all games is its reachable set once per voice (plus retries after failed generations, which the per-game limit bounds).
- Open: glue siblings (nit 7); a shared store for the limiter. (The seven `player_name()` lines were listed here; they are non-call phone text, never requested by the game and refused by design, so they are not open.)
- Files: `app/services/break_escape/tts_line_resolver.rb` (new), `ink_text_validator.rb`, `tts_line_extractor.rb`, `tts_generation_limit.rb`, `games_controller.rb`, tests listed above.
