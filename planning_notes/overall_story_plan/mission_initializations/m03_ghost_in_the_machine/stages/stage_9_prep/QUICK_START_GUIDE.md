# Stage 9 Quick Start Guide

**Mission:** Mission 3 - Ghost in the Machine
**Purpose:** Condensed implementation checklist for rapid startup
**For:** Developers beginning Stage 9 assembly
**Date:** 2025-12-27

---

## Prerequisites Checklist

**Before Starting:**
- [ ] Read `/stages/stage_8/validation_report.md` (approval confirmation)
- [ ] Read `/stages/stage_9_prep/IMPLEMENTATION_ROADMAP.md` (full guide)
- [ ] Install Inky editor (https://github.com/inkle/inky)
- [ ] Install Docker Engine 20.10+ and Docker Compose 1.29+
- [ ] Configure game engine with Ink runtime integration

---

## Critical Path (Minimum Viable Implementation)

### Step 0: Examine Reference Missions (2-3 hours) ⚠️ REQUIRED FIRST

**Priority:** ⚠️ CRITICAL - DO THIS BEFORE CREATING scenario.json.erb

**Purpose:** Extract proven patterns to avoid validation errors and reduce iterations

#### 0.1 Required Reference Examination

**Files to Study:**
```bash
# Study these files carefully BEFORE starting:
scenarios/m01_first_contact/scenario.json.erb    # Complete reference
scenarios/m02_ransomed_trust/scenario.json.erb   # Recent example
scripts/scenario-schema.json                      # Schema definition
```

**What to Extract:**

1. **VM Launcher Pattern** (Search for "vm-launcher" in M1):
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

2. **Flag Station Pattern** (Search for "flag-station" in M1):
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
      "description": "Description"
    }
  ]
}
```

3. **Player Configuration** (Top level, after startRoom):
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

4. **Opening Briefing NPC** (timedConversation pattern):
```json
{
  "id": "briefing_cutscene",
  "displayName": "Agent 0x99",
  "npcType": "person",
  "position": {"x": 500, "y": 500},
  "storyPath": "scenarios/mission/ink/opening_briefing.json",
  "currentKnot": "start",
  "timedConversation": {
    "delay": 0,
    "targetKnot": "start",
    "background": "assets/backgrounds/hq1.png"
  }
}
```

5. **Closing Debrief NPC** (eventMapping pattern):
```json
{
  "id": "closing_debrief",
  "displayName": "Agent 0x99",
  "npcType": "phone",
  "storyPath": "scenarios/mission/ink/closing_debrief.json",
  "avatar": "assets/npc/avatars/npc_helper.png",
  "phoneId": "player_phone",
  "currentKnot": "start",
  "eventMappings": [
    {
      "eventPattern": "global_variable_changed:mission_complete",
      "targetKnot": "start",
      "condition": "value === true",
      "onceOnly": true
    }
  ]
}
```

6. **Flag Submission Tasks** (Search for "submit_flags" in M1):
```json
{
  "taskId": "submit_flag_name",
  "title": "Submit evidence description",
  "description": "Submit flag{flag_name} at drop-site terminal",
  "type": "submit_flags",
  "status": "locked"
}
```

#### 0.2 Schema Requirements Checklist

**From scripts/scenario-schema.json - MANDATORY FIELDS:**

- [ ] **Objectives:** All have `order` field (0, 1, 2, 3...)
- [ ] **Objectives:** Use flat `tasks` arrays (NOT nested "aims")
- [ ] **Tasks:** All have `type` field (enter_room, npc_conversation, unlock_object, custom, submit_flags)
- [ ] **Tasks:** Include submit_flags tasks for EACH VM flag
- [ ] **Rooms:** All have `type` field (room_reception, room_office, room_ceo, room_servers, hall_1x2gu)
- [ ] **NPCs:** Use `displayName` NOT `name`
- [ ] **NPCs:** Use `npcType` NOT `type` (values: person, phone)
- [ ] **NPCs:** Use `storyPath` NOT `dialogue_script`
- [ ] **NPCs:** All have `currentKnot: "start"`
- [ ] **Objects:** Use valid types ONLY (notes, safe, pc, workstation, vm-launcher, flag-station)
- [ ] **Objects:** NEVER use: container, document, terminal, interactable
- [ ] **Key Locks:** Have `keyPins` array with values 25-60 (NOT 1-5)
- [ ] **PIN Locks:** Use `requires: "NNNN"` NOT keyPins
- [ ] **Player:** Player sprite configuration included

#### 0.3 ERB Helper Functions Setup

**Required at top of scenario.json.erb:**

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
  text.to_json[1..-2]  # Remove surrounding quotes
end
%>
```

