# Engine follow-up sweep

The post-M-slice engine clean-up. Branch `build/phone-calls`. Each item has unit tests that fail
before and pass after. Only engine files, their tests, the validator, this file and the log are
touched. `lab_social_engineering` is untouched.

## What changed

### 1. `conversation_closed:<npc>` fired twice after a call
A call placed from, or answered over, the same contact's own thread closed the phone with
`_closingForCall` (its own `conversation_closed` suppressed), and the call's own phone-chat emitted
`conversation_closed:<npc>`. When the phone was not reopened (a scripted beat queued behind it, e.g. a
bring-in debrief), `phone-ringer-dom.js` `dropDisplaced` emitted a second one for the displaced
thread. Plan 2.5 says once.

Fix (`phone-ringer-dom.js`): `putAside` tags the phone descriptor with `callNpcId` (the call's
contact); `dropDisplaced` skips the emit when `d.thread === d.callNpcId`, because the call already
emitted it. A displaced thread for a *different* contact (row 10: a call to Y answered over X's
thread) is still owed its event, so A3 R1 M1 is kept — exactly one event per displaced thread.
Test: `test/js/phone-displaced-emit.test.mjs`.

**Scan of `conversation_closed:` mappings on a ringable or callable contact.** Every one is guarded by
`onceOnly: true` and/or a latch (`setGlobal` + `!globalVars.<latch>` in the condition), so none relied
on the double fire; with `onceOnly` the second emit is a synchronous no-op, and a latched handler's
second run is a no-op too. Ring mappings are safe regardless (the ringer drops a duplicate same-knot
offer, row 3). **No mission file needs changing.** The mappings found:
- m01 `conversation_closed:agent_0x99` (`:783`): onceOnly + latch `m01_tour_sent`.
- m04 `conversation_closed:robert_vance` (`:882`, `:1546`): onceOnly + latches `rfid_guide_offered`, `vance_phone_available`.
- m09 `conversation_closed:agent_0x99` (call_map `:172` ring, `:976` Nightshade ring latch `nightshade_rang`, `:240` text read-out, latched by M3).
- m10 `conversation_closed:agent_0x99` (`:2411`): onceOnly + condition latch `!victoria_line_done`.
- m05 Recruiter rings on `conversation_closed:{patricia_morgan,patricia_phone,agent_0x99_handler}` (latch `recruiter_texted`, and `mission_complete` guard per A5 R1).
- Non-call contacts (debrief/briefing cutscenes, in-person NPCs, music triggers, `waitForEvent`) are unaffected: they are never displaced by a call.

### 2 / M1 m4. A "(Close.)" stub posted a player bubble
`phone-chat-minigame.js` `handleChoice`: a choice whose whole text is one pair of parentheses
(`/^\s*\([^()]*\)\s*$/`, the lesson-21 `(Close.)` / `(Ring back.)` home stub) no longer posts a sent
bubble or plays the sent sound. The choice is still taken (cleared, made in the story). Test:
`test/js/phone-player-lines.test.mjs`.

### 3. A5 n-1: the Call-button cleanup test could not see the listener removed
`test/js/phone-call-button-refresh.test.mjs` now asserts the dispatcher's `global_variable_changed:*`
listener count is 0 after `cleanup()` (pins K8), and that the watch does nothing while a dial is in
progress (`this.conversation` null) without being removed (pins K7). No engine change.

### 4. A5 n-2: a refused dial left a dead button press
`phone-chat-minigame.js` `_pressCall`: when `placeCall` returns false, it checks whether the contact is
still callable (`callButtonFor` non-null). If so (the dial was refused — a connected or held call, a
paused scene, a knockout — while the entry still applies), it shows a "Can't call right now" toast; if
not (the entry went away), it hides the button with no toast. Test: `phone-call-button-refresh.test.mjs`.

### 5 / A6 n-e. A lines-less voicemail knot overwritten by the intro preload
Checked the real game: every `voicemailKnot` in the shipped missions (m07's six Architect voicemails)
produces `voice:` lines, so the overwrite does not happen in play. It needs a voicemail knot that only
sets VARs on a contact the player has never texted. Fix is preventive, in the validator
(`scripts/validate_phone_calls.rb`): a warning when a voicemail knot (and the knots it reaches)
produces no `voice:` line. No engine change. Tests in `validator-phone-calls.test.mjs`.

### 6. A7a validator nits
- Plan 4.3's call-me bullet (`PHONE_CALLS_PLAN.md:626`) rewritten for the wider promise pattern (R2's wording).
- `scripts/validate_phone_calls.rb` `carry_over_name`: the comment now states it mirrors the engine
  model `CarryOver.import_name`, and why it differs from `validate_scenario.rb`'s `carry_over_import_name`
  (blank handling). The "phone me" positive and the `importedGlobals` branch already have tests.

