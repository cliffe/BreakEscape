# RFID Protocols - Implementation Plan

## File Changes Overview

```
js/
├── minigames/
│   ├── rfid/
│   │   ├── rfid-protocols.js          [NEW] Protocol definitions & capabilities
│   │   ├── rfid-minigame.js           [MODIFY] Add protocol-specific flows
│   │   ├── rfid-data.js               [MODIFY] Protocol detection & data handling
│   │   ├── rfid-ui.js                 [MODIFY] Protocol-specific UI screens
│   │   ├── rfid-attacks.js            [NEW] MIFARE key attack system
│   │   └── rfid-animations.js         [MODIFY] Add attack progress animations
│   │
│   ├── helpers/
│   │   └── chat-helpers.js            [MODIFY] Add MIFARE attack tags
│   │
│   └── person-chat/
│       └── person-chat-conversation.js [MODIFY] Sync card protocols to Ink
│
├── systems/
│   └── game-state.js                  [MODIFY] Track background attacks
│
└── core/
    └── game.js                        [MODIFY] Load protocol assets

scenarios/
├── test-rfid-em4100.json              [EXISTS] Current test
├── test-rfid-hid-prox.json            [NEW] HID Prox test
├── test-rfid-mifare.json              [NEW] MIFARE Classic test
└── test-rfid-desfire.json             [NEW] MIFARE DESFire test

assets/
└── icons/
    ├── protocol-low.png               [NEW] Low security indicator
    ├── protocol-medium.png            [NEW] Medium security indicator
    └── protocol-high.png              [NEW] High security indicator
```

## Phase 1: Protocol Data Model (Foundation)

**Estimated Time: 3 hours**

### Task 1.1: Create Protocol Definitions Module (1h)

**File**: `js/minigames/rfid/rfid-protocols.js` (NEW)

```javascript
/**
 * RFID Protocol Definitions
 *
 * Real-world RFID protocols with their security characteristics
 * and Flipper Zero capabilities
 */

export const RFID_PROTOCOLS = {
  'EM4100': {
    name: 'EM-Micro EM4100',
    frequency: '125kHz',
    security: 'low',
    readOnly: true,
    capabilities: {
      read: true,
      clone: true,
      write: false,
      emulate: true,
      bruteforce: false
    },
    description: 'Legacy low-frequency card. Read-only, easily cloned.',
    vulnerabilities: ['Clone attack', 'Replay attack'],
    hexLength: 10,
    color: '#FF6B6B'
  },

  'HID_Prox': {
    name: 'HID Prox II',
    frequency: '125kHz',
    security: 'medium-low',
    readOnly: true,
    capabilities: {
      read: true,
      clone: true,
      write: false,
      emulate: true,
      bruteforce: false
    },
    description: 'Common corporate badge. Read-only, proprietary format.',
    vulnerabilities: ['Clone attack', 'Replay attack'],
    hexLength: 12,
    color: '#FFA500'
  },

  'MIFARE_Classic': {
    name: 'MIFARE Classic 1K',
    frequency: '13.56MHz',
    security: 'medium',
    readOnly: false,
    capabilities: {
      read: 'with-keys',
      clone: 'with-keys',
      write: 'with-keys',
      emulate: true,
      bruteforce: true
    },
    description: 'Encrypted NFC card. Requires authentication keys.',
    vulnerabilities: ['Darkside attack', 'Nested attack', 'Dictionary attack'],
    sectors: 16,
    keysPerSector: 2,
    hexLength: 8,
    color: '#4ECDC4'
  },

  'MIFARE_DESFire': {
    name: 'MIFARE DESFire EV2',
    frequency: '13.56MHz',
    security: 'high',
    readOnly: false,
    capabilities: {
      read: false,
      clone: false,
      write: false,
      emulate: 'uid-only',
      bruteforce: false
    },
    description: 'High-security encrypted NFC. Nearly impossible to clone.',
    vulnerabilities: ['Physical theft only'],
    hexLength: 14,
    color: '#95E1D3'
  }
};

/**
 * Get protocol info
 */
export function getProtocolInfo(protocolName) {
  return RFID_PROTOCOLS[protocolName] || RFID_PROTOCOLS['EM4100'];
}

/**
 * Check if protocol supports operation
 */
export function protocolSupports(protocolName, operation) {
  const protocol = getProtocolInfo(protocolName);
  const capability = protocol.capabilities[operation];

  if (typeof capability === 'boolean') return capability;
  if (typeof capability === 'string') return capability; // 'with-keys', 'uid-only'
  return false;
}

/**
 * Get common default MIFARE keys (for dictionary attack)
 */
export const MIFARE_COMMON_KEYS = [
  'FFFFFFFFFFFF', // Factory default
  '000000000000', // Common blank
  'A0A1A2A3A4A5', // Common transport key
  'D3F7D3F7D3F7', // Common backdoor
  '123456789ABC', // Weak key
  'AABBCCDDEEFF', // Weak key
  'B0B1B2B3B4B5', // Another common
  '4D3A99C351DD', // Hotel systems
  '1A982C7E459A', // Transit systems
  '714C5C886E97', // Transit systems
  '587EE5F9350F', // Various systems
  'A0478CC39091', // Various systems
  '533CB6C723F6', // Various systems
  '8FD0A4F256E9'  // Various systems
];

/**
 * Generate random MIFARE keys (for scenarios)
 */
export function generateMIFAREKeys(numSectors = 16) {
  const keys = {};
  for (let i = 0; i < numSectors; i++) {
    // Sector 0 often has default key
    if (i === 0) {
      keys[0] = { keyA: 'FFFFFFFFFFFF', keyB: 'FFFFFFFFFFFF' };
    } else {
      keys[i] = {
        keyA: Array.from({ length: 12 }, () =>
          Math.floor(Math.random() * 16).toString(16).toUpperCase()
        ).join(''),
        keyB: Array.from({ length: 12 }, () =>
          Math.floor(Math.random() * 16).toString(16).toUpperCase()
        ).join('')
      };
    }
  }
  return keys;
}

/**
 * Validate card data for protocol
 */
export function validateCardData(cardData) {
  const protocol = getProtocolInfo(cardData.rfid_protocol);

  if (!cardData.rfid_data) {
    return { valid: false, error: 'Missing rfid_data' };
  }

  const data = cardData.rfid_data;

  switch (cardData.rfid_protocol) {
    case 'EM4100':
    case 'HID_Prox':
      if (!data.hex || data.hex.length !== protocol.hexLength) {
        return { valid: false, error: `Invalid hex length for ${protocol.name}` };
      }
      break;

    case 'MIFARE_Classic':
      if (!data.uid || data.uid.length !== 8) {
        return { valid: false, error: 'Invalid UID for MIFARE Classic' };
      }
      break;

    case 'MIFARE_DESFire':
      if (!data.uid || data.uid.length !== 14) {
        return { valid: false, error: 'Invalid UID for MIFARE DESFire' };
      }
      break;
  }

  return { valid: true };
}

export default RFID_PROTOCOLS;
```

