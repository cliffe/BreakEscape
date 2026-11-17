# Phish evidence chunk B (legacy migration): review R1

Scope: review only, against the real tree in worktree `.claude/worktrees/p-hard-phish-mig`, branch
`build/hard-phish-mig`. Range reviewed: `d0764d4b8..75983ea72` (`git diff d0764d4b8 75983ea72`).
Spec: `docs/achitechture/PHISH_EVIDENCE_SERVER_PLAN.md` sections 9, 9.1 and the chunk B parts of 14
and 15; build notes in `docs/achitechture/PHISH_EVIDENCE_SERVER_BUILD_LOG.md` (Chunk B section).
Chunk A (Route 2, the send route) is built elsewhere and is not reviewed here; clashes with it are
flagged where found.

Both new test files were run green in this worktree (model 9 runs / 48 assertions; controller 4 runs
/ 19 assertions, 0 failures). No full suites, no server, no SecGen/Vagrant/remote files read.

## Counts

- Blocker: 0
- Major: 0
- Minor: 4

## Verdict: APPROVE (ready to merge)

The migration re-derives every build verdict server-side and gates the imported send on that re-derived
build plus authored target and kit, so no crafted legacy save launders a `landed` or `meetsThreshold`
it did not earn. The once-only entry guard, the first-wins stores, the untouched proven capture, the
server-only flag and the bootstrap-only writer all hold against the hostile cases in the brief. The
four Minors are a documentation style breach, two stale tallies in the build log, and a cross-chunk
reconciliation note for chunk A; none blocks the merge.

---

## 1. Forgery: can a crafted legacy save import an unearned landed send or meetsThreshold?

No. Every branch the brief names is closed, and the migration reuses the same validated, re-scoring
path as the committed Route 1 build (`record_landing_page_build!`, `capture_proofs.rb:233`).

- **Junk / oversized choices.** `valid_build_choices?` (`capture_proofs.rb:588`) validates each choice
  id field by field against the page's authored menus, and `valid_choice_id?`
  (`capture_proofs.rb:655`) caps every id at `CaptureModel::MAX_CAPTURE_TARGET_CHARS`. An off-menu or
  oversized id fails, so `migrate_legacy_phish_evidence!` hits `next unless valid_build_choices?`
  (`capture_proofs.rb:63`) and the page migrates as not built (no store entry). The verdict is always
  recomputed with `PhishScore.score` (`recompute_page_verdict?` returns `true`,
  `capture_proofs.rb:570`; `migrated_build_entry`, `capture_proofs.rb:688`), never read from the old
  record, so a forged `meetsThreshold: true` over weak-but-on-menu choices re-scores to false (proven
  live: game 4469, credibility 34, `meetsThreshold: false`).
- **Unauthored page id.** `CaptureModel.landing_page(scenario, page_id)` (`capture_model.rb:334`)
  returns nil for an unauthored page, so `next unless page_def.is_a?(Hash)` (`capture_proofs.rb:58`)
  drops it. `valid_capture_target_id?(page_id)` (`capture_proofs.rb:54`, def at `:782`) also caps the
  key shape.
- **Unauthored target.** The build import requires `valid_landing_target?`
  (`capture_proofs.rb:66`, def at `:576`); the send import additionally requires
  `CaptureModel.phish_target_ids(scenario).include?(target_id.to_s)` (`capture_proofs.rb:77`,
  `capture_model.rb:107`). A target that is neither a page target nor a declared phish target imports
  neither a build nor a send.
- **Unauthored kit / submitted marker on an unwired page.** `CaptureModel.page_evidence_kits`
  (`capture_model.rb:356`) keeps only `kind == 'link'` kits with a present-string id whose
  `landingPageId` names the page. A `victim.submitted` marker on a page with no such kit yields
  `kit_ids.empty?` and `next` (`capture_proofs.rb:82`): no send is written.
- **Non-Hash `se_landing_pages`.** Guarded by `legacy.is_a?(Hash) && legacy.any?` in both
  `legacy_phish_evidence?` (`capture_proofs.rb:34-35`) and the writer (`capture_proofs.rb:48-49`).
