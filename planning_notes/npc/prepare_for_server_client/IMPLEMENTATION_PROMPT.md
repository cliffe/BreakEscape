# NPC Per-Room Loading: Implementation Prompt

**Goal**: Restructure scenario files so NPCs are defined per room and loaded when that room loads, keeping existing code mostly untouched.

**Version**: 1.1 (Improved with better error handling, search patterns, and comprehensive scenario coverage)

---

## Key Architectural Decisions

1. **In-memory caching only** - No persistent storage between sessions. Stories fetch once per session and cache in memory.
2. **NPCs stay loaded** - Once registered, NPCs remain in memory (no unloading). Simpler implementation.
3. **Graceful degradation** - Room creation continues even if NPC loading fails.
4. **Future-proof async** - Making `loadRoom()` async prepares for server-based loading with minimal changes.
5. **Search patterns over line numbers** - Instructions use code search patterns instead of fragile line numbers.

---

## What We're Changing

### Scenario JSON Format
**BEFORE**: All NPCs at root level with `roomId` field
```json
{
  "npcs": [
    { "id": "clerk", "npcType": "person", "roomId": "reception", ... },
    { "id": "helper", "npcType": "phone", "roomId": null, ... }
  ],
  "rooms": { "reception": { ... } }
}
```

**AFTER**: ALL NPCs defined per room (person and phone)
```json
{
  // No npcs key at root - all NPCs now in rooms
  "rooms": {
    "reception": {
      "npcs": [
        { "id": "clerk", "npcType": "person", ... },
        { "id": "helper", "npcType": "phone", "phoneId": "player_phone", ... }
      ],
      ...
    }
  }
}
```

**Special case**: Phone NPCs on phones in starting inventory are loaded with the starting room.

### Code Changes
1. **Create** `js/systems/npc-lazy-loader.js` - loads NPCs when room enters
2. **Update** `js/main.js` - initialize lazy loader
3. **Update** `js/core/game.js` - remove root NPC registration AND load starting room NPCs
4. **Update** `js/core/rooms.js` - make `loadRoom()` async and load NPCs for lazy-loaded rooms
5. **Update** `js/systems/doors.js` - update call site to handle async `loadRoom()`

**Critical**: 
- Room NPCs must load BEFORE room visuals are created
- Starting room NPCs load in `game.js` BEFORE `processInitialInventoryItems()` is called
- `loadRoom()` becomes async (future-proofs for server-based loading)

**Note**: NPCs stay loaded once registered (no unloading needed - simpler implementation).

---

## Quick Todo Checklist

Use this checklist to track implementation progress:

- [ ] **Step 1**: Move NPCs from root `npcs[]` to room `npcs[]` in all scenario files
  - [ ] `scenarios/ceo_exfil.json` (has NPCs)
  - [ ] `scenarios/npc-sprite-test2.json` (has NPCs)
  - [ ] `scenarios/biometric_breach.json` (check if has NPCs)
  - [ ] `scenarios/cybok_heist.json` (check if has NPCs)
  - [ ] `scenarios/timed_messages_example.json` (check if has NPCs)
  - [ ] `scenarios/scenario1.json` (check if has NPCs)
  - [ ] `scenarios/scenario2.json` (check if has NPCs)
  - [ ] `scenarios/scenario3.json` (check if has NPCs)
  - [ ] `scenarios/scenario4.json` (check if has NPCs)
  - [ ] Validate JSON: `python3 -m json.tool scenarios/*.json > /dev/null`

- [ ] **Step 2**: Create `js/systems/npc-lazy-loader.js` (copy code from Step 2)

- [ ] **Step 3**: Update `js/main.js`
  - [ ] Add import: `import NPCLazyLoader from './systems/npc-lazy-loader.js?v=1';`
  - [ ] Initialize: `window.npcLazyLoader = new NPCLazyLoader(window.npcManager);`

