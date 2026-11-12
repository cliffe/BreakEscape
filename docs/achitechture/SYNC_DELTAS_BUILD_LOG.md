# Player state deltas: build log

Branch: `build/sync-deltas` (off `main` at 6a834437c). Worktree
`.claude/worktrees/p-sync-build`, `node_modules` symlinked to `../p-9-2-h/node_modules`,
`.bundle/config` copied from `../p-9-2-h`.

Plan: `docs/achitechture/SYNC_DELTAS_PLAN.md` (Final). Build order is plan section 9. Tests follow
the shared brief's test lock rule: run every changed test file and every file that imports a changed
module, no full suites, no lock. The orchestrator runs the full suites per merge batch.

Standing constraints for this build:
- Another build (C3 replies, `build/c3-replies`) is editing `social_feed.rb` and `access_work.rb`
  at the same time. Keep edits to those two files minimal.
- Live proof uses a keyless server on port 3050 or higher, never :3000; check the port is free
  first; run headless (`--headless` to session-start.sh), `setFPS(20)` with fixed steps on.
- Never run `db:create`, `db:schema:load`, `db:migrate`, `db:reset`, `db:drop`, `db:setup`. The dev
  database is shared.
- Env: `export RBENV_VERSION=2.7.8` in every shell; postgres up
  (`pg_lsclusters | grep -q online || pg_ctlcluster 16 main start`).

## Progress

| Step (plan s9) | State |
|---|---|
| Import plan, audit, R1-R5 reviews | Done, committed |
| 1. Groundwork: named constants in game.rb | Done, committed, tested |
| 1. Groundwork: `stableJson` + `StateSync.stableJson` | Done, committed, tested |
| 1. Groundwork: `cpWithin`/`cpSlice` (three copies + shared node test) | Done, committed, tested |
| 1. Groundwork: phone `keyOf` option + stableJson wiring at the sync call sites | Done, committed, tested |
| 1. Groundwork: remove unused `ApiClient.syncState`/`updateInventory` | Done, committed, tested |
| 1. Groundwork: `stableJson` in `buildChanges`/`mailJobsChangeKey` (item 2) | Done, committed, tested (`06815b055`) |
| 1. Groundwork: export clips (item 4: clipMail*, phone/ink mirrors, mail constants) | Done, committed, tested (`9f85871c6`) |
| 1. Groundwork: constants test + literal scan (item 5, part) | Done, committed, tested (`3c7d13c96`) |
| 1. Groundwork: shared sanitiser fixture behaviour test (item 5, rest) | Done, committed, tested (`efe00765a`) |
| 1. Groundwork: registerPart/track, item_for_answer, prepare_bootstrap_state!, refuse_oversized_body (item 6) | Done, committed, tested (`0136faad5`) |
| 1. Groundwork: live-proof tools (item 8) + baseline (item 9) | Tool + `--seed-full-cloner` built and tested; baseline bootstrap/case-A numbers recorded (see Baseline) |
| Controller test for savedCurrentRoom (task 3) | Done, committed, tested (`853b69a59`) |
| 2. R1 seeding | Done, committed, tested (`c12d9d1e7`) |
| 3. P2 inventory/network answers | Done, committed, tested |
| 4. P1 cloner one-card deltas | Done, committed, tested |
| Merge main (batch 9, 33c003230) into the branch | Done (`f03396201`); capture tests reran green |
| 5. R3 capture-log seen keys | Done, committed, tested (`cb269170c`) |
| 6a. R2 server-owned capture record (ships first) | BLOCKED pending reconciliation with main's usePayload-secret fix (see handover) |
| 6b. R2 reveal/proof gating | Not started |
| 7. Node + Rails size tests, then live proof A to F | Not started |
| 8. One release later: remove transition code | Not started (separate release) |

## This session (2026-11-12, builder 6: merge, step 5, 6a assessment)

Did the required merge, step 5 (R3), and stopped at the 6a boundary on a cheat-critical finding.

- Merged `main` (batch 9, 33c003230) into `build/sync-deltas` (`git merge main`, merge commit
  `f03396201`). No manual conflict resolution was needed (clean auto-merge of game.rb,
  network_access.rb, network-links.js and their tests). Reran the four capture tests the brief
  named: `capture_payload_secret_test`, `capture_payload_secret_routes_test`,
  `capture_secret_endpoint_test`, `lab_physical_pentest_secrets_test` -> 55 runs, 1198 assertions,
  0 failures.
- Step 5 (R3), commit `cb269170c`: `capture-log-model.js` gains `SEEN_PREFIX`; `readSeen` now
  returns the union of the legacy whole-list (read only) and every `__capture_log_seen:<key>`
  global whose value is `true`. `capture-log-minigame.js` writes one key per newly seen row
  (`writeGlobal(SEEN_PREFIX + k, true, { openChat: false })`) instead of rewriting the whole list.
  `test/js/capture-log.test.mjs`: the two existing seen-write tests moved to the per-row shape, plus
  a `readSeen` merge unit case and an old-save-list-only case (plan 7.5). 18 tests pass. Only
  `capture-log-minigame.js` imports the model, and no other code reads `SEEN_GLOBAL`, so no harness
  copy list changed.

### 6a (R2) is blocked on a merge conflict of design, not of text

Main's batch-9 `usePayload-secret` fix (commits `91849ba67`, merge `a5dd28d6e`) already added, in
`app/models/break_escape/game.rb`, a parallel secret-serving path that overlaps plan 6.3's proposed
R2 writer pass and `candidate_secret`:

