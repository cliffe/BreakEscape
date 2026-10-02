# Stage 5: Room Layout and Spatial Design - Mission 2 "Ransomed Trust"

**Mission ID:** m02_ransomed_trust
**Created:** 2025-12-20
**Status:** Stage 5 Complete

---

## Hospital Floor Plan Overview

**St. Catherine's Regional Medical Center - 3rd Floor East Wing**

**Total Rooms:** 7
**Layout Type:** Hub-and-spoke (Reception → IT Department hub → Connected wings)
**Total Locked Doors:** 4 (varying difficulty)
**Guard Patrol:** 1 guard, 60-second predictable loop

---

## Room List and Connections

```
                    [Emergency Equipment Storage]
                              |
                         (locked - medium)
                              |
    [Dr. Kim's Office] ---- [Reception Lobby] ---- [IT Department]
         |                       |                       |
    (locked - medium)       (entry point)      (locked - easy, tutorial)
         |                       |                       |
    [Conference Room]      [Hallway North]         [Server Room]
                              |                       |
                         [Hallway South]        (locked - medium-hard)
                              |
                      [Break Room/Waiting]


Guard Patrol Route (60-second loop):
Reception → Hallway North → IT Department → Hallway South → Emergency Storage → Reception
```

---

## Room 1: Reception Lobby (Entry Point)

**Function:** Mission start, entry point, guard patrol hub

**Dimensions:** 15 GU × 12 GU (Large public space)

**Connections:**
- **North:** Hallway North (always open)
- **East:** IT Department (locked - easy, tutorial lockpicking)
- **West:** Dr. Kim's Office (locked - medium)

**NPCs:**
- **Receptionist** (static position, desk near entrance)
- **Security Guard** (patrol route starts here, returns every 60 seconds)

**Interactive Objects:**

**1. Reception Desk**
- **Type:** Desk (readable surface)
- **Content:** Visitor log, hospital map (shows room layout)
- **Purpose:** Environmental storytelling, orientation

**2. Hospital Founding Plaque (CRITICAL - PIN CLUE)**
- **Type:** Wall-mounted plaque
- **Position:** Near entrance, highly visible
- **Content:** "St. Catherine's Regional Medical Center - Founded 1987"
- **Purpose:** PIN safe clue #1 (correct answer: 1987)
- **Player Action:** Readable object

**3. PA System Speaker**
- **Type:** Ambient audio source
- **Content:** Periodic announcements: "All non-critical systems remain offline. IT working on resolution."
- **Purpose:** Time pressure reminder, atmosphere

**4. Waiting Area Chairs**
- **Type:** Furniture (non-interactive)
- **Purpose:** Environmental dressing, hospital atmosphere

**Atmosphere:**
- Sterile white walls, fluorescent lighting
- Anxious visitors (background NPCs or implied)
- Professional but tense environment

**Guard Patrol Timing:**
- Guard starts here, leaves North at 0:00
- Returns from Emergency Storage at 0:60 (1:00)

---

## Room 2: IT Department (Hub)

**Function:** Marcus's workspace, password hint location, central hub

**Dimensions:** 12 GU × 10 GU (Medium office space)

**Connections:**
- **West:** Reception (locked - easy, tutorial lockpicking)
- **East:** Server Room (locked - medium-hard)
- **South:** Hallway South (always open)

**Door Lock:**
- **Type:** Standard door lock (easy difficulty)
- **Tutorial:** First lockpicking challenge, Agent 0x99 tutorial if needed
- **Bypass:** If Marcus high trust, he unlocks door OR gives keycard

**NPCs:**
- **Marcus Webb** (static position at desk, or pacing if stressed)

**Interactive Objects:**

