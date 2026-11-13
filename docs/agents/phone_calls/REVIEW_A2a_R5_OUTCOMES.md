# A2a review R5: outcomes

Fixed in `phone-ringer.js`; tests in `test/js/phone-ringer.test.mjs` (names start `R5`). The test adapter now logs `['save']` as the primary record (first forced, else live) so the older tests still read one record, and `['saveSlot']` as the full slot.

| Finding | Outcome |
|---|---|
| M1 | Fixed. `offer()` drops a knot that matches any `keep` offer of the contact. Test: a, b, b, b (non-forced) plays a, b. |
| M2 | Slot is now `{ forced: [...], live }`; `restore()` re-queues every forced entry in order, accepts the old single record. Shape written into A2a_NOTES for A4. Tests: two-forced reload, old shape, empty slot. |
| m1 | `restore()` is dropped only by a connected call or an earlier restore (new `restored` flag; `saveAs` would not cover queued entries). Test added. |
| m2 | A non-forced offer for the connected knot is dropped; another knot queues. Rule noted for plan row 5. Test added. |
| A2b notes | `dropped`/`refused` handled, forced banner has no Decline: both in A2a_NOTES. |

Probes P1 to P7 all run: P1 plays a, b; P2 slot holds both forced; P3 restore accepted (a, b); P4 accepted (b rings first as it was already active, then a); P5 dropped; P6 and P7 unchanged.
