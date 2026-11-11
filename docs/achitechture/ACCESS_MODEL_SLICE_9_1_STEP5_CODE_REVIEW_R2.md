# Access model slice 9.1, step 5 (`holdsDoors`): code review, round 2

Branch `build/9-1-step5-holds-doors` at `d28b9c869`, reviewed as
`git diff claude/break-escape-access-design-090sjx build/9-1-step5-holds-doors` (28 files). Measured
against `docs/achitechture/ACCESS_MODEL_SLICE_9_1_PLAN.md` section 5.4 (with its six-item contract)
and step 5, and against the round 1 review (`ACCESS_MODEL_SLICE_9_1_STEP5_CODE_REVIEW_R1.md`).
Fresh reviewer; read-only on code.

Tests run singly on Ruby 2.7.8p225, all green: `door-gates-no-hold` (13), `door-gates` (22),
`door-gates-validator` (7, none skipped), `door-gates-player-open` (12), `door-gates-sound` (11),
`npc-stuck-detector` (14), `npc-route-multiroom` (21), `validator-npc-habits` (42),
`dungeon-graph-habits` (7), `playtest-verify-run-access` (10); `test/unit/npc_habits_test.rb`
(28 runs, 114 assertions), `test/models/break_escape/npc_habits_loader_test.rb` (10 runs).
`ruby -wc` passes on every touched Ruby file. No Ruby 3-only syntax in the added lines (no endless
methods, no hash shorthand, no rightward assignment, no anonymous block forwarding; the only
`gate:,` match is in a comment; `filter_map` and `Hash#to_h` with a block are 2.7 and 2.6).

## Severity table

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 1 |
| Minor | 2 |
| Nit | 3 |

## Round 1 findings: closed or not

Each checked in the code, not from the build log.

| R1 finding | State | Evidence |
|---|---|---|
| Minor 1, soft-lock warning silenced for every NPC card | Closed as asked, but the new rule has its own hole (major 1 below) | `scripts/validate_scenario.rb:1900-1946`: an NPC card is declared only with an `rfid_cloner` anywhere or a gate into the locked room that opens for a holder; otherwise a new "only an NPC carries that card" warning. Tests in `door-gates-validator.test.mjs:92-115` |
| Minor 2, no clone-window-end tests | Closed | `door-gates-no-hold.test.mjs:255-315`: shut on the tick with the player near; doorway keeps it open and `bodyOff` until he steps off; empty `lastGuards` lingers; Sara, close, then Gary with the player near gives `openToPlayer` true |
| Minor 3, a loitering player keeps a careful guard inside | Closed by documentation, as offered | `README_scenario_design.md:152` "a player who loiters there keeps her in". Behaviour matches the plan's rule; acceptable |
| Minor 4, approach test overstates; blocked front cell | Test renamed; engine change deferred | Reasonable: no gate scenario has a blocked cell in front of a door, and the deferred change would alter route behaviour just settled by live runs |
| Minor 5, preset `holdsDoors` noise in the habits report | Closed | `scripts/validate_npc_habits.rb:466`: skipped when preset and `:no_gate`; test present |
| Nit 1, cut-short block does not idle | Closed | `npc-behavior.js:1771` calls `_haltForRoute()`; test `npc-route-multiroom.test.mjs:506` |
| Nit 2, `state()` lacks `lastGuards` and `careful` | Closed | `door-gates.js:337`; test `door-gates-no-hold.test.mjs:317` |
| Nit 3, `nearGuardIds` duplicates `_npcNear` | Closed | `door-gates.js:696-698` |
| Nit 4, validator gaps around authored `noHold` | Closed | `validate_npc_habits.rb:180-186` and `:202-205` |
| Nit 5, README wording | Closed | `README_scenario_design.md:152` |
| Nit 6, store sign | Closed | `scenarios/test_access_habits/scenario.json.erb:1380` |

## Contract and engine changes, re-checked

