> ⚠️ **SUPERSEDED (2026-08-21).** These stage documents describe the original **water-treatment**
> concept for m04 (chlorine dosing, Dec 2025). The mission was rebuilt as **grid battery storage**
> (Albion Energy Storage) and then aligned to the m01 standard. They are kept for historical
> reference only. The authoritative design is `scenarios/m04_critical_failure/ALIGNMENT_PLAN.md`;
> the current implementation is the scenario and ink files themselves.

# Mission 4: "Critical Failure" - Stage 5: Room Design & Puzzle Layout

**Mission ID:** m04_critical_failure
**Stage:** 5 - Room Design and Puzzle Layout
**Version:** 1.0
**Date:** 2025-12-28

---

## Overview

This document provides detailed room-by-room specifications for Mission 4 "Critical Failure," including object placement, interactive elements, locks, puzzles, combat space design, and item distribution. Each room supports multiple approach paths (stealth, social engineering, combat) while serving narrative and gameplay functions.

---

## Room Design Principles

### Core Design Goals

1. **Multiple Approach Paths:** Every objective accessible via stealth, social, or combat
2. **Environmental Storytelling:** Objects and layout reveal narrative information
3. **Combat Space Viability:** Rooms support both stealth and combat gameplay
4. **Logical Layout:** Facility feels authentic, not gamey
5. **Progression Gates:** Locks and puzzles control pacing without blocking alternatives

---

## Room 1: Main Entrance & Security Checkpoint

**Room ID:** `room_entrance`
**Type:** `room_entrance` (mission starting point)
**Size:** Medium (10m x 8m)
**Function:** Entry point, tutorial area, security bypass

### Room Layout

**Zones:**
- Entry doors (north wall)
- Security checkpoint desk (center)
- Metal detector archway (between entry and interior)
- Employee sign-in area (east wall)
- Waiting area with chairs (west wall)
- Interior facility door (south wall) - locked initially

### Objects and Interactions

**Security Desk:**
- Object: `obj_security_desk`
  - Type: `desk`
  - Interactive: Yes
  - Contains:
    - `item_security_logs` (readable document - shows OptiGrid Solutions sign-in)
    - `item_visitor_badge` (obtained after security clearance)
  - Locked: No

**Sign-In Clipboard:**
- Object: `obj_signin_clipboard`
  - Type: `document`
  - Interactive: Yes (examine)
  - Reveals: Recent maintenance team entry (ENTROPY operatives)
  - Evidence for Task 1.3

**Security Terminal:**
- Object: `obj_security_terminal`
  - Type: `computer`
  - Interactive: Yes
  - Functions:
    - View employee access logs
    - Check visitor credentials
    - SCADA monitor feed (background - shows green status)
  - Locked: No (basic access)

**Interior Facility Door:**
- Object: `obj_facility_door`
  - Type: `door`
  - Locked: Yes (initially)
  - Lock Type: Social engineering or keycard
  - Bypass Options:
    - **Primary:** Present credentials to Security Guard NPC (social engineering)
    - **Alternative:** RFID clone (if obtained from parking lot)
    - **Advanced:** Lockpick (not recommended, alerts guard)

### NPCs

**Security Guard:**
- NPC ID: `npc_security_guard`
- Position: Behind security desk
- Behavior: Passive, credential checking
- Interaction: Conversation (credential presentation)
- Alertness: Low (trusting of official-looking credentials)

### Item Distribution

**Available Items:**
- `item_security_logs` - Evidence document
- `item_visitor_badge` - Obtained after passing security
- `item_employee_roster` - On desk (shows facility staff, OptiGrid maintenance team listed)

### Approach Paths

**Social Engineering (Primary):**
1. Approach security guard
2. Present state auditor credentials (dialogue)
3. Guard provides visitor badge
4. Interior door unlocks

**Stealth (Alternative):**
1. Avoid guard, examine sign-in clipboard quietly
2. Use loading dock entrance (exterior, Room 8)
3. Bypass security checkpoint entirely

**RFID Clone (Advanced):**
1. Parking lot area (outside mission start)
2. Clone employee badge from parked car
3. Use on card reader, bypass guard interaction

### Environmental Storytelling

- Bulletin board: Budget cut notice, safety training schedule
- Safety poster: "X Days Without Incident" (shows facility pride)
- Employee mailboxes: Normal workplace details
- Coffee station: Half-empty pot (early morning shift)

---

## Room 2: Administration Offices

**Room ID:** `room_administration`
**Type:** `room_office`
**Size:** Large (15m x 10m)
**Function:** Robert Chen introduction, employee records investigation

### Room Layout

**Zones:**
- Open office area with cubicles (north section, 3-4 workstations)
- Robert Chen's private office (southeast corner, glass walls)
- Filing cabinet area (west wall)
- Coffee station and water cooler (northwest corner)
- Conference room (southwest corner, glass walls)

### Objects and Interactions

**Robert Chen's Desk:**
- Object: `obj_chen_desk`
  - Type: `desk`
  - Interactive: Yes
  - Contains:
    - `item_facility_blueprints` (wall-mounted, readable)
    - `item_maintenance_logs` (key evidence - shows OptiGrid access)
    - `item_budget_reports` (storytelling - shows underfunding)
    - `item_facility_keycard_level1` (provided by Chen after Task 1.2)
  - Locked: No (Chen present)

