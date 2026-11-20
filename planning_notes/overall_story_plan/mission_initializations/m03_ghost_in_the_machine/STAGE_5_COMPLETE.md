# Mission 3: "Ghost in the Machine" - Stage 5 Complete

**Mission ID:** m03_ghost_in_the_machine
**Title:** Ghost in the Machine
**Stage:** 5 - Room Layout and Challenge Distribution
**Date Completed:** 2025-12-27
**Status:** ✅ COMPLETE

---

## Stage 5 Deliverables Summary

**Total Documents Created:** 1 comprehensive design document

### Document: Room Design (`room_design.md`)
**Size:** ~940 lines
**Status:** ✅ Complete, ready for implementation

**Contents:**
- Location overview (WhiteHat Security Services)
- 7 detailed room designs with dimensions, containers, NPCs
- ASCII map showing room connections
- Progressive unlocking flow (5 stages)
- Lock variety analysis (5 types, 7 locks)
- Container summary (7 containers)
- NPC placement (4 NPCs)
- Hybrid architecture integration
- Technical validation (all compliant)
- Design notes (pacing, difficulty, atmosphere)

---

## Room Layout Summary

### WhiteHat Security Services Office

**Location Type:** Corporate Security Consulting Firm
**Total Rooms:** 7
**Layout Pattern:** Hub-and-spoke (central hallway with branches)
**Time Phases:** Daytime (Act 1) → Nighttime (Act 2-3)
**Security Level:** Medium (RFID locks, guard patrol)

### Room Inventory

| # | Room Name | ID | Dimensions | Type | Act | Critical Path |
|---|-----------|----|-----------| -----|-----|---------------|
| 1 | Reception Lobby | `reception_lobby` | 8×6 GU | Entrance | 1-3 | Entry point |
| 2 | Conference Room | `conference_room_01` | 10×8 GU | Meeting | 1 | RFID cloning |
| 3 | Main Hallway | `main_hallway` | 12×4 GU | Corridor | 1-3 | Navigation, guard patrol |
| 4 | Server Room | `server_room` | 10×10 GU | IT/Data Center | 2-3 | **PRIMARY HUB** |
| 5 | Executive Wing Hallway | `executive_wing_hallway` | 8×4 GU | Corridor | 1-3 | Connector |
| 6 | Executive Office | `executive_office` | 10×8 GU | Private Office | 2-3 | Optional evidence |
| 7 | James's Office | `james_office` | 8×6 GU | Consultant Office | 2 | Optional moral choice |

**Total Usable Space:** 464 GU² across all rooms
**All Rooms Compliant:** ✅ 7/7 within 4×4 to 15×15 GU range

---

## Progressive Unlocking Achievement

### 5-Stage Unlocking Flow

**Stage 1: Mission Start (Daytime Act 1)**
- **Accessible:** Reception, Hallway, Conference Room (3 rooms)
- **Focus:** Victoria meeting, RFID cloning

**Stage 2: After clone_rfid_card (End Act 1)**
- **Unlocks:** Server Room via RFID keycard
- **Transition:** Daytime → Nighttime (time skip)

**Stage 3: Nighttime Infiltration Begins (Act 2 Start)**
- **New Challenge:** Night security guard patrol
- **Accessible:** All previous + Server Room interior
- **Still Locked:** Executive Office

**Stage 4: After access_victoria_computer**
- **Unlocks:** Executive Office (lockpicking OR high trust)
- **Access:** Victoria's workspace, LORE fragments
- **Backtracking:** Return to server room for CyberChef decoding

**Stage 5: After distcc_exploit (Midpoint Twist)**
- **Event-Unlocked:** Operational logs spawn
- **Revelation:** M2 hospital connection discovered
- **All Evidence:** Available for final synthesis

**Design Achievement:** ✅ Clear progression, strategic backtracking, no soft locks

---

## Lock Variety Achievement

### 5 Different Lock Types

| Lock Type | Count | Critical Path | Examples |
|-----------|-------|---------------|----------|
| **RFID Keycard** | 1 | YES | Server room door (clone from Victoria) |
| **Physical/Lockpicking** | 3 | NO | Executive office, filing cabinets |
| **PIN Codes** | 1 | NO | Server room safe (2010) |
| **Passwords** | 1 | Partial | Victoria's computer |
| **Hidden Items** | 1 | NO | USB drive in desk drawer |

**Total Locks:** 7 across 5 types
**Variety Score:** ✅ Excellent (5 types exceed 3-type minimum)

### Lock Progression

