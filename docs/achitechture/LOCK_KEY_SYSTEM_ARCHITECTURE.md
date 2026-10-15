# BreakEscape Lock & Key System Architecture

## Overview
The lock and key system in BreakEscape supports multiple lock types with a hierarchical architecture. Keys work with pintumbler locks through a scenario-based configuration system that ensures consistency between keys and locks.

---

## 1. Lock Types Definition

### Supported Lock Types
Locks are defined in the scenario JSON with the following types:

| Lock Type | Definition Location | Unlocking Method | Key File |
|-----------|-------------------|------------------|----------|
| **key** | Room `lockType` or Object `lockType` | Physical key or lockpicking | `/js/systems/key-lock-system.js` |
| **pin** | Room/Object `lockType: "pin"` | PIN code entry | `/js/systems/unlock-system.js` (case: 'pin') |
| **password** | Room/Object `lockType: "password"` | Password text entry | `/js/systems/unlock-system.js` (case: 'password') |
| **biometric** | Room/Object `lockType: "biometric"` | Fingerprint scanning | `/js/systems/unlock-system.js` (case: 'biometric') |
| **bluetooth** | Object `lockType: "bluetooth"` | Bluetooth device connection | `/js/systems/unlock-system.js` (case: 'bluetooth') |

### Lock Definition in Scenarios

**Door Lock Example (scenario3.json):**
```json
{
  "room_reception": {
    "locked": true,
    "lockType": "key",
    "requires": "briefcase_key",  // Key ID that unlocks this
    "objects": [ ... ]
  }
}
```

**Object Lock Example:**
```json
{
  "type": "safe",
  "name": "Safe1",
  "locked": true,
  "lockType": "password",
  "requires": "TimeIsMoney_123"  // Password required
}
```

---

## 2. Pin Tumbler Lock Minigame Implementation

### Lockpicking Minigame Architecture
The pintumbler minigame simulates a realistic lock picking experience with interactive pin manipulation.

**Main Implementation:** `/js/minigames/lockpicking/lockpicking-game-phaser.js`

### Key Components

#### 2.1 Pin Management (`pin-management.js`)
- **createPins()**: Creates pin objects with binding order
- **Pin Structure:**
  ```javascript
  pin = {
    index: 0-4,
    binding: randomized binding order,
    isSet: false,
    keyPinLength: 25-65 pixels,    // Lock pin height
    driverPinLength: 75 - keyPinLength,  // Spring pin height
    originalHeight: keyPinLength,
    currentHeight: 0,
    container: Phaser container,
    keyPin: graphics object,
    driverPin: graphics object,
    spring: graphics object
  }
  ```

#### 2.2 Key Operations (`key-operations.js`)
- Handles inserting and manipulating the key
- Calculates how much each pin lifts based on key cut depth
- Formula: `keyPinHeight = (key.cuts[i] / maxCutDepth) * keyPinLength`

#### 2.3 Hook Mechanics (`hook-mechanics.js`)
- Simulates applying tension to the lock
- Implements binding order mechanics
- When tension applied, pins in binding order become "biddable"
- Player can only lift set pins when tension applied

#### 2.4 Pin Visuals (`pin-visuals.js`)
- Renders pins with visual feedback
- Shows alignment with shear line (goal position)
- Highlights when pins are set correctly

### Pintumbler Lock State

**Lock State Object:**
```javascript
lockState = {
  id: "lock_id",
  pinCount: 4,
  pinHeights: [32, 28, 35, 30],  // Predefined from scenario keyPins
  difficulty: "medium",
  pins: [ /* pin objects */ ],
  bindingOrder: [2, 0, 3, 1],     // Random order
  tensionApplied: false,
  success: false,
  progress: 0
}
```

### Pin Height Configuration

**From Scenario Data (keyPins):**
```json
{
  "room": {
    "locked": true,
    "lockType": "key",
    "requires": "office_key",
    "keyPins": [32, 28, 35, 30]   // Exact pin heights for this lock
  }
}
```

The `keyPins` array directly corresponds to the pintumbler lock's key pin lengths. These values are typically normalized to 25-65 pixel range during gameplay.

---

## 3. Key System

### Key Definition in Scenarios

**Key in Starting Inventory:**
```json
{
  "startItemsInInventory": [
    {
      "type": "key",
      "name": "Office Key",
      "opens_lock": "office_key",
      "keyPins": [32, 28, 35, 30],  // Matches lock's pin heights
      "observations": "A brass key with a distinctive cut"
    }
  ]
}
```

**Key in Container:**
```json
{
  "type": "safe",
  "contents": [
    {
      "type": "key",
      "name": "Briefcase Key",
      "opens_lock": "briefcase_key",
      "keyPins": [40, 35, 38, 32, 36],  // 5-pin lock
      "observations": "Found inside the safe"
    }
  ]
}
```

