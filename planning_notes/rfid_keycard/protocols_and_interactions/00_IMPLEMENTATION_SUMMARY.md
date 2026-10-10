# RFID Protocols - Implementation Summary (Revised)

**Status**: Ready for Implementation
**Estimated Time**: 14 hours
**Last Updated**: After protocol split and card_id simplification

## Changes from Original Plan

✅ **Split MIFARE Classic** - Now two protocols (weak defaults vs custom keys)
✅ **Simplified card data** - Uses card_id like keys, generates technical data automatically
✅ **Removed HID Prox** - Minimal gameplay value, saves 2h
✅ **Merged attack mode into clone mode** - Simpler UX, saves 1h
✅ **Removed firmware system** - Can add later if needed, saves 2h
✅ **Added error handling** - Protocol checks, UID acceptance rules
✅ **Improved code organization** - Constants for timing, better structure

## Four-Protocol System

### EM4100 (Low Security)
- **Status**: Already implemented
- **Clone**: Instant, always works
- **Emulate**: Perfect emulation
- **Tech**: 125kHz, read-only, no encryption
- **Gameplay**: Entry-level cards, no challenge

### MIFARE Classic - Weak Defaults (Low Security)
- **Status**: New implementation needed
- **Clone**: Dictionary attack succeeds instantly (~95% success rate)
- **Emulate**: Perfect emulation once cloned
- **Tech**: 13.56MHz, encrypted but uses factory default keys (FFFFFFFFFFFF)
- **Gameplay**: Slightly more interesting than EM4100, but still trivial
- **Real-world**: Cheap hotels, old transit cards, poorly maintained systems

### MIFARE Classic - Custom Keys (Medium Security)
- **Status**: New implementation needed
- **Clone**: Requires Darkside attack (~30 seconds)
- **Emulate**: Perfect emulation once cloned
- **Tech**: 13.56MHz, encrypted with custom keys
- **Attacks**:
  - Dictionary (instant) - Fails (0% success for custom keys)
  - Darkside (30 sec) - Cracks all 16 sectors
  - Nested (10 sec) - If you have one key, crack the rest
- **Gameplay**: Puzzle element, adds time pressure
- **Real-world**: Corporate badges, banks, government facilities

### MIFARE DESFire (High Security)
- **Status**: New implementation needed
- **Clone**: Impossible - UID only
- **Emulate**: UID emulation works only on `acceptsUIDOnly: true` readers
- **Tech**: 13.56MHz, strong encryption (3DES/AES)
- **Gameplay**: Forces physical theft or social engineering
- **Real-world**: High-security government, military, modern banking

## Card Data Simplification

### Key Innovation: card_id Pattern

Cards now use `card_id` (like keys use `key_id`), and technical RFID data is **generated deterministically**:

**Scenario JSON (Simple):**
```json
{
  "type": "keycard",
  "card_id": "employee_badge",
  "rfid_protocol": "EM4100",
  "name": "Employee Badge"
}
```

**Runtime (Auto-generated):**
```json
{
  "type": "keycard",
  "card_id": "employee_badge",
  "rfid_protocol": "EM4100",
  "name": "Employee Badge",
  "rfid_data": {
    "cardId": "employee_badge",
    "hex": "A1B2C3D4E5",      // Generated from card_id seed
    "facility": 161,
    "cardNumber": 45926
  }
}
```

### Benefits:

1. **No manual hex/UID specification** - Generated automatically
2. **Deterministic** - Same card_id always generates same technical data
3. **Multiple cards, same access** - Like keys, multiple cards can share card_id
4. **Cleaner scenarios** - Scenario designers don't need to understand RFID protocols

### Door Configuration (Multiple Valid Cards):

```json
{
  "locked": true,
  "lockType": "rfid",
  "requires": ["employee_badge", "contractor_badge", "security_badge"],
  "acceptsUIDOnly": false
}
```

## Implementation Phases (Revised)

### Phase 1: Protocol Foundation (3h)

**File**: `js/minigames/rfid/rfid-protocols.js` (NEW)

