# Break Escape Scenario Development Prompts

This directory contains a comprehensive set of AI agent prompts for building complete Break Escape scenarios through a structured, multi-stage process.

## Overview

Building a rich, educationally sound, and narratively compelling Break Escape scenario requires coordinating multiple design concerns: technical challenges, narrative structure, character development, moral choices, world-building, and interactive dialogue. This prompt system breaks the development process into 9 distinct stages, each handled by a specialized AI agent.

## The Development Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│ Stage 0: Scenario Initialization (Hybrid Architecture Setup)  │
│ Output: Technical challenges (VM + In-Game) + Narrative themes│
└─────────────────────┬───────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│ Stage 1: Narrative Structure Development                       │
│ Output: Complete narrative arc with acts and key moments       │
└─────────────────────┬───────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│ Stage 2: Storytelling Elements Design                          │
│ Output: Characters, dialogue, atmosphere, pacing               │
└─────────────────────┬───────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│ Stage 3: Moral Choices and Consequences                        │
│ Output: Choice points with narrative branching                 │
└─────────────────────┬───────────────────────────────────────────┘
│                     │
│  ┌──────────────────┴──────────────────┐
│  ↓                                      ↓
│ ┌────────────────────────────┐  ┌────────────────────────────┐
│ │ Stage 4: Player Objectives │  │ Stage 5: Room Layout       │
│ │ Objectives/Aims/Tasks JSON │  │ Rooms, NPCs, Containers    │
│ │ VM flags + In-game tasks   │  │ Locks, Items, Terminals    │
│ └──────────┬─────────────────┘  └────────┬───────────────────┘
│            └────────────┬────────────────┘
│                         ↓
┌─────────────────────────────────────────────────────────────────┐
│ Stage 6: LORE Fragments Creation                               │
│ Output: Collectible fragments placed in scenario               │
└─────────────────────┬───────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│ Stage 7: Ink Scripting (NPCs, Cutscenes, Terminals)           │
│ Output: Ink files with objectives integration, item giving     │
└─────────────────────┬───────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│ Stage 8: Scenario Review and Validation                        │
│ Output: Complete, validated scenario ready for assembly        │
└─────────────────────┬───────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────────────────┐
│ Stage 9: Scenario Assembly (ERB Conversion)                    │
│ Output: Complete scenario.json.erb file ready for game engine  │
└─────────────────────────────────────────────────────────────────┘
```

## Prompt Files

| File | Stage | Purpose | Key Outputs |
|------|-------|---------|-------------|
| `00_scenario_initialization.md` | 0 | Select technical challenges (VM + In-Game) and narrative themes | **Hybrid architecture** setup, VM scenario selection, ERB content plan, ENTROPY cell |
| `01_narrative_structure.md` | 1 | Build the story arc | Three-act structure, key story beats, dramatic moments |
| `02_storytelling_elements.md` | 2 | Flesh out story details | Character voices, atmosphere, pacing, dramatic tension |
| `03_moral_choices.md` | 3 | Design player choices | Choice points, consequences, branching paths |
| `04_player_objectives.md` | 4 | Define player goals with **objectives system** | Objectives/aims/tasks JSON, **VM flag submissions**, in-game task tracking |
| `05_room_layout_design.md` | 5 | Design physical space with **game systems** | Rooms, **containers**, **locks**, **NPCs**, VM terminals, drop-sites |
| `06_lore_fragments.md` | 6 | Create collectibles | LORE fragments, placement strategy, progressive revelation |
| `07_ink_scripting.md` | 7 | Write dialogue with **game integration** | Ink scripts with **objectives tags**, **item giving**, NPC influence, event triggers |
| `08_scenario_review.md` | 8 | Validate scenario | Consistency check, educational alignment, playability, **hybrid integration** |
| `09_scenario_assembly.md` | 9 | **Convert to scenario.json.erb** | Complete playable scenario file with **ERB templates** for narrative content |

## How to Use This System

### For AI Orchestrators

If you're coordinating multiple AI agents to build a scenario:

1. **Run each stage sequentially** - Each stage builds on outputs from previous stages
2. **Pass outputs forward** - Ensure each agent receives relevant outputs from previous stages
3. **Allow iteration** - Some stages (especially review) may require going back to earlier stages
4. **Maintain context** - Keep a master document that accumulates all decisions and outputs

### For Single AI Sessions

If you're working with a single AI in a long conversation:

1. **Copy the prompt content** from each file into your conversation at the appropriate stage
2. **Maintain a working document** that captures outputs from each stage
3. **Reference universe bible** documents as needed throughout the process
4. **Iterate as needed** - Don't be afraid to revisit earlier stages if new ideas emerge

### For Human Designers

If you're using these prompts to guide your own design process:

1. **Use as checklists** - Each prompt contains key questions and considerations
2. **Adapt as needed** - Not every scenario needs every element
3. **Reference examples** - The universe bible contains example scenarios to learn from
4. **Start small** - Your first scenario doesn't need to use every advanced feature

## Understanding the Hybrid Architecture

**CRITICAL:** Break Escape uses a **hybrid approach** that separates technical validation from narrative content.

### The Hybrid Model

**VM/SecGen Scenarios (Technical Validation):**
- Pre-built CTF challenges remain **unchanged** for stability
- Provide technical skill validation (SSH, exploitation, scanning, etc.)
- Generate flags that represent ENTROPY operational communications
- Players complete traditional hacking challenges

**ERB Templates (Narrative Content):**
- Generate story-rich encoded messages directly in game world
- Create ENTROPY documents, emails, whiteboards, communications
- Allow narrative flexibility without modifying VMs
- Use various encoding types (Base64, ROT13, Hex, multi-stage)

### Integration Systems

**Dead Drop Terminals:**
- Players submit VM flags as intercepted ENTROPY communications
- Unlocks resources: equipment, intel, credentials, access
- Bridges VM technical validation with in-game narrative

**Objectives System:**
- Tracks both VM flag submissions AND in-game encoded messages
- Uses Ink tags: `#complete_task:task_id`, `#unlock_task:task_id`
- Provides clear player guidance and progress tracking

