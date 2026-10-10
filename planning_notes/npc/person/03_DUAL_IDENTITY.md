# Dual Identity System: Phone + Person NPCs

## Overview
The dual identity system allows a single NPC character to exist as both a phone contact (remote messaging) and an in-person character (physical sprite), sharing conversation state and Ink story progress seamlessly.

## Core Concept

### Single Character, Multiple Interfaces
```
NPC Character "Alex"
    ├── Phone Interface
    │   ├── Listed in phone contacts
    │   ├── Can send/receive messages remotely
    │   └── Uses phone-chat minigame
    │
    └── Person Interface
        ├── Physical sprite in game world
        ├── Can talk face-to-face
        └── Uses person-chat minigame
        
Both interfaces access the SAME:
    - Ink story instance
    - Conversation history
    - Variables (trust_level, flags, etc.)
    - NPC state and metadata
```

### Continuity Examples

#### Example 1: In-Person First
1. Player walks up to Alex in server room
2. Talks in person: "Hey, check out these logs" (person-chat)
3. Player leaves, continues mission
4. Later, opens phone and messages Alex
5. Alex responds: "About those logs I showed you..." (phone-chat)
6. **Both conversations share same Ink story state**

#### Example 2: Phone First
1. Player receives message from Alex: "Something weird happening"
2. Player responds via phone: "What did you find?"
3. Alex: "Meet me in the server room and I'll show you"
4. Player travels to server room, talks to Alex in person
5. Alex continues: "Here are those logs I mentioned" (person-chat)
6. **Conversation picks up from phone discussion**

## NPC Type Configuration

### Three NPC Types

#### Type 1: `"phone"` (Phone Only)
```json
{
  "id": "remote_contact",
  "displayName": "Anonymous Tipster",
  "npcType": "phone",
  "phoneId": "player_phone",
  "storyPath": "scenarios/ink/tipster.json"
}
```
- Only accessible via phone
- No physical presence in game
- Cannot interact in person

#### Type 2: `"person"` (In-Person Only)
```json
{
  "id": "guard_mike",
  "displayName": "Security Guard",
  "npcType": "person",
  "roomId": "lobby",
  "position": { "x": 5, "y": 3 },
  "storyPath": "scenarios/ink/guard.json"
}
```
- Only accessible in person
- Has physical sprite
- Cannot message remotely

#### Type 3: `"both"` (Dual Identity)
```json
{
  "id": "tech_alex",
  "displayName": "Alex the Sysadmin",
  "npcType": "both",
  "phoneId": "player_phone",
  "roomId": "server1",
  "position": { "x": 8, "y": 5 },
  "storyPath": "scenarios/ink/alex.json"
}
```
- Accessible via phone AND in person
- Has physical sprite
- Can message remotely
- **Full dual identity functionality**

## State Sharing Architecture

### Shared State Components

#### 1. Ink Story Instance
```javascript
// NPCManager maintains single Ink engine per NPC
class NPCManager {
    async loadStory(npcId) {
        // Check if already loaded
        if (this.inkEngineCache.has(npcId)) {
            return this.inkEngineCache.get(npcId);
        }
        
        // Load and cache
        const npc = this.getNPC(npcId);
        const story = await this.loadStoryFile(npc.storyPath);
        const engine = new InkEngine(story);
        
        this.inkEngineCache.set(npcId, engine);
        return engine;
    }
}
```

**Key Point**: Both phone-chat and person-chat retrieve the SAME InkEngine instance via `npcManager.loadStory(npcId)`.

#### 2. Conversation History
```javascript
// Shared conversation log in NPCManager
this.conversationHistory = new Map();
// Structure: npcId → [ { type, text, timestamp, choiceText } ]

// Both minigames append to same history
addToHistory(npcId, entry) {
    if (!this.conversationHistory.has(npcId)) {
        this.conversationHistory.set(npcId, []);
    }
    this.conversationHistory.get(npcId).push(entry);
}

// Both minigames read from same history
getConversationHistory(npcId) {
    return this.conversationHistory.get(npcId) || [];
}
```

