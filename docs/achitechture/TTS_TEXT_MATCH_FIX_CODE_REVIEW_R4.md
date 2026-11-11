# TTS text match fix: code review, round 4

Branch `build/tts-lookalike`, head `7aef358d5`. Focus: the round 4 fix, commit `6fb24354d` (`tts_line_extractor.rb`, `ink_line_walker_test.rb`, `tts_mission_lines_test.rb`), read inside `git diff 6f94833ae..7aef358d5 -- . ':!docs'` (the rest of that diff is the merge of main). Reviewer: fresh, read-only on code. Ruby 2.7.8.

## What was checked

- The extractor diff line by line, and the resolver (`tts_line_resolver.rb`) for how a new host changes what it accepts.
- Every way the client voices a line, read in `public/break_escape/js`:
  - `npc-manager.js:1463` to `:1494`: an eventMapping with `conversationMode: "video-call"` opens person-chat with `videoCall: true` for any npcType, on `targetKnot || knot || npc.currentKnot`. The server's `video_call_start_knots` reads the same fields in the same order.
  - `npc-manager.js:353` to `:368` and `:2085` to `:2134`: a timedConversation is a video call when `videoCall === true` or its mode is `"video-call"`; otherwise a phone NPC gets phone-chat (voiced only with `voiced: true`) and anyone else person-chat. `video_call_timed?` and the `!video_call_timed?` guards in `voiced_phone_call?` and `call_start_knots` match.
  - `npc-manager.js:1325`: a person-chat mapping opens only for `npcType: "person"`; on a phone NPC it falls through to the bark branch. An unknown mode also falls through to the bark branch, so it opens nothing.
  - `person-chat-minigame.js:1685` to `:1733`: every non-player, non-system line is voiced, narration as `narrator`, with the line's `#delivery:` note, and no `voiced` check.
  - Other person-chat openers: sprite interaction (`interactions.js:892`, person sprites only), the resume after an RFID or container tag (`rfid-minigame.js:579`, `container-minigame.js:1475`, reopening the conversation already open, so its lines are in the same reachable set), and `#transition_to_person_chat` (`chat-helpers.js:331`), which no scenario ink uses (one mention, in `scenarios/lab_tesseract_trials/DESIGN.md`).
  - Phone calls (`phone-call-voice.js`, `phone-chat-speaker.js:198`), barks, chatter, exchanges and `voice:` messages are unchanged by this round. Round 3 traced them.
- Which scenarios have video calls: all seven `video-call` mappings (m02 two, lab_tesseract_trials, chat_minigame_demo, ca13_ai_assistant, ca13_ai_assistant_defend, test-tesseract-probes), all on room NPCs. No timedConversation in any scenario is a video call. The ca13 NPCs are person NPCs, which were already hosts. The test-tesseract-probes contact has no voice, so it gets no rows, which is correct.
- Reachable knots per video-call NPC (scratch runner): m02 Ghost 7 of 33 knots, neither home nor hub; lab_tesseract_trials Ghost 12 of 13; chat_minigame_demo Cipher 2 of 3. No phone call knots on any of them, and no lines the walker can't place in any of the three stories, so the `placed: false` lookup in `own_story_line` adds nothing.
- Key identity, old extractor (`01f0abd99`, loaded over the class) against the head, through the build's own `dump_keys.rb` and `compare_keys.rb`. Old 8,485 rows, new 8,577. Every old row is present with the same key, NPC, tag flag and text, so no existing clip's key changed. The 92 added rows are all untagged: m02 Ghost 37 and narrator 1, lab_tesseract_trials Ghost 45 and narrator 2, chat_minigame_demo Cipher 7. These match the build log's 38, 47 and 7.
- The new mission test against the old extractor (the old file loaded over the class, so `reachable_knots` still exists): 1 failure, every m02 Ghost video-call line refused (403). The same test with an injected `conversationMode: "audio-call"` mapping on an m01 NPC: 1 failure, `unknown conversationMode audio-call`. Both claims hold.
- The live proof's server log (`tts-proof/server-3017-r4.log`): 32 Ghost and narrator requests answered 503 (accepted, no key), and 4 crafted requests answered 403: a Cyrillic word appended twice, free text and a misspelt line.
- Test files run alone, all green: `tts_mission_lines_test.rb` 5 runs, 44 assertions; `ink_line_walker_test.rb` 40 runs, 203 assertions; `test/controllers/break_escape/tts_text_match_test.rb` 59 runs, 3,016 assertions; `tts_delivery_test.rb` 23 runs, 4,335 assertions.
- `ruby -wc` on the three changed files: Syntax OK. No endless defs, hash shorthand or pattern matching.

