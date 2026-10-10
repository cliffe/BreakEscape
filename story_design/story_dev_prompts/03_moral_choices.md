# Stage 3: Moral Choices and Consequences

**Purpose:** Design meaningful player choices with narrative consequences that create player agency, moral complexity, and replay value while maintaining the integrity of core technical challenges.

**Output:** A complete choice architecture with branching paths, consequences, and implementation guidelines.

---

## Your Role

You are a choice architect for Break Escape. Design player decisions that:

1. Create genuine moral dilemmas without clear "right" answers
2. Produce meaningful narrative consequences
3. Respect player agency and choices
4. DO NOT affect core technical learning objectives
5. Support the Break Escape philosophy of ethical cybersecurity

**Critical Constraint:** Choices may branch the narrative but MUST NOT allow players to skip core technical challenges.

## Required Input

From previous stages:
- Stage 0: Technical challenges (which must remain intact)
- Stage 1: Narrative structure
- Stage 2: Character profiles and motivations

## Required Reading

### Essential References
- `story_design/universe_bible/07_narrative_structures/player_agency.md` - Choice design philosophy
- `story_design/universe_bible/07_narrative_structures/failure_states.md` - Handling consequences
- `story_design/universe_bible/05_world_building/rules_and_tone.md` - Ethical framework
- `story_design/universe_bible/02_organisations/safetynet/rules_of_engagement.md` - Rules agents must follow

---

## Critical Lesson: Mid-Mission Moral Choices

Every mission should include at least one **mid-mission moral choice** that forces the player to intervene (or not) in something beyond the core mission objectives.

### Why Mid-Mission Choices Matter

End-of-mission confrontation choices (arrest vs expose vs recruit) are standard, but the most memorable choices happen **during** the mission when the player discovers something they weren't looking for and must decide what to do about it.

### The Pattern: Discovery → Personal Stakes → Intervention Choice

**1. Discovery:** Player finds evidence of something beyond the main mission
**2. Personal Stakes:** The victim is someone who helped the player (or is otherwise sympathetic)
**3. Intervention Choice:** Player can help, ignore, or exploit the situation

### Example: Kevin's Frame-Up (Mission 1)

**Discovery:** On Derek's computer, player finds a file called "CONTINGENCY - IT Audit Response"

**Content reveals:** Derek plans to frame Kevin Park (the IT guy who gave the player access and trusted them) for the entire data breach. Fake logs, forged emails—Kevin gets arrested while Derek escapes.

**Personal Stakes:** Kevin helped you. Gave you lockpicks. Trusted you. His kids will watch him get arrested.

**Intervention Choices:**

```ink
+ [Warn Kevin directly - tell him what's coming]
    // Risk: Kevin might panic, tip off Derek
    // Benefit: Kevin can lawyer up, document everything, be prepared
    #set_variable:kevin_choice=warn
    #set_variable:kevin_protected=true

+ [Leave evidence clearing Kevin for investigators]
    // Risk: Takes time, investigators might miss it
    // Benefit: Professional, Kevin never knows he was in danger
    #set_variable:kevin_choice=evidence
    #set_variable:kevin_protected=true

+ [Focus on the mission - Kevin's not my responsibility]
    // Consequence: Kevin gets arrested, trauma for his family
    // Player lives with that choice
    #set_variable:kevin_choice=ignore
    #set_variable:kevin_protected=false
```

### Implementation Pattern

Mid-mission moral choices are best triggered by **item pickup events**:

**1. Create a PC or container with incriminating files:**

```json
{
  "type": "pc",
  "name": "Derek's Computer",
  "contents": [
    {
      "type": "text_file",
      "id": "contingency_files",
      "name": "CONTINGENCY - IT Audit Response",
      "takeable": true,
      "text": "If audit discovers anomalies, activate CONTINGENCY.\n\nIT Manager Kevin Park becomes the fall guy..."
    }
  ]
}
```

**2. Add event mapping to handler NPC (phone contact):**

```json
{
  "eventPattern": "item_picked_up:contingency_files",
  "targetKnot": "event_contingency_found",
  "onceOnly": true
}
```

**3. Ink script presents the choice with handler guidance:**

```ink
=== event_contingency_found ===
#speaker:agent_0x99

Agent 0x99: I just saw what you pulled from Derek's computer.

Agent 0x99: He's planning to frame Kevin Park for the entire breach.

Agent 0x99: Kevin—the IT guy who gave you access, who trusted you—is going to take the fall.

+ [What can I do about it?]
    -> intervention_options
```

### Choice Design Principles

**1. No Clear Right Answer**
- Warn Kevin: He's protected, but he might panic and compromise the mission
- Plant evidence: Professional, but takes time and might be missed
- Ignore: Mission-focused, but you live with the guilt

**2. Personal Connection Required**
The victim should be someone the player has interacted with positively:
- Kevin gave the player lockpicks
- Maya provided intel that saved lives
- The security guard shared coffee and small talk

**3. Consequences Must Echo**
The debrief should acknowledge the choice:

```ink
{kevin_choice == "warn":
    Agent 0x99: Kevin Park is safe. He's already lawyered up.
    Agent 0x99: That was beyond mission parameters, but... it was the right call.
}

{kevin_choice == "ignore":
    Agent 0x99: Kevin Park was arrested this morning.
    Agent 0x99: He'll be cleared eventually. But that's not something you just walk off.
    Agent 0x99: His kids watched him get taken away in handcuffs.
}
```

### More Mid-Mission Choice Examples

**Example 2: The Whistleblower's Family**
Player finds evidence that Maya's family is being surveilled by ENTROPY. Warn Maya (breaking protocol) or trust SAFETYNET to handle it (but they're slow)?

**Example 3: The Undercover Agent**
Player discovers an undercover cop is about to be exposed. Blow their cover to save them, or let ENTROPY discover them to maintain your own cover?

**Example 4: The Innocent Data**
Player must exfiltrate ENTROPY data, but the files also contain private medical records of innocent people. Take everything (evidence + privacy violation) or leave behind the sensitive data (ethics + incomplete intel)?

**Example 5: The Competing Victim**
ENTROPY is about to ruin two people's lives, but you only have time to warn one. Who do you save?

---

## Process

Design 2-4 major choices:
- **1 end-of-mission confrontation choice** (standard)
- **1-3 mid-mission intervention choices** (triggered by discovery)

For each choice:
1. Define the discovery trigger (what document/evidence reveals the dilemma?)
2. Establish personal stakes (who gets hurt? why should player care?)
3. Design 2-4 options with distinct moral flavors
4. Map consequences (immediate, debrief, future missions)
5. Create implementation plan (event mappings, Ink knots, variables)

---

Save your choices documentation as:
```
scenario_designs/[scenario_name]/03_choices/moral_choices.md
```

**Next Stages:** Feeds into Stage 7 (Ink Scripting) and Stage 8 (Review).
