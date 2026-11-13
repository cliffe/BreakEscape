# Finale engine: voiced phone calls (F17)

2026-10-21. Approved as F17. Nothing committed. The author docs are in `README_scenario_design.md`, "Voiced phone calls" (right after "Forced phone calls that ring again").

**One part is still to apply:** the `npc-manager.js` plumbing (section 4). Another agent was editing that file, so I left it alone and wrote the change as a patch. Until it is applied, `voiced` in a scenario does nothing; a call opened directly with `params.voiced = true` works.

## 1. The key

`"voiced": true`, set on an event mapping with `conversationMode: "phone-chat"` or on the contact's `timedConversation`. It sits beside `disableClose` and `resume`. Off unless it is exactly `true`.

```json
"timedConversation": { "delay": 2000, "targetKnot": "forced_call", "waitForEvent": "game_loaded", "disableClose": true, "voiced": true },
"eventMappings": [
  { "eventPattern": "conversation_closed:agent_0x99", "condition": "globalVars.call_started && !globalVars.call_done",
    "conversationMode": "phone-chat", "targetKnot": "forced_call", "resume": true, "disableClose": true, "voiced": true, "cooldown": 0 }
]
```

## 2. Behaviour

- Each NPC line plays through TTS as its bubble appears. The next line (and the choices after the last one) waits until the clip has ended, plus the phone's usual 0.4 s gap and 1 s typing indicator. If the `ended` event never comes, the wait stops at the clip's length plus 1.5 s.
- A click anywhere in the thread skips the line that is playing. A clip still being fetched when the player clicks is stopped as soon as it arrives.
- A line prefixed with another registered character's display name (`Director Netherton: …`, the line F14 labels) plays in that character's voice with their `voice.fx`. If that character has no `voice`, the line is read in the contact's voice with the prefix dropped, as person-chat does. Both the contact's and the co-speaker's FX are applied per line.
- Player lines (`You:`/`Player:`, `#speaker:player`) and narration (`Narrator:`, `#speaker:narrator`) are not voiced. Narration is drawn muted on the phone, so I left it silent. Person-chat does voice narration, so this is a choice the user could reverse.
- A leftover two- or three-word prefix that names nobody (`Field Office: Copy.`) is stripped before sending, using person-chat's `stripSpeakerPrefix` pattern, so the text matches what the server lists.
- **Resume:** only `_showStoryLine` voices, and lines redrawn from the history on a reopen don't pass through it. A resumed call speaks only new output (the reply after the unanswered choice, or a `reopenWithCurrentGlobals` re-run).
- **Closing mid-line** (back arrow on a non-forced call, a hit on a forced one, any teardown): the audio stops and the wait ends. The playing line is in the history once, and the lines not yet shown are flushed to the thread as before.
- **No clip, no key:** `TTSManager.play` returns null and the call carries on at once. A keyless server loses the voice, never the call.
- `disableClose` and `resume` are unchanged. The forced call's 2 s auto-close after an ending without `#exit_conversation` starts only after the last line's audio, because the release runs after the typeout loop.

## 3. Cache path

The call uses its own `TTSManager` (one per phone, created on the first voiced line) and the same request as person-chat: `TTSManager.play(npcId, text)` → `ApiClient.getTTS` → `POST /games/:id/tts` with `npc_id` and the text. The server key is `MD5(normalised text | voice | style | language | model)`. The npc id only picks the voice, so a phone line with the same text and voice as a person-chat line uses the same clip. The browser check confirmed this: an m01 debrief clip copied under its own key into the trial scenario's cache folder was served (200) for the phone call's line.

Server side, two changes so phone-call lines are known like person-chat lines:

- **Batch and coverage.** `TtsLineExtractor#hosts` used to skip every phone NPC. It now takes a phone contact whose phone-chat mapping or `timedConversation` has `voiced: true`, so `batch_generate`, `wasted` and `prune_cache` include its lines. Narration in such a story is skipped, as the client skips it.
- **Co-speaker validation.** The endpoint accepts a co-speaker's line only if some host story voices it as that speaker (`spoken_as_npc_in_scenario?`). With the phone story now a host, the Director's line in HaX's call is accepted for `director_netherton`. In the browser it got 503 (accepted, no key to generate it), not 403.

