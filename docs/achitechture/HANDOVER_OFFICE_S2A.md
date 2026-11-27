# Handover: office life slice 2a (2026-11-06)

**Status: done, apart from the lab live regression (Open 1).** Plan: `OFFICE_LIFE_PLAN.md` 7.2
(as revised in section 8); its Built line has the live evidence.

## Done
- Step 1: amendment review folded into the plan, section 8 added (860bd16e7).
- Step 2: workstation globals reset by name at install for stations in unloaded rooms (e74fb409d).
- Step 3 engine: leash and private objects in `npc-needs.js`, one `_planMovePath` helper used at the
  four planning points in `npc-behavior.js`, `findWorldPath(..., avoidNPCs, { avoidRooms })` with
  inner floor rings in `npc-pathfinding.js` (helpers `roomFloorRect`, `onFloor`, `floorRingCells`
  in `path-avoid.js`), `createRoom` keeps `needsPrivateTo` on `window.rooms[id]`; schema;
  `validate_npc_needs.rb` checks; `validate_scenario.rb` known fields (42575dda0).
- Tests: `npc-needs.test.mjs`, `npc-room-leash.test.mjs`, `npc-pathfinding-world-grid.test.mjs`,
  `path-avoid.test.mjs`, `validator-npc-leash.test.mjs`; door-gates stub fix (a80dbb358).
- `scenarios/test_needs_leash` (2af3d7493) and first live proof on game 583.
- Debug overlay `leashed` label: `job.leashed` set in `_startJob`, shown by `jobLabel` (also when
  idle with a `leashNoted` need), exposed in `getState().job.leashed`; node tests (02f304b7c).
- `test_needs_sims` showcase: private PCs, lounge `needsPrivateTo: ["rosa","grace"]`,
  `lounge_kettle` (lounge (1,3), useFrom dx 1), `kitchen_coffee` moved (6,8) → (3,8), a
  `deadline_memo` note whose `object_interacted` mappings (Tom, Amara) set caffeine to 20, task
  `see_long_way` via two `npc_used:kitchen_coffee` mappings on `data.npcId` (02f304b7c).
- Sims node fixture follows the scenario (live cells from game 585) plus a node test of the memo
  beat (2e4a7a190).
- `test_needs_leash` cooler moved to (8,2); live re-proof both directions on game 587.
- Live sims run, game 585. Docs: plan Built line, NPC_NEEDS_SYSTEM.md (overlay label, mapping
  advice, live proof), sims README (step 8, slice 2a table).

## Open
1. **Live regression of `lab_physical_pentest`** (critical path to score 100, Len's route) was not
   run. Its expansion step 2 (20x10 accounts floor, 2ea86f714) landed during this session and
   the expansion agent owns that playtest; run it, or fold it into theirs, once that step settles.
   Slice 2a touches the lab only through the behaviour helper and `findWorldPath` (no leash fields
   there, so `avoidRooms` is always empty).
2. Optional: a `leashed` entry for route-only cut-offs (plan 7.2 difference 1).

## Gotchas
- The bootstrap scenario strips room fields it does not list (`Game#filtered_scenario_for_bootstrap`)
  and unloaded rooms' objects and NPCs; client code cannot see them.
- A new scenario needs `bin/rails runner db/seeds.rb </dev/null` before `new-game.rb` (stdin closed
  keeps the prune prompt from deleting anything). Do not rerun seeds without the user's say-so.
- Tests that stub `path-avoid.js` with a data URL (door-gates) must list every export npc-pathfinding imports.
- A needs NPC walking home yields to a nearby player (state `face_player`): move the player off the
  route before reading "stuck". Game 587 lost two returns to this.
- `test_needs_leash` has no `bootstrap` cutscene: close the title screen and the brief with
  `MinigameFramework.endMinigame`, then click `#tutorial-no`. The harness `dismiss` does not close
  the notes reader the memo opens; `endMinigame` does.
- `object_interacted` carries `objectType`, `objectName`, `roomId` (no object id): key memo-style
  mappings on `data.objectName`.
