# RFID Keycard System - Technical Architecture

## File Structure

```
js/
├── systems/
│   ├── unlock-system.js                    [MODIFY] Add rfid lock type case
│   ├── interactions.js                     [MODIFY] Add keycard click handler & RFID icon
│   └── inventory.js                        [NO CHANGE] Inventory calls interactions
│
├── minigames/
│   ├── rfid/
│   │   ├── rfid-minigame.js               [NEW] Main RFID minigame controller
│   │   ├── rfid-ui.js                     [NEW] Flipper Zero UI rendering
│   │   ├── rfid-data.js                   [NEW] Card data management
│   │   └── rfid-animations.js             [NEW] Reading/tap animations
│   │
│   ├── helpers/
│   │   └── chat-helpers.js                [MODIFY] Add clone_keycard tag
│   │
│   └── index.js                           [MODIFY] Register rfid minigame
│
└── systems/
    └── minigame-starters.js               [MODIFY] Add startRFIDMinigame()

css/
└── rfid-minigame.css                      [NEW] Flipper Zero styling

assets/
├── objects/
│   ├── keycard.png                        [NEW] Generic keycard sprite
│   ├── keycard-ceo.png                    [NEW] CEO keycard variant
│   ├── keycard-security.png               [NEW] Security keycard variant
│   ├── rfid_cloner.png                    [NEW] RFID cloner device
│   └── flipper-zero.png                   [NEW] Flipper Zero icon
│
└── icons/
    ├── rfid-icon.png                      [NEW] RFID lock icon
    └── nfc-waves.png                      [NEW] NFC signal waves

scenarios/
└── example-rfid-scenario.json             [NEW] Example scenario with RFID locks

planning_notes/rfid_keycard/
├── 00_OVERVIEW.md                         [THIS DOC]
├── 01_TECHNICAL_ARCHITECTURE.md           [THIS DOC]
├── 02_IMPLEMENTATION_TODO.md              [NEXT]
├── 03_ASSETS_REQUIREMENTS.md              [NEXT]
└── 04_TESTING_PLAN.md                     [NEXT]
```

## Code Architecture

### 1. Unlock System Integration

**File**: `/js/systems/unlock-system.js`

Add new case in `handleUnlock()` function:

```javascript
case 'rfid':
    console.log('RFID LOCK REQUESTED');
    const requiredCardId = lockRequirements.requires;

    // Get all keycards from player's inventory
    const playerKeycards = window.inventory.items.filter(item =>
        item && item.scenarioData &&
        item.scenarioData.type === 'keycard'
    );

    // Check for RFID cloner
    const hasRFIDCloner = window.inventory.items.some(item =>
        item && item.scenarioData &&
        item.scenarioData.type === 'rfid_cloner'
    );

    if (playerKeycards.length > 0 || hasRFIDCloner) {
        // Start RFID minigame in unlock mode
        startRFIDMinigame(lockable, type, {
            mode: 'unlock',
            requiredCardId: requiredCardId,
            availableCards: playerKeycards,
            hasCloner: hasRFIDCloner,
            onComplete: (success) => {
                if (success) {
                    unlockTarget(lockable, type, lockable.layer);
                    window.gameAlert('Access Granted', 'success', 'RFID Unlock', 3000);
                } else {
                    window.gameAlert('Access Denied - Invalid Card', 'error', 'RFID Unlock', 3000);
                }
            }
        });
    } else {
        console.log('NO KEYCARD OR RFID CLONER');
        window.gameAlert('Requires RFID keycard', 'error', 'Locked', 4000);
    }
    break;
```

### 2. RFID Minigame Class

**File**: `/js/minigames/rfid/rfid-minigame.js`

