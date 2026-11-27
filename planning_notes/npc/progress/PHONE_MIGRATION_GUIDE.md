# Replacing Phone-Messages with Phone-Chat: Migration Guide

## Overview

The phone-chat minigame can **completely replace** the phone-messages minigame for all use cases, including simple one-way messages. This document shows how to migrate.

---

## Simplest Possible Ink Story (One-Way Message)

### Ink Source (`simple-message.ink`):
```ink
=== start ===
Security alert: Unauthorized access detected in the biometrics lab.
All personnel must verify identity at security checkpoints.
Server room PIN changed to 5923. Security lockdown initiated.
-> END
```

**That's it!** Just text and `-> END`. No choices, no variables, no complexity.

### Compiled JSON:
```json
{
  "inkVersion":21,
  "root":[[["done",{"#n":"g-0"}],null],"done",{
    "start":[
      "^Security alert: Unauthorized access detected...",
      "\n",
      "end",
      null
    ],
    "global decl":["ev","/ev","end",null]
  }],
  "listDefs":{}
}
```

### Usage in Scenario JSON:
```json
{
  "type": "phone",
  "name": "Reception Phone",
  "takeable": false,
  "phoneType": "chat",
  "phoneId": "reception_phone",
  "npcIds": ["security_team"],
  "observations": "The reception phone's message light is blinking"
}
```

### NPC Registration (in game initialization):
```javascript
window.npcManager.registerNPC({
  id: 'security_team',
  displayName: 'Security Team',
  storyPath: 'scenarios/compiled/simple-message.json',
  avatar: 'assets/icons/security-icon.png',
  phoneId: 'reception_phone',
  currentKnot: 'start'
});
```

---

## Migration Examples

### Example 1: Simple Voice Message (Current System)

**OLD** (phone-messages):
```json
{
  "type": "phone",
  "name": "Reception Phone",
  "readable": true,
  "voice": "Security alert: Unauthorized access detected...",
  "sender": "Security Team",
  "timestamp": "02:45 AM"
}
```

**NEW** (phone-chat):

**Step 1**: Create Ink story:
```ink
=== start ===
# timestamp: 02:45 AM
Security alert: Unauthorized access detected in the biometrics lab.
All personnel must verify identity at security checkpoints.
Server room PIN changed to 5923. Security lockdown initiated.
-> END
```

**Step 2**: Compile to JSON:
```bash
inklecate scenarios/ink/reception-alert.ink -o scenarios/compiled/reception-alert.json
```

**Step 3**: Update scenario JSON:
```json
{
  "npcs": [
    {
      "id": "security_team",
      "displayName": "Security Team",
      "storyPath": "scenarios/compiled/reception-alert.json",
      "phoneId": "reception_phone"
    }
  ],
  "rooms": {
    "reception": {
      "objects": [
        {
          "type": "phone",
          "name": "Reception Phone",
          "takeable": false,
          "phoneType": "chat",
          "phoneId": "reception_phone",
          "npcIds": ["security_team"]
        }
      ]
    }
  }
}
```

---

### Example 2: Multiple Messages (Current System)

**OLD** (phone-messages with array):
```json
{
  "type": "phone",
  "messages": [
    {
      "sender": "Alice",
      "text": "Hey, can you check the lab?",
      "timestamp": "10:30 AM"
    },
    {
      "sender": "Bob",
      "text": "Server maintenance at 2 PM",
      "timestamp": "11:15 AM"
    }
  ]
}
```

**NEW** (phone-chat with preloaded messages):

**Option A: Multiple NPCs (Recommended)**
```javascript
// Register NPCs
window.npcManager.registerNPC({
  id: 'alice',
  displayName: 'Alice',
  storyPath: 'scenarios/compiled/alice-simple.json',
  phoneId: 'player_phone'
});

window.npcManager.registerNPC({
  id: 'bob',
  displayName: 'Bob',
  storyPath: 'scenarios/compiled/bob-simple.json',
  phoneId: 'player_phone'
});

// Preload their messages (automatically done if stories start with text)
```

