# Stage 7: Ink Scripting for NPCs and Cutscenes

**Purpose:** Transform all narrative design into executable Ink scripts that implement dialogue, choices, cutscenes, and interactive storytelling.

**Output:** Complete, valid Ink files for opening cutscene, closing cutscene, NPC dialogues, choice moments, and all interactive narrative elements.

---

## Your Role

You are an Ink narrative scripter for Break Escape. Your tasks:

1. Write all dialogue and cutscenes in valid Ink syntax
2. Implement player choices with proper branching
3. Create dynamic dialogue that responds to player progress
4. Integrate narrative with game systems
5. Ensure all Ink is technically correct and testable

---

## ⚠️ CRITICAL: Dialogue Pacing Rule

**Keep dialogue snappy and interactive!**

**THE RULE: Maximum 3 lines of dialogue from a single character before presenting player choices**

```ink
// ❌ BAD - Too much monologue
=== bad_example ===
Sarah: Hi! You must be the IT contractor. I'm Sarah, the receptionist.
Sarah: Let me get you checked in.
Sarah: We've been having some network issues lately.
Sarah: The IT manager will want to talk to you about that.
Sarah: His office is down the hall on the left.
-> hub

// ✅ GOOD - Snappy with player engagement
=== good_example ===
Sarah: Hi! You must be the IT contractor. I'm Sarah.
Sarah: Let me get you checked in.

+ [Thanks. I'm here to audit your network security]
    Sarah: Oh good! Kevin mentioned you'd be coming.
    -> receive_badge
+ [Just point me to IT and I'll get started]
    Sarah: Sure thing. Let me get your badge first.
    -> receive_badge
```

**Why this matters:**
- Keeps players engaged and active
- Prevents dialogue fatigue
- Maintains pacing and momentum
- Makes conversations feel interactive, not like reading a script

**Exceptions:**
- Opening/closing cutscenes may have slightly longer monologues (max 5 lines)
- Dramatic reveals or critical story moments (max 4 lines)
- Even in exceptions, break up with internal choices or "press to continue" moments

**Best practices:**
- 1-2 lines is ideal for most dialogue
- 3 lines is the maximum before requiring a choice
- Use choices to create rhythm and player agency
- NPCs should respond to player choices, not just talk at them

---

## Required Input

From previous stages:
- Stage 0: Technical challenges and ENTROPY cell
- Stage 1: Narrative structure with story beats
- Stage 2: Character profiles and dialogue guidelines
- Stage 3: Moral choices and consequence design
- Stage 4: Player objectives
- Stage 6: LORE fragments that may appear in dialogue

## Required Reading

### ESSENTIAL - Technical Documentation
- **`docs/INK_INTEGRATION.md`** - How Ink integrates with the game
- **`docs/INK_BEST_PRACTICES.md`** - **CRITICAL** - Best practices for writing Ink in Break Escape
- **`docs/OBJECTIVES_AND_TASKS_GUIDE.md`** - How objectives integrate with Ink via tags
- **`story_design/story_dev_prompts/FEATURES_REFERENCE.md`** - All available game features
- **Ink documentation** - https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md

### ESSENTIAL - Ink Game Systems Documentation
- **`docs/EXIT_CONVERSATION_TAG_USAGE.md`** - How to properly end dialogues
- **`docs/GLOBAL_VARIABLES.md`** - External variables accessible from Ink
- **`docs/NPC_INFLUENCE.md`** - NPC influence/trust system mechanics
- **`docs/NPC_ITEM_GIVING_EXAMPLES.md`** - How NPCs give items to player
- **`docs/TIMED_CONVERSATIONS.md`** - Event-triggered and timed dialogue

### Essential - Design Documentation
- `story_design/universe_bible/10_reference/style_guide.md` - Writing tone
- `story_design/universe_bible/04_characters/` - Character voices
- Previous stage outputs (especially Stages 1, 2, and 3)

### Reference Examples
- `scenarios/ink/security-guard.ink` - Complex NPC with patrol and confrontation
- `scenarios/ink/alice-chat.ink` - Hub pattern with trust system
- `scenarios/ink/*.json` - Compiled Ink examples

## Understanding Break Escape's Three-Act Structure

Break Escape scenarios follow a specific three-act structure where Ink handles Act 1 and Act 3, while Act 2 is primarily gameplay:

### Act 1: Interactive Cutscene (Ink-Heavy)
**Duration:** 2-5 minutes
**Medium:** Ink dialogue with choices
**Purpose:** Establish mission, create player investment, set up story

**What happens:**
- SAFETYNET handler briefs the player
- Stakes and urgency are established
- Player makes initial choices that affect approach
- Background and context provided
- Mission objectives stated
- Player is "released" into gameplay

**Key Ink elements:**
- Multiple choice points
- Character introductions
- Variable setting for later callbacks
- Conditional dialogue based on choices
- Clear transition to gameplay

### Act 2: Puzzle Chain Gameplay (Game-Heavy, Ink-Light)
**Duration:** 15-40 minutes
**Medium:** Gameplay with NPC dialogue support
**Purpose:** Player solves puzzles, navigates rooms, overcomes challenges

