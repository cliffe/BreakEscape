# Mission 1: First Contact - Player Objectives

**Scenario:** First Contact
**Mission Type:** Infiltration & Investigation
**Target Difficulty:** Tier 1 (Beginner)
**Hybrid Architecture:** VM challenges + In-game tasks

---

## Overview

**Objective Philosophy:**

Mission 1 uses **progressive unlocking with required backtracking** to teach non-linear investigation. Players start with limited access, gather intel and keys through exploration, then return to previously locked areas with new capabilities. This creates interconnected puzzle chains that reward thoroughness.

**Progression Model:**
- **Act 1 (0-20 min):** Exploratory objectives emerge organically (tutorial phase)
- **Act 2 (20-50 min):** Clear objectives displayed - investigation with backtracking
- **Act 3 (50-60 min):** Final objectives - confrontation and resolution

**Hybrid Integration:**
Players alternate between physical investigation (in-game tasks) and digital exploitation (VM challenges), with correlation tasks requiring synthesis of both.

---

## Primary Objective: Investigate Social Fabric Operations

**ID:** `main_mission`
**Description:** "Gather intelligence on Social Fabric's disinformation campaign"
**Status:** Active (from start of Act 2)

**Narrative Purpose:**
Player must expose ENTROPY's Social Fabric cell operating within Viral Dynamics Media before they can manipulate the upcoming election.

**Educational Purpose:**
Teaches hybrid investigation methodology: social engineering → password discovery → SSH brute force → Linux navigation → evidence correlation.

**Success Criteria:**
- Identify ENTROPY operatives (Derek Lawson + accomplices)
- Gather evidence of disinformation campaign
- Intercept ENTROPY communications (VM flags)
- Prevent election manipulation

---

### Aim 1.1: Establish Presence

**ID:** `establish_presence`
**Description:** "Establish your cover and initial access"
**Status:** Active (from mission start)
**Unlock:** Available from start (Act 1 tutorial)

**Purpose:** Tutorial phase teaching basic mechanics

---

#### Task: Enter Viral Dynamics Office

**ID:** `enter_office`
**Type:** In-Game (narrative)
**Description:** "Enter Viral Dynamics Media office using IT contractor cover"
**Location:** Reception Area (starting room)
**Requirements:** None (mission start)
**Completion:** Automatic upon spawn
**Unlocks:** `meet_reception`, exploration of public areas

---

#### Task: Meet Receptionist Sarah

**ID:** `meet_reception`
**Type:** In-Game (social engineering)
**Description:** "Check in with receptionist and establish your cover"
**Location:** Reception Area
**Requirements:** Entered office
**Interaction:** Talk to Sarah (NPC)
**Completion:** Ink tag `#complete_task:meet_reception` (after dialogue)
**Unlocks:** `explore_office`, basic visitor badge access

**Tutorial Value:** First NPC interaction, introduces dialogue system

---

#### Task: Explore Public Office Areas

**ID:** `explore_office`
**Type:** In-Game (exploration)
**Description:** "Familiarize yourself with the office layout"
**Location:** Main Office Area, Break Room
**Requirements:** Visitor badge from reception
**Completion:** Ink tag `#complete_task:explore_office` (after visiting 2+ rooms)
**Unlocks:** `meet_kevin` (next aim unlocks)

**Tutorial Value:** Movement, room navigation, observing locked doors

---

###Aim 1.2: Meet IT Manager Kevin

**ID:** `meet_kevin_aim`
**Description:** "Gain Kevin's trust and access to systems"
**Status:** Locked (unlocks after `explore_office`)
**Unlock Condition:** After completing `explore_office`

**Purpose:** Social engineering tutorial, password hints acquisition

---

#### Task: Talk to Kevin

**ID:** `talk_to_kevin`
**Type:** In-Game (social engineering)
**Description:** "Meet with IT Manager Kevin about 'server issues'"
**Location:** Main Office Area (near server room entrance)
**Requirements:** Completed initial exploration
**Interaction:** Talk to Kevin (NPC)
**Completion:** Ink tag `#complete_task:talk_to_kevin`
**Unlocks:** `lockpick_tutorial`, `server_room_access`

**Educational Value:**
- Social engineering basics (building rapport with target)
- Kevin unwittingly provides password hints: "Everyone uses variations of ViralDynamics2025"
- Player learns that casual conversation yields intelligence

**Dialogue Excerpt:**
> **Kevin:** "Everyone here uses variations of 'ViralDynamics2025' for everything—I keep telling them it's a security risk, but marketing people, you know?"

---