- Contract items 1 to 6 hold in the merged code. `open()` sets `lastGuards` before `_applyBodies`
  (`door-gates.js:431-435`); `close()` clears it (`:587`); the per-tick add runs only while open
  (`:782`) and before `_playerBarred` is read once for both branches (`:784`); `openToPlayer`
  answers the clone window first, `playerMayPassIf` second, then `!careful` (`:526-532`);
  `_playerBarred` gains the `careful` clause after the `playerMayPassIf` clause (`:741-743`).
- Exit opening with a careful guard near: `exitOpen` goes through `open()`, so `lastGuards` takes
  her and the period is careful. The player inside is never barred and the body is off for him;
  once he is outside the body comes on and, within the radius, the gate shuts. He is already out,
  so nothing is lost. Fine.
- Route changes (`npc-behavior.js:42-47`, `:1348-1418`, `:1764-1774`, `:1843`). The other callers of
  `chooseWaypointTarget` (`npc-sprites.js:1439`, `:1627`) null `patrolTarget` first, so the cut-short
  block never fires from them, and they only run for NPCs with top-level `patrol.waypoints`, which a
  multi-room route does not need. `_keepRouteLeg` only rewinds while the segment and index are where
  the leg left them; random mode never steps the index, so it is a no-op there. m01 to m10 have no
  gates and no route actions, so neither engine change reaches them.
- Server trust and reload: no new endpoint or client-supplied field. `noHold` is written by
  `NpcHabits.expand!` inside `Game#prepare_scenario_data!` and survives reload in `scenario_data`;
  `lastGuards` is per session and every gate starts shut. `habits` and `awareness` are stripped
  from room data (`access_model_withholding_test.rb`, and the loader test at
  `npc_habits_loader_test.rb:64-81` asserts the room carries `noHold` without `habits`). The gate is
  a bar on the body only, as plan 5.4 states; the server's npc unlock path still lets a player who
  calls the unlock endpoint as Sara reach `store_b` (round 1 nit 6), which is pre-existing and
  documented.

## Findings

### Major 1. The validator now passes, with no warning, the soft-lock that a careful gate creates

`scripts/validate_scenario.rb:1927`:

```ruby
gated = gates.any? { |g| locked_rooms.include?(g[:connected_room]) && (g[:open_for] & holder_ids).any? }
```

The round 1 fix counts an NPC's card as a way in whenever a gate into the locked room opens for a
holder. That is true of a careless guard (the player tailgates), but step 5's whole point is that
a careful guard's gate cannot be tailgated. `gate_entries` is read from the authored data and never
looks at `holdsDoors`, the preset or `noHold`, so a room whose only way in is a careful guard's
gate, with no cloner and no keycard item, draws no warning at all.

Reproduced: `office` with Sam (`"awareness": "high"`, `rfidCard` `SAM-1`) and a north gate
`{ "openFor": ["sam"] }` into `vault` (`locked`, `rfid`, `requires: "SAM-1"`), no cloner. The full
validator (`--no-graph --skip-ink --no-lint`) prints no warning or error about `vault` or `SAM-1`;
the expanded copy shows `noHold: ["sam"]` and the habits report lists "gate.noHold at
rooms/office/doors/0 (into vault)". Remove the gate and the new "only an NPC carries that card"
warning appears, so the gate is what silences it. `scenarios/test_access_habits` is a live case:
`store_b` (`requires: store_b_badge`, only Sara carries it, no cloner, `noHold: ["sara"]`) gets no
warning, which is the intended outcome of H9 but would be a soft-lock in a mission. Nothing else
catches it: `validate_npc_habits.rb` warns only when the habit does nothing, and the dungeon graph
still draws `gate_hall --> card_store_b_badge --> door_store_b` with the "not held by sara" label.

The README (`:152`) tells authors to "give the player another way in", so the validator is the one
place that could hold them to it, and the branch's own rule now hides exactly that case.

