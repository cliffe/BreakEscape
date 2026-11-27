# Break Escape: Lazy-Loading NPC Migration Plan
## Preparing for Server-Side Client Architecture

**Document Version**: 1.0  
**Date**: November 6, 2025  
**Status**: Planning Phase  

---

## Executive Summary

This document outlines a comprehensive migration strategy to transform Break Escape from an **up-front NPC loading model** to a **lazy-loading, room-based NPC model**. This change is essential to support future server-side APIs that deliver game content incrementally as the player explores, rather than loading everything into the browser at once.

### Key Goals

1. **Room-Centric NPC Definition**: NPCs defined within room objects, not at scenario root level
2. **Lazy Loading**: NPCs loaded only when their room becomes active
3. **Server-API Ready**: Support fetching room + NPC data from server as needed
4. **Phone NPC Support**: Phone-based NPCs (non-spatial) loaded when scenario starts
5. **Backward Compatibility**: Gradual migration path without breaking existing features

---

## Current Architecture (Baseline)

### Current NPC Loading Flow

```
Game Initialization
    ↓
Load scenario JSON (includes all NPCs at root level)
    ↓
game.js: create() → registers ALL NPCs via npcManager.registerNPC()
    ↓
createRoom() is called for each room
    ↓
createNPCSpritesForRoom() filters NPCs by roomId
    ↓
Only PERSON-type NPCs create visible sprites
    ↓
PHONE-type NPCs remain invisible, managed by phone UI
```

### Current Scenario Structure

```json
{
  "scenario_brief": "...",
  "startRoom": "reception",
  "npcs": [
    {
      "id": "neye_eve",
      "displayName": "Neye Eve",
      "storyPath": "scenarios/ink/neye-eve.json",
      "npcType": "phone",
      "phoneId": "player_phone",
      "timedMessages": [...]
    }
  ],
  "rooms": {
    "reception": {
      "type": "room_reception",
      "objects": [...]
    }
  }
}
```

### Limitations of Current Approach

| Issue | Impact | Server-API Problem |
|-------|--------|-------------------|
| All NPCs registered upfront | Memory overhead for large scenarios | Can't fetch NPC data incrementally |
| NPC roomId matched in code | Coupling between NPC and room definitions | Room data incomplete without scenario root |
| Phone NPCs assume global availability | Timed messages fire immediately | Server must send all phone NPCs before game starts |
| No lazy-loading trigger | NPCs loaded before room rendering | Can't request missing data on-demand |
| No load/unload lifecycle | Missing hooks for async operations | No way to cleanup when leaving room |

---

## Target Architecture (Post-Migration)

### New NPC Loading Flow

```
Game Initialization
    ↓
Load scenario JSON (NPCs now within rooms OR at root for "global" phone NPCs)
    ↓
game.js: create() → registers PHONE-type NPCs only
    ↓
Room becomes active (door unlock/transition)
    ↓
loadRoom() called
    ↓
loadNPCsForRoom() triggered (NEW)
    ↓
Fetch room NPCs (from scenario or server)
    ↓
Load Ink story files if not cached
    ↓
Register person-type NPCs with npcManager
    ↓
Create sprites + timed messages + start event listeners
```

### New Scenario Structure (In-Room NPCs)

```json
{
  "scenario_brief": "...",
  "startRoom": "reception",
  
  "npcs": [
    {
      "id": "global_npc",
      "npcType": "phone",
      "displayName": "Always Available",
      "phoneId": "player_phone"
    }
  ],
  
  "rooms": {
    "reception": {
      "type": "room_reception",
      "npcs": [
        {
          "id": "desk_clerk",
          "displayName": "Clerk",
          "npcType": "person",
          "position": { "x": 5, "y": 3 },
          "spriteSheet": "hacker-red",
          "storyPath": "scenarios/ink/clerk.json",
          "currentKnot": "start"
        }
      ],
      "objects": [...]
    }
  }
}
```

---

## Implementation Phases

### Phase 1: Infrastructure Setup (No Breaking Changes)

**Goal**: Create new lazy-loading system in parallel with existing upfront loader.

#### 1.1 Create `npc-lazy-loader.js` Module

