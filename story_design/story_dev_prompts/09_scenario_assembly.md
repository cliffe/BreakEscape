# Stage 9: Scenario Assembly and ERB Conversion

**Purpose:** Convert all outputs from Stages 0-8 into a complete, playable `scenario.json.erb` file that integrates narrative content, room layouts, objectives, NPCs, containers, and Ink scripts into the Break Escape game.

**Output:** Complete `scenario.json.erb` file ready for game integration, with all ERB templates for narrative-rich encoded content.

---

## Your Role

You are a scenario assembler for Break Escape. Your final task:

1. **Gather all outputs from Stages 0-7**
2. **Convert them into scenario.json.erb structure**
3. **Write ERB templates for narrative content** (encoded messages, documents)
4. **Integrate all game systems** (objectives, containers, locks, NPCs, Ink)
5. **Validate technical compliance**
6. **Test scenario readiness**

**CRITICAL:** This is the final step that makes all previous work playable. Every element from previous stages must be correctly integrated.

## Required Input

From all previous stages:

- **Stage 0:** Technical challenges, ENTROPY cell, narrative theme
- **Stage 1:** Narrative structure (three-act breakdown)
- **Stage 2:** Character profiles
- **Stage 3:** Choice points
- **Stage 4:** Player objectives (JSON structure, objective-to-world mapping)
- **Stage 5:** Room layouts (dimensions, containers, NPCs, connections)
- **Stage 6:** LORE fragments
- **Stage 7:** Ink scripts (compiled .json files)
- **Stage 8:** Validation report

## Required Reading

### ⚠️ CRITICAL - Must Read First

**`story_design/SCENARIO_JSON_FORMAT_GUIDE.md`** - **READ THIS FIRST!**
- Correct scenario.json.erb structure (based on actual codebase)
- Common mistakes and how to avoid them
- Room format (object, not array)
- Connection format (simple, not complex)
- Global variables (VAR, not EXTERNAL)
- What goes in scenario.json.erb vs. mission.json

### ESSENTIAL - Technical Documentation
- **`docs/GLOBAL_VARIABLES.md`** - How global variables work in Ink
- **`docs/INK_BEST_PRACTICES.md`** - Ink scripting guide
- **`docs/NOTES_MINIGAME_USAGE.md`** - Notes and documents
- **`docs/EXIT_CONVERSATION_TAG_USAGE.md`** - Ink tags for game integration

### Reference Examples (Copy These Structures)
- `scenarios/ceo_exfil/scenario.json.erb` - Complete working scenario
- `scenarios/npc-sprite-test3/scenario.json.erb` - Simple test scenario
- `scenarios/ceo_exfil/mission.json` - Mission metadata format

### ⚠️ Pre-Assembly Required Steps

**BEFORE starting scenario assembly, you MUST:**

1. **Compile all Ink scripts** - Run the compilation script:
   ```bash
   ./scripts/compile-ink.sh [scenario_name]
   ```

   This will:
   - Compile all `.ink` source files to `.json` format
   - Detect and warn about END tags (cutscene scripts may legitimately use END)
   - Ensure all Ink scripts are ready for game integration

   **Fix any compilation errors before proceeding!**

2. **Verify all scripts compiled successfully** - Check that:
   - All `.ink` files have corresponding `.json` files in the `ink/` directory
   - No compilation errors occurred (warnings about END tags are OK for cutscenes)
   - All Ink tags (`#give_item`, `#complete_task`, `#exit_conversation`) are correctly formatted

**Cutscene END Tag Warnings:**
- Opening briefing, closing debrief, and final confrontation scripts may legitimately use `-> END`
- These should have `#exit_conversation` tag before END
- Regular NPC dialogue should return to hub instead of using END

3. **Validate scenario structure** - Run the validation script:
   ```bash
   ruby scripts/validate_scenario.rb scenarios/[scenario_name]/scenario.json.erb
   ```

   This will:
   - Render and validate the ERB template
   - Check against the scenario schema
   - Identify common structural issues
   - Provide suggestions for improvements

   **Fix all INVALID errors before proceeding!** Suggestions are optional but recommended.

   **Common validation errors to fix:**
   - Phone NPCs in separate `phoneNPCs` section (should be in room `npcs` arrays)
   - Missing `keyPins` arrays for key locks (needed for lockpicking minigame)
   - Invalid room connection directions (only north/south/east/west valid)

## Understanding scenario.json.erb

### What is ERB?

