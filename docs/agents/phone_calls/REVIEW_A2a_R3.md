# A2a review, round 3: the ringer as a pure module

Under review: `fb8cf4163` (R2 fixes). `ringer:N` is `public/break_escape/js/minigames/phone-chat/phone-ringer.js` at that commit. `phone-ring-config.js` is unchanged.

Tests: `node --test test/js/phone-ringer.test.mjs test/js/phone-ring-config.test.mjs` gives 118 pass, 0 fail. The findings below come from a scratch probe built on the suite's fakes (`scratchpad/r3/probe.test.mjs`, cases P1 to P5).

**Verdict: revise.** Most of the R2 fixes are right. The M1 rule holds only while the forced call sits in the queue. Once it starts to ring again it can be replaced, which is the R2 M1 bug back (M1 below). M2 is a hole in the A2b contract: three of the call window's own buttons end a non-forced call as a dropped line. Both fixes are small.

## 1. The R2 fixes

| R2 | Result |
|---|---|
| M1 forced wait | Right while the call is `queued` with `saveAs: 'connected'` (`ringer:665-668`). Not after that (M1 below). |
| M2 backstop | Right. `checkCallGone()` (`ringer:563-571`) runs only once `opened` is true, so the 500 ms open delay is safe. It restarts whenever the call is seen open, and it needs exactly `false`. A swap ends the call through `startMinigame`'s `endMinigame`, and the end hook reports that first. The pause menu (`ui/game-menu.js`) and the Mission Brief leave `currentMinigame` alone. A reload rebuilds the ringer. So I found no false end. The row it picks (26 forced, 32 otherwise) can't tell an own-path end with a lost report from a hit. Once A2b runs the end hook from a `finally`, I can't find a path that reaches the backstop: the N-02 guard nulls `currentMinigame` only for a minigame that is already mid-`endMinigame`, and its own `finally` runs the hook. So that choice can't replay a call today. |
| m1 restore | Right for an offer that is still queued. Not for one already ringing (m1 below). `opening` is kept. |
| m2 popup | Right on decline, hang-up, rang-off, give-up and row 26. A re-rung call that is replaced loses it (part of M1). |
| m3 future stamp | Right (`ringer:134-135`). |
| m4 tests | In. |

## 2. Findings

### M1. A forced call that is ringing again can be replaced, and the new call takes on its ringing time
`ringer:288` (`startRinging` sets `saveAs = null`), `ringer:580` (row 23/24 `requeueHead(o)` with no `saveAs`), `ringer:667-668` (the `existing` lookup), `ringer:686-712` (`replace`).

The rule in plan row 4 and A2a_NOTES protects only an offer with `saveAs === 'connected'`. `startRinging` clears that flag the moment the re-ring starts. From then until the call opens again, the forced call is an ordinary ringing offer for row 4. That window is at least `AUTO_ANSWER_MS`, and longer while the player keeps getting hit or the game is paused. A second gap opens if a conversation opens or a knockout lands during the re-ring: row 23/24 requeues the call with `saveAs` null. A new offer for the contact on another knot then runs row 4:

- P1. The forced `call_a` is answered (6 s), hit, and rings again. 3 s into that ring, `offer({knot:'call_b'})` returns `replaced`. `call_b` rings as a non-forced call, the save slot holds `call_b`, and `call_a` is gone. `call_b` has `answerMs` 3300, so an instant answer opens it with `answerSeconds: 3`.
- P2. During that re-ring, row 23 sends `call_a` back to the queue, saved as `queued`. A new knot then replaces it in the queue.
- P3. The re-rung `call_a` is auto-answered into `held` (open blocked), then replaced. `call_b` opens with `answerSeconds: 6` from `call_a`, and `phone_call_answered:ceo` is never sent for `call_b`.

The forced call the player can't miss is lost, along with any popup it set aside (`replace` doesn't copy `displaced` on the ringing branch). The new call also reports a `call_answer_seconds` the player never earned.

