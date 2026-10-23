---
title: "Field Guides — Organization & Use"
description: "Guide to structured field guide documents and format"
---

# SAFETYNET Field Guides

This directory contains structured field guide documents delivered to operatives during missions. They provide tactical knowledge at key mission moments.

## New Format

Field guides now follow the **SAFETYNET Field Guide Style Guide** (`docs/FIELD_GUIDE_style_guide.md`).

**Structure**:
1. **Handler Note from Agent 0x99** — Mission context (why you need this now)
2. **SAFETYNET Field Guide Extract** — Tactical knowledge (generic, transferable)
3. **Reference sections** — Commands, troubleshooting, common patterns

## Active Field Guides

### Mission 1: First Contact

| Guide | Purpose | Delivered When |
|-------|---------|-----------------|
| `SAFETYNET_FIELD_GUIDE_SSH_Access_and_Linux_Basics.md` | SSH credential testing with Hydra + Linux filesystem navigation | After player finds password list |
| `SAFETYNET_FIELD_GUIDE_Privilege_Escalation.md` | Sudo and privilege escalation via sudo | After SSH access is confirmed |
| `SAFETYNET_FIELD_GUIDE_Encoding_and_Decoding_with_CyberChef.md` | Rapid identification and decoding of Base64/ROT13 notes with CyberChef | When encoded notes become relevant |

## Archive

### Deprecated Documents

**`SAFETYNET_FIELD_GUIDE_Linux_SSH_Bruteforce.md`**
- Status: Archived (comprehensive but not structured)
- Superseded by: Separate topic guides, then combined into `SAFETYNET_FIELD_GUIDE_SSH_Access_and_Linux_Basics.md`
- Use for: Reference only
- Notes: Contains all content but doesn't follow new format; scenario-specific examples included

**`SAFETYNET_FIELD_GUIDE_SSH_Bruteforce.md`**
- Status: Archived (split from strategy decision)
- Superseded by: `SAFETYNET_FIELD_GUIDE_SSH_Access_and_Linux_Basics.md` (combined with Linux navigation)
- Use for: Reference on Hydra-specific techniques
- Notes: Combined with Linux basics to avoid interrupting player flow

**`archive_reference/`** 
- Collection of learning-focused hint materials
- For: Deep technical study outside game context
- Not: Mission delivery

## Creating New Field Guides

1. Read `docs/FIELD_GUIDE_style_guide.md` for full guidelines
2. Follow the three-part structure:
   - Handler note (Agent 0x99 explains the "why")
   - Field guide extract (tactical knowledge)
   - Reference sections (tables, commands, troubleshooting)
3. Adapt content from existing training materials
4. Generic examples, not scenario-specific details
5. Test that guide + discovery = mission completion
6. Keep example flows generic; avoid mission-specific worked paths

## Integration Points

### In Ink Dialogue (e.g., `m01_phone_agent0x99.ink`)

```ink
=== request_[guide_name] ===
~ [guide]_hint_given = true
#set_variable:[guide]_requested:true
#give_item:[guide_item_id]

[Agent 0x99's message explaining delivery]

+ [Thanks]
    -> support_hub
```

### In Scenario (e.g., `scenario.json.erb`)

```json
{
  "eventPattern": "item_picked_up:[key_intel]",
  "condition": "data.itemName === '[Key Intel Name]'",
  "onceOnly": true,
  "setGlobal": { "[guide]_offered": true },
  "sendTimedMessage": {
    "delay": 3000,
    "message": "[Handler note from Agent 0x99]"
  }
}
```

### In NPC Definition (e.g., Agent 0x99)

```json
"itemsHeld": [
  {
    "type": "[guide_item_id]",
    "name": "[Guide Title]",
    "takeable": true,
    "observations": "[Brief description of content]"
  }
]
```

## Quality Standards

Before considering a field guide complete:

- ✅ Handler note explains mission context and reminds the player's current aim (without narrative spoilers)
- ✅ Information is neither too vague nor too specific
- ✅ Technical sections provide enough detail for player success through application
- ✅ Examples are generic (no scenario-specific names/IPs)
- ✅ Worked examples do not reveal mission-specific filenames, account names, or exact outputs
- ✅ Troubleshooting covers likely failure points
- ✅ Source material is credited
- ✅ Tone is consistent (professional, direct, helpful)
- ✅ Content is 2-4 pages (reference, not textbook)

## File Naming Convention

```
SAFETYNET_FIELD_GUIDE_[Topic_Name].md
```

Examples:
- `SAFETYNET_FIELD_GUIDE_SSH_Bruteforce.md`
- `SAFETYNET_FIELD_GUIDE_Linux_Commands.md`
- `SAFETYNET_FIELD_GUIDE_Privilege_Escalation.md`
- `SAFETYNET_FIELD_GUIDE_Network_Scanning.md`

## Delivery Flow

```
Player discovers key intel
    ↓
Event mapping triggers
    ↓
Agent 0x99 sends handler note (timed message)
    ↓
"I've sent you a field guide" appears in dialogue
    ↓
Player requests it via phone dialogue
    ↓
Field guide item delivered to inventory
    ↓
Player opens and reads guide
    ↓
Player has knowledge to complete mission
```

## First Contact Mission: Complete

✅ **Phase 1**: SSH credential testing + Linux navigation  
✅ **Phase 2**: Privilege escalation  

All primary field guides for the infiltration sequence are now available.

## Future Guides (Other Missions)

### Advanced Topics (Future Missions)
- `SAFETYNET_FIELD_GUIDE_Network_Reconnaissance.md` — IP discovery, port scanning, service enumeration
- `SAFETYNET_FIELD_GUIDE_File_Transfer.md` — SCP, rsync, data exfiltration techniques
- `SAFETYNET_FIELD_GUIDE_Persistence.md` — Maintaining access, backdoors, account creation
- `SAFETYNET_FIELD_GUIDE_Log_Cleanup.md` — Covering tracks, log deletion/modification

### Infrastructure
- Template system for rapid field guide creation
- Automated delivery triggers based on specific discoveries
- Multi-stage hints with progressive detail levels

---

**Last Updated**: 2026-05-26  
**Format Version**: 1.0  
**For**: Mission Content Creators