- `authored_capture_secret(entry)`, `authored_capture_secrets`, `build_authored_capture_secrets`,
  `usepayload_captures`, `hard_access_capture_value?`, and `CaptureModel.hard_access_values`
  (lib/break_escape/capture_model.rb). `capture_secrets_for_client` (game.rb:1250) now serves a
  writer/`usePayload` secret by **target id** against the **authored `scenario_data`**, after the
  page pass and the account pass, with: the account-holder guard (skip an owner that holds an
  account, and skip an address that is an account username), AND a hard-access-value guard the
  plan's `candidate_secret` does not have (a secret equal to any password/PIN lock code, Wi-Fi PSK,
  RFID/biometric `requires` or flag is never served on the capture record alone).

Plan 6.3 (written against base 6a834437c) instead proposes a server-owned `seCaptures` record, a
writer pass keyed on the stored `writer` **path**, and a `candidate_secret` with only the
account-holder/payload-owner guard (no hard-access guard). The merge note itself says "Your step 6a
captures fix must build on it." Applying plan 6.3 mechanically would (a) duplicate the secret-serving
logic main just added, (b) drop main's hard-access-value withholding, and (c) key secrets by a
different path than main. Because this path serves passwords and PINs, getting the reconciliation
wrong is a cheat-policy regression, and it cannot be live-proven within one session (step 7 live
cases run after step 6).

