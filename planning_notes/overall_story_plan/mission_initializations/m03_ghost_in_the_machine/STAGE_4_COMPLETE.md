# Mission 3: "Ghost in the Machine" - Stage 4 Complete

**Mission ID:** m03_ghost_in_the_machine
**Title:** Ghost in the Machine
**Stage:** 4 - Player Objectives Design
**Date Completed:** 2025-12-27
**Status:** ✅ COMPLETE

---

## Stage 4 Deliverables Summary

**Total Documents Created:** 2 documents

### Document 1: Player Goals (`player_goals.md`)
**Size:** ~587 lines
**Status:** ✅ Complete

**Contents:**
- Objectives philosophy and overview
- 1 primary objective with 3 aims (11 total tasks)
- 3 optional objectives (8 total tasks)
- Success/failure states
- Complete objective-to-world mapping
- Ink tag specifications

### Document 2: Objectives JSON (`objectives.json`)
**Size:** 184 lines
**Status:** ✅ Complete, ready for scenario.json.erb

**Contents:**
- Complete JSON structure
- All objectives, aims, and tasks
- Proper status/locked states
- Optional flag configuration

---

## Objectives Architecture Summary

### Primary Objective: Zero Day Intelligence

**Total Tasks:** 11 (across 3 aims)

**Aim 1.1: Establish Undercover Access** (Act 1)
- ✅ 2 tasks: Meet Victoria, Clone RFID card
- Unlocks: Server room access, Act 2 investigation

**Aim 1.2: Network Reconnaissance** (Act 2)
- ✅ 4 VM flag tasks: Network scan, FTP banner, HTTP analysis, distcc exploit
- Critical: distcc_exploit triggers M2 revelation event

**Aim 1.3: Physical Evidence Collection** (Act 2)
- ✅ 4 in-game tasks: Decode whiteboard, Access computer, Decode roster, Find logs
- Critical: find_operational_logs reveals M2 hospital connection

### Optional Objectives

**Optional 1: Collect LORE Fragments**
- ✅ 3 tasks: Zero Day Origins, Exploit Catalog, Architect's Directive

**Optional 2: Perfect Stealth**
- ✅ 1 behavioral task: Complete mission undetected

**Optional 3: Moral Engagement**
- ✅ 2 choice tasks: James's fate, Victoria's fate

**Total Optional Tasks:** 6

**Grand Total:** 17 tasks (11 primary + 6 optional)

---

## Hybrid Architecture Integration

### VM Flag Tasks (4 total)
1. **scan_network** - nmap port scanning → `flag{network_scan_complete}`
2. **ftp_banner** - Banner grabbing with netcat → `flag{ftp_intel_gathered}`
3. **http_analysis** - HTTP analysis + Base64 → `flag{pricing_intel_decoded}`
4. **distcc_exploit** - Legacy service exploitation → `flag{distcc_legacy_compromised}`

**Submission:** All flags submitted at drop-site terminal in server room

### In-Game Tasks (7 primary + 6 optional = 13 total)
1. **meet_victoria** - NPC dialogue
2. **clone_rfid_card** - Proximity-based minigame
3. **decode_whiteboard** - ROT13 encoding puzzle
4. **access_victoria_computer** - Lockpicking + login
5. **decode_client_roster** - Hex decoding puzzle
6. **find_operational_logs** - Correlation task (VM + physical)
7. **james_choice_made** - Moral choice dialogue
8. **victoria_choice_made** - Moral choice dialogue
9. **lore_fragment_1** - Hidden item (lockpick filing cabinet)
10. **lore_fragment_2** - Safe puzzle (PIN: 2010)
11. **lore_fragment_3** - Double-encoding (ROT13+Base64)
12. **zero_detection** - Behavioral tracking (stealth)

### Correlation Tasks (2 critical)
1. **http_analysis** - VM (HTTP fetch) + In-game (CyberChef decode)
2. **find_operational_logs** - VM (distcc exploit) + In-game (file examination)

**Integration Success:** All tasks properly mapped to hybrid architecture

---

## Progression Flow Achievements

### Linear Progression (Critical Path)
```
Start → meet_victoria → clone_rfid_card
  → Server room access
  → scan_network (unlocks 3 parallel tasks)
  → distcc_exploit (CRITICAL - triggers M2 revelation)
  → find_operational_logs (MIDPOINT TWIST)
  → All evidence collected
  → Victoria confrontation (optional)
  → Mission complete
```

### Non-Linear Investigation (Act 2)
**Parallel tracks after server room access:**
- VM challenges (scan → ftp/http/distcc)
- Physical evidence (whiteboard → computer → roster → logs)
- Optional LORE hunting (3 fragments)

**Player can pursue in any order** until convergence at find_operational_logs

