# A2a review R2: outcomes

Fixed in `phone-ringer.js`; tests in `test/js/phone-ringer.test.mjs` (names start `R2`). 118 pass in the two A2a test files.

| Finding | Outcome |
|---|---|
| M1 | Fixed with the orchestrator's rule: a forced call waiting to ring again is never replaced and a new offer queues behind it (row 5). No ringing time or `answerSeconds` carries over. Row 4 stays for non-forced offers. Tests for both. Rule written in A2a_NOTES.md. |
| M2 | Fixed. Tick backstop `checkCallGone()` (1.5 s of `callMinigameOpen() === false` after the open): row 26 if forced, row 32 otherwise. Why: see A2a_NOTES.md. A2b must call the end hook from a `finally` (noted). |
| m1 | Fixed: restore is `saveAs: 'connected'`, goes ahead of the contact's other offer, a second restore is dropped, `opening` kept. |
| m2 | Fixed: reopen on hang-up, rang-off, give-up; kept through row 26. Closed ringer keeps the popup shut. |
| m3 | Fixed: a future stamp is not a hit. Single-clock rule in the header and notes. |
| m4 | Tests added for the floor, the count and the reset. |

## Mutation run

The reviewer's 20 mutants plus 13 new ones (M1 x2, M2 x3, m1 x3, m2 x3, m3, refusal count). One mutant text was rewritten because `callEnded` was refactored into `finishCall`. All are killed except `rank connected low`, which is equivalent: `active` is pushed first in `syncSave` and `rank` only breaks ties against queued offers of the same contact, so lowering the rank of a connected call changes nothing the adapter can see.

The refusal-count mutant first survived (the tick pacing makes five refusals take 8 s, the same as the floor). A new test pauses between refusals to separate them.

## Not done / for later

A2b items in A2a_NOTES.md (end hook in a `finally`, clock conversion). Section 3 of the review is untouched, as it is A2b's list.
