# Room Layout: "Ghost in the Machine"

**Mission ID:** m03_ghost_in_the_machine
**Stage:** 5 - Room Layout and Challenge Distribution
**Date Created:** 2025-12-27

---

## Overview

**Location:** WhiteHat Security Services - Corporate Office Building
**Total Rooms:** 7 rooms
**Playable Area:** Small (5-8 rooms)
**Security Level:** Medium
**Time Phases:** Daytime (Act 1) → Nighttime (Act 2-3)

**Design Philosophy:**

Mission 3 uses a **hub-and-spoke layout** centered around a main hallway:
- **Central Hub:** Main hallway with guard patrol
- **Spoke Branches:** Conference room, server room, executive office, James's office
- **Progressive Unlocking:** Start with reception + conference room (Act 1), unlock server room via RFID card (Act 2), explore executive office for evidence
- **Backtracking:** Return to server room for decoding after finding evidence in executive office
- **Dual-Phase Design:** Same location visited daytime (safe, social) and nighttime (tense, infiltration)

---

## Location Description

**WhiteHat Security Services** presents itself as a legitimate penetration testing and security consulting firm operating from a modern office building. The space is professionally decorated with security certifications on walls, client testimonials, and technical equipment. During the daytime visit (Act 1), the office is lit, clean, and welcoming—a perfect corporate facade. During the nighttime infiltration (Act 2-3), the same spaces transform: dim emergency lighting, shadows, the sound of HVAC systems, and a single guard on patrol create tension.

The office layout is designed to separate public-facing areas (reception, conference room) from secured operational spaces (server room, executive offices). This physical separation mirrors Zero Day's compartmentalization: legitimate business in front, criminal operations hidden behind RFID-locked doors.

The server room serves as the investigation hub—where VM challenges unlock digital intelligence that correlates with physical evidence gathered from executive spaces. Players will repeatedly return here to decode messages using the CyberChef workstation, creating a satisfying loop of discovery and synthesis.

---

## Individual Room Designs

### Room 1: Reception Lobby

**ID:** `reception_lobby`
**Dimensions:** 8 × 6 GU (12m × 9m)
**Usable Space:** 6 × 4 GU
**Type:** Reception / Entrance
**Act:** Act 1 (Daytime) & Act 2 (Nighttime - guard patrol start)

**Description:**
Professional reception area with modern furniture. WhiteHat Security logo on wall. Reception desk with dual monitors. Company awards and certifications (OSCP, CEH, PCI-DSS compliance) displayed prominently. During daytime: bright, welcoming. During nighttime: single desk lamp, shadows, empty.

**Connections:**
- **North:** `main_hallway` (open door - always accessible)

**Containers:**
1. **Reception Desk Drawer**
   - **Position:** (3, 2) in usable space
   - **Lock:** None
   - **Contents:** Building directory, company brochure
   - **Narrative Purpose:** First impression of WhiteHat's legitimate facade

2. **Wall-Mounted Display Case**
   - **Position:** (1, 1) in usable space
   - **Lock:** None (decorative)
   - **Contents:** Security certifications (visual only - not pickupable)
   - **Narrative Purpose:** Establish company credibility

**Interactive Objects:**
- **Company Founding Plaque**
  - **Position:** (5, 2) on east wall
  - **Interaction:** Examine to read "WhiteHat Security Services - Founded 2010"
  - **Result:** Provides safe PIN clue (2010 is executive safe combination)
  - **Objectives:** Optional discovery for `lore_fragment_2`

**NPCs:**
- **Receptionist** (In-Person - Daytime Only)
  - **Position:** (3, 2) at desk
  - **Dialogue Trigger:** Automatic when player enters (first visit)
  - **Gives Items:** None
  - **Objectives:** Establishes cover story, directs player to conference room
  - **Daytime Only:** Not present during nighttime infiltration

- **Night Security Guard** (Patrol Route - Nighttime Only)
  - **Starting Position:** (3, 2) - begins patrol from reception
  - **Patrol Route:** Reception (15 ticks) → Hallway → Executive wing → Server wing → Return
  - **Dialogue Trigger:** If detected by player
  - **Objectives:** Stealth challenge for `perfect_stealth` optional objective
  - **Nighttime Only:** Not present during daytime visit

**Objectives Completed Here:**
- `meet_receptionist` (daytime) - Establish cover story
- Optional: Discovery of safe PIN clue (2010 founding year)

**LORE Fragments:** None

**Technical Notes:**
- Receptionist NPC conditionally spawned: `time_of_day == "daytime"`
- Guard NPC conditionally spawned: `time_of_day == "nighttime"`
- Guard patrol implemented via waypoint system

---

### Room 2: Conference Room

**ID:** `conference_room_01`
**Dimensions:** 10 × 8 GU (15m × 12m)
**Usable Space:** 8 × 6 GU
**Type:** Conference / Meeting Room
**Act:** Act 1 (Daytime - Victoria meeting)

**Description:**
Professional conference room with large table (seats 8), whiteboard on east wall, projector screen, windows overlooking city. Corporate but comfortable. Victoria Sterling's domain for client meetings.

