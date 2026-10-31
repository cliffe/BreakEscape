# Implementation Plan: NPC Inkscript Integration

## Development Roadmap

This document provides a step-by-step implementation plan for integrating Ink-based NPCs into Break Escape.

## Phase 0: Preparation (Before Coding)

### 0.1 Install Ink Compiler
```bash
# Install inklecate (Ink compiler)
npm install -g inkle/ink

# Or download binary from:
# https://github.com/inkle/ink/releases

# Verify installation
inklecate --version
```

### 0.2 Set Up Directory Structure
```bash
mkdir -p assets/npc/avatars
mkdir -p assets/npc/sounds
mkdir -p scenarios/ink
mkdir -p scenarios/compiled
mkdir -p js/systems/ink
mkdir -p js/minigames/phone-chat
```

### 0.3 Download Dependencies
- Download ink-js from: https://cdn.jsdelivr.net/npm/inkjs@2.2.3/dist/ink.js
- Save placeholder avatar images (64x64 pixel art)
- Save placeholder sound effects (message_received.wav, message_sent.wav)

### 0.4 Create Placeholder Assets
```bash
# Placeholder avatars (copy existing assets temporarily)
cp assets/objects/pc.png assets/npc/avatars/npc_alice.png
cp assets/objects/phone.png assets/npc/avatars/npc_bob.png

# Sound effects (can use existing sounds as placeholders)
# or create silent placeholder files
```

---

## Phase 1: Core Ink Integration (Days 1-3)

### 1.1 Add Ink.js Library

**File:** `index.html`

```html
<!-- Add after Phaser script tag -->
<script src="https://cdn.jsdelivr.net/npm/inkjs@2.2.3/dist/ink.js"></script>
```

**Verify:** Open browser console, check `window.inkjs` exists

### 1.2 Create Ink Engine Wrapper

**File:** `js/systems/ink/ink-engine.js`

