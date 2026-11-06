# NPC Lazy-Loading Architecture: Visual Guide
## Quick Reference & Diagrams

**Date**: November 6, 2025  
**Purpose**: Visual reference for team understanding

---

## 1. Current vs. Target Architecture

### CURRENT FLOW (Before Lazy-Loading)

```
┌─────────────────────────────────────────────────────────┐
│                  BROWSER                                │
│                                                         │
│  ┌──────────────────────────────────────────────┐      │
│  │          scenario.json (entire game)         │      │
│  │  - All NPCs (100 if scenario large)          │      │
│  │  - All rooms & objects                       │      │
│  │  - All Ink stories                           │      │
│  │  - Loaded at game start                      │      │
│  └──────────────────────────────────────────────┘      │
│           ↓                                             │
│  ┌──────────────────────────────────────────────┐      │
│  │       Phaser Game Initialize                 │      │
│  │  1. Register ALL NPCs (npcManager)          │      │
│  │  2. Create sprite sheets in memory          │      │
│  │  3. Load all Ink stories                    │      │
│  │  4. Start game                              │      │
│  └──────────────────────────────────────────────┘      │
│           ↓                                             │
│  ┌──────────────────────────────────────────────┐      │
│  │    Player Explores (no network needed)      │      │
│  │  - All NPCs in memory                       │      │
│  │  - Smooth room transitions                  │      │
│  │  - High memory usage                        │      │
│  └──────────────────────────────────────────────┘      │
│                                                         │
└─────────────────────────────────────────────────────────┘

📊 Memory: ALL scenario loaded upfront (~50MB for large scenarios)
⏱️ Startup: 1-2 seconds (fetching + parsing large JSON)
🚀 Scalability: Limited (client memory is bottleneck)
🔗 Server Ready: No (everything in JSON)
```

### TARGET FLOW (After Lazy-Loading)

```
┌─────────────────────────────────────────────────────────┐
│                   BROWSER                               │
│  ┌──────────────────────────────────────────┐           │
│  │  Initial scenario.json (lean)            │           │
│  │  - Phone NPCs only                       │           │
│  │  - Room definitions (no NPCs yet)        │           │
│  │  - Loaded at game start                  │           │
│  └──────────────────────────────────────────┘           │
│           ↓                                              │
│  ┌──────────────────────────────────────────┐           │
│  │  Phaser Game Initialize                  │           │
│  │  1. Register phone NPCs (always available)          │           │
│  │  2. Ready for gameplay                   │           │
│  │  3. FAST startup (1 second)              │           │
│  └──────────────────────────────────────────┘           │
│           ↓                                              │
│  ┌──────────────────────────────────────────┐           │
│  │  Player Enters Room A                    │           │
│  │           ↓                              │           │
│  │  npcLazyLoader.loadNPCsForRoom('roomA') │           │
│  │           ↓                              │           │
│  │  Fetch room data + NPCs                  │           │
│  │  (from local scenario OR server)         │           │
│  │           ↓                              │           │
│  │  Create person NPC sprites               │           │
│  │  Load Ink stories (if needed)            │           │
│  │           ↓                              │           │
│  │  NPCs appear in room                     │           │
│  └──────────────────────────────────────────┘           │
│           ↓                                              │
│  ┌──────────────────────────────────────────┐           │
│  │  Player Enters Room B                    │           │
│  │           ↓                              │           │
│  │  Unload Room A NPCs (cleanup)            │           │
│  │  Load Room B NPCs (same process)         │           │
│  └──────────────────────────────────────────┘           │
│                                                         │
│  💾 Memory: Only loaded room + phone NPCs              │
│  ⏱️ Startup: 0.5 seconds (fast!)                       │
│  🚀 Scalability: Unlimited (stream any size)           │
│  🔗 Server Ready: Yes (content on-demand)              │
└─────────────────────────────────────────────────────────┘

📊 Memory: Only active room in memory (~2-5MB)
⏱️ Startup: 0.5 seconds (half the time!)
🚀 Scalability: Unlimited (server can stream)
🔗 Server Ready: Yes! Foundation for all future work
```

---

## 2. NPC Type Breakdown

### NPC Types in Break Escape

