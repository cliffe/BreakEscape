# Mission 2: Objectives Verification Report

## Purpose
This document verifies that Mission 2 "Ransomed Trust" has a **clear and constant** set of objectives across all scenario files and documentation.

## Verification Status: ✅ VERIFIED

---

## Objectives Structure

Mission 2 has **5 main objectives** (aims) with **15 total tasks**.

### Summary Table

| # | Objective ID | Title | Tasks | Status at Start |
|---|--------------|-------|-------|-----------------|
| 1 | infiltrate_hospital | Infiltrate Hospital | 3 | Active |
| 2 | access_it_systems | Access IT Systems | 3 | Locked |
| 3 | exploit_entropy_backdoor | Exploit ENTROPY's Backdoor | 4 | Locked |
| 4 | recover_offline_keys | Recover Offline Backup Keys | 3 | Locked |
| 5 | make_critical_decisions | Make Critical Decisions | 2 | Locked |

**Total: 5 Objectives, 15 Tasks**

---

## Detailed Objectives Breakdown

### Objective 1: Infiltrate Hospital
**Status:** Active at mission start
**Order:** 0
**Description:** Enter St. Catherine's Regional Medical Center and meet key staff

#### Tasks:
1. **arrive_at_hospital** - Arrive at hospital reception
   - Type: `enter_room`
   - Target: `reception_lobby`
   - Status: Active (auto-completes on spawn)

2. **meet_dr_kim** - Meet Dr. Sarah Kim (Hospital CTO)
   - Type: `npc_conversation`
   - Target: `dr_sarah_kim`
   - Status: Locked → Unlocks after task 1

3. **talk_to_gary** - Interview IT administrator Gary Whitlock
   - Type: `npc_conversation`
   - Target: `gary_whitlock`
   - Status: Locked → Unlocks after task 2

---

### Objective 2: Access IT Systems
**Status:** Locked (unlocks after Objective 1)
**Order:** 1
**Description:** Gain access to hospital's IT infrastructure and server room

#### Tasks:
1. **obtain_password_hints** - Gather SSH password hints from Gary
   - Type: `collect_items`
   - Target: `password_sticky_note` (or NPC dialogue)
   - Status: Locked

2. **decode_ransomware_note** - Decode Base64 ransomware message
   - Type: `custom`
   - Location: Infected terminal (IT Department)
   - Status: Locked

3. **access_server_room** - Access the server room
   - Type: `enter_room`
   - Target: `server_room`
   - Methods: RFID keycard (high trust) OR lockpicking (medium difficulty)
   - Status: Locked

---

### Objective 3: Exploit ENTROPY's Backdoor
**Status:** Locked (unlocks after accessing server room)
**Order:** 2
**Description:** Use ProFTPD vulnerability to access encrypted backups

#### Tasks:
1. **submit_ssh_flag** - Submit SSH access flag
   - Type: `submit_flags`
   - Flag: `flag{ssh_access_granted}`
   - Reward: ENTROPY server credentials intercepted
   - Status: Locked

2. **submit_proftpd_flag** - Submit ProFTPD exploitation flag
   - Type: `submit_flags`
   - Flag: `flag{proftpd_backdoor_exploited}`
   - Reward: Shell access to backup server
   - Status: Locked

3. **submit_database_flag** - Submit database backup flag
   - Type: `submit_flags`
   - Flag: `flag{database_backup_located}`
   - Reward: Intel reveals safe location (Emergency Equipment Storage)
   - Status: Locked

4. **submit_ghost_log_flag** - Submit Ghost's operational log flag
   - Type: `submit_flags`
   - Flag: `flag{ghost_operational_log}`
   - Reward: Unlocks "Ghost's Manifesto" LORE fragment
   - Status: Locked

---

### Objective 4: Recover Offline Backup Keys
**Status:** Locked (unlocks after database backup flag submission)
**Order:** 3
**Description:** Find and crack PIN safe for offline backup encryption keys