**When to Use:**
- `json_escape()` - For ALL multi-line strings in ERB variables
- `base64_encode()` - For Base64 encoded game content
- `rot13()` - For ROT13 encoded content
- `hex_encode()` - For hex encoded content

#### 0.4 Validation Checkpoint Requirements

**RUN VALIDATION AT THESE POINTS:**

```bash
# Checkpoint 1: After basic structure
ruby scripts/validate_scenario.rb scenarios/m03_ghost_in_the_machine/scenario.json.erb

# Checkpoint 2: After rooms added
ruby scripts/validate_scenario.rb scenarios/m03_ghost_in_the_machine/scenario.json.erb

# Checkpoint 3: After NPCs added
ruby scripts/validate_scenario.rb scenarios/m03_ghost_in_the_machine/scenario.json.erb

# Checkpoint 4: Final validation
ruby scripts/validate_scenario.rb scenarios/m03_ghost_in_the_machine/scenario.json.erb
```

**RULE:** Never proceed to next phase with validation errors!

**Validation Checklist:**
- [ ] After objectives/tasks: Check for `order`, `type` fields
- [ ] After rooms: Check `type` field on all rooms
- [ ] After NPCs: Check displayName, npcType, storyPath, currentKnot
- [ ] After objects: Check valid type enums, keyPins ranges
- [ ] Final: 0 errors, minimal warnings

---

### Step 1: Compile Ink Scripts (4-6 hours)

**Priority:** ⚠️ CRITICAL BLOCKER

```bash
# Open each .ink file in Inky editor:
cd planning_notes/.../m03_ghost_in_the_machine/stages/stage_7/

# Files to compile (in order):
1. m03_opening_briefing.ink
2. m03_npc_victoria.ink
3. m03_npc_receptionist.ink
4. m03_npc_guard.ink
5. m03_james_choice.ink
6. m03_terminal_vm.ink
7. m03_terminal_cyberchef.ink
8. m03_terminal_dropsite.ink
9. m03_phone_agent0x99.ink
10. m03_closing_debrief.ink
```

**Validation:**
- [ ] All 9 files compile without errors
- [ ] .json output files generated
- [ ] Test load in game's Ink runtime

---

### Step 2: Setup VM Network (6-8 hours)

**Priority:** HIGH (Required for technical challenges)

```bash
# Create project structure
mkdir -p m03_ghost_vm_network/{distcc,ftp-data,http-data/pricing}
cd m03_ghost_vm_network

# Copy configurations from /stages/stage_9_prep/vm_infrastructure_setup.md:
# - docker-compose.yml (lines 46-100)
# - proftpd.conf (lines 110-139)
# - distcc/Dockerfile (lines 166-200)
# - distcc/operational_logs.txt (lines 202-236)
# - http-data/pricing/data.txt (lines 256-276)

# Build and start
docker-compose up -d

# Verify services
docker ps  # Should show 3 running containers
docker exec -it m03_ftp_server nc localhost 21  # Should show ProFTPD banner
```

**Validation:**
- [ ] FTP server responds on 192.168.100.10:21
- [ ] distcc responds on 192.168.100.20:3632
- [ ] HTTP serves pricing data on 192.168.100.30:80
- [ ] Player VM can reach all services

