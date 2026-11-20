# RFID Protocols & Interactions - Technical Design

## Overview

Add support for multiple RFID protocols with different security levels and capabilities. Each protocol has realistic constraints based on real-world RFID technology, enabling different attack vectors and gameplay strategies.

## Protocol Specifications

### Protocol Definitions

Based on real-world RFID technology used in access control systems:

```javascript
const RFID_PROTOCOLS = {
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
      bruteforce: false  // Too many combinations
    },
    description: 'Legacy low-frequency card. Read-only, easily cloned.',
    vulnerabilities: ['Clone attack', 'Replay attack'],
    hexLength: 10,  // 5 bytes
    color: '#FF6B6B'  // Red for low security
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
    hexLength: 12,  // 6 bytes (26-bit format)
    color: '#FFA500'  // Orange for medium-low
  },

  'MIFARE_Classic': {
    name: 'MIFARE Classic 1K',
    frequency: '13.56MHz',
    security: 'medium',
    readOnly: false,
    capabilities: {
      read: 'with-keys',  // Need auth keys
      clone: 'with-keys',
      write: 'with-keys',
      emulate: true,
      bruteforce: true  // Weak crypto, can crack keys
    },
    description: 'Encrypted NFC card. Requires authentication keys.',
    vulnerabilities: ['Darkside attack', 'Nested attack', 'Hardnested attack'],
    sectors: 16,
    keysPerSector: 2,  // Key A and Key B
    hexLength: 8,  // UID is 4 bytes
    color: '#4ECDC4'  // Teal for medium
  },

  'MIFARE_DESFire': {
    name: 'MIFARE DESFire EV2',
    frequency: '13.56MHz',
    security: 'high',
    readOnly: false,
    capabilities: {
      read: false,  // Encrypted, can't read without master key
      clone: false,  // Can't clone - uses mutual authentication
      write: false,  // Can't write without master key
      emulate: 'uid-only',  // Can only emulate UID, not full card
      bruteforce: false  // Strong crypto (3DES/AES)
    },
    description: 'High-security encrypted NFC. Nearly impossible to clone.',
    vulnerabilities: ['Physical theft only'],
    hexLength: 14,  // 7-byte UID
    color: '#95E1D3'  // Light green for high security
  }
};
```

## Data Model Changes

### Card Data Structure

**Current** (EM4100 only):
```javascript
{
  type: "keycard",
  name: "Employee Badge",
  rfid_hex: "01AB34CD56",
  rfid_facility: 1,
  rfid_card_number: 43981,
  rfid_protocol: "EM4100",
  key_id: "employee_badge"
}
```

**Enhanced** (all protocols):
```javascript
{
  type: "keycard",
  name: "Employee Badge",
  rfid_protocol: "EM4100",  // or HID_Prox, MIFARE_Classic, MIFARE_DESFire
  key_id: "employee_badge",

  // Protocol-specific data (only relevant fields per protocol)
  rfid_data: {
    // EM4100 / HID Prox
    hex: "01AB34CD56",
    facility: 1,
    cardNumber: 43981,

    // MIFARE Classic (if applicable)
    uid: "AB12CD34",
    sectors: {
      0: { keyA: "FFFFFFFFFFFF", keyB: null },  // Default key
      1: { keyA: "A1B2C3D4E5F6", keyB: "123456789ABC" },  // Custom keys
      // ... more sectors
    },

    // MIFARE DESFire (if applicable)
    uid: "04AB12CD3456E0",
    masterKeyKnown: false,  // Can't clone without this

    // Clone quality (for cloned cards)
    isClone: false,
    cloneQuality: 100,  // 0-100, affects reliability
    clonedFrom: null  // Original card ID
  },

  observations: "Standard employee access badge."
}
```

### RFID Cloner Data Structure

