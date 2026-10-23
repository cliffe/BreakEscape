# NPC Pathfinding Documentation Index

## Quick Start (2 minutes)
**File**: `NPC_PATHFINDING_QUICK_REF.md`
- What gets blocked? Walls and tables
- How does it work? (simplified)
- Quick testing checklist
- Common issues

## Complete Solution (10 minutes)
**File**: `NPC_PATHFINDING_FIX_SUMMARY.md`
- What was the problem?
- Root causes identified
- Solution implemented
- Files modified
- Testing procedure

## Technical Details (20 minutes)
**File**: `NPC_PATHFINDING_OBSTACLES.md`
- Grid building process (2 passes)
- Collision system alignment
- Coordinate conversion
- Extending to other objects
- Performance analysis

## Architecture Deep Dive (30 minutes)
**File**: `NPC_PATHFINDING_ARCHITECTURE.md`
- System architecture overview
- Coordinate system alignment
- Step-by-step grid generation
- Console output interpretation
- Performance analysis
- Troubleshooting guide

---

## The Fix at a Glance

### Problem
NPCs walked through walls and tables because pathfinding wasn't aware of them.

### Solution
Modified `npc-pathfinding.js` to mark obstacles in the pathfinding grid:
1. **All wall tiles** (from Tiled wall layer)
2. **All table objects** (from Tiled object layer)

### Result
✅ NPCs now avoid walls  
✅ NPCs now avoid tables  
✅ Consistent behavior with collision system  
✅ Waypoint patrol respects obstacles  

### Files Changed
- `js/systems/npc-pathfinding.js` - Main implementation
- 4 new documentation files (this folder)

### How to Verify
1. Load game with NPCs
2. Check console for initialization messages
3. Observe NPCs avoid tables and walls

---

## Related Documentation

### NPC Systems
- `NPC_INTEGRATION_GUIDE.md` - Complete NPC system overview
- `NPC_PATROL_WAYPOINTS.md` - Waypoint patrol feature
- `NPC_CROSS_ROOM_NAVIGATION.md` - Multi-room pathfinding (future)

### Core Systems
- `SOUND_SYSTEM.md` - NPC voices and sound effects
- `NPC_INFLUENCE.md` - NPC influence system
- `INK_BEST_PRACTICES.md` - NPC dialogue with Ink

### Player Systems
- `CONTAINER_MINIGAME_USAGE.md` - Object containers
- `NOTES_MINIGAME_USAGE.md` - Note reading system

---

## Code References

### Entry Points
```javascript
// Pathfinding initialization (rooms.js)
pfManager.initializeRoomPathfinding(roomId, rooms[roomId], position);

// Grid building (npc-pathfinding.js)
buildGridFromWalls(roomId, roomData, mapWidth, mapHeight)

// Finding paths
pathfinder.findPath(startX, startY, endX, endY, callback)
```

### Key Classes
```javascript
// NPCPathfindingManager (npc-pathfinding.js)
- initializeRoomPathfinding()
- buildGridFromWalls()         ← MODIFIED: Now marks tables too
- findPath()
- getRandomPatrolTarget()

// NPCBehavior (npc-behavior.js)
- parseConfig()                ← Waypoint support
- validateWaypoints()
- chooseNewPatrolTarget()
- chooseWaypointTarget()
- updatePatrol()               ← Dwell time support
```

### Configuration (scenarios/*.json)
```json
{
  "npcs": [
    {
      "id": "guard",
      "behavior": {
        "patrol": {
          "enabled": true,
          "speed": 100,
          "waypoints": [
            {"x": 3, "y": 3},
            {"x": 7, "y": 3},
            {"x": 7, "y": 7},
            {"x": 3, "y": 7}
          ],
          "waypointMode": "sequential"
        }
      }
    }
  ]
}
```

---

## Features Summary

### ✅ Implemented
- Wall obstacle detection in pathfinding
- Table obstacle detection in pathfinding
- Waypoint-based patrol routes
- Sequential and random waypoint modes
- Dwell time at waypoints
- FacePlayer behavior with patrol
- Multiple speed settings
- Pathfinding grid validation

### 🔄 In Progress
- Live game testing
- Performance optimization
- Extended obstacle types

### 📋 Planned
- Cross-room navigation
- Dynamic obstacle updates
- Soft obstacle priority
- Advanced path visualization

---

## File Map

```
docs/
├── NPC_PATHFINDING_QUICK_REF.md      ← Start here
├── NPC_PATHFINDING_FIX_SUMMARY.md    ← Understand the fix
├── NPC_PATHFINDING_OBSTACLES.md      ← Technical details
├── NPC_PATHFINDING_ARCHITECTURE.md   ← Deep dive
└── NPC_PATHFINDING_INDEX.md          ← You are here

js/systems/
├── npc-pathfinding.js                ← Grid building
├── npc-behavior.js                   ← Waypoint patrol
├── collision.js                       ← Wall collision boxes
└── npc-sprites.js                    ← NPC rendering

scenarios/
└── test-npc-waypoints.json           ← 9 NPC examples

assets/rooms/
└── *.json                             ← Tiled maps
```

---

## Questions?

### How do I add a new obstacle type?
See "Extending to Other Objects" in `NPC_PATHFINDING_OBSTACLES.md`

### Why aren't my NPCs pathfinding correctly?
Check the troubleshooting guide in `NPC_PATHFINDING_ARCHITECTURE.md`

### How do I use waypoints in my scenario?
See `NPC_PATROL_WAYPOINTS.md` for complete examples

### What about cross-room navigation?
See `NPC_CROSS_ROOM_NAVIGATION.md` (in progress)

---

**Last Updated**: November 10, 2025  
**Version**: 1.0 - Complete pathfinding obstacle system  
**Status**: Ready for testing
