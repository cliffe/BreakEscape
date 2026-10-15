# NPC Lazy-Loading: AI Development Guide
## Actionable Implementation Prompt for Direct Execution

**Date**: November 6, 2025  
**Purpose**: Clear, testable TODO items for AI-driven development  
**Status**: Ready to implement immediately  
**Scope**: Clean separation (client logic + server validation), room-defined NPCs, lazy-loading  

---

## Context & Rationale

### Problem We're Solving
1. **Config Cheating**: Currently, all scenario config is loaded to client (exploitable)
2. **NPC Architecture**: NPCs defined at root level, not scoped to rooms
3. **Pre-loading**: Too much data loaded upfront, can be inspected by players

### Solution We're Implementing
1. **Lazy-Load NPCs**: Load only when room enters (prevents config inspection)
2. **Room-Define NPCs**: All NPCs belong to a room (including phone NPCs)
3. **Server Validation**: Important gates validated server-side (room access, unlocks)
4. **Clean Separation**: Client has gameplay logic, server has security logic

### Architecture Principle
```
CLIENT SIDE                          SERVER SIDE
─────────────────────────────────────────────────────────
✅ Dialogue rendering               ✅ Room unlock validation
✅ NPC sprite animation             ✅ Door access validation
✅ Event trigger logic              ✅ Item state tracking
✅ UI/UX gameplay                   ✅ Objective completion
❌ Hiding config from player        ✅ Config security
❌ Room access checks               ✅ Cheat prevention
```

---

## Development Phases

### Phase 0: Setup & Understanding (1-2 hours)
**Goal**: Understand current code and validate approach

**TODO 0.1**: Examine current NPC loading
- [ ] Read `js/core/game.js` - understand `scenario.npcs` loading (lines 448-468)
- [ ] Read `js/systems/npc-manager.js` - understand NPC registration
- [ ] Read `js/core/rooms.js` - understand `getNPCsForRoom()` and how it filters
- [ ] Verify: Current NPCs filtered by `roomId` field ✅ (confirmed in code review)

**TODO 0.2**: Understand room loading lifecycle
- [ ] Read `js/core/rooms.js` - `loadRoom()` function (lines ~1600+)
- [ ] Identify: Where room objects are created
- [ ] Identify: Where NPC sprites should be created (already in `createNPCSpritesForRoom`)

**TODO 0.3**: Understand Ink story loading
- [ ] Read `js/systems/ink/` - how stories are loaded currently
- [ ] Read `js/minigames/person-chat/person-chat-minigame.js` - how stories are used
- [ ] Confirm: Stories fetched on-demand or preloaded? (Need to verify)

**Validation**: Understanding complete, no code changes yet

---

### Phase 1: Scenario Format Migration (3-4 hours)
**Goal**: Update scenario JSON to define NPCs per room

#### 1.1: Update Scenario JSON Format