```javascript
{
  type: "rfid_cloner",
  name: "Flipper Zero",

  // Firmware capabilities (can be upgraded in-game)
  firmware: {
    version: "1.0",
    protocols: ['EM4100', 'HID_Prox'],  // Unlocks MIFARE support later
    attacks: ['read', 'clone', 'emulate']  // Unlocks 'bruteforce' later
  },

  saved_cards: [
    // Array of card data objects
  ],

  // Cracking progress (for MIFARE Classic key attacks)
  activeAttacks: {
    "security_badge_uid_AB12CD34": {
      type: "darkside_attack",
      protocol: "MIFARE_Classic",
      progress: 45,  // 0-100%
      sector: 3,
      foundKeys: {
        0: { keyA: "FFFFFFFFFFFF" },
        1: { keyA: "A1B2C3D4E5F6" }
      }
    }
  },

  x: 350,
  y: 250,
  takeable: true,
  observations: "Portable multi-tool for pentesters. Can read and emulate RFID cards."
}
```

## Flipper Zero Operations by Protocol

### EM4100 / HID Prox Operations

**1. Read**
- Instant read, shows all data
- No authentication needed
- UI: Standard reading screen (already implemented)

**2. Clone**
- Instant clone, perfect copy
- UI: Progress bar → Card data → Save

**3. Emulate**
- Perfect emulation
- UI: Emulation screen (already implemented)

### MIFARE Classic Operations

**1. Read (requires keys)**
```
Decision Tree:
├─ Has all keys for all sectors?
│  ├─ Yes → Read full card data
│  └─ No → Show partial data, offer key attack
└─ Has NO keys?
   └─ Offer Darkside/Nested attack to crack keys
```

**2. Clone (requires keys)**
- Can only clone sectors where keys are known
- Partial clones possible (some sectors locked)

**3. Key Attacks**
- **Darkside Attack**: Crack keys from scratch (~30 seconds realistic)
- **Nested Attack**: Crack remaining keys if you have one key (~10 seconds)
- **Dictionary Attack**: Try common keys (instant check)

**4. Write**
- Modify card data in writable sectors
- Useful for:
  - Changing balance on payment cards
  - Modifying access permissions
  - Writing cloned data to blank cards

**5. Emulate**
- Can emulate if keys are known
- UI shows which sectors are available

### MIFARE DESFire Operations

**1. Read**
- Can only read UID (no encryption keys)
- Cannot read application data

**2. UID Emulation**
- Can emulate UID only
- Some systems check UID only (lower security)
- Higher security systems use encrypted challenge-response (emulation fails)

**3. No Clone/Write**
- Strong encryption prevents cloning
- Game design: These cards must be physically stolen or access granted through social engineering

## UI Design

### Protocol Detection Screen

New screen when reading a card for the first time:

```
╔════════════════════════════════════╗
║  FLIPPER ZERO          ⚡ 100%    ║
╠════════════════════════════════════╣
║                                    ║
║  RFID > Read                       ║
║                                    ║
║  Detecting...                      ║
║                                    ║
║  ┌────────────────────────────────┐║
║  │        📡                      │║
║  │                                │║
║  │   [Progress Bar 65%]           │║
║  └────────────────────────────────┘║
║                                    ║
║  Scanning frequencies...           ║
║  125kHz: No response               ║
║  13.56MHz: Card detected!          ║
║                                    ║
╚════════════════════════════════════╝
```

### Protocol Info Screen

After detection:

```
╔════════════════════════════════════╗
║  FLIPPER ZERO          ⚡ 100%    ║
╠════════════════════════════════════╣
║                                    ║
║  RFID > Read > Info                ║
║                                    ║
║  ┌────────────────────────────────┐║
║  │  MIFARE Classic 1K             │║
║  │  ──────────────────            │║
║  │  Freq: 13.56MHz                │║
║  │  Security: Medium               │║
║  │  UID: AB 12 CD 34              │║
║  └────────────────────────────────┘║
║                                    ║
║  This card uses encryption.        ║
║  Authentication keys required.     ║
║                                    ║
║  > Read (requires keys)            ║
║    Crack Keys                      ║
║    Try Dictionary                  ║
║    Cancel                          ║
║                                    ║
╚════════════════════════════════════╝
```

