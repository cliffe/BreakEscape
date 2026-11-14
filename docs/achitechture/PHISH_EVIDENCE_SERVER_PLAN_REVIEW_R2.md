# Phish evidence server plan, review R2

Reviewer round 2 of `docs/achitechture/PHISH_EVIDENCE_SERVER_PLAN.md`. Every claim below was
traced against the code at the worktree tip (`b46bf0e96`, main `61c033b13` merged), not against the
plan's own citations. Review only; no code or plan edits were made. The R1 review
(`PHISH_EVIDENCE_SERVER_PLAN_REVIEW_R1.md`) was read for reference and each of its findings was
re-checked in the R2 design.

## Verdict

**REVISE.**

The design is sound and build-ready in substance. The forge is real, moving the two gate facts into
server-owned stores written by two gated routes closes it, and the R1 blocker is closed: section 5
now ports `resolveAccounts` and `applyFactorBias` alongside the judge, names the account globals, and
adds a parity fixture built from the real lab honest solve, so the port will credit honest play rather
than refuse it. Two things hold it back from READY, both narrow and cheap to fix: the central user
question (Q2) is framed on an inaccurate risk picture for the one protected scenario, and the build
order runs the legacy migration after the reader change when it must run before it.

## Counts

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 2 |
| Minor | 3 |

## R1 findings: all closed (confirmed in code)

- **B1 (account resolution omitted): closed.** Section 5 adds a three-part port: `resolveAccounts`
  (`mail-data.js:24-56`), `applyFactorBias` (`mail-bridge.js:135`) and `evaluateMessage`
  (`phish-rules.js:486`), assembling the same `ctx` `performSend` builds (`mail-bridge.js:381-384`,
  confirmed: `{ accounts, people, templates, payloadKit, priorFailures }` with the target passed
  through `applyFactorBias` first and `message.linkInfo` from the server page verdict). It names the
  `acct_<id>`, `acct_<id>_choice`, `unlockedBy`, `burned_<id>` globals and bounds the resolved address
  to authored values. The honest-solve parity fixture (section 5, test 8) makes a refusal of honest
  play a red test. Recoverable as R1 predicted, and recovered.
- **M1 (sizing and drift): closed.** Section 5 sizes the port as the three parts and drives the
  parity fixtures over the whole assembly, not `evaluateMessage` alone.
- **M2 (missing chunk sequence): closed.** Section 14 is now an 8-chunk order (see M2 below for the
  one ordering defect that remains).
- **M3 (retry waits on the wrong signal): closed.** Section 10 now awaits the build POST's own HTTP
  response before firing the send POST, and drops the earlier `window.stateSync.sync()` idea, with the
  correct reason (the build store is server-written only and never in the sync answer). Verified:
  `mail-composer.js:685` attaches a kit only when `rec.built === true`, so the build POST precedes the
  attach on every honest path.
- **m1 (lab mislabel): closed.** Section 12 now says the lab sets `"disableAttacks": true` and that
  the landing `capture.secret` scan, not `disableAttacks`, is the discriminator.
- **m2 (migration soft-lock framing and trigger): closed.** Section 9.1 adds a separate
  `legacy_phish_evidence?` predicate to the `bootstrap_state_needs_write?` OR and orders the writer
  before `stamp_proven_captures!`. Confirmed feasible: `run_bootstrap_writers!` (`game.rb:839-854`)
  ends with `stamp_proven_captures!`, so inserting the migration before it is a one-line move.
- **m3 (retiring touches two tests): closed.** Section 15 names
  `test/models/break_escape/capture_record_test.rb` and
  `test/controllers/break_escape/capture_proofs_test.rb`. Confirmed these are the only two files
  outside `capture_proofs.rb` that assert on the retiring machinery.
- **m4 (blocked branch): closed.** Section 4 now mirrors `scorePage`'s `blocked` branch and states the
  menu-validation dependency that keeps it from firing.
- **m5 (extra_sent inconsistency): closed.** Section 3.4 settles it: `extra_sent` is removed, not kept
  and ignored, through the whole chain.

## Central question (Q2): is Option A sound, and is the question framed honestly?

Traced in full. The answer is yes on the mechanism and yes on the recommendation, but the framing
omits the one fact that settles the decision.