#### Tasks:
1. **locate_safe** - Locate PIN safe in Emergency Equipment Storage
   - Type: `enter_room`
   - Target: `emergency_equipment_storage`
   - Route: hallway_south → emergency_equipment_storage
   - Status: Locked

2. **gather_pin_clues** - Find clues for 4-digit safe PIN
   - Type: `custom`
   - Clues:
     - Hospital founding plaque: "Founded 1987"
     - Dr. Kim's sticky note: "Safe combination: founding year"
     - Red herring: Emma's photo (2018)
   - Answer: **1987**
   - Status: Locked

3. **crack_safe_pin** - Crack PIN safe (code: 1987)
   - Type: `unlock_object`
   - Target: `emergency_storage_safe`
   - Methods: PIN 1987 OR PIN cracker device
   - Reward: Offline backup encryption keys (USB drive)
   - Status: Locked

---

### Objective 5: Make Critical Decisions
**Status:** Locked (unlocks after BOTH Objectives 3 AND 4 complete)
**Order:** 4
**Description:** Decide how to recover hospital systems and handle the crisis

#### Tasks:
1. **make_ransom_decision** - Decide on ransom payment
   - Type: `custom`
   - Location: Ransom Interface Terminal (server_room)
   - Options:
     - **Pay Ransom:** £150,000 in Bitcoin, 1-2 patient deaths, 2-4 hour recovery
     - **Manual Recovery:** £0 to ENTROPY, 4-6 patient deaths, 12-hour recovery
   - Global Variable: `paid_ransom` (true/false)
   - Status: Locked

2. **decide_hospital_exposure** - Decide whether to expose hospital negligence
   - Type: `custom`
   - Location: Closing debrief conversation
   - Options:
     - **Expose:** Public scandal, Dr. Kim fired, sector-wide security improvements
     - **Quiet Resolution:** Dr. Kim keeps job, internal improvements only
   - Global Variable: `exposed_hospital` (true/false)
   - Status: Locked

---

## Optional Content (Not Required for Completion)

### Gary Protection Choice
**Type:** Optional moral choice (not a formal task)
**Trigger:** Finding scapegoating email in IT filing cabinet
**Options:**
- Protect Gary (document warnings) → `gary_protected` = true
- Warn Gary to resign → `gary_protected` = false
- Ignore → `gary_protected` = false

**Impact:** Affects Gary's career outcome in debrief

### LORE Fragment Collection
**Type:** Optional collectibles (not formal tasks)
**Fragments:**
1. **Ghost's Manifesto** - VM filesystem (requires flag 4 submission)
2. **CryptoSecure Services Log** - IT filing cabinet (lockpick easy)
3. **Zero Day Syndicate Invoice** - Dr. Kim's safe (PIN 1987)

**Impact:** Unlocks additional narrative content and campaign connections

---

## Cross-File Verification

### Files Checked:
1. ✅ `scenario.json.erb` (lines 41-183) - **5 objectives, 15 tasks**
2. ✅ `SOLUTION_GUIDE.md` (lines 55-183) - **5 objectives, 15 tasks documented**
3. ✅ Ink dialogue scripts reference task completion via `#complete_task` tags
4. ✅ Global variables track objective states

### Consistency Verification:

| Aspect | scenario.json.erb | SOLUTION_GUIDE.md | Status |
|--------|-------------------|-------------------|--------|
| **Objective Count** | 5 | 5 | ✅ Match |
| **Task Count** | 15 | 15 | ✅ Match |
| **Objective IDs** | infiltrate_hospital, access_it_systems, exploit_entropy_backdoor, recover_offline_keys, make_critical_decisions | Same | ✅ Match |
| **Task IDs** | arrive_at_hospital, meet_dr_kim, talk_to_gary, obtain_password_hints, decode_ransomware_note, access_server_room, submit_ssh_flag, submit_proftpd_flag, submit_database_flag, submit_ghost_log_flag, locate_safe, gather_pin_clues, crack_safe_pin, make_ransom_decision, decide_hospital_exposure | Same | ✅ Match |
| **Unlock Conditions** | Progressive unlock structure | Documented | ✅ Match |
| **Descriptions** | Clear, concise | Expanded with context | ✅ Consistent |

