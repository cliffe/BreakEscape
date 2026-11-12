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

### 9. Tutorial hold has no limit — NOT DONE, open work
See `HANDOVER_ENGINE_SWEEP.md`. The tutorial-panel ring hold (`ringBlocked()` in `phone-ringer-dom.js`,
commit 916104732) holds every ring for as long as the player leaves the step panel idle. The decided
rule (hold fully for the opening prompt modal; while the step panel shows, hold at most 20 s of
unpaused time from the offer, or until the step completes / the tutorial ends; forced calls follow the
same rule; banner clear of SKIP TUTORIAL and the step counter) is designed but not implemented here.

## Author-visible docs
`README_scenario_design.md` "Voiced phone calls" documents `ring.callbackWhen` (item 7) and the
condition re-check (item 8). Item 9's "Nothing rings yet" table note is open with item 9.

## New exposed engine surface
- `phoneRinger.clearStaleCallback(npcId)` (pure ringer): drop a callback whose `callbackWhen` failed and save the empty slot.
- `phoneRinger.dropDisplaced` (adapter): exposed on the returned object for the item-1 test.
- `NPCManager.ringConditionHolds(cond)`: the safe-false re-check of a ring mapping condition.
No new static import was added, so no test harness copy list changed.
