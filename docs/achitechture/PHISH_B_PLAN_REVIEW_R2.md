# Phish evidence server plan (build/hard-phish-b): review R2

Scope: review only, against the real tree at `build/hard-phish-b` tip `4a9eb51b6`. The plan under review
is `docs/achitechture/PHISH_EVIDENCE_SERVER_PLAN.md`; the prior review is
`docs/achitechture/PHISH_B_PLAN_REVIEW_R1.md`. The four settled answers (Q1 universal recompute one path,
Q2 lighter send gate, Q3 `se_landing_pages` stays a client UI global, Q4 one-time legacy import gated on
the re-derived build threshold) and the three design calls (the client judge decides the reveal; the
server gate is a strict superset of the client; the legacy import keys off
`globalVariables.se_landing_pages[pageId].victim.submitted`) are taken as final. Chunks A, B and C are
not yet built, so the code at the tip is the "already on main" state (Route 1, `PhishScore`, the stores
and defaults); "closed in the code" below means the plan's claims about that real tree hold.

## Counts

- Blocker: 0
- Major: 1
- Minor: 2

## Verdict: REVISE

No blocker. R1's blocker and all three R1 minors are closed. One major remains: the legacy migration's
"runs a single time" property is asserted but not delivered by the described mechanism, because
`run_bootstrap_writers!` calls every writer unconditionally once the lock is taken for any reason and the
phish migration, unlike the capture migration, deliberately does not clear its own trigger. The fix is a
one-line entry guard that the plan must name. Everything else holds up; the superset "never refuse a
legitimate player" property is sound and is backed by the live `capture_revealable?` re-check, not only by
stamping.

---

## R1 findings: closure

- **B1 (blocker, "reveal follows server" had no path to create the capture record) is closed.** The
  revision takes R1's offered second position: the client keeps its own judge and decides the reveal
  (plan section 7, lines 252-278), and the capture record is created exactly as today from the client's
  own claim (plan section 6, lines 237-244). Verified against the real chain: `captureGranted`
  (`landing-page-model.js:733`) gates `recordCapture` (`mail-bridge.js:422-438`), which writes the
  `se_captures` global, which `apply_capture_sync_step` records through `record_capture!`
  (`games_controller.rb:975-988`). The divergence-window refusal R1 described cannot occur because the
  server gate is a strict superset of the client judge for link phish (see point 1 below), so every client
  claim is one the server serves. Closed in plan and consistent with code.
- **M1 (major, landed import keyed off a stored sent record) is closed.** Plan section 9 now keys the
  import off the durable `victim.submitted` marker in `se_landing_pages` and states "No stored sent mail is
  consulted" (lines 399-407). Verified the marker is durable and lives outside the capped mailbox: the mail
  bridge writes the best victim outcome back onto the page global on the landing send
  (`mail-bridge.js:415-420`, `writeGlobal('se_landing_pages', ...)`), and `describeVictimOutcome` sets
  `submitted: true` only when `meets && didLand` (`landing-page-model.js:700`). Closed.
