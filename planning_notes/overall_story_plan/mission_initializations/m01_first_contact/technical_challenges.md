# Technical Challenges: "First Contact"

## Overview

Mission 1 serves as the tutorial introduction to Break Escape's dual gameplay: physical infiltration mechanics and VM hacking challenges. All challenges are designed for **Tier 1 (Beginner)** difficulty with clear tutorials and forgiving failure states.

---

## Break Escape Physical Challenges

### 1. Lockpicking (Introduction)

**Challenge Type:** Physical Minigame
**Difficulty:** Tutorial → Easy
**Learning Objective:** Master basic lockpicking mechanic

#### Implementation Details

**Tutorial Lock: Storage Closet Safe**
- **Location:** Storage closet (easily accessible, low stakes)
- **Type:** Simple combination safe with 3-digit code
- **Tutorial Prompt:** Agent 0x99 provides voice-over instructions
- **Success State:** Opens to reveal spare office keys
- **Failure State:** Can retry indefinitely, no penalties
- **Time Required:** 30-60 seconds (first attempt), 10-20 seconds (mastered)

**Gameplay Locks: Executive Office Doors (3 total)**
- **Derek Lawson's Office:** Medium difficulty (contains primary evidence)
- **Executive Office 1:** Easy difficulty (contains supporting documents)
- **Executive Office 2:** Easy difficulty (contains LORE fragment)
- **Mechanic:** Same as tutorial but no voice-over hints
- **Progressive Difficulty:** Tutorial → Easy → Easy → Medium

#### Educational Value
- **Real-World Parallel:** Physical security bypass (non-destructive entry)
- **CyBOK Area:** Physical Security (implied in comprehensive security)
- **Takeaway:** Locks provide security through obscurity, not absolute protection

---

### 2. NPC Social Engineering (Introduction)

**Challenge Type:** Dialogue System
**Difficulty:** Tutorial (Maya) → Easy (Others) → Medium (Derek)
**Learning Objective:** Extract information through conversation

#### Implementation Details

**Tutorial NPC: Maya Chen (Journalist Ally)**
- **Difficulty:** Easy (wants to help)
- **Topics Available:**
  - "Tell me about the company" → Background info
  - "Who seems suspicious?" → Points to Derek and isolated colleagues
  - "What are the special projects?" → Disinformation campaigns
  - "How can I help?" → Suggests checking locked offices
