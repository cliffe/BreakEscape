# Wayfinding review (player and NPC pathfinding)

Date: 2026-11-05. Static review of the engine JS at commit `f816f09a5` plus
`public/break_escape/assets/rooms/room_lw_office.json`. No engine file was changed.
Scenario content was not read, so anything that depends on where other NPCs,
scenario objects or Len's target sit is marked as unverified.

Paths below are relative to `public/break_escape/js/` unless they start with `public/`.

---

## Part A: the routing model

### A1. One grid for player and NPCs? Mostly yes; the overlay and NPC avoidance are player-only

**Confirmed: one routing grid.** Every live path request goes through
`PathfindingManager.findWorldPath` (`systems/npc-pathfinding.js:721`) on the 8px
`worldGrid` (`PATHFINDING_STEP = 8`, `utils/constants.js:37`; built in
`rebuildWorldGrid`, `npc-pathfinding.js:604-680`). Callers:

| Caller | File:line |
|---|---|
| Player click-to-move | `core/player.js:794`, `:816` |
| NPC waypoint patrol / `goToAndStay` | `systems/npc-behavior.js:1235` |
| NPC post-collision recalc | `npc-behavior.js:991` |
| NPC multi-room route | `npc-behavior.js:1339` |
| NPC random patrol | `npc-behavior.js:1435` |
| NPC chase | `npc-behavior.js:1734` |
| Needs reachability probe | `systems/npc-needs.js:800` |

The per-room 32px EasyStar instances (`this.pathfinders`) are never asked for a
path by anything outside `npc-pathfinding.js` (see Part C). The per-room grid
still feeds one NPC input, random patrol **targets** (`getRandomPatrolTarget`,
`npc-pathfinding.js:446`, called from `npc-behavior.js:1416`). The route itself
still runs on the world grid.

**Refuted: "both use the path-avoid overlay".** `findWorldPath`'s sixth parameter
`avoidNPCs` turns on two things: avoidance of NPC-occupied cells
(`_avoidNPCPositions`, `:748`) and the path-avoid cost overlay
(`_applyPreferAvoidCosts`, `:752`). The player passes `true` (`player.js:829`, `:838`).
Every NPC call passes nothing, so it gets `false`. NPC routes therefore ignore
path-avoid props (they walk straight through a photocopier or filing-cabinet
footprint if the grid allows) and other NPCs. The player also runs a
string-pulling smoother that respects the overlay (`smoothWorldPathForPlayer(..., true)`,
`player.js:779`; `hasPlayerLineOfSight`, `npc-pathfinding.js:790`). NPCs follow the
raw 8px cells with no smoothing (`npc-behavior.js:1089-1127`). The player also skips
the grid when it has a direct line of sight (`player.js:755`).

**Start-cell snapping: confirmed for both, by different routes.**
- `findWorldPath` itself snaps the start whenever the start cell is blocked
  (`npc-pathfinding.js:742-746`, via `findNearestWalkableStartCell`). The player
  relies on this; `player.js` does not snap the start itself.
- NPC callers also snap before calling (`npc-behavior.js:989`, `:1232`, `:1337`,
  `:1433`, `:1729`), so the internal snap finds a walkable cell and does nothing.

**Destination snapping: not uniform.**
- Player: snapped with `findNearestWalkableWorldCell`, but only on the non-LOS branch (`player.js:765`).
- NPC waypoint / `goToAndStay`: snapped (`npc-behavior.js:1214`).
- NPC chase: snapped (`:1731`).
- NPC multi-room route: **not snapped** (`:1342` passes the raw `worldX/worldY`).
- NPC random patrol: **not snapped on the world grid**. The target is a 32px tile centre
  taken from the per-room grid, which marks only wall tiles and the `tables`
  layer. If that point lands on a world-grid-blocked cell (a table-type object, an
  Object Layer 1 box, a door frame), EasyStar returns `null` (end tile not acceptable).
  `chooseRandomPatrolTarget` sets neither `_pathfindingInProgress` nor a back-off, so it
  asks again on the next 50ms tick.

