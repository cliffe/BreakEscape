# Mission 5: "Insider Trading" - Stage 4: Player Objectives Design

**Mission ID:** m05_insider_trading
**Stage:** 4 - Player Objectives
**Version:** 1.0
**Date:** 2025-12-29

---

## Objectives System Overview

**Three-Tier Hierarchy:**
```
Objective (mission-level goal)
  └── Aim (sub-goal, investigation area)
      └── Task (specific action)
```

**Tracking Method:** Ink dialogue tags (`#complete_task`, `#unlock_task`, `#unlock_aim`)

**Mission Structure:** 3 Objectives, 9 Aims, 30+ Tasks (mix of required and optional)

---

## Complete Objectives Framework

### OBJECTIVE 1: "Investigate the Threat"

**Description:** "Infiltrate Quantum Dynamics and identify the insider exfiltrating classified data"

**Act Alignment:** Act 1 (Corporate Infiltration)

**Duration:** 20-25 minutes

**Success Criteria:** Player narrows suspects from 8 → 1 (David Torres)

---

#### AIM 1.1: "Gain Access to Quantum Dynamics"

**Description:** "Establish cover identity and obtain security clearance"

**Tasks:**

1. **arrive_at_quantum_dynamics** ✅ REQUIRED
   - **Description:** "Arrive at Quantum Dynamics headquarters"
   - **Status:** active (starting task)
   - **Completion:** Automatic when scenario loads
   - **Ink Tag:** `#complete_task:arrive_at_quantum_dynamics`
   - **Location:** Corporate Lobby

2. **meet_patricia_morgan** ✅ REQUIRED
   - **Description:** "Meet CSO Patricia Morgan"
   - **Status:** locked (unlocks after arrival)
   - **Completion:** Complete dialogue with Patricia in her office
   - **Ink Tag:** `#complete_task:meet_patricia_morgan`
   - **Unlocks:** `#unlock_task:obtain_security_badge`
   - **Location:** Executive Wing - CSO Office

3. **obtain_security_badge** ✅ REQUIRED
   - **Description:** "Obtain temporary security badge from Patricia"
   - **Status:** locked
   - **Completion:** Receive badge item during Patricia dialogue
   - **Ink Tag:** `#complete_task:obtain_security_badge`, `#give_item:security_badge`
   - **Unlocks:** `#unlock_aim:initial_investigation`
   - **Location:** Executive Wing - CSO Office

---

#### AIM 1.2: "Conduct Initial Investigation"

**Description:** "Review security logs and narrow suspect list"

**Tasks:**

4. **review_security_logs** ✅ REQUIRED
   - **Description:** "Analyze network traffic logs at Security Operations Center"
   - **Status:** locked (unlocks with security badge)
   - **Completion:** Access SOC terminal, review logs
   - **Ink Tag:** `#complete_task:review_security_logs`
   - **Unlocks:** `#unlock_task:identify_upload_pattern`
   - **Location:** Security Operations Center

5. **identify_upload_pattern** ✅ REQUIRED
   - **Description:** "Identify Friday night upload pattern"
   - **Status:** locked
   - **Completion:** Correlate network logs with badge access
   - **Ink Tag:** `#complete_task:identify_upload_pattern`
   - **Unlocks:** `#unlock_task:review_employee_files`
   - **Location:** Security Operations Center

6. **review_employee_files** ✅ REQUIRED
   - **Description:** "Review Project Heisenberg employee roster"
   - **Status:** locked
   - **Completion:** Read employee files in conference room
   - **Ink Tag:** `#complete_task:review_employee_files`
   - **Unlocks:** `#unlock_aim:gather_intelligence`
   - **Location:** Conference Room

7. **talk_to_lisa** ⭕ OPTIONAL
   - **Description:** "Interview Lisa Rodriguez about team dynamics"
   - **Status:** active (available early)
   - **Completion:** Complete dialogue with Lisa
   - **Ink Tag:** `#complete_task:talk_to_lisa`
   - **Rewards:** Learn about Torres' stress, Elena's illness (context)
   - **Location:** Engineering Wing - Open Office

---

