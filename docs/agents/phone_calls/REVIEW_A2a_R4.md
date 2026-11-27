# A2a review, round 4: the ringer as a pure module

Under review: `d80c4f2a1` (R3 fixes) and the whole module as it stands. `ringer:N` is `public/break_escape/js/minigames/phone-chat/phone-ringer.js` at that commit. `phone-ring-config.js` is unchanged since R1.

Tests: `node --test test/js/phone-ringer.test.mjs test/js/phone-ring-config.test.mjs` gives 124 pass, 0 fail. Probe cases Q1 to Q5 are in `scratchpad/r4/probe.test.mjs` and run on the suite's fakes.

**Verdict: revise.** The R3 fixes are right. The problem is the reading in question 2: a forced call that has not yet connected can still be replaced by row 4 and lost (M1). The fix is two lines. The rest is minor.

## 1. The R3 fixes

| R3 | Result |
|---|---|
| M1 `keep` | Right. It is set at row 26 (`ringer:517`) and in `restore()` (`ringer:759`), and it is cleared only when the offer is dropped. `offer()` checks it on both the active offer and the queue (`ringer:671-675`), so a kept call stays protected while queued, ringing again, held, requeued by rows 23/24 and in its second open delay. The new offer starts with its own `answerMs` 0 and `answerSeconds` null, so nothing carries over. The four R3 M1 tests cover those states. |
| m1 rank | Right (`ringer:184`). A restored call keeps the slot against a connected non-forced call. |
| M2 contract | Right for ×, Cancel and Add to Notepad (A2a_NOTES "the ringer's phone-chat"). One gap is in m2 below. |

## 2. Findings

### M1. A forced call that has not connected yet can be replaced by a non-forced offer and lost
`ringer:674-675` (the `existing` lookup checks only `keep`), `ringer:693-719` (`replace`), `ringer:651` (`keep` starts false for every offer).

A2a_NOTES R2 (line 179) and the code's own comment (`ringer:667-668`) both say "Row 4 replaces only the contact's ringing, held or queued non-forced offer". The code doesn't do that. It protects a forced call only once `keep` is set, at its first re-ring or at a restore. Before then (queued, ringing for its 6 s, or auto-answered into `held`) a new offer for the same contact on another knot replaces it:

- Q1. Forced `call_a` rings for 3 s. Then `offer({knot:'call_b'})` returns `replaced`. `call_b` is not forced, so `decline('ceo')` works and emits `phone_call_declined:ceo`. `call_a` is gone, with no event, no row and no save record.
- Q2. Forced `call_a` auto-answers into `held` over a minigame. A new knot replaces it. The new offer is `held`, not forced and has `answerSeconds` 6. `hangUp('ceo')` declines it.
- Q3. Forced `call_a` waits in the queue behind a conversation, and a new knot replaces it there.

So yes, this can lose a beat the player must hear. The only window the implementer protects is after the first connect. The C4 calls are the ones at risk: they ring first and auto-answer after 6 s, they can wait a long time in `queued` behind a conversation or knockout (rows 2, 23, 24), and once A2c is in they can wait in `held` over a minigame. A contact that has both a forced ring and ordinary rings gets hit: m07's Architect (`sign_off` forced, the taunts not), HaX bring-in calls next to routine HaX calls, and `test_phone_calls` `caller_forced`. In m07 the taunt conditions (`!grid_saved`, re-checked when the delay fires) happen to guard the case, so the ringer isn't what protects it. The m01 first ring is not forced, so row 4 working on it is intended. The m09 and m10 forced calls are legacy (no `ring`) and never reach the ringer.

Rule: **a forced offer (`disableClose`) is never replaced, from the moment it is offered until it ends.** A new offer for that contact on the same knot is dropped (row 3). One on another knot queues behind it with its own timing (row 5). Row 4 replaces only a non-forced offer, whether the new offer is forced or not. That keeps the m07 countdown case (non-forced taunts replacing each other) and lets a forced sign-off replace a ringing taunt.

Fix: in `makeOffer`, set `keep: forced` (or use `x.keep || x.disableClose` in the two lookups at `ringer:671-675`). Update plan 2.3 row 4 to match: it still says "a forced call waiting to ring again". Add tests Q1 to Q3.

### m1. A forced call queued behind the contact's connected non-forced call is lost on reload
`ringer:184` (`rank`), `ringer:191-198` (`syncSave`).

Row 5 queues a forced offer behind the contact's connected call. The slot ranks the connected non-forced call at 3 and the queued forced one at 1, so the save holds the non-forced record (Q4). If the player reloads during that call, A4 turns the non-forced record into `missed`, and the forced call has no record left to restore. Row 27 says a forced call in any state rings again after a reload.

Fix: rank by `keep` (with M1's `keep: forced`, the same line already does it). The cost is that the connected non-forced call then has no record after a reload, so it gets no missed row or callback. That is the right trade for one slot per contact. Note it for A4.

### m2. A2b contract: Esc on a non-forced ringer call has two handlers
`framework/base-minigame.js:72-81` (`start()` adds an Esc listener that calls `complete(false)` unless `disableClose`), `phone-chat-minigame.js:256-282` (the phone's own Esc goes to `closeConversation()` from a thread).

The M2 contract covers ×, Cancel and Add to Notepad but not Esc. Both listeners fire on one keypress. The phone's listener is added first (`init()` → `setupEventListeners`, before `start()`), so row 25 happens if `closeConversation()` reaches `complete(true)` at once. If A2b shows "Call ended m:ss" before completing, the base listener's `complete(false)` closes the call first and emits `minigame_failed`. The ringer still sees `_endedByCall` and does row 25, but a `minigame_failed` mapping can fire on the player hanging up.

Fix (A2b): for `params.ringerCall`, remove the base Esc listener in `start()` (or give it the End path, as for ×). Add an Esc case to `phone-outgoing-call.test.mjs`.

## 3. Sweep of the whole module

- **Can never ring, open or end:** none found. Head-of-queue blocking (`ringer:605-611`) waits only on `notBefore` (3 s after a restore), the hit window or a connected call. Every `connected` call leaves through `callEnded`, the backstop or `giveUp`. A held call is retried by the tick.
- **Lost forced call:** M1 and m1. Row 28 (`close()`) drops queued, ringing and held forced calls on purpose.
- **Played twice:** none. Same-knot offers are dropped against kept and non-kept offers alike. `restore()` drops a second restore against a queued kept call or the active call on the same knot. End reports are matched by id.
- **`call_answer_seconds` / `call_is_callback`:** right. `answerSeconds` is fixed once (`ringer:380`), kept through row 26 and restore, and not carried into a new offer that queues behind a kept call. A restored call that was saved unanswered gets 6 at auto-answer (Q5). `call_is_callback` is always false until A5/A6, as the notes say. With M1 unfixed, Q2 shows a non-forced replacement taking a forced call's `answerSeconds`, which row 4 allows for held offers. M1 removes the case.
- **Timer outliving its state:** none. `openTimer` is cleared in `finishOffer` and `close()`. `callEnded` and the backstop act only once `connecting` is set or `opened` is true, so neither runs inside the open delay. The tick stops when nothing is active or queued, or after `close()` with nothing connected.
