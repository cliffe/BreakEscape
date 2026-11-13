# NPC Pathfinding Debugging Guide

## Issue: "No bounds/grid for room test_patrol"

### Root Causes & Solutions

#### 1. **Pathfinding Manager Not Created**
**Symptom:** `No pathfinding manager for [npcId]`

**Check:**
```javascript
// In browser console
console.log(window.pathfindingManager);  // Should be an object, not undefined
```

**Fix:**
- Ensure `initializeRooms(gameInstance)` is called in `game.js create()`
- Check that line in `game.js`: `initializeRooms(this);` executes BEFORE NPC creation

---

#### 2. **Pathfinding Not Initialized for Specific Room**
**Symptom:** `No bounds/grid for room test_patrol`

**Check:**
```javascript
// In browser console
window.pathfindingManager.getBounds('test_patrol');  // Should return bounds object
window.pathfindingManager.getGrid('test_patrol');    // Should return grid array
```

**Common Causes:**
1. Room never loaded (no `loadRoom()` call)
2. Room loaded but `initializeRoomPathfinding()` not called
3. Room has no tilemap data (`roomData.map` is null/undefined)

**Debug Steps:**
```javascript
// Check if room is loaded
console.log(window.rooms['test_patrol']);  // Should exist

// Check if map exists
console.log(window.rooms['test_patrol'].map);  // Should be Tilemap object

// Check if wallsLayers populated
console.log(window.rooms['test_patrol'].wallsLayers);  // Should be array with layers
```

---

#### 3. **Bounds Calculation Wrong**
**Symptom:** Pathfinding initialized but `getRandomPatrolTarget()` always fails

**Common Issue:** Room is too small or all tiles are marked as walls

**Debug:**
```javascript
const bounds = window.pathfindingManager.getBounds('test_patrol');
console.log(`Bounds: x=${bounds.x}, y=${bounds.y}, width=${bounds.width}, height=${bounds.height}`);
console.log(`Map size: ${bounds.mapWidth}x${bounds.mapHeight}`);

const grid = window.pathfindingManager.getGrid('test_patrol');
// Count walkable tiles
let walkableTiles = 0;
for (let y = bounds.y; y < bounds.y + bounds.height; y++) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x++) {
        if (grid[y][x] === 0) walkableTiles++;
    }
}
console.log(`Walkable tiles in bounds: ${walkableTiles}`);
```

**Fix:** If no walkable tiles found:
- Check room's Tiled map layers (ensure "walls" layer exists and is properly named)
- Verify wall tiles have collision properties set in Tiled
- Try reducing patrol bounds (modify `PATROL_EDGE_OFFSET` in `npc-pathfinding.js`)

---

#### 4. **Wall Layer Not Detected**
**Symptom:** Grid created but all tiles marked as walls or no tiles marked

**Debug:**
```javascript
const room = window.rooms['test_patrol'];
console.log('Wall layers:', room.wallsLayers.length);
room.wallsLayers.forEach((layer, i) => {
    const tiles = layer.getTilesWithin(0, 0, room.map.width, room.map.height, { isNotEmpty: true });
    console.log(`  Layer ${i}: ${tiles.length} non-empty tiles`);
    
    let collidingTiles = 0;
    tiles.forEach(tile => {
        if (tile.collides && tile.canCollide) collidingTiles++;
    });
    console.log(`  Layer ${i}: ${collidingTiles} colliding tiles`);
});
```

**Check Tiled Map:**
- Open map file in Tiled editor
- Verify "walls" layer exists and contains collision data
- Tiles should have "Collision" checkbox marked
- Layer name must contain "walls" (case-insensitive)

---

#### 5. **NPCBehaviorManager Created Before Pathfinding Manager**
**Symptom:** Behavior manager tries to use undefined pathfinding manager

**Fixed in:** `npc-behavior.js` now uses `window.pathfindingManager` as fallback

**Verification:**
```javascript
console.log('Timing check:');
console.log('  pathfindingManager:', window.pathfindingManager ? 'EXISTS' : 'MISSING');
console.log('  npcBehaviorManager:', window.npcBehaviorManager ? 'EXISTS' : 'MISSING');

// Verify behavior has reference
if (window.npcBehaviorManager) {
    const behavior = window.npcBehaviorManager.getBehavior('patrol_narrow_vertical');
    console.log('  Behavior pathfindingManager:', behavior?.pathfindingManager ? 'EXISTS' : 'MISSING');
}
```

---

## Execution Flow Debugging