- [ ] **Step 4**: Update `js/core/game.js`
  - [ ] Part A: Delete root NPC registration block (search for `if (gameScenario.npcs && window.npcManager)`)
  - [ ] Part B: Make `create()` function async AND add NPC loading for starting room (search for `export function create()` and `createRoom(gameScenario.startRoom`)

- [ ] **Step 5**: Update room loading
  - [ ] Part A: Make `loadRoom()` async in `js/core/rooms.js` (search for `function loadRoom(roomId)`)
  - [ ] Part B: Update call site in `js/systems/doors.js` (search for `window.loadRoom`)

- [ ] **Test**: Run game and verify all test scenarios work

**⚠️ IMPORTANT**: Do not test between Steps 4 and 5 - the game will be temporarily broken. Complete all steps before testing!

---

## Step-by-Step Implementation

### Step 1: Update Scenario Files (20-40 min)

Move ALL NPCs (person and phone) from root `npcs[]` to their room's `npcs[]` array.

**Files to check**: All 9 scenario files in `scenarios/` directory
- `scenarios/ceo_exfil.json` (has NPCs - confirmed)
- `scenarios/npc-sprite-test2.json` (has NPCs - confirmed)
- `scenarios/biometric_breach.json`
- `scenarios/cybok_heist.json`
- `scenarios/timed_messages_example.json`
- `scenarios/scenario1.json`
- `scenarios/scenario2.json`
- `scenarios/scenario3.json`
- `scenarios/scenario4.json`

