---
title: "Field Guide Pacing Strategy — First Contact Mission"
description: "Documentation of how field guides are delivered to avoid interrupting player flow"
date: "2026-05-26"
---

# Field Guide Pacing Strategy

## The Problem We Solved

Initial fragmentation approach proposed 3 separate field guides:
1. SSH Credential Testing (Hydra)
2. Linux Navigation & File Operations
3. Privilege Escalation (Sudo)

**Issue**: Players discover password list and gain console access in the same continuous sequence. Delivering separate guides at each step would interrupt flow:
- Guide 1 arrives when password list found
- Player immediately opens Kali console
- Guide 2 arrives as they're opening terminal
- Players haven't used Hydra yet—this guide feels premature
- Context switching reduces immersion

## Solution: Combined Phase 1 Guide

**Single comprehensive field guide delivered at password list discovery:**

**`SAFETYNET_FIELD_GUIDE_SSH_Access_and_Linux_Basics.md`**
- Handler Note explains both credentials testing AND system exploration need
- Part A: SSH Credential Testing (Hydra)
  - What is Hydra and SSH
  - Wordlist strategy
  - Testing process step-by-step
  - Interpreting results
- Part B: Linux Navigation & File Exploration
  - Filesystem structure
  - Navigation commands (pwd, ls, cd)
  - File inspection (cat, grep)
  - Permission concepts
  - SSH connection and exploration sequence

**Why this works**:
- Players have password list in hand → naturally leads to "how do I use it?"
- Guide explains Hydra first (immediate need)
- Then covers Linux navigation (needed immediately after SSH success)
- Both concepts frame the same mission phase
- No interruptions between discovery and execution

## Delivery Flow

```
Player finds password list in Derek's office
                    ↓
Event triggers: password_list_found = true
                    ↓
3-second delay (narrative pause)
                    ↓
Agent 0x99 message arrives:
"That password list could be useful. Let me know if you want an ops manual."
                    ↓
field_guide_offered = true
                    ↓
Player opens phone, new dialogue option appears:
"I'd like that ops manual you mentioned"
                    ↓
field_guide_requested = true
                    ↓
#give_item:safetynet_field_guide_workstation
                    ↓
Player receives item in inventory
                    ↓
Player opens "SAFETYNET Ops Manual" when ready
                    ↓
Studies Hydra techniques while at Kali console
                    ↓
Tests passwords, gains SSH access to Desktop VM
                    ↓
Uses Linux navigation techniques to explore
                    ↓
No interruption—same reading session covers both skills needed
```

## Remaining Field Guides

### Future: Privilege Escalation Guide

**Trigger**: After successful SSH access, if/when player encounters:
- Permission denied errors
- Need to access restricted files
- Discovers sudo access available

**`SAFETYNET_FIELD_GUIDE_Privilege_Escalation.md`** (coming soon)
- Handler Note explains why escalation is needed
- Field Guide Extract covering:
  - What is sudo
  - Checking permissions (sudo -l)
  - Running commands as other users
  - Common escalation patterns
  - Troubleshooting access issues

**Pacing**: Delivered only when player needs it, not preemptively. This avoids information overload.

## Benefits of This Approach

1. **Natural Flow**: Information arrives when needed, not in arbitrary sequences
2. **Cognitive Load**: Players absorb 2 related skills in one reading, not 3 separate contexts
3. **Immersion**: No interruptions during critical action sequences
4. **Discovery**: Players still discover challenges before hints arrive (password list before Hydra guide)
5. **Reusability**: Combined guide teaches transferable skills (works across missions)

## Technical Implementation

**Guide File**:
- Location: `scenarios/m01_first_contact/lab_sheet/SAFETYNET_FIELD_GUIDE_SSH_Access_and_Linux_Basics.md`
- Size: ~14KB (reference document, not textbook)
- Format: Three-part SAFETYNET structure (Handler Note + Extract + Reference)

**Game Integration**:
- Item: `safetynet_field_guide_workstation` (lab-workstation type)
- Held by: Agent 0x99 (phone NPC)
- Delivery: Via dialogue choice after password list discovery
- Display: Readable markdown in lab viewer

**Ink Dialogue**:
- Choice unlocked when: `field_guide_offered` = true
- Knot: `request_field_guide` (sets `field_guide_requested` and gives item)

**Scenario Events**:
- Trigger 1: `password_list_found` (sets when My Passwords picked up)
- Trigger 2: Field guide offered message (3-second delay on password discovery)

## Testing Checklist

Before considering this flow complete:

- [ ] Player discovers password list in Derek's office
- [ ] "My Passwords" item added to inventory
- [ ] After 3 seconds, Agent 0x99 message appears
- [ ] Phone dialogue updates with new option
- [ ] Selecting option delivers field guide to inventory
- [ ] Field guide opens and displays correctly
- [ ] Contents are readable and well-formatted
- [ ] Player can complete Hydra bruteforce using guide
- [ ] Player can SSH in and navigate filesystem using guide
- [ ] No additional prompts/interruptions during this sequence
- [ ] Flow feels natural and immersive

## Future Improvements

1. **Additional Missions**: Apply this pacing strategy to later scenarios
2. **Progressive Complexity**: Start with combined basics, split into advanced guides only when needed
3. **Context Sensitivity**: Deliver escalation guide only if player actually encounters permission issues
4. **Templates**: Create field guide templates for common scenarios (reconnaissance, access, escalation)

---

**Document Version**: 1.0  
**Strategy Implemented**: 2026-05-26  
**Designer**: Z. Cliffe Schreuders  
**For**: Mission Content Creators and Game Designers
