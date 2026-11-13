# Mission 1: First Contact - Developer Handoff

**Status:** READY FOR IMPLEMENTATION (pending critical TODOs)
**Priority:** HIGH (First mission in Season 1)
**Difficulty:** Beginner
**Estimated Implementation Time:** 60-80 hours

---

## Quick Start

### What You're Building

Mission 1 introduces players to Break Escape through a corporate espionage scenario at Social Fabric, a social media company with a dark secret. Players learn basic mechanics while investigating CEO Derek Lawson's hidden surveillance backdoor.

### Core Files

1. **Scenario Assembly:** `scenarios/m01_first_contact.json.erb`
2. **Assembly Notes:** `planning_notes/.../09_assembly_notes.md` (THIS FILE'S COMPANION)
3. **Validation Report:** `planning_notes/.../08_validation_report.md`
4. **Ink Scripts:** `planning_notes/.../07_ink_scripts/*.ink` (9 files)

### Implementation Blockers (MUST FIX FIRST)

**CRITICAL - Cannot implement without these:**

1. **Compile Ink Scripts** (2-4 hours)
   - Compile all 9 .ink files to .json using Inky
   - Verify EXTERNAL variables
   - Test all diverts and choices
   - See: [09_assembly_notes.md#ink-script-compilation](09_assembly_notes.md#ink-script-compilation)

2. **Specify Room Dimensions** (4-8 hours)
   - Define exact GU dimensions for 7 rooms
   - Calculate usable space (dimension - 2 GU padding)
   - Update scenario.json.erb with final values
   - See: [09_assembly_notes.md#room-dimension-specifications](09_assembly_notes.md#room-dimension-specifications)

3. **Create Variable Reference** (2 hours)
   - Document all EXTERNAL variables game must provide
   - List all internal Ink variables
   - Standardize naming conventions
   - See: [09_assembly_notes.md#external-variables-reference](09_assembly_notes.md#external-variables-reference)

4. **Decide CyberChef Implementation** (1 hour)
   - Choose: Custom in-game UI vs. embedded web tool
   - Document UI/UX specifications
   - See: [09_assembly_notes.md#cyberchef-implementation-specification](09_assembly_notes.md#cyberchef-implementation-specification)

**Total prep time:** 10-16 hours before coding begins

---

## Mission Overview

### The Hook

Player goes undercover as a consultant at Social Fabric to investigate CEO Derek Lawson, who's allegedly building a surveillance network into his social media platform.

### Three-Act Structure

**Act 1: Infiltration (Tutorial)**
- Get visitor badge from receptionist Sarah
- Learn basic mechanics (conversation, inventory, movement)
- Establish cover story as "efficiency consultant"

**Act 2: Investigation (Challenges)**
- Social engineer IT admin Kevin for credentials
- Complete VM challenges (SSH brute force, Linux navigation, sudo escalation)
- Decode Base64 messages
- Search Derek's office for evidence
- Help data analyst Maya (optional moral choice)

**Act 3: Confrontation (Resolution)**
- Confront Derek with gathered evidence
- Choose final approach: Arrest, Recruit, or Expose
- Complete debrief with consequences

### Key Learning Objectives (CyBOK-Aligned)

- **Passwords & Authentication:** SSH brute force with Hydra
- **Access Control:** Linux permissions, sudo escalation
- **Social Engineering:** Information extraction from NPCs
- **Data Encoding:** Base64 decoding (encoding vs. encryption)
- **Physical Security:** Lock picking, RFID badge access
- **Intelligence Gathering:** Evidence collection, LORE fragments

---

## Technical Architecture

### Hybrid Workflow

**Social engineering (in-game) → VM technical challenges → Flag submission (in-game)**

```
Player talks to Kevin → Gets password hints
   ↓
Launches VM from in-game terminal
   ↓
Uses hints for Hydra brute force → Gets SSH access
   ↓
Navigates Linux filesystem → Finds flags
   ↓
Returns to game, submits flags at drop-site terminal
   ↓
Unlocks intelligence from Agent 0x99 → Next objective
```

**Why Hybrid?**
- Social context motivates technical challenges
- Flags become narrative intelligence (not just CTF points)
- Seamless integration between physical and digital investigation

### Room Layout

**7 Rooms (Hub-and-Spoke Design):**

1. **Reception Area** (Starting room)
   - NPC: Sarah (receptionist)
   - Item: Visitor badge (unlocks main office)

2. **Main Office** (Central hub)
   - NPCs: Kevin (IT admin), Maya (data analyst)
   - Containers: Multiple filing cabinets, desks
   - Connections: All other rooms accessible from here

3. **Derek's Office** (Locked - keycard required)
   - NPC: Derek Lawson (CEO)
   - Containers: Desk drawer, filing cabinet (password), safe (RFID)
   - Items: Whiteboard with Base64 message

4. **Server Room** (Locked - keycard required)
   - Interactive: Drop-site terminal (flag submission)
   - Interactive: VM launch terminal

5. **Conference Room** (Unlocked)
   - Minimal interactions (set dressing)

6. **Break Room** (Unlocked)
   - Items: Coffee supplies, casual conversations

7. **Storage Closet** (Locked - pickable)
   - Item: Lockpick (from Kevin)
   - LORE: Architect's Letter

### Progressive Unlocking

**No circular dependencies - validated in logical flow analysis:**

1. Talk to Sarah → Get visitor badge → Enter main office
2. Talk to Kevin → Get lockpick + keycard → Access storage closet + Derek's office + server room
3. Complete VM challenges → Submit flags → Unlock intelligence
4. Decode whiteboard → Get filing cabinet password → Access manifesto
5. Get RFID badge from Maya's desk → Unlock safe → Access backdoor analysis

---

## Objectives and Tasks

### 9 Aims, 20+ Tasks

**Full objective hierarchy in:** `scenarios/m01_first_contact.json.erb`

**Critical Path (Minimal Completion - 60%):**

1. Enter office
2. Get visitor badge
3. Talk to Kevin (social engineering)
4. Complete SSH brute force (VM)
5. Submit SSH flag
6. Get server room access
7. Confront Derek
8. Make final choice
9. Complete debrief

**Standard Completion (80%):** Critical path + decoding + 1 LORE fragment

**Perfect Completion (100%):** All tasks + all 3 LORE fragments + Maya protection + stealth maintained

---

## NPCs and Dialogue

### Character Roster

**Sarah (Receptionist)**
- Role: Gatekeeper, tutorial NPC
- Personality: Friendly but professional
- Key info: Provides visitor badge, office layout hints
- Ink script: `m01_npc_sarah.ink`

**Kevin (IT Admin)**
- Role: Social engineering target
- Personality: Casual tech bro, overconfident
- Key info: Password hints, lockpick, keycard
- Trust system: Higher trust = more info
- Ink script: `m01_npc_kevin.ink`

**Maya (Data Analyst)**
- Role: Whistleblower, moral choice
- Personality: Cautious, ethical, scared
- Key info: Backdoor concerns, client list intel
- Moral choice: Protect from retaliation or use as witness
- Ink script: `m01_npc_maya.ink`

**Derek Lawson (CEO)**
- Role: Primary antagonist
- Personality: Charismatic, idealistic extremist
- Philosophy: "Trust collapse" requires radical transparency (via surveillance)
- Ink script: `m01_npc_derek.ink`

**Agent 0x99 (Handler)**
- Role: Mission support (phone-only)
- Personality: Professional, encouraging
- Function: Tutorial guidance, event-triggered hints
- Ink script: `m01_phone_agent0x99.ink`

### Dialogue Constraints

**User-specified rules applied to all scripts:**

1. **Keep dialogue snappy:** Max 3 lines per character before player choice
2. **Speaker format:** Auto-detect for single NPC (no "Name:" prefix needed)
3. **Use hub patterns:** All conversations return to hub for multiple topics
4. **Branch on choices:** Every choice should affect trust, unlock info, or progress story

---

## Lock Systems

### 6 Lock Types Used

| Lock ID | Type | Location | Unlock Method |
|---------|------|----------|---------------|
| visitor_badge_lock | conversation | Main office door | Talk to Sarah |
| dereks_office_keycard_lock | keycard | Derek's office | Get Kevin's keycard |
| server_room_keycard_lock | keycard | Server room | Get Kevin's keycard (same) |
| storage_closet_pickable_lock | pickable | Storage closet | Use lockpick from Kevin |
| filing_cabinet_password | password | Derek's filing cabinet | Decode whiteboard → "MANIFESTO" |
| safe_rfid | rfid | Derek's safe | Use ZDS badge from Maya's desk |

**Progressive difficulty:** Conversation → Keycard → Lockpick → Password → RFID

---

## VM Integration

### SecGen Scenario

**Name:** "Introduction to Linux and Security lab"

**Challenges:**

1. **SSH Brute Force**
   - Tool: Hydra
   - Hints: From Kevin (username, password patterns)
   - Flag: `FLAG_SSH_BRUTE_FORCE_SUCCESS`
   - Completes: `submit_ssh_flag` task

2. **Linux Navigation**
   - Challenge: Find hidden files in filesystem
   - Commands: ls, cd, cat, find
   - Flag: `FLAG_LINUX_NAVIGATION_COMPLETE`
   - Completes: `submit_linux_flag` task

3. **Sudo Escalation**
   - Challenge: Exploit sudo misconfiguration
   - Technique: sudo -l, privilege escalation
   - Flag: `FLAG_SUDO_ESCALATION_ROOT`
   - Completes: `submit_sudo_flag` task

### Drop-Site Terminal

**Location:** Server room (requires keycard access)

**Function:** In-game terminal for submitting VM flags

**Ink script:** `m01_terminal_dropsite.ink`

**Workflow:**
```
Player: [Interacts with drop-site terminal]
Terminal: "Enter flag:"
Player: [Pastes FLAG_SSH_BRUTE_FORCE_SUCCESS]
Terminal: "✓ FLAG VERIFIED: SSH Access"
         "Intelligence unlocked: [Narrative context for flag]"
Game: #complete_task:submit_ssh_flag
Agent 0x99: [Event-triggered message with next guidance]
```

---

## LORE Fragments

### 3 Fragments (Beginner Difficulty)

**Fragment 1: Social Fabric Manifesto**
- Location: Derek's office, desk drawer (unlocked)
- Content: Derek's philosophical essay on "trust collapse"
- CyBOK: Malware & Attack Technologies (ideology-driven threats)

**Fragment 2: The Architect's Letter**
- Location: Storage closet (requires lockpick)
- Content: Letter from Derek to unknown "Architect" about backdoor implementation
- CyBOK: Network Security (unauthorized access)

**Fragment 3: Network Backdoor Analysis**
- Location: Derek's office, safe (requires RFID badge)
- Content: Technical analysis of surveillance backdoor code
- CyBOK: System Security (backdoor vulnerabilities)

**Design note:** All fragments accessible without complex puzzles (appropriate for Mission 1)

---

## Moral Choices and Consequences

### Choice Point 1: Maya's Protection (Act 2)

**Context:** Maya reveals she's scared of Derek's retaliation

**Options:**
- **Promise protection:** +influence with ENTROPY, Maya testifies willingly
- **Use her testimony anyway:** Evidence obtained but Maya at risk
- **Don't involve her:** Harder confrontation but Maya stays safe

**Impact:** Affects debrief dialogue, Maya's fate in campaign

### Choice Point 2: Derek Confrontation Strategy (Act 3)

**Context:** How to approach final confrontation

**Options:**
- **Observe and analyze:** Professional, gathers evidence first
- **Accuse directly:** Aggressive, may trigger defensive response
- **Empathize with ideology:** Understanding, may enable recruitment

**Impact:** Affects available final choices and Derek's response

### Choice Point 3: Derek's Fate (Act 3 Resolution)

**Context:** Final decision after confrontation

**Options:**
- **Arrest:** Traditional law enforcement, Derek goes to trial
- **Recruit:** Bring Derek into ENTROPY as a reformed asset
- **Expose:** Public whistleblowing, media scandal

**Impact:** Major campaign consequences:
- Arrest: Derek's allies become hostile in future missions
- Recruit: Derek provides intel but trust is fragile
- Expose: Public awareness increases but villains go underground

**Educational constraint:** Choices don't skip technical challenges (all players learn same skills)

---

## Testing Strategy

### Phase 1: Component Testing

**Test each system independently:**

- [ ] Ink dialogue scripts (load in Inky, test all branches)
- [ ] Lock systems (each unlock method)
- [ ] Room connections (verify no overlap, valid paths)
- [ ] Task completion triggers (Ink tags fire correctly)
- [ ] VM flag validation (correct flags accepted, wrong flags rejected)

### Phase 2: Integration Testing

**Test combined systems:**

- [ ] Hybrid workflow (VM → flag submission → task completion)
- [ ] Progressive unlocking (locks open in correct order)
- [ ] NPC trust variables (persist between conversations)
- [ ] Event-triggered dialogues (Agent 0x99 messages)
- [ ] EXTERNAL variables (game provides, Ink reads)

### Phase 3: Playthrough Testing

**Full mission paths:**

- [ ] Critical path (minimal completion - 60%)
- [ ] Standard path (80% completion)
- [ ] Perfect path (100% completion)
- [ ] Speedrun path (skip optional content)
- [ ] Chaos path (trigger alerts, fail stealth)

### Phase 4: Edge Case Testing

**Break the mission:**

- [ ] Submit wrong flags (should reject)
- [ ] Try to access locked rooms without keys (should block)
- [ ] Complete objectives out of order (should handle gracefully)
- [ ] Skip mandatory conversations (should be impossible)
- [ ] Exhaust all dialogue options (hub should still work)

---

## Asset Requirements Summary

**Full list in:** [09_assembly_notes.md#asset-requirements](09_assembly_notes.md#asset-requirements)

**Critical assets needed:**

- 7 room 3D models
- 4 NPC character models/sprites
- 15+ interactive object models (desks, cabinets, terminals, etc.)
- 3 custom UI interfaces (drop-site, CyberChef, phone)
- 10+ sound effects
- 4 music tracks (ambient, investigation, confrontation, success)

---

## Known Issues

**Full details in:** [09_assembly_notes.md#known-issues-and-workarounds](09_assembly_notes.md#known-issues-and-workarounds)

**Issues requiring decisions:**

1. **CyberChef Implementation:** Need to decide custom UI vs. embedded web tool
2. **Derek's Dialogue Depth:** May want to expand philosophical explanation by 1-2 exchanges
3. **Variable Naming:** Clarify `player_approach` vs. `confrontation_approach` (they're DIFFERENT variables)

**Validated non-issues:**

1. **Drop-site in locked room:** INTENTIONAL - player gets keycard before needing flags
2. **All LORE easily accessible:** INTENTIONAL - beginner mission design
3. **Hybrid workflow complexity:** VALIDATED - no circular dependencies

---

## Success Criteria

### Minimal Completion (60%)

- Player completes critical path
- At least 1 VM challenge completed
- Derek confronted with minimal evidence
- Final choice made
- Mission complete

### Standard Completion (80%)

- All VM challenges completed
- Base64 message decoded
- At least 1 LORE fragment found
- Kevin and Maya both engaged
- Derek confronted with substantial evidence

### Perfect Completion (100%)

- All VM challenges completed
- All LORE fragments found (3/3)
- Maya protected from retaliation
- No stealth alerts triggered
- Optimal Derek choice based on evidence
- All optional tasks completed

---

## Post-Implementation Checklist

### Before Marking Complete:

- [ ] All Ink scripts tested in Inky (no errors)
- [ ] All room dimensions finalized
- [ ] All coordinates specified
- [ ] ERB template processed and validated
- [ ] All assets integrated
- [ ] Full playthrough successful (all 3 paths)
- [ ] Performance acceptable (no lag)
- [ ] All EXTERNAL variables provided by game
- [ ] Variable reference document created
- [ ] CyberChef implementation complete
- [ ] QA pass completed
- [ ] Narrative content reviewed for consistency

---

## Questions for Development Team?

Contact the scenario design team if you need clarification on:

1. **Narrative intent:** Story beats, character motivations, dialogue tone
2. **Educational alignment:** CyBOK mappings, challenge difficulty
3. **Technical specifications:** Ink script patterns, lock systems, task triggers
4. **Design decisions:** Why certain choices were made, trade-offs considered

**Reference documents:**
- Planning stages 0-7: `planning_notes/.../m01_first_contact/`
- Validation report: `08_validation_report.md`
- Assembly notes: `09_assembly_notes.md`
- Scenario assembly: `scenarios/m01_first_contact.json.erb`

---

## Timeline Estimate

**Preparation (Critical TODOs):** 10-16 hours

**Implementation:**
- Room construction and layout: 8-10 hours
- NPC integration and Ink setup: 12-16 hours
- Lock systems and interactions: 8-10 hours
- VM integration and flag system: 6-8 hours
- CyberChef decoder: 8-12 hours
- Asset integration: 16-24 hours
- Testing and polish: 8-12 hours

**Total:** 60-80 hours (excluding asset creation time)

**Risk factors:**
- CyberChef custom UI may take longer if scope creeps
- Ink variable persistence may require debugging
- VM integration may need SecGen scenario adjustments

---

## Go/No-Go Decision

**Current Status:** GO for implementation

**Conditions met:**
✅ Logical flow validated (no soft locks)
✅ All objectives completable
✅ No circular dependencies
✅ Educational standards met
✅ Narrative quality approved
✅ Technical standards met (pending critical TODOs)

**Conditions pending:**
⚠️ Ink scripts compiled
⚠️ Room dimensions specified
⚠️ Variable reference created
⚠️ CyberChef implementation decided

**Recommendation:** Complete 4 critical TODOs (10-16 hours), then proceed to implementation.

---

**Ready to start building? Begin with critical TODOs, then implement in phases per 09_assembly_notes.md.**

**Good luck, and welcome to Break Escape Mission 1! 🎯**
