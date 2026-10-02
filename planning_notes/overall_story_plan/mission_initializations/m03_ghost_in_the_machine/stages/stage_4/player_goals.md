# Mission 3: Player Objectives - "Ghost in the Machine"

**Mission ID:** m03_ghost_in_the_machine
**Title:** Ghost in the Machine
**Stage:** 4 - Player Objectives Design
**Date Created:** 2025-12-27

---

## Overview

**Scenario:** Ghost in the Machine
**Mission Type:** Infiltration & Investigation (Undercover)
**Target Difficulty:** Tier 2 (Intermediate)
**Estimated Playtime:** 60-75 minutes

**Objective Philosophy:**

Mission 3 uses a **hybrid progressive structure** that combines:
- **Linear main path** (Act 1: Undercover → Act 2: Investigation → Act 3: Confrontation)
- **Non-linear investigation** (Act 2: Multiple evidence sources can be pursued in any order)
- **Optional objectives** (LORE fragments, complete stealth, moral choices)

**From Act 2 onwards, objectives are clearly displayed in the UI** to guide players through the investigation phase.

---

## Primary Objective: Gather Intelligence on Zero Day Operations

**ID:** `main_mission`
**Description:** "Gather evidence of Zero Day Syndicate's exploit marketplace operations"

**Narrative Purpose:**
- Prove Zero Day sold the M2 hospital exploit
- Identify ENTROPY cell connections
- Discover The Architect's involvement
- Collect evidence for Victoria Sterling's arrest

**Educational Purpose:**
- Network reconnaissance (nmap, banner grabbing)
- Intelligence correlation (physical + digital evidence)
- Multi-stage encoding (ROT13, Hex, Base64)
- Operational security (stealth, social engineering)

**Success Criteria:**
- All 3 aims completed
- Minimum 4 of 6 VM flags submitted
- Evidence of M2 connection discovered
- Victoria Sterling confronted (optional)

---

### Aim 1.1: Establish Undercover Access

**ID:** `establish_cover`
**Description:** "Infiltrate WhiteHat Security and clone Victoria Sterling's keycard"
**Unlock Condition:** Available from mission start (Act 1)
**Act:** Act 1 - Undercover Infiltration

This aim covers the daytime undercover operation where the player poses as a prospective client.

**Tasks:**

#### Task: Attend meeting with Victoria Sterling
- **ID:** `meet_victoria`
- **Type:** In-Game (NPC interaction)
- **Description:** "Meet Victoria Sterling at WhiteHat Security"
- **Location:** Conference room
- **Requirements:** Mission briefing completed
- **Completion:** Automatic when player starts dialogue with Victoria
- **Unlocks:** RFID cloning opportunity
- **Status at Start:** `active`

#### Task: Clone Victoria's RFID keycard
- **ID:** `clone_rfid_card`
- **Type:** In-Game (proximity mechanic)
- **Description:** "Clone Victoria Sterling's executive keycard"
- **Location:** Conference room (during meeting)
- **Requirements:** RFID cloner device (provided in briefing), proximity to Victoria for 10 seconds
- **Completion:** Automatic when RFID clone progress reaches 100%
- **Unlocks:** Server room access (nighttime), Aim 1.2 unlocked
- **Status at Start:** `locked` (unlocks after meet_victoria)
- **Alternative Path:** If victoria_trust >= 40, Victoria grants access willingly (bypasses this task)

**Aim Completion:** When both tasks completed OR Victoria grants access
**Transitions to:** Act 2 - Investigation phase, Aim 1.2 unlocked

---

### Aim 1.2: Network Reconnaissance

**ID:** `network_recon`
**Description:** "Scan Zero Day's training network to identify services and gather intelligence"
**Unlock Condition:** Unlocked after `clone_rfid_card` completed (server room accessible)
**Act:** Act 2 - Investigation & Escalation

This aim represents the VM-based network scanning challenges.

**Tasks:**

#### Task: Scan training network for open ports
- **ID:** `scan_network`
- **Type:** VM Flag
- **Description:** "Use nmap to scan the training network (192.168.100.0/24)"
- **Location:** Server room - VM terminal
- **Requirements:** Server room access
- **Completion:** Submit flag `flag{network_scan_complete}` at drop-site terminal
- **Ink Tag:** `#complete_task:scan_network`
- **Unlocks:** Access to service enumeration tasks
- **Status at Start:** `locked` (unlocks when server room accessed)

