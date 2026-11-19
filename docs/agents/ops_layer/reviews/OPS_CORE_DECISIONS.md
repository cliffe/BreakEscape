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

Round 2 (`OPS_CORE_R2.md`). The major, all ten minors and the three nits were acted on. The
entries below took a different fix from the one suggested.

| Finding | Decision | Why |
|---|---|---|
| M-new-1 | A new plain type `technique_card`, required on every card, with a placeholder PNG copied from `qr_card.png`; not an existing card type | A type of its own cannot collide with present or future type-keyed code, and it lets the validator refuse `itemType: "technique_card"` |
| m-new-5 | Authored `label` required with `itemType` or `global`, not a fixed engine line per kind | A fixed line tells the player nothing about what to fetch |
| m-new-6 | `no_grant` moved to just after the status check and kept quiet; `needs` on a weakness with no `grants` is a warning only where the scenario has cards; no "Report only" mark on the finding | The S2 scenario has needs and no grants by design and must stay unchanged after S3; the refusal text says plainly that nothing can be gained |
| m-new-7 | The `itemType` overlap with cards is a validator error (`itemType: "technique_card"`), not a warning | With one fixed card type the overlap can be refused outright |
| m-new-4 | The no-route folder refusal at a technique session stays 403 `unreachable`; only the keyboard desktop gets `network_only` | The client already keeps its copy on `unreachable` |
| m-new-9 | Put to the user as question 5; body written to "count it, with a validator warning" | Dropping technique sessions from `signedInPcs` would stop network work feeding keyring `session` proofs |
| Log plan 13.7 | A quiet `technique_refused` saves only when the helper's result is `stored?`, where 13.7 says the route saves on every 422 | Orchestrator ruling; raised back in cross-plan request 8 |
| M3-1 | The `network_only` handler shows the plain sign-in screen with no line, so `container-minigame.js` does not import `ops-model.js`; its own node test `container-network-only.test.mjs` replaces the assertion in `pc-sessions-access.test.mjs` | Avoids adding `ops-model.js` to about ten copy lists; the keyboard normally shows that screen with no message |
| m3-5 | Took the first option: `opsDiscovered.services` records each checked service, `already` only on a recorded repeat, `service_checked` on the first check whatever it found; no validator warning | A warning would leave the wrong `already: true` and the objective that never fires |
| m3-4 | The `service` lookup shows the service name as given, never its `label`; the row's `where` is not passed to the lookup | A lookup takes the game and an id only, and the row already names the host |
| m3-2, m3-2 (log) | Core states that `from` uses the log plan's `foothold` kind and that a quiet refusal follows the log plan's bounded-save rule; the log plan makes both edits | Orchestrator rulings 2 and 4 |
| Trim list | Applied every entry, plus the section 6 repeat table and six section 2 rows; the plan is 1684 lines, not about 1555 | Four trim entries are single-line table cells, which shorten no line count, and the fixes for M3-1, m3-5, m3-4 and the privilege and skin rulings added about 45 lines |
| Skin ruling | Panels shows no separate quiet-or-noisy note and no `ops-model.js` text export for it; the pending guard is described as the shared `perform` path keyed by action and target | Coordinator ruling replacing the first form of the skin request |
| M4-1 (R4) | Fixed the other way round from the finding's suggestion: core builds the `perform` path and its one guard (unplug, sweep, scan at S1; check and confirm/Probe at S2; use at S3) and folds in the old unplug guard; `use` is keyed by card and finding together; the skin only routes its renderer through it | Orchestrator ruling 1: core's stages land before the skin |
| m4-2 (R4) | Did not say host by host which quiet refusals in the technique playtest share the spare's host; beat 5a says the run sends fewer than ten in all, so no host reaches its limit. The plan also does not say whether noisy refusals spend the same count | The total (beats 2, 5 and 5a) is under ten whatever the hosts; the counter's scope is the log plan's to define |
| m5-1 to m5-3, n5-1 to n5-3 (R5) | All written in. Core 5.3 now says `perform` marks the key and redraws before its first `await`, the row drawing reads the pending set, and names the exposed `pending` set, `pendingKey` and `perform(offer)`. The count wording says only limited calls that stored spend it | The skin's request for a readable set is answered in the core's own text, so no cross-plan request is added |
| X1 (R5) | Core sentences about a save window left as they are (section 5.4, the noise test row, the `technique_refused` log row) | The log plan is being revised; they are matched to it once it settles |