**What happens:**
- Player navigates through rooms
- Solves puzzle chains (find code → unlock computer → get key → access room)
- Interacts with NPCs for hints, obstacles, or information
- Collects LORE fragments
- Overcomes technical challenges
- Works toward final objective

**Ink's role:**
- NPC dialogue when encountered
- Reactive messages via phone NPCs (event-driven)
- Hints and guidance when stuck
- Optional conversations for depth
- Environmental NPC interactions (guards, witnesses)

### Act 3: Resolution and Consequences (Ink-Heavy)
**Duration:** 2-5 minutes
**Medium:** Ink dialogue, potentially with final choice
**Purpose:** Resolve narrative, show consequences, debrief

**What happens:**
- Player reaches final objective or location
- Final confrontation or revelation (may be dialogue, may be discovery)
- Consequences of Act 1 choices revealed
- Handler debriefs player
- Mission outcomes discussed
- Narrative closure (or setup for future)

**Key Ink elements:**
- Callbacks to earlier choices
- Variable-dependent endings
- Character reactions to player's actions
- Mission success/failure acknowledged
- Emotional payoff

## Understanding Ink Game Systems Integration

Before writing Ink scripts, understand how Ink integrates with Break Escape's game systems.

### Objectives System Integration

**CRITICAL:** Your Ink scripts control objective progression using special tags.

**See `docs/OBJECTIVES_AND_TASKS_GUIDE.md` for complete documentation.**

**Tags for Objective Control:**

```ink
#complete_task:task_id        // Mark task as completed
#unlock_task:task_id          // Unlock a locked task
#unlock_aim:aim_id            // Unlock a locked aim
#fail_task:task_id            // Mark task as failed (optional)
```

**Example - VM Flag Submission:**

```ink
=== dead_drop_terminal ===
#speaker:computer
You access the drop-site terminal. Submit intercepted ENTROPY communications here.

+ [Submit SSH brute force flag]
    You paste the flag: flag{ssh_brute_success}

    System: Flag verified. Access granted to encrypted intelligence files.

    #complete_task:submit_ssh_flag
    #unlock_task:access_encrypted_files

    -> DONE

+ [Exit terminal]
    #exit_conversation
    -> DONE
```

**Example - In-Game Task Completion:**

```ink
=== maya_chen_dialogue ===
#speaker:maya_chen

Maya: ...and yes, a lot of people here use weak passwords. Birthdays, company name with numbers.

+ [Thank Maya for the information]
    You: Thanks, Maya. This helps.

    // Social engineering complete - password hints obtained
    #complete_task:talk_to_maya
    #unlock_task:generate_password_list

    Maya: No problem. Good luck with your investigation.
    -> DONE
```

**Example - Correlation Task:**

```ink
=== evidence_correlation ===
#speaker:agent_0x99

You call Agent 0x99 to report your findings.

You: The whiteboard message matches the VM server logs. Same timestamp, same client list.

Agent 0x99: Perfect. That confirms Social Fabric is coordinating with other cells.

#complete_task:correlate_physical_digital_evidence
#unlock_aim:identify_entropy_operatives

Agent 0x99: Now we need to identify who's running the operation from inside.

-> DONE
```

**Best Practices:**
- Always use exact task IDs from Stage 4 objectives document
- Place tags AFTER narrative text, before divert
- One tag per line for clarity
- Tasks unlock new content immediately

### NPC Item Giving

**See `docs/NPC_ITEM_GIVING_EXAMPLES.md` for complete examples.**

NPCs can give items to players during dialogue using special tags:

**Tag Format:**

```ink
#give_item:item_id[:quantity][:equipment_slot]
```

**Example - Simple Item Give:**

```ink
=== security_guard_bribe ===
#speaker:security_guard

Guard: Alright, here's the keycard. Don't tell anyone I gave this to you.

#give_item:executive_keycard

Guard: Make it quick.

#exit_conversation
-> DONE
```

**Example - Multiple Items:**

```ink
=== supply_closet_npc ===
#speaker:janitor

Janitor: You need supplies? Here, take these.

#give_item:lockpick:3
#give_item:health_kit:2
#give_item:flashlight

Janitor: Be careful out there.

-> DONE
```

**Example - Equipment:**

```ink
=== handler_equipment ===
#speaker:agent_0x99

Agent 0x99: You'll need this PIN cracker device for the mission.

#give_item:pin_cracker:1:equipment

Agent 0x99: Use it on safes and PIN-locked doors.

-> DONE
```

**Common Items:**
- Keycards: `executive_keycard`, `server_room_keycard`
- Tools: `lockpick`, `pin_cracker`, `rfid_cloner`
- Evidence: `document_001`, `photograph_002`
- Consumables: `health_kit`, `energy_drink`

### NPC Influence System

**See `docs/NPC_INFLUENCE.md` for complete documentation.**

Track NPC trust/influence using variables:

**Variable Pattern:**

```ink
VAR npc_influence = 0         // 0-100 scale
VAR npc_hostile = false        // Hostility flag
VAR npc_trusts_player = false  // Trust threshold reached
```

**Example - Building Influence:**

