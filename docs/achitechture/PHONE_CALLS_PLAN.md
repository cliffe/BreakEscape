# Phone calls: plan

Status: draft 5, 2026-11-12. Track brief: `docs/agents/PHONE_CALLS_BRIEF.md`. Log: `docs/agents/PHONE_CALLS_LOG.md`. The user's decisions of 2026-11-12 are built in: C2 and C6, debriefs in person by default and varied by story, ring-out by default with ring-until-answered as an option per call, an answer-delay variable, and a "Call back" button that sets a callback variable. Inputs: `docs/agents/phone_calls/`.

All paths are relative to the worktree root unless shown in full. `js/` means `public/break_escape/js/`, `css/` means `public/break_escape/css/`. Line numbers are at commit 0efaa447c; the engine is unchanged since 5952f39e1. Lab sheet paths are relative to `/home/cliffe/Files/Projects/Code/HacktivityLabSheets/_labs/`.

## 0. How to use this plan

- Part A (sections 1 to 6) is the engine work. Do the slices in section 6 in order. Each is committed on its own, with its tests passing and its live proof run, before the next starts.
- Part B (sections 7 and 8) moves the missions onto the right mode for each beat. A migration slice starts once the engine slices it names are merged.
- Section 9 records the design decisions already taken and a short list of features left for later. Nothing in it is open.
- Every new key is opt-in. A scenario that uses none of them behaves exactly as it does today. That rule protects `lab_social_engineering` (deployed) and the existing voiced calls in m02, m09, m10 and `lab_tesseract_trials`.
- Environment, ports, the shared database rule and the commit rule are in the brief ("Where to work"). Browser proofs use port 3023 only.
- Lab sheets live in `/home/cliffe/Files/Projects/Code/HacktivityLabSheets/_labs/<category>/`. Never open a `*-vm-technical-steps.md` file. If a change touches VM steps, log it for the opus48 agent.

## 1. What the code does today

Checked against the code. The design in section 2 builds on these facts.

### 1.1 How a phone conversation opens

| Path | Code | What happens |
|---|---|---|
| Player opens the phone from the inventory | `js/systems/inventory.js:1289`; `js/systems/interactions.js:1752-1806` for a phone object | `phone-chat` starts on the contact list (`js/minigames/phone-chat/phone-chat-minigame.js:316-324`). Tapping a row calls `openJudgedContact` (pretext contacts with `callId`) or `openConversation` (`phone-chat-minigame.js:194-202`). |
| Event mapping, `conversationMode: "phone-chat"` | `js/systems/npc-manager.js:1495-1527` | `_queueScriptedPhoneCall` builds params `{ npcId, phoneId, startKnot, title, theme, disableClose, voiced, callLabel }`. `resume: true` with a saved story drops `startKnot` (`:1511`). |
| Event mapping, `conversationMode: "video-call"` | `npc-manager.js:1463-1493` | person-chat with `videoCall: true`, any npcType. |
| `timedConversation` on a phone NPC | scheduled at `npc-manager.js:352-369`, delivered at `:2059-2140` | phone-chat with `disableClose`, `voiced`, `callLabel`, or person-chat when `videoCall` is set. `beforeOpen` sets `setGlobalOnStart` and `npc.currentKnot` only when it opens (`:2093-2111`). |
| Text (`timedMessages`, mapping `sendTimedMessage`) | `npc-manager.js:1274-1286`, delivered at `:2006-2056` | adds a `timed: true` message to the thread, updates the badge, shows a bark toast. A click on the toast opens phone-chat at `targetKnot` (`js/systems/npc-barks.js:449-455`, `:637-670`). |
| Pretext desk-phone call (lab SE) | desk phone object `interactions.js:1745-1749` → `startPretextCall` `:671-713` → pretext card → `callLaunch` `js/minigames/pretext-prep/pretext-card.js:294-311` | phone-chat with `startKnot`, `pretextCallId`, `blanks`, and `voiced: true` when the contact has `voiced: true` (`:307`). |
| Phone object with `voice` (recorded message) | `interactions.js:1752-1806`, `js/utils/phone-message-converter.js:14-24, 96-105` | converts to a virtual contact whose only line is `voice: <text>`; the thread draws a play button and transcript (`js/minigames/phone-chat/phone-chat-ui.js:821-887`), played by `playVoiceMessage` (`:331`). |

### 1.2 Scripted conversations interrupt; delayed mappings wait

- `_queueScriptedConversation` (`npc-manager.js:675-725`): with nothing scripted open, an event-mapping call closes whatever minigame is open with `endMinigame(false, null)` (`:689-691`) and opens 500 ms later (`SCRIPTED_CALL_START_MS`, `:139`). A second scripted conversation waits in a queue (`:719-724`); the pump (`:770-786`) opens it once nothing is open and the player is not knocked out.
- So a mapping call tears down a lockpick, a terminal or a person-chat. m07 avoids that by sending The Architect's taunts as texts (`scenarios/m07_architects_gambit/scenario.json.erb:1572-1578`, `_comment`).
- "Busy" means only a scripted conversation that is starting or is the open minigame: `_scriptedCallBusy()` (`npc-manager.js:740-748`). A phone the player opened, or a call opened any other way, is not busy, so a mapping that fires during it closes it (`:683-691`). If the player opens a minigame during the 500 ms start delay, the scripted conversation is put in the queue instead (`:700-712`).
- `npcManager._scriptedCall` is cleared lazily. `_openScriptedConversation` sets it to `{ npcId, minigame }` (`npc-manager.js:762`) and nothing clears it when that minigame closes. It is cleared only by `_scriptedCallBusy()` itself when it finds the minigame no longer open (`:745-746`), by the start-delay guard (`:703`), by a refused `beforeOpen` (`:753`) and by `destroy` (`:2657`). `_scriptedCallBusy()` runs only when another scripted conversation arrives (`:683`) or while the pump is running (`:776`). So after a mission's first scripted scene, `_scriptedCall` keeps pointing at a minigame that has ended. m01's opening briefing is such a scene: a `timedConversation` person-chat (`scenarios/m01_first_contact/scenario.json.erb:563-570`) delivered through `_queueScriptedConversation` with `startDelayMs: 0` (`npc-manager.js:2087-2093`), which opens it at once through `_openScriptedConversation` (`:685-687`).
- An auto-challenge (any mapping whose `eventPattern` matches `_in_view`, `dropIfBusy`, `npc-manager.js:1391`) is dropped, not queued, when a scripted conversation is busy or queued (`:719-723`) or when the player opens a minigame during its start delay (`:704-708`). It fires again on the next sighting.
- A phone conversation applies each line's tags as ink continues, before any line of the step is typed or spoken (`js/minigames/phone-chat/phone-chat-minigame.js:753-757` on continue, `:1118-1122` after a choice). So a `#set_global` in a phone conversation can fire a legacy mapping that closes that same phone before its last line shows. m01's `closing_debrief` choice sets `start_debrief_cutscene` (`scenarios/m01_first_contact/ink/m01_phone_agent0x99.ink:952-956`), which opens the in-person debrief through a `person-chat` mapping with `disableClose` (`scenarios/m01_first_contact/scenario.json.erb:1116-1124`); m04's `extract_go` sets `mission_complete` on the tag line before "See you at HQ." (`scenarios/m04_critical_failure/ink/m04_phone_agent0x99.ink:461-466`), which opens its debrief the same way (`scenarios/m04_critical_failure/scenario.json.erb:1556-1564`). Today these are text threads, so the player loses at most a typed line.
- A mapping with `delayMs` never fires while any minigame is open: `_scheduleDelayedMapping` re-checks every `DELAYED_MAPPING_RETRY_MS` until `MinigameFramework.currentMinigame` is null (`npc-manager.js:633-652`, the check at `:643-646`). A pending `delayMs` mapping is not saved over a reload.
- The default mapping cooldown is 5 s (`npc-manager.js:926-928`).
- The handset has no ring, answer or decline. Office-life desk phones do ring for NPCs (`js/systems/npc-needs.js`, `desk_phone_ring`), but nothing rings for the player.

### 1.3 What can draw over a minigame

| Layer | z-index | Code |
|---|---|---|
| Minigame container (full viewport, 95 % black) | 1500 | `css/minigames-framework.css:3-19` |
| Bark toasts while a non-phone minigame is open | 1400 (below minigames, on purpose, D5) | `css/npc-barks.css:16-20`; class toggled by `MinigameFramework._updateBarkLayer` (`js/minigames/framework/minigame-manager.js:195-213`) |
| Bark toasts otherwise | 9999 | `css/npc-barks.css:4-14` |
| Laptop / workstation popups (CyberChef, lab sheet), HUD panels | 2000 | `css/main.css:42-51`, `css/hud.css:620` |
| Notification toasts (top right, from 86 px) | 2000 | `css/notifications.css:5-14` |
| Pause menu | 2500 ("above HUD and minigames, below the session overlay") | `css/game-menu.css:4-9` |
| Confirm dialogs | 3000 | `css/notifications.css:100-105` |

Barks are also held back while a workstation popup or a person-chat is open (`npc-barks.js:175-186`). During a `phone-chat` they are not held: `holdsBarks()` is false for `phone-chat` (`minigame-manager.js:195-199`), and only a bark from the contact whose thread is open waits (`npc-barks.js:181-185`). A click on another contact's toast opens that contact's thread through `startMinigame` (`npc-barks.js:449-458`, `:660-670`), which ends the open phone-chat (1.4). The only guard is for a forced minigame (`inventoryBlockedByForcedMinigame`, `npc-barks.js:457`). `endMinigame` drains held barks once nothing is open (`minigame-manager.js:300-303`).

The workstation popups are plain DOM, not minigames: `workstationPopupOpen()` checks `#laptop-popup` and `#lab-popup` (`js/utils/overlay-open.js:6-15`). Closing one only hides it and keeps its iframe loaded, so CyberChef's recipe and input and the lab sheet's scroll position survive a close and reopen (`js/utils/crypto-workstation.js:19-22, 36-52`; `js/utils/lab-workstation.js:24-27, 39-58`). Both close functions drain held barks; neither tells the minigame framework. The four functions are on `window` (`js/utils/helpers.js:244-248`).

### 1.4 How a minigame closes

- Esc, the close button and a player hit all close through the minigame's own `complete(false)`, which emits `minigame_failed` (`js/minigames/framework/base-minigame.js:94-104`). `endMinigame` runs `cleanup` and `onComplete` (`minigame-manager.js:215-305`).
- The damage close marks itself first so minigames can skip failure toasts ("Pick Failed"): `minigameClosedByDamage` (`js/systems/player-damage-interrupt.js:27-40`). A hit leaves a non-forced phone open with a notice and closes a forced (`disableClose`) call (`:55-61`). `closeMinigameOnDamage` is called on every hit from `js/systems/player-health.js:93`. A knockout closes whatever is open, forced or not, through `complete(false)` and then `forceCloseMinigame()` if that did not end it (`closeMinigameForKnockout`, `player-damage-interrupt.js:156-172`).
- The framework's only restore path is S12 return-to: a parent opened with `params.suspended === true` is ended without its `onComplete` and later restarted from its original params (`minigame-manager.js:60-85, 330-338`). Restarting from params loses what the player did inside it. A child's normal exit reopens its parent inside `endMinigame`, before the end of that call (`:280-287`), so by the time `endMinigame` finishes another minigame can already be open.
- `startMinigame` ends whatever is running before it opens the new scene (`minigame-manager.js:57-84`), and returns null without opening anything while the player is knocked out (`:50-55`). The new scene is installed at `:174`, started at `:183` and returned at `:186`.
- The early return for a parent handing over to a child (`:290-293`) skips the rest of `endMinigame`, so code placed after `_updateBarkLayer()` (`:300`) does not run for that hand-over.

### 1.5 Voiced calls

- Call mode is fixed when the phone UI is built: `this.isCallMode = isPhoneCallMode(this.params)` (`phone-chat-ui.js:49`; rule at `js/minigames/phone-chat/phone-call-ui.js:18-20`: `voiced === true` and theme not `terminal`). Any new call path starts a new phone-chat minigame with `voiced: true`.
- The call screen HTML is `phone-call-ui.js:60-77`, built by `phone-chat-ui.js:190-200`. The end button and back arrow are hidden on `disableClose` (`phone-chat-minigame.js:213-227`). The caption comes from `callLabelFor` (`phone-call-ui.js:27-30`): params `callLabel`, then the contact's, then "Voice call".
- A `terminal` theme contact with `voiced: true` gets no call screen but is still voiced: `isVoicedCall` ignores the theme (`js/minigames/phone-chat/phone-call-voice.js:24-26`).
- Voicing: `_speakCallLine` (`phone-chat-minigame.js:944-970`, called at `:933` and for the preloaded opening at `:974-983`) uses `PhoneCallVoice.speak(speakerId, text, fx)` (`phone-call-voice.js:159-191`), which calls `this.tts.play(speakerId, text)` with no options (`:165`). `TTSManager.play` accepts `{ delivery }` (`js/systems/tts-manager.js:62`) and keys the cache on it only when present (`:469-470`). So delivery notes are dropped on calls.
- Tags reach the phone per step: the continue loop gathers lines and tags with `phoneStepLines(result.text, result.tags)` (`phone-chat-minigame.js:735-761`) and passes them to `_presentOutput`; `_showStoryLine(raw, …)` (`:908`) gets the text only.
- Which knots speak: `callStartKnots` (`js/minigames/phone-chat/phone-chat-speaker.js:190-210`) = contact `voiced` → home knot; voiced non-video `timedConversation.targetKnot`; each voiced phone-chat mapping's `targetKnot`. `voicedCallKnots` (`phone-call-voice.js:67-85`) walks diverts from those and stops only at the home knot (`callHomeKnot`, `:41-43`). Set on open at `phone-chat-minigame.js:517-520`.
- The server mirrors this: `TtsLineExtractor.call_knots` and `reachable_knots` (`app/services/break_escape/tts_line_extractor.rb:183-211`), `call_start_knots` (`:213-227`), host selection `voiced_call?` / `voiced_phone_call?` (`:143-161`), per-line filter and `person_chat` flag (`:499-529`), and `line_delivery` returning nil for phone lines (`:367-371`).
- **Consequence:** a call knot that diverts to any knot other than the home knot pulls that knot into the call. A call ending `-> hub`, where `hub` is not the home knot, voices the whole hub.

### 1.5a How a phone conversation ends

