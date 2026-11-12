# Phone calls: plan

Status: draft 3, 2026-11-12. Track brief: `docs/agents/PHONE_CALLS_BRIEF.md`. Log: `docs/agents/PHONE_CALLS_LOG.md` (user decisions C2 and C6 of 2026-11-12 are built in). Inputs: `docs/agents/phone_calls/`.

All paths are relative to the worktree root unless shown in full. `js/` means `public/break_escape/js/`, `css/` means `public/break_escape/css/`. Line numbers are at commit 74152ab15; the engine is unchanged since 5952f39e1. Lab sheet paths are relative to `/home/cliffe/Files/Projects/Code/HacktivityLabSheets/_labs/`.

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

Barks are also held back while a workstation popup or a person-chat is open (`npc-barks.js:175-186`).

The workstation popups are plain DOM, not minigames: `workstationPopupOpen()` checks `#laptop-popup` and `#lab-popup` (`js/utils/overlay-open.js:6-15`). Closing one only hides it and keeps its iframe loaded, so CyberChef's recipe and input and the lab sheet's scroll position survive a close and reopen (`js/utils/crypto-workstation.js:19-22, 36-52`; `js/utils/lab-workstation.js:24-27, 39-58`). Both close functions drain held barks; neither tells the minigame framework. The four functions are on `window` (`js/utils/helpers.js:244-248`).

### 1.4 How a minigame closes

- Esc, the close button and a player hit all close through the minigame's own `complete(false)`, which emits `minigame_failed` (`js/minigames/framework/base-minigame.js:94-104`). `endMinigame` runs `cleanup` and `onComplete` (`minigame-manager.js:215-305`).
- The damage close marks itself first so minigames can skip failure toasts ("Pick Failed"): `minigameClosedByDamage` (`js/systems/player-damage-interrupt.js:27-40`). A hit leaves a non-forced phone open with a notice and closes a forced (`disableClose`) call (`:55-61`). `closeMinigameOnDamage` is called on every hit from `js/systems/player-health.js:93`.
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
- A mapping that opens a conversation persists its `onceOnly` trigger only when the conversation closes (`npc-manager.js:1046-1061`). Its `setGlobal`, `completeTask` and other side effects run before the conversation opens (`:1063-1080` onwards). Missions re-ring unfinished calls with `resume` mappings on `game_loaded` / `room_exited` / `conversation_closed` (README "Forced phone calls that ring again").
- `hasPendingOpeningConversation` (`npc-manager.js:1938-1946`) holds the Mission Brief popup while an opening timed conversation is undelivered or in the scripted queue; the popup waits on it through `briefPopupBlocked` (`js/utils/helpers.js:44-48`).
- Closing a phone emits `conversation_closed:<contact>` for the open thread from `cleanup` (`phone-chat-minigame.js:1630-1636`).
- Opening a thread restores the saved story and shows its current choices (`phone-chat-minigame.js:540-616`).

### 1.8 Sounds

- `phone_vibrate.mp3` plays with every text toast (`npc-barks.js:76`). `message_received`, `message_sent` exist (`js/systems/sound-manager.js:86-87`). `desk_phone_ring.mp3` (`:88-89`) and `distant_phone.mp3` (`:136-137`) exist. There is no mobile ringtone and no ring-back tone. Credits file: `docs/achitechture/OFFICE_LIFE_SOUND_CREDITS.md`.
- Volume categories go by sound name (`sound-manager.js:198-206`). `phone_vibrate` and `message_*` are `notifications` (`:205`); any other new name falls to `effects`.

### 1.9 Other facts the work needs

- Contact-level `voiced`/`callLabel` is used only by `lab_social_engineering` `dev_service_desk` (`scenarios/lab_social_engineering/scenario.json.erb:1792-1803`). The player's phone lists only `ruth_phone` (`:22-24`); the contact list also shows any contact with history (`phone-chat-ui.js:506-517`), so Dev appears after the first pretext call and opens there as a silent thread.
- `#delivery:` notes inside voiced call knots today: `scenarios/m09_digital_archaeology/ink/m09_phone_agent0x99.ink:494, 506, 678`, `m09_phone_recruiter.ink:171`, `scenarios/m10_full_disclosure/ink/m10_ghost_phone.ink:146`. None in `dev_service_desk.ink`. `scripts/ink_runtime_check/dialoguelint.mjs:798` skips delivery checks on the phone channel.
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
- `playerIsKnockedOut` is on `window` (`js/systems/player-damage-interrupt.js:176`).

## 2. Part A: engine design

### 2.1 Principles

1. **Opt-in, per beat.** Two new keys carry everything: `ring` on a call (mapping or `timedConversation`) and `call` on a contact. Without them every path in 1.1 is unchanged.
2. **A call is its own phone-chat minigame.** Call mode is fixed at UI build (`phone-chat-ui.js:49`), so answering, dialling and calling back each start a fresh `phone-chat` with `voiced: true`. This is what `callLaunch` already does for the lab.
3. **Ringing never closes anything.** A ringing call shows on its own layer above minigames. Answering over a puzzle puts the caller on hold until the player closes the puzzle themselves, and the call opens only once nothing else is on screen. The engine never ends a minigame because of a new call. The one thing it puts aside is a workstation popup, which it can put back exactly (2.4, row 11).
4. **The ink stays the ink.** Decline, missed and voicemail are engine events and optional knots. A mission reacts to them with ordinary event mappings.
5. **One thread per contact.** Texts, call transcripts and call-log rows share the contact's thread, in time order.

### 2.2 The ringer and its states

New module `js/minigames/phone-chat/phone-ringer.js`: a pure state machine with no imports, so node tests load it alone. A thin adapter, `js/minigames/phone-chat/phone-ringer-dom.js`, wires it to the window (framework, npcManager, sound, timers, DOM) and is created right after `window.npcManager` (`js/main.js:137`) as `window.phoneRinger`.

Each incoming call is an **offer** `{ npcId, knot, disableClose, resume, onMissed, voicemailKnot, withheld, callLabel, opening, setGlobalOnStart, persist }`. The ringer holds at most one offer per contact and these states:

| State | Meaning |
|---|---|
| `queued` | Due, but something blocks ringing (table below). Waits first in, first out. |
| `ringing` | The incoming-call UI shows. Ring timer running unless paused. |
| `held` | Answered over a non-conversation minigame: the ring stops, a hold pill shows, the call opens once the screen is clear. |
| `connected` | The call's phone-chat is open (or opening). |
| `missed` | Declined, timed out, rung off after the hold limit, or lost to a reload. Leaves a row, then a callback or voicemail. Terminal for the offer. |

Separately from offers, a contact can have a **pending callback** `{ knot, resume }` (2.6), which is what a missed call leaves when `onMissed` is `"callback"`.

Two checks decide what the ringer may do. Both are functions of the adapter, each with a named test.

**`ringBlocked()`**, true when an offer may not start ringing:

- a conversation minigame is open: a `phone-chat` showing a call (call screen, `voiced` terminal call) or opened with `disableClose`, a `person-chat`, a video call;
- `npcManager._scriptedCall` is set or its queue is non-empty;
- the player is knocked out (`window.playerIsKnockedOut?.()`);
- another offer is `ringing`, `held` or `connected`, or an outgoing call is dialling or connected;
- the ringer is closed (row 28).

A non-conversation minigame (lockpick, keypad, terminal, PC, container, notes) does not block: the call rings over it. A workstation popup does not block. A phone-chat on the contact list or a text thread does not block: the call rings inside the phone (row 10).

**`openBlocked()`**, true when a call that has been answered may not open yet:

- any minigame is open (`MinigameFramework.currentMinigame` and not `_ending`), apart from a phone-chat on the contact list or a text thread, which row 10 closes first;
- `npcManager._scriptedCall` is set or its queue is non-empty;
- the player is knocked out;
- the player was hit within the last `HIT_QUIET_MS` (`playerHitWithin`, A2c);
- the ringer is closed.

A workstation popup does not block opening: row 11 puts it aside. `openBlocked()` is checked when the player answers and again just before the call's `startMinigame`, after the `SCRIPTED_CALL_START_MS` wait.

**Paused** means any of: the session-resume overlay is up (`isSessionOverlayShowing()`), the pause menu is open (`.game-menu-overlay` displayed), the Mission Brief is open (`currentMinigame._sceneType === 'notes' && currentMinigame.params?.title === 'Mission Brief'`, 1.9), or `document.hidden`. While paused the ring timer, the auto-answer timer and the hold timer stop, the ringtone is silent, and the banner or pill stays.

The adapter learns about changes from four hooks rather than waiting for the 500 ms tick (2.9): minigame started, minigame ended, workstation popup closed, and `game_loaded`. The tick stays as a backstop.

### 2.3 State table

Constants: `RING_TIMEOUT_MS = 20000`, `AUTO_ANSWER_MS = 6000`, `RERING_AFTER_LOAD_MS = 3000`, `HIT_QUIET_MS = 4000` (no damage for this long before a call opens, auto-answers or re-rings), `HOLD_MAX_MS = 90000` (unpaused time a non-forced caller waits on hold), `DIAL_MS = 2500`, `RING_OUT_MS = 6000`, and the existing `SCRIPTED_CALL_START_MS = 500` (`npc-manager.js:139`). Each row is a named test in `test/js/phone-ringer.test.mjs` (5.1) and, where marked ★, a row in the test scenario (5.3). The slice that builds each row is in the last column (section 6).

**Offers arriving**