### Task 1.2: Update Card Data Migration (0.5h)

**File**: `js/minigames/rfid/rfid-data.js`

Add migration function to convert old format to new:

```javascript
import { getProtocolInfo } from './rfid-protocols.js';

/**
 * Migrate old card format to new protocol-aware format
 */
function migrateCardData(cardData) {
  // Already migrated
  if (cardData.rfid_data) return cardData;

  const protocol = cardData.rfid_protocol || 'EM4100';

  // Migrate based on protocol
  if (protocol === 'EM4100' || protocol === 'HID_Prox') {
    return {
      ...cardData,
      rfid_data: {
        hex: cardData.rfid_hex,
        facility: cardData.rfid_facility,
        cardNumber: cardData.rfid_card_number,
        isClone: false,
        cloneQuality: 100
      }
    };
  }

  return cardData;
}

// Apply migration in saveCardToCloner and other methods
export class RFIDDataManager {
  saveCardToCloner(cardData) {
    // Migrate if needed
    cardData = migrateCardData(cardData);

    // ... rest of existing code
  }

  // ... other methods
}
```

### Task 1.3: Update Cloner Firmware Structure (0.5h)

**File**: Scenario JSON files

Add firmware capabilities to cloner items:

```json
{
  "type": "rfid_cloner",
  "name": "Flipper Zero",
  "firmware": {
    "version": "1.0",
    "protocols": ["EM4100", "HID_Prox"],
    "attacks": ["read", "clone", "emulate"]
  },
  "saved_cards": [],
  "activeAttacks": {},
  "takeable": true
}
```

### Task 1.4: Backward Compatibility Tests (1h)

Test that existing scenarios continue to work:
- Load old EM4100 cards
- Clone old format cards
- Emulate old format cards
- Verify migration happens transparently

## Phase 2: Protocol Detection & Display

**Estimated Time: 4 hours**

### Task 2.1: Protocol Detection in rfid-data.js (1h)

