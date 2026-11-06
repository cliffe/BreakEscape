# Lock & Key System - Quick Start Guide

## Quick Reference: Where Things Are

### Adding a Locked Door/Room
File: `scenario.json`
```json
{
  "rooms": {
    "office": {
      "locked": true,
      "lockType": "key",        // key, pin, password, biometric, bluetooth
      "requires": "office_key",  // ID of key/password/etc.
      "keyPins": [32, 28, 35, 30]  // Optional: for pin tumbler locks
    }
  }
}
```

### Adding a Key to Inventory
File: `scenario.json`
```json
{
  "startItemsInInventory": [
    {
      "type": "key",
      "name": "Office Key",
      "opens_lock": "office_key",    // Must match "requires" in lock
      "keyPins": [32, 28, 35, 30],   // Must match lock's keyPins
      "observations": "A brass key"
    }
  ]
}
```

### Adding a Key in a Container
File: `scenario.json`
```json
{
  "type": "safe",
  "locked": true,
  "lockType": "password",
  "requires": "1234",
  "contents": [
    {
      "type": "key",
      "name": "CEO Key",
      "opens_lock": "ceo_key",
      "keyPins": [40, 35, 38, 32, 36]
    }
  ]
}
```

---

## System Entry Points

### When Player Clicks a Locked Object
```
interactions.js: handleObjectInteraction(sprite)
  → Gets scenario data from sprite
  → Calls: handleUnlock(lockable, 'door'|'item')
```

### Unlock System Decision Tree
```
unlock-system.js: handleUnlock()
  ├─ Lock type: 'key'
  │   ├─ Has keys in inventory? → Key Selection Minigame
  │   └─ Has lockpick? → Lockpicking Minigame
  ├─ Lock type: 'pin' → PIN Entry Minigame
  ├─ Lock type: 'password' → Password Entry Minigame
  ├─ Lock type: 'biometric' → Check fingerprint samples
  └─ Lock type: 'bluetooth' → Check BLE devices
```

---

## Key Code Files

### Primary Lock Logic
```
js/systems/
  ├─ unlock-system.js          [400 lines] Main unlock handler
  ├─ key-lock-system.js        [370 lines] Key-lock mappings & cuts
  ├─ inventory.js              [630 lines] Item/key management
  └─ interactions.js           [600 lines] Object interaction detector
```

### Lockpicking Minigame (Pin Tumbler)
```
js/minigames/lockpicking/
  ├─ lockpicking-game-phaser.js    [300+ lines] Main controller
  ├─ pin-management.js              [150+ lines] Pin creation
  ├─ key-operations.js              [100+ lines] Key handling
  ├─ hook-mechanics.js              [100+ lines] Tension simulation
  ├─ pin-visuals.js                 [80+ lines]  Rendering
  └─ lock-configuration.js          [60+ lines]  State storage
```

### Minigame Framework
```
js/minigames/framework/
  ├─ minigame-manager.js       [180 lines] Framework lifecycle
  ├─ base-minigame.js          [150+ lines] Base class
  └─ index.js                  [96 lines]  Registration
```

### Conversation Integration
```
js/minigames/helpers/
  └─ chat-helpers.js           [326 lines] Ink tag processing
js/minigames/person-chat/
  └─ person-chat-minigame.js   [300+ lines] Conversation UI
```

---

## Key Data Structures

### Pin Tumbler Lock (During Gameplay)
```javascript
pin = {
  index: 0,
  binding: 2,                    // Which pin sets first (0-3)
  isSet: false,
  keyPinLength: 32,              // Lock pin height (pixels)
  driverPinLength: 43,           // Spring pin height
  keyPinHeight: 0,               // Current key pin position
  container: Phaser.Container
}
```

### Key Data (In Inventory)
```javascript
key = {
  scenarioData: {
    type: 'key',
    name: 'Office Key',
    opens_lock: 'office_key',
    keyPins: [32, 28, 35, 30],   // Lock pin heights this key opens
    observations: 'A brass key'
  },
  objectId: 'inventory_key_office_key'
}
```

### Lock Requirements (From Scenario)
```javascript
lockRequirements = {
  lockType: 'key',               // Type of lock
  requires: 'office_key',        // Key ID / password / etc.
  keyPins: [32, 28, 35, 30],    // For scenario-defined locks
  difficulty: 'medium'           // For lockpicking
}
```

---

## Common Workflows

### Scenario Designer: Add New Key-Protected Door

1. **Define the lock in room:**
   ```json
   {
     "room_name": {
       "locked": true,
       "lockType": "key",
       "requires": "storage_key",
       "keyPins": [30, 32, 28, 35]  // IMPORTANT: unique pin heights
     }
   }
   ```

2. **Add key to inventory or container:**
   ```json
   {
     "type": "key",
     "name": "Storage Key",
     "opens_lock": "storage_key",  // Must match "requires"
     "keyPins": [30, 32, 28, 35]   // Must match lock exactly
   }
   ```

3. **Test: Player should see key icon when near lock**

### Scenario Designer: Add PIN-Protected Door

```json
{
  "room_name": {
    "locked": true,
    "lockType": "pin",
    "requires": "4567"              // The PIN code
  }
}
```

### Scenario Designer: Add Password-Protected Safe

```json
{
  "type": "safe",
  "locked": true,
  "lockType": "password",
  "requires": "correct_password",
  "contents": [
    { "type": "notes", "name": "Secret Document" }
  ]
}
```

### Ink Writer: Give Key During Conversation

In `.ink` file:
```ink
=== hub ===
# speaker:npc
Here's the key you'll need!
# give_item:key|Storage Key

What else can I help with?
```

This triggers:
1. NPC gives item to player
2. Opens container minigame showing the key
3. Player can take it to inventory

---

## Debugging Tips

### Check Key-Lock Mappings
In browser console:
```javascript
window.showKeyLockMappings()  // Shows all key-lock pairs
```

### Check Player Inventory
```javascript
console.log(window.inventory.items)      // All items
console.log(window.inventory.keyRing)    // Keys specifically
```

### Check Lock Requirements
```javascript
window.getLockRequirementsForDoor(doorSprite)  // Door lock details
window.getLockRequirementsForItem(item)        // Item lock details
```

### Force Unlock (Testing)
```javascript
window.DISABLE_LOCKS = true  // Disables all locks temporarily
```

---

## Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| Key doesn't unlock door | `opens_lock` doesn't match the lock's `requires` | Ensure exact match |
| Wrong pins in lock | `keyPins` mismatch | Key's keyPins must match lock's keyPins |
| Key doesn't appear in inventory | Item not in `startItemsInInventory` | Add it to scenario or container |
| Conversation tag not working | Tag format incorrect | Use `# action:param` format |
| Minigame won't start | Framework not initialized | Check if MinigameFramework is loaded |

---

## Implementation Checklist

For adding a new lock type (e.g., RFID/Keycard):

- [ ] Add case in `unlock-system.js` switch statement
- [ ] Check inventory for matching keycard
- [ ] Verify access level (if applicable)
- [ ] Call `unlockTarget()` on success
- [ ] Show appropriate alert messages
- [ ] Update scenario schema with examples
- [ ] Add documentation with tag examples
- [ ] Test with example scenario