```javascript
import { MinigameScene } from '../framework/base-minigame.js';
import { RFIDUIRenderer } from './rfid-ui.js';
import { RFIDDataManager } from './rfid-data.js';
import { RFIDAnimations } from './rfid-animations.js';

export class RFIDMinigame extends MinigameScene {
    constructor(container, params) {
        params = params || {};
        params.title = params.mode === 'clone' ? 'RFID Cloner' : 'RFID Reader';
        params.showCancel = true;
        params.cancelText = 'Back';

        super(container, params);

        // Minigame configuration
        this.mode = params.mode || 'unlock';  // 'unlock' or 'clone'
        this.requiredCardId = params.requiredCardId;
        this.availableCards = params.availableCards || [];
        this.hasCloner = params.hasCloner || false;
        this.cardToClone = params.cardToClone;  // For clone mode

        // Components
        this.ui = new RFIDUIRenderer(this);
        this.dataManager = new RFIDDataManager();
        this.animations = new RFIDAnimations(this);

        // State
        this.currentView = 'main';  // 'main', 'saved', 'emulate', 'read'
        this.selectedSavedCard = null;
        this.readingProgress = 0;
    }

    init() {
        super.init();
        console.log('RFID minigame initializing in mode:', this.mode);

        this.container.className += ' rfid-minigame-container';
        this.gameContainer.className += ' rfid-minigame-game-container';

        // Create the appropriate interface based on mode
        if (this.mode === 'unlock') {
            this.ui.createUnlockInterface();
        } else if (this.mode === 'clone') {
            this.ui.createCloneInterface();
        }
    }

    start() {
        super.start();
        console.log('RFID minigame started');

        if (this.mode === 'clone') {
            // Automatically start reading animation
            this.startCardReading();
        }
    }

    // Unlock mode methods
    handleCardTap(card) {
        console.log('Card tapped:', card);

        if (card.key_id === this.requiredCardId) {
            this.animations.showTapSuccess();
            setTimeout(() => {
                this.complete(true);
            }, 1000);
        } else {
            this.animations.showTapFailure();
            setTimeout(() => {
                this.complete(false);
            }, 1000);
        }
    }

    handleEmulate(savedCard) {
        console.log('Emulating card:', savedCard);

        // Show Flipper Zero emulation screen
        this.ui.showEmulationScreen(savedCard);

        // Check if emulated card matches required
        if (savedCard.key_id === this.requiredCardId) {
            this.animations.showEmulationSuccess();
            setTimeout(() => {
                this.complete(true);
            }, 2000);
        } else {
            this.animations.showEmulationFailure();
            setTimeout(() => {
                this.complete(false);
            }, 2000);
        }
    }

    // Clone mode methods
    startCardReading() {
        console.log('Starting card reading...');
        this.currentView = 'read';
        this.readingProgress = 0;

        // Show reading screen
        this.ui.showReadingScreen();

        // Simulate reading progress
        this.animations.animateReading((progress) => {
            this.readingProgress = progress;
            this.ui.updateReadingProgress(progress);

            if (progress >= 100) {
                // Reading complete - show card data
                this.showCardData();
            }
        });
    }

    showCardData() {
        console.log('Showing card data');

        // Generate or use provided card data
        const cardData = this.cardToClone || this.dataManager.generateRandomCard();

        // Show card data screen with Flipper Zero formatting
        this.ui.showCardDataScreen(cardData);
    }

    handleSaveCard(cardData) {
        console.log('Saving card:', cardData);

        // Save to RFID cloner inventory item
        this.dataManager.saveCardToCloner(cardData);

        // Show success message
        window.gameAlert('Card saved successfully', 'success', 'RFID Cloner', 2000);

        // Complete minigame
        setTimeout(() => {
            this.complete(true, { cardData });
        }, 1000);
    }

    complete(success, result) {
        super.complete(success, result);
    }

    cleanup() {
        this.animations.cleanup();
        super.cleanup();
    }
}

// Starter function
export function startRFIDMinigame(lockable, type, params) {
    console.log('Starting RFID minigame with params:', params);

    // Register minigame if not already done
    if (window.MinigameFramework && !window.MinigameFramework.registeredScenes['rfid']) {
        window.MinigameFramework.registerScene('rfid', RFIDMinigame);
    }

    // Start the minigame
    window.MinigameFramework.startMinigame('rfid', null, params);
}

// Return to conversation function
export function returnToConversationAfterRFID(conversationContext) {
    if (!window.MinigameFramework) return;

    // Re-open conversation minigame
    window.MinigameFramework.startMinigame('person-chat', null, {
        npcId: conversationContext.npcId,
        resumeState: conversationContext.conversationState
    });
}
```

### 2a. Complete Registration and Export Pattern

**File**: `/js/minigames/index.js`

The RFID minigame must follow the complete pattern used by other minigames:

```javascript
// 1. IMPORT the minigame and starter at the top
import { RFIDMinigame, startRFIDMinigame, returnToConversationAfterRFID } from './rfid/rfid-minigame.js';

// 2. EXPORT for module consumers
export { RFIDMinigame, startRFIDMinigame, returnToConversationAfterRFID };

// Later in the file after other registrations...

// 3. REGISTER the minigame scene
MinigameFramework.registerScene('rfid', RFIDMinigame);

// 4. MAKE GLOBALLY AVAILABLE on window
window.startRFIDMinigame = startRFIDMinigame;
window.returnToConversationAfterRFID = returnToConversationAfterRFID;
```

This four-step pattern ensures the minigame works in all contexts:
- Module imports (ES6)
- Window global access (legacy code)
- Framework registration (minigame system)
- Function availability (starter functions)

### 2b. Event Dispatcher Integration

**Integration Points**: All minigame methods that perform significant actions