#### 3. Ink Variables
```ink
// In alex.ink
VAR trust_level = 0
VAR has_shown_logs = false
VAR knows_password = false

// These variables persist across BOTH interfaces
// If trust_level increases in person, it's also higher in phone
```

#### 4. NPC Metadata
```javascript
// Shared metadata in NPCManager
npc.metadata = {
    lastInteractionTime: Date.now(),
    lastInteractionType: 'person', // or 'phone'
    totalInteractions: 5,
    currentKnot: 'main_menu'
};
```

## Minigame Integration

### Phone-Chat Minigame
```javascript
// js/minigames/phone-chat/phone-chat-minigame.js

constructor(container, params) {
    super(container, params);
    this.npcManager = window.npcManager;
    this.currentNPCId = params.npcId;
}

async startConversation() {
    // Load shared Ink engine
    this.inkEngine = await this.npcManager.loadStory(this.currentNPCId);
    
    // Load shared conversation history
    this.history = this.npcManager.getConversationHistory(this.currentNPCId);
    
    // Continue from current state
    this.showCurrentDialogue();
}

selectChoice(choiceIndex) {
    // Make choice in shared Ink engine
    this.inkEngine.selectChoice(choiceIndex);
    
    // Add to shared history
    this.npcManager.addToHistory(this.currentNPCId, {
        type: 'choice',
        text: choiceText,
        timestamp: Date.now()
    });
    
    // Update shared metadata
    const npc = this.npcManager.getNPC(this.currentNPCId);
    npc.metadata.lastInteractionType = 'phone';
    npc.metadata.lastInteractionTime = Date.now();
}
```

### Person-Chat Minigame
```javascript
// js/minigames/person-chat/person-chat-minigame.js

constructor(container, params) {
    super(container, params);
    this.npcManager = window.npcManager;
    this.currentNPCId = params.npcId;
}

async startConversation() {
    // Load shared Ink engine (same instance as phone-chat)
    this.inkEngine = await this.npcManager.loadStory(this.currentNPCId);
    
    // Load shared conversation history
    this.history = this.npcManager.getConversationHistory(this.currentNPCId);
    
    // Continue from current state
    this.showCurrentDialogue();
}

selectChoice(choiceIndex) {
    // Make choice in shared Ink engine
    this.inkEngine.selectChoice(choiceIndex);
    
    // Add to shared history
    this.npcManager.addToHistory(this.currentNPCId, {
        type: 'choice',
        text: choiceText,
        timestamp: Date.now()
    });
    
    // Update shared metadata
    const npc = this.npcManager.getNPC(this.currentNPCId);
    npc.metadata.lastInteractionType = 'person';
    npc.metadata.lastInteractionTime = Date.now();
}
```

### Key Pattern
**Both minigames**:
1. Load story via `npcManager.loadStory(npcId)` → same instance
2. Read history via `npcManager.getConversationHistory(npcId)` → same array
3. Make choices via shared InkEngine → same state
4. Update shared metadata → same object

## Scenario Design Patterns

### Pattern 1: Remote Introduction, In-Person Meeting
```ink
// alex.ink

VAR met_in_person = false

=== start ===
{ met_in_person:
    -> already_met
- else:
    -> first_contact
}

=== first_contact ===
// Accessed via phone initially
Hey there! I'm Alex, one of the sysadmins here.
I've been monitoring some suspicious activity.
~ met_in_person = false
-> phone_menu

=== phone_menu ===
+ [What kind of activity?] -> explain_activity
+ [Can we meet in person?] -> arrange_meeting
+ [Thanks, I'll keep that in mind] -> goodbye

=== arrange_meeting ===
Sure! I'm usually in the server room on the second floor.
Come find me there and I'll show you what I found.
-> END

// When player walks up in person:
=== already_met ===
{ last_interaction_type == "phone":
    Oh hey! Good to finally meet you face-to-face.
    Let me show you those logs I mentioned.
- else:
    Back for more info?
}
-> in_person_menu

=== in_person_menu ===
+ [Show me the logs] -> show_logs
+ [What else have you found?] -> additional_info
+ [I'll come back later] -> goodbye
```

