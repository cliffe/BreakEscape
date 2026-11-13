# Mission 5 "Insider Trading" - Stage 9: Scenario Assembly Complete

**Mission ID:** m05_insider_trading
**Stage:** 9 - Scenario Assembly
**Status:** ✅ COMPLETE
**Date:** 2026-01-03

---

## Files Created

### 1. scenario.json.erb (494 lines)
**Location:** `scenarios/m05_insider_trading/scenario.json.erb`

**Structure:**
- ERB helpers (Base64 encoding)
- Narrative content variables
- Global variables (25 variables for state tracking)
- 11 rooms with full NPC and object configurations
- 2 phone NPCs with event mappings

**Key Features:**
- **Progressive Unlocking:** Visitor badge → Employee badge → Research badge → Server password
- **Hybrid Architecture:** VM challenges integrated with in-game evidence gathering
- **Event-Driven Dialogue:** 11 event mappings for Agent 0x99 phone support
- **5 Ending Paths:** All tracked via global variables for closing debrief

### 2. mission.json
**Location:** `scenarios/m05_insider_trading/mission.json`

**Contents:**
- Mission metadata (title, description, difficulty 2, 5400s duration)
- ENTROPY cell: Insider Threat Initiative
- CyBOK areas: 5 knowledge areas
- Learning objectives: 5 objectives
- VM integration details (4 flags)
- Narrative summary (3-act structure)
- Key NPCs (6 characters)
- Moral complexity explanation
- Campaign positioning (Mission 5 of 10)

### 3. Supporting Documentation
- `ROOM_SUMMARY.md` - Quick reference for all 11 rooms
- `STAGE_9_SUMMARY.md` - This file

---

## Room Structure (11 Rooms)

| Room ID | Type | Lock | NPCs | Purpose |
|---------|------|------|------|---------|
| reception_lobby | room_reception | None | Opening briefing, Patricia | Starting point |
| main_corridor | hall_1x2gu | None | None | Central hub (6 connections) |
| break_room | room_office | None | Lisa Park | LORE Fragment 1 |
| conference_room | room_office | None | None | Evidence correlation, CyberChef |
| open_office_area | room_office | None | Kevin Park | Badge cloning, security logs |
| server_hallway | hall_1x2gu | employee_badge | None | Security checkpoint |
| server_room | room_servers | server_password | Drop-site terminal | VM access, flag submission |
| torres_office | room_office | office_keycard | David Torres | Medical bills, journal (evidence) |
| research_lab | room_office | research_badge | Dr. Chen | Optional high-level access |
| patricia_office | room_office | security_badge | Patricia Morgan | CSO office |
| data_center | room_servers | None | None | Final confrontation area |

---

## NPC Integration

### In-Person NPCs (6)
1. **Opening Briefing** (reception_lobby) - Timed cutscene, Agent 0x99
2. **Patricia Morgan** (reception_lobby → patricia_office)
   - Initial meeting, gives visitor badge
   - Moves to office after briefing
   - Ink: `m05_npc_patricia_morgan.json`

3. **Lisa Park** (break_room) - Optional
   - Marketing coordinator, humanizes Torres
   - Ink: `m05_npc_lisa_park.json`

4. **Kevin Park** (open_office_area)
   - IT admin, badge cloning target
   - Gives lockpick (influence >= 30)
   - Ink: `m05_npc_kevin_park.json`

5. **Dr. Chen** (research_lab)
   - Chief Scientist, research badge access
   - Emotional response to Torres accusation
   - Ink: `m05_npc_dr_chen.json`

6. **David Torres** (torres_office)
   - Primary antagonist, 5-ending confrontation
   - Ink: `m05_torres_confrontation.json`
   - Tag: `#hostile:david_torres` in combat path

### Phone NPCs (2)
1. **Agent 0x99 Handler** - 7 event mappings
   - Timed welcome message (5s delay)
   - Triggers on: lockpick, medical bills, journal, flags, evidence correlation
   - Ink: `m05_phone_agent_0x99.json`

2. **Closing Debrief Trigger** - 4 event mappings
   - Triggers on any ending: torres_turned, torres_arrested, torres_killed, entropy_program_exposed
   - Ink: `m05_closing_debrief.json`

### Terminal NPCs (1)
1. **Drop-Site Terminal** (server_room)
   - Flag submission interface (4 flags)
   - Ink: `m05_dropsite_terminal.json`

---

## Global Variables (25 variables)

### Player State
- `player_name`, `player_approach`, `mission_priority`
- `knows_full_stakes`, `knows_insider_profile`
- `handler_trust` (0-100 scale)

