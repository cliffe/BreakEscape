# Phone Integration Plan: Bridging Phone-Messages and Phone-Chat

## Current State Analysis

### Existing Phone System (`phone-messages`)
**Purpose**: Display pre-recorded voice/text messages from scenario JSON
**Trigger**: Player interacts with phone objects in rooms
**Data Source**: Scenario JSON objects with `type: "phone"`

**Current Structure**:
```json
{
  "type": "phone",
  "name": "Reception Phone",
  "readable": true,
  "voice": "Security alert: Unauthorized access...",
  "text": "Optional text transcription",
  "sender": "Security Team",
  "timestamp": "02:45 AM"
}
```

**Features**:
- Voice playback using Web Speech API
- Text display
- Message list UI
- Mark as read/unread
- One-way communication (player listens only)

### New Phone System (`phone-chat`)
**Purpose**: Interactive NPC conversations with branching dialogue
**Trigger**: Bark notifications or direct phone access
**Data Source**: Ink story files + NPCManager

**Features**:
- Two-way conversations (player makes choices)
- Branching dialogue
- State persistence
- History tracking
- Event-driven responses
- Timed messages
- Multiple NPCs per phone

---

## Integration Strategy

### Option 1: Unified Phone UI (Recommended)
Merge both systems into a single phone interface that can display:
1. Static messages (old system)
2. Interactive chats (new system)

**Pros**:
- Single unified UI
- Better user experience
- One phone button/interaction
- Natural flow between message types

**Cons**:
- More complex implementation
- Need to refactor existing phone minigame
- Potential backward compatibility issues

### Option 2: Separate Systems with Router
Keep both systems separate but add routing logic:
- Phone objects specify `phoneType: "messages" | "chat" | "unified"`
- Interaction system routes to appropriate minigame

**Pros**:
- Minimal changes to existing code
- Backward compatible
- Clear separation of concerns

**Cons**:
- Two different UIs for "phone" concept
- User confusion (why do some phones work differently?)

### Option 3: Phone-Chat as Messages Tab (Hybrid)
Extend phone-messages with a new "Chats" tab:
- Tab 1: Messages (existing system)
- Tab 2: Chats (new NPC system)

**Pros**:
- Best of both worlds
- Familiar tab interface
- Unified phone object
- Gradual migration path

**Cons**:
- Medium complexity
- Need to coordinate both systems

---

## Recommended Approach: Option 3 (Hybrid)

### Phase 1: Add Phone Type Detection

#### Update interactions.js:
```javascript
// Enhanced phone interaction detection
if (data.type === 'phone') {
    const phoneType = data.phoneType || 'auto'; // 'messages', 'chat', 'unified', 'auto'
    
    // Auto-detect based on content
    if (phoneType === 'auto') {
        const hasStaticMessages = data.text || data.voice;
        const hasNPCs = data.npcIds && data.npcIds.length > 0;
        const phoneId = data.phoneId || 'player_phone';
        const registeredNPCs = window.npcManager?.getNPCsByPhone(phoneId) || [];
        
        if (registeredNPCs.length > 0 || hasNPCs) {
            phoneType = 'unified'; // Both static and chat
        } else if (hasStaticMessages) {
            phoneType = 'messages'; // Only static
        } else {
            phoneType = 'chat'; // Only chat
        }
    }
    
    startPhoneMinigame(data, phoneType);
}
```

### Phase 2: Create Unified Phone Minigame

#### New file: `js/minigames/phone/phone-unified-minigame.js`

