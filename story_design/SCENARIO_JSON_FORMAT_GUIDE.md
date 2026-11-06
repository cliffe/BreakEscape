# Scenario JSON Format Guide

**CRITICAL:** This document defines the correct format for scenario.json.erb files based on the existing codebase structure. ALL scenario development prompts must reference this guide.

---

## Directory Structure

```
scenarios/
└── scenario_name/
    ├── mission.json         # Metadata, display info, CyBOK mappings
    ├── scenario.json.erb    # Game world structure (THIS FILE'S FORMAT)
    └── ink/
        ├── script1.ink      # Source Ink files
        ├── script1.json     # Compiled Ink files (from inklecate)
        └── ...
```

---

## Top-Level Structure

### Required Fields

```json
{
  "scenario_brief": "Short description of scenario",
  "startRoom": "room_id_string",
  "startItemsInInventory": [ /* array of items */ ],
  "player": { /* player config */ },
  "rooms": { /* OBJECT not array */ },
  "globalVariables": { /* shared Ink variables */ }
}
```

### WHAT NOT TO INCLUDE

**These belong in mission.json, NOT scenario.json.erb:**
- ❌ `scenarioId`, `title`, `description` (mission metadata)
- ❌ `difficulty`, `estimatedDuration` (mission metadata)
- ❌ `entropy_cell`, `tags`, `version`, `created` (mission metadata)
- ❌ `metadata` object (mission metadata)

**These should be inline, not separate registries:**
- ❌ `locks` registry (locks are inline on rooms/containers)
- ❌ `items` registry (items are inline in containers)
- ❌ `lore_fragments` array (LORE are items in containers)
- ❌ `ink_scripts` object (discovered via NPC references)

**These are planning metadata, not game data:**
- ❌ `hybrid_integration`, `success_criteria`, `assembly_info`

### WHAT TO INCLUDE

**Core game structure (required):**
- ✅ `scenario_brief` - Short description
- ✅ `startRoom` - Starting room ID
- ✅ `startItemsInInventory` - Initial player items
- ✅ `player` - Player configuration
- ✅ `rooms` - Room definitions (object format)
- ✅ `globalVariables` - Shared Ink variables

**Optional but recommended:**
- ✅ `objectives` - Aims and tasks (see [docs/OBJECTIVES_AND_TASKS_GUIDE.md](../docs/OBJECTIVES_AND_TASKS_GUIDE.md))
- ✅ `endGoal` - Mission end condition description
- ✅ `phoneNPCs` - Phone-only NPCs (if any)

---

## Objectives System (Optional)

Objectives define aims (goals) and tasks that players complete. Controlled via Ink tags.

### Format

```json
"objectives": [
  {
    "aimId": "tutorial",
    "title": "Complete the Tutorial",
    "description": "Learn the basics",
    "status": "active",
    "order": 0,
    "tasks": [
      {
        "taskId": "explore_reception",
        "title": "Explore the reception area",
        "type": "enter_room",
        "targetRoom": "reception",
        "status": "active"
      },
      {
        "taskId": "collect_key",
        "title": "Find the key",
        "type": "collect_items",
        "targetItems": ["key"],
        "targetCount": 1,
        "currentCount": 0,
        "status": "locked",
        "showProgress": true
      }
    ]
  }
]
```

### Task Types

- `enter_room` - Player enters a specific room
- `collect_items` - Player collects specific items
- `unlock_room` - Player unlocks a room
- `unlock_object` - Player unlocks a container/safe

### Controlling from Ink

```ink
=== complete_tutorial ===
Great job! Tutorial complete.
#complete_task:explore_reception
#unlock_task:collect_key
-> hub
```

**See:** [docs/OBJECTIVES_AND_TASKS_GUIDE.md](../docs/OBJECTIVES_AND_TASKS_GUIDE.md)

---

## Rooms Format

### ✅ CORRECT - Object/Dictionary

```json
"rooms": {
  "room_id": {
    "type": "room_office",
    "connections": {
      "north": "other_room_id",
      "south": "another_room"
    },
    "npcs": [ /* NPCs in this room */ ],
    "objects": [ /* Interactive objects */ ]
  }
}
```

### ❌ INCORRECT - Array Format

```json
"rooms": [
  {
    "id": "room_id",     // DON'T DO THIS
    "type": "room_office",
    ...
  }
]
```

---

## Room Connections

### ✅ CORRECT - Simple Format

```json
"connections": {
  "north": "single_room_id",
  "south": ["room1", "room2"]  // Multiple connections as array
}
```

**IMPORTANT: Valid Directions Only**

