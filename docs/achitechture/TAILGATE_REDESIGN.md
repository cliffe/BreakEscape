# Tailgate beat redesign: engine design

Date: 2026-11-05. Engine-only study; no scenario or ink files were read and no engine
file was changed. Builds on `docs/achitechture/WAYFINDING_REVIEW.md`. Paths are
relative to `public/break_escape/js/` unless they start with `app/` or `public/`.

Target beat:
1. Len loops `open_plan` ↔ `secure_area` through a badge door.
2. The door opens for him and closes and relocks after he passes.
3. A disguised player may follow through while it is open.
4. An undisguised player who approaches in a guard's view gets a warning (person-chat) and the door shuts.
5. Len never jams.

## Summary

| Need | Already supported? |
|---|---|
| Multi-room patrol route (`patrol.multiRoom`, `route[]`) | Yes, but the room hand-off is broken (A2) and it hot-loops when the next room is unreachable (A3) |
| NPC physically passing a door | Yes. NPCs have **no collider with doors** at all (A4) |
| NPC routing through a door | Only when the door body is disabled. The world grid blocks a closed door (A4) |
| NPC opening a door as he walks up | **No.** Only an event-mapping `unlockDoor`, which is server-checked and permanent (A5) |
| Door closing / relocking | **No.** `openDoor` is one-way and destroys the sprite (B1) |
| Sight trigger with a global gate | Mostly. `los.challengeOnSight` has `requireGlobal` / `skipIfGlobal` / `rooms`, but no "near an object" test (C1) |
| Event-mapping action to shut a door | **No** (C3) |
| Stuck detector | No. Recommended, but not a prerequisite if Len has no `patrol.waypoints` and `pauseForPlayer: false` (D) |

Engine additions, smallest and safest first:
1. **`near` condition on `challengeOnSight`** (`npc-sight-challenge.js`, about 25 lines). Generic, opt-in.
2. **`closeDoor` event-mapping action** (`npc-manager.js` beside `unlockDoor` at `:1095`, about 10 lines, calling 3).
3. **Gate doors**, a new `systems/door-gates.js` (about 150 lines), plus:
   - one early return in `handleDoorInteraction` (`doors.js:606`);
   - `PathfindingManager.unmarkDoor()` (`npc-pathfinding.js`, about 20 lines);
   - one call from the game loop.

   Gate doors open for listed NPCs as they near the door, hold a tailgate window, and close
   when the NPCs are clear. They never go through the destructive `openDoor`.
4. **Multi-room patrol fixes** (`npc-behavior.js`):
   - make the room hand-off a no-op (no teleport);
   - add a back-off on unreachable legs;
   - give Len wall colliders for every room on his route;
   - set `pathFollowingActive` on route legs.

   Each is small, but they touch shared NPC code, so they need regression runs on m01–m10 patrols.
5. (Optional) the stuck detector and clock fixes from the wayfinding review.

---

## A. Len's door-traversal loop

### A1. How a multi-room route runs today
- Config: `patrol.multiRoom`, `patrol.route`, `currentSegmentIndex: 0` (`npc-behavior.js:392-396`). It is validated only when `patrol.enabled` is already true (`:441-443`). Auto-enable needs `waypoints` or `bounds` (`:430`), so a route-only NPC must set `"enabled": true`.
- `validateMultiRoomRoute` (`:573-659`) checks that the rooms exist and are connected, then calls `window.loadRoom` for each route room (`:644-651`).
- `chooseWaypointTargetMultiRoom` (`:1266-1356`):
  - takes the next waypoint of the current segment (room-local tiles, `:1313-1316`);
  - snaps the start (`:1337`) and calls `findWorldPath` to the **unsnapped** target (`:1339-1343`);
  - after the last waypoint of a segment it calls `transitionToNextRoom` (`:1287-1291`).
