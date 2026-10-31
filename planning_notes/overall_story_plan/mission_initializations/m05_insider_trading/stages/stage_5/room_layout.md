# Room Layout Design: Mission 5 "Insider Trading"

## Overview

**Location:** Quantum Dynamics Corporation - Bay Area Research Campus
**Total Rooms:** 11
**Playable Area:** Medium
**Security Level:** High (Corporate R&D facility with classified government contracts)

**Design Philosophy:**
Hub-and-spoke layout with central corridor providing access to investigation areas. Progressive unlocking creates investigation flow: public areas → employee spaces → secured research areas → executive/evidence locations. Design supports detective work with backtracking required to correlate evidence from multiple locations.

---

## Location Description

**Quantum Dynamics Corporation** occupies a modern single-story research campus in the Bay Area. The facility combines open collaborative spaces with high-security zones protecting classified quantum cryptography research. Glass-walled offices and clean minimalist design reflect Silicon Valley aesthetics, but security infrastructure (badge readers, biometric scanners) reveals the sensitive nature of their DoD contracts.

**Time of Day:** Late afternoon (4:30 PM) - Most employees still working, but some areas quieter
**Atmosphere:** Professional tech campus with undertone of tension. Recent security alerts have staff nervous.
**Security Posture:** Elevated - Visitor management strict, badge access enforced, security logs reviewed

Player arrives as "SAFETYNET security consultant" conducting urgent audit after suspicious data exfiltration detected. Cover story provides access to public areas and interview authority, but secured research zones require investigation to access.

---

## Individual Room Designs

### Room 1: Reception & Security Checkpoint

**ID:** `reception_lobby`
**Dimensions:** 10 × 8 GU
**Usable Space:** 8 × 6 GU
**Type:** Corporate Reception / Security Entry

**Description:**
Modern corporate lobby with floor-to-ceiling windows, Quantum Dynamics logo on accent wall. Security checkpoint with badge reader, visitor sign-in tablet, corporate materials on display. Professional but tense atmosphere.

**Connections:**
- **North:** `main_corridor` (open after check-in)
- **East:** `patricia_office` (locked - requires escort or PATRICIA_BADGE)
- **South:** Exterior (entry point)

**Containers:**
1. **Visitor Sign-In Tablet**
   - **Position:** (3, 2) - Reception desk
   - **Lock:** None (accessible)
   - **Contents:** Digital log showing recent visitors, note about "increased security protocols"
   - **Narrative Purpose:** Establishes recent security concerns, player signs in

2. **Security Desk Drawer**
   - **Position:** (2, 2) - Behind reception desk
   - **Lock:** None (drawer unlocked)
   - **Contents:** Building directory, emergency protocols document
   - **Narrative Purpose:** Provides room layout hints, employee names

**Interactive Objects:**
- **Building Directory Board**
  - **Position:** (1, 4) - West wall
  - **Interaction:** Examine to see department layout
  - **Result:** Note displayed with employee locations (Torres - Cryptography Lead, Office 7; Dr. Chen - Chief Scientist, Lab 3; etc.)

**NPCs:**
- **Patricia Morgan** (In-Person initially, then Phone)
  - **Position:** (4, 3) - Greets player at security checkpoint
  - **Dialogue Trigger:** Automatic on arrival
  - **Gives Items:** Visitor badge (limited access), briefing on situation
  - **Objectives:** `arrive_at_quantum_dynamics`, `meet_patricia_morgan`, `obtain_security_badge`
  - **Note:** After initial meeting, Patricia moves to her office and becomes phone-accessible

**Objectives Completed Here:**
- `arrive_at_quantum_dynamics` - Player enters facility (REQUIRED)
- `meet_patricia_morgan` - Initial briefing with CSO (REQUIRED)
- `obtain_security_badge` - Receive visitor credentials (REQUIRED)

**LORE Fragments:** None

**Technical Notes:**
- Patricia's initial dialogue uses Ink tag `#complete_task:arrive_at_quantum_dynamics`
- Visitor badge added to inventory via `#give_item:visitor_badge`
- After meeting, `#unlock_room:main_corridor` opens access

---

### Room 2: Main Corridor (Hub)

**ID:** `main_corridor`
**Dimensions:** 15 × 6 GU (maximum width to serve as hub)
**Usable Space:** 13 × 4 GU
**Type:** Central Hallway / Navigation Hub

**Description:**
Wide central corridor with polished floors, glass walls showing offices on both sides. Corporate art, motivational posters about "quantum innovation." Badge readers at key junctions. Feels like modern tech campus.

**Connections:**
- **South:** `reception_lobby` (open after check-in)
- **West:** `break_room` (open - visitor badge sufficient)
- **East:** `conference_room` (open - visitor badge sufficient)
- **North (West branch):** `open_office_area` (open - visitor badge sufficient)
- **North (Center):** `server_hallway` (locked - requires EMPLOYEE_BADGE or higher)
- **North (East branch):** `research_lab_entrance` (locked - requires RESEARCH_BADGE)

**Containers:**
1. **Wall-Mounted Directory**
   - **Position:** (6, 2) - Center of corridor
   - **Lock:** None
   - **Contents:** Digital building map (interactive)
   - **Narrative Purpose:** Player orientation, hints at locked areas

**Interactive Objects:**
- **Security Alert Sign**
  - **Position:** (8, 2) - Near server hallway
  - **Interaction:** Read posted notice
  - **Result:** "NOTICE: All badge access logged. Report suspicious activity to Security."

**NPCs:** None (corridor is transition space)

**Objectives Completed Here:** None (navigation hub)

**LORE Fragments:** None

**Technical Notes:**
- Central hub with 6 connections (maximum connectivity)
- Locked doors visibly marked to encourage investigation

---

### Room 3: Break Room / Common Area

**ID:** `break_room`
**Dimensions:** 8 × 8 GU
**Usable Space:** 6 × 6 GU
**Type:** Employee Break Room

**Description:**
Casual employee space with kitchenette, tables, comfortable seating. Notice board with company announcements, event flyers. Coffee station with personality (quirky mugs, local roaster). Feels lived-in, authentic.

**Connections:**
- **East:** `main_corridor` (open)

**Containers:**
1. **Notice Board**
   - **Position:** (1, 4) - West wall
   - **Lock:** None
   - **Contents:** Company announcements, WiFi password sticky note, event calendar
   - **Narrative Purpose:** WiFi password useful for network access tasks, calendar shows Torres often works late

2. **Lost & Found Box**
   - **Position:** (5, 1) - Corner near exit
   - **Lock:** None
   - **Contents:** Random items, LORE Fragment 1 "Insider Threat Initiative Recruiting Pamphlet"
   - **Narrative Purpose:** Optional LORE discovery

**Interactive Objects:**
- **Coffee Station**
  - **Position:** (3, 5) - North wall
  - **Interaction:** Examine
  - **Result:** Observational note: "David's mug hasn't been used today. Unusual - he's usually on his third cup by now."

**NPCs:**
- **Lisa Park** (In-Person, optional)
  - **Position:** (3, 3) - Sitting at table with laptop
  - **Dialogue Trigger:** Player-initiated
  - **Gives Items:** Gossip about Torres' behavior changes, mentions he's been stressed
  - **Objectives:** `talk_to_lisa` (OPTIONAL)

**Objectives Completed Here:**
- `talk_to_lisa` - Interview Lisa Park about office atmosphere (OPTIONAL)

**LORE Fragments:**
- **Fragment 1:** "Insider Threat Initiative - Recruiting Pamphlet"
  - **Position:** Lost & Found box (5, 1)
  - **Unlock Condition:** Always accessible

**Technical Notes:**
- Optional exploration area, not critical path
- WiFi password on notice board can be used for network tasks

---

### Room 4: Conference Room / Evidence Board

**ID:** `conference_room`
**Dimensions:** 10 × 8 GU
**Usable Space:** 8 × 6 GU
**Type:** Meeting Room / Investigation Hub

**Description:**
Large conference room with glass walls, whiteboard, large monitor. Player can use this as investigation hub - correlate evidence, review findings. Whiteboard becomes evidence board where player tracks suspects.

**Connections:**
- **West:** `main_corridor` (open)

**Containers:**
1. **Conference Table Surface**
   - **Position:** (4, 3) - Center of room
   - **Lock:** None
   - **Contents:** Meeting notes left behind mentioning "Project Heisenberg security review scheduled"
   - **Narrative Purpose:** Confirms project name from briefing

**Interactive Objects:**
- **Evidence Board (Whiteboard)**
  - **Position:** (7, 4) - East wall
  - **Interaction:** Use to correlate gathered evidence
  - **Result:** When evidence_level >= 4, triggers `#complete_task:correlate_evidence` and reveals Torres as insider

- **CyberChef Workstation (Laptop)**
  - **Position:** (2, 5) - Corner desk
  - **Interaction:** Use for decoding encrypted messages
  - **Result:** Decryption/encoding tool access

**NPCs:** None

**Objectives Completed Here:**
- `correlate_evidence` - Synthesize all gathered evidence (REQUIRED - unlocks confrontation)

