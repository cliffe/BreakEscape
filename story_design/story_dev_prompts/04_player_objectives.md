# Stage 4: Player Objectives Design

**Purpose:** Define clear, achievable goals that guide player activity, combining narrative objectives (what the story asks) with concrete gameplay objectives (VM challenges, in-game tasks, evidence collection).

**Output:** A complete objectives framework with primary goals, optional objectives, success criteria, and progression tracking using Break Escape's objectives/aims/tasks system.

---

## Your Role

You are an objectives designer for Break Escape. Translate narrative and technical challenges into clear player goals that:

1. Tell players what they're trying to accomplish
2. Provide clear success criteria
3. Balance required and optional objectives
4. Create meaningful progression
5. Support both story and educational missions
6. Track progress through both VM challenges AND in-game tasks

## Required Input

From previous stages:
- **Stage 0:** Technical challenges (VM + in-game), hybrid architecture plan
- **Stage 1:** Narrative structure (three-act breakdown)
- **Stage 2:** Character and story elements (NPCs, atmosphere)
- **Stage 3:** Choice points and consequences

## Required Reading

### Essential References
- `docs/OBJECTIVES_AND_TASKS_GUIDE.md` - **CRITICAL** - Complete objectives system documentation
- `docs/GAME_DESIGN.md` - Game mechanics and challenge types
- `story_design/universe_bible/07_narrative_structures/player_agency.md` - Player goals and agency
- `story_design/universe_bible/09_scenario_design/framework.md` - Scenario design principles

### Helpful References
- Stage 0 initialization document from this scenario
- Stage 1 narrative structure from this scenario
- Example scenarios in `story_design/universe_bible/09_scenario_design/examples/`

## Understanding the Objectives System

Break Escape uses a **three-tier hierarchy** for tracking player progress:

```
Objective (top level - mission goal)
  └── Aim (sub-goal - area of investigation)
      └── Task (specific action - individual step)
```

### Hierarchy Example

```json
{
  "objectives": [
    {
      "id": "main_mission",
      "description": "Gather intelligence on Social Fabric operations",
      "aims": [
        {
          "id": "identify_targets",
          "description": "Identify Social Fabric's disinformation targets",
          "tasks": [
            {"id": "decode_whiteboard", "description": "Decode Base64 message on whiteboard", "status": "locked"},
            {"id": "access_computer", "description": "Access Maya's computer", "status": "locked"},
            {"id": "submit_ssh_flag", "description": "Submit SSH access flag", "status": "active"}
          ]
        },
        {
          "id": "gather_evidence",
          "description": "Collect physical evidence from office",
          "tasks": [
            {"id": "find_sticky_notes", "description": "Find password hints on sticky notes", "status": "active"},
            {"id": "photograph_documents", "description": "Photograph suspicious documents", "status": "locked"}
          ]
        }
      ]
    }
  ]
}
```

### Tracking Progress via Ink Tags

Ink scripts control objective progression using special tags:

- `#complete_task:task_id` - Mark task as completed
- `#unlock_task:task_id` - Unlock a locked task
- `#unlock_aim:aim_id` - Unlock a locked aim
- `#fail_task:task_id` - Mark task as failed (optional)

**Example Ink Integration:**

```ink
=== dead_drop_terminal ===
You access the drop-site terminal.

+ [Submit SSH access flag]
    You submit the flag. SAFETYNET confirms receipt.

    Access granted to Maya Chen's computer workstation.

    #complete_task:submit_ssh_flag
    #unlock_task:access_computer

    -> DONE
```

## Hybrid Architecture and Objectives

**CRITICAL:** Your objectives must track **both** types of challenges:

### VM/SecGen Challenges
Tasks that represent VM flag submissions:
- "Submit SSH brute force flag"
- "Submit network scanning flag"
- "Submit privilege escalation flag"

These tasks represent intercepted ENTROPY communications submitted at in-game drop-site terminals.

### In-Game Challenges
Tasks that represent in-game activities:
- "Decode Base64 message on whiteboard"
- "Lockpick office manager's door"
- "Social engineer Maya Chen for password hints"
- "Crack safe PIN code"
- "Clone RFID keycard from security guard"

