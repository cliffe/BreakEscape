# Mission 2: Ransomed Trust - Objectives

## Mission Objectives Overview

**Total:** 5 Main Objectives | 15 Tasks

---

## 📋 Objective 1: Infiltrate Hospital
**Status:** ✅ Active at mission start
**Description:** Enter St. Catherine's Regional Medical Center and meet key staff

### Tasks:
- ✅ **Arrive at hospital reception** (auto-completes)
- 🔒 **Meet Dr. Sarah Kim (Hospital CTO)**
- 🔒 **Interview IT administrator Gary Whitlock**

---

## 🖥️ Objective 2: Access IT Systems
**Status:** 🔒 Locked (unlocks after Objective 1)
**Description:** Gain access to hospital's IT infrastructure and server room

### Tasks:
- 🔒 **Gather SSH password hints from Gary**
- 🔒 **Decode Base64 ransomware message**
- 🔒 **Access the server room**

---

## 💻 Objective 3: Exploit ENTROPY's Backdoor
**Status:** 🔒 Locked (unlocks after accessing server room)
**Description:** Use ProFTPD vulnerability to access encrypted backups

### Tasks:
- 🔒 **Submit SSH access flag** → `flag{ssh_access_granted}`
- 🔒 **Submit ProFTPD exploitation flag** → `flag{proftpd_backdoor_exploited}`
- 🔒 **Submit database backup flag** → `flag{database_backup_located}`
- 🔒 **Submit Ghost's operational log flag** → `flag{ghost_operational_log}`

---

## 🔑 Objective 4: Recover Offline Backup Keys
**Status:** 🔒 Locked (unlocks after database backup flag)
**Description:** Find and crack PIN safe for offline backup encryption keys

### Tasks:
- 🔒 **Locate PIN safe in Emergency Equipment Storage**
- 🔒 **Find clues for 4-digit safe PIN** (Answer: 1987)
- 🔒 **Crack PIN safe (code: 1987)**

---

## ⚖️ Objective 5: Make Critical Decisions
**Status:** 🔒 Locked (unlocks after BOTH Objectives 3 AND 4)
**Description:** Decide how to recover hospital systems and handle the crisis

### Tasks:
- 🔒 **Decide on ransom payment** (Pay £150,000 vs Manual Recovery)
- 🔒 **Decide whether to expose hospital negligence** (Public vs Quiet)

---

## Objective Progression Flow

```
Mission Start
    ↓
Objective 1: Infiltrate Hospital (Active)
    ├─ Task: Arrive at hospital ✅
    ├─ Task: Meet Dr. Kim
    └─ Task: Interview Gary
    ↓
Objective 2: Access IT Systems (Unlocks)
    ├─ Task: Gather password hints
    ├─ Task: Decode ransomware note
    └─ Task: Access server room
    ↓
Objective 3: Exploit ENTROPY's Backdoor (Unlocks)
    ├─ Task: Submit SSH flag
    ├─ Task: Submit ProFTPD flag
    ├─ Task: Submit database flag
    └─ Task: Submit Ghost's log flag
    ↓
Objective 4: Recover Offline Keys (Unlocks after database flag)
    ├─ Task: Locate safe
    ├─ Task: Find PIN clues
    └─ Task: Crack safe (1987)
    ↓
Objective 5: Make Critical Decisions (Unlocks when 3 & 4 both complete)
    ├─ Task: Ransom decision
    └─ Task: Exposure decision
    ↓
Mission Complete
```

---

## Quick Reference Table

| # | Objective | Tasks | Unlock Condition |
|---|-----------|-------|------------------|
| 1 | Infiltrate Hospital | 3 | Active at start |
| 2 | Access IT Systems | 3 | Complete Objective 1 |
| 3 | Exploit ENTROPY's Backdoor | 4 | Access server room |
| 4 | Recover Offline Backup Keys | 3 | Submit database flag |
| 5 | Make Critical Decisions | 2 | Complete Objectives 3 & 4 |

---

## Task IDs (for development reference)

**Objective 1:**
- `arrive_at_hospital`
- `meet_dr_kim`
- `talk_to_gary`

**Objective 2:**
- `obtain_password_hints`
- `decode_ransomware_note`
- `access_server_room`

**Objective 3:**
- `submit_ssh_flag`
- `submit_proftpd_flag`
- `submit_database_flag`
- `submit_ghost_log_flag`

**Objective 4:**
- `locate_safe`
- `gather_pin_clues`
- `crack_safe_pin`

**Objective 5:**
- `make_ransom_decision`
- `decide_hospital_exposure`

---

## Minimum Completion Requirements

### For Mission Success (60%+):
- ✅ Complete Objective 1 (all 3 tasks)
- ✅ Complete Objective 2 (at least access server room)
- ✅ Complete Objective 3 (at least 2 flags recommended)
- ✅ Complete Objective 4 (all 3 tasks)
- ✅ Complete Objective 5 (both decisions)

### For Perfect Score (100%):
- ✅ All 5 objectives complete
- ✅ All 15 tasks complete
- ✅ All 4 VM flags submitted
- ✅ All 3 LORE fragments collected (optional)
- ✅ Gary protected (optional)
- ✅ Never detected by guard (stealth bonus)

---

## Key Answers & Solutions

**PIN Safe Code:** 1987 (hospital founding year)
**SSH Password Hints:** Emma2018, Hospital1987, StCatherines
**VM Flags:** 4 total (SSH, ProFTPD, Database, Ghost Log)
**Moral Choices:** Ransom (pay/deny), Exposure (public/quiet), Gary (protect/ignore)

---

**Status:** These objectives are constant and defined in:
- `/scenarios/m02_ransomed_trust/scenario.json.erb` (lines 41-183)
- Referenced in SOLUTION_GUIDE.md and OBJECTIVES_VERIFICATION.md

**Last Updated:** Mission 2 Development
**Version:** 1.0