### Aim 1.3: Learn Basic Skills (Tutorial)

**ID:** `tutorial_skills`
**Description:** "Learn essential investigation skills"
**Status:** Locked (unlocks after meeting Kevin)
**Unlock Condition:** After `talk_to_kevin`

**Purpose:** Tutorial for core game mechanics

---

#### Task: Lockpicking Tutorial

**ID:** `lockpick_tutorial`
**Type:** In-Game (skill tutorial)
**Description:** "Practice lockpicking on storage closet safe"
**Location:** Storage Closet
**Requirements:** Kevin mentioned "spare keys in storage closet safe"
**Interaction:** Lockpick minigame on practice safe
**Completion:** Ink tag `#complete_task:lockpick_tutorial` (when safe opened)
**Unlocks:** Lockpicking skill, `spare_office_keys` item, ability to pick other locks

**Educational Value:**
- Lockpicking mechanics (low-stakes practice)
- Reward: Spare keys to some locked offices

---

#### Task: Access Server Room

**ID:** `server_room_access`
**Type:** In-Game (access)
**Description:** "Enter the server room with Kevin's authorization"
**Location:** Server Room
**Requirements:** Kevin grants access badge
**Completion:** Automatic upon entering server room
**Unlocks:** `vm_access_terminal`, `identify_targets` aim (Act 2 begins)

**Narrative Moment:**
Kevin trusts player enough to grant server room access. Marks transition from Act 1 (tutorial) to Act 2 (investigation).

---

## Act 1 Complete: Transition to Act 2

**Completion Trigger:** Player enters server room
**Effect:** Main investigation objectives become visible in UI
**Player State:** Has basic skills (lockpicking), some office access, Kevin's trust

---

### Aim 2.1: Identify Disinformation Targets

**ID:** `identify_targets`
**Description:** "Identify Social Fabric's disinformation campaign targets"
**Status:** Locked (unlocks when entering server room - Act 2 start)
**Unlock Condition:** After `server_room_access`

**Purpose:** Begin active investigation - decode messages and access systems

---

#### Task: Decode Whiteboard Message

**ID:** `decode_whiteboard`
**Type:** In-Game (encoding challenge)
**Description:** "Decode the Base64 message on Derek's whiteboard"
**Location:** Derek's Office (requires lockpicking with spare keys OR completing `clone_keycard`)
**Requirements:**
- Access to Derek's Office (spare keys from tutorial safe OR clone Derek's RFID)
- CyberChef workstation access (unlocked during tutorial)
**Interaction:** Examine whiteboard, copy Base64 string, use CyberChef terminal
**Completion:** Ink tag `#complete_task:decode_whiteboard`
**Unlocks:** `submit_ssh_flag` (reveals password patterns for VM challenge)

**Educational Value:**
- Encoding vs. encryption concept (Agent 0x99 explains via phone)
- Base64 decoding using CyberChef
- Message reveals: "Client list update: Coordinating with ZDS for technical infrastructure"

**Backtracking Required:**
Player must explore office, find Derek's office (locked), return after getting keys, decode message

---

#### Task: Access Maya's Computer

