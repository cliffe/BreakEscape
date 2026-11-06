# Cross-Room NPC Navigation - Feature Design

## Overview

This feature allows NPCs to navigate between multiple rooms once they are loaded. An NPC can be assigned to patrol across multiple connected rooms using a predefined waypoint route.

## Current Limitations

**Today:** NPCs are spawned in a single room and cannot leave that room.
- Each NPC belongs to exactly one room (stored in `roomId` on the NPC data)
- Pathfinding only works within the current room's tilemap
- NPC sprites are only created when room is loaded
- No mechanism to move sprites between rooms

**Why:** Rooms can be loaded/unloaded independently. Keeping NPCs in single rooms simplifies lifecycle management.

---

## Proposed Architecture

### Multi-Room Route System

Define NPCs with routes that span multiple rooms:

```json
{
  "id": "security_patrol",
  "displayName": "Security Guard on Patrol",
  "position": {"x": 4, "y": 4},
  "spriteSheet": "hacker-red",
  "startRoom": "lobby",
  "behavior": {
    "patrol": {
      "enabled": true,
      "speed": 80,
      "multiRoom": true,
      "route": [
        {
          "room": "lobby",
          "waypoints": [
            {"x": 4, "y": 3},
            {"x": 6, "y": 5}
          ]
        },
        {
          "room": "hallway_east",
          "waypoints": [
            {"x": 3, "y": 4},
            {"x": 3, "y": 6}
          ]
        },
        {
          "room": "office_b",
          "waypoints": [
            {"x": 5, "y": 5},
            {"x": 5, "y": 3}
          ]
        }
      ]
    }
  }
}
```

### How It Works

1. **Initialization**
   - NPC spawns in `startRoom` (e.g., "lobby")
   - System loads all route rooms into memory
   - All pathfinders initialized for all route rooms
   - Route validated: all waypoints accessible

2. **Patrol Execution**
   - NPC follows waypoints in current room (e.g., lobby)
   - At end of room's waypoints, check for transition
   - Find door connecting to next room in route
   - Move NPC sprite to door, trigger transition
   - Teleport NPC sprite to next room
   - Continue with next room's waypoints

3. **Room Transitions**
   - Check if next route room is loaded
   - If not loaded, use `revealRoom()` to load it
   - Find connecting door between rooms
   - Move NPC to door position
   - Update NPC's `roomId` and sprite position
   - Continue patrol in new room

4. **Cycling**
   - When reaching last room's final waypoint
   - Loop back to first room's first waypoint
   - Infinite patrol across all rooms

---

## Implementation Approach

### Step 1: Extend Patrol Configuration

**In `npc-behavior.js` → `parseConfig()`:**

```javascript
// Add to patrol object parsing:
multiRoom: config.patrol?.multiRoom || false,
route: config.patrol?.route || null  // Array of {room, waypoints}
```

### Step 2: Add Multi-Room Route Validation

**New method in `NPCBehaviorManager`:**

```javascript
validateMultiRoomRoute(npcId, route, startRoom) {
    // Check 1: All rooms in route are valid scenario rooms
    // Check 2: All rooms are connected via doors
    // Check 3: All waypoints in each room are valid
    // Returns: true if valid, false if invalid
    
    // If invalid:
    // - Log error
    // - Disable multiRoom
    // - Use single-room patrol instead
}
```

### Step 3: Update NPC Sprite Management

**In `npc-sprites.js`:**

Add new method to handle room transitions:

```javascript
export function relocateNPCSprite(sprite, fromRoom, toRoom, newPosition) {
    // Update sprite position in world
    sprite.setPosition(newPosition.x, newPosition.y);
    
    // Update depth based on new room
    updateNPCDepth(sprite);
    
    // Update sprite visibility/layer
    sprite.setDepth(newPosition.worldY + 0.5);
    
    return sprite;
}
```

### Step 4: Enhance Pathfinding Manager

**In `npc-pathfinding.js`:**

Add method to find path across rooms:

```javascript
findPathAcrossRooms(fromRoom, fromPos, toRoom, toPos, waypoints, callback) {
    // 1. Find path in fromRoom to door connecting to toRoom
    // 2. Find path in toRoom from door to toPos
    // 3. Combine paths, return full route
    
    // Handle case where path requires room transition
}

getRoomConnectionDoor(roomA, roomB) {
    // Find door connecting roomA and roomB
    // Return: {positionA, positionB, doorId}
}
```

### Step 5: Update NPC Behavior Update Loop

**In `npc-behavior.js` → `chooseNewPatrolTarget()`:**

Detect when transitioning between rooms:

