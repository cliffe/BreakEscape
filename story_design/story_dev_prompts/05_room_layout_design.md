# Stage 5: Room Layout and Challenge Distribution

**Purpose:** Design the physical space where your scenario takes place, including room layouts, challenge placement, item distribution, NPC positioning, container placement, lock systems, and interactive elements, while adhering to strict technical constraints.

**Output:** Complete room layout **design documentation** with spatial design, challenge placement, item distribution, container/lock integration, NPC positioning, objectives mapping, and technical compliance verification.

---

## Your Role

You are a level designer for Break Escape. Your tasks:

1. Design room layouts that support narrative and gameplay
2. Place challenges in appropriate locations
3. Distribute items and LORE fragments strategically
4. Position NPCs (in-person and phone chat)
5. **Integrate containers, locks, and interactive objects**
6. **Map objectives to room locations**
7. **Place VM access and drop-site terminals**
8. **Comply with all technical room generation constraints**

**CRITICAL:** Room layout is governed by strict technical rules. Violating these rules will result in unplayable scenarios.

## Design vs. Implementation

**IMPORTANT:** Stage 5 focuses on **spatial design and game flow**. You are creating design documentation that describes WHAT should exist and WHY.

**Stage 5 (This Stage):**
- Spatial layout and room connections
- Progressive unlocking strategy
- Container/NPC/objective placement decisions
- Design rationale and pacing
- Lightweight sketches showing intent

**Stage 9 (Scenario Assembly):**
- Complete JSON implementation
- ERB template integration
- Logical flow validation
- Final technical compliance
- scenario.json.erb file creation

Your output will be used by Stage 9 to create the final scenario.json.erb file. Focus on clear design communication rather than perfect JSON syntax.

## Required Input

From previous stages:
- **Stage 0:** Technical challenges, ENTROPY cell, narrative theme
- **Stage 1:** Narrative structure (three-act breakdown)
- **Stage 2:** Character development (NPC profiles)
- **Stage 3:** Choice points
- **Stage 4:** Player objectives (objective-to-world mapping)

## Required Reading

### ESSENTIAL - Technical Documentation
- **`docs/ROOM_GENERATION.md`** - **CRITICAL:** All room generation rules, measurements, constraints
- **`docs/GAME_DESIGN.md`** - Core game mechanics and challenge types
- **`docs/OBJECTIVES_AND_TASKS_GUIDE.md`** - How objectives integrate with world

### ESSENTIAL - Game Systems Documentation
- **`docs/CONTAINER_MINIGAME_USAGE.md`** - Container types, placement, item storage
- **`docs/LOCK_KEY_QUICK_START.md`** - Lock and key system basics
- **`docs/LOCK_SCENARIO_GUIDE.md`** - Advanced lock system usage in scenarios
- **`docs/NOTES_MINIGAME_USAGE.md`** - Notes system for encoded messages and clues
- **`docs/NPC_INTEGRATION_GUIDE.md`** - NPC placement (in-person vs phone), dialogue triggers

### Essential - Design Documentation
- `story_design/universe_bible/06_locations/` - Location types and atmosphere
- `story_design/universe_bible/09_scenario_design/framework.md` - Design principles
- Stage 4 output: Player objectives with objective-to-world mapping

## Critical Technical Constraints

**READ `docs/ROOM_GENERATION.md` IN FULL before proceeding.**

### Grid Units and Measurements

**All measurements in Grid Units (GU):**
- **1 GU = 1.5 meters**
- Player character occupies ~1 GU space
- Furniture/objects typically 1-2 GU

### Room Size Rules

- **Minimum room size:** 4×4 GU
- **Maximum room size:** 15×15 GU
- **All rooms have 1 GU padding on all sides** (not usable)
- **Usable space = room dimensions - 2 GU** (1 GU padding each side)

**Example:**
- 6×6 GU room → 4×4 GU usable interior space
- 10×8 GU room → 8×6 GU usable interior space

### Placement Rules

- **Items/furniture ONLY in usable space** (never in 1 GU padding)
- **Doors/connections placed at edges** (in the padding zone)
- **NPCs placed in usable space**
- **Interactive objects in usable space**

### Room Connection Rules