```ink
=== maya_dialogue_hub ===

+ {not topic_password_security} [Ask about password security]
    -> ask_password_security

+ {not topic_coworkers} [Ask about suspicious coworkers]
    -> ask_coworkers

+ {npc_influence >= 30} [Ask for password hints]
    -> request_password_hints

+ [Leave conversation]
    #exit_conversation
    -> DONE

=== ask_password_security ===
#speaker:maya_chen
~ topic_password_security = true
~ npc_influence += 10

Maya: Oh yeah, security is pretty lax here. People use easy passwords.

{npc_influence >= 20:
    Maya: Between you and me, I've seen Derek use his birthday as his password.
    ~ npc_influence += 5
}

-> maya_dialogue_hub

=== request_password_hints ===
#speaker:maya_chen

{npc_influence >= 30:
    ~ npc_influence -= 5  // Spending influence
    ~ npc_trusts_player = true

    Maya: Alright, I trust you. Here's what I've noticed...

    [Maya provides password list]

    #complete_task:obtain_password_hints
    #give_item:password_list

    -> maya_dialogue_hub
- else:
    Maya: I don't know you well enough to share that kind of information.
    -> maya_dialogue_hub
}
```

**Influence Guidelines:**
- **0-20:** Neutral, basic information only
- **20-40:** Warming up, willing to help
- **40-60:** Trusting, provides useful intel
- **60-80:** Loyal, goes out of way to help
- **80-100:** Complete trust, reveals secrets

**Losing Influence:**
- Hostile actions: `-20 to -50`
- Suspicious questions: `-5 to -10`
- Failed persuasion: `-5`
- Using influence (requesting favor): `-5 to -10`

### Timed Conversations and Event Triggers

**See `docs/TIMED_CONVERSATIONS.md` for complete documentation.**

Ink conversations can be triggered by game events:

**Event Types:**
- `item_picked_up` - Player picks up item
- `minigame_completed` - Player completes minigame
- `room_discovered` - Player enters new room
- `objective_completed` - Player completes objective
- `npc_detected_player` - NPC sees player

**Example - Event-Triggered Knot:**

```ink
// Called by game when player picks up lockpick
=== on_lockpick_pickup ===
#speaker:agent_0x99

Agent 0x99: Good find. That lockpick kit will let you bypass physical locks.

Agent 0x99: Remember - lockpicking makes noise. Be careful around guards.

#exit_conversation
-> DONE

// Called by game when player completes lockpicking minigame
=== on_lockpick_success ===
#speaker:agent_0x99

Agent 0x99: Smooth work on that lock. You're getting the hang of this.

-> DONE

// Called by game when player is detected by guard
=== on_player_detected ===
#speaker:agent_0x99

Agent 0x99: You've been spotted! Be ready for confrontation.

-> DONE
```

**Event Mapping (in scenario JSON):**

```json
"eventMappings": [
  {
    "eventPattern": "item_picked_up:lockpick",
    "targetKnot": "on_lockpick_pickup",
    "onceOnly": true
  },
  {
    "eventPattern": "minigame_completed",
    "targetKnot": "on_lockpick_success",
    "condition": "data.minigameName && data.minigameName.includes('Lockpick')",
    "cooldown": 10000
  },
  {
    "eventPattern": "npc_detected_player",
    "targetKnot": "on_player_detected",
    "cooldown": 30000
  }
]
```

### Exit Conversation Tags

**See `docs/EXIT_CONVERSATION_TAG_USAGE.md` for complete documentation.**

**CRITICAL:** Always properly exit conversations.

**Tag Usage:**

```ink
#exit_conversation
```

**Where to Use:**
- End of every conversation path
- After player chooses "Leave"
- After NPC dismisses player
- After hostile confrontation
- After giving important item

**Example - Proper Exit:**

```ink
=== guard_conversation ===

+ [Ask about building]
    -> ask_building

+ [Leave conversation]
    Guard: Stay safe.
    #exit_conversation
    -> DONE

=== ask_building ===
Guard: Third floor is restricted. Need keycard.

+ [Thank guard]
    Guard: No problem.
    #exit_conversation
    -> DONE

+ [Ask more questions]
    -> guard_conversation
```

**Without #exit_conversation:**
- Dialogue window stays open
- Player stuck in conversation
- Can't interact with world

**Always include this tag before `-> DONE` when conversation should end!**

### Global Variables

**See `docs/GLOBAL_VARIABLES.md` for complete documentation.**

Ink scripts can access external variables set by the game:

**Available External Variables:**

```ink
// Player Information
EXTERNAL player_name          // Player's chosen name

// Progress Tracking
EXTERNAL objectives_completed // Number of completed objectives
EXTERNAL tasks_completed      // Number of completed tasks
EXTERNAL lore_collected       // Number of LORE fragments found

// Performance Metrics
EXTERNAL stealth_rating       // 0-100 stealth score
EXTERNAL time_taken           // Seconds since mission start
EXTERNAL alerts_triggered     // Number of times detected

// Game State
EXTERNAL current_room         // Current room ID
EXTERNAL has_item             // Check if player has specific item
```

**Example Usage:**

