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
| 1. Groundwork: everything else (see "Open") | Not started |
| 2. R1 seeding | Not started |
| 3. P2 inventory/network answers | Not started |
| 4. P1 cloner one-card deltas | Not started |
| 5. R3 capture-log seen keys | Not started |
| 6a. R2 server-owned capture record (ships first) | Not started |
| 6b. R2 reveal/proof gating | Not started |
| 7. Node + Rails size tests, then live proof A to F | Not started |
| 8. One release later: remove transition code | Not started (separate release) |

## Commits (newest first)

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

## Handover

### Done
- Plan, audit and five reviews imported and committed (`a7294aece`).
- Groundwork constants in game.rb (`91da28d22`), behaviour preserved, mail/phone/reload tests green.
- Groundwork `stableJson` in state-sync.js with a test (`3da4b3480`), all state-sync importers green.

### In progress
- None. Each commit is a clean, self-contained, tested boundary.

### Open (the rest of step 1 groundwork, then steps 2 to 8)

Step 1 groundwork still to build (plan 2.1 to 2.5, tested per plan 3.7 and 10):
1. Phone `keyOf` option on `exportPhoneState` (npc-manager.js:~2241), `markPhoneStateSynced`
   (:~2255) and `restorePhoneState` (:~2320), default `JSON.stringify`, used for every string stored
   or compared in `_phoneStateSent`. Passed in, never imported (about thirty node harnesses copy
   npc-manager.js with a fixed import list). Wire `StateSync.buildPayload` to pass `keyOf: stableJson`
   to `exportPhoneState`, `StateSync.confirm` to `markPhoneStateSynced`, and the `restorePhoneState`
   call in core/game.js (:~1800) to pass `{ keyOf: window.stateSync?.constructor?.stableJson }`.
2. Use `stableJson` in place of `json` for every comparison string in `buildChanges()` (keyed
   sections, notes, whole sections, `timedKey`, `clockKey`) and in `mailJobsChangeKey`. Request body
   is unchanged; only the strings kept in `confirmed` change.
3. `cpWithin(s, n)` and `cpSlice(s, n)` (signatures in plan 2.1) as private functions in
   mail-scheduler.js and npc-conversation-state.js and as static methods on NPCManager (not a shared
   module, to avoid changing any harness copy list). ONE node case runs every copy over the same
   strings (ASCII, an emoji at the cut, emoji-only). NOTE: decide the test's access surface to the
   two module-local copies when you write them (NPCManager's are reachable via the class; the two
   module copies need either a test-only export or to be tested through the clip functions that use
   them). The plan says "private functions ... so no harness copy list changes" and then "one node
   test runs every copy" (plan 2.1, 3.7 line ~484); reconcile these before coding, which is why they
   were NOT added this session (adding them unused risked the next agent restructuring the export).
4. The export clips, exact mirrors of the server (plan 2.1), all measuring/cutting by code points:
   `clipMailMessage(key, msg)`, `clipMailThread(key, thread)`, `clipMailDrafts(drafts)` in
   mail-scheduler.js; the phone-entry export tests folded into `_phoneStateEntry` (npc-manager.js);
   the `MAX_NPC_INK_NAME_CHARS` tests folded into `exportNpcInkVariables`
   (npc-conversation-state.js:221). Client constants: add the new ones under the server's names;
   rename `PHONE_STORY_STATE_MAX_CHARS` to `PHONE_STORY_STATE_MAX_BYTES` (value 61440) since it is
   now a byte limit; keep the five existing client names. Read R5 nit n6 before writing
   `clipMailMessage`: a `nil` message value is a delete handled by the keyed diff, so the clip must
   not emit `null` for a message itself, and a key with no dot after the box id is not exported.
5. The two plan-3.7 cross-side tests: `test/js/social-mail-state-export.test.mjs` grows a constants
   test (reads each named constant from game.rb source, explicit map for the five existing client
   names, handles multi-line `%w[]` and `N.kilobytes`) and the literal scan (fails on any bare number
   other than 0/1 in the nine scanned methods, allowing only the `split('.', 2)` 2); plus a behaviour
   test over a committed fixture `test/fixtures/files/sync_bodies/sanitiser_cases.json` (both a Rails
   unit test and a node test run their respective sanitisers/clips over the same inputs and assert
   the same stored outputs by stableJson). Neither test writes the fixture.
6. `registerPart`/`track`/`_syncOnce`/`flush`/`flushKeep` additions in state-sync.js (plan 2.2);
   `Game#item_for_answer` (plan 2.3); `Game#prepare_bootstrap_state!` empty shell plus its wiring in
   `GamesController#scenario` right after `authorize` (plan 2.4); `refuse_oversized_body` from
   `refuse_oversized_npc_frustration` with a per-action limit table, clone_card 8 KB (plan 2.5).
7. Delete unused `ApiClient.syncState` (api-client.js:~220) and `ApiClient.updateInventory` (:~212)
   (plan 9 tidy-ups).
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

### Files touched this session
- `docs/achitechture/SYNC_DELTAS_PLAN.md`, `PLAYER_STATE_SYNC_AUDIT.md`,
  `SYNC_DELTAS_PLAN_REVIEW_R1..R5.md` (added from build/sync-audit)
- `app/models/break_escape/game.rb` (constants)
- `public/break_escape/js/state-sync.js` (stableJson)
- `test/js/state-sync.test.mjs` (stableJson test)
- `docs/achitechture/SYNC_DELTAS_BUILD_LOG.md` (this file)

### Gotchas
- Line numbers in the plan were taken against main 6a834437c merged into build/sync-audit; this
  branch is off the same main, so engine line numbers match (verified for the game.rb methods). Each
  reference names the function too; search the name if a line moved.
- Keep `social_feed.rb` and `access_work.rb` edits minimal (C3 replies build is in them).
- Step 6a must stand alone (ship without 6b): commit it separately so it could ship without 6b.
- Commit each step by explicit paths before testing it; check `git diff --cached --stat` first.
- No model names, no em/en dashes, UK English in repo files; no attribution lines in commits.
