# Global Ink Variable Syncing - Implementation Summary

## Overview
Successfully implemented a data-driven global variable system that allows narrative state to be shared across all NPC conversations in a scenario. Variables are stored in `window.gameState.globalVariables` and automatically synced to all loaded Ink stories.

## What Was Changed

### 1. Scenario Configuration (`scenarios/npc-sprite-test2.json`)
**Added:** Global variables section
```json
"globalVariables": {
  "player_joined_organization": false
}
```
- Makes the system data-driven instead of hardcoded
- Easy to extend with more global variables per scenario

### 2. Game Initialization (`js/core/game.js`)
**Added:** Global variable initialization on scenario load (lines 461-467)
```javascript
// Initialize global narrative variables from scenario
if (gameScenario.globalVariables) {
    window.gameState.globalVariables = { ...gameScenario.globalVariables };
    console.log('🌐 Initialized global variables:', window.gameState.globalVariables);
} else {
    window.gameState.globalVariables = {};
}
```

### 3. Global Variable Management (`js/systems/npc-conversation-state.js`)
**Added 9 new methods:**

#### Helper Methods
- `getGlobalVariableNames()` - List all global variables from scenario
- `isGlobalVariable(name)` - Check if variable is global (by declaration or naming convention)
- `discoverGlobalVariables(story)` - Auto-discover `global_*` variables not in scenario

#### Sync Methods
- `syncGlobalVariablesToStory(story)` - Copy variables FROM window.gameState → Ink story
- `syncGlobalVariablesFromStory(story)` - Copy variables FROM Ink story → window.gameState
- `observeGlobalVariableChanges(story, npcId)` - Set up Ink's variableChangedEvent listener
- `broadcastGlobalVariableChange(name, value, sourceNpcId)` - Propagate changes to other stories

#### State Persistence
- Updated `saveNPCState()` to capture global variables snapshot
- Updated `restoreNPCState()` to restore globals before story state

### 4. Story Loading Integration (`js/systems/npc-manager.js`)
**Added:** Global variable sync calls after story load (lines 702-712)
```javascript
// Discover any global_* variables not in scenario JSON
npcConversationStateManager.discoverGlobalVariables(inkEngine.story);

// Sync global variables from window.gameState to story
npcConversationStateManager.syncGlobalVariablesToStory(inkEngine.story);

// Observe changes to sync back to window.gameState
npcConversationStateManager.observeGlobalVariableChanges(inkEngine.story, npcId);
```

### 5. Ink File Updates

#### `scenarios/ink/test2.ink`
- Added `VAR player_joined_organization = false`
- Updated `player_closing` knot to offer join choice:
  - Choice 1: Join organization → sets variable to true
  - Choice 2: Think about it → leaves variable false

#### `scenarios/ink/equipment-officer.ink`
- Added `VAR player_joined_organization = false` (synced from test2.ink)
- Conditional menu option that only shows full inventory if player joined:
  ```ink
  {player_joined_organization:
    + [Show me what you have available]
      -> show_inventory
  }
  ```

### 6. Compiled Ink Files
Both source `.ink` files compiled to `.json` using Inklecate:
- `scenarios/compiled/test2.json` ✅
- `scenarios/compiled/equipment-officer.json` ✅

### 7. Documentation
**Created:** `docs/GLOBAL_VARIABLES.md`
- Complete usage guide
- Architecture explanation
- Best practices
- Example scenarios
- Debugging tips

## How It Works

### The System Flow

```
1. SCENARIO LOAD
   ↓
   ├─ Read scenario.globalVariables
   └─ Initialize window.gameState.globalVariables

2. STORY LOAD (each NPC)
   ↓
   ├─ Discover global_* variables
   ├─ Sync FROM window.gameState → Ink story
   └─ Set up change listener

3. DURING CONVERSATION
   ├─ Player makes choice that changes variable
   ├─ Ink's variableChangedEvent fires
   ├─ Update window.gameState
   └─ Broadcast to other loaded stories

4. CONVERSATION ENDS
   ├─ Save global variables snapshot
   └─ Store in npcConversationStateManager

5. NEXT CONVERSATION STARTS
   ├─ Restore globals from saved snapshot
   ├─ Sync into new story
   └─ Player sees narrative consequences
```

