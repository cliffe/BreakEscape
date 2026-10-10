> ⚠️ **SUPERSEDED (2026-08-21).** These stage documents describe the original **water-treatment**
> concept for m04 (chlorine dosing, Dec 2025). The mission was rebuilt as **grid battery storage**
> (Albion Energy Storage) and then aligned to the m01 standard. They are kept for historical
> reference only. The authoritative design is `scenarios/m04_critical_failure/ALIGNMENT_PLAN.md`;
> the current implementation is the scenario and ink files themselves.

# Mission 4: "Critical Failure" - Stage 4: Player Objectives & Task Structure

**Mission ID:** m04_critical_failure
**Stage:** 4 - Player Objectives and Task Structure
**Version:** 1.0
**Date:** 2025-12-28

---

## Overview

This document defines the complete mission objective structure, task breakdown, progression logic, and integration with VM challenges for Mission 4 "Critical Failure." The objective system guides players through facility infiltration, threat investigation, SCADA network analysis, and crisis intervention while supporting multiple playstyles and choices.

---

## Mission Objective Philosophy

### Design Principles

1. **Guided Investigation:** Objectives provide direction without excessive hand-holding
2. **Multiple Approaches:** Tasks support stealth, social engineering, and combat paths
3. **Progressive Discovery:** Early objectives lead naturally to later revelations
4. **Player Agency:** Critical choices reflected in objective structure
5. **VM Integration:** Technical challenges integrated as narrative investigation steps
6. **Clear Success Criteria:** Players always know what needs to be accomplished

### Difficulty Targeting

- **Mission Tier:** Intermediate (Mission 4 of Season 1)
- **Playtime Target:** 60-80 minutes
- **Complexity:** Multi-layered investigation with combat and technical elements
- **Required Skills:** All M1-M3 mechanics + new combat system

---

## Mission Objectives Structure

Mission 4 uses a **3-objective structure** aligned with the 3-act narrative:

1. **"Infiltrate Facility"** (Act 1 - 15-20%)
2. **"Investigate SCADA Compromise"** (Act 2 - 50-60%)
3. **"Neutralize Attack Threat"** (Act 3 - 20-30%)

Each objective contains multiple tasks that can be completed in various orders (where logical).

---

## Objective 1: "Infiltrate Facility and Confirm Threat"

**Order:** 0 (first objective)
**Narrative Context:** Act 1 - Player enters facility under cover, discovers ENTROPY infiltration
**Estimated Time:** 12-16 minutes
**Urgency Stage:** Stage 1 (Infiltration/Discovery) → Stage 2 (System Compromise)

### Tasks

#### Task 1.1: Enter Water Treatment Facility

**Task ID:** `enter_facility`
**Type:** `enter_room`
**Status:** Active (unlocked at mission start)
**Required:** Yes

**Description:**
"Enter the Pacific Northwest Regional Water Treatment Facility using your cover identity as a state auditor."

**Implementation:**
- Player must enter Room "Main Entrance"
- Completion triggers upon room entry

**Approach Options:**
- **Primary:** Social engineering with credentials at security checkpoint
- **Alternative:** Stealth via loading dock
- **Advanced:** RFID clone from employee badge in parking lot

**Completion Triggers:**
- Event: `enter_room` → Main Entrance

**Rewards:**
- Unlocks Task 1.2

---

#### Task 1.2: Meet with Facility Manager

**Task ID:** `meet_robert_chen`
**Type:** `npc_conversation`
**Status:** Locked (requires Task 1.1)
**Required:** Yes

**Description:**
"Locate Robert Chen, the facility manager, and establish your cover as a state regulatory auditor."

**Implementation:**
- Navigate to Administration Offices
- Initiate conversation with Robert Chen NPC
- Dialogue introduces Chen's character and facility context

**Narrative Function:**
- Establishes player's cover identity
- Introduces Robert Chen's defensive attitude
- Provides facility overview and access

**Completion Triggers:**
- Event: `npc_conversation` → Robert Chen, knot: `initial_meeting_complete`

**Rewards:**
- Unlocks Tasks 1.3 and 1.4 (investigation phase)
- Receives facility keycard (Level 1 access)
- Chen provides facility map

---

#### Task 1.3: Search for Evidence of Infiltration

**Task ID:** `find_infiltration_evidence`
**Type:** `custom`
**Status:** Locked (requires Task 1.2)
**Required:** Yes