```javascript
// Ink.js wrapper for Break Escape
export class InkEngine {
  constructor() {
    this.stories = new Map(); // npcId -> Story instance
    this.storyData = new Map(); // npcId -> compiled JSON
  }

  // Load compiled Ink JSON
  async loadStory(npcId, jsonPath) {
    try {
      const response = await fetch(jsonPath);
      const storyData = await response.json();
      
      // Create Ink story instance
      const story = new inkjs.Story(storyData);
      
      // Bind external functions
      this.bindExternalFunctions(story);
      
      // Store
      this.stories.set(npcId, story);
      this.storyData.set(npcId, storyData);
      
      console.log(`Loaded Ink story for ${npcId}`);
      return story;
    } catch (error) {
      console.error(`Failed to load Ink story for ${npcId}:`, error);
      return null;
    }
  }

  // Get story instance for NPC
  getStory(npcId) {
    return this.stories.get(npcId);
  }

  // Navigate to a specific knot
  goToKnot(npcId, knotName) {
    const story = this.getStory(npcId);
    if (!story) {
      console.error(`No story found for ${npcId}`);
      return null;
    }

    try {
      story.ChoosePathString(knotName);
      return this.continue(npcId);
    } catch (error) {
      console.error(`Failed to go to knot ${knotName}:`, error);
      return null;
    }
  }

  // Continue story (get next text)
  continue(npcId) {
    const story = this.getStory(npcId);
    if (!story) return null;

    const result = {
      text: '',
      choices: [],
      tags: []
    };

    // Continue story
    while (story.canContinue) {
      const line = story.Continue();
      result.text += line;
      
      // Collect tags from this line
      if (story.currentTags.length > 0) {
        result.tags.push(...story.currentTags);
      }
    }

    // Get available choices
    if (story.currentChoices.length > 0) {
      result.choices = story.currentChoices.map(choice => ({
        index: choice.index,
        text: choice.text
      }));
    }

    return result;
  }

  // Make a choice
  choose(npcId, choiceIndex) {
    const story = this.getStory(npcId);
    if (!story) return null;

    try {
      story.ChooseChoiceIndex(choiceIndex);
      return this.continue(npcId);
    } catch (error) {
      console.error(`Failed to choose option ${choiceIndex}:`, error);
      return null;
    }
  }

  // Get/set Ink variables
  getVariable(npcId, varName) {
    const story = this.getStory(npcId);
    if (!story) return null;
    return story.variablesState[varName];
  }

  setVariable(npcId, varName, value) {
    const story = this.getStory(npcId);
    if (!story) return;
    story.variablesState[varName] = value;
  }

  // Save/restore story state
  saveState(npcId) {
    const story = this.getStory(npcId);
    if (!story) return null;
    return story.state.ToJson();
  }

  restoreState(npcId, stateJson) {
    const story = this.getStory(npcId);
    if (!story) return;
    story.state.LoadJson(stateJson);
  }

  // Bind external functions that Ink can call
  bindExternalFunctions(story) {
    // Items
    story.BindExternalFunction('give_item', (itemType) => {
      console.log(`[Ink] give_item: ${itemType}`);
      if (window.addToInventory) {
        // TODO: Create item object and add to inventory
      }
    });

    story.BindExternalFunction('remove_item', (itemType) => {
      console.log(`[Ink] remove_item: ${itemType}`);
      // TODO: Implement
    });

    // Doors
    story.BindExternalFunction('unlock_door', (doorId) => {
      console.log(`[Ink] unlock_door: ${doorId}`);
      // TODO: Implement door unlocking
    });

    // UI
    story.BindExternalFunction('show_notification', (message) => {
      if (window.showNotification) {
        window.showNotification(message, 'info', 'NPC');
      }
    });

    // Game state queries
    story.BindExternalFunction('get_current_room', () => {
      return window.currentPlayerRoom || '';
    }, true); // true = returns value

    story.BindExternalFunction('has_item', (itemType) => {
      if (!window.inventory) return false;
      return window.inventory.items.some(item => item.type === itemType);
    }, true);
  }

  // Parse tags into structured data
  parseTags(tags) {
    const parsed = {};
    
    tags.forEach(tag => {
      const [key, ...valueParts] = tag.split(':');
      const value = valueParts.join(':').trim();
      parsed[key.trim()] = value;
    });

    return parsed;
  }
}

// Global instance
window.inkEngine = new InkEngine();
```

**Test:**
```javascript
// In browser console
console.log(window.inkEngine);
```

### 1.3 Create Simple Test Ink Script

**File:** `scenarios/ink/test.ink`

```ink
// Test Ink script for development
VAR test_counter = 0

=== start ===
# speaker: TestNPC
# type: bark
Hello! This is a test message from Ink.
~ test_counter++
-> hub

=== hub ===
# speaker: TestNPC
# type: conversation
What would you like to test?
+ [Test choice 1] -> test_1
+ [Test choice 2] -> test_2
+ [Exit] -> END

=== test_1 ===
# speaker: TestNPC
You selected test choice 1!
Counter: {test_counter}
-> hub

=== test_2 ===
# speaker: TestNPC
You selected test choice 2!
~ test_counter++
-> hub
```

**Compile:**
```bash
cd scenarios/ink
inklecate test.ink -o ../compiled/test.json
```

**Verify:** Check that `scenarios/compiled/test.json` exists

### 1.4 Test Ink Engine

**Create test page:** `test-ink-engine.html`

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Ink Engine Test</title>
</head>
<body>
    <h1>Ink Engine Test</h1>
    <div id="output"></div>
    <div id="choices"></div>

    <script src="https://cdn.jsdelivr.net/npm/inkjs@2.2.3/dist/ink.js"></script>
    <script type="module">
        import { InkEngine } from './js/systems/ink/ink-engine.js';

        const engine = new InkEngine();
        const output = document.getElementById('output');
        const choicesDiv = document.getElementById('choices');

        async function test() {
            // Load story
            await engine.loadStory('test', 'scenarios/compiled/test.json');

            // Go to start
            const result = engine.goToKnot('test', 'start');
            
            // Display result
            output.innerHTML = `<p>${result.text}</p>`;
            output.innerHTML += `<p>Tags: ${result.tags.join(', ')}</p>`;

            // Display choices
            result.choices.forEach(choice => {
                const btn = document.createElement('button');
                btn.textContent = choice.text;
                btn.onclick = () => {
                    const nextResult = engine.choose('test', choice.index);
                    output.innerHTML = `<p>${nextResult.text}</p>`;
                    
                    // Clear and redisplay choices
                    choicesDiv.innerHTML = '';
                    nextResult.choices.forEach(c => {
                        const b = document.createElement('button');
                        b.textContent = c.text;
                        b.onclick = () => test(); // Recursive for testing
                        choicesDiv.appendChild(b);
                    });
                };
                choicesDiv.appendChild(btn);
            });
        }

        test();
    </script>
