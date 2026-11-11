# Phone calls: plan

Status: draft 1, 2026-11-11. Track brief: `docs/agents/PHONE_CALLS_BRIEF.md`. Log: `docs/agents/PHONE_CALLS_LOG.md`. Inputs: `docs/agents/phone_calls/`.

All paths are relative to the worktree root unless shown in full. `js/` means `public/break_escape/js/`. Line numbers are at commit 5952f39e1.

## 0. How to use this plan

- Part A (sections 1 to 6) is the engine work. Do the slices in section 6 in order. Each is committed on its own, with its tests passing, before the next starts.
- Part B (sections 7 and 8) moves the missions onto the right mode for each beat. A migration slice may start once the engine slices it names are merged.
- Part C (section 9) lists the open questions with a default. Build the default unless the orchestrator has logged a different decision in `docs/agents/PHONE_CALLS_LOG.md`.
- Every new key is opt-in. A scenario that uses none of them behaves exactly as it does at 5952f39e1. That rule protects `lab_social_engineering` (deployed) and the existing voiced calls in m02, m09, m10 and `lab_tesseract_trials`.
- Environment, ports, the shared database rule and the commit rule are in the brief ("Where to work"). Browser proofs use port 3023 only.
- Lab sheets live in `/home/cliffe/Files/Projects/Code/HacktivityLabSheets/_labs/<category>/`. Never open a `*-vm-technical-steps.md` file. If a change touches VM steps, log it for the opus48 agent.

## 1. What the code does today

Checked against the code. The design in section 2 builds on these facts.

### 1.1 How a phone conversation opens

| Path | Code | What happens |
|---|---|---|
| Player opens the phone from the inventory | `js/systems/inventory.js:1289`; `js/systems/interactions.js:1752-1806` for a phone object | `phone-chat` starts on the contact list (`phone-chat-minigame.js:316-324`). Tapping a row calls `openJudgedContact` (pretext contacts with `callId`) or `openConversation` (`phone-chat-minigame.js:194-202`). |
| Event mapping, `conversationMode: "phone-chat"` | `js/systems/npc-manager.js:1495-1527` | `_queueScriptedPhoneCall` builds params `{ npcId, phoneId, startKnot, title, theme, disableClose, voiced, callLabel }`. `resume: true` with a saved story drops `startKnot` (`:1511`). |
| Event mapping, `conversationMode: "video-call"` | `npc-manager.js:1463-1493` | person-chat with `videoCall: true`, any npcType. |
| `timedConversation` on a phone NPC | scheduled at `npc-manager.js:352-369`, delivered at `:2059-2140` | phone-chat with `disableClose`, `voiced`, `callLabel`, or person-chat when `videoCall` is set. Sets `npc.currentKnot` to the target (`:2111`). |
| Text (`timedMessages`, mapping `sendTimedMessage`) | `npc-manager.js:1274-1286`, delivered at `:2006-2056` | adds a `timed: true` message to the thread, updates the badge, shows a bark toast. A click on the toast opens phone-chat at `targetKnot` (`js/systems/npc-barks.js:449-455`, `:637-670`). |
| Pretext desk-phone call (lab SE) | desk phone object `interactions.js:1745-1749` → `startPretextCall` `:671-713` → pretext card → `callLaunch` `js/minigames/pretext-prep/pretext-card.js:294-311` | phone-chat with `startKnot` (spec or contact `currentKnot`), `pretextCallId`, `blanks`, and `voiced: true` when the contact has `voiced: true` (`:307`). |
| Phone object with `voice` (voicemail) | `interactions.js:1752-1806`, `js/utils/phone-message-converter.js:14-24, 96-105` | converts to a virtual contact whose only line is `voice: <text>`; the thread draws a play button and transcript (`phone-chat-ui.js:821-887`), played by `playVoiceMessage` (`:331`). |

### 1.2 Scripted conversations interrupt

- `_queueScriptedConversation` (`npc-manager.js:675-725`): with nothing scripted already open, an event-mapping call closes whatever minigame is open (`:689-691`) and opens 500 ms later (`SCRIPTED_CALL_START_MS`, `:139`). A second scripted conversation waits in a queue (`:719-724`, pump at `:770-786`).
- So a mapping call tears down a lockpick, a terminal or a person-chat the player is in. m07 avoids that by sending The Architect's taunts as texts (`scenarios/m07_architects_gambit/scenario.json.erb:1574`, `_comment`: "A bark, not an auto-opened call, so it never tears down a conversation or a terminal").
- There is no ring, no answer and no decline anywhere in the engine. `grep -rn "ring" js/minigames/phone-chat` finds nothing call-related.

### 1.3 Voiced calls

- Call mode is fixed when the phone UI is built: `this.isCallMode = isPhoneCallMode(this.params)` (`phone-chat-ui.js:49`; rule at `phone-call-ui.js:148-150`: `voiced === true` and theme not `terminal`). One phone minigame instance can't switch between thread and call screen. Any new call path must start a new phone-chat minigame with `voiced: true`.
- The call screen (`phone-call-ui.js:190-207`, built by `phone-chat-ui.js:188-200`, caption `:686-690`) has an ON CALL bar, a timer, subtitles, choices and an end-call button. The end button and back arrow are hidden on `disableClose` (`phone-chat-minigame.js:213-227`).
- Voicing: `_speakCallLine` (`phone-chat-minigame.js:933` calls it, body `:944-970`) uses `PhoneCallVoice.speak(speakerId, text, fx)` (`phone-call-voice.js:369-400`), which calls `this.tts.play(speakerId, text)` with no options (`:376`). `TTSManager.play` already accepts `{ delivery }` (`js/systems/tts-manager.js:62`) and keys the cache on it only when present (`:469-470`). So delivery notes are dropped on calls; five voiced call lines carry one today (section 1.6).
- Which knots speak: `callStartKnots` (`phone-chat-speaker.js:198-210`) = contact `voiced` → home knot; voiced non-video `timedConversation.targetKnot`; each voiced phone-chat mapping's `targetKnot`. `voicedCallKnots` (`phone-call-voice.js:278-295`) walks diverts from those, never entering the home knot (`callHomeKnot`, `:251-253`; `homeKnot` is kept at register time, `npc-manager.js:271-272`). Set on open at `phone-chat-minigame.js:517-520`.
- Home knot silence and the F20 rule are mirrored on the server: `TtsLineExtractor.call_start_knots` (`app/services/break_escape/tts_line_extractor.rb:213-227`), `call_knots` (`:183`), host selection `voiced_call?` / `voiced_phone_call?` (`:143-161`), per-line filter and `person_chat` flag (`:499-529`), and `line_delivery` returning nil for phone lines (`:367-371`).
- The voiced contact's first pretext call speaks the preloaded opening (`phone-chat-minigame.js:619-624`).

### 1.4 What persists over a reload

- Per contact, `exportPhoneState` (`npc-manager.js:2235-2300`): history (fields `PHONE_MESSAGE_FIELDS = type text timestamp gameTime read isBark timed preloaded`, `:145`), `storyState`, `storyPath`, `currentKnot`, `lastEnteredKnot`, `preloadedKnot`, deferred tags and globals. Restored by `restorePhoneState` (`:2314-2324`), called from `js/core/game.js:1771`.
- Server whitelist: `Game#sanitize_phone_state_entry` (`app/models/break_escape/game.rb:3330-3376`), message keys `PHONE_MESSAGE_KEYS` (`:3302`). Unknown keys are dropped. A string `type` of up to 20 characters passes (`:3337`).
- A mapping that opens a conversation persists its `onceOnly` trigger only when the conversation closes (`npc-manager.js:1046-1060`). A reload mid-call fires it again on the next matching event. Missions re-ring unfinished calls with `resume` mappings on `game_loaded` / `room_exited` / `conversation_closed` (README "Forced phone calls that ring again").
- A pending `delayMs` mapping is not saved (README eventMappings table).

### 1.5 Sounds

- `phone_vibrate.mp3` plays with every text toast (`npc-barks.js:76`). `message_received`, `message_sent` exist (`js/systems/sound-manager.js:86-87`).
- `desk_phone_ring.mp3` (a desk-phone double ring, CC0, office life slice 19, `sound-manager.js:88-89`) and `distant_phone.mp3` (`:136-137`) exist. There is no mobile ringtone and no ring-back tone. Credits file: `docs/achitechture/OFFICE_LIFE_SOUND_CREDITS.md`.

### 1.6 Facts the migration needs

