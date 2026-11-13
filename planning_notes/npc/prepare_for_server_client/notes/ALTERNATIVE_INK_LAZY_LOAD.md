# Alternative: Lazy-Load Ink Stories Only

**Goal**: Keep scenarios unchanged (NPCs defined at root), but lazy-load Ink dialogue scripts only when rooms are revealed. Server controls access to Ink files based on room progression.

---

## Strategy Comparison

| Aspect | Full NPC Lazy-Load | **Ink-Only Lazy-Load** |
|--------|-------------------|---------------------|
| Scenario format | Change (NPCs per room) | **No change** |
| NPC metadata visible | Hidden until room entered | **Visible upfront** |
| Dialogue content | Hidden until room entered | **Hidden until room entered** |
| Implementation complexity | Medium | **Low** |
| Server-side control | NPCs + Ink | **Ink files only** |
| Security benefit | High (full config hidden) | **Medium (dialogue hidden)** |

---

## What We're Changing

### Scenario JSON Format
**NO CHANGES** - Keep existing format:
```json
{
  "npcs": [
    { "id": "clerk", "npcType": "person", "roomId": "reception", "storyPath": "scenarios/ink/clerk.json", ... },
    { "id": "helper", "npcType": "phone", "storyPath": "scenarios/ink/helper.json", ... }
  ],
  "rooms": { "reception": { ... } }
}
```

### What Players Can See
- ✅ NPC metadata (id, name, type, roomId)
- ❌ Dialogue content (Ink stories not loaded until room revealed)

### Code Changes (Minimal)
1. **Create** `js/systems/ink-lazy-loader.js` - loads Ink stories on-demand
2. **Update** `js/core/rooms.js` - preload Ink for room's NPCs when room loads
3. **Update** `js/minigames/person-chat/person-chat-minigame.js` - use lazy loader
4. **Update** `js/systems/ink/ink-manager.js` - integrate lazy loading (if exists)

**Server-side** (future): Control access to `scenarios/ink/*.json` files based on revealed rooms.

---

## Step-by-Step Implementation

### Step 1: Create InkLazyLoader (20-30 min)

Create `js/systems/ink-lazy-loader.js`:

```javascript
export default class InkLazyLoader {
  constructor() {
    this.loadedStories = new Map(); // storyPath -> story data
    this.loadingPromises = new Map(); // storyPath -> Promise (prevent duplicate loads)
    this.revealedRooms = new Set(); // Track which rooms have been revealed
  }

  /**
   * Mark a room as revealed (allows loading its Ink stories)
   * @param {string} roomId
   */
  revealRoom(roomId) {
    this.revealedRooms.add(roomId);
    console.log(`✅ Room revealed: ${roomId}`);
  }

  /**
   * Check if a room has been revealed
   * @param {string} roomId
   * @returns {boolean}
   */
  isRoomRevealed(roomId) {
    return this.revealedRooms.has(roomId);
  }

  /**
   * Preload Ink stories for all NPCs in a room
   * @param {string} roomId
   * @param {Array} npcs - NPCs to preload stories for
   */
  async preloadStoriesForRoom(roomId, npcs) {
    if (!npcs || npcs.length === 0) return;

    console.log(`Preloading Ink stories for room ${roomId}`);
    
    const storyPromises = npcs
      .filter(npc => npc.storyPath)
      .map(npc => this.loadStory(npc.storyPath, roomId));

    await Promise.all(storyPromises);
    console.log(`✅ Preloaded ${storyPromises.length} Ink stories for room ${roomId}`);
  }

  /**
   * Load an Ink story (with caching and room check)
   * @param {string} storyPath
   * @param {string} requiredRoomId - Room that must be revealed to access this story
   * @returns {Promise<Object>} Story data
   */
  async loadStory(storyPath, requiredRoomId = null) {
    // Check if already loaded (cache hit)
    if (this.loadedStories.has(storyPath)) {
      console.log(`📖 Ink story cached: ${storyPath}`);
      return this.loadedStories.get(storyPath);
    }

    // Check if already loading (prevent duplicate fetches)
    if (this.loadingPromises.has(storyPath)) {
      console.log(`⏳ Ink story already loading: ${storyPath}`);
      return this.loadingPromises.get(storyPath);
    }

    // Server-side check (future): Verify room revealed before allowing load
    if (requiredRoomId && !this.isRoomRevealed(requiredRoomId)) {
      console.warn(`⚠️ Attempted to load story for unrevealed room: ${requiredRoomId}`);
      // In production: throw error or call server to verify
      // For now: proceed (client-side only implementation)
    }

    // Start loading
    const loadPromise = this._fetchStory(storyPath);
    this.loadingPromises.set(storyPath, loadPromise);

    try {
      const story = await loadPromise;
      this.loadedStories.set(storyPath, story);
      this.loadingPromises.delete(storyPath);
      console.log(`✅ Loaded Ink story: ${storyPath}`);
      return story;
    } catch (error) {
      this.loadingPromises.delete(storyPath);
      console.error(`❌ Failed to load Ink story: ${storyPath}`, error);
      throw error;
    }
  }

  /**
   * Fetch story from server (or cache if available in Phaser)
   * @private
   */
  async _fetchStory(storyPath) {
    // Check Phaser cache first
    if (window.game?.cache?.json?.has?.(storyPath)) {
      return window.game.cache.json.get(storyPath);
    }

    // Fetch from server
    // Future: Add authentication headers for server-side verification
    const response = await fetch(storyPath, {
      headers: {
        // 'X-Revealed-Rooms': JSON.stringify([...this.revealedRooms])
        // Server can verify this room was revealed before serving Ink file
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const story = await response.json();

    // Cache in Phaser if available
    if (window.game?.cache?.json) {
      window.game.cache.json.add(storyPath, story);
    }

    return story;
  }

  /**
   * Get cached story (if loaded)
   * @param {string} storyPath
   * @returns {Object|null}
   */
  getCachedStory(storyPath) {
    return this.loadedStories.get(storyPath) || null;
  }

  /**
   * Clear all loaded stories (for testing/memory management)
   */
  clearCache() {
    this.loadedStories.clear();
    this.loadingPromises.clear();
    console.log('🗑️ Cleared Ink story cache');
  }
}
```

