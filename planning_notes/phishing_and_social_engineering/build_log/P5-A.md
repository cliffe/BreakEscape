# P5-A — landing-page builder model (opus48)

Packet P5-A of Phase 5 (IMPLEMENTATION_PLAN.md §4 and "Phase 5 detail"). Builds the pure model
`landing-page-model.js` (07 N2, N6b model half, N10, N11) and its two tests. No DOM, no globals,
imports nothing. Routed to opus48 per SE_BUILD_LOG.md "User instructions" (2026-10-21).

## Files changed (my scope only)

- `public/break_escape/js/minigames/landing-page-builder/landing-page-model.js` (new)
- `test/js/social-landing-page-model.test.mjs` (new) — N2 fixture cases
- `test/js/social-landing-page-guard.test.mjs` (new) — N6b model half (three fixtures + scheme/path)
- `planning_notes/phishing_and_social_engineering/IMPLEMENTATION_PLAN.md` — §4 model column of the
  eight P5 rows (P5-A..P5-T) changed from `Haiku (high effort)` to `opus48 (high effort)`; P5-R stays
  Opus. Only that table cell changed (8 insertions / 8 deletions); the Phase 5 prose, D7 and
  "Playtest models" still say Haiku and were left for the orchestrator.

Not mine (concurrent P5-B, left untouched): `landing-page-render.js` and
`test/js/social-landing-page-render.test.mjs`.

## Exports

`scorePage(pageDef, choices, target)`, `guardDomain(pageDef, choices)`, `buildRecord(input)`,
`applyScore(existing, fresh)`, `setBuilt(record, built=true)`, `linkInfoFor(record, pageDef, kitId)`,
`describeVictimOutcome(record, target, landed)`, `betterVictim(existing, next)`,
`captureGranted(before, after)`; constants `FACTOR_ORDER`, `CHOICE_KEYS`, `RECORD_KEYS`, `TELL_IDS`,
`EXAMPLE_SUFFIX`, `DEFAULT_POINTS`, `DEFAULT_STRINGS`.

## Tests

`bundle exec node --test test/js/social-landing-page-model.test.mjs test/js/social-landing-page-guard.test.mjs`
→ 20 pass, 0 fail. Covers: the 07 §4 worked example (attempt 1 = 34 with the low verdict and the
careful-reader gate line; attempt 2 = 87 with the high verdict; d_letter perfect = 75 with the
second-row verdict plus gate line; d_vv perfect = 100); the brand gate; form scoring (extra
non-sensitive = 5, and = 4 when a real field is also missing); `linkInfoFor` missing-until-built and
the browserDomain-only-when-present rule; the §5 victim-outcome table; `betterVictim` keeping a
submitted entry; `captureGranted` first-submitted-only; `applyScore` preserving `victim` and
`tellsFound` and setting `built: false`; closed-key emission with junk keys dropped (and tellsFound
ids outside the nine dropped); the no-`serial|export|download` identifier test; and the N6b guard
(off-menu blocked, non-`.example` host blocked, real menu domain scored, scheme/path stripped).

## Decisions / things to flag for P5-R and sibling packets

- **Signature.** 07 §4 writes `scorePage(spec, pretext, target)` loosely. Implemented as
  `scorePage(pageDef, choices, target)`; the pretext is read from `pageDef.pretext`. `target` is the
  04 target id string, or `{ id, firstName }` to fill `{firstName}` in the strings. Fully pure and
  testable; no behaviour lost.
- **Wording variants.** 07 §5's sample only carries a `match` boolean, but §4 needs three bands
  (match 10 / generic 5 / slips 0). I read `match === true` → full, an authored `slips: true` → 0,
  otherwise → generic half. **P5-C/P5-G: the fixture's slips wording needs `slips: true`**, and the
  lint should require it (or an explicit band marker) so the generic/slips distinction is authored,
  not guessed.
- **Partial point values.** Full values come from `pageDef.points` (overridable). The fixed partials
  from the doc tables are: purpose plain sign-in and form extra-non-sensitive = half the full value;
  logo blurry/stretched = 4 and form missing-real = 4 (doc-fixed constants, not half). The worked
  examples (34, 87, 75, 100) all reproduce exactly with the defaults.
- **Gate activation.** Careful-reader gate is active when `targets[id].minDomainTier` is a number > 0;
  brand gate is active unless `targets[id].brandGate === false` (awareness turns it off, 07 §7). The
  lab's lord entry has neither field beyond `linkThreshold`/`minDomainTier`, so the brand gate defaults
  on — matching 07 §7's student column.
- **`meetsThreshold`.** Computed as `credibility >= linkThreshold && gatesPassed` (00 §11a).
- **`setBuilt` is additive**, not in the P5-A export list, but the attach path (P5-D) and persistence
  (P5-F) need to flip `built` while keeping the closed-key set; it routes through `buildRecord` so the
  guarantee holds. `buildSuspectPage` (N5) was deliberately **left out** — it belongs to P5-E.
- **N6b guard test, renderer half.** The `-guard` test (owned by P5-A per §4) covers the model half:
  `scorePage` returns `{ blocked: true }` and `guardDomain` reports `off-menu` / `bad-suffix`. The
  renderer half (the drawn "blocked" placeholder) is P5-B's `social-landing-page-render` test; P5-B's
  `landing-page-render.js` can import `guardDomain` from this module for a single source of the rule.
- `describeVictimOutcome`'s `target` argument is accepted but unused (the outcome is a function of the
  record's `meetsThreshold` and `landed`); kept for the 00 §11a / 07 §5 signature.

## Not done / out of scope

- The whole social glob and Rails suite were not run from here: sibling Phase 5 packets (P5-B render,
  P5-C lint) are editing the tree concurrently, so a full-glob run would mix in their in-flight state.
  My two new test files pass in isolation and match the `social-*.test.mjs` glob that P0-K's CI job runs.
