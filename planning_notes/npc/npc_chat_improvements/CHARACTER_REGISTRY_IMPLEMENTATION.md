# Global Character Registry Implementation

## Overview
Implemented a global character registry system that maintains all available characters (player + NPCs) for the game, enabling reliable speaker resolution in multi-character conversations.

## Architecture

### Character Registry System (`js/systems/character-registry.js`)
Global object `window.characterRegistry` with methods:
- **setPlayer(playerData)** - Register player at game initialization
- **registerNPC(npcId, npcData)** - Register NPC when npcManager registers it
- **getCharacter(characterId)** - Get specific character by ID
- **getAllCharacters()** - Get complete dictionary of all characters
- **hasCharacter(characterId)** - Check if character exists
- **clearNPCs()** - Clear all NPCs (for scenario transitions)
- **debug()** - Log registry state

### Data Flow

1. **Initialization Phase** (game.js):
   ```
   createPlayer() 
   → window.player = player
   → characterRegistry.setPlayer(playerData)
   ```

2. **NPC Registration Phase** (npc-manager.js):
   ```
   npcManager.registerNPC(id, opts)
   → this.npcs.set(id, entry)
   → characterRegistry.registerNPC(id, entry)  ← NEW
   ```

3. **Person-Chat Minigame Phase** (person-chat-minigame.js):
   ```
   buildCharacterIndex()
   → if window.characterRegistry exists
   → return characterRegistry.getAllCharacters()
   → Otherwise fallback to legacy local building
   ```

## Key Features

✅ **Automatic Population**: NPCs automatically added when registered via npcManager
✅ **Global Access**: Available to any minigame or system that needs speaker resolution
✅ **Early Availability**: Player and room NPCs available before person-chat minigame starts
✅ **Backward Compatible**: Falls back to legacy local character index building if registry unavailable
✅ **Clean Separation**: Registry only knows about character data, not minigame logic

## Files Modified

1. **NEW: `js/systems/character-registry.js`**
   - 100+ lines of character registry implementation
   - Self-documenting with comprehensive JSDoc comments

2. **`js/main.js`**
   - Added import: `import './systems/character-registry.js';`
   - Ensures registry available before any scripts that need it

3. **`js/core/game.js`**
   - After `window.player = player`, added:
   ```javascript
   if (window.characterRegistry && window.player) {
       const playerData = { id, displayName, spriteSheet, ... };
       window.characterRegistry.setPlayer(playerData);
   }
   ```

4. **`js/systems/npc-manager.js`**
   - In `registerNPC()` method, after `this.npcs.set(realId, entry)`:
   ```javascript
   if (window.characterRegistry) {
       window.characterRegistry.registerNPC(realId, entry);
   }
   ```

5. **`js/minigames/person-chat/person-chat-minigame.js`**
   - Simplified `buildCharacterIndex()` to:
   ```javascript
   if (window.characterRegistry) {
       return characterRegistry.getAllCharacters();
   }
   // Fallback to legacy local building...
   ```

## Test Verification

To verify the system is working:

1. **Check Console Logs**:
   ```
   ✅ Character Registry system initialized
   ✅ Character Registry: Added player (Agent 0x00)
   ✅ Character Registry: Added NPC test_npc_front (displayName: Helper NPC)
   ✅ Character Registry: Added NPC test_npc_back (displayName: Back NPC)
   ```

2. **Check Character Resolution**:
   ```
   👥 Using global character registry with 3 characters: ['player', 'test_npc_front', 'test_npc_back']
   ```

3. **Check Speaker Display**:
   - When `test_npc_back: "Welcome..."` appears in dialogue
   - Should resolve to "Back NPC" (from registry displayName)
   - Not show raw ID "test_npc_back"

## Browser Console Debug

Available in browser console:
```javascript
window.characterRegistry.debug()
// Output:
// 📋 Character Registry: {
//     playerCount: 1,
//     npcCount: 5,
//     totalCharacters: 6,
//     characters: ['player', 'test_npc_front', 'test_npc_back', ...]
// }

window.characterRegistry.getCharacter('test_npc_back')
// Returns: { id, displayName: 'Back NPC', spriteSheet, ... }
```

## Benefits

1. **No More Missing Secondary NPCs**: All room NPCs automatically available before minigame starts
2. **Consistent Speaker Resolution**: Single source of truth for all characters
3. **Extensible**: Easy to add more features (character filtering, abilities, etc.)
4. **Debuggable**: Clear logging and debug methods for troubleshooting
5. **Maintainable**: Centralized character management separate from minigame logic

## Next Steps

1. Reload game with hard refresh to clear cache
2. Test line-prefix speaker format with secondary NPCs
3. Verify both `test_npc_front` and `test_npc_back` display correct names
4. Check console for character registry logs