### Investigation Progress
- `objectives_completed`, `lore_collected`, `evidence_level`

### Evidence Flags
- `found_medical_bills`, `found_torres_journal`, `found_briefcase_comms`
- `flag1_submitted` through `flag4_submitted`
- `bludit_server_discovered`, `traversal_files_found`, `root_access_achieved`, `architect_approval_confirmed`

### Outcome Tracking
- `torres_identified`, `torres_turned`, `torres_arrested`, `torres_killed`
- `elena_treatment_funded`, `entropy_program_exposed`
- `final_choice` (string: turn_double_agent, arrest, combat_nonlethal, combat_lethal, public_exposure)

---

## Evidence System

### Physical Evidence (In-Game)
1. **Medical Bills** (torres_office) - Sets `found_medical_bills = true`
2. **Personal Journal** (torres_office) - Sets `found_torres_journal = true`
3. **Briefcase Comms** (torres_office, lockpick required) - Sets `found_briefcase_comms = true`

### Digital Evidence (VM)
1. **Flag 1:** Reconnaissance - Bludit server discovered
2. **Flag 2:** File System Access - Payment records ($45K to Torres)
3. **Flag 3:** Privilege Escalation - Recruitment timeline (3 months)
4. **Flag 4:** Architect Communications - **CRITICAL** - Casualty projections (12-40 officers), $68M revenue

### Correlation
- When `evidence_level >= 4`: Can identify Torres at evidence board
- Triggers `#complete_task:correlate_evidence`
- Sets `torres_identified = true`
- Unlocks confrontation

---

## Progressive Unlocking Flow

### Stage 1: Arrival (Visitor Access)
- Reception lobby (open)
- Main corridor (unlocked after check-in)
- Break room, Conference room (visitor badge sufficient)