### Correlation Tasks
Tasks that require combining VM and in-game evidence:
- "Correlate physical documents with digital communications"
- "Match timestamps between in-game whiteboard and VM server logs"
- "Verify client list against VM database records"

## Process

### Step 1: Map Narrative Acts to Objectives

**From Act 2 onwards, players should have clear objectives displayed in the UI.**

Review your Stage 1 narrative structure and identify:

#### Act 1: Setup (Tutorial Phase)
- **Objective Focus:** Learn basic mechanics
- **Clarity:** Can be exploratory, objectives emerge during play
- **Example:** "Explore the office" → gradually reveals "Find evidence of ENTROPY activity"

#### Act 2: Investigation (Main Gameplay)
- **Objective Focus:** Clear, active goals
- **Clarity:** **MUST be displayed from start of Act 2**
- **Example:** "Identify Social Fabric's disinformation targets" with specific tasks

#### Act 3: Confrontation/Resolution
- **Objective Focus:** Resolve central conflict
- **Clarity:** Final objectives leading to conclusion
- **Example:** "Stop ENTROPY operation before deadline"

### Step 2: Define Primary Objectives

Create 1-3 **primary objectives** that represent the mission's main goals:

**Template:**

```markdown
## Primary Objective: [Objective Name]

**ID:** `main_mission` (or descriptive ID)

**Description:** [One sentence player-facing description]

**Narrative Purpose:** [Why this matters to the story]

**Educational Purpose:** [What cybersecurity concepts this teaches]

**Success Criteria:** [What completion looks like]

**Aims (Sub-Goals):**

### Aim 1: [Aim Name]
**ID:** `aim_id_here`
**Description:** [One sentence description]
**Unlock Condition:** [When does this become available? Default: unlocked at start]

**Tasks:**
1. **[Task Name]** (`task_id`)
   - **Type:** [VM Flag / In-Game / Correlation]
   - **Description:** [What player does]
   - **Unlock Condition:** [locked/active at start]
   - **Completion Trigger:** [How task is marked complete - Ink tag, automatic, etc.]
   - **Unlocks:** [What this task unlocks - next task, aim, objective]

[Repeat for all tasks in this aim]

### Aim 2: [Aim Name]
[Repeat structure]
```

### Step 3: Define Optional Objectives

Create 0-3 **optional objectives** for exploration, LORE collection, or bonus challenges:

**Template:**

```markdown
## Optional Objective: [Objective Name]

**ID:** `optional_objective_id`

**Description:** [One sentence description]

**Purpose:** [Why include this? LORE? Extra challenge? Completionist content?]

**Reward:** [What does completing this give? LORE fragments? Equipment? Intel?]

**Aims:**
[Use same structure as primary objectives]
```

**Common Optional Objectives:**
- Collect all LORE fragments
- Find hidden evidence
- Complete challenges with optimal efficiency
- Discover all NPC dialogue branches
- Unlock bonus equipment/resources

### Step 4: Define Success and Failure States

**Complete Success:**
- All primary objectives completed
- [Any additional criteria for "perfect" completion]

**Partial Success:**
- Minimum required objectives completed
- [What constitutes "minimum viable completion"]

**Failure States:**
- [Can the mission be failed? Under what conditions?]
- [Can player retry, or continue with consequences?]

**Example:**

```markdown
### Success States

**Complete Success (100%):**
- Main mission objective completed
- All 3 aims completed
- At least 2 optional objectives completed
- No civilian casualties (if applicable)

**Partial Success (70%):**
- Main mission objective completed
- At least 2 of 3 aims completed
- ENTROPY operation disrupted

**Minimal Success (50%):**
- Main mission objective barely completed
- Only 1 aim completed
- ENTROPY operatives escaped

### Failure States

**Mission Failure:**
- Player detected and captured (can retry from checkpoint)
- Timer expires before critical objective completed
- Critical evidence destroyed

**Note:** Most missions cannot be permanently failed - player can retry or continue campaign with consequences.
```