| # | State | Event | Result | Slice |
|---|---|---|---|---|
| 1 ★ | none for this contact | offer, `ringBlocked()` false | `ringing`. Apply the offer's `setGlobalOnStart` (timed calls). If the contact has a pending callback, clear it now (row 7). | A2a/b |
| 2 ★ | none for this contact | offer, `ringBlocked()` true | `queued`, at the tail. | A2a/b |
| 3 | `queued`, `ringing` or `held` for this contact | offer, same knot | Drop the new offer. Persist its onceOnly trigger. | A2a/b |
| 4 ★ | `queued`, `ringing` or `held` for this contact | offer, different knot | Replace: the old offer is removed with no row and no event, and its trigger is persisted; the new offer takes its place and state (a `ringing` call restarts its ring with the new knot; a `held` call keeps its hold). This keeps m07's T-5 from ringing after T-1. | A2a/b |
| 5 | `connected` for this contact (incoming or outgoing) | offer | `queued` behind it; rings when the call ends. | A2a/b |
| 6 ★ | another contact `ringing`, `held` or `connected` | offer | `queued`, first in, first out. | A2a/b |
| 7 ★ | contact has a pending callback and no offer | offer | Rows 1 and 2 apply as usual. The callback stays while the new offer is `queued`, and is cleared when the new offer starts ringing; from then the new offer's own outcome decides what is left (answered: nothing; missed: its own `onMissed`). So the call button never dials a stale knot, and a contact never has two callbacks. | A6 |
| 8 ★ | `queued` | `ringBlocked()` turns false | Head of the queue → `ringing`. Checked on every hook (2.2) and by the 500 ms tick. | A2a/b |

**Answering**