```javascript
/**
 * Detect protocol from card data
 */
detectProtocol(cardData) {
  // Explicit protocol specified
  if (cardData.rfid_protocol) {
    return cardData.rfid_protocol;
  }

  // Auto-detect from data structure
  if (cardData.rfid_data) {
    const data = cardData.rfid_data;

    // Check UID length
    if (data.uid) {
      if (data.uid.length === 14) return 'MIFARE_DESFire';
      if (data.uid.length === 8) return 'MIFARE_Classic';
    }

    // Check hex length
    if (data.hex) {
      if (data.hex.length === 12) return 'HID_Prox';
      if (data.hex.length === 10) return 'EM4100';
    }
  }

  // Legacy detection
  if (cardData.rfid_hex) {
    if (cardData.rfid_hex.length === 12) return 'HID_Prox';
    return 'EM4100';
  }

  return 'EM4100'; // Default
}

/**
 * Get card display data based on protocol
 */
getCardDisplayData(cardData) {
  const protocol = this.detectProtocol(cardData);
  const protocolInfo = getProtocolInfo(protocol);
  const data = cardData.rfid_data || {};

  const displayData = {
    protocol: protocol,
    protocolName: protocolInfo.name,
    frequency: protocolInfo.frequency,
    security: protocolInfo.security,
    color: protocolInfo.color,
    fields: []
  };

  switch (protocol) {
    case 'EM4100':
    case 'HID_Prox':
      displayData.fields = [
        { label: 'HEX', value: this.formatHex(data.hex) },
        { label: 'Facility', value: data.facility },
        { label: 'Card', value: data.cardNumber },
        { label: 'DEZ 8', value: this.toDEZ8(data.hex) }
      ];
      break;

    case 'MIFARE_Classic':
      const keysKnown = data.sectors ? Object.keys(data.sectors).length : 0;
      displayData.fields = [
        { label: 'UID', value: this.formatHex(data.uid) },
        { label: 'Type', value: '1K (16 sectors)' },
        { label: 'Keys Known', value: `${keysKnown}/16` },
        { label: 'Readable', value: keysKnown === 16 ? 'Yes' : 'Partial' },
        { label: 'Clonable', value: keysKnown > 0 ? 'Partial' : 'No' }
      ];
      break;

    case 'MIFARE_DESFire':
      displayData.fields = [
        { label: 'UID', value: this.formatHex(data.uid) },
        { label: 'Type', value: 'EV2' },
        { label: 'Encryption', value: '3DES/AES' },
        { label: 'Clonable', value: 'UID Only' }
      ];
      break;
  }

  return displayData;
}
```

### Task 2.2: Protocol Info UI Screen (1.5h)

**File**: `js/minigames/rfid/rfid-ui.js`

Add new screen type:

```javascript
/**
 * Show protocol information screen
 */
showProtocolInfo(cardData) {
  const screen = this.getScreen();
  screen.innerHTML = '';

  const displayData = this.dataManager.getCardDisplayData(cardData);

  // Breadcrumb
  const breadcrumb = document.createElement('div');
  breadcrumb.className = 'flipper-breadcrumb';
  breadcrumb.textContent = 'RFID > Info';
  screen.appendChild(breadcrumb);

  // Protocol header with security color
  const header = document.createElement('div');
  header.className = 'flipper-protocol-header';
  header.style.borderLeft = `4px solid ${displayData.color}`;
  header.innerHTML = `
    <div class="protocol-name">${displayData.protocolName}</div>
    <div class="protocol-meta">
      <span>${displayData.frequency}</span>
      <span class="security-${displayData.security}">
        ${displayData.security.toUpperCase()} Security
      </span>
    </div>
  `;
  screen.appendChild(header);

  // Card data fields
  const dataDiv = document.createElement('div');
  dataDiv.className = 'flipper-card-data';
  displayData.fields.forEach(field => {
    const fieldDiv = document.createElement('div');
    fieldDiv.textContent = `${field.label}: ${field.value}`;
    dataDiv.appendChild(fieldDiv);
  });
  screen.appendChild(dataDiv);

  // Capabilities/actions based on protocol
  this.showProtocolActions(cardData, displayData);
}

/**
 * Show available actions based on protocol and card state
 */
showProtocolActions(cardData, displayData) {
  const protocol = displayData.protocol;
  const screen = this.getScreen();

  const actions = document.createElement('div');
  actions.className = 'flipper-menu';

  switch (protocol) {
    case 'EM4100':
    case 'HID_Prox':
      // Simple read/clone
      const readBtn = document.createElement('div');
      readBtn.className = 'flipper-menu-item';
      readBtn.textContent = '> Read & Clone';
      readBtn.addEventListener('click', () => this.showReadingScreen());
      actions.appendChild(readBtn);
      break;

    case 'MIFARE_Classic':
      // Check if we have keys
      const keysKnown = cardData.rfid_data?.sectors ?
        Object.keys(cardData.rfid_data.sectors).length : 0;

      if (keysKnown === 0) {
        // No keys - offer attacks
        const darksideBtn = document.createElement('div');
        darksideBtn.className = 'flipper-menu-item';
        darksideBtn.textContent = '> Darkside Attack';
        darksideBtn.addEventListener('click', () =>
          this.minigame.startKeyAttack('darkside', cardData));
        actions.appendChild(darksideBtn);

        const dictBtn = document.createElement('div');
        dictBtn.className = 'flipper-menu-item';
        dictBtn.textContent = '  Dictionary Attack';
        dictBtn.addEventListener('click', () =>
          this.minigame.startKeyAttack('dictionary', cardData));
        actions.appendChild(dictBtn);
      } else if (keysKnown < 16) {
        // Some keys - offer nested attack
        const nestedBtn = document.createElement('div');
        nestedBtn.className = 'flipper-menu-item';
        nestedBtn.textContent = '> Nested Attack (crack remaining)';
        nestedBtn.addEventListener('click', () =>
          this.minigame.startKeyAttack('nested', cardData));
        actions.appendChild(nestedBtn);

        const readBtn = document.createElement('div');
        readBtn.className = 'flipper-menu-item';
        readBtn.textContent = '  Read (partial)';
        readBtn.addEventListener('click', () =>
          this.showCardDataScreen(cardData));
        actions.appendChild(readBtn);
      } else {
        // All keys - can fully read
        const readBtn = document.createElement('div');
        readBtn.className = 'flipper-menu-item';
        readBtn.textContent = '> Read & Clone';
        readBtn.addEventListener('click', () =>
          this.showCardDataScreen(cardData));
        actions.appendChild(readBtn);
      }
      break;

    case 'MIFARE_DESFire':
      // Can only save UID
      const infoDiv = document.createElement('div');
      infoDiv.className = 'flipper-info';
      infoDiv.textContent = 'High security - cannot clone';
      screen.appendChild(infoDiv);

      const uidBtn = document.createElement('div');
      uidBtn.className = 'flipper-menu-item';
      uidBtn.textContent = '> Save UID Only';
      uidBtn.addEventListener('click', () =>
        this.showCardDataScreen(cardData));
      actions.appendChild(uidBtn);
      break;
  }

  // Cancel button
  const cancelBtn = document.createElement('div');
  cancelBtn.className = 'flipper-button-back';
  cancelBtn.textContent = '← Cancel';
  cancelBtn.addEventListener('click', () => this.minigame.complete(false));
  actions.appendChild(cancelBtn);

  screen.appendChild(actions);
}
```