**Side note on the comment at `npc-pathfinding.js:738-741`.** It says EasyStar "finds nothing
from a blocked start". EasyStar 0.4.4 (the CDN build loaded by
`app/views/break_escape/games/show.html.erb:314`) checks only the **end** tile's
acceptability. A blocked start tile is expanded normally. The search fails only when
every neighbour is also blocked, or (with `disableCornerCutting`) the diagonals are
refused. The snap is still worth keeping, because a body pressed against an obstacle is
often in a pocket of blocked cells. I checked this against the downloaded 0.4.4 source:
`findPath` tests only `collisionGrid[endY][endX]`, and start == end returns `[]`.

### A2. Does the needs-driven `goToAndStay` request its path through the start-snapping code? Yes, with one exception

Chain: `npc-needs.js:540` / `:651` → adapter `moveTo` (`npc-needs.js:835-837`) →
`NPCBehaviorManager.goToAndStay` (`npc-behavior.js:174`) →
`NPCBehavior.goToAndStay` (`:2147`). That call sets one waypoint, `patrol.enabled = true`,
`patrolTarget = null` and `_stopOnArrival`. On the next behaviour tick `determineState`
returns `'patrol'` (`:810-817`). `updatePatrol` sees `!patrolTarget` (`:1060`) and calls
`chooseNewPatrolTarget` → `chooseWaypointTarget` (`:1165-1166`), which snaps the start
(`:1231-1233`) and calls `findWorldPath` (`:1235`). The start **is** snapped.

Exception: `goToAndStay` does not clear `patrol.multiRoom` / `patrol.route`. For an NPC
configured with a multi-room route, `chooseWaypointTarget` hands off to
`chooseWaypointTargetMultiRoom` (`:1178-1180`). That function walks the route segments and
**ignores the goToAndStay waypoint**. The start is still snapped (`:1337`), but the NPC goes
to the wrong place.

---

## Part B: the (8,7) stall

### B1. The "degenerate 0-height collider" premise is wrong for this map

`room_lw_office.json`, layer `Object Layer 1` (raw JSON, unchanged since `fd4edfafe`):

| id | x | y | width | height | sits under |
|---|---|---|---|---|---|
| 26 | 254 | 286 | **31** | **10** | photocopier (items gid 896, `photocopier1.png`, 252..287 × 250..296) |
| 28 | 260 | 230 | **25** | **10** | filing cabinet (items gid 1209, `qdc_filing_steel1.png`, 258..287 × 193..240) |

These are ordinary 25×10 and 31×10 px floor footprints. In tile units they round to
"width 1, height 0" (25/32 ≈ 0.8, 10/32 ≈ 0.3), which is probably where that reading
came from. Nothing in the engine produces a zero-height body from them.

**Where that layer is built.** `collision.js` does not handle Object Layer 1 at all.
It only builds wall strips (`createWallCollisionBoxes`, `collision.js:22-151`) and door
strips. The boxes are built in `core/rooms.js:2832-2867`: a `Rectangle` at the object's
centre with `Math.round(width/height)`, made a **static** body (`:2852`), given a collider
**with the player only** (`:2857`), and stored in `room.collisionBodies`.

**NPCs have no collider with these boxes.** `room.collisionBodies` is read only by
`object-physics.js:76` (chairs) and `npc-sight-occlusion.js:335/370` (sight). NPC
colliders are set up in `npc-sprites.js:746-1059`. They cover the player, wall boxes,
`room.objects` that are tables or desks, wheeled chairs and other NPCs. So an NPC body
that overlaps an Object Layer 1 box is neither pushed out nor held by it. The
straddling-a-1px-collider hypothesis has nothing to act on.

**The world grid does bake them in.** They are static bodies, so `rebuildWorldGrid`
(`npc-pathfinding.js:643-645`) marks them. Worked example in room-local px. I assume the
world-grid origin is a multiple of 8 relative to the room: `calculateWorldBounds`,
`rooms.js:881-935`, gives `min(-1800, room x) - 200`.

