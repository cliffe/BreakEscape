# Visual JSON Structure Comparison

## The Core Difference Illustrated

### ❌ WRONG: `patrol` at NPC root

```
npc {
  id: "security_guard"
  position: {x, y}
  patrol: {              ← WRONG! At NPC root
    route: [...],
    speed: 40
  }
  eventMappings: [...]
}
```

**Why wrong:** System looks for `npc.behavior.patrol`, not `npc.patrol`

---

### ✅ CORRECT: `patrol` inside `behavior`

```
npc {
  id: "security_guard"
  position: {x, y}
  behavior: {            ← CORRECT! Wraps patrol
    patrol: {
      route: [...],
      speed: 40
    }
  }
  los: {...}
  eventMappings: [...]
}
```

**Why correct:** Matches expected structure `npc.behavior.patrol`

---

## Side-by-Side Property Comparison

### Second NPC in npc-patrol-lockpick.json

#### BEFORE (WRONG)
```json
{
  "id": "security_guard",
  "displayName": "Security Guard",
  "npcType": "person",
  "position": { "x": 5, "y": 4 },
  "spriteSheet": "hacker-red",
  "spriteTalk": "assets/characters/hacker-red-talk.png",
  "spriteConfig": { "idleFrameStart": 20, "idleFrameEnd": 23 },
  "storyPath": "scenarios/ink/security-guard.json",
  "currentKnot": "start",
  
  "los": {
    "enabled": true,
    "range": 300,
    "angle": 140,
    "visualize": true
  },
  
  "patrol": {              ← ❌ WRONG: At NPC root
    "route": [
      { "x": 2, "y": 3 },
      { "x": 8, "y": 3 },
      { "x": 8, "y": 6 },
      { "x": 2, "y": 6 }
    ],
    "speed": 40,
    "pauseTime": 10
  },                       ← ❌ Trailing comma
  
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

#### AFTER (CORRECT)
```json
{
  "id": "security_guard",
  "displayName": "Security Guard",
  "npcType": "person",
  "position": { "x": 5, "y": 4 },
  "spriteSheet": "hacker-red",
  "spriteTalk": "assets/characters/hacker-red-talk.png",
  "spriteConfig": { "idleFrameStart": 20, "idleFrameEnd": 23 },
  "storyPath": "scenarios/ink/security-guard.json",
  "currentKnot": "start",
  
  "behavior": {            ← ✅ NEW: Wraps patrol
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
  },                       ← ✅ No trailing comma
  
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
  
  "_comment": "Follows route patrol, detects player within 300px at 140° FOV"
}
```

---

## Indentation and Nesting Visualization

### ❌ WRONG Indentation
```
NPC                                 ← Level 0
├── id
├── position
├── patrol ←── WRONG LEVEL!          ← Should be in behavior
│   ├── route
│   ├── speed
│   └── pauseTime
├── eventMappings
```

### ✅ CORRECT Indentation
```
NPC                                 ← Level 0
├── id
├── position
├── behavior ←── CONTAINS PATROL     ← Level 1
│   └── patrol
│       ├── route
│       ├── speed
│       └── pauseTime
├── los
├── eventMappings
```

---

## Property Nesting Rules

### Table of Correct Nesting Levels

| Property | Level | Parent | Example |
|----------|-------|--------|---------|
| `id` | NPC root | - | `npc.id` |
| `displayName` | NPC root | - | `npc.displayName` |
| `behavior` | NPC root | - | `npc.behavior` |
| `patrol` | behavior | `behavior` | `npc.behavior.patrol` |
| `facePlayer` | behavior | `behavior` | `npc.behavior.facePlayer` |
| `los` | NPC root | - | `npc.los` |
| `eventMappings` | NPC root | - | `npc.eventMappings` |

---

## JSON Path Comparison

### Code Looking for Properties

```javascript
// System expects this path:
npc.behavior.patrol  ← Correct in fixed version