### Task 2.3: Update Card Data Display (1h)

**File**: `js/minigames/rfid/rfid-ui.js`

Modify `showCardDataScreen()` to use protocol-aware display:

```javascript
showCardDataScreen(cardData) {
  const screen = this.getScreen();
  screen.innerHTML = '';

  const displayData = this.dataManager.getCardDisplayData(cardData);

  // Breadcrumb
  const breadcrumb = document.createElement('div');
  breadcrumb.className = 'flipper-breadcrumb';
  breadcrumb.textContent = 'RFID > Read';
  screen.appendChild(breadcrumb);

  // Protocol name with color
  const protocol = document.createElement('div');
  protocol.className = 'flipper-protocol-name';
  protocol.style.color = displayData.color;
  protocol.textContent = displayData.protocolName;
  screen.appendChild(protocol);

  // Card data (protocol-specific fields)
  const data = document.createElement('div');
  data.className = 'flipper-card-data';
  displayData.fields.forEach(field => {
    const fieldDiv = document.createElement('div');
    fieldDiv.innerHTML = `<strong>${field.label}:</strong> ${field.value}`;
    data.appendChild(fieldDiv);
  });
  screen.appendChild(data);

  // Add warning for DESFire UID-only
  if (displayData.protocol === 'MIFARE_DESFire') {
    const warning = document.createElement('div');
    warning.className = 'flipper-warning';
    warning.textContent = '⚠️ UID only - may not work on secure readers';
    screen.appendChild(warning);
  }

  // Buttons
  const buttons = document.createElement('div');
  buttons.className = 'flipper-buttons';

  const saveBtn = document.createElement('button');
  saveBtn.className = 'flipper-button';
  saveBtn.textContent = 'Save';
  saveBtn.addEventListener('click', () => this.minigame.handleSaveCard(cardData));

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'flipper-button flipper-button-secondary';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', () => this.minigame.complete(false));

  buttons.appendChild(saveBtn);
  buttons.appendChild(cancelBtn);
  screen.appendChild(buttons);
}
```

### Task 2.4: Add CSS for Protocol Display (0.5h)

**File**: `css/rfid-minigame.css`

