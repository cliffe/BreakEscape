# RFID Protocols - Key Updates Summary

**Date**: Latest Revision
**Status**: Supersedes portions of 01_TECHNICAL_DESIGN.md and 02_IMPLEMENTATION_PLAN.md

This document summarizes the critical updates made after the initial planning review.

## Major Changes

### 1. Four Protocols Instead of Three

**Original Plan**: 3 protocols (EM4100, MIFARE_Classic, MIFARE_DESFire)

**Updated Plan**: 4 protocols by splitting MIFARE Classic:

```javascript
'EM4100'                        // Low - instant clone
'MIFARE_Classic_Weak_Defaults'  // Low - instant dictionary attack
'MIFARE_Classic_Custom_Keys'    // Medium - 30sec Darkside attack
'MIFARE_DESFire'                // High - UID only
```

**Rationale**: MIFARE Classic security depends entirely on configuration. A card with default keys (FFFFFFFFFFFF) is as weak as EM4100, while one with custom keys requires real effort to crack.

### 2. Simplified Card Data Format

**Original Plan**: Manual hex/UID specification in scenarios:
```json
{
  "type": "keycard",
  "rfid_hex": "01AB34CD56",
  "rfid_facility": 1,
  "rfid_card_number": 43981,
  "rfid_protocol": "EM4100",
  "key_id": "employee_badge"
}
```

**Updated Plan**: card_id with automatic generation:
```json
{
  "type": "keycard",
  "card_id": "employee_badge",
  "rfid_protocol": "EM4100",
  "name": "Employee Badge"
}
```

**Benefits**:
- Matches existing key system pattern
- No manual hex/UID needed - generated deterministically from card_id
- Multiple cards can share same card_id (like keys)
- Cleaner scenarios

### 3. Protocol-Specific Attack Behavior

**Dictionary Attack**:
- `MIFARE_Classic_Weak_Defaults`: 95% success rate (most sectors use FFFFFFFFFFFF)
- `MIFARE_Classic_Custom_Keys`: 0% success rate (no default keys)

**Darkside Attack**:
- `MIFARE_Classic_Weak_Defaults`: 10 seconds (weak crypto)
- `MIFARE_Classic_Custom_Keys`: 30 seconds (normal)

### 4. Door Lock Configuration

**Original**: Single card requirement
```json
{
  "lockType": "rfid",
  "requires": "employee_badge"
}
```

**Updated**: Multiple valid cards (like key system)
```json
{
  "lockType": "rfid",
  "requires": ["employee_badge", "contractor_badge", "security_badge"],
  "acceptsUIDOnly": false
}
```

## Implementation Updates

### Protocol Definitions

```javascript
// js/minigames/rfid/rfid-protocols.js

export const RFID_PROTOCOLS = {
  'EM4100': {
    name: 'EM-Micro EM4100',
    security: 'low',
    color: '#FF6B6B',
    icon: '⚠️'
  },

  'MIFARE_Classic_Weak_Defaults': {
    name: 'MIFARE Classic 1K (Default Keys)',
    security: 'low',           // Same as EM4100
    color: '#FF6B6B',          // Same color - equally weak
    icon: '⚠️',
    attackTime: 'instant'
  },

  'MIFARE_Classic_Custom_Keys': {
    name: 'MIFARE Classic 1K (Custom Keys)',
    security: 'medium',
    color: '#4ECDC4',
    icon: '🔐',
    attackTime: '30sec'
  },

  'MIFARE_DESFire': {
    name: 'MIFARE DESFire EV2',
    security: 'high',
    color: '#95E1D3',
    icon: '🔒'
  }
};
```

### Deterministic Data Generation