### Key-Lock Mapping System

**File:** `/js/systems/key-lock-system.js`

**Global Key-Lock Mappings:**
```javascript
window.keyLockMappings = {
  "office_key": {
    lockId: "office_room_lock",
    lockConfig: { /* pin config */ },
    keyName: "Office Key",
    roomId: "office",
    lockName: "Office Door"
  },
  "briefcase_key": {
    lockId: "briefcase_lock",
    lockConfig: { /* pin config */ },
    keyName: "Briefcase Key",
    roomId: "ceo_office",
    objectIndex: 0,
    lockName: "Briefcase"
  }
}
```

### Key Ring System

**Inventory Key Ring (`inventory.js`):**
```javascript
window.inventory.keyRing = {
  keys: [keySprite1, keySprite2, ...],
  slot: DOM element,
  itemImg: DOM image
}
```

**Features:**
- Multiple keys grouped into single "Key Ring" UI item
- Key ring shows single key icon if 1 key, multiple key icon if 2+
- Click key ring to see list of available keys
- Tooltip shows key names

### Key Cut Generation

**File:** `/js/systems/key-lock-system.js` - `generateKeyCutsForLock()`

**Formula for Converting Lock Pin Heights to Key Cuts:**
```javascript
cutDepth = keyPinLength - gapFromKeyBladeTopToShearLine

// World coordinates:
keyBladeTop_world = 175      // Top surface of inserted key blade
shearLine_world = 155        // Where lock plug meets housing
gap = 20                      // Distance between them (175 - 155)

cutDepth = keyPinLength - 20  // So 65 pixel pin → 45 pixel cut
clampedCut = Math.max(0, Math.min(110, cutDepth))  // 0-110 range
```

---

## 4. Items System

### Item Definition

**File:** `/js/systems/inventory.js`

**Item Types Supported:**
- `key` - Physical key for locks
- `key_ring` - Container for multiple keys
- `lockpick` - Lockpicking tool
- `phone` - Phone for chat conversations
- `notes` - Written notes/clues
- `workstation` - Crypto analysis tool
- `fingerprint_kit` - Biometric collection
- `bluetooth_scanner` - Bluetooth device scanner
- `pc`, `safe`, `tablet` - Interactive objects
- `notepad` - Inventory notepad

### Item Inventory Structure

**Inventory Object:**
```javascript
window.inventory = {
  items: [DOM img elements],
  container: HTMLElement,
  keyRing: {
    keys: [key items],
    slot: DOM element,
    itemImg: DOM image
  }
}
```

**Item Data Structure:**
```javascript
inventoryItem = {
  scenarioData: {
    type: "key",
    name: "Office Key",
    opens_lock: "office_key",
    keyPins: [32, 28, 35, 30],
    locked: false,
    lockType: "key",
    observations: "A brass key"
  },
  name: "key",
  objectId: "inventory_key_office_key"
}
```

### Item Interaction Flow

1. **Item Added to Inventory:** `addToInventory(sprite)`
   - Creates DOM slot and image
   - Special handling for keys → key ring
   - Stores scenario data with item
   - Emits `item_picked_up` event

2. **Item Clicked:** `handleObjectInteraction(item)`
   - Checks item type
   - Triggers appropriate minigame/action

3. **Key Ring Interaction:** `handleKeyRingInteraction(keyRingItem)`
   - Single key: opens lock selection
   - Multiple keys: shows tooltip with key list

---

## 5. Minigame Triggering & Management

### Minigame Framework

**File:** `/js/minigames/framework/minigame-manager.js`

**Architecture:**
```javascript
window.MinigameFramework = {
  mainGameScene: null,
  currentMinigame: null,
  registeredScenes: {
    'lockpicking': LockpickingMinigamePhaser,
    'pin': PinMinigame,
    'password': PasswordMinigame,
    'person-chat': PersonChatMinigame,
    // ... more minigames
  },
  
  startMinigame(sceneType, container, params),
  endMinigame(success, result),
  registerScene(sceneType, SceneClass)
}
```

### Registered Minigames

| Minigame | Scene Type | File | Purpose |
|----------|-----------|------|---------|
| Lockpicking | `lockpicking` | `lockpicking/lockpicking-game-phaser.js` | Pin tumbler lock picking |
| PIN Entry | `pin` | `pin/pin-minigame.js` | Numeric PIN code entry |
| Password | `password` | `password/password-minigame.js` | Text password entry |
| Person Chat | `person-chat` | `person-chat/person-chat-minigame.js` | In-person NPC conversations |
| Phone Chat | `phone-chat` | `phone-chat/phone-chat-minigame.js` | Phone-based conversations |
| Container | `container` | `container/container-minigame.js` | Open containers/safes |
| Notes | `notes` | `notes/notes-minigame.js` | View notes/evidence |
| Biometrics | `biometrics` | `biometrics/biometrics-minigame.js` | Fingerprint scanning |
| Bluetooth Scanner | `bluetooth-scanner` | `bluetooth/bluetooth-scanner-minigame.js` | BLE device scanning |