**1. Marcus's Desk (CRITICAL - PASSWORD HINTS)**
- **Type:** Desk with drawers
- **Container Type:** Unlocked drawers (if Marcus absent or allows access)
- **Contents:**
  - **Sticky Note #1:** "Common passwords: Emma2018, Hospital1987, StCatherines"
  - **Photo Frame:** "Emma - 7th birthday! 05/17/2018" (PIN clue #2 - red herring)
  - **Network diagram:** Shows ProFTPD server on whiteboard
- **Purpose:** Password hints for VM SSH challenge

**2. Filing Cabinet (LORE FRAGMENT)**
- **Type:** 4-drawer filing cabinet
- **Lock Type:** Lockpicking required (easy)
- **Contents:**
  - **Marcus's Email Archive (6 months ago):** Warning to Dr. Kim about CVE-2010-4652
  - **LORE Fragment:** CryptoSecure Recovery Services document (Ransomware Inc. front company)
- **Purpose:** Proves Marcus warned leadership, LORE discovery

**3. Infected Terminal (ENCODING CHALLENGE)**
- **Type:** Desktop computer (ransomware splash screen)
- **Content:** Base64-encoded ransomware note
- **Interaction:** Read screen, use CyberChef to decode
- **Purpose:** Tutorial reinforcement (Base64 from M1)

**4. Whiteboard**
- **Type:** Wall-mounted whiteboard
- **Content:** Network diagram showing "ProFTPD 1.3.5" server (VM clue)
- **Purpose:** Environmental clue for VM challenge

**5. Motivational Poster**
- **Type:** Wall decoration
- **Content:** "There is no I in TEAM but there is in INCIDENT RESPONSE"
- **Purpose:** Environmental humor, IT gallows humor

**Atmosphere:**
- Cluttered IT office, multiple monitors, cable management chaos
- Coffee-stained desk, stress indicators (empty coffee cups)
- Professional chaos

**Guard Patrol Timing:**
- Guard enters at 0:20 (from Hallway North)
- Exits to Hallway South at 0:30
- Room clear for 50 seconds per cycle

---

## Room 3: Server Room (VM Access Hub)

**Function:** VM terminal access, drop-site terminal, critical mission hub

**Dimensions:** 10 GU × 8 GU (Compact technical space)

**Connections:**
- **West:** IT Department (locked - medium-hard)
- **North:** Hallway North via service door (always open, alternate path)

**Door Lock:**
- **Type:** Electronic keycard lock (medium-hard difficulty)
- **Lockpicking:** Requires lockpicking skill OR Marcus's keycard (high trust)
- **Purpose:** Protects critical infrastructure

**NPCs:** None (secure area)

**Interactive Objects:**

**1. VM Access Terminal (CRITICAL)**
- **Type:** Workstation with SSH access
- **Content:** SecGen "Rooting for a win" VM connection
- **VM Challenges:**
  - SSH brute force (password hints from Marcus's desk)
  - ProFTPD exploitation (CVE-2010-4652)
  - Linux filesystem navigation
  - Flag collection
- **Purpose:** Primary VM challenge location

**2. Drop-Site Terminal (CRITICAL)**
- **Type:** Secure terminal for flag submission
- **Interaction:** Text input field, flag validation
- **Flags Submitted:**
  - `flag{ssh_access_granted}`
  - `flag{proftpd_backdoor_exploited}`
  - `flag{database_backup_located}`
  - `flag{ghost_operational_log}`
- **Feedback:** Success messages from Agent 0x99, unlock notifications
- **Purpose:** Hybrid integration (VM → in-game unlocks)

**3. CyberChef Workstation (ENCODING STATION)**
- **Type:** Terminal with CyberChef interface
- **Decoders Available:** Base64, ROT13, Hex, URL encoding
- **Challenges:**
  - Decode ransomware note (Base64)
  - Decode recovery instructions (ROT13)
- **Purpose:** Encoding challenge hub, tutorial station

**4. Server Racks**
- **Type:** Blinking server equipment (environmental)
- **Visual:** Indicator lights, cooling fans
- **Purpose:** Atmosphere, technical environment

**5. Whiteboard (Network Diagram)**
- **Type:** Wall-mounted whiteboard
- **Content:** Hospital network topology, ProFTPD server highlighted
- **Purpose:** Environmental clue for VM target

**6. Emergency Power Indicator**
- **Type:** LED panel
- **Content:** "BACKUP POWER: 12 HOURS REMAINING" (narrative timer)
- **Purpose:** Time pressure visualization (not hard timer)

**Atmosphere:**
- Cold room (server cooling), humming equipment
- Blinking lights from servers
- Professional technical space, restricted access

**Guard Patrol Timing:**
- Guard does NOT patrol server room (too secure)
- Room always safe once accessed

---

## Room 4: Emergency Equipment Storage

**Function:** Safe location (offline backup keys), PIN puzzle hub

**Dimensions:** 8 GU × 8 GU (Small storage room)

**Connections:**
- **South:** Reception via hallway (always open, but guard patrols)

**Door:** Unlocked (no door lock, accessible)

**NPCs:** None

**Interactive Objects:**

**1. PIN-Locked Safe (CRITICAL - PUZZLE)**
- **Type:** 4-digit electronic safe
- **Position:** Wall-mounted, conspicuous
- **Lock Type:** PIN puzzle (4 digits)
- **Correct PIN:** 1987 (hospital founding year)
- **Contents:**
  - **Offline Backup Encryption Key (USB drive)**
  - **LORE Fragment:** Zero Day Syndicate invoice (in Dr. Kim's office safe, same PIN)
- **Wrong Attempt Feedback:** "Incorrect PIN. Try again." (no lockout)
- **Purpose:** Primary puzzle challenge, hybrid key recovery

**2. PIN Cracker Device (FALLBACK)**
- **Type:** Equipment on shelf
- **Position:** Near safe, requires searching
- **Function:** Brute force 4-digit PIN (2-minute animation)
- **Purpose:** Accessibility fallback for struggling players

**3. Medical Supply Shelves**
- **Type:** Storage shelves (environmental)
- **Content:** Bandages, IV supplies, emergency equipment
- **Purpose:** Hospital atmosphere, environmental dressing

**4. Fire Extinguisher**
- **Type:** Wall-mounted safety equipment
- **Purpose:** Environmental realism

**Atmosphere:**
- Utilitarian storage space
- Industrial shelving, organized supplies
- Secure but accessible (not high-security vault)

**Guard Patrol Timing:**
- Guard enters at 0:40 (from Hallway South)
- Exits to Reception at 0:50
- Room clear for 50 seconds per cycle

---

## Room 5: Dr. Kim's Administrative Office

**Function:** Dr. Kim NPC location, PIN clue location, optional LORE

**Dimensions:** 12 GU × 10 GU (Executive office)

**Connections:**
- **East:** Reception (locked - medium)
- **South:** Conference Room (always open)

**Door Lock:**
- **Type:** Standard door lock (medium difficulty)
- **Purpose:** Protect administrative records

**NPCs:**
- **Dr. Sarah Kim** (static position at desk, or looking out window if stressed)

**Interactive Objects:**

**1. Dr. Kim's Desk**
- **Type:** Executive desk
- **Container:** Unlocked drawers (Dr. Kim allows access)
- **Contents:**
  - **Sticky Note (PIN CLUE #3):** "Safe combination: founding year (for emergency access)"
  - **Budget Report:** Shows $85K security upgrade rejected, $3.2M MRI approved
  - **Patient Status Reports:** 47 patients on life support (reinforces stakes)
- **Purpose:** PIN confirmation clue, budget negligence evidence

**2. Safe (Same PIN as Emergency Storage)**
- **Type:** 4-digit electronic safe
- **PIN:** 1987 (same as emergency storage safe)
- **Contents:**
  - **LORE Fragment:** Zero Day Syndicate Invoice (#ZDS-2024-0847)
  - **Confidential Documents:** Board meeting minutes
- **Purpose:** Optional LORE discovery, higher-value safe

**3. Window with View**
- **Type:** Environmental element
- **Visual:** City skyline view
- **Purpose:** Executive office atmosphere

**4. Bookshelves**
- **Type:** Furniture (medical journals, management books)
- **Purpose:** Environmental dressing

**Atmosphere:**
- Professional executive office
- Organized but shows signs of crisis stress
- Personal touches (family photos, awards)

**Guard Patrol Timing:**
- Guard does NOT patrol Dr. Kim's office (administrative area)
- Room safe once door unlocked

---

## Room 6: Conference Room

**Function:** Optional exploration, environmental storytelling

**Dimensions:** 10 GU × 12 GU (Meeting space)

**Connections:**
- **North:** Dr. Kim's Office (always open)
- **East:** Hallway North (always open)

**Door:** Unlocked (no lockpicking required)

**NPCs:** None

**Interactive Objects:**

**1. Conference Table**
- **Type:** Large meeting table
- **Content:** Scattered papers (budget meeting notes)
- **Purpose:** Environmental storytelling

**2. Whiteboard (Budget Presentation)**
- **Type:** Wall-mounted whiteboard
- **Content:** Budget allocation chart showing IT security cut by 40%
- **Purpose:** Evidence of institutional negligence

**3. Projector Screen**
- **Type:** Equipment (environmental)
- **Purpose:** Meeting room atmosphere

**Atmosphere:**
- Corporate meeting space
- Evidence of recent budget meeting
- Institutional decision-making location

**Guard Patrol Timing:**
- Guard does NOT patrol conference room
- Room always safe

---

## Room 7: Hallway North & South (Connector)

**Function:** Corridor connecting rooms, guard patrol route

**Dimensions:** North: 20 GU × 4 GU, South: 20 GU × 4 GU (Long corridors)

**Connections:**
- **North Hallway:** Reception, Conference Room, Server Room (service door)
- **South Hallway:** IT Department, Emergency Equipment Storage

**Door:** No doors (open corridors)

**NPCs:**
- **Security Guard** (patrol route passes through both hallways)

**Interactive Objects:**

**1. Benches/Waiting Areas**
- **Type:** Seating (environmental)
- **Purpose:** Hospital corridor atmosphere

**2. Directional Signs**
- **Type:** Wall-mounted signs
- **Content:** "IT Department →", "Emergency Storage →", "Administration ←"
- **Purpose:** Navigation assistance

**3. Hospital Notices**
- **Type:** Bulletin boards
- **Content:** Patient privacy notices, visitor guidelines
- **Purpose:** Environmental realism

**Atmosphere:**
- Sterile hospital corridors
- Fluorescent lighting, linoleum floors
- Functional, institutional

**Guard Patrol Timing:**
- Guard in North Hallway: 0:10-0:20
- Guard in South Hallway: 0:30-0:40
- Hallways clear for 40 seconds per cycle (each)

---

## Break Room (Optional 8th Room)

**Function:** Optional rest area, ambient environment

**Dimensions:** 8 GU × 8 GU (Small break room)

**Connections:**
- **North:** Hallway South (always open)

**Door:** Unlocked

**NPCs:** None (or background staff NPCs)

**Interactive Objects:**

**1. Coffee Machine**
- **Type:** Appliance (environmental, might be interactive)
- **Purpose:** Hospital break room atmosphere

**2. Vending Machines**
- **Type:** Equipment (environmental)
- **Purpose:** Break room realism

**3. Tables and Chairs**
- **Type:** Furniture
- **Purpose:** Rest area atmosphere

**Atmosphere:**
- Tired healthcare worker space
- Coffee stains, magazines, comfortable but worn

**Guard Patrol Timing:**
- Guard does NOT patrol break room
- Room always safe

---

## Guard Patrol Route (60-Second Predictable Loop)

**Route:** Reception → Hallway North → IT Department → Hallway South → Emergency Equipment Storage → Reception

**Timing Breakdown:**

| Time | Location | Duration | Player Opportunity |
|------|----------|----------|-------------------|
| 0:00-0:10 | Reception → Hallway North | 10s | Reception clear, IT Department safe |
| 0:10-0:20 | Hallway North | 10s | North corridor blocked, use alternate route |
| 0:20-0:30 | IT Department | 10s | IT Department blocked, wait in hallway |
| 0:30-0:40 | Hallway South | 10s | South corridor blocked, use Conference Room route |
| 0:40-0:50 | Emergency Equipment Storage | 10s | Storage room blocked, safe cracking interrupted |
| 0:50-0:60 | Return to Reception | 10s | Guard returning, clear path opens |

**Total Loop:** 60 seconds exactly (1 minute)

**Waypoints (5 total):**
1. Reception (start)
2. Hallway North (via North exit)
3. IT Department (via IT entrance)
4. Hallway South (via South exit)
5. Emergency Equipment Storage (via South hallway)
6. Return to Reception (complete loop)

**Player Strategy:**
- **Observe:** Watch one full loop to learn pattern (Task: learn_guard_patrol)
- **Timing:** Move when guard in opposite area (40-50 seconds of clear time per location)
- **Alternate Paths:** Use Conference Room → Dr. Kim's Office → Reception to bypass North Hallway
- **Hiding:** If detected, player has 5 seconds to hide before guard reports

**Detection Mechanics:**
- **Detection Radius:** 5 GU proximity OR 90° vision cone (8 GU range)
- **First Detection:** Warning ("Who's there? Show yourself!")
- **Second Detection:** Guard reports (mission delayed, no failure)
- **Audio Cue:** Radio chatter audible when guard within 8 GU
- **Visual Cue:** Minimap shows guard position (red dot)

---

## Container Placement Summary

| Room | Container Type | Lock | Contents | Purpose |
|------|---------------|------|----------|---------|
| IT Department | Marcus's Desk | Unlocked (if allowed) | Password hints, photo | VM SSH challenge setup |
| IT Department | Filing Cabinet | Lockpick (easy) | Email archive, LORE | Proves Marcus warned, LORE fragment |
| IT Department | Infected Terminal | N/A (readable) | Base64 ransomware note | Encoding challenge |
| Server Room | VM Terminal | N/A | SecGen VM access | Primary VM challenges |
| Server Room | Drop-Site Terminal | N/A | Flag submission | Hybrid integration |
| Server Room | CyberChef Station | N/A | Encoding tools | Base64/ROT13 decoding |
| Emergency Storage | PIN Safe | 4-digit PIN (1987) | Offline backup key (USB) | Primary puzzle, key recovery |
| Emergency Storage | Shelf | N/A | PIN cracker device | Fallback tool |
| Dr. Kim's Office | Desk Drawers | Unlocked (allowed) | PIN clue sticky note | PIN puzzle confirmation |
| Dr. Kim's Office | Safe | 4-digit PIN (1987) | ZDS Invoice LORE | Optional LORE discovery |
| Conference Room | Table | N/A | Budget documents | Environmental evidence |

**Total Containers:** 11
- **Locked Containers:** 3 (filing cabinet lockpick, 2 PIN safes)
- **Critical Path:** Desk, Filing Cabinet, VM Terminal, Drop-Site, PIN Safe #1
- **Optional:** Safe #2 (Dr. Kim's office)

---

## Lock Placement Summary

| Door | Room Connection | Lock Type | Difficulty | Bypass Option |
|------|----------------|-----------|------------|---------------|
| 1. IT Department | Reception → IT | Standard Lock | Easy (Tutorial) | Marcus's cooperation |
| 2. Server Room | IT → Server Room | Keycard Lock | Medium-Hard | Marcus's keycard (high trust) |
| 3. Dr. Kim's Office | Reception → Admin | Standard Lock | Medium | None (required lockpicking) |
| 4. Emergency Storage | (none) | No lock | N/A | Always accessible |

**Total Locked Doors:** 3 (4th room unlocked)
**Lockpicking Progression:** Easy (tutorial) → Medium → Medium-Hard

---

## NPC Positioning

| NPC | Room | Position Type | Movement |
|-----|------|--------------|----------|
| Receptionist | Reception Lobby | Static | Behind desk, facing entrance |
| Security Guard | Patrol Route | Waypoint Patrol | 60-second loop (5 waypoints) |
| Marcus Webb | IT Department | Static / Pacing | At desk OR pacing (stress animation) |
| Dr. Sarah Kim | Dr. Kim's Office | Static / Window | At desk OR looking out window |

**Total NPCs:** 4 (1 receptionist, 1 guard, 2 mission-critical)

**NPC Interaction Triggers:**
- **Proximity:** Within 2 GU, interaction prompt appears
- **Dialogue Hub:** Replayable conversations (return to hub after each branch)
- **Guard Detection:** Within 5 GU OR vision cone (90°, 8 GU range)

---

## Terminal Placement

| Terminal | Room | Purpose | Interaction Type |
|----------|------|---------|------------------|
| Infected Terminal | IT Department | Ransomware note (Base64) | Read screen → CyberChef |
| VM Access Terminal | Server Room | SecGen VM connection | SSH client, exploitation |
| Drop-Site Terminal | Server Room | Flag submission | Text input, validation |
| CyberChef Workstation | Server Room | Encoding/decoding | Dropdown menu, input/output fields |

**Total Terminals:** 4
**Server Room Terminal Cluster:** 3 terminals in one secure location (makes sense narratively)

---

## Critical Path Flow

```
1. Reception Lobby (entry)
   ↓
2. Meet Dr. Kim (Administrative Office) - Lockpick medium door
   ↓
3. Meet Marcus (IT Department) - Lockpick easy door OR receive keycard
   ↓
4. Investigate Marcus's Desk (password hints)
   ↓
5. Navigate Past Guard (tutorial: observe 60s patrol)
   ↓
6. Server Room (lockpick medium-hard door OR use Marcus's keycard)
   ↓
7. VM Challenges (SSH, ProFTPD, flags)
   ↓
8. Drop-Site Flag Submission (unlocks safe location intel)
   ↓
9. Navigate Past Guard (reinforcement)
   ↓
10. Emergency Equipment Storage (PIN safe puzzle)
    ↓
11. Crack PIN 1987 (clues from Reception plaque + Dr. Kim's note)
    ↓
12. Retrieve Offline Backup Key
    ↓
13. Return to Server Room (decode ROT13 instructions)
    ↓
14. Make Critical Decisions (ransom, exposure)
    ↓
15. Mission Complete
```

**Backtracking Required:**
- Reception plaque (visit early) → Emergency Storage (visit later for safe)
- Dr. Kim's office (optional PIN clue) → Emergency Storage
- Server Room (multiple visits for VM work + flag submission + decoding)

**No Circular Dependencies:** All paths flow forward, player can't be soft-locked

---

## Alternate Paths (Player Agency)

**Avoiding Guards:**

**Path A (Direct):**
Reception → Hallway North → IT Department (requires timing guard patrol)

**Path B (Alternate):**
Reception → Dr. Kim's Office → Conference Room → Hallway North → Server Room (bypasses guard in North hallway)

**Path C (Service Route):**
Reception → Hallway South → IT Department (if guard in North hallway)

**Multiple Solutions:**
- Lockpick Server Room OR use Marcus's keycard (social engineering)
- Solve PIN via clues OR use PIN cracker device (puzzle vs. tool)
- Navigate past guards OR use alternate routes (stealth vs. exploration)

---

## Environmental Storytelling Elements

**Visual Cues:**
- Hospital founding plaque (1987) - PIN clue visible from mission start
- Budget charts on Conference Room whiteboard - Institutional negligence
- Marcus's cluttered desk - Overworked IT staff
- Dr. Kim's organized office - Executive professionalism under stress
- Server room backup power indicator - Time pressure visualization

**Audio Cues:**
- PA announcements - System outage reminders, urgency
- Guard radio chatter - Proximity warning, stealth mechanic
- Server room humming - Technical atmosphere
- Coffee machine sounds (break room) - Hospital staff environment

**Document Clues:**
- Marcus's sticky notes - Password patterns
- Email archives - Proves warnings were ignored
- Budget reports - Shows $85K cut vs. $3.2M MRI spend
- Ransomware note - ENTROPY's message, Base64 tutorial

---

## Room Atmosphere Guide

| Room | Lighting | Sound | Mood |
|------|----------|-------|------|
| Reception | Bright fluorescent | PA announcements, distant voices | Professional, tense |
| IT Department | Overhead lights, monitor glow | Keyboard clicks, fan noise | Cluttered, stressed |
| Server Room | Dim blue LED lighting | Server fans, cooling hum | Technical, cold |
| Emergency Storage | Industrial fluorescent | Ventilation, quiet | Utilitarian, secure |
| Dr. Kim's Office | Warm desk lamps | Quiet, occasional phone | Executive, personal |
| Conference Room | Overhead projector lights | Silent, empty | Institutional, cold |
| Hallways | Harsh fluorescent | Footsteps, echoes | Sterile, institutional |

---

## Accessibility Features

**Multiple Solution Paths:**
- ✅ Lockpicking OR keycard (social engineering Marcus)
- ✅ PIN puzzle OR brute force device (investigation vs. tool)
- ✅ Stealth timing OR alternate routes (skill vs. exploration)

**Forgiving Mechanics:**
- ✅ Infinite lockpicking retries
- ✅ No PIN lockout (try unlimited times)
- ✅ Guard detection = warning first (5-second grace period)
- ✅ Alternate routes available if guard blocks path

**Clear Navigation:**
- ✅ Hospital map in Reception (shows layout)
- ✅ Directional signs in hallways
- ✅ Minimap with guard position
- ✅ Quest markers for objectives

---

## Playtesting Priorities

**Guard Patrol Balance:**
- [ ] 60-second timing too fast/slow?
- [ ] Detection radius fair?
- [ ] Alternate paths discoverable?
- [ ] First-time players can learn pattern?

**PIN Puzzle Accessibility:**
- [ ] Founding year plaque visible enough?
- [ ] Red herring (Emma's birthday) too confusing?
- [ ] Dr. Kim's confirmation clue necessary?
- [ ] PIN cracker device discoverable as fallback?

**Room Flow:**
- [ ] Backtracking frustrating or rewarding?
- [ ] Server room centrality makes sense?
- [ ] Dr. Kim's office optional content clear?
- [ ] Conference room provides value or is empty filler?

**Container Interaction:**
- [ ] Filing cabinet lockpicking satisfying?
- [ ] Marcus's desk contents clear?
- [ ] Safe puzzle rewarding when solved?

---

## Implementation Notes

**Room Generation:**
- All rooms use standard room generation constraints (ROOM_GENERATION.md)
- Grid Unit (GU) specifications approximate, adjust during implementation
- Doors use standard lock minigame (LOCK_KEY_QUICK_START.md)
- Containers use standard container system (CONTAINER_MINIGAME_USAGE.md)

**Guard AI:**
- Waypoint-based patrol (5 waypoints, 60-second loop)
- Detection: Proximity (5 GU radius) OR line-of-sight (90° cone, 8 GU range)
- State machine: Patrol → Detect → Warn → Report
- Audio/visual cues before detection (radio chatter, minimap indicator)

**NPC Integration:**
- Static NPCs use dialogue hubs (NPC_INTEGRATION_GUIDE.md)
- Marcus and Dr. Kim have replayable conversations
- Receptionist has minimal dialogue (directional only)

**Terminal Integration:**
- VM terminal requires separate SSH client interface
- Drop-site uses text input validation (flag format check)
- CyberChef uses dropdown menu + text input/output fields

---

**Stage 5 Complete: Room Layout and Spatial Design**

**Ready for:** Stage 6 (LORE Fragments detailed content)

**Total Rooms:** 7 (+ optional break room = 8)
**Total Locked Doors:** 3 (easy → medium → medium-hard progression)
**Guard Patrol:** 60-second predictable loop, beginner-friendly
**Critical Path:** Validated, no soft locks, multiple solution paths

**Core Strength:** Hub-and-spoke layout (Server Room central), guard patrol creates tension without frustration, PIN puzzle has multiple clue types + fallback device
