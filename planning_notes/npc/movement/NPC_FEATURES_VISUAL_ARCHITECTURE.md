# NPC Patrol Features - Visual Architecture

## System Diagram

### Current System (What Exists)

```
Scenario JSON
    ↓
npc-behavior.js ────→ Random Patrol
    ↓                 (pick random tile in bounds)
    ├─ bounds
    └─ changeDirectionInterval
```

---

### Feature 1: Waypoint Patrol (Single Room)

```
Scenario JSON
    ├─ waypoints: [{x,y}, {x,y}, ...]
    ├─ waypointMode: "sequential"
    └─ [dwellTime per waypoint (optional)]
        ↓
npc-behavior.js
    ├─ parseConfig()
    │   ├─ Convert tile → world coords
    │   ├─ Validate walkable
    │   └─ Store waypoint index
    │
    ├─ chooseNewPatrolTarget()
    │   ├─ IF waypoints enabled:
    │   │   ├─ Sequential: wp[0]→wp[1]→wp[2]→wp[0]...
    │   │   └─ Random: pick random wp
    │   └─ ELSE:
    │       └─ Use random patrol (fallback)
    │
    └─ updatePatrol()
        ├─ Follow waypoint via pathfinding
        ├─ Check dwell time
        └─ Move to next waypoint

    ↓
EasyStar.js Pathfinding
    ↓
NPC walks predetermined route
```

---

### Feature 2: Multi-Room Routes

```
Scenario JSON
    ├─ startRoom: "lobby"
    ├─ multiRoom: true
    └─ route: [
         {room: "lobby", waypoints: [...]},
         {room: "hallway", waypoints: [...]},
         {room: "office", waypoints: [...]}
       ]
        ↓
npc-behavior.js
    ├─ parseConfig()
    │   ├─ Load all route rooms
    │   ├─ Validate connections
    │   └─ Initialize all pathfinders
    │
    ├─ chooseNewPatrolTarget()
    │   └─ Get waypoint from current room segment
    │
    └─ transitionToNextRoom()
        ├─ Complete current room's waypoints
        ├─ Find door to next room
        ├─ Update NPC roomId
        └─ Relocate sprite to next room
        
        ↓
rooms.js
    └─ Pre-load all route rooms
    
        ↓
npc-pathfinding.js (NEW Methods)
    ├─ findPathAcrossRooms()
    │   └─ Path from room A to room B via door
    │
    └─ getRoomConnectionDoor()
        └─ Find door connecting 2 rooms
        
        ↓
npc-sprites.js (NEW Methods)
    └─ relocateNPCSprite()
        └─ Move sprite to new room

    ↓
NPC walks through multiple connected rooms
```

---

## Data Flow: Single Waypoint Patrol

```
1. INITIALIZATION
   ┌─────────────────────────────────────┐
   │ Scenario Loaded                     │
   │ waypoints: [{x:3,y:3}, {x:6,y:6}]   │
   │ waypointMode: "sequential"          │
   └─────────────────────────────────────┘
                    ↓
   ┌─────────────────────────────────────┐
   │ NPCBehavior.parseConfig()           │
   │ - Convert coords: (3,3) → world(64, 64)
   │ - Check walkable: ✅               │
   │ - Store: waypoints[], index=0       │
   └─────────────────────────────────────┘

2. FIRST PATROL TARGET
   ┌─────────────────────────────────────┐
   │ chooseNewPatrolTarget()             │
   │ - Mode is "sequential"              │
   │ - Select waypoints[0] at world(64,64)
   │ - Update index: 0 → 1               │
   │ - Call pathfinding                  │
   └─────────────────────────────────────┘
                    ↓
   ┌─────────────────────────────────────┐
   │ EasyStar.findPath(start, end)       │
   │ Returns: [wp0, wp1, wp2, ...]       │
   │ Asynchronous callback               │
   └─────────────────────────────────────┘

3. MOVEMENT
   ┌─────────────────────────────────────┐
   │ updatePatrol() [every frame]        │
   │ - Follow waypoints sequentially     │
   │ - velocity = toward_next_wp * speed │
   │ - Update depth + animation          │
   └─────────────────────────────────────┘
                    ↓
   ┌─────────────────────────────────────┐
   │ Sprite moves from waypoint 0 to 1   │
   │ (EasyStar handles wall avoidance)   │
   └─────────────────────────────────────┘

4. REACHED WAYPOINT
   ┌─────────────────────────────────────┐
   │ Waypoint reached? (distance < 8px)  │
   │ - Yes: Move to next waypoint        │
   │ - Check dwell time if set           │
   │ - If complete, chooseNewTarget()    │
   └─────────────────────────────────────┘
                    ↓
   ┌─────────────────────────────────────┐
   │ BACK TO STEP 2 (NEW WAYPOINT)       │
   │ Cycle repeats infinitely            │
   └─────────────────────────────────────┘
```