#### Task: Gather FTP banner intelligence
- **ID:** `ftp_banner`
- **Type:** VM Flag
- **Description:** "Connect to FTP service and extract banner information"
- **Location:** Server room - VM terminal
- **Requirements:** Network scan completed
- **Completion:** Submit flag `flag{ftp_intel_gathered}` at drop-site terminal
- **Ink Tag:** `#complete_task:ftp_banner`
- **Unlocks:** Client codename "GHOST" revealed (M2 connection foreshadowing)
- **Status at Start:** `locked` (unlocks after scan_network)

#### Task: Analyze HTTP service
- **ID:** `http_analysis`
- **Type:** VM Flag + In-Game (correlation)
- **Description:** "Analyze HTTP service and decode Base64 pricing data"
- **Location:** Server room - VM terminal + CyberChef workstation
- **Requirements:** Network scan completed, CyberChef access
- **Completion:** Submit flag `flag{pricing_intel_decoded}` at drop-site terminal
- **Ink Tag:** `#complete_task:http_analysis`
- **Unlocks:** Pricing intelligence document in-game
- **Status at Start:** `locked` (unlocks after scan_network)

#### Task: Exploit distcc service
- **ID:** `distcc_exploit`
- **Type:** VM Flag (Advanced)
- **Description:** "Exploit legacy distcc service to access operational logs"
- **Location:** Server room - VM terminal
- **Requirements:** Network scan completed, Metasploit knowledge OR manual exploitation
- **Completion:** Submit flag `flag{distcc_legacy_compromised}` at drop-site terminal
- **Ink Tag:** `#complete_task:distcc_exploit` + triggers M2 revelation event
- **Unlocks:** **CRITICAL**: Operational logs revealing M2 hospital attack connection
- **Status at Start:** `locked` (unlocks after scan_network)
- **Special:** Triggers Agent 0x99 event conversation revealing M2 connection

**Aim Completion:** When all 4 tasks completed
**Critical Path:** `distcc_exploit` is REQUIRED for M2 revelation (narrative climax)

---

### Aim 1.3: Physical Evidence Collection

**ID:** `gather_evidence`
**Description:** "Collect physical evidence from WhiteHat Security offices"
**Unlock Condition:** Unlocked when server room accessed (parallel to Aim 1.2)
**Act:** Act 2 - Investigation & Escalation

This aim represents in-game evidence gathering that correlates with VM findings.

**Tasks:**

#### Task: Decode whiteboard message
- **ID:** `decode_whiteboard`
- **Type:** In-Game (encoding puzzle)
- **Description:** "Decode the ROT13 message on the server room whiteboard"
- **Location:** Server room - whiteboard (interactable object)
- **Requirements:** CyberChef workstation access
- **Completion:** Player successfully decodes ROT13 at CyberChef
- **Ink Tag:** `#complete_task:decode_whiteboard`
- **Unlocks:** Message: "MEET WITH THE ARCHITECT - PRIORITIZE INFRASTRUCTURE EXPLOITS"
- **Status at Start:** `locked` (unlocks when server room accessed)

#### Task: Access Victoria's computer
- **ID:** `access_victoria_computer`
- **Type:** In-Game (lockpicking + password)
- **Description:** "Access Victoria Sterling's executive office computer"
- **Location:** Executive office
- **Requirements:** Executive office access (lockpick door OR victoria_trust >= 40)
- **Completion:** Successful login to Victoria's computer
- **Ink Tag:** `#complete_task:access_victoria_computer`
- **Unlocks:** Email drafts, client roster, hex-encoded files
- **Status at Start:** `locked` (unlocks when server room accessed, parallel to VM tasks)

#### Task: Decode client roster
- **ID:** `decode_client_roster`
- **Type:** In-Game (Hex decoding)
- **Description:** "Decode the hex-encoded client roster from Victoria's computer"
- **Location:** Executive office computer → CyberChef workstation
- **Requirements:** Victoria's computer accessed
- **Completion:** Player decodes hex client list at CyberChef
- **Ink Tag:** `#complete_task:decode_client_roster`
- **Unlocks:** Client list: Ransomware Incorporated, Critical Mass, Social Fabric
- **Status at Start:** `locked` (unlocks after access_victoria_computer)