**Connections:**
- **South:** `main_hallway` (open door during daytime, unlocked during nighttime)

**Containers:**
1. **Conference Table Storage**
   - **Position:** (4, 3) center of room
   - **Lock:** None
   - **Contents:** Presentation materials, company portfolio
   - **Narrative Purpose:** Flavor/atmosphere

**Interactive Objects:**
- **Whiteboard** (No encoding - clear for meeting space)
  - **Position:** (7, 4) on east wall
  - **Interaction:** Examine
  - **Result:** Shows legitimate security diagrams (cover business)
  - **Note:** Different from server room whiteboard with ROT13

**NPCs:**
- **Victoria Sterling** (In-Person - Daytime Only)
  - **Position:** (4, 3) at conference table
  - **Dialogue Trigger:** Automatic when player enters (Scene 3)
  - **Gives Items:** None (player clones RFID card via proximity)
  - **Objectives:**
    - `meet_victoria` - Completed automatically when dialogue starts
    - `clone_rfid_card` - Player uses RFID cloner device during meeting
  - **RFID Cloning Mechanic:** Player must remain within 2 GU of Victoria for 10 seconds
  - **Daytime Only:** Victoria not present during nighttime

**Objectives Completed Here:**
- `meet_victoria` - Meet Victoria Sterling at WhiteHat Security
- `clone_rfid_card` - Clone Victoria Sterling's executive keycard (PRIMARY - unlocks Act 2)

**LORE Fragments:** None

**Technical Notes:**
- Victoria NPC conditionally spawned: `time_of_day == "daytime" AND mission_phase == "act1_meeting"`
- RFID cloning minigame: proximity-based, 10-second timer, progress bar overlay
- Completing `clone_rfid_card` unlocks Aim 1.2 and Aim 1.3 (server room + executive office accessible nighttime)

---

### Room 3: Main Hallway

**ID:** `main_hallway`
**Dimensions:** 12 × 4 GU (18m × 6m) - Long corridor
**Usable Space:** 10 × 2 GU
**Type:** Corridor / Circulation
**Act:** Acts 1-3 (All phases)

**Description:**
Central corridor connecting all office areas. Corporate carpeting, recessed lighting (bright daytime, emergency lighting nighttime), office doors on both sides. Professional but utilitarian.

**Connections:**
- **South:** `reception_lobby` (open - always accessible)
- **West:** `conference_room_01` (open daytime, unlocked nighttime)
- **North:** `server_room` (RFID locked - requires cloned keycard)
- **East:** `executive_wing_hallway` (open - connects to executive office)

**Containers:** None (hallway - no storage)

**Interactive Objects:** None (circulation space)

**NPCs:**
- **Night Security Guard** (Patrol Route - Nighttime Only)
  - **Patrol Waypoints:**
    - Waypoint 1: (2, 1) near reception connection - 15 tick pause
    - Waypoint 2: (6, 1) center hallway - 15 tick pause
    - Waypoint 3: (9, 1) near server room door - 20 tick pause
    - Loop back to Waypoint 1
  - **Total Patrol Time:** ~60 seconds per loop
  - **Line of Sight:** 150 pixels (~7.5 GU), 120° cone in facing direction
  - **Dialogue Trigger:** If player detected
  - **Objectives:** Stealth challenge - avoid detection for `perfect_stealth`

**Objectives Completed Here:** None (circulation/navigation space)

**LORE Fragments:** None

**Technical Notes:**
- Guard patrol critical for stealth challenge
- Server room door requires `victoria_keycard_clone` item to unlock
- Executive wing accessible without lock (public-facing management area)

---

### Room 4: Server Room (PRIMARY INVESTIGATION HUB)

**ID:** `server_room`
**Dimensions:** 10 × 10 GU (15m × 15m)
**Usable Space:** 8 × 8 GU
**Type:** IT / Server Room / Data Center
**Act:** Act 2-3 (Nighttime - investigation hub)

**Description:**
Technical space with racks of servers (blinking LEDs - green/amber), three distinct workstation areas, whiteboard on north wall, filing cabinet, wall-mounted safe. HVAC hum provides constant background ambiance. Emergency lighting creates blue/green tech aesthetic mixed with shadows. This is the investigation nerve center where VM challenges and physical evidence converge.

**Connections:**
- **South:** `main_hallway` (RFID locked - requires `victoria_keycard_clone` item)
  - **Unlock Condition:** Player must have completed `clone_rfid_card` task
  - **Lock Type:** RFID keycard reader
  - **Alternative:** If victoria_trust >= 40, Victoria grants access (bypasses cloning)

**Containers:**
1. **Filing Cabinet (Northwest Corner)**
   - **Position:** (1, 7) in usable space
   - **Lock:** Physical lock (requires lockpicking)
   - **Contents:** Client list documents, network diagrams
   - **Narrative Purpose:** Additional evidence correlating with VM findings
   - **Objectives:** Optional - provides context for `decode_client_roster`

2. **Wall-Mounted Safe**
   - **Position:** (7, 7) on east wall
   - **Lock:** PIN lock (code: 2010)
   - **Contents:** LORE Fragment 2 "Q3 2024 Exploit Catalog"
   - **Narrative Purpose:** Optional LORE collection
   - **Objectives:** `lore_fragment_2` - Open Victoria's safe
   - **PIN Source:** Founding year on reception plaque

