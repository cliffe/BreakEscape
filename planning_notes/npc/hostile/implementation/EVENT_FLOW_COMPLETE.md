# Complete Event-Triggered Conversation Flow

## Overview

This document traces the complete flow of how an event-triggered conversation now works after the recent fixes.

## Architecture

```
Event Triggered (lockpick_used_in_view)
    ↓
EventDispatcher emits event
    ↓
NPCManager._handleEventMapping() catches event
    ↓
    [Line of Sight Check]
    NPC can see player? → Event continues
    ↓
    [Event Cooldown Check - FIXED: cooldown: 0 now works]
    ✅ Event not on cooldown? → Event continues
    ↓
    [Conversation Mode Check]
    Is person-chat? → Yes
    ↓
    [Check for Active Conversation]
    Is same NPC already in conversation? → Jump to knot (future enhancement)
    Otherwise → Start new conversation with startKnot
    ↓
MinigameFramework.startMinigame('person-chat', null, {
  npcId: 'security_guard',
  startKnot: 'on_lockpick_used',  ← EVENT RESPONSE KNOT
  scenario: window.gameScenario
})
    ↓
PersonChatMinigame constructor:
  this.startKnot = params.startKnot = 'on_lockpick_used'  ← STORED
    ↓
PersonChatMinigame.start() → PersonChatMinigame.startConversation()
    ↓
    [Load Ink Story]
    ✅ Story loaded
    ↓
    [Check if startKnot provided - NEW LOGIC]
    this.startKnot === 'on_lockpick_used'? → YES
    ↓
    [Jump to Event Knot - SKIPS STATE RESTORATION]
    this.conversation.goToKnot('on_lockpick_used')
    ↓
    [Sync Global Variables]
    ✅ Synced
    ↓
PersonChatMinigame.showCurrentDialogue()
    ↓
    Display dialogue from 'on_lockpick_used' knot
    ✅ Event response appears immediately
```

## Code Flow

### 1. Event Triggering (unlock-system.js)

```javascript
// Player uses lockpick near NPC who can see them
// Event is dispatched with event data
window.eventDispatcher?.emit('lockpick_used_in_view', {
    npcId: 'security_guard',
    roomId: 'patrol_corridor',
    lockable: initialize,
    timestamp: 1763129060011
});
```

### 2. Event Caught by NPCManager (npc-manager.js:330)

```javascript
_handleEventMapping(npcId, eventPattern, config, eventData) {
    // Console: 🎯 Event triggered: lockpick_used_in_view for NPC: security_guard
    
    // ... validation checks ...
    
    // Line 359: FIX - Cooldown handling with explicit null/undefined check
    const cooldown = config.cooldown !== undefined && config.cooldown !== null 
        ? config.cooldown 
        : 5000;
    // If cooldown: 0, this now correctly evaluates to 0 (not 5000)
    
    // Check last trigger time
    const now = Date.now();
    const lastTime = this.triggeredEvents.get(eventKey)?.lastTime || 0;
    if (now - lastTime < cooldown) {
        console.log(`⏸️ Event on cooldown`);
        return;  // Skip - still on cooldown
    }
    
    // Cooldown check passed ✅
    
    // Update last trigger time
    this.triggeredEvents.set(eventKey, {
        count: (this.triggeredEvents.get(eventKey)?.count || 0) + 1,
        lastTime: now
    });
    
    // Continue to conversation mode handling
}
```

### 3. Person-Chat Mode Handler (npc-manager.js:410)

```javascript
if (config.conversationMode === 'person-chat' && npc.npcType === 'person') {
    // console.log: 👤 Handling person-chat for event on NPC security_guard
    
    // Check for active conversation
    const currentConvNPCId = window.currentConversationNPCId;  // null if no conversation
    const activeMinigame = window.MinigameFramework?.currentMinigame;
    const isPersonChatActive = activeMinigame?.constructor?.name === 'PersonChatMinigame';
    
    // For new conversations: isConversationActive will be false
    // So we skip the jump logic and go straight to starting new conversation
    
    // console.log: 👤 Starting new person-chat conversation for NPC security_guard
    
    // Close any currently running minigame (like lockpicking)
    if (window.MinigameFramework?.currentMinigame) {
        window.MinigameFramework.endMinigame(false, null);
    }
    
    // Start minigame WITH startKnot parameter ← KEY CHANGE
    window.MinigameFramework.startMinigame('person-chat', null, {
        npcId: npc.id,                           // 'security_guard'
        startKnot: config.knot || npc.currentKnot,  // 'on_lockpick_used'
        scenario: window.gameScenario
    });
}
```

### 4. MinigameFramework Starts PersonChatMinigame

```javascript
// minigame-manager.js
startMinigame('person-chat', null, {
    npcId: 'security_guard',
    startKnot: 'on_lockpick_used',
    scenario: window.gameScenario
});

// Creates PersonChatMinigame instance
// params = { npcId, startKnot, scenario }
```

### 5. PersonChatMinigame Constructor (FIXED)

```javascript
constructor(container, params) {
    // ... setup ...
    
    this.npcId = params.npcId;  // 'security_guard'
    this.startKnot = params.startKnot;  // 'on_lockpick_used'  ← STORED
    
    // console.log: 🎭 PersonChatMinigame created for NPC: security_guard
}
```

### 6. PersonChatMinigame.start()

```javascript
start() {
    super.start();
    // console.log: 🎭 PersonChatMinigame started
    
    window.currentConversationNPCId = this.npcId;  // 'security_guard'
    window.currentConversationMinigameType = 'person-chat';
    
    this.startConversation();
}
```