```css
/* Protocol Header */
.flipper-protocol-header {
  background: rgba(0, 0, 0, 0.3);
  padding: 15px;
  padding-left: 15px;
  border-radius: 8px;
  margin: 10px 0;
}

.protocol-name {
  font-size: 16px;
  font-weight: bold;
  color: white;
  margin-bottom: 5px;
}

.protocol-meta {
  font-size: 12px;
  color: #888;
  display: flex;
  justify-content: space-between;
}

.security-low { color: #FF6B6B; }
.security-medium-low { color: #FFA500; }
.security-medium { color: #4ECDC4; }
.security-high { color: #95E1D3; }

.flipper-protocol-name {
  font-size: 14px;
  font-weight: bold;
  text-align: center;
  margin: 10px 0;
}

.flipper-warning {
  background: rgba(255, 165, 0, 0.2);
  border-left: 3px solid #FFA500;
  padding: 10px;
  margin: 10px 0;
  color: #FFA500;
  font-size: 12px;
}
```

## Phase 3: MIFARE Classic Support

**Estimated Time: 6 hours**

### Task 3.1: Create Attack System Module (2h)

**File**: `js/minigames/rfid/rfid-attacks.js` (NEW)

```javascript
/**
 * MIFARE Classic Key Attack System
 *
 * Simulates realistic key cracking attacks:
 * - Darkside: Crack keys from scratch (30 sec)
 * - Nested: Crack remaining keys if you have one (10 sec)
 * - Dictionary: Try common keys (instant)
 */

import { MIFARE_COMMON_KEYS } from './rfid-protocols.js';

export class MIFAREAttackManager {
  constructor() {
    this.activeAttacks = [];
  }

  /**
   * Start dictionary attack (instant check)
   */
  dictionaryAttack(uid, existingKeys = {}) {
    console.log('🔓 Starting dictionary attack on', uid);

    const foundKeys = { ...existingKeys };
    let newKeysFound = 0;

    // Try common keys on all sectors
    for (let sector = 0; sector < 16; sector++) {
      if (foundKeys[sector]) continue; // Already have keys

      // Try each common key
      for (const commonKey of MIFARE_COMMON_KEYS) {
        // Simulate 10% chance each common key works
        if (Math.random() < 0.1) {
          foundKeys[sector] = {
            keyA: commonKey,
            keyB: commonKey
          };
          newKeysFound++;
          break;
        }
      }
    }

    return {
      success: newKeysFound > 0,
      foundKeys: foundKeys,
      newKeysFound: newKeysFound,
      message: newKeysFound > 0 ?
        `Found ${newKeysFound} sector(s) using common keys` :
        'No common keys found'
    };
  }

  /**
   * Start Darkside attack (progressive, takes time)
   */
  startDarksideAttack(cardName, uid, progressCallback) {
    console.log('🔓 Starting Darkside attack on', uid);

    return new Promise((resolve) => {
      const attack = {
        type: 'darkside',
        uid: uid,
        cardName: cardName,
        startTime: Date.now(),
        foundKeys: {},
        currentSector: 0,
        totalSectors: 16
      };

      this.activeAttacks.push(attack);

      // Simulate progressive key cracking
      // Real Darkside takes ~30 seconds, we'll simulate with progress updates
      const duration = 30000; // 30 seconds
      const updateInterval = 500; // Update every 500ms

      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += updateInterval;
        const progress = Math.min(100, (elapsed / duration) * 100);

        // Update current sector
        attack.currentSector = Math.floor((progress / 100) * 16);

        // Add found keys as we progress
        if (!attack.foundKeys[attack.currentSector] &&
            attack.currentSector > 0) {
          attack.foundKeys[attack.currentSector - 1] = {
            keyA: this.generateRandomKey(),
            keyB: this.generateRandomKey()
          };
        }

        // Callback with progress
        if (progressCallback) {
          progressCallback({
            progress: progress,
            currentSector: attack.currentSector,
            foundKeys: attack.foundKeys
          });
        }

        // Complete
        if (progress >= 100) {
          clearInterval(interval);

          // Add all remaining keys
          for (let i = 0; i < 16; i++) {
            if (!attack.foundKeys[i]) {
              attack.foundKeys[i] = {
                keyA: this.generateRandomKey(),
                keyB: this.generateRandomKey()
              };
            }
          }

          // Remove from active attacks
          this.activeAttacks = this.activeAttacks.filter(a => a !== attack);

          resolve({
            success: true,
            foundKeys: attack.foundKeys,
            message: 'All keys cracked successfully'
          });
        }
      }, updateInterval);
    });
  }

  /**
   * Start Nested attack (faster, requires at least one known key)
   */
  startNestedAttack(uid, knownKeys, progressCallback) {
    console.log('🔓 Starting Nested attack on', uid);

    if (Object.keys(knownKeys).length === 0) {
      return Promise.reject(new Error('Need at least one known key'));
    }

    return new Promise((resolve) => {
      const attack = {
        type: 'nested',
        uid: uid,
        foundKeys: { ...knownKeys },
        startTime: Date.now()
      };

      this.activeAttacks.push(attack);

      // Nested attack is faster: ~10 seconds
      const duration = 10000;
      const updateInterval = 500;

      let elapsed = 0;
      const sectorsToFind = 16 - Object.keys(knownKeys).length;
      let sectorsFound = 0;

      const interval = setInterval(() => {
        elapsed += updateInterval;
        const progress = Math.min(100, (elapsed / duration) * 100);

        // Add found keys progressively
        const expectedFound = Math.floor((progress / 100) * sectorsToFind);
        while (sectorsFound < expectedFound) {
          // Find next missing sector
          for (let i = 0; i < 16; i++) {
            if (!attack.foundKeys[i]) {
              attack.foundKeys[i] = {
                keyA: this.generateRandomKey(),
                keyB: this.generateRandomKey()
              };
              sectorsFound++;
              break;
            }
          }
        }

        if (progressCallback) {
          progressCallback({
            progress: progress,
            foundKeys: attack.foundKeys
          });
        }

        if (progress >= 100) {
          clearInterval(interval);
          this.activeAttacks = this.activeAttacks.filter(a => a !== attack);

          resolve({
            success: true,
            foundKeys: attack.foundKeys,
            message: `Cracked ${sectorsToFind} remaining sectors`
          });
        }
      }, updateInterval);
    });
  }

  /**
   * Generate random MIFARE key (for simulation)
   */
  generateRandomKey() {
    return Array.from({ length: 12 }, () =>
      Math.floor(Math.random() * 16).toString(16).toUpperCase()
    ).join('');
  }

  /**
   * Check if attack is in progress
   */
  hasActiveAttack(uid) {
    return this.activeAttacks.some(a => a.uid === uid);
  }

  /**
   * Get attack progress
   */
  getAttackProgress(uid) {
    return this.activeAttacks.find(a => a.uid === uid);
  }

  /**
   * Cancel attack
   */
  cancelAttack(uid) {
    this.activeAttacks = this.activeAttacks.filter(a => a.uid !== uid);
  }
}

// Global instance
window.mifareAttackManager = window.mifareAttackManager || new MIFAREAttackManager();

export default MIFAREAttackManager;
```

