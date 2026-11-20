# Format Review - JSON Scenarios and Ink Files

## Review Summary

This document reviews all JSON scenario and Ink file examples in the planning documents against the actual codebase formats.

---

## 1. Ink File Format Review

### ✅ Correct Pattern (from `helper-npc.ink`)

**Hub Pattern:**
```ink
=== start ===
# speaker:npc
Initial dialogue
-> hub

=== hub ===
+ [Choice 1]
    -> knot1
+ [Choice 2]
    -> knot2
+ [Exit choice]
    # speaker:npc
    Goodbye message
    #exit_conversation
    -> hub

=== knot1 ===
# speaker:npc
Dialogue
-> hub
```

**Key Rules:**
1. ✅ Always `-> hub` (NEVER `-> END`)
2. ✅ `#exit_conversation` tag to close UI
3. ✅ Even after `#exit_conversation`, use `-> hub`
4. ✅ Hub is the central conversation state
5. ✅ `start` knot is entry point, immediately goes to hub

### ❌ Issues Found in Planning Documents

**implementation_plan.md (Lines ~605-625):**
- ❌ Shows `# exit_conversation` followed by `-> END`
- ✅ Should be `# exit_conversation` followed by `-> hub`

**phase0_foundation.md (Test Ink File):**
- ❌ Shows `-> END` in multiple places
- ✅ Should be `-> hub` everywhere

**Corrected in:** `CORRECTIONS.md`

---

## 2. JSON Scenario Format Review

### ✅ Correct NPC Format (from `npc-patrol-lockpick.json`)

**Complete NPC Definition:**
```json
{
  "id": "security_guard",
  "displayName": "Security Guard",
  "npcType": "person",
  "position": { "x": 5, "y": 4 },
  "spriteSheet": "hacker-red",
  "spriteTalk": "assets/characters/hacker-red-talk.png",
  "spriteConfig": {
    "idleFrameStart": 20,
    "idleFrameEnd": 23
  },
  "storyPath": "scenarios/ink/security-guard.json",
  "currentKnot": "start",
  "behavior": {
    "patrol": {
      "enabled": true,
      "route": [
        { "x": 2, "y": 3 },
        { "x": 8, "y": 3 }
      ],
      "speed": 40,
      "pauseTime": 10
    }
  },
  "los": {
    "enabled": true,
    "range": 150,
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
  ]
}
```

**Required Fields:**
- `id` - Unique NPC identifier (string)
- `displayName` - Name shown to player (string)
- `npcType` - Type of NPC (usually "person" for sprite NPCs)
- `position` - { x, y } in pixels or tiles depending on context
- `spriteSheet` - Name of sprite sheet (without extension)
- `storyPath` - Path to compiled Ink JSON file
- `currentKnot` - Starting knot (usually "start")

**Optional Fields:**
- `spriteTalk` - Path to talking sprite variant
- `spriteConfig` - Animation frame configuration
  - `idleFrameStart` - First frame of idle animation
  - `idleFrameEnd` - Last frame of idle animation
  - `idleFrame` - Single frame for static idle (alternative)
- `behavior` - Behavior configuration object
  - `facePlayer` - Boolean or object with distance
  - `patrol` - Patrol configuration
- `los` - Line of sight configuration
  - `enabled` - Boolean
  - `range` - Detection range in pixels
  - `angle` - Field of view angle in degrees
  - `visualize` - Show debug visualization
- `eventMappings` - Array of event-to-conversation mappings
  - `eventPattern` - Event name to listen for
  - `targetKnot` - Ink knot to jump to
  - `conversationMode` - Type of conversation ("person-chat", "phone", etc.)
  - `cooldown` - Cooldown in milliseconds

### 📝 Review of Planning Document Examples

