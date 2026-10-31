# Release review rounds: scoring, CyberAware, ending warning, reporting route

Scope: engine commits since ba52ef1c6 and the matching Hacktivity work (scoring phases 3-7, CyberAware catalogue, WP-02 reporting route, access and input-sanitisation hardening). Hacktivity is described at feature level only.

## Round 1 (2026-10-31)

Four fresh Opus 4.8 reviewers, read-only: engine; Hacktivity scoring; access and sanitisation (both repos); learner and organiser wording.

| Reviewer | Blocker | Major | Minor |
|---|---|---|---|
| Engine | 0 | 0 | 3 |
| Hacktivity scoring | 0 | 2 | 5 |
| Access and sanitisation | 0 | 0 | 2 |
| Wording and flow | 1 | 2 | 3 |
| **Total** | **1** | **4** | **13** |

| Id | Sev | Finding | Outcome |
|---|---|---|---|
| B1 | blocker | Seeded courses paired the AB before-check with the BA after-check: the same question set twice, and no baseline carried over | fixed (Hacktivity seed: final check becomes the matching AB after-check) |
| H1 | major | Awareness attempts: the dashboard used the best attempt while the result used the counted attempt; a passing retry stayed at 0 | fixed (any attempt at or above the pass mark completes; the result stays the counted attempt's) |
| H2 | major | Completion leaderboard ignored listing weights | fixed (weighted completions, as the plan says) |
| A1 | major | Check descriptions showed learners internal scenario slugs and the wrong partner check | fixed (engine mission.json) |
| A2 | major | "Points off the round" line still showed with results hidden | fixed |
| H3 | minor | Best-attempt tie-break differed between dashboard and leaderboard | fixed |
| H4 | minor | Seed forced the legacy scoring method on new CyberAware listings | fixed |
| H5 | minor | Score breakdown recomputed several times per game on two views | fixed |
| H6 | minor | Scoring switch wrote its revert file after commit | fixed |
| H7 | minor | Wrong helper comment | fixed |
| S1 | minor | Protocol-relative `//host` links passed the markdown filter | fixed |
| N3 | minor | Organiser "hide result" hint did not say counts still show | fixed |
| E1 | minor | Episode debrief ignored the host's hide-result setting | fixed |
| E2 | minor | Validator checked the ink source for `#ending_check`, not the compiled JSON | fixed |
| S2 | minor | CTA tags expand in organiser-written descriptions | deferred: only Hacktivity's own partials, no author text reaches them, and staff also write descriptions |
| E3 | minor | "Below the pass mark" line shows with results hidden | withdrawn: the learner needs it to retry (owner's show-result decision covers scores, not the retry prompt) |
| N1 | minor | Shipped brands follow the approved rename list, not the PARODY_NAMES.md proposal | withdrawn: by design, the owner approved the rename list |
| N2 | note | Ending warning not used in awareness episodes | withdrawn: no optional objectives there; the debrief is the content |

Also below minor, not acted on: `id`/`class` allowed on markdown output (no script path); `lab_tesseract_trials` sets a variable before its `#ending_check` tag (benign today).

Owner calls this round: m10's failed "joined" ending has no ending warning; m03's end music waits for the debrief's first line.

### Round 1 fixes (2026-10-31)

All fourteen "fixing" findings were fixed: engine merge bc74eae2c; Hacktivity scoring, seed and sanitiser fixes plus test follow-ups. Also:

- A1 grew: the "(pair AB/BA)" form letters were removed from the 28 check descriptions too (the design hides them from learners).
- B1 was worse than reported: the mismatched pair gave learners the same question set twice. The dev catalogue was reseeded; the swap is in place, only for listings with no learner games.
- The full Hacktivity suite then showed three failures caused by this work (two round 1 tests and one Phase 3 default change) and one stale test of an older engine fix (a signed-out configuration request is now redirected). All four were fixed. Two failures remain in subscription and mail-interceptor code this work never touched; they fail in isolation and are left for the owner.
- Owner calls m10 and m03 merged (f67d4012b).

## Round 2

Three fresh reviewers: engine and wording; Hacktivity scoring and seed; security across both repos. Each confirms round 1's closures first.

| Reviewer | Blocker | Major | Minor |
|---|---|---|---|
| Engine and wording | 0 | 1 | 0 |
| Hacktivity scoring and seed | 0 | 0 | 1 |
| Security | 0 | 0 | 1 |
| **Total** | **0** | **1** | **2** |

Closures: all fourteen round 1 fixes confirmed closed with file:line evidence (A1, A2, E1, E2, B1 on both sides, H1-H7, S1, N3). The seed swap was checked against four criteria: games guard, idempotent, slot and position kept, nothing deleted.

| Id | Sev | Finding | Outcome |
|---|---|---|---|
| R2-E1 | major | The check's per-message "Score for this message: N of 100" still showed with results hidden, in both feedback modes | fixed (engine 48b10c597, merged 8d3c5f755) |
| R2-H1 | minor | A crash at commit could leave a usable but stale scoring revert file | fixed (Hacktivity: revert file is written as `.part` and renamed only after commit) |
| R2-S1 | minor | The scoring preview CSV (learner emails) and revert file had default permissions; revert read any path | fixed (Hacktivity: both files mode 0600; revert only reads `scoring_switch_*.json` in tmp) |

Suite: the full Hacktivity suite gives 3965 runs with the two known unrelated failures. Engine: 347 JS files and 239 model tests pass; the validator sweep matches the baseline.

## Round 3

Confirmation round, run because round 2 found a major.

| Reviewer | Blocker | Major | Minor |
|---|---|---|---|
| Engine | 0 | 0 | 0 |
| Hacktivity | 0 | 0 | 0 |

Closures: R2-E1, R2-H1 and R2-S1 confirmed closed with file:line and test evidence. The hidden-results contract was swept across the check (immediate, end, review, result, reopen), the episode debrief, the pretext debrief and the end screens, and nothing is left ungated. Item counts and the retry line stay by design.

Ending warning per mission: m01, m09, sis03 and lab_tesseract_trials use the ink tag; m02-m08 and m10 use an `endingCheck` mapping before the debrief; sis01 and sis02 opt out (time pressure); m10's "joined" ending is unwarned by owner decision. No mission warns only at the credits.

Hacktivity sweep: two routes added in the range (the organiser reporting-route edit and update), both policy-checked with refused-side tests for all six roles. Every new permitted param is narrowed and tested, and organiser text is cleaned on save and escaped on render.

Suites: engine 347 JS files, plus 607 model and controller runs, all passing. Hacktivity 3970 runs; the only failures are the two known unrelated ones (subscription flow, mail interceptor).

Owner note, not a finding: the scoring revert command blocks `..` paths but would follow a symlink planted inside the app's tmp folder. That needs write access to tmp and a shell, so a realpath check would close it only if wanted.

**Result: clean. The review is closed after three rounds.**
