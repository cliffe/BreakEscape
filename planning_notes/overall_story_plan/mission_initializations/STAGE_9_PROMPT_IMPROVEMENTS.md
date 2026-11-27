# Stage 9 Prompt Improvements

**Purpose:** Improve Stage 9 prompts to reduce development iterations and produce valid JSON on first attempt

**Based on:** Mission 3 development experience (2025-12-27)

---

## Critical Additions to Stage 9 Prompt

### 1. **Reference Mission Examination** (BEFORE starting)

Add to beginning of Stage 9 prompt:

```markdown
## STEP 0: EXAMINE REFERENCE MISSIONS (REQUIRED)

Before creating scenario.json.erb, examine existing missions as templates:

**Required Reading:**
1. `scenarios/m01_first_contact/scenario.json.erb` - Complete reference
2. `scenarios/m02_ransomed_trust/scenario.json.erb` - Recent example
3. `scripts/scenario-schema.json` - JSON schema definition

**Critical Patterns to Extract:**

### VM Launcher Format:
```json
{
  "type": "vm-launcher",
  "id": "vm_launcher_id",
  "name": "VM Access Terminal",
  "takeable": false,
  "observations": "Terminal description",
  "hacktivityMode": <%= vm_context && vm_context['hacktivity_mode'] ? 'true' : 'false' %>,
  "vm": <%= vm_object('scenario_name', {"id":1,"title":"VM Title","ip":"192.168.100.X","enable_console":true}) %>
}
```

### Flag Station Format:
```json
{
  "type": "flag-station",
  "id": "flag_station_id",
  "name": "Drop-Site Terminal",
  "takeable": false,
  "observations": "Terminal for submitting VM flags",
  "acceptsVms": ["scenario_name"],
  "flags": <%= flags_for_vm('scenario_name', ['flag{flag1}', 'flag{flag2}']) %>,
  "flagRewards": [
    {
      "type": "emit_event",
      "event_name": "flag_submitted",
      "description": "Flag submission event"
    }
  ]
}
```

### Player Configuration:
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

### Opening Briefing (timedConversation):
```json
{
  "id": "briefing_cutscene",
  "displayName": "Agent 0x99",
  "npcType": "person",
  "position": {"x": 500, "y": 500},
  "spriteSheet": "hacker",
  "spriteConfig": {
    "idleFrameStart": 20,
    "idleFrameEnd": 23
  },
  "storyPath": "scenarios/mission_name/ink/opening_briefing.json",
  "currentKnot": "start",
  "timedConversation": {
    "delay": 0,
    "targetKnot": "start",
    "background": "assets/backgrounds/hq1.png"
  }
}
```

### Closing Debrief (eventMapping):
```json
{
  "id": "closing_debrief",
  "displayName": "Agent 0x99",
  "npcType": "phone",
  "storyPath": "scenarios/mission_name/ink/closing_debrief.json",
  "avatar": "assets/npc/avatars/npc_helper.png",
  "phoneId": "player_phone",
  "currentKnot": "start",
  "eventMappings": [
    {
      "eventPattern": "global_variable_changed:mission_completed",
      "targetKnot": "start",
      "condition": "value === true",
      "onceOnly": true
    }
  ]
}
```
```

---

### 2. **Schema Validation Requirements**

Add validation checkpoint section:

```markdown
## VALIDATION CHECKPOINTS (MANDATORY)

Run validation script at these points:

### Checkpoint 1: After Basic Structure
- Created mission.json ✓
- Created scenario.json.erb skeleton ✓
- Added objectives array ✓
- **RUN:** `ruby scripts/validate_scenario.rb scenarios/mission_name/scenario.json.erb`

### Checkpoint 2: After Rooms Added
- All 7 rooms defined ✓
- **RUN:** Validation script

### Checkpoint 3: After NPCs Added
- All NPCs configured ✓
- **RUN:** Validation script

### Checkpoint 4: Final Validation
- All objects, locks, items added ✓
- **RUN:** Validation script
- **GOAL:** 0 errors, minimal warnings

**Never proceed to next phase with validation errors!**
```

---

### 3. **Schema Requirements Checklist**

Add explicit schema checklist:

```markdown
## SCHEMA REQUIREMENTS CHECKLIST

### Objectives Structure:
- [ ] All objectives have `order` field (0, 1, 2...)
- [ ] All objectives use flat `tasks` arrays (NOT nested "aims")
- [ ] All tasks have `type` field: enter_room, npc_conversation, unlock_object, custom, submit_flags
- [ ] Flag submission tasks included for each VM flag

### Rooms:
- [ ] All rooms have `type` field from enum (room_reception, room_office, room_ceo, room_servers, hall_1x2gu)
- [ ] All rooms have valid connections object

### NPCs:
- [ ] Use `displayName` NOT `name`
- [ ] Use `npcType` NOT `type` (values: person, phone)
- [ ] Use `storyPath` NOT `dialogue_script`
- [ ] All person NPCs have `currentKnot: "start"`
- [ ] All phone NPCs have `currentKnot: "start"`
- [ ] Opening briefing NPC has `timedConversation`
- [ ] Closing debrief NPC has `eventMappings`

### Objects:
- [ ] Use valid types from enum: notes, safe, pc, workstation, vm-launcher, flag-station, text_file, suitcase
- [ ] Never use: container, document, terminal, interactable
- [ ] Key locks have `keyPins` array with values 25-60
- [ ] PIN locks use `requires: "NNNN"` NOT keyPins
- [ ] Password locks use `lockType: "password"`
- [ ] vm-launcher objects use vm_object() helper
- [ ] flag-station objects use flags_for_vm() helper

### Player:
- [ ] Player sprite configuration included at top level
```