**In-Game Education:**
- Agent 0x99 teaches encoding concepts when first encountered
- CyberChef workstation accessible in-game (not just VM)
- No assumed prior knowledge from external courses

### Content Separation Benefits

- **For Developers:** VMs stable (no modifications), narrative easy to update (ERB templates)
- **For Educators:** Technical validation consistent, story updates don't affect assessments
- **For Players:** Technical challenges validated, rich narrative context makes challenges meaningful

### Stage-Specific Hybrid Integration

- **Stage 0:** Define VM scenario + plan ERB narrative content
- **Stage 4:** Objectives track both VM flags and in-game tasks
- **Stage 5:** Place VM access terminals and drop-site terminals in rooms
- **Stage 7:** Ink scripts handle flag submission and CyberChef workstation dialogues
- **Stage 9:** ERB templates generate encoded messages, VM and narrative integrated in scenario.json.erb

## Key Lessons Learned

These lessons emerged from iterating on Mission 1 and should inform all future scenario development.

### 1. Make Stakes Concrete with Specific Numbers

**DON'T:** "ENTROPY is planning something that could hurt people."
**DO:** "Operation Shatter will kill 42-85 people—elderly, anxiety sufferers—ENTROPY calculated every death."

Vague threats create vague stakes. Specific casualty projections make the evil real.

### 2. Villains Must Be True Believers, Not Sympathetic

ENTROPY operatives should:
- Believe they're right (coherent philosophy)
- Have calculated the harm (spreadsheets of projected deaths)
- Feel no remorse ("acceptable casualties")
- Refuse to cooperate when caught (ideologically committed)
- Explain their worldview in an "evil monologue"

They are NOT tragic antiheroes seeking redemption.

### 3. Avoid Vague "Approach" Choices

**DON'T:** Let players pick a label at mission start ("Cautious", "Confident", "Professional")

These don't affect gameplay and can't be meaningfully referenced in debriefs.

**DO:** Track what players actually do during the mission:
- Which evidence did they find?
- Who did they talk to?
- What moral choices did they make?

Then reference these specific actions in the closing debrief.

### 4. Include Mid-Mission Moral Choices

Every mission should have at least one intervention choice triggered by discovery:

1. **Discovery:** Player finds evidence of harm beyond the mission
2. **Personal Stakes:** The victim is someone who helped the player
3. **Choice:** Intervene (warn, protect) or focus on mission (ignore)

Example: Derek's plan to frame Kevin (who gave the player lockpicks). Player can warn Kevin, plant clearing evidence, or ignore it.

### 5. Evidence Should Be Discoverable Through Gameplay

Don't just tell players about ENTROPY's evil in dialogue. Let them **find** the evidence:
- Casualty projection documents on villain's computer
- Target demographic databases in the server room
- Email chains showing approval from The Architect