---

### Step 3: Create 7 Room JSONs (10-12 hours)

**Priority:** HIGH (Core gameplay environment)

**Reference:** `/stages/stage_5/room_design.md`

**Implementation Order:**
1. Reception Lobby (lines 40-99) - Entry point
2. Main Hallway (lines 154-195) - Hub corridor
3. Conference Room (lines 102-151) - RFID cloning location
4. Server Room (lines 198-309) - Investigation hub ⭐
5. Executive Wing Hallway (lines 312-341) - Connector
6. Executive Office (lines 344-422) - Victoria's workspace
7. James's Office (lines 426-487) - Moral choice trigger

**Each Room Needs:**
- Background image (or placeholder colored rectangle)
- Dimensions (GU measurements in room_design.md)
- Interactive props (computers, safes, filing cabinets)
- Exits (directional connections to other rooms)
- Lighting state (daytime/nighttime where applicable)

**Use Placeholders Initially:**
- Colored backgrounds with room names
- Text labels for interactive objects
- Simple shapes for props

---

### Step 4: Integrate NPCs (6-8 hours)

**Priority:** HIGH (Core narrative)

**Critical NPCs:**

1. **Victoria Sterling** - `m03_npc_victoria.ink`
   - Location: Conference Room (daytime), Executive Office (nighttime optional)
   - Portraits needed: 5 expressions (neutral, persuasive, defensive, vulnerable, defiant)
   - Key variables: `victoria_influence`, `victoria_suspicious`, `victoria_trusts_player`

2. **Agent 0x99** - `m03_phone_agent0x99.ink`
   - Trigger: After `flag{distcc_legacy_compromised}` submitted
   - Portrait: `agent_0x99_concerned.png`
   - **Critical:** M2 revelation scene

3. **James Park** - `m03_james_choice.ink`
   - Trigger: Examining diary in James's Office
   - Portraits: 3 expressions (neutral, guilty, desperate)

4. **Guard** - `m03_npc_guard.ink`
   - Location: Main Hallway patrol (nighttime)
   - Detection system required

5. **Receptionist** - `m03_npc_receptionist.ink`
   - Location: Reception Lobby (daytime)
   - Simple dialogue tree

---

### Step 5: Implement 4 Core Challenges (8-10 hours)

**Priority:** HIGH (Gameplay mechanics)

**Challenge 1: RFID Cloning** (Scenario Initialization)
- Trigger: Player near Victoria in Conference Room
- Mechanic: Stay within 2m for 10 seconds
- UI: Progress bar
- Success: Unlock Executive access

**Challenge 2: VM Terminal** (Technical Hub)
- nmap scan → `flag{network_scan_complete}`
- netcat FTP banner → `flag{ftp_intel_gathered}`
- curl HTTP + decode → `flag{pricing_intel_decoded}`
- distcc exploit → `flag{distcc_legacy_compromised}` ⭐ M2 trigger

**Challenge 3: CyberChef Workstation** (Decoding)
- ROT13 decoder (whiteboard message)
- Base64 decoder (HTTP pricing data)
- Hex decoder (client roster)
- Cascading: Base64→ROT13 (LORE Fragment 3)

**Challenge 4: Safe PIN Entry**
- Location: Server Room safe
- PIN: 2010 (from Reception founding plaque)
- Contains: LORE Fragment 2 (Exploit Catalog)

---

### Step 6: Objectives System (4-6 hours)

**Priority:** HIGH (Player guidance)

**Reference:** `/stages/stage_4/objectives.json`

**Structure:**
- 3 Aims: `establish_cover`, `network_recon`, `gather_evidence`
- 11 Primary tasks
- 4 Optional objectives

**Progressive Unlocking:**
- `network_recon` unlocks when `clone_rfid_card` completes
- `gather_evidence` unlocks when `clone_rfid_card` completes
- `moral_choices` unlocks when `distcc_exploit` completes (M2 revelation)