---

### Step 2: Initialize Ink Lazy Loader (5 min)

In `js/main.js`, after other systems are initialized:

```javascript
import InkLazyLoader from './systems/ink-lazy-loader.js?v=1';

// In initializeGame():
window.inkLazyLoader = new InkLazyLoader();
console.log('✅ Ink lazy loader initialized');
```

---

### Step 3: Preload Ink Stories on Room Load (10 min)

In `js/core/rooms.js`, update the `loadRoom()` function:

```javascript
export async function loadRoom(roomId) {
  // ... existing room setup code ...
  
  // NEW: Reveal room and preload its Ink stories
  if (window.inkLazyLoader) {
    window.inkLazyLoader.revealRoom(roomId);
    
    // Get NPCs for this room
    const roomNPCs = window.gameScenario?.npcs?.filter(npc => npc.roomId === roomId) || [];
    
    // Preload Ink stories in background (non-blocking)
    window.inkLazyLoader.preloadStoriesForRoom(roomId, roomNPCs).catch(error => {
      console.error(`Failed to preload Ink stories for room ${roomId}:`, error);
    });
  }
  
  // ... rest of existing code ...
}
```

**Note**: Preloading happens in background, so room loads immediately while stories fetch.

---

### Step 4: Update Person Chat to Use Lazy Loader (15-20 min)

In `js/minigames/person-chat/person-chat-minigame.js`, find where Ink stories are loaded and update:

```javascript
// OLD CODE (example):
async loadStory(npc) {
  const response = await fetch(npc.storyPath);
  const story = await response.json();
  return story;
}

// NEW CODE:
async loadStory(npc) {
  // Use lazy loader instead of direct fetch
  if (window.inkLazyLoader) {
    return await window.inkLazyLoader.loadStory(npc.storyPath, npc.roomId);
  }
  
  // Fallback to direct fetch (if lazy loader not available)
  const response = await fetch(npc.storyPath);
  return await response.json();
}
```

**Search and replace** all direct Ink story fetches with lazy loader calls.

---

### Step 5: Update Phone Chat (if separate) (10 min)

If phone chat loads Ink stories separately, apply same pattern:

In `js/minigames/phone-chat/phone-chat-minigame.js` (or relevant file):

```javascript
// Replace direct fetch with:
if (window.inkLazyLoader) {
  story = await window.inkLazyLoader.loadStory(npc.storyPath, npc.roomId);
} else {
  // Fallback
  const response = await fetch(npc.storyPath);
  story = await response.json();
}
```

---

### Step 6: Mark Starting Room as Revealed (5 min)

In `js/core/game.js`, after scenario loads but before starting room loads:

```javascript
// In create() method, after loading scenario:
if (window.inkLazyLoader && gameScenario.startRoom) {
  window.inkLazyLoader.revealRoom(gameScenario.startRoom);
  console.log(`✅ Starting room revealed: ${gameScenario.startRoom}`);
}
```

This ensures NPCs in the starting room have their Ink stories available immediately.

---

## Server-Side Integration (Future)

### Server Controls Access to Ink Files

**Endpoint**: `GET /scenarios/ink/{storyId}.json`

**Server logic**:
```python
@app.route('/scenarios/ink/<story_id>.json')
def get_ink_story(story_id):
    # Get player's revealed rooms from session/database
    revealed_rooms = get_player_revealed_rooms(session['player_id'])
    
    # Get which room this story belongs to
    story_room = get_story_room_mapping(story_id)
    
    # Check if player has revealed this room
    if story_room not in revealed_rooms:
        return jsonify({"error": "Room not yet revealed"}), 403
    
    # Serve the Ink story file
    return send_file(f'scenarios/ink/{story_id}.json')
```

