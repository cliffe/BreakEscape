# Phish evidence server plan (build/hard-phish-b): review R3

Scope: review only, against the real tree at `build/hard-phish-b` tip `0fa185705`. The plan under review
is `docs/achitechture/PHISH_EVIDENCE_SERVER_PLAN.md`; the prior reviews are
`docs/achitechture/PHISH_B_PLAN_REVIEW_R1.md` and `PHISH_B_PLAN_REVIEW_R2.md`. The four settled answers
(Q1 universal recompute, one code path; Q2 a light send gate, `meetsThreshold` plus an authored target and
kit; Q3 `se_landing_pages` stays an untrusted client UI global; Q4 a one-time legacy import gated on the
re-derived build threshold) and the three design calls (the client judge decides what is shown; the server
gate is a strict superset of the client; the legacy marker is `victim.submitted`) are taken as final.
Chunks A, B and C are not yet built, so the code at the tip is the "already on main" state (Route 1,
`PhishScore`, the two stores and defaults, the old client-evidence reader); "holds in code" below means the
plan's claims about that real tree check out.

## Counts

- Blocker: 0
- Major: 0
- Minor: 1

## Verdict: READY TO BUILD

R2's three findings (MA1, MI1, MI2) are closed in the plan and consistent with the code. A fresh pass over
the whole plan with the full lens finds no blocker and no major. One minor remains: the chunk C retirement
list names a `phishGated` strip in `captures_for_client` that does not exist in the tree (the method is
allowlist-based and never emits the field), so the implementer should skip that non-existent step. It does
not block the build.

---

## R2 findings: closure

### MA1 (major, migration not one-time) is closed

Files: plan section 9.1 lines 456-460; `app/models/break_escape/game.rb:1301-1324`.

The plan now specifies the writer's first line as an entry guard: `migrate_legacy_phish_evidence!` returns
at once when `player_state['phishEvidenceMigrated'] == true` (lines 456-460), and spells out exactly why the
lock predicate alone is not enough. Verified against the code: `run_bootstrap_writers!`
(`game.rb:1309-1324`) calls every writer unconditionally once the lock is taken, and
`bootstrap_state_needs_write?` (`game.rb:1301-1304`) ORs five unrelated predicates, so a lock taken for
`stampable_captures?` or `unrecorded_shared_logins?` would re-invoke the phish migration. Because the plan
keeps `se_landing_pages` in place for the UI (unlike `migrate_legacy_captures!`, which deletes its own
trigger at `capture_proofs.rb:318`), the trigger persists, so the entry guard is the correct and necessary
fix. The plan also orders the writer before `stamp_proven_captures!` in `run_bootstrap_writers!`, matching
where `migrate_legacy_captures!` sits today (line 1318, ahead of the stamp at line 1322), so a returning
legacy save is migrated and stamped in one locked pass. Closed.

### MI1 (dead `phishGated` writes) is closed

Files: plan section 6 line 235; `capture_proofs.rb:174`, `:695`, `:467-474`.

Chunk C's retirement now names "the now-dead `phishGated` writes (capture_proofs.rb:174 and :695)". Verified
both sites: line 174 computes `phish_gated = !proven && !phish_evidence_page_for(...).nil?` and line 695
writes `entry['phishGated'] = true if phish_gated` in `store_capture_entry`. Once
`phish_gated_unproven_captures?` (lines 467-474, already on the retirement list) is removed, nothing reads
the field, so retiring the two write sites is correct. Closed, subject to the one wording slip below (the
plan also names a `captures_for_client` strip that does not exist).

### MI2 (superset test covered only the lab and the test scenario) is closed; the scan is feasible

Files: plan section 7 lines 286-288; `capture_proofs.rb:603-616` (`phish_evidence_page_for`);
`lib/break_escape/capture_model.rb:356-373` (`page_evidence_kits`).

The plan now takes the superset fixtures "from each other scenario that authors a phish (the awareness
scenarios included, found by a scenario scan in the test, not a fixed list)", so the one reader is exercised
beyond the lab. The scan is feasible and deterministic. Which scenarios actually author a landing kit and a
phish target, checked against the tree:

