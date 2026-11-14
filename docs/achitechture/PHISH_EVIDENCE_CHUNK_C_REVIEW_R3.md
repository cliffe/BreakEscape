# Phish evidence chunk C: review R3 (the legacy capture now migrates unproven)

Review only, in worktree `.claude/worktrees/p-hard-phish-c`, branch `build/hard-phish-c`, tip
`a50e25487`. New change reviewed: `git diff ba634bba3 a50e25487` (one commit,
`a50e25487` "Phish chunk C: migrate a legacy phish capture unproven, not trusted"). Whole chunk
re-checked over `ea7005131..a50e25487`. Prior rounds: `PHISH_EVIDENCE_CHUNK_C_REVIEW_R1.md` (0 / 0 / 3,
closed) and `PHISH_EVIDENCE_CHUNK_C_REVIEW_R2.md` (0 / 0 / 1; the single Minor is what this change closes).

Verification run at the tip (single files, no suites, no server):
`test/controllers/break_escape/phish_legacy_migration_controller_test.rb` 8 runs, 59 assertions, 0
failures; `test/models/break_escape/capture_record_test.rb` 14 runs, 49 assertions, 0 failures.

## Counts

- Blocker: 0
- Major: 0
- Minor: 0

## Verdict

SHIP chunk C. The change is a faithful, minimal implementation of R2 Minor 1's recommended fix, and it
closes the one phish secret path that trusted a client-written claim without a server recompute. After
it, no path that this chunk can reach serves a phish secret off an unproven build, and every honest
legacy shape is still proven and served on its first bootstrap. The only phish secret still served on a
client claim is a pre-hardening save whose capture was already stamped `proven: true` at the top level
under the old 6a rules, which is the documented grandfather (game.rb:1863) and the same policy honoured
for non-phish captures; it is unchanged by this chunk and no current path can write it (R2 key question).

## The change

`migrate_legacy_captures!` (capture_proofs.rb:529-536) replaced the unconditional
`store_capture_entry(record, chosen[:fields], proven: true)` with a per-target choice: a target in
`CaptureModel.phish_target_ids(scenario)` is stored `proven: capture_evidence_holds?(chosen[:fields],
scenario:)`; any other target keeps `proven: true`. The input to the gate is the server-authored
candidate's `chosen[:fields]` (capture_proofs.rb:528, `pick_capture_candidate`), not the client entry,
so a forged client address cannot steer the gate. A doc-comment block (capture_proofs.rb:498-507) and a
build-log entry record the reasoning. The tests are tightened to match (below).

## 1. An honest legacy save is proven and served on its first bootstrap, in every shape

Writer order is fixed in `run_bootstrap_writers!` (game.rb:1292-1312): `migrate_legacy_captures!` →
`record_shared_logins!` → `migrate_legacy_phish_evidence!` → `stamp_proven_captures!`, all inside the
one row lock taken by `prepare_bootstrap_state!` (game.rb:684-692), saved once.

- **se_captures global + se_landing_pages with victim.submitted (honest, convincing).**
  `migrate_legacy_captures!` runs first while `seLandingPages` / `sePhishSends` are still empty, so
  `capture_evidence_holds?` -> `phish_page_evidence_holds?` (capture_proofs.rb:915-934) reads empty
  stores and returns false; the entry is stored `proven: false` (capture_proofs.rb:535) and the
  `se_captures` global is deleted (capture_proofs.rb:544). `migrate_legacy_phish_evidence!`
  (capture_proofs.rb:579-630) then fills `seLandingPages` (built, server-recomputed `meetsThreshold`)
  and a landed `sePhishSends` entry off the save's own `victim.submitted`. `stamp_proven_captures!`
  (capture_proofs.rb:706-722) mutates the existing entry's `proven` field to true. `capture_secrets`
  serves `Sofia2026!`. Pinned by `a pure pre-store save with both legacy globals co-migrates and serves
  the secret on one bootstrap` (phish_legacy_migration_controller_test.rb:130-155), which asserts
  `seCaptures.lord.proven == true` and the secret served.

- **The same with phishEvidenceMigrated already set from an earlier partial run (the entry-guard
  question).** The guard does not strand the capture. `migrate_legacy_captures!` and
  `migrate_legacy_phish_evidence!` run in the same `run_bootstrap_writers!` pass, and each consumes its
  own global on that pass: `migrate_legacy_captures!` always reaches
  `globals.delete('se_captures')` once `se_captures` is a Hash (capture_proofs.rb:513-544, no early
  return skips the delete), and `migrate_legacy_phish_evidence!` sets `phishEvidenceMigrated = true`
  on the same pass it imports (capture_proofs.rb:626-629). So the bootstrap that set the flag is the
  bootstrap that recorded and stamped the capture; the flag can never already be set on a strictly
  later bootstrap that is seeing `se_captures` for the first time, because no current path writes the
  `se_captures` global after the save is frozen (R2 key question). When the flag is already set, the
  stores it populated on that earlier pass are still present (grow-only, first-wins), so
  `stamp_proven_captures!` proves the entry off them. The capture is not left unproven for ever.
  (A weak or forged build that set the flag leaves the stores not meeting the threshold, so the entry
  stays unproven for ever, which is the correct withhold.)