</body>
</html>
```

**Test:** Open `test-ink-engine.html` in browser, verify dialogue and choices work

---

## Phase 2: NPC Event System (Days 3-4)

### 2.1 Create Event Dispatcher

**File:** `js/systems/npc-events.js`

```javascript
// NPC Event Dispatcher
export class NPCEventDispatcher {
  constructor() {
    this.listeners = [];
    this.eventQueue = [];
    this.cooldowns = new Map();
    this.isProcessing = false;
    this.debug = false;
  }

  // Register event listener
  on(eventPattern, callback) {
    this.listeners.push({ eventPattern, callback });
  }

  // Emit an event
  emit(eventType, eventData) {
    const event = {
      type: eventType,
      data: eventData,
      timestamp: Date.now()
    };

    if (this.debug) {
      console.log(`[NPC Event] ${eventType}`, eventData);
    }

    this.eventQueue.push(event);
    this.processQueue();
  }

  // Process queued events
  async processQueue() {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift();

      // Check cooldown
      if (this.isOnCooldown(event)) {
        if (this.debug) {
          console.log(`[NPC Event] Cooldown: ${event.type}`);
        }
        continue;
      }

      // Notify listeners
      for (const listener of this.listeners) {
        if (this.matchesPattern(event.type, listener.eventPattern)) {
          await listener.callback(event);
        }
      }

      // Update cooldown
      this.updateCooldown(event);
    }

    this.isProcessing = false;
  }

  isOnCooldown(event) {
    const key = event.type;
    const lastTrigger = this.cooldowns.get(key);

    if (!lastTrigger) return false;

    const cooldownDuration = 5000; // 5 seconds default
    return (Date.now() - lastTrigger) < cooldownDuration;
  }

  updateCooldown(event) {
    this.cooldowns.set(event.type, Date.now());
  }

  matchesPattern(eventType, pattern) {
    if (pattern === '*') return true;
    if (pattern === eventType) return true;

    // Support wildcards
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    return regex.test(eventType);
  }
}

// Global instance
window.npcEvents = new NPCEventDispatcher();
window.npcEvents.debug = true; // Enable debug logging initially
```

**Import in:** `js/main.js`

```javascript
import './systems/npc-events.js';
```

### 2.2 Add Event Emission to Game Code

**File:** `js/core/rooms.js` (Room transitions)

```javascript
// In updatePlayerRoom() function, after room change detected:
if (window.currentPlayerRoom !== previousRoom) {
  // ... existing code ...

  // Emit NPC event
  if (window.npcEvents) {
    window.npcEvents.emit('room_entered', {
      roomId: window.currentPlayerRoom,
      previousRoom: previousRoom,
      firstVisit: !window.discoveredRooms.has(window.currentPlayerRoom)
    });
  }
}
```

**File:** `js/systems/inventory.js` (Item pickup)

```javascript
// In addToInventory() function:
export function addToInventory(item) {
  // ... existing code ...

  // Emit NPC event
  if (window.npcEvents) {
    window.npcEvents.emit('item_picked_up', {
      itemType: item.type,
      itemName: item.name,
      roomId: window.currentPlayerRoom
    });
  }
}
```

**Test:** Move between rooms and pick up items, check console for `[NPC Event]` logs

### 2.3 Create NPC Manager

**File:** `js/systems/npc-manager.js`

```javascript
// NPC Manager - coordinates NPCs and events
export class NPCManager {
  constructor() {
    this.npcs = new Map(); // npcId -> NPC config
    this.eventMappings = new Map(); // npcId -> event mappings
  }

