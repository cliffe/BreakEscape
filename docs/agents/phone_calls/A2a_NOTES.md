# A2a notes for the reviewer

Module: `public/break_escape/js/minigames/phone-chat/phone-ringer.js` (adapter and clock interface in its header comment). Config: `phone-ring-config.js`. Tests: `test/js/phone-ringer.test.mjs` (names start `row N`), `test/js/phone-ring-config.test.mjs`. `bin/test-js` picks up every `test/js/*.test.mjs` by glob, so no registration was needed. The tests load the modules through a data URL (no imports, so no copy list).

## Rows covered

1, 2, 3, 4, 5, 6, 8 (offers); 9, 11, 12 (answering); 13 to 19 (hold, opening); 20, 21 (including `untilAnswered`), 22, 23, 24 (missing); 25, 26, 28, 29, 30, 32 (calls and their end). `callActive()`, `callVariablesFor()` and the `answerSeconds` bookkeeping (2.11) are in.

## Rows not covered (by slice column)

- Row 7 (pending callback cleared at ring): A6. No callback exists in A2a.
- Row 10 (answer inside the player's phone): A3. Until then the adapter reports an open phone-chat as a non-conversation minigame, so it is row 12.
- Row 27 (reload): A4. `onGameLoaded()` only re-checks.
- Row 31 (outgoing call drops the offer): A5. `adapter.outgoingActive()` only blocks ringing and makes `callActive()` true.
- At rows 20, 21, 25, 32 the ringer emits, clears the offer and calls the optional `adapter.onOutcome(kind, offer, extra)`; it adds no thread row and no callback. `onOutcome` is my addition so A4 and A6 have a place to attach; kinds: `declined`, `missed`, `rang_off`, `ended`, `dropped`.

## Questions and my choices

1. **Row 18 toast with `onMissed: "voicemail"`.** The text says the voicemail toast replaces the rang-off toast, but voicemail is A6. Choice: show no toast in that case now; A6 adds the voicemail toast.
2. **Row 25 reopen when the ringer has closed (row 28).** Revised in R1: no popup reopen once the ringer is closed. Closed means the ending has started and nothing after it needs the tool.
3. **Row 28 and a call in its 500 ms open delay.** Revised in R1 to match plan 2.2 ("connected" includes opening): `close()` leaves it alone, it opens and finishes normally. The second check ignores `closed`; if it fails after the ending began, the call is dropped silently.
4. **Row 21 first `untilAnswered` nudge.** "After RING_TIMEOUT_MS ... vibrates once every UNTIL_ANSWERED_NUDGE_MS" can mean the first vibrate at 20 s or at 30 s. Revised in R1: the first vibrate is at 20 s, when the loop stops (2.4 vibrates in every ring cycle), then one per 10 s.
5. **Row 4 and `setGlobalOnStart`.** The replacing offer's `setGlobalOnStart` is applied when it takes a ringing or held place (it has "started" from the player's view), or at its own first ring when it replaces a queued one. Each offer applies it at most once; a requeue (rows 23, 24) or a re-ring (row 26) does not repeat it.
6. **Row 19 retry rate.** When `openCall` returns falsy, the tick retries no sooner than `RETRY_OPEN_MS` (2 s); a hook retries at once. Without this the 250 ms tick would call `startMinigame` every 750 ms against a scene that refuses it. The plan names no interval.
7. **Row 26 hit window.** The re-ring waits for `HIT_QUIET_MS` since the last hit (the queued offer carries a `rering` flag), then rings with `resume` and the saved `answerSeconds` and auto-answers `AUTO_ANSWER_MS` later. `phone_call_answered` is not emitted a second time.
8. **Row 32 forced call.** Follows 2.5: a forced call closed without an own-path end is row 26; with `callFinished` it is row 25. Non-forced is a miss with no toast.
9. **Who owns the "connecting" record.** `callVariablesFor` asks `adapter.openCallId()` (the open minigame's `params.ringerCall.id`) for the third test of 2.11, so the adapter needs that one getter.
10. **Hold timer only counts while the pill shows** (held, a non-conversation minigame open, no conversation, not knocked out). When a call is held with nothing open (a hit in the quiet window, or a refused open) the hold limit does not run; row 18 says "with the pill showing".
11. **Offers per contact.** A contact's connected call is not an "offer" for the one-per-contact rule: a new offer for a connected contact queues behind it (row 5), and a further offer for that contact then replaces or is dropped against the queued one (rows 3, 4).

## Adapter notes for A2b

- `adapter.ringBlocked()` and `adapter.openBlocked()` are the world halves. The ringer adds its own terms (another offer active, outgoing call, closed, hit quiet time) in the public `ringBlocked()` and `openBlocked()`.
- A ringing offer goes back to the queue whenever `adapter.ringBlocked()` turns true (rows 23, 24, and in A2b any open minigame). A2b's "any minigame blocks" rule is therefore one predicate; A2c relaxes it in the adapter without touching the ringer.
- Hooks (`onMinigameStarted`, `onMinigameEnded`, `onPopupClosed`, `onGameLoaded`) defer their re-check through `clock.defer` (pass `queueMicrotask`).
- Row 25/32 input (R1): `callEnded(npcId, { id, endedByCall, callFinished })`. `id` is the `params.ringerCall.id` of the minigame that ended; the ringer ignores any other id, so a stale or duplicate report, or one for another phone-chat of the contact, does nothing. `minigame-manager.js` must pass the ending minigame to the end hook (2.9's `onMinigameEnded?.()` passes nothing); the adapter reads `params.ringerCall.id`, `_endedByCall` and `_callFinished` off it. The ringer does its bookkeeping inside `callEnded` and defers the re-check and the popup reopen through `clock.defer`, so the adapter calls it straight from the end hook, mid-swap.
- `adapter.openBlocked(info)` gets `{ second: true }` at the check after the 500 ms delay. For that call it must leave out the `_scriptedCallQueue.length > 0` term (a beat queued by a `phone_call_answered` mapping waits behind the call). Plan 2.2 `openBlocked()` needs this note.
- **Trigger persistence has one owner: `_handleEventMapping` (A2b), as 2.7 says.** The ringer has no `persistTrigger`. Why: the mapping key is there and not in the ringer's offer; the ringer would otherwise persist on every `restore` (reload) and on a retried offer; and a refused offer (ringer closed) has still fired its mapping. A2b sets `triggered.persist = true` before it calls `offer()`.
- Save slot (changed in R5 M2, see "R5 changes"): `savePendingCall(npcId, slot|null)` is written after every change. A4 persists the slot as given.
- `restore(npcId, record)` is the entry for A4's reload (row 27, forced calls): re-queues the record to ring `RERING_AFTER_LOAD_MS` later with `resume` and the saved `answerSeconds`, without `setGlobalOnStart`, a second `phone_call_answered`, or a trigger. Non-forced records (`slot.live`) are A4's to turn into `missed`; `restore` ignores them. `restore` takes the whole slot (R5 M2).
- A refused open is retried every `RETRY_OPEN_MS` and given up after `MAX_OPEN_REFUSALS` (5) refusals over at least `GIVE_UP_AFTER_MS` (8 s): `phone_call_missed`, outcome `dropped`. A throw from `openCall` counts as a refusal. A popup the call had put aside is reopened on give-up.
- Clock: pass `performance.now`, record the hit time on the same clock. `advance()` drops any step over `MAX_ADVANCE_MS` (1 s) as paused time (hidden-tab throttling, sleep).
- The pause menu holds the open (the ringer checks `isPaused()` itself before it opens).
- `putAside` now runs only at the open (just before `openCall`), not at Answer.
- Row 26 gap: while the forced call waits out `HIT_QUIET_MS`, `callActive()` is false, so a legacy scripted beat can open in front of it. Kept: making it true would deadlock, because `ringBlocked()` yields to a queued beat and the beat would wait on the call. Say so in plan 2.3 row 26.
- For A5: dialling is not in the ringer yet. `call_is_callback` is always false until A5/A6 move dialling in (a `dial(npcId, knot, { callback })` reusing `beginOpen`/`finishOpen`/`callEnded` with `direction: 'outgoing'`). For A6: the voicemail toast goes in the `onMissed === 'voicemail'` branch of `miss()`.

## R2 changes (for the orchestrator and A2b)

- **Plan row 4 / row 5 rule (M1, orchestrator decision), for copying into 2.3.** A forced offer is never replaced, from the moment it is offered until it ends (R4 M1; before R4 it was protected only after its first connect): queued, ringing, held, connected, or waiting to ring again after a hit (row 26) or `restore()`. A new offer for that contact, whatever its knot, queues behind it (row 5); the same knot as the waiting call is dropped (row 3). No ringing time or `answerSeconds` carries over between offers: the queued offer starts with its own. Row 4's replace applies only to the contact's ringing, held or queued non-forced offer, which is the m07 countdown case.
- **M2 backstop.** If an opened call's `callMinigameOpen()` is `false` (not `undefined`) for `CALL_GONE_AFTER_MS` (1.5 s, six ticks) with no end report, the ringer ends it as a non-own end: row 26 if forced (the player did not choose to close it, and a forced call must come back), row 32 otherwise (the story position may not have been reset, so not row 25 and no popup reopen). 1.5 s spares a minigame swap. The 500 ms open delay is not covered because the check applies only once `opened` is true and the timer restarts whenever the call is seen open. The backstop also runs after `close()`.
- **A2b must call the end hook from a `finally`** around `minigame-manager.js` `:270-303`, so a throwing `onComplete` or the N-02 stray guard cannot skip it. A2b should also have `openCall` end a half-built minigame if it throws. Do not rely on the backstop for the normal path.
- **m1.** `restore()` gives the record `saveAs: 'connected'`, queues it ahead of any other offer for the contact (which then waits behind it, row 5), drops a second restore for a contact that already has a connected or waiting forced call, and keeps `opening` (it is in `record()` and `makeOffer`).
- **m2.** A popup the call put aside returns on hang-up, on a hold-limit rang-off and on give-up, if the ending has not started and nothing blocks it. At row 26 the descriptor is kept, so it returns when the re-rung call finally ends. After `close()` it stays closed.
- **m3, single-clock rule for A2b.** `lastHitAt()` must be on the same clock as `clock.now()`. Pass `performance.now` and convert `player-damage-interrupt.js`'s `Date.now` stamp (`lastDamageCloseAt`) in the adapter (`performance.now() - (Date.now() - stamp)`). The ringer now also ignores a stamp ahead of the clock.
- **m4.** Tests for the give-up floor, the refusal count and the reset after a successful open.

## R3 changes (for the orchestrator and A2b)

- **M1, protection for the life of the call.** A forced call gets `keep` (a flag separate from `saveAs`) when it is first sent back to ring again (row 26) and when `restore()` brings it back. It lasts until the call ends. `offer()` never replaces a `keep` offer in any state (queued, ringing again, held, requeued by rows 23/24): the same knot is dropped, another knot queues behind it with its own timing. `rank()` puts a `keep` offer above a connected non-forced call.
- **m1.** A restored forced call keeps the save slot when the contact's other offer connects (rank 4 against 3).

## Adapter notes for A2b: the ringer's phone-chat (M2, orchestrator decision)

Applies only when the phone-chat has `params.ringerCall`. lab_social_engineering's pretext calls and every existing text thread stay exactly as they are.

- The × is labelled "End call". It runs the End path (`closeConversation()`), which sets `_endedByCall`, so the adapter reports `callEnded(npcId, { id, endedByCall: true })`: row 25, the player hanging up. It is never row 32 (missed) and emits no `minigame_failed`.
- No Cancel button: pass `showCancel: false` in `openCall` for a ringer call.
- "Add to Notepad" is hidden while the call is connected. Without it, `startNotesMinigame` would replace the call (row 32) and `returnToPhoneAfterNotes` would reopen a plain phone-chat carrying a stale `ringerCall`.
- The ringer needs no new flag for this: `endedByCall` already separates row 25 from row 32 (test `R3 M2`). The adapter must use the `npcId` it put in the call's params at `openCall`, since `ringerCall` carries only `id`.
- Add these cases to `phone-outgoing-call.test.mjs`, including that a phone-chat without `ringerCall` still shows Cancel and Add to Notepad.
- Esc on a ringer call (R4 m2): the phone's own Esc handler and the base handler (`base-minigame.js:72-81`, `complete(false)` unless `disableClose`) both fire on one keypress. For a phone-chat with `params.ringerCall`, Esc must go through End call (row 25, `closeConversation()`) and must not reach the base `complete(false)`, so a hang-up never emits `minigame_failed`: remove or bypass the base Esc listener in `start()` for these calls. Add an Esc case to `phone-outgoing-call.test.mjs`. lab_social_engineering and text threads keep the base behaviour.

## R5 changes (for the orchestrator, A4 and A2b)

- **Save slot shape (M2, orchestrator decision), for A4 and plan 2.7.** `savePendingCall(npcId, slot|null)` gets `{ forced: [record, ...], live: record }`, plain JSON. `forced` is every forced offer of the contact (every `keep` entry) in play order: the active one first, then the queue. `live` is the contact's single most live non-forced offer (connected, then ringing or held, then queued) and is absent when there is none. `slot` is null when the contact has no offer. A record is `{ knot, state, disableClose, resume, onMissed, voicemailKnot, withheld, untilAnswered, callLabel, opening, answerSeconds, setGlobalOnStart? }`; `setGlobalOnStart` appears only for a call that has not rung yet.
- `restore(npcId, slot)` re-queues every `forced` entry in order, ahead of any other offer for the contact. An entry whose `state` is `queued` comes back as a fresh forced offer (rings once, applies its `setGlobalOnStart`); any other state rings again with `resume` and the saved `answerSeconds`, no `setGlobalOnStart`, no second answered event. It returns the state of the first restored call, `refused` for a slot with no forced entry, `dropped` if the contact already has a connected call or an earlier restore. The old single record (one with a `knot`, no `forced`) is still accepted as one forced entry. A4 turns `slot.live` into a missed call before or after calling `restore`.
- **M1.** An offer whose knot matches any forced offer of the contact (first or not) is dropped, forced or not.
- **m1.** `restore()` is no longer dropped by a fresh forced offer on another knot. It goes ahead of it. It is dropped only by a connected call or an earlier restore (the offer's `restored` flag).
- **m2 rule, for copying into plan row 5 (orchestrator decision).** A non-forced offer for the knot that is connected right now is dropped (row 3's same-knot rule extends to a connected call). An offer for a different knot still queues behind it (row 5). A forced offer for the connected knot follows the forced rules above.
- **A2b contract.** `_handleEventMapping` treats `dropped` and `refused` from `offer()` as handled: the trigger stays persisted and nothing falls through to `_queueScriptedPhoneCall`. The banner gets `view.forced`; for a forced call it shows no Decline button (`decline()` returns false for one).