Only **cardinal directions** are valid:
- ✅ `north`, `south`, `east`, `west`
- ❌ `northeast`, `northwest`, `southeast`, `southwest` (NOT VALID)

**Bidirectional Connections Required:**

If Room A connects north to Room B, then Room B MUST connect south back to Room A:

```json
// Room A
"connections": { "north": "room_b" }

// Room B (must connect back)
"connections": { "south": "room_a" }
```

**Common Mistake - Diagonal Directions:**
```json
// ❌ WRONG - diagonal directions not valid
"connections": {
  "southeast": "break_room",     // NOT VALID
  "northwest": "storage_closet"  // NOT VALID
}

// ✅ CORRECT - use arrays for multiple rooms in same direction
"connections": {
  "south": ["reception_area", "break_room"],
  "north": ["derek_office", "storage_closet"]
}
```

### ❌ INCORRECT - Complex Array Format

```json
"connections": [
  {
    "direction": "north",      // DON'T DO THIS
    "to_room": "room_id",
    "door_type": "open"
  }
]
```

---

## Locks - Inline Definition

### ✅ CORRECT - Inline on Room/Container

```json
{
  "type": "room_office",
  "locked": true,
  "lockType": "key",
  "requires": "office_key",
  "keyPins": [45, 35, 25, 55],
  "difficulty": "medium"
}
```

### ❌ INCORRECT - Separate Registry

```json
"locks": [               // DON'T CREATE THIS
  {
    "id": "office_lock",
    "type": "key",
    ...
  }
]
```

---

## NPCs - In Room Arrays

### ✅ CORRECT - NPCs in Room

```json
"rooms": {
  "office": {
    "npcs": [
      {
        "id": "npc_id",
        "displayName": "NPC Name",
        "npcType": "person",
        "position": { "x": 5, "y": 3 },
        "spriteSheet": "hacker",
        "storyPath": "scenarios/mission_name/ink/script.json",
        "currentKnot": "start",
        "itemsHeld": [
          {
            "id": "item_key_001",
            "type": "key",
            "name": "Office Key",
            "takeable": true,
            "observations": "A brass office key"
          }
        ]
      }
    ]
  }
}
```

**IMPORTANT: Item Types for #give_item Tags**

Items that NPCs give via Ink `#give_item:tag_param` tags **MUST**:
1. Have a `type` field matching the tag parameter
2. Be in the NPC's `itemsHeld` array
3. **NOT** have an `id` field (the `type` field is what matters)

```ink
// In NPC Ink script
=== give_badge ===
Here's your visitor badge.
#give_item:visitor_badge
-> hub
```

```json
// In scenario.json.erb - NPC must hold this item
"itemsHeld": [
  {
    "type": "visitor_badge",  // Must match Ink tag parameter!
    "name": "Visitor Badge",
    "takeable": true,
    "observations": "Temporary access badge"
  }
]
```

**Common Mistakes:**
- ❌ Adding an `id` field - items should NOT have id fields
- ❌ Using wrong `type` - the type must match the #give_item parameter exactly
- ❌ Using generic types like "keycard" when the tag uses specific names like "visitor_badge"

### Timed Conversations (Auto-Start Cutscenes)

Use `timedConversation` to auto-start dialogue when player enters room:

```json
{
  "id": "briefing_cutscene",
  "displayName": "Agent 0x99",
  "npcType": "person",
  "position": { "x": 5, "y": 5 },
  "spriteSheet": "hacker",
  "storyPath": "scenarios/mission/ink/opening_briefing.json",
  "currentKnot": "start",
  "timedConversation": {
    "delay": 0,
    "targetKnot": "start",
    "background": "assets/backgrounds/hq1.png"
  }
}
```

**Common uses:**
- Opening mission briefings (delay: 0 in starting room)
- Cutscenes when entering specific rooms
- Background can show different location (e.g., HQ for briefings)

### VM Launchers and Flag Stations

**IMPORTANT:** For scenarios that integrate with SecGen VMs, use proper `vm-launcher` and `flag-station` types.

**Reference Example:** `scenarios/secgen_vm_lab/scenario.json.erb`

#### VM Launcher Configuration

Use `type: "vm-launcher"` to create terminals that launch VMs:

```json
{
  "type": "vm-launcher",
  "id": "vm_launcher_intro_linux",
  "name": "VM Access Terminal",
  "takeable": false,
  "observations": "Terminal providing access to compromised infrastructure",
  "hacktivityMode": <%= vm_context && vm_context['hacktivity_mode'] ? 'true' : 'false' %>,
  "vm": <%= vm_object('intro_to_linux_security_lab', {
    "id": 1,
    "title": "Target Server",
    "ip": "192.168.100.50",
    "enable_console": true
  }) %>
}
```