### Step 1: Game Initialization
```javascript
// Check 1: Pathfinding manager created
console.log('✓ window.pathfindingManager:', !!window.pathfindingManager);

// Check 2: Behavior manager created
console.log('✓ window.npcBehaviorManager:', !!window.npcBehaviorManager);
```

### Step 2: Room Loading
```javascript
// When room loads, check these:
console.log('✓ Room loaded:', !!window.rooms['test_patrol']);
console.log('✓ Room has map:', !!window.rooms['test_patrol'].map);
console.log('✓ Room has wallsLayers:', window.rooms['test_patrol'].wallsLayers?.length > 0);
```

### Step 3: NPC Creation
```javascript
// After NPCs are created:
console.log('✓ NPC exists:', !!window.npcManager.npcs.get('patrol_narrow_vertical'));

// Check behavior
const behavior = window.npcBehaviorManager.getBehavior('patrol_narrow_vertical');
console.log('✓ Behavior created:', !!behavior);
console.log('✓ Behavior has pathfindingManager:', !!behavior?.pathfindingManager);
```

### Step 4: Patrol Execution
```javascript
// Enable patrol in scenario JSON, then check:
console.log('Patrol state:');
const behavior = window.npcBehaviorManager.getBehavior('patrol_narrow_vertical');
console.log('  patrolTarget:', behavior.patrolTarget);
console.log('  currentPath length:', behavior.currentPath.length);
console.log('  pathIndex:', behavior.pathIndex);
console.log('  Room ID:', behavior.roomId);
```

---

## Console Output Patterns

### ✅ Successful Initialization
```
🔧 Initializing pathfinding for room test_patrol...
   Map dimensions: 10x9
   WallsLayers count: 1
✅ Processed wall layer with 64 tiles
✅ Pathfinding initialized for room test_patrol
   Grid: 10x9 tiles | Patrol bounds: (2, 2) to (8, 7)
✅ [patrol_narrow_vertical] New patrol path with 5 waypoints
🚶 [patrol_narrow_vertical] Patrol waypoint 1/5 - velocity: (95, -45)
```

### ❌ Failed Initialization - Missing Bounds
```
⚠️ No bounds/grid for room test_patrol
   Bounds: MISSING | Grid: MISSING
⚠️ Could not find random patrol target for patrol_narrow_vertical
```

### ❌ Failed Initialization - All Tiles Walls
```
⚠️ Could not find valid random position in test_patrol after 20 attempts
   Bounds: x=2, y=2, width=6, height=5
   Grid size: 10x9
```

---

## Configuration Checklist

### Scenario JSON
- [ ] NPC has `behavior.patrol.enabled: true`
- [ ] NPC has `position` defined
- [ ] Room exists in `rooms` section
- [ ] Room has `type` matching a Tiled map file

### Tiled Map File
- [ ] "walls" layer exists (name contains "walls", case-insensitive)
- [ ] Wall tiles have collision data (checkbox in Tiled)
- [ ] Room dimensions reasonable for patrol (not too small)

### Code Setup
- [ ] `game.js` calls `initializeRooms(this)`
- [ ] `rooms.js` calls `pathfindingManager.initializeRoomPathfinding()`
- [ ] `npc-behavior.js` receives `pathfindingManager` reference

---

## Quick Fixes

### "No bounds/grid for room"
1. Check `window.pathfindingManager` exists
2. Verify room is loaded: `window.rooms[roomId]`
3. Check pathfinding was initialized: `window.pathfindingManager.getBounds(roomId)`

### "Could not find random patrol target"
1. Verify grid not all walls: Count walkable tiles
2. Increase patrol area: Reduce `PATROL_EDGE_OFFSET`
3. Check walls layer properly configured in Tiled

### NPC not patrolling at all
1. Check `patrol.enabled: true` in scenario
2. Verify behavior manager has pathfinding manager: `console.log(window.npcBehaviorManager.getPathfindingManager())`
3. Enable patrol: `window.npcBehaviorManager.getBehavior('npcId').config.patrol.enabled = true`

---

## Files Involved

| File | Responsibility |
|------|-----------------|
| `js/core/game.js` | Creates pathfinding manager via `initializeRooms()` |
| `js/core/rooms.js` | Initializes pathfinding for each room |
| `js/systems/npc-pathfinding.js` | EasyStar integration & grid management |
| `js/systems/npc-behavior.js` | Uses pathfinding for patrol decisions |
| Tiled `.tmj` files | Wall layer collision data |
| Scenario `.json` | NPC patrol configuration |

---

## Performance Notes

- Grid built once per room load
- Pathfinding computed asynchronously
- No per-frame pathfinding overhead
- Each room has independent pathfinder

---