---

## Data Flow: Multi-Room Route

```
1. SCENARIO SETUP
   ┌─────────────────────────────────────────────────┐
   │ startRoom: "lobby"                              │
   │ route: [                                        │
   │   {room: "lobby", waypoints: [{x:4,y:3}...]},   │
   │   {room: "hallway", waypoints: [{x:3,y:4}...]}, │
   │   {room: "office", waypoints: [{x:5,y:5}...]}   │
   │ ]                                               │
   └─────────────────────────────────────────────────┘
                         ↓
   ┌─────────────────────────────────────────────────┐
   │ Pre-load all route rooms                        │
   │ - Load: lobby, hallway, office                  │
   │ - Initialize pathfinders for each              │
   │ - Build collision grids                         │
   │ - Validate connections (doors exist)            │
   └─────────────────────────────────────────────────┘

2. START IN LOBBY
   ┌─────────────────────────────────────────────────┐
   │ NPC spawned in "lobby" at (4,3)                 │
   │ currentRoomId = "lobby"                         │
   │ currentSegmentIndex = 0                         │
   │ Patrol lobby waypoints: [wp0, wp1, wp2, ...]    │
   └─────────────────────────────────────────────────┘
                         ↓
   ┌─────────────────────────────────────────────────┐
   │ Follow waypoints in lobby                       │
   │ Same as Feature 1 (waypoint patrol)             │
   └─────────────────────────────────────────────────┘

3. LOBBY SEGMENT COMPLETE
   ┌─────────────────────────────────────────────────┐
   │ Reached last waypoint in lobby                  │
   │ → Trigger room transition                       │
   │ Next room in route: "hallway"                   │
   │ Find door: lobby ↔ hallway                      │
   │ Move NPC to door position                       │
   └─────────────────────────────────────────────────┘
                         ↓
   ┌─────────────────────────────────────────────────┐
   │ Sprite Transition                               │
   │ - Update NPC position: world coords of hallway  │
   │ - Update NPC roomId: "lobby" → "hallway"        │
   │ - Update sprite depth (new room offset)         │
   │ - Ensure sprite visible in hallway              │
   └─────────────────────────────────────────────────┘
                         ↓
   ┌─────────────────────────────────────────────────┐
   │ Advance to next segment                         │
   │ currentSegmentIndex: 0 → 1                      │
   │ Now patrolling: "hallway" waypoints             │
   └─────────────────────────────────────────────────┘

4. HALLWAY SEGMENT
   ┌─────────────────────────────────────────────────┐
   │ Same patrol logic as Feature 1                  │
   │ Follow hallway waypoints: [wp0, wp1, ...]       │
   └─────────────────────────────────────────────────┘
                         ↓
   ┌─────────────────────────────────────────────────┐
   │ Repeat: hallway → office → lobby → hallway...   │
   │ Infinite loop through 3 rooms                   │
   └─────────────────────────────────────────────────┘
```

---

## State Machine: Waypoint Patrol

```
                    ┌──────────────┐
                    │ Patrol Init  │
                    └──────────────┘
                           │
                           ↓
                    ┌──────────────────┐
                    │ Choose Target    │
                    │ (waypoint/random)│
                    └──────────────────┘
                           │
                           ↓
        ┌──────────────────────────────────┐
        │ Call Pathfinding (EasyStar)      │
        │ [ASYNC - returns waypoint list]  │
        └──────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    ↓             ↓
            ┌─────────────┐  ┌──────────┐
            │ Path Found  │  │ No Path  │
            └─────────────┘  └──────────┘
                    │              │
                    ↓              ↓
            ┌─────────────┐  ┌──────────────┐
            │ Follow Path │  │ Back to Init │
            └─────────────┘  └──────────────┘
                    │
        ┌───────────┼───────────┐
        ↓           ↓           ↓
    ┌────────┐ ┌────────┐ ┌──────────┐
    │Moving  │ │Dwelling│ │ Reached  │
    │        │ │at wayp │ │Waypoint? │
    │velocity│ │(pause) │ │          │
    │set     │ │        │ │          │
    └────────┘ └────────┘ └──────────┘
        │          │           │
        │          └───────┬───┘
        │                  ↓
        │          ┌──────────────┐
        │          │ Next Waypoint│
        │          │ or New Target│
        │          └──────────────┘
        │                  │
        └──────────────────┘
                │
                ↓
        ┌──────────────────┐
        │ Loop: ∞          │
        └──────────────────┘
```

