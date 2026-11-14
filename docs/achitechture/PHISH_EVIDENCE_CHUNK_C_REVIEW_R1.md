# Phish evidence chunk C: review R1 (the reader change)

Review only, in worktree `.claude/worktrees/p-hard-phish-c`, branch `build/hard-phish-c`, tip
`a3ae4c4ce`. Range reviewed: `git diff ea7005131 a3ae4c4ce` (the reader change, the retirement of
the sync phish machinery, the dangling-`needs_stamp` fix, and the live-proof script with the legacy
seed). Spec: `docs/achitechture/PHISH_EVIDENCE_SERVER_PLAN.md` sections 6, 10, 14, 15; build log
`PHISH_EVIDENCE_SERVER_BUILD_LOG.md` Chunk C; prior minors folded in from
`PHISH_EVIDENCE_AB_REVIEW_R2.md` (1, 2, 4).

Verification run at the tip (single files, no suites, no server):
`test/controllers/break_escape/se_landing_page_build_test.rb` 13 runs, 58 assertions, 0 failures;
`test/controllers/break_escape/capture_proofs_test.rb` +
`test/controllers/break_escape/phish_legacy_migration_controller_test.rb` 39 runs, 221 assertions,
0 failures.

## Counts

- Blocker: 0
- Major: 0
- Minor: 3

## Verdict

SHIP chunk C. The reader now reads only the two server-owned stores and the forge the plan set out
to close is closed: a tampered client that syncs a built, convincing `se_landing_pages` global and a
landed sent mail, and never calls the two routes, is served nothing (proven by the live case (g) and
the rewritten `capture_proofs_test` forge test). Every honest path still gets the credential,
including the legacy save with no surviving sent mail, because the old client co-writes the capture
claim with the `victim.submitted` transition and the bootstrap migrates and stamps it. The retired
machinery is dead everywhere in app/lib/public, the simplified sync step stamps every non-phish
capture kind correctly and skips the scenario load on a plain sync (a strict speed-up, no
regression), and the two stores never ride a sync back to the client. The three Minors are all test
hygiene, not behaviour: one legacy co-migration path is untested, one hot-path spy helper is now dead
with nothing pinning the fast path, and one test comment names a file that does not exist.

---

## 1. Forgery (item 1): closed on every vector

The reader `phish_page_evidence_holds?` reads `player_state.dig('seLandingPages', page_id)` for
`built` and the server's own `meetsThreshold` (capture_proofs.rb:902), and `player_state['sePhishSends']`
for a landed send to the target carrying one of the page's authored kits (capture_proofs.rb:909).
Both are top-level player_state keys written only by the two gated routes and the one-time migration.

- **Forged `se_landing_pages` / `mailState`.** The sync merge is a closed allowlist of sections
  (games_controller.rb:2494 globalVariables, :2515 mailState, and the rest). Neither `seLandingPages`
  nor `sePhishSends` is a merged section, so no sync body can write them. `merge_global_variables!`
  also drops `se_captures` (game.rb:806). The reader ignores the client `globalVariables.se_landing_pages`
  and the mailbox entirely. Live case (g) and `capture_proofs_test.rb` "the forged se_landing_pages
  and mailState sync no longer serves the secret" prove the stores stay empty and the secret is
  withheld.
- **Forged `seCaptures` claim through sync_state.** A capture claim is recorded by `record_capture!`
  with `proven = capture_evidence_holds?` (capture_proofs.rb:169), which reads the two server stores.
  A claim with no route-written evidence stays unproven and is withheld by the live
  `capture_revealable?` re-check on serve.
- **Stale-but-recent sync.** The phish branch of the sync stamp is retired; a sync can no longer
  advance the evidence (games_controller.rb:943-948 early return on no capture and no legacy global).
  Serving reads the live server stores, so a stale-but-recent request that records a capture serves
  it only when the routes already populated the stores. No forge.
- **Migration path.** `migrate_legacy_phish_evidence!` re-derives the build verdict with `PhishScore`
  from the stored choices and never trusts the old `meetsThreshold` (capture_proofs.rb:559-610); the
  imported send's `landed` is computed from that re-derived build via the shared
  `phish_page_build_landed?`. The `phishEvidenceMigrated` flag makes it one-time, so the
  client-writable `se_landing_pages` global cannot be re-read on a later bootstrap.