- `transitionToNextRoom` (`:1362-1401`):
  - sets `npcData.roomId` and `this.roomId` to the next room;
  - calls `relocateNPCSprite`;
  - picks a target in the new room.

### A2. The room hand-off never moves the sprite (and must not)
`relocateNPCSprite` (`npc-sprites.js:1656-1697`) looks for the door with
`doorSprite.doorData.connectsToRoom || leadsTo` (`:1716-1717`). **Nothing ever sets
`doorData`.** Door sprites carry `doorProperties` and `doorInfo` (`doors.js:517`, `:557`), and
a grep for `doorData` finds only these reads. So `findDoorBetweenRooms` always returns
`null`, the relocate logs "Cannot find door" and returns, and the NPC stays where it is.

That is the behaviour we want. The NPC then **walks** to the first waypoint of the next room
on the unified world grid, through the door, and is visible all the way. Had the lookup
worked it would have been wrong anyway: it adds the door's offset from the *from* room's
origin to the *to* room's origin (`:1678-1682`), which puts the NPC at the far wall of the
next room.

**Change:** make `transitionToNextRoom` stop calling `relocateNPCSprite` (or drop the body of
that function), so the walk-through is deliberate and not an accident of a missing field.

### A3. Hot loop when the next leg is unreachable
If the path to the next waypoint fails, for example because the door is shut, the callback
calls `transitionToNextRoom` straight away (`:1349-1353`). That flips the room and requests
another path, with no back-off and no `_pathfindingInProgress` guard, so a shut door gives a
loop of path requests and room flips. **Change:** set `_pathfindingInProgress` around the
request and apply the same 2s `_pathRetryAfter` back-off that `chooseWaypointTarget` uses
(`:1234`, `:1252`). On failure, stay in the current segment instead of skipping a room.

Also:
- `pathFollowingActive` is never set to true on a route leg (`:1345-1348`), so any
  `dwellTime` runs at the **start** of a leg through the dwell branch (`:1014`). The NPC
  pauses before walking, not on arrival. **Change:** set it on success, as
  `chooseWaypointTarget` does at `:1246`.
- `pauseForPlayer` defaults to **true** (`:392`), so Len stops to face a player within 96px
  (`determineState`, `:814-816`). A tailgater walking behind him would freeze him in the
  doorway. **Scenario rule:** Len needs `"pauseForPlayer": false`. No engine change.

### A4. What makes a door passable to an NPC
- **Physically:** NPCs get colliders with the player, wall boxes, table/desk objects, wheeled chairs and other NPCs (`npc-sprites.js:746-1059`). **Doors are not on that list.** The only door collider is with the player (`doors.js:575-577`). A closed or relocking door therefore cannot trap Len physically, from either side.
- **For routing:** a closed door sprite has an immovable body (`doors.js:564-572`). `rebuildWorldGrid` bakes every enabled immovable body into the grid (`npc-pathfinding.js:643-652`), so the door cells are blocked and no path crosses them. Opening a door:
  - disables the body (`doors.js:680`);
  - calls `markDoorWalkable` for both rooms (`:693-712`), which updates the per-room grid, opens the world-grid cells (`npc-pathfinding.js:574-578`), records `openDoorways` (`:522-524`) and adds N/S corner blocks (`:584-589`);
  - for E/W doors, carves a corridor (`doors.js:686-688`);
  - schedules `rebuildWorldGrid` (`:779-785`).
- The wall tiles under every door are already removed when the room is built (`rooms.js:1842`, `:1854`, before `createWallCollisionBoxes` at `:1872`). The door body alone decides whether the gap is open, so **closing needs no wall rebuild.**

