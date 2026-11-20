> ⚠️ **SUPERSEDED (2026-08-21).** These stage documents describe the original **water-treatment**
> concept for m04 (chlorine dosing, Dec 2025). The mission was rebuilt as **grid battery storage**
> (Albion Energy Storage) and then aligned to the m01 standard. They are kept for historical
> reference only. The authoritative design is `scenarios/m04_critical_failure/ALIGNMENT_PLAN.md`;
> the current implementation is the scenario and ink files themselves.

# Mission 4: "Critical Failure" - Stage 9: Scenario JSON Assembly Guide

**Mission ID:** m04_critical_failure
**Stage:** 9 - Scenario JSON Assembly
**Version:** 2.0 (Improved based on M3 experience)
**Date:** 2025-12-28

---

## ⚠️ CRITICAL: Read This First

This Stage 9 guide incorporates all lessons learned from Mission 3's development, where we encountered **46 validation errors**. Following this guide should result in **0-5 validation errors** on first attempt.

**Expected Time:** 16-20 hours total
**Difficulty:** High (requires careful attention to detail)
**Prerequisites:** Stages 1-8 complete

---

## Step 0: Examine Reference Missions (REQUIRED - 2-3 hours)

**⚠️ DO THIS BEFORE CREATING scenario.json.erb**

### Required Reading

Read these files **in order** and take detailed notes:

1. **`scenarios/m01_first_contact/scenario.json.erb`** (Complete reference)
2. **`scenarios/m02_ransomed_trust/scenario.json.erb`** (Recent example)
3. **`scripts/scenario-schema.json`** (Schema definition)

### What to Extract

Create a reference document with these patterns:

#### Pattern 1: VM Launcher Configuration

```json
{
  "type": "vm-launcher",
  "id": "unique_vm_launcher_id",
  "name": "Display Name",
  "takeable": false,
  "observations": "Description text",
  "hacktivityMode": <%= vm_context && vm_context['hacktivity_mode'] ? 'true' : 'false' %>,
  "vm": <%= vm_object('vulnerability_analysis', {
    "id": 1,
    "title": "SCADA Network Backup Server",
    "ip": "192.168.100.10",
    "enable_console": true
  }) %>
}
```

**Key Points:**
- `hacktivityMode` uses ERB conditional with vm_context
- `vm` uses `vm_object()` helper function
- IP address matches Stage 8 specification
- `enable_console` should be true for debugging

#### Pattern 2: Flag Station Configuration

```json
{
  "type": "flag-station",
  "id": "unique_flag_station_id",
  "name": "Drop-Site Terminal",
  "takeable": false,
  "observations": "Terminal description",
  "acceptsVms": ["vulnerability_analysis"],
  "flags": <%= flags_for_vm('vulnerability_analysis', [
    'flag{network_scan_complete}',
    'flag{ftp_intel_gathered}',
    'flag{http_analysis_complete}',
    'flag{distcc_exploit_complete}'
  ]) %>,
  "flagRewards": [
    {
      "type": "emit_event",
      "event_name": "network_scan_evidence_submitted",
      "description": "Network scan flag submitted"
    }
  ]
}
```

**Key Points:**
- `acceptsVms` array contains scenario name (not VM ID)
- `flags` uses `flags_for_vm()` helper function
- Flag values match Stage 8 specification exactly
- `flagRewards` emit events for task completion

#### Pattern 3: Player Configuration

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

**Key Points:**
- Use `displayName`, NOT `name`
- `spriteSheet` references base sprite
- `spriteTalk` is separate asset
- `spriteConfig` has idle frame range

#### Pattern 4: Opening Briefing NPC (timedConversation)

```json
{
  "id": "opening_briefing_npc",
  "displayName": "Agent 0x99",
  "npcType": "person",
  "position": {"x": 500, "y": 500},
  "spriteSheet": "hacker",
  "spriteConfig": {
    "idleFrameStart": 20,
    "idleFrameEnd": 23
  },
  "storyPath": "scenarios/m04_critical_failure/ink/agent_0x99_briefing.json",
  "currentKnot": "briefing_start",
  "timedConversation": {
    "delay": 0,
    "targetKnot": "briefing_start",
    "background": "assets/backgrounds/hq1.png"
  }
}
```

