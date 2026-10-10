# Stage 1: Narrative Structure Development

**Purpose:** Transform the scenario initialization into a complete narrative arc with clear beginning, middle, and end, structured to support both technical challenges and player engagement.

**Output:** A detailed three-act story structure with key beats, dramatic moments, and narrative progression.

---

## Your Role

You are a narrative architect for Break Escape. Your task is to take the initialized scenario foundation and build a complete story structure that:

1. Creates a compelling narrative arc from mission start to completion
2. Integrates technical challenges seamlessly into story progression
3. Establishes pacing that balances discovery, action, and reflection
4. Sets up opportunities for player agency and meaningful choices
5. Provides clear dramatic beats that guide the player experience

---

## Critical Lessons: Making Stakes Concrete

### Villains Must Be Clearly Evil

ENTROPY cells should have **understandable motivations** (they believe what they're doing is justified), but their **actions must be clearly evil**. Avoid vague threats. Be specific about harm:

**BAD - Vague Threat:**
> "ENTROPY is planning something dangerous that could harm people."

**GOOD - Concrete Evil:**
> "Operation Shatter will trigger mass panic in populations ENTROPY has profiled as 'vulnerable to death.' Derek calculated the projected casualties himself: 42-85 deaths, primarily elderly and people with anxiety disorders. The Architect approved it."

Concrete numbers and specific victims make the evil **real**. Players should feel urgency and moral clarity about stopping ENTROPY.

### Opening Briefing: Establish Stakes Immediately

The opening briefing should:

1. **Name the operation** - Give ENTROPY's plan a code name (e.g., "Operation Shatter")
2. **State the body count** - If people will die, say how many (range is fine: "42-85 projected casualties")
3. **Identify victims** - Who gets hurt? Be specific (elderly, anxiety sufferers, a specific community)
4. **Show ENTROPY's calculation** - The villain planned this; they have projections
5. **Create moral urgency** - This isn't abstract; real people die if the player fails

**Example Opening Briefing Beat:**

```ink
Agent 0x99: This is urgent. We've intercepted ENTROPY operational documents.

Agent 0x99: They're calling it "Operation Shatter." Mass panic campaign targeting 2.3 million people profiled as "vulnerable to death."

Agent 0x99: Projected casualties: 42 to 85 people. Heart attacks, suicides, fatal accidents triggered by induced panic.

Agent 0x99: ENTROPY calculated every one of those deaths. They consider it acceptable.
```

### Avoid Vague "Approach" Choices

**DON'T** let players pick a vague approach label at mission start:

```ink
// BAD - This doesn't reflect actual gameplay
+ [Cautious approach - take it slow]
+ [Confident approach - move quickly]  
+ [Professional approach - by the book]
```

These choices are meaningless because:
- They don't map to actual player behavior
- Players may not follow through on their stated approach
- Debrief can't meaningfully reference a label that didn't affect anything

**DO** track what players actually do during the mission:

```ink
// GOOD - Track actual discoveries and interactions
VAR found_casualty_projections = false
VAR found_target_database = false
VAR talked_to_maya = false
VAR talked_to_kevin = false
VAR kevin_protected = false
```

Then reference these in the closing debrief:

```ink
// Debrief references actual player actions
{found_casualty_projections:
    Agent 0x99: You found the casualty projections. Good—that document will be key evidence.
}

{talked_to_kevin and kevin_protected:
    Agent 0x99: Kevin Park is safe, thanks to your intervention. You went beyond the mission parameters to protect an innocent.
}
```

### Closing Debrief: Reflect Actual Choices

The closing debrief should:

1. **Reference specific discoveries** - What evidence did the player find?
2. **Acknowledge NPC interactions** - Who did the player talk to?
3. **Address moral choices** - What did the player decide about optional interventions?
4. **Quantify success** - "42-85 people are alive because of your actions"
5. **Foreshadow consequences** - How will this mission's choices echo?

**Example Debrief Tracking:**

```json
"globalVariables": {
    "found_casualty_projections": false,
    "found_target_database": false,
    "talked_to_maya": false,
    "talked_to_kevin": false,
    "kevin_choice": "",
    "kevin_protected": false,
    "lore_collected": 0,
    "derek_confronted": false,
    "final_choice": ""
}
```

## Required Input

You should receive from Stage 0:
- Technical challenges specification
- Selected ENTROPY cell
- Chosen narrative theme
- Setting and stakes description
- Mission type and duration target

## Required Reading

### Essential References
- `story_design/universe_bible/07_narrative_structures/mission_types.md` - Mission structure templates
- `story_design/universe_bible/07_narrative_structures/story_arcs.md` - Arc structure guidance
- `story_design/universe_bible/07_narrative_structures/escalation_patterns.md` - Pacing techniques
- `story_design/universe_bible/05_world_building/rules_and_tone.md` - Tone guidance
- Stage 0 initialization output

### Helpful References
- `story_design/universe_bible/09_scenario_design/examples/` - Example scenario structures
- `story_design/universe_bible/07_narrative_structures/player_agency.md` - Choice and consequence design
- `story_design/universe_bible/03_entropy_cells/[selected_cell]/` - Your cell's background and operations

## Process

Follow the detailed process outlined in this document to create a complete three-act narrative structure that integrates challenges, creates dramatic tension, and provides satisfying player progression.

### Important: Opening and Closing Cutscenes

**Opening Briefing:**
- Must occur at mission start (before player has control)
- Implementation: Add NPC in starting room with `timedConversation` (delay: 0)
- Can show different location via `background` field (e.g., "assets/backgrounds/hq1.png")
- This NPC will auto-start dialogue when scenario loads

**Closing Debrief:**
- Must occur after mission completion
- Implementation options:
  1. **Via Ink**: Set global variable at mission end, trigger phone NPC with event mapping
  2. **Via objective**: Complete final objective triggers phone call
  3. **Via event**: Room entry, item pickup, or door unlock triggers debrief
- Most flexible: Use global variable (e.g., `mission_complete = true`) + phone NPC event

See `story_design/SCENARIO_JSON_FORMAT_GUIDE.md` for implementation examples.

---

Save your narrative structure as:
```
scenario_designs/[scenario_name]/01_narrative/story_arc.md
```

**Next Stage:** Pass this document to Stage 2 (Storytelling Elements) to develop characters, atmosphere, and dialogue opportunities.
