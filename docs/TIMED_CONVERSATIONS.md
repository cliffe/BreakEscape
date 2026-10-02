# Timed Conversations for Person NPCs

## Overview

The **Timed Conversation** feature allows you to automatically trigger a person-to-person conversation with an NPC after a specified delay. This is similar to `timedMessages` for phone NPCs, but instead of a text message, it automatically opens the person-chat minigame and navigates to a specific conversation knot.

### Use Cases

- **Opening sequences**: Automatically start a dialogue when a scenario loads
- **Scripted conversations**: Trigger a cutscene-like conversation after the player enters a room
- **Delayed reactions**: Have an NPC approach the player after a delay with a specific message
- **Story progression**: Advance the narrative with timed character interactions

---

## Configuration

### Basic Structure

Add a `timedConversation` property to any person NPC in your scenario JSON:

```json
{
  "id": "test_npc_back",
  "displayName": "Back NPC",
  "npcType": "person",
  "position": { "x": 6, "y": 8 },
  "spriteSheet": "hacker",
  "storyPath": "scenarios/ink/test2.json",
  "currentKnot": "hub",
  "timedConversation": {
    "delay": 3000,
    "targetKnot": "group_meeting"
  }
}
```

### Properties

- **`delay`** (number, milliseconds): How long to wait before opening the conversation
  - `0` = immediately when scenario loads
  - `3000` = 3 seconds
  - `60000` = 1 minute
  
- **`targetKnot`** (string): The Ink knot to navigate to when the conversation opens
  - Must exist in the NPC's story file
  - The conversation will start at this knot instead of the default `currentKnot`

---

## Complete Example

### Scenario JSON

**File:** `scenarios/my-scenario.json`

```json
{
  "scenario_brief": "A test scenario with timed NPC conversation",
  "startRoom": "meeting_room",
  
  "player": {
    "id": "player",
    "displayName": "Agent 0x00",
    "spriteSheet": "hacker"
  },
  
  "rooms": {
    "meeting_room": {
      "type": "room_office",
      "connections": {},
      "npcs": [
        {
          "id": "colleague",
          "displayName": "Junior Agent",
          "npcType": "person",
          "position": { "x": 4, "y": 5 },
          "spriteSheet": "hacker-red",
          "storyPath": "scenarios/ink/colleague.json",
          "currentKnot": "idle",
          "timedConversation": {
            "delay": 5000,
            "targetKnot": "briefing"
          }
        }
      ]
    }
  }
}
```

### Ink Story

**File:** `scenarios/ink/colleague.ink`

```ink
VAR briefing_given = false

=== idle ===
# speaker:npc:colleague
Hey, I'm just waiting around for now.
-> END

=== briefing ===
# speaker:npc:colleague
Agent! I've been briefed on the situation. We need to discuss the plan.
~ briefing_given = true
-> main_menu

=== main_menu ===
+ [Tell me more about the situation] -> explain_situation
+ [What do you need from me?] -> ask_help
+ [Let's get moving] -> END

=== explain_situation ===
# speaker:npc:colleague
We've got a security breach in the east wing. Three suspects, two exit routes.
-> main_menu

=== ask_help ===
# speaker:npc:colleague
I need you to help me secure the perimeter while I investigate the breach.
-> main_menu
```

---

## How It Works

### Initialization Flow

1. **Game starts** → `initializeGame()` is called
2. **NPCManager created** → `window.npcManager = new NPCManager(...)`
3. **Timed messages started** → `window.npcManager.startTimedMessages()`
   - This starts a timer that checks every 1 second
4. **Scenario loads** → NPCs are registered via `registerNPC(npcDef)`
5. **NPCManager detects `timedConversation`** → Calls `scheduleTimedConversation()`

### Trigger Flow

1. **Timer ticks** → Every 1 second, `_checkTimedMessages()` runs
2. **Time threshold reached** → If `elapsed >= conversation.triggerTime`:
   - `_deliverTimedConversation()` is called
   - Updates NPC's `currentKnot` to `targetKnot`
   - Opens person-chat minigame via `MinigameFramework.startMinigame('person-chat', ...)`
3. **Conversation opens** → Player sees the person-chat UI at the specified knot

---

## API Reference

### NPCManager Methods

#### `scheduleTimedConversation(opts)`

Manually schedule a timed conversation (usually called automatically from `registerNPC`).

**Parameters:**
```javascript
{
  npcId: string,        // ID of the person NPC
  targetKnot: string,   // Ink knot to navigate to
  delay?: number,       // Milliseconds from now (if triggerTime not provided)
  triggerTime?: number  // Milliseconds from game start (if delay not provided)
}
```

**Example:**
```javascript
window.npcManager.scheduleTimedConversation({
  npcId: 'colleague',
  targetKnot: 'briefing',
  delay: 5000
});
```

#### `_deliverTimedConversation(conversation)`

Internal method called when a timed conversation is ready to trigger. Opens the person-chat minigame.

