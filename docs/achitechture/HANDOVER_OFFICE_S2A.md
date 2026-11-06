# Handover: office life slice 2a (2026-11-06)

Stopped at the context limit. Plan: `OFFICE_LIFE_PLAN.md` 7.2 (as revised in section 8).

## Done
- Step 1: amendment review folded into the plan, section 8 added (860bd16e7).
- Step 2: workstation globals reset by name at install for stations in unloaded rooms (e74fb409d).
- Step 3 engine: leash and private objects in `npc-needs.js`, one `_planMovePath` helper used at the
  four planning points in `npc-behavior.js`, `findWorldPath(..., avoidNPCs, { avoidRooms })` with
  inner floor rings in `npc-pathfinding.js` (helpers `roomFloorRect`, `onFloor`, `floorRingCells`
  in `path-avoid.js`), `createRoom` keeps `needsPrivateTo` on `window.rooms[id]`; schema;
  `validate_npc_needs.rb` checks; `validate_scenario.rb` known fields (42575dda0).
- Tests: `npc-needs.test.mjs` (10 leash tests), `npc-room-leash.test.mjs` (behaviour),
  `npc-pathfinding-world-grid.test.mjs` (rings, finally), `path-avoid.test.mjs` (entered-cell model,
  cornerless leak), `validator-npc-leash.test.mjs`; door-gates stub fix (a80dbb358). Full suite 383/383.
- `scenarios/test_needs_leash` (2af3d7493) and live proof on game 583 (plan 7.2 Built line).
- Docs: NPC_NEEDS_SYSTEM.md, README_scenario_design.md, plan Built line (this commit).

## Open
1. `test_needs_sims` showcase per plan 7.2 "Showcase": PCs `private: true`; lounge
   `needsPrivateTo: ["rosa","grace"]`; `lounge_kettle` nearer Tom's/Amara's desks than
   `kitchen_coffee`; a note mapping that drops both caffeine levels; objective on
   `npc_used:kitchen_coffee` for Tom or Amara (check whether eventMappings can condition on
   `data.npcId`; if not, map on Tom's own NPC eventMappings). Re-run the README live-proof table
   (open both doors first; re-check the contention row 63). Update the sims node fixture if its
   objects change.
2. Live regression: `lab_physical_pentest` open plan unchanged (no leash fields there, so only the
   behaviour-helper and pathfinding paths changed). Another agent was editing that scenario.
3. Optional: "leashed" on the debug overlay's job label; `leashed` for route-only cut-offs.
4. Move the cooler in `test_needs_leash` to the store's north-east so the outbound leg also
   differs (now only the return leg contrasts: leashed corridor, unleashed through Maya's office).

## Gotchas
- The bootstrap scenario strips room fields it does not list (`Game#filtered_scenario_for_bootstrap`)
  and unloaded rooms' objects and NPCs; client code cannot see them.
- A new scenario needs `bin/rails runner db/seeds.rb </dev/null` before `new-game.rb` (stdin closed
  keeps the prune prompt from deleting anything).
- Tests that stub `path-avoid.js` with a data URL (door-gates) must list every export npc-pathfinding imports.
- A needs NPC walking home yields to a nearby player: move the player away before reading "stuck".
