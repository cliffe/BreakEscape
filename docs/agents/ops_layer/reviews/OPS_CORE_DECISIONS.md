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

## Picks 2026-11-19

- CORE-2 b: discovery is a display. It changes what the network view lists; sign-in, desktop and shares are not gated. A service scan still needs the sweep. The unswept block lists rows of PCs the player holds a session on. `host_reachable_through?`, `from_route_refusal` and `resource_admits_player?` are unchanged.
- CORE-4 e: free, but logged. `evidence`, Probe, the noise count, `opsNoise`, `alert` and `network_alerted` are removed. Decoys stay because they teach false positives; a card on a false finding is refused and logged. The defence-stream idea (price guessing from the log rows) is parked in cross-plan request 12.
- CORE-5 a: a technique session ignores `remote: "blocked"` through its own foothold and ignores account lockouts. The question is gone from section 15.
- CORE-8 a: a technique session counts toward `signedInPcs`, with the validator warning. The question is gone from section 15.
- CORE-11 a: the word stays under separate keys: `technique_card` for the item field and proof kind, `se_technique` for the pretext line key, always "technique card" in prose. One question remains in section 15: whether the pretext rename is made, with the old key still read (recommended), or the pretext key is left as `technique`.
- CORE-12 b: clicking a PC with a technique session opens its desktop through the foothold (`networkLinks.openSession`, new reader `remoteViewFoothold`) with a remote-view frame, line and wipe. Compromised PCs, jacks, implants and host rows get a red tint and a bolt from `systems/compromise-marks.js`, drawn in code with no art file; a 16x16 icon is a later polish item needing the user's yes. Wi-Fi APs and shares get no mark. The `network_only` refusal is removed; `settle_session_at_keyboard!` skips technique sessions.
- SHARED-4 a: a log row for every sweep (a repeat with `save_limit: true`) and every technique use (granted and refused, refusals always `save_limit: true`); scan, check and confirm write the first time only. A repeat of a granted use writes nothing (left as the earlier sections had it; the orchestrator may widen it).
- Z1: log stages L1a and L1b are built and on main before S1; step 1 records its fixtures with L1a's golden mechanism.
- `tells.techniques` keeps its name in both options of the pretext question.
- Three accepted calls: ops routes still need a sweep before a scan; the unswept block lists PCs with a held session; Wi-Fi APs get no compromise mark.
- needsSession keyboard-only: only a session at the PC's own keyboard (typed sign-in or claim) satisfies an object's `needsSession`; a technique session does not, though a click serves its desktop. Section 5.4 table and the `network_technique_session_test` row say so; the privilege plan's request is answered in cross-plan request 1.
- Every technique use writes a `technique_used` row, a repeat of a granted use included, with `save_limit: true` so repeats are bounded by the log helper's limit. The "a repeat writes no row" rule is removed from sections 5.4, 5.6 (exact repeats), 11 and 13.

## R6 fixes (2026-11-19)

