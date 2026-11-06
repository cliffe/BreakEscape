# NPC Patrol Waypoints - Feature Guide

## Overview

This feature allows NPCs to patrol between specific predefined waypoints instead of random patrol targets. Waypoints are tile coordinates (3-8 for x and y as per your specification).

## Current Architecture

The patrol system currently has two modes:
1. **Random Patrol (Current Default):** NPC picks a random walkable tile within `bounds` every `changeDirectionInterval` milliseconds
2. **Waypoint Patrol (NEW):** NPC follows a predefined list of waypoint coordinates in sequence

## Proposed Configuration

### Option A: Sequential Waypoints (Recommended)

NPCs patrol between waypoints in order, then loop back to start:

```json
{
  "id": "patrol_guard",
  "behavior": {
    "patrol": {
      "enabled": true,
      "speed": 100,
      "changeDirectionInterval": 3000,
      "waypoints": [
        {"x": 3, "y": 3},
        {"x": 6, "y": 3},
        {"x": 6, "y": 6},
        {"x": 3, "y": 6}
      ]
    }
  }
}
```

**Behavior:**
- NPC travels from waypoint 0 → 1 → 2 → 3 → 0 (loops)
- Uses EasyStar.js to find optimal path between consecutive waypoints
- `changeDirectionInterval` becomes optional (can determine pace differently)
- Useful for: patrol routes, guard patterns, fixed patrol circuits

### Option B: Free-Form Waypoint Selection

NPC can pick ANY waypoint instead of following a sequence:

```json
{
  "id": "patrol_guard",
  "behavior": {
    "patrol": {
      "enabled": true,
      "speed": 100,
      "changeDirectionInterval": 3000,
      "waypoints": [
        {"x": 3, "y": 3},
        {"x": 6, "y": 3},
        {"x": 6, "y": 6},
        {"x": 3, "y": 6}
      ],
      "waypointMode": "random"
    }
  }
}
```

**Behavior:**
- NPC picks random waypoint from list every `changeDirectionInterval`
- Like current random patrol, but constrained to specific waypoints
- Useful for: guard standing posts, multiple possible positions

### Option C: Hybrid (Sequential with Dwell Time)

```json
{
  "id": "patrol_guard",
  "behavior": {
    "patrol": {
      "enabled": true,
      "speed": 100,
      "changeDirectionInterval": 3000,
      "waypoints": [
        {
          "x": 3, "y": 3,
          "dwellTime": 2000
        },
        {
          "x": 6, "y": 3,
          "dwellTime": 1000
        }
      ],
      "waypointMode": "sequential"
    }
  }
}
```

**Behavior:**
- NPC travels to waypoint and waits for `dwellTime` milliseconds
- Useful for: guard patrols with standing posts, realistic guard behavior

---

## Implementation Details

### Coordinate System

All waypoints use **tile coordinates** (same as position):
- `x`: 3-8 (or configurable range per room)
- `y`: 3-8 (or configurable range per room)
- Automatically converted to **world coordinates** when used
- Validated to be within room bounds at initialization

### Validation

When patrol is initialized with waypoints:

```javascript
✅ Check all waypoints are within room bounds
✅ Check all waypoints are walkable (not in walls)
✅ Convert tile coordinates → world coordinates
✅ Calculate pathfinding between consecutive waypoints
✅ Fall back to random patrol if waypoints invalid
```

### Fallback Behavior

If `patrol.waypoints` is invalid or empty:
- System falls back to random patrol within `bounds`
- No errors thrown, patrol continues normally
- Console warning logged: `⚠️ Invalid waypoints for NPC X, using random patrol`

---

## Code Changes Required

### 1. Update `parseConfig()` in npc-behavior.js

```javascript
// Current code (lines 162-170)
patrol: {
    enabled: config.patrol?.enabled || false,
    speed: config.patrol?.speed || 100,
    changeDirectionInterval: config.patrol?.changeDirectionInterval || 3000,
    bounds: config.patrol?.bounds || null
}

// New code
patrol: {
    enabled: config.patrol?.enabled || false,
    speed: config.patrol?.speed || 100,
    changeDirectionInterval: config.patrol?.changeDirectionInterval || 3000,
    bounds: config.patrol?.bounds || null,
    waypoints: config.patrol?.waypoints || null,        // ← NEW
    waypointMode: config.patrol?.waypointMode || 'sequential'  // ← NEW
}
```

