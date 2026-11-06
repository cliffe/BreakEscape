# P5-C — landing-page validator lint

Packet P5-C (IMPLEMENTATION_PLAN §4): the landing-page lint (`07` N6 and the N7 id check) in
`scripts/validate_social/landing.rb`, the `expectedLink.brandId` cross-check `mail.rb` (P1-M) left,
the punycode encoder, the denylist/confusable fold, and the `scenario-schema.json` entry for
`social.landingPages`. Model Opus 4.8 (builder packets go to opus48, user 2026-10-21). No commit.

## What was built

`scripts/validate_social/landing.rb` had been a stub returning `[]`. It now runs for any scenario
with a `social` key and, in two groups:

**expectedLink cross-check (what P1-M left).** `mail.rb#target_expected_link` is shape-only and
explicitly defers the brand/host checks here. `Landing.expected_link` now:
- lints `phishTargets[].expectedLink.realDomain` with the host-only `.example` / ASCII / denylist
  rule (the lint field list places it under landing, `00` §11 line 1732), reusing
  `Osint.lint_field` → `Osint::HostLint`;
- resolves `expectedLink.brandId` against the landing page(s) that list the target in their
  `targets` map (the page↔target join, `07` §5). "names a real brand" = names a brand that actually
  exists on the serving page. A brandId that resolves to no brand, or a target with an expectedLink
  that no landing page serves, is an error; a `realDomain` that disagrees with the resolved brand's
  `realDomain` is an error (the link tell compares the two).

**landing-page lint (`07` N6, N7), per page:**
- page ids unique; `targets` a non-empty object; every key a `phishTargets` id whose required
  factors include `linkCredible` (via `requiredFactors`, `factors[].mode`, or an `expectedLink`,
  per `00` §2);
- a `page-builder` object's `minigameData.landingPageId` resolves to a page with exactly one
  `targets` key, and that key is a `phishTargets` id (`07` §5, the workstation launch rule);
- each brand: `look` ∈ `generic|parody`; `name` against the denylist only; `realDomain` host lint;
  each `decoyWords` entry must pass the denylist;
- domain menu, in the design's order: the allowlist on raw labels first (contains the brand word,
  edit distance ≤ 2, or an authored decoy), then the ASCII/homograph rule, then the fold-and-match
  denylist, then the `.example` host rule; `browserDomain` ASCII + `.example` + denylist and, for a
  homograph, equal to the punycode encoding of `domain`;
- `linkText` and `capture.address` host lint;
- `wordings` match/slips shape (see the orchestrator addition below);
- every `strings` value non-empty and using only `{firstName} {shown} {real} {linkText}`;
- a non-empty defender string for every domain tier the menu uses (tier 0 included);
- every page `conceptCards` id resolves to a `social.conceptCards` id (N7).