**LORE Fragments:** None

**Technical Notes:**
- Evidence board checks global variable `evidence_level`
- CyberChef workstation accessible throughout mission for decryption tasks

---

### Room 5: Open Office Area (Cubicles)

**ID:** `open_office_area`
**Dimensions:** 12 × 10 GU
**Usable Space:** 10 × 8 GU
**Type:** Shared Workspace / Cubicle Farm

**Description:**
Open floor plan with cubicle workstations, standing desks, collaborative spaces. Mix of occupied and empty desks. Quantum research posters, whiteboards with equations. Active workspace during business hours.

**Connections:**
- **South:** `main_corridor` (open)
- **North:** `torres_office` (locked - requires investigation to identify office, then keycard or access)

**Containers:**
1. **Employee Desk - Station 3**
   - **Position:** (3, 5) - Northwest area
   - **Lock:** None (desk unlocked)
   - **Contents:** Technical manual, password hints sticky note ("pet + year")
   - **Narrative Purpose:** Password patterns hint for systems access

2. **Filing Cabinet (Shared)**
   - **Position:** (8, 2) - Southeast corner
   - **Lock:** PIN lock (code: 0415 - Quantum Dynamics founding date)
   - **Contents:** Employee directory with photos, organizational chart
   - **Narrative Purpose:** Helps identify Torres, shows reporting structure

3. **Printer/Document Station**
   - **Position:** (5, 7) - North wall
   - **Lock:** None
   - **Contents:** Forgotten printout - partial email about "late night server access concerns"
   - **Narrative Purpose:** Hints at suspicious after-hours activity

**Interactive Objects:**
- **Security Logs Terminal**
  - **Position:** (9, 6) - Northeast corner desk
  - **Interaction:** Review badge access logs
  - **Result:** Completes `review_security_logs` task, shows Torres' unusual 2-4 AM access pattern

**NPCs:**
- **Kevin Park** (In-Person)
  - **Position:** (6, 4) - At his desk
  - **Dialogue Trigger:** Player-initiated
  - **Gives Items:** Technical insights, mentions Torres seems "distracted lately"
  - **Objectives:** `interview_kevin` (OPTIONAL)

**Objectives Completed Here:**
- `review_security_logs` - Examine badge access patterns (REQUIRED)
- `identify_upload_pattern` - Correlate logs with data exfiltration (REQUIRED)
- `review_employee_files` - Access organizational info (REQUIRED)
- `interview_kevin` - Optional NPC interview (OPTIONAL)

**LORE Fragments:** None

**Technical Notes:**
- Security logs terminal shows data only after Patricia grants access
- Filing cabinet PIN (0415) can be discovered from company materials or founding date references

---

### Room 6: Server Access Hallway

**ID:** `server_hallway`
**Dimensions:** 8 × 4 GU
**Usable Space:** 6 × 2 GU
**Type:** Secure Transition Corridor

**Description:**
Narrow hallway leading to secure server area. Badge reader prominent on wall, security camera visible. Sterile, utilitarian compared to main corridor. "AUTHORIZED PERSONNEL ONLY" signage.

**Connections:**
- **South:** `main_corridor` (locked - requires EMPLOYEE_BADGE or higher)
- **North:** `server_room` (locked - requires SERVER_ACCESS password)

**Containers:** None (transition space)

**Interactive Objects:**
- **Badge Reader Terminal**
  - **Position:** (3, 1) - West wall
  - **Interaction:** Clone badge from authorized employee
  - **Result:** After cloning employee badge elsewhere, use here to unlock door

**NPCs:** None

**Objectives Completed Here:** None (security checkpoint)

**LORE Fragments:** None

**Technical Notes:**
- First badge-locked door (requires employee badge cloned from NPC or found)
- Creates backtracking: player must obtain badge elsewhere, return here

---

### Room 7: Server Room (VM Access)

**ID:** `server_room`
**Dimensions:** 10 × 10 GU
**Usable Space:** 8 × 8 GU
**Type:** IT Infrastructure / VM Challenge Location

**Description:**
Climate-controlled server room with rack-mounted equipment, blinking LEDs, cable management overhead. Hum of cooling systems. Multiple workstations for server administration. This is where Bludit CMS vulnerability exploitation occurs.