- Contact-level `voiced`/`callLabel` is used only by `lab_social_engineering` `dev_service_desk` (`scenarios/lab_social_engineering/scenario.json.erb:1792-1803`). Dev has `phoneId: "player_phone"` but the player's phone lists only `ruth_phone` (`:22-24`); the contact list also shows any contact with history (`phone-chat-ui.js:506-517`), so Dev appears in the list after the first pretext call and opens there as a silent thread.
- `#delivery:` notes inside voiced call knots: `m09_phone_agent0x99.ink:494, 506, 678`, `m09_phone_recruiter.ink:171`, `m10_ghost_phone.ink:146`. None in `dev_service_desk.ink`. `dialoguelint.mjs:798` skips delivery checks on the phone channel ("voiced phone calls do not send notes yet").
- `test/js/finale-voiced-calls.test.mjs:261` asserts the exact source text `duration = await this.tts.play(speakerId, text);`. Slice A1 changes that line and must update the assertion.
- The validator's known-field lists: NPC fields `scripts/validate_scenario.rb:431-436`, mapping fields `:461-466`.

## 2. Part A: engine design

### 2.1 Principles

1. **Opt-in, per beat.** Two new keys carry everything: `ring` on a call (mapping or `timedConversation`) and `call` on a contact. Without them every path in section 1.1 is unchanged, byte for byte where tests can check it.
2. **A call is its own phone-chat minigame.** Call mode is fixed at UI build (`phone-chat-ui.js:49`), so answering, dialling and calling back all start a fresh `phone-chat` with `voiced: true`, then return the player to the phone where they were. This is what `callLaunch` already does for the lab.
3. **Ringing never tears anything down.** A ringing call waits politely: it rings over a puzzle or terminal and the player chooses when to answer; it waits silently behind any conversation. Only an answered call closes the open minigame, and only because the player answered.
4. **The ink stays the ink.** Decline, missed and voicemail are engine events and optional knots. A mission reacts to them with ordinary event mappings (`setGlobal`, `sendTimedMessage`, a re-ring), so no new ink syntax is needed.
5. **One thread per contact.** Texts, call transcripts and call-log rows share the contact's thread, in time order. There is no separate Recents screen in this plan (question C5).

### 2.2 Call states

A call moves through these states. Pure logic lives in a new module with no imports, `js/minigames/phone-chat/phone-ringer.js`, so node tests load it alone.

```
incoming:  queued -> ringing -> answered -> connected -> ended
                            \-> declined          (missed row, phone_call_declined)
                            \-> missed (timeout)  (missed row, phone_call_missed)
outgoing:  dialling -> connected -> ended
                    \-> no_answer | busy -> ended  (or connected to call.unavailable knot)
```

- `queued`: the call is due but a conversation is open (person-chat, video call, any phone-chat call screen, a cutscene) or the player is knocked out. It does not ring yet. It rings when that closes, using the existing queue pump (`npc-manager.js:770-786`) as the trigger.
- `ringing`: the incoming-call UI shows (2.3). Timeout `ring.timeoutMs`, default 20000 ms, counted from when ringing starts.
- `answered`: the ringer hands the call to `_queueScriptedConversation` with `startDelayMs: SCRIPTED_CALL_START_MS` (so whatever was open closes, as now), and the call's own params plus `voiced: true`, `callDirection: "incoming"`, `callStartedAt`.
- Only one call rings at a time. A second due call is `queued` behind it (first in, first out). An incoming call that arrives while the player is dialling or on a call queues.

### 2.3 Incoming call: ringing UI

| Situation when it rings | What the player sees | Code to add |
|---|---|---|
| No minigame open, or a non-conversation minigame open (lockpick, terminal, notes, a PC) | An incoming-call banner in the toast area: portrait, name, caption (`callLabel`, see 3.1), "Incoming call", a green Answer and a red Decline button. The inventory phone icon pulses. | New `js/minigames/phone-chat/phone-incoming-call.js` (DOM, mounts next to the bark container that `npc-barks.js` uses). CSS in the phone stylesheet. |
| The phone is open (contact list or a text thread) | The phone shows a full-screen incoming-call panel over its content, same buttons, same caption. | `phone-chat-ui.js`: `showIncomingCall(npc, opts)` / `hideIncomingCall()`. The minigame registers itself with the ringer while open. |
| A conversation is open (2.2 `queued`) | Nothing yet. | Ringer checks `window.MinigameFramework.currentMinigame` type and `npcManager._scriptedCallBusy()`. |

- **Sound.** While ringing: a mobile ringtone on loop (new asset, see C3; until it exists, loop `phone_vibrate`) and `phone_vibrate` once per cycle. Stops on any outcome. Uses the notifications category of the sound manager (`sound-manager.js:205`) so the volume setting applies.
- **Keys.** Esc does not answer or decline (Esc already means "close" in minigames). Choice number keys do nothing while the banner shows. The banner's buttons are real `<button>`s with labels "Answer call from <name>" / "Decline call".
- **Answer** → state `answered` (2.2). The ringer emits `phone_call_answered:<npcId>` with `{ knot, direction: 'incoming' }`.
- **Decline** → hides the UI, adds a missed-call row to the thread (2.6), emits `phone_call_declined:<npcId>` with `{ knot }`, then applies `ring.onMissed` (3.1). The onceOnly trigger of the mapping is persisted at this point (the beat happened, the player said no).
- **Timeout** → the same as decline, but emits `phone_call_missed:<npcId>`.
- **Forced calls** (`disableClose: true` with `ring`): no Decline button and no timeout. After `ring.autoAnswerMs` (default 8000 ms, 0 allowed) the call answers itself. This keeps "you must take this call" while giving the player a beat to finish what they are doing. The mapping's own `disableClose` then applies to the call screen exactly as today.
- **Conversations from the same contact**: a text from the ringing contact is held until the call ends, as texts from the caller already are during a call (README "Forced phone calls", bullet "A text from the caller is held until the phone closes").

### 2.4 Outgoing call: the player rings a contact

- **Who is callable**: a phone contact with a `call` block (3.2). No block, no call button: every current contact, including Dev and Ruth in the lab, stays as it is.
- **Where the button is**:
  - in an open text thread's header, a green phone icon button (`aria-label="Call <name>"`), next to the name;
  - on the contact row, a small phone icon at the right of the row that starts the call without opening the thread first.
  - Not shown on a contact with `callId` (a judged pretext contact: tapping the row already starts the judged call, `phone-chat-minigame.js:376-384`), on the `terminal` theme unless the contact sets `call.screen: "terminal"` (C6), or while `disableClose` is on.
- **Pressing it**: the phone saves where it was (`{ phoneId, npcIds, app, title, returnToNPC }`, as `pendingPhoneReturn` already does for the notepad, `phone-chat-minigame.js:1683-1700`), then starts a new phone-chat with `{ npcId, phoneId, startKnot: <knot>, voiced: true, callLabel, callDirection: 'outgoing', theme }`.
- **Dialling**: the call screen opens in a `dialling` state ("Calling…", the caption, an End button, a UK ring-back tone generated with Web Audio: 400 Hz + 450 Hz, 0.4 s on, 0.2 s off, 0.4 s on, 2 s off; no asset). After `call.connectMs` (default 2500 ms) it resolves:
  - `call.when` (a mapping-style condition, 3.2) holds, or is absent → `connected`; the story opens on `call.knot` through the existing explicit-knot path (restore saved story, then `goToKnot`, `phone-chat-minigame.js:543-557` and `:644-650`), so ink-local VARs and visit counts carry over.
  - It does not hold → `call.unavailable`: `"no_answer"` (default) rings out for `call.ringOutMs` (default 6000 ms) then shows "No answer"; `"busy"` plays a busy tone for 2 s and shows "Busy"; a knot name connects to that knot instead (a short voiced line such as a voicemail greeting or a "not now"). Each emits `phone_call_unanswered:<npcId>` with `{ reason }`.
- **Ending** an outgoing or answered call (end button, `#exit_conversation`, the story ending) shows "Call ended 1:24" for 1 s, adds the call-log row (2.6), emits the usual `conversation_closed:<npcId>`, then reopens the phone from the saved return state on the contact's thread. A forced call returns to where the player was in the world (no phone reopen), as today.
- **No cooldown by default.** Ringing again reruns `call.knot`; the ink decides what a repeat call says (visit counts, `{once}` blocks, a hub). A contact who should not be rung twice uses `call.when`.
- **The lab's path is untouched.** `callLaunch` (`pretext-card.js:294-311`) is not edited. The contact-level `voiced: true` keeps its present meaning: a call that reaches this contact through `callLaunch` is voiced and opens on the home knot. The new `call` block is a separate, player-dialled path. See 3.3 for how they relate.

### 2.5 Texts and calls from one contact

