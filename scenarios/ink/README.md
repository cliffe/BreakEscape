# Break Escape - Ink Dialogue Scripts

This directory contains Ink dialogue scripts for the Break Escape universe, focusing on Agent 0x00's introduction to SAFETYNET's CYBER-PHYSICAL division and reusable lore exploration systems.

## Files

### 1. `agent_0x00_cyber_division_intro.ink`

**Purpose**: Introduction cutscene for Agent 0x00 joining the CYBER-PHYSICAL division

**When to Use**:
- Campaign opening sequence
- Tutorial/onboarding for new players
- Character establishment moment

**Key Features**:
- Introduces Director Netherton and Agent 0x99 "Haxolottle"
- Establishes SAFETYNET HQ atmosphere
- Player makes meaningful choices affecting relationships
- Sets up future character dynamics

**Variables Set**:
- `netherton_respect` (0-100) - Director's assessment of the agent
- `haxolottle_trust` (0-100) - Handler's confidence in the agent
- `player_attitude` - Character approach style (eager, cautious, confident, analytical)
- `specialization_interest` - Career direction hints (cyber, physical, hybrid)
- `knows_cyber_division` - Lore flag
- `knows_handler_role` - Lore flag
- `professional_impression` - Initial standing

**Narrative Structure**:
1. **Summons to HQ** - Player receives mysterious call to Director's office
2. **Director Netherton Briefing** - Formal introduction to CYBER-PHYSICAL division
3. **Handler Introduction** - Meeting Agent 0x99 "Haxolottle"
4. **Philosophy Questions** - Player expresses operational approach
5. **Orientation Setup** - Transition to ongoing work

**Character Moments**:
- Director Netherton's stern but caring demeanor
- Haxolottle's warm, mentor personality and axolotl metaphors
- Tension between Netherton's formality and Haxolottle's casualness
- Player agency through multiple choice branches

**Integration Notes**:
- Can reference `player_name` external variable
- Can reference `previous_missions_completed` for continuity
- All relationship variables persist for future scenarios
- Multiple endings based on player choices

---

### 2. `lore_exploration_hub.ink`

**Purpose**: Reusable dialogue system for exploring SAFETYNET and ENTROPY lore during missions

**When to Use**:
- Phone conversations with handler during missions
- Downtime dialogue during infiltrations
- Pre/post-mission briefings
- Optional character building moments

**Key Features**:
- Hub-based conversation pattern (return to menu after each topic)
- Influence tracking with multiple NPCs
- Progressive revelation (deeper topics unlock with higher influence)
- Works with different speakers (handler, tech support, director)
- Mission-agnostic design for reusability

**Influence Variables**:
- `handler_influence` (0-100) - Relationship with handler (Haxolottle)
- `tech_influence` (0-100) - Relationship with technical support (Dr. Chen)
- `director_influence` (0-100) - Relationship with command (Netherton)
- `fellow_agent_influence` (0-100) - Relationship with peer agents

**Topic Categories**:

#### ENTROPY Topics
- **Origins** - Where ENTROPY came from, emergence theories
- **Philosophy** - Accelerationism, nihilism, ideological diversity
- **Cells** - Digital Vanguard, Critical Mass, Ghost Protocol, Ransomware Inc.
- **Tactics** - Technical methods and operational patterns
- **Coordination** - How decentralized cells work together (mystery)

#### SAFETYNET Topics
- **Mission** - Organizational purpose and legal gray areas
- **Methods** - Technical capabilities and operational approaches
- **Shadow War** - Ongoing invisible conflict with ENTROPY
- **Field Operations** - Practical advice for missions
- **CYBER-PHYSICAL** - Specialized work integrating digital and physical security

#### Deep Lore (Unlocks with High Influence)
- **Handler Backstory** (30+ influence) - Haxolottle's past and Operation Regenerate
- **Berlin Crisis** (50+ influence) - Director Netherton's difficult decision
- **Moral Complexity** - Legal authority, oversight, ethical considerations
- **Cutting-Edge Research** (30+ tech influence) - Experimental capabilities

**Entry Points**:
- `start_handler_lore` - Conversation with handler (Haxolottle)
- `start_tech_support_lore` - Conversation with tech support (Dr. Chen)
- `start_director_lore` - Conversation with director (Netherton)