```
┌─────────────────────────────────────────────┐
│           ALL NPCs in Break Escape          │
└─────────────────────────────────────────────┘
               ↙                      ↘
        ┌──────────────┐         ┌──────────────┐
        │ PHONE NPCs   │         │ PERSON NPCs  │
        │ (Global)     │         │ (Room-bound) │
        └──────────────┘         └──────────────┘
              │                          │
        ┌─────┴──────┐            ┌─────┴──────┐
        │  Properties  │            │  Properties  │
        ├──────────────┤            ├──────────────┤
        │• id          │            │• id          │
        │• displayName │            │• displayName │
        │• phoneId     │            │• position    │
        │• storyPath   │            │• spriteSheet │
        │• avatar      │            │• storyPath   │
        │• currentKnot │            │• currentKnot │
        │• timedMessages           │• roomId      │
        │• eventMappings          │• npcType     │
        └──────────────┘            └──────────────┘
              │                          │
        ┌─────▼──────────┐         ┌─────▼──────────┐
        │    LOCATION    │         │    LOCATION    │
        ├────────────────┤         ├────────────────┤
        │ Root: npcs[]   │         │ Room: npcs[]   │
        │ Global access  │         │ Room-specific  │
        └────────────────┘         └────────────────┘
              │                          │
        ┌─────▼──────────┐         ┌─────▼──────────┐
        │   LIFECYCLE    │         │   LIFECYCLE    │
        ├────────────────┤         ├────────────────┤
        │ Load: at init  │         │ Load: room     │
        │ Unload: never  │         │ Unload: leave  │
        │ Visible: phone │         │ Visible: world │
        │ Always active  │         │ Active in room │
        └────────────────┘         └────────────────┘
              │                          │
        ┌─────▼──────────┐         ┌─────▼──────────┐
        │   EXAMPLE      │         │   EXAMPLE      │
        ├────────────────┤         ├────────────────┤
        │ "Neye Eve"     │         │ "Desk Clerk"   │
        │ Contact on     │         │ Sprite in      │
        │ player phone   │         │ reception room │
        └────────────────┘         └────────────────┘
```

---

## 3. Implementation Phases Timeline

```
WEEK 1         WEEK 2         WEEK 3         WEEK 4         WEEK 5+
   │              │              │              │              │
   ├──PHASE 1──┤   ├──PHASE 2──┤  ├──PHASE 3──┤  ├────PHASE 4────┤
   │           │   │           │  │           │  │               │
   │  BUILD    │   │ MIGRATE   │  │  REFACTOR │  │ SERVER API &  │
   │ LAZY-     │   │ SCENARIOS │  │ LIFECYCLE │  │ INTEGRATION   │
   │ LOADER    │   │           │  │           │  │               │
   │           │   │           │  │           │  │               │
   └───────────┘   └───────────┘  └───────────┘  └───────────────┘
    ↓  ↓  ↓       ↓  ↓  ↓        ↓  ↓  ↓        ↓  ↓  ↓  ↓
    ✅ Code      ✅ Scenarios  ✅ Events     ✅ API Spec
    ✅ Tests     ✅ Validation ✅ Tests      ✅ Mock Server
    ✅ Backward  ✅ Testing    ✅ Backward   ✅ Integration
       Compat       Compat       Compat

TOTAL: ~6 weeks, ~1 developer-month
```

---

## 4. Room NPC Loading Process

```
PLAYER OPENS DOOR TO ROOM A
           │
           ▼
┌──────────────────────────────────────┐
│ loadRoom("roomA") called             │
│ - Create sprites for objects         │
│ - Set up collisions                  │
│ - Prepare room UI                    │
└──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ npcLazyLoader.loadNPCsForRoom()      │
│ - Check if already loaded            │
│ - Get NPC definitions from:          │
│   • Local scenario (default)         │
│   • Server API (Phase 4+)            │
└──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ FOR EACH NPC in room:                │
│                                      │
│ ┌───────────────────────────────┐  │
│ │ 1. Load Ink story (if needed) │  │
│ │    - Check cache first        │  │
│ │    - Fetch if not cached      │  │
│ │    - Store in cache           │  │
│ └───────────────────────────────┘  │
│                                      │
│ ┌───────────────────────────────┐  │
│ │ 2. Register NPC               │  │
│ │    - npcManager.registerNPC() │  │
│ │    - Set up event listeners   │  │
│ │    - Start timed messages     │  │
│ └───────────────────────────────┘  │
│                                      │
│ ┌───────────────────────────────┐  │
│ │ 3. Create sprite (if person)  │  │
│ │    - Verify sprite sheet      │  │
│ │    - Create sprite object     │  │
│ │    - Set up animations        │  │
│ │    - Set up collisions        │  │
│ └───────────────────────────────┘  │
│                                      │
└──────────────────────────────────────┘
           │
           ▼
┌──────────────────────────────────────┐
│ ROOM A NPCs NOW ACTIVE:              │
│ ✅ NPCs visible in world             │
│ ✅ Event listeners active            │
│ ✅ Dialogue ready                    │
│ ✅ Timed messages started            │
└──────────────────────────────────────┘
           │
           ├─ Player interacts with NPC ✅
           │
           ├─ Event triggered (e.g., item found)
           │     └─> NPC responds via event mapping ✅
           │
           └─ Timed message timer reaches delay
                 └─> NPC sends message ✅

PLAYER LEAVES ROOM A, ENTERS ROOM B
           │
           ▼
┌──────────────────────────────────────┐
│ unloadNPCsForRoom("roomA")           │
│ - Destroy sprites                    │
│ - Remove event listeners             │
│ - Clean up state                     │
│ - Save conversation history          │
└──────────────────────────────────────┘
           │
           ▼
[Repeat loading process for ROOM B...]
```