#### Task: Find operational logs
- **ID:** `find_operational_logs`
- **Type:** Correlation (VM + In-Game)
- **Description:** "Correlate VM operational logs with physical evidence"
- **Location:** Server room (after distcc exploitation)
- **Requirements:** `distcc_exploit` completed (VM flag), physical evidence gathered
- **Completion:** Player examines operational logs file (auto-appears after distcc_exploit)
- **Ink Tag:** `#complete_task:find_operational_logs` + triggers M2 revelation dialogue
- **Unlocks:** **MIDPOINT TWIST**: Discovery of ProFTPD sale to GHOST for $12,500
- **Status at Start:** `locked` (unlocks after distcc_exploit)
- **Special:** This is the KEY correlation task that reveals M2 connection

**Aim Completion:** When all 4 tasks completed
**Narrative Impact:** Completing this aim + Aim 1.2 = full evidence gathered, unlocks Act 3

---

## Objectives Progression Flow

```
ACT 1: UNDERCOVER INFILTRATION
├─ Aim 1.1: Establish Undercover Access [ACTIVE at start]
│  ├─ Task: meet_victoria [ACTIVE]
│  └─ Task: clone_rfid_card [LOCKED → unlocks after meet_victoria]
│     → Completes Aim 1.1
│     → Unlocks Aim 1.2 + Aim 1.3 (parallel)
│
ACT 2: INVESTIGATION & ESCALATION
├─ Aim 1.2: Network Reconnaissance [LOCKED → unlocks after Aim 1.1]
│  ├─ Task: scan_network [LOCKED → unlocks when server room accessed]
│  ├─ Task: ftp_banner [LOCKED → unlocks after scan_network]
│  ├─ Task: http_analysis [LOCKED → unlocks after scan_network]
│  └─ Task: distcc_exploit [LOCKED → unlocks after scan_network]
│     → Triggers M2 revelation event
│
├─ Aim 1.3: Physical Evidence Collection [LOCKED → unlocks when server room accessed]
│  ├─ Task: decode_whiteboard [LOCKED → unlocks when server room accessed]
│  ├─ Task: access_victoria_computer [LOCKED → unlocks when server room accessed]
│  ├─ Task: decode_client_roster [LOCKED → unlocks after access_victoria_computer]
│  └─ Task: find_operational_logs [LOCKED → unlocks after distcc_exploit]
│     → MIDPOINT TWIST: M2 hospital connection revealed
│
│ Both Aim 1.2 + Aim 1.3 complete → All evidence collected
│ → Triggers: Victoria confrontation available
│
ACT 3: CONFRONTATION & CHOICE
└─ Victoria confrontation (optional but recommended)
   ├─ Moral Choice 1: James Park's protection
   └─ Moral Choice 2: Victoria's fate (arrest/recruit/delay)
```

**Critical Path Summary:**
1. Meet Victoria → Clone RFID (OR build trust)
2. Access server room → Network scan + Evidence gathering (parallel)
3. Complete distcc exploit → M2 revelation
4. Find operational logs → Full evidence correlation
5. Confront Victoria (optional) → Make moral choices

---

## Success and Failure States

### Complete Success (100%)
- All primary objectives completed (Aims 1.1, 1.2, 1.3)
- All 4 VM flags submitted
- All 4 physical evidence tasks completed
- M2 connection discovered
- Victoria confronted with evidence
- Optimal moral choices made (player-defined)
- No detection by guard (perfect stealth)

### Good Success (80-99%)
- All primary objectives completed
- Minimum 3 of 4 VM flags submitted
- M2 connection discovered
- Victoria confronted
- Minor detection incidents (guard alert but not hostile)

### Acceptable Success (60-79%)
- Aims 1.1 and 1.2 completed (or 1.1 and 1.3)
- Minimum 2 VM flags submitted
- Sufficient evidence to identify Zero Day operations
- Victoria may not be confronted
- Some stealth failures (detected but recovered)

### Minimal Success (50-59%)
- Aim 1.1 completed (gained access)
- At least 1 VM flag submitted
- Some evidence gathered (partial intelligence)
- Mission technically complete but incomplete picture

### Failure States

**Mission Cannot Be Permanently Failed** - Player can retry from checkpoints

**Soft Failure Scenarios:**
- Detected by guard 3 times: Mission becomes significantly harder, timer imposed (5 min)
- Victoria becomes suspicious: Locks down server room, must use alternative methods
- RFID cloning failed + low trust: Must lockpick server room door

**Checkpoint System:**
- Checkpoint 1: After Aim 1.1 complete (RFID cloned)
- Checkpoint 2: After server room accessed
- Checkpoint 3: After M2 revelation (distcc_exploit + find_operational_logs)

