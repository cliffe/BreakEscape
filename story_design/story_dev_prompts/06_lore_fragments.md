# Stage 6: LORE Fragments Creation

**Purpose:** Design and write collectible LORE fragments that reward exploration, reveal the broader Break Escape universe, and create continuous discovery across multiple scenarios.

**Output:** Complete set of LORE fragments with content, metadata, and placement rationale.

---

## Your Role

You are a LORE architect for Break Escape. Your tasks:

1. Create collectible fragments that reveal universe lore
2. Balance scenario-specific content with broader storytelling
3. Design progressive revelation across multiple playthroughs
4. Write compelling, concise fragments in established style
5. Support continuous discovery across the game universe

## Required Input

From previous stages:
- Stage 0: ENTROPY cell selection
- Stage 1: Narrative structure
- Stage 2: Characters and storytelling
- Stage 5: Physical locations for fragment placement

## Required Reading

### Essential References
- `story_design/universe_bible/08_lore_system/lore_categories.md` - LORE fragment categories
- `story_design/universe_bible/08_lore_system/writing_lore.md` - Writing guidelines
- `story_design/universe_bible/08_lore_system/discovery_progression.md` - Revelation system
- `story_design/universe_bible/03_entropy_cells/[your_cell]/` - Cell LORE opportunities
- `story_design/universe_bible/10_reference/style_guide.md` - Writing style

---

## Critical Lesson: LORE as Evidence of Evil

LORE fragments should not just be flavor text—they should **expose the villain's plans** in horrifying detail. The player should discover the evil through gameplay, not just be told about it in dialogue.

### Evidence Discovery Fragments

At least 2-3 LORE fragments per mission should be **evidence documents** that reveal:

1. **The Plan's Scope** - How many people will be affected?
2. **The Calculations** - The villain did the math; show the spreadsheet
3. **The Approval Chain** - Who signed off? (The Architect, cell leaders)
4. **The Victims** - Demographics, profiles, targeting criteria

### Example: Operation Shatter LORE

**Fragment #4: Casualty Projections**
```
═══════════════════════════════════════
OPERATION SHATTER - CASUALTY PROJECTIONS
Classification: ENTROPY EYES ONLY
═══════════════════════════════════════

DEMOGRAPHIC TARGETING:
Adults 65+ with anxiety disorder history
Population identified: 2.3 million

PROJECTED OUTCOMES:
- Cardiac events: 28-45 fatalities
- Suicide attempts: 12-20 (successful: 4-8)
- Fatal accidents during panic: 8-12

TOTAL PROJECTED CASUALTIES: 42-85

STATUS: Approved
AUTHORIZATION: [The Architect]

Note from D.L.: "Numbers acceptable.
Collateral within parameters. Proceed."
```

**Fragment #5: Target Demographics Database**
```
═══════════════════════════════════════
TARGET DEMOGRAPHICS - OPERATION SHATTER
Classification: ENTROPY EYES ONLY
═══════════════════════════════════════

2.3 million individuals profiled across
three vulnerability metrics:

1. FEAR SUSCEPTIBILITY (anxiety history)
2. ISOLATION FACTOR (limited support network)
3. HEALTH FRAGILITY (cardiovascular, respiratory)

Cross-referencing social media behavioral
patterns with medical data obtained from
compromised healthcare systems.

Each profile includes:
- Predicted panic response intensity
- Estimated recovery time
- Probability of fatal outcome

[Database excerpt shows names, ages, and
mortality probability percentages]
```

### Fragment Discovery Should Track Progress

Set global variables when key evidence is discovered:

```json
{
  "type": "notes",
  "id": "casualty_projections",
  "name": "Operation Shatter Casualty Projections",
  "takeable": true,
  "observations": "A classified ENTROPY document with disturbing projections",
  "onPickup": "#set_variable:found_casualty_projections=true"
}
```

The closing debrief should acknowledge what evidence the player found:

```ink
{found_casualty_projections:
    Agent 0x99: You found the casualty projections.
    Agent 0x99: That document proves premeditation. They calculated every death.
}

{found_target_database:
    Agent 0x99: The target database is damning. 2.3 million people profiled for "vulnerability to death."
    Agent 0x99: That's mass murder by algorithm.
}
```

### LORE Categories for Evidence

| Category | Purpose | Example |
|----------|---------|---------|
| **Operational Documents** | Show the plan's details | Casualty projections, timelines |
| **Communications** | Show approval/coordination | Emails, chat logs with The Architect |
| **Databases/Lists** | Show scale of harm | Target demographics, victim profiles |
| **Personal Notes** | Show villain's mindset | Derek's journal, rationalization notes |
| **External Validation** | Show plan is real/imminent | News clippings, test results |

---

## Process

Determine fragment budget (6-20 depending on scenario length), plan fragment arc, design individual fragments (50-200 words each), create metadata, map discovery flow, and validate against LORE system.

**For each scenario, ensure:**
- At least 2-3 fragments are **evidence documents** exposing the evil plan
- Evidence documents include **specific numbers** (casualties, targets, victims)
- Evidence discovery is **tracked with variables** for debrief reference
- Evidence is **discoverable through gameplay** (not just in dialogue)

---

Save your LORE fragments as:
```
scenario_designs/[scenario_name]/06_lore/lore_fragments.md
scenario_designs/[scenario_name]/06_lore/lore_metadata.json
```

**Next Stage:** Pass fragment IDs and discovery triggers to Stage 7 (Ink) and Stage 8 (Review).
