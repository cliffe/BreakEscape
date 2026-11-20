# Phish evidence server plan, review R1

Reviewer round 1 of `docs/achitechture/PHISH_EVIDENCE_SERVER_PLAN.md`. Every claim below was
checked against the code at the worktree tip (`28f681877`, base `fc4b4d8a5`), not against the
plan's own citations. Review only; no code or plan edits were made.

## Verdict

**REVISE.**

The design direction is sound: moving the two gate facts (page built and convincing, email landed)
into server-owned `player_state` stores written by two gated routes, and deriving `victim.submitted`
from them, does close the forge the plan describes, and the forge is real (traced below). But the
plan's account of *what the server must recompute to decide `landed`* is incomplete in a way that,
if built as written, refuses the honest solve of the one protected scenario. That is a blocker. The
plan also lacks the build-chunk sequence it twice refers to, and its network-delay retry keys off a
signal that does not carry the fact it waits on.

## Counts

| Severity | Count |
|---|---|
| Blocker | 1 |
| Major | 3 |
| Minor | 5 |

## The forge is real (confirmed)

`phish_page_evidence_holds?` (`app/models/break_escape/capture_proofs.rb:441-462`) reads
`player_state.dig('globalVariables','se_landing_pages')` for `built` / `meetsThreshold` /
`victim.submitted`, and the stored `mailState` (plus `extra_sent`) for a landed sent message.
`se_landing_pages` is merged from the client body through `merge_global_variables!`
(`game.rb:332-337`) and is not in `SERVER_OWNED_GLOBAL_NAMES` (`game.rb:1798`, only `se_captures`);
`mailState` is merged through `merge_mail_state!` (`game.rb:4828`). So a tampered client can write
both. The lab's protected value is reachable this way: `Sofia2026!` is the `requires` of the
`sofia_archive` password lock (`scenarios/lab_social_engineering/scenario.json.erb:217-218`) and is
the landing page capture secret (`:1297`), served under `captures.revealSecret: true` (`:382`). The
plan's threat model holds.

## Findings

### Blocker

**B1 (item 1). The `landed` recompute omits the sending-account resolution it depends on, and the
one protected scenario's honest solve fails without it.**
`evaluateMessage` (`public/break_escape/js/systems/phish-rules.js:486`) is not a function of the
target definition and the message alone. It reads `ctx.accounts`, and the sender factors are decided
from the resolved sending account:
- `landed = open.opened && failedRequired.length === 0` (`phish-rules.js:549`).
- `lord`'s `requiredFactors` are `["senderTrust","addressedTo","pretextRelevant","linkCredible"]`
  (`scenarios/lab_social_engineering/scenario.json.erb:967`), so `senderTrust` gates the send.
- `senderTrust` is `judgeSender(target, header)` (`phish-rules.js:491,246`) where `header =
  resolveHeader(message, account)` (`:223`) and `account = findAccount(ctx, message.fromAccount)`
  (`:489,156`). `findAccount` returns a stub `{ spoofsFrom:false, person:null, address:null }` when
  the account is not in `ctx.accounts` (`:157-159`). With a stub, `resolveHeader` forces the From to
  the account's own (null) identity (`:231-234`), so `judgeSender` returns fail, `senderTrust`
  fails, `landed` is false, `victim.submitted` is false, and the secret is withheld.
- `ctx.accounts` is `resolveAccounts(config, accountIds, globals)`
  (`public/break_escape/js/minigames/mail-client/mail-data.js:24`, called at
  `mail-client-minigame.js:125`), built from `social.mailClient.accounts`
  (`lab_social_engineering/scenario.json.erb:626-642`) plus gameplay globals: a `created` account's
  address comes from its `createMenu` entry chosen by `acct_<id>_choice`, gated on `acct_<id>`
  (`mail-data.js:35-41`); `unlockedBy` and `burned_<id>` also read globals (`:32,52`).