---

## 5. Scenario JSON Structure

### BEFORE (Current Format)

```json
{
  "scenario_brief": "...",
  "startRoom": "reception",
  
  "npcs": [
    ← ALL NPCs here, loaded at startup
    {
      "id": "helper_npc",
      "npcType": "phone",
      "phoneId": "player_phone"
    },
    {
      "id": "desk_clerk",
      "npcType": "person",
      "roomId": "reception",
      ← NPC knows which room via roomId
      "position": { "x": 5, "y": 3 }
    }
  ],
  
  "rooms": {
    "reception": {
      ← No NPCs here (defined above)
      "type": "room_reception",
      "objects": [...]
    }
  }
}
```

### AFTER (New Format)

```json
{
  "scenario_brief": "...",
  "startRoom": "reception",
  
  "npcs": [
    ← ONLY phone NPCs here
    {
      "id": "helper_npc",
      "npcType": "phone",
      "phoneId": "player_phone"
    }
  ],
  
  "rooms": {
    "reception": {
      "type": "room_reception",
      
      "npcs": [
        ← Person NPCs moved here!
        {
          "id": "desk_clerk",
          "npcType": "person",
          ← No need for roomId (implicit)
          "position": { "x": 5, "y": 3 },
          "spriteSheet": "hacker-red",
          "storyPath": "scenarios/ink/clerk.json"
        }
      ],
      
      "objects": [...]
    }
  }
}
```

**Key Changes**:
- ✅ Person NPCs moved from root `npcs[]` → `rooms[roomId].npcs[]`
- ✅ Phone NPCs stay in root `npcs[]`
- ✅ No `roomId` field in room NPCs (location is implicit)

---

## 6. Module Dependencies

```
BEFORE (Monolithic):
┌──────────────────┐
│   game.js        │
│  (create)        │
├──────────────────┤
│ Register ALL NPCs│ ────────────> npc-manager.js
│ in scenario.npcs │
└──────────────────┘

AFTER (Modular):
┌──────────────────┐
│   game.js        │
│  (create)        │
├──────────────────┤
│ Register PHONE   │ ────────────> npc-manager.js
│ NPCs only        │
└──────────────────┘
        ↑
        │
┌──────────────────────────────┐
│  rooms.js                    │
│  (loadRoom)                  │
├──────────────────────────────┤
│ Call npcLazyLoader           │ ────────────> npc-lazy-loader.js
│ .loadNPCsForRoom()           │                (NEW)
└──────────────────────────────┘
        │
        └────────────────────────> npc-manager.js
                 register person NPCs here
                 (on-demand)
```

---

## 7. Memory Usage Comparison

### Small Scenario (5 NPCs, 3 rooms)

```
BEFORE (Monolithic):
┌────────────────────────────────────┐
│ Memory at Startup                  │
├────────────────────────────────────┤
│ Game engine          │ ████       │
│ Phaser graphics      │ █████      │
│ All 5 NPCs loaded    │ ████       │ ← Unnecessary!
│ Scenario JSON        │ ██         │
│ UI/DOM               │ ███        │
├────────────────────────────────────┤
│ TOTAL: ~15 MB                      │
└────────────────────────────────────┘

AFTER (Lazy-Loading):
┌────────────────────────────────────┐
│ Memory at Startup                  │
├────────────────────────────────────┤
│ Game engine          │ ████       │
│ Phaser graphics      │ █████      │
│ Phone NPCs (1)       │ █          │
│ Scenario JSON        │ ██         │
│ UI/DOM               │ ███        │
├────────────────────────────────────┤
│ TOTAL: ~8 MB                       │
│ SAVED: ~7 MB (47% reduction) ✅   │
└────────────────────────────────────┘

On room load: +1-2 MB per room NPCs (temporary)
```

---

## 8. Decision Tree: Is This NPC a Server Candidate?