- **An old top-level seCaptures entry.** `migrate_legacy_captures!` skips any target for which
  `record[target_id].is_a?(Hash)` (capture_proofs.rb:522, first-wins on record creation), so a
  pre-existing top-level `seCaptures.lord` is left untouched; the change never runs for it. If it was
  stored `proven: false`, `stamp_proven_captures!` proves it only when the server stores hold the
  build evidence. If it was stored `proven: true` (a 6a-era save), `capture_revealable?`
  (capture_proofs.rb:694-699) short-circuits and serves it, bypassing the build gate; this is the
  documented grandfather, unchanged here and unreachable by any current write path (see Verdict).

## 2. The gate call timing, and first-wins versus the stamp

`capture_evidence_holds?` is called inside `migrate_legacy_captures!`, before
`migrate_legacy_phish_evidence!` populates the stores, so for the real single-secret-page scenario it
reads empty stores and returns false; it cannot wrongly store `proven: true` for a phish target whose
page gate applies. Where `phish_evidence_page_for` (capture_proofs.rb:894-907) resolves no page (a
phish target with zero or more than one secret page and an address that matches no page), the part-2
gate is skipped and, absent proofs, the gate returns true, which is exactly the live
`record_capture!` behaviour (capture_proofs.rb uses the same predicate for `proven`), so the migration
is now consistent with the live path rather than looser than it. First-wins does not block a later
stamp: `migrate_legacy_captures!`'s `next if record[target_id].is_a?(Hash)` guards only record
*creation*, while `stamp_proven_captures!` mutates the existing entry's `proven` field in place
(capture_proofs.rb:717-719). So an entry stored unproven is proved by the same pass's stamp or any
later bootstrap once the stores hold the evidence.

## 3. Non-phish is unchanged; phish_target_ids resolution

A target not in `phish_target_ids` keeps `proven: true` (capture_proofs.rb:531-533), so foothold and
non-phish credential captures migrate exactly as before, consistent with the grandfather policy (they
have no server re-derivation to defer to). Pinned by the new assertion in `capture_record_test.rb:102`
(`record['len']['proven'] == true`). `phish_target_ids` (lib/break_escape/capture_model.rb:107-114)
reads `data['social']['phishTargets']` and returns `[]` when `social` or the list is absent, so for a
scenario with no phish targets the `include?` is false for every target and the whole migration keeps
the old `proven: true` path. No nil-scenario regression: the bootstrap reads `stored_scenario_data`
(game.rb:1271-1281) under the reloaded lock, the same source the live sync uses.

## 4. Whole-of-chunk pass (ea7005131..a50e25487)

R2 cleared `ea7005131..7da3bc1d2` on forgery, legitimate players, retired code, lock and non-growth of
synced player_state; `ba634bba3` is only the R2 review doc. This change touches only the migration
`proven` value and its tests, so the earlier conclusions hold:

- **Forgery.** The gate now runs on the server-authored candidate fields, not the client entry, so a
  forged `se_captures` address cannot resolve a different page. The build store is still server-
  recomputed in `migrate_legacy_phish_evidence!` and the send is gated on it; the global path no longer
  bypasses either.
- **Legitimate players.** The honest convincing save still serves on one bootstrap (test above); the
  weak twin now carries the same two globals and is withheld honestly
  (phish_legacy_migration_controller_test.rb:166-189); a phish `se_captures` with no `se_landing_pages`
  migrates unproven and is withheld (phish_legacy_migration_controller_test.rb:193-217).
- **Retired code / lock / growth.** Untouched. `proven` is an existing boolean on an existing entry, no
  new key or store; the two server stores and `phishEvidenceMigrated` stay bounded and never ride the
  bootstrap or a sync answer back to the client; both routes and the bootstrap run under the row lock.

## 5. Standing rules

UK English throughout. No em or en dash on any added line (grep of the added lines is empty). No model
name on any added line.

## Confirmed clean (observations, not findings)

- The tests seed the globals the way a pre-store client wrote them and drive the real routes; the weak
  twin and the no-landing-pages test both assert the capture is recreated unproven and the secret is
  withheld, and the honest twin asserts it is proven and served. The non-phish pin in
  `capture_record_test.rb` keeps the grandfather explicit.
- The build-log entry (PHISH_EVIDENCE_SERVER_BUILD_LOG.md) describes the fix and its tests accurately
  and names the one bootstrap order it relies on.