Fix: in `check_lock_credentials`, read the gates from `BreakEscape::NpcHabits.expanded_copy(json_data)`
(or from the same `holds` map) and count a gate as a way in only when it has a non-empty
`playerMayPassIf` or at least one holder in its `openFor` is not in its expanded `noHold`. When the
only route is a careful gate, emit a specific warning ("only careful guards (holdsDoors false) open
the gate into 'vault' and nothing else gives the card: the player cannot get in; add a cloner, a
keycard item, a guard who holds doors or another door"). Add the reproduction above as a case in
`door-gates-validator.test.mjs`, plus its mirror (same scenario with `awareness: "low"`: no
warning). For `test_access_habits` either accept the warning (it is a test scenario) or give it an
`_comment`-documented suppression if the validator has one.

### Minor 1. The validator rule is not tested against the habit it now interacts with

`test/js/door-gates-validator.test.mjs:74-115`. Every gate case uses `playerMayPassIf: 'visitor_pass'`
(the `scenario()` helper at `:38`), so the loader never writes a `noHold` there, and no case sets an
awareness level or `holdsDoors`. That is why major 1 passed the suites. Fix: covered by the two cases
proposed under major 1; also run the helper once without `playerMayPassIf` so the default fixture
exercises the step 5 path.

### Minor 2. Unrelated re-indentation in two validator files, half applied

`scripts/validate_npc_habits.rb:456-478` and `:541-545`, and `scripts/validate_scenario.rb:6364`.
The `if/elsif/else` and `case/when` blocks have been re-indented to the `variable` end alignment
(as a RuboCop autocorrect would), but the body of `when 'password'` (`:474-476`) is left at the old
indentation, so the `case` now reads with its branches at one depth and one branch's body at
another. No behaviour change, but it puts unrelated lines into a review diff and leaves the method
harder to read than either style. Fix: revert those hunks, or finish the reformat in a separate
commit.

### Nit 1. `verify-run.rb` prints an empty `noHold` line for an authored `noHold: []`

`tools/playtest/verify-run.rb:105-113` selects every gate whose `noHold` is an array, so an author's
explicit opt-out (`noHold: []`, which the loader treats as authored and leaves alone) prints
`noHold ` with nothing after it. Either skip empty lists or print `noHold (none, authored)`.

### Nit 2. Two readings of a string `openFor`

The loader (`npc_habits.rb:218`) reads `openFor` with `grep(String)`; the dungeon graph
(`generate_dungeon_graph.rb:493`) and `verify-run.rb:148` use `[x].compact`, and
`check_gate_no_hold` (`validate_npc_habits.rb:207`) uses `[x]` without `compact`. Only odd authored
data (a non-string `openFor`) would show the difference, but one helper (for example
`NpcHabits.gate_entries`, which already exists) would keep the four in step.

### Nit 3. The graph label's "held by" may list guards with no habit at all

`scripts/generate_dungeon_graph.rb:494`: `holders = open_for - noHold` includes an `openFor` NPC with
no level and no `habits` (careless by default, per plan 5.4). That is the correct behaviour, but the
label says "held by gary" whether Gary chose it or simply has no plan. Optional: "held by gary (no
level)" for those, so an author sees the default at work.

## Docs against code

- README "Careful guards" (`:152`) matches the code, including the 5 s turn-back
  (`GUARD_TURN_BACK_MS = 5000`, `door-gates.js:92`) and the both-sides behaviour. Its "give the
  player another way in" is advice the validator does not yet enforce (major 1).
- The schema descriptions of `awareness`, `habits.holdsDoors` and `gate.noHold` match the presets
  and the loader.
- The `door-gates.js` header (`:13-16`) matches `careful()`.
- The build log's round 1 section is accurate on every item checked above.

## Verdict

Not ready to merge as it stands; one fix away. The step 5 engine work meets the 5.4 contract,
every round 1 finding is closed or reasonably deferred, the engine changes cannot reach m01 to m10,
and nothing new reaches the server or the browser. The blocking item is major 1: the validator's
new "gate opens for the holder" rule hides the very soft-lock that `holdsDoors: false` creates, with
a reproduction in this review. Fix major 1 with its two test cases (which also closes minor 1);
minor 2 and the nits can follow.
