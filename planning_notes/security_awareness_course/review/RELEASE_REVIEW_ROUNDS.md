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
| B1 | blocker | Seeded courses paired the AB before-check with the BA after-check: the same question set twice, and no baseline carried over | fixing (Hacktivity seed: final check becomes the matching AB after-check) |
| H1 | major | Awareness attempts: the dashboard used the best attempt while the result used the counted attempt; a passing retry stayed at 0 | fixing (any attempt at or above the pass mark completes; the result stays the counted attempt's) |
| H2 | major | Completion leaderboard ignored listing weights | fixing (weighted completions, as the plan says) |
| A1 | major | Check descriptions showed learners internal scenario slugs and the wrong partner check | fixing (engine mission.json) |
| A2 | major | "Points off the round" line still showed with results hidden | fixing |
| H3 | minor | Best-attempt tie-break differed between dashboard and leaderboard | fixing |
| H4 | minor | Seed forced the legacy scoring method on new CyberAware listings | fixing |
| H5 | minor | Score breakdown recomputed several times per game on two views | fixing |
| H6 | minor | Scoring switch wrote its revert file after commit | fixing |
| H7 | minor | Wrong helper comment | fixing |
| S1 | minor | Protocol-relative `//host` links passed the markdown filter | fixing |
| N3 | minor | Organiser "hide result" hint did not say counts still show | fixing |
| E1 | minor | Episode debrief ignored the host's hide-result setting | fixing |
| E2 | minor | Validator checked the ink source for `#ending_check`, not the compiled JSON | fixing |
| S2 | minor | CTA tags expand in organiser-written descriptions | deferred: only Hacktivity's own partials, no author text reaches them, and staff also write descriptions |
| E3 | minor | "Below the pass mark" line shows with results hidden | withdrawn: the learner needs it to retry (owner's show-result decision covers scores, not the retry prompt) |
| N1 | minor | Shipped brands follow the approved rename list, not the PARODY_NAMES.md proposal | withdrawn: by design, the owner approved the rename list |
| N2 | note | Ending warning not used in awareness episodes | withdrawn: no optional objectives there; the debrief is the content |

Also below minor, not acted on: `id`/`class` allowed on markdown output (no script path); `lab_tesseract_trials` sets a variable before its `#ending_check` tag (benign today).

Owner calls this round: m10's failed "joined" ending has no ending warning; m03's end music waits for the debrief's first line.