```javascript
export const RFID_PROTOCOLS = {
  'EM4100': {
    name: 'EM-Micro EM4100',
    frequency: '125kHz',
    security: 'low',
    capabilities: {
      read: true,
      clone: true,
      emulate: true
    },
    hexLength: 10,
    color: '#FF6B6B',
    icon: '⚠️'
  },

  'MIFARE_Classic_Weak_Defaults': {
    name: 'MIFARE Classic 1K (Default Keys)',
    frequency: '13.56MHz',
    security: 'low',
    capabilities: {
      read: true,      // Dictionary attack works
      clone: true,
      emulate: true
    },
    attackTime: 'instant',
    sectors: 16,
    hexLength: 8,
    color: '#FF6B6B',  // Red like EM4100 - equally weak
    icon: '⚠️'
  },

  'MIFARE_Classic_Custom_Keys': {
    name: 'MIFARE Classic 1K (Custom Keys)',
    frequency: '13.56MHz',
    security: 'medium',
    capabilities: {
      read: 'with-keys',
      clone: 'with-keys',
      emulate: true
    },
    attackTime: '30sec',
    sectors: 16,
    hexLength: 8,
    color: '#4ECDC4',  // Teal for medium
    icon: '🔐'
  },

  'MIFARE_DESFire': {
    name: 'MIFARE DESFire EV2',
    frequency: '13.56MHz',
    security: 'high',
    capabilities: {
      read: false,
      clone: false,
      emulate: 'uid-only'
    },
    hexLength: 14,
    color: '#95E1D3',
    icon: '🔒'
  }
};

// Common MIFARE keys for dictionary attack
export const MIFARE_COMMON_KEYS = [
  'FFFFFFFFFFFF', // Factory default
  '000000000000',
  'A0A1A2A3A4A5',
  'D3F7D3F7D3F7',
  '123456789ABC',
  'AABBCCDDEEFF',
  'B0B1B2B3B4B5',
  '4D3A99C351DD',
  '1A982C7E459A'
];

// Attack timing constants
export const ATTACK_DURATIONS = {
  darkside: 30000,    // 30 seconds
  nested: 10000,      // 10 seconds
  dictionary: 0       // Instant
};
```

**File**: `js/minigames/rfid/rfid-data.js` (MODIFY)

Add deterministic generation:

```javascript
export class RFIDDataManager {
  /**
   * Generate RFID technical data from card_id
   * Same card_id always produces same hex/UID (deterministic)
   */
  generateRFIDDataFromCardId(cardId, protocol) {
    const seed = this.hashCardId(cardId);

    const data = {
      cardId: cardId
    };

    switch (protocol) {
      case 'EM4100':
        data.hex = this.generateHexFromSeed(seed, 10);
        data.facility = (seed % 256);
        data.cardNumber = (seed % 65536);
        break;

      case 'MIFARE_Classic_Weak_Defaults':
      case 'MIFARE_Classic_Custom_Keys':
        data.uid = this.generateHexFromSeed(seed, 8);
        data.sectors = {}; // Empty until cloned/cracked
        break;

      case 'MIFARE_DESFire':
        data.uid = this.generateHexFromSeed(seed, 14);
        data.masterKeyKnown = false;
        break;
    }

    return data;
  }

  /**
   * Hash card_id to deterministic seed
   */
  hashCardId(cardId) {
    let hash = 0;
    for (let i = 0; i < cardId.length; i++) {
      const char = cardId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Generate hex string from seed using LCG
   */
  generateHexFromSeed(seed, length) {
    let hex = '';
    let currentSeed = seed;

    for (let i = 0; i < length; i++) {
      currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff;
      hex += (currentSeed % 16).toString(16).toUpperCase();
    }

    return hex;
  }

  /**
   * Get card display data (supports card_id or legacy formats)
   */
  getCardDisplayData(cardData) {
    const protocol = this.detectProtocol(cardData);
    const protocolInfo = getProtocolInfo(protocol);

    // Ensure rfid_data exists
    if (!cardData.rfid_data && cardData.card_id) {
      cardData.rfid_data = this.generateRFIDDataFromCardId(
        cardData.card_id,
        protocol
      );
    }

    const displayData = {
      protocol: protocol,
      protocolName: protocolInfo.name,
      frequency: protocolInfo.frequency,
      security: protocolInfo.security,
      color: protocolInfo.color,
      icon: protocolInfo.icon,
      fields: []
    };

    switch (protocol) {
      case 'EM4100':
        const hex = cardData.rfid_data?.hex || cardData.rfid_hex;
        displayData.fields = [
          { label: 'HEX', value: this.formatHex(hex) },
          { label: 'Facility', value: cardData.rfid_data?.facility || 0 },
          { label: 'Card', value: cardData.rfid_data?.cardNumber || 0 },
          { label: 'DEZ 8', value: this.toDEZ8(hex) }
        ];
        break;

      case 'MIFARE_Classic_Weak_Defaults':
      case 'MIFARE_Classic_Custom_Keys':
        const uid = cardData.rfid_data?.uid;
        const keysKnown = cardData.rfid_data?.sectors ?
          Object.keys(cardData.rfid_data.sectors).length : 0;

        displayData.fields = [
          { label: 'UID', value: this.formatHex(uid) },
          { label: 'Type', value: '1K (16 sectors)' },
          { label: 'Keys Known', value: `${keysKnown}/16` },
          { label: 'Readable', value: keysKnown === 16 ? 'Yes ✓' : 'Partial' },
          { label: 'Clonable', value: keysKnown > 0 ? 'Partial' : 'No' }
        ];

        // Add security note
        if (protocol === 'MIFARE_Classic_Weak_Defaults') {
          displayData.securityNote = 'Uses factory default keys';
        } else {
          displayData.securityNote = 'Uses custom encryption keys';
        }
        break;

      case 'MIFARE_DESFire':
        const desUID = cardData.rfid_data?.uid;
        displayData.fields = [
          { label: 'UID', value: this.formatHex(desUID) },
          { label: 'Type', value: 'EV2' },
          { label: 'Encryption', value: '3DES/AES' },
          { label: 'Clonable', value: 'UID Only' }
        ];
        displayData.securityNote = 'High security - full clone impossible';
        break;
    }

    return displayData;
  }
}
```