**ERB (Embedded Ruby)** allows you to generate dynamic content in JSON files:

```erb
<%= variable %>           # Output variable value
<% ruby code %>           # Execute ruby code (no output)
<% if condition %>        # Conditional logic
<% end %>
```

**Why ERB for Break Escape?**
- Generate narrative-rich encoded messages (Base64, ROT13, hex)
- Separate VM technical challenges from in-game narrative content
- Easy updates to story without touching VM
- Random variations for replay value

### scenario.json.erb Structure

```json
{
  "scenarioId": "scenario_name",
  "title": "Scenario Display Name",
  "description": "Brief description",
  "difficulty": 1,
  "estimatedDuration": 3600,
  "entropy_cell": "cell_name",

  "objectives": [ /* From Stage 4 */ ],
  "rooms": [ /* From Stage 5 */ ],
  "npcs": [ /* From Stage 5 */ ],
  "containers": [ /* From Stage 5 */ ],
  "items": [ /* All items in scenario */ ],
  "lore_fragments": [ /* From Stage 6 */ ],
  "ink_scripts": { /* From Stage 7 */ },
  "hybrid_integration": { /* VM and ERB content */ }
}
```

## Logical Flow Validation

**CRITICAL:** Before assembling the scenario JSON, validate that the design from previous stages creates a playable, completable scenario without soft locks or impossible objectives.

### Why Validate First?

Stage 5 focused on spatial design and placement decisions. Stage 9 must verify that those design decisions work together to create a completable scenario. Finding issues now prevents costly rework after JSON assembly.

### Validation Process

#### 1. Objective Completability Check

**For each task in the objectives (Stage 4), verify:**

- [ ] **Task has completion method** - Every task must have ONE of:
  - Ink tag in dialogue (`#complete_task:task_id`)
  - Room entry trigger (automatic when entering room)
  - Item collection trigger (automatic when collecting item)
  - Container unlock trigger (automatic when unlocking container)

- [ ] **Completion method is reachable** - Player can access the location/NPC/item

- [ ] **No circular dependencies** - Task A doesn't require Task B which requires Task A

**Example issue:**
```
❌ BAD: "unlock_server_room" requires keycard from server room safe
         "open_server_safe" requires being in server room (circular!)

✅ GOOD: "clone_keycard_from_npc" → unlocks server room
         "open_server_safe" in server room → contains intel
```

#### 2. Progressive Unlocking Validation

**Verify the unlock sequence is achievable:**

- [ ] **Starting accessible rooms** - At least 2-3 rooms accessible at start
- [ ] **Keys before locks** - Every locked door/container has accessible unlock method:
  - Physical locks → lockpick available or key findable
  - PIN codes → code discoverable through investigation
  - Keycards → NPC has keycard for cloning, or key findable
  - Biometric locks → fingerprints collectable from objects/NPCs

- [ ] **No soft locks** - Player cannot permanently block progress:
  - Can't lose required unique items
  - Can't kill required NPCs without alternative paths
  - Can't lock self out of required areas

- [ ] **Backtracking intentional** - Required returns to previous areas make sense

**Example validation:**
```
Starting state:
✅ Lobby (accessible)
✅ Break room (accessible)
✅ Main office (accessible)
🔒 Server room (needs keycard)
🔒 Executive office (needs PIN)

Unlock path:
1. Talk to Maya in main office → get password hints (✅ accessible)
2. Use hints in VM SSH challenge → get flag (✅ VM always accessible)
3. Submit flag at drop-site → unlocks keycard (⚠️ WHERE is drop-site?)
   → If drop-site in server room: ❌ CIRCULAR DEPENDENCY
   → If drop-site in accessible room: ✅ OK

Fix: Place drop-site terminal in break room (starting accessible area)
```

#### 3. Resource Access Validation

**Verify all required resources are obtainable:**

- [ ] **Required items available** - Items needed for progression are findable:
  - Lockpicks (if physical locks exist)
  - PIN cracker (if PIN locks used)
  - RFID cloner (if keycard doors exist)
  - CyberChef workstation access (if encoding challenges exist)

- [ ] **NPCs accessible when needed** - NPCs required for objectives are reachable

- [ ] **VM terminals reachable** - VM access points accessible before VM challenges assigned

- [ ] **Drop-site terminals accessible** - Flag submission points reachable after VM completion