### Key Cracking Screen (MIFARE Classic)

```
╔════════════════════════════════════╗
║  FLIPPER ZERO          ⚡ 95%     ║
╠════════════════════════════════════╣
║                                    ║
║  RFID > Darkside Attack            ║
║                                    ║
║  Security Badge                    ║
║  UID: AB 12 CD 34                  ║
║                                    ║
║  ┌────────────────────────────────┐║
║  │  Cracking Sector 3...          │║
║  │  ████████████░░░░░░░░  65%     │║
║  └────────────────────────────────┘║
║                                    ║
║  Keys Found:                       ║
║  Sector 0: FF FF FF FF FF FF ✓     ║
║  Sector 1: A1 B2 C3 D4 E5 F6 ✓     ║
║  Sector 2: 12 34 56 78 9A BC ✓     ║
║  Sector 3: Cracking...             ║
║                                    ║
║  Don't move card...                ║
║                                    ║
╚════════════════════════════════════╝
```

### Card Data Screen with Protocol-Specific Fields

**EM4100:**
```
╔════════════════════════════════════╗
║  RFID > Read                       ║
║                                    ║
║  EM-Micro EM4100                   ║
║                                    ║
║  HEX: 01 AB 34 CD 56               ║
║  Facility: 1                       ║
║  Card: 43981                       ║
║  Checksum: 0xD6                    ║
║  DEZ 8: 00043981                   ║
║                                    ║
║  [Save]  [Cancel]                  ║
╚════════════════════════════════════╝
```

**MIFARE Classic (with keys):**
```
╔════════════════════════════════════╗
║  RFID > Read                       ║
║                                    ║
║  MIFARE Classic 1K                 ║
║                                    ║
║  UID: AB 12 CD 34                  ║
║  SAK: 08                           ║
║  ATQA: 00 04                       ║
║                                    ║
║  Sectors: 16                       ║
║  Keys Known: 16/16 ✓               ║
║                                    ║
║  Readable: Yes                     ║
║  Writable: Yes                     ║
║  Clonable: Yes                     ║
║                                    ║
║  [Save]  [View Data]  [Cancel]     ║
╚════════════════════════════════════╝
```

**MIFARE DESFire (limited):**
```
╔════════════════════════════════════╗
║  RFID > Read                       ║
║                                    ║
║  MIFARE DESFire EV2                ║
║                                    ║
║  UID: 04 AB 12 CD 34 56 E0         ║
║  SAK: 20                           ║
║  ATQA: 03 44                       ║
║                                    ║
║  ⚠️  High Security                 ║
║                                    ║
║  This card uses 3DES encryption.   ║
║  Full clone: Not possible          ║
║  UID emulation: Possible           ║
║                                    ║
║  Some systems only check UID and   ║
║  don't use encryption properly.    ║
║                                    ║
║  [Save UID]  [Cancel]              ║
╚════════════════════════════════════╝
```

## Ink Integration

### Exposing Card Protocol Info to Ink

When NPC conversation starts, sync card protocol information:

```javascript
// In person-chat-conversation.js, extend syncItemsToInk()
syncCardProtocolsToInk() {
  if (!this.inkEngine || !this.npc || !this.npc.itemsHeld) return;

  // Find all keycards held by NPC
  const keycards = this.npc.itemsHeld.filter(item => item.type === 'keycard');

  keycards.forEach((card, index) => {
    const protocol = card.rfid_protocol || 'EM4100';
    const prefix = index === 0 ? 'card' : `card${index + 1}`;

    // Set variables for this card
    this.inkEngine.setVariable(`${prefix}_protocol`, protocol);
    this.inkEngine.setVariable(`${prefix}_name`, card.name);
    this.inkEngine.setVariable(`${prefix}_security`, RFID_PROTOCOLS[protocol].security);
    this.inkEngine.setVariable(`${prefix}_clonable`, RFID_PROTOCOLS[protocol].capabilities.clone === true);
  });
}
```