**(a) A tampered client that sets only the account globals cannot be served the protected secret.**
Setting `acct_<id>` and friends does nothing on its own: the secret still requires a Route 1 build
(choices recomputed by `PhishScore`, body carries no score) and a Route 2 send (`landed` recomputed by
`PhishJudge`). The server never trusts a client verdict for either. So Option A closes the forge the
plan describes. Over the status quo it adds the entire page-score and landing recompute for the
protected path. Over Option B it adds the sender, pretext and addressing checks (`lord`'s required
factors), which Option B drops.

**The decisive fact the plan omits: the protected target lands via a `given` account, so no
acquisition global is read for the protected secret.** `lord`'s `requiredFactors` include `senderTrust`
(`scenario.json.erb:966`), whose pass condition is "From the portal she expects". Only an account with
`spoofsFrom: true` can set the From to the portal's address, and the lab authors exactly one such
account, `guest` (`scenario.json.erb:628-629`), which is `kind: given` and therefore always resolved
with no global at all (`resolveAccounts`, `mail-data.js:32-41`: a `given` account reads no
`acct_`/`unlockedBy`). The only other account, `freemail`, is `spoofsFrom: false`
(`scenario.json.erb:630`) and cannot satisfy `senderTrust` for `lord`; its `acct_freemail` globals
serve the hampshire/pierce intel phish, which gates no secret. `burned` does not appear anywhere in
`phish-rules.js` or `mail-bridge.js`, so `burned_guest` cannot change `landed` either. So for the one
protected scenario, Option A reads no forgeable account global on the path to the secret. The plan's
repeated line that account resolution is "the one input the server reads from client globals" and that
"the main user question turns on it" is true in general but does not apply to the protected path, and
the plan never says so.

**(b) Where the globals are set, and whether acquisition could be recorded server-side.**
`acct_<id>`/`acct_<id>_choice` are written by the mail client's own create-account minigame
(`confirmCreateAccount` -> `createAccountWrites` -> `writeGlobal`,
`mail-client-minigame.js:567-575`), client-side, through no server route, with no secret prerequisite
(`freemail.unlockedBy` is `acct_freemail` itself). There is no existing gated route, server-validated
ink tag, or server-owned credential item that already records "a sending account was activated", so
recording acquisition server-side would need a new third route. It would buy nothing for the protected
secret, because the protected path's account is `given` and the forgeable account globals gate no
secret. Account acquisition here is minigame control flow with no secret behind it, which the cheat
policy keeps best effort; reading the bounded globals is consistent with that, and for the protected
path the server does not even read them. This should be offered to the user as the reason Option A
carries no account-global risk for the protected secret, rather than presented as a residual risk.

**(c) The recommendation matches policy; the framing does not match the code.** Option A is the
correct choice under the cheat policy, and the plan recommends it. But the user is being asked to
weigh Option A's account-global reading against Option B's smaller surface without being told that (i)
Option A reads no account global on the protected path, and (ii) Option B leaves `senderTrust`,
`addressedTo` and `pretextRelevant` entirely unchecked for `lord`, which is the lab's core learning
gate ("craft the sender and the pretext"). A user could pick Option B to save effort believing it only
drops a marginal check. See M1.

## Findings

### Major

**M1 (section 16, Q2). The central user question is framed on an inaccurate risk picture.**
The plan presents the account-resolution globals as the residual exposure for the protected secret and
says the main user question turns on them (sections 5, 11, 16). Traced against the lab, the protected
target `lord` lands only through the `given` `guest` account (`scenario.json.erb:628-629, 966`), which
reads no acquisition global, so Option A's reading of client account globals does not touch the
protected secret at all. Conversely, Option B gates `landed` on "page meets threshold AND authored
target AND authored kit" and checks none of `lord`'s required sender/pretext/addressing factors, so a
page that meets threshold plus any authored send to `lord` with the kit would serve `Sofia2026!`
regardless of whether the From is the portal, the message is addressed to her, or the pretext is a
payslip notice. Failure scenario: shown the plan as written, the user reads Option A as carrying a
protected-secret account-global risk and Option B as a modest simplification, and chooses B, which
guts the lab's primary required factor and is weaker than the mandatory rule reads for a protected
secret. Fix: add to Q2 that the protected path uses a `given` account so Option A reads no account
global for it, and state plainly that Option B leaves `senderTrust`/`addressedTo`/`pretextRelevant`
unchecked for `lord`. The recommendation (Option A) does not change; only the framing does.