So to recompute `landed` for the lab, the server must port `resolveAccounts` and ingest the
mail-client config and those globals, then resolve `message.fromAccount` to an account record. The
plan's section 5 lists the judge's inputs as "the target's authored `senderAuth`, `interests`,
`urgency` and factor modes, and the composed message's bounded fields" and names only
`evaluateMessage` plus seven judge helpers; it never mentions `ctx.accounts`, `resolveAccounts`,
`social.mailClient`, or the `acct_*` / `burned_*` / `unlockedBy` globals. Built to that spec, the
`PhishJudge` port refuses the honest solve, which the user requirement forbids ("a legitimate player
must never be refused"). This is the plan's central "pure function of authored data plus closed
choices" premise failing on the one scenario the mandatory rule binds. The inputs are all
server-observable (config is loadable, the globals round-trip in `player_state`), so the design is
recoverable, but the plan must add the account-resolution port, name its global inputs, and base its
parity fixtures and size estimate on it.

### Major

**M1 (item 1, sizing and drift). The port is larger than section 5's "688 lines plus a handful of
helpers", and parity fixtures over `evaluateMessage` alone will not prevent drift.**
Beyond `resolveAccounts` (B1), `performSend` applies `applyFactorBias(target, globals)`
(`mail-bridge.js:381,135`) before judging, which promotes or demotes required factors from boolean
globals (`boostIfGlobal` / `strictIfGlobal`). `lab_social_engineering` authors neither (grep: no
`boostIfGlobal` / `strictIfGlobal` in the lab), so this is a no-op for the protected scenario, but
the plan's recommended Q1 Option A ("recompute universally") makes the awareness scenarios' `landed`
depend on it, so a universal port must include it or compute the wrong verdict there (harmless, since
no secret, but then the "one code path, server-truthful report" rationale for Option A is undercut).
A parity fixture asserted only against `evaluateMessage` (section 5) leaves `resolveAccounts` and
`applyFactorBias` unguarded, which are exactly the pieces most likely to drift when the mail client
changes. The fixtures must drive the whole server input assembly (account resolution plus factor
bias plus the judge), not the judge in isolation.

**M2 (item 7). The plan refers to a build-chunk sequence that does not exist.**
Section 5 says "The chunks (section 14) build the two ports as separable pieces so the decision can
land on Q2 without reshaping the rest", and section 2's closing sentence makes the same promise, but
section 14 is "Tests and live proofs" and contains no chunk breakdown or ordering. There is no staged
sequence anywhere in the plan showing the order of work (routes, stores, ports, reader change,
migration, retiring the fingerprint path) and that each step leaves the game runnable and committable.
The brief asks this review to judge "whether the chunk order is sound, whether each chunk leaves the
game working"; the plan gives nothing to judge. A phased order is needed, with the reader change
(section 3.4) necessarily landing only after both stores and both ports exist, or the gate withholds
the secret from honest players in the interim.

**M3 (item 4). The send retry waits on a signal that does not carry the build fact, so "always
credited" is not guaranteed.**
Section 10 handles a send route arriving before its build route by answering `retryable` and having
the client "await one `window.stateSync.sync()` ... and re-post the send once; on the re-post the
build is recorded and the send lands." But `seLandingPages` is server-written only and never in the
sync answer (sections 3.1, 7), so a `sync()` neither carries the build confirmation to the client nor
guarantees the build route's POST has completed on the server. The build and send are two independent
POSTs; the honest ordering is to await the build route's own response before firing the send route
(the composer already attaches a link only after the page is built client-side,
`mail-composer.js:685`, so the build POST can be awaited there). As written, a single retry gated on
an unrelated sync can still find the page not yet recorded and then give up, leaving an honest send at
`landed: false`. The "must never be refused" requirement is met (it is not a refusal), but "always
credited" is not, which is the requirement that matters here.

### Minor

**m1 (item 2). Section 12 mislabels the lab and leans on a discriminator the lab shares; the
conclusion still holds.**
The section 12 table calls `lab_social_engineering` "SE lab (attacks on)", but the lab sets
`"disableAttacks": true` (`scenarios/lab_social_engineering/scenario.json.erb:8`), the same flag the
plan uses in sections 11 and 12 to argue the awareness scenarios carry no protected value. So
`disableAttacks` does not separate the lab from the awareness set. The real discriminator is the
landing `capture.secret` scan, and that does hold: of the four scenarios that author `landingPages`
(`lab_social_engineering`, `ca05_signin_pages`, `ca10_downloads_and_fake_checks`,
`test_social_slice`), only the lab's landing page carries a `secret` (`:1297`); the others have none,
and a scenario with no `landingPages` has no page to carry one, and the phished secret only ever comes
from `pageDef.capture.secret` (`mail-bridge.js:436`). The plan's claim that the lab is the only
protected case is correct; its stated reasoning (`disableAttacks` + no secret) is not, because the
first conjunct is true of the lab too.

**m2 (item 3). The migration's soft-lock framing overstates the risk, and its trigger can fail to
fire if folded into the existing bootstrap.**
An honest mid-lab old save records the capture `proven: true` at the moment it is recorded: the sync
merges `globalVariables` and `mailState` (`games_controller.rb:841-844`) before
`apply_capture_sync_step` (`:849`), so `record_capture!` computes `proven =
capture_evidence_holds?(...)` (`capture_proofs.rb:169`) over the already-merged evidence, and
`capture_revealable?` serves any `proven: true` entry without reading the phish stores at all
(`:361-366`). So the common honest case needs no migration to stay unlocked; the real exposure is the
narrow `proven: false` window, which the plan treats as the general case. Separately, if
`migrate_legacy_phish_evidence!` is folded into `run_bootstrap_writers!` (`game.rb:839-854`) next to
`migrate_legacy_captures!`, it will not run for exactly the save that needs it: a save with legacy
`globalVariables.se_landing_pages` but already-migrated captures and empty new stores trips neither
`legacy_captures?` nor `stampable_captures?` (which, post reader change, reads the empty new stores),
so `bootstrap_state_needs_write?` (`:831-834`) stays false and the lock is never taken. The plan's own
"run on show, guarded by `phishEvidenceMigrated`" (section 9.1) avoids this only if implemented as a
genuinely separate guarded step; the plan should say so explicitly, and should stamp the capture after
migrating so the `proven: false` edge is actually closed.

**m3 (item 5). Retiring the fingerprint / phishGated path touches two existing tests and leaves dead
helpers; the plan's test list does not cover the removal.**
`phish_evidence_fingerprint` and `phish_gated_unproven_captures?` are read only by the sync step
(`games_controller.rb:840,914`) and by `record_capture!` (`capture_proofs.rb:174,517`); no JS reads
them. Retiring them for the phish path (section 6) also makes `each_stored_sent_message`,
`phish_evidence_page_for`'s use via the old reader, and the `extra_sent` plumbing dead for this path.
Two Rails test files assert on the retiring machinery,
`test/models/break_escape/capture_record_test.rb` and
`test/controllers/break_escape/capture_proofs_test.rb`; section 14 lists new tests but says nothing
about updating or removing these, and they will fail or go stale. Name them in the plan.

**m4 (item 1). The `PhishScore` port must mirror `scorePage`'s blocked branch.**
`scorePage` returns `{ blocked: true }` with no `credibility` / `meetsThreshold` when the chosen
domain is off the authored menu or its host does not end `.example`
(`landing-page-model.js:468-469,234-243`). Section 4 says the port returns only `{ credibility,
gates_passed, meets_threshold }` and does not mention the blocked case. If the build route's
field-by-field menu validation (section 3.2 step 3) fully subsumes the guard (on-menu `domainId`,
and every authored domain ends `.example`), the branch cannot fire for a stored build, but the plan
should state that dependency; otherwise the port and the route disagree on a blocked page.

**m5 (item 3, wiring). The reader pseudocode and section 6 prose disagree on `extra_sent`.**
Section 3.4's pseudocode signature is `phish_page_evidence_holds?(page_id, target_id, scenario)`,
dropping `extra_sent`, while section 6 says "The `extra_sent` parameter and the signature's `scenario`
stay." The current caller passes it (`capture_proofs.rb:306`). The plan should settle whether the
parameter is removed (and the caller updated) or kept and ignored, so the implementer does not leave a
caller passing an argument the method no longer takes.

## Items that pass

- **Item 6 (payload size): pass.** `seLandingPages` is bounded by the scenario's landing pages and
  `sePhishSends` by (phish targets x link kits), keyed first-wins; both are server-written only and
  never in the client-to-server body, matching how `footholds` / `plantedItems` live in
  `ACCESS_STATE_DEFAULTS` (`game.rb:1773`). The two route bodies are one-shot, like
  `network/plant` (`config/routes.rb:50`). Net new synced growth is zero. One check for the
  implementer: confirm neither store is included in any `player_state` serialisation sent to the
  client (the sync answer builds from `captures_for_client`, `capture_proofs.rb:267`, not the whole
  state), so the server-only stores never ride back out.
- **`scorePage` purity (item 1): confirmed.** `scorePage` / `scoreFakeCheck` and their per-factor
  scorers (`landing-page-model.js:266-341,390-449,461-546`) touch no DOM, time, randomness or secret,
  and read only `pageDef`, `choices` and `pageDef.targets[targetId]`; `firstName` feeds only string
  fill, not the score. The page half of the recompute is genuinely a pure function of authored data
  plus the closed `choices` set, as the plan claims. The blocker is the send half.
- **`victim.submitted` derivation (item 1): confirmed.** `describeVictimOutcome`
  (`landing-page-model.js:693-704`) returns `submitted: true` exactly when `meetsThreshold && landed`,
  so the plan's server-side derivation (section 3.4) matches the client rule and the reader can stop
  reading the client's `victim.submitted`.

## On the open questions (item 8)

Q1 to Q4 are reasonable and each carries a diagram, before/after JSON or a recommendation, as the
house style asks. But the most consequential question is missing: **whether to port the mail-client
account resolution and factor bias (B1, M1), and which gameplay globals the server reads to do it.**
That decision sets the true size of the `PhishJudge` work (Q2 is framed as "port `evaluateMessage` or
not", but the real cost is `evaluateMessage` plus `resolveAccounts` plus `applyFactorBias` plus the
mail-client config as a server input), and it should be surfaced to the user with the same before/after
treatment, because it is the difference between a judge that credits the honest lab solve and one that
refuses it. Q2's "Option B" (gate on build threshold plus an authored send, treat message credibility
as a bounded assertion) partly sidesteps B1 but still needs the sender factors resolved if `lord`'s
`senderTrust` is to be checked at all; if Option B drops the sender factors entirely, say so and show
that honest play cannot be blocked and a forge cannot pass.