## The open decision: a video call has no home-knot stop

This is a cost question only. Neither cache poisoning nor injection is possible here. A video call makes more scenario lines acceptable, but each accepted line is still the scenario's own text (`spoken_lines`), keyed on that text, the NPC's voice and the ink's own note. The request still only picks a line. The no-stop rule is also what the client does: person-chat follows every divert, so a stop would refuse lines the player really hears.

In practice: m02's video knots don't reach Ghost's hub. chat_minigame_demo reaches only the call and its outro. lab_tesseract_trials is the one case where it costs something (finding 1): 14 rows that are reachable on paper but never shown in the call. Keep the rule.

## Severity table

| # | Severity | Area | Finding |
|---|----------|------|---------|
| 1 | Minor | Cost | lab_tesseract_trials: the video call reaches Ghost's text-thread knots on paper, so 14 lines no call shows are in the batch and accepted |
| 2 | Minor | Tests | The video-call `#delivery:` branch is untested, and the mission test shares its reachability and speaker code with the code under test |
| 3 | Nit | Client mirror | `callStartKnots` in the client still counts a voiced video-call timedConversation as a phone call; the server no longer does |
| 4 | Nit | Test guard | The unknown-mode guard covers eventMappings only: not timedConversation modes, nor `#transition_to_person_chat` |
| 5 | Nit | Content | Status banners (`> GHOST PROTOCOL: CLOSED`, `> CALL ENDED`) are now batch rows in the contact's voice |
| 6 | Nit | Edge | A knot in both a voiced phone call and a video call is indexed the person-chat way |

No blockers, no majors.

## Findings

### 1. Minor: lab_tesseract_trials batches 14 Ghost lines the video call never shows

`app/services/break_escape/tts_line_extractor.rb:189` (`video_call_knots`), with `scenarios/lab_tesseract_trials/ink/phone_ghost.ink:122`, `:127`, `:53` to `:59`, `:77` to `:78`.

The call fires on `relay_opened` and starts at `the_offer_call`. On paper, its `{ ghost_offer_heard: -> route }` guard (and the same one in `the_offer`) reaches `route`, and from there `intro`, `waiting` and `who_reply`. In play, `route` sends `relay_opened` to `the_offer` before it ever tests `intro_done`, and `waiting` bounces straight back to `route`. So those three knots are text-thread content the call can't show. Their 14 lines (intro 4, waiting 9, who_reply 1) are now batch rows and accepted for Ghost.

Failure: a `tts-audio` top-up of lab_tesseract_trials pays for 14 clips nobody hears, and the pruner keeps them for good. Nothing else breaks. The lines are the scenario's own and are keyed correctly.

Fix, either:
- accept it and say so in the build log's round 4 section (14 clips, once per voice); or
- change the content so the walk can't get there: in `the_offer_call` and `the_offer`, replace `{ ghost_offer_heard: -> route }` with the two branches `route` would take, `{ decision_made: -> closed }` then `{ ghost_offer_heard: -> the_offer_again }`. Recompile, check that the row count drops by 14, and replay the trial's offer once.

Don't add a general stop rule to the walk. Person-chat has none, and a stop would refuse lines the player hears.

### 2. Minor: the video-call `#delivery:` branch has no test, and the mission test isn't fully independent

`tts_line_extractor.rb:367` (`line_delivery(line, person_chat)`) and `:526`; `test/unit/break_escape/tts_mission_lines_test.rb:130`, `:132`, `:208`, `:215`.

- `line_delivery` now sends a note for a phone contact's video-call line. No test covers that branch. `tts_delivery_test.rb:472` checks only that a voiced phone call's lines carry no note. None of today's 92 new rows has a note, so the batch can't show it either. Failure: a later edit puts back the old `npcType == 'phone'` rule. Ghost's tagged video lines then go into the batch untagged. The controller voices the line without its note (`ink_delivery_note` falls back to untagged) and refuses nothing, so the direction is lost without warning and every test stays green: the first mission test compares the extractor's entries with the extractor's own notes.
- The new mission test finds the start knots itself, which is the point. But it takes the reachable set from `TtsLineExtractor.reachable_knots`, and the speaker and narration rules from `ex.resolve` and `phone_narration?`, all code under test. Failure: a compiler change brings a divert form that `DIVERT_KEYS` doesn't know. The extractor and the test then miss the same knots, while the client's person-chat, which runs the story, voices them and gets 403.
- It covers the eleven missions only. Two of the three scenarios that gained rows (lab_tesseract_trials, chat_minigame_demo) are checked by the walker unit tests, not by a scenario test.

