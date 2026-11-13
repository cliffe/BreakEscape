# Access model slice 9.1, step 5 (`holdsDoors`): code review, round 3

Branch `build/9-1-step5-holds-doors` at `c3edb0b09`, reviewed as
`git diff claude/break-escape-access-design-090sjx build/9-1-step5-holds-doors` (29 files). Measured
against `docs/achitechture/ACCESS_MODEL_SLICE_9_1_PLAN.md` step 5 and section 5.4, and against the
round 2 review (`ACCESS_MODEL_SLICE_9_1_STEP5_CODE_REVIEW_R2.md`). Fresh reviewer; read-only on code.

Since round 2 only the validator, the graph label, `verify-run.rb`, two test files and docs have
changed (`git diff 594f7efde build/9-1-step5-holds-doors`); `door-gates.js` and `npc-behavior.js`
are as round 2 reviewed them. I re-read their diff against base and found nothing new.

Tests run singly on Ruby 2.7.8p225 (`RBENV_VERSION=2.7.8`), all green: `door-gates-validator` (10,
none skipped), `door-gates-no-hold` (13), `door-gates` (22), `npc-route-multiroom` (21),
`npc-stuck-detector` (14), `validator-npc-habits` (42), `playtest-verify-run-access` (11),
`dungeon-graph-habits` (7); `test/unit/npc_habits_test.rb` (28 runs, 114 assertions). `ruby -wc`
passes on every touched Ruby file. Its four "unused variable" warnings in `validate_scenario.rb`
(lines 2224 to 2546) were already there before this branch. No Ruby 3-only syntax in the added
lines: the one `gate:,` match is in a comment, and `filter_map` and `to_h` with a block are 2.7 and
2.6. The full validator on `scenarios/test_access_habits` gives the one expected `store_b_badge`
careful-guard warning, as `PLAYTEST.md:66` records.

Probe scenarios are in
`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/holds-r3/run.rb`
and `.../holds-r3/run2.rb` (they call `check_lock_credentials` directly).

## Severity table

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 1 |
| Minor | 1 |
| Nit | 2 |

## Round 2 findings: closed or not

Checked in the code, not from the build log.

| R2 finding | State | Evidence |
|---|---|---|
| Major 1, careful gate silences the soft-lock warning | Closed for the case it names; a shape it does not name is still open (major 1 below) | `scripts/validate_scenario.rb:1925-1958` reads gates from `NpcHabits.expanded_copy`, counts a gate only with `playerMayPassIf` or a holder outside `noHold`, else the new "only careful guards" warning. The R2 reproduction now warns |
| Minor 1, rule untested against the habit | Closed | `test/js/door-gates-validator.test.mjs:78-83` runs the base fixture with no `playerMayPassIf`; `:123-153` cover `high`, authored `noHold`, and the four clearing cases (low, `playerMayPassIf`, cloner, second careless holder) |
| Minor 2, half-applied re-indentation | Closed | The base-to-branch diff of `validate_npc_habits.rb` and `validate_scenario.rb` now holds only real changes; the `case` keeps its old layout with one new `when 'holdsDoors'` line |
| Nit 1, empty `noHold` line in `verify-run` | Closed | `tools/playtest/verify-run.rb:149` prints `(none, authored)`; test `playtest-verify-run-access.test.mjs:161-167` |
| Nit 2, two readings of a string `openFor` | Closed | Loader (`npc_habits.rb:218`), graph (`generate_dungeon_graph.rb:493`), `check_gate_no_hold` (`validate_npc_habits.rb:207`) and `verify-run.rb:148` all take a list or one value, strings only |
| Nit 3, "held by" lists guards with no level | Not done, by choice | Optional in R2; the label is correct. Acceptable |

## Findings

### Major 1. The careful-gate check is per card, not per room, so a second room behind the same card can still soft-lock silently

`scripts/validate_scenario.rb:1932-1947`. For each NPC card the code gathers every holder gate
into every room that requires the card, and marks the card declared when any one of those gates is
passable. Credentials are then checked per `requires` value (`:1950`), with no room in the
picture. A careless gate into one room therefore clears the careful gate into another.

Reproduced (probe B): Sam (`awareness: high`) and Gary (`awareness: low`) both carry `SAM-1`.
`office` has a north gate into `vault` for Gary and one into `vault2` for Sam; both rooms are
`locked`, `rfid`, `requires: "SAM-1"`, and there is no cloner and no keycard. The player can
tailgate Gary into `vault`, but `vault2` is only reachable through Sam's careful gate (room locks
apply to every door, and tailgating gives no card). `check_lock_credentials` returns nothing.
Probe C is the same with one NPC and no levels: Sam holds doors, but the `vault2` gate has an
authored `noHold: ["sam"]`; again nothing. On base, both scenarios get the generic "no item
declares card_id 'SAM-1'" warning, so here the branch loses a true warning. A staff badge that
several rooms require is a common mission shape, and one careful guard on a single door is
exactly what step 5 invites authors to try.

