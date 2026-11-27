# Access model slice 9.1, step 5 (`holdsDoors`): code review, round 1

Branch `build/9-1-step5-holds-doors`, reviewed as
`git diff claude/break-escape-access-design-090sjx build/9-1-step5-holds-doors` (27 files). Measured
against `docs/achitechture/ACCESS_MODEL_SLICE_9_1_PLAN.md` section 5.4 (including its six-item
contract), section 7, step 5 and beat H9 in section 11.

Read-only review: no code edited. Tests run singly on Ruby 2.7.8p225, all green:
`door-gates-no-hold` (8), `door-gates` (22), `door-gates-player-open` (12), `door-gates-sound` (11),
`door-gates-validator` (4), `npc-stuck-detector` (14), `npc-route-multiroom` (20),
`validator-npc-habits` (39), `dungeon-graph-habits` (7), `playtest-verify-run-access` (10),
`test-bridge-access` (10); `test/unit/npc_habits_test.rb` (28 runs),
`test/models/break_escape/npc_habits_loader_test.rb` (10),
`test/models/break_escape/access_model_withholding_test.rb` (15). `ruby -wc` passes on every
touched Ruby file and no Ruby 3-only syntax was found (`to_h` with a block is 2.6,
`filter_map` is 2.7; the one `gate:,` match is in a comment).

## Severity table

| Severity | Count |
|---|---|
| Blocker | 0 |
| Major | 0 |
| Minor | 5 |
| Nit | 6 |

## How widely the two engine changes run

Both changes are narrow in practice, which is the main reason there is no major finding.

- **Gate approach point** (`door-gates.js:103`, `:475`). `approachPoint` is called only from
  `NPCBehavior._approachRouteGate`, which only runs for an `openFor` NPC on a multi-room route whose
  leg is unreachable. Only three scenarios have gates: `test_gate_tailgate` (radius 56, so the spot
  moves from 48 px to 40 px), `test_access_habits` (radius 80, unchanged at 48 px) and
  `lab_physical_pentest` (radius 72, unchanged at 48 px). m01 to m10 have no gates. For a north door
  the centre is `room.y + 32`, so 40 px lands in the first floor row as 48 px did; for a south door
  the spot stays in the same tile row. No regression found.
- **Route action arrival and leg restore** (`npc-behavior.js:44`, `:1391`, `:1411`, `:1768`). The
  new behaviour only acts when `routeActionHasWork` is true: a waypoint action with an `unlockRoom`
  whose room is not in `window.rooms`. Waypoint actions exist only in `test_access_habits`,
  `test_gate_tailgate` and `lab_physical_pentest`; m01 to m10 have no multi-room routes at all
  (`multiRoom` appears in `test-multiroom-npc`, `test_npc_avoidance` and the three above). Single-room
  patrols, random patrols and needs-driven `goToAndStay` moves never set `routeAction`, so they are
  untouched. The cut-short block in `chooseWaypointTargetMultiRoom` only runs on the stall
  re-target (`intervalElapsed && _patrolStalled`), because the other trigger (`currentPath.length
  === 0`) fails its guard. In random `waypointMode` the index is never stepped, so `_keepRouteLeg`
  is a no-op there. The worst case is an action waypoint that is unreachable by more than 1.5 tiles
  for good: the NPC now re-walks the leg for ever instead of skipping the action and then waiting at
  the unloaded room for ever. Neither moves on, so this is no worse than before.

## Contract items checked in the code

1. `openToPlayer` is still the only "may the player pass" question; `blocksPlayer` asks it
   (`door-gates.js:353`). Met.