This is an orchestrator/user decision, not a mechanical build. Recommended before 6a resumes:
decide whether 6a's server-owned record replaces or wraps main's `authored_capture_secret` path, and
whether the writer pass should stay keyed by target id (main's shape, simpler, already tested) or by
the stored `writer` path (plan 6.3). Whatever is chosen, the hard-access-value guard main added must
be preserved. Steps 6b/7/8 all sit behind 6a and are untouched.

## Commits (newest first)

- `cb269170c` Step 5 (R3): capture-log seen rows as one key each (see this session, above).
- `f03396201` Merge `main` (batch 9) into `build/sync-deltas`; capture tests reran green.
- Step 4 (P1): cloner saved cards as one-card deltas. Server: `add_saved_card!` (identity and
  name from the scenario definition, rfid_data from the client picked to `SAVED_CARD_DATA_KEYS`,
  per-card 4 KB and list 64 KB/50 caps, replace-in-place), `remove_saved_card!` (listed:false mark),
  `repair_saved_cards!`/`cards_need_repair?`/`saved_card_ids_to_repair` wired into
  `bootstrap_state_needs_write?`/`run_bootstrap_writers!`, `real_cloner`, `npc_card_definition_for`;
  `record_card_clone!` gains `card:` and answers `saved`/`reason`; `update_cloner_saved_cards!` is a
  filtered merge (kept for one release). Controller: `clone_card` passes `card`; `/inventory`
  `remove_saved_card`. Client: `savedCardForServer`, `removeSavedCard`, `SAVED_CARD_KEYS`/
  `SAVED_CARD_DATA_KEYS` in rfid-data.js; `persistSavedCards` deleted and saveCardToCloner no longer
  calls the server; recordCloneOnServer builds the source from `cloneFrom`/the card id, sends the
  card and `stateSync.track()`s the request; interactions.js and action-menu.js pass `cloneFrom`;
  api-client `cloneCard(source, cardId, card)`. Tests: clone_card_saved_cards_test (10, incl. the
  8 KB cap 413 and the repair), reload_persistence update_saved_cards tests rewritten to the merge,
  rfid-clone-card.test (card body, track, world/no-id warn, cross-side key-set).
- Step 3 (P2): inventory and network answers carry deltas. `/inventory` add/remove answer
  `{ success: true }` (already-held: `{ success: true, already: true }`), no inventory echo.
  Each `/network/*` route answers `added`/`removed` (through `item_for_answer`, so no saved_cards
  rides an echo) only to a request that opts in with `delta: true` (`inventory_delta_opt_in?`);
  an old tab that omits it still gets the whole-inventory echo for one release (4.4).
  `NetworkAccess#network_inventory_delta`/`inventory_answer_fields`; `delta:` kwarg on
  plant/unplug/join/implant. Client: `applyInventoryDelta` in inventory.js (window-exported);
  the four network-links.js call sites apply it; api-client sends `delta: true`; the unplug tray
  scan is gone. Tests: item_for_answer_test (model), network_inventory_delta_test (integration),
  inventory-tray applyInventoryDelta cases, network-links.test mocks moved to the delta shape, the
  games_controller add-answer test updated. `syncInventoryFromServer` and
  `inventory-server-items.test.mjs` kept for the one-release transition (removed in step 8).
- `a57264de3` Step 1 item 8 + item 9: `tools/playtest/sync-delta-proof.mjs` (live-proof
  recorder, pure parts unit-tested in `test/js/sync-delta-proof.test.mjs`), `new-game.rb
  --seed-full-cloner`, and the base-commit baseline numbers in this log.
- `853b69a59` savedCurrentRoom controller test (task 3): present for a string saved
  room, absent when the save holds no string currentRoom (strips it via update_column
  past the create callback that seeds it from startRoom).
- `0136faad5` Step 1 item 6 groundwork: state-sync `registerPart`/`track`/`_partBodies`/
  `_flushKeep`/`_partsPending` (a part rides the sync body; `syncConfirmed` awaits tracked
  clones and stays false while a part has pending entries; parts also feed the pagehide
  fallback lists). `Game#item_for_answer` (deep copy minus `saved_cards`). `prepare_bootstrap_state!`
  locked shell with `bootstrap_state_needs_write?`/`run_bootstrap_writers!` both returning
  false for now, wired into `GamesController#scenario` right after `authorize`.
  `refuse_oversized_npc_frustration` -> `refuse_oversized_body` with `OVERSIZED_BODY_LIMITS`
  (npc_frustration keeps 64 KB, clone_card gets 8 KB); `prepend_before_action` lists both.
  3 new part/track cases in social-state-sync-confirmed.
- `efe00765a` Step 1 item 5 (rest): shared sanitiser fixture
  `test/fixtures/files/sync_bodies/sanitiser_cases.json` (inputs tripping every mail/thread/
  draft/phone/ink rule + the server-stored output), with a Rails unit test
  (`sanitiser_cases_test.rb`, uses `Game.new`, no DB) and a node test
  (`sanitiser-cases.test.mjs`) asserting the client clips match by `stableJson`. Generated once
  by `scratchpad/gen_sanitiser_fixture.rb` from the real server methods; neither test writes it.
- `c12d9d1e7` Step 2 (R1): seed `confirmed` from the bootstrap (seedFromSaved/seedFromBootstrap,
  flattenSavedMailState, pickNote/pickSample, per-section `_held` null-delete gate, game.js wiring,
  server `savedCurrentRoom`). 9 R1 tests + flatten-parity test.
- `3c7d13c96` Step 1 item 5 (part): cross-side constants test + inline-literal scan in
  social-mail-state-export. (Shared-fixture behaviour test still open.)
- `9f85871c6` Step 1 item 4: client export clips mirroring the server (clipMailMessage/Thread/
  Drafts/Json, code-point phone-entry export, ink name limit), mail limit constants under the
  server's names; two existing round-trip tests moved to server-kept fields.
- `06815b055` Step 1 item 2: compare `buildChanges`/`mailJobsChangeKey` strings by `stableJson`;
  drop the now-unused `json` helper.
- `6c3a2e918` Groundwork: remove the unused `ApiClient.syncState` and `ApiClient.updateInventory`
- `3cec62ff4` Groundwork: phone `keyOf` option on `exportPhoneState`/`markPhoneStateSynced`/
  `restorePhoneState`, wired to `stableJson` at the sync call sites
- `2be60f549` Groundwork: fix `phone-player-lines` source assertion for `MAX_PHONE_TYPE_CHARS`
  (a regression the constants refactor `91da28d22` left behind)
- `b8370b88d` Groundwork: `cpWithin`/`cpSlice` code-point helpers in three module-local copies,
  with one shared node test
- `3da4b3480` Groundwork: `stableJson` for order-independent state comparison, with tests
- `91da28d22` Groundwork: name the mail/phone/ink sanitiser limits as constants in game.rb (no
  behaviour change)
- `a7294aece` Bring in the final plan, the state sync audit and plan reviews R1 to R5

## Tests run (this session)

- `bin/rails test test/models/break_escape/mail_state_test.rb
  test/controllers/break_escape/mail_state_sync_test.rb
  test/models/break_escape/phone_message_game_time_test.rb` -> 40 runs, 145 assertions, 0 failures.
  Proves the constants refactor preserves the mail and phone sanitiser behaviour.
- `bin/rails test test/controllers/break_escape/reload_persistence_test.rb` -> 69 runs, 254
  assertions, 0 failures. Covers `merge_npc_ink_variables!` (the ink constant change) and the wider
  reload path.
- `node --test test/js/state-sync.test.mjs` -> 13 pass (includes the new stableJson case).
- Every other `test/js/*` harness that imports `state-sync.js` (13 files: consumables,
  player-health-persistence, engine-fixes-round4, social-mail-scheduler, npc-hostility-persistence,
  social-landing-page-state, social-triage-starter, social-mail-state-export,
  person-chat-pending-reply, social-state-sync-confirmed, social-mail-trim, social-captures,
  npc-ko-drop-retry) -> all pass. Adding an export and a static property does not affect them.

This session (newest work):
- `node --test test/js/cp-helpers.test.mjs` -> 3 pass (the three `cpWithin`/`cpSlice` copies agree
  over ASCII, an emoji at the cut, and emoji-only strings; the cut never splits a surrogate pair).
- `node --test test/js/phone-reopen-and-persistence.test.mjs` -> 26 pass (3 new `keyOf` cases: a
  jsonb-reordered saved entry is unchanged under `stableJson`; the default `JSON.stringify` resends
  it; `restorePhoneState` seeded with `keyOf` is not resent after the NPC registers).
- `node --test test/js/phone-player-lines.test.mjs` -> 22 pass (the `MAX_PHONE_TYPE_CHARS` assertion
  fix; this test was failing on the branch before this session, from the constants refactor).
- Every `test/js/*` harness that copies `state-sync.js` (9 files) -> 104 pass; every harness that
  copies `api-client.js` (10 files) -> 114 pass; `social-mail-trim`, other phone harnesses -> pass.
  Confirms the phone `keyOf` call-site changes and the `ApiClient` deletions break nothing.

No live browser proof yet: the live cases A to F (plan 10.3) run after step 6.

## Live-proof tools and baseline (step 1 items 8 and 9, builder: proof tools)

### The tools (item 8)

`tools/playtest/sync-delta-proof.mjs` (Playwright, headless, ESM). It drives only the
page through `window.__test` and records every request to `/break_escape/games/:id/*`:
method, route (the path after the game id), request body bytes from
`request.postDataBuffer()`, response body bytes from `response.body()` where the page can
still read them (a keepalive pagehide flush is usually unreadable after the navigation,
so its field is left null and read from `player_state`/the server log instead), and
whether a `saved_cards` list rides either body. It writes a JSON record and prints a
Markdown summary table (one row per phase, method and route, with totals and maxima).
Because it only drives the page, it runs unchanged against the base server and the branch
server, which is what the before/after needs. It sets `setFPS(20)` with fixed steps ON
(never `fixedStep=false`) after the bridge is ready.

Cases: `bootstrap` (open, record `GET /scenario` only), `A` (first sync after load: play,
reload, force a sync, record each first `PUT /sync_state`), `B` (seed a full cloner, record
the bootstrap and network answers). The pure parts (`routeLabel`, `gameIdOf`, `summarise`,
`renderTable`, `hasSavedCards`, `parseArgs`) are exported and unit-tested in
`test/js/sync-delta-proof.test.mjs` (8 cases, all pass with plain `node --test`). The full
plant/unplug/join/implant drive (case B) and cases C to F (cloner, captures, Len's PIN,
old save, old tab) run with the rest of the live proof after step 6 (plan s9 item 7); the
tool's recorder and the baseline anchors below are what step 1 needs.

`tools/playtest/new-game.rb --seed-full-cloner` (no value): for test_access_networks only,
in development or test, with no cloner already held, it writes an `rfid_cloner` inventory
item carrying 50 made-up EM4100 cards (12,903 bytes, under the 64 KB cap; the plan's "about
9.5 KB" estimate omits the per-card `rfid_data`, which real cards carry) in the top-level
`saved_cards` shape an old save written by `update_saved_cards` has. The write runs inside
`g.with_lock` (reloads the row, rechecks the inventory, appends, saves once) and acts only
on the game this run created. It prints `SEEDED_FULL_CLONER=...`. Proven live: the happy
path seeded game 1777; `--seed-full-cloner` on test-rfid aborts with "only
test_access_networks".

### Baseline (item 9, base commit 6a834437c, keyless server on :3112 from the p-sync-base worktree)

Games created with this branch's `new-game.rb` against the shared dev database (step 1
changes nothing about game creation), served by the base-commit server. Game ids: 1773
test_access_networks, 1774 test-rfid, 1775 lab_social_engineering, 1776 lab_physical_pentest,
1777 test_access_networks + `--seed-full-cloner`.

**`GET /scenario` bootstrap response bytes (base commit).** This is the anchor for plan
10.2's "no larger than the base commit's measure plus 1 KB"; step 7 writes the relevant
figure into `test/integration/sync_payload_size_test.rb` as a constant (not created here;
that test is step 7, owned by another builder).

| Scenario | `GET /scenario` resp bytes | `POST /inventory` boot echo bytes |
|---|---:|---:|
| test_access_networks | 5,833 | 250 |
| test-rfid | 1,103 | 400 |
| lab_social_engineering | 69,125 | 442 |
| lab_physical_pentest | 23,762 | 1,088 |
| test_access_networks + full cloner | 18,906 | 13,303 |

The full-cloner row is the P1/P2 "before": the 12,903-byte `saved_cards` list rides both
`GET /scenario`'s `playerInventory` (18,906 vs 5,833, +13,073) and every `POST /inventory`
echo (13,303 vs 250). The tool's `saved_cards` detector flags it on `GET /scenario` and
`POST /inventory` for game 1777, and flags the empty `saved_cards: []` on test-rfid's and
lab_physical_pentest's starting cloners (present-but-empty is still the key the delta work
removes from echoes).

