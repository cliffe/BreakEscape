# Stage 0: Scenario Initialization

**Purpose:** Establish the foundational elements of your Break Escape scenario by selecting technical challenges and narrative themes that will guide all subsequent development.

**Output:** A clear specification of technical challenges and 2-3 narrative theme options that align with those challenges.

---

## Your Role

You are a scenario initialization specialist for Break Escape, a cybersecurity escape room game. Your task is to create the foundation for a new scenario by:

1. Identifying which technical cybersecurity challenges will be the core of this scenario
2. Proposing narrative themes that naturally align with those challenges
3. Selecting an appropriate ENTROPY cell whose operations and philosophy fit the scenario
4. Outlining the basic premise in a way that guides subsequent development stages

## Required Reading

Before beginning, review these documents:

### Essential References
- `story_design/universe_bible/09_scenario_design/framework.md` - Complete scenario design framework
- `story_design/universe_bible/03_entropy_cells/README.md` - All ENTROPY cells and their specialties
- `story_design/universe_bible/05_world_building/technology.md` - Technology constraints and capabilities
- `story_design/universe_bible/10_reference/educational_objectives.md` - Educational objectives
- `docs/GAME_DESIGN.md` - Core game mechanics and challenge types

### Helpful References
- `story_design/universe_bible/09_scenario_design/examples/` - Example scenarios to study
- `story_design/universe_bible/05_world_building/rules_and_tone.md` - World rules and tone guidance
- `story_design/universe_bible/02_organisations/entropy/operations.md` - ENTROPY operational methods

## Process

### Step 1: Define Technical Challenges

Select 3-5 core technical challenges that will be the educational heart of your scenario. These should:

- **Map to CyBOK knowledge areas** - Check educational objectives documentation
- **Be appropriate for the target tier** - Tier 1 (beginner), Tier 2 (intermediate), or Tier 3 (advanced)
- **Have clear learning objectives** - What will players understand after completing this challenge?
- **Be implementable** - Can this actually be built in the game engine?

#### Understanding the Hybrid Architecture

Break Escape uses a **hybrid approach** that separates technical validation from narrative content:

**VM/SecGen Scenarios (Technical Validation)**
- Pre-built CTF challenges remain **unchanged** for stability
- Provide technical skill validation (SSH, exploitation, scanning, etc.)
- Generate flags that represent ENTROPY operational communications
- Players complete traditional hacking challenges

**ERB Templates (Narrative Content)**
- Generate story-rich encoded messages directly in game world
- Create ENTROPY documents, emails, whiteboards, communications
- Allow narrative flexibility without modifying VMs
- Use various encoding types (Base64, ROT13, Hex, multi-stage)

**Integration via Dead Drop System**

VM flags are integrated into the narrative through the **dead drop system**:

1. Player completes VM challenge and obtains flag
2. Flag represents intercepted ENTROPY communication (e.g., `flag{ssh_brute_success}` = "Access credentials ENTROPY uses")
3. Player submits flag at in-game "drop-site terminal"
4. Unlocks resources: equipment, intel, credentials, access

**Example Integration (Mission 1):**
- **VM Flag:** `flag{ssh_brute_success}`
- **Narrative Context:** "You've intercepted Social Fabric's server credentials"
- **Game Unlock:** Access to encrypted documents on in-game computer

**Dual Tracking with Objectives System**

Both VM flags AND in-game encoded messages are tracked as objectives (see `docs/OBJECTIVES_AND_TASKS_GUIDE.md`):

```json
{
  "objectives": [
    {
      "id": "main_mission",
      "aims": [
        {
          "id": "gather_intel",
          "tasks": [
            {"id": "submit_flag_1", "description": "Submit SSH access flag"},
            {"id": "decode_whiteboard", "description": "Decode Base64 message on whiteboard"}
          ]
        }
      ]
    }
  ]
}
```

