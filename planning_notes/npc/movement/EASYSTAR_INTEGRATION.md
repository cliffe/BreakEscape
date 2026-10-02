# EasyStar.js NPC Pathfinding Integration - Implementation Summary

## Overview
Successfully integrated **EasyStar.js** pathfinding system for NPC patrol routes in Break Escape. NPCs now intelligently navigate rooms avoiding walls, and patrol to random valid destinations within room bounds (2 tiles from room edges).

## Files Created

### 1. `js/systems/npc-pathfinding.js` (NEW)
Manages EasyStar.js pathfinding across all rooms.

**Key Classes:**
- **NPCPathfindingManager**: Singleton manager for all room pathfinders
  - One EasyStar pathfinder instance per room
  - Builds collision grids from wall layer data
  - Calculates patrol bounds (2 tiles from room edges)
  - Provides random patrol target selection
  - Converts paths between tile and world coordinates

**Key Methods:**
- `initializeRoomPathfinding(roomId, roomData, roomPosition)`: Initialize pathfinding for a room
- `findPath(roomId, startX, startY, endX, endY, callback)`: Request a path from A to B
- `getRandomPatrolTarget(roomId)`: Get random walkable position within patrol bounds
- `buildGridFromWalls(roomId, roomData, mapWidth, mapHeight)`: Build collision grid

**Features:**
- Reads wall collision data from room's wallsLayers
- Marks wall tiles as impassable (value 1), walkable tiles as 0
- Patrol bounds automatically calculated: x±2 tiles, y±2 tiles from room edges
- Diagonal movement enabled for smooth pathfinding

## Files Modified

### 1. `js/systems/npc-behavior.js`
Integrated EasyStar pathfinding into NPC patrol behavior.

**Changes:**
- Added import: `import { NPCPathfindingManager } from './npc-pathfinding.js?v=1'`
- Updated docstring to mention EasyStar integration
- Added `pathfindingManager` parameter to `NPCBehavior` constructor
- Replaced patrol state variables:
  - Removed: `patrolAngle`, `patrolCenter`, `patrolRadius`, `collisionRotationAngle`, `wasBlockedLastFrame`
  - Added: `currentPath[]`, `pathIndex`, `currentPath = []`
- **Replaced methods:**
  - `updatePatrol(time, delta)`: Now follows computed waypoints instead of direct movement
  - `chooseRandomPatrolDirection()` → `chooseNewPatrolTarget(time)`: Uses EasyStar to find valid targets

**Updated NPCBehaviorManager:**
- Initialize pathfinding manager in constructor
- Pass pathfinding manager to NPCBehavior instances
- Added `getPathfindingManager()` method

**New Patrol Logic:**
1. If no current path or interval expired, request new target
2. `getRandomPatrolTarget()` returns random walkable position in bounds
3. `findPath()` asynchronously computes route
4. NPC follows waypoints step-by-step, updating direction/animation
5. When reaching path end, select new target

### 2. `js/core/rooms.js`
Integrated pathfinding manager initialization.

**Changes:**
- Added import: `import { NPCPathfindingManager } from '../systems/npc-pathfinding.js?v=1'`
- Added global variable: `export let pathfindingManager = null`
- In `initializeRooms()`: Create pathfinding manager instance and expose to window
- In `createRoom()`: Call `pathfindingManager.initializeRoomPathfinding()` after walls are loaded

## How It Works

### Initialization Flow
```
game.js create()
  ↓
initializeRooms(gameInstance)
  ↓
pathfindingManager = new NPCPathfindingManager(gameInstance)
  ↓
loadRoom(roomId)
  ↓
createRoom(roomId, roomData, position)
  ↓
pathfindingManager.initializeRoomPathfinding(roomId, rooms[roomId], position)
  ↓
[Grid built from walls, pathfinder configured, patrol bounds calculated]
```

### Patrol Execution Flow
```
NPCBehavior.update() [every 50ms]
  ↓
determineState() → returns 'patrol'
  ↓
executeState('patrol')
  ↓
updatePatrol(time, delta)
  ├─ If time to pick new target:
  │  └─ chooseNewPatrolTarget(time)
  │     ├─ getRandomPatrolTarget() → random walkable position
  │     ├─ findPath(start, target) → request path
  │     └─ [Async] currentPath populated when done
  │
  └─ If following path:
     ├─ Get next waypoint from currentPath[pathIndex]
     ├─ Move toward waypoint
     ├─ Update direction/animation based on velocity
     └─ When reached waypoint, move to next OR select new target
```