### Step 5: Map Objectives to Rooms and NPCs

For each task, specify **where and how** it's completed:

**Template:**

```markdown
## Objective-to-World Mapping

### Objective: [Objective Name]

#### Aim: [Aim Name]

**Task: [Task Name]** (`task_id`)
- **Location:** [Which room(s) can this be completed in?]
- **Requirements:** [What must player have/do to complete this?]
- **Interaction:** [What does player interact with? NPC? Container? Computer? Terminal?]
- **Ink Script:** [Which Ink file handles completion? Or is it automatic?]
- **Completion Tag:** `#complete_task:task_id`

[Repeat for all tasks]
```

**Example:**

```markdown
### Objective: Main Mission

#### Aim: Identify Targets

**Task: Decode whiteboard** (`decode_whiteboard`)
- **Location:** Conference Room (room_id: `conference_room_01`)
- **Requirements:** Player must have CyberChef workstation access (unlocked by completing tutorial)
- **Interaction:** Examine whiteboard (interactable object), copy Base64 text, use CyberChef terminal
- **Ink Script:** `cyberchef_workstation.ink` handles decoding interaction
- **Completion Tag:** `#complete_task:decode_whiteboard` (triggered when player successfully decodes)

**Task: Submit SSH flag** (`submit_ssh_flag`)
- **Location:** Break Room (room with drop-site terminal)
- **Requirements:** Player must obtain flag from VM challenge
- **Interaction:** Use drop-site terminal (interactable computer)
- **Ink Script:** `dead_drop_terminal.ink` handles flag submission
- **Completion Tag:** `#complete_task:submit_ssh_flag` (triggered on successful flag submission)
```

### Step 6: Create Objectives JSON Structure

Convert your objectives design into the JSON structure that will go into `scenario.json.erb`:

**Template:**

```json
{
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
              "id": "decode_whiteboard",
              "description": "Decode Base64 message on whiteboard",
              "status": "locked"
            },
            {
              "id": "submit_ssh_flag",
              "description": "Submit SSH access flag",
              "status": "active"
            }
          ]
        },
        {
          "id": "gather_evidence",
          "description": "Collect physical evidence from office",
          "status": "locked",
          "tasks": [
            {
              "id": "find_sticky_notes",
              "description": "Find password hints",
              "status": "locked"
            }
          ]
        }
      ]
    },
    {
      "id": "collect_lore",
      "description": "Collect LORE fragments",
      "optional": true,
      "aims": [
        {
          "id": "find_all_fragments",
          "description": "Find all 5 LORE fragments",
          "tasks": [
            {
              "id": "lore_fragment_1",
              "description": "Fragment 1: The Architect's Origins",
              "status": "active"
            }
          ]
        }
      ]
    }
  ]
}
```

**See `docs/OBJECTIVES_AND_TASKS_GUIDE.md` for complete JSON specification and additional examples.**

## Objectives Design Template

Use this template for your complete objectives document:

```markdown
# Player Objectives: [Scenario Name]

## Overview

**Scenario:** [Scenario name]
**Mission Type:** [Infiltration/Investigation/Recovery/etc.]
**Target Difficulty:** Tier [1/2/3]

**Objective Philosophy:**
[Brief explanation of how objectives guide this scenario - linear? Non-linear? Multiple paths?]

---

## Primary Objectives

### Objective 1: [Name]

**ID:** `objective_id`
**Description:** "[Player-facing description]"
**Narrative Purpose:** [Why this matters to story]
**Educational Purpose:** [What this teaches]

#### Aim 1.1: [Name]
**ID:** `aim_id`
**Description:** "[Player-facing description]"
**Unlock:** [When available - start/after task/etc.]

**Tasks:**