```javascript
// js/systems/npc-lazy-loader.js

export default class NPCLazyLoader {
  constructor(npcManager, eventDispatcher) {
    this.npcManager = npcManager;
    this.eventDispatcher = eventDispatcher;
    this.loadedRooms = new Set();
    this.inkStoryCache = new Map();
  }

  /**
   * Load NPCs for a specific room
   * @param {string} roomId - Room to load NPCs for
   * @param {Object} roomData - Room definition from scenario or server
   * @param {Object} options - { fromServer: false, preloadAssets: true }
   * @returns {Promise<Array>} Loaded NPC definitions
   */
  async loadNPCsForRoom(roomId, roomData, options = {}) {
    if (this.loadedRooms.has(roomId)) {
      console.log(`ℹ️ NPCs already loaded for room ${roomId}`);
      return [];
    }

    if (!roomData?.npcs) {
      return [];
    }

    const npcs = [];
    
    for (const npcDef of roomData.npcs) {
      try {
        // Load Ink story if needed
        if (npcDef.storyPath && !this.inkStoryCache.has(npcDef.storyPath)) {
          await this._loadInkStory(npcDef.storyPath);
        }

        // Register with npcManager
        npcDef.roomId = roomId; // Tag NPC with its room
        this.npcManager.registerNPC(npcDef);
        
        npcs.push(npcDef);
        
        console.log(`✅ Lazy-loaded NPC: ${npcDef.id} → room ${roomId}`);
      } catch (error) {
        console.error(`❌ Failed to lazy-load NPC ${npcDef.id}:`, error);
      }
    }

    this.loadedRooms.add(roomId);
    return npcs;
  }

  /**
   * Unload NPCs when leaving a room
   * @param {string} roomId - Room being unloaded
   */
  unloadNPCsForRoom(roomId) {
    if (!this.loadedRooms.has(roomId)) {
      return;
    }

    // Find all NPCs belonging to this room
    const npcsToRemove = Array.from(this.npcManager.npcs.values())
      .filter(npc => npc.roomId === roomId);

    npcsToRemove.forEach(npc => {
      this.npcManager.unregisterNPC(npc.id);
      console.log(`🗑️ Unloaded NPC: ${npc.id} from room ${roomId}`);
    });

    this.loadedRooms.delete(roomId);
  }

  /**
   * Load and cache Ink story file
   * @private
   */
  async _loadInkStory(storyPath) {
    return fetch(storyPath)
      .then(res => res.json())
      .then(story => {
        this.inkStoryCache.set(storyPath, story);
        console.log(`📖 Cached Ink story: ${storyPath}`);
        return story;
      });
  }

  /**
   * Get loaded rooms (for debugging)
   */
  getLoadedRooms() {
    return Array.from(this.loadedRooms);
  }

  /**
   * Clear all caches (for memory management)
   */
  clearCaches() {
    this.inkStoryCache.clear();
    this.loadedRooms.clear();
    console.log('🧹 NPC loader caches cleared');
  }
}
```

#### 1.2 Initialize Lazy Loader in `main.js`

```javascript
// js/main.js (additions)

import NPCLazyLoader from './systems/npc-lazy-loader.js?v=1';

// In initializeGame():
window.npcLazyLoader = new NPCLazyLoader(
  window.npcManager,
  window.eventDispatcher
);
console.log('✅ NPC lazy loader initialized');
```

#### 1.3 Hook Lazy Loader into Room Loading

In `js/core/rooms.js`:

```javascript
// In loadRoom() function, after room is created
async function loadRoom(roomId) {
    // ... existing room creation code ...
    
    // NEW: Load NPCs for this room
    if (window.npcLazyLoader) {
        try {
            const roomData = rooms[roomId];
            await window.npcLazyLoader.loadNPCsForRoom(roomId, roomData);
        } catch (error) {
            console.error(`❌ Failed to load NPCs for room ${roomId}:`, error);
        }
    }
    
    // ... continue with rest of room creation ...
}

// In unloadRoom() function (if it exists) or room cleanup
export function unloadRoom(roomId) {
    // ... existing cleanup ...
    
    // NEW: Unload NPCs when leaving room
    if (window.npcLazyLoader) {
        window.npcLazyLoader.unloadNPCsForRoom(roomId);
    }
}
```