- **Rooms must overlap by ≥ 1 GU** to connect via doors
- Connections can be locked, require keycards, etc.
- Consider progressive unlocking (locked at start, unlocked via objectives)

## Understanding Game Systems

### Container System

Containers store items, evidence, LORE fragments, and equipment. Players interact with containers to retrieve contents.

**Container Types (see `docs/CONTAINER_MINIGAME_USAGE.md`):**
- **Filing cabinets** - Office documents, evidence
- **Safes** - Valuable items, important intel (may have PIN locks)
- **Lockers** - Personal belongings, equipment
- **Desk drawers** - Small items, notes
- **Crates/boxes** - Storage areas, industrial settings
- **Computers** - Digital files (may require passwords)

**Placement Considerations:**
- Containers should make narrative sense (filing cabinets in offices, lockers in break rooms)
- Critical evidence in locked containers (requires key, keycard, or PIN)
- Optional content in easily accessible containers

### Lock and Key System

Locks restrict access to rooms, containers, and areas. Players must find keys, clone keycards, or crack PINs.

**Lock Types (see `docs/LOCK_KEY_QUICK_START.md` and `docs/LOCK_SCENARIO_GUIDE.md`):**
- **Physical locks** - Require lockpicking skill or matching key
- **RFID keycards** - Clone from NPCs or find in containers
- **PIN locks** - Crack using PIN cracker device or find code via investigation
- **Password locks** - For computers/terminals, find via social engineering or notes

**Progressive Unlocking:**
- Start with limited accessible rooms
- Unlock new areas via objectives (find key, clone keycard, discover PIN)
- Backtracking: player must return to previously locked areas with new access

### NPC Placement

NPCs provide intel, items, and interact with story. They can be in-person (in rooms) or via phone chat.

**NPC Integration Modes (see `docs/NPC_INTEGRATION_GUIDE.md`):**

**In-Person NPCs:**
- Physically present in rooms
- Player walks up and initiates dialogue
- Can have patrol routes (guards)
- Can be hostile (combat NPCs)
- Can give items directly

**Phone Chat NPCs:**
- Accessible anywhere via phone
- Player initiates from phone menu
- Good for remote handlers (Agent 0x99)
- Good for NPCs not physically present
- Can unlock information remotely

**Placement Strategy:**
- **Act 1:** More in-person NPCs for tutorial/world-building
- **Act 2:** Mix of in-person (investigation) and phone (handler updates)
- **Act 3:** Confrontation NPCs in-person, support via phone

### Notes and Encoded Messages

Notes system displays text messages with optional encoding (Base64, ROT13, hex).

**Note Types (see `docs/NOTES_MINIGAME_USAGE.md`):**
- **Sticky notes** - Password hints, codes, reminders
- **Whiteboards** - Larger encoded messages, diagrams
- **Computer files** - Digital documents, emails
- **Physical documents** - Printed reports, memos

**Encoding in Notes:**
- Can specify encoding type (Base64, ROT13, hex, plaintext)
- Player must decode using CyberChef workstation
- Notes can trigger objectives (`#complete_task:decode_whiteboard`)

### VM Access and Drop-Site Terminals

**Hybrid Architecture Integration:**

**VM Access Points:**
- Terminals where player accesses VM challenges
- Typically in server rooms, IT areas, secured locations
- May require unlocking (keycard, password)
- Narratively justified (need physical access to target systems)

**Drop-Site Terminals:**
- Terminals where player submits VM flags
- Represent "intercepted ENTROPY communications" submission
- Can be same location as VM access or separate
- Unlock resources/intel when flags submitted

## Process

### Step 1: Define Overall Location

**Template:**

```markdown
## Location: [Location Name]

**Type:** [Office Building / Data Center / Industrial Facility / Hospital / etc.]
**Size:** [Small (5-8 rooms) / Medium (9-12 rooms) / Large (13-20 rooms)]
**Atmosphere:** [Professional / Crisis / Industrial / etc.]
**Time of Day:** [Daytime / Evening / Night]
**Occupancy:** [Bustling / Normal / Abandoned / After-hours]

**Narrative Justification:**
[Why does scenario take place here? What does ENTROPY want from this location?]

**Security Level:**
- **Entry:** [Easy / Moderate / Difficult]
- **Internal Security:** [Guards / Cameras / RFID keycards / etc.]
- **Restricted Areas:** [Server room, executive offices, etc.]
```