### Pattern 2: Quick Phone Updates During Mission
```ink
// alex.ink

VAR player_has_evidence = false
VAR player_in_ceo_office = false

// Player messages from CEO office
=== on_player_in_ceo ===
// Triggered by event
Hey! Be careful in there. 
The CEO has cameras everywhere.
~ player_in_ceo_office = true
-> quick_phone_menu

=== quick_phone_menu ===
+ [What should I look for?] -> phone_advice
+ [Talk later] -> END

// Later, player returns in person
=== in_person_followup ===
{ player_in_ceo_office:
    So, did you find anything in the CEO's office?
- else:
    Have you checked the CEO's office yet?
}
-> in_person_menu
```

### Pattern 3: Context-Aware Greetings
```ink
// alex.ink

VAR last_interaction_type = "none"

=== start ===
{ last_interaction_type:
    - "phone": 
        -> greeting_after_phone
    - "person":
        -> greeting_after_person
    - else:
        -> first_greeting
}

=== greeting_after_phone ===
// Player messaged recently, now talking in person
Hey! Good to see you in person after all those messages.
-> main_menu

=== greeting_after_person ===
// Player talked in person, now messaging
Got your message! What's up?
-> main_menu

=== first_greeting ===
// First contact (either phone or in person)
Hi there! I'm Alex, the sysadmin.
-> main_menu
```

## Implementation Details

### NPCManager Changes

#### Loading Dual-Identity NPCs
```javascript
registerNPC(npcData) {
    // ... existing registration ...
    
    // For "both" type NPCs:
    if (npcData.npcType === 'both') {
        // Ensure both phone and person configs are present
        if (!npcData.phoneId) {
            console.warn(`NPC ${npcData.id} has type "both" but no phoneId`);
        }
        if (!npcData.roomId) {
            console.warn(`NPC ${npcData.id} has type "both" but no roomId`);
        }
    }
    
    // ... rest of registration ...
}
```

#### Metadata Tracking
```javascript
updateNPCMetadata(npcId, updates) {
    const npc = this.getNPC(npcId);
    if (!npc.metadata) {
        npc.metadata = {};
    }
    Object.assign(npc.metadata, updates);
}

getLastInteractionType(npcId) {
    const npc = this.getNPC(npcId);
    return npc.metadata?.lastInteractionType || 'none';
}
```

### Ink Story Enhancements

#### Accessing Interaction Context
```javascript
// Make metadata accessible to Ink via external functions

inkEngine.bindExternalFunction('get_last_interaction_type', () => {
    const npc = this.getNPC(currentNPCId);
    return npc.metadata?.lastInteractionType || 'none';
});

inkEngine.bindExternalFunction('get_interaction_count', () => {
    const npc = this.getNPC(currentNPCId);
    return npc.metadata?.totalInteractions || 0;
});
```

#### Using in Ink
```ink
// alex.ink

=== contextual_greeting ===
{ get_last_interaction_type():
    - "phone":
        Good to finally meet face-to-face!
    - "person":
        Hey! Got your message.
    - else:
        Hi! I'm Alex.
}
-> main_menu
```

## Testing Strategy

### Test Case 1: Phone → Person Continuity
1. Open phone, message Alex
2. Select choice: "What's going on?"
3. Alex responds with trust_level = 1
4. Close phone, travel to server room
5. Talk to Alex in person
6. Verify: trust_level still = 1
7. Verify: Alex references phone conversation

### Test Case 2: Person → Phone Continuity
1. Walk up to Alex in server room
2. Talk in person, select: "Can you help?"
3. Alex sets has_asked_for_help = true
4. Close conversation, open phone
5. Message Alex
6. Verify: has_asked_for_help still = true
7. Verify: Alex remembers in-person request