#### 1.4 Add `unregisterNPC()` to NPCManager

```javascript
// js/systems/npc-manager.js (additions)

unregisterNPC(npcId) {
  if (!this.npcs.has(npcId)) {
    console.warn(`⚠️ NPC ${npcId} not found for unregistration`);
    return;
  }

  const npc = this.npcs.get(npcId);

  // Clean up event listeners
  if (this.eventListeners.has(npcId)) {
    this.eventListeners.get(npcId).forEach(listener => {
      if (this.eventDispatcher) {
        this.eventDispatcher.off(listener.event, listener.callback);
      }
    });
    this.eventListeners.delete(npcId);
  }

  // Clear conversation state
  this.clearNPCState(npcId);

  // Remove from tracking
  this.npcs.delete(npcId);

  console.log(`✅ Unregistered NPC: ${npcId}`);
}
```

**Status**: Phase 1 is **non-breaking**. Existing upfront loader still works.

---

### Phase 2: Scenario File Migration

**Goal**: Update scenario JSON files to include NPCs within rooms.

#### 2.1 Scenario File Format Update

**Before** (ceo_exfil.json - current):
```json
{
  "npcs": [
    { "id": "npc1", "npcType": "phone", ... },
    { "id": "npc2", "npcType": "person", ... }
  ],
  "rooms": {
    "reception": { "objects": [...] }
  }
}
```

**After** (ceo_exfil.json - new):
```json
{
  "npcs": [
    { 
      "id": "global_phone_npc",
      "npcType": "phone",
      "displayName": "Available Everywhere",
      "phoneId": "player_phone"
    }
  ],
  "rooms": {
    "reception": {
      "npcs": [
        {
          "id": "desk_clerk",
          "npcType": "person",
          "displayName": "Clerk",
          "position": { "x": 5, "y": 3 },
          "spriteSheet": "hacker",
          "storyPath": "scenarios/ink/clerk.json",
          "currentKnot": "start"
        }
      ],
      "objects": [...]
    }
  }
}
```

#### 2.2 Migration Path

1. **Add `room.npcs` field** to all scenarios
   - Initially empty for existing scenarios
   - Person-type NPCs moved from root `npcs` to `room.npcs`
   - Phone-type NPCs remain at root (global)

2. **Update test scenarios first**
   - `npc-sprite-test2.json` ← convert to new format
   - `biometric_breach.json` ← add room NPC support
   - Create new test: `test-lazy-npc-loading.json`

3. **Update production scenarios**
   - `ceo_exfil.json` ← migrate person NPCs to rooms
   - `cybok_heist.json` ← migrate person NPCs to rooms

#### 2.3 Backward Compatibility Mode

Support **both** old and new formats:

```javascript
// In loadNPCsForRoom():
async loadNPCsForRoom(roomId, roomData, options = {}) {
  let npcs = [];
  
  // NEW: Room-level NPCs (preferred)
  if (roomData.npcs && Array.isArray(roomData.npcs)) {
    npcs = roomData.npcs;
  }
  
  // FALLBACK: Root-level NPCs filtered by roomId (legacy support)
  if (npcs.length === 0 && window.gameScenario?.npcs) {
    npcs = window.gameScenario.npcs.filter(
      npc => npc.roomId === roomId || npc.npcType === 'person'
    );
  }
  
  // ... rest of loading logic
}
```

**Status**: Phase 2 requires scenario file updates but no code breaking changes.

---

### Phase 3: Event Lifecycle & Timed Messages

**Goal**: Move event system to lazy-load lifecycle.

#### 3.1 Event Listener Registration Timing

**Current** (fires immediately after registration):
```
registerNPC() → setup event mappings → listeners ACTIVE
```

**New** (fires after room enters):
```
loadNPCsForRoom() → registerNPC() → setup event mappings → listeners ACTIVE
```

**Impact**: Timed messages and event barks only trigger AFTER room is loaded.

#### 3.2 Timed Message Coordination