**Key fields:**
- `type: "vm-launcher"` - Required object type
- `hacktivityMode` - ERB expression for Hacktivity integration
- `vm` - ERB helper `vm_object(vm_name, config)` specifies which VM to launch

#### Flag Station Configuration

Use `type: "flag-station"` for terminals that accept VM flags:

```json
{
  "type": "flag-station",
  "id": "flag_station_dropsite",
  "name": "SAFETYNET Drop-Site Terminal",
  "takeable": false,
  "observations": "Secure terminal for submitting VM flags",
  "acceptsVms": ["intro_to_linux_security_lab"],
  "flags": <%= flags_for_vm('intro_to_linux_security_lab', [
    'flag{ssh_brute_force_success}',
    'flag{linux_navigation_complete}',
    'flag{privilege_escalation_success}'
  ]) %>,
  "flagRewards": [
    {
      "type": "emit_event",
      "event_name": "ssh_flag_submitted",
      "description": "SSH access flag submitted"
    },
    {
      "type": "give_item",
      "item_name": "Server Access Card",
      "description": "Unlocked new access"
    },
    {
      "type": "unlock_door",
      "target_room": "secure_area",
      "description": "Door unlocked"
    }
  ]
}
```

**Key fields:**
- `type: "flag-station"` - Required object type
- `acceptsVms` - Array of VM names this station accepts flags from
- `flags` - ERB helper `flags_for_vm(vm_name, flag_array)` configures accepted flags
- `flagRewards` - Array of rewards given for each flag (in order)

**Reward types:**
- `emit_event` - Triggers game event (can trigger Ink via phone NPC event mappings)
- `give_item` - Adds item to player inventory
- `unlock_door` - Unlocks a specific room
- `reveal_secret` - Shows hidden information

**Common Mistakes:**
- ❌ Using `type: "pc"` with `vmAccess: true` - use `type: "vm-launcher"` instead
- ❌ Creating Ink dialogue for flag submission - use `type: "flag-station"` instead
- ❌ Hardcoding flags without ERB helpers - use `flags_for_vm()` helper
- ❌ Forgetting `acceptsVms` array - station won't accept any flags

### ❌ INCORRECT - Top-Level NPCs

```json
"npcs": [               // DON'T PUT AT TOP LEVEL
  {
    "id": "npc_id",
    "spawn_room": "office",  // Except phone NPCs
    ...
  }
]
```

**Exception:** Phone NPCs can be at top level or in a separate `phoneNPCs` array.

### Phone NPCs with Event Mappings

Phone NPCs can automatically trigger conversations based on game events:

```json
"phoneNPCs": [
  {
    "id": "handler_npc",
    "displayName": "Agent Handler",
    "npcType": "phone",
    "storyPath": "scenarios/mission/ink/handler.json",
    "avatar": "assets/npc/avatars/npc_helper.png",
    "phoneId": "player_phone",
    "currentKnot": "start",
    "eventMappings": [
      {
        "eventPattern": "item_picked_up:important_item",
        "targetKnot": "event_item_found",
        "onceOnly": true
      },
      {
        "eventPattern": "room_entered:secret_room",
        "targetKnot": "event_room_discovered",
        "onceOnly": true
      },
      {
        "eventPattern": "global_variable_changed:mission_complete",
        "targetKnot": "debrief_start",
        "condition": "value === true",
        "onceOnly": true
      }
    ]
  }
]
```

**Event Pattern Types:**
- `item_picked_up:item_id` - Triggers when player picks up an item
- `room_entered:room_id` - Triggers when player enters a room
- `global_variable_changed:variable_name` - Triggers when a global variable changes
- `task_completed:task_id` - Triggers when a task completes (if using objectives system)

**Common Pattern: Mission Debrief**

Use global variable trigger for mission end:

```ink
// In final mission script (e.g., boss_confrontation.ink)
VAR mission_complete = false

=== mission_end ===
Mission complete!

~ mission_complete = true
#exit_conversation

-> END
```

```json
// In scenario.json.erb phoneNPCs
{
  "id": "debrief_trigger",
  "eventMappings": [{
    "eventPattern": "global_variable_changed:mission_complete",
    "targetKnot": "start",
    "condition": "value === true",
    "onceOnly": true
  }]
}
```

---

## Objects and Containers

### ✅ CORRECT - Objects in Room