**Easy → Medium → Hard:**
1. Founding year clue (2010) - Easy, visible
2. RFID cloning - Medium, new mechanic
3. Lockpicking - Easy-Medium, skill-based
4. Password finding - Medium, investigation
5. Hidden USB - Easy, thorough search

**Validation:**
- ✅ Multiple lock types (not repetitive)
- ✅ Discoverable hints (founding year plaque)
- ✅ New mechanic introduced (RFID cloning)
- ✅ Supports multiple playstyles (stealth, social, technical)

---

## Container and Object Placement

### Containers Summary

**Total Containers:** 7
- **Critical Path:** 2 (Victoria's computer required)
- **Optional LORE:** 3 (filing cabinets, safe, USB)
- **Flavor/Atmosphere:** 2 (reception desk, display case)

**Distribution:**
- Reception Lobby: 2 containers
- Server Room: 2 containers (filing cabinet, safe)
- Executive Office: 2 containers (filing cabinet, desk drawer)
- James's Office: 1 container (desk drawer)

**Lock Distribution:**
- Unlocked: 3 containers
- Physical locks: 3 containers
- PIN lock: 1 container

### Interactive Objects

**Total Interactive Objects:** 10
- **VM/Technical:** 3 (VM terminal, CyberChef, drop-site terminal)
- **Evidence:** 3 (whiteboard, computers, USB drive)
- **Atmosphere:** 4 (founding plaque, family photo, certifications, display case)

**Server Room Objects (Investigation Hub):**
1. VM Access Terminal (2, 4)
2. CyberChef Workstation (6, 4)
3. Drop-Site Terminal (4, 4)
4. Whiteboard with ROT13 (4, 7)
5. Filing cabinet (1, 7)
6. Wall safe (7, 7)

**Design Achievement:** ✅ Clear purpose for each object, narrative justification

---

## NPC Placement Achievement

### 4 NPCs Across 3 Modes

| NPC | Mode | Room | Position/Route | Phase |
|-----|------|------|----------------|-------|
| Receptionist | In-Person | Reception Lobby | (3, 2) desk | Daytime only |
| Victoria Sterling | In-Person | Conference Room | (4, 3) table | Daytime only |
| Night Security Guard | Patrol | Main Hallway + Reception | 4 waypoints, 60s loop | Nighttime only |
| Agent 0x99 | Phone/Event | Remote | N/A | All phases |

**Guard Patrol Design:**
- **Waypoint 1:** Reception (3, 2) - 15 tick pause
- **Waypoint 2:** Main Hallway (2, 1) - 15 tick pause
- **Waypoint 3:** Main Hallway (6, 1) - 15 tick pause
- **Waypoint 4:** Main Hallway (9, 1) near server - 20 tick pause
- **Loop Time:** ~60 seconds
- **Detection:** 150px LOS, 120° cone

**Phase Transition:**
- **Daytime NPCs:** Receptionist + Victoria (professional atmosphere)
- **Nighttime NPCs:** Guard only (tension, stealth challenge)
- **Phone Constant:** Agent 0x99 (handler support)

**Design Achievement:** ✅ Conditional spawning, atmosphere transformation, stealth challenge

---

## Hybrid Architecture Integration

### VM Challenges (4 flags)

**Location:** Server Room VM Terminal (2, 4)
**Network:** 192.168.100.0/24 (Zero Day training network)

| Challenge | Tool | Flag | Difficulty |
|-----------|------|------|------------|
| Port Scanning | nmap | `flag{network_scan_complete}` | Easy |
| Banner Grabbing | netcat | `flag{ftp_intel_gathered}` | Easy |
| HTTP Analysis | curl + Base64 | `flag{pricing_intel_decoded}` | Medium |
| distcc Exploitation | Metasploit | `flag{distcc_legacy_compromised}` | Advanced |

**Submission:** Drop-site terminal (4, 4) in server room

### CyberChef Decoding (3 tasks)

**Location:** Server Room CyberChef Workstation (6, 4)

| Task | Input | Encoding | Output |
|------|-------|----------|--------|
| Whiteboard | ROT13 text | ROT13 | "MEET WITH THE ARCHITECT..." |
| Client Roster | Hex file | Hex | Zero Day client list |
| USB Drive | Double-encoded | Base64+ROT13 | Architect's directive |

### Correlation Tasks (2 critical)

| Task | VM Component | In-Game Component | Result |
|------|--------------|-------------------|--------|
| `http_analysis` | HTTP fetch | CyberChef Base64 | Pricing intelligence |
| `find_operational_logs` | distcc exploit | Spawned file | M2 hospital connection |

**Design Achievement:** ✅ VM and in-game tightly integrated, backtracking required, correlation meaningful

---

## Design Notes Achievement

### Pacing Design

**Act 1 (15-25 min):**
- Limited exploration (3 rooms)
- Social focus (Victoria meeting)
- Calm → Building tension

**Act 2 (30-40 min):**
- Full exploration (7 rooms)
- Investigation focus (VM + evidence)
- Hub-and-spoke (server room central)
- Tense infiltration rhythm

**Act 3 (10-15 min):**
- Evidence synthesis
- Moral choices
- Climax → Resolution

### Difficulty Curve

**Easy Start:** Reception, Victoria meeting, founding year clue
**Medium Progression:** RFID cloning, guard stealth, VM port scanning
**Hard Challenges:** distcc exploitation, password finding, hex decoding
**Expert Optional:** Double-encoding, perfect stealth, all LORE

### Atmosphere Transformation

**Daytime Corporate Facade:**
- Bright, professional, NPCs present
- Legitimate business appearance
- Calm audio/music

**Nighttime Infiltration:**
- Dark, emergency lighting, shadows
- Empty except guard
- HVAC hum, tension music
- **Same spaces, completely different feel**

**Design Achievement:** ✅ Dual-phase design creates variety, atmosphere supports narrative

---

## Technical Validation Summary

### Room Dimensions Compliance

- ✅ All rooms within 4×4 to 15×15 GU range (7/7)
- ✅ Usable space correctly calculated (dimensions - 2 GU)
- ✅ No oversized or undersized rooms

### Placement Compliance

- ✅ All containers in usable space (not padding)
- ✅ All NPCs in usable space
- ✅ All interactive objects in usable space
- ✅ Doors at room edges (padding zone)
- ✅ No items in 1 GU padding zone

### Connection Compliance

- ✅ All room connections have ≥ 1 GU overlap
- ✅ Door positions specified
- ✅ Locked doors have unlock conditions
- ✅ No circular dependencies

### Progression Validation

- ✅ No soft locks (can't make progress impossible)
- ✅ Clear critical path (Reception → Conference → Server Room)
- ✅ Optional content accessible but not blocking
- ✅ Backtracking intentional and meaningful

**All Technical Criteria Met:** ✅ 100% compliant

---

## Integration with Previous Stages

### Stage 0 (Technical Challenges) → Room Placement

**VM Challenges:**
- ✅ All 4 VM challenges → Server Room VM terminal
- ✅ Flag submission → Drop-site terminal
- ✅ Network 192.168.100.0/24 specified

**In-Game Challenges:**
- ✅ RFID cloning → Conference Room (Victoria proximity)
- ✅ Lockpicking → Executive office, filing cabinets
- ✅ Multi-encoding → CyberChef workstation (server room)
- ✅ Guard stealth → Main hallway patrol

**All Stage 0 challenges placed:** ✅

### Stage 1 (Narrative Structure) → Acts Mapped

**Act 1 Scenes → Rooms:**
- Scene 1 (Briefing) → Not in-game (cutscene)
- Scene 2 (Arrival) → Reception Lobby
- Scene 3 (Victoria meeting) → Conference Room
- Scene 5 (Extraction) → Outside (transition)

**Act 2 Scenes → Rooms:**
- Scene 6 (Infiltration) → Reception → Hallway
- Scene 7 (Server room) → Server Room (hub)
- Scenes 8-11 (Investigation) → All rooms (evidence gathering)

**Act 3 Scenes → Rooms:**
- Scene 12 (James choice) → James's Office (optional)
- Scene 13 (Victoria confrontation) → Executive Office OR Hallway
- Scene 14 (Exfiltration) → Exit

**All narrative scenes have locations:** ✅

### Stage 2 (Characters) → NPC Positions

**NPCs Placed:**
- ✅ Victoria Sterling → Conference Room (daytime)
- ✅ James Park → James's Office (evidence only, not present)
- ✅ Guard → Main Hallway patrol (nighttime)
- ✅ Agent 0x99 → Phone/remote (handler)

**Environmental storytelling:**
- ✅ Family photos (James's Office)
- ✅ Certifications (Reception, James's Office)
- ✅ Corporate achievements (hallways)

### Stage 3 (Moral Choices) → Choice Locations

**James's Protection Choice:**
- ✅ Discovery location: James's Office
- ✅ Evidence: Performance review, family photo, certifications
- ✅ Choice trigger: james_innocence_confirmed

**Victoria's Fate Choice:**
- ✅ Confrontation location: Executive Office OR Hallway (player choice)
- ✅ Evidence: All gathered from server room + executive office
- ✅ Choice trigger: all_evidence_collected

### Stage 4 (Objectives) → Room Mapping

**All 17 tasks mapped to rooms:**
- ✅ Aim 1.1 tasks (2) → Conference Room
- ✅ Aim 1.2 tasks (4) → Server Room
- ✅ Aim 1.3 tasks (4) → Server Room + Executive Office
- ✅ Optional LORE (3) → Server Room + Executive Office
- ✅ Optional stealth (1) → Main Hallway (guard patrol)
- ✅ Optional moral (2) → James's Office + Executive Office
- ✅ Perfect Stealth (1) → Guard avoidance

**All objectives have room locations:** ✅

---

## Next Steps: Stages 6-9

**Stage 5 provides to Stage 6 (LORE Fragments):**
- 3 LORE fragment locations specified
- Container details for each fragment
- Unlock conditions (safe PIN, lockpicking, hidden search)

**Stage 5 provides to Stage 7 (Ink Scripting):**
- NPC positions and dialogue trigger locations
- Container interactions (what happens when opened)
- Terminal locations (VM, drop-site, CyberChef)
- Event triggers (distcc_exploit → M2 revelation)

**Stage 5 provides to Stage 9 (Scenario Assembly):**
- Complete room dimensions and connections
- Container placement with contents
- NPC spawn conditions (daytime/nighttime)
- Progressive unlocking logic
- Technical validation (ready for JSON)

---

## Git Commit Summary

**Commits for Stage 5:**
1. afa47e1 - Part 1: First 3 rooms (Reception, Conference, Hallway)
2. 6b9f4c8 - Part 2: Server room (primary investigation hub)
3. de65cea - Part 3: Executive wing (hallway + office)
4. 4d7857f - Part 4: Final room (James's Office) + ASCII map
5. ea56097 - Part 5: Progressive unlocking + lock analysis
6. 6efceff - Part 6: Final summaries (containers, NPCs, validation)

**Total Lines Added:** ~940 lines (room_design.md)

---

## Stage 5 Completion Metrics

### Documentation
- **Room Design Document:** ~940 lines, 12 major sections
- **Completion Summary:** This document

### Rooms Designed
- **Total Rooms:** 7
- **Critical Path:** 4 (Reception, Conference, Hallway, Server Room)
- **Optional:** 3 (Executive Wing Hallway, Executive Office, James's Office)

### Objects Placed
- **Containers:** 7 (2 flavor, 5 objectives)
- **Interactive Objects:** 10 (3 terminals, 7 evidence/atmosphere)
- **NPCs:** 4 (2 daytime, 1 nighttime, 1 remote)
- **Locks:** 7 across 5 types

### Integration Points
- **Stage 0 (Technical):** ✅ All challenges placed
- **Stage 1 (Narrative):** ✅ All scenes have locations
- **Stage 2 (Characters):** ✅ All NPCs positioned
- **Stage 3 (Moral Choices):** ✅ Choice locations specified
- **Stage 4 (Objectives):** ✅ All 17 tasks mapped to rooms
- **Stage 6 (LORE):** Ready to receive fragment details
- **Stage 7 (Ink):** Ready to receive NPC positions and triggers
- **Stage 9 (Assembly):** Ready for JSON conversion

### Technical Compliance
- ✅ All rooms within dimension limits (4×4 to 15×15 GU)
- ✅ All items in usable space (not padding)
- ✅ All connections valid (≥ 1 GU overlap)
- ✅ No circular dependencies
- ✅ Progressive unlocking designed
- ✅ Lock variety achieved (5 types)

---

**Stage 5 Status:** ✅ **COMPLETE**

**Mission 3 Progress:**
- ✅ Stage 0: Scenario Initialization (4 documents, ~2,900 lines)
- ✅ Stage 1: Narrative Structure (1 document, 1,546 lines)
- ✅ Stage 2: Storytelling Elements (2 documents, ~2,000 lines)
- ✅ Stage 3: Moral Choices (1 document, ~630 lines)
- ✅ Stage 4: Player Objectives (2 documents, ~770 lines)
- ✅ Stage 5: Room Layout Design (1 document, ~940 lines)
- 🔄 Stage 6: LORE Fragments (Next)
- ⏳ Stages 7-9: Ink scripting, review, assembly

**Total Mission 3 Planning Documentation:** ~9,800 lines across 12 documents

---

**Mission 3 "Ghost in the Machine" - Where every room supports the story, and space transforms from corporate facade to tense infiltration.**