- Box 28 (260..285 × 230..240) → `cx1 = floor(260/8) - 1 = 31`,
  `cx2 = floor(284/8) + 1 = 36`, `cy1 = floor((230-2)/8) = 28`,
  `cy2 = floor((240+2-1)/8) = 30`. Blocked: cells x 248..296, y 224..248.
- East wall strip (tile x 9, box 288..296) → cells cx 35..37, all rows.
- Len at tile (8,7): feet (body centre) = (256, 224) (`npc-sprites.js:314-322` and `:118-126`).
  Cell (32, 28) is **blocked**, by the cabinet footprint's top padding.
- Body 20×10 (atlas) = 246..266 × 219..229. It does not overlap box 28 (top 230) or the wall strip.
- `findNearestWalkableStartCell(256,224)` (`:841-868`): the nearest free cell is (32, 27),
  centre (260, 220), 5.7px away, with a clear centre-line LOS. A path starting there goes
  north or west into open floor.

**Conclusion.** Statically, a spawn at (8,7) gives a blocked start cell that the existing
snap handles cleanly, a body that touches no collider it can hit, and an open
neighbourhood. I could find **no grid-level or collider-level mechanism in the code
that pins an NPC at this spot.** The `markBlocked` edge cases (top === bottom, padY,
floor/ceil) would not matter even for a true zero-height body, for two reasons. First,
`cy1 = floor((top-2)/8)` and `cy2 = floor((top+1)/8)` still mark at least one row.
Second, NPCs ignore that body physically anyway.

### Mechanisms the code does support (could produce "frozen for minutes", none proven tile-specific)

1. **Clock mix-up that switches off the existing stall re-target (real bug).**
   `handleNPCCollision` and `handleNPCPlayerCollision` call
   `npcBehavior.chooseWaypointTarget(Date.now())` (`npc-sprites.js:1445`, `:1639`). That
   sets `lastPatrolChange` to epoch milliseconds (about 1.8e12). `updatePatrol` measures
   `time - lastPatrolChange` with Phaser loop time (about 1e5, `npc-behavior.js:1059`). The
   result is hugely negative, so `intervalElapsed` stays false, and the only stall recovery,
   `_patrolStalled` → re-target (`:1060-1067`, `:1147-1156`), never fires again for that
   target. One bump into the player or another NPC, followed by being physically held with
   a non-empty path, leaves the NPC frozen indefinitely. Spawning in a corner pocket (east
   wall + cabinet) next to where the player stands to talk makes a bump more likely. That
   is circumstantial, not proof. Related: `_pathRetryAfter` uses `performance.now()`
   (`:1252`) but is compared with loop `time` (`:1066`). Those share a base in Phaser 3, so
   this one is only a consistency issue.
2. **NPC-NPC avoidance waypoint lands in the wrong place.** `npc-sprites.js:1394-1425` takes
   `Math.round(npcSprite.x / TILE_SIZE)`, an **absolute** world tile, then adds `roomWorldX`
   again. For any room not at the origin the waypoint is offset by the room position. The
   walkability guard reads `window.npcPathfindingManager`, which is never assigned anywhere
   (grep: reads at `:1411` and `:1605` only), so the guard never runs. The bad waypoint is
   spliced into a `goToAndStay` list (`:1430-1434`, using `npcBehavior.waypointIndex`, which
   is undefined, rather than `config.patrol.waypointIndex`). The NPC then alternates between
   its real target and an unreachable one, with 2s back-offs.
3. **Start cell == destination cell → permanent failure loop.** EasyStar returns `[]` when
   start equals end. `findWorldPath` maps that to `null` (`npc-pathfinding.js:756`), and
   `chooseWaypointTarget` treats `null` as unreachable: 2s back-off, target cleared
   (`npc-behavior.js:1248-1257`). The arrival guard measures the **raw** `_goToStayDest`
   (`:1078-1086`, 32px). An NPC whose snapped start equals the snapped destination while its
   raw position is more than 32px from the raw target therefore retries forever. It needs a
   snap of more than 1 tile, so it is unlikely at (8,7) (5.7px), but it is a latent stall.
