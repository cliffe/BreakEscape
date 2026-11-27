# Example Ink Script: Biometric Breach NPCs

This is a complete, working example of an Ink script for the Biometric Breach scenario featuring two NPCs: Alice (Security Analyst) and Bob (IT Administrator).

## Complete Ink Script

**File:** `scenarios/ink/biometric_breach_npcs.ink`

```ink
// ============================================================
// Break Escape: Biometric Breach - NPC Conversations
// Scenario: Security breach investigation with two NPCs
// NPCs: Alice (Security) and Bob (IT)
// Compiled: 2025-10-28
// ============================================================

// ============================================================
// GLOBAL VARIABLES
// ============================================================

// Player progress tracking
VAR player_in_reception = false
VAR player_in_office = false
VAR player_in_lab = false
VAR player_in_server = false

VAR fingerprint_collected = false
VAR lockpick_used = false
VAR server_accessed = false
VAR suspect_identified = false
VAR mission_complete = false

// NPC relationship tracking
VAR alice_trust = 0        // -10 to +10
VAR bob_trust = 0          // -10 to +10
VAR alice_met = false
VAR bob_met = false

// Investigation state
VAR evidence_count = 0
VAR investigation_phase = 1  // 1=early, 2=mid, 3=late

// Scenario-specific
VAR server_pin_known = false
VAR lab_door_unlocked = false

// ============================================================
// EXTERNAL FUNCTIONS
// ============================================================

EXTERNAL give_item(item_type)
EXTERNAL unlock_door(door_id)
EXTERNAL show_notification(message)
EXTERNAL get_current_room()
EXTERNAL has_item(item_type)

// ============================================================
// NPC: ALICE (Security Analyst)
// ============================================================

// Initial contact - triggered on game start
=== alice_intro ===
# speaker: Alice
# type: bark
# trigger: game_start
# priority: high
# once: true
Hey! I'm Alice from security. We've got a major breach tonight.
~ alice_met = true
~ alice_trust++
-> END

// Room-based barks
=== alice_room_reception ===
# speaker: Alice
# type: bark
{player_in_reception:
    Still in reception? Keep searching for clues.
- else:
    Good, you're in reception. Check the computer for fingerprints.
    ~ player_in_reception = true
}
-> END

=== alice_room_lab ===
# speaker: Alice
# type: bark
# priority: high
{player_in_lab:
    Find anything new in the lab?
- else:
    You're in the biometrics lab! Be careful, the intruder was here.
    ~ player_in_lab = true
    ~ investigation_phase = 2
}
-> END

=== alice_room_server ===
# speaker: Alice
# type: bark
# priority: high
The server room! That's where the sensitive data is stored.
~ player_in_server = true
~ investigation_phase = 3
-> END

// Item-based barks
=== alice_item_fingerprint_kit ===
# speaker: Alice
# type: bark
Good! You have the fingerprint kit. Use it on keyboards and door handles.
~ alice_trust++
-> END

=== alice_item_lockpick ===
# speaker: Alice
# type: bark
{alice_trust >= 5:
    A lockpick? Well, desperate times call for creative solutions...
- else:
    Where did you get a lockpick? Stay focused on the investigation!
    ~ alice_trust--
}
~ lockpick_used = true
-> END

// Minigame reactions
=== alice_minigame_lockpicking_success ===
# speaker: Alice
# type: bark
Nice work on that lock! Just... don't tell the chief I said that.
~ alice_trust++
-> END

=== alice_minigame_dusting_success ===
# speaker: Alice
# type: bark
# priority: high
Excellent! You collected a clean fingerprint sample.
{not fingerprint_collected:
    Send it to me and I'll run it through our database.
}
~ fingerprint_collected = true
~ alice_trust++
~ evidence_count++
-> END

// Progress milestones
=== alice_progress_suspect_found ===
# speaker: Alice
# type: bark
# priority: high
# once: true
WAIT. This fingerprint... it matches the Research Director!
I can't believe it. We need to find more evidence.
~ suspect_identified = true
~ alice_trust++
~ show_notification("Suspect identified: Research Director")
-> END

// Main conversation hub
=== alice_hub ===
# speaker: Alice
# type: conversation
{alice_trust >= 7: You've been incredible help tonight. What do you need?}
{alice_trust >= 3 and alice_trust < 7: Thanks for your help. What's up?}
{alice_trust >= 0 and alice_trust < 3: What can I do for you?}
{alice_trust < 0: Make it quick. I'm busy.}

+ {not alice_met} [Who are you?] -> alice_introduction
+ [What happened here?] -> alice_explain_breach
+ {player_in_reception} [What should I look for?] -> alice_investigation_tips
+ {fingerprint_collected} [I found a fingerprint] -> alice_fingerprint_analysis
+ {alice_trust >= 5} [Can you help me access the lab?] -> alice_lab_access
+ {suspect_identified} [What do we do now?] -> alice_next_steps
+ [I need to go] -> alice_goodbye
-> END

=== alice_introduction ===
# speaker: Alice
Alice Chen, Security Analyst. Been with the company for 3 years.
I monitor all access logs and security systems.
~ alice_met = true
Tonight's breach is the worst I've ever seen.
~ alice_trust++
-> alice_hub

=== alice_explain_breach ===
# speaker: Alice
Around 2 AM, our intrusion detection system went crazy.
Someone bypassed our biometric locks and accessed restricted areas.
# wait: 1
The weird part? They used valid credentials. An inside job.
~ alice_trust++
+ [Do you have any suspects?] -> alice_suspects
+ [What was stolen?] -> alice_stolen_data
-> alice_hub

=== alice_suspects ===
# speaker: Alice
That's what we need to figure out. 
{fingerprint_collected:
    With that fingerprint you found, we can narrow it down.
- else:
    We need physical evidence. Fingerprints, access logs, anything.
}
Look for signs of forced entry or items out of place.
-> alice_hub

=== alice_stolen_data ===
# speaker: Alice
We're still assessing the damage.
Definitely accessed the server room - that's our crown jewels.
Research data, employee records, security protocols...
{server_accessed:
    Since you accessed the server, check the logs for deleted files.
- else:
    We need to get into that server room.
}
-> alice_hub

=== alice_investigation_tips ===
# speaker: Alice
Look at the computer first. Check for fingerprints.
Then search the desk and filing cabinet.
# wait: 1
The intruder was in a hurry - they probably made mistakes.
~ alice_trust++
-> alice_hub

=== alice_fingerprint_analysis ===
# speaker: Alice
{fingerprint_collected:
    Perfect. Let me run this through our database...
    # wait: 2
    {not suspect_identified:
        It's taking a while... the quality isn't perfect.
        Try to find another print to cross-reference.
    - else:
        It's a match! Research Director. I can't believe it.
        ~ alice_trust += 2
    }
- else:
    You haven't collected a clean print yet.
    Use your fingerprint kit on surfaces, then the dusting minigame.
}
-> alice_hub

=== alice_lab_access ===
{alice_trust >= 5:
    # speaker: Alice
    Alright, here's my access card. Don't lose it.
    # wait: 1
    The biometrics lab is north of the main office.
    Be careful - if the intruder left any traps, that's where they'd be.
    ~ give_item("alice_keycard")
    ~ unlock_door("door_office_lab")
    ~ alice_trust++
    ~ lab_door_unlocked = true
    Good luck.
    -> alice_hub
- else:
    # speaker: Alice
    I can't give you lab access yet.
    Prove yourself first - find some evidence.
    -> alice_hub
}

=== alice_next_steps ===
# speaker: Alice
{suspect_identified:
    We need to secure the server room before the Director realizes we're onto them.
    {has_item("alice_keycard"):
        You have my keycard - that should get you in.
    - else:
        Here, take my keycard. Server room is north of the research wing.
        ~ give_item("alice_keycard")
    }
    # wait: 1
    {server_pin_known:
        Bob gave you the PIN, right? Use it carefully.
    - else:
        You'll need the PIN code. Bob from IT should have it.
    }
- else:
    First, we need to identify the suspect.
    Keep gathering evidence.
}
-> alice_hub

=== alice_goodbye ===
# speaker: Alice
Stay safe. Call if you need backup.
-> END

// ============================================================
// NPC: BOB (IT Administrator)
// ============================================================

// Initial contact - delayed trigger
=== bob_intro ===
# speaker: Bob
# type: bark
# trigger: room_entered:office
# once: true
Yo, I'm Bob from IT. Heard about the breach. Need any tech help?
~ bob_met = true
-> END

// Room-based barks
=== bob_room_server ===
# speaker: Bob
# type: bark
# priority: high
{player_in_server:
    Server room looking okay?
- else:
    You made it to the server room! The PIN is 5923, by the way.
    ~ player_in_server = true
    ~ server_pin_known = true
}
-> END

// Item reactions
=== bob_item_workstation ===
# speaker: Bob
# type: bark
Nice, you grabbed the crypto workstation! That'll crack any passwords.
~ bob_trust++
-> END

// Minigame reactions
=== bob_minigame_password_success ===
# speaker: Bob
# type: bark
Boom! Password cracked. You're a natural.
~ bob_trust++
-> END

=== bob_minigame_password_failed ===
# speaker: Bob
# type: bark
Ouch, password fail. Don't worry, try a different approach.
-> END

// Main conversation hub
=== bob_hub ===
# speaker: Bob
# type: conversation
{bob_trust >= 5: Hey! What's up?}
{bob_trust < 5: Yeah? What do you need?}

+ {not bob_met} [Who are you?] -> bob_introduction
+ [Can you help with the server room?] -> bob_server_help
+ [What do you know about the breach?] -> bob_breach_info
+ {player_in_server} [I'm in the server room now] -> bob_server_instructions
+ [Later] -> bob_goodbye
-> END

=== bob_introduction ===
# speaker: Bob
Bob Martinez, IT Administrator.
I handle all the network security, server maintenance, that kind of thing.
~ bob_met = true
~ bob_trust++
-> bob_hub

=== bob_server_help ===
# speaker: Bob
Server room is locked down tight - biometric + PIN code.
{alice_trust >= 5:
    Alice can give you biometric access with her card.
- else:
    You'll need Alice's help for the biometric part.
}
# wait: 1
PIN code is 5923. Don't share that around, okay?
~ server_pin_known = true
~ bob_trust++
~ show_notification("Server room PIN: 5923")
-> bob_hub

=== bob_breach_info ===
# speaker: Bob
From what I can tell, someone accessed our secure servers remotely.
Then they physically showed up to cover their tracks.
# wait: 1
Classic data exfiltration. Very professional.
{suspect_identified:
    ~ bob_trust++
    Can't believe it was the Research Director though.
}
-> bob_hub

=== bob_server_instructions ===
# speaker: Bob
Check the access logs first - look for deleted files.
Then check the security camera footage if you can.
# wait: 1
And hey, if you find anything crypto-related, that's my specialty.
~ bob_trust++
~ server_accessed = true
-> bob_hub

=== bob_goodbye ===
# speaker: Bob
Catch you later. Good luck with the investigation!
-> END

// ============================================================
// SHARED/UTILITY KNOTS
// ============================================================

// Generic response for unhandled events
=== generic_acknowledgment ===
# speaker: Alice
# type: bark
Good work. Keep it up.
-> END

// ============================================================
// DEBUG KNOTS (for testing)
// ============================================================

=== DEBUG_test_all_variables ===
# speaker: System
# type: conversation
Debug Information:
- Reception: {player_in_reception}
- Lab: {player_in_lab}
- Server: {player_in_server}
- Fingerprint: {fingerprint_collected}
- Suspect: {suspect_identified}
- Alice Trust: {alice_trust}
- Bob Trust: {bob_trust}
- Phase: {investigation_phase}
+ [Reset] -> DEBUG_reset
+ [Done] -> END

=== DEBUG_reset ===
~ player_in_reception = false
~ player_in_lab = false
~ fingerprint_collected = false
~ alice_trust = 0
~ bob_trust = 0
Debug variables reset.
-> END
```

