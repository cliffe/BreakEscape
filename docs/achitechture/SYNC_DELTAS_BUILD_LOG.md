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
| 1. Groundwork: shared sanitiser fixture behaviour test (item 5, rest) | NOT started (see Open) |
| 1. Groundwork: registerPart/track, item_for_answer, prepare_bootstrap_state!, refuse_oversized_body (item 6) | NOT started |
| 1. Groundwork: live-proof tools (item 8) + baseline (item 9) | NOT started |
| 2. R1 seeding | Done, committed, tested (`c12d9d1e7`) |
| 3. P2 inventory/network answers | Not started |
| 4. P1 cloner one-card deltas | Not started |
| 5. R3 capture-log seen keys | Not started |
| 6a. R2 server-owned capture record (ships first) | Not started |
| 6b. R2 reveal/proof gating | Not started |
| 7. Node + Rails size tests, then live proof A to F | Not started |
| 8. One release later: remove transition code | Not started (separate release) |

## Commits (newest first)

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

### In progress
- None. Each commit is a clean, self-contained, tested boundary.

### Open (rest of step 1, then steps 3 to 8)

1. DONE (`3cec62ff4`). Phone `keyOf`.
2. DONE (`06815b055`). `stableJson` in `buildChanges`/`mailJobsChangeKey`.
3. DONE (`b8370b88d`). `cpWithin`/`cpSlice` three copies + shared test.
4. DONE (`9f85871c6`). The export clips.
5. PART DONE (`3c7d13c96`): constants test + literal scan. STILL OPEN: the shared sanitiser
   behaviour fixture `test/fixtures/files/sync_bodies/sanitiser_cases.json` with a Rails unit test
   and a node test running the server sanitisers and the client clips over the same inputs and
   asserting equal stored outputs by stableJson. Neither test writes the fixture. (Plan 3.7
   "Behaviour".) The clips are already exercised by the existing round-trip harnesses and the step-2
   R1 tests, but the explicit byte-for-byte cross-side fixture is not yet written.
6. NOT STARTED. `registerPart`/`track`/`_syncOnce`/`flush`/`flushKeep` additions in state-sync.js (plan 2.2);
   `Game#item_for_answer` (plan 2.3); `Game#prepare_bootstrap_state!` empty shell plus its wiring in
   `GamesController#scenario` right after `authorize` (plan 2.4); `refuse_oversized_body` from
   `refuse_oversized_npc_frustration` with a per-action limit table, clone_card 8 KB (plan 2.5).
7. DONE (`6c3a2e918`). Deleted unused `ApiClient.syncState` and `ApiClient.updateInventory`.
8. The two live-proof tools: `tools/playtest/sync-delta-proof.mjs` and the `--seed-full-cloner`
   head-start option of `tools/playtest/new-game.rb` (plan 10.3 and R5 n3: parse the flag with no
   value, add a --help line, run it after the other head-start blocks' last save!, guard on
   test_access_networks + dev/test + no cloner + `with_lock`).
9. BASELINE: straight after step 1 is committed, run `sync-delta-proof.mjs` from this branch against
   a second worktree server checked out at the base commit (6a834437c) on this builder's port, to
   record the base commit's requests/answers and bootstrap size (plan 9, 10.2, 10.3). Write the base
   bootstrap size into `test/integration/sync_payload_size_test.rb` as a constant with the commit in a
   comment.

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
- `app/controllers/break_escape/games_controller.rb` (step 2 `savedCurrentRoom` bootstrap field)
- `test/js/state-sync.test.mjs` (stableJson test; 9 R1 seed cases; seedFromSaved import)
- `test/js/social-mail-state-export.test.mjs` (constants test + literal scan; flatten-parity test;
  pagehide-over-budget test moved to many clipped messages)
- `test/js/social-gap-mail-scheduler.test.mjs` (round-trip test moved to server-kept fields)
- `test/js/cp-helpers.test.mjs` (new; the shared cp-helper test)
- `test/js/phone-reopen-and-persistence.test.mjs` (new keyOf cases)
- `test/js/phone-player-lines.test.mjs` (MAX_PHONE_TYPE_CHARS assertion fix)
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