- **m1 (phishEvidenceMigrated storage unspecified) is closed.** Plan section 9.1 (lines 453-460) pins it as
  a top-level, server-owned `player_state` key, never read from the `sync_state` body and never in the
  bootstrap serialisation allowlist. Verified the mechanism: `sync_state` merges only named sections, so a
  bare top-level key is never read from the body; the bootstrap attaches named keys one by one and this key
  is not among them. Closed. (The writer's one-time behaviour is a separate concern, see the major below.)
- **m2 (section 8 overstated the bootstrap allowlist for globals) is closed.** Plan section 8 (lines
  304-311) now states that `globalVariables` ships wholesale as `savedGlobalVariables` and that
  `se_landing_pages` rides out with it, while the two server stores do not. Verified at
  `games_controller.rb:344` (`filtered['savedGlobalVariables'] = @game.player_state['globalVariables']`).
  Closed.

---

## Major

### MA1. The legacy migration is not one-time as the plan claims; the writer needs an entry guard

Files: plan section 9.1 (the writer "sets `phishEvidenceMigrated = true` when it finishes, so it runs a
single time", lines 451-452) and section 9 ("The old `se_landing_pages` global is left in place for the
UI", line 428); `app/models/break_escape/game.rb:1301-1323` (`bootstrap_state_needs_write?` and
`run_bootstrap_writers!`); `app/models/break_escape/capture_proofs.rb:288-320`
(`migrate_legacy_captures!`, which deletes its global at line 318).

`run_bootstrap_writers!` (`game.rb:1309-1323`) calls each writer unconditionally once the lock is taken.
The lock is taken whenever `bootstrap_state_needs_write?` (`game.rb:1301-1304`) is true for any reason:
`cards_need_repair?`, `legacy_cloned_cards?`, `legacy_captures?`, `unrecorded_shared_logins?` or
`stampable_captures?`. The predicate `legacy_phish_evidence?` the plan adds only decides whether the lock
is taken for *this* reason; it does not gate the writer once the lock is taken for another.

`migrate_legacy_captures!` is safe to re-run only because it deletes its own trigger (`globals.delete(
'se_captures')`, `capture_proofs.rb:318`): a second pass finds no legacy global and returns at once. The
phish migration deliberately does the opposite. Plan section 9 line 428 keeps `se_landing_pages` in place
for the UI, so its trigger (a non-empty `se_landing_pages` with a `victim.submitted` marker) persists.
With no entry guard, `migrate_legacy_phish_evidence!` therefore re-runs on every later bootstrap whose
lock was taken for any other reason (a capture earned across a reload makes `stampable_captures?` true, a
pending heard share makes `unrecorded_shared_logins?` true), and on each re-run it reads the *current*
`se_landing_pages`, which is a client-writable, untrusted UI global (plan section 8, decision three), not
the frozen legacy snapshot the word "migration" implies.

Failure scenario: a save finishes the migration (`phishEvidenceMigrated` set). The player later earns a
second capture across a reload, so `stampable_captures?` is true and the bootstrap takes the lock;
`run_bootstrap_writers!` re-invokes the phish migration, which re-derives verdicts from whatever
`se_landing_pages` currently holds and re-synthesises `sePhishSends`. The plan's stated "runs a single
time" is false.

Why this is a major and not a blocker: the re-run opens no new forge. `sePhishSends` is first-wins on
`landed: true` and `seLandingPages` is first-wins per page, so a re-run never double-credits, and the
import credits `landed` only from the server's re-derived build threshold over the stored `choices`
(plan section 9, lines 399-407), the same best-effort gap live B already accepts. To re-import against a
real page the attacker must supply `choices` that genuinely re-score above the aimed target's threshold,
which is playing the builder and is exactly what Route 1 already accepts. So the security model holds; what
breaks is the plan's own one-time guarantee, and the migration needlessly re-scores untrusted current
state on every locked bootstrap.

Fix direction: state that `migrate_legacy_phish_evidence!` returns false immediately when
`player_state['phishEvidenceMigrated'] == true`, mirroring how `migrate_legacy_captures!` self-clears, so
the writer, not only the lock predicate, enforces one-time. Then the "runs a single time" sentence is
true.

---

## Minor

### MI1. Chunk C's retirement list does not name the `phishGated` write, leaving a dead server-only field

Files: plan section 6 (lines 231-235) and section 14 chunk C (lines 651-656); the `phishGated`
computation at `app/models/break_escape/capture_proofs.rb:174` and its storage in `store_capture_entry`
at `capture_proofs.rb:687-697` (line 695).

Chunk C lists retiring `phish_evidence_fingerprint`, `phish_gated_unproven_captures?`,
`each_stored_sent_message`, the controller's `@phish_fp_before` / `needs_stamp` / `extra_sent` block and
the sync's phish stamp branch. It does not list removing the `phish_gated` computation in `record_capture!`
(`capture_proofs.rb:174`) or the `entry['phishGated'] = true` write in `store_capture_entry`
(`capture_proofs.rb:695`). Once `phish_gated_unproven_captures?` retires, nothing reads `phishGated`, so
the field becomes dead state written on every phish-gated capture. It is harmless (server-only, never in
`captures_for_client`), but it is part of the machinery the plan says it is retiring. Add the two write
sites to the chunk C retirement list so the field is not left behind.

### MI2. The superset test covers only the lab and the test scenario, so the one-code-path reader is
unverified on awareness scenarios

Files: plan section 7 (the superset test, lines 280-290); `app/models/break_escape/capture_proofs.rb:603`
(`phish_evidence_page_for`), which gates every scenario's phished credentials after chunk C.

The superset test enumerates "the `lab_social_engineering` kits and targets and the test scenario". The
reader change is universal (Q1, one code path), so after chunk C every scenario's phished credential is
gated on the two stores, including awareness scenarios the superset test does not exercise. The thin risk:
an awareness scenario where the client grants a capture (`captureGranted`, inside the `linkKit` branch) for
a send whose recipient is not an authored `social.phishTargets` entry. `record_phish_send!` would refuse
that send (step 1), so no `sePhishSends` row is written, and if the credential's address matches a page's
capture address (`phish_evidence_page_for` returns a page), the reader would withhold a credential the
client displayed. No protected secret is at stake there, so the worst case is a cosmetic withhold, not a
served secret, which is why this is minor. Suggest the superset test also assert, per shipped scenario,
that every target the client can capture-grant is an authored phish target (or note the awareness gap
explicitly), so the universal reader is not silently unverified outside the lab.

---

## What checks out

- **Point 1, superset claim.** Sound for the protected lab path. The client grants only on `meets &&
  didLand` (`describeVictimOutcome`, `landing-page-model.js:694-702`; `captureGranted`, line 733), where
  `meets` is the build record's `meetsThreshold`. The server lands on page `built && meetsThreshold`
  (server-recomputed) plus an authored target and an authored kit, dropping the sender/addressing/pretext
  factors. Both sides read the same build-time verdict for the same `choices` and the same build target:
  the server computes `meetsThreshold` per target via `per_target_cfg` (`phish_score.rb:58, 213`), and the
  JS scorer does the same, held in parity by the existing shared-fixture test. So a client-landed send is
  always a server-landed send; drift can only let a forged send through, never refuse a legitimate one.
  The timing cases the brief lists (build POST not yet committed, retrying, offline) delay the reveal but
  never refuse it: the capture entry is created by the client claim regardless, stored `proven: false`
  until evidence holds, and `capture_revealable?` (`capture_proofs.rb:420-425`) re-evaluates
  `capture_evidence_holds?` live on every serve, so the secret is served the instant both stores hold,
  independent of whether a stamp has run. The reader's kit match is consistent: `record_phish_send!`
  stores `pageId = kit['landingPageId']` and the reader checks the send's `kitId` against
  `page_evidence_kits(scenario)[page_id][:kits]`, which `capture_model.rb:356-373` groups by that same
  `landingPageId`, so the stored send's kit is always in the page's kit list. The superset and guard tests
  as described (section 7) would catch a server-stricter drift on the lab and a future edit that reads a
  craft factor into the gate; parity drift in `meetsThreshold` is caught by the separate `PhishScore`
  parity test (subject to MI2 on awareness coverage).
- **Point 2, legacy marker.** `victim.submitted` as the trigger is acceptable. It is a durable marker
  outside the capped mailbox (`mail-bridge.js:415-420`), and the import does not trust it: `landed` is
  re-derived from the stored `choices` through `PhishScore` against the build threshold (plan section 9,
  lines 385-407), so a forged `meetsThreshold: true` over junk choices migrates to `false`. A crafted save
  gains nothing over live B, because landing still needs choices that genuinely score above threshold and
  the target/kit must be authored. `phishEvidenceMigrated` is correctly pinned server-only, never from the
  `sync_state` body, never in the bootstrap allowlist (section 9.1). The one-time and replay question is
  where MA1 bites: idempotent (no double-credit) but not one-time as claimed.
- **Point 3, chunk order.** Send route, then migration, then reader is safe at each window. After chunk A
  both stores fill but the old client-evidence reader still drives the reveal, so live play is unaffected
  (Route 1 is already on main, so `seLandingPages` already fills today). After chunk B the migration
  populates the stores on bootstrap, still behaviour-neutral because nothing reads them. Chunk C flips the
  reader after the migration writer is already present, and the migration runs before
  `stamp_proven_captures!` in the same locked bootstrap pass (`run_bootstrap_writers!`, `game.rb:1318-1322`
  will carry it), so a returning legacy save that first bootstraps post-C is migrated and stamped in one
  pass. The live `capture_revealable?` re-check covers a build-and-send that lands mid-flight across a
  deploy. Reloads and two tabs are covered by first-wins idempotency on both stores.
- **Point 4, concurrency.** Route 2 is specified under `around_action :with_game_lock`, the same lock
  Route 1 holds (`games_controller.rb:103-105`), which serialises against `sync_state` on the Postgres row
  lock, so no lost update. The migration runs inside `prepare_bootstrap_state!`'s `with_lock`
  (`game.rb:683-691`). The route stamping re-runs `stamp_proven_captures!` under the route lock. Whichever
  of the capture sync or the final route commits last leaves the capture proven, because `record_capture!`
  computes `proven` from the stores at creation (`capture_proofs.rb:169`) and a later route stamps.
- **Point 5, synced state does not grow.** Both stores are top-level `player_state` keys, bounded (pages;
  targets by kits), first-wins, never in the client-to-server body, the bootstrap allowlist or the sync
  answer. The two routes each carry a one-shot body, like `POST network/plant`, not re-sent state. The
  plan retires the per-sync `phish_evidence_fingerprint` mailbox walk (`capture_proofs.rb:390-416`) and the
  `extra_sent` mail re-parse in `apply_capture_sync_step` (`games_controller.rb:966-971, 1008`), so the
  sync sends and does strictly less. `phishEvidenceMigrated` is a top-level flag, off both the body and the
  dump.
- **Point 6, testability.** Each chunk is buildable, testable and committable on its own, with unit tests,
  controller tests on real requests, node tests and a live browser proof. The hostile set covers a forged
  send for another target (case 1), the wrong kit and an unbuilt-page kit (case 2), a below-threshold page
  (case 3), a replay (case 4), the forged `se_landing_pages` global (case 5) and oversized or
  control-character ids (case 6). The live proof uses `lab_social_engineering` (and `test_social_slice` /
  the test scenario) on ports 3664 or 3665, headless, `setFPS(20)`, fixed steps on, driving the real
  builder and mail controls through `window.__test` with the stores read back by a runner. All consistent
  with project rules.
- **Point 7, Q2 honesty.** Section 13 is accurate and plain. It states what B gives up: the server no
  longer judges sender, addressing or pretext, so for `lord` a server-convincing page plus any authored
  message with the payroll kit serves the secret whether or not the email would have fooled her, and the
  lab is a little easier in exchange for a secret that can never be served off forged client state and an
  honest player who is never blocked by a Ruby/JS disagreement that does not exist. No overclaim.
