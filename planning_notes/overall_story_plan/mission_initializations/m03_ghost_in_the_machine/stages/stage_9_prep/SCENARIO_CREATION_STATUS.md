# Mission 3 Scenario Creation Status

**Date:** 2025-12-27
**Task:** Create scenario files for Mission 3 "Ghost in the Machine"
**Status:** IN PROGRESS - Schema Validation Issues Identified

---

## Files Created

### ✅ mission.json
**Location:** `/scenarios/m03_ghost_in_the_machine/mission.json`
**Status:** Complete and committed
**Commit:** `a743d49`

**Contents:**
- Display name: "Ghost in the Machine"
- Difficulty level: 2 (intermediate)
- Collection: season_1
- 6 CyBOK knowledge areas (NS, MAT, AC, HF, SS, RM)
- Complete mission description

**Validation:** No errors (mission.json not validated separately)

---

### ⚠️ scenario.json.erb
**Location:** `/scenarios/m03_ghost_in_the_machine/scenario.json.erb`
**Status:** Created but requires schema fixes
**Commits:**
- `de283bb` - Initial scenario structure
- `9a888c2` - Fix Unicode arrow character
- `f76d90e` - Add JSON escaping for multi-line content
- `ecbbbec` - Backup before restructuring

**Current State:**
- ERB rendering: ✅ Success (no syntax errors)
- JSON validity: ✅ Valid JSON structure
- Schema validation: ❌ 46 validation errors

---

## Validation Results

**Validation Command:**
```bash
ruby scripts/validate_scenario.rb scenarios/m03_ghost_in_the_machine/scenario.json.erb
```

**Summary:**
- ✓ ERB rendered successfully
- ✓ Valid JSON output
- ✗ Schema validation failed with 46 error(s)

### Critical Schema Issues

#### 1. Objectives Structure (4 errors)
**Problem:** Missing required 'order' field on all 4 objectives

**Error Messages:**
```
The property '#/objectives/0' did not contain a required property of 'order'
The property '#/objectives/1' did not contain a required property of 'order'
The property '#/objectives/2' did not contain a required property of 'order'
The property '#/objectives/3' did not contain a required property of 'order'
```

**Current Structure:**
```json
{
  "aimId": "main_mission",
  "title": "Zero Day Intelligence",
  "status": "active",
  "optional": false,
  "aims": [...]
}
```

**Required Structure:**
```json
{
  "aimId": "main_mission",
  "title": "Zero Day Intelligence",
  "status": "active",
  "order": 0,
  "tasks": [...]
}
```

**Additional Issue:** Current structure uses nested "aims" arrays, but schema expects flat objectives with "tasks" arrays directly.

---

#### 2. Room Type Missing (7 rooms × 1 error = 7 errors)
**Problem:** All 7 rooms missing required 'type' field

**Error Messages:**
```
The property '#/rooms/reception_lobby' did not contain a required property of 'type'
The property '#/rooms/main_hallway' did not contain a required property of 'type'
The property '#/rooms/conference_room_01' did not contain a required property of 'type'
...
```

**Valid Room Types (from schema):**
- room_reception
- room_office
- room_ceo
- room_closet
- room_servers
- room_lab
- small_room_1x1gu
- hall_1x2gu

**Fix Needed:**
```json
"reception_lobby": {
  "type": "room_reception",  // ADD THIS
  "name": "Reception Lobby",
  ...
}
```

---

#### 3. Object/Item Types Invalid (~20 errors)
**Problem:** Using custom type values instead of schema enum values

**Invalid Types Used:**
- "container" - Not in schema
- "document" - Not in schema
- "interactable" - Not in schema
- "terminal" - Not in schema
- "computer" - Not in schema
- "usb_device" - Not in schema
- "email" - Not in schema
- "lore_document" - Not in schema

**Valid Item Types (from schema):**
```
notes, notes4, phone, workstation, lab-workstation, lockpick, key, keycard,
pc, tablet, safe, suitcase, bluetooth_scanner, fingerprint_kit, pin-cracker,
vm-launcher, flag-station, text_file, id_badge, rfid_cloner
```

**Example Fix:**
```json
// BEFORE (invalid)
{
  "id": "filing_cabinet",
  "type": "container",
  "contents": [...]
}

// AFTER (valid)
{
  "type": "safe",  // Use closest valid type
  "name": "Filing Cabinet",
  "locked": true,
  "lockType": "lockpick",
  ...
}
```

---

#### 4. NPC Structure Issues (~10 errors)
**Problem:** Using wrong property names for NPCs