  // Register an NPC
  registerNPC(npcId, npcConfig) {
    this.npcs.set(npcId, npcConfig);
    this.eventMappings.set(npcId, npcConfig.eventMappings || {});

    // Set up event listeners for this NPC
    this.setupEventListeners(npcId);

    console.log(`Registered NPC: ${npcId}`);
  }

  // Set up event listeners for an NPC
  setupEventListeners(npcId) {
    const mappings = this.eventMappings.get(npcId);
    
    for (const [eventPattern, knotName] of Object.entries(mappings)) {
      window.npcEvents.on(eventPattern, async (event) => {
        console.log(`[NPC] ${npcId} triggered by ${event.type} -> ${knotName}`);
        await this.handleEvent(npcId, knotName, event);
      });
    }
  }

  // Handle event triggering Ink knot
  async handleEvent(npcId, knotName, event) {
    // Go to knot in Ink
    const result = window.inkEngine.goToKnot(npcId, knotName);
    
    if (!result) {
      console.error(`Failed to execute knot ${knotName} for ${npcId}`);
      return;
    }

    // Parse tags
    const tags = window.inkEngine.parseTags(result.tags);

    // Determine if bark or conversation
    if (tags.type === 'bark') {
      // Show bark notification
      if (window.npcBarkSystem) {
        window.npcBarkSystem.showBark(npcId, result.text, tags);
      }
    } else {
      // Update phone chat conversation
      // TODO: Implement phone chat update
      console.log(`[NPC] ${npcId} conversation updated`);
    }
  }

  // Get NPC config
  getNPC(npcId) {
    return this.npcs.get(npcId);
  }
}

// Global instance
window.npcManager = new NPCManager();
```

**Import in:** `js/main.js`

```javascript
import './systems/npc-manager.js';
```

---

## Phase 3: Bark Notification System (Days 4-5)

### 3.1 Create Bark CSS

**File:** `css/npc-barks.css`

```css
/* NPC Bark Notifications */
.npc-bark-notification {
  position: fixed;
  bottom: 120px;
  right: 20px;
  width: 320px;
  background: #fff;
  border: 2px solid #000;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  animation: bark-slide-in 0.3s ease-out;
  z-index: 9999;
  font-family: 'VT323', monospace;
}