**Option B: Timed Messages**
```json
{
  "npcs": [
    {
      "id": "alice",
      "displayName": "Alice",
      "storyPath": "scenarios/compiled/alice-chat.json",
      "phoneId": "player_phone"
    },
    {
      "id": "bob",
      "displayName": "Bob",
      "storyPath": "scenarios/compiled/bob-chat.json",
      "phoneId": "player_phone"
    }
  ],
  "timedMessages": [
    {
      "npcId": "alice",
      "text": "Hey, can you check the lab?",
      "triggerTime": 0,
      "phoneId": "player_phone"
    },
    {
      "npcId": "bob",
      "text": "Server maintenance at 2 PM",
      "triggerTime": 2700000,
      "phoneId": "player_phone"
    }
  ]
}
```

---

## Advantages of Phone-Chat Over Phone-Messages

### Feature Comparison

| Feature | Phone-Messages | Phone-Chat |
|---------|----------------|------------|
| One-way messages | ✅ | ✅ |
| Voice playback | ✅ | ❌ (removed)* |
| Interactive conversations | ❌ | ✅ |
| Branching dialogue | ❌ | ✅ |
| State persistence | ❌ | ✅ |
| Multiple NPCs | ⚠️ (limited) | ✅ |
| Timed messages | ❌ | ✅ |
| Conversation history | ⚠️ (per-phone) | ✅ (per-NPC) |
| Event-driven responses | ❌ | ✅ |
| Avatars | ❌ | ✅ |

*Voice playback could be added back if needed

### Why Switch?

1. **Unified System**: One minigame for all phone interactions
2. **Scalability**: Easy to upgrade simple messages to interactive conversations
3. **Better UX**: Consistent interface, conversation history, state persistence
4. **More Features**: Timed messages, event responses, branching dialogue
5. **Future-Proof**: Built for complex NPC interactions

---

## Direct Replacement Strategy

### Phase 1: Update interactions.js

**REMOVE** (old phone-messages routing):
```javascript
if (data.type === 'phone' && (data.text || data.voice)) {
    // ... phone-messages code ...
    window.MinigameFramework.startMinigame('phone-messages', null, minigameParams);
}
```

**ADD** (new phone-chat routing):
```javascript
if (data.type === 'phone') {
    // Get phoneId from object or use default
    const phoneId = data.phoneId || 'default_phone';
    
    // Check if NPCs are registered for this phone
    const npcs = window.npcManager.getNPCsByPhone(phoneId);
    
    if (npcs.length === 0 && data.npcIds) {
        // Register NPCs on-the-fly if defined
        data.npcIds.forEach(npcId => {
            const npc = window.gameScenario.npcs?.find(n => n.id === npcId);
            if (npc) {
                window.npcManager.registerNPC(npc);
            }
        });
    }
    
    // Open phone-chat minigame
    window.MinigameFramework.startMinigame('phone-chat', null, {
        phoneId: phoneId,
        title: data.name || 'Phone'
    });
}
```

### Phase 2: Convert Existing Phone Objects

**Script to help conversion**:
```javascript
// Helper to convert old phone format to new format
function convertPhoneObject(oldPhone) {
    const npcId = `phone_${oldPhone.name.toLowerCase().replace(/\s+/g, '_')}`;
    
    // Create simple Ink story
    const inkStory = `=== start ===
${oldPhone.voice || oldPhone.text}
-> END`;
    
    // Return new format
    return {
        npc: {
            id: npcId,
            displayName: oldPhone.sender || 'Unknown',
            storyPath: `scenarios/compiled/${npcId}.json`,
            phoneId: oldPhone.phoneId || 'default_phone'
        },
        phoneObject: {
            type: 'phone',
            name: oldPhone.name,
            takeable: oldPhone.takeable || false,
            phoneType: 'chat',
            phoneId: oldPhone.phoneId || 'default_phone',
            npcIds: [npcId],
            observations: oldPhone.observations
        },
        inkStory: inkStory
    };
}
```