```json
"rooms": {
  "office": {
    "objects": [
      {
        "type": "safe",
        "name": "Office Safe",
        "takeable": false,
        "locked": true,
        "lockType": "key",
        "requires": "lockpick",
        "difficulty": "medium",
        "contents": [
          {
            "type": "notes",
            "name": "Document",
            "takeable": true,
            "readable": true,
            "text": "Content here"
          }
        ]
      }
    ]
  }
}
```

### ❌ INCORRECT - Separate Containers Array

```json
"containers": [         // DON'T CREATE THIS
  {
    "id": "office_safe",
    "room": "office",
    ...
  }
]
```

---

## Global Variables - For Ink Scripts

### Purpose

Global variables are shared across all NPCs and automatically synced by the game system. Use for:
- Cross-NPC narrative state
- Mission progress flags
- Player choices that affect multiple NPCs

### Declaration

**In scenario.json.erb:**

```json
"globalVariables": {
  "player_name": "Agent 0x00",
  "mission_complete": false,
  "npc_trust_level": 0,
  "flag_submitted": false
}
```

**In Ink files:**

```ink
// Declare with VAR, NOT EXTERNAL
VAR player_name = "Agent 0x00"
VAR mission_complete = false

=== check_status ===
{mission_complete:
  You already finished this!
- else:
  Let's get started, {player_name}.
}
```

### ❌ INCORRECT - Using EXTERNAL

```ink
EXTERNAL player_name()      // DON'T DO THIS
EXTERNAL mission_complete()  // Game doesn't provide EXTERNAL functions
```

**Why This Is Wrong:**
- EXTERNAL is for functions provided by the game engine
- Regular variables should use VAR with globalVariables sync
- See [docs/GLOBAL_VARIABLES.md](../docs/GLOBAL_VARIABLES.md)

---

## Player Configuration

```json
"player": {
  "id": "player",
  "displayName": "Agent 0x00",
  "spriteSheet": "hacker",
  "spriteTalk": "assets/characters/hacker-talk.png",
  "spriteConfig": {
    "idleFrameStart": 20,
    "idleFrameEnd": 23
  }
}
```

---

## Compiled Ink Script Paths

Ink scripts must be compiled to JSON before use.

**Correct path format:**

```json
"storyPath": "scenarios/mission_name/ink/script_name.json"
```

**Compilation command:**

```bash
bin/inklecate -jo scenarios/mission_name/ink/script.json scenarios/mission_name/ink/script.ink
```

---

## Common Mistakes

### 1. Using Arrays Instead of Objects

**Problem:** `"rooms": [ {...} ]` instead of `"rooms": { "id": {...} }`

**Fix:** Use object/dictionary format for rooms

### 2. Complex Connection Objects

**Problem:** `"connections": [ { "direction": "north", "to_room": "..." } ]`

**Fix:** Use simple `"connections": { "north": "room_id" }`

### 3. Top-Level Registries

**Problem:** Creating separate `"locks"`, `"items"`, `"containers"` arrays

**Fix:** Define inline where used (locks on doors/containers, items in containers, containers as room objects)

### 4. EXTERNAL Instead of VAR

**Problem:** `EXTERNAL variable_name()` in Ink

**Fix:** Use `VAR variable_name = default` and add to `globalVariables` in scenario.json.erb

### 5. Metadata in scenario.json.erb

**Problem:** Including mission metadata like `difficulty`, `cybok`, `display_name`

**Fix:** Put these in mission.json

---

## Reference Examples

**Good examples to copy:**
- `scenarios/ceo_exfil/scenario.json.erb`
- `scenarios/npc-sprite-test3/scenario.json.erb`

**Documentation:**
- [docs/GLOBAL_VARIABLES.md](../docs/GLOBAL_VARIABLES.md) - How global variables work
- [docs/INK_BEST_PRACTICES.md](../docs/INK_BEST_PRACTICES.md) - Ink scripting guide

---

## Validation Checklist

Before finalizing a scenario.json.erb:

- [ ] Rooms use object format, not array
- [ ] Connections use simple format (string or string array)
- [ ] NPCs are in room arrays (except phone NPCs)
- [ ] Objects are in room arrays
- [ ] Locks are inline on rooms/containers
- [ ] No top-level registries (locks, items, containers, lore_fragments)
- [ ] globalVariables section exists for Ink variable sync
- [ ] Ink files use VAR, not EXTERNAL
- [ ] All paths use `scenarios/mission_name/ink/script.json` format
- [ ] Mission metadata is in mission.json, not scenario.json.erb
- [ ] Player object is defined
- [ ] startRoom and startItemsInInventory are present

---

**Last Updated:** 2025-12-01
**Maintained by:** Claude Code Scenario Development Team