2. The body rule is in place; `open()` sets `lastGuards` before `_applyBodies`, so the body is solid
   for an outside player on the opening tick (`door-gates.js:430-433`, and the test "only a noHold
   guard in lastGuards"). Met.
3. Unchanged door work. Met.
4. A clone hold answers yes first in `openToPlayer` (`:527`). Met.
5. `open()` and `close()` are the only writers of `lastGuards` apart from the per-tick add, and the
   add runs only while `g.open` (`:786`). Met.
6. `_playerBarred` gains the `careful` clause after the `playerMayPassIf` clause (`:746`), and both
   `update()` branches read the one `barred` value. Met.

Areas the builder did not observe live, checked in the code:

- **Gate shutting after the clone window ends.** `playerOpen()` opens through `open()`, so
  `lastGuards` is the guards near at the click, and the per-tick add keeps adding while the window
  runs. When the window ends: if `lastGuards` is empty the gate is not careful and lingers as any
  gate (the documented harmless case); if it holds only careful guards and the player is within the
  radius, `barred` is true and the gate shuts on the first tick nobody is in the doorway; a player
  part way across keeps it open through `playerHoldsDoorway`, and the overlap exception in
  `_applyBodies` never turns the body on under him. So nobody is trapped and the bar comes back as
  intended. Not tested; see minor 2.
- **A sight challenge firing while the player waits at the door.** H9's guards have no `los`, so
  nothing fires there. In `test_gate_tailgate` Sam's `challengeOnSight` with `closeDoor` reaches only
  the `playerMayPassIf` gate, where `careful()` returns false on its first test
  (`cfg.playerMayPassIf`), so step 5 changes nothing on that path. `doorGates.update` and
  `_holdGuards` run on `Date.now()` every frame regardless of a conversation, so a guard can be
  turned back while the challenge conversation is open; that is the door work's behaviour and is
  unchanged by this branch.

## Findings

### Minor 1. The soft-lock warning is now silenced for every card any room NPC carries

`scripts/validate_scenario.rb:1905`:
`declared['rfid'].merge(ai.cards(json_data).keys.map(&:to_s))`.

The commit is described as covering "a gate whose required card its guard carries", but the line
treats any card carried by any room NPC as a declared credential for every rfid lock, gate or not,
whether or not the scenario has an RFID cloner or any other way to get that card. Run over the
scenarios, it removes the "nothing in the scenario can open it" warning for `server_room_keycard`
and `facility_keycard_level1` (m04), `employee_badge` (m05), `server_zone_badge` (m07 and m08) and
`cm_records_badge` (`lab_physical_pentest`). Those are most likely clone targets, so the old warnings
were probably false positives, but a real soft-lock (an NPC card with no cloner and no gate) would
now pass silently. The ℹ️ "Identity reach" line still prints, but it is an info line, not a warning.

Fix: only count an NPC's card as declared when the scenario can turn it into a player credential: an
`rfid_cloner` object or start item exists, or the lock is a gate door whose `openFor` includes a
holder. Otherwise keep the warning, perhaps reworded to "only an NPC carries it; add a cloner".

### Minor 2. No test of a careful gate when a clone window ends, and no live run

`test/js/door-gates-no-hold.test.mjs`, last test ("A clone hold answers yes first"), stops at
`openToPlayer === true` during the window. Nothing checks what happens at `playerHoldUntil`: the
shut-at-once case (careful guard in `lastGuards`, player within the radius, not in the doorway), the
linger case (empty `lastGuards`), or the mid-crossing case (player overlapping the doorway keeps it
open and the body is not switched on under him). H9 has no cloner, so the live run could not reach
it either. The code reasoning above says it behaves; a regression in the window-end ordering of
`update()` would not be caught.

The plan's case "after the gate has closed and opened for a guard who holds, `openToPlayer` is true"
is only half covered: the test opens for Gary from a fresh gate, not after a careful period has
closed, so a `close()` that stopped clearing `lastGuards` would only be caught by the earlier
`lastGuards` test, not by an `openToPlayer` assertion.

Fix: add three cases: careful clone window ending with the player near (shut on that tick), ending
with the player in the doorway (stays open, `bodyOff` stays true until he steps off), and Sara opens,
closes, then Gary opens with the player near (`openToPlayer` true).

### Minor 3. A player loitering outside a careful gate can keep the guard inside the secured room for good

`door-gates.js:722-727` with `:741-747`. While the gate is shut, `careful()` counts the guards near,
wherever they stand. Sara on her way out of `store_b` comes within the radius from inside; the
player waiting outside is within the radius, so `barred` is true, the gate stays shut, and after
5 s `turnBackFromGate` sends her back round `store_b`'s waypoints (the far-side turn-back the door
work tests). She tries again, meets the same player, and turns back again, indefinitely. This
matches the plan's rule ("she will not open her door with the player close by") and the same
happens today at a `playerMayPassIf` gate, so it is not a bug against the plan. It is, though, a new
way to trap a guard that a mission author using `awareness: "high"` would not expect, since the
habit is described only as keeping the player out.

