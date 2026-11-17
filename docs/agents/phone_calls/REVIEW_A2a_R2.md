# A2a review, round 2: the ringer as a pure module

Commit under review: `e0aeba91d` (R1 fixes). `ringer:N` is `public/break_escape/js/minigames/phone-chat/phone-ringer.js` at that commit. `phone-ring-config.js` is unchanged since `baadbe56f` and still matches 3.1: `untilAnswered` defaults to false, so a call rings out after 20 s unless it opts in.

Tests: `node --test test/js/phone-ringer.test.mjs test/js/phone-ring-config.test.mjs` gives 102 pass, 0 fail. I checked the findings below with a scratch probe built from a copy of the suite's fakes, and I ran 20 mutants against a scratch copy of the module.

**Verdict: revise.** Every R1 fix is in and works on the paths R1 named. The m6 rejection is sound. Two of the additions open new gaps (M1, M2). Both fixes are small and stay inside the module, and a narrow check of them is enough before A2b.

## 1. The R1 fixes

| R1 | Result |
|---|---|
| M1 guarded adapter | Correct. `call()` catches every adapter call (`ringer:92-100`), a throw from `openCall` counts as a refusal (`:442`), and the tick reschedules in a `finally` (`:213-218`). |
| M2 second check | Correct. `{ second: true }` is passed only at `finishOpen` (`:426`). The row 25 reopen (`:302`) still passes no info, so it yields to a queued beat, as row 25 says. |
| M3 give-up | Correct for the named case. See m4 for the floor and the reset, which no test covers. |
| M4 step cap | Correct. A gap over 1 s is dropped (`:203`). A long main-thread stall in a visible tab is dropped too, which only lengthens the ring and does no harm. |
| M5 deferred re-check | Correct. Bookkeeping, `render()` and the slot write happen at once, and `run()` and the reopen go through `afterSwap` (`:498-505`). The forced row 26 path no longer flashes the banner. |
| M6 id match | Correct. `connecting` is null during the open delay and after a back-to-held, so stale and duplicate reports are ignored (`:471`). |
| M7 one slot | Correct for a connected call with a queued one behind it. `restore()` reopens it (m1). |
| m1, m2, m3, m4, m5, m8, m9, m10 | Correct, except m5: the popup is still lost on three paths (m2 below). |
| m6 rejection | **Sound.** If `callActive()` stays true while a forced call waits out `HIT_QUIET_MS`, a beat that arrives is queued (the busy rule). The ringer's `ringBlocked()` then yields to the non-empty `_scriptedCallQueue`, and the pump (`npc-manager.js:778`) waits on `_scriptedCallBusy()`, so neither ever moves. Letting a beat open first and re-ringing afterwards is the right trade, and plan 2.3 row 26 already records it. |

## 2. Findings

### M1. A forced call waiting to re-ring can be replaced by any new offer, and the replacement inherits the answered call's ringing time
`ringer:612-616`, `:631-637` (`answerMs` at `:633`), with the row 26 requeue at `:481-486` and `restore()` at `:685-698`.

After a hit (row 26), and after a `restore()` (row 27), the forced call sits in `queue` as `queued` with `saveAs: 'connected'`. `offer()` finds it with `queue.find` and treats it as an ordinary queued offer:
- **Same knot:** dropped, which is fine.
- **Different knot:** `replace()` swaps it for a fresh offer, so row 4 runs where row 5 should: the call is "kept as connected" (row 26) and is a connected call for this contact. The forced call the player could not miss is gone. The slot now holds the new non-forced record, so a reload doesn't bring it back either. The replacement also gets `answerMs = old.answerMs + old.ringMs`. For an answered call that is the old call's ringing time (up to 6 s for an auto-answer), so `call_answer_seconds` on the new call is too high, and the user's "slower than 10 s" line fires after a 5 s answer.

