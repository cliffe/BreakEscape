# Mission 3 Test Cases

**Mission:** Mission 3 - Ghost in the Machine
**Purpose:** Comprehensive test cases for Stage 9 implementation validation
**Date:** 2025-12-27

---

## Test Environment Setup

**Prerequisites:**
- [ ] All 9 Ink scripts compiled and integrated
- [ ] VM Docker network running (3 services)
- [ ] All 7 rooms created and connected
- [ ] Objectives system configured
- [ ] Test save file available (fresh mission start)

---

## TC-001: Opening Briefing

**Priority:** Critical
**Category:** Narrative
**Estimated Time:** 3 minutes

### Test Steps
1. Start Mission 3 from mission selection
2. Opening briefing should auto-play
3. Read Agent 0x99's briefing dialogue
4. Select dialogue option: "What will I learn from this?"
5. Read learning objectives response
6. Select "Understood. I'm ready."
7. Briefing ends, player spawns in Reception Lobby

### Expected Results
- [ ] Briefing displays correctly
- [ ] Agent 0x99 portrait shows (or placeholder)
- [ ] Learning objectives dialogue accessible
- [ ] Objectives panel shows "Zero Day Intelligence" mission
- [ ] 3 aims visible: establish_cover, network_recon (locked), gather_evidence (locked)
- [ ] Tasks under establish_cover: meet_victoria, clone_rfid_card

### Pass Criteria
All expected results achieved, no errors, player can proceed to gameplay.

---

## TC-002: Victoria Initial Conversation

**Priority:** Critical
**Category:** NPC Dialogue
**Estimated Time:** 5 minutes

### Test Steps
1. From Reception, navigate North to Main Hallway
2. Navigate North to Conference Room
3. Approach Victoria Sterling
4. Initiate conversation
5. Select dialogue options that increase `victoria_influence`:
   - "I'm interested in advanced research" (+10)
   - "Researchers deserve to be paid" (+15)
   - "The free market argument" (+15)
   - "I'm not here to judge" (+15)
6. Track influence counter (should reach 55)
7. Continue conversation until RFID cloning option appears

### Expected Results
- [ ] Victoria conversation initiates correctly
- [ ] Victoria portrait displays (5 expression variations or placeholders)
- [ ] Dialogue choices present correctly
- [ ] `victoria_influence` variable increases (if visible in debug mode)
- [ ] Hub pattern allows topic selection
- [ ] "Move closer to examine whiteboard" option appears when `victoria_influence >= 20`

### Pass Criteria
Conversation flows naturally, all dialogue choices work, RFID cloning option accessible.

---

## TC-003: RFID Cloning Minigame

**Priority:** Critical
**Category:** Gameplay Challenge
**Estimated Time:** 3 minutes

### Test Steps
1. In Victoria conversation, select "Move closer to examine the whiteboard"
2. Player moves within 2 meters of Victoria
3. RFID cloner activates (progress bar appears)
4. Select distraction dialogue options (3 beats):
   - "What services are in the lab?"
   - "How do you price vulnerabilities?"
   - "I believe in understanding the full picture"
5. Progress bar reaches 100%
6. Device vibrates notification
7. Victoria's keycard cloned successfully

### Expected Results
- [ ] Progress bar UI displays (0% → 50% → 75% → 100%)
- [ ] Player must stay within 2m range (distance check)
- [ ] Dialogue provides distraction beats
- [ ] Cloning completes after 10 seconds
- [ ] Success notification: "VICTORIA STERLING'S EXECUTIVE KEYCARD CLONED"
- [ ] Task completed: `clone_rfid_card` ✓
- [ ] Aims unlock: `network_recon`, `gather_evidence`

### Pass Criteria
RFID cloning succeeds, objectives update correctly, player has Executive access.

---

## TC-004: Day/Night Transition

**Priority:** Critical
**Category:** Event System
**Estimated Time:** 2 minutes