### Step 2: Design Individual Rooms

For each room, specify exact dimensions, purpose, contents, and connections.

**Template:**

```markdown
### Room: [Room Name]

**ID:** `room_id_here`
**Dimensions:** [Width] × [Height] GU
**Usable Space:** [Width-2] × [Height-2] GU
**Type:** [Office / Corridor / Server Room / Break Room / etc.]

**Description:**
[1-2 sentence visual description for atmosphere]

**Connections:**
- **North:** [Connected room ID, door type (open/locked/keycard)]
- **East:** [Connected room ID, door type]
- **South:** [Connected room ID, door type]
- **West:** [Connected room ID, door type]

**Containers:**
1. **[Container Type]** (e.g., Filing Cabinet)
   - **Position:** [X, Y coordinates in usable space]
   - **Lock:** [None / Physical Lock / PIN Code / Password]
   - **Contents:** [Items, documents, LORE fragments]
   - **Narrative Purpose:** [Why is this here?]

2. **[Container Type]**
   [Repeat structure]

**Interactive Objects:**
- **[Object Name]** (e.g., Whiteboard with Base64 message)
  - **Position:** [X, Y]
  - **Interaction:** [What player does]
  - **Result:** [What happens - note displayed, objective completed, etc.]

**NPCs:**
- **[NPC Name]** (In-Person / Patrol Route)
  - **Position:** [X, Y] or [Patrol waypoints]
  - **Dialogue Trigger:** [Automatic / Player-initiated]
  - **Gives Items:** [List if applicable]
  - **Objectives:** [Which tasks completed by talking to this NPC]

**Objectives Completed Here:**
- `task_id_1` - [Task description]
- `task_id_2` - [Task description]

**LORE Fragments:**
- **Fragment [N]:** [Fragment name]
  - **Position:** [X, Y or container]
  - **Unlock Condition:** [Always accessible / After completing task]

**Technical Notes:**
- [Any special considerations, quest flags, conditional states]
```

### Step 3: Create Overall Map Layout

**Map Template:**

```
[Create ASCII or visual diagram showing room connections]

Example:

    ┌─────────────┐
    │   Lobby     │
    │   (6×6 GU)  │
    └──────┬──────┘
           │
    ┌──────┴──────┬──────────────┐
    │             │              │
┌───┴────┐  ┌────┴────┐  ┌──────┴──────┐
│ Office │  │Corridor │  │ Break Room  │
│ (8×6)  │  │ (10×4)  │  │   (6×6)     │
└────────┘  └────┬────┘  └─────────────┘
                 │
           ┌─────┴─────┐
           │Server Room│
           │  (8×8)    │
           │ [LOCKED]  │
           └───────────┘
```

**Include:**
- Room names and dimensions
- Door connections
- Locked areas marked
- VM access points marked
- Drop-site terminals marked
- Key progression path visible

### Step 4: Map Objectives to Rooms

Using your Stage 4 objectives output, map each task to specific room locations:

**Template:**

```markdown
## Objectives-to-Room Mapping

### Objective: [Objective Name]

#### Aim: [Aim Name]

**Task: [Task Name]** (`task_id`)
- **Room:** [room_id] - [Room Name]
- **Interaction:** [Container / NPC / Object / Terminal]
- **Specific Location:** [Filing Cabinet in northwest corner / Whiteboard on east wall / etc.]
- **Completion Method:** [Ink tag / Automatic detection]

[Repeat for all tasks]
```

**Example:**

```markdown
### Objective: Main Mission

#### Aim: Identify Targets

**Task: Decode whiteboard** (`decode_whiteboard`)
- **Room:** `conference_room_01` - Conference Room
- **Interaction:** Whiteboard on east wall
- **Specific Location:** Interactive whiteboard object at (4, 3) in usable space
- **Completion Method:** Ink tag `#complete_task:decode_whiteboard` when player uses CyberChef to decode