- `social.landingPages` in a shipped `scenario.json.erb`: `lab_social_engineering`, `test_social_slice`,
  `ca05_signin_pages`, `ca10_downloads_and_fake_checks` (the other `landingPages` hits are docs, not
  scenario files).
- Of those, a `social.mailClient.payloadKit` of `kind: 'link'` with a `landingPageId` (the only kits
  `page_evidence_kits` collects, `capture_model.rb:362`): `lab_social_engineering` (`kit_payroll_page` ->
  `payroll_login`), `test_social_slice`, and `ca05_signin_pages` (`kit_sso_page` -> `sso_login`).
  `ca10_downloads_and_fake_checks` wires its `fake_check_fernside` page through a fake-check config, not a
  `kind: 'link'` kit, so `page_evidence_kits` returns nothing for it and the reader never fires there.
- All three link-kit scenarios also author `social.phishTargets` (`ca05` aims `sso_staff` at `sso_login`).

So the scan selects scenarios with a `kind: 'link'` landing kit wired to a page plus an authored phish
target, which is a clean, implementable enumeration. The 15 scenarios that author a phish target but no
landing kit have no landing kit to take, so "author a phish" in the plan is loose shorthand for this
narrower set; the result is unambiguous and the test can build it.

No awareness regression hides behind the universal reader. `phish_page_evidence_holds?` is reached only when
`phish_evidence_page_for` (`capture_proofs.rb:603-616`) resolves a capture to a page, by the capture's
address matching a page's capture address or by the single-secret fallback. `ca05`'s `sso_login` page
carries no `capture.secret` (no `secret` key anywhere in `ca05`), so no capture resolves to it and the
reader never gates a `ca05` capture; `ca10` has no link kit. The only shipped scenario whose captures the
reader actually gates is `lab_social_engineering` (plus the test fixtures). The awareness coverage in the
superset test is therefore belt-and-braces rather than a correctness requirement, which is exactly why the
R2 finding was minor and why it is safely closed.

---

## Minor

### MIN1. Chunk C retires a `captures_for_client` `phishGated` strip that does not exist in the tree