**Note:** Players can continue campaign regardless of success level. Lower success = fewer intel for future missions.

---

## Optional Objectives

### Optional Objective 1: Collect LORE Fragments

**ID:** `collect_lore`
**Description:** "Discover hidden LORE fragments about ENTROPY and The Architect"
**Purpose:** World-building, completionist content, deeper understanding of ENTROPY mythology
**Reward:** 3 LORE fragments revealing Zero Day's history and The Architect's directives

**Aims:**

#### Aim: Find all LORE fragments
**ID:** `find_all_lore`
**Description:** "Locate 3 hidden LORE fragments"
**Status at Start:** `active` (optional objectives available from start)

**Tasks:**

##### Task: LORE Fragment 1 - Zero Day Origins
- **ID:** `lore_fragment_1`
- **Type:** In-Game (hidden item)
- **Description:** "Find the document detailing Zero Day Syndicate's founding"
- **Location:** Executive office - filing cabinet (lockpick required)
- **Completion:** Pickup text_file item "Zero Day: A Brief History"
- **Status at Start:** `active`

##### Task: LORE Fragment 2 - Exploit Catalog
- **ID:** `lore_fragment_2`
- **Type:** In-Game (safe puzzle)
- **Description:** "Open Victoria's safe to find the exploit catalog"
- **Location:** Executive office - wall safe (PIN: 2010)
- **Completion:** Pickup text_file item "Q3 2024 Exploit Catalog"
- **Status at Start:** `active`

##### Task: LORE Fragment 3 - The Architect's Directive
- **ID:** `lore_fragment_3`
- **Type:** In-Game (advanced encoding)
- **Description:** "Decode the double-encoded USB drive message"
- **Location:** Executive office - hidden USB drive in desk drawer
- **Completion:** Successfully decode ROT13+Base64 message revealing Architect communication
- **Status at Start:** `active`

**Completion Reward:** Complete understanding of Zero Day's role in ENTROPY, first direct Architect communication

---

### Optional Objective 2: Perfect Stealth

**ID:** `perfect_stealth`
**Description:** "Complete the mission without being detected by the guard"
**Purpose:** Challenge for skilled players, demonstrates operational security mastery
**Reward:** Achievement, higher mission rating, Agent 0x99 commendation in debrief

**Aims:**

#### Aim: Maintain stealth throughout mission
**ID:** `stealth_mastery`
**Description:** "Avoid detection by the night security guard"
**Status at Start:** `active`

**Tasks:**

##### Task: Complete mission undetected
- **ID:** `zero_detection`
- **Type:** In-Game (behavioral challenge)
- **Description:** "Complete all objectives without triggering guard detection"
- **Completion:** Automatic tracking - guard_detected variable remains false throughout mission
- **Status at Start:** `active`
- **Note:** This is a single task that tracks behavior throughout the mission

**Completion Reward:** Debrief acknowledgment: "Perfect stealth. No trace of your presence. Textbook operation, Agent."

---

### Optional Objective 3: Moral Engagement

**ID:** `moral_choices`
**Description:** "Engage with the moral complexity of the mission"
**Purpose:** Ensure players encounter moral choice points, deepen narrative engagement
**Reward:** Richer story experience, campaign-level consequences

**Aims:**

#### Aim: Make key moral decisions
**ID:** `engage_moral_choices`
**Description:** "Confront the moral choices in the mission"
**Status at Start:** `locked` (unlocks when evidence gathered)

**Tasks:**

##### Task: Decide James Park's fate
- **ID:** `james_choice_made`
- **Type:** In-Game (moral choice)
- **Description:** "Decide whether to protect James Park from collateral damage"
- **Completion:** Player makes choice (warn/evidence/ignore) in Scene 12
- **Ink Tag:** `#complete_task:james_choice_made`
- **Status at Start:** `locked` (unlocks when james_innocence_confirmed)

##### Task: Decide Victoria's fate
- **ID:** `victoria_choice_made`
- **Type:** In-Game (moral choice)
- **Description:** "Confront Victoria Sterling and decide her fate"
- **Completion:** Player makes choice (arrest/recruit/delay) in Scene 13
- **Ink Tag:** `#complete_task:victoria_choice_made`
- **Status at Start:** `locked` (unlocks when all_evidence_collected)

**Completion Reward:** Campaign-level consequences in M4-M9, personalized debrief

---

## Objective-to-World Mapping

This section maps each task to specific rooms, NPCs, interactables, and Ink scripts for implementation.

