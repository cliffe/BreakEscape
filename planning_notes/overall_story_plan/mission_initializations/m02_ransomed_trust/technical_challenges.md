# Technical Challenges - Mission 2 "Ransomed Trust"

**Mission ID:** m02_ransomed_trust
**Created:** 2025-12-20
**Target Tier:** 1 (Beginner)
**Primary CyBOK Areas:** Malware & Attack Technologies, Incident Response, Applied Cryptography

---

## Overview

Mission 2 introduces **2 new mechanics** (patrolling guards, PIN cracking) while reinforcing **3 mechanics from M1** (lockpicking, social engineering, encoding/decoding). The hybrid architecture integrates VM-based technical validation (ProFTPD exploitation) with in-game narrative content (ransomware crisis response).

**Progressive Difficulty Philosophy:**
- New mechanics introduced with tutorials
- M1 mechanics reinforced in new context (hospital vs. corporate office)
- Slightly increased complexity (more locks, guard patrols add challenge)
- Still beginner-friendly (forgiving failure, multiple solution paths)

---

## VM/SecGen Challenges (Technical Validation)

### Selected SecGen Scenario: "Rooting for a win"

**Scenario Description:**
Exploitation of ProFTPD 1.3.5 with backdoor vulnerability (CVE-2010-4652), privilege escalation, and file system navigation to recover flags representing backup encryption keys.

**Why This Scenario:**
1. **Beginner-appropriate:** Well-documented vulnerability with straightforward exploitation
2. **Realistic:** ProFTPD is real FTP server software; CVE is real vulnerability
3. **Narratively coherent:** Hospitals often use FTP for backup transfers
4. **Educational value:** Teaches service exploitation, privilege escalation, Linux navigation
5. **No modifications needed:** VM remains stable; narrative context added via ERB templates in-game

### VM Challenge Breakdown

#### Challenge 1: SSH Access to Backup Server

**Objective:** Gain initial access to hospital's backup server via SSH

**Technical Skill:**
- SSH client usage
- Credential-based authentication
- Understanding network services

**In-Game Setup:**
- Player social engineers Marcus (IT Admin) for "possible passwords" list
- Finds password hints in Marcus's notes (daughter's name "Emma", hospital anniversary "1987")
- Uses Hydra or manual SSH attempts with password variations

**Flag Representation:**
- `flag{ssh_access_granted}` = "Intercepted ENTROPY backup server credentials"

**CyBOK Alignment:**
- **Systems Security:** Network protocols (SSH)
- **Security Operations:** Credential-based authentication

**Difficulty:** Easy (guided via hints, common passwords)

**Educational Outcome:** Players understand SSH authentication, password guessing tactics

---

#### Challenge 2: ProFTPD Backdoor Exploitation (CVE-2010-4652)

**Objective:** Exploit ProFTPD 1.3.5 backdoor vulnerability to gain shell access

**Technical Skill:**
- Vulnerability exploitation
- Service enumeration
- Backdoor trigger mechanisms
- Shell access via compromised service

**Vulnerability Details:**
- **CVE:** CVE-2010-4652
- **Affected Version:** ProFTPD 1.3.5 (specific version)
- **Vulnerability Type:** Backdoor in source code
- **Exploitation:** Trigger via specific FTP commands
- **Result:** Remote shell access with FTP daemon privileges

**In-Game Setup:**
- Agent 0x99 provides briefing: "ENTROPY exploited a known ProFTPD vulnerability"
- Server room whiteboard shows FTP server version (environmental clue)
- Ghost's manifesto mentions "CVE-2010-4652" (LORE fragment reinforces challenge)

**Exploitation Steps:**
1. Enumerate ProFTPD version (banner grabbing)
2. Identify vulnerability (CVE-2010-4652 backdoor)
3. Trigger backdoor via crafted FTP command
4. Obtain shell access
5. Navigate to flag location

**Flag Representation:**
- `flag{proftpd_backdoor_exploited}` = "Exploited ENTROPY's own entry point"

**CyBOK Alignment:**
- **Malware & Attack Technologies:** Backdoors, vulnerability exploitation
- **Systems Security:** Service vulnerabilities, privilege contexts

**Difficulty:** Easy-Medium (documented exploit, guided tutorial available)

**Educational Outcome:** Players understand service exploitation, backdoor concepts, CVE research

---

#### Challenge 3: Privilege Escalation & File System Navigation

**Objective:** Escalate privileges and navigate Linux filesystem to find encrypted database backups

**Technical Skill:**
- Linux command line (ls, cd, cat, find)
- File permissions understanding
- Privilege escalation concepts
- Backup file identification

**In-Game Setup:**
- Marcus mentions "encrypted database backups" during social engineering
- Drop-site terminal provides hint: "Look for *.enc files in /var/backups"

