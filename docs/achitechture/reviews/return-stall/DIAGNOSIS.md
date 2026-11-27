# Diagnosis: a returning NPC stalls behind a standing NPC

## What the engine does
- Stall watch: `npc-needs.js:4224` `_watchReturn`. Still for RETURN_YIELD_MS (3 s) means re-issue; try 1 plain, tries 2 and 3 with `reroute: true` (`:4271`); try 4 logs `return_stuck` (`:4245-4248`), backs off 15 s, then `return_abandoned` after two back-offs (`:4306`) and a fresh `_goHome(reroute: true)`.
- A `reroute` walk plans in `npc-behavior.js:2077` `_planMovePath`: `findWorldPath` with `avoidDynamic: { includeHeld: true }`; if that finds nothing it falls back to the PLAIN path (since split into the ring, tight and plain tiers).
- Held-aware avoidance: `npc-pathfinding.js:513` `_avoidDynamicPositions`. Every other NPC body (standing ones included, `:609-613`) is avoided with a one-cell (8 px) clearance ring on each side (`:527-546`), the ring left open only within 2 cells of the start or goal.

## Why it fails
- The standing NPC is counted as a held body (it is in `npcSprites`, not excluded), so cause 1 (not counted) is ruled out. The goal cell is not blocked (cause 3 ruled out), and the re-plan is not the same path as before (cause 4), but see the fallback below.
- The ring is wider than the gap two bodies need. A 20x10 body standing mid-aisle blocks body cells plus 8 px each side plus cell rounding, about 40 px of the aisle across. Measured on the real pathfinder (a scratch experiment, not kept): with a 20x10 NPC mid-way, aisles of 16, 24, 32 and 40 px of walkable cells give NO PATH, 48 px and up give one. A 20x10 walker really can pass a 20x10 standing body in a 40 px aisle (each side leaves 10 px of centre room, the sum of the two half-heights).
- When the held-aware search finds nothing, `_planMovePath` falls back to the plain path, which runs straight into the standing body. The walker bumps it (`npc-sprites.js` settle on a movable body), stands, the watch re-issues, and the same two plans repeat. Hence the loop `return_resumed` x2, `return_stuck`, `return_abandoned`, `return_resumed`, seen in game 9155. In the three runs she got home, her start cell or stop point left a wider gap.
- Vector is a movable body (not immovable) even though he never walks, so he is avoided like any NPC, ring included.

## What I could not do
The m08 grid itself was not reproduced (the m08 office-life scenario is on another branch). The m08 objects near the stall in the earlier log (a desk 78 px wide at y 171, a chair 33x54 at (520,112), Vector at (486,122)) are consistent with an aisle of about 40 px or less, but the exact cells were not checked. The cause shown is the generic one on the real pathfinder.

## Fix
Add a middle tier to the stalled-walk plan: ring search, then a `tight` held-aware search (avoid exactly the cells whose centre would put the walker's body on another body, plus half a cell), then the plain path. `npc-pathfinding.js` (`tight` option) and `npc-behavior.js` `_planMovePath`.