**Description:**
"Investigate the facility for signs of ENTROPY infiltration. Check employee records, maintenance logs, and access control systems."

**Implementation:**
- Player must interact with investigation points in Administration or Security Office
- Multiple evidence pieces available:
  - Employee access logs (OptiGrid Solutions maintenance team)
  - Security camera footage gaps
  - Unusual maintenance schedule entries
  - Forged credentials in system

**Evidence Items (at least 1 required):**
- `item: maintenance_logs` (Administration office, desk)
- `item: access_control_logs` (Security office, terminal)
- `item: security_footage_gaps` (Security office, monitor review)

**Completion Triggers:**
- Event: `custom_objective_complete:find_infiltration_evidence`
- Triggered by examining at least one evidence source

**Rewards:**
- Unlocks Task 1.4
- Player gains confirmation of infiltration
- Intel: Three operatives entered facility 2 days ago

---

#### Task 1.4: Identify SCADA System Anomalies

**Task ID:** `identify_scada_anomalies`
**Type:** `custom`
**Status:** Locked (requires Task 1.3)
**Required:** Yes

**Description:**
"Examine SCADA monitoring systems for suspicious activity. Look for unusual parameter changes or system modifications."

**Implementation:**
- Player must access SCADA terminal in Control Room or Security Office
- Observation of SCADA displays reveals anomalies
- Can involve Robert Chen for technical interpretation

**SCADA Anomalies Visible:**
- Chemical dosing parameters slowly increasing
- Unauthorized system modifications logged
- Remote access connections from unknown IPs
- Dosing station 3 showing warning status

**Completion Triggers:**
- Event: `custom_objective_complete:identify_scada_anomalies`
- Triggered by examining SCADA terminal and observing anomalies

**Narrative Impact:**
- Confirms facility systems compromised
- Urgency Stage transitions to Stage 2
- Robert Chen becomes alarmed and cooperative
- Unlocks Objective 2

**Rewards:**
- Objective 1 completion
- Robert Chen reveals true threat
- Player can reveal real mission to Chen (dialogue choice)
- Unlocks Objective 2: "Investigate SCADA Compromise"

---

### Objective 1 Completion Criteria

**Required Tasks:** All 4 tasks (1.1, 1.2, 1.3, 1.4)
**Optional Tasks:** None (all critical for narrative flow)
**Success State:** Player confirmed ENTROPY infiltration and SCADA compromise
**Failure State:** None (investigation cannot fail, only take different paths)

**Narrative Checkpoint:**
- Player understands threat (infrastructure attack on water supply)
- Robert Chen is now ally
- Facility access granted
- Attack timeline established (0800 scheduled trigger)

---

## Objective 2: "Investigate SCADA Compromise and Attack Vector"

**Order:** 1 (second objective)
**Narrative Context:** Act 2 - Multi-system investigation, combat encounters, VM challenges
**Estimated Time:** 40-50 minutes
**Urgency Stage:** Stage 2 (System Compromise) → Stage 3 (Attack Preparation)

### Tasks

#### Task 2.1: Locate Compromised Systems

**Task ID:** `locate_compromised_systems`
**Type:** `enter_room`
**Status:** Locked (requires Objective 1 completion)
**Required:** Yes

**Description:**
"Navigate to the server room to access the facility's network infrastructure and identify compromised systems."