```javascript
import { MinigameScene } from '../framework/base-minigame.js';
import { PhoneMessagesMinigame } from './phone-messages-minigame.js';
import { PhoneChatMinigame } from '../phone-chat/phone-chat-minigame.js';

export class PhoneUnifiedMinigame extends MinigameScene {
    constructor(container, params) {
        super(container, params);
        
        this.currentTab = 'messages'; // or 'chats'
        this.hasMessages = params.messages && params.messages.length > 0;
        this.hasChats = params.npcIds || (params.phoneId && this.getNPCCount(params.phoneId) > 0);
        
        // If only one type, go straight to it
        if (this.hasMessages && !this.hasChats) {
            this.currentTab = 'messages';
        } else if (!this.hasMessages && this.hasChats) {
            this.currentTab = 'chats';
        }
    }
    
    start() {
        this.renderTabs();
        this.showCurrentTab();
    }
    
    renderTabs() {
        // Create tab interface
        const tabsHTML = `
            <div class="phone-tabs">
                <button class="phone-tab ${this.currentTab === 'messages' ? 'active' : ''}" 
                        data-tab="messages"
                        ${!this.hasMessages ? 'disabled' : ''}>
                    📧 Messages ${this.hasMessages ? `(${this.params.messages.length})` : ''}
                </button>
                <button class="phone-tab ${this.currentTab === 'chats' ? 'active' : ''}" 
                        data-tab="chats"
                        ${!this.hasChats ? 'disabled' : ''}>
                    💬 Chats ${this.hasChats ? this.getUnreadBadge() : ''}
                </button>
            </div>
            <div class="phone-tab-content"></div>
        `;
        
        this.container.innerHTML = tabsHTML;
        
        // Set up tab switching
        this.container.querySelectorAll('.phone-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
    }
    
    switchTab(tabName) {
        this.currentTab = tabName;
        this.renderTabs();
        this.showCurrentTab();
    }
    
    showCurrentTab() {
        const content = this.container.querySelector('.phone-tab-content');
        
        if (this.currentTab === 'messages') {
            // Render phone-messages UI
            this.renderMessages(content);
        } else {
            // Render phone-chat UI
            this.renderChats(content);
        }
    }
    
    // ... rest of implementation
}
```

### Phase 3: Update Scenario JSON Schema

#### New schema for phone objects:
```json
{
  "type": "phone",
  "name": "Office Phone",
  "phoneType": "unified",
  "phoneId": "office_phone",
  
  "messages": [
    {
      "type": "voice",
      "sender": "Security",
      "voice": "Alert: Server room PIN is 5923",
      "timestamp": "02:45 AM"
    }
  ],
  
  "npcIds": ["alice", "bob"],
  
  "observations": "The office phone is ringing"
}
```

### Phase 4: Inventory Phone Item

#### Add phone to player inventory:
```json
{
  "startItemsInInventory": [
    {
      "type": "phone",
      "name": "Player Phone",
      "takeable": true,
      "phoneType": "chat",
      "phoneId": "player_phone",
      "observations": "Your personal phone with contacts"
    }
  ]
}
```

#### Update inventory.js to handle phone items:
```javascript
// When player clicks phone in inventory
if (item.type === 'phone') {
    window.MinigameFramework.startMinigame('phone-unified', null, {
        phoneType: item.phoneType || 'chat',
        phoneId: item.phoneId || 'player_phone',
        title: item.name || 'Phone'
    });
}
```

---

## Implementation Checklist

### ✅ Prerequisites (Already Complete)
- [x] Phone-chat minigame working
- [x] NPCManager with conversation history
- [x] Bark system operational
- [x] Timed messages system

### 📋 Phase 1: Detection & Routing (Week 1)
- [ ] Add phoneType detection to interactions.js
- [ ] Create routing function for phone types
- [ ] Test with existing phone objects (backward compatibility)
- [ ] Add phoneId to phone objects in scenarios

### 📋 Phase 2: Unified Phone UI (Week 2)
- [ ] Create PhoneUnifiedMinigame class
- [ ] Implement tab switching UI
- [ ] Integrate PhoneMessagesMinigame content
- [ ] Integrate PhoneChatMinigame content
- [ ] Add unread badge calculation
- [ ] Style tabs to match phone aesthetic

