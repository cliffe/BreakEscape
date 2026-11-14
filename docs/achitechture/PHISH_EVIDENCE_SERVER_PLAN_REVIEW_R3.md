# Phish evidence server plan, review R3

Reviewer round 3 of `docs/achitechture/PHISH_EVIDENCE_SERVER_PLAN.md`. The plan was read fresh as a
standalone document and checked against the code. The worktree is at `c16400607` with main
`61c033b13` merged (the tree the plan pins its citations to). Main has since moved to `372600713`
(train 37: scenario format steps 8b and 8c, format version 3), which this review also checks the plan
against. Review only; no code or plan edits were made. The R1 and R2 reviews were read, and every R2
finding was re-checked in the current design and in the code.

## Verdict

**READY TO BUILD.**

The forge is real and the design closes it: the two gate facts (the page meeting threshold and the
send landing) move into two server-owned stores written only by two gated routes, recomputed by Ruby
ports the server owns, read by a reader that no longer trusts `se_landing_pages` or `mailState`. All
five R2 findings are closed in the design, not reworded (traced below). The whole-plan bar holds: an
honest player is not refused under delay, offline or an old save; a forged client is never served
`Sofia2026!`; each chunk merges on its own with the migration now ahead of the reader; and the tests
include a live browser proof on the real lab path. Train 37 does not touch the code the plan depends
on for its mechanism (capture_proofs.rb, the mail and landing minigames, the lab scenario,
state-sync.js are all untouched), and the format upgrade does not disturb the phish evidence the
migration reads. The two Minor findings are build-time notes, not corrections to the design.

## Counts

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 2 |

## R2 findings: all closed (confirmed in design and code)

- **M1 (Q2 framed on an inaccurate risk picture): closed.** Section 16 Q2 now carries the paragraph
  "For the one protected secret, Option A reads no account global" (plan `:839`), and Option B is
  stated plainly to "leave `senderTrust`, `addressedTo` and `pretextRelevant` entirely unchecked for
  `lord`" and so "guts the learning gate" (`:874-880`). The same fact is woven into section 5 ("The
  protected `lord` path reads no account global", `:316`), the section 2 split table note (`:104-110`)
  and the cheat-policy section 11 (`:610-622`). Traced against code: `lord`'s `requiredFactors`
  include `senderTrust` (`scenario.json.erb:967`), `guest` is the only `spoofsFrom: true` account
  (`:628-629`) and is `kind: given`, and a `given` account reads no account global in `resolveAccounts`
  (`mail-data.js:32-41`). A real reframing, not a reword.
- **M2 (reader change ordered before the migration): closed.** Section 14 now orders chunk 6 =
  legacy migration, chunk 7 = reader change, with the prose "The legacy migration lands **before** the
  reader change, not after" and the withholding-window reasoning (`:674-682`, `:700-712`). The
  independent-merge invariant is restated to hold for every chunk (`:715-720`). A genuine reorder of
  the build, not a wording change.
- **m1 (controller phish-gating block not named as retiring): closed.** Section 6 now has "The
  controller's phish-gating block retires with them" naming `@phish_fp_before`, the `needs_stamp`
  fingerprint compare and the `extra_sent` build and forward in `apply_capture_sync_step`
  (`:375-384`), and states part-3 serving rests on the live `capture_revealable?` re-check, not a
  sync-time stamp. Traced: those anchors exist in the worktree (`games_controller.rb:844`, the
  `apply_capture_sync_step` def at `:895`, the early return at `:920`, the `extra_sent` comment at
  `:955`).
- **m2 (single re-post with no fallback): closed.** Section 10 now states that a persistent
  `page_not_built_yet` after the one re-post "is not left stranded: the helper hands it to the same
  bounded offline re-send queue" keyed by `targetId/kitId` (`:572-578`), so the await is the primary
  guarantee, the one re-post sits behind it, and the queue is the final backstop.
- **m3 (imprecise part-3 wording): closed.** Section 6 now says part-3 proofs "arrive through their
  own routes ... not through `sync_state`" and are served through the live `capture_revealable?`
  re-check (`:386-392`), removing the earlier reading that a sync records the part-3 proof.

## Main has moved to 372600713 (train 37): effect on the plan

`git diff --stat 61c033b13 372600713` was run. Train 37 is the scenario format hardening (steps 8b and
8c, format version 3): one new owner field, habits folded into one block, and a large body of fixtures
and format tests. Against the files the plan names:

- **Untouched by train 37, so every citation holds exactly:** `capture_proofs.rb` (all plan anchors
  confirmed present at the cited lines: `record_capture!` `:138`, `migrate_legacy_captures!` `:229`,
  `capture_evidence_holds?` `:297`, `phish_evidence_fingerprint` `:331`, `capture_revealable?` `:361`,
  `stamp_proven_captures!` `:373`, `phish_page_evidence_holds?` `:441`, `each_stored_sent_message`
  `:469`), `capture_model.rb`, `network_access.rb`, `lab_social_engineering/scenario.json.erb`,
  `mail-bridge.js`, `phish-rules.js`, `mail-data.js`, `landing-page-model.js`,
  `landing-page-builder-minigame.js`, `mail-composer.js`, `mail-client-minigame.js`, and
  `state-sync.js`. None changed, so the forge mechanism, the ports' source functions, the account
  path and the reader all stand as the plan describes.
