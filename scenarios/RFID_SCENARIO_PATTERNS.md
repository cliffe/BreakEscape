# RFID Scenario Patterns - Correct Usage

This document shows the **correct patterns** for creating RFID scenarios and Ink scripts in this project.

## ✅ Correct Ink Pattern

### Hub Structure with `#exit_conversation`

```ink
VAR has_keycard = false
VAR has_rfid_cloner = false

// Card protocol variables (auto-synced from NPC itemsHeld)
VAR card_protocol = ""
VAR card_instant_clone = false
VAR card_card_id = ""

=== start ===
# speaker:npc
Hello! I'm a guard.
-> hub

=== hub ===
// Main conversation hub

+ [Option 1]
  -> some_knot

+ [Leave] #exit_conversation
  # speaker:npc
  Goodbye!
  -> hub  // Return to hub, not END

=== some_knot ===
# speaker:npc
Some dialogue here.
-> hub  // Always return to hub
```

### Key Rules:

1. **Use `#exit_conversation` tag** - NOT `-> END`
2. **Tag goes on the choice line** - `+ [Leave] #exit_conversation`
3. **After exit, return to hub** - `-> hub` (not `-> END`)
4. **Always have a hub knot** - Central return point for all conversations
5. **All paths return to hub** - Enables conversation to resume

## ✅ Correct Scenario JSON Pattern

### Use `card_id` Format (New)

```json
{
  "npcId": "security_guard",
  "itemsHeld": [
    {
      "type": "keycard",
      "card_id": "employee_badge",
      "rfid_protocol": "EM4100",
      "name": "Employee Badge"
    }
  ]
}
```

**Benefits:**
- No manual hex/UID entry needed
- Deterministic generation from card_id
- Simpler for scenario designers
- Supports all 4 protocols

### Door Configuration

```json
{
  "lockType": "rfid",
  "requires": ["employee_badge", "master_card"],
  "acceptsUIDOnly": false
}
```

**Key Points:**
- `requires` is an **array** of card_ids
- `acceptsUIDOnly` for DESFire UID emulation
- Use `card_id`, not `opens_lock` (and never `key_id`, which the validator rejects)

## ❌ Incorrect Patterns (DO NOT USE)

### ❌ Wrong Ink Pattern

```ink
=== hub ===
+ [Leave]
  # speaker:npc
  Goodbye!
  -> END  // ❌ WRONG - breaks conversation state
```

**Problems:**
- Uses `-> END` - conversation can't be resumed
- Doesn't return to hub
- State isn't saved properly

### ❌ Wrong Scenario Pattern (Legacy)

```json
{
  "type": "keycard",
  "rfid_hex": "FF4A7B9C21",
  "rfid_facility": 255,
  "rfid_card_number": 18811,
  "key_id": "master_keycard"
}
```

**Problems:**
- Manual hex entry required
- Uses the removed `key_id` field instead of `card_id` (the validator errors on it)
- Doesn't work with new protocol system
- More complex for scenario designers

## Protocol-Specific Examples

### EM4100 (Instant Clone)

```ink
{has_keycard and card_instant_clone and card_protocol == "EM4100":
  + [Scan badge] #clone_keycard:{card_card_id}
    # speaker:player
    Quick scan - card cloned!
    -> success
}
```

### MIFARE Classic - Weak Defaults (Dictionary Attack)

```ink
{card_instant_clone and card_protocol == "MIFARE_Classic_Weak_Defaults":
  + [Scan badge] #clone_keycard:{card_card_id}
    # speaker:player
    Dictionary attack succeeded instantly!
    -> success
}
```

### MIFARE Classic - Custom Keys (Needs Attack)

```ink
{card_needs_attack:
  + [Try to scan]
    # speaker:player
    Encrypted - need Darkside attack (~30 sec)
    -> needs_time
}
```

### MIFARE DESFire (UID Only)

```ink
{card_uid_only:
  + [Save UID only]
    # speaker:player
    Saved UID - only works on weak readers
    -> uid_saved
}
```

## Complete Working Example

See these files for complete examples:
- `scenarios/test-rfid-multiprotocol.json` - All 4 protocols
- `scenarios/ink/rfid-guard-low.ink` - EM4100 example
- `scenarios/ink/rfid-guard-custom.ink` - Custom keys example
- `scenarios/ink/rfid-security-guard-fixed.ink` - Full featured example

## Common Mistakes

### ❌ Mistake 1: Using `-> END` for exits
```ink
+ [Leave]
  Goodbye!
  -> END  // ❌ WRONG
```

**✅ Correct:**
```ink
+ [Leave] #exit_conversation
  # speaker:npc
  Goodbye!
  -> hub  // ✅ RIGHT
```

### ❌ Mistake 2: Not returning to hub
```ink
=== some_knot ===
Dialog here.
// ❌ Falls off end of knot
```

**✅ Correct:**
```ink
=== some_knot ===
Dialog here.
-> hub  // ✅ Always return to hub
```

### ❌ Mistake 3: Using legacy card format
```json
{
  "rfid_hex": "01AB34CD56",
  "key_id": "employee_badge"
}
```

**✅ Correct:**
```json
{
  "card_id": "employee_badge",
  "rfid_protocol": "EM4100"
}
```

### ❌ Mistake 4: Single card_id instead of array
```json
{
  "requires": "employee_badge"  // ❌ Works but not preferred
}
```

**✅ Correct:**
```json
{
  "requires": ["employee_badge", "master_card"]  // ✅ Array format
}
```

## Protocol Names (Use These Exact Strings)

```
"EM4100"                         // Low security, instant
"MIFARE_Classic_Weak_Defaults"   // Low security, instant dictionary
"MIFARE_Classic_Custom_Keys"     // Medium security, 30sec Darkside
"MIFARE_DESFire"                 // High security, UID only
```

## Testing Checklist

When creating RFID scenarios, verify:

- [ ] Ink file uses `#exit_conversation` tag
- [ ] All knots return to hub
- [ ] Card variables declared at top
- [ ] Uses `card_id` format in JSON
- [ ] Uses `rfid_protocol` with correct protocol name
- [ ] Door `requires` is an array
- [ ] No manual hex/UID entry
- [ ] Hub pattern implemented correctly
- [ ] #clone_keycard tag uses `{card_card_id}` variable

## Reference Documentation

For more details see:
- `scenarios/ink/README_RFID_VARIABLES.md` - Complete Ink variable reference
- `planning_notes/rfid_keycard/protocols_and_interactions/00_IMPLEMENTATION_SUMMARY.md` - Technical implementation details