---

### Phase 2: Protocol Detection & UI (3h)

**File**: `js/minigames/rfid/rfid-ui.js` (MODIFY)

Update to show protocol-specific information:

```javascript
showProtocolInfo(cardData) {
  const screen = this.getScreen();
  screen.innerHTML = '';

  const displayData = this.dataManager.getCardDisplayData(cardData);
  const protocol = displayData.protocol;

  // Breadcrumb
  const breadcrumb = document.createElement('div');
  breadcrumb.className = 'flipper-breadcrumb';
  breadcrumb.textContent = 'RFID > Info';
  screen.appendChild(breadcrumb);

  // Protocol header with icon and color
  const header = document.createElement('div');
  header.className = 'flipper-protocol-header';
  header.style.borderLeft = `4px solid ${displayData.color}`;
  header.innerHTML = `
    <div class="protocol-header-top">
      <span class="protocol-icon">${displayData.icon}</span>
      <span class="protocol-name">${displayData.protocolName}</span>
    </div>
    <div class="protocol-meta">
      <span>${displayData.frequency}</span>
      <span class="security-badge security-${displayData.security}">
        ${displayData.security.toUpperCase()}
      </span>
    </div>
  `;
  screen.appendChild(header);

  // Security note
  if (displayData.securityNote) {
    const note = document.createElement('div');
    note.className = 'flipper-info';
    note.textContent = displayData.securityNote;
    screen.appendChild(note);
  }

  // Card data fields
  const dataDiv = document.createElement('div');
  dataDiv.className = 'flipper-card-data';
  displayData.fields.forEach(field => {
    const fieldDiv = document.createElement('div');
    fieldDiv.innerHTML = `<strong>${field.label}:</strong> ${field.value}`;
    dataDiv.appendChild(fieldDiv);
  });
  screen.appendChild(dataDiv);

  // Actions based on protocol
  const actions = document.createElement('div');
  actions.className = 'flipper-menu';
  actions.style.marginTop = '20px';

  if (protocol === 'MIFARE_Classic_Weak_Defaults') {
    const keysKnown = cardData.rfid_data?.sectors ?
      Object.keys(cardData.rfid_data.sectors).length : 0;

    if (keysKnown === 0) {
      // Suggest dictionary first
      const dictBtn = document.createElement('div');
      dictBtn.className = 'flipper-menu-item';
      dictBtn.textContent = '> Dictionary Attack (instant)';
      dictBtn.addEventListener('click', () =>
        this.minigame.startKeyAttack('dictionary', cardData));
      actions.appendChild(dictBtn);
    } else if (keysKnown < 16) {
      // Some keys found
      const nestedBtn = document.createElement('div');
      nestedBtn.className = 'flipper-menu-item';
      nestedBtn.textContent = `> Nested Attack (${16 - keysKnown} sectors)`;
      nestedBtn.addEventListener('click', () =>
        this.minigame.startKeyAttack('nested', cardData));
      actions.appendChild(nestedBtn);
    } else {
      // All keys - can clone
      const readBtn = document.createElement('div');
      readBtn.className = 'flipper-menu-item';
      readBtn.textContent = '> Read & Clone';
      readBtn.addEventListener('click', () =>
        this.showCardDataScreen(cardData));
      actions.appendChild(readBtn);
    }

  } else if (protocol === 'MIFARE_Classic_Custom_Keys') {
    const keysKnown = cardData.rfid_data?.sectors ?
      Object.keys(cardData.rfid_data.sectors).length : 0;

    if (keysKnown === 0) {
      // No keys - suggest Darkside
      const darksideBtn = document.createElement('div');
      darksideBtn.className = 'flipper-menu-item';
      darksideBtn.textContent = '> Darkside Attack (~30 sec)';
      darksideBtn.addEventListener('click', () =>
        this.minigame.startKeyAttack('darkside', cardData));
      actions.appendChild(darksideBtn);

      // Dictionary unlikely but allow try
      const dictBtn = document.createElement('div');
      dictBtn.className = 'flipper-menu-item';
      dictBtn.textContent = '  Dictionary Attack (unlikely)';
      dictBtn.addEventListener('click', () =>
        this.minigame.startKeyAttack('dictionary', cardData));
      actions.appendChild(dictBtn);
    } else if (keysKnown < 16) {
      // Some keys - nested attack
      const nestedBtn = document.createElement('div');
      nestedBtn.className = 'flipper-menu-item';
      nestedBtn.textContent = `> Nested Attack (~10 sec)`;
      nestedBtn.addEventListener('click', () =>
        this.minigame.startKeyAttack('nested', cardData));
      actions.appendChild(nestedBtn);
    } else {
      // All keys
      const readBtn = document.createElement('div');
      readBtn.className = 'flipper-menu-item';
      readBtn.textContent = '> Read & Clone';
      readBtn.addEventListener('click', () =>
        this.showCardDataScreen(cardData));
      actions.appendChild(readBtn);
    }

  } else if (protocol === 'MIFARE_DESFire') {
    // UID only
    const uidBtn = document.createElement('div');
    uidBtn.className = 'flipper-menu-item';
    uidBtn.textContent = '> Save UID Only';
    uidBtn.addEventListener('click', () =>
      this.showCardDataScreen(cardData));
    actions.appendChild(uidBtn);

  } else {
    // EM4100 - instant
    const readBtn = document.createElement('div');
    readBtn.className = 'flipper-menu-item';
    readBtn.textContent = '> Read & Clone';
    readBtn.addEventListener('click', () =>
      this.showReadingScreen());
    actions.appendChild(readBtn);
  }

  const cancelBtn = document.createElement('div');
  cancelBtn.className = 'flipper-button-back';
  cancelBtn.textContent = '← Cancel';
  cancelBtn.addEventListener('click', () => this.minigame.complete(false));
  actions.appendChild(cancelBtn);

  screen.appendChild(actions);
}
```

