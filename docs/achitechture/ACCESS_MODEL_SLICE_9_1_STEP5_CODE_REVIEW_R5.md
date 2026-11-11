# Access model slice 9.1, step 5 (`holdsDoors`): code review, round 5 (final)

Branch `build/9-1-step5-holds-doors` at `fad918723`. The branch's own change is
`git diff 8dafe1863 HEAD` (31 files; `8dafe1863` is the merge base with
`claude/break-escape-access-design-090sjx`). A two-dot diff against the base branch also shows the
base branch's later voice-delivery work as deletions; none of that is part of this branch. Measured
against `docs/achitechture/ACCESS_MODEL_SLICE_9_1_PLAN.md` step 5 and section 5.4, and against the
round 4 review (`ACCESS_MODEL_SLICE_9_1_STEP5_CODE_REVIEW_R4.md`). Fresh reviewer; read-only on code.

Since round 4 only commit `7678f5118` changed code: `validate_scenario.rb`
(`check_lock_credentials`), `generate_dungeon_graph.rb` (the gate label), `npc_habits.rb`
(`gate_entries` now returns the door's `direction`) and two test files.

## How this was checked

- Tests run singly with plain `node` and Ruby 2.7.8p225 (`RBENV_VERSION=2.7.8`), all green:
  `door-gates-validator` (21, none skipped), `validator-npc-habits` (43), `door-gates-no-hold` (13),
  `door-gates` (22), `npc-route-multiroom` (21), `npc-stuck-detector` (14),
  `playtest-verify-run-access` (11), `dungeon-graph-habits` (8); `test/unit/npc_habits_test.rb`
  (30 runs, 120 assertions). Not run: `test/models/break_escape/npc_habits_loader_test.rb`, which
  needs the Rails test database.
- `ruby -wc` passes on every touched Ruby file. The four "assigned but unused variable" warnings in
  `validate_scenario.rb` (2279, 2589, 2592, 2601) are all present on the merge base too. No Ruby
  3-only syntax in the added lines: no endless methods, hash shorthand (`{ gate:, path: }` appears
  only in comments), pattern matching or anonymous argument forwarding; `filter_map` is 2.7 and
  `to_h` with a block is 2.6.
- The R3 and R4 probes rerun against the current branch (copied, not edited).
- New probes Q0 to Q8 in
  `/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/holds-r5/run.rb`,
  run against the branch and against a `git archive` of the merge base's `scripts` and `lib`
  (`.../holds-r5/base`).
- The dungeon graph for `test_access_habits`, regenerated from a scratch copy of the scenario
  (`.../holds-r5/graph`), matches the committed `dungeon_graph.json` and `.md` exactly. The full
  validator on that copy gives the one expected `store_b_badge` careful-guard warning
  (`PLAYTEST.md:66`). On `test_gate_tailgate` and `lab_physical_pentest` the branch and base give
  the same (no) lock-credential warnings.

## Severity table

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 1 |
| Nit | 1 |

## Round 4 findings: closed or not

| R4 finding | State | Evidence |
|---|---|---|
| Major 1, an object lock on an NPC card goes silent once the card's room has a tailgatable gate | Closed | `objects_requiring` (`validate_scenario.rb:1939-1942`) puts every rfid object lock on the card (room objects, nested `contents`, any NPC's `itemsHeld`, via `AccessIdentities.room_objects`) in `gap[:object]`, which no gate fills; its own warning names the object paths (`:2012-2017`). R4 probe P3 now warns "'rooms/vault/objects[0]' is locked with rfid 'SAM-1' ..."; P3b (object only) gives the same warning, not the generic one twice. Tests `door-gates-validator.test.mjs` "an object lock on a card whose room a careless guard opens is still a soft-lock" and its mirror with a cloner, a keycard item or a second accepted card |
| Minor 1, an NPC with no sprite counts as a gate opener | Closed | `room_npc_ids` (`:1947-1949`) keeps only `npcType` `person` or `both`, as `core/rooms.js:3311` and `game.rb:724` do. P1 (phone NPC in `openFor`) keeps the careful warning, P1b and `run2.rb` (no `npcType`) warn "no gate ... opens for an NPC". Test "a phone NPC or one with no npcType in openFor does not open the gate" |
| Minor 2, careful message on a room that also accepts a held card | Closed | `accepts_item` (`:1918-1920`) drops a room or object lock whose `requires` includes a card the player can hold as an item; `covered` (`:1977`) stops the generic message for such a room. P4 and R3 probe G give no warning. Test "a room whose requires also accepts an item card ..." |
| Nit 1, a side gate counts as a way in | Closed | `:1944` drops east and west gates; P2 now warns "no gate into 'vault' opens for an NPC". Test "a careless guard on an east or west gate is no way in" |
| Nit 2, graph label ignores `enabled: false` and `playerMayPassIf` | Closed | `generate_dungeon_graph.rb:484-498` walks `NpcHabits.gate_entries` (drops disabled gates) and skips a gate with a non-empty `playerMayPassIf`. Test `dungeon-graph-habits.test.mjs:135` |

The 21 malformed-data mutations in `holds-r4/mal.rb` still raise nothing, and each answer matches
the client's reading.

## Findings

### Minor 1. A gate entry that matches no doorway still counts as a way in

`scripts/validate_scenario.rb:1943-1944`, with `lib/break_escape/npc_habits.rb:207-224`. The
engine finds a door's `gate` only on the door entry whose `connectedRoom` **and** `direction` both
match the doorway it is building (`public/break_escape/js/systems/doors.js:493-495` and
`:564-566`). An entry with no `direction`, or with a direction that differs from the room's
`connections`, is never registered as a gate: the door stays an ordinary rfid door the player
cannot open. `gate_entries` takes every entry with a `gate` object, and the lock-credential check
drops only east and west, so it treats such an entry as a gate.

