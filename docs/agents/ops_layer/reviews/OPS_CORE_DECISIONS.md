# OPS_CORE_PLAN: findings not taken as written

Round 1 (`OPS_CORE_R1.md`). Every major and minor was acted on. The entries below are the ones
where the plan took a different fix from the one suggested, or declined a nit.

| Finding | Decision | Why |
|---|---|---|
| m1 | Took the second fix (refuse a no-route folder request at a technique session), without the "unless physically reachable" exception | The plan now refuses a technique session at the keyboard altogether (question 5c), so the exception has no case |
| m2 | Recommended "refuse at the keyboard"; the `settle_session_at_keyboard!` early return was removed from the plan | With the keyboard refused the settle call is never reached for a technique session. The choice is the user's, in question 5 |
| m3 | Both NPC cases stand (a borrow ending the session; a grant ending an NPC guest session) | Same as a password session; the card can be used again |
| m8 | Took the warning, not "server-owned globals only" | A global set in dialogue is a legitimate need and the cheat policy leaves dialogue-gated steps best-effort; card, finding and reach stay hard-enforced |
| M4 | Went past the reviewer's option (a): noise plus evidence that makes a confirm quiet | Evidence alone leaves a wrong card free and can stall a mission on one missed item. Put to the user as question 4 |
| n4 | Declined the rename of the record key `technique` to `finding` | The orchestrator's ruling B names the keyword `technique:`; the plan says in section 0 that it holds a finding id |
| n3 | Fixed differently: `ops` is not sent on an unswept discovery block | Removes the hint instead of documenting it |
| Ruling G, first half | Not applied | Superseded by the orchestrator: `ops-model.js` is the shared module and no skin stage lands first |

Round 1b (`OPS_CORE_R1b.md`). Every major and minor was acted on or was already closed. The
entries below took a different fix from the one suggested.

| Finding | Decision | Why |
|---|---|---|
| M7 | `grants` is optional at every stage, not required from S3; S3 adds a warning and a quiet `no_grant` refusal | Requiring it at S3 would force an edit to the S2 scenario when S3 lands, so S2's scenario would no longer prove S2 alone |
| M6 (idempotence) | Noise is counted per validated request, not per (finding, card) pair | `api-client.js` has no retry and the control is disabled while pending; a pair list would add state that can reach thousands of entries |
| M8 | Rows use the log plan's own names (`network_swept`, `host_scanned`, `service_checked`, `finding_confirmed`, `technique_refused`, `technique_used`) plus `network_alerted`, not `scan_*` | They are snake_case as ruled and already in the log plan's table of sibling rows; open points are in cross-plan request 8 |
| m13 | A card not held, forged or not a card stays the one 404, not a 422 `no_card` | A card the player does not hold is unearned, and the plan's rule is one answer for everything unearned |
| m13 | Missing, non-string or over-long params answer 400 `bad_request`; the server sends no `error` text | The 400 depends on no id; refusal words live in the client's `REFUSAL_TEXT` |
| m18 | Cards use the existing `notes1` sprite; a `technique_card` sprite is an art task outside the stages | No validator exemption and no image generation in the plan |
| m20 | `item` split into `item` (id) and `itemType`; a session record without `access` reads as `user` until S5a's helper exists | Lets the schema cross-reference the id and lets S3 test a step up alone |
| m21 | Already closed | 9.1 and 9.2 had the `evidence` and `alert` rows |
| Open questions | Four kept, not three: discovery enforced, cost of the loop, technique session against sign-in rules (keyboard), the word `technique` | The orchestrator asked for the word to stay with the user |
