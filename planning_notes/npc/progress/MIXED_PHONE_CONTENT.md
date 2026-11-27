# Mixed Phone Content: Simple Messages + Interactive Chats

## Overview
You can have BOTH simple one-way messages AND interactive Ink conversations on the same phone. They'll all appear in the contact list together.

---

## Example Scenario

```json
{
  "scenario_brief": "Investigation with mixed communication types",
  "startRoom": "office",
  
  "npcs": [
    {
      "id": "alice",
      "displayName": "Alice - Security Analyst",
      "storyPath": "scenarios/compiled/alice-chat.json",
      "avatar": "assets/npc/avatars/npc_alice.png",
      "phoneId": "player_phone",
      "currentKnot": "start"
    },
    {
      "id": "bob",
      "displayName": "Bob - IT Manager",
      "storyPath": "scenarios/compiled/bob-chat.json",
      "avatar": "assets/npc/avatars/npc_bob.png",
      "phoneId": "player_phone",
      "currentKnot": "start"
    }
  ],
  
  "rooms": {
    "office": {
      "type": "room_office",
      "objects": [
        {
          "type": "phone",
          "name": "Player Phone",
          "takeable": false,
          "phoneId": "player_phone",
          "observations": "Your personal phone with several messages"
        },
        {
          "type": "phone",
          "name": "System Alert",
          "takeable": false,
          "phoneId": "player_phone",
          "voice": "Security alert: Unauthorized access detected in server room at 02:15 AM. All personnel must report to security checkpoint.",
          "sender": "Security System",
          "timestamp": "02:15 AM",
          "observations": "An automated security alert"
        },
        {
          "type": "phone",
          "name": "Voicemail",
          "takeable": false,
          "phoneId": "player_phone",
          "voice": "Hey, it's the director. I need you to investigate the breach ASAP. Call me when you find something.",
          "sender": "Director",
          "timestamp": "02:30 AM"
        },
        {
          "type": "phone",
          "name": "Reminder",
          "takeable": false,
          "phoneId": "player_phone",
          "text": "Don't forget: Server room PIN is 5923",
          "sender": "Maintenance",
          "timestamp": "Yesterday"
        }
      ]
    }
  }
}
```

---

## What Happens

When the player opens the phone (clicks on any phone object with `phoneId: "player_phone"`):

### Contact List Shows:
1. **Alice - Security Analyst** (interactive chat)
   - Avatar: npc_alice.png
   - Preview: "Hey! I'm Alice, the security consultant..."
   - ✅ Can have full conversation with choices

2. **Bob - IT Manager** (interactive chat)
   - Avatar: npc_bob.png
   - Preview: "Hey there! This is conversation..."
   - ✅ Can have full conversation with choices

3. **Security System** (simple message - auto-converted)
   - Avatar: None (placeholder emoji)
   - Preview: "Security alert: Unauthorized access..."
   - ⚠️ One-way message (ends immediately, no choices)

4. **Director** (simple message - auto-converted)
   - Avatar: None
   - Preview: "Hey, it's the director. I need you..."
   - ⚠️ One-way message

5. **Maintenance** (simple message - auto-converted)
   - Avatar: None
   - Preview: "Don't forget: Server room PIN is 5923"
   - ⚠️ One-way message

### User Experience

**Interactive NPCs (Alice, Bob)**:
- Click → Opens conversation
- Shows intro message + choices
- Can have back-and-forth dialogue
- State persists across visits
- Reopen → continues from where left off

**Simple Messages (Security System, Director, Maintenance)**:
- Click → Opens conversation
- Shows message text
- No choices (story ends immediately)
- Can reopen to read again
- No state to persist (always shows same message)

---

## How It Works Technically

### 1. NPCs Array (Pre-registered)
```json
"npcs": [
  {
    "id": "alice",
    "phoneId": "player_phone"  // ← Same phoneId
  },
  {
    "id": "bob", 
    "phoneId": "player_phone"  // ← Same phoneId
  }
]
```

### 2. Phone Objects (Auto-converted)
```json
{
  "type": "phone",
  "phoneId": "player_phone",  // ← Same phoneId
  "voice": "Simple message text",
  "sender": "Security System"
}
```

### 3. Runtime Conversion
When interactions.js detects the phone object:
```javascript
// Check if it's a simple message
if (PhoneMessageConverter.needsConversion(phoneObject)) {
  // Convert to virtual NPC
  const npcId = PhoneMessageConverter.convertAndRegister(phoneObject, npcManager);
  
  // Virtual NPC gets phoneId from phone object
  // Now it's on the same phone as Alice and Bob!
}
```

### 4. Contact List Aggregation
```javascript
// phone-chat-minigame.js
const npcs = npcManager.getNPCsByPhone('player_phone');
// Returns: [alice, bob, security_system_msg, director_msg, maintenance_msg]

// All appear in contact list together!
```

---

## Advantages of Mixed Content

### 1. Flexible Communication
- **Critical alerts** → Simple messages (quick, clear)
- **Investigation** → Interactive chats (deep, contextual)
- **Background info** → Simple messages (reference material)

### 2. Natural Progression
- Start: Simple message alerts player to problem
- Middle: Interactive chat to gather clues
- End: Simple message with mission update