---

### Phase 3: MIFARE Attack System (5h)

**File**: `js/minigames/rfid/rfid-attacks.js` (NEW)

```javascript
import { MIFARE_COMMON_KEYS, ATTACK_DURATIONS } from './rfid-protocols.js';

export class MIFAREAttackManager {
  constructor() {
    this.activeAttacks = new Map();
  }

  /**
   * Dictionary attack - protocol-aware success rates
   */
  dictionaryAttack(uid, existingKeys = {}, protocol) {
    console.log(`🔓 Dictionary attack on ${uid} (${protocol})`);

    const foundKeys = { ...existingKeys };
    let newKeysFound = 0;

    // Success rate based on protocol
    const successRate = protocol === 'MIFARE_Classic_Weak_Defaults' ? 0.95 : 0.0;

    for (let sector = 0; sector < 16; sector++) {
      if (foundKeys[sector]) continue;

      if (Math.random() < successRate) {
        foundKeys[sector] = {
          keyA: MIFARE_COMMON_KEYS[0], // FFFFFFFFFFFF
          keyB: MIFARE_COMMON_KEYS[0]
        };
        newKeysFound++;
      }
    }

    return {
      success: newKeysFound > 0,
      foundKeys: foundKeys,
      newKeysFound: newKeysFound,
      message: this.getDictionaryMessage(newKeysFound, protocol)
    };
  }

  getDictionaryMessage(found, protocol) {
    if (found === 16) {
      return '🔓 All sectors use factory defaults!';
    } else if (found > 0) {
      return `🔓 Found ${found} sectors with default keys`;
    } else if (protocol === 'MIFARE_Classic_Weak_Defaults') {
      return '⚠️ Some sectors have custom keys - try Nested attack';
    } else {
      return '⚠️ No default keys - use Darkside attack';
    }
  }

  /**
   * Darkside attack - crack all keys (30 sec or 10 sec for weak)
   */
  async startDarksideAttack(uid, progressCallback, protocol) {
    console.log(`🔓 Darkside attack on ${uid}`);

    // Weak defaults crack faster
    const duration = protocol === 'MIFARE_Classic_Weak_Defaults' ?
      10000 : ATTACK_DURATIONS.darkside;

    return new Promise((resolve) => {
      const attack = {
        type: 'darkside',
        uid: uid,
        foundKeys: {},
        startTime: Date.now()
      };

      this.activeAttacks.set(uid, attack);

      const updateInterval = 500;
      let elapsed = 0;

      const interval = setInterval(() => {
        elapsed += updateInterval;
        const progress = Math.min(100, (elapsed / duration) * 100);
        const currentSector = Math.floor((progress / 100) * 16);

        // Add keys progressively
        for (let i = 0; i < currentSector; i++) {
          if (!attack.foundKeys[i]) {
            attack.foundKeys[i] = {
              keyA: this.generateRandomKey(),
              keyB: this.generateRandomKey()
            };
          }
        }

        if (progressCallback) {
          progressCallback({
            progress: progress,
            currentSector: currentSector,
            foundKeys: attack.foundKeys
          });
        }

        if (progress >= 100) {
          clearInterval(interval);

          // Ensure all 16 sectors
          for (let i = 0; i < 16; i++) {
            if (!attack.foundKeys[i]) {
              attack.foundKeys[i] = {
                keyA: this.generateRandomKey(),
                keyB: this.generateRandomKey()
              };
            }
          }

          this.activeAttacks.delete(uid);

          resolve({
            success: true,
            foundKeys: attack.foundKeys,
            message: 'All 16 sectors cracked!'
          });
        }
      }, updateInterval);

      attack.interval = interval;
    });
  }

  /**
   * Nested attack - crack remaining keys (10 sec)
   */
  async startNestedAttack(uid, knownKeys, progressCallback) {
    console.log(`🔓 Nested attack on ${uid}`);

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

      this.activeAttacks.set(uid, attack);

      const duration = ATTACK_DURATIONS.nested;
      const updateInterval = 500;
      const sectorsToFind = 16 - Object.keys(knownKeys).length;

      let elapsed = 0;
      let sectorsFound = 0;

      const interval = setInterval(() => {
        elapsed += updateInterval;
        const progress = Math.min(100, (elapsed / duration) * 100);

        const expectedFound = Math.floor((progress / 100) * sectorsToFind);

        while (sectorsFound < expectedFound) {
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
            foundKeys: attack.foundKeys,
            sectorsRemaining: sectorsToFind - sectorsFound
          });
        }

        if (progress >= 100) {
          clearInterval(interval);
          this.activeAttacks.delete(uid);

          resolve({
            success: true,
            foundKeys: attack.foundKeys,
            message: `Cracked ${sectorsToFind} remaining sectors!`
          });
        }
      }, updateInterval);

      attack.interval = interval;
    });
  }

  generateRandomKey() {
    return Array.from({ length: 12 }, () =>
      Math.floor(Math.random() * 16).toString(16).toUpperCase()
    ).join('');
  }

  cleanup() {
    this.activeAttacks.forEach(attack => {
      if (attack.interval) clearInterval(attack.interval);
    });
    this.activeAttacks.clear();
  }

  cancelAttack(uid) {
    const attack = this.activeAttacks.get(uid);
    if (attack && attack.interval) {
      clearInterval(attack.interval);
    }
    this.activeAttacks.delete(uid);
  }
}

window.mifareAttackManager = window.mifareAttackManager || new MIFAREAttackManager();
export default MIFAREAttackManager;
```