### Minigame Triggering Flow

**From Object Interaction:**
```
Object clicked → handleObjectInteraction() 
  → Checks scenarioData.type
    → If key: Check if locked
      → If locked & requires key: startKeySelectionMinigame()
      → If locked & no key: Check for lockpick → startLockpickingMinigame()
    → If container: handleContainerInteraction()
    → If phone/notes/etc: startMinigame('type')
```

**Lock Unlocking Flow:**
```
handleUnlock(lockable, type='door'|'item')
  → getLockRequirements()
  → Check lockType:
    case 'key':
      → if keys available: startKeySelectionMinigame()
      → else if lockpick: startLockpickingMinigame()
    case 'pin':
      → startPinMinigame()
    case 'password':
      → startPasswordMinigame()
    case 'biometric':
      → Check biometric samples, unlock if match
    case 'bluetooth':
      → Check BLE devices, unlock if found & signal strong enough
```

### Minigame Lifecycle

```
1. startMinigame(sceneType, container, params)
   ↓
2. Minigame construction: new MinigameClass(container, params)
   ↓
3. init() - Setup UI structure
   ↓
4. start() - Begin minigame logic
   ↓
5. User interaction/gameplay
   ↓
6. onComplete callback(success, result)
   ↓
7. cleanup() - Remove DOM elements
   ↓
8. Re-enable main game input
```

---

## 6. Ink Conversations Integration

### Ink Engine

**File:** `/js/systems/ink/ink-engine.js`

**InkEngine Wrapper:**
```javascript
export default class InkEngine {
  loadStory(storyJson)          // Load compiled Ink JSON
  continue()                     // Get next dialogue + choices
  goToKnot(knotName)            // Jump to specific knot
  choose(index)                 // Select a choice
  getVariable(name)             // Read Ink variable
  setVariable(name, value)      // Set Ink variable
}
```

### Ink Tag System

**Tags in Ink Stories (`equipment-officer.ink`):**
```ink
=== start ===
# speaker:npc
Welcome to equipment supply!
-> hub

=== show_inventory ===
# speaker:npc
Here's everything we have!
# give_npc_inventory_items
What else can I help with?
-> hub
```

**Tag Processing:**

**File:** `/js/minigames/helpers/chat-helpers.js`

**Supported Action Tags:**

| Tag | Format | Effect |
|-----|--------|--------|
| `unlock_door` | `# unlock_door:room_id` | Unlocks specified door |
| `give_item` | `# give_item:item_type` | Gives item to player |
| `give_npc_inventory_items` | `# give_npc_inventory_items:type1,type2` | Opens container UI |
| `set_objective` | `# set_objective:text` | Updates mission objective |
| `add_note` | `# add_note:title\|content` | Adds note to collection |
| `reveal_secret` | `# reveal_secret:id\|data` | Reveals game secret |
| `trigger_minigame` | `# trigger_minigame:name` | Triggers a minigame |
| `influence_increased` | `# influence_increased` | Increases NPC influence |
| `influence_decreased` | `# influence_decreased` | Decreases NPC influence |
| `speaker:player` | `# speaker:player` | Sets speaker to player |
| `speaker:npc` | `# speaker:npc` | Sets speaker to NPC |

### Conversation Minigame Handoff

**Person Chat Flow:**
```
PersonChatMinigame.advance()
  → call inkEngine.continue()
  → get currentText + currentChoices + currentTags
  → processGameActionTags(tags, ui)
    → For each action tag, call NPCGameBridge methods
    → Show notifications
  → Display dialogue + choices to player
```

**Tag Execution Example:**
```javascript
// In equipment-officer.ink: "# give_npc_inventory_items:lockpick,workstation"
// becomes:
window.NPCGameBridge.showNPCInventory(npcId, ['lockpick', 'workstation'])
  → Triggers container minigame
  → Shows items filtered by type
  → Player can take items
```

---

## 7. RFID & Keycard System

### Current Status
**RFID/Keycard is mentioned in documentation but NOT YET IMPLEMENTED in game logic.**

**References:**
- `equipment-officer.ink` mentions "keycards for security"
- No corresponding lock type or unlock logic currently

### Architecture for Implementation

**Proposed Keycard Lock Type:**

