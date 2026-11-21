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

## Skin request 3 (2026-11-19)

- Section 9.1: schema rows for `cli` on `networks.<id>` (range, hosts id map with address) and on `definitions.service` (S1), and one shared `definitions.cliFinding` on weakness and decoy (S2); a paragraph pointing at the skin plan's `check_realism_skin` for every rule beyond the schema.
- Section 5.2: new "Display fields (`cli`)" bullet: row builders copy each object unchanged at its stage (range on the block, address after the sweep, service `cli` after the scan); absent means omitted, never `{}` or `null`; nothing reads a `cli` field; nothing added to synced `player_state`.
- Section 5.3: the check builder copies a finding's `cli` for weakness and decoy alike through one builder, same keys; the confirm's finding carries it too.
- Section 6: paragraph "Display fields in these answers" (sweep, scan and check answers; repeats; no check reads them).
- Section 7: five new serving rows (range, address, service `cli`, finding `cli`) and the no-exposure paragraph gains the bootstrap, room, stage and decoy-equals-weakness assertions.
- Section 11.2: new `network_cli_fields_test.rb` row (right stage, absent before, absent from bootstrap, room, refusal and sync answers, decoy and weakness indistinguishable, omitted when not authored, nothing reads a `cli` field).
- Section 11.4: the leak collector lists the `cli` strings at their serving stage, and each `test_ops_*` scenario that authors them lists them in its collector.
- Section 14, item 6: notes that the `cli` objects are served as 5.2, 5.3 and 7 say. The core's `product` field and its rule are unchanged.

## R8 fixes (2026-11-19)

- M1: the three `cli` schema rows are gone from 9.1, replaced by a note that the skin plan declares them at its K3 (until then the four closed blocks refuse `cli`); section 3 adds `cli` to the early-write table; the core keeps copying at S1 and S2 and tests it on a test-only fixture under `test/fixtures/`.
- m1: 4.3 now says `technique` appears in a scenario file only on a pretext line, names the two engine uses (session record, log row detail), and 14 item 13 ends "in scenario files".
- m2: section 10 part 3 no longer allows edits to the pretext fixtures.
- m3: the leak collector gains the `listed` tag for `range`, collects `address` only on discovery networks, drops `protocol`, collects a `service` word only when new, and matches addresses as whole tokens; the 5.x serving rows in section 7 say the same.
- m4: the range stays on the block; 5.2 says the skin validator enforces a range on every discovery network or on none (dependency only, rule owned by the skin plan); 14 item 6 repeats it.
- m5: the note in 9.1 says the skin's `cli.hosts` keys are plain strings (max 64) so `kit_deviceA`, `planted_deviceA` and `P1` (found in `scenarios/`) fit.
- m6: ten rows added: section 3 S1 and S2 Adds, 12.1 steps 3, 5, 6 and 8, and 12.2 `network_access.rb`, schema and leak scanner rows; the builders sit in `network_access.rb`.
- n1: 4.3 says the validator reads `technique` and its fixtures are unchanged.
- n2: section 10 part 5 kept, with the reason (the MFA plan edits `pretext-judge.js`).
- n3: section 15 retitled "Open questions for the user", "None open."
- n4: 4.1 gains the pointer to the skin plan's section 4.2 and section 5.2.
- n5: 5.2 says "beyond what the range's size implies"; no prefix cap asked.
- n6: kept the log detail key `technique` (renaming touches the log plan); section 13 now says what the three uses mean and that they never meet.
- n7: `network-view-ops.test.mjs` row asserts the Panels draw no `cli` string.

## Skin requests 3-4 applied (2026-11-19)

- Req 3, 5.2 "Display fields": `address` rides on the row whenever it is listed: open network (`discovery: "open"` or absent) from the first `GET /network` answer that lists it, discovery network from the sweep; a held-session PC row on an unswept discovery network carries none until the sweep.
- Req 3, section 6 "Display fields in these answers": names `GET /network` as the carrier of an open network's addresses.
- Req 3, section 7: the address row restated for both network kinds; the leak collector now counts an open network's addresses at the first answer (tag `listed`), replacing "discovery networks only" (which reversed m3's address clause); the no-exposure paragraph restated to match.
- Req 3, 11.4 leak scanner: `address` tagged sweep on a discovery network (held-session rows included) and `listed` on an open network.
- Req 3, 11.2 `network_cli_fields_test`: held-session row with no address before the sweep; open-network cases (`"open"` and absent) with the address in the first `GET /network`.
- Req 3, section 3 S1 row, 12.1 steps 3 and 5, 14 item 6: the serving rule stated in each.
- Req 3 exception, not applied: its clause that the core's schema declares the `cli` objects. The core keeps 9.1 as written (the skin plan declares the `cli` rows at its K3; the closed blocks refuse `cli` until then). Orchestrator decision; the skin plan is being corrected to match.
- Req 4, 5.3: `perform(offer, { echo } = {})` with no-op `onSent`/`onEnded`; the hook points mapped to real lines of `network-view-minigame.js` (`unplugBox` guard `:830-832`, key in `:835`, request `:839`, `finally` `:840-842`, reset `:848`, notice `:850`, `complete(false)` `:843-846`, listener catch `:295`); answer `null` on throw or no reply; a throwing hook is caught and logged and neither stops the request nor the tail.
- Req 4, 5.3: onSent placed between adding the key and the synchronous pending redraw (the request leaves this open; chosen so a log line it writes shows in that redraw). Until the skin's K1, the `showResult` step is the scene's own result drawing at that point.
- Req 4, 5.3 note: a throw from the unplug request no longer escapes `unplugBox` with the button disabled; the busy and wrong-jack answers of `unplugFromView` (`network-links.js:548-553`) are answers, so both hooks run for them.
- Req 4, 11.3 `network-view-ops.test.mjs`: guard cases and `network-view.test.mjs` pass unedited with default hooks; one hook-order case (answer, refusal, throw, null; unplug before `complete(false)`; rejected press calls neither; throwing hooks; same request with and without echo).
- Req 4, section 3 S1 row, 12.1 step 4, 12.2 scene row, 14 item 6: `perform` signature and hooks stated.