---

### Phase 4: Unlock System Integration (2h)

**File**: `js/systems/unlock-system.js` (MODIFY)

Update to use card_id matching:

```javascript
case 'rfid':
  const requiredCardIds = Array.isArray(lockRequirements.requires) ?
    lockRequirements.requires : [lockRequirements.requires];
  const acceptsUIDOnly = lockRequirements.acceptsUIDOnly || false;

  // Check physical keycards
  const keycards = window.inventory.items.filter(item =>
    item && item.scenarioData &&
    item.scenarioData.type === 'keycard'
  );

  // Check if any physical card matches
  const hasValidCard = keycards.some(card =>
    requiredCardIds.includes(card.scenarioData.card_id)
  );

  // Check cloner saved cards
  const cloner = window.inventory.items.find(item =>
    item && item.scenarioData &&
    item.scenarioData.type === 'rfid_cloner'
  );

  const hasValidClone = cloner?.scenarioData?.saved_cards?.some(card =>
    requiredCardIds.includes(card.card_id)
  );

  if (keycards.length > 0 || cloner?.scenarioData?.saved_cards?.length > 0) {
    window.startRFIDMinigame(lockable, type, {
      mode: 'unlock',
      requiredCardIds: requiredCardIds,  // Pass array
      availableCards: keycards,
      hasCloner: !!cloner,
      acceptsUIDOnly: acceptsUIDOnly,
      onComplete: (success) => {
        if (success) {
          unlockTarget(lockable, type, lockable.layer);
        }
      }
    });
  } else {
    window.gameAlert('Requires RFID keycard', 'error', 'Access Denied', 4000);
  }
  break;
```

