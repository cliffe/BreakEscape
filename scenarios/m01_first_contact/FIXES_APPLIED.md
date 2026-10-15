# Mission 1: First Contact - Fixes Applied

**Date:** 2025-12-01
**Status:** ✅ All Critical Issues Resolved
**Latest Fix:** 2025-12-01 - Added lock type variety by converting safes to PIN codes

---

## Issues Found and Fixed

### Issue #10: Lack of Lock Type Variety

**Problem:** All locks used keys/lockpick - gameplay became repetitive and "same-y"

**User Feedback:** "The player is given a lock pick quite early so never experiences doors that they can't get through soon. All the doors and safes etc use keys -- change the safes to use PINs that the player needs to discover/reveal."

**Root Cause:** All 3 safes used `lockType: "key"` with lockpick - no variety in puzzle types

**Fix Applied:**
- **Storage Safe** → PIN code `1337` with hint in maintenance checklist
- **Main Office Filing Cabinet** → PIN code `2024` with hint on sticky note
- **Derek's Filing Cabinet** → PIN code `0419` discovered by decoding Base64 message

**Lock Type Variety Now:**
1. **Storage closet door** - lockpick (tutorial)
2. **Storage safe** - PIN `1337` (easy puzzle - hint nearby)
3. **Main office filing cabinet** - PIN `2024` (medium puzzle - requires reading sticky note)
4. **Derek's office door** - key (from storage safe)
5. **Derek's filing cabinet** - PIN `0419` (harder puzzle - requires CyberChef to decode Base64)
6. **Server room door** - RFID keycard (different lock type)

**Files Changed:**
- `scenarios/m01_first_contact/scenario.json.erb` - Converted 3 safes to PIN locks, added hint documents
- Updated `client_list_message` variable to include PIN hint for Derek's safe

**Progression Design:**
- Player must use lockpick tutorial first (storage closet)
- Find PIN hints through exploration and reading documents
- Use CyberChef terminal to decode Base64 for final safe PIN
- Creates varied puzzle-solving experience instead of just lockpicking everything

**FURTHER UPDATE - Lock Progression Enforcement:**

**User Feedback:** "Once the player has access to a lockpick, then they don't need any keys, so if we want to include traditional key based access, then those need to happen before they get the lockpick. Keys shouldn't be in same room as door. Must ensure valid path to completion and logical puzzle ordering."

**Additional Fixes:**
- Storage closet door changed from `locked: true, requires: lockpick` → `locked: false`
- Moved maintenance checklist from storage closet to main office (hint accessible first)
- Kevin's lockpick dialogue updated: requires `influence >= 8` (was: immediate after meeting)
- Ensures key-based puzzles MUST be solved before lockpick is obtained

**Final Progression Flow:**
1. Main office → find hints (sticky note PIN 2024, maintenance checklist PIN 1337)
2. Use PIN 2024 on main office filing cabinet → The Architect's Letter (LORE, optional)
3. Use PIN 1337 on storage safe → Derek's office key
4. Use key on Derek's office door → enter Derek's office ✅ **KEY USED BEFORE LOCKPICK**
5. Decode Base64 message with CyberChef → PIN 0419
6. Use PIN 0419 on Derek's filing cabinet → campaign evidence
7. Build rapport with Kevin (influence >= 8) → NOW get lockpick
8. Get RFID keycard from Kevin → access server room