**Key Points:**
- `timedConversation` with `delay: 0` starts immediately
- `targetKnot` must match knot in Ink file
- `storyPath` points to compiled Ink JSON
- `currentKnot` must be set

#### Pattern 5: Closing Debrief NPC (eventMapping)

```json
{
  "id": "closing_debrief_npc",
  "displayName": "Agent 0x99",
  "npcType": "person",
  "position": {"x": 500, "y": 500},
  "spriteSheet": "hacker",
  "spriteConfig": {
    "idleFrameStart": 20,
    "idleFrameEnd": 23
  },
  "storyPath": "scenarios/m04_critical_failure/ink/agent_0x99_debrief.json",
  "currentKnot": "debrief_start",
  "eventMapping": [
    {
      "event": "attack_disabled_complete",
      "action": "startConversation",
      "targetKnot": "debrief_start"
    }
  ]
}
```

**Key Points:**
- `eventMapping` triggers conversation on event
- Event name must match emitted events
- `action: "startConversation"` initiates dialogue
- Place in room where final task completes

---

## Step 1: Schema Requirements Checklist (30 minutes)

Before writing JSON, verify you know these required fields:

### Objectives Array

**Required Fields (Each Objective):**
- [ ] `order` (number: 0, 1, 2...)
- [ ] `title` (string)
- [ ] `description` (string)
- [ ] `type` (string: "main_mission", "optional", etc.)
- [ ] `tasks` (array)

**Common Mistakes:**
- ❌ Missing `order` field
- ❌ Using wrong `type` value
- ✅ Always provide `order` starting from 0

### Tasks Array

**Required Fields (Each Task):**
- [ ] `taskId` (string, unique)
- [ ] `title` (string)
- [ ] `description` (string)
- [ ] `type` (string: "enter_room", "npc_conversation", "custom", "submit_flags")
- [ ] `status` (string: "locked", "unlocked", "completed")

**Common Mistakes:**
- ❌ Missing `type` field
- ❌ Wrong `type` value (not in schema enum)
- ✅ Verify `type` against schema enum values

### Rooms Array

**Required Fields (Each Room):**
- [ ] `id` (string, unique)
- [ ] `name` (string)
- [ ] `type` (string: "room_entrance", "room_office", etc.)
- [ ] `objects` (array)
- [ ] `exits` (array)

**Common Mistakes:**
- ❌ Missing `type` field
- ❌ Using custom `type` not in schema
- ✅ Use schema-defined room types only

### NPCs Array

**Required Fields (Each NPC):**
- [ ] `id` (string, unique)
- [ ] `displayName` (string) **NOT `name`**
- [ ] `npcType` (string: "person", "robot", etc.)
- [ ] `position` (object: `{"x": number, "y": number}`)
- [ ] `spriteSheet` (string)

**Common Mistakes:**
- ❌ Using `name` instead of `displayName`
- ❌ Missing `npcType`
- ❌ Wrong `npcType` value
- ✅ Always use `displayName`

### Objects Array

**Required Fields (Each Object):**
- [ ] `type` (string: valid object type from schema)
- [ ] `id` (string, unique)
- [ ] `name` (string)
- [ ] `takeable` (boolean)

**Common Mistakes:**
- ❌ Using invalid `type` (not in schema)
- ❌ Wrong property names
- ✅ Verify object `type` against schema

### Key Locks

**Required Fields:**
- [ ] `keyPins` (array of 3 numbers in range **25-60**)

**Common Mistakes:**
- ❌ Using `[1, 2, 3]` or simple sequences
- ❌ Values outside 25-60 range
- ✅ Always use range 25-60, e.g., `[30, 45, 35]`

---

## Step 2: Mission-Specific Configuration (1 hour)

### Mission Metadata