**Navigation Steps:**
1. Check current user privileges (`whoami`, `id`)
2. Navigate filesystem (`cd /var/backups`)
3. List files (`ls -la`)
4. Identify encrypted backups (files with .enc extension)
5. Attempt to read encryption keys directory
6. Find Ghost's operational log file (LORE fragment)

**Flag Representation:**
- `flag{database_backup_located}` = "Found encrypted patient database"
- `flag{ghost_operational_log}` = "Intercepted ENTROPY operational intelligence"

**CyBOK Alignment:**
- **Systems Security:** Linux filesystem, permissions, privilege levels
- **Security Operations:** Backup procedures, incident investigation

**Difficulty:** Easy (guided via hints, basic Linux commands)

**Educational Outcome:** Players understand Linux navigation, file permissions, backup systems

---

### VM Challenge Integration Summary

| Challenge | Skill Taught | In-Game Setup | Flag | Unlock |
|-----------|-------------|---------------|------|--------|
| SSH Access | SSH authentication, password guessing | Marcus provides password hints | `flag{ssh_access_granted}` | Access to server room terminal |
| ProFTPD Exploit | Service exploitation, CVE research | Agent 0x99 briefing, whiteboard clue | `flag{proftpd_backdoor_exploited}` | Intel about physical safe location |
| File Navigation | Linux commands, backup systems | Marcus mentions backups, terminal hints | `flag{database_backup_located}` | Unlock decryption key requirements |
| LORE Discovery | Intelligence gathering | Environmental clues | `flag{ghost_operational_log}` | Ghost's manifesto LORE fragment |