**Example check:**
```
Objective: "Decode Base64 whiteboard message"
Required: CyberChef workstation access

Validation:
- WHERE is CyberChef workstation? (Room X)
- Is Room X accessible when task becomes active? (Check progressive unlocking)
- Does player know how to use CyberChef? (Tutorial from Agent 0x99?)

If workstation in locked server room but task active from start: ❌ FIX NEEDED
```

#### 4. Spatial Logic Validation

**Check room layout makes physical sense:**

- [ ] **Room graph connected** - All rooms reachable (no isolated islands)
  - Draw connection graph: every room connects to at least one other
  - Check that locked rooms become reachable when unlocked

- [ ] **Room dimensions valid** - All rooms 4×4 to 15×15 GU (see `docs/ROOM_GENERATION.md`)

- [ ] **Usable space calculated** - Usable space = dimensions - 2 GU (1 GU padding each side)

- [ ] **Object coordinates valid** - All placed items within usable space bounds

- [ ] **NPC positions valid** - NPCs spawn in valid coordinates

- [ ] **Patrol routes valid** - If NPCs patrol, waypoints within room bounds

**Example spatial check:**
```
Room: Server Room (8×8 GU)
Usable space: 6×6 GU (coordinates 0,0 to 5,5)

Objects:
- VM terminal at (3, 3) → ✅ within bounds
- Drop-site terminal at (4, 5) → ✅ within bounds
- Safe at (7, 7) → ❌ OUTSIDE USABLE SPACE (fix: move to 5, 5)
```

#### 5. Hybrid Architecture Validation

**Verify VM and in-game content integrate correctly:**

- [ ] **VM challenges complement in-game** - VM doesn't duplicate in-game challenges

- [ ] **Flag narrative context clear** - Each VM flag has narrative meaning

- [ ] **Drop-site accepts all flags** - Dead drop terminal configured for all VM flags

- [ ] **Flag unlocks logical** - What each flag unlocks makes narrative sense

- [ ] **Correlation tasks exist** - At least one task requires correlating VM findings with in-game evidence

- [ ] **Encoding education included** - First encoding challenge has Agent 0x99 tutorial

**Example hybrid check:**
```
VM Challenge: SSH brute force
VM Flag: flag{ssh_brute_success}

Validation:
✅ In-game prep: Social engineering NPC provides password hints
✅ Narrative context: "Intercepted Social Fabric server credentials"
✅ Drop-site config: Terminal accepts this flag ID
✅ Unlocks: Access to in-game computer with encoded documents
✅ Correlation: Player must match VM server logs with in-game whiteboard
⚠️ Education: Is there Agent 0x99 tutorial on encoding? (Check Stage 7 Ink)
```

### Walkthrough Testing

**Before finalizing JSON, mentally walk through the scenario:**

**1. Starting State Check:**
- What rooms are accessible at start?
- What items does player have?
- What is first objective/task?
- Can player make progress immediately?

**2. Critical Path Validation:**
```
Step-by-step walkthrough:
1. Player spawns in [room] with [items]
2. First task: [task description]
   - Where does player go? [room]
   - What do they interact with? [object/NPC]
   - How does task complete? [Ink tag/auto/collection]
   - Does this unlock something? [what unlocks]

3. Next task: [task description]
   - Can player reach it? [accessibility check]
   - Required resources available? [item/access check]
   [Continue for all tasks...]

N. Final task: [end goal]
   - Is this achievable from previous state?
   - Are all prerequisites met?
   - Does scenario complete properly?
```

**3. Dead End Detection:**
- Are there any paths that block progression permanently?
- Can player waste limited resources?
- Are there failed states that can't be recovered from?

**4. Alternative Path Check:**
- Are there multiple ways to complete objectives?
- If player misses optional content, can they still win?
- Do choice moments create valid branches?

### Validation Checklist

Before proceeding to JSON assembly, confirm:

#### Objective Completability
- [ ] Every task has completion method specified
- [ ] All completion methods are reachable
- [ ] No circular dependencies exist
- [ ] All locked aims have achievable unlock conditions

#### Progressive Unlocking
- [ ] Initial accessible rooms allow progress (2-3 minimum)
- [ ] Every lock has accessible unlock method
- [ ] Keys/codes/credentials available before needed
- [ ] No soft locks possible
- [ ] Backtracking opportunities are intentional

#### Resource Access
- [ ] Required tools available (lockpick, PIN cracker, etc.)
- [ ] NPCs accessible when objectives require them
- [ ] VM terminals reachable before VM challenges
- [ ] Drop-site terminals accessible after VM completion
- [ ] CyberChef workstation accessible for encoding challenges