## Main-moved check (coordinator request)

`git diff --stat fc4b4d8a5 61c033b13` (train 36: slice 6, PC polish and the Lock server) touches
`game.rb`, `games_controller.rb`, `network_access.rb`, PC-session and password minigame JS, and
tests. It does **not** touch any of the plan's load-bearing sources:
`app/models/break_escape/capture_proofs.rb`, `public/break_escape/js/systems/phish-rules.js`,
`public/break_escape/js/minigames/landing-page-builder/landing-page-model.js`, the mail client
(`mail-bridge.js`, `mail-composer.js`, `mail-data.js`), or `scenarios/lab_social_engineering/`. The
`game.rb` changes are in the PC-session area (`signedInPcs`) and leave the plan's hooks intact:
`ACCESS_STATE_DEFAULTS` (`:1773`), `SERVER_OWNED_GLOBAL_NAMES` (`:1798`), `merge_global_variables!`
(`:332`) and `merge_mail_state!` (`:4828`) are untouched by the train-36 diff. So the plan still
holds after main moves; the only consequence of a rebase is that the plan's line citations into
`game.rb` and `games_controller.rb` will drift and must be re-pinned by the implementer. The plan was
not merged.

## What was checked

- Traced `evaluateMessage` and its whole helper chain (`judgeSender`, `deriveSenderAuth`,
  `resolveHeader`, `judgeAddressed`, `judgePretext`, `judgeAttachment`, `judgeExecutable`,
  `judgeLink`, `modeFor`, `urgencyOf`) and its `ctx` assembly in `performSend` / `rejudgeForChecklist`
  (`mail-bridge.js:382,521`), including `applyFactorBias` and `resolveAccounts`.
- Traced `scorePage` / `scoreFakeCheck`, `buildRecord`, `describeVictimOutcome`,
  `linkInfoFor`, `betterVictim`, `captureGranted` in `landing-page-model.js`.
- Read `capture_proofs.rb` end to end: `record_capture!`, `capture_evidence_holds?`,
  `phish_page_evidence_holds?`, `phish_evidence_fingerprint`, `stamp_proven_captures!`,
  `phish_gated_unproven_captures?`, `migrate_legacy_captures!`, and the sync wiring in
  `games_controller.rb:820-979` and the bootstrap in `game.rb:825-854`.
- Scanned every scenario under `scenarios/` for `landingPages` and landing `capture.secret`;
  confirmed `lab_social_engineering` is the only one with a landing secret, and confirmed it is the
  `requires` of the `sofia_archive` password lock.
- Confirmed `game.rb` / `game controller` constants and merge hooks against both `fc4b4d8a5` (the
  worktree) and the train-36 diff to `61c033b13`.