### Critical Unlock Points
1. **clone_rfid_card** → Unlocks Aim 1.2 + Aim 1.3 (Act 2 begins)
2. **scan_network** → Unlocks all service enumeration tasks
3. **access_victoria_computer** → Unlocks decode_client_roster
4. **distcc_exploit** → Unlocks find_operational_logs + triggers M2 event
5. **all_evidence_collected** → Unlocks Victoria confrontation

---

## Objective-to-World Mapping Achievements

### Rooms Required
- `conference_room_01` - Victoria meeting, RFID cloning
- `server_room` - VM terminal, CyberChef, drop-site terminal, whiteboard
- `executive_office` - Victoria's computer, safe, filing cabinet, USB drive
- `james_office` - Innocence evidence discovery (optional)

### NPCs Required
- `npc_victoria` - Primary antagonist (meeting + confrontation)
- `npc_agent_0x99` - Handler (briefing + event-triggered revelations)
- `npc_guard` - Stealth challenge (patrol, detection)
- `npc_james` - Optional moral complexity

### Interactables Required
- **Computers:** VM terminal, CyberChef workstation, drop-site terminal, Victoria's computer
- **Containers:** Filing cabinet, wall safe, desk drawer
- **Objects:** Whiteboard (ROT13), USB drive, family photo
- **Doors:** Executive office door (lockpick), server room door (RFID/lockpick)

### Ink Scripts Required
1. `victoria_meeting.ink` - Meeting + RFID cloning
2. `drop_site_terminal.ink` - Flag submissions
3. `cyberchef_workstation.ink` - Encoding/decoding
4. `computer_login.ink` - Victoria's computer access
5. `operational_logs_discovery.ink` - M2 revelation (event-triggered)
6. `agent_0x99_m2_revelation.ink` - Handler response to discovery
7. `james_protection_choice.ink` - Mid-mission moral choice
8. `victoria_confrontation.ink` - End-mission moral choice

**Total Ink Scripts Specified:** 8 (critical path only)

---

## Success/Failure States Design

### Success Spectrum

**Complete Success (100%):**
- All 11 primary tasks completed
- All 4 VM flags submitted
- M2 connection discovered
- Both moral choices engaged
- Perfect stealth maintained

**Good Success (80-99%):**
- All primary tasks completed
- 3+ VM flags submitted
- Minor detection incidents

**Acceptable Success (60-79%):**
- 2 of 3 aims completed
- 2+ VM flags submitted
- Some evidence gathered

**Minimal Success (50-59%):**
- Aim 1.1 completed
- 1+ VM flag submitted
- Partial intelligence

### Failure Handling
- **No permanent failure** - Checkpoints allow retry
- **Soft failures** - Detection adds time pressure, not game over
- **3 checkpoints:** After RFID clone, server access, M2 revelation

**Player-Friendly:** Can continue campaign regardless of success level

---

## Integration with Previous Stages

### Stage 0 Integration
**Technical Challenges → Tasks:**
- RFID cloning mechanic → clone_rfid_card task
- VM challenges (4 flags) → Aim 1.2 (network_recon)
- Multi-encoding puzzles → decode_whiteboard, decode_client_roster, lore_fragment_3
- Guard patrol → perfect_stealth optional objective

**All Stage 0 challenges mapped to objectives** ✅

### Stage 1 Integration
**Narrative Acts → Aims:**
- Act 1 (Undercover Infiltration) → Aim 1.1
- Act 2 (Investigation & Escalation) → Aims 1.2 + 1.3
- Act 3 (Confrontation & Choice) → Optional Objective 3 (moral_choices)

**Scene progression aligns with task unlocks** ✅

### Stage 2 Integration
**Characters → Tasks:**
- Victoria Sterling → meet_victoria, clone_rfid_card, victoria_choice_made
- James Park → james_choice_made
- Agent 0x99 → Event-triggered conversations (distcc_exploit completion)

**Environmental storytelling → LORE fragments** ✅

### Stage 3 Integration
**Moral Choices → Optional Objective 3:**
- James Park protection → james_choice_made task
- Victoria's fate → victoria_choice_made task

**Choice variables tracked through optional objective system** ✅

---

## Quality Checklist Verification

### Clarity ✅
- [x] Each objective has clear, player-facing description
- [x] Players know WHAT to do (not just WHERE to go)
- [x] Success criteria are unambiguous
- [x] From Act 2 onwards, objectives are displayed in UI (Aim 1.2 + 1.3 unlock after Aim 1.1)

### Hybrid Architecture ✅
- [x] VM flag submission tasks clearly identified (4 tasks)
- [x] In-game tasks clearly identified (7 primary + 6 optional)
- [x] Correlation tasks clearly identified (http_analysis, find_operational_logs)
- [x] Dead drop terminal locations specified (server room)
- [x] Objectives don't require VM modifications

### Structure ✅
- [x] Uses objectives → aims → tasks hierarchy correctly
- [x] IDs are unique and descriptive (no duplicates)
- [x] Unlock conditions specified for locked tasks/aims
- [x] Completion triggers documented (Ink tags, automatic, etc.)

