# JSON Syntax Errors Found and Fixed

## Error 1: Trailing Comma (First NPC)

### ❌ WRONG
```json
"behavior": {
  "facePlayer": true,
  "patrol": { ... }
},                    // ← SYNTAX ERROR: Trailing comma before next property
"eventMappings": [ ... ]
```

**Error Message:** `Unexpected token } in JSON`

### ✅ CORRECT
```json
"behavior": {
  "facePlayer": true,
  "patrol": { ... }
}                     // ← No comma - allows next property to follow
```

---

## Error 2: Wrong Nesting Level (Second NPC `patrol`)

### ❌ WRONG
```json
{
  "storyPath": "...",
  "los": { ... },
  "patrol": {         // ← WRONG: At NPC root, should be in behavior
    "route": [ ... ],
    "speed": 40
  },
  "eventMappings": [ ... ]
}
```

**Problem:** NPC manager looks for `npc.behavior.patrol`, but finds `npc.patrol` instead

### ✅ CORRECT
```json
{
  "storyPath": "...",
  "behavior": {
    "patrol": {       // ← CORRECT: Inside behavior
      "route": [ ... ],
      "speed": 40
    }
  },
  "los": { ... },
  "eventMappings": [ ... ]
}
```

---

## Error 3: Mismatched Property Nesting (First NPC)

### ❌ WRONG
```json
{
  "los": { ... },
  "behavior": {
    "patrol": { ... }
  },
  "eventMappings": [ ... ]  // ← Appears to be after behavior, but formatting is wrong
}
```

The closing brace for `behavior` is followed by a comma, making `eventMappings` ambiguous.

### ✅ CORRECT
```json
{
  "behavior": {
    "patrol": { ... }
  },
  "los": { ... },
  "eventMappings": [ ... ]  // ← Clear structure, proper nesting
}
```

---

## Error 4: Missing Required Property

### ❌ WRONG
```json
{
  "scenario_brief": "Test scenario",
  "globalVariables": { ... },
  "startItemsInInventory": [],
  "startRoom": "patrol_corridor"
  // Missing endGoal
}
```

**Impact:** Game may not initialize properly without `endGoal`

### ✅ CORRECT
```json
{
  "scenario_brief": "Test scenario",
  "endGoal": "Test NPC line-of-sight detection and lockpicking interruption",
  "startRoom": "patrol_corridor"
}
```

---

## Side-by-Side Comparison

### NPC Object Structure

#### ❌ BROKEN
```
npc
├── id
├── displayName
├── npcType
├── position
├── spriteSheet
├── storyPath
├── currentKnot
├── los ────────────────────── ← Wrong order
├── behavior
│   ├── facePlayer
│   └── patrol
│       └── enabled, speed, etc.
├── patrol ────────────────── ← WRONG LOCATION!
│   ├── route
│   ├── speed
│   └── pauseTime,
└── eventMappings ←── WRONG NESTING (appears to close behavior)
```

#### ✅ CORRECT
```
npc
├── id
├── displayName
├── npcType
├── position
├── spriteSheet
├── storyPath
├── currentKnot
├── behavior ───────────────── ← FIRST!
│   ├── facePlayer
│   └── patrol
│       ├── enabled
│       ├── speed
│       ├── changeDirectionInterval
│       └── bounds
├── los ────────────────────── ← After behavior
├── eventMappings ──────────── ← At NPC root
└── _comment
```

---

## JSON Validation Tips

### Check for These Errors:

1. **Trailing Commas**
   ```json
   ❌ { "a": 1, }        // Trailing comma after last property
   ✅ { "a": 1 }         // No comma after last property
   ```

2. **Missing Commas**
   ```json
   ❌ { "a": 1 "b": 2 }  // Missing comma between properties
   ✅ { "a": 1, "b": 2 } // Comma between properties
   ```

3. **Mismatched Brackets**
   ```json
   ❌ { "a": [1, 2, 3 } // Array ends with }, should be ]
   ✅ { "a": [1, 2, 3] } // Correct bracket type
   ```

4. **Unquoted Keys**
   ```json
   ❌ { name: "John" }      // Key not quoted
   ✅ { "name": "John" }    // Key quoted
   ```

5. **Single Quotes**
   ```json
   ❌ { 'name': 'John' }    // Single quotes not valid in JSON
   ✅ { "name": "John" }    // Double quotes required
   ```

---

## Online JSON Validators

If you need to validate your JSON:

1. **JSONLint** - https://jsonlint.com/
   - Paste JSON and click "Validate JSON"
   - Shows exact line with error

2. **VS Code**
   - Built-in validation in editor
   - Hover over error squiggles

3. **Command Line**
   ```bash
   python3 -m json.tool scenarios/npc-patrol-lockpick.json
   ```
   Shows "valid" or line with error

---

## Before and After Files

### test-npc-patrol.json (Reference)
- ✅ Correct format
- ✅ All NPCs properly structured
- ✅ `patrol` inside `behavior`
- ✅ No syntax errors

### npc-patrol-lockpick.json (Fixed)
- ✅ Now matches correct format
- ✅ Trailing commas removed
- ✅ `patrol` moved to `behavior`
- ✅ Properties in correct order
- ✅ Ready to use

---

## Quick Fix Checklist

When formatting NPC objects:

- [ ] `behavior` is first major object after basic properties
- [ ] `patrol` is inside `behavior` (not at NPC root)
- [ ] `los` is at NPC root (after `behavior`)
- [ ] `eventMappings` is at NPC root (after `los`)
- [ ] No trailing commas after objects/arrays
- [ ] All properties properly quoted
- [ ] Brackets/braces match (`{}` for objects, `[]` for arrays)
- [ ] Commas between all properties except the last

---

## Testing After Fix

To verify the JSON is valid:

```bash
# In project directory:
python3 -m json.tool scenarios/npc-patrol-lockpick.json

# If valid output:
# (formatted JSON output)

# If error output:
# json.decoder.JSONDecodeError: ... line X column Y
```

If you see "json.decoder.JSONDecodeError", there's a syntax issue at that line/column.