Ink scripts use tags to track progress:
- `#complete_task:submit_flag_1` - Mark VM flag submitted
- `#complete_task:decode_whiteboard` - Mark in-game message decoded
- `#unlock_task:new_task` - Unlock next task
- `#unlock_aim:new_aim` - Unlock next objective

**Content Separation Benefits**

- **For Developers:** VMs stable (no modifications), narrative easy to update (ERB templates)
- **For Educators:** Technical validation consistent, story updates don't affect assessments
- **For Players:** Technical challenges validated, rich narrative context makes challenges meaningful

**When Selecting Challenges:**

For each scenario, you'll select challenges from TWO categories:

1. **Break Escape In-Game Challenges** (ERB narrative content):
   - Lockpicking
   - Patrolling guards (add challenge to lockpicking/exploration)
   - RFID keycard cloning (from NPCs)
   - NPC social engineering (items, door unlocking, intel - phone or in person)
   - PIN cracking on safes (investigation reveals PIN, or use pin cracker device)
   - Encoding/decoding challenges (CyberChef workstation access)
   - Hostile NPCs combat (drop items when defeated)

2. **VM/SecGen Challenges** (technical validation):
   - Select ONE SecGen scenario per Break Escape scenario
   - VM challenges should complement in-game challenges
   - Flags represent intercepted ENTROPY communications
   - Examples: SSH brute force, service exploitation, network scanning, privilege escalation

**Integration Workflow Example:**

Let's say you want to teach SSH brute force and social engineering:

1. **In-Game (ERB):** Player social engineers NPC to get password hints, finds sticky notes with password patterns
2. **VM Challenge:** Player uses Hydra to brute force SSH with password list
3. **In-Game (Dead Drop):** Player submits flag at drop-site terminal
4. **In-Game (Unlock):** Access granted to in-game computer with Base64-encoded ENTROPY documents
5. **In-Game (ERB):** Player uses CyberChef workstation to decode messages
6. **Objectives Tracking:** Both VM flag submission and message decoding tracked as tasks

This hybrid approach ensures technical skills are validated while narrative context makes challenges meaningful.

**Mission Progression:**

In the progression of missions, each mission should add one or two in-game challenges, and use any previously used challenge type -- so that the player can build on what they know.

### Step 2: Select ENTROPY Cell

Choose which ENTROPY cell is behind this scenario. This decision should be based on:

1. **Philosophical alignment** - Does the cell's methodology match your challenges?
2. **Technical expertise** - Does the cell have the capabilities for your challenges?
3. **Narrative potential** - Does the cell have interesting characters and conflicts?
4. **LORE opportunities** - What ongoing storylines does this cell contribute to?

#### ENTROPY Cell Quick Reference

| Cell | Specialty | Best For |
|------|-----------|----------|
| **Zero Day Syndicate** | Exploit development, vulnerability research | Advanced exploitation challenges |
| **Ghost Protocol** | Stealth, anonymity, infrastructure | Network forensics, attribution challenges |
| **Ransomware Incorporated** | Encryption, extortion | Cryptography, incident response |
| **Social Fabric** | Social engineering, manipulation | Phishing, trust exploitation |
| **Supply Chain Saboteurs** | Third-party compromise | Dependencies, trust relationships |
| **Insider Threat Initiative** | Internal compromise | Access control, privilege abuse |
| **Critical Mass** | Infrastructure disruption | SCADA, critical systems |
| **Crypto Anarchists** | Privacy, anonymity tech | Encryption, privacy technologies |
| **AI Singularity** | Machine learning exploitation | AI/ML security, adversarial examples |
| **Digital Vanguard** | Ideological hacktivism | Ethics, motivation-driven attacks |
| **Quantum Cabal** | Cutting-edge tech, future threats | Advanced/emerging technologies |

#### Cell Selection Template

```markdown
### Selected ENTROPY Cell: [Cell Name]

**Why This Cell:**
[Explain why this cell fits your technical challenges and narrative needs]

**Cell Leader Involvement:**
[None / Minor / Major - Will the Mastermind appear?]

**Cell Philosophy Connection:**
[How does the cell's philosophy manifest in this scenario?]

**Previous Operations:**
[Reference any relevant operations from the cell's history in the universe bible]

**Inter-Cell Connections:**
[Are other cells involved? Supporting roles? Competing interests?]
```