Probe: a forced `call_a` is auto-answered and opened, a hit closes it, and `offer({ knot: 'call_b' })` follows inside the quiet window. Result: `call_b` rings at once, non-forced, with `answerMs` 6000, and the save holds `call_b`.

Fix: in `offer()`, treat a queued offer with `saveAs === 'connected'` (equivalently `rering`, or `answerSeconds != null`) as connected. The new offer queues behind it (row 5), and rows 3 and 4 then apply against the new one. If the plan really wants m07's later countdown call to replace an interrupted forced one, say so in row 4. Even then, carry `answerMs` only when `old.answerSeconds == null`. Test both cases.

### M2. No backstop when the end report never comes: the ringer stays `connected` and every later call queues for ever
`ringer:525-561` (no check of an opened call against the world), with `minigame-manager.js:270-279` and `:80-85`.

Once a call has `opened`, only `callEnded` can move it on. If the report never arrives, `active` stays `connected`. `callActive()` correctly turns false, because `callMinigameOpen()` is false. But `ringBlocked()` is true for good, so every later offer sits in `queued` for the rest of the session. Two real paths skip the hook the plan places after `:300`:
- the call's `onComplete` throws: the `finally` at `:275-279` nulls `currentMinigame`, then the throw leaves `endMinigame` and nothing after `:279` runs;
- the N-02 stray guard at `:84` nulls `currentMinigame` without ending it.

Probe: open a call, set the world to "call minigame not open" with no `callEnded`, then offer a second contact. 120 s later the first is still `connected` and the second still `queued`.

Fix: the adapter already reports `callMinigameOpen()`, so add a backstop to `runOnce`. When `active.state === 'connected' && active.opened` and `callMinigameOpen()` is false on two ticks in a row, run the non-own branch of `callEnded`: row 32, or row 26 when forced. Test it. A2b should also call the end hook from a `finally`, so a throwing `onComplete` can't skip it.

### m1. `restore()` next to a different-knot offer gives the contact two queued offers, and the save can drop the forced call
`ringer:685-698`, `:169-170`, `:154-167`. `restore()` dedupes only on the same knot. If a `game_loaded` mapping offered another knot for the contact first, both are queued. They rank equal (both 1), so whichever comes first in the queue wins the slot. Once the other offer rings it outranks the restored forced call (2 against 1), and a reload in that window loses the forced call. Probe: `queueLength()` is 2, and the other offer rings first. `record()` also drops `opening`, so a restored opening call no longer holds the Mission Brief (row 30).

