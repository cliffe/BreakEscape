# NPC Multi-Room Navigation - Feature Guide

## Overview

NPCs can now patrol across multiple connected rooms in a predefined route. When an NPC completes all waypoints in one room, it automatically transitions to the next room in the route and continues patrolling.

## Feature Status

✅ **COMPLETE** - Fully implemented and ready to use

## Configuration

### Basic Setup

Add a `patrol` configuration with `multiRoom` and `route` properties to your NPC:

```json
{
  "id": "security_guard",
  "displayName": "Security Guard",
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
            {"x": 6, "y": 5},
            {"x": 4, "y": 7}
          ]
        },
        {
          "room": "hallway",
          "waypoints": [
            {"x": 3, "y": 4},
            {"x": 5, "y": 4},
            {"x": 3, "y": 6}
          ]
        },
        {
          "room": "office",
          "waypoints": [
            {"x": 2, "y": 3},
            {"x": 6, "y": 5}
          ]
        }
      ]
    }
  }
}
```

### Configuration Properties

| Property | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `multiRoom` | boolean | Yes | false | Enable multi-room route patrolling |
| `route` | array | Yes | [] | Array of room segments with waypoints |
| `waypointMode` | string | No | 'sequential' | 'sequential' or 'random' waypoint selection |

### Route Structure

Each segment in the `route` array:

```json
{
  "room": "room_id",           // Room identifier (must exist in scenario)
  "waypoints": [
    {
      "x": 4,                  // Tile X coordinate (0-indexed from room edge)
      "y": 3,                  // Tile Y coordinate (0-indexed from room edge)
      "dwellTime": 500         // Optional: pause at waypoint (ms)
    }
  ]
}
```

## How It Works

### Route Execution Flow

1. **Initialization**
   - NPC spawns in `startRoom`
   - System validates all route rooms exist
   - System validates all room connections exist (doors)
   - All route rooms are pre-loaded

2. **Waypoint Patrol**
   - NPC follows waypoints in order (sequential mode) or randomly
   - At each waypoint, NPC pauses for `dwellTime` (if specified)
   - NPC uses pathfinding to navigate between waypoints

3. **Room Transition**
   - When current room's waypoints are complete, NPC transitions to next room
   - System finds door connecting the two rooms
   - NPC sprite is relocated to the new room at the door position
   - NPC's `roomId` is updated in the NPC manager
   - Waypoint patrol continues in new room

4. **Loop**
   - After last room's waypoints, cycle back to first room
   - Process repeats indefinitely

### Example Timeline

```
Time 0:    NPC spawns in "lobby" at (4, 4)
Time 5s:   NPC reaches waypoint (4, 3) in lobby
Time 10s:  NPC reaches waypoint (6, 5) in lobby
Time 15s:  NPC reaches final waypoint (4, 7) in lobby
           ↓ All waypoints done, transition to next room
Time 16s:  System finds door from lobby → hallway
           NPC sprite relocated to door position in hallway
           NPC's roomId updated to "hallway"
Time 16s:  NPC begins patrolling hallway waypoints
Time 25s:  NPC reaches final waypoint in hallway
           ↓ Transition to office
Time 26s:  NPC sprite relocated to office
Time 35s:  NPC reaches final waypoint in office
           ↓ Cycle back to lobby
Time 36s:  NPC sprite relocated back to lobby door
...
```

## Waypoint Coordinates

Waypoint coordinates are **tile-based** and relative to the room edge:

```
Room Layout (32x20 tiles):
┌─────────────────────┐
│ (0,0)          (31,0) │  ← Top edge of room
│                       │
│  (4,3) = NPC tile    │  ← "x": 4, "y": 3
│                       │
│ (0,19)        (31,19) │  ← Bottom edge of room
└─────────────────────┘
```

The system automatically converts tile coordinates to world coordinates based on the room's position.

## Validation & Error Handling

### Validation Checks

The system performs these validations during NPC initialization:

- ✅ All route rooms exist in scenario
- ✅ Consecutive rooms are connected via doors
- ✅ All waypoints have valid x,y coordinates
- ✅ At least one waypoint per room

### Fallback Behavior

If validation fails:
- Multi-room is **disabled** for that NPC
- NPC falls back to **random patrol** in starting room
- No errors prevent game from running

Example:
```javascript
// If rooms not connected, system logs and disables multi-room
⚠️ Route rooms not connected: lobby ↔ basement for security_guard
```

## Implementation Details

### Files Modified

1. **js/systems/npc-behavior.js**
   - `parseConfig()` - Parse multiRoom config
   - `validateMultiRoomRoute()` - Validate route configuration
   - `chooseWaypointTarget()` - Enhanced with multi-room support
   - `chooseWaypointTargetMultiRoom()` - NEW: Handle multi-room waypoints
   - `transitionToNextRoom()` - NEW: Room transition logic

2. **js/systems/npc-sprites.js**
   - `relocateNPCSprite()` - NEW: Move sprite to new room
   - `findDoorBetweenRooms()` - NEW: Find connecting door