**phase0_foundation.md Test NPC (Lines 352-362):**
```json
{
  "id": "test_npc",
  "displayName": "Test Dummy",
  "npcType": "person",
  "spriteSheet": "hacker",
  "storyPath": "scenarios/ink/test-hostile.json",
  "currentKnot": "start",
  "position": { "x": 100, "y": 100 },
  "roomId": "test_room"
}
```

**Review:**
- ✅ Has all required fields
- ✅ Correct JSON structure
- ⚠️ Has `roomId` field - this is **not needed** in the NPC object itself
  - NPCs are defined **inside** room objects in the scenario
  - The room context is implicit
- ⚠️ Missing optional but useful fields:
  - `spriteConfig` for idle animation
  - Could add minimal `behavior` for testing
  - Could add minimal `los` for hostile testing

**Corrected Example:**
```json
{
  "id": "test_npc",
  "displayName": "Test Dummy",
  "npcType": "person",
  "position": { "x": 100, "y": 100 },
  "spriteSheet": "hacker",
  "spriteConfig": {
    "idleFrameStart": 20,
    "idleFrameEnd": 23
  },
  "storyPath": "scenarios/ink/test-hostile.json",
  "currentKnot": "start",
  "behavior": {
    "patrol": {
      "enabled": false
    }
  }
}
```

---

## 3. Complete Scenario Structure

### ✅ Correct Full Scenario Format

**From `npc-patrol-lockpick.json`:**

```json
{
  "scenario_brief": "Brief description",
  "endGoal": "Goal description",
  "startRoom": "room_id",

  "player": {
    "id": "player",
    "displayName": "Player Name",
    "spriteSheet": "hacker",
    "spriteTalk": "assets/characters/hacker-talk.png",
    "spriteConfig": {
      "idleFrameStart": 20,
      "idleFrameEnd": 23
    }
  },

  "rooms": {
    "room_id": {
      "type": "room_type",
      "connections": {
        "north": "other_room_id"
      },
      "npcs": [
        { /* NPC objects here */ }
      ],
      "objects": [
        { /* Object definitions here */ }
      ]
    }
  }
}
```

**Top-Level Fields:**
- `scenario_brief` - Description shown to player
- `endGoal` - Win condition description
- `startRoom` - ID of starting room
- `startItemsInInventory` - Array of items (optional)
- `player` - Player configuration (optional)
- `rooms` - Object with room definitions

**Room Fields:**
- `type` - Room tilemap type (e.g., "room_office", "room_reception")
- `connections` - Object mapping directions to room IDs
  - Valid directions: "north", "south", "east", "west"
- `locked` - Boolean (optional)
- `lockType` - "key", "pin", "password", etc. (if locked)
- `requires` - Key ID or password/PIN (if locked)
- `keyPins` - Array of lock pins for lockpicking (if lockType is "key")
- `difficulty` - "easy", "medium", "hard" (for lockpicking)
- `door_sign` - Text shown on door (optional)
- `npcs` - Array of NPC objects
- `objects` - Array of object definitions

---

## 4. New NPC Fields for Hostile System

### Proposed Addition

For NPCs that can become hostile, add optional `hostile` configuration:

```json
{
  "id": "tough_guard",
  "displayName": "Elite Guard",
  "npcType": "person",
  "position": { "x": 5, "y": 5 },
  "spriteSheet": "hacker-red",
  "storyPath": "scenarios/ink/tough-guard.json",
  "currentKnot": "start",
  "behavior": {
    "patrol": {
      "enabled": true,
      "speed": 100
    }
  },
  "los": {
    "enabled": true,
    "range": 200,
    "angle": 120
  },
  "hostile": {
    "maxHP": 150,
    "attackDamage": 15,
    "attackRange": 60,
    "attackCooldown": 1500,
    "chaseSpeed": 140
  }
}
```

**New `hostile` Object Fields:**
- `maxHP` - Maximum health points (default: 100 from config)
- `attackDamage` - Damage per attack (default: 10 from config)
- `attackRange` - Attack range in pixels (default: 50 from config)
- `attackCooldown` - Cooldown between attacks in ms (default: 2000 from config)
- `chaseSpeed` - Movement speed when chasing in pixels/second (default: 120 from config)