## R9 fixes (2026-11-19)

- M1: 5.2 and 5.3 copy `cli` by named key (range; address; protocol, service, banner; title, module, script), never whole, so `_` notes never reach `GET /network` (it runs no note stripper); `_note` case added to `network_cli_fields_test`.
- m1: 5.2 puts the address rule in `host_row(pc, foothold_id)` (host's own network open or in `opsDiscovered.networks`); down-block held-session case added to the test; 12.1 step 3 updated.
- m2: new `access_leak_scanner_test.rb` (extended) row in 11.2 at S1/S2 on the test-only fixture (tags, whole-token address, `protocol`, `service` word).
- m3: skin plan (its fixer has it); skipped here.
- n1: previous-result clear (`:834`) placed between guard and key-in in the 5.3 hook order.
- n4: `listed` tag carries a network id (and row id for an open network's address), stated in 11.4.
- n5: row 1374 reworded as a skip of the `connectsTo` check, not a second kind rule; skip added to 14 item 7; device-row builder named as an `address` copier (5.2, 12.1 step 3). Asking the cracking plan to say "error" is left to its fixer.
- n2, n3: not in the instruction list; not applied.

## Skin catalog requests applied (2026-11-19)

- Req 3, section 3: S2 row gains the catalog loader and the finding's `cli` as a named-key copy of the linked catalog entry; early-write row now names `cli` (network, service) and `realism` (weakness, decoy), with `cli` on a weakness or decoy refused at every stage.
- Req 3, 4.1/4.2: 4.1's `cli` pointer limited to networks, hosts and services; new 4.2 bullet for the `realism` link (plain catalog id, server-side catalog, no `cli` on a finding, display only).
- Req 3, 5.2: row builders tied to the real code (block built inline in `network_blocks` `NA:795` and `down_blocks` `NA:813`, `network_rows` `NA:873`, `host_row` `NA:1043`; the device-row builder is new in `network_ops.rb`, which does not exist yet); finding key list replaced by the link; S2 tests use a test-only catalog folder.
- Req 3, 5.3: new bullet for the finding's `cli` (title, module, script, advisories, output by named key at build time; `_` keys and the link id never sent; unresolved link: no `cli`, server warning naming the id, no status/alias/log change); new bullet for the loader (read once, frozen, refuses duplicate id or module, other folder in tests, no route).
- Req 3, 5.3 additions not in the request: the loader treats a missing folder as an empty map (the folder arrives at the skin's K3, after S2), and the builder calls the loader only for a linked finding, so a scenario without links never reads it.
- Req 3, section 6: check and confirm findings carry `cli` only where the link resolves; no answer carries a link id; nothing reads the link.
- Req 3, section 7: finding `cli` row restated for catalog fields; new "never" row for link ids, the catalog and unlinked entries; no-exposure paragraph gains the link id and "entries of one form" for the equal key sets.
- Req 3, 11.1: new `realism_catalog_test.rb` (S2) on `test/fixtures/realism_catalog/`.
- Req 3, 11.2: `network_cli_fields_test` finding cases moved to linked entries in the test catalog (exact fields, `_` note, no link id, unlinked finding, unresolved link with warning, retargeted links change nothing); `access_leak_scanner_test` gains the catalog-string and never-tag cases.
- Req 3, 11.4: collector reads a linked entry's strings from the catalog (tag check); link ids and unlinked entries' modules tagged never.
- Req 3, 12.1 steps 6 and 8, 12.2 schema row and new-files list, 14 item 6: loader, test folder and link resolution stated.
- Req 5, 9.1: `definitions.cliFinding` dropped; `realism` on weakness and decoy; the rules list replaces "module unique" and "uneven fields" with the all-or-none, resolve, used-once and one-form link rule; catalog checks named as `scripts/validate_realism_catalog.rb`; `check_network_ops` reads no link.
- Section 10 check: new rows for the skin's `check_realism_skin` hook (real-identifier rule only where `services` is declared; the network-id rule unscoped but finds no clash in the eight `networks` scenarios, checked by script) and the loader; part 2 states the snapshot still holds after the skin's K3. The core relies on the skin reading the catalog only for a linked scenario, which the skin plan does not yet say.