**Current (Invalid):**
```json
{
  "id": "receptionist_npc",
  "name": "Receptionist",      // WRONG - should be "displayName"
  "type": "person",             // WRONG - should be "npcType"
  "dialogue_script": "...",     // WRONG - should be "storyPath"
  ...
}
```

**Required (Valid):**
```json
{
  "id": "receptionist_npc",
  "displayName": "Receptionist",    // CORRECT
  "npcType": "person",              // CORRECT (enum: person|phone)
  "storyPath": "...",               // CORRECT
  "position": {"x": 300, "y": 200},
  ...
}
```

---

#### 5. Task Types Missing
**Problem:** Tasks in objectives don't have required 'type' field

**Required Task Types (from schema):**
- enter_room
- npc_conversation
- collect_items
- unlock_room
- unlock_object
- submit_flags
- custom

**Example Fix:**
```json
{
  "taskId": "meet_victoria",
  "title": "Meet Victoria Sterling",
  "description": "...",
  "type": "npc_conversation",  // ADD THIS
  "targetNPC": "victoria_sterling",
  "status": "active"
}
```

---

#### 6. Unsupported Custom Features
**Problem:** Using features not defined in schema

**Unsupported Features Used:**
1. **Room-level `events` arrays** - Not in schema
   ```json
   "events": [
     {
       "id": "operational_logs_spawn",
       "trigger": "task_completed:distcc_exploit",
       ...
     }
   ]
   ```

2. **Room-level `dialogue_triggers` arrays** - Not in schema
   ```json
   "dialogue_triggers": [
     {
       "id": "james_moral_choice",
       "trigger": "variable:james_innocence_confirmed == true",
       ...
     }
   ]
   ```

3. **Top-level `phone_contacts` array** - Not in schema
   ```json
   "phone_contacts": [...]
   ```

4. **Top-level `mission_events` array** - Not in schema
   ```json
   "mission_events": [...]
   ```

5. **Top-level `global_variables` object** - Schema uses `globalVariables` (camelCase)
   ```json
   "global_variables": {...}  // WRONG
   "globalVariables": {...}   // CORRECT
   ```

6. **Custom object properties:**
   - `contents` arrays - Not in schema
   - `examination_text` - Not in schema
   - `position` as `{"x": 3, "y": 2}` for objects - Schema uses pixel coordinates for NPCs only

**Workaround:**
- Use NPC `eventMappings` for event-driven dialogue
- Use `timedConversation` for scripted events
- Phone contacts should be NPCs with `npcType: "phone"`
- Room events may need to be handled via NPC eventMappings

---

## Working Examples from M2

### Correct Objective Structure
```json
{
  "aimId": "infiltrate_hospital",
  "title": "Infiltrate Hospital",
  "description": "Enter hospital and meet key staff",
  "status": "active",
  "order": 0,
  "tasks": [
    {
      "taskId": "arrive_at_hospital",
      "title": "Arrive at hospital reception",
      "type": "enter_room",
      "targetRoom": "reception_lobby",
      "status": "active"
    },
    {
      "taskId": "meet_dr_kim",
      "title": "Meet Dr. Sarah Kim",
      "type": "npc_conversation",
      "targetNPC": "dr_sarah_kim",
      "status": "locked"
    }
  ]
}
```

### Correct Room Structure
```json
"reception_lobby": {
  "type": "room_reception",
  "dimensions": {
    "width": 15,
    "height": 12
  },
  "connections": {
    "north": "hallway_north",
    "east": "it_department"
  },
  "npcs": [
    {
      "id": "receptionist",
      "displayName": "Hospital Receptionist",
      "npcType": "person",
      "position": {"x": 600, "y": 500},
      "spriteSheet": "hacker-red",
      "interactionType": "simple_dialogue",
      "dialogue": "Welcome to the hospital."
    }
  ],
  "objects": [
    {
      "type": "notes",
      "name": "Visitor Log",
      "takeable": false,
      "readable": true,
      "text": "Visitor log content...",
      "observations": "Notes about the log"
    },
    {
      "type": "safe",
      "name": "Emergency Equipment Safe",
      "takeable": false,
      "locked": true,
      "lockType": "pin",
      "keyPins": [1, 9, 8, 7],
      "difficulty": "medium",
      "observations": "4-digit PIN safe",
      "itemsHeld": [
        {
          "type": "keycard",
          "name": "Offline Backup Encryption Keys",
          "takeable": true
        }
      ]
    }
  ]
}
```

