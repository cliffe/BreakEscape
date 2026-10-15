# Mission 1: First Contact - Objectives System Integration

## Overview

Integrated comprehensive objectives system to track player progress through the three primary aims specified in Agent 0x99's briefing.

## Objectives Structure

### Aim 1: Identify ENTROPY Operatives (order: 0)
**Status:** Active from mission start

**Tasks:**
1. ✓ `meet_reception` - Check in at reception (NPC conversation with Sarah)
2. ✓ `meet_kevin` - Meet the IT manager (NPC conversation with Kevin)
3. 🔒 `investigate_derek` - Investigate Derek Lawson's office (Enter derek_office)
4. 🔒 `confront_derek` - Confront the ENTROPY operative (NPC conversation with Derek)

### Aim 2: Gather Evidence (order: 1)
**Status:** Active from mission start

**Tasks:**
1. 🔒 `find_campaign_materials` - Find campaign materials (Collect notes from Derek's filing cabinet)
2. 🔒 `discover_manifesto` - Discover ENTROPY manifesto (Collect notes from Derek's filing cabinet)
3. 🔒 `decode_communications` - Decode encrypted communications (Use CyberChef workstation)

### Aim 3: Intercept Communications (order: 2)
**Status:** Active from mission start

**Tasks:**
1. 🔒 `access_server_room` - Access the server room (Enter server_room)
2. 🔒 `access_vm` - Access compromised systems (Interact with VM launcher)
3. 🔒 `submit_ssh_flag` - Submit SSH access evidence (Flag submission)
4. 🔒 `submit_linux_flag` - Submit Linux navigation evidence (Flag submission)
5. 🔒 `submit_sudo_flag` - Submit privilege escalation evidence (Flag submission)

## Task Unlock/Complete Flow

### Initial State (Mission Start)
- `meet_reception` - Active
- `meet_kevin` - Active
- All other tasks - Locked

### Progression Chain

**1. Meet Sarah (Reception)**
- **Trigger:** Talk to Sarah Martinez
- **Completes:** `meet_reception` (#complete_task in m01_npc_sarah.ink)
- **Unlocks:** `investigate_derek` when Sarah reveals Derek's suspicious behavior

**2. Meet Kevin (IT Manager)**
- **Trigger:** Talk to Kevin Park
- **Completes:** `meet_kevin` (#complete_task in m01_npc_kevin.ink)
- **Unlocks:** `access_server_room` when Kevin discusses server room

**3. Enter Derek's Office**
- **Trigger:** Player enters derek_office room
- **Completes:** `investigate_derek` (automatic room entry detection)
- **Unlocks via Agent 0x99 event handler:**
  - `find_campaign_materials`
  - `discover_manifesto`
  - `decode_communications`

**4. Gather Evidence**
- **Campaign Materials:** Automatically completes when player picks up item from Derek's filing cabinet
- **Manifesto:** Automatically completes when player picks up item from Derek's filing cabinet
- **Decode Communications:** Completes when player successfully decodes Base64 message (#complete_task in m01_terminal_cyberchef.ink)

**5. Access Server Room**
- **Trigger:** Player enters server_room
- **Completes:** `access_server_room` (#complete_task in m01_phone_agent0x99.ink event handler)
- **Unlocks:** `access_vm`

**6. Access VM Systems**
- **Trigger:** Player interacts with VM launcher terminal
- **Completes:** `access_vm` (via Ink or game system)
- **Unlocks via m01_terminal_dropsite.ink first_access:**
  - `submit_ssh_flag`
  - `submit_linux_flag`
  - `submit_sudo_flag`

**7. Submit VM Flags**
- **SSH Flag:** Completes when player submits correct SSH flag (#complete_task in m01_terminal_dropsite.ink)
- **Linux Flag:** Completes when player submits correct navigation flag (#complete_task in m01_terminal_dropsite.ink)
- **Sudo Flag:** Completes when player submits correct privilege escalation flag (#complete_task in m01_terminal_dropsite.ink)
  - **Also unlocks:** `confront_derek` (player now has sufficient evidence)

**8. Confront Derek**
- **Trigger:** Player talks to Derek Lawson in his office
- **Completes:** `confront_derek` (#complete_task at start of m01_derek_confrontation.ink)
- **Mission Resolution:** Player chooses final outcome (arrest/recruit/expose)

## Ink Script Changes

### m01_npc_sarah.ink
```ink
=== derek_suspicion ===
+ [That does seem odd]
    #unlock_task:investigate_derek  // Unlocks investigation task
    Sarah: Right? But I'm just the receptionist. What do I know?
```

### m01_npc_kevin.ink
```ink
=== ask_server_room ===
~ discussed_server_room = true
~ influence += 1
#unlock_task:access_server_room  // Unlocks server access task
```

### m01_phone_agent0x99.ink
```ink
=== event_derek_office_entered ===
#unlock_task:find_campaign_materials
#unlock_task:discover_manifesto
#unlock_task:decode_communications
Agent 0x99: You're in Derek's office. Good.

=== event_server_room_entered ===
#complete_task:access_server_room
#unlock_task:access_vm
Agent 0x99: You're in the server room. Good work getting access.
```

### m01_terminal_cyberchef.ink
```ink
=== whiteboard_decoded ===
~ decoded_whiteboard = true
#complete_task:decode_communications  // Changed from decode_whiteboard
```

### m01_terminal_dropsite.ink
```ink
=== first_access ===
#unlock_task:submit_ssh_flag
#unlock_task:submit_linux_flag
#unlock_task:submit_sudo_flag

=== sudo_success ===
#complete_task:submit_sudo_flag
#unlock_task:confront_derek  // Sufficient evidence gathered
```

### m01_derek_confrontation.ink
```ink
=== start ===
#complete_task:confront_derek  // Final task completion
Derek: Working late on the security audit?
```

## Validation

✅ All Ink scripts compile successfully
✅ Scenario structure validates against schema
✅ All task IDs match between objectives and Ink tags
✅ Proper task progression from locked → active → completed

## Task Type Mapping

- **npc_conversation:** Direct NPC dialogue tasks (Sarah, Kevin, Derek)
- **enter_room:** Room entry tasks (Derek's office, server room)
- **collect_items:** Item collection tasks (campaign materials, manifesto)
- **unlock_object:** Terminal/object interaction tasks (CyberChef, VM launcher, flag station)

## Notes

- Most task completion is handled via Ink tags (#complete_task, #unlock_task)
- Item collection tasks are automatically tracked by game engine
- Room entry tasks can be completed automatically or via Ink event handlers
- The objectives system provides clear player guidance matching the briefing's three-pronged approach