## Patrol Behavior Changes

### Before
- NPCs moved in circular patterns
- Used collision rotation workaround when blocked
- Chose targets within defined bounds but often got stuck

### After
- NPCs find optimal paths around obstacles
- Always follow valid A* routes
- Randomly select from all walkable positions within bounds
- No more collision workarounds needed
- Respect walls defined in Tiled maps

## Configuration

### Patrol Bounds
- **Default offset**: 2 tiles from room edges (defines `PATROL_EDGE_OFFSET`)
- Room size - 4 tiles total (for 10×9 tile rooms: walkable area ~6×5 tiles)
- Can be adjusted in `npc-pathfinding.js` line 16

### Room Wall Detection
- Automatically reads from `wallsLayers` in room data
- Checks `tile.collides && tile.canCollide` properties
- Converts tile coordinates to grid (1 = wall, 0 = walkable)

### Patrol Interval
- Existing `config.patrol.changeDirectionInterval` still controls when NPCs pick new targets (default: 3000ms)
- Path-following is continuous within a single patrol interval

## Technical Details

### Grid Conversion
- **Tile → World**: `world = bounds.worldX + tileX * TILE_SIZE + TILE_SIZE/2`
- **World → Tile**: `tile = (world - bounds.worldX) / TILE_SIZE`
- Center of tile ensures smooth movement

### Performance
- One pathfinder per room (not per NPC)
- Paths computed asynchronously (doesn't block frame updates)
- Grid built once per room load
- No per-frame pathfinding calculations

### Diagonal Movement
- `pathfinder.enableDiagonals()` allows 8-directional movement
- Smoother, more natural patrol paths
- A* pathfinding handles optimal routing

## Testing Checklist

- [ ] Load a scenario with patrolling NPCs
- [ ] Verify NPCs avoid walls and room obstacles
- [ ] Check that NPCs stay within 2 tiles of room edges
- [ ] Confirm no console errors in browser DevTools
- [ ] Test multiple NPCs in same room
- [ ] Verify path following (watch console logs for waypoint progress)
- [ ] Check patrol transitions (new target after interval)

## Example Console Output

```
✅ NPCPathfindingManager initialized
✅ Pathfinding initialized for room office
   Grid: 10x9 tiles | Patrol bounds: (2, 2) to (8, 7)
🤖 Behavior registered for npc_guard
✅ [npc_guard] New patrol path with 8 waypoints
🚶 [npc_guard] Patrol waypoint 1/8 - velocity: (125, 45)
🚶 [npc_guard] Patrol waypoint 2/8 - velocity: (95, -30)
✅ [npc_guard] New patrol path with 5 waypoints
```

## Debugging

### Check if pathfinding initialized:
```javascript
console.log(window.pathfindingManager);
console.log(window.pathfindingManager.getGrid('room_id'));
console.log(window.pathfindingManager.getBounds('room_id'));
```

### Common Issues

1. **NPCs not patrolling**: Check patrol enabled in scenario JSON
2. **NPCs stuck on walls**: Verify wall layer named includes "wall" (case-insensitive)
3. **No waypoints logged**: Check EasyStar.js loaded and pathfinder initialized
4. **Paths unreachable**: Room might have large obstacles blocking valid routes

## Files Included

1. `/js/systems/npc-pathfinding.js` - EasyStar integration
2. `/js/systems/npc-behavior.js` - Updated with pathfinding
3. `/js/core/rooms.js` - Pathfinding manager initialization
4. `/js/systems/npc-behavior.js.bak` - Backup of original

## Version Tags

- `npc-pathfinding.js?v=1` - Initial version
- `npc-behavior.js?v=8` (existing) - Still valid
- `rooms.js?v=16` (existing) - Still valid

## Next Steps

Consider these enhancements:
1. Add tile cost for different terrain types (e.g., swamps are slower)
2. Dynamic pathfinding updates when walls change
3. Group patrol (multiple NPCs follow coordinated routes)
4. Flee behavior using pathfinding (run away from threats)
5. Chase behavior using live pathfinding to player