### 7. startConversation() - NEW LOGIC (FIXED)

```javascript
async startConversation() {
    // Load Ink story
    this.conversation = new PhoneChatConversation(this.npcId, ...);
    const loaded = await this.conversation.loadStory(this.npc.storyPath);
    
    if (!loaded) return;
    
    // ⚡ NEW: Check if startKnot was provided (event-triggered)
    if (this.startKnot) {  // 'on_lockpick_used'
        console.log(`⚡ Event-triggered conversation: jumping directly to knot: on_lockpick_used`);
        
        // Jump to event knot - SKIP STATE RESTORATION
        this.conversation.goToKnot(this.startKnot);
        
        // console.log: ⚡ Event-triggered conversation: jumping directly to knot: on_lockpick_used
    } else {
        // Original logic: restore previous state if exists
        const stateRestored = npcConversationStateManager.restoreNPCState(
            this.npcId, 
            this.inkEngine.story
        );
        // ...
    }
    
    // Always sync global variables
    npcConversationStateManager.syncGlobalVariablesToStory(this.inkEngine.story);
    
    // Show initial dialogue
    this.showCurrentDialogue();  // Displays 'on_lockpick_used' knot content
    
    console.log('✅ Conversation started');
}
```

### 8. Display Event Response

```javascript
showCurrentDialogue() {
    // Get current story content from 'on_lockpick_used' knot
    const result = this.inkEngine.continue();
    
    // Result contains dialogue text and choices from the event response knot
    // Display it in the UI
    this.ui.showDialogue(result);
}
```

## Expected Console Output

When lockpicking event triggers with security_guard in line of sight:

```
npc-manager.js:206 🚫 INTERRUPTING LOCKPICKING: NPC "security_guard" can see player and has person-chat mapped to lockpick event
unlock-system.js:122 🚫 LOCKPICKING INTERRUPTED: Triggering person-chat with NPC "security_guard"
npc-manager.js:330 🎯 Event triggered: lockpick_used_in_view for NPC: security_guard
npc-manager.js:387 ✅ Event lockpick_used_in_view conditions passed, triggering NPC reaction
npc-manager.js:397 📍 Updated security_guard current knot to: on_lockpick_used
npc-manager.js:411 👤 Handling person-chat for event on NPC security_guard
npc-manager.js:419 🔍 Event jump check: {..., isConversationActive: false, ...}
npc-manager.js:452 👤 Starting new person-chat conversation for NPC security_guard
minigame-manager.js:30 🎮 Starting minigame: person-chat
person-chat-minigame.js:83 🎭 PersonChatMinigame created for NPC: security_guard
person-chat-minigame.js:282 🎭 PersonChatMinigame started
person-chat-minigame.js:298 ⚡ Event-triggered conversation: jumping directly to knot: on_lockpick_used
person-chat-ui.js:80 ✅ PersonChatUI rendered
person-chat-minigame.js:179 ✅ PersonChatMinigame initialized
person-chat-minigame.js:346 ✅ Conversation started
```

The key console line is:
```
person-chat-minigame.js:298 ⚡ Event-triggered conversation: jumping directly to knot: on_lockpick_used
```

This indicates the event response is being triggered correctly.

## Test Scenario

File: `scenarios/npc-patrol-lockpick.json`

Both NPCs have:
```json
"eventMappings": [
  {
    "eventPattern": "lockpick_used_in_view",
    "targetKnot": "on_lockpick_used",
    "conversationMode": "person-chat",
    "cooldown": 0
  }
]
```

The `cooldown: 0` means events fire immediately with no delay between them.

### Test Steps

1. Load scenario from `scenario_select.html`
2. Select `npc-patrol-lockpick.json`
3. Navigate to `patrol_corridor`
4. Find the lock (lockpicking object)
5. Get the `security_guard` NPC in line of sight
6. Use lockpicking action
7. Observe:
   - Lockpicking is interrupted immediately
   - Person-chat window opens with event response dialogue
   - Console shows `⚡ Event-triggered conversation: jumping directly to knot: on_lockpick_used`

## Related Bug Fixes

This fix builds on two previous fixes in the same session:

1. **Cooldown: 0 Bug Fix** - JavaScript falsy value bug where `config.cooldown || 5000` treated 0 as falsy, defaulting to 5000ms
   - Fixed: `const cooldown = config.cooldown !== undefined && config.cooldown !== null ? config.cooldown : 5000`
   - File: `js/systems/npc-manager.js:359`

2. **Event Start Knot Fix** - PersonChatMinigame was ignoring the `startKnot` parameter passed from NPCManager
   - Fixed: Added `this.startKnot` parameter storage and state restoration bypass logic
   - File: `js/minigames/person-chat/person-chat-minigame.js:53, 315-340`

## Architecture Improvements

The fixes establish a clear pattern for event-triggered conversations:

1. **Event Detection** → NPCManager validates and processes event
2. **Parameter Passing** → Passes `startKnot` to minigame initialization
3. **Early Branching** → PersonChatMinigame checks for `startKnot` early in `startConversation()`
4. **State Bypass** → If `startKnot` is present, skip normal state restoration
5. **Direct Navigation** → Jump immediately to target knot
6. **Display** → Show content from target knot to player

This pattern could be extended to:
- Jump-to-knot while already in conversation (change line 427 logic in npc-manager.js)
- Other conversation types (phone-chat, etc.)
- Timed conversations (time-based events)