**Task Completion Triggers:**
- Ink tag: `#complete_task:<task_id>`
- Flag submission: Auto-complete corresponding task
- Object interaction: Examining LORE fragment

---

### Step 7: M2 Revelation Event (2-4 hours)

**Priority:** ⭐ CRITICAL (Emotional turning point)

**Trigger Sequence:**
1. Player exploits distcc service
2. Submits `flag{distcc_legacy_compromised}` at drop-site terminal
3. Operational logs display: "$12,500 hospital exploit sale to GHOST"
4. **Phone call initiates:** Agent 0x99 reveals St. Catherine's Hospital attack

**Requirements:**
- Phone call overlay UI
- `m03_phone_agent0x99.ink` dialogue integration
- Portrait change: `agent_0x99_concerned.png`
- Music cue: M2 revelation sting
- Unlocks: `moral_choices` optional objective

**Emotional Impact:** This is the mission's emotional climax. Test multiple times to ensure timing and delivery are effective.

---

### Step 8: Basic Testing (4-6 hours)

**Priority:** HIGH (Quality assurance)

**Critical Path Playthrough:**
1. Opening briefing plays correctly
2. Victoria conversation works (RFID cloning triggers)
3. Nighttime transition occurs
4. All 7 rooms accessible with correct exits
5. VM terminal challenges solvable
6. All 4 VM flags validate correctly
7. M2 revelation triggers after distcc flag
8. James choice presents correctly
9. Victoria confrontation offers all options
10. Closing debrief reflects player choices

**Target Time:** 45-60 minutes for complete playthrough

**Test Variations:**
- Victoria recruitment ending
- Victoria arrest ending
- James protected vs. exposed
- Perfect stealth achievement

---

## Asset Placeholder Strategy

**Character Portraits:**
```
victoria_neutral.png → Colored square with "V" text
james_guilty.png → Colored square with "J" text
agent_0x99_concerned.png → Colored square with "A" text
```

**Room Backgrounds:**
```
reception_bg.png → Solid color (#3A6B8C) with "RECEPTION" text
server_room_bg.png → Solid color (#2C3E50) with "SERVER ROOM" text
```

**Interactive Objects:**
```
computer_sprite.png → Simple rectangle with "COMPUTER" label
safe_sprite.png → Rectangle with "SAFE" label
```

**Benefits:**
- Implementation can proceed immediately
- Art team works in parallel
- Swap placeholders for final assets later

---

## Time Estimate (Minimum Viable)

**Critical Path Only:**
- Step 0 (Reference Study): 2-3 hours ⭐ REQUIRED FIRST
- Step 1 (Ink): 4-6 hours
- Step 2 (VM): 6-8 hours
- Step 3 (Rooms): 10-12 hours
- Step 4 (NPCs): 6-8 hours
- Step 5 (Challenges): 8-10 hours
- Step 6 (Objectives): 4-6 hours
- Step 7 (M2 Event): 2-4 hours
- Step 8 (Testing): 4-6 hours

**Total:** 46-63 hours (6-8 working days)

**With Polish:** 70-105 hours (9-13 working days)

**Note:** Step 0 saves 4-6 hours by preventing validation errors and rework!

---

## Common Pitfalls

**Encoding/JSON Issues (CRITICAL):**
- ❌ Using Unicode characters (→, ←, ★, •) in JSON strings
  - ✅ Use ASCII only (-, *, etc.)
- ❌ Multi-line strings breaking JSON parsing
  - ✅ ALWAYS use `json_escape()` for multi-line ERB variables
- ❌ Forgetting to escape quotes in JSON strings
  - ✅ Use `json_escape()` helper for all text content

**Schema Validation Errors:**
- ❌ Using wrong property names (`name` instead of `displayName`)
  - ✅ Study M1/M2 examples, check schema enum values