**Case A, first `PUT /sync_state` after load (lab_social_engineering, game 1775, base
commit).** Every first sync after a load carried the whole client state at a near-constant
size regardless of what changed: 5,438 bytes (first load), 5,470 bytes (after reload 1),
5,470 bytes (after reload 2). Answer 16 bytes each. This is R1's "before": after R1 the
first sync should send nothing, or only `currentRoom` with its riders (a few hundred bytes).

Case B's per-network-action answer sizes (each `POST /network/*` echoing the ~13 KB list)
and cases C to F are left for the post-step-6 live proof (plan s9 item 7), run against a
base-commit server the same way. The baseline recorder and the anchors above are in place
for that comparison. JSON records are in the session scratchpad (not committed): the
committed evidence is these numbers and the tool.

## What was built, in detail

### Named sanitiser constants (commit 91da28d22)

`app/models/break_escape/game.rb`. Plan 2.1 asks that every inline numeric limit in the nine
sanitiser methods that the client mirrors becomes a named constant, so the client mirror and the
constants/literal-scan test (plan 3.7) read the same values, with no change of value or behaviour.

New constants added:
- `MAX_NPC_INK_NAME_CHARS = 100` (near `MAX_NPC_INK_VARIABLES_BYTES`).
- Phone (near `PHONE_MESSAGE_KEYS`): `MAX_PHONE_TYPE_CHARS = 20`, `MAX_PHONE_STORY_PATH_CHARS = 300`,
  `MAX_PHONE_KNOT_CHARS = 200`, `MAX_PHONE_DEFERRED_TAG_CHARS = 300`, `MAX_PHONE_DEFERRED_TAGS = 100`,
  `MAX_PHONE_SCALAR_KEY_CHARS = 100`.
- Mail (near `MAIL_METRIC_COUNTS`): `MAIL_BODY_KEYS`, `MAIL_FOLDERS`, `MAX_MAIL_TELL_CHARS = 100`,
  `MAX_MAIL_TELLS = 50`, `MAX_MAIL_JSON_KEY_CHARS = 100`, `MAX_MAIL_BOX_ID_CHARS = 100`,
  `MAX_MAIL_THREAD_KEY_CHARS = 200`, `MAX_MAIL_THREAD_CHOICES = 20`, `MAIL_EXPECT_MODES`,
  `MAX_MAIL_EXPECT_TARGET_CHARS = 100`, `MAX_MAIL_EXPECT_OPTIONS = 10`,
  `MAX_MAIL_DRAFT_ACCOUNT_CHARS = 100`.