### Task 3.2: Add Attack UI Screens (2h)

**File**: `js/minigames/rfid/rfid-ui.js`

```javascript
/**
 * Show key attack screen (Darkside/Nested)
 */
showKeyAttackScreen(attackType, cardData) {
  const screen = this.getScreen();
  screen.innerHTML = '';

  // Breadcrumb
  const breadcrumb = document.createElement('div');
  breadcrumb.className = 'flipper-breadcrumb';
  breadcrumb.textContent = `RFID > ${attackType} Attack`;
  screen.appendChild(breadcrumb);

  // Card info
  const cardInfo = document.createElement('div');
  cardInfo.className = 'flipper-card-name';
  cardInfo.textContent = cardData.name;
  screen.appendChild(cardInfo);

  const uid = document.createElement('div');
  uid.className = 'flipper-info-dim';
  uid.textContent = `UID: ${cardData.rfid_data.uid}`;
  screen.appendChild(uid);

  // Progress container
  const progressDiv = document.createElement('div');
  progressDiv.id = 'attack-progress-container';
  screen.appendChild(progressDiv);

  // Keys found list
  const keysDiv = document.createElement('div');
  keysDiv.id = 'attack-keys-found';
  keysDiv.className = 'attack-keys-list';
  screen.appendChild(keysDiv);

  // Status message
  const status = document.createElement('div');
  status.id = 'attack-status';
  status.className = 'flipper-info';
  status.textContent = 'Don\'t move card...';
  screen.appendChild(status);
}

/**
 * Update attack progress
 */
updateAttackProgress(progressData) {
  const progressDiv = document.getElementById('attack-progress-container');
  if (progressDiv && !progressDiv.querySelector('.rfid-progress-container')) {
    const container = document.createElement('div');
    container.className = 'rfid-progress-container';

    const bar = document.createElement('div');
    bar.className = 'rfid-progress-bar';
    bar.id = 'attack-progress-bar';

    container.appendChild(bar);
    progressDiv.appendChild(container);

    const label = document.createElement('div');
    label.className = 'flipper-info';
    label.id = 'attack-progress-label';
    progressDiv.appendChild(label);
  }

  const bar = document.getElementById('attack-progress-bar');
  const label = document.getElementById('attack-progress-label');

  if (bar) {
    bar.style.width = `${progressData.progress}%`;
  }

  if (label && progressData.currentSector !== undefined) {
    label.textContent = `Cracking Sector ${progressData.currentSector}/16...`;
  }

  // Update keys found
  const keysDiv = document.getElementById('attack-keys-found');
  if (keysDiv && progressData.foundKeys) {
    keysDiv.innerHTML = '<div class="flipper-info-dim">Keys Found:</div>';

    Object.keys(progressData.foundKeys).forEach(sector => {
      const keyLine = document.createElement('div');
      keyLine.className = 'attack-key-item';
      keyLine.textContent = `Sector ${sector}: ${progressData.foundKeys[sector].keyA} ✓`;
      keysDiv.appendChild(keyLine);
    });
  }
}
```

