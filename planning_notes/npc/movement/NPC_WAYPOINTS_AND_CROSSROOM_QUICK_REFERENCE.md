# NPC Patrol: Waypoints & Cross-Room Navigation - Quick Reference

## Two New Features

### Feature 1: Waypoint Patrol (Single Room) ✅ Ready to Implement
NPCs follow specific predefined waypoints instead of random patrol.

### Feature 2: Cross-Room Navigation (Multi-Room Routes) 🔄 Design Complete
NPCs patrol across multiple connected rooms.

---

## Quick Configuration Guide

### Single-Room Waypoint Patrol

```json
{
  "id": "guard_1",
  "position": {"x": 4, "y": 4},
  "behavior": {
    "patrol": {
      "enabled": true,
      "speed": 100,
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

**Key Points:**
- `waypoints`: Array of `{x, y}` tile coordinates
- Range: 3-8 (or configurable per room)
- **Automatically converts to world coordinates**
- **Validates waypoints are walkable**
- **Falls back to random patrol if invalid**

**Modes:**
```json
"waypointMode": "sequential"  // Default: follow waypoints in order
"waypointMode": "random"      // Random: pick any waypoint
```

**With Dwell Time:**
```json
{
  "x": 4,
  "y": 4,
  "dwellTime": 2000  // Stay here for 2 seconds before next waypoint
}
```

---

### Multi-Room Route Patrol

```json
{
  "id": "security_patrol",
  "startRoom": "lobby",
  "position": {"x": 4, "y": 4},
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
        }
      ]
    }
  }
}
```

**Key Points:**
- `startRoom`: Where NPC spawns (required)
- `multiRoom`: `true` to enable cross-room patrol
- `route`: Array of `{room, waypoints}` segments
- NPC teleports between rooms when reaching segment end
- **All route rooms must be pre-loaded**
- **All rooms must be connected via doors**
- Loops infinitely through all rooms

---

## Comparison

| Feature | Waypoint | Bounds | Multi-Room |
|---------|----------|--------|------------|
| **Deterministic** | ✅ Yes | ❌ Random | ✅ Yes |
| **Predefined** | ✅ Yes | ❌ Random | ✅ Yes |
| **Single Room** | ✅ Yes | ✅ Yes | ❌ Spans multiple |
| **Complexity** | 🟢 Low | 🟢 Low | 🟡 Medium |
| **Memory** | 🟢 Minimal | 🟢 Minimal | 🟠 Load all rooms |
| **Current** | ❌ TODO | ✅ Works | ❌ TODO |

---

## Implementation Roadmap

### Phase 1: Single-Room Waypoints (Recommended First)

**What to implement:**
1. Add `patrol.waypoints` and `patrol.waypointMode` to config parsing
2. Add waypoint validation (check walkable, within bounds)
3. Update `chooseNewPatrolTarget()` to select waypoints vs random
4. Add dwell time support

**Time Estimate:** 2-4 hours
**Complexity:** Medium
**Risk:** Low (isolated to `npc-behavior.js`)

**Test with scenario:**
```json
"patrol_guard": {
  "waypoints": [
    {"x": 3, "y": 3},
    {"x": 6, "y": 3},
    {"x": 6, "y": 6}
  ]
}
```

---

### Phase 2: Multi-Room Routes (After Phase 1)

**What to implement:**
1. Extend config to support `multiRoom` and `route` properties
2. Add route validation (rooms exist, connected, waypoints valid)
3. Add NPC room transition logic
4. Update pathfinding to handle room boundaries
5. Update sprite management for room transitions

**Time Estimate:** 4-8 hours
**Complexity:** Higher
**Risk:** Medium (requires coordination across systems)

**Dependencies:**
- Phase 1 waypoint system working
- Door transition system (already exists)
- Room loading system (already exists)

**Test with scenario:**
- Create 2 connected rooms
- Define NPC with 2-room route
- Verify NPC transitions correctly

---

## Code Location Reference

### Files to Modify

| File | Changes |
|------|---------|
| `js/systems/npc-behavior.js` | `parseConfig()`, `chooseNewPatrolTarget()`, `updatePatrol()` |
| `js/systems/npc-pathfinding.js` | `findPathAcrossRooms()` (Phase 2 only) |
| `js/systems/npc-sprites.js` | `relocateNPCSprite()` (Phase 2 only) |
| `js/systems/npc-manager.js` | Room transition helpers (Phase 2 only) |

---

## Configuration Validation Rules

### Waypoint Validation

```
✅ Waypoint x,y in range 3-8 (configurable)
✅ Waypoint within room bounds
✅ Waypoint position is walkable (not in wall)
✅ At least 1 waypoint for valid patrol
⚠️ If invalid → Fall back to random patrol
```

### Multi-Room Route Validation

```
✅ startRoom exists in scenario
✅ All route rooms exist in scenario
✅ Consecutive rooms are connected via doors
✅ All waypoints in all rooms are valid
✅ Route contains at least 1 room
⚠️ If invalid → Disable multiRoom, use single-room patrol
```

---

## Usage Examples

### Example 1: Simple Rectangular Patrol

```json
{
  "id": "guard",
  "position": {"x": 4, "y": 4},
  "behavior": {
    "patrol": {
      "enabled": true,
      "speed": 100,
      "waypoints": [
        {"x": 3, "y": 3},
        {"x": 7, "y": 3},
        {"x": 7, "y": 7},
        {"x": 3, "y": 7}
      ]
    }
  }
}
```
**Movement:** Square patrol loop, repeating indefinitely

---

### Example 2: Guard with Standing Posts

```json
{
  "id": "checkpoint_guard",
  "position": {"x": 5, "y": 5},
  "behavior": {
    "patrol": {
      "enabled": true,
      "speed": 80,
      "waypoints": [
        {
          "x": 4,
          "y": 3,
          "dwellTime": 3000
        },
        {
          "x": 4,
          "y": 7,
          "dwellTime": 3000
        }
      ]
    }
  }
}
```
**Movement:** Walks to checkpoint 1 (stands 3s), walks to checkpoint 2 (stands 3s), repeats

---

### Example 3: Security Patrol Through Office

```json
{
  "id": "security",
  "startRoom": "main_office",
  "position": {"x": 4, "y": 4},
  "behavior": {
    "patrol": {
      "enabled": true,
      "speed": 80,
      "multiRoom": true,
      "route": [
        {
          "room": "main_office",
          "waypoints": [
            {"x": 4, "y": 3},
            {"x": 6, "y": 3},
            {"x": 6, "y": 6}
          ]
        },
        {
          "room": "hallway",
          "waypoints": [
            {"x": 3, "y": 5},
            {"x": 5, "y": 5}
          ]
        },
        {
          "room": "break_room",
          "waypoints": [
            {"x": 4, "y": 4}
          ]
        }
      ]
    }
  }
}
```
**Movement:** Patrol main office → hallway → break room → back to main office (infinite loop)

---

## Backward Compatibility

Both new features are **backward compatible**:

- Existing `patrol.bounds` configurations continue to work
- Random patrol is still default if no `waypoints` defined
- Multi-room disabled by default (`multiRoom: false`)
- No breaking changes to existing scenarios

---

## Common Questions

**Q: Can an NPC have both waypoints AND bounds?**
A: Yes, but waypoints take priority. If `waypoints` defined, `bounds` is ignored.

**Q: What happens if a waypoint is unreachable (surrounded by walls)?**
A: NPC logs a warning and falls back to random patrol. Invalid waypoint list is ignored.

**Q: Can NPCs in different rooms share a patrol route?**
A: Not recommended. Better to define separate NPCs per room, or use multi-room NPC for single patrol.

**Q: What's the memory overhead of multi-room NPCs?**
A: ~160KB per loaded room. For 3-room route: ~480KB total. Acceptable for most scenarios.

**Q: Can waypoints change at runtime?**
A: Currently no. Patrol configuration is set at scenario load time. Future enhancement: dynamic waypoint updates.

---

## Troubleshooting

### NPC Not Following Waypoints
1. Check console for waypoint validation errors
2. Verify waypoints are within room bounds (3-8 range)
3. Verify waypoints are not in walls (use pathfinding grid check)
4. Check `patrol.enabled` is `true`

### NPC Stuck on Waypoint
1. Verify waypoint is walkable (reachable via pathfinding)
2. Check for obstacles between waypoints
3. Try setting waypoint slightly away from walls

### Multi-Room NPC Not Transitioning
1. Check all route rooms are in scenario definition
2. Verify rooms are connected with door transitions
3. Check console for route validation errors
4. Verify `multiRoom: true` is set
5. Verify `startRoom` exists and NPC spawns there

### Performance Issues with Multi-Room
1. Check total rooms loaded (may exceed memory budget)
2. Consider reducing number of route rooms
3. Add dwell time to slow NPC movement

---

## Next Steps

1. **Decide Implementation Priority**
   - Phase 1 first? (Recommended - easier, isolates changes)
   - Or both together? (Riskier but faster)

2. **Start with Phase 1**
   - Modify `npc-behavior.js` to support waypoints
   - Create test scenario with waypoint NPCs
   - Validate pathfinding to waypoints works

3. **Then Phase 2**
   - Extend config for multi-room routes
   - Add room transition logic
   - Test cross-room NPC movement

4. **Documentation**
   - Full docs: `NPC_PATROL_WAYPOINTS.md` and `NPC_CROSS_ROOM_NAVIGATION.md`
   - Update scenario design guide
   - Add waypoints to JSON schema

---

## Summary

| Aspect | Details |
|--------|---------|
| **Feature 1** | Waypoint patrol (single room) |
| **Feature 2** | Cross-room NPC routes |
| **Status** | Design complete, ready to implement |
| **Complexity** | Low (Phase 1) to Medium (Phase 2) |
| **Effort** | 2-4 hrs (Phase 1) + 4-8 hrs (Phase 2) |
| **Risk** | Low to Medium |
| **Backward Compat** | ✅ Full compatibility |