The literals were replaced in `merge_npc_ink_variables!`, `sanitize_phone_state_entry`,
`mail_state_updates`, `sanitize_mail_message`, `sanitize_mail_threads`, `sanitize_mail_drafts`,
`mail_box_id?` and `sanitize_mail_json`. After the change, those nine methods hold no bare numeric
literal other than `0`, `1`, and the `2` in `split('.', 2)` (which plan 3.7 allows by name), so the
literal-scan test will pass once it is written. `%w[jobs drafts metrics]` (a string list in
`mail_state_updates`) and `%w[currentKnot lastEnteredKnot preloadedKnot]` (in
`sanitize_phone_state_entry`) are string arrays, not numbers, so they are left as literals; the plan
names no constant for them. `sanitize_mail_metrics` and `sanitize_mail_jobs` are deliberately NOT in
the scan list (plan 3.7 names the metrics clamp `100_000` as outside the scan), so their inline
numbers were left alone.

Names match plan 2.1 exactly so the constants test in plan 3.7 can read them by the server's name.
The five existing client names that keep their own spelling (`MAIL_MESSAGE_FIELDS`,
`NPCManager.PHONE_MESSAGE_FIELDS`, `PHONE_HISTORY_MAX_MESSAGES`, `PHONE_MESSAGE_MAX_CHARS`,
`PHONE_STORY_STATE_MAX_CHARS` -> to be renamed `PHONE_STORY_STATE_MAX_BYTES`) are not touched here;
they are handled client-side when the clips and the constants test are built.

### `stableJson` (commit 3da4b3480)

`public/break_escape/js/state-sync.js`: new `export function stableJson(value)` near the `json`
helper, plus `StateSync.stableJson = stableJson;` after the class so a caller holding
`window.stateSync` reaches it as `window.stateSync.constructor.stableJson` with no import (plan 2.1
and 3.2 call sites). It is `JSON.stringify` with a replacer that returns a key-sorted copy of every
plain object (arrays kept in order, undefined dropped as `JSON.stringify` already does). It is not
yet used anywhere: wiring it into `buildChanges()` and the phone `keyOf` is still open (below).
`test/js/state-sync.test.mjs` gains one case (depth sorting, array order significant, undefined
handling, the static).

### `cpWithin` / `cpSlice` (commit b8370b88d) and the deferred-decision call

Plan 2.1 wants the two code-point helpers as module-local copies in mail-scheduler.js and
npc-conversation-state.js and as static methods on `NPCManager`, "not a shared module, so no harness
copy list changes", and then "one node test runs every copy over the same astral strings". The prior
builder flagged these two sentences as in tension and deferred them.

**Decision (this session): export the two module-local copies as named exports and test all three
directly.** The harness copy-list rule is about a module's *static imports* (if module A imports from
module B, every harness copying A must also copy B). Adding a named *export* to a module creates no
import, so it changes no copy list. The helpers therefore stay as three independent copies (satisfying
"no shared module"), and `test/js/cp-helpers.test.mjs` imports all three (the two named exports plus
`NPCManager.cpWithin`/`cpSlice`) and runs each over the same strings. This honours both sentences: no
import is added anywhere, and one test exercises every copy, so a drift in any copy fails it. The
clips in step-1 item 4 call their own module's copy, so they pick up the server's code-point cut.

The helpers: `cpWithin(s, n)` returns `s.length <= n || Array.from(s).length <= n` (the UTF-16 fast
path never undercounts code points, so it is exact); `cpSlice(s, n)` returns `s` when
`s.length <= n`, else `Array.from(s).slice(0, n).join('')`. Identical text in all three copies.

### Phone `keyOf` (commit 3cec62ff4)

`exportPhoneState`, `markPhoneStateSynced` and `restorePhoneState` take `keyOf` (default
`JSON.stringify`), used for every string they store or compare in `_phoneStateSent`.
`StateSync.buildPayload` passes `keyOf: stableJson` to `exportPhoneState`, `StateSync.confirm` to
`markPhoneStateSynced`, and `core/game.js:1800` passes
`{ keyOf: window.stateSync?.constructor?.stableJson }` to `restorePhoneState`. `window.stateSync`
exists before game restore runs (created in main.js:145), so that expression resolves. Default kept so
any caller that passes nothing falls back to today's behaviour. No import added to npc-manager.js, so
no harness copy list changes. This is the phone half of R1: a jsonb-reordered saved thread now matches
its seed and is not resent on the first sync after a load.

### Regression fix (commit 2be60f549)

`phone-player-lines.test.mjs` asserted the literal `value.length <= 20` in game.rb; the constants
refactor (`91da28d22`) changed it to `MAX_PHONE_TYPE_CHARS`, so the test was already failing on the
branch. The assertion now matches the constant and also pins `MAX_PHONE_TYPE_CHARS = 20`. Only two JS
tests read game.rb source (this one and `social-mail-state-export`); the other has no literal-limit
assertion, so no further source-assertion regressions remain from the refactor.

### Removed `ApiClient.syncState` / `updateInventory` (commit 6c3a2e918)

Both had no callers in public JS or tests (plan 9 tidy-ups). `syncState` would have sent all globals
with no `clientTs`.

## This session (2026-11-12, builder 4)