### A5. Does Len open the door himself? No
The only NPC door path is `NPCGameBridge.unlockDoor` (`npc-game-bridge.js:77-150`), reached from an event-mapping `unlockDoor` (`npc-manager.js:1095-1105`) or ink `#unlock_door` (`chat-helpers.js:76`):
- It is **server-validated**: `game.rb:1107-1110` `npc_mapping_unlocks_door?` checks that the NPC has an `unlockDoor` mapping naming the room (`game.rb:1340-1348`).
- It is **permanent**: the room goes into `unlockedRooms`, and `rooms[roomId].locked = false` client-side.
- It only sets `locked = false` (`npc-game-bridge.js:118`). It does not open the door; the player still has to walk up and click.

Nothing reacts to an NPC nearing a door. The "opens as Len nears it" behaviour needs adding (B2).

### A6. Server constraint: `secure_area` must be loadable before Len enters it
`loadRoom` fetches `/games/:id/room/:room_id` (`rooms.js:805`), and the server refuses any room
that is not the start room or in `unlockedRooms` (`games_controller.rb:456-467`). If
`secure_area` is `locked: true` in the scenario, the route pre-load gets a 403 and the room
never loads. Then `chooseWaypointTargetMultiRoom` finds no room data (`npc-behavior.js:1306-1310`)
and falls back to random patrol. Two options:

**User decision (2026-11-05): the NPC unlocks the room as an action on his route.**
`secure_area` stays `locked: true` on the server. The client-gate idea (server-unlocked,
client-gated) was rejected, and so was a one-off mapping `unlockDoor`. Instead Len performs
an unlock action at a route waypoint (the badge reader, via its affordance). That action
genuinely unlocks the room on the server and triggers its load. His route waits for the load
before taking the next leg into the room. The gate door (B) still controls the physical
opening; the server unlock only makes the room exist on the client.

**Route-unlock-then-load design (piece 4, not built yet):**
- **Config:** a route waypoint gains an action, e.g.
  `{ "x": 5, "y": 2, "action": { "unlockRoom": "secure_area", "useObject": "badge_reader_1" } }`.
  Alternatively, a badge-reader object affordance `unlocksRoom: "secure_area"` that the
  waypoint names. `useObject` is only for facing and animation.
- **Server permission:** the NPC unlock path accepts the NPC when it has an eventMapping
  `unlockDoor` naming the room (`game.rb:1340-1348`) or passes `validate_npc_unlock`. The
  probe and the lab need one of those, or `npc_mapping_unlocks_door?` learns to read
  `behavior.patrol.route[*].waypoints[*].action.unlockRoom`. The second option is cleaner
  and is a Ruby change, so tell the user.
- **Client sequence:** add `NPCBehavior._runRouteAction(wp)`, called where a route leg
  finishes (`npc-behavior.js:1101-1115`, multi-room branch):
  1. Set `this._routeWait = { roomId, until: time + 15000 }`, stop and play idle. While
     `_routeWait` is set, `updatePatrol` returns early, apart from the timeout.
  2. If `window.rooms[roomId]` already exists, skip to step 5.
  3. `await NPCGameBridge.unlockDoor(roomId, npcId)` (`npc-game-bridge.js:77`; posts
     `unlock('door', roomId, npcId, 'npc')`, sets door `locked=false`, emits
     `door_unlocked_by_npc`). If the response has `roomData`, put it in
     `window.roomDataCache` as `unlockDoor` does (`doors.js:656-659`). The bridge does
     not do this today.
  4. `await window.loadRoom(roomId)` (`rooms.js:773`; returns early if already loaded,
     fetches `/room/:id`, now allowed). Then `waitForRoomReady`-style polling until
     `window.rooms[roomId]` and the 200ms world-grid rebuild have happened
     (`initializeRoomPathfinding` schedules it).
  5. Clear `_routeWait` and call `transitionToNextRoom` (no teleport, see A2).
  6. On failure (unlock refused, load failed, timeout): log, keep `_routeWait` cleared,
     back off 5s, retry the action. Never advance into an unloaded room.
- **Pre-load fix:** `validateMultiRoomRoute` (`:642-652`) pre-loads every route room.
  For a locked room that is a 403 and a console error. Skip rooms that are `locked` and not
  yet in the client's unlocked set; the route action loads them later.