### Test Case 3: Mixed Conversation Flow
1. Message Alex: "What should I look for?"
2. Alex: "Check the CEO's office" (phone)
3. Player goes to CEO office, finds evidence
4. Returns to Alex in person
5. Alex: "Did you find it?" (person)
6. Player shows evidence in person
7. Later, Alex sends congratulations message via phone
8. Verify: All state transitions work correctly

### Test Case 4: Event Barks Across Interfaces
1. Alex sends bark via phone: "Watch out!"
2. Bark increases trust_level
3. Player talks to Alex in person
4. Verify: trust_level increase persists
5. New dialogue options available based on trust

## User Experience Benefits

### Immersion
- Characters feel consistent across contexts
- No jarring state resets
- Natural conversation flow

### Flexibility
- Message remotely when convenient
- Talk in person when face-to-face needed
- Mix both approaches naturally

### Storytelling
- Build relationships gradually across both mediums
- Characters can reference past interactions
- Trust/relationship mechanics span both interfaces

## Scenario Configuration Example

### Complete Dual-Identity NPC
```json
{
  "id": "alex_sysadmin",
  "displayName": "Alex the Sysadmin",
  "npcType": "both",
  
  "phoneId": "player_phone",
  "avatar": "assets/npc/avatars/npc_helper.png",
  
  "roomId": "server1",
  "position": { "x": 8, "y": 5 },
  "spriteSheet": "hacker",
  "spriteConfig": {
    "idleFrameStart": 20,
    "idleFrameEnd": 23,
    "talkFrameStart": 28,
    "talkFrameEnd": 31
  },
  
  "storyPath": "scenarios/ink/alex-dual.json",
  
  "eventMappings": [
    {
      "eventPattern": "room_entered:ceo",
      "targetKnot": "on_player_in_ceo_office",
      "cooldown": 0,
      "onceOnly": true
    }
  ],
  
  "timedMessages": [
    {
      "delay": 30000,
      "message": "Hey, checking in. How's the investigation going?",
      "type": "text"
    }
  ]
}
```

### Corresponding Ink Story
```ink
// scenarios/ink/alex-dual.ink

VAR trust_level = 0
VAR met_in_person = false
VAR has_shown_logs = false
VAR last_interaction_type = "none"

=== start ===
~ last_interaction_type = get_last_interaction_type()

{ met_in_person:
    { last_interaction_type:
        - "phone": -> greeting_after_phone
        - "person": -> greeting_after_person
        - else: -> casual_greeting
    }
- else:
    -> first_meeting
}

=== first_meeting ===
Hey there! I'm Alex, the sysadmin around here.
~ met_in_person = true
-> main_menu

=== greeting_after_phone ===
Oh hey! Good to finally see you in person.
We've been chatting, but this is better. 👋
-> main_menu

=== greeting_after_person ===
Got your message! What do you need?
-> main_menu

=== casual_greeting ===
Back again? What's up?
-> main_menu

=== main_menu ===
+ [Ask for help] -> ask_for_help
+ {trust_level >= 2} [Ask about suspicious activity] -> show_logs
+ [Say goodbye] -> goodbye

=== ask_for_help ===
Sure, I can help. What do you need?
~ trust_level = trust_level + 1
-> main_menu

=== show_logs ===
Alright, let me show you what I found.
{ has_shown_logs == false:
    This is the first time I'm showing you this...
    ~ has_shown_logs = true
- else:
    Here are those logs again.
}
# unlock_door:server_room
Access granted!
-> main_menu

=== goodbye ===
{ last_interaction_type:
    - "phone": Talk to you later!
    - "person": See you around! 👋
    - else: Take care!
}
-> END

// Event-triggered bark (sent via phone regardless of current context)
=== on_player_in_ceo_office ===
Hey! I see you're in the CEO's office.
Be careful in there - lots of cameras! 📷
~ trust_level = trust_level + 1
-> main_menu
```

## Next Steps
1. Modify NPCManager to handle "both" type
2. Update phone-chat to use shared state
3. Update person-chat to use shared state
4. Add metadata tracking to NPCManager
5. Create test scenario with dual-identity NPC
6. Test continuity across interfaces
