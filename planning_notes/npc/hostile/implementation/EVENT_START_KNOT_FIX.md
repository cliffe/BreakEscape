# Event-Triggered Start Knot Fix

## Problem

When an event-triggered conversation was started (via `NPCManager._handleEventMapping()`), the PersonChatMinigame would ignore the `startKnot` parameter that was passed. Instead, it would:

1. Check if a previous conversation state existed in `npcConversationStateManager`
2. If found, restore to that previous state instead of jumping to the event knot
3. If not found, start from the default `start` knot

This meant that event responses (like `on_lockpick_used`) would never be displayed - the conversation would either restore to an old state or start from the beginning.

**Root Cause:** The `PersonChatMinigame.startConversation()` method had no logic to check for or use the `startKnot` parameter that was being passed from `NPCManager`.

## Solution

### Change 1: Store startKnot in Constructor (Line 53)

```javascript
this.startKnot = params.startKnot; // Optional knot to jump to (used for event-triggered conversations)
```

Store the `startKnot` parameter passed from `NPCManager` as an instance variable for later use.

### Change 2: Skip State Restoration When startKnot Provided (Lines 315-340)

**Before:**
```javascript
// Restore previous conversation state if it exists
const stateRestored = npcConversationStateManager.restoreNPCState(
    this.npcId, 
    this.inkEngine.story
);

if (stateRestored) {
    this.conversation.storyEnded = false;
    console.log(`🔄 Continuing previous conversation with ${this.npcId}`);
} else {
    const startKnot = this.npc.currentKnot || 'start';
    this.conversation.goToKnot(startKnot);
    console.log(`🆕 Starting new conversation with ${this.npcId}`);
}
```

**After:**
```javascript
// If a startKnot was provided (event-triggered conversation), jump directly to it
// This skips state restoration and goes straight to the event response
if (this.startKnot) {
    console.log(`⚡ Event-triggered conversation: jumping directly to knot: ${this.startKnot}`);
    this.conversation.goToKnot(this.startKnot);
} else {
    // Otherwise, restore previous conversation state if it exists
    const stateRestored = npcConversationStateManager.restoreNPCState(
        this.npcId, 
        this.inkEngine.story
    );
    
    if (stateRestored) {
        this.conversation.storyEnded = false;
        console.log(`🔄 Continuing previous conversation with ${this.npcId}`);
    } else {
        const startKnot = this.npc.currentKnot || 'start';
        this.conversation.goToKnot(startKnot);
        console.log(`🆕 Starting new conversation with ${this.npcId}`);
    }
}
```

**Logic:**
1. Check if `this.startKnot` was provided (set by NPCManager for event-triggered conversations)
2. If yes: **Jump directly to that knot** - bypassing state restoration entirely
3. If no: **Use existing logic** - restore state if available, otherwise start from default

## Impact

### For Event-Triggered Conversations

When `NPCManager._handleEventMapping()` detects a lockpick event with `config.knot = 'on_lockpick_used'`:

1. It calls: `window.MinigameFramework.startMinigame('person-chat', null, { npcId, startKnot: 'on_lockpick_used', ... })`
2. PersonChatMinigame constructor receives this and stores: `this.startKnot = 'on_lockpick_used'`
3. When `startConversation()` runs, it sees `this.startKnot` and **immediately jumps to that knot**
4. Player sees the event response dialogue (e.g., "Hey! What do you think you're doing with that lock?")

### For Normal Conversations

When a player starts a normal conversation (no event):

1. `startKnot` is undefined
2. Code falls through to the original logic
3. State is restored if available (for conversation continuation)
4. Otherwise starts from the default knot

## Console Output Example

**Event-triggered jump:**
```
⚡ Event-triggered conversation: jumping directly to knot: on_lockpick_used
```

**Normal conversation (with existing state):**
```
🔄 Continuing previous conversation with security_guard
```

**Normal conversation (first time):**
```
🆕 Starting new conversation with security_guard
```

## Files Modified

- `js/minigames/person-chat/person-chat-minigame.js`
  - Line 53: Added `this.startKnot = params.startKnot`
  - Lines 315-340: Restructured state restoration logic with startKnot check

## Testing Checklist

- [ ] Start conversation with NPC (should restore previous state if exists)
- [ ] Trigger an event while NOT in conversation (should start new conversation with event knot)
- [ ] Trigger an event while in conversation with SAME NPC (should close and start with event knot)
- [ ] Trigger an event while in conversation with DIFFERENT NPC (should close first and start with event knot)
- [ ] Verify console shows `⚡ Event-triggered conversation` for event-triggered starts
- [ ] Verify event response dialogue appears immediately

## Related Files

- `js/systems/npc-manager.js` - Passes `startKnot` when starting minigame (line 465)
- `scenarios/npc-patrol-lockpick.json` - Test scenario with event mappings
- `js/systems/ink/ink-engine.js` - `goToKnot()` method
- `js/minigames/phone-chat/phone-chat-conversation.js` - `goToKnot()` method
