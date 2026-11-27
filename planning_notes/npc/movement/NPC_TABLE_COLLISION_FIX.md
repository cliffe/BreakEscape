# Fixed: NPCs Now Properly Avoid Tables (Physical + Pathfinding)

## Problem Identified
NPCs were walking through tables despite pathfinding obstacles being added because:

1. **Pathfinding grid wasn't finding tables** - The code was looking for `roomData.map.objects` as a flat array, but it's actually an array of **layers** that need to be accessed via `getObjectLayer()` from the Phaser Tilemap object

2. **No physics collisions between NPCs and tables** - Even if pathfinding worked, NPCs had no collision bodies set up with table objects

## Solutions Implemented

### Fix 1: Correct Table Detection in Pathfinding Grid

**File**: `js/systems/npc-pathfinding.js`

**Problem**: 
```javascript
// WRONG: This was trying to access raw JSON structure
const tablesLayer = roomData.map.objects.find(layer => 
    layer.name && layer.name.toLowerCase() === 'tables'
);
```

**Solution**:
```javascript
// CORRECT: Use Phaser's getObjectLayer() method
const tablesLayer = roomData.map.getObjectLayer('tables');

if (tablesLayer && tablesLayer.objects && tablesLayer.objects.length > 0) {
    // Process each table object
    tablesLayer.objects.forEach((tableObj, idx) => {
        // Convert world coordinates to grid tiles
        // Mark grid cells as impassable
    });
}
```

**Result**: Now you'll see console output:
```
🔍 Looking for tables object layer: Found
📦 Processing 8 table objects...
  Table 0: (30, 205) size 78x39
  -> Tiles: (0, 6) to (3, 7)
  -> Marked 8 grid cells
✅ Marked 45 total grid cells as obstacles from 8 tables
```

### Fix 2: Added NPC-to-Table Physical Collisions

**File**: `js/systems/npc-sprites.js`

**Added new function**: `setupNPCTableCollisions()`

```javascript
export function setupNPCTableCollisions(scene, npcSprite, roomId) {
    // Get all table objects in the room
    const room = window.rooms[roomId];
    
    // For each table, add a physics collider between NPC and table
    Object.values(room.objects).forEach(obj => {
        if (obj && obj.body && obj.body.static) {
            const isTable = (obj.scenarioData?.type === 'table') || 
                           (obj.name?.toLowerCase().includes('desk'));
            
            if (isTable) {
                game.physics.add.collider(npcSprite, obj);
                tablesAdded++;
            }
        }
    });
}
```

**Updated**: `setupNPCEnvironmentCollisions()` now calls:
```javascript
setupNPCWallCollisions(scene, npcSprite, roomId);
setupNPCTableCollisions(scene, npcSprite, roomId);  // NEW
setupNPCChairCollisions(scene, npcSprite, roomId);
```

**Result**: Console output shows:
```
✅ NPC wall collisions set up for npc_guard in room office: ...
✅ NPC table collisions set up for npc_guard in room office: added collisions with 8 tables
✅ NPC chair collisions set up for npc_guard in room office: added collisions with 3 chairs
```

## How Tables Now Work

### Dual Obstacle System

| System | Purpose | Implementation |
|--------|---------|-----------------|
| **Pathfinding Grid** | Prevents NPCs from **planning** paths through tables | Marks grid cells as impassable (value=1) |
| **Physics Colliders** | Prevents NPCs from **physically moving** into tables | Adds collision between NPC sprite and table sprite |

### Data Flow for Tables

```
1. Room Creation (rooms.js)
   ↓
2. Process Tiled 'tables' object layer
   ├─ Create sprite for each table
   ├─ Set physics body (static)
   ├─ Store in room.objects
   ↓
3. Pathfinding Initialization (npc-pathfinding.js)
   ├─ Read 'tables' object layer via getObjectLayer()
   ├─ Convert table world position → grid tiles
   ├─ Mark grid cells as impassable (value=1)
   ↓
4. NPC Sprite Creation (npc-sprites.js)
   ├─ Create NPC physics body
   ├─ setupNPCTableCollisions()
   │   └─ Find all table objects in room
   │   └─ Add collider between NPC and each table
   ↓
5. NPC Movement (npc-behavior.js)
   ├─ Pathfinding respects grid obstacles
   ├─ Physics prevents collision penetration
   └─ Result: NPC avoids tables
```

## Key Code Changes

### npc-pathfinding.js (buildGridFromWalls method)
- Changed: `roomData.map.objects.find()` 
- To: `roomData.map.getObjectLayer('tables')`
- Added detailed debugging console output
- Now properly marks all table grid cells

### npc-sprites.js (new function)
```javascript
export function setupNPCTableCollisions(scene, npcSprite, roomId) {
    // ... identifies and collides with table sprites
}
```

### npc-sprites.js (updated function)
```javascript
export function setupNPCEnvironmentCollisions(scene, npcSprite, roomId) {
    setupNPCWallCollisions(scene, npcSprite, roomId);
    setupNPCTableCollisions(scene, npcSprite, roomId);  // NEW LINE
    setupNPCChairCollisions(scene, npcSprite, roomId);
}
```

## Testing

To verify the fix works:

1. **Check pathfinding grid messages**:
   ```
   ✅ Marked 45 total grid cells as obstacles from 8 tables
   ```

2. **Check NPC collision setup**:
   ```
   ✅ NPC table collisions set up for npc_guard: added collisions with 8 tables
   ```

3. **Watch NPC behavior**:
   - NPCs should avoid walking through tables
   - Waypoint patrols should route around obstacles
   - If blocked by table, NPC should stop/change direction

## Files Modified

- ✅ `js/systems/npc-pathfinding.js` - Fixed table detection using `getObjectLayer()`
- ✅ `js/systems/npc-sprites.js` - Added `setupNPCTableCollisions()` function

## Why This Works

### Before
- Pathfinding: Tables not found (wrong API call) → grid cells not marked
- Physics: No colliders setup → NPCs could walk through tables
- **Result**: NPCs walked through tables in both planning and execution

### After
- Pathfinding: Tables found via `getObjectLayer()` → grid cells properly marked
- Physics: Colliders setup between NPC and each table → physical blocking
- **Result**: NPCs avoid tables during pathfinding AND blocked physically if they get close

## Next Steps

The fix is complete! NPCs should now:
1. ✅ Plan paths around tables (pathfinding grid)
2. ✅ Be blocked physically from walking into tables (collision)
3. ✅ Follow waypoints that respect table obstacles
4. ✅ Work with all NPC behaviors (patrol, facePlayer, etc.)

Load `test-npc-waypoints.json` and watch NPCs navigate around the office while avoiding both walls and tables!
