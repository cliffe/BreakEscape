# Stage 9 Implementation Roadmap

**Mission:** Mission 3 - Ghost in the Machine
**Purpose:** Step-by-step implementation guide for scenario assembly
**Status:** Ready for Implementation (90% - pending Ink compilation)
**Date Created:** 2025-12-27

---

## Overview

This roadmap provides a systematic approach to implementing Mission 3 based on Stages 0-8 planning documentation. All planning is complete; this guide organizes the implementation sequence.

**Implementation Readiness:** 90%
**Critical Blocker:** Ink script compilation (external tool - implementer responsibility)

---

## Prerequisites

### Required Before Starting

1. **Ink Script Compilation** ⚠️ CRITICAL BLOCKER
   - Tool: Inky editor (https://github.com/inkle/inky)
   - Files to compile: All 9 .ink scripts in `/stages/stage_7/`
   - Output: Corresponding .json files for game runtime
   - Validation: Check for syntax errors, test compilation
   - **Estimated Time:** 4-6 hours

2. **Development Environment Setup**
   - Game engine with Ink runtime integration
   - Docker Engine 20.10+ (for VM network)
   - Docker Compose 1.29+
   - Asset pipeline configured

3. **Review Planning Documentation**
   - Read Stage 8 validation report (`/stages/stage_8/validation_report.md`)
   - Review asset manifest (`/stages/stage_9_prep/asset_manifest.md`)
   - Review VM infrastructure guide (`/stages/stage_9_prep/vm_infrastructure_setup.md`)

---

## Implementation Phases

### Phase 0: Reference Mission Examination ⚠️ REQUIRED FIRST

**Priority:** ⚠️ CRITICAL - COMPLETE BEFORE CREATING scenario.json.erb
**Estimated Time:** 2-3 hours
**Purpose:** Extract proven patterns from M1/M2 to avoid 40+ validation errors

#### 0.1 Files to Study

```bash
# Required reference examination:
scenarios/m01_first_contact/scenario.json.erb    # Complete pattern reference
scenarios/m02_ransomed_trust/scenario.json.erb   # Recent mission example
scripts/scenario-schema.json                      # JSON schema definition
```

#### 0.2 Critical Patterns to Extract

**1. VM Launcher Configuration:**
- Search for "vm-launcher" in M1
- Extract: hacktivityMode, vm_object() helper usage
- Pattern: `"hacktivityMode": <%= vm_context && vm_context['hacktivity_mode'] ? 'true' : 'false' %>`
- Pattern: `"vm": <%= vm_object('scenario_name', {config}) %>`

**2. Flag Station Configuration:**
- Search for "flag-station" in M1
- Extract: acceptsVms array, flags_for_vm() helper
- Pattern: `"acceptsVms": ["scenario_name"]`
- Pattern: `"flags": <%= flags_for_vm('scenario_name', ['flag{...}']) %>`

**3. Player Sprite Configuration:**
- Top-level object (after startRoom, before rooms)
- Required fields: id, displayName, spriteSheet, spriteTalk, spriteConfig

**4. Opening Briefing Pattern:**
- NPC with timedConversation in starting room
- delay: 0 for immediate trigger
- Displays briefing cutscene on mission start

**5. Closing Debrief Pattern:**
- Phone NPC with eventMappings array
- Triggers on global_variable_changed event
- Provides mission wrap-up after completion

**6. Flag Submission Tasks:**
- Search for "submit_flags" type in M1
- Create one task per VM flag
- Explicit player guidance to submit flags

#### 0.3 Schema Requirements Checklist

**Create checklist from schema before coding:**

- [ ] Objectives: `order` field (0, 1, 2...)
- [ ] Objectives: Flat `tasks` arrays (NOT nested "aims")
- [ ] Tasks: `type` field (enter_room, npc_conversation, unlock_object, custom, submit_flags)
- [ ] Tasks: Include submit_flags for each VM flag
- [ ] Rooms: `type` field (room_reception, room_office, room_ceo, room_servers, hall_1x2gu)
- [ ] NPCs: `displayName` NOT `name`
- [ ] NPCs: `npcType` NOT `type`
- [ ] NPCs: `storyPath` NOT `dialogue_script`
- [ ] NPCs: `currentKnot: "start"` on all NPCs
- [ ] Objects: Valid types only (notes, safe, pc, workstation, vm-launcher, flag-station)
- [ ] Key Locks: keyPins array with values 25-60
- [ ] PIN Locks: `requires: "NNNN"` NOT keyPins
- [ ] Player: Player sprite configuration included

#### 0.4 ERB Helper Setup

**Add to top of scenario.json.erb:**

```erb
<%
require 'base64'
require 'json'

def rot13(text)
  text.tr("A-Za-z", "N-ZA-Mn-za-m")
end

def base64_encode(text)
  Base64.strict_encode64(text)
end

def hex_encode(text)
  text.unpack('H*').first
end

def json_escape(text)
  text.to_json[1..-2]  # Remove surrounding quotes
end
%>
```

**Usage:**
- `json_escape()` - ALL multi-line strings
- `base64_encode()` - Base64 content
- `rot13()` - ROT13 content
- `hex_encode()` - Hex content

#### 0.5 Validation Strategy

**Run validation at 4 checkpoints:**

```bash
# Checkpoint 1: After objectives/tasks
ruby scripts/validate_scenario.rb scenarios/m03_ghost_in_the_machine/scenario.json.erb

# Checkpoint 2: After rooms
ruby scripts/validate_scenario.rb scenarios/m03_ghost_in_the_machine/scenario.json.erb

# Checkpoint 3: After NPCs
ruby scripts/validate_scenario.rb scenarios/m03_ghost_in_the_machine/scenario.json.erb

# Checkpoint 4: Final validation
ruby scripts/validate_scenario.rb scenarios/m03_ghost_in_the_machine/scenario.json.erb
```

**Rule:** Never proceed with validation errors!

**Expected Result:** 0-5 errors on first attempt (vs 40+ without Phase 0)

---

### Phase 1: Asset Preparation (Parallel Work)

**Priority:** High
**Can Start:** After Phase 0 (parallel to Ink compilation)
**Estimated Time:** 8-12 hours (depends on art team)

#### 1.1 Critical Assets (Required for Core Gameplay)

**Character Portraits:**
- Victoria Sterling: 5 expressions (neutral, persuasive, defensive, vulnerable, defiant)
- Agent 0x99: 3 expressions (professional, concerned, supportive)
- James Park: 3 expressions (neutral, guilty, desperate)
- Reference: `/stages/stage_9_prep/asset_manifest.md` lines 22-57

**Room Backgrounds:**
- Reception lobby, Conference room, Main hallway, Server room, Executive wing hallway, Executive office, James's office
- Reference: `/stages/stage_9_prep/asset_manifest.md` lines 79-146

**Placeholder Strategy:**
- Use colored shapes with text labels for character portraits
- Use simple colored backgrounds for rooms
- Allows implementation to proceed while art team works

#### 1.2 Interactive Object Sprites

**Critical UI Overlays:**
- RFID cloner device + proximity progress bar
- VM terminal interface (nmap, netcat, Metasploit console)
- CyberChef workstation interface (ROT13, Hex, Base64 decoders)
- Safe PIN entry interface
- Reference: `/stages/stage_9_prep/asset_manifest.md` lines 148-207

#### 1.3 Sound Effects (Optional for Initial Build)

**High Priority SFX:**
- `flag_submission_success.ogg`, `flag_submission_failure.ogg`
- `rfid_clone_complete.ogg`
- `lockpick_success.ogg`, `safe_unlock.ogg`
- Reference: `/stages/stage_9_prep/asset_manifest.md` lines 290-324

**Can Defer:** Music tracks, ambient sounds, dialogue SFX

---

### Phase 2: VM Infrastructure Setup

**Priority:** High (Required for technical challenges)
**Prerequisite:** Docker environment configured
**Estimated Time:** 6-10 hours

#### 2.1 Docker Network Setup

**Reference Document:** `/stages/stage_9_prep/vm_infrastructure_setup.md`

**Steps:**
1. Create project directory structure:
   ```bash
   mkdir -p m03_ghost_vm_network/{distcc,ftp-data,http-data/pricing}
   ```

2. Copy configuration files:
   - `docker-compose.yml` (lines 46-100 of VM infrastructure doc)
   - `proftpd.conf` (lines 110-139)
   - `distcc/Dockerfile` (lines 166-200)
   - `distcc/operational_logs.txt` (lines 202-236)
   - HTTP content files (lines 256-304)

3. Build and start containers:
   ```bash
   cd m03_ghost_vm_network
   docker-compose up -d
   ```

4. Verify network topology:
   - 192.168.100.10 - FTP Server (ProFTPD 1.3.5)
   - 192.168.100.20 - distcc Service
   - 192.168.100.30 - HTTP Server (Apache)

#### 2.2 Game Integration

**Reference:** VM infrastructure doc lines 371-403

**Option 1 (Recommended):** Docker Network Sharing
- Game VM container joins `zeroday_network`
- Direct IP access to 192.168.100.x hosts
- Most realistic network topology

**Option 2:** Port Forwarding
- Expose container ports to host
- Game VM accesses via localhost
- Simpler setup, less realistic

#### 2.3 Testing Checklist

**Verification Steps:**
- [ ] All 3 containers start successfully
- [ ] IP addresses assigned correctly
- [ ] FTP banner displays "ProFTPD 1.3.5" via netcat
- [ ] HTTP server serves Base64 pricing data
- [ ] distcc service responds on port 3632
- [ ] Network isolated from external internet
- [ ] Operational logs accessible after exploitation

**Reference:** VM infrastructure doc lines 473-487

---

### Phase 3: Room JSON Generation

**Priority:** High
**Prerequisite:** Room backgrounds available (or placeholders)
**Estimated Time:** 12-16 hours

#### 3.1 Room Data Structure

**Reference Document:** `/stages/stage_5/room_design.md`

**Implementation Order:**
1. **Reception Lobby** (lines 40-99)
   - 8×6 GU (usable 6×4 GU)
   - Props: Reception desk, company logo, certification display, founding plaque (2010)
   - Exits: North to Main Hallway

2. **Conference Room** (lines 102-151)
   - 10×8 GU (usable 8×6 GU)
   - Props: Conference table, whiteboard, projector
   - Special: RFID cloning minigame trigger
   - Exits: South to Main Hallway

3. **Main Hallway** (lines 154-195)
   - 12×4 GU (usable 10×2 GU) - Hub corridor
   - Exits: North to Conference Room, South to Reception, East to Server Room, West to Executive Wing

4. **Server Room** ⭐ INVESTIGATION HUB (lines 198-309)
   - 10×10 GU (usable 8×8 GU)
   - Interactive terminals: VM terminal, CyberChef workstation, drop-site terminal
   - Props: Server racks, filing cabinet, wall safe, whiteboard with ROT13 message
   - Exits: West to Main Hallway

5. **Executive Wing Hallway** (lines 312-341)
   - 8×4 GU (usable 6×2 GU)
   - Exits: East to Main Hallway, North to Executive Office, South to James's Office

6. **Executive Office** - Victoria's Workspace (lines 344-422)
   - 10×8 GU (usable 8×6 GU)
   - Props: Executive desk, computer, filing cabinet, wall safe (behind painting), USB drive
   - Nighttime only (Victoria absent)
   - Exits: South to Executive Wing Hallway

7. **James's Office** (lines 426-487)
   - 8×6 GU (usable 6×4 GU)
   - Props: Desk with dual monitors, family photos, OSCP/CEH certifications, diary
   - Nighttime only (James absent)
   - Exits: North to Executive Wing Hallway

#### 3.2 Interactive Objects

**For Each Room, Implement:**
- Examination text (room_design.md provides descriptions)
- Interactive props (lockpicks, computers, safes, terminals)
- Lighting states (daytime/nighttime where applicable)
- LORE fragment placements (see section 3.3)

#### 3.3 LORE Fragment Placement

**Reference Document:** `/stages/stage_6/lore_fragments.md`

**Locations:**
1. **LORE Fragment 1:** "Zero Day: A Brief History" (lines 15-100)
   - Location: Executive Office filing cabinet
   - Challenge: Lockpicking (moderate difficulty)

2. **LORE Fragment 2:** "Q3 2024 Exploit Catalog" ⭐ PRIMARY EVIDENCE (lines 103-211)
   - Location: Server Room safe
   - Challenge: PIN code entry (2010 - from founding plaque)
   - Contains: $12,500 hospital exploit listing

3. **LORE Fragment 3:** "The Architect's Directive" ⭐ PRIMARY EVIDENCE (lines 214-368)
   - Location: Executive Office (hidden USB drive in desk)
   - Challenge: Base64 → ROT13 double decoding
   - Contains: Phase 2 attack plans

---

### Phase 4: NPC and Dialogue Integration

**Priority:** High
**Prerequisite:** Ink scripts compiled to .json
**Estimated Time:** 8-12 hours

#### 4.1 Ink Script Integration

**Reference Documents:**
- All 9 Ink scripts in `/stages/stage_7/`
- Player goals: `/stages/stage_4/player_goals.md`
- Objectives structure: `/stages/stage_4/objectives.json`

**Integration Order:**

1. **Opening Briefing** (`m03_opening_briefing.ink`)
   - Trigger: Mission start
   - Sets: Mission objectives, player context
   - Unlocks: Learning objectives optional dialogue (lines 164-194)

2. **Victoria Sterling** (`m03_npc_victoria.ink`)
   - Location: Conference Room (daytime)
   - Phases: Philosophy discussion → RFID cloning → Nighttime confrontation
   - Variables: `victoria_influence`, `victoria_suspicious`, `victoria_trusts_player`
   - Critical Section: Nighttime confrontation (lines 442-690)

3. **NPC Receptionist** (`m03_npc_receptionist.ink`)
   - Location: Reception Lobby (daytime)
   - Purpose: Information gathering, social engineering

4. **NPC Guard** (`m03_npc_guard.ink`)
   - Location: Patrols Main Hallway (nighttime)
   - Mechanic: Stealth detection, bribery option
   - Optional Objective: Perfect stealth achievement

5. **James Park Choice** (`m03_james_choice.ink`)
   - Trigger: Reading James's diary in James's Office
   - Moral Dilemma: Protect innocent vs. mission thoroughness
   - Variables: `james_protected`, `james_warned`

6. **Terminal Interactions:**
   - `m03_terminal_vm.ink` - VM challenges (nmap, netcat, distcc exploit)
   - `m03_terminal_cyberchef.ink` - Encoding challenges
   - `m03_terminal_dropsite.ink` - Flag submission + M2 revelation
   - `m03_phone_agent0x99.ink` - Event-triggered call (distcc flag → M2 reveal)

7. **Closing Debrief** (`m03_closing_debrief.ink`)
   - Trigger: All primary objectives complete
   - Reflects: Player moral choices, mission consequences
   - Branches: Based on Victoria fate, James protection, evidence collected

#### 4.2 Tag Implementation

**Required Ink Tags:**
- `#speaker:<character>` - Dialogue speaker identification
- `#display:<portrait_variation>` - Character portrait changes
- `#complete_task:<task_id>` - Objectives system integration
- `#unlock_task:<task_id>` - Progressive task unlocking
- `#unlock_aim:<aim_id>` - Aim unlocking
- `#exit_conversation` - Dialogue termination

**Reference:** Stage 7 Ink scripts demonstrate tag usage patterns

#### 4.3 Variable System

**Global Variables to Track:**

**Victoria Relationship:**
- `victoria_influence` (0-100) - Trust level with Victoria
- `victoria_suspicious` (0-100) - Victoria's suspicion of player
- `victoria_trusts_player` (boolean) - Threshold flag

**Mission Progress:**
- `rfid_clone_started`, `rfid_clone_complete` (boolean)
- `distcc_exploit_complete` (boolean) - Triggers M2 revelation
- `m2_revelation_seen` (boolean)

**Moral Choices:**
- `james_protected` (boolean) - James Park fate
- `james_warned` (boolean)
- `victoria_recruited`, `victoria_arrested`, `victoria_escaped` (boolean)

**Evidence Collection:**
- `lore_fragment_1_found`, `lore_fragment_2_found`, `lore_fragment_3_found`
- `perfect_stealth` (boolean) - Never detected by guard

---

### Phase 5: Challenge Minigames

**Priority:** High
**Estimated Time:** 10-14 hours

#### 5.1 RFID Cloning (Scenario Initialization)

**Reference:** `/stages/stage_0/scenario_initialization.md` lines 39-109

**Mechanics:**
- Trigger: Player moves close to Victoria in Conference Room
- Requirement: Stay within 2 meters for 10 seconds
- UI: Progress bar (0% → 100%)
- Dialogue: Must keep Victoria talking (3 distraction beats)
- Success: Victoria's keycard cloned → Executive access unlocked
- Failure: Victoria notices suspicious behavior → suspicion +20

**Integration with Ink:**
- `m03_npc_victoria.ink` lines 285-383 provide dialogue flow
- Hub pattern allows player to manage proximity and conversation

#### 5.2 VM Terminal Challenges

**Reference:**
- `/stages/stage_7/m03_terminal_vm.ink`
- `/stages/stage_9_prep/vm_infrastructure_setup.md`

**Challenge 1: Network Scan**
- Tool: nmap simulation
- Command: `nmap -sV 192.168.100.0/24`
- Output: Displays 3 services (FTP:21, distcc:3632, HTTP:80)
- Flag: `flag{network_scan_complete}`

**Challenge 2: FTP Banner Grabbing**
- Tool: netcat simulation
- Command: `nc 192.168.100.10 21`
- Output: `220 ProFTPD 1.3.5 Server (WhiteHat Security Training Network)`
- Flag: `flag{ftp_intel_gathered}`

**Challenge 3: HTTP Reconnaissance**
- Tool: curl/browser
- Command: `curl http://192.168.100.30/pricing/data.txt`
- Output: Base64 encoded pricing structure
- Requires: CyberChef decoding
- Flag: `flag{pricing_intel_decoded}`

**Challenge 4: distcc Exploitation** ⭐ M2 REVELATION TRIGGER
- Tool: Metasploit simulation (or manual RCE)
- Target: CVE-2004-2687 - distcc RCE
- Success: Access to `/var/log/zeroday/sales_log.txt`
- Contents: ProFTPD hospital exploit sale ($12,500 to GHOST)
- Flag: `flag{distcc_legacy_compromised}`
- **Event:** Triggers Agent 0x99 phone call revealing St. Catherine's Hospital attack

**UI Design:**
- Terminal window overlay
- Command input field
- Output display area
- Command history
- Flag submission button

#### 5.3 CyberChef Workstation

**Reference:** `/stages/stage_7/m03_terminal_cyberchef.ink`

**Supported Operations:**
- ROT13 decoding
- Hexadecimal decoding
- Base64 decoding
- Cascading operations (Base64 → ROT13 for LORE Fragment 3)

**Challenges:**
1. **Whiteboard Message** (Server Room)
   - Input: `ZRRG JVGU GUR NEPUVGRPG - CEVBEVGVMR VASENFGEHPGHER RKCYBVGF`
   - Operation: ROT13
   - Output: `MEET WITH THE ARCHITECT - PRIORITIZE INFRASTRUCTURE EXPLOITS`

2. **Client Roster** (Victoria's Computer - encoded in hex)
   - Provides client codename decryption

3. **HTTP Pricing Data** (from VM challenge)
   - Base64 → plaintext pricing structure

4. **The Architect's Directive** (USB drive - LORE Fragment 3)
   - Base64 → ROT13 (two-stage decoding)
   - Most complex challenge

**UI Design:**
- Operation selector dropdown
- Input text area
- Output text area
- "Decode" button
- Clear/reset functionality

#### 5.4 Lockpicking Minigame

**Reference:** Stage 5 room_design.md mentions lockpicking challenges

**Targets:**
- Executive Office door (moderate difficulty)
- Filing cabinets (easy-moderate difficulty)
- Server room filing cabinet (easy)

**Accessibility Note:**
- Validation report recommends difficulty toggle (Recommendation #5)
- Not critical for initial implementation

#### 5.5 Safe PIN Entry

**Location:** Server Room safe
**PIN:** 2010 (from company founding plaque in Reception Lobby)
**UI:** Numeric keypad (0-9), submit button, attempt counter

---

### Phase 6: Objectives System Integration

**Priority:** High
**Prerequisite:** Objectives.json validated
**Estimated Time:** 6-8 hours

#### 6.1 Objectives Structure

**Reference Document:** `/stages/stage_4/objectives.json`

**Main Objective:** "Zero Day Intelligence"

**3 Primary Aims:**

1. **Establish Undercover Access** (`establish_cover`)
   - Task 1: Meet Victoria Sterling (`meet_victoria`)
   - Task 2: Clone RFID Keycard (`clone_rfid_card`)

2. **Network Reconnaissance** (`network_recon`)
   - Task 1: Scan Training Network (`scan_network`)
   - Task 2: Gather FTP Intelligence (`ftp_banner`)
   - Task 3: Analyze HTTP Service (`http_analysis`)
   - Task 4: Exploit distcc Service (`distcc_exploit`) ⭐ M2 trigger

3. **Physical Evidence Collection** (`gather_evidence`)
   - Task 1: Decode Whiteboard Message (`decode_whiteboard`)
   - Task 2: Access Victoria's Computer (`access_victoria_computer`)
   - Task 3: Decode Client Roster (`decode_client_roster`)
   - Task 4: Find Operational Logs (`find_operational_logs`)

**4 Optional Objectives:**
- LORE Collection (3 fragments)
- Perfect Stealth (zero guard detections)
- Moral Engagement (James choice, Victoria choice)

#### 6.2 Progressive Unlocking

**Aim Unlocking:**
- `network_recon` unlocks when `clone_rfid_card` completes
- `gather_evidence` unlocks when `clone_rfid_card` completes

**Task Unlocking:**
- All tasks within `establish_cover` start active
- All tasks within `network_recon` start locked → unlock when aim unlocks
- All tasks within `gather_evidence` start locked → unlock when aim unlocks

**Moral Choices:**
- `moral_choices` aim starts locked
- Unlocks when `distcc_exploit` completes (M2 revelation point)

#### 6.3 Completion Triggers

**Task Completion Methods:**
- Ink tag: `#complete_task:<task_id>`
- Flag submission: `flag{network_scan_complete}` → completes `scan_network`
- Interactive object: Examining LORE fragment → completes corresponding LORE task
- Dialogue choice: Victoria fate decision → completes `victoria_choice_made`

**Reference:** `/stages/stage_4/objectives_integration.md` lines 65-130 for detailed task completion logic

---

### Phase 7: Event Orchestration

**Priority:** High
**Estimated Time:** 6-10 hours

#### 7.1 Day/Night Cycle

**Reference:** `/stages/stage_1/narrative_structure.md` lines 82-145

**Daytime Phase (Act 1):**
- Available rooms: Reception, Conference Room, Main Hallway
- NPCs: Receptionist, Victoria Sterling
- Player activities: Social engineering, RFID cloning

**Nighttime Phase (Acts 2-3):**
- Available rooms: All 7 rooms
- NPCs: Security Guard (patrol), Victoria Sterling (optional confrontation)
- Player activities: Investigation, VM challenges, evidence collection

**Transition Trigger:** RFID cloning complete → player leaves building → nighttime phase begins

#### 7.2 M2 Revelation Event ⭐ EMOTIONAL TURNING POINT

**Reference:**
- `/stages/stage_1/narrative_structure.md` lines 156-197
- `/stages/stage_7/m03_phone_agent0x99.ink`

**Trigger Sequence:**
1. Player completes distcc exploitation challenge
2. Submits `flag{distcc_legacy_compromised}` at drop-site terminal
3. Flag accepted → operational logs appear in terminal output
4. Player reads: "$12,500 hospital exploit sale to GHOST"
5. **Event:** Agent 0x99 phone call initiates

**Phone Call Content:**
- Agent 0x99 reveals St. Catherine's Regional Medical Center attack
- 6 patient deaths during ransomware attack
- Direct connection: ProFTPD exploit from Zero Day Syndicate
- Named victims (Agent 0x99's voice actor delivers with emotional weight)
- Stakes transformed from abstract to deeply personal

**Emotional Impact:**
- Background music shifts (use M2 revelation sting)
- Character portrait: `agent_0x99_concerned.png`
- Unlocks `moral_choices` optional objective
- Changes player motivation from "gather intelligence" to "justice/prevention"

#### 7.3 Stealth System (Optional Objective)

**Reference:** `/stages/stage_7/m03_npc_guard.ink`

**Mechanics:**
- Guard patrols Main Hallway on fixed route
- Detection range: Line of sight cone
- Detection meter: Fills over 3 seconds if player in sight
- Consequences:
  - First detection: Warning, guard returns to patrol
  - Second detection: Bribery option ($500 or mission failure)
  - Bribery accepted: Mission continues, `perfect_stealth` objective failed
  - Bribery refused: Mission failure

**Perfect Stealth Achievement:**
- Requires: Zero detections throughout mission
- Reward: Optional objective completion, achievement badge

---

### Phase 8: Testing and Iteration

**Priority:** Critical
**Estimated Time:** 12-20 hours

#### 8.1 Functionality Testing

**Critical Path Test:**
1. Start mission → opening briefing
2. Meet Victoria → philosophy discussion
3. RFID cloning minigame → keycard acquired
4. Nighttime transition
5. Access server room → VM challenges (all 4 flags)
6. M2 revelation event triggers
7. Collect physical evidence (LORE, documents)
8. Moral choices (James, Victoria)
9. Closing debrief

**Time Estimate:** 45-60 minutes for full playthrough

**Test Variations:**
- High Victoria trust path → recruitment ending
- Low Victoria trust path → arrest ending
- James protected vs. James exposed
- Perfect stealth vs. guard detected
- All LORE fragments vs. minimal evidence

#### 8.2 VM Network Integration Testing

**Reference:** `/stages/stage_9_prep/vm_infrastructure_setup.md` lines 473-487

**Checklist:**
- [ ] Player VM can reach 192.168.100.x network
- [ ] nmap scan returns correct results
- [ ] FTP banner displays correctly via netcat
- [ ] HTTP pricing data accessible and decodable
- [ ] distcc service exploitable
- [ ] Operational logs accessible after exploitation
- [ ] Flags validate correctly in drop-site terminal

#### 8.3 Objectives System Testing

**Checklist:**
- [ ] Tasks unlock progressively (aims unlock after RFID clone)
- [ ] Task completion triggers work (Ink tags, flags, interactions)
- [ ] Optional objectives track correctly
- [ ] Moral choices objective unlocks after M2 revelation
- [ ] LORE collection tracks all 3 fragments
- [ ] Perfect stealth tracks guard detections

#### 8.4 Dialogue and Narrative Testing

**Key Moments to Verify:**
- Victoria's philosophy escalates naturally (rational → defensive → broken)
- M2 revelation has emotional impact (music, portrait, dialogue)
- James choice presents genuine moral dilemma
- Victoria confrontation branches work (recruitment, arrest, escape)
- Debrief reflects player choices accurately

#### 8.5 Educational Content Validation

**Reference:** Stage 8 validation report CyBOK alignment (lines 438-528)

**Learning Objectives to Verify:**
- Network reconnaissance (nmap, service discovery)
- Banner grabbing (netcat, information disclosure)
- Encoding vs. encryption (ROT13, Base64, Hex)
- Service exploitation (distcc CVE-2004-2687)
- Intelligence correlation (digital + physical evidence)
- Vulnerability economics (zero-day marketplace)

**Accuracy Check:**
- nmap commands realistic
- CVE-2004-2687 explanation correct
- Encoding operations accurate
- Pricing structure reflects real-world exploit market patterns

---

## Implementation Priority Matrix

### Must-Have (Cannot Ship Without)

1. ✅ Ink scripts compiled to .json
2. ✅ All 7 room JSONs created
3. ✅ VM network functional (3 services, 4 flags)
4. ✅ Objectives system integrated (3 aims, 11 tasks)
5. ✅ Critical NPCs (Victoria, Agent 0x99, James)
6. ✅ RFID cloning minigame
7. ✅ VM terminal challenges (nmap, netcat, exploitation)
8. ✅ CyberChef workstation (ROT13, Base64, Hex)
9. ✅ M2 revelation event (distcc → Agent 0x99 call)
10. ✅ Moral choices (James, Victoria)
11. ✅ Debrief system

### Should-Have (Significantly Enhances Experience)

12. ⚠️ Character portraits (5 Victoria, 3 Agent 0x99, 3 James, 2 Guard, 1 Receptionist)
13. ⚠️ Room backgrounds (7 backgrounds)
14. ⚠️ LORE fragments (3 documents)
15. ⚠️ Stealth system (guard patrol, detection)
16. ⚠️ Lockpicking minigame
17. ⚠️ Safe PIN entry
18. ⚠️ Flag submission SFX (success/failure)

### Nice-to-Have (Polish and Replayability)

19. ◐ Music tracks (4-5 tracks)
20. ◐ Ambient SFX (office sounds, server hum)
21. ◐ Guard patrol animations
22. ◐ Server LED blink effects
23. ◐ Accessibility features (difficulty toggle, audio cues)
24. ◐ Perfect stealth achievement tracking

### Can Defer (Future Updates)

25. ○ Post-mission knowledge check
26. ○ Additional LORE fragments (beyond 3)
27. ○ New Game Plus mode
28. ○ Advanced accessibility options

---

## Risk Mitigation

### High Risk: VM Integration Complexity

**Mitigation:**
- Use VM infrastructure guide's Docker Compose setup (pre-tested configurations)
- Implement Option 1 (Docker network sharing) for most realistic experience
- Fallback: Option 2 (port forwarding) if network sharing proves complex
- Allocate extra time for integration testing (4-6 hours buffer)

### Medium Risk: Ink Integration Debugging

**Mitigation:**
- Test each Ink script individually before full integration
- Verify variable persistence across conversation knots
- Validate tag triggers with objectives system
- Use Inky editor's debug mode during compilation

### Medium Risk: M2 Revelation Impact

**Mitigation:**
- Playtest M2 revelation scene multiple times for emotional timing
- Ensure music cue triggers correctly
- Verify character portrait changes to `agent_0x99_concerned.png`
- Test that moral choices objective unlocks after revelation

### Low Risk: Asset Pipeline Delays

**Mitigation:**
- Use placeholder assets (colored shapes, text labels)
- Ship initial build with placeholders
- Update assets in subsequent patch
- Placeholder strategy documented in asset manifest

---

## Success Criteria

### Technical Success

- [ ] All 11 primary tasks completable
- [ ] All 4 optional objectives trackable
- [ ] All 6-9 endings reachable (moral choice combinations)
- [ ] VM network stable and exploitable
- [ ] No game-breaking bugs in critical path
- [ ] Average playthrough time: 45-75 minutes

### Educational Success

- [ ] Players can demonstrate nmap usage
- [ ] Players understand encoding vs. encryption
- [ ] Players recognize CVE-2004-2687 exploitation method
- [ ] Players grasp zero-day marketplace economics
- [ ] Learning objectives dialogue accessible and clear

### Narrative Success

- [ ] M2 revelation creates emotional impact (playtest feedback)
- [ ] Victoria's character arc feels believable (not cartoonish)
- [ ] James choice presents genuine moral dilemma
- [ ] Player choices acknowledged in debrief
- [ ] All 3 act structure milestones hit (setup, midpoint twist, climax)

### Player Experience Success

- [ ] Objectives clear and trackable
- [ ] Progression feels logical (no confusion about what to do next)
- [ ] Challenges appropriate difficulty (intermediate tier)
- [ ] Hint system accessible (Agent 0x99 phone calls)
- [ ] Replayability high (multiple endings motivate second playthrough)

---

## Post-Implementation

### Iteration 1: Polish (After Initial Deployment)

- Replace placeholder assets with final art
- Add ambient sound effects
- Implement music tracks
- Dialogue pacing refinement (optional per validation report)
- Accessibility enhancements (audio cues, difficulty toggle)

### Iteration 2: Enhancement (Future Updates)

- Post-mission knowledge check
- Additional LORE fragments (5-6 total instead of 3)
- New Game Plus mode (harder VM network)
- Advanced stealth mechanics
- Additional moral choice branches

---

## Reference Documents Summary

**Stage 0:** Scenario initialization, RFID cloning challenge
**Stage 1:** Narrative structure, three-act breakdown
**Stage 2:** Storytelling elements (NPCs, locations, tone)
**Stage 3:** Moral choices (James, Victoria)
**Stage 4:** Player objectives and integration logic
**Stage 5:** Room layout and interactive objects
**Stage 6:** LORE fragments (3 documents)
**Stage 7:** Ink scripts (9 dialogue files)
**Stage 8:** Validation report (comprehensive review)
**Stage 9 Prep:** Asset manifest, VM infrastructure, this roadmap

**Total Documentation:** 22 documents, ~15,700 lines

---

## Estimated Timeline

**Phase 0 (Reference Study):** 2-3 hours ⭐ REQUIRED FIRST
**Phase 1 (Asset Prep):** 8-12 hours (parallel)
**Phase 2 (VM Setup):** 6-10 hours
**Phase 3 (Room JSON):** 12-16 hours
**Phase 4 (NPC/Dialogue):** 8-12 hours
**Phase 5 (Challenges):** 10-14 hours
**Phase 6 (Objectives):** 6-8 hours
**Phase 7 (Events):** 6-10 hours
**Phase 8 (Testing):** 12-20 hours

**Total:** 70-105 hours (9-14 working days)
**With Risk Buffer:** 84-121 hours (11-16 working days)

**Note:** Phase 0 saves 4-6 hours by preventing validation errors and rework!

---

**Roadmap Version:** 2.0
**Last Updated:** 2025-12-28
**Critical Change:** Added Phase 0 (Reference Examination) - MANDATORY FIRST STEP
**Status:** Ready for Implementation

⚠️ **IMPORTANT:** Complete Phase 0 (Reference Mission Examination) BEFORE creating scenario.json.erb. This prevents 40+ validation errors and saves 4-6 hours of rework.

All planning stages complete. Mission 3 "Ghost in the Machine" ready for Stage 9 scenario assembly.