- **Pre-set `seLandingPages` / `sePhishSends` through sync.** Neither key is in any `sync_state` merge
  path: `merge_last_write_wins_sections` (`games_controller.rb:2464`) and `merge_grow_only_sections`
  (`games_controller.rb:2574`) touch a fixed allowlist (currentRoom, globalVariables, npcInkVariables,
  timedMessages, phoneState, mailState, npcVisibility, npcHostility, playerHealth, notes,
  scenarioBriefShown, triggeredEvents, scenarioClock, commandBoardLog, biometricSamples) plus the
  capture step; neither store is among them. Even if an entry were present, the writer is first-wins
  (`land_store[page_id] ||= ...`, `capture_proofs.rb:71`; `next if existing landed == true`,
  `capture_proofs.rb:89`).
- **`phishEvidenceMigrated` through sync or a crafted global.** The flag is a top-level
  `player_state` key, read only as `player_state['phishEvidenceMigrated']`
  (`capture_proofs.rb:32,46`). `merge_global_variables!` (`game.rb:801`) writes only into
  `player_state['globalVariables']`, so a global of that name never reaches the top-level key, and no
  sync path writes a top-level `phishEvidenceMigrated`. Verified by
  `phish_legacy_migration_controller_test.rb:397` (sync body with both a top-level and a global
  `phishEvidenceMigrated` leaves the flag nil).

## 2. Once-only and first-wins

Holds. The entry guard `return false if player_state['phishEvidenceMigrated'] == true`
(`capture_proofs.rb:46`) is the first line, so when the lock is taken by another writer's predicate
(`run_bootstrap_writers!` calls every writer, `game.rb:1309-1326`) after a client has edited
`se_landing_pages`, the writer returns at once and never re-reads the global. `land_store` is
first-wins per page (`capture_proofs.rb:71`) and `send_store` is first-wins on `landed: true`
(`capture_proofs.rb:89`). An already-proven capture is never touched: the writer only populates the
two stores and never writes `seCaptures`; the stamp is left to `stamp_proven_captures!` ordered after
it (`game.rb:1324`). Covered by `phish_legacy_migration_test.rb:574` (second call a no-op after the
global is edited, including an added `evil` page) and `:560` (proven capture's `at: 5` preserved while
the stores still populate).

## 3. The flag is server-only

Confirmed: not read from the sync body (section 1 above), not in the bootstrap serialisation allowlist
(the `scenario` action attaches a named set of keys, `games_controller.rb:312-360`; `seLandingPages`,
`sePhishSends` and `phishEvidenceMigrated` are not among them, asserted at
`phish_legacy_migration_controller_test.rb:379-381`), and not settable through a global
(`merge_global_variables!` writes only under `globalVariables`). `SERVER_OWNED_GLOBAL_NAMES`
(`game.rb:2279`) need not list it because it is never a global in the first place.

## 4. Legitimate players are never refused

Holds, and no honest save is worse off than before chunk B. The reader is unchanged in this chunk (the
diff does not touch `capture_revealable?`, `stamp_proven_captures!` or `phish_page_evidence_holds?`),
so live play reads exactly as it did on `d0764d4b8`. An honest save with sent mail is migrated and
stamped in one locked pass (`game.rb:1320-1324`; proven live, game 4468). An honest save with no
surviving sent mail has both stores populated and the flag set, but the old client-evidence reader
still requires a sent mail record, so its capture stays unproven until the chunk C reader flips
(`phish_page_evidence_holds?`, `capture_proofs.rb` sent-message matcher). That is the builder's own
note and is not a regression: before chunk B that save was already withheld by the same reader. A
proven capture keeps its result. The migration only ever adds store entries and the flag; it withholds
nothing a save held before.

## 5. Lock and lost updates

Holds. The writer runs only inside `prepare_bootstrap_state!`'s `with_lock` double-checked block
(`game.rb:683-691`) via `run_bootstrap_writers!`. `sync_state` (`games_controller.rb:833`) never calls
`run_bootstrap_writers!` or the migration; it merges its allowlisted sections and the capture step
only. Asserted at `phish_legacy_migration_controller_test.rb:386` (sync leaves the flag nil and the
stores empty).

## 6. Synced player_state must not grow or be re-sent