**Task: Submit SSH flag** (`submit_ssh_flag`)
- **Room:** `server_room` - Server Room
- **Interaction:** Drop-site terminal (computer)
- **Specific Location:** Northeast corner (6, 6) in usable space
- **Completion Method:** Ink tag `#complete_task:submit_ssh_flag` when flag submitted
```

### Step 5: Design Progressive Unlocking

Map out how rooms unlock over time as player completes objectives:

**Template:**

```markdown
## Progressive Unlocking Flow

**Initial State (Start of Scenario):**
- ✅ Accessible: [List of initially accessible rooms]
- 🔒 Locked: [List of locked rooms and lock types]

**After Objective/Task [Name]:**
- 🔓 Unlocks: [Room name] via [key found / keycard cloned / PIN discovered]
- New Accessible Rooms: [Updated list]

**After Objective/Task [Name]:**
- 🔓 Unlocks: [Room name]
- New Accessible Rooms: [Updated list]

[Continue mapping progression]

**Final State (All Objectives Complete):**
- ✅ All rooms accessible
```

**Example:**

```markdown
## Progressive Unlocking Flow

**Initial State:**
- ✅ Accessible: Lobby, Main Office Area, Break Room
- 🔒 Locked: Executive Office (needs keycard), Server Room (needs password), Storage Room (physical lock)

**After Task: Clone Executive Keycard from NPC:**
- 🔓 Unlocks: Executive Office via RFID keycard
- Contains: PIN code for server room safe

**After Task: Find PIN Code in Executive Safe:**
- 🔓 Unlocks: Server Room safe (contains VM credentials)
- Can now access VM terminal

**After Task: Complete VM Challenge:**
- 🔓 Unlocks: Storage Room key found in VM flag loot
- Contains: Final evidence needed for confrontation
```

---

## ⚠️ CRITICAL: Lock Type Variety and Progression

**Problem:** Using the same lock type (e.g., all key locks) makes gameplay repetitive and boring.

**Solution:** Mix lock types and order them strategically.

### Lock Type Ordering Rules

**RULE 1: Keys BEFORE Lockpick**

Once players obtain a lockpick, they can bypass all key-based locks. Therefore:
- ✅ Use **key-based locks for critical path progression BEFORE** lockpick is obtained
- ✅ Place lockpick as reward AFTER key-based puzzle chain
- ❌ DON'T give lockpick early then expect keys to matter

**Example (Good):**
1. Storage safe (PIN 1337) → Derek's office key
2. Derek's office (key) → access Derek's office
3. Derek's filing cabinet (PIN 0419) → evidence
4. Talk to Kevin after gathering evidence → get lockpick
5. Now lockpick bypasses future key locks (but already used keys)

**Example (Bad):**
1. Talk to Kevin → get lockpick immediately ❌
2. Storage closet (key) → player ignores, uses lockpick instead ❌
3. Keys become useless, puzzle bypassed ❌

**RULE 2: Vary Lock Types**

Mix different lock mechanisms for engagement:
- 🔓 **Lockpick** - Physical skill, tutorial early
- 🔢 **PIN codes** - Discover hints, decode messages, read notes
- 🔑 **Keys** - Find in containers, other rooms (NOT same room as lock!)
- 📱 **RFID/Keycards** - Clone from NPCs, social engineering
- 🔐 **Passwords** - Gather from notes, password hints from NPCs

**Aim for 3+ different lock types per scenario.**

**RULE 3: Keys Not In Same Room As Lock**

Keys should require problem-solving:
- ✅ Key in safe in different room (requires PIN/lockpick to access)
- ✅ Key held by NPC (requires social engineering)
- ✅ Key in container that requires different puzzle
- ❌ Key sitting on desk next to locked door

**RULE 4: Progressive Difficulty**

Order puzzles from easy to hard:
1. **Easy:** Hint nearby (sticky note with PIN next to safe)
2. **Medium:** Hint in different room (maintenance checklist mentions storage safe PIN)
3. **Hard:** Multi-step (decode Base64 message → discover PIN for safe)
4. **Expert:** Chain multiple systems (VM challenge → flag → hint → decode → PIN)

### Lock Progression Template

```markdown
## Lock Variety Analysis