### 2. Add Waypoint Validation

```javascript
// In parseConfig() after bounds validation, add waypoints validation:

if (merged.patrol.waypoints && merged.patrol.waypoints.length > 0) {
    // Validate all waypoints are within room bounds
    const validWaypoints = [];
    
    for (const wp of merged.patrol.waypoints) {
        const tileX = wp.x;
        const tileY = wp.y;
        
        // Convert to world coordinates
        const worldX = roomWorldX + (tileX * TILE_SIZE);
        const worldY = roomWorldY + (tileY * TILE_SIZE);
        
        // Check if walkable (would need pathfinder grid)
        // For now, store the world coordinates
        validWaypoints.push({
            tileX: tileX,
            tileY: tileY,
            worldX: worldX,
            worldY: worldY,
            dwellTime: wp.dwellTime || 0
        });
    }
    
    if (validWaypoints.length > 0) {
        merged.patrol.waypoints = validWaypoints;
        merged.patrol.waypointIndex = 0; // Current waypoint index
        console.log(`✅ Patrol waypoints validated: ${validWaypoints.length} waypoints`);
    } else {
        merged.patrol.waypoints = null;
        console.warn(`⚠️ No valid patrol waypoints, using random patrol`);
    }
}
```

### 3. Update `chooseNewPatrolTarget()` in npc-behavior.js

```javascript
// Current implementation selects random target
// New implementation checks for waypoints first:

chooseNewPatrolTarget(time) {
    // Check if using waypoint patrol
    if (this.config.patrol.waypoints && this.config.patrol.waypoints.length > 0) {
        let nextWaypoint;
        
        if (this.config.patrol.waypointMode === 'sequential') {
            // Sequential: follow waypoints in order
            nextWaypoint = this.config.patrol.waypoints[this.config.patrol.waypointIndex];
            this.config.patrol.waypointIndex = (this.config.patrol.waypointIndex + 1) % 
                this.config.patrol.waypoints.length;
        } else {
            // Random: pick random waypoint
            const randomIndex = Math.floor(Math.random() * this.config.patrol.waypoints.length);
            nextWaypoint = this.config.patrol.waypoints[randomIndex];
        }
        
        this.patrolTarget = {
            x: nextWaypoint.worldX,
            y: nextWaypoint.worldY,
            dwellTime: nextWaypoint.dwellTime || 0
        };
        
        this.lastPatrolChange = time;
        // ... rest of pathfinding code
    } else {
        // Fall back to random patrol (current behavior)
        const pathfindingManager = this.pathfindingManager || window.pathfindingManager;
        // ... existing random patrol code
    }
}
```

### 4. Add Dwell Time Support

```javascript
// In updatePatrol(), after reaching target:

if (this.currentPath.length === 0 || this.pathIndex >= this.currentPath.length) {
    // Reached target waypoint
    
    // Check if we should dwell
    if (this.patrolTarget.dwellTime && this.patrolTarget.dwellTime > 0) {
        const timeSinceReached = time - this.patrolReachedTime;
        
        if (timeSinceReached < this.patrolTarget.dwellTime) {
            // Still dwelling - stop and face random direction
            this.sprite.body.setVelocity(0, 0);
            this.playAnimation('idle', this.direction);
            return;
        }
    }
    
    // Dwell time expired or no dwell time - choose next target
    this.patrolReachedTime = time;
    this.chooseNewPatrolTarget(time);
}
```

---

## Configuration Examples

### Example 1: Guard Patrol Circuit (Rectangular Route)