```javascript
// In npc-lazy-loader.js, after registerNPC():

if (npcDef.timedMessages && Array.isArray(npcDef.timedMessages)) {
  // Timed messages already scheduled by registerNPC()
  // They will fire based on delay from game start time
  console.log(`⏰ Timed messages scheduled for ${npcDef.id}`);
}
```

**Note**: Current timed message system uses game start time, which is unchanged.

#### 3.3 Phone NPC Lifecycle

Phone NPCs (registered at game start) have **different lifecycle**:

```javascript
// In game.js create():

// Register PHONE NPCs immediately (global, not room-bound)
if (gameScenario.npcs) {
  gameScenario.npcs
    .filter(npc => npc.npcType === 'phone' || !npc.npcType)
    .forEach(npc => {
      npc.isGlobal = true; // Mark as not room-specific
      window.npcManager.registerNPC(npc);
    });
}

// Don't register person NPCs here - wait for room load
```

**Status**: Phase 3 refactors lifecycle but is **backward-compatible**.

---

### Phase 4: Server-API Integration

**Goal**: Prepare for server-side room data delivery.

#### 4.1 Room Data Sources

```javascript
// In npc-lazy-loader.js:

async loadNPCsForRoom(roomId, roomData, options = {}) {
  // Option 1: From cached scenario (current)
  if (!options.fromServer) {
    roomData = window.gameScenario.rooms[roomId];
  }
  
  // Option 2: Fetch from server (future)
  if (options.fromServer) {
    const response = await fetch(
      `/api/game/${gameId}/rooms/${roomId}`
    );
    roomData = await response.json();
  }
  
  // Load NPCs from whichever source
  return this._registerRoomNPCs(roomId, roomData);
}
```

#### 4.2 NPC Asset Preloading

For server-side NPCs, we need to ensure sprite sheets are loaded:

```javascript
// In npc-lazy-loader.js:

async _preloadNPCAssets(npcDef) {
  if (!npcDef.spriteSheet) return;
  
  const scene = gameRef; // Get from window or parameter
  
  if (!scene.textures.exists(npcDef.spriteSheet)) {
    // Load sprite sheet dynamically
    return new Promise((resolve, reject) => {
      scene.load.spritesheet(
        npcDef.spriteSheet,
        `assets/characters/${npcDef.spriteSheet}.png`,
        { frameWidth: 64, frameHeight: 64 }
      );
      scene.load.start();
      scene.load.on('complete', resolve);
      scene.load.on('error', reject);
    });
  }
}
```

#### 4.3 Server API Specification

```yaml
# Future API endpoints to support

GET /api/game/{gameId}/room/{roomId}
  Returns: { id, type, connections, npcs: [], objects: [] }
  Status: 200 OK | 404 Not Found

GET /api/game/{gameId}/npc/{npcId}
  Returns: NPC definition with storyPath, spriteSheet, etc.
  Status: 200 OK | 404 Not Found

GET /api/game/{gameId}/story/{storyPath}
  Returns: Ink story JSON
  Status: 200 OK | 404 Not Found

GET /api/game/{gameId}/scenario
  Returns: Full scenario (backward compatibility)
  Status: 200 OK
```

**Status**: Phase 4 specifies integration points, no implementation yet.

---

## NPC Type Breakdown

### Person NPCs (Room-Bound, Lazy-Loaded)

**Definition Location**: `rooms[roomId].npcs[]`

**Properties**:
- `id`: unique identifier
- `npcType`: "person"
- `displayName`: UI label
- `position`: { x, y } (grid coords) or { px, py } (pixel coords)
- `spriteSheet`: sprite asset name
- `spriteConfig`: { idleFrameStart, idleFrameEnd }
- `storyPath`: path to Ink story JSON
- `currentKnot`: starting Ink knot

**Lifecycle**:
1. Room becomes active
2. `loadNPCsForRoom()` called
3. Ink story fetched/cached
4. NPC registered with npcManager
5. Sprite created in game world
6. Event listeners activated
7. Timed messages start
8. **On room leave**: sprites destroyed, listeners removed

**Example**:
```json
{
  "id": "desk_clerk",
  "npcType": "person",
  "displayName": "Desk Clerk",
  "position": { "x": 5, "y": 3 },
  "spriteSheet": "hacker",
  "storyPath": "scenarios/ink/clerk.json",
  "currentKnot": "start"
}
```

