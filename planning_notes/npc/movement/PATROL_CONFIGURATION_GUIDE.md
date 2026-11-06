# NPC Patrol Configuration Guide

## Current Implementation Status

The patrol system uses **EasyStar.js pathfinding** with the following active configuration options:

### Patrol Configuration Options

```json
"patrol": {
  "enabled": boolean,              // ACTIVE ✅ - Enable/disable patrol behavior
  "speed": number,                 // ACTIVE ✅ - Movement speed in pixels/second
  "changeDirectionInterval": number, // ACTIVE ✅ - Time between patrol target changes (ms)
  "bounds": {                      // ACTIVE ✅ - Area NPC can patrol within
    "x": number,                   // Left edge (in room coords)
    "y": number,                   // Top edge (in room coords)
    "width": number,               // Width in pixels
    "height": number               // Height in pixels
  }
}
```

## What's Actively Used

### ✅ `enabled` (boolean)
**Status:** Actively used

Controls whether patrol behavior is active for this NPC.
- `true`: NPC will patrol within bounds
- `false`: NPC will remain idle (or follow other behaviors like `facePlayer`)

**Code location:** `npc-behavior.js` line 319
```javascript
if (this.config.patrol.enabled) {
    // Choose new target or follow path
}
```

---

### ✅ `speed` (number, pixels/second)
**Status:** Actively used

Controls how fast the NPC moves when patrolling.

**Examples from test scenario:**
- `patrol_basic`: 100 px/s (normal speed)
- `patrol_fast`: 200 px/s (twice as fast)
- `patrol_slow`: 50 px/s (half speed)
- `patrol_stuck_test`: 120 px/s

**Code location:** `npc-behavior.js` line 400
```javascript
const velocityX = (dx / distance) * this.config.patrol.speed;
const velocityY = (dy / distance) * this.config.patrol.speed;
this.sprite.body.setVelocity(velocityX, velocityY);
```

---

### ✅ `changeDirectionInterval` (number, milliseconds)
**Status:** Actively used

Controls how often the NPC picks a new random patrol target/waypoint.

**Examples from test scenario:**
- `patrol_basic`: 3000 ms (3 seconds)
- `patrol_fast`: 2000 ms (2 seconds, faster changes)
- `patrol_slow`: 5000 ms (5 seconds, slower changes)
- `patrol_with_face`: 4000 ms (4 seconds)

**Code location:** `npc-behavior.js` line 384
```javascript
if (!this.patrolTarget ||
    this.currentPath.length === 0 ||
    time - this.lastPatrolChange > this.config.patrol.changeDirectionInterval) {
    this.chooseNewPatrolTarget(time);
    return;
}
```

---

### ✅ `bounds` (object with x, y, width, height)
**Status:** Actively used

Defines the rectangular area where the NPC can patrol.

**Coordinate System:**
- `x`, `y`: Position in **room coordinates** (pixels, where room origin is top-left)
- `width`, `height`: Size in pixels
- Automatically converted to **world coordinates** when NPC is initialized

**Examples from test scenario:**
```json
"patrol_basic": {
  "x": 64,           // Start 64px from room left
  "y": 64,           // Start 64px from room top
  "width": 192,      // 192px wide (6 tiles at 32px/tile)
  "height": 192      // 192px tall (6 tiles at 32px/tile)
}

"patrol_narrow_horizontal": {
  "x": 0,            // Full width of room
  "y": 0,
  "width": 256,      // 8 tiles wide
  "height": 32       // 1 tile tall (horizontal corridor)
}

"patrol_narrow_vertical": {
  "x": 0,
  "y": 128,
  "width": 32,       // 1 tile wide (vertical corridor)
  "height": 160      // 5 tiles tall
}
```

**Code location:** `npc-behavior.js` lines 217-256
- Converts bounds to world coordinates
- Auto-expands bounds if NPC starting position is outside them
- Validates bounds before patrol starts

---

## How Patrol Works

### 1. **Initialization**
When NPC is created, patrol bounds are validated and converted to world coordinates:
```
Bounds (room coords): x=64, y=64, width=192, height=192
↓ (add room world offset)
Bounds (world coords): x=304, y=256, width=192, height=192
```

### 2. **First Patrol Target**
`chooseNewPatrolTarget()` is called:
1. Uses **pathfinding manager** to get random walkable tile within bounds
2. Calls **EasyStar.js** to find path from NPC position to target
3. Returns path as array of waypoints

### 3. **Following Path**
NPC follows waypoints in sequence:
```
Current Position → Waypoint 1 → Waypoint 2 → ... → Target
                                                      ↓
                                         (When reached, pick new target)
```

### 4. **Direction Changes**
After `changeDirectionInterval` milliseconds (e.g., 3000ms):
- NPC picks a new random target within bounds
- New pathfinding path is calculated
- NPC smoothly transitions to new path

### 5. **Speed Control**
Movement speed is calculated based on `speed` config:
```javascript
velocity = (direction) * speed_value
// e.g., if speed=100:
//   direction_normalized = (0.707, 0.707)  // 45° angle
//   velocity = (70.7, 70.7) pixels/frame
```

---

## Configuration Examples