- **Redrive flag.** The flag is parsed as a strict boolean (games_controller.rb:1681) and used only
  in the downgrade-refusing direction (capture_proofs.rb:251-256, `redrive_downgrade?` :270-277). It
  cannot raise a verdict: the verdict is always recomputed from choices. `redrive:true` with weaker
  choices only keeps the builder's own stronger recorded build (returns `:already`, served as
  success with the kept verdict); it cannot block an honest improve, because an equal-or-stronger
  re-drive has `redrive_downgrade? == false` and replaces in place. `redrive:false` is a normal
  last-wins rebuild, also server-recomputed. Live case (h) and the two build-test cases cover both.
- **Two tabs.** Both routes are under `with_game_lock` (games_controller.rb:105 `only:` list includes
  `:se_landing_page, :se_phish_send`), so concurrent posts serialise on the row lock; the send store
  is first-wins on `landed:true` and the build verdict is always server-computed. No forge.

## 2. Legitimate players are never refused (item 2): confirmed

Every honest path serves the credential: online (routes then capture sync, each route re-stamps),
offline then drain, reload with a queued send (the re-drive carries the stored choices and re-posts),
improving after a weak build (last-wins replaces the verdict), stale-but-recent syncs (serving reads
the live stores), and a capture claimed before the stores exist (stamped on the next sync or
bootstrap once the routes populate them). All are covered by the rewritten `capture_proofs_test`
cases.