- End (the call screen's button) and the back arrow both call `closeConversation()` (`phone-chat-minigame.js:217-227`). It emits `conversation_closed`, clears the thread and shows the contact list inside the same minigame (`:1439-1455`). The minigame stays open, still in call mode.
- `closeConversation()` sets `this.conversation = null` (`:1450`) before it returns, so after End or the back arrow no story is loaded in the minigame.
- When the story ends with no choices, five branches handle it (`:700-702`, `:818-820`, `:875-878`, `:1194-1196`, `:1205-1207`). Each calls `_releaseForcedCall()` (`:1219-1224`), which completes the minigame only for a forced (`disableClose`) call, and does it in a timer: `FORCED_CALL_END_CLOSE_MS` (2000, `js/minigames/phone-chat/phone-call-lock.js:11`) after the session overlay has closed. Two of the branches save the story after `_releaseForcedCall()` returns (`:875-882`, `:1205-1210`), so any save that must be the last one has to run inside that timer.
- Only `#exit_conversation` completes the minigame in every case (`:1174-1186`); it saves the story first (`:1181`).
- The story's current knot can be read without running it: while choices are showing, from the first choice's `sourcePath` (`story.currentChoices[0].sourcePath`, first segment); otherwise from the last step's output with `PhoneChatConversation.stepKnot(story)` (`js/minigames/phone-chat/phone-chat-conversation.js:1000-1013`). `conversation.goToKnot(knot)` moves the story without continuing it and sets `npc.currentKnot` and `npc.lastEnteredKnot` (`:185-205`). `_saveStoryStateFor(npcId, conversation)` (`phone-chat-minigame.js:1234-1247`) writes `npc.storyState`.
- `cleanup` emits `conversation_closed` for a thread still open at teardown (`:1630-1636`). `closeConversation` clears `currentNPCId` first, and `_emitConversationClosed` does nothing without an id or a conversation (`:1405-1412`), so the event never fires twice.
- A pretext call (lab SE) ends through its own path, `_finishPretextCall` and `_leavePretextCall` (`:1419-1437`).

### 1.6 Who speaks a co-speaker line

- The TTS cache key is the text, voice name, style and language (`app/services/break_escape/tts_service.rb:171`), plus the delivery note when there is one. The speaker's id is not in it, so two records with the same voice block share clips.
- Server: `speaker_id_for` (`tts_line_extractor.rb:589-601`) matches a prefix against each character's id or display name and returns the **first** match in scenario order (`characters`, `:273-280`). A line in its host's own story whose prefix is the host's display name stays with the host (`same_name`, `:325-336`).
- Person-chat: the character index is the global registry (`js/minigames/person-chat/person-chat-minigame.js:119-124`; the local index at `:126-134` is only a fallback), which keeps registration order (`js/systems/character-registry.js:56-62`). Room NPCs register in their room's list order (`js/systems/npc-lazy-loader.js:98-104`). `NPCManager.resolveSpeakerId` (`npc-manager.js:165-182`) matches id or display name, and the first match wins.
- Person-chat voice: `ttsSpeakerId` takes the parsed speaker unless it has the host's display name (`isOwnNpcByName`, `person-chat-minigame.js:1700-1707`), so a host's own `Agent HaX:` lines request under the host. The server twin is `same_name`.
- Person-chat portrait: the portrait follows the resolved character, with no own-name rule (`js/minigames/person-chat/person-chat-ui.js:484-499`). It uses `spriteTalk`, else a talk image derived from `spriteSheet`, else the sprite sheet frame with `spriteSheet || 'hacker'` (`js/minigames/person-chat/person-chat-portraits.js:375-387, 392-435`). A record with no sprite fields is drawn as the default `hacker` sprite, with no lip sync. Phone records never get a world sprite whatever fields they carry: `js/core/rooms.js:3313` creates sprites for `person` and `both` only, and the look-alike swap and texture preload skip phone records (`js/utils/npc-lookalike.js:53`, `js/systems/character-textures.js:29`).
- Phone: `phoneLineVoice` (`phone-call-voice.js:98-120`) uses `otherSpeaker` (`phone-chat-speaker.js:174-189`), which matches **display names only**, then takes the first registered character with that display name and a voice. An id prefix on a phone line is not recognised; `STRIP_SPEAKER_PREFIX` (`phone-call-voice.js:89`) may strip it and the contact's own voice reads the line.
- `#speaker:` tags are used only for a line with no resolved prefix (`speaker_from_tags`, `tts_line_extractor.rb:605`), so they cannot override a prefix.

### 1.7 What persists over a reload

- Per contact, `exportPhoneState` (`npc-manager.js:2235-2300`): history (fields `PHONE_MESSAGE_FIELDS = type text timestamp gameTime read isBark timed preloaded`, `:145`), `storyState`, `storyPath`, `currentKnot`, `lastEnteredKnot`, `preloadedKnot`, deferred tags and globals. `_phoneStateEntry` (`:2259-2306`) drops messages with empty text (`:2263`) and returns null for a contact with no history and no story (`:2275`). Restored by `restorePhoneState`, called from `js/core/game.js:1771`.
- Server whitelist: `Game#sanitize_phone_state_entry` (`app/models/break_escape/game.rb:3330-3376`), message keys `PHONE_MESSAGE_KEYS` (`:3302`). Unknown keys are dropped, empty texts dropped (`:3333`), an entry with nothing left returns nil (`:3374`). A string `type` of up to 20 characters passes (`:3337`).
- A mapping that opens a conversation persists its `onceOnly` trigger only when the conversation closes: `opensConversation` (`npc-manager.js:1052-1055`) makes `persistOnClose` register a `conversation_closed:<npcId>` listener (`:1061-1063`, `_persistTriggerOnClose` `:1668-1677`) that sets `triggered.persist`. A handler that opens nothing is persisted at once (`:1059`). Persisted triggers reach the server through `exportTriggeredEvents`, sent by `state-sync.js`. Its `setGlobal`, `completeTask` and other side effects run before the conversation opens (`:1065` onwards). Missions re-ring unfinished calls with `resume` mappings on `game_loaded` / `room_exited` / `conversation_closed` (README "Forced phone calls that ring again").
- `hasPendingOpeningConversation` (`npc-manager.js:1938-1946`) holds the Mission Brief popup while an opening timed conversation is undelivered or in the scripted queue; the popup waits on it through `briefPopupBlocked` (`js/utils/helpers.js:44-48`).
- Closing a phone emits `conversation_closed:<contact>` for the open thread from `cleanup` (`phone-chat-minigame.js:1630-1636`).
- Opening a thread restores the saved story and shows its current choices (`phone-chat-minigame.js:540-616`).

### 1.7a Ink variables the engine writes

- Engine-written VARs go through `NPCConversationStateManager.applyEngineVariables(npcId, story, { channel, values })` (`js/systems/npc-conversation-state.js:193-212`). It runs every writer registered with `registerEngineVariableWriter(id, writer)` (`:172-176`), then the caller's own `values`. Only VARs the story declares are set (`setDeclaredVariable`, `:276-287`), so a story that doesn't declare a name is untouched.
- Every loader calls it last, after restore and global sync, and passes a `channel`, which every writer receives (`npc-conversation-state.js:197-199`): the phone on a thread reopen (`phone-chat-minigame.js:596`) and on an explicit knot (`:640`, before `goToKnot` at `:646-648`), both `phone-chat`; the phone preload, `phone-preload` (`js/minigames/phone-chat/phone-chat-conversation.js:865`); the contact list's preview, also `phone-chat` (`js/minigames/phone-chat/phone-chat-ui.js:556`); person-chat, `person-chat` (`js/minigames/person-chat/person-chat-minigame.js:597`); and the mail runner, `email` (`js/systems/mail-runner.js:424`). So the channel alone does not tell an open thread from a contact-list preview.
- Run-scoped VARs are never recorded or sent to the server: `isRunScopedVariable` (`npc-conversation-state.js:160-162`) checks `RUN_SCOPED_PREFIXES = ['email_']` (`:11`), and `exportNpcInkVariables` (`:221`) and `recordInkVariables` (`:295`) skip them. They are still inside a saved `storyState`, so each load writes them again.
- An existing scenario already declares VARs starting `call_` that must persist: `scenarios/test_finale_calls_credits/ink/hax_call.ink:2-3` (`call_started`, `call_done`). A `call_` prefix rule would break them.

### 1.8 Sounds

- `phone_vibrate.mp3` plays with every text toast (`npc-barks.js:76`). `message_received`, `message_sent` exist (`js/systems/sound-manager.js:86-87`). `desk_phone_ring.mp3` (`:88-89`) and `distant_phone.mp3` (`:136-137`) exist. There is no mobile ringtone and no ring-back tone. Credits file: `docs/achitechture/OFFICE_LIFE_SOUND_CREDITS.md`.
- Volume categories go by sound name (`sound-manager.js:198-206`). `phone_vibrate` and `message_*` are `notifications` (`:205`); any other new name falls to `effects`.

### 1.9 Other facts the work needs

- Contact-level `voiced`/`callLabel` is used only by `lab_social_engineering` `dev_service_desk` (`scenarios/lab_social_engineering/scenario.json.erb:1792-1803`). The player's phone lists only `ruth_phone` (`:22-24`); the contact list also shows any contact with history (`phone-chat-ui.js:506-517`), so Dev appears after the first pretext call and opens there as a silent thread.
- `#delivery:` notes inside voiced call knots today: `scenarios/m09_digital_archaeology/ink/m09_phone_agent0x99.ink` "Don't be kind about it. Thank you. Once." (494 at A1, 496 since M3), "...That's mine. You don't get to use it on me. Thank you." (506, now 508), "Nobody's called me that since the course. It's HaX. It has been for seven years." (678, now 680); `m09_phone_recruiter.ink:171` "Then I'll tidy my own desk. Gone. Goodnight, agent."; `scenarios/m10_full_disclosure/ink/m10_ghost_phone.ink:146` "No. I'd rather not leave on that." (quote the text, not the line number). None in `dev_service_desk.ink`. `scripts/ink_runtime_check/dialoguelint.mjs:798` skips delivery checks on the phone channel.
- dialoguelint reads `.ink` source and scans the raw `.erb` with regexes (`dialoguelint.mjs:949-997`); it cannot see mappings built by ERB helpers such as m09's `call_map` (`scenarios/m09_digital_archaeology/scenario.json.erb:122-136`). Its voiced-variable check looks only at `voice:` lines (`:914-917`).
- `test/js/finale-voiced-calls.test.mjs` asserts source text: `:255` counts `_speakCallLine(` (3), `:257` matches the preloaded-opening call verbatim, `:261` matches `duration = await this.tts.play(speakerId, text);`.
- The validator's known-field lists: NPC fields `scripts/validate_scenario.rb:431-436`, mapping fields `:461-466`.
- `window.npcManager` is created at `js/main.js:137`.
- The stylesheet links are in `app/views/break_escape/games/show.html.erb` (`npc-barks.css` at `:73`).
- `isSessionOverlayShowing` and `SESSION_OVERLAY_CLOSED` are in `js/utils/session-overlay-pause.js:15-18`.
- The Mission Brief popup is a `notes` minigame: `showMissionBrief` starts it with `title: 'Mission Brief'` (`js/minigames/notes/notes-minigame.js:731-748, 776-777`). `briefPopupBlocked` waits while any minigame is open or an opening conversation is pending (`js/utils/helpers.js:53-56`).
- Event-mapping conditions are `&&` only: terms are split on `&&` and each must pass; there is no `||` and no brackets (`npc-manager.js:115-123`).
- After a choice, the phone keeps continuing the story until it reaches choices or the end, and only then checks for `#exit_conversation` (`phone-chat-minigame.js:1105-1129, 1174-1186`). So `#exit_conversation` followed by `-> some_knot` runs that knot's text before the phone closes.
- An `#ending_check` line that the player answers "Keep going" to drops its text and its `#exit_conversation` (`phone-chat-minigame.js:1151-1157`).
- An `#ending_check` inside a choice's brackets is asked before the choice is taken; "Keep going" takes nothing, so the same choices stay on screen (`phone-chat-minigame.js:1007-1022`, `:1065`; `js/minigames/helpers/chat-helpers.js:30-36`). Once the player has chosen "End the mission now", a second trigger of the same ending does not ask again (`js/systems/ending-check.js:19-26`, `endingNeedsAnswer` `:170-175`). A mapping with `endingCheck: true` asks when its event fires (`npc-manager.js:1021-1037`). The bring-in debriefs of m03, m04, m05, m06 and m07 open through such mappings (`scenarios/m03_ghost_in_the_machine/scenario.json.erb:1285`, `scenarios/m04_critical_failure/scenario.json.erb:1562`, `scenarios/m05_insider_trading/scenario.json.erb:1584`, `scenarios/m06_follow_the_money/scenario.json.erb:1680`, `scenarios/m07_architects_gambit/scenario.json.erb:1683`). In m03 to m06 the event is a global that `extract_go` sets on the tag lines just before its last line (for example `scenarios/m04_critical_failure/ink/m04_phone_agent0x99.ink:462-466`), so the question comes up as that line is shown, and the line shows whatever the answer.
- `playerIsKnockedOut` is on `window` (`js/systems/player-damage-interrupt.js:176`).
- `InkEngine.continue` gathers tags until it reaches a line with visible text (`js/systems/ink/ink-engine.js:44-63`), so a tag on its own line arrives with the next visible line, even one in the knot it diverts to. Tags inside a choice's brackets go to `choices[i].tags` (`:71`); the phone reads those only for `#ending_check` (`phone-chat-minigame.js:1007-1010`, `:1065`).
- `openLabWorkstation` reloads the frame only when `labFrame.src !== url` (`js/utils/lab-workstation.js:25-27`). The `src` property is the absolute URL, which can differ from the attribute. Both popup close functions re-enable game input (`lab-workstation.js:51-54`, `crypto-workstation.js:44-48`).

## 2. Part A: engine design

### 2.1 Principles

1. **Opt-in, per beat.** Two new keys carry everything: `ring` on a call (mapping or `timedConversation`) and `call` on a contact. Without them every path in 1.1 is unchanged.
2. **A call is its own phone-chat minigame.** Call mode is fixed at UI build (`phone-chat-ui.js:49`), so answering, dialling and calling back each start a fresh `phone-chat` with `voiced: true`. This is what `callLaunch` already does for the lab. A call the ringer or the dial path opens carries `params.ringerCall` (`{ id, direction: 'incoming' | 'outgoing', callback }`); everything in this plan that changes how a call ends or what happens after it checks that flag, so `callLaunch` calls and legacy voiced mappings keep today's behaviour.
3. **Ringing never closes anything.** A ringing call shows on its own layer above minigames. Answering over a puzzle puts the caller on hold until the player closes the puzzle themselves, and the call opens only once nothing else is on screen. The engine never ends a minigame because of a new call. The one thing it puts aside is a workstation popup, which it can put back exactly (2.4, row 11).
4. **A call in progress is not torn down by a scripted beat.** While a ringer call is connected or opening, a legacy scripted conversation (a `person-chat` or `phone-chat` mapping, a `timedConversation`) waits behind it and opens when it ends (2.9). A bring-in call can set the global that opens the in-person debrief, say its last line, and hand over.
5. **The ink stays the ink.** Decline, missed and voicemail are engine events and optional knots. A mission reacts to them with ordinary event mappings. The caller's ink learns how the call came about from two engine-written VARs (2.11).
6. **One thread per contact.** Texts, call transcripts and call-log rows share the contact's thread, in time order.

### 2.2 The ringer and its states

New module `js/minigames/phone-chat/phone-ringer.js`: a pure state machine with no imports, so node tests load it alone. A thin adapter, `js/minigames/phone-chat/phone-ringer-dom.js`, wires it to the window (framework, npcManager, sound, timers, DOM) and is created right after `window.npcManager` (`js/main.js:137`) as `window.phoneRinger`.

Each incoming call is an **offer** `{ npcId, knot, disableClose, resume, onMissed, voicemailKnot, withheld, untilAnswered, callLabel, opening, setGlobalOnStart, ringMs, answerSeconds }`. `ringMs` is the unpaused time it has spent ringing so far; `answerSeconds` is fixed when it is answered (2.11). The offer's mapping trigger is persisted when the offer is made (2.7), so the offer carries no persist closure. The ringer holds at most one offer per contact and these states:

| State | Meaning |
|---|---|
| `queued` | Due, not yet answered, and something blocks ringing (table below). Waits first in, first out. |
| `ringing` | The incoming-call UI shows. Ring timer running unless paused. |
| `held` | Answered, but the call can't open yet. The ring has stopped for good. The hold pill shows while a non-conversation minigame is open, and is hidden while a conversation or a scripted beat is on screen. The call opens once `openBlocked()` is false. An answered offer never rings again and never times out on the ring timer. |
| `connected` | The call's phone-chat is open (or opening). |
| `missed` | Declined, timed out, rung off after the hold limit, lost to a reload, or closed by something else while non-forced (row 32). Leaves a row, then a callback or voicemail. Terminal for the offer. |

Separately from offers, a contact can have a **pending callback** `{ knot, resume }` (2.6), which is what a missed call leaves when `onMissed` is `"callback"`.

The ringer also exposes `callActive()`: true while any call it owns (incoming or outgoing) is `connected`, from the moment it decides to open the call until that call's minigame has ended. `_scriptedCallBusy()` reads it (2.9). It is read live from the framework, not from the ringer's own state: true while the call's minigame is `currentMinigame` and not `_ending`, or inside the open delay before it. `endMinigame` nulls `currentMinigame` before it drains held barks (`minigame-manager.js:275-278`, `:300-303`), and `drainDeferredBarks` returns early while `_shouldDefer()` is true (`npc-barks.js:240-243`), so a `connected` flag cleared in a microtask would leave the texts held during the call waiting for the next minigame.

Two checks decide what the ringer may do. Both are functions of the adapter, each with a named test.

**The scripted-scene check.** Both checks below ask whether a legacy scripted conversation is starting, open or waiting. They never read `npcManager._scriptedCall` directly, because it is left pointing at a closed minigame after every scripted scene (1.2). A2b splits today's body of `_scriptedCallBusy()` (`npc-manager.js:740-748`) into a new method, `scriptedConversationActive()`, which keeps its stale-clearing exactly:

```js
/** True while a scripted conversation is starting or is the open minigame. Clears a stale record. */
scriptedConversationActive() {
  const current = this._scriptedCall;
  if (!current) return false;
  if (!current.minigame) return true;   // inside the start delay
  const open = window.MinigameFramework?.currentMinigame;
  if (open === current.minigame && !open._ending) return true;
  this._scriptedCall = null;
  return false;
}

_scriptedCallBusy() {
  return !!window.phoneRinger?.callActive?.() || this.scriptedConversationActive();
}
```

The ringer's term is `scriptedConversationActive() || _scriptedCallQueue.length > 0`. The two checks don't call each other: the ringer never calls `_scriptedCallBusy()`, and `scriptedConversationActive()` never reads the ringer.

Why m01's first ring is not held: the opening briefing sets `_scriptedCall = { npcId: 'briefing_cutscene', minigame: <its person-chat> }` (1.2). When the player closes it, `endMinigame` sets `currentMinigame = null` (`minigame-manager.js:275-278`) before the end hook runs (`:300`, 2.9). When the player later walks into `main_office_area` and the `first_ring` offer arrives, `ringBlocked()` calls `scriptedConversationActive()`: `current.minigame` is the briefing, `open` is null (or some other minigame), so the record is cleared and the term is false. The same holds for every other mission's opening scene before a held or queued call (m04, m05, m09).

**`ringBlocked()`**, true when an offer may not start ringing:

- a conversation minigame is open: a `phone-chat` showing a call (call screen, `voiced` terminal call) or opened with `disableClose`, a `person-chat`, a video call;
- the scripted-scene term is true (`scriptedConversationActive()` or a non-empty `_scriptedCallQueue`);
- the player is knocked out (`window.playerIsKnockedOut?.()`);
- another offer is `ringing`, `held` or `connected`, or an outgoing call is dialling or connected;
- the ringer is closed (row 28).

A non-conversation minigame (lockpick, keypad, terminal, PC, container, notes) does not block: the call rings over it. A workstation popup does not block. A phone-chat on the contact list or a text thread does not block: the call rings inside the phone (row 10).

Built in stages (section 6): in A2b, before hold and the popup put-aside exist, `ringBlocked()` is also true while **any** minigame or workstation popup is open, so a call rings only when nothing is on screen. A2c lifts that for non-conversation minigames and popups; A3 lifts it for the player's phone.

**`openBlocked()`**, true when a call that has been answered may not open yet:

- any minigame is open (`MinigameFramework.currentMinigame` and not `_ending`), apart from a phone-chat on the contact list or a text thread, which row 10 closes first;
- the scripted-scene term is true (`scriptedConversationActive()` or a non-empty `_scriptedCallQueue`);
- the player is knocked out;
- the player was hit within the last `HIT_QUIET_MS` (`playerHitWithin`, A2c);
- the ringer is closed.

A workstation popup does not block opening: row 11 puts it aside. `openBlocked()` is checked when the player answers and again just before the call's `startMinigame`, after the `SCRIPTED_CALL_START_MS` wait. At that second check (`openBlocked({ second: true })`) the non-empty `_scriptedCallQueue` term is left out: a beat queued by a `phone_call_answered` mapping during the wait waits behind the call the player answered (A2a R1).

**Paused** means any of: the session-resume overlay is up (`isSessionOverlayShowing()`), the pause menu is open (`.game-menu-overlay` displayed), the Mission Brief is open (`currentMinigame._sceneType === 'notes' && currentMinigame.params?.title === 'Mission Brief'`, 1.9), or `document.hidden`. While paused the ring timer, the auto-answer timer and the hold timer stop, the ringtone is silent, and the banner or pill stays.

The adapter learns about changes from four hooks rather than waiting for the 500 ms tick (2.9): minigame started, minigame ended, workstation popup closed, and `game_loaded`. Each hook schedules the re-check with `queueMicrotask`, so it runs after the swap in progress has finished (`startMinigame` ends the old minigame at `minigame-manager.js:61-69` and installs the new one at `:174`; a re-check in between would see nothing open). The tick stays as a backstop.

### 2.3 State table

Constants: `RING_TIMEOUT_MS = 20000` (the default; a call with `ring.untilAnswered` has no ring timeout, 3.1), `UNTIL_ANSWERED_NUDGE_MS = 10000` (after the first `RING_TIMEOUT_MS` such a call stops looping the ringtone and vibrates once per nudge), `AUTO_ANSWER_MS = 6000`, `RERING_AFTER_LOAD_MS = 3000`, `HIT_QUIET_MS = 4000` (no damage for this long before a call opens, auto-answers or re-rings), `HOLD_MAX_MS = 90000` (unpaused time a non-forced caller waits on hold), `DIAL_MS = 2500`, `RING_OUT_MS = 6000`, and the existing `SCRIPTED_CALL_START_MS = 500` (`npc-manager.js:139`). Each row is a named test in `test/js/phone-ringer.test.mjs` (5.1) and, where marked ★, a row in the test scenario (5.3). The slice that builds each row is in the last column (section 6).

**Offers arriving**

| # | State | Event | Result | Slice |
|---|---|---|---|---|
| 1 ★ | none for this contact | offer, `ringBlocked()` false | `ringing`. Apply the offer's `setGlobalOnStart` (timed calls). If the contact has a pending callback, clear it now (row 7). | A2a/b |
| 2 ★ | none for this contact | offer, `ringBlocked()` true | `queued`, at the tail. | A2a/b |
| 3 | `queued`, `ringing` or `held` for this contact | offer, same knot | Drop the new offer (its trigger was persisted when it was offered). | A2a/b |
| 4 ★ | `queued`, `ringing` or `held` for this contact | offer, different knot | Replace: the old offer is removed with no row and no event; the new offer takes its place and state (a `ringing` call restarts its ring with the new knot; a `held` call keeps its hold and its `answerSeconds`). This keeps m07's T-5 from ringing after T-1. A forced offer is never replaced, from the moment it is offered (queued, ringing, held, connected, or waiting to ring again after row 26 or `restore()`): the new offer queues behind it with its own timing, and no ringing time or `answerSeconds` carries over (A2a R2). | A2a/b |
| 5 | `connected` for this contact (incoming or outgoing) | offer | `queued` behind it; rings when the call ends. A non-forced offer for the knot that is connected right now is dropped, as row 3 (A2a R5). | A2a/b |
| 6 ★ | another contact `ringing`, `held` or `connected` | offer | `queued`, first in, first out. | A2a/b |
| 7 ★ | contact has a pending callback and no offer | offer | Rows 1 and 2 apply as usual. The callback stays while the new offer is `queued`, and is cleared when the new offer starts ringing; from then the new offer's own outcome decides what is left (answered: nothing; missed: its own `onMissed`). So the call button never dials a stale knot, and a contact never has two callbacks. | A6 |
| 8 ★ | `queued` | `ringBlocked()` turns false | Head of the queue → `ringing`. Checked on every hook (2.2) and by the 500 ms tick. | A2a/b |

**Answering**

| # | State | Event | Result | Slice |
|---|---|---|---|---|
| 9 ★ | `ringing` | Answer; nothing open | Fix `answerSeconds` from `ringMs` (2.11). `openBlocked()` is false: emit `phone_call_answered`, open the call (2.4) after `SCRIPTED_CALL_START_MS`, checked again then (row 19). After the call, back to the world. | A2a/b |
| 10 ★ | `ringing` | Answer with the player's phone open on its contact list or any text thread | Close the phone with `params._closingForCall = true`; `cleanup` then skips `_emitConversationClosed` for whichever thread was open (`phone-chat-minigame.js:1630-1636`), because the phone reopens on it after the call and the event fires when the player really closes it. Emit `phone_call_answered`, open the call; when it ends, reopen the phone on the screen and thread it was on. A phone object's handset (a desk phone, `phoneId` not the caller's, `interactions.js:1752-1806`) counts as a non-conversation minigame instead (row 12): the banner shows, not the in-phone panel. Until A3 registers the phone with the ringer, every open phone-chat that isn't a call is treated that way. | A3 |
| 11 ★ | `ringing` | Answer with a workstation popup open and no minigame | Note which popup is open (`#laptop-popup`, or `#lab-popup` and its frame's `src`), close it with `window.closeLaptop()` / `window.closeLabWorkstation()` (state kept, 1.3), then row 9. When the call ends, reopen it with `window.openCryptoWorkstation()` / `window.openLabWorkstation(savedSrc)`, unless something else is open by then. | A2c |
| 12 ★ | `ringing` | Answer over a non-conversation minigame | Fix `answerSeconds`. `held`: the ringtone stops, the banner becomes the hold pill (2.4), with a Hang up button unless the call is forced, and the hold timer starts. The minigame is untouched. | A2c |

**On hold**

| # | State | Event | Result | Slice |
|---|---|---|---|---|
| 13 ★ | `held` | a minigame closes or a popup closes (hooks), and `openBlocked()` is false | Wait `SCRIPTED_CALL_START_MS`, check `openBlocked()` again, then `connected` as row 9 (row 11 if a popup is open by then). If the second check fails, the row that matches applies. | A2c |
| 14 ★ | `held` | the minigame closes, but another non-conversation minigame is open by the time the hook runs (an S12 parent reopened, or the closing minigame's `onComplete` opened one) | Stay `held`; the pill stays and the hold timer keeps running. Row 13 runs when that one closes. | A2c |
| 15 ★ | `held` | a conversation opens, or the scripted-scene term turns true (2.2; for example a legacy mapping on `minigame_completed` that opens a scripted call 500 ms later, as m07's sign-off does today, `scenarios/m07_architects_gambit/scenario.json.erb:1625-1638`) | Stays `held`; the pill is hidden and the hold timer pauses while the conversation is on screen. When it is over, row 13 opens the call. It never rings again. The hold time used so far counts towards `HOLD_MAX_MS`. | A2c |
| 16 ★ | `held` | the minigame was closed by a hit, or the player was hit within `HIT_QUIET_MS` when row 13 would run | Stay `held` until `HIT_QUIET_MS` has passed with no hit, then row 13. The call never opens in the middle of a fight. | A2c |
| 17 | `held`, not forced | Hang up | As Decline (row 20). A forced call's pill has no Hang up. | A2c |
| 18 ★ | `held`, not forced | `HOLD_MAX_MS` of unpaused time on hold with the pill showing | `missed`: emit `phone_call_missed:<npcId>`, then `onMissed`. Toast "<Name> rang off. Call back from the thread." (withheld: "The caller rang off."; with `onMissed: "voicemail"` the voicemail toast replaces it). A forced call has no hold limit. | A2c (event), A6 (callback) |

**Opening and missing**

| # | State | Event | Result | Slice |
|---|---|---|---|---|
| 19 ★ | `connected`, opening | `openBlocked()` is true at the second check, or `startMinigame` returns null (knocked out, the scene refused) | Back to `held` (the pill shows only if a non-conversation minigame is open), retried by row 13; it never rings again. An outgoing call that can't open goes back to the thread's return state with no row. The same guard sits on every path that opens a call: rows 9–13, 22, 26 and 27, and the dial path (2.5). The ringer is never left `connected` with no call on screen. | A2a/b |
| 20 ★ | `ringing` | Decline | `missed`: emit `phone_call_declined:<npcId>`, clear the offer. A4 adds the "Missed call" row; A6 runs `onMissed` (2.6). | A2a/b, A4, A6 |
| 21 ★ | `ringing`, not `untilAnswered` | ring timer reaches `RING_TIMEOUT_MS` (not counting paused time) | As row 20, but emits `phone_call_missed:<npcId>`. A call with `untilAnswered` never reaches this row: after `RING_TIMEOUT_MS` its ringtone stops looping and it vibrates once every `UNTIL_ANSWERED_NUDGE_MS`, with the banner still up, until it is answered or declined. | A2a/b, A4, A6 |
| 22 ★ | `ringing`, forced (`disableClose`) | — | No Decline button, no timeout. After `AUTO_ANSWER_MS` of unpaused time with no hit in the last `HIT_QUIET_MS` it answers itself (row 9, 10, 11 or 12 by what is open). | A2c |
| 23 ★ | `ringing` | a conversation opens (a legacy scripted call, a person-chat the player starts, a timed conversation), seen by the start hook | Back to `queued` at the head: banner hidden, timers keep their elapsed time. Rings again when it closes. | A2a/b |
| 24 | `ringing` or `held` | player knocked out | A `ringing` call goes back to `queued` at the head (as row 23). A `held` call stays `held` with the pill hidden and its hold timer paused. | A2a/b |

**Calls in progress and their end**

| # | State | Event | Result | Slice |
|---|---|---|---|---|
| 25 ★ | `connected` | the call ends by its own path: End, the back arrow on a terminal call, `#exit_conversation`, or the story's end (each completes the minigame, 2.5 "Ending") | The story position has already been reset inside the call's minigame before it completed (2.5, "Story position after a call"), so the adapter does only the bookkeeping: clear the offer and `pendingCall`, clear the call VARs (2.11). Then reopen the phone (row 10) or the popup (row 11) if the call displaced one, but only when `openBlocked()` is false and `npcManager._scriptedCallQueue` is empty; otherwise drop the reopen, because a scripted beat the call set off (a bring-in's debrief) opens next. `conversation_closed:<npcId>` fires once, from the call's own phone-chat. A4 adds the "Incoming call, m:ss" row. | A2a/b, A4 |
| 26 ★ | `connected`, forced | a hit closes it (`player-damage-interrupt.js:55-61`) | `pendingCall` kept as `connected`; it rings again (row 1) once there has been no hit for `HIT_QUIET_MS`, opening with `resume` so the unanswered choice shows, with the same `answerSeconds`. Non-forced calls stay open on a hit, as today. While the call waits out `HIT_QUIET_MS`, `callActive()` is false, so a legacy scripted beat can open first; keeping it true would deadlock, because `ringBlocked()` yields to a queued beat (A2a R1, accepted). | A2c |
| 27 ★ | any of `queued`, `ringing`, `held`, `connected` | reload | On load, non-forced: `missed`, with its row, no toast, `phone_call_missed` emitted after `game_loaded`, then `onMissed`. Its trigger was persisted at offer (2.7), so a `room_entered` or `game_loaded` mapping can't offer the same call again on top of the callback. Forced: rings again `RERING_AFTER_LOAD_MS` after `game_loaded`, when `ringBlocked()` is false, opening with `resume`, with the saved `answerSeconds` if it had been answered. | A4 |
| 28 | any | ending starts (the ending check's "End the mission now" is confirmed, or the credits start) | Ringer closes: queued, ringing and held offers are removed with no rows and no events; new offers are refused. Calls already `connected` finish normally. The credits close it only once the server agrees the mission concluded (a refused conclude leaves calls ringing), so the ending check's "End the mission now" on a credits ending does not close it; aim and mapping endings close it at the confirmation. | A2c |
| 29 | `ringing` or `held` | paused | Timers stop, ringtone silent, banner or pill stays. | A2a/b |
| 30 | `queued`, `ringing` or `held` (timed opening call) | — | `hasPendingOpeningConversation` returns true while the ringer holds any offer with `opening: true` in one of those states. | A2a/b |
| 31 ★ | `queued` or `ringing` for contact X | the player places a call to X (button, `#place_call` or callback) | If the outgoing call opens on the offer's knot, the offer is dropped with no row and no event: the player rang first. Otherwise the outgoing call goes ahead and the offer stays `queued` (row 5). | A5 |
| 32 ★ | `connected` (incoming or outgoing) | the call's minigame ends by any other path: another minigame's `startMinigame` ending it (`minigame-manager.js:61-69`), the knockout close (`player-damage-interrupt.js:156-172`), `forceCloseMinigame` | Seen by the end hook when the call's minigame ends without having taken a row 25 path (the call marks itself `_endedByCall` on End, the back arrow, `#exit_conversation` and the story's end, and `_callFinished` once a ringer call's story has ended, so a hit in the close gap counts as row 25). A forced call behaves as row 26. A non-forced incoming call becomes `missed` with no toast, emits `phone_call_missed:<npcId>`, and leaves a callback on its own knot whatever its `onMissed` (it was answered, so a voicemail would make no sense); a withheld caller can't be rung back and leaves nothing. The call's own `cleanup` has reset the story to the home knot before the hook runs (2.5), so the thread never shows the call's choices as texts; calling back runs the knot again from its start with `call_is_callback` true (2.11), so the caller can say the line dropped. A non-forced outgoing call is treated as ended (row 25's row; its story was reset the same way) and leaves no callback; the player can ring again. No reopen of the phone or popup. With the busy rule of 2.9 a legacy scripted conversation can no longer cause this row; it covers the knockout and any minigame opened by code outside the ringer. | A2b (event, no reopen), A6 (callback) |

A `timedConversation` with `ring` is marked delivered when it is first offered, and its `setGlobalOnStart` is set at row 1 (first ring). Nothing but `skipIfGlobal` stops a timed conversation from being scheduled again on a reload (the delivered mark is not saved), so a reload during the ring schedules it again and it re-rings after `delay`; the fix is in A4 (persist the delivered mark with the offer). Row 27 handles a ring that was already saved.

### 2.4 Incoming call UI and the ring layer

**Layer.** A new element `<div id="phone-ring-layer" role="region" aria-live="assertive">` appended to `document.body` by `phone-ringer-dom.js`, styled in a new `css/phone-ring.css` (linked in `app/views/break_escape/games/show.html.erb` beside `npc-barks.css`, `:73`):

```css
#phone-ring-layer {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  width: min(360px, calc(100vw - 32px));
  z-index: 2300; /* above minigames (1500), workstation popups, HUD and toasts (2000); below the pause menu (2500) and confirm dialogs (3000) */
  pointer-events: none;
  font-family: 'GNF', monospace;
}
#phone-ring-layer .incoming-call { pointer-events: auto; }
```

It is never inside `#npc-bark-container`, so `body.minigame-holds-barks` (`css/npc-barks.css:16-20`) does not move it. Top centre keeps it clear of the notification column (top right from 86 px) and of the bark column (bottom left). The A2c proof screenshots it over a lockpick, a keypad, a terminal, a container and the CyberChef popup; if it covers a control in any of them, the fix goes in `phone-ring.css` (a per-minigame offset keyed on `body:has([data-minigame="<type>"])`), not in the minigame.

**Banner** (phone closed, a workstation popup, a phone object's handset, or a non-conversation minigame open): avatar (`npc.avatar`), display name, caption (`callLabelFor`), a status line, a green Answer and a red Decline `<button>` (`aria-label` "Answer call from <name>" / "Decline call"). The status line says what Answer will do:

- nothing open, or a popup open: "Incoming call";
- a non-conversation minigame open: "Incoming call · Answer puts them on hold until you close this".

With `withheld: true` the banner shows "No caller ID" in place of the name, a plain handset glyph in place of the avatar, and no caption. A forced call has no Decline. A call with `untilAnswered` looks the same; only its sound changes after `RING_TIMEOUT_MS` (row 21).

**Inside the phone** (the player's phone on its contact list or a text thread): `phone-chat-ui.js` gains `showIncomingCall(view)` / `hideIncomingCall()`, a full-screen panel over the phone's content with the same fields and buttons. The phone-chat minigame registers with the ringer in `init` and unregisters in `cleanup`, only when it was opened as the player's phone (`phoneId` is the caller's `phoneId`); while one is registered the ringer uses the panel instead of the banner.

**Hold pill** (row 12): the banner shrinks to one line, "<Name> · on hold · close this to talk", with a Hang up button (none on a forced call, row 17). No sound. Hidden while a conversation or the knockout screen is up (rows 15, 24).

**A workstation popup** (row 11): Answer hides the popup with its own close function, the call opens, and the popup comes back as it was when the call ends. CyberChef keeps its recipe and input and the lab sheet keeps its scroll position, because closing only hides them (1.3). For the lab sheet the ringer saves the frame's `src` property (the absolute URL that `openLabWorkstation` compares, `lab-workstation.js:25-27`), never `getAttribute('src')`, which could differ and force a reload. Closing the popup re-enables game input (`lab-workstation.js:51-54`, `crypto-workstation.js:44-48`); for the `SCRIPTED_CALL_START_MS` before the call opens the player could move, which is expected and harmless. The player hears the caller at once and returns to the tool they were using. This matters in m09, where Gary rings at the salvage keypad (`scenarios/m09_digital_archaeology/scenario.json.erb:985`) while the player may be decoding its clue in CyberChef (`safetynet/m09_digital_archaeology.md:127`).

**Sound.** While ringing: `phone_ringtone` on loop (asset in A8; until it exists, `phone_vibrate` every 2 s), and `phone_vibrate` once per cycle. With `untilAnswered`, after `RING_TIMEOUT_MS` the loop stops and `phone_vibrate` plays once every `UNTIL_ANSWERED_NUDGE_MS`. Add `phone_ringtone` to the notifications match in `getVolumeForSound` (`sound-manager.js:205`). Stops on any outcome and while paused.

**Keys.** Esc does not answer or decline. Number keys do nothing to the banner. The banner does not take focus from an open minigame's input.

### 2.5 Outgoing calls and the thread after a call

- **Call entries.** A contact's `call` (3.2) is one entry or a list of entries `{ knot, when, unavailable, button }`. A list lets one contact have several callable beats (m03 HaX has the revelation call and the bring-in call), and lets an author write an OR as two entries with the same knot, since conditions are `&&` only (1.9).
- **Two ways to dial.** The header button, and the ink tag `#place_call` (or `#place_call:<knot>`) in the text thread. The tag lets a hub choice the player already knows ("[I'm done here. Bring me in.]") place the call, so the thread never offers a topic and then refuses it, and lab sheet steps that quote the choice stay true. Both run the same dial path.
- **The one form of `#place_call`.** The tag goes on its own line in the choice's body, and the next line is `-> DONE` (3.2). Because ink gathers tags until it finds visible text (1.9), a divert to the hub after the tag would bring the hub's first line with it, and the phone would type it just before dialling; `-> DONE` brings nothing. A tag inside the choice's brackets lands in `choices[i].tags`, which the phone does not run (1.9), so the validator refuses it (4.3).
- **When the tag runs.** In both the continue path and the after-choice path, once the step's lines have shown and before the `#exit_conversation` and story-end checks (`phone-chat-minigame.js:1174-1196` and the matching branch of the continue path), the phone looks for `place_call` in the step's tags; if found it saves the story, dials and returns. With `-> DONE` the story has ended, so if the call rings out (or can't open) the thread comes back with the story moved to the home knot and continued, which shows the hub again.
- **What the button dials**, in order: a pending callback (2.6); else the first entry with `button` not `false` whose `when` holds; else, if any such entry has `unavailable: "no_answer"`, a call that rings out. If none applies the button is hidden. An entry with `button: false` is reached only by `#place_call:<knot>`.
- **What `#place_call` dials**: with a knot, that entry (the validator requires the knot to be one of the contact's entries, 4.3); with no knot, what the button would dial. The ink's choice condition is the author's gate; the entry's `when`, if it has one, is still checked as the call connects.
- **Not callable**: a contact with `callId` (the judged pretext contact, `phone-chat-minigame.js:376-384`), and any contact while the phone was opened with `disableClose`.
- **Button**: a green phone button in the open thread's header, drawn by the header update in `phone-chat-ui.js`. It reads "Call" (`aria-label="Call <name>"`), or "Call back" (`aria-label="Call <name> back"`) while the contact has a pending callback (2.6). Contact rows are not changed.
- **Dialling**: the phone saves its return state (the `pendingPhoneReturn` shape, `phone-chat-minigame.js:1683-1700`), closes with `_closingForCall` (no `conversation_closed` for that thread), and starts a phone-chat `{ npcId, phoneId, startKnot: <entry knot>, voiced: true, callLabel, ringerCall: { id, direction: 'outgoing', callback }, theme }`. If `startMinigame` returns null, the phone reopens from the return state (row 19). The call screen shows "Calling…", the caption and End, with a UK ring-back tone made with Web Audio (400 Hz + 450 Hz, 0.4 s on, 0.2 s off, 0.4 s on, 2 s off), its gain scaled by the sound manager's master and notifications volumes. After `DIAL_MS`:
  - the entry's `when` holds (or is absent): connected. The story opens on the entry's knot through the explicit-knot path (restore the saved story, then `goToKnot`, `phone-chat-minigame.js:540-557`), so ink-local VARs and visit counts carry over. If an incoming offer for this contact is queued or ringing on the same knot, it is dropped (row 31);
  - `when` fails: it rings out for `RING_OUT_MS`, shows "No answer" for 1 s, adds a "No answer" row, and returns to the thread;
  - a pending callback connects at once, skipping `when`.
- **Ending.** Today End, the back arrow and the story's end leave the minigame open (1.5a). For a call that carries `params.ringerCall`, A2b changes these functions in `phone-chat-minigame.js`, and nothing else:
  - `closeConversation()` (`:1439-1455`): when `this.params.ringerCall` is set, call `this._resetAfterRingerCall()` straight after `_flushPendingMessages()`, before `_emitConversationClosed` and before `this.conversation = null` (`:1450`). Then, after `_emitConversationClosed`, mark `this._endedByCall = true`, show "Call ended m:ss" (skipped in the terminal look), and `this.complete(true)` instead of `this.ui.showContactList(...)`. End and the back arrow both reach it (`:217-227`).
  - `_releaseForcedCall()` (`:1219-1224`): close when `phoneCloseLocked(this.params)` **or** `this.params.ringerCall` is set. For a ringer call the story-end branches also set `_callFinished` when they schedule the close, so a hit in the two seconds before the timer fires is not read as a miss (below). Inside the timer, just before `this.complete(true)`, mark `_endedByCall` and, for a ringer call, call `this._resetAfterRingerCall()`. Inside the timer, because two branches save the story after `_releaseForcedCall()` returns (1.5a); the reset's save then comes last. After the reset the timer shows "Call ended m:ss" for a beat (skipped in the terminal look) and completes after it, through `_completeRingerCallWithBeat()`, the helper `closeConversation()` also uses. All five story-end branches already call it (1.5a), so one edit covers them.
  - `#exit_conversation` already saves and completes (`:1179-1186`); when `ringerCall` is set it calls `this._resetAfterRingerCall()` after `this.saveStoryState()` and marks `_endedByCall`, then the same "Call ended m:ss" beat and `complete(true)` through `_completeRingerCallWithBeat()` (no beat in the terminal look). Only the after-choice path checks for the tag (`:1174-1186`). The continue path, `_presentOutput` (`:809-883`), goes straight to its choices or its story-end branch, so a call knot that ends with `#exit_conversation` before any choice (m03's `{ revelation_heard: … }` guard, a choice-free `first_ring`) still closes, but through the story-end branch and after `FORCED_CALL_END_CLOSE_MS`. A2b gives `_presentOutput` the same check for a ringer call, after the lines have shown and before its choices and story-end branch; `phone-outgoing-call.test.mjs` covers both paths.
  - `cleanup` (`:1630-1636`): when `ringerCall` is set, and either the call is not forced or `_callFinished` is set, and `_endedByCall` is not, call `this._resetAfterRingerCall()` after `_flushPendingMessages()` and before `_emitConversationClosed`. This is row 32 (the call closed by a knockout or by another minigame's `startMinigame`). A forced ringer call closed this way keeps its position, because row 26 resumes it, unless `_callFinished` is set: its story has ended, so it takes the reset and the end hook treats it as row 25, not as a miss.
  Then the row "Outgoing call, m:ss" (or "Incoming call, m:ss") is added, `conversation_closed:<npcId>` fires once, and row 25 runs: the phone reopens from the saved return state on the contact's thread unless a scripted beat is queued. An incoming call answered with the phone closed returns to the world. `callLaunch` calls and legacy voiced mappings have no `ringerCall`, so they behave exactly as today.
- **Terminal-look calls** (m07's Architect) have no call screen (`phone-call-ui.js:18-20`): no End button, no "Calling…" and no "Call ended m:ss". They end on `#exit_conversation`, the story's end, or the back arrow when the call is not forced (all through the changes above), and then row 25 applies as for any call, row included. A terminal contact's ringing call is not a preloaded first open, so its lines are not typed out by the terminal opening (`phone-chat-ui.js:999-1011`); they appear and are voiced line by line.
- **Story position after a call.** Only for a call with `params.ringerCall`. One helper in `phone-chat-minigame.js`, run synchronously while the call's story is still loaded, from the four places in "Ending" above:

  ```js
  /** A ringer call has ended: leave its story on the home knot, so the thread never shows the call's choices as texts. */
  _resetAfterRingerCall() {
    if (!this.params?.ringerCall || !this.conversation || !this.currentNPCId) return;
    if (this._ringerResetDone) return;
    this._ringerResetDone = true;
    const story = this.conversation.engine?.story;
    const npc = this.npcManager?.getNPC(this.currentNPCId);
    const home = callHomeKnot(npc);                       // phone-call-voice.js:41-43
    const knot = story?.currentChoices?.[0]?.sourcePath?.split('.')[0]
              || PhoneChatConversation.stepKnot(story);    // 1.5a
    const ended = !story?.canContinue && !(story?.currentChoices?.length);
    if (!ended && !(knot && this.conversation.callKnots?.has(knot))) return;
    this.conversation.goToKnot(home);                     // moves without continuing
    this._saveStoryStateFor(this.currentNPCId, this.conversation);
  }
  ```

  `callHomeKnot` and `PhoneChatConversation` are already imported by `phone-chat-minigame.js` (`:12`, `:22`), so no test harness copy list changes. It does nothing when the story sits on a knot outside the call set (a call that diverted out of it on purpose). It runs before `complete(true)` and before `this.conversation` is cleared, so `npc.storyState` already holds the home-knot position when `cleanup` runs and when the adapter's end hook (row 25 or 32) decides whether to reopen the phone. Row 25's reopen reads `npc.storyState` through the normal thread open (`phone-chat-minigame.js:540-616`) and finds the home knot. No story is fetched or loaded again, and nothing in the adapter touches the story. A forced call closed mid-way skips the reset (row 26 resumes it). The helper runs only when `params.ringerCall` is set, so `callLaunch` calls (Dev's home knot is itself a call knot, `phone-chat-speaker.js:197-198`) and the legacy voiced calls of m09 and m10 keep their saved stories exactly as today. The lab SE proof checks this byte for byte (5.4).
- **No cooldown.** Ringing again reruns the entry's knot; the ink decides what a repeat call says (visit counts, `{once}` blocks).
- **The lab's path is untouched.** `callLaunch` (`pretext-card.js:294-311`) is not edited. The contact-level `voiced: true` keeps its meaning: a call through `callLaunch` is voiced and opens on the home knot.

### 2.6 Thread rows, missed calls, callback, voicemail

- **Rows.** Only the new paths (`ring`, `call`, callback) add rows. A row is a message `{ type: 'call', callEvent, text, timestamp, read }` with fixed plain text: "Missed call", "Incoming call, 1:24", "Outgoing call, 0:48", "No answer", "Voicemail". With `withheld` the text is "Missed call: No caller ID" / "Call: No caller ID". Rows draw like narration (centred, muted, a phone glyph), are never voiced, never barked. The contact preview shows the last row; a missed call shows "Missed call" in red and counts as unread.
- **`onMissed: "callback"`** (default): the contact gets a pending callback `{ knot, resume }`. The header button reads "Call back" and shows even without a `call` block; the "Missed call" row carries its own small "Call back" button (`aria-label="Call <name> back"`) that does the same. Either connects at once (after the short "Calling…" of `DIAL_MS`) to that knot, which is the same conversation the ring would have opened, with `call_is_callback` set to true (2.11). `#place_call` with no knot dials it too. Cleared when it connects, and when a newer offer from the same contact starts ringing (row 7). A contact with both uses the callback first. Every path that leaves a callback sets the label and the VAR the same way: Decline (row 20), ring-out (row 21), Hang up from hold (row 17), the hold limit (row 18), a reload (row 27) and a call closed by something else (row 32). Withheld callers leave a voicemail and no callback.
- **`onMissed: "voicemail"`**: `ring.voicemailKnot` runs silently into the thread, like a preload. The runner restores the contact's saved story, goes to the voicemail knot, continues to its end, applies its tags, adds its lines to the thread, then, on the same loaded story, moves the position to the home knot with `goToKnot` and saves it once (so ink-local VARs the knot sets, such as m07's `heard_t30`, persist, and the thread opens on its home knot). Until that single save, `npc.storyState` still holds the position from before the ring, so a thread opened while the runner loads shows the old state, never a half-run voicemail knot. Nothing is shown live. Lines written `voice: …` become voice-message bubbles with play buttons (the existing renderer, `phone-chat-ui.js:821-887`), in the terminal look as well. Toast "New voicemail" (with the caller's name unless `withheld`). No callback. A forced call can't be declined or rung off, so it has no voicemail (3.1).
- A mission that wants a story consequence maps the event: `{ "eventPattern": "phone_call_declined:recruiter", "setGlobal": { "recruiter_snubbed": true } }` or a follow-up text.
- **Phone objects with `voice`** (m01 two, sis01 one) are recordings found in the world and stay exactly as they are.

### 2.7 Save and reload

- **The trigger is persisted when the call is offered.** In `_handleEventMapping`, a `phone-chat` mapping with `ring` sets `triggered.persist = true` straight away, as for a handler that opens nothing (`npc-manager.js:1059`), and gets no `persistOnClose` closure (`:1061-1063`). From then on the beat lives in the ringer: in `pendingCall` while it rings, waits or is on the line, and as a callback or voicemail once missed. So a reload never fires the mapping again on top of what the ringer already holds (row 27), and nothing is stranded, because the pending call or its callback carries the beat. `ring` on a `timedConversation` is not yet covered: its delivered mark is not saved (2.3, after the table; A4).
- New per-contact field in the saved phone state: `pendingCall: { knot, state, disableClose, resume, onMissed, voicemailKnot, withheld, untilAnswered, callLabel, answerSeconds }`, `state` one of `queued ringing held connected missed`; `answerSeconds` is present once the call has been answered (2.11). Written on every state change; removed when a call ends normally, when a callback connects, or when the ringer closes (row 28).
- `_phoneStateEntry` keeps an entry that has only `pendingCall` (change `npc-manager.js:2275` to `if (history.length === 0 && !storyState && !npc.pendingCall) return null;`). The server does the same (4.1).
- Message entries gain `callEvent` (one of `missed incoming outgoing no_answer voicemail`). Row texts are never empty, so `:2263` keeps them.
- A pending callback is saved as `pendingCall` with `state: "missed"`, so the "Call back" button survives a reload, and calling back after the reload still sets `call_is_callback`.
- On load, rows 27 and 30 of 2.3 apply. Existing rules are unchanged: `resume` re-ring mappings, `cooldown: 0`, F17/F20 voicing.

### 2.8 Delivery notes on voiced calls

The client passes a voiced call line's `#delivery:` note to `TTSManager.play(speakerId, text, { delivery })`; with no note the call stays exactly `play(speakerId, text)`. The server's `line_delivery` returns the note for lines in voiced call knots, as it does for video calls. The cache key includes the note only when present, so exactly the five lines in 1.9 re-key. Lab SE: none.

How the note reaches the line: in the continue loop (`phone-chat-minigame.js:735-761`) keep each step's tags next to its lines; when a step has several lines and one `#delivery:` tag, the note belongs to the last line of that step (the line the tag ends). Pass it through `_presentOutput` → `_showStoryLine` (`:908`) → `_speakCallLine(line, raw, { delivery })` (`:944`) → `PhoneCallVoice.speak(speakerId, text, fx, { delivery })` (`phone-call-voice.js:159`). Parse with the existing `js/systems/tts-delivery.js` helper.

### 2.9 Calls and other minigames

- `_scheduleDelayedMapping` (`npc-manager.js:643-646`): when `config.ring` is set, `fire` does not wait for the minigame to close; it calls `_handleEventMapping` straight away and the ringer's table decides. Every other mapping keeps today's wait.
- **End hook.** `endMinigame` (`minigame-manager.js:300`, after `_updateBarkLayer()`) calls `window.phoneRinger?.onMinigameEnded?.()`. It runs after any S12 parent has reopened (`:280-287`), so the ringer sees what is open now (row 14). It doesn't run for a parent handing over to a child (`:290-293`), which is right: the child is about to open.
- **Start hook.** `startMinigame` calls `window.phoneRinger?.onMinigameStarted?.(sceneType, params)` after `this.currentMinigame.start()` (`minigame-manager.js:183`), before the return at `:186`. Rows 15 and 23 run from it at once. It is not called when `startMinigame` returns null.
- **Popup hook.** `closeLaptop` (`js/utils/crypto-workstation.js:36-52`) and `closeLabWorkstation` (`js/utils/lab-workstation.js:39-58`) call `window.phoneRinger?.onPopupClosed?.()` beside their `drainDeferredBarks` call, for row 13, except when the ringer itself closed the popup for row 11.
- **Load hook.** The adapter listens for `game_loaded` for row 27.
- Every hook only nudges the ringer to re-run its checks, through `queueMicrotask` (2.2); the 500 ms tick is the backstop.
- **Busy rule.** `_scriptedCallBusy()` (`npc-manager.js:740-748`) becomes `window.phoneRinger?.callActive?.() || this.scriptedConversationActive()`, with today's body moved unchanged into `scriptedConversationActive()` (2.2). While a ringer call is connected or opening, `_queueScriptedConversation` (`:683`) then puts every new scripted conversation in the queue instead of closing the call, and the pump (`:770-786`) opens it once the call's minigame has ended and nothing else is open. This covers `person-chat`, `phone-chat` and `video-call` mappings and timed conversations, since all go through `_queueScriptedConversation`. `ringBlocked()` and `openBlocked()` use `scriptedConversationActive()` and the queue length, never `_scriptedCallBusy()` and never `_scriptedCall` directly, so the two checks don't call each other and a stale record never holds a call (2.2).
- **Auto-challenges during a call.** The busy rule sends an auto-challenge (`dropIfBusy`, any `*_in_view` mapping, 1.2) down the existing busy branch, which drops it (`npc-manager.js:719-723`). So a guard who sees the player during a ringer call does not open a challenge; the challenge fires again on the next sighting after the call. Today the same challenge would close the phone. Scenarios with `_in_view` mappings today: m02, m03, m06, m08, m10, `lab_physical_pentest`, `npc-patrol-lockpick`, `test_gate_tailgate` (grep of `_in_view` over the ERBs). The change applies only while a ringer call is connected, so it reaches m03, m06 and m08 once their migrations add calls, and none of the others. The README busy-rule paragraph says so (A7), and `phone-call-busy.test.mjs` covers it.
- **Text toasts during a call.** `_shouldDefer` (`npc-barks.js:175-186`) gains one term: hold every bark while `window.phoneRinger?.callActive?.()`. A click on another contact's toast would otherwise open that thread through `startMinigame` and end the call (1.3), a row 32 miss in the middle of a bring-in. `endMinigame` drains the held barks once nothing is open (`minigame-manager.js:300-303`), so they appear when the call ends. `phone-ring-layer.test.mjs` covers it.
- Legacy mappings (no `ring`) still close the open minigame as today, except a call the ringer owns (the busy rule above). A scenario that uses neither `ring` nor `call` never has a ringer call, so it sees no change.
- The bring-in hand-off works like this: the call's choice sets the global; the legacy debrief mapping queues behind the call; the call's own last line is typed and voiced; `#exit_conversation` completes the call; row 25 sees the queue is not empty and skips reopening the phone; the pump opens the debrief. The `caller_debrief` contact in 5.3 proves it.
- Video calls do not ring (validator error, 4.3).
- The terminal theme (m07's Architect) has no call screen. A `ring` call to a terminal contact rings with the normal banner, then opens in the terminal look, voiced (1.5).

### 2.10 Speaker ids on the phone path

So that a mission can name which of two same-named records speaks a line (Part B, M2), the phone path accepts an id prefix as person-chat and the server already do (1.6):

- `otherSpeaker(text, contact, knownNames, knownIds)` (`phone-chat-speaker.js:174`): new optional fourth argument, a Map of registered id → display name. A line starting `<id>:` (exact id, case-insensitive, not the contact's own id, never `narrator` or `player`) returns `{ name: <display name>, id, text }`. Display names are checked first, as now.
- `phoneLineVoice` (`phone-call-voice.js:98`) passes the ids from the characters it already gets and uses `other.id` when present.
- `phone-chat-ui.js` (`:230`, `:895`, `_knownSpeakerNames` `:934`) passes the same Map, so the bubble and the subtitle show the display name, never the id.
- The new rule matches any exact registered id, case-insensitively, so plain ids such as `ghost`, `guard`, `dom` or `tomasz`, in Title Case too, count as well as ids with digits or underscores. A1 therefore checks with an id scan, not a pattern: for each scenario, list its NPC ids, and for every ink line on the phone channel whose prefix (text before the first colon) equals one of them, ignoring case, record the file and line. A scan of the phone contacts' inks at this commit finds two kinds of hit. `Narrator:` lines match the hidden `narrator` record that m02, m05, m07, m09 and `lab_tesseract_trials` register (for example `scenarios/m09_digital_archaeology/scenario.json.erb:504`; `m09_phone_gary.ink:18`). `Priya:` and `Dom:` in `scenarios/test_dm_social/ink/priya_dm.ink` and `dom_dm.ink` are each contact's own id. So the id match never matches `narrator` or `player`, and runs only on lines already classed as NPC lines (narration is split off first, `phone-chat-speaker.js:21-38`); the contact's own id is already excluded. With those two rules no phone key moves today. Person-chat inks also have id-equal prefixes (`scenarios/lab_social_engineering/ink/tomasz.ink`, `m04_npc_voltage.ink`), but the phone rule doesn't touch them. The A1 key baseline proves it over every scenario that has a phone contact (5.2).

### 2.11 Engine-written call variables

Two ink VARs tell the caller's ink how the call came about. They are optional: a story that does not declare them is untouched (`setDeclaredVariable`, 1.7a).

| VAR | Type | Value on a ringer call | Value everywhere else |
|---|---|---|---|
| `call_answer_seconds` | int | Incoming call: whole seconds of unpaused ringing from the first ring to Answer, rounded down. Auto-answer counts (it is at most `AUTO_ANSWER_MS`, so 6). Time `queued` (not ringing), time paused, and time on hold after Answer do not count. Outgoing calls and callbacks: 0. | 0 |
| `call_is_callback` | bool | true when the call is a callback connecting (header "Call back", the row's "Call back", or `#place_call` dialling a pending callback); false on every other connect. | false |

**When they are set and cleared.**

- The ringer fixes `answerSeconds` on the offer at Answer (rows 9, 10, 11, 12, 22) from `ringMs`. A replaced offer (row 4) that is already held keeps its value. The dial path sets `isCallback` when it dials a pending callback.
- Just before `startMinigame` for the call, the ringer records `connecting = { npcId, answerSeconds, isCallback }`. It clears it when the call's minigame ends (rows 25 and 32), so the next open of that contact's thread gets 0 and false.
- A forced call resumed after a hit or a reload (rows 26, 27) uses the `answerSeconds` saved in `pendingCall`; `isCallback` is false (a forced call has no callback).

**How they reach the ink.** The ringer adapter registers one engine VAR writer at start-up: `npcConversationStateManager.registerEngineVariableWriter('phone-call', ({ npcId, channel }) => window.phoneRinger.callVariablesFor(npcId, channel))` (1.7a). `callVariablesFor(npcId, channel)` returns the live `{ call_answer_seconds, call_is_callback }` from `connecting` only when all three hold: `channel === 'phone-chat'`; `connecting` is for `npcId`; and the open minigame is that call (`MinigameFramework.currentMinigame?.params?.ringerCall?.id === connecting.id`). Otherwise it returns `{ call_answer_seconds: 0, call_is_callback: false }`. The third test is needed because the contact list's preview also passes `phone-chat` (1.7a); a preview can't run while the call is the open minigame, so it always gets the defaults. Every loader already calls `applyEngineVariables` after restore and sync and before the first Continue; for a call on an explicit knot that is `phone-chat-minigame.js:640`, before `goToKnot` at `:646-648`, while the call is already `currentMinigame` (installed at `minigame-manager.js:174`, started at `:183`). So the values are in the story when the call knot's first line is evaluated, with no new call site in the phone. Every other channel (`phone-preload`, `person-chat`, `email`) gets the defaults, which only matters if a story declares the VARs.

**Saves.** Both names are run-scoped. `npc-conversation-state.js` gains `RUN_SCOPED_NAMES = ['call_answer_seconds', 'call_is_callback']` beside `RUN_SCOPED_PREFIXES` (`:11`), and `isRunScopedVariable` (`:160-162`) checks both, so `recordInkVariables` and `exportNpcInkVariables` never record or send them (an exact list, not a `call_` prefix, because of `test_finale_calls_credits`, 1.7a). They still sit inside a saved `storyState`, but the writer overwrites them on every load. What a save keeps is the state that produces them: `pendingCall.answerSeconds` for a resumed forced call, and `pendingCall.state: "missed"` for a callback, so calling back after a reload still gives `call_is_callback = true`.

**In ink.** Declare them in the caller's ink, at the top:

```ink
VAR call_answer_seconds = 0
VAR call_is_callback = false
```

and choose fixed lines with conditionals, never by printing the value (voiced lines can't print variables):

```ink
=== ring_call ===
// lint: call-knot
{
- call_is_callback: Thanks for ringing back.
- call_answer_seconds > 10: There you are. I was about to give up.
- else: Good, you're there.
}
```

(This is `caller_basic`'s knot in `test_phone_calls`, 5.3. Mission lines are in 7.2.)

The validator warns when a call knot reads either name without declaring it, and errors when one is declared with the wrong type (4.3). README_ink_best_practices.md documents both (A7).

## 3. Part A: scenario schema

### 3.1 `ring`: an incoming call that rings

Allowed on an event mapping with `conversationMode: "phone-chat"` on a phone NPC, and on a phone NPC's `timedConversation` that is not a video call. It implies `voiced: true`; writing both is fine.

```json
{
  "eventPattern": "global_variable_changed:flag1_submitted",
  "condition": "value === true",
  "onceOnly": true,
  "delayMs": 7000,
  "conversationMode": "phone-chat",
  "targetKnot": "call",
  "ring": true,
  "callLabel": "Agent 0x47"
}
```

`ring: true` takes every default. The object form:

| Field | Default | Meaning |
|---|---|---|
| `onMissed` | `"callback"` | `"callback"` or `"voicemail"` (2.6). Declined counts as missed. |
| `voicemailKnot` | none | Required with `onMissed: "voicemail"`. Its `voice: …` lines become voice messages. |
| `withheld` | `false` | The banner and rows show "No caller ID" with no name or avatar. A withheld number can't be rung back, so it requires `onMissed: "voicemail"`, unless the call is forced (`disableClose`), which can't be missed and so needs no voicemail. |
| `untilAnswered` | `false` | `true`: the call has no ring timeout. It rings until the player answers or declines; after `RING_TIMEOUT_MS` the ringtone stops looping and the phone vibrates once every 10 s, with the banner still up (2.3 row 21, 2.4). Decline still works, and the hold limit still applies once answered. Use it for a caller who would keep trying: a handler with news, a panicked contact. Pair it with a `call_answer_seconds` line (2.11) so a long wait gets a comment. No effect on a forced call, which auto-answers (validator warning). |

Ringing out after `RING_TIMEOUT_MS` (20 s) is the default for every call without `untilAnswered`.

Every existing mapping field still applies: `disableClose` (a forced ring: no Decline, auto-answers), `resume`, `callLabel`, `onceOnly`, `cooldown`, `delayMs`, `condition`.

Side effects fire at ring time. A `ring` mapping's `setGlobal`, `completeTask` and the rest run when the call is offered (1.7), even if it is declined, and its `onceOnly` trigger is persisted then too (2.7). An effect that should wait for the call to be taken goes on a separate mapping on `phone_call_answered:<npcId>`, or in the call's ink.

The `targetKnot` of a `ring` call must not be the contact's home knot, unless the contact has `voiced: true` (Dev's form). Put the call in its own knot (3.5).

### 3.2 `call`: a contact the player can ring

On a phone NPC, one entry:

```json
"call": {
  "knot": "support_call",
  "when": "globalVars.vance_is_ally && !globalVars.robert_vance_ko",
  "unavailable": "no_answer"
}
```

or a list of entries, tried in order:

```json
"call": [
  { "knot": "m2_revelation_call", "when": "globalVars.flag_distcc_submitted && !globalVars.revelation_heard", "unavailable": "hidden" },
  { "knot": "extract_call", "button": false }
]
```

| Field | Default | Meaning |
|---|---|---|
| `knot` | required | The knot the call opens on. It is a call knot (voiced, with everything it reaches up to the home knot). It must not be the home knot. |
| `when` | always | A condition in the event-mapping grammar (README "NPC Event Mappings"; `globalVars.` terms joined by `&&`; `value`, `name` and `data.` are not available). Checked as the call connects and, for button entries, to decide whether the button shows. For an OR, write two entries with the same knot. |
| `unavailable` | `"no_answer"` | When `when` fails: `"no_answer"` (the button shows, the call rings out) or `"hidden"` (this entry gives no button). |
| `button` | `true` | `false`: the entry never shows the header button and is dialled only by `#place_call:<knot>` from the thread, gated by the ink choice's own condition. Use it where the beat already has a hub choice, or where its condition needs more than `&&` (2.5). |

The caption is the contact's `callLabel`, else "Voice call" (`callLabelFor`, unchanged).

**The `#place_call` tag.** In the contact's text thread, `#place_call` or `#place_call:<knot>` closes the thread and dials, exactly as the header button does (2.5). It is the way a hub choice becomes a call. It has one form: the tag on its own line in the choice's body, then `-> DONE`:

```ink
+ {attack_prevented and not mission_complete} [I'm done here. Bring me in.]
    #place_call:extract_call
    -> DONE
```

The choice prints no NPC line; the call's knot speaks first. `-> DONE` matters: a divert to the hub would carry the hub's first line along with the tag (1.9) and the phone would type it just before dialling. If the call rings out, the thread comes back on its home knot, which shows the hub again (2.5). A tag inside the brackets (`[Bring me in.] #place_call`) is never run and is a validator error. `<knot>` must be one of the contact's `call` entries (validator error otherwise), so the extractor and the validator know it is a call.

### 3.3 Every form, old and new

| Form | Today | After this plan |
|---|---|---|
| Mapping `phone-chat` + `voiced: true` (m09, m10) | opens at once, voiced, closes the open minigame | unchanged |
| `timedConversation` + `voiced: true` | opens at once, voiced | unchanged |
| Contact `voiced: true` + `callLabel` (lab SE Dev) | `callLaunch` calls are voiced, open on the home knot; the contact list opens a silent thread | unchanged. If a contact also had a `call` block, the call button would use `call.knot` and `callLaunch` the home knot. |
| Mapping `video-call` / `timedConversation.videoCall` (m02, lab_tesseract) | person-chat video call | unchanged; `ring` not allowed |
| Mapping `phone-chat` with no `voiced` | opens a silent thread at once | unchanged |
| `sendTimedMessage` / `timedMessages` | toast + thread | unchanged |
| Phone object with `voice` | voice-message bubble | unchanged |
| **New** `ring` on a mapping or `timedConversation` | — | rings (20 s, or until answered with `untilAnswered`); answer, hold, decline, miss, callback or voicemail |
| **New** `call_answer_seconds`, `call_is_callback` VARs | — | set by the engine on every load; only stories that declare them see them (2.11) |
| **New** `call` on a contact (one entry or a list) | — | call button in the thread; dialling; connects or no answer |
| **New** `#place_call` tag in a text thread | — | the choice or line dials the contact |
| **New** id prefix on a phone line (`agent_0x99: …`) | read as the contact | that character speaks; the display name shows |

### 3.4 Events the engine emits

All carry `{ npcId, knot }` and are usable as `eventPattern`s:

- `phone_call_answered:<npcId>` (also on auto-answer and on a callback connecting; data adds `answerSeconds` and `callback`);
- `phone_call_declined:<npcId>` (Decline, or Hang up from hold);
- `phone_call_missed:<npcId>` (timeout, the caller rang off after the hold limit, or a reload turned it into a miss).

A puzzle that the player closes with Esc or its close button to take a held call ends through its own `complete(false)`, which emits `minigame_failed` and may show the puzzle's failure toast (`base-minigame.js:94-104`). So a mapping on `minigame_failed` can fire when a player closes a puzzle to take a held call. Authors should not map `minigame_failed` to anything that a held call can set off; the README hold paragraph says so (A7).

`conversation_closed:<npcId>` still fires once when a call ends.

### 3.5 How a mission writes a call

- Put each call in its own knot (`call`, `support_call`, `first_call`). The home knot stays the text thread.
- A call ends with `#exit_conversation` on its last line or choice, followed by `-> DONE`: the m09 Nightshade pattern. The post-call reset moves the story to the home knot (2.5). **It never diverts to a hub, to the home knot, or to any other knot the text thread also uses.** After `#exit_conversation` the phone keeps running the story until it reaches choices (1.9), so a divert to the home knot would run the router and show the hub's lines, unvoiced, inside the call; and the call walk would pull a hub into the call and voice it (1.5). The validator warns (4.3). Only Dev's form, where the home knot is itself the call, diverts home.
- The home knot never routes into a call knot. A thread opened by hand must not replay a call as silent texts; the ringer and the call button deliver calls (validator warning, 4.3).
- **"Call me" in a text means a call.** A text, a hub line or a bark that tells the player to call or ring a contact appears only where that contact can be called for that beat: a `call` entry, a pending callback, or a hub choice carrying `#place_call`. Everywhere else the text says "message me", "text me" or "tell me". The validator warns on a `call me` / `ring me` text for a contact with no `call` entry and no `ring` (4.3).
- When a hub topic becomes a call, keep its hub choice and give it `#place_call:<knot>` (3.2), rather than removing it. The player picks the choice they know and the phone dials.
- Write it as speech: no links, no "sent you", no emoji, no printed variables, no inline stage directions (`#delivery:` instead). Narration (`Narrator:`) is shown muted and is not spoken.
- Drop ink choices that fake a call ("[Ring back.]" → "The number rings out.") once the contact has a `call` block with `unavailable: "no_answer"`; the engine does it.
- Where two records share a display name (HaX on the phone and in person), prefix the co-speaker line with the record's id (`agent_0x99:`, `hax_voice:`), so scenario order does not decide the voice (1.6, 2.10).
- A call whose choice sets a global that opens a scene (the bring-in's debrief) still says its last line and ends with `#exit_conversation`; the scene waits for the call (2.9). Put the hand-off line after the choice, so the player hears it before the scene opens.

### 3.6 Writing call openings that don't all sound the same

About two dozen handler calls arrive in this plan, most of them HaX, and many are bring-ins. If each opens "Agent, it's HaX. Good work. Let's get you out", the player hears one call ten times. Rules for the writers of each migration slice:

- **Open on the beat, not on a greeting.** The first line says why she rang or picked up, in words tied to this mission's story: m04 "Sixty-one. You were right not to trust their screens."; m05 "Root flag's in, and you need to hear what's on it."; m07 "Putting you through. He's waiting." (the line `bring_me_in` has today, `scenarios/m07_architects_gambit/ink/m07_phone_agent_0x99.ink:517`) No "Agent, it's HaX" unless the moment calls for formality.
- **Use the two VARs, differently in each mission.** Each handler call that can be rung back has a `call_is_callback` line, and each ringing call that can be left a while (`untilAnswered`, or any call where a wait means something) has a `call_answer_seconds > 10` line. A default ring rings out at 20 s, so the slow-answer line must fit any wait from 11 to 19 s and never names a number. Vary the reaction with the character and the stakes: HaX dry and patient in m01 ("Took your time. Fine, nothing's on fire yet."), clipped in m04 when the plant is at risk ("There you are. That dial won't wait."), relieved after a long ring in m05 ("Finally. Sit down for this."), worried in m07. A callback can be thanked, teased, or skip straight to business. The lines for each mission are fixed in its 7.2 row.
- **No line twice across missions.** Every HaX phone record in m01 and m03 to m07 has the same voice block (name `Aoede`, the same phone-line style, `en-GB`; for example `scenarios/m04_critical_failure/scenario.json.erb:762` onwards), and the TTS key is text plus voice, style and language (1.6). So the same sentence in two missions' call knots is one audio clip heard twice. The rule covers the opening line and the last NPC line of every call, and every line of a bring-in (7.6). Before using a line, the slice writer greps the other missions' call knots for it; section 8 step 3 checks the keys.
- **Fixed strings only.** Voiced lines can't print variables (brief, hard constraints). Choose between whole lines with conditionals (2.11 example); never `{call_answer_seconds} seconds`. Each branch is its own voiced line and its own audio clip, so keep the branches to two or three.
- **Callers other than HaX** use the VARs only where they fit the person: the Recruiter can enjoy being kept waiting; the Architect never thanks anyone for ringing back; Vance, a stressed engineer, picks up on the first ring when the player rings him and has no answer-delay line.
- **Bring-ins are short.** Two to four NPC lines, then the hand-off. The weight goes to the in-person debrief (7.5). A bring-in never reviews the mission ("Let's go over what happened" belongs to the debrief). Each mission's bring-in has its own opening, its own reply to "[Bring me in.]", its own "Not yet" reply and its own last line, tied to that mission's story (7.6). The four missions that share "See you at HQ." and "Car's at … Two minutes." today (m03 to m06) lose both.
- **Vary the shape across a mission.** In one mission, no more than one handler call should open with the same kind of line (status report, question, reaction to the player's find). The slice's ink review (`npc-dialog-review` skill) checks the openings of every call in the mission side by side.

## 4. Part A: server, TTS extraction, validator

### 4.1 Phone state on the server

`app/models/break_escape/game.rb`:

- `PHONE_MESSAGE_KEYS` (`:3302`) gains `callEvent`. In the message `select` (`:3336-3342`): `callEvent` must be one of `missed incoming outgoing no_answer voicemail`, else dropped.
- `sanitize_phone_state_entry` (`:3330`) keeps `pendingCall` only as a Hash with: `knot` and `voicemailKnot` Strings ≤ 200 matching `/\A[A-Za-z0-9_.]+\z/`; `state` in `queued ringing held connected missed`; `disableClose`, `resume`, `withheld`, `untilAnswered` booleans; `answerSeconds` an Integer clamped to 0..3600; `callLabel` String ≤ 100 with control characters stripped (the engine draws it with `textContent`); `onMissed` in `callback voicemail`. Anything else is dropped; a `pendingCall` with no valid `knot` is dropped whole. An entry with only `pendingCall` is kept (change the `return nil` at `:3374`).
- Client mirror: `NPCManager.PHONE_MESSAGE_FIELDS` (`npc-manager.js:145`) gains `callEvent`; `_phoneStateEntry` writes `pendingCall` and keeps a `pendingCall`-only entry (2.7); the restore path reads it into `npc.pendingCall` and hands it to the ringer after `game_loaded`.
- Rails test `test/models/break_escape/game_phone_calls_state_test.rb`: accepted shapes; hostile input (HTML in `callLabel`, a 10 kB knot, a nested object in `pendingCall`, an unknown `state` or `callEvent`, a `type` over 20 characters, `answerSeconds` as a string, negative or 10^9) dropped or clipped; the 512 kB cap still refuses; a `pendingCall`-only entry survives.

### 4.2 TTS extraction lists exactly the callable lines

`app/services/break_escape/tts_line_extractor.rb`:

- Slice A2b builds the `ring` parts of this list and the matching client change; A5 builds the `call` parts.
- `voiced_phone_call?` (`:154-161`) is also true when the NPC has a `call` entry (one or a list), or a mapping or `timedConversation` for it has `ring`.
- `call_start_knots` (`:213-227`) adds the knot of every `call` entry, `button: false` entries included (they are what `#place_call:<knot>` dials); the `targetKnot` of each `phone-chat` mapping with `ring` (with or without `voiced`); the `timedConversation.targetKnot` when it has `ring`.
- Voicemail knots: `voicemail_knots(npc)` collects each `ring.voicemailKnot`. A new branch in `each_host_line` (`:499-529`) yields only the lines of those knots whose text starts `voice:`, prefix stripped, under the contact's voice. They do not widen the call walk.
- `line_delivery` (`:367-371`): return the `#delivery:` note for lines in voiced call knots as well as video knots. Rename its second argument from `person_chat` to `sends_delivery`; keep `person_chat` for narration, so narration in a voiced call stays unspoken (`:526-527`). Video knots keep `person_chat` true, so their notes and keys are unchanged.
- Client parity: `callStartKnots` (`phone-chat-speaker.js:190-210`) gets the same additions; `voicedCallKnots` is unchanged.
- `cache_stamp` (`:433-445`) already includes `hosts`; nothing to add.

**Key identity rule.** For every scenario that adopts none of the new keys, the extractor's `keys` (`:99`) must be identical before and after each engine slice, apart from the five delivery re-keys of A1. Slice A0 records the baseline; every later slice compares.

### 4.3 Validator (`scripts/validate_scenario.rb`)

- Add `call` to the known NPC fields (`:431-436`) and `ring` to the known mapping fields (`:461-466`).
- New check `check_phone_calls(json_data, base_dir)`, called beside `check_ink_files`. It uses the rendered scenario and the compiled ink the validator already loads, and its own copy of the 20-line knot walk (`reachable_knots`, `tts_line_extractor.rb:193-211`).
  - error: `ring` on a mapping whose `conversationMode` isn't `phone-chat`, on a non-phone NPC, or on a video call;
  - error: a `call` entry's `knot` or a `ring.voicemailKnot` not a knot in the compiled ink;
  - error: a `#place_call:<knot>` tag in a contact's ink whose knot is not one of that contact's `call` entries; a `#place_call` with no knot in an ink whose contact has no `call` entry and no `ring` with `onMissed: "callback"`;
  - error: a `call` entry's `knot`, a `ring` mapping's `targetKnot` or a ringing `timedConversation.targetKnot` equal to the home knot (`currentKnot`, default `start`), unless the contact has `voiced: true`;
  - error: `onMissed: "voicemail"` with no `voicemailKnot`; `withheld: true` without `onMissed: "voicemail"` on a call that is not forced; an unknown `onMissed` or `unavailable` value; a `button` that isn't a boolean; a `call` that is neither an object nor a list of objects;
  - error: `call.when` that uses `value`, `name` or `data.`;
  - error: `ring.untilAnswered` that isn't a boolean; warn: `untilAnswered` on a forced call (no effect);
  - error: a `#place_call` tag inside a choice's brackets (it is never run, 1.9); warn: a `#place_call` line whose next line in the compiled ink is not `-> DONE` (the next visible line would be typed before dialling, 2.5);
  - error: `call_answer_seconds` declared with a non-integer default, or `call_is_callback` with a non-boolean one (the ink compiler already refuses a read of an undeclared name); warn: a contact's ink declares either but the contact has no `ring` and no `call` entry, so the VAR is always 0 or false; warn: a ringing call contact with `untilAnswered` whose call knot never reads `call_answer_seconds`;
  - warn: a call start knot that is reachable from the contact's home knot (the thread would replay the call as silent texts; 3.5), unless the contact has `voiced: true`;
  - warn: a knot in a contact's call set, other than a call start knot, that is also reachable from its home knot (the thread and the call share it, and the call voices it; 3.5);
  - warn: a knot in a call set that diverts to the home knot, unless the contact has `voiced: true` (3.5);
  - warn: a `call` or `ring` contact with no `voice`;
  - warn: a contact with `callId` and a `call` entry (the button is hidden);
  - warn: a `sendTimedMessage.message`, `timedMessages` text or bark for a contact with no `call` entry and no `ring` that matches `\b(call|ring) me\b` (case-insensitive): the text promises a call the contact can't take (3.5);
  - warn: a `call` contact not in its phone's `npcIds` that nothing gives history to (no `ring`, no `timedMessages`, no `sendTimedMessage` for it): its thread, and so its button, never appears (`phone-chat-ui.js:506-517`);
  - Voiced-line checks on the call set and voicemail knots: no printed variables (`{…}` that prints), no inline stage directions in parentheses or asterisks. These replace the phone-channel gap in dialoguelint (1.9).
- Tests: `test/js/validator-phone-calls.test.mjs`, following `test/js/validator-social-pretext.test.mjs`.

### 4.4 dialoguelint: call writing in a text knot

`scripts/ink_runtime_check/dialoguelint.mjs` gains a warn-level rule `call-in-text-thread`, with no scenario knowledge:

- Scope: every knot on the phone channel (`lintInk(text, { channel: "phone" })`, `dialoguelint.mjs:122`).
- Fires on an NPC line or narration matching any of: `\b(you|she|he)\s+picked up\b` not followed by an object (the, a, an, it, his, her ...), `\bon (the|my|her|his) line\b` (not "this": "not on this line" is the channel idiom), `\bget off (her|my|his) line\b`, `\bhang(s|ing)? up\b`, `\bthe line (drops|goes dead|is dead)\b`, `\byour handset (rings|lights)\b`, `\brings out\b`, `\bcaller id\b`.
- Does not fire on "ring <Name> back", "call me", "I'll ring", or inside a choice's bracketed text.
- Suppressed per knot by a comment line `// lint: call-knot` directly under the `=== knot ===` line. The mark covers the whole call: dialoguelint spreads it along diverts, tunnels and threads from a marked knot (stopping at the contact's home knot, read from `currentKnot`, default `start`), so only the call's first knot carries it, and `_choices` and `_close` knots need none. The rule then flags only text knots. A ring with no `targetKnot` is a validator error (the engine would open the thread's current knot), so the call's first knot is always named.
- Fixture list of expected hits today: m05 Recruiter `hangs_up`, `end_contact`, `never_talked_terms`, `idle`, `recruiter_deal_taken`, `recruiter_deal_refused`, `recruiter_final_statement`; m07 Architect `taunt_t30`, `t30_close`, `taunt_t20`, `taunt_t5`, `taunt_t1`, `t1_close`; m09 Nightshade, Torres and Gary `start` and `call`. The migrations clear them.
- `dialoguelint.mjs:798`: stop skipping delivery checks on the phone channel for knots marked `// lint: call-knot`.

## 5. Part A: tests and proofs

### 5.1 Node unit tests (`test/js/`, run with `bin/test-js`)

New engine modules have no imports (or only `phone-chat-speaker.js`), so tests copy them into a temp dir as `test/js/finale-voiced-calls.test.mjs:24-26` does. **Every new static import added to an engine module must be added to each test harness copy list that copies that module** (grep `test/js` for the module's file name), or node tests fail with ERR_MODULE_NOT_FOUND.

| File | Covers |
|---|---|
| `phone-ringer.test.mjs` | one named test per row of the 2.3 table (rows 1–32), with a fake clock, fake framework, fake popups and fake npcManager; `ringBlocked()` and `openBlocked()` term by term, including the A2b "any minigame blocks" stage; **stale scripted record**: with the real `NPCManager` methods (not a fake), a scripted person-chat opens through `_queueScriptedConversation` with `startDelayMs: 0` and closes through `endMinigame`, then a ring offer rings at once and `_scriptedCall` is null afterwards; the same with an answered offer, which opens at once; the second `openBlocked()` check before opening (rows 13, 19); an answered offer never rings again or times out after a conversation or a failed open (rows 15, 19, 24); hold time across a conversation (row 15); no Hang up on a forced held call (row 17); `untilAnswered`: no timeout after 60 s, the nudge cadence, Decline still works (row 21); `callActive()` true from the open decision until the call's minigame ends, read live from the framework (false the moment `currentMinigame` is nulled); hooks re-check in a microtask, so a swap gives no ringtone blip; events and their data |
| `phone-ring-config.test.mjs` | `normaliseRing(mapping)`: `true` and object forms, defaults, `untilAnswered` default false, bad values dropped, `withheld` without voicemail only when forced; `normaliseCall(npc)`: one entry or a list, `button` default, bad entries dropped |
| `phone-call-vars.test.mjs` | `callVariablesFor`: `call_answer_seconds` from unpaused ring time (paused, queued and hold time excluded; auto-answer about 6; outgoing and callbacks 0); `call_is_callback` true only on a callback connect, from the header button, the row's button and `#place_call`; both cleared when the call's minigame ends, so the next thread open reads 0 and false; **channel**: while a call is connecting, the writer gives the live values for `phone-chat` with the call as `currentMinigame`, and the defaults for `phone-preload`, `person-chat`, `email`, a `phone-chat` load for another contact, and a `phone-chat` contact-list preview (no call open); a story without the VARs is untouched; `isRunScopedVariable` true for both names and still false for `call_started` and `call_done`; a resumed forced call keeps its saved `answerSeconds` |
| `phone-call-busy.test.mjs` | the busy rule: with a ringer call connected, `_queueScriptedConversation` queues a `person-chat` mapping, a `phone-chat` mapping and a timed conversation instead of calling `endMinigame`; the pump opens the head once the call's minigame has ended; with no ringer call, today's close-and-open is unchanged; row 25 skips the reopen while the queue is non-empty; `scriptedConversationActive()` clears a record whose minigame has ended and returns false, and `_scriptedCallBusy()` gives today's answer whenever `callActive()` is false; a scripted scene that opened and closed before a ringer call does not make `ringBlocked()` or `openBlocked()` true; **auto-challenge**: a `player_in_view` person-chat mapping fired during a connected ringer call is dropped (no queue entry, no `endMinigame`), and the same mapping fired again after the call opens normally |
| `phone-ring-layer.test.mjs` | the layer is outside `#npc-bark-container`; `phone-ring.css` z-index 2300; delayed `ring` mappings fire with a lockpick open and other delayed mappings still wait (`_scheduleDelayedMapping`); no `endMinigame` call and no `minigame_failed` on Answer over a minigame; the start, end and popup hooks call the ringer; Answer over a popup closes it with its own function and reopens it with the saved `src` after the call; **barks**: during a connected ringer call `_shouldDefer` holds another contact's bark (no toast, so no click can open a thread), and the bark shows once the call's minigame has ended; a text held during a call with nothing opening after it shows as soon as the call ends (the drain at `minigame-manager.js:301-303` finds `callActive()` false); with no ringer call, a phone-chat still shows other contacts' barks as today |
| `phone-outgoing-call.test.mjs` | `when` with the mapping grammar; `no_answer` and `hidden`; entry order and `button: false`; `#place_call` with and without a knot: nothing is typed before dialling, and the thread returns on its home knot when the call rings out; pending callback wins over every entry; the button reads "Call back" with a callback pending and "Call" otherwise; row 31; no button for `callId` contacts or under `disableClose`; End, the back arrow on a terminal call, and the story's end (each of the five branches) each complete the minigame once with one `conversation_closed`; a legacy voiced call and a `callLaunch` call with the same three actions keep today's behaviour (contact list shown, minigame open); **reset**: `_resetAfterRingerCall()` runs inside the minigame before `this.conversation` is cleared: after End mid-choice, after the back arrow, after `#exit_conversation`, after each story-end branch (with the branch's own later save, the timer's reset save is the last write), and from `cleanup` when a knockout closes a non-forced call; **close gap**: a hit in the two seconds after a ringer call's story ends (`_callFinished` set, `_endedByCall` not yet) resets the story, leaves no callback (non-forced) and does not re-ring with `resume` (forced); **`#exit_conversation`** on a knot with no choice before it closes at once on the continue path as on the after-choice path; in each case `npc.storyState` is on the home knot before the end hook runs (`minigame-manager.js:300`), and for the own-path ends before `complete` emits `minigame_completed`; a forced call closed by a hit keeps its position; a call that diverted to a knot outside its call set is left there; for a `callLaunch` call and a legacy voiced call `npc.storyState` is byte for byte what it was before the change |
| `phone-call-log.test.mjs` | rows only on new paths, never for pretext calls or legacy voiced mappings; row texts; `withheld` texts; preview and unread for a missed call; rows never voiced or barked |
| `phone-call-persistence.test.mjs` | `pendingCall` export and restore for every state; a first call from a contact with no history survives `_phoneStateEntry`; `callEvent` survives; a pending callback survives as `state: "missed"`; `answerSeconds` and `untilAnswered` survive; reload rules of row 27; a `ring` mapping's trigger is persisted at offer, so a `game_loaded` or `room_entered` ring mapping does not fire again after a reload that turned its call into a callback |
| `phone-call-delivery.test.mjs` | the note reaches `TTSManager.play` options for a voiced call line; two lines and one tag in a step: the note goes to the last; no note → exactly `play(speakerId, text)` |
| `phone-speaker-ids.test.mjs` | `otherSpeaker` with an id prefix returns the display name and id; display names still win; the contact's own id is not "other"; `Narrator:` with a registered `narrator` record stays narration; Dev's and Ruth's lines unchanged |
| `phone-call-knots-parity.test.mjs` | `callStartKnots` includes every `call` entry's knot (`button: false` too) and `ring` targets written without `voiced` (the `ring` cases are built in A2b, the `call` cases in A5), not voicemail knots; unchanged for every old form in 3.3 (fixtures: Dev, an m09 HaX mapping, m10 Victoria, m02 Ghost video) |
| `dialoguelint-call-in-text.test.mjs` | the rule's hits and non-hits (Ruth's "Ring Dev back" doesn't fire), the `// lint: call-knot` suppress |

Existing tests that must still pass: `phone-voiced-contact`, `social-lab-dev-call`, `social-lab-ruth-phone-keys`, `social-lab-ruth-keys`, `social-pretext-*`, `phone-call-mode`, `phone-call-queue`, `scripted-conversation-queue`, `finale-voiced-calls` (A1 updates `:255`, `:257`, `:261`), `finale-forced-call-and-closing-card`, `phone-reopen-and-persistence`, `social-video-call-label`. Full suite under `flock /tmp/be-test-suite.lock bin/test-js -j 3` at the end of each slice.

### 5.2 Rails tests

- `test/models/break_escape/game_phone_calls_state_test.rb` (4.1).
- `test/unit/break_escape/tts_line_extractor_calls_test.rb`: a fixture scenario in `test/fixtures/files/` with a `call` contact (a list with a `button: false` entry), a `ring` mapping, a voicemail knot and a home knot with lines: the extractor lists exactly the call and voicemail lines, never the home knot, never narration; delivery notes are carried for voiced call lines; an `agent_0x99:` prefix resolves by id.
- `test/unit/break_escape/tts_mission_lines_test.rb:103` loops all missions; it must keep passing and picks up migrated missions by itself.
- Key identity (A0): for every scenario with at least one `npcType: "phone"` record (A0 lists them; it includes `lab_social_engineering`, m01–m10, sis01–03 and `lab_tesseract_trials`), dump `TtsLineExtractor.new(name, data).keys.sort` to `docs/agents/phone_calls/keys_baseline/<scenario>.txt` and compare after each engine slice. Allowed difference: the five A1 delivery re-keys in m09 and m10.
- Run under `flock /tmp/be-test-suite.lock` with `BUNDLE_PATH` set (brief).

### 5.3 Focused test scenario: `scenarios/test_phone_calls/`

Add it to `scenarios/TEST_SCENARIOS_README.md`. One small office room, the player's phone, a door with a lockpick lock and a keypad (non-conversation minigames to ring over), a person NPC to talk to (a conversation to queue behind), a lab-sheet workstation and a CyberChef workstation (the two popups), a hostile NPC that can be woken with a lever (damage for rows 16, 22 and 26), a second lever that sets `ring_again`, a patrolling guard with a `player_in_view` person-chat mapping (an auto-challenge, 2.9), and these contacts (all voiced, short ink, no printed variables):

| Contact | Shows (2.3 rows) |
|---|---|
| `caller_basic` | The scenario opens with a `timedConversation` person-chat briefing from `debrief_host` at 0 s, as m01's is wired (`scenarios/m01_first_contact/scenario.json.erb:563-570`), so the first ring comes after a closed scripted scene (2.2). Then `ring: true` on `room_entered` of the office after 3 s: banner with the phone closed, answer, call, row, back to the world (1, 9, 25). It must ring within 3.5 s of entering the room, with the briefing closed before. A second `ring` mapping on `global_variable_changed:ring_again` (set by a second lever, `onceOnly: false`, `cooldown: 0`) offers the same knot again. Its ink (`ring_call`, 2.11) declares both VARs: answered at once the first time (plain line), after 12 s on the lever's ring (the slow-answer line); the `/tts` requests show the two different texts. End, and on the lever run the story's end, each close the call once |
| `caller_patient` | `ring: { untilAnswered: true }`: still ringing after 60 s with the banner up and the vibrate nudge every 10 s; answered at about 45 s, its `call_answer_seconds > 10` line plays (21). A6 adds: a second run declined at 30 s leaves a callback |
| `caller_decline` | `ring` with callback: decline emits the event and a `phone_call_declined` mapping sets a global (20); let a second offer time out (21). A4 adds: missed row, red preview. A6 adds: the header button reads "Call back" and the missed row has its own "Call back" button; either connects at once to the same knot, whose `call_is_callback` branch ("Thanks for ringing back.") plays and which reads the global; after the call the button reads "Call" again (or is hidden); a new offer while the callback is pending clears it when it rings (7); a reload with the callback pending keeps "Call back" and the VAR |
| `caller_debrief` | a person NPC `debrief_host` with a legacy `person-chat` mapping on `global_variable_changed:debrief_go`, `disableClose: true`, as m01's debrief is wired (`scenarios/m01_first_contact/scenario.json.erb:1116-1124`). The contact's `call` entry (`button: false`) is placed from a hub choice with `#place_call`; the call's choice sets `debrief_go` and then says one hand-off line before `#exit_conversation`. Proof: the hand-off line is typed and voiced (its `/tts` request completes), the call closes, the phone does **not** reopen, and the person-chat opens straight after. Variants: the same with a ringing call answered with the phone closed; a text from `texter` sent by a `delayMs` mapping during the call: no toast shows while the call is up, and it shows after the debrief closes; a knockout during a connected non-forced call (32): the call closes, a callback is left, the thread opens on its home knot, and calling back plays the `call_is_callback` line. A guard NPC with a `player_in_view` mapping sees the player during the call: no challenge opens and the call carries on; walking back into view after the call brings the challenge |
| `caller_voicemail` | `ring` with `withheld` and `onMissed: "voicemail"`: "No caller ID" banner; decline leaves a voice message whose knot sets an ink VAR that the next thread open reads (20, A6); a terminal-theme twin `caller_terminal` does the same in the terminal look and its voicemail bubble plays |
| `caller_forced` | `ring` + `disableClose`: no Decline; auto-answers; a hit closes it and it rings again with `resume`; auto-answer waits while the player is being hit (22, 26) |
| `caller_hold` | `delayMs` `ring` set off by the keypad's `door_unlock_attempt`: rings over the keypad, Answer → hold pill, closing the keypad opens the call (12, 13). Variants: the keypad's success also fires a legacy scripted call through a `minigame_completed` mapping, which opens first while the held call waits and then rings (15); the woken guard's hit closes the keypad while the call is held, and the call opens only after `HIT_QUIET_MS` with no hit (16); the call is held over a note opened from a container, and closing the note reopens the container (S12), so the call stays held until the container closes (14); left on hold for `HOLD_MAX_MS`, it rings off with the toast and a callback (18) |
| `caller_queue` | rings while the person-chat is open: waits, then rings; a second caller rings after the first ends; a legacy forced call opening over a ringing call sends it back to the queue; a ring answered while the player is knocked out goes back to the queue (2, 6, 8, 19, 23, 24) |
| `caller_replace` | two `ring` mappings on one contact, second knot newer: only the newer rings (3, 4) |
| `caller_thread` | rings while its own thread is open, while another contact's thread is open, and while the contact list is open: Answer closes the phone with no `conversation_closed` for the open thread, and the phone reopens there after the call; a desk phone object open at the time shows the banner instead (10). In the own-thread case the player ends the call with End while its choices are showing; the reopened thread shows the home knot's text and choices, never the call's choices, and has no unvoiced call lines added after the call's transcript |
| `caller_popup` | rings while the CyberChef popup is open, and again while the lab-sheet popup is open: Answer hides the popup, the call opens, and the popup returns afterwards with its recipe, input or scroll position kept (11) |
| `desk_contact` | `call` list: a button entry always available and a `button: false` entry dialled by a hub choice with `#place_call:<knot>`; dialling; ink-local visit counts carry over a second call; End mid-choice then open the thread → home knot; a queued ring on the same knot is dropped when the player rings first (31) |
| `away_contact` | `call` with `when` false then true (a lever sets the global): no answer, then connects; a second contact with `unavailable: "hidden"` has no button until the global is set |
| `timed_caller` | `timedConversation` with `ring` and `opening: true` at 2 s: the Mission Brief popup waits; decline (30). A4 adds: reload during the ring → missed, not rescheduled (27) |
| `texter` | plain texts and a plain silent thread (unchanged path) |
| `legacy_voiced` | a legacy voiced mapping call (no `ring`): opens at once and closes the open minigame, as today; no rows; End shows the contact list as today and the saved story is not reset |

Validator clean (0 errors).

### 5.4 Live browser proofs (port 3023, headless)

Driver: `.claude/skills/playtest-scenario/scripts/playtest-session.js`; games via `bundle exec rails runner tools/playtest/new-game.rb <scenario>`. Each proof saves small screenshots and the console log under `docs/agents/phone_calls/proofs/<slice>/` and lists the `/tts` requests (text, npc_id, delivery).

**Routes to deep beats.** The playtest bridge (`window.__test`, see `.claude/skills/playtest-scenario/SKILL.md`) sets the preconditions; the triggering event then happens for real (walk through the real door, open the real object, close the real conversation). Setting the trigger global itself through the bridge counts as real only where the mapping listens to `global_variable_changed` and the global's own setter is a VM flag submission. A0 writes each route to `docs/agents/phone_calls/proofs/ROUTES.md` and every later proof follows it.

| Beat | Mapping | Route |
|---|---|---|
| lab SE Dev call | `callLaunch` | play from the start: open the desk phone, fill the pretext card, place Dev's call; finish; open the phone and check Ruth's and Dev's threads, then reload and check both again. Dump `npc.storyState` for `dev_service_desk` and `ruth_phone` after the call and after the reload; both must equal A0's dumps byte for byte |
| m09 Recruiter call + resume | `rec_maps` `room_exited` `restricted_cage` (`scenarios/m09_digital_archaeology/scenario.json.erb:453`) | set the `ring_c` globals, teleport into `restricted_cage`, walk out; take a hit from a woken guard to close it; let the `resume` re-ring fire |
| m09 HaX `identity_scene` | `call_map` `room_entered` variant (`:335`) | set `flag3_submitted`, `nightshade_file_held`; walk into the room the condition names |
| m10 `breach_call` | `global_variable_changed:breach_open` (`scenarios/m10_full_disclosure/scenario.json.erb:1723`) | set prerequisites, then perform the real action that sets `breach_open` (find its setter in the ERB/ink at A0) |
| m10 `victoria_call` | its mapping in the `victoria_line` record | as above: preconditions by bridge, trigger for real |
| m02 console video call | `on_recovery_console` | set prerequisites; use the real recovery console |
| lab_tesseract video call | `the_offer_call` on `relay_opened` | set prerequisites; open the real relay |
| m10 HaX co-speaker portraits | `agent_0x99:`-to-be lines in `m10_tesseract.ink` and `m10_director_netherton.ink` (today `Agent HaX:`) | reach each scene by its real trigger; screenshot the person-chat at an `Agent HaX:` line (portrait, name, lip-sync frame) and log its `/tts` request |

**Cadence.** The lab SE proof runs before A0's end and after every slice. The others run at A0 and after A1, A2b, A2c, A5 and A7 (the slices that touch call opening, voicing or extraction). The portrait route runs at A0 and in M2. Compare `/tts` request lists with A0's: same texts, npc_ids and delivery, apart from the five A1 lines.

**New behaviour.** Every row of the 5.3 table, driven in `test_phone_calls` on the real phone, the real events and a real reload.

A helper test passing is not proof. A slice is done when its proof ran on the real path.

## 6. Part A: implementation slices

Each slice: write the tests first, implement, run the slice's tests and the full JS suite, run the 5.4 proofs its cadence names, commit with explicit paths, add a line to `docs/agents/PHONE_CALLS_LOG.md`. A Sonnet implementer does one slice at a time; an Opus reviewer checks it against this plan and the code before the next starts.

Order: A0, A1, A2a, A2b, A2c, A3, A4, A5, A6, A7. A8 can run any time after A2b. Each slice's tests and proofs use only what the slices before it built: the parts of a row that need a later slice (thread rows, callbacks, reloads) are tested in that slice, as the row's slice column in 2.3 shows.

### A0. Baseline (no engine change)

- List every scenario with a phone record and record its key baseline (5.2).
- Write `docs/agents/phone_calls/proofs/ROUTES.md` (5.4) and run every route on the unchanged engine, the m10 portrait route included; save the `/tts` request lists and the portrait screenshots to `docs/agents/phone_calls/proofs/A0/`.
- Run `bin/test-js` and the Rails TTS tests; note counts in the log.
- Accept: baselines, routes, request lists and screenshots committed; suite counts logged.

### A1. Delivery notes on voiced calls; speaker ids on the phone path

- Delivery (2.8): `phone-chat-minigame.js` continue loop (`:735-761`), `_presentOutput`, `_showStoryLine` (`:908`), `_speakCallLine` (`:944`); `PhoneCallVoice.speak` (`phone-call-voice.js:159-191`, the `play` call at `:165` becomes `this.tts.play(speakerId, text, delivery ? { delivery } : undefined)`).
- Server: `line_delivery` for voiced call knots (4.2).
- Speaker ids (2.10): `otherSpeaker`, `phoneLineVoice`, the two `phone-chat-ui.js` callers. Run the id scan of 2.10 and commit its output to the log.
- Update `test/js/finale-voiced-calls.test.mjs:255, 257, 261` to the new source.
- Accept: `phone-call-delivery.test.mjs`, `phone-speaker-ids.test.mjs`; the key diff shows exactly the five lines of 1.9 re-keyed and nothing else in any baseline; m09 proof: the `tesseract_call` line (`m09_phone_agent0x99.ink:678`) requests with its note. Log the five lines for the audio step.

### A2a. The ringer as a pure module

- `js/minigames/phone-chat/phone-ringer.js`: the 2.3 table with every row whose slice column names A2a/b or A2c, `ringBlocked()` and `openBlocked()` as injected predicates, the offer queue, the timers on an injected clock, the pause rule, and an adapter interface (open a call, show/hide banner and pill, close/reopen a popup, emit an event, persist a trigger, read the time of the last hit). No imports.
- At rows 20, 21, 25 and 32 A2a does only this: emit the event, clear the offer, and (row 25) ask the adapter to reopen. It adds no thread row (A4) and no callback or voicemail (A6). Row 18 emits the event and shows the toast; its callback comes with A6. `untilAnswered` (row 21), `callActive()` and the `answerSeconds` bookkeeping (2.11) are in the module from the start.
- `js/minigames/phone-chat/phone-ring-config.js`: `normaliseRing`, `normaliseCall`.
- Accept: `phone-ringer.test.mjs` for those rows, `phone-ring-config.test.mjs`. An Opus reviewer checks the module against 2.2 and 2.3 before A2b starts.

### A2b. Wiring and the banner, phone closed

- `js/minigames/phone-chat/phone-ringer-dom.js`: the layer and the banner (2.4), `css/phone-ring.css` and its `<link>`, the ringtone placeholder and the `untilAnswered` nudge, the pause checks, `ringBlocked()` and `openBlocked()` on the live window, created after `js/main.js:137`. In this slice any open minigame or popup blocks ringing (2.2, "Built in stages").
- `npc-manager.js`: in the phone-chat branch (`:1495-1527`) and the timed delivery (`:2059-2140`), when the config has `ring`, call `window.phoneRinger.offer({...})` instead of `_queueScriptedPhoneCall`. Copy `ring` onto the mapping config in the mapping builder (`:861-890`) and onto the scheduled timed conversation (`:352-369`, `:1861-1886`). `_scheduleDelayedMapping` (`:643-646`) skips the minigame wait for `ring` (2.9). `hasPendingOpeningConversation` (`:1938-1946`) reads the ringer (row 30). In `_handleEventMapping`, a `ring` mapping is persisted at offer (`:1059`, 2.7). Split `_scriptedCallBusy()` (`:740-748`) into `scriptedConversationActive()` and the busy rule (2.2, 2.9); the adapter's `ringBlocked()` and `openBlocked()` call `scriptedConversationActive()` and read the queue length, never `_scriptedCall`.
- The `ring` half of 4.2, so incoming calls are voiced and reset from this slice: `callStartKnots` (`phone-chat-speaker.js:198-209`) and `call_start_knots` (`tts_line_extractor.rb:213-227`) add the `targetKnot` of each `phone-chat` mapping with `ring` and the `timedConversation.targetKnot` with `ring`, with or without `voiced`; `voiced_phone_call?` (`:154-161`) is true for a contact with a `ring` mapping or timed conversation. Without this, a `ring` written without `voiced` opens a call whose `callKnots` lacks its own knot: every line skipped (`phone-chat-minigame.js:947`) and `_resetAfterRingerCall()` returning early.
- `npc-barks.js`: `_shouldDefer` (`:175-186`) holds barks while `window.phoneRinger?.callActive?.()` (2.9).
- `phone-chat-minigame.js`: the call end changes of 2.5 "Ending" (`closeConversation` `:1439-1455`, `_releaseForcedCall` `:1219-1224`, the `#exit_conversation` branch `:1174-1186` and the same check in `_presentOutput` `:809-883`, `cleanup` `:1630-1636`), each only for `params.ringerCall`; the `_endedByCall` mark for row 32 and the `_callFinished` flag; `_resetAfterRingerCall()` (2.5 "Story position after a call"), called synchronously from those four places while the story is loaded.
- The adapter's row 25 handler does the bookkeeping and the guarded reopen only; it never touches the story. Row 32's event and "no reopen" (its callback comes in A6).
- `npc-conversation-state.js`: `RUN_SCOPED_NAMES` (2.11). The adapter registers the `phone-call` VAR writer; `call_answer_seconds` works from this slice (`call_is_callback` is always false until A6).
- `minigame-manager.js`: the start hook after `:183` and the end hook after `:300` (2.9). The `game_loaded` listener.
- `sound-manager.js:205`: `phone_ringtone` in the notifications match.
- Accept: `phone-ring-layer.test.mjs` (layer, z-index, delayed-mapping bypass, start and end hooks, bark hold), `phone-call-vars.test.mjs` (the answer-seconds half and the channel cases), `phone-call-busy.test.mjs` (including the stale record and the auto-challenge), the stale-record cases of `phone-ringer.test.mjs`, the End / story-end / reset cases of `phone-outgoing-call.test.mjs` for incoming calls (including a hit during the two-second close gap, and `#exit_conversation` on both the continue and after-choice paths), the `ring` cases of `phone-call-knots-parity.test.mjs` and the extractor Rails test, with `caller_basic` written with `ring` and no `voiced`; `scripted-conversation-queue.test.mjs` still passing; `test_phone_calls` built with `caller_basic` (after the opening briefing; both answer speeds through the `ring_again` lever, End and story end), `caller_patient` (without the declined run, which is A6), `caller_decline` (decline and timeout only), `caller_debrief` (the ringing variant, the held text, and the knockout variant without its callback; the guard's dropped challenge moved to A2c, see its Accept), `caller_queue`, `caller_replace`, `timed_caller` (without the reload), `legacy_voiced`, `texter`; a live proof of each; the lab SE proof with the `storyState` comparison; the regression set unchanged.

### A2c. Hold, popups, damage and the ending

- `phone-ringer-dom.js`: lift the A2b "any minigame blocks" rule for non-conversation minigames and popups; the hold pill (no Hang up when forced) and the status line over a minigame (2.4), the popup put-aside and restore with the `src` property (row 11), the release checks (rows 13–16), the hold limit (row 18), forced auto-answer and the damage re-ring (rows 22, 26).
- `js/utils/crypto-workstation.js` and `js/utils/lab-workstation.js`: the popup hook (2.9).
- `player-damage-interrupt.js`: record the time of every hit (`lastPlayerHitAt`) and export `playerHitWithin(ms)` for `openBlocked()` and rows 16, 22 and 26.
- Ending hooks for row 28: `js/systems/ending-check.js` where "End the mission now" is confirmed, and the credits start (the music event carrying `credits`, `ending-check.js:14`), both call `window.phoneRinger?.close()`.
- Accept: the Mission Brief opening while a non-opening call rings: the banner stays, the ring is paused (2.2) and resumes with its elapsed time when the brief closes; live proof with `timed_caller` ringing out into `caller_basic` (A2b R3 m4); the guard's dropped challenge (a `player_in_view` person-chat mapping fired during a connected call is dropped, live proof with a patrolling guard; moved here from A2b, R1 m5), and the rest below. The A2c rows of `phone-ringer.test.mjs` pass against the live adapter as well as the fakes; `caller_hold` (all its variants), `caller_forced`, `caller_popup` proofs; screenshots of the banner over a lockpick, a keypad, a terminal, a container, the CyberChef popup and the lab-sheet popup, and of the hold pill over the keypad; the regression set unchanged.

### A3. Ringing inside an open phone

- `phone-chat-ui.js`: `showIncomingCall` / `hideIncomingCall`. The minigame registers with the ringer in `init` when it is the player's phone, and unregisters in `cleanup`. Lift the A2b block for the player's phone.
- Row 10: `_closingForCall`, and `cleanup` (`phone-chat-minigame.js:1630-1636`) skips `_emitConversationClosed` for the thread that was open when it is set; the phone reopens on its saved screen after the call.
- Accept: `caller_thread` proof in all four cases (own thread, another thread, contact list, desk phone object); after the call the phone reopens where it was, and closing it then emits `conversation_closed` for that thread once. In the own-thread case, End pressed while the call's choices show: the reopened thread is on the home knot (screenshot and a dump of `npc.storyState`'s current knot), which proves the in-minigame reset ran before the reopen.

### A4. Thread rows and phone state

- `PHONE_MESSAGE_FIELDS`, `_phoneStateEntry` (`:2275` change), the restore path, server whitelist (4.1).
- `phone-chat-ui.js`: render `type: 'call'` rows; preview; unread. The rows of rows 20, 21 and 25.
- `pendingCall` save and restore, with `untilAnswered` and `answerSeconds`; reload rules (row 27).
- Persist a ring `timedConversation`'s delivered mark with the offer (2.3), so a reload during its ring does not schedule it again.
- Accept: `phone-call-log.test.mjs`, `phone-call-persistence.test.mjs`, the Rails model test; reload proofs in `test_phone_calls` (ringing, held, connected, forced, and `timed_caller` reloaded during its ring); the lab's Dev thread after a pretext call has no rows, and both lab threads survive a reload unchanged.

### A5. Outgoing calls and the post-call thread

- `call` entries (3.2), one or a list. The header call button; `#place_call` and `#place_call:<knot>` (2.5 "When the tag runs": checked once the step's lines have shown, before the exit and story-end checks, in both paths); dialling, connect, no answer; ring-back tone through the sound manager's volumes; "Call ended"; return to the phone; terminal-look endings through the A2b end changes; row 31.
- `callStartKnots` (client) and `call_start_knots` (server) add every `call` entry's knot (4.2; the `ring` targets came with A2b).
- Accept: `phone-outgoing-call.test.mjs`, the `call` cases of `phone-call-knots-parity.test.mjs`, the extractor Rails test for `call` entries; `desk_contact`, `away_contact` proofs, including End mid-choice then reopening the thread, and a `#place_call` choice whose call rings out (nothing typed before dialling; the thread comes back on its hub); the placed-call variant of `caller_debrief`; a `#place_call` call whose knot carries `#ending_check`, answered both ways ("End the mission now" and "Keep going"), ends cleanly; key identity for every baseline; lab SE proof screenshots of the phone contact list and the Friendface DM list unchanged.

### A6. Callback and voicemail

- `onMissed` (2.6). The "Call back" header label and the missed row's "Call back" button; `call_is_callback` (2.11); row 7; the callback halves of rows 18 and 32. Voicemail knot run silently into the thread in the contact's saved story (2.6) with `voice:` bubbles and a "New voicemail" toast; `withheld` texts.
- Server: voicemail lines in the batch (4.2).
- Accept: tests for both `onMissed` values and row 7, the callback half of `phone-call-vars.test.mjs`; `caller_patient`'s declined run (a callback is left); `caller_decline` callback proof (A6 part, both buttons, the VAR line's `/tts` request, and after a reload); the `caller_debrief` knockout variant's callback; `caller_voicemail` and `caller_terminal` proofs, including playing each voicemail (a `/tts` request for its text under the contact's id) and the VAR the voicemail knot set.

### A7. Validator, dialoguelint, docs

- Validator check (4.3) with tests; dialoguelint rule (4.4).
- Docs: README_scenario_design.md "Voiced phone calls" (the new forms, 3.1–3.5, the events, the hold behaviour and its `minigame_failed` caveat, the popup behaviour, the "end with `#exit_conversation` and `-> DONE`" rule, `#place_call`, the "Call me" rule), "NPC Event Mappings" table (`ring`), "NPC Timed Conversations" table (`ring`), "Phone NPCs" (the `call` entries; fix the stale rule "conversationMode other than phone-chat is ignored on phone NPCs", which `video-call` contradicts); README_ink_best_practices.md: how to write a call knot and a voicemail knot, `#place_call` on a hub choice (own line, then `-> DONE`), the "Call me" rule, id prefixes for same-named records (3.5), `call_answer_seconds` and `call_is_callback` with the conditional-line pattern (2.11), the bring-in hand-off, and the call-opening rules of 3.6. The scenario README also documents `ring.untilAnswered` and the busy rule: a scripted beat waits for a ringer call, an auto-challenge (`*_in_view`) that fires during one is dropped and fires again on the next sighting, and text toasts are held until the call ends (2.9). Log for the user that the `tts-audio` skill's extraction notes need a line on `call`, `ring`, `#place_call` and voicemail knots (don't edit `.claude/skills/*`).
- Accept: validator clean on all in-scope scenarios apart from the expected dialoguelint warnings (4.4) and the expected "call me" warnings that Part B clears (7.3); `test_phone_calls` clean; a full regression run.

### A8. The ringtone asset

- Find a CC0 mobile ringtone (Freesound), 2–4 s loopable, trim with ffmpeg, add as `assets/sounds/phone_ringtone.mp3`, credit it in `docs/achitechture/OFFICE_LIFE_SOUND_CREDITS.md`, load it in `sound-manager.js` beside `phone_vibrate`, and swap it into the banner. Can run any time after A2b.
- Accept: proof with the sound logged; licence recorded.

## 7. Part B: mission migration inventory

Sources: `docs/agents/phone_calls/INVENTORY_PHONE_CONTACTS.txt`, `INVENTORY_PERSON_REMOTE_HINTS.txt`, `PHONE_NPC_KNOTS_FULL.txt`, `AUDIT_HAIKU_2026-11-11.md`, and the scenario and ink files cited in each row. Line counts are rough spoken NPC lines (narration and player lines excluded). Each slice reports the exact list from the extractor's key diff before voicing.

### 7.1 The mix, by kind of game

- **m01–m10 (spy thriller).** HaX texts while the agent is inside (silent, stealthy) stay texts. A few beats per mission become calls that ring: an outside voice cutting in (Nightshade, Torres, Gary, the Recruiter, the Architect) or HaX at a moment that carries weight. Some contacts can be rung (Vance, Patricia, the Recruiter's number, HaX when she asks you to call). The bring-in, the one beat every mission shares, is the player's call to HaX wherever a mission has one (m01, m03–m07): "Call me and I'll bring you in" means a real call, and it is short: the debrief that follows is an in-person scene (7.5). Video calls stay for faces that matter (Ghost). In-person HaX scenes sound in person. Callers react to how the call came about (a slow answer, a returned call) with lines that differ from mission to mission (3.6). Every mission in m01–m08 gets at least one ringing or placed call, and a text says "call me" only where the player can (7.3).
- **sis01–03 (serious games).** Education first, no spy framing. Texts and the one recorded message stay.
- **Labs.** `lab_social_engineering` is frozen. The other labs keep what they have.

### 7.2 Inventory and targets

"Sheet" is the walkthrough lab sheet under `HacktivityLabSheets/_labs/`; "none" means nothing on it describes the beat.

| Scenario | Contact / speaker | Today | Target | Files, knots | Ink | Lines | Engine | Sheet |
|---|---|---|---|---|---|---|---|---|
| m01 | `agent_0x99` HaX | texts + hub; home knot `first_call` (silent router, `scenarios/m01_first_contact/ink/m01_phone_agent0x99.ink:93-95`); first contact is a timed text at 3 s (`scenario.json.erb:666-670`) | stays text, plus **one short incoming call** the first time the player enters `main_office_area`: HaX checks the line, says she'll text from here because calls carry inside, and tells the player to message her when stuck. It teaches Answer and Decline where nothing is at stake, and gives the texts a reason. `onMissed: "callback"`; a `phone_call_declined` / `phone_call_missed` mapping sends a one-line text ("Texting from here, then."). The knot declares both call VARs and opens with one of three fixed lines: callback ("You rang back. Good habit."), slow answer ("Took your time. Fine, nothing's on fire yet."), or the plain opening. | new knot `first_ring` in `m01_phone_agent0x99.ink`, ending `#exit_conversation` and `-> DONE` (never `-> support_hub`); a mapping on `agent_0x99` (`scenario.json.erb:620`) | new knot only; no existing line changes | ~6 new; 0 re-key | A2b, A6 | `safetynet/m01_first_contact.md:72-80`: one sentence, "HaX rings you once you're in the office; tap the green button to answer." |
| m01 | `agent_0x99` bring-in | hub choice "[Operation Shatter resolved — I'm ready for debrief]" (`m01_phone_agent0x99.ink:110-111`) → `closing_debrief` (`:942-958`), a text with `#ending_check` whose lines say "Let's review what happened." (`:947-950`); its choice sets `start_debrief_cutscene`, which opens the in-person debrief at HQ (`scenario.json.erb:1116-1124`); eight texts say "call me for debrief" (7.3) | **placed bring-in call**: `call: [{ knot: "closing_debrief", button: false }]`; the hub choice keeps its text and condition and gains `#place_call:closing_debrief` (own line, then `-> DONE`). The call brings the player in; the review happens in person. The eight texts are then true as written: the player calls to be brought in for the debrief. | `closing_debrief` rewritten as a hand-off. Lines to rewrite: both outcome lines at `:947-950` ("… Let's review what happened.") and the knot gains a last line. The new lines are in 7.6: by outcome, the launched or the neutralised opening; after `[On my way]` and its line-level `#ending_check` / `#set_global` tags (kept as they are, so "Keep going" skips the global and the line, 1.9), the m01 last line, then `#exit_conversation` and `-> END`. The debrief mapping waits for the call (2.9). Add `VAR call_answer_seconds` / `call_is_callback` only if a later m01 call needs them (this one is placed, so neither applies). Mark it `// lint: call-knot` | rewrite | ~3 new (two openings and the last line) | A2b, A5 | `safetynet/m01_first_contact.md:436`: "then call Agent HaX and choose to be debriefed" stays true; add "she picks up and brings you in; choose **[On my way]**" |
| m01 | `reception_desk_phone`, `patricia_desk_phone` | phone objects with `voice` | stay | — | no | 0 | — | none |
| m02 | `agent_0x99` HaX; `ghost` device; `press_terminal_system` | texts; Ghost texts + 2 voiced video calls | unchanged | — | no | 0 | — | none |
| m03 | `agent_0x99` `m2_revelation_call` | text "Got the distcc logs. Call me when you're done at the drop-site." that opens the thread at the call knot (`scenarios/m03_ghost_in_the_machine/scenario.json.erb:1012-1018`); hub choice "You wanted to talk about the distcc logs." (`m03_phone_agent0x99.ink:116-117`) | **outgoing call**: the text stays (no `targetKnot`); HaX's `call` list gets `{ knot: "m2_revelation_call", when: "globalVars.flag_distcc_submitted && !globalVars.revelation_heard", unavailable: "hidden" }` first, so the button shows only while she is waiting. The hub choice at `:116-117` stays and gains `#place_call:m2_revelation_call`. If the player hasn't rung within two minutes, she rings: a `ring` mapping on `global_variable_changed:flag_distcc_submitted`, `delayMs: 120000`, condition `value === true && !globalVars.revelation_heard`, `targetKnot: "m2_revelation_call"`, `onMissed: "callback"`. A pending `delayMs` is lost on reload (1.2), so a twin mapping on `game_loaded` with condition `globalVars.flag_distcc_submitted && !globalVars.revelation_heard`, the same `delayMs` and target, re-arms it. The hold rule means it never cuts into the drop-site; if the player rings first, row 31 drops the ring. | `m03_phone_agent0x99.ink:462-517`: the guard `{ revelation_heard: -> hub }` (`-> hub` at `:465`) becomes `#exit_conversation` and `-> DONE`; `m2_revelation_end`'s `-> hub` (`:517`) becomes `#exit_conversation` on its last line and `-> DONE`; no knot of the call diverts to `hub` or `start`; remove `{player_name()}` at `:467` and `:493`; mark the call knots `// lint: call-knot` | light | ~18 new (call and replies) | A2b, A5, A6 | `safetynet/m03_ghost_in_the_machine.md:84-86`: one sentence, "When HaX texts 'Call me', ring her: tap the call button in her thread, or choose the topic." |
| m03 | `agent_0x99` bring-in | hub choice "[I'm done in here. Bring me in.]" (`m03_phone_agent0x99.ink:112-113`) → `extract_offer` (`:595`) and `extract_choices`; five texts say "call me … bring you in" (7.3) | **placed call**: HaX's `call` list gains `{ knot: "extract_call", button: false }`; the hub choice gains `#place_call:extract_call`. `extract_call` is `extract_offer` renamed, with its choices, moved into call knots. | `extract_offer` to the end of the extract flow: every `-> hub` / `-> support_hub` becomes `#exit_conversation` and `-> DONE` ("Not yet" included). Lines to rewrite (new text in 7.6): the opening at `m03_phone_agent0x99.ink:597`, the `[Bring me in.]` reply at `:605`, the "Not yet" reply at `:608`, and the last line "See you at HQ." at `:620`. `[On my way.]` (`:612`) becomes `[On my way. #ending_check]`, so the ending question comes before the last line (1.9). `#complete_task:call_in_after_sweep` moves from `extract_go` (`:617`) onto the `[Bring me in.]` reply line (`:605`), so the optional task is done when the bracket asks and a player with nothing else open is never asked; `#set_global` and `~ victoria_choice_made = true` stay in `extract_go`. The call knot is `extract_call` (the `call` entry, the `#place_call:extract_call` tag and the knot name agree, 4.3), renamed from `extract_offer` | rewrite | ~6 new | A5 | `m03_ghost_in_the_machine.md:456` stays true ("call HaX to be brought in") |
| m03 | `agent_0x99` reaction texts (`on_victoria_computer_accessed`, `on_exploit_catalog_found`, `on_architect_directive_found`) | texts "Call me when you've had a look" and the like that open the thread at the knot (7.3) | stay texts; the texts are reworded ("Message me …") | 4 `message` strings in the ERB | no | 0 | — | none |
| m03 | other HaX knots, `on_victoria_ko_card` | texts / KO card | stay | — | no | 0 | — | none |
| m04 | `robert_vance_phone` Vance | timed text "Call me for the engineering side" + text thread; `start` routes to `vance_phone_support_start` → `support_hub` (`scenarios/m04_critical_failure/ink/m04_phone_robert_vance.ink:59-100`) | **callable contact**: `call: { knot: "support_call", when: "globalVars.vance_is_ally && !globalVars.robert_vance_ko", unavailable: "no_answer" }`, `callLabel: "Albion ops desk"`. `start` becomes a text stub with no NPC line and one exit choice; only `support_call` reaches the hub. `vance_not_yet_ally` and `vance_no_answer` go (the engine rings out). `vance_support_calls += 1` moves into `support_call`. | `scenarios/m04_critical_failure/scenario.json.erb` Vance record; the ink above, `support_hub` to `support_call_end` (`:102-272`) | yes: split the call from the home knot; the dial readings stay speech | ~65 new | A5 | `safetynet/m04_critical_failure.md:82`: "a line to Robert Vance" → "and later Robert Vance, whom you can ring from his thread" |
| m04 | `agent_0x99` `on_anomaly_confirmed` | text "Sixty-one on that dial? Call me when you're clear of it." with `targetKnot` (`scenarios/m04_critical_failure/scenario.json.erb:898`); the knot relays Nightshade's read (`m04_phone_agent0x99.ink:494-525`) | **incoming call**: that mapping drops `sendTimedMessage` and gains `conversationMode: "phone-chat"`, `targetKnot: "on_anomaly_confirmed"`, `ring: { onMissed: "callback" }` (default ring-out), `delayMs: 6000`, keeping its event and condition; a `phone_call_declined` / `phone_call_missed` mapping sends a text, "Nightshade's got your reading. Ring me back." The knot declares both call VARs (2.11) and opens with one of three fixed lines in her clipped m04 voice: callback, "You rang. Good. Nightshade's read it."; slow answer (`call_answer_seconds > 10`, possible from 11 to 19 s before the default ring-out), "There you are. That dial won't wait."; otherwise "Sixty-one. You were right not to trust their screens." She has news, so she rings; the m04 sheet line becomes true. The writer checks every other mapping that opens or texts this knot and the hub for a choice that reaches it; any such choice gains `#place_call:on_anomaly_confirmed` with a `button: false` entry. | `on_anomaly_confirmed_choices` (`:502-525`): each `-> support_hub` after `#exit_conversation` becomes `-> DONE`; the three opening lines above go in front of the knot's first line | light | ~10 new | A2b, A5, A6 | `m04_critical_failure.md:281` ("Take the call from Agent HaX about the reading") becomes true; no edit |
| m04 | `agent_0x99` bring-in | hub choice "[I'm done here. Bring me in.]" (`m04_phone_agent0x99.ink:142-143`) → `extract_offer` (`:405-470`, with `extract_blocked`); the bring-in text (`scenario.json.erb:1080`) | **placed call**: `call: [{ knot: "extract_call", button: false }]` (the knot is renamed from `extract_offer`, and the tag and the knot name agree, 4.3); the hub choice gains `#place_call:extract_call`. "Lose her or put her down, then call" now reads right inside a call. | the extract flow: `[Understood.] -> support_hub` (`:436`), `[Not yet…] -> support_hub` (`:455`) and `extract_go`'s `-> support_hub` (`:467`) become `#exit_conversation` and `-> DONE`. Lines to rewrite (new text in 7.6): the opening at `m04_phone_agent0x99.ink:440` (word for word the same as m06's today), the `[Bring me in.]` reply at `:451`, the "Not yet" reply at `:454`, and the last line "See you at HQ." at `:466`. The five `extract_blocked` lines (`:417-425`) are m04's own and stay. `#complete_task:call_in_after_sweep` moves from `extract_go` (`:463`) onto the `[Bring me in.]` reply line (`:451`), so the optional task is done when the bracket asks; `#set_global` and the `mission_complete` assignment stay in `extract_go`. `[On my way.]` (`:458`) becomes `[On my way. #ending_check]`: the debrief mapping's `endingCheck` (`scenario.json.erb:1562`) would otherwise ask as `mission_complete` is set, while the last line is being shown, and the line would play whatever the answer (1.9). With the bracket form "Keep going" leaves the choice on screen and nothing is set; "End the mission now" is saved, so the mapping does not ask again | rewrite | ~12 new | A5 | `m04_critical_failure.md:452`: add "HaX picks up; choose **[Bring me in.]**"; `:509` stays true |
| m04 | `agent_0x99` | texts, KO card | stay | — | no | 0 | — | none |
| m05 | `recruiter` first contact | text "TalentStack Executive Recruiting…" on `conversation_closed` of three sources (`scenarios/m05_insider_trading/scenario.json.erb:1522-1531`); her `start` knot reads like a call (`m05_phone_recruiter.ink:35-75`) | **incoming call** on the same three events and condition: `ring: { onMissed: "callback" }`, `targetKnot: "first_call"`, `callLabel: "TalentStack Executive Recruiting"`. The mapping keeps `setGlobal: { recruiter_texted: true }` (it guards the three rows). A `phone_call_declined` / `phone_call_missed` mapping sends the old text as her follow-up. | new `first_call` knot with the body of `start`; `start` becomes a silent router to the right resting knot; drop the narrated "Caller ID" line | yes | ~45 new | A2b, A4, A6 | `safetynet/m05_insider_trading.md` Recruiter section, if it says she texts |
| m05 | `recruiter` ring-back | `idle` choices "[Ring the TalentStack number back.]" / "It rings out." (`:412-425`) | **callable**: `call: { knot: "return_contact", when: "!globalVars.recruiter_line_dead", unavailable: "no_answer" }` | `never_talked_terms`, `hangs_up`, `end_contact`, `idle` (`:380-425`), `return_contact` (`:268`) | yes: `idle` loses the ring choices; "She hangs up first." / "The line goes dead." become the call's end | ~15 new | A5 | same |
| m05 | `patricia_phone` Patricia | text "Ring me if anything changes" (`:1552`) + thread with "[(Ring her. It rings out.)]" | text intro stays; **callable**: `call: { knot: "phone_call", when: "globalVars.patricia_phone_available && !globalVars.patricia_ko", unavailable: "no_answer" }`. `start` becomes a text stub; only `phone_call` reaches `hub` and the `phone_*` knots. | `m05_phone_patricia.ink:78-360` | yes: split call from home; fake ring choices go | ~50 new | A5 | `m05_insider_trading.md:80, :213`: "can be rung from your phone" → "tap the call button in her thread" |
| m05 | `agent_0x99_handler` `topic_architect` | text "Root flag in. … Call me. You need to hear this." (`scenarios/m05_insider_trading/scenario.json.erb:1101`); hub choice "[The Architect signed off on the casualty projection.]" (`m05_phone_agent_0x99.ink:214`) → `topic_architect` (`:321-353`) | **incoming call**: the mapping keeps its event, condition and `setGlobal`, drops `sendTimedMessage`, and gains `conversationMode: "phone-chat"`, `targetKnot: "topic_architect"`, `ring: { onMissed: "callback", untilAnswered: true }` (she keeps ringing: this one can't wait), `delayMs: 1500`; on decline a text, "Root flag's in. Ring me back. You need to hear this." The knot declares both call VARs: a `call_answer_seconds > 10` opening ("Finally. Sit down for this.") and a `call_is_callback` one ("Thank you. Listen."). The hub choice gains `#place_call:topic_architect` with a `{ knot: "topic_architect", button: false }` entry; if the player rings first, row 31 drops the ring. | `topic_architect_choices`: each `-> support_hub` becomes `#exit_conversation` and `-> DONE` | light | ~8 new | A2b, A5, A6 | none |
| m05 | `agent_0x99_handler` bring-in | hub choice "[I'm done here. Bring me in.]" (`m05_phone_agent_0x99.ink:181-182`) → `extract_offer` (`:947-966`, with its "Not yet" guard); two texts (`scenario.json.erb:1379, 1386`) | **placed call**: `{ knot: "extract_call", button: false }`; the hub choice gains `#place_call:extract_call`, and `extract_offer` is renamed `extract_call` | the extract flow: the guard's and the choices' `-> support_hub` become `#exit_conversation` and `-> DONE`. The opening at `m05_phone_agent_0x99.ink:953` is m05's own and stays. Lines to rewrite (new text in 7.6): the `[Bring me in.]` reply at `:971`, the plain "Not yet" reply at `:978` (the lethal branch at `:976` is m05's own and stays), and the last line "See you at HQ." at `:991`. `#complete_task:call_in_after_sweep` moves from `extract_go` (`:988`) onto the `[Bring me in.]` reply line (`:971`); `#set_global` and `~ mission_complete = true` stay (see the m04 row). `[On my way.]` (`:983`) becomes `[On my way. #ending_check]` (the debrief mapping's `endingCheck`, `scenario.json.erb:1584`; see the m04 row). The call knot is `extract_call`, renamed from `extract_offer` (the `call` entry, the `#place_call:extract_call` tag and the knot name agree, 4.3) | rewrite | ~10 new | A5 | `m05_insider_trading.md:572`: "Ring Agent HaX and choose **[I'm done here. Bring me in.]**. He names …" → "Open Agent HaX's thread and choose **[I'm done here. Bring me in.]**; the phone rings her. She names …"; `:562`, `:593` stay true |
| m05 | `agent_0x99_handler` other texts | texts at `scenario.json.erb:1064, 1070, 1457, 1484` that say "call me" for a text topic (7.3) | reworded ("Message me …") | 4 `message` strings | no | 0 | — | none |
| m05 | `agent_0x99_handler` | texts, KO relays | stay | — | no | 0 | — | none |
| m06 | `agent_0x99_handler` fund | texts "$12.8M in the wallet … Call me about it." (`scenarios/m06_follow_the_money/scenario.json.erb:1246, 1253`); hub choice "[I've found The Architect's Fund.]" (`m06_phone_agent_0x99.ink:172-174`) → `on_architects_fund_discovered` and `on_fund_choices` (`:431`) | **placed call** (M10): `{ knot: "on_architects_fund_discovered", button: false }`; the hub choice keeps `~ reacted_fund = true` and gains `#place_call:on_architects_fund_discovered`. The two texts are then true as written. | the fund knots: every divert to the hub becomes `#exit_conversation` and `-> DONE` | light | ~8 new | A5 | `safetynet/m06_follow_the_money.md` only if it quotes the choice |
| m06 | `agent_0x99_handler` bring-in | hub choice "[I'm done here. Bring me in.]" (`m06_phone_agent_0x99.ink:161-162`) → `extract_offer` (`:595`) | **placed call**: `{ knot: "extract_call", button: false }`; the hub choice gains `#place_call:extract_call`, and `extract_offer` is renamed `extract_call` | the extract flow, as m04: every divert to `hub` becomes `#exit_conversation` and `-> DONE`. Lines to rewrite (new text in 7.6): the opening at `m06_phone_agent_0x99.ink:597` (word for word the same as m04's today), the `[Bring me in.]` reply at `:605`, the "Not yet" reply at `:608`, and the last line "See you at HQ." at `:620`. `#complete_task:call_in_after_sweep` moves from `extract_go` (`:617`) onto the `[Bring me in.]` reply line (`:605`); `#set_variable` and `~ start_debrief_cutscene = true` stay in `extract_go`. `[On my way.]` (`:612`) becomes `[On my way. #ending_check]` (the debrief mapping's `endingCheck`, `scenario.json.erb:1680`). The call knot is `extract_call`, renamed from `extract_offer` (the `call` entry, the `#place_call:extract_call` tag and the knot name agree, 4.3) | rewrite | ~6 new | A5 | `m06_follow_the_money.md:504`: add "HaX picks up; choose **[Bring me in.]**"; `:517` stays true |
| m07 | `the_architect` taunts (T-30, T-20, three T-10 rows, T-5, T-1, the post-countdown line) | `sendTimedMessage` texts with `targetKnot: "start"` (`scenarios/m07_architects_gambit/scenario.json.erb:1570-1624`, 1641-1646); `start` routes by globals to `taunt_*`; narration "Your handset lights without ringing. The call is already connected" (`m07_architect_comms.ink:97, 141, 215, 289, 351`) | **incoming voiced calls, withheld** (C6): each mapping keeps its event and condition, drops `sendTimedMessage`, and gains `conversationMode: "phone-chat"`, `targetKnot: "taunt_t30"` / `"taunt_t20"` / `"taunt_t10"` / `"taunt_t5"` / `"taunt_t1"` (the post-countdown line gets a new `seattle_call` knot), `ring: { withheld: true, onMissed: "voicemail", voicemailKnot: "<knot>_vm" }`. Each keeps its delay as `delayMs` (`sendTimedMessage.delay`: 5000 for T-30, 500 for the rest, `scenario.json.erb:1572-1624, 1641-1646`). The theme stays `terminal`, so the call opens in his terminal look, voiced, and ends on `#exit_conversation` or the back arrow (2.5). The replace rule (2.3 row 4) stops a stale taunt ringing after a newer one; a taunt that comes due during his own call queues behind it (row 5). Declined: he leaves a message anyway, his signature. | `m07_architect_comms.ink`: (1) the home router `start` (`:45-79`), `parked` (`:475-486`) and `dead_air_choices` (`:456-467`) never enter a `taunt_*` knot or `sign_off`: they keep only the `after_win`, `dormant` and `dead_air` routes, because the ringer delivers every taunt and the sign-off; (2) each `tX_close` and `signoff_close` ends `#exit_conversation` and `-> DONE` in place of `-> parked`; (3) each `*_vm` knot sets the same `heard_*` VARs its taunt sets, folds included (`taunt_t30` `:96`; `taunt_t20` `:134-140`; `taunt_t10` `:204-214`; `taunt_t5` `:282-288`; `taunt_t1` `:342-350`), so a voicemail counts as heard and a later taunt never opens as first contact after his message; one or two `voice:` lines carrying the taunt's point; (4) rewrite the five "without ringing" narration lines so the call rings and connects ("No caller ID. The line opens before you speak."); rewrite `:124`, `:191`, `:442` ("no call in the log") to fit a log that does show a withheld call; (5) mark call knots `// lint: call-knot` | yes | ~60 new + ~12 voicemail | A2b, A2c, A5, A6 | none (`safetynet/m07_architects_gambit.md` does not describe his messages) |
| m07 | `the_architect` `sign_off` | `phone-chat` mapping on `minigame_completed`/`minigame_failed`, not voiced (`:1625-1638`) | **forced voiced call**: add `ring: { withheld: true }` and `disableClose: true`; it rings after the console closes and auto-answers. A forced call can't be declined or missed, so it has no voicemail knot (3.1). `architect_signoff_started` is still set at ring time; the debrief still waits for `architect_signoff_done` (set in the ink). | `sign_off`, `signoff_close` (`:393-444`) | light | ~9 new | A2b, A2c | none |
| m07 | `agent_0x99` bring-in | hub choice "[Bring me in.]" (`m07_phone_agent_0x99.ink:228-229`) → `bring_me_in` (`:514-522`, which ends `#exit_conversation` then `-> hub`); three texts say "call me … put you through" (`scenario.json.erb:1314, 1322, 1329`) | **placed call**: `{ knot: "bring_me_in", button: false }`; the hub choice gains `#place_call:bring_me_in`. `bring_me_in`'s `-> hub` (`:522`) becomes `-> DONE`. | that knot | light | ~2 new | A5 | `m07_architects_gambit.md:525`: "open your phone and choose **[Bring me in.]**" → add "HaX picks up and puts you through" |
| m07 | `agent_0x99` deduction and redirect texts | "call me and say which" (`scenario.json.erb:896`), "call me before you log in on their host" (`:904`), both pointing at text topics (7.3) | reworded ("message me …", "tell me …") | 2 `message` strings | no | 0 | — | none (`m07_architects_gambit.md:225` describes the redirect as a text topic, which stays true) |
| m07 | `agent_0x99` | texts | stay | — | no | 0 | — | none |
| m08 | `agent_0x99` door audit read | text "… you read it to me … Call me when you've got both." (`scenarios/m08_the_mole/scenario.json.erb:867`); hub choice "[I can name the leak.]" (`m08_phone_agent_0x99.ink:92`) → `hax_read_1` … `hax_read_right` (`:224-260`), whose condition has two ORs | **placed call** (M10): `{ knot: "hax_read_1", button: false }`; the hub choice gains `#place_call:hax_read_1` (the ink condition is the gate, which the `&&`-only `when` couldn't express). The player reads the minute and names the leak aloud, as the text asks. | `hax_read_*`: "[Let me read it again.] -> hub" (`:231`, `:244`) and the wrong-answer returns become `#exit_conversation` and `-> DONE` (the choice is on the hub again); the right answer ends `#exit_conversation` and `-> DONE` | light | ~10 new | A5 | `safetynet/m08_the_mole.md:410`: "HaX will hear the same reading from you instead" → "ring HaX by choosing **[I can name the leak.]** in her thread and read it to her instead" |
| m09 | `nightshade_phone` `call` | `call_map`, not voiced, `delayMs` 7000 on `flag1_submitted` (`scenarios/m09_digital_archaeology/scenario.json.erb:933`) | **incoming call**: `call_map` gains a `ring:` keyword (emits `h["ring"] = ring` when given); this mapping passes `ring: true` and `voiced: true` | `m09_phone_nightshade.ink:19-31`; `start` stub drops "[Ring back.]" | stub only | ~7 new | A2b, A2c | none |
| m09 | `torres_phone` `call` | three `call_map`s, `delayMs` 1500, one on opening the Harwick & Lowe box (`:961-965`) | **incoming call**, `ring: true`; it rings over the box's container and holds if answered there | `m09_phone_torres.ink:25-49`; `start` stub | stub only | ~8 new | A2b, A2c | none |
| m09 | `gary_phone` `call` | `call_map` on `door_unlock_attempt` at the salvage keypad, `delayMs` 1500 (`:985`) | **incoming call**, `ring: true`; rings over the keypad, holds if answered there (his hint sends the player to the chart anyway). Voice: keep Charon with the m10 `gary` style (`scenarios/m10_full_disclosure/scenario.json.erb:498`), the same as m02 and m10; m10 already pairs it with a Charon Netherton. Update the `_comment` at m09 `:970` (no longer "his call is a text thread"); the audio step listens for a clash with Netherton and logs it for the user if there is one. | `m09_phone_gary.ink:15-41`; `start` stub | stub only | ~7 new | A2b, A2c | none |
| m09 | `recruiter` `call`, `resume_name`; HaX voiced knots (`identity_scene`, `identity_resume`, `deck_resume`, `tesseract_call`) | voiced, forced, re-ring | unchanged | — | no | 0 (3 HaX + 1 Recruiter re-key in A1) | A1 | none (`m09_digital_archaeology.md:360-384` already says the Recruiter rings) |
| m09 | `agent_0x99` `start` ("Pick up. I'm ringing you." `m09_phone_agent0x99.ink:126`, "Take it when it rings." `:130`), `flag1_read`, `ledger_read`, `afterwards`, `hour_read` | forced-open silent threads (`hax_maps` ERB) | `start` rewritten as plain texts that don't promise a ring (the forced voiced call later opens at once); the forced-open `*_read` threads become texts with toasts (`sendTimedMessage` with `targetKnot`) so they stop interrupting | `m09_phone_agent0x99.ink:118-330`, `:588` | `start` only | 0 (texts) | today | none |
| m09 | `hax_voice` (in person in `m09_briefing.ink`, Task Force Null's room at the Citadel, `:6`) | phone-line style; its lines resolve to `agent_0x99` today because `agent_0x99` is earlier in the scenario (`:838` vs `:1011`) | **m01 briefing style** (C2): copy the style of m01 `briefing_cutscene` (`scenarios/m01_first_contact/scenario.json.erb:557-561`) into `hax_voice`'s voice block; in `m09_briefing.ink` change every `Agent HaX:` prefix to `hax_voice:`. Other m09 files where she is on the line (Sorensen door and hatch, Noor, the Alpha recording, the debrief: "HaX is on the line", `m09_closing_debrief.ink:312`) keep `Agent HaX:` and the phone style. Update `hax_voice`'s `_comment`. | `scenario.json.erb:1009-1028`; `m09_briefing.ink` (59 prefixes) | prefixes only | ~59 re-key | A1 (ids) | none |
| m09 | `agent_0x99` portrait in on-the-line scenes (Sorensen door and hatch, Noor, the Alpha recording, the debrief) | `Agent HaX:` there resolves to the phone record `agent_0x99`, which has only `avatar` (`scenario.json.erb:838-848`), so person-chat draws the default `hacker` sprite with no lip sync (1.6). This is how m09 plays today. | copy `hax_voice`'s `spriteSheet`, `spriteTalk`, `spriteVisemes` and `spriteConfig` (`:1016-1020`) onto `agent_0x99`. Phone records never get a world sprite (1.6), and the voice block is unchanged, so no key moves. Logged for the user in M2, since it changes how m09 looks. | the ERB record | no | 0 | — | none |
| m10 | `agent_0x99` calls; `victoria_line`, `vance_phone`, `elena_phone`, `ghost_phone` | voiced | unchanged | — | no | 0 (1 Ghost re-key in A1, `m10_ghost_phone.ink:146`) | A1 | none |
| m10 | `agent_0x99` `line_dead`, `jammed` | dead-line states in the thread | stay | — | no | 0 | — | none |
| m10 | `hax_post` (in person at the van end) | phone-line style (`voice.(:hax_phone)`, `scenario.json.erb:1611`) | **m01 briefing style** (C2), as `voices[:hax_briefing]` | M2 below | no | own lines re-key | A1 (ids) | none |
| m10 | `agent_0x99` art | phone record with only `avatar` (`scenario.json.erb:1618-1624`) | gains `hax_post`'s `spriteSheet`, `spriteTalk`, `spriteVisemes` and `spriteConfig` (`:1603-1607`), so the co-speaker lines below keep her portrait and lip sync when they resolve to `agent_0x99` (M2) | the ERB record | no | 0 | — | none |
| m10 | `hearing` (HaX beside the player) | phone-line style (`:2486`) | **m01 debrief style** (C2): m01 `closing_debrief_person` (`scenarios/m01_first_contact/scenario.json.erb:1134-1138`), as `voices[:hax_debrief]` | M2 below | no | own lines re-key | A1 (ids) | none |
| m10 | `Agent HaX:` co-speaker lines in other hosts (111 lines: `m10_tesseract.ink` 56, `m10_six_oclock.ink` 21, `m10_director_netherton.ink` 15, `m10_nightshade.ink` 6, `m10_gary.ink` 2, `m10_imran.ink` 2, `m10_kowalczyk.ink` 2, one each in `m10_arakawa`, `m10_ghost_phone`, `m10_malhotra`, `m10_phantom`, `m10_quintero`, `m10_voltage`, `m10_vector`) | resolve to `hax_post`, the first "Agent HaX" in the scenario (`:1599` before `agent_0x99` at `:1618`) | **unchanged sound and picture**: prefix each `agent_0x99:`. `agent_0x99` keeps `voice.(:hax_phone)`, the block `hax_post` has today, so every one of these keys stays the same, including the Ghost call line (`m10_ghost_phone.ink:109`). With the art fields above, the portrait is the one `hax_post` shows today. | the 14 files | prefixes only | 0 | A1 (ids) | none |
| lab_social_engineering | `dev_service_desk`, `ruth_phone`, desk phone | contact-level voiced pretext call; Ruth texts | **unchanged** | — | no | 0 | — | none |
| lab_physical_pentest | person `ruth` says "Call me on the phone if you get stuck." (`scenarios/lab_physical_pentest/ink/ruth.ink:72`) | her phone contact is a text hint thread | "Message me on the phone if you get stuck." | that line | one line | 1 re-key | today | none (no `lab_sheet_url`) |
| lab_tesseract_trials | `agent_0x99`, `ghost` | texts; Ghost video call | unchanged | — | no | 0 | — | none |
| sis01 | `ward_desk_phone` | phone object with `voice` | stays | — | no | 0 | — | none |
| sis02 | `marcus_webb`, `tom_hadley` | silent texts with "ring" wording (`scenarios/sis02_energy/ink/npc_marcus_webb.ink:139, 263, 279, 292`; `npc_tom_hadley.ink:143, 149`) | stay text; the writer checks the ring wording reads as texts about calls | those lines | maybe | 0 | — | `security_informed_safety/sis02_energy.md` only if a quoted line changes |
| sis03 | `james_whitworth`, `simon_hartley`, `robert_ngata` | silent texts, no `voice`; knots named `call_initial` | stay text; trim "call" framing only where prose reads as a meeting | `scenarios/sis03_cyber_insurance/ink/npc_*.ink` | maybe | 0 | — | none (no `lab_sheet_url`) |

Person NPCs with remote-sounding ink that are right as they are: m04 debrief "Vance is on the line" (`m04_closing_debrief.ink:453`), m06 minder dialling, m03 Victoria "on the phone by the window", m09 Old Coyote "I'll call you back", m10 Tesseract "Netherton's still on the line", m02 receptionist and guard radios, sis02 Priya.

### 7.3 "Call me" texts, one by one

Every `sendTimedMessage.message` in m01–m08 that tells the player to call HaX or another contact (grep `"message": "[^"]*[Cc]all me` over the ERBs), with what happens to it. The rule is 3.5: "call me" stays only where the beat is now a call. Three outcomes:

- **stays**: the beat becomes a call (7.2), so the text reads right as written;
- **reword**: the beat stays a text topic, so the text says "message me" or "tell me" (text only, no audio);
- **becomes a ring**: HaX has news, so she rings instead, and the text goes (a follow-up text on decline or miss says "Ring me back").

How the choices were made: the bring-in is a call in every mission, because it is the one beat they all share and the most natural call in the genre. A beat where HaX has news that carries weight (m04's dial, m05's root flag) becomes her ring. A beat where the player reports back aloud (m06's fund, m08's door audit) becomes the player's call. Short reactions to a find stay texts, because HaX texts while the agent is inside, and every mission already has its calls.

| Mission | ERB line | Text (start) | Outcome | Beat in 7.2 |
|---|---|---|---|---|
| m01 | `:925` | "That's the full picture … then call me for debrief." | stays | bring-in call |
| m01 | `:1019` | "Abort confirmed. … Call me when you're ready to debrief." | stays | bring-in call |
| m01 | `:1028` | "…I'm seeing reports. … The attack went through. Call me." | stays | bring-in call |
| m01 | `:1064`, `:1073`, `:1082` | "All technical evidence secured. … Call me when you're ready for debrief." | stays (×3) | bring-in call |
| m01 | `:1091` | "Derek is contained … then call me for debrief." | stays | bring-in call |
| m01 | `:1100` | "Derek is contained. You still need to access the ENTROPY encrypted archive … then call me." | stays | bring-in call |
| m03 | `:947`, `:955` | "You're on her machine. Call me when you've had a look." | reword: "You're on her machine. Message me when you've had a look." (×2) | text topic |
| m03 | `:972` | "That's more than a price list. Call me when you've read it." | reword: "… Message me when you've read it." | text topic |
| m03 | `:978` | "A drive in her desk? Call me." | reword: "A drive in her desk? Tell me what's on it." | text topic |
| m03 | `:1016` | "Got the distcc logs. Call me when you're done at the drop-site." | stays | revelation call |
| m03 | `:1100` | "She's down. Finish the sweep and get out. Call me when you want bringing in." | stays | bring-in call |
| m03 | `:1107`, `:1132` | "… His office first. Then call me to come in." | stays (×2) | bring-in call |
| m03 | `:1113`, `:1138` | "… Finish your sweep, then call me and I'll bring you in." | stays (×2) | bring-in call |
| m04 | `:898` | "Sixty-one on that dial? Call me when you're clear of it." | becomes a ring | `on_anomaly_confirmed` |
| m04 | `:1080` | "Grid control confirms it. … then call me and I'll bring you in." | stays | bring-in call |
| m04 | `:1520` | "It's Vance. … Call me for the engineering side …" | stays | Vance callable |
| m05 | `:1064` | "Three hundred and eighty thousand dollars … Call me if you want to talk it through." | reword: "… Message me if you want to talk it through." | text topic |
| m05 | `:1070` | "A personal journal. Call me once you've read it." | reword: "A personal journal. Message me once you've read it." | text topic |
| m05 | `:1101` | "Root flag in. … Call me. You need to hear this." | becomes a ring | `topic_architect` |
| m05 | `:1379` | "Upload's dead. Sweep the vault … Then call me and I'll bring you in." | stays | bring-in call |
| m05 | `:1386` | "Upload's dead. If you're leaving him there … Call me." | stays | bring-in call |
| m05 | `:1457` | "… Leave the data centre, then call me for Security: he swings while you're on the phone." | reword: "… then message me for Security: he swings while you're on your phone." | text topic (Security relay) |
| m05 | `:1484` | "… Or get clear and call me for Security." | reword: "… Or get clear and message me for Security." | text topic |
| m06 | `:1246`, `:1253` | "$12.8M in the wallet, six cells, seventy-two hours. Call me about it. …" | stays (×2) | fund call |
| m07 | `:896` | "If a row in there doesn't match what we were told, call me and say which." | reword: "… message me and say which." | text topic (deduction) |
| m07 | `:904` | "… If the team's in the wrong place, call me before you log in on their host." | reword: "… tell me before you log in on their host." | text topic (redirect) |
| m07 | `:1314` | "Grid's held. … Submit the rest, then call me and I'll put you through." | stays | bring-in call |
| m07 | `:1322`, `:1329` | "Grid's held. Netherton wants you … Call me when ready / when you're ready. …" | stays (×2) | bring-in call |
| m08 | `:867` | "That's the door audit. … Call me when you've got both." | stays | door audit call |

Totals: 36 texts. 24 stay (the beat is now a call), 10 are reworded at no audio cost, 2 become HaX's ring. m02 has none.

**"Call me" and "ring me" inside the phone inks.** A grep of `call me|ring me` (case-insensitive) over the m01–m08 phone inks finds 24 lines spoken to the player (choice text, comments and "Bring me in" left out). Same rule, same three outcomes. A reworded line is a text-thread line, so it costs no audio; a line that stays and sits in a knot that becomes a call is counted in that beat's lines in 7.2.

| Ink file | Line | Text (start) | Outcome | Why |
|---|---|---|---|---|
| `m01_first_contact/ink/m01_phone_agent0x99.ink` | `:417` | "Call me if you need support." | reword: "Message me if you need support." | support is a text topic |
| `m03_ghost_in_the_machine/ink/m03_phone_agent0x99.ink` | `:391` | "Finish your sweep, then call me and I'll bring you in." | stays | bring-in call |
| same | `:564` | "Base64 first … Call me when it reads." | reword: "… Message me when it reads." | `directive_later` is a text topic |
| `m04_critical_failure/ink/m04_phone_agent0x99.ink` | `:652` | "Call me when you've got a real reading." | reword: "I'll ring once you've got a real reading." | `first_call_end`; the confirmed reading is HaX's ring (7.2) |
| `m04_critical_failure/ink/m04_phone_robert_vance.ink` | `:273` | "Call me if you need it." | stays | `support_call_end`, inside Vance's call |
| `m05_insider_trading/ink/m05_phone_patricia.ink` | `:120`, `:152`, `:338`, `:355` | "Ring me when you've got something." and the like | stays (×4) | Patricia is callable; the lines sit in her `phone_*` call knots |
| `m05_insider_trading/ink/m05_phone_agent_0x99.ink` | `:782`, `:784`, `:786`, `:788` | `post_ko_safety_net_sweep`: "… then call me." / "… call me and I'll bring you in." | stays (×4) | bring-in call |
| same | `:901` | "Can't take him? Get out of his reach, then call me." | reword: "… then message me." | Security relay is a text topic (7.3 `:1457`) |
| same | `:936` | "Call me again if it helps." | reword: "Message me again if it helps." | `moral_sounding_board` is a text topic |
| same | `:1009`, `:1011`, `:1013` | `report_progress`: "… then call me (and I'll bring you in)." | stays (×3) | bring-in call |
| `m06_follow_the_money/ink/m06_phone_agent_0x99.ink` | `:579`, `:584` | "Call me when you've opened it." / "Call me when you have them." | stays (×2) | `on_fund_choices`, inside the fund call; the hub choice dials it again |
| `m07_architects_gambit/ink/m07_phone_agent_0x99.ink` | `:167` | "Call me the second you hit something you can't open." | reword: "Message me the second …" | hints are text topics |
| same | `:343` | "Submit the rest, then call me." | stays | bring-in call |
| `m08_the_mole/ink/m08_phone_agent_0x99.ink` | `:234`, `:247` | "Read it again and call me back." | stays (×2) | `hax_read_*`, inside the door audit call; the hub choice dials it again |

Totals: 24 lines, 18 stay, 6 reworded. The validator warning (4.3) and dialoguelint (4.4) catch any line added later.

### 7.4 Audio, rough

| Change | New | Re-key |
|---|---|---|
| A1 delivery notes (m09 ×4, m10 ×1) | 0 | 5 |
| m01 first ring (with its callback and slow-answer openings) | ~6 | 0 |
| m03 revelation call | ~18 | 0 |
| m04 Vance | ~65 | 0 |
| m05 Recruiter (first call + ring-back) | ~60 | 0 |
| m05 Patricia | ~50 | 0 |
| m06 fund call, m08 door audit call | ~18 | 0 |
| m07 taunts and voicemails, sign-off | ~80 | 0 |
| m09 Nightshade, Torres, Gary | ~22 | 0 |
| Bring-in calls (m01 ~3, m03 ~6, m04 ~12, m05 ~10, m06 ~6, m07 ~2), every line of each counted, the rewritten ones of 7.6 included | ~39 | 0 |
| HaX rings: m04 dial (~10, with its three openings), m05 root flag (~8) | ~18 | 0 |
| Other call-VAR openings (3.6): one or two per ringing call that can be rung back or left ringing, outside the rows above | ~20 | 0 |
| m09 `hax_voice` briefing style | 0 | ~59 |
| m10 `hax_post` and `hearing` own lines | 0 | from the key diff (their own files only) |
| lab_physical_pentest one line | 0 | 1 |
| "Call me" rewords (7.3) | 0 (texts) | 0 |
| **Total** | **~395** | **~65 plus m10's own-line count** |

Most of the new bring-in, ring and placed-call lines exist today as silent text; the count is of lines that gain a voice. Rewriting a bring-in line (7.6) replaces a line that would have been voiced anyway, so it does not add to the count; the m04 dial's two extra openings do.

### 7.5 Debriefs

**Rule.** The end-of-mission debrief is a scene, in person by default, because that is where it lands hardest. A call before it is a short bring-in that gets the player out and hands over (3.6); it never reviews the mission. The mode varies where the story calls for it: a secure link when the director is elsewhere, a colleague on the line when the story has put them somewhere else. This plan changes no debrief scene's mode; it makes the bring-ins real calls and makes sure they hand over cleanly (2.9).

Every debrief host today is a `person` record opened as a `person-chat` with `disableClose`.

| Mission | Host (record) | Mode | Setting | Beat before it | Why this mode |
|---|---|---|---|---|---|
| m01 | HaX (`closing_debrief_person`, `scenarios/m01_first_contact/scenario.json.erb:1106-1124`) | in person | HQ (`hq1.png`) | **placed bring-in call** (7.2), its choice sets `start_debrief_cutscene` | the first mission's first sit-down with the handler |
| m02 | HaX (`closing_debrief_trigger`, `scenarios/m02_ransomed_trust/scenario.json.erb:1422-1454`) | in person | HQ, "Forty-eight hours after St. Catherine's" (`m02_closing_debrief.ink:88`) | the ambush scene sets `mission_complete` (no call) | the hospital story ends with time passed; no bring-in needed |
| m03 | HaX (`closing_debrief`, `scenarios/m03_ghost_in_the_machine/scenario.json.erb:1178-1187`) | in person | HQ, "The morning after WhiteHat Security" (`m03_closing_debrief.ink:60`) | **placed bring-in call** (7.2) | the turned asset is discussed face to face |
| m04 | HaX (`agent_0x99_debrief`, `scenarios/m04_critical_failure/scenario.json.erb:1532-1564`), with Vance on the line from the Albion ops desk (`m04_closing_debrief.ink:451-454`) | in person, one voice on the line | HQ (`hq1.png`) | **placed bring-in call**, `extract_go` sets `mission_complete` (7.2) | Vance is still at the plant; HaX is with the player. The ink's header comments "Location: Control Room (phone/video call)" and "Agent HaX on screen" (`:77`, `:92`) are stale; M4 corrects them to match the HQ scene |
| m05 | HaX (`closing_debrief_trigger`, `scenarios/m05_insider_trading/scenario.json.erb:1558-1585`) | in person | HQ, "Thursday, nine o'clock" (`m05_closing_debrief.ink:181`) | **placed bring-in call** (7.2) | the moral choice about Torres is weighed across a desk |
| m06 | HaX (`closing_debrief_person`, `scenarios/m06_follow_the_money/scenario.json.erb:1643-1682`) | in person | HQ at night (`m06_hq_night.png`); "the call-in on the phone already brought the player in" (`m06_closing_debrief.ink:68-69`) | **placed bring-in call** (7.2) | the fund decision is reviewed in person |
| m07 | Netherton (`closing_debrief`, `scenarios/m07_architects_gambit/scenario.json.erb:1650-1685`), HaX co-speaker | **secure link** | a borrowed office at the grid site; Netherton on the link from HQ (`m07_closing_debrief.ink:3`, `:90`) | **placed bring-in call**: HaX "puts you through" (7.2) | the director is at HQ and the player is still in Austin the same night; kept by the user (log, 2026-11-11) |
| m08 | Netherton (`closing_debrief`, `scenarios/m08_the_mole/scenario.json.erb:1232-1260`) | in person | a corridor; "Netherton finds you" (`m08_closing_debrief.ink:64`) | picking up Netherton's keycard (`item_picked_up:keycard`) | the mole is inside SAFETYNET; the director comes to the player, unannounced |
| m09 | Netherton (`closing_debrief`, `scenarios/m09_digital_archaeology/scenario.json.erb:1086-1125`), HaX on the line | in person, one voice on the line | the hangar at Helena's airfield (`m09_closing_debrief.ink:57-59`); "HaX is on the line from the Citadel, already packing" (`:312`) | `start_debrief` (no call) | the team is on the apron with the player; HaX has gone ahead to the Citadel, which sets up m10 |
| m10 | Netherton (`six_oclock`, `scenarios/m10_full_disclosure/scenario.json.erb:2453-2470`) or, on the `scorched` ending, the hearing with HaX beside the player (`hearing`, `:2475-2492`) | in person | the forward post before six (`m10_six_oclock.ink:38`); a hearing room at the Citadel (`m10_hearing.ink:22`) | the Tesseract scene closing (no call) | the finale ends with people in the room |

Shapes, for variety: six HaX sit-downs at HQ (m01–m06), each set by its own story time; one secure link (m07); three Netherton scenes in the field or a corridor (m08, m09, m10's six o'clock); one hearing (m10). Two of them carry a voice on the line (m04 Vance, m09 HaX). Six begin with a placed bring-in call (m01, m03–m07). The writers of M4, M5, M6, M7, M8 and M10 keep each bring-in to the 3.6 limits and use the lines of 7.6, so each one sounds different: m01 walks out of the cover job, m03 a quiet extraction after the turn, m04 "lose her or put her down, then call" played out live and a plant left to others, m05 a car at the front after a hard choice and a time for the debrief, m06 a night pick-up with the fund decision still open, m07 "Putting you through. He's waiting."

### 7.6 Bring-in lines, mission by mission

Every HaX phone record has the same voice block (3.6), so a line used in two missions would be one clip. These are the planned HaX lines of each bring-in call. The writer may polish them, but every line must stay different from every line in the other rows, and from every other call knot's lines in m01 to m10 (section 8 steps 2 and 3). Lines marked "today" are already unique and stay as written.

| Mission | Opening (`extract_call`, renamed from `extract_offer`, or `closing_debrief`) | Reply to "[Bring me in.]" | "Not yet" reply | Last line, after "[On my way]" |
|---|---|---|---|---|
| m01 | launched: "It went through. Not on an open line. Come back to HQ."; else: "Shatter's dead in the water. Pack up and come in. We'll do it properly at HQ." | none (one choice) | none | "Walk out the way you came in. As far as Viral Dynamics knows, you were never here." |
| m03 | "Last look. Once you're out, the search team has that building." (the safe line after it, `:599`, today) | "Side door, two minutes. Don't use the lobby." | "Go on, then. She's not leaving her desk tonight." | "Leave her to us." |
| m04 | "Past the gate it's forensics' site, not ours. Anything you want, take it now." (the two lines after it, `:442`, `:445`, today) | "Loading dock. The van with no livery." | "Fine. The banks will keep." | "Albion's grid is someone else's problem now." |
| m05 | today: "Once you're out, QDC's own people go through that vault before ours do. Whatever you haven't read could walk." (`:953`) | "Front entrance. Walk like you work there." | lethal branch today (`:976`); else "Then look. The vault's yours till someone notices." | "Thursday, nine o'clock. My office." |
| m06 | "Police are twenty minutes out. Whatever you leave in there is their evidence." (the safe line after it, `:599`, today) | "Round the back. They'll flash the headlights twice." | "Then be quick. They won't wait for you." (no stated time, so it can't contradict the twenty minutes; writer review R2 m4) | "We'll talk about the money at HQ, not on a phone." (the bring-in needs `assets_decided`, so the money is already decided; writer review R1 M1) |
| m07 | today: "Putting you through. He's waiting." (`m07_phone_agent_0x99.ink:517`) | none | today: "Not yet. Put the rest of the flags through the relay and he's on straight after." (`:519`) | the opening is the last line |

The last lines differ in every mission and none of them is "See you at HQ." The m05 last line points at the debrief's own setting, "Thursday, nine o'clock" (`scenarios/m05_insider_trading/ink/m05_closing_debrief.ink:181`). The m06 line leaves the fund decision for the in-person debrief (7.5).

## 8. Part B: migration slices

The ink for M1 and M4–M8, M10 is drafted ahead on `build/phone-calls-writing`. That branch merges into `build/phone-calls` mission by mission, each together with its config and only once A5 is in: a `#place_call` choice plays nothing without A5 and the mission's `call` entry, and the bring-ins are the only way out of m01 and m03–m06.

Every migration slice has the same steps:

1. **Config** (implementer): the scenario keys in 7.2.
2. **Ink** (writer, a separate agent): rewrite only the knots named; follow 3.5, 3.6 and README_ink_best_practices.md; apply the mission's rows of the two 7.3 tables; compile; run dialoguelint and the validator. Before finishing, list the opening line and the last NPC line of every call in the mission, and of the same handler's calls in the missions already migrated, and change any that repeat a shape or a sentence (3.6). For a bring-in, use the mission's row of 7.6 and list all four of its lines.
3. **Checks**: validator 0 errors and no new call-set warnings; `tts_mission_lines_test.rb` passes; the mission's existing node tests pass; the key diff for the mission lists only the lines the slice meant to add or re-key (write the list to the log); and no new key of the mission equals a key from another mission's extractor output (compare against the A0 baselines in `docs/agents/phone_calls/keys_baseline/` and the keys of slices already merged). A match means the same text in the same voice block, one clip in two missions; the writer changes the line.
4. **Live proof** on port 3023: drive the beat on the real path, including a decline or no-answer where the beat has one, and a reload during the beat. For a call that can be rung back, call back and check the `call_is_callback` line's `/tts` request; for an `untilAnswered` call, answer after 12 s and check the `call_answer_seconds` line. For a bring-in, the hand-off check: the call's last line is typed and voiced, the debrief opens straight after, and the phone does not reopen. Where the mission has open optional objectives, answer the ending question both ways: "End the mission now" plays the last line and hands over; "Keep going" leaves the call on its choice with no last line, and the player hangs up. For m03 to m06 also run: nothing optional open (the bring-in's own task is already complete), where `[On my way.]` asks no question and plays the last line; and "Keep going", hang up, ring HaX again from the hub choice, choose `[On my way.]`, with the question shown again and the hand-off following "End the mission now".
5. **Lab sheet** in the same slice, only where 7.2 names a change: edit the sentence that describes what the player does or sees. Commit in the HacktivityLabSheets repo with an explicit path. Never open `*-vm-technical-steps.md`; if a VM step is affected, log it for opus48. M5 logs one check for opus48: whether m05's VM companion describes how the call to HaX opens, and if so whether it still holds once the bring-in is a placed call.
6. **Audio** (after the orchestrator has passed the line count to the user): `tts-audio` skill, top up the mission.
7. Commit (explicit paths), log the slice.

| Slice | Scope | Needs | Notes |
|---|---|---|---|
| M1 | m09 Nightshade, Torres, Gary ring; `call_map` `ring:` keyword; `start` stubs; Gary's `_comment` | A2b, A2c | proofs: Gary rings over the keypad and holds; Gary rings while the CyberChef popup is open, Answer puts the popup aside and brings it back; Torres rings over the box container |
| M2 | HaX in-person styles (C2) and HaX's art on her phone records (m09, m10) | A1 | see below |
| M3 | m09 HaX forced-open silent threads → texts; `start` rewrite | today | check the mission's walkthrough steps still hold |
| M4 | m04 Vance callable; HaX's dial ring; HaX's bring-in call with the m04 row of 7.6 and the bracket `#ending_check`; the ink reword at `:652`; the stale debrief header comments (7.5); m04 sheet | A2b, A2c, A5, A6 | proofs: ring Vance before allying (no answer), after allying (connects), after his KO (no answer); the dial reading rings HaX, declined then called back with its "Call back" button and callback line; the dial ring answered after 12 s (slow-answer line); the bring-in from the hub choice, with a hostile standing (blocked) and without; the bring-in hand-off: "Albion's grid is someone else's problem now." is voiced and the debrief opens after it; with an optional objective open, "Keep going" at `[On my way.]` voices nothing and sets no `mission_complete`, and with nothing optional open `[On my way.]` asks nothing |
| M5 | m05 Recruiter first call, ring-back; Patricia callable; HaX's root-flag ring (`untilAnswered`); HaX's bring-in call with the m05 row of 7.6 and the bracket `#ending_check`; the four ERB rewords and the two ink rewords; m05 sheet | A2b, A2c, A4, A5, A6 | the biggest ink rewrite; the Recruiter's `start` comments record playtest history: read them first. Proof includes a first call that the player declines, then the follow-up text and calling her back; the root-flag ring left for 40 s and then answered (slow-answer line), and a run where the player picks the hub choice first (row 31); the bring-in hand-off, and a bring-in run with nothing optional open where `[On my way.]` asks nothing |
| M6 | m07 Architect taunts and sign-off as withheld voiced calls; voicemails; router, `parked` and `dead_air_choices` changes; narration rewrites; HaX's bring-in call; the two ERB rewords and the ink reword at `:167` | A2b, A2c, A5, A6 | the bring-in hand-off to Netherton's secure link; replay the T-30…T-1 timing; prove the replace rule with a taunt queued behind a person-chat; decline T-20 and then open his thread by hand: it shows the voicemail and dead air, never `taunt_t20` as text; a later taunt doesn't open as first contact; a voicemail bubble in the terminal look plays; a taunt call ended with the back arrow leaves its row; the debrief still waits for `architect_signoff_done` |
| M7 | m03 revelation as an outgoing call with a two-minute fallback ring; HaX's bring-in call with the m03 row of 7.6 and the bracket `#ending_check`; the four ERB rewords and the ink reword at `:564` | A2b, A5, A6 | proofs: ring HaX from her thread; choose the hub topic instead; a run where the player doesn't, so she rings; a reload inside the two minutes, after which she still rings (the `game_loaded` twin); the bring-in hand-off, and a bring-in run with nothing optional open where `[On my way.]` asks nothing |
| M8 | m01 first ring; the bring-in call (`closing_debrief` rewritten as a hand-off with the m01 row of 7.6); the ink reword at `:417` | A2b, A5, A6 | `first_call` and `support_hub` untouched; key diff shows only `first_ring` and `closing_debrief` lines (the follow-up text is not voiced); the first ring answered at once, answered after 12 s, and declined then called back (three different openings); the bring-in's `#ending_check` answered both ways: "End the mission now" voices m01's last line from 7.6, the call closes, the in-person debrief opens and the phone does not reopen; "Keep going" closes the call with no debrief and the hub choice is still there |
| M9 | Small wording: lab_physical_pentest Ruth line; sis02 ring wording; sis03 call framing | today | text only, except one person-chat line |
| M10 | m06 fund call and bring-in call; m08 door audit call | A5 | see below |

**M2 in detail.**

1. m10 `scenarios/m10_full_disclosure/scenario.json.erb`: add to the `voices` hash (`:491`) `hax_briefing:` with name `Aoede`, the style string of m01 `briefing_cutscene` (`scenarios/m01_first_contact/scenario.json.erb:557-561`) and `en-GB`; and `hax_debrief:` with the style of m01 `closing_debrief_person` (`:1134-1138`). `hax_post` (`:1611`) uses `voice.(:hax_briefing)`; `hearing` (`:2486`) uses `voice.(:hax_debrief)`; `agent_0x99` (`:1624`) keeps `voice.(:hax_phone)`. Replace the ERB comment at `:1610` ("One HaX voice block for both her records…") with one that says co-speaker lines name `agent_0x99:` and the in-person records have their own styles.
2. m10 `agent_0x99` (`:1618-1624`) gains `hax_post`'s `spriteSheet`, `spriteTalk`, `spriteVisemes` and `spriteConfig` (`:1603-1607`). Why it is needed: today an `Agent HaX:` line in Netherton's, Tesseract's or the six o'clock story resolves to `hax_post`, because `hax_post` is listed first in `forward_post` (`:1599` before `:1618`) and the registry keeps that order (1.6). Person-chat draws the resolved character's art. After step 3 those lines resolve to `agent_0x99`, a phone record with only `avatar`, and without this step the portrait code would fall back to the default `hacker` sprite with no lip sync (`person-chat-portraits.js:375-387, 416-435`). With the fields copied, the portrait is the one shown today. No world sprite appears, because phone records never get one (`rooms.js:3313`), and the voice block is unchanged, so no key moves.
3. In the 14 files of the 7.2 row, change every `Agent HaX:` prefix to `agent_0x99:`. Leave `m10_hax_post.ink` and `m10_hearing.ink` as they are (their own lines stay with their host, 1.6).
4. m09: `hax_voice`'s voice style becomes the m01 briefing style; `m09_briefing.ink`'s 59 `Agent HaX:` prefixes become `hax_voice:`. m09 `agent_0x99` (`:838-848`) gains `hax_voice`'s art fields (`:1016-1020`), so the on-the-line scenes stop drawing the default sprite (7.2). This changes how m09 looks today, so the slice logs it for the user.
5. Key diff: m10 changes only lines whose host is `hax_post` or `hearing`; every `agent_0x99:` line, `m10_ghost_phone.ink:109` among them, keeps its key; m09 changes only `m09_briefing.ink` HaX lines. Anything else is a failure.
6. Proof: in each mission, a person-chat with an `agent_0x99:` or `hax_voice:` line shows "Agent HaX" as the speaker (never the id) with her portrait and lip sync, and requests TTS under the expected id. In m10, the portrait route of 5.4: screenshots of an `agent_0x99:` line in Tesseract's and Netherton's scenes match A0's screenshots of the same lines (portrait, name, mouth frames). In m09, a screenshot of a line in the Sorensen door scene shows her art. The m10 Ghost call line requests under `agent_0x99` with the same text and voice as A0.

**M10 in detail.** The two beats are the ones the missions' texts already describe as calls (7.2, 7.3): m06's fund report ("Call me about it") and m08's door audit read ("you read it to me … Call me when you've got both"). Both are the player's call, placed from the hub choice the thread already has, so no beat is told twice and the texts read right as written. m06's bring-in call is in the same slice, with the m06 row of 7.6 and the bracket `#ending_check`. Rules for the writer: the call knot keeps the text knot's content, rewritten as speech (3.5); at most about ten NPC lines each; the call ends `#exit_conversation` and `-> DONE`. Proof: each call placed from its hub choice; in m08, a wrong answer and then the right one, the second time from the hub again; m06's bring-in hand-off to the in-person debrief, and a bring-in run with nothing optional open where `[On my way.]` asks nothing. Lab sheet: `m08_the_mole.md:410` (7.2), `m06_follow_the_money.md:504`.

Regression after every M slice: the lab SE proof plus the mission's own playtest walkthrough step for the changed beat.

## 9. Decisions and later

### 9.1 Decisions

The user decided C2, C6 and C23–C26 (log, 2026-11-12). The orchestrator took the plan's defaults for the rest. Nothing here is open.

| # | Decision | Reason |
|---|---|---|
| C1 | A declined call has no story consequence by default; a mission maps `phone_call_declined` where it wants one (m01, m05 do). | keeps each caller's ink simple |
| C2 (user) | In-person HaX uses m01's styles: briefing style for m09 `hax_voice` and m10 `hax_post`, debrief style for m10 `hearing`. No global HaX restyle. Co-speaker lines name their record by id so nothing else re-keys (M2). | the lead character sounds in the room when she is in the room |
| C3 | A sourced CC0 mobile ringtone (A8); vibrate until then. | `desk_phone_ring` is an office desk phone |
| C4 | New forced calls ring first and auto-answer after 6 s; legacy forced calls are unchanged. | a beat to finish a puzzle, with no tear-down |
| C5 | No Recents screen: rows in the thread and a missed-call preview. | one thread per contact keeps context |
| C6 (user) | The Architect's calls ring as "No caller ID" and open in his terminal look, voiced; the "without ringing" narration is rewritten. A declined call leaves a voicemail. | the hijacked handset stays his look; the voicemail keeps a declined taunt's content |
| C7 | No `ring` on video calls. | m02's are started at a console; one lab use |
| C8 | No `ring` on the existing m09/m10 forced calls. | they work and were tuned |
| C9 | m09 HaX `start` becomes plain texts; m06 and m08 each get a placed HaX call on the beat their texts already call a call (M10); m01 gets one short first call, and the player's request to be debriefed becomes a placed bring-in call that hands over to the in-person debrief (M8). | every m01–m08 mission has a call; m01 teaches answering with nothing at stake and placing a call at the end |
| C10 | lab_physical_pentest Ruth: "Message me on the phone". | her contact is a text thread |
| C11 | A missed handler call leaves a callback (and, in m01, a follow-up text). | handler calls carry progress |
| C12 | Dev (lab SE) gets no call button. | the lab is frozen |
| C13 | Reload while ringing: missed with a callback; forced calls ring again. | a missed call is what a real phone shows |
| C14 | Delivery notes on voiced calls now (A1, 5 re-keys). | otherwise `#delivery:` does nothing on calls |
| C15 | Answering over a puzzle holds the call until the player closes the puzzle; the engine never closes it. | restoring a minigame means restarting it from its opening params (1.4), which loses progress (lockpick pins, a typed code), restarts timed puzzles' clocks, and is only proven for conversation parents; holding keeps the puzzle as it was and leaves the player in charge, as a caller on hold waits |
| C16 | m09 Gary keeps Charon with the m10 style. | continuity with m02 and m10, where the same voice already shares a mission with Netherton |
| C17 | Answering over a workstation popup puts the popup aside, takes the call, and puts it back afterwards. | the popups keep their state when hidden (1.3), so unlike a minigame they can be restored exactly; the player hears the caller at once and returns to the same CyberChef recipe or lab sheet position; holding would make them close a tool they need straight after |
| C18 | A held call opens only when `openBlocked()` is false, checked twice; otherwise it stays held or goes back to the queue (rows 13–16, 19). | keeps principle 3: the engine never ends a minigame or opens a call mid-fight |
| C19 | A non-forced caller rings off after 90 s on hold and leaves a callback. | a real caller doesn't wait for ever, and some minigames hide their close button |
| C20 | "Call me" in a text only where the beat is a call; the bring-in is a placed call in every mission that has one; 10 texts reworded, 2 become HaX's ring (7.3). | the call button makes "call me" literal; the bring-in is the beat every mission shares |
| C21 | `call` takes a list of entries, and `#place_call` lets a hub choice dial. | conditions are `&&` only (1.9); keeping the hub choice means no topic disappears and quoted lab sheet steps stay true |
| C22 | m10 and m09 `agent_0x99` carry HaX's art fields. | co-speaker lines keep her portrait and lip sync (M2); m09's on-the-line scenes stop drawing the default sprite |
| C23 (user) | Debriefs are in-person scenes by default, varied by story (7.5). m07's secure link stays; m04's Vance and m09's HaX stay on the line, because the story has put them elsewhere. Every call before a debrief is a short bring-in that hands over. | the in-person scene carries the weight; the variety comes from each story |
| C24 (user) | Calls ring out after 20 s by default; `ring.untilAnswered` is an optional per-call setting (3.1). | ringing out with a callback is what a real phone does; some callers would keep trying |
| C25 (user) | The engine writes `call_answer_seconds` (int) and `call_is_callback` (bool) into the caller's ink through `applyEngineVariables`, run-scoped and never saved as values (2.11). | the NPC can react to a slow answer or a returned call; the existing engine-VAR mechanism already sets VARs at the right moment on every load |
| C26 (user) | A missed call leaves a "Call back" button (header and missed row) that opens the same conversation with `call_is_callback` true (2.6). | the caller can open with "Thanks for returning my call" |
| C27 | While a ringer call is connected, a legacy scripted conversation waits behind it (`_scriptedCallBusy`, 2.9); a connected call closed any other way becomes a callback (row 32). | a bring-in call must finish its last line before the debrief opens; scenarios without `ring` or `call` are unchanged |
| C28 | A `ring` mapping's `onceOnly` trigger is persisted when the call is offered (2.7). | the pending call or its callback carries the beat over a reload; saving a trigger key in `pendingCall` would need a second server whitelist for no gain |
| C29 | An answered call never rings again: a call that can't open yet waits as `held` (rows 15, 19, 24). | a call the player took can't later be "missed" |
| C30 | The ringer asks `scriptedConversationActive()` (today's `_scriptedCallBusy()` body, with its stale-clearing) and the queue length, never `_scriptedCall` directly (2.2). | `_scriptedCall` outlives its scene (1.2), so m01's first ring would wait behind a closed briefing |
| C31 | A ringer call's story is moved to the home knot inside the call's minigame, synchronously, before the story is cleared (2.5). | the adapter has no loaded story, and an asynchronous reload of it would race the phone's reopen |
| C32 | During a connected ringer call, text toasts are held and auto-challenges are dropped (2.9). | a toast click or a challenge would end the call; a held toast shows after it, and a challenge fires again on the next sighting |
| C33 | Bring-ins in m03 to m06 ask the ending question from the `[On my way.]` choice's brackets, and `call_in_after_sweep` completes on the `[Bring me in.]` reply, not in `extract_go`; each mission's bring-in lines are its own (7.6). | the question then comes before the last line, a player with nothing optional open is never asked, and no clip is shared between missions. "Keep going" no longer holds the ending: the "End the mission" button and the self-opening debrief of the mapping form are gone, and the player rings HaX again (the hub choice that placed the call is still offered) when ready. Accepted: a ring is natural in a call, and m01 already works this way |

### 9.2 Later (not built in this plan)

- A busy tone and an "unavailable" knot for `call` (no mission needs one).
- `voice.callFx` (a phone-line effect for call lines only).
- A call icon on contact rows; a Recents screen.
- `ring` on video calls and on the legacy m09/m10 forced calls.
- Events `phone_call_ringing`, `phone_call_placed`, `phone_call_ended`; a `durationMs` field.
- Per-call timing keys beyond `untilAnswered` (a custom ring timeout, dial and ring-out times, hold limit).
- A header call button for beats whose condition needs an OR, without `button: false` (an `||` in the condition grammar).
- In-person style for other m10 scenes where HaX is in the room (`m10_tesseract.ink`, `m10_six_oclock.ink`): they stay on `agent_0x99` and the phone style until the user asks.