### OBJECTIVE 2: "Gather Intelligence"

**Description:** "Collect evidence to identify the insider and understand ENTROPY's plan"

**Act Alignment:** Act 2 (The Investigation)

**Duration:** 35-45 minutes

**Success Criteria:** Overwhelming evidence against Torres + understanding of Operation Schrödinger

---

#### AIM 2.1: "Exploit Bludit Server" (VM Challenge)

**Description:** "Hack Torres' personal blog server to extract ENTROPY communications"

**Tasks:**

8. **discover_bludit_server** ✅ REQUIRED
   - **Description:** "Scan network and discover bluditblog.tech server"
   - **Status:** locked (unlocks after reviewing employee files)
   - **Completion:** Network scan from server room terminal
   - **Ink Tag:** `#complete_task:discover_bludit_server`
   - **Unlocks:** `#unlock_task:submit_flag1`, enables VM access
   - **Location:** Server Room

9. **submit_flag1** ✅ REQUIRED (VM Flag 1)
   - **Description:** "Submit recruitment timeline flag"
   - **Status:** locked
   - **Completion:** Submit flag at drop-site terminal
   - **Ink Tag:** `#complete_task:submit_flag1`
   - **Unlocks:** `#unlock_task:submit_flag2`, access to Torres' encrypted files
   - **Location:** Drop-Site Terminal (Server Room)
   - **Reward:** Payment records ($45K), recruitment timeline (8 months)

10. **submit_flag2** ✅ REQUIRED (VM Flag 2)
    - **Description:** "Submit Digital Vanguard server IPs flag"
    - **Status:** locked
    - **Completion:** Submit flag at drop-site terminal
    - **Ink Tag:** `#complete_task:submit_flag2`
    - **Unlocks:** `#unlock_task:submit_flag3`
    - **Location:** Drop-Site Terminal
    - **Reward:** Network topology map, ENTROPY infrastructure

11. **submit_flag3** ✅ REQUIRED (VM Flag 3)
    - **Description:** "Submit exfiltrated file manifest flag"
    - **Status:** locked
    - **Completion:** Submit flag at drop-site terminal
    - **Ink Tag:** `#complete_task:submit_flag3`
    - **Unlocks:** `#unlock_task:submit_flag4`
    - **Location:** Drop-Site Terminal
    - **Reward:** List of stolen files (3.1 TB / 4.2 TB)

12. **submit_flag4** ✅ REQUIRED (VM Flag 4)
    - **Description:** "Submit The Architect's approval message flag"
    - **Status:** locked
    - **Completion:** Submit flag at drop-site terminal
    - **Ink Tag:** `#complete_task:submit_flag4`
    - **Unlocks:** `#unlock_aim:collect_physical_evidence`
    - **Location:** Drop-Site Terminal
    - **Reward:** ENTROPY's true plan (foreign sales, $45-70M)

---

#### AIM 2.2: "Collect Physical Evidence"

**Description:** "Search Torres' office for incriminating physical evidence"

**Tasks:**