@keyframes bark-slide-in {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.npc-bark-notification:hover {
  background: #f0f0f0;
  transform: translateY(-2px);
  box-shadow: 4px 6px 0 rgba(0, 0, 0, 0.3);
}

.npc-bark-avatar {
  width: 48px;
  height: 48px;
  image-rendering: pixelated;
  border: 2px solid #000;
}

.npc-bark-content {
  flex: 1;
}

.npc-bark-name {
  font-size: 12pt;
  font-weight: bold;
  color: #000;
  margin-bottom: 4px;
}

.npc-bark-message {
  font-size: 10pt;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.npc-bark-close {
  width: 20px;
  height: 20px;
  background: #ff0000;
  color: #fff;
  border: 2px solid #000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 12pt;
  font-weight: bold;
  line-height: 1;
}

.npc-bark-close:hover {
  background: #cc0000;
}
```

**Add to:** `index.html`

```html
<link rel="stylesheet" href="css/npc-barks.css">
```

### 3.2 Create Bark System

**File:** `js/systems/npc-barks.js`

```javascript
// NPC Bark System
export class NPCBarkSystem {
  constructor() {
    this.container = null;
    this.activeBarks = [];
    this.maxBarks = 3;
  }

  init() {
    // Create container for barks
    this.container = document.createElement('div');
    this.container.id = 'npc-bark-container';
    document.body.appendChild(this.container);
  }

  showBark(npcId, message, tags = {}) {
    const npc = window.npcManager.getNPC(npcId);
    if (!npc) return;

    // Create bark element
    const bark = document.createElement('div');
    bark.className = 'npc-bark-notification';
    bark.dataset.npcId = npcId;

    bark.innerHTML = `
      <img src="${npc.avatar}" alt="${npc.name}" class="npc-bark-avatar">
      <div class="npc-bark-content">
        <div class="npc-bark-name">${npc.name}</div>
        <div class="npc-bark-message">${message}</div>
      </div>
      <div class="npc-bark-close">×</div>
    `;

    // Click to open phone chat
    bark.addEventListener('click', (e) => {
      if (!e.target.classList.contains('npc-bark-close')) {
        this.openPhoneChat(npcId);
        this.dismissBark(bark);
      }
    });

    // Close button
    bark.querySelector('.npc-bark-close').addEventListener('click', (e) => {
      e.stopPropagation();
      this.dismissBark(bark);
    });

    // Add to DOM
    this.container.appendChild(bark);
    this.activeBarks.push(bark);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      this.dismissBark(bark);
    }, 5000);

    // Remove excess barks
    while (this.activeBarks.length > this.maxBarks) {
      this.dismissBark(this.activeBarks[0]);
    }

    // Reposition barks
    this.repositionBarks();
  }

  dismissBark(bark) {
    if (!bark || !bark.parentNode) return;

    bark.style.animation = 'bark-slide-in 0.3s ease-out reverse';
    setTimeout(() => {
      if (bark.parentNode) {
        bark.parentNode.removeChild(bark);
      }
      this.activeBarks = this.activeBarks.filter(b => b !== bark);
      this.repositionBarks();
    }, 300);
  }

  repositionBarks() {
    this.activeBarks.forEach((bark, index) => {
      bark.style.bottom = `${120 + (index * 120)}px`;
    });
  }

  openPhoneChat(npcId) {
    // TODO: Implement phone chat opening
    console.log(`[Bark] Opening phone chat for ${npcId}`);
    if (window.MinigameFramework) {
      // window.MinigameFramework.startMinigame('phone-chat', null, { npcId });
    }
  }
}

// Global instance
window.npcBarkSystem = new NPCBarkSystem();
```

**Import and init in:** `js/main.js`

```javascript
import './systems/npc-barks.js';

// In initializeGame():
window.npcBarkSystem.init();
```

**Test:** Manually trigger a bark from console:
```javascript
window.npcBarkSystem.showBark('test', 'This is a test message!', {});
```

---

## Phase 4: Phone Chat Minigame (Days 5-7)

### 4.1 Fork Phone Messages Minigame

```bash
cp js/minigames/phone/phone-messages-minigame.js js/minigames/phone-chat/phone-chat-minigame.js
```

### 4.2 Modify Phone Chat Minigame

**File:** `js/minigames/phone-chat/phone-chat-minigame.js`

Start with a simplified version that extends the existing phone minigame:

```javascript
import { MinigameScene } from '../framework/base-minigame.js';

export class PhoneChatMinigame extends MinigameScene {
  constructor(container, params) {
    super(container, params);
    
    this.npcId = params.npcId || null;
    this.viewMode = 'contacts'; // 'contacts' or 'conversation'
    this.currentNPC = null;
    this.conversationHistory = [];
  }

  init() {
    super.init();
    
    // Set title
    this.headerElement.querySelector('.minigame-title').textContent = 
      this.npcId ? window.npcManager.getNPC(this.npcId).name : 'PHONE';

    // Create UI based on mode
    if (this.npcId) {
      this.viewMode = 'conversation';
      this.currentNPC = this.npcId;
      this.createConversationView();
    } else {
      this.viewMode = 'contacts';
      this.createContactsView();
    }
  }

  createContactsView() {
    this.gameContainer.innerHTML = '<div class="phone-chat-contacts"></div>';
    
    const contactsList = this.gameContainer.querySelector('.phone-chat-contacts');
    
    // Get all registered NPCs
    const npcs = Array.from(window.npcManager.npcs.values());
    
    npcs.forEach(npc => {
      const contactDiv = document.createElement('div');
      contactDiv.className = 'phone-chat-contact';
      contactDiv.innerHTML = `
        <img src="${npc.avatar}" class="phone-chat-contact-avatar">
        <div class="phone-chat-contact-info">
          <div class="phone-chat-contact-name">${npc.name}</div>
          <div class="phone-chat-contact-role">${npc.role}</div>
        </div>
      `;
      
      contactDiv.addEventListener('click', () => {
        this.openConversation(npc.id);
      });
      
      contactsList.appendChild(contactDiv);
    });
  }