**Client-side**: Add authentication headers to fetch calls (already in `_fetchStory()`).

---

## Testing Checklist

After implementation, verify:

- [ ] Game loads without errors
- [ ] NPCs appear normally (metadata visible)
- [ ] Ink stories load when talking to NPCs
- [ ] Starting room NPCs have stories immediately available
- [ ] Moving to new room triggers Ink preloading
- [ ] Console shows "Preloading Ink stories for room X" messages
- [ ] Cached stories don't reload (check console for "cached" messages)
- [ ] Dialogue works normally in person chat
- [ ] Dialogue works normally in phone chat
- [ ] Timed barks work (if they use Ink stories)

**Test scenarios**:
1. `ceo_exfil.json` - full scenario with multiple rooms
2. `npc-sprite-test2.json` - NPC dialogue test

**Manual test**:
```bash
python3 -m http.server
# Open: http://localhost:8000/scenario_select.html
# Select scenario, talk to NPCs in different rooms
# Check console for Ink loading messages
```

---

## Expected Console Output

```
✅ Ink lazy loader initialized
✅ Starting room revealed: reception
Preloading Ink stories for room reception
✅ Loaded Ink story: scenarios/ink/clerk.json
✅ Preloaded 1 Ink stories for room reception
(Player moves to lobby)
✅ Room revealed: lobby
Preloading Ink stories for room lobby
✅ Loaded Ink story: scenarios/ink/guard.json
✅ Preloaded 1 Ink stories for room lobby
(Player talks to clerk)
📖 Ink story cached: scenarios/ink/clerk.json
```

---

## Troubleshooting

**"Failed to load Ink story"**: Check storyPath is correct and file exists

**"Story already loading"**: Normal, means another component requested same story (deduplication working)

**Dialogue doesn't appear**: Check if room was revealed (`isRoomRevealed()` returns true)

**Stories load multiple times**: Check caching logic, should show "cached" messages on subsequent loads

**Timed barks fail**: Ensure starting room revealed before barks scheduled

---

## Files Modified Summary

**Created**:
- `js/systems/ink-lazy-loader.js`

**Modified**:
- `js/main.js` (initialize lazy loader)
- `js/core/game.js` (reveal starting room)
- `js/core/rooms.js` (preload Ink on room load)
- `js/minigames/person-chat/person-chat-minigame.js` (use lazy loader)
- `js/minigames/phone-chat/phone-chat-minigame.js` (use lazy loader, if applicable)

**NOT Modified**:
- `scenarios/*.json` (no changes needed!)

---

## Advantages of This Approach

✅ **No scenario changes** - Existing content works as-is  
✅ **Simpler implementation** - Only Ink loading changes, not NPC system  
✅ **Gradual migration** - Can add server-side control later  
✅ **Better UX** - NPCs appear immediately, stories load in background  
✅ **Caching built-in** - Stories load once, cached for repeated dialogue  
✅ **Server-ready** - Easy to add server-side verification later  

## Limitations

⚠️ **NPC metadata visible** - Players can see NPC ids, names, roomIds in scenario JSON  
⚠️ **Medium security** - Dialogue hidden but not NPC existence  
⚠️ **Client-side only** - No server verification until Step 6 server integration  

---

## Security Benefits

### What's Hidden
- ❌ Dialogue content (quest hints, puzzle solutions, story)
- ❌ Conversation flows (branching, choices)
- ❌ NPC responses (all Ink content)

### What's Visible
- ✅ NPC names and IDs
- ✅ NPC locations (roomId field)
- ✅ NPC types (person/phone)

**Good for**: Hiding story spoilers, puzzle solutions in dialogue  
**Not good for**: Hiding NPC existence or locations

---

## Success Criteria

✅ Implementation is complete when:
1. Ink stories load on-demand (not at startup)
2. Stories preload when room enters (background loading)
3. Dialogue works normally for all NPC types
4. Caching prevents duplicate loads
5. Console output shows correct loading progression
6. Game plays normally with no regressions
7. All test scenarios work

**Total Time**: ~1-2 hours for complete implementation

---

## When to Use This vs Full NPC Lazy-Load

**Use Ink-Only Lazy-Load when**:
- You want simpler implementation
- NPC metadata being visible is acceptable
- Primary concern is hiding dialogue/story content
- You want to keep existing scenarios unchanged

**Use Full NPC Lazy-Load when**:
- You want maximum security (hide NPC existence)
- You want to prevent config inspection entirely
- You're willing to update all scenarios
- You want complete server-side control

---

**Start with Step 1 (InkLazyLoader), then proceed sequentially through Step 6. Test after Step 5.**