Files: plan section 6 line 235 ("and the strip of `phishGated` in `captures_for_client` once nothing writes
it"); `app/models/break_escape/capture_proofs.rb:326-337`.

`captures_for_client` (`capture_proofs.rb:326-337`) builds each client entry from a fixed allowlist
(`targetId`, `kind`, `roleLabel`, `address`, `host`, `note`, `at`); it never copies `phishGated`, so there
is no strip to remove. The field is already absent from the client payload today, which is why retiring the
two write sites (`:174`, `:695`) is enough. An implementer following the line as written will hunt for a
strip that is not there. Harmless to behaviour (the field stays server-only either way), so minor. Fix: drop
the `captures_for_client` clause from the chunk C retirement list, or reword it to "confirm
`captures_for_client` never emitted `phishGated` (allowlist-based), so no change is needed there".

Failure scenario: none at runtime; this is a plan-accuracy slip that costs the implementer a few minutes
looking for absent code, and could invite a needless edit to a method on the hot capture-serialisation path.

---

## What checks out (fresh pass, full lens)

- **Forgery of the protected `capture.secret`.** `seLandingPages` and `sePhishSends` are top-level
  `player_state` keys, not globals and not merged sections, so the `sync_state` merge (which touches only
  named sections) never reads them from the body. After the reader change (section 6) a forged
  `se_landing_pages` global or forged `mailState` is ignored by the gate. To move the gate an attacker must
  POST Route 1 with `choices` that genuinely re-score above threshold through `PhishScore` (validated field
  by field, that is playing the builder) and POST Route 2 to an authored target with an authored kit. The
  section 1 forge is closed. The migration path re-derives the build verdict with `PhishScore` from the old
  `choices` and gates the landed import on it, so a forged `meetsThreshold: true` over junk choices migrates
  to `false`; no laundering.
- **A legitimate player is never refused.** The capture record is still created by the client's own claim
  (section 6, lines 238-245), stored `proven: false` until evidence holds, and `capture_revealable?`
  re-evaluates `capture_evidence_holds?` live on every serve, so the secret is served the instant both
  stores hold, independent of whether a stamp has run. The server gate is a strict superset of the client
  judge for link phish (section 7), so every client-landed send is a server-landed send; drift can only let
  a forged send through, never refuse a real one. Delay/retries: the send helper awaits the build POST, and
  a send that still arrives early is recorded `landed: false` with `page_not_built_yet`, `retryable: true`
  and re-posted. Offline: a bounded in-memory re-send queue drains on `online`/next sync, builds before
  sends, idempotent. Reload: both stores persist in `player_state`. Two tabs: `with_game_lock` serialises
  and first-wins idempotency makes a concurrent duplicate a no-op.
- **`with_game_lock` and lost updates.** Route 2 is specified under `around_action :with_game_lock`, the
  same lock Route 1 holds, which serialises against `sync_state` on the Postgres row, so no stale copy
  reverts a just-synced change. The migration runs inside `prepare_bootstrap_state!`'s lock; route stamping
  re-runs `stamp_proven_captures!` under the route lock. `record_phish_send!` is added to the locking guard
  test with a `se/phish_send is locked` case.
- **Synced `player_state` does not grow and is not re-sent.** Both stores are bounded (pages; targets by
  kits), first-wins, written only by the two routes, never in the client-to-server body, the bootstrap
  serialisation allowlist, or the sync answer (`captures_for_client` is an allowlist that omits them). The
  routes carry one-shot bodies, like `POST network/plant`. The sync sends strictly less: the
  `phish_evidence_fingerprint` mailbox walk and `extra_sent` re-parse retire. `phishEvidenceMigrated` is a
  top-level server-owned flag, off the body and the dump. Net new synced growth per sync is zero.
- **One code path (Q1).** `recompute_page_verdict?` returns true for every page; Route 2 derives `landed`
  the same way for every send; the reader reads the two stores for every scenario. The hard-access
  distinction lives only in the validator at authoring time. Confirmed inert on awareness scenarios with no
  phish-page capture secret (above), so the single path adds no awareness refusal.
- **The client-judge-in-the-superset claim.** The client grants only on `meets && didLand`
  (`describeVictimOutcome`), where `meets` is the build-time `meetsThreshold`. The server lands on the page's
  server-recomputed `built && meetsThreshold` (same verdict, parity-tested) plus an authored target and an
  authored kit, dropping the sender/addressing/pretext factors. Same build verdict on both sides, server
  strictly weaker, so client-landed implies server-landed. The reader's kit match is consistent:
  `record_phish_send!` stores `pageId = kit['landingPageId']` and the reader checks the send's `kitId`
  against `page_evidence_kits(scenario)[page_id][:kits]`, grouped by the same `landingPageId`.
- **Chunk order and each window.** Send route, then migration, then reader (section 14), with
  migration-before-reader a hard constraint (section 10). After A both stores fill but the old
  client-evidence reader still drives the reveal. After B the migration populates the stores, still
  behaviour-neutral. C flips the reader with the migration writer already present and running before the
  stamp in the same pass. No window withholds a legitimate secret, and the forge is no worse than today
  until C closes it.
- **Buildability and testability.** Route 2 mirrors Route 1, which already has `set_game`, `with_game_lock`
  and `GamePolicy` coverage, so the wiring is a known pattern. Each chunk has unit tests, controller tests on
  real requests, node tests, and a live browser proof on `lab_social_engineering` (and `test_social_slice`)
  on ports 3664 or 3665, never `:3000`, headless with `setFPS(20)` and fixed steps on, driving the real
  builder and mail controls through `window.__test` with the stores read back by a runner. The six hostile
  cases (forged send for another target, wrong kit and unbuilt-page kit, below-threshold page, replay,
  forged `se_landing_pages` global, oversized or control-character ids) are listed and feasible.
- **Q2 honesty.** Section 13 is accurate and plain. It states what B gives up: the server no longer judges
  sender, addressing or pretext, so for `lord` a server-convincing page plus any authored message carrying
  the payroll kit serves the secret whether or not the email would have fooled her; the lab is a little
  easier in exchange for a secret that can never be served off forged client state and an honest player who
  is never blocked by a Ruby/JS disagreement that does not exist. No overclaim.