Finished the rest of step 1 except the live-proof tools, and added the savedCurrentRoom test.
Commits `efe00765a`, `0136faad5`, `853b69a59`. Tests, affected files only, no lock:
- Item 5 rest: `node --test test/js/sanitiser-cases.test.mjs` -> 5 pass (client clips match the
  fixture's server-stored outputs). `bin/rails test test/models/break_escape/sanitiser_cases_test.rb`
  -> 5 runs, 21 assertions, 0 failures (server sanitisers match the same outputs). Fixture generated
  once by `scratchpad/gen_sanitiser_fixture.rb` running the real server methods.
- Item 6: `node --test` over the 4 state-sync suites (state-sync, social-state-sync-confirmed,
  social-mail-state-export, sanitiser-cases) -> 51 pass, then over all 22 state-sync/api-client
  importers -> 231 pass (groundwork is inert with no parts registered; the 3 new part/track cases
  pass). `bin/rails test npc_frustration_test.rb reload_persistence_test.rb` -> 107 runs, 490
  assertions, 0 failures (oversized refusal still fires under the renamed filter; GET /scenario
  bootstrap unaffected by the prepare_bootstrap_state! no-op call).
- savedCurrentRoom: `bin/rails test saved_current_room_test.rb` -> 2 runs, 5 assertions, 0 failures.
- `ruby -c` on game.rb and games_controller.rb and `node --check` on state-sync.js -> OK.

No live browser proof yet (items 8, 9 open; live cases A-F run after step 6). No full suites (shared
test lock congestion rule); the orchestrator runs them per merge batch.

## This session (2026-11-12, builder 3)

Built step 1 items 2, 4, 5 (part), and all of step 2 (R1). Tests, affected files only, no lock:
- Item 2: `node --test` over the 14 state-sync importers -> 161 pass.
- Item 4: `node --test` over every mail-scheduler/npc-manager/npc-conversation-state importer
  (50 files, run individually) -> all pass except `event-mapping-unlock-door.test.mjs`, which fails
  with a node test-runner IPC error ("Unable to deserialize cloned data"); confirmed PRE-EXISTING by
  stashing all three source changes and re-running (still fails), so it is not a regression of this
  work. Two existing round-trip tests used draft/thread fields the server also drops (draft `body`,
  thread `pos`) and one oversized body; moved to server-kept fields and many clipped messages.
- Item 5 (part): `node --test test/js/social-mail-state-export.test.mjs` -> 18 pass (new constants
  test + literal scan; later +1 flatten-parity test).
- Step 2: `node --test test/js/state-sync.test.mjs` -> 20 pass (9 new R1 cases). Re-ran every
  state-sync/mail/npc importer individually -> all green except the same pre-existing event-mapping
  flake. `ruby -c` the controller and `node --check` all five changed JS files -> OK.

No Rails tests run this session (the only Ruby change is one extra read-only bootstrap field,
`savedCurrentRoom`; a controller/reload test for it is worth adding in the merge batch). No live
browser proof yet (cases A to F run after step 6).

## This session (2026-11-12, builder 5: steps 3 and 4)

Built P2 (step 3, commit `7c7b55c83`) and P1 (step 4, this commit), merged
`build/sync-proof-tools` in (merge `9263c1fdf`, both build-log sections kept, sync-delta-proof
test rerun green). Tests run (affected files only, no lock):
- P2: `item_for_answer_test` (4), `network_inventory_delta_test` (5), `network_footholds_test` +
  `network_implants_test` + `network_wifi_test` (60), `games_controller_test` + `declared_grants_test`
  (79), `inventory-tray.test.mjs` (16), `network-links.test.mjs` (65), `inventory-server-items` +
  `network-links-routing` + `network-view` (35) -> all pass.
- P1: `clone_card_saved_cards_test` (10, incl. 8 KB cap 413 + repair), `reload_persistence_test`
  (69), `access_model_rfid_test` (30), `rfid-clone-card.test.mjs` (12), and the clone-entry /
  denial / revocation / test-bridge-access / keycard-guard JS set (53) -> all pass.
- `ruby -c` game.rb + games_controller.rb, `node --check` on all five changed JS files -> OK.

### Open / outstanding for P1 (SYNC_DELTAS_PLAN 5.3, 5.4 verification; NOT yet done)
- The cloner-card census: count cloneable keycard/NPC-card definitions in test-rfid and each mission
  with a cloner, and confirm each is within the 50/64 KB bound; record the counts here.
- The `#clone_keycard` ink-tag check (m03-m10, lab_physical_pentest): confirm each tag names its own
  NPC's `rfidCard.card_id`, and rerun the keycard walk (which keycards have no `card_id`/`id`). The
  plan's walk said only m01/m02/m04/m05/m07/m08 have id-less keycards, all in itemsHeld/contents
  (taken and held, not copied in place), so the behaviour change in 5.4 is safe; re-verify before merge.
- The request-size node test (plan 5.6 / 10.1) for `savedCardForServer` of an EM4100 and a fully
  cracked MIFARE Classic card (bytes under 600 / 1 500) is not written yet; it belongs with step 7.

### Remaining steps (not started this session): 5 (R3), 6a/6b (R2), 7 (size + live proof A-F), 8.

## Handover

### Done
- Plan, audit and five reviews imported and committed (`a7294aece`).
- Groundwork constants in game.rb (`91da28d22`), behaviour preserved, mail/phone/reload tests green.
- Groundwork `stableJson` in state-sync.js with a test (`3da4b3480`), all state-sync importers green.
- `cpWithin`/`cpSlice` in three copies with a shared test (`b8370b88d`); the deferred test-access
  decision is made and recorded above.
- Phone `keyOf` option wired to `stableJson` at the three sync call sites (`3cec62ff4`), with three
  new phone-reopen cases.
- `phone-player-lines` constants-refactor regression fixed (`2be60f549`).
- Removed the unused `ApiClient.syncState`/`updateInventory` (`6c3a2e918`).

- Item 2 (`06815b055`): `buildChanges`/`mailJobsChangeKey` compare by `stableJson`; `json` helper
  removed (no remaining callers).
- Item 4 (`9f85871c6`): the mail/phone/ink export clips, exact server mirrors; mail limit constants
  under the server's names; `PHONE_STORY_STATE_MAX_CHARS` renamed `PHONE_STORY_STATE_MAX_BYTES`
  (61440, a byte limit); R5 n6 handled (clip never emits null, no-dot key not exported).
- Item 5 part (`3c7d13c96`): the constants test and the literal scan.
- Step 2 / R1 (`c12d9d1e7`): seed `confirmed` from the bootstrap; see "Step 2 (R1)" below.
- Item 5 rest (`efe00765a`): shared sanitiser fixture + paired Rails/node behaviour tests.
- Item 6 (`0136faad5`): registerPart/track/_partBodies/_flushKeep/_partsPending, item_for_answer,
  prepare_bootstrap_state! locked shell + scenario wiring, refuse_oversized_body cap table. Inert
  until steps 3/4/6a register a part or a bootstrap predicate.
- savedCurrentRoom controller test (`853b69a59`, task 3).
- Merge of main batch 9 (`f03396201`); step 5 / R3 (`cb269170c`). See the top session section.

### In progress
- None. Each commit is a clean, self-contained, tested boundary. 6a (R2) is deliberately NOT
  started: it is blocked on reconciling plan 6.3 with main's merged usePayload-secret fix (top
  session section). Steps 6b, 7 and 8 all sit behind 6a.