```json
{
  "id": "guard_patrol",
  "displayName": "Guard on Patrol",
  "position": {"x": 3, "y": 3},
  "spriteSheet": "hacker-red",
  "behavior": {
    "facePlayer": false,
    "patrol": {
      "enabled": true,
      "speed": 80,
      "changeDirectionInterval": 0,
      "waypoints": [
        {"x": 3, "y": 3},
        {"x": 7, "y": 3},
        {"x": 7, "y": 7},
        {"x": 3, "y": 7}
      ],
      "waypointMode": "sequential"
    }
  },
  "_comment": "Patrols rectangular route: NE corner → SE → SW → NW → repeat"
}
```

**Result:** Guard walks a box pattern, repeating indefinitely.

---

### Example 2: Standing Posts (Guard at Multiple Stations)

```json
{
  "id": "station_guard",
  "displayName": "Guard at Stations",
  "position": {"x": 4, "y": 4},
  "spriteSheet": "hacker",
  "behavior": {
    "facePlayer": true,
    "patrol": {
      "enabled": true,
      "speed": 100,
      "changeDirectionInterval": 4000,
      "waypoints": [
        {"x": 3, "y": 3},
        {"x": 6, "y": 3},
        {"x": 6, "y": 6},
        {"x": 3, "y": 6}
      ],
      "waypointMode": "random"
    }
  },
  "_comment": "Guard randomly visits 4 patrol stations, spends 4 seconds at each"
}
```

**Result:** Guard randomly moves between 4 locations.

---

### Example 3: Checkpoint with Dwell (Guard Standing Watch)

```json
{
  "id": "checkpoint_guard",
  "displayName": "Checkpoint Guard",
  "position": {"x": 4, "y": 4},
  "spriteSheet": "hacker-red",
  "behavior": {
    "facePlayer": true,
    "patrol": {
      "enabled": true,
      "speed": 60,
      "waypoints": [
        {
          "x": 4,
          "y": 3,
          "dwellTime": 3000
        },
        {
          "x": 4,
          "y": 5,
          "dwellTime": 3000
        }
      ],
      "waypointMode": "sequential"
    }
  },
  "_comment": "Guard patrols between 2 checkpoints, stands for 3 seconds at each"
}
```

**Result:** Guard moves to first checkpoint, stands 3s, moves to second, stands 3s, repeats.

---

## Advantages

| Feature | Benefit |
|---------|---------|
| **Deterministic** | Predictable NPC routes (useful for heist planning) |
| **Performant** | Can precompute paths if desired |
| **Realistic** | Guard patrols follow logical security patterns |
| **Backwards Compatible** | Existing random patrol `bounds` still works |
| **Flexible** | Supports sequential, random, and dwell-time modes |
| **No New Dependencies** | Uses existing EasyStar.js pathfinding |

## Disadvantages / Limitations

| Issue | Mitigation |
|-------|-----------|
| **Static Routes** | Can be combined with waypoint randomization |
| **No Dynamic Response** | Future: interrupt patrol if player spotted |
| **Pre-defined Waypoints** | Scenario designer must manually create routes |
| **No Procedural Generation** | Waypoints not auto-generated from room layout |

---

## Testing Checklist

- [ ] Waypoints converted from tile → world coordinates correctly
- [ ] NPC follows waypoint sequence in order (sequential mode)
- [ ] NPC picks random waypoint (random mode)
- [ ] NPC dwells at waypoint for specified time
- [ ] Dwell time = 0 means no pause (immediate next waypoint)
- [ ] Invalid waypoints fall back to random patrol gracefully
- [ ] Console shows waypoint path being followed
- [ ] NPC navigates walls/obstacles to reach waypoints
- [ ] Waypoints persist across room transitions (for cross-room NPCs)

---

## Next Steps

1. **Implement parseConfig() changes** - Add waypoints parsing and validation
2. **Update chooseNewPatrolTarget()** - Add waypoint mode selection logic
3. **Add dwell time support** - Pause at waypoints
4. **Test with scenario** - Create test NPC with waypoint patrol
5. **Document in scenario spec** - Add waypoints to scenario schema docs

---

## Related Features

- **Cross-Room NPCs** (separate document) - NPCs with waypoints can traverse multiple rooms
- **Waypoint Editor** (future) - Visual tool to place waypoints in room editor
- **Recorded Routes** (future) - Record player movement, replay as NPC patrol
