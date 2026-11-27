# Break Escape: Available Features for Scenario Design

**Purpose:** This document provides a comprehensive reference of all available game features, mechanics, and systems that scenario designers can use when creating Break Escape scenarios.

**Audience:** AI agents, human designers, and anyone writing scenario JSON files or Ink dialogue.

---

## Table of Contents

1. [Scenario Structure](#scenario-structure)
2. [Room System](#room-system)
3. [Object Types](#object-types)
4. [Lock Types and Security](#lock-types-and-security)
5. [NPC System](#npc-system)
6. [Ink Dialogue System](#ink-dialogue-system)
7. [RFID System](#rfid-system)
8. [Player Configuration](#player-configuration)
9. [Puzzle Chains and Dependencies](#puzzle-chains-and-dependencies)
10. [Event System](#event-system)

---

## Scenario Structure

### Top-Level JSON Structure

```json
{
  "name": "Scenario Name",
  "description": "Brief description",
  "scenario_brief": "Opening text shown to player",
  "endGoal": "What player is trying to accomplish",
  "startRoom": "room_id",
  "globalVariables": {},
  "player": { /* player configuration */ },
  "startItemsInInventory": [ /* items */ ],
  "rooms": { /* room definitions */ }
}
```

### Key Fields

- **`scenario_brief`**: Opening text displayed to player (supports markdown)
- **`endGoal`**: Win condition description
- **`startRoom`**: ID of the room where player spawns
- **`startItemsInInventory`**: Array of items player starts with
- **`globalVariables`**: Shared state across scenario (optional)

---

## Room System

### Room Types

Available room types (determines visual theme):
- `room_reception` - Lobby/entrance areas
- `room_office` - Standard office spaces
- `room_ceo` - Executive offices
- `room_servers` - Server/data center rooms
- `room_closet` - Small storage areas

### Room Structure

```json
"room_id": {
  "name": "Display Name",
  "type": "room_office",
  "locked": true,
  "lockType": "key",
  "requires": "office_key",   // the credential name; a key points at it with opens_lock
  "door_sign": "Optional door label",
  "connections": {
    "north": "room_id",
    "south": ["room_id1", "room_id2"],
    "east": "room_id",
    "west": "room_id"
  },
  "npcs": [ /* NPC definitions */ ],
  "objects": [ /* object definitions */ ],
  "doors": [ /* explicit door configurations */ ]
}
```

### Connections

- **Single direction**: `"north": "room_id"`
- **Multiple connections**: `"north": ["room_id1", "room_id2"]`
- **All four directions supported**: north, south, east, west

### Door Configuration

Explicit door definitions (optional, for precise control):

```json
{
  "roomId": "current_room",
  "connectedRoom": "target_room",
  "direction": "north",
  "x": 200,
  "y": 100,
  "locked": true,
  "lockType": "rfid",
  "requires": ["card_id"]
}
```

---

## Object Types

### Common Object Properties

All objects share these base properties:

```json
{
  "type": "object_type",
  "name": "Display Name",
  "takeable": true,
  "x": 300,          // Optional: precise positioning
  "y": 200,          // Optional: precise positioning
  "observations": "Description shown on examine"
}
```

### Document/Information Objects

**Notes**
```json
{
  "type": "notes",
  "name": "Document Name",
  "takeable": true,
  "readable": true,
  "text": "Content of the note",
  "note_title": "Optional title",
  "note_content": "Formatted content (supports markdown)",
  "important": true,        // Optional: highlight important items
  "isEndGoal": true,        // Optional: marks scenario completion
  "observations": "Description"
}
```

**Phone (voicemail/messages)**
```json
{
  "type": "phone",
  "name": "Phone Name",
  "takeable": false,
  "readable": true,
  "voice": "Message content",
  "text": "Alternative text content",
  "sender": "Sender name",
  "timestamp": "Time/date",
  "phoneId": "phone_id",     // For linking to NPC contacts
  "npcIds": ["npc1", "npc2"], // NPCs accessible via this phone
  "observations": "Description"
}
```

### Computer/Terminal Objects

**PC/Computer**
```json
{
  "type": "pc",
  "name": "Computer Name",
  "takeable": false,
  "locked": true,
  "lockType": "password",
  "requires": "password_string",
  "showKeyboard": true,        // Show on-screen keyboard
  "passwordHint": "Optional hint",
  "showHint": true,
  "maxAttempts": 3,
  "postitNote": "Password: secret",  // Visible password hint
  "showPostit": true,
  "hasFingerprint": true,      // Can be unlocked with fingerprints
  "fingerprintOwner": "ceo",
  "fingerprintDifficulty": "medium",
  "contents": [ /* objects inside */ ],
  "observations": "Description"
}
```

**Tablet**
```json
{
  "type": "tablet",
  "name": "Tablet Device",
  "takeable": true,
  "locked": true,
  "lockType": "bluetooth",
  "requires": "bluetooth",
  "mac": "00:11:22:33:44:55",
  "observations": "Description"
}
```

### Security/Tool Objects

**Key**
```json
{
  "type": "key",
  "name": "Key Name",
  "takeable": true,
  "opens_lock": "office_key",   // which lock this key opens, NOT this key's own name
  "id": "brass_office_key",     // optional: only if something needs to address this exact key
  "keyPins": [100, 0, 100, 0],  // For lockpicking minigame
  "observations": "Description"
}
```

**Lockpick Kit**
```json
{
  "type": "lockpick",
  "name": "Lock Pick Kit",
  "takeable": true,
  "observations": "Enables lockpicking minigame"
}
```

**Fingerprint Kit**
```json
{
  "type": "fingerprint_kit",
  "name": "Fingerprint Kit",
  "takeable": true,
  "observations": "Collects fingerprints from surfaces"
}
```

**PIN Cracker**
```json
{
  "type": "pin-cracker",
  "name": "PIN Cracker",
  "takeable": true,
  "observations": "Provides feedback on PIN entry attempts"
}
```

**Bluetooth Scanner**
```json
{
  "type": "bluetooth_scanner",
  "name": "Bluetooth Scanner",
  "takeable": true,
  "canScanBluetooth": true,
  "observations": "Detects nearby Bluetooth signals"
}
```

**RFID Cloner**
```json
{
  "type": "rfid_cloner",
  "name": "RFID Flipper",
  "takeable": true,
  "saved_cards": [],
  "observations": "Scans and emulates RFID cards"
}
```

**Keycard (RFID)**
```json
{
  "type": "keycard",
  "name": "Access Card",
  "card_id": "unique_card_id",
  "rfid_protocol": "EM4100",
  "takeable": true,
  "observations": "Description"
}
```

**Workstation**
```json
{
  "type": "workstation",
  "name": "Analysis Station",
  "takeable": true,
  "observations": "Powerful computer for analysis tasks"
}
```

### Container Objects

**Safe**
```json
{
  "type": "safe",
  "name": "Safe Name",
  "takeable": false,
  "locked": true,
  "lockType": "pin",
  "requires": "9573",
  "contents": [ /* objects inside */ ],
  "observations": "Description"
}
```

**Suitcase/Briefcase**
```json
{
  "type": "suitcase",
  "name": "Briefcase",
  "takeable": false,
  "locked": true,
  "lockType": "key",
  "requires": "safe_key",
  "keyPins": [50, 25, 0, 75],
  "difficulty": "medium",
  "contents": [ /* objects inside */ ],
  "observations": "Description"
}
```

---

## Lock Types and Security

### Available Lock Types

1. **`key`** - Requires specific key item
   - `requires`: the lock's credential name (string); a key matches it with `opens_lock`
   - `keyPins`: [array of 4 numbers] for lockpicking minigame
   - `difficulty`: "easy", "medium", "hard"

2. **`pin`** - 4-digit PIN code
   - `requires`: "1234" (4-digit string)
   - Can use PIN cracker for hints

3. **`password`** - Text password
   - `requires`: "password_string"
   - `showKeyboard`: true (shows on-screen keyboard)
   - `maxAttempts`: number (optional)

4. **`bluetooth`** - Bluetooth pairing
   - `requires`: "bluetooth"
   - `mac`: "MAC address" (for bluetooth scanner)

5. **`rfid`** - RFID card access
   - `requires`: ["card_id"] or "card_id"
   - Works with RFID cloner

6. **`lockpick`** - Lockpicking minigame
   - Uses keyPins array
   - Requires lockpick tool in inventory

### Lockpicking System

Doors and containers with `lockType: "key"` can be picked:

```json
{
  "locked": true,
  "lockType": "key",
  "requires": "office_key",
  "keyPins": [100, 0, 100, 0],  // Pin heights for minigame
  "difficulty": "easy"           // easy/medium/hard
}
```

- **keyPins**: Array of 4 numbers (0-150) representing pin heights
- **difficulty**: Affects time window and feedback

---

## NPC System

### NPC Types

1. **`person`** - Physical NPC in the game world
2. **`phone`** - Virtual NPC accessible via phone item

### Physical NPC Structure

```json
{
  "id": "npc_id",
  "displayName": "NPC Name",
  "npcType": "person",
  "position": { "x": 3, "y": 3 },
  "spriteSheet": "hacker",
  "spriteTalk": "assets/characters/hacker-talk.png",
  "spriteConfig": {
    "idleFrameStart": 20,
    "idleFrameEnd": 23
  },
  "storyPath": "scenarios/ink/dialogue.json",
  "currentKnot": "start",
  "avatar": "assets/npc/avatars/npc_neutral.png",
  "behavior": {
    "facePlayer": true,
    "facePlayerDistance": 96,
    "patrol": {
      "enabled": true,
      "speed": 100,
      "changeDirectionInterval": 3000,
      "bounds": {
        "x": 64,
        "y": 64,
        "width": 192,
        "height": 192
      }
    }
  },
  "rfidCard": {
    "card_id": "employee_badge",
    "rfid_protocol": "EM4100",
    "name": "Employee Badge"
  },
  "eventMappings": [ /* event triggers */ ]
}
```

### Phone NPC Structure

```json
{
  "id": "contact_id",
  "displayName": "Contact Name",
  "storyPath": "scenarios/ink/dialogue.json",
  "avatar": "assets/npc/avatars/npc_helper.png",
  "phoneId": "player_phone",
  "currentKnot": "start",
  "npcType": "phone",
  "timedMessages": [
    {
      "delay": 5000,
      "message": "Hey! Got any updates?",
      "type": "text"
    }
  ],
  "eventMappings": [ /* event triggers */ ]
}
```

### NPC Behaviors

**Face Player**
```json
"behavior": {
  "facePlayer": true,
  "facePlayerDistance": 96  // Distance in pixels (96 = 3 tiles)
}
```

**Patrol**
```json
"patrol": {
  "enabled": true,
  "speed": 100,                    // Pixels per second
  "changeDirectionInterval": 3000, // Milliseconds
  "bounds": {
    "x": 64,        // Top-left X
    "y": 64,        // Top-left Y
    "width": 192,   // Width in pixels
    "height": 192   // Height in pixels
  }
}
```

### Sprite Sheets

Available sprite sheets:
- `hacker` - Default agent sprite
- `hacker-red` - Red variant
- `hacker-green` - Green variant
- `hacker-yellow` - Yellow variant

### RFID Cards on NPCs

NPCs can carry RFID cards that can be scanned:

```json
"rfidCard": {
  "card_id": "employee_badge",
  "rfid_protocol": "EM4100",
  "name": "Employee Badge"
}
```

---

## Ink Dialogue System

### Basic Structure

```ink
VAR trust_level = 0
VAR knows_secret = false

=== start ===
#speaker:npc_name
Hello! How can I help you?
-> hub

=== hub ===
+ [Ask about security]
    -> topic_security
+ [Say goodbye]
    #exit_conversation
    See you later!
    -> END
```

### Ink Tags (Special Commands)

**Speaker**
```ink
#speaker:npc_name
```
Sets who is speaking (for avatar display)

**Display/Mood**
```ink
#display:guard-patrol
#display:guard-confrontation
#display:guard-hostile
```
Controls NPC visual state/mood

**Exit Conversation**
```ink
#exit_conversation
```
Closes dialogue window

**Hostility**
```ink
#hostile:npc_id
```
Marks NPC as hostile (affects gameplay)

**Patrol Control**
```ink
#patrol_mode:on
#patrol_mode:off
```
Toggles NPC patrol behavior

### Variables

**Declare at top:**
```ink
VAR variable_name = 0
VAR boolean_flag = false
```

**Modify:**
```ink
~ trust_level += 1
~ knows_secret = true
```

**Conditional:**
```ink
{trust_level >= 3:
    You seem trustworthy.
- else:
    I don't know you well enough.
}
```

### Choices

**Basic:**
```ink
* [Choice text]
    Response text
    -> next_knot
```

**Conditional:**
```ink
+ {trust_level >= 2} [Restricted choice]
    -> privileged_content
```

**Once-only:**
```ink
+ {not topic_discussed} [New topic]
    ~ topic_discussed = true
    -> topic_knot
```

### Hub Pattern (Recommended)

```ink
=== hub ===
+ {condition1} [Choice 1]
    -> branch1
+ {condition2} [Choice 2]
    -> branch2
+ [Always available]
    -> branch3

=== branch1 ===
Content...
-> hub  // Return to hub
```

---

## RFID System

### RFID Protocols

Four security levels from weakest to strongest:

1. **EM4100** (125kHz) - Instant clone
   ```json
   "rfid_protocol": "EM4100"
   ```
   - No encryption
   - Instant cloning
   - Used in old hotels, parking garages

2. **MIFARE Classic (Weak Defaults)** - Instant crack
   ```json
   "rfid_protocol": "MIFARE_Classic_Weak_Defaults"
   ```
   - Uses factory default keys
   - Dictionary attack succeeds instantly
   - Used in cheap hotels, old transit cards

3. **MIFARE Classic (Custom Keys)** - Requires attack (~30 sec)
   ```json
   "rfid_protocol": "MIFARE_Classic_Custom_Keys"
   ```
   - Custom encryption keys
   - Requires Darkside attack (30 seconds)
   - Used in corporate badges, banks

4. **MIFARE DESFire** - UID emulation only
   ```json
   "rfid_protocol": "MIFARE_DESFire"
   ```
   - Military-grade AES encryption
   - Cannot be cracked
   - Only UID emulation works (if reader is poorly configured)
   - Used in government, military, high-security

### RFID Workflow

1. Player needs RFID cloner in inventory
2. Player approaches NPC with RFID card or scans keycard object
3. Player uses cloner to scan/attack card
4. Player emulates card at RFID reader/door

---

## Player Configuration

```json
"player": {
  "id": "player",
  "displayName": "Agent Name",
  "spriteSheet": "hacker",
  "spriteTalk": "assets/characters/hacker-talk.png",
  "spriteConfig": {
    "idleFrameStart": 20,
    "idleFrameEnd": 23
  },
  "startX": 200,
  "startY": 200
}
```

---

## Puzzle Chains and Dependencies

### Example: Multi-Step Puzzle Chain

```
1. Read note in Reception
   ↓
2. Get password from note
   ↓
3. Unlock PC in Office
   ↓
4. Read file on PC to get PIN code
   ↓
5. Use PIN to unlock Safe
   ↓
6. Get key from Safe
   ↓
7. Use key to unlock CEO office
   ↓
8. Find final evidence
```

### Implementation Pattern

```json
{
  "rooms": {
    "reception": {
      "objects": [
        {
          "type": "notes",
          "text": "PIN code is 7391",
          "takeable": true
        }
      ],
      "connections": {
        "north": "office"
      }
    },
    "office": {
      "locked": true,
      "lockType": "pin",
      "requires": "7391",
      "objects": [
        {
          "type": "key",
          "opens_lock": "final_key",
          "takeable": true
        }
      ]
    }
  }
}
```

### Dependency Types

1. **Information Dependencies**: Clue → Solution
2. **Tool Dependencies**: Need tool to interact with object
3. **Access Dependencies**: Need key/card/password to access area
4. **Sequential Dependencies**: A → B → C must be done in order

---

## Event System

### Event Mappings (for Phone NPCs)

```json
"eventMappings": [
  {
    "eventPattern": "item_picked_up:lockpick",
    "targetKnot": "on_lockpick_pickup",
    "onceOnly": true,
    "cooldown": 0
  },
  {
    "eventPattern": "minigame_completed",
    "targetKnot": "on_lockpick_success",
    "condition": "data.minigameName && data.minigameName.includes('Lockpick')",
    "cooldown": 10000
  },
  {
    "eventPattern": "door_unlocked",
    "targetKnot": "on_door_unlocked",
    "cooldown": 8000
  },
  {
    "eventPattern": "room_entered:ceo",
    "targetKnot": "on_ceo_office_entered",
    "onceOnly": true
  }
]
```

### Available Event Patterns

- `item_picked_up:item_type` - When specific item is picked up
- `item_picked_up:*` - When any item is picked up
- `minigame_completed` - When minigame succeeds
- `minigame_failed` - When minigame fails
- `door_unlocked` - When any door is unlocked
- `door_unlock_attempt` - When door unlock is attempted
- `object_interacted` - When object is interacted with
- `room_entered` - When any room is entered
- `room_entered:room_id` - When specific room is entered
- `room_discovered` - When new room is discovered

### Event Properties

- **eventPattern**: Pattern to match (supports wildcards)
- **targetKnot**: Which Ink knot to jump to
- **condition**: JavaScript condition (optional)
- **onceOnly**: Only trigger once (default: false)
- **cooldown**: Milliseconds before can trigger again
- **maxTriggers**: Maximum number of times can trigger

---

## Best Practices

### Puzzle Design

1. **Provide multiple clues** - Don't rely on single puzzle solution path
2. **Show don't tell** - Let players discover rather than being told
3. **Progressive difficulty** - Start easy, build complexity
4. **Clear feedback** - Let players know when they're on right track
5. **Avoid dead ends** - Always provide way forward

### Narrative Integration

1. **Story justifies puzzles** - Why are these obstacles here?
2. **NPCs provide hints** - Dialogue should guide without spoiling
3. **Environmental storytelling** - Objects and notes tell story
4. **Consistent world** - All elements support the scenario theme

### Technical Constraints

1. **Room connections** - Ensure all connected rooms are defined
2. **Object dependencies** - Verify all required items exist
3. **Lock consistency** - requires field must match available keys/codes
4. **NPC bounds** - Patrol bounds must fit within room
5. **Sprite references** - Use available sprite sheets only

### Performance

1. **Limit NPCs per room** - Max 8-10 NPCs per room
2. **Optimize patrol areas** - Smaller bounds = better performance
3. **Event cooldowns** - Prevent event spam with appropriate cooldowns

---

## Example: Complete Mini-Scenario

```json
{
  "scenario_brief": "Infiltrate the office and recover the stolen data.",
  "startRoom": "lobby",
  "startItemsInInventory": [
    {
      "type": "lockpick",
      "name": "Lock Pick Kit",
      "takeable": true
    }
  ],
  "rooms": {
    "lobby": {
      "type": "room_reception",
      "connections": {
        "north": "office"
      },
      "objects": [
        {
          "type": "notes",
          "name": "Security Code",
          "takeable": true,
          "readable": true,
          "text": "Office safe code: 9573"
        }
      ]
    },
    "office": {
      "type": "room_office",
      "locked": true,
      "lockType": "key",
      "requires": "office_key",
      "keyPins": [100, 50, 0, 150],
      "connections": {
        "south": "lobby"
      },
      "objects": [
        {
          "type": "safe",
          "name": "Wall Safe",
          "takeable": false,
          "locked": true,
          "lockType": "pin",
          "requires": "9573",
          "contents": [
            {
              "type": "notes",
              "name": "Stolen Data",
              "isEndGoal": true,
              "readable": true,
              "text": "You found the stolen data! Mission complete!"
            }
          ]
        }
      ]
    }
  }
}
```

---

## Quick Reference Tables

### Lock Type Summary

| Lock Type | Requires | Tools Needed | Difficulty |
|-----------|----------|--------------|------------|
| key | credential name (key's `opens_lock`) | Key or Lockpick | Varies |
| pin | "1234" | None (or PIN cracker for hints) | Easy |
| password | "password" | None | Easy |
| bluetooth | "bluetooth" | Bluetooth Scanner | Medium |
| rfid | card_id | RFID Cloner | Varies by protocol |
| lockpick | None | Lockpick Kit | Varies |

### Object Type Summary

| Type | Takeable | Containers | Readable | Locked |
|------|----------|------------|----------|--------|
| notes | Usually | No | Yes | No |
| phone | No | No | Yes | No |
| pc | No | Yes | Yes | Usually |
| tablet | Yes | No | No | Usually |
| key | Yes | No | No | No |
| safe | No | Yes | No | Yes |
| suitcase | No | Yes | No | Usually |
| lockpick | Yes | No | No | No |
| rfid_cloner | Yes | No | No | No |
| keycard | Yes | No | No | No |

---

**Last Updated:** 2025-01-17
**Version:** 1.0
**For Questions:** See `docs/GAME_DESIGN.md` or `docs/ROOM_GENERATION.md`