---

## Coordinate System

```
TILE COORDINATES (3-8 range)
    ┌─────────────────────────────┐
    │ (3,3) ... (6,3)  (8,3)      │
    │  │                   │       │
    │  │  Waypoint 1       │       │
    │  │                   │       │
    │ (3,6) ... (5,5)  (8,6)      │
    │  │         (^Wp2)    │       │
    │  │                   │       │
    │ (3,8) ... (6,8)  (8,8)      │
    └─────────────────────────────┘
         Room Top-Left: (0,0)
         32px per tile


WORLD COORDINATES (pixels)
    ┌─────────────────────────────┐
    │ (64,64) ... (192,64)        │
    │  │                   │       │
    │  │  Waypoint 1       │       │
    │  │                   │       │
    │ (64,192) ... (160,160)      │
    │  │         (^Wp2)    │       │
    │  │                   │       │
    │ (64,256) ... (192,256)      │
    └─────────────────────────────┘
         Room Top-Left: (32,32)
         + Room world offset


CONVERSION FORMULA:
    worldX = roomWorldX + (tileX * 32)
    worldY = roomWorldY + (tileY * 32)

EXAMPLE:
    Tile (4,4) in room at world (32, 32):
    worldX = 32 + (4 * 32) = 32 + 128 = 160
    worldY = 32 + (4 * 32) = 32 + 128 = 160
    → World position: (160, 160)
```

---

## Room Connection Example

```
LOBBY (256×256 pixels)                HALLWAY (512×256 pixels)
┌────────────────────────┐    door    ┌──────────────────────────────┐
│                        │   (east)   │                              │
│  Waypoint 1 (4,4)      │ ←────────→ │   Waypoint 1 (3,4)           │
│  ●                     │            │   ●                          │
│                        │            │                              │
│        Waypoint 2 (5,6)│────────────│─→Waypoint 2 (3,6)            │
│        ●               │    door    │   ●                          │
│                        │   (exit)   │                              │
└────────────────────────┘            └──────────────────────────────┘

PATROL ROUTE:
Lobby: (4,4) → (5,6) → [END] →
  Find door to Hallway
  [TRANSITION]
Hallway: (3,4) → (3,6) → [END] →
  Find door back to Lobby
  [TRANSITION]
Lobby: (4,4) → ... [REPEAT]
```

---

## Validation Tree

```
PHASE 1: WAYPOINT VALIDATION
┌─ Parse config
│  └─ waypoints defined?
│     ├─ YES: Continue validation
│     └─ NO: Use random patrol (fallback)
│
├─ For each waypoint:
│  ├─ x, y in range (3-8)?
│  │  ├─ YES: Continue
│  │  └─ NO: Mark invalid, log warning
│  │
│  ├─ Within room bounds?
│  │  ├─ YES: Continue
│  │  └─ NO: Mark invalid, log warning
│  │
│  └─ Walkable (not in wall)?
│     ├─ YES: Valid waypoint ✅
│     └─ NO: Mark invalid, log warning
│
└─ Result:
   ├─ All valid: Use waypoint patrol ✅
   └─ Any invalid: Fall back to random patrol ⚠️


PHASE 2: MULTI-ROOM VALIDATION
┌─ Parse config
│  └─ multiRoom = true && route defined?
│     ├─ YES: Continue validation
│     └─ NO: Use single-room patrol
│
├─ Validate startRoom
│  ├─ startRoom exists? ✅/❌
│  └─ NPC spawns correctly? ✅/❌
│
├─ For each room in route:
│  ├─ Room exists in scenario? ✅/❌
│  │
│  └─ Validate waypoints (Phase 1) ✅/❌
│
├─ Check room connections:
│  └─ For each (roomA, roomB) pair:
│     └─ Door exists? ✅/❌
│
└─ Result:
   ├─ All valid: Use multi-room route ✅
   └─ Any invalid: Disable multiRoom, use single-room ⚠️
```