4. **Behaviour states that outrank movement.** `maintain_space` (`npc-behavior.js:805`)
   outranks patrol, even for a scripted `goToAndStay`. A needs NPC holds still for the whole
   time it is in conversation (`:681-689`). Both depend on the player, not the tile.

### What would settle it (live instrumentation)

Run in the browser console, or through the `window.__test` bridge, with Len at (8,7),
reproducing the stall. Sample every 250ms for about 10s and dump the log:

```js
const id = 'len';                                   // actual NPC id
const b  = window.npcBehaviorManager.getBehavior(id);
const pm = window.pathfindingManager;
const log = [];
const t = setInterval(() => {
  const bc = b.sprite.body.center, v = b.sprite.body.velocity;
  const { minX, minY, step } = pm.worldGridBounds;
  const cx = Math.floor((bc.x - minX) / step), cy = Math.floor((bc.y - minY) / step);
  log.push({
    state: b.currentState, patrol: b.config.patrol.enabled,
    target: b.patrolTarget, dest: b._goToStayDest, stopOnArrival: b._stopOnArrival,
    pathLen: b.currentPath.length, idx: b.pathIndex, next: b.currentPath[b.pathIndex],
    inFlight: b._pathfindingInProgress, retryIn: b._pathRetryAfter - performance.now(),
    lastPatrolChange: b.lastPatrolChange, loopTime: b.scene.game.loop.time,   // epoch vs loop?
    settling: b.isSettling, stuckInWall: b.stuckInWall,
    pos: { x: bc.x, y: bc.y }, vel: { x: v.x, y: v.y },
    touching: { ...b.sprite.body.touching }, blocked: { ...b.sprite.body.blocked },
    embedded: b.sprite.body.embedded,
    cell: [cx, cy, pm.worldGrid[cy][cx]], snap: pm.findNearestWalkableStartCell(bc.x, bc.y),
    needs: window.npcNeedsSystem?.state?.(id) ?? null,   // adapt to the actual read-out
    waypoints: b.config.patrol.waypoints?.length,
  });
}, 250);
setTimeout(() => { clearInterval(t); console.table(log); }, 10000);
```

How to read it:
- `state !== 'patrol'` → a state gate (mechanism 4), or patrol never enabled (no move issued; check the needs log).
- `pathLen === 0` with `retryIn` cycling → the path keeps failing. Run
  `pm.worldPathfinder.enableSync(); pm.findWorldPath(pos.x,pos.y,dest.x,dest.y,console.log); pm.worldPathfinder.disableSync()`
  and compare snapped start and destination cells (mechanism 3).
- `pathLen > 0`, `vel` non-zero, `pos` static, `touching` set → a physical block. Check
  `lastPatrolChange` against `loopTime` (mechanism 1) and look at what it touches.
- `waypoints > 1` during a `goToAndStay` → an avoidance waypoint was spliced in (mechanism 2).

Also add one temporary `console.trace` in `chooseWaypointTarget` when `time > 1e12`. That
proves the `Date.now()` path is being taken.

### B2. Recommended fix

Options compared:

| | What | Covers | Blast radius |
|---|---|---|---|
| (a) | NPC stuck detector with escalation | Every cause above, current and future, including data errors no validator catches | Medium-low: confined to `updatePatrol` |
| (b) | Normalise or drop zero-area collision objects at load + map lint | Only true zero-area objects, which do **not** exist in this map | Very low, but would not have fixed Len |
| (c) | Validator: NPC spawns and approach tiles not on a collider | Authoring errors, caught before a playtest | None at runtime |

**Recommendation: (a), plus the two one-line clock fixes, plus (c). Make (b) a cheap lint
only.**

1. **Clock fixes (do first, smallest change).** `npc-sprites.js:1445` and `:1639`: replace
   `Date.now()` with `npcSprite.scene?.time?.now ?? performance.now()`, the same clock used
   at `:1288`. In `npc-behavior.js:1252`, use the `time` that the caller already has, so the
   back-off and its comparison share one clock. This alone restores the existing 3s
   "stalled → re-path" recovery after any bump.