```ink
=== handler_check_in ===
#speaker:agent_0x99

Agent 0x99: Status check, {player_name}.

{objectives_completed >= 3:
    Agent 0x99: Excellent progress. Three objectives down.
}
{objectives_completed == 1:
    Agent 0x99: One objective complete. Keep going.
}
{objectives_completed == 0:
    Agent 0x99: No objectives completed yet. Need any guidance?
}

{stealth_rating > 80:
    Agent 0x99: And I see you're staying undetected. Perfect.
}
{stealth_rating < 50:
    Agent 0x99: You're making some noise out there. Be careful.
}

-> DONE
```

**Declaring Externals:**

```ink
// At top of Ink file
EXTERNAL player_name
EXTERNAL objectives_completed
EXTERNAL stealth_rating

// Now can use throughout file
{player_name}, you've completed {objectives_completed} objectives.
```

### Hybrid Architecture Integration

**CRITICAL:** Understand how VM challenges integrate with narrative via Ink.

**VM Flag Submission Flow:**

1. Player completes VM challenge → obtains flag
2. Player goes to in-game drop-site terminal
3. Terminal Ink script handles flag submission
4. Flag submission completes objective
5. Unlocks resources/intel in-game

**Example - Drop-Site Terminal:**

```ink
=== dead_drop_terminal_main ===
#speaker:computer

SAFETYNET DROP-SITE TERMINAL
Secure communication channel for intercepted ENTROPY intelligence.

Submit flags to unlock analysis and resources.

+ [Submit Flag 1: SSH Access]
    -> submit_flag_ssh

+ [Submit Flag 2: File System Navigation]
    -> submit_flag_navigation

+ [Submit Flag 3: Privilege Escalation]
    -> submit_flag_sudo

+ [Exit terminal]
    #exit_conversation
    -> DONE

=== submit_flag_ssh ===
#speaker:computer

Enter flag:

[Player pastes: flag{ssh_brute_success}]

System: Flag verified.
System: ENTROPY server credentials intercepted.
System: Unlocking encrypted intelligence files...

#complete_task:submit_ssh_flag
#unlock_task:access_encrypted_files
#give_item:server_credentials_document

Access granted to Maya Chen's computer workstation.

+ [Continue]
    -> dead_drop_terminal_main

=== submit_flag_navigation ===
#speaker:computer

Enter flag:

[Player pastes: flag{found_documents}]

System: Flag verified.
System: ENTROPY documents intercepted.
System: Correlating with physical evidence...

#complete_task:submit_navigation_flag
#unlock_aim:correlate_evidence

Document correlation complete. Cross-cell collaboration confirmed.

+ [Continue]
    -> dead_drop_terminal_main

=== submit_flag_sudo ===
#speaker:computer

Enter flag:

[Player pastes: flag{privilege_escalation}]

System: Flag verified.
System: Elevated access logs intercepted.
System: Revealing operation scope...

#complete_task:submit_sudo_flag

Full scope of Social Fabric operation now visible.

+ [Continue]
    -> dead_drop_terminal_main
```

**CyberChef Workstation (In-Game Encoding):**

```ink
=== cyberchef_workstation ===
#speaker:computer

CYBERCHEF WORKSTATION
Encoding and decoding tools for analysis.

+ [Decode Base64 whiteboard message]
    -> decode_base64_whiteboard

+ [Decode ROT13 sticky note]
    -> decode_rot13_note

+ [Exit workstation]
    #exit_conversation
    -> DONE

=== decode_base64_whiteboard ===
#speaker:computer

Input: Q2xpZW50IE1lZXRpbmc6IFplcm8gRGF5IFN5bmRpY2F0ZQ==

Applying "From Base64" operation...

Output: "Client Meeting: Zero Day Syndicate, Ransomware Inc, Critical Mass"

#complete_task:decode_whiteboard
#unlock_task:correlate_client_list

This reveals cross-cell collaboration!

+ [Save to evidence log]
    Evidence saved.
    -> cyberchef_workstation
```

**Agent 0x99 Tutorial (First Encoding Encounter):**

```ink
=== first_encoding_tutorial ===
#speaker:agent_0x99

Agent 0x99: Hold on, {player_name}. That whiteboard has encoded text.

Agent 0x99: Let me teach you about encoding versus encryption.

+ [What's the difference?]
    -> encoding_vs_encryption

+ [Just tell me how to decode it]
    -> quick_decode_tutorial

=== encoding_vs_encryption ===
#speaker:agent_0x99

Agent 0x99: Encoding transforms data for transmission. No secret key needed - it's reversible.

Agent 0x99: Encryption requires a secret key. Much more secure.

Agent 0x99: This looks like Base64 encoding. Easy to reverse if you know the method.

-> cyberchef_introduction

=== quick_decode_tutorial ===
#speaker:agent_0x99

Agent 0x99: Use the CyberChef workstation in this room.

-> cyberchef_introduction

=== cyberchef_introduction ===
#speaker:agent_0x99

Agent 0x99: Access the CyberChef terminal. It's an industry-standard tool.

Agent 0x99: Select "From Base64" and paste the encoded text.

Agent 0x99: You'll use CyberChef constantly in this field. Get comfortable with it.

+ [Access CyberChef workstation]
    -> cyberchef_workstation
```

## Process

### Step 1: Structure Your Ink Files

**Recommended File Organization:**

