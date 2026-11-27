# Global Character Registry - Quick Reference

## What It Does
Maintains a single, global registry of all characters (player + NPCs) that's populated automatically as the game loads. Used by person-chat minigame for reliable speaker resolution in conversations.

## How to Use (Developer)

### Access the Registry
```javascript
// Get all characters
window.characterRegistry.getAllCharacters()
// Returns: { player: {...}, npc_id_1: {...}, npc_id_2: {...} }

// Get specific character
window.characterRegistry.getCharacter('test_npc_back')
// Returns: { id, displayName, spriteSheet, ... }

// Check if character exists
window.characterRegistry.hasCharacter('some_npc')
// Returns: true or false

// Debug current state
window.characterRegistry.debug()
```

### NPCs Added Automatically When:
1. **Game initializes**: Player registered via `game.js`
2. **NPC is registered**: Via `npcManager.registerNPC(id, opts)` in npc-lazy-loader.js
3. **Room loads**: NPCs from scenario json automatically registered by npc-lazy-loader

### How Person-Chat Uses It
```javascript
// In person-chat-minigame.js buildCharacterIndex():
buildCharacterIndex() {
    if (window.characterRegistry) {
        // Use global registry (has all characters already)
        return characterRegistry.getAllCharacters();
    }
    // Fallback to legacy local building if needed
}
```

## Console Debug Commands

```javascript
// See all registered characters
window.characterRegistry.debug()

// Check if specific NPC is registered
window.characterRegistry.hasCharacter('test_npc_back')

// Get NPC display name
window.characterRegistry.getCharacter('test_npc_back').displayName
// Should output: "Back NPC"

// Get all character IDs
Object.keys(window.characterRegistry.getAllCharacters())
// Should output: ['player', 'test_npc_front', 'test_npc_back', ...]

// Clear all NPCs (for scenario transitions)
window.characterRegistry.clearNPCs()
```

## Expected Console Output

When game loads:
```
✅ Character Registry system initialized
✅ Character Registry: Added player (Agent 0x00)
✅ Character Registry: Added NPC test_npc_front (displayName: Helper NPC)
✅ Character Registry: Added NPC test_npc_back (displayName: Back NPC)
```

When person-chat starts:
```
👥 Using global character registry with 3 characters: ['player', 'test_npc_front', 'test_npc_back']
```

## Files Changed

| File | Change |
|------|--------|
| `js/systems/character-registry.js` | NEW: 100+ lines |
| `js/main.js` | Added import of character-registry.js |
| `js/core/game.js` | Register player in registry after initialization |
| `js/systems/npc-manager.js` | Register NPCs in registry when they're registered |
| `js/minigames/person-chat/person-chat-minigame.js` | Use global registry instead of building local index |

## How It Fixes the Bug

**Before**: Secondary NPCs like `test_npc_back` weren't in the character index when person-chat minigame started, so speaker resolution failed.

**After**: 
1. `test_npc_back` registered in npcManager → immediately added to characterRegistry
2. When person-chat minigame starts, it uses characterRegistry
3. `test_npc_back` is already there with displayName "Back NPC"
4. Line-prefix parsing works: `test_npc_back:` → resolves to "Back NPC" ✅

## Scenario Example

Room with 3 NPCs in `scenario.json`:
```json
"test_room": {
    "npcs": [
        { "id": "test_npc_front", "displayName": "Helper NPC", ... },
        { "id": "test_npc_back", "displayName": "Back NPC", ... },
        { "id": "test_npc_influence", "displayName": "Expert", ... }
    ]
}
```

Character Registry after room loads:
```javascript
{
    player: { id: 'player', displayName: 'Agent 0x00', ... },
    test_npc_front: { id: 'test_npc_front', displayName: 'Helper NPC', ... },
    test_npc_back: { id: 'test_npc_back', displayName: 'Back NPC', ... },
    test_npc_influence: { id: 'test_npc_influence', displayName: 'Expert', ... }
}
```

When dialogue line is `test_npc_back: "Welcome..."`:
1. Parser extracts speaker: `test_npc_back`
2. Looks up in characterRegistry: ✅ found
3. Gets displayName: "Back NPC"
4. Shows: "Back NPC: Welcome..."