### Ink Variable Usage

```ink
VAR card_protocol = ""
VAR card_name = ""
VAR card_security = ""
VAR card_clonable = false

=== guard_conversation ===
# speaker:npc
I've got my security badge right here on my lanyard.

{card_protocol == "EM4100":
  -> easy_clone
}
{card_protocol == "MIFARE_Classic":
  -> needs_key_attack
}
{card_protocol == "MIFARE_DESFire":
  -> impossible_clone
}

=== easy_clone ===
+ [Subtly scan the badge]
  # clone_keycard:{card_name}|{card_hex}
  You discretely position your Flipper near their badge.
  -> cloned

=== needs_key_attack ===
+ [Scan the badge]
  You scan the badge but it's encrypted...
  # start_mifare_attack:{card_name}|{card_uid}
  Your Flipper starts a Darkside attack.
  -> wait_for_crack

+ [Ask to borrow it for a minute]
  -> borrow_card_choice

=== impossible_clone ===
+ [Try to scan the badge]
  # speaker:player
  You position your Flipper near their badge.
  # speaker:npc
  You can only capture the UID. This card uses strong encryption - you can't clone it without the master key.
  # save_uid_only:{card_name}|{card_uid}
  -> uid_saved

+ [Ask if you can borrow it]
  This is your only option. You'll need the physical card.
  -> borrow_card_choice
```

### New Ink Tags

#### `# start_mifare_attack:CardName|UID`

Starts a MIFARE Classic key cracking attack in the background.

```javascript
case 'start_mifare_attack':
  if (param) {
    const [cardName, uid] = param.split('|');

    // Check for Flipper
    const cloner = window.inventory.items.find(item =>
      item?.scenarioData?.type === 'rfid_cloner'
    );

    if (!cloner) {
      result.message = '⚠️ Need RFID cloner';
      break;
    }

    // Check firmware supports MIFARE
    if (!cloner.scenarioData.firmware.protocols.includes('MIFARE_Classic')) {
      result.message = '⚠️ Firmware upgrade needed for MIFARE attacks';
      break;
    }

    // Start background attack
    startMIFAREAttack(cardName, uid, cloner);
    result.success = true;
    result.message = `🔓 Started Darkside attack on ${cardName}`;
  }
  break;
```

#### `# check_attack_complete:CardUID`

Check if background attack finished (can use in conditional choice):

```ink
=== wait_for_crack ===
# speaker:npc
So anyway, as I was saying about the weekend plans...

{check_attack_complete(card_uid):
  + [Your Flipper vibrates - attack complete!]
    # speaker:player
    (Your Flipper successfully cracked the keys!)
    # clone_mifare:{card_name}|{card_uid}
    -> cloned
  - else:
    + [Continue chatting]
      -> keep_waiting
}
```

#### `# clone_mifare:CardName|UID`

Clone a MIFARE card (requires keys to be cracked first):

```javascript
case 'clone_mifare':
  if (param) {
    const [cardName, uid] = param.split('|');

    const cloner = window.inventory.items.find(item =>
      item?.scenarioData?.type === 'rfid_cloner'
    );

    // Check if we have the keys
    const attack = cloner?.scenarioData?.activeAttacks?.[`uid_${uid}`];

    if (!attack || attack.progress < 100) {
      result.message = '⚠️ Keys not yet cracked';
      break;
    }

    // Launch RFID minigame in clone mode with MIFARE data
    window.pendingConversationReturn = {
      npcId: window.currentConversationNPCId,
      type: window.currentConversationMinigameType || 'person-chat'
    };

    window.startRFIDMinigame(null, null, {
      mode: 'clone',
      protocol: 'MIFARE_Classic',
      cardToClone: {
        name: cardName,
        rfid_protocol: 'MIFARE_Classic',
        rfid_data: {
          uid: uid,
          sectors: attack.foundKeys
        },
        type: 'keycard',
        key_id: `cloned_${uid.toLowerCase()}`
      }
    });
  }
  break;
```