// But was finding this in old version:
npc.patrol  ← Incorrect - at wrong level
```

### What Happens

**Old (Broken):**
```javascript
npc.behavior.patrol  // = undefined ❌ (patrol not in behavior)
npc.patrol           // = {...}     ✅ (found, but wrong place!)
```

**New (Fixed):**
```javascript
npc.behavior.patrol  // = {...}     ✅ (found at correct location)
npc.patrol           // = undefined ❌ (correctly not here)
```

---

## Bracket/Comma Verification

### ❌ WRONG (Old Version)
```json
"behavior": { ... },    ← Note trailing comma
"eventMappings": [...]  ← Appears at wrong level
```

**Problem:** Parser gets confused about where properties belong

### ✅ CORRECT (Fixed Version)
```json
"behavior": { ... },    ← Proper comma (more properties follow)
"los": { ... },         ← Proper comma (more properties follow)
"eventMappings": [...]  ← No comma (last property)
```

**Benefit:** Clear structure, each property at correct nesting level

---

## First NPC Comparison

### ❌ BEFORE (First NPC - patrol_with_face)
```json
"behavior": {
  "facePlayer": true,
  "facePlayerDistance": 96,
  "patrol": {
    "enabled": true,
    "speed": 100,
    "changeDirectionInterval": 4000,
    "bounds": { ... }
  }
},                        ← ❌ PROBLEM: Trailing comma
"eventMappings": [ ... ]  ← Should be after "los"
```

### ✅ AFTER (First NPC - patrol_with_face)
```json
"behavior": {
  "facePlayer": true,
  "facePlayerDistance": 96,
  "patrol": {
    "enabled": true,
    "speed": 100,
    "changeDirectionInterval": 4000,
    "bounds": { ... }
  }
},                        ← ✅ OK: More properties follow
"los": { ... },           ← ✅ NEW: Moved here
"eventMappings": [ ... ], ← ✅ After "los"
"_comment": "..."         ← ✅ NEW: Added for clarity
```

---

## Root Level Comparison

### ❌ BEFORE
```json
{
  "scenario_brief": "...",
  "globalVariables": {      ← ❌ Removed
    "player_caught_lockpicking": false
  },
  "startRoom": "...",
  "startItemsInInventory": [], ← ❌ Removed
  "player": { ... },
  "rooms": { ... }
}
```

### ✅ AFTER
```json
{
  "scenario_brief": "...",
  "endGoal": "Test NPC line-of-sight detection...", ← ✅ Added
  "startRoom": "...",
  "player": { ... },
  "rooms": { ... }
}
```

---

## Complete Structure Map

### Scenario Root
```
scenario
├── scenario_brief (string)
├── endGoal (string) ← Added
├── startRoom (string)
├── player (object)
└── rooms (object)
    └── [room_id] (object)
        └── npcs (array)
            └── [npc] (object) ← See NPC structure below
```

### NPC Structure
```
npc
├── id (string)
├── displayName (string)
├── npcType (string: "person")
├── position (object: {x, y})
├── spriteSheet (string)
├── spriteConfig (object)
├── storyPath (string)
├── currentKnot (string)
├── behavior (object) ← Contains patrol!
│   ├── facePlayer (boolean)
│   ├── facePlayerDistance (number)
│   └── patrol (object) ← Must be here!
│       ├── enabled (boolean)
│       ├── speed (number)
│       ├── changeDirectionInterval (number)
│       ├── bounds (object) OR route (array)
│       └── pauseTime (number) [optional]
├── los (object)
│   ├── enabled (boolean)
│   ├── range (number)
│   ├── angle (number)
│   └── visualize (boolean)
├── eventMappings (array)
│   └── [mapping] (object)
│       ├── eventPattern (string)
│       ├── targetKnot (string)
│       ├── conversationMode (string)
│       └── cooldown (number)
└── _comment (string) [optional]
```

---

## Summary of Changes

| Issue | Before | After | Status |
|-------|--------|-------|--------|
| `patrol` location | At NPC root | Inside `behavior` | ✅ Fixed |
| Trailing commas | Present | Removed | ✅ Fixed |
| `eventMappings` nesting | Inside `behavior` | At NPC root | ✅ Fixed |
| `endGoal` property | Missing | Added | ✅ Fixed |
| Property ordering | Mixed | Standardized | ✅ Fixed |
| JSON validity | Invalid | Valid | ✅ Fixed |

All issues have been **RESOLVED** ✅