- **Idempotent:** after the first loop the room is loaded and unlocked, so the action is
  only the badge-tap pause (dwell plus facing) and no network call.

---

## B. Auto-close, relock and the tailgate window

### B1. No open-then-close mechanic exists
`openDoor` (`doors.js:671-839`) is one-way and destructive:
- it destroys the door sprite and its interaction zone (`:771-774`);
- it creates an animated open door on the far side (`:742`, `createAnimatedDoorOnOppositeSide` at `:928`, which plays `door_open` / `door_side_open`, `:1031`, `:1074`);
- it emits `door_opened` (`:788-794`).

There is no `closeDoor`, and grep finds no `relock` anywhere in the engine or the Rails app.
Undoing `openDoor` would mean recreating sprites, zones and colliders in both rooms, which is
risky. **Design: gate doors never go through `openDoor`.**

### B2. Gate doors (new module `systems/door-gates.js`)
Opt-in per door, in the scenario door definition that `doors.js:492-497` already reads:

```json
"doors": [{ "connectedRoom": "secure_area", "direction": "north",
            "gate": { "openFor": ["len"], "openRadius": 56, "holdMs": 2500,
                      "playerMayPassIf": "disguised" } }]
```

1. **Creation.** In `createDoorSpritesForRoom`, copy `lockProps.gate` into `doorProperties.gate` (`doors.js:517-545`) and register the sprite with `doorGates.register(sprite)`. Both rooms create a sprite for the same connection, so the module groups sprites by door world position and toggles them together.
2. **Player click** (`handleDoorInteraction`, `doors.js:606`). Return early for a gate door: a "Badge reader: access denied" notification, plus an event the scenario can map. The player must **never** reach `handleUnlock` → `openDoor` on a gate door, because the server would say "unlocked" and the destructive open would run.
3. **Open** (`doorGates.open(group)`):
   - for each sprite: `body.enable = false`, then `play('door_open')` or `setFrame(last)`;
   - `pm.markDoorWalkable(...)` for both rooms; this already keeps `openDoorways` and the corner blocks;
   - `pm.rebuildWorldGrid()` **synchronously**. The room is already loaded, so the 250ms delay that `openDoor` uses is not needed. The grid must be open before Len's next path request.
   - emit `door_gate_opened`.
4. **Hold rule**, run each tick from the game loop next to `sightChallengeWatcher.update` (`core/game.js:2418`):
   - Open when any NPC in `openFor` has its body centre within `openRadius` of the door centre.
   - Stay open while any `openFor` NPC is within `openRadius`, and for `holdMs` after the last one leaves. That `holdMs` is the tailgate window.
   - Never close while the player's body overlaps the door body plus 4px, so the player is never shut inside a solid body.
   - Never close while an `openFor` NPC's remaining `currentPath` (from `pathIndex`) crosses the door's cells. This is what guarantees Len is never cut off mid-leg.
5. **Close** (`doorGates.close(group)`):
   - `body.enable = true`, reverse animation, frame 0;
   - new `pm.unmarkDoor(worldX, worldY, direction)`, which removes the entry from `openDoorways`, `openNSDoors` and `openSideDoorCorridors` (`npc-pathfinding.js:523`, `:585-587`, `:951`);
   - `pm.rebuildWorldGrid()`;
   - emit `door_gate_closed`. Nothing else is needed. The wall gap is already a gap (A4); the per-room grid only feeds random patrol and can stay stale.
6. **Tailgate rule** (`playerMayPassIf`). When the gate is open and the player comes within `openRadius` while the named global is false, close at once. The one exception is when the player already overlaps the door; then let them through, because closing on them would trap them. This is the deterministic "an undisguised player cannot tailgate" rule. The sight trigger (C) adds the warning conversation for the case where a guard sees it happen. With the global true, the player walks through the open gap; the room change is handled by `checkDoorTransitions`, which only needs `doorInfo` on a live sprite (`doors.js:1186-1236`) and still works because gate sprites are never destroyed.

