# A2a review, round 1: the ringer as a pure module

Commit under review: `baadbe56f`. Files: `public/break_escape/js/minigames/phone-chat/phone-ringer.js` (cited as `ringer:N`), `phone-ring-config.js`, `test/js/phone-ringer.test.mjs`, `test/js/phone-ring-config.test.mjs`, `docs/agents/phone_calls/A2a_NOTES.md`.

Checked against plan 2.2, 2.3, 2.9, 2.11, 3.1, the A2a to A2c slices and C13, C24 to C29. Tests: `node --test test/js/phone-ringer.test.mjs test/js/phone-ring-config.test.mjs` gives 73 pass, 0 fail.

**Verdict: revise.** There are no blockers. The state machine follows the table closely and reads well. Seven M findings need fixing in the module before A2b wires it: most are cases where an adapter that throws, re-enters or reports late leaves the ringer stuck. Choices 2 and 4 should change.

## Row by row

| Row | Result |
|---|---|
| 1, 2, 3, 5, 6, 8 | Correct. Row 3 persists the trigger before the drop, as the row says. |
| 4 | Queued, ringing and held replacements are right. On a ringing replace, `answerSeconds` loses the old knot's ringing time (m4). |
| 9, 12, 13, 14, 15, 16, 17 | Correct. Row 13's second check yields to a queued scripted beat, which goes against principle 4 (M2). |
| 11 | Correct, except that `putAside` runs at Answer and again at the open, so a popup is closed during the 500 ms delay and is lost if the open never happens (m5). |
| 18 | Correct, with the toast and choice 1. |
| 19 | Correct for a falsy return. A throw is not handled (M1), and a refusal that never clears leaves an invisible held call that blocks every other call (M3). |
| 20, 21, 22, 23, 24, 29, 30 | Correct. Paused and queued time are excluded, the forced cap is 6 s, and `untilAnswered` never times out. Row 29 breaks on throttled hidden-tab timers (M4). |
| 25 | Correct bookkeeping. The reopen ignores `closed` (choice 2, wrong). |
| 26 | Correct. While the call waits out the quiet time, `callActive()` is false (m6). |
| 28 | Correct, plus choice 3. If a forced call is hit after `close()`, it is requeued for ever with a stale `connected` save (m2). |
| 32 | Correct. Whether `callEnded` runs synchronously is a problem for A2b (M5). |

**Room for the deferred rows.** A rewrite is not needed for any of them:
- **Row 7 (A6):** the callback clear fits in `startRinging` (`ringer:203`), and `onOutcome` gives A6 its trigger.
- **Row 10 (A3):** can reuse `putAside`/`reopen` as "close the phone, reopen it", with the panel routed behind `showBanner`.
- **Row 27 (A4):** needs a `restore(npcId, record)` entry (see M7). `offer()` alone re-persists the trigger and re-emits `phone_call_answered`.
- **Row 31 (A5)** needs a `drop` entry. A5 must also be able to set `connecting` for outgoing calls and callbacks, or `call_is_callback` can never be true (m7).

## Findings

### M1. An `openCall` that throws leaves the ringer `connected` for ever, and every scripted conversation behind it
`ringer:337-344`. `connecting` and `state: 'connected'` are set, then `openCall` runs with no guard. `startMinigame` calls `init()` and `start()` without a try (`minigame-manager.js:182-183`), so a phone-chat that throws in `init` propagates out of the `finishOpen` timer. After that:
- `o.opened` stays false, so `callActive()` returns true (`ringer:573`);
- `_scriptedCallBusy()` becomes true for the rest of the session once A2b wires it (2.9), so every legacy scripted conversation waits in the queue for ever;
- `active` stays set, so no other call ever rings.

The same class of failure exists for every adapter effect. A throwing `showBanner` in `render()` (`ringer:398`) skips `ensureTick()` (`ringer:399`), which stops the tick.

Fix: wrap every adapter call in the `call` helper (`ringer:68`) in try/catch and log the error. Treat a throw from `openCall` as a refusal (row 19). Add tests with a throwing `openCall` and a throwing `showBanner`.

### M2. Row 13's second check yields to a scripted beat queued during the open delay
`ringer:333` and `:427`, with the plan's `openBlocked()` term `_scriptedCallQueue.length > 0`. Answer emits `phone_call_answered` at once (`ringer:311`). A mapping on that event (3.1 recommends one for "effects that should wait for the call to be taken"), or any global set in those 500 ms, can start a legacy scripted conversation. The busy rule then queues it, because `callActive()` is true. At the second check, `openBlocked()` sees a non-empty queue, so the call goes back to `held`. `callActive()` turns false, the pump opens the scripted beat first, and the call the player has just answered waits behind it. Principle 4 and C27 say the reverse: a beat waits behind a call that is connected or opening.