```
Does this NPC exist?
       │
       ├─ NO → Don't worry about it yet
       │
       └─ YES → Continue

Is it a PHONE NPC?
    (has phoneId, no position/sprite)
       │
       ├─ YES → Load at game start (root npcs)
       │         ✅ Ready for Phase 1
       │
       └─ NO → Continue

Is it a PERSON NPC?
    (has position, sprite sheet)
       │
       ├─ YES → Load with room (room.npcs)
       │         ✅ Ready for Phase 1
       │
       └─ MAYBE → Check for:
                   - Has roomId field?  → Person
                   - Has position field? → Person
                   - Has spriteSheet?    → Person
                   Ask: "Where in world?" → Person
```

---

## 9. Testing Strategy Overview

```
PHASE 1 TESTING
└─ Unit Tests (>90% coverage)
   ├─ NPCLazyLoader class
   ├─ NPCManager.unregisterNPC()
   └─ Room loading integration
└─ Integration Tests
   └─ Room + NPC lazy-loading together
└─ Manual Tests
   └─ Backward compatibility (old scenarios work)

PHASE 2 TESTING
└─ Validation Tests
   ├─ JSON schema validation
   ├─ No person NPCs at root
   └─ All phone NPCs properly tagged
└─ Manual Tests
   ├─ Each scenario loads
   └─ NPCs appear in correct rooms

PHASE 3 TESTING
└─ Event Lifecycle Tests
   ├─ Events fire after room load
   ├─ Timed messages work
   └─ Ink continuation works
└─ Regression Tests
   └─ All existing scenarios still work

PHASE 4 TESTING
└─ API Contract Tests
   ├─ Mock server returns correct format
   ├─ Client handles server responses
   └─ Error handling works
└─ Integration Tests
   └─ End-to-end game + server
```

---

## 10. Success Metrics Scorecard

```
┌──────────────────────────────────────────────────┐
│            PHASE SUCCESS CRITERIA               │
├──────────────────────────────────────────────────┤
│ Phase 1: Infrastructure                        │
│ ✅ npc-lazy-loader.js created & tested        │
│ ✅ Unit test coverage >90%                     │
│ ✅ Backward compatibility verified             │
│ ✅ No console errors                           │
│ ✅ Code review approved                        │
├──────────────────────────────────────────────────┤
│ Phase 2: Migration                             │
│ ✅ All scenarios migrated                      │
│ ✅ Validation script passes all                │
│ ✅ Manual testing in-game works                │
│ ✅ No NPCs missing or misplaced                │
├──────────────────────────────────────────────────┤
│ Phase 3: Lifecycle                             │
│ ✅ Events fire at correct time                 │
│ ✅ Timed messages work                         │
│ ✅ No regressions from Phase 2                 │
│ ✅ Integration tests passing                   │
├──────────────────────────────────────────────────┤
│ Phase 4: Server Ready                          │
│ ✅ API spec complete & documented              │
│ ✅ Mock server working                         │
│ ✅ Can fetch room data from server             │
│ ✅ Ready for backend implementation            │
├──────────────────────────────────────────────────┤
│ OVERALL                                         │
│ ✅ Game startup 50% faster                     │
│ ✅ Memory usage 40% lower                      │
│ ✅ Server-ready architecture                   │
│ ✅ All existing games still playable           │
│ ✅ Team trained on new system                  │
└──────────────────────────────────────────────────┘
```

---

## 11. Quick Command Reference

```bash
# Phase 1: Start development
git checkout -b feature/npc-lazy-loading
npm test -- --coverage

# Phase 2: Migrate scenarios
python3 scripts/migrate_npcs.py scenarios/ceo_exfil.json
python3 scripts/validate_scenarios.sh

# Phase 3: Test lifecycle
npm test -- test/npc-lifecycle.test.js

# Phase 4: Start server
npm run dev:mock-server
npm test:integration
```

---

## 12. FAQ in Visual Form

```
Q: Will this break my game?
A: No! Phase 1-3 backward compatible
   └─ Old scenarios work as before
   └─ New code is isolated
   └─ Easy rollback if issues

Q: How long is this project?
A: ~6 weeks, 1 developer
   └─ Phase 1: 2 weeks
   └─ Phase 2: 1 week
   └─ Phase 3: 1 week
   └─ Phase 4: 2+ weeks

Q: Can I skip phases?
A: Nope! Sequential build:
   Phase 1 → Phase 2 → Phase 3 → Phase 4

Q: What's the benefit?
A: SPEED + SCALE + SERVER-READY
   └─ 50% faster startup
   └─ 40% less memory
   └─ Stream any size game
   └─ Server-friendly architecture

Q: Do I need to update my scenario?
A: Yes, in Phase 2
   └─ Move person NPCs to rooms
   └─ Keep phone NPCs at root
   └─ Migration script can help
```

---

This visual guide complements the detailed documentation. Use this for:
- ✅ Quick team briefings
- ✅ Design presentations
- ✅ Architecture reviews
- ✅ Onboarding new team members
- ✅ Project planning discussions
