# Scenario format hardening, Step 4 review R3

Reviewer pass over `build/hard-step4`, tip `32b404967`. Review only; no code changed. Three parts:
merge correctness and secret safety across the merge of main `e1303fc0c` into step 4, a closure check
of R2 minors 1 and 2, and a fresh corpus pass. Prior rounds: `SCENARIO_FORMAT_STEP4_REVIEW_R1.md`
(0/2/4) and `_R2.md` (0/0/3, SHIP). Settled and not reopened: lock, role, resource and global carry no
`x-ref`, on purpose.

Evidence gathered in this worktree and in a throwaway detached worktree at the merge base `e1303fc0c`,
validator run `--no-graph --skip-ink --no-known-failures` over m01 to m10, sis01 to sis03 and the
twelve labs.

## Counts

- Blocker: 0
- Major: 0
- Minor: 0

## Verdict

SHIP. The merge kept every server-only mark and every reference mark; the typed action forms behave as
before on the real corpus; both R2 minors are closed on the live run path; and the corpus delta is
exactly the two documented suggestion lines, with no new error and no new warning. No new finding.

## Part 1. Merge correctness and secret safety

**Every server-only mark survives.** A path-keyed comparison of main `e1303fc0c` against the merged tip
(each schema parsed, each `x-` mark collected with its JSON pointer) shows the 35 `x-serverOnly` and 9
`x-servedBy` locations from main are present on the tip at the identical pointers, byte for byte. In
particular `addCapture.secret` (`definitions/eventMapping/properties/addCapture/properties/secret`),
`usePayload.secret` and the social landing-page `capture.secret` keep `x-serverOnly: true`. The room and
object `network` fields keep both `x-serverOnly: true` and `x-ref: network`, and object `policy` and
`defaultPolicy` keep both their server mark and `x-ref`, so nothing leaks a server-only field to the
browser and no reference check was dropped.

**Every reference mark survives.** The 28 `x-ref` locations from step 4 (`e9b3e65fb`) are present on the
tip at the identical pointers, and the one `x-engineGlobals` root annotation is unchanged.

**The typed action forms are correct and change no behaviour on the corpus.** `completeTask`,
`unlockTask`, `unlockAim` and `skipTask` carry the step-4 `oneOf` of a string or an array of strings,
each branch marked `x-ref` (`task`, except `unlockAim` which is `aim`), replacing main's
`{ "x-free-data": true }` stubs. The free-data reconciliation is coherent: the tip drops exactly those
three eventMapping free-data stubs (`completeTask`, `unlockAim`, `unlockTask`) and keeps all of step 4's
other free-data plus main's three that step 4 never had (`item.cryptexConfig`, `importGlobals.items`,
`timedMessages.items`), so 18 (main) becomes 15 shared plus the 3 retyped, and 12 (step 4) is kept whole.

The retype is a narrowing (an open free node to a string-or-array leaf), so it could in principle reject
a value or hide a child. It does neither here. The open-location mark rule in
`test/unit/scenario_schema_test.rb` (`test_every_open_location_has_exactly_one_mark`) still passes
because `open_kinds` returns empty for a `oneOf`-constrained node, so the four retyped fields leave the
open-location set and need no `x-id-map` / `x-free-data` mark. `ScenarioSchema`, `AuthorNotes`,
`PayloadLeafClassifier` and the held payload scan are unaffected: the classifier keys off `x-serverOnly`
and `x-servedBy` (untouched) and treats a declared leaf with no server mark as authored text, not a
secret, so a task id under `completeTask` cannot become a leak; and the corpus carries no object-valued
`completeTask`, so the narrower schema rejects nothing (0 new errors over the corpus, below). Tests that
exercise all four walkers and the corpus set-global sweep pass on the tip: `scenario_schema_test`
(10 runs, 12780 assertions), `author_notes_test` (19 runs), `schema_walk_test` (7 runs),
`payload_scan_fresh_state_test` (11 runs, 1 skip, the HELD corpus scan).

**No merge debris.** No conflict marker in the schema, the validator, `schema_walk.rb` or the build log;
the schema parses as JSON; `ruby -c` on the validator is clean.

## Part 2. R2 minors 1 and 2

**R2 minor 1 (silent skip) closed.** `check_room_types` (`scripts/validate_scenario.rb:8078-8102`) now
returns a loud `WARNING` when `load_valid_room_types` yields nil, that is when `game.js` is missing or
registers no `tilemapTiledJSON` room map, rather than returning `[]` in silence. It is wired on the real
run path (`run.call('check_room_types') { check_room_types(json_data, repo_root) }`, `:8327`) with the
same `repo_root` the rest of the run uses, so the warning reaches the report. The node test
`validator-room-types.test.mjs` drives the real function with a missing directory and with an empty
`game.js` and asserts the warning in both cases (6 tests, pass).

**R2 minor 2 (em dash) closed.** The `check_room_types` error and the loader carry no em or en dash, and
the whole merge delta over `scripts/` and `lib/` adds no em or en dash and no model name on any added
line. A dedicated test asserts the room-type error carries neither dash.

## Part 3. Fresh corpus pass

Validator output on the tip compared against the merge base `e1303fc0c` over all 25 target scenarios,
worktree paths normalised. The only content difference is two added suggestion lines, both documented in
the build log:

- `lab_social_engineering`: 1 `SUGGESTION` (`profile_done` is both a task id and a global).
- `m03_ghost_in_the_machine`: 1 `SUGGESTION` (`victoria_choice_made` is both a task id and a global).

No line removed. Total `ERROR` lines across the corpus: 1 on both trees, the same pre-existing one, with
identical per-scenario error sets. The new room-type check fires no warning and no error anywhere in the
corpus (all corpus room types resolve against the current `game.js`), so plan item 6 adds no corpus
noise. Every new `x-ref` resolves.

## Standing rules

UK English throughout. No model name on any added line. No em or en dash on any added line. No new
package: the only new require is a local `require_relative`. `public/break_escape/js/core/game.js` is
read, not edited (the diff touches only the two scripts and `schema_walk.rb`).

## Tests re-run (this review)

- `scenario_schema_test`: 10 runs, 12780 assertions, 0 failures.
- `author_notes_test`: 19 runs, 0 failures.
- `schema_walk_test`: 7 runs, 0 failures.
- `payload_scan_fresh_state_test`: 11 runs, 0 failures, 1 skip (the HELD corpus scan).
- `validator-references` (15), `validator-room-types` (6), `validator-m01-six-slips` (1): 22 node tests,
  all pass.
- Corpus tip vs base over 25 scenarios: 2 new suggestion lines, 0 new error, 0 removed line.

## Observations (not counted)

- The pre-existing `REPO_ROOT` "already initialized constant" warning prints on every validator run on
  both trees; it predates step 4 and is not a step-4 finding.
- The free-data node `item.cryptexConfig`, `importGlobals.items` and `timedMessages.items` come from main,
  not step 4; the merge keeps them unchanged.