- **Success:** All dialogue options lead to useful information
- **Failure:** None (she's on your side)
- **Purpose:** Teach dialogue system without pressure

**Standard NPCs: Innocent Employees (3-4 total)**
- **Difficulty:** Easy to Medium (willing to talk, may be suspicious)
- **Examples:**
  - **Receptionist Sarah:** Provides access, mentions "VIP clients"
  - **IT Manager Kevin:** Gives server room access if convinced
  - **Marketing Lead Jessica:** Confused about projects she's not included in
- **Topics Available:**
  - "What's the company culture like?" → General info
  - "Anyone acting strange lately?" → Points to Derek's team
  - "Tell me about recent projects" → Legitimate vs. suspicious work
- **Success States:**
  - Trusted: Shares valuable intelligence
  - Neutral: Provides basic information
  - Suspicious: Gives minimal info, may warn others
- **Failure:** Can retry with different approach, or find info elsewhere

**Hostile NPC: Derek Lawson (ENTROPY Operative)**
- **Difficulty:** Medium (skilled at deflection)
- **Topics Available:**
  - "What projects are you working on?" → Vague answers
  - "I saw some interesting files..." → Becomes guarded
  - (If evidence collected) "I know what you're doing" → Philosophical defense
- **Success States:**
  - Early conversation: Gains intel without alerting him
  - Late confrontation: Extracts admission before escape
- **Failure:** Alerts him early, makes evidence collection harder
- **Purpose:** Teach that NPCs can be adversarial

#### Conversation Flow Mechanics
- **Branching Dialogue:** Multiple response options affect NPC attitude
- **Attitude Tracking:** NPCs remember previous interactions
- **Information Gating:** Some topics unlock after finding evidence
- **Body Language Cues:** NPCs show visual cues (nervous, defensive, helpful)

#### Educational Value
- **CyBOK Area:** Human Factors (Social Engineering)
- **Real-World Parallel:** Pretexting, elicitation, HUMINT gathering
- **Takeaway:** People are often willing to share information if approached correctly

---

### 3. Basic Investigation

**Challenge Type:** Environmental Exploration
**Difficulty:** Easy (some obvious, some hidden)
**Learning Objective:** Search environments systematically for evidence

#### Implementation Details

**Evidence Types:**

**Obvious Evidence (Tutorial)**
1. **Conference Room Whiteboard**
   - **Location:** Glass-walled conference room (visible from outside)
   - **Content:** "Project Narrative" timeline with election dates
   - **Interaction:** Photograph with in-game camera
   - **Hints:** Maya points it out in conversation

2. **Printed Documents on Desks**
   - **Location:** Various desks in open office
   - **Content:** Campaign talking points, target demographics
   - **Interaction:** Read and collect
   - **Hints:** Glowing highlight when nearby

**Medium Evidence (Requires Exploration)**
3. **File Folders in Unlocked Cabinets**
   - **Location:** Common areas, break room
   - **Content:** Client contracts (shows legitimate vs. "special" clients)
   - **Interaction:** Search cabinet, read documents
   - **Hints:** Cabinets have visual indicator when searchable

4. **Sticky Notes and Memos**
   - **Location:** Monitor edges, bulletin boards, desks
   - **Content:** Passwords hints, meeting notes, suspicious reminders
   - **Interaction:** Click to read, auto-collect
   - **Hints:** Distinctive color coding (yellow = normal, red = suspicious)

**Hidden Evidence (Rewards Thoroughness)**
5. **Shredded Documents in Trash**
   - **Location:** Derek's office (requires lockpicking first)
   - **Content:** ENTROPY cell structure diagram (LORE fragment)
   - **Interaction:** Mini-game to reconstruct shredded paper
   - **Hints:** Trashcan has subtle visual cue (papers visible)

6. **Hidden USB Drive**
   - **Location:** Taped under desk drawer
   - **Content:** Backup of deleted files
   - **Interaction:** Inspect desks thoroughly (hidden interaction point)
   - **Hints:** None (reward for thorough players)

#### Evidence Tracking System
- **Evidence Log UI:** Shows collected items and their significance
- **Completion Percentage:** Indicates how much evidence gathered (need 60% minimum)
- **Correlation System:** Some evidence makes sense only when combined with other pieces
- **Quality Tiers:**
  - **Minimal (60%):** Enough to prove ENTROPY involvement
  - **Standard (80%):** Full picture of operation
  - **Complete (100%):** All LORE fragments, perfect investigation

#### Educational Value
- **CyBOK Area:** Security Operations (Evidence Collection, Forensics)
- **Real-World Parallel:** Crime scene investigation, digital forensics chain of custody
- **Takeaway:** Thorough systematic search beats random exploration

---

### 4. Evidence Collection & Correlation

**Challenge Type:** Inventory Management + Puzzle
**Difficulty:** Medium (requires connecting dots)
**Learning Objective:** Build coherent case from disparate evidence

#### Implementation Details

**Evidence Categories:**

**Physical Evidence (Collected in Break Escape)**
1. Campaign materials (whiteboards, printouts)
2. Organizational documents (company structure, employee lists)
3. Communications (sticky notes, memos, overheard conversations)
4. Financial records (cryptocurrency wallet addresses)
5. LORE fragments (optional but enriching)

**Digital Evidence (Collected from VM)**
6. Decoded campaign narratives (flags)
7. Target demographics and psychological profiles
8. ENTROPY cell communications
9. Network traffic analysis (PCAP)
10. Hidden files (backup communications)

**Correlation Mechanics:**

**Simple Correlations (Tutorial):**
- Physical campaign timeline + Decoded narrative = Proves coordinated disinformation
- Employee list + Suspicious behavior = Identifies ENTROPY operatives
- Cryptocurrency wallet + PCAP traffic = Proves external ENTROPY connection

**Complex Correlations (Optional):**
- LORE fragments + Cell communications = Reveals Social Fabric philosophy
- Financial records + Multiple sources = Traces funding network (M6 setup)
- "Architect" references across sources = Establishes mystery thread

**Evidence Board UI:**
- Visual representation of collected evidence
- Drag-and-drop to connect related pieces
- Reveals insights when connections made
- Required connections for mission completion vs. optional discoveries

#### Success States

**Minimal Success (60% evidence):**
- Proves ENTROPY involvement
- Identifies Derek Lawson as operative
- Enough to stop immediate threat (election disinformation)

**Standard Success (80% evidence):**
- Complete picture of Social Fabric operation
- Identifies all operatives
- Understands methodology and targets
- Protects innocent employees effectively

**Perfect Success (100% evidence):**
- All LORE fragments found
- Complete financial trail
- Architect mystery clue discovered
- Sets up future missions optimally

#### Educational Value
- **CyBOK Area:** Security Operations (Analysis, Reporting)
- **Real-World Parallel:** Threat intelligence analysis, incident investigation
- **Takeaway:** Individual data points become meaningful when correlated

---

## VM/SecGen Challenges (Digital Hacking)

**SecGen Scenario:** "Introduction to Linux and Security lab" ✅ REVISED
**Difficulty:** Beginner
**Environment:** Standard Linux system with SSH service

**Integration Approach:** Hybrid (VM for technical validation + ERB for narrative content)

### Challenge Overview

Player must use Hydra to brute force SSH access to Social Fabric's campaign server, then navigate the Linux file system to find flags representing ENTROPY operational communications. Password list obtained through in-game social engineering.

**Key Architectural Note:**
- **VM provides:** Technical skill validation (SSH brute force, Linux basics, sudo)
- **ERB provides:** Story-rich encoded content (Base64 messages, client lists, Architect references)
- **Integration:** Social engineering in-game → password list → VM brute force → flags submitted at dead drop terminal

---

### 1. SSH Brute Force Attack

**Challenge Type:** Password Attack
**Difficulty:** Tutorial → Easy
**Learning Objective:** Understand password security weakness and brute force fundamentals

#### Implementation Details

**Password List Source (In-Game Social Engineering):**
- **How Obtained:** Maya Chen provides list of "common passwords employees use"
- **Narrative Context:** She's noticed colleagues using weak passwords like birthdays, company name variations
- **File:** `social_fabric_passwords.txt` (generated in-game, available in server room terminal)
- **Contents:** 15-20 common passwords including the correct one

**Hydra Brute Force Attack:**
- **Target:** SSH service on Social Fabric campaign server
- **Tool:** Hydra (pre-installed on Kali VM)
- **Username:** `campaign_manager` (discovered from in-game documents)
- **Password List:** social_fabric_passwords.txt

**Command (with tutorial guidance):**
```bash
# Agent 0x99 teaches Hydra basics
hydra -l campaign_manager -P social_fabric_passwords.txt ssh://<server_ip>
```

**Success State:**
- Hydra finds correct password
- Player can now SSH into server
- Agent 0x99 congratulates on first brute force success

**Failure States:**
- Incorrect syntax: Agent 0x99 provides command correction
- No password list: Prompts player to complete social engineering first

**Hybrid Workflow:**
1. Social engineer Maya Chen (in-game) → get password hints
2. Generate password list (in-game)
3. Use Hydra to brute force SSH (VM)
4. Successfully authenticate (VM)
5. Submit success flag at drop-site terminal (in-game)

#### Educational Value
- **CyBOK Area:** Security Operations (Password Security), Malware & Attack Technologies (Brute Force)
- **Real-World Skill:** Password brute forcing fundamental pentesting technique
- **Takeaway:**
  - Weak passwords are security liability
  - Social engineering often provides password hints
  - Brute force effective against weak password policies
  - Combined physical + digital approach more effective

---

### 2. Linux Command Line Navigation

**Challenge Type:** Linux Command Line
**Difficulty:** Tutorial → Easy
**Learning Objective:** Navigate Linux file system, find and read flags

#### Implementation Details

**Tutorial (Agent 0x99 teaches):**
- First time on Linux command line for many players
- Agent 0x99 explains each command when first used
- Visual command reference available in-game

**Required Commands:**
```bash
pwd                    # Show current directory ("Where am I?")
ls                     # List files ("What files are here?")
cd Documents           # Change directory
cat flag_1.txt         # Read flag file
cat flag_2.txt         # Read another flag
```

**Files Structure:**
```
/home/campaign_manager/
├── flag_1.txt         # First flag (in home directory)
├── Documents/
│   └── flag_2.txt     # Second flag (requires cd)
└── .bash_history      # Optional exploration
```

**Tutorial Flow:**
1. Player successfully SSH'd in previous challenge
2. Agent 0x99: "You're now logged into their server. Let's look around."
3. Guides through `pwd` (shows `/home/campaign_manager`)
4. Guides through `ls` (shows files including flag_1.txt)
5. Guides through `cat flag_1.txt` (reads first flag)
6. Player discovers Documents/ directory
7. Must use `cd Documents` then `ls` then `cat flag_2.txt`

**Success State:** Found and read both flags
**Tutorial Hints:** Agent 0x99 suggests commands if stuck >30 seconds

#### Educational Value
- **CyBOK Area:** Systems Security (OS fundamentals, Linux basics)
- **Real-World Skill:** Linux command line essential for cybersecurity
- **Takeaway:**
  - pwd = present working directory
  - ls = list files
  - cd = change directory
  - cat = read file contents
  - File system has hierarchical structure

---

### 3. Sudo Privilege Escalation (Introduction)

**Challenge Type:** Privilege Escalation
**Difficulty:** Easy
**Learning Objective:** Introduction to sudo and privilege escalation concepts

#### Implementation Details

**Scenario:**
- After finding flags in campaign_manager's home, discover some files require elevated privileges
- Bystander user account has additional intel

**sudo Configuration:**
- campaign_manager can run `sudo su - bystander` without password
- This simulates misconfigured sudo permissions (common real-world issue)

**Commands:**
```bash
# After reading flag_1 and flag_2 as campaign_manager
sudo -l                 # Check what sudo permissions available
# Output shows: (bystander) NOPASSWD: ALL

sudo su - bystander     # Switch to bystander user
pwd                     # Now in /home/bystander
ls
cat flag_3.txt          # Read final flag from bystander's home
```

**Agent 0x99 Tutorial:**
- "Some systems have weak permission controls. Let's check if this account has elevated privileges."
- Explains sudo allows running commands as other users
- "In real pentests, misconfigured sudo is common vulnerability"

**Success State:** Successfully escalate to bystander, read flag_3.txt

#### Educational Value
- **CyBOK Area:** Systems Security (Access Control, Privilege Escalation)
- **Real-World Skill:** Privilege escalation fundamental to penetration testing
- **Takeaway:**
  - sudo allows users to run commands with elevated privileges
  - Misconfigured sudo common security vulnerability
  - Always check `sudo -l` during investigations
  - Privilege escalation often necessary to access protected data

---

### 4. Flag Submission via Dead Drop System

**Challenge Type:** Integration (VM → In-Game)
**Difficulty:** Tutorial
**Learning Objective:** Understand CTF flags as operational intelligence

#### Implementation Details

**Flags Obtained from VM:**
- flag_1.txt: `flag{social_fabric_campaign_access}`
- flag_2.txt: `flag{disinformation_documents_found}`
- flag_3.txt: `flag{escalated_privileges_bystander}`

**Narrative Context (Agent 0x99 explains):**
- "These flags aren't random strings—they represent ENTROPY operational communications we've intercepted"
- "Submit them at the drop-site terminal to unlock their intelligence value"

**In-Game Drop-Site Terminal:**
- Located in server room (same location as VM access)
- Visual interface showing "Intercepted ENTROPY Communications"
- Submit each flag → unlocks corresponding resource

**Unlocks:**
- Flag 1 → Server credentials document (proves access)
- Flag 2 → Campaign database schema (intelligence)
- Flag 3 → Elevated access logs (shows scope of operation)

**Integration with Objectives System:**
- Each flag submission tracked as objective completion
- Required for mission progress (minimum 2 of 3 flags)
- Perfect run requires all 3 flags

#### Educational Value
- **CyBOK Area:** Security Operations (Intelligence Gathering)
- **Real-World Parallel:** Captured communications provide actionable intelligence
- **Takeaway:**
  - CTF flags represent real operational intelligence
  - Technical exploitation yields tangible resources
  - Physical + digital evidence correlation creates complete picture

---

## In-Game Encoded Content (ERB Templates)

**Note:** Separate from VM challenges, these challenges exist in the Break Escape game world and teach encoding concepts.

### 5. Base64 Encoding Tutorial (In-Game)

**Challenge Type:** Encoding (Tutorial)
**Difficulty:** Tutorial → Easy
**Learning Objective:** Understand encoding vs. encryption, use CyberChef

#### Implementation Details

**Location:** Conference room whiteboard (visible in-game)

**Encoded Message:**
```
Q2xpZW50IE1lZXRpbmc6IFplcm8gRGF5IFN5bmRpY2F0ZSwgUmFuc29td2FyZSBJbmMsIENyaXRpY2FsIE1hc3M=
```

**Agent 0x99 Tutorial (First Encoding Encounter):**
- "This looks like Base64 encoding. Let me teach you about encoding vs. encryption."
- **Key Lesson:** "Encoding transforms data for transmission—no key needed to reverse it!"
- **vs. Encryption:** "Encryption requires a secret key. This is just encoding."
- "Use the CyberChef workstation here to decode it."

**CyberChef Workstation (In-Game):**
- Simplified interface (drag "From Base64" operation)
- Drop zone for encoded text
- Visual "Bake" button
- **Decoded Message:** "Client Meeting: Zero Day Syndicate, Ransomware Inc, Critical Mass"

**Significance:**
- Reveals cross-cell collaboration (first hint ENTROPY is bigger)
- Setup for M2 (Ransomware Inc), M3 (Zero Day), M4 (Critical Mass)
- Teaches fundamental encoding concept

**Additional Encoded Messages (ERB-generated):**
- Sticky notes with Base64 (reinforcement)
- Email drafts with ROT13 (introduces second encoding type)
- Hidden USB with hex-encoded data (progression)

#### Educational Value
- **CyBOK Area:** Applied Cryptography (Encoding basics)
- **Real-World Skill:** Base64 extremely common in cybersecurity
- **Takeaway:**
  - Encoding ≠ Encryption (critical distinction)
  - Base64 used for data transmission, not security
  - CyberChef essential tool for analysts
  - Always check office whiteboards/notes for obfuscated data

---

## Challenge Integration: Physical + Digital (Hybrid Approach)

### How Challenges Connect

**Flow Example 1: Social Engineering → Hydra Brute Force (Hybrid Workflow)**
1. Social engineer Maya Chen (in-game)
2. She provides list of "passwords employees commonly use"
3. Generate password list file (in-game): social_fabric_passwords.txt
4. Access server room terminal (in-game)
5. Use Hydra to brute force SSH (VM)
6. Successfully authenticate with discovered password
7. Navigate file system and find flags (VM)
8. Submit flags at drop-site terminal (in-game)
9. Unlock ENTROPY intelligence resources (in-game)

**Flow Example 2: VM Findings → Physical Confrontation**
1. Complete VM challenges, obtain 3 flags (VM)
2. Submit flags, unlock server access logs (in-game)
3. Logs reveal Derek's username accessed server recently (in-game)
4. Decode Base64 message on whiteboard showing client list (in-game)
5. Correlate evidence: Derek + server access + ENTROPY clients
6. Return to office floor, confront Derek with proof
7. He can't deny evidence, attempts philosophical defense

**Flow Example 3: Encoding Education Progression**
1. Physical: Encounter Base64 on conference room whiteboard (in-game)
2. Tutorial: Agent 0x99 teaches encoding vs. encryption (in-game)
3. Practice: Use CyberChef to decode whiteboard message (in-game)
4. Revelation: Message reveals cross-cell collaboration
5. Technical Application: Use learned concepts during VM investigation
6. Advanced: Encounter additional encoding types in office (ROT13, hex)
7. Result: Understand encoding fundamentals through hands-on practice

**Flow Example 4: Privilege Escalation Discovery**
1. Physical: Find note mentioning "bystander has the good stuff" (in-game)
2. Digital: Check sudo permissions on server (VM: `sudo -l`)
3. Escalation: Use sudo to access bystander account (VM)
4. Discovery: Find final flag in bystander's home (VM)
5. Submit: Return flag via drop-site terminal (in-game)
6. Intelligence: Unlock complete scope of operation

### Backtracking Requirements

**Required Backtracking (Hybrid Flow):**
1. Social engineer NPCs for password hints → Generate list → Return to server room for brute force
2. Complete VM challenges → Return to in-game drop-site to submit flags
3. Unlock intelligence from flags → Return to office to correlate with physical evidence
4. Decode in-game Base64 messages → Understand context for VM findings

**Optional Backtracking:**
5. Find LORE fragment about Social Fabric philosophy → Return to Derek for confrontation with deeper understanding
6. Discover "Architect" reference in decoded message → Return to Agent 0x99 for context
7. Complete all VM challenges → Return to Maya to share full scope of operation

---

## Difficulty Scaling Options

### Easy Mode
- More obvious evidence placement
- SSH credentials provided in briefing (no need to find)
- CyberChef recipes pre-configured
- Agent 0x99 provides frequent hints
- Lockpicking has visual guides

### Standard Mode (Default)
- Evidence requires exploration
- Credentials must be found
- CyberChef operations must be selected
- Hints available but not intrusive
- Lockpicking requires skill

### Hard Mode
- Minimal hints
- Some evidence very well hidden
- Time pressure added (complete before election)
- Lockpicking has shorter windows
- NPCs less cooperative

### Expert Mode (Replayability)
- No tutorials or hints
- All evidence must be found (100% required)
- Perfect lockpicking required
- Speed run timer
- Consequences for alerting NPCs

---

## Success Metrics

**Mission Complete (Minimum) if:**
- ✅ Collected minimum 60% evidence (physical + digital combined)
- ✅ Identified Derek Lawson as ENTROPY operative
- ✅ Successfully brute forced SSH with Hydra
- ✅ Submitted at least 2 of 3 VM flags
- ✅ Decoded at least 1 in-game Base64 message
- ✅ Found at least one "Architect" reference

**Perfect Clear if:**
- ✅ Collected 100% evidence
- ✅ Identified all ENTROPY operatives
- ✅ Successfully completed all VM challenges (brute force, navigation, sudo escalation)
- ✅ Submitted all 3 VM flags
- ✅ Decoded all in-game encoded messages (Base64, ROT13, hex)
- ✅ Found all LORE fragments
- ✅ Completed without alerting suspects early
- ✅ Understood hybrid workflow (physical investigation → VM exploitation)

---

## Educational Outcomes

**By end of mission, players should:**

**Understand:**
- Difference between encoding and encryption (taught by Agent 0x99)
- How SSH brute force attacks work (Hydra fundamentals)
- How weak passwords are security liability
- Social engineering → technical exploitation workflow
- How to navigate Linux file systems (ls, cat, cd, pwd)
- What privilege escalation means (sudo introduction)
- How CTF flags represent operational intelligence
- How to correlate evidence from multiple sources (physical + digital)

**Be Able To:**
- Perform SSH brute force with Hydra given password list
- Execute basic Linux commands (ls, cat, cd, pwd, sudo -l)
- Use sudo for basic privilege escalation
- Use CyberChef for basic Base64 decoding (in-game)
- Conduct systematic investigation gathering physical evidence
- Build coherent case from disparate data points
- Submit VM flags via dead drop system
- Navigate hybrid workflow between game and VM

**Recognize:**
- Base64 encoding (most common encoding type)
- Signs of weak password policies
- Importance of social engineering in technical attacks
- Value of thorough investigation
- Value of protecting innocent people during operations
- How physical and digital evidence complement each other
- Reality that security is ongoing process, not one-time event

---

*Technical Challenges Document Complete*
*Supports: Stage 0 Initialization for M1 "First Contact"*