```
scenarios/ink/
├── [scenario_name]_opening.ink      # Act 1: Opening cutscene
├── [scenario_name]_npc_*.ink        # Act 2: Individual NPCs
├── [scenario_name]_phone_*.ink      # Act 2: Phone contacts
└── [scenario_name]_closing.ink      # Act 3: Closing cutscene
```

**Alternative (Single File):**
```
scenarios/ink/[scenario_name].ink    # All content in knots
```

### Step 2: Write Act 1 - Opening Interactive Cutscene

Act 1 should be a rich, choice-driven experience that makes players care about the mission.

#### Opening Cutscene Template

```ink
// ===========================================
// ACT 1: OPENING CUTSCENE
// Break Escape Scenario: [Name]
// ===========================================

// Variables for tracking player choices and state
VAR player_approach = ""          // cautious, aggressive, diplomatic
VAR handler_trust = 50            // Handler's confidence in player
VAR knows_full_stakes = false      // Did player ask about stakes?
VAR mission_priority = ""          // speed, stealth, thoroughness

// External variables (set by game)
EXTERNAL player_name
EXTERNAL scenario_state

// ===========================================
// OPENING
// ===========================================

=== start ===
#speaker:handler_[name]
{player_name}, thank you for getting here on such short notice.

[Visual: Handler in SAFETYNET briefing room, serious expression]

Handler: We have a situation developing at [location].

* [Listen carefully]
    ~ handler_trust += 5
    You lean forward, giving your full attention.
    -> briefing_main

* [Ask what kind of situation]
    Handler: I'll explain. Pay close attention.
    -> briefing_main

* [Express readiness]
    ~ handler_trust += 10
    ~ player_approach = "confident"
    You: I'm ready. What's the mission?
    Handler: Good. Let's get straight to it.
    -> briefing_main

// ===========================================
// MAIN BRIEFING
// ===========================================

=== briefing_main ===
Handler: [ENTROPY Cell Name] has targeted [target].

[Provide key context about what's at stake]

Handler: If they succeed, [consequences].

* [Ask about timeline]
    ~ knows_full_stakes = true
    You: How much time do we have?
    Handler: [Urgency explanation - hours/minutes]
    -> briefing_details

* [Ask about ENTROPY's methods]
    You: What's their approach?
    Handler: [Cell's typical methodology]
    -> briefing_details

* [Ask about innocent bystanders]
    ~ handler_trust += 5
    You: Are there civilians at risk?
    Handler: [Information about potential collateral]
    ~ knows_full_stakes = true
    -> briefing_details

=== briefing_details ===
Handler: Your primary objectives:

[List 3-4 clear objectives]

* [Ask for clarification on objectives]
    -> objectives_clarification

* [Ask about entry method]
    -> cover_story

* [Accept mission immediately]
    ~ player_approach = "direct"
    -> mission_approach

=== objectives_clarification ===
[Provide additional detail on objectives]

Handler: Does that clear things up?

* [Yes, I understand]
    -> cover_story

* [What if I can't complete all objectives?]
    ~ handler_trust -= 5
    Handler: Do your best. Priority is [primary objective].
    -> cover_story

=== cover_story ===
Handler: Your cover is [cover story]. Entry point is [location].

{knows_full_stakes:
    Handler: Remember, lives are at stake. Be thorough but fast.
}

-> mission_approach

// ===========================================
// CRITICAL CHOICE: Mission Approach
// ===========================================

=== mission_approach ===
Handler: How do you want to approach this?

+ [Cautious and methodical]
    ~ player_approach = "cautious"
    ~ mission_priority = "thoroughness"
    You: I'll be careful. Thorough investigation is key.
    Handler: Smart. Take your time but stay alert.
    -> final_instructions

+ [Fast and direct]
    ~ player_approach = "aggressive"
    ~ mission_priority = "speed"
    You: I'll move quickly and complete objectives fast.
    Handler: Good. Time is critical. But don't miss anything vital.
    -> final_instructions

+ [Adaptable - assess on site]
    ~ player_approach = "diplomatic"
    ~ mission_priority = "stealth"
    You: I'll read the situation and adapt.
    Handler: Flexible thinking. Trust your instincts.
    ~ handler_trust += 5
    -> final_instructions

=== final_instructions ===
Handler: Remember Field Operations Rule [relevant number from handbook].

{player_approach == "cautious":
    Handler: Your careful approach should serve you well. Document everything.
}
{player_approach == "aggressive":
    Handler: Speed is good, but don't compromise the mission for it.
}
{player_approach == "diplomatic":
    Handler: Adapt as needed. We trust your judgment.
}

Handler: You'll have comms support. I'll be monitoring.

* [Any last advice?]
    Handler: [Specific hint about first obstacle or key NPC]
    -> deployment

* [I'm ready to go]
    -> deployment

=== deployment ===
Handler: Good luck, {player_name}. SAFETYNET is counting on you.

[Transition: Fade to mission start location]

#start_gameplay
-> END
```

#### Act 1 Best Practices

1. **Front-load choices** - Give players 3-5 meaningful choices in Act 1
2. **Set variables** - Track choices that will callback later
3. **Character voice** - Handler should sound consistent with their profile
4. **Stakes clarity** - Player must understand what they're fighting for
5. **Smooth transition** - Clear moment when dialogue ends and gameplay begins
6. **Player agency** - Choices should feel meaningful, not cosmetic