**Lock Types Used:**
- [ ] Lockpick (physical)
- [ ] PIN codes (cognitive)
- [ ] Keys (exploration)
- [ ] RFID/Keycards (social)
- [ ] Passwords (investigation)

**Lock Progression Order:**

1. **[Lock Name]** (Type: PIN)
   - Location: Main office filing cabinet
   - Unlock Method: Sticky note with hint nearby
   - Difficulty: Easy
   - Rewards: LORE fragment
   - Blocks Critical Path: No

2. **[Lock Name]** (Type: PIN)
   - Location: Storage safe
   - Unlock Method: Maintenance checklist in main office
   - Difficulty: Medium
   - Rewards: Derek's office key
   - Blocks Critical Path: Yes

3. **[Lock Name]** (Type: Key)
   - Location: Derek's office door
   - Unlock Method: Key from storage safe
   - Difficulty: Easy (have key)
   - Rewards: Access to Derek's office
   - Blocks Critical Path: Yes
   - **Used BEFORE lockpick obtained** ✅

4. **[Lockpick Obtained]**
   - Source: Kevin (after influence >= 8)
   - Now bypasses future key locks

**Critical Path Locks:** 2 → 3 → (other progression)
**Optional Locks:** 1 (provides LORE but not blocking)
```

### Validation Checklist

- [ ] At least 3 different lock types used
- [ ] Keys used BEFORE lockpick is obtainable
- [ ] Keys are NOT in same room as their locks
- [ ] PIN codes have discoverable hints
- [ ] Locks ordered easy → medium → hard
- [ ] Lockpick comes AFTER key-based progression
- [ ] No "same-y" gameplay (all locks using one method)

---

### Step 6: Design Backtracking Moments

Identify required backtracking (non-linear exploration):

**Template:**

```markdown
## Required Backtracking

1. **[Backtracking Moment Name]**
   - **Trigger:** [What causes need to backtrack]
   - **From:** [Current room/area]
   - **To:** [Destination room/area]
   - **Purpose:** [What player does after returning]
   - **Unlocks:** [What becomes available]

[Repeat for each backtracking moment]
```

**Example:**

```markdown
## Required Backtracking

1. **Return to Lobby After Keycard Clone**
   - **Trigger:** Successfully cloned executive keycard from NPC
   - **From:** Break Room (where NPC was)
   - **To:** Executive Office (now accessible)
   - **Purpose:** Search executive's filing cabinet for server credentials
   - **Unlocks:** Password for server room

2. **Return to Conference Room After VM Challenge**
   - **Trigger:** Submitted VM flags, unlocked new intelligence
   - **From:** Server Room
   - **To:** Conference Room
   - **Purpose:** Correlate VM findings with whiteboard evidence
   - **Unlocks:** Understanding of complete operation
```

### Step 7: Validate Technical Constraints

**Checklist for Each Room:**

```markdown
## Technical Validation

### Room: [Room Name] (`room_id`)

- [ ] Dimensions within 4×4 to 15×15 GU range
- [ ] Usable space calculated correctly (dimensions - 2 GU)
- [ ] All items/containers placed in usable space only
- [ ] All items/containers have valid coordinates
- [ ] No items in 1 GU padding zone
- [ ] Door connections to adjacent rooms have ≥ 1 GU overlap
- [ ] Locked doors have unlock conditions specified
- [ ] Container contents specified
- [ ] NPC positions valid
- [ ] Objectives mapped correctly
```

## Room Layout Design Template

Use this template for your complete room layout document:

```markdown
# Room Layout: [Scenario Name]

## Overview

**Location:** [Location name and type]
**Total Rooms:** [Number]
**Playable Area:** [Small/Medium/Large]
**Security Level:** [Low/Medium/High]

**Design Philosophy:**
[How does room layout support narrative? Linear? Hub-and-spoke? Open exploration?]

---

## Location Description

[2-3 paragraphs describing the overall location, atmosphere, time of day, occupancy]

---

## Individual Room Designs

### Room 1: [Room Name]

**ID:** `room_id`
**Dimensions:** [W] × [H] GU
**Usable Space:** [W-2] × [H-2] GU
**Type:** [Room type]

**Description:**
[Visual description]

**Connections:**
[Door connections with lock states]

**Containers:**
[List with positions, contents, locks]