3. **js/core/rooms.js**
   - Added `window.relocateNPCSprite` global export

### State Tracking

The NPC behavior tracks multi-room state:

```javascript
config.patrol.multiRoom              // Is multi-room enabled?
config.patrol.route                  // Array of route segments
config.patrol.currentSegmentIndex    // Current room index in route
config.patrol.waypointIndex          // Current waypoint in room
behavior.roomId                      // Current room NPC is in
npcData.roomId                       // Room stored in NPC manager
```

## Console Debugging

Enable verbose logging to troubleshoot multi-room navigation:

```javascript
// In browser console
window.NPC_DEBUG = true;
```

Then watch logs for:
- `✅ Multi-room route validated...` - Route is valid
- `🚪 Pre-loading N rooms...` - Rooms being loaded
- `🚪 [npcId] Transitioning: room1 → room2` - Room transition
- `✅ [npcId] Sprite relocated...` - Sprite moved successfully
- `🔄 [npcId] Completed all waypoints...` - About to transition
- `⏭️ [npcId] No waypoints in segment...` - Empty waypoint list

## Limitations & Future Enhancements

### Current Limitations

- Routes must form a loop (first room connects to last room)
- NPCs cannot change rooms except via sequential waypoint completion
- No dynamic route changes during gameplay
- No priority/interrupt system for multi-room routes

### Possible Future Enhancements

- Non-looping routes (one-way patrol)
- Dynamic route modification via events
- Multi-path selection (NPCs choose different routes)
- Room-to-room interruption (events can redirect NPCs)
- Performance optimization for very long routes

## Testing Checklist

### Basic Functionality

- [ ] Create NPC with 2-room route
- [ ] NPC spawns in starting room
- [ ] NPC follows waypoints in first room
- [ ] NPC transitions to second room
- [ ] NPC follows waypoints in second room
- [ ] NPC transitions back to first room
- [ ] Process loops indefinitely

### Edge Cases

- [ ] NPC with unreachable waypoint (should skip)
- [ ] NPC with disconnected rooms (should fallback to random patrol)
- [ ] NPC with empty waypoint list (should transition immediately)
- [ ] NPC with 3+ rooms in route
- [ ] Player interacts with NPC mid-transition

### Collision & Physics

- [ ] NPC collides with walls in new room
- [ ] NPC collides with tables in new room
- [ ] NPC collides with other NPCs in new room
- [ ] NPC avoids player properly in new room

## Example Scenarios

### Security Guard Patrol

```json
{
  "id": "security_patrol",
  "displayName": "Security Guard",
  "startRoom": "lobby",
  "behavior": {
    "patrol": {
      "enabled": true,
      "speed": 60,
      "multiRoom": true,
      "waypointMode": "sequential",
      "route": [
        {
          "room": "lobby",
          "waypoints": [
            {"x": 4, "y": 4},
            {"x": 8, "y": 4},
            {"x": 8, "y": 8},
            {"x": 4, "y": 8}
          ]
        },
        {
          "room": "hallway",
          "waypoints": [
            {"x": 5, "y": 5},
            {"x": 3, "y": 5}
          ]
        },
        {
          "room": "office",
          "waypoints": [
            {"x": 4, "y": 4},
            {"x": 6, "y": 6},
            {"x": 4, "y": 4}
          ]
        }
      ]
    }
  }
}
```

### Receptionist With Dwell Times

```json
{
  "id": "receptionist",
  "displayName": "Front Desk Receptionist",
  "startRoom": "reception",
  "behavior": {
    "patrol": {
      "enabled": true,
      "speed": 40,
      "multiRoom": true,
      "waypointMode": "sequential",
      "route": [
        {
          "room": "reception",
          "waypoints": [
            {"x": 5, "y": 4, "dwellTime": 2000},
            {"x": 5, "y": 6, "dwellTime": 1000}
          ]
        },
        {
          "room": "office",
          "waypoints": [
            {"x": 4, "y": 4, "dwellTime": 3000},
            {"x": 6, "y": 4, "dwellTime": 1000}
          ]
        }
      ]
    }
  }
}
```

## FAQ

**Q: Can NPCs walk through doors automatically?**
A: Yes! The system finds the door connecting rooms and positions the NPC at that door when transitioning.

**Q: What happens if rooms aren't connected?**
A: The route validation will fail and multi-room is disabled for that NPC. The NPC falls back to random patrol in its starting room.

**Q: Can NPCs have different movement speeds in different rooms?**
A: Currently, speed is global. All rooms use the same `patrol.speed`. This can be enhanced in future versions.

**Q: What if an NPC gets stuck?**
A: If a waypoint is unreachable, the NPC tries the next waypoint or transitions to the next room. The system has automatic fallback behavior.

**Q: Can I pause or modify routes during gameplay?**
A: Currently no, routes are fixed after initialization. Dynamic route changes can be added in future versions.

## Related Documentation

- See `NPC_PATROL.md` for single-room waypoint details
- See `NPC_INTEGRATION_GUIDE.md` for NPC setup overview
- See `GLOBAL_VARIABLES.md` for NPC manager details