```json
{
  "mission_id": "m04_critical_failure",
  "title": "Critical Failure",
  "description": "Prevent ENTROPY infrastructure attack on water treatment facility",
  "difficulty": "intermediate",
  "estimated_time": "60-80 minutes",
  "tags": ["combat", "investigation", "scada", "infrastructure"],
  "version": "1.0"
}
```

### Player Starting Configuration

```json
"player": {
  "id": "player",
  "displayName": "Agent 0x00",
  "spriteSheet": "hacker",
  "spriteTalk": "assets/characters/hacker-talk.png",
  "spriteConfig": {
    "idleFrameStart": 20,
    "idleFrameEnd": 23
  },
  "startingRoom": "room_entrance",
  "startingPosition": {"x": 100, "y": 200},
  "startingInventory": []
}
```

### Mission Variables (Global State)

```json
"globalVariables": {
  "chen_trust_level": 0,
  "revealed_mission": false,
  "voltage_captured": false,
  "attack_trigger_secured": false,
  "disclosure_choice": "",
  "operatives_defeated": 0,
  "urgency_stage": 1
}
```

---

## Step 3: Objectives Structure (2-3 hours)

Based on Stage 4 specifications, create 3 main objectives with 18 tasks.

### Objective 1: Infiltrate Facility

```json
{
  "order": 0,
  "title": "Infiltrate Facility and Confirm Threat",
  "description": "Enter the water treatment facility and verify ENTROPY infiltration",
  "type": "main_mission",
  "tasks": [
    {
      "taskId": "enter_facility",
      "title": "Enter Water Treatment Facility",
      "description": "Enter the facility using your cover identity",
      "type": "enter_room",
      "status": "unlocked",
      "requiredRoom": "room_entrance"
    },
    {
      "taskId": "meet_robert_chen",
      "title": "Meet with Facility Manager",
      "description": "Locate Robert Chen and establish cover",
      "type": "npc_conversation",
      "status": "locked",
      "requiredNpc": "npc_robert_chen",
      "requiredKnot": "initial_meeting_complete"
    },
    {
      "taskId": "find_infiltration_evidence",
      "title": "Search for Evidence of Infiltration",
      "description": "Investigate for signs of ENTROPY infiltration",
      "type": "custom",
      "status": "locked"
    },
    {
      "taskId": "identify_scada_anomalies",
      "title": "Identify SCADA System Anomalies",
      "description": "Examine SCADA systems for suspicious activity",
      "type": "custom",
      "status": "locked"
    }
  ]
}
```

**Validation Notes:**
- ✅ `order` starts at 0
- ✅ All tasks have `taskId`, `title`, `description`, `type`, `status`
- ✅ Task types match schema enums
- ✅ First task `status: "unlocked"`, others `"locked"`

### Objective 2: Investigate SCADA Compromise

```json
{
  "order": 1,
  "title": "Investigate SCADA Compromise and Attack Vector",
  "description": "Multi-system investigation to identify attack mechanism",
  "type": "main_mission",
  "tasks": [
    {
      "taskId": "locate_compromised_systems",
      "title": "Locate Compromised Systems",
      "description": "Navigate to server room",
      "type": "enter_room",
      "status": "locked",
      "requiredRoom": "room_server"
    },
    {
      "taskId": "scan_scada_network",
      "title": "Scan SCADA Network for Vulnerabilities",
      "description": "Use Nmap to map network topology",
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
    {
      "taskId": "investigate_compromised_services",
      "title": "Investigate Compromised Services",
      "description": "Analyze FTP and HTTP services",
      "type": "custom",
      "status": "locked"
    },
    {
      "taskId": "submit_ftp_intel_flag",
      "title": "Submit FTP intelligence evidence",
      "description": "Submit flag{ftp_intel_gathered} at drop-site terminal",
      "type": "submit_flags",
      "status": "locked"
    },
    {
      "taskId": "submit_http_analysis_flag",
      "title": "Submit HTTP analysis evidence",
      "description": "Submit flag{http_analysis_complete} at drop-site terminal",
      "type": "submit_flags",
      "status": "locked"
    },
    {
      "taskId": "exploit_distcc_vulnerability",
      "title": "Exploit Vulnerable SCADA Server",
      "description": "Exploit distcc vulnerability and escalate privileges",
      "type": "custom",
      "status": "locked"
    },
    {
      "taskId": "submit_distcc_exploit_flag",
      "title": "Submit exploitation evidence",
      "description": "Submit flag{distcc_exploit_complete} at drop-site terminal",
      "type": "submit_flags",
      "status": "locked"
    },
    {
      "taskId": "neutralize_operative_cipher",
      "title": "Neutralize Operative #1 (Optional)",
      "description": "Defeat ENTROPY operative in Treatment Floor",
      "type": "custom",
      "status": "locked",
      "optional": true
    },
    {
      "taskId": "neutralize_operative_relay",
      "title": "Neutralize Operative #2 (Optional)",
      "description": "Defeat ENTROPY operative in Chemical Storage",
      "type": "custom",
      "status": "locked",
      "optional": true
    }
  ]
}
```