- **`game.rb` (changed, but the plan's anchors are unshifted).** Train 37's hunks are a one-for-one
  rename at `:1736` (no line shift) and additions at `:2110` and `:5699-5747`, all either a non-shift
  or below the plan's structural anchors. `ACCESS_STATE_DEFAULTS` (`:1773`) and
  `SERVER_OWNED_GLOBAL_NAMES` (`:1798`) are unmoved and unchanged; `prepare_bootstrap_state!` (`:214`),
  `bootstrap_state_needs_write?` (`:831`) and `run_bootstrap_writers!` (`:839`) are unmoved. The only
  drift is the seed line `ACCESS_STATE_DEFAULTS.each ... ||= empty.dup`, cited at `:5926`, which the
  habits-folding additions push down by roughly eight lines; the implementer re-pins it (see m2
  below). The step-8c changes (habits fold, `WITHHELD_WORK_NPC_KEYS`, `SHIPPED_HABIT_KEYS`) are about
  NPC bootstrap filtering and do not touch any player-state global the phish plan reads.
- **`games_controller.rb` (changed, but below every plan citation).** Train 37's two hunks are at
  `:2563` and `:2703` (the `owner` rename and the forbidden-field list). Every anchor the plan cites
  is at or below `:2185` (`merge_global_variables!` `:2129`, `merge_mail_state!` `:2148`, the sync
  merge block `:2124-2185`, the bootstrap allowlist `:311-420`, `apply_capture_sync_step` `:895`), so
  all are unshifted when the plan is built on `372600713`.
- **`validate_scenario.rb` and `scenario-schema.json` (changed by train 37).** The plan's section 13
  adds a new validator rule and shares `PhishScore` with the validator but cites no line numbers
  there, so there is no line drift; the new rule is additive and lands in a different area (landing
  page `capture.secret` protection) from train 37's format and access-model checks. No conflict.

**Does the old-save migration have to take the format upgrade path into account?** Traced in full, the
answer is no, and the migration is safe as designed, but the plan is silent on an interaction it
should name (m1):

- `ensure_current_format!` runs in `set_game` (`game.rb:1244`, calling
  `FormatUpgrade.upgrade!(scenario_data, player_state)` at `:1256`) **before**
  `prepare_bootstrap_state!` runs in the `scenario` action (`games_controller.rb:288`). So the phish
  migration always sees scenario data already at format 3.
- Format 8b/8c change NPC habits, the Friendface phone owner field and outage fields; they do not
  touch `social.landingPages` or `social.phishTargets`, which `PhishScore` and the validation read. So
  the migration's recompute inputs are stable under the upgrade.
- The format upgrade's `player_state` transforms only rename item hashes in the stored item lists
  (`rename_outage_fields_in_player_state!`, `one_owner_field_in_player_state!`), and step 8c's
  `player_state` transform is an explicit no-op (`format_upgrade.rb@372600713:106`, "NPC records are
  not stored in player_state"). No step transform and no retired-key entry touches
  `globalVariables.se_landing_pages`, `mailState` or any phish global. So the legacy phish evidence
  survives the upgrade intact for `migrate_legacy_phish_evidence!` to read, and the migration does not
  need to become a format step, nor does it need a format bump, which matches the plan's section 9
  position. It does, though, run as a second locked `save!` after the format upgrade's own locked
  `save!` in the same request, which is the existing pattern for any old-format game (upgrade plus
  capture migration) and introduces no new concurrency issue.

## Whole-plan bar

- **An honest player is never refused.** Held. Section 10 awaits the build POST's own HTTP response
  before the send POST (`mail-composer.js:685` confirms a kit attaches only when `rec.built === true`,
  so the build POST precedes the attach on every honest path), records an unbuilt-page send as
  `landed: false` and `retryable` rather than erroring, re-posts once, and falls to a bounded
  idempotent offline queue keyed by `pageId` or `targetId/kitId` drained on `online` and on a sync.
  The migration (now chunk 6, ahead of the reader) populates the server stores for a returning save in
  the narrow `proven: false` window before the reader consults them, and the honest-solve parity
  fixture (section 5) makes a refusal of the real lab solve a red test.
- **A forged client never receives the protected secret.** Held. The build route carries no score and
  recomputes `meetsThreshold` with `PhishScore`; the send route ignores the body's `landed` and
  recomputes it with `PhishJudge`; both stores are written only by the routes, are never read from a
  sync body, and are not in the bootstrap allowlist, so a tampered `se_landing_pages`/`mailState` moves
  the minigame UI but not the gate (test 3, and the live tampered run in section 15).
- **Each chunk merges and deploys without the next.** Held, given the chunk-6-before-7 reorder.
  Chunks 1 to 6 leave the reader on the old client evidence, so the game plays as today and the forge
  is no worse than today; chunk 7 closes it with both stores, both ports and the migration already in
  place.
- **The tests include a live browser proof on the real game path.** Held. Section 15 drives
  `lab_social_engineering` to the phish on the assigned port: a tampered run (forged globals, no
  routes, secret withheld), an honest run (build and send through the minigame, secret served,
  `sofia_archive` opens) and a throttled/offline run with Playwright `route` delay and
  `setOffline(true)`.

## Findings

### Minor

**m1 (sections 9, 9.1). The plan does not acknowledge the format upgrade path, which now runs before
the migration and carries its own `player_state` transform.** The plan models the migration on
`migrate_legacy_captures!` and places it in `prepare_bootstrap_state!`, which is correct, but says
nothing about `ensure_current_format!` / `FormatUpgrade.upgrade!(scenario_data, player_state)`
(`game.rb:1244-1256`), which train 37 extended with a per-step `player_state` transform and runs in
`set_game` ahead of the bootstrap. Traced, the interaction is benign: no format step or retired-key
entry touches `se_landing_pages`, `mailState` or the account globals (step 8c's player_state transform
is a no-op, `format_upgrade.rb@372600713:106`), and format 8b/8c do not touch `social.landingPages`,
so the migration reads intact legacy globals against current-format scenario data. No failure scenario
was found. The plan should add one sentence in section 9.1 stating (a) the migration stays a
standalone bootstrap writer and does not become a `FormatUpgrade` step, (b) it runs after the format
upgrade and so reads format-3 scenario data, and (c) no format transform disturbs the phish globals,
so the implementer does not re-invent this as a format step or fear a clobber. Documentation gap, not
a defect.

**m2 (plan header / section 1, citation base). The plan pins its lines to `61c033b13`, but the build
will land on `372600713`.** Every citation still resolves (verified above), but the plan text names
the merged tree as `61c033b13` and the `game.rb` seed reference at `:5926` drifts by roughly eight
lines once the step-8c additions are in. Before build, re-pin the plan's "merged tree" to `372600713`
and re-anchor the single `game.rb:5926` seed line; all other citations are unchanged. Trivial and
self-correcting; recorded so the implementer re-pins rather than trusting the stale line.

## What was checked

- Read the plan end to end (927 lines) as a standalone document, including sections 1 to 16 and the
  four user questions.
- Re-traced each R2 finding against the current plan text and the code, confirming M1, M2, m1, m2 and
  m3 are closed by design changes (reorder, added paragraphs, named controller block, queue fallback,
  tightened part-3 wording), not by rewording.
- Ran `git diff --stat 61c033b13 372600713` over the whole tree and over the exact file set the task
  names, and `git diff --name-only ... | grep` for every plan-relied file. Confirmed `capture_proofs.rb`,
  `capture_model.rb`, `network_access.rb`, the lab scenario, the mail and landing minigames and
  `state-sync.js` are untouched by train 37.
- Confirmed the plan's `game.rb` anchors (`ACCESS_STATE_DEFAULTS:1773`, `SERVER_OWNED_GLOBAL_NAMES:1798`,
  `prepare_bootstrap_state!:214`, `bootstrap_state_needs_write?:831`, `run_bootstrap_writers!:839`) are
  unmoved, and that train 37's `game.rb` hunks (`:1736`, `:2110`, `:5699-5747`) are a non-shift rename
  and below-anchor additions; identified the one seed-line drift at `:5926`.
- Confirmed train 37's `games_controller.rb` hunks (`:2563`, `:2703`) sit below the plan's highest
  controller citation (`:2185`), so all controller anchors are unshifted on `372600713`.
- Read `game.rb:205-290` (`prepare_bootstrap_state!`) and `:1238-1270` (`ensure_current_format!` /
  `FormatUpgrade.upgrade!`), and the `scenario` action (`games_controller.rb:282-300`), establishing
  that the format upgrade runs in `set_game` before the bootstrap migration.
- Read `lib/break_escape/format_upgrade.rb` at `372600713`: the step list, `upgrade!`
  (`step[:player_state]&.call(state)`), the two item-rename player-state transforms, step 8c's no-op
  transform, and the retired-key list; confirmed none touches the phish globals.
- Confirmed the capture_proofs.rb reader and migration anchors (`:138`, `:229`, `:297`, `:331`,
  `:361`, `:373`, `:441`, `:469`) all exist at the cited lines in the worktree.
- Spot-checked `games_controller.rb` phish-gating anchors (`:844`, `:895`, `:920`, `:955`, `:2046`,
  `:2129`, `:2148`).
