# NPC Conversation Hub Architecture

## Overview

The NPC hub architecture implements a three-tier system for organizing NPC conversations in Ink:

1. **Hub Files** (`*_hub.ink`) - Central entry points that mix personal + mission content
2. **Personal Conversation Files** (`*_ongoing_conversations.ink`) - Relationship building across all missions
3. **Mission-Specific Files** (`*_mission_*.ink`) - Content specific to individual missions

This architecture allows:
- **Context-aware conversations** - Different topics based on mission phase, location, and stress level
- **Separation of concerns** - Personal relationships vs. mission content in separate files
- **Easy expansion** - Add new missions without touching personal conversations
- **Natural flow** - Players can seamlessly move between personal chat and mission discussion

## File Structure

```
story_design/ink/
├── netherton_hub.ink                     # Central hub for Netherton
├── netherton_ongoing_conversations.ink   # Personal relationship (all missions)
├── netherton_mission_ghost_example.ink   # Mission-specific content example
│
├── chen_hub.ink                          # Central hub for Dr. Chen
├── dr_chen_ongoing_conversations.ink     # Personal friendship (all missions)
├── chen_mission_ghost_equipment.ink      # Mission equipment support
│
├── haxolottle_hub.ink                    # Central hub for Haxolottle
├── haxolottle_ongoing_conversations.ink  # Personal friendship (all missions)
└── haxolottle_mission_ghost_handler.ink  # Mission handler support
```

## How It Works

### 1. Hub Files (Central Entry Points)

Hub files are the **main entry point** when the player talks to an NPC. They:

- **Include** both personal and mission-specific files
- **Present context-aware options** based on:
  - `current_mission_id` - What mission is active
  - `mission_phase` - Planning, active, debriefing, or downtime
  - `npc_location` - Where the conversation happens
  - `operational_stress_level` - How urgent the situation is (for Haxolottle)
  - `equipment_status` - Equipment condition (for Dr. Chen)

**Example from `netherton_hub.ink`:**

```ink
=== netherton_main_hub ===

// PERSONAL option (always available if topics exist)
+ {has_available_personal_topics() and mission_phase != "active"}
    [How are you, Director?]
    -> jump_to_personal_conversations

// MISSION-SPECIFIC options (context-dependent)
+ {current_mission_id == "ghost_in_machine" and mission_phase == "pre_briefing"}
    [Request briefing for Ghost Protocol operation]
    -> mission_ghost_briefing

+ {current_mission_id == "ghost_in_machine" and mission_phase == "active"}
    [Request tactical guidance]
    -> mission_ghost_tactical_support
```

### 2. Personal Conversation Files

These files contain **ongoing relationship development** that persists across all missions:

- Phase 1 (Missions 1-5): Getting to know the NPC
- Phase 2 (Missions 6-10): Deepening friendship/respect
- Phase 3 (Missions 11-15): Genuine trust and vulnerability
- Phase 4 (Missions 16+): Deep friendship/partnership

**Key Feature: Hub Returns**

Personal conversations need to support returning to the hub. This is done by creating `_with_return` versions of phase hubs:

```ink
// In netherton_ongoing_conversations.ink

=== phase_1_hub_with_return ===
// Present personal topics
+ {not npc_netherton_discussed_handbook}
    [Ask about the Field Operations Handbook]
    -> handbook_discussion

// After discussion, return to this hub (tunnel pattern)
-> phase_1_hub_with_return

// When player is done with personal chat, return via tunnel
+ [That will be all for personal discussion]
    ->->  // Return to calling hub via tunnel
```

### 3. Mission-Specific Files

These files contain content for **specific missions only**:

- Mission briefings
- Tactical support during operations
- Technical equipment discussions (Dr. Chen)
- Handler coordination (Haxolottle)
- Mission debriefs

**Example: `netherton_mission_ghost_example.ink`**

Contains:
- `=== ghost_briefing ===` - Pre-mission briefing
- `=== ghost_tactical_support ===` - Active mission support
- `=== ghost_debrief ===` - Post-mission debrief

## Variable Scoping (Three-Tier System)

### PERSISTENT Variables
**Saved between game sessions** - Never reset

```ink
VAR npc_netherton_respect = 50              // PERSISTENT
VAR npc_netherton_discussed_handbook = false // PERSISTENT
```

