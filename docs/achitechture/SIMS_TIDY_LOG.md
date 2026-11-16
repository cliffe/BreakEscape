# Sims tidy pass: build log

Branch build/ol-sims-tidy (from main 177c13f6a). Scenario scenarios/test_needs_sims. Keyless server :3093.

## Handover (first session stopped at the context limit)

### Done
- Item 1 (driver only): `tools/playtest/needs-tour-regression.mjs` `read()` takes a mid-point order; row 3
  (both board reads) tries (200,176) first, then (264,176), then (232,176). Not yet proved live.
- The tour report now records each NPC's first `npc_sat` (needs clock, s), the seating log lines
  (fetch_start, fetch_end, seat_move_end, seat_gave_up) and the stall lines with positions; the last
  console line prints `stuck` in full and `tom_sat`.

### Item 3 diagnosis (proved on games 5640 and 5645, player parked at 232,176)
- Tick 1 (needs clock 0.25 s): Tom's home is still provisional, so `needsSeatRef` gives his spawn feet
  (96,192) as the work spot. That spot overlaps desk `office_desk1_91` (body 40..98 x 195..205) by
  2 px: Tom's 20 x 10 body spans y 187..197.
- The push leg arrives at once (1-tile arrival guard: Tom at 116,204 is 23 px from 96,192), so
  `endFetch` starts the seat move with stage `walk`, a straight line to (96,192).
- The straight walk catches the desk's top-right corner (98,195) and logs
  `seat_move_end walk_stuck` at (108,193), about 3.5 s. The centre line is clear of the desk; the body
  edge is not.
- He then stands until the post fetch retry. With home resolved to (92,164) that fetch sits him at
  about 17 to 18 s in a quiet run. In the tour it is about 65 s, per the brief; not yet re-measured.
- Proposed fix (not written): in `startSeatMove`, when stage is `walk`, check the straight line with
  18 x 10 `walkBoxClear` samples every 4 px (ignoring Tom and the chair). If it is blocked, plan a grid
  path synchronously, the same enableSync/disableSync pattern as npc-needs.js `routeLength`. Aim
  `findWorldPath` at `findNearestWalkableWorldCell(ref, 2)`, drop points within 4 px of the start,
  collapse collinear points and append `ref`. The `walk` case then ticks through `m.route` legs
  (`resetWalk` per leg), keeping the existing walk_stuck rule and the straight-walk fallback.
  Unit-test a pure `seatWalkWaypoints(path, from, ref)` in test/js/seating.test.mjs. Ask whether the
  first fetch should also wait for a resolved home; that would be a second, separate fix.

### Item 2 (in progress, no fix yet)
- Kitchen doorway geometry (game 5634, after opening it): the door is at x 0 (the kitchen is at x -320).
  The gap is y 68..92, with wall strips 60..68 and 92..100 for x -32..32. Feet y must stay in 73..87.
  The grid opens only the cell rows y 72..88. The row y 88..96 is blocked for x -40..40, and row 64
  is blocked.
- Tom's (14,83) is inside the corridor. Grace's (34,86) is just east of its office end: her body's
  bottom is at 91, 1 px above the strip.
- Walkable wall-band cells: x -16..16, y 104..128 is walkable (the seam between the two rooms'
  walls), but it is an enclosed pocket, with blocked rows at y 88 and 96 above it. It is not on the
  doorway route, so it is unlikely to cause these stalls.
- Next step: hook `npcNeedsSystem._log` in the driver for `return_stuck|walk_stuck|walk_rerouted|
  return_resumed`, and snapshot the nearby bodies (the player, NPCs, chairs) and the path. The
  tour's `enterRoom` parks the player at feet (+/-19,80), in the doorway corridor, which is one
  suspect.
- The baseline tour on game 5633 was stopped before it finished; re-run it for the before counts.

### Item 4: not started (`tools/playtest/needs-sims-staff-room.mjs` beat `job_beat` is the place to start)

### Scratch probes (not in the repo)
/tmp/claude-1000/-home-cliffe-Files-Projects-Code-BreakEscape-BreakEscape/b8fb6615-769e-4015-b3ae-9cb0a729b510/scratchpad/sims-tidy/geo.mjs (grid and bodies in a rectangle), tomtrace.mjs (Tom's fetch trace with an arrival hook).

### Games
Created this session: 5633 (tour, partial), 5634 (geometry), 5640 and 5645 (Tom traces), plus one
unrecorded id from the first new-game call, which was not driven.
