# Phish evidence chunk 8 review, round 2

Range reviewed: `404359580..acf5db894`, weight on `c5c574d1d` (the R1 fold-in:
buildability, kit reachability, Array-only landing pages, widened NPC-capture warning).
Files in range: `scripts/validate_scenario.rb`, `test/js/validator-phish-evidence-secret.test.mjs`,
`docs/achitechture/PHISH_EVIDENCE_SERVER_BUILD_LOG.md`, this review's predecessor. Review only, no
code edits.

Spec: `PHISH_EVIDENCE_SERVER_PLAN.md` section 13 (plus sections 4, 5, 11); build log
`PHISH_EVIDENCE_SERVER_BUILD_LOG.md` Chunk 8 section.

## Verdict: SHIP

0 Blocker, 0 Major, 4 Minor. The R1 Major (section 13 bullet 3, page buildability) is now
implemented and, in the direction that matters, correct: the buildability search never under-reports,
so it can never error a page an honest player can pass, which means it never blocks valid content. The
two R1 minors (Array-only serve path, widened hard-access warning) are folded in and faithful to the
server. All four remaining findings are safe-direction edges: each either withholds a secret rather
than over-serving, or touches only non-idiomatic authoring that no shipped scenario uses, or is test
coverage and doc placement. None blocks an honest student and none lets the server over-serve.

## Counts

`LANG=C.UTF-8 /usr/bin/ruby3.2 scripts/validate_scenario.rb <f> --no-graph`, re-run this pass:

| Scenario | errors | warnings | phish-rule hits |
|---|---|---|---|
| lab_social_engineering | 0 | 8 | 0 |
| test_social_slice | 0 | 6 | 0 |
| ca05_signin_pages | 0 | 3 | 0 |
| ca10_downloads_and_fake_checks | 0 | 2 | 0 |

Identical to R1 and to the build log's table. `git status` clean bar `node_modules`; no
`dungeon_graph.*` rewrites (run with `--no-graph`). Node test
`test/js/validator-phish-evidence-secret.test.mjs`: 10 subtests, all pass.

## What I traced

### (a) Buildability: the completeness claim is true, the error cannot block valid content

`landing_page_buildable?` (`scripts/validate_scenario.rb:6759`) fixes logo, padlock and form at their
per-factor maxima and enumerates every `(brand, domain)` pair with every purpose and wording. I
confirmed against the shared scorer (`lib/break_escape/phish_score.rb`, a line-for-line port of
`landing-page-model.js`) that the three fixed factors are each independent of every other choice and
of both gates: `score_logo` gives full points only for `crisp` (`:122`), `score_padlock` only for
`true` (`:156`), and `score_form` gives full points for exactly the chosen brand's `realFields`
(rule 4, `:137-153`); none feeds the brand gate or the domain-tier gate (`:73-80`). Credibility is a
monotone sum (`:71`), so maxing those three can only raise credibility and never changes a gate.
Because the search enumerates a superset of every choice an honest player can make (I checked the
runtime menus: purpose radios from `pageDef.purposes` at
`landing-page-builder-minigame.js:712`, wording from `pageDef.wordings` at `:748`, and non-editable
rows preset to their correct maxima via `_presetValue`, `:291-305`), it can never miss a reachable
meeting choice set. So it never reports unbuildable for a page an honest player can pass: the error
never blocks valid content. This is the safe property and it holds.

The search is bounded: the sign-in product is brands x domains x purposes x wordings and the
fake-check product is hosts x pretexts x steps x urgencies, each an authored menu of a handful of
options. The largest shipped page (`lab_social_engineering`) validates in well under a second.

Finding Minor 1 records the one direction that is not sound (over-report).

### (b) Kit reachability: the server's notion is looser than the rule

The rule's check 1 (a `link` `payloadKit` names the page) uses `CaptureModel.page_evidence_kits`
(`capture_model.rb:356`), the exact helper `phish_page_evidence_holds?` reads
(`capture_proofs.rb:627-630`), so kit wiring is server-faithful. Check 2 (`:7007-7008`) additionally
requires the page's `targets` map to name an authored `phishTarget`. The server is looser: a build
target need only be a key of `targets` or any declared phish target (`valid_landing_target?`,
`capture_proofs.rb:490-497`), only a target with a per-target `linkThreshold` can reach
`meetsThreshold`, and `phish_page_evidence_holds?` matches the landed send against the capture
entry's target without re-checking the record's build target. Finding Minor 2 records the divergence.

### (c) Array-only and the widened warning: both faithful

The rule now iterates only `social['landingPages'].is_a?(Array)` (`:6982`), matching the serve path
`pages.is_a?(Array) ? pages : []` (`game.rb:1427`) exactly, so it raises nothing the server would not
itself serve. The NPC-capture block now keys on `CaptureModel.hard_access_values` instead of
`lock_codes` and stays a warning; `hard_access_values` is the same set the server withholds on
(`authored_capture_served?` path), so the widening is correct and stays non-blocking.

### (d) Node cases: non-tautological, one per sign-in branch; fake-check branch uncovered

