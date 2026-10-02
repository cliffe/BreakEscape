# RFID Protocol Variables for Ink

This document describes the RFID card protocol variables that are automatically synced to Ink scripts when an NPC holds keycards.

## Overview

When an NPC has keycards in their `itemsHeld` array, the conversation system automatically syncs protocol-specific information to Ink variables. This allows your Ink scripts to react differently based on the card's security level and protocol.

## Required Variable Declarations

Add these to the top of your Ink script (adjust based on how many cards the NPC might have):

```ink
// Card protocol info (auto-synced from NPC itemsHeld)
VAR card_protocol = ""           // Protocol name
VAR card_name = ""               // Display name
VAR card_card_id = ""            // Logical card ID
VAR card_uid = ""                // UID (for MIFARE cards)
VAR card_hex = ""                // Hex ID (for EM4100 cards)
VAR card_security = ""           // "low", "medium", "high"
VAR card_instant_clone = false   // true for EM4100 and weak MIFARE
VAR card_needs_attack = false    // true for custom key MIFARE
VAR card_uid_only = false        // true for DESFire

// For second card (if NPC has multiple keycards)
VAR card2_protocol = ""
VAR card2_name = ""
// ... (same pattern as above)
```

## Variable Reference

### Per-Card Variables

Each card gets a prefix: `card`, `card2`, `card3`, etc.

| Variable | Type | Description | Example Values |
|----------|------|-------------|----------------|
| `{prefix}_protocol` | string | RFID protocol name | `"EM4100"`, `"MIFARE_Classic_Weak_Defaults"`, `"MIFARE_Classic_Custom_Keys"`, `"MIFARE_DESFire"` |
| `{prefix}_name` | string | Card display name | `"Employee Badge"`, `"Security Card"` |
| `{prefix}_card_id` | string | Logical card identifier | `"employee_badge"`, `"master_card"` |
| `{prefix}_security` | string | Security level | `"low"`, `"medium"`, `"high"` |
| `{prefix}_instant_clone` | boolean | Can clone instantly? | `true` for EM4100 and weak MIFARE |
| `{prefix}_needs_attack` | boolean | Needs key attack? | `true` for custom key MIFARE |
| `{prefix}_uid_only` | boolean | UID-only emulation? | `true` for DESFire |
| `{prefix}_uid` | string | Card UID (if MIFARE) | `"A1B2C3D4"` |
| `{prefix}_hex` | string | Card hex ID (if EM4100) | `"01AB34CD56"` |

## Protocol Characteristics

### EM4100 (Low Security)
- **Instant clone**: Yes
- **Attack required**: No
- **Full emulation**: Yes
- **Use case**: Entry-level cards, parking garage, old hotel keys

```ink
{card_protocol == "EM4100":
  + [Scan badge]
    # clone_keycard:{card_card_id}
    Easy! This old 125kHz card clones instantly.
    -> cloned
}
```

### MIFARE Classic - Weak Defaults (Low Security)
- **Instant clone**: Dictionary attack succeeds (~95%)
- **Attack required**: Dictionary (instant)
- **Full emulation**: Yes
- **Use case**: Cheap hotels, old transit cards, poorly maintained systems

```ink
{card_instant_clone && card_protocol == "MIFARE_Classic_Weak_Defaults":
  + [Scan badge]
    # clone_keycard:{card_card_id}
    This card uses factory default keys - dictionary attack works!
    -> cloned
}
```

### MIFARE Classic - Custom Keys (Medium Security)
- **Instant clone**: No
- **Attack required**: Darkside (~30 seconds)
- **Full emulation**: Yes (after cracking keys)
- **Use case**: Corporate badges, banks, government facilities

```ink
{card_needs_attack:
  + [Scan badge]
    # save_uid_and_start_attack:{card_card_id}|{card_uid}
    Custom keys detected. Need to run Darkside attack...
    This will take about 30 seconds.
    -> wait_for_attack
}
```

### MIFARE DESFire (High Security)
- **Instant clone**: No
- **Attack required**: N/A (impossible to crack)
- **Full emulation**: UID only (works on poorly-configured readers)
- **Use case**: High-security government, military, modern banking

```ink
{card_uid_only:
  + [Try to scan]
    # save_uid_only:{card_card_id}|{card_uid}
    High security card - I can only save the UID.
    It might work on poorly-configured readers.
    -> uid_saved
}
```

## Usage Examples

### Example 1: Simple EM4100 Clone

```ink
=== meet_security_guard ===
{has_keycard:
  + [Ask about the badge]
    You see a badge clipped to their belt.
    {card_protocol == "EM4100":
      "It's just a basic proximity card. Nothing special."
      -> offer_to_scan
    }
}

=== offer_to_scan ===
+ [Offer to "check" their badge]
  You offer to scan their badge with your Flipper Zero.
  {card_instant_clone:
    # clone_keycard:{card_card_id}
    "Sure, go ahead!" They hold it out to you.
    Your device quickly reads and clones the card.
    -> cloned_success
  }
```

### Example 2: Multi-Protocol Detection