### Objective 3: Neutralize Attack Threat

```json
{
  "order": 2,
  "title": "Neutralize Attack Threat",
  "description": "Confront Voltage and disable attack mechanism",
  "type": "main_mission",
  "tasks": [
    {
      "taskId": "confront_voltage",
      "title": "Confront ENTROPY Cell Leader",
      "description": "Locate and confront Voltage in Maintenance Wing",
      "type": "custom",
      "status": "locked"
    },
    {
      "taskId": "disable_attack_vectors",
      "title": "Disable Attack Mechanisms",
      "description": "Disable all three attack vectors",
      "type": "custom",
      "status": "locked"
    },
    {
      "taskId": "report_to_0x99",
      "title": "Report Mission Outcome",
      "description": "Debrief with Agent 0x99 and make disclosure decision",
      "type": "npc_conversation",
      "status": "locked",
      "requiredNpc": "closing_debrief_npc",
      "requiredKnot": "debrief_complete"
    }
  ]
}
```

**Total Tasks:** 18 (16 required, 2 optional)
**Validation:** All objectives have sequential `order`, all tasks properly typed

---

## Step 4: Rooms Configuration (3-4 hours)

Based on Stage 5 specifications, create 9 rooms.

### Room Template (Use for all rooms)

```json
{
  "id": "room_id",
  "name": "Room Name",
  "type": "room_type",
  "description": "Room description text",
  "objects": [],
  "npcs": [],
  "exits": [
    {
      "direction": "north",
      "targetRoom": "target_room_id",
      "locked": false
    }
  ]
}
```

### Room 1: Main Entrance

```json
{
  "id": "room_entrance",
  "name": "Main Entrance & Security Checkpoint",
  "type": "room_entrance",
  "description": "Facility entrance with security desk and metal detector",
  "objects": [
    {
      "type": "desk",
      "id": "obj_security_desk",
      "name": "Security Desk",
      "takeable": false,
      "observations": "Standard security checkpoint desk with sign-in clipboard"
    },
    {
      "type": "document",
      "id": "obj_signin_clipboard",
      "name": "Sign-In Clipboard",
      "takeable": false,
      "observations": "Employee sign-in sheet showing OptiGrid Solutions maintenance team entry"
    },
    {
      "type": "computer",
      "id": "obj_security_terminal",
      "name": "Security Terminal",
      "takeable": false,
      "observations": "Security monitoring terminal with SCADA status feed"
    },
    {
      "type": "door",
      "id": "obj_facility_door",
      "name": "Interior Facility Door",
      "takeable": false,
      "observations": "Door to main facility",
      "locked": true,
      "lockType": "keycard",
      "unlockEvent": "security_clearance_granted"
    }
  ],
  "npcs": ["npc_security_guard"],
  "exits": [
    {
      "direction": "north",
      "targetRoom": "room_administration",
      "locked": true,
      "unlockEvent": "security_clearance_granted"
    }
  ]
}
```

**Key Pattern Notes:**
- Objects have `type`, `id`, `name`, `takeable`
- Doors use `lockType` and `unlockEvent`
- NPCs array contains NPC IDs
- Exits reference other room IDs

### Rooms 2-9: Follow Same Pattern