```javascript
chooseNewPatrolTarget(time) {
    if (this.config.patrol.multiRoom && this.config.patrol.route) {
        // Get current route segment
        const currentSegment = this.getCurrentRouteSegment();
        
        // Get next waypoint in current room
        const nextWaypoint = this.getNextWaypoint();
        
        if (!nextWaypoint) {
            // End of current room, move to next room in route
            this.transitionToNextRoom(time);
        } else {
            // Normal waypoint patrol within room
            this.patrolTarget = nextWaypoint;
        }
    } else {
        // Single-room patrol (existing code)
    }
}

transitionToNextRoom(time) {
    const route = this.config.patrol.route;
    const currentRoomIndex = route.findIndex(seg => seg.room === this.roomId);
    const nextRoomIndex = (currentRoomIndex + 1) % route.length;
    const nextSegment = route[nextRoomIndex];
    
    // 1. Check if next room is loaded
    // 2. If not, load it via revealRoom()
    // 3. Find door between rooms
    // 4. Move sprite to first waypoint in next room
    // 5. Update this.roomId
    // 6. Continue patrol
}
```

---

## State Management

### NPC Data Structure Enhancement

Each NPC would have:

```javascript
{
    id: "security_patrol",
    roomId: "lobby",          // Current room (updated as NPC moves)
    startRoom: "lobby",       // Starting room (doesn't change)
    _sprite: spriteObj,       // Current sprite instance
    _behavior: behaviorObj,   // Current behavior instance
    
    // Multi-room specific:
    route: [
        {room: "lobby", waypoints: [...], waypointIndex: 0},
        {room: "hallway_east", waypoints: [...], waypointIndex: 0},
        {room: "office_b", waypoints: [...], waypointIndex: 0}
    ],
    currentRouteSegmentIndex: 0
}
```

### NPCManager Updates

**In `npc-manager.js`:**

```javascript
// Add new method:
getNPCsByRoom(roomId) {
    // Return all NPCs in a specific room
}

teleportNPC(npcId, toRoom, toPosition) {
    // Move NPC sprite to new room and position
    // Update sprite references
}

updateNPCRoom(npcId, newRoomId) {
    // Called when NPC transitions between rooms
    // Updates internal NPC data
}
```

---

## Door Transition Detection

When NPC reaches a waypoint that's near a door:

```javascript
// In updatePatrol():

// Check if current waypoint is near a room door
const doorsNearby = checkDoorsNearWaypoint(this.patrolTarget, this.roomId);

if (doorsNearby.length > 0) {
    // Move NPC to door position
    // NPC sprite will trigger door transition automatically
    // Door system moves sprite to connected room
}
```

---

## Room Lifecycle Coordination

### All Required Rooms Must Be Loaded

For multi-room NPCs to work:

1. **Pre-load Route Rooms** (when NPC is first registered)
   ```javascript
   // In NPCBehaviorManager.registerBehavior():
   if (config.patrol?.multiRoom && config.patrol?.route) {
       const roomIds = config.patrol.route.map(seg => seg.room);
       roomIds.forEach(roomId => {
           if (!window.rooms[roomId]) {
               revealRoom(roomId);  // Load room without showing it
           }
       });
   }
   ```

2. **Keep Rooms in Memory**
   - Multi-room NPCs require all route rooms to stay loaded
   - Cannot unload rooms while NPC is patrolling there
   - Accept memory overhead for seamless NPC routes

3. **Cleanup**
   - If scenario ends or NPC is disabled
   - Check if any other multi-room NPCs use those rooms
   - Only unload rooms if no NPCs reference them

---

## Example Scenario Structure

```json
{
  "scenario_brief": "Security patrol across office complex",
  "rooms": {
    "lobby": {
      "type": "room_office",
      "connections": {
        "east": "hallway_east"
      },
      "npcs": [
        {
          "id": "security_guard",
          "position": {"x": 4, "y": 4},
          "startRoom": "lobby",
          "behavior": {
            "patrol": {
              "enabled": true,
              "speed": 80,
              "multiRoom": true,
              "route": [
                {
                  "room": "lobby",
                  "waypoints": [
                    {"x": 4, "y": 3},
                    {"x": 6, "y": 5},
                    {"x": 4, "y": 5}
                  ]
                },
                {
                  "room": "hallway_east",
                  "waypoints": [
                    {"x": 3, "y": 4},
                    {"x": 3, "y": 6}
                  ]
                }
              ]
            }
          }
        }
      ]
    },
    "hallway_east": {
      "type": "room_hallway",
      "connections": {
        "west": "lobby"
      },
      "npcs": []
    }
  }
}
```

---

## Implementation Phases

### Phase 1: Single-Room Waypoints ✅ (Do This First)
Implement waypoint patrol within a single room.
- Simpler to test and debug
- All pathfinding uses single room's grid
- Foundation for multi-room feature