Fix:
- Add a walker test: a `#delivery:` line in a phone contact's video-call knot gives `entry.delivery` and `delivered_by?` true, and the same line in a voiced phone call's knot gives neither.
- For `:video_call` rows in the mission test, also check that `ex.delivery_for(speaker, result.line, TtsService.delivery_from_tags(line.tags))` returns the ink's note whenever the line has one.
- Optional: give the test its own small reachable-knot walk, about ten lines that follow every string value under `->`, `->t->`, `f()`, `^->` and `*`. Or compare against the client's `voicedCallKnots` output with no home knot, which is a separate implementation of the same rule.

### 3. Nit: the client's `callStartKnots` no longer mirrors the server's

`public/break_escape/js/minigames/phone-chat/phone-chat-speaker.js:204`, with `tts_line_extractor.rb:217` (`call_start_knots`).

The server now leaves a timedConversation with `voiced: true` and `videoCall: true` out of the phone call start knots. The client still counts it. No content has this, and it can't cause a refusal: the client would voice those knots only in a phone-chat, and the server accepts them as video-call knots (a superset with no home stop). But the two rules are meant to mirror each other. Fix: add `&& timed.videoCall !== true && timed.conversationMode !== 'video-call'` to the client line, or note the difference in both comments.

### 4. Nit: the unknown-mode guard sees eventMappings only

`tts_mission_lines_test.rb:113` to `:116`.

A timedConversation's `conversationMode` and the `#transition_to_person_chat:<npc>|...|<knot>` tag can also open person-chat, the tag for any NPC id. No scenario uses either, but the tag is a supported engine path. Failure: a mission ink adds `# transition_to_person_chat:ghost|...|deal` for a text-only contact. Person-chat voices every line it shows, the server refuses them all (403), and this test passes, because it builds conversations from mappings alone. Fix: in the same test, fail on any `transition_to_person_chat` tag in a mission's compiled stories (or treat its knot as a video-call reading), and check `timedConversation.conversationMode` against `CLIENT_MODES` too.

### 5. Nit: status banners are now rows in the contact's voice

m02 `m02_phone_ghost.ink:617`, `:633`, `:659` (`> GHOST PROTOCOL: CLOSED`), and chat_minigame_demo's `> CALL ENDED`.

Person-chat voices these as Ghost and Cipher, so the endpoint is right to accept them. But they are on-screen status lines, and a top-up will generate Ghost reading the banner aloud. This is a content question for the voice pass. Fix (content, optional): tag them `#speaker:narrator` or make them narration, or accept them.

### 6. Nit: a knot shared by a voiced phone call and a video call

`tts_line_extractor.rb:526`.

`person_chat` is true for any line in a video-call knot, so a knot that a voiced phone call also reaches is indexed with notes and with narration. The phone call sends no note, so it asks for the untagged form, which is accepted but generated at run time, not by the batch. No scenario has both kinds of call on one contact (`call_knots` is empty for all six). Fix: none needed now. If one appears, add the untagged form to the batch for knots in both sets.

## Injection, key collision and cost

- **Non-scenario text voiced**: no new route. Making Ghost a host adds only lines from its own story's reachable knots to `spoken_lines`. The `placed: false` lookup finds no unplaced lines in any of the three stories.
- **Keys**: no existing key changed (key dump above). The new keys are scenario text, voice and ink note.
- **Cost**: m02's reachable set grows by Ghost's 38 video-call lines, which the client does voice. lab_tesseract_trials grows by 47, of which 14 are never heard (finding 1). The per-game limiter is unchanged.

## Verdict

Approve. The fix is complete against every client path I could find: video-call mappings and video-call timed conversations now voice, and no other voiced path is refused. The only extra text it accepts is the scenario's own lines (14 unheard ones in lab_tesseract_trials). The mission test fails on the old extractor and catches an unknown eventMapping mode. Before merge, I recommend the delivery-note test in finding 2, which is cheap and covers the one branch this round added with no test.