```ink
=== analyze_card ===
{card_security == "low":
  "This is a low-security card. Easy to clone!"
  -> easy_clone
}
{card_security == "medium":
  "Medium security. I'll need to run an attack."
  -> needs_attack
}
{card_security == "high":
  "High security DESFire. I can only get the UID."
  -> uid_only
}

=== easy_clone ===
+ [Clone it]
  # clone_keycard:{card_card_id}
  Done! Cloned instantly.
  -> END

=== needs_attack ===
+ [Run Darkside attack]
  # save_uid_and_start_attack:{card_card_id}|{card_uid}
  Starting attack... this will take about 30 seconds.
  -> wait_for_crack

=== uid_only ===
+ [Save UID]
  # save_uid_only:{card_card_id}|{card_uid}
  UID saved. Might work on weak readers.
  -> END
```

### Example 3: Conditional Dialogue Based on Protocol

```ink
=== guard_conversation ===
Guard: "This is my access badge."

+ [Ask about security]
  You: "What kind of badge is it?"
  {card_protocol == "EM4100":
    Guard: "Just a basic prox card. Works fine."
    // Easy target
  }
  {card_protocol == "MIFARE_Classic_Weak_Defaults":
    Guard: "It's a MIFARE card. Standard issue."
    // Still easy, but sounds more secure
  }
  {card_protocol == "MIFARE_Classic_Custom_Keys":
    Guard: "MIFARE Classic with custom encryption."
    // They know a bit about security
  }
  {card_protocol == "MIFARE_DESFire":
    Guard: "DESFire EV2. Military-grade security."
    // High-security environment
  }
  -> guard_conversation

+ {has_rfid_cloner} [Ask to scan it]
  {card_instant_clone:
    // Easy clone
    Guard: "Sure, go ahead."
    # clone_keycard:{card_card_id}
    -> cloned
  }
  {card_needs_attack:
    // Need attack
    Guard: "I don't know... this is secure."
    -> need_persuasion
  }
  {card_uid_only:
    // UID only
    Guard: "No way. This is a DESFire card."
    -> refused
  }
```

## Ink Tags for RFID Actions

Use these tags to trigger RFID operations from Ink:

| Tag | Description | Example |
|-----|-------------|---------|
| `# clone_keycard:{card_id}` | Clone a card instantly | `# clone_keycard:employee_badge` |
| `# save_uid_only:{card_id}\|{uid}` | Save UID only (DESFire) | `# save_uid_only:exec_card\|A1B2C3D4E5F6` |
| `# save_uid_and_start_attack:{card_id}\|{uid}` | Start Darkside attack | `# save_uid_and_start_attack:secure_badge\|12345678` |

Note: The actual implementation of these tags depends on your tag handler. These are suggested patterns.

## Scenario JSON Format

Define keycards in your scenario using the simplified `card_id` format:

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

The technical RFID data (hex, UID, etc.) is generated automatically from `card_id`.

## Tips for Scenario Designers

1. **Check security level first**: Use `card_security` for quick branching
2. **Use boolean helpers**: `card_instant_clone`, `card_needs_attack`, `card_uid_only` are easier than checking protocol names
3. **Provide context**: NPCs with high-security cards should acknowledge the security ("This is a DESFire card")
4. **Realistic behavior**: Security-conscious NPCs shouldn't casually hand over DESFire cards
5. **Time pressure**: Custom key attacks take ~30 seconds - use this for tension

## Complete Example Scenario

```ink
VAR card_protocol = ""
VAR card_name = ""
VAR card_card_id = ""
VAR card_security = ""
VAR card_instant_clone = false
VAR card_needs_attack = false
VAR card_uid_only = false
VAR card_uid = ""
VAR has_rfid_cloner = false

-> hotel_reception

=== hotel_reception ===
You approach the hotel reception desk.
{has_keycard:
  The receptionist has a {card_name} on a lanyard.

  + [Ask about room access]
    "All our rooms use RFID cards for security."
    {card_security == "low":
      "Basic prox cards. Nothing fancy."
    }
    {card_security == "medium":
      "We use MIFARE Classic with custom keys."
    }
    {card_security == "high":
      "DESFire cards. Top of the line security."
    }
    -> reception_menu
}
-> reception_menu

=== reception_menu ===
+ [Ask to see their card]
  {card_instant_clone:
    "Sure!" They hold it out carelessly.
    # clone_keycard:{card_card_id}
    Your Flipper Zero quickly clones it.
    -> cloned_success
  }
  {card_needs_attack:
    "I... suppose?" They seem hesitant.
    You'll need to run an attack.
    -> attempt_attack
  }
  {card_uid_only:
    "No way. These are secure."
    You can only get the UID if you steal it.
    -> refused
  }

+ [Leave]
  -> END

=== cloned_success ===
Success! You now have a copy of {card_name}.
-> END

=== attempt_attack ===
+ [Run Darkside attack]
  # save_uid_and_start_attack:{card_card_id}|{card_uid}
  Starting attack...
  [30 seconds pass]
  Success! All keys cracked.
  -> END

=== refused ===
You'll need to find another way.
-> END
```

## Troubleshooting

**Variables not syncing?**
- Ensure variables are declared at the top of your Ink script
- Check console for sync messages: `✅ Synced card: ...`
- Verify NPC has keycards in `itemsHeld` array

**Protocol always shows EM4100?**
- Check that `rfid_protocol` is set in scenario JSON
- Default protocol is EM4100 if not specified

**Boolean helpers not working?**
- Make sure to declare boolean variables: `VAR card_instant_clone = false`
- Don't use string comparisons for booleans