**M2 (section 14, chunk order). The reader change (chunk 6) is ordered before the legacy migration
(chunk 7), but the migration must precede it.**
Chunk 6 switches `phish_page_evidence_holds?` to the two server stores; chunk 7 adds
`migrate_legacy_phish_evidence!`. The plan claims each chunk "can merge without the next existing"
(section 14). That claim fails for chunk 6: a returning honest save whose `lord` capture sits
`proven: false` (the narrow build-and-sent-but-not-yet-stamped window the plan itself names in section
9.1) has its phish evidence only in the client globals. After chunk 6 the reader consults the empty
server stores (`capture_proofs.rb:441`); without chunk 7 the migration has not populated them, so
`capture_revealable?` returns false and `Sofia2026!` is withheld from a legitimately-playing student
until chunk 7 ships. Migration-before-reader is strictly safe: the migration writes the server stores
while the old reader still reads client globals, which is harmless until the reader flips. Failure
scenario: the integrator merges chunk 6 in one batch and chunk 7 in the next; between the two deploys,
an honest old save in the `proven: false` window cannot open the `sofia_archive` lock. Fix: order the
migration (chunk 7) before the reader change (chunk 6), or bind the two into one merge. The window is
narrow (honest saves that recorded the capture after the evidence arrived are already `proven: true`
and bypass the reader, `capture_proofs.rb:363`), which is why this is Major and not a blocker, but the
plan's independent-merge invariant is wrong for chunk 6 as ordered.

### Minor

**m1 (section 6 / chunk 6, retirement scope). The controller's fingerprint-gating block is not named
as retiring, and part-3 stamp reachability on sync is not stated.**
Section 6 retires `phish_evidence_fingerprint`, `phish_gated_unproven_captures?` and
`each_stored_sent_message`, but the live gating also lives in the controller:
`@phish_fp_before`/`needs_stamp` and the `extra_sent` build in `apply_capture_sync_step`
(`games_controller.rb:844, 914-919, 955-956`). When that block is removed,
`stamp_proven_captures!` is reached on a sync only for an incoming capture or a legacy migration
(`games_controller.rb:920` early-returns otherwise). Part-3-gated captures are still served correctly,
because both readers re-check live through `capture_revealable?` (`game.rb:1458`,
`network_access.rb:1419`), so this is safe, but the plan should name the controller block among what
retires and state that part-3 serving rests on the live read, not on a sync stamp. No failure if
implemented; stated to stop the implementer leaving dead gating or fearing a part-3 regression.

**m2 (section 10, single re-post). The one retry on `page_not_built_yet` has no fallback if it also
races.**
Section 10 re-posts the send once on `page_not_built_yet` + `retryable`. If that single re-post again
reaches the server before the build commits, the send stays `landed: false` with no further retry,
because the offline queue drains only on `online` and on a sync, not on a `retryable` response. In
practice the await-build-response ordering (the primary guarantee) prevents the race, so this is
belt-and-braces only, but the plan should say the `retryable` path sits behind the await and that a
persistent `page_not_built_yet` falls into the same bounded queue drain, so an honest send is never
stranded. No failure on the honest ordering; stated for completeness.

**m3 (section 6 wording). "The part-3 half still stamps on the sync that records that proof" is
imprecise.**
Part-3 proofs arrive through other routes (plant, session, foothold), not through `sync_state`
(`record_planted_item!` etc.), and part-3 captures are served through the live `capture_revealable?`
re-check that reads the server proof lists, regardless of whether an entry was ever stamped. The
sentence reads as if the sync records the part-3 proof. Tighten it so the implementer does not wire a
sync-time part-3 stamp that is not needed.

## Checklist items (traced)

- **8-chunk order (section 14): sound except for M2.** Chunks 1-5 each leave the reader on the old
  client evidence, so the game plays as today and the forge is no worse than today; chunk 6 closes it.
  The one defect is the reader-before-migration order (M2). "Reader change last" is otherwise honoured
  among the behaviour chunks, with validator (chunk 8) correctly trailing.
- **Send retry (section 10): holds.** Awaits the build POST's response before the send POST
  (`mail-composer.js:685` confirms the build precedes the attach); the player is never refused (an
  unbuildable page is recorded `landed: false`, not an error); the offline queue is bounded, keyed by
  `pageId` or `targetId/kitId`, idempotent (first-wins), drains on `online` and on a sync, builds
  before sends. One residual noted in m2.