Holds. `seLandingPages` is bounded by the authored page count, `sePhishSends` by authored target/kit
pairs, and the flag is one boolean. None is in the bootstrap serialisation allowlist or any sync merge
section, so none ships to the client or rides back (section 3). The pre-existing `se_landing_pages`
client UI global still round-trips through `savedGlobalVariables` as before; this chunk neither grows
it nor adds a new synced key.

## 7. Tests and live proof

The controller test drives the real `GET /scenario` and `PUT /sync_state` routes
(`phish_legacy_migration_controller_test.rb:362,388,399`). The tests fail with the guard or gating
removed: dropping the entry guard breaks `:574` (the added `evil` page would make `land_store.size ==
2`); trusting the old `meetsThreshold` breaks `:530` (expects re-derived false); wiring the migration
to sync breaks `:386`; accepting the flag from the sync body breaks `:397`. The live-proof credibility
figures (87 convincing, 34 weak) match the test constants `CONVINCING`/`WEAK`
(`phish_legacy_migration_test.rb:443,447`) and the game ids 4467-4469 match the commit trail. See
Minor 2 for the one inaccuracy (the log's assertion tallies).

## 8. Standing rules

UK English is kept (`normalise_build_choices`, `serialised`). No new packages (the diff touches only
two app files, the build log and two test files; no Gemfile/package manifest). The GEMINI reference in
the build log is the `GEMINI_API_KEY` env-var name and the boot warning in the run command, not an LLM
model name, so it is not a model-name breach. The one breach is em dashes (Minor 1).

---

## Minor

### Minor 1. Em dashes in the build log breach the no-dash standing rule

File: `docs/achitechture/PHISH_EVIDENCE_SERVER_BUILD_LOG.md`, the three live-proof bullets (new lines,
`+- **Game 4467 — ...`, `+- **Game 4468 — ...`, `+- **Game 4469 — ...`).

Three U+2014 em dashes. The standing rule bans em and en dashes. Failure scenario: none functional;
documentation style only. Replace each with a comma, colon or full stop.

### Minor 2. Build log test tallies do not match the committed tests

File: `docs/achitechture/PHISH_EVIDENCE_SERVER_BUILD_LOG.md` (Tests (chunk B) bullet), "9 tests, 44
assertions" and "4 tests, 23 assertions". The committed tests run 9/48 and 4/19 in this worktree. The
test counts are right; the assertion totals are stale. Failure scenario: a later reader trusts the log
over a re-run. Correct the two assertion counts.

### Minor 3. Cross-chunk: `landed: false` send records and the min-kit key need chunk A to reconcile

File: `app/models/break_escape/capture_proofs.rb:84-94`.

The migration writes a `sePhishSends` record even when the re-derived build is below threshold, with
`landed: false` (asserted at `phish_legacy_migration_test.rb:538`), and keys it on `kit_ids.min` when a
page has more than one authored link kit. First-wins is only on `landed: true`
(`capture_proofs.rb:89`), so a later genuine Route 2 send must be able to upgrade a migration-written
`landed: false` and must key by the same `targetId/kitId`. Flag for the chunk A merge: Route 2's
`landed` computation should route through the shared `phish_page_build_landed?`
(`capture_proofs.rb:710`, as the build log already notes), and its store write should be first-wins on
`landed: true` (not first-wins on key) so a migration `landed: false` does not pin a target/kit that a
real send would land. Failure scenario (only with chunk A, and only when a page has multiple link kits
or a forged-then-honest sequence): a stale `landed: false` or a min-kit key blocks or mismatches a
later genuine send. No effect within chunk B alone.

### Minor 4. Oversized but on-menu duplicate `fields` array is stored whole (mirrors Route 1)

File: `app/models/break_escape/capture_proofs.rb:688` via `normalise_build_choices`
(`capture_proofs.rb:667`) and `valid_build_fields?` (`capture_proofs.rb:659`).

`valid_build_fields?` caps each field id but not the array length, and `normalise_build_choices` dups
the array whole, so a crafted legacy `choices.fields` of many repeated valid ids is validated and
stored in `seLandingPages`. This is identical to the committed Route 1 build path, which shares both
helpers, and the store is server-only and never shipped, so it is no new exposure from chunk B.
Failure scenario: a hostile legacy global modestly bloats one server-side player_state row. Noted for
awareness; if a cap is wanted, it belongs on the shared Route 1 helper, not in this chunk.
