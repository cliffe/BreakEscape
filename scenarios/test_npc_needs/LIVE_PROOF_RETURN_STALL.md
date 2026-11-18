# Live proof: returning needs NPC and a standing NPC in a narrow aisle

Branch fix/needs-return-npc-stall. Engine fix f48c80af8. Scenario change 06039b92a, 0ed00fdd2 (test_npc_needs).

## The aisle
- What blocks the needs grid: `buildWorldGrid` (npc-pathfinding.js) marks every enabled static body and every immovable dynamic body, padded one cell sideways and 2 px up and down. Tiled walls and scenario `type: "table"` objects with a `sprite` and `position` (dynamic tables, immovable body) block. Ordinary objects (pc, coffee_station1, aes_toolbox1) add no cells, which is why the earlier run found open floor.
- In test_npc_needs, four `smalldesk2` tables (positions x 3.375, y 2.69 / 3.0 / 3.31 / 3.63 tiles) form a column that joins the partition wall at y 148. This closes off the clerk's pocket (home, west) from the coffee station (east) except for a gap of 5 cells at y 76 to 108, 40 px (tmp/rs/grid.mjs prints it).
- A non-moving NPC `aisle_guard` (no needs, no patrol) stands at (120, 84), mid-aisle, on her straight line home.
- `ruby scripts/validate_scenario.rb`: 0 errors.

## Fixed engine, 5 runs (tmp/rs/run5.mjs, :3092, headless, throttleFps 20, TTS aborted by pathname)
Trip started with `window.__test.needs.set('clerk', {caffeine: 5})`. Time from the first `returning` tick to `returned_post`, whole-second sampling.

| Run | Game | Home (s after start) | Return time | return_stuck | return_abandoned | return_resumed |
|---|---|---|---|---|---|---|
| 1 | 9243 | 61.4 | 3 s | 0 | 0 | 0 |
| 2 | 9249 | 61.6 | 3 s | 0 | 0 | 0 |
| 3 | 9252 | 61.8 | 3 s | 0 | 0 | 0 |
| 4 | 9255 | 61.6 | 3 s | 0 | 0 | 0 |
| 5 | 9257 | 61.9 | 3 s | 0 | 0 | 0 |

5 of 5 home (atPost true, `returned_post` logged), no abandon loop, no page errors. In every run she passed the guard (x 120, y 82 to 84) at y 80 to 95. The guard stayed within 3 px of its place (run 3 shows a 3 px nudge). Logs: tmp/rs/run5_fixed.log.

## Contrast with the pre-fix engine: not shown
The pre-fix `npc-pathfinding.js` and `npc-behavior.js` (parent of f48c80af8, saved in tmp/rs/old, served to the page only through page.route) also got her home in 3 of 3 runs (tmp/rs/run3_old.log), and in three further probes with the guard held immovable or moved to y 78/80/92. No stall appeared. In this room the plain path and the physics slide let her pass the guard without a settle, so this set-up does not separate the two engines. The fix is therefore proven here as no regression with the aisle and guard in place; the stall itself is demonstrated by test/js/npc-needs-return-standing-npc.test.mjs (real EasyStar, fails before, passes after). A reproduction needs a guard the walker cannot slide past (the m08 case: desk and chair either side).
- The guard is not fully static in the live game: a probe that reset it to y 78 to 80 saw it end at y 109 to 111, shoved during the clerk's chair fetch.

## Tests
`bin/test-js test/js/npc-*.test.mjs test/js/needs-*.test.mjs`: 90 passed, 0 failed.