**Interactive Objects:**

1. **Whiteboard with ROT13 Message**
   - **Position:** (4, 7) on north wall
   - **Interaction:** Examine to photograph/copy encoded text
   - **Content:** "ZRRG JVGU GUR NEPUVGRPG - CEVBEVGVMR VASENFGEHPGHER RKCYBVGF"
   - **Decoded:** "MEET WITH THE ARCHITECT - PRIORITIZE INFRASTRUCTURE EXPLOITS"
   - **Objectives:** `decode_whiteboard` - Decode ROT13 message
   - **Workflow:** Examine whiteboard → Copy text → Decode at CyberChef workstation

2. **VM Access Terminal (Left Workstation)**
   - **Position:** (2, 4) in usable space
   - **Interaction:** Access VM challenges (terminal minigame)
   - **Purpose:** Player runs nmap, netcat, HTTP analysis, Metasploit
   - **Network:** 192.168.100.0/24 (Zero Day training network)
   - **Objectives:**
     - `scan_network` - nmap port scanning
     - `ftp_banner` - Banner grabbing
     - `http_analysis` - HTTP service analysis
     - `distcc_exploit` - distcc exploitation (CRITICAL - triggers M2 revelation)

3. **CyberChef Workstation (Right Workstation)**
   - **Position:** (6, 4) in usable space
   - **Interaction:** Decoding station for ROT13, Hex, Base64
   - **Purpose:** Player decodes messages found elsewhere
   - **Objectives:**
     - `decode_whiteboard` - ROT13 decode
     - `decode_client_roster` - Hex decode (from Victoria's computer)
     - `lore_fragment_3` - Double-decode (ROT13+Base64 from USB drive)

4. **Drop-Site Terminal (Center Workstation)**
   - **Position:** (4, 4) center of room
   - **Interaction:** Submit VM flags, receive Agent 0x99 messages
   - **Purpose:** Flag submission unlocks narrative intel
   - **Objectives:**
     - All VM flag submissions (`scan_network`, `ftp_banner`, `http_analysis`, `distcc_exploit`)
     - Triggers Agent 0x99 event conversations

5. **Operational Logs File (Event-Spawned)**
   - **Position:** Appears on drop-site terminal after `distcc_exploit` completed
   - **Interaction:** Examine text file
   - **Content:** "ProFTPD exploit sold to Ransomware Inc for $12,500 (healthcare premium)"
   - **Objectives:** `find_operational_logs` - **MIDPOINT TWIST** (M2 hospital connection)
   - **Event Trigger:** Spawns when `distcc_exploit` task completed

**NPCs:**
- **Agent 0x99** (Phone/Event-Triggered)
  - **Mode:** Not physically present (phone chat + event-triggered messages)
  - **Event Triggers:**
    - When `distcc_exploit` completed → Auto-triggered conversation "M2 Connection Revealed"
    - When all evidence gathered → Available for debrief preparation
  - **Dialogue Purpose:** Handler guidance, M2 revelation response
  - **Objectives:** Narrative progression via event system

**Objectives Completed Here:**
- **VM Flag Tasks (Aim 1.2):**
  - `scan_network` - Use nmap to scan training network
  - `ftp_banner` - Connect to FTP and extract banner intelligence
  - `http_analysis` - Analyze HTTP service and decode Base64 pricing data
  - `distcc_exploit` - Exploit legacy distcc service (CRITICAL)

- **Physical Evidence Tasks (Aim 1.3):**
  - `decode_whiteboard` - Decode ROT13 message on whiteboard
  - `find_operational_logs` - Correlate VM logs with physical evidence (M2 revelation)

- **Optional:**
  - `lore_fragment_2` - Open safe with PIN 2010

**LORE Fragments:**
- **Fragment 2:** "Q3 2024 Exploit Catalog" (in wall safe, PIN 2010)

**Technical Notes:**
- **RFID Door Lock:** Requires `victoria_keycard_clone` item OR `victoria_trust >= 40`
- **VM Terminal:** Separate minigame system for command input
- **CyberChef:** Decoding interface (ROT13, Hex, Base64 supported)
- **Drop-Site Terminal:** Flag submission triggers Ink tags + event conversations
- **Event Spawn:** operational_logs.txt appears after distcc_exploit flag submitted
- **Agent 0x99 Event:** Auto-triggers when distcc_exploit completed (M2 revelation cutscene)

---

### Room 5: Executive Wing Hallway

**ID:** `executive_wing_hallway`
**Dimensions:** 8 × 4 GU (12m × 6m)
**Usable Space:** 6 × 2 GU
**Type:** Corridor
**Act:** Acts 1-3 (All phases)

**Description:**
Short hallway connecting main circulation to executive offices. More upscale than main hallway: wood paneling, framed corporate achievements, better carpet. Represents management tier of organization.

**Connections:**
- **West:** `main_hallway` (open - always accessible)
- **North:** `executive_office` (locked - requires lockpicking OR victoria_trust >= 40)
- **South:** `james_office` (unlocked - public consultant office)

**Containers:** None

**Interactive Objects:** None

**NPCs:** None

**Objectives Completed Here:** None (circulation space)

**LORE Fragments:** None

**Technical Notes:**
- Executive office door: Physical lock (lockpicking) OR granted access if high trust
- James's office: Unlocked (he's just a consultant, not executive)