### Task 3.3: Integrate Attacks into rfid-minigame.js (1.5h)

**File**: `js/minigames/rfid/rfid-minigame.js`

```javascript
import { MIFAREAttackManager } from './rfid-attacks.js';

export class RFIDMinigame extends MinigameScene {
  constructor(container, params) {
    super(container, params);

    // ... existing code

    // Attack manager
    this.attackManager = window.mifareAttackManager;
  }

  /**
   * Start MIFARE key attack
   */
  async startKeyAttack(attackType, cardData) {
    console.log(`🔓 Starting ${attackType} attack on`, cardData.name);

    // Show attack UI
    this.ui.showKeyAttackScreen(attackType, cardData);

    let result;

    try {
      switch (attackType) {
        case 'dictionary':
          result = this.attackManager.dictionaryAttack(
            cardData.rfid_data.uid,
            cardData.rfid_data.sectors || {}
          );

          // Show result immediately
          if (result.success) {
            this.ui.showSuccess(result.message);
            cardData.rfid_data.sectors = result.foundKeys;

            setTimeout(() => {
              this.ui.showProtocolInfo(cardData);
            }, 2000);
          } else {
            this.ui.showError(result.message);
            setTimeout(() => {
              this.ui.showProtocolInfo(cardData);
            }, 2000);
          }
          break;

        case 'darkside':
          result = await this.attackManager.startDarksideAttack(
            cardData.name,
            cardData.rfid_data.uid,
            (progress) => this.ui.updateAttackProgress(progress)
          );

          // Attack complete
          cardData.rfid_data.sectors = result.foundKeys;
          this.ui.showSuccess(result.message);

          setTimeout(() => {
            this.ui.showCardDataScreen(cardData);
          }, 2000);
          break;

        case 'nested':
          result = await this.attackManager.startNestedAttack(
            cardData.rfid_data.uid,
            cardData.rfid_data.sectors || {},
            (progress) => this.ui.updateAttackProgress(progress)
          );

          cardData.rfid_data.sectors = result.foundKeys;
          this.ui.showSuccess(result.message);

          setTimeout(() => {
            this.ui.showCardDataScreen(cardData);
          }, 2000);
          break;
      }
    } catch (error) {
      console.error('Attack failed:', error);
      this.ui.showError(error.message);

      setTimeout(() => {
        this.ui.showProtocolInfo(cardData);
      }, 2000);
    }
  }
}
```

### Task 3.4: Add Attack CSS (0.5h)

**File**: `css/rfid-minigame.css`

```css
/* Attack Progress */
.attack-keys-list {
  background: rgba(0, 0, 0, 0.3);
  padding: 10px;
  border-radius: 5px;
  margin: 10px 0;
  max-height: 150px;
  overflow-y: auto;
  font-size: 11px;
}

.attack-key-item {
  padding: 3px 0;
  color: #00FF00;
}

#attack-progress-label {
  margin-top: 10px;
  font-size: 12px;
}
```

## Phase 4: Ink Integration

**Estimated Time: 3 hours**

### Task 4.1: Extend syncItemsToInk for Protocols (1h)

**File**: `js/minigames/person-chat/person-chat-conversation.js`

```javascript
import { getProtocolInfo } from '../rfid/rfid-protocols.js';

/**
 * Sync card protocol info to Ink variables
 */
syncCardProtocolsToInk() {
  if (!this.inkEngine || !this.npc || !this.npc.itemsHeld) return;

  // Find keycards
  const keycards = this.npc.itemsHeld.filter(item => item.type === 'keycard');

  keycards.forEach((card, index) => {
    const protocol = card.rfid_protocol || 'EM4100';
    const protocolInfo = getProtocolInfo(protocol);
    const prefix = index === 0 ? 'card' : `card${index + 1}`;

    try {
      // Set protocol info
      this.inkEngine.setVariable(`${prefix}_protocol`, protocol);
      this.inkEngine.setVariable(`${prefix}_name`, card.name || 'Card');
      this.inkEngine.setVariable(`${prefix}_security`, protocolInfo.security);
      this.inkEngine.setVariable(`${prefix}_clonable`,
        protocolInfo.capabilities.clone === true);

      // Set hex/UID based on protocol
      if (card.rfid_data) {
        if (card.rfid_data.hex) {
          this.inkEngine.setVariable(`${prefix}_hex`, card.rfid_data.hex);
        }
        if (card.rfid_data.uid) {
          this.inkEngine.setVariable(`${prefix}_uid`, card.rfid_data.uid);
        }
      }

      console.log(`✅ Synced ${prefix} protocol: ${protocol}`);
    } catch (err) {
      console.warn(`⚠️ Could not sync card protocol:`, err.message);
    }
  });
}

// Call in setupExternalFunctions()
setupExternalFunctions() {
  // ... existing code

  this.syncItemsToInk();
  this.syncCardProtocolsToInk(); // NEW
}
```

