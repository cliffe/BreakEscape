# Global Ink Variables System

## Overview

This document describes the global variable system that allows narrative state to be shared across all NPC conversations in a scenario. Global variables are stored in `window.gameState.globalVariables` and are automatically synced to all loaded Ink stories.

## How It Works

### Single Source of Truth
`window.gameState.globalVariables` is the authoritative store for all global narrative state. When a variable changes in any NPC's story, it updates here and is then synced to all other loaded stories.

### Data Flow

```
┌─────────────────────────────────┐
│ window.gameState.globalVariables│  ← Single source of truth
│ { player_joined_organization... }│
└──────────────┬──────────────────┘
               │
       ┌───────┴────────┐
       │  On Load/Sync  │
       └───────┬────────┘
               ↓
    ┌──────────────────────┐
    │  NPC Ink Stories     │
    │  - test_npc_back     │
    │  - equipment_officer │
    │  - helper_npc        │
    └──────────────────────┘
```

### Initialization Flow

1. **Game Start** (`js/core/game.js` - `create()`)
   - Scenario JSON is loaded with `globalVariables` section
   - `window.gameState.globalVariables` is initialized from scenario defaults

2. **Story Load** (`js/systems/npc-manager.js` - `getInkEngine()`)
   - Story JSON is compiled from Ink source
   - Auto-discovers `global_*` variables not in scenario
   - Syncs all global variables FROM window.gameState INTO the story
   - Sets up variable change listener to sync back

3. **Variable Change Detection** (`js/systems/npc-conversation-state.js`)
   - Ink's `variableChangedEvent` fires when any variable changes
   - If variable is global, updates window.gameState
   - Broadcasts change to all other loaded stories

## Declaring Global Variables

### Method 1: Scenario JSON (Recommended)

Add a `globalVariables` section to your scenario file:

```json
{
  "scenario_brief": "My Scenario",
  "globalVariables": {
    "player_joined_organization": false,
    "main_quest_complete": false,
    "player_reputation": 0
  },
  "startRoom": "lobby",
  ...
}
```

**Advantages:**
- Centralized location for all narrative state
- Visible to designers and developers
- Type-safe (defaults define types)
- Clear which variables are shared

### Method 2: Naming Convention (Fallback)

Add variables starting with `global_` to any Ink file:

```ink
VAR global_research_complete = false
VAR global_alliance_formed = false
```

**Advantages:**
- Quick prototyping without editing scenario file
- Third-party Ink files can declare their own globals
- Graceful degradation for scenarios without globalVariables section

## Using Global Variables in Ink

Global variables are automatically synced to Ink stories on load. Just declare them with the same name:

```ink
// Will be synced from window.gameState.globalVariables automatically
VAR player_joined_organization = false

=== check_status ===
{player_joined_organization:
  This NPC recognizes you as a member!
- else:
  Welcome, outsider.
}
```

### Conditional Choice Display

To show/hide choices based on global variables, use the conditional syntax directly in choice brackets:

```ink
// Shows this choice only if player_joined_organization is true
+ {player_joined_organization} [Show me everything]
  -> show_inventory

// Regular choice always visible
* [Show me specialist items]
  -> show_filtered
```

**Important:** The syntax is `+ {variable} [choice text]`, NOT `{variable: + [choice text]}`

## Accessing Global Variables from JavaScript/Phaser

Read global variables:
```javascript
const hasJoined = window.gameState.globalVariables.player_joined_organization;
```

Write global variables (syncs automatically to next conversation):
```javascript
window.gameState.globalVariables.player_joined_organization = true;
```

Get all global variables:
```javascript
console.log(window.gameState.globalVariables);
```

## How State Persistence Works

When an NPC conversation ends:
- `npcConversationStateManager.saveNPCState()` captures:
  - Full story state (if mid-conversation)
  - NPC-specific variables only
  - **Snapshot of global variables**

On next conversation:
- `npcConversationStateManager.restoreNPCState()`:
  - Restores global variables first
  - Loads full story state or just variables
  - Syncs globals into the story

## Critical Syncing Points

For global variables to work correctly, syncing must happen at specific times:

1. **After Player Choice** (`person-chat-minigame.js` - `handleChoice()`)
   - Reads all global variables that changed in the Ink story
   - Updates `window.gameState.globalVariables`
   - Broadcasts changes to other loaded stories

2. **Before Showing Dialogue** (`person-chat-minigame.js` - `start()`)
   - Re-syncs all globals into the current story
   - Critical because Ink evaluates conditionals at `continue()` time
   - Ensures conditional choices reflect current state from other NPCs

3. **On Story Load** (`npc-manager.js` - `getInkEngine()`)
   - Initial sync of globals into newly loaded story
   - Sets up listeners for future changes

## Implementation Details

### Key Files