```javascript
// In RFIDMinigame.handleSaveCard()
handleSaveCard(cardData) {
    console.log('Saving card:', cardData);

    // Save to RFID cloner inventory item
    this.dataManager.saveCardToCloner(cardData);

    // Emit event for card cloning
    if (window.eventDispatcher) {
        window.eventDispatcher.emit('card_cloned', {
            cardName: cardData.name,
            cardHex: cardData.rfid_hex,
            npcId: window.currentConversationNPCId, // If cloned from NPC
            timestamp: Date.now()
        });
    }

    window.gameAlert('Card saved successfully', 'success', 'RFID Cloner', 2000);

    setTimeout(() => {
        this.complete(true, { cardData });
    }, 1000);
}

// In RFIDMinigame.handleEmulate()
handleEmulate(savedCard) {
    console.log('Emulating card:', savedCard);

    // Show emulation screen
    this.ui.showEmulationScreen(savedCard);

    // Emit event for card emulation
    if (window.eventDispatcher) {
        window.eventDispatcher.emit('card_emulated', {
            cardName: savedCard.name,
            cardHex: savedCard.hex,
            success: savedCard.key_id === this.requiredCardId,
            timestamp: Date.now()
        });
    }

    // Check if emulated card matches required
    if (savedCard.key_id === this.requiredCardId) {
        this.animations.showEmulationSuccess();
        setTimeout(() => {
            this.complete(true);
        }, 2000);
    } else {
        this.animations.showEmulationFailure();
        setTimeout(() => {
            this.complete(false);
        }, 2000);
    }
}

// In RFIDMinigame.init() for unlock mode
if (this.mode === 'unlock') {
    // Emit event for RFID lock access
    if (window.eventDispatcher) {
        window.eventDispatcher.emit('rfid_lock_accessed', {
            lockId: this.params.lockable?.objectId,
            requiredCardId: this.requiredCardId,
            hasCloner: this.hasCloner,
            availableCardsCount: this.availableCards.length,
            timestamp: Date.now()
        });
    }
    this.ui.createUnlockInterface();
}
```

**Event Summary**:
- `card_cloned`: When player saves a card to cloner
- `card_emulated`: When player attempts to emulate a card
- `rfid_lock_accessed`: When player opens RFID minigame on a lock

These events allow:
- NPCs to react to card cloning
- Game telemetry and analytics
- Achievement/quest tracking
- Security detection systems (if implemented)

### 2c. Return to Conversation Pattern

**IMPORTANT**: Uses proven `window.pendingConversationReturn` pattern from container minigame.
**Reference**: `/js/minigames/container/container-minigame.js:720-754` and `/js/systems/npc-game-bridge.js:237-242`

**File**: `/js/minigames/helpers/chat-helpers.js` (Updated clone_keycard case)

```javascript
case 'clone_keycard':
    if (param) {
        const [cardName, cardHex] = param.split('|').map(s => s.trim());

        // Check if player has RFID cloner
        const hasCloner = window.inventory.items.some(item =>
            item && item.scenarioData &&
            item.scenarioData.type === 'rfid_cloner'
        );

        if (!hasCloner) {
            result.message = '⚠️ You need an RFID cloner to clone cards';
            if (ui) ui.showNotification(result.message, 'warning');
            break;
        }

        // Generate card data
        const cardData = {
            name: cardName,
            rfid_hex: cardHex,
            rfid_facility: parseInt(cardHex.substring(0, 2), 16),
            rfid_card_number: parseInt(cardHex.substring(2, 6), 16),
            rfid_protocol: 'EM4100',
            key_id: `cloned_${cardName.toLowerCase().replace(/\s+/g, '_')}`
        };

        // Set pending conversation return (MINIMAL CONTEXT!)
        // Conversation state automatically managed by npcConversationStateManager
        window.pendingConversationReturn = {
            npcId: window.currentConversationNPCId,
            type: window.currentConversationMinigameType || 'person-chat'
        };

        // Start RFID minigame in clone mode
        if (window.startRFIDMinigame) {
            window.startRFIDMinigame(null, null, {
                mode: 'clone',
                cardToClone: cardData
            });
        }

        result.success = true;
        result.message = `📡 Starting card clone: ${cardName}`;
    }
    break;
```

**Return Function**: `/js/minigames/rfid/rfid-minigame.js`

```javascript
/**
 * Return to conversation after RFID minigame
 * Follows exact pattern from container minigame
 */
export function returnToConversationAfterRFID() {
    console.log('Returning to conversation after RFID minigame');

    // Check if there's a pending conversation return
    if (window.pendingConversationReturn) {
        const conversationState = window.pendingConversationReturn;

        // Clear the pending return state
        window.pendingConversationReturn = null;

        console.log('Restoring conversation:', conversationState);

        // Restart the appropriate conversation minigame
        if (window.MinigameFramework) {
            // Small delay to ensure RFID minigame is fully closed
            setTimeout(() => {
                if (conversationState.type === 'person-chat') {
                    // Restart person-chat minigame
                    window.MinigameFramework.startMinigame('person-chat', null, {
                        npcId: conversationState.npcId,
                        fromTag: true  // Flag to indicate resuming from tag action
                    });
                } else if (conversationState.type === 'phone-chat') {
                    // Restart phone-chat minigame
                    window.MinigameFramework.startMinigame('phone-chat', null, {
                        npcId: conversationState.npcId,
                        fromTag: true
                    });
                }
            }, 50);
        }
    } else {
        console.log('No pending conversation return found');
    }
}
```

**Called from RFIDMinigame.complete()**:

```javascript
complete(success) {
    // Check if we need to return to conversation
    if (window.pendingConversationReturn && window.returnToConversationAfterRFID) {
        console.log('Returning to conversation after RFID minigame');
        setTimeout(() => {
            window.returnToConversationAfterRFID();
        }, 100);
    }

    // Call parent complete
    super.complete(success, this.gameResult);
}
```