Why this never traps Len:
- NPCs have no door collider (A4), so the body is never a physical problem.
- Closing waits until his path no longer crosses the door.
- He reopens it from either side, because the open rule is distance-based, not side-based.
- If a close does race a re-path (a bump), the back-off from A3 means he retries after 2s; by then he is within `openRadius`, which reopens the gate.

Why no room reload happens: open and close only toggle bodies and grid state. Neither calls `loadRoom`, and `loadRoom` itself returns early for a loaded room (`rooms.js:781-784`).

Not proven: E/W side doors (they add `markSideDoorCorridor` and a teleport transition for the player, `doors.js:682-688`). The probe and the first lab version should use an N/S door.

---

## C. A reusable "player in view near X while condition" trigger

### C1. What exists
- **Lockpick catch** (`lockpick-catch.js:22-55` → `npc-manager.js:375-...` `shouldInterruptLockpickingWithPersonChat` → event `lockpick_used_in_view`) works per *action*. It looks for an NPC whose person-chat mapping would fire and checks LOS (`npc-los.js` `isInLineOfSight`, defaults range 300 / 120°, `npc-manager.js:426-430`).
- **`challengeOnSight`** (`npc-sight-challenge.js:1-158`) works per *position*, opt-in through `npc.los.challengeOnSight`. It already supports:
  - `event` (default `player_spotted:<npcId>`);
  - `cooldown`, `rooms`, `requireGlobal` and `skipIfGlobal` (`:42-72`);
  - firing once per sighting (`:118-149`);
  - pausing while a minigame or conversation is open (`:101-104`).

  It runs from `core/game.js:2418`, and the scenario routes the event through `eventMappings`, including `conversationMode: "person-chat"` (`npc-manager.js:1273`).

So "in view while undisguised" is already `challengeOnSight` + `skipIfGlobal: "disguised"`.
The missing piece is **"near X"**.

### C2. Minimal generic addition: `near`
Add a `near` field to `challengeOnSight`. Better still, allow a list under
`los.watch: [ ... ]` with the same shape, so one guard can watch several things. Each entry:

```json
"challengeOnSight": {
  "event": "player_in_view_near:len",
  "near": { "door": "secure_area", "radius": 64 },      // or { "object": "<objectId>", "radius": 48 }
                                                        // or { "x": 5, "y": 3, "room": "open_plan", "radius": 48 }
  "skipIfGlobal": "disguised",
  "cooldown": 8000,
  "rooms": ["open_plan", "secure_area"]
}
```

- In `getSightChallengeConfig` (`:42-55`), normalise `near`.
- In `update` (`:115-149`), after the LOS check, resolve the target point:
  - `door`: centre of the door sprite whose `doorProperties.connectedRoom` or `roomId` matches;
  - `object`: the sprite from `rooms[*].objects`, the same lookup `npc-needs.js` uses in `findSprite`;
  - `x/y/room`: tile to world.

  Skip the entry when the player's feet are further than `radius` from that point.
- Add `targetId` / `targetType` to the payload.
- **Event name:** keep the per-NPC default (`player_spotted:<npcId>`). Recommend the scenario uses `player_in_view_near:<npcId>`, with `data.targetId` available to mapping `condition`s, so the same guard can react differently per target. This is not door-specific.
- **Room check:** the current check needs `npc.roomId === playerRoom` (`:121-123`). At a door, the player and the guard can be on opposite sides of the room boundary. When `near` is set, accept a player in any room listed in `rooms`. Cross-room sight then relies on `isInLineOfSight` respecting walls and closed doors (npc-los / npc-sight-occlusion already treat a closed door as `CELL_DOOR`, `npc-sight-occlusion.js:365-369`).

