# Scenario JSON Format Comparison

## File Structure Issues in `npc-patrol-lockpick.json`

### ❌ **Issue 1: Incorrect NPC `patrol` Property Placement**

**WRONG (npc-patrol-lockpick.json - second NPC):**
```json
"security_guard": {
  "los": { ... },
  "patrol": {           // ← This is at NPC root level
    "route": [ ... ],
    "speed": 40,
    "pauseTime": 10
  },
  "eventMappings": [ ... ]
}
```

**CORRECT (test-npc-patrol.json):**
```json
"patrol_with_face": {
  "behavior": {         // ← patrol should be INSIDE behavior
    "facePlayer": true,
    "patrol": {
      "enabled": true,
      "speed": 100,
      "changeDirectionInterval": 4000,
      "bounds": { ... }
    }
  },
  "eventMappings": [ ... ]
}
```

**Why this matters:** The NPC manager expects `npc.behavior.patrol`, not `npc.patrol`. The current structure will cause the patrol system to not find the configuration.

---

### ❌ **Issue 2: Trailing Comma in `patrol` Object**

**WRONG (npc-patrol-lockpick.json - first NPC):**
```json
"patrol": {
  "enabled": true,
  "speed": 100,
  "changeDirectionInterval": 4000,
  "bounds": { ... }
},                     // ← Trailing comma before eventMappings
"eventMappings": [ ... ]
```

**CORRECT (test-npc-patrol.json):**
```json
"patrol": {
  "enabled": true,
  "speed": 100,
  "changeDirectionInterval": 4000,
  "bounds": { ... }
}                      // ← No trailing comma - eventMappings should be after behavior closes
```

**Why this matters:** The `eventMappings` is at the wrong nesting level. It should be at the NPC root, not inside `behavior`.

---

### ❌ **Issue 3: Missing Root-Level Properties**

**WRONG (npc-patrol-lockpick.json):**
```json
{
  "scenario_brief": "...",
  "globalVariables": { ... },
  "startRoom": "patrol_corridor",
  "startItemsInInventory": [],
  // Missing: "endGoal"
}
```

**CORRECT (test-npc-patrol.json):**
```json
{
  "scenario_brief": "...",
  "endGoal": "Test NPCs patrolling with various configurations and constraints",
  "startRoom": "test_patrol",
  // No unnecessary "globalVariables" or "startItemsInInventory" needed
}
```

**Why this matters:** `endGoal` is a standard scenario property used for game state and victory conditions.

---

### ✅ **Issue 4: Correct Structure for Multiple NPC Types**

The test file properly shows:

**Simple Patrol:**
```json
"behavior": {
  "facePlayer": false,
  "patrol": {
    "enabled": true,
    "speed": 100,
    "changeDirectionInterval": 3000,
    "bounds": { x, y, width, height }
  }
}
```

**Patrol with Face Player:**
```json
"behavior": {
  "facePlayer": true,
  "facePlayerDistance": 96,
  "patrol": {
    "enabled": true,
    "speed": 100,
    "changeDirectionInterval": 4000,
    "bounds": { x, y, width, height }
  }
}
```

---

## Summary of Required Fixes for `npc-patrol-lockpick.json`

### For `security_guard` NPC:

**CURRENT (BROKEN):**
```json
{
  "id": "security_guard",
  "los": { ... },
  "patrol": {               // ← WRONG: at root level
    "route": [ ... ],
    "speed": 40,
    "pauseTime": 10
  },
  "eventMappings": [ ... ]
}
```

**CORRECTED:**
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
  "los": {
    "enabled": true,
    "range": 300,
    "angle": 140,
    "visualize": true
  },
  "behavior": {
    "patrol": {             // ← CORRECT: inside behavior
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

---

### For `patrol_with_face` NPC:

**CURRENT (MOSTLY CORRECT):**
```json
{
  "id": "patrol_with_face",
  "los": { ... },
  "behavior": {
    "facePlayer": true,
    "facePlayerDistance": 96,
    "patrol": { ... },
  },                        // ← Trailing comma here is OK since eventMappings is wrong nesting
  "eventMappings": [ ... ]
}
```

**SHOULD BE:**
```json
{
  "id": "patrol_with_face",
  "behavior": {
    "facePlayer": true,
    "facePlayerDistance": 96,
    "patrol": {
      "enabled": true,
      "speed": 100,
      "changeDirectionInterval": 4000,
      "bounds": { ... }
    }
  },
  "los": { ... },
  "eventMappings": [ ... ]
}
```

---

## Expected Format According to `test-npc-patrol.json`

```json
{
  "scenario_brief": "...",
  "endGoal": "...",
  "startRoom": "...",
  
  "player": { ... },
  
  "rooms": {
    "room_id": {
      "type": "room_office",
      "connections": { ... },
      "npcs": [
        {
          "id": "npc_id",
          "displayName": "...",
          "npcType": "person",
          "position": { "x": 5, "y": 5 },
          "spriteSheet": "hacker",
          "spriteConfig": { ... },
          "storyPath": "scenarios/ink/...",
          "currentKnot": "start",
          "behavior": {
            "facePlayer": false,
            "patrol": {
              "enabled": true,
              "speed": 100,
              "changeDirectionInterval": 3000,
              "bounds": { x, y, width, height }
            }
          }
        }
      ],
      "objects": [ ... ]
    }
  }
}
```

---

## Key Takeaways

1. **`patrol` must be inside `behavior`** - not at NPC root
2. **All NPC-level properties should come before `behavior`** (displayName, spriteSheet, position, etc.)
3. **`eventMappings` is at NPC root level** - after `behavior` closes
4. **No trailing commas** - watch for syntax errors
5. **`endGoal` should be at scenario root** - describes mission objective

These are standard structure requirements for the NPC system to properly parse and initialize the patrol behavior.
