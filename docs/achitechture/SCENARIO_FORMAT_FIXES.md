# Scenario JSON Format Fixes - Summary

## Files Compared

- ✅ **Correct Format**: `scenarios/test-npc-patrol.json`
- ❌ **Had Errors**: `scenarios/npc-patrol-lockpick.json` (NOW FIXED)

## Issues Found and Fixed

### 1. ✅ **Root-level Properties**

**Before:**
```json
{
  "scenario_brief": "...",
  "globalVariables": { "player_caught_lockpicking": false },
  "startRoom": "patrol_corridor",
  "startItemsInInventory": []
}
```

**After:**
```json
{
  "scenario_brief": "...",
  "endGoal": "Test NPC line-of-sight detection and lockpicking interruption",
  "startRoom": "patrol_corridor"
}
```

**Changes:**
- ✅ Removed unnecessary `globalVariables`
- ✅ Removed `startItemsInInventory` (not needed)
- ✅ Added `endGoal` (standard property)

---

### 2. ✅ **First NPC (`patrol_with_face`) Structure**

**Before (WRONG NESTING):**
```json
{
  "storyPath": "scenarios/ink/security-guard.json",
  "currentKnot": "start",
  "los": { ... },                    // ← Out of order
  "behavior": {
    "facePlayer": true,
    "patrol": { ... }
  },                                 // ← Trailing comma (syntax error)
  "eventMappings": [ ... ]           // ← Inside behavior close (wrong nesting)
}
```

**After (CORRECT NESTING):**
```json
{
  "storyPath": "scenarios/ink/security-guard.json",
  "currentKnot": "start",
  "behavior": {
    "facePlayer": true,
    "patrol": {
      "enabled": true,
      "speed": 100,
      "changeDirectionInterval": 4000,
      "bounds": { ... }
    }
  },
  "los": { ... },                    // ← Moved after behavior
  "eventMappings": [ ... ],          // ← At NPC root level (correct)
  "_comment": "..."
}
```

**Changes:**
- ✅ Moved `behavior` object before other properties
- ✅ Removed trailing comma after `behavior`
- ✅ Moved `eventMappings` to NPC root level
- ✅ Added `enabled: true` to patrol config
- ✅ Added `_comment` for clarity

---

### 3. ✅ **Second NPC (`security_guard`) Structure**

**Before (MAJOR STRUCTURAL ERROR):**
```json
{
  "storyPath": "scenarios/ink/security-guard.json",
  "currentKnot": "start",
  "los": { ... },
  "patrol": {                        // ← WRONG: patrol at root level!
    "route": [ ... ],
    "speed": 40,
    "pauseTime": 10
  },                                 // ← Trailing comma
  "eventMappings": [ ... ]           // ← Should be at root, but nested wrong
}
```

**After (CORRECT STRUCTURE):**
```json
{
  "storyPath": "scenarios/ink/security-guard.json",
  "currentKnot": "start",
  "behavior": {                      // ← CORRECT: patrol inside behavior
    "patrol": {
      "route": [
        { "x": 2, "y": 3 },
        { "x": 8, "y": 3 },
        { "x": 8, "y": 6 },
        { "x": 2, "y": 6 }
      ],
      "speed": 40,
      "pauseTime": 10
    }
  },
  "los": { ... },
  "eventMappings": [ ... ],          // ← Now at correct nesting level
  "_comment": "..."
}
```

**Changes:**
- ✅ Wrapped `patrol` inside `behavior` object
- ✅ Removed trailing comma after patrol object
- ✅ Moved `eventMappings` to NPC root level
- ✅ Added `_comment` for clarity

---

## Key Format Rules Enforced

| Property | Location | Notes |
|----------|----------|-------|
| `behavior` | NPC root | Contains `facePlayer`, `patrol`, etc. |
| `patrol` | Inside `behavior` | Not at NPC root level |
| `los` | NPC root | Line-of-sight configuration |
| `eventMappings` | NPC root | Event handlers for NPC |
| `storyPath`, `currentKnot` | NPC root | Ink story integration |
| `spriteSheet`, `position` | NPC root | Display properties |
| `_comment` | NPC root | Documentation string |

---

## Validation Checklist

✅ All NPCs have:
- `behavior` object containing `patrol`
- `los` configuration for LOS detection
- `eventMappings` at root level
- Proper comma placement (no trailing commas)

✅ Scenario root has:
- `scenario_brief` - Brief description
- `endGoal` - Mission objective
- `startRoom` - Initial room
- `player` - Player configuration
- `rooms` - Rooms dictionary

✅ No syntax errors:
- All braces/brackets properly closed
- No trailing commas
- Proper property nesting

---

## File Status

📁 **`scenarios/npc-patrol-lockpick.json`**
- ✅ **FIXED** - Now matches correct format
- ✅ Valid JSON structure
- ✅ Ready for testing

📖 **`docs/SCENARIO_FORMAT_COMPARISON.md`**
- ✅ **CREATED** - Detailed comparison guide
- Shows before/after examples
- Explains why each fix was needed

---

## Testing the Corrected Scenario

To test that the fixes work:

1. Load scenario: `npc-patrol-lockpick.json`
2. Enable LOS visualization:
   ```javascript
   window.enableLOS()
   ```
3. Verify:
   - Both NPCs patrol correctly
   - Green LOS cones appear
   - Lockpicking triggers person-chat when NPC sees player

---

## Reference: Correct NPC Structure

```json
{
  "id": "npc_id",
  "displayName": "NPC Name",
  "npcType": "person",
  "position": { "x": 5, "y": 5 },
  "spriteSheet": "hacker",
  "spriteTalk": "assets/characters/hacker-talk.png",
  "spriteConfig": {
    "idleFrameStart": 20,
    "idleFrameEnd": 23
  },
  "storyPath": "scenarios/ink/story.json",
  "currentKnot": "start",
  
  "behavior": {
    "facePlayer": true,
    "facePlayerDistance": 96,
    "patrol": {
      "enabled": true,
      "speed": 100,
      "changeDirectionInterval": 4000,
      "bounds": { "x": 128, "y": 128, "width": 128, "height": 128 }
    }
  },
  
  "los": {
    "enabled": true,
    "range": 300,
    "angle": 140,
    "visualize": true
  },
  
  "eventMappings": [
    {
      "eventPattern": "lockpick_used_in_view",
      "targetKnot": "on_lockpick_used",
      "conversationMode": "person-chat",
      "cooldown": 0
    }
  ],
  
  "_comment": "Description of NPC behavior"
}
```

This is the authoritative structure for all NPC definitions.