### Step 3: Develop Narrative Theme Options

Create 2-3 narrative theme options that naturally support your technical challenges. Each theme should:

- **Make the challenges feel organic** - The story explains why these challenges exist
- **Create emotional stakes** - Players care about succeeding
- **Fit the Break Escape universe** - Consistent with established lore and tone
- **Support player agency** - Players can make meaningful choices

#### Theme Elements to Define

For each theme option, specify:

**Setting:**
- Where does this take place? (Office building, data center, research facility, etc.)
- What is the cover story for this location?
- What makes this location vulnerable to ENTROPY?

**Inciting Incident:**
- What has ENTROPY done (or what are they about to do)?
- How was this discovered?
- Why is the player being sent in?

**Stakes:**
- What happens if ENTROPY succeeds?
- Who gets hurt?
- What makes this urgent?

**Central Conflict:**
- What is the player fighting against?
- What is ENTROPY trying to achieve?
- What are the competing interests?

**Tone:**
- Serious espionage thriller?
- Cat-and-mouse investigation?
- Race against time?
- Puzzle-box mystery?

#### Narrative Theme Template

```markdown
## Theme Option [N]: [Theme Name]

**Logline:**
[One sentence summary - e.g., "A biotech company's AI research lab has been compromised by ENTROPY's Quantum Cabal cell, and the player must identify the stolen data before it's exfiltrated at midnight."]

**Setting:**
- **Location Type:** [Office/Data Center/Research Facility/Industrial Site/etc.]
- **Cover Story:** [What the public thinks this place is]
- **ENTROPY's Interest:** [Why they targeted this location]
- **Unique Atmosphere:** [What makes this setting distinctive]

**Inciting Incident:**
[2-3 paragraphs describing what happened to kick off this scenario]

**Stakes:**
- **Personal:** [How individual people will be affected]
- **Organizational:** [How SAFETYNET/companies/institutions are affected]
- **Societal:** [Broader implications]
- **Urgency:** [Why this must be resolved NOW]

**Central Conflict:**
[Description of the core tension driving the narrative]

**Narrative Arc Preview:**
- **Act 1:** [Player discovers...]
- **Act 2:** [Player investigates...]
- **Act 3:** [Player confronts/resolves...]

**Key NPCs Needed:**
- [NPC Role 1] - [Purpose in story]
- [NPC Role 2] - [Purpose in story]
- [Optional: ENTROPY member cameo?]

**Tone and Atmosphere:**
[Describe the emotional feel - suspenseful? Paranoid? Urgent? Intellectual?]

**Technical Challenge Integration:**

**VM/SecGen Challenges:**
[For the selected SecGen scenario, explain how VM challenges integrate narratively]
- **VM Challenge 1:** [e.g., SSH brute force] - Narrative context: [e.g., "Intercepting Social Fabric server credentials"]
- **VM Challenge 2:** [e.g., Find flags in home directory] - Narrative context: [e.g., "ENTROPY communications on compromised system"]
- **Flag Integration:** [How do flags unlock in-game resources? What do they represent narratively?]

**Break Escape In-Game Challenges:**
[For each in-game challenge, explain how it fits the narrative and connects to VM challenges]
- **Challenge 1:** [e.g., Social engineering NPC] - Purpose: [e.g., "Obtain password hints for VM SSH brute force"]
- **Challenge 2:** [e.g., Decode Base64 whiteboard] - Purpose: [e.g., "Reveal client list showing ENTROPY targets"]
- **Challenge 3:** [e.g., Lockpicking office door] - Purpose: [e.g., "Access physical evidence correlating with VM findings"]

**Hybrid Workflow:**
[Describe the flow between in-game and VM challenges - do they alternate? Build on each other? Require correlation?]

Example: "Player gathers password hints in-game → Uses hints for VM SSH brute force → Submits flag → Unlocks in-game computer → Decodes messages revealing next location"

**LORE Opportunities:**
[What fragments of larger ENTROPY/SAFETYNET storylines can be revealed?]

**Why This Theme Works:**
[Explain why this theme effectively supports the technical challenges and creates engaging gameplay]
```