- **`js/main.js`** (line 46-52)
  - Initializes `window.gameState` with `globalVariables`

- **`js/core/game.js`** (line 461-467)
  - Loads scenario and initializes `window.gameState.globalVariables`

- **`js/systems/npc-conversation-state.js`**
  - `getGlobalVariableNames()` - Lists all global variables
  - `isGlobalVariable(name)` - Checks if a variable is global
  - `discoverGlobalVariables(story)` - Auto-discovers `global_*` variables
  - `syncGlobalVariablesToStory(story)` - Syncs FROM window → Ink
  - `syncGlobalVariablesFromStory(story)` - Syncs FROM Ink → window
  - `observeGlobalVariableChanges(story, npcId)` - Sets up listeners
  - `broadcastGlobalVariableChange()` - Propagates changes to all stories

- **`js/systems/npc-manager.js`** (line 702-712)
  - Calls sync methods after loading each story

### Type Handling

Ink's `Value.Create()` is used through the indexer to ensure proper type wrapping:
```javascript
story.variablesState[variableName] = value;  // Uses Ink's Value.Create internally
```

This handles:
- `boolean` → `BoolValue`
- `number` → `IntValue` or `FloatValue`
- `string` → `StringValue`

### Loop Prevention

When broadcasting changes to other stories, the event listener is temporarily disabled to prevent infinite loops:

```javascript
const oldHandler = story.variablesState.variableChangedEvent;
story.variablesState.variableChangedEvent = null;
story.variablesState[variableName] = value;
story.variablesState.variableChangedEvent = oldHandler;
```

## Example: Equipment Officer Scenario

### Scenario File (`npc-sprite-test2.json`)
```json
{
  "globalVariables": {
    "player_joined_organization": false
  },
  ...
}
```

### First NPC (`test2.ink`)
```ink
VAR player_joined_organization = false

=== player_closing ===
# speaker:player
* [I'd love to join your organization!]
    ~ player_joined_organization = true
    Excellent! Welcome aboard.
```

### Second NPC (`equipment-officer.ink`)
```ink
VAR player_joined_organization = false  // Synced from test2.ink

=== hub ===
// This option only appears if player joined organization
+ {player_joined_organization} [Show me everything]
  -> show_inventory
```

**Result:**
- Player talks to first NPC, chooses to join
- `player_joined_organization` → `true` in window.gameState
- Player talks to second NPC
- Variable is synced into their story
- Full inventory option now appears!

## Debugging & Troubleshooting

### Conditional Choices Not Appearing?

**Most Common Cause:** Ink files must be **recompiled** after editing.

```bash
# Recompile the Ink file:
inklecate -ojv scenarios/compiled/equipment-officer.json scenarios/ink/equipment-officer.ink
```

Then **hard refresh** the browser:
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

### Variable Changed But Choices Still Wrong?

**Cause:** Conditionals evaluated before variable synced.

**Solution:** Ensure you're using the correct Ink syntax:
```ink
// ✅ CORRECT - conditional in choice brackets
+ {player_joined_organization} [Show me everything]

// ❌ WRONG - wrapping entire choice block
{player_joined_organization:
  + [Show me everything]
}
```

### Check Global Variables
```javascript
window.gameState.globalVariables
```

### Enable Debug Mode
```javascript
window.npcConversationStateManager._log('debug', 'message', data);
```

### Verify Scenario Loaded Correctly
```javascript
window.gameScenario.globalVariables
```

### Check Cached Stories
```javascript
window.npcManager.inkEngineCache
```

### View Console Logs
Look for these patterns in browser console:
- `✅ Synced player_joined_organization = true to story` - Variable synced successfully
- `🔄 Global variable player_joined_organization changed from false to true` - Variable changed
- `🌐 Synced X global variable(s) after choice` - Changes propagated after player choice

## Best Practices

1. **Declare in Scenario** - Use the `globalVariables` section for main narrative state
2. **Consistent Naming** - Use snake_case: `player_joined_organization`, `quest_complete`
3. **Type Consistency** - Keep the same type (bool, number, string) across all uses
4. **Document Intent** - Add comments in Ink files explaining what globals mean
5. **Test State Persistence** - Verify globals persist across page reloads
6. **Avoid Circular Logic** - Don't create mutually-dependent conditional branches

## Migration Guide

### Adding Global Variables to Existing Scenarios

1. Add `globalVariables` section to scenario JSON:
```json
{
  "globalVariables": {
    "new_variable": false
  },
  ...
}
```

2. Add to Ink files that use it:
```ink
VAR new_variable = false
```

3. Use in conditionals or assignments:
```ink
{new_variable:
  Conditions when variable is true
}
```

### No Breaking Changes

- Scenarios without `globalVariables` work fine (empty object)
- Existing variables remain NPC-specific unless added to `globalVariables`
- `global_*` convention works for quick prototyping