Fix: at the second check (`finishOpen`), ignore the queue length and keep only `scriptedConversationActive()`, knockout and hits. One way is to pass a phase to the adapter, `openBlocked({ second: true })`. Add a plan note to 2.2 and a test: an offer is queued in the scripted queue during the delay, and the call still opens.

### M3. A refusal that never clears leaves an invisible held call blocking every other offer
`ringer:344`, `:425-427`, and choice 10. When `openCall` keeps returning null with nothing else open (an unregistered scene, a missing NPC, any refusal that is not transient), the offer stays `held`:
- it is retried every 2.5 s for ever;
- the pill is hidden because no minigame is open, so there is no Hang up;
- the hold timer doesn't run (`pillShowing` is false);
- `active` blocks every other offer, so the queue never drains.

Fix: count refusals. After a limit (say 5 retries, or `HOLD_MAX_MS` of real time since the first refusal), end a non-forced call as `dropped`, with the missed event and `onOutcome`. Give up on a forced call the same way. Test: `openResult: false` permanently, and a second contact's offer rings once the first is given up.

### M4. Throttled timers in a hidden tab turn hidden time into ringing or hold time
`ringer:142-149`. `advance()` gives the whole interval since the last advance to the state at its end. While the tab is hidden, Chrome runs timers at most once a second, and after 5 minutes once a minute for chained timers. Each hidden tick sees `isPaused()` true and throws its interval away. But the first tick after the tab is visible again counts the whole gap, up to 60 s, as unpaused. That can ring out a call (row 21), use up the hold limit (row 18) or push `answerSeconds` past 10. Row 29 says hidden time doesn't count. Laptop sleep and a system clock change behave the same way if the adapter passes `Date.now`.

Fix: cap `dt` at, say, `4 * TICK_MS` and drop anything larger as paused time. Have A2b pass `performance.now` and record `lastHitAt` on the same clock (the interface says "clock time", but `player-damage-interrupt.js` will choose its own clock in A2c). Test: a jump of 60 s in one step while ringing leaves the call ringing.

### M5. `callEnded` re-runs the table synchronously, which in row 32's main path is in the middle of `startMinigame`'s swap
`ringer:354-384`, `:382`. The notes say the adapter's end hook calls `callEnded`. In row 32 the call is ended by another minigame's `startMinigame`. Its `endMinigame` (`minigame-manager.js:69`) runs the end hook before the new minigame is installed (`:174`). At that moment `run()` sees nothing open and does two things:
- it starts ringing the head of the queue, applying its `setGlobalOnStart` and marking it started;
- in the row 26 forced case, it can show the banner.

The deferred start hook then requeues the offer (row 23). The result is a banner flash and a `setGlobalOnStart` applied for a call that then waits. This is the swap that 2.2 says hooks must defer past.

Fix: inside `callEnded`, do the bookkeeping synchronously (so `callActive()` and `connecting` are right before `drainDeferredBarks` at `minigame-manager.js:302`), and send the `run()` through `c.defer`. Add the same deferring-clock test as the hooks have.

