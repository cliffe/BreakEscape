# m07 office life: build review R5 (delta, last round)

Counts: B0 M0 m1

Reviewed: branch build/ol-m07 at c4d69f551. Delta is `a43fce0b5..c4d69f551` (HANDOVER.md, LOG.md, REVIEW_BUILD_R4.md: document fixes only) plus the R4 findings. Read only apart from this file. No server, no audio, no db.

## Assumptions

- Assumption: the delta touches no code, scenario or ink, so R4's merge checks still hold and were not repeated.
- Assumption: "model names" means the strip-before-commit step in HANDOVER.md "Next", so any new model name in repo prose counts as a finding.

## Static checks

- Validator (`--skip-ink --no-graph`): 0 errors (0 known), 31 warnings, as in R4.
- Lock and key diff (`ruby scripts/lock_key_diff.rb scenario.json.erb office_life/baseline_locks.json`): empty.
- Delta files: 3, all under office_life/. scenario.json.erb, ink and engine files are not in it.
- Dashes: 0 em or en dashes in added lines. US spellings: none (the only `behavior` hit is R4's own quoted word, in a sentence about a code term).
- Model names: two new mentions, see m1.

## R4 findings

- m1 line reference: closed. HANDOVER.md:57 now says `~:1136`; scenario.json.erb:1136 is the `setGlobal` of `server_hall_reached` inside the `room_entered:server_room` mapping (:1134 to :1137). `:2692` for the declaration was confirmed in R4 and is unchanged.
- m2 orchestrator state: closed. HANDOVER.md "Orchestrator state" records the merge at a43fce0b5 (main 7ca2df60d, which is main's tip), adds an R4 line and moves "Next" to R5. LOG.md R4 section matches REVIEW_BUILD_R4.md: scope, counts (B0 M0 m2), merge conclusions, validator 0 and 31, empty lock/key diff, both rows fixed.

## Findings

### m1 (minor): two new model-name mentions in repo prose

LOG.md:38 and HANDOVER.md:115 named the review model; both are now cleaned. The same HANDOVER.md "Next" line schedules a "strip model names" step before the commit goes to AC0, so these two will be caught there if the sweep covers LOG.md and HANDOVER.md.
Fix: say "cheaper tier" in both (HANDOVER.md:114 already does), or include them in the strip step. Closed: LOG.md and HANDOVER.md carry no model names on this branch, and the sweep of every office_life folder removed the rest.

## Checked and fine

- LOG.md R4 section is accurate against REVIEW_BUILD_R4.md and the tree.
- No new claims about live behaviour in the delta.

## Not checked

- Live behaviour, the non-skipped validator ink phase, audio (unchanged from R4: none by brief).