**Connections:**
- **South:** `server_hallway` (locked - requires password: "Heisenberg2024" found in Torres' notes)

**Containers:**
1. **Server Rack Cabinet**
   - **Position:** (6, 6) - Northeast corner
   - **Lock:** Physical lock (requires SERVER_CABINET_KEY)
   - **Contents:** Network diagrams, USB drive with encrypted files, LORE Fragment 2
   - **Narrative Purpose:** Physical evidence of network topology

2. **IT Manager's Desk**
   - **Position:** (2, 2) - Southwest corner
   - **Lock:** None
   - **Contents:** Maintenance logs, sticky note with partial passwords
   - **Narrative Purpose:** Hints for VM access credentials

**Interactive Objects:**
- **VM Access Terminal (Primary)**
  - **Position:** (4, 4) - Center of room
  - **Interaction:** Access Bludit CMS server for exploitation
  - **Result:** Player can begin VM challenges, ssh into target

- **Drop-Site Terminal**
  - **Position:** (7, 4) - East wall
  - **Interaction:** Submit VM flags from Bludit exploitation
  - **Result:** Flags 1-4 submitted here, each increases evidence_level

- **Network Monitoring Screen**
  - **Position:** (1, 6) - North wall
  - **Interaction:** Review real-time network traffic
  - **Result:** Shows active upload to external IP (evidence of ongoing exfiltration)

**NPCs:** None (restricted area, empty during investigation)

**Objectives Completed Here:**
- `discover_bludit_server` - Identify vulnerable CMS server (REQUIRED)
- `submit_flag1` - Submit VM Flag 1 (REQUIRED)
- `submit_flag2` - Submit VM Flag 2 (REQUIRED)
- `submit_flag3` - Submit VM Flag 3 (REQUIRED)
- `submit_flag4` - Submit VM Flag 4 (REQUIRED - unlocks Architect communications)

**LORE Fragments:**
- **Fragment 2:** "The Architect's Communication Protocol"
  - **Position:** Server cabinet (6, 6) - requires cabinet key
  - **Unlock Condition:** After unlocking server cabinet

**Technical Notes:**
- Password "Heisenberg2024" found in Torres' office notes (backtracking required)
- Each VM flag increases `evidence_level` by 1
- Flag 4 specifically unlocks Architect communications showing ENTROPY involvement

---

### Room 8: David Torres' Office (Primary Evidence Location)

**ID:** `torres_office`
**Dimensions:** 8 × 8 GU
**Usable Space:** 6 × 6 GU
**Type:** Private Office / Critical Evidence Site

**Description:**
Personal office of cryptography lead David Torres. Family photos prominent (wife Elena, children Sofia and Miguel), children's drawings on wall. Medical bills visible in "TO PAY" folder. Half-finished coffee. Expired parking permit. Office tells story of desperate father, not villain's lair.

**Connections:**
- **South:** `open_office_area` (locked - requires identifying Torres as suspect, then TORRES_OFFICE_KEY or lockpick)

**Containers:**
1. **Desk Drawer (Top)**
   - **Position:** (3, 3) - Main desk
   - **Lock:** None
   - **Contents:** Family photos, children's artwork, empty prescription bottles
   - **Narrative Purpose:** Humanizing evidence, shows family stress

2. **Filing Cabinet (Personal)**
   - **Position:** (1, 5) - West wall
   - **Lock:** None (unlocked but contents sensitive)
   - **Contents:** Medical bills ($380K total visible), insurance denial letters, loan applications
   - **Narrative Purpose:** Establishes financial motive (medical debt)

3. **Locked Desk Drawer (Bottom)**
   - **Position:** (3, 3) - Main desk, bottom drawer
   - **Lock:** Physical lock (requires DESK_KEY found in Torres' car/locker)
   - **Contents:** Personal journal with agonized entries, server room password note, USB device
   - **Narrative Purpose:** CRITICAL - Journal shows remorse, manipulation by recruiter

4. **Briefcase (Under desk)**
   - **Position:** (4, 2) - Hidden under desk
   - **Lock:** PIN lock (code: 0811 - daughter Sofia's birthday)
   - **Contents:** Encrypted communications with "The Recruiter", exfiltration schedule, account numbers
   - **Narrative Purpose:** CRITICAL - Evidence of ENTROPY contact, operation timeline

**Interactive Objects:**
- **Computer Terminal**
  - **Position:** (3, 4) - On desk
  - **Interaction:** Access (requires Torres' password or bypass)
  - **Result:** Email trail with hospital billing, desperate searches for money, initial contact from "helpful stranger"

- **Whiteboard**
  - **Position:** (5, 5) - East wall
  - **Interaction:** Examine technical notes
  - **Result:** Quantum crypto equations mixed with financial calculations ("$180K... Elena's treatment... no other way")

**NPCs:** None (Torres not in office initially - confrontation happens elsewhere)

**Objectives Completed Here:**
- `access_torres_office` - Enter suspect's private office (REQUIRED)
- `find_medical_bills` - Discover financial motive (REQUIRED)
- `find_journal` - Read Torres' personal journal showing manipulation (REQUIRED)
- `find_usb` - Locate physical evidence of exfiltration (REQUIRED)

**LORE Fragments:** None (personal tragedy, not ENTROPY lore)

**Technical Notes:**
- Briefcase PIN (0811) discoverable from family photos showing Sofia's birthday
- Journal entry critical for "turn double agent" path - shows Torres' radicalization and cognitive dissonance
- Server room password "Heisenberg2024" in locked desk drawer

---

### Room 9: Research Laboratory (Dr. Chen's Domain)

**ID:** `research_lab`
**Dimensions:** 12 × 10 GU
**Usable Space:** 10 × 8 GU
**Type:** Quantum Research Lab

**Description:**
High-tech research laboratory with quantum computing equipment, laser tables, measurement devices. Whiteboards covered with equations. Organized chaos of active research. Dr. Chen's domain - she's protective of her work.

**Connections:**
- **South:** `main_corridor` (locked - requires RESEARCH_BADGE or Dr. Chen's escort)

**Containers:**
1. **Research Equipment Cabinet**
   - **Position:** (8, 6) - Northeast area
   - **Lock:** Biometric (requires Dr. Chen's fingerprint or authorization)
   - **Contents:** Classified research documents, Project Heisenberg specifications
   - **Narrative Purpose:** Shows what Torres was stealing (specific quantum protocols)

2. **Lab Bench Drawers**
   - **Position:** (4, 4) - Central bench
   - **Lock:** None
   - **Contents:** Lab notebooks, equipment manuals, coffee-stained notes
   - **Narrative Purpose:** Establishes lab routine, Dr. Chen's leadership

**Interactive Objects:**
- **Quantum Computer Terminal**
  - **Position:** (6, 7) - North area
  - **Interaction:** Examine (requires high technical skill or Dr. Chen's explanation)
  - **Result:** Confirms Project Heisenberg capabilities, military applications

**NPCs:**
- **Dr. Sarah Chen** (In-Person)
  - **Position:** (5, 5) - Working at central bench
  - **Dialogue Trigger:** Player-initiated
  - **Gives Items:** Technical context about Project Heisenberg, observations about Torres' recent behavior
  - **Objectives:** `interview_chen` (OPTIONAL but valuable)

**Objectives Completed Here:**
- `interview_chen` - Interview Chief Scientist (OPTIONAL - provides technical context)

**LORE Fragments:**
- **Fragment 3:** "Project Heisenberg - Quantum Key Distribution Specifications"
  - **Position:** Research cabinet (8, 6) - requires biometric access
  - **Unlock Condition:** After gaining Dr. Chen's cooperation or bypassing biometric

**Technical Notes:**
- Dr. Chen can provide research badge access if player builds trust
- Optional area but provides valuable context about what's being stolen

---

### Room 10: Patricia Morgan's Office (CSO Office)

**ID:** `patricia_office`
**Dimensions:** 8 × 7 GU
**Usable Space:** 6 × 5 GU
**Type:** Executive Office / Security Operations

**Description:**
Corner office with view, professional security certifications on wall, multiple monitors showing security feeds. Organized, no-nonsense workspace. Patricia's command center for corporate security.

**Connections:**
- **West:** `reception_lobby` (locked initially, opens after meeting Patricia)
- **North:** `main_corridor` (connects via executive hallway)

**Containers:**
1. **Security Filing Cabinet**
   - **Position:** (1, 3) - West wall
   - **Lock:** RFID keycard (requires PATRICIA_BADGE)
   - **Contents:** Incident reports, security audit findings, employee background checks
   - **Narrative Purpose:** Official security records, shows Torres passed all checks

2. **Desk Safe**
   - **Position:** (4, 1) - Under desk
   - **Lock:** PIN lock (code: 1776 - Patricia's military background)
   - **Contents:** Classified contract documents, DoD liaison contact info
   - **Narrative Purpose:** Shows government oversight, stakes of breach

**Interactive Objects:**
- **Security Monitor Bank**
  - **Position:** (5, 4) - East wall
  - **Interaction:** Review camera feeds
  - **Result:** Can review badge access footage, identify late-night movements

**NPCs:**
- **Patricia Morgan** (Phone accessible after initial meeting)
  - **Position:** N/A (phone chat)
  - **Dialogue Trigger:** Player calls via phone
  - **Gives Items:** Security clearances, authorization for access
  - **Objectives:** `inform_patricia` (OPTIONAL - inform about findings)

**Objectives Completed Here:**
- `inform_patricia` - Update CSO on investigation progress (OPTIONAL)

**LORE Fragments:** None

**Technical Notes:**
- Patricia accessible via phone throughout mission for guidance
- Security monitor provides visual confirmation of findings

---

### Room 11: Archive / Storage Room

**ID:** `archive_storage`
**Dimensions:** 6 × 8 GU
**Usable Space:** 4 × 6 GU
**Type:** Document Storage / Records

**Description:**
Utilitarian storage room with file boxes, archived documents, old equipment. Less organized than active areas. Good place to hide evidence or find forgotten items.

**Connections:**
- **East:** `open_office_area` (locked - requires STORAGE_KEY found during investigation)

**Containers:**
1. **Archive File Boxes**
   - **Position:** (2, 4) - Center storage
   - **Lock:** None
   - **Contents:** Old employee records, previous security incidents, Torres' original background check
   - **Narrative Purpose:** Shows Torres' clean history, makes current situation tragic

2. **Equipment Locker**
   - **Position:** (1, 1) - Southwest corner
   - **Lock:** Physical lock (requires LOCKER_KEY or lockpick)
   - **Contents:** Old IT equipment, forgotten USB drives, LORE Fragment 4
   - **Narrative Purpose:** Optional exploration reward

**Interactive Objects:** None

**NPCs:** None

**Objectives Completed Here:**
- `patch_zero_days` - If player accesses archived security tools (OPTIONAL)

**LORE Fragments:**
- **Fragment 4:** "Insider Threat Initiative - Target Selection Criteria"
  - **Position:** Equipment locker (1, 1)
  - **Unlock Condition:** After unlocking locker

**Technical Notes:**
- Optional area, not critical path
- Storage key found in break room or obtained from maintenance staff

---

## Overall Map Layout

```
                    [ARCHIVE]
                        |
    [RESEARCH LAB]──[OPEN OFFICE]──[TORRES OFFICE]
          |              |               |
    [MAIN CORRIDOR]──────┴───────────────┘
          |
    ┌─────┴─────────┬────────────────┐
    |               |                |
[PATRICIA    [CONFERENCE      [BREAK ROOM]
 OFFICE]      ROOM w/           (Lost & Found:
              Evidence           LORE Frag 1)
              Board +
              CyberChef]
    |
[RECEPTION]
    |
  (ENTRY)


[MAIN CORRIDOR] (continued north):
    |
    ├──[SERVER HALLWAY]──[SERVER ROOM]
    |   (Badge Lock)      (Password Lock)
    |                     • VM Terminal
    |                     • Drop-Site Terminal
    |                     • LORE Fragment 2
    └──[Research Lab Entrance]
        (Research Badge)
```

**Legend:**
- ──│ : Open connections
- [CAPS] : Locked initially
- • : Key objective locations

**Flow Pattern:**
1. Entry → Reception → Main Corridor (hub)
2. Hub branches: Break Room, Conference Room, Open Office, Locked Areas
3. Investigation gathers evidence → unlock secured areas
4. Backtracking to correlate findings at Evidence Board
5. Final access to Torres Office → Confrontation

---

## Objectives-to-Room Mapping

### OBJECTIVE 1: Investigate the Threat

#### AIM 1.1: Gain Access to Quantum Dynamics

**Task: arrive_at_quantum_dynamics** (`arrive_at_quantum_dynamics`)
- **Room:** `reception_lobby` - Reception & Security Checkpoint
- **Interaction:** Automatic on scene load
- **Completion Method:** Ink tag `#complete_task:arrive_at_quantum_dynamics` in opening dialogue

**Task: meet_patricia_morgan** (`meet_patricia_morgan`)
- **Room:** `reception_lobby` - Reception & Security Checkpoint
- **Interaction:** NPC Patricia Morgan (in-person initial meeting)
- **Completion Method:** Ink tag `#complete_task:meet_patricia_morgan` after briefing dialogue

**Task: obtain_security_badge** (`obtain_security_badge`)
- **Room:** `reception_lobby` - Reception & Security Checkpoint
- **Interaction:** Receive visitor badge from Patricia
- **Completion Method:** Ink tag `#give_item:visitor_badge` + `#complete_task:obtain_security_badge`

#### AIM 1.2: Conduct Initial Investigation

**Task: review_security_logs** (`review_security_logs`)
- **Room:** `open_office_area` - Security Logs Terminal
- **Interaction:** Terminal at (9, 6) - northeast corner
- **Completion Method:** Ink tag `#complete_task:review_security_logs` after examining access logs

**Task: identify_upload_pattern** (`identify_upload_pattern`)
- **Room:** `open_office_area` - Security Logs Terminal
- **Interaction:** Same terminal, correlate with network data
- **Completion Method:** Ink tag `#complete_task:identify_upload_pattern` after analysis

**Task: review_employee_files** (`review_employee_files`)
- **Room:** `open_office_area` - Filing Cabinet
- **Interaction:** Shared filing cabinet at (8, 2), PIN: 0415
- **Completion Method:** Ink tag `#complete_task:review_employee_files` after accessing directory

**Task: talk_to_lisa** (`talk_to_lisa`) - OPTIONAL
- **Room:** `break_room` - Break Room / Common Area
- **Interaction:** NPC Lisa Park at (3, 3)
- **Completion Method:** Ink tag `#complete_task:talk_to_lisa` in dialogue

---

### OBJECTIVE 2: Gather Intelligence

#### AIM 2.1: Exploit Bludit Server (VM Challenge)

**Task: discover_bludit_server** (`discover_bludit_server`)
- **Room:** `server_room` - Server Room
- **Interaction:** VM Access Terminal at (4, 4)
- **Completion Method:** Ink tag `#complete_task:discover_bludit_server` on first access

**Task: submit_flag1** (`submit_flag1`)
- **Room:** `server_room` - Server Room
- **Interaction:** Drop-Site Terminal at (7, 4)
- **Completion Method:** Ink tag `#complete_task:submit_flag1` + `#increment:evidence_level`

**Task: submit_flag2** (`submit_flag2`)
- **Room:** `server_room` - Server Room
- **Interaction:** Drop-Site Terminal at (7, 4)
- **Completion Method:** Ink tag `#complete_task:submit_flag2` + `#increment:evidence_level`

**Task: submit_flag3** (`submit_flag3`)
- **Room:** `server_room` - Server Room
- **Interaction:** Drop-Site Terminal at (7, 4)
- **Completion Method:** Ink tag `#complete_task:submit_flag3` + `#increment:evidence_level`

**Task: submit_flag4** (`submit_flag4`)
- **Room:** `server_room` - Server Room
- **Interaction:** Drop-Site Terminal at (7, 4)
- **Completion Method:** Ink tag `#complete_task:submit_flag4` + `#increment:evidence_level` + unlock Architect comms

#### AIM 2.2: Collect Physical Evidence

**Task: access_torres_office** (`access_torres_office`)
- **Room:** `torres_office` - David Torres' Office
- **Interaction:** Enter room (requires identification + key/lockpick)
- **Completion Method:** Ink tag `#complete_task:access_torres_office` on room entry

**Task: find_medical_bills** (`find_medical_bills`)
- **Room:** `torres_office` - David Torres' Office
- **Interaction:** Filing Cabinet (Personal) at (1, 5)
- **Completion Method:** Ink tag `#complete_task:find_medical_bills` + `#increment:evidence_level` when examined

**Task: find_journal** (`find_journal`)
- **Room:** `torres_office` - David Torres' Office
- **Interaction:** Locked Desk Drawer at (3, 3) - requires DESK_KEY
- **Completion Method:** Ink tag `#complete_task:find_journal` + `#increment:evidence_level` when read

**Task: find_usb** (`find_usb`)
- **Room:** `torres_office` - David Torres' Office
- **Interaction:** Locked Desk Drawer at (3, 3) - same location as journal
- **Completion Method:** Ink tag `#complete_task:find_usb` + `#give_item:exfiltration_device`

**Task: correlate_evidence** (`correlate_evidence`)
- **Room:** `conference_room` - Conference Room / Evidence Board
- **Interaction:** Evidence Board (Whiteboard) at (7, 4)
- **Completion Method:** Ink conditional - if `evidence_level >= 4`: `#complete_task:correlate_evidence` + `#unlock_aim:stop_operation_schrodinger`

#### AIM 2.3: Interview Team Members (All OPTIONAL)

**Task: interview_chen** (`interview_chen`)
- **Room:** `research_lab` - Research Laboratory
- **Interaction:** NPC Dr. Sarah Chen at (5, 5)
- **Completion Method:** Ink tag `#complete_task:interview_chen` in dialogue

**Task: interview_park** (`interview_park`)
- **Room:** `break_room` - Break Room (same as talk_to_lisa but deeper conversation)
- **Interaction:** NPC Lisa Park at (3, 3)
- **Completion Method:** Ink tag `#complete_task:interview_park` in dialogue

**Task: interview_johnson** (`interview_johnson`)
- **Room:** `open_office_area` - Open Office Area
- **Interaction:** NPC (additional engineer) at designated position
- **Completion Method:** Ink tag `#complete_task:interview_johnson`

**Task: interview_kevin** (`interview_kevin`)
- **Room:** `open_office_area` - Open Office Area
- **Interaction:** NPC Kevin Park at (6, 4)
- **Completion Method:** Ink tag `#complete_task:interview_kevin`

**Task: inform_patricia** (`inform_patricia`)
- **Room:** `patricia_office` (phone accessible from anywhere)
- **Interaction:** Phone chat with Patricia Morgan
- **Completion Method:** Ink tag `#complete_task:inform_patricia` in dialogue

---

### OBJECTIVE 3: Stop Operation Schrödinger

#### AIM 3.1: Confront the Insider

**Task: locate_torres** (`locate_torres`)
- **Room:** `torres_office` OR `server_room` (confrontation location - player finds him)
- **Interaction:** NPC David Torres appears after evidence gathered
- **Completion Method:** Ink tag `#complete_task:locate_torres` on confrontation start

**Task: present_evidence** (`present_evidence`)
- **Room:** Same as confrontation location
- **Interaction:** Dialogue choice to show findings
- **Completion Method:** Ink tag `#complete_task:present_evidence` in dialogue

**Task: reveal_entropy_plan** (`reveal_entropy_plan`)
- **Room:** Same as confrontation location
- **Interaction:** Show Architect communications from Flag 4
- **Completion Method:** Ink tag `#complete_task:reveal_entropy_plan` when player reveals truth

**Task: make_critical_choice** (`make_critical_choice`) - BRANCHING
- **Room:** Same as confrontation location
- **Interaction:** Dialogue choice tree (4 paths)
- **Completion Method:** Ink tags:
  - `#complete_task:make_critical_choice` + `#set:final_choice:turn_double_agent`
  - `#complete_task:make_critical_choice` + `#set:final_choice:arrest`
  - `#complete_task:make_critical_choice` + `#set:final_choice:sympathetic_release`
  - `#complete_task:make_critical_choice` + `#set:final_choice:public_exposure`

#### AIM 3.2: Prevent Final Exfiltration

**Task: stop_upload** (`stop_upload`)
- **Room:** `server_room` - Server Room
- **Interaction:** Network Monitoring Screen at (1, 6) or VM terminal
- **Completion Method:** Ink tag `#complete_task:stop_upload` after shutdown action

**Task: secure_data** (`secure_data`)
- **Room:** `server_room` - Server Room
- **Interaction:** Server access, data preservation
- **Completion Method:** Ink tag `#complete_task:secure_data` after verification

**Task: patch_zero_days** (`patch_zero_days`) - OPTIONAL
- **Room:** `server_room` or `archive_storage`
- **Interaction:** Access security tools
- **Completion Method:** Ink tag `#complete_task:patch_zero_days`

**Task: update_security** (`update_security`) - OPTIONAL
- **Room:** `server_room`
- **Interaction:** Implement new security protocols
- **Completion Method:** Ink tag `#complete_task:update_security`

#### AIM 3.3: Report Mission Outcome

**Task: trigger_debrief** (`trigger_debrief`) - AUTOMATIC
- **Room:** Any (triggers on mission completion conditions)
- **Interaction:** Automatic when final choice made + threat stopped
- **Completion Method:** Ink tag `#complete_task:trigger_debrief` → scene transition

**Task: complete_debrief** (`complete_debrief`)
- **Room:** SAFETYNET HQ (cutscene)
- **Interaction:** Agent 0x99 debrief dialogue
- **Completion Method:** Ink tag `#complete_task:complete_debrief` at end of debrief

---

## Progressive Unlocking Flow

**Initial State (Mission Start):**
- ✅ **Accessible:**
  - `reception_lobby` - Reception & Security Checkpoint (entry point)

**After Task: meet_patricia_morgan**
- 🔓 **Unlocks:** `main_corridor` via visitor badge
- ✅ **Now Accessible:**
  - `reception_lobby`
  - `main_corridor` (hub)
  - `break_room` (open from corridor)
  - `conference_room` (open from corridor)
  - `open_office_area` (open from corridor)
  - `patricia_office` (accessible via phone chat)
- 🔒 **Still Locked:**
  - `server_hallway` (requires EMPLOYEE_BADGE)
  - `torres_office` (requires identification as suspect + key)
  - `research_lab` (requires RESEARCH_BADGE or Dr. Chen escort)
  - `archive_storage` (requires STORAGE_KEY)

**After Task: review_security_logs + identify_upload_pattern**
- 🎯 **Investigation Progress:** Player identifies suspicious access pattern → narrows suspect pool
- 🔍 **Unlocks Investigation Path:** Torres identified as primary suspect
- 🔒 **Torres' office now targetable** (still physically locked)

**After Task: Clone Employee Badge OR Social Engineer Access**
- 🔓 **Unlocks:** `server_hallway` via EMPLOYEE_BADGE (cloned from Kevin or other NPC)
- ✅ **Now Accessible:**
  - All previous rooms
  - `server_hallway` (transition to secure area)
- 🔒 **Still Locked:**
  - `server_room` (requires password: "Heisenberg2024")
  - `torres_office` (requires TORRES_OFFICE_KEY or lockpick)
  - `research_lab` (requires RESEARCH_BADGE)

**After Task: Access Torres' Office (find key OR use lockpick)**
- 🔓 **Unlocks:** `torres_office` via TORRES_OFFICE_KEY or lockpicking
- 🔍 **Critical Evidence Found:**
  - Locked desk drawer contains server room password "Heisenberg2024"
  - Medical bills → evidence_level +1
  - Journal → evidence_level +1
  - Briefcase PIN (0811) contains ENTROPY communications
- ✅ **Now Accessible:**
  - All previous rooms
  - `torres_office` (CRITICAL EVIDENCE LOCATION)

**After Task: Find Server Room Password in Torres' Desk**
- 🔓 **Unlocks:** `server_room` via password "Heisenberg2024"
- ✅ **Now Accessible:**
  - All previous rooms
  - `server_room` (VM ACCESS + FLAG SUBMISSION)

**After Task: Submit VM Flags (Flag 1-4)**
- 📊 **Evidence Progression:**
  - Flag 1 → evidence_level +1
  - Flag 2 → evidence_level +1
  - Flag 3 → evidence_level +1
  - Flag 4 → evidence_level +1 + unlocks Architect communications
- 🎯 **After Flag 4:** ENTROPY involvement confirmed via Architect's messages

**After Condition: evidence_level >= 4**
- 🔓 **Unlocks:** Confrontation option at Evidence Board
- 🎯 **Player can now:** Correlate all evidence → identify Torres → proceed to confrontation
- ✅ **Progression:** `#unlock_aim:stop_operation_schrodinger` enables final act

**Optional Unlocks:**

**If player gains Dr. Chen's trust:**
- 🔓 **Unlocks:** `research_lab` via escort or borrowed RESEARCH_BADGE
- 📚 **Contains:** Project Heisenberg specifications (context for what's stolen)

**If player finds Storage Key:**
- 🔓 **Unlocks:** `archive_storage` via STORAGE_KEY
- 📚 **Contains:** LORE Fragment 4, Torres' background check (clean record)

**Final State (All Areas Accessible):**
- ✅ **All 11 rooms unlocked**
- 🎯 **Ready for Confrontation:** evidence_level >= 4, all critical evidence gathered
- 🏆 **S-Rank Path:** All optional areas explored, all interviews conducted

---

## Lock Variety Analysis

**Lock Types Used:**
- [X] PIN codes (cognitive puzzles)
- [X] Physical keys (exploration rewards)
- [X] RFID/Keycards (social engineering, cloning)
- [X] Passwords (investigation, note discovery)
- [X] Biometric (advanced security - Dr. Chen's fingerprint)

**Lock Progression Order:**

**1. Filing Cabinet - PIN Lock (Easy)**
- **Location:** `open_office_area` - Shared filing cabinet
- **Type:** PIN code
- **Code:** 0415 (Quantum Dynamics founding date)
- **Unlock Method:** Company founding date discoverable in lobby materials, company website references
- **Difficulty:** Easy (hint available nearby)
- **Rewards:** Employee directory with photos, organizational chart
- **Blocks Critical Path:** Yes (need to identify Torres)

**2. Torres' Briefcase - PIN Lock (Medium)**
- **Location:** `torres_office` - Under desk
- **Type:** PIN code
- **Code:** 0811 (Sofia's birthday)
- **Unlock Method:** Family photos show "Happy 8th Birthday Sofia! 08/11"
- **Difficulty:** Medium (requires examining family photos carefully)
- **Rewards:** ENTROPY communications with Recruiter, exfiltration schedule
- **Blocks Critical Path:** Yes (critical evidence)

**3. Patricia's Safe - PIN Lock (Medium)**
- **Location:** `patricia_office` - Under desk
- **Type:** PIN code
- **Code:** 1776 (Patriotic reference to Patricia's military background)
- **Unlock Method:** Security certifications on wall mention "USMC 1976-1996", patriotic theme
- **Difficulty:** Medium (thematic deduction)
- **Rewards:** Classified contract documents, DoD liaison info
- **Blocks Critical Path:** No (optional context)

**4. Torres' Desk Drawer - Physical Key Lock (Medium)**
- **Location:** `torres_office` - Bottom desk drawer
- **Type:** Physical key
- **Key Source:** DESK_KEY found in Torres' car (parking lot item) or locker in break room
- **Difficulty:** Medium (requires finding key in different location)
- **Rewards:** Journal (proves manipulation), server room password, USB device
- **Blocks Critical Path:** Yes (contains server password)
- **Used BEFORE lockpick obtained:** ✅ Yes

**5. Server Hallway - RFID Keycard (Medium)**
- **Location:** `server_hallway` - Badge reader
- **Type:** RFID keycard
- **Card Required:** EMPLOYEE_BADGE
- **Unlock Method:** Clone badge from Kevin Park or other employee via social engineering/proximity
- **Difficulty:** Medium (social engineering + badge cloning mechanic)
- **Rewards:** Access to server room corridor
- **Blocks Critical Path:** Yes

**6. Server Room - Password Lock (Hard)**
- **Location:** `server_room` - Door terminal
- **Type:** Password
- **Password:** "Heisenberg2024"
- **Unlock Method:** Found in Torres' locked desk drawer (requires finding desk key first)
- **Difficulty:** Hard (multi-step: find desk key → unlock drawer → read note)
- **Rewards:** VM access, flag submission, network monitoring
- **Blocks Critical Path:** Yes (VM challenges required)

**7. Research Cabinet - Biometric Lock (Hard)**
- **Location:** `research_lab` - Equipment cabinet
- **Type:** Biometric (fingerprint)
- **Unlock Method:** Gain Dr. Chen's authorization OR fingerprint spoofing (advanced)
- **Difficulty:** Hard (requires trust-building or technical exploit)
- **Rewards:** Project Heisenberg specifications, LORE Fragment 3
- **Blocks Critical Path:** No (optional deep context)

**8. Equipment Locker - Physical Key Lock (Easy-Medium)**
- **Location:** `archive_storage` - Southwest corner
- **Type:** Physical key OR lockpick
- **Key Source:** LOCKER_KEY or use lockpick
- **Difficulty:** Easy-Medium (lockpick available by this point)
- **Rewards:** LORE Fragment 4, old USB drives
- **Blocks Critical Path:** No (optional LORE)

**9. Server Cabinet - Physical Key Lock (Medium)**
- **Location:** `server_room` - Server rack
- **Type:** Physical key
- **Key Source:** SERVER_CABINET_KEY found during investigation
- **Difficulty:** Medium
- **Rewards:** Network diagrams, LORE Fragment 2
- **Blocks Critical Path:** No (optional technical details)

**Critical Path Lock Sequence:**
1. Filing Cabinet PIN (0415) → Employee directory → Identify Torres
2. Clone Employee Badge → Server hallway access
3. Find Torres Office Key → Access office
4. Torres Desk Key → Server password "Heisenberg2024"
5. Server Room Password → VM access
6. Torres Briefcase PIN (0811) → ENTROPY communications

**Lockpick Availability:**
- Lockpick obtained AFTER keys used in critical path (rooms 3-4)
- Available from Kevin Park after building relationship (influence >= 6)
- OR found in IT office toolkit after investigation begins

**Validation:**
- [X] At least 3 different lock types used: 5 types (PIN, Key, RFID, Password, Biometric)
- [X] Keys used BEFORE lockpick obtainable: Critical desk key required early
- [X] Keys NOT in same room as locks: All keys in different locations
- [X] PIN codes have discoverable hints: All PINs have contextual clues
- [X] Locks ordered easy → medium → hard: Progression from 0415 → multi-step chains
- [X] Lockpick comes AFTER key-based progression: Yes, mid-investigation
- [X] No "same-y" gameplay: 5 different lock types, varied unlock methods

---

## Required Backtracking

**1. Return to Conference Room for Evidence Correlation**
- **Trigger:** After gathering physical evidence (medical bills, journal) AND completing VM flags
- **From:** `server_room` and/or `torres_office`
- **To:** `conference_room` - Evidence Board
- **Purpose:** Correlate all gathered evidence at whiteboard/evidence board
- **Unlocks:** Confirmation of Torres as insider, `#unlock_aim:stop_operation_schrodinger`
- **Design Intent:** Central investigation hub where player synthesizes findings

**2. Return to Server Room After Finding Password**
- **Trigger:** Finding "Heisenberg2024" password in Torres' locked desk drawer
- **From:** `torres_office`
- **To:** `server_room` (via `server_hallway`)
- **Purpose:** Access VM terminal and drop-site for flag submission
- **Unlocks:** Bludit CMS exploitation, 4 VM flags, Architect communications
- **Design Intent:** Classic backtracking - see locked door early, return with key later

**3. Return to Torres Office After Identifying Suspect**
- **Trigger:** After reviewing security logs + employee files → identify Torres
- **From:** `open_office_area` or `conference_room`
- **To:** `torres_office` (need to find office key first)
- **Purpose:** Search suspect's private office for evidence
- **Unlocks:** Critical physical evidence (medical bills, journal, briefcase)
- **Design Intent:** Investigation payoff - ID suspect, then investigate their space

**4. Return to Break Room / Open Office for Social Engineering**
- **Trigger:** After initial exploration, realizing need for employee badge
- **From:** `server_hallway` (encountering locked badge reader)
- **To:** `break_room` or `open_office_area` to interact with Kevin/NPCs
- **Purpose:** Clone employee badge from Kevin Park or other staff
- **Unlocks:** Access to server hallway and beyond
- **Design Intent:** Social engineering puzzle - need to build rapport to get access

**5. Return to Patricia's Office for Authorization**
- **Trigger:** Multiple points - when stuck or needing higher clearance
- **From:** Any location (phone accessible)
- **To:** `patricia_office` (phone chat from anywhere)
- **Purpose:** Request security authorization, discuss findings, get guidance
- **Unlocks:** Security log access, research lab escort, official backing
- **Design Intent:** Handler support system - player can ask for help

**6. Optional: Return to Research Lab After Flag 4**
- **Trigger:** After submitting Flag 4 and unlocking Architect communications
- **From:** `server_room`
- **To:** `research_lab` (if previously accessed)
- **Purpose:** Consult Dr. Chen about quantum crypto implications of breach
- **Unlocks:** Deeper understanding of stolen data's capabilities
- **Design Intent:** Optional narrative enrichment for thorough players

**Backtracking Summary:**
- **Required backtracking moments:** 4 (Evidence Board, Server Room, Torres Office, Badge Cloning)
- **Optional backtracking:** 2 (Patricia consult, Dr. Chen follow-up)
- **Design Pattern:** Hub-and-spoke encourages returning to central corridor, branching out

---

## Container and Lock Summary

### All Containers

| Room | Container Type | Lock Type | Contents | Unlock Condition |
|------|----------------|-----------|----------|------------------|
| Reception | Visitor Tablet | None | Visitor log, security notices | Always accessible |
| Reception | Security Drawer | None | Building directory, emergency protocols | Always accessible |
| Break Room | Notice Board | None | WiFi password, calendar, announcements | Always accessible |
| Break Room | Lost & Found | None | **LORE Fragment 1** | Always accessible |
| Conference Room | Table Surface | None | Meeting notes | Always accessible |
| Open Office | Desk - Station 3 | None | Password hints, manual | Always accessible |
| Open Office | Filing Cabinet | PIN: 0415 | Employee directory, org chart | PIN from company founding date |
| Open Office | Printer Station | None | Forgotten email printout | Always accessible |
| Server Room | Server Cabinet | Physical Key | Network diagrams, **LORE Frag 2** | SERVER_CABINET_KEY |
| Server Room | IT Desk | None | Maintenance logs, password hints | After unlocking room |
| Torres Office | Desk Drawer (Top) | None | Family photos, prescriptions | After accessing office |
| Torres Office | Filing Cabinet | None | Medical bills, insurance denials | After accessing office |
| Torres Office | Desk Drawer (Bottom) | Physical Key | **Journal**, server password, USB | DESK_KEY (in locker/car) |
| Torres Office | Briefcase | PIN: 0811 | **ENTROPY comms**, exfil schedule | Sofia's birthday (0811) |
| Research Lab | Equipment Cabinet | Biometric | Project Heisenberg docs, **LORE Frag 3** | Dr. Chen's authorization |
| Research Lab | Lab Bench | None | Lab notebooks, manuals | After accessing lab |
| Patricia Office | Security Cabinet | RFID Keycard | Incident reports, background checks | PATRICIA_BADGE |
| Patricia Office | Desk Safe | PIN: 1776 | Classified contracts, DoD contacts | Military reference (1776) |
| Archive | File Boxes | None | Old records, Torres background | After accessing archive |
| Archive | Equipment Locker | Physical Key | Old equipment, **LORE Frag 4** | LOCKER_KEY or lockpick |

**Total Containers:** 19 (11 unlocked, 8 locked)
**Total LORE Fragments:** 4 (distributed across 4 rooms)

### All Locks and Keys

| Lock Location | Lock Type | Unlock Method | Key/Code Source | Critical Path? |
|---------------|-----------|---------------|-----------------|----------------|
| Main Corridor → Server Hallway | RFID Badge | Clone employee badge | Kevin Park (social engineering) | YES |
| Server Hallway → Server Room | Password | Enter "Heisenberg2024" | Torres' locked desk drawer | YES |
| Open Office → Torres Office | Physical Key | Use TORRES_OFFICE_KEY | Found during investigation / given by Patricia | YES |
| Open Office Filing Cabinet | PIN: 0415 | Enter founding date | Company materials (lobby, website) | YES |
| Torres Desk Drawer (Bottom) | Physical Key | Use DESK_KEY | Torres' locker in break room OR car (parking) | YES |
| Torres Briefcase | PIN: 0811 | Enter Sofia's birthday | Family photos in office (08/11) | YES |
| Server Room Cabinet | Physical Key | Use SERVER_CABINET_KEY | IT office OR found during investigation | NO |
| Research Lab Entrance | RFID Badge | Dr. Chen's escort OR RESEARCH_BADGE | Build trust with Dr. Chen | NO |
| Research Equipment Cabinet | Biometric | Dr. Chen's fingerprint authorization | Gain Dr. Chen's cooperation | NO |
| Patricia Office Safe | PIN: 1776 | Military/patriotic reference | Security certs mention USMC service | NO |
| Patricia Security Cabinet | RFID Keycard | PATRICIA_BADGE | Patricia provides OR clone | NO |
| Archive Storage | Physical Key | Use STORAGE_KEY OR lockpick | Break room OR maintenance area | NO |
| Archive Equipment Locker | Physical Key | Use LOCKER_KEY OR lockpick | Available mid-investigation | NO |

**Total Locks:** 13 (6 critical path, 7 optional)
**Lock Type Distribution:**
- PIN Codes: 4 (0415, 0811, 1776, + any computer passwords)
- Physical Keys: 5 (Torres office, desk drawer, cabinets)
- RFID Keycards: 3 (server hallway, research lab, Patricia's cabinet)
- Passwords: 1 (server room "Heisenberg2024")
- Biometric: 1 (research cabinet)

---

## NPC Placement Summary

| NPC Name | Room | In-Person/Phone | Initial Position | Dialogue Purpose | Items Given | Tasks |
|----------|------|-----------------|------------------|------------------|-------------|-------|
| Patricia Morgan | `reception_lobby` → Phone | In-Person → Phone | (4, 3) reception area | Mission briefing, authorization, guidance | Visitor badge, security clearances | `meet_patricia_morgan`, `obtain_security_badge`, `inform_patricia` (opt) |
| Lisa Park | `break_room` | In-Person | (3, 3) at table | Office gossip, Torres behavior observations | Insights about Torres | `talk_to_lisa` (opt), `interview_park` (opt) |
| Kevin Park | `open_office_area` | In-Person | (6, 4) at desk | Technical insights, badge cloning target | Employee badge (cloneable), lockpick (if influence high) | `interview_kevin` (opt) |
| Dr. Sarah Chen | `research_lab` | In-Person | (5, 5) at lab bench | Technical context, Project Heisenberg details | Research badge (if trusted), technical explanations | `interview_chen` (opt) |
| David Torres | `torres_office` OR `server_room` | In-Person (confrontation) | Appears after evidence >= 4 | Final confrontation, choice moment | N/A (evidence target) | `locate_torres`, `present_evidence`, `reveal_entropy_plan`, `make_critical_choice` |
| Agent 0x99 | N/A (remote) | Phone | N/A (SAFETYNET HQ) | Handler support, mission guidance, debrief | Mission equipment (pre-start), debrief | `complete_debrief` |

**NPC Mode Strategy:**
- **In-Person NPCs (5):** Patricia (initial), Lisa, Kevin, Dr. Chen, Torres
- **Phone NPCs (2):** Patricia (after meeting), Agent 0x99
- **Transition NPCs:** Patricia starts in-person, becomes phone-accessible

**NPC Interaction Design:**
- **Patricia:** Tutorial + authority figure - provides access, answers questions
- **Lisa:** Optional social path - provides gossip, humanizes Torres
- **Kevin:** Badge cloning target + tech ally - social engineering challenge
- **Dr. Chen:** Technical expert - optional but enriches understanding
- **Torres:** Primary antagonist - sympathetic villain, choice-driven outcome
- **Agent 0x99:** Handler - mission start/end, guidance when stuck

---

## Hybrid Architecture Integration

### VM Access Points

| Room | Terminal Purpose | Access Requirements | VM Challenge | Narrative Justification |
|------|------------------|---------------------|--------------|-------------------------|
| `server_room` | Primary VM Access | Server room password "Heisenberg2024" | Bludit CMS exploitation (4 flags) | Physical access to internal network required for exploitation |

**VM Access Terminal Details:**
- **Position:** (4, 4) center of server room
- **Pre-Requisites:**
  1. Clone employee badge → access server hallway
  2. Find server password in Torres' desk → unlock server room
  3. Interact with VM terminal → begin Bludit exploitation
- **VM Scenario:** "Feeling Blu" (Bludit CMS vulnerability exploitation)
- **Challenge Structure:**
  - **Flag 1:** Initial access / reconnaissance
  - **Flag 2:** Exploitation / privilege escalation
  - **Flag 3:** Data exfiltration discovery
  - **Flag 4:** Architect communications (proves ENTROPY involvement)

### Drop-Site Terminals

| Room | Flags Submitted Here | Unlocks | Evidence Level Impact |
|------|---------------------|---------|----------------------|
| `server_room` | Flags 1, 2, 3, 4 | Each flag → intelligence + evidence_level++ | +4 total (one per flag) |

**Drop-Site Terminal Details:**
- **Position:** (7, 4) east wall of server room
- **Function:** Submit VM flags representing "intercepted ENTROPY communications"
- **Rewards Per Flag:**
  - **Flag 1:** Initial confirmation of data exfiltration, evidence_level +1
  - **Flag 2:** Upload destination identified (external server), evidence_level +1
  - **Flag 3:** Exfiltration timeline discovered, evidence_level +1
  - **Flag 4:** **Architect's communications unlocked** (proves ENTROPY), evidence_level +1
- **Total Impact:** 4 evidence points (out of 7 required for S-rank, 4 minimum for confrontation)

### CyberChef Workstation

| Room | Purpose | Always Available? |
|------|---------|-------------------|
| `conference_room` | Decode encrypted messages, analyze data | Yes (after accessing conference room) |

**CyberChef Terminal Details:**
- **Position:** (2, 5) corner desk in conference room
- **Function:** Decryption/encoding tool for investigative tasks
- **Used For:**
  - Decoding Base64 messages found in emails
  - Analyzing encrypted files from containers
  - Verifying hash values of evidence
  - Educational cryptography challenges

### Physical-Digital Evidence Correlation

**Design Philosophy:** VM findings must correlate with physical evidence for complete picture.

**Evidence Correlation Matrix:**

| Physical Evidence | Digital Evidence (VM) | Correlated Insight |
|-------------------|----------------------|-------------------|
| Torres' journal (radicalization visible) | Flag 4 (Architect's approval, expendable asset) | Torres radicalized but only 3 months, cognitive dissonance visible |
| Medical bills ($180K debt) | Email trails (desperate money searches) | Financial motive established |
| USB device (physical exfil tool) | Flag 3 (upload timeline) | Confirms Torres' method and schedule |
| Briefcase communications | Flag 4 (Architect communications) | Proves ENTROPY connection, not lone wolf |
| Network diagrams (server cabinet) | Flag 1-2 (reconnaissance data) | Shows what systems Torres accessed |

**Correlation Point:** Conference Room Evidence Board
- Player must synthesize physical + digital evidence
- `evidence_level >= 4` required to unlock confrontation
- Minimum sources: 2 physical (medical bills, journal) + 2 digital (flags) = 4 evidence
- Optimal: All physical evidence + all 4 flags + interviews = 7+ evidence (S-rank path)

---

## Technical Validation

### Room Compliance Checklist

**Room 1: reception_lobby (10 × 8 GU)**
- [X] Dimensions within 4×4 to 15×15 GU range: ✓ (10×8)
- [X] Usable space calculated correctly: ✓ (8×6 GU)
- [X] All items/containers in usable space: ✓
- [X] Door connections have ≥ 1 GU overlap: ✓
- [X] Locked doors have unlock conditions: ✓ (Patricia grants corridor access)

**Room 2: main_corridor (15 × 6 GU)**
- [X] Dimensions within range: ✓ (15×6, maximum width for hub)
- [X] Usable space: ✓ (13×4 GU)
- [X] Six connections properly mapped: ✓
- [X] Hub design supports navigation: ✓

**Room 3: break_room (8 × 8 GU)**
- [X] Dimensions: ✓ (8×8)
- [X] Usable space: ✓ (6×6 GU)
- [X] Container positions valid: ✓ (within usable space)
- [X] NPC position valid: ✓ Lisa at (3,3)

**Room 4: conference_room (10 × 8 GU)**
- [X] Dimensions: ✓ (10×8)
- [X] Usable space: ✓ (8×6 GU)
- [X] Interactive objects positioned: ✓ Evidence Board (7,4), CyberChef (2,5)
- [X] Critical gameplay function: ✓ (evidence correlation hub)

**Room 5: open_office_area (12 × 10 GU)**
- [X] Dimensions: ✓ (12×10)
- [X] Usable space: ✓ (10×8 GU)
- [X] Multiple containers: ✓ (3 containers, 1 terminal)
- [X] NPC positions valid: ✓ Kevin at (6,4)
- [X] Connections to torres_office mapped: ✓

**Room 6: server_hallway (8 × 4 GU)**
- [X] Dimensions: ✓ (8×4)
- [X] Usable space: ✓ (6×2 GU)
- [X] Transition corridor design: ✓
- [X] Badge reader placement: ✓ (3,1)

**Room 7: server_room (10 × 10 GU)**
- [X] Dimensions: ✓ (10×10)
- [X] Usable space: ✓ (8×8 GU)
- [X] VM terminal positioned: ✓ (4,4 center)
- [X] Drop-site terminal positioned: ✓ (7,4 east)
- [X] Containers positioned: ✓ (2,2) and (6,6)

**Room 8: torres_office (8 × 8 GU)**
- [X] Dimensions: ✓ (8×8)
- [X] Usable space: ✓ (6×6 GU)
- [X] Four containers positioned: ✓ All within usable space
- [X] Interactive objects: ✓ Computer (3,4), Whiteboard (5,5)
- [X] Critical evidence location: ✓

**Room 9: research_lab (12 × 10 GU)**
- [X] Dimensions: ✓ (12×10)
- [X] Usable space: ✓ (10×8 GU)
- [X] NPC position: ✓ Dr. Chen at (5,5)
- [X] Biometric container: ✓ Equipment cabinet (8,6)

**Room 10: patricia_office (8 × 7 GU)**
- [X] Dimensions: ✓ (8×7)
- [X] Usable space: ✓ (6×5 GU)
- [X] Containers positioned: ✓ Filing cabinet (1,3), Safe (4,1)
- [X] Security monitors: ✓ (5,4)

**Room 11: archive_storage (6 × 8 GU)**
- [X] Dimensions: ✓ (6×8)
- [X] Usable space: ✓ (4×6 GU)
- [X] Containers positioned: ✓ (2,4) and (1,1)
- [X] Optional exploration area: ✓

### Objectives Integration Validation

- [X] All 32 tasks from Stage 4 mapped to rooms: ✓
- [X] Every required task has clear completion method: ✓
- [X] Optional tasks clearly marked: ✓ (8 optional tasks)
- [X] VM access points placed: ✓ (server_room)
- [X] Drop-site terminals placed: ✓ (server_room)
- [X] Evidence correlation point exists: ✓ (conference_room Evidence Board)

### Lock System Validation

- [X] Five lock types used (exceeds minimum 3): ✓
- [X] Critical path keys NOT in same room as locks: ✓
- [X] Keys required BEFORE lockpick obtained: ✓
- [X] PIN codes have discoverable hints: ✓ (0415, 0811, 1776 all contextual)
- [X] Password found through investigation: ✓ (Heisenberg2024 in Torres' desk)
- [X] RFID badge cloning mechanic: ✓ (Kevin Park social engineering)
- [X] No circular lock dependencies: ✓ (all paths resolvable)

### Backtracking Validation

- [X] Minimum 2-3 backtracking moments required: ✓ (4 required, 2 optional)
- [X] Clear signposting for locked areas: ✓
- [X] Backtracking purposeful and rewarding: ✓
- [X] Hub design minimizes tedious running: ✓ (central corridor reduces distance)

### NPC Integration Validation

- [X] All NPCs have positions specified: ✓
- [X] In-person vs phone modes chosen appropriately: ✓
- [X] Patricia transitions from in-person to phone: ✓
- [X] Confrontation NPC (Torres) appears conditionally: ✓ (evidence_level >= 4)
- [X] Optional NPCs enhance but don't block: ✓

### Hybrid Architecture Validation

- [X] VM access narratively justified: ✓ (physical server room access)
- [X] Four flags mapped to tasks: ✓
- [X] Drop-site terminal accessible: ✓
- [X] CyberChef workstation placed: ✓ (conference_room)
- [X] Physical-digital evidence correlation designed: ✓

### Gameplay Flow Validation

- [X] Clear starting area: ✓ (reception_lobby)
- [X] Progressive unlocking creates pacing: ✓ (5-stage unlock flow)
- [X] No soft locks possible: ✓ (all keys findable, alternative paths exist)
- [X] Multiple solution paths where appropriate: ✓ (social engineering vs investigation)
- [X] Dead ends avoided: ✓ (all locked areas unlockable)

### Narrative Support Validation

- [X] Room layout supports 3-act structure: ✓
  - Act 1: Reception → Corridor → Initial investigation (Break Room, Conference Room, Open Office)
  - Act 2: Evidence gathering (Torres Office, Server Room, VM challenges, Interviews)
  - Act 3: Confrontation (Torres Office or Server Room), Stop upload, Debrief
- [X] Atmosphere appropriate: ✓ (Modern tech campus, corporate professionalism with tension)
- [X] Environmental storytelling opportunities: ✓ (Torres' office tells complete story)
- [X] Choice moments have appropriate settings: ✓ (Confrontation in private location)

---

## Design Notes

### Pacing Strategy

**Act 1 (15-20 minutes): Arrival & Initial Investigation**
- Reception: Quick orientation, meet Patricia (2-3 min)
- Main Corridor: Hub exploration, identify branches (2 min)
- Break Room: Optional social interaction with Lisa (3-5 min)
- Conference Room: Establish evidence board, CyberChef access (2 min)
- Open Office: Review security logs, identify pattern, narrow suspects (8-10 min)
- **Pacing Goal:** Establish investigation framework, introduce locked areas to create goals

**Act 2 (35-45 minutes): Evidence Gathering & VM Exploitation**
- Badge Cloning: Social engineer Kevin or other employee (5-7 min)
- Server Access: Navigate to server room, discover locked (backtrack) (3 min)
- Torres Office Investigation:
  - Find office (2 min)
  - Access locked office (find key or lockpick) (3-5 min)
  - Search containers: medical bills, journal, briefcase (8-10 min)
  - Discover server password (2 min)
- Server Room VM Challenges:
  - Return to server room with password (backtrack) (2 min)
  - Bludit CMS exploitation - 4 flags (15-20 min total for VM work)
- Optional Interviews: Dr. Chen, additional NPCs (5-10 min if pursued)
- Evidence Correlation: Return to conference room, synthesize findings (3-5 min)
- **Pacing Goal:** Methodical investigation with satisfying discoveries, build evidence to unlock confrontation

**Act 3 (15-20 minutes): Confrontation & Resolution**
- Locate Torres: Find him in office or server room (2 min)
- Present Evidence: Show findings, reveal manipulation (3-5 min)
- Reveal ENTROPY Plan: Show Architect communications from Flag 4 (2-3 min)
- Critical Choice: 4-path branching (turn double agent, arrest, release, expose) (3-5 min)
- Stop Upload: Prevent final exfiltration (2-3 min)
- Secure Data: Ensure evidence preserved (1-2 min)
- Debrief: Agent 0x99 reflects on choices (3-5 min)
- **Pacing Goal:** Emotional payoff, meaningful choice, clear consequences

**Total Mission Time:** 70-90 minutes (matches Tier 2 target duration)

### Difficulty Curve

**Easy Start (First 15 minutes):**
- Simple PIN (0415) with nearby hints
- Unlocked containers in break room and open office
- Clear navigation from hub corridor
- Patricia provides guidance

**Medium Ramp (Minutes 15-45):**
- Social engineering challenge (badge cloning)
- Physical key hunt (Torres office, desk key)
- Contextual PIN (0811 from photos)
- Multi-step puzzle chains (desk key → password → server room)

**Hard Peak (Minutes 45-60):**
- VM exploitation (Bludit CMS - 4 flags)
- Evidence synthesis at correlation board
- Optional biometric bypass (Dr. Chen's cabinet)

**Satisfying Resolution (Minutes 60-90):**
- Confrontation requires evidence_level >= 4 (earned through investigation)
- Choice complexity (weighing justice vs. mercy)
- Stopping upload (applying learned skills)

### Atmosphere Design

**Corporate Professionalism:**
- Glass walls, modern furniture, clean aesthetics
- Badge readers and security checkpoints reinforce legitimacy
- Professional NPCs (Patricia, Dr. Chen) establish credibility

**Underlying Tension:**
- Security alerts posted, elevated monitoring
- Empty spaces after-hours create isolation
- Torres' office contrasts with rest of facility (personal, desperate vs. corporate, sterile)

**Environmental Storytelling:**
- Torres' office: Family photos + medical bills = complete tragic narrative
- Break room: Coffee station shows Torres' routine disrupted
- Server room: Technical precision contrasts with human desperation
- Research lab: Cutting-edge tech shows value of stolen data

**Emotional Beats:**
1. **Lobby:** Professional, routine security audit
2. **Open Office:** Discovery of suspicious pattern (tension rises)
3. **Torres Office:** Humanization (medical bills, children's drawings) - sympathy
4. **Server Room:** Technical confirmation (data exfiltration active) - urgency
5. **Confrontation:** Moral complexity (victim vs. perpetrator) - conflict

### Player Guidance Philosophy

**Show, Don't Tell:**
- Locked doors visible early (server hallway, Torres office) create investigation goals
- Security logs show pattern, player deduces suspect
- Evidence board lets player connect dots, not told answer

**Progressive Disclosure:**
- Initial areas teach mechanics (simple PIN, unlocked containers)
- Middle areas challenge skills (multi-step locks, social engineering)
- Late areas reward mastery (biometric bypass, VM exploitation)

**Optional Depth:**
- Critical path completable without optional areas (research lab, archive, some interviews)
- Optional content enriches understanding and provides LORE
- S-rank requires thoroughness but not perfection

**Guidance Mechanisms:**
1. **Patricia (Phone):** Player can call for hints if stuck
2. **Locked Door Messages:** Clear indication of what's needed
3. **Evidence Board:** Visual reminder of investigation progress
4. **Objectives System:** Tasks guide without railroading

### Replayability Considerations

**Different Investigative Paths:**
- Social engineering focus (charm Kevin, interview NPCs)
- Technical focus (VM flags, system analysis)
- Stealth focus (lockpicking, minimal interaction)

**Branching Choices:**
- How evidence gathered affects confrontation tone
- Four distinct endings (double agent, arrest, release, exposure)
- Optional content discovery (LORE fragments, interviews)

**Speedrun Potential:**
- Minimum path: Reception → Open Office (logs) → Badge clone → Torres Office (password) → Server Room (VM) → Confrontation
- Estimated minimum time: 45-50 minutes (skilled players skipping optional content)

**S-Rank Challenges:**
- All 8 optional tasks completed
- All 4 LORE fragments collected
- All interviews conducted
- Zero-days patched
- Torres turned (double agent ending)

---

## Stage 5 Summary

**Room Layout Complete:** 11 rooms, hub-and-spoke design, 70-90 minute investigation mission

**Key Design Achievements:**
- ✅ Progressive unlocking creates investigation flow (5 unlock stages)
- ✅ Lock variety (5 types) prevents repetitive gameplay
- ✅ Backtracking designed intentionally (4 required, 2 optional)
- ✅ Hybrid architecture integrated (VM + physical evidence correlation)
- ✅ Environmental storytelling supports sympathetic villain narrative
- ✅ All 32 tasks from Stage 4 mapped to specific room locations
- ✅ Evidence-based progression (evidence_level gates confrontation)
- ✅ Optional content enriches without blocking critical path

**Critical Path Summary:**
1. Reception → Meet Patricia → Gain visitor badge
2. Open Office → Review logs → Identify Torres as suspect
3. Clone employee badge → Access server hallway
4. Find Torres office key → Access office → Gather evidence
5. Find server password → Access server room → VM exploitation
6. Submit 4 flags → Increase evidence to confrontation threshold
7. Evidence Board → Correlate findings → Unlock confrontation
8. Locate Torres → Present evidence → Make critical choice → Stop upload

**Optional Paths:**
- Research Lab (Dr. Chen interview, Project Heisenberg context)
- Archive Storage (Torres' background, LORE Fragment 4)
- Multiple NPC interviews (Lisa, Kevin, others)
- Patricia consultations (guidance and authorization)

**Next Stages:**
- **Stage 6 (LORE Fragments):** Define 4 LORE fragment contents
- **Stage 7 (Ink Scripting):** Create dialogue scripts for NPCs, confrontation, evidence discovery
- **Stage 9 (Scenario Assembly):** Convert design into scenario.json.erb implementation

**Design Philosophy Achieved:**
Investigation-focused gameplay where player pieces together truth through exploration, social engineering, and technical challenges. Torres emerges as radicalized ENTROPY recruit (3 months, cognitive dissonance visible) who can be de-radicalized, arrested, or subdued, creating meaningful moral choice with arrest/combat options. Physical and digital evidence must be correlated for complete picture, reinforcing hybrid architecture integration.

---

**Stage 5: Room Layout Design - COMPLETE**