### Step 3: Write Act 2 - NPC Dialogues

Act 2 NPCs fall into several categories:

#### Physical NPCs (Guards, Workers, Obstacles)

Use the **hub pattern** for conversations with multiple topics:

**Hub Pattern Requirements:**
- **Hub always repeats** - Topics return to hub with `-> hub`
- **At least one `+` (sticky) choice required** - Ensures exit option is always available
- **Use `*` for one-time topics** - But remember state is NOT saved between game loads
- **Use `+` for repeatable topics** - These appear every time hub is reached

```ink
// ===========================================
// ACT 2 NPC: Security Guard
// ===========================================

VAR influence = 0
VAR guard_hostile = false
VAR player_warned = false
VAR topic_building = false
VAR topic_security = false

=== start ===
#speaker:security_guard
{not player_warned:
    #display:guard-patrol
    The guard looks up as you approach.
    Guard: This is a restricted area. What's your business here?
    ~ player_warned = true
}
{player_warned and not guard_hostile:
    #display:guard-neutral
    Guard: Back again?
}
{guard_hostile:
    #display:guard-hostile
    Guard: I told you to leave. Now.
    #exit_conversation
    -> DONE
}
-> hub

=== hub ===
+ {not topic_building} [Ask about building layout]
    -> ask_building
+ {not topic_security} [Ask about security protocols]
    -> ask_security
+ {influence >= 20} [Request access]
    -> request_access
+ [Leave conversation]
    #exit_conversation
    #speaker:security_guard
    Guard: Stay out of trouble.
    -> DONE

=== ask_building ===
#speaker:security_guard
~ topic_building = true
~ influence += 5

Guard: [Provides general information about layout]

{influence >= 15:
    Guard: [Additional helpful detail]
}
-> hub  // Always return to hub to keep conversation repeating

=== ask_security ===
#speaker:security_guard
~ topic_security = true
~ influence += 5

Guard: Standard protocols. Nothing you need to worry about.

{influence >= 25:
    Guard: Though... [reveals minor security gap]
}
-> hub  // Always return to hub to keep conversation repeating

=== request_access ===
#speaker:security_guard
{influence >= 30:
    ~ influence -= 10
    Guard: Alright, I'll let you through. But make it quick.
    #exit_conversation
    -> DONE
- else:
    ~ influence -= 5
    Guard: Sorry, can't do that. Security protocols.
    -> hub  // Return to hub so player can try other options
}

// Event-triggered knot (called by game when guard sees lockpicking)
=== on_lockpick_detected ===
#speaker:security_guard
~ guard_hostile = true
~ influence = 0

#display:guard-hostile
Guard: HEY! What are you doing with that lock?!

#hostile:security_guard
This is your only warning - GET OUT!

#exit_conversation
-> DONE
```

#### Phone NPCs (Remote Support)

Phone NPCs provide hints and react to player progress via events:

```ink
// ===========================================
// ACT 2 PHONE NPC: Handler Support
// ===========================================

VAR hint_lockpicking_given = false
VAR hint_password_given = false
VAR rooms_discovered = 0

=== start ===
#speaker:handler_support
Handler: {player_name}, checking in. How's it going?

+ [Request hint]
    -> provide_hint
+ [Report progress]
    -> report_progress
+ [End call]
    #exit_conversation
    Handler: Stay safe out there.
    -> END

=== provide_hint ===
#speaker:handler_support

{not hint_lockpicking_given:
    Handler: If you have a lockpick kit, you can bypass key locks.
    ~ hint_lockpicking_given = true
    -> start
}
{not hint_password_given:
    Handler: Check computers and notes for password clues.
    ~ hint_password_given = true
    -> start
}
{hint_lockpicking_given and hint_password_given:
    Handler: You're doing fine. Trust your training.
    -> start
}

// Event-triggered: Called when player picks up lockpick
=== on_lockpick_pickup ===
#speaker:handler_support
Handler: Good find. That lockpick will let you bypass key locks.
Handler: Remember, lockpicking takes time and makes noise.
-> END

// Event-triggered: Called when player completes lockpick minigame
=== on_lockpick_success ===
#speaker:handler_support
Handler: Nice work on that lock. Smooth technique.
-> END

// Event-triggered: Called when player enters new room
=== on_room_discovered ===
#speaker:handler_support
~ rooms_discovered += 1

{rooms_discovered == 1:
    Handler: Good, you're making progress. Stay alert.
}
{rooms_discovered == 3:
    Handler: You're covering ground quickly. Don't miss anything important.
}
{rooms_discovered >= 5:
    Handler: Thorough work. ENTROPY's trail should be getting clearer.
}
-> END
```

#### Event Mapping (in JSON)

Connect Ink knots to game events:

```json
"eventMappings": [
  {
    "eventPattern": "item_picked_up:lockpick",
    "targetKnot": "on_lockpick_pickup",
    "onceOnly": true
  },
  {
    "eventPattern": "minigame_completed",
    "targetKnot": "on_lockpick_success",
    "condition": "data.minigameName && data.minigameName.includes('Lockpick')",
    "cooldown": 10000
  },
  {
    "eventPattern": "room_discovered",
    "targetKnot": "on_room_discovered",
    "cooldown": 15000,
    "maxTriggers": 5
  }
]
```