| # | State | Event | Result | Slice |
|---|---|---|---|---|
| 9 ★ | `ringing` | Answer; nothing open | `openBlocked()` is false: emit `phone_call_answered`, open the call (2.4) after `SCRIPTED_CALL_START_MS`, checked again then (row 19). After the call, back to the world. | A2a/b |
| 10 ★ | `ringing` | Answer with the player's phone open on its contact list or any text thread | Close the phone with `params._closingForCall = true`; `cleanup` then skips `_emitConversationClosed` for whichever thread was open (`phone-chat-minigame.js:1630-1636`), because the phone reopens on it after the call and the event fires when the player really closes it. Emit `phone_call_answered`, open the call; when it ends, reopen the phone on the screen and thread it was on. A phone object's handset (a desk phone, `phoneId` not the caller's, `interactions.js:1752-1806`) counts as a non-conversation minigame instead (row 12): the banner shows, not the in-phone panel. Until A3 registers the phone with the ringer, every open phone-chat that isn't a call is treated that way. | A3 |
| 11 ★ | `ringing` | Answer with a workstation popup open and no minigame | Note which popup is open (`#laptop-popup`, or `#lab-popup` and its frame's `src`), close it with `window.closeLaptop()` / `window.closeLabWorkstation()` (state kept, 1.3), then row 9. When the call ends, reopen it with `window.openCryptoWorkstation()` / `window.openLabWorkstation(savedSrc)`, unless something else is open by then. | A2c |
| 12 ★ | `ringing` | Answer over a non-conversation minigame | `held`: the ringtone stops, the banner becomes the hold pill (2.4) with a Hang up button, and the hold timer starts. The minigame is untouched. | A2c |

**On hold**

| # | State | Event | Result | Slice |
|---|---|---|---|---|
| 13 ★ | `held` | a minigame closes or a popup closes (hooks), and `openBlocked()` is false | Wait `SCRIPTED_CALL_START_MS`, check `openBlocked()` again, then `connected` as row 9 (row 11 if a popup is open by then). If the second check fails, the row that matches applies. | A2c |
| 14 ★ | `held` | the minigame closes, but another non-conversation minigame is open by the time the hook runs (an S12 parent reopened, or the closing minigame's `onComplete` opened one) | Stay `held`; the pill stays and the hold timer keeps running. Row 13 runs when that one closes. | A2c |
| 15 ★ | `held` | a conversation opens, or `npcManager._scriptedCall` is set or queued (for example a legacy mapping on `minigame_completed` that opens a scripted call 500 ms later, as m07's sign-off does today, `scenarios/m07_architects_gambit/scenario.json.erb:1625-1638`) | Back to `queued` at the head of the queue; the pill is hidden. It rings again (row 8) once that conversation is over. The hold time used so far counts towards `HOLD_MAX_MS`. | A2c |
| 16 ★ | `held` | the minigame was closed by a hit, or the player was hit within `HIT_QUIET_MS` when row 13 would run | Stay `held` until `HIT_QUIET_MS` has passed with no hit, then row 13. The call never opens in the middle of a fight. | A2c |
| 17 | `held` | Hang up | As Decline (row 20). | A2c |
| 18 ★ | `held`, not forced | `HOLD_MAX_MS` of unpaused time on hold | `missed`: emit `phone_call_missed:<npcId>`, then `onMissed`. Toast "<Name> rang off. Call back from the thread." (withheld: "The caller rang off."; with `onMissed: "voicemail"` the voicemail toast replaces it). A forced call has no hold limit. | A2c (event), A6 (callback) |

**Opening and missing**

| # | State | Event | Result | Slice |
|---|---|---|---|---|
| 19 ★ | `connected`, opening | `openBlocked()` is true at the second check, or `startMinigame` returns null (knocked out, the scene refused) | Back to `queued` at the head, or `held` if a non-conversation minigame is now open. The same guard sits on every path that opens a call: rows 9–13, 22, 26 and 27. The ringer is never left `connected` with no call on screen. | A2a/b |
| 20 ★ | `ringing` | Decline | `missed`: emit `phone_call_declined:<npcId>`, persist the trigger, clear the offer. A4 adds the "Missed call" row; A6 runs `onMissed` (2.6). | A2a/b, A4, A6 |
| 21 ★ | `ringing` | ring timer reaches `RING_TIMEOUT_MS` (not counting paused time) | As row 20, but emits `phone_call_missed:<npcId>`. | A2a/b, A4, A6 |
| 22 ★ | `ringing`, forced (`disableClose`) | — | No Decline button, no timeout. After `AUTO_ANSWER_MS` of unpaused time with no hit in the last `HIT_QUIET_MS` it answers itself (row 9, 10, 11 or 12 by what is open). | A2c |
| 23 ★ | `ringing` | a conversation opens (a legacy scripted call, a person-chat the player starts, a timed conversation), seen by the start hook | Back to `queued` at the head: banner hidden, timers keep their elapsed time. Rings again when it closes. | A2a/b |
| 24 | `ringing` or `held` | player knocked out | Back to `queued` at the head (as row 23). | A2a/b |

**Calls in progress and their end**

| # | State | Event | Result | Slice |
|---|---|---|---|---|
| 25 ★ | `connected` | call ends (End, `#exit_conversation`, the story ending, or the back arrow on a terminal call) | Persist the trigger, clear the offer and `pendingCall`, reset the story position (2.5), reopen the phone (row 10) or the popup (row 11) if the call displaced one. `conversation_closed:<npcId>` fires once, from the call's own phone-chat. A4 adds the "Incoming call, m:ss" row. | A2a/b, A4 |
| 26 ★ | `connected`, forced | a hit closes it (`player-damage-interrupt.js:55-61`) | `pendingCall` kept as `connected`; it rings again (row 1) once there has been no hit for `HIT_QUIET_MS`, opening with `resume` so the unanswered choice shows. Non-forced calls stay open on a hit, as today. | A2c |
| 27 ★ | any of `queued`, `ringing`, `held`, `connected` | reload | On load, non-forced: `missed`, with its row, no toast, `phone_call_missed` emitted after `game_loaded`, then `onMissed`; the onceOnly trigger is persisted, so a `room_entered` or `game_loaded` mapping can't offer the same call again on top of the callback. Forced: rings again `RERING_AFTER_LOAD_MS` after `game_loaded`, when `ringBlocked()` is false, opening with `resume`. | A4 |
| 28 | any | ending starts (the ending check's "End the mission now" is confirmed, or the credits start) | Ringer closes: queued, ringing and held offers are removed with no rows and no events; new offers are refused. Calls already `connected` finish normally. | A2c |
| 29 | `ringing` or `held` | paused | Timers stop, ringtone silent, banner or pill stays. | A2a/b |
| 30 | `queued`, `ringing` or `held` (timed opening call) | — | `hasPendingOpeningConversation` returns true while the ringer holds any offer with `opening: true` in one of those states. | A2a/b |
| 31 ★ | `queued` or `ringing` for contact X | the player places a call to X (button, `#place_call` or callback) | If the outgoing call opens on the offer's knot, the offer is dropped with no row and no event and its trigger persisted: the player rang first. Otherwise the outgoing call goes ahead and the offer stays `queued` (row 5). | A5 |

A `timedConversation` with `ring` is marked delivered when it is first offered, and its `setGlobalOnStart` is set at row 1 (first ring). A reload during the ring therefore does not schedule it again; row 27 handles it.

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

With `withheld: true` the banner shows "No caller ID" in place of the name, a plain handset glyph in place of the avatar, and no caption. A forced call has no Decline.

**Inside the phone** (the player's phone on its contact list or a text thread): `phone-chat-ui.js` gains `showIncomingCall(view)` / `hideIncomingCall()`, a full-screen panel over the phone's content with the same fields and buttons. The phone-chat minigame registers with the ringer in `init` and unregisters in `cleanup`, only when it was opened as the player's phone (`phoneId` is the caller's `phoneId`); while one is registered the ringer uses the panel instead of the banner.

**Hold pill** (row 12): the banner shrinks to one line, "<Name> · on hold · close this to talk", with a Hang up button. No sound.

**A workstation popup** (row 11): Answer hides the popup with its own close function, the call opens, and the popup comes back as it was when the call ends. CyberChef keeps its recipe and input and the lab sheet keeps its scroll position, because closing only hides them (1.3). The player hears the caller at once and returns to the tool they were using. This matters in m09, where Gary rings at the salvage keypad (`scenarios/m09_digital_archaeology/scenario.json.erb:985`) while the player may be decoding its clue in CyberChef (`safetynet/m09_digital_archaeology.md:127`).

**Sound.** While ringing: `phone_ringtone` on loop (asset in A8; until it exists, `phone_vibrate` every 2 s), and `phone_vibrate` once per cycle. Add `phone_ringtone` to the notifications match in `getVolumeForSound` (`sound-manager.js:205`). Stops on any outcome and while paused.

**Keys.** Esc does not answer or decline. Number keys do nothing to the banner. The banner does not take focus from an open minigame's input.

### 2.5 Outgoing calls and the thread after a call

- **Call entries.** A contact's `call` (3.2) is one entry or a list of entries `{ knot, when, unavailable, button }`. A list lets one contact have several callable beats (m03 HaX has the revelation call and the bring-in call), and lets an author write an OR as two entries with the same knot, since conditions are `&&` only (1.9).
- **Two ways to dial.** The header button, and the ink tag `#place_call` (or `#place_call:<knot>`) on a line or choice in the text thread. The tag lets a hub choice the player already knows ("[I'm done here. Bring me in.]") place the call, so the thread never offers a topic and then refuses it, and lab sheet steps that quote the choice stay true. Both run the same dial path.
- **What the button dials**, in order: a pending callback (2.6); else the first entry with `button` not `false` whose `when` holds; else, if any such entry has `unavailable: "no_answer"`, a call that rings out. If none applies the button is hidden. An entry with `button: false` is reached only by `#place_call:<knot>`.
- **What `#place_call` dials**: with a knot, that entry (the validator requires the knot to be one of the contact's entries, 4.3); with no knot, what the button would dial. The tag runs after the step's lines have shown. The ink's choice condition is the author's gate; the entry's `when`, if it has one, is still checked as the call connects.
- **Not callable**: a contact with `callId` (the judged pretext contact, `phone-chat-minigame.js:376-384`), and any contact while the phone was opened with `disableClose`.
- **Button**: a green phone button in the open thread's header (`aria-label="Call <name>"`), drawn by the header update in `phone-chat-ui.js`. Contact rows are not changed.
- **Dialling**: the phone saves its return state (the `pendingPhoneReturn` shape, `phone-chat-minigame.js:1683-1700`), closes with `_closingForCall` (no `conversation_closed` for that thread), and starts a phone-chat `{ npcId, phoneId, startKnot: <entry knot>, voiced: true, callLabel, callDirection: 'outgoing', theme }`. The call screen shows "Calling…", the caption and End, with a UK ring-back tone made with Web Audio (400 Hz + 450 Hz, 0.4 s on, 0.2 s off, 0.4 s on, 2 s off), its gain scaled by the sound manager's master and notifications volumes. After `DIAL_MS`:
  - the entry's `when` holds (or is absent): connected. The story opens on the entry's knot through the explicit-knot path (restore the saved story, then `goToKnot`, `phone-chat-minigame.js:540-557`), so ink-local VARs and visit counts carry over. If an incoming offer for this contact is queued or ringing on the same knot, it is dropped (row 31);
  - `when` fails: it rings out for `RING_OUT_MS`, shows "No answer" for 1 s, adds a "No answer" row, and returns to the thread;
  - a pending callback connects at once, skipping `when`.
- **Ending** (End, `#exit_conversation`, the story ending): "Call ended m:ss" shows for 1 s, the row "Outgoing call, m:ss" (or "Incoming call, m:ss") is added, `conversation_closed:<npcId>` fires once, and the phone reopens from the saved return state on the contact's thread. An incoming call answered with the phone closed returns to the world.
- **Terminal-look calls** (m07's Architect) have no call screen (`phone-call-ui.js:18-20`): no End button, no "Calling…" and no "Call ended m:ss". They end on `#exit_conversation`, or on the back arrow when the call is not forced, and then row 25 applies as for any call, row included. A terminal contact's ringing call is not a preloaded first open, so its lines are not typed out by the terminal opening (`phone-chat-ui.js:999-1011`); they appear and are voiced line by line.
- **Story position after a call** (any end, including a forced call closed by damage once it is finally finished): if the saved story is inside a call knot (`this.conversation.callKnots`, `phone-chat-minigame.js:517-520`) or has ended, jump it to the home knot with `goToKnot(homeKnot)` and save it without running it. The thread then opens on its home knot, never on a call's choices shown as silent texts. A forced call closed mid-way keeps its position (row 26 resumes it).
- **No cooldown.** Ringing again reruns the entry's knot; the ink decides what a repeat call says (visit counts, `{once}` blocks).
- **The lab's path is untouched.** `callLaunch` (`pretext-card.js:294-311`) is not edited. The contact-level `voiced: true` keeps its meaning: a call through `callLaunch` is voiced and opens on the home knot.

### 2.6 Thread rows, missed calls, callback, voicemail

- **Rows.** Only the new paths (`ring`, `call`, callback) add rows. A row is a message `{ type: 'call', callEvent, text, timestamp, read }` with fixed plain text: "Missed call", "Incoming call, 1:24", "Outgoing call, 0:48", "No answer", "Voicemail". With `withheld` the text is "Missed call: No caller ID" / "Call: No caller ID". Rows draw like narration (centred, muted, a phone glyph), are never voiced, never barked. The contact preview shows the last row; a missed call shows "Missed call" in red and counts as unread.
- **`onMissed: "callback"`** (default): the contact gets a pending callback `{ knot, resume }`. The call button shows even without a `call` block and connects at once to that knot; `#place_call` with no knot dials it too. Cleared when it connects, and when a newer offer from the same contact starts ringing (row 7). A contact with both uses the callback first.
- **`onMissed: "voicemail"`**: `ring.voicemailKnot` runs silently into the thread, like a preload. The runner restores the contact's saved story, goes to the voicemail knot, continues to its end, applies its tags, adds its lines to the thread, saves the story (so ink-local VARs the knot sets, such as m07's `heard_t30`, persist), then resets the position to the home knot (2.5). Nothing is shown live. Lines written `voice: …` become voice-message bubbles with play buttons (the existing renderer, `phone-chat-ui.js:821-887`), in the terminal look as well. Toast "New voicemail" (with the caller's name unless `withheld`). No callback. A forced call can't be declined or rung off, so it has no voicemail (3.1).
- A mission that wants a story consequence maps the event: `{ "eventPattern": "phone_call_declined:recruiter", "setGlobal": { "recruiter_snubbed": true } }` or a follow-up text.
- **Phone objects with `voice`** (m01 two, sis01 one) are recordings found in the world and stay exactly as they are.

### 2.7 Save and reload

- New per-contact field in the saved phone state: `pendingCall: { knot, state, disableClose, resume, onMissed, voicemailKnot, withheld, callLabel }`, `state` one of `queued ringing held connected missed`. Written on every state change; removed when a call ends normally, when a callback connects, or when the ringer closes (row 28).
- `_phoneStateEntry` keeps an entry that has only `pendingCall` (change `npc-manager.js:2275` to `if (history.length === 0 && !storyState && !npc.pendingCall) return null;`). The server does the same (4.1).
- Message entries gain `callEvent` (one of `missed incoming outgoing no_answer voicemail`). Row texts are never empty, so `:2263` keeps them.
- A pending callback is saved as `pendingCall` with `state: "missed"`, so the button survives a reload.
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
- Every hook only nudges the ringer to re-run its checks; the 500 ms tick is the backstop.
- Legacy mappings (no `ring`) still close the open minigame as today. Nothing in this plan changes them.
- Video calls do not ring (validator error, 4.3).
- The terminal theme (m07's Architect) has no call screen. A `ring` call to a terminal contact rings with the normal banner, then opens in the terminal look, voiced (1.5).

### 2.10 Speaker ids on the phone path

So that a mission can name which of two same-named records speaks a line (Part B, M2), the phone path accepts an id prefix as person-chat and the server already do (1.6):

- `otherSpeaker(text, contact, knownNames, knownIds)` (`phone-chat-speaker.js:174`): new optional fourth argument, a Map of registered id → display name. A line starting `<id>:` (exact id, case-insensitive, not the contact's own id, never `narrator` or `player`) returns `{ name: <display name>, id, text }`. Display names are checked first, as now.
- `phoneLineVoice` (`phone-call-voice.js:98`) passes the ids from the characters it already gets and uses `other.id` when present.
- `phone-chat-ui.js` (`:230`, `:895`, `_knownSpeakerNames` `:934`) passes the same Map, so the bubble and the subtitle show the display name, never the id.
- The new rule matches any exact registered id, case-insensitively, so plain ids such as `ghost`, `guard`, `dom` or `tomasz`, in Title Case too, count as well as ids with digits or underscores. A1 therefore checks with an id scan, not a pattern: for each scenario, list its NPC ids, and for every ink line on the phone channel whose prefix (text before the first colon) equals one of them, ignoring case, record the file and line. A scan of the phone contacts' inks at this commit finds two kinds of hit. `Narrator:` lines match the hidden `narrator` record that m02, m05, m07, m09 and `lab_tesseract_trials` register (for example `scenarios/m09_digital_archaeology/scenario.json.erb:504`; `m09_phone_gary.ink:18`). `Priya:` and `Dom:` in `scenarios/test_dm_social/ink/priya_dm.ink` and `dom_dm.ink` are each contact's own id. So the id match never matches `narrator` or `player`, and runs only on lines already classed as NPC lines (narration is split off first, `phone-chat-speaker.js:21-38`); the contact's own id is already excluded. With those two rules no phone key moves today. Person-chat inks also have id-equal prefixes (`scenarios/lab_social_engineering/ink/tomasz.ink`, `m04_npc_voltage.ink`), but the phone rule doesn't touch them. The A1 key baseline proves it over every scenario that has a phone contact (5.2).

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

Every existing mapping field still applies: `disableClose` (a forced ring: no Decline, auto-answers), `resume`, `callLabel`, `onceOnly`, `cooldown`, `delayMs`, `condition`.

Side effects fire at ring time. A `ring` mapping's `setGlobal`, `completeTask` and the rest run when the call is offered (1.7), even if it is declined. An effect that should wait for the call to be taken goes on a separate mapping on `phone_call_answered:<npcId>`, or in the call's ink.

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

**The `#place_call` tag.** In the contact's text thread, `#place_call` or `#place_call:<knot>` on a line or choice closes the thread and dials, exactly as the header button does (2.5). It is the way a hub choice becomes a call:

```ink
+ {attack_prevented and not mission_complete} [I'm done here. Bring me in.]
    #place_call:extract_call
    -> support_hub
```

The choice prints no NPC line; the call's knot speaks first. The choice diverts back to the hub as any text choice does, so if the call rings out the thread is where it was. `<knot>` must be one of the contact's `call` entries (validator error otherwise), so the extractor and the validator know it is a call.

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
| **New** `ring` on a mapping or `timedConversation` | — | rings; answer, hold, decline, miss, callback or voicemail |
| **New** `call` on a contact (one entry or a list) | — | call button in the thread; dialling; connects or no answer |
| **New** `#place_call` tag in a text thread | — | the choice or line dials the contact |
| **New** id prefix on a phone line (`agent_0x99: …`) | read as the contact | that character speaks; the display name shows |

### 3.4 Events the engine emits

All carry `{ npcId, knot }` and are usable as `eventPattern`s:

- `phone_call_answered:<npcId>` (also on auto-answer and on a callback connecting);
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

## 4. Part A: server, TTS extraction, validator

### 4.1 Phone state on the server

`app/models/break_escape/game.rb`:

- `PHONE_MESSAGE_KEYS` (`:3302`) gains `callEvent`. In the message `select` (`:3336-3342`): `callEvent` must be one of `missed incoming outgoing no_answer voicemail`, else dropped.
- `sanitize_phone_state_entry` (`:3330`) keeps `pendingCall` only as a Hash with: `knot` and `voicemailKnot` Strings ≤ 200 matching `/\A[A-Za-z0-9_.]+\z/`; `state` in `queued ringing held connected missed`; `disableClose`, `resume`, `withheld` booleans; `callLabel` String ≤ 100 with control characters stripped (the engine draws it with `textContent`); `onMissed` in `callback voicemail`. Anything else is dropped; a `pendingCall` with no valid `knot` is dropped whole. An entry with only `pendingCall` is kept (change the `return nil` at `:3374`).
- Client mirror: `NPCManager.PHONE_MESSAGE_FIELDS` (`npc-manager.js:145`) gains `callEvent`; `_phoneStateEntry` writes `pendingCall` and keeps a `pendingCall`-only entry (2.7); the restore path reads it into `npc.pendingCall` and hands it to the ringer after `game_loaded`.
- Rails test `test/models/break_escape/game_phone_calls_state_test.rb`: accepted shapes; hostile input (HTML in `callLabel`, a 10 kB knot, a nested object in `pendingCall`, an unknown `state` or `callEvent`, a `type` over 20 characters) dropped or clipped; the 512 kB cap still refuses; a `pendingCall`-only entry survives.

### 4.2 TTS extraction lists exactly the callable lines

`app/services/break_escape/tts_line_extractor.rb`:

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
- Fires on an NPC line or narration matching any of: `\b(you|she|he)\s+picked up\b`, `\bon (this|the|my|her|his) line\b`, `\bget off (her|my|his) line\b`, `\bhang(s|ing)? up\b`, `\bthe line (drops|goes dead|is dead)\b`, `\byour handset (rings|lights)\b`, `\brings out\b`, `\bcaller id\b`.
- Does not fire on "ring <Name> back", "call me", "I'll ring", or inside a choice's bracketed text.
- Suppressed per knot by a comment line `// lint: call-knot` directly under the `=== knot ===` line. Every call knot a migration writes carries it, so the rule then flags only text knots.
- Fixture list of expected hits today: m05 Recruiter `hangs_up`, `end_contact`, `never_talked_terms`, `idle`, `recruiter_deal_taken`, `recruiter_deal_refused`, `recruiter_final_statement`; m07 Architect `taunt_t30`, `t30_close`, `taunt_t20`, `taunt_t5`, `taunt_t1`, `t1_close`; m09 Nightshade, Torres and Gary `start` and `call`. The migrations clear them.
- `dialoguelint.mjs:798`: stop skipping delivery checks on the phone channel for knots marked `// lint: call-knot`.

## 5. Part A: tests and proofs

### 5.1 Node unit tests (`test/js/`, run with `bin/test-js`)

New engine modules have no imports (or only `phone-chat-speaker.js`), so tests copy them into a temp dir as `test/js/finale-voiced-calls.test.mjs:24-26` does. **Every new static import added to an engine module must be added to each test harness copy list that copies that module** (grep `test/js` for the module's file name), or node tests fail with ERR_MODULE_NOT_FOUND.

| File | Covers |
|---|---|
| `phone-ringer.test.mjs` | one named test per row of the 2.3 table (rows 1–31), with a fake clock, fake framework, fake popups and fake npcManager; `ringBlocked()` and `openBlocked()` term by term; the second `openBlocked()` check before opening (rows 13, 19); hold time across a requeue (row 15); events and their data; trigger persistence on decline, miss, supersede, drop, ring-off and reload |
| `phone-ring-config.test.mjs` | `normaliseRing(mapping)`: `true` and object forms, defaults, bad values dropped, `withheld` without voicemail only when forced; `normaliseCall(npc)`: one entry or a list, `button` default, bad entries dropped |
| `phone-ring-layer.test.mjs` | the layer is outside `#npc-bark-container`; `phone-ring.css` z-index 2300; delayed `ring` mappings fire with a lockpick open and other delayed mappings still wait (`_scheduleDelayedMapping`); no `endMinigame` call and no `minigame_failed` on Answer over a minigame; the start, end and popup hooks call the ringer; Answer over a popup closes it with its own function and reopens it with the saved `src` after the call |
| `phone-outgoing-call.test.mjs` | `when` with the mapping grammar; `no_answer` and `hidden`; entry order and `button: false`; `#place_call` with and without a knot, and its divert back to the hub when the call rings out; pending callback wins over every entry; row 31; no button for `callId` contacts or under `disableClose`; one `conversation_closed` per call; after End mid-choice the saved story is on the home knot |
| `phone-call-log.test.mjs` | rows only on new paths, never for pretext calls or legacy voiced mappings; row texts; `withheld` texts; preview and unread for a missed call; rows never voiced or barked |
| `phone-call-persistence.test.mjs` | `pendingCall` export and restore for every state; a first call from a contact with no history survives `_phoneStateEntry`; `callEvent` survives; a pending callback survives as `state: "missed"`; reload rules of row 27, trigger persisted |
| `phone-call-delivery.test.mjs` | the note reaches `TTSManager.play` options for a voiced call line; two lines and one tag in a step: the note goes to the last; no note → exactly `play(speakerId, text)` |
| `phone-speaker-ids.test.mjs` | `otherSpeaker` with an id prefix returns the display name and id; display names still win; the contact's own id is not "other"; `Narrator:` with a registered `narrator` record stays narration; Dev's and Ruth's lines unchanged |
| `phone-call-knots-parity.test.mjs` | `callStartKnots` includes every `call` entry's knot (`button: false` too) and `ring` targets, not voicemail knots; unchanged for every old form in 3.3 (fixtures: Dev, an m09 HaX mapping, m10 Victoria, m02 Ghost video) |
| `dialoguelint-call-in-text.test.mjs` | the rule's hits and non-hits (Ruth's "Ring Dev back" doesn't fire), the `// lint: call-knot` suppress |

Existing tests that must still pass: `phone-voiced-contact`, `social-lab-dev-call`, `social-lab-ruth-phone-keys`, `social-lab-ruth-keys`, `social-pretext-*`, `phone-call-mode`, `phone-call-queue`, `finale-voiced-calls` (A1 updates `:255`, `:257`, `:261`), `finale-forced-call-and-closing-card`, `phone-reopen-and-persistence`, `social-video-call-label`. Full suite under `flock /tmp/be-test-suite.lock bin/test-js -j 3` at the end of each slice.

### 5.2 Rails tests

- `test/models/break_escape/game_phone_calls_state_test.rb` (4.1).
- `test/unit/break_escape/tts_line_extractor_calls_test.rb`: a fixture scenario in `test/fixtures/files/` with a `call` contact (a list with a `button: false` entry), a `ring` mapping, a voicemail knot and a home knot with lines: the extractor lists exactly the call and voicemail lines, never the home knot, never narration; delivery notes are carried for voiced call lines; an `agent_0x99:` prefix resolves by id.
- `test/unit/break_escape/tts_mission_lines_test.rb:103` loops all missions; it must keep passing and picks up migrated missions by itself.
- Key identity (A0): for every scenario with at least one `npcType: "phone"` record (A0 lists them; it includes `lab_social_engineering`, m01–m10, sis01–03 and `lab_tesseract_trials`), dump `TtsLineExtractor.new(name, data).keys.sort` to `docs/agents/phone_calls/keys_baseline/<scenario>.txt` and compare after each engine slice. Allowed difference: the five A1 delivery re-keys in m09 and m10.
- Run under `flock /tmp/be-test-suite.lock` with `BUNDLE_PATH` set (brief).

### 5.3 Focused test scenario: `scenarios/test_phone_calls/`

Add it to `scenarios/TEST_SCENARIOS_README.md`. One small office room, the player's phone, a door with a lockpick lock and a keypad (non-conversation minigames to ring over), a person NPC to talk to (a conversation to queue behind), a lab-sheet workstation and a CyberChef workstation (the two popups), a hostile NPC that can be woken with a lever (damage for rows 16, 22 and 26), and these contacts (all voiced, short ink, no printed variables):

| Contact | Shows (2.3 rows) |
|---|---|
| `caller_basic` | `ring: true` on `room_entered` after 3 s: banner with the phone closed, answer, call, row, back to the world (1, 9, 25) |
| `caller_decline` | `ring` with callback: decline emits the event and a `phone_call_declined` mapping sets a global (20); let a second offer time out (21). A4 adds: missed row, red preview. A6 adds: call button, calling back connects at once and the call reads the global; a new offer while the callback is pending clears it when it rings (7) |
| `caller_voicemail` | `ring` with `withheld` and `onMissed: "voicemail"`: "No caller ID" banner; decline leaves a voice message whose knot sets an ink VAR that the next thread open reads (20, A6); a terminal-theme twin `caller_terminal` does the same in the terminal look and its voicemail bubble plays |
| `caller_forced` | `ring` + `disableClose`: no Decline; auto-answers; a hit closes it and it rings again with `resume`; auto-answer waits while the player is being hit (22, 26) |
| `caller_hold` | `delayMs` `ring` set off by the keypad's `door_unlock_attempt`: rings over the keypad, Answer → hold pill, closing the keypad opens the call (12, 13). Variants: the keypad's success also fires a legacy scripted call through a `minigame_completed` mapping, which opens first while the held call waits and then rings (15); the woken guard's hit closes the keypad while the call is held, and the call opens only after `HIT_QUIET_MS` with no hit (16); the call is held over a note opened from a container, and closing the note reopens the container (S12), so the call stays held until the container closes (14); left on hold for `HOLD_MAX_MS`, it rings off with the toast and a callback (18) |
| `caller_queue` | rings while the person-chat is open: waits, then rings; a second caller rings after the first ends; a legacy forced call opening over a ringing call sends it back to the queue; a ring answered while the player is knocked out goes back to the queue (2, 6, 8, 19, 23, 24) |
| `caller_replace` | two `ring` mappings on one contact, second knot newer: only the newer rings (3, 4) |
| `caller_thread` | rings while its own thread is open, while another contact's thread is open, and while the contact list is open: Answer closes the phone with no `conversation_closed` for the open thread, and the phone reopens there after the call; a desk phone object open at the time shows the banner instead (10) |
| `caller_popup` | rings while the CyberChef popup is open, and again while the lab-sheet popup is open: Answer hides the popup, the call opens, and the popup returns afterwards with its recipe, input or scroll position kept (11) |
| `desk_contact` | `call` list: a button entry always available and a `button: false` entry dialled by a hub choice with `#place_call:<knot>`; dialling; ink-local visit counts carry over a second call; End mid-choice then open the thread → home knot; a queued ring on the same knot is dropped when the player rings first (31) |
| `away_contact` | `call` with `when` false then true (a lever sets the global): no answer, then connects; a second contact with `unavailable: "hidden"` has no button until the global is set |
| `timed_caller` | `timedConversation` with `ring` and `opening: true` at 2 s: the Mission Brief popup waits; decline (30). A4 adds: reload during the ring → missed, not rescheduled (27) |
| `texter` | plain texts and a plain silent thread (unchanged path) |
| `legacy_voiced` | a legacy voiced mapping call (no `ring`): opens at once and closes the open minigame, as today; no rows |

Validator clean (0 errors).

### 5.4 Live browser proofs (port 3023, headless)

Driver: `.claude/skills/playtest-scenario/scripts/playtest-session.js`; games via `bundle exec rails runner tools/playtest/new-game.rb <scenario>`. Each proof saves small screenshots and the console log under `docs/agents/phone_calls/proofs/<slice>/` and lists the `/tts` requests (text, npc_id, delivery).

**Routes to deep beats.** The playtest bridge (`window.__test`, see `.claude/skills/playtest-scenario/SKILL.md`) sets the preconditions; the triggering event then happens for real (walk through the real door, open the real object, close the real conversation). Setting the trigger global itself through the bridge counts as real only where the mapping listens to `global_variable_changed` and the global's own setter is a VM flag submission. A0 writes each route to `docs/agents/phone_calls/proofs/ROUTES.md` and every later proof follows it.

| Beat | Mapping | Route |
|---|---|---|
| lab SE Dev call | `callLaunch` | play from the start: open the desk phone, fill the pretext card, place Dev's call; finish; open the phone and check Ruth's and Dev's threads, then reload and check both again |
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
- At rows 20, 21 and 25 A2a does only this: emit the event, persist the trigger, clear the offer. It adds no thread row (A4) and no callback or voicemail (A6). Row 18 emits the event and shows the toast; its callback comes with A6.
- `js/minigames/phone-chat/phone-ring-config.js`: `normaliseRing`, `normaliseCall`.
- Accept: `phone-ringer.test.mjs` for those rows, `phone-ring-config.test.mjs`. An Opus reviewer checks the module against 2.2 and 2.3 before A2b starts.

### A2b. Wiring and the banner, phone closed

- `js/minigames/phone-chat/phone-ringer-dom.js`: the layer and the banner (2.4), `css/phone-ring.css` and its `<link>`, the ringtone placeholder, the pause checks, `ringBlocked()` and `openBlocked()` on the live window, created after `js/main.js:137`. Until A3, an open phone-chat that isn't a call counts as a non-conversation minigame (row 10).
- `npc-manager.js`: in the phone-chat branch (`:1495-1527`) and the timed delivery (`:2059-2140`), when the config has `ring`, call `window.phoneRinger.offer({...})` instead of `_queueScriptedPhoneCall`. Copy `ring` onto the mapping config in the mapping builder (`:861-890`) and onto the scheduled timed conversation (`:352-369`, `:1861-1886`). `_scheduleDelayedMapping` (`:643-646`) skips the minigame wait for `ring` (2.9). `hasPendingOpeningConversation` (`:1938-1946`) reads the ringer (row 30).
- `minigame-manager.js`: the start hook after `:183` and the end hook after `:300` (2.9). The `game_loaded` listener.
- `sound-manager.js:205`: `phone_ringtone` in the notifications match.
- Accept: `phone-ring-layer.test.mjs` (layer, z-index, delayed-mapping bypass, start and end hooks); `test_phone_calls` built with `caller_basic`, `caller_decline` (decline and timeout only), `caller_queue`, `caller_replace`, `timed_caller` (without the reload), `legacy_voiced`, `texter`; a live proof of each; the regression set unchanged.

### A2c. Hold, popups, damage and the ending

- `phone-ringer-dom.js`: the hold pill and the status line over a minigame (2.4), the popup put-aside and restore (row 11), the release checks (rows 13–16), the hold limit (row 18), forced auto-answer and the damage re-ring (rows 22, 26).
- `js/utils/crypto-workstation.js` and `js/utils/lab-workstation.js`: the popup hook (2.9).
- `player-damage-interrupt.js`: record the time of every hit (`lastPlayerHitAt`) and export `playerHitWithin(ms)` for `openBlocked()` and rows 16, 22 and 26.
- Ending hooks for row 28: `js/systems/ending-check.js` where "End the mission now" is confirmed, and the credits start (the music event carrying `credits`, `ending-check.js:14`), both call `window.phoneRinger?.close()`.
- Accept: the A2c rows of `phone-ringer.test.mjs` pass against the live adapter as well as the fakes; `caller_hold` (all its variants), `caller_forced`, `caller_popup` proofs; screenshots of the banner over a lockpick, a keypad, a terminal, a container, the CyberChef popup and the lab-sheet popup, and of the hold pill over the keypad; the regression set unchanged.

### A3. Ringing inside an open phone

- `phone-chat-ui.js`: `showIncomingCall` / `hideIncomingCall`. The minigame registers with the ringer in `init` when it is the player's phone, and unregisters in `cleanup`.
- Row 10: `_closingForCall`, and `cleanup` (`phone-chat-minigame.js:1630-1636`) skips `_emitConversationClosed` for the thread that was open when it is set; the phone reopens on its saved screen after the call.
- Accept: `caller_thread` proof in all four cases (own thread, another thread, contact list, desk phone object); after the call the phone reopens where it was, and closing it then emits `conversation_closed` for that thread once.

### A4. Thread rows and phone state

- `PHONE_MESSAGE_FIELDS`, `_phoneStateEntry` (`:2275` change), the restore path, server whitelist (4.1).
- `phone-chat-ui.js`: render `type: 'call'` rows; preview; unread. The rows of rows 20, 21 and 25.
- `pendingCall` save and restore; reload rules (row 27), trigger persisted.
- Accept: `phone-call-log.test.mjs`, `phone-call-persistence.test.mjs`, the Rails model test; reload proofs in `test_phone_calls` (ringing, held, connected, forced, and `timed_caller` reloaded during its ring); the lab's Dev thread after a pretext call has no rows, and both lab threads survive a reload unchanged.

### A5. Outgoing calls and the post-call thread

- `call` entries (3.2), one or a list. The header call button; `#place_call` and `#place_call:<knot>` (a tag handler in the phone's line-tag path, run after the step's lines); dialling, connect, no answer; ring-back tone through the sound manager's volumes; "Call ended"; return to the phone; terminal-look endings; story position reset after a call (2.5); row 31.
- `callStartKnots` (client) and `call_start_knots` (server) add every entry's knot (4.2).
- Accept: `phone-outgoing-call.test.mjs`, `phone-call-knots-parity.test.mjs`, the extractor Rails test; `desk_contact`, `away_contact` proofs, including End mid-choice then reopening the thread, and a `#place_call` choice whose call rings out; a `#place_call` call whose knot carries `#ending_check`, answered both ways ("End the mission now" and "Keep going"), ends cleanly; key identity for every baseline; lab SE proof screenshots of the phone contact list and the Friendface DM list unchanged.

### A6. Callback and voicemail

- `onMissed` (2.6). Callback button on a contact with a pending callback; row 7; the callback half of row 18. Voicemail knot run silently into the thread in the contact's saved story (2.6) with `voice:` bubbles and a "New voicemail" toast; `withheld` texts.
- Server: voicemail lines in the batch (4.2).
- Accept: tests for both `onMissed` values and row 7; `caller_decline` callback proof (A6 part); `caller_voicemail` and `caller_terminal` proofs, including playing each voicemail (a `/tts` request for its text under the contact's id) and the VAR the voicemail knot set.

### A7. Validator, dialoguelint, docs

- Validator check (4.3) with tests; dialoguelint rule (4.4).
- Docs: README_scenario_design.md "Voiced phone calls" (the new forms, 3.1–3.5, the events, the hold behaviour and its `minigame_failed` caveat, the popup behaviour, the "end with `#exit_conversation` and `-> DONE`" rule, `#place_call`, the "Call me" rule), "NPC Event Mappings" table (`ring`), "NPC Timed Conversations" table (`ring`), "Phone NPCs" (the `call` entries; fix the stale rule "conversationMode other than phone-chat is ignored on phone NPCs", which `video-call` contradicts); README_ink_best_practices.md: how to write a call knot and a voicemail knot, `#place_call` on a hub choice, the "Call me" rule, and id prefixes for same-named records (3.5). Log for the user that the `tts-audio` skill's extraction notes need a line on `call`, `ring`, `#place_call` and voicemail knots (don't edit `.claude/skills/*`).
- Accept: validator clean on all in-scope scenarios apart from the expected dialoguelint warnings (4.4) and the expected "call me" warnings that Part B clears (7.3); `test_phone_calls` clean; a full regression run.

### A8. The ringtone asset

- Find a CC0 mobile ringtone (Freesound), 2–4 s loopable, trim with ffmpeg, add as `assets/sounds/phone_ringtone.mp3`, credit it in `docs/achitechture/OFFICE_LIFE_SOUND_CREDITS.md`, load it in `sound-manager.js` beside `phone_vibrate`, and swap it into the banner. Can run any time after A2b.
- Accept: proof with the sound logged; licence recorded.

## 7. Part B: mission migration inventory

Sources: `docs/agents/phone_calls/INVENTORY_PHONE_CONTACTS.txt`, `INVENTORY_PERSON_REMOTE_HINTS.txt`, `PHONE_NPC_KNOTS_FULL.txt`, `AUDIT_HAIKU_2026-11-11.md`, and the scenario and ink files cited in each row. Line counts are rough spoken NPC lines (narration and player lines excluded). Each slice reports the exact list from the extractor's key diff before voicing.

### 7.1 The mix, by kind of game

- **m01–m10 (spy thriller).** HaX texts while the agent is inside (silent, stealthy) stay texts. A few beats per mission become calls that ring: an outside voice cutting in (Nightshade, Torres, Gary, the Recruiter, the Architect) or HaX at a moment that carries weight. Some contacts can be rung (Vance, Patricia, the Recruiter's number, HaX when she asks you to call). The bring-in, the one beat every mission shares, is the player's call to HaX wherever a mission has one (m01, m03–m07): "Call me and I'll bring you in" means a real call. Video calls stay for faces that matter (Ghost). In-person HaX scenes sound in person. Every mission in m01–m08 gets at least one ringing or placed call, and a text says "call me" only where the player can (7.3).
- **sis01–03 (serious games).** Education first, no spy framing. Texts and the one recorded message stay.
- **Labs.** `lab_social_engineering` is frozen. The other labs keep what they have.

### 7.2 Inventory and targets

"Sheet" is the walkthrough lab sheet under `HacktivityLabSheets/_labs/`; "none" means nothing on it describes the beat.

| Scenario | Contact / speaker | Today | Target | Files, knots | Ink | Lines | Engine | Sheet |
|---|---|---|---|---|---|---|---|---|
| m01 | `agent_0x99` HaX | texts + hub; home knot `first_call` (silent router, `scenarios/m01_first_contact/ink/m01_phone_agent0x99.ink:93-95`); first contact is a timed text at 3 s (`scenario.json.erb:666-670`) | stays text, plus **one short incoming call** the first time the player enters `main_office_area`: HaX checks the line, says she'll text from here because calls carry inside, and tells the player to message her when stuck. It teaches Answer and Decline where nothing is at stake, and gives the texts a reason. `onMissed: "callback"`; a `phone_call_declined` / `phone_call_missed` mapping sends a one-line text ("Texting from here, then."). | new knot `first_ring` in `m01_phone_agent0x99.ink`, ending `#exit_conversation` (never `-> support_hub`); a mapping on `agent_0x99` (`scenario.json.erb:620`) | new knot only; no existing line changes | ~4 new; 0 re-key | A2b, A6 | `safetynet/m01_first_contact.md:72-80`: one sentence, "HaX rings you once you're in the office; tap the green button to answer." |
| m01 | `agent_0x99` debrief | hub choice "[Operation Shatter resolved — I'm ready for debrief]" (`m01_phone_agent0x99.ink:110-111`) → `closing_debrief` (`:942-958`), a text with `#ending_check`; eight texts say "call me for debrief" (7.3) | **placed call**: `call: [{ knot: "closing_debrief", button: false }]`; the hub choice keeps its text and condition and gains `#place_call:closing_debrief`. The eight texts are then true as written. | `closing_debrief` speaks first (it already does); it ends `#exit_conversation` / `-> END`, which already fits 3.5; mark it `// lint: call-knot` | light | ~2 new (its two variant lines) | A5 | `safetynet/m01_first_contact.md:436`: "then call Agent HaX and choose to be debriefed" stays true; add "she picks up; choose **[On my way]**" |
| m01 | `reception_desk_phone`, `patricia_desk_phone` | phone objects with `voice` | stay | — | no | 0 | — | none |
| m02 | `agent_0x99` HaX; `ghost` device; `press_terminal_system` | texts; Ghost texts + 2 voiced video calls | unchanged | — | no | 0 | — | none |
| m03 | `agent_0x99` `m2_revelation_call` | text "Got the distcc logs. Call me when you're done at the drop-site." that opens the thread at the call knot (`scenarios/m03_ghost_in_the_machine/scenario.json.erb:1012-1018`); hub choice "You wanted to talk about the distcc logs." (`m03_phone_agent0x99.ink:116-117`) | **outgoing call**: the text stays (no `targetKnot`); HaX's `call` list gets `{ knot: "m2_revelation_call", when: "globalVars.flag_distcc_submitted && !globalVars.revelation_heard", unavailable: "hidden" }` first, so the button shows only while she is waiting. The hub choice at `:116-117` stays and gains `#place_call:m2_revelation_call`. If the player hasn't rung within two minutes, she rings: a `ring` mapping on `global_variable_changed:flag_distcc_submitted`, `delayMs: 120000`, condition `value === true && !globalVars.revelation_heard`, `targetKnot: "m2_revelation_call"`, `onMissed: "callback"`. A pending `delayMs` is lost on reload (1.2), so a twin mapping on `game_loaded` with condition `globalVars.flag_distcc_submitted && !globalVars.revelation_heard`, the same `delayMs` and target, re-arms it. The hold rule means it never cuts into the drop-site; if the player rings first, row 31 drops the ring. | `m03_phone_agent0x99.ink:462-517`: the guard `{ revelation_heard: -> hub }` (`-> hub` at `:465`) becomes `#exit_conversation` and `-> DONE`; `m2_revelation_end`'s `-> hub` (`:517`) becomes `#exit_conversation` on its last line and `-> DONE`; no knot of the call diverts to `hub` or `start`; remove `{player_name()}` at `:467` and `:493`; mark the call knots `// lint: call-knot` | light | ~18 new (call and replies) | A2b, A5, A6 | `safetynet/m03_ghost_in_the_machine.md:84-86`: one sentence, "When HaX texts 'Call me', ring her: tap the call button in her thread, or choose the topic." |
| m03 | `agent_0x99` bring-in | hub choice "[I'm done in here. Bring me in.]" (`m03_phone_agent0x99.ink:112-113`) → `extract_offer` (`:595`) and `extract_choices`; five texts say "call me … bring you in" (7.3) | **placed call**: HaX's `call` list gains `{ knot: "extract_call", button: false }`; the hub choice gains `#place_call:extract_call`. `extract_call` is `extract_offer` and its choices moved into call knots. | `extract_offer` to the end of the extract flow: every `-> hub` / `-> support_hub` becomes `#exit_conversation` and `-> DONE` ("Not yet" included) | light | ~6 new | A5 | `m03_ghost_in_the_machine.md:456` stays true ("call HaX to be brought in") |
| m03 | `agent_0x99` reaction texts (`on_victoria_computer_accessed`, `on_exploit_catalog_found`, `on_architect_directive_found`) | texts "Call me when you've had a look" and the like that open the thread at the knot (7.3) | stay texts; the texts are reworded ("Message me …") | 4 `message` strings in the ERB | no | 0 | — | none |
| m03 | other HaX knots, `on_victoria_ko_card` | texts / KO card | stay | — | no | 0 | — | none |
| m04 | `robert_vance_phone` Vance | timed text "Call me for the engineering side" + text thread; `start` routes to `vance_phone_support_start` → `support_hub` (`scenarios/m04_critical_failure/ink/m04_phone_robert_vance.ink:59-100`) | **callable contact**: `call: { knot: "support_call", when: "globalVars.vance_is_ally && !globalVars.robert_vance_ko", unavailable: "no_answer" }`, `callLabel: "Albion ops desk"`. `start` becomes a text stub with no NPC line and one exit choice; only `support_call` reaches the hub. `vance_not_yet_ally` and `vance_no_answer` go (the engine rings out). `vance_support_calls += 1` moves into `support_call`. | `scenarios/m04_critical_failure/scenario.json.erb` Vance record; the ink above, `support_hub` to `support_call_end` (`:102-272`) | yes: split the call from the home knot; the dial readings stay speech | ~65 new | A5 | `safetynet/m04_critical_failure.md:82`: "a line to Robert Vance" → "and later Robert Vance, whom you can ring from his thread" |
| m04 | `agent_0x99` `on_anomaly_confirmed` | text "Sixty-one on that dial? Call me when you're clear of it." with `targetKnot` (`scenarios/m04_critical_failure/scenario.json.erb:898`); the knot relays Nightshade's read (`m04_phone_agent0x99.ink:494-525`) | **incoming call**: that mapping drops `sendTimedMessage` and gains `conversationMode: "phone-chat"`, `targetKnot: "on_anomaly_confirmed"`, `ring: { onMissed: "callback" }`, `delayMs: 6000`, keeping its event and condition; a `phone_call_declined` / `phone_call_missed` mapping sends a text, "Nightshade's got your reading. Ring me back." She has news, so she rings; the m04 sheet line becomes true. The writer checks every other mapping that opens or texts this knot and the hub for a choice that reaches it; any such choice gains `#place_call:on_anomaly_confirmed` with a `button: false` entry. | `on_anomaly_confirmed_choices` (`:502-525`): each `-> support_hub` after `#exit_conversation` becomes `-> DONE` | light | ~8 new | A2b, A5, A6 | `m04_critical_failure.md:281` ("Take the call from Agent HaX about the reading") becomes true; no edit |
| m04 | `agent_0x99` bring-in | hub choice "[I'm done here. Bring me in.]" (`m04_phone_agent0x99.ink:142-143`) → `extract_offer` (`:405-470`, with `extract_blocked`); the bring-in text (`scenario.json.erb:1080`) | **placed call**: `call: [{ knot: "extract_call", button: false }]` (renamed from `extract_offer`); the hub choice gains `#place_call:extract_call`. "Lose her or put her down, then call" now reads right inside a call. | the extract flow: `[Understood.] -> support_hub` (`:436`), `[Not yet…] -> support_hub` (`:455`) and `extract_go`'s `-> support_hub` (`:467`) become `#exit_conversation` and `-> DONE` | light | ~12 new | A5 | `m04_critical_failure.md:452`: add "HaX picks up; choose **[Bring me in.]**"; `:509` stays true |
| m04 | `agent_0x99` | texts, KO card | stay | — | no | 0 | — | none |
| m05 | `recruiter` first contact | text "TalentStack Executive Recruiting…" on `conversation_closed` of three sources (`scenarios/m05_insider_trading/scenario.json.erb:1522-1531`); her `start` knot reads like a call (`m05_phone_recruiter.ink:35-75`) | **incoming call** on the same three events and condition: `ring: { onMissed: "callback" }`, `targetKnot: "first_call"`, `callLabel: "TalentStack Executive Recruiting"`. The mapping keeps `setGlobal: { recruiter_texted: true }` (it guards the three rows). A `phone_call_declined` / `phone_call_missed` mapping sends the old text as her follow-up. | new `first_call` knot with the body of `start`; `start` becomes a silent router to the right resting knot; drop the narrated "Caller ID" line | yes | ~45 new | A2b, A4, A6 | `safetynet/m05_insider_trading.md` Recruiter section, if it says she texts |
| m05 | `recruiter` ring-back | `idle` choices "[Ring the TalentStack number back.]" / "It rings out." (`:412-425`) | **callable**: `call: { knot: "return_contact", when: "!globalVars.recruiter_line_dead", unavailable: "no_answer" }` | `never_talked_terms`, `hangs_up`, `end_contact`, `idle` (`:380-425`), `return_contact` (`:268`) | yes: `idle` loses the ring choices; "She hangs up first." / "The line goes dead." become the call's end | ~15 new | A5 | same |
| m05 | `patricia_phone` Patricia | text "Ring me if anything changes" (`:1552`) + thread with "[(Ring her. It rings out.)]" | text intro stays; **callable**: `call: { knot: "phone_call", when: "globalVars.patricia_phone_available && !globalVars.patricia_ko", unavailable: "no_answer" }`. `start` becomes a text stub; only `phone_call` reaches `hub` and the `phone_*` knots. | `m05_phone_patricia.ink:78-360` | yes: split call from home; fake ring choices go | ~50 new | A5 | `m05_insider_trading.md:80, :213`: "can be rung from your phone" → "tap the call button in her thread" |
| m05 | `agent_0x99_handler` `topic_architect` | text "Root flag in. … Call me. You need to hear this." (`scenarios/m05_insider_trading/scenario.json.erb:1101`); hub choice "[The Architect signed off on the casualty projection.]" (`m05_phone_agent_0x99.ink:214`) → `topic_architect` (`:321-353`) | **incoming call**: the mapping keeps its event, condition and `setGlobal`, drops `sendTimedMessage`, and gains `conversationMode: "phone-chat"`, `targetKnot: "topic_architect"`, `ring: { onMissed: "callback" }`, `delayMs: 1500`; on decline or miss a text, "Root flag's in. Ring me back. You need to hear this." The hub choice gains `#place_call:topic_architect` with a `{ knot: "topic_architect", button: false }` entry; if the player rings first, row 31 drops the ring. | `topic_architect_choices`: each `-> support_hub` becomes `#exit_conversation` and `-> DONE` | light | ~8 new | A2b, A5, A6 | none |
| m05 | `agent_0x99_handler` bring-in | hub choice "[I'm done here. Bring me in.]" (`m05_phone_agent_0x99.ink:181-182`) → `extract_offer` (`:947-966`, with its "Not yet" guard); two texts (`scenario.json.erb:1379, 1386`) | **placed call**: `{ knot: "extract_call", button: false }`; the hub choice gains `#place_call:extract_call` | the extract flow: the guard's and the choices' `-> support_hub` become `#exit_conversation` and `-> DONE` | light | ~9 new | A5 | `m05_insider_trading.md:572`: "Ring Agent HaX and choose **[I'm done here. Bring me in.]**. He names …" → "Open Agent HaX's thread and choose **[I'm done here. Bring me in.]**; the phone rings her. She names …"; `:562`, `:593` stay true |
| m05 | `agent_0x99_handler` other texts | texts at `scenario.json.erb:1064, 1070, 1457, 1484` that say "call me" for a text topic (7.3) | reworded ("Message me …") | 4 `message` strings | no | 0 | — | none |
| m05 | `agent_0x99_handler` | texts, KO relays | stay | — | no | 0 | — | none |
| m06 | `agent_0x99_handler` fund | texts "$12.8M in the wallet … Call me about it." (`scenarios/m06_follow_the_money/scenario.json.erb:1246, 1253`); hub choice "[I've found The Architect's Fund.]" (`m06_phone_agent_0x99.ink:172-174`) → `on_architects_fund_discovered` and `on_fund_choices` (`:431`) | **placed call** (M10): `{ knot: "on_architects_fund_discovered", button: false }`; the hub choice keeps `~ reacted_fund = true` and gains `#place_call:on_architects_fund_discovered`. The two texts are then true as written. | the fund knots: every divert to the hub becomes `#exit_conversation` and `-> DONE` | light | ~8 new | A5 | `safetynet/m06_follow_the_money.md` only if it quotes the choice |
| m06 | `agent_0x99_handler` bring-in | hub choice "[I'm done here. Bring me in.]" (`m06_phone_agent_0x99.ink:161-162`) → `extract_offer` (`:595`) | **placed call**: `{ knot: "extract_call", button: false }`; the hub choice gains `#place_call:extract_call` | the extract flow, as m04 | light | ~6 new | A5 | `m06_follow_the_money.md:504`: add "HaX picks up; choose **[Bring me in.]**"; `:517` stays true |
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
| m01 | `:925` | "That's the full picture … then call me for debrief." | stays | debrief call |
| m01 | `:1019` | "Abort confirmed. … Call me when you're ready to debrief." | stays | debrief call |
| m01 | `:1028` | "…I'm seeing reports. … The attack went through. Call me." | stays | debrief call |
| m01 | `:1064`, `:1073`, `:1082` | "All technical evidence secured. … Call me when you're ready for debrief." | stays (×3) | debrief call |
| m01 | `:1091` | "Derek is contained … then call me for debrief." | stays | debrief call |
| m01 | `:1100` | "Derek is contained. You still need to access the ENTROPY encrypted archive … then call me." | stays | debrief call |
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

The writer of each slice also greps that mission's phone inks and barks for `call me`, `ring me` and `call in` aimed at the player, and applies the same rule. The validator warning (4.3) catches any text left behind.

### 7.4 Audio, rough

| Change | New | Re-key |
|---|---|---|
| A1 delivery notes (m09 ×4, m10 ×1) | 0 | 5 |
| m01 first ring | ~4 | 0 |
| m03 revelation call | ~18 | 0 |
| m04 Vance | ~65 | 0 |
| m05 Recruiter (first call + ring-back) | ~60 | 0 |
| m05 Patricia | ~50 | 0 |
| m06 fund call, m08 door audit call | ~18 | 0 |
| m07 taunts and voicemails, sign-off | ~80 | 0 |
| m09 Nightshade, Torres, Gary | ~22 | 0 |
| Bring-in calls (m01 ~2, m03 ~6, m04 ~12, m05 ~9, m06 ~6, m07 ~2) | ~37 | 0 |
| HaX rings: m04 dial, m05 root flag | ~16 | 0 |
| m09 `hax_voice` briefing style | 0 | ~59 |
| m10 `hax_post` and `hearing` own lines | 0 | from the key diff (their own files only) |
| lab_physical_pentest one line | 0 | 1 |
| "Call me" rewords (7.3) | 0 (texts) | 0 |
| **Total** | **~370** | **~65 plus m10's own-line count** |

Most of the new bring-in, ring and placed-call lines exist today as silent text; the count is of lines that gain a voice.

## 8. Part B: migration slices

Every migration slice has the same steps:

1. **Config** (implementer): the scenario keys in 7.2.
2. **Ink** (writer, a separate agent): rewrite only the knots named; follow 3.5 and README_ink_best_practices.md; compile; run dialoguelint and the validator.
3. **Checks**: validator 0 errors and no new call-set warnings; `tts_mission_lines_test.rb` passes; the mission's existing node tests pass; the key diff for the mission lists only the lines the slice meant to add or re-key (write the list to the log).
4. **Live proof** on port 3023: drive the beat on the real path, including a decline or no-answer where the beat has one, and a reload during the beat.
5. **Lab sheet** in the same slice, only where 7.2 names a change: edit the sentence that describes what the player does or sees. Commit in the HacktivityLabSheets repo with an explicit path. Never open `*-vm-technical-steps.md`; if a VM step is affected, log it for opus48. M5 logs one check for opus48: whether m05's VM companion describes how the call to HaX opens, and if so whether it still holds once the bring-in is a placed call.
6. **Audio** (after the orchestrator has passed the line count to the user): `tts-audio` skill, top up the mission.
7. Commit (explicit paths), log the slice.

| Slice | Scope | Needs | Notes |
|---|---|---|---|
| M1 | m09 Nightshade, Torres, Gary ring; `call_map` `ring:` keyword; `start` stubs; Gary's `_comment` | A2b, A2c | proofs: Gary rings over the keypad and holds; Gary rings while the CyberChef popup is open, Answer puts the popup aside and brings it back; Torres rings over the box container |
| M2 | HaX in-person styles (C2) and HaX's art on her phone records (m09, m10) | A1 | see below |
| M3 | m09 HaX forced-open silent threads → texts; `start` rewrite | today | check the mission's walkthrough steps still hold |
| M4 | m04 Vance callable; HaX's dial ring; HaX's bring-in call; m04 sheet | A2b, A2c, A5, A6 | proofs: ring Vance before allying (no answer), after allying (connects), after his KO (no answer); the dial reading rings HaX, declined then called back; the bring-in from the hub choice, with a hostile standing (blocked) and without |
| M5 | m05 Recruiter first call, ring-back; Patricia callable; HaX's root-flag ring; HaX's bring-in call; the four rewords; m05 sheet | A2b, A2c, A4, A5, A6 | the biggest ink rewrite; the Recruiter's `start` comments record playtest history: read them first. Proof includes a first call that the player declines, then the follow-up text and calling her back; the root-flag ring answered, and a run where the player picks the hub choice first (row 31) |
| M6 | m07 Architect taunts and sign-off as withheld voiced calls; voicemails; router, `parked` and `dead_air_choices` changes; narration rewrites; HaX's bring-in call; the two rewords | A2b, A2c, A5, A6 | replay the T-30…T-1 timing; prove the replace rule with a taunt queued behind a person-chat; decline T-20 and then open his thread by hand: it shows the voicemail and dead air, never `taunt_t20` as text; a later taunt doesn't open as first contact; a voicemail bubble in the terminal look plays; a taunt call ended with the back arrow leaves its row; the debrief still waits for `architect_signoff_done` |
| M7 | m03 revelation as an outgoing call with a two-minute fallback ring; HaX's bring-in call; the four rewords | A2b, A5, A6 | proofs: ring HaX from her thread; choose the hub topic instead; a run where the player doesn't, so she rings; a reload inside the two minutes, after which she still rings (the `game_loaded` twin) |
| M8 | m01 first ring; the debrief call | A2b, A5, A6 | `first_call` and `support_hub` untouched; key diff shows only `first_ring` and `closing_debrief` lines (the follow-up text is not voiced); the debrief call's `#ending_check` answered both ways |
| M9 | Small wording: lab_physical_pentest Ruth line; sis02 ring wording; sis03 call framing | today | text only, except one person-chat line |
| M10 | m06 fund call and bring-in call; m08 door audit call | A5 | see below |

**M2 in detail.**

1. m10 `scenarios/m10_full_disclosure/scenario.json.erb`: add to the `voices` hash (`:491`) `hax_briefing:` with name `Aoede`, the style string of m01 `briefing_cutscene` (`scenarios/m01_first_contact/scenario.json.erb:557-561`) and `en-GB`; and `hax_debrief:` with the style of m01 `closing_debrief_person` (`:1134-1138`). `hax_post` (`:1611`) uses `voice.(:hax_briefing)`; `hearing` (`:2486`) uses `voice.(:hax_debrief)`; `agent_0x99` (`:1624`) keeps `voice.(:hax_phone)`. Replace the ERB comment at `:1610` ("One HaX voice block for both her records…") with one that says co-speaker lines name `agent_0x99:` and the in-person records have their own styles.
2. m10 `agent_0x99` (`:1618-1624`) gains `hax_post`'s `spriteSheet`, `spriteTalk`, `spriteVisemes` and `spriteConfig` (`:1603-1607`). Why it is needed: today an `Agent HaX:` line in Netherton's, Tesseract's or the six o'clock story resolves to `hax_post`, because `hax_post` is listed first in `forward_post` (`:1599` before `:1618`) and the registry keeps that order (1.6). Person-chat draws the resolved character's art. After step 3 those lines resolve to `agent_0x99`, a phone record with only `avatar`, and without this step the portrait code would fall back to the default `hacker` sprite with no lip sync (`person-chat-portraits.js:375-387, 416-435`). With the fields copied, the portrait is the one shown today. No world sprite appears, because phone records never get one (`rooms.js:3313`), and the voice block is unchanged, so no key moves.
3. In the 14 files of the 7.2 row, change every `Agent HaX:` prefix to `agent_0x99:`. Leave `m10_hax_post.ink` and `m10_hearing.ink` as they are (their own lines stay with their host, 1.6).
4. m09: `hax_voice`'s voice style becomes the m01 briefing style; `m09_briefing.ink`'s 59 `Agent HaX:` prefixes become `hax_voice:`. m09 `agent_0x99` (`:838-848`) gains `hax_voice`'s art fields (`:1016-1020`), so the on-the-line scenes stop drawing the default sprite (7.2). This changes how m09 looks today, so the slice logs it for the user.
5. Key diff: m10 changes only lines whose host is `hax_post` or `hearing`; every `agent_0x99:` line, `m10_ghost_phone.ink:109` among them, keeps its key; m09 changes only `m09_briefing.ink` HaX lines. Anything else is a failure.
6. Proof: in each mission, a person-chat with an `agent_0x99:` or `hax_voice:` line shows "Agent HaX" as the speaker (never the id) with her portrait and lip sync, and requests TTS under the expected id. In m10, the portrait route of 5.4: screenshots of an `agent_0x99:` line in Tesseract's and Netherton's scenes match A0's screenshots of the same lines (portrait, name, mouth frames). In m09, a screenshot of a line in the Sorensen door scene shows her art. The m10 Ghost call line requests under `agent_0x99` with the same text and voice as A0.

**M10 in detail.** The two beats are the ones the missions' texts already describe as calls (7.2, 7.3): m06's fund report ("Call me about it") and m08's door audit read ("you read it to me … Call me when you've got both"). Both are the player's call, placed from the hub choice the thread already has, so no beat is told twice and the texts read right as written. m06's bring-in call is in the same slice. Rules for the writer: the call knot keeps the text knot's content, rewritten as speech (3.5); at most about ten NPC lines each; the call ends `#exit_conversation` and `-> DONE`. Proof: each call placed from its hub choice; in m08, a wrong answer and then the right one, the second time from the hub again. Lab sheet: `m08_the_mole.md:410` (7.2), `m06_follow_the_money.md:504`.

Regression after every M slice: the lab SE proof plus the mission's own playtest walkthrough step for the changed beat.

## 9. Decisions and later

### 9.1 Decisions

The user decided C2 and C6 (log, 2026-11-12). The orchestrator took the plan's defaults for the rest. Nothing here is open.

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
| C9 | m09 HaX `start` becomes plain texts; m06 and m08 each get a placed HaX call on the beat their texts already call a call (M10); m01 gets one short first call and its debrief becomes a call (M8). | every m01–m08 mission has a call; m01 teaches answering with nothing at stake and placing a call at the debrief |
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

### 9.2 Later (not built in this plan)

- A busy tone and an "unavailable" knot for `call` (no mission needs one).
- `voice.callFx` (a phone-line effect for call lines only).
- A call icon on contact rows; a Recents screen.
- `ring` on video calls and on the legacy m09/m10 forced calls.
- Events `phone_call_ringing`, `phone_call_placed`, `phone_call_ended`; a `durationMs` field.
- Per-call timing keys (ring timeout, dial and ring-out times, hold limit).
- A header call button for beats whose condition needs an OR, without `button: false` (an `||` in the condition grammar).
- In-person style for other m10 scenes where HaX is in the room (`m10_tesseract.ink`, `m10_six_oclock.ink`): they stay on `agent_0x99` and the phone style until the user asks.