For brevity, list room IDs and types (full JSON follows pattern above):

2. **room_administration** - `type: "room_office"`
3. **room_control** - `type: "room_control"`
4. **room_server** - `type: "room_server"` ⚠️ Contains VM launcher and flag station
5. **room_treatment** - `type: "room_industrial"`
6. **room_chemical_storage** - `type: "room_hazard"`
7. **room_security** - `type: "room_security"`
8. **room_maintenance** - `type: "room_industrial"`
9. **room_loading_dock** - `type: "room_exterior"`

---

## Step 5: Server Room (Critical - VM Integration) (2 hours)

**This room requires special attention for VM integration.**

```json
{
  "id": "room_server",
  "name": "Server Room",
  "type": "room_server",
  "description": "Network infrastructure server room with SCADA backup server access",
  "objects": [
    {
      "type": "vm-launcher",
      "id": "obj_network_terminal",
      "name": "Network Investigation Terminal",
      "takeable": false,
      "observations": "SCADA network terminal with remote access to backup server. Use this to investigate ENTROPY's system compromise.",
      "hacktivityMode": <%= vm_context && vm_context['hacktivity_mode'] ? 'true' : 'false' %>,
      "vm": <%= vm_object('vulnerability_analysis', {
        "id": 1,
        "title": "SCADA Network Backup Server",
        "ip": "192.168.100.10",
        "enable_console": true
      }) %>
    },
    {
      "type": "flag-station",
      "id": "obj_drop_site_terminal",
      "name": "Evidence Drop-Site Terminal",
      "takeable": false,
      "observations": "SAFETYNET secure terminal for submitting intelligence",
      "acceptsVms": ["vulnerability_analysis"],
      "flags": <%= flags_for_vm('vulnerability_analysis', [
        'flag{network_scan_complete}',
        'flag{ftp_intel_gathered}',
        'flag{http_analysis_complete}',
        'flag{distcc_exploit_complete}'
      ]) %>,
      "flagRewards": [
        {
          "type": "emit_event",
          "event_name": "network_scan_evidence_submitted",
          "description": "Network scan flag submitted"
        },
        {
          "type": "emit_event",
          "event_name": "ftp_intelligence_documented",
          "description": "FTP intelligence flag submitted"
        },
        {
          "type": "emit_event",
          "event_name": "http_analysis_documented",
          "description": "HTTP analysis flag submitted"
        },
        {
          "type": "emit_event",
          "event_name": "attack_mechanism_identified",
          "description": "Complete attack mechanism identified"
        }
      ]
    },
    {
      "type": "server_rack",
      "id": "obj_server_rack_1",
      "name": "Server Rack",
      "takeable": false,
      "observations": "Server rack with visible signs of tampering"
    },
    {
      "type": "computer",
      "id": "obj_entropy_laptop",
      "name": "ENTROPY Laptop",
      "takeable": false,
      "observations": "Laptop left connected to server - remote access tools visible"
    }
  ],
  "npcs": [],
  "exits": [
    {
      "direction": "south",
      "targetRoom": "room_treatment",
      "locked": true,
      "unlockEvent": "level2_keycard_obtained"
    }
  ]
}
```

**Critical Validation Points:**
- ✅ `vm-launcher` type is hyphenated
- ✅ `hacktivityMode` uses ERB conditional
- ✅ `vm_object()` helper matches SecGen scenario name
- ✅ `flag-station` type is hyphenated
- ✅ `acceptsVms` contains scenario name (string in array)
- ✅ `flags_for_vm()` helper with exact flag values
- ✅ `flagRewards` emit events that tasks listen for

---

## Step 6: NPCs Configuration (2-3 hours)

Based on Stage 3 specifications, create all NPCs.

### NPC Template

```json
{
  "id": "npc_id",
  "displayName": "NPC Name",
  "npcType": "person",
  "position": {"x": 300, "y": 200},
  "spriteSheet": "sprite_name",
  "spriteConfig": {
    "idleFrameStart": 0,
    "idleFrameEnd": 3
  },
  "storyPath": "scenarios/m04_critical_failure/ink/npc_dialogue.json",
  "currentKnot": "start_knot"
}
```