**Notes:**
- All fields are **optional**
- If not specified, defaults from `COMBAT_CONFIG` are used
- Allows per-NPC customization of combat stats
- Can be added to any existing NPC without breaking anything

---

## 5. Summary of Issues and Corrections

### Issues Found

1. ❌ **Ink Pattern**: Planning docs show `-> END` after `#exit_conversation`
   - **Fix**: Always use `-> hub` (see CORRECTIONS.md)

2. ⚠️ **Test NPC JSON**: Includes `roomId` field
   - **Fix**: Remove `roomId` (NPCs are already inside room objects)
   - **Enhancement**: Add `spriteConfig` for completeness

3. ✅ **JSON Structure**: Overall structure matches codebase
   - All required fields present
   - Correct nesting and format

### Corrections Applied

- Created `CORRECTIONS.md` with detailed Ink pattern fixes
- This document provides correct JSON format reference
- Updated test NPC example above with corrections

---

## 6. Checklist for Implementation

When implementing the hostile NPC feature:

### Ink Files
- [ ] Never use `-> END` anywhere
- [ ] Always use `-> hub` to return to hub
- [ ] Use `#exit_conversation` tag to close UI
- [ ] After `#exit_conversation`, still use `-> hub`
- [ ] Test all conversation paths return to hub
- [ ] Verify `#hostile:npcId` tag works as expected

### JSON Scenarios
- [ ] NPCs defined inside `rooms.{roomId}.npcs` array
- [ ] All required fields present (id, displayName, npcType, position, spriteSheet, storyPath, currentKnot)
- [ ] Don't add `roomId` to NPC objects (redundant)
- [ ] Add `spriteConfig` for proper idle animations
- [ ] Add `los` configuration for hostile NPCs
- [ ] Add `eventMappings` for lockpick detection if needed
- [ ] Optionally add `hostile` object for custom combat stats
- [ ] Verify JSON is valid (no trailing commas, proper quotes)

### Testing
- [ ] Create test scenario with test NPC
- [ ] Verify conversation loads without errors
- [ ] Test hostile tag triggers hostile state
- [ ] Verify conversation exits properly with `#exit_conversation`
- [ ] Check no Ink errors in console
- [ ] Verify NPC state persists correctly

---

## 7. References

**Good Examples to Follow:**
- `/scenarios/ink/helper-npc.ink` - Perfect hub pattern
- `/scenarios/npc-patrol-lockpick.json` - Complete NPC scenario

**Files Needing Updates:**
- `/scenarios/ink/security-guard.ink` - Has 8 `-> END` that need fixing

**Planning Documents:**
- `CORRECTIONS.md` - Detailed corrections for Ink patterns
- `implementation_plan.md` - Main implementation guide (note Ink corrections)
- `phase0_foundation.md` - Foundation setup (note JSON/Ink corrections)

---

## Conclusion

### Format Compliance

| Format | Status | Notes |
|--------|--------|-------|
| JSON Scenario Structure | ✅ Correct | Matches existing patterns |
| NPC Object Format | ✅ Mostly Correct | Minor improvement: remove roomId |
| Ink Hub Pattern | ❌ Incorrect in docs | Fixed in CORRECTIONS.md |
| Event Tags | ✅ Correct | Proper tag usage |
| Required Fields | ✅ Complete | All fields present |
| Optional Fields | ⚠️ Could improve | Add spriteConfig, hostile config |

### Action Items

1. **Read CORRECTIONS.md first** before implementing any Ink files
2. **Use this document** as JSON format reference
3. **Follow helper-npc.ink** as the canonical Ink example
4. **Test thoroughly** with a simple test scenario first
5. **Validate JSON** before loading (use JSON linter)

With these corrections applied, all formats will match the existing codebase patterns and work correctly.
