# Ink Script Structure for Break Escape NPCs

## Ink Language Primer

Ink is a narrative scripting language designed for branching dialogues and interactive fiction. Key concepts:

- **Knots**: Major story sections (like functions)
- **Stitches**: Sub-sections within knots
- **Choices**: Player decisions that branch the story
- **Variables**: Track state and conditions
- **External Functions**: Call JavaScript from Ink
- **Tags**: Metadata for custom processing

## Break Escape Ink Conventions

### File Structure

Each scenario has one Ink file with this structure:

```ink
// ============================================================
// Break Escape: Biometric Breach NPCs
// Compiled: 2025-10-28
// ============================================================

// Global variables for tracking player progress
VAR player_entered_lab = false
VAR player_found_fingerprint = false
VAR player_unlocked_server = false
VAR relationship_alice = 0  // -10 to +10 scale
VAR trust_level = 0

// External functions that can affect game state
EXTERNAL unlock_door(door_id)
EXTERNAL give_item(item_type)
EXTERNAL show_notification(message)

// ============================================================
// NPC: Alice (Security Analyst)
// ============================================================

=== alice_intro ===
# speaker: Alice
# type: bark
# trigger: game_start
Hey! I'm Alice from security. Things are crazy here tonight.
-> alice_hub

=== alice_hub ===
# speaker: Alice
# type: conversation
// Main conversation hub - player can return here
+ [What's going on?] -> alice_explain_situation
+ [Who are you?] -> alice_introduction
+ {player_found_fingerprint} [I found a fingerprint] -> alice_fingerprint_found
+ [Goodbye] -> END

=== alice_explain_situation ===
# speaker: Alice
There's been a security breach. Someone accessed the biometrics lab.
I need your help investigating - can you check the reception area?
~ relationship_alice++
-> alice_hub

// ... more conversation branches ...
```

## Knot Naming Conventions

Format: `{npc_name}_{event_or_topic}`

**Categories:**

### 1. Intro Knots (Initial Contact)
- `alice_intro` - First message when game starts
- `bob_first_contact` - Triggered by specific event

### 2. Hub Knots (Conversation Menus)
- `alice_hub` - Main menu with all available choices
- `bob_mission_hub` - Subset menu for mission-related topics

### 3. Event-Triggered Knots (Barks)
- `alice_player_entered_lab` - Player enters specific room
- `bob_found_item_x` - Player picks up important item
- `alice_failed_minigame` - React to player failure

### 4. Topic Knots (Dialogue Trees)
- `alice_about_suspect` - Discussion about suspect
- `bob_explain_crypto` - Technical explanation

### 5. Conditional Knots (Progress-Gated)
- `alice_late_game` - Only available after certain progress
- `bob_trust_high` - Requires high relationship score

## Tag System

Tags provide metadata for the game engine to process Ink output.

### Standard Tags

```ink
=== my_knot ===
# speaker: Alice              // NPC name
# type: bark                  // bark|conversation|hint
# trigger: player_entered_lab // Game event that triggers this
# priority: high              // low|medium|high (bark queue)
# delay: 3                    // Seconds delay before showing
# once: true                  // Only trigger once
```

**Tag Meanings:**

- `speaker`: Which NPC is speaking (matches contact name)
- `type`: 
  - `bark` - Short notification during gameplay
  - `conversation` - Full phone chat dialogue
  - `hint` - Subtle clue/help message
- `trigger`: Game event name (see Event System doc)
- `priority`: Bark queue priority
- `delay`: Wait X seconds before showing
- `once`: If true, never trigger again (even on replay)

## Variables and State

### Player Progress Variables
Track what the player has done:

```ink
VAR player_entered_lab = false
VAR player_unlocked_door_reception = false
VAR player_collected_fingerprint_kit = false
VAR player_completed_lockpick_minigame = false
VAR current_room = "reception"
```

### NPC Relationship Variables
Track player's relationship with each NPC:

```ink
VAR relationship_alice = 0    // -10 (hostile) to +10 (trusted)
VAR trust_bob = 0
VAR alice_knows_player_lied = false
```

### Scenario State Variables
Track overall story progress:

```ink
VAR suspect_identified = false
VAR prototype_recovered = false
VAR mission_complete = false
VAR investigation_phase = 1  // 1, 2, 3, etc.
```

## External Functions

Ink can call JavaScript functions to affect the game:

```ink
=== alice_gives_key ===
Here, take this access card. It'll get you into the lab.
~ give_item("keycard_lab")
~ relationship_alice++
Good luck!
-> END
```

### Planned External Functions

```javascript
// Items & Inventory
EXTERNAL give_item(item_type)           // Add item to inventory
EXTERNAL remove_item(item_type)         // Remove item
EXTERNAL has_item(item_type)            // Check if player has item

// Doors & Access
EXTERNAL unlock_door(door_id)           // Unlock a specific door
EXTERNAL lock_door(door_id)             // Lock a door
EXTERNAL is_door_unlocked(door_id)      // Check door state

// UI & Notifications
EXTERNAL show_notification(message)      // Show game notification
EXTERNAL show_hint(message)             // Show subtle hint
EXTERNAL show_mission_update(message)   // Update mission objectives

// Game State Queries
EXTERNAL get_current_room()             // Returns current room ID
EXTERNAL get_game_time()                // Returns elapsed game time
EXTERNAL has_completed_minigame(type)   // Check minigame completion

// NPC State
EXTERNAL set_npc_mood(npc, mood)        // Change NPC mood
EXTERNAL get_relationship(npc)          // Get relationship value
```

