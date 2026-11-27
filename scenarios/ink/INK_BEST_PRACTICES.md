# Ink Best Practices for Break Escape

This document outlines the patterns and best practices we use for Ink scripting in Break Escape.

## Table of Contents
1. [Hub Architecture](#hub-architecture)
2. [Influence Tags System](#influence-tags-system)
3. [External Functions](#external-functions)
4. [Variable Persistence](#variable-persistence)
5. [Common Patterns](#common-patterns)

---

## Hub Architecture

### Mission Hub Pattern

Every NPC hub file uses a standardized `mission_hub` knot that serves as the central routing point. This is **internal architecture** (not visible to players) that enables seamless conversation flow.

```ink
=== npc_conversation_entry ===
// Initial greeting based on location
{
    - npc_location() == "lab":
        Dr. Chen: Hey! What brings you by?
    - else:
        Dr. Chen: Hello!
}
-> mission_hub

=== mission_hub ===
// Central routing point - routes to personal or mission topics
+ [Personal chat] -> jump_to_personal_conversations
+ [Mission briefing] -> mission_briefing
+ [Equipment check] -> equipment_discussion
```

**Key Benefits:**
- Personal conversations return to `mission_hub` seamlessly
- Mission topics return to `mission_hub` after completion
- Exit options close the UI while preserving state at mission_hub
- Player sees continuous conversation, game manages routing

### How #end_conversation Works

**CRITICAL:** Personal conversations return to mission_hub WITHOUT the `#end_conversation` tag. Only exit options in mission_hub use this tag.

**Personal Conversation Endings (NO TAG):**
```ink
=== conversation_end ===
Dr. Chen: Great talking with you!
-> mission_hub    // Returns to hub menu - NO #end_conversation tag
```

**Exit Options in Mission Hub (WITH TAG):**
```ink
=== mission_hub ===
+ [Personal chat] -> jump_to_personal_conversations
+ [Mission briefing] -> mission_briefing
+ [That's all for now, Chen]    // EXIT OPTION
    Dr. Chen: Alright! Let me know if you need anything.
    #end_conversation              // Tag closes the UI
    -> mission_hub                 // Preserves state here
```

**Flow Example:**
1. Player chooses "Personal chat" at mission_hub
2. Has personal conversation
3. Personal conversation ends → `-> mission_hub` (NO TAG)
4. Player returns to mission_hub menu with all options
5. Player can choose more topics OR choose exit option
6. Exit option: `#end_conversation -> mission_hub` closes UI and preserves state
7. Next conversation resumes from mission_hub

**Why this matters:**
- ✅ **Seamless hub returns** - Personal conversations don't close the UI
- ✅ **Player choice** - Player decides when conversation is done
- ✅ **State preservation** - Story state saved at mission_hub (not DONE)
- ✅ **Context awareness** - Hub can show different options based on what was discussed

---

## Influence Tags System

### Visual Feedback for Relationship Changes

Every time an NPC's influence changes, add a tag for visual feedback to the player.

**All NPCs now use unified `influence` scoring** for consistency and simplicity.

### Tag Format

```ink
// Variable change
~ npc_chen_influence += 5

// Visual feedback tag (on next line)
#influence_gained:5
```

### Available Tags

**Positive Changes:**
- `#influence_gained:X` - NPC appreciates this (+X influence)

**Negative Changes:**
- `#influence_lost:X` - NPC is disappointed (-X influence)

**Note:** The game automatically customizes the message based on which NPC it is:
- Dr. Chen: "Dr. Chen appreciates that" / "Dr. Chen is disappointed"
- Director Netherton: "Director Netherton approves" / "Director Netherton is displeased"
- Haxolottle: "Haxolottle likes that" / "Haxolottle seems disappointed"

### Complete Example

```ink
=== helpful_conversation ===
You: I want to understand the tech better.
Dr. Chen: That's great! Let me explain...

// Small influence gain for showing interest
~ npc_chen_influence += 3
#influence_gained:3

+ [Ask follow-up questions]
    You: Can you tell me more?
    Dr. Chen: Of course! *enthusiastically explains*

    // Larger influence gain for deeper engagement
    ~ npc_chen_influence += 8
#influence_gained:8

+ [Dismiss the explanation]
    You: Never mind, not important.
    Dr. Chen: Oh... okay. *slightly hurt*

    // Lose influence for being dismissive
    ~ npc_chen_influence -= 5
    #influence_lost:5
```

### Visual Feedback Messages

The game displays context-appropriate messages based on the NPC and amount:

| NPC | Small Gain (<10) | Large Gain (≥10) | Small Loss (<10) | Large Loss (≥10) |
|-----|------------------|------------------|------------------|------------------|
| **Dr. Chen** | "Dr. Chen appreciates that" | "Dr. Chen really likes that" | "Dr. Chen seems uncertain" | "Dr. Chen is disappointed" |
| **Director Netherton** | "Director Netherton approves" | "Director Netherton is impressed" | "Director Netherton notes this" | "Director Netherton is displeased" |
| **Haxolottle** | "Haxolottle likes that" | "Haxolottle really appreciates that" | "Haxolottle seems disappointed" | "Haxolottle is hurt" |

### When to Use Influence Tags

**Add influence changes (and tags) for:**
- Player choices that show emotional intelligence
- Showing interest in NPC's personal life
- Professional competence or incompetence
- Trust-building moments
- Humor and shared experiences
- Vulnerability and openness
- Dismissive or insensitive responses (negative)

**Frequency:**
- Small changes (±2-5): Frequent, for minor positive/negative interactions
- Medium changes (±5-10): For meaningful choices and conversations
- Large changes (±10-15): For major trust moments or significant breaches

**Example Flow:**
```ink
=== deep_conversation ===
Haxolottle: I lost an agent six months ago. Still think about them.

+ [Express sympathy]
    You: I'm so sorry. That must be really hard.
    Haxolottle: Thanks. It helps to talk about it.
    ~ npc_haxolottle_influence += 10
    #influence_gained:10
    -> conversation_continues

+ [Ask tactical questions only]
    You: What was the mission profile?
    Haxolottle: *pause* ...Let's focus on your current operation.
    ~ npc_haxolottle_influence -= 3
    #influence_lost:3
    -> conversation_continues

+ [Share your own loss]
    You: I understand. I've lost people too.
    Haxolottle: *eyes soften* Yeah. You get it.
    ~ npc_haxolottle_influence += 15
    #influence_gained:15
    ~ npc_haxolottle_shared_loss = true
    -> deeper_connection
```

---

## External Functions

### Required External Functions for NPC Hubs

All NPC hub files require these EXTERNAL function declarations:

```ink
EXTERNAL player_name()           // Returns player's agent name
EXTERNAL current_mission_id()    // Returns active mission ID
EXTERNAL npc_location()          // Where conversation happens
EXTERNAL mission_phase()         // Planning/active/debriefing/downtime
```

### NPC-Specific External Functions

**For Dr. Chen (tech specialist):**
```ink
EXTERNAL equipment_status()      // nominal/damaged/needs_upgrade
```

**For Haxolottle (handler):**
```ink
EXTERNAL operational_stress_level()  // low/moderate/high/crisis
```

### Usage in Conditionals

```ink
// Correct - call with parentheses
{player_name() == "Shadow":
    Dr. Chen: Welcome back, Shadow!
}

// Correct - in dialogue
Dr. Chen: Hey there, {player_name()}!

// Correct - conditional branching
{
    - mission_phase() == "active":
        Dr. Chen: Not now, I'm tracking your mission!
    - mission_phase() == "downtime":
        Dr. Chen: Got time to chat?
}
```

---

## Variable Persistence

### Three-Tier Variable System

**1. PERSISTENT Variables** - Saved across all game sessions
```ink
VAR PERSISTENT npc_chen_rapport = 0
VAR PERSISTENT total_missions_completed = 0
VAR PERSISTENT npc_haxolottle_talked_axolotls = false
```

**2. GLOBAL Variables** - Persist within current session only
```ink
VAR npc_current_conversation_topic = ""
VAR temporary_mission_flag = false
```

**3. EXTERNAL Variables** - Provided by game engine
```ink
EXTERNAL player_name()
EXTERNAL mission_phase()
```

### Naming Conventions

```ink
// Persistent relationship variables - ALL NPCs use "influence"
VAR PERSISTENT npc_chen_influence = 0              // Dr. Chen's influence
VAR PERSISTENT npc_netherton_influence = 0         // Netherton's influence
VAR PERSISTENT npc_haxolottle_influence = 0        // Haxolottle's influence

// Conversation flags (has this topic been discussed?)
VAR PERSISTENT npc_chen_talked_childhood = false
VAR PERSISTENT npc_netherton_discussed_handbook = false

// Shared experiences
VAR PERSISTENT npc_haxolottle_humor_shared = 0    // Count of jokes shared
VAR PERSISTENT npc_chen_projects_collaborated = 0  // Projects worked on together
```

---

## Common Patterns

### Has Available Topics Pattern

Use functions to check if there are topics available:

```ink
=== function has_available_personal_topics() ===
// Check if any personal topics are available
{
    - total_missions_completed <= 5:
        // Phase 1 topics
        {
            - not npc_chen_talked_childhood: ~ return true
            - not npc_chen_talked_motivation: ~ return true
            - else: ~ return false
        }
    - total_missions_completed <= 10:
        // Phase 2 topics
        {
            - not npc_chen_shared_doubt and npc_chen_rapport >= 40: ~ return true
            - not npc_chen_talked_research and npc_chen_rapport >= 30: ~ return true
            - else: ~ return false
        }
    - else:
        ~ return false
}

// Usage in hub
+ {has_available_personal_topics()} [Chat personally with Dr. Chen]
    -> jump_to_personal_conversations
```

### Jump to Phase Pattern

Route to appropriate phase based on mission progress:

```ink
=== jump_to_personal_conversations ===
{
    - total_missions_completed <= 5:
        -> phase_1_hub
    - total_missions_completed <= 10:
        -> phase_2_hub
    - total_missions_completed <= 15:
        -> phase_3_hub
    - total_missions_completed > 15:
        -> phase_4_hub
}
```

### Conversation End Pattern

Always end personal conversations by returning to mission_hub WITHOUT #end_conversation tag:

```ink
=== conversation_end ===
{
    - npc_chen_influence >= 70:
        Dr. Chen: Always a pleasure, {player_name()}!
    - npc_chen_influence >= 50:
        Dr. Chen: Thanks for the chat.
    - else:
        Dr. Chen: Talk later.
}

-> mission_hub    // NO #end_conversation tag - returns to menu
```

**Important:** Personal conversations do NOT use `#end_conversation` tag. They return to `mission_hub` seamlessly, allowing the player to choose more topics or exit. Only the exit options in mission_hub use `#end_conversation` to close the UI.

### Conditional Relationship Responses

Vary NPC responses based on relationship level:

```ink
=== greeting ===
{
    - npc_haxolottle_influence >= 70:
        Haxolottle: {player_name()}! *genuine smile* Always good to see you.
    - npc_haxolottle_influence >= 40:
        Haxolottle: Hey {player_name()}. What's up?
    - npc_haxolottle_influence >= 20:
        Haxolottle: Agent {player_name()}. Need something?
    - else:
        Haxolottle: Agent. What do you need?
}
```

### Gated Content Pattern

Lock topics behind relationship thresholds:

```ink
+ {npc_netherton_influence >= 60 and not npc_netherton_shared_past}
    [Ask about Netherton's field days]
    -> netherton_field_stories

+ {npc_chen_influence >= 80 and not npc_chen_shared_doubts}
    [Notice Dr. Chen seems troubled]
    -> chen_vulnerability_moment
```

### Multi-Choice Influence Pattern

Give players meaningful choices with different influence outcomes:

```ink
=== difficult_question ===
Netherton: Do you think the ends justify the means?

+ [Agree completely]
    You: Always. Results matter more than methods.
    Netherton: *approving nod* Practical thinking.
    ~ npc_netherton_influence += 10
    #influence_gained:10

+ [Disagree completely]
    You: No. How we achieve our goals defines who we are.
    Netherton: *slight frown* Idealistic. But noted.
    ~ npc_netherton_influence -= 5
    #influence_lost:5

+ [It's complicated]
    You: It depends on the situation and the stakes.
    Netherton: *considering* Nuanced. Good.
    ~ npc_netherton_influence += 5
    #influence_gained:5
```

---

## Quick Reference

### Checklist for New NPC Conversations

- [ ] Declare all EXTERNAL functions at top of hub file
- [ ] Use `mission_hub` knot as central routing point
- [ ] End personal conversations with `-> mission_hub` (NO #end_conversation tag)
- [ ] Add exit options in mission_hub with `#end_conversation -> mission_hub`
- [ ] Add influence tags after every relationship variable change
- [ ] Use `has_available_personal_topics()` function
- [ ] Implement phase-based content routing
- [ ] Gate advanced topics behind relationship thresholds
- [ ] Include context-aware greetings based on location
- [ ] Vary dialogue tone based on relationship level
- [ ] Test compilation with inklecate

### Common Mistakes to Avoid

❌ **Wrong:**
```ink
{player_name}                    // Missing parentheses
~ npc_chen_rapport += 5          // Old variable name (use influence)
-> chen_hub                      // Non-standard hub name
#exit_conversation               // Old tag name

// WRONG: Tag in personal conversation ending
=== conversation_end ===
Dr. Chen: Good chat!
#end_conversation                // Don't do this in personal endings!
-> mission_hub

// WRONG: Exit option using DONE
+ [Exit]
    #end_conversation
    -> DONE                      // Doesn't preserve state at hub
```

✅ **Correct:**
```ink
{player_name()}                  // External function with parentheses
~ npc_chen_influence += 5        // Unified influence variable
#influence_gained:5              // Visual feedback tag
-> mission_hub                   // Standard hub knot name

// CORRECT: Personal conversation ending
=== conversation_end ===
Dr. Chen: Good chat!
-> mission_hub                   // NO tag - returns to menu

// CORRECT: Exit option in mission_hub
+ [That's all for now]
    Dr. Chen: Talk later!
    #end_conversation            // Tag closes UI
    -> mission_hub               // Preserves state here
```

---

## Examples by NPC Type

### Dr. Chen (Technical Specialist)
- **Influence** variable: `npc_chen_influence`
- **Equipment-focused** mission content
- **Enthusiasm** in dialogue for high influence
- **Collaborative** personal conversations
- Messages: "Dr. Chen appreciates that" / "Dr. Chen is disappointed"

### Director Netherton (Authority Figure)
- **Influence** variable: `npc_netherton_influence`
- **Strategic** mission content
- **Professional distance** that slowly softens
- **Rare vulnerability** at high influence levels
- Messages: "Director Netherton approves" / "Director Netherton is displeased"

### Haxolottle (Handler/Support)
- **Influence** variable: `npc_haxolottle_influence`
- **Real-time support** during missions
- **Humor and references** (axolotls, regeneration metaphors)
- **Trust built through** shared operational stress
- Messages: "Haxolottle likes that" / "Haxolottle seems disappointed"

---

## File Checklist

When creating a new NPC:

1. **Hub File** (`npc_hub.ink`)
   - [ ] EXTERNAL function declarations
   - [ ] `npc_conversation_entry` knot
   - [ ] `mission_hub` knot
   - [ ] INCLUDE statements for personal and mission files
   - [ ] Context-aware option routing

2. **Personal Conversations File** (`npc_ongoing_conversations.ink`)
   - [ ] PERSISTENT relationship variables
   - [ ] Phase hubs (phase_1_hub through phase_4_hub)
   - [ ] `has_available_personal_topics()` function
   - [ ] `jump_to_personal_conversations` knot
   - [ ] `conversation_end` knots with `-> mission_hub` (NO #end_conversation tag)
   - [ ] Influence tags on all relationship changes

3. **Mission-Specific Files** (optional, `npc_mission_*.ink`)
   - [ ] Mission-specific support content
   - [ ] Return to `mission_hub` after completion
   - [ ] Contextual dialogue based on mission phase