2. **Stuck detector with escalation** in `NPCBehavior.updatePatrol` (`npc-behavior.js:947`).
   Reuse `_patrolStalled` (`:1147`) and add a per-target attempt counter
   (`this._stallAttempts`, reset in `chooseWaypointTarget` when the target changes and in
   `_triggerGoToStayArrival` / `cancelMove`):
   - Condition: `pathFollowingActive` (or a non-empty `currentPath`), and the body centre has
     moved less than 4px in `STALL_MS` (about 1500ms for `goToAndStay`, the patrol interval
     otherwise). Count consecutive `null` path callbacks for the same target too (in the
     `else` branch at `:1248`).
   - Step 1: re-snap and re-path (what `chooseNewPatrolTarget` already does).
   - Step 2: nudge. Take `pm.findNearestWalkableWorldCell(pos)`. If it is more than 4px
     away, `body.reset()` there (8–16px, barely visible), then re-path.
   - Step 3: for `goToAndStay`, if the target is not visible to the player (camera bounds or
     `canSeePlayerToFace`), teleport to the path's next free cell, or straight to the
     destination when nothing else works. Otherwise give up cleanly with
     `_triggerGoToStayArrival`, or emit `npc_move_failed:<id>` so the needs engine fails the
     job now instead of waiting for its deadline (`npc-needs.js:552`, at least 20s, then a
     60s cooldown).
   - Log each escalation once (`🧭 [id] stalled → re-path/nudge/teleport`), so playtests
     show it.
   - Also handle start == destination: when the snapped start cell equals `wpDest`'s cell,
     call `_triggerGoToStayArrival()` (or walk straight to the raw destination) instead of
     treating `[]` as failure (`npc-behavior.js:1240-1257`).
3. **Validator check (c)** in `scripts/validate_scenario.rb`, next to the room-geometry code
   that already loads tilemaps (`geom_type_to_tilemap`, about line 4948). For each person
   NPC `position` {x,y}, patrol waypoint, route waypoint and `patrolOverride.targetTile`:
   build the feet box (`x*32 ± 10`, `y*32 ± 5`) and warn if it overlaps any Object Layer 1
   rectangle or `tables` object padded the way `markBlocked` pads (±8px horizontally, ±2px
   vertically). Make it a ⚠️ warning, not an error: the engine copes in most cases, but these
   spots are where stalls start, and moving the spawn is free. A needs `useFrom` cell can be
   checked the same way.
4. **(b) as a lint only.** In `rooms.js:2838`, skip (with a `console.warn`) any collision
   object whose rounded width or height is 0. Add the same rule to
   `scripts/check_corrupted_gids.py`, or a small map-lint script. It costs nothing, but it is
   hygiene, not the fix for this bug.

Not recommended: giving NPCs colliders with `room.collisionBodies`. NPCs and the player
would match, but an NPC spawned inside a box would then really be held there, and today
the world grid already keeps NPC routes off those boxes.

Other bugs found on the way (worth a ticket, not part of the minimal fix):
- `goToAndStay` ignores the target for multi-room-route NPCs (A2).
- Random patrol targets come from the per-room grid, are not snapped on the world grid,
  and have no in-flight guard or back-off (A1).
- `handleNPCCollision` / `handleNPCPlayerCollision` double-offset the avoidance waypoint,
  and their walkability guard reads a global that is never set (B mechanism 2).

---

## Part C: dead or redundant code

Grep scope: `public/break_escape/js`, `test/js`, `tools/` (playtest drivers),
`app/views`. `.claude/worktrees/` copies are ignored.

### `core/pathfinding.js` (the old 32px walls-only grid)

| Symbol | Evidence | Verdict |
|---|---|---|
| `initializePathfinder` | imported `core/game.js:5`, called once `core/game.js:2059`; also `window.initializePathfinder` (`pathfinding.js:120`), no other reader | **Called but has no effect.** It builds a private `pathfinder` that only `findPath` reads. It marks only tiles with `tile.collides && tile.canCollide`; wall layers have tile collision turned off (`rooms.js:1864-1869`), except where `collision.js:281/499` re-enable it after door work |
| `findPath` (module export) | no importer anywhere; `window.findPath` is **never assigned** (only `initializePathfinder` is exported to `window`) | **Dead** |
| `debugPath`, private `smoothPath` | no callers outside the file | **Dead** |
| `window.pathfinder` (`main.js:64`, set to `null`) | no reader in engine or tests | **Dead global** |
| Tests | `test/js/*` stub `npc-pathfinding.js`, never `core/pathfinding.js` | n/a |