  createConversationView() {
    this.gameContainer.innerHTML = `
      <div class="phone-chat-conversation">
        <div class="phone-chat-messages"></div>
        <div class="phone-chat-choices"></div>
      </div>
    `;
    
    this.messagesContainer = this.gameContainer.querySelector('.phone-chat-messages');
    this.choicesContainer = this.gameContainer.querySelector('.phone-chat-choices');
    
    // Load conversation from Ink
    this.loadConversation();
  }

  openConversation(npcId) {
    this.currentNPC = npcId;
    this.viewMode = 'conversation';
    this.createConversationView();
  }

  loadConversation() {
    // Get current knot from NPC
    const npc = window.npcManager.getNPC(this.currentNPC);
    const knotName = npc.currentKnot || npc.initialKnot;
    
    // Execute Ink
    const result = window.inkEngine.goToKnot(this.currentNPC, knotName);
    
    if (result) {
      this.displayMessage(result.text, 'npc');
      this.displayChoices(result.choices);
    }
  }

  displayMessage(text, sender) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `phone-chat-message ${sender}`;
    messageDiv.innerHTML = `
      <div class="message-bubble">${text}</div>
      <div class="phone-chat-message-timestamp">${this.getTimestamp()}</div>
    `;
    
    this.messagesContainer.appendChild(messageDiv);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  displayChoices(choices) {
    this.choicesContainer.innerHTML = '';
    
    choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'phone-chat-choice-button';
      btn.textContent = choice.text;
      
      btn.addEventListener('click', () => {
        this.selectChoice(choice.index, choice.text);
      });
      
      this.choicesContainer.appendChild(btn);
    });
  }

  selectChoice(choiceIndex, choiceText) {
    // Show player's choice as a message
    this.displayMessage(choiceText, 'player');
    
    // Execute choice in Ink
    const result = window.inkEngine.choose(this.currentNPC, choiceIndex);
    
    if (result) {
      // Show NPC response
      setTimeout(() => {
        this.displayMessage(result.text, 'npc');
        this.displayChoices(result.choices);
      }, 500);
    }
  }

  getTimestamp() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  start() {
    super.start();
    console.log('Phone chat minigame started');
  }

  cleanup() {
    super.cleanup();
  }
}
```

### 4.3 Register Phone Chat Minigame

**File:** `js/minigames/index.js`

```javascript
export { PhoneChatMinigame } from './phone-chat/phone-chat-minigame.js';

// In MinigameFramework registration:
MinigameFramework.registerScene('phone-chat', PhoneChatMinigame);
```

### 4.4 Create Phone Chat CSS

**File:** `css/phone-chat.css`

```css
/* Phone Chat Minigame */
.phone-chat-contacts {
  padding: 10px;
}

.phone-chat-contact {
  display: flex;
  align-items: center;
  padding: 10px;
  border-bottom: 2px solid #000;
  cursor: pointer;
  background: #e0e0e0;
  margin-bottom: 5px;
}

.phone-chat-contact:hover {
  background: #d0d0d0;
}

.phone-chat-contact-avatar {
  width: 64px;
  height: 64px;
  image-rendering: pixelated;
  border: 2px solid #000;
  margin-right: 10px;
}

.phone-chat-contact-name {
  font-size: 14pt;
  font-weight: bold;
  color: #000;
}

.phone-chat-contact-role {
  font-size: 10pt;
  font-style: italic;
  color: #666;
}

.phone-chat-conversation {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.phone-chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  background: #f5f5f5;
}

.phone-chat-message {
  display: flex;
  margin: 10px 0;
  animation: message-appear 0.3s ease-out;
}

