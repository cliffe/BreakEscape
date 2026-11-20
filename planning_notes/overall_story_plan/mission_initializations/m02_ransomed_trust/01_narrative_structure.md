# Stage 1: Narrative Structure - Mission 2 "Ransomed Trust"

**Mission ID:** m02_ransomed_trust
**Created:** 2025-12-20
**Status:** Stage 1 Complete

---

## Complete Three-Act Structure

### ACT 1: INFILTRATION & DISCOVERY (15-20 minutes, 25% of mission)

**Emotional Arc:** Urgency → Anxiety → Understanding

#### Scene 1: Emergency Briefing (Agent 0x99) [2 minutes]

**Location:** Mission briefing (pre-infiltration)

**Dialogue Beats:**
- 0x99 explains crisis: "47 patients on life support, 12-hour window"
- Mission objectives: Recover decryption keys, restore systems
- Warning: "Hospital board voting on ransom payment in 4 hours—work fast"
- Stakes established: Statistical death projections if delayed

**Player Understanding:** Life-or-death situation, time pressure, ENTROPY signature

**Emotional Beat:** Professional urgency (serious, focused, no room for error)

**Objectives Unlocked:** #unlock_aim:infiltrate_hospital

---

#### Scene 2: Hospital Reception [3 minutes]

**Location:** St. Catherine's Hospital lobby