## Key Features

### ✅ Data-Driven
- Global variables declared in scenario JSON
- No hardcoding required
- Easy for scenario designers to extend

### ✅ Naming Convention Support
- `global_*` prefix also recognized
- Allows quick prototyping
- Graceful fallback for scenarios without globalVariables section

### ✅ Real-Time Sync
- Changes in one NPC's story immediately available in others
- Loop-safe (prevents infinite propagation)
- Type-safe (uses Ink's Value.Create())

### ✅ State Persistent
- Variables saved when conversation ends
- Restored on next conversation start
- Synced across page reloads

### ✅ Phaser Integration
- Direct access: `window.gameState.globalVariables.varName`
- Read/write from game code
- Synced to Ink on next conversation

## Example in Action

### Test Scenario Flow

1. **Player talks to test_npc_back (test2.ink)**
   - NPC invites player to join organization
   - Player chooses: "I'd love to join!"
   - `player_joined_organization` → `true` in window.gameState

2. **Player then talks to container_test_npc (equipment-officer.ink)**
   - Story loads and syncs `player_joined_organization = true`
   - Full inventory option now appears (was conditionally hidden)
   - "Show me what you have available" is now available

3. **From Phaser/Game Code**
   ```javascript
   // Check status anytime
   if (window.gameState.globalVariables.player_joined_organization) {
       // Grant access to member-only areas
   }
   
   // Set from game events
   window.gameState.globalVariables.main_quest_complete = true;
   ```

## Testing Verified

✅ Scenario JSON loads with globalVariables section
✅ game.js initializes global variables correctly
✅ npc-conversation-state.js methods implemented
✅ NPCManager integrates sync on story load
✅ test2.ink compiles with player_joined_organization variable
✅ equipment-officer.ink compiles with conditional logic
✅ No linter errors in modified files

## Files Modified

1. `scenarios/npc-sprite-test2.json` - Added globalVariables
2. `js/core/game.js` - Initialize globals from scenario
3. `js/systems/npc-conversation-state.js` - Added 9 new methods + state updates
4. `js/systems/npc-manager.js` - Integrate sync calls
5. `scenarios/ink/test2.ink` - Add variable and join choice
6. `scenarios/ink/equipment-officer.ink` - Add variable and conditional
7. `scenarios/compiled/test2.json` - Recompiled
8. `scenarios/compiled/equipment-officer.json` - Recompiled
9. `docs/GLOBAL_VARIABLES.md` - New documentation

## No Breaking Changes

- Existing scenarios without `globalVariables` still work (empty object)
- Existing NPC conversations unaffected
- Backward compatible with all existing Ink files
- Optional adoption of new feature

## Future Extensions

To add more global variables:

1. Add to scenario JSON:
   ```json
   "globalVariables": {
     "player_joined_organization": false,
     "research_complete": false,
     "trust_level": 0
   }
   ```

2. Use in any Ink file:
   ```ink
   VAR research_complete = false
   
   === hub ===
   {research_complete:
     New options unlock here
   }
   ```

3. Access from Phaser:
   ```javascript
   window.gameState.globalVariables.research_complete = true;
   ```

## Summary

The implementation provides a complete, data-driven system for managing shared narrative state across NPC conversations. It's:

- **Maintainable**: Variables declared in scenario file
- **Scalable**: Easy to add new variables
- **Robust**: Type-safe, loop-safe, persistent
- **Developer-friendly**: Simple API, good logging, well-documented
- **Game-friendly**: Direct Phaser integration

The test case demonstrates the full functionality: a player's choice in one NPC conversation (joining an organization) immediately affects what another NPC offers in a subsequent conversation.