## Choice Patterns

### Basic Choices
```ink
+ [Say yes] -> yes_branch
+ [Say no] -> no_branch
+ [Ask question] -> question_branch
```

### Conditional Choices (Only Show If...)
```ink
+ {player_found_evidence} [Show the evidence] -> show_evidence
+ {trust_level >= 5} [Tell the truth] -> tell_truth
+ {not suspect_identified} [Ask about suspects] -> suspects
```

### Sticky Choices (Reappear After Selection)
```ink
* [One-time choice] -> branch
+ [Repeatable choice] -> branch
```

### Fallback Choices (Always Available)
```ink
+ [Goodbye] -> END
+ [Back] -> previous_hub
```

## Dialogue Formatting

### Speaker Indication
Use tags to identify speakers:

```ink
=== conversation ===
# speaker: Alice
I need to tell you something important.
# speaker: Bob
What is it?
# speaker: Alice
The prototype is missing.
```

### Message Timing
Use special markers for message delays (chat-like pacing):

```ink
=== alice_thinking ===
# speaker: Alice
Hmm...
# wait: 1
Let me think about that.
# wait: 2
I might have an idea.
```

### Emotional Context
Use tags to indicate tone:

```ink
=== alice_worried ===
# speaker: Alice
# emotion: worried
I'm really concerned about this breach.
```

## Example: Complete NPC Conversation

```ink
// ============================================================
// NPC: Alice - Security Analyst
// ============================================================

VAR alice_met = false
VAR alice_trust = 0
VAR player_asked_about_breach = false

=== alice_initial_contact ===
# speaker: Alice
# type: bark
# trigger: game_start
# once: true
Hey! Security breach detected. I need your help ASAP.
~ alice_met = true
-> END

=== alice_hub ===
# speaker: Alice
# type: conversation
{alice_trust >= 5: You've been a huge help. What else can I do for you?}
{alice_trust < 5 and alice_trust >= 0: What do you need?}
{alice_trust < 0: I'm watching you. Make it quick.}

+ {not player_asked_about_breach} [What happened?] -> alice_explain_breach
+ {player_found_fingerprint} [I found a fingerprint] -> alice_fingerprint_reaction
+ {alice_trust >= 3} [Can you help me access the server room?] -> alice_server_access
+ [I need to go] -> alice_goodbye
-> END

=== alice_explain_breach ===
# speaker: Alice
Someone broke into the biometrics lab around 2 AM.
We need to figure out who it was and what they took.
~ player_asked_about_breach = true
~ alice_trust++
+ [How can I help?] -> alice_request_help
+ [Why me?] -> alice_explain_choice
-> alice_hub

=== alice_request_help ===
# speaker: Alice
I need you to check the reception area for fingerprints.
Use your fingerprint kit on any surfaces that look suspicious.
~ show_notification("New objective: Check reception for fingerprints")
Great! Let me know what you find.
-> alice_hub

=== alice_fingerprint_reaction ===
# speaker: Alice
{alice_trust >= 5: Excellent work! Let me analyze this.}
{alice_trust < 5: Good. Send it to the lab for analysis.}
# wait: 2
This matches someone in our database...
It's the research director!
~ alice_trust++
~ suspect_identified = true
-> alice_hub

=== alice_server_access ===
{alice_trust >= 5:
    # speaker: Alice
    Sure thing. Here's my access card.
    ~ give_item("alice_keycard")
    ~ alice_trust++
    Be careful in there!
    -> alice_hub
- else:
    # speaker: Alice
    I can't give you that kind of access yet.
    Prove yourself first.
    -> alice_hub
}

=== alice_goodbye ===
# speaker: Alice
Stay safe out there.
-> END
```

## Best Practices

1. **Keep barks short** - Max 1-2 sentences for gameplay notifications
2. **Hub pattern** - Always provide a way back to main menu
3. **Conditional variety** - Same knot should have different text based on state
4. **Meaningful choices** - Each choice should feel impactful
5. **State tracking** - Update variables to reflect player decisions
6. **Graceful endings** - Always provide a way to exit conversation
7. **Test conditionals** - Ensure all paths are reachable
8. **Comment liberally** - Explain complex logic and triggers

## Debugging Tips

### Testing Individual Knots
```ink
// Add a debug knot to jump to any section
=== DEBUG_START ===
+ [Test Alice intro] -> alice_intro
+ [Test Bob mission] -> bob_mission_start
+ [Test late game] -> alice_late_game
```

### Logging State
```ink
// Use external function to log to console
~ show_notification("Trust level: {alice_trust}")
~ show_notification("Current room: {current_room}")
```

### Commenting Out Choices
```ink
// + [Debug choice] -> test_branch
// Temporarily disabled for testing
```

## Next Steps

See `05_EXAMPLE_SCENARIO.md` for a complete working example of an NPC script for the Biometric Breach scenario.
