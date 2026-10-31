# Mission 1: First Contact - Assembly Notes

**Mission:** m01_first_contact
**Status:** Assembly Complete - Ready for Implementation
**Date:** 2025-12-01
**Assembly File:** `scenarios/m01_first_contact.json.erb`

---

## Table of Contents

1. [Implementation Order](#implementation-order)
2. [Critical TODOs Resolution](#critical-todos-resolution)
3. [Room Dimension Specifications](#room-dimension-specifications)
4. [Ink Script Compilation](#ink-script-compilation)
5. [EXTERNAL Variables Reference](#external-variables-reference)
6. [Coordinate System Guidelines](#coordinate-system-guidelines)
7. [Testing Checklist](#testing-checklist)
8. [Integration Notes](#integration-notes)
9. [Known Issues and Workarounds](#known-issues-and-workarounds)
10. [Performance Considerations](#performance-considerations)

---

## Implementation Order

### Phase 1: Foundation (Prerequisites)

**Must be completed before scenario can load:**

1. **Ink Script Compilation**
   - Compile all 9 .ink files to .json format using Inky
   - Verify EXTERNAL variable references
   - Test all diverts and choices
   - **Estimated Time:** 2-4 hours
   - **Priority:** CRITICAL

2. **Room Dimension Specification**
   - Define exact GU dimensions for all 7 rooms
   - Calculate usable space (dimension - 2 GU padding)
   - Update scenario.json.erb with final values
   - **Estimated Time:** 4-8 hours
   - **Priority:** CRITICAL

3. **Variable Reference Document**
   - Create master list of all EXTERNAL variables
   - Document all internal Ink variables
   - Standardize naming conventions
   - **Estimated Time:** 2 hours
   - **Priority:** CRITICAL

### Phase 2: Content Integration

**Can be implemented in parallel after Phase 1:**

4. **Object Coordinate Placement**
   - Specify exact x,y coordinates for all containers
   - Position NPCs within usable space
   - Place interactive objects (terminals, whiteboards)
   - **Estimated Time:** 4-6 hours
   - **Priority:** HIGH

5. **ERB Template Processing**
   - Generate Base64 encoded messages
   - Process all ERB blocks
   - Verify output JSON validity
   - **Estimated Time:** 1-2 hours
   - **Priority:** HIGH

6. **CyberChef Implementation**
   - Specify custom UI approach
   - Implement Base64 decoder interface
   - Add educational tooltips
   - **Estimated Time:** 8-12 hours
   - **Priority:** HIGH

### Phase 3: Polish and Testing

**After Phase 2 content is integrated:**

7. **Asset Integration**
   - Add 3D models for rooms
   - Add character sprites for NPCs
   - Add sound effects for interactions
   - **Estimated Time:** 16-24 hours
   - **Priority:** MEDIUM

8. **VM Scenario Integration**
   - Link to SecGen "Introduction to Linux and Security lab"
   - Configure flag validation
   - Test hybrid workflow
   - **Estimated Time:** 4-6 hours
   - **Priority:** HIGH

9. **Playtesting and Balancing**
   - Test all critical paths
   - Verify objective completion
   - Balance difficulty and pacing
   - **Estimated Time:** 8-12 hours
   - **Priority:** HIGH

---

## Critical TODOs Resolution

### TODO Category 1: Room Dimensions

**Problem:** Scenario.json.erb contains placeholder dimensions that must be replaced with exact GU specifications.

**Location:** All entries in `scenario.rooms[]` array

**Resolution Steps:**

1. **Design Constraints:**
   - Minimum room size: 4×4 GU
   - Maximum room size: 15×15 GU
   - All rooms must include 1 GU padding on all sides
   - Usable space = (width - 2) × (height - 2)

2. **Recommended Dimensions:**

```json
{
  "reception_area": {
    "dimensions": {"width": 10, "height": 8},
    "usable_space": {"width": 8, "height": 6},
    "rationale": "Large public space, needs desk + seating area"
  },
  "main_office": {
    "dimensions": {"width": 15, "height": 12},
    "usable_space": {"width": 13, "height": 10},
    "rationale": "Largest room, contains 4 NPC desks + filing cabinets"
  },
  "dereks_office": {
    "dimensions": {"width": 8, "height": 8},
    "usable_space": {"width": 6, "height": 6},
    "rationale": "CEO office, needs desk + filing cabinet + whiteboard"
  },
  "server_room": {
    "dimensions": {"width": 6, "height": 8},
    "usable_space": {"width": 4, "height": 6},
    "rationale": "Narrow room, server racks + drop-site terminal"
  },
  "conference_room": {
    "dimensions": {"width": 10, "height": 6},
    "usable_space": {"width": 8, "height": 4},
    "rationale": "Rectangular meeting room, table + chairs"
  },
  "break_room": {
    "dimensions": {"width": 6, "height": 6},
    "usable_space": {"width": 4, "height": 4},
    "rationale": "Small staff kitchen, minimal furniture"
  },
  "storage_closet": {
    "dimensions": {"width": 4, "height": 4},
    "usable_space": {"width": 2, "height": 2},
    "rationale": "Minimum size room, single supply cabinet"
  }
}
```

3. **Update Process:**
   - Replace all `"TODO_DIMENSIONS"` comments
   - Update `dimensions` object with final values
   - Verify room connections don't overlap
   - Update spawn points to be within usable space

### TODO Category 2: Ink Compilation

**Problem:** All .ink source files must be compiled to .json before game engine can load them.

**Location:** All entries in `scenario.ink_scripts` object

**Resolution Steps:**

1. **Source Files Location:**
   - All .ink files located in: `planning_notes/overall_story_plan/mission_initializations/m01_first_contact/07_ink_scripts/`
   - 9 files total:
     - m01_opening_briefing.ink
     - m01_npc_sarah.ink
     - m01_npc_kevin.ink
     - m01_npc_maya.ink
     - m01_npc_derek.ink
     - m01_terminal_dropsite.ink
     - m01_terminal_cyberchef.ink
     - m01_phone_agent0x99.ink
     - m01_closing_debrief.ink

2. **Compilation Process:**
   ```bash
   # Using Inky editor:
   # 1. Open each .ink file in Inky
   # 2. File -> Export to JSON
   # 3. Save to: scenarios/ink_scripts/m01/[filename].json

   # Or using inklecate CLI:
   inklecate -o scenarios/ink_scripts/m01/m01_opening_briefing.json \
            planning_notes/.../m01_opening_briefing.ink
   ```

3. **Validation:**
   - Each .json file should load without errors
   - Verify all knots and diverts are present
   - Check EXTERNAL variable declarations
   - Test with game engine's Ink runtime

4. **Update scenario.json.erb:**
   ```json
   "opening_briefing": {
     "file": "scenarios/ink_scripts/m01/m01_opening_briefing.json",
     "source_ink": "planning_notes/.../m01_opening_briefing.ink"
   }
   ```

### TODO Category 3: Object Coordinates

**Problem:** All containers, NPCs, and interactive objects need exact x,y coordinates within room usable space.

**Location:** All `spawn_point`, `position`, and `location` fields

**Resolution Steps:**

1. **Coordinate System:**
   - Origin (0,0) = Top-left corner of room
   - X-axis increases right
   - Y-axis increases down
   - All coordinates in Grid Units (GU)

2. **Placement Guidelines:**
   - Objects must be within usable space bounds
   - Leave 1 GU minimum between interactive objects
   - NPC desks should face open areas
   - Containers against walls when possible

3. **Example Placements for Main Office (15×12 GU):**
   ```json
   {
     "npc_kevin_desk": {"x": 3, "y": 3},
     "npc_maya_desk": {"x": 10, "y": 3},
     "filing_cabinet_1": {"x": 2, "y": 10},
     "filing_cabinet_2": {"x": 12, "y": 10}
   }
   ```

4. **Validation:**
   - All coordinates within usable space
   - No overlapping objects
   - Accessible paths between all objects
   - NPC patrol paths don't clip objects

---

## Room Dimension Specifications

### Recommended Final Layout

**Total Office Footprint:** Approximately 50×40 GU

```
┌────────────────────────────────────────────────────┐
│  Reception (10×8)                                  │
│  ┌──────────────┐                                  │
│  │    [Desk]    │──┐                               │
│  │              │  │                               │
│  └──────────────┘  │                               │
│                    │                               │
│     ┌──────────────┴─────────────┐                │
│     │  Main Office (15×12)       │                │
│     │  [Kevin]    [Maya]          │                │
│     │                             │                │
│     │  [Filing]       [Filing]    │                │
│     └──┬────────┬─────────────┬──┘                │
│        │        │             │                    │
│   ┌────┴───┐ ┌─┴────────┐ ┌──┴─────────┐         │
│   │ Break  │ │Conference│ │  Server    │         │
│   │ (6×6)  │ │ (10×6)   │ │  (6×8)     │         │
│   └────────┘ └──────────┘ │ [Terminal] │         │
│                            └────────────┘         │
│                                                    │
│   ┌────────────┐  ┌────────┐                     │
│   │ Derek's    │  │Storage │                     │
│   │ Office     │  │(4×4)   │                     │
│   │ (8×8)      │  └────────┘                     │
│   │ [Locked]   │                                  │
│   └────────────┘                                  │
└────────────────────────────────────────────────────┘
```

### Room Connection Matrix

| From Room         | To Room           | Direction | Door Type | Lock Status     |
|-------------------|-------------------|-----------|-----------|-----------------|
| reception_area    | main_office       | north     | open      | unlocked        |
| main_office       | dereks_office     | west      | door      | keycard_lock    |
| main_office       | server_room       | east      | door      | keycard_lock    |
| main_office       | conference_room   | south     | open      | unlocked        |
| main_office       | break_room        | southwest | open      | unlocked        |
| main_office       | storage_closet    | southeast | door      | pickable_lock   |

---

## Ink Script Compilation

### EXTERNAL Variables Reference

**Game System Must Provide These Variables:**

```ink
// Player state
EXTERNAL player_name             // String: Player's chosen name
EXTERNAL player_reputation       // Int: 0-100 global reputation
EXTERNAL current_room            // String: Current room ID

// Mission progress
EXTERNAL tasks_completed         // Int: Number of tasks completed
EXTERNAL objectives_completed    // Int: Number of objectives completed

// Inventory
EXTERNAL has_item(item_id)       // Bool: Check if player has item
EXTERNAL item_count(item_id)     // Int: Quantity of item

// Time
EXTERNAL mission_time_elapsed    // Int: Seconds since mission start
EXTERNAL current_hour            // Int: 0-23 game time hour

// NPC relationships (for this mission)
EXTERNAL sarah_trust             // Int: 0-100
EXTERNAL kevin_trust             // Int: 0-100
EXTERNAL maya_trust              // Int: 0-100
EXTERNAL derek_suspicion         // Int: 0-100
```

### Internal Variables Used Across Scripts

**These variables persist between Ink script sessions:**

```ink
// Player approach tracking
VAR player_approach = "neutral"  // Options: "neutral", "professional", "friendly", "aggressive"

// Mission flags
VAR learned_about_backdoor = false
VAR learned_about_zds = false
VAR learned_encoding = false
VAR derek_confronted = false

// VM flag submissions
VAR ssh_flag_submitted = false
VAR linux_flag_submitted = false
VAR sudo_flag_submitted = false

// Derek confrontation
VAR confrontation_approach = "observe"  // Options: "observe", "accuse", "empathize"
VAR final_choice = ""  // Options: "arrest", "recruit", "expose"

// Performance tracking
VAR stealth_maintained = true
VAR no_alerts_triggered = true
VAR helped_maya = false
```

**IMPORTANT:** `player_approach` (from opening_briefing) and `confrontation_approach` (from Derek confrontation) are DIFFERENT variables. Document clearly in game code.

### Compilation Validation Checklist

For each .ink file:

- [ ] Opens in Inky without errors
- [ ] All EXTERNAL variables declared at top
- [ ] All diverts resolve to valid knots
- [ ] All sticky choices have proper logic
- [ ] Hub patterns return to `-> hub` correctly
- [ ] Tags are properly formatted (#complete_task:id, #give_item:id)
- [ ] Conditional logic uses correct operators (==, >, <, not, and, or)
- [ ] String comparisons use quotes correctly
- [ ] Variables initialized before use
- [ ] Exports to .json successfully

---

## Coordinate System Guidelines

### Grid Unit (GU) System

**1 GU = 1 tile in game world**

- Minimum object size: 1×1 GU
- Player character size: 1×1 GU
- Standard desk size: 2×1 GU
- Filing cabinet: 1×2 GU
- NPC collision radius: 0.5 GU around center

### Placement Best Practices

1. **Against Walls:**
   - Filing cabinets, whiteboards, terminals
   - Position 1 GU from room edge (within padding zone is OK for wall-mounted)

2. **Central Areas:**
   - Desks should be 2 GU from walls minimum
   - Leave 2 GU walkways between furniture
   - NPCs patrol in open areas

3. **Interactive Objects:**
   - Player must be within 1.5 GU to interact
   - Face interactive objects toward open space
   - Ensure 270° access arc (except wall-mounted)

### Example: Derek's Office Layout (8×8 GU)

```
0 1 2 3 4 5 6 7 8
┌─────────────────┐ 0
│ P P P P P P P P │ 1  (P = Padding)
│ P W W W W W W P │ 2  (W = Whiteboard)
│ P . . . . . . P │ 3
│ P . D D . . . P │ 4  (D = Desk)
│ P . D D . F . P │ 5  (F = Filing cabinet)
│ P . . . . F . P │ 6
│ P P P P P P P P │ 7
└─────────────────┘ 8

Coordinates:
- Derek spawn: (3, 4) - behind desk
- Desk: (2-3, 4-5)
- Filing cabinet: (5, 5-6)
- Whiteboard: (2-7, 2)
- Player spawn when entering: (4, 6)
```

---

## Testing Checklist

### Critical Path Testing

**Minimal Completion (60%) Path:**

1. [ ] Player spawns in reception
2. [ ] Get visitor badge from Sarah
3. [ ] Enter main office
4. [ ] Talk to Kevin for social engineering
5. [ ] Access VM, complete SSH brute force
6. [ ] Submit SSH flag at drop-site
7. [ ] Complete Linux navigation challenge
8. [ ] Submit Linux flag
9. [ ] Obtain keycard to Derek's office
10. [ ] Confront Derek with minimal evidence
11. [ ] Make final choice (any option)
12. [ ] Complete closing debrief

**Standard Completion (80%) Path:**

All minimal tasks PLUS:
13. [ ] Pick storage closet lock for tools
14. [ ] Decode whiteboard message
15. [ ] Find 1+ LORE fragments
16. [ ] Complete sudo escalation challenge
17. [ ] Submit sudo flag
18. [ ] Gather evidence before Derek confrontation

**Perfect Completion (100%) Path:**

All standard tasks PLUS:
19. [ ] Protect Maya from retaliation
20. [ ] Find all 3 LORE fragments
21. [ ] Maintain stealth (no alerts)
22. [ ] Make optimal Derek choice based on evidence
23. [ ] Gather all intelligence from Agent 0x99

### Objective Completion Testing

For each of 9 aims:

- [ ] `establish_presence`: Enter office, get badge
- [ ] `investigate_physical`: Search containers, find client list
- [ ] `social_engineer`: Talk to Kevin, Maya, extract info
- [ ] `access_systems`: Get server room access
- [ ] `vm_ssh`: Complete SSH brute force, submit flag
- [ ] `vm_linux_nav`: Complete Linux challenge, submit flag
- [ ] `vm_sudo`: Complete sudo escalation, submit flag
- [ ] `gather_evidence`: Decode messages, find LORE, piece together conspiracy
- [ ] `confront_derek`: Complete confrontation, make choice, finish debrief

### Lock System Testing

- [ ] **visitor_badge_lock**: Unlocked by talking to Sarah
- [ ] **dereks_office_keycard_lock**: Unlocked by obtaining Kevin's keycard
- [ ] **server_room_keycard_lock**: Unlocked by obtaining Kevin's keycard (same card)
- [ ] **storage_closet_pickable_lock**: Pickable with lockpick from Kevin
- [ ] **filing_cabinet_dereks_office**: Password lock "MANIFESTO" (from decoded whiteboard)
- [ ] **safe_dereks_office**: RFID lock (ZDS employee badge from Maya's desk)

### Ink Dialogue Testing

For each NPC script:

- [ ] Initial conversation flows naturally
- [ ] Hub returns work correctly
- [ ] Player choices branch appropriately
- [ ] Task completion tags trigger correctly
- [ ] Item giving tags work properly
- [ ] Variables persist between conversations
- [ ] Trust/suspicion values update correctly
- [ ] Conditional dialogue shows based on player actions

### Hybrid Workflow Testing

- [ ] VM scenario launches from in-game terminal
- [ ] Player can return to game while VM runs
- [ ] Flags captured from VM correctly
- [ ] Drop-site terminal accepts correct flags only
- [ ] Flag submission completes correct tasks
- [ ] Agent 0x99 messages trigger on VM progress

---

## Integration Notes

### ERB Template Processing

**Processing Order:**

1. **Pre-processing:** Ruby code in `<% %>` blocks executes first
2. **Variable substitution:** `<%= %>` blocks replace with output
3. **JSON validation:** Verify output is valid JSON after processing

**Example Processing:**

```erb
<%
# This runs first
def base64_encode(text)
  require 'base64'
  Base64.strict_encode64(text)
end

client_list = "Coordinating with ZDS for infrastructure"
%>

"content": {
  "encoded_text": "<%= base64_encode(client_list) %>",
  "plain_text_for_dev": "<%= client_list %>"
}
```

**Output after processing:**

```json
"content": {
  "encoded_text": "Q29vcmRpbmF0aW5nIHdpdGggWkRTIGZvciBpbmZyYXN0cnVjdHVyZQ==",
  "plain_text_for_dev": "Coordinating with ZDS for infrastructure"
}
```

### VM Scenario Integration

**SecGen Scenario:** "Introduction to Linux and Security lab"

**Flag Format:** `FLAG_[CHALLENGE]_[RESULT]_[DESCRIPTOR]`

Examples:
- `FLAG_SSH_BRUTE_FORCE_SUCCESS`
- `FLAG_LINUX_NAVIGATION_COMPLETE`
- `FLAG_SUDO_ESCALATION_ROOT`

**Integration Points:**

1. **VM Launch:** Player interacts with terminal in server room
2. **Flag Capture:** Player finds flags in VM environment
3. **Flag Submission:** Player enters flags at drop-site terminal
4. **Task Completion:** Correct flag completes corresponding task
5. **Intelligence Unlock:** Flag submission reveals narrative content

**Workflow Diagram:**

```
In-Game: Talk to Kevin → Get password hints
   ↓
VM: Use hints for Hydra brute force → Obtain SSH access
   ↓
VM: Navigate Linux filesystem → Find flag file
   ↓
In-Game: Submit flag at drop-site → Unlock intelligence
   ↓
In-Game: Agent 0x99 message → Next challenge guidance
```

### CyberChef Implementation Specification

**Decision Required:** Choose implementation approach

**Option A: Custom In-Game UI**

Pros:
- Full control over UX
- Seamless integration
- No external dependencies
- Can teach concepts step-by-step

Cons:
- Higher development time
- Need to implement encoding algorithms
- Maintenance burden

**Option B: Embedded Web Tool**

Pros:
- Use real CyberChef (educational authenticity)
- No algorithm implementation needed
- Low development time

Cons:
- External dependency
- Less integrated UX
- Harder to guide player

**Recommendation:** Option A (Custom In-Game UI)

**Specification:**

```json
{
  "terminal_cyberchef": {
    "type": "interactive_terminal",
    "ui_mode": "custom_decoder",
    "supported_encodings": ["base64"],
    "interface": {
      "input_field": "Enter encoded text",
      "encoding_selector": "Dropdown: [Base64, Hex, URL, etc.]",
      "decode_button": "Decode",
      "output_field": "Decoded result",
      "tutorial_panel": "Educational info about selected encoding"
    },
    "educational_features": {
      "show_algorithm_steps": true,
      "compare_encoding_encryption": true,
      "highlight_common_patterns": true
    }
  }
}
```

### Asset Requirements

**3D Models Needed:**

- [ ] Reception desk with counter
- [ ] Office desk (standard, reusable)
- [ ] CEO desk (larger, prestigious)
- [ ] Filing cabinet (4-drawer)
- [ ] Server rack
- [ ] Conference table with chairs
- [ ] Whiteboard (wall-mounted)
- [ ] Computer terminal (desk-mounted)
- [ ] Safe (floor-standing)
- [ ] Supply cabinet
- [ ] Break room kitchenette

**Character Models/Sprites:**

- [ ] Sarah (receptionist, young professional)
- [ ] Kevin (IT admin, casual tech bro)
- [ ] Maya (data analyst, cautious professional)
- [ ] Derek Lawson (CEO, charismatic leader, 40s)
- [ ] Agent 0x99 (voice only, no model needed)

**UI Elements:**

- [ ] Visitor badge icon
- [ ] Keycard icon
- [ ] Lockpick icon
- [ ] RFID badge icon
- [ ] Computer terminal interface
- [ ] Drop-site flag submission interface
- [ ] CyberChef decoder interface
- [ ] Phone call interface (Agent 0x99)
- [ ] Mission briefing interface

**Sound Effects:**

- [ ] Door unlock/lock sounds
- [ ] Drawer open/close
- [ ] Computer terminal typing
- [ ] Phone ring/pickup
- [ ] Success/failure chimes
- [ ] Alert sound (if stealth broken)
- [ ] Ambient office sounds

**Music:**

- [ ] Ambient office background (low tension)
- [ ] Investigation theme (medium tension)
- [ ] Confrontation theme (high tension)
- [ ] Success theme (mission complete)

---

## Known Issues and Workarounds

### Issue 1: Variable Naming Inconsistency

**Problem:** `player_approach` vs. `confrontation_approach` - unclear if these are the same variable

**Impact:** Potential runtime errors if confusion occurs

**Workaround:** Treat as DIFFERENT variables:
- `player_approach`: Set in opening_briefing (overall mission style)
- `confrontation_approach`: Set in Derek confrontation (specific tactic)

**Permanent Fix:** Create master variable reference document, clearly distinguish these in all Ink scripts

### Issue 2: Drop-Site Terminal Access

**Observation:** Drop-site terminal is in locked server room, but needed for flag submission

**Analysis:** NOT a bug - intentional progressive unlocking:
1. Player gets Kevin's keycard (from social engineering)
2. Keycard unlocks server room
3. Player accesses drop-site terminal
4. VM challenges completed during/after getting access

**Validation:** Workflow tested in logical flow validation, confirmed sequential

### Issue 3: Derek's Dialogue Depth

**Feedback:** Derek's philosophical explanation feels compressed compared to planning documents

**Impact:** Critical villain moment may lack narrative weight

**Workaround:** Current dialogue is functional and follows 3-line constraint

**Enhancement:** Consider expanding Phase 3 explanation by 1-2 exchanges:
```ink
=== phase_3_explanation ===
Derek: My vision goes beyond money. Social Fabric will reshape how society trusts itself.

+ [That's dangerous centralized power]
    -> challenge_centralization
+ [How does that justify the backdoor?]
    -> justify_backdoor
```

**Priority:** Low - Can be addressed in revision pass

### Issue 4: CyberChef Implementation Undefined

**Problem:** No specification for how CyberChef decoder will be implemented

**Impact:** Blocks UI/UX development for encoding challenges

**Workaround:** Use placeholder terminal with text input/output for initial implementation

**Required Decision:** Choose Custom UI vs. Embedded Web Tool (see Integration Notes section)

### Issue 5: LORE Fragment Placement

**Observation:** All 3 LORE fragments accessible without complex puzzles (beginner mission design)

**Question:** Is this too easy for perfect completion?

**Analysis:** INTENTIONAL design for Mission 1:
- Social Fabric Manifesto: In Derek's unlocked desk drawer
- Architect's Letter: In storage closet (requires lockpick)
- Network Backdoor Analysis: In safe (requires RFID badge from Maya's desk)

**Validation:** Appropriate difficulty curve for beginner mission, teaches fragment hunting

---

## Performance Considerations

### Ink Script Optimization

**Best Practices:**

1. **Use Sticky Choices Wisely:**
   - Sticky choices persist, use for hub patterns
   - Non-sticky choices for one-time events
   - Too many sticky choices = cluttered UI

2. **Minimize Variable Checks:**
   - Cache complex conditions in temporary variables
   - Avoid nested conditionals beyond 2 levels deep

3. **Optimize Hub Patterns:**
   ```ink
   === hub ===
   {learned_encoding and ssh_flag_submitted:
       -> advanced_hub
   }

   + [Talk about work]
       -> work_topic
   + [Ask about Derek]
       -> derek_topic
   -> hub
   ```

### Room Loading

**Recommendations:**

1. **Pre-load Adjacent Rooms:**
   - When player enters reception, pre-load main office
   - Reduces transition stutter

2. **Lazy Load Assets:**
   - Load room 3D models on-demand
   - Cache recently visited rooms
   - Unload rooms player hasn't visited in 10 minutes

3. **Optimize NPC Pathfinding:**
   - Patrol routes pre-calculated
   - Use waypoint system instead of real-time pathfinding

### ERB Processing

**Build-Time vs. Runtime:**

- **Build-time processing (recommended):** Run ERB once, commit output JSON
- **Runtime processing:** Re-process ERB each game launch (slower, but dynamic)

**For Mission 1:** Use build-time processing, content is static

---

## Developer Handoff Checklist

### Before Implementation Begins:

- [ ] All 9 .ink files compiled to .json and tested
- [ ] Room dimensions finalized with exact GU specifications
- [ ] Variable reference document created
- [ ] CyberChef implementation approach decided
- [ ] All coordinates specified for objects
- [ ] ERB template processed and validated
- [ ] Asset requirements list reviewed
- [ ] VM scenario integration tested independently

### During Implementation:

- [ ] Test each objective completion independently
- [ ] Verify lock systems unlock correctly
- [ ] Validate Ink variables persist between conversations
- [ ] Confirm hybrid workflow (VM ↔ game) functions
- [ ] Check all room connections and collision
- [ ] Playtest critical path from start to finish
- [ ] Verify all EXTERNAL variables provided by game system
- [ ] Test edge cases (wrong flags, out-of-order completion)

### Before Release:

- [ ] Complete full mission playtest (all paths)
- [ ] Verify minimal/standard/perfect completion %
- [ ] Check all LORE fragments discoverable
- [ ] Confirm all dialogue flows naturally
- [ ] Validate all task completion triggers
- [ ] Test performance (no lag in transitions)
- [ ] Verify all assets loaded correctly
- [ ] Final QA pass on narrative content

---

## Summary

**Mission 1: First Contact** is ready for implementation pending resolution of critical TODOs:

1. Room dimension specifications (4-8 hours)
2. Ink script compilation (2-4 hours)
3. Variable reference documentation (2 hours)
4. CyberChef implementation decision (1 hour planning)

**Total estimated prep time:** 10-16 hours before implementation can begin

**Expected implementation time:** 60-80 hours (including asset creation)

**Risk Level:** LOW - Logical flow validated, no circular dependencies, all objectives completable

**Ready for development team handoff:** YES (with critical TODOs addressed first)

---

**Document Version:** 1.0
**Last Updated:** 2025-12-01
**Next Review:** After critical TODOs resolved