Fix: decide per locked room, not per card. For each room that requires an NPC card with no keycard
item and no cloner, look at the holder gates into that room alone: any passable gate (as now)
means it is fine; holder gates that are all careful get the careful-guard warning naming that
room; no holder gate gets the "only an NPC" warning. Say which rooms in the message, and add
probes B and C as cases in `door-gates-validator.test.mjs`, each with its mirror (vault2 also has
a careless holder gate: no warning).

### Minor 1. A careless guard in `openFor` without the card is ignored, so the warning can be false and says something untrue

`scripts/validate_scenario.rb:1936-1940`. "Passable" counts only holders of the card
(`(g[:open_for] & holder_ids) - no_hold`). The client opens a gate for any `openFor` NPC who comes
near, card or not (`door-gates.js:22`, `nearGuardIds`), and `careful()` (`door-gates.js:718-722`)
asks whether every guard that counts is in `noHold`, not whether they carry anything. So a gate
that opens for careful Sam (card) and careless Gary (no card) is tailgatable whenever Gary goes
through it.

Reproduced (probe A): the R2 fixture plus Gary (`awareness: low`, no card) in `openFor`. The
validator warns "only careful guards (holdsDoors false) open the gate into 'vault' ... the player
cannot get in", which is false on both counts. Base gave the generic warning for this case too, so
the branch is no less strict than before, but the new message now states a wrong cause and points
the author at the wrong fix. The R1 rule has the same gap for a card holder outside `openFor`
plus a careless non-holder inside it; there the "only an NPC" message says "no gate into the
locked room opens for the holder", which is true but leads to the same wrong conclusion.

Fix: a gate is a way in when it sets `playerMayPassIf` or any NPC in its `openFor` that exists as
a room NPC is outside its `noHold`, whoever carries the card. Keep the holder test only to choose
the message. Add probe A as a test (no warning). An `openFor` id with no NPC behind it (probe E,
`ghost`) must stay out of the count; it does today, by accident of the holder filter, so keep a
test for it.

### Nit 1. A non-array authored `noHold` is read three ways

`scripts/validate_scenario.rb:1938` uses `Array(g[:gate]['noHold'])`, so `"noHold": "sam"` is
treated as `["sam"]` and draws the careful-guard warning (probe `run2.rb`). The client
(`door-gates.js:122`) treats any non-array as `[]`, so the gate holds doors and is passable. The
loader takes the key as authored and leaves it alone (`npc_habits.rb:233`), and
`check_gate_no_hold` skips it (`validate_npc_habits.rb:198`). Schema validation already rejects a
string, so this only matters when schema errors are ignored. Fix: read it as the client does
(`noHold.is_a?(Array) ? noHold.grep(String) : []`), or have `check_gate_no_hold` warn on a
non-array `noHold`.

### Nit 2. The comment and the message overstate the cloner and keycard checks

`scripts/validate_scenario.rb:1900-1906` and `:1954-1956` speak of "the player cannot get in", but
the check still assumes any `rfid_cloner` anywhere (even one locked behind the same card) and any
careless holder gate (even one on no route) is enough. That is a known approximation from round 1,
not new, and is fine for a warning, but one clause in the comment ("a reachable cloner and a guard
who actually walks the gate are not checked") would stop the next reader from trusting it as a
solvability proof.

## Contract and engine, skimmed again

- Contract items 1 to 6 of plan 5.4 still hold: `open()` sets `lastGuards` before `_applyBodies`,
  `close()` clears it, the per-tick add runs only while open and before `_playerBarred`,
  `openToPlayer` checks the clone window, then `playerMayPassIf`, then `!careful`, and
  `_playerBarred` gains the careful clause after the `playerMayPassIf` clause.
- No new endpoint and no new client-supplied field. `habits` and `awareness` are still stripped
  from room data; `noHold` survives reload in `scenario_data`.
- m01 to m10 have no gates and no route actions, so neither engine change reaches them; the
  build log's 84-run validator comparison against base agrees (one new warning, the expected
  `store_b_badge`; two vanished, both cloner-backed clone targets).

## Verdict

Not ready to merge yet, but one small validator change away. Every round 2 finding is closed in
the code, and the engine, loader, graph, `verify-run` and docs are sound. Major 1 is the R2
soft-lock again in another shape: because the careful-gate check is per card, a careless gate
into one room hides a careful-only gate into another room behind the same card. Fixing it per room
is a local change to `check_lock_credentials`. Minor 1 (count any careless `openFor` NPC, not
only holders) belongs in the same edit and the same test file. The nits can follow.