Reproduced (`holds-r5/run.rb`): a careless Sam carries `SAM-1`, `vault` requires it, no cloner, no
keycard. Q1 (the gate entry has no `direction`) and Q2 (the entry says `south`, the connection is
`north`) both return nothing on the branch; the merge base warns in both ("no item declares
card_id ... 'SAM-1'"). Nothing else in the validator says the gate is dead: the gate checks at
`:6274-6310` look at `access`, side doors and which side is locked, never whether the entry
matches a doorway, and the schema does not require `direction` on a door entry
(`scenario-schema.json:4004`). So the branch hides a soft-lock that base reported. It needs an
authoring slip (a forgotten `direction` is the likely one), hence minor; a `connectedRoom` typo
(Q3) still warns because no room matches.

Fix, either or both:

1. In `check_lock_credentials`, count a gate only when its `direction` is `north` or `south` and
   its room's `connections[direction]` (a string or a list) contains `connected_room`. A small
   helper beside the east/west filter at `:1944` does it.
2. Better for authors: in the gate block of the access-model checks (`:6274-6310`), warn when a
   door entry with an enabled `gate` has no `direction`, or a `direction` under which its room's
   `connections` does not list `connectedRoom` ("this gate matches no doorway, so the engine never
   sees it"). Add Q1 and Q2 as tests in `door-gates-validator.test.mjs`.

### Nit 1. In the mixed case, a lock outside the rooms' objects is not decided

`scripts/validate_scenario.rb:1974-1985`. When at least one room requires the card,
`objects_requiring` is the only place other locks are counted, and it walks room objects and NPCs'
`itemsHeld` alone. A locked rfid container in `startItemsInInventory` (or a lock on a door entry,
which `doors.js:526-527` honours though no scenario uses one) on the same card is passed in
silence once the room has a tailgatable gate. Probe Q8: base warns, the branch says nothing. The
comment at `:1974-1976` describes the generic message for exactly these locks, but that path runs
only when no room requires the card. Rare in practice; no mission has such a lock. Fix: compare
the card against the `credential_requires` walk and treat any requirer that is neither a room in
`rooms` nor a path in `objects_requiring` as a gap that no gate fills (the generic message, as when
no room requires it), or say in the comment that these locks are not checked in the mixed case.

## Merge-readiness pass over the whole diff

**Engine, `door-gates.js`.** The plan 5.4 contract holds. `normaliseGate` keeps `noHold` as a list
of strings and ignores any other value. `open()` sets `lastGuards` from the guards near before
`_applyBodies` reads it; `update()` tops it up only while open; `close()` clears it. `careful()` is
false with `playerMayPassIf`, with an empty `noHold`, or with nobody counting (an exit opening, a
clone with no guard near), and one holder among the guards is enough for not careful.
`openToPlayer` checks the clone window, then `playerMayPassIf`, then `!careful`; `_playerBarred`
puts the careful clause after the room test and the radius test, so a player inside the secured
room is never barred and leaving is unchanged. Traced by hand against `update()`: a careful guard
near with the player within the radius keeps the gate shut and goes to `_holdGuards` (turn-back
after 5 s); a gate open for her shuts on the tick the player comes within the radius unless a guard
is in the doorway (then it stays open but solid for him); the clone and exit windows hold it open
as before. `door-gates-no-hold.test.mjs` covers each of these, including the clone window ending
near and in the doorway. The approach margin change (8 to 16 px) only moves a walked-back guard
further inside the radius.

**Engine, `npc-behavior.js`.** `_arriveForRouteAction` and `_keepRouteLeg` act only when the
target waypoint's action is an `unlockRoom` for a room not yet loaded (`routeActionHasWork`). The
put-back compares `waypointIndex` with `routeLeg.waypoint + 1`, which is right: `routeLeg` is taken
before the path callback increments the index, and a random-mode route (no increment) or a
changed segment is left alone. The cut-leg block in `chooseWaypointTargetMultiRoom` fires only when
the leg is abandoned with path left (the stall re-target); normal arrival leaves
`pathIndex == currentPath.length`. Its `_haltForRoute()` call runs for any action, but the chooser
is about to set a new leg anyway, so it has no visible effect. No mission m01 to m10 has gates or
route actions.

**Server and reload.** No new endpoint and no new client-supplied field. `noHold` is written once
by `NpcHabits.expand!` inside `Game#prepare_scenario_data!` (`game.rb:807-813`) at creation, lives
in `scenario_data`, and so survives reload; a second `expand!` sees it as authored and leaves it.
`habits` and `awareness` stay stripped from room data. The gate stays what the base branch made it,
a client-side access control: `noHold` reaches the browser with the gate (the README already says a
gate keeps no secret), and nothing new is trusted from the client.

**Loader, schema, validator, graph, `verify-run --access`, README.** One reading of `openFor` and
`noHold` across `gate_entries`, `gate_no_hold`, `normaliseGate`, the graph label and
`verify-run.rb`'s `no_hold_gates`. The schema text, `README_scenario_design.md` ("Careful guards")
and `test_access_habits/PLAYTEST.md` match the code.

## Verdict

Merge. Every round 4 finding is closed in the code and tested, the engine and loader are sound,
nothing crashes on malformed data, and the touched tests pass on Ruby 2.7.8. Minor 1 is a real
but narrow case (a gate entry that matches no doorway) where the branch drops a warning base gave;
it is a few lines plus two tests and is best done before merge if another commit is going in
anyway, otherwise as the first follow-up. Nit 1 can follow or be documented.