**Chen's Computer:**
- Object: `obj_chen_computer`
  - Type: `computer`
  - Interactive: Yes (with Chen's permission)
  - Functions:
    - SCADA remote monitoring
    - Employee access control logs
    - Maintenance schedules
  - Shows SCADA anomalies (Task 1.4)

**Filing Cabinets:**
- Object: `obj_filing_cabinets` (×3)
  - Type: `storage`
  - Interactive: Yes
  - Contains:
    - `item_employee_records` (background checks, shows OptiGrid technicians cleared)
    - `item_contractor_agreements` (OptiGrid Solutions contract)
    - `item_safety_inspection_reports` (facility compliance history)
  - Locked: No

**Cubicle Workstations:**
- Objects: `obj_workstation_1`, `obj_workstation_2`, `obj_workstation_3`
  - Type: `desk`
  - Interactive: Yes
  - Contains:
    - Personal items (storytelling - humanizes employees)
    - Work documents (normal operations)
    - Coffee mugs, family photos
  - Locked: No

**Whiteboard:**
- Object: `obj_maintenance_whiteboard`
  - Type: `whiteboard`
  - Interactive: Yes (examine)
  - Shows: Weekly maintenance schedule, OptiGrid Solutions listed for "control system upgrades"
  - Evidence for infiltration investigation

### NPCs

**Robert Chen:**
- NPC ID: `npc_robert_chen`
- Position: Private office or moving between office and Control Room
- Behavior: Initially defensive, becomes ally after Task 1.4
- Interaction: Multiple conversations (Tasks 1.2, 1.4, ongoing support)

**Office Workers (Background):**
- NPCs: `npc_office_worker_1`, `npc_office_worker_2` (optional)
- Position: Cubicles or break area
- Behavior: Ambient, morning routine
- Interaction: Optional small talk, unaware of threat

### Item Distribution

**Key Items:**
- `item_facility_keycard_level1` - From Chen (unlocks most areas except Server Room, Maintenance Wing)
- `item_maintenance_logs` - Critical evidence for Task 1.3
- `item_facility_map` - Provided by Chen, updates player's map

**Evidence Items:**
- `item_employee_records` - Background investigation
- `item_contractor_agreements` - OptiGrid Solutions connection
- `item_budget_reports` - Context for security gaps

### Puzzle/Lock Elements

**No Traditional Locks:**
- Room accessible from Main Entrance after security clearance
- Chen's office accessible (Chen present or invites player)
- No puzzles, investigation-focused

### Approach Paths

**Primary Path:**
1. Enter after Task 1.1 completion
2. Meet Robert Chen (Task 1.2)
3. Investigate evidence (Task 1.3)
4. Examine SCADA terminal with Chen (Task 1.4)

**Thorough Investigation:**
1. Examine all filing cabinets and workstations
2. Read all documents for complete picture
3. Discuss findings with Chen

### Environmental Storytelling

- Family photo on Chen's desk (humanizes character)
- Engineering degree on wall (establishes expertise)
- Stack of budget cut memos (explains facility constraints)
- Employee awards and safety certificates (Chen's pride in safety)
- Coffee station with multiple mugs (lived-in workplace)

---

## Room 3: Control Room (SCADA Central)

**Room ID:** `room_control`
**Type:** `room_control`
**Size:** Large (12m x 10m)
**Function:** SCADA monitoring, urgency visualization, Chen's workspace during crisis

### Room Layout

**Zones:**
- SCADA monitoring wall (north wall, large display array)
- Primary operator station (center, facing monitors)
- Secondary workstations (east and west sides, ×2 each)
- Emergency shutdown panel (west wall, red protective cover)
- Radio communication station (southeast corner)
- Facility PA system controls (near door)

### Objects and Interactions

**SCADA Monitor Array:**
- Object: `obj_scada_main_display`
  - Type: `monitor_array`
  - Interactive: Yes (examine, monitor)
  - Functions:
    - Display facility systems status
    - Visual urgency indicators (green → yellow → red progression)
    - Chemical dosing parameter readouts
    - Alert logs
  - Shows anomalies for Task 1.4
  - Updates based on urgency stage

**Primary Operator Terminal:**
- Object: `obj_operator_terminal`
  - Type: `computer`
  - Interactive: Yes (with Chen's guidance)
  - Functions:
    - SCADA system control interface
    - Parameter adjustment (risky without expertise)
    - System diagnostics
    - Emergency override capability
  - Locked: Requires Chen's authorization or Level 2+ access

**Emergency Shutdown Panel:**
- Object: `obj_emergency_shutdown`
  - Type: `emergency_control`
  - Interactive: Yes (dangerous)
  - Functions:
    - Facility-wide emergency shutdown
    - Chemical dosing halt (immediate but risky)
    - Could trigger attack if used incorrectly
  - Locked: Protective cover (can break in emergency)
  - Warning: Chen advises against crude shutdown

**Shift Logbook:**
- Object: `obj_shift_logbook`
  - Type: `document`
  - Interactive: Yes (read)
  - Contains:
    - Handwritten operator notes
    - Unusual parameter observations (last 2 days)
    - Operators noticed anomalies but didn't alarm (storytelling)

**Radio Communication System:**
- Object: `obj_facility_radio`
  - Type: `radio`
  - Interactive: Yes
  - Functions:
    - Facility-wide communication
    - Emergency announcements
    - Can monitor ENTROPY radio (if encrypted radio obtained from Operative #1)

### NPCs

**Robert Chen (Crisis Phase):**
- Position: Primary operator station (during Act 2-3)
- Behavior: Monitoring systems, providing updates
- Interaction: Radio/phone support, technical guidance

**Shift Operators (Early Morning):**
- NPCs: `npc_operator_1`, `npc_operator_2` (optional, background)
- Position: Secondary workstations
- Behavior: Normal monitoring, end of night shift
- Interaction: Minimal (unaware of full threat)

### Item Distribution

**Available Items:**
- `item_shift_logbook` - Evidence of recent anomalies
- `item_scada_manual` - Technical reference (hint system)
- `item_emergency_procedures` - Posted on wall

### Urgency Visualization

**Stage 1 (Normal):**
- Monitors: All green indicators
- Sounds: Quiet electronic hum, occasional beeps
- Chen: Not present initially

**Stage 2 (Anomaly):**
- Monitors: Yellow warnings on chemical dosing
- Sounds: Alert beeps (occasional)
- Chen: Arrives, begins monitoring

**Stage 3 (Critical Warning):**
- Monitors: Orange/red warnings, multiple systems
- Sounds: Frequent alerts, pre-alarm tones
- Chen: Actively working, urgent communications

**Stage 4 (Emergency):**
- Monitors: Red across multiple systems, flashing
- Sounds: Full alarms, klaxon
- Chen: Crisis management mode

**Stage 5 (Stabilizing):**
- Monitors: Warnings clearing, returning to green
- Sounds: Alarms silencing
- Chen: Relief, system stabilization

### Approach Paths

**Primary Access:**
- From Administration (adjacent room)
- Level 1 keycard sufficient
- No lock during business hours

**Crisis Coordination:**
- Player uses Control Room as information hub
- Chen provides real-time SCADA updates
- Visual feedback on mission progress

### Environmental Storytelling

- Coffee cups and energy drink cans (long monitoring shifts)
- Sticky notes with unusual readings (operators noticed issues)
- Family photos at workstations (human element)
- Emergency response procedures prominently posted
- Facility schematic on wall (player reference)

---

## Room 4: Server Room

**Room ID:** `room_server`
**Type:** `room_server`
**Size:** Medium (10m × 8m)
**Function:** VM challenges, flag submission, network investigation

### Room Layout

**Zones:**
- Server rack rows (3-4 racks, north-south orientation)
- Network administrator desk (southeast corner)
- Cooling unit area (west wall, loud fans)
- Network equipment racks (east wall)
- Cable management area (overhead and floor)

### Objects and Interactions

**VM Challenge Terminal:**
- Object: `obj_network_terminal`
  - Type: `vm_launcher`
  - Interactive: Yes
  - Functions:
    - Launch SecGen "Vulnerability Analysis" VM
    - SCADA network investigation
    - Tasks 2.2, 2.4, 2.7
  - Configuration:
    ```json
    {
      "vm_id": "vulnerability_analysis_scada",
      "title": "SCADA Network Backup Server",
      "scenario_name": "vulnerability_analysis",
      "ip_address": "192.168.100.10"
    }
    ```

**Flag Submission Terminal:**
- Object: `obj_drop_site_terminal`
  - Type: `flag_station`
  - Interactive: Yes
  - Functions:
    - Submit VM flags
    - Tasks 2.3, 2.5, 2.6, 2.8
  - Configuration:
    ```json
    {
      "flag_station_id": "drop_site_terminal",
      "accepts_vms": ["vulnerability_analysis_scada"],
      "flags": [
        "flag{network_scan_complete}",
        "flag{ftp_intel_gathered}",
        "flag{http_analysis_complete}",
        "flag{distcc_exploit_complete}"
      ]
    }
    ```

**Server Racks:**
- Objects: `obj_server_rack_1`, `obj_server_rack_2`, `obj_server_rack_3`
  - Type: `server_rack`
  - Interactive: Yes (examine)
  - Shows:
    - Tampered rack panel (open, cables exposed)
    - Blinking status LEDs
    - Environmental evidence of ENTROPY access

**ENTROPY Laptop (Evidence):**
- Object: `obj_entropy_laptop`
  - Type: `computer`
  - Interactive: Yes (examine)
  - Contains:
    - Remote access tools visible on screen
    - Connection logs
    - Storytelling: Shows how operatives accessed network
  - Not removable (evidence left behind in haste)

**Network Diagram (Wall):**
- Object: `obj_network_diagram`
  - Type: `document` (wall-mounted)
  - Interactive: Yes (examine)
  - Functions:
    - Visual reference for network topology
    - Helps with VM challenges (hint)
    - Shows SCADA network structure

### Lock/Access

**Server Room Door:**
- Object: `obj_server_door`
  - Type: `door`
  - Locked: Yes
  - Lock Type: Electronic keycard reader
  - Bypass Options:
    - **Primary:** Level 2 keycard (from Operative #1 or Chen after sufficient trust)
    - **Alternative:** Hack card reader (requires hacking skill)
    - **Social:** Chen provides access if player explains need

### Item Distribution

**Key Items:**
- `item_level2_keycard` - Dropped by Operative #1 if defeated
- `item_network_diagram` - Reference material

**Evidence Items:**
- `item_unauthorized_cables` - Physical evidence of tampering
- `item_entropy_access_log` - Digital evidence on terminal
- `item_optigrid_badge` - Left behind by operative (storytelling)

### Approach Paths

**VM Investigation Path:**
1. Enter Server Room (Task 2.1)
2. Access VM terminal
3. Complete network scan (Task 2.2)
4. Submit flag at drop-site terminal (Task 2.3)
5. Continue service investigation (Task 2.4)
6. Submit additional flags (Tasks 2.5, 2.6)
7. Complete exploitation (Task 2.7)
8. Submit final flag (Task 2.8)

**Evidence Gathering:**
1. Examine physical evidence (tampered racks, laptop)
2. Correlate with VM findings
3. Build complete attack picture

### Environmental Storytelling

- ENTROPY laptop left connected (hurried setup or confidence)
- USB device plugged into server (malware deployment)
- Cable management disrupted (recent unauthorized access)
- Security camera disabled (lens covered with tape - small detail)
- Maintenance badge left on desk (OptiGrid Solutions - operative carelessness)

---

## Room 5: Treatment Floor

**Room ID:** `room_treatment`
**Type:** `room_industrial`
**Size:** Very Large (20m × 15m, high ceiling)
**Function:** First combat encounter, industrial exploration, multi-level navigation

### Room Layout

**Zones:**
- Ground level operations floor (main area)
- Treatment tanks (×4 large cylindrical tanks, distributed)
- Pipe systems (overhead and ground-level, complex network)
- Metal catwalks and walkways (upper level, 3m elevation)
- Pump station area (northeast corner)
- Filtration unit zone (southwest corner)
- Maintenance access ladder (west wall, to catwalks)
- Stairway to upper catwalks (east side)

### Objects and Interactions

**Treatment Tanks:**
- Objects: `obj_treatment_tank_1` through `obj_treatment_tank_4`
  - Type: `industrial_equipment`
  - Interactive: No (environmental)
  - Function: Cover during combat, visual scale

**Pump Systems:**
- Objects: `obj_pump_station_1`, `obj_pump_station_2`
  - Type: `industrial_equipment`
  - Interactive: Yes (examine)
  - Shows: Operating status, normal function
  - Provides cover during combat

**Metal Catwalks:**
- Objects: `obj_catwalk_section_1` through `obj_catwalk_section_4`
  - Type: `platform`
  - Interactive: Yes (walkable, different elevation)
  - Functions:
    - Tactical high ground
    - Stealth approach from above
    - Line of sight to ground level

**Dosing Station 3 Control Panel:**
- Object: `obj_dosing_station_3_control`
  - Type: `control_panel`
  - Interactive: Yes (examine, later interact for Task 3.2)
  - Shows:
    - ENTROPY bypass device installed (visible on close examination)
    - Chemical dosing parameters
    - Warning indicators
  - Used in Task 3.2 (disable attack vector 1)

**Equipment Support Columns:**
- Objects: `obj_support_column_1` through `obj_support_column_6`
  - Type: `structure`
  - Interactive: No (environmental)
  - Function: Cover during combat, sight line breaks

**Maintenance Tool Cache:**
- Object: `obj_tool_cache`
  - Type: `storage`
  - Interactive: Yes
  - Contains:
    - `item_wrench` (tool, storytelling)
    - `item_maintenance_notes` (work orders, shows normal operations)
  - Locked: No

### NPCs and Combat

**Operative #1: "Cipher":**
- NPC ID: `npc_operative_cipher`
- Position: Ground level, near Dosing Station 3 control panel
- Activity: Installing bypass device (back to player if approaching from main entrance)
- Behavior:
  - **Unaware:** Working on equipment, focused
  - **Alerted:** Attempts radio call, engages or flees
  - **Combat:** Uses pump equipment and columns for cover
- Defeat Drops:
  - `item_level2_keycard`
  - `item_encrypted_radio`
  - `item_cipher_intelligence_note`

### Combat Space Design

**Cover Opportunities:**
- Support columns (full cover, 6 positions)
- Pump equipment (partial cover, 2 positions)
- Treatment tank bases (full cover, 4 positions)
- Pipe junctions (partial cover, multiple)

**Sight Lines:**
- Central area: Open, exposed
- Equipment clusters: Sight line breaks
- Upper catwalks: Overview of ground level
- Shadows behind tanks: Concealment

**Stealth Approach Options:**
- **Upper Route:** Climb to catwalks, approach from above, stealth takedown
- **Shadow Route:** Move between equipment shadows, avoid central lighting
- **Distraction:** Create noise in one area, approach from another

**Combat Movement:**
- Multiple paths between cover positions
- Vertical elements (catwalk stairs and ladders) - tactical options
- Open central area discourages camping, encourages movement

### Locks/Puzzles

**No Traditional Locks:**
- Room accessible from Main Entrance/Administration
- Multiple entry points (ground level doors, upper catwalk access)

### Item Distribution

**From Operative #1 (Combat Loot):**
- `item_level2_keycard` - Server Room access
- `item_encrypted_radio` - Monitor ENTROPY communications
- `item_cipher_intelligence_note` - Handwritten: "Dosing station 3—primary. Stations 1&2—redundancy. V confirms 0800 trigger."

**Environmental Items:**
- `item_maintenance_notes` - Tool cache
- `item_safety_equipment` - Eye wash station, first aid kit (storytelling)

### Approach Paths

**Stealth (Optimal for Takedown):**
1. Enter quietly
2. Use catwalk route or shadow approach
3. Reach Cipher undetected
4. Stealth takedown (non-lethal)
5. Collect items, radio call prevented

**Combat (Direct):**
1. Enter openly
2. Cipher detects player
3. Cipher attempts radio call
4. Combat engagement using cover
5. Defeat Cipher, collect items
6. Other operatives alerted if radio succeeded

**Avoidance (Skip Encounter):**
1. Bypass Treatment Floor entirely
2. Use alternate route to Chemical Storage or Control Room
3. Cipher remains (potential encounter later)
4. Miss item drops (can obtain Level 2 keycard from Chen alternative)

### Environmental Storytelling

- Safety inspection tags (up to date - Chen's diligence)
- Equipment maintenance logs (normal operations)
- Employee break area (lunch boxes, personal items)
- Chemical safety data sheets posted (regulatory compliance)
- Tool organization (well-maintained facility despite budget)

---

## Room 6: Chemical Storage

**Room ID:** `room_chemical_storage`
**Type:** `room_hazard`
**Size:** Large (15m × 10m)
**Function:** Optional combat encounter, attack vector disabling, hazardous environment

### Room Layout

**Zones:**
- Chemical tank storage (north wall, ×4 large yellow tanks)
- Dosing control panels (east wall, stations 1, 2, 3)
- Secondary containment berms (around tank clusters)
- Ventilation equipment (west wall, large exhaust fans)
- Emergency safety station (south wall near entrance)
- Central walkway (main navigation path)
- Side passages between tank clusters

### Objects and Interactions

**Chemical Storage Tanks:**
- Objects: `obj_chemical_tank_chlorine`, `obj_chemical_tank_fluoride`, `obj_chemical_tank_polymer`, `obj_chemical_tank_ph_adjuster`
  - Type: `hazard_container`
  - Interactive: Yes (examine, shows hazard labels)
  - Function: Environmental storytelling, cover during combat
  - Visual: Yellow tanks, hazard symbols (skull/crossbones, corrosive)

**Dosing Control Panels (×3):**
- Objects: `obj_dosing_control_1`, `obj_dosing_control_2`, `obj_dosing_control_3`
  - Type: `control_panel`
  - Interactive: Yes (critical for Task 3.2)
  - Shows:
    - Chemical dosing rate controls
    - ENTROPY bypass devices installed (visible)
    - Warning indicators (dosing rates altered)
  - Task 3.2 involves removing bypass devices from all three

**Emergency Shower/Eye Wash:**
- Object: `obj_emergency_shower`
  - Type: `safety_equipment`
  - Interactive: Yes (functional if needed)
  - Environmental storytelling

**Chemical Spill Kit:**
- Object: `obj_spill_kit`
  - Type: `storage`
  - Interactive: Yes
  - Contains:
    - `item_protective_gloves`
    - `item_absorbent_material`
    - `item_safety_procedures` (document)
  - Locked: No

**Ventilation Control Panel:**
- Object: `obj_ventilation_control`
  - Type: `control_panel`
  - Interactive: Yes (examine)
  - Shows: Ventilation system operating normally
  - Function: Ensures safe air quality

**Chemical Delivery Logs:**
- Object: `obj_delivery_logs` (clipboard)
  - Type: `document`
  - Interactive: Yes (read)
  - Contains:
    - Delivery schedules
    - Shows when OptiGrid operatives had access (evidence)
    - Normal operations context

### NPCs and Combat

**Operative #2: "Relay":**
- NPC ID: `npc_operative_relay`
- Position: Patrol route (circular around dosing controls)
- Activity: Guarding physical attack components
- Behavior:
  - **Patrol:** 30-45 second loop
  - **Alerted:** Investigates sounds, returns to patrol
  - **Combat:** Defensive, uses tanks and equipment for cover
- Defeat Drops:
  - `item_master_keycard`
  - `item_optigrid_facility_log`
  - `item_relay_intelligence_note`

### Patrol Pattern

**Relay's Route:**
1. Start: Dosing Control 1 (10 sec pause, check panel)
2. Walk: To Dosing Control 2 (5 sec)
3. Pause: Dosing Control 2 (10 sec check)
4. Walk: To Dosing Control 3 (5 sec)
5. Pause: Dosing Control 3 (10 sec check)
6. Walk: Back to Dosing Control 1 (5 sec)
7. Repeat

**Stealth Opportunity:**
- Timing-based approach during transit between stations
- Shadows behind chemical tanks provide concealment
- Alternate path through ventilation side avoids patrol entirely

### Combat Space Design

**Cover Opportunities:**
- Chemical tanks (full cover, hazard-themed)
- Dosing control panels (partial cover)
- Secondary containment berms (low cover)
- Ventilation equipment (full cover)

**Stealth Routes:**
- Shadows behind tanks (low lighting)
- Ventilation equipment side passage (bypass patrol)
- Timing approach (wait for patrol to move)

### Locks/Puzzles

**Chemical Storage Door:**
- Object: `obj_chemical_storage_door`
  - Type: `door`
  - Locked: Yes
  - Lock Type: Keycard reader
  - Bypass Options:
    - **Primary:** Level 1 keycard (from Chen)
    - **Alternative:** Lockpick (hazard area, not recommended)
    - **Social:** Chen provides access authorization

### Item Distribution

**From Operative #2 (Combat Loot):**
- `item_master_keycard` - Maintenance Wing access
- `item_optigrid_facility_log` - Intelligence showing other compromised facilities
- `item_relay_intelligence_note` - "Voltage in maintenance wing, finalizing trigger"

**Environmental Items:**
- `item_chemical_safety_procedures` - Spill kit
- `item_delivery_logs` - Evidence for investigation
- `item_protective_equipment` - Safety station

### Approach Paths

**Stealth Timing (Optimal):**
1. Observe Relay's patrol pattern
2. Wait for transit between stations
3. Approach from shadows
4. Stealth takedown or bypass entirely

**Direct Combat:**
1. Engage Relay openly
2. Use chemical tanks for cover
3. Defeat Relay, collect items
4. Potential radio alert to other operatives

**Avoidance (Skip Encounter):**
1. Bypass Chemical Storage (not required for main path)
2. Miss master keycard (can use alternate entry to Maintenance Wing)
3. Miss intelligence on Voltage's location

### Attack Vector Disabling (Task 3.2)

**Physical Bypass Devices:**
- Installed on Dosing Controls 1, 2, 3
- Player must interact with each panel
- Remove/disconnect bypass hardware
- Careful sequence (guidance from Chen via radio)
- Prevents chemical contamination attack vector

### Environmental Storytelling

- Chemical delivery schedule (normal operations until ENTROPY access)
- Safety inspection records (passed recently, no one suspected tampering)
- Hazard warning signs (authentic regulatory compliance)
- Emergency response procedures posted
- Well-organized safety equipment (Chen's facility management)

---

---

## Room 7: Security Office

**Room ID:** `room_security`
**Type:** `room_security`
**Size:** Small (8m × 6m)
**Function:** Alternate investigation location, camera monitoring, early evidence

### Room Layout

**Zones:**
- Security monitor bank (north wall, 4-6 screens)
- Security desk (center)
- Equipment locker (west wall)
- File storage (east wall)

### Objects and Interactions

**Security Monitors:**
- Object: `obj_security_monitors`
  - Type: `monitor_array`
  - Interactive: Yes
  - Functions:
    - View facility camera feeds
    - Access logs showing footage gaps (evidence)
    - SCADA status monitor (background)
  - Shows evidence of camera tampering by ENTROPY

**Security Terminal:**
- Object: `obj_security_access_terminal`
  - Type: `computer`
  - Interactive: Yes
  - Functions:
    - Access control logs
    - Employee badge activity
    - OptiGrid Solutions entry records
  - Evidence for Task 1.3

**Equipment Locker:**
- Object: `obj_security_locker`
  - Type: `storage`
  - Interactive: Yes
  - Contains:
    - `item_spare_keycard_level1` (backup)
    - `item_flashlight`
    - Safety equipment
  - Locked: Basic lock (easy pick)

**Incident Reports:**
- Object: `obj_incident_log`
  - Type: `document`
  - Interactive: Yes
  - Contains:
    - Recent incident reports (minor issues)
    - No ENTROPY activity reported (they were stealthy)

### Item Distribution

- `item_security_camera_logs` - Evidence of tampering
- `item_access_control_records` - OptiGrid entry data
- `item_spare_keycard_level1` - Backup access

### Approach Paths

**Investigation Path:**
1. Access Security Office from Main Entrance
2. Examine monitors and logs
3. Collect evidence for Task 1.3
4. Identify camera blind spots (helps with stealth)

### Environmental Storytelling

- Half-eaten meal (guard was mid-shift)
- Coffee cups (night shift ending)
- Outdated equipment (budget constraints)
- Camera blind spots visible on monitor layout

---

## Room 8: Maintenance Wing

**Room ID:** `room_maintenance`
**Type:** `room_industrial`
**Size:** Large (15m × 12m, irregular shape)
**Function:** Final confrontation, ENTROPY stronghold, attack trigger location

### Room Layout

**Zones:**
- Main maintenance area (center, tool benches and storage)
- ENTROPY command center (northeast corner, temporary setup)
- Generator platform (west side, raised 1m)
- HVAC system access (south wall)
- Loading dock door (north wall, escape route)
- Storage alcoves (east wall, ×3 small rooms)
- Electrical panel area (southwest corner)

### Objects and Interactions

**ENTROPY Command Setup:**
- Object: `obj_entropy_command_laptop`
  - Type: `computer`
  - Interactive: Yes (critical for Task 3.1)
  - Functions:
    - Attack trigger mechanism
    - SCADA remote access visible
    - Must be secured/disabled for Task 3.2
  - Contains intelligence if captured

- Object: `obj_entropy_tactical_equipment`
  - Type: `storage`
  - Interactive: Yes (examine)
  - Contains:
    - Tactical gear (vests, bags)
    - Radio equipment
    - Escape plan documents
    - OptiGrid Solutions equipment cases

**Surveillance Monitor:**
- Object: `obj_surveillance_feeds`
  - Type: `monitor`
  - Interactive: No (ENTROPY use only)
  - Shows: Facility camera feeds (how they monitored player)

**Facility Blueprints:**
- Object: `obj_marked_blueprints`
  - Type: `document` (wall-mounted)
  - Interactive: Yes (examine)
  - Shows:
    - Facility layout with ENTROPY attack planning notes
    - Dosing station locations marked
    - Escape routes highlighted
  - Intelligence value if photographed/studied

**Tool Benches:**
- Objects: `obj_tool_bench_1`, `obj_tool_bench_2`
  - Type: `workbench`
  - Interactive: Yes
  - Contains:
    - Normal maintenance tools
    - `item_facility_master_keys` (if not obtained from Operative #2)
  - Provides cover during combat

**Backup Generator:**
- Object: `obj_backup_generator`
  - Type: `industrial_equipment`
  - Interactive: Yes (examine, running)
  - Function:
    - Provides power to maintenance wing
    - Noise masks sounds (tactical consideration)
    - Large cover object

**HVAC Access Panels:**
- Objects: `obj_hvac_panel_1`, `obj_hvac_panel_2`
  - Type: `equipment_panel`
  - Interactive: Yes
  - Function: Environmental detail, alternate navigation route

**Loading Dock Door:**
- Object: `obj_loading_dock_door`
  - Type: `door`
  - Interactive: Yes
  - Function:
    - Voltage's escape route (if not captured)
    - Player alternate entry/exit
    - Leads to Room 9 (Loading Dock exterior)
  - Lock: Emergency exit (opens from inside)

### NPCs and Combat

**Voltage (Critical Mass Leader):**
- NPC ID: `npc_voltage`
- Position: ENTROPY command center, near laptop
- Activity: Finalizing attack trigger, monitoring surveillance
- Behavior:
  - **Aware:** Expects player by this point (operatives reported)
  - **Defensive:** Prepared position, tactical advantage
  - **Threatened:** Can trigger attack if player too aggressive
  - **Cornered:** Prioritizes escape if attack fails, capture if no escape

**Operative #3: "Static":**
- NPC ID: `npc_operative_static`
- Position: Supporting Voltage, monitoring area
- Activity: Covering Voltage, surveillance watch
- Behavior:
  - **Alert:** Ready for player arrival
  - **Combat:** Provides cover fire for Voltage
  - **Support:** Defends attack trigger laptop
- Defeat Drops (if defeated separately):
  - `item_entropy_comm_log` (Critical Mass + Social Fabric coordination)
  - `item_voltage_escape_map`
  - `item_attack_planning_usb`

### Combat Space Design

**Defensive Advantages (ENTROPY):**
- Prepared position (Voltage/Static expecting player)
- High ground (generator platform)
- Cover pre-positioned (equipment arranged tactically)
- Escape route prepared (loading dock)

**Player Approach Options:**
- **Direct:** Main entrance, face defensive position head-on
- **Tactical:** Use alcoves and equipment for covered approach
- **Distraction:** Create noise in one area, flank from another
- **Negotiation:** Attempt to talk down Voltage (if attack disabled, he has less leverage)

**Cover Opportunities:**
- Tool benches (full cover, ×2)
- Generator (full cover, large)
- Storage alcoves (full cover, defensive positions)
- HVAC equipment (partial cover)
- Electrical panels (partial cover)

### Critical Choice Implementation (Task 3.1)

**Choice: Capture vs. Disable**

**Prioritize Capture Setup:**
- Player engages Voltage + Static
- Combat difficulty: High
- Goal: Defeat both without damaging laptop
- Risk: Voltage threatens to trigger attack if approached
- Reward: Voltage captured, high-value intelligence

**Prioritize Disable Setup:**
- Player focuses on securing attack trigger laptop
- Bypass or minimize combat
- Goal: Destroy/secure trigger mechanism
- Consequence: Voltage escapes via loading dock
- Benefit: Attack immediately neutralized, lower risk

**Attempt Both (Difficult):**
- High combat skill required
- Defeat Operative #3 quickly
- Capture Voltage before escape
- Secure laptop simultaneously
- Success: Best outcome
- Failure: Partial success (one or the other)

### Locks/Puzzles

**Maintenance Wing Door:**
- Object: `obj_maintenance_wing_door`
  - Type: `door`
  - Locked: Yes
  - Lock Type: Master keycard reader
  - Bypass Options:
    - **Primary:** Master keycard (from Operative #2)
    - **Alternative:** Lockpick (difficult, time-consuming)
    - **Advanced:** Ventilation access (alternate entry route)

### Item Distribution

**From Voltage (if captured):**
- `item_architect_communication` - References The Architect
- `item_multi_cell_operation_plan` - Cross-cell coordination proof
- `item_infrastructure_target_list` - Other facilities at risk

**From Operative #3:**
- `item_entropy_comm_log`
- `item_voltage_escape_map`
- `item_attack_planning_usb`

**Environmental Items:**
- `item_entropy_planning_documents` - On table near laptop
- `item_optigrid_equipment_cases` - Cover identity materials
- `item_facility_access_records` - Shows how they maintained cover

### Approach Paths

**Primary Combat Path:**
1. Enter via main entrance (master keycard)
2. Confront Voltage + Static
3. Choose capture vs. disable approach
4. Engage combat or negotiation
5. Secure laptop and/or capture Voltage

**Alternate Entry (Stealth/Tactical):**
1. Access via ventilation from adjacent room
2. Approach ENTROPY position from unexpected angle
3. Tactical advantage in confrontation

**Post-Confrontation:**
- Secure attack trigger laptop
- Collect intelligence documents
- Proceed to Task 3.2 (disable attack vectors)

### Environmental Storytelling

- ENTROPY operational sophistication (organized command center)
- OptiGrid Solutions cover maintained (equipment branding)
- Escape plan prepared (professional operational security)
- Facility blueprints show deep planning (days of preparation)
- Communications log reveals The Architect coordination
- Well-supplied (food, equipment, escape gear)

---

## Room 9: Loading Dock (Exterior - Optional)

**Room ID:** `room_loading_dock`
**Type:** `room_exterior`
**Size:** Medium (12m × 8m exterior platform)
**Function:** Optional area, Voltage escape route, alternate entry

### Room Layout

**Zones:**
- Loading platform (raised concrete platform)
- Truck bay (delivery vehicle parking)
- Storage container area (west side)
- Forklift parking (south side)
- Facility perimeter fence (background)
- Employee parking lot (visible beyond)

### Objects and Interactions

**ENTROPY Rental Van:**
- Object: `obj_entropy_van`
  - Type: `vehicle`
  - Interactive: Yes (examine)
  - Contains:
    - License plate (traceable if Voltage escapes)
    - Additional ENTROPY equipment
    - Escape vehicle (Voltage uses if escaping)
  - Function: Shows professional operational planning

**Loading Equipment:**
- Objects: `obj_forklift`, `obj_pallet_jack`
  - Type: `industrial_equipment`
  - Interactive: No (environmental)
  - Function: Authentic loading dock details

**Storage Containers:**
- Objects: `obj_storage_container_1`, `obj_storage_container_2`
  - Type: `storage`
  - Interactive: Yes (examine)
  - Contains:
    - Chemical delivery equipment
    - Normal facility supplies
  - Provides cover if confrontation occurs outside

**Employee Parking Lot (Background):**
- Visual: Cars arriving (day shift starting)
- NPCs: Background employees arriving
- Function: Shows facility operating normally (unaware of crisis)

### NPCs

**Day Shift Employees (Background):**
- NPCs: `npc_employee_background_1` through `npc_employee_background_4`
- Position: Arriving at parking lot, walking to entrance
- Behavior: Normal morning routine, unaware of crisis
- Function:
  - Shows time progression (dawn to morning)
  - Potential witnesses (affects public disclosure choice)
  - Humanizes facility (real people work here)

**Voltage (If Escaping):**
- Appears briefly if escape route taken
- Enters van and drives away
- Cannot be caught at this point (escaped)

### Locks/Puzzles

**Loading Dock Door (from exterior):**
- Object: `obj_loading_dock_exterior_door`
  - Type: `door`
  - Locked: Yes (from outside)
  - Bypass: Lockpick or wait for employee entry

**Loading Dock Door (from interior - Maintenance Wing):**
- Opens freely (emergency exit)
- Voltage's escape route

### Approach Paths

**Alternate Entry (Stealth Start):**
1. Bypass main security checkpoint
2. Enter via loading dock
3. Access facility from maintenance wing
4. Avoid Security Guard interaction

**Voltage Escape Route:**
1. If Voltage escapes Task 3.1
2. Flees through loading dock door
3. Enters rental van
4. Drives away (cannot be stopped)
5. Mission continues (attack still stoppable)

**Witness Consideration:**
1. Day shift employees arriving
2. If combat occurred here or crisis escalated to Stage 4
3. Public awareness of incident
4. Affects Task 3.3 disclosure decision

### Environmental Storytelling

- Normal facility operations (shift change, deliveries)
- ENTROPY rental van (professional cover - generic rental)
- Tire tracks (recent activity)
- Chemical delivery schedule (clipboard on wall)
- Employees unaware (normalcy juxtaposed with crisis)

---

## Room Connection Map

```
[Loading Dock] ← Emergency Exit ← [Maintenance Wing]
                                         ↑
                                    Master Lock
                                         |
[Treatment Floor] ← → [Chemical Storage] → [Control Room] → [Administration]
       ↑                     ↑                    ↑                ↑
    Level 1              Level 1             Level 1          Security
       |                     |                    |            Clearance
       |                     |                    |                |
[Server Room] ←──────────────┴────────────────────┴─────────→ [Main Entrance]
       ↑                                                           ↑
   Level 2                                                    [Security]
   Keycard
```

**Lock Requirements:**
- Main Entrance → Security clearance (credentials or bypass)
- Server Room → Level 2 keycard (from Operative #1 or Chen)
- Maintenance Wing → Master keycard (from Operative #2 or found)
- Chemical Storage → Level 1 keycard (from Chen)
- Other rooms → Level 1 keycard or adjacent room access

---

## Item Distribution Summary

### Key Items (Required)

**Access Items:**
- `item_visitor_badge` - Main Entrance (Security Guard)
- `item_facility_keycard_level1` - Administration (Robert Chen)
- `item_level2_keycard` - Treatment Floor (Operative #1) or Chen alternative
- `item_master_keycard` - Chemical Storage (Operative #2) or Maintenance Wing

**VM Flags:**
- `flag{network_scan_complete}` - Server Room VM (Task 2.2)
- `flag{ftp_intel_gathered}` - Server Room VM (Task 2.4)
- `flag{http_analysis_complete}` - Server Room VM (Task 2.4)
- `flag{distcc_exploit_complete}` - Server Room VM (Task 2.7)

**Evidence Items:**
- `item_maintenance_logs` - Administration (Task 1.3 evidence)
- `item_security_logs` - Main Entrance or Security Office
- `item_scada_anomaly_data` - Control Room (Task 1.4)

### Optional Items (Combat/Investigation)

**Intelligence Items:**
- `item_cipher_intelligence_note` - Operative #1 drop
- `item_relay_intelligence_note` - Operative #2 drop
- `item_entropy_comm_log` - Operative #3 drop
- `item_architect_communication` - Voltage (if captured)
- `item_optigrid_facility_log` - Operative #2 drop

**Equipment Items:**
- `item_encrypted_radio` - Operative #1 drop (monitor ENTROPY comms)
- `item_flashlight` - Security Office locker
- `item_facility_map` - Chen provides

---

## Puzzle/Lock Summary

### Lock Types

**Electronic Keycards (Tiered Access):**
- Level 1: Basic facility access (most rooms)
- Level 2: Secure areas (Server Room)
- Master: Restricted areas (Maintenance Wing)

**Social Engineering:**
- Main Entrance security checkpoint
- Robert Chen cooperation (facility access and support)

**Lockpicking (Alternative Paths):**
- Security Office equipment locker (easy)
- Server Room door (difficult, or use keycard)
- Maintenance Wing door (very difficult, or use master keycard)

**No Traditional Puzzles:**
- Mission focused on investigation and combat, not puzzle-solving
- SCADA systems require understanding, not puzzle mechanics
- Attack disabling (Task 3.2) is careful sequence, not puzzle

### Access Progression

**Act 1:**
- Main Entrance → Security clearance (social)
- Administration, Control Room, Security Office → Level 1 keycard

**Act 2:**
- Server Room → Level 2 keycard (combat reward or Chen trust)
- Treatment Floor, Chemical Storage → Level 1 keycard

**Act 3:**
- Maintenance Wing → Master keycard (combat reward or found)
- All areas accessible for attack vector disabling

---

## Combat Space Design Summary

### Combat Encounter Locations

**Treatment Floor (Operative #1):**
- Large open space with cover
- Vertical elements (catwalks)
- Stealth strongly viable
- Tutorial combat difficulty: Easy

**Chemical Storage (Operative #2):**
- Patrol-based encounter
- Timing and positioning important
- Hazardous environment theme
- Optional encounter difficulty: Moderate

**Maintenance Wing (Voltage + Operative #3):**
- Defensive position (ENTROPY prepared)
- Tactical combat
- Choice-driven difficulty
- Climactic encounter difficulty: Moderate-Hard

### Combat Design Principles

**Cover System:**
- Full cover (large objects, columns)
- Partial cover (equipment, low barriers)
- Dynamic cover (equipment can be used tactically)

**Stealth Viability:**
- Shadows and lighting support concealment
- Alternate routes available
- Timing-based approaches (patrols)
- Rewards patience and observation

**Movement Encouraged:**
- Open areas discourage camping
- Multiple cover positions
- Flanking opportunities
- Vertical elements (catwalks, platforms)

---

## Success Criteria for Room Design

### Functionality:
- 90%+ players can navigate facility without confusion
- Multiple approach paths clearly available
- Combat spaces support both stealth and direct engagement

### Atmosphere:
- 85%+ players feel facility is authentic industrial environment
- ENTROPY infiltration evidence visible but not heavy-handed
- Urgency progression reflected in environmental changes

### Gameplay Support:
- Rooms support all task objectives
- Item placement logical and discoverable
- Locks provide pacing without frustration
- Combat spaces feel fair and tactical

---

## Stage 5 Completion Checklist

- [x] All 9 rooms designed with detailed layouts
- [x] Object placement and interactions defined
- [x] Lock and access control systems specified
- [x] Combat encounter spaces designed
- [x] Item distribution planned
- [x] NPC positioning and patrol routes defined
- [x] Multiple approach paths for each objective
- [x] Environmental storytelling elements included
- [x] Room connection map created
- [x] VM and flag station integration confirmed

---

## Next Stage Preparation

**Stage 6: Dialogue and Ink Script Planning**
- Complete dialogue trees for all NPCs
- Ink script structure planning
- Conversation knot definitions
- Dialogue choices and branching
- Voice acting line count estimates
- Integration with objectives and tasks

**Key Questions for Stage 6:**
- How do dialogue choices affect Chen's cooperation level?
- What conversation knots are needed for each NPC?
- How is Voltage confrontation dialogue structured around player choice?
- What are the exact disclosure dialogue options in final debrief?

---

**Status:** Stage 5 Complete - Ready for Stage 6
**Estimated Development Time:** 14-16 hours for Stage 5 documentation complete
**Quality Assessment:** Comprehensive room design with detailed object placement, multi-path navigation, combat space considerations, and authentic industrial facility layout supporting narrative and gameplay goals

---

*Stage 5 establishes the complete spatial design for Mission 4, providing detailed specifications for level designers and environment artists. Each room supports multiple gameplay approaches while contributing to the escalating urgency narrative through visual and interactive elements.*
