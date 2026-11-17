# Phish evidence server hardening: build review, round 1 (chunks 1 to 3)

Range reviewed: `2ba7c2b80..e51cc5b8e` on `build/hard-phish-plan`.
Spec: `docs/achitechture/PHISH_EVIDENCE_SERVER_PLAN.md` sections 3, 4, 7, 8, 10, 14, 15.
Build log: `docs/achitechture/PHISH_EVIDENCE_SERVER_BUILD_LOG.md`.

## Verdict: SHIP CHUNKS 1-3

The three chunks do what the plan's build order asks and no more: the two server-owned stores
exist, the page scorer is ported with a line-accurate parity harness, and Route 1 records a
server-verified build. The gate reader is untouched, so the old client-evidence path still drives
the reveal and nothing honest is withheld or newly exposed. No blocker or major issue found.

Counts: 0 Blocker, 0 Major, 4 Minor.

## Findings

- **Minor 1 (fixtures do not load the real lab page).** `test/fixtures/files/phish_score_parity/fixtures.json`.
  The `signin` fixture is a hand-authored, scoring-equivalent copy of the lab's `payroll_login`,
  not the page loaded from `scenarios/lab_social_engineering/scenario.json.erb`. Failure scenario:
  an author later changes the real lab page's `linkThreshold`, a domain `tier` or the `points`
  table; the JS and Ruby scorers could then diverge on the real page while the parity test, which
  scores the frozen synthetic page, still passes. Mitigation already in place: full per-factor band
  coverage catches scorer-logic drift, and the live proof scored the real lab game at credibility
  87 (the fixture's convincing case also scores 87). The real-lab honest coverage the brief asks
  about is the section-5 `PhishJudge` honest-solve fixture, due in chunk 4. Recommend either adding
  a case built from the real `payroll_login` page, or noting in the plan that chunk 4's honest-solve
  fixture carries the real-lab guarantee.

- **Minor 2 (no route test for a fakeCheck build).** `test/controllers/break_escape/se_landing_page_build_test.rb`.
  The controller test exercises only the sign-in page. The `valid_check_choices?` branch and the
  fakeCheck recompute-and-store path through `POST se/landing_page` are covered only by the pure
  parity test, not end to end. `ca10_downloads_and_fake_checks` ships a `pageType: 'fakeCheck'`
  page, so this path is live. Failure scenario: a regression in the fakeCheck branch of
  `valid_build_choices?` or `normalise_build_choices` would not be caught by any route test. Add one
  fakeCheck build case to the controller test.

- **Minor 3 (validation helpers are public).** `app/models/break_escape/capture_proofs.rb:241-370`.
  `record_landing_page_build!` and `build_landing_page!` are legitimately public (the route calls
  them), but every helper added with them (`valid_landing_target?`, `valid_build_choices?`,
  `valid_purpose_choice?`, `valid_check_choices?`, `landing_menu_ids`, `choice_on_menu_or_nil?`,
  `valid_choice_id?`, `valid_build_padlock?`, `valid_build_fields?`, `normalise_build_choices`,
  `recompute_page_verdict?`) sits above the `private` marker at line 597, so all are public on
  `Game`. Cosmetic, no behaviour risk; move the helpers below `private` for a smaller public surface.

- **Minor 4 (`to_number` does not mirror `Number()` for non-numeric input).** `lib/break_escape/phish_score.rb:273-287`.
  `Number(true)` is 1 and `Number([])` is 0 in JS; the Ruby `to_number` returns nil for a boolean
  or array, so `linkThreshold`/`minDomainTier` read as "no threshold" there. No live divergence,
  because both fields are always authored as numbers; this is defensive-only and fine to leave.

### Observations (not defects for chunk 3)

- Attaching a blocked page through "Attach anyway" (an off-menu or non-`.example` domain) makes the
  client POST a build the route refuses with 422. The POST is fire-and-forget, so the 422 is
  swallowed; the gate does not read the store in chunk 3 and a blocked page is never convincing, so
  honest completion is unaffected. Re-check when chunk 5 wires the send await against build state.
- An offline or failed build POST is not retried in chunk 3; the bounded re-send queue is chunk 5
  (plan section 10). Harmless now, since nothing reads the store. The chunk-5 await seam
  (`this._buildPost`) is already in place and resolves to the `Response` (or null), which is enough
  for chunk 5 to await a committed build, because `build_landing_page!` saves before responding.

## What was checked

**PhishScore parity, line by line against `scorePage`/`scoreFakeCheck` (`landing-page-model.js`).**
Traced every factor scorer (`brand`, `purpose`, `domain`, `logo`, `wording`, `form`, `padlock`),
the gates block, the fake-check scorer, the point tables, `guardDomain`/`hostOf`/`findDomainOption`,
`half`, `points` and the `Number()`/`Number.isFinite` behaviour. The port matches, including:
- the gate predicates (`brandGate !== false`, `minDomainTier` finite and positive) and the
  `meetsThreshold = credibility >= threshold && gatesPassed` rule;
- the four `scoreForm` bands in the same order (sensitive-field zero, missing-field 4, extra-field
  half, exact-match full);
- the blocked branch: `score` returns `{ credibility: nil, gates_passed: false, meets_threshold:
  false, blocked: true }`, and the route treats blocked as not convincing; the JS returns
  `{ blocked: true }` with no credibility, which both parity sides assert (`undefined`/`nil`).
`half` differs from `Math.round` only for negative half-values, and points are never negative, so
there is no divergence. The convincing case recomputes by hand to 87 (15+10+22+10+10+10+10), matching
the fixture and the live proof.

**Parity fixtures breadth.** The 14 cases cover each factor's full/partial/zero band, both gates,
the brand-gate-off awareness case, the off-menu and bad-suffix blocked cases and three fake-check
cases. Adequate for JS-versus-Ruby scorer-drift detection. They do not include the real lab page
(Minor 1). Node side: 14 pass. Ruby side: 16 runs, 59 assertions, pass.

**The 899a74acc decision (logo and purpose as fixed closed sets).** Verified true for every scenario
that authors a landing page. `grep -rl 'landingPages' scenarios/*/scenario.json.erb` gives four:
`lab_social_engineering`, `test_social_slice`, `ca05_signin_pages`, `ca10_downloads_and_fake_checks`.
The builder sources logo options from a constant `DEFAULT_LOGOS` (`crisp`/`blurry`/`stretched`/
`none`), which is exactly `LANDING_LOGO_IDS`; no scenario authors a `logos` menu. The builder sources
purpose options from `pageDef.purposes`, which the validator checks against (the `signin`/`expired`/
`payslip` fallback fires only when a page authors no purposes, and all four do, so the fallback is
inert). `ca05`'s `reset` purpose and the lab's `payslip` both pass because they are on the page's own
menu. No honest build in any of the four scenarios is refused: brand, wording and fields are each
validated against menus the builder reads from the same page, domain resolves for any convincing
build, and padlock is a boolean.

**The build route gate.** The body carries `pageId`, `targetId` and `choices` only; the controller
builds `input` from those three, so a body-level score is structurally dropped, not merely ignored.
The server recomputes the verdict with `PhishScore` over data it owns, validates each choice against
authored menus, and refuses off-menu values. A forged body cannot store a verdict it should not: a
mismatched target yields an empty per-target config and `meetsThreshold: false`; an unauthored page,
target, wording, field or domain is refused; an oversized id is refused with no exception. An honest
body is never refused, and a re-send is last-score-wins (idempotent replace, never a new row), so a
resend always succeeds. CSRF: `protect_from_forgery with: :exception` is inherited from
`ApplicationController` and not skipped, so the route enforces the token the client sends as
`X-CSRF-Token`. Authorisation: `authorize @game` with `GamePolicy#se_landing_page?` delegating to
`show?`, and `:se_landing_page` is in the `set_game` before_action list, matching every other game
route.

**The client POST on `attach()`.** `this._buildPost = this._recordBuildOnServer()` runs after the
local `writeGlobal`, is guarded (returns null with no `window`/`fetch`/config, so headless tests are
unaffected), and `.catch(() => null)` swallows a network failure, so a failed POST never stops the
player attaching. The promise is retained for the chunk-5 await; because `build_landing_page!` saves
before responding, awaiting that promise is enough for chunk 5 to know the build committed. Offline
retry is correctly deferred to chunk 5 (observation above).

**Stores off the client.** `grep -rn 'seLandingPages|sePhishSends' app/ lib/ config/` finds them only
in `capture_proofs.rb` and the `game.rb` default. They are not globals and not merged sections, so
`sync_state` never reads them from the body; they are not in the bootstrap serialisation allowlist
and the sync answer builds from `captures_for_client`, so neither rides back out. Confirmed no
reference in the controller's `scenario` action or sync path.

**Payload size.** Both stores are written only by the route, never synced in either direction, and
bounded by scenario authorship (one landing page in the lab). Zero per-sync growth, nothing re-sent.

**Ruby 2.7 keyword arguments.** `record_landing_page_build!(input, scenario:)` and the positional
calls to `PhishScore.score` and `recompute_page_verdict?` carry no hash/kwarg ambiguity.

**JS test harness copy lists.** `landing-page-model.js` is unchanged in this range and imports
nothing; the node parity test copies it to a temp dir and dynamic-imports it, self-contained. The
client POST is a direct guarded `fetch`, not a new static import, so no engine JS module gained an
import and no harness copy list needs updating.

**No gate behaviour changed yet.** `phish_page_evidence_holds?` is untouched (diff shows additions
only), so it still reads the client `se_landing_pages`/`mailState`; the old evidence path drives the
reveal and the forge is no worse than today, as the plan's chunk order requires.

## Tests run

- `node --test test/js/social-phish-score-parity.test.mjs`: 14 pass.
- `bin/rails test` (RBENV_VERSION=2.7.8) on `phish_score_parity_test.rb`,
  `se_landing_page_build_test.rb`, `access_model_rules_test.rb`: 30 runs, 137 assertions,
  0 failures, 0 errors.

## Ruling on the build log's drift items

1. Node parity as a new dedicated file rather than folded into `social-landing-page-model`:
   accepted, it satisfies the intent and keeps the existing model test unchanged.
2. The route requires `domainId` present and resolving, not just "not off-menu": accepted, it
   matches plan section 4's intent that a stored build can never be the blocked case, and an honest
   attach always carries a resolving domain.
3. Re-stamping dependent captures deferred to chunk 7: accepted, it matches the build order (chunk 3
   stores only, nothing reads for the gate).
4. Plumbing the plan did not spell out (`set_game` coverage, the `GamePolicy` method,
   `CaptureModel.landing_page`): accepted, each is correct and necessary and follows the existing
   route conventions.
5. The 899a74acc follow-up (logo fixed set, purpose authored-with-fallback): accepted and verified
   against all four landing-page scenarios and the builder's option sources; no honest build is
   refused.