@keyframes message-appear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.phone-chat-message.npc {
  justify-content: flex-start;
}

.phone-chat-message.npc .message-bubble {
  background: #e0e0e0;
  color: #000;
  border: 2px solid #000;
  padding: 10px;
  max-width: 70%;
}

.phone-chat-message.player {
  justify-content: flex-end;
}

.phone-chat-message.player .message-bubble {
  background: #a0d0ff;
  color: #000;
  border: 2px solid #000;
  padding: 10px;
  max-width: 70%;
}

.phone-chat-choices {
  padding: 10px;
  border-top: 2px solid #000;
  background: #f5f5f5;
}

.phone-chat-choice-button {
  width: 100%;
  padding: 12px;
  margin-bottom: 8px;
  background: #fff;
  color: #000;
  border: 2px solid #000;
  cursor: pointer;
  font-family: 'VT323', monospace;
  font-size: 14pt;
  text-align: left;
}

.phone-chat-choice-button:hover {
  background: #e0e0e0;
  transform: translate(-2px, -2px);
  box-shadow: 2px 2px 0 #000;
}

.phone-chat-choice-button::before {
  content: '▶ ';
  color: #666;
}
```

**Add to:** `index.html`

```html
<link rel="stylesheet" href="css/phone-chat.css">
```

---

## Phase 5: Scenario Integration (Days 7-8)

### 5.1 Create Example Ink Script

**File:** `scenarios/ink/biometric_breach_npcs.ink`

```ink
// Biometric Breach - NPC Conversations
VAR player_in_reception = false
VAR player_in_lab = false
VAR fingerprint_collected = false

// Alice - Security Analyst
=== alice_intro ===
# speaker: Alice
# type: bark
# trigger: game_start
Hey! I'm Alice from security. We've got a major breach tonight.
-> END

=== alice_room_reception ===
# speaker: Alice
# type: bark
Start in reception. Look for fingerprints on the computer.
~ player_in_reception = true
-> END

=== alice_item_fingerprint_kit ===
# speaker: Alice
# type: bark
Good, you have the fingerprint kit. Use it on suspicious surfaces.
-> END

=== alice_hub ===
# speaker: Alice
# type: conversation
{fingerprint_collected: Great work on that fingerprint!|What can I help you with?}
+ [What happened?] -> alice_explain
+ [Where should I go?] -> alice_directions
+ [Goodbye] -> END

=== alice_explain ===
# speaker: Alice
Someone broke into the biometrics lab around 2 AM.
We need to find out who it was and what they took.
-> alice_hub

=== alice_directions ===
# speaker: Alice
{not player_in_reception: Check reception first.|Check the lab next. It's north of the main office.}
-> alice_hub
```

**Compile:**
```bash
inklecate scenarios/ink/biometric_breach_npcs.ink -o scenarios/compiled/biometric_breach_npcs.json
```

### 5.2 Update Scenario JSON

**File:** `scenarios/biometric_breach.json`

Add NPC configuration:

```json
{
  "scenario_brief": "...",
  "npcs": {
    "alice": {
      "id": "alice",
      "name": "Alice Chen",
      "role": "Security Analyst",
      "phone": "555-0123",
      "avatar": "assets/npc/avatars/npc_alice.png",
      "inkFile": "scenarios/compiled/biometric_breach_npcs.json",
      "initialKnot": "alice_hub",
      "eventMappings": {
        "room_entered:reception": "alice_room_reception",
        "item_picked_up:fingerprint_kit": "alice_item_fingerprint_kit"
      }
    }
  },
  "rooms": {
    ...
  }
}
```

### 5.3 Load NPCs in Game Init

**File:** `js/main.js`

```javascript
// In initializeGame(), after scenario loaded:
async function loadScenarioNPCs(scenario) {
  if (!scenario.npcs) return;

  for (const [npcId, npcConfig] of Object.entries(scenario.npcs)) {
    // Load Ink story
    await window.inkEngine.loadStory(npcId, npcConfig.inkFile);
    
    // Register NPC
    window.npcManager.registerNPC(npcId, npcConfig);
    
    // Trigger initial knot if specified
    if (npcConfig.initialKnot) {
      const result = window.inkEngine.goToKnot(npcId, npcConfig.initialKnot);
      console.log(`Initialized ${npcId} at ${npcConfig.initialKnot}`);
    }
  }
}

// Call after scenario loads:
if (window.gameScenario) {
  await loadScenarioNPCs(window.gameScenario);
}
```

---

## Phase 6: Testing & Polish (Days 8-10)

### 6.1 Test Event Flow
- Move between rooms
- Pick up items
- Complete minigames
- Verify barks appear
- Verify phone chat works

### 6.2 Add Phone Access Button

**Create button in:** `js/ui/phone-button.js`

```javascript
export function createPhoneAccessButton() {
  const button = document.createElement('div');
  button.className = 'phone-access-button';
  button.innerHTML = `
    <img src="assets/objects/phone.png" class="phone-access-button-icon">
  `;

  button.addEventListener('click', () => {
    window.MinigameFramework.startMinigame('phone-chat', null, {});
  });

  document.body.appendChild(button);
}
```

**Add CSS in:** `css/phone-chat.css`

```css
.phone-access-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 64px;
  height: 64px;
  background: #5fcf69;
  border: 2px solid #000;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.3);
  z-index: 9998;
}