### C3. The reaction: a new `closeDoor` mapping action
Add to `npc-manager.js` beside `unlockDoor` (`:1095-1105`):
`if (config.closeDoor) window.doorGates?.closeNow(config.closeDoor, { force: true })`.
A non-gate door is ignored with a warning. `force` skips the "an NPC is still crossing"
hold but **keeps** the "player overlaps the door" guard. Len is not harmed by a forced close
(no collider; re-path back-off; distance reopen). One mapping then gives both reactions:

```json
{ "eventPattern": "player_in_view_near:len", "conversationMode": "person-chat",
  "knot": "tailgate_warning", "closeDoor": "secure_area", "cooldown": 8000 }
```

The lockpick path itself can stay as it is. It has to *cancel* an action, which the position
watcher does not do.

---

## D. Robustness and the wayfinding findings

- **`Date.now()` clock bug** (`npc-sprites.js:1445`, `:1639`). It only runs where the
  avoidance-waypoint branch runs, which needs `config.patrol.waypoints` to be non-empty
  (`:1297-1301` and the player-collision branch at `:1495-1499`). A route-only Len
  (`multiRoom` + `route`, no top-level `waypoints`) **skips that branch**: a bump only
  triggers a 300ms settle. So the bug does not bite this beat, provided Len has no
  `patrol.waypoints`. The A2 cleanup (no teleport) also removes the only other surprise.
- **Bumps are likely.** The tailgater walks close behind Len, and `handleNPCPlayerCollision`
  triggers `triggerSettling` on each contact (`npc-sprites.js:1487-1489`). He pauses 300ms
  and continues; `_patrolStalled` (`npc-behavior.js:1147`) re-targets after 3s without
  progress, using loop time and working for route NPCs (`_isWaypointPatrol`, `:1137-1141`).
- **Other freeze risks are covered by the design:**
  - `pauseForPlayer` → scenario sets false (A3);
  - unreachable-leg hot loop → back-off (A3);
  - door closing mid-leg → hold rule (B2.4);
  - no wall colliders in the second room (`setupNPCWallCollisions` only uses the spawn room, `npc-sprites.js:846-870`), so the player could shove him through a wall → call it for each route room once loaded.
- **Stuck detector: recommended, not a prerequisite.** With the conditions above, the code
  has no known path that freezes Len. Build it next anyway, because this beat's correctness
  depends on Len never stopping, and the detector is the safety net for anything the probe
  misses. If the probe ever shows Len stopping for more than 3s, it becomes a prerequisite.
  Apply the two `Date.now()` one-line fixes regardless; they are risk-free.

---

## E. Probe plan (throwaway scenario, before touching the lab)

Scenario `scenarios/probe_tailgate/`:
- Two rooms, `probe_a` (start) and `probe_b`, joined by a **north/south** door. `probe_b` is not server-locked, and the door definition carries `gate: { openFor: ["guard"], openRadius: 56, holdMs: 2500, playerMayPassIf: "disguised" }`.
- One person NPC, `guard`: `patrol: { enabled: true, multiRoom: true, pauseForPlayer: false, route: [ {room: probe_a, waypoints: [mid, door-side]}, {room: probe_b, waypoints: [door-side, mid]} ] }`, no top-level `waypoints`; `los: { range: 200, angle: 120, challengeOnSight: { event: "player_in_view_near:guard", near: { door: "probe_b", radius: 64 }, skipIfGlobal: "disguised", rooms: ["probe_a","probe_b"] } }`; one mapping on that event with a tiny person-chat knot plus `closeDoor: "probe_b"`.
- Global `disguised` (default false) plus a debug way to set it (an ink choice or `window.gameState.globalVariables`).

Drive it with the `window.__test` bridge. Run on the keyless server on :3001, after committing the engine changes first.