**Why This Pattern**:
- **Automatic State Management**: `npcConversationStateManager` saves/restores Ink story state automatically
- **Proven**: Already working in container → conversation flow
- **Simpler**: No manual Ink state manipulation needed
- **Reliable**: Restarting conversation automatically restores state via `restoreNPCState()`

### 3. RFID UI Renderer

**File**: `/js/minigames/rfid/rfid-ui.js`

```javascript
export class RFIDUIRenderer {
    constructor(minigame) {
        this.minigame = minigame;
        this.container = minigame.gameContainer;
    }

    createUnlockInterface() {
        const ui = document.createElement('div');
        ui.className = 'rfid-unlock-interface';

        // Create Flipper Zero device frame
        const flipperFrame = this.createFlipperFrame();
        ui.appendChild(flipperFrame);

        // Create screen content area
        const screen = document.createElement('div');
        screen.className = 'flipper-screen';
        screen.id = 'flipper-screen';

        // Show main menu
        this.showMainMenu(screen);

        flipperFrame.appendChild(screen);
        this.container.appendChild(ui);
    }

    createFlipperFrame() {
        const frame = document.createElement('div');
        frame.className = 'flipper-zero-frame';

        // Add device styling (orange border, black screen, etc.)
        frame.innerHTML = `
            <div class="flipper-header">
                <div class="flipper-logo">Flipper Zero</div>
                <div class="flipper-battery">100%</div>
            </div>
        `;

        return frame;
    }

    showMainMenu(screen) {
        screen.innerHTML = `
            <div class="flipper-menu">
                <div class="flipper-breadcrumb">RFID</div>
                <div class="flipper-menu-items">
                    ${this.minigame.availableCards.length > 0 ?
                        '<div class="flipper-menu-item" data-action="tap">▶ Read</div>' : ''}
                    ${this.minigame.hasCloner ?
                        '<div class="flipper-menu-item" data-action="saved">▶ Saved</div>' : ''}
                </div>
            </div>
        `;

        // Add event listeners
        screen.querySelectorAll('.flipper-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.target.dataset.action;
                if (action === 'tap') {
                    this.showTapInterface();
                } else if (action === 'saved') {
                    this.showSavedCards();
                }
            });
        });
    }

    showTapInterface() {
        const screen = document.getElementById('flipper-screen');

        screen.innerHTML = `
            <div class="flipper-read-screen">
                <div class="flipper-breadcrumb">RFID > Read</div>
                <div class="flipper-content">
                    <div class="rfid-tap-area">
                        <div class="rfid-waves"></div>
                        <div class="rfid-instruction">Place card on reader...</div>
                    </div>
                    <div class="rfid-card-list">
                        ${this.minigame.availableCards.map(card => `
                            <div class="rfid-card-item" data-card-id="${card.scenarioData.key_id}">
                                ▶ ${card.scenarioData.name}
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;

        // Add click handlers for cards
        screen.querySelectorAll('.rfid-card-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const cardId = e.target.dataset.cardId;
                const card = this.minigame.availableCards.find(
                    c => c.scenarioData.key_id === cardId
                );
                if (card) {
                    this.minigame.handleCardTap(card.scenarioData);
                }
            });
        });
    }

    showSavedCards() {
        const screen = document.getElementById('flipper-screen');
        const savedCards = this.getSavedCardsFromCloner();

        screen.innerHTML = `
            <div class="flipper-saved-screen">
                <div class="flipper-breadcrumb">RFID > Saved</div>
                <div class="flipper-content">
                    ${savedCards.length === 0 ?
                        '<div class="flipper-empty">No saved cards</div>' :
                        savedCards.map((card, idx) => `
                            <div class="flipper-menu-item" data-card-index="${idx}">
                                ▶ ${card.name}
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `;

        // Add click handlers
        screen.querySelectorAll('.flipper-menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const cardIndex = parseInt(e.target.dataset.cardIndex);
                const card = savedCards[cardIndex];
                if (card) {
                    this.showEmulationScreen(card);
                }
            });
        });
    }

    showEmulationScreen(card) {
        const screen = document.getElementById('flipper-screen');

        screen.innerHTML = `
            <div class="flipper-emulate-screen">
                <div class="flipper-breadcrumb">RFID > Saved > Emulate</div>
                <div class="flipper-content">
                    <div class="emulation-status">
                        <div class="emulation-icon">📡</div>
                        <div class="emulation-text">Emulating</div>
                        <div class="emulation-protocol">[${card.protocol || 'EM4100'}]</div>
                        <div class="emulation-name">${card.name}</div>
                    </div>
                    <div class="emulation-data">
                        <div>Hex: ${this.formatHex(card.hex)}</div>
                        <div>FC: ${card.facility || 'N/A'}</div>
                        <div>Card: ${card.card_number || 'N/A'}</div>
                    </div>
                    <div class="emulation-waves"></div>
                </div>
            </div>
        `;

        // Trigger emulation check
        this.minigame.handleEmulate(card);
    }

    // Clone mode UI
    createCloneInterface() {
        const ui = document.createElement('div');
        ui.className = 'rfid-clone-interface';

        const flipperFrame = this.createFlipperFrame();

        const screen = document.createElement('div');
        screen.className = 'flipper-screen';
        screen.id = 'flipper-screen';

        flipperFrame.appendChild(screen);
        ui.appendChild(flipperFrame);
        this.container.appendChild(ui);
    }

    showReadingScreen() {
        const screen = document.getElementById('flipper-screen');

        screen.innerHTML = `
            <div class="flipper-read-progress">
                <div class="flipper-breadcrumb">RFID > Read</div>
                <div class="flipper-content">
                    <div class="reading-status">Reading 1/2</div>
                    <div class="reading-modulation">> ASK PSK</div>
                    <div class="reading-instruction">Don't move card...</div>
                    <div class="reading-progress-bar">
                        <div class="reading-progress-fill" id="reading-progress-fill"></div>
                    </div>
                </div>
            </div>
        `;
    }

    updateReadingProgress(progress) {
        const fill = document.getElementById('reading-progress-fill');
        if (fill) {
            fill.style.width = progress + '%';
        }
    }

    showCardDataScreen(cardData) {
        const screen = document.getElementById('flipper-screen');

        screen.innerHTML = `
            <div class="flipper-card-data">
                <div class="flipper-breadcrumb">RFID > Read</div>
                <div class="flipper-content">
                    <div class="card-protocol">EM-Micro EM4100</div>
                    <div class="card-hex">Hex: ${this.formatHex(cardData.rfid_hex)}</div>
                    <div class="card-details">
                        <div>FC: ${cardData.rfid_facility} Card: ${cardData.rfid_card_number}</div>
                        <div>CL: ${this.calculateChecksum(cardData.rfid_hex)}</div>
                    </div>
                    <div class="card-dez">DEZ 8: ${this.toDEZ8(cardData.rfid_hex)}</div>
                    <div class="card-actions">
                        <button class="flipper-btn" id="save-card-btn">Save</button>
                        <button class="flipper-btn" id="cancel-card-btn">Cancel</button>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        document.getElementById('save-card-btn').addEventListener('click', () => {
            this.minigame.handleSaveCard(cardData);
        });

        document.getElementById('cancel-card-btn').addEventListener('click', () => {
            this.minigame.complete(false);
        });
    }

    // Helper methods
    formatHex(hex) {
        // Format as: 4A C5 EF 44 DC
        return hex.match(/.{1,2}/g).join(' ').toUpperCase();
    }

    calculateChecksum(hex) {
        // EM4100 checksum: XOR of all bytes
        const bytes = hex.match(/.{1,2}/g).map(b => parseInt(b, 16));
        let checksum = 0;
        bytes.forEach(byte => {
            checksum ^= byte; // XOR all bytes
        });
        return checksum & 0xFF; // Keep only last byte
    }

    toDEZ8(hex) {
        // EM4100 DEZ 8: Last 3 bytes (6 hex chars) to decimal
        const lastThreeBytes = hex.slice(-6);
        const decimal = parseInt(lastThreeBytes, 16);
        return decimal.toString().padStart(8, '0');
    }

    getSavedCardsFromCloner() {
        // Get RFID cloner from inventory
        const cloner = window.inventory.items.find(item =>
            item && item.scenarioData &&
            item.scenarioData.type === 'rfid_cloner'
        );

        return cloner?.scenarioData?.saved_cards || [];
    }
}
```

### 4. RFID Data Manager

**File**: `/js/minigames/rfid/rfid-data.js`

```javascript
export class RFIDDataManager {
    constructor() {
        this.protocols = ['EM4100', 'HID Prox', 'Indala'];
        this.MAX_SAVED_CARDS = 50;
    }

    // Hex ID Validation
    validateHex(hex) {
        if (!hex || typeof hex !== 'string') {
            return { valid: false, error: 'Hex ID must be a string' };
        }
        if (hex.length !== 10) {
            return { valid: false, error: 'Hex ID must be exactly 10 characters' };
        }
        if (!/^[0-9A-Fa-f]{10}$/.test(hex)) {
            return { valid: false, error: 'Hex ID must contain only hex characters (0-9, A-F)' };
        }
        return { valid: true };
    }

    generateRandomCard() {
        const hex = this.generateRandomHex();
        const { facility, cardNumber } = this.hexToFacilityCard(hex);

        // Generate more interesting names
        const names = [
            'Security Badge',
            'Access Card',
            'Employee ID',
            'Guest Pass',
            'Visitor Badge',
            'Contractor Card'
        ];
        const name = names[Math.floor(Math.random() * names.length)];

        return {
            name: name,
            rfid_hex: hex,
            rfid_facility: facility,
            rfid_card_number: cardNumber,
            rfid_protocol: 'EM4100',
            key_id: 'cloned_' + hex.toLowerCase()
        };
    }

    generateRandomHex() {
        let hex = '';
        for (let i = 0; i < 10; i++) {
            hex += Math.floor(Math.random() * 16).toString(16).toUpperCase();
        }
        return hex;
    }

    saveCardToCloner(cardData) {
        // Validate hex ID
        const validation = this.validateHex(cardData.rfid_hex);
        if (!validation.valid) {
            console.error('Invalid hex ID:', validation.error);
            window.gameAlert(validation.error, 'error');
            return false;
        }

        // Find RFID cloner in inventory
        const cloner = window.inventory.items.find(item =>
            item && item.scenarioData &&
            item.scenarioData.type === 'rfid_cloner'
        );

        if (!cloner) {
            console.error('RFID cloner not found in inventory');
            return false;
        }

        // Initialize saved_cards array if it doesn't exist
        if (!cloner.scenarioData.saved_cards) {
            cloner.scenarioData.saved_cards = [];
        }

        // Check storage limit
        if (cloner.scenarioData.saved_cards.length >= this.MAX_SAVED_CARDS) {
            console.warn('Cloner storage full');
            window.gameAlert(`Cloner storage full (${this.MAX_SAVED_CARDS} cards max)`, 'error');
            return false;
        }

        // Check if card already saved (by hex ID)
        const existingIndex = cloner.scenarioData.saved_cards.findIndex(
            card => card.hex === cardData.rfid_hex
        );

        if (existingIndex !== -1) {
            // Update existing card (overwrite strategy)
            console.log('Card already exists, updating...');
            cloner.scenarioData.saved_cards[existingIndex] = {
                name: cardData.name,
                hex: cardData.rfid_hex,
                facility: cardData.rfid_facility,
                card_number: cardData.rfid_card_number,
                protocol: cardData.rfid_protocol || 'EM4100',
                key_id: cardData.key_id,
                cloned_at: new Date().toISOString(),
                updated: true
            };
            console.log('Card updated in cloner:', cardData);
            return 'updated';
        }

        // Save new card
        cloner.scenarioData.saved_cards.push({
            name: cardData.name,
            hex: cardData.rfid_hex,
            facility: cardData.rfid_facility,
            card_number: cardData.rfid_card_number,
            protocol: cardData.rfid_protocol || 'EM4100',
            key_id: cardData.key_id,
            cloned_at: new Date().toISOString()
        });

        console.log('Card saved to cloner:', cardData);
        return true;
    }

    hexToFacilityCard(hex) {
        // EM4100 format: 10 hex chars = 40 bits
        // Facility code: First byte (2 hex chars)
        // Card number: Next 2 bytes (4 hex chars)
        const facility = parseInt(hex.substring(0, 2), 16);
        const cardNumber = parseInt(hex.substring(2, 6), 16);

        return { facility, cardNumber };
    }

    facilityCardToHex(facility, cardNumber) {
        // Reverse: Facility (1 byte) + Card Number (2 bytes) + padding
        const facilityHex = facility.toString(16).toUpperCase().padStart(2, '0');
        const cardHex = cardNumber.toString(16).toUpperCase().padStart(4, '0');
        // Add 4 more random hex chars for full 10-char ID
        const padding = Math.floor(Math.random() * 0x10000).toString(16).toUpperCase().padStart(4, '0');
        return facilityHex + cardHex + padding;
    }
}
```

### 5. RFID Animations

**File**: `/js/minigames/rfid/rfid-animations.js`

```javascript
export class RFIDAnimations {
    constructor(minigame) {
        this.minigame = minigame;
        this.activeAnimations = [];
    }

    animateReading(progressCallback) {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 2;
            progressCallback(progress);

            if (progress >= 100) {
                clearInterval(interval);
            }
        }, 50);  // 50ms intervals = 2.5 second total

        this.activeAnimations.push(interval);
    }

    showTapSuccess() {
        const screen = document.getElementById('flipper-screen');
        screen.innerHTML = `
            <div class="flipper-result success">
                <div class="result-icon">✓</div>
                <div class="result-text">Access Granted</div>
                <div class="result-detail">Card Accepted</div>
            </div>
        `;
    }

    showTapFailure() {
        const screen = document.getElementById('flipper-screen');
        screen.innerHTML = `
            <div class="flipper-result failure">
                <div class="result-icon">✗</div>
                <div class="result-text">Access Denied</div>
                <div class="result-detail">Invalid Card</div>
            </div>
        `;
    }

    showEmulationSuccess() {
        // Add success visual feedback to existing emulation screen
        const statusDiv = document.querySelector('.emulation-status');
        if (statusDiv) {
            statusDiv.classList.add('success');
        }
    }

    showEmulationFailure() {
        const statusDiv = document.querySelector('.emulation-status');
        if (statusDiv) {
            statusDiv.classList.add('failure');
        }
    }

    cleanup() {
        this.activeAnimations.forEach(anim => clearInterval(anim));
        this.activeAnimations = [];
    }
}
```

### 6. Ink Tag Handler

**File**: `/js/minigames/helpers/chat-helpers.js` (Add new case)

```javascript
case 'clone_keycard':
    if (param) {
        const [cardName, cardHex] = param.split('|').map(s => s.trim());

        // Check if player has RFID cloner
        const hasCloner = window.inventory.items.some(item =>
            item && item.scenarioData &&
            item.scenarioData.type === 'rfid_cloner'
        );

        if (!hasCloner) {
            result.message = '⚠️ You need an RFID cloner to clone cards';
            if (ui) ui.showNotification(result.message, 'warning');
            break;
        }

        // Generate card data
        const cardData = {
            name: cardName,
            rfid_hex: cardHex,
            rfid_facility: parseInt(cardHex.substring(0, 2), 16),
            rfid_card_number: parseInt(cardHex.substring(2, 6), 16),
            rfid_protocol: 'EM4100',
            key_id: `cloned_${cardName.toLowerCase().replace(/\s+/g, '_')}`
        };

        // Start RFID minigame in clone mode
        if (window.startRFIDMinigame) {
            window.startRFIDMinigame(null, null, {
                mode: 'clone',
                cardToClone: cardData,
                onComplete: (success, cloneResult) => {
                    if (success) {
                        result.success = true;
                        result.message = `📡 Cloned: ${cardName}`;
                        if (ui) ui.showNotification(result.message, 'success');
                    }
                }
            });
        }

        result.success = true;
        result.message = `📡 Starting card clone: ${cardName}`;
        if (ui) ui.showNotification(result.message, 'info');
    }
    break;
```

### 7. Keycard Click Handler

**File**: `/js/systems/interactions.js` (Modify `handleObjectInteraction`)

**Note**: Inventory items call `window.handleObjectInteraction()` which is defined in `interactions.js`.

Add early in the `handleObjectInteraction(sprite)` function, before existing type checks:

```javascript
// Special handling for keycard + RFID cloner combo
if (sprite.scenarioData?.type === 'keycard') {
    const hasCloner = window.inventory.items.some(item =>
        item && item.scenarioData &&
        item.scenarioData.type === 'rfid_cloner'
    );

    if (hasCloner) {
        // Start RFID minigame in clone mode
        if (window.startRFIDMinigame) {
            window.startRFIDMinigame(null, null, {
                mode: 'clone',
                cardToClone: sprite.scenarioData,
                onComplete: (success) => {
                    if (success) {
                        window.gameAlert('Keycard cloned successfully', 'success');
                    }
                }
            });
            return;  // Don't proceed with normal handling
        }
    } else {
        window.gameAlert('You need an RFID cloner to clone this card', 'info');
        return;
    }
}
```

### 8. Interaction Indicator System

**File**: `/js/systems/interactions.js` (Modify `getInteractionSpriteKey`)

Add RFID lock icon support to the `getInteractionSpriteKey()` function around line 350:

```javascript
function getInteractionSpriteKey(obj) {
    // ... existing code for NPCs and doors ...

    // Check for locked containers and items
    if (data.locked === true) {
        // Check specific lock type
        const lockType = data.lockType;
        if (lockType === 'password') return 'password';
        if (lockType === 'pin') return 'pin';
        if (lockType === 'biometric') return 'fingerprint';
        if (lockType === 'rfid') return 'rfid-icon';  // ← ADD THIS LINE
        // Default to keyway for key locks or unknown types
        return 'keyway';
    }

    // ... rest of function ...
}
```

**Also add for doors** (around line 336):

```javascript
if (obj.doorProperties) {
    if (obj.doorProperties.locked) {
        const lockType = obj.doorProperties.lockType;
        if (lockType === 'password') return 'password';
        if (lockType === 'pin') return 'pin';
        if (lockType === 'rfid') return 'rfid-icon';  // ← ADD THIS LINE
        return 'keyway';
    }
    return null;
}
```

## Data Flow Diagrams

### Unlock Mode Flow

```
Player clicks RFID-locked door
    ↓
handleUnlock() detects lockType: 'rfid'
    ↓
Check inventory for:
  - keycards (matching key_id)
  - rfid_cloner (with saved_cards)
    ↓
Start RFIDMinigame(mode: 'unlock')
    ↓
┌─────────────────────────────────────┐
│  Show Flipper Zero interface       │
│  ┌──────────────────────────────┐  │
│  │ RFID                         │  │
│  │ ▶ Read    (if has cards)     │  │
│  │ ▶ Saved   (if has cloner)    │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
    ↓
Player chooses action:
    ├─ Read → Show available keycards
    │         Player taps card
    │         Check if key_id matches
    │         ✓ Success: Door unlocks
    │         ✗ Failure: Access Denied
    │
    └─ Saved → Show saved cards list
              Player selects card to emulate
              Show "Emulating [EM4100] CardName"
              Check if key_id matches
              ✓ Success: Door unlocks
              ✗ Failure: Access Denied
```

### Clone Mode Flow (from Ink)

```
Ink dialogue option:
  [Secretly clone keycard]
    ↓
Ink tag: # clone_keycard:Security Officer|4AC5EF44DC
    ↓
processGameActionTags() in chat-helpers.js
    ↓
Check for rfid_cloner in inventory
    ↓
Start RFIDMinigame(mode: 'clone', cardToClone: data)
    ↓
┌────────────────────────────────────┐
│  Flipper Zero Reading Screen      │
│  ┌────────────────────────────┐   │
│  │ RFID > Read                │   │
│  │ Reading 1/2                │   │
│  │ > ASK PSK                  │   │
│  │ Don't move card...         │   │
│  │ [=========>      ] 75%     │   │
│  └────────────────────────────┘   │
└────────────────────────────────────┘
    ↓
Reading completes (2.5 seconds)
    ↓
┌────────────────────────────────────┐
│  Card Data Screen                  │
│  ┌────────────────────────────┐   │
│  │ EM-Micro EM4100            │   │
│  │ Hex: 4A C5 EF 44 DC        │   │
│  │ FC: 239 Card: 17628        │   │
│  │ CL: 64                     │   │
│  │ DEZ 8: 15680732            │   │
│  │                            │   │
│  │ [Save]     [Cancel]        │   │
│  └────────────────────────────┘   │
└────────────────────────────────────┘
    ↓
Player clicks Save
    ↓
Save to rfid_cloner.saved_cards[]
    ↓
Show success message
    ↓
Complete minigame
```

### Clone Mode Flow (from Inventory)

```
Player has keycard in inventory
Player has rfid_cloner in inventory
    ↓
Player clicks keycard in inventory
    ↓
inventory.js calls window.handleObjectInteraction()
    ↓
interactions.js detects:
  - item.type === 'keycard'
  - inventory has 'rfid_cloner'
    ↓
Start RFIDMinigame(mode: 'clone', cardToClone: keycard.scenarioData)
    ↓
[Same flow as Clone Mode from Ink]
```

## CSS Styling Strategy

### Flipper Zero Aesthetic

```css
/* Main container */
.flipper-zero-frame {
    width: 400px;
    height: 500px;
    background: #FF8200;  /* Flipper orange */
    border-radius: 20px;
    padding: 20px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
}

/* Screen area */
.flipper-screen {
    width: 100%;
    height: 380px;
    background: #000;
    border: 2px solid #333;
    border-radius: 8px;
    padding: 10px;
    font-family: 'Courier New', monospace;
    color: #FF8200;
    font-size: 14px;
    overflow-y: auto;
}

/* Breadcrumb navigation */
.flipper-breadcrumb {
    color: #666;
    font-size: 12px;
    margin-bottom: 10px;
    border-bottom: 1px solid #333;
    padding-bottom: 5px;
}

/* Menu items */
.flipper-menu-item {
    padding: 8px;
    margin: 4px 0;
    cursor: pointer;
    transition: background 0.2s;
}

.flipper-menu-item:hover {
    background: #1a1a1a;
}

/* Emulation status */
.emulation-status {
    text-align: center;
    padding: 20px;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; }
}

/* Success/failure states */
.flipper-result.success {
    color: #00FF00;
}

.flipper-result.failure {
    color: #FF0000;
}
```

## Integration Points Summary

| System | File | Modification Type | Description |
|--------|------|-------------------|-------------|
| Unlock System | `unlock-system.js` | Add case | Add 'rfid' lock type handler |
| Interactions | `interactions.js` | Add handler + icon | Keycard click + RFID lock icon |
| Minigame Registry | `index.js` | Import + Register + Export | Full registration pattern |
| Chat Tags | `chat-helpers.js` | Add case | Handle `clone_keycard` tag with return |
| Styles | `rfid-minigame.css` | New file | Flipper Zero styling |
| Assets | `assets/objects/` | New files | Keycard and cloner sprites |
| Assets | `assets/icons/` | New files | RFID lock icon and waves |
| HTML | `index.html` | Add link | CSS stylesheet link |
| Phaser | Asset loading | Add images | Load all RFID sprites/icons |

## State Management

### Global State Extensions

```javascript
// RFID cloner item in inventory
window.inventory.items[] contains:
{
    scenarioData: {
        type: 'rfid_cloner',
        name: 'RFID Cloner',
        saved_cards: [
            {
                name: 'Security Officer',
                hex: '4AC5EF44DC',
                facility: 239,
                card_number: 17628,
                protocol: 'EM4100',
                key_id: 'cloned_security_officer',
                cloned_at: '2024-01-15T10:30:00Z'
            }
        ]
    }
}
```

## Error Handling

### Scenarios and Error Messages

| Scenario | Error Handling | User Message |
|----------|----------------|--------------|
| No keycard or cloner | Block unlock attempt | "Requires RFID keycard" |
| Wrong keycard | Show failure animation | "Access Denied - Invalid Card" |
| No cloner for clone | Prevent clone initiation | "You need an RFID cloner to clone cards" |
| Duplicate card save | Skip save, notify | "Card already saved" |
| Minigame not registered | Auto-register on demand | (Silent recovery) |

## Performance Considerations

- **Animations**: Use CSS transforms, not layout changes
- **Card List**: Limit to 50 saved cards maximum
- **Reading Animation**: 2.5 second duration (not blocking)
- **Memory**: Clean up intervals/timeouts in cleanup()
- **DOM**: Reuse screen container, replace innerHTML

## Accessibility

- **Keyboard Navigation**: Arrow keys in menus, Enter to select
- **Screen Reader**: ARIA labels on buttons
- **High Contrast**: Ensure orange/black contrast ratio
- **Font Size**: Minimum 14px, scalable

## Security (In-Game)

- **Card Validation**: Server-side key_id matching
- **Clone Limit**: Optional max saved cards per cloner
- **Audit Log**: Track card clones with timestamps
- **Detection**: Optional NPC detection of cloning attempts