## Compilation

```bash
# Compile the Ink script to JSON
cd scenarios/ink
inklecate biometric_breach_npcs.ink -o ../compiled/biometric_breach_npcs.json

# Verify compilation
ls -lh ../compiled/biometric_breach_npcs.json
```

## Scenario JSON Integration

**File:** `scenarios/biometric_breach.json` (add to existing)

```json
{
  "scenario_brief": "...",
  "npcs": {
    "alice": {
      "id": "alice",
      "name": "Alice Chen",
      "role": "Security Analyst",
      "phone": "555-0123",
      "avatar": "assets/npc/avatars/npc_alice.png",
      "inkFile": "scenarios/compiled/biometric_breach_npcs.json",
      "initialKnot": "alice_intro",
      "eventMappings": {
        "game_start": "alice_intro",
        "room_entered:reception": "alice_room_reception",
        "room_entered:lab": "alice_room_lab",
        "room_entered:server": "alice_room_server",
        "item_picked_up:fingerprint_kit": "alice_item_fingerprint_kit",
        "item_picked_up:lockpick": "alice_item_lockpick",
        "minigame_completed:lockpicking:success": "alice_minigame_lockpicking_success",
        "minigame_completed:dusting:success": "alice_minigame_dusting_success",
        "progress:suspect_identified": "alice_progress_suspect_found"
      },
      "cooldowns": {
        "room_entered": 30,
        "item_picked_up": 10,
        "minigame_completed": 5,
        "default": 15
      }
    },
    "bob": {
      "id": "bob",
      "name": "Bob Martinez",
      "role": "IT Administrator",
      "phone": "555-0124",
      "avatar": "assets/npc/avatars/npc_bob.png",
      "inkFile": "scenarios/compiled/biometric_breach_npcs.json",
      "initialKnot": "bob_intro",
      "eventMappings": {
        "room_entered:office": "bob_intro",
        "room_entered:server": "bob_room_server",
        "item_picked_up:workstation": "bob_item_workstation",
        "minigame_completed:password:success": "bob_minigame_password_success",
        "minigame_completed:password:failed": "bob_minigame_password_failed"
      },
      "cooldowns": {
        "room_entered": 30,
        "item_picked_up": 10,
        "default": 15
      }
    }
  },
  "rooms": {
    ...existing rooms...
  }
}
```

