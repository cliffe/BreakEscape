# Lock Scenario Guide

Quick reference for adding locks to scenarios.

## Room Locks (Doors)

Add these properties to a **room** to lock all doors leading to it:

```json
"server_room": {
  "type": "room_servers",
  "locked": true,
  "lockType": "pin",
  "requires": "1234",
  "connections": { "south": "lobby" }
}
```

## Object Locks (Containers)

Add these properties to lockable objects:

```json
{
  "type": "safe",
  "name": "Wall Safe",
  "locked": true,
  "lockType": "password",
  "requires": "secret123",
  "contents": [{ "type": "key", "name": "Gold Key" }]
}
```

---

## Lock Types Reference

### `key` - Physical Key
```json
"lockType": "key",
"requires": "office_key",
"keyPins": [45, 35, 25, 55]  // Optional: for lockpicking
```
**Player needs:** `type: "key"` with `opens_lock` matching the lock's `requires`

### `lockpick` - Lockpickable (No Key Exists)
```json
"lockType": "key",
"requires": "nonexistent_key",
"difficulty": "hard"
```
**Player needs:** `type: "lockpick"`

### `pin` - Numeric Code
```json
"lockType": "pin",
"requires": "4829"
```
**Player needs:** Guess or find the code

### `password` - Text Password
```json
"lockType": "password",
"requires": "secret123",
"passwordHint": "My pet's name",
"showHint": true,
"showKeyboard": true
```
**Player needs:** Guess or find the password

### `rfid` - Keycard
```json
"lockType": "rfid",
"requires": ["server_keycard"]
```
**Player needs:** `type: "keycard"` with matching `card_id` OR cloned card in RFID cloner

### `biometric` - Fingerprint
```json
"lockType": "biometric",
"requires": "Dr Smith",
"biometricMatchThreshold": 0.5
```
**Player needs:** Collected fingerprint from that person

### `bluetooth` - Device Proximity
```json
"lockType": "bluetooth",
"requires": "00:11:22:33:44:55"
```
**Player needs:** `type: "bluetooth_scanner"` + scanned device

---

## Items Reference

### Keys
```json
{
  "type": "key",
  "name": "Office Key",
  "opens_lock": "office_key",
  "keyPins": [45, 35, 25, 55],
  "takeable": true
}
```

### Keycards
```json
{
  "type": "keycard",
  "name": "Server Keycard",
  "card_id": "server_keycard",
  "rfid_protocol": "EM4100",
  "takeable": true
}
```

### Lockpick
```json
{
  "type": "lockpick",
  "name": "Lockpick Set",
  "takeable": true
}
```

### RFID Cloner
```json
{
  "type": "rfid_cloner",
  "name": "RFID Flipper",
  "saved_cards": [],
  "takeable": true
}
```

### Fingerprint Kit
```json
{
  "type": "fingerprint_kit",
  "name": "Fingerprint Kit",
  "takeable": true
}
```

### Bluetooth Scanner
```json
{
  "type": "bluetooth_scanner",
  "name": "Bluetooth Scanner",
  "takeable": true
}
```

---

## NPC RFID Cards (For Cloning)

```json
{
  "id": "guard",
  "npcType": "person",
  "rfidCard": {
    "card_id": "master_keycard",
    "rfid_protocol": "EM4100",
    "name": "Master Keycard"
  }
}
```

---

## Lockable Object Types

These objects support `locked`, `lockType`, `requires`:

- `safe` - Wall/floor safe
- `briefcase` / `suitcase` - Portable containers
- `pc` / `laptop` / `tablet` - Computing devices
- `closet` / `cabinet` - Storage furniture

---

## Quick Examples

**PIN-locked room:**
```json
"vault": { "locked": true, "lockType": "pin", "requires": "9999" }
```

**Key-locked safe:**
```json
{ "type": "safe", "locked": true, "lockType": "key", "requires": "safe_key" }
```

**RFID door:**
```json
"server_room": { "locked": true, "lockType": "rfid", "requires": ["admin_card"] }
```

---

## Planned Features (TODO)

### Conditional Locks (Global Variable Dependencies)

**Status**: Future implementation

Locks that activate/deactivate based on global game state, enabling cross-scenario consequences and state synchronization.

**Use Case**: Detection failures in one scenario (e.g., missing SIEM alerts) trigger consequences in later scenarios (e.g., ransomware deployment prevents access).

**Proposed Syntax**:
```json
{
  "type": "workstation",
  "name": "Analyst Workstation 1",
  "lockType": null,
  "conditionalLock": {
    "condition": "globalVars.ransomware_deployed === true",
    "lockType": "ransomware_display"
  },
  "contents": [...]
}
```

**Implementation Notes**:
- Requires global state management system for persistent cross-scenario data
- Condition evaluator needed in unlock system
- Server-side validation of state changes required for assessment integrity

