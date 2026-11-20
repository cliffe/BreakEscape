# Phone Chat Minigame - Main Game Integration Guide

## Overview
This guide explains how to integrate the phone-chat minigame into the main Break Escape game.

---

## Prerequisites

### Files Required
All files are already in place:
- ✅ `js/systems/npc-manager.js` - NPC management
- ✅ `js/systems/npc-events.js` - Event dispatcher
- ✅ `js/systems/npc-barks.js` - Bark notifications
- ✅ `js/systems/ink/ink-engine.js` - Ink story engine
- ✅ `js/minigames/phone-chat/*.js` - Phone chat minigame modules
- ✅ `css/phone-chat-minigame.css` - Styling
- ✅ `css/npc-barks.css` - Bark styling
- ✅ `assets/vendor/ink.js` - Ink runtime library

---

## Step 1: Initialize NPC Systems in Main Game

### In `js/main.js` (or game initialization file):

```javascript
import NPCEventDispatcher from './systems/npc-events.js';
import NPCBarkSystem from './systems/npc-barks.js';
import NPCManager from './systems/npc-manager.js';

// Initialize NPC systems after game engine starts
function initializeNPCSystems() {
    // Create event dispatcher
    window.eventDispatcher = new NPCEventDispatcher();
    
    // Create bark system
    window.barkSystem = new NPCBarkSystem(window.eventDispatcher);
    
    // Create NPC manager
    window.npcManager = new NPCManager(window.eventDispatcher, window.barkSystem);
    
    // Start timed messages system
    window.npcManager.startTimedMessages();
    
    console.log('✅ NPC systems initialized');
}

// Call after Phaser game is ready
initializeNPCSystems();
```

---

## Step 2: Load NPCs from Scenario

### In scenario JSON (e.g., `scenarios/biometric_breach.json`):

```json
{
  "scenario_brief": "...",
  "endGoal": "...",
  "startRoom": "reception",
  
  "npcs": [
    {
      "id": "alice",
      "displayName": "Alice - Security Consultant",
      "storyPath": "scenarios/compiled/alice-chat.json",
      "avatar": "assets/npc/avatars/npc_alice.png",
      "currentKnot": "start",
      "phoneId": "player_phone",
      "npcType": "phone",
      "eventMappings": {
        "room_entered:lab": {
          "knot": "lab_discussion",
          "bark": "Hey! I see you made it to the lab.",
          "once": true
        },
        "item_picked_up:fingerprint_kit": {
          "knot": "found_evidence",
          "bark": "Good find! That'll help us identify the suspect.",
          "once": true
        }
      }
    },
    {
      "id": "bob",
      "displayName": "Bob - IT Manager",
      "storyPath": "scenarios/compiled/bob-chat.json",
      "avatar": "assets/npc/avatars/npc_bob.png",
      "currentKnot": "start",
      "phoneId": "player_phone",
      "npcType": "phone"
    }
  ],
  
  "timedMessages": [
    {
      "npcId": "alice",
      "text": "Hey! Just got to the office. Ready to investigate?",
      "triggerTime": 0,
      "phoneId": "player_phone"
    },
    {
      "npcId": "alice",
      "text": "Found something interesting in the security logs. Check your phone when you can.",
      "triggerTime": 60000,
      "phoneId": "player_phone"
    }
  ],
  
  "rooms": { ... }
}
```

### Load NPCs when scenario starts:

```javascript
function loadScenario(scenarioData) {
    // ... existing room/object loading ...
    
    // Register NPCs
    if (scenarioData.npcs) {
        scenarioData.npcs.forEach(npcConfig => {
            window.npcManager.registerNPC(npcConfig);
            console.log(`Registered NPC: ${npcConfig.id}`);
        });
    }
    
    // Load timed messages
    if (scenarioData.timedMessages) {
        window.npcManager.loadTimedMessages(scenarioData.timedMessages);
    }
}
```

---

## Step 3: Emit Game Events

### Emit events when things happen in the game:

```javascript
// When player enters a room
function enterRoom(roomId) {
    // ... existing room logic ...
    
    window.eventDispatcher.emit('room_entered', { 
        roomId: roomId,
        timestamp: Date.now()
    });
    
    // Also emit room-specific event
    window.eventDispatcher.emit(`room_entered:${roomId}`, { 
        roomId: roomId 
    });
}

// When player picks up an item
function pickupItem(itemType, itemName) {
    // ... existing pickup logic ...
    
    window.eventDispatcher.emit('item_picked_up', {
        itemType: itemType,
        itemName: itemName,
        timestamp: Date.now()
    });
    
    // Also emit item-specific event
    window.eventDispatcher.emit(`item_picked_up:${itemType}`, {
        itemType: itemType,
        itemName: itemName
    });
}

// When player completes a minigame
function onMinigameComplete(minigameType, success) {
    // ... existing minigame logic ...
    
    window.eventDispatcher.emit('minigame_completed', {
        minigameType: minigameType,
        success: success,
        timestamp: Date.now()
    });
    
    // Also emit specific event
    window.eventDispatcher.emit(`minigame_completed:${minigameType}`, {
        success: success
    });
}

// When player unlocks a door
function onDoorUnlocked(doorId, method) {
    window.eventDispatcher.emit('door_unlocked', {
        doorId: doorId,
        method: method, // 'key', 'password', 'biometric', etc.
        timestamp: Date.now()
    });
}
```

---

## Step 4: Add Phone Access Button

### Add UI button to open phone (e.g., in `index.html` or game UI):

```html
<!-- Add to game UI -->
<div id="phone-button" class="ui-button">
    📱
    <span id="phone-unread-badge" class="unread-badge" style="display: none;">0</span>
</div>
```

### Wire up the button:

```javascript
// In UI initialization
document.getElementById('phone-button').addEventListener('click', () => {
    openPhone();
});

function openPhone() {
    // Start phone-chat minigame
    window.MinigameFramework.startMinigame('phone-chat', null, {
        phoneId: 'player_phone',
        title: 'Phone'
    });
}

// Update unread badge when messages arrive
function updatePhoneUnreadBadge() {
    const npcs = window.npcManager.getNPCsByPhone('player_phone');
    let totalUnread = 0;
    
    npcs.forEach(npc => {
        const history = window.npcManager.getConversationHistory(npc.id);
        const unread = history.filter(msg => !msg.read).length;
        totalUnread += unread;
    });
    
    const badge = document.getElementById('phone-unread-badge');
    if (totalUnread > 0) {
        badge.textContent = totalUnread;
        badge.style.display = 'block';
    } else {
        badge.style.display = 'none';
    }
}

// Call updatePhoneUnreadBadge() when messages arrive or are read
```

---

## Step 5: Handle Phone Objects in Rooms

### When player interacts with a phone object:

```javascript
// In interaction system (js/systems/interactions.js)
function handlePhoneInteraction(phoneObject) {
    const phoneId = phoneObject.scenarioData?.phoneId || 'player_phone';
    
    // Open phone minigame for this specific phone
    window.MinigameFramework.startMinigame('phone-chat', null, {
        phoneId: phoneId,
        title: phoneObject.name || 'Phone'
    });
}
```

### In scenario JSON, define phone objects:

```json
{
  "type": "phone",
  "name": "Office Phone",
  "interactable": true,
  "scenarioData": {
    "phoneId": "office_phone"
  }
}
```

---

## Step 6: Compile Ink Stories

### Create Ink story files in `scenarios/ink/`:

```ink
// scenarios/ink/alice-chat.ink
=== start ===
# speaker: Alice
Hey! I'm Alice, the security consultant here.
What can I help you with?
+ [Who are you?] -> about_alice
+ [What happened here?] -> breach_info
+ [I need access to the lab] -> lab_access
+ [Goodbye] -> END

=== about_alice ===
# speaker: Alice
I'm the senior security analyst. Been here 3 years.
I specialize in biometric systems and access control.
-> start

// ... more knots ...
```

### Compile to JSON:

```bash
cd scenarios/ink
inklecate alice-chat.ink -o ../compiled/alice-chat.json
```

---

## Step 7: CSS Integration