### Test Steps
1. After RFID cloning complete, exit Victoria conversation
2. Navigate back to Reception Lobby
3. Exit building (trigger nighttime transition)
4. Screen fades out → nighttime phase begins
5. Player re-enters building at Reception

### Expected Results
- [ ] Transition trigger fires after RFID clone complete
- [ ] Screen fade effect
- [ ] Lighting changes to nighttime (darker, different ambiance)
- [ ] NPCs change: Victoria absent (unless confrontation later), Guard appears
- [ ] All 7 rooms now accessible (Executive Office, James's Office unlocked)

### Pass Criteria
Nighttime phase begins correctly, all rooms accessible, lighting/NPC states updated.

---

## TC-005: VM Terminal - nmap Scan

**Priority:** Critical
**Category:** Technical Challenge
**Estimated Time:** 2 minutes

### Test Steps
1. Navigate to Server Room (East from Main Hallway)
2. Interact with VM Terminal
3. Terminal interface opens
4. Enter command: `nmap -sV 192.168.100.0/24`
5. Read output

### Expected Results
- [ ] Terminal UI displays
- [ ] Command input field accepts text
- [ ] Command executes on Enter/Submit
- [ ] Output shows:
  ```
  Nmap scan report for 192.168.100.10
  PORT   STATE SERVICE VERSION
  21/tcp open  ftp     ProFTPD 1.3.5

  Nmap scan report for 192.168.100.20
  PORT     STATE SERVICE VERSION
  3632/tcp open  distcc  distccd v1 ((GNU) 4.2.4 (Ubuntu 4.2.4-1ubuntu4))

  Nmap scan report for 192.168.100.30
  PORT   STATE SERVICE VERSION
  80/tcp open  http    Apache httpd 2.4.41
  ```
- [ ] Flag unlocked: `flag{network_scan_complete}`
- [ ] Task completed: `scan_network` ✓

### Pass Criteria
nmap command works, output correct, flag validates, task completes.

---

## TC-006: VM Terminal - FTP Banner Grabbing

**Priority:** Critical
**Category:** Technical Challenge
**Estimated Time:** 2 minutes

### Test Steps
1. In VM Terminal, enter command: `nc 192.168.100.10 21`
2. Read banner output
3. Note ProFTPD version: 1.3.5

### Expected Results
- [ ] netcat command executes
- [ ] Output displays: `220 ProFTPD 1.3.5 Server (WhiteHat Security Training Network)`
- [ ] Flag unlocked: `flag{ftp_intel_gathered}`
- [ ] Task completed: `ftp_banner` ✓

### Pass Criteria
Banner displays correctly, flag validates, task completes.

---

## TC-007: VM Terminal - HTTP Pricing Data

**Priority:** Critical
**Category:** Technical Challenge
**Estimated Time:** 3 minutes

### Test Steps
1. In VM Terminal, enter command: `curl http://192.168.100.30/pricing/data.txt`
2. Observe Base64 encoded output
3. Copy Base64 string
4. Navigate to CyberChef Workstation (Server Room)
5. Paste Base64 string into input field
6. Select operation: "Base64"
7. Click "Decode"
8. Read decoded pricing structure

### Expected Results
- [ ] curl command returns Base64 string
- [ ] CyberChef UI accepts input
- [ ] Base64 decoder works correctly
- [ ] Decoded output shows pricing structure:
  ```
  Zero Day Syndicate - Exploit Pricing Structure

  Base Price Calculation:
  CVSS Score × $1,000 = Base Price

  Sector Premiums:
  - Healthcare: +30% (Low defensive capacity)
  - Finance: +20% (High-value targets)
  - Energy/ICS: +40% (Critical infrastructure)
  - Government: +50% (Strategic value)
  ```
- [ ] Flag unlocked: `flag{pricing_intel_decoded}`
- [ ] Task completed: `http_analysis` ✓

### Pass Criteria
HTTP fetch works, CyberChef decoding works, flag validates, task completes.

---

## TC-008: VM Terminal - distcc Exploitation (M2 Trigger)

**Priority:** ⭐ CRITICAL (M2 Revelation)
**Category:** Technical Challenge + Narrative Event
**Estimated Time:** 5 minutes

### Test Steps
1. In VM Terminal, note distcc service at 192.168.100.20:3632
2. Use Metasploit (or manual exploitation command)
3. Exploit CVE-2004-2687 (distcc RCE)
4. Gain access to distcc server filesystem
5. Navigate to `/var/log/zeroday/sales_log.txt`
6. Read operational logs content
7. Note: "$12,500 hospital exploit sale to GHOST (Ransomware Incorporated)"
8. Return to drop-site terminal
9. Submit flag: `flag{distcc_legacy_compromised}`

### Expected Results
- [ ] Exploitation command succeeds
- [ ] Operational logs file accessible
- [ ] Logs content displays:
  ```
  Date: 2024-05-15
  Exploit: ProFTPD 1.3.5 Backdoor (CVE-2010-4652)
  Client: GHOST (Ransomware Incorporated)
  Target Sector: Healthcare
  Base Price: $9,615
  Healthcare Premium: +30% ($2,885)
  Total: $12,500
  Status: Delivered
  Notes: Deployment confirmed at St. Catherine's Regional Medical Center.
  ```
- [ ] Flag submission accepted
- [ ] Task completed: `distcc_exploit` ✓
- [ ] **CRITICAL: Phone call from Agent 0x99 triggers immediately**

### Pass Criteria
Exploitation succeeds, logs readable, flag validates, **M2 revelation phone call triggers**.

---

## TC-009: M2 Revelation - Agent 0x99 Phone Call

**Priority:** ⭐ CRITICAL (Emotional Climax)
**Category:** Narrative Event
**Estimated Time:** 4 minutes

### Test Steps
1. Immediately after submitting `flag{distcc_legacy_compromised}`
2. Phone call overlay appears
3. Agent 0x99's portrait changes to `agent_0x99_concerned.png`
4. Read phone call dialogue (M2 revelation)
5. Listen to Agent 0x99 describe St. Catherine's Hospital attack
6. Note: 6 patient deaths, ransomware attack, patient monitoring failure
7. Phone call ends
8. `moral_choices` optional objective unlocks

### Expected Results
- [ ] Phone call triggers automatically (no delay)
- [ ] Phone UI overlay displays
- [ ] Portrait shows `agent_0x99_concerned.png` (or placeholder)
- [ ] Music cue: M2 revelation sting plays
- [ ] Dialogue content matches `/stages/stage_7/m03_phone_agent0x99.ink`:
  ```
  Agent 0x99: I need to tell you something. About that ProFTPD exploit in the logs.
  Agent 0x99: St. Catherine's Regional Medical Center. Ransomware attack. Six people died.
  Agent 0x99: Patient monitoring systems went down. Two people in surgery. Four in critical care.
  Agent 0x99: They couldn't see vitals. Couldn't respond in time.
  Agent 0x99: The exploit Zero Day sold - that's how GHOST got in.
  ```
- [ ] Objectives panel updates: `moral_choices` aim unlocked
- [ ] Player understands stakes are personal now

### Pass Criteria
Phone call triggers correctly, emotional impact conveyed, moral choices unlocked.

**Emotional Impact Test:** Playtest with multiple users. Does the revelation change their motivation from "gather intelligence" to "justice"? If not, adjust dialogue delivery/timing.

---

## TC-010: CyberChef - ROT13 Decoding

**Priority:** High
**Category:** Decoding Challenge
**Estimated Time:** 2 minutes

### Test Steps
1. Navigate to Server Room
2. Examine whiteboard (shows ROT13 encoded message)
3. Note message: `ZRRG JVGU GUR NEPUVGRPG - CEVBEVGVMR VASENFGEHPGHER RKCYBVGF`
4. Navigate to CyberChef Workstation
5. Input ROT13 string
6. Select operation: "ROT13"
7. Click "Decode"
8. Read decoded output

### Expected Results
- [ ] Whiteboard displays encoded message
- [ ] CyberChef ROT13 decoder works
- [ ] Decoded output: `MEET WITH THE ARCHITECT - PRIORITIZE INFRASTRUCTURE EXPLOITS`
- [ ] Task completed: `decode_whiteboard` ✓

### Pass Criteria
ROT13 decoding works correctly, task completes.

---

## TC-011: Safe PIN Entry

**Priority:** High
**Category:** Puzzle Challenge
**Estimated Time:** 3 minutes

### Test Steps
1. Navigate to Reception Lobby
2. Examine company founding plaque
3. Note founding year: 2010
4. Navigate to Server Room
5. Examine wall safe
6. Safe PIN entry UI appears
7. Enter PIN: 2010
8. Submit

### Expected Results
- [ ] Founding plaque shows: "Zero Day Syndicate - Founded 2010"
- [ ] Safe PIN entry UI displays (numeric keypad 0-9)
- [ ] Correct PIN (2010) unlocks safe
- [ ] Safe opens, reveals LORE Fragment 2: "Q3 2024 Exploit Catalog"
- [ ] Document displays exploit listings (including $12,500 hospital exploit)
- [ ] LORE Fragment 2 collected (optional objective)

### Pass Criteria
PIN puzzle solvable, safe unlocks, LORE Fragment 2 accessible.

---

## TC-012: LORE Fragment 3 - Cascading Decode

**Priority:** High
**Category:** Advanced Decoding Challenge
**Estimated Time:** 4 minutes

### Test Steps
1. Navigate to Executive Office (requires RFID clone)
2. Examine Victoria's desk
3. Find hidden USB drive
4. USB contains encoded file
5. Note: Double-encoded (Base64 → ROT13)
6. Copy encoded string
7. Navigate to CyberChef Workstation
8. First decode: Base64
9. Output is still encoded (ROT13)
10. Second decode: ROT13
11. Read The Architect's Directive (Phase 2 attack plans)

### Expected Results
- [ ] USB drive discoverable in Executive Office
- [ ] File contents: Base64 string
- [ ] CyberChef Base64 decode → ROT13 encoded text
- [ ] CyberChef ROT13 decode → plaintext directive
- [ ] Directive content matches `/stages/stage_6/lore_fragments.md` lines 214-368:
  ```
  Phase 2: Critical Infrastructure Compromise
  Priority Targets:
  1. Healthcare SCADA Systems
  2. Energy Grid ICS (Winter Peak Demand)

  Impact Projections:
  - 50,000+ patient treatment delays
  - 1.2 million without power (residential heating)
  ```
- [ ] LORE Fragment 3 collected (optional objective)

### Pass Criteria
Cascading decode works, The Architect's Directive readable, optional objective completes.

---

## TC-013: James Park Moral Choice

**Priority:** Critical
**Category:** Moral Choice System
**Estimated Time:** 3 minutes

### Test Steps
1. Navigate to James's Office (nighttime, requires RFID clone)
2. Examine desk
3. Find James's diary
4. Read diary contents (innocent researcher, unaware of Zero Day's crimes)
5. Moral choice dialogue triggers
6. Select choice: "Protect James (omit him from report)"
7. OR: "Include James in evidence (thorough reporting)"

### Expected Results
- [ ] Diary discoverable in James's Office
- [ ] Diary content displays personal entries showing innocence
- [ ] `m03_james_choice.ink` dialogue triggers
- [ ] Two clear moral options presented
- [ ] Choice consequences explained
- [ ] Variable set: `james_protected = true` or `false`
- [ ] Optional objective: `james_choice_made` ✓

### Pass Criteria
Diary readable, moral choice presents clearly, choice impacts tracked.

**Moral Weight Test:** Choice should feel difficult. Protecting James = compassionate but less thorough. Including James = thorough but harsh. Both valid.

---

## TC-014: Stealth System - Guard Patrol

**Priority:** Medium (Optional Objective)
**Category:** Stealth Mechanics
**Estimated Time:** 5 minutes

### Test Steps
1. During nighttime phase, navigate to Main Hallway
2. Observe guard patrol route
3. Attempt to cross hallway while guard is present
4. **Test A:** Get detected by guard
   - Guard detection meter fills
   - Warning issued
   - Return to patrol
5. **Test B:** Get detected second time
   - Bribery option appears ($500)
   - Select "Pay bribe" or "Refuse"
6. **Test C:** Perfect stealth (never detected)
   - Time movements to avoid guard
   - Complete mission with zero detections

### Expected Results (Test A):
- [ ] Guard patrol visible in Main Hallway
- [ ] Line-of-sight detection system works
- [ ] Detection meter fills over 3 seconds
- [ ] First detection: Warning, guard returns to patrol
- [ ] `perfect_stealth` still achievable

### Expected Results (Test B):
- [ ] Second detection: Bribery dialogue from `m03_npc_guard.ink`
- [ ] Pay bribe ($500): Mission continues, `perfect_stealth` failed
- [ ] Refuse bribe: Mission failure

### Expected Results (Test C):
- [ ] Zero detections throughout mission
- [ ] Optional objective: `perfect_stealth` ✓

### Pass Criteria
Guard patrol functions, detection system works, bribery option available, perfect stealth trackable.

---

## TC-015: Victoria Confrontation - Recruitment Path

**Priority:** Critical
**Category:** Moral Choice + Branching Narrative
**Estimated Time:** 6 minutes

### Test Steps
1. After collecting sufficient evidence (LORE Fragments, operational logs)
2. Navigate to Executive Office (nighttime)
3. Victoria is present (optional confrontation trigger)
4. Initiate confrontation
5. Select: "You can help us take down The Architect"
6. Navigate dialogue: Recruitment pitch
7. Select: "We can protect you. Witness protection."
8. Victoria agrees to become double agent
9. Closing debrief reflects recruitment ending

### Expected Results
- [ ] Victoria confrontation triggers correctly
- [ ] `m03_npc_victoria.ink` nighttime_confrontation knot plays
- [ ] Victoria's portrait changes through emotional states:
  - shocked → defensive → conflicted → broken
- [ ] Recruitment dialogue branch accessible
- [ ] Victoria accepts double agent role
- [ ] Variables set: `victoria_recruited = true`
- [ ] Task completed: `victoria_choice_made` ✓
- [ ] Closing debrief mentions: Victoria cooperation, Phase 2 intelligence

### Pass Criteria
Recruitment path works, dialogue flows naturally, debrief reflects choice.

---

## TC-016: Victoria Confrontation - Arrest Path

**Priority:** Critical
**Category:** Moral Choice + Branching Narrative
**Estimated Time:** 5 minutes

### Test Steps
1. Follow TC-015 steps 1-4
2. Select: "I know about St. Catherine's Hospital"
3. Navigate dialogue: Moral confrontation
4. Select: "Is $12,500 worth six lives?"
5. Victoria breaks down (emotional climax)
6. Select: "You need to face justice"
7. Victoria accepts arrest
8. Closing debrief reflects arrest ending

### Expected Results
- [ ] Hospital revelation path works
- [ ] Victoria's guilt and breakdown portrayed effectively
- [ ] Arrest dialogue branch accessible
- [ ] Victoria accepts consequences
- [ ] Variables set: `victoria_arrested = true`
- [ ] Task completed: `victoria_choice_made` ✓
- [ ] Closing debrief mentions: Victoria prosecution, justice served

### Pass Criteria
Arrest path works, emotional beats land, debrief reflects choice.

---

## TC-017: Victoria Confrontation - Escape Path

**Priority:** Medium
**Category:** Moral Choice + Branching Narrative
**Estimated Time:** 4 minutes

### Test Steps
1. Follow TC-015 steps 1-4
2. Select: "SAFETYNET agent. You're under investigation."
3. Show evidence but fail to convince Victoria
4. Select insufficient guarantees during recruitment pitch
5. Victoria refuses cooperation
6. Victoria escapes (walks away)

### Expected Results
- [ ] Conditional recruitment path works
- [ ] Victoria refuses without guaranteed immunity
- [ ] Variables set: `victoria_escaped = true`
- [ ] Task completed: `victoria_choice_made` ✓
- [ ] Closing debrief mentions: Victoria at large, mission incomplete

### Pass Criteria
Escape path accessible, Victoria's refusal logical, debrief reflects partial success.

---

## TC-018: Closing Debrief - Recruitment Ending

**Priority:** Critical
**Category:** Narrative Closure
**Estimated Time:** 4 minutes

### Test Steps
1. Complete mission with Victoria recruitment path
2. Complete all primary objectives (3 aims, 11 tasks)
3. Closing debrief triggers
4. Read Agent 0x99's debrief dialogue
5. Note reflections on:
   - Victoria's cooperation
   - James's fate (if protected)
   - Evidence collected
   - Phase 2 intelligence gained

### Expected Results
- [ ] `m03_closing_debrief.ink` plays automatically
- [ ] Debrief reflects player choices accurately:
  - Victoria recruited → mentions double agent operation
  - James protected → acknowledges compassion
  - Perfect stealth → acknowledges operational excellence
  - All LORE found → thorough investigation praise
- [ ] Mission complete screen shows
- [ ] Achievements/optional objectives display

### Pass Criteria
Debrief personalizes based on choices, mission completion satisfying, achievements tracked.

---

## TC-019: Closing Debrief - Arrest Ending

**Priority:** Critical
**Category:** Narrative Closure
**Estimated Time:** 4 minutes

### Test Steps
1. Complete mission with Victoria arrest path
2. Complete all primary objectives
3. Closing debrief triggers
4. Read Agent 0x99's debrief dialogue
5. Note reflections on justice served, consequences acknowledged

### Expected Results
- [ ] Debrief reflects arrest choice
- [ ] Agent 0x99 acknowledges justice but notes Phase 2 intelligence gap
- [ ] Mission complete (though Phase 2 threat remains)

### Pass Criteria
Arrest ending feels meaningful, trade-offs acknowledged.

---

## TC-020: Objectives System - Progressive Unlocking

**Priority:** Critical
**Category:** Game Systems
**Estimated Time:** Full playthrough (45-60 min)

### Test Steps
1. Start mission
2. Verify initial state:
   - `establish_cover` aim active
   - `network_recon` aim locked
   - `gather_evidence` aim locked
   - `moral_choices` aim locked
3. Complete `clone_rfid_card` task
4. Verify unlock:
   - `network_recon` aim unlocks
   - `gather_evidence` aim unlocks
5. Complete `distcc_exploit` task (M2 trigger)
6. Verify unlock:
   - `moral_choices` aim unlocks
7. Complete all primary tasks
8. Verify mission complete condition

### Expected Results
- [ ] Aims unlock progressively (not all available at start)
- [ ] RFID clone unlocks reconnaissance and evidence collection
- [ ] M2 revelation unlocks moral choices
- [ ] All 11 primary tasks completable
- [ ] 4 optional objectives trackable
- [ ] Objectives panel updates in real-time

### Pass Criteria
Progressive unlocking works, no tasks accessible before prerequisites met.

---

## TC-021: Full Playthrough - Speed Run

**Priority:** Medium
**Category:** Performance
**Estimated Time:** 45-60 minutes

### Test Steps
1. Complete mission as quickly as possible
2. Skip optional objectives
3. Minimal dialogue interaction
4. Focus only on primary tasks (11 tasks)
5. Track completion time

### Expected Results
- [ ] Mission completable in 45-60 minutes
- [ ] No mandatory waiting periods (except RFID clone 10 seconds)
- [ ] All critical path tasks accessible
- [ ] No dead ends or confusion

### Pass Criteria
Speed run possible in target time window, critical path clear.

---

## TC-022: Full Playthrough - 100% Completion

**Priority:** Medium
**Category:** Completionist
**Estimated Time:** 75-90 minutes

### Test Steps
1. Complete all 11 primary tasks
2. Complete all 4 optional objectives:
   - Collect 3 LORE fragments
   - Perfect stealth (zero detections)
   - Make both moral choices (James, Victoria)
3. Explore all dialogue branches
4. Read all documents
5. Track completion time

### Expected Results
- [ ] All primary tasks: ✓
- [ ] All optional objectives: ✓
- [ ] All LORE fragments collected: ✓
- [ ] Perfect stealth achievement: ✓
- [ ] All moral choices engaged: ✓
- [ ] Completion time: 75-90 minutes

### Pass Criteria
100% completion achievable, all content accessible, reasonable time investment.

---

## TC-023: Error Recovery - Failed RFID Clone

**Priority:** Medium
**Category:** Error Handling
**Estimated Time:** 5 minutes

### Test Steps
1. Begin RFID cloning minigame
2. Move too far away from Victoria (> 2m)
3. Progress bar resets
4. Attempt cloning again
5. Succeed on second attempt

### Expected Results
- [ ] Progress bar resets if distance > 2m
- [ ] Victoria's suspicion increases: `victoria_suspicious += 10`
- [ ] Player can retry cloning
- [ ] No permanent failure state

### Pass Criteria
Failed clone recoverable, player can retry without restart.

---

## TC-024: Edge Case - Skip Victoria Confrontation

**Priority:** Low
**Category:** Edge Case
**Estimated Time:** 2 minutes

### Test Steps
1. Complete mission without triggering Victoria confrontation
2. Collect all evidence
3. Submit all flags
4. Skip optional Victoria encounter
5. Complete mission

### Expected Results
- [ ] Victoria confrontation is optional (not required for completion)
- [ ] Mission completable without confrontation
- [ ] Closing debrief acknowledges Victoria still at large
- [ ] `victoria_choice_made` remains incomplete (optional objective)

### Pass Criteria
Victoria confrontation confirmed as optional, mission still completable.

---

## Test Summary Template

**Test Session Date:** _____________
**Tester Name:** _____________
**Build Version:** _____________

**Test Results:**
- Total Test Cases: 24
- Passed: _____ / 24
- Failed: _____ / 24
- Blocked: _____ / 24

**Critical Failures** (prevent mission completion):
- TC-_____: _____________________________________________
- TC-_____: _____________________________________________

**High Priority Failures** (degrade experience):
- TC-_____: _____________________________________________
- TC-_____: _____________________________________________

**Medium/Low Failures** (minor issues):
- TC-_____: _____________________________________________

**Notes:**
_________________________________________________________________
_________________________________________________________________

---

## Regression Testing Checklist

**After any code changes, re-test:**
- [ ] TC-001 (Opening Briefing)
- [ ] TC-003 (RFID Cloning)
- [ ] TC-008 (distcc Exploitation)
- [ ] TC-009 (M2 Revelation) ⭐ Critical
- [ ] TC-013 (James Moral Choice)
- [ ] TC-015 or TC-016 (Victoria Confrontation)
- [ ] TC-018 or TC-019 (Closing Debrief)
- [ ] TC-020 (Objectives Progressive Unlocking)

**Smoke Test** (15-20 minutes):
Run TC-001, TC-003, TC-008, TC-009, TC-015, TC-018 in sequence to verify critical path.

---

**Test Cases Version:** 1.0
**Last Updated:** 2025-12-27
**Total Test Coverage:** 24 test cases covering all critical systems

Use these test cases during Stage 9 implementation to validate each feature as it's built.