An RFC 3492 punycode encoder (`punycode_host` / `punycode_label`) was added to the validator, as
N6 requires, and checked against `xn--ledgerwll-m0h` (the design's example) and `xn--bcher-kva`.

## Decisions (challenge any)

- **Denylist reconciled, not duplicated.** P2-B's `ValidateSocial::Osint::HostLint` already carries
  the real-brand lists (`LONG`/`SHORT`) the design names ("PayPal, Microsoft, the big UK banks and
  the like") and the digit/symbol fold. I reviewed them against `07` §1/§5 and they cover the
  landing fields, so landing adds no list of its own and reuses `HostLint` wholesale (brand_in,
  field_issue, host_of, brand_words) and `Osint.lint_field` / `Osint.ascii_ok?` (the `ctx.raw`
  member P2-W added). The only landing-local table is `CONFUSABLES` (Cyrillic/Greek → Latin), used
  for the homograph exception and to defold a domain before the denylist, which `HostLint.fold`
  does not do (it strips non-ASCII letters). This catches a Cyrillic-spelled brand in a homograph
  domain; the "exactly one non-ASCII letter" rule stops a whole brand being smuggled that way.
- **`strings` defender-key contract.** `07`/`00` do not pin down the key names for the `strings`
  block, and the P5-A model does not exist yet. The lint fixes the contract: the per-tier step-6
  defender line lives at `strings["domainTier<N>Defender"]` (`tier_defender_key`), and the lint
  requires one for every tier the menu uses. **P5-A/P5-D must author their default strings and the
  lab scenario to these keys.** If P5-A has already chosen different key names, reconcile there —
  this is the one place the lint invents a name the design left open.
- **Wording lint (orchestrator mid-task request).** P5-A's scorer reads full when `match: true`,
  zero when `slips: true`, else generic. So a page's `wordings` must offer exactly one `match: true`
  variant and at least one `slips: true` variant, and no variant may set both. `Landing.wordings_block`
  enforces that. `07` §5's sample `w_slips` had only `match: false`; it now needs `slips: true` to
  score 0 and raise the ✗ wording tell. The clean fixture carries all three variants in that shape.
- **Boundaries with osint.rb.** Card text (host-shaped tokens, brand words) and the
  people/account/contact/provides address fields are `osint.rb`'s and run for every social scenario,
  so landing never re-lints them (no double-flagging under the whole-run). The two card-text N6
  fixtures are exercised in the landing test through `Osint.check`, with a note that card text is
  osint's area.
- **Schema kept permissive.** The `social.landingPages` entry fixes the outer shape only
  (`additionalProperties: true` at the leaves, like the `osint` block), so the lint — not the schema
  — carries the field rules and no shipped scenario is newly rejected.

## Files changed (scope)

- `scripts/validate_social/landing.rb` — the lint (was a stub).
- `scripts/scenario-schema.json` — `social.landingPages` entry.
- `test/js/validator-landing-pages.test.mjs` — new (24 tests, in-process, never the bare CLI).
- `test/js/fixtures/social_landing/lp_clean.json` — new clean fixture; mutated per case in the test.
  The homograph `domain` is written as a `е` escape in the source, so the ASCII source check
  passes; the test re-serialises with `JSON.stringify` (raw char) to exercise the fail path.

Not touched: `osint.rb`, `validate_social.rb` (Landing is already wired into `AREAS`), `mail.rb`.

## Tests and checks

- `bundle exec node --test test/js/validator-landing-pages.test.mjs` → 24 pass, 0 fail. Covers every
  N6 fixture case (raw homograph fails / escape passes; punycode encoder and browserDomain; allowlist
  `paypal.example`; `paypa1` and `pay.pal` folding in `capture.address`; `Q3.pdf` and bare `.co.uk`
  card text pass via osint; a tier with no defender string; `decoyWords: paypal`; a card naming a
  denylisted brand; the `--strict-social` error trigger), plus the expectedLink cross-check, the
  page-builder/targets checks, placeholder/empty strings, concept-card resolution, and the wordings
  lint.
- `bundle exec node --test --test-concurrency=1 test/js/validator-social-*.test.mjs
  test/js/validator-landing-pages.test.mjs` → 100 pass, 0 fail (no regression in osint/mail/triage/
  pretext/framework).
- `bundle exec rubocop scripts/validate_social/landing.rb` → clean (3 layout offences autocorrected).
- **Shipped scenario unchanged.** `ruby scripts/validate_scenario.rb
  scenarios/test_social_slice/scenario.json.erb --strict-social --no-graph --skip-ink` → exit 0, and
  its output is byte-identical to the pre-edit baseline (`diff` empty). `git status --porcelain
  scenarios/` shows no tracked file rewritten by me.
- **`--strict-social` exit code.** A scratch copy of the slice with a broken `landingPages` block
  (bad target key, `paypal.example` domain/realDomain, missing tier-0 defender) exits 1 with
  `✗ --strict-social: 5 social lint error(s)`. The clean slice exits 0.

## Left undone / for the orchestrator

- The `strings` defender-key scheme (`domainTier<N>Defender`) is a contract this lint invents; P5-A/
  P5-D must align their default strings and the lab scenario to it, or the orchestrator reconciles.
- Card text and the osint-owned address fields are deliberately not re-linted here (osint owns them);
  the landing test verifies the two card-text N6 cases through `Osint.check`.
- CI wiring (the N6 job, `jsdom`, lockfile) is P0-K / out of this packet's scope and untouched.