The contact's own lines were already accepted: `InkTextValidator` checks them against the contact's own story.

No printed variables: the rule applies to voiced calls as to any voiced line (README bullet). The trial lines are fixed text.

## 4. Files and lines

| File | Lines (current) | Change |
|---|---|---|
| `public/break_escape/js/minigames/phone-chat/phone-call-voice.js` | new, 145 lines | `isVoicedCall(params)`, `phoneLineVoice(line, contact, characters)` (who speaks a line and the text sent; mirrors `TtsLineExtractor#resolve`), `PhoneCallVoice` (plays one line, waits for end / skip / stop / timeout). Imports only `phone-chat-speaker.js`. |
| `public/break_escape/js/minigames/phone-chat/phone-chat-minigame.js` | 20-21; 745; 773-775; 779-803; 1074 and 1076; 1268-1270 | Imports; `_showStoryLine` doc comment; after the line is recorded, `await this._speakCallLine(line, raw)` on a voiced call; new `_speakCallLine` (resolves the speaker, creates the voice and the click-to-skip listener on first use, takes the line off `_pendingNpcMessages` while it plays and puts it back after, so a close mid-line doesn't flush it a second time); `closeConversation` stops the voice; `cleanup` destroys it. The two `applyEngineVariables` calls, `_tagOptions` and the `processGameActionTags` call sites (peer work) are untouched. |
| `app/services/break_escape/tts_line_extractor.rb` | 14-17; 73-74; 84-93; 237-241; 310-319 | Class comment; `hosts` includes voiced phone contacts; `self.voiced_call?(npc)`; skip narration for phone hosts; `phone_narration?(tags)` (mirrors `tagsSayNarrator`). |
| `scripts/validate_scenario.rb` | 296 | `voiced` added to the known eventMapping fields (one word; lines 298 and 476+ are another agent's). |
| `README_scenario_design.md` | 1294-1303 | New "Voiced phone calls" subsection after the forced-calls bullets. The other hunks in this file (904-905, 1159, 1189, 1558-1559) are other agents'. |
| `.claude/skills/tts-audio/SKILL.md` | 20 | "Phone chats are not voiced" now names the exception. |
| `test/js/finale-voiced-calls.test.mjs` | new, 312 lines | Node tests (section 5). |
| `test/unit/break_escape/ink_line_walker_test.rb` | 248-304 | `TtsLineExtractorVoicedCallTest` (3 tests). |
| `test/fixtures/files/ink_line_walker/phone_call_host.ink` / `.json` | new | Fixture: own prefix, co-speaker prefix, unprefixed, player line, narration by prefix and by tag. |
| `scenarios/test_finale_calls_credits/scenario.json.erb` | 96, 103-104, 114, 130 | HaX gets a voice (the m01 debrief HaX voice, so a cached clip exists for one line), `voiced: true` on her `timedConversation` and re-ring mapping, the Director gets a voice with `fx: "radio"`. |
| `scenarios/test_finale_calls_credits/ink/hax_call.ink` / `.json` | 14 | One line added at the top of the call: `Agent HaX: You ran this mostly solo.` (word for word an m01 line that has a clip). |

### The npc-manager.js patch (not applied)

Six one-line additions, all beside the existing `disableClose` lines. Anchor-based, so line numbers may have moved:

```diff
@@ registerNPC: timedConversation copy
-        disableClose: entry.timedConversation.disableClose === true
+        disableClose: entry.timedConversation.disableClose === true,
+        voiced: entry.timedConversation.voiced === true
       });
@@ mapping config (next to resume)
         resume:        mapping.resume === true,         // phone-chat: reopen the saved thread, no knot jump
+        voiced:        mapping.voiced === true,         // phone-chat: speak the NPC's lines through TTS (F17)
@@ phone-chat startMinigame from an event mapping
             theme: npc.phoneTheme,
-            disableClose: config.disableClose || false
+            disableClose: config.disableClose || false,
+            voiced: config.voiced === true
           });
@@ scheduleTimedConversation
-    const { npcId, targetKnot, triggerTime, delay, background, waitForEvent, skipIfGlobal, setGlobalOnStart, disableClose } = opts;
+    const { npcId, targetKnot, triggerTime, delay, background, waitForEvent, skipIfGlobal, setGlobalOnStart, disableClose, voiced } = opts;
@@ the stored conversation
-      disableClose: disableClose === true // no ×, no Esc (documented; was dropped before 2026-10-21)
+      disableClose: disableClose === true, // no ×, no Esc (documented; was dropped before 2026-10-21)
+      voiced: voiced === true // phone-chat: speak the NPC's lines through TTS (F17)
     };
@@ _deliverTimedConversation, phone branch
           theme: npc.phoneTheme,
-          disableClose: conversation.disableClose === true
+          disableClose: conversation.disableClose === true,
+          voiced: conversation.voiced === true
         });
```

The last test in `finale-voiced-calls.test.mjs` checks this plumbing by behaviour (mapping with and without `voiced`, `timedConversation` with and without). It skips while the live file lacks the patch and runs once it is applied. I ran it against a patched copy with `NPC_MANAGER_SRC=<copy>`: it passes.

## 5. Tests

`test/js/finale-voiced-calls.test.mjs`, 12 tests: the key is off by default; who speaks each kind of line (own prefix, no prefix, stray two-word prefix kept or stripped as person-chat does, co-speaker with and without a voice, player, narration, voiceless contact); `PhoneCallVoice` waits for `ended`, applies FX, resolves at once with no clip, skip, stop, a late clip after a skip is stopped, the timeout fallback; the minigame's real `_showStoryLine`/`_speakCallLine` (lifted from the source) run on a fake minigame with the `_presentOutput` loop and the flush: lines wait for each other, the skip listener, the player's line silent, the pending list, a close mid-line leaving each line in the history once; an ordinary phone silent; wiring (close, cleanup, one call site, the same `getTTS` request); npc-manager plumbing (skipped until applied).

```
$ node --test test/js/finale-voiced-calls.test.mjs
# pass 11   # fail 0   # skipped 1
$ NPC_MANAGER_SRC=<patched copy> node --test test/js/finale-voiced-calls.test.mjs
# pass 12   # fail 0   # skipped 0

$ node --test test/js/        (Node 18.19.1)
# tests 916  # pass 909  # fail 6  # skipped 1
```

The six failing files all pass when run alone: `engine-fixes-pass3` 6/6, `engine-fixes-round4` 4/4, `event-mapping-unlock-door` 4/4, `flag-reward-door-sprites` 2/2, `npc-ko-immune-and-door-event` 7/7, `social-global-writer` 19/19. Round4 and pass3 are the known Node 18 runner error in the full run (SE_BUILD_LOG P0-A). `event-mapping-unlock-door` and `flag-reward-door-sprites` are another agent's new untracked tests, written while I ran the suite. None of the six touches the phone or TTS.

```
$ bin/rails test
684 runs, 2319 assertions, 0 failures, 0 errors, 1 skips

$ bin/rails test test/unit/break_escape/ink_line_walker_test.rb
29 runs, 135 assertions, 0 failures, 0 errors, 0 skips

$ node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json
Total problems: 0

$ ruby scripts/validate_scenario.rb scenarios/<m>/scenario.json.erb --skip-ink --no-graph
m01-m08 and test_finale_calls_credits: all exit 0, 0 errors
test_finale_calls_credits: the same two deliberate warnings as F14 (no conclusionScreen; delay 2000); no unknown-field warning for `voiced`
```

No m01-m08 scenario uses `voiced`, so their extraction and validation are unchanged. `TtsLineExtractor.for_scenario("test_finale_calls_credits")` now lists seven lines: the call's six (one of them the Director's, under `director_netherton`) and the hub's "Nothing yet.".

## 6. Browser check

Keyless server on :3001, headless Chromium through the playtest harness (games 2852, 2859 and 2860, scenario `test_finale_calls_credits`). The live npc-manager has no plumbing yet, so the call was opened from the page with `MinigameFramework.startMinigame('phone-chat', null, { npcId: 'agent_0x99', startKnot: 'forced_call', disableClose: true, voiced: true })`, which is what the patched mapping sends. `fetch` and `HTMLMediaElement.play` were wrapped in the page to timestamp TTS requests and audio events. For the cached-clip test, the m01 clip `f4d59dac…903.mp3` was copied to `tts_cache/test_finale_calls_credits/` and deleted afterwards.

- **Plays as it appears, next waits.** Call opened at t=0: request "You ran this mostly solo." at 1318 ms → 200 (cached clip), play 1321, ended 3521. The next request ("Don't hang up. First question.") came at 5135 ms: the clip's end plus the 1.4 s gap and typing. It got 503 (no clip, no key) and the call carried on: the Director's line was requested at 6629 ms as `director_netherton` → 503, which means the endpoint accepted the co-speaker's line. Choices appeared after it. Screenshot `scratchpad/f17/01-voiced-call-director.png`.
- **Skip.** Clicked the thread 0.52 s into the cached clip: the audio paused at once, and the next line was requested 1.42 s later (instead of about 3.6 s).
- **Hit mid-line on a forced call.** `playerHealth.damage(10)` 0.6 s into the clip: the call closed, the audio stopped, the history gained "You ran this mostly solo." once followed by the two unshown lines (flushed), and no further TTS request was made. The first run of this check (before the fix) showed the playing line twice; that was the pending-list bug fixed in `_speakCallLine`.
- **Resume.** With the story at the first question, a hit closed the call and it was reopened with `startKnot: null` (what `resume` sends with a saved story), still voiced: no TTS request for the thread's lines, the choices "I trust you." / "Make it quick." showed again, and answering requested only "Good. Second question." (`agent_0x99`). Screenshot `02-resumed-no-replay.png`.
- **Choice reply on a sticky hub, and an ordinary call.** Voiced call at `hub`, "Anything else?" → one request, "Nothing yet." (the player's line wasn't sent). The same call opened without `voiced`: no TTS requests in 6 s.

Screenshots are in `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/357ec00d-b30d-461a-b003-c0026290b3a0/scratchpad/f17/`; I looked at both. All harness sessions were stopped. The :3000 server was not touched.

Not checked in the browser: hearing the audio (headless, so only the media events were checked), the `radio` FX on a real clip (no Director clip exists; FX selection is covered by the node test), and the scenario-driven path through npc-manager (needs the patch).

## 7. Limits

- **npc-manager plumbing not applied** (section 4). Until it is, scenario `voiced` keys do nothing in the client. The server side already reads them (the extractor), so batch generation would voice the lines before the client asks for them.
- **The whole phone story is voiced for the batch**, not only the call's knot: marking any call `voiced` makes the contact's texts (hub replies etc.) part of `batch_generate`. The trial shows it: the hub's "Nothing yet." is listed. Narrowing it to the call's knots would need the walker to start from named knots. The README says so.
- **The client voices every line of a voiced conversation**, including the hub replies if the player keeps talking after the call in the same open phone (`params.voiced` lasts for the minigame). Going back to the contact list and into another contact's thread also keeps it voiced. A voiced call is normally forced (no back arrow), which avoids the second case.
- **Lines flushed by a close mid-call** go into the thread unheard, and a resume doesn't replay them.
- **Narration and player lines stay silent** (a choice, see section 2).
- **Autoplay:** a call that rings before the player has clicked anything may be refused by the browser's autoplay policy. It then plays silently, as person-chat's opening cutscenes would. In the game the title screen's Enter or click comes first.
- **No preload** of the next line, unlike person-chat. Each line is fetched when its bubble appears; a cached clip came back within a few ms locally.
- `voice.fx` for a speaker is set on the call's own `TTSManager` the first time they speak and stays set for the rest of that phone session.
- The tap-to-play `voice:` messages keep their own `TTSManager`. If the player taps one during a voiced call, both can play at once.

## 8. Only the call is voiced (F20)

2026-10-21. Approved as F20 ("voice only the calls"). Nothing committed. This replaces the first two items of section 7: the batch no longer voices the contact's whole phone story, and an open voiced phone no longer voices hub replies after the call. Section 4's npc-manager patch has since been applied (its six `voiced` lines are in the live file).

### The rule

A voiced call's lines are those in its **call knots**: the start knots (the `targetKnot`, or `knot`, of every phone-chat eventMapping with `voiced: true`, and of a `timedConversation` with `voiced: true`), plus every knot they reach through diverts, tunnels, function calls and choices, **never entering the contact's home knot**. The home knot is the scenario's `currentKnot` for that contact (default `start`): the knot the phone opens on outside a call. Stitches count as their knot. A start knot that is itself the home knot is still a call knot. Variable diverts can't be followed and relative targets stay inside the knot. A voiced contact with no start knot voices nothing (the extractor records a note).

I picked the home knot over an ink tag such as `#end_call` because every phone contact already has one and no ink has to change. In the trial, `forced_call` (with its `second` stitch) is the call, and `hub` with its "Nothing yet." reply is not.

Both sides apply this rule:

- **Batch** (`TtsLineExtractor`): `call_knots(npc, ink)` walks the compiled story's root-level knots. `each_host_line` keeps only walker lines (and unresolved notes) whose path starts in a call knot. `spoken_lines` uses the same filter, so the co-speaker check on the endpoint narrows with it. Person-chat hosts are unchanged. `for_scenario("test_finale_calls_credits")` now lists six lines; "Nothing yet." is gone.
- **Client**: when a voiced phone loads a contact's story, the minigame sets `conversation.callKnots = voicedCallKnots(storyJson, callStartKnots(npc), callHomeKnot(npc))`. After each Continue, `PhoneChatConversation.stepKnot(story)` reads the knot of the step's first text in inkjs's output stream, and the step's lines go into `conversation.callLines` when that knot is a call knot (the reopen re-run's `collectSteps` records the knot too). `_speakCallLine` returns at once for a line that isn't in `callLines`. The line is still drawn and recorded as before. With nothing in the call, no TTS request is made, so a keyed server generates nothing outside the call on demand. Because the check is per line, a resume needs no state. A topic knot that the call also reaches is voiced from the hub too, which the batch has already covered.
- **Opening not preloaded**: when a timed call is delivered, `currentKnot` moves to the call's knot, and the phone's intro preload (`PhoneChatConversation._preloadOpeningOnce`) used to play that knot's opening into the history. The open then redrew those lines from the history, so they were never spoken. The preload now returns early when its entry knot is a voiced call's start knot (and not the contact's home knot). The call then opens at its knot, and `_showStoryLine` shows and speaks the opening. Unvoiced phones, and a voiced contact's home-knot texts, preload as before. `callStartKnots` moved to `phone-chat-speaker.js` so the conversation can use it without a new import. `phone-call-voice.js` re-exports it.
- **Home knot at run time**: `currentKnot` moves with every knot jump (a timed delivery sets it to the call's knot), so `registerNPC` keeps the scenario value as `homeKnot` (one line). `callHomeKnot` reads `homeKnot` first.

Same request, same cache key. Person-chat, unvoiced phones, and lines redrawn from the history are unchanged.

### Files

| File | Change |
|---|---|
| `public/break_escape/js/minigames/phone-chat/phone-call-voice.js` | Imports and re-exports `callStartKnots`; after `isVoicedCall`: `callHomeKnot`, `voicedCallKnots`. |
| `public/break_escape/js/minigames/phone-chat/phone-chat-speaker.js` | New `callStartKnots` at the end of the file. |
| `public/break_escape/js/minigames/phone-chat/phone-chat-conversation.js` | Constructor `callKnots`/`callLines`; `loadStory` keeps `storyJson`; `continue()` notes the step; re-run `forEach` notes each fresh step; `collectSteps` records `knot`; new `stepKnot`, `_noteCallStep`, `isCallLine`; `_preloadOpeningOnce` skips a voiced call's knot. The speaker import line adds `callStartKnots`. No new module import, so the tests that copy this file with only the speaker import rewritten still load it. |
| `public/break_escape/js/minigames/phone-chat/phone-chat-minigame.js` | Import line; after `loadStory`, set `callKnots` on a voiced call; first line of `_speakCallLine` skips non-call lines. |
| `public/break_escape/js/systems/npc-manager.js` | `registerNPC`: `entry.homeKnot` (one line plus comment). The other hunk in this file (`mailScheduler.tick`) is the peer's. |
| `app/services/break_escape/tts_line_extractor.rb` | Class comment; `self.call_knots`, `self.call_start_knots`, `self.divert_targets`, `self.knot_name`, `self.line_knot`; `each_host_line` filters a phone host to its call knots. |
| `test/fixtures/files/ink_line_walker/phone_call_hub.ink` / `.json` | New fixture: home `hub` with a reply and a `vault_topic`; `call` → `briefing` → choice → `-> hub`. |
| `test/unit/break_escape/ink_line_walker_test.rb` | The mapping in the voiced-call helper now has `targetKnot: "call"`; two new tests (hub reply and hub topic not extracted or accepted, `call_knots` is `{call, briefing}`; home `start` reaches the hub; no `targetKnot` voices nothing, with a note). |
| `test/js/finale-voiced-calls.test.mjs` | Four new tests. One covers a delivered timed voiced call through the real npc-manager: the preload returns 0 and leaves the thread empty, the call opens at its knot, and the first line is requested; an unvoiced timed call still preloads its two lines. The other three: (knot set and start/home knots; a real inkjs run through `PhoneChatConversation` marks the three call lines and not "Nothing yet." / "The vault is sealed."; the fake minigame draws a hub line but requests only the call line), and the npc-manager test checks `homeKnot` survives the call moving `currentKnot`. |
| `README_scenario_design.md` | "Voiced phone calls": a new bullet with the rule; the cost bullet no longer says the whole story is voiced. |

### Tests

```
$ node --test test/js/finale-voiced-calls.test.mjs
# tests 16  # pass 16  # fail 0  # skipped 0

$ node --test test/js/        (Node 18.19.1, after the preload fix)
# tests 1061  # pass 1057  # fail 4
  engine-fixes-pass3, engine-fixes-round4, event-mapping-unlock-door, session-overlay-pause:
  each passes alone (6/6, 4/4, 4/4, 6/6); the Node 18 runner's deserialise error.

$ bin/rails test
705 runs, 5 failures, 7 errors, 1 skip: all 12 in the peer's untracked mail_state tests
(test/models/break_escape/mail_state_test.rb, test/controllers/break_escape/mail_state_sync_test.rb),
with game.rb mail_state being edited during the run. Before the preload fix: 705 runs, 0 failures.
$ bin/rails test test/unit/break_escape/ink_line_walker_test.rb
31 runs, 146 assertions, 0 failures, 0 errors, 0 skips

$ node scripts/ink_runtime_check/reopencheck.mjs scripts/ink_runtime_check/missions.json
Total problems: 0

$ ruby scripts/validate_scenario.rb scenarios/<m>/scenario.json.erb --skip-ink --no-graph
m01-m08: all exit 0. test_finale_calls_credits: the same two deliberate warnings.
```

### Browser check

Keyless :3001, headless Chromium 1148. The repo's Playwright is now 1.64, which needs Node 20, so the harness wouldn't start; I drove the page with a scratch `playwright-core@1.49.1`. Game 2866: the scenario's own timed call opened (voiced through npc-manager), I chose "I trust you." then "Roll the credits.", and the call requested "Good. Second question." and "That's all I needed." (503, accepted, no key). I then opened the voiced phone on `hub` and picked "Anything else?". "Nothing yet." was drawn in the thread, `conversation.callKnots` was `["forced_call"]`, and no TTS request followed: none in the page's fetch log, and none in `tmp/keyless-3001.log` (only the two call lines are logged as `POST /games/2866/tts`). The closing card covered the phone in the screenshot, so the thread was checked through the DOM.

After the preload fix, game 2869 ran the same steps. The server log has five `POST /games/2869/tts` requests in call order: "You ran this mostly solo.", "Don't hang up. First question.", "Put her on when she's done." (as `director_netherton`), "Good. Second question.", "That's all I needed.". The hub's "Nothing yet." was drawn but not requested.

### Found, not changed

- (Fixed, see "Opening not preloaded".) Before that fix, the scenario-driven call's first three lines made no TTS request in games 2866 and 2868. The F17 browser check had opened the call with `startMinigame` directly, so it didn't catch this.
- The endpoint still accepts a contact's own line from anywhere in its story (`InkTextValidator`). Only the client keeps hub lines from being requested. Narrowing the endpoint too would be a further change.