### Example 1: Simple Patrol (Like `patrol_basic`)
```json
{
  "id": "my_npc",
  "behavior": {
    "patrol": {
      "enabled": true,
      "speed": 100,
      "changeDirectionInterval": 3000,
      "bounds": {
        "x": 64,
        "y": 64,
        "width": 192,
        "height": 192
      }
    }
  }
}
```
**Result:** NPC walks around a 6×6 tile area at normal speed, changing direction every 3 seconds.

---

### Example 2: Fast Patrol (Like `patrol_fast`)
```json
{
  "id": "guard_npc",
  "behavior": {
    "patrol": {
      "enabled": true,
      "speed": 200,
      "changeDirectionInterval": 2000,
      "bounds": {
        "x": 128,
        "y": 128,
        "width": 128,
        "height": 128
      }
    }
  }
}
```
**Result:** NPC patrols quickly (200 px/s), makes sharp direction changes every 2 seconds.

---

### Example 3: Narrow Corridor Patrol
```json
{
  "id": "hallway_guard",
  "behavior": {
    "patrol": {
      "enabled": true,
      "speed": 100,
      "changeDirectionInterval": 3000,
      "bounds": {
        "x": 0,
        "y": 128,
        "width": 32,
        "height": 160
      }
    }
  }
}
```
**Result:** NPC patrols up/down a narrow 1-tile-wide hallway (5 tiles tall).

---

### Example 4: Patrol Disabled (Like `patrol_initially_disabled`)
```json
{
  "id": "stationary_npc",
  "behavior": {
    "patrol": {
      "enabled": false,
      "speed": 100,
      "changeDirectionInterval": 3000,
      "bounds": { /* unused */ }
    }
  }
}
```
**Result:** NPC doesn't patrol. Can be enabled later via Ink tags like `#patrol_mode:on`.

---

## Advanced: Combining with Other Behaviors

### Patrol + Face Player
When a player gets close (`facePlayerDistance`), NPC stops patrolling and faces them:

```json
{
  "id": "patrol_with_face",
  "behavior": {
    "facePlayer": true,
    "facePlayerDistance": 96,
    "patrol": {
      "enabled": true,
      "speed": 100,
      "changeDirectionInterval": 4000,
      "bounds": { /* ... */ }
    }
  }
}
```
**Behavior Priority:**
1. Player within 96px → Face Player (stops patrol)
2. Player too far away → Resume Patrol

---

### Patrol + Personal Space
When player gets very close, NPC backs away:

```json
{
  "id": "cautious_npc",
  "behavior": {
    "patrol": {
      "enabled": true,
      "speed": 100,
      "changeDirectionInterval": 3000,
      "bounds": { /* ... */ }
    },
    "personalSpace": {
      "enabled": true,
      "distance": 48,
      "backAwaySpeed": 30,
      "backAwayDistance": 5
    }
  }
}
```
**Behavior Priority:**
1. Player within 48px → Back Away (maintain space)
2. Player further → Resume Patrol

---

## Pathfinding Behind the Scenes

The patrol system uses **EasyStar.js** for intelligent pathfinding:

### Grid-Based Pathfinding
- Room is divided into a grid (32×32 tiles)
- Walls are marked as impassable
- Random patrol targets are chosen from walkable tiles only
- Paths avoid walls automatically

### Random Target Selection
When choosing a new patrol target:
```javascript
targetPos = pathfindingManager.getRandomPatrolTarget(roomId);
// Returns: { x: pixel_x, y: pixel_y } 
// - Within patrol bounds
// - Walkable (not in a wall)
// - At least 2 tiles from room edge
```

### Asynchronous Pathfinding
Finding the path is non-blocking:
```javascript
pathfindingManager.findPath(
    roomId,
    startX, startY,
    targetX, targetY,
    (path) => {
        // Callback when path is found
        this.currentPath = path;
    }
);
// Continues moving while path is being calculated
```

---

## Debugging Patrol Issues

### Check Console for Messages
```javascript
// When patrol starts:
✅ [npc_id] New patrol path with 5 waypoints

// When moving along path:
🚶 [npc_id] Patrol waypoint 1/5 - velocity: (95, -45)

// If something fails:
⚠️ No bounds/grid for room [room_id]
⚠️ Could not find random patrol target for [npc_id]
⚠️ Pathfinding failed, target unreachable
```

### Verify Configuration
```javascript
// In browser console:
const npc = window.npcManager.npcs.get('npc_id');
console.log('Patrol config:', npc._behavior.config.patrol);
```

### Check if Pathfinding is Ready
```javascript
// In browser console:
console.log('Pathfinding manager:', window.pathfindingManager);
const bounds = window.pathfindingManager.getBounds('room_id');
console.log('Room bounds:', bounds);
```

---

## Summary

| Option | Active | Used For | Example |
|--------|--------|----------|---------|
| `enabled` | ✅ | Turn patrol on/off | `true` / `false` |
| `speed` | ✅ | Movement speed (px/s) | `50`, `100`, `200` |
| `changeDirectionInterval` | ✅ | Time between target changes (ms) | `2000`, `3000`, `5000` |
| `bounds.x` | ✅ | Left edge (room coords) | `0`, `64`, `128` |
| `bounds.y` | ✅ | Top edge (room coords) | `0`, `64`, `128` |
| `bounds.width` | ✅ | Width in pixels | `32`, `64`, `256` |
| `bounds.height` | ✅ | Height in pixels | `32`, `96`, `192` |

**All configuration options are actively used and fully implemented.**