### Phone NPCs (Global, Up-Front Loaded)

**Definition Location**: `npcs[]` (root level, not room-specific)

**Properties**:
- `id`: unique identifier
- `npcType`: "phone"
- `displayName`: UI label
- `phoneId`: which phone device this NPC appears on
- `storyPath`: path to Ink story JSON
- `currentKnot`: starting Ink knot
- `avatar`: optional avatar image
- `timedMessages`: optional array of timed messages
- `eventMappings`: optional event → knot mappings

**Lifecycle**:
1. Game initializes
2. `game.js create()` registers all phone NPCs
3. Phone UI makes available immediately
4. NPC remains active for entire game session
5. Timed messages fire based on game start time
6. Event listeners active from start

**Example**:
```json
{
  "id": "neye_eve",
  "npcType": "phone",
  "displayName": "Neye Eve",
  "phoneId": "player_phone",
  "storyPath": "scenarios/ink/neye-eve.json",
  "currentKnot": "start",
  "timedMessages": [
    { "delay": 5000, "message": "Hey!" }
  ]
}
```

### Hybrid NPCs (Person + Phone)

**Future Support**: Allow one NPC to have both sprite and phone presence.

```json
{
  "id": "alice",
  "npcType": "both",
  "displayName": "Alice",
  "position": { "x": 5, "y": 3 },
  "spriteSheet": "hacker",
  "phoneId": "player_phone",
  "storyPath": "scenarios/ink/alice.json"
}
```

---

## File Structure Changes

### New Files

```
js/systems/npc-lazy-loader.js          ← NEW: Lazy-load coordinator
planning_notes/npc/prepare_for_server_client/  ← NEW: Planning docs
  01-lazy_load_plan.md                          ← THIS FILE
  02-scenario_migration_guide.md                ← TODO: Step-by-step
  03-server_api_specification.md                ← TODO: API details
  04-testing_checklist.md                       ← TODO: QA plan
```

### Modified Files (Phase 1 - Non-Breaking)

```
js/main.js                             ← Add lazy loader initialization
js/core/rooms.js                       ← Hook lazy loader into loadRoom()
js/systems/npc-manager.js              ← Add unregisterNPC() method
js/core/game.js                        ← Small refactor of NPC registration
```

### Updated Scenarios (Phase 2)

```
scenarios/npc-sprite-test2.json        ← Migrate to new format
scenarios/ceo_exfil.json               ← Migrate to new format
scenarios/biometric_breach.json        ← Migrate to new format
scenarios/cybok_heist.json             ← Migrate to new format
```

---

## Memory & Performance Implications

### Before Lazy-Loading

| Scenario | Size | Load Time | Memory |
|----------|------|-----------|--------|
| Small (5 NPCs) | 50KB | 50ms | ~5MB |
| Medium (20 NPCs) | 200KB | 200ms | ~15MB |
| Large (100 NPCs) | 1MB | 1s | ~50MB |

**Issue**: All NPCs loaded upfront, even if only 5% explored.

### After Lazy-Loading

| Scenario | Initial | Per-Room | Cumulative |
|----------|---------|----------|------------|
| Small (5 NPCs) | 5KB (phone NPCs) | 5KB per room | 50KB total |
| Medium (20 NPCs) | 50KB (phone NPCs) | 8KB per room | 200KB total |
| Large (100 NPCs) | 100KB (phone NPCs) | 10KB per room | ~500KB (if all explored) |

**Benefits**:
- ✅ 95% reduction in initial load time (small scenarios)
- ✅ Constant memory per room (only loaded NPCs in memory)
- ✅ Dynamic asset loading (sprite sheets only when needed)
- ✅ Server-ready for streaming scenarios

---

## Migration Timeline

### Week 1-2: Phase 1 (Infrastructure)
- [ ] Create `npc-lazy-loader.js`
- [ ] Initialize in `main.js`
- [ ] Hook into room loading
- [ ] Add `unregisterNPC()` to NPCManager
- [ ] Write unit tests for lazy loader
- [ ] Verify backward compatibility