#### `# save_uid_only:CardName|UID`

Save only UID for DESFire cards (can't clone full card):

```javascript
case 'save_uid_only':
  if (param) {
    const [cardName, uid] = param.split('|');

    window.pendingConversationReturn = {
      npcId: window.currentConversationNPCId,
      type: window.currentConversationMinigameType || 'person-chat'
    };

    window.startRFIDMinigame(null, null, {
      mode: 'clone',
      protocol: 'MIFARE_DESFire',
      uidOnly: true,
      cardToClone: {
        name: cardName + " (UID Only)",
        rfid_protocol: 'MIFARE_DESFire',
        rfid_data: {
          uid: uid,
          masterKeyKnown: false
        },
        type: 'keycard',
        key_id: `uid_${uid.toLowerCase()}`,
        observations: "⚠️ UID only - may not work on secure readers"
      }
    });
  }
  break;
```

## Implementation Phases

This feature can be implemented incrementally:

### Phase 1: Protocol Data Model (Foundation)
1. Add RFID_PROTOCOLS constant
2. Update card data structure to support rfid_data
3. Update cloner to support firmware capabilities
4. Backward compatibility for existing EM4100 cards

### Phase 2: Protocol Detection & Display
1. Add protocol detection logic in rfid-data.js
2. Create protocol info UI screen
3. Update card data display to show protocol-specific fields
4. Color coding by security level

### Phase 3: MIFARE Classic Support
1. Implement key attack minigame screens
2. Add background attack system
3. Add dictionary attack (common keys)
4. Partial clone support (some sectors)

### Phase 4: MIFARE DESFire Support
1. UID-only save functionality
2. Emulation with warning messages
3. Physical theft/social engineering paths

### Phase 5: Ink Integration
1. Extend syncItemsToInk for protocol variables
2. Implement new Ink tags
3. Add conditional attack options
4. Create example scenarios

### Phase 6: HID Prox Support
1. Add HID-specific data format
2. Facility code + card number extraction
3. UI for HID cards

## Testing Plan

### Unit Tests
- Protocol detection from card data
- Capability checks per protocol
- Key cracking simulation
- UID extraction

### Integration Tests
- Clone EM4100 (should work instantly)
- Clone HID Prox (should work instantly)
- Attempt clone MIFARE Classic without keys (should fail/offer attack)
- Attack MIFARE Classic (should eventually succeed)
- Attempt clone DESFire (should only get UID)
- Emulate UID-only DESFire against simple reader (should work)
- Emulate UID-only DESFire against secure reader (should fail)

### Scenario Tests
Create test scenarios for each protocol:
- `test-rfid-em4100.json` (current)
- `test-rfid-hid-prox.json`
- `test-rfid-mifare-classic.json`
- `test-rfid-mifare-desfire.json`

## Backward Compatibility

Existing EM4100 cards continue to work:

```javascript
// Old format (still works)
{
  type: "keycard",
  rfid_hex: "01AB34CD56",
  rfid_facility: 1,
  rfid_card_number: 43981,
  rfid_protocol: "EM4100"
}

// Automatically migrated to:
{
  type: "keycard",
  rfid_protocol: "EM4100",
  rfid_data: {
    hex: "01AB34CD56",
    facility: 1,
    cardNumber: 43981
  }
}
```

Migration happens transparently when cards are loaded.

## Performance Considerations

- Protocol detection: Instant (client-side lookup)
- Key attacks: Simulated with setTimeout (no real crypto)
- Background attacks: Store in gameState, check on game loop
- No actual network calls or heavy computation