**File**: `js/minigames/rfid/rfid-minigame.js` (MODIFY)

Update unlock matching logic:

```javascript
handleCardTap(card) {
  console.log('📡 Card tapped:', card.scenarioData?.name);

  const cardId = card.scenarioData?.card_id;
  const isCorrect = this.requiredCardIds.includes(cardId);

  if (isCorrect) {
    this.animations.showTapSuccess();
    this.ui.showSuccess('Access Granted');
    setTimeout(() => this.complete(true), 1500);
  } else {
    this.animations.showTapFailure();
    this.ui.showError('Access Denied');
    setTimeout(() => this.ui.showTapInterface(), 1500);
  }
}

handleEmulate(savedCard) {
  console.log('📡 Emulating card:', savedCard.name);

  const cardId = savedCard.card_id;
  const isCorrect = this.requiredCardIds.includes(cardId);

  // Check if UID-only emulation
  const isUIDOnly = savedCard.rfid_protocol === 'MIFARE_DESFire' &&
                    !savedCard.rfid_data?.masterKeyKnown;

  if (isUIDOnly && !this.params.acceptsUIDOnly) {
    this.animations.showEmulationFailure();
    this.ui.showError('Reader requires full authentication');
    setTimeout(() => this.ui.showSavedCards(), 2000);
    return;
  }

  if (isCorrect) {
    this.animations.showEmulationSuccess();
    this.ui.showSuccess('Access Granted');
    setTimeout(() => this.complete(true), 2000);
  } else {
    this.animations.showEmulationFailure();
    this.ui.showError('Access Denied');
    setTimeout(() => this.ui.showSavedCards(), 1500);
  }
}
```

---

### Phase 5: Ink Integration (2h)

**File**: `js/minigames/person-chat/person-chat-conversation.js` (MODIFY)