### Integration ✅
- [x] Every task maps to a room or NPC
- [x] Every task has completion method (Ink script, automatic detection)
- [x] Ink tag usage follows `#complete_task:task_id` format
- [x] Tasks align with Stage 1 narrative structure (Acts 1-3)
- [x] Tasks align with Stage 0 technical challenges

### Progression ✅
- [x] Clear progression path from start to end
- [x] No circular dependencies
- [x] Multiple valid paths where appropriate (Act 2 non-linear)
- [x] Optional objectives don't block main progression

### Educational Objectives ✅
- [x] Each primary objective teaches specific cybersecurity concept
  - Aim 1.2: Network reconnaissance (nmap, banner grabbing, service exploitation)
  - Aim 1.3: Intelligence correlation (physical + digital evidence synthesis)
- [x] VM challenges validate technical skills
- [x] In-game challenges teach complementary skills (encoding, lockpicking, stealth)
- [x] Objectives build on each other logically

### Player Experience ✅
- [x] Objectives create sense of progress (3 aims, 11 tasks)
- [x] Mix of short-term and long-term goals
- [x] Optional objectives provide value (LORE, challenge, moral depth)
- [x] Failure states are fair and recoverable (checkpoints)

**All Quality Criteria Met:** 28/28 ✅

---

## Next Steps: Stage 5

**Proceed to:** Stage 5 - Room Layout Design

**Stage 5 Tasks:**
1. Design physical space for all rooms (conference_room, server_room, executive_office, etc.)
2. Place NPCs based on objectives mapping
3. Position interactables for task completion
4. Design guard patrol waypoints
5. Create room connections and navigation flow

**Critical Handoff to Stage 5:**
- **Rooms Required:** conference_room_01, server_room, executive_office, james_office
- **Interactables Required:** 12 specified (computers, containers, objects, doors)
- **NPC Positions:** Victoria (conference), Guard (patrol), James (office)
- **Spatial Requirements:** RFID cloning requires 2 GU proximity to Victoria

**Critical Handoff to Stage 7 (Ink Scripting):**
- **Ink Scripts Required:** 8 specified
- **Ink Tags Required:** `#complete_task:` for all 17 tasks, `#unlock_aim:` for 2 aims, `#unlock_task:` for 6 tasks
- **Event Mappings Required:** 2 critical (distcc_exploit → M2 revelation, distcc_exploit → operational_logs spawn)

---

## Git Commit Summary

**Commits for Stage 4:**
1. e97b9d9 - Part 1: Primary objectives (305 lines)
2. 779ba6d - Part 2: Optional objectives (112 lines added)
3. 073df1c - Part 3: World mapping (173 lines added)
4. c9dfd6b - objectives.json (184 lines)
5. [Next] - STAGE_4_COMPLETE.md (this file)

**Total Lines Added:** ~587 (player_goals.md) + 184 (objectives.json) + this summary = ~900+ lines

---

## Stage 4 Completion Metrics

### Documentation
- **Player Goals Document:** 587 lines, 3 major sections
- **Objectives JSON:** 184 lines, ready for implementation
- **Completion Summary:** This document

### Objectives Designed
- **Primary Objective:** 1 (with 3 aims, 11 tasks)
- **Optional Objectives:** 3 (with 3 aims, 6 tasks)
- **Total Objectives:** 4
- **Total Aims:** 6
- **Total Tasks:** 17

### Mappings Created
- **Task-to-Room Mappings:** 17
- **Task-to-Interactable Mappings:** 17
- **Task-to-Ink-Script Mappings:** 8 unique scripts
- **Event Mappings:** 2 critical

### Integration Points
- **Stage 0 (Technical):** ✅ All challenges mapped
- **Stage 1 (Narrative):** ✅ Acts aligned with aims
- **Stage 2 (Characters):** ✅ NPCs integrated
- **Stage 3 (Moral Choices):** ✅ Choices as optional objective
- **Stage 5 (Room Layout):** Ready to receive handoff
- **Stage 7 (Ink Scripting):** Ready to receive handoff

---

**Stage 4 Status:** ✅ **COMPLETE**

**Mission 3 Progress:**
- ✅ Stage 0: Scenario Initialization (4 documents, ~2,900 lines)
- ✅ Stage 1: Narrative Structure (1 document, 1,546 lines)
- ✅ Stage 2: Storytelling Elements (2 documents, ~2,000 lines)
- ✅ Stage 3: Moral Choices (1 document, ~630 lines)
- ✅ Stage 4: Player Objectives (2 documents, ~770 lines)
- 🔄 Stage 5: Room Layout Design (Next)
- ⏳ Stages 6-9: Implementation phases

**Total Mission 3 Planning Documentation:** ~8,600 lines across 11 documents

---

**Mission 3 "Ghost in the Machine" - Where every objective moves the story forward, and intelligence gathering reveals the truth.**