---

### Room 6: Executive Office (Victoria Sterling's Workspace)

**ID:** `executive_office`
**Dimensions:** 10 × 8 GU (15m × 12m)
**Usable Space:** 8 × 6 GU
**Type:** Private Office / Executive
**Act:** Act 2-3 (Nighttime investigation)

**Description:**
Victoria Sterling's private office. Expensive desk, leather chair, floor-to-ceiling windows overlooking city, corporate art. Professional facade with criminal evidence hidden in plain sight. Locked filing cabinet, wall safe, executive computer. No Victoria present during nighttime (she's left for the day).

**Connections:**
- **South:** `executive_wing_hallway` (locked door - lockpicking OR victoria_trust >= 40)
  - **Lock Type:** Physical lock (lockpicking)
  - **Alternative:** If victoria_trust >= 40, Victoria grants access (social engineering path)

**Containers:**

1. **Filing Cabinet**
   - **Position:** (1, 5) northwest corner
   - **Lock:** Physical lock (lockpicking)
   - **Contents:** LORE Fragment 1 "Zero Day: A Brief History"
   - **Narrative Purpose:** LORE collection
   - **Objectives:** `lore_fragment_1` - Find document detailing Zero Day's founding

2. **Desk Drawer (Hidden Compartment)**
   - **Position:** (4, 3) at desk
   - **Lock:** None (but hidden - requires examination)
   - **Contents:** Hidden USB drive with double-encoded message
   - **Narrative Purpose:** Advanced encoding puzzle
   - **Objectives:** `lore_fragment_3` - Decode double-encoded USB drive message

3. **Wall Safe**
   - **Position:** (7, 5) behind painting on east wall
   - **Lock:** PIN lock (code: 2010)
   - **Contents:** LORE Fragment 2 DUPLICATE NOTE: This should be in server room instead
   - **Narrative Purpose:** CORRECTION - This safe should contain different evidence
   - **Technical Note:** Actually, safe in SERVER ROOM has LORE 2. This executive safe should have exploit catalog or evidence documents

**Interactive Objects:**

1. **Victoria's Executive Computer**
   - **Position:** (4, 3) on desk
   - **Interaction:** Login (requires password OR bypass)
   - **Purpose:** Access email drafts, hex-encoded client files
   - **Contents:**
     - Email draft (Base64): Pricing update to Cipher
     - Client roster file (Hex-encoded): Zero Day Syndicate client list
   - **Objectives:**
     - `access_victoria_computer` - Access Victoria's computer
     - `decode_client_roster` - Decode hex-encoded client roster (at CyberChef)

2. **Hidden USB Drive (in desk drawer)**
   - **Position:** (4, 3) hidden compartment
   - **Interaction:** Find via careful desk examination
   - **Contents:** File with double-encoding (Base64 → ROT13)
   - **Decoded Message:** The Architect's directive about Phase 1
   - **Objectives:** `lore_fragment_3` - Decode double-encoded message

**NPCs:** None (Victoria not present during nighttime infiltration)

**Objectives Completed Here:**
- **Physical Evidence Tasks:**
  - `access_victoria_computer` - Access executive computer
  - `decode_client_roster` - Find hex-encoded files (decode at server room CyberChef)

- **Optional LORE:**
  - `lore_fragment_1` - Filing cabinet (lockpick)
  - `lore_fragment_3` - Hidden USB drive (double-encode puzzle)

**LORE Fragments:**
- **Fragment 1:** "Zero Day: A Brief History" (filing cabinet, lockpick required)
- **Fragment 3:** "The Architect's Directive" (hidden USB, double-encode: Base64+ROT13)

**Technical Notes:**
- Door lock: Physical lock (lockpicking skill) OR social engineering bypass (victoria_trust >= 40)
- Computer password: Can be found via investigation OR bypass via hacking minigame
- USB drive: Hidden interaction (requires "Search desk carefully" action)
- Hex-encoded files must be decoded at CyberChef workstation in server room (backtracking)

---

### Room 7: James Park's Office (Optional Investigation)

**ID:** `james_office`
**Dimensions:** 8 × 6 GU (12m × 9m)
**Usable Space:** 6 × 4 GU
**Type:** Consultant Office
**Act:** Act 2 (Optional - moral complexity discovery)

**Description:**
Small consultant office. Modest desk with dual monitors, OSCP and CEH certifications framed on wall, family photos prominent. Neat, organized, genuinely professional. Evidence of ethical hacking work: penetration testing reports for hospitals, banks, legitimate clients. **This room establishes James's innocence.**

**Connections:**
- **North:** `executive_wing_hallway` (unlocked - James is just a consultant)

**Containers:**
1. **Desk Drawer**
   - **Position:** (3, 2)
   - **Lock:** None (unlocked - James has nothing to hide)
   - **Contents:** Performance review document (exceptional ethical standards)
   - **Narrative Purpose:** Establishes innocence
   - **Objectives:** `james_choice_made` trigger - Discovery unlocks moral choice