#### Spatial Logic
- [ ] Room connection graph is fully connected
- [ ] All rooms within 4×4 to 15×15 GU dimensions
- [ ] Usable space correctly calculated (dimensions - 2 GU)
- [ ] All objects within usable space bounds
- [ ] NPC spawn points and patrol routes valid

#### Hybrid Integration
- [ ] VM challenges complement (don't duplicate) in-game
- [ ] All VM flags have narrative context
- [ ] Drop-site terminal accepts all VM flags
- [ ] Flag unlocks make narrative sense
- [ ] At least one correlation task (VM + in-game evidence)
- [ ] Encoding education included (Agent 0x99 tutorial)

#### Walkthrough Success
- [ ] Starting state allows immediate progress
- [ ] Critical path completable start-to-finish
- [ ] No dead ends or permanent failures
- [ ] Alternative paths exist where appropriate
- [ ] End goal achievable from starting state

**If any validation fails, return to relevant stage to fix design before proceeding to JSON assembly.**

## Process

### Step 1: Create Scenario Metadata

**From Stage 0 initialization document:**

```erb
{
  "scenarioId": "<%= scenario_id %>",
  "title": "<%= scenario_title %>",
  "description": "<%= scenario_description %>",
  "difficulty": <%= difficulty_tier %>,
  "estimatedDuration": <%= duration_seconds %>,

  "entropy_cell": "<%= entropy_cell_name %>",
  "cybok_areas": <%= cybok_areas.to_json %>,

  "tags": ["<%= 'standalone' if standalone %>", "<%= mission_type %>"],

  "version": "1.0.0",
  "created": "<%= Time.now.strftime('%Y-%m-%d') %>"
}
```

**Example:**

```erb
<%
  scenario_id = "m01_first_contact"
  scenario_title = "First Contact"
  scenario_description = "Infiltrate media company running disinformation campaigns"
  difficulty_tier = 1
  duration_seconds = 3600
  entropy_cell_name = "Social Fabric"
  cybok_areas = ["Human Factors", "Applied Cryptography", "Security Operations"]
  standalone = true
  mission_type = "investigation"
%>

{
  "scenarioId": "<%= scenario_id %>",
  "title": "<%= scenario_title %>",
  "description": "<%= scenario_description %>",
  "difficulty": <%= difficulty_tier %>,
  "estimatedDuration": <%= duration_seconds %>,
  "entropy_cell": "<%= entropy_cell_name %>",
  "cybok_areas": <%= cybok_areas.to_json %>,
  "tags": ["standalone", "investigation"],
  "version": "1.0.0"
}
```

### Step 2: Convert Stage 4 Objectives to JSON

**Copy objectives JSON from Stage 4 output directly:**

```json
"objectives": [
  {
    "id": "main_mission",
    "description": "Gather intelligence on Social Fabric operations",
    "aims": [
      {
        "id": "identify_targets",
        "description": "Identify Social Fabric's disinformation targets",
        "status": "active",
        "tasks": [
          {
            "id": "talk_to_maya",
            "description": "Interview Maya Chen",
            "status": "active"
          },
          {
            "id": "decode_whiteboard",
            "description": "Decode Base64 message on whiteboard",
            "status": "locked"
          },
          {
            "id": "submit_ssh_flag",
            "description": "Submit SSH access flag",
            "status": "locked"
          }
        ]
      }
    ]
  }
]
```

### Step 3: Convert Stage 5 Room Layouts to JSON

**IMPORTANT: Use Valid Room Types**

Rooms must use predefined room types from the game engine:

**Available Room Types:**
- **2×2 GU rooms:** `room_reception`, `room_office`, `room_office3_meeting`, `room_office4_meeting`, `room_office5_it`, `room_ceo`, `room_servers`, `room_closet` (spooky basement theme)
- **1×1 GU rooms:** `small_room_1x1gu`, `small_office_room1_1x1gu`, `small_office_room3_1x1gu`, `small_room_closet_east_connections_only_1x1gu`
- **1×2 GU rooms:** `hall_1x2gu`

**If scenario needs a different room type:**
1. Use the closest valid room type as a placeholder
2. Add a `"TODO"` attribute explaining what new room type should be created
3. Document this in assembly notes for developers

**Example with TODO:**
```json
{
  "id": "laboratory_01",
  "name": "Research Laboratory",
  "type": "room_office",  // Using office as placeholder
  "TODO": "Create new 'room_laboratory' type with lab benches, equipment racks, and chemical storage visual assets",
  "dimensions": {"width": 10, "height": 8},
  "description": "High-tech research laboratory with specialized equipment"
}
```

**From Stage 5 room design document:**

```json
"rooms": [
  {
    "id": "lobby_01",
    "name": "Lobby",
    "type": "room_reception",  // Valid 2×2 GU room type
    "dimensions": {"width": 8, "height": 6},
    "description": "Professional reception area with modern furniture",

    "connections": [
      {
        "direction": "north",
        "to_room": "main_office_area",
        "door_type": "open"
      },
      {
        "direction": "east",
        "to_room": "break_room",
        "door_type": "open"
      }
    ],

    "spawn_point": {"x": 4, "y": 2},
    "interactive_objects": [
      {
        "id": "building_directory",
        "type": "sign",
        "position": {"x": 1, "y": 1},
        "interaction": "examine",
        "content": "Building Directory:\n\nMaya Chen - Junior Reporter, Cubicle 12\nDerek Lawson - Senior Editor, Office 3"
      }
    ]
  },

  {
    "id": "server_room",
    "name": "Server Room",
    "type": "room_servers",  // Valid 2×2 GU room type
    "dimensions": {"width": 8, "height": 8},
    "description": "Climate-controlled server room with racks and terminals",

    "connections": [
      {
        "direction": "west",
        "to_room": "main_office_area",
        "door_type": "locked_keycard",
        "required_keycard": "maya_chen_keycard"
      }
    ],

    "interactive_objects": [
      {
        "id": "vm_access_terminal",
        "type": "computer",
        "position": {"x": 3, "y": 3},
        "interaction": "vm_access",
        "vm_scenario": "intro_to_linux"
      },
      {
        "id": "drop_site_terminal",
        "type": "computer",
        "position": {"x": 4, "y": 5},
        "interaction": "ink_dialogue",
        "ink_script": "dead_drop_terminal",
        "ink_knot": "start"
      }
    ]
  },

  {
    "id": "storage_closet",
    "name": "Storage Closet",
    "type": "room_closet",  // Valid 1×1 GU room type
    "dimensions": {"width": 4, "height": 4},
    "description": "Small storage closet with cleaning supplies"
  },

  {
    "id": "main_hallway",
    "name": "Main Hallway",
    "type": "hall_1x2gu",  // Valid 1×2 GU hall type
    "dimensions": {"width": 4, "height": 6},
    "description": "Long corridor connecting office areas"
  }
]
```

### Step 4: Add NPCs with Ink Integration

**From Stage 5 NPC placement:**

```json
"npcs": [
  {
    "id": "maya_chen",
    "name": "Maya Chen",
    "type": "civilian",
    "role": "journalist",

    "spawn_room": "main_office_area",
    "spawn_position": {"x": 4, "y": 4},

    "mode": "in_person",
    "interaction_type": "dialogue",

    "ink_script": "maya_chen_dialogue",
    "ink_start_knot": "start",

    "appearance": {
      "sprite": "npc_journalist_female",
      "mood_states": ["neutral", "friendly", "concerned"]
    },

    "patrol": null,
    "hostile": false
  },

  {
    "id": "agent_0x99",
    "name": "Agent 0x99 'Haxolottle'",
    "type": "handler",
    "role": "safetynet_handler",

    "mode": "phone",
    "interaction_type": "phone_dialogue",

    "ink_script": "handler_phone_support",
    "ink_start_knot": "start",

    "appearance": {
      "avatar": "handler_0x99_avatar"
    },

    "event_triggers": [
      {
        "event": "item_picked_up:lockpick",
        "ink_knot": "on_lockpick_pickup"
      },
      {
        "event": "minigame_completed:lockpicking",
        "ink_knot": "on_lockpick_success"
      }
    ]
  }
]
```

### Step 5: Add Containers with ERB Content

**Containers from Stage 5 with ERB-generated narrative content:**

```erb
<%
  # Define encoded messages using ERB
  def base64_encode(text)
    require 'base64'
    Base64.strict_encode64(text)
  end

  def rot13(text)
    text.tr('A-Za-z', 'N-ZA-Mn-za-m')
  end

  # Narrative content variables
  client_list_message = "Client Meeting: Zero Day Syndicate, Ransomware Inc, Critical Mass"
  password_hint = "Derek's password is probably his birthday: 0419"
%>

"containers": [
  {
    "id": "reception_desk_drawer",
    "type": "drawer",
    "room": "lobby_01",
    "position": {"x": 2, "y": 2},

    "lock": null,

    "contents": [
      {
        "type": "note",
        "id": "password_hint_sticky",
        "name": "Sticky Note",
        "content": "<%= password_hint %>",
        "encoding": "plaintext"
      }
    ]
  },

  {
    "id": "conference_room_whiteboard",
    "type": "whiteboard",
    "room": "conference_room",
    "position": {"x": 5, "y": 1},

    "lock": null,

    "interaction": "examine",
    "content": {
      "encoded_text": "<%= base64_encode(client_list_message) %>",
      "encoding_type": "base64",
      "decoded_triggers": {
        "task": "decode_whiteboard"
      }
    }
  },

  {
    "id": "maya_desk_drawer",
    "type": "drawer",
    "room": "main_office_area",
    "position": {"x": 3, "y": 4},

    "lock": null,

    "contents": [
      {
        "type": "document",
        "id": "password_list_doc",
        "name": "Password List",
        "content": "Common passwords used by employees:\n- ViralDynamics2024\n- CompanyName123\n- April1985\n- Derek0419\n- Security!2024",
        "encoding": "plaintext",
        "gives_to_player": true
      }
    ]
  },

  {
    "id": "derek_office_safe",
    "type": "safe",
    "room": "derek_office",
    "position": {"x": 6, "y": 5},

    "lock": {
      "type": "pin_code",
      "code": "0419",
      "hint": "Birthday?"
    },

    "contents": [
      {
        "type": "document",
        "id": "lore_fragment_1",
        "name": "Social Fabric Manifesto",
        "content": "<%=
          # Long-form LORE fragment
          lore_content = <<~LORE
            SOCIAL FABRIC OPERATIONAL MANIFESTO

            Truth is a construct. Reality is what people believe.

            We don't create fake news - we create
 consensus reality.

            The Architect has shown us that information itself
            is the most powerful weapon...
          LORE
          lore_content
        %>",
        "encoding": "plaintext",
        "lore_fragment_id": "sf_manifesto_01"
      },
      {
        "type": "keycard",
        "id": "server_room_keycard",
        "name": "Server Room Keycard",
        "unlocks": ["server_room_door"]
      }
    ]
  }
]
```

### Step 6: Add Items Registry

**All items that exist in scenario:**

```json
"items": [
  {
    "id": "lockpick",
    "name": "Lockpick Kit",
    "type": "tool",
    "description": "Standard lockpicking tools",
    "usable_on": ["physical_lock"]
  },
  {
    "id": "maya_chen_keycard",
    "name": "Maya Chen's Keycard",
    "type": "keycard",
    "description": "RFID keycard - Maya Chen",
    "unlocks": ["server_room_door"],
    "cloneable": true
  },
  {
    "id": "password_list_doc",
    "name": "Password List",
    "type": "document",
    "description": "Common passwords used by employees",
    "readable": true
  },
  {
    "id": "server_credentials_document",
    "name": "Server Credentials",
    "type": "document",
    "description": "Access credentials for Social Fabric campaign server",
    "readable": true,
    "unlocked_by": "submit_ssh_flag"
  }
]
```

### Step 7: Add Hybrid Architecture Integration

**Document VM and ERB content separation:**

```json
"hybrid_integration": {
  "vm_scenario": {
    "name": "Introduction to Linux and Security lab",
    "provider": "SecGen",
    "description": "SSH brute force, Linux basics, privilege escalation",
    "flags": [
      {
        "id": "flag_ssh_access",
        "flag_value": "flag{ssh_brute_success}",
        "description": "SSH brute force successful",
        "unlocks_task": "submit_ssh_flag"
      },
      {
        "id": "flag_file_navigation",
        "flag_value": "flag{found_documents}",
        "description": "Found flags in home directory",
        "unlocks_task": "submit_navigation_flag"
      },
      {
        "id": "flag_privilege_escalation",
        "flag_value": "flag{privilege_escalation}",
        "description": "Sudo privilege escalation",
        "unlocks_task": "submit_sudo_flag"
      }
    ]
  },

  "erb_narrative_content": {
    "encoded_messages": [
      {
        "id": "conference_whiteboard_base64",
        "location": "conference_room_whiteboard",
        "encoding": "base64",
        "plain_text": "Client Meeting: Zero Day Syndicate, Ransomware Inc, Critical Mass",
        "narrative_purpose": "Reveals cross-cell collaboration"
      },
      {
        "id": "derek_email_rot13",
        "location": "derek_computer_email",
        "encoding": "rot13",
        "plain_text": "Meeting with The Architect postponed to next week",
        "narrative_purpose": "First Architect mention"
      }
    ],

    "cyberchef_workstation": {
      "room": "conference_room",
      "position": {"x": 2, "y": 5},
      "available_operations": ["from_base64", "rot13", "from_hex"]
    },

    "dead_drop_terminals": [
      {
        "id": "drop_site_terminal",
        "room": "server_room",
        "position": {"x": 4, "y": 5},
        "accepts_flags": ["flag_ssh_access", "flag_file_navigation", "flag_privilege_escalation"]
      }
    ]
  },

  "learning_integration": {
    "encoding_tutorial": {
      "trigger": "first_encoded_message_encounter",
      "npc": "agent_0x99",
      "ink_knot": "first_encoding_tutorial",
      "teaches": "Encoding vs. Encryption distinction, CyberChef usage"
    },

    "social_engineering_tutorial": {
      "trigger": "first_npc_dialogue",
      "npc": "maya_chen",
      "ink_knot": "social_engineering_intro",
      "teaches": "How to gather intel through conversation"
    }
  }
}
```

### Step 8: Add Ink Scripts Integration

**Reference compiled Ink JSON files:**

```json
"ink_scripts": {
  "opening_cutscene": {
    "file": "m01_first_contact_opening.json",
    "start_knot": "start",
    "type": "cutscene",
    "plays_at": "scenario_start"
  },

  "maya_chen_dialogue": {
    "file": "m01_maya_chen.json",
    "start_knot": "start",
    "type": "npc_dialogue",
    "attached_to": "maya_chen"
  },

  "handler_phone_support": {
    "file": "m01_handler_support.json",
    "start_knot": "start",
    "type": "phone_dialogue",
    "attached_to": "agent_0x99"
  },

  "dead_drop_terminal": {
    "file": "m01_dead_drop_terminal.json",
    "start_knot": "start",
    "type": "terminal_dialogue",
    "attached_to": "drop_site_terminal"
  },

  "cyberchef_workstation": {
    "file": "m01_cyberchef.json",
    "start_knot": "start",
    "type": "terminal_dialogue",
    "attached_to": "cyberchef_terminal"
  },

  "closing_cutscene": {
    "file": "m01_first_contact_closing.json",
    "start_knot": "start",
    "type": "cutscene",
    "plays_at": "objectives_complete"
  }
}
```

### Step 9: Add LORE Fragments

**From Stage 6 LORE design:**

```json
"lore_fragments": [
  {
    "id": "sf_manifesto_01",
    "title": "Social Fabric Manifesto",
    "category": "entropy_philosophy",
    "tier": "basic",

    "location": {
      "container_id": "derek_office_safe",
      "room": "derek_office",
      "unlock_condition": "safe_unlocked"
    },

    "content": "SOCIAL FABRIC OPERATIONAL MANIFESTO\n\nTruth is a construct. Reality is what people believe...",

    "unlocks_insight": "Social Fabric's core philosophy",
    "connects_to": ["architect_origins_01", "entropy_network_map_01"]
  }
]
```

### Step 10: Final Technical Validation

**After JSON assembly, perform final technical checks:**

**Technical Compliance:**
- [ ] All rooms use valid room types (room_reception, room_office, room_office3_meeting, room_office4_meeting, room_office5_it, room_ceo, room_servers, room_closet, small_room_1x1gu, small_office_room1_1x1gu, small_office_room3_1x1gu, hall_1x2gu)
- [ ] If new room type needed, valid placeholder used with TODO attribute
- [ ] All rooms have valid dimensions (4×4 to 15×15 GU)
- [ ] All items placed within usable space bounds
- [ ] All room connections reference existing rooms
- [ ] All Ink files compile without errors
- [ ] All ERB templates render without errors

**Integration Compliance:**
- [ ] All task IDs in objectives match Ink tag usage
- [ ] All NPC IDs match Ink script references
- [ ] All container IDs referenced in objectives exist
- [ ] All lock unlock methods specified
- [ ] All item IDs consistent across containers/NPCs/objectives

**JSON Syntax:**
- [ ] Valid JSON structure (no trailing commas, correct brackets)
- [ ] All required fields present
- [ ] No duplicate IDs
- [ ] Correct data types (strings as strings, numbers as numbers)

**Note:** Logical flow validation (objectives completable, no soft locks, progressive unlocking) was performed BEFORE JSON assembly in the "Logical Flow Validation" section. This final validation focuses on technical correctness of the assembled JSON.

## Complete scenario.json.erb Template

```erb
<%
  # ========================================
  # SCENARIO CONFIGURATION
  # ========================================

  scenario_id = "m01_first_contact"
  scenario_title = "First Contact"
  scenario_description = "Infiltrate media company running disinformation campaigns"

  # Helper methods for encoding
  def base64_encode(text)
    require 'base64'
    Base64.strict_encode64(text)
  end

  def rot13(text)
    text.tr('A-Za-z', 'N-ZA-Mn-za-m')
  end

  # Narrative content
  client_list_message = "Client Meeting: Zero Day Syndicate, Ransomware Inc, Critical Mass"
  architect_mention = "Meeting with The Architect postponed to next week"
%>
{
  "scenarioId": "<%= scenario_id %>",
  "title": "<%= scenario_title %>",
  "description": "<%= scenario_description %>",
  "difficulty": 1,
  "estimatedDuration": 3600,
  "entropy_cell": "Social Fabric",
  "version": "1.0.0",

  "objectives": [
    <%# Copy from Stage 4 output %>
  ],

  "rooms": [
    <%# Copy from Stage 5 output %>
  ],

  "npcs": [
    <%# Copy from Stage 5 output %>
  ],

  "containers": [
    {
      "id": "conference_room_whiteboard",
      "type": "whiteboard",
      "room": "conference_room",
      "position": {"x": 5, "y": 1},
      "content": {
        "encoded_text": "<%= base64_encode(client_list_message) %>",
        "encoding_type": "base64",
        "decoded_triggers": {"task": "decode_whiteboard"}
      }
    }
    <%# Additional containers %>
  ],

  "items": [
    <%# All items registry %>
  ],

  "lore_fragments": [
    <%# From Stage 6 %>
  ],

  "ink_scripts": {
    <%# From Stage 7 %>
  },

  "hybrid_integration": {
    <%# VM and ERB content documentation %>
  }
}
```

## Common Pitfalls to Avoid

### ERB Template Pitfalls
- **Forgetting to require libraries** - `require 'base64'` at top
- **Syntax errors in ERB tags** - Use `<%= %>` for output, `<% %>` for logic
- **Unescaped quotes** - Use `\"` in strings or heredocs
- **Not testing ERB rendering** - Always test template compilation

### Integration Pitfalls
- **Mismatched IDs** - Ensure task IDs match between objectives and Ink
- **Missing Ink files** - Reference non-existent Ink scripts
- **Invalid room connections** - Rooms that don't exist
- **Orphaned objectives** - Tasks with no completion method
- **Invalid room types** - Using room types that don't exist in game engine (use valid placeholder + TODO instead)

### Hybrid Architecture Pitfalls
- **VM flags not in drop-site** - Dead drop terminal must accept all VM flags
- **ERB content in VM** - Keep narrative content in game, not VM
- **Missing encoding type** - Always specify encoding for messages
- **No correlation tasks** - Include tasks requiring VM + in-game evidence

## Output Format

Save your complete scenario as:
```
scenarios/[scenario_name].json.erb
```

Also create supporting documentation:
```
scenarios/[scenario_name]_assembly_notes.md
```

---

**Next Step:** Pass complete scenario to game engine for integration testing. Work with developers to debug any integration issues.

**Critical for Testing:**
- Does scenario load without errors?
- Do all Ink scripts trigger correctly?
- Do objectives progress as expected?
- Are VM flags submitted properly?
- Does ERB content render correctly?
- **Is the scenario completable?** (validated in Logical Flow Validation section)

---

**Congratulations!** You've completed all 9 stages of Break Escape scenario development. Your scenario is now ready for playtesting and final polish.

**Remember:**
- The hybrid architecture means you can update narrative content (ERB templates) without touching the stable VM challenges. Take advantage of this separation for iterative improvements!
- You validated logical flow (no soft locks, objectives completable) BEFORE JSON assembly - this prevents costly rework
- Stage 5 provided spatial design, Stage 9 implemented and validated - clean separation of concerns