Each case flips one field of a shared factory and asserts the opposite outcome against a
branch-distinctive error fragment, so none is tautological: no-kit, wrong-page kit and non-link kit
each assert check 1; `targetKey: 'ghost'` asserts check 2's fragment; `linkThreshold: 999` asserts
check 3's fragment and `linkThreshold: 70` clears it (a clean paired test); the PSK NPC-capture case
asserts the widened warning. Finding Minor 3 records the one new branch with no case.

### (e) Counts unchanged

Re-ran the validator on `lab_social_engineering` plus three other landing-page scenarios (table
above). All four match R1 and the build log. `lab_social_engineering` exercises the full path (page
wired through `kit_payroll_page`, aims at the authored `lord` target, buildable at `linkThreshold`
70) and stays at 0 errors, confirming no false positive on shipped content.

### (f) Chunk 4 follow-up: recorded, but not where the chunk 4 builder works

The PhishJudge "can land" follow-up is written in the rule comment
(`scripts/validate_scenario.rb`, check 2) and in the build log Chunk 8 section
(`PHISH_EVIDENCE_SERVER_BUILD_LOG.md:353-360`). It is not in the plan's build-order item 4 or section
5, where the chunk 4 builder actually works. Finding Minor 4.

## Findings

### Minor 1 - buildability is profile-blind, so it can over-report buildable (never under-report)

`scripts/validate_scenario.rb:6759` (`landing_page_buildable?`). The search ignores `pageDef.profile`,
which both restricts which rows a player edits and hides domains by `minProfile`
(`landing-page-builder-minigame.js:50-54, 316, 253-258`). It therefore enumerates choices an honest
player cannot make. Failure scenario: a page with `profile: 'mission'` (edits domain and wording only)
offering a tier-3 domain gated `minProfile: 'student'`, where the aimed target's threshold is reachable
only with that tier-3 domain. In the mission profile the player cannot select that domain, so the page
is genuinely unsolvable, yet the validator enumerates it, meets the threshold and reports buildable, so
the error does not fire. The twin case: a `profile: 'student'` page whose `purposes` menu omits the
pretext `purposeId` and `signin` while full purpose points are needed. In both the secret is then
withheld from honest play while the validator passes. This is the same safe direction the R1 Major
noted (withholds, never over-serves, never blocks valid content), so it is a Minor, not a Blocker.
The completeness claim in the code comment ("no meeting choice set found means none exists") is true;
only soundness has this profile-shaped gap. Fix: read `pageDef.profile`, enumerate only editable-row
choices and `_visibleDomains`, and max the preset rows (which the preset forces anyway).

### Minor 2 - kit-reachability check is stricter than the server's serve condition

`scripts/validate_scenario.rb:7007-7008` versus `capture_proofs.rb:490-497` and `:619-640`. The rule
requires `page.targets` to name an authored `phishTarget`. The server can serve a secret when the
build target is a `page.targets` key that is not a phish target (permitted by `valid_landing_target?`)
and the landed send goes to a different, real phish target, because `phish_page_evidence_holds?` does
not re-check the record's build target against the send target. Failure scenario: a page whose
`targets` map names only non-phishTarget ids, built for one of them and sent to a separate phish
target, is serveable by the server but errored by the rule. No shipped scenario authors this: the
documented design and every real page make `targets` keys phish target ids (the lab passes), so the
rule errs toward the clean single-target honest flow rather than blocking intended content. Minor, and
arguably acceptable by design; recorded so a later author who hits it is not surprised.

### Minor 3 - the fake-check buildability branch has no node case

`scripts/validate_scenario.rb:6797` (`fake_check_buildable?`); `test/js/validator-phish-evidence-secret.test.mjs`.
All 10 cases use sign-in pages, so the `pageType == 'fakeCheck'` branch of `landing_page_buildable?`
and the whole `fake_check_buildable?` function are never exercised. No shipped fake-check page carries
a hard-access `capture.secret` (ca10 is at 0 rule hits), so nothing reaches it in the counts either.
The function reads correctly (exhaustive over the four `check` menus, bounded, no gates, matching
`score_fake_check`), but it is untested. Fix: add one case with a `pageType: 'fakeCheck'` page whose
`capture.secret` is a lock code, wired and aimed, toggling `check.points` or `linkThreshold` across
the threshold.

### Minor 4 - chunk 4 PhishJudge follow-up is not in the plan section the chunk 4 builder reads

`PHISH_EVIDENCE_SERVER_PLAN.md:702-704` (build-order item 4) and section 5 carry no reference to the
validator "can land" follow-up; it lives only in the rule comment and the build log Chunk 8 section
(`:353-360`). A chunk 4 builder working from the plan's PhishJudge item may not open either. Fix: add
a one-line pointer in plan item 4 (or section 5) that, once `PhishJudge` exists, the section 13 rule
should also check a composed message can land for an aimed target.

## Notes (not findings)

- The `to_number` / gate parity with JS `Number()` (R1 Minor 4 on the port) is out of this chunk's
  range and already documented at `phish_score.rb:270-301`; the validator only ever passes
  scenario-authored numeric thresholds, so it is not reachable from here.
- Coverage gaps the R1 review already noted (the `(no id)` label branch and the `hard_access.empty?`
  early return) remain trivial and untested; not re-raised.