### Open (rest of step 1, then steps 3 to 8)

1. DONE (`3cec62ff4`). Phone `keyOf`.
2. DONE (`06815b055`). `stableJson` in `buildChanges`/`mailJobsChangeKey`.
3. DONE (`b8370b88d`). `cpWithin`/`cpSlice` three copies + shared test.
4. DONE (`9f85871c6`). The export clips.
5. DONE (`3c7d13c96` + `efe00765a`): constants test + literal scan, then the shared sanitiser
   behaviour fixture `sync_bodies/sanitiser_cases.json` with the paired Rails + node tests.
6. DONE (`0136faad5`). registerPart/track/_partBodies/_flushKeep/_partsPending (plan 2.2);
   item_for_answer (2.3); prepare_bootstrap_state! locked shell + scenario wiring (2.4);
   refuse_oversized_body with the per-action cap table (2.5). All inert until a part/predicate is
   registered by steps 3, 4 and 6a. NOTE for later steps: item_for_answer and the clone_card 8 KB
   cap have no dedicated test yet (exercised by steps 3/4); add those with P2/P1.
7. DONE (`6c3a2e918`). Deleted unused `ApiClient.syncState` and `ApiClient.updateInventory`.
8. DONE. `tools/playtest/sync-delta-proof.mjs` (recorder + cases bootstrap/A/B, pure parts
   unit-tested) and `tools/playtest/new-game.rb --seed-full-cloner` (no value, --help line, runs
   after the head-start blocks' save!, guarded on test_access_networks + dev/test + no cloner +
   `with_lock`). See "Live-proof tools and baseline" above. REMAINING for step 7: the full
   plant/unplug/join/implant drive in case B and cases C to F are scaffolded/noted but run with the
   post-step-6 live proof.