**Progression Enforcement:**
- Keys used for critical path BEFORE lockpick obtainable ✅
- Keys not in same room as locks (storage safe → Derek's office) ✅
- Logical puzzle ordering (easy → medium → hard) ✅
- Valid completion path ensured ✅

---

### Issue #9: Derek's Ink File Path Incorrect

**Problem:** Derek NPC's storyPath pointed to non-existent file `m01_npc_derek.json`

**Error:** `GET /break_escape/games/112/ink?npc=derek_lawson 404 (Not Found)`

**Root Cause:** Filename mismatch - actual file is `m01_derek_confrontation.json`

**Fix Applied:**
- Changed storyPath from `m01_npc_derek.json` to `m01_derek_confrontation.json`
- Now correctly points to the compiled Derek confrontation Ink script

**Files Changed:**
- `scenarios/m01_first_contact/scenario.json.erb` - Updated Derek NPC storyPath

**Correct Configuration:**
```json
{
  "id": "derek_lawson",
  "displayName": "Derek Lawson",
  "npcType": "person",
  "storyPath": "scenarios/m01_first_contact/ink/m01_derek_confrontation.json",
  "currentKnot": "start"
}
```

---

### Issue #8: Phone NPCs in Separate Array

**Problem:** Phone NPCs were in separate `phoneNPCs` array instead of in room `npcs` arrays

**Validation Error:** "Phone NPCs should be defined in 'rooms/{room_id}/npcs[]' arrays, NOT in a separate 'phoneNPCs' section"

**Root Cause:** Misunderstood NPC placement - all NPCs (including phone NPCs) should be in room arrays

**Fix Applied:**
- Moved `agent_0x99` and `closing_debrief_trigger` from `phoneNPCs` array to `reception_area.npcs` array
- Removed separate `phoneNPCs` section entirely
- Phone NPCs now properly defined alongside person NPCs in starting room

**Files Changed:**
- `scenarios/m01_first_contact/scenario.json.erb` - Moved phone NPCs to room arrays

**Correct Format:**
```json
"rooms": {
  "reception_area": {
    "npcs": [
      // Person NPCs
      { "id": "sarah_martinez", "npcType": "person", ... },

      // Phone NPCs (same array!)
      { "id": "agent_0x99", "npcType": "phone", "phoneId": "player_phone", ... }
    ]
  }
}
```

**Validation Tool:** Caught by `ruby scripts/validate_scenario.rb`

---

### Issue #7: Invalid Room Connections (Diagonal Directions)

**Problem:** Rooms used invalid diagonal directions (southeast, northwest) making some rooms inaccessible

**User Feedback:** "Some of the rooms aren't accessible -- the break_room and storage_closet aren't connected to the other rooms"

**Root Cause:**
- Used invalid diagonal directions like "southeast" and "northwest"
- Only north, south, east, west are valid directions
- Reverse connections weren't using valid cardinal directions

**Fix Applied:**
- Removed diagonal directions (southeast, northwest) from main_office_area
- Multiple rooms already in array format: `"south": ["reception_area", "break_room"]`
- Fixed break_room reverse connection from "northwest" to "north"
- storage_closet already had correct "south" connection

**Files Changed:**
- `scenarios/m01_first_contact/scenario.json.erb` - Fixed room connections

**Valid Directions:** Only **north, south, east, west**

**Valid Format Examples:**
```json
// Single room
"connections": { "north": "room_id" }

// Multiple rooms in same direction (use array)
"connections": { "south": ["room_a", "room_b"] }

// ❌ INVALID - diagonal directions
"connections": { "southeast": "room_id" }  // NOT VALID
```

**Bidirectional Connections Required:**
```json
// main_office_area connects north to storage_closet
"connections": { "north": ["derek_office", "storage_closet"] }

// storage_closet must connect south back to main_office_area
"connections": { "south": "main_office_area" }  // NOT "southwest"!
```

---

### Issue #6: Incorrect VM Launcher and Flag Station Configuration

**Problem:** VM terminal used wrong object type (`type: "pc"` with `vmAccess`) instead of proper `vm-launcher` type

**User Feedback:** "The scenario seems to be missing the vm launchers and flag drop sites, this should have been incorporated into the scenario"

**Root Cause:** Used incorrect configuration format - should reference `scenarios/secgen_vm_lab` example

**Fix Applied:**
- Changed VM Access Terminal from `type: "pc"` to `type: "vm-launcher"`
- Added proper `hacktivityMode` and `vm` object using ERB helper `vm_object()`
- Changed Drop-Site Terminal from Ink dialogue to `type: "flag-station"`
- Added `acceptsVms`, `flags`, and `flagRewards` arrays
- Uses ERB helper `flags_for_vm()` to configure accepted flags
- Removed manual Ink dialogue script for flag submission

**Files Changed:**
- `scenarios/m01_first_contact/scenario.json.erb` - Updated server_room terminals

**Before (Incorrect):**
```json
{
  "type": "pc",
  "name": "VM Access Terminal",
  "vmAccess": true,
  "vmScenario": "intro_to_linux_security_lab"
}
```

**After (Correct):**
```json
{
  "type": "vm-launcher",
  "id": "vm_launcher_intro_linux",
  "name": "VM Access Terminal",
  "hacktivityMode": <%= vm_context && vm_context['hacktivity_mode'] ? 'true' : 'false' %>,
  "vm": <%= vm_object('intro_to_linux_security_lab', {...}) %>
}
```

**Flag Station Configuration:**
```json
{
  "type": "flag-station",
  "id": "flag_station_dropsite",
  "name": "SAFETYNET Drop-Site Terminal",
  "acceptsVms": ["intro_to_linux_security_lab"],
  "flags": <%= flags_for_vm('intro_to_linux_security_lab', [...]) %>,
  "flagRewards": [
    {"type": "emit_event", "event_name": "ssh_flag_submitted"},
    {"type": "emit_event", "event_name": "navigation_flag_submitted"},
    {"type": "emit_event", "event_name": "sudo_flag_submitted"}
  ]
}
```

---

### Issue #1: Missing Opening Briefing Cutscene

**Problem:** Opening briefing Ink script existed but wasn't configured to auto-start

**User Feedback:** "The NPC opening briefing doesn't start, it needs to be on a timed conversation delay 0"

**Root Cause:** No NPC with `timedConversation` configured in starting room

**Fix Applied:**
- Added `briefing_cutscene` NPC to reception_area
- Configured with `timedConversation` (delay: 0, targetKnot: "start")
- Set background to `assets/backgrounds/hq1.png` to show briefing occurs at HQ
- Links to `m01_opening_briefing.json` Ink script

**File Changed:** `scenarios/m01_first_contact/scenario.json.erb`

```json
{
  "id": "briefing_cutscene",
  "displayName": "Agent 0x99",
  "timedConversation": {
    "delay": 0,
    "targetKnot": "start",
    "background": "assets/backgrounds/hq1.png"
  },
  "storyPath": "scenarios/m01_first_contact/ink/m01_opening_briefing.json"
}
```

---

### Issue #2: Missing Closing Debrief Trigger

**Problem:** Closing debrief Ink script existed but had no trigger mechanism

**User Feedback:** "The closing conversation can be triggered by an event, such as an objective being complete, item collected, door unlocked, etc, or via ink"

**Root Cause:** No phone NPC event mapping to trigger debrief after Derek confrontation

**Fix Applied:**
1. Added `derek_confronted` global variable to scenario.json.erb
2. Added `phoneNPCs` section with two NPCs:
   - `agent_0x99`: Handler with event mappings for item pickups and room entries
   - `closing_debrief_trigger`: Triggers when `derek_confronted` becomes true
3. Updated `m01_derek_confrontation.ink` to set `derek_confronted = true` at all 3 ending paths
4. Added `#exit_conversation` tag before each END

**Files Changed:**
- `scenarios/m01_first_contact/scenario.json.erb` - Added phoneNPCs section
- `scenarios/m01_first_contact/ink/m01_derek_confrontation.ink` - Added variable setting
- Recompiled: `m01_derek_confrontation.json`

```json
"phoneNPCs": [
  {
    "id": "closing_debrief_trigger",
    "displayName": "Agent 0x99",
    "npcType": "phone",
    "storyPath": "scenarios/m01_first_contact/ink/m01_closing_debrief.json",
    "eventMappings": [{
      "eventPattern": "global_variable_changed:derek_confronted",
      "targetKnot": "start",
      "condition": "value === true",
      "onceOnly": true
    }]
  }
]
```

```ink
// In m01_derek_confrontation.ink - added before each END
~ derek_confronted = true
#exit_conversation
```

---

### Issue #3: Incorrect Item Type for #give_item Tags

**Problem:** NPCs' items used wrong `type` field values - #give_item tags reference `type`, not `id`

**User Feedback:**
- "NPC sarah_martinez doesn't have id_badge. An NPC must hold the items they give away"
- "Still says sarah_martinez doesn't hold id_badge -- maybe it needs to be specified in the give by the type 'keycard'"

**Root Cause:** Misunderstood how #give_item tags work:
- Items should NOT have `id` fields
- The `#give_item:parameter` tag references the item's `type` field
- We incorrectly added `id` fields and used wrong types

**Fix Applied:**
- Removed ALL `id` fields from NPC items
- Changed item types to match #give_item tag parameters:
  - Sarah: `id_badge` - changed type from "keycard" to "id_badge"
  - Kevin: `lockpick` - type already correct
  - Kevin: `rfid_cloner` - changed type from "tool" to "rfid_cloner"
- Updated SCENARIO_JSON_FORMAT_GUIDE.md with correct pattern

**Files Changed:**
- `scenarios/m01_first_contact/scenario.json.erb` - Fixed item types, removed id fields
- `story_design/SCENARIO_JSON_FORMAT_GUIDE.md` - Corrected documentation

```json
// ✅ CORRECT - Item type matches Ink tag parameter
"itemsHeld": [
  {
    "type": "id_badge",  // Matches #give_item:id_badge
    "name": "Visitor Badge",
    "takeable": true
  }
]
```

```ink
// In Ink script
#give_item:id_badge  // References item type!
```

```json
// ❌ INCORRECT - Don't add id field
"itemsHeld": [
  {
    "id": "id_badge",   // DON'T DO THIS
    "type": "keycard",       // Wrong - doesn't match tag
    "name": "Visitor Badge"
  }
]
```

---

### Issue #4: Incorrect Scenario JSON Structure

**Problem:** Initial scenario.json.erb used wrong format (arrays instead of objects, extra metadata)

**Root Cause:** Previous prompts didn't reference actual codebase examples

**Fix Applied:**
- Converted rooms from array to object format
- Simplified connections to `{ "north": "room_id" }` format
- Moved NPCs into room arrays
- Inlined locks on rooms/containers
- Removed mission metadata (belongs in mission.json)
- Removed separate registries (locks, items, containers)

**File Changed:** `scenarios/m01_first_contact/scenario.json.erb` (complete restructure)

---

### Issue #5: Incorrect EXTERNAL Variable Usage

**Problem:** Ink scripts used `EXTERNAL variable()` instead of `VAR` with globalVariables

**Root Cause:** Misunderstanding of global variable system

**Fix Applied:**
- Changed all `EXTERNAL` declarations to `VAR` declarations
- Added all variables to `globalVariables` section in scenario.json.erb
- Fixed all variable usage (removed `()` function calls)
- Recompiled all affected Ink scripts

**Files Changed:**
- All 9 Ink scripts (changed EXTERNAL to VAR)
- `scenarios/m01_first_contact/scenario.json.erb` (added globalVariables)

**Reference:** See `docs/GLOBAL_VARIABLES.md` for correct pattern

---

## Documentation Created

### 1. SCENARIO_JSON_FORMAT_GUIDE.md

**Location:** `story_design/SCENARIO_JSON_FORMAT_GUIDE.md`

**Contents:**
- Correct vs incorrect scenario.json.erb formats
- Room format (object not array)
- Connection format (simple not complex)
- Global variables (VAR not EXTERNAL)
- Timed conversations (opening cutscenes)
- Phone NPCs with event mappings (closing debriefs)
- Common mistakes and how to avoid them
- Validation checklist

**Purpose:** Primary reference for future scenario development

### 2. README.md

**Location:** `scenarios/m01_first_contact/README.md`

**Contents:**
- Mission status and file inventory
- Testing checklist
- Known issues and TODOs
- Integration notes
- Developer quick start

### 3. FIXES_APPLIED.md

**Location:** `scenarios/m01_first_contact/FIXES_APPLIED.md`

**Contents:** This document

---

## Prompts Updated

### 1. Stage 5: Room Layout Design

**File:** `story_design/story_dev_prompts/05_room_layout_design.md`

**Added Section:** "CRITICAL: Lock Type Variety and Progression"
- Lock Type Ordering Rules (keys BEFORE lockpick, vary lock types)
- Rule: Keys not in same room as locks
- Rule: Progressive difficulty (easy → medium → hard)
- Lock Progression Template with validation checklist
- Examples of good vs bad progression
- 4 critical rules for lock design

**Why Added:**
- Prevents "same-y" gameplay from using only one lock type
- Ensures keys matter by using them before lockpick is obtained
- Provides clear template for designing lock progression
- Helps future scenarios avoid lock progression mistakes

### 2. Stage 1: Narrative Structure

**File:** `story_design/story_dev_prompts/01_narrative_structure.md`

**Added Section:** "Important: Opening and Closing Cutscenes"
- Opening briefing requirements (timedConversation)
- Closing debrief implementation options
- Reference to format guide

### 2. Stage 7: Ink Scripting

**File:** `story_design/story_dev_prompts/07_ink_scripting.md`

**Added Section:** "CRITICAL: Dialogue Pacing Rule"
- Maximum 3 lines from single character before presenting player choices
- Keeps dialogue snappy and interactive
- Prevents dialogue fatigue and maintains pacing
- Includes good/bad examples and exceptions

**Added Section:** "CRITICAL: Compile Ink Scripts Before Proceeding"
- Compile scripts after writing them: `./scripts/compile-ink.sh [scenario_name]`
- Validates syntax and catches errors early
- Explains END tag warnings for cutscenes vs regular NPCs
- Ensures compiled .json files ready before Stage 8

### 3. Stage 9: Scenario Assembly

**File:** `story_design/story_dev_prompts/09_scenario_assembly.md`

**Added Section:** "Pre-Assembly Required Steps"
- Compile all Ink scripts before assembly: `./scripts/compile-ink.sh [scenario_name]`
- Validate scenario structure: `ruby scripts/validate_scenario.rb scenarios/[scenario_name]/scenario.json.erb`
- Verify successful compilation and validation
- Fix all INVALID errors before proceeding (suggestions are optional)

**Updated Section:** "Required Reading"
- Added CRITICAL reference to SCENARIO_JSON_FORMAT_GUIDE.md
- Updated documentation references to match actual files
- Added reference to working examples (ceo_exfil, npc-sprite-test3, secgen_vm_lab)

---

## Testing Recommendations

### Critical Tests

1. **Opening Briefing Auto-Start**
   - [ ] Load scenario
   - [ ] Verify briefing starts automatically with delay 0
   - [ ] Verify background shows HQ (not office)
   - [ ] Verify dialogue flows correctly

2. **Closing Debrief Trigger**
   - [ ] Complete Derek confrontation (any ending)
   - [ ] Verify phone call triggers immediately
   - [ ] Verify debrief dialogue reflects player choices
   - [ ] Verify mission completion acknowledged

3. **Global Variables**
   - [ ] Verify variables sync between NPCs
   - [ ] Verify `derek_confronted` triggers debrief
   - [ ] Check all 3 Derek ending paths set variable

4. **Phone NPC Event Mappings**
   - [ ] Agent 0x99 calls when lockpick acquired
   - [ ] Agent 0x99 calls when server room entered
   - [ ] Agent 0x99 calls when Derek's office entered
   - [ ] Debrief triggers after Derek confrontation

---

## Lessons Learned

### For Future Scenarios

**Always Do:**
1. ✅ Reference SCENARIO_JSON_FORMAT_GUIDE.md during Stage 9
2. ✅ Add opening briefing NPC with timedConversation in starting room
3. ✅ Add closing debrief trigger (phone NPC with event mapping)
4. ✅ Use VAR + globalVariables for cross-NPC state (not EXTERNAL)
5. ✅ Set item `type` to match #give_item tag parameter (DON'T use `id` field)
6. ✅ Test Ink scripts compile before scenario assembly
7. ✅ Use object format for rooms, simple format for connections
8. ✅ Reference working examples (ceo_exfil, npc-sprite-test3, secgen_vm_lab)
9. ✅ Use `type: "vm-launcher"` for VM terminals with proper ERB helpers
10. ✅ Use `type: "flag-station"` for flag submission terminals

**Never Do:**
1. ❌ Use EXTERNAL for regular variables
2. ❌ Use array format for rooms
3. ❌ Create top-level registries (locks, items, containers)
4. ❌ Put mission metadata in scenario.json.erb
5. ❌ Add `id` fields to items in itemsHeld (use `type` field instead)
6. ❌ Forget to set mission completion variables
7. ❌ Skip event mappings for automatic triggers
8. ❌ Use `type: "pc"` with `vmAccess` for VM launchers
9. ❌ Create Ink dialogue scripts for flag submission
10. ❌ Use diagonal directions (northeast, southeast, etc.) for room connections

---

## Validation Checklist

### Scenario Structure
- [x] Rooms use object format
- [x] Connections use simple format
- [x] NPCs in room arrays
- [x] Objects inline in rooms
- [x] Locks inline on containers/rooms
- [x] globalVariables section present
- [x] phoneNPCs section present

### Cutscenes and Triggers
- [x] Opening briefing NPC with timedConversation
- [x] Closing debrief phone NPC with event mapping
- [x] Mission completion variable set in final script
- [x] #exit_conversation tag before END statements

### Ink Scripts
- [x] All scripts use VAR not EXTERNAL
- [x] All scripts compile successfully
- [x] Variables match globalVariables section
- [x] Event trigger knots exist (for phone NPCs)

### Documentation
- [x] Format guide created
- [x] README created
- [x] Prompts updated
- [x] Examples documented

---

## Final Status

**✅ Mission 1: First Contact is now ready for in-game testing**

All critical issues resolved:
- Opening briefing will auto-start
- Closing debrief will auto-trigger
- Global variables properly configured
- Scenario structure matches codebase format
- All Ink scripts compile successfully
- Documentation complete for future scenarios

**Next Step:** Load scenario in game and test critical path

---

**Document Version:** 1.0
**Last Updated:** 2025-12-01