---

## Progression Flow

### Linear Progression:
```
Start → Objective 1 (Active)
     ↓
Objective 1 Complete → Unlock Objective 2
     ↓
Objective 2 (Access Server Room) → Unlock Objective 3
     ↓
Objective 3 (Submit Flags) → Unlock Objective 4
     ↓
Objective 3 + 4 Both Complete → Unlock Objective 5
     ↓
Objective 5 Complete → Mission Complete
```

### Task Dependencies:
- **Objective 1:** Linear (1 → 2 → 3)
- **Objective 2:** Can be completed in any order, but access_server_room gates Objective 3
- **Objective 3:** 4 flags can be submitted in any order (SSH → ProFTPD → Database → Ghost Log recommended)
- **Objective 4:** Linear (1 → 2 → 3)
- **Objective 5:** Both decisions required, order flexible

---

## Clarity Assessment

### ✅ Objectives are CLEAR:
- Each objective has a descriptive title
- Each objective has a clear description of purpose
- Each task has specific completion criteria
- Task types are well-defined (enter_room, npc_conversation, collect_items, submit_flags, unlock_object, custom)
- Target rooms, NPCs, items, and objects are explicitly named
- Multiple solution paths documented (keycard vs lockpicking, social vs investigation)

### ✅ Objectives are CONSTANT:
- Objectives defined once in `scenario.json.erb`
- Same 5 objectives, same 15 tasks across all documentation
- No conflicting task lists
- No ambiguous completion criteria
- Progressive unlock structure ensures consistent player experience
- Global variables track persistent state

---

## Player-Facing Clarity

### In-Game Objective Display:
Players will see objectives in this order:
1. ✅ **Objective 1: Infiltrate Hospital** (Active at start)
2. 🔒 **Objective 2: Access IT Systems** (Unlocks after Objective 1)
3. 🔒 **Objective 3: Exploit ENTROPY's Backdoor** (Unlocks after server room access)
4. 🔒 **Objective 4: Recover Offline Backup Keys** (Unlocks after database flag)
5. 🔒 **Objective 5: Make Critical Decisions** (Unlocks after Objectives 3 & 4)

### Task Visibility:
- Active tasks shown with ✅ checkmark when complete
- Locked tasks shown with 🔒 until unlocked
- Progressive unlocking prevents confusion
- Clear task titles guide player actions

---

## Minimum Completion Requirements

### 60% Mission Score (Minimal Path):
- ✅ Objective 1: Complete (3/3 tasks)
- ✅ Objective 2: Complete access_server_room (1/3 tasks minimum)
- ✅ Objective 3: Complete 2+ flags (2/4 tasks)
- ✅ Objective 4: Complete (3/3 tasks)
- ✅ Objective 5: Complete (2/2 tasks)

### 100% Mission Score (Perfect Path):
- ✅ All 5 objectives complete (15/15 tasks)
- ✅ All 4 VM flags submitted
- ✅ All 3 LORE fragments collected (optional)
- ✅ Gary protected (optional moral choice)
- ✅ Both moral decisions made with informed choices

---

## Conclusion

**Verification Result: PASS ✅**

Mission 2 "Ransomed Trust" has a **clear and constant** set of objectives:

- **5 well-defined objectives** with descriptive titles and purposes
- **15 specific tasks** with explicit completion criteria
- **Consistent across all files** (scenario.json.erb, SOLUTION_GUIDE.md, Ink scripts)
- **Progressive unlock structure** ensures linear story flow
- **Multiple solution paths** documented for flexibility
- **Clear player guidance** through task titles and types
- **No ambiguity** in completion requirements

The objectives are suitable for:
- Player guidance during gameplay
- Completion tracking for mission scoring
- Educational assessment of learning outcomes
- Narrative pacing and tension building

**Document Version:** 1.0
**Last Verified:** Mission 2 Development (Session: claude/prepare-mission-2-dev-KRHGY)
**Status:** All objectives verified clear and constant