**Interactive Objects:**
[Whiteboards, computers, terminals, etc.]

**NPCs:**
[NPC positions and details]

**Objectives Completed Here:**
[Task IDs and descriptions]

**LORE Fragments:**
[Fragment placements]

[Repeat for all rooms]

---

## Overall Map Layout

```
[ASCII diagram or description of room connections]
```

---

## Objectives-to-Room Mapping

[Complete mapping from Stage 4 objectives to room locations]

---

## Progressive Unlocking Flow

[How rooms unlock over time]

---

## Required Backtracking

[Backtracking moments mapped]

---

## Container and Lock Summary

### All Containers

| Room | Container Type | Lock Type | Contents | Unlock Condition |
|------|----------------|-----------|----------|------------------|
| [room] | [type] | [lock] | [items] | [condition] |

### All Locks and Keys

| Lock Location | Lock Type | Unlock Method | Key/Code Source |
|---------------|-----------|---------------|-----------------|
| [location] | [type] | [method] | [where found] |

---

## NPC Placement Summary

| NPC Name | Room | In-Person/Phone | Dialogue Purpose | Items Given |
|----------|------|-----------------|------------------|-------------|
| [name] | [room] | [mode] | [purpose] | [items] |

---

## Hybrid Architecture Integration

### VM Access Points

| Room | Terminal Purpose | Access Requirements | VM Challenge |
|------|------------------|---------------------|--------------|
| [room] | [purpose] | [requirements] | [which challenge] |

### Drop-Site Terminals

| Room | Flags Submitted Here | Unlocks |
|------|---------------------|---------|
| [room] | [flag IDs] | [resources] |

---

## Technical Validation

[Checklist for each room confirming compliance with ROOM_GENERATION.md]

---

## Design Notes

### Pacing
[How does room layout control pacing?]

### Difficulty Curve
[How does unlocking progression create difficulty curve?]

### Atmosphere
[How do room designs support narrative atmosphere?]

### Player Guidance
[How do rooms guide player without being too linear?]
```

## Quality Checklist

Before finalizing room layout, verify:

### Technical Compliance
- [ ] All rooms within 4×4 to 15×15 GU dimensions
- [ ] Usable space correctly calculated for all rooms
- [ ] All items/containers placed in usable space (not padding)
- [ ] Room connections have ≥ 1 GU overlap
- [ ] Door positions specified for all connections
- [ ] No technical constraint violations

### Container Integration
- [ ] All containers have specified contents
- [ ] Container types appropriate for location (filing cabinets in offices, etc.)
- [ ] Locked containers have unlock methods specified
- [ ] Critical evidence in narratively justified containers
- [ ] Container positions valid within usable space

### Lock and Key System
- [ ] All locks have unlock methods (key location, PIN source, etc.)
- [ ] Progressive unlocking creates good pacing
- [ ] No circular dependencies (can't get key without accessing locked room)
- [ ] Backtracking opportunities designed intentionally

### NPC Integration
- [ ] All NPCs have positions specified
- [ ] In-person vs phone mode chosen appropriately
- [ ] NPC positions valid within usable space
- [ ] Patrol routes (if any) specified with waypoints
- [ ] NPC dialogue purposes clear

### Objectives Integration
- [ ] Every task from Stage 4 mapped to room location
- [ ] Every task has interaction method specified
- [ ] VM access points and drop-site terminals placed
- [ ] Objectives create logical progression through rooms
- [ ] Optional objectives accessible but not blocking main path

### Hybrid Architecture
- [ ] VM access terminals placed in narratively justified locations
- [ ] Drop-site terminals accessible for flag submission
- [ ] CyberChef workstations placed for decoding challenges
- [ ] Physical evidence correlates with VM findings

### Gameplay Flow
- [ ] Clear starting area
- [ ] Progressive unlocking creates good pacing
- [ ] Required backtracking designed (at least 2-3 moments)
- [ ] Multiple solution paths where appropriate
- [ ] No dead ends or soft locks

### Narrative Support
- [ ] Room layout supports three-act structure
- [ ] Atmosphere appropriate for narrative theme
- [ ] Environmental storytelling opportunities
- [ ] Choice moments have appropriate settings

## Common Pitfalls to Avoid

### Technical Pitfalls
- **Items in padding zone** - Never place items in 1 GU padding around room edges
- **Rooms too small** - Minimum 4×4 GU, usable space 2×2 GU minimum
- **Rooms too large** - Maximum 15×15 GU to avoid performance issues
- **Invalid connections** - Rooms must overlap ≥ 1 GU to connect
- **Wrong coordinates** - Remember coordinates start from (0,0) in usable space

### Container Pitfalls
- **Illogical placement** - Don't put filing cabinets in bathrooms
- **Unclear contents** - Specify exactly what's in each container
- **Orphaned keys** - Every lock must have accessible unlock method
- **Too many containers** - Don't overwhelm players; 2-4 per room max

### NPC Pitfalls
- **Static NPCs everywhere** - Use phone mode for some to reduce clutter
- **Unclear positions** - Specify exact coordinates or "center of room"
- **Blocking progression** - Hostile NPCs should be avoidable or beatable
- **Missed patrol routes** - If guard patrols, specify waypoints

### Objectives Pitfalls
- **Unmapped tasks** - Every task from Stage 4 must have room location
- **Unclear completion** - Specify exactly how task completes (Ink tag, auto)
- **Missing terminals** - Must place VM access and drop-site terminals
- **Soft locks** - Ensure players can't make progression impossible

### Progression Pitfalls
- **Too linear** - Allow some exploration freedom
- **Too open** - Provide guidance through progressive unlocking
- **No backtracking** - Require at least 2-3 backtracking moments
- **Unclear unlocking** - Players should understand why areas unlock

## Examples

### Example 1: Small Office Layout (M1 "First Contact")

```markdown
## Location: Viral Dynamics Media Office