**Implementation:**
- Player must reach Server Room
- Requires Level 2 keycard (obtained from Operative #1 or Chen provides after Obj 1)
- May encounter Operative #1 (Cipher) en route or in Treatment Floor

**Completion Triggers:**
- Event: `enter_room` → Server Room

**Rewards:**
- Unlocks VM challenge tasks (2.2-2.5)
- Access to network investigation terminal
- Flag submission terminal available

---

#### Task 2.2: Scan SCADA Network for Vulnerabilities

**Task ID:** `scan_scada_network`
**Type:** `custom`
**Status:** Locked (requires Task 2.1)
**Required:** Yes

**Description:**
"Use network scanning tools (Nmap) to map the SCADA network topology and identify compromised systems."

**Implementation:**
- VM Challenge: SecGen "Vulnerability Analysis" scenario
- Technical task: Nmap scan of SCADA network range
- Player identifies:
  - Chemical dosing controllers (compromised)
  - Backup SCADA server (vulnerable)
  - Suspicious external connections

**Narrative Context:**
"I need to identify which systems ENTROPY has compromised and map their attack infrastructure."

**VM Flag:** `flag{network_scan_complete}`

**Completion Triggers:**
- Event: `custom_objective_complete:scan_scada_network`
- Triggered by completing network scan within VM

**Rewards:**
- Intelligence: Network topology map
- Identified vulnerable systems
- Unlocks Task 2.3 (flag submission) and Task 2.4 (service investigation)

---

#### Task 2.3: Submit Network Scan Evidence

**Task ID:** `submit_network_scan_flag`
**Type:** `submit_flags`
**Status:** Locked (requires Task 2.2)
**Required:** Yes

**Description:**
"Submit the network scan findings (flag{network_scan_complete}) at the drop-site terminal to document SCADA network compromise."

**Implementation:**
- Player navigates to flag station terminal in Server Room
- Submits flag{network_scan_complete}
- Flagstation accepts VM: `vulnerability_analysis_scada`

**Completion Triggers:**
- Event: `flag_submitted:network_scan_complete`

**Flag Reward:**
- Event emission: `emit_event` → `network_scan_evidence_submitted`
- Unlocks further investigation tasks

**Narrative Function:**
- Documents findings for SAFETYNET intelligence
- Confirms attack infrastructure identified

---

#### Task 2.4: Investigate Compromised Services

**Task ID:** `investigate_compromised_services`
**Type:** `custom`
**Status:** Locked (requires Task 2.2)
**Required:** Yes

**Description:**
"Investigate vulnerable services on the SCADA network. Analyze FTP and HTTP services for attack planning intelligence."

**Implementation:**
- VM Challenge continuation: Service enumeration
- FTP server access (weak credentials)
- HTTP interface analysis (SCADA web control)

**Intelligence Discovered:**

**From FTP (flag{ftp_intel_gathered}):**
- Attack planning documents
- OptiGrid Solutions cover company references
- Facility vulnerability assessments

**From HTTP (flag{http_analysis_complete}):**
- Modified SCADA parameters (Base64-encoded)
- Attack schedule (0800 trigger time)
- Cross-cell coordination evidence (Critical Mass + Social Fabric)

**Completion Triggers:**
- Event: `custom_objective_complete:investigate_compromised_services`
- Triggered by accessing both FTP and HTTP services

**Rewards:**
- Critical intelligence: Cross-cell coordination revealed
- Attack timeline confirmed
- Unlocks Tasks 2.5 and 2.6 (flag submissions)

---

#### Task 2.5: Submit FTP Intelligence Evidence

**Task ID:** `submit_ftp_intel_flag`
**Type:** `submit_flags`
**Status:** Locked (requires Task 2.4)
**Required:** Yes

**Description:**
"Submit FTP intelligence findings (flag{ftp_intel_gathered}) documenting ENTROPY's attack planning materials."

**Implementation:**
- Submit flag{ftp_intel_gathered} at drop-site terminal

**Completion Triggers:**
- Event: `flag_submitted:ftp_intel_gathered`

**Rewards:**
- Intelligence documented
- Agent 0x99 phone call: Confirms cross-cell coordination significance

---

#### Task 2.6: Submit HTTP Analysis Evidence

**Task ID:** `submit_http_analysis_flag`
**Type:** `submit_flags`
**Status:** Locked (requires Task 2.4)
**Required:** Yes

**Description:**
"Submit HTTP analysis evidence (flag{http_analysis_complete}) confirming modified SCADA parameters and attack schedule."

**Implementation:**
- Submit flag{http_analysis_complete} at drop-site terminal

**Completion Triggers:**
- Event: `flag_submitted:http_analysis_complete`

**Rewards:**
- Attack timeline intelligence confirmed
- Unlocks Task 2.7 (exploit vulnerable systems)

---

#### Task 2.7: Exploit Vulnerable SCADA Server

**Task ID:** `exploit_distcc_vulnerability`
**Type:** `custom`
**Status:** Locked (requires Tasks 2.5 and 2.6)
**Required:** Yes

**Description:**
"Exploit the distcc vulnerability on the backup SCADA server to gain access and identify the attack control mechanism."

**Implementation:**
- VM Challenge: distcc exploitation
- Privilege escalation via sudo Baron vulnerability
- Access attack control files
- Discover attack disabling mechanism

**Technical Steps:**
1. Exploit distcc service
2. Gain initial access
3. Escalate privileges (sudo Baron)
4. Access attack control scripts
5. Identify three attack vectors:
   - Physical bypass devices on dosing stations
   - Malicious SCADA control script
   - Remote trigger mechanism

**VM Flag:** `flag{distcc_exploit_complete}`

**Completion Triggers:**
- Event: `custom_objective_complete:exploit_distcc_vulnerability`

**Rewards:**
- Critical intelligence: Complete attack mechanism identified
- Knowledge of three attack vectors (all must be disabled)
- Unlocks Task 2.8 (flag submission)

---

#### Task 2.8: Submit Exploitation Evidence

**Task ID:** `submit_distcc_exploit_flag`
**Type:** `submit_flags`
**Status:** Locked (requires Task 2.7)
**Required:** Yes

**Description:**
"Submit distcc exploitation evidence (flag{distcc_exploit_complete}) documenting attack vector identification."

**Implementation:**
- Submit flag{distcc_exploit_complete} at drop-site terminal

**Completion Triggers:**
- Event: `flag_submitted:distcc_exploit_complete`

**Rewards:**
- Complete attack intelligence documented
- Agent 0x99 phone call: Updates mission priority (capture Voltage if possible)
- Urgency Stage transitions to Stage 3 (Attack Preparation)
- Unlocks Objective 3: "Neutralize Attack Threat"

---

#### Task 2.9 (Optional): Neutralize Operative #1

**Task ID:** `neutralize_operative_cipher`
**Type:** `custom`
**Status:** Locked (available after Task 2.1)
**Required:** No

**Description:**
"Neutralize the ENTROPY operative tampering with chemical dosing systems in the Treatment Floor. Use stealth takedown or direct combat."

**Implementation:**
- Combat encounter with Operative #1 (Cipher)
- Location: Treatment Floor, near Dosing Station 3
- Optional but valuable for items and tactical advantage

**Combat Approaches:**
- Stealth takedown (silent, no alert)
- Direct combat (faster, alerts other operatives)
- Avoidance (skip encounter)

**Completion Triggers:**
- Event: `custom_objective_complete:neutralize_operative_cipher`
- Triggered by defeating Operative #1

**Rewards:**
- Item drops:
  - Level 2 keycard (Server Room access—alternative to Chen providing)
  - Encrypted radio (monitor operative communications)
  - Intelligence note: "Dosing station 3—primary. Stations 1&2—redundancy."
- Tactical advantage: One less operative in later encounters
- Radio monitoring capability

---

#### Task 2.10 (Optional): Neutralize Operative #2

**Task ID:** `neutralize_operative_relay`
**Type:** `custom`
**Status:** Locked (available after Task 2.1)
**Required:** No

**Description:**
"Neutralize the ENTROPY operative patrolling Chemical Storage. Secure master keycard and additional intelligence."

**Implementation:**
- Combat encounter with Operative #2 (Relay)
- Location: Chemical Storage, patrol route
- Optional but provides master keycard and valuable intel

**Combat Approaches:**
- Stealth timing (wait for patrol pattern opening)
- Direct combat (alerts others if radio call succeeds)
- Avoidance (alternate path available)

**Completion Triggers:**
- Event: `custom_objective_complete:neutralize_operative_relay`
- Triggered by defeating Operative #2

**Rewards:**
- Item drops:
  - Master keycard (Maintenance Wing access)
  - OptiGrid Solutions facility access log (shows other compromised facilities)
  - Intelligence: Voltage location in maintenance wing
- Tactical advantage: Easier final encounter
- Additional cross-facility intelligence

---

### Objective 2 Completion Criteria

**Required Tasks:** Tasks 2.1-2.8 (8 tasks)
**Optional Tasks:** Tasks 2.9-2.10 (2 combat encounters)
**Success State:** Player identified complete attack mechanism via VM investigation
**Failure State:** None (investigation progresses at player pace)

**Narrative Checkpoint:**
- All attack vectors identified (physical, network, remote trigger)
- Cross-cell coordination confirmed (Critical Mass + Social Fabric)
- The Architect referenced (campaign revelation building)
- Urgency Stage 3 (Attack Preparation) begins
- Player ready for final confrontation and crisis intervention

---

## Objective 3: "Neutralize Attack Threat"

**Order:** 2 (third objective)
**Narrative Context:** Act 3 - Final confrontation, attack disabling, critical choices
**Estimated Time:** 16-24 minutes
**Urgency Stage:** Stage 3 (Attack Preparation) → Stage 4 (Final Intervention) → Stage 5 (Resolution)

### Tasks

#### Task 3.1: Confront ENTROPY Cell Leader

**Task ID:** `confront_voltage`
**Type:** `custom`
**Status:** Locked (requires Objective 2 completion)
**Required:** Yes

**Description:**
"Locate and confront Voltage, the Critical Mass cell leader, in the Maintenance Wing. Decide whether to prioritize capturing Voltage for intelligence or immediately securing the attack trigger."

**Implementation:**
- Navigate to Maintenance Wing (requires master keycard or alternate entry)
- Combat encounter: Voltage + Operative #3 (Static)
- Player choice affects difficulty and outcome

**Critical Choice: Capture vs. Disable**

**Option A: Prioritize Capture**
- Attempt to capture Voltage alive
- Higher combat difficulty
- Risk: Voltage may attempt to trigger attack
- Reward: High-value intelligence if successful

**Option B: Prioritize Attack Trigger**
- Focus on securing/destroying trigger laptop
- Allows Voltage to escape
- Lower risk to mission success
- Loss: Intelligence gap on The Architect's plans

**Option C: Attempt Both (High Difficulty)**
- Combat skill challenge
- Success: Best outcome (attack stopped, Voltage captured)
- Partial success: One or the other achieved
- Failure: Voltage escapes, attack partially triggers (manageable)

**Completion Triggers:**
- Event: `custom_objective_complete:confront_voltage`
- Multiple outcomes possible:
  - `voltage_captured` = true/false
  - `attack_trigger_secured` = true/false

**Rewards:**
- Attack trigger secured or neutralized
- Voltage captured (if chosen and successful)
- Intelligence documents (planning materials, communications)
- Urgency Stage transitions to Stage 4 (Final Intervention)
- Unlocks Task 3.2 (attack disabling)

---

#### Task 3.2: Disable Attack Mechanisms

**Task ID:** `disable_attack_vectors`
**Type:** `custom`
**Status:** Locked (requires Task 3.1)
**Required:** Yes

**Description:**
"Disable all three attack vectors: physical bypass devices on dosing stations, malicious SCADA control script, and remote trigger mechanism."

**Implementation:**
- Multi-part task requiring three disabling actions
- Complexity varies based on Task 3.1 outcome

**Attack Vector 1: Physical Bypass Devices**
- Location: Chemical Storage, Dosing Stations 1, 2, 3
- Action: Physically remove/disconnect bypass hardware
- Requires: Access to Chemical Storage
- Interaction: Use item on dosing station controls

**Attack Vector 2: Malicious SCADA Script**
- Location: Server Room, backup SCADA server (accessed via VM)
- Action: Delete or neutralize malicious control script
- Requires: VM access from Task 2.7
- Interaction: Terminal command or file deletion

**Attack Vector 3: Remote Trigger Mechanism**
- Location: Maintenance Wing, Voltage's laptop
- Action: Secure and disable trigger mechanism
- Requires: Task 3.1 completion (trigger laptop secured)
- Interaction: Laptop interaction, careful disabling sequence

**Disabling Sequence Options:**

**If Attack Trigger Secured Early (Task 3.1 Option B):**
- Player can methodically disable all three vectors
- Lower time pressure, careful approach
- Robert Chen provides technical guidance
- Puzzle element: Correct disabling sequence to avoid fail-safe

**If Voltage Escaped with Trigger:**
- Voltage initiates attack remotely
- Emergency intervention required
- Time-sensitive manual override sequence
- Higher difficulty but still achievable

**Completion Triggers:**
- Event: `custom_objective_complete:disable_attack_vectors`
- Requires all three attack vectors neutralized
- Variable tracked: `attack_vectors_disabled` = 3/3

**Rewards:**
- Attack prevented
- Chemical contamination avoided
- Urgency Stage transitions to Stage 5 (Resolution)
- Unlocks Task 3.3 (mission completion conversation)

---

#### Task 3.3: Report Mission Outcome

**Task ID:** `report_to_0x99`
**Type:** `npc_conversation`
**Status:** Locked (requires Task 3.2)
**Required:** Yes

**Description:**
"Report the mission outcome to Agent 0x99 and Robert Chen. Decide on public disclosure approach."

**Implementation:**
- Automatic conversation trigger after Task 3.2
- Robert Chen present (Control Room)
- Agent 0x99 via phone/video call

**Critical Choice: Public Disclosure vs. Quiet Patch**

**Option A: Full Public Disclosure**
- Reveal attack attempt and vulnerabilities publicly
- Consequences:
  - Public protected (awareness of risk)
  - Facility reputation damaged
  - Industry-wide security investigations triggered
  - Robert Chen concerned but accepts necessity

**Option B: Quiet Patch**
- Classify incident, patch vulnerabilities quietly
- Consequences:
  - Public uninformed of risk
  - Facility reputation intact
  - Security upgrades done discretely
  - Robert Chen relieved but questions ethics

**Option C: Partial Disclosure**
- Acknowledge "security incident" without details
- Consequences:
  - Balanced approach
  - Moderate public awareness
  - Controlled narrative
  - Robert Chen neutral response

**Narrative Outcomes:**

**If Voltage Captured:**
- Agent 0x99 debriefs on intelligence value
- Interrogation excerpt shown (text/audio)
- Confirms multi-cell coordination
- References The Architect
- Higher-value outcome for campaign

**If Voltage Escaped:**
- Agent 0x99 acknowledges intelligence gap
- Partial success noted
- Voltage becomes potential recurring threat
- Still confirms cross-cell coordination from documents

**Major Campaign Revelation:**
- Agent 0x99 reveals coordinated ENTROPY infrastructure initiative
- Task Force Null formation announced
- Player assigned to specialized anti-Architect team
- Sets up M5-M10 narrative arc

**Completion Triggers:**
- Event: `npc_conversation` → Agent 0x99, knot: `debrief_complete`
- Event: `mission_complete` → global variable

**Rewards:**
- Mission completion
- Campaign progression
- Task Force Null assignment
- Closure conversations with Chen
- Final mission statistics and assessment

---

### Objective 3 Completion Criteria

**Required Tasks:** All 3 tasks (3.1, 3.2, 3.3)
**Optional Tasks:** None (all critical for resolution)
**Success State:** Attack prevented, mission debriefed, choices made
**Failure State:** None (attack can be stopped in all scenarios, consequences vary)

**Mission Completion:**
- Attack fully prevented (full success)
- Minor contamination contained (partial success—if delays occurred)
- All objectives completed
- Campaign revelation delivered
- Player choices recorded for future mission impacts

---

## Optional Objectives Summary

### Combat Encounters (Optional but Valuable)

**Optional Objective A: Neutralize All ENTROPY Operatives**
- Task 2.9: Neutralize Operative #1 (Cipher)
- Task 2.10: Neutralize Operative #2 (Relay)
- Task 3.1 combat component: Defeat Operative #3 (Static) + Voltage

**Rewards for Completion:**
- Item collection (keycards, intelligence documents)
- Tactical advantages (fewer threats in final encounter)
- Complete intelligence picture
- Achievement unlock potential

**Not Required For:**
- Mission completion
- Attack prevention
- Objective progression (alternative paths available)

---

## Task Dependency Map

```
Objective 1: Infiltrate Facility
├─ Task 1.1: Enter Facility [UNLOCKED AT START]
   └─ Task 1.2: Meet Robert Chen
      ├─ Task 1.3: Find Infiltration Evidence
      │  └─ Task 1.4: Identify SCADA Anomalies
      │     └─ [OBJECTIVE 1 COMPLETE] → Unlocks Objective 2

Objective 2: Investigate SCADA Compromise
├─ Task 2.1: Locate Compromised Systems (Server Room)
   ├─ Task 2.2: Scan SCADA Network [VM]
   │  ├─ Task 2.3: Submit Network Scan Flag
   │  └─ Task 2.4: Investigate Compromised Services [VM]
   │     ├─ Task 2.5: Submit FTP Intel Flag
   │     ├─ Task 2.6: Submit HTTP Analysis Flag
   │     └─ Task 2.7: Exploit Distcc Vulnerability [VM]
   │        └─ Task 2.8: Submit Distcc Exploit Flag
   │           └─ [OBJECTIVE 2 COMPLETE] → Unlocks Objective 3
   │
   ├─ Task 2.9: Neutralize Operative #1 [OPTIONAL]
   └─ Task 2.10: Neutralize Operative #2 [OPTIONAL]

Objective 3: Neutralize Attack Threat
├─ Task 3.1: Confront Voltage [CHOICE: Capture vs. Disable]
   └─ Task 3.2: Disable Attack Mechanisms
      └─ Task 3.3: Report Mission Outcome [CHOICE: Disclosure]
         └─ [MISSION COMPLETE]
```

---

## VM Challenge Integration

### SecGen Scenario: "Vulnerability Analysis"

**VM Context:** SCADA network backup server (compromised by ENTROPY)
**Narrative Frame:** Player accessing facility network to identify attack infrastructure

**Challenge 1: Network Scanning (Nmap)**
- **Task:** Task 2.2 (Scan SCADA Network)
- **Flag:** `flag{network_scan_complete}`
- **Submission:** Task 2.3
- **Educational Goal:** Network reconnaissance, SCADA topology understanding

**Challenge 2: Service Enumeration (FTP + HTTP)**
- **Task:** Task 2.4 (Investigate Compromised Services)
- **Flags:**
  - `flag{ftp_intel_gathered}` → Task 2.5 submission
  - `flag{http_analysis_complete}` → Task 2.6 submission
- **Educational Goal:** Service analysis, intelligence gathering from network services

**Challenge 3: Exploitation (distcc + sudo Baron)**
- **Task:** Task 2.7 (Exploit Distcc Vulnerability)
- **Flag:** `flag{distcc_exploit_complete}`
- **Submission:** Task 2.8
- **Educational Goal:** Vulnerability exploitation, privilege escalation, SCADA system access

**VM IP Assignment:** 192.168.100.X (assigned by SecGen)
**VM Title:** "SCADA Network Backup Server"
**Console Access:** Enabled (allow troubleshooting)

**Flag Station Configuration:**
- **ID:** `drop_site_terminal`
- **Location:** Server Room
- **Accepts VMs:** `["vulnerability_analysis_scada"]`
- **Flags Array:** All 4 flags configured with rewards

---

## Success and Failure States

### Mission Success Conditions

**Full Success:**
- All required tasks completed
- Attack fully prevented (zero contamination)
- Attack vectors identified and disabled
- Optional: Voltage captured, all operatives neutralized, complete intelligence gathered

**Partial Success:**
- All required tasks completed
- Attack mostly prevented (minor containable contamination)
- Attack vectors identified but some delay in disabling
- Voltage escaped but attack stopped

**Minimal Success:**
- All required tasks completed
- Attack prevented but with consequences (facility damage, partial contamination)
- Public disclosure required
- Operatives escaped

**Mission Failure:**
- NOT POSSIBLE in current design
- Attack can always be stopped (narrative-driven urgency, not timer)
- Worst case is minimal success with consequences

### Task Failure Handling

**Combat Defeats:**
- Player respawns at previous checkpoint
- Operative remains in position (can retry)
- No permanent failure state

**Investigation Delays:**
- No time-based failures
- Thoroughness rewarded with easier final encounter
- Rushing creates harder but still winnable confrontation

**VM Challenge Difficulty:**
- Hints available (Robert Chen provides SCADA context)
- Flag station accepts flags when found (no time limit)
- Can leave and return to VM (progress saved)

---

## Objective Progression Logic

### Unlocking System

**Linear Unlocking (Required Path):**
- Objective 1 must complete before Objective 2 unlocks
- Objective 2 must complete before Objective 3 unlocks
- Within objectives, some tasks unlock sequentially (investigation flow)

**Parallel Unlocking (Within Objectives):**
- Task 2.9 and 2.10 (combat) can be done during Objective 2 investigation
- VM challenges can be approached in player's preferred order (after 2.1)
- Attack vector disabling (Task 3.2) can be done in any order

**Choice-Based Branching:**
- Task 3.1 outcome affects Task 3.2 difficulty (not availability)
- Task 3.3 disclosure choice affects narrative outcome (not mission completion)

### Event System Integration

**Key Events:**

1. **`enter_room` events:**
   - Trigger task completion (entry-based tasks)
   - Unlock new areas and objectives

2. **`npc_conversation` events:**
   - Track dialogue progress via knot completion
   - Unlock investigation tasks

3. **`custom_objective_complete` events:**
   - Flexible completion triggers for complex tasks
   - VM challenges, combat, investigation

4. **`flag_submitted` events:**
   - Track VM flag submissions
   - Unlock next investigation phase

5. **`global_variable_changed` events:**
   - Mission-critical states (attack_disabled, voltage_captured)
   - Trigger finale sequences

**Event Emission Examples:**

```json
{
  "type": "emit_event",
  "event_name": "scada_anomalies_identified",
  "description": "Player discovered SCADA compromise"
}
```

```json
{
  "type": "emit_event",
  "event_name": "attack_vectors_identified",
  "description": "All three attack mechanisms discovered"
}
```

---

## Player Guidance System

### In-Game Objective Display

**Objective Panel Shows:**
- Current objective title
- Active tasks (unlocked, in-progress)
- Completed tasks (checked off)
- Next logical step highlighted

**Example Display:**

```
OBJECTIVE 2: Investigate SCADA Compromise

✓ Locate Compromised Systems
✓ Scan SCADA Network
✓ Submit Network Scan Evidence
→ Investigate Compromised Services [ACTIVE]
  Submit FTP Intelligence Evidence
  Submit HTTP Analysis Evidence
  ...
```

### Hint System

**Robert Chen Assistance:**
- Available via phone/radio after becoming ally
- Provides technical hints about SCADA systems
- Suggests next investigation steps if player stuck
- Does NOT hand-hold (respects player agency)

**Agent 0x99 Check-ins:**
- Periodic phone calls with strategic guidance
- Confirms player findings (validation)
- Updates mission priorities based on intelligence
- Provides campaign context

**Environmental Cues:**
- SCADA monitors show attack progression visually
- Operative radio chatter provides intelligence (if radio obtained)
- Documents and notes point to next objectives

---

## Integration with Urgency Stages

### Stage 1: Infiltration (Objective 1)
- Objective: Infiltrate and confirm threat
- Urgency: Low, investigative pace
- Visual: Green SCADA, normal operations
- Player can explore freely

### Stage 2: System Compromise (Early Objective 2)
- Objective: Begin SCADA investigation
- Urgency: Moderate, active investigation
- Visual: Yellow warnings appearing
- Player has time for thorough VM work

### Stage 3: Attack Preparation (Late Objective 2)
- Objective: Complete investigation, prepare intervention
- Urgency: High, attack imminent
- Visual: Orange/red warnings, alarms pre-warning
- Player understanding full scope before confrontation

### Stage 4: Final Intervention (Objective 3, Tasks 3.1-3.2)
- Objective: Confront Voltage, disable attack
- Urgency: Maximum, crisis moment
- Visual: Red emergency, alarms active
- Combat and crisis decisions

### Stage 5: Resolution (Task 3.3)
- Objective: Debrief and choices
- Urgency: Declining, stabilizing
- Visual: Systems returning to normal
- Reflection and consequences

**Key Design Note:** Urgency stages progress through player actions (task completion), NOT real-time timers. Player controls pacing.

---

## Success Criteria for Objectives

### Clarity:
- 90%+ players understand what each task requires
- Objective descriptions clear without being patronizing
- Next steps logically flow from current tasks

### Pacing:
- 70%+ players complete mission in 60-80 minute target
- No single task feels excessively long or tedious
- Investigation and combat balanced

### Player Agency:
- Multiple approach paths supported (stealth, combat, social)
- Optional tasks feel valuable but not mandatory
- Choices have visible consequences

### VM Integration:
- 85%+ players understand why they're doing VM challenges (narrative context)
- Flag submission tasks clearly communicated
- VM difficulty appropriate for intermediate players

---

## Stage 4 Completion Checklist

- [x] Complete mission objective structure (3 objectives)
- [x] All required tasks defined with types and triggers
- [x] Optional tasks identified and rewarded
- [x] Task dependency map created
- [x] VM challenge integration fully specified
- [x] Flag submission tasks for all VM flags
- [x] Success/failure states defined
- [x] Objective progression logic documented
- [x] Player guidance system designed
- [x] Integration with urgency stages mapped
- [x] Event system integration planned

---

## Next Stage Preparation

**Stage 5: Room Design and Puzzle Layout**
- Detailed room-by-room layout
- Object placement and interactions
- Lock and puzzle design
- Combat encounter space design
- Item placement and loot distribution
- Environmental puzzle integration

**Key Questions for Stage 5:**
- How do rooms support multiple approach paths?
- What objects and interactions are in each room?
- Where are locks and how do players bypass them?
- How does room design support combat + stealth?

---

**Status:** Stage 4 Complete - Ready for Stage 5
**Estimated Development Time:** 12-14 hours for Stage 4 documentation complete
**Quality Assessment:** Comprehensive objective system with clear task structure, VM integration, player choice implementation, and narrative-driven progression without real-time timers

---

*Stage 4 establishes the complete player-facing objective structure for Mission 4, providing clear guidance while supporting multiple playstyles and meaningful choices. The task system integrates VM challenges as narrative investigation steps, combat encounters as optional tactical advantages, and critical decisions as branching outcomes—all while maintaining tension through stage-based urgency rather than countdown timers.*