### Opening Briefing NPC (Special - Timed Conversation)

```json
{
  "id": "opening_briefing_npc",
  "displayName": "Agent 0x99",
  "npcType": "person",
  "position": {"x": 500, "y": 500},
  "spriteSheet": "hacker",
  "spriteConfig": {
    "idleFrameStart": 20,
    "idleFrameEnd": 23
  },
  "storyPath": "scenarios/m04_critical_failure/ink/agent_0x99_briefing.json",
  "currentKnot": "briefing_start",
  "timedConversation": {
    "delay": 0,
    "targetKnot": "briefing_start",
    "background": "assets/backgrounds/hq1.png"
  }
}
```

**Place in:** A special "briefing room" or trigger at mission start

### Robert Chen (Main Ally)

```json
{
  "id": "npc_robert_chen",
  "displayName": "Robert Chen",
  "npcType": "person",
  "position": {"x": 400, "y": 300},
  "spriteSheet": "robert_chen",
  "spriteConfig": {
    "idleFrameStart": 0,
    "idleFrameEnd": 3
  },
  "storyPath": "scenarios/m04_critical_failure/ink/robert_chen.json",
  "currentKnot": "chen_initial_meeting"
}
```

**Place in:** room_administration

### Voltage (Primary Antagonist)

```json
{
  "id": "npc_voltage",
  "displayName": "Voltage",
  "npcType": "person",
  "position": {"x": 600, "y": 400},
  "spriteSheet": "voltage",
  "spriteConfig": {
    "idleFrameStart": 0,
    "idleFrameEnd": 3
  },
  "storyPath": "scenarios/m04_critical_failure/ink/voltage_confrontation.json",
  "currentKnot": "voltage_confrontation_start",
  "hostile": true
}
```

**Place in:** room_maintenance

### Operative #1, #2, #3 (Combat NPCs)

```json
{
  "id": "npc_operative_cipher",
  "displayName": "Critical Mass Operative",
  "npcType": "person",
  "position": {"x": 500, "y": 300},
  "spriteSheet": "operative_cipher",
  "spriteConfig": {
    "idleFrameStart": 0,
    "idleFrameEnd": 3
  },
  "storyPath": "scenarios/m04_critical_failure/ink/operatives.json",
  "currentKnot": "cipher_detection",
  "hostile": true,
  "patrolRoute": [
    {"x": 500, "y": 300},
    {"x": 600, "y": 300},
    {"x": 600, "y": 400},
    {"x": 500, "y": 400}
  ]
}
```

**Place:**
- `npc_operative_cipher` in room_treatment
- `npc_operative_relay` in room_chemical_storage (with patrol)
- `npc_operative_static` in room_maintenance (with Voltage)

### Security Guard

```json
{
  "id": "npc_security_guard",
  "displayName": "Security Guard",
  "npcType": "person",
  "position": {"x": 200, "y": 200},
  "spriteSheet": "security_guard",
  "spriteConfig": {
    "idleFrameStart": 0,
    "idleFrameEnd": 1
  },
  "storyPath": "scenarios/m04_critical_failure/ink/security_guard.json",
  "currentKnot": "security_guard_entry"
}
```

**Place in:** room_entrance

### Closing Debrief NPC (Special - Event Mapping)

```json
{
  "id": "closing_debrief_npc",
  "displayName": "Agent 0x99",
  "npcType": "person",
  "position": {"x": 400, "y": 300},
  "spriteSheet": "hacker",
  "spriteConfig": {
    "idleFrameStart": 20,
    "idleFrameEnd": 23
  },
  "storyPath": "scenarios/m04_critical_failure/ink/agent_0x99_debrief.json",
  "currentKnot": "debrief_start",
  "eventMapping": [
    {
      "event": "attack_disabled_complete",
      "action": "startConversation",
      "targetKnot": "debrief_start"
    }
  ]
}
```

**Place in:** room_control (where Task 3.2 completes)