```javascript
import { getProtocolInfo } from '../rfid/rfid-protocols.js';

syncCardProtocolsToInk() {
  if (!this.inkEngine || !this.npc || !this.npc.itemsHeld) return;

  const keycards = this.npc.itemsHeld.filter(item => item.type === 'keycard');

  keycards.forEach((card, index) => {
    const protocol = card.rfid_protocol || 'EM4100';
    const protocolInfo = getProtocolInfo(protocol);
    const prefix = index === 0 ? 'card' : `card${index + 1}`;

    // Ensure rfid_data exists
    if (!card.rfid_data && card.card_id) {
      card.rfid_data = window.rfidDataManager.generateRFIDDataFromCardId(
        card.card_id,
        protocol
      );
    }

    try {
      this.inkEngine.setVariable(`${prefix}_protocol`, protocol);
      this.inkEngine.setVariable(`${prefix}_name`, card.name || 'Card');
      this.inkEngine.setVariable(`${prefix}_card_id`, card.card_id);
      this.inkEngine.setVariable(`${prefix}_security`, protocolInfo.security);

      // Simplified booleans
      const isInstantClone = protocol === 'EM4100' ||
                            protocol === 'MIFARE_Classic_Weak_Defaults';
      this.inkEngine.setVariable(`${prefix}_instant_clone`, isInstantClone);

      const needsAttack = protocol === 'MIFARE_Classic_Custom_Keys';
      this.inkEngine.setVariable(`${prefix}_needs_attack`, needsAttack);

      const isUIDOnly = protocol === 'MIFARE_DESFire';
      this.inkEngine.setVariable(`${prefix}_uid_only`, isUIDOnly);

      // Set UID or hex
      if (card.rfid_data?.uid) {
        this.inkEngine.setVariable(`${prefix}_uid`, card.rfid_data.uid);
      }
      if (card.rfid_data?.hex) {
        this.inkEngine.setVariable(`${prefix}_hex`, card.rfid_data.hex);
      }

      console.log(`✅ Synced ${prefix}: ${protocol} (card_id: ${card.card_id})`);
    } catch (err) {
      console.warn(`⚠️ Could not sync card protocol:`, err.message);
    }
  });
}

// Call in setupExternalFunctions()
setupExternalFunctions() {
  // ... existing code
  this.syncItemsToInk();
  this.syncCardProtocolsToInk(); // ADD
}
```

**Documentation**: Create `scenarios/ink/README_RFID_VARIABLES.md`

```markdown
# RFID Protocol Variables for Ink

## Required Variable Declarations

```ink
// Card protocol info (auto-synced from NPC itemsHeld)
VAR card_protocol = ""           // Protocol name
VAR card_name = ""               // Display name
VAR card_card_id = ""            // Logical card ID
VAR card_uid = ""                // For MIFARE cards
VAR card_hex = ""                // For EM4100 cards
VAR card_security = ""           // "low", "medium", "high"
VAR card_instant_clone = false   // true for EM4100 and weak MIFARE
VAR card_needs_attack = false    // true for custom key MIFARE
VAR card_uid_only = false        // true for DESFire
```

## Usage Examples

### EM4100 (instant):
```ink
{card_instant_clone && card_protocol == "EM4100":
  + [Scan badge]
    # clone_keycard:{card_card_id}
    -> cloned
}
```

### MIFARE Weak Defaults (instant dictionary):
```ink
{card_instant_clone && card_protocol == "MIFARE_Classic_Weak_Defaults":
  + [Scan badge]
    # clone_keycard:{card_card_id}
    It uses default keys - dictionary attack succeeds instantly!
    -> cloned
}
```

### MIFARE Custom Keys (needs attack):
```ink
{card_needs_attack:
  + [Scan badge]
    # save_uid_and_start_attack:{card_card_id}|{card_uid}
    Custom keys detected. Starting Darkside attack...
    -> wait_for_attack
}
```

### DESFire (UID only):
```ink
{card_uid_only:
  + [Try to scan]
    # save_uid_only:{card_card_id}|{card_uid}
    High security card - you can only save the UID.
    -> uid_saved
}
```
```

---

## Example Scenarios

### Scenario 1: Hotel (Weak MIFARE)

```json
{
  "name": "Hotel Test",
  "startRoom": "lobby",
  "rooms": {
    "lobby": {
      "type": "room_reception",
      "objects": [
        {
          "type": "keycard",
          "card_id": "room_301",
          "rfid_protocol": "MIFARE_Classic_Weak_Defaults",
          "name": "Room 301 Keycard"
        },
        {
          "type": "keycard",
          "card_id": "master_hotel",
          "rfid_protocol": "MIFARE_Classic_Weak_Defaults",
          "name": "Hotel Master Key"
        },
        {
          "type": "rfid_cloner",
          "name": "Flipper Zero"
        }
      ],
      "doors": [{
        "locked": true,
        "lockType": "rfid",
        "requires": ["room_301", "master_hotel"]
      }]
    }
  }
}
```