### Correct NPC Structure (Phone Contact)
```json
{
  "id": "agent_0x99",
  "displayName": "Agent 0x99",
  "npcType": "phone",
  "storyPath": "scenarios/m02_ransomed_trust/ink/m02_phone_agent0x99.json",
  "avatar": "assets/npc/avatars/npc_helper.png",
  "phoneId": "player_phone",
  "currentKnot": "first_call",
  "eventMappings": [
    {
      "eventPattern": "room_entered:server_room",
      "targetKnot": "event_server_room_entered",
      "onceOnly": true
    }
  ]
}
```

---

## Required Restructuring Work

### High Priority (Blocking)

1. **Flatten objectives structure**
   - Convert nested "aims" to top-level objectives
   - Add "order" field to each objective (0, 1, 2, 3...)
   - Move tasks from aims to direct objective children

2. **Add missing required fields**
   - Add "type" to all tasks
   - Add "type" to all rooms
   - Convert NPC "name" → "displayName"
   - Convert NPC "type" → "npcType"

3. **Fix object types**
   - Replace "container" with appropriate valid types (safe, suitcase, etc.)
   - Replace "document" with "notes" or "text_file"
   - Replace "terminal" with "workstation", "pc", or "vm-launcher"
   - Replace "computer" with "pc"
   - Remove "interactable" objects or convert to valid types

### Medium Priority (Quality)

4. **Refactor custom features**
   - Move room-level events to NPC eventMappings
   - Convert phone_contacts to regular NPCs with npcType: "phone"
   - Convert mission_events to NPC eventMappings
   - Rename global_variables → globalVariables

5. **Simplify object structure**
   - Remove nested "contents" arrays
   - Use "itemsHeld" array for containers
   - Remove custom properties not in schema (examination_text, decoded_text, etc.)
   - Use "observations" and "text" fields appropriately

### Low Priority (Enhancement)

6. **Add recommended fields**
   - Consider adding `startItemsInInventory` with phone, lockpick, rfid_cloner
   - Add `player` configuration object
   - Improve NPC sprite configurations

---

## Estimated Restructuring Effort

**Time Estimate:** 4-6 hours

**Breakdown:**
1. Objectives restructuring: 1-1.5 hours
2. Room type additions: 30 minutes
3. Object type conversions: 1-2 hours
4. NPC structure fixes: 1 hour
5. Custom feature refactoring: 1-1.5 hours
6. Testing and validation fixes: 30-45 minutes

---

## Next Steps

### Option 1: Complete Restructure (Recommended)
1. Study M2 scenario.json.erb structure in detail
2. Create simplified M3 scenario matching M2 patterns
3. Focus on core functionality first (basic objectives, rooms, NPCs)
4. Validate incrementally after each major section
5. Expand with advanced features once core validates

### Option 2: Incremental Fixes
1. Fix objectives (add order, flatten structure)
2. Run validation → fix next batch of errors
3. Repeat until validation passes
4. May take longer but preserves more custom features

### Option 3: Minimal Viable Scenario
1. Create bare minimum scenario with just:
   - 3-4 core objectives
   - 3-4 essential rooms
   - 2-3 key NPCs
   - Simplified objects
2. Get validation passing quickly
3. Iterate and expand later

---

## Files for Reference

**Schema Definition:**
- `/scripts/scenario-schema.json` - Complete schema specification

**Working Examples:**
- `/scenarios/m02_ransomed_trust/scenario.json.erb` - Complete working M2 scenario
- `/scenarios/m02_ransomed_trust/mission.json` - M2 mission metadata

**M3 Planning Documents:**
- `/stages/stage_4/objectives.json` - Original M3 objectives structure
- `/stages/stage_5/room_design.md` - Complete M3 room specifications
- `/stages/stage_7/*.json` - 9 compiled Ink dialogue scripts
- `/stages/stage_9_prep/IMPLEMENTATION_ROADMAP.md` - Implementation guide

---

## Current Commit History

```
ecbbbec - Backup scenario.json.erb before schema restructuring
f76d90e - Add JSON escaping for multi-line content strings
9a888c2 - Fix Unicode arrow character in operational log content
de283bb - Add Mission 3 scenario structure (scenario.json.erb)
a743d49 - Add Mission 3 metadata (mission.json)
```

---

## Conclusion

**Status:** Mission 3 scenario files created but require schema compliance fixes

**Immediate Next Action:** Choose restructuring approach (Option 1, 2, or 3) and begin systematic schema compliance work

**Blocker:** 46 schema validation errors must be resolved before scenario can be used in game

**Estimated Time to Working Scenario:** 4-6 hours of focused restructuring work

---

**Document Created:** 2025-12-27
**Last Updated:** 2025-12-27
**Status:** SCENARIO CREATION IN PROGRESS - SCHEMA FIXES REQUIRED
