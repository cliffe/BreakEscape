# TTS text match fix: code review, round 3

Branch `build/tts-lookalike`, head `25635882f`. Focus: `git diff 076e5ca3d build/tts-lookalike` (round 2 fixes), with a regression skim of `git diff main...build/tts-lookalike`. Reviewer: fresh, independent, read-only on code. Ruby 2.7.8 throughout.

## What was checked

- Every file in the round 2 diff, the new `app/services/break_escape/tts_line_resolver.rb` line by line, and the round 2 review (`TTS_TEXT_MATCH_FIX_CODE_REVIEW_R2.md`) and build log claim by claim.
- The client's TTS requests, read in `public/break_escape/js`: `api-client.js` (`getTTS`, the only `POST /tts`), `systems/tts-manager.js`, person chat (`person-chat-minigame.js:1683` to `:1733`, play and preload), phone text threads (`phone-chat-ui.js:810` to `:875`, `playVoiceMessage` at `:334`), voiced calls (`phone-chat-minigame.js:933` and `:947`, `phone-call-voice.js` `phoneLineVoice` and `outcomeLineVoice`), barks (`npc-barks.js:383`, the three `showBark` sites in `npc-manager.js` at `:1553`, `:1641`, `:2048`), chatter, exchanges and office phone calls (`npc-needs-chatter.js`, `npc-needs.js:3426`), and simple phone objects (`utils/phone-message-converter.js`).
- Single test files, each run alone, all green: `tts_mission_lines_test.rb` (4 runs, 39 assertions), `tts_line_resolver_test.rb` (4), `tts_carried_globals_test.rb` (4), `tts_generation_limit_test.rb` (4), `ink_text_validator_test.rb` (17), `test/controllers/break_escape/tts_text_match_test.rb` (59), `tts_controller_test.rb` (59), and for regressions `tts_cache_pruner_test.rb` (16), `tts_wasted_clips_test.rb`, `tts_spoken_text_test.rb`, `tts_delivery_test.rb` (23).
- `ruby -wc` on every changed `.rb` file: Syntax OK. No Ruby 3 only syntax (`filter_map`, the endless range in `split_prefix` and `keyword_init:` structs are all 2.7); one old unused-variable warning at `games_controller.rb:2632`.
- Scratch probes through `bin/rails runner` in the test environment (reviewer's scratch directory, nothing committed, no database writes, no paid calls):
  - Paths the mission test does not enumerate, through `TtsLineResolver` as the client would ask: phone `voice:` messages (text and voiced-call contacts), knot barks of person NPCs, exchange and office phone-call knot lines. Over m01 to m10 and lab_physical_pentest, then over every scenario that renders.
  - The batch rows again, against scenario data built by the game's own pipeline (`Game#generate_scenario_data`, with `inject_player_preferences` and `prepare_scenario_data!`) instead of a raw ERB render.
  - Lines on the `InkTextValidator` paths (Narrator: lines of every story, non-host stories) that print a variable read as its ink default.
  - Stale compiled JSON: every mission `.ink` against its `.json`, by mtime and by last commit time.

## Round 2 findings, verified in the code

| R2 # | Status | Evidence |
|------|--------|----------|
| 1 NPC voices every line of its story | Closed | `tts_line_resolver.rb:118` to `:127` strips only the NPC's own prefix and serves the batch's text; `own_story_line` (`:137` to `:168`) keeps only lines `TtsLineExtractor#voiced_as` gives this NPC; `ink_text_validator.rb:433` to `:444` picks the voiced text per request, with no fragments and no second-colon variant. New controller tests cover own prefix, narrator lines, other speakers' lines and prefixes, and fragments. |
| 2 imported string globals | Closed | `tts_line_extractor.rb:54` to `:63` (`imported_names`) and `:75` to `:78`: names in `importedGlobals` and `importGlobals` are out of `@variables` and in `dynamic_variables`. Fixture test and a mission test check both. |
| 3 mission test | Closed, two gaps | The test now calls `TtsLineResolver#resolve`, the class `GamesController#tts` calls (`games_controller.rb:656`), and compares keys. Gaps: stale JSON and test-only scenario data (finding 1). |
| 4 limiter pruning | Closed | `tts_generation_limit.rb:40` prunes at most once per `PRUNE_EVERY` and drops games idle for a whole window; monotonic clock. |
| 5 narrator flag | Closed | `tts_line_resolver.rb:35`: `npc_id == 'narrator' && npc['skipTextValidation']`. Test at `tts_line_resolver_test.rb:63`. |
| 6 ENOENT race | Closed | `ink_text_validator.rb:446` rescues `JSON::ParserError`, `Errno::ENOENT` and `Errno::EISDIR`; the separate `File.exist?` is gone, so a missing file is a 403 (a missing story file is still 404 at `tts_line_resolver.rb:47`). |
| 7 glue siblings | Open, accepted | Unchanged; no mission story has a glue run. |

## Does the resolver match every voiced client path?

| Client path | What it sends | Resolver branch | Result |
|-------------|---------------|-----------------|--------|
| Person chat, host's own line | conversation id, line after a two-word prefix strip | `spoken_line` | Accepted (5,547 rows in the mission test) |
| Person chat, co-speaker with a voice | co-speaker id | `spoken_line` | Accepted (405) |
| Person chat and cutscenes, narration | `narrator` | narrator branch | Accepted (643) |
| Voiced phone call lines and pretext outcomes | contact or co-speaker id, `phoneLineVoice` text | `spoken_line` (call knots, `each_pretext_outcome_line`) | Accepted (in the batch rows) |
| Phone text thread, `voice:` message | contact id, transcript after `voice:` | `own_story_line` phone branch | Accepted (unit test); no scenario has one today |
| Phone text thread, ordinary text | nothing | refused | Nothing lost, see below |
| Barks (eventMappings, timedMessages) | NPC id, `phoneBarkText` | `ScenarioBarkValidator.canonical` | Accepted (527) |
| Knot barks of person NPCs | NPC id, first NPC line of the knot | `spoken_line` | Accepted (no mission uses one) |
| Chatter pools | NPC id, pool line | bark or shared chatter | Accepted (54) |
| Exchanges and office phone calls | speaker id, text after prefix | `spoken_line` | Accepted (3 mission lines, 22 over all scenarios, 0 refused) |
| Simple phone objects (`ttsVoice`) | object id, `voice` string | object branch | Accepted (in the batch rows) |

Phone contacts, checked in the client. A non-call contact's ordinary text lines were never voiced. `phone-chat-ui.js:821` makes a line a voice message only when the contact's line starts with `voice:`, and only a voice message's play button calls `playVoiceMessage` (`:875`), which is the thread's only TTS call. Text lines go to the typewriter or a plain bubble, and narration is a muted `div` (`:828` to `:838`). Call audio runs only when `isVoicedCall(this.params)` (`phone-chat-minigame.js:933`) and only for the call's own knots (`:947`). Phone barks are never voiced: every `showBark` passes `useTTS: npc.npcType === 'person' && !!npc.voice` (`npc-manager.js:1553`, `:1641`, `:2048`). Refusing those lines therefore loses no audio. Of the 1,652 text-contact lines in the missions, 13 (m01 `m01_phone_agent0x99.json`) print a variable, and the refusal covers those too.

The game-pipeline probe sent all 6,595 batch entries of the eleven missions through the resolver with data built by `Game#generate_scenario_data` (not saved): none refused, every voiced text equal to the batch's after `normalize_text`.

## Severity table

| # | Severity | Area | Finding |
|---|----------|------|---------|
| 1 | Minor | Mission test | Nothing catches stale compiled JSON, and the test's story lookup and scenario data are copies of the controller's, not the same code |
| 2 | Minor (latent) | Voice messages | The `voice:` rule is keyed on `npcType == 'phone'`; any other record's voice message is refused or voiced with `voice:` read aloud, where main voiced the transcript |
| 3 | Nit | Cost | Some accepted clips are ones no client asks for: Narrator: lines of phone stories (39 in the missions) and a voiced-call host's unplaced lines outside its call knots |
| 4 | Nit | Client | Person-chat preload sends a narrator line under the conversation NPC's id; the branch now refuses it with 403 |
| 5 | Nit | Validator paths | `InkTextValidator` walks with no scenario variables and no other story's changes, and the printed-variable test covers host lines only |
| 6 | Nit | Comments | Two comments describe the old rules |
| 7 | Nit | Fallback | With no extractor, `own_story_line` ignores `#speaker` tags |
| 8 | Nit | Glue | R1 nit 10 and R2 nit 7 stand (demo and test inks only) |

No blockers, no majors.

## Findings

### 1. Minor: the mission test can pass on stale compiled JSON, and copies the controller's lookup

`test/unit/break_escape/tts_mission_lines_test.rb:22` to `:35`, with `games_controller.rb` `resolve_and_compile_ink`, `find_compiled_json`, `find_ink_source` and `needs_compilation?`.

The endpoint compiles a `.ink` newer than its `.json` before reading it. The test's `story_file` is a copy of `find_compiled_json` without that step. So after an `.ink` edit with no recompile, the test checks the old JSON and passes, while live play reads the new one. The batch has the same blind spot, because `TtsLineExtractor#resolve_ink_path` never compiles. Today nothing is stale: I checked all 137 mission stories by mtime and by last commit time. The test also builds scenario data with a raw ERB render, while the controller reads data built by `Game#generate_scenario_data` (player preferences, `prepare_scenario_data!`, object ids). My probe found no difference today (6,595 rows), but nothing keeps it that way.

Fix:
- Move `find_compiled_json`, `find_ink_source` and `needs_compilation?` into a small service, for example `BreakEscape::InkStoryFile.compiled(story_path, compile:)`, that the controller and the test both call. That way the test's lookup cannot drift from the endpoint's.
- Add a test that fails when a mission story is stale: for every host and phone story with a `.ink`, assert `!needs_compilation?(ink, json)`. When `git` is present, also assert that the `.json`'s last commit (`git log -1 --format=%ct -- <file>`) is not older than the `.ink`'s, which catches a stale pair committed together in a fresh checkout where mtimes say nothing. Both checks are cheap: one `git log --name-only` pass is enough.
- Build each mission's data the way a game does: `Game.new(mission: Mission.new(name: name), player_state: {}).tap { |g| g.send(:generate_scenario_data) }.scenario_data` (no save needed, as in my probe), and keep the raw render only for the batch's `TtsLineExtractor`.

### 2. Minor (latent): voice messages work only for `npcType: 'phone'`

`app/services/break_escape/tts_line_resolver.rb:159` to `:167`.

`playVoiceMessage` sends the transcript after `voice:` for whichever record the thread belongs to (`phone-chat-ui.js:342` to `:361`). The resolver tries the voice-message rule only when `npc['npcType'] == 'phone'`. For any other record whose story has a `voice: Hello` line:

- a host (a person NPC opened in phone-chat mode): `spoken_line` holds `voice: Hello` (the batch's reading), the placed-false lookup sees only unplaced lines, and the request `Hello` is refused;
- a non-host record with a story (a phone object with a `storyPath`): the whole-story lookup matches `Hello` to the raw line by its after-prefix form, and `voiced_as` returns `voice: Hello`. The clip then says "voice" aloud, under a new key.

Main's `add_line` indexed the after-prefix variant, so it voiced `Hello`. No content is affected: no scenario that renders has a `voice:` line (probe: 0), and the only inks with them (`scenarios/ink/voice-message-example.ink`, `mixed-message-example.ink`) are used by none. The four phone objects with `ttsVoice` (m01, cybok_heist, sis01) have no `storyPath` and use the object branch, which is correct.

Fix: try the voice-message lookup for any record with a story, not just phone contacts. Move the `voice_message` call ahead of the `elsif !host` branch and drop the `npcType` test, since the client only ever sends a `voice:` line's transcript. Add a resolver test with a person NPC and a phone object that has a story.

### 3. Nit: some accepted clips are ones no client asks for

`tts_line_resolver.rb:172` to `:184` (`narrator_line_in_stories`) and `:154` to `:157`.

The narrator branch indexes the Narrator: lines of every story, phone stories included. Phone narration is never voiced: a text thread shows it muted, and a voiced call skips it (`each_host_line`, and `phoneLineVoice` returns nil for narration). That leaves 39 lines in the missions that can be generated and that nobody hears. Also, a voiced-call host's lines the walker cannot place are accepted from anywhere in the story, not only from its call knots. These clips are all scenario text with their own keys, so nothing is poisoned. They only widen the reachable set in the handover's ceiling. Fix: skip phone stories in `narrator_line_in_stories`, and limit the placed-false lookup for a phone host to unplaced lines whose knot is in `TtsLineExtractor.call_knots`.

### 4. Nit: person-chat preloads a narrator line under the NPC's id

`public/break_escape/js/minigames/person-chat/person-chat-minigame.js:1724` to `:1733` (not in this diff).

The preload's speaker is `this.npcId` whenever the next line parses as narration (`nextParsed.isNarrator`), or when it does not resolve to a voiced co-speaker. Play, though, voices narration as `narrator` (`:1707`). On main, that preload was accepted and generated a clip in the NPC's voice that was never played. On this branch it gets a 403. That is the correct answer, and it costs nothing, because the later `play('narrator', ...)` has its own key. The server log gains a warning for each of these preloads, and the narrator's next line is never preloaded. Fix in the client: use `'narrator'` when `nextParsed?.isNarrator` (and send the text after the prefix), so the preload matches the play request.

### 5. Nit: the validator paths read variables as their ink defaults

`app/services/break_escape/ink_text_validator.rb:429` (`InkLineWalker.cached_for_file`, no `variables`, no `dynamic`).

The extractor now treats carried-over globals and variables changed in other stories as dynamic. The validator's walker does neither. So a Narrator: line, or a line of a non-host story, that prints a variable changed elsewhere is indexed with the ink's default, and that default is voiced when a request happens to match it. This is not request text and not player text (it is the ink's own default), and no such line exists today: my probe found 0 Narrator: lines and 0 non-host, non-phone lines of this kind in the missions. The 13 phone text lines that print a variable are refused by the phone rule. The mission test's printed-variable check only walks host stories' placed lines, so a future case would not be flagged. Fix: extend that test to every story's Narrator: lines and to non-host stories, or give `InkTextValidator` the extractor's `dynamic_variables` for the game.

### 6. Nit: two comments describe the old rules

- `app/services/break_escape/tts_line_extractor.rb:344` to `:346`: "players of one mission whose carried-over globals differ each keep theirs". Imported names are no longer in `@variables`, so they no longer change `cache_stamp`, and all players of a mission share one extractor (which is better). Reword the comment.
- `app/services/break_escape/tts_expected_lines.rb:112` to `:114`: "the /tts endpoint's own validation". The pruner calls `InkTextValidator.validate` with no speaker rule, so it keeps clips the endpoint no longer serves (prefixed and cross-speaker variants generated on main). That only wastes disk space. Either reword the comment, or route `requestable_text?` through `TtsLineResolver` per speaker in a later pass.

### 7. Nit: the no-extractor fallback ignores `#speaker` tags

`tts_line_resolver.rb:145` to `:152`. When the extractor raises (logged, `:98`), the fallback accepts any unprefixed line of the NPC's own story, including one tagged `#speaker:npc:<other>`, and every placed line, because `host` is nil. The lines are still the NPC's own story text, and only requests made during that failure are affected. Fix (optional): in the fallback, refuse lines whose walker tags name another speaker, or return 503 when the extractor is missing for a story-backed NPC.

### 8. Nit: glue across sibling branches

Unchanged since round 1, with no mission affected.

## Injection, key collision and cost

- **Non-scenario text voiced**: no route found. Every branch returns a string taken from the game's own `scenario_data` or its stories: the batch's text (`spoken_lines`), the raw ink line or its after-prefix text, a bark or chatter string, or an object's `voice`. The request only selects one of these. Carried-over globals are never filled in on the extractor path, and the validator path reads ink defaults only (finding 5). Unicode handling is unchanged since round 2 (`match_form`).
- **Two texts, one key**: no. The voiced text is always one scenario string per match form (`spoken[...] ||=`, and the first listed raw whose `voiced_as` is present), and the voice comes from `npc_id`. A request in another speaker's name or with another speaker's prefix finds nothing (`voiced_as` returns that speaker, so the check `speaker == npc_id` fails). Two raws sharing a form resolve deterministically, in index order.
- **Cost**: still bounded by the scenario's reachable clips, each generated once and then cached for every game, with `TtsGenerationLimit` per game and process (1,500 an hour, times the number of workers). Finding 3 trims the slack. The person-chat preload in finding 4 no longer generates a wasted clip.
- **Ruby 2.7**: no Ruby 3 only syntax in any changed file.

## Verdict

Approve. Round 2's findings are closed except the accepted glue nit. The resolver matches every voiced client path I could find, and refusing a non-call phone contact's text lines loses no audio, because the client never voiced them. Before merge, I recommend finding 1 (a staleness guard, and one shared story lookup for the controller and the test): it is cheap, and without it the mission test's main claim can silently go stale. Finding 2 should ride along, since it is a three-line change that brings back main's behaviour for voice messages. The nits can wait for a follow-up.