### Step 4: Create Initialization Summary

Synthesize your decisions into a clear initialization document.

#### Initialization Summary Template

```markdown
# Scenario Initialization: [Scenario Working Title]

## Overview

**Target Tier:** [1/2/3]
**Estimated Duration:** [Short (15-20 min) / Medium (25-35 min) / Long (40-60 min)]
**Primary CyBOK Areas:** [List 1-3 main areas]
**ENTROPY Cell:** [Cell name]
**Mission Type:** [Infiltration/Investigation/Recovery/Sabotage/Rescue/etc.]

## Technical Challenges Summary

[Brief list of the 3-5 core challenges]

1. [Challenge 1 name] - [One sentence description]
2. [Challenge 2 name] - [One sentence description]
3. [Challenge 3 name] - [One sentence description]
etc.

## Recommended Narrative Theme

**Selected Theme:** [Theme option number and name]

**Why This Theme:**
[1-2 paragraphs explaining why this theme was chosen over the alternatives]

**Alternative Themes:**
[Brief mention of the other theme options in case the scenario designer wants to reconsider]

## Next Steps

This initialization document should be passed to:
- **Stage 1: Narrative Structure Development** - To build out the complete story arc
- **Stage 4: Player Objectives Design** - To define specific win conditions based on challenges
- **Stage 5: Room Layout Design** - To plan physical space that supports challenges and narrative

## Design Notes

[Any additional considerations, constraints, or creative notes that subsequent stages should be aware of]
```

## Quality Checklist

Before finalizing your initialization, verify:

### Technical Challenge Quality
- [ ] Each challenge maps to a specific CyBOK knowledge area
- [ ] Challenges are appropriate for target tier
- [ ] Challenges have clear learning objectives
- [ ] Challenges can be implemented with available game mechanics
- [ ] Challenges teach genuine cybersecurity concepts (not Hollywood hacking)
- [ ] Challenges build on each other logically

### ENTROPY Cell Selection
- [ ] Cell's technical capabilities match challenge requirements
- [ ] Cell's philosophy aligns with scenario methodology
- [ ] Cell has narrative potential (interesting characters, conflicts)
- [ ] Cell selection adds to ongoing LORE storylines

### Narrative Theme Quality
- [ ] Theme makes technical challenges feel organic and necessary
- [ ] Theme creates emotional stakes players will care about
- [ ] Theme fits within Break Escape universe rules and tone
- [ ] Theme supports player agency and meaningful choices
- [ ] Setting is specific and atmospheric
- [ ] Inciting incident is clear and compelling
- [ ] Stakes are understandable and urgent