**Interactive Objects:**

1. **Family Photo on Desk**
   - **Position:** (3, 2) prominently displayed
   - **Interaction:** Examine
   - **Content:** James with wife Emily and daughter Sophie (age 4)
   - **Description:** Sophie holding sign "My Daddy is a Good Hacker!"
   - **Narrative Purpose:** Emotional impact - humanizes potential collateral damage
   - **Objectives:** Part of james_innocence_confirmed discovery

2. **Computer (James's Workstation)**
   - **Position:** (3, 3)
   - **Interaction:** Optional - examine emails
   - **Contents:** Email to wife Emily about Sophie's school presentation
   - **Narrative Purpose:** Further establishes innocence and family connection
   - **Objectives:** Optional depth for moral choice

3. **Certification Wall**
   - **Position:** (1, 3) west wall
   - **Interaction:** Examine
   - **Content:** OSCP (Offensive Security Certified Professional), CEH (Certified Ethical Hacker)
   - **Narrative Purpose:** Proves James's ethical hacking background
   - **Objectives:** Reinforces innocence

**NPCs:** None (James not present during nighttime - he's home with family)

**Objectives Completed Here:**
- **Optional Moral Choice:**
  - Discovery of innocence evidence triggers `james_choice_made` opportunity
  - Player can choose: warn James, plant evidence, or ignore

**LORE Fragments:** None

**Technical Notes:**
- Room is OPTIONAL - player doesn't need to visit for main objectives
- Discovering innocence evidence sets `james_innocence_confirmed = true`
- This unlocks moral choice dialogue in later scene
- All containers unlocked (James has nothing to hide)
- Evidence of innocence: performance review, family photo, certifications, email

---

## Overall Map Layout

```
                    ┌─────────────────┐
                    │  Server Room    │
                    │    (10×10)      │
                    │   [RFID LOCK]   │
                    └────────┬────────┘
                             │
┌──────────────┐    ┌────────┴─────────┐    ┌──────────────────┐
│ Conference   │────│  Main Hallway    │────│ Executive Wing   │
│   Room       │    │     (12×4)       │    │    Hallway       │
│  (10×8)      │    │  [Guard Patrol]  │    │     (8×4)        │
└──────────────┘    └────────┬─────────┘    └────┬─────┬───────┘
                             │                   │     │
                    ┌────────┴────────┐          │     │
                    │  Reception      │     ┌────┴─┐   │
                    │   Lobby         │     │James'│   │
                    │    (8×6)        │     │Office│   │
                    │  [START/ENTRY]  │     │(8×6) │   │
                    └─────────────────┘     └──────┘   │
                                                        │
                                                  ┌─────┴──────┐
                                                  │ Executive  │
                                                  │   Office   │
                                                  │   (10×8)   │
                                                  │  [LOCKED]  │
                                                  └────────────┘
```

**Key:**
- [RFID LOCK] - Requires cloned Victoria keycard
- [LOCKED] - Requires lockpicking OR high victoria_trust
- [Guard Patrol] - Security guard patrols this area (nighttime)
- [START/ENTRY] - Player enters here (both daytime and nighttime)

**Room Count:** 7 rooms total
**Critical Path:** Reception → Hallway → Conference Room (daytime) → Server Room (nighttime) → Evidence gathering
**Optional Path:** Executive Office, James's Office

---

## Progressive Unlocking Flow

### Initial State (Mission Start - Daytime Act 1)

**✅ Accessible:**
- Reception Lobby (starting room)
- Main Hallway
- Conference Room (Victoria meeting location)

**🔒 Locked:**
- Server Room (RFID locked - requires Victoria's keycard clone)
- Executive Office (physical lock - requires lockpicking OR victoria_trust >= 40)
- James's Office (unlocked but not visited yet)
- Executive Wing Hallway (accessible but leads to locked areas)

**Mission Phase:** Daytime undercover meeting with Victoria

---

### After Task: clone_rfid_card (End of Act 1)

**🔓 Unlocks:**
- Server Room via cloned RFID keycard
- **Alternative Path:** If victoria_trust >= 40, Victoria grants server room access voluntarily

**New Accessible:**
- Server Room (PRIMARY INVESTIGATION HUB)
  - VM terminal for challenges
  - CyberChef workstation for decoding
  - Drop-site terminal for flag submission

**Mission Transition:** Daytime → Nighttime (time skip to 2:00 AM)

---

### After Nighttime Infiltration Begins (Act 2 Start)

**✅ Now Accessible:**
- All daytime rooms (but empty - no NPCs except guard)
- Server Room (if RFID cloned OR trust path)
- Executive Wing Hallway (can explore)
- James's Office (optional - unlocked)

**🔒 Still Locked:**
- Executive Office (lockpicking required OR victoria_trust >= 40)

**New Challenges:**
- Night security guard on patrol (stealth challenge)
- RFID door to server room (unless already have keycard/access)

---

### After Task: access_victoria_computer

**🔓 Unlocks:**
- Executive Office interior (via lockpicking door OR social engineering)
- Access to Victoria's computer (password required OR hack)
- Filing cabinet, desk drawer, wall safe all become accessible

**New Accessible:**
- LORE Fragment 1 (filing cabinet, requires lockpicking)
- LORE Fragment 3 (hidden USB drive in desk)
- Hex-encoded client roster (computer file)
- Email drafts (computer)

**Backtracking Required:**
- Must return to Server Room CyberChef to decode hex files

---

### After Task: distcc_exploit (MIDPOINT TWIST)

**🔓 Event-Unlocked:**
- Operational logs file spawns on drop-site terminal
- Agent 0x99 auto-triggered conversation (M2 revelation)

**New Intelligence:**
- M2 hospital connection revealed
- ProFTPD sale to GHOST for $12,500 discovered
- Campaign narrative escalation

---

### Final State (All Evidence Collected)

**✅ All Accessible:**
- All 7 rooms fully explored
- All containers opened (lockpicking, PIN codes)
- All evidence gathered (physical + digital)
- All VM flags submitted

**Mission Progression:**
- Optional: Victoria confrontation
- Optional: James protection choice
- Mission completion criteria met

---

## Lock Variety Analysis

### Lock Types Used: ✅ 5 different types

- ✅ **RFID Keycard** (social/technical)
- ✅ **Physical Locks / Lockpicking** (skill-based)
- ✅ **PIN Codes** (cognitive/investigation)
- ✅ **Passwords** (hacking/investigation)
- ✅ **Hidden Items** (exploration/examination)

**Variety Score:** Excellent - 5 different lock types across 7 rooms

### Lock Progression Order:

#### Lock 1: RFID Keycard Clone (Social Engineering + Technical)
- **Location:** Server Room door
- **Unlock Method:** Clone Victoria's keycard during meeting (proximity-based minigame)
- **Difficulty:** Medium
- **Rewards:** Access to server room (PRIMARY HUB)
- **Blocks Critical Path:** YES (must access server room for VM challenges)
- **Type:** RFID/Keycard

#### Lock 2: PIN Code Safe (Cognitive Discovery)
- **Location:** Server Room wall safe
- **Unlock Method:** Discover founding year (2010) from reception plaque
- **Difficulty:** Easy (hint in plain sight)
- **Rewards:** LORE Fragment 2 "Exploit Catalog"
- **Blocks Critical Path:** NO (optional LORE)
- **Type:** PIN

#### Lock 3: Executive Office Door (Physical Lock)
- **Location:** Executive Office entrance
- **Unlock Method:** Lockpicking OR victoria_trust >= 40 (social engineering bypass)
- **Difficulty:** Medium
- **Rewards:** Access to Victoria's workspace (computer, filing cabinet, LORE)
- **Blocks Critical Path:** NO (server room has enough for minimum objectives)
- **Type:** Physical Lock / Lockpicking

#### Lock 4: Filing Cabinet in Executive Office (Physical Lock)
- **Location:** Executive Office filing cabinet
- **Unlock Method:** Lockpicking
- **Difficulty:** Easy (lockpicking skill)
- **Rewards:** LORE Fragment 1 "Zero Day Origins"
- **Blocks Critical Path:** NO (optional LORE)
- **Type:** Physical Lock / Lockpicking

#### Lock 5: Filing Cabinet in Server Room (Physical Lock)
- **Location:** Server Room filing cabinet
- **Unlock Method:** Lockpicking
- **Difficulty:** Easy
- **Rewards:** Additional client documents
- **Blocks Critical Path:** NO (optional context)
- **Type:** Physical Lock / Lockpicking

#### Lock 6: Victoria's Computer (Password)
- **Location:** Executive Office computer
- **Unlock Method:** Find password hints OR bypass via hacking minigame
- **Difficulty:** Medium
- **Rewards:** Hex-encoded client roster, email drafts
- **Blocks Critical Path:** Partially (required for `access_victoria_computer` task)
- **Type:** Password

#### Lock 7: Hidden USB Drive (Exploration)
- **Location:** Executive Office desk hidden compartment
- **Unlock Method:** Careful desk examination (no lock, just hidden)
- **Difficulty:** Easy (search action)
- **Rewards:** LORE Fragment 3 (double-encoded message)
- **Blocks Critical Path:** NO (optional LORE)
- **Type:** Hidden Item

### Critical Path Locks:
1. **RFID Keycard** (server room) → **REQUIRED**
2. **Passwords** (Victoria's computer) → **REQUIRED** for full evidence

**Optional Locks:** PIN safe, filing cabinets, hidden USB (all LORE/optional)

### Validation Checklist:

- ✅ At least 3 different lock types used (5 total)
- ✅ Keys used BEFORE lockpick obtained: N/A (no traditional keys in this mission)
- ✅ Locks ordered easy → medium → hard: YES (founding year → RFID clone → lockpicking + passwords)
- ✅ Lockpick comes after key-based progression: N/A (lockpick pre-existing skill, not obtained mid-mission)
- ✅ No "same-y" gameplay: Excellent variety (social engineering, investigation, technical, skill-based)
- ✅ PIN codes have discoverable hints: YES (2010 founding year on plaque)

**Design Notes:**
- Mission focuses on **social engineering** (RFID cloning) and **investigation** (finding passwords, decoding) rather than traditional key-finding
- Lockpicking is a **supplementary skill** for optional content, not critical path
- RFID cloning mechanic is NEW for Mission 3, providing fresh gameplay
- Lock variety supports multiple playstyles: stealth, social engineering, technical exploitation

---

## Container and Lock Summary

### All Containers

| Room | Container Type | Position | Lock Type | Contents | Objectives |
|------|----------------|----------|-----------|----------|------------|
| Reception Lobby | Desk Drawer | (3, 2) | None | Building directory, brochure | Flavor |
| Reception Lobby | Display Case | (1, 1) | None | Certifications (visual only) | Atmosphere |
| Server Room | Filing Cabinet | (1, 7) | Physical | Client documents, network diagrams | Optional context |
| Server Room | Wall Safe | (7, 7) | PIN (2010) | LORE Fragment 2 "Exploit Catalog" | `lore_fragment_2` |
| Executive Office | Filing Cabinet | (1, 5) | Physical | LORE Fragment 1 "Zero Day Origins" | `lore_fragment_1` |
| Executive Office | Desk Drawer | (4, 3) | Hidden | USB drive (double-encoded message) | `lore_fragment_3` |
| James's Office | Desk Drawer | (3, 2) | None | Performance review document | `james_innocence_confirmed` |

**Total Containers:** 7 (2 flavor, 5 objectives-related)

### All Locks and Keys

| Lock Location | Lock Type | Unlock Method | Difficulty | Source/Clue | Critical Path |
|---------------|-----------|---------------|------------|-------------|---------------|
| Server Room Door | RFID Keycard | Clone Victoria's keycard | Medium | Victoria (proximity-based) | YES |
| Server Room Safe | PIN (2010) | Enter code | Easy | Reception plaque (founding year) | NO (LORE) |
| Executive Office Door | Physical | Lockpicking OR trust | Medium | Skill OR social engineering | NO (optional) |
| Executive Office Filing Cabinet | Physical | Lockpicking | Easy | Skill | NO (LORE) |
| Server Room Filing Cabinet | Physical | Lockpicking | Easy | Skill | NO (optional) |
| Victoria's Computer | Password | Find hints OR hack | Medium | Investigation OR bypass | YES (partial) |
| USB Drive | Hidden | Careful examination | Easy | Search desk thoroughly | NO (LORE) |

**Total Locks:** 7 across 5 different types

---

## NPC Placement Summary

| NPC Name | Room | Mode | Position/Route | Dialogue Trigger | Items Given | Objectives |
|----------|------|------|----------------|------------------|-------------|------------|
| **Receptionist** | Reception Lobby | In-Person (daytime) | (3, 2) at desk | Auto (first visit) | None | Cover story, direction |
| **Victoria Sterling** | Conference Room | In-Person (daytime) | (4, 3) at table | Auto (Scene 3) | None (RFID cloned from her) | `meet_victoria`, `clone_rfid_card` |
| **Night Security Guard** | Main Hallway + Reception | Patrol (nighttime) | 4-waypoint patrol | If detected | None | Stealth challenge, `perfect_stealth` |
| **Agent 0x99** | N/A (Phone) | Phone/Event-Triggered | Remote | Event-triggered | None | Handler guidance, M2 revelation |

**NPC Count:** 4 total
- **In-Person (Daytime):** 2 (Receptionist, Victoria)
- **Patrol (Nighttime):** 1 (Guard)
- **Phone/Remote:** 1 (Agent 0x99)

**Guard Patrol Route:**
- Waypoint 1: Reception Lobby (3, 2) - 15 tick pause
- Waypoint 2: Main Hallway (2, 1) - 15 tick pause
- Waypoint 3: Main Hallway (6, 1) - 15 tick pause
- Waypoint 4: Main Hallway (9, 1) near server room - 20 tick pause
- Loop time: ~60 seconds

---

## Hybrid Architecture Integration

### VM Access Points

| Room | Terminal ID | Position | Access Requirements | VM Challenge | Network |
|------|-------------|----------|---------------------|--------------|---------|
| Server Room | VM Access Terminal | (2, 4) | Server room access (RFID) | Port scanning, service enum, exploitation | 192.168.100.0/24 |

**VM Challenges:**
1. Network scanning (nmap) → `flag{network_scan_complete}`
2. FTP banner grabbing (netcat) → `flag{ftp_intel_gathered}`
3. HTTP analysis (curl + Base64) → `flag{pricing_intel_decoded}`
4. distcc exploitation (Metasploit) → `flag{distcc_legacy_compromised}`

### Drop-Site Terminals

| Room | Terminal ID | Position | Flags Submitted | Unlocks |
|------|-------------|----------|-----------------|---------|
| Server Room | Drop-Site Terminal | (4, 4) center | All 4 VM flags | Narrative intel, Agent 0x99 events, operational logs |

**Flag Submission Flow:**
- Player completes VM challenge → Obtains flag
- Player submits flag at drop-site terminal
- Ink tag triggered: `#complete_task:task_id`
- Narrative intelligence unlocked (documents, Agent 0x99 messages)
- Special: `distcc_exploit` flag triggers M2 revelation event

### CyberChef Workstations

| Room | Terminal ID | Position | Purpose | Decoding Types |
|------|-------------|----------|---------|----------------|
| Server Room | CyberChef Workstation | (6, 4) | Decode messages | ROT13, Hex, Base64, Nested |

**Decoding Tasks:**
- Whiteboard ROT13 → "MEET WITH THE ARCHITECT - PRIORITIZE INFRASTRUCTURE EXPLOITS"
- Client roster Hex → Zero Day client list
- USB drive Base64+ROT13 → Architect's directive

### Correlation Tasks (VM + In-Game)

| Task | VM Component | In-Game Component | Location | Result |
|------|--------------|-------------------|----------|--------|
| `http_analysis` | HTTP fetch (curl) | Base64 decode (CyberChef) | Server Room | Pricing intelligence |
| `find_operational_logs` | distcc exploit flag | Examine spawned file | Server Room | M2 hospital connection |

---

## Technical Validation

### Room Dimensions Compliance

| Room | Dimensions (GU) | Usable Space (GU) | Compliant | Notes |
|------|-----------------|-------------------|-----------|-------|
| Reception Lobby | 8 × 6 | 6 × 4 | ✅ | Within 4×4 to 15×15 range |
| Conference Room | 10 × 8 | 8 × 6 | ✅ | Within range |
| Main Hallway | 12 × 4 | 10 × 2 | ✅ | Long corridor design |
| Server Room | 10 × 10 | 8 × 8 | ✅ | Square layout |
| Executive Wing Hallway | 8 × 4 | 6 × 2 | ✅ | Short corridor |
| Executive Office | 10 × 8 | 8 × 6 | ✅ | Within range |
| James's Office | 8 × 6 | 6 × 4 | ✅ | Within range |

**All rooms compliant:** ✅ 7/7

### Item Placement Compliance

- ✅ All containers placed in usable space (not padding)
- ✅ All NPCs placed in usable space
- ✅ All interactive objects in usable space
- ✅ Door connections at room edges (padding zone)
- ✅ No items in 1 GU padding zone

### Room Connection Validation

- ✅ All connections have ≥ 1 GU overlap
- ✅ Door positions specified for all connections
- ✅ Locked doors have unlock conditions
- ✅ No circular dependencies (can't get keycard without keycard)

---

## Design Notes

### Pacing

**Act 1 (Daytime - 15-25 min):**
- Limited exploration: Reception, Hallway, Conference Room
- Focus: Social interaction, RFID cloning, atmosphere establishment
- Pacing: Calm, professional, building tension

**Act 2 (Nighttime - 30-40 min):**
- Full exploration unlocked: Server room + optional areas
- Focus: VM challenges, evidence gathering, stealth
- Pacing: Tense infiltration, steady investigation rhythm, puzzle-solving
- Hub-and-spoke: Server room as return point for decoding

**Act 3 (Climax - 10-15 min):**
- Evidence synthesis, moral choices, confrontation
- Focus: Narrative payoff, player agency
- Pacing: Escalating tension, resolution

### Difficulty Curve

**Easy Start:**
- Reception exploration (no challenges)
- Victoria meeting (social interaction)
- Founding year clue (plainly visible)

**Medium Progression:**
- RFID cloning (new mechanic, 10-second window)
- Guard stealth (pattern recognition)
- VM port scanning (guided tutorial)

**Hard Challenges:**
- distcc exploitation (advanced VM challenge)
- Password finding (investigation required)
- Hex/Base64 decoding (multi-step processes)

**Expert Optional:**
- Double-encoded USB drive (Base64 → ROT13)
- Perfect stealth (complete guard avoidance)
- All LORE collection (requires thorough exploration)

### Atmosphere

**Daytime Corporate Facade:**
- Professional, clean, well-lit
- NPCs present (receptionist, Victoria)
- Legitimate business appearance
- Calm music, normal office sounds

**Nighttime Infiltration:**
- Dark, emergency lighting, shadows
- Empty spaces, single guard patrol
- HVAC hum amplified, building settling sounds
- Tension music, stealth audio cues
- Same locations feel completely different

### Player Guidance

**Clear Objectives:**
- Act 1: Meet Victoria (direct quest marker)
- Act 2: Access server room (RFID door visual cue)
- VM challenges: Drop-site terminal provides guidance

**Environmental Cues:**
- RFID door: Visual indicator (locked, requires keycard)
- Locked doors: Physical lock icon
- Interactive objects: Highlight/examine prompts
- Guard patrol: Audio cues (footsteps)

**Non-Linear Freedom:**
- Server room accessible early (if RFID cloned)
- Executive office optional (lockpicking path)
- James's office entirely optional
- Multiple solution paths (social engineering vs. stealth)

---

**Status:** ✅ COMPLETE
**Total Documentation:** ~730 lines
**All Sections Complete:** Room designs, map, progressive unlocking, lock variety, summaries, validation

**Ready for:** Stage 6 (LORE Fragments), Stage 7 (Ink Scripting), Stage 9 (Scenario Assembly)
