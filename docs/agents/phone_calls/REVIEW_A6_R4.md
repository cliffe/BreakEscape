# Review: A6 round 4 (`_threadOpenOn` asks for a conversation; the R3 nit tests)

Reviewer: Opus, 2026-11-12. Reviewed at `2f2065eea`. Read against `REVIEW_A6_R3.md`, `REVIEW_A6_R3_OUTCOMES.md`, plan 2.6. No live run. The question is about timing, so it was answered by reading the dial and reopen paths and running a probe on the committed harness (real `NPCManager`, ringer, ink and `PhoneChatConversation`; scratchpad `probe_a6r4.test.mjs`, not committed).

**Verdict: accept.** Nothing above a nit. The new clause cannot release a voicemail while a thread or call really holds the contact's story. All four R3 nits are done, and their tests kill the mutants they were written for. One nit, pre-existing and outside this change.

## Can a voicemail now be written while a story is open?

The thing to protect is the minigame's own loaded copy of the story, which would overwrite the voicemail's save. A phone-chat only holds one after `openConversation` has set `this.conversation`, and that assignment is synchronous, before any of its awaits. From that moment `_threadOpenOn` is true again. Before it, nothing in the minigame has read `npc.storyState` or the thread (`_saveStoryStateFor` returns early with no conversation). After the voicemail's `loadStory`, everything up to its single save is synchronous, and `isBlocked` is asked right before it. So any voicemail write lands either wholly before an open reads the story, or not at all.

### A dial that is CALLING

- **A voicemail held before the dial.** The thread is closed for the call with `_closingForCall`, so it emits nothing. The held run stays in `_whileThreadOpen` through the dial. On a connect it is released by the call's close (End emits `conversation_closed:<id>`, with the story saved home first by `_resetAfterRingerCall`). On a ring-out it is released when the reopened thread closes, or by `dropDisplaced`'s owed event if the reopen is refused. n-a does not change this path.
- **A voicemail that starts during the dial.** It is not held, and it runs. If the connect comes first, `_connectOutgoing` → `openConversation` sets `conversation` before its awaits, so a voicemail still loading is blocked and waits for the call's close. If the voicemail's write comes first, the connect's `openConversation` restores `npc.storyState` after its own `loadStory` and carries the voicemail's VARs into the call. Probe P1 (connect lands during the voicemail's load): nothing is written while connected; after End, one Voicemail row and `heard_vm` true. P2 (no connect): it runs during the dial, and the restored story has `heard_vm` true and sits on `start`.
- **Reachability.** I found no ordinary path that starts a fresh voicemail for X during a dial to X. The dial requeues X's ringing offer, a queued offer cannot ring or be missed while the outgoing call is the active one, and row 31 drops same-knot offers at the connect. The case is safe anyway.

### Between a call ending and the thread reopening

- The call's `closeConversation` runs `_resetAfterRingerCall` (the save), then emits, then nulls `currentNPCId` and `conversation` for the "Call ended" beat. The beat was never a hold (`currentNPCId` was already null), so that part is unchanged.
- The reopened thread is a new minigame. Through `preloadIntroMessages` it has no conversation, and it is no longer a hold. A voicemail written then is in place before the thread's `loadHistory` and story restore. Once `openConversation` starts, the thread holds, and a run still loading is blocked and retried after that thread closes. Probe P3, both orders: reopened in preload → it runs at once, one row set. Reopened with its conversation → nothing written until its close, then one row set.
- The only reader before `conversation` is `preloadOpening`, for a contact with no texts. It checks the thread again after its load and stops if the voicemail added lines. See n-e for the one case that check does not catch.

## The R3 nits

- **n-a:** `&& !!open.conversation`, with a comment saying why. The test's `openThread` now gives the fake a conversation, and the new test flips it both ways.
- **n-b:** the test reloads a `ringing` withheld `onMissed: callback` live record next to a saved callback. That goes down the `live` branch (`missedOffline`), and the callback is restored before it. Correct.
- **n-c:** `ringer.suspend(true)` before the close, no toast.
- **n-d:** title fixed. The test now asserts `pendingCall` is null after the warning, which matches plan 2.6 (released, logged).

## Tests and mutations

At `2f2065eea`: `phone-voicemail-hold` 23/23, `phone-voicemail-run` 10/10, `phone-callback-dom` 20/20, `phone-callback-ui` 4/4, `phone-callback-ringer` 19/19, `phone-ringer` 122/122. Probe P1 to P4 pass.

Mutations were run on a scratchpad copy of `public/break_escape/js` and `test/js` (the shared tree was not touched; script `mut_a6r4.py`). All six for this change are killed. K1: the n-a clause removed. K2: `isBlocked` never blocks. K3: the suspended branch dropped (R3's J17). K4: the reload's `restoreCallback(npc.id, callback)` dropped (R3's J3). K5: the hold never released. K6: the clause swapped for the old `isConversationActive !== false`.

## Nit

- **n-e (pre-existing, not from this change). A voicemail with no lines on a contact that has never texted is overwritten by the next intro preload.** `_preloadOpeningOnce` only looks for non-call messages, and a line-less voicemail adds only its row. The preload also starts from a fresh story and never restores `npc.storyState`. Probe P4 (`empty_vm`, no texts, then `preloadOpening`): the saved story goes from `vm_count` 1 to 0, and the opening is preloaded under the Voicemail row. In the probe there is no `npcConversationStateManager`. In the game, `recordInkVariables` / `applySavedInkVariables` may carry the ink VARs across, but visit counts would still be lost (not checked). Before n-a, opening the phone straight onto that contact held the voicemail through the preload. A contact-list open and the inventory's preload never held it, so the gap was there already. It needs a voicemail knot that only sets VARs, on a caller the player has never texted. If A7's validator warns on a voicemail knot with no `voice:` line, that covers it.