**Scenario Definition:**
```json
{
  "room": {
    "locked": true,
    "lockType": "keycard",
    "requires": "ceo_keycard",      // Keycard ID
    "requiredAccessLevel": 3        // Optional: access level check
  },
  "objects": [
    {
      "type": "keycard",
      "name": "CEO Keycard",
      "card_id": "ceo_keycard",
      "accessLevel": 3,
      "accessRooms": ["ceo_office", "server_room"],
      "observations": "A magnetic keycard for building access"
    }
  ]
}
```

**Unlock Logic (to be added):**
```javascript
case 'keycard':
  const requiredCardId = lockRequirements.requires;
  const requiredLevel = lockRequirements.requiredAccessLevel || 1;
  
  // Check inventory for matching keycard
  const keycard = window.inventory.items.find(item =>
    item.scenarioData?.type === 'keycard' &&
    (item.scenarioData?.card_id || window.lockRef(item.scenarioData)) === requiredCardId &&
    (item.scenarioData?.accessLevel || 1) >= requiredLevel
  );
  
  if (keycard) {
    window.gameAlert(`Keycard accepted!`, 'success');
    unlockTarget(lockable, type);
  } else {
    window.gameAlert(`Access denied - keycard required`, 'error');
  }
  break;
```

---

## Key Files Reference

### Lock/Key System Files
| File | Purpose |
|------|---------|
| `/js/systems/key-lock-system.js` | Key-lock mapping, cut generation |
| `/js/systems/unlock-system.js` | Main unlock logic for all lock types |
| `/js/systems/inventory.js` | Inventory management, key ring |
| `/js/systems/interactions.js` | Object interaction detection |

### Lockpicking Minigame
| File | Purpose |
|------|---------|
| `/js/minigames/lockpicking/lockpicking-game-phaser.js` | Main minigame controller |
| `/js/minigames/lockpicking/pin-management.js` | Pin creation and state |
| `/js/minigames/lockpicking/key-operations.js` | Key insertion and manipulation |
| `/js/minigames/lockpicking/hook-mechanics.js` | Tension and binding order |
| `/js/minigames/lockpicking/pin-visuals.js` | Pin rendering |
| `/js/minigames/lockpicking/key-geometry.js` | Key blade mathematics |
| `/js/minigames/lockpicking/lock-configuration.js` | Lock state management |

### Minigame Framework
| File | Purpose |
|------|---------|
| `/js/minigames/framework/minigame-manager.js` | Framework lifecycle |
| `/js/minigames/framework/base-minigame.js` | Base class for all minigames |
| `/js/minigames/index.js` | Minigame registration |

### Conversation System
| File | Purpose |
|------|---------|
| `/js/minigames/person-chat/person-chat-minigame.js` | Person conversation controller |
| `/js/minigames/person-chat/person-chat-conversation.js` | Conversation flow |
| `/js/minigames/helpers/chat-helpers.js` | Tag processing |
| `/js/systems/ink/ink-engine.js` | Ink story wrapper |

### Scenario Examples
| File | Content |
|------|---------|
| `/scenarios/scenario3.json` | Key locks example |
| `/scenarios/scenario1.json` | Biometric/Bluetooth/Password locks |
| `/scenarios/scenario2.json` | PIN locks |

---

## Summary: Lock Unlock Flow Diagram

```
Player clicks locked door/object
    ↓
handleObjectInteraction() / handleUnlock()
    ↓
getLockRequirements() - Extract lock type & requirements
    ↓
Switch on lockType:
  ├─ 'key' →
  │   ├─ Has keys? → startKeySelectionMinigame()
  │   │   └─ Player selects key
  │   │     └─ Key cuts checked against lock pins
  │   │       └─ If match: unlock, show success
  │   │
  │   └─ Has lockpick? → startLockpickingMinigame()
  │       └─ Interactive pin tumbler UI
  │         └─ Player manipulates pins with hook
  │           └─ All pins set → shear line alignment
  │             └─ Lock opens
  │
  ├─ 'pin' → startPinMinigame()
  │   └─ Numeric keypad UI
  │     └─ Enter PIN code
  │       └─ If correct: unlock
  │
  ├─ 'password' → startPasswordMinigame()
  │   └─ Text input dialog
  │     └─ Enter password
  │       └─ If correct: unlock
  │
  ├─ 'biometric' →
  │   └─ Check gameState.biometricSamples
  │     └─ If fingerprint quality ≥ threshold: unlock
  │
  └─ 'bluetooth' →
      └─ Check gameState.bluetoothDevices
        └─ If device found & signal strong: unlock
    ↓
unlockTarget(lockable, type)
    ├─ If type='door': unlockDoor()
    └─ If type='item': set locked=false, show container if contents
    ↓
Emit 'door_unlocked'/'item_unlocked' event
```

