# Event Mapping: Jump to Knot in Active Conversation

## Overview

When a player is already engaged in a conversation with an NPC and an event occurs (like lockpicking detected in view), the system now **jumps to the target knot within the existing conversation** instead of starting a new conversation.

This creates seamless, reactive dialogue where the NPC can react to events without interrupting or restarting the conversation.

## Implementation

### Changes Made

#### 1. PersonChatMinigame (`js/minigames/person-chat/person-chat-minigame.js`)

Added new `jumpToKnot()` method that allows jumping to any knot while a conversation is active:

```javascript
jumpToKnot(knotName) {
    if (!knotName) {
        console.warn('jumpToKnot: No knot name provided');
        return false;
    }
    
    if (!this.inkEngine || !this.inkEngine.story) {
        console.warn('jumpToKnot: Ink engine not initialized');
        return false;
    }
    
    try {
        console.log(`🎯 PersonChatMinigame.jumpToKnot() - Jumping to: ${knotName}`);
        
        // Jump to the knot
        this.inkEngine.goToKnot(knotName);
        
        // Clear any pending callbacks since we're changing the story
        if (this.autoAdvanceTimer) {
            clearTimeout(this.autoAdvanceTimer);
            this.autoAdvanceTimer = null;
        }
        this.pendingContinueCallback = null;
        
        // Show the new dialogue at the target knot
        this.showCurrentDialogue();
        
        console.log(`✅ Successfully jumped to knot: ${knotName}`);
        return true;
    } catch (error) {
        console.error(`❌ Error jumping to knot ${knotName}:`, error);
        return false;
    }
}
```

**What it does:**
- Takes a knot name as parameter
- Uses the existing `InkEngine.goToKnot()` to navigate to that knot
- Clears any pending timers/callbacks
- Displays the dialogue at the new knot
- Returns success/failure status

#### 2. NPCManager (`js/systems/npc-manager.js`)

Updated `_handleEventMapping()` to detect active conversations and jump instead of starting new ones:

```javascript
// CHECK: Is a conversation already active with this NPC?
const isConversationActive = window.currentConversationNPCId === npcId;
const activeMinigame = window.MinigameFramework?.currentMinigame;
const isPersonChatActive = activeMinigame?.constructor?.name === 'PersonChatMinigame';

if (isConversationActive && isPersonChatActive) {
    // JUMP TO KNOT in the active conversation instead of starting a new one
    console.log(`⚡ Active conversation detected with ${npcId}, jumping to knot: ${config.knot}`);
    
    if (typeof activeMinigame.jumpToKnot === 'function') {
        const jumpSuccess = activeMinigame.jumpToKnot(config.knot);
        if (jumpSuccess) {
            console.log(`✅ Successfully jumped to knot ${config.knot} in active conversation`);
            return;  // Success - exit early
        } else {
            console.warn(`⚠️ Failed to jump to knot, falling back to new conversation`);
        }
    } else {
        console.warn(`⚠️ jumpToKnot method not available on minigame`);
    }
}

// Not in an active conversation OR jump failed - start a new person-chat minigame
console.log(`👤 Starting new person-chat conversation for NPC ${npcId}`);
// ... start new conversation as before
```

**Decision flow:**
1. Check if `window.currentConversationNPCId` matches the NPC that triggered the event
2. Check if the current minigame is `PersonChatMinigame`
3. If both true → Call `jumpToKnot()` and exit
4. If jump fails or conditions not met → Start a new conversation (fallback)

## Usage Example

Scenario: Security guard is talking to player, then player starts lockpicking

### Ink File (security-guard.ink)

```ink
=== on_lockpick_used ===
# speaker:security_guard
Hey! What do you think you're doing with that lock?

* [I was just... looking for something I dropped]
    -> explain_drop
* [Mind your own business]
    -> hostile_response
```

### Scenario JSON

```json
{
  "eventMappings": [
    {
      "eventPattern": "lockpick_used_in_view",
      "targetKnot": "on_lockpick_used",
      "conversationMode": "person-chat",
      "cooldown": 0
    }
  ]
}
```

### Behavior

**Scenario A: Player already in conversation**
1. Player is in conversation with security guard (could be at "hub" or any dialogue)
2. Player uses lockpick → `lockpick_used_in_view` event fires
3. NPCManager detects active conversation with this NPC
4. Calls `jumpToKnot('on_lockpick_used')`
5. Conversation seamlessly switches to the lockpick response
6. Player can continue dialogue from there

**Scenario B: Player not in conversation**
1. Player is in game world, not talking to security guard
2. Player uses lockpick → `lockpick_used_in_view` event fires
3. NPCManager detects no active conversation
4. Starts new person-chat conversation with `startKnot: 'on_lockpick_used'`
5. Conversation opens with the lockpick response

## Benefits

✅ **Seamless reactions** - NPCs react to events without interrupting dialogue flow
✅ **Player context preserved** - If player was in middle of dialogue, they continue after the reaction
✅ **Graceful fallback** - If jump fails, system falls back to starting new conversation
✅ **Reusable knots** - Same `on_lockpick_used` knot works whether starting new conversation or jumping mid-conversation

## Console Output

When working correctly, you'll see in the console:

```
⚡ Active conversation detected with security_guard, jumping to knot: on_lockpick_used
🎯 PersonChatMinigame.jumpToKnot() - Jumping to: on_lockpick_used
🗣️ showCurrentDialogue - result.text: "Hey! What do you think you're doing..." (58 chars)
✅ Successfully jumped to knot: on_lockpick_used
```

## Testing

### Test Case 1: Jump While in Conversation

1. Start conversation with security guard (scenario_select.html)
2. Navigate to some dialogue option
3. While still in conversation, trigger lockpick event
4. Expect: Conversation jumps to `on_lockpick_used` knot

### Test Case 2: Start New Conversation with Event Knot

1. In game world, NOT in conversation with security guard
2. Use lockpicking nearby security guard
3. Expect: New conversation starts directly at `on_lockpick_used` knot

### Test Case 3: Fallback to New Conversation

1. Start conversation with Security Guard
2. Manually create scenario where `jumpToKnot` would fail (or remove method)
3. Trigger lockpick event
4. Expect: System detects jump failure and falls back to starting new conversation

## Related Files

- `js/minigames/person-chat/person-chat-minigame.js` - `jumpToKnot()` implementation
- `js/systems/npc-manager.js` - Event mapping handler with jump logic
- `js/systems/ink/ink-engine.js` - `goToKnot()` method (called by jumpToKnot)
- `scenarios/npc-patrol-lockpick.json` - Example scenario with eventMappings

## Future Enhancements

- [ ] Add transition animations when jumping to knots
- [ ] Track which knots were jumped to vs. naturally reached (for analytics)
- [ ] Add option to dismiss event reactions and continue current dialogue
- [ ] Support nested knot jumps (jumping within a jumped knot)