Assertions:
1. **A, loop:** over 3 full loops (time-boxed to about 90s), the guard's body centre reaches every waypoint ±12px in order, in **both** directions. `npcManager.npcs.get('guard').roomId` alternates. No 3s stretch with less than 4px movement while `currentPath.length > 0`. No "Cannot find door" warning once A2 lands.
2. **A, no teleport:** the guard's sampled position never jumps more than 16px between 50ms samples.
3. **B, open:** each time the guard comes within 56px, `doorGates` reports open within 100ms; the door sprites' `body.enable === false`; `pm.worldGrid` door cells are 0. `door_gate_opened` fires once per approach.
4. **B, close:** the gate closes no sooner than `holdMs` after the guard leaves 56px, and **never** while his remaining path crosses the door cells. After closing, the door cells are 1 again, and `openDoorways` / `openNSDoors` no longer hold the door.
5. **B, no reload:** `loadRoom` is never called for `probe_b` after the first load (spy on `window.loadRoom`). The `rooms.probe_b` object keeps its identity.
6. **B, tailgate (disguised):** with `disguised = true`, walk the player behind the guard during the window. `currentPlayerRoom` becomes `probe_b`, no warning event fires, and the gate closes after both are clear.
7. **B, no tailgate (undisguised):** with `disguised = false`, the gate closes within one tick of the player coming within 56px, unless the player already overlaps the door. The player cannot reach `probe_b`.
8. **C:** undisguised, inside the guard's cone and within 64px of the door → exactly one `player_in_view_near:guard` (payload `targetId` = the door), the person-chat opens, and the door is closed. Disguised → no event. Outside the cone → no event. The same position again within `cooldown` → no second event.
9. **Click on a gate door:** `handleDoorInteraction` shows the denial and never calls `handleUnlock` (spy). The sprite is never destroyed.
10. **Never trapped:** force `closeDoor` while the guard is mid-doorway, from each side. He still completes the leg (no collider), or re-paths and reopens within 2s plus the reopen distance.
11. **Regression:** run an existing single-room patrol mission's playtest (m01 or m02) after A2/A3, to show that waypoint patrols and `goToAndStay` are unchanged.

Only after 1–10 pass should the gate, the `near` watch and the route move into the real lab.

---

## Build status and handover (2026-11-05)

The agent stopped at its context/tool-call limit before building. **Nothing below is built yet.**

Already committed separately: `f962375e1`, the per-room grid / `core/pathfinding.js`
dead-code removal (366/366 JS test files green; lab validator clean). Random patrol now uses
the world grid; it has unit coverage and **no live proof yet**.

Build order (commit after each; explicit paths; run `bin/test-js` after 3 and 5):
1. `near` on `challengeOnSight` → `player_in_view_near:<npcId>` (`npc-sight-challenge.js:42-149`).
2. `closeDoor` mapping action (`npc-manager.js` next to `unlockDoor` at `:1095`).
3. `systems/door-gates.js`, the `handleDoorInteraction` early return (`doors.js:606`),
   `PathfindingManager.unmarkDoor()`, and the game-loop call (`core/game.js` next to
   `sightChallengeWatcher.update` at about `:2418`). A new static import in `game.js` or
   `doors.js` means updating each `test/js` harness copy list that copies those files.
4. Route-unlock-then-load (section A6 above).
5. Multi-room fixes (A2, A3, D): explicit no-teleport hand-off, back-off plus in-flight
   guard, `pathFollowingActive` on route legs, wall colliders for route rooms.

Then: the `scenarios/probe_tailgate/` scenario (N/S gate door) and assertions 1–11 (section E),
plus **12: the guard unlocks and loads `probe_b` from its route action, then routes into it**
(`probe_b` is `locked: true` on the server; `window.rooms.probe_b` is absent before the action
and present after; no 403 in the console). Also a regression playtest of an existing
waypoint-patrol mission and a live random-patrol NPC moving. Use the keyless :3001 server.