### Phase 2: Multi-Room Route Support
Extend to cross-room navigation.
- Requires all route rooms pre-loaded
- NPC sprite teleports between rooms
- More complex state management

### Phase 3: Dynamic Room Loading (Future)
Allow lazy-loading of route rooms.
- Load next room in route on demand
- Unload rooms when NPC leaves
- More memory efficient but complex

---

## Validation & Error Handling

### Route Validation Checks

```javascript
validateRoute(route, startRoom) {
    let valid = true;
    
    // Check 1: All rooms exist in scenario
    for (const segment of route) {
        if (!window.rooms[segment.room] && 
            !window.gameScenario.rooms[segment.room]) {
            console.error(`⚠️ Route room not found: ${segment.room}`);
            valid = false;
        }
    }
    
    // Check 2: Rooms are connected
    for (let i = 0; i < route.length; i++) {
        const current = route[i].room;
        const next = route[(i + 1) % route.length].room;
        
        if (!areRoomsConnected(current, next)) {
            console.error(`⚠️ No connection between ${current} and ${next}`);
            valid = false;
        }
    }
    
    // Check 3: All waypoints are valid (walkable)
    for (const segment of route) {
        const pathfinder = window.pathfindingManager?.getPathfinder(segment.room);
        if (!pathfinder) {
            console.error(`⚠️ No pathfinder for ${segment.room}`);
            valid = false;
            continue;
        }
        
        for (const wp of segment.waypoints) {
            // Verify waypoint is walkable
            if (!isWalkable(pathfinder, wp)) {
                console.error(`⚠️ Waypoint (${wp.x}, ${wp.y}) not walkable in ${segment.room}`);
                valid = false;
            }
        }
    }
    
    return valid;
}
```

### Fallback Behavior

If multi-room route is invalid:
1. Disable multi-room mode
2. Use single-room patrol in startRoom
3. Log warnings to console
4. Continue working (graceful degradation)

---

## Testing Checklist

- [ ] NPC spawns in startRoom
- [ ] NPC follows waypoints in first room
- [ ] NPC completes waypoints in first room
- [ ] NPC transitions to second room
- [ ] NPC sprite appears in second room at correct position
- [ ] NPC follows waypoints in second room
- [ ] NPC loops back to first room
- [ ] Route validation catches invalid connections
- [ ] Route validation catches non-existent rooms
- [ ] Route validation catches non-walkable waypoints
- [ ] Graceful fallback if route invalid
- [ ] NPCs collide correctly across room boundaries
- [ ] Depth sorting correct when transitioning rooms
- [ ] Memory usage acceptable with multiple loaded rooms

---

## Performance Considerations

### Memory Impact

Each loaded room requires:
- Tilemap data (~100KB)
- Collision grid (~10KB)
- Sprite data (~50KB)
- Total per room: ~160KB

Multi-room NPC with 3-room route = ~480KB additional memory

**Mitigation:** Lazy-load route rooms only if total exceeds threshold

### Pathfinding Performance

Pre-loading pathfinders for all route rooms:
- EasyStar.js setup per room: ~50ms
- For 3 rooms: ~150ms total
- One-time cost at scenario start

**Mitigation:** Stagger pathfinder initialization if needed

---

## Future Enhancements

1. **Waypoint Editor** - Visual tool to draw routes in map editor
2. **Dynamic Unloading** - Unload route rooms when NPC reaches end
3. **Patrol Interruption** - Stop patrol if player spotted, resume later
4. **Multi-NPC Routes** - Multiple NPCs sharing same patrol route
5. **Recorded Routes** - Record player movements, replay as NPC patrol
6. **Synchronized Patrols** - Multiple NPCs patrol same route at staggered times
7. **Route Conditions** - Execute different routes based on game state
8. **NPC Pickup/Dropoff** - NPCs carry items between rooms

---

## Related Documents

- `NPC_PATROL_WAYPOINTS.md` - Single-room waypoint configuration
- `PATROL_CONFIGURATION_GUIDE.md` - Patrol system overview
- `NPC_INTEGRATION_GUIDE.md` - General NPC architecture

---

## Summary

| Aspect | Details |
|--------|---------|
| **Scope** | NPCs patrol across predefined multi-room routes |
| **Implementation** | Waypoint list + room transitions |
| **Dependencies** | Existing door system, pathfinding manager |
| **Complexity** | Medium (existing infrastructure supports it) |
| **Priority** | Phase 2 (after single-room waypoints) |
| **Memory Cost** | ~160KB per loaded room |
| **User-Facing** | Configure in scenario JSON `route` property |