- M1: taken as suggested, with a local `restTint(obj)` in `interactions.js` reading `sprite.compromiseTint` in place of the three `clearTint()` calls (no import, so no copy-list change); the ghost stays blue and carries no mark; `compromiseMarks()` reports the live `tintTopLeft`; `interactions.js` added to 12.2 with a node test.
- M2: orchestrator ruling, displacement skipped: `displaced()` keeps any remote copy (`remote === true`, technique and every other remote one), and `record_borrow_done!` deletes only a record with neither `foothold` nor `from`, so client and server agree (the server half goes beyond the review's client-only option). New "An NPC at the PC" paragraph, two comparison rows, section 10 row (no scenario with `networks` has a borrow), 12.2 rows, Rails and node tests. No test_ops_access beat added for it; the node and Rails tests cover it.
- M3: orchestrator ruling: key `se_technique`, the judge and validator read `se_technique ?? technique`, the old key is an info line, both keys means `se_technique` wins with a warning; part 5 judges an old-key copy and a both-keys copy against the snapshot; also fixed the `pretext-judge.js` path and kept `technique` declared in the schema.
- m1: section 1 says a granted session does not satisfy `needsSession`; the 12.2 row now cites `NA:498` (`implant_foothold!` requires a blank `foothold`, which a technique record never has) and says a technique copy does count as held at the keyboard; the comparison row gives the same reason.
- m2: taken as suggested: the reader sits just before the `heldAtKeyboard` branch in `interactLoginPc`, and in `openLoginPc` after the headless check for world sprites only; headless hosts in a room keep their observations (the review allowed either).
- m3: taken: taskbar on a technique remote view is Sign out, plus Switch user only where remote sign-in is allowed (`canSwitch: false` otherwise, in both minigames); Sign out is the way to the keyboard; test_ops_access beat 17a ends with a keyboard session meeting an implant's `needsSession`, and the scenario gains the note and implant device.
- m4: new `network_foothold_dropped` emit from `_dropFoothold`, `compromise-marks.refresh()` on it; `load()` needs none because it runs before rooms; `network-links.js` added to 12.2.
- m5: frame, line and wipe keyed on the copy's `via === 'technique'`, keyboard fallback included.
- m6: orchestrator ruling: every sweep and every technique use writes, repeats with `save_limit: true`; scan, check, confirm first time only; no quiet/noisy split, no `network_alerted`. Section 13 gives the six `EVENTS` lines (`ok` 10 on `network_swept` and `technique_used`, `refused` 10 on `technique_refused`) and says the log plan's list is to match it; request 8 asks for both `ok` registrations. Log plan edited in its `network_swept` EVENTS example, its 13.7 network rows (`network_alerted` and the `how` detail removed) and request 3 only.
- m7: orchestrator ruling: the 403 `not_responding` writes a `technique_refused` row with `save_limit: true`; only the two 404s write nothing; `not_responding` added to the closed `reason` list in both plans and to the technique tests.
- n1: "section 5.5" corrected to 5.4.
- n2: names the item field `technique_card`.
- n3: key kept as `technique`; section 0 says why (it pairs with `via: "technique"`, and the finding id identifies the use).
- n4: the S3 live proof closes the desktop by its Close, then unplugs by the real control, then reads `no_session`.

## R7 fixes (2026-11-19)

- m1: ruling: the behaviour change stands; section 10 part 3 lists `pc-sessions.test.mjs:543` (remote kind leaves the displaced loop, new assertion: a remote copy is kept on `npc_sat_at`, no logout, no `pc_signed_out`) and `:568` (inverted: kept, nothing sent) as the two tests that change; the comparison-table note excepts the two NPC rows; the `pc-sessions.js` 12.2 row adds the header (`:81-87`) and docstring (`:737-741`) edits.
- m2: ruling: one click order, the player's own copy first (remote view for a technique copy, keyboard desktop for any other), no guest session offered until sign-out; a case in `pc-remote-view-click.test.mjs`.
- m3: ruling: one mark rule, a technique copy with `remoteViewFoothold(pcId)` not null, in the source table, `refresh()` and `syncRoom`; `compromise-marks.test.mjs` case for a dropped foothold followed by `syncRoom`/reload.
- m4: ruling: `biometrics-minigame.js` gets the same local `restTint(obj)` as `interactions.js` (no import, so no copy-list change, which departs from the review's shared util); added to the shared-files table and a case in `interactions-compromise-tint.test.mjs`.
- m5: the scan test row now matches section 13: first sweep passes no limit, a repeat passes `save_limit: true`, `host_scanned` once only.
- m6: `desktop-remote-view.test.mjs` row gains the keyboard-fallback frame and line, the no-link line, and `canSwitch: false` on a blocked host in both minigames; `network_technique_session_test` row adds the needsSession refusal with the device still held.
- n1: build step 10 names the 403 `not_responding` and every 422.
- n2: section 10 row names `credentials_declared?` (`NA:1504-1507`) for `from` sessions and both scenarios without `networks` or `credentials`.
- n3: step 9 gives the new `info` helper in `pretext.rb` and its `ℹ️ INFO: SOCIAL:` format.
- n4: declined here: the wording sits in the log plan (`LOG:607`, `:939`, `:992`), which another agent edits.
- n5: beat 17a clicks `desk01` again to open the remote view, then Sign out.
- n6: the password column of the `needsSession` row reads "only once settled at the keyboard", with `NA:498`.
- Cross-plan F3 (`CORE:1435`): same edit as m5.
- Cross-plan F7 (`CORE:1443`): the `network_technique_session_test` row says the device is still held and that the reason is the privilege plan's test.

## Round 2 picks (2026-11-19)

- R2-6 b: the pretext line key stays `technique`; the card is `technique_card`; `se_technique` removed everywhere (S3 stage row, 4.3 bullets, schema row, 9.2 warning and info rows, section 10 rename row and part 5, 11.3 pretext-key test, steps 1 and 9, 12.2 row, item 13 of 14). Part 5 is now one snapshot test, renamed `pretext-verdicts-unchanged.test.mjs`. 4.3 says which key is which.
- R2-6 b: question removed from section 15, which is now "Decisions".
- R2-7 a: session-type implants stay keyboard-only; the question is removed and the rule stated as a decision in section 15 (already in 5.4).
- R2-11 a: the plan mentions neither existing-code bug, so no change.