### Task 4.2: Add MIFARE Attack Tags (1.5h)

**File**: `js/minigames/helpers/chat-helpers.js`

```javascript
case 'start_mifare_attack':
  if (param) {
    const [attackType, cardName, uid] = param.split('|').map(s => s.trim());

    const cloner = window.inventory.items.find(item =>
      item?.scenarioData?.type === 'rfid_cloner'
    );

    if (!cloner) {
      result.message = '⚠️ Need RFID cloner';
      break;
    }

    // Check firmware supports MIFARE
    if (!cloner.scenarioData.firmware?.protocols?.includes('MIFARE_Classic')) {
      result.message = '⚠️ Firmware upgrade needed for MIFARE';
      break;
    }

    // Set pending conversation return
    window.pendingConversationReturn = {
      npcId: window.currentConversationNPCId,
      type: window.currentConversationMinigameType || 'person-chat'
    };

    // Start attack minigame
    if (window.startRFIDMinigame) {
      window.startRFIDMinigame(null, null, {
        mode: 'attack',
        attackType: attackType,
        cardToAttack: {
          name: cardName,
          rfid_protocol: 'MIFARE_Classic',
          rfid_data: {
            uid: uid,
            sectors: {}
          }
        }
      });
      result.success = true;
    }
  }
  break;

case 'save_uid_only':
  if (param) {
    const [cardName, uid] = param.split('|').map(s => s.trim());

    window.pendingConversationReturn = {
      npcId: window.currentConversationNPCId,
      type: window.currentConversationMinigameType || 'person-chat'
    };

    if (window.startRFIDMinigame) {
      window.startRFIDMinigame(null, null, {
        mode: 'clone',
        protocol: 'MIFARE_DESFire',
        uidOnly: true,
        cardToClone: {
          name: `${cardName} (UID Only)`,
          rfid_protocol: 'MIFARE_DESFire',
          rfid_data: {
            uid: uid,
            masterKeyKnown: false
          },
          type: 'keycard',
          key_id: `uid_${uid.toLowerCase()}`,
          observations: '⚠️ UID only - may not work on secure readers'
        }
      });
      result.success = true;
    }
  }
  break;
```

### Task 4.3: Update rfid-minigame.js for Attack Mode (0.5h)

**File**: `js/minigames/rfid/rfid-minigame.js`

```javascript
init() {
  super.init();

  // ... existing code

  // Create appropriate interface
  if (this.mode === 'unlock') {
    this.ui.createUnlockInterface();
  } else if (this.mode === 'clone') {
    this.ui.createCloneInterface();
  } else if (this.mode === 'attack') {
    // MIFARE attack mode
    this.ui.createAttackInterface();
  }
}

// In UI
createAttackInterface() {
  this.clear();

  const flipper = this.createFlipperFrame();
  this.container.appendChild(flipper);

  // Immediately start the attack
  if (this.minigame.params.attackType && this.minigame.params.cardToAttack) {
    this.minigame.startKeyAttack(
      this.minigame.params.attackType,
      this.minigame.params.cardToAttack
    );
  }
}
```

## Phase 5: Testing & Scenarios

**Estimated Time: 3 hours**

### Task 5.1: Create Test Scenarios (2h)

Create test scenarios for each protocol type - detailed scenario JSONs would go here.

### Task 5.2: Integration Testing (1h)

Test all flows:
- EM4100 clone (should work instantly)
- HID Prox clone (should work instantly)
- MIFARE Classic without keys (show attack options)
- MIFARE Classic with dictionary attack
- MIFARE Classic with Darkside attack
- MIFARE DESFire (UID only)

## Summary

**Total Estimated Time: 19 hours**

- Phase 1: Protocol Data Model - 3h
- Phase 2: Protocol Detection & Display - 4h
- Phase 3: MIFARE Classic Support - 6h
- Phase 4: Ink Integration - 3h
- Phase 5: Testing & Scenarios - 3h

**Key Deliverables:**
- Multi-protocol RFID system with realistic constraints
- MIFARE key attack minigames
- Protocol-aware UI with security indicators
- Ink integration for conditional interactions
- Test scenarios for all protocol types