### 7. `ring.callbackWhen`: a condition that clears a stale callback (new author field)
Problem (M4 R1 n4, live): after a decline the "Call back" button keeps dialling the ring's knot even
when a later state change (m04: the ESD goes live) makes that knot out of date, and no config could
clear the pending callback.

Field: **`ring.callbackWhen`** — a condition string (`globalVars.*` terms joined by `&&`, the same
grammar as `call.when`), under which a callback left by this missed call is still worth placing. It is
re-checked when the "Call back" button is built and as the callback dials; a failing condition clears
the callback quietly (no row, no event). Example:

```json
"ring": { "onMissed": "callback", "callbackWhen": "globalVars.esd_authorized !== true" }
```

Implementation: `normaliseRing` and the ringer carry it; `setCallback` stores it **in memory only**
(the save still writes just `{ knot, state, onMissed, callLabel }`, so the game save is unchanged and a
reload restores the callback with no condition — the re-check then passes, as before). The adapter
(`phone-ringer-dom.js` `liveCallback`) evaluates it via `callConditionHolds` in `callButtonFor` and
`placeCall`, and calls the new `clearStaleCallback` when it fails. Validator checks it like `call.when`.
Tests: `phone-callback-ringer.test.mjs`, `phone-ring-config.test.mjs`, `validator-phone-calls.test.mjs`.
**The m04 fixer wires `ring.callbackWhen`; this sweep does not edit m04.**

### 8. The ringer re-checks a ring mapping's condition while queued or ringing
Problem (M4 R2 n1, live): the ringer never re-checked a ring mapping's condition, so a call that was
valid when offered still rang after the state changed (m04: the ESD goes live while HaX's dial ring is
queued or ringing, then leaves "Got your reading. Ring me back." after "Press it.").

Like a held bark, the ring offer now carries the mapping's `condition` (`ringCondition`), and the
ringer re-checks it: when a queued offer comes up to ring, when a held offer would open, and on each
tick while ringing. If it no longer holds the offer is **dropped quietly** — no "Missed call" row, no
`phone_call_missed`, no callback or voicemail; a popup it put aside comes back. **A forced call is
exempt.** Only a condition made entirely of `globalVars.*` terms is re-evaluated (the state that can
change under a pending ring); a condition that reads event data is left ringing, because the original
event is gone (`NPCManager.ringConditionHolds`, the safe-false rule). This needs no new author field:
it uses the mapping's existing `condition`. Tests: `phone-callback-ringer.test.mjs`.

### 8b. The item-8 re-check dropped self-latching rings (M5 R2 blocker) — DONE (commit `88862563c`)
A ring mapping's own `setGlobal` runs at offer time (`_handleEventMapping`) and flips a term in its own
`condition` — a latch like `recruiter_texted`, `revelation_ring_offered`, `nightshade_rang`,
`torres_rang` — so item 8's re-check dropped the ring on its first tick: the Recruiter's first call never
rang and left no Missed row (m05 games 2166, 2161). Fix: `NPCManager._ringRecheckCondition(condition,
setGlobal)` drops any `&&` term reading a variable the same mapping writes and carries only the rest as
`ringCondition`; a non-self term going false still drops the ring (item 8 preserved). Test:
`phone-ring-self-latch.test.mjs` (the m05, m03 twin and m09 shapes, plus the still-drops case).

### 9. Tutorial hold has a 20 s limit — DONE
From M8 R2 M1. The tutorial-panel ring hold (`ringBlocked()` in `phone-ringer-dom.js`, commit 916104732)
held every ring for as long as the step panel was left idle. Now:
- The opening accept/skip modal (`promptOpen`) holds the ring fully, no timer.
- While a step panel shows (`active`, not `promptOpen`), the ring is held for at most `TUTORIAL_HOLD_MS`
  (20 000 ms) of unpaused time from the offer, or until the current step completes (TutorialManager's
  `currentStep` changes) or the tutorial ends, whichever first. Forced calls follow the same rule.
- When it rings while a step still shows, the banner drops to the bottom (`#phone-ring-layer.under-tutorial`,
  `phone-ring.css`), clear of SKIP TUTORIAL and the step counter.