---

## Implementation Details

### Code Changes

**File:** `js/systems/npc-manager.js`

**Constructor:** Added `this.timedConversations = []` to track scheduled conversations

**`registerNPC()`:** Added code to detect and schedule `timedConversation` property:
```javascript
if (entry.timedConversation) {
  this.scheduleTimedConversation({
    npcId: realId,
    targetKnot: entry.timedConversation.targetKnot,
    delay: entry.timedConversation.delay
  });
}
```

**`_checkTimedMessages()`:** Updated to also check timed conversations:
```javascript
for (const conversation of this.timedConversations) {
  if (!conversation.delivered && elapsed >= conversation.triggerTime) {
    this._deliverTimedConversation(conversation);
    conversation.delivered = true;
  }
}
```

**New Method: `_deliverTimedConversation()`:** 
- Updates NPC's `currentKnot` to match `targetKnot`
- Calls `window.MinigameFramework.startMinigame('person-chat', null, { npcId, title })`
- Logs the action for debugging

### Integration Points

- **NPCManager:** Handles scheduling and delivery
- **MinigameFramework:** Opens the person-chat minigame
- **PersonChatMinigame:** Uses the updated `currentKnot` to start at the correct conversation point
- **Game initialization:** `startTimedMessages()` is already called in `js/main.js:87`

---

## Comparison: Timed Messages vs Timed Conversations

| Feature | Timed Messages | Timed Conversations |
|---------|---|---|
| NPC Type | Phone NPCs | Person NPCs |
| Result | Bark + message notification | Automatic minigame open |
| Display | Phone chat minigame | Person-chat minigame |
| Interaction | Player clicks bark to open chat | Chat opens automatically |
| Use Case | Reactive notifications | Scripted sequences |
| Config Property | `timedMessages` (array) | `timedConversation` (object) |

---

## Best Practices

### 1. Design Your Conversation Flow

Always have a main menu knot that conversations return to:

```ink
=== briefing ===
# speaker:npc:colleague
Here's the mission briefing...
-> main_menu

=== main_menu ===
+ [Ask about details] -> details
+ [Ready to go] -> END
```

### 2. Account for Timed Conversation Delays

When designing your scenario, consider:
- Total elapsed time before conversation appears
- Player may not be ready (still learning controls)
- Consider adding text/UI guidance beforehand

### 3. Use Delays Appropriately

- **0-2 seconds:** Immediate (feels abrupt but useful for sequential conversations)
- **3-5 seconds:** Short delay (allows player to orient themselves)
- **10+ seconds:** Long delay (gives player time to explore before scripted event)

### 4. Combine with Events

You can also trigger conversations through game events instead of just time delays:

```json
"eventMappings": [
  {
    "eventPattern": "room_entered:briefing_room",
    "targetKnot": "briefing",
    "bark": "Agent, we need to talk!"
  }
]
```

---

## Debugging

### Enable NPC Debug Mode

```javascript
window.NPC_DEBUG = true;  // In browser console
```

This will log all timed conversation scheduling and delivery.

### Check Scheduled Conversations

```javascript
console.log(window.npcManager.timedConversations);
```

Shows all pending timed conversations with their status.

### Verify NPC Registration

```javascript
console.log(window.npcManager.getNPC('colleague'));
```

Shows the NPC object, including the `timedConversation` property.

---

## Test Scenario

See `scenarios/npc-sprite-test2.json` for a working example where:
- `test_npc_back` automatically opens a conversation after 3 seconds
- Conversation starts at the `group_meeting` knot
- Player can interact with multiple NPCs in the dialogue

To test:
```
Open: http://localhost:8000/index.html?scenario=npc-sprite-test2
Wait 3 seconds for automatic conversation to open
```

---

## Troubleshooting

### Conversation Doesn't Open

1. Check browser console for errors
2. Verify `MinigameFramework` is available: `console.log(window.MinigameFramework)`
3. Confirm NPC ID matches: `console.log(window.npcManager.getNPC('npcId'))`
4. Verify targetKnot exists in Ink story

### Conversation Opens at Wrong Knot

1. Verify `targetKnot` spelling matches Ink file
2. Check that knot exists in compiled JSON (not just `.ink` source)
3. Ensure JSON was recompiled after Ink changes

### Timer Not Running

1. Verify `window.npcManager.startTimedMessages()` was called
2. Check `window.npcManager.timerInterval` is not null
3. Verify game time is advancing (check `window.npcManager.gameStartTime`)

---

## Limitations & Future Enhancements

### Current Limitations

- Only one `timedConversation` per NPC (can add multiple via `scheduleTimedConversation()` API)
- Uses global timer (all timed events checked once per second)
- No built-in "wait for user input" before triggering

### Potential Enhancements

- Support multiple conversations per NPC with conditions
- Trigger on specific player actions (e.g., "when player approaches NPC")
- Cinematic camera focus before opening conversation
- Animation/transition effects when opening timed conversation