**NPC Validation Checklist:**
- [ ] All NPCs use `displayName` (NOT `name`)
- [ ] All have `npcType` field
- [ ] `position` is object with x, y
- [ ] `spriteSheet` references existing sprite
- [ ] `currentKnot` matches Ink file knots
- [ ] `storyPath` points to compiled Ink JSON files

---

## Step 7: ERB Helper Functions (1 hour)

### Understanding ERB in scenario.json.erb

**ERB Tags:**
- `<%= expression %>` - Outputs result
- `<% code %>` - Executes code without output

### Available Helper Functions

**1. `vm_object(scenario_name, config_hash)`**

```erb
<%= vm_object('vulnerability_analysis', {
  "id": 1,
  "title": "SCADA Network Backup Server",
  "ip": "192.168.100.10",
  "enable_console": true
}) %>
```

**2. `flags_for_vm(scenario_name, flags_array)`**

```erb
<%= flags_for_vm('vulnerability_analysis', [
  'flag{network_scan_complete}',
  'flag{ftp_intel_gathered}',
  'flag{http_analysis_complete}',
  'flag{distcc_exploit_complete}'
]) %>
```

**3. `json_escape(string)`**

Use for multi-line strings in ERB:

```erb
<%
  long_description = "This is a multi-line
  description that needs
  to be properly escaped"
%>
"description": "<%= json_escape(long_description) %>"
```

**4. Conditional Logic**

```erb
"hacktivityMode": <%= vm_context && vm_context['hacktivity_mode'] ? 'true' : 'false' %>
```

**Common ERB Mistakes:**
- ❌ Forgetting closing `%>`
- ❌ Not using `json_escape()` for multi-line strings
- ❌ Using Ruby strings where JSON strings expected
- ✅ Test ERB rendering before validation

---

## Step 8: JSON Structure Assembly (4-6 hours)

### Complete scenario.json.erb Structure

```json
{
  "mission_id": "m04_critical_failure",
  "title": "Critical Failure",
  "description": "...",

  "player": { /* Player config */ },

  "objectives": [
    { /* Objective 0 */ },
    { /* Objective 1 */ },
    { /* Objective 2 */ }
  ],

  "rooms": [
    { /* room_entrance */ },
    { /* room_administration */ },
    { /* room_control */ },
    { /* room_server - WITH VM INTEGRATION */ },
    { /* room_treatment */ },
    { /* room_chemical_storage */ },
    { /* room_security */ },
    { /* room_maintenance */ },
    { /* room_loading_dock */ }
  ],

  "npcs": [
    { /* opening_briefing_npc */ },
    { /* npc_robert_chen */ },
    { /* npc_voltage */ },
    { /* npc_operative_cipher */ },
    { /* npc_operative_relay */ },
    { /* npc_operative_static */ },
    { /* npc_security_guard */ },
    { /* closing_debrief_npc */ }
  ],

  "globalVariables": { /* Mission variables */ }
}
```

---

## Step 9: Validation Checkpoints (2-3 hours)

### Checkpoint 1: JSON Syntax Validation

```bash
# Test JSON syntax (after ERB rendering)
ruby -e "require 'erb'; require 'json'; JSON.parse(ERB.new(File.read('scenarios/m04_critical_failure/scenario.json.erb')).result)"
```

**Expected Result:** No syntax errors
**If Errors:** Fix bracket mismatches, comma errors, quote issues

### Checkpoint 2: Schema Validation

```bash
# Validate against schema
npm run validate-scenario m04_critical_failure
```

**Target:** 0-5 validation errors
**If More Errors:** Review schema requirements checklist

### Common Validation Errors and Fixes

**Error: "Missing required property 'order'"**
- Fix: Add `"order": 0` to objectives array items

**Error: "Invalid value for 'type'"**
- Fix: Check schema enum for valid types

**Error: "Unknown property 'name' in NPC"**
- Fix: Change `"name"` to `"displayName"`

**Error: "Invalid keyPins range"**
- Fix: Change to range 25-60, e.g., `[30, 45, 35]`

**Error: "vm_object is not defined"**
- Fix: Ensure ERB helpers are available in rendering context