- **Migration predicate, writer, ordering (section 9.1): correct.** `legacy_phish_evidence?` is
  player_state-only (cheap), added to the `bootstrap_state_needs_write?` OR
  (`game.rb:831-834`); `migrate_legacy_phish_evidence!` ordered before `stamp_proven_captures!` in
  `run_bootstrap_writers!` (`game.rb:839-854`) so the stamp in the same locked pass picks up the
  migrated evidence; `phishEvidenceMigrated` guards it to run once. Feasible as written.
- **Retiring `extra_sent` and the fingerprint: complete, no orphan callers.** The only callers outside
  `capture_proofs.rb` are the sync step (`games_controller.rb:840-956`) and the two named test files.
  Both live readers, `capture_secrets_for_client` (`game.rb:1458`) and
  `NetworkAccess#account_capture_usernames` (`network_access.rb:1419`), already call
  `capture_revealable?` with no `extra_sent`, so dropping the parameter does not touch them. The chain
  the plan drops (`phish_page_evidence_holds?`, `capture_evidence_holds?`, `capture_revealable?`,
  `stamp_proven_captures!`) matches the code. m1 adds the controller block the plan should also name.
- **Serialisation claim (section 7): holds.** The bootstrap `scenario` action builds an explicit
  allowlist (`filtered['...'] = ...`, `games_controller.rb:395-417`), not a whole-state dump, and a
  grep of the controller finds no reference to `seLandingPages`/`sePhishSends`, so the two new keys
  cannot ride back out; the sync answer builds from `captures_for_client`
  (`add_capture_answer_fields`), not the whole state. `ACCESS_STATE_DEFAULTS` (`game.rb:1773`) does not
  yet hold the two keys (chunk 1 adds them) and `SERVER_OWNED_GLOBAL_NAMES` is `%w[se_captures]`
  (`game.rb:1798`), matching the plan.
- **Parity fixtures include the real honest solve: present.** Section 5 builds one fixture from the
  lab's authored accounts config, the globals an honest player holds at the send, the convincing-page
  choices and the message that lands `lord`, asserting `landed: true` on both sides. Given the
  protected path uses the `given` `guest` account, that fixture's globals are minimal, which is correct.
- **Payload size (section 8): holds.** Both stores are server-written only, bounded by scenario
  authorship (landing pages; phish targets x link kits), keyed first-wins, never in the
  client-to-server body nor in any client-bound serialisation. Net new synced growth is zero, matching
  how `plantedItems`/`footholds` live in `ACCESS_STATE_DEFAULTS`. The two route bodies are one-shot,
  like `network/plant`.
- **Live browser proof on the real game path: present.** Section 15 drives `lab_social_engineering`
  to the phish on the assigned port: a tampered run (forged `se_landing_pages`/`mailState`, no routes,
  secret withheld), an honest run (build and send through the minigame, secret served, `sofia_archive`
  opens), and a throttled/offline run. This is a real-path proof, not a helper-only test.

## What was checked

- Read `capture_proofs.rb` end to end and confirmed the current reader (`phish_page_evidence_holds?`,
  `:441-462`) reads client globals (`se_landing_pages`, `mailState`, `extra_sent`), that the forge is
  real, and that `Sofia2026!` is the `requires` of the `sofia_archive` password lock.
- Traced the account path: `resolveAccounts`/`domainOf` (`mail-data.js:5-56`), the two lab accounts
  (`scenario.json.erb:626-645`), `lord`'s required factors (`:966`), and confirmed `guest` (`given`,
  `spoofsFrom: true`) is the only account that can satisfy `senderTrust` for `lord`, so the protected
  path reads no acquisition global. Confirmed `acct_` globals are written only by the client
  create-account minigame (`mail-client-minigame.js:567-575`), and that `burned` is absent from the
  judge path (`phish-rules.js`, `mail-bridge.js`).
- Confirmed the `performSend` ctx assembly (`mail-bridge.js:381-384`) matches section 5, and the
  composer build-before-link gate (`mail-composer.js:685`).
- Read `bootstrap_state_needs_write?` / `run_bootstrap_writers!` (`game.rb:831-854`),
  `ACCESS_STATE_DEFAULTS` / `SERVER_OWNED_GLOBAL_NAMES` (`:1773-1798`), the sync step
  (`games_controller.rb:820-957`) and the bootstrap allowlist (`:395-417`).
- Grepped every caller of `extra_sent`, `phish_evidence_fingerprint`,
  `phish_gated_unproven_captures?`, `each_stored_sent_message`, `capture_revealable?` and
  `capture_evidence_holds?` across `app/` and `test/`.
