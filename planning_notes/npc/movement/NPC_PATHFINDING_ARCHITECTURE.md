# NPC Pathfinding: Understanding the Complete System

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    TILED MAP (room_office.json)             │
│                                                             │
│  Layers:                                                   │
│  • walls (tilelayer)      ← Wall tiles                      │
│  • tables (objectlayer)   ← Table objects                   │
└─────────────────────────────────────────────────────────────┘
         ↓                          ↓
┌─────────────────────────┐  ┌──────────────────────────┐
│  COLLISION SYSTEM       │  │  PATHFINDING SYSTEM      │
│  (collision.js)         │  │  (npc-pathfinding.js)    │
│                         │  │                          │
│ Wall Tiles              │  │ Grid Building:           │
│    ↓                    │  │ 1. Read wall tiles       │
│ Create collision boxes  │  │ 2. Read table objects    │
│ at tile edges           │  │ 3. Mark in grid          │
│                         │  │                          │
│ Result: Player blocked  │  │ Result: NPCs path-find   │
│         when walking    │  │         around obstacles │
└─────────────────────────┘  └──────────────────────────┘
         ↓                          ↓
┌─────────────────────────────────────────────────────────────┐
│              GAME BEHAVIOR: SYNCHRONIZED BLOCKING            │
│                                                             │
│  • Player can't walk through walls (collision system)      │
│  • NPCs won't pathfind through walls (pathfinding system)  │
│  • Both use same source data (Tiled map)                   │
│  • Behavior is consistent across systems                   │
└─────────────────────────────────────────────────────────────┘
```

## Coordinate System Alignment

```
TILED MAP (0,0 = top-left)
┌─────────────────────────────────────┐
│ (0,0)                    (9,0)      │ 10×10 grid of tiles
│   ●─────────────────────●           │
│   │   ROOM 10×10 tiles  │           │ Each tile = 32×32 pixels
│   │                      │           │
│   │  ┌──────┐            │           │ Walls: edge tiles
│   │  │TABLE │            │           │ Tables: object layer
│   │  └──────┘            │           │
│   │                      │           │
│   ●─────────────────────●           │
│ (0,9)                    (9,9)      │
└─────────────────────────────────────┘

WORLD COORDINATES (pixels)
┌─────────────────────────────────────┐
│ (0,0)                    (320,0)    │ 10 tiles × 32px = 320×320 px
│   ●─────────────────────●           │
│   │    ROOM 320×320 px  │           │ Each cell tracks obstacle
│   │                      │           │ 0 = walkable
│   │  ┌──────┐            │           │ 1 = impassable
│   │  │TABLE │            │           │
│   │  └──────┘            │           │
│   │                      │           │
│   ●─────────────────────●           │
│ (0,320)               (320,320)     │
└─────────────────────────────────────┘

CONVERSION FORMULAS
─────────────────────
Tile → World:   world_px = tile_coord × 32
World → Tile:   tile_coord = floor(world_px / 32)

Example:
  Table at (30, 205) pixels
  Start tile = (0, 6)
  End tile = (3, 7)
  Marked grid cells = 8 (2×4 rectangle)
```

## Grid Generation Process

### Step 1: Initialize Empty Grid
```
Grid (10×10):
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
[0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
```

### Step 2: Mark Wall Tiles
```
Wall layer has tiles at edges:
[1, 1, 1, 1, 1, 1, 1, 1, 1, 1]  ← Top edge
[1, 0, 0, 0, 0, 0, 0, 0, 0, 1]
[1, 0, 0, 0, 0, 0, 0, 0, 0, 1]
[1, 0, 0, 0, 0, 0, 0, 0, 0, 1]
[1, 0, 0, 0, 0, 0, 0, 0, 0, 1]
[1, 0, 0, 0, 0, 0, 0, 0, 0, 1]
[1, 0, 0, 0, 0, 0, 0, 0, 0, 1]
[1, 0, 0, 0, 0, 0, 0, 0, 0, 1]
[1, 0, 0, 0, 0, 0, 0, 0, 0, 1]
[1, 1, 1, 1, 1, 1, 1, 1, 1, 1]  ← Bottom edge
```

### Step 3: Mark Table Objects
```
Table at pixels (30, 205), size (78, 39):
Grid cells: (0-2, 6-7)

[1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
[1, 0, 0, 0, 0, 0, 0, 0, 0, 1]
[1, 0, 0, 0, 0, 0, 0, 0, 0, 1]
[1, 0, 0, 0, 0, 0, 0, 0, 0, 1]
[1, 0, 0, 0, 0, 0, 0, 0, 0, 1]
[1, 0, 0, 0, 0, 0, 0, 0, 0, 1]
[1, 0, 1, 1, 1, 0, 0, 0, 0, 1]  ← Table row 1
[1, 0, 1, 1, 1, 0, 0, 0, 0, 1]  ← Table row 2
[1, 0, 0, 0, 0, 0, 0, 0, 0, 1]
[1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
```

### Step 4: Pathfinding Uses Grid
```
EasyStar.js reads final grid:
• Accepts only tiles with value 0
• Finds path avoiding all 1s
• Routes NPC around walls and tables

Example path (S=start, E=end, *=path):
[1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
[1, S, *, 0, 0, 0, 0, 0, 0, 1]
[1, 0, *, 0, 0, 0, 0, 0, 0, 1]
[1, 0, *, 0, 0, 0, 0, 0, 0, 1]
[1, 0, *, 0, 0, 0, 0, 0, 0, 1]
[1, 0, *, *, 0, 0, 0, E, 0, 1]
[1, 0, 1, 1, 1, *, *, *, 0, 1]
[1, 0, 1, 1, 1, *, 0, 0, 0, 1]
[1, 0, 0, 0, 0, *, 0, 0, 0, 1]
[1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
```

## Console Messages During Initialization

```
🔧 Initializing pathfinding for room room_office...
   Map dimensions: 10x10
   WallsLayers count: 1
```
↓ Walls processed
```
✅ Processed wall layer with 20 tiles, marked 20 as impassable
✅ Total wall tiles marked as obstacles: 20
```
↓ Tables processed
```
✅ Marked 45 grid cells as obstacles from 8 tables
```
↓ Pathfinding ready
```
✅ Pathfinding initialized for room room_office
   Grid: 10x10 tiles | Patrol bounds: (2, 2) to (8, 8)
```

## Performance Analysis

```
Per-Room Initialization (one-time):
• Read wall tiles:     ~2-5ms
• Mark grid cells:     <1ms
• Read table objects:  ~1-3ms
• Mark table cells:    ~1-2ms
• Total per room:      ~5-10ms

Per-Pathfinding Query:
• No grid rebuild
• Direct EasyStar.js query
• ~2-5ms for typical paths
• No per-frame cost

Memory Impact:
• Grid size: 10×10 = 100 bytes per room
• Example: 5 rooms = 500 bytes
• Negligible (~0.5KB total)
```

## Troubleshooting

| Problem | Check | Solution |
|---------|-------|----------|
| NPCs walk through walls | Console: "WallsLayers count" | Verify room has walls layer |
| NPCs walk through tables | Console: "Marked X grid cells" | Verify tables layer in Tiled |
| No console output | Pathfinding init | Check game logs, room creation order |
| Wrong NPC path | Grid visualization | Check wall/table marking |
| Performance issues | Frame rate | Check NPC count, query frequency |

---

**Key Insight**: By synchronizing collision and pathfinding from the same source data (Tiled map), we ensure NPCs behave consistently with the physical world.