**Type:** Corporate Office Building
**Total Rooms:** 8
**Size:** Small
**Atmosphere:** Professional, after-hours (empty)

### Room 1: Lobby

**ID:** `lobby_01`
**Dimensions:** 8 × 6 GU
**Usable Space:** 6 × 4 GU
**Type:** Reception/Entrance

**Description:**
Professional reception area with modern furniture. Motivational posters on walls. Unmanned reception desk.

**Connections:**
- **North:** `main_office_area` (open door)
- **East:** `break_room` (open door)

**Containers:**
1. **Reception Desk Drawer**
   - **Position:** (2, 2)
   - **Lock:** None
   - **Contents:** Building directory, sticky note with "common passwords" hint
   - **Narrative Purpose:** First clue about password security

**Interactive Objects:**
- **Building Directory Board**
  - **Position:** (1, 1)
  - **Interaction:** Examine to see employee names and room assignments
  - **Result:** Note displayed showing Derek Lawson - Senior Editor, Office 3

**NPCs:** None (lobby empty after-hours)

**Objectives Completed Here:**
- `explore_lobby` - Initial exploration task

### Room 2: Main Office Area

**ID:** `main_office_area`
**Dimensions:** 12 × 10 GU
**Usable Space:** 10 × 8 GU
**Type:** Open Office (cubicles)

**Connections:**
- **South:** `lobby_01` (open)
- **East:** `conference_room` (open)
- **North:** `derek_office` (locked - requires keycard)

**Containers:**
1. **Maya's Desk Drawer**
   - **Position:** (3, 4)
   - **Lock:** None
   - **Contents:** Password list document (for VM challenge)
   - **Narrative Purpose:** Social engineering yields password hints

2. **Filing Cabinet (Northwest)**
   - **Position:** (2, 7)
   - **Lock:** Physical lock (requires lockpicking)
   - **Contents:** LORE Fragment 1 "Social Fabric Manifesto"
   - **Narrative Purpose:** Optional LORE collection

**NPCs:**
- **Maya Chen** (In-Person)
  - **Position:** (4, 4) near desk
  - **Dialogue Trigger:** Player-initiated
  - **Gives Items:** Password hints (via dialogue, not physical item)
  - **Objectives:** `talk_to_maya` - Social engineering tutorial

**Objectives Completed Here:**
- `talk_to_maya` - Interview Maya Chen
- `find_password_hints` - Search her desk
- `lockpick_filing_cabinet` - Optional LORE

### Room 3: Server Room

