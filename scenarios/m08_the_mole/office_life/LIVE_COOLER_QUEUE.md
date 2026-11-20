# Live check: the ops cooler queue cells (branch fix/m08-cooler-queue)

Added 2026-11-19, from main 7d0343965. No scenario data was changed: the queue cells are already inside operations_floor, and the validator warnings about them are a false positive.

## Why the six warnings appear

`scripts/validate_npc_needs.rb` (`check_queues`) works out each cell's tile as `o.x.floor + useFrom.dx.to_i + cell.dx.round`. `ops_cooler` has no scenario `position` (it claims the Tiled `water_cooler1`), so the validator reads its x and y as 0. Every cell then lands at the room's north-west corner (tile 0,-2 and 1,-1), north of the room, in `intel_analysis`, and the leash check adds one warning per needs NPC. Six warnings: 2 cells, each with the "outside room" line plus one line for julian_sallow and one for agnieszka_duda.

The engine does not use that arithmetic. `queueCells` (npc-needs.js) takes the approach cell (the cooler's pixel position plus `useFrom` in tiles, snapped to the walkable 8 px grid) and adds each offset in tiles from there.

## Real geometry (game 10102, probe through the page)

- Room `room_hq_ops` is 10 x 10 tiles (320 x 320 px) at world origin 0,0. Cooler sprite 24 x 47 centred at (226, 232.5) (tile 7.1, 7.3), bottom right of the room.
- Approach cell for `useFrom` (-0.375, -1.02): (212, 196). It is walkable and inside the room, so it stays as it is.
- Queue cells as the engine resolves them: cell 1 (220, 180), cell 2 (244, 180), both `roomId operations_floor`, both walkable (neither dropped), 16 px apart.
- Doors (px): north (48,32), south (48,288), east (304,80), west (16,80). The nearest door mouth to either cell is the east one, about 100 px away. The archives walkway is the south door at the bottom left, about 200 px away. The cells sit north of the cooler, behind the two-desk block, so the walkway and door mouths are clear.

## Live evidence

Setup: keyless server from this worktree on :3002, headless, `throttleFps(20)`, fixed steps on, TTS aborted by pathname, Mission Brief closed, `found_badge_audit` set so the officers appear. Fresh games from `new-game.rb m08_the_mole --start-room operations_floor`: 10102 (geometry probe), 10117 (capacity left at 2, no queue possible), 10122 (driver bug, discarded), 10123 and 10125 (queue runs). No game row was edited.

How a queue was made. Only two NPCs use the cooler, so with capacity 2 nobody can ever be third. In the page, `ops_cooler`'s cached resolved affordance (`sp._officeAffordance.value.capacity`) was set to 1 (client memory only, nothing synced), and `window.__test.needs.set(<id>, 'thirst', 5)` was called for julian_sallow and agnieszka_duda. The second to arrive finds the one slot claimed and queues.

Result, game 10125 (game 10123 the same):

- `queued` event for julian_sallow at tick 34, place 1; the other officer, agnieszka_duda, took the slot first.
- Julian walked to (220, 182) in operations_floor and stood on queue cell 1 (220, 180), `arrived` true, for about 90 s of game time. He did not wait at his post.
- When the slot freed (tick 130): `used` for agnieszka_duda, then `queue_front` for julian_sallow, and he walked to the cooler and used it. Then agnieszka_duda queued behind him in turn (tick 145) and used it after he finished.
- Game 10117 (capacity 2 as authored): both officers used the cooler together, no queue, as expected.

Screenshot `scenarios/m08_the_mole/office_life/shots/cooler_queue_julian_queued.png` (game 10125): Julian on queue cell 1, north-east of the desk block and above the cooler. Not in a doorway, not on the walkway, clear of the walls and of the cooler sprite.

Not proven: a three-body picture with both real slots taken and a third queuer. Nobody else uses the cooler. From the numbers, with capacity 2 the second user stands at the side cell (observed (228,195)) and the first at (200..213, 185..187), so queue cell 1 (220,180) is 8 to 17 px behind them (north). Sprites would overlap in depth order, which is how a queue reads, but this was not seen on screen.

## Validator

The false positive is fixed by skipping the cell geometry check for an object with no scenario position (`positioned?`, already in the file). On this scenario that takes the warnings from 17 to 11 and removes the six queue lines; no new ones, 0 errors. That edit is in `validator-queue-skip.patch.txt` here, not committed to scripts/, because the brief restricted the change to scenario data.

## Re-check on main 589d5959c (20 Nov 2026)

PASS. Each case ran on a fresh game, on :3006.

- Capacity 2 as authored (game 10688): both officers used the cooler together. Both `used` events came at tick 120, and the cooler chatter played.
- Capacity forced to 1 in page memory (game 10689, screenshot from 10694): the queue sequence ran as follows.
  - t36: julian `queued`, on cell (220,180).
  - t132: agnieszka `used`, then julian `queue_front`.
  - t142: agnieszka `queued` behind him.
  - t205: julian `used`.
- Reload after the real badge audit (game 10701): the officers were restored, visible, and used the cooler.

Testing note: set `found_badge_audit` in the page after load, never with `new-game.rb --set`. A preset global never fires `global_variable_changed:found_badge_audit`, so the officers' `setVisible` mapping never runs. They stay hidden with their bodies disabled, and no trip ever starts. This is a harness artefact, not a game fault. See the playtest skill's harness gotchas.
