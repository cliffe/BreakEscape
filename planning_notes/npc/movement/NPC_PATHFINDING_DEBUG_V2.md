# NPC Pathfinding - Debugging Update

## Recent Changes (v2)

Enhanced debugging output to identify exactly when and why pathfinding initialization fails.

### Files Updated

#### 1. `js/core/rooms.js`
- Changed pathfinding manager reference to use fallback: `const pfManager = pathfindingManager || window.pathfindingManager;`
- Added diagnostic logging showing why initialization might fail
- Now logs: `🔧 Initializing pathfinding for room...` when call is made
- Warns if `pfManager` or room data is unavailable

#### 2. `js/systems/npc-pathfinding.js`
- `initializeRoomPathfinding()`: Now logs when called, shows room data keys if map missing
- `getRandomPatrolTarget()`: Shows list of rooms WITH pathfinding initialized
- Improved error messages show exact missing pieces

### New Console Output

#### When Room Created and Pathfinding Called:
```
🔧 Initializing pathfinding for room test_patrol...
   Map dimensions: 10x9
   WallsLayers count: 1
✅ Processed wall layer with 64 tiles
✅ Pathfinding initialized for room test_patrol
   Grid: 10x9 tiles | Patrol bounds: (2, 2) to (8, 7)
```

#### If Initialization NOT Called:
```
⚠️ Cannot initialize pathfinding: pfManager=false, room=true
```
OR:
```
⚠️ Cannot initialize pathfinding: pfManager=true, room=false
```

#### If Room Data Exists But Map Missing:
```
📍 initializeRoomPathfinding called for room: test_patrol
⚠️ Room test_patrol has no tilemap, skipping pathfinding init
   roomData keys: map, layers, wallsLayers, objects, position, doorSprites
```

#### When Patrol Tries to Find Target:
```
⚠️ No bounds/grid for room test_patrol
   Bounds: MISSING | Grid: MISSING
   Available rooms with pathfinding: [list of working rooms]
```

---

## Troubleshooting Checklist

### Step 1: Verify Room Created
Look for in console:
```
🔧 Initializing pathfinding for room test_patrol...
```

If you see this, the room WAS created and initialization was ATTEMPTED.
If you DON'T see this, check:
- Is the room being loaded? (`loadRoom()` called?)
- Is `createRoom()` executing?

### Step 2: Verify Pathfinding Created Successfully
Look for:
```
✅ Pathfinding initialized for room test_patrol
```

If you see this, pathing should work.
If you see `⚠️ Room test_patrol has no tilemap`, check:
- Room's Tiled map file exists
- Room's `type` in scenario JSON matches map filename
- Tilemap was loaded in `game.js` preload

### Step 3: Verify NPC Patrol Attempts
Look for:
```
✅ [patrol_basic] New patrol path with 5 waypoints
```

If you see this, pathfinding found a valid route!
If you see:
```
⚠️ Could not find random patrol target for patrol_basic
```

Check list of available rooms:
```
Available rooms with pathfinding: office, warehouse
```

If `test_patrol` is not in the list, pathfinding was never initialized for that room (go back to Step 2).

---

## Most Likely Issue

Based on the error pattern showing `No bounds/grid for room test_patrol` repeatedly:

**The room's pathfinding is not being initialized at all.**

This could mean:

1. **`pathfindingManager` is null in `rooms.js`**
   - Check: `console.log(window.pathfindingManager)` in browser
   - Fix: Ensure `initializeRooms()` is called in `game.js` before rooms are created

2. **Room never reaches the pathfinding initialization code**
   - Add this to `game.js` after `initializeRooms()`:
   ```javascript
   console.log('pathfindingManager after init:', window.pathfindingManager);
   ```

3. **Different room instance being used**
   - Check if `rooms[roomId]` in `createRoom()` is the same as being passed to pathfinding
   - The pathfinding needs the SAME object reference

---

## Next Step: Manual Testing

1. Open browser DevTools Console
2. Load test scenario
3. Look for: `🔧 Initializing pathfinding for room`
4. If not found, add console.log to `game.js`:
   ```javascript
   // In game.js create() after initializeRooms()
   console.log('DEBUG: pathfindingManager exists?', !!window.pathfindingManager);
   ```

5. Report console output showing the flow

---

## File Structure Summary

```
game.js (create)
  ↓
initializeRooms(gameInstance)  ← Creates window.pathfindingManager
  ↓
[Later] loadRoom(roomId)
  ↓
createRoom(roomId, roomData, position)
  ↓
if (pfManager) pathfindingManager.initializeRoomPathfinding()  ← THIS STEP FAILING
  ↓
createNPCSpritesForRoom()
  ↓
NPCBehavior.chooseNewPatrolTarget()
  ↓
pathfindingManager.getRandomPatrolTarget()  ← "No bounds/grid for room" ERROR
```

---