**ID:** `server_room`
**Dimensions:** 8 × 8 GU
**Usable Space:** 6 × 6 GU
**Type:** IT/Server Room

**Connections:**
- **West:** `main_office_area` (locked - requires RFID keycard cloned from Maya)

**Containers:**
1. **Server Rack (East Wall)**
   - **Position:** (5, 3)
   - **Lock:** None (but room itself locked)
   - **Contents:** Network cable (flavor item)

**Interactive Objects:**
- **VM Access Terminal**
  - **Position:** (3, 3) center of room
  - **Interaction:** Access VM challenges
  - **Result:** Player can SSH into target server

- **Drop-Site Terminal**
  - **Position:** (4, 5) northeast corner
  - **Interaction:** Submit VM flags
  - **Result:** Flags unlock intelligence resources

**Objectives Completed Here:**
- `access_vm` - Access server terminal
- `submit_ssh_flag` - Submit flag 1
- `submit_navigation_flag` - Submit flag 2
- `submit_sudo_flag` - Submit flag 3

[Continue for all 8 rooms...]
```

**Progressive Unlocking:**
1. Start: Lobby, Main Office Area, Break Room, Conference Room accessible
2. After cloning Maya's keycard → Derek's Office unlocked
3. After finding PIN in Derek's safe → Server Room unlocked
4. After completing VM challenges → Storage room key found in flag loot

### Example 2: Hub-and-Spoke Layout (M3 "Ghost in the Machine")

```markdown
## Location: WhiteHat Security Services Office

**Type:** Security Consulting Firm
**Total Rooms:** 10
**Layout:** Hub-and-spoke (central corridor with branches)

[Central corridor connects to: Reception, Office pods, Server room, Training lab]
[Progressive unlocking: Start with reception + 2 office pods, unlock others via keycard cloning]

[Detailed room designs following template...]
```

## Tips for Success

1. **Start with Stage 4 objectives** - Map every task to a room before designing details
2. **Respect technical constraints** - Always calculate usable space (dimensions - 2 GU)
3. **Design for backtracking** - Lock areas intentionally to create non-linear exploration
4. **Use containers strategically** - Critical items in narratively justified containers
5. **Balance NPC modes** - Mix in-person (world-building) and phone (handler)
6. **Place terminals thoughtfully** - VM access in secured areas, drop-sites accessible
7. **Test unlock progression** - Walk through mentally to ensure no soft locks
8. **Environmental storytelling** - Use container contents and notes to tell story

## Output Format

Save your room layout **design documentation** as:
```
scenario_designs/[scenario_name]/05_layout/room_design.md (Markdown documentation)
scenario_designs/[scenario_name]/05_layout/challenge_placement.md
scenario_designs/[scenario_name]/05_layout/npc_placement.md
scenario_designs/[scenario_name]/05_layout/map_diagram.txt (ASCII map)
```

**What to Include:**
- Room purposes, dimensions, connections (in Markdown)
- Container/NPC/objective placement decisions (WHAT and WHERE)
- Progressive unlocking strategy
- Design rationale
- ASCII maps showing spatial layout

**What NOT to Include:**
- Complete JSON syntax (deferred to Stage 9)
- ERB templates (Stage 9)
- Full property specifications (Stage 9)

**You may include lightweight JSON sketches** to communicate intent, but Stage 9 will create the final implementation.

---

**Next Stage:** Your design will be passed to:
- **Stage 6 (LORE Fragments):** Room count and potential fragment positions
- **Stage 7 (Ink Scripting):** NPC positions and dialogue trigger locations
- **Stage 9 (Scenario Assembly):** Complete design for JSON conversion and logical flow validation

**Critical for Stage 7:** Provide NPC positions, container interactions, and terminal locations so Ink scripts know where dialogues trigger and how interactions work.

**Critical for Stage 9:** Provide clear placement decisions and design rationale. Stage 9 will validate logical flow (no soft locks, all objectives completable) during assembly.

---

**Ready to begin?** Review your Stage 4 objectives, map every task to a room location, design rooms within technical constraints, integrate containers/locks/NPCs, and create progressive unlocking flow. Focus on spatial design and game flow - Stage 9 will handle JSON implementation and validation.