### 📋 Phase 3: Inventory Integration (Week 3)
- [ ] Add phone item to startItemsInInventory
- [ ] Update inventory.js to handle phone items
- [ ] Add phone button to UI (bottom-right corner)
- [ ] Implement unread badge on phone button
- [ ] Test phone access from inventory vs room objects

### 📋 Phase 4: Scenario Updates (Week 4)
- [ ] Update biometric_breach.json with NPCs
- [ ] Add phone item to player inventory in scenarios
- [ ] Convert static phone messages to new format
- [ ] Test all existing scenarios for compatibility
- [ ] Create documentation for scenario designers

### 📋 Phase 5: Polish (Week 5)
- [ ] Add transition animations between tabs
- [ ] Implement "new message" notification sounds
- [ ] Add vibration effect for incoming messages
- [ ] Polish unread badge styling
- [ ] Performance testing with many messages

---

## Backward Compatibility Plan

### Existing Phone Objects
All existing phone objects will continue to work:
- `phoneType` defaults to "auto" → detects messages and uses phone-messages UI
- No breaking changes to scenario JSON
- Gradual migration path

### Migration Path
1. **Phase 1**: All existing phones work as before (messages only)
2. **Phase 2**: Add phoneId to phones that should support chat
3. **Phase 3**: Register NPCs in scenario JSON
4. **Phase 4**: Test unified phone with both message types
5. **Phase 5**: Deprecate standalone phone-messages (optional)

---

## Data Flow Diagram

```
Player Interacts with Phone
        ↓
interactions.js detects phone type
        ↓
    ┌───────┴───────┐
    ↓               ↓
Messages Only    Has NPCs/Chat?
    ↓               ↓
phone-messages   phone-unified
                    ↓
            ┌───────┴───────┐
            ↓               ↓
        Messages Tab    Chats Tab
            ↓               ↓
    Static Messages    phone-chat
    (voice/text)       (interactive)
```

---

## File Structure

```
js/minigames/
  phone/
    phone-messages-minigame.js  (existing)
    phone-unified-minigame.js   (new)
  phone-chat/
    phone-chat-minigame.js      (existing)
    phone-chat-ui.js            (existing)
    phone-chat-conversation.js  (existing)
    phone-chat-history.js       (existing)

css/
  phone.css                     (existing)
  phone-chat-minigame.css       (existing)
  phone-unified.css             (new - tab styles)

scenarios/
  biometric_breach.json         (update)
  - Add phoneId to phone objects
  - Add npcs array
  - Add phone to startItemsInInventory
```

---

## Testing Strategy

### Unit Tests
1. Phone type detection logic
2. Tab switching functionality
3. Message/chat content rendering
4. Unread badge calculation

### Integration Tests
1. Phone-messages content in unified UI
2. Phone-chat content in unified UI
3. Switching between tabs preserves state
4. Inventory phone item works
5. Room phone objects work

### Scenario Tests
1. Existing scenarios still work (backward compat)
2. New scenarios with NPCs work
3. Mixed content (messages + chats) works
4. Multiple phones with different content

### User Experience Tests
1. Smooth tab transitions
2. Unread badges update correctly
3. Phone button shows correct badge count
4. Notifications work for new messages

---

## Timeline

**Week 1**: Detection & Routing (3-5 hours)
**Week 2**: Unified UI (8-12 hours)
**Week 3**: Inventory Integration (4-6 hours)
**Week 4**: Scenario Updates (6-8 hours)
**Week 5**: Polish & Testing (4-6 hours)

**Total**: 25-37 hours over 5 weeks

---

## Next Immediate Steps

1. **Review this plan** with stakeholders
2. **Choose integration option** (recommend Option 3)
3. **Start Phase 1**: Add phone type detection
4. **Create branch** for phone-integration work
5. **Begin implementation** of PhoneUnifiedMinigame

---

**Document Version**: 1.0
**Date**: 2025-10-30
**Status**: Ready for Review