### Week 3: Phase 2 (Scenarios)
- [ ] Update scenario schema documentation
- [ ] Migrate `npc-sprite-test2.json`
- [ ] Migrate `ceo_exfil.json`
- [ ] Create migration script (Python/Node)
- [ ] Test all migrated scenarios
- [ ] Update copilot-instructions.md

### Week 4: Phase 3 (Lifecycle)
- [ ] Refactor event registration timing
- [ ] Test timed messages in lazy context
- [ ] Update event mapping documentation
- [ ] Create lifecycle diagrams

### Week 5+: Phase 4 (Server Integration)
- [ ] API specification finalized
- [ ] Mock server endpoints created
- [ ] Integration tests written
- [ ] Server fetching logic implemented

---

## Testing Strategy

### Unit Tests

```javascript
// test/npc-lazy-loader.test.js

describe('NPCLazyLoader', () => {
  test('loads NPCs for room when room.npcs defined', async () => {
    const loader = new NPCLazyLoader(mockManager, mockDispatcher);
    const roomData = {
      npcs: [{ id: 'npc1', npcType: 'person' }]
    };
    
    const result = await loader.loadNPCsForRoom('room1', roomData);
    expect(result.length).toBe(1);
    expect(mockManager.registerNPC).toHaveBeenCalled();
  });

  test('unloads NPCs when room unloads', () => {
    const loader = new NPCLazyLoader(mockManager, mockDispatcher);
    loader.loadedRooms.add('room1');
    
    loader.unloadNPCsForRoom('room1');
    expect(mockManager.unregisterNPC).toHaveBeenCalled();
  });

  test('caches Ink stories', async () => {
    const loader = new NPCLazyLoader(mockManager, mockDispatcher);
    const story1 = await loader._loadInkStory('path/story.json');
    const story2 = await loader._loadInkStory('path/story.json');
    
    expect(story1).toBe(story2); // Same object reference
  });
});
```

### Integration Tests

```javascript
// test/npc-room-integration.test.js

describe('NPC Room Integration', () => {
  test('person NPCs appear in room after load', async () => {
    // Load room with person NPCs
    // Verify sprites created
    // Verify listeners active
  });

  test('phone NPCs available before any room load', async () => {
    // Phone NPCs registered at init
    // Verify available in phone UI
    // Verify timed messages fire
  });

  test('NPCs unload when leaving room', async () => {
    // Load room
    // Verify NPCs in room
    // Leave room
    // Verify sprites destroyed
    // Verify listeners cleaned up
  });
});
```

### Manual Testing Checklist

```
Phase 1 (Infrastructure):
  [ ] Backward compatibility: Old scenarios still work
  [ ] New lazy loader initializes without errors
  [ ] No performance regression
  [ ] NPC sprites appear correctly in rooms

Phase 2 (Scenario Migration):
  [ ] Migrated scenarios load correctly
  [ ] NPCs appear in correct rooms
  [ ] Phone NPCs still available at start
  [ ] Both old and new scenario formats supported

Phase 3 (Lifecycle):
  [ ] Timed messages fire at correct times
  [ ] Event mappings trigger after room load
  [ ] Ink story continuation works

Phase 4 (Server):
  [ ] Mock server API integration works
  [ ] Dynamic asset loading functions
  [ ] Partial scenario loading possible
```

---

## Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| Breaking existing scenarios | High | Keep backward compatibility mode through Phase 3 |
| Timed message timing issues | Medium | Comprehensive testing of game start time tracking |
| Memory leaks in unload | High | Unit test cleanup in `unregisterNPC()` |
| Ink story fetch failures | Medium | Implement retry logic + fallback paths |
| Missing sprite sheets | High | Preload/validate assets before NPC creation |
| Server API compatibility | Medium | Mock server endpoints for testing early |

---

## Key Decision Points

### Decision 1: Global Phone NPCs vs. Room-Scoped

**Decision**: Phone NPCs remain global (registered at game start).

**Reasoning**:
- Phone is always available to player
- Timed messages make more sense from game start
- Simpler initial implementation
- Can be revisited for Phase 4+ if needed

**Alternative**: Phone NPCs could be per-room, loaded when room entered. This would be more consistent but adds complexity.