## Expected Behavior

### Game Start
1. Player loads scenario
2. Alice sends bark: "Hey! I'm Alice from security..."
3. Player can click bark to open conversation

### Entering Reception
1. Alice sends bark: "Good, you're in reception. Check the computer..."
2. Variable `player_in_reception` set to true
3. Alice's trust increases slightly

### Picking Up Fingerprint Kit
1. Alice sends bark: "Good! You have the fingerprint kit..."
2. Alice's trust increases

### Collecting Fingerprint (Dusting Minigame Success)
1. Alice sends bark: "Excellent! You collected a clean fingerprint..."
2. Variable `fingerprint_collected` set to true
3. Variable `evidence_count` increases
4. Alice's trust increases

### Identifying Suspect (Progress Event)
1. Alice sends high-priority bark: "WAIT. This fingerprint matches..."
2. Variable `suspect_identified` set to true
3. Game notification shown: "Suspect identified: Research Director"
4. Alice's trust increases significantly

### Opening Phone Chat with Alice
1. Player clicks Alice's contact
2. Conversation opens at `alice_hub`
3. Available choices depend on:
   - Alice's trust level
   - Player progress (rooms visited, items collected)
   - Investigation phase

### Conversation Choices
- **Low trust** (<3): Limited options, Alice is brief
- **Medium trust** (3-7): More options, Alice is helpful
- **High trust** (7+): All options, Alice gives keycard

