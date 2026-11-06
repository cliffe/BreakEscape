# NPC Pathfinding Obstacles: Tables, Walls & Collision Avoidance

## Problem
NPCs were walking through tables (desks) and walls instead of avoiding them. The pathfinding grid needed to match what the collision system actually blocks.

## Solution
Enhanced the pathfinding grid building to include:
1. **All wall tiles** (which have collision boxes created from them)
2. **Table objects** as obstacles

This ensures the pathfinding grid matches the actual collision geometry in the game.

## How It Works

### Grid Building Process
The `buildGridFromWalls()` method in `npc-pathfinding.js` now performs **two passes**:

**Pass 1: Wall Tiles** (from Tiled wall layer)
- Iterates through wall collision layers from the Tiled map
- Marks **ALL wall tiles** as impassable (value = 1)
- The collision system creates collision boxes from these exact tiles (see `createWallCollisionBoxes()` in `collision.js`)
- By marking all wall tiles here, pathfinding avoids the same areas as the collision system

**Pass 2: Table Objects** (NEW)
- Extracts the `tables` object layer from the Tiled map
- For each table object:
  - Gets world coordinates: `(x, y)` and dimensions `(width, height)`
  - Converts to tile coordinates using `TILE_SIZE = 32`
  - Marks all grid tiles covered by the table as impassable
- Logs total cells marked to help debug coverage

### Coordinate Conversion
```javascript
// Table world coordinates → tile coordinates
const startTileX = Math.floor(tableWorldX / TILE_SIZE);
const startTileY = Math.floor(tableWorldY / TILE_SIZE);
const endTileX = Math.ceil((tableWorldX + tableWidth) / TILE_SIZE);
const endTileY = Math.ceil((tableWorldY + tableHeight) / TILE_SIZE);

// Mark all covered tiles
for (let tileY = startTileY; tileY < endTileY; tileY++) {
    for (let tileX = startTileX; tileX < endTileX; tileX++) {
        grid[tileY][tileX] = 1; // Impassable
    }
}
```

## Pathfinding Grid Values
- **0**: Walkable tile
- **1**: Impassable (wall tile, table, or other obstacle)

EasyStar.js uses `setAcceptableTiles([0])` to only pathfind through walkable tiles.

## Collision System Alignment

### How Walls Work
1. **Tiled Map**: Contains a "walls" layer with wall tiles
2. **Collision System** (`collision.js`): 
   - Calls `createWallCollisionBoxes()` for each wall tile
   - Creates thin collision boxes on the **edges** of wall tiles
   - These boxes are positioned at tile boundaries (north/south/east/west edges)
   - Example: For a wall tile at (5,5), boxes are created at:
     - Top edge: y=5*32-4
     - Bottom edge: y=5*32+32-4
     - Left edge: x=5*32+32-4
     - Right edge: x=5*32+4

3. **Pathfinding System** (this file):
   - Marks the **entire wall tile** as impassable
   - This prevents NPCs from pathfinding through the tile
   - Result: NPCs automatically avoid walking to tiles where collision boxes exist

## What Gets Marked as Obstacles
✅ **Wall tiles** from Tiled wall layer (collision boxes created from these)  
✅ **Table objects** from Tiled object layer  
✅ All other object layers that should be obstacles (can be extended)

## Extending to Other Objects
To add more obstacle types (chairs, plants, etc.), add additional passes:

```javascript
// Mark chairs as obstacles (example)
const chairsLayer = roomData.map.objects.find(layer => layer.name === 'chairs');
if (chairsLayer) {
    chairsLayer.forEach(chairObj => {
        // Convert to tiles and mark as impassable
        const startTileX = Math.floor(chairObj.x / TILE_SIZE);
        // ... mark tiles
    });
}
```

## Tiled Map Structure
Tables are stored in Tiled as:
- **Layer Type**: Object Layer (not tilelayer)
- **Layer Name**: `tables`
- **Objects**: Each table has `x`, `y`, `width`, `height` properties

Example from `room_office2.json`:
```json
{
  "name": "tables",
  "type": "objectgroup",
  "objects": [
    {
      "x": 30,
      "y": 205,
      "width": 78,
      "height": 39,
      "gid": 117,
      "visible": true
    },
    // ... more tables
  ]
}
```

## Console Output
When initializing pathfinding, you'll see:
```
✅ Processed wall layer with 20 tiles, marked 20 as impassable
✅ Total wall tiles marked as obstacles: 20
✅ Marked 45 grid cells as obstacles from 8 tables
```

This tells you:
- How many wall tiles were processed
- How many table grid cells were marked as obstacles (total coverage)
- How many table objects were processed

## Testing
Load any scenario with tables (e.g., `test-npc-waypoints.json` in room_office):
1. Watch NPCs patrol with waypoints
2. Observe they now **avoid walking through tables**
3. Check console for obstacle marking messages

## Performance Notes
- Grid building happens **once per room** when pathfinding initializes
- Minimal overhead: Loop through table objects → calculate tile coverage → mark grid
- Pathfinding queries remain unchanged (still uses EasyStar.js)
- No per-frame performance impact

## Future Enhancements
1. **Dynamic obstacles**: Could update grid when objects move/appear
2. **Soft obstacles**: Different grid values (0=walkable, 1=hard wall, 0.5=soft obstacle) with priority
3. **Multiple collision layers**: Support chairs, plants, other furniture as obstacles
4. **Dynamic table placement**: If tables are added via scenario, rebuild grid

## Coordinate Systems

### World vs Grid Coordinates
Two different coordinate systems are at play:

**1. World Coordinates** (Phaser game world)
- Measured in pixels
- Room position: (0, 0) is typically top-left
- Table position from Tiled: (30, 205) in world pixels

**2. Grid Coordinates** (Pathfinding)
- Measured in tiles
- Each tile = 32 pixels (TILE_SIZE constant)
- Grid position = World position / 32

### Wall Tile Example
For a wall at Tiled tile (5, 5):
- **Tile grid position**: (5, 5)
- **World pixel position**: (160, 160) = 5 × 32, 5 × 32
- **Collision boxes created**: Thin boxes at tile edges
- **Pathfinding grid**: Entire tile (5, 5) marked as impassable

### Table Example
For a table at world pixels (30, 205) with size (78, 39):
- **Start tile**: (0, 6) = floor(30/32), floor(205/32)
- **End tile**: (3, 7) = ceil(108/32), ceil(244/32)
- **Grid cells marked**: (0,6), (1,6), (2,6), (3,6), (0,7), (1,7), (2,7), (3,7)
- **Result**: All these cells are marked impassable (value=1)

## Related Files
- `js/systems/npc-pathfinding.js` - Main implementation
- `js/systems/npc-behavior.js` - Uses pathfinding for patrol routes
- `js/systems/collision.js` - Creates wall collision boxes from same tiles
- `assets/rooms/*.json` - Tiled maps with wall layers and table objects
- `scenarios/*.json` - NPC configurations using waypoint patrol
