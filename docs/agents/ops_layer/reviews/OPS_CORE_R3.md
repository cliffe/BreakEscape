# OPS_CORE_PLAN review, round 3

Plan: `docs/achitechture/OPS_CORE_PLAN.md` at commit 04dea0645 (1693 lines). `P:n` is a plan line.
Code pointers are repo paths with line numbers, read in this worktree on 2026-11-19. `LP:n` is a
line of `docs/achitechture/OPS_LOG_ROWS_PLAN.md`.

## Status of R2 items

| R2 item | Status | Evidence |
|---|---|---|
| M-new-1 `notes1` placeholder | Closed | P:39, P:422-437: own type `technique_card`, placeholder a byte copy of `qr_card.png`. Checked: `qr_card` appears only at `core/game.js:536`; `pickupToast` (`inventory.js:702-709`) gives the generic "Picked up X" toast to any type that is not notes-family or in `OWN_PICKUP_TOAST_TYPES` (`:693`, lockpicks only); the slot path (`inventory.js:968-985`) builds a slot for any non-notes type; `player-effects.js:72-76` substring checks (`table`, `chair`, `desk`, `safe`, `workstation`) do not match; no item `type` enum in the schema; the validator's sprite check reads `public/break_escape/assets/objects/*.png` (`validate_scenario.rb:75-83`, `:3259-3273`), so the new PNG makes the type valid. Test P:1265 pins slot and toast |
| m-new-1 Fixed on unconfirmed | Closed | P:37, P:343-347, P:543-549, P:978, tests P:1249, beat 8a P:1356 |
| m-new-2 `noiseLimit` on unswept block | Closed | P:501, P:566-570, P:967, P:985, P:1248, beat P:1324 |
| m-new-3 noise keys contradict | Closed | stated once at P:566-570; P:967 and P:1172 point to it; P:845 lists the keys |
| m-new-4 `no_session` drops a live session | **Partly**: see M3-1. New code `network_only` (P:684-696, P:804, P:919), but the client edit targets the wrong handlers |
| m-new-5 `label` source | Closed | P:49-52, P:358-364, P:1049-1050, P:1090 |
| m-new-6 report-only weakness | Closed differently (decisions file) | `no_grant` is check 6, right after status (P:589-590); quiet (P:604); warnings P:1118-1119; graph "(report only)" P:1148. The dead errand remains possible in play but is warned |
| m-new-7 `itemType` identity | Closed | P:350-357; `itemType: "technique_card"` an error P:1090; test P:1249 |
| m-new-8 read-through gaps | Closed | one code list P:916-922 with fixture; P:989 covers 400 and `no_grant`; P:222 and P:1463 name the warnings and `connectsTo`; P:1148 graph edge; request 12 wrapped P:1620-1622 |
| m-new-9 `signedInPcs` | Closed | question 5 P:1678-1693; warning P:1120 |
| m-new-10 quiet refusal save | Closed (core side); log plan still differs, see m3-2 | P:606-610, P:1549, request 8 P:1611-1613 |
| n-new-1 feature ids | Closed | P:237-238 |
| n-new-2 bootstrap whitelist | Closed | P:995-997 |
| n-new-3 one route, two modes | Closed | P:881-883 |

## Findings

### Blocker

None.

### Major

#### M3-1. `network_only` goes into the remote and `from` handlers; the keyboard 403 is handled by the catch-all, which still drops the copy

