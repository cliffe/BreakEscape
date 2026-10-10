# RFID Keycard Lock System - Overview

## Executive Summary

This document outlines the implementation of a new RFID keycard lock system with Flipper Zero-style interface for the BreakEscape game. The system includes:

1. **RFID Lock Type**: New lock type that accepts keycards
2. **Keycard Items**: Physical keycards with unique IDs
3. **RFID Cloner Device**: Flipper Zero-inspired tool for cloning/emulating cards
4. **Two Minigame Modes**:
   - **Unlock Mode**: Tap keycard or emulate cloned card to unlock
   - **Clone Mode**: Read and save keycard data

## User Stories

### Story 1: Player Uses Valid Keycard
1. Player approaches RFID-locked door
2. Player has matching keycard in inventory
3. Player clicks door → RFID minigame opens
4. Interface shows "Tap Card" prompt
5. Player clicks to tap → Door unlocks instantly
6. Success message: "Access Granted"

### Story 2: Player Uses RFID Cloner to Emulate
1. Player has previously cloned a keycard using RFID cloner
2. Player approaches locked door without physical card
3. Player has rfid_cloner in inventory
4. Minigame opens showing Flipper Zero interface
5. Interface shows: "RFID > Saved > Emulate"
6. Shows saved tag: "Emulating [EM4100] Security Card"
7. Player confirms → Door unlocks
8. Success message with Flipper Zero style feedback

### Story 3: Player Clones NPC's Keycard via Conversation
1. Player talks to NPC who has keycard
2. Conversation choice appears: "[Secretly clone keycard]"
3. Ink tag triggers: `# clone_keycard:Security Officer|4AC5EF44DC`
4. RFID cloner minigame opens in clone mode
5. Flipper Zero interface shows:
   ```
   RFID > Read
   "Reading 1/2"
   "> ASK PSK"
   "Don't move Card..."

   "EM-Micro EM4100"
   "Hex: 4A C5 EF 44 DC"
   "FC: 239 Card: 17628 CL: 64"
   "DEZ 8: 15680732"

   [Save] [Cancel]
   ```
6. Player clicks Save → Card saved to cloner memory
7. Can now emulate this card to unlock doors

### Story 4: Player Clones Own Keycard
1. Player has keycard in inventory
2. Player has rfid_cloner in inventory
3. Player clicks keycard in inventory
4. RFID cloner minigame opens in clone mode
5. Same reading/saving process as Story 3
6. Player can now use either physical card or emulation

### Story 5: Player Tries Wrong Card
1. Player approaches door requiring "CEO Keycard"
2. Player has "Security Keycard" instead
3. Minigame shows tap interface
4. Player taps → "Access Denied - Invalid Card"
5. Door remains locked

## System Architecture

### Components

```
RFID Keycard System
├── Lock Type: "rfid"
│   └── Requires: keycard_id (e.g., "ceo_keycard")
│
├── Items
│   ├── Keycard (type: "keycard")
│   │   ├── key_id: "ceo_keycard"
│   │   ├── rfid_hex: "4AC5EF44DC"
│   │   ├── rfid_facility: 239
│   │   └── rfid_card_number: 17628
│   │
│   └── RFID Cloner (type: "rfid_cloner")
│       └── saved_cards: []
│
├── Minigame: RFIDMinigame
│   ├── Mode: "unlock"
│   │   ├── Show available cards
│   │   ├── Show saved emulations
│   │   └── Tap/Emulate action
│   │
│   └── Mode: "clone"
│       ├── Show reading animation
│       ├── Display card data
│       └── Save to cloner
│
└── Ink Integration
    └── Tag: # clone_keycard:name|hex
```

## Key Features

### 1. Flipper Zero-Style Interface
- **Authentic UI**: Matches Flipper Zero's monospaced, minimalist design
- **Navigation**: RFID > Read/Saved > Emulate
- **Card Reading**: Shows ASK/PSK modulation animation
- **Card Data Display**: Hex, Facility Code, Card Number, DEZ format