---

## Integration Points

```
EXISTING SYSTEMS
    ├─ EasyStar.js
    │  └─ Pathfinding (no changes needed)
    │
    ├─ Door System
    │  └─ Door transitions (no changes needed)
    │
    ├─ Room System
    │  ├─ Room loading (may add: pre-load routes)
    │  └─ Room data (reads: wallsLayers, worldX/Y)
    │
    └─ NPC Systems
       ├─ npc-sprites.js (add: relocateNPCSprite)
       ├─ npc-manager.js (add: room tracking)
       └─ npc-behavior.js (main changes)

NEW FEATURES BUILD ON:
    ├─ Existing pathfinding grid
    ├─ Existing sprite system
    ├─ Existing door transitions
    ├─ Existing room loading
    └─ NO new dependencies!
```

---

## Code Change Summary

```
FILE: npc-behavior.js (MAIN CHANGES)
├─ parseConfig()
│  ├─ ADD: parse patrol.waypoints
│  ├─ ADD: parse patrol.waypointMode
│  ├─ ADD: waypoint validation
│  └─ ADD: tile → world coordinate conversion
│
├─ NEW METHOD: validateWaypoints()
│  └─ Check walkable, within bounds
│
├─ chooseNewPatrolTarget()
│  ├─ CHECK: if waypoints enabled
│  ├─ IF YES: select waypoint (seq/random)
│  └─ IF NO: use random patrol (existing code)
│
├─ updatePatrol()
│  ├─ ADD: dwell timer logic
│  └─ Phase 2: ADD room transition detection
│
└─ Phase 2 ADD: transitionToNextRoom()
   ├─ Find door to next room
   ├─ Update NPC roomId
   └─ Relocate sprite


FILE: npc-pathfinding.js (PHASE 2 ONLY)
├─ NEW METHOD: findPathAcrossRooms()
│  └─ Path from room A → door → room B
│
└─ NEW METHOD: getRoomConnectionDoor()
   └─ Find connecting door between 2 rooms


FILE: npc-sprites.js (PHASE 2 ONLY)
└─ NEW METHOD: relocateNPCSprite()
   ├─ Update position
   ├─ Update depth
   └─ Update visibility


FILE: rooms.js (PHASE 2 ONLY)
└─ MODIFY: initializeRooms()
   └─ ADD: pre-load multi-room NPC routes
```

---

## Timeline Estimate

```
PHASE 1: WAYPOINTS (2-4 hours)
├─ Code changes: 1-2 hours
│  ├─ parseConfig() updates
│  ├─ Waypoint validation
│  └─ chooseNewPatrolTarget() update
│
├─ Testing: 1 hour
│  └─ Create test scenario, verify patrol
│
└─ Debugging: 0.5-1 hour

PHASE 2: MULTI-ROOM (4-8 hours)
├─ Code changes: 2-3 hours
│  ├─ npc-behavior.js room transitions
│  ├─ npc-pathfinding.js new methods
│  ├─ npc-sprites.js sprite relocation
│  └─ rooms.js pre-loading
│
├─ Integration: 1 hour
│  └─ Connect systems together
│
├─ Testing: 1-2 hours
│  └─ Create multi-room scenario, verify transitions
│
└─ Debugging: 1 hour

TOTAL: 6-12 hours
├─ Phase 1 alone: 2-4 hours (low risk)
├─ Phase 2 alone: 4-8 hours (medium risk)
└─ Both together: 6-12 hours (higher complexity)

RECOMMENDATION: Do Phase 1 first, then Phase 2
```

---

## Success Criteria

### Phase 1 Testing
```
✅ NPC follows waypoints in order
✅ NPC reaches each waypoint
✅ NPC loops back to start
✅ Waypoint validation rejects invalid waypoints
✅ Fallback to random patrol works
✅ Dwell time pauses NPC at waypoint
✅ Console shows waypoint selection
✅ No errors in console
```

### Phase 2 Testing
```
✅ NPC spawns in startRoom
✅ NPC patrols startRoom waypoints
✅ NPC transitions to next room
✅ Sprite appears in new room
✅ NPC continues patrol in new room
✅ NPC loops back to startRoom
✅ Multi-room validation catches errors
✅ Graceful fallback if route invalid
✅ No errors in console
```

---

This visual architecture should help guide implementation! 🚀