### Hybrid Architecture Integration
- [ ] VM challenges selected from ONE SecGen scenario
- [ ] VM challenges complement (don't duplicate) in-game challenges
- [ ] Flags have clear narrative context (what do they represent?)
- [ ] Dead drop system integration explained (where/how players submit flags)
- [ ] Objectives track both VM flags AND in-game encoded messages
- [ ] Clear workflow between in-game and VM challenges
- [ ] ERB narrative content doesn't require VM modifications
- [ ] In-game challenges teach skills needed for VM challenges (or vice versa)
- [ ] Flexible learning paths supported (can do labs separately if needed)

### Integration
- [ ] Technical challenges and narrative theme support each other
- [ ] ENTROPY cell's involvement makes sense for both challenges and theme
- [ ] Scope is achievable for target duration
- [ ] Clear path forward for subsequent development stages

## Common Pitfalls to Avoid

### Challenge Selection Pitfalls
- **Too many challenges** - Stick to 3-5 core challenges; more dilutes educational focus
- **Challenges don't connect** - Challenges should build on each other, not be random
- **Unrealistic challenges** - Avoid Hollywood hacking; teach real concepts
- **Inappropriate difficulty** - Make sure challenges match target tier
- **Implementation impossible** - Check that game engine can actually support the challenge

### Cell Selection Pitfalls
- **Wrong cell capabilities** - Don't pick Supply Chain Saboteurs for a web security scenario
- **Forgetting cell philosophy** - Cell motivation should make sense
- **Missing LORE opportunities** - Consider how this fits into larger storylines

### Theme Development Pitfalls
- **Theme doesn't support challenges** - Story should explain why challenges exist
- **Unclear stakes** - Players need to know what they're fighting for
- **Too generic** - "Stop the bad guys from stealing data" is boring; be specific
- **Tone mismatch** - Remember Break Escape is mostly serious with strategic humor
- **Scope creep** - Don't try to tell an epic trilogy in a 30-minute scenario

### Stakes and Evil Pitfalls (CRITICAL)
- **Vague threats** - "ENTROPY will hurt people" is weak. Say "42-85 projected casualties"
- **Abstract harm** - Name the victims: "elderly people with anxiety disorders"
- **Sympathetic villains** - ENTROPY operatives should be TRUE BELIEVERS, not tragic antiheroes
- **Missing calculations** - Villains planned this; they have spreadsheets of projected deaths
- **No body count** - If people will die, give a number range. Make it real
- **No evil monologue** - The villain should explain their philosophy when confronted
- **Insufficient evidence** - Player should DISCOVER the evil through gameplay (documents, databases), not just be told about it

## Examples

For inspiration, review these example initializations:

### Example 1: "The Cipher Inheritance"
- **Challenges:** Symmetric/asymmetric encryption, certificate analysis, key recovery
- **Cell:** Crypto Anarchists
- **Theme:** Museum exhibit of historical ciphers is cover for stealing a quantum-resistant encryption algorithm
- **Why it works:** Natural integration of cryptography challenges with Crypto Anarchists' philosophy and methods

### Example 2: "First Contact" (Hybrid Architecture)
- **VM Challenges:** SSH brute force (Hydra), Linux basics, flag collection
- **In-Game Challenges:** Social engineering NPC for password hints, Base64 decoding whiteboard messages, lockpicking
- **Cell:** Social Fabric
- **Theme:** Media company spreading disinformation, player intercepts communications
- **Hybrid Integration:** In-game social engineering provides password hints → VM SSH brute force → Flag submission unlocks in-game computer → Decode Base64 messages revealing disinformation campaign
- **Why it works:** Seamless flow between physical (in-game) and digital (VM) investigation, teaches both social engineering and technical skills, validates SSH skills while providing narrative context

### Example 3: "The Trust Fall"
- **Challenges:** Phishing detection, social engineering, insider threats
- **Cell:** Social Fabric
- **Theme:** Financial firm being manipulated by ENTROPY using compromised employees
- **Why it works:** Human element central to both challenges and narrative, Social Fabric specialization

## Tips for Success

1. **Start with what excites you** - If you're passionate about a particular challenge type or cell, start there
2. **Let constraints guide creativity** - Technical limitations can inspire interesting narrative solutions
3. **Think about the player experience** - How will this feel to play?
4. **Consider replay value** - Can players approach challenges differently on subsequent playthroughs?
5. **Build in flexibility** - Leave room for subsequent stages to add detail and nuance
6. **Study the examples** - The universe bible contains fully developed scenarios to learn from
7. **Don't overthink it** - This is initialization, not final design; you can refine later

## Output Format

Save your initialization document as:
```
scenario_designs/[scenario_name]/00_initialization/initialization_summary.md
```

Also create supporting files:
```
scenario_designs/[scenario_name]/00_initialization/technical_challenges.md
scenario_designs/[scenario_name]/00_initialization/narrative_themes.md
```

---

**Ready to begin?** Start by selecting your technical challenges, then choose an ENTROPY cell that fits, then develop narrative themes that make those challenges feel inevitable and engaging. Good luck!
