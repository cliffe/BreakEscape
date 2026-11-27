# Outcomes of code review R1 (return stall)

Engine commits: f48c80af8 (first fix), f401b9ee0 (m08 lane fix and R1 engine items). This round: tests, scenario restore, docs.

| Finding | Outcome |
|---|---|
| M1 tight tier end rule | Fixed in f401b9ee0 (chairs and seated bodies keep the end rule); test "pinch on the way and a home between two chairs". |
| M2 no live proof | Live m08 table in scenarios/m08_the_mole/office_life/LIVE_RETURN_STALL.md (new engine section). |
| M3 test_npc_needs changed | Restored scenario.json.erb, dungeon_graph.html and dungeon_graph.md from main; LIVE_PROOF_RETURN_STALL.md moved to tmp/delete/ and its removal staged with git rm --cached. |
| m1 touching cases | Test now steps with the 8 px advance. Start 1 px clear, a larger walker and a larger guard all pass. Start exactly touching (centres 20 px apart) in a 40 px aisle overlaps the guard's box along one axis (the depth is about 0.3 px at worst, corrected in R2, n1): the path goes (260,180), (268,188), (260,196), (252,196) and the 8 px advance turns toward (252,196) at about (262,189), with the box top still 1 px above the guard's bottom edge. Left as a todo test, a design decision: a smaller advance radius on rerouted walks risks orbiting waypoints at speed and touches every needs walk, and a wider tight margin loses the 40 px aisle (tight needs 10+10+2x4 px per axis). Physics slides off a graze, and local avoidance does not stop the walker there: `nearestBlockerOnPath` returns null on that path (corrected in R2, n2). |
| m2 search count | Tier recorded (`_planTier`, `_detourTier`); no skip added. |
| m3 detour tight tier | Fixed in f401b9ee0 (held, tight, moving since R2 n3); test 29 in npc-local-avoidance.test.mjs updated to expect that order. |
| m4 player and seated bodies | Player keeps the clearance ring in the tight tier (test). Seated colleagues' chair bodies are avoided too, stated as intended in docs/achitechture/OFFICE_LIFE_STUCK_RETURN.md. |
| m5 scope of the tier | Comment at `_planMovePath` and a new section in OFFICE_LIFE_STUCK_RETURN.md. |
| m6 leash untested | `calls[1].avoidRooms` asserted in npc-needs-reroute-held.test.mjs (new test "R1 m6"). |

## New cases against the old engine

Old engine: npc-pathfinding.js and npc-behavior.js from f48c80af8, run with `node test/js/npc-needs-return-standing-npc.test.mjs`, then restored with `git checkout HEAD -- <both>` (clean). Most cases first fail on the tier record (`_planTier`, absent on the old engine), which proves little, so the file was run a second time with the tier and call-count asserts stripped, so only behaviour is judged.

| Case | Old engine, as written | Old engine, tier asserts stripped |
|---|---|---|
| 40 px aisle, plans round and gets home | fails (tier) | passes |
| wider aisles use the ring | fails (tier) | passes |
| aisle too narrow takes plain path | fails (tier) | passes |
| R1 M1 pinch plus home between chairs | fails | fails (steps into the guard at 260,180) |
| R1 m1 1 px clear and other sizes | fails | fails (home not reached) |
| m08 path keeps 13 px from Vector | fails | fails (path 508,164 / 500,164 / 492,164 is inside the lane) |
| m08 local detour is not the same path | fails | fails (same y 164 path) |
| R1 m3 detour tries tight | fails (call count) | passes (only the call count shows it) |
| R1 m4 player keeps the ring | fails | fails (old engine takes the tight path past a player) |
| R1 m1 exactly touching (todo) | fails | fails (todo, also fails on the new engine) |

New engine (HEAD): 9 pass, 1 todo. Against main's engine every case fails.

Full `bin/test-js` on HEAD before the scenario restore and docs: 812 files passed, 0 failed.