**The legacy key question is answered: honest legacy saves carry the `seCaptures` claim.** The old
client writes `recordCapture` (window.submitSECapture) in the same `captureGranted` block that sets
`victim.submitted`, keyed on the transition to submitted (mail-bridge.js:416-438). So `victim.submitted`
(the migration's send-import gate) never holds without the capture claim having been written and
synced. On return, the bootstrap runs `migrate_legacy_captures!` before `migrate_legacy_phish_evidence!`
before the stamp (game.rb:1301,1306,1309). A pre-store save holds the capture in the legacy
`globalVariables.se_captures` global, and `migrate_legacy_captures!` recreates it as `proven: true`
unconditionally (capture_proofs.rb:522), so it is served regardless of the evidence stores; a phish
target qualifies because `client_target_ids` -> `declared_target_ids` includes `phish_target_ids`
(capture_model.rb:307, 92-114). The live proof had to seed `seCaptures['lord']` only because its
harness builds a bare legacy save that holds the already-migrated top-level `seCaptures` (unproven)
rather than the legacy `se_captures` global; that is the stricter stamp-off-migrated-stores path, not
a real-save gap. A legacy save with store evidence but no capture claim is not an honest state: the
two are co-written and re-synced until confirmed. No honest refusal. (See Minor 1 for the untested
co-migration.)

## 3. Retirement (item 3): every removed method is dead, non-phish captures unaffected

Grep over app, lib, public, test and tools finds `phish_evidence_fingerprint`,
`each_stored_sent_message`, `phish_gated_unproven_captures?`, `incoming_sent_messages`, `phishGated`,
`@phish_fp_before`, `needs_stamp`, `extra_sent` and `@stored_sent_message_memo` only in retirement
comments and in the stale untracked `test/dummy/log/test.log` (historical NameErrors from before the
`needs_stamp` fix commit; the file was untracked in `a1aceadb3` and is not in this change).
`phish_evidence_page_for` is correctly kept (still the page resolver, capture_proofs.rb:880).
`stamp_proven_captures!` still stamps every non-phish kind: footholds and part-3 proofs read the
grow-only server proof lists through the unchanged `capture_evidence_holds?` part-3 block. The
simplified `apply_capture_sync_step` records and stamps captures recorded on a sync off the
route-written stores; no non-phish capture path changed.

## 4. Old-contract tests and the hot path (item 4): no performance regression

The removed `CaptureHotPathSpy` and its three tests asserted an optimisation that no longer exists
(the fingerprint/mail-walk that decided whether to load the scenario). The replacement is strictly
cheaper: `apply_capture_sync_step` returns before any scenario load when the request carries no
capture and no legacy `se_captures` global (games_controller.rb:948), and the predicate it tests
(`legacy_captures?`) is player_state-only. There is no scenario load on the plain sync hot path and
no mailbox walk. No regression. (See Minor 2: nothing now pins this fast path with a test.)

## 5. Lock, lost updates, synced state (item 5): clean

Both routes run under `with_game_lock`; `send_phish!` reloads under the row lock, records, re-stamps
and saves in one pass, serialising with the mailState sync on the same row. `seLandingPages` and
`sePhishSends` are top-level server-owned stores, each bounded by the authored page count and the
authored target/kit count (one entry per page, one per target-kit, first-wins on `landed:true`), so
they do not grow without bound. They appear in no view or controller response and in no client JS, so
they never ride the bootstrap or a sync answer back to the browser and are never re-sent. The player
state the client syncs does not grow from this change.

## 6. Test realism and standing rules (item 6): clean

The rewritten serving tests seed the two stores the way the routes write them (`seed_phish_stores`,
with a comment that it stands in for the routes having run) and the route, migration and build tests
drive the real routes. No added line carries an em or en dash, a model name, or a new package
(`playwright`, `node:child_process` and `json` are all already used in the repo). UK English
throughout.

---

## Minor findings

### Minor 1 (test realism): the pure pre-store legacy co-migration is untested

Files: `test/controllers/break_escape/phish_legacy_migration_controller_test.rb:41-57`
(`legacy_state`), `app/models/break_escape/capture_proofs.rb:522` (`migrate_legacy_captures!` stores
`proven: true`), `app/models/break_escape/game.rb:1301,1306` (the ordering).

`legacy_state` pre-seeds the already-migrated top-level `seCaptures` (proven:false) and only the
legacy `se_landing_pages` global, so `migrate_legacy_captures!` has nothing to do. No test exercises a
real pre-chunk-A save that holds both legacy globals (`globalVariables.se_captures` and
`globalVariables.se_landing_pages`), where both migrations and the stamp run on one bootstrap and both
globals are deleted. The risk is low because `migrate_legacy_captures!` stores the migrated capture
`proven: true` regardless of the evidence stores, so that save is served either way, but the
co-migration ordering and the double global-delete are unproven. Failure scenario: a future change to
`migrate_legacy_captures!` (for example gating its `proven` on evidence) would silently refuse these
oldest saves and no test would catch it. Fix: add one controller test seeding both legacy globals and
asserting the secret serves after the first bootstrap.

### Minor 2 (test coverage): a dead helper and no test pinning the plain-sync fast path

Files: `test/controllers/break_escape/capture_proofs_test.rb:50` (`count_scenario_loads`, now with no
callers), `app/controllers/break_escape/games_controller.rb:948` (the early return).

Removing `CaptureHotPathSpy` left `count_scenario_loads` defined but unused, and nothing now asserts
that a plain sync skips the scenario load. The behaviour is obvious from the early return, but a
future reordering that touched the scenario before the guard would not be caught. Fix: either delete
the dead helper, or keep it and add one assertion that a no-capture, no-legacy sync loads no scenario.

### Minor 3 (documentation): a test comment names a file that does not exist

File: `test/models/break_escape/capture_record_test.rb:154-158`.

The retirement comment says the new reader "is proven in phish_reader_test", but there is no
`phish_reader_test.rb`; the reader is covered by the `capture_proofs_test` chunk C serving tests and
the route and migration tests. Fix: correct the reference.

---

## Confirmed clean (observations, not findings)

- **Reader signature and `extra_sent` removal.** `extra_sent` is dropped from
  `phish_page_evidence_holds?`, `capture_evidence_holds?`, `capture_revealable?` and
  `stamp_proven_captures!`, and every caller updated; no stray argument remains.
- **Overlapping-drain guard.** `drainPhishQueues` now carries a single in-flight flag
  (se-landing-page-client.js). A second `online`/`sync-ok` call during a drain returns at once; a
  queue entry enqueued mid-drain (only ever on a failed POST) waits for the next recurring `sync-ok`
  or `online`. Negligible and self-correcting.
- **Redrive `:already` answer.** `build_landing_page!` treats `:already` through the success branch
  and returns the kept (stronger) entry's `meetsThreshold`/`credibility`, so the client sees the
  correct recorded verdict, not an error.
- **The dangling `needs_stamp`** removed in `a094bbaac` leaves the sync-step guard a single clean
  `return if incoming.empty? && !@game.legacy_captures?`.