- One thread. A call's lines are already written into the thread history (README "The call screen"). The new call-log rows bracket them, so a later open of the thread reads: row "Incoming call", the transcript bubbles, row "Call ended 1:24".
- The contact row preview shows the last row; a missed call shows "Missed call" in red with the unread badge counting it.
- Call-log rows are drawn like narration (centred, muted, with a phone glyph) and are never voiced, never barked and never the bark text.
- Only calls on the new paths (`ring`, `call`, callback) add rows. Legacy voiced mappings, voiced `timedConversation`s and pretext calls add none, so m09, m10 and the lab look exactly as they do now unless a migration slice opts them in.

### 2.6 Missed calls, call back, voicemail

- A declined or missed incoming call adds a row `{ type: 'call', callEvent: 'missed', ... }` (2.7) and does one of these, by `ring.onMissed`:
  - `"callback"` (default): the contact is marked with a pending callback `{ knot: <the call's targetKnot>, voiced, callLabel, resume }`. The call button shows on that contact even without a `call` block, and pressing it connects straight away (no dialling outcome: they are waiting for you) to the pending knot. The callback is cleared when that call connects. A contact with both a pending callback and a `call` block uses the callback first.
  - `"voicemail"`: the knot named by `ring.voicemailKnot` runs silently into the thread (like a preload: lines added, tags applied, nothing shown live). Lines written `voice: …` become voice-message bubbles with play buttons (the existing renderer, `phone-chat-ui.js:821-887`). A badge and toast "New voicemail from <name>" show. A callback is also set unless `ring.callback: false`.
  - `"drop"`: nothing beyond the row and the event.
- **Decline in ink terms**: there is no special ink. A mission that wants a consequence maps the event: `{ "eventPattern": "phone_call_declined:recruiter", "setGlobal": { "recruiter_snubbed": true } }`, or re-rings: `{ "eventPattern": "phone_call_missed:agent_0x99", "delayMs": 20000, "conversationMode": "phone-chat", "targetKnot": "call", "voiced": true, "ring": true, "onceOnly": true }`. The knot can read the global.
- **Phone-object voicemails** (m01 two, sis01 one: section 7) stay exactly as they are. They are recordings found in the world, played from an object; a contact voicemail is something left on the player's handset. Both draw with the same voice-message bubble.

### 2.7 Save and reload