Use LORE fragments and collectible items to expose the plan piece by piece.

### 6. Closing Debrief Should Reflect Actual Choices

Track player actions with global variables:
```json
"globalVariables": {
    "found_casualty_projections": false,
    "talked_to_kevin": false,
    "kevin_protected": false,
    "lore_collected": 0
}
```

Debrief should acknowledge:
- What evidence the player found
- Which NPCs the player interacted with
- How moral choices resolved
- Quantified success ("42-85 people are alive because of you")

---

## Required Context

Before starting, ensure you have access to:

### Essential Universe Bible Documents

- `story_design/universe_bible/01_universe_overview/world_rules.md`
- `story_design/universe_bible/02_organisations/safetynet/README.md`
- `story_design/universe_bible/02_organisations/entropy/README.md`
- `story_design/universe_bible/03_entropy_cells/README.md`
- `story_design/universe_bible/05_world_building/rules_and_tone.md`
- `story_design/universe_bible/09_scenario_design/framework.md`
- `story_design/universe_bible/10_reference/style_guide.md`

### Technical Documentation

**Core Systems:**
- `docs/GAME_DESIGN.md` - Core game mechanics
- `docs/ROOM_GENERATION.md` - Room layout rules and constraints
- `docs/OBJECTIVES_AND_TASKS_GUIDE.md` - **Objectives/aims/tasks system**

**Ink Integration:**
- `docs/INK_INTEGRATION.md` - Ink scripting guide
- `docs/INK_BEST_PRACTICES.md` - Best practices for Ink in Break Escape
- `docs/GLOBAL_VARIABLES.md` - External variables accessible from Ink
- `docs/EXIT_CONVERSATION_TAG_USAGE.md` - How to properly end dialogues
- `docs/TIMED_CONVERSATIONS.md` - Event-triggered dialogue

**Game Systems:**
- `docs/CONTAINER_MINIGAME_USAGE.md` - Container types and usage
- `docs/LOCK_KEY_QUICK_START.md` - Lock and key system basics
- `docs/LOCK_SCENARIO_GUIDE.md` - Advanced lock usage in scenarios
- `docs/NOTES_MINIGAME_USAGE.md` - Notes and encoded messages
- `docs/NPC_INTEGRATION_GUIDE.md` - NPC placement and dialogue
- `docs/NPC_INFLUENCE.md` - NPC trust/influence system
- `docs/NPC_ITEM_GIVING_EXAMPLES.md` - How NPCs give items to player

**Scenario Assembly:**
- `docs/SCENARIO_FILE_FORMAT.md` - scenario.json structure
- `docs/ERB_TEMPLATE_GUIDE.md` - ERB template syntax for narrative content

## Output Structure

Each stage should produce structured outputs in this format:

```
scenario_designs/[scenario_name]/
├── 00_initialization/
│   ├── technical_challenges.md      # VM + In-game challenges
│   ├── narrative_themes.md
│   └── hybrid_architecture_plan.md  # How VM and ERB integrate
├── 01_narrative/
│   └── story_arc.md
├── 02_storytelling/
│   ├── characters.md
│   ├── atmosphere.md
│   └── pacing.md
├── 03_choices/
│   └── moral_choices.md
├── 04_objectives/
│   ├── player_goals.md              # Narrative design
│   ├── objectives.json              # JSON structure with VM + in-game tasks
│   └── objective_to_world_mapping.md # Where each task completes
├── 05_layout/
│   ├── room_design.md               # Rooms with containers, locks, NPCs
│   ├── challenge_placement.md
│   ├── npc_placement.md             # In-person vs phone NPCs
│   └── map_diagram.txt              # ASCII map
├── 06_lore/
│   └── lore_fragments.md
├── 07_ink/
│   ├── opening_cutscene.ink         # Act 1
│   ├── npc_*.ink                    # Act 2 NPCs with objectives tags
│   ├── terminal_*.ink               # Drop-site, CyberChef terminals
│   ├── phone_*.ink                  # Phone NPCs
│   ├── closing_cutscene.ink         # Act 3
│   └── *.json                       # Compiled Ink files
├── 08_review/
│   └── validation_report.md
├── 09_assembly/
│   ├── scenario.json.erb            # **FINAL PLAYABLE FILE**
│   └── assembly_notes.md            # ERB template documentation
└── SCENARIO_COMPLETE.md (master document)
```

