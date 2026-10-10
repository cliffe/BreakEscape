# NPC Integration Guide

A comprehensive guide for integrating NPCs into Break Escape scenarios. This document explains how to create Ink stories, structure conversation knots, hook up game events, and configure NPCs in scenario JSON files.

## Table of Contents
1. [Overview](#overview)
2. [Creating the Ink Story](#creating-the-ink-story)
3. [Structuring Conversation Knots](#structuring-conversation-knots)
4. [Event-Triggered Barks](#event-triggered-barks)
5. [Configuring NPCs in Scenario JSON](#configuring-npcs-in-scenario-json)
6. [Available Game Events](#available-game-events)
7. [Best Practices](#best-practices)
8. [Testing Your NPC](#testing-your-npc)

---

## Overview

Break Escape NPCs use the Ink narrative scripting language for conversations and event-driven reactions. The NPC system supports:

- **Full conversations** with branching dialogue choices
- **Event-triggered barks** (short messages) that react to player actions
- **State management** using Ink variables for trust, progression, etc.
- **Action tags** (`# unlock_door:id`, `# give_item:id`) to trigger game effects
- **Conditional logic** for dynamic responses based on game state

NPCs communicate through the phone chat minigame interface, appearing as contacts in the player's phone.

---

## Quick Start: Adding NPCs to Your Scenario

Before diving into Ink scripting, you need to set up three things in your scenario JSON:

### 1. Add the Phone to Player's Inventory

NPCs are accessed through the player's phone, so add it to `startItemsInInventory`:

```json
{
  "startItemsInInventory": [
    {
      "type": "phone",
      "name": "Your Phone",
      "takeable": true,
      "phoneId": "player_phone",
      "npcIds": ["helper_contact", "tech_support", "informant"],
      "observations": "Your personal phone with some interesting contacts"
    }
  ]
}
```

**Phone Properties**:
- **`type`**: Must be `"phone"` for the game to recognize it
- **`name`**: Display name shown in inventory
- **`takeable`**: Set to `true` (phone is portable)
- **`phoneId`**: Unique identifier (typically `"player_phone"`)
- **`npcIds`**: Array of NPC IDs that appear as contacts in this phone
- **`observations`**: Description shown when examining the phone

### 2. Configure NPCs in the Scenario

Add an `npcs` array at the root level of your scenario JSON:

```json
{
  "scenario_brief": "Your mission...",
  "startRoom": "lobby",
  "startItemsInInventory": [ /* phone with npcIds */ ],
  "npcs": [
    {
      "id": "helper_contact",
      "name": "Helpful Contact",
      "storyPath": "scenarios/ink/helper-npc.json",
      "phoneNumber": "555-0123",
      "description": "A friendly insider who can help you",
      "startingState": "available",
      "phoneId": "player_phone",
      "npcType": "phone",
      "eventMappings": [ /* covered later */ ]
    }
  ]
}
```

**Critical NPC Properties**:
- **`id`**: Must match an entry in the phone's `npcIds` array
- **`phoneId`**: Must match the `phoneId` of the phone item (e.g., `"player_phone"`)
- **`npcType`**: Set to `"phone"` for phone-based NPCs
- **`storyPath`**: Path to compiled Ink JSON file (not `.ink` file!)

### 3. Create and Compile the Ink Story

Create your Ink story file (covered in detail below), then compile it to JSON:

```bash
cd scenarios/ink
/path/to/inklecate -j -o helper-npc.json helper-npc.ink
```

**Important**: The `storyPath` in your scenario JSON must point to the `.json` file, not the `.ink` source file.

---

## Creating the Ink Story

### 1. Create the Ink File

Create a new `.ink` file in `scenarios/ink/` directory:

```ink
// my-npc.ink
// Description of the NPC's role and personality

// State variables - track progression and decisions
VAR trust_level = 0
VAR has_unlocked_door = false
VAR has_given_item = false
```

### 2. Define the Entry Points

Every Ink story needs a properly structured start flow to avoid repeating messages:

```ink
// State variable to track if greeting has been shown
VAR has_greeted = false

// Initial entry point - shows greeting once, then goes to menu
=== start ===
{ has_greeted:
    -> main_menu
- else:
    Hello! I'm here to help you with your mission. 👋
    How are things going?
    ~ has_greeted = true
    -> main_menu
}

// Main menu - shown when returning to conversation
=== main_menu ===
+ [Ask for help] -> ask_help
+ [Request an item] -> request_item
+ [Say goodbye] -> goodbye
```

**Key Pattern for Avoiding Repeated Messages**: 
- Add a `has_greeted` variable at the top of your Ink file
- `start` knot checks if greeting has been shown:
  - If already greeted, skip directly to `main_menu`
  - If not greeted, show greeting text, set `has_greeted = true`, then go to `main_menu`
- `main_menu` presents only choices (no text) since conversation history shows all previous messages
- All conversation knots redirect to `main_menu` (not `start`) to avoid re-triggering the greeting
- Event-triggered barks also redirect to `main_menu` for seamless conversation continuation

**Why This Works**:
- First contact: Player sees greeting, then choices
- After barks: Player sees bark message (in history), then choices - no repeated greeting
- Reopening conversation: Player sees full history, then choices - no repeated greeting
- The greeting appears in conversation history but never repeats as a new message

---

## Structuring Conversation Knots

### Basic Conversation Knot

```ink
=== ask_help ===
{ trust_level >= 1:
    I can help you! What do you need?
    ~ trust_level = trust_level + 1
- else:
    I don't know you well enough yet. Talk to me more first.
}
-> main_menu
```

### Knot with Action Tags

Use `#` tags to trigger game effects:

```ink
=== unlock_door_for_player ===
{ trust_level >= 2:
    Alright, I'll unlock that door for you.
    ~ has_unlocked_door = true
    # unlock_door:office_door
    There you go! It's open now. 🚪
- else:
    I need to trust you more before I can do that.
}
-> main_menu
```

**Available Action Tags**:
- `# unlock_door:doorId` - Unlocks a specific door
- `# give_item:itemType` - Adds item to player's inventory

### Conditional Choices

Show choices only when conditions are met:

```ink
=== main_menu ===
+ [Ask for help] -> ask_help
+ {trust_level >= 1} [Request special item] -> give_special_item
+ {has_given_item} [Thanks for the item!] -> thank_you
+ [Goodbye] -> goodbye
```

### Ending Conversations

```ink
=== goodbye ===
Good luck out there! Contact me if you need anything.
-> END
```

---

## Event-Triggered Barks

Barks are short messages triggered automatically by game events. They appear as notifications and clicking them opens the full conversation.

### Creating Bark Knots

```ink
// ==========================================
// EVENT-TRIGGERED BARKS
// These knots are triggered automatically by the NPC system
// Note: These redirect to 'main_menu' so clicking the bark opens full conversation
// ==========================================

// Triggered when player unlocks a door
=== on_door_unlocked ===
{ has_unlocked_door:
    Another door open! You're doing great. 🚪✓
- else:
    Nice! You got through that door.
}
-> main_menu

// Triggered when player picks up an item
=== on_item_pickup ===
Good find! That could be useful for your mission. 📦
-> main_menu

// Triggered when player completes a minigame
=== on_minigame_complete ===
Excellent work on that challenge! 🎯
~ trust_level = trust_level + 1
-> main_menu
```

**Critical Bark Patterns**:
1. ✅ **Always redirect to `main_menu`** (not `start` or `END`)
2. ✅ Keep messages short (1-2 lines)
3. ✅ Use emojis for visual interest
4. ✅ Can update variables (`~ trust_level = trust_level + 1`)
5. ✅ Can use conditional logic to vary messages

**Common Mistakes**:
- ❌ Redirecting to `start` - causes greeting to repeat
- ❌ Using `-> END` - prevents conversation from continuing
- ❌ Long messages - barks should be brief notifications

**Important: Avoiding Repeated Greetings**

When a bark redirects to `main_menu` (not `start`), the conversation flow works like this:

1. Player performs action (e.g., enters a room)
2. Bark notification appears with contextual message
3. Player clicks the bark to open conversation
4. Conversation shows:
   - Original greeting (in history)
   - Bark message (just clicked)
   - Menu choices (from `main_menu`)
5. **No repeated greeting** because we skipped the `start` knot

If barks redirect to `start`, the `has_greeted` check prevents re-showing the greeting text, but it's cleaner to go straight to `main_menu`.

---

## Configuring NPCs in Scenario JSON

### Complete NPC Configuration

Each NPC in the `npcs` array requires the following properties:

```json
{
  "id": "helper_contact",
  "name": "Helpful Contact",
  "storyPath": "scenarios/ink/helper-npc.json",
  "phoneNumber": "555-0123",
  "description": "A friendly insider who can help you",
  "startingState": "available",
  "phoneId": "player_phone",
  "npcType": "phone",
  "eventMappings": [
    {
      "eventPattern": "door_unlocked",
      "targetKnot": "on_door_unlocked",
      "cooldown": 30000
    }
  ]
}
```

**NPC Property Reference**:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | string | ✅ | Unique NPC identifier, must match entry in phone's `npcIds` array |
| `name` | string | ✅ | Display name shown in phone contacts list |
| `storyPath` | string | ✅ | Path to compiled Ink JSON file (e.g., `"scenarios/ink/npc-name.json"`) |
| `phoneNumber` | string | ✅ | Phone number displayed in contact (e.g., `"555-0123"`) |
| `description` | string | ✅ | Brief description of NPC shown in contact details |
| `startingState` | string | ✅ | Initial availability (`"available"`, `"locked"`, or `"hidden"`) |
| `phoneId` | string | ✅ | Must match the `phoneId` of the phone item containing this NPC |
| `npcType` | string | ✅ | Set to `"phone"` for phone-based NPCs |
| `eventMappings` | array | ❌ | Array of event-to-bark mappings (see Event Mapping section) |

**Starting State Options**:
- `"available"` - NPC appears in contacts immediately and can be contacted
- `"locked"` - NPC appears but cannot be contacted until unlocked by game event
- `"hidden"` - NPC doesn't appear until revealed by game event

### Linking NPCs to Phones

For NPCs to appear in a phone, **both** the phone item and NPC config must reference each other:

**In the phone item** (`startItemsInInventory`):
```json
{
  "type": "phone",
  "phoneId": "player_phone",
  "npcIds": ["helper_contact", "tech_support"]
}
```

**In each NPC config** (`npcs` array):
```json
{
  "id": "helper_contact",
  "phoneId": "player_phone"
}
```

This two-way linkage ensures NPCs appear in the correct phone and allows for scenarios with multiple phones.

### Event Mapping Configuration

Each event mapping connects a game event to an Ink knot:

```json
{
  "eventPattern": "room_entered:ceo",
  "targetKnot": "on_ceo_office_entered",
  "cooldown": 15000,
  "maxTriggers": 1,
  "condition": "data.firstVisit === true"
}
```

**Event Mapping Properties**:

- **`eventPattern`** (required): Event name to listen for
  - Can use wildcards: `item_picked_up:*` matches any item
  - Can be specific: `room_entered:ceo` matches only CEO room

- **`targetKnot`** (required): Name of Ink knot to trigger (without `===`)

- **`cooldown`** (optional): Milliseconds before this bark can trigger again
  - Default: 0 (can trigger immediately)
  - Recommended: 10000-30000 for most barks

- **`maxTriggers`** (optional): Maximum times this bark can ever trigger
  - Default: unlimited
  - Use `1` for one-time reactions
  - Use `3-5` to avoid spam on repeated actions

- **`condition`** (optional): JavaScript expression that must evaluate to `true`
  - Has access to `data` object from event
  - Example: `"data.objectType === 'desk_ceo'"`
  - Example: `"data.firstVisit === true"`

- **`onceOnly`** (optional): Shorthand for `"maxTriggers": 1`
  - Use for unique milestone reactions

### 3. Compile Ink to JSON

After creating/editing your `.ink` file, compile it:

```bash
cd scenarios/ink
/path/to/inklecate -j -o my-npc.json my-npc.ink
```

The JSON file is what gets loaded by the game engine.

---

## Available Game Events

### Player Actions

| Event Pattern | Data Properties | Description |
|--------------|-----------------|-------------|
| `item_picked_up:*` | `itemType`, `itemName` | Player picks up any item |
| `item_picked_up:lockpick_set` | `itemType`, `itemName` | Player picks up specific item type |
| `object_interacted` | `objectType`, `objectName` | Player interacts with object |

### Room Navigation

| Event Pattern | Data Properties | Description |
|--------------|-----------------|-------------|
| `room_entered` | `roomId`, `previousRoom`, `firstVisit` | Player enters any room |
| `room_entered:ceo` | `roomId`, `previousRoom`, `firstVisit` | Player enters specific room |
| `room_discovered` | `roomId`, `previousRoom` | Player enters room for first time |
| `room_exited` | `roomId`, `nextRoom` | Player leaves a room |

### Unlocking & Doors

| Event Pattern | Data Properties | Description |
|--------------|-----------------|-------------|
| `door_unlocked` | `doorId`, `targetRoom`, `unlockMethod` | Any door unlocked |
| `door_unlock_attempt` | `doorId`, `success` | Player tries to unlock door |
| `item_unlocked` | `objectType`, `objectName`, `unlockMethod` | Container/object unlocked |

### Minigames

| Event Pattern | Data Properties | Description |
|--------------|-----------------|-------------|
| `minigame_completed` | `minigameType`, `success`, `data` | Minigame finished successfully |
| `minigame_completed:lockpicking` | `minigameType`, `success`, `data` | Specific minigame completed |
| `minigame_failed` | `minigameType`, `reason` | Minigame failed |

### Example Event Mappings

```json
{
  "eventMappings": [
    {
      "eventPattern": "item_picked_up:lockpick_set",
      "targetKnot": "on_lockpick_pickup",
      "cooldown": 5000,
      "onceOnly": true
    },
    {
      "eventPattern": "minigame_completed:lockpicking",
      "targetKnot": "on_lockpick_success",
      "cooldown": 20000
    },
    {
      "eventPattern": "room_discovered",
      "targetKnot": "on_room_discovered",
      "cooldown": 15000,
      "maxTriggers": 5
    },
    {
      "eventPattern": "object_interacted",
      "targetKnot": "on_ceo_desk_interact",
      "condition": "data.objectType === 'desk_ceo'",
      "cooldown": 10000
    }
  ]
}
```

---

## Best Practices

### Conversation Design

1. **Use clear variable names**: `trust_level`, `has_given_keycard`, `knows_secret`
2. **Always add `has_greeted` variable**: Prevents repeated greetings across sessions
3. **Gate important actions behind trust**: Players should build rapport before getting help
4. **Provide multiple conversation paths**: Not everyone plays the same way
5. **Use emojis sparingly**: They add personality but shouldn't overwhelm
6. **Keep initial greeting brief**: Players want to get to choices quickly
7. **Check `has_greeted` in start knot**: Skip directly to `main_menu` if already greeted

### Bark Design

1. **Keep barks short**: 1-2 sentences maximum
2. **Make barks contextual**: Reference what the player just did
3. **Use cooldowns**: Prevent spam (15-30 seconds typically)
4. **Limit repetition**: Use `maxTriggers` to cap how many times a bark can appear
5. **Vary messages**: Use conditionals to show different reactions based on state
6. **Always redirect to main_menu**: Never use `-> start` or `-> END` in bark knots

### Event Mapping Strategy

1. **Start with key milestones**: First item pickup, entering important rooms
2. **Add context-specific reactions**: Different messages for different rooms/items
3. **Use conditions for precision**: `data.objectType === 'specific_object'`
4. **Balance frequency**: Too many barks = annoying, too few = feels disconnected
5. **Test trigger limits**: Use `maxTriggers` to prevent spam on repeated actions

### State Management

1. **Track important decisions**: Variables for what player has learned/received
2. **Use trust/reputation systems**: Let player build relationship over time
3. **Reference past actions**: Show the NPC remembers previous interactions
4. **Unlock new options**: Add conditional choices as trust increases

---

## Testing Your NPC

### 1. Verify Compilation

```bash
cd scenarios/ink
/path/to/inklecate -j -o your-npc.json your-npc.ink
```

Should output:
```json
{"compile-success": true}
{"issues":[]}
```

### 2. Check Scenario Configuration

- NPC listed in `npcs` array
- `storyPath` points to compiled `.json` file (not `.ink`)
- All event mappings reference valid knot names
- Event patterns match available game events

### 3. In-Game Testing

**Test Initial Contact**:
1. Open phone
2. Find NPC in contacts
3. Verify greeting appears
4. Check all conversation choices work

**Test Event-Triggered Barks**:
1. Perform actions that should trigger barks (pick up item, unlock door, etc.)
2. Verify bark notification appears
3. Click bark to open conversation
4. Ensure conversation continues from bark (no repeated greeting)
5. Test cooldowns (same action twice quickly)
6. Test maxTriggers (repeat action beyond limit)

**Test Conditional Logic**:
1. Try choices that require trust before building trust
2. Build trust through conversation
3. Verify new choices appear
4. Test action tags (door unlocking, item giving)

### 4. Common Issues

**Barks repeat greeting when clicked**:
- ❌ Bark knot uses `-> start`
- ✅ Change to `-> main_menu`

**Bark prevents conversation from continuing**:
- ❌ Bark knot uses `-> END`
- ✅ Change to `-> main_menu`

**Events not triggering barks**:
- Check `eventPattern` matches actual event name
- Verify event is being emitted (check browser console with debug on)
- Check cooldown hasn't blocked the bark
- Verify condition evaluates to true

**Compilation errors**:
- Check for duplicate `===` knot declarations
- Ensure all knots have at least one line of content
- Verify all `->` redirects point to valid knot names
- Check for unmatched braces in conditional logic

---

## Example: Complete NPC Implementation

### File: `scenarios/ink/mentor-npc.ink`

```ink
// mentor-npc.ink
// An experienced security professional guiding the player

VAR trust_level = 0
VAR has_given_advice = false
VAR mission_briefed = false
VAR rooms_discovered = 0
VAR has_greeted = false

=== start ===
{ has_greeted:
    -> main_menu
- else:
    Hey, I'm glad you're on this case. This is going to be tricky. 🕵️
    Let me know if you need guidance.
    ~ has_greeted = true
    -> main_menu
}

=== main_menu ===
+ [What should I be looking for?] -> mission_briefing
+ [Can you give me some advice?] -> get_advice
+ {trust_level >= 2} [I need help with the server room] -> server_room_help
+ [I'll check back later] -> goodbye

=== mission_briefing ===
{ mission_briefed:
    Remember: find evidence of the data breach, avoid detection, get out clean.
    -> main_menu
- else:
    Your objective is to find evidence of the data breach without getting caught.
    Look for documents, logs, anything that proves what happened.
    ~ mission_briefed = true
    ~ trust_level = trust_level + 1
    -> main_menu
}

=== get_advice ===
{ has_given_advice:
    I told you - check the CEO's computer and look for financial records.
    -> main_menu
- else:
    My sources say the CEO's office has what you need.
    But you'll need to get through security first.
    ~ has_given_advice = true
    ~ trust_level = trust_level + 1
    -> main_menu
}

=== server_room_help ===
The server room door has a biometric lock. You'll need an authorized fingerprint.
Try to find a way to lift prints from someone with access.
# unlock_door:server_room
Actually, I just remotely disabled that lock for you. Move quickly! ⚡
~ trust_level = trust_level + 2
-> main_menu

=== goodbye ===
Stay safe. Contact me if things get dicey.
-> END

// ==========================================
// EVENT-TRIGGERED BARKS
// ==========================================

=== on_first_item ===
Good thinking! Collecting evidence is key. 📋
-> main_menu

=== on_room_discovered ===
~ rooms_discovered = rooms_discovered + 1
{ rooms_discovered >= 3:
    You're doing great exploring! Keep mapping out the building. 🗺️
- else:
    Nice, you found a new area. Stay alert. 👀
}
-> main_menu

=== on_lockpick_success ===
{ trust_level >= 1:
    Impressive lockpicking! You've got skills. 🔓
- else:
    You picked that lock? Interesting... you're more capable than I thought.
    ~ trust_level = trust_level + 1
}
-> main_menu

=== on_security_alert ===
Careful! Security might be onto you. Lay low for a bit. 🚨
-> main_menu
```

### File: `scenarios/my_mission.json` (excerpt)

```json
{
  "scenario_brief": "Infiltrate the corporation and find evidence of the data breach",
  "startRoom": "lobby",
  "startItemsInInventory": [
    {
      "type": "phone",
      "name": "Your Phone",
      "takeable": true,
      "phoneId": "player_phone",
      "npcIds": ["mentor"],
      "observations": "Your personal phone with a secure contact"
    }
  ],
  "npcs": [
    {
      "id": "mentor",
      "name": "The Mentor",
      "storyPath": "scenarios/ink/mentor-npc.json",
      "phoneNumber": "555-0199",
      "description": "Your experienced contact",
      "startingState": "available",
      "phoneId": "player_phone",
      "npcType": "phone",
      "eventMappings": [
        {
          "eventPattern": "item_picked_up:*",
          "targetKnot": "on_first_item",
          "onceOnly": true
        },
        {
          "eventPattern": "room_discovered",
          "targetKnot": "on_room_discovered",
          "cooldown": 20000,
          "maxTriggers": 5
        },
        {
          "eventPattern": "minigame_completed:lockpicking",
          "targetKnot": "on_lockpick_success",
          "cooldown": 30000
        },
        {
          "eventPattern": "security_alert",
          "targetKnot": "on_security_alert",
          "cooldown": 60000
        }
      ]
    }
  ]
}
```

---

## Summary Checklist

When integrating a new NPC:

**Scenario Setup**:
- [ ] Add phone item to `startItemsInInventory` with `phoneId` and `npcIds` array
- [ ] Add NPC to scenario's `npcs` array
- [ ] Ensure NPC's `id` matches entry in phone's `npcIds` array
- [ ] Ensure NPC's `phoneId` matches phone item's `phoneId`
- [ ] Set NPC's `npcType` to `"phone"`
- [ ] Configure `startingState` (`"available"`, `"locked"`, or `"hidden"`)

**Ink Story Creation**:
- [ ] Create `.ink` file in `scenarios/ink/`
- [ ] Define state variables at top of file
- [ ] Add `has_greeted` variable to prevent repeated greetings
- [ ] Create `start` knot with greeting + `has_greeted` check
- [ ] Create `main_menu` knot with choices (no repeated text)
- [ ] Create conversation knots that redirect to `main_menu`
- [ ] Create event-triggered bark knots (also redirect to `main_menu`)
- [ ] Use action tags (`# unlock_door:id`, `# give_item:id`) where needed
- [ ] Compile Ink to JSON using inklecate
- [ ] Verify `storyPath` in scenario points to compiled `.json` file

**Event Configuration**:
- [ ] Add event mappings to NPC config in scenario JSON
- [ ] Configure appropriate cooldowns and maxTriggers for each event
- [ ] Add conditions for context-specific barks

**Testing**:
- [ ] Test initial conversation in-game
- [ ] Verify NPC appears in phone contacts
- [ ] Test all event-triggered barks
- [ ] Verify bark-to-conversation flow works smoothly
- [ ] Check conditional logic and state changes
- [ ] Test action tags (door unlocking, item giving)

---

## Additional Resources

- **Ink Documentation**: https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md
- **Example NPCs**: See `scenarios/ink/helper-npc.ink` for complete working example
- **Event Reference**: See `js/systems/event-dispatcher.js` for all available events
- **NPC Manager Code**: See `js/systems/npc-manager.js` for implementation details

---

**Last Updated**: Phase 4 Implementation Complete (Event-Driven NPC Reactions)