##### Task: [Task Name]
- **ID:** `task_id`
- **Type:** [VM Flag / In-Game / Correlation]
- **Description:** "[Player-facing]"
- **Location:** [Where completed]
- **Requirements:** [What's needed]
- **Completion:** [How tracked - Ink tag, automatic]
- **Unlocks:** [What this enables]

[Repeat for all tasks/aims/objectives]

---

## Optional Objectives

[Use same structure as primary objectives]

---

## Success and Failure States

### Complete Success
[Criteria]

### Partial Success
[Criteria]

### Minimal Success
[Criteria]

### Failure States
[If applicable]

---

## Objective Progression Flow

```
[Visual flowchart or narrative description of how objectives unlock]

Example:
Start → Task A (in-game) → Task B (VM flag) → Unlocks Aim 2 → Task C (correlation) → Complete
```

---

## Objective-to-World Mapping

[Map each task to rooms, NPCs, items, Ink scripts]

---

## Objectives JSON Structure

```json
[Complete JSON for scenario.json.erb objectives section]
```

---

## Design Notes

### Hybrid Integration
[How do VM and in-game objectives interweave?]

### Pacing
[How are objectives paced throughout the scenario?]

### Player Guidance
[How will players know what to do next?]

### Edge Cases
[What happens if player tries to complete objectives out of order?]
```

## Quality Checklist

Before finalizing objectives, verify:

### Clarity
- [ ] Each objective has clear, player-facing description
- [ ] Players know WHAT to do (not just WHERE to go)
- [ ] Success criteria are unambiguous
- [ ] From Act 2 onwards, objectives are displayed in UI

### Hybrid Architecture
- [ ] VM flag submission tasks clearly identified
- [ ] In-game tasks clearly identified
- [ ] Correlation tasks (VM + in-game) clearly identified
- [ ] Dead drop terminal locations specified for flag submissions
- [ ] Objectives don't require VM modifications

### Structure
- [ ] Uses objectives → aims → tasks hierarchy correctly
- [ ] IDs are unique and descriptive
- [ ] Unlock conditions specified for locked tasks/aims
- [ ] Completion triggers documented (Ink tags, automatic, etc.)

### Integration
- [ ] Every task maps to a room or NPC
- [ ] Every task has completion method (Ink script, automatic detection)
- [ ] Ink tag usage follows `#complete_task:task_id` format
- [ ] Tasks align with Stage 1 narrative structure (Acts 1-3)
- [ ] Tasks align with Stage 0 technical challenges

### Progression
- [ ] Clear progression path from start to end
- [ ] No circular dependencies (Task A unlocks Task B unlocks Task A)
- [ ] Multiple valid paths where appropriate
- [ ] Optional objectives don't block main progression

### Educational Objectives
- [ ] Each primary objective teaches specific cybersecurity concept
- [ ] VM challenges validate technical skills
- [ ] In-game challenges teach complementary skills
- [ ] Objectives build on each other logically

### Player Experience
- [ ] Objectives create sense of progress
- [ ] Mix of short-term and long-term goals
- [ ] Optional objectives provide value (not busywork)
- [ ] Failure states are fair and recoverable

## Common Pitfalls to Avoid

### Objective Design Pitfalls
- **Too many objectives** - Players get overwhelmed; stick to 1-3 primary
- **Unclear descriptions** - "Investigate the office" vs. "Find evidence of ENTROPY activity"
- **No objectives in Act 2** - Players feel lost; always show objectives from Act 2 onwards
- **Required tasks too obscure** - Players shouldn't need walkthrough for main objectives

### Hybrid Architecture Pitfalls
- **VM and in-game disconnected** - Tasks should complement each other
- **Flag submission unclear** - Always specify where drop-site terminals are
- **Missing correlation** - Don't just make players do VM then in-game separately; connect them

### Technical Pitfalls
- **Wrong Ink tag format** - Use `#complete_task:task_id` not `complete_task task_id`
- **Duplicate IDs** - Each task/aim/objective must have unique ID
- **Missing unlock conditions** - Locked tasks must have clear unlock triggers
- **Circular dependencies** - Task A can't unlock Task B that unlocks Task A

### Progression Pitfalls
- **Linear only** - Consider allowing multiple approaches where appropriate
- **Soft locks** - Ensure players can't make progress impossible
- **Unclear next step** - Always make next available task obvious

## Examples

### Example 1: Linear Investigation (M1 "First Contact")

```json
{
  "objectives": [
    {
      "id": "main_mission",
      "description": "Gather intelligence on Social Fabric operations",
      "aims": [
        {
          "id": "identify_targets",
          "description": "Identify disinformation targets",
          "tasks": [
            {"id": "talk_to_maya", "description": "Interview Maya Chen", "status": "active"},
            {"id": "decode_whiteboard", "description": "Decode whiteboard message", "status": "locked"},
            {"id": "submit_ssh_flag", "description": "Submit SSH access flag", "status": "locked"}
          ]
        },
        {
          "id": "intercept_comms",
          "description": "Intercept ENTROPY communications",
          "status": "locked",
          "tasks": [
            {"id": "access_maya_computer", "description": "Access Maya's computer", "status": "locked"},
            {"id": "decode_emails", "description": "Decode Base64 emails", "status": "locked"}
          ]
        }
      ]
    }
  ]
}
```

**Progression Flow:**
1. Talk to Maya (Act 1 - tutorial) → Unlocks decode_whiteboard
2. Decode whiteboard (in-game) → Reveals password hints → Unlocks submit_ssh_flag
3. Submit SSH flag (VM) → Unlocks aim: intercept_comms → Unlocks access_maya_computer
4. Access Maya's computer (in-game) → Unlocks decode_emails
5. Decode emails (in-game) → Complete mission

### Example 2: Non-Linear Exploration (M5 "Insider Trading")

```json
{
  "objectives": [
    {
      "id": "identify_mole",
      "description": "Identify the corporate insider",
      "aims": [
        {
          "id": "gather_evidence",
          "description": "Gather evidence on all suspects",
          "tasks": [
            {"id": "interview_alice", "description": "Interview Alice", "status": "active"},
            {"id": "interview_bob", "description": "Interview Bob", "status": "active"},
            {"id": "interview_charlie", "description": "Interview Charlie", "status": "active"}
          ]
        },
        {
          "id": "correlate_evidence",
          "description": "Correlate physical and digital evidence",
          "status": "locked",
          "tasks": [
            {"id": "match_emails", "description": "Match emails to suspects", "status": "locked"},
            {"id": "analyze_timeline", "description": "Analyze timeline", "status": "locked"}
          ]
        }
      ]
    }
  ]
}
```

**Progression Flow:**
- All 3 interviews available from start (non-linear)
- Completing all 3 unlocks aim: correlate_evidence
- Correlation tasks can be done in any order
- Completing correlation tasks reveals the mole

## Tips for Success

1. **Start with narrative structure** - Your Stage 1 acts should map clearly to objective progression
2. **Mix VM and in-game** - Alternate between digital and physical tasks for variety
3. **Clear next steps** - Player should always know at least one thing they can do
4. **Use locks strategically** - Lock tasks to control pacing, but don't frustrate players
5. **Test the progression** - Walk through the flow - can players get stuck?
6. **Consider replay** - Can players approach objectives differently on second playthrough?
7. **Make correlation meaningful** - Don't just make players do VM and in-game separately; require synthesis

## Output Format

Save your objectives documentation as:
```
scenario_designs/[scenario_name]/04_objectives/player_goals.md
```

Also create the objectives JSON as:
```
scenario_designs/[scenario_name]/04_objectives/objectives.json
```

---

**Next Stage:** Pass to Stage 5 (Room Layout) to ensure physical space supports objectives, and to Stage 7 (Ink Scripting) to implement objective tracking via Ink tags.

**Critical for Stage 5:** Provide the objective-to-world mapping so Stage 5 knows which rooms need which interactables (terminals, containers, NPCs, etc.).

**Critical for Stage 7:** Provide the Ink tag specifications so Stage 7 knows which dialogue/interaction points need which tags (`#complete_task:task_id`, etc.).

---

**Ready to begin?** Review your Stage 1 narrative structure, identify the key goals for each act, break them into aims and tasks, and map them to the hybrid architecture (VM + in-game). Remember: from Act 2 onwards, objectives should be clear and displayed!