Implementation: `tutorialShowing()` is gone from `adapter.ringBlocked`; the adapter exposes
`tutorialPromptOpen()` and `tutorialStep()`. The ringer's `tutorialHold(o)` decides the hold per offer,
`advance()` accrues unpaused `tutHoldMs` while `tutHolding`, and `runOnce` consults it on the queued head
and on a ringing offer a step came up behind. Const `TUTORIAL_HOLD_MS` in `phone-ringer.js`. Tests:
`phone-ring-tutorial.test.mjs` (modal full hold; 20 s then rings; step-complete and tutorial-end release;
forced; a step starting mid-ring; no manager).

### 10. Terminal-look calls close too fast — DONE
From M6 R1 M2. In the terminal look there is no call screen and no "Call ended" beat, so `#exit_conversation`
closed the phone at once and the last line of every Architect call showed for under 50 ms.
`_completeRingerCallWithBeat` (`phone-chat-minigame.js`) now, when `showCallEnded()` is false, holds a read
beat (`TERMINAL_CALL_END_READ_MS` = 2600 ms, in `phone-call-lock.js`) before `complete(true)`, and where
the last clip is still playing it waits for it to finish first (`_waitForCallClipThen`, polling `isPlaying`).
The handset "Call ended" beat is unchanged. Test: `phone-call-terminal-beat.test.mjs`.

### 11. A withheld terminal caller's thread look — VERIFIED (config + docs), engine unchanged
From M6 R1 m2. The look is decided once per phone session in `init()` via `resolvePhoneApp`
(`theme = app?.theme || params.theme || npc.phoneTheme`). A contact with `phoneTheme: "terminal"` resolves
terminal for its own call (the ringer passes `theme: npc.phoneTheme`) and for a phone opened on that
contact's thread; a phone opened on the contact list resolves from the device `app` or the first contact,
so setting one withheld caller's `phoneTheme` does not change the device/contact-list look ("the look
belongs to the device"). The m07 fixer sets the field; README "Voiced phone calls" now documents the call
look / `phoneTheme`. Test: `phone-theme-withheld.test.mjs`. **Note for the orchestrator:** the theme is
per-session, so a thread opened *within an already-open device-look session* (tapping the contact in the
list) stays in the device look — matching the review's "the look belongs to the device". A true per-thread
re-theme (device list normal, his thread terminal in one session) would be a larger, render-verified change;
not done here. His calls and a phone opened directly on his thread are terminal.

### 7b. A reload lost a restored callback's `callbackWhen` — DONE
Item 7 kept `callbackWhen` in memory only (the save format is unchanged), so a callback restored after a
reload lost its stale-clear condition and a stale "Call back" never cleared. `NPCManager._ringCallbackWhenFor
(npc, knot)` recovers it from the live ring config by knot, and `_resumePendingCall` attaches it to the
restored callback/live rec before `restoreCallback`, which now passes it to `setCallback`. Save format
unchanged. Tests: `phone-callback-restore-when.test.mjs` (array and object eventMappings, and no-config).

## Author-visible docs
`README_scenario_design.md` "Voiced phone calls" documents `ring.callbackWhen` (item 7, now with the
reload recovery, 7b), the condition re-check (item 8), the tutorial-hold row in the "what the player
sees" table (item 9, 20 s rule), and the call look / `phoneTheme` with the terminal read beat (items 10,
11). The `callbackWhen` line now states the condition is recovered from the config after a reload.

## New exposed engine surface
- `phoneRinger.clearStaleCallback(npcId)` (pure ringer): drop a callback whose `callbackWhen` failed and save the empty slot.
- `phoneRinger.dropDisplaced` (adapter): exposed on the returned object for the item-1 test.
- `NPCManager.ringConditionHolds(cond)`: the safe-false re-check of a ring mapping condition.
- `NPCManager._ringRecheckCondition(cond, setGlobal)`: the condition slice item 8 re-checks, minus the mapping's own latch (8b).
- `NPCManager._ringCallbackWhenFor(npc, knot)`: the ring config's `callbackWhen` for a knot, for the reload recovery (7b).
- Ringer adapter `tutorialPromptOpen()` / `tutorialStep()`; ringer `TUTORIAL_HOLD_MS` and per-offer `tutHold*` (item 9).
- `TERMINAL_CALL_END_READ_MS` (`phone-call-lock.js`) and `PhoneChatMinigame._waitForCallClipThen` (item 10).
No new static import was added (item 10 adds a named export to `phone-call-lock.js`, already imported), so no test harness copy list changed.