---

### 4. **Common Pitfalls to Avoid**

Add warnings section:

```markdown
## COMMON PITFALLS (MUST AVOID)

### Encoding Issues:
❌ **NEVER** use Unicode characters (→, ←, ★, etc.)
✅ **ALWAYS** use ASCII equivalents (-, *, etc.)

❌ **NEVER** embed multi-line strings directly in JSON
✅ **ALWAYS** use `json_escape()` helper for multi-line ERB variables

Example:
```erb
# BAD:
"text": "<%= long_lore_fragment %>"

# GOOD:
"text": "<%= json_escape(long_lore_fragment) %>"
```

### keyPins Values:
❌ **NEVER** use small values: [1, 2, 3, 4]
✅ **ALWAYS** use range 25-60: [30, 45, 35, 50]

**Rationale:** Values represent lockpick positions in minigame UI

### Object Type Mismatches:
❌ **NEVER** use: "container", "document", "terminal", "computer", "usb_device"
✅ **ALWAYS** use: "safe", "notes", "vm-launcher", "pc", "text_file"

Check schema enum for complete valid types list.

### Missing Required Fields:
Common validation errors:
- Missing `order` on objectives
- Missing `type` on tasks
- Missing `type` on rooms
- Missing `currentKnot` on NPCs
- Missing `player` configuration

**Solution:** Use M1/M2 as template, check schema before creating.
```

---

### 5. **ERB Helper Function Reference**

Add helper functions section:

```markdown
## ERB HELPER FUNCTIONS (REQUIRED)

### Required Helpers at Top of File:

```erb
<%
require 'base64'
require 'json'

def rot13(text)
  text.tr("A-Za-z", "N-ZA-Mn-za-m")
end

def base64_encode(text)
  Base64.strict_encode64(text)
end

def hex_encode(text)
  text.unpack('H*').first
end

def json_escape(text)
  text.to_json[1..-2]  # Remove surrounding quotes from .to_json
end
%>
```

### When to Use Each Helper:

**json_escape()** - For ANY multi-line string:
```erb
lore_fragment_1 = <<~LORE
  Zero Day Syndicate founded 2019...
  Multiple lines of text here...
LORE

# In JSON:
"text": "<%= json_escape(lore_fragment_1) %>"
```

**base64_encode()** - For Base64 encoded game content:
```erb
encoded_email = base64_encode("Secret message from Victoria")
```

**rot13()** - For ROT13 encoded game content:
```erb
whiteboard_message = rot13("Meet with The Architect")
```

**hex_encode()** - For hex encoded game content:
```erb
client_roster_hex = hex_encode("Client list: Ransomware Inc, Critical Mass")
```
```

---

### 6. **Flag Submission Tasks Pattern**

Add explicit flag task pattern:

```markdown
## FLAG SUBMISSION TASKS (REQUIRED)

For EACH VM flag, create a corresponding `submit_flags` task:

```json
{
  "taskId": "submit_flag_name",
  "title": "Submit [description] evidence",
  "description": "Submit flag{flag_name} at drop-site terminal",
  "type": "submit_flags",
  "status": "locked"
}
```

**Example for 4 flags:**

```json
"tasks": [
  {
    "taskId": "scan_network",
    "title": "Scan Network",
    "description": "Use nmap to scan the network",
    "type": "custom",
    "status": "locked"
  },
  {
    "taskId": "submit_network_scan_flag",
    "title": "Submit network scan evidence",
    "description": "Submit flag{network_scan_complete} at drop-site terminal",
    "type": "submit_flags",
    "status": "locked"
  },
  // ... repeat for each flag
]
```

**Rationale:** Players need explicit objectives telling them to submit flags. Without these tasks, players complete VM challenges but don't know to submit flags at drop-site terminal.
```

---

## Summary of Changes

**Old Stage 9 Approach:**
1. Read planning docs
2. Create scenario.json.erb from scratch
3. Validate at end
4. Fix all errors

**Problems:** 46 validation errors, missing patterns, multiple iterations

**New Stage 9 Approach:**
1. **FIRST:** Examine M1/M2 + schema
2. Extract patterns (VM launcher, flag station, NPCs, etc.)
3. Create scenario.json.erb using patterns as templates
4. Validate incrementally at checkpoints
5. Use helpers checklist
6. Avoid common pitfalls list

**Expected Result:** 0-5 validation errors on first attempt, valid JSON immediately

---

## Implementation Priority

**CRITICAL** - Add to all future mission Stage 9 prompts:
- [ ] Step 0: Examine reference missions section
- [ ] Schema requirements checklist
- [ ] Validation checkpoint requirements
- [ ] Common pitfalls warnings

**HIGH** - Add to Stage 9 prompts:
- [ ] ERB helper function reference
- [ ] Flag submission tasks pattern
- [ ] Pattern extraction examples

**MEDIUM** - Optional but helpful:
- [ ] Extended examples from M1/M2
- [ ] Troubleshooting guide

---

**Document Version:** 1.0
**Created:** 2025-12-28
**Based on:** M3 Stage 9 implementation experience
**Validates:** All issues encountered could have been prevented with these prompt improvements