### Ensure CSS files are loaded in `index.html`:

```html
<link rel="stylesheet" href="css/npc-barks.css">
<link rel="stylesheet" href="css/phone-chat-minigame.css">
```

---

## Step 8: Testing Integration

### Test checklist:
1. [ ] NPCs load from scenario JSON
2. [ ] Events trigger barks
3. [ ] Barks appear when triggered
4. [ ] Clicking bark opens phone chat
5. [ ] Phone button opens phone
6. [ ] Multiple NPCs appear in contact list
7. [ ] Conversations work correctly
8. [ ] History persists across game sessions
9. [ ] Timed messages arrive correctly
10. [ ] Unread badge updates

---

## Common Integration Patterns

### Pattern 1: Progress-Based Knot Changes
```javascript
// When player achieves something
function onSuspectIdentified() {
    const alice = window.npcManager.getNPC('alice');
    if (alice) {
        alice.currentKnot = 'suspect_found';
    }
    
    window.eventDispatcher.emit('progress:suspect_identified', {});
}
```

### Pattern 2: Variable Sharing Between Game and Ink
```javascript
// Set Ink variable from game
const aliceConversation = new PhoneChatConversation('alice', window.npcManager, window.inkEngine);
aliceConversation.setVariable('player_has_keycard', true);

// Get Ink variable in game
const trustLevel = aliceConversation.getVariable('alice_trust');
if (trustLevel >= 5) {
    unlockSpecialContent();
}
```

### Pattern 3: Dynamic NPC Registration
```javascript
// Add NPC mid-game (e.g., when player finds their phone number)
function discoverContact(npcId) {
    window.npcManager.registerNPC({
        id: npcId,
        displayName: 'Unknown Contact',
        storyPath: `scenarios/compiled/${npcId}-chat.json`,
        phoneId: 'player_phone'
    });
    
    // Schedule intro message
    window.npcManager.scheduleTimedMessage({
        npcId: npcId,
        text: 'Hey, who is this?',
        triggerTime: 5000 // 5 seconds from now
    });
}
```

---

## Debugging Tips

### Enable debug logging:
```javascript
// In browser console
window.npcManager.debug = true;
window.eventDispatcher.debug = true;
```

### Check NPC state:
```javascript
// Check registered NPCs
console.log(window.npcManager.getAllNPCs());

// Check conversation history
console.log(window.npcManager.getConversationHistory('alice'));

// Check if event has triggered
console.log(window.npcManager.hasTriggered('alice', 'room_entered:lab'));
```

### Test events manually:
```javascript
// Emit test event
window.eventDispatcher.emit('room_entered:lab', { roomId: 'lab' });

// Show test bark
window.barkSystem.showBark({
    npcId: 'alice',
    npcName: 'Alice',
    message: 'Test bark message!',
    inkStoryPath: 'scenarios/compiled/alice-chat.json'
});
```

---

## Performance Considerations

1. **Event Throttling**: Use cooldowns on frequent events (e.g., player movement)
2. **Message Limits**: Consider limiting conversation history length (e.g., last 100 messages)
3. **Lazy Loading**: Only load Ink stories when needed
4. **State Persistence**: Save NPC states to localStorage periodically

---

## File Checklist

Before integration, verify these files exist:
- [ ] `js/systems/npc-manager.js`
- [ ] `js/systems/npc-events.js`
- [ ] `js/systems/npc-barks.js`
- [ ] `js/systems/ink/ink-engine.js`
- [ ] `js/minigames/phone-chat/phone-chat-minigame.js`
- [ ] `js/minigames/phone-chat/phone-chat-ui.js`
- [ ] `js/minigames/phone-chat/phone-chat-conversation.js`
- [ ] `js/minigames/phone-chat/phone-chat-history.js`
- [ ] `css/phone-chat-minigame.css`
- [ ] `css/npc-barks.css`
- [ ] `assets/vendor/ink.js`
- [ ] Compiled Ink stories in `scenarios/compiled/`

---

**Integration Guide Version**: 1.0
**Last Updated**: 2025-10-30
**Status**: Ready for Integration
