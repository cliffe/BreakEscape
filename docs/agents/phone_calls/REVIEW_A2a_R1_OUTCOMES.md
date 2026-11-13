# A2a review R1: outcomes

Fixes in `phone-ringer.js`, tests in `phone-ringer.test.mjs` (102 tests across the two files, up from 73). Every new test was checked against a mutant with its fix reverted (see the last section). Adapter notes for A2b are in `A2a_NOTES.md`.

| Finding | Outcome |
|---|---|
| M1 throwing adapter | Fixed: every adapter call is guarded and logged; a throwing `openCall` is a refusal. Also `tick` always reschedules. Tests: throwing `openCall`, `showBanner`, `emit`. |
| M2 second check yields to a queued beat | Fixed: `openBlocked({ second: true })` at the check after the delay; the adapter leaves out the queue term. Test with a queued beat. Plan 2.2 note listed in A2a_NOTES. |
| M3 refusal never clears | Fixed: given up after 5 refusals over at least 8 s, missed event and `dropped` outcome, forced calls too; silent once closed. Tests: permanent refusal with a second contact, forced. |
| M4 hidden-tab clock jump | Fixed: `advance()` drops steps over 1 s. Tests: a 60 s jump while ringing, held and answering. The fake clock got `jump()` and no longer rewinds. |
| M5 `callEnded` mid-swap | Fixed: bookkeeping at once, re-check and reopen through `clock.defer`. Tests with the deferring clock. |
| M6 match by npcId | Fixed: `callEnded(npcId, { id, ... })`, ignored unless `id` is the call that was opened. Tests: wrong id, no id, delay, duplicate, stale after back-to-held. |
| M7 one slot, two offers | Fixed: the slot is derived from the contact's live offers after every change (connected outranks queued). Four tests. Added `restore(npcId, record)` for A4 with a test. |
| m1 | Done with choice 2. |
| m2 | Fixed: after `close()` a forced call hit is finished and its save cleared. Test. |
| m3 | Fixed: the answered event is emitted last. Re-entrant `close()` from it tested. The race is mostly gone with choice 3 (the call opens anyway), so the reorder is not killed by a test of its own. |
| m4 | Fixed: carried ringing in `answerMs`; 15 s then 5 s gives `answerSeconds` 20, timeout restarts. Test. |
| m5 | Fixed: `putAside` only at the open; a popup is reopened on give-up. Tests. |
| m6 | Rejected, recorded in A2a_NOTES: `callActive()` true while a forced call waits to re-ring would deadlock against a queued beat (the ring yields to the queue, the beat to the call). Plan 2.3 row 26 should say a beat may open first. |
| m7 | Deferred to A5/A6 as a note in A2a_NOTES (`dial()` entry). No code change in A2a. |
| m8 | Fixed: the ringer holds the open while `isPaused()`. Test. |
| m9 | Decided: `_handleEventMapping` owns persistence (2.7). The ringer lost `persistTrigger`. Reasons in A2a_NOTES. |
| m10 | Two surviving mutants now killed: the `answerSeconds` overwrite (hand-answer at 3 s then forced re-ring) and choice 3's drop (close inside the delay). |

Choices: 2 changed (no reopen once closed), 3 changed (matches 2.2, a call in its delay finishes), 4 changed (first vibrate at 20 s). The A2b-facing items (end hook identity and the ending minigame, deferred re-check, trigger owner) are in A2a_NOTES "Adapter notes for A2b".

Re-entrancy: `render` records its state before calling the adapter, so a `showBanner` that calls `decline` is safe. `openCall` calling `callEnded`, `offer` or `close` is tested; the post-`openCall` guard is defensive and has no test that fails without it (the structure-derived slot hides the effect).

Known loose end: when the ringer is closed and a call is connected, the backstop tick keeps running until the call ends (it did before).

## Mutation check

Each reverted separately against the new tests, all killed: no try/catch, second-check argument dropped, no give-up, no step cap, synchronous re-check, no id check, slot overwrite, slot clear on finish, reopen when closed, close drops the opening call, forced call requeued after close, `answerMs` not carried, `putAside` at Answer, pause ignored, `answerSeconds` overwrite, first nudge at 30 s, `restore` re-applying `setGlobalOnStart`, render order. Survivor: the post-`openCall` guard (defensive).
