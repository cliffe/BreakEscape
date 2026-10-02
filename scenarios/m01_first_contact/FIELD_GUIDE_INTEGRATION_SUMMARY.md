---
title: "Field Guide Integration Summary"
description: "Complete overview of SAFETYNET field guide implementation"
---

# Field Guide Integration - Complete Summary

## What Was Created

A comprehensive in-universe field guide for Linux commands and SSH bruteforce tactics, delivered by Agent 0x99 when the player finds a password list.

## Files Created/Modified

### New Files

1. **SAFETYNET_FIELD_GUIDE_Linux_SSH_Bruteforce.md** (Lab Sheet)
   - Location: `scenarios/m01_first_contact/lab_sheet/`
   - 300+ lines of tactical operational guidance
   - Sections: Environment, Commands, Hydra, SSH, Sudo, Files, Attack Sequence, Troubleshooting
   - Written in-universe as Agent 0x99 briefing

2. **INK_COMPILATION_REQUIRED.md** (Build Instructions)
   - Instructions for recompiling Ink to JSON
   - Testing checklist
   - Compiler installation guide

3. **FIELD_GUIDE_INTEGRATION_SUMMARY.md** (This File)
   - Overview of what was integrated

### Modified Files

1. **scenario.json.erb** (Game Scenario)
   - Added `safetynet_field_guide_workstation` item to server room
   - Added event mapping for when password list is picked up
   - Added event mapping to offer field guide
   - Added global variables: `password_list_found`, `field_guide_offered`, `field_guide_requested`, `field_guide_received`

2. **m01_phone_agent0x99.ink** (Agent 0x99 Dialogue)
   - Added `field_guide_hint_given` variable
   - Added dialogue choice to support_hub
   - Added new `request_field_guide` knot with direct item delivery

### Archived Files

- 12 comprehensive learning-focused hint materials moved to `lab_sheet/archive_reference/`
- Kept for deep technical learning outside the game context

## Game Flow

```
Player finds "My Passwords" in derek's office
    ↓
Agent 0x99 sends: "Derek's password list. Save those to a file..."
    ↓ (3 seconds later)
Agent 0x99 sends: "This could be useful in the server room. 
                   I've put together an ops manual. Let me know if you want it."
    ↓
Player opens Agent 0x99 phone conversation
    ↓
New dialogue option appears: "I'd like that ops manual you mentioned"
    ↓
Player selects option
    ↓
Agent 0x99: "I'm uploading the ops manual to your secure terminal right now..."
    ↓
#give-item:safetynet_field_guide_workstation → Player gets item immediately
    ↓
Player can open "SAFETYNET Ops Manual" from inventory anytime
    ↓
Field guide displays: Full Linux commands, Hydra usage, SSH, sudo, attack sequence, troubleshooting
```

## Key Integration Points

### Scenario (scenario.json.erb)

**Event 1: Password list found**
```json
{
  "eventPattern": "item_picked_up:notes",
  "condition": "data.itemName === 'My Passwords'",
  "setGlobal": { "password_list_found": true },
  "sendTimedMessage": { "delay": 1500, "message": "..." }
}
```

**Event 2: Offer field guide**
```json
{
  "eventPattern": "global_variable_changed:password_list_found",
  "condition": "value === true",
  "setGlobal": { "field_guide_offered": true },
  "sendTimedMessage": { "delay": 3000, "message": "..." }
}
```

### Ink Dialogue (m01_phone_agent0x99.ink)

**Dialogue Choice**
```ink
+ {field_guide_offered and not field_guide_hint_given} [I'd like that ops manual you mentioned]
    -> request_field_guide
```

**Item Delivery**
```ink
=== request_field_guide ===
~ field_guide_hint_given = true
#set_variable:field_guide_requested:true
#give-item:safetynet_field_guide_workstation

I'm uploading the ops manual to your secure terminal right now.
...
```

## Next Steps: Recompilation

The Ink source file has been updated and **must be recompiled** to JSON:

```bash
cd scenarios/m01_first_contact/ink/
inklecate m01_phone_agent0x99.ink -o m01_phone_agent0x99.json
```

Or use the web compiler: https://www.inklestudios.com/ink/web-compiler/

See `INK_COMPILATION_REQUIRED.md` for detailed instructions.

## Testing Checklist

- [ ] Ink file compiled successfully to JSON
- [ ] m01_phone_agent0x99.json updated with field guide changes
- [ ] Find "My Passwords" in derek's office
- [ ] Agent 0x99 sends password list message
- [ ] Agent 0x99 sends field guide offer message (3 sec later)
- [ ] Phone conversation shows new dialogue option
- [ ] Selecting option triggers #give-item
- [ ] Item appears in player inventory
- [ ] Opening item displays field guide Markdown
- [ ] Field guide is readable and navigable
- [ ] All technical content is accurate and clear

## Design Decisions

### Direct Item Delivery (via Ink #give-item)
- **Why**: Cleaner UX than requiring player to navigate to server room
- **Effect**: Player gets guide immediately when they request it
- **Alternative**: Could still keep item in server room for physical discovery

### Three-part Messaging Sequence
- **Password list found** → Confirmation message
- **3-second delay** → Field guide offer
- **Player requests** → Dialogue choice + item delivery
- **Why**: Gives player time to process before offering help; doesn't force guide on them

### In-Universe Framing
- Written as Agent 0x99 brief (SAFETYNET operational manual)
- Not educational; fully tactical and mission-focused
- References in-game terminology (derek, shatter, ENTROPY, Kali, etc.)
- Maintains game narrative integrity

### Content Organization
- Main 6 game hints (delivery-point focused) in main directory
- 12 comprehensive learning materials in archive_reference/
- Keeps game context separate from academic learning

## What Players Get

When players request the field guide, they receive a comprehensive tactical manual including:

- **Environment Overview** — Kali system, target network, SSH basics
- **Essential Commands** — pwd, ls, cd, cat, man, grep, echo
- **Hydra Bruteforce** — Complete syntax, wordlist selection, success indicators
- **SSH Remote Access** — Connection, fingerprint verification, basic use
- **Privilege Escalation** — Sudo usage, accessing other accounts
- **Critical File Locations** — Where flags and intelligence are stored
- **Complete Attack Sequence** — Step-by-step mission execution
- **Troubleshooting Guide** — Common problems and solutions
- **Quick Reference** — Essential commands at a glance

Total: ~300 lines of focused operational guidance.

## Impact on Player Experience

### Before Integration
- Players see hints gradually (6 fragmented dialog options)
- Field guide not available
- Player must figure things out or repeatedly ask for help

### After Integration
- Natural story moment when password list triggers offer
- Player can request comprehensive guide via phone
- Guide delivered directly to inventory
- Player can reference anytime while in server room
- Reduces dialog prompts needed for technical help
- Maintains agency (player chooses whether to use guide)

## Files Location Reference

```
scenarios/m01_first_contact/
├── scenario.json.erb (Modified - events & items)
├── lab_sheet/
│   ├── SAFETYNET_FIELD_GUIDE_Linux_SSH_Bruteforce.md (Created)
│   ├── archive_reference/ (Created - old hints archived)
│   │   └── [12 learning-focused hint files]
│   └── 1_intro_linux.md (Original - still available)
├── ink/
│   ├── m01_phone_agent0x99.ink (Modified - awaiting recompilation)
│   ├── m01_phone_agent0x99.json (NEEDS RECOMPILATION)
│   └── [other ink files unchanged]
├── INK_COMPILATION_REQUIRED.md (Created)
├── INTEGRATION_NOTES_Field_Guide.md (Created)
└── FIELD_GUIDE_INTEGRATION_SUMMARY.md (This file)
```

---

**Status**: ✅ Complete (awaiting Ink JSON recompilation)

Once the Ink file is recompiled to JSON, the field guide integration is fully live.