### Phase 3: Batch Convert Scenarios

Run this script on each scenario:
```javascript
const scenarios = [
    'biometric_breach.json',
    'ceo_exfil.json',
    'cybok_heist.json'
];

scenarios.forEach(scenarioFile => {
    const scenario = JSON.parse(fs.readFileSync(scenarioFile));
    const npcs = [];
    
    // Find all phone objects
    for (const roomId in scenario.rooms) {
        const room = scenario.rooms[roomId];
        room.objects = room.objects.map(obj => {
            if (obj.type === 'phone' && (obj.voice || obj.text)) {
                const converted = convertPhoneObject(obj);
                npcs.push(converted.npc);
                
                // Write Ink story
                fs.writeFileSync(
                    `scenarios/ink/${converted.npc.id}.ink`,
                    converted.inkStory
                );
                
                return converted.phoneObject;
            }
            return obj;
        });
    }
    
    // Add NPCs array to scenario
    scenario.npcs = npcs;
    
    // Write updated scenario
    fs.writeFileSync(scenarioFile, JSON.stringify(scenario, null, 2));
});
```

---

## Handling Edge Cases

### Voice Playback (if required)

If you need voice playback, you can:

**Option 1**: Add voice tag to Ink:
```ink
=== start ===
# voice: Security alert message
# voice_text: Security alert: Unauthorized access detected...
Security alert: Unauthorized access detected in the biometrics lab.
-> END
```

**Option 2**: Use browser's Speech Synthesis in phone-chat-ui.js:
```javascript
// In phone-chat-ui.js addMessage()
if (message.voice) {
    const utterance = new SpeechSynthesisUtterance(message.voice);
    window.speechSynthesis.speak(utterance);
}
```

### Maintaining Timestamps

Use Ink tags:
```ink
=== start ===
# timestamp: 02:45 AM
# sender: Security Team
Message content here...
-> END
```

Parse in phone-chat-conversation.js:
```javascript
// When continuing story
const result = conversation.continue();
const tags = conversation.currentTags;

const timestamp = tags.find(t => t.startsWith('timestamp:'))?.split(':')[1]?.trim();
const sender = tags.find(t => t.startsWith('sender:'))?.split(':')[1]?.trim();
```

---

## Testing Migration

### Test Checklist

1. **Basic Message Display**
   - [ ] Simple one-line message appears
   - [ ] Multi-line message formats correctly
   - [ ] Message shows in conversation view

2. **Phone Object Interaction**
   - [ ] Clicking phone in room opens phone-chat
   - [ ] Correct NPC appears in contact list
   - [ ] Message displays when NPC is clicked

3. **Multiple NPCs**
   - [ ] All NPCs appear in contact list
   - [ ] Each NPC shows correct message
   - [ ] Can switch between NPCs

4. **Backward Compatibility**
   - [ ] Existing scenarios still load
   - [ ] No console errors
   - [ ] Phone objects without NPCs show appropriate message

---

## Rollback Plan

If needed, you can run both systems in parallel:

```javascript
// In interactions.js
if (data.type === 'phone') {
    if (data.useOldSystem || data.voice) {
        // Use phone-messages
        window.MinigameFramework.startMinigame('phone-messages', null, params);
    } else {
        // Use phone-chat
        window.MinigameFramework.startMinigame('phone-chat', null, params);
    }
}
```

---

## Summary

**Can phone-chat replace phone-messages?** ✅ **YES, completely!**

**Simplest Ink JSON?** Just text + `-> END` (literally 3 lines)

**Migration effort?** 
- Simple messages: ~5 minutes per scenario
- Complex migration: ~2-4 hours for all scenarios

**Benefits?**
- ✅ Unified system
- ✅ More features
- ✅ Better UX
- ✅ Future-proof

**Recommendation**: Replace phone-messages entirely with phone-chat for consistency and future features.

---

**Document Version**: 1.0
**Date**: 2025-10-30
**Status**: Ready for Implementation