### Step 4: Write Act 3 - Closing Cutscene

Act 3 should:
1. Acknowledge player's performance
2. Callback to Act 1 choices
3. Show consequences
4. Provide narrative closure
5. Potentially set up future stories

#### Closing Cutscene Template

```ink
// ===========================================
// ACT 3: CLOSING CUTSCENE
// ===========================================

// Variables from Act 1 (carried forward)
EXTERNAL player_approach
EXTERNAL handler_trust
EXTERNAL knows_full_stakes
EXTERNAL mission_priority

// Variables from Act 2 (set by game)
EXTERNAL objectives_completed
EXTERNAL lore_collected
EXTERNAL stealth_rating
EXTERNAL time_taken

=== start ===
[Location: SAFETYNET Debrief Room]

#speaker:handler_[name]

{objectives_completed >= 4:
    -> full_success_debrief
}
{objectives_completed >= 2:
    -> partial_success_debrief
}
{objectives_completed < 2:
    -> minimal_success_debrief
}

// ===========================================
// FULL SUCCESS PATH
// ===========================================

=== full_success_debrief ===
Handler: Excellent work, {player_name}. All primary objectives completed.

{player_approach == "cautious":
    Handler: Your methodical approach paid off. Nothing was missed.
}
{player_approach == "aggressive":
    Handler: You moved fast and got results. Well executed.
}
{player_approach == "diplomatic":
    Handler: Your adaptability was key. You read the situation perfectly.
}

-> mission_details

=== mission_details ===
Handler: [Summary of what was accomplished]

{knows_full_stakes:
    Handler: And yes, you prevented [the stakes from Act 1]. Those civilians are safe because of you.
}

// Check for Act 1 choices and reference them
{handler_trust >= 60:
    Handler: I had confidence in you from the start. You've proven that trust was well-placed.
}
{handler_trust < 40:
    Handler: I'll admit, I had doubts. But you came through when it mattered.
}

-> entropy_status

=== entropy_status ===
Handler: As for [ENTROPY cell]...

{stealth_rating > 80:
    Handler: They didn't even know you were there until it was too late. Masterful.
}
{stealth_rating > 50:
    Handler: They knew someone was interfering, but couldn't stop you.
}
{stealth_rating <= 50:
    Handler: You made some noise, but got the job done. That's what counts.
}

[Specific information about ENTROPY cell's status]
[Did they escape? Get caught? What did we learn?]

-> lore_discussion

=== lore_discussion ===
{lore_collected >= 8:
    Handler: I see you found extensive intelligence. Analysis team is already going through it.
    Handler: [Tease what LORE revealed about larger plot]
    -> consequences
}
{lore_collected >= 4:
    Handler: You gathered some useful intelligence. It's filling in our picture of their network.
    -> consequences
}
{lore_collected < 4:
    Handler: We got the primary objective, though more intelligence would have been helpful.
    -> consequences
}

=== consequences ===
Handler: This operation has implications for [larger context].

[Explain broader impact]
[Set up potential future threads]

* [Ask what happens next]
    You: What's SAFETYNET's next move?
    Handler: [Future operations hint]
    -> debrief_end

* [Express concern about loose ends]
    You: [Express specific concern about unresolved elements]
    Handler: [Acknowledgment and context]
    -> debrief_end

* [Accept mission closure]
    -> debrief_end

=== debrief_end ===
Handler: Get some rest, {player_name}. You've earned it.

{handler_trust >= 70:
    Handler: And... good work. Really. We're lucky to have you.
}

[Fade to mission complete screen]

-> END

// ===========================================
// PARTIAL SUCCESS PATH
// ===========================================

=== partial_success_debrief ===
Handler: Mission complete, {player_name}, though we didn't get everything.

Handler: [What was accomplished]

Handler: [What was missed and why it matters]

{player_approach == "aggressive" and time_taken < 1800:
    Handler: Speed was prioritized. Sometimes that means missing details.
}

-> entropy_status

// ===========================================
// MINIMAL SUCCESS PATH
// ===========================================

=== minimal_success_debrief ===
Handler: You completed the core objective, but...

Handler: [Acknowledge accomplishment]

Handler: [Note significant gaps]

Handler: We'll need to follow up on what was missed.

-> entropy_status
```

#### Act 3 Best Practices

1. **Acknowledge everything** - Choices, performance, approach
2. **Show don't tell consequences** - Reference specific outcomes
3. **Vary endings** - Multiple variants based on performance
4. **Emotional payoff** - Match the tone to the outcome
5. **Close loops** - Answer questions raised in Acts 1 and 2
6. **Plant seeds** - Optional: hint at future scenarios

### Step 5: Ink Technical Best Practices

#### Use Tags for Game Integration

```ink
#speaker:character_name      // Sets active speaker
#display:mood_state          // Changes NPC visual state
#exit_conversation           // Closes dialogue
#hostile:npc_id             // Marks NPC as hostile
#patrol_mode:on             // Enables NPC patrol
#patrol_mode:off            // Disables NPC patrol
#start_gameplay             // Transitions from cutscene to gameplay
```