9. DONE (anchors). Baseline bootstrap sizes and case-A first-sync sizes recorded against base
   6a834437c on :3112 (see Baseline table). For step 7: write the matching `GET /scenario` figure
   into `test/integration/sync_payload_size_test.rb` as a constant from the Baseline table (that test
   file is step 7, another builder's; not created here). Case B per-network-action answers and cases
   C to F run in the post-step-6 proof.

### R5 open items to fold in (brief) -- all land in step 6a (R2), per plan s9 and R5 "Readiness"
- m1: add the authored `targetId` of every writer, every `usePayload.targetId` and every phish
  target id to the capture-log validator as an error over 100 code points, with a case in
  `test/js/validator-capture-log.test.mjs`; name the 100 `MAX_CAPTURE_TARGET_CHARS` in `CaptureModel`
  beside `MAX_CAPTURE_NOTE_CHARS` and `MAX_CAPTURE_FIELD_CHARS`.
- n1: keep both the owner and payload-owner checks in `candidate_secret`, but correct the stated
  reason in plan 6.3/6.7 wording usage, and add ONE unit fixture where the mapping owner has no
  account and the payload owner does, so the payload-owner branch is tested.
- Cheap nits: n2 (`CaptureModel` account-holder test must use `strip.empty?`, not `blank?`, or share
  one method), n3 (seed-full-cloner build details, above), n4 (composed heard-login note under the
  validator, or say so), n5 (validator warning for an `add_capture` secret under an account holder's
  subtree), n6 (clipMailMessage null/no-dot handling, above). Take them where cheap.

### Files touched (across sessions)
- `docs/achitechture/SYNC_DELTAS_PLAN.md`, `PLAYER_STATE_SYNC_AUDIT.md`,
  `SYNC_DELTAS_PLAN_REVIEW_R1..R5.md` (added from build/sync-audit)
- `app/models/break_escape/game.rb` (constants)
- `public/break_escape/js/state-sync.js` (stableJson; phone keyOf; item 2 compares; step 2 seed:
  SERVER_OWNED_GLOBALS, pickNote/pickSample, seedFromSaved, seedFromBootstrap, `_held`/`_seeded`)
- `public/break_escape/js/core/game.js` (restorePhoneState keyOf; step 2 seedFromBootstrap wiring
  + flattenSavedMailState import)
- `public/break_escape/js/systems/npc-manager.js` (cpWithin/cpSlice/utf8ByteLength statics; phone
  keyOf; item 4 `_phoneStateEntry` server mirror + phone constants, PHONE_STORY_STATE_MAX_BYTES)
- `public/break_escape/js/systems/mail-scheduler.js` (cpWithin/cpSlice; item 4 clipMail* + mail
  constants + exportMailState wiring; step 2 flattenSavedMailState)
- `public/break_escape/js/systems/npc-conversation-state.js` (cpWithin/cpSlice; item 4 ink export
  name-limit mirror + MAX_NPC_INK_NAME_CHARS)
- `app/controllers/break_escape/games_controller.rb` (step 2 `savedCurrentRoom` bootstrap field;
  item 6 `prepare_bootstrap_state!` call in `scenario`, `refuse_oversized_body` + `OVERSIZED_BODY_LIMITS`,
  `prepend_before_action` now lists `:clone_card`)
- `app/models/break_escape/game.rb` (item 6 `item_for_answer`, `prepare_bootstrap_state!` shell,
  `bootstrap_state_needs_write?`/`run_bootstrap_writers!` private stubs)
- `public/break_escape/js/state-sync.js` (item 6 `registerPart`/`track`/`_partBodies`/`_flushKeep`/
  `_partsPending`; parts wired into `buildChanges`/`_syncOnce`/`syncConfirmed`/`flush`)
- `test/fixtures/files/sync_bodies/sanitiser_cases.json` (new; item 5 cross-side fixture)
- `test/js/sanitiser-cases.test.mjs` (new; item 5 node behaviour test)
- `test/models/break_escape/sanitiser_cases_test.rb` (new; item 5 Rails behaviour test)
- `test/js/social-state-sync-confirmed.test.mjs` (item 6 part/track cases)
- `test/controllers/break_escape/saved_current_room_test.rb` (new; task 3)
- `scratchpad/gen_sanitiser_fixture.rb` is NOT in the repo (one-off generator in the session scratchpad)
- `test/js/state-sync.test.mjs` (stableJson test; 9 R1 seed cases; seedFromSaved import)
- `test/js/social-mail-state-export.test.mjs` (constants test + literal scan; flatten-parity test;
  pagehide-over-budget test moved to many clipped messages)
- `test/js/social-gap-mail-scheduler.test.mjs` (round-trip test moved to server-kept fields)
- `test/js/cp-helpers.test.mjs` (new; the shared cp-helper test)
- `test/js/phone-reopen-and-persistence.test.mjs` (new keyOf cases)
- `test/js/phone-player-lines.test.mjs` (MAX_PHONE_TYPE_CHARS assertion fix)
- `tools/playtest/sync-delta-proof.mjs` (new; item 8 live-proof recorder)
- `tools/playtest/new-game.rb` (item 8 `--seed-full-cloner` option)
- `test/js/sync-delta-proof.test.mjs` (new; item 8 pure-part tests)
- `docs/achitechture/SYNC_DELTAS_BUILD_LOG.md` (this file)

### Step 2 (R1), in detail
- `seedFromSaved(saved, mailKeys)` builds a `confirmed`-shaped map from the `saved*` blocks, every
  value a `stableJson` string. Mail is flattened by `flattenSavedMailState` (passed in, no import);
  `jobs` compares by `mailJobsChangeKey`. `seedFromBootstrap(scenario, { mailKeys })` runs once
  (`_seeded`), sets each key only where `confirmed` lacks one, and puts every saved global into
  `_held.globalVariables`.
- `_held[section]` (a Set per keyed section) gates the null-delete loop: a confirmed key missing from
  the current state is sent as `null` only when this page held it. All saved globals are held (the
  page applies them via Object.assign), so a deleted global still goes up as null; a server key the
  client never shows this page (an unregistered NPC's ink vars) is left alone. Verified by tests.
- game.js calls `seedFromBootstrap` BEFORE any restore touches the saved objects (some restores keep
  references). Server adds `savedCurrentRoom` so an unchanged room is not resent.
- Residual to watch (plan 2.1): the seed trusts the server-stored mail as already clipped, so
  `flattenSavedMailState` does not re-run the clips; the clips are idempotent on server output, so
  export == seed. If a future server sanitiser change is not mirrored in a clip, the shared fixture
  test (item 5, still open) is what should catch it.

### Gotchas
- Line numbers in the plan were taken against main 6a834437c merged into build/sync-audit; this
  branch is off the same main, so engine line numbers match (verified for the game.rb methods). Each
  reference names the function too; search the name if a line moved.
- Keep `social_feed.rb` and `access_work.rb` edits minimal (C3 replies build is in them).
- Step 6a must stand alone (ship without 6b): commit it separately so it could ship without 6b.
- Commit each step by explicit paths before testing it; check `git diff --cached --stat` first.
- No model names, no em/en dashes, UK English in repo files; no attribution lines in commits.
- `test/js/event-mapping-unlock-door.test.mjs` fails on this machine with a node test-runner IPC
  error ("Unable to deserialize cloned data due to invalid or unsupported version"); its own
  assertions pass (`# pass 1`). Confirmed PRE-EXISTING (fails with all step-1/2 source changes
  stashed), so it is environmental, not a regression. Do not chase it as a build break.
- Step 2 note: `seedFromBootstrap` must be called before the restore block mutates the saved blocks;
  it is wired at the top of game.js's restore, before the globals `Object.assign`. Keep it there.