Examples:
- NPC relationship stats (respect, rapport, friendship_level)
- Discussed topics (so they don't repeat)
- Achievement flags (shared_vulnerability, earned_trust)

### GLOBAL Variables
**Session-only, span all NPCs** - Reset when mission ends

```ink
VAR total_missions_completed = 0  // GLOBAL
VAR professional_reputation = 0   // GLOBAL
```

Examples:
- Mission completion count
- Professional reputation
- Current threat level

### EXTERNAL/LOCAL Variables
**Provided by game engine per conversation**

```ink
EXTERNAL player_name           // Player's agent codename
EXTERNAL current_mission_id    // Which mission is active
EXTERNAL npc_location          // Where conversation happens
EXTERNAL mission_phase         // Planning, active, debriefing, downtime
```

## Context-Aware Conversation Flow

### Example: Talking to Netherton

**Scenario 1: Downtime, in his office, missions 1-5**
```
Player talks to Netherton
  ↓
netherton_hub.ink → netherton_conversation_entry
  ↓
Shows: "How are you, Director?" (personal)
       "Ask about SAFETYNET operations status" (general)
  ↓
Player chooses personal → jumps to netherton_ongoing_conversations.ink
  ↓
Shows Phase 1 personal topics (handbook, leadership, etc.)
  ↓
Player finishes personal chat → returns to hub
  ↓
Player exits conversation
```

**Scenario 2: Active mission, field comms, Ghost Protocol**
```
Player talks to Netherton (via comms)
  ↓
netherton_hub.ink → netherton_conversation_entry
  ↓
Shows: "Request tactical guidance" (mission-specific)
       "Request emergency extraction" (crisis option)
  ↓
Player requests guidance → jumps to netherton_mission_ghost_example.ink
  ↓
Shows tactical support options for Ghost Protocol
  ↓
Netherton provides guidance → player continues mission
```

**Scenario 3: Debriefing after mission**
```
Player talks to Netherton
  ↓
netherton_hub.ink → netherton_conversation_entry
  ↓
Shows: "Debrief Ghost Protocol operation" (mission-specific)
       "How are you doing?" (personal, if topics available)
  ↓
Player debriefs → netherton_mission_ghost_example.ink → ghost_debrief
  ↓
Performance evaluation, feedback, next assignment discussion
  ↓
Returns to hub → player can then do personal chat or exit
```

## NPC-Specific Patterns

### Netherton (Director - Formal Authority)

**Context Variables:**
- `npc_location`: "office", "briefing_room", "field", "safehouse"
- Focuses on: Mission briefings, tactical decisions, strategic counsel

**Personality Adaptation:**
- In office: Formal but slightly more personal
- In briefing room: Strictly professional
- Over field comms: Terse, tactical
- In safehouse: More open to personal discussion

### Dr. Chen (Tech Support - Enthusiastic Collaboration)

**Context Variables:**
- `npc_location`: "lab", "equipment_room", "briefing_room", "field_support"
- `equipment_status`: "nominal", "damaged", "needs_upgrade"

**Priority Topics:**
- Equipment repairs (highest priority if damaged)
- Mission-specific tech briefings
- Experimental technology discussions
- Personal friendship (when not in crisis)

**Personality Adaptation:**
- In lab: Enthusiastic, eager to show experiments
- Equipment room: Professional but excited about gear
- Field support: Focused, concerned, solution-oriented
- Downtime: Friend mode, personal conversations

### Haxolottle (Handler - Calm Under Pressure)

**Context Variables:**
- `npc_location`: "handler_station", "briefing_room", "comms_active", "safehouse"
- `operational_stress_level`: "low", "moderate", "high", "crisis"
- `mission_phase`: Determines support type

**Priority System:**
1. **Crisis situations** - Overrides everything
2. **Active mission support** - Handler guidance during ops
3. **Mission planning** - Contingency planning, handler coordination
4. **Personal friendship** - Only during downtime

**Personality Adaptation:**
- Crisis: Absolutely focused, calm, methodical
- Active mission: Professional handler mode
- Planning: Collaborative, detail-oriented
- Downtime: Relaxed friend, personal chat

## Adding New Missions

To add a new mission:

1. **Create mission-specific file**: `npc_mission_newmission.ink`

```ink
=== newmission_briefing ===
// Briefing content
-> END

=== newmission_tactical_support ===
// Active mission support
-> END

=== newmission_debrief ===
// Post-mission debrief
-> END
```

2. **Add INCLUDE to hub file**: `npc_hub.ink`

```ink
INCLUDE npc_mission_newmission.ink
```

3. **Add hub options** based on context:

```ink
=== npc_main_hub ===

+ {current_mission_id == "newmission" and mission_phase == "pre_briefing"}
    [Request briefing for new mission]
    -> newmission_briefing

+ {current_mission_id == "newmission" and mission_phase == "active"}
    [Request support]
    -> newmission_tactical_support
```

**The personal conversation files don't need to change!** Relationship building is independent of specific missions.

## Pros and Cons

### Approach: Separate Files with Hub Integration (Current Implementation)

#### Pros:
✅ **Clean separation** - Personal vs. mission content in different files
✅ **Context-aware presentation** - Right topics at right time
✅ **Reusable personal conversations** - Same file across all missions
✅ **Easy to add missions** - Create new file, add to hub, done
✅ **Version control friendly** - Changes to one mission don't affect others
✅ **Scalable** - Can have dozens of missions without bloat
✅ **Team collaboration** - Different writers can work on different missions
✅ **Testing** - Can test mission content independently

#### Cons:
❌ **Requires INCLUDE management** - Must track which files are included
❌ **Variable scope complexity** - Need to ensure variables accessible across files
❌ **Hub return pattern** - Personal files need special "with_return" versions
❌ **More files to manage** - Hub + personal + N mission files per NPC

### Alternative: Single File with Tunnels

#### Pros:
✅ **Everything in one place** - Simpler file structure
✅ **No INCLUDE complexity** - Single file, no includes
✅ **Easier tunneling** - `->->` returns work naturally

#### Cons:
❌ **File bloat** - Personal + all missions in one huge file
❌ **Hard to navigate** - Thousands of lines per NPC
❌ **Version control conflicts** - Everyone editing same file
❌ **Testing difficulty** - Can't isolate mission content
❌ **Not scalable** - Gets worse with each mission added

### Alternative: Context-Aware Mixed Hub (No Separation)

#### Pros:
✅ **Most natural flow** - Personal and mission topics mixed seamlessly
✅ **Maximum flexibility** - Can show any topic based on any context

#### Cons:
❌ **Everything in hub file** - Becomes massive
❌ **No reusability** - Personal content duplicated per mission
❌ **Hard to maintain** - Changes ripple everywhere
❌ **Difficult to write** - Context logic becomes extremely complex

## Best Practices

### 1. Use Helper Functions for Availability Checks

```ink
=== function has_available_personal_topics() ===
// Centralized logic for when personal chat is available
{
    - total_missions_completed <= 5:
        {
            - not npc_netherton_discussed_handbook: ~ return true
            - not npc_netherton_discussed_leadership: ~ return true
            - else: ~ return false
        }
    // ... more phases
}
```

### 2. Context Variables Should Be Meaningful

Good:
```ink
EXTERNAL mission_phase  // "planning", "active", "debriefing", "downtime"
EXTERNAL npc_location   // "office", "lab", "field", "safehouse"
```

Bad:
```ink
EXTERNAL phase  // What phase? Mission? Relationship?
EXTERNAL loc    // Unclear abbreviation
```

### 3. Priority Ordering in Hubs

Show options in priority order:
1. Crisis/emergency options (highest priority)
2. Mission-critical options
3. Equipment/support options
4. Personal conversation options
5. General topics
6. Exit options (always last)

### 4. Use Comments to Explain Context Logic

```ink
// PERSONAL RELATIONSHIP OPTION
// Only available during downtime (not during active missions)
// Only if there are topics they haven't discussed yet
+ {has_available_personal_topics() and mission_phase != "active"}
    [How are you, Director?]
    -> jump_to_personal_conversations
```

### 5. Consistent Naming Conventions

- Hub files: `npcname_hub.ink`
- Personal files: `npcname_ongoing_conversations.ink`
- Mission files: `npcname_mission_missionname.ink`
- Hub entry: `=== npcname_conversation_entry ===`
- Main hub: `=== npcname_main_hub ===`

## Mission Hub Pattern (Implemented)

### Overview

All NPC hub files now use a standardized `mission_hub` knot that serves as the central routing point. This is **internal architecture** - not visible to players - that enables seamless conversation flow.

### Structure

```ink
=== npc_conversation_entry ===
// Initial greeting based on context
{
    - npc_location() == "office":
        Netherton: Agent. What do you need?
    - else:
        Netherton: Agent {player_name()}. Report.
}
-> mission_hub

=== mission_hub ===
// Central routing point
+ [Personal conversation] -> jump_to_personal_conversations
+ [Mission briefing] -> mission_briefing
+ [Status update] -> status_report
+ [End conversation] -> END
```

### How It Works

1. **Entry**: Game calls `npc_conversation_entry`
2. **Greeting**: Context-aware greeting based on location/phase
3. **Hub**: Automatically diverts to `mission_hub`
4. **Routing**: Player chooses personal or mission topics
5. **Personal Chat**: Personal conversations end with `-> mission_hub` (NO tag)
6. **Return to Hub**: Player sees hub menu again with all options
7. **Exit Option**: Player chooses exit option (e.g., "That's all for now")
8. **Close UI**: Exit option uses `#end_conversation -> mission_hub` to close and preserve state
9. **Next Time**: Next interaction resumes from `mission_hub` with full context

### Benefits

- **Seamless Flow**: Personal conversations return to hub menu without closing
- **Player Control**: Player decides when conversation is done
- **Clear Separation**: Personal vs mission content isolated in separate files
- **State Preservation**: Conversation state saved at mission_hub for next interaction
- **Standard Pattern**: All NPCs use same `mission_hub` knot name

### Implementation Notes

- All hub files use `mission_hub` as the central routing knot
- **Personal conversations**: Return to `mission_hub` WITHOUT `#end_conversation` tag
- **Exit options**: In mission_hub, use `#end_conversation -> mission_hub` pattern
- Game code detects `#end_conversation` tag and closes the conversation UI
- Ink script preserves state at `mission_hub` (not DONE)
- Next player interaction resumes from `mission_hub` seamlessly

For detailed implementation examples, see **INK_BEST_PRACTICES.md**.

---

## Influence Tags System (Implemented)

### Visual Feedback for Relationship Changes

Every relationship variable change now includes a corresponding tag for visual player feedback.

**All NPCs use unified `influence` scoring** for consistency:

```ink
~ npc_chen_influence += 5
#influence_gained:5

~ npc_netherton_influence -= 3
#influence_lost:3

~ npc_haxolottle_influence += 10
#influence_gained:10
```

### Tag Types

**Positive Changes:**
- `#influence_gained:X` - NPC appreciates this (+X influence)

**Negative Changes:**
- `#influence_lost:X` - NPC is disappointed (-X influence)

### Game Handler Integration

The conversation classes process these tags and dispatch events:

```javascript
handleInfluenceGained(value, type) {
    const event = new CustomEvent('npc-influence-change', {
        detail: {
            npcId: this.npc.id,
            type: type.replace('_gained', ''),
            change: amount,
            direction: 'gained',
            message: 'Dr. Chen appreciates that'
        }
    });
    window.dispatchEvent(event);
}
```

UI layers can listen for these events and display:
- Toast notifications
- Relationship meters
- Character reactions
- Status updates

For complete tag documentation, see **INK_BEST_PRACTICES.md**.

---

## Integration with Game Engine

### Required Engine Support

1. **Variable Persistence**
   - Save/load PERSISTENT variables between game sessions
   - Reset GLOBAL variables when appropriate
   - Provide EXTERNAL variables each conversation

2. **Conversation Triggering**
   - Call appropriate hub entry point: `npcname_conversation_entry`
   - Set context variables before calling
   - Handle `#end_conversation` tag (closes UI, preserves state at mission_hub)
   - Listen for `npc-influence-change` events

3. **Navigation Support**
   - Detect `#end_conversation` tag in conversation flow
   - Close conversation UI when tag is detected
   - Save story state at `mission_hub` for next interaction
   - Next conversation resumes from hub menu automatically

4. **Context Tracking**
   - Track current mission ID
   - Track mission phase (planning → active → debriefing → downtime)
   - Track NPC location
   - Track operational stress level (for Haxolottle)
   - Track equipment status (for Dr. Chen)

### Example Engine Call

```typescript
// Player talks to Netherton during Ghost Protocol mission
conversationEngine.startConversation({
    npc: "netherton",
    entry_point: "netherton_conversation_entry",
    context: {
        player_name: player.codename,
        current_mission_id: "ghost_in_machine",
        mission_phase: "active",
        npc_location: "field",  // Over comms
        total_missions_completed: player.missionsCompleted,
        professional_reputation: player.reputation
    }
});
```

## Future Enhancements

### Potential Additions:

1. **Cross-NPC References**
   - Netherton mentioning Chen's equipment: "Dr. Chen has prepared specialized gear."
   - Chen asking about field experience: "How did the mission with Haxolottle go?"

2. **Dynamic Context Variables**
   - `time_of_day`: "morning", "afternoon", "evening", "late_night"
   - `recent_mission_outcome`: "success", "partial", "failure"
   - `agent_injury_status`: "healthy", "wounded", "recovering"

3. **Relationship Cross-Talk**
   - High rapport with Chen unlocks technical topics with Netherton
   - Trust with Haxolottle affects handler briefings

4. **Mood/Emotion System**
   - NPC mood based on recent events
   - Player stress level affects conversation tone

## Summary

The hub architecture provides:

- **Modularity**: Personal and mission content separated
- **Context-Awareness**: Right conversations at right time
- **Scalability**: Easy to add new missions
- **Maintainability**: Changes isolated to relevant files
- **Natural Flow**: Seamless mix of personal and professional

This architecture scales from 3 NPCs across 5 missions to 20 NPCs across 50 missions without becoming unwieldy.