P:687-693, P:804, P:1170, P:1465 (step 11), P:1501 and the test P:1264 say the desktop's "two refusal handlers" gain `network_only` in their keep list "beside `unreachable` and `not_responding`". Those two lists are `container-minigame.js:1005-1013` (`this.remote`) and `:1015-1030` (`this.fromRoute`). A keyboard fetch carries no query (`:980-981`), so neither branch runs. A 403 at the keyboard reaches `:1053-1063` (`fromReturn`, which calls `dropLocal`) or the catch-all `:1065-1070`, which calls `pcSessions.dropLocal(pcId)` and opens the sign-in screen. So the R2 bug is still there on the one path the code is named for. The P:1264 assertion ("on the keyboard path ... the client still holds the session") would fail against the plan's own edit list, and beat 10a (P:1390) sends the request with a raw `fetch`, which never runs the handler, so the playtest would not catch it.
Fix: name the handlers that matter. Before the `fromReturn` branch, add `if (response.status === 403 && refusal?.reason === 'network_only') { this.complete(false); setTimeout(() => window.openLoginSignIn?.(lockable), 50); return null; }` with no `dropLocal`. Keep the two foothold and `from` lists as they are (a technique session through a foothold is never answered `network_only`). Correct P:687-693, P:1170, P:1465, P:1501. Change beat 10a so the request goes through the container minigame's `loadLoginDesktop` (for example `window.openLoginDesktop` on a client copy whose `via` was edited in the test), not a raw fetch. Where the line text comes from also needs saying: if `container-minigame.js` imports `REFUSAL_TEXT` from `ops-model.js`, that module joins the copy lists of about ten more node tests that copy `container-minigame.js` (`access-from-desktop`, `access-signin-postit`, `access-remote-signin`, `access-relay-desktop`, `container-items-keyboard`, `container-transfer-dialog`, `container-shares`, `engine-fixes-pass4b`, `escaping-shared-helpers`, `engine-fixes-round6`, and others found by `grep -l container-minigame test/js`). P:1273-1278 lists only the four that copy the view. Either show the plain sign-in screen with no line (the simplest, and what the keyboard normally does) or add the copy-list entries.

#### M3-2. `from` on `network_swept` and `host_scanned` is registered as `{ id: 'host' }`, which a foothold id does not resolve to