### Aim 1.1: Establish Undercover Access

**Task: meet_victoria** (`meet_victoria`)
- **Room:** `conference_room_01`
- **NPC:** Victoria Sterling (`npc_victoria`)
- **Interaction:** Dialogue conversation (auto-starts when entering room)
- **Ink Script:** `victoria_meeting.ink`
- **Completion Trigger:** Automatic when conversation starts
- **Ink Tag:** `#complete_task:meet_victoria`
- **Unlocks:** `clone_rfid_card` task

**Task: clone_rfid_card** (`clone_rfid_card`)
- **Room:** `conference_room_01` (same location as meeting)
- **NPC:** Victoria Sterling (proximity target)
- **Interaction:** RFID cloner device (inventory item, proximity-based minigame)
- **Mechanism:** Player must stay within 2 GU of Victoria for 10 seconds
- **Completion Trigger:** Automatic when clone progress reaches 100%
- **Ink Script:** `victoria_meeting.ink` → Post-clone dialogue
- **Ink Tag:** `#complete_task:clone_rfid_card` + `#unlock_aim:network_recon` + `#unlock_aim:gather_evidence`
- **Unlocks:** Nighttime server room access, Aims 1.2 and 1.3

---

### Aim 1.2: Network Reconnaissance

**Task: scan_network** (`scan_network`)
- **Room:** `server_room`
- **Interactable:** VM Terminal (`computer_vm_terminal`)
- **Interaction:** Terminal minigame (command input: nmap)
- **Completion Trigger:** Submit flag `flag{network_scan_complete}` at drop-site terminal
- **Ink Script:** `drop_site_terminal.ink` handles flag submission
- **Ink Tag:** `#complete_task:scan_network` + `#unlock_task:ftp_banner` + `#unlock_task:http_analysis` + `#unlock_task:distcc_exploit`
- **Unlocks:** All service enumeration tasks

**Task: ftp_banner** (`ftp_banner`)
- **Room:** `server_room`
- **Interactable:** VM Terminal (`computer_vm_terminal`)
- **Interaction:** Terminal minigame (command: `nc 192.168.100.50 21`)
- **Completion Trigger:** Submit flag `flag{ftp_intel_gathered}` at drop-site terminal
- **Ink Script:** `drop_site_terminal.ink`
- **Ink Tag:** `#complete_task:ftp_banner`
- **Narrative Event:** Unlocks client codename "GHOST" document (M2 foreshadowing)

**Task: http_analysis** (`http_analysis`)
- **Room:** `server_room`
- **Interactable:** VM Terminal (`computer_vm_terminal`) + CyberChef workstation (`computer_cyberchef`)
- **Interaction:** Terminal (fetch HTTP) → CyberChef (decode Base64)
- **Completion Trigger:** Submit flag `flag{pricing_intel_decoded}` at drop-site terminal
- **Ink Script:** `drop_site_terminal.ink`
- **Ink Tag:** `#complete_task:http_analysis`
- **Narrative Event:** Unlocks pricing intelligence document

**Task: distcc_exploit** (`distcc_exploit`)
- **Room:** `server_room`
- **Interactable:** VM Terminal (`computer_vm_terminal`)
- **Interaction:** Terminal minigame (Metasploit OR manual exploitation)
- **Completion Trigger:** Submit flag `flag{distcc_legacy_compromised}` at drop-site terminal
- **Ink Script:** `drop_site_terminal.ink` + triggers `agent_0x99_m2_revelation.ink`
- **Ink Tag:** `#complete_task:distcc_exploit` + `#unlock_task:find_operational_logs`
- **Narrative Event:** **CRITICAL** - Triggers Agent 0x99 event conversation revealing M2 connection
- **Event Mapping:**
  ```json
  {
    "eventPattern": "objective_task_completed:distcc_exploit",
    "targetKnot": "m2_connection_revealed",
    "autoTrigger": true
  }
  ```

---

### Aim 1.3: Physical Evidence Collection

**Task: decode_whiteboard** (`decode_whiteboard`)
- **Room:** `server_room`
- **Interactable:** Whiteboard (`whiteboard_rot13`) + CyberChef workstation (`computer_cyberchef`)
- **Interaction:** Examine whiteboard (photograph/copy text) → Decode at CyberChef
- **Completion Trigger:** Successful ROT13 decode at CyberChef
- **Ink Script:** `cyberchef_workstation.ink`
- **Ink Tag:** `#complete_task:decode_whiteboard`
- **Reveals:** "MEET WITH THE ARCHITECT - PRIORITIZE INFRASTRUCTURE EXPLOITS"

