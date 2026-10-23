# Quick Reference: NPC Pathfinding Obstacles

## What Gets Blocked?
- ✅ **Walls** (from Tiled wall layer tiles)
- ✅ **Tables** (from Tiled object layer)
- ✅ Both are marked in the pathfinding grid as impassable

## How It Works (Simplified)
1. **Grid Initialization** (`npc-pathfinding.js`)
   - Create 2D grid matching map dimensions
   - Mark wall tiles as 1 (impassable)
   - Mark table objects as 1 (impassable)
   - All other cells are 0 (walkable)

2. **Pathfinding Query**
   - EasyStar.js uses the grid
   - Only routes through cells with value 0
   - Results in paths that avoid obstacles

3. **NPC Movement**
   - NPCs follow the pathfinded path
   - Automatically avoid walls and tables
   - Waypoint patrols respect obstacles

## File Structure

```
js/systems/
├── npc-pathfinding.js         ← Grid building, pathfinding queries
├── npc-behavior.js             ← Uses pathfinding for patrol
└── collision.js                ← Creates collision boxes from walls

assets/rooms/
└── *.json                       ← Tiled maps with walls and tables

docs/
├── NPC_PATHFINDING_OBSTACLES.md    ← Full documentation
└── NPC_PATHFINDING_FIX_SUMMARY.md  ← Summary of fix
```

## Grid Values
- `0` = Walkable
- `1` = Impassable (wall or table)

## Coordinate Conversion
- **TILE_SIZE** = 32 pixels
- **World to Grid**: `tileCoord = Math.floor(worldPixel / 32)`
- **Grid to World**: `worldPixel = tileCoord * 32 + 16` (center)

## Common Issues & Solutions

### NPCs Still Walking Through Obstacles?
1. Check console for grid initialization messages
2. Verify wall layer exists: "WallsLayers count: X"
3. Verify tables found: "Marked X grid cells as obstacles"
4. Check Tiled map has walls and tables objects

### No Console Messages?
1. Pathfinding not initialized for room
2. Room may not have wallsLayers
3. Check game logs in developer console

### Tables Not Blocking?
1. Tiled map must have "tables" object layer
2. Tables must have x, y, width, height
3. Coordinate system: (0,0) is top-left of map

## Testing Checklist
- [ ] NPCs don't walk through walls
- [ ] NPCs don't walk through tables
- [ ] Waypoint patrols respect obstacles
- [ ] Pathfinding initializes with correct console output
- [ ] No performance issues with multiple NPCs

## Example Console Output
```
🔧 Initializing pathfinding for room room_office...
   Map dimensions: 10x10
   WallsLayers count: 1
✅ Processed wall layer with 20 tiles, marked 20 as impassable
✅ Total wall tiles marked as obstacles: 20
✅ Marked 45 grid cells as obstacles from 8 tables
✅ Pathfinding initialized for room room_office
   Grid: 10x10 tiles | Patrol bounds: (2, 2) to (8, 8)
```

## Related Documentation
- Full details: `docs/NPC_PATHFINDING_OBSTACLES.md`
- Fix summary: `docs/NPC_PATHFINDING_FIX_SUMMARY.md`
- Waypoint patrol: `docs/NPC_PATROL_WAYPOINTS.md`
- NPC guide: `docs/NPC_INTEGRATION_GUIDE.md`
