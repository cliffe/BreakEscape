# Stage 4: Player Objectives and Tasks - Mission 2 "Ransomed Trust"

**Mission ID:** m02_ransomed_trust
**Created:** 2025-12-20
**Status:** Stage 4 Complete

---

## Objectives System Structure

**Hierarchy:** Mission Objective → Aims → Tasks

- **Mission Objective:** High-level goal (1 per mission)
- **Aims:** Thematic groupings of related tasks (3-5 per mission)
- **Tasks:** Specific actions player completes (15-25 per mission)

**Completion Tracking:** Tasks use Ink tags (#complete_task:id, #unlock_task:id)

---

## Mission Objective: Recover Hospital Systems

**ID:** `recover_hospital_systems`
**Description:** "Recover decryption keys and restore St. Catherine's Hospital patient records before backup power fails."

**Success Criteria:**
- **Minimal (60%):** Recover both digital and physical keys, make ransom decision
- **Standard (80%):** Complete all VM challenges, all core in-game challenges, both moral choices
- **Perfect (100%):** All VM flags, all LORE fragments, Marcus protected, never detected by guards

---

## Aim 1: Infiltrate Hospital

**ID:** `infiltrate_hospital`
**Unlocked:** Mission start
**Description:** "Gain access to St. Catherine's Hospital IT infrastructure under cover as security consultant."

### Tasks

#### Task 1.1: Arrive at Hospital Reception
**ID:** `arrive_at_hospital`
**Unlock Condition:** Mission start (automatically unlocked)
**Completion Trigger:** Enter hospital lobby area
**Ink Tag:** `#complete_task:arrive_at_hospital`
**Description:** "Enter St. Catherine's Hospital under cover as external security consultant."

---

#### Task 1.2: Meet Dr. Sarah Kim (CTO)
**ID:** `meet_dr_kim`
**Unlock Condition:** Task 1.1 complete
**Completion Trigger:** Complete first dialogue with Dr. Kim
**Ink Tag:** `#complete_task:meet_dr_kim`
**Description:** "Speak with Hospital CTO to understand the crisis and obtain authorization."

---

#### Task 1.3: Meet Marcus Webb (IT Admin)
**ID:** `talk_to_marcus`
**Unlock Condition:** Task 1.2 complete
**Completion Trigger:** Complete first dialogue with Marcus
**Ink Tag:** `#complete_task:talk_to_marcus`
**Description:** "Interview IT administrator about the ransomware attack."

---

#### Task 1.4: Learn Guard Patrol Pattern
**ID:** `learn_guard_patrol`
**Unlock Condition:** Task 1.3 complete
**Completion Trigger:** Observe full 60-second guard patrol route
**Ink Tag:** `#complete_task:learn_guard_patrol`
**Description:** "Observe security guard patrol route. Tutorial for stealth mechanics."

**Tutorial Integration:** Agent 0x99 explains timing-based stealth on first encounter

---

## Aim 2: Access IT Infrastructure

**ID:** `access_it_systems`
**Unlocked:** After Task 1.2 (Dr. Kim grants access)
**Description:** "Gain access to hospital's IT department and server room."

### Tasks

#### Task 2.1: Find Password Hints
**ID:** `find_password_hints`
**Unlock Condition:** Aim 2 unlocked
**Completion Trigger:** Read Marcus's sticky notes OR high-trust dialogue with Marcus
**Ink Tag:** `#complete_task:find_password_hints`
**Description:** "Gather password patterns for SSH access (social engineering or investigation)."

**Sources:**
- Marcus dialogue (if high trust): "Emma2018, Hospital1987, StCatherines"
- Sticky notes in IT office (lockpicking required)
- Photo on Marcus's desk: "Emma - 7th birthday! 05/17/2018"

---

#### Task 2.2: Decode Ransomware Note
**ID:** `decode_ransomware_note`
**Unlock Condition:** Find infected terminal in IT office
**Completion Trigger:** Use CyberChef to decode Base64 message
**Ink Tag:** `#complete_task:decode_ransomware_note`
**Description:** "Decode Base64-encoded ransomware message using CyberChef workstation."

**Educational Objective:** Reinforce Base64 from M1, teach obfuscation concepts

**Encoded Message:**
```
WU9VUiBQQVRJRU5UIFJFQ09SRFMgQVJFIEVOQ1JZUFRFRC4gNDcgUEFUSUVOVFMgT04gTElGRSBTVVBQT1JULiAxMiBIT1VSUyBPRiBCQUNLVVAgUE9XRVIuIFBBWSAyLjUgQlRDIFRPIFtXQUxMRVRdIE9SIFdBVENIIFRIRU0gRElFLiAtIFJBTlNPTVdBUkUgSU5DT1JQT1JBVEVE
```

---

#### Task 2.3: Access Server Room
**ID:** `access_server_room`
**Unlock Condition:** Task 2.1 complete
**Completion Trigger:** Enter server room (keycard or lockpicking)
**Ink Tag:** `#complete_task:access_server_room`
**Description:** "Gain entry to hospital server room."

**Methods:**
- **High Trust:** Marcus gives keycard (skip lockpicking)
- **Medium/Low Trust:** Lockpick server room door

---

## Aim 3: Exploit ENTROPY's Backdoor (VM Challenges)

**ID:** `exploit_entropy_backdoor`
**Unlocked:** After Task 2.3 (server room access)
**Description:** "Use ENTROPY's own ProFTPD backdoor to access encrypted backups."

### Tasks

#### Task 3.1: Submit SSH Access Flag
**ID:** `submit_ssh_flag`
**Unlock Condition:** Access VM terminal in server room
**Completion Trigger:** Submit `flag{ssh_access_granted}` at drop-site terminal
**Ink Tag:** `#complete_task:submit_ssh_flag`
**Description:** "Gain SSH access to backup server using password hints."

**VM Challenge:** SSH brute force with Hydra or manual attempts
**Flag Representation:** "Intercepted ENTROPY server credentials"

---

#### Task 3.2: Submit ProFTPD Exploit Flag
**ID:** `submit_exploit_flag`
**Unlock Condition:** Task 3.1 complete
**Completion Trigger:** Submit `flag{proftpd_backdoor_exploited}` at drop-site terminal
**Ink Tag:** `#complete_task:submit_exploit_flag`
**Description:** "Exploit ProFTPD backdoor (CVE-2010-4652) to gain shell access."

**VM Challenge:** Trigger ProFTPD 1.3.5 backdoor vulnerability
**Flag Representation:** "Exploited ENTROPY's entry point"
**Educational Objective:** Service exploitation, CVE research

---

#### Task 3.3: Locate Encrypted Database Backups
**ID:** `locate_backups`
**Unlock Condition:** Task 3.2 complete
**Completion Trigger:** Navigate to /var/backups, find *.enc files
**Ink Tag:** `#complete_task:locate_backups`
**Description:** "Navigate Linux filesystem to locate encrypted patient database backups."

**VM Challenge:** Use cd, ls, cat commands to find encrypted files
**Educational Objective:** Linux navigation, file permissions

---

#### Task 3.4: Submit Database Backup Flag
**ID:** `submit_backup_flag`
**Unlock Condition:** Task 3.3 complete
**Completion Trigger:** Submit `flag{database_backup_located}` at drop-site terminal
**Ink Tag:** `#complete_task:submit_backup_flag`
**Description:** "Submit flag confirming encrypted database location."

**Unlock Result:** Intel about offline backup keys location

---

## Aim 4: Recover Offline Backup Keys

**ID:** `find_offline_backup_keys`
**Unlocked:** After Task 3.4 (drop-site reveals safe location)
**Description:** "Find physical backup encryption keys stored in hospital safe."

### Tasks

#### Task 4.1: Find Safe Location
**ID:** `find_safe_location`
**Unlock Condition:** Agent 0x99 hint: "Check emergency equipment storage, administrative wing"
**Completion Trigger:** Discover safe in emergency equipment storage
**Ink Tag:** `#complete_task:find_safe_location`
**Description:** "Navigate to emergency equipment storage, locate PIN-locked safe."

**Stealth Challenge:** Must navigate past patrolling guard

---

#### Task 4.2: Gather PIN Clues
**ID:** `gather_pin_clues`
**Unlock Condition:** Task 4.1 complete
**Completion Trigger:** Find 2+ PIN clues
**Ink Tag:** `#complete_task:gather_pin_clues`
**Description:** "Investigate hospital for clues to 4-digit safe PIN."

**Clue Locations:**
- Hospital lobby plaque: "Founded 1987" (correct answer)
- Marcus's desk photo: "Emma 05/17/2018" (red herring)
- Dr. Kim's sticky note: "Safe combination: founding year" (confirmation)

---

#### Task 4.3: Crack PIN Safe
**ID:** `crack_safe_pin`
**Unlock Condition:** Task 4.2 complete
**Completion Trigger:** Enter correct PIN (1987) OR use PIN cracker device
**Ink Tag:** `#complete_task:crack_safe_pin`
**Ink Tag (Item):** `#give_item:offline_backup_key`
**Description:** "Crack 4-digit PIN safe to retrieve offline backup encryption keys."

**Solution:** PIN = 1987 (hospital founding year)
**Fallback:** PIN cracker device (brute force, 2 minutes)

---

#### Task 4.4: Decode Recovery Instructions
**ID:** `decode_recovery_instructions`
**Unlock Condition:** Task 4.3 complete
**Completion Trigger:** Decode ROT13 message using CyberChef
**Ink Tag:** `#complete_task:decode_recovery_instructions`
**Description:** "Decode ROT13-encoded recovery instructions from Ghost."

**Educational Objective:** NEW - Introduce Caesar cipher (ROT13)

**Encoded Message:**
```
SHYY ERPBIREL ERDHERRF BSSYVAR + BAYVAR XRLF—12-UBHE CEBPRFF VS ZNAHNY, VAFGNAG VS ENAFBZ CNVQ.
```

**Decoded:**
```
FULL RECOVERY REQUIRES OFFLINE + ONLINE KEYS—12-HOUR PROCESS IF MANUAL, INSTANT IF RANSOM PAID.
```

---

## Aim 5: Make Critical Decisions

**ID:** `make_critical_decisions`
**Unlocked:** After Aim 3 and Aim 4 complete (all keys recovered)
**Description:** "Make ethical decisions about ransom payment, hospital exposure, and Marcus's fate."

### Tasks

#### Task 5.1: Decide Marcus's Fate (Mid-Mission)
**ID:** `decide_marcus_fate`
**Unlock Condition:** Find scapegoating email in administrative office
**Completion Trigger:** Choose to warn/plant evidence/ignore
**Ink Tag:** `#complete_task:decide_marcus_fate`
**Description:** "Intervene to protect Marcus from scapegoating, or focus on mission."

**Tracked Variable:** `marcus_protected` (true/false)

---

#### Task 5.2: Make Ransom Decision
**ID:** `make_ransom_decision`
**Unlock Condition:** Both Aim 3 and Aim 4 complete
**Completion Trigger:** Recommend payment or independent recovery
**Ink Tag:** `#complete_task:make_ransom_decision`
**Description:** "Advise Dr. Kim and hospital board on ransom payment."

**Tracked Variables:**
- `ransom_paid` (true/false)
- `patient_deaths` (0 or 2)
- `entropy_funding_amount` (87000 or 0)

---

#### Task 5.3: Decide Hospital Exposure
**ID:** `decide_hospital_exposure`
**Unlock Condition:** Task 5.2 complete
**Completion Trigger:** Choose public exposure or quiet resolution
**Ink Tag:** `#complete_task:decide_hospital_exposure`
**Description:** "Decide whether to expose hospital's security negligence publicly."

**Tracked Variables:**
- `hospital_exposed` (true/false)
- `dr_kim_career_intact` (true/false)
- `sector_wide_improvements` (true/false)

---

## Optional Aim: Uncover LORE Fragments

**ID:** `collect_lore_fragments`
**Unlocked:** Throughout mission (discovery-based)
**Description:** "Discover LORE fragments revealing ENTROPY's operations and philosophy."

### Tasks

#### Task L1: Unlock Ghost's Manifesto
**ID:** `unlock_ghosts_manifesto`
**Unlock Condition:** Find Ghost's operational log in VM (/var/backups/operational_log.txt)
**Completion Trigger:** Read file
**Ink Tag:** `#unlock_lore:ghosts_manifesto`
**Description:** "Discover Ghost's ideological justification for ransomware attack."

**LORE Content:** Ghost's calculated patient death probabilities, "teaching resilience" philosophy

---

#### Task L2: Unlock CryptoSecure Recovery Services Document
**ID:** `unlock_ransomware_inc_lore`
**Unlock Condition:** Lockpick filing cabinet in IT office
**Completion Trigger:** Read document
**Ink Tag:** `#unlock_lore:cryptosecure_services`
**Description:** "Find evidence of Ransomware Inc's legitimate front company."

**LORE Content:** Previous hospital attacks (Operation Triage), Crypto Anarchist payment connection

---

#### Task L3: Unlock Zero Day Syndicate Invoice
**ID:** `unlock_zds_invoice`
**Unlock Condition:** Crack PIN safe in Dr. Kim's office (same PIN: 1987)
**Completion Trigger:** Read invoice document
**Ink Tag:** `#unlock_lore:zds_invoice`
**Description:** "Discover Zero Day Syndicate sold ProFTPD exploit to Ransomware Inc."

**LORE Content:** ZDS-Ransomware Inc coordination, Architect approval, M3 setup

---

## Optional Aim: Perfect Stealth

**ID:** `perfect_stealth`
**Unlocked:** Mission start
**Description:** "Complete mission without being detected by security guards."

### Task

#### Task S1: Never Detected
**ID:** `never_detected`
**Unlock Condition:** Mission start
**Completion Trigger:** Complete mission with zero guard detections
**Ink Tag:** `#unlock_achievement:ghost_hunter`
**Description:** "Navigate entire mission without guard detection."

**Achievement:** "Ghost Hunter" - Perfect stealth bonus

---

## Optional Aim: Confront Ghost

**ID:** `confront_ghost`
**Unlocked:** If player traces Ghost's IP via VM logs (advanced)
**Description:** "Engage in dialogue with Ghost, ENTROPY's operative."

### Task

#### Task G1: Trace Ghost's Communications
**ID:** `trace_ghost`
**Unlock Condition:** Advanced VM analysis (optional)
**Completion Trigger:** Find Ghost's relay IP in logs
**Ink Tag:** `#unlock_aim:confront_ghost`
**Description:** "Trace Ghost's communications to enable confrontation."

---

## Complete Objectives JSON Structure

```json
{
  "mission_objective": {
    "id": "recover_hospital_systems",
    "description": "Recover decryption keys and restore St. Catherine's Hospital patient records before backup power fails.",
    "aims": [
      {
        "id": "infiltrate_hospital",
        "description": "Gain access to St. Catherine's Hospital IT infrastructure.",
        "tasks": [
          {
            "id": "arrive_at_hospital",
            "description": "Enter hospital reception.",
            "completion_trigger": "#complete_task:arrive_at_hospital"
          },
          {
            "id": "meet_dr_kim",
            "description": "Speak with Hospital CTO.",
            "completion_trigger": "#complete_task:meet_dr_kim"
          },
          {
            "id": "talk_to_marcus",
            "description": "Interview IT administrator.",
            "completion_trigger": "#complete_task:talk_to_marcus"
          },
          {
            "id": "learn_guard_patrol",
            "description": "Observe guard patrol pattern (tutorial).",
            "completion_trigger": "#complete_task:learn_guard_patrol"
          }
        ]
      },
      {
        "id": "access_it_systems",
        "description": "Access hospital IT department and server room.",
        "tasks": [
          {
            "id": "find_password_hints",
            "description": "Gather SSH password patterns.",
            "completion_trigger": "#complete_task:find_password_hints"
          },
          {
            "id": "decode_ransomware_note",
            "description": "Decode Base64 ransomware message.",
            "completion_trigger": "#complete_task:decode_ransomware_note"
          },
          {
            "id": "access_server_room",
            "description": "Enter server room (keycard or lockpick).",
            "completion_trigger": "#complete_task:access_server_room"
          }
        ]
      },
      {
        "id": "exploit_entropy_backdoor",
        "description": "Exploit ProFTPD backdoor to access encrypted backups.",
        "tasks": [
          {
            "id": "submit_ssh_flag",
            "description": "Submit SSH access flag.",
            "completion_trigger": "#complete_task:submit_ssh_flag"
          },
          {
            "id": "submit_exploit_flag",
            "description": "Submit ProFTPD exploitation flag.",
            "completion_trigger": "#complete_task:submit_exploit_flag"
          },
          {
            "id": "locate_backups",
            "description": "Navigate filesystem to find encrypted backups.",
            "completion_trigger": "#complete_task:locate_backups"
          },
          {
            "id": "submit_backup_flag",
            "description": "Submit database backup flag.",
            "completion_trigger": "#complete_task:submit_backup_flag"
          }
        ]
      },
      {
        "id": "find_offline_backup_keys",
        "description": "Recover physical backup keys from hospital safe.",
        "tasks": [
          {
            "id": "find_safe_location",
            "description": "Locate PIN-locked safe.",
            "completion_trigger": "#complete_task:find_safe_location"
          },
          {
            "id": "gather_pin_clues",
            "description": "Find clues for 4-digit PIN.",
            "completion_trigger": "#complete_task:gather_pin_clues"
          },
          {
            "id": "crack_safe_pin",
            "description": "Crack safe PIN (1987).",
            "completion_trigger": "#complete_task:crack_safe_pin",
            "item_given": "#give_item:offline_backup_key"
          },
          {
            "id": "decode_recovery_instructions",
            "description": "Decode ROT13 recovery instructions.",
            "completion_trigger": "#complete_task:decode_recovery_instructions"
          }
        ]
      },
      {
        "id": "make_critical_decisions",
        "description": "Make ethical decisions affecting mission outcome.",
        "tasks": [
          {
            "id": "decide_marcus_fate",
            "description": "Intervene for Marcus or ignore.",
            "completion_trigger": "#complete_task:decide_marcus_fate"
          },
          {
            "id": "make_ransom_decision",
            "description": "Recommend ransom payment or independent recovery.",
            "completion_trigger": "#complete_task:make_ransom_decision"
          },
          {
            "id": "decide_hospital_exposure",
            "description": "Choose public exposure or quiet resolution.",
            "completion_trigger": "#complete_task:decide_hospital_exposure"
          }
        ]
      }
    ]
  },
  "optional_aims": [
    {
      "id": "collect_lore_fragments",
      "description": "Discover LORE fragments (3 total).",
      "tasks": [
        {
          "id": "unlock_ghosts_manifesto",
          "description": "Find Ghost's manifesto.",
          "completion_trigger": "#unlock_lore:ghosts_manifesto"
        },
        {
          "id": "unlock_ransomware_inc_lore",
          "description": "Find CryptoSecure Services document.",
          "completion_trigger": "#unlock_lore:cryptosecure_services"
        },
        {
          "id": "unlock_zds_invoice",
          "description": "Find Zero Day Syndicate invoice.",
          "completion_trigger": "#unlock_lore:zds_invoice"
        }
      ]
    },
    {
      "id": "perfect_stealth",
      "description": "Complete mission without guard detection.",
      "tasks": [
        {
          "id": "never_detected",
          "description": "Zero guard detections.",
          "completion_trigger": "#unlock_achievement:ghost_hunter"
        }
      ]
    },
    {
      "id": "confront_ghost",
      "description": "Engage Ghost in dialogue (optional).",
      "tasks": [
        {
          "id": "trace_ghost",
          "description": "Trace communications for confrontation.",
          "completion_trigger": "#unlock_aim:confront_ghost"
        }
      ]
    }
  ]
}
```

---

## Progressive Unlocking Flow

```
Mission Start
  ↓
[Aim 1: Infiltrate Hospital] (unlocked)
  → Task 1.1: Arrive → Task 1.2: Meet Kim → Task 1.3: Meet Marcus → Task 1.4: Guard Tutorial
  ↓
[Aim 2: Access IT Systems] (unlocked after meeting Kim)
  → Task 2.1: Password Hints → Task 2.2: Decode Ransomware → Task 2.3: Server Room Access
  ↓
[Aim 3: Exploit Backdoor] (unlocked after server room access)
  → Task 3.1: SSH Flag → Task 3.2: ProFTPD Flag → Task 3.3: Locate Backups → Task 3.4: Backup Flag
  ↓
[Aim 4: Offline Keys] (unlocked after Task 3.4 flag submission)
  → Task 4.1: Find Safe → Task 4.2: PIN Clues → Task 4.3: Crack Safe → Task 4.4: Decode ROT13
  ↓
[Aim 5: Critical Decisions] (unlocked after Aim 3 + Aim 4 complete)
  → Task 5.1: Marcus Fate (mid-mission) → Task 5.2: Ransom Decision → Task 5.3: Hospital Exposure
  ↓
Mission Complete
```

**No Circular Dependencies:** All unlocks flow forward, player can't be soft-locked

---

## Success Tier Breakdown

### Minimal Success (60% Completion)

**Required Tasks:**
- Aims 1-2: Complete (all infiltration and IT access tasks)
- Aim 3: At least 2 VM flags submitted
- Aim 4: Safe cracked (either clues or device)
- Aim 5: Ransom decision made

**Optional:**
- Guard stealth not required (can be detected)
- Marcus fate choice optional
- LORE fragments optional
- Hospital exposure optional

**Outcome:** Mission complete, basic objectives met

---

### Standard Success (80% Completion)

**Required Tasks:**
- All of Minimal Success
- Aim 3: All 4 VM flags submitted
- Aim 4: All tasks complete (PIN solved via clues preferred)
- Aim 5: Both moral choices made (ransom + exposure)
- At least 1 LORE fragment discovered

**Optional:**
- Perfect stealth not required
- Marcus protection encouraged but not required

**Outcome:** Thorough completion, well-executed mission

---

### Perfect Success (100% Completion)

**Required Tasks:**
- All of Standard Success
- All 3 LORE fragments discovered
- Marcus protected (Task 5.1 completed with warn/plant choice)
- Perfect stealth (zero guard detections)
- PIN solved on first attempt (deduced from clues, no device)
- Both encoding challenges solved without hints

**Optional:**
- Ghost confrontation (if traced)

**Achievements Unlocked:**
- "Ghost Hunter" (perfect stealth)
- "Code Breaker" (all encoding, no hints)
- "Ethical Hacker" (Marcus protected + informed choices)

**Outcome:** Masterful execution, all content experienced

---

## Ink Tag Usage Examples

### Task Completion
```ink
// In Marcus dialogue (password hints)
Marcus: "I kept a list of common passwords. 'Emma2018', hospital dates..."
#complete_task:find_password_hints
```

### Task Unlocking
```ink
// In drop-site terminal (after flag submission)
Agent 0x99: "That log mentions offline keys in emergency storage!"
#unlock_aim:find_offline_backup_keys
#unlock_task:find_safe_location
```

### Item Giving
```ink
// In safe cracking success
*You enter PIN 1987. The safe clicks open.*
USB drive obtained: Offline Backup Key
#give_item:offline_backup_key
#complete_task:crack_safe_pin
```

### LORE Unlocking
```ink
// When reading Ghost's manifesto
*You open the operational log file...*
[Display Ghost's manifesto text]
#unlock_lore:ghosts_manifesto
```

### Achievement Unlocking
```ink
// In closing debrief (if never detected)
Agent 0x99: "You navigated that entire mission without detection. Impressive."
#unlock_achievement:ghost_hunter
```

---

## Objective-to-World Mapping

| Task | Location | Interaction Type | Completion Method |
|------|----------|------------------|-------------------|
| Arrive at Hospital | Reception Lobby | Area trigger | Enter room |
| Meet Dr. Kim | Admin Office | NPC dialogue | Complete conversation |
| Meet Marcus | IT Department | NPC dialogue | Complete conversation |
| Learn Guard Patrol | Hallway | Observation | Watch full 60s patrol |
| Find Password Hints | IT Office / Marcus | Container / NPC | Read notes OR dialogue |
| Decode Ransomware | IT Office | Terminal | CyberChef decode |
| Access Server Room | Server Room Door | Lock / Keycard | Lockpick OR use keycard |
| Submit SSH Flag | Drop-Site Terminal | Terminal input | Enter flag |
| Submit ProFTPD Flag | Drop-Site Terminal | Terminal input | Enter flag |
| Locate Backups | VM Terminal | VM filesystem | Navigate with commands |
| Submit Backup Flag | Drop-Site Terminal | Terminal input | Enter flag |
| Find Safe Location | Emergency Storage | Exploration | Enter room |
| Gather PIN Clues | Various | Containers / Objects | Read plaque, notes, photo |
| Crack Safe PIN | Emergency Storage | Safe minigame | Enter 1987 OR use device |
| Decode ROT13 | Server Room | CyberChef terminal | Decode instructions |
| Marcus Fate | Admin Office / IT | Document / Choice | Find email, make choice |
| Ransom Decision | Server Room | Dialogue choice | Recommend to Dr. Kim |
| Hospital Exposure | Post-mission | Dialogue choice | Choose with Agent 0x99 |

---

**Stage 4 Complete: Player Objectives and Tasks**

**Ready for:** Stage 5 (Room Layout Design)

**Total Tasks:** 23 required + 4 optional = 27 total
**Total Aims:** 5 required + 3 optional = 8 total
**Success Tiers:** 60% / 80% / 100% clearly defined
**No Soft Locks:** Progressive unlocking validated, all paths forward

**Core Strength:** Hybrid challenge tracking (VM flags + in-game tasks), clear success criteria, meaningful optional content (LORE, stealth, Marcus protection)