**Note**: Rooms without NPCs should **omit the `npcs` key entirely** (don't add empty arrays). The code uses optional chaining and will handle missing keys gracefully.

**Example transformation**:
```json
// OLD: scenarios/ceo_exfil.json (lines 1-96)
{
  "startRoom": "reception",
  "npcs": [
    { "id": "neye_eve", "npcType": "phone", "phoneId": "player_phone", ... },
    { "id": "gossip_girl", "npcType": "phone", "phoneId": "player_phone", ... },
    { "id": "helper_npc", "npcType": "phone", "phoneId": "player_phone", ... }
  ],
  "startItemsInInventory": [
    { "type": "phone", "name": "Your Phone" }
  ],
  "rooms": {
    "reception": { /* no npcs array yet */ }
  }
}

// NEW: scenarios/ceo_exfil.json  
{
  "startRoom": "reception",
  // npcs key removed entirely - no longer needed
  "startItemsInInventory": [
    { "type": "phone", "name": "Your Phone" }
  ],
  "rooms": {
    "reception": {
      "npcs": [
        // Move ALL three phone NPCs here (remove roomId if present)
        { "id": "neye_eve", "npcType": "phone", "phoneId": "player_phone", ... },
        { "id": "gossip_girl", "npcType": "phone", "phoneId": "player_phone", ... },
        { "id": "helper_npc", "npcType": "phone", "phoneId": "player_phone", ... }
      ],
      /* rest of room data */
    }
  }
}
```

**Key points**:
1. **ALL 3 phone NPCs** move to `reception` because that's the `startRoom`
2. They go in `reception` because the phone is in `startItemsInInventory` (player starts with it)
3. Remove the `roomId` field from each NPC (no longer needed)
4. **Delete the root `npcs` key entirely** - no need for an empty array

**Note**: The code in Step 4 Part A checks `if (gameScenario.npcs && window.npcManager)` - if the key doesn't exist, the condition safely evaluates to false and nothing happens.

**Phone NPC rules**:
- If phone is an object in the starting room → define phone NPC in that room
- If phone is in `startItemsInInventory` → define phone NPC in the **starting room** (player starts there)
  - Example: `ceo_exfil.json` has `startRoom: "reception"` and phone in starting inventory → put all phone NPCs in `rooms.reception.npcs[]`

**Validation after changes**:

1. **JSON syntax**: `python3 -m json.tool scenarios/*.json > /dev/null`
2. **No root NPCs**: `grep -l '"npcs":\s*\[' scenarios/*.json` (should find nothing at root level)
3. **Room NPCs present**: Check files that previously had NPCs have them in room definitions

**Quick verification script**:
```bash
# Check no root-level npcs arrays remain
for f in scenarios/*.json; do
  if python3 -c "import json; d=json.load(open('$f')); exit(1 if 'npcs' in d else 0)"; then
    echo "✅ $f - No root npcs"
  else
    echo "❌ $f - Still has root npcs array!"
  fi
done
```

---

### Step 2: Create NPCLazyLoader (20-30 min)

Create `js/systems/npc-lazy-loader.js`:

```javascript
/**
 * NPCLazyLoader - Loads NPCs per-room on demand
 * Future-proofed for server-based NPC loading
 * Uses in-memory caching only (no persistent storage between sessions)
 */
export default class NPCLazyLoader {
  constructor(npcManager) {
    this.npcManager = npcManager;
    this.loadedRooms = new Set();
    this.storyCache = new Map(); // In-memory cache for current session only
  }

  /**
   * Load all NPCs for a specific room
   * @param {string} roomId - Room identifier
   * @param {object} roomData - Room data containing npcs array
   * @returns {Promise<void>}
   */
  async loadNPCsForRoom(roomId, roomData) {
    // Skip if already loaded or no NPCs
    if (this.loadedRooms.has(roomId) || !roomData?.npcs?.length) {
      return;
    }
    
    console.log(`📦 Loading ${roomData.npcs.length} NPCs for room ${roomId}`);
    
    // Load all Ink stories in parallel (optimization)
    const storyPromises = roomData.npcs
      .filter(npc => npc.storyPath && !this.storyCache.has(npc.storyPath))
      .map(npc => this._loadStory(npc.storyPath));
    
    if (storyPromises.length > 0) {
      console.log(`📖 Loading ${storyPromises.length} Ink stories for room ${roomId}`);
      await Promise.all(storyPromises);
    }
    
    // Register NPCs (synchronous now that stories are cached)
    for (const npcDef of roomData.npcs) {
      npcDef.roomId = roomId;  // Add roomId for compatibility
      
      // registerNPC accepts either registerNPC(id, opts) or registerNPC({ id, ...opts })
      // We use the second form - passing the full object
      this.npcManager.registerNPC(npcDef);
      console.log(`✅ Registered NPC: ${npcDef.id} (${npcDef.npcType}) in room ${roomId}`);
    }
    
    this.loadedRooms.add(roomId);
  }

  /**
   * Load an Ink story file from server (or local file in dev)
   * Caches in memory for current session only
   * @private
   */
  async _loadStory(storyPath) {
    try {
      const response = await fetch(storyPath);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const story = await response.json();
      
      // Store in memory for this session only
      this.storyCache.set(storyPath, story);
      console.log(`✅ Loaded story: ${storyPath}`);
    } catch (error) {
      console.error(`❌ Failed to load story: ${storyPath}`, error);
      throw error; // Re-throw to allow caller to handle
    }
  }

  /**
   * Get cached story (used by NPCManager if needed)
   * @param {string} storyPath - Path to story file
   * @returns {object|null} Story JSON or null if not cached
   */
  getCachedStory(storyPath) {
    return this.storyCache.get(storyPath) || null;
  }
}
```

**Key features**:
- ✅ In-memory caching only (no persistence between sessions)
- ✅ Parallel story loading for better performance
- ✅ Better error handling with re-throw
- ✅ Detailed console logging for debugging (standardized emoji prefixes)
- ✅ Future-ready for server API (just change `_loadStory` implementation)
- ✅ NPCManager can access cached stories via `getCachedStory()` to avoid duplicate fetches

**Note about caching**: 
- NPCLazyLoader caches stories when preloading for a room
- NPCManager has its own story cache for lazy-loading stories when first accessed
- Both use in-memory Maps - no conflict, just optimization
- If NPCLazyLoader already fetched a story, NPCManager won't need to fetch it again (they can share via `getCachedStory()` if needed)
- All caches clear on page reload (session-only)

**Note about NPC lifecycle**: NPCs stay loaded once their room is entered. No unloading needed - keeps implementation simple.

---

### Step 3: Initialize Lazy Loader (5 min)

In `js/main.js`, add import at top and initialize after npcManager:

**Location**: After line 17 (after NPCBarkSystem import), add:
```javascript
import NPCLazyLoader from './systems/npc-lazy-loader.js?v=1';
```

**Location**: Around line 81-84 in `initializeGame()`, after `window.npcManager` is created:
```javascript
// After: window.npcManager = new NPCManager(window.eventDispatcher, window.barkSystem);
window.npcLazyLoader = new NPCLazyLoader(window.npcManager);
console.log('✅ NPC lazy loader initialized');
```

---

### Step 4: Update Game Initialization (15 min)

**Part A: Remove root NPC registration**

In `js/core/game.js`, **search for** `if (gameScenario.npcs && window.npcManager)` and **DELETE** the entire block:

```javascript
// OLD CODE - DELETE THIS ENTIRE BLOCK:
if (gameScenario.npcs && window.npcManager) {
    console.log('📱 Loading NPCs from scenario:', gameScenario.npcs.length);
    gameScenario.npcs.forEach(npc => {
        console.log(`📝 NPC from scenario - id: ${npc.id}, spriteTalk: ${npc.spriteTalk}, spriteSheet: ${npc.spriteSheet}`);
        console.log(`📝 Full NPC object:`, npc);
        window.npcManager.registerNPC(npc);
        console.log(`✅ Registered NPC: ${npc.id} (${npc.displayName})`);
    });
}
```

**Why**: Root-level NPCs are being replaced by per-room NPC definitions.

**Part B: Make create() async and load starting room NPCs**

**FIRST**: In `js/core/game.js`, **search for** `export function create()` and make it async:

**Change from:**
```javascript
export function create() {
```

**Change to:**
```javascript
export async function create() {
```

**THEN**: In `js/core/game.js`, **search for** `createRoom(gameScenario.startRoom` (the starting room creation code) and add NPC loading BEFORE it:

**BEFORE:**
```javascript
// Create only the starting room initially
const roomPositions = calculateRoomPositions(this);
const startingRoomData = gameScenario.rooms[gameScenario.startRoom];
const startingRoomPosition = roomPositions[gameScenario.startRoom];

if (startingRoomData && startingRoomPosition) {
    createRoom(gameScenario.startRoom, startingRoomData, startingRoomPosition);
    revealRoom(gameScenario.startRoom);
} else {
    console.error('Failed to create starting room');
}
```

**AFTER:**
```javascript
// Create only the starting room initially
const roomPositions = calculateRoomPositions(this);
const startingRoomData = gameScenario.rooms[gameScenario.startRoom];
const startingRoomPosition = roomPositions[gameScenario.startRoom];

if (startingRoomData && startingRoomPosition) {
    // Load NPCs for starting room BEFORE creating room visuals
    // This ensures phone NPCs are registered before processInitialInventoryItems() is called
    if (window.npcLazyLoader && startingRoomData) {
        try {
            await window.npcLazyLoader.loadNPCsForRoom(
                gameScenario.startRoom, 
                startingRoomData
            );
            console.log(`✅ Loaded NPCs for starting room: ${gameScenario.startRoom}`);
        } catch (error) {
            console.error(`Failed to load NPCs for starting room ${gameScenario.startRoom}:`, error);
            // Continue with room creation even if NPC loading fails
        }
    }
    
    createRoom(gameScenario.startRoom, startingRoomData, startingRoomPosition);
    revealRoom(gameScenario.startRoom);
} else {
    console.error('Failed to create starting room');
}
```

**Why this placement?**
- Making `create()` async is safe - Phaser 3 supports async lifecycle methods
- NPCs load BEFORE `processInitialInventoryItems()` is called (which happens later in the lifecycle at line ~671)
- Phone NPCs are registered before phones in starting inventory are processed

**⚠️ Important**: After completing Step 4, the game will break temporarily because:
- Root NPCs are removed (Part A)
- Starting room NPCs are loaded (Part B/C)
- BUT lazy-loaded rooms won't have NPCs yet (Step 5 not done)
- **You must complete Step 5 before testing!**

---

### Step 5: Update Room Loading System (15 min)

**Part A: Make loadRoom() async in js/core/rooms.js**

In `js/core/rooms.js`, **search for** `function loadRoom(roomId)` and update it:

**BEFORE:**
```javascript
function loadRoom(roomId) {
    const gameScenario = window.gameScenario;
    const roomData = gameScenario.rooms[roomId];
    const position = window.roomPositions[roomId];
    
    if (!roomData || !position) {
        console.error(`Cannot load room ${roomId}: missing data or position`);
        return;
    }
    
    console.log(`Lazy loading room: ${roomId}`);
    createRoom(roomId, roomData, position);
    
    // Reveal (make visible) but do NOT mark as discovered
    // The room will only be marked as "discovered" when the player
    // actually enters it via door transition
    revealRoom(roomId);
}
```

**AFTER:**
```javascript
async function loadRoom(roomId) {
    const gameScenario = window.gameScenario;
    const roomData = gameScenario.rooms[roomId];
    const position = window.roomPositions[roomId];
    
    if (!roomData || !position) {
        console.error(`Cannot load room ${roomId}: missing data or position`);
        return;
    }
    
    console.log(`Lazy loading room: ${roomId}`);
    
    // Load NPCs BEFORE creating room visuals
    // This ensures NPCs are registered before room objects/sprites are created
    if (window.npcLazyLoader && roomData) {
        try {
            await window.npcLazyLoader.loadNPCsForRoom(roomId, roomData);
        } catch (error) {
            console.error(`Failed to load NPCs for room ${roomId}:`, error);
            // Continue with room creation even if NPC loading fails
        }
    }
    
    createRoom(roomId, roomData, position);
    
    // Reveal (make visible) but do NOT mark as discovered
    // The room will only be marked as "discovered" when the player
    // actually enters it via door transition
    revealRoom(roomId);
}
```

**Important**: 
1. Change `function loadRoom` to `async function loadRoom`
2. The function is already exported via `window.loadRoom = loadRoom;` later in the file, so no export changes needed
3. Just ensure the function signature becomes async
4. Add try-catch around NPC loading but continue with room creation even if it fails

**Part B: Update call site in js/systems/doors.js**

In `js/systems/doors.js`, **search for** `window.loadRoom` and update the call:

**BEFORE:**
```javascript
if (window.loadRoom) {
    window.loadRoom(props.connectedRoom);
}
```

**AFTER:**
```javascript
if (window.loadRoom) {
    // loadRoom is now async - fire and forget for door transitions
    window.loadRoom(props.connectedRoom).catch(err => {
        console.error(`Failed to load room ${props.connectedRoom}:`, err);
    });
}
```

**Why async?**
- Future-proofs for server-based room/NPC loading
- Allows proper await of async NPC story loading
- Minimal breaking changes (only one call site to update)
- When adding server API later, no caller changes needed

**Note**: The existing `createNPCSpritesForRoom()` function already filters by `roomId`, so it will automatically work with the new format.

---

## Testing Checklist

After implementation, verify:

- [ ] Game loads without errors
- [ ] Phone NPCs appear on phone when entering their room
- [ ] Phone NPCs on phones in starting inventory appear immediately (starting room loads first)
- [ ] Person NPCs appear when entering their room
- [ ] NPCs have correct sprites and positions
- [ ] NPC dialogue works (Ink stories load)
- [ ] Timed barks fire correctly (NPCs registered before barks scheduled)
- [ ] Moving between rooms works
- [ ] Console shows "Loading X NPCs for room Y" messages
- [ ] No "NPC not found" errors

**Test scenarios**:
1. `ceo_exfil.json` - full scenario test with phone contacts
2. `npc-sprite-test2.json` - sprite rendering test

**Specific tests**:
- Phone in starting inventory → Contact should appear on phone immediately
- Phone object in room → Contact should appear when room entered
- Timed bark from phone NPC → Should fire after NPC loaded

**Manual test**:
```bash
python3 -m http.server
# Open: http://localhost:8000/scenario_select.html
# Select scenario and play through
```

---

## Expected Console Output

```
✅ NPC lazy loader initialized
Loading 2 NPCs for room reception
✅ Registered NPC: desk_clerk in room reception
✅ Registered NPC: helper_npc in room reception
✅ Created sprite for NPC: desk_clerk
(Starting inventory added - phone appears with helper_npc already registered)
```

**Order matters**:
1. Game initialization begins
2. Lazy loader initialized (`js/main.js`)
3. Starting room NPCs loaded (`js/core/game.js` - before room creation)
4. Starting room created (`createRoom()`)
5. Starting inventory processed (`processInitialInventoryItems()`) → Phone appears with contacts ready
6. Timed barks start (`window.npcManager.startTimedMessages()`) → NPCs already registered

---

## Error Handling Strategy

The implementation includes graceful error handling:

1. **NPC loading failures**: Room creation continues even if NPC loading fails - players can still explore
2. **Story loading failures**: Errors are logged but don't break the game - NPC will appear but dialogue may not work
3. **Console logging**: All operations emit standardized console messages:
   - 📦 for loading operations
   - ✅ for successful operations
   - ❌ for errors
   - 📖 for Ink story operations

**Best practice**: Always check browser console if something seems wrong. The emoji prefixes make it easy to scan for issues.

---

## Rollback Strategy

If you need to rollback mid-implementation:

1. **After Step 1** (scenario files): Just restore scenario JSON files from git
2. **After Steps 2-3** (lazy loader created): No rollback needed, nothing is using it yet
3. **After Step 4** (game.js updated): Game will be broken - restore `js/core/game.js` from git
4. **After Step 5** (complete): Use `git restore` on all modified files

**⚠️ CRITICAL**: Do not commit or test between Steps 4 and 5 - the game will be temporarily broken!

---

## Troubleshooting

**"NPC not found"**: Check scenario JSON has ALL NPCs in room `npcs[]` arrays (not at root)

**"Contact not appearing on phone in starting inventory"**: Verify phone NPC is defined in starting room (where player spawns)

**"Timed bark fires but NPC not found"**: Ensure NPCs load BEFORE timed message system initializes (check `loadRoom()` order)

**"Sprite sheet not found"**: Verify person NPC has `spriteSheet` and `spriteConfig` fields

**"Story failed to load"**: Check `storyPath` is correct and file exists. Check browser console for ❌ error messages.

**NPCs don't appear**: Check console for errors, verify `loadRoom()` calls lazy loader early in function

**Phone contacts missing**: Check that phone NPC is in the same room as the phone object, or in starting room if phone in `startItemsInInventory`

**Async/await errors**: Ensure `create()` and `loadRoom()` are both marked as `async` functions

---

## Files Modified Summary

**Created**:
- `js/systems/npc-lazy-loader.js` (~80 lines)

**Modified JS files**:
- `js/main.js` (add import, initialize lazy loader)
- `js/core/game.js` (make create() async, remove root NPC registration, load starting room NPCs)
- `js/core/rooms.js` (make loadRoom() async, add NPC loading with error handling)
- `js/systems/doors.js` (update loadRoom() call to handle async)

**Modified scenario files** (check all 9):
- `scenarios/ceo_exfil.json` (move 3 phone NPCs from root to reception.npcs)
- `scenarios/npc-sprite-test2.json` (move NPCs from root to room.npcs)
- `scenarios/biometric_breach.json` (check/update if has NPCs)
- `scenarios/cybok_heist.json` (check/update if has NPCs)
- `scenarios/timed_messages_example.json` (check/update if has NPCs)
- `scenarios/scenario1.json` (check/update if has NPCs)
- `scenarios/scenario2.json` (check/update if has NPCs)
- `scenarios/scenario3.json` (check/update if has NPCs)
- `scenarios/scenario4.json` (check/update if has NPCs)

---

## Success Criteria

✅ Implementation is complete when:
1. All scenario files restructured (ALL NPCs in rooms, root `npcs[]` removed)
2. NPCs load when room enters (lazy-loading works for person AND phone NPCs)
3. Phone NPCs on phones in starting inventory appear immediately
4. Timed barks fire correctly (after NPCs registered)
5. Game plays normally with no regressions
6. Console output is clean with standardized emoji prefixes (📦 ✅ ❌ 📖)
7. All test scenarios work (especially ceo_exfil and npc-sprite-test2)
8. No persistent caching between sessions (only in-memory caching during gameplay)

**Total Time**: ~2.5-3 hours for complete implementation (including checking all 9 scenario files)

**Key Success Indicators**: 
- Phone contacts appear on phones in starting inventory without errors
- Timed messages work correctly
- Console shows "📦 Loading X NPCs for room Y" messages in correct order
- No ❌ errors in console during normal gameplay

---

## Future Server Migration Path

Making `loadRoom()` async now prepares for server-based loading. Future changes will be minimal:

```javascript
// Future: js/systems/npc-lazy-loader.js
async _loadStory(storyPath) {
  // Change fetch URL to server endpoint
  const response = await fetch(`/api/stories/${encodeURIComponent(storyPath)}`);
  // Rest stays the same
}

// Future: js/core/rooms.js  
async function loadRoom(roomId) {
  // Add server fetch for room data
  const response = await fetch(`/api/rooms/${roomId}`);
  const roomData = await response.json();
  
  // Rest of function stays the same
  if (window.npcLazyLoader && roomData) {
    await window.npcLazyLoader.loadNPCsForRoom(roomId, roomData);
  }
  // ... etc
}
```

**No caller changes needed** - `doors.js` already handles async properly.

---

---

## Pre-Implementation Checklist

Before starting, verify your environment:

- [ ] Working directory: `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/`
- [ ] Git status is clean (or current changes are committed/stashed)
- [ ] Python 3 available for JSON validation
- [ ] Local dev server available (`python3 -m http.server` or similar)
- [ ] Browser with console open for testing
- [ ] All 9 scenario files present in `scenarios/` directory
- [ ] Existing NPCs working in current build (baseline for regression testing)

**Ready to start?** Follow steps sequentially: 1 → 2 → 3 → 4 → 5 → Test

**⚠️ Remember**: Do not test between Steps 4 and 5 - complete both before testing!

---

## Improvements in Version 1.1

This version addresses several issues and improvements:

1. ✅ **Fixed caching** - Removed Phaser cache dependency (`.has()` bug), now uses in-memory Map only
2. ✅ **Comprehensive scenario coverage** - Updated checklist to include all 9 scenario files, not just 3
3. ✅ **Search patterns over line numbers** - More maintainable instructions that won't break when code changes
4. ✅ **Better error handling** - Added rollback strategy and error handling guidance
5. ✅ **Standardized console output** - Consistent emoji prefixes for easier debugging
6. ✅ **Clarified empty arrays** - Explicitly stated to omit `npcs` key if room has no NPCs
7. ✅ **Validation tools** - Added bash script to verify no root-level NPCs remain
8. ✅ **Improved time estimates** - Updated to 2.5-3 hours (more realistic)
9. ✅ **Architecture documentation** - Added key architectural decisions section
10. ✅ **Pre-implementation checklist** - Ensure environment is ready before starting

**Result**: A more robust, maintainable implementation with better error handling and clearer instructions.