**Final Output:** `scenarios/[scenario_name].json.erb` ready for game engine integration.

## Quality Standards

All scenarios must meet these criteria:

### Educational Requirements
- Map to specific CyBOK knowledge areas
- Teach genuine cybersecurity concepts
- Avoid teaching bad practices or unrealistic techniques
- Progressive difficulty appropriate for target audience

### Narrative Requirements
- Consistent with universe bible tone and lore
- Character voices match established profiles
- World rules respected throughout
- Satisfying story arc with clear beginning, middle, end

### Game Design Requirements
- Respect room generation constraints (see `docs/ROOM_GENERATION.md`)
- Challenge difficulty appropriate for scenario tier
- Clear player objectives
- Multiple solution paths where possible
- Failure states that teach rather than frustrate

### Technical Requirements
- Valid Ink syntax
- Proper LORE fragment JSON structure
- Room layouts within Grid Unit constraints
- Challenge placement follows technical specifications

## Tips for Success

### Start with Constraints
- Pick your technical challenges first - they're the hardest constraint
- Let the challenges inform the narrative, not vice versa
- Choose an ENTROPY cell whose philosophy aligns with your challenges

### Build Incrementally
- Don't try to design everything at once
- Each stage adds detail to the previous stage
- It's OK to go back and revise earlier stages as new ideas emerge

### Use Examples
- Reference the example scenarios in `story_design/universe_bible/09_scenario_design/examples/`
- Look at existing ENTROPY cells for inspiration
- Study character profiles for dialogue voice

### Focus on Player Experience
- What will the player learn?
- What will the player feel?
- What choices will matter to the player?
- How will the player know they're making progress?

### Iterate Through Review
- Stage 8 (review) often reveals issues
- Don't be afraid to cycle back to earlier stages
- Small refinements make big differences
- Test your scenario logic before finalizing

## Common Pitfalls to Avoid

1. **Challenge-narrative mismatch** - When the story doesn't support why the technical challenge exists
2. **Overly complex layouts** - Trying to fit too many rooms/challenges into one scenario
3. **Inconsistent character voices** - NPCs that don't sound like their established profiles
4. **Unclear objectives** - Player doesn't know what they're trying to accomplish
5. **Dead-end choices** - Moral choices that don't actually affect anything
6. **LORE overload** - Too many fragments or fragments that don't add value
7. **Exposition dumps** - Telling instead of showing through gameplay
8. **Rule violations** - Breaking established world rules or technical constraints

## Getting Help

If you encounter issues:

1. **Consult the universe bible** - Most questions are answered there
2. **Review example scenarios** - See how others solved similar problems
3. **Check technical docs** - Especially for room generation and Ink syntax
4. **Simplify** - When in doubt, reduce scope
5. **Iterate** - First draft doesn't need to be perfect

## Version History

- **v2.0** (2025-11-30) - Hybrid Architecture Integration Update
  - ✅ Added **Stage 9: Scenario Assembly** - Critical final conversion step
  - ✅ Updated all stages with **hybrid architecture** (VM + ERB) integration
  - ✅ **Stage 0:** Documented hybrid model, dead drop system, objectives integration
  - ✅ **Stage 4:** Complete objectives system documentation with Ink tag integration
  - ✅ **Stage 5:** Added container, lock, NPC, and terminal integration guides
  - ✅ **Stage 7:** Comprehensive Ink game systems integration (objectives, items, influence, events)
  - ✅ **Stage 9:** ERB template guide for final scenario assembly
  - ✅ Updated README with hybrid architecture explanation and stage connections
  - ✅ Added 15+ technical documentation references for game systems
  - ✅ Documented complete workflow from initialization to playable scenario.json.erb

- v1.0 (2025-01-17) - Initial prompt system creation
  - 9-stage development pipeline
  - Comprehensive prompts for each stage
  - Integration with expanded universe bible

---

**Ready to build your first scenario?** Start with `00_scenario_initialization.md` and work through the stages sequentially.

**Key Success Factors:**
1. **Understand the hybrid architecture** - VM validates skills, ERB provides narrative
2. **Use objectives system from Stage 4** - Track both VM flags and in-game tasks
3. **Integrate game systems in Stage 5** - Containers, locks, NPCs, terminals
4. **Use Ink tags in Stage 7** - Connect dialogue to objectives and items
5. **Assemble in Stage 9** - Convert all outputs to scenario.json.erb

Good luck, and remember: the best scenarios teach cybersecurity while telling compelling stories!