**Environmental Storytelling:**
- PA announcement: "All non-critical systems remain offline. IT working on resolution."
- Anxious visitors at reception desk asking about patient records
- Security guard visible on patrol route (foreshadowing mechanic)
- Hospital founding plaque: "Founded 1987" (PIN clue #1)

**NPC: Receptionist**
- Professional but stressed
- Directs player to Dr. Kim's office (Administrative Wing)
- "She's expecting you. Third floor, east wing."

**Player Action:** Navigate to Administrative Wing, observe guard patrol pattern

**Objectives:** #complete_task:arrive_at_hospital

---

#### Scene 3: Meet Dr. Sarah Kim (Hospital CTO) [4 minutes]

**Location:** Dr. Kim's office (Administrative Wing)

**Dialogue Structure:**

**Opening (Desperation):**
- Kim: "Thank god you're here. We're running out of time."
- Kim: "47 patients on backup power. If we don't restore systems in 12 hours..."
- Kim: "The board is voting on paying the ransom in 4 hours. I need your opinion."

**Investigation (Information Gathering):**
- Player asks about attack vector
- Kim: "Our IT admin, Marcus, kept warning us about some FTP vulnerability."
- Kim: "Budget cuts. We deferred the $85,000 server upgrade to buy a $3.2 million MRI."
- Kim: "Now Marcus is devastated. And the board... they're planning to blame him."

**Authorization:**
- Kim grants access to IT Department
- Kim: "Do whatever you need. Just save those patients."

**Emotional Beat:** Kim's guilt (institutional negligence) + desperation (patient lives)

**Objectives:** #complete_task:meet_dr_kim, #unlock_aim:access_it_systems

---

#### Scene 4: Meet Marcus Webb (IT Administrator) [5 minutes]

**Location:** IT Department

**Dialogue Structure:**

**Opening (Guilt & Frustration):**
- Marcus: "I TOLD them six months ago about CVE-2010-4652!"
- Marcus: "They said 'budget constraints.' Now look what happened."

**Social Engineering (Trust Building):**
- **Option A (Sympathize):** "Budget cuts are common. You did your job."
  - Marcus: "*sighs* Thanks. Nobody else thinks so."
  - **Result:** High trust, Marcus opens up
  
- **Option B (Professional):** "Let's focus on recovery. What do you need?"
  - Marcus: "Right. Professional. I appreciate that."
  - **Result:** Medium trust, Marcus cooperative
  
- **Option C (Blame):** "Why didn't you push harder?"
  - Marcus: "Are you serious? I... forget it."
  - **Result:** Low trust, Marcus defensive

**Information Exchange (Password Hints):**
- Marcus: "I kept a list of common passwords employees used. Embarrassing really."
- Marcus: "My daughter's name 'Emma', hospital anniversary dates, that kind of thing."
- Shows photo on desk: "Emma - 7th birthday! 05/17/2018" (PIN clue #2 - red herring)

**Server Room Access:**
- **If High Trust:** Marcus gives keycard: "Server room's locked, but take my card."
- **If Medium/Low Trust:** Marcus: "Server room's locked. I can't give you my card, but... the lock isn't great."

**Emotional Beat:** Marcus's guilt (warned leadership, ignored) + desire to vindicate himself

**Objectives:** #complete_task:talk_to_marcus, #unlock_task:access_server_room

---

#### Scene 5: IT Office Investigation [4 minutes]

**Location:** Marcus's IT office (lockpicking if low trust)

**Discoveries:**

**Discovery 1: Email Chain (Filing Cabinet)**
- From Dr. Kim to Board (6 months ago)
- Subject: "IT Security Concerns - ProFTPD Vulnerability"
- Body: "Marcus Webb recommends $85,000 server security upgrade. Suggests deferring to next fiscal year due to MRI equipment priority."
- **Narrative Impact:** Proves Marcus warned them, establishes institutional negligence

**Discovery 2: Sticky Notes (Marcus's Desk)**
- "Common passwords: Emma2018, Hospital1987, StCatherines"
- **Gameplay Impact:** Password hints for VM SSH challenge

**Discovery 3: Ransomware Note (Infected Terminal)**
- Base64 encoded message (CyberChef tutorial)
- Decoded: "YOUR PATIENT RECORDS ARE ENCRYPTED. 47 PATIENTS ON LIFE SUPPORT..."
- **Educational Moment:** Agent 0x99 explains Base64 encoding

**Emotional Beat:** Evidence gathering (pieces of puzzle coming together)

**Objectives:** #complete_task:find_password_hints, #complete_task:decode_ransomware_note

---

#### Scene 6: Navigate to Server Room [2 minutes]

**Location:** Hospital corridor (IT Dept → Server Room)

**Guard Patrol Tutorial:**
- Agent 0x99: "Security is heightened. Watch the guard's patrol pattern."
- Guard visible on 60-second loop: Reception → IT → Admin → Storage → Reception
- Visual cue: Minimap shows guard position
- Audio cue: Radio chatter when guard nearby

**Player Action:** Time movement to avoid guard (tutorial, forgiving)

**Emotional Beat:** Tension (stealth mechanic introduction)

**Objectives:** #complete_task:learn_guard_patrol

---

**ACT 1 END STATE:**
- Player has server room access (keycard or lockpicking)
- Password hints obtained (Marcus's list + sticky notes)
- Ransomware note decoded (understands ENTROPY's message)
- Guard patrol mechanics learned (tutorial complete)
- Emotional investment (Marcus's plight, patient lives at stake)

**Transition to Act 2:** "Now let's exploit ENTROPY's own backdoor to find those decryption keys."

---

### ACT 2: EXPLOITATION & RECOVERY (25-35 minutes, 50% of mission)

**Emotional Arc:** Focus → Discovery → Tension → Dilemma

#### Scene 7: Server Room - VM Access [8 minutes]

**Location:** Hospital server room

**Environment:**
- Racks of blinking servers
- Whiteboard with network diagram showing "ProFTPD 1.3.5" (VM clue)
- Two terminals: VM Access Terminal, Drop-Site Terminal

**VM Challenge Sequence:**

**Step 1: SSH Access**
- Use password hints from Marcus (Emma2018, Hospital1987, stcatherines)
- Hydra brute force or manual attempts
- Success: SSH access to backup server
- Flag: `flag{ssh_access_granted}`

**Step 2: Flag Submission (Drop-Site Terminal)**
- Submit SSH flag
- Agent 0x99: "Great! That flag represents intercepted ENTROPY credentials. Keep going."
- **Unlock:** #complete_task:submit_ssh_flag

**Step 3: ProFTPD Exploitation**
- Agent 0x99: "That server is running vulnerable ProFTPD. CVE-2010-4652."
- Exploit backdoor (guided tutorial for beginners)
- Gain shell access
- Flag: `flag{proftpd_backdoor_exploited}`

**Step 4: Filesystem Navigation**
- Navigate to /var/backups (cd, ls, cat commands)
- Find encrypted database files (patient_records.enc)
- Locate Ghost's operational log
- Flag: `flag{database_backup_located}`, `flag{ghost_operational_log}`

**Emotional Beat:** Technical focus (puzzle-solving, exploitation)

**Objectives:** #complete_task:exploit_proftpd, #complete_task:locate_backups

---

#### Scene 8: LORE Discovery - Ghost's Manifesto [3 minutes]

**Location:** VM terminal (Ghost's log file)

**Ghost's Manifesto (File: operational_log.txt):**
```
RANSOMWARE INCORPORATED: OPERATIONAL PHILOSOPHY

We calculated the risk: 47 patients, 12-hour window, 0.3% per hour fatality probability.
That's 1-2 deaths if they pay immediately, 4-6 if they delay for IT recovery.

St. Catherine's ignored Marcus Webb's warnings for six months. They cut cybersecurity budgets by 40%. They spent $3.2M on MRI equipment while refusing $85K for server security.

These numbers should horrify the hospital administrators. They created this scenario. We're just revealing the consequences.

Approved by The Architect - Operation Resilience
- Ghost
```

**Player Reaction:**
- Agent 0x99: "They... they calculated how many people would die."
- 0x99: "This isn't random cybercrime. This is ideology. ENTROPY believes suffering teaches lessons."

**Emotional Beat:** Horror (villain calculated patient deaths) + Anger (ENTROPY philosophy revealed)

**Objectives:** #unlock_lore:ghosts_manifesto

---

#### Scene 9: Drop-Site Intel Unlock [2 minutes]

**Location:** Drop-Site Terminal (Server Room)

**Flag Submission Results:**
- Submit ProFTPD exploit flag
- Submit database location flag
- Submit Ghost's log flag

**Agent 0x99 Response:**
- "Ghost's logs mention offline backup keys in 'emergency equipment storage.'"
- "The online backup is encrypted, but if we can find the offline keys..."
- "Check the administrative wing. Look for a safe."

**Unlock:** #unlock_aim:find_offline_backup_keys

**Emotional Beat:** Progress (digital investigation yielding physical leads)

---

#### Scene 10: Hunt for Offline Backup Keys [6 minutes]

**Location:** Administrative Wing (multiple rooms)

**Navigate Past Guards (Reinforcement):**
- Guard patrol route blocks direct path
- Player must time movement (60-second pattern)
- Alternate path available (through emergency stairwell)

**Lockpick Dr. Kim's Office (Optional, High Value):**
- Find sticky note: "Safe combination: founding year (for emergency access)"
- **PIN Clue #3:** Confirms safe PIN is hospital founding year (1987)

**Lockpick Emergency Equipment Storage:**
- Find safe with 4-digit PIN lock
- Find PIN cracker device (fallback option)

**Emotional Beat:** Tension (stealth + investigation)

**Objectives:** #complete_task:find_safe_location, #unlock_task:crack_safe_pin

---

#### Scene 11: PIN Safe Puzzle [5 minutes]

**Location:** Emergency Equipment Storage

**PIN Puzzle Solution:**

**Clue Integration:**
- Clue 1 (Lobby Plaque): "Founded 1987"
- Clue 2 (Photo): "Emma 05/17/2018" (red herring)
- Clue 3 (Sticky Note): "founding year"

**Correct PIN:** 1987

**Wrong Attempt Feedback:**
- Try 0517: "Incorrect PIN. Try again."
- Try 2018: "Incorrect PIN. Try again."
- Try 1987: "Safe unlocked. USB drive obtained."

**Fallback (If Struggling):**
- Agent 0x99 hint (after 3 wrong attempts): "Safe combinations often use significant institutional dates."
- PIN cracker device: Brute force animation (2 minutes in-game time)

**Emotional Beat:** Satisfaction (puzzle solved) or Relief (fallback used)

**Objectives:** #complete_task:crack_safe_pin, #give_item:offline_backup_key

---

#### Scene 12: LORE Discovery - Zero Day Syndicate Invoice [3 minutes]

**Location:** Dr. Kim's office safe (same PIN: 1987)

**ZDS Invoice Document:**
```
ZERO DAY SYNDICATE - INVOICE #ZDS-2024-0847

CLIENT: Ransomware Incorporated (Ghost)
SERVICE: ProFTPD Exploit + Reconnaissance
TARGET: St. Catherine's Regional Medical

DELIVERABLES:
- ProFTPD 1.3.5 backdoor exploit (CVE-2010-4652) - $25,000
- Healthcare vulnerability scan (214 hospitals) - $15,000
- Target recommendation (risk/reward analysis) - $10,000

TOTAL: $55,000 (Paid via Crypto Anarchist infrastructure)

TARGET RECOMMENDATION:
St. Catherine's is ideal. Maximum educational impact. Marcus Webb has documented warnings—perfect narrative about institutional negligence.

ARCHITECT APPROVAL: Confirmed.
```

**Agent 0x99 Reaction:**
- "That ProFTPD exploit wasn't random. Zero Day Syndicate sold it to Ghost."
- "And they specifically recommended St. Catherine's because of Marcus's warnings."
- "ENTROPY cells are coordinating. The Architect is orchestrating this."

**Emotional Beat:** Revelation (ENTROPY coordination confirmed) + Setup (M3 connection)

**Objectives:** #unlock_lore:zds_invoice

---

#### Scene 13: Recovery Instructions Decoding [3 minutes]

**Location:** Server Room (CyberChef Workstation)

**Encoded Message (ROT13 - NEW):**
```
SHYY ERPBIREL ERDHERRF BSSYVAR + BAYVAR XRLF—12-UBHE CEBPRFF VS ZNAHNY, VAFGNAG VS ENAFBZ CNVQ.
```

**Agent 0x99 Tutorial:**
- "This looks like ROT13—a Caesar cipher. Each letter shifted 13 positions."
- "Use CyberChef's ROT13 decoder."

**Decoded Message:**
```
FULL RECOVERY REQUIRES OFFLINE + ONLINE KEYS—12-HOUR PROCESS IF MANUAL, INSTANT IF RANSOM PAID.
```

**Player Understanding:**
- Need both VM keys (online) and safe keys (offline)
- Manual recovery = 12 hours (patient risk)
- Ransom payment = instant (but funds ENTROPY)

**Emotional Beat:** Clarity (understand full scope) + Dread (impossible choice approaching)

**Objectives:** #complete_task:decode_recovery_instructions

---

#### Scene 14: Mid-Mission Moral Choice - Marcus's Fate [3 minutes]

**Location:** IT Department or via found email

**Discovery: Email Chain (Found in Admin Office)**
```
FROM: Hospital Board Chair
TO: Legal Department
RE: Incident Liability

Marcus Webb's warnings are documented. We need to reframe this as his implementation failure, not our budget decision. Prepare termination paperwork and non-disparagement agreement.
```

**Player Choice:**

**Option A: Warn Marcus Privately**
- Call Marcus: "I found emails. They're planning to blame you. Document everything."
- Marcus: "I... I knew it. Thank you for telling me. I'll start gathering evidence."
- **Consequence:** Marcus protected, will vindicate himself
- **Campaign Impact:** Marcus becomes ally in future missions

**Option B: Plant Evidence Clearing Marcus**
- Modify email chain timestamp to show board ignored warnings
- **Consequence:** Marcus cleared, but player manipulated evidence (ethically gray)
- **Campaign Impact:** Effectiveness rewarded, but ethics questioned

**Option C: Focus on Mission (Ignore)**
- Don't intervene
- **Consequence:** Marcus will be scapegoated after mission
- **Campaign Impact:** Lost potential ally, Marcus's career destroyed

**Agent 0x99 Commentary:**
- If warn: "Good call. Marcus deserves better than this."
- If plant: "That's... effective. But tampering with evidence has consequences."
- If ignore: "Understood. Mission focus. But Marcus will pay the price."

**Emotional Beat:** Moral complexity (protect innocent vs. stay focused on mission)

**Objectives:** #complete_task:decide_marcus_fate (choice tracked)

---

**ACT 2 END STATE:**
- All VM challenges complete (4 flags submitted)
- All in-game challenges complete (lockpicking, PIN safe, encoding)
- Both keys obtained (digital VM + physical safe)
- LORE fragments discovered (Ghost's manifesto, ZDS invoice)
- Mid-mission choice made (Marcus's fate)
- Understanding complete (ransom dilemma fully explained)

**Transition to Act 3:** "You have everything needed for recovery. Now... the impossible decision."

---

### ACT 3: RESOLUTION & CONSEQUENCES (10-15 minutes, 25% of mission)

**Emotional Arc:** Dilemma → Decision → Reflection

#### Scene 15: The Ransom Decision [5 minutes]

**Location:** Server Room (all evidence gathered)

**Agent 0x99 Call:**
- "Hospital board is voting in 30 minutes. Dr. Kim is asking for your recommendation."
- "You've recovered the keys. Manual recovery will take 12 hours—that's statistical risk to patients."
- "Or... they pay the ransom. Instant recovery, but that $87,000 funds ENTROPY's next attack."

**Ghost's Final Communication (Terminal Message):**
```
FROM: Ghost
TO: St. Catherine's IT Department

Time is running out. 47 patients. 12 hours.

Patient deaths are on YOUR conscience if you delay. $87,000 vs. human lives—easy math.

We're not the villains here. Your administrators are. We just revealed their failure.

- Ransomware Incorporated
```

**Dr. Kim (In-Person):**
- "What do I tell the board? My medical training says 'do no harm.' But paying ransomware..."
- "Those are real people on life support. Families. Children. What would you do?"

**Choice Presentation (No "Right" Answer):**

**OPTION A: RECOMMEND PAYING RANSOM**

**Immediate Consequences:**
- ✅ Instant system recovery (no patient deaths)
- ❌ $87,000 to ENTROPY (funds future attacks)
- ❌ Ghost escapes with funds
- ❌ Hospital learns nothing about security

**Agent 0x99 Response:** "Utilitarian choice. You saved 47 lives today. But that money will fund more attacks."

**Dr. Kim Response:** "Thank you. We'll pay. I'll make sure we upgrade security after this."

**Campaign Impact:**
- M6: Clear cryptocurrency trail to Crypto Anarchists
- Future hospital missions: ENTROPY better funded, more sophisticated attacks

---

**OPTION B: RECOMMEND INDEPENDENT RECOVERY**

**Immediate Consequences:**
- ✅ ENTROPY not funded (better long-term)
- ✅ Opportunity to trace Ghost's communications
- ✅ Hospital forced to improve security
- ❌ 12-hour recovery = statistical patient risk (2-4 potential deaths)

**Agent 0x99 Response:** "Consequentialist choice. Short-term pain, but you didn't fund ENTROPY's next attack."

**Dr. Kim Response:** "I trust your judgment. We'll start manual recovery immediately. God help us."

**Campaign Impact:**
- M6: Harder to trace financial network, but ENTROPY has less capital
- Future hospital missions: Healthcare sector takes security seriously

---

**Emotional Beat:** Impossible choice (both options ethically defensible)

**Objectives:** #complete_task:make_ransom_decision (choice tracked)

---

#### Scene 16: Secondary Choice - Hospital Exposure [3 minutes]

**Agent 0x99 Call:**
- "We have evidence of St. Catherine's negligence. Board ignored Marcus's warnings, cut budgets."
- "We could go public—force accountability, warn other hospitals. Or keep it quiet—protect St. Catherine's reputation."

**Choice Presentation:**

**OPTION A: EXPOSE HOSPITAL PUBLICLY**

**Immediate Consequences:**
- ✅ Other hospitals learn from St. Catherine's mistakes
- ✅ Marcus vindicated publicly
- ✅ Regulatory pressure for healthcare cybersecurity
- ❌ St. Catherine's reputation destroyed
- ❌ Dr. Kim likely loses job
- ❌ Lawsuits, financial damage to hospital

**Agent 0x99 Response:** "Transparency protects future patients. But St. Catherine's may not survive the scandal."

**Campaign Impact:**
- Future medical facility missions more difficult (hospitals distrust SAFETYNET)
- But healthcare sector implements better security (fewer attacks overall)

---

**OPTION B: QUIET RESOLUTION**

**Immediate Consequences:**
- ✅ St. Catherine's reputation intact
- ✅ Dr. Kim keeps job (implements security improvements)
- ✅ SAFETYNET maintains hospital relationships
- ❌ Other hospitals remain vulnerable (don't learn from this)
- ❌ Marcus may still be scapegoated (unless player intervened earlier)

**Agent 0x99 Response:** "Discretion maintains relationships. But 40 other hospitals have the same vulnerability—they don't know yet."

**Campaign Impact:**
- Better relationship with medical sector
- But similar attacks likely to occur elsewhere

---

**Emotional Beat:** Transparency vs. Pragmatism (institutional accountability vs. individual protection)

**Objectives:** #complete_task:decide_hospital_exposure (choice tracked)

---

#### Scene 17: Optional - Ghost Confrontation [3 minutes]

**Location:** Server Room (if player traced Ghost's IP via VM logs)

**Ghost's Response (Terminal Communication):**
- "You traced me. Impressive. Doesn't matter."
- "I did the math. 47 lives at risk because of THEIR negligence, not mine."
- "You think I'm the villain? I just revealed their failure."

**Evil Monologue (If Player Chooses to Engage):**
- "St. Catherine's spent $3.2 million on an MRI and refused $85,000 for server security."
- "Marcus warned them. They ignored him. They chose MRI over patient data protection."
- "We're educators, not criminals. The suffering is regrettable but educational."
- "After this, St. Catherine's will never ignore cybersecurity again. Neither will 40 other hospitals watching."

**Player Response Options:**
- Argue: "You calculated patient deaths. That's evil."
- Agree partially: "The hospital was negligent, but this isn't justice."
- Silent: (Let Ghost talk)

**Ghost's Final Statement:**
- "Arrest me if you want. I accept the consequences. This operation was worth it."
- "They'll never ignore an IT security warning again. Mission accomplished."

**Outcome:**
- Ghost refuses cooperation (true believer)
- No remorse, ideologically committed
- Accepts arrest without resistance

**Emotional Beat:** Understanding enemy (Ghost's philosophy clear, even if wrong)

**Objectives:** #unlock_aim:confront_ghost (optional)

---

#### Scene 18: Closing Debrief (Agent 0x99) [4 minutes]

**Location:** Post-mission briefing

**Debrief Structure (Reflects Player Choices):**

**1. Ransom Decision Outcome**

*If Paid Ransom:*
- "Systems restored in 4 hours. All 47 patients stable. Zero casualties."
- "But that $87,000 is already in Crypto Anarchist hands. We're tracking the payment flow."
- "Ransomware Inc. will use those funds for next attack. Three more hospitals hit this month."
- "You saved lives today. But funded future attacks. The trolley problem, agent."

*If Independent Recovery:*
- "12-hour recovery process completed. 45 patients survived."
- "Two patients died during recovery window. Families are devastated. Lawsuits filed."
- "But you didn't fund ENTROPY. Ransomware Inc. has less capital for future operations."
- "Healthcare sector is taking notice. 15 hospitals implementing emergency security upgrades."

---

**2. Hospital Exposure Outcome**

*If Exposed Publicly:*
- "SAFETYNET press release detailed St. Catherine's negligence. National news coverage."
- "Dr. Kim resigned. Hospital facing $12 million in lawsuits."
- "But 40 hospitals implemented the security measures within 2 weeks. You likely saved thousands of future patients."
- "St. Catherine's may not survive. But the lesson was learned."

*If Quiet Resolution:*
- "St. Catherine's grateful for discretion. Security budget tripled for next fiscal year."
- "Dr. Kim keeping job, Marcus vindicated internally if you protected him."
- "But we've detected similar ProFTPD vulnerabilities in 40 other hospitals. None of them know yet."
- "You protected St. Catherine's reputation. But the systemic problem remains."

---

**3. Marcus's Fate**

*If Warned/Protected:*
- "Marcus documented everything. Hospital legal dropped scapegoating plan."
- "He's been promoted to Director of Cybersecurity with full budget authority."
- "Marcus says 'thank you.' He'll remember this. Could be a valuable ally."

*If Ignored:*
- "Marcus was terminated. Signed non-disparagement agreement under pressure."
- "His career is destroyed. Blacklisted in healthcare IT."
- "He warned them. Did everything right. And paid the price."

---

**4. LORE Reveals**

- "Ghost's manifesto confirms ENTROPY's ideology. They believe suffering teaches lessons."
- "More concerning: Zero Day Syndicate sold Ghost that exploit specifically targeting St. Catherine's."
- "ENTROPY cells are coordinating. The Architect is orchestrating operations across cells."
- "That ProFTPD exploit? We need to find out who else ZDS sold it to."

**Setup for M3:**
- "I'm assigning you to investigate Zero Day Syndicate next. They're ENTROPY's weapons dealer."
- "Find their operation. Shut down their exploit supply chain."

---

**5. Player Performance Summary**

- Patients saved/lost: [Specific numbers based on ransom choice]
- ENTROPY funding impact: [Ransom amount or $0]
- Hospital security improvement: [Public exposure or internal only]
- Marcus's career: [Vindicated or destroyed]
- LORE collected: [X/3 fragments found]
- Perfect stealth: [Yes/No - never detected by guards]

**Achievement Unlocks:**
- "Code Breaker" (if decoded all messages without hints)
- "Ghost Hunter" (if perfect stealth)
- "Ethical Hacker" (if protected Marcus + optimal choices)

**Emotional Beat:** Reflection (consequences of impossible choices) + Resolve (continue fighting ENTROPY)

**Final Line:**
- "No easy answers, agent. But you did your best under impossible circumstances."
- "Get some rest. Mission 3 starts tomorrow."

---

**ACT 3 END STATE:**
- Mission complete (success determined by choices, not "win/lose")
- Both moral choices made (ransom + exposure)
- Consequences understood (immediate + campaign impact)
- Campaign threads established (M3 ZDS connection, M6 financial trail)
- Emotional closure (reflection on impossible choices)

---

## Scene Flow Diagram

```
[Opening Briefing] → [Hospital Reception] → [Dr. Kim Meeting]
         ↓
[Marcus Meeting] → [IT Office Investigation] → [Guard Tutorial]
         ↓
[Server Room VM] → [ProFTPD Exploit] → [LORE: Ghost Manifesto]
         ↓
[Hunt for Safe] → [PIN Puzzle] → [LORE: ZDS Invoice]
         ↓
[Recovery Instructions] → [Mid-Choice: Marcus] → [Ransom Dilemma]
         ↓
[Hospital Exposure Choice] → [Optional: Ghost Confrontation] → [Closing Debrief]
```

---

## Emotional Beat Timeline

| Time | Scene | Emotional Beat | Intensity (1-10) |
|------|-------|----------------|------------------|
| 0:00 | Briefing | Urgency | 7 |
| 0:02 | Reception | Anxiety | 5 |
| 0:05 | Dr. Kim | Desperation | 6 |
| 0:09 | Marcus | Guilt & Frustration | 7 |
| 0:14 | IT Investigation | Focus | 5 |
| 0:18 | Guard Tutorial | Tension | 6 |
| 0:20 | VM Exploitation | Technical Focus | 5 |
| 0:28 | Ghost Manifesto | Horror & Anger | 8 |
| 0:31 | Safe Hunt | Investigation | 6 |
| 0:37 | PIN Puzzle | Satisfaction | 5 |
| 0:40 | ZDS Invoice | Revelation | 7 |
| 0:43 | Marcus Choice | Moral Weight | 6 |
| 0:46 | Ransom Dilemma | Impossible Choice | 9 |
| 0:51 | Exposure Choice | Ethical Complexity | 7 |
| 0:54 | Ghost Confrontation | Understanding Enemy | 6 |
| 0:57 | Closing Debrief | Reflection | 8 |

**Emotional Curve:** Steady build (urgency → tension) → Peak (ransom dilemma) → Reflective descent (consequences)

---

## Pacing Notes

### Time Distribution

- **Act 1 (Discovery):** 15-20 minutes (25%) - Establish stakes, learn mechanics
- **Act 2 (Investigation):** 25-35 minutes (50%) - Core gameplay, escalating discoveries
- **Act 3 (Resolution):** 10-15 minutes (25%) - Moral choices, consequences

### Pacing Mechanisms

**Urgency Without Timer:**
- No hard countdown clock (would stress beginners)
- Narrative urgency via NPC dialogue ("board voting in 30 minutes")
- PA announcements remind player of crisis
- Agent 0x99 periodic check-ins ("How's progress?")

**Tension Build:**
- Act 1: Learning (safe tutorial environment)
- Act 2: Escalation (guard patrols, challenging puzzles, dark discoveries)
- Act 3: Climax (impossible choices, heavy consequences)

**Breathing Room:**
- After intense moments (Ghost manifesto), quiet investigation (safe hunt)
- After ransom choice, brief reflection before exposure choice
- Debrief allows emotional processing before next mission

---

## Player Agency Map

### Critical Choice Points

**Choice 1: Marcus Social Engineering Approach (Act 1)**
- Sympathize / Professional / Blame
- **Impact:** Marcus's trust level (affects cooperation, keycard access)

**Choice 2: Marcus Protection (Act 2)**
- Warn / Plant Evidence / Ignore
- **Impact:** Marcus's fate (career destroyed or vindicated), future ally status

**Choice 3: Ransom Payment (Act 3)**
- Pay / Independent Recovery
- **Impact:** Patient outcomes, ENTROPY funding, M6 financial trail clarity

**Choice 4: Hospital Exposure (Act 3)**
- Expose / Quiet
- **Impact:** St. Catherine's reputation, sector-wide security improvements, future missions

### Optional Agency

- Lockpicking paths (keycard vs. lockpick server room)
- Stealth routes (multiple guard avoidance paths)
- PIN solving (clues vs. brute force device)
- Ghost confrontation (optional dialogue)
- LORE collection (3 fragments, all optional)

---

## Tutorial Integration

### New Mechanics Tutorials

**Guard Patrols (First Encounter, Act 1 Scene 6):**
- Agent 0x99 explanation + visual minimap indicator
- Forgiving first detection (warning only)
- Clear audio/visual cues

**PIN Safe Puzzle (First Safe, Act 2 Scene 11):**
- Agent 0x99 hint system (progressive)
- Multiple clue types (visual, document, NPC)
- Fallback device available

**ROT13 Decoding (First Cipher, Act 2 Scene 13):**
- Agent 0x99 explains Caesar cipher concept
- CyberChef interface tutorial
- Pattern recognition optional (can solve manually)

### Reinforced Mechanics

**Lockpicking:** Brief reminder ("Remember your training from M1")
**Social Engineering:** Marcus easier than M1 NPCs (stressed = less cautious)
**Base64:** Quick reminder ("Same as Mission 1 whiteboards")

---

**Stage 1 Complete: Narrative Structure**

**Ready for:** Stage 2 (Storytelling Elements Design)

**Core Strength:** Impossible choices presented fairly, both options ethically defensible, consequences meaningful

**Emotional Highlights:** Ghost manifesto discovery (horror at calculated deaths), ransom dilemma (utilitarian vs. consequentialist ethics), debrief reflection (no "right" answers)