### Stage 2: Employee Areas (Badge Clone Required)
- Clone employee badge from Kevin Park (influence >= 20)
- Access server hallway
- Find server password ("Heisenberg2024" from Torres' notes)

### Stage 3: Restricted Research (Optional)
- Build trust with Dr. Chen (trust >= 40)
- Obtain research badge
- Access research laboratory

### Stage 4: Server Access (Evidence Gathering)
- Enter server room with password
- Complete VM challenges (4 flags)
- Submit flags at drop-site terminal
- `evidence_level` increases with each flag

### Stage 5: Confrontation (Evidence >= 4)
- Correlate evidence at conference room
- Identify David Torres
- Access Torres' office (keycard or lockpick)
- Confront Torres with 5 choices

---

## 5 Ending Paths

### 1. Turn Double Agent (S-Rank)
- Variable: `torres_turned = true`, `elena_treatment_funded = true`
- Campaign Impact: Torres provides intelligence through Mission 10
- 23 active placements exposed, 47 targets warned
- Elena gets treatment, kids protected

### 2. Arrest with Cooperation
- Variable: `torres_arrested = true`, `elena_treatment_funded = true`
- Campaign Impact: Partial intelligence (some placements identified)
- 5-10 years prison (reduced sentence)
- Elena gets treatment

### 3. Arrest without Cooperation
- Variable: `torres_arrested = true`, `elena_treatment_funded = false`
- Campaign Impact: Lost intelligence opportunities
- 15-25 years prison
- Elena dies, kids orphaned

### 4. Combat - Non-Lethal
- Variable: `torres_killed = false` (subdued)
- Campaign Impact: Similar to arrest without cooperation
- Torres subdued, arrested
- Family suffers

### 5. Combat - Lethal
- Variable: `torres_killed = true`
- Campaign Impact: Lost all intelligence
- Elena widowed, still dying
- Kids (Sofia 11, Miguel 8) orphaned
- Tag: `#hostile:david_torres` set before combat

### 6. Public Exposure
- Variable: `entropy_program_exposed = true`
- Campaign Impact: ENTROPY's Insider Threat Initiative burned
- All 47 targets warned, 23 placements compromised
- Torres becomes "The Quantum Traitor" publicly
- ENTROPY will retaliate in future missions

---

## Ink Scripts Integration

All 9 compiled Ink scripts referenced in scenario.json.erb:

1. `m05_insider_trading_opening.json` - Opening briefing cutscene
2. `m05_npc_patricia_morgan.json` - CSO dialogue
3. `m05_npc_kevin_park.json` - IT admin dialogue
4. `m05_npc_dr_chen.json` - Chief Scientist dialogue
5. `m05_npc_lisa_park.json` - Marketing coordinator dialogue
6. `m05_phone_agent_0x99.json` - Handler phone support
7. `m05_dropsite_terminal.json` - Flag submission terminal
8. `m05_torres_confrontation.json` - 5-ending confrontation
9. `m05_closing_debrief.json` - Reflects all choices

---

## Technical Compliance

### Room Types (All Valid)
- ✅ `room_reception` - Reception lobby
- ✅ `hall_1x2gu` - Corridors (main_corridor, server_hallway)
- ✅ `room_office` - Offices and common areas
- ✅ `room_servers` - Server room, data center

### Connections (All Valid)
- ✅ All connections use cardinal directions: north, south, east, west
- ✅ No diagonal directions used
- ✅ Bidirectional connections: Room A → north to B, Room B → south to A

### Lock Types (All Implemented)
- ✅ `badge` - Employee badge, research badge, security badge
- ✅ `password` - Server room password
- ✅ `keycard` - Torres office keycard
- ✅ `key` - Physical key locks (with keyPins for lockpicking)

### NPC Items (Proper Format)
- ✅ Items use `type` field (not `id`)
- ✅ Types match `#give_item` tag parameters exactly
- ✅ Example: `#give_item:visitor_badge` → item type: "visitor_badge"

---

## VM Integration Design

### Bludit CMS Server
**Vulnerability:** CVE-2019-16113 (Directory Traversal + Auth Bypass)

**Challenge Flow:**
1. **Reconnaissance** → Find Bludit CMS version, server details
2. **Directory Traversal** → Access restricted files, payment records
3. **Privilege Escalation** → Root access, recruitment timeline
4. **Intelligence Extraction** → Architect's approval with casualty projections

**Narrative Integration:**
- VM provides digital evidence (payment records, communications)
- In-game provides physical evidence (medical bills, journal)
- Correlation of both required to identify insider (evidence_level >= 4)

---

## Educational Value

### CyBOK Coverage
1. **Human Factors (HF)** - Social engineering, insider threat identification
2. **Security Operations (SO)** - Incident response, evidence correlation
3. **Applied Cryptography (AC)** - Quantum cryptography context
4. **Malware & Attack Technologies (MAT)** - Data exfiltration techniques
5. **Web & Mobile Security (WMS)** - CVE-2019-16113 exploitation

### Learning Objectives
1. Identify insider threat indicators (behavioral changes, unusual access patterns)
2. Correlate digital + physical evidence for investigation
3. Exploit real-world CVE for penetration testing
4. Navigate moral complexity with consequential decision-making
5. Understand systematic radicalization methodology

---

## Moral Complexity Implementation

### ENTROPY: Clearly Evil
- Systematic recruitment targeting vulnerable employees
- Calculate and approve 12-40 casualties as "acceptable"
- View Torres as "expendable asset"
- Accelerationist ideology justifies deaths

### Torres: Both Victim and Perpetrator
- **Victim:** Targeted due to medical debt ($380K for wife's cancer)
- **Victim:** Only 3 months into radicalization (early-stage, salvageable)
- **Perpetrator:** Knows his actions will kill 12-40 officers
- **Perpetrator:** Rationalized through extremist philosophy

### Player Agency
- 5 distinct endings with meaningful differences
- Turn path: De-radicalize Torres, save Elena, gain intelligence asset
- Arrest paths: Justice with/without compassion
- Combat paths: Tactical resolution vs fatal outcome
- Exposure path: Burn ENTROPY program, but destroy Torres family

### Campaign Impact
- **S-Rank (Turn):** 23 placements exposed, 47 targets saved, Torres intel through M10
- **Failed Intelligence:** Combat/Arrest without cooperation loses intelligence
- **Nuclear Option:** Public exposure cripples ENTROPY but invites retaliation

---

## Next Steps

### Immediate
- ✅ scenario.json.erb created (494 lines)
- ✅ mission.json created
- ✅ All Ink scripts compiled
- ✅ Stage 9 documentation complete

### Future (Implementation/Testing)
- Playtest scenario for balance and flow
- Test all 5 ending paths
- Verify progressive unlocking (no soft locks)
- Test VM flag submission triggers
- Validate event mappings for phone NPCs
- Test evidence correlation at evidence_level >= 4

### Integration with Campaign
- Mission 4 completion unlocks Mission 5
- Mission 5 choices affect Missions 6-10
- Torres as double agent (if turned) appears in later missions
- ENTROPY retaliation (if exposed) affects difficulty

---

**Stage 9 Status:** ✅ COMPLETE

**Ready for:** Playtesting → Integration Testing → Campaign Release

**Total Development Time:** Stages 0-9 complete over 2 sessions
**Total Content:** 2,298 lines Ink dialogue + 494 lines scenario structure