### Decision 2: NPC Data at Root vs. In Rooms

**Decision**: Person NPCs in `rooms[roomId].npcs`, phone NPCs in root `npcs`.

**Reasoning**:
- Aligns with server-side room API design
- Person NPCs are room-specific, phone NPCs are not
- Clearer mental model for content designers
- Easier to parallelize future features

**Alternative**: All NPCs at root with `roomId` field. Simpler for existing code but less server-friendly.

### Decision 3: Eager vs. Lazy Sprite Creation

**Decision**: Sprites created when room loaded, destroyed when leaving.

**Reasoning**:
- Sprites are expensive (physics, collision, animation)
- Only needed when room is active
- Players don't see NPCs in unloaded rooms anyway
- Aligns with room memory model

**Alternative**: Keep sprites in memory, just hide. Would be faster room transitions but worse memory.

### Decision 4: Ink Story Caching Strategy

**Decision**: Cache Ink story JSON in memory, reuse if same room visited twice.

**Reasoning**:
- Ink stories are usually <50KB
- Network fetches are slower than memory reads
- Player might revisit rooms
- Cache can be cleared for memory pressure

**Alternative**: Always re-fetch stories. Simpler but potentially slower.

---

## Future Enhancements (Post-Phase 4)

### Enhancement 1: NPC State Persistence

Save NPC conversation state to localStorage/server:

```javascript
// Save on game session end
const npcStates = window.npcManager.getSavedNPCs();
fetch('/api/game/save', { 
  method: 'POST',
  body: JSON.stringify({ npcStates })
});

// Load on game session start
const savedStates = await fetch('/api/game/load').then(r => r.json());
window.npcManager.restoreAllNPCStates(savedStates);
```

### Enhancement 2: Dynamic NPC Population

Server-side NPC spawning based on player progress:

```
Player completes objective
  ↓
Server triggers "objective_completed" event
  ↓
Server adds new NPC to room definition
  ↓
On next room entry, new NPC appears
```

### Enhancement 3: NPC Despawning

Remove NPC when quest complete:

```javascript
// In event mapping:
{
  "eventPattern": "quest_completed:steal_files",
  "action": "despawn_npc",
  "npcId": "guard_npc"
}
```

### Enhancement 4: Multi-Room NPCs

NPCs that move between rooms:

```json
{
  "id": "roaming_guard",
  "npcType": "person",
  "rooms": ["reception", "office1", "office2"],
  "position": { "office1": { "x": 5, "y": 3 } }
}
```

---

## Conclusion

This lazy-loading architecture transforms Break Escape from a monolithic, up-front-loaded game into a scalable, server-ready platform. The phased approach minimizes disruption while building toward a truly dynamic, network-efficient game engine.

**Next Steps**:
1. Review and approve this plan
2. Begin Phase 1 implementation
3. Create `02-scenario_migration_guide.md`
4. Set up testing framework
5. Start Phase 1 code implementation

---

## Appendices

### A. Glossary

- **Lazy-Loading**: Deferring resource loading until needed
- **Room-Bound**: NPC is specific to one room (person type)
- **Global NPC**: NPC available everywhere (phone type)
- **Ink Story**: Narrative branching engine used for NPC dialogues
- **Event Mapping**: Rules for NPC reactions to game events
- **Timed Messages**: Messages sent at fixed delays from game start

### B. Related Documentation

- `js/core/rooms.js` - Room system and depth layering
- `js/systems/npc-manager.js` - NPC registration and lifecycle
- `js/systems/npc-events.js` - Event dispatcher
- `scenarios/ceo_exfil.json` - Example scenario (current format)
- `planning_notes/npc/` - Other NPC-related planning docs

### C. References to Code Locations

| Component | File | Lines |
|-----------|------|-------|
| NPC Registration | `js/systems/npc-manager.js` | 1-100 |
| Room Loading | `js/core/rooms.js` | 1850-1900 |
| NPC Sprites | `js/systems/npc-sprites.js` | 1-100 |
| Game Initialization | `js/core/game.js` | 440-500 |
| NPC Events | `js/systems/npc-events.js` | 1-50 |