- New per-contact field in the saved phone state: `pendingCall: { knot, state: "ringing"|"missed", voiced, callLabel, disableClose, resume, onMissed }`. Written when a call starts ringing and when it is missed; removed when it connects or is dropped.
- Message entries gain two optional fields: `callEvent` (one of `incoming`, `outgoing`, `missed`, `no_answer`, `voicemail`; string ≤ 20) and `durationMs` (number). Message `type` for a row is `"call"`.
- **On load**: a `ringing` call that was not forced becomes `missed` (row added, callback set), with no toast. A forced (`disableClose`) ringing call rings again 3 s after `game_loaded`, behind the Mission Brief popup like a timed opening (`hasPendingOpeningConversation`, `npc-manager.js:1938-1944`). A `missed` call keeps its callback.
- The onceOnly trigger of a `ring` mapping persists on decline, on miss and on call close (2.3). A reload mid-call behaves as today: the trigger was not persisted, so the mission's own re-ring mapping or the next matching event rings it again.
- Existing rules are unchanged: re-rings by `resume` mappings, `cooldown: 0` for close-and-ring, F17/F20 voicing (only call knots speak; the home knot is silent; `resume` doesn't replay heard lines).

### 2.8 Delivery notes on voiced calls

Support them now (slice A1). The client passes the line's `#delivery:` note to `TTSManager.play(speakerId, text, { delivery })`; the server's `line_delivery` returns the note for lines in voiced call knots, as it does for video calls; `dialoguelint.mjs:798` stops skipping the phone channel for lines in voiced call knots. The cache key includes the note only when present, so exactly the five lines in section 1.6 re-key (two m09 HaX, one m09 HaX `tesseract_call`, one m09 Recruiter, one m10 Ghost). Lab SE: none.

### 2.9 Calls and other minigames

- A ringing call over a non-conversation minigame: banner only. Answer closes that minigame (`endMinigame(false)`) through the existing queue path, as any mapping call does today. Decline leaves it.
- Video calls (`conversationMode: "video-call"`) do not ring in this plan; `ring` on one is a validator error (C7).
- The terminal theme (m07's Architect) draws no call screen today (`isPhoneCallMode`). A ringing call to a terminal contact rings with the normal banner, then opens in the terminal look with voicing (`isVoicedCall` ignores the theme, `phone-call-voice.js:234-236`). See C6.
- An optional `call` FX: `voice.callFx` on a character (a preset name from `TTSManager.VOICE_FX_PRESETS`, e.g. `radio`), applied only to lines spoken inside a voiced phone call and only when the character has no `voice.fx`. Client-side playback only, so no cache key changes. This is how one HaX voice style can sound in the room in person and on a phone line in a call (C2).

## 3. Part A: scenario schema

### 3.1 `ring`: an incoming call that rings

Allowed on an event mapping with `conversationMode: "phone-chat"` on a phone NPC, and on a phone NPC's `timedConversation` that is not a video call. It implies `voiced: true` (a ringing call is a call); writing both is fine.

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
| `timeoutMs` | 20000 | How long it rings before it is missed. Ignored with `disableClose`. |
| `onMissed` | `"callback"` | `"callback"`, `"voicemail"` or `"drop"` (2.6). Declined counts as missed. |
| `voicemailKnot` | none | Required with `onMissed: "voicemail"`. Lines written `voice: …` are voice messages. |
| `callback` | `true` | With `"voicemail"`: also leave a callback. |
| `autoAnswerMs` | 8000 | Forced calls (`disableClose: true`) only: answers itself after this. |

Every existing mapping field still applies: `disableClose`, `resume`, `callLabel`, `onceOnly`, `cooldown`, `delayMs`, `condition`. `resume` re-rings from the saved story, as now.

### 3.2 `call`: a contact the player can ring

On a phone NPC:

```json
"call": {
  "knot": "support_call",
  "when": "globalVars.vance_is_ally && !globalVars.robert_vance_ko",
  "unavailable": "no_answer",
  "callLabel": "Albion ops desk"
}
```

| Field | Default | Meaning |
|---|---|---|
| `knot` | required | The knot a call the player places opens on. It is a call knot: voiced, with everything it reaches up to the home knot (F20 rule, unchanged). It must not be the home knot (validator error), so the thread's texts stay silent. |
| `when` | always | A condition in the event-mapping grammar (README "NPC Event Mappings", `globalVars.` terms; `value`, `name` and `data.` are not available). Checked when the call would connect. |
| `unavailable` | `"no_answer"` | `"no_answer"`, `"busy"`, or a knot name (a voiced call knot too). |
| `callLabel` | the contact's `callLabel`, else "Voice call" | Caption on the call screen (`callLabelFor`, `phone-call-ui.js:157-160`, gains the `call` block as a source after the params). |
| `connectMs`, `ringOutMs` | 2500, 6000 | Dialling and ring-out times. |
| `screen` | — | `"terminal"` lets a terminal-theme contact be rung (C6). |

### 3.3 Every form, old and new

| Form | Today | After this plan |
|---|---|---|
| Mapping `phone-chat` + `voiced: true` (m09, m10) | opens at once, voiced | unchanged |
| `timedConversation` + `voiced: true` | opens at once, voiced | unchanged |
| Contact `voiced: true` + `callLabel` (lab SE Dev) | `callLaunch` calls are voiced, open on the home knot; the contact list opens a silent thread | unchanged. Documented as "voiced when reached through a pretext call". A contact may also have a `call` block; then the call button uses `call.knot`, and `callLaunch` still uses the home knot. |
| Mapping `video-call` / `timedConversation.videoCall` (m02, lab_tesseract) | person-chat video call | unchanged; `ring` not allowed (C7) |
| Mapping `phone-chat` with no `voiced` (texts forced open) | opens a silent thread at once | unchanged |
| `sendTimedMessage` / `timedMessages` (texts) | toast + thread | unchanged |
| Phone object with `voice` (voicemail recordings) | voice-message bubble | unchanged |
| **New** `ring` on a mapping or `timedConversation` | — | rings; answer, decline, miss, callback, voicemail |
| **New** `call` on a contact | — | call button; dialling; connects or no answer |
| **New** `voice.callFx` | — | phone-line FX in voiced calls only |

### 3.4 Events the engine emits

All carry `{ npcId, knot }` and are usable as `eventPattern`s:

- `phone_call_ringing:<npcId>`, `phone_call_answered:<npcId>`, `phone_call_declined:<npcId>`, `phone_call_missed:<npcId>`;
- `phone_call_placed:<npcId>` (the player pressed call), `phone_call_unanswered:<npcId>` (`data.reason`: `no_answer`, `busy`, `unavailable_knot`);
- `phone_call_ended:<npcId>` (`data.durationMs`, `data.direction`), emitted just before `conversation_closed:<npcId>`, which still fires as now.

### 3.5 How a mission writes a call

- Put each call in its own knot (`call`, `support_call`). Don't make the call knot the home knot.
- Write it as speech: no links, no "sent you", no emoji, no printed variables, no inline stage directions (`#delivery:` instead). Narration (`Narrator:`) is shown muted and is not spoken.
- End it with a one-word reply choice and `#exit_conversation` (m09 Nightshade pattern), or `-> hub` if the call should end at the thread's hub.
- Drop ink choices that fake a call ("[Ring back.]" → "The number rings out.") once the contact has a `call` block with `unavailable: "no_answer"`; the engine does it now.

## 4. Part A: server, TTS extraction, validator

### 4.1 Phone state on the server

`app/models/break_escape/game.rb`:

- `PHONE_MESSAGE_KEYS` (`:3302`) gains `callEvent` and `durationMs`. In the `select` (`:3336-3342`): `callEvent` must be one of `incoming outgoing missed no_answer voicemail`; `durationMs` an Integer `0..86_400_000`.
- `sanitize_phone_state_entry` (`:3330`) keeps `pendingCall` only as a Hash with: `knot` String ≤ 200 matching `/\A[A-Za-z0-9_.]+\z/`; `state` in `ringing missed`; `voiced`, `disableClose`, `resume` booleans; `callLabel` String ≤ 100, plain text (strip control characters; the engine draws it with `textContent`); `onMissed` in `callback voicemail drop`. Anything else is dropped. An entry with only `pendingCall` and no history is kept (change the `return nil` at `:3374`).
- Client mirror: `NPCManager.PHONE_MESSAGE_FIELDS` (`npc-manager.js:145`) gains the two fields; `_phoneStateEntry` (`:2259`) writes `pendingCall`; `_applySavedPhoneState` reads it.
- Rails tests (new, `test/models/break_escape/game_phone_calls_state_test.rb`): accepted shapes; hostile input (HTML in `callLabel`, a 10 kB knot, a nested object in `pendingCall`, a negative or huge `durationMs`, an unknown `callEvent`, a `type` over 20 characters) is dropped or clipped; the 512 kB cap still refuses; a pending call with no history survives.

### 4.2 TTS extraction must list exactly the callable lines

`app/services/break_escape/tts_line_extractor.rb`:

- `voiced_phone_call?` (`:154-161`) is also true when the NPC has `call.knot`, a mapping or `timedConversation` has `ring`, or the scenario has a `ring.voicemailKnot` for it.
- `call_start_knots` (`:213-227`) adds: `call.knot`; `call.unavailable` when it is a knot name (not `no_answer`/`busy`); the `targetKnot` of each mapping with `ring` and `conversationMode: "phone-chat"` (a `ring` mapping without `voiced` is still voiced); the `timedConversation.targetKnot` when it has `ring`.
- Voicemail knots (`ring.voicemailKnot`): their `voice: …` lines only, prefix stripped, under the contact's voice. They are not call knots (they don't widen the walk). Add `voicemail_knots(npc)` and a branch in `each_host_line` (`:499-529`) that yields only lines whose resolved text starts `voice:`.
- `line_delivery` (`:367-371`): return the `#delivery:` note for lines in voiced call knots as well as video knots (slice A1). Rename the second argument from `person_chat` to `sends_delivery` and keep `person_chat` for narration handling, so narration in a voiced call stays unspoken (`:526-527`).
- Client parity: `callStartKnots` (`phone-chat-speaker.js:198-210`) gets the same additions, and `voicedCallKnots` is unchanged. The existing parity tests (section 5) must cover the new sources.
- `cache_stamp` (`:433-445`) includes `hosts`, so the new hosts invalidate the endpoint cache by themselves; nothing to add.

**Key identity rule.** For every scenario that adopts none of the new keys, the extractor's `keys` (`:99`) must be identical before and after each slice, apart from the five delivery re-keys in A1. Slice A0 records the baseline; every later slice compares.

### 4.3 Validator (`scripts/validate_scenario.rb`)

- Add `call` to the known NPC fields (`:431-436`) and `ring` to the known mapping fields (`:461-466`); `callFx` to the voice fields if the voice block is checked.
- New check `check_phone_calls(json_data, base_dir)`, called beside `check_ink_files`:
  - error: `ring` on a mapping whose `conversationMode` isn't `phone-chat`, on a non-phone NPC, or on a video call;
  - error: `call.knot`, `call.unavailable` (a knot) or `ring.voicemailKnot` not a knot in the compiled ink;
  - error: `call.knot` equals the contact's home knot (`currentKnot`, default `start`);
  - error: `onMissed: "voicemail"` with no `voicemailKnot`; `ring.timeoutMs` or `autoAnswerMs` not a non-negative number;
  - error: `call.when` that the condition grammar can't parse, or uses `value`, `name` or `data.`;
  - warn: a `call` or `ring` contact with no `voice` (the call would be silent);
  - warn: `ring.timeoutMs` with `disableClose` (ignored);
  - warn: a contact with `callId` and a `call` block (the call button is hidden).
- Test file: `test/js/validator-phone-calls.test.mjs` if the validator tests run from node (see `test/js/validator-social-pretext.test.mjs` for the pattern), else a Rails/Ruby test beside the existing validator tests.

### 4.4 dialoguelint heuristic: call writing in a text knot

`scripts/ink_runtime_check/dialoguelint.mjs` gains a warn-level rule `call-in-text-thread`:

- Scope: phone contacts only (`lintInk(text, { channel: "phone" })`, `dialoguelint.mjs:122`), knots that are not in the contact's voiced call set. `lintInk` has no scenario knowledge today, so add an option `callKnots` (a Set of knot names) that the caller computes from the scenario with the same `callStartKnots` + `voicedCallKnots` the client uses; with no `callKnots` the rule treats every knot as text.
- Fires on an NPC line or narration matching any of: `\b(you|she|he)\s+picked up\b`, `\bon (this|the|my|her|his) line\b`, `\bget off (her|my|his) line\b`, `\bhang(s|ing)? up\b`, `\bthe line (drops|goes dead|is dead)\b`, `\byour handset (rings|lights)\b`, `\brings out\b`, `\bcaller id\b`.
- Does not fire on "ring <Name> back", "call me", "I'll ring" (an invitation in a text is fine), or inside a choice's bracketed text.
- Suppressed per knot by a comment line `// lint: text-about-call` directly under the `=== knot ===` line.
- Expected hits at 5952f39e1 (the test fixture list): m05 Recruiter `hangs_up`, `end_contact`, `never_talked_terms`, `idle`, `recruiter_deal_taken`, `recruiter_deal_refused`, `recruiter_final_statement`; m07 Architect `taunt_t30`, `t30_close`, `taunt_t20`, `taunt_t5`, `taunt_t1`, `t1_close`; m09 Nightshade/Torres/Gary `start` and `call` (Nightshade `call` until it is voiced). The writer migrations clear them.
- The voiced-line rules (`inline-direction`, voiced variables) also run on `call.knot` and `ring` knots, through the same voiced-knot set.

## 5. Part A: tests and proofs

### 5.1 Node unit tests (`test/js/`, run with `bin/test-js`)

New files. Each new engine module has no imports (or only `phone-chat-speaker.js`), so tests copy it into a temp dir as `test/js/finale-voiced-calls.test.mjs:24-26` does. **Every new static import added to an engine module must be added to each test harness copy list that copies that module** (grep `test/js` for the module's file name), or node tests fail with ERR_MODULE_NOT_FOUND.

| File | Covers |
|---|---|
| `phone-ringer.test.mjs` | state machine: queue order, one ringing at a time, queued while a conversation is open, timeout → missed, decline → missed, forced: no decline, auto-answer at `autoAnswerMs` (0 included), answer hands params to the opener with `voiced`, `callDirection`, `callLabel`; events emitted with the right data; onceOnly persisted on decline/miss |
| `phone-ring-config.test.mjs` | `normaliseRing(mapping)`: `true` and object forms, defaults, bad values dropped; `normaliseCall(npc)`; `callLabelFor` precedence with the `call` block |
| `phone-outgoing-call.test.mjs` | `when` evaluated with the mapping grammar; `no_answer`, `busy`, knot outcomes; pending callback wins over `call.knot`; no button for `callId` contacts, `disableClose`, terminal theme without `screen` |
| `phone-call-log.test.mjs` | rows added only on new paths; never for pretext calls or legacy voiced mappings; preview text for a missed call; rows never voiced or barked |
| `phone-call-persistence.test.mjs` | `pendingCall` export and restore; ringing → missed on load; forced ringing re-rings after `game_loaded`; message fields survive `_phoneStateEntry` |
| `phone-call-delivery.test.mjs` | the note reaches `TTSManager.play` options for a voiced call line; no note → the call is exactly `play(speakerId, text)` with no third argument (so unchanged keys) |
| `phone-call-knots-parity.test.mjs` | `callStartKnots` includes `call.knot`, `call.unavailable` knot, `ring` targets; excludes `no_answer`/`busy`; unchanged for every form in 3.3 (fixtures: Dev, m09 HaX mapping, m10 Victoria, m02 Ghost video) |
| `dialoguelint-call-in-text.test.mjs` | the rule's hits and non-hits (Ruth's "Ring Dev back" doesn't fire), the suppress comment, `callKnots` |

Existing tests that must still pass untouched (the lab and legacy forms): `phone-voiced-contact`, `social-lab-dev-call`, `social-lab-ruth-phone-keys`, `social-lab-ruth-keys`, `social-pretext-*`, `phone-call-mode`, `phone-call-queue`, `finale-voiced-calls` (one assertion updated in A1, `:261`), `finale-forced-call-and-closing-card`, `phone-reopen-and-persistence`, `social-video-call-label`. Full suite under `flock /tmp/be-test-suite.lock bin/test-js -j 3` at the end of each slice.

### 5.2 Rails tests

- `test/models/break_escape/game_phone_calls_state_test.rb` (4.1).
- `test/unit/break_escape/tts_line_extractor_calls_test.rb`: a fixture scenario (in `test/fixtures/files/`) with a `call` contact, a `ring` mapping, a voicemail knot, a `no_answer` contact and a home knot with lines: the extractor lists exactly the call and voicemail lines, never the home knot, never narration; delivery notes are carried for voiced call lines.
- `test/unit/break_escape/tts_mission_lines_test.rb:103` ("every line a voiced conversation can request resolves…") already loops all missions; it must keep passing, and picks up migrated missions by itself.
- A key-identity test or script run (A0): for `lab_social_engineering`, `m02_ransomed_trust`, `m09_digital_archaeology`, `m10_full_disclosure`, `lab_tesseract_trials`, dump `TtsLineExtractor.new(name, data).keys.sort` to `docs/agents/phone_calls/keys_baseline/<scenario>.txt`, and compare after each engine slice. Allowed difference: the five delivery re-keys (A1) in m09 and m10 only.
- Run under `flock /tmp/be-test-suite.lock` with `BUNDLE_PATH` set (brief).

### 5.3 Focused test scenario: `scenarios/test_phone_calls/`

Add it to `scenarios/TEST_SCENARIOS_README.md`. One small office room, the player's phone, a desk, a lockpick box (a non-conversation minigame to ring over), a person NPC to talk to (a conversation to queue behind), and these contacts (all with voices, short ink, no printed variables):

| Contact | Shows |
|---|---|
| `caller_basic` | `ring: true` on `room_entered` after 3 s: banner with phone closed; answer → call screen; call-log rows; return to the world |
| `caller_decline` | `ring` with `onMissed: "callback"`: decline → missed row, red preview, call button; calling back connects straight to the call knot; a `phone_call_declined` mapping sets a global the call reads |
| `caller_voicemail` | `ring` with `timeoutMs: 6000`, `onMissed: "voicemail"`: leaves a `voice:` voicemail and a callback |
| `caller_forced` | `ring` + `disableClose` + `autoAnswerMs: 5000`: no Decline; auto-answers; can't end the call; `resume` re-ring on `conversation_closed` |
| `caller_queue` | rings while the person-chat is open: waits, then rings when it closes; a second caller rings after the first ends |
| `desk_contact` | `call` block, always available: call button in thread and row; dialling; ink-local visit counts carry over a second call |
| `away_contact` | `call` with `when` false then true (a lever sets the global): no answer, then busy (`unavailable: "busy"` on a second contact `busy_contact`), then connects |
| `texter` | plain texts and a plain silent thread (unchanged path, side by side) |
| `legacy_voiced` | a legacy voiced mapping call (no `ring`): opens at once as today, no call-log rows |

Validator clean (0 errors). A dungeon graph is not needed.

### 5.4 Live browser proofs (port 3023, headless)

Driver: `.claude/skills/playtest-scenario/scripts/playtest-session.js`; games via `bundle exec rails runner tools/playtest/new-game.rb <scenario>`. Each proof saves screenshots and the console log under `docs/agents/phone_calls/proofs/<slice>/` (screenshots small; note the paths in the build log).

- **Before (slice A0) and after each engine slice (A1–A7)**, the regression set:
  1. `lab_social_engineering`: open the desk phone, fill the pretext card, place Dev's call; the call screen shows "Ledgerwell service desk"; the first line "Service desk, Dev speaking." requests the same `/tts` text and npc_id as the baseline (log the requests); finish, see the debrief; open the phone: Ruth's thread works and Dev's thread is silent; no call button on either.
  2. `m09_digital_archaeology`: the Recruiter `call` (voiced, `disableClose`) opens on its event; close by a hit and the `resume` re-ring; the HaX `identity_scene` call.
  3. `m10_full_disclosure`: the `breach_call` and Victoria's `victoria_call`.
  4. `m02_ransomed_trust`: the Ghost console video call (`on_recovery_console`).
  5. `lab_tesseract_trials`: the `the_offer_call` video call on `relay_opened`.
  Compare `/tts` request lists before and after (same texts, same npc_ids, same delivery, apart from the five A1 lines).
- **New behaviour**: every row of the 5.3 table, driven in `test_phone_calls`, plus a reload while a call rings (→ missed with callback) and a reload while a forced call rings (→ rings again after load).
- A helper test passing is not proof. A slice is done when its proof ran on the real path (the real phone, the real event, the real reload).

## 6. Part A: implementation slices

Each slice: write the tests first, implement, run the slice's tests and the full JS suite, run the 5.4 regression set, commit with explicit paths, add a line to `docs/agents/PHONE_CALLS_LOG.md`. A Sonnet implementer does one slice at a time; an Opus reviewer checks it against this plan and the code before the next starts.

### A0. Baseline (no engine change)

- Record the key baselines (5.2) for the five scenarios.
- Run the 5.4 regression set on the unchanged engine; save the `/tts` request lists (text, npc_id, delivery) per proof to `docs/agents/phone_calls/proofs/A0/`.
- Run `bin/test-js` and the Rails TTS tests; note counts in the log.
- Accept: baselines and request lists committed; suite counts logged.

### A1. Delivery notes on voiced calls

- `phone-chat-minigame.js`: keep each step's tags with its lines (the minigame already applies line tags, `_applyLineTags` `:1278`) and pass the `#delivery:` note, parsed with the existing `js/systems/tts-delivery.js` helper, to `_speakCallLine`, then to `PhoneCallVoice.speak(speakerId, text, fx, { delivery })`, which calls `this.tts.play(speakerId, text, delivery ? { delivery } : undefined)`. With no note the call must stay `play(speakerId, text)`.
- Server: `line_delivery` for voiced call knots (4.2). `dialoguelint.mjs:798`: lint notes in voiced call knots (needs `callKnots`, 4.4; until A7 lands, lint notes on every phone knot that has a `#delivery:` tag).
- Update `test/js/finale-voiced-calls.test.mjs:261` to the new source line.
- Accept: `phone-call-delivery.test.mjs`; the key diff shows exactly the five lines of 1.6 re-keyed and nothing else; m09 proof: the `tesseract_call` line at `m09_phone_agent0x99.ink:678` requests with its delivery note. Log the five lines for the audio step.

### A2. Ring config, events and the ringer (phone closed)

- New `js/minigames/phone-chat/phone-ringer.js` (pure state machine, 2.2) and `phone-ring-config.js` (`normaliseRing`, `normaliseCall`).
- `npc-manager.js`: in the phone-chat branch (`:1495-1527`) and the timed delivery (`:2085-2125`), when the config has `ring`, hand the call to `window.phoneRinger.offer({...})` instead of `_queueScriptedPhoneCall`. Copy `ring` onto the mapping config in the mapping builder (`:861-890`) and onto the scheduled timed conversation (`:352-369`, `:1861-1886`). `persistOnClose` is also called on decline and miss.
- New `js/minigames/phone-chat/phone-incoming-call.js`: the banner (2.3), Answer/Decline, ringtone loop (placeholder: `phone_vibrate`), pulse on the inventory phone icon.
- Ringer creation and wiring where `npcManager` is created (`js/core/game.js` near `:1771`), exposed as `window.phoneRinger`.
- Accept: `phone-ringer.test.mjs`, `phone-ring-config.test.mjs`; `test_phone_calls` (built in this slice with `caller_basic`, `caller_decline`, `caller_forced`, `legacy_voiced`, `texter`) proves answer, decline, timeout, forced auto-answer with the phone closed and over the lockpick minigame; the regression set unchanged.

### A3. Ringing inside an open phone, and queueing behind conversations

- `phone-chat-ui.js`: `showIncomingCall` / `hideIncomingCall` panel. The minigame registers with the ringer on start and unregisters in `cleanup` (`phone-chat-minigame.js:1630-1660`).
- Ringer: `queued` while a conversation is open (person-chat, video call, a phone call screen, a scripted conversation starting), rings when it closes.
- Accept: `caller_queue` proof; ringing while the phone shows the contact list and while a text thread is open; Answer closes the thread with `conversation_closed` and opens the call; after the call the phone reopens on the previous thread.

### A4. Call-log rows and phone state

- `PHONE_MESSAGE_FIELDS`, `_phoneStateEntry`, `_applySavedPhoneState`, server whitelist (4.1).
- `phone-chat-ui.js`: render `type: 'call'` rows; preview text; unread count includes a missed row.
- `pendingCall` save and restore; on load: ringing → missed; forced ringing → rings again after `game_loaded` (2.7).
- Accept: `phone-call-log.test.mjs`, `phone-call-persistence.test.mjs`, the Rails model test; reload proofs in `test_phone_calls`; the lab's Dev thread after a pretext call has no rows (regression proof 1).

### A5. Outgoing calls

- `call` block (3.2). Call buttons in the thread header and contact rows (`phone-chat-ui.js` `createContactItem` `:590-650`, `updateHeader`); hidden per 2.4.
- Dialling, connect, no answer, busy, unavailable knot; ring-back and busy tones with Web Audio (no asset); "Call ended" state; return to the phone (reuse the `pendingPhoneReturn` shape, `phone-chat-minigame.js:1683-1700`).
- `callStartKnots` (client) and `call_start_knots` (server) add `call.knot` and an `unavailable` knot (4.2).
- Accept: `phone-outgoing-call.test.mjs`, `phone-call-knots-parity.test.mjs`, the extractor Rails test; `desk_contact`, `away_contact`, `busy_contact` proofs; key identity for the five baselines.

### A6. Missed-call callback and contact voicemail

- `onMissed` behaviours (2.6). Callback button on a contact with a pending call. Voicemail knot run silently into the thread (reuse the preload runner the phone already has for intros, `PhoneChatConversation` preload) with `voice:` bubbles and a "New voicemail" toast.
- Server: voicemail lines in the batch (4.2).
- Accept: tests for each `onMissed`; `caller_voicemail` proof including playing the voicemail (a `/tts` request for the transcript under the contact's id) and calling back.

### A7. Validator, dialoguelint, `callFx`, docs

- Validator check (4.3) with tests; dialoguelint rule (4.4) with `callKnots` from the scenario; `voice.callFx` applied in `_speakCallLine` when the speaker has no `voice.fx` (2.9).
- Docs: README_scenario_design.md "Voiced phone calls" (the new forms, 3.1–3.5, the events), "NPC Event Mappings" table (`ring`), "NPC Timed Conversations" table (`ring`), "Phone NPCs" (the `call` block; fix the stale rule "conversationMode other than phone-chat is ignored on phone NPCs", which `video-call` contradicts); README_ink_best_practices.md: how to write a call knot and a voicemail knot (3.5). Log for the user that the `tts-audio` skill's extraction notes need a line on `call` and voicemail knots (don't edit `.claude/skills/*`).
- Accept: validator clean on all in-scope scenarios at 5952f39e1 apart from the expected dialoguelint warnings (4.4 list); `test_phone_calls` validator clean; a full regression run.

### A8. The ringtone asset

- Find a CC0 mobile ringtone (Freesound), 2–4 s loopable, trim with ffmpeg, add as `assets/sounds/phone_ringtone.mp3`, credit it in `docs/achitechture/OFFICE_LIFE_SOUND_CREDITS.md` (or a new `PHONE_SOUND_CREDITS.md`), load it in `sound-manager.js` beside `phone_vibrate`, and swap it into the banner. Independent of A3–A7; can run any time after A2.
- Accept: proof with sound logged; licence recorded.

## 7. Part B: mission migration inventory

Sources: `docs/agents/phone_calls/INVENTORY_PHONE_CONTACTS.txt`, `INVENTORY_PERSON_REMOTE_HINTS.txt`, `AUDIT_HAIKU_2026-11-11.md`, and a sweep of every in-scope `scenario.json.erb` and phone ink (per-knot counts in the planner's scratch notes; rerun the counts when a slice starts). The main candidates' ink was read for this plan (m09 Nightshade, Torres and Gary `call`; m07 Architect `start` to `t30_close`; m05 Recruiter `start`, `never_talked_terms` to `idle`; m04 Vance `start` to `vance_phone_support_start`; m10 `hax_post`).

Line counts are spoken NPC lines (narration and player lines excluded), rounded; treat them as ±10 %. "New" = lines with no clip today. "Re-key" = lines whose clip changes (voice style, delivery note). Engine: "today" = works with the 5952f39e1 engine; A2/A5/… = needs that slice.

### 7.1 The mix, by kind of game

- **m01–m10 (spy thriller).** HaX texts while the agent is inside (silent, stealthy, she reads progress) stay texts; a few beats per mission become calls that ring: an outside voice cutting in (Nightshade, Torres, Gary, the Recruiter, the Architect), or a contact the player chooses to ring (Vance, Patricia, the Recruiter's number). Video calls stay for faces that matter (Ghost). In-person scenes sound in person. Each mission ends up with at least two modes; most with three or four.
- **sis01–03 (serious games).** Education first, no spy framing. Keep texts and the one voicemail; calls only where real incident practice would use a call (none required in this plan).
- **Labs.** Short and focused. `lab_social_engineering` is frozen. The other labs keep what they have.

### 7.2 Inventory and targets

Lab-sheet paths are under `HacktivityLabSheets/_labs/`. "Sheet" names what changes; "none" means the player does and sees the same.

| Scenario | Contact / object / speaker | Today | Target | Why | Files, knots | Ink rewrite | Lines | Engine | Sheet |
|---|---|---|---|---|---|---|---|---|---|
| m01 | `agent_0x99` HaX | 46 texts + hub; home `first_call` silent | stays text | first mission: the handler's texts teach the phone; a call adds nothing yet | — | no | 0 | — | none |
| m01 | `reception_desk_phone` (Kevin), `patricia_desk_phone` (Maya) | phone objects with `voice` (SCN:1149-1166, 1736-1752) | stay voicemail | found recordings in the world; the PIN clue is one of several sources | — | no | 0 | — | none |
| m02 | `agent_0x99` HaX | 48 texts + hub | stays text | as m01 | — | no | 0 | — | none |
| m02 | `ghost` on the planted device | texts (terminal theme) + 2 voiced video calls | unchanged | the device is a text channel; the console video calls are the set piece | — | no | 0 | — | none |
| m02 | `press_terminal_system` | object text UI | unchanged | a terminal, not a person | — | no | 0 | — | none |
| m03 | `agent_0x99` `m2_revelation_call` | text toast opening the thread (SCN:1016) | **incoming call** (`ring`) | the knot is named and written as the turn of the mission; a ring marks it | `scenarios/m03_ghost_in_the_machine/scenario.json.erb:1016` mapping → `conversationMode: "phone-chat"`, `ring`; `m03_phone_agent0x99.ink:462` | light (check it reads as speech; no printed vars) | ~5 new | A2 | `safetynet/m03_ghost_in_the_machine.md` if it says HaX "texts" the revelation |
| m03 | `agent_0x99` other knots, `on_victoria_ko_card` | texts / KO card | stays text | cards and nudges | — | no | 0 | — | none |
| m04 | `robert_vance_phone` Vance | 1 timed text + text thread; "Call me for the engineering side" | **callable contact** (`call.knot` = a new `support_call` knot that diverts into `vance_phone_support_start`; `when`: `globalVars.vance_is_ally && !globalVars.robert_vance_ko`; `unavailable: "no_answer"`) | the ink is a support line ("Vance. What do you need?"); ringing the ops desk is the fantasy | `scenarios/m04_critical_failure/scenario.json.erb:1489-1520`; `m04_phone_robert_vance.ink:59-100` (`start`, `vance_not_yet_ally`, `vance_no_answer`, `vance_phone_support_start`, `support_hub`) | yes: split call knots from the home knot; drop the fake "(No answer.)" choice; the dial-thermometer readings stay speech | ~65 new | A5 | `safetynet/m04_critical_failure.md:82` ("a line to Robert Vance"): say he can be rung |
| m04 | `agent_0x99` | 47 texts, KO card | stays text | — | — | no | 0 | — | none |
| m05 | `recruiter` first contact | text "TalentStack Executive Recruiting…" on `conversation_closed:<src>` (SCN:~1524), thread opens on "Caller ID: …" | **incoming call** (`ring`, `callLabel: "TalentStack Executive Recruiting"`, `onMissed: "callback"`) | she phones the agent; the ink already reads as a call | SCN:1504-1530 mapping; `m05_phone_recruiter.ink:34-75` (`start`), the knots it reaches | yes: drop the narrated "Caller ID" line (the call screen shows it); keep the text as a follow-up only if the call is missed | ~45 new | A2, A6 | `safetynet/m05_insider_trading.md` (Recruiter section) |
| m05 | `recruiter` ring-back | `idle` choices "[Ring the TalentStack number back.]" / "It rings out." | **callable contact** (`call.knot: "return_contact"`, `when: "!globalVars.recruiter_line_dead"`, `unavailable: "no_answer"`) | the engine does the ring-back and the ring-out | `m05_phone_recruiter.ink:380-420` (`never_talked_terms`, `hangs_up`, `end_contact`, `idle`), `return_contact` | yes: `idle` loses the ring choices; "She hangs up first." / "The line goes dead." become the engine's call end (or stay as muted narration) | ~15 new | A5 | same |
| m05 | `patricia_phone` Patricia | text "This is my mobile. Ring me…" + thread with "[(Ring her. It rings out.)]" | text intro stays; **callable contact** for her hub | the sheet already says "She can be rung from your phone" (`m05_insider_trading.md:80`) | SCN:1535-1552; `m05_phone_patricia.ink:78-360` (`start`, `not_yet`, `no_answer`, `hub`, `phone_*`) | yes: call knot split from home; fake ring choices go | ~50 new | A5 | `m05_insider_trading.md:80, 213`: "rung" now means a call |
| m05 | `agent_0x99_handler` | 46 texts; KO relays | stays text | — | — | no | 0 | — | none |
| m06 | `agent_0x99_handler` | 81 texts; `on_satoshi_ko` | stays text; **one candidate call** for the writer (C9) | variety | writer picks | maybe | 0–10 | A2 | if used |
| m07 | `the_architect` taunts T-30 to T-1 | short texts that open `start`, which routes to `taunt_*` (SCN:1570-1630); ink narrates "Your handset lights without ringing. The call is already connected" (`m07_architect_comms.ink:97`) | **incoming voiced calls** (`ring`, `callLabel: "No caller ID"`, declinable, `onMissed: "drop"`) on the same globals; the countdown text stays a text | he calls; ringing fixes the old reason for texts (a forced call tore down terminals, `_comment` SCN:1574) | SCN:1570-1630 mappings become `ring` calls with `targetKnot` = each `taunt_*`; `m07_architect_comms.ink` `taunt_t30`…`taunt_t1`, `*_close`, `dormant`, `dead_air`, `parked` | yes: the "without ringing / already connected" narration (C6); decline wording if kept | ~60 new | A2 (C6: terminal look or call screen) | `safetynet/m07_architects_gambit.md` wherever the Architect's messages are described |
| m07 | `the_architect` `sign_off` | `phone-chat` mapping, not voiced (SCN:1631-1640) | **forced voiced call** (`voiced: true`, `ring` with `disableClose`, `autoAnswerMs: 0` or a few seconds) | the ink says "Your handset rings anyway." (`:399-401`) | SCN:1631-1640; `sign_off`, `signoff_close` | light | ~9 new | today (voiced) / A2 (ring) | none |
| m07 | `agent_0x99` | 54 texts | stays text | — | — | no | 0 | — | none |
| m08 | `agent_0x99` | 70 texts | stays text; **one candidate call** (C9) | the mole: texts fit a compromised channel, but one call at the reveal could land | writer picks | maybe | 0–10 | A2 | if used |
| m09 | `nightshade_phone` `call` | `phone-chat`, not voiced, `delayMs` 7000 on `flag1_submitted` | **incoming call** (`ring`; voiced) | a live call ("get off her line", "since before you picked up") | m09 SCN `call_map` ERB (`:123-470`) for nightshade; `m09_phone_nightshade.ink:19-31` | no (the `Agent HaX:` co-speaker line works as now) | ~7 new | today (voiced) / A2 (ring) | `safetynet/m09_digital_archaeology.md` where Nightshade's message is mentioned |
| m09 | `torres_phone` `call` | `phone-chat`, not voiced, 3 events | **incoming call** (`ring`) | "Are you safe?" / "Please be quick." | same ERB; `m09_phone_torres.ink:25-49` | no | ~8 new | today / A2 | same |
| m09 | `gary_phone` `call` | `phone-chat`, not voiced, `door_unlock_attempt` | **incoming call** (`ring`) | "It's Gary… HaX says you're stood at a keypad" | same ERB; `m09_phone_gary.ink:22-41` | no | ~7 new | today / A2 | same |
| m09 | the three `start` stubs ("[Ring back.]" → "The number rings out.") | ink-faked no answer | `call` with `when: "false"` and `unavailable: "no_answer"`, or simply no call button | engine does it | `m09_phone_*.ink` `start` | yes: drop the stub choice | 0 | A5 | none |
| m09 | `recruiter` `call`, `resume_name` | voiced, `disableClose`, re-rings | unchanged; optionally `ring` + `autoAnswerMs` (C8) | — | — | no | 0 | — / A2 | none (or the sheet's "answer the recruiter", `:360-362`, already fits) |
| m09 | `agent_0x99` voiced knots (`identity_scene`, `identity_resume`, `deck_resume`, `tesseract_call`) | voiced, forced | unchanged; optionally `ring` (C8) | — | — | no | 0 (2 re-key in A1: `:494`, `:506`; 1 more `:678`) | A1 | none |
| m09 | `agent_0x99` `start` ("Pick up. I'm ringing you." `:126`, "Take it when it rings." `:130`), `flag1_read`, `ledger_read`, `afterwards` | forced-open silent threads | `start`: rewrite as plain texts (the call it announces is the later voiced one) or make it the ring (C9); the forced-open `*_read` threads become texts with toasts (`sendTimedMessage` with `targetKnot`), so they stop interrupting | a forced-open silent thread is neither a text nor a call | m09 `hax_maps` ERB; `m09_phone_agent0x99.ink:118-330` | yes for `start` | 0 (texts) | today | `m09_digital_archaeology.md` if it says a thread pops open |
| m09 | `agent_0x99` `hour_read` | silent, forced; ink says "Text, not voiced." (`:588`) | becomes a text toast like the other `*_read` (same reason) | — | ERB | no | 0 | today | none |
| m09 | `hax_voice` (person speaker for HaX in `m09_briefing.ink`, 59 lines, in person at the Citadel; also `m09_sorensen_door/hatch`, `m09_noor_haddad`, `m09_alpha_recording`, `m09_closing_debrief` where she is "on the line", `:312`) | phone-line style | **in-person style** + `voice.callFx` for phone calls (C2) | the briefing is in a room | `scenario.json.erb:1011` voice block | no | ~84 re-key | A7 (`callFx`) / today (style only) | none |
| m10 | `agent_0x99` calls (`breach_call` … `gallery_open_call`, `cut_call`) | voiced | unchanged; optionally `ring` on the non-forced ones (C8) | — | — | no | 0 | — | none |
| m10 | `agent_0x99` `line_dead`, `jammed` | dead-line states in a silent thread | stay (they are the thread's dead state); optional: with a `call` block, `when` false gives a real "No answer" | — | `m10_phone_agent0x99.ink:63-73` | no | 0 | A5 (optional) | none |
| m10 | `victoria_line`, `vance_phone`, `elena_phone`, `ghost_phone` | voiced | unchanged; optionally `ring` on Victoria's (C8) | — | — | no | 0 (1 re-key in A1: `m10_ghost_phone.ink:146`) | A1 | none |
| m10 | `hax_post` (in person, forward post) | phone-line style (`voice.(:hax_phone)`, SCN:1611) | **in-person style** | she stands in front of the player; "I'm on your phone now" after the breach is intended (log) | SCN:1611 | no | ~12 re-key | today | none |
| m10 | `hearing` (HaX beside the player) | phone-line style (SCN:2486) | **in-person style** | in the hearing room | SCN:2486 | no | ~10 re-key | today | none |
| lab_social_engineering | `dev_service_desk`, `ruth_phone`, desk phone | contact-level voiced pretext call; Ruth texts | **unchanged** | deployed | — | no | 0 | — | none |
| lab_physical_pentest | `ruth_phone`; person `ruth` says "Call me on the phone if you get stuck." (`ruth.ink:72`) | hint texts | stays text; change "Call me" to "Message me" (C10) | it is a text hint line | `scenarios/lab_physical_pentest/ink/ruth.ink:72` | one line | 1 re-key (person-chat line) | today | none (no `lab_sheet_url`) |
| lab_tesseract_trials | `agent_0x99`, `ghost` | texts; Ghost `the_offer_call` video call | unchanged | short lab | — | no | 0 | — | none |
| sis01 | `ward_desk_phone` (Ravi Anand voicemail) | phone object with `voice` | stays voicemail | the incident message left overnight | — | no | 0 | — | none |
| sis02 | `marcus_webb`, `tom_hadley` | silent texts with "ring" wording ("Tell Tom to ring me", "[Marcus has signed it off. Ring him.]") | stays text; writer checks the ring wording reads as texts about calls | serious game; texts suit the site | `sis02_energy/ink/npc_marcus_webb.ink:139, 263, 279, 292`; `npc_tom_hadley.ink:143, 149` | maybe | 0 | — | `security_informed_safety/sis02_energy.md` only if wording the sheet quotes changes |
| sis03 | `james_whitworth`, `simon_hartley`, `robert_ngata` | silent texts, no `voice`; knots named `call_initial` | stays text; writer trims "call" framing in knot names/prose only if the prose reads as a meeting | no voices configured | `sis03_cyber_insurance/ink/npc_*.ink` | maybe | 0 | — | none (no `lab_sheet_url`) |

Person NPCs with remote-sounding ink that are correct as they are (a real call in the story, or an ordinary phrase): m04 debrief "Vance is on the line" (`m04_closing_debrief.ink:453`), m06 minder dialling, m03 Victoria "on the phone by the window", m09 Old Coyote "I'll call you back", m10 Tesseract "Netherton's still on the line" (he is), m02 receptionist and guard radios, sis02 Priya. No change.

### 7.3 Audio totals (estimates)

| Change | New | Re-key |
|---|---|---|
| A1 delivery notes (m09 ×4, m10 ×1) | 0 | 5 |
| m03 revelation call | 5 | 0 |
| m04 Vance | 65 | 0 |
| m05 Recruiter (call + ring-back) | 60 | 0 |
| m05 Patricia | 50 | 0 |
| m07 Architect taunts + sign-off | 69 | 0 |
| m09 Nightshade, Torres, Gary | 22 | 0 |
| m09 `hax_voice` style | 0 | 84 |
| m10 `hax_post` + `hearing` style | 0 | 22 |
| lab_physical_pentest one line | 0 | 1 |
| m06 / m08 optional calls (C9) | 0–20 | 0 |
| **Total** | **~271 (to ~291)** | **~112** |

Rewritten ink lines in the migrated calls will change some of these counts; the writer's slice reports the exact list before voicing (brief, Audio).

## 8. Part B: migration slices

Every migration slice has the same steps:

1. **Config** (implementer): the scenario keys in 7.2.
2. **Ink** (writer, a separate agent): rewrite only the knots named; follow 3.5 and README_ink_best_practices.md; compile; run `dialoguelint` and the validator.
3. **Checks**: validator 0 errors; `tts_mission_lines_test.rb` passes; the mission's existing node tests pass; the key diff for the mission lists only the lines the slice meant to add or re-key (write the list to the log).
4. **Live proof** on port 3023: drive the beat on the real path (the real event, the real phone), including a decline or no-answer where the beat has one, and a reload during the beat.
5. **Lab sheet** in the same slice: open the sheet named in 7.2, change every sentence that describes what the player does or sees for that beat ("texts you" → "rings you; answer it", "can be rung from your phone" → "tap the call button in her thread"). Commit in the HacktivityLabSheets repo with an explicit path. Never open `*-vm-technical-steps.md`; if a VM step is affected, log it for opus48.
6. **Audio** (after the user has the line count): `tts-audio` skill, top up the mission.
7. Commit (explicit paths), log the slice.

| Slice | Scope | Needs | Notes |
|---|---|---|---|
| M1 | m09 Nightshade, Torres, Gary: `voiced: true` now; `ring` once A2 is in | today (voiced); A2 | can ship voiced first, then add `ring` |
| M2 | Voice styles: m10 `hax_post`, `hearing`; m09 `hax_voice` (after C2 is decided) | today; A7 for `callFx` | first prove which NPC voices a person-chat "Agent HaX:" co-speaker line in m09 when `agent_0x99` and `hax_voice` share the display name (`phone-call-voice.js:319-322` picks the first registered character with a voice; check the person-chat and server `resolve` paths too, `tts_line_extractor.rb:293-338`) |
| M3 | m09 HaX forced-open silent threads → texts; `start` rewrite | today | interrupts less; check the mission's walkthrough still holds |
| M4 | m04 Vance callable | A5 | |
| M5 | m05 Recruiter incoming + ring-back; Patricia callable | A2, A5, A6 | the biggest ink rewrite; Recruiter state machine has playtest history (`start` comments) |
| M6 | m07 Architect taunts as calls; sign-off voiced | A2 (+ C6) | replay the T-30…T-1 timing tests; the debrief waits for `architect_signoff_done` |
| M7 | m03 revelation call | A2 | |
| M8 | Small wording: lab_physical_pentest Ruth line; sis02 ring wording; sis03 call framing | today | text only, except one person-chat line |
| M9 | Optional: m06 / m08 one call each; `ring` on legacy forced calls (C8, C9) | A2 | only if the orchestrator says yes |

Regression after every M slice: the 5.4 set plus the mission's own playtest walkthrough step for the changed beat.

## 9. Part C: open design questions

"User" marks a question that would change the story or the deployed lab: the orchestrator should put it to the user. The rest the orchestrator decides.

| # | Question | Recommended default | Reason | Who |
|---|---|---|---|---|
| C1 | Does a declined call have a story consequence by default? | No. Engine events only; a mission maps one where it wants it | keeps every caller's knot writing simple; the Recruiter is the one place a snub could matter | orchestrator |
| C2 | One HaX voice style plus `callFx` (re-keys every HaX line in every mission) or a separate in-person style only for in-person scenes (m09 `hax_voice`, m10 `hax_post`, `hearing`)? | Separate in-person style for those three only; `callFx` available but not applied to HaX | m02/m03 HaX lines were just regenerated under the phone style; a global change costs hundreds of clips for little gain. The m09 debrief's six "on the line" lines then sound in person, which the user may not want | **user** (cost and sound of the lead character) |
| C3 | Ringtone: a sourced CC0 mobile ringtone, the existing `desk_phone_ring`, or vibrate only? | Sourced CC0 ringtone (A8), vibrate as fallback | `desk_phone_ring` is an office desk phone, wrong for a handset | orchestrator |
| C4 | Do forced calls ring first (`autoAnswerMs`), or open at once as today? | Ring with a short `autoAnswerMs` (5–8 s) for new forced calls; legacy forced calls unchanged unless C8 | a beat to finish a puzzle; no tear-down mid-action | orchestrator |
| C5 | A separate Recents (call log) screen? | No: rows in the thread and a missed-call preview | one thread per contact is simpler and keeps context | orchestrator |
| C6 | The Architect: keep the terminal look for his calls (voiced typeout) and the "connects without ringing" signature, or ring like everyone else on the call screen? | Ring with "No caller ID" and open in his terminal look, voiced; rewrite the "without ringing" narration | the hijacked-handset look is his identity; ringing removes the old tear-down reason for texts | **user** (it changes how the antagonist's beats feel) |
| C7 | `ring` on video calls? | Not now (validator error) | m02's are player-started at a console; one lab use | orchestrator |
| C8 | Add `ring` to the existing m09/m10 forced calls? | No, except where a playtest shows the tear-down hurts | they work and were tuned; keys unchanged either way | orchestrator |
| C9 | Add a call to m06 and m08 (and turn m09 HaX `start` "I'm ringing you" into a real ring)? | m09 `start` yes (rewrite as text or ring, writer's call); m06/m08 only if the writer finds a beat | variety across the series without forcing it | orchestrator |
| C10 | lab_physical_pentest Ruth "Call me on the phone" | change to "Message me on the phone" | her phone contact is a text hint thread | orchestrator |
| C11 | A missed call from the handler (HaX) leaves what? | `onMissed: "callback"` plus a mapped text ("Ring me when you can.") | handler calls carry progress; the player must be able to get them back | orchestrator |
| C12 | Should a contact-level `voiced` contact (Dev) get a call button? | No. Dev is reached only through the desk phone and the pretext card | lab frozen; the lab teaches the desk-phone call | **user** only if anyone proposes changing it |
| C13 | Reload while ringing: missed, or ring again? | Missed with callback; forced calls ring again | a reload is a break; a missed call is what a real phone shows | orchestrator |
| C14 | Delivery notes on voiced calls now (5 re-keys) or later? | Now (A1) | small, and the rule "use `#delivery:`" otherwise doesn't work on calls | orchestrator |

Count: 14 questions; 2 for the user (C2, C6), 1 conditional (C12).