### Bob's Introduction
1. Triggered when player enters office
2. Bob sends bark introducing himself
3. Bob becomes available in phone contacts

### Server Room Access
1. If Alice trusts player (≥5), she gives keycard
2. Bob provides PIN code (5923) when asked
3. Both NPCs react when player enters server room

## Testing Commands

```javascript
// In browser console after loading scenario:

// Manually trigger Alice intro
window.inkEngine.goToKnot('alice', 'alice_intro');

// Open Alice conversation
window.MinigameFramework.startMinigame('phone-chat', null, { npcId: 'alice' });

// Check Alice's trust level
window.inkEngine.getVariable('alice', 'alice_trust');

// Set a variable for testing
window.inkEngine.setVariable('alice', 'fingerprint_collected', true);

// Trigger a bark manually
window.npcManager.handleEvent('alice', 'alice_room_lab', {});

// Test event emission
window.npcEvents.emit('room_entered', { roomId: 'reception' });
```

## Dialogue Flow Examples

### Example 1: Early Game (Low Trust)
```
Player: [What happened here?]
Alice: "Around 2 AM, our intrusion detection system went crazy..."
Alice: "The weird part? They used valid credentials. An inside job."

Player: [Do you have any suspects?]
Alice: "We need physical evidence. Fingerprints, access logs, anything."

Player: [Can you help me access the lab?]
Alice: "I can't give you lab access yet. Prove yourself first."
```

### Example 2: Mid Game (Medium Trust, Evidence Found)
```
Player: [I found a fingerprint]
Alice: "Perfect. Let me run this through our database..."
Alice: "It's taking a while... the quality isn't perfect."

Player: [Can you help me access the lab?]
Alice: "Alright, here's my access card. Don't lose it."
[Player receives alice_keycard item]
[Door unlocked]
```

### Example 3: Late Game (High Trust, Suspect Identified)
```
Player: [What do we do now?]
Alice: "We need to secure the server room before the Director realizes we're onto them."
Alice: "Here, take my keycard. Server room is north of the research wing."
Alice: "Bob gave you the PIN, right? Use it carefully."

Player: [I need to go]
Alice: "Stay safe. Call if you need backup."
```

## Notes

- **Branching Logic**: Choices appear/disappear based on game state
- **Trust System**: Alice and Bob track relationship separately
- **Investigation Phases**: 1 (early) → 2 (mid) → 3 (late game)
- **External Functions**: Ink can give items, unlock doors, show notifications
- **Variable Persistence**: All variables saved with game state
- **Cooldowns**: Events throttled to prevent spam (configured in scenario JSON)
- **Debug Knots**: Use `DEBUG_test_all_variables` to inspect state

## Next Steps

1. Create avatars for Alice and Bob (64x64 pixel art)
2. Add more NPCs (Lab Technician, Research Director?)
3. Expand conversation branches for more player choices
4. Add time-based messages (delayed barks)
5. Implement group conversations
6. Add voice synthesis for NPC dialogue
7. Create relationship consequences (doors locked/unlocked based on trust)

This example demonstrates all key features of the NPC system working together in a realistic scenario context.
