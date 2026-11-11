# Access model slice 9.1, step 5 (`holdsDoors`): code review, round 4

Branch `build/9-1-step5-holds-doors` at `2fa8f7bbc`, reviewed as
`git diff claude/break-escape-access-design-090sjx build/9-1-step5-holds-doors` (30 files). Measured
against `docs/achitechture/ACCESS_MODEL_SLICE_9_1_PLAN.md` step 5 and section 5.4, and against the
round 3 review (`ACCESS_MODEL_SLICE_9_1_STEP5_CODE_REVIEW_R3.md`). Fresh reviewer; read-only on code.

Since round 3 only the validator (`validate_scenario.rb`, `validate_npc_habits.rb`), one loader
helper (`NpcHabits.gate_no_hold`), three test files and the build log have changed
(`git diff c3edb0b09 HEAD`). `door-gates.js` and `npc-behavior.js` are as rounds 2 and 3 reviewed
them; I re-read their diff against base and found nothing new.

Tests run singly on Ruby 2.7.8p225 (`RBENV_VERSION=2.7.8`), all green: `door-gates-validator` (16),
`validator-npc-habits` (43), `door-gates-no-hold` (13), `door-gates` (22), `npc-route-multiroom`
(21), `npc-stuck-detector` (14), `playtest-verify-run-access` (11), `dungeon-graph-habits` (7);
`test/unit/npc_habits_test.rb` (30 runs, 120 assertions). Not run: the loader model test
(`test/models/break_escape/npc_habits_loader_test.rb`), which needs the Rails test database.
`ruby -wc` passes on every touched Ruby file; the three "unused variable" warnings in
`validate_scenario.rb` (2253, 2563, 2566) were there before this branch. No Ruby 3-only syntax in
the added lines: no endless methods, hash shorthand, pattern matching or anonymous argument
forwarding; `filter_map` is 2.7 and `to_h` with a block is 2.6. The full validator on
`scenarios/test_access_habits` gives the one expected `store_b_badge` careful-guard warning, as
`PLAYTEST.md:66` records.

Probes (they call `check_lock_credentials` directly) are in
`/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/4ecd98f2-4e95-460a-a7ea-2031ffddfff5/scratchpad/holds-r4/run.rb`
(shapes P1 to P12), `.../holds-r4/run2.rb` (NPC with no `npcType`) and `.../holds-r4/mal.rb`
(21 malformed-data mutations).

## Severity table

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 1 |
| Minor | 2 |
| Nit | 2 |

## Round 3 findings: closed or not

Checked in the code and by rerunning the R3 probes (`holds-r3/run.rb`, `run2.rb`) against the
current branch.

| R3 finding | State | Evidence |
|---|---|---|
| Major 1, careful-gate check per card, not per room | Closed | `validate_scenario.rb:1954-1965` loops over each locked room that requires the card and decides it from the gates into that room alone. R3 probes B (careless gate into `vault`, careful-only into `vault2`) and C (authored `noHold` on one of two gates) now warn and name `vault2`. Tests `door-gates-validator.test.mjs:166`, `:181`, `:195` |
| Minor 1, careless non-holder in `openFor` ignored | Closed | `gate_state` (`validate_scenario.rb:1935-1943`) counts every `openFor` id that is a room NPC, card or not. R3 probe A gives no warning; probe E (`ghost`) still warns. Tests `:204`, `:217` |
| Nit 1, non-array `noHold` read three ways | Closed | One reader, `NpcHabits.gate_no_hold` (`npc_habits.rb:241`), used by the validator and `doors_entry`; it matches `normaliseGate` (`door-gates.js:122`). `check_gate_no_hold` (`validate_npc_habits.rb:202-208`) now warns on a non-list. Tests `door-gates-validator.test.mjs:224`, `validator-npc-habits.test.mjs`, `npc_habits_test.rb` |
| Nit 2, comment and message overstate the check | Closed | Comment `validate_scenario.rb:1899-1911` now says "a warning heuristic, not a proof of solvability" and names what is not checked; the careful message says "likely stuck" and "Unless another way in exists" |