**Task: access_victoria_computer** (`access_victoria_computer`)
- **Room:** `executive_office`
- **Interactable:** Executive office door (`door_executive`) + Victoria's computer (`computer_victoria`)
- **Interaction:** Lockpick door (OR trust >= 40 grants access) → Login to computer
- **Completion Trigger:** Successful computer login
- **Ink Script:** `computer_login.ink`
- **Ink Tag:** `#complete_task:access_victoria_computer` + `#unlock_task:decode_client_roster`
- **Unlocks:** Email drafts, hex-encoded client files

**Task: decode_client_roster** (`decode_client_roster`)
- **Room:** `executive_office` (find file) → `server_room` (decode)
- **Interactable:** Victoria's computer (`computer_victoria`) → CyberChef workstation (`computer_cyberchef`)
- **Interaction:** Copy hex-encoded file → Decode at CyberChef
- **Completion Trigger:** Successful hex decode
- **Ink Script:** `cyberchef_workstation.ink`
- **Ink Tag:** `#complete_task:decode_client_roster`
- **Reveals:** Client list (Ransomware Incorporated, Critical Mass, Social Fabric)

**Task: find_operational_logs** (`find_operational_logs`)
- **Room:** `server_room`
- **Interactable:** File appears after `distcc_exploit` completed
- **Interaction:** Examine operational logs text file
- **Completion Trigger:** Player reads file (auto-appears post-distcc)
- **Ink Script:** `operational_logs_discovery.ink` (event-triggered)
- **Ink Tag:** `#complete_task:find_operational_logs`
- **Event Mapping:**
  ```json
  {
    "eventPattern": "objective_task_completed:distcc_exploit",
    "spawnItem": "operational_logs.txt",
    "location": "server_room"
  }
  ```
- **Narrative Event:** **MIDPOINT TWIST** - ProFTPD sale to GHOST for $12,500 revealed

---

### Optional Objectives Mapping

**LORE Fragment 1** (`lore_fragment_1`)
- **Room:** `executive_office`
- **Interactable:** Filing cabinet (`container_filing_cabinet`)
- **Interaction:** Lockpick filing cabinet → Pickup text_file
- **Completion Trigger:** Item pickup
- **Ink Tag:** `#complete_task:lore_fragment_1`

**LORE Fragment 2** (`lore_fragment_2`)
- **Room:** `executive_office`
- **Interactable:** Wall safe (`container_safe`)
- **Interaction:** Enter PIN (2010) → Pickup text_file
- **Completion Trigger:** Item pickup
- **Ink Tag:** `#complete_task:lore_fragment_2`

**LORE Fragment 3** (`lore_fragment_3`)
- **Room:** `executive_office`
- **Interactable:** Hidden USB drive in desk drawer (`container_desk_drawer`) → CyberChef
- **Interaction:** Find USB → Decode Base64 → Decode ROT13
- **Completion Trigger:** Successful double-decode
- **Ink Script:** `cyberchef_workstation.ink`
- **Ink Tag:** `#complete_task:lore_fragment_3`

**Perfect Stealth** (`zero_detection`)
- **Tracking:** Global variable `guard_detected` must remain `false`
- **Evaluated:** At mission end (debrief)
- **Completion Trigger:** Automatic if guard_detected == false throughout mission
- **Ink Tag:** `#complete_task:zero_detection` (in debrief script)

**James Choice** (`james_choice_made`)
- **Room:** `james_office` (optional investigation)
- **Interactable:** James's desk, computer, family photo
- **Interaction:** Dialogue choice point after discovering innocence evidence
- **Completion Trigger:** Player selects choice (warn/evidence/ignore)
- **Ink Script:** `james_protection_choice.ink`
- **Ink Tag:** `#complete_task:james_choice_made`

**Victoria Choice** (`victoria_choice_made`)
- **Room:** `executive_office` OR `hallway` (player chooses confrontation location)
- **Interactable:** Victoria Sterling NPC (optional confrontation)
- **Interaction:** Dialogue choice point (arrest/recruit/delay)
- **Completion Trigger:** Player selects choice
- **Ink Script:** `victoria_confrontation.ink`
- **Ink Tag:** `#complete_task:victoria_choice_made`

---

**Status:** ✅ COMPLETE (Part 3/3 complete)
**Next:** Create objectives JSON structure
