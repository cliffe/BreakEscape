# A2a review R3: outcomes

Fixed in `phone-ringer.js`; tests in `test/js/phone-ringer.test.mjs` (names start `R3`). 124 pass in the two A2a test files.

| Finding | Outcome |
|---|---|
| M1 | Fixed. A `keep` flag, set at row 26 and in `restore()` and kept until the call ends, is checked in `offer()` and `rank()`. A kept call is never replaced while queued, ringing again, held, requeued by rows 23/24 or restored. No `answerSeconds` carries over. One test per state. |
| m1 | Fixed: `rank()` puts a `keep` offer at 4 against 3, so a restored forced call keeps the slot. Test added. |
| M2 | Contract written in A2a_NOTES.md ("Adapter notes for A2b"): × is End call (row 25), no Cancel, no Add to Notepad while connected, only with `ringerCall`. The ringer needed no new flag: `endedByCall` already separates rows 25 and 32. A test pins it. |

## Mutation run

With `keep` never set, 8 tests fail (the five new M1/m1 tests and three R2 ones). With `rank` ignoring `keep`, the m1 test fails.