Fix: put the protection on a flag that lasts until the call ends, not on `saveAs`. For example, set `o.resumed = true` at row 26 and in `restore()`, and never clear it. In `offer()`, treat any queued or active offer of the contact with `resumed` the way `waiting` is treated now: same knot is dropped, any other knot queues behind it. In `rank()`, rank a `resumed` offer at 3. Test P1, P2 and P3.

### M2. A2b contract: the ×, Cancel and Add to Notepad buttons end a non-forced ringer call as a dropped line
`framework/base-minigame.js:18-59` (× and Cancel call `complete(false)` unless `disableClose`), `phone-chat-minigame.js:164-176`, `:232-243`, `:1560-1625`, `:1702-1732` (the notepad hand-off and return), plan 2.5 "Ending" (own paths: End, the back arrow, `#exit_conversation`, story end).

A non-forced ringer call is a phone-chat without `disableClose`, so it gets the minigame ×, a Cancel button and "Add to Notepad". None of these three is on the plan's list of own paths:

- **× and Cancel.** The player hangs up on purpose, but `_endedByCall` is not set. `cleanup` resets the story (row 32 branch), and the ringer runs row 32: `phone_call_missed:<npc>` and outcome `dropped`. In A6 that also leaves a callback whose ink says the line dropped. Per plan 1.4 line 62 they also emit `minigame_failed`.
- **Add to Notepad.** `startNotesMinigame` replaces the call, so the ringer takes row 32 as above. When the notepad closes, `returnToPhoneAfterNotes` reopens a phone-chat with `{...this.params}`, `ringerCall` included. Anything keyed on `params.ringerCall` (call screen, `_resetAfterRingerCall`, `_endedByCall`) then runs on what is now a plain reopen, with a stale call id.

Fix (A2b, write it into 2.5 and A2a_NOTES): in the adapter's `openCall`, pass `showCancel: false` for a ringer call. Route the × to the End path: `closeConversation()`, which marks `_endedByCall`. Leave out the notepad button when `params.ringerCall` is set, or have it end the call by the End path first and drop `ringerCall` from `pendingPhoneReturn.params`. Add these cases to `phone-outgoing-call.test.mjs`.

### m1. A restored forced call next to an offer that is already ringing loses the save slot once that offer connects
`ringer:740-760`, `ringer:182-196`.

`restore()` dedupes against the queue. If the contact's other offer is already `ringing` (or `held`), the restored call queues behind it with rank 3. When the other offer connects it is also rank 3. `syncSave` pushes `active` first and keeps the first on a tie, so the slot switches to the non-forced call (P4). A reload during that call turns it into a miss and drops the forced call. This only happens if a `game_loaded` mapping rings before A4 calls `restore()`. The Mission Brief opens on reload, and A2b blocks ringing while any minigame is open, so it's rare.

Fix: in `rank()`, rank a forced call that is waiting or resumed above a non-forced connected one (4 against 3). The M1 flag does this.

## 3. Is the A2b contract enough to wire without guessing?

Yes, apart from M2. The R2 review's section 3 list still applies, and A2a_NOTES now holds the `finally` hook, the one-clock conversion, the `{ second: true }` term and trigger ownership. After M2, the one open item is how the adapter gets `npcId` for `callEnded`. It must use the `npcId` it put in the call's params at `openCall`, because `ringerCall` carries only `id`. That is a line for the notes, not a defect.

## 4. Things I checked and found sound

- No way for a call to stick. Every `connected` call leaves through `callEnded`, the backstop or `giveUp`. A held call is retried by the tick. A head of queue that waits on `notBefore` or the hit window only delays the queue.
- No double play on the paths that exist: duplicate and late reports are ignored by id. After the backstop, a late report finds `connecting` null.
- `restore()` placement against a queued offer, a second restore, and an offer made after a restore (it queues behind) all work.
- `close()` with a waiting forced call removes it with no event. A connected call after `close()` is still caught by the backstop, and the tick keeps running for it.