```javascript
// js/minigames/rfid/rfid-data.js

export class RFIDDataManager {
  /**
   * Generate RFID data from card_id (deterministic)
   * Same card_id always produces same hex/UID
   */
  generateRFIDDataFromCardId(cardId, protocol) {
    const seed = this.hashCardId(cardId);
    const data = { cardId: cardId };

    switch (protocol) {
      case 'EM4100':
        data.hex = this.generateHexFromSeed(seed, 10);
        data.facility = (seed % 256);
        data.cardNumber = (seed % 65536);
        break;

      case 'MIFARE_Classic_Weak_Defaults':
      case 'MIFARE_Classic_Custom_Keys':
        data.uid = this.generateHexFromSeed(seed, 8);
        data.sectors = {};
        break;

      case 'MIFARE_DESFire':
        data.uid = this.generateHexFromSeed(seed, 14);
        data.masterKeyKnown = false;
        break;
    }

    return data;
  }

  hashCardId(cardId) {
    let hash = 0;
    for (let i = 0; i < cardId.length; i++) {
      const char = cardId.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  generateHexFromSeed(seed, length) {
    let hex = '';
    let currentSeed = seed;

    for (let i = 0; i < length; i++) {
      // Linear congruential generator
      currentSeed = (currentSeed * 1103515245 + 12345) & 0x7fffffff;
      hex += (currentSeed % 16).toString(16).toUpperCase();
    }

    return hex;
  }
}
```

### Protocol-Aware Attacks

```javascript
// js/minigames/rfid/rfid-attacks.js

export class MIFAREAttackManager {
  dictionaryAttack(uid, existingKeys = {}, protocol) {
    const foundKeys = { ...existingKeys };
    let newKeysFound = 0;

    // Success rate depends on protocol
    const successRate = protocol === 'MIFARE_Classic_Weak_Defaults' ? 0.95 : 0.0;

    for (let sector = 0; sector < 16; sector++) {
      if (foundKeys[sector]) continue;

      if (Math.random() < successRate) {
        foundKeys[sector] = {
          keyA: 'FFFFFFFFFFFF',  // Factory default
          keyB: 'FFFFFFFFFFFF'
        };
        newKeysFound++;
      }
    }

    return {
      success: newKeysFound > 0,
      foundKeys: foundKeys,
      message: this.getDictionaryMessage(newKeysFound, protocol)
    };
  }

  async startDarksideAttack(uid, progressCallback, protocol) {
    // Weak defaults crack faster (10 sec vs 30 sec)
    const duration = protocol === 'MIFARE_Classic_Weak_Defaults' ?
      10000 : 30000;

    // ... attack implementation with variable duration
  }
}
```

### Unlock System Changes

```javascript
// js/systems/unlock-system.js

case 'rfid':
  // Support multiple valid cards
  const requiredCardIds = Array.isArray(lockRequirements.requires) ?
    lockRequirements.requires : [lockRequirements.requires];

  const acceptsUIDOnly = lockRequirements.acceptsUIDOnly || false;

  // Check if any physical card matches
  const hasValidCard = keycards.some(card =>
    requiredCardIds.includes(card.scenarioData.card_id)  // Match by card_id
  );

  // Check cloner saved cards
  const hasValidClone = cloner?.scenarioData?.saved_cards?.some(card =>
    requiredCardIds.includes(card.card_id)  // Match by card_id
  );

  // Pass array of valid IDs to minigame
  window.startRFIDMinigame(lockable, type, {
    mode: 'unlock',
    requiredCardIds: requiredCardIds,  // Array
    acceptsUIDOnly: acceptsUIDOnly
  });
  break;
```

### Ink Variables

```javascript
// js/minigames/person-chat/person-chat-conversation.js

syncCardProtocolsToInk() {
  const keycards = this.npc.itemsHeld.filter(item => item.type === 'keycard');

  keycards.forEach((card, index) => {
    const protocol = card.rfid_protocol || 'EM4100';
    const prefix = index === 0 ? 'card' : `card${index + 1}`;

    // Ensure rfid_data exists (generate if needed)
    if (!card.rfid_data && card.card_id) {
      card.rfid_data = window.rfidDataManager.generateRFIDDataFromCardId(
        card.card_id,
        protocol
      );
    }

    // Set simplified boolean variables
    const isInstantClone = protocol === 'EM4100' ||
                          protocol === 'MIFARE_Classic_Weak_Defaults';
    this.inkEngine.setVariable(`${prefix}_instant_clone`, isInstantClone);

    const needsAttack = protocol === 'MIFARE_Classic_Custom_Keys';
    this.inkEngine.setVariable(`${prefix}_needs_attack`, needsAttack);

    const isUIDOnly = protocol === 'MIFARE_DESFire';
    this.inkEngine.setVariable(`${prefix}_uid_only`, isUIDOnly);

    this.inkEngine.setVariable(`${prefix}_protocol`, protocol);
    this.inkEngine.setVariable(`${prefix}_card_id`, card.card_id);
    this.inkEngine.setVariable(`${prefix}_security`, protocolInfo.security);
  });
}
```