Fix: give a restored record `saveAs: 'connected'` (with M1's fix it then outranks and queues correctly), apply row 3 against any existing offer, and add `opening` to `record()`.

### m2. A popup the call put aside is lost on hang-up, rang-off, decline after a refusal, and row 26
`ringer:327-332` (`declineOffer`), `:335-351` (`miss`), `:485` (row 26 sets `displaced = null`). Since m5, `putAside` runs at `finishOpen`. If that open is refused, the offer goes back to `held` with `o.displaced` set. A Hang up or a hold-limit rang-off then finishes it with no reopen. Only `giveUp` reopens. A forced call that put CyberChef aside and was then hit drops the descriptor, and its re-ring's `putAside` finds the popup already closed, so the popup never comes back. Probes C and H: `reopen` is called 0 times.

Fix: call `reopenDisplaced(o.displaced)` in `declineOffer` and `miss`, and keep `o.displaced` through the row 26 requeue. Row 32's "no reopen" can stay as it is.

### m3. `hitWithin` counts a timestamp in the future as a hit for ever
`ringer:121-124`. `now() - t < ms` is true for any `t` ahead of the clock. The notes ask for `performance.now`, but `player-damage-interrupt.js` stamps with `Date.now()` (`:30`, `:64`). If A2c wires `lastHitAt` to that, every hit reads as "just now" for good: nothing opens, forced calls never auto-answer, and no call re-rings. Fix: `const d = now() - t; return d >= 0 && d < ms;` in the ringer, and either convert in the adapter or put both on one clock (see section 3).

### m4. Two give-up rules have no test that can fail
Of the 20 mutants, 18 were killed. Two survive:
- removing the `GIVE_UP_AFTER_MS` floor (`:446`). Hooks reset `retryAt` to 0 (`:706`), so with no floor a burst of five hooks can give up on a call within about 2.5 s;
- removing the reset of `refusals`/`firstRefusalAt` after a successful open (`:455-456`). A forced call refused 4 times, then opened, hit and refused once more is given up at once.

One other survivor (connected ranked level with queued in `rank`) is equivalent, because `active` is pushed first in `syncSave`. Add tests for the first two, and for M1, M2, m1 and m2.

## 3. The adapter contract against the existing code: what A2b changes outside the ringer

The contract in A2a_NOTES wires cleanly. The ringer reads nothing it can't get. Outside the ringer, A2b must:

1. **`minigame-manager.js`:** pass `ending` to the end hook, and run the hook from a `finally` around `:270-303` (M2), not only after `:300`. The start hook after `:183` is not reached when `init`/`start` throw. The ringer already treats that as a refusal. But `currentMinigame` is then the half-built call (installed at `:174`), and its later end report is ignored by id, so the adapter's `openCall` should catch the throw and end that minigame itself if it is still `currentMinigame`.
2. **Adapter bookkeeping:** keep the id from `openCall`'s `info.ringerCall.id` so it can answer `callMinigameOpen()` (current minigame's `params.ringerCall.id` equals that id, and not `_ending`) and `openCallId()`.
3. **`npc-manager.js`:**
   - split `_scriptedCallBusy()` (`:742-750`) as 2.2 says;
   - in the phone-chat branch (`:1495-1527`), set `triggered.persist = true` and call `offer()` instead of `_queueScriptedPhoneCall` (today `:1061` skips persistence for `opensConversation`, and `persistOnClose` waits for `conversation_closed`);
   - keep the `startKnot` rule for `resume` (`:1513`) in the adapter's `openCall`;
   - do the `holdRecentNotifications`/`expectPanelWithin` calls that `_queueScriptedConversation` (`:683-684`) makes today in `openCall`, or the F24 toast flash comes back on ringer calls;
   - make `hasPendingOpeningConversation` (`:1940`) OR in `phoneRinger.hasOpeningOffer()`;
   - let `_scheduleDelayedMapping`'s `fire` (`:644`) skip the minigame wait for `ring`.
4. **One clock:** pass `performance.now` and record the hit time on it in A2c. If not, convert `lastDamageCloseAt` (`Date.now`, `player-damage-interrupt.js:64`) in the adapter (m3).
5. **`phone-chat-minigame.js`:** `params.ringerCall`, `_endedByCall` and `_callFinished` (2.5), as planned. A forced call's hit close goes through `current.complete(false)` (`player-damage-interrupt.js:66-67`), which reaches the end hook with neither flag set, so row 26 applies as intended.
6. **In A2b, before the pill exists:** a call answered with nothing open, where the player opens a minigame in the 500 ms delay, goes back to `held`. `pillShowing` is then true, because `minigameOpen()` is true, so the hold limit runs against a pill that A2b doesn't draw, and after 90 s there is a "rang off" toast for a call the player never saw on hold. Either draw a minimal pill in A2b, or have the A2b adapter report `minigameOpen()` false until A2c.

The scripted queue and the ringer don't deadlock. A beat that arrives in the open delay waits (`callActive()` is true, and the second check ignores the queue). A held call yields to a queued beat. The only lasting stall is M2.

## 4. Do the tests drive behaviour?

Mostly yes. The tests drive the public entry points, a fake clock with real timer ordering and a deferring `defer`, and they assert on adapter effects and `stateOf`. Mutation results are in m4. The suite has no case where a contact holds a forced call waiting to re-ring next to a second offer, none where the end report goes missing, and none for the popup on the hang-up and rang-off paths. That is why M1, M2 and m2 pass today.
