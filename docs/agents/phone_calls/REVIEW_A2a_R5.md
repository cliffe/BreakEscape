# A2a review, round 5: the ringer as a pure module

Under review: `31539d552` (R4 fixes) and the whole module as it stands. `ringer:N` is `public/break_escape/js/minigames/phone-chat/phone-ringer.js` at that commit. `phone-ring-config.js` is unchanged since R1.

Tests: `node --test test/js/phone-ringer.test.mjs test/js/phone-ring-config.test.mjs` gives 128 pass, 0 fail. Probes P1 to P7 are in `scratchpad/r5/probe.test.mjs` (the R4 fakes, unchanged).

**Verdict: revise.** The R4 fix is right, but forced offers now share a contact more often, and two lookups still assume one protected offer per contact. M1 (a forced call played twice) must be fixed before A2b. It takes three lines and needs no further review round. m1 can be fixed in the same commit. M2 is a save-format decision that A4 needs to make.

## 1. The R4 fixes

| R4 | Result |
|---|---|
| M1 `keep: forced` | Right (`ringer:651`). A forced offer is protected while it is queued, ringing or held, and also while it waits to ring again. Q1 to Q3 from R4 now queue the new knot behind it. A forced offer still replaces a ringing, held or queued non-forced one (P6: `x` replaced by forced `b`), which is the m07 sign-off case. Plan 2.3 row 4 matches. |
| m1 rank | Right as a consequence (`ringer:184`). A forced call queued behind a connected non-forced call holds the slot. |
| m2 Esc | The contract is in A2a_NOTES, "the ringer's phone-chat", last bullet. It is complete for Esc. |

## 2. Findings

### M1. A forced knot offered a second time is queued twice when it is not the contact's first forced offer
`ringer:671-673`. `waiting` is the *first* `keep` offer for the contact (the active one before the queue), and only that offer's knot is compared with the new one.

Since R4 a contact can hold several `keep` offers at once: forced `call_a` ringing, with forced `call_b` queued behind it (row 5). P1:

1. `offer(call_a, forced)` gives `ringing`, and `offer(call_b, forced)` gives `queued`.
2. `offer(call_b, forced)` again gives `queued`: `waiting` is `call_a`, the knots differ, and `existing` skips `keep` offers. The queue now has 2 entries.
3. `offer(call_b)` (not forced) gives `queued` as well, so the queue has 3.
4. The calls opened are `call_a, call_b, call_b`.

Row 3 is broken, and the player hears the forced `call_b` beat twice. This happens whenever a `ring` mapping without `onceOnly` fires again, or when two mappings (an event and a timed conversation) name the same knot, while the contact has an earlier forced offer ahead of it. Before R4 the second `call_b` replaced the first (wrong in a different way), so the double play is new with R4.

Fix: compare the new knot with every live offer of the contact before anything else:

```js
const mine = [active, ...queue].filter((x) => x && x.npcId === raw.npcId);
if (mine.some((x) => x.keep && x.knot === raw.knot)) return 'dropped';
```

Then take `existing` as now. Add P1 as a test (forced and non-forced repeats of the second forced knot).

### M2. With two forced offers for one contact, only the first survives a reload
`ringer:184`, `ringer:191-198`. There is one `savePendingCall` slot per contact (plan 2.7).

P2: forced `call_a` ringing with forced `call_b` queued gives a save history of `call_a, call_a, call_a`. Both triggers were persisted when they were offered (2.7, A2b). After a reload A4 restores `call_a`, and `call_b` has no record and no trigger left, so the beat is lost for good. This breaks row 27 ("a forced call in any state rings again after a reload"). The same happens to a non-forced queued offer behind any other live offer of the contact (R4 m1 noted the connected non-forced case). The loss is not a regression: before R4 the second forced offer replaced the first outright. R4 makes the case reachable without that replacement.

Fix (decide before A4, not needed for A2b): either make `pendingCall` an ordered list of the contact's `keep` records, with `savePendingCall(npcId, records)` and A4 restoring each in order, or keep one slot and write it into plan 2.7 and the scenario docs as a rule: one forced ring per contact at a time, so the validator (A7) warns when two forced `ring` beats for one contact can be due together.