- ❌ Missing required fields (`order`, `type`, `currentKnot`)
  - ✅ Use Step 0 schema checklist before starting
- ❌ Using invalid object types (`container`, `document`, `terminal`)
  - ✅ Only use: notes, safe, pc, workstation, vm-launcher, flag-station
- ❌ Wrong keyPins values ([1,2,3] instead of [30,45,35])
  - ✅ Always use range 25-60 for keyPins
- ❌ Missing flag submission tasks
  - ✅ Add submit_flags task for EACH VM flag

**Ink Integration:**
- ❌ Forgetting to handle `#speaker:<name>` tags
- ❌ Missing `#complete_task:<task_id>` tags
- ❌ Variable persistence across conversation knots
- ✅ Test each Ink script individually before full integration

**VM Network:**
- ❌ Containers not on same Docker network
- ❌ Game VM can't reach 192.168.100.x subnet
- ❌ Services not starting (check logs: `docker-compose logs`)
- ✅ Follow VM infrastructure guide exactly (line-by-line)

**M2 Revelation:**
- ❌ Phone call triggers too early/late
- ❌ Music cue doesn't play
- ❌ Portrait doesn't change
- ✅ Test distcc flag → phone call sequence repeatedly

**Objectives System:**
- ❌ Tasks don't unlock progressively
- ❌ Flag submission doesn't complete tasks
- ❌ Optional objectives not tracked
- ✅ Verify objectives.json structure matches game's system

**VM/Flag Integration:**
- ❌ Missing hacktivityMode and vm object in vm-launcher
  - ✅ Use vm_object() helper from M1 pattern
- ❌ Missing acceptsVms and flags arrays in flag-station
  - ✅ Use flags_for_vm() helper from M1 pattern
- ❌ Missing opening briefing timedConversation
  - ✅ Add briefing NPC with delay: 0
- ❌ Missing closing debrief eventMapping
  - ✅ Add debrief NPC with global_variable_changed event

---

## Success Checklist

**Minimum Viable Mission:**
- [ ] All 9 Ink scripts compiled and integrated
- [ ] VM network functional (all 4 flags validate)
- [ ] All 7 rooms accessible with correct exits
- [ ] Victoria conversation (RFID cloning works)
- [ ] M2 revelation triggers correctly
- [ ] James choice presents
- [ ] Victoria confrontation offers 3 options
- [ ] Closing debrief plays
- [ ] Player can complete mission start-to-finish (45-60 min)

**When Above Complete:** Mission 3 is playable and testable.

---

## Next Steps After MVP

**Polish Phase:**
1. Replace placeholder assets with final art
2. Add sound effects (flag submission, RFID clone, lockpicking)
3. Add music tracks (4-5 tracks)
4. Implement stealth system (guard patrol)
5. Add LORE fragments (3 documents)
6. Implement accessibility features
7. Playtesting and iteration

**Future Enhancements:**
1. Post-mission knowledge check
2. Additional LORE fragments (5-6 total)
3. New Game Plus mode
4. Advanced moral choice branches

---

## Support Documents

**Full Implementation Guide:** `/stages/stage_9_prep/IMPLEMENTATION_ROADMAP.md` (437 lines)
**Asset Requirements:** `/stages/stage_9_prep/asset_manifest.md` (421 lines)
**VM Setup:** `/stages/stage_9_prep/vm_infrastructure_setup.md` (549 lines)
**Validation Report:** `/stages/stage_8/validation_report.md` (1,909 lines)

---

**Quick Start Version:** 2.0
**Last Updated:** 2025-12-28
**Status:** Ready for immediate use
**Critical Change:** Added Step 0 (Reference Examination) - REQUIRED FIRST

⚠️ **IMPORTANT:** Begin with Step 0 (Examine Reference Missions) to extract proven patterns and avoid 40+ validation errors. Then proceed sequentially through Steps 1-8 for fastest path to playable mission.

**Step 0 is mandatory and will save 4-6 hours of rework!**
