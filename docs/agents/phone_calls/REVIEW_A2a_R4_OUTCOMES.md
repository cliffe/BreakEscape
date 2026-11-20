# A2a review R4: outcomes

Fixed in `phone-ringer.js`; tests in `test/js/phone-ringer.test.mjs` (names start `R4`). 128 pass in the two A2a test files; `bin/test-js` 499 pass, 0 fail.

| Finding | Outcome |
|---|---|
| M1 | Fixed. `makeOffer` sets `keep: forced`, so a forced offer is protected from the moment it is offered. Another offer for the contact queues behind it whatever its knot; nothing carries over. Code comment and A2a_NOTES (the row 4/5 rule, line 50; the review's "line 179" does not exist in the 71-line file) updated. Tests for queued, ringing and held. |
| m1 | Follows from M1 (`rank` already uses `keep`). Test added: a forced call queued behind a connected non-forced call keeps the save slot. A4 note: the connected non-forced call then has no record after a reload, so no missed row or callback. |
| m2 | Contract added to A2a_NOTES "Adapter notes for A2b": on a `ringerCall` phone-chat, Esc goes through End call (row 25) and must not reach the base `complete(false)`, so no `minigame_failed` on hang-up. lab_social_engineering and text threads unchanged. |

## Mutation run

With `keep` set to false in `makeOffer`, the four new tests fail (3 M1, 1 m1).