### 3. Realism
- Real phones have both SMS and chat apps
- Some contacts chat, others send broadcasts
- Mix feels more authentic

---

## Example Workflow

### Player's Perspective

1. **Opens phone** → See 5 contacts
2. **Clicks "Security System"** → Reads alert → "OK, there's a breach"
3. **Clicks "Alice"** → Interactive conversation:
   - Alice: "Hey! I'm investigating the breach."
   - Player: [What happened?]
   - Alice: "Someone broke in around 2 AM..."
   - Player: [Can you help me access the lab?]
   - Alice: "First, gather evidence..."
4. **Clicks "Director"** → Reads voicemail → "Right, need to investigate ASAP"
5. **Clicks "Bob"** → Interactive conversation about server access
6. **Clicks "Maintenance"** → Reads PIN reminder → "5923, got it!"

### Result
Player has:
- Context from simple messages
- Investigation leads from interactive chats
- Reference info readily available
- Natural mix of communication types

---

## Advanced: Grouping by Type

You can even organize the contact list:

### Option 1: Separate Sections (Future Enhancement)
```
📱 Phone - player_phone

Conversations:
- Alice - Security Analyst
- Bob - IT Manager

Messages:
- Security System (02:15 AM)
- Director (02:30 AM)
- Maintenance (Yesterday)
```

### Option 2: Timestamp Ordering
Sort by most recent (mix simple + chat chronologically)

### Option 3: Priority Flag
```json
{
  "type": "phone",
  "priority": "urgent",  // Shows at top
  "voice": "Critical alert!"
}
```

---

## Testing Mixed Content

### Test Setup

```javascript
// test-phone-chat-minigame.html
async function testMixedPhone() {
    // Register interactive NPCs
    window.npcManager.registerNPC({
        id: 'alice',
        displayName: 'Alice',
        storyPath: 'scenarios/compiled/alice-chat.json',
        phoneId: 'test_phone'
    });
    
    // Convert simple messages
    const { default: PhoneMessageConverter } = 
        await import('./js/utils/phone-message-converter.js');
    
    const simpleMessage1 = {
        type: "phone",
        name: "Alert",
        phoneId: "test_phone",
        voice: "Security breach detected!",
        sender: "Security"
    };
    
    const simpleMessage2 = {
        type: "phone",
        name: "Reminder",
        phoneId: "test_phone",
        text: "PIN: 5923",
        sender: "System"
    };
    
    PhoneMessageConverter.convertAndRegister(simpleMessage1, window.npcManager);
    PhoneMessageConverter.convertAndRegister(simpleMessage2, window.npcManager);
    
    // Open phone - all 3 appear!
    window.MinigameFramework.startMinigame('phone-chat', null, {
        phoneId: 'test_phone'
    });
}
```

---

## Best Practices

### When to Use Simple Messages
- ✅ System alerts / notifications
- ✅ One-time information drops
- ✅ Reference material (PINs, codes, hints)
- ✅ Background lore / flavor text
- ✅ Messages from minor characters

### When to Use Interactive Chats
- ✅ Main NPCs with character development
- ✅ Investigation dialogues
- ✅ Branching story paths
- ✅ Trust/relationship tracking
- ✅ Multi-stage missions

### Mix Strategy
- **80/20 rule**: 80% simple messages, 20% interactive chats
- **Progression**: Simple → Interactive → Simple (sandwich pattern)
- **Context**: Simple messages provide context for interactive chats

---

## Scenario Design Pattern

```json
{
  "npcs": [
    // Main characters - interactive
    {"id": "alice", "phoneId": "player_phone", "storyPath": "..."},
    {"id": "bob", "phoneId": "player_phone", "storyPath": "..."}
  ],
  
  "rooms": {
    "office": {
      "objects": [
        // Phone access point
        {"type": "phone", "name": "Phone", "phoneId": "player_phone"},
        
        // Simple messages - auto-converted
        {"type": "phone", "phoneId": "player_phone", "voice": "Alert 1", "sender": "Sys1"},
        {"type": "phone", "phoneId": "player_phone", "voice": "Alert 2", "sender": "Sys2"},
        {"type": "phone", "phoneId": "player_phone", "text": "Info", "sender": "Admin"}
      ]
    }
  },
  
  "timedMessages": [
    // Dynamic messages during gameplay
    {"npcId": "alice", "text": "Update: Found evidence!", "triggerTime": 60000}
  ]
}
```

---

## Summary

**Question**: Can we add both simple messages and chat with Ink to the same phone?

**Answer**: ✅ **YES - Fully supported!**

### How:
1. Register interactive NPCs with `phoneId: "player_phone"`
2. Add phone objects with same `phoneId` and `voice`/`text`
3. Simple messages auto-convert to virtual NPCs
4. All appear in contact list together

### Result:
- Mixed contact list (interactive + simple)
- Natural communication variety
- Flexible scenario design
- Zero extra code needed

### Example:
Same phone can have:
- 2 interactive NPCs (Alice, Bob)
- 3 simple messages (Security, Director, Maintenance)
- 5 total contacts in list
- Each works correctly when clicked

**It just works!** 🎉

---

**Document Version**: 1.0
**Date**: 2025-10-30
**Status**: Supported Out-of-the-Box