**Dead Drop Integration:**
- VM flags submitted at drop-site terminal in server room
- Each flag submission triggers Agent 0x99 commentary ("Great work! That flag reveals...")
- Flag submission tracked as objectives/tasks (#complete_task:submit_ssh_flag)

**Hybrid Workflow:**
```
In-Game (Marcus social engineering)
  ↓
VM (SSH access with password hints)
  ↓
In-Game (Submit flag at drop-site)
  ↓
VM (Exploit ProFTPD backdoor)
  ↓
In-Game (Submit flag → Unlock safe location intel)
  ↓
VM (Navigate filesystem, find Ghost's logs)
  ↓
In-Game (Safe PIN cracking with physical clues)
  ↓
Combined (Digital + Physical keys = complete recovery)
```

---

## Break Escape In-Game Challenges (ERB Narrative Content)

### New Mechanics (Introduced in M2)

#### Challenge 1: Patrolling Guards (Stealth/Timing Mechanic)

**Objective:** Navigate hospital corridors while avoiding detection by security guards

**Game Mechanic:**
- Security guard patrols predictable 60-second route
- Route: Reception → IT Department → Administrative Wing → Emergency Storage → Reception
- Player must time movement between patrol passes
- Detection results in warning (first time), then complications (delays mission)

**Tutorial Integration:**
- First guard encounter triggers Agent 0x99 tutorial
- 0x99: "Security is heightened after the breach. Watch the guard's patrol pattern—timing is everything."
- Visual indicator: Guard's position shown on minimap
- Audio cue: Guard's radio chatter audible when nearby

**Narrative Context:**
- Hospital security heightened after ransomware breach
- Guards anxious, checking locked rooms frequently
- Realistic behavior: Guards follow protocol, not perfect (can be predicted)

**Difficulty Calibration (Beginner-Friendly):**
- **Predictable Pattern:** Same 60-second route every cycle (easy to learn)
- **Forgiving Detection:** First detection = warning ("Who's there? Show yourself!"), player can hide
- **Visual/Audio Cues:** Clear indicators when guard approaching
- **Alternate Paths:** Multiple routes through hospital (can avoid guards entirely if explore)
- **No Instant Failure:** Detection delays mission, doesn't end it

**Educational Value:**
- **Physical Security:** Understanding patrol patterns, security protocols
- **Observation Skills:** Timing, pattern recognition
- **Security Mindset:** Real-world security isn't perfect; humans have predictable behaviors

**CyBOK Alignment:**
- **Physical Security & Human Factors:** Patrol procedures, human limitations in security
- **Security Operations:** Physical security assessment

**Implementation Notes:**
- Guard NPC with waypoint patrol route
- Detection radius (line-of-sight cone or proximity circle)
- Timer-based patrol loop (60 seconds exactly)
- Player stealth indicators (crouch mode, cover system if available)

**Success Criteria:**
- **Minimal:** Player navigates past guard at least once (tutorial)
- **Standard:** Player successfully avoids detection multiple times
- **Perfect:** Player never detected throughout entire mission

---

#### Challenge 2: PIN Cracking on Safe (Investigation + Puzzle)

**Objective:** Crack 4-digit PIN safe containing offline backup encryption keys

**Game Mechanic:**
- Hybrid puzzle: Find clues in environment to deduce PIN
- PIN: **1987** (hospital founding year)
- Clues scattered across hospital in multiple locations
- Optional: PIN cracker device if player can't solve from clues alone

**Clue Locations:**

**Clue 1 (Red Herring):** Marcus's Desk Photo
- Photo of Marcus's daughter: "Emma - 7th birthday! 05/17/2018"
- Digits visible: 0517 or 2018
- **Purpose:** Teaches players to look for birthdates, but wrong answer (red herring)
- If player tries 0517 or 2018: "Incorrect PIN. Try again."

**Clue 2 (Key Clue):** Hospital Lobby Plaque
- Bronze plaque near reception: "St. Catherine's Regional Medical Center - Founded 1987"
- **Purpose:** Correct answer, but requires player to remember/revisit lobby
- Environmental object (readable plaque)

**Clue 3 (Confirmation):** Dr. Kim's Office Note
- Sticky note on Dr. Kim's desk: "Safe combination: founding year (for emergency access)"
- **Purpose:** Confirms that PIN is related to founding year
- Requires lockpicking Dr. Kim's office

**Clue 4 (Tutorial Hint):** Agent 0x99 Call
- If player attempts wrong PIN 3 times, Agent 0x99 calls
- 0x99: "Safe combinations often use significant institutional dates. Check historical markers around the hospital."
- **Purpose:** Hint system for struggling players

**PIN Cracker Device (Fallback):**
- If player finds device (in emergency storage), can brute-force 4-digit PIN
- Takes 2-3 minutes in-game (animation of cycling through combinations)
- **Purpose:** Accessibility—ensures all players can complete regardless of puzzle-solving ability

**Narrative Context:**
- Offline backup keys stored in safe per IT best practices (airgapped storage)
- Dr. Kim (CTO) has safe in emergency equipment storage
- Safe requires PIN (standard secure container)

**Difficulty Calibration:**
- **Clues Visible:** Founding year plaque in lobby (player passes multiple times)
- **Multiple Clue Types:** Visual (plaque), document (sticky note), NPC dialogue (Marcus mentions hospital anniversary)
- **Red Herring:** Teaches players to verify clues (not every number is the answer)
- **Hint System:** Agent 0x99 provides guidance after failures
- **Fallback Device:** Ensures completion even if puzzle too hard

**Educational Value:**
- **Investigation Skills:** Gathering clues from environment, correlating information
- **Physical Security:** Understanding safe mechanisms, PIN vulnerabilities
- **Social Engineering:** PINs often use significant dates (predictable human behavior)

**CyBOK Alignment:**
- **Human Factors:** Predictable password/PIN selection (birthdates, anniversaries)
- **Physical Security & Building Systems:** Safe mechanisms, physical access controls

**Implementation Notes:**
- Safe container with PIN input UI (4-digit entry)
- Clue objects (plaque, photo, sticky note) as readable items
- Wrong PIN feedback: "Incorrect. Try again." (no lockout after N attempts for accessibility)
- Correct PIN feedback: "Safe unlocked. USB drive obtained."

**Success Criteria:**
- **Minimal:** Player cracks safe using PIN cracker device (brute force)
- **Standard:** Player finds 2+ clues and deduces PIN (1987)
- **Perfect:** Player finds all clues, solves on first attempt

---

### Reinforced Mechanics (From M1)

#### Challenge 3: Lockpicking

**Objective:** Lockpick multiple doors to access server room, IT office, administrative offices

**Locked Doors:**
1. **IT Department Door** (Tutorial Reinforcement)
   - Difficulty: Easy
   - Contains: Marcus's desk with password hints, filing cabinets with LORE
2. **Server Room Door** (Mission-Critical)
   - Difficulty: Medium
   - Contains: VM access terminal, drop-site terminal, backup server documentation
3. **Dr. Kim's Administrative Office** (Optional, High Value)
   - Difficulty: Medium-Hard
   - Contains: Safe PIN clue (sticky note), LORE fragment (ZDS invoice)
4. **Emergency Equipment Storage** (Optional)
   - Difficulty: Medium
   - Contains: PIN cracker device (fallback for safe puzzle)

**Progression from M1:**
- M1 had 2-3 locked doors; M2 has 4 (increased quantity)
- M1 difficulty: Easy-Medium; M2 adds Medium-Hard (skill progression)
- Still beginner-friendly: Can retry infinitely, hints available

**Tutorial Reinforcement:**
- First lock (IT Department) is easy, same difficulty as M1
- Agent 0x99 reminder: "Remember your lockpicking training from Viral Dynamics. Same principles apply."

**Narrative Context:**
- Hospital has physical security for sensitive areas
- IT Department locked after hours
- Server room requires authorized access
- Administrative offices contain confidential patient/financial data

**Educational Value:**
- **Physical Security:** Understanding lock types, physical access controls
- **Persistence:** Lockpicking requires patience (reinforces skill from M1)

**CyBOK Alignment:**
- **Physical Security & Building Systems:** Lock mechanisms, access control

**Success Criteria:**
- **Minimal:** Player lockpicks 2 required doors (IT, Server Room)
- **Standard:** Player lockpicks 3+ doors (including optional)
- **Perfect:** Player lockpicks all 4 doors, collects all evidence

---

#### Challenge 4: NPC Social Engineering - Marcus Webb (IT Admin)

**Objective:** Social engineer Marcus to obtain server room access, password hints, and operational context

**Target NPC:** Marcus Webb (IT Administrator)

**Marcus's Profile:**
- **Emotional State:** Stressed, guilty, defensive
- **Motivation:** Wants to prove he was right about security warnings
- **Vulnerability:** Desperate for help, wants to vindicate himself
- **Information He Provides:** Password hints, server room access, IT context

**Social Engineering Opportunities:**

**Conversation 1: Initial Meeting**
- **Goal:** Establish rapport, get basic access
- **Marcus:** "I TOLD them six months ago about that ProFTPD vulnerability! They said 'budget constraints.' Now look at us!"
- **Player Options:**
  - Sympathize: "Budget cuts are common. You did your job." → Marcus trusts player, opens up
  - Professional: "Let's focus on recovery. What do you need?" → Marcus appreciates efficiency
  - Blame: "Why didn't you push harder?" → Marcus becomes defensive, less cooperative

**Conversation 2: Password Hints**
- **Goal:** Get hints for SSH brute force
- **Marcus:** "I kept a list of common passwords employees used. It's... not great. 'Emma2018', hospital anniversary dates, that kind of thing."
- **Information Gained:** Daughter's name (Emma), year (2018), hospital anniversary hint

**Conversation 3: Server Room Access**
- **Goal:** Get keycard or unlock server room
- **Marcus:** "Server room's locked, but I can disable the alarm for you. Just don't tell Dr. Kim—she's paranoid after the breach."
- **Trust Check:** If player gained trust (sympathized earlier), Marcus provides keycard
- **Low Trust:** Player must lockpick (Marcus won't help directly)

**Conversation 4 (Optional): Marcus's Scapegoating**
- **Discovery:** Player finds email chain planning to blame Marcus
- **Mid-Mission Choice:** Warn Marcus / Plant evidence clearing him / Ignore
- **Marcus's Reaction (if warned):** "I... I knew it. Thank you for telling me. I'll document everything."

**Progression from M1:**
- M1: Maya Chen (journalist) was cautious, required careful approach
- M2: Marcus is desperate, easier to social engineer (tutorial reinforcement)
- Still requires empathy/professionalism (can't just demand information)

**Narrative Context:**
- Marcus is victim of institutional negligence
- He warned about vulnerability 6 months ago, ignored
- Now being scapegoated by hospital leadership
- Genuinely wants to help fix the problem

**Educational Value:**
- **Social Engineering:** Exploiting emotional vulnerability (stress, guilt)
- **Human Factors:** Crisis makes people less cautious, more trusting
- **Ethics:** Balancing mission objectives vs. protecting innocent allies

**CyBOK Alignment:**
- **Human Factors:** Social engineering, trust exploitation, crisis psychology
- **Security Operations:** Insider cooperation (willing or unwitting)

**Implementation Notes:**
- Dialogue tree with attitude tracking (trust vs. defensive)
- Information reveals based on trust level
- Optional mid-mission intervention (warn about scapegoating)

**Success Criteria:**
- **Minimal:** Player gets basic password hints
- **Standard:** Player gains Marcus's trust, receives keycard and detailed hints
- **Perfect:** Player protects Marcus from scapegoating, gains loyal ally for future missions

---

#### Challenge 5: Encoding/Decoding (CyberChef Workstation)

**Objective:** Decode encoded ENTROPY communications and recovery instructions

**Encoding Types:**
1. **Base64 (Reinforced from M1):** Ransomware note header
2. **ROT13 (NEW):** Recovery instructions

**Challenge 1: Base64 Ransomware Note**

**Encoded Message (found on infected terminal):**
```
WU9VUiBQQVRJRU5UIFJFQ09SRFMgQVJFIEVOQ1JZUFRFRC4gNDcgUEFUSUVOVFMgT04gTElGRSBTVVBQT1JULiAxMiBIT1VSUyBPRiBCQUNLVVAgUE9XRVIuIFBBWSAyLjUgQlRDIFRPIFtXQUxMRVRdIE9SIFdBVENIIFRIRU0gRElFLiAtIFJBTlNPTVdBUkUgSU5DT1JQT1JBVEVE
```

**Decoded Message:**
```
YOUR PATIENT RECORDS ARE ENCRYPTED. 47 PATIENTS ON LIFE SUPPORT. 12 HOURS OF BACKUP POWER. PAY 2.5 BTC TO [WALLET] OR WATCH THEM DIE. - RANSOMWARE INCORPORATED
```

**In-Game Context:**
- Found on infected hospital terminals (screens showing ransomware splash)
- Player uses CyberChef workstation in server room to decode
- Agent 0x99: "ENTROPY loves Base64 for quick obfuscation. Same decoding process as Mission 1."

**Educational Reinforcement:**
- Players practiced Base64 in M1 (whiteboard messages)
- M2 reinforces skill in new context (ransomware note)
- Reminder that encoding ≠ encryption (obfuscation, not security)

---

**Challenge 2: ROT13 Recovery Instructions (NEW)**

**Encoded Message (found in Ghost's log file):**
```
SHYY ERPBIREL ERDHERRF BSSYVAR + BAYVAR XRLF—12-UBHE CEBPRFF VS ZNAHNY, VAFGNAG VS ENAFBZ CNVQ. CVGSNYYF: CNVRAG QRNGU EVFX 0.3% CRE UBHE QRYRLRQ. UBFCVGNY JVYY YRNEA GB CEVBEVGVMR PLOREFRPHEVGL.
```

**Decoded Message (ROT13):**
```
FULL RECOVERY REQUIRES OFFLINE + ONLINE KEYS—12-HOUR PROCESS IF MANUAL, INSTANT IF RANSOM PAID. PITFALLS: PATIENT DEATH RISK 0.3% PER HOUR DELAYED. HOSPITAL WILL LEARN TO PRIORITIZE CYBERSECURITY.
```

**In-Game Context:**
- Found in Ghost's operational log (VM challenge reward)
- ROT13 introduction via Agent 0x99 tutorial
- 0x99: "ROT13 is a Caesar cipher—shifts each letter 13 positions. Simple but effective for quick obfuscation."

**Tutorial Integration:**
- Agent 0x99 explains ROT13 when first encountered
- CyberChef workstation has ROT13 decoder (select from dropdown)
- Can also solve manually if player recognizes pattern (bonus achievement)

**Educational Value (NEW for M2):**
- **Caesar Cipher Concept:** Substitution ciphers, shift ciphers
- **Pattern Recognition:** Recognizing encoded text (vowel patterns, letter frequency)
- **Historical Cryptography:** ROT13 used in forums, newsgroups (obfuscation, not security)

**CyBOK Alignment:**
- **Applied Cryptography:** Classical ciphers, encoding vs. encryption distinction
- **Adversarial Behaviours:** Obfuscation techniques

---

### In-Game Challenge Integration Summary

| Challenge | New/Reinforced | Difficulty | Educational Value | CyBOK |
|-----------|----------------|------------|-------------------|-------|
| Patrolling Guards | NEW | Easy-Medium | Physical security patterns | Physical Security, Human Factors |
| PIN Cracking Safe | NEW | Medium (clue-based) | Investigation, physical access | Human Factors, Physical Security |
| Lockpicking | Reinforced | Easy-Hard (4 locks) | Physical access control | Physical Security |
| Social Engineering (Marcus) | Reinforced | Easy (stressed target) | Crisis psychology, trust exploitation | Human Factors |
| Base64 Decoding | Reinforced | Easy | Encoding concepts (from M1) | Applied Cryptography |
| ROT13 Decoding | NEW | Easy-Medium | Caesar ciphers, pattern recognition | Applied Cryptography |

---

## Hybrid Challenge Correlation (Physical + Digital)

### Correlation Requirement 1: Password Hints → SSH Access

**In-Game:**
- Social engineer Marcus for password patterns
- Find sticky notes in Marcus's desk (lockpicking required)
- Clues: "Emma2018", "Hospital1987", "StCatherines"

**VM Challenge:**
- Use Hydra or manual SSH attempts with password variations
- Try combinations: emma2018, Emma2018, stcatherines1987, etc.
- Success: SSH access granted

**Educational Value:**
- Correlation teaches that physical access (desk notes) aids digital access (SSH)
- Realistic attack chain: physical reconnaissance → credential guessing

---

### Correlation Requirement 2: VM Flags → Physical Safe Location

**VM Challenge:**
- Exploit ProFTPD, navigate filesystem
- Find Ghost's operational log
- Log mentions "offline backup keys in emergency equipment storage"

**In-Game:**
- Submit flag at drop-site terminal
- Agent 0x99: "That log mentions a physical safe in emergency storage. Find it!"
- Navigate to emergency storage room (guard patrol in the way)
- Locate safe with offline backup keys

**Educational Value:**
- Digital intelligence leads to physical location
- Hybrid investigation requires both VM skills and in-game navigation

---

### Correlation Requirement 3: Physical Clues → PIN Solution

**In-Game:**
- Find visual clues: Hospital founding plaque (1987), Dr. Kim's sticky note ("founding year")
- Crack PIN: 1987
- Retrieve offline backup key (USB drive)

**VM Challenge:**
- Already have online backup key from exploitation
- Need BOTH keys for complete recovery

**Combined Resolution:**
- Digital key (VM) + Physical key (safe) = Complete decryption capability
- Demonstrates real-world backup procedures (offline keys for ransomware protection)

**Educational Value:**
- Airgapped backups protect against ransomware (best practice)
- Physical security (safe) complements digital security (encryption)
- Real incident response requires both physical and digital access

---

## Challenge Difficulty Progression

### Comparison to Mission 1

| Aspect | Mission 1 | Mission 2 | Progression |
|--------|-----------|-----------|-------------|
| **Locked Doors** | 2-3 (Easy-Medium) | 4 (Easy-Hard) | +1-2 locks, harder difficulty |
| **Social Engineering** | Maya (cautious) | Marcus (desperate) | Easier target (tutorial reinforcement) |
| **Encoding Types** | Base64 only | Base64 + ROT13 | +1 encoding type (skill expansion) |
| **Stealth Mechanic** | None | Patrolling guards | NEW mechanic (beginner-friendly) |
| **Puzzle Mechanic** | None | PIN cracking safe | NEW mechanic (investigation-based) |
| **VM Complexity** | SSH basics | SSH + ProFTPD exploit | +1 exploitation step |
| **Time Pressure** | None | Narrative urgency | Emotional pressure (no hard timer) |

### Beginner-Friendly Features (Maintained from M1)

- ✅ Infinite retries on lockpicking (no lockouts)
- ✅ Forgiving stealth (warning before consequences)
- ✅ Hint system (Agent 0x99 provides guidance)
- ✅ Multiple solution paths (can avoid guards, use PIN cracker device)
- ✅ No instant failure states (can recover from mistakes)
- ✅ Clear objectives (always know what to do next)

### Skill Progression Philosophy

1. **Introduce 2 new mechanics** (guards, PIN puzzle) with tutorials
2. **Reinforce 3 M1 mechanics** (lockpicking, social engineering, encoding)
3. **Slightly increase difficulty** (more locks, new encoding type, VM exploit)
4. **Maintain accessibility** (forgiving failure, hints, fallback options)
5. **Reward mastery** (perfect path for advanced players: never detected, all LORE found, no hints needed)

---

## Educational Objectives by CyBOK Area

### Malware & Attack Technologies (Primary Focus)

**Learning Objectives:**
- Understand ransomware behavior (encryption, ransom demands, time pressure)
- Recognize service vulnerabilities (ProFTPD CVE-2010-4652)
- Identify backdoor mechanisms in compromised systems
- Practice vulnerability exploitation techniques

**Challenges Teaching This:**
- VM: ProFTPD backdoor exploitation
- In-Game: Analyzing ransomware note, Ghost's manifesto (LORE)
- Hybrid: Understanding how ENTROPY deployed ransomware via FTP vulnerability

**Assessment:**
- Player successfully exploits ProFTPD backdoor
- Player can explain how ransomware encrypted systems (debrief question)
- Player identifies vulnerability chain (FTP → ransomware deployment)

---

### Incident Response (Primary Focus)

**Learning Objectives:**
- Practice incident response procedures (isolate, recover, document)
- Understand backup importance and recovery strategies
- Make triage decisions under time pressure
- Recognize incident containment vs. eradication trade-offs

**Challenges Teaching This:**
- In-Game: Ransom payment decision (triage: fast vs. safe recovery)
- VM: Locating backup systems, assessing recovery options
- Hybrid: Correlating digital evidence (logs) with physical evidence (offline backups)

**Assessment:**
- Player makes informed decision on ransom payment (weighs pros/cons)
- Player locates backup systems (both online and offline)
- Player understands why offline backups protect against ransomware

---

### Applied Cryptography (Primary Focus)

**Learning Objectives:**
- Understand symmetric encryption (AES-256 ransomware)
- Recognize encryption key recovery procedures
- Distinguish encoding (Base64, ROT13) from encryption
- Practice decryption key management concepts

**Challenges Teaching This:**
- In-Game: Decoding Base64 (obfuscation) vs. decrypting ransomware (encryption)
- In-Game: ROT13 Caesar cipher introduction
- VM: Finding encryption keys, understanding key recovery
- Narrative: Ghost's manifesto explains AES-256 encryption choice

**Assessment:**
- Player successfully decodes Base64 and ROT13 messages
- Player can explain encoding vs. encryption (debrief question)
- Player understands why two keys needed (online + offline backup strategy)

---

### Human Factors (Secondary Focus)

**Learning Objectives:**
- Recognize social engineering tactics during crisis
- Understand psychological vulnerability (stress, guilt, fear)
- Practice empathy-based social engineering (Marcus)
- Identify predictable human behaviors (PIN selection)

**Challenges Teaching This:**
- In-Game: Social engineering stressed Marcus
- In-Game: PIN puzzle (humans use predictable dates: founding year, birthdays)
- Narrative: Hospital leadership ignored warnings (institutional human factors)

**Assessment:**
- Player successfully social engineers Marcus for password hints
- Player deduces PIN from human behavior patterns
- Player understands how crisis affects judgment (Marcus desperate = easier target)

---

### Physical Security (Secondary Focus)

**Learning Objectives:**
- Understand patrol patterns and timing
- Practice lockpicking and physical access control
- Recognize airgapped backup importance (offline safe)
- Assess physical security measures (locks, guards, safes)

**Challenges Teaching This:**
- In-Game: Patrolling guards (timing-based stealth)
- In-Game: Lockpicking multiple doors (access control)
- In-Game: PIN safe (secure physical storage)

**Assessment:**
- Player successfully navigates past guards
- Player lockpicks required doors
- Player understands why offline keys stored in physical safe

---

### Systems Security (Secondary Focus)

**Learning Objectives:**
- Practice Linux command line navigation
- Understand file permissions and privilege levels
- Recognize network service vulnerabilities (FTP)
- Identify backup system architecture

**Challenges Teaching This:**
- VM: Linux filesystem navigation (cd, ls, cat, find)
- VM: SSH and FTP service interaction
- VM: Privilege escalation concepts

**Assessment:**
- Player successfully navigates Linux filesystem
- Player exploits service vulnerability (ProFTPD)
- Player locates backup files via command line

---

## Difficulty Scaling Options

### For Struggling Players (Accessibility)

**Agent 0x99 Hints (Progressive):**
1. After 3 failed lockpicking attempts: "Take your time. Tension wrench steady, pick probe gently."
2. After guard detection: "Watch the guard's route. They repeat the same pattern every 60 seconds."
3. After 3 wrong PIN attempts: "Safe combinations often use significant institutional dates. Check historical markers."
4. If stuck on Base64: "Remember Base64 from Mission 1? Same principle. Use CyberChef."
5. If stuck on ROT13: "This looks like a Caesar cipher. Try ROT13 in CyberChef."

**Fallback Options:**
- PIN Cracker Device (brute force safe if puzzle too hard)
- Alternate paths (avoid guards via different routes)
- Marcus provides keycard (if high trust, skip lockpicking server room)

**No Punishment:**
- Infinite lockpicking retries
- Guard detection = warning, not failure
- Wrong PIN attempts don't lock safe

---

### For Advanced Players (Challenge)

**Perfect Path Requirements:**
1. Never detected by guards (complete stealth)
2. All 4 doors lockpicked (no skipping)
3. All LORE fragments found (3 total)
4. PIN solved on first attempt (no brute force device)
5. All encoding challenges solved without hints
6. Marcus protected from scapegoating (mid-mission intervention)
7. Both moral choices made with full information

**Additional Challenges:**
- Speed run option (complete in <40 minutes)
- No hints (Agent 0x99 provides minimal guidance)
- Discover Ghost's operational details (trace IP, identify relay point)

**Rewards:**
- Achievement: "Ghost Hunter" (perfect stealth)
- Achievement: "Code Breaker" (all encoding challenges, no hints)
- Achievement: "Ethical Hacker" (protected Marcus, optimal choices)
- Bonus LORE fragment (Ghost's identity hint for M6-M7)

---

## Common Mistakes & Mitigation

### Mistake 1: Players Don't Find PIN Clues

**Symptom:** Players stuck at safe, can't deduce 1987

**Mitigation:**
- Multiple clue types (visual plaque, document sticky note, NPC dialogue)
- Agent 0x99 hint after 3 failed attempts
- PIN cracker device as fallback (find in emergency storage)
- Tutorial during first safe encounter: "Look for environmental clues"

---

### Mistake 2: Players Frustrated by Guard Patrols

**Symptom:** Players repeatedly detected, feel stuck

**Mitigation:**
- Forgiving detection (warning first, no instant failure)
- Predictable 60-second pattern (easy to learn)
- Visual/audio cues (minimap, radio chatter)
- Alternate paths (multiple routes through hospital)
- Agent 0x99 tutorial on first encounter

---

### Mistake 3: Players Skip Social Engineering, Miss Password Hints

**Symptom:** Players try random SSH passwords, get frustrated

**Mitigation:**
- Marcus provides hints voluntarily (first conversation)
- Sticky notes visible on desk (physical clues)
- Agent 0x99 reminder: "Talk to Marcus. He knows the password patterns."
- Eventually provides partial hint if player stuck

---

### Mistake 4: Players Don't Understand Ransom Dilemma

**Symptom:** Players pick ransom option without considering consequences

**Mitigation:**
- Both options presented clearly (Agent 0x99 explains pros/cons)
- Ghost's arguments shown (persuasion attempt)
- Time to consider (not rushed decision)
- Debrief validates both choices (no "wrong" answer)

---

## Playtesting Priorities

### Critical Testing Areas

1. **Guard Patrol Balance:**
   - Is 60-second pattern too fast? Too slow?
   - Is detection radius fair?
   - Are alternate paths discoverable?
   - Test with beginner players (first time)

2. **PIN Puzzle Accessibility:**
   - Can players find founding year clue?
   - Is red herring (Emma's birthday) too confusing?
   - Do players discover PIN cracker device?
   - Test with players who struggle at puzzles

3. **Ransom Choice Presentation:**
   - Do both options feel equally valid?
   - Is Ghost's persuasion too strong? Too weak?
   - Do players feel rushed? Or too much time?
   - Test emotional impact (do players care about patients?)

4. **VM Challenge Difficulty:**
   - Is ProFTPD exploitation clear from hints?
   - Are Linux commands intuitive for beginners?
   - Do players understand flag submission process?
   - Test with players new to Linux

5. **Overall Pacing:**
   - Does 12-hour narrative deadline create urgency without stress?
   - Is 50-70 minute target realistic?
   - Do players feel rushed? Or bored?
   - Test complete playthrough with timer

---

## Technical Implementation Notes

### VM Integration

**SecGen Scenario Configuration:**
- Use "Rooting for a win" scenario as-is (no modifications)
- Configure flag mapping:
  - `flag{ssh_access_granted}` → Task ID: submit_ssh_flag
  - `flag{proftpd_backdoor_exploited}` → Task ID: submit_exploit_flag
  - `flag{database_backup_located}` → Task ID: submit_backup_flag
  - `flag{ghost_operational_log}` → Unlock LORE fragment

**Drop-Site Terminal:**
- Located in server room (requires lockpicking)
- Terminal interface: Text input for flag submission
- Validation: Check flag against VM scenario flag list
- Feedback: Success message + Agent 0x99 commentary
- Unlock: Trigger objectives (#complete_task:submit_flag_id)

---

### In-Game Systems

**Guard Patrol AI:**
- Waypoint-based patrol route (5 waypoints)
- 60-second loop (12 seconds per waypoint)
- Detection: Proximity circle (5 GU radius) or line-of-sight cone (90° angle, 8 GU range)
- Detection result: Warning dialogue → Player has 5 seconds to hide → If still visible, guard reports (delays mission, no failure)

**PIN Safe Minigame:**
- UI: 4-digit input field with numpad
- Wrong attempt feedback: "Incorrect PIN. Try again." (no cooldown)
- Correct attempt: Safe opens, USB drive added to inventory
- Optional: Visual feedback (tumblers clicking for correct digits)

**CyberChef Workstation:**
- Terminal interface with dropdown menu (Base64, ROT13, Hex, etc.)
- Input field: Paste encoded message
- Output field: Displays decoded result
- Tutorial tooltips for first use

---

## Success Criteria Summary

### Minimal Success (60% Completion)
- Completed VM SSH challenge (1 flag submitted)
- Lockpicked 2 required doors (IT, Server Room)
- Social engineered Marcus for basic hints
- Decoded 1 encoded message (Base64 ransomware note)
- Made ransom decision (either choice valid)
- Avoided guards at least once

### Standard Success (80% Completion)
- Completed 3 VM challenges (3 flags submitted)
- Lockpicked 3+ doors
- Social engineered Marcus successfully (high trust)
- Decoded both encoded messages (Base64 + ROT13)
- Made informed ransom decision (considered consequences)
- Cracked PIN safe (via clues or device)
- Navigated past guards multiple times

### Perfect Success (100% Completion)
- Completed all VM challenges (4 flags)
- Lockpicked all 4 doors
- Social engineered Marcus, protected from scapegoating
- Decoded all messages without hints
- Made optimal moral choices (both ransom + exposure decisions)
- Cracked PIN on first attempt (deduced from clues)
- Never detected by guards (perfect stealth)
- Found all 3 LORE fragments

---

**Technical Challenges Document Complete**

**Ready for:** Stage 1 (Narrative Structure Development)

**Core Strength:** Balanced introduction of new mechanics (guards, PIN puzzle) while reinforcing M1 skills (lockpicking, social engineering, encoding)

**Key Innovation:** Hybrid clue puzzle (PIN safe requires both physical investigation and pattern recognition)

**Educational Value:** Teaches incident response, ransomware mechanics, and Caesar ciphers while validating exploitation skills via VM