**Safe to remove:** the whole of `core/pathfinding.js`, together with the import
(`game.js:5`), the call (`game.js:2059`) and `window.pathfinder = null` (`main.js:64`). The
one cost of removal is that the call no longer runs, and its only side effect is to build an
unused EasyStar grid. Check afterwards that no `?v=` cache-bust list or harness copy list
names the file (none found in `bin/` or `test/js`).

### Per-room grid machinery in `PathfindingManager` (`this.grids`, `this.pathfinders`, `buildGridFromWalls`)

| Member | External callers | Verdict |
|---|---|---|
| `buildGridFromWalls` (`:156`) | internal only, from `initializeRoomPathfinding` | Feeds `this.grids`; see below |
| `this.grids` / `getGrid` (`:495`) | `getGrid` read only via `window.npcPathfindingManager` (`npc-sprites.js:1412`, `:1606`), a global that is **never set** | **Effectively dead** (the guard never runs) |
| `this.pathfinders` / `getPathfinder` (`:488`) | none outside the file; used internally by per-room `findPath` and `markDoorWalkable` | **Dead for routing** |
| per-room `findPath` (`:263`) | none | **Dead** |
| `hasLineOfSight` (`:357`), `smoothPath` (`:1297`), `smoothPathForPlayer` (`:1473`), `findNearestWalkableTile` (`:1334`), `hasPhysicsLineOfSight` (`:1409`) | none outside the file; they only call each other | **Dead** |
| `refreshGridFromPhysicsBodies` (`:1186`), `drawGridDebug` (`:1235`) | none (`window.refreshPathfindingGrid` calls `rebuildWorldGrid`, `:1585`; the comment at `:131` is stale) | **Dead** |
| `clearGridDebug` (`:1275`) | `window.hidePathfindingGrid` (`:1578`) | Keep, or fold into `clearWorldGridDebug` |
| `getRandomPatrolTarget` (`:446`) | `npc-behavior.js:1416` (random patrol) | **Still used**. The only live reader of `this.grids` |
| `this.roomBounds` / `getBounds` (`:502`) | `npc-behavior.js:530` (`validateWaypoints`), `:728` (`updateCurrentRoom`), `getRandomPatrolTarget` | **Still used**. Not grid data; keep |
| `markDoorWalkable` (`:515`) | `doors.js:589`, `:693`, `:707` | **Still used**. Only its first half updates the per-room grid; the rest records `openDoorways`, opens world-grid cells and N/S corner blocks |
| `initializeRoomPathfinding` (`:73`) | `rooms.js:2898` | **Still used**. It also sets `roomBounds` and schedules `rebuildWorldGrid` |

**Recommendation.** Move `getRandomPatrolTarget` onto the world grid: pick a random free
world cell inside the room's patrol bounds. That also fixes the unsnapped-target bug in A1.
After that, `buildGridFromWalls`, `this.grids`, `this.pathfinders`, per-room `findPath`,
`hasLineOfSight`, `smoothPath`, `smoothPathForPlayer`, `findNearestWalkableTile`,
`hasPhysicsLineOfSight`, `refreshGridFromPhysicsBodies`, `drawGridDebug`, `getGrid` and
`getPathfinder` can all go. Trim the per-room half of `markDoorWalkable`, and delete the
`window.npcPathfindingManager` guards in `npc-sprites.js` (or point them at
`pm.worldGrid`). Keep `roomBounds`, `initializeRoomPathfinding` (minus the grid build) and
the world-grid helpers. Until `getRandomPatrolTarget` moves, `buildGridFromWalls` and
`this.grids` stay; everything else in the table marked dead can go now.