**ID:** `access_maya_computer`
**Type:** In-Game (password challenge)
**Description:** "Access Maya Chen's workstation for intel"
**Location:** Main Office Area (Maya's desk)
**Requirements:** Password from social engineering OR found in Derek's office
**Interaction:** Computer password entry
**Completion:** Ink tag `#complete_task:access_maya_computer`
**Unlocks:** Email evidence, `correlation_task_1`

**Educational Value:**
- Password usage in context
- Evidence: Maya's draft article about suspicious projects

---

#### Task: Submit SSH Access Flag

**ID:** `submit_ssh_flag`
**Type:** VM Flag Submission
**Description:** "Submit intercepted ENTROPY communication (SSH access flag)"
**Location:** Server Room - Drop-Site Terminal
**Requirements:**
- Completed VM challenge: SSH brute force using Hydra
- Password list derived from Kevin's hints + decoded whiteboard
**Interaction:** Flag submission at drop-site terminal
**Completion:** Ink tag `#complete_task:submit_ssh_flag`
**Unlocks:** `intercept_comms` aim, VM credentials for deeper access

**Educational Value:**
- SSH brute force with Hydra (guided by Agent 0x99)
- Using socially engineered password patterns (Kevin: "ViralDynamics2025")
- Correlation: Physical intel (passwords hints) → Digital exploitation

**Hybrid Integration:**
Social engineering (Kevin) → Password patterns → SSH brute force (VM) → Flag submission (in-game)

---

### Aim 2.2: Intercept ENTROPY Communications

**ID:** `intercept_comms`
**Description:** "Intercept and decode ENTROPY operational communications"
**Status:** Locked (unlocks after `submit_ssh_flag`)
**Unlock Condition:** Successfully brute-forced SSH access

**Purpose:** Deep digital investigation - Linux navigation and flag collection

---

#### Task: Navigate Linux File System

**ID:** `linux_navigation`
**Type:** VM Challenge
**Description:** "Navigate victim user's file system and locate flags"
**Location:** VM (accessed from Server Room terminal)
**Requirements:** SSH access (from previous task)
**Completion:** Ink tag `#complete_task:linux_navigation` (after finding first flag in home directory)
**Unlocks:** `submit_navigation_flag`

**Educational Value:**
- Linux commands: `ls`, `cd`, `cat`, `pwd`
- File system structure (home directories, hidden files)
- Agent 0x99 tutorial via phone chat

---

#### Task: Submit Navigation Flag

**ID:** `submit_navigation_flag`
**Type:** VM Flag Submission
**Description:** "Submit flag found in victim's home directory"
**Location:** Server Room - Drop-Site Terminal
**Requirements:** Found flag in VM
**Completion:** Ink tag `#complete_task:submit_navigation_flag`
**Unlocks:** `privilege_escalation` task

---

#### Task: Escalate Privileges

**ID:** `privilege_escalation`
**Type:** VM Challenge
**Description:** "Use sudo to access bystander account for additional flags"
**Location:** VM
**Requirements:** Discovered sudo access (agent guides)
**Completion:** Ink tag `#complete_task:privilege_escalation` (after using `sudo -u bystander bash`)
**Unlocks:** `submit_sudo_flag`

**Educational Value:**
- Privilege escalation concept (`sudo`)
- Accessing other user accounts
- Finding flags in bystander home directory

---

#### Task: Submit Sudo Flag

**ID:** `submit_sudo_flag`
**Type:** VM Flag Submission
**Description:** "Submit flag from bystander's account"
**Location:** Server Room - Drop-Site Terminal
**Requirements:** Flag from bystander account
**Completion:** Ink tag `#complete_task:submit_sudo_flag`
**Unlocks:** `gather_physical_evidence` aim

**Hybrid Result:**
Submitted flags unlock intelligence revealing Derek's role and campaign coordination with Zero Day Syndicate

---

### Aim 2.3: Gather Physical Evidence

**ID:** `gather_physical_evidence`
**Description:** "Collect physical evidence from locked offices"
**Status:** Locked (unlocks after VM intelligence gathered)
**Unlock Condition:** After `submit_sudo_flag`

**Purpose:** Physical investigation - lockpicking, evidence collection, backtracking

---

#### Task: Access Derek's Filing Cabinet

**ID:** `access_derek_filing`
**Type:** In-Game (lockpicking + evidence)
**Description:** "Pick Derek's filing cabinet lock and search contents"
**Location:** Derek's Office
**Requirements:** Lockpicking skill, access to Derek's office
**Interaction:** Lockpick filing cabinet, examine contents
**Completion:** Ink tag `#complete_task:access_derek_filing`
**Unlocks:** Campaign materials evidence, `fabricated_photos` item

**Backtracking:**
Player already visited Derek's office earlier (whiteboard). Now returns with lockpicking skill to access filing cabinet.

---

#### Task: Photograph Campaign Materials

**ID:** `photograph_evidence`
**Type:** In-Game (evidence collection)
**Description:** "Document fabricated photos and psychological profiles"
**Location:** Derek's Office (filing cabinet contents)
**Requirements:** Filing cabinet opened
**Interaction:** Use phone camera on documents
**Completion:** Ink tag `#complete_task:photograph_evidence`
**Unlocks:** Evidence for confrontation, `correlate_evidence` aim

---

### Aim 2.4: Correlate Evidence

**ID:** `correlate_evidence`
**Description:** "Connect physical evidence with digital intelligence"
**Status:** Locked (unlocks after gathering both types)
**Unlock Condition:** After `photograph_evidence` AND `submit_sudo_flag`

**Purpose:** Synthesis task requiring both VM and in-game evidence

---

#### Task: Match Campaign Timeline

**ID:** `match_timeline`
**Type:** Correlation (VM + In-Game)
**Description:** "Match whiteboard timeline with intercepted communications"
**Location:** Conference Room (whiteboard) + Evidence Review
**Requirements:**
- Decoded whiteboard message (in-game)
- Intercepted communications from VM flags
- Campaign materials from filing cabinet
**Interaction:** Evidence correlation interface OR Agent 0x99 dialogue
**Completion:** Ink tag `#complete_task:match_timeline`
**Unlocks:** `identify_operatives` task

**Educational Value:**
- Correlation of multiple evidence sources
- Timeline analysis
- Pattern recognition

**Hybrid Synthesis:**
- Whiteboard (in-game) shows dates
- VM communications show coordination messages
- Physical documents show campaign targets
- **Synthesis:** Proves coordinated ENTROPY operation

---

#### Task: Identify ENTROPY Operatives

**ID:** `identify_operatives`
**Type:** Correlation (synthesis)
**Description:** "Identify which employees are Social Fabric operatives"
**Location:** Evidence review + Maya's intel
**Requirements:** All evidence gathered, optionally consulted Maya
**Completion:** Ink tag `#complete_task:identify_operatives`
**Unlocks:** Act 3 begins - `confront_entropy` aim

**Result:**
- Derek Lawson (primary operative)
- 2-3 accomplices identified
- Most employees confirmed innocent
- Ready for confrontation

---

## Act 2 Complete: Transition to Act 3

**Completion Trigger:** `identify_operatives` complete
**Effect:** Confrontation objectives appear
**Player State:** Has complete evidence, knows who ENTROPY operatives are

---

### Aim 3.1: Confront ENTROPY

**ID:** `confront_entropy`
**Description:** "Confront Derek Lawson and stop the campaign"
**Status:** Locked (unlocks after identifying operatives)
**Unlock Condition:** After `identify_operatives`

**Purpose:** Climactic confrontation with branching choices

---

#### Task: Choose Confrontation Method

**ID:** `choose_confrontation`
**Type:** In-Game (narrative choice)
**Description:** "Decide how to confront Derek Lawson"
**Location:** Player choice (Derek's office / Conference room / Silent extraction)
**Requirements:** Evidence gathered
**Interaction:** Dialogue choice
**Completion:** Ink tag `#complete_task:choose_confrontation` (branch selected)
**Unlocks:** Branch-specific tasks

**Branches:**
- Direct Confrontation → `confront_direct`
- Silent Extraction → `extract_silent`
- Trap with Maya → `set_trap`

**Note:** This is a **choice point** - player selects ONE path

---

#### Task: Direct Confrontation (Branch A)

**ID:** `confront_direct`
**Type:** In-Game (confrontation)
**Description:** "Face Derek with evidence and force admission"
**Location:** Derek's Office or player's choice
**Requirements:** Chose direct confrontation
**Interaction:** Dialogue scene with Derek
**Completion:** Ink tag `#complete_task:confront_direct`
**Unlocks:** `secure_evidence_direct`, Derek escapes (narrative)

**Outcome:** Philosophical dialogue, Derek escapes, evidence secured

---

#### Task: Silent Extraction (Branch B)

**ID:** `extract_silent`
**Type:** In-Game (stealth)
**Description:** "Exfiltrate with evidence without alerting ENTROPY"
**Location:** Office exit path
**Requirements:** Chose silent extraction
**Interaction:** Stealth navigation OR simple exit
**Completion:** Ink tag `#complete_task:extract_silent`
**Unlocks:** `secure_evidence_silent`

**Outcome:** Clean extraction, Derek arrested externally later

---

#### Task: Set Trap with Maya (Branch C)

**ID:** `set_trap`
**Type:** In-Game (collaborative confrontation)
**Description:** "Coordinate with Maya for public exposure"
**Location:** Conference Room
**Requirements:** Chose trap, high Maya trust
**Interaction:** Conference room scene with NPCs
**Completion:** Ink tag `#complete_task:set_trap`
**Unlocks:** `secure_evidence_trap`, Maya exposed publicly

**Outcome:** Dramatic public confrontation, Derek escapes, Maya's identity public

---

### Aim 3.2: Final Resolution

**ID:** `final_resolution`
**Description:** "Decide the fate of Viral Dynamics and complete mission"
**Status:** Locked (unlocks after confrontation branch)
**Unlock Condition:** After any confrontation task completes

**Purpose:** Final moral choice determining organization fate

---

#### Task: Choose Resolution Strategy

**ID:** `choose_resolution`
**Type:** In-Game (moral choice)
**Description:** "Determine what happens to Viral Dynamics Media"
**Location:** Secure location after confrontation
**Requirements:** Confrontation complete, evidence secured
**Interaction:** Phone call with Agent 0x99 presenting options
**Completion:** Ink tag `#complete_task:choose_resolution` (after choice)
**Unlocks:** Branch-specific endings

**Choices:**
- Surgical Strike → `resolution_surgical`
- Full Exposure → `resolution_exposure`
- Controlled Burn → `resolution_controlled`

---

#### Task: Execute Resolution (Branch Selected)

**ID:** `execute_resolution`
**Type:** In-Game (narrative)
**Description:** "Implement chosen resolution strategy"
**Location:** Varies by choice
**Requirements:** Resolution chosen
**Completion:** Automatic (narrative outcome)
**Unlocks:** Mission complete, debrief

**Outcomes vary by choice but all complete primary objective**

---

## Act 3 Complete: Mission Success

**Completion:** Any resolution path completes the mission
**Result:** Debrief with Agent 0x99 reflecting player choices

---

## Optional Objective: Collect LORE Fragments

**ID:** `collect_lore`
**Description:** "Discover LORE fragments about Social Fabric and The Architect"
**Status:** Active (from Act 2)
**Optional:** True

**Purpose:** Reward exploration and provide world-building

---

### Aim: Find All LORE Fragments

**ID:** `find_all_lore`
**Description:** "Locate all 5 LORE fragments in the office"
**Status:** Active

---

#### LORE Fragment 1: Social Fabric Manifesto

**ID:** `lore_fragment_1`
**Type:** In-Game (collectible)
**Description:** "Find the Social Fabric philosophy document"
**Location:** Derek's Office - locked desk drawer
**Requirements:** Access Derek's office, lockpick desk
**Completion:** Ink tag `#complete_task:lore_fragment_1`
**Reward:** Understanding of Social Fabric ideology

---

#### LORE Fragment 2: The Architect's Timeline

**ID:** `lore_fragment_2`
**Type:** In-Game (collectible)
**Description:** "Discover encoded reference to The Architect"
**Location:** Derek's computer (encrypted email)
**Requirements:** Decode Base64 email fragment
**Completion:** Ink tag `#complete_task:lore_fragment_2`
**Reward:** First mention of The Architect (campaign arc)

---

#### LORE Fragment 3: Cassandra Vox Profile

**ID:** `lore_fragment_3`
**Type:** In-Game (collectible)
**Description:** "Find background on Social Fabric cell leader"
**Location:** Filing cabinet (hidden folder)
**Requirements:** Access Derek's filing cabinet
**Completion:** Ink tag `#complete_task:lore_fragment_3`
**Reward:** Social Fabric leadership intel

---

#### LORE Fragment 4: Viral Dynamics Founding

**ID:** `lore_fragment_4`
**Type:** In-Game (collectible)
**Description:** "Company history document"
**Location:** Reception area filing cabinet
**Requirements:** Lockpicking OR receptionist trust
**Completion:** Ink tag `#complete_task:lore_fragment_4`
**Reward:** Context on legitimate vs. ENTROPY

---

#### LORE Fragment 5: Psychological Targeting Database

**ID:** `lore_fragment_5`
**Type:** VM Flag (special)
**Description:** "Intercept disinformation methodology documentation"
**Location:** VM - hidden directory
**Requirements:** Advanced Linux navigation
**Completion:** Ink tag `#complete_task:lore_fragment_5`
**Reward:** Understanding of Social Fabric tactics

---

## Success and Failure States

### Complete Success (100%)

**Criteria:**
- ✓ All primary objectives completed
- ✓ All aims completed
- ✓ 4-5 LORE fragments collected
- ✓ Maya Chen protected (if chose protective paths)
- ✓ Derek confronted (any method)
- ✓ Resolution executed (any choice)

---

### Good Success (80%)

**Criteria:**
- ✓ All primary objectives completed
- ✓ Most aims completed
- ✓ 2-3 LORE fragments collected
- ✓ Evidence secured
- ✓ ENTROPY operation disrupted

---

### Minimal Success (60%)

**Criteria:**
- ✓ Primary objective completed
- ✓ Core aims completed (identify targets, intercept comms)
- ✓ Evidence gathered (even if incomplete)
- ✓ Mission technically complete

---

### Failure States

**Mission Cannot Permanently Fail**
- Player can retry technical challenges (lockpicking, VM tasks)
- Choices affect outcomes but all paths lead to completion
- Educational objectives must be met (VM challenges required)

**Soft Failures:**
- Alert Derek too early → He's more cautious but mission proceeds
- Fail to protect Maya → She's exposed but mission proceeds
- Incomplete evidence → Partial success acknowledged in debrief

---

## Objective Progression Flow

```
START: Enter Office
  ↓
Act 1 Tutorial (15-20 min)
  └─ Meet NPCs (Sarah, Kevin, Maya)
  └─ Lockpicking tutorial (storage closet)
  └─ Gain server room access
  ↓
Act 2 Investigation (25-30 min)
  ├─ Decode whiteboard (Derek's office) ← Backtracking
  ├─ Social engineering (password hints)
  ├─ VM: SSH brute force → Submit flag
  ├─ VM: Linux navigation → Submit flags
  ├─ Physical evidence (filing cabinet) ← Backtracking
  └─ Correlate all evidence → Identify operatives
  ↓
Act 3 Confrontation (10-15 min)
  ├─ Choice: Confrontation method
  │   ├─ Direct → Philosophical dialogue
  │   ├─ Silent → Clean extraction
  │   └─ Trap → Public exposure
  ↓
  └─ Choice: Resolution strategy
      ├─ Surgical Strike → Precision
      ├─ Full Exposure → Maximum disruption
      └─ Controlled Burn → Balance
  ↓
COMPLETE: Debrief with Agent 0x99
```

**Key Backtracking Moments:**
1. **Storage Closet → Derek's Office:** Get spare keys, return to previously locked office
2. **Derek's Office (whiteboard) → Derek's Office (filing cabinet):** Decode message first, return later to lockpick cabinet
3. **Server Room → Derek's Office:** VM intel reveals what to look for physically

---

## Objectives-to-World Mapping

*(This section maps each task to specific rooms - will be detailed in Stage 5: Room Layout)*

### Objective: Main Mission

#### Aim: Establish Presence

**Task: Enter Office** (`enter_office`)
- **Room:** `reception_area`
- **Interaction:** Automatic (spawn location)
- **Completion:** Automatic on spawn

**Task: Meet Reception** (`meet_reception`)
- **Room:** `reception_area`
- **Interaction:** Talk to Sarah (NPC)
- **Completion:** Ink tag from dialogue

**Task: Explore Office** (`explore_office`)
- **Room:** `main_office`, `break_room`
- **Interaction:** Visit multiple rooms
- **Completion:** Ink tag after visiting 2+ rooms

#### Aim: Meet Kevin

**Task: Talk to Kevin** (`talk_to_kevin`)
- **Room:** `main_office` (near server room door)
- **Interaction:** Talk to Kevin (NPC)
- **Completion:** Ink tag from dialogue

#### Aim: Tutorial Skills

**Task: Lockpick Tutorial** (`lockpick_tutorial`)
- **Room:** `storage_closet`
- **Interaction:** Lockpick minigame on practice safe
- **Completion:** Ink tag when safe opened

**Task: Server Room Access** (`server_room_access`)
- **Room:** `server_room`
- **Interaction:** Enter room (Kevin grants access)
- **Completion:** Automatic on entry

#### Aim: Identify Targets

**Task: Decode Whiteboard** (`decode_whiteboard`)
- **Room:** `derek_office` (locked initially)
- **Interaction:** Examine whiteboard → CyberChef terminal
- **Completion:** Ink tag from CyberChef success

**Task: Access Maya's Computer** (`access_maya_computer`)
- **Room:** `main_office` (Maya's desk)
- **Interaction:** Computer password entry
- **Completion:** Ink tag on successful login

**Task: Submit SSH Flag** (`submit_ssh_flag`)
- **Room:** `server_room` (drop-site terminal)
- **Interaction:** Flag submission terminal
- **Completion:** Ink tag from terminal

#### Aim: Intercept Communications

**Task: Linux Navigation** (`linux_navigation`)
- **Room:** `server_room` (VM access terminal)
- **Interaction:** VM terminal, Linux commands
- **Completion:** Ink tag after finding flag

**Task: Submit Navigation Flag** (`submit_navigation_flag`)
- **Room:** `server_room` (drop-site terminal)
- **Interaction:** Flag submission
- **Completion:** Ink tag from terminal

**Task: Privilege Escalation** (`privilege_escalation`)
- **Room:** `server_room` (VM terminal)
- **Interaction:** VM, sudo commands
- **Completion:** Ink tag after accessing bystander

**Task: Submit Sudo Flag** (`submit_sudo_flag`)
- **Room:** `server_room` (drop-site terminal)
- **Interaction:** Flag submission
- **Completion:** Ink tag from terminal

#### Aim: Gather Physical Evidence

**Task: Access Derek's Filing** (`access_derek_filing`)
- **Room:** `derek_office`
- **Interaction:** Lockpick filing cabinet
- **Completion:** Ink tag when opened

**Task: Photograph Evidence** (`photograph_evidence`)
- **Room:** `derek_office`
- **Interaction:** Phone camera on documents
- **Completion:** Ink tag after photos taken

#### Aim: Correlate Evidence

**Task: Match Timeline** (`match_timeline`)
- **Room:** `conference_room` OR evidence review interface
- **Interaction:** Evidence correlation dialogue/interface
- **Completion:** Ink tag from correlation success

**Task: Identify Operatives** (`identify_operatives`)
- **Room:** Anywhere (dialogue with Agent 0x99)
- **Interaction:** Phone call or evidence summary
- **Completion:** Ink tag after identification

#### Aim: Confront ENTROPY

**Task: Choose Confrontation** (`choose_confrontation`)
- **Room:** Varies by player location
- **Interaction:** Dialogue choice
- **Completion:** Ink tag from choice

**Tasks: Confrontation Branches** (`confront_direct`, `extract_silent`, `set_trap`)
- **Room:** Varies by branch
- **Interaction:** Scene-specific
- **Completion:** Ink tags from branch completion

#### Aim: Final Resolution

**Task: Choose Resolution** (`choose_resolution`)
- **Room:** Secure location (or phone call)
- **Interaction:** Agent 0x99 phone dialogue
- **Completion:** Ink tag from choice

**Task: Execute Resolution** (`execute_resolution`)
- **Room:** Narrative (varies)
- **Interaction:** Automatic outcome
- **Completion:** Mission complete

---

## Objectives JSON Structure

```json
{
  "objectives": [
    {
      "id": "main_mission",
      "title": "Investigate Social Fabric Operations",
      "description": "Gather intelligence on Social Fabric's disinformation campaign",
      "status": "active",
      "aims": [
        {
          "id": "establish_presence",
          "title": "Establish Presence",
          "description": "Establish your cover and initial access",
          "status": "active",
          "tasks": [
            {
              "id": "enter_office",
              "title": "Enter Viral Dynamics Office",
              "status": "active"
            },
            {
              "id": "meet_reception",
              "title": "Check in with receptionist",
              "status": "locked"
            },
            {
              "id": "explore_office",
              "title": "Explore public office areas",
              "status": "locked"
            }
          ]
        },
        {
          "id": "meet_kevin_aim",
          "title": "Meet IT Manager",
          "description": "Gain Kevin's trust and access to systems",
          "status": "locked",
          "tasks": [
            {
              "id": "talk_to_kevin",
              "title": "Talk to IT Manager Kevin",
              "status": "locked"
            }
          ]
        },
        {
          "id": "tutorial_skills",
          "title": "Learn Basic Skills",
          "description": "Learn essential investigation skills",
          "status": "locked",
          "tasks": [
            {
              "id": "lockpick_tutorial",
              "title": "Practice lockpicking on storage closet safe",
              "status": "locked"
            },
            {
              "id": "server_room_access",
              "title": "Enter the server room",
              "status": "locked"
            }
          ]
        },
        {
          "id": "identify_targets",
          "title": "Identify Disinformation Targets",
          "description": "Identify Social Fabric's disinformation campaign targets",
          "status": "locked",
          "tasks": [
            {
              "id": "decode_whiteboard",
              "title": "Decode Base64 message on whiteboard",
              "status": "locked"
            },
            {
              "id": "access_maya_computer",
              "title": "Access Maya Chen's computer",
              "status": "locked"
            },
            {
              "id": "submit_ssh_flag",
              "title": "Submit SSH access flag",
              "status": "locked"
            }
          ]
        },
        {
          "id": "intercept_comms",
          "title": "Intercept ENTROPY Communications",
          "description": "Intercept and decode ENTROPY operational communications",
          "status": "locked",
          "tasks": [
            {
              "id": "linux_navigation",
              "title": "Navigate Linux file system",
              "status": "locked"
            },
            {
              "id": "submit_navigation_flag",
              "title": "Submit navigation flag",
              "status": "locked"
            },
            {
              "id": "privilege_escalation",
              "title": "Escalate privileges with sudo",
              "status": "locked"
            },
            {
              "id": "submit_sudo_flag",
              "title": "Submit sudo flag",
              "status": "locked"
            }
          ]
        },
        {
          "id": "gather_physical_evidence",
          "title": "Gather Physical Evidence",
          "description": "Collect physical evidence from locked offices",
          "status": "locked",
          "tasks": [
            {
              "id": "access_derek_filing",
              "title": "Access Derek's filing cabinet",
              "status": "locked"
            },
            {
              "id": "photograph_evidence",
              "title": "Photograph campaign materials",
              "status": "locked"
            }
          ]
        },
        {
          "id": "correlate_evidence",
          "title": "Correlate Evidence",
          "description": "Connect physical evidence with digital intelligence",
          "status": "locked",
          "tasks": [
            {
              "id": "match_timeline",
              "title": "Match campaign timeline across sources",
              "status": "locked"
            },
            {
              "id": "identify_operatives",
              "title": "Identify ENTROPY operatives",
              "status": "locked"
            }
          ]
        },
        {
          "id": "confront_entropy",
          "title": "Confront ENTROPY",
          "description": "Confront Derek Lawson and stop the campaign",
          "status": "locked",
          "tasks": [
            {
              "id": "choose_confrontation",
              "title": "Choose confrontation method",
              "status": "locked"
            }
          ]
        },
        {
          "id": "final_resolution",
          "title": "Final Resolution",
          "description": "Decide the fate of Viral Dynamics and complete mission",
          "status": "locked",
          "tasks": [
            {
              "id": "choose_resolution",
              "title": "Choose resolution strategy",
              "status": "locked"
            },
            {
              "id": "execute_resolution",
              "title": "Execute resolution",
              "status": "locked"
            }
          ]
        }
      ]
    },
    {
      "id": "collect_lore",
      "title": "Collect LORE Fragments",
      "description": "Discover LORE fragments about Social Fabric and The Architect",
      "optional": true,
      "status": "locked",
      "aims": [
        {
          "id": "find_all_lore",
          "title": "Find All LORE Fragments",
          "description": "Locate all 5 LORE fragments in the office",
          "status": "locked",
          "tasks": [
            {
              "id": "lore_fragment_1",
              "title": "Social Fabric Manifesto",
              "status": "locked"
            },
            {
              "id": "lore_fragment_2",
              "title": "The Architect's Timeline",
              "status": "locked"
            },
            {
              "id": "lore_fragment_3",
              "title": "Cassandra Vox Profile",
              "status": "locked"
            },
            {
              "id": "lore_fragment_4",
              "title": "Viral Dynamics Founding",
              "status": "locked"
            },
            {
              "id": "lore_fragment_5",
              "title": "Psychological Targeting Database",
              "status": "locked"
            }
          ]
        }
      ]
    }
  ]
}
```

---

## Design Notes

### Hybrid Integration Strategy

**Physical → Digital Workflow:**
1. Social engineering (Kevin) provides password patterns
2. Physical investigation (whiteboard) provides encoded intel
3. Digital exploitation (VM) uses gathered intel for brute force
4. Physical evidence (filing cabinet) correlates with digital findings

**Progressive Complexity:**
- Act 1: Tutorial-level challenges
- Act 2: Intermediate challenges requiring synthesis
- Act 3: Narrative choices (no fail states)

### Pacing

**Act 1 (15-20 min):** Slow, tutorial-focused, no timer pressure
**Act 2 (25-30 min):** Accelerating discovery, backtracking creates rhythm
**Act 3 (10-15 min):** Climactic but not timed, player controls pace

### Player Guidance

**From Act 2 Onwards:** Objectives clearly displayed in UI
**Hints:** Agent 0x99 provides context via phone chat
**Backtracking Clarity:** Unlocking objectives reminds player to return ("Return to Derek's office to search the filing cabinet")

### Edge Cases

**Out of Order Completion:**
- If player somehow accesses Derek's office before tutorial: Safe still locked until lockpicking learned
- If player finds evidence before VM: Correlation task waits for both sources

**Failure Recovery:**
- VM challenges can be retried with Agent 0x99 guidance
- Lockpicking can be retried unlimited times
- Choices cannot be "failed" - all paths complete mission

---

**Stage 4: Player Objectives Complete**

**Deliverables:**
- ✅ Complete objectives hierarchy (objectives → aims → tasks)
- ✅ Hybrid architecture integration (VM + in-game)
- ✅ Progressive unlocking with backtracking design
- ✅ Objectives-to-world mapping (preliminary)
- ✅ JSON structure ready for implementation

**Ready for:** Stage 5 (Room Layout Design) to map these objectives to physical spaces

**Critical for Stage 5:**
- Room requirements identified (reception, main office, server room, Derek's office, storage closet, conference room, break room)
- Terminal locations specified (VM access, drop-site, CyberChef)
- NPC positions indicated (Sarah, Kevin, Maya, Derek)
- Container requirements listed (safes, filing cabinets, desks)