### Checkpoint 3: In-Game Testing

1. **Launch mission in game**
2. **Test each objective:**
   - Objective 1: Can enter facility and meet Chen?
   - Objective 2: VM launches? Flags submit?
   - Objective 3: Voltage confrontation works?
3. **Test critical paths:**
   - VM launcher opens VM successfully
   - Flags submit and tasks complete
   - Dialogue triggers correctly
   - Events emit and tasks unlock

**If Issues:** Check event names, knot names, room/NPC IDs

---

## Step 10: Final Review and Polish (1-2 hours)

### Pre-Submission Checklist

**Schema Compliance:**
- [ ] 0-5 validation errors achieved
- [ ] All required fields present
- [ ] No invalid enum values
- [ ] Correct property names (displayName, not name)

**VM Integration:**
- [ ] vm-launcher object in server room
- [ ] flag-station object in server room
- [ ] ERB helpers used correctly
- [ ] Flag values match Stage 8 exactly
- [ ] All 4 flags present

**Objectives & Tasks:**
- [ ] 3 objectives with correct order (0, 1, 2)
- [ ] 18 tasks total (16 required, 2 optional)
- [ ] Task types correct
- [ ] Task dependencies logical

**Rooms:**
- [ ] 9 rooms defined
- [ ] All exits reference valid rooms
- [ ] Objects have correct types
- [ ] NPCs placed in correct rooms

**NPCs:**
- [ ] All use displayName
- [ ] Opening briefing NPC with timedConversation
- [ ] Closing debrief NPC with eventMapping
- [ ] Ink file paths correct

**Polish:**
- [ ] Descriptions clear and typo-free
- [ ] Observations provide helpful info
- [ ] Event names consistent across files
- [ ] Global variables initialized

---

## Success Criteria

### Validation Target
- **0-5 errors** on first schema validation (vs M3's 46)
- **No game-breaking bugs** on first playthrough
- **All VM flags obtainable**
- **All objectives completable**

### Quality Indicators
- Mission flows smoothly from Act 1 → 2 → 3
- Player understands what to do at each step
- VM challenges motivated by narrative
- Dialogue triggers at correct points
- No orphaned tasks or objectives

---

## Stage 9 Completion Checklist

- [ ] Step 0: Reference missions examined (M1, M2, schema)
- [ ] Step 1: Schema requirements checklist completed
- [ ] Step 2: Mission metadata configured
- [ ] Step 3: All 3 objectives with 18 tasks created
- [ ] Step 4: All 9 rooms configured
- [ ] Step 5: Server room with VM integration complete
- [ ] Step 6: All NPCs configured with correct properties
- [ ] Step 7: ERB helper functions used correctly
- [ ] Step 8: Complete JSON structure assembled
- [ ] Step 9: All validation checkpoints passed
- [ ] Step 10: Final review and polish complete

---

## Expected Outcomes

**Time Investment:** 16-20 hours total for Stage 9
**Validation Errors:** 0-5 (vs M3's 46)
**First Playthrough:** Completable without major bugs
**Player Experience:** Smooth, understandable, engaging

---

## Troubleshooting Guide

### If Validation Errors > 5

1. **Re-examine reference missions (M1/M2)**
2. **Check schema for required fields**
3. **Verify ERB helper syntax**
4. **Look for typos in property names**
5. **Validate JSON syntax first**

### If VM Integration Fails

1. **Check SecGen scenario name matches**
2. **Verify flag values exact**
3. **Confirm ERB helpers present**
4. **Test vm_context availability**

### If Tasks Don't Complete

1. **Check event emission names**
2. **Verify event listeners in tasks**
3. **Confirm Ink knot names match**
4. **Test NPC conversation flows**

---

**Status:** Stage 9 Guide Complete
**Next Action:** Create scenario.json.erb following this guide
**Expected Result:** 0-5 validation errors, fully functional mission

---

*This Stage 9 guide incorporates all lessons from Mission 3's 46 validation errors. Following these steps carefully should result in a near-perfect first attempt at scenario.json.erb assembly.*