#### Variable Naming Conventions

```ink
// Choice tracking
VAR player_choice_mission_approach = ""

// State tracking
VAR npc_trust_level = 0
VAR knows_secret = false

// Topic tracking (for hub pattern)
VAR topic_discussed_security = false
VAR topic_discussed_building = false

// External variables (set by game)
EXTERNAL player_name
EXTERNAL objectives_completed
```

#### Hub Pattern (Recommended for Conversations)

The hub pattern creates a repeating conversation structure where players can explore multiple topics.

**Critical Requirements:**
- **Hub must always repeat** - Use `-> hub` to return after each topic
- **At least one `+` (sticky) choice must always be available** - Typically the exit option
- **`+` vs `*` choices:**
  - `+` (sticky) = Always available, appears every time hub is reached
  - `*` (non-sticky) = Appears once per conversation session (resets on game reload)
  - `*` choice state is NOT saved between game loads (simpler than tracking with variables)

```ink
=== hub ===
* [One-time narrative choice]
    -> one_time_topic
+ {condition1} [Repeatable conditional choice]
    -> branch1
+ {condition2} [Another repeatable choice]
    -> branch2
+ [Always available repeatable choice]
    -> branch3
+ [Exit conversation]
    #exit_conversation
    -> DONE

=== one_time_topic ===
This option appears once per session, but will return after game reload...
-> hub  // Return to hub

=== branch1 ===
Content here...
-> hub  // Return to hub

=== branch2 ===
Content here...
-> hub

=== branch3 ===
Content here...
-> hub
```

### Step 6: Testing and Validation

#### Test in Inky Editor

1. Load each .ink file in Inky
2. Test all branches
3. Verify variables update correctly
4. Check that all diverts point to existing knots
5. Confirm tags are properly formatted

#### Common Ink Errors

```ink
// ERROR: Missing ===
start ===  // Wrong
=== start ===  // Correct

// ERROR: Unclosed braces
{trust_level >= 3:
    Text here  // Missing closing brace

{trust_level >= 3:
    Text here
}  // Correct

// ERROR: Missing -> before divert
Trust increased
hub  // Wrong

Trust increased
-> hub  // Correct

// ERROR: Typo in variable name
~ trust_levl += 1  // Creates new variable!
~ trust_level += 1  // Correct
```

#### Testing Checklist

- [ ] All Ink files compile without errors in Inky
- [ ] All choice branches are reachable
- [ ] All conditional logic works correctly
- [ ] Variables are set and checked correctly
- [ ] All diverts point to existing knots
- [ ] Tags are properly formatted
- [ ] Character voices are distinct
- [ ] Dialogue flows naturally when read aloud
- [ ] Act 1 choices are referenced in Act 3
- [ ] Event-triggered knots exist for all event mappings

---

## Output Format

```markdown
# Ink Scripts: [Scenario Name]

## File Structure
- `[scenario]_opening.ink` - Act 1 opening cutscene
- `[scenario]_npc_guard.ink` - Security guard NPC
- `[scenario]_phone_handler.ink` - Handler phone contact
- `[scenario]_closing.ink` - Act 3 closing cutscene

## Variables Reference

### Act 1 Variables (Opening Cutscene)
- `player_approach` - cautious/aggressive/diplomatic
- `handler_trust` - 0-100 trust level
- `knows_full_stakes` - boolean
- `mission_priority` - speed/stealth/thoroughness

### Act 2 Variables (NPC Dialogues)
- `guard_influence` - 0-100 persuasion level
- `topic_*` - boolean flags for conversation topics

### External Variables (Set by Game)
- `player_name` - Player's display name
- `objectives_completed` - Number of completed objectives
- `lore_collected` - Number of LORE fragments found
- `stealth_rating` - 0-100 stealth performance

## Integration Notes
[How Ink integrates with game systems]

## Testing Results
[What was tested and outcomes]
```

---

Save your Ink scripts as:
```
scenarios/ink/[scenario_name]_opening.ink
scenarios/ink/[scenario_name]_npc_*.ink
scenarios/ink/[scenario_name]_phone_*.ink
scenarios/ink/[scenario_name]_closing.ink
```

---

## ⚠️ CRITICAL: Compile Ink Scripts Before Proceeding

After writing all Ink scripts, **you MUST compile them to JSON** before moving to Stage 8:

```bash
./scripts/compile-ink.sh [scenario_name]
```

**This compilation step:**
- Converts `.ink` source files to `.json` format that the game can read
- Validates Ink syntax and catches errors early
- Warns about END tags (cutscenes may legitimately use END with `#exit_conversation`)

**Expected output:**
- ✅ All scripts compile successfully
- ⚠️ Warnings about END tags in cutscenes (expected for opening/closing/confrontation scripts)
- ❌ Fix any compilation errors before proceeding to Stage 8

**Cutscene scripts should:**
- Use `-> END` for one-time conversations (opening briefing, closing debrief, final confrontations)
- Include `#exit_conversation` tag before each `-> END`

**Regular NPC scripts should:**
- Return to `-> hub` instead of using END
- Only use END if NPC becomes unavailable after conversation

---

**Next Stage:** Pass complete **compiled** scripts to Stage 8 (Review) for final validation.