### 2. Realistic RFID Workflow
- **EM4100 Protocol**: Industry-standard 125kHz RFID tags
- **Hex ID Format**: 5-byte hex strings (e.g., "4A C5 EF 44 DC")
- **Facility Codes**: Organization identifiers (0-255)
- **Card Numbers**: Unique card IDs within facility
- **DEZ 8 Format**: 8-digit decimal representation

### 3. Dual Usage Modes
- **Physical Cards**: Direct unlock with matching keycard
- **Cloner Device**: Read, save, and emulate cards
- **Stealth Cloning**: Clone NPC cards during conversation
- **Inventory Cloning**: Clone your own cards

### 4. Integration with Existing Systems
- **Lock System**: Extends unlock-system.js with 'rfid' case
- **Minigame Framework**: Uses base-minigame.js foundation
- **Ink Conversations**: New tag for triggering clone mode
- **Inventory System**: Clickable keycards trigger cloning

## Technical Specifications

### RFID Card Data Structure
```javascript
{
  type: "keycard",
  name: "CEO Keycard",
  key_id: "ceo_keycard",           // Matches lock's "requires"
  rfid_hex: "4AC5EF44DC",           // 5-byte hex ID
  rfid_facility: 239,               // Facility code (0-255)
  rfid_card_number: 17628,          // Card number
  rfid_protocol: "EM4100"           // Protocol type
}
```

### RFID Cloner Data Structure
```javascript
{
  type: "rfid_cloner",
  name: "RFID Cloner",
  saved_cards: [
    {
      name: "Security Officer",
      hex: "4AC5EF44DC",
      facility: 239,
      card_number: 17628,
      protocol: "EM4100",
      cloned_at: "2024-01-15T10:30:00Z"
    }
  ]
}
```

### RFID Lock Definition
```json
{
  "room_server": {
    "locked": true,
    "lockType": "rfid",
    "requires": "ceo_keycard"
  }
}
```

## Implementation Benefits

### For Game Design
- **New Puzzle Type**: Social engineering (clone NPC cards)
- **Stealth Mechanic**: Secretly clone cards without detection
- **Tech Realism**: Authentic hacking tool experience
- **Progressive Challenge**: Start with cards, upgrade to cloner

### For Players
- **Tactile Feedback**: Flipper Zero UI is satisfying to use
- **Learning**: Teaches real RFID concepts
- **Flexibility**: Multiple solutions to locked doors
- **Collection**: Collect and organize cloned cards

### For Story
- **Mission Variety**: Infiltration missions requiring card cloning
- **Character Interaction**: NPCs with different access levels
- **Escalation**: Low-level cards → Clone higher access
- **Consequences**: Using wrong card could trigger alarms

## Alignment with Existing Systems

### Similar to Keys/Pintumbler
- **Lock Type**: Same pattern as "key" lock type
- **Item Matching**: key_id matches requires field
- **Minigame**: Same framework as lockpicking minigame
- **Success Flow**: Same unlock callback pattern

### Differences
- **No Lockpicking**: Can't pick RFID locks (unlike key locks)
- **Cloning Mechanic**: Unique to RFID system
- **Digital Data**: Hex IDs instead of physical pin heights
- **Inventory Interaction**: Clicking cards triggers cloning

## Success Criteria

### Must Have
- ✅ RFID lock type works in scenarios
- ✅ Keycards unlock matching doors
- ✅ RFID cloner can save cards
- ✅ Cloner can emulate saved cards
- ✅ Flipper Zero UI is recognizable
- ✅ Ink tag triggers clone mode
- ✅ Clicking inventory cards triggers clone

### Should Have
- ✅ Reading animation is smooth
- ✅ Card data displays correctly
- ✅ Multiple cards can be saved
- ✅ UI matches Flipper Zero aesthetic
- ✅ Error messages for wrong cards

### Could Have
- 🔄 Sound effects for card read/tap
- 🔄 Animation for card tap
- 🔄 Visual feedback on Flipper screen
- 🔄 Multiple RFID protocols (EM4100, HID, etc.)
- 🔄 Card writing/modification

## Out of Scope (Future Enhancements)

- RFID frequency analysis
- Custom card programming
- RFID jamming/blocking
- NFC support (different from RFID)
- Badge photos/visual cards
- Access control system hacking