### m1. `restore()` is dropped against a fresh forced offer on another knot
`ringer:751`. The `x.keep` term was meant for "a forced call already waiting to ring again" (R2 m1). Since R4 `keep` is also true for any new forced offer.

P3: on load, with `ringBlocked` true, a forced mapping (on another knot) offers `call_b` before A4 calls `restore('ceo', call_a record)`. The restore returns `dropped`, and `call_a`, the call that was on the line at save time, is lost. If `call_b` is already active, the restore is accepted (P4), so the result depends on timing.

Fix: drop only against a call that is already a restored or re-ringing connected call: `x.saveAs === 'connected'` in place of `x.keep` (the active-side term already uses `state === 'connected'`). Until then, A4 must call `restore()` before any mapping can offer. Add P3 as a test.

### m2. A non-forced call can be offered again on its own knot while connected, and it rings again afterwards
`ringer:674-675`. The `existing` lookup leaves out a connected active offer.

P5: non-forced `call_a` is connected, and `offer(call_a)` gives `queued`. When the call ends, the same knot rings again. A forced connected `call_a` drops the repeat (it is `keep`), so the two behave differently. Plan row 5 says a new offer for a connected contact queues, and row 3 lists only `queued`, `ringing` and `held`, so the code follows the plan. With `onceOnly` mappings (persisted at offer) this cannot happen. Suggest adding `connected` to row 3 and dropping a same-knot offer against the active call whatever its state. M1's `mine.some(...)` test without the `x.keep` condition would do both. Not blocking.

## 3. Sweep of the whole module

- **Can never ring, open or end:** none found. The head of the queue waits only on `notBefore`, the hit window for a re-ring, or `ringBlocked()`. Each of these clears. Every connected call leaves through `callEnded`, the backstop or `giveUp`.
- **Forced calls blocking each other for ever:** no. Two forced offers for one contact run first in, first out (P1 before the duplicate, P6). A forced offer queued behind a forced call that waits to ring again after a hit is released once `HIT_QUIET_MS` passes: `call_a` rings again and connects, then `b` rings (P7). Each forced call auto-answers after `AUTO_ANSWER_MS`, so none holds the line. `restore()` puts a restored call ahead of the contact's other offers. One forced call can't starve another, because `existing` never matches a `keep` offer. The only open-ended wait is behind a non-forced `untilAnswered` call from another contact, which the player ends by answering or declining (by design).
- **Lost forced call:** M2 (reload) and m1 (restore ordering). Row 28 (`close()`) drops queued, ringing and held forced calls on purpose.
- **Played twice:** M1. Restores and re-rings are not repeated: `answeredEmitted` survives row 26 and restore, and end reports are matched by id.
- **`call_answer_seconds` / `call_is_callback`:** right. `answerSeconds` is fixed once (`ringer:380`) and capped at 6 for an auto-answer. It carries over only through row 4's replace of a non-forced offer, as plan 2.11 and m4 intend. It is kept through row 26 and restore. `call_is_callback` is false until A5/A6, as the notes say. Callbacks after a rung-out call (the user's "Call back") hang on `onOutcome('missed' | 'rang_off')`, which A6 picks up.
- **Timer outliving its state:** none. `openTimer` is cleared in `finishOffer` and `close()`. `replace()` only ever takes a queued, ringing or held offer, and none of these holds an `openTimer`. The tick stops when nothing is active or queued.

## 4. The A2b contract (A2a_NOTES)

Complete for A2b: predicates and the `{ second: true }` term, `clock.defer`, one clock, trigger persistence in `_handleEventMapping`, the end hook in a `finally` with `id`, `_endedByCall` and `_callFinished`, `callMinigameOpen()` returning `false` (not `undefined`) when gone, `openCallId()`, ×, Cancel, Add to Notepad and Esc on a `ringerCall` phone-chat, and the row 26 scripted-beat gap. Two additions:

- `_handleEventMapping` should treat `offer()` results `dropped` and `refused` as handled. The trigger stays persisted and nothing falls through to `_queueScriptedPhoneCall`. Until M1 is fixed, a repeated non-`onceOnly` `ring` mapping can double a forced beat.
- The banner gets `view.forced`. For a forced call it must show no Decline (`decline()` returns false for one, so a shown button would do nothing). Plan 2.4 implies this, but the notes do not say it.
