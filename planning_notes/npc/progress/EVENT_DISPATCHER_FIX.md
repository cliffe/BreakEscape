# Event Dispatcher Variable Name Fix

## Issue
NPC event reactions were not triggering because event emission code was using incorrect global variable names.

## Root Cause
The NPC event dispatcher is initialized in `main.js` as:
```javascript
window.eventDispatcher = new NPCEventDispatcher();
```

However, event emission code was checking for:
- `window.NPCEventDispatcher` (wrong - this is the class, not the instance)
- `window.npcEvents` (wrong - this variable was never created)

## Files Fixed

### 1. `js/minigames/framework/base-minigame.js`
**Changed:** `window.NPCEventDispatcher` → `window.eventDispatcher`
- Events: `minigame_completed`, `minigame_failed`

### 2. `js/systems/unlock-system.js` 
**Changed:** `window.NPCEventDispatcher` → `window.eventDispatcher`
- Events: `door_unlocked`, `door_unlock_attempt`, `item_unlocked`

### 3. `js/systems/interactions.js`
**Changed:** `window.NPCEventDispatcher` → `window.eventDispatcher`
- Events: `object_interacted`

### 4. `js/systems/inventory.js`
**Changed:** `window.npcEvents` → `window.eventDispatcher`
- Events: `item_picked_up:*`

## Result
✅ All event emissions now use `window.eventDispatcher`
✅ NPCs should now receive and react to game events
✅ Debug logging added to verify events are being emitted

## Testing
Refresh the game and try:
1. Pick up an item - should see NPC bark
2. Complete a lockpicking minigame - should see celebration bark
3. Fail a lockpicking attempt - should see encouragement bark
4. Unlock a door - should see progress bark

Look for debug logs:
- `🎮 Checking for eventDispatcher: true`
- `🎮 Emitting minigame_completed event for minigame: ...`
- `🔓 Emitting door_unlocked event: ...`