### Scenario 2: Corporate (Custom Keys)

```json
{
  "name": "Corporate Office",
  "startRoom": "reception",
  "rooms": {
    "reception": {
      "type": "room_reception",
      "npcs": [{
        "id": "guard",
        "itemsHeld": [{
          "type": "keycard",
          "card_id": "security_access",
          "rfid_protocol": "MIFARE_Classic_Custom_Keys",
          "name": "Security Badge"
        }]
      }],
      "objects": [{
        "type": "rfid_cloner",
        "name": "Flipper Zero"
      }],
      "doors": [{
        "locked": true,
        "lockType": "rfid",
        "requires": "security_access",
        "acceptsUIDOnly": false
      }]
    }
  }
}
```

### Scenario 3: Bank (DESFire)

```json
{
  "name": "Bank Vault",
  "startRoom": "lobby",
  "rooms": {
    "lobby": {
      "type": "room_office",
      "objects": [
        {
          "type": "keycard",
          "card_id": "executive_access",
          "rfid_protocol": "MIFARE_DESFire",
          "name": "Executive Card"
        }
      ],
      "doors": [
        {
          "locked": true,
          "lockType": "rfid",
          "requires": "executive_access",
          "acceptsUIDOnly": false,
          "description": "Vault door - requires full auth"
        },
        {
          "locked": true,
          "lockType": "rfid",
          "requires": "executive_access",
          "acceptsUIDOnly": true,
          "description": "Office door - UID check only"
        }
      ]
    }
  }
}
```

---

## Implementation Checklist

### Phase 1: Foundation (3h)
- [ ] Create `rfid-protocols.js` with 4 protocols
- [ ] Add MIFARE_COMMON_KEYS constant
- [ ] Add ATTACK_DURATIONS constant
- [ ] Add `generateRFIDDataFromCardId()` to rfid-data.js
- [ ] Add `hashCardId()` helper
- [ ] Add `generateHexFromSeed()` helper
- [ ] Update `getCardDisplayData()` for 4 protocols
- [ ] Test deterministic generation

### Phase 2: UI (3h)
- [ ] Update `showProtocolInfo()` for 4 protocols
- [ ] Add protocol-specific action menus
- [ ] Update `showCardDataScreen()` with security notes
- [ ] Add CSS for protocol headers
- [ ] Add CSS for security badges
- [ ] Test UI for all protocols

### Phase 3: Attacks (5h)
- [ ] Create `rfid-attacks.js`
- [ ] Implement protocol-aware `dictionaryAttack()`
- [ ] Implement `startDarksideAttack()` with variable duration
- [ ] Implement `startNestedAttack()`
- [ ] Add attack UI screens
- [ ] Add `updateAttackProgress()`
- [ ] Integrate into `rfid-minigame.js`
- [ ] Add cleanup logic
- [ ] Test all attack types

### Phase 4: Unlock Integration (2h)
- [ ] Update unlock-system.js to use card_id arrays
- [ ] Update `handleCardTap()` for card_id matching
- [ ] Update `handleEmulate()` with UID-only check
- [ ] Add acceptsUIDOnly door property support
- [ ] Test multiple valid cards per door

### Phase 5: Ink Integration (2h)
- [ ] Add `syncCardProtocolsToInk()`
- [ ] Add protocol-specific variables
- [ ] Create Ink variable documentation
- [ ] Add `save_uid_only` tag
- [ ] Create example .ink files
- [ ] Test Ink variable syncing

---

## Total Time: 14 hours

**Protocol Count**: 4
- EM4100 (low, instant)
- MIFARE_Classic_Weak_Defaults (low, instant dictionary)
- MIFARE_Classic_Custom_Keys (medium, 30sec Darkside)
- MIFARE_DESFire (high, UID only)

**Key Features**:
- ✅ card_id pattern (like keys)
- ✅ Deterministic RFID data generation
- ✅ Multiple cards per door
- ✅ Protocol-aware attacks
- ✅ Ink integration with simple variables

**Ready for implementation** ✅