Fix: either document it in the README "Careful guards" paragraph ("a careful guard inside will not
come out while the player waits at the door"), or, if it is unwanted, exempt a guard standing in the
secured room from the shut-state count (she opens to leave, and the body rule and the shut-at-once
still keep the player out).

### Minor 4. The approach test models an ideal snap; a blocked cell in front of the door can still leave the guard on the radius edge

`test/js/door-gates.test.mjs`, "stopping short of the spot still leaves the guard inside the radius",
snaps the spot to the 8 px cell containing it. The engine snaps with
`findNearestWalkableWorldCell` (`npc-behavior.js`, `_approachRouteGate`), which moves the spot to
the nearest walkable cell when the one in front of the door is blocked (a prop, another NPC). That
cell can be further out than the 16 px margin, and the `< 8 px` "nothing to walk" check then backs
off as before. The change fixes the case seen (radius 56, an open floor), which is what it set out
to do; the test's claim "still leaves the guard inside the radius" is stronger than what is proved.

Fix: either reword the test name to say "on open floor", or, in `_approachRouteGate`, drop the
approach when the snapped `dest` is outside `openRadius - 8` and log it, so the leg retries rather
than parks the guard out of reach.

### Minor 5. Every NPC with a level now prints a "holdsDoors ... no effect" line in the habits report

`scripts/validate_npc_habits.rb:491-503` (`door_effects`), fed by the presets in
`lib/break_escape/npc_habits.rb:33-35`. On `test_access_habits` the report has eight lines of
"holdsDoors true (preset) / no effect: no gate opens for it". Over twenty awareness-course
scenarios (`ca00` to `ca18` and the `ca_post_*` set) give NPCs a level and none has a gate, so each
of their reports gains one dead line per NPC. This is information, not a warning, but it buries the
lines that matter.

Fix: when `holdsDoors` comes from the preset and no gate opens for the NPC, omit the line (keep it
when the value is explicit, where the warning already speaks).

### Nit 1. The cut-short block stops the NPC without idling its animation

`npc-behavior.js:1770-1772` sets velocity to zero and `isMoving = false` but does not call
`playAnimation('idle', ...)`, unlike `_haltForRoute` and `_stopHere`. When the action's room is
already loaded (every pass of a `lab_physical_pentest` guard after the first) the code falls
through to choose the next leg, and the walk animation can play in place until the new path
arrives. Fix: call `this._haltForRoute()` there.

### Nit 2. `state()` does not expose `lastGuards` or `careful`

`door-gates.js:331`. Playtests sampled `openToPlayer && !blocksPlayer` by `eval`; adding
`lastGuards: [...g.lastGuards]` and `careful: this.careful(g)` to `state()` would let a scripted run
assert who the open period belongs to without reaching into the group.

### Nit 3. `nearGuardIds` duplicates `_npcNear`

`door-gates.js:694-714`. `_npcNear(g)` is `nearGuardIds(g).length > 0`; keeping two copies of the
distance rule invites drift (for example, one gaining a room check and not the other).

### Nit 4. Two validator gaps around authored `noHold`

`scripts/validate_npc_habits.rb:172-205`. An authored `gate.noHold` on a gate that also has
`playerMayPassIf` is ignored by the client (`careful()` returns false) and draws no warning. And
`check_holds_doors` warns "the habit does nothing" when an authored `noHold` already lists the same
NPC, where the outcome matches the habit; the wording could say "already listed in the authored
noHold" instead.

### Nit 5. README wording

`README_scenario_design.md:152` switches between "her" (the guard) and "he" (the player) inside one
sentence, which reads as one person. "Cannot be tailgated at all" is slightly stronger than the code:
a gate opened by an exit click or by a clone with no guard near is not careful (the plan calls this
harmless). Suggest "the player" in place of "he", and "cannot be tailgated behind her".

### Nit 6. The H9 store sign overstates what the gate protects

`scenarios/test_access_habits/scenario.json.erb:1380`: "You should not be able to read this in the H9
run". After Sara's route unlock, `store_b` is in the player's `unlockedRooms`, and the server's npc
unlock path takes any `attempt: "sara"` because of the `sara_never_fires` `unlockDoor` mapping
(`game.rb:2141`, `npc_mapping_unlocks_door?`), so `/room/store_b` and its sign are reachable without
walking through the gate. This is the documented position (a gate bars the body, not the data;
plan 5.4 and README), and nothing in step 5 adds a server trust gap; the sign text just should not
read like an assertion a tester could check. Suggest "you should not have walked in here".

## Other checks with no finding

- **Server side.** Nothing in this branch adds an endpoint or a client-supplied field. `noHold` is
  written only by `NpcHabits.expand!` from server-held scenario data inside
  `Game#prepare_scenario_data!` and is never read back from the client. The gate's door data is
  passed through unchanged by the room endpoint.
- **Reload.** `noHold` lives in the saved `scenario_data`, so it survives a reload; `lastGuards` is
  per session and every gate starts shut, which is the safe state. `expand!` is idempotent: a
  second pass sees the written `noHold` as authored and leaves it (tested).
- **Loader.** A guard with no level and no `habits` gets no plan, so `holds[id]` is nil and she is
  not listed, as the plan requires. A string `openFor` and a non-object `doors` or `gate` are
  handled. `enabled: false` gates are skipped, as the client skips them.
- **Effects on other scenarios.** Of the three gated scenarios, only H9's two gates lack
  `playerMayPassIf`, so only `store_b`'s gate gets a `noHold`. The preset now writes `holdsDoors`
  into the saved `habits` of every NPC with a level, which is server-side only.
- **Dungeon graph and verify-run.** The label and the `--access` gate line read the expanded copy
  and the saved scenario respectively, as the plan asks.

## Verdict

Approve with minor fixes. The step meets the 5.4 contract and the plan's file list, the seven
`door-gates.js` edits are as specified, and the two engine changes cannot reach m01 to m10 (no
gates, no route actions, no multi-room routes there). Before merge I would fix minor 1 (narrow the
soft-lock suppression) and add the clone-window tests in minor 2; minors 3 to 5 and the nits can go
in a follow-up.