**Integration Examples**:

```ink
// During mission downtime
=== mission_checkpoint ===
You reach a safe moment. Your phone buzzes.
+ [Answer handler's call]
    -> start_handler_lore
+ [Continue mission]
    -> next_objective
```

```ink
// Phone conversation trigger
=== phone_ring ===
#speaker:agent_haxolottle
Haxolottle: Got a moment? Want to discuss anything?
-> lore_hub_handler
```

**Character-Specific Styles**:

**Handler (Haxolottle)**:
- Warm, supportive, mentoring tone
- Axolotl metaphors about adaptation and regeneration
- Shares field experience and practical wisdom
- Most comprehensive lore coverage
- Balance of professional and personal

**Tech Support (Dr. Chen)**:
- Rapid-fire technical explanations
- Focuses on methods, capabilities, research
- Enthusiastic about cutting-edge topics
- Less emotional depth, more technical detail

**Director (Netherton)**:
- Formal, structured, handbook references
- Focus on mandate, protocols, rules of engagement
- Rare moments of vulnerability about organization's future
- Shorter conversations, more authoritative

---

## Design Principles

### 1. Influence-Based Progression

Both scripts use influence tracking to:
- Gate deeper/more personal information behind relationship building
- Reward player curiosity and engagement
- Create replayability through gradual revelation
- Make relationship development feel earned

**Influence Gains**:
- Basic questions: +3 to +5
- Thoughtful questions: +8 to +10
- Personal questions: +10 to +15
- Deep vulnerability moments: +15 to +25

**Influence Gates**:
- 0-20: Basic information available
- 20-40: Moderate depth unlocked
- 40-60: Personal stories and context
- 60+: Deep lore and vulnerable moments

### 2. Hub Pattern

Lore exploration uses hub-and-spoke conversation structure:
- Return to topic menu after each conversation
- Topics marked as discussed to prevent repetition
- New topics unlock based on prerequisites
- Easy to add new topics without breaking existing structure

### 3. Character Voice Consistency

Each character maintains distinct voice:

**Director Netherton**:
- Formal speech, handbook references
- "Per section X.Y..." phrasing
- Rare approval is meaningful
- Protective through procedural language

**Agent Haxolottle**:
- Casual but professional
- Axolotl metaphors (not overused)
- Supportive and warm
- Field experience perspective

**Dr. Chen**:
- Rapid technical explanations
- Enthusiastic about research
- Less filtered, more direct
- Energy and momentum

### 4. Player Agency

Multiple choices that matter:
- Affect relationships (influence changes)
- Reflect character approach
- Unlock different dialogue branches
- Create roleplay opportunities

### 5. Lore Integration

Information designed to:
- Enhance understanding of game world
- Provide context for missions
- Build investment in conflict
- Answer player questions naturally

---

## Variables Reference

### Relationship Variables
```ink
VAR netherton_respect = 50          // Director's assessment
VAR haxolottle_trust = 50           // Handler's confidence
VAR handler_influence = 0           // Cumulative handler relationship
VAR tech_influence = 0              // Cumulative tech support relationship
VAR director_influence = 0          // Cumulative director relationship
```

### Character State Variables
```ink
VAR player_attitude = ""            // Player's roleplay style
VAR specialization_interest = ""    // Career direction
VAR conversation_depth = 0          // How much player has explored
```

### Topic Tracking (Boolean Flags)
```ink
VAR discussed_entropy_origins = false
VAR discussed_entropy_philosophy = false
VAR discussed_entropy_cells = false
VAR discussed_safetynet_mission = false
VAR discussed_shadow_war = false
VAR discussed_field_ops = false
VAR discussed_cyber_physical = false
VAR discussed_moral_complexity = false
```

### Deep Lore Unlocks
```ink
VAR knows_berlin_crisis = false         // Director's difficult past
VAR knows_handler_backstory = false     // Haxolottle's history
VAR knows_entropy_masterminds = false   // High-level ENTROPY intel
VAR knows_0x42_legend = false          // Mysterious agent stories
```

---

## Usage Guidelines

### For Scenario Designers