## Scenario Examples

### Hotel (Weak MIFARE)

```json
{
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
    }
  ],
  "doors": [{
    "locked": true,
    "lockType": "rfid",
    "requires": ["room_301", "master_hotel"]
  }]
}
```

**Player experience**: Dictionary attack instantly finds all default keys → clone → use

### Corporate (Custom Keys)

```json
{
  "npcs": [{
    "id": "guard",
    "itemsHeld": [{
      "type": "keycard",
      "card_id": "security_access",
      "rfid_protocol": "MIFARE_Classic_Custom_Keys",
      "name": "Security Badge"
    }]
  }],
  "doors": [{
    "locked": true,
    "lockType": "rfid",
    "requires": "security_access"
  }]
}
```

**Player experience**: Clone from NPC → Dictionary fails → Darkside 30 sec → clone → use

### Bank (DESFire)

```json
{
  "objects": [{
    "type": "keycard",
    "card_id": "executive_access",
    "rfid_protocol": "MIFARE_DESFire",
    "name": "Executive Card"
  }],
  "doors": [
    {
      "locked": true,
      "lockType": "rfid",
      "requires": "executive_access",
      "acceptsUIDOnly": false,
      "description": "Vault - requires full auth"
    },
    {
      "locked": true,
      "lockType": "rfid",
      "requires": "executive_access",
      "acceptsUIDOnly": true,
      "description": "Office - accepts UID only"
    }
  ]
}
```

**Player experience**: Can only save UID → Works on poorly-configured readers → Doesn't work on secure vault

## Ink Usage Examples

### Required Variables

```ink
VAR card_protocol = ""
VAR card_card_id = ""
VAR card_instant_clone = false
VAR card_needs_attack = false
VAR card_uid_only = false
```

### EM4100

```ink
{card_instant_clone && card_protocol == "EM4100":
  + [Scan their badge]
    # clone_keycard:{card_card_id}
    You quickly scan their badge.
    -> cloned
}
```

### MIFARE Weak Defaults

```ink
{card_instant_clone && card_protocol == "MIFARE_Classic_Weak_Defaults":
  + [Scan their badge]
    # clone_keycard:{card_card_id}
    Your Flipper finds all the default keys instantly!
    -> cloned
}
```

### MIFARE Custom Keys

```ink
{card_needs_attack:
  + [Try to scan]
    The card is encrypted with custom keys.
    # save_uid_only:{card_card_id}|{card_uid}
    You'll need to run a Darkside attack to clone it fully.
    -> uid_saved
}
```

### MIFARE DESFire

```ink
{card_uid_only:
  + [Try to scan]
    # save_uid_only:{card_card_id}|{card_uid}
    High security encryption - you can only save the UID.
    -> uid_only
}
```

## Key Takeaways

1. **Four protocols** give meaningful gameplay progression:
   - Instant (EM4100, weak MIFARE)
   - Quick challenge (custom MIFARE with 30sec attack)
   - Impossible/UID-only (DESFire)

2. **card_id system** simplifies scenarios dramatically:
   - No need to specify technical details
   - Multiple cards can share access
   - Deterministic generation prevents conflicts

3. **Protocol awareness** makes attacks realistic:
   - Dictionary succeeds on weak configs, fails on strong
   - Darkside faster on weak keys
   - DESFire can't be attacked at all

4. **Door flexibility** matches key system:
   - Multiple valid cards per door
   - UID-only acceptance flag for poorly-configured readers

## Next Steps

Refer to `00_IMPLEMENTATION_SUMMARY.md` for complete implementation guide with all code examples and checklists.

The original `01_TECHNICAL_DESIGN.md` and `02_IMPLEMENTATION_PLAN.md` are still valid for overall architecture and file organization, but use this document for:
- Protocol definitions (4 instead of 3)
- Card data format (card_id approach)
- Attack behavior (protocol-specific)
- Scenario structure (simplified JSON)