13. **access_torres_office** ✅ REQUIRED
    - **Description:** "Gain access to Torres' office"
    - **Status:** locked (unlocks with flags OR investigation progress)
    - **Completion:** Lockpick or enter PIN (1989 - Elena's birth year)
    - **Ink Tag:** `#complete_task:access_torres_office`
    - **Unlocks:** `#unlock_task:find_medical_bills`, `#unlock_task:find_journal`, `#unlock_task:find_usb`
    - **Location:** Engineering Wing - Torres' Office

14. **find_medical_bills** ✅ REQUIRED
    - **Description:** "Examine medical bills on Torres' desk"
    - **Status:** locked
    - **Completion:** Interact with bills on desk
    - **Ink Tag:** `#complete_task:find_medical_bills`
    - **Evidence:** $380K total, insurance denials, Elena's cancer treatment
    - **Location:** Engineering Wing - Torres' Office

15. **find_journal** ✅ REQUIRED
    - **Description:** "Find and read Torres' personal journal"
    - **Status:** locked
    - **Completion:** Lockpick drawer, read journal
    - **Ink Tag:** `#complete_task:find_journal`
    - **Evidence:** 8 months of moral descent, self-awareness
    - **Location:** Engineering Wing - Torres' Office (locked drawer)

16. **find_usb** ✅ REQUIRED
    - **Description:** "Recover encrypted USB drive from safe"
    - **Status:** locked
    - **Completion:** Access safe (lockpick or code)
    - **Ink Tag:** `#complete_task:find_usb`
    - **Evidence:** Communication logs, payment receipts, exfiltration instructions
    - **Location:** Engineering Wing - Torres' Office (safe)

17. **correlate_evidence** ✅ REQUIRED
    - **Description:** "Correlate all evidence in conference room"
    - **Status:** locked (unlocks after collecting sufficient evidence)
    - **Completion:** Return to conference room, review evidence board
    - **Ink Tag:** `#complete_task:correlate_evidence`
    - **Unlocks:** `#unlock_aim:stop_operation_schrodinger`
    - **Location:** Conference Room

---

#### AIM 2.3: "Interview Team Members"

**Description:** "Interview employees to gather behavioral evidence and eliminate suspects"

**Tasks:**

18. **interview_chen** ⭕ OPTIONAL (but recommended)
    - **Description:** "Interview Dr. Sarah Chen (Torres' supervisor)"
    - **Status:** active
    - **Completion:** Complete dialogue with Chen
    - **Ink Tag:** `#complete_task:interview_chen`
    - **Reward:** Confirms Torres' access, provides technical context, emotional weight
    - **Location:** Engineering Wing - Chen's Office

19. **interview_park** ⭕ OPTIONAL (resolves red herring)
    - **Description:** "Interview Michael Park"
    - **Status:** active
    - **Completion:** Complete dialogue with Park
    - **Ink Tag:** `#complete_task:interview_park`
    - **Reward:** Resolves red herring (affair, not espionage)
    - **Location:** Hardware Lab

20. **interview_johnson** ⭕ OPTIONAL (resolves red herring)
    - **Description:** "Interview Dr. Amara Johnson"
    - **Status:** active
    - **Completion:** Complete dialogue with Johnson
    - **Ink Tag:** `#complete_task:interview_johnson`
    - **Reward:** Resolves red herring (legitimate collaboration)
    - **Location:** Research Lab

21. **interview_kevin** ⭕ OPTIONAL (moral weight)
    - **Description:** "Interview Kevin Tran (junior engineer)"
    - **Status:** active
    - **Completion:** Complete dialogue with Kevin
    - **Ink Tag:** `#complete_task:interview_kevin`
    - **Reward:** Character witness for Torres, moral complexity
    - **Location:** Open Office Area

22. **inform_patricia** ⭕ OPTIONAL
    - **Description:** "Update Patricia Morgan on investigation progress"
    - **Status:** active (available after evidence gathering)
    - **Completion:** Phone call or in-person report
    - **Ink Tag:** `#complete_task:inform_patricia`
    - **Reward:** Patricia's perspective on evidence
    - **Location:** Phone or CSO Office

---

### OBJECTIVE 3: "Stop Operation Schrödinger"

**Description:** "Prevent the final data exfiltration and resolve the insider threat"

**Act Alignment:** Act 3 (Confrontation & Choice)

**Duration:** 15-20 minutes

**Success Criteria:** Final upload prevented, critical choice made, Torres situation resolved

---

#### AIM 3.1: "Confront the Insider"

**Description:** "Confront David Torres with evidence and reveal ENTROPY's deception"

**Tasks:**

23. **locate_torres** ✅ REQUIRED
    - **Description:** "Locate David Torres for confrontation"
    - **Status:** locked (unlocks when evidence correlated)
    - **Completion:** Find Torres (office or server room depending on approach)
    - **Ink Tag:** `#complete_task:locate_torres`
    - **Unlocks:** `#unlock_task:present_evidence`
    - **Location:** Torres' Office or Server Room (Friday night)

24. **present_evidence** ✅ REQUIRED
    - **Description:** "Present accumulated evidence to Torres"
    - **Status:** locked
    - **Completion:** Show evidence during confrontation dialogue
    - **Ink Tag:** `#complete_task:present_evidence`
    - **Unlocks:** `#unlock_task:reveal_entropy_plan`
    - **Location:** Confrontation location

25. **reveal_entropy_plan** ✅ REQUIRED
    - **Description:** "Reveal ENTROPY's true plan (foreign sales, casualties)"
    - **Status:** locked
    - **Completion:** Show Torres The Architect's message
    - **Ink Tag:** `#complete_task:reveal_entropy_plan`
    - **Unlocks:** `#unlock_task:make_critical_choice`
    - **Location:** Confrontation location

26. **make_critical_choice** ✅ REQUIRED (BRANCHING)
    - **Description:** "Decide how to resolve Torres situation"
    - **Status:** locked
    - **Completion:** Choose one of 5 paths in dialogue
    - **Ink Tag:**
      - `#complete_task:turn_torres` (if turned into double agent)
      - `#complete_task:arrest_torres` (if arrested peacefully)
      - `#complete_task:combat_nonlethal` (if subdued non-lethally)
      - `#complete_task:combat_lethal` (if killed resisting)
      - `#complete_task:expose_publicly` (if exposed to media)
    - **Unlocks:** `#unlock_aim:prevent_exfiltration`
    - **Location:** Server Room - Confrontation

---

#### AIM 3.2: "Prevent Final Exfiltration"

**Description:** "Stop the final data upload and secure Project Heisenberg"

**Tasks:**

27. **stop_upload** ✅ REQUIRED (varies by choice)
    - **Description:** "Prevent final exfiltration upload"
    - **Status:** locked
    - **Completion:** Method depends on critical choice
      - Turned: Torres sends false completion signal
      - Arrested: Laptop seized
      - Combat (Lethal): Player manually cancels upload
      - Combat (Non-Lethal): Forced compliance after subdual
      - Exposed: Media prevents upload
    - **Ink Tag:** `#complete_task:stop_upload`
    - **Unlocks:** `#unlock_task:secure_data`
    - **Location:** Server Room

28. **secure_data** ✅ REQUIRED
    - **Description:** "Secure remaining 1.1 TB of Project Heisenberg data"
    - **Status:** locked
    - **Completion:** Access server room, secure files
    - **Ink Tag:** `#complete_task:secure_data`
    - **Unlocks:** `#unlock_task:patch_zero_days`
    - **Location:** Server Room

29. **patch_zero_days** ⭕ OPTIONAL (but recommended)
    - **Description:** "Notify competitors of 14 zero-day vulnerabilities"
    - **Status:** locked
    - **Completion:** Report vulnerabilities to affected companies
    - **Ink Tag:** `#complete_task:patch_zero_days`
    - **Reward:** Ethical choice, improves quantum crypto security
    - **Location:** Server Room or phone

30. **update_security** ⭕ OPTIONAL
    - **Description:** "Recommend security protocol updates to Quantum Dynamics"
    - **Status:** locked
    - **Completion:** Report to Patricia with recommendations
    - **Ink Tag:** `#complete_task:update_security`
    - **Reward:** Prevents future insider threats
    - **Location:** CSO Office or phone

---

#### AIM 3.3: "Report Mission Outcome"

**Description:** "Debrief with Agent 0x99 on mission results"

**Tasks:**

31. **trigger_debrief** ✅ REQUIRED (AUTOMATIC)
    - **Description:** "Mission complete, debrief initiated"
    - **Status:** locked (unlocks when data secured)
    - **Completion:** Automatic when `mission_complete = true`
    - **Ink Tag:** Sets `mission_complete = true`, triggers phone call
    - **Location:** Automatic (phone NPC event mapping)

32. **complete_debrief** ✅ REQUIRED
    - **Description:** "Complete closing debrief with Agent 0x99"
    - **Status:** locked
    - **Completion:** Finish debrief dialogue
    - **Ink Tag:** `#complete_task:complete_debrief`
    - **Location:** Phone (closing debrief NPC)

---

## Objectives Summary Table

| Objective | Aims | Required Tasks | Optional Tasks | Total Tasks |
|-----------|------|----------------|----------------|-------------|
| 1: Investigate | 2 | 6 | 1 | 7 |
| 2: Gather Intelligence | 3 | 11 | 5 | 16 |
| 3: Stop Operation | 3 | 7 | 2 | 9 |
| **TOTAL** | **8** | **24** | **8** | **32** |

---

## Task Tracking via Global Variables

**Evidence Level Tracking:**
```json
{
  "evidence_level": 0,  // Increments with each piece of evidence (max 7)
  // VM flags: +1 each (max 4)
  // Physical evidence: +1 each (medical bills, journal, USB = 3 total)
}
```

**Evidence determines confrontation options:**
- `evidence_level >= 4`: Full cooperation path available (turn Torres)
- `evidence_level >= 2`: Partial cooperation possible
- `evidence_level < 2`: Limited options (legal route only)

**Interview Tracking:**
```json
{
  "talked_to_lisa": false,
  "interviewed_chen": false,
  "interviewed_park": false,
  "interviewed_johnson": false,
  "interviewed_kevin": false
}
```

**Completion Tracking:**
```json
{
  "suspects_count": 8,  // Decreases as suspects eliminated
  "flag1_submitted": false,
  "flag2_submitted": false,
  "flag3_submitted": false,
  "flag4_submitted": false,
  "found_medical_bills": false,
  "found_torres_journal": false,
  "found_encrypted_usb": false,
  "torres_confronted": false,
  "mission_complete": false
}
```

---

## Success Criteria by Rank

### S-Rank (Perfect Investigation)
**Requirements:**
- ✅ All 24 required tasks completed
- ✅ At least 6 of 8 optional tasks completed
- ✅ All 4 VM flags submitted
- ✅ All 3 physical evidence pieces found
- ✅ At least 4 of 5 NPCs interviewed
- ✅ Torres turned (double agent path)
- ✅ Zero-days patched
- ✅ Security protocols updated

**Rewards:**
- Maximum handler confidence
- Torres provides intelligence for M6-M10
- 22 insider placements exposed
- Elena's treatment funded
- Perfect evidence for prosecution (if needed)

### A-Rank (Thorough Investigation)
**Requirements:**
- ✅ All 24 required tasks completed
- ✅ At least 4 of 8 optional tasks completed
- ✅ At least 3 VM flags submitted
- ✅ At least 2 physical evidence pieces found
- ✅ At least 3 NPCs interviewed
- ✅ Torres confronted with strong evidence

**Rewards:**
- Good handler relationship
- Operation Schrödinger stopped
- Partial ENTROPY network intelligence

### B-Rank (Adequate Investigation)
**Requirements:**
- ✅ All core required tasks completed
- ⭕ Few optional tasks completed
- ✅ At least 2 VM flags submitted
- ✅ At least 1 physical evidence piece found
- ⭕ Limited NPC interviews

**Rewards:**
- Mission success
- Operation stopped
- Limited ongoing intelligence

### C-Rank (Rushed Investigation)
**Requirements:**
- ✅ Minimum required tasks only
- ❌ No optional tasks
- ⭕ Minimal evidence gathering

**Consequences:**
- Mission technically successful
- Missed opportunities for intelligence
- Limited confrontation options
- Lower campaign impact

---

## Failure Conditions

**Mission Can Fail If:**
1. ❌ Player confronts Torres with insufficient evidence (evidence_level < 1)
   - Torres lawyers up, exfiltration continues
   - Requires restart or alternate investigation path

2. ❌ Player alerts Torres before gathering evidence
   - Torres destroys evidence and flees
   - ENTROPY warned, network goes dark

3. ❌ Player lets final exfiltration complete (if sympathetic release chosen badly)
   - Partial mission failure
   - Some intelligence officers compromised
   - Player disciplined

**Note:** Mission is designed to be forgiving—player can succeed with multiple approaches as long as basic evidence is gathered.

---

## Ink Tag Implementation Examples

### Completing Tasks After VM Flag Submission

```ink
=== drop_site_terminal ===
#speaker:terminal

SAFETYNET DROP-SITE TERMINAL
Secure communication established.

+ [Submit recruitment timeline flag]
    Flag verified: RECRUITMENT_TIMELINE_20XX

    Decrypting Torres' personal files...

    Access granted: Payment records, recruitment timeline.

    Torres was recruited 8 months ago. Payments total $45,000 so far.

    #complete_task:submit_flag1
    #unlock_task:submit_flag2
    #give_item:payment_records

    -> DONE
```

### Completing Tasks During Dialogue

```ink
=== patricia_briefing ===
#speaker:patricia_morgan

You're the external security consultant SAFETYNET sent?

+ [Yes, I'm here to help]
    Good. We need it.

    *Patricia hands you a security badge*

    Patricia: This gives you access to most areas. Don't abuse it.

    #complete_task:meet_patricia_morgan
    #complete_task:obtain_security_badge
    #give_item:security_badge
    #unlock_aim:initial_investigation

    -> DONE
```

### Completing Evidence Correlation Task

```ink
=== conference_room_evidence_board ===
You review all gathered evidence:

{found_medical_bills:
    • Medical bills: $380K, Elena's cancer treatment
}

{found_torres_journal:
    • Journal: 8 months of moral descent
}

{found_encrypted_usb:
    • USB drive: ENTROPY communications
}

{flag4_submitted:
    • The Architect's approval message
}

+ [Correlate all evidence]
    {evidence_level >= 4:
        Everything points to David Torres.

        Network logs, badge access, Bludit exploitation, physical evidence—overwhelming proof.

        You know who the insider is. Time to confront him.

        #complete_task:correlate_evidence
        #unlock_aim:stop_operation_schrodinger

        -> DONE
    - else:
        You need more evidence before confronting the insider.

        {not flag4_submitted:
            Complete the Bludit exploitation to find The Architect's communications.
        }

        {not found_torres_journal:
            Search Torres' office more thoroughly.
        }

        -> DONE
    }
```

---

## Optional Objectives for Replayability

### Hidden Objectives (Not Displayed, Discovered During Play)

**Protect Innocents:**
- **Task:** Ensure Lisa Rodriguez isn't implicated in investigation
- **Reward:** Handler acknowledges player's care for collateral damage

**Thorough Investigator:**
- **Task:** Interview all 5 NPCs (Lisa, Chen, Park, Johnson, Kevin)
- **Reward:** Complete picture of Torres' character

**Digital Forensics Expert:**
- **Task:** Submit all 4 VM flags
- **Reward:** Maximum digital evidence for confrontation

**Master Detective:**
- **Task:** Find all 3 physical evidence pieces
- **Reward:** Complete moral picture of Torres' situation

**Ethical Hacker:**
- **Task:** Patch zero-day vulnerabilities after securing data
- **Reward:** Handler commends ethical choice

---

## Progression Pacing

### Act 1: 6-7 Tasks (20-25 min)
**Objective 1 complete by end of Act 1**
- Players should feel they've made progress
- Suspects narrowed significantly
- Investigation path clear

### Act 2: 11-16 Tasks (35-45 min)
**Objective 2 complete by end of Act 2**
- VM challenge completion (4 flags)
- Physical evidence collection (3 items)
- Optional NPC interviews (0-5 interviews)
- Evidence correlation

### Act 3: 7-9 Tasks (15-20 min)
**Objective 3 complete at mission end**
- Confrontation sequence (4 tasks)
- Data security (2-4 tasks)
- Debrief (2 tasks)

---

**Stage 4 Status:** ✅ COMPLETE

**Next Stage:** Stage 5 - Room Layout Design (physical space and navigation)

**Document Stats:**
- **Objectives:** 3 (multi-act structure)
- **Aims:** 8 (investigation sub-goals)
- **Tasks:** 32 total (24 required, 8 optional)
- **VM Integration:** 4 flags mapped to tasks
- **In-Game Challenges:** 28 tasks (evidence, interviews, investigation)
- **Success Ranks:** 4 tiers (S/A/B/C) with clear criteria
- **Ink Integration:** Complete tag implementation examples

**Ready for:** Stage 5 development and scenario.json.erb implementation