**Integrating the Intro Cutscene**:
1. Place at campaign start or major transition point
2. Ensure external variables (`player_name`, `previous_missions_completed`) are set
3. Carry forward influence variables to future scenarios
4. Reference player's `player_attitude` in mission briefings
5. Use `specialization_interest` to tailor challenge types

**Integrating Lore Exploration**:
1. Add phone conversation triggers during missions
2. Use as optional dialogue during downtime
3. Include in pre/post-mission briefings
4. Gate advanced topics behind influence requirements
5. Reference discussed topics in later dialogue

**Maintaining Continuity**:
- Persist influence variables across scenarios
- Reference previous discussions when appropriate
- Build on established character relationships
- Acknowledge player's growing expertise

### For Writers

**Adding New Topics**:
1. Create topic flag: `VAR discussed_new_topic = false`
2. Add hub menu option with condition
3. Write topic content with influence gains
4. Link back to hub: `-> lore_hub_handler`
5. Consider prerequisites for topic visibility

**Character Voice Checklist**:
- [ ] Netherton uses formal language and handbook references
- [ ] Haxolottle includes supportive mentoring and occasional axolotl metaphor
- [ ] Dr. Chen speaks rapidly and technically
- [ ] Dialogue reflects character's background and expertise
- [ ] Influence gains match conversation depth

**Quality Standards**:
- Each topic should be 3-5 exchanges (not too long)
- Include at least one meaningful choice per major topic
- Award influence for good questions and engagement
- Maintain consistent tone across related topics
- Provide both information and character development

---

## Testing Checklist

Before integration:

- [ ] All knots are reachable
- [ ] No orphaned diverts (-> pointing to non-existent knots)
- [ ] Variables are consistently named
- [ ] Influence gains are balanced (not too easy/hard to max)
- [ ] Topic flags prevent repetition
- [ ] Hub pattern returns correctly
- [ ] Exit conversation works properly
- [ ] Character voices are distinct and consistent
- [ ] External variables are properly marked EXTERNAL
- [ ] Ink compiles without errors in Inky editor

---

## Future Expansion Ideas

### Additional Topics
- Specific ENTROPY cell deep dives (Zero Day Syndicate, AI Singularity)
- SAFETYNET training and recruitment process
- Historical operations and case studies
- Technology and equipment discussions
- Personal stories from NPCs
- Moral dilemmas and ethical discussions

### Additional Characters
- Dr. Chen dedicated dialogue tree
- Agent 0x42 mysterious encounters
- Fellow agent peer conversations
- ENTROPY defector interviews
- Command council members

### Advanced Features
- Dynamic topic recommendations based on current mission
- Relationship status summaries
- Character mood/stress tracking affecting responses
- Time-gated topics (only available at certain points)
- Mission-specific lore variants

---

## Credits

**Writing Style Influenced By**:
- Break Escape Universe Bible (story_design/universe_bible/)
- Character profiles (Director Netherton, Agent 0x99, Agent 0x00)
- Ink Scripting Guide (story_design/story_dev_prompts/07_ink_scripting.md)
- Lore System Design (story_design/universe_bible/08_lore_system/)

**Ink Resources**:
- [Ink Documentation](https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md)
- [Inkle Studios](https://www.inklestudios.com/)

---

## Integration Support

For questions about integrating these scripts:
1. Check `docs/INK_INTEGRATION.md` for technical integration
2. Review `story_design/story_dev_prompts/07_ink_scripting.md` for Ink best practices
3. See `story_design/story_dev_prompts/FEATURES_REFERENCE.md` for available game features

## Notes for Developers

**Event Hooks** (for future implementation):
- `#start_gameplay` - Transition from cutscene to game
- `#exit_conversation` - Close dialogue interface
- `#speaker:character_id` - Set active speaker for dialogue UI

**Save System Considerations**:
- All influence variables should persist across sessions
- Topic flags should persist to prevent repetition
- Consider separate save slots for influence vs. mission progress

**Performance**:
- Hub pattern is efficient for branching conversations
- Boolean flags prevent unnecessary re-computation
- Influence calculations are simple arithmetic

---

*Last Updated: 2025-11-18*
*Version: 1.0*
*Status: Ready for Integration*