### M6. `callEnded` matches by `npcId`, not by the call's id
`ringer:357`. A stale or duplicate end report for the contact closes the offer. Cases: a second `endMinigame` pass, a non-ringer phone-chat for the same NPC ending during the 500 ms delay, or a report arriving after a row 19 back-to-held. Inside the open delay (`!o.opened`), it ends a call that never opened. Fix: `callEnded(npcId, { id, endedByCall, callFinished })`, ignored unless `id === connecting?.id` (or the offer's last call id). The plan's end hook passes nothing (2.9, `onMinigameEnded?.()`), so A2b must pass the ending instance to read `params.ringerCall.id`, `_endedByCall` and `_callFinished` anyway. Note that in the A2b handover.

### M7. One `pendingCall` slot per contact, but two offers per contact: ending the first wipes the save of the second
`ringer:126-127`, `:228-232`, with choice 11 and 2.7's single `pendingCall`. Steps:
1. X is connected.
2. A new offer X′ queues behind it (row 5), and `save(X′)` overwrites X's record.
3. X ends, and `finishOffer(X)` calls `savePendingCall(X, null)`.

X′'s record is gone. Its trigger was persisted at offer (C28), so a reload loses the call completely, with no callback. The reverse order also loses a forced X: X′'s queued record replaces X's `connected` one, so a reload never re-rings X (C13).

Fix: `clearSave(o)` writes the record of the contact's other live offer if there is one, or null. Rule: `connected` outranks `queued`; when the connected one ends, save the queued one. Test both orders. For A4 also add `restore(npcId, record)`. It should not call `persistTrigger` or apply `setGlobalOnStart`, should keep `answeredEmitted` once `answerSeconds` is set, and should carry the `RERING_AFTER_LOAD_MS` wait.

### m1. Choice 2: no reopen once the ringer is closed
`ringer:367`. See the verdict below. Add `!closed` to the reopen condition.

### m2. A forced call ended by a hit after `close()` is requeued for ever with a `connected` save
`ringer:370-375`. Once `closed`, `runOnce` returns at once, so the offer never rings. It sits in `queue` and its `pendingCall` stays `connected`, which A4 would re-ring on reload after the ending. Fix: when `closed`, treat it as row 25 bookkeeping (finish and clear the save).

### m3. A re-entrant `close()` from the answered event leaves a stale save and an orphan timer
`ringer:309-316`. `emit('phone_call_answered')` runs before `save(o)` and `setTimeout`. A handler that ends the mission (credits on a global) calls `close()`, which drops the offer. `beginOpen` then re-saves it and starts a timer, which does nothing when it fires but leaves the `pendingCall` behind. Fix: set the state, save and start the timer first, then emit. Or return straight after the emit if `closed || active !== o`. Re-entrant `offer()` from `emit` in `declineOffer` and `miss` is safe (state is settled first, and `running`/`again` handles the inner `run()`).

### m4. A ringing replacement drops the old knot's ringing from `answerSeconds`
`ringer:511-517`. Row 4 restarts the ring, which is right for the timeout. But 2.11 counts "from the first ring to Answer". After 15 s on T-5 and 5 s on T-1, the player has waited 20 s while `call_answer_seconds` says 5, so a "took over 10 s" line (the user's requirement) never plays. Fix: carry `old.ringMs` into a separate `answerMs` that `answerOffer` uses, and keep `ringMs = 0` for the timeout.

### m5. The popup is put aside at Answer, not just before the open
`ringer:292-293`. If the open then fails and the call is never opened (`close()`, M3's give-up, a row 32 drop), the CyberChef or lab-sheet popup stays closed with no reopen. Fix: put aside only in `finishOpen` (`ringer:334`), which runs straight before `openCall` anyway. Or reopen `o.displaced` whenever an offer ends without opening.

### m6. Row 26: while the forced call waits out the quiet time, `callActive()` is false
`ringer:370-375` sets `active = null`. During the 4 s, `_scriptedCallBusy()` is false, so a legacy scripted beat can open in front of the forced call it interrupted. The beat then has to finish before the re-ring. Probably acceptable, but say so in 2.3 row 26, or keep `callActive()` true while a `rering` offer heads the queue.

### m7. Room for A5 and A6: `connecting` can only be set by the incoming path
`ringer:337`. `call_is_callback` comes from `connecting.isCallback`, which is always false, and outgoing calls exist only as the adapter's `outgoingActive()`. A5 should move dialling into the ringer, as `dial(npcId, knot, { callback })` reusing `beginOpen`/`finishOpen`/`callEnded` with `direction: 'outgoing'`, rather than keep a second owner of "connected". This is additive, but note it now in the A5 brief.

### m8. The open delay doesn't check the pause rule
`ringer:333`, `:427`. The pause menu (`.game-menu-overlay`) is not a minigame. A held call released by a hook just as the player presses Esc opens under the pause menu. Fix: hold the open while `isPaused()`, or add pause to the adapter's `openBlocked()`. Note it in 2.2.

### m9. Who persists the trigger
`ringer:484`. The ringer calls `persistTrigger(raw)`, and 2.7/A2b also set `triggered.persist = true` in `_handleEventMapping` (`npc-manager.js:1059`). Pick one owner in A2b. If it is the ringer, `raw` must carry the mapping key, and the adapter must accept the second call that M7's `restore` would otherwise make.

### m10. Tests that can't fail
Mutation checks on a scratch copy:
- making `answerOffer` overwrite `answerSeconds` on re-answer passes every test, because row 26 auto-answers both times and both give 6;
- removing choice 3's drop of the opening call (`ringer:540`) passes every test.

Fix: in row 26, answer the first ring by hand at 3 s and expect 3 on the re-ring. Add a row 28 test with `close()` inside the 500 ms delay. Other mutations I tried were caught (hit term, forced hold limit, replace's `answerSeconds`, nudge interval, hook retry, `callFinished`, voicemail toast, requeue at the head). The fake clock only advances in timer-sized steps, and nothing tests a throwing or re-entrant adapter (M1, M4, m3).

Most assertions are on adapter calls and `stateOf`. Some read `current().holdMs`/`ringMs` (`test:148-149`, `:179-188`, `:368-388`, `:634`). Those are internal fields; they are acceptable here because the hold-limit tests also check the outcome.

`phone-ring-config.js` matches 3.1 and 3.2 (defaults, warn-not-throw, a voicemail with no knot falling back to callback, the home-knot drop). No findings.

## The 11 choices

| # | Choice | Verdict |
|---|---|---|
| 1 | No rang-off toast with `onMissed: "voicemail"` until A6 | **Right.** Row 18 says the voicemail toast replaces it, and in A2a/A2c a voicemail caller can only come from a scenario written for A6. Add a line to the A6 brief so the voicemail toast lands in this branch of `miss()` (`ringer:263`). |
| 2 | Row 25 reopens the popup while the ringer is closed | **Wrong.** Closed means the ending has started: "End the mission now" was confirmed or the credits started. Usually the debrief is queued and `openBlocked()` already drops the reopen. When it isn't (credits from a music event, or an aim's last task), CyberChef or the lab sheet comes back over the ending. Nothing after the ending needs the tool. Make the reopen require `!closed` (m1). |
| 3 | `close()` drops a call in its 500 ms open delay | **Right in outcome**, though 2.2 defines `connected` as "open (or opening)", so the plan text says the opposite. Opening a call after the ending has begun is worse than dropping one the player has just answered. Record it as a plan clarification on row 28 and add the missing test (m10). The drop should also count as "ended without opening" for m5. |
| 4 | First `untilAnswered` vibrate at 30 s | **Wrong.** 2.4 has `phone_vibrate` in every ring cycle, so at 20 s the handset switches from ring-and-vibrate to vibrate only. A first buzz at 30 s leaves 10 s of silence with the banner up, which reads as the caller having given up. Set the first nudge at `RING_TIMEOUT_MS` (`ringer:210`, `:465`), then one every 10 s. |
| 5 | Replacement applies its own `setGlobalOnStart` once, when it takes a ringing or held place | **Right.** |
| 6 | `RETRY_OPEN_MS` 2 s on the tick, at once on a hook | **Right.** The plan names no interval; 2 s (2.5 s with the open delay) is a fair rate. Not enough on its own: add M3's give-up. |
| 7 | Row 26 re-ring after `HIT_QUIET_MS`, resume, saved `answerSeconds`, auto-answer, no second answered event | **Right.** See m6 for the gap while it waits, and m10 for the test that can't fail. |
| 8 | Row 32 forced: own-path or `callFinished` is row 25, else row 26 | **Right**, and as 2.5 says. |
| 9 | `callVariablesFor` asks `adapter.openCallId()` | **Right.** It is the third test of 2.11, with one getter. |
| 10 | Hold timer counts only while the pill shows | **Right** by row 18's wording. On its own it lets a held call with nothing open live for ever (M3). |
| 11 | A connected call is not an offer for the one-per-contact rule | **Right** by row 5. It breaks the single `pendingCall` slot (M7). |

## Adapter interface against the existing code (for A2b)

The interface can be wired. What A2b will have to work around:

- **End hook.** 2.9's `onMinigameEnded?.()` passes nothing, so the adapter can't tell that the call ended or read `_endedByCall`, `_callFinished` or the call id. Pass `ending` from `endMinigame` (`minigame-manager.js:222`) to the hook. The adapter calls `callEnded` with the id (M6) and must defer the re-check (M5).
- **Queue race.** The scripted pump (`npc-manager.js:772-786`) and the ringer both poll. The busy rule and the ringer's queue term keep them from deadlocking: a held call yields to the queue, and a queued beat waits for a connected call. The one exception is M2.
- **`startMinigame` returns null** for an unregistered scene or a knocked-out player (`minigame-manager.js:43-55`), which fits row 19. It can also throw from `init`/`start` (`:182-183`), which needs M1.
- **`_scriptedCallBusy` split** (`npc-manager.js:742-750`) can move as written. The ringer never reads `_scriptedCall`, as C30 asks.
- **Clock.** Pass `performance.now`, `setTimeout`, `clearTimeout` and `queueMicrotask`. Record `lastPlayerHitAt` on the same clock (M4).
- **Paths.** `persistTrigger`: pick one owner (m9). `savePendingCall`: see M7.