LP:1050 and LP:1108-1109 register `from` as `{ id: 'host' }`. LP:930-933: every detail value must resolve through `KINDS` to a thing of that kind, and a mismatch raises in test and development. P:1535-1537 and request 8 (P:1611) say the core plan fills the `host` entry of `KINDS` from the `NetworkModel` helpers of 5.1, which list hosts (`hosts_on`). A foothold is a planted jack device, a joined access point or an implanted PC (the log plan's own kinds `jack`, `ap`, `pc`, LP:1076). It is not a `hosts` entry, so the first sweep in any fixture with `logSources` raises.
Which plan changes: the log plan. Register `from` with a kind that resolves any foothold, for example a new `foothold` kind that the log plan fills (it already owns `jack`, `ap`, `pc`). The core plan then says in section 13 which kind `from` uses and that it does not fill it. Until both agree, the S1 controller tests (P:1238-1241) cannot pass.

### Minor

#### m3-1. `test_ops_access` does not say which weakness has no `grants`, and `files01`'s grant is unstated

Beat 5a (P:1384) uses "the one confirmed weakness the scenario authors with no `grants`". The scenario text (P:1363-1375) lists seven findings and gives grants for the printer, `desk01` and `vault01`'s two. The spare and `files01`'s file-service weakness have none written. Beat 15 (P:1395) expects `fixed` from `files01`'s weakness. Because `no_grant` (check 6) comes before `fixed` (check 7, P:589-591), if `files01`'s weakness has no `grants` beat 15 answers `no_grant`, and the beat fails. Fix: say in P:1363-1375 that the spare is the report-only weakness (its `fixedIf` on the alert global then shows the alert's effect, and a card on it after the alert answers `no_grant`, not `fixed`), and that `files01`'s weakness grants something (for example a session as a named account). Also: beat 16 (P:1396) lists `vault01` and `files01` ending on the unplug of jack A, but `desk01`'s technique session from 10a probably came through jack A too. Say which foothold 10a used, and list `desk01` in 16 if it was jack A.

#### m3-2. Log plan 13.7 still says `technique_refused` saves on every 422

LP:1113 "`POST /network/technique`, which saves on every 422" against P:606-610 and P:1549 (noisy always, quiet only when `r&.stored?`). The log plan's own helper rule (LP:850, "A branch that would not otherwise save calls save! only when r&.stored?") supports the core plan. Which plan changes: the log plan, on its row LP:1113. The core plan already raises it (request 8).

#### m3-3. `OpsLog::EVENTS` is placed in the wrong file

P:1492 puts the seven entries in `app/models/break_escape/ops_log.rb`. The log plan keeps `EVENTS` and `KINDS` in `lib/break_escape/ops_log_events.rb` (LP:140, LP:765, LP:826), one line per event to keep merges small. Fix P:1492 (and P:1233, P:1523) to that file, and add the `KINDS` entries (`network`, `host`, `service`, `technique`) to the same 12.2 row.

#### m3-4. `service` detail by bare name is ambiguous across hosts

LP:1110 registers `service` as `{ id: 'service' }`, "shown by name"; P:34 makes a service name unique only on its host, and P:1534-1537 has the core plan fill `KINDS['service']`. A `KINDS` lambda takes the game and an id (LP:1072), so `files` on two hosts resolves to whichever it finds first, and the display (the `label`) can be the wrong host's. The full `<hostId>.<serviceName>` can pass 40 characters. Fix (core plan, section 13): the `service` lookup shows the id itself (the service name), never a label; or the row's `where` (the host) is passed to the lookup. Say which.

#### m3-5. A check that adds nothing answers `already: true` the first time and never writes `service_checked`

P:533-534: `already: true` "when the check added nothing". On a service whose only weaknesses are fixed, or which has none, the first check adds nothing, so it answers `already: true`, and `service_checked` (written only "when the check added at least one finding", P:1546) is never written. An objective or NPC line on that row, or on the client event `network_service_checked`, never fires for such a service, and beat 11 of `test_ops_findings` (P:1360) gets `already: true` on a first check. No leak follows (a service with a decoy behaves the same either way), but the word is wrong and the objective trap is real. Fix: keep a record of checked services (a third list in `opsDiscovered`, `"services": ["<hostId>.<name>"]`, bounded by 8 per host), answer `already` only on a repeat of a recorded check, and write the row on the first check whatever it found. Or keep the state as is and say in 9.2 that an objective on `service_checked` for a service that can yield nothing is a validator warning.

#### m3-6. The `network_only` row sits in a table scoped to blocked hosts

P:794 heads the table "What stays refused on a host whose policy blocks remote sign-in", and P:804 (the keyboard row) is in it. The keyboard rule applies on every host (beat 10a uses `desk01`, which allows remote sign-in). Move the row to the keyboard paragraph (P:680-696), or retitle the table.

### Nit

- n3-1. P:1171, P:1502: `assets/objects/` should be `public/break_escape/assets/objects/`, as P:428 has it.
- n3-2. Question 1 (discovery enforced) is not cited where the body applies it (P:509 "Enforced, not cosmetic"); the other four are cited.
- n3-3. Section 3's not-built-yet table (P:224-238) does not list `type: "technique_card"`. Before S3 the PNG does not exist, so the existing sprite check (`validate_scenario.rb:3273`) already errors. Say so in one line.
- n3-4. P:1266 asserts "the 'admin' tag" in the view; P:1499 says S5a adds "session badges" to the same file, against request 1 (P:1573-1574: S5a "adds no badge of its own"). Make P:1499 agree.

## What reaches the browser, per route (item 4)

Checked and sound. Every route asks `ops_listed?` first, with one fixed 404 body (P:899-909); the 400 depends on no id (P:893-897). On `/network/technique` the card 404 comes after the finding 404 and before `not_responding`, so neither order tells anything unearned. Unswept blocks carry no `ops` and no noise keys (P:497-501, P:566-567). Unchecked weaknesses and decoys are built from the same keys in id order (P:533-536), with `evidence` on both, and a fixed weakness is left out of a check silently. Before a confirm, a fixed weakness's finding has the same keys as a decoy (P:547-549). A Probe on it is quiet (P:545), which says "real", but only at the moment the confirm says so too. `no_grant` before the match and before `needs` tells a holder of a card and a confirmed finding that it is report-only; P:977 records that as intended. `needs` are shown only after confirm, so `no_grant` adds nothing the confirm did not already open. Save timing follows the state change, never a hidden fact. 403 against 404 arises only for a target that is already listed.

## `player_state` (item 5)

Sound. Four keys, all bounded (P:1002-1007), server-written, never in a sync body and outside the bootstrap whitelist (P:994-997). Each route answers only what changed (P:1018). `GET /network` stays the one whole read on the view's existing 5 s refetch, measured under 16 KB at full discovery (P:1255, P:1398). Reload restores the session level through `session_for_client` (P:638-639). m3-5's suggested third list would be bounded at 8 per host.

## Binding rulings (item 7)

Sound. Four routes, `/scan` with two modes, justified (P:881-883). No moves registry, no actor. Neutral terms. `access: "admin"` only when the computed level is admin, through `client_access_level` (P:76-81, P:640-643). A technique session meets no sign-in checks or second step (P:703-705, request 4). Refusals are codes with one client table (P:100-103, P:916-922). Products are invented, and `real_product_names.txt` warns on real ones (P:1125).

## Open questions (item 8)

All five are real choices, each with options and a recommendation, and the body is written to each. Nothing was decided silently that should be asked. One candidate is the `no_grant` placement (it tells a card holder "report only" before any match). The decisions file records it as the reviser's call. The plan states its reason (P:589-590), and the reason holds.

## Trim list (target under 1400 lines, no rule or test lost)

| Lines | Repeats | Suggested cut |
|---|---|---|
| P:54-64 (second half) | `no_grant` and the S2 "not built yet" rule, said again at P:240-246, P:336-338, P:589-590 | keep the `grants` kinds; replace the last six lines with "(sections 3 and 5.4)" (-6) |
| P:66-87 | access level, said again at P:631-648, P:964, P:1167, P:1565-1574 | keep in section 0 only; 5.4 and request 1 point to it (-25 across the copies) |
| P:240-246 | repeats section 0 | two lines (-5) |
| P:342-347 | Fixed rule, also at P:543-549 and P:978 | keep 5.3, point from 4.2 (-4) |
| P:422-433 | the notes-family code tour, which is the R2 evidence | one sentence plus the test pointer (-8) |
| P:443-451 | the word `technique`, said again in question 4 (P:1659-1677) | point to question 4 (-7) |
| P:616-624 | the repeat, also at check 4 (P:584-587) and the 6 repeat table (P:950) | keep 5.4's paragraph, make P:950 a pointer (-4) |
| P:669 | the long `signedInPcs` cell, repeating question 5 | "counts; question 5" (-4) |
| P:680-696 | the keyboard paragraph, partly repeated at P:707, P:804 and question 3(c) | rewrite with M3-1's fix; question 3(c) keeps the options only (-6) |
| P:899-909 | the one 404, also at P:519-525, P:961 and request 11 | keep section 6; 5.2 and request 11 point to it (-8) |
| P:1183-1187 | Scan offered only under `ops`, already P:502-503 | cut (-5) |
| P:1522-1540 | the helper contract restated from the log plan, then again in request 8 (P:1603-1613) | keep the table and three lines; request 8 keeps only the open points (-20) |
| P:1565-1598 | requests 1, 3 and 6 restate sections 0, 5.4 and 5.5 | one or two lines each with section pointers (-20) |
| 11.2 rows P:1248-1254 | `network_noise_test` and `network_technique_test` cells re-list the 5.4 rules | "section 5.4, each rule one test" plus only the cases not in 5.4 (-10) |

Together these cut about 130 to 140 lines, which brings the plan to about 1555. Getting under 1400 needs more: 11.4's three beat tables (P:1317-1398) could move to the scenarios' `PLAYTEST.md` drafts, leaving each scenario's one-paragraph setup and a list of the beats' names (-60). Section 2 (P:175-209) could shrink to the rows a decision rests on (-15). Section 6's repeat and stale table (P:939-953) could fold into one rule paragraph (-8).

## Not checked

Section 2 pointers other than those used above (NA, GM, DG, VN, CK line numbers). 11.5 against the live tooling. Step-by-step 12.1 against the file list. The rest of the log plan beyond 13.1, 13.2, 13.5, 13.7 and request 3. `pc-sessions.js` `heldAtKeyboard` (the plan relies on it to keep the keyboard from asking; `unlock-system.js:266-296` reads it).

## Verdict

Not yet clean: two majors (M3-1, a client fix aimed at the wrong handlers; M3-2, the `from` kind, mostly a log-plan change), six minors and four nits. Round 4 can be a delta review: both majors are local edits with named code, and nothing found calls for a redesign.