**TODO 1.1.1**: Create new schema for room NPCs
- [ ] Update `scenarios/ceo_exfil.json` to move person NPCs from root to `rooms[roomId].npcs`
- [ ] Keep phone NPCs at root level (they're global)
- [ ] Remove `roomId` field from NPCs in `rooms[roomId].npcs` (location implicit)
- [ ] Structure:
  ```json
  {
    "npcs": [
      // Phone NPCs only (global)
      { "id": "helper_npc", "npcType": "phone", ... }
    ],
    "rooms": {
      "reception": {
        "npcs": [
          // Person NPCs for THIS room
          { "id": "clerk", "npcType": "person", "position": {...}, ... }
        ]
      }
    }
  }
  ```

**TODO 1.1.2**: Update all test scenarios
- [ ] `scenarios/npc-sprite-test2.json` - migrate to new format
- [ ] `scenarios/biometric_breach.json` - migrate (if has NPCs)
- [ ] `scenarios/scenario1.json`, `scenario2.json`, etc. - check and migrate if needed

**TODO 1.1.3**: Verify JSON validity
- [ ] All scenario files valid JSON (no syntax errors)
- [ ] No person NPCs remaining at root level
- [ ] All phone NPCs in root `npcs` array
- [ ] Phone NPCs have `phoneId` field

**Validation Method**:
```bash
# Validate JSON
python3 -m json.tool scenarios/*.json > /dev/null

# Check structure
grep -r "\"roomId\"" scenarios/*.json
# Should return: (none for new format, check one old scenario for comparison)
```

---

### Phase 2: Update NPC Manager to Support Room-Based Registration (4-5 hours)
**Goal**: Teach npcManager to lazy-register NPCs per room

#### 2.1: Create NPCLazyLoader (simplified from original plan)

**TODO 2.1.1**: Create `js/systems/npc-lazy-loader.js`

```javascript
// Minimal lazy loader - just coordinates room-based NPC loading
export default class NPCLazyLoader {
  constructor(npcManager, eventDispatcher) {
    this.npcManager = npcManager;
    this.eventDispatcher = eventDispatcher;
    this.loadedRooms = new Set();
  }

  /**
   * Load NPCs for a specific room
   * @param {string} roomId
   * @param {Object} roomData - from scenario.rooms[roomId]
   */
  async loadNPCsForRoom(roomId, roomData) {
    if (this.loadedRooms.has(roomId)) {
      console.log(`ℹ️ NPCs already loaded for room ${roomId}`);
      return;
    }

    if (!roomData?.npcs || roomData.npcs.length === 0) {
      return;
    }

    console.log(`Loading ${roomData.npcs.length} NPCs for room ${roomId}`);

    // Register each NPC for this room
    for (const npcDef of roomData.npcs) {
      // Add roomId to NPC so npcManager knows which room it belongs to
      npcDef.roomId = roomId;
      
      // Load Ink story if needed (fetch if not in cache)
      if (npcDef.storyPath) {
        await this._ensureStoryLoaded(npcDef.storyPath);
      }

      // Register NPC
      this.npcManager.registerNPC(npcDef);
      console.log(`✅ Registered NPC: ${npcDef.id} in room ${roomId}`);
    }

    this.loadedRooms.add(roomId);
  }

  /**
   * Unload NPCs when leaving a room
   * @param {string} roomId
   */
  unloadNPCsForRoom(roomId) {
    if (!this.loadedRooms.has(roomId)) return;

    // Find and unregister all NPCs for this room
    const npcsToRemove = Array.from(this.npcManager.npcs.values())
      .filter(npc => npc.roomId === roomId);

    npcsToRemove.forEach(npc => {
      this.npcManager.unregisterNPC(npc.id);
      console.log(`🗑️ Unloaded NPC: ${npc.id} from room ${roomId}`);
    });

    this.loadedRooms.delete(roomId);
  }

  /**
   * Ensure Ink story is loaded (with basic caching)
   * @private
   */
  async _ensureStoryLoaded(storyPath) {
    // Check if already cached in Phaser
    if (window.game?.cache?.json?.has?.(storyPath)) {
      return; // Already loaded
    }

    try {
      const response = await fetch(storyPath);
      const story = await response.json();
      
      // Store in cache for reuse
      if (window.game?.cache?.json) {
        window.game.cache.json.add(storyPath, story);
      }
      
      console.log(`📖 Loaded Ink story: ${storyPath}`);
    } catch (error) {
      console.error(`❌ Failed to load Ink story: ${storyPath}`, error);
    }
  }
}
```

- [ ] File created at `js/systems/npc-lazy-loader.js`
- [ ] Includes: loadNPCsForRoom, unloadNPCsForRoom, _ensureStoryLoaded
- [ ] Basic error handling for story fetch failures
- [ ] Logging at each step

**Validation**: File compiles without syntax errors
```bash
node -c js/systems/npc-lazy-loader.js
```

#### 2.1.2: Add `unregisterNPC()` to NPCManager

**TODO 2.1.2**: Update `js/systems/npc-manager.js`

Find the NPCManager class and add this method:

```javascript
unregisterNPC(npcId) {
  if (!this.npcs.has(npcId)) {
    console.warn(`⚠️ NPC ${npcId} not found for unregistration`);
    return;
  }

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

  // Remove from registry
  this.npcs.delete(npcId);

  console.log(`✅ Unregistered NPC: ${npcId}`);
}
```

- [ ] Method added to NPCManager class
- [ ] Cleans up event listeners
- [ ] Clears conversation history
- [ ] Logs unregistration

**Validation**: No compilation errors, method callable

---

### Phase 3: Wire Up Lazy Loading into Room Loading (4-5 hours)
**Goal**: Call lazy-loader when room loads, call unload when leaving

#### 3.1: Initialize Lazy Loader in main.js

**TODO 3.1.1**: Update `js/main.js`

In `initializeGame()`, after NPC systems are initialized:

```javascript
// Import lazy loader
import NPCLazyLoader from './systems/npc-lazy-loader.js?v=1';

// In initializeGame(), after creating npcManager:
window.npcLazyLoader = new NPCLazyLoader(
  window.npcManager,
  window.eventDispatcher
);
console.log('✅ NPC lazy loader initialized');
```

- [ ] Import statement added
- [ ] Lazy loader instantiated after npcManager
- [ ] Stored in window for global access
- [ ] Logging shows initialization

**Validation**: Game loads without errors related to lazy loader

#### 3.1.2: Hook Into Room Loading

**TODO 3.1.2**: Update `js/core/rooms.js` - `loadRoom()` function

Find the `loadRoom()` function and add NPC loading after room creation:

```javascript
export async function loadRoom(roomId) {
    // ... existing room setup code ...
    
    // NEW: Load NPCs for this room (after room objects created)
    if (window.npcLazyLoader && rooms[roomId]) {
      try {
        await window.npcLazyLoader.loadNPCsForRoom(roomId, rooms[roomId]);
      } catch (error) {
        console.error(`❌ Failed to load NPCs for room ${roomId}:`, error);
      }
    }
    
    // Continue with rest of room loading...
}
```

- [ ] Lazy loader called after room data available
- [ ] Try-catch for error handling
- [ ] Logging for debugging

**Validation**: Room loads without NPC-related errors

#### 3.1.3: Update Room NPC Sprite Creation

**TODO 3.1.3**: Update `js/core/rooms.js` - `createNPCSpritesForRoom()` function

This function already exists and filters by roomId. Verify it works with new format:

```javascript
function createNPCSpritesForRoom(roomId, roomData) {
    if (!window.npcManager) return;
    if (!gameRef) return;
    
    // Get NPCs from npcManager that belong to this room
    const npcsInRoom = Array.from(window.npcManager.npcs.values())
      .filter(npc => npc.roomId === roomId);
    
    if (npcsInRoom.length === 0) return;
    
    console.log(`Creating ${npcsInRoom.length} NPC sprites for room ${roomId}`);
    
    // Initialize NPC sprites array if needed
    if (!roomData.npcSprites) {
      roomData.npcSprites = [];
    }
    
    // Create sprite for each person-type NPC
    npcsInRoom.forEach(npc => {
      if (npc.npcType === 'person' || npc.npcType === 'both') {
        const sprite = NPCSpriteManager.createNPCSprite(gameRef, npc, roomData);
        if (sprite) {
          roomData.npcSprites.push(sprite);
          console.log(`✅ Created sprite for NPC: ${npc.id}`);
        }
      }
    });
}
```

- [ ] Function verified to filter by roomId correctly
- [ ] Works with new NPC format (NPCs already registered via lazy loader)
- [ ] No changes needed (existing code already compatible)

**Validation**: NPCs appear as sprites in rooms

#### 3.1.4: Handle Room Unloading (Optional)

**TODO 3.1.4**: Check if room unloading exists

- [ ] Search for `unloadRoom()` or room cleanup code
- [ ] If exists: Add `window.npcLazyLoader.unloadNPCsForRoom(roomId)` call
- [ ] If not: Document that NPCs persist (acceptable for current design)

**Validation**: No errors when changing rooms multiple times

---

### Phase 4: Phone NPCs in Rooms (2-3 hours)
**Goal**: Support phone NPCs defined in rooms (will load when room loads)

#### 4.1: Update Game Init to Support Phone NPCs in Rooms

**TODO 4.1.1**: Update `js/core/game.js` - modify NPC registration logic

Current code registers all NPCs at startup. Need to:
1. Register root-level phone NPCs (global)
2. Defer room-level phone NPCs until room loads

```javascript
// In game.js create():

// Register ONLY root-level phone NPCs at startup
if (gameScenario.npcs && window.npcManager) {
  console.log('📱 Loading root-level NPCs from scenario');
  gameScenario.npcs
    .filter(npc => npc.npcType === 'phone' || !npc.npcType)
    .forEach(npc => {
      npc.isGlobal = true;
      window.npcManager.registerNPC(npc);
      console.log(`✅ Registered global NPC: ${npc.id}`);
    });
}

// Note: Room-level NPCs (person and phone) will be loaded via lazy-loader
// when their room is entered
```

- [ ] Updated to only register root phone NPCs
- [ ] Added `isGlobal` flag for clarity
- [ ] Comments explain room-level loading happens later

**Validation**: Phone NPCs appear on phone, person NPCs appear in rooms

#### 4.1.2: Ensure Lazy Loader Handles Phone NPCs in Rooms

**TODO 4.1.2**: Verify `npc-lazy-loader.js` handles phone NPCs in rooms

The lazy loader already does this - when a room is loaded, ALL NPCs in `room.npcs` are registered, including phone types.

- [ ] Verify: Phone NPCs in rooms are treated same as person NPCs
- [ ] Confirm: Phone NPCs get `roomId` set like person NPCs
- [ ] Test: Phone NPC defined in room1 appears on phone when room1 loads

**Validation**: Phone NPCs appear on phone UI when their room is entered

---

### Phase 5: Testing & Validation (6-8 hours)
**Goal**: Verify everything works end-to-end

#### 5.1: Unit Tests

**TODO 5.1.1**: Create `test/npc-lazy-loader.test.js`

```javascript
describe('NPCLazyLoader', () => {
  test('loads NPCs from room.npcs array', async () => {
    const mockManager = { 
      npcs: new Map(), 
      registerNPC: jest.fn(),
      unregisterNPC: jest.fn()
    };
    const loader = new NPCLazyLoader(mockManager, {});
    const roomData = {
      npcs: [{ id: 'npc1', npcType: 'person' }]
    };
    
    await loader.loadNPCsForRoom('room1', roomData);
    
    expect(mockManager.registerNPC).toHaveBeenCalled();
    expect(loader.loadedRooms.has('room1')).toBe(true);
  });

  test('unloads NPCs from room', () => {
    // ... test unload logic
  });

  test('skips if room already loaded', async () => {
    // ... test idempotency
  });
});
```

- [ ] Test file created
- [ ] At least 3 test cases
- [ ] Run with: `npm test npc-lazy-loader.test.js`

**TODO 5.1.2**: Test NPCManager.unregisterNPC()

```javascript
describe('NPCManager.unregisterNPC', () => {
  test('removes NPC from registry', () => {
    // Verify NPC removed from this.npcs map
  });

  test('cleans up event listeners', () => {
    // Verify eventDispatcher.off() called
  });

  test('warns if NPC not found', () => {
    // Verify console.warn() called
  });
});
```

- [ ] Test file created (or added to existing npc-manager.test.js)
- [ ] At least 3 test cases
- [ ] Run with: `npm test npc-manager.test.js`

**Validation**: `npm test` passes with >90% coverage for new code

#### 5.2: Integration Tests

**TODO 5.2.1**: Test full room + NPC loading cycle

```javascript
describe('Room Loading with NPCs', () => {
  test('NPCs appear in room after loadRoom()', async () => {
    // 1. Load scenario
    // 2. Load room with person NPCs
    // 3. Verify NPCs registered
    // 4. Verify sprites created
  });

  test('NPCs unload when leaving room', async () => {
    // 1. Load room1 with NPCs
    // 2. Verify NPCs registered
    // 3. Unload room1
    // 4. Verify NPCs unregistered
  });

  test('Phone NPCs available in room', async () => {
    // 1. Load room with phone NPC in room.npcs
    // 2. Verify NPC appears on phone UI
  });
});
```

- [ ] Integration tests created in `test/integration/npc-rooms.test.js`
- [ ] Test actual game flow (not mocked)
- [ ] Run with: `npm test:integration`

**Validation**: Integration tests pass

#### 5.3: Manual Testing on Real Scenarios

**TODO 5.3.1**: Test ceo_exfil.json

- [ ] Load scenario in game
- [ ] Verify game starts (phone NPCs available)
- [ ] Navigate to reception
- [ ] Verify person NPCs appear (if any exist in room)
- [ ] Open phone
- [ ] Verify phone NPCs available
- [ ] Navigate to another room
- [ ] Verify NPCs update correctly
- [ ] Check console: no errors related to NPCs

**Checklist**:
- [ ] Game loads without errors
- [ ] Phone NPCs appear on phone at startup
- [ ] Person NPCs appear in rooms
- [ ] No "NPC not found" errors
- [ ] No undefined sprite sheets
- [ ] Dialogue works with NPCs
- [ ] Moving between rooms works

**TODO 5.3.2**: Test npc-sprite-test2.json

- [ ] Load scenario
- [ ] Verify both NPCs appear in test_room
- [ ] Verify correct sprite sheets loaded
- [ ] Verify positions are correct

**TODO 5.3.3**: Test backward compatibility

- [ ] Load old-format scenario (if you keep one)
- [ ] Verify it still works (backward compat mode)
- [ ] Or verify migration instructions work

**Validation**: Manual testing checklist all passed

#### 5.4: Browser Console Inspection

**TODO 5.4.1**: Run game and check for clean output

```javascript
// Expected console output when loading room:
✅ NPC lazy loader initialized
✅ Registered global NPC: helper_npc
Loading 1 NPCs for room reception
✅ Registered NPC: desk_clerk in room reception
✅ Created sprite for NPC: desk_clerk
```

- [ ] No undefined errors
- [ ] No "not found" warnings
- [ ] Clear progression of log messages

**Validation**: Console output is clean and expected

---

### Phase 6: Documentation & Cleanup (2-3 hours)
**Goal**: Document changes for future developers

#### 6.1: Update Copilot Instructions

**TODO 6.1.1**: Update `js/core/copilot-instructions.md`

Add section on new NPC architecture:

```markdown
## NPC System (Lazy-Loading)

### New Architecture
- Phone NPCs defined at root level `npcs[]` in scenario JSON
- Person NPCs defined in room level `rooms[roomId].npcs[]`
- NPCs loaded when their room is entered (lazy-loading)
- Server validates important gates (room access, item unlocks)

### File Locations
- `js/systems/npc-lazy-loader.js` - Coordinates room-based NPC loading
- `js/systems/npc-manager.js` - NPC registration and lifecycle
- `js/core/rooms.js` - Room loading integration

### Adding a New NPC
1. Define in scenario JSON: `rooms[roomId].npcs[]`
2. Include: id, displayName, npcType, storyPath, currentKnot
3. For person NPCs: add position, spriteSheet, spriteConfig
4. NPC auto-loaded when room loads ✅
```

- [ ] Section added to copilot-instructions.md
- [ ] Examples included
- [ ] Links to relevant files

#### 6.1.2: Create README for NPCs

**TODO 6.1.2**: Create `js/systems/NPC_ARCHITECTURE.md`

```markdown
# NPC Architecture Guide

## Overview
NPCs are now lazily-loaded per room to avoid exposing config to client.

## Scenario JSON Format

### Phone NPCs (Global)
```json
{
  "npcs": [
    {
      "id": "helper_npc",
      "npcType": "phone",
      "displayName": "Helper",
      "phoneId": "player_phone",
      "storyPath": "scenarios/ink/helper.json",
      "currentKnot": "start"
    }
  ]
}
```

### Room NPCs (Person/Phone)
```json
{
  "rooms": {
    "reception": {
      "npcs": [
        {
          "id": "clerk",
          "npcType": "person",
          "displayName": "Desk Clerk",
          "position": { "x": 5, "y": 3 },
          "spriteSheet": "hacker-red",
          "storyPath": "scenarios/ink/clerk.json",
          "currentKnot": "start"
        }
      ]
    }
  }
}
```

## Loading Lifecycle

1. Game starts → Root `npcs[]` registered (phone NPCs)
2. Player enters room → `npcLazyLoader.loadNPCsForRoom()` called
3. Room NPCs loaded from `rooms[roomId].npcs`
4. Sprites created for person/both types
5. Player leaves room → NPCs unloaded via `unloadNPCsForRoom()`

## Security Considerations

- Client-side: Dialogue, animations, event logic
- Server-side: Room access validation, item unlocks, objectives
- Do NOT trust client config for locks, access, or rewards
```

- [ ] File created
- [ ] Clear examples provided
- [ ] Loading lifecycle documented

#### 6.1.3: Update main README

**TODO 6.1.3**: Update root `README.md` or create `ARCHITECTURE.md`

Add note about NPC architecture changes.

**Validation**: Documentation updated and clear

---

## Testing Checklist (Before Declaring Success)

```
FUNCTIONALITY
- [ ] Phone NPCs appear on phone when game starts
- [ ] Person NPCs appear in rooms when room loads
- [ ] NPCs disappear when leaving room
- [ ] Dialogue works with lazily-loaded NPCs
- [ ] Event mappings still work (items, objectives, etc.)
- [ ] Timed messages fire correctly
- [ ] Multiple room transitions work without errors

NO REGRESSIONS
- [ ] Existing scenarios still playable
- [ ] Old NPC format still works (if supported)
- [ ] Phone UI works with new NPC format
- [ ] Ink story loading works
- [ ] Sprite animations work

SECURITY
- [ ] Person NPC config not loaded until room accessed
- [ ] Phone NPC config loaded only at game start
- [ ] No full scenario JSON exposed to client initially
- [ ] Important locks/access validated server-side (future)

PERFORMANCE
- [ ] Game startup noticeably faster (small scenarios)
- [ ] Room transitions smooth
- [ ] No memory leaks (check dev tools)
- [ ] No console errors

CODE QUALITY
- [ ] Unit tests pass (>90% coverage)
- [ ] Integration tests pass
- [ ] No linting errors (if using linter)
- [ ] Code documented with comments
```

---

## Quick Reference: Commands

```bash
# Start dev server
python3 -m http.server

# Run tests
npm test                          # All tests
npm test npc-lazy-loader.test.js  # Specific file
npm test:integration              # Integration tests

# Validation
node -c js/systems/npc-lazy-loader.js  # Syntax check
python3 -m json.tool scenarios/*.json > /dev/null  # JSON validity

# Debugging
# Open browser console (F12)
# Look for logs starting with ✅, ℹ️, ❌
# Search for "NPC" to see all NPC-related logs
```

---

## Phase-by-Phase Time Estimates

| Phase | Tasks | Est. Time | Status |
|-------|-------|-----------|--------|
| 0 | Setup & understanding | 1-2 hrs | Ready |
| 1 | Scenario JSON migration | 3-4 hrs | Ready |
| 2 | NPCLazyLoader creation | 4-5 hrs | Ready |
| 3 | Wire up room loading | 4-5 hrs | Ready |
| 4 | Phone NPCs in rooms | 2-3 hrs | Ready |
| 5 | Testing & validation | 6-8 hrs | Ready |
| 6 | Documentation | 2-3 hrs | Ready |
| **TOTAL** | **All phases** | **~22-30 hrs** | **Ready to implement** |

---

## Success Criteria

**This project is successful when:**

1. ✅ NPCs load on demand (when room enters)
2. ✅ Phone NPCs available at game start (defined at root)
3. ✅ Person NPCs defined in rooms (not global config)
4. ✅ All test scenarios work with new format
5. ✅ Unit tests pass (>90% coverage)
6. ✅ Integration tests pass
7. ✅ Manual testing passes all scenarios
8. ✅ Documentation updated
9. ✅ No regressions in existing gameplay
10. ✅ Architecture clean & maintainable for future server work

---

## Next Steps

1. ✅ **Review this document** - understand the approach
2. ⏭️ **Start Phase 0** - examine current code
3. ⏭️ **Phase 1** - update scenario JSON
4. ⏭️ **Phase 2** - implement lazy loader
5. ⏭️ **Phase 3** - wire into room loading
6. ⏭️ **Phase 4** - support phone NPCs in rooms
7. ⏭️ **Phase 5** - comprehensive testing
8. ⏭️ **Phase 6** - documentation
9. ✅ **Done!** - Clean, lazy-loading NPC architecture ready

---

## Questions & Clarifications

**Q: What about old scenarios with root-level person NPCs?**
A: Lazy loader checks `rooms[roomId].npcs` first, falls back to root filtering. Backward compatible.

**Q: Do we need a server for this?**
A: Not yet. Phase focuses on client-side lazy-loading. Server validation is future work.

**Q: What about phone NPCs that should be available everywhere?**
A: Keep them at root level in `npcs[]`. They're loaded at game start and globally available.

**Q: What about phone NPCs specific to one room?**
A: Define in `rooms[roomId].npcs[]`. Will load when room enters and stay available on phone.

**Q: When do we implement server validation?**
A: After this phase is complete. Foundation will be in place for easy server integration.

---

**Status**: ✅ Ready for implementation  
**Next Action**: Begin Phase 0 - Code review
