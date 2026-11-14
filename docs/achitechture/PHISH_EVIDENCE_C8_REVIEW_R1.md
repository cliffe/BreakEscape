# Phish evidence chunk 8 review, round 1

Range reviewed: `404359580..a6d250c4d` (two commits: the validator rule `337352612`, the build log
section `a6d250c4d`). Files in range: `scripts/validate_scenario.rb` (+34),
`test/js/validator-phish-evidence-secret.test.mjs` (+88, new),
`docs/achitechture/PHISH_EVIDENCE_SERVER_BUILD_LOG.md` (+73). Review only, no code edits.

Spec: `PHISH_EVIDENCE_SERVER_PLAN.md` section 13, section 15 tests, cheat policy (section 11).

## Verdict: SHIP

0 Blocker, 1 Major, 2 Minor. The core rule (a protected landing secret must be wired through a
link kit) is correct, aligned with the server, well tested, and errors on no existing content. The
Major is a section 13 deliverable that was not built; it only ever withholds, never over-serves, so
it does not block shipping the forge-closing rule, but it should be a tracked follow-up.

## Counts (re-run, `LANG=C.UTF-8 /usr/bin/ruby3.2 scripts/validate_scenario.rb <f> --no-graph`)

| Scenario | errors | warnings | rule hits |
|---|---|---|---|
| lab_social_engineering | 0 | 8 | 0 |
| test_social_slice | 0 | 6 | 0 |
| ca05_signin_pages | 0 | 3 | 0 |
| ca10_downloads_and_fake_checks | 0 | 2 | 0 |

Matches the build log exactly. No `dungeon_graph.*` rewrites (`git status` clean bar `node_modules`).
Node test re-run: 6 subtests, all pass (under system `ruby` 2.7.8, which the test invokes).

## What I checked

### hard_access_values as the protected-secret set: correct, matches the server

The server decides a capture secret is protected with `Game#hard_access_capture_value?`
(`app/models/break_escape/game.rb:1496-1500`), which calls the same
`CaptureModel.hard_access_values(scenario_data)` the rule uses (`validate_scenario.rb:6878`). The
validator trigger is therefore the exact set the server withholds on. The server's phish gate is the
binding one: `phish_page_evidence_holds?` (`capture_proofs.rb:619-640`) returns false when the page
has no link kit (`kit_ids.empty?` at `:630`), so an unwired protected landing secret is withheld
forever and honest play is blocked. Erroring at authoring time is the right response, not a warning,
and the counts show no shipped scenario trips it (`lab_social_engineering` wires `payroll_login`
through `kit_payroll_page`, `scenario.json.erb:673`; its secret `Sofia2026!` is the `requires` of a
password lock at `:218`). Choosing `hard_access_values` over `lock_codes` is a strict superset that
also catches a Wi-Fi PSK or flag secret; the server already withholds those too, so the two agree.

### False positives: none found against shipped content

Awareness pages carry no `capture.secret`, so `present_string?(secret) && hard_access.include?` is
false and nothing fires (confirmed by the counts and node test 5). A collision where an awareness
page's secret happens to equal a real lock code is not a false positive: the server would withhold
that secret too, so the page genuinely needs wiring.

### Node test quality: good, not tautological

Each case flips one variable from a shared `scenario()` factory and asserts the opposite outcome,
with a mirror where it matters (test 6 wires the PSK and confirms the error clears). Branches
covered: hard-access match true/false (tests 1-4,6 vs 5), kit present (1,6-wired), kit absent (2),
kit names another page (3), non-`link` kit (4), and that the set is wider than lock codes (6, PSK).
The error assertion checks the `❌` prefix and a distinctive fragment, so it cannot pass on an
unrelated issue string.

### Merge risk against build/hard-tailgate-plan: no conflict

`check_gated_door_credit` lands as a new function plus a constant inserted before
`def check_access_model` (tailgate hunk `@@ -6739,6 +6739,290 @@`) and a new `run.call` line after
the `check_access_model` call (`@@ -7666,6 +7950,7 @@`). The chunk 8 rule inserts inside
`check_access_model` at original line 6867, which sits between the two tailgate hunks and touches no
line either hunk touches. A three-way merge applies all three edits cleanly with no manual
resolution. Both branches share base `37260071`. No action needed beyond a normal merge.

## Findings

### Major 1 - section 13 bullet 3 (page buildability) not implemented; validator silent on an unsolvable wired page

`validate_scenario.rb` (new rule, `:6878-6901`); `PHISH_EVIDENCE_SERVER_PLAN.md:673-675`.
Section 13's third bullet asks the validator to share `PhishScore` so an authored page can be checked
for being solvable (some choice set meets its `linkThreshold`). `lib/break_escape/phish_score.rb`
exists but the validator never references it, and the build log does not mention the item. The rule
only checks that a link kit *names* the page, not that the page's evidence can ever be produced.
Failure scenario: an author wires a protected secret through a link kit to a landing page whose
`linkThreshold` no choice set can reach. The server's `phish_page_evidence_holds?` needs
`meetsThreshold == true` (`capture_proofs.rb:623`), which the build route never records, so the
secret is withheld forever and honest play is blocked, while the validator passes. The same family
covers a kit that names the page but that no phish target can land (`:632-636` needs a landed sent
message carrying the kit to the target; the rule does not check any phish target can send it). The
direction is safe (withholds, never over-serves), so it is not a Blocker, but it is a missing
section 13 deliverable and the brief's false-negative case 4. Recommend a follow-up chunk adds the
`PhishScore` solvability check and a reachability check that some phish target can send the kit.

### Minor 1 - Hash-form landingPages could be errored though the server never serves its secret

`validate_scenario.rb:6881` uses `CaptureModel.landing_pages`, which accepts both an Array and a Hash
(`capture_model.rb:323-329`). The server's phish-secret reader `capture_secrets_for_client` reads
landing pages only when they are an Array (`game.rb:1428`, `pages.is_a?(Array) ? pages : []`). A
scenario that authored `social.landingPages` as a map with a hard-access secret would be errored by
the rule although the server never serves that secret through this path, a potential false positive.
No shipped scenario uses the map form, so this is an edge note, not a live problem; worth a comment
or aligning the helper's shape with the reader.

### Minor 2 - non-landing protected captures are only warned for lock codes, not the full hard-access set

`validate_scenario.rb:6834-6866` (pre-existing block, outside the review range, noted for the brief's
false-negative case 1). An NPC `usePayload`/`addCapture` secret that equals a lock code with no proof
draws a warning; a secret that is a Wi-Fi PSK or flag (also withheld by the server's
`authored_capture_secret`, `game.rb:1488`) draws nothing. This is not a phish forge (phish secrets
come only from `social.landingPages`, traced at `game.rb:1427-1438`), and the server withholds such a
capture rather than over-serving, so it is a safe dead-capture gap the chunk 8 rule does not touch.
Flagged only because the brief asked about secrets placed outside `landingPages`.

## Coverage note (not a finding)

The node test does not exercise the `(no id)` page-label branch (`:6894`) or the `hard_access.empty?`
early return (`:6879`). Both are trivial and the rule's behaviour on them is obvious; adding a page
without an id and a scenario with no locks would close the gap if a later round wants full branch
coverage.
