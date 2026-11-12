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
2. **Row 25 reopen when the ringer has closed (row 28).** `openBlocked()` lists "ringer is closed", so a call finishing after the ending starts would never reopen the popup. Choice: the reopen check uses the adapter's `openBlocked()` plus the hit quiet time, and ignores `closed`. The ending is not a reason to leave the player's CyberChef gone.
3. **Row 28 and a call in its 500 ms open delay.** "Calls already connected finish normally" does not say whether a call still waiting to open counts. Choice: it is dropped with the held offers (no row, no event), because it has no minigame to finish.
4. **Row 21 first `untilAnswered` nudge.** "After RING_TIMEOUT_MS ... vibrates once every UNTIL_ANSWERED_NUDGE_MS" can mean the first vibrate at 20 s or at 30 s. Choice: at 30 s (20 s of loop, then one vibrate per 10 s), so the loop stopping and the first buzz are not one event.
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
- Row 25/32 input: the adapter's end hook calls `callEnded(npcId, { endedByCall, callFinished })`.