## Findings

### Major 1. Once a room behind an NPC card has a tailgatable gate, an object lock on the same card goes silent

`scripts/validate_scenario.rb:1954-1971`. The per-card loop only looks at rooms
(`rooms_requiring`). When at least one room requires the card, a non-room lock that requires it
(a safe, a cabinet, a locked container) adds nothing to `gap`; if every room has an open gate,
the card is added to `declared['rfid']` and the object lock is passed in silence. Tailgating puts
the player in a room and never gives him the card, so an rfid object lock on that card has no
way open.

Reproduced (probe P3): Sam (`awareness: low`, carries `SAM-1`) holds the north gate into `vault`
(`rfid`, `requires: "SAM-1"`); inside `vault` is a safe, `locked`, `rfid`, `requires: "SAM-1"`;
no cloner, no keycard. `check_lock_credentials` returns nothing. Base warns ("no item declares
card_id 'SAM-1'"), so the branch loses a true warning. Drop the room's lock and keep the safe
(P3b) and the branch warns correctly, which shows the gap is only the mixed case. A badge-locked
office with a badge-locked cabinet inside it is a natural mission shape, and step 5 invites
authors to put tailgate gates on exactly such rooms. This gap has been there since round 1 (the
per-card rule had it too); round 3's per-room rewrite did not add it but did not close it either.

Fix: before or after the room loop, ask whether any lock that is not a room requires the card
(`ai.locks(json_data)` already returns `kind: 'object'` entries; keep `kind: 'door'` for rooms)
and, if so, record it as a gap that no gate can fill, for example `gap[:npc_only] << nil` or a
new `:object` bucket with its own message naming the object path ("tailgating does not give the
card, so the player cannot open <object>"). Add P3 as a test in
`door-gates-validator.test.mjs` (warns) with its mirror P3 plus a cloner (no warning).

### Minor 1. An NPC with no sprite in `openFor` counts as a guard who opens the gate

`scripts/validate_scenario.rb:1932-1933`. `room_npc_ids` takes every room NPC with an id. The
client only opens a gate for an NPC with a live, visible sprite (`nearGuardIds`,
`door-gates.js:701-710`, via `npcSprite`), and a sprite is created only for `npcType` `person` or
`both` (`core/rooms.js:3311`). A phone NPC, or an NPC with no `npcType` at all (the
`npc-manager.js:260` default is `phone`), never comes near a door.

Reproduced: P1 (a careless phone NPC `pip` added to the `openFor` of a careful Sam's gate), P1b
(a phone NPC is the only holder and the only `openFor`), and `run2.rb` (a careless holder with no
`npcType`). All three return nothing; base warned in each; in the game the gate never opens for
that NPC, so the room is a soft-lock. Less likely than Major 1 (an author has to put a phone
contact or a half-written NPC in `openFor`), hence minor.

Fix: build `room_npc_ids` from NPCs whose `npcType` is `person` or `both`, as `rooms.js` does,
and add P1 (careful warning stays) as a test. `behavior.initiallyHidden` can stay counted: such an
NPC may be revealed later, which is the heuristic's business.

### Minor 2. The careful-guard message says the player is likely stuck when the room also accepts a card he can hold

`scripts/validate_scenario.rb:1960-1965` and `:1981-1984`. A room's `requires` can be a list.
The room loop decides each room only from its gates, never from the other ids in its
`requires`. Probe P4 (R3 probe G as well): `vault` requires `["SAM-1", "OTHER"]`, the player
starts with a keycard `OTHER`, Sam is careful. The validator warns "every gate into 'vault' opens
only for careful guards ... the player is likely stuck there", which is false: the keycard opens
the door. Base warned here too (generic "no item declares 'SAM-1'"), so the branch is no less
strict, but the new message states a wrong cause. The same applies to the "only an NPC carries
that card" message for a room with no gate.

Fix: in the room loop, skip a room any of whose `requires` ids is already in `declared['rfid']`
(an item, or a cloner-declared card). Add P4 as a no-warning test.

### Nit 1. A side gate counts as a way in

`scripts/validate_scenario.rb:1935-1943`. `gate_state` ignores the door's direction, but
`register()` declines a gate on an east or west door and it stays an ordinary locked door
(`door-gates.js:225-232`). Probe P2 (a careless holder on an east gate) draws no lock-credential
warning. The author still sees the separate side-gate warning (`validate_scenario.rb:6271-6275`),
so nothing is hidden, only told once instead of twice. Fix: treat a gate whose door direction is
`east` or `west` as no gate (keep the door, direction and path in `gate_entries` or pass the door
in).

### Nit 2. The graph label ignores `enabled: false` and `playerMayPassIf`

`scripts/generate_dungeon_graph.rb:483-500`. The label walks raw door entries, so a disabled gate
with an authored `noHold`, or a gate with both `playerMayPassIf` and an authored `noHold` (which
`check_gate_no_hold` already warns about, and the client ignores), is labelled "not held by ...".
Fix: walk `NpcHabits.gate_entries(habits_copy)` (it already drops disabled gates) and skip a gate
whose `playerMayPassIf` is a non-empty string.

## Malformed data

`mal.rb` mutates the base fixture 21 ways (string or hash `npcs` entries, numeric `openFor`, hash
`noHold`, `doors` as a hash or with `nil`, a room that is an array or `nil`, `requires` `nil` or a
hash, a string `rfidCard`, a string `habits`, a numeric `awareness`, a numeric NPC id, `rooms` as
an array or `nil`, a numeric `playerMayPassIf`, an array `connectedRoom`, malformed `roles` and
`role`). None raises. Each result agrees with the client's reading where there is one (a hash
`noHold` is ignored, so the gate holds doors and no warning is right; a numeric `playerMayPassIf`
is not a pass, so the careful warning is right).

Other probe shapes behaved correctly: an empty `playerMayPassIf` counts as none (P7, warns, as
`normaliseGate` reads it); `enabled: false` is no gate (P8, warns); a gate authored on the far side
(P5) and a mirror gate on the locked room's side (P9) still warn here, and `check_access_model`
reports the misplaced gate as an error. P12 (a room with `locked: false` still checked) and P11
(an integer card id falls through to the generic message) behave as base does and are not counted.

## Merge-readiness pass over the whole diff

- Engine: contract items 1 to 6 of plan 5.4 still hold in `door-gates.js` (`lastGuards` set in
  `open()` before `_applyBodies`, cleared in `close()`, topped up per tick only while open;
  `openToPlayer` checks the clone window, then `playerMayPassIf`, then `!careful`;
  `_playerBarred` adds the careful clause after the `playerMayPassIf` clause). The two
  `npc-behavior.js` changes (`_arriveForRouteAction`, `_keepRouteLeg`) act only on a route
  waypoint whose `unlockRoom` room is not loaded, so they touch no mission without route actions.
- Server: no new endpoint, no new client-supplied field. `habits` and `awareness` stay stripped
  from room data; the filled `noHold` lives in `scenario_data` and survives reload.
- Loader, schema, `verify-run --access`, graph and README agree on one reading of `openFor` and
  `noHold`. Docs (`README_scenario_design.md`, `test_gate_tailgate/README.md`,
  `test_access_habits/PLAYTEST.md`) match the code.
- m01 to m10 have no gates and no route actions, so neither engine change nor the validator rule
  reaches them; the build log's 84-run comparison against base is consistent with this.

## Verdict

Do not merge yet. Every round 3 finding is closed in the code, the engine and loader are sound,
and nothing crashes on malformed data. Major 1 is a last soft-lock that the branch hides where
base did not: an rfid object lock on a card whose room can be tailgated. It is a small, local
change to `check_lock_credentials` (count object locks on the card as a gap no gate fills) plus
two tests. Minor 1 (`npcType` filter on `room_npc_ids`) and Minor 2 (skip rooms that another
declared card opens) belong in the same edit and test file. The nits can follow or be dropped.
With Major 1 fixed and tested, this is ready to merge.