.phone-access-button:hover {
  background: #4fb759;
  transform: translate(-2px, -2px);
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
}

.phone-access-button-icon {
  width: 40px;
  height: 40px;
  image-rendering: pixelated;
}
```

### 6.3 Add Sound Effects

```javascript
// In NPCBarkSystem.showBark():
const audio = new Audio('assets/npc/sounds/message_received.wav');
audio.volume = 0.5;
audio.play().catch(e => console.log('Audio play failed:', e));
```

### 6.4 Persistence

**Save NPC state:**

```javascript
// In game save function:
window.gameState.npcStates = {};
for (const [npcId, story] of window.inkEngine.stories) {
  window.gameState.npcStates[npcId] = window.inkEngine.saveState(npcId);
}

// In game load function:
for (const [npcId, stateJson] of Object.entries(window.gameState.npcStates)) {
  window.inkEngine.restoreState(npcId, stateJson);
}
```

---

## Testing Checklist

- [ ] Ink engine loads compiled JSON correctly
- [ ] Events emit when player moves/acts
- [ ] NPC manager maps events to knots
- [ ] Barks appear and dismiss correctly
- [ ] Barks stack properly (max 3)
- [ ] Click bark opens phone chat
- [ ] Phone chat shows contacts
- [ ] Click contact opens conversation
- [ ] Ink dialogue displays correctly
- [ ] Choices appear and work
- [ ] Choice selection updates conversation
- [ ] Multiple NPCs work independently
- [ ] Sound effects play on bark
- [ ] Phone access button works
- [ ] NPC state persists across sessions

---

## Next Steps After MVP

1. **Multiple NPCs** - Add more NPCs to test interactions
2. **Voice Synthesis** - Add TTS for NPC dialogue
3. **Relationship System** - Track trust/rapport with NPCs
4. **Time-Delayed Messages** - NPCs send messages after delays
5. **Group Chats** - Multiple NPCs in one conversation
6. **Emoji Support** - Add reaction system
7. **Phone Calls** - Audio dialogue feature
8. **Advanced Ink Features** - Tunnels, threads, etc.

---

## Troubleshooting

### Ink not loading
- Check console for errors
- Verify compiled JSON exists
- Check file paths are correct
- Ensure ink-js library loaded

### Events not firing
- Enable debug mode: `window.npcEvents.debug = true`
- Check cooldown settings
- Verify event emission points in code
- Check event pattern matching

### Barks not appearing
- Check `window.npcBarkSystem` initialized
- Verify CSS loaded
- Check z-index conflicts
- Verify NPC avatar paths

### Phone chat not working
- Check minigame registered
- Verify MinigameFramework available
- Check CSS classes match
- Verify Ink story executing

---

This implementation plan provides a complete roadmap from setup to MVP. Each phase builds on the previous, with testing points throughout.
