# New Objects and NPC Planning — Case 3: Cyber Insurance (Meridian Claims)

**Scenario:** Meridian Claims assessment of Albion Energy Storage cyber-physical incident
**Information Pack Source:** `case_3_cyber_insurance/information_pack/`

---

## Overview

The cyber insurance scenario uses fewer interactive minigames than Cases 1 and 2 but relies heavily on physical document props and NPC dialogue. The primary game loop is: **Review CMS → Review FDP → Assess Warranties → Complete Decision Form → Debrief with Eleanor Vance**

Unlike the technical escape room format of healthcare and energy, this scenario emphasizes structured decision-making, evidence interpretation, and dialogue-driven outcomes.

---

## 1. NPCs

### 1.1 Eleanor Vance — Claims Manager (Person NPC)

**Priority:** High
**Draft scenario inclusion:** Yes (opening dialogue stub in place)

**Functional spec:**

Eleanor is the primary NPC and the scenario's game master. She guides players through the claims assessment process and responds to their decisions.

**State machine:**

```
START → WELCOME_BRIEFING → POLICY_REVIEW → WARRANTY_REVIEW → COVERAGE_DECISION → DEBRIEF
```

**Initial state:** Eleanor is in the Meridian Claims Suite, at the head of the conference table, working on her laptop.

**Phase 1 — Welcome Briefing (timedConversation at 0:00):**
Eleanor explains:
- The £8.2M claim from Albion Energy Storage
- Meridian's 30-day determination window
- The three coverage options (Full / Proportional / Deny)
- The four key warranties (W-03, W-07, W-09, W-12) that need assessment
- The pre-incident renewal in November 2024 where Meridian accepted the IT/OT segmentation deficiency

**Phase 2 — Policy Review Branch:**
If player reviews the Policy Binder:
- Eleanor can discuss specific policy sections
- Dialogue branches on Insuring Clause, Warranty Schedule, Exclusions, Cooperation Clause, Definitions

**Phase 3 — Warranty Compliance Branch:**
After player completes the Warranty Compliance Checklist and submits it to Eleanor:
- Eleanor scans the form and confirms the preliminary positions
- Eleanor can discuss each warranty:
  - W-03 (Patch Management with safety exception)
  - W-07 (IT/OT Segmentation — CLEAR BREACH)
  - W-09 (ICS Anomaly Detection — BREACH)
  - W-12 (Shared Infrastructure Risk — BREACH)
- Eleanor unlocks access to the Evidence Archive (RFID pass issued)

**Phase 4 — NCSC Attribution Brief Discussion:**
After warranty review, Eleanor can discuss opening the NCSC brief:
- Eleanor explains the attribution confidence vs. legal "act of war" threshold
- She describes Meridian's underwriting position: "We're accepting the residual state-sponsored risk. It's not uninsurable, just uninsured if it were an actual act of war — which this isn't, legally speaking."

**Phase 5 — Coverage Decision:**
After player completes the Coverage Decision Form and submits it:
- Eleanor reviews each section
- Her dialogue reflects the player's choices (Full / Proportional / Deny; Act of War decision; Regulatory disclosure)
- Eleanor discusses the implications:
  - If Full Coverage: "You're accepting the warranty deficiencies as not material. That's a customer-friendly position."
  - If Proportional: "Three breaches mean we reduce coverage by [X]%. Defensible, but litigation-prone."
  - If Denial: "You're taking the high-risk position. Albion will sue, and we might lose."

**Phase 6 — Debrief (End of Scenario):**
Eleanor closes the dialogue with a reflection on the security-informed safety decision:
"This case is harder than most cyber claims. It's not just about whether Albion had the right controls. It's about the fact that some of the deficiencies — like the SIS patch — are genuinely constrained by safety certification requirements. We accepted that risk when we renewed the policy. Now we have to decide: do we penalise them for constraints they were operating under?"

**Visual design:**
- Professional business attire (dark suit jacket, corporate ID)
- Character sprite: female professional, mid-40s, sitting at the conference table with a laptop
- Animation states: idle (typing, thinking), talk (focused on player), listen (reviewing documents)
- Headshot for dialogue box: professional corporate photo style

**NPC dialogue integration:**
Eleanor's dialogue incorporates references to specific claims from the information pack:
- CLAIM-INS-001 (IT/OT Segmentation as coverage condition) — discussed when reviewing W-07
- CLAIM-INS-002 (SIS Independence as insurable boundary) — discussed in relation to evidence archive findings
- CLAIM-INS-003 (Patch Management with safety constraint) — discussed when assessing W-03 (Arguable)
- CLAIM-INS-004 (MSP Security as indirect control) — discussed when reviewing CastleTech SOC evidence
- CLAIM-INS-005 (Anomaly Detection as early warning) — discussed when assessing W-09
- CLAIM-INS-006 (Evidence Preservation) — discussed in relation to FDP evidence gaps
- CLAIM-INS-007 (Shared Infrastructure Risk) — discussed when assessing W-12 and Trent Water lateral movement
- CLAIM-INS-008 (Act of War and attribution confidence) — discussed when reviewing NCSC brief
- CLAIM-INS-009 (Insurer knowledge and deficiency reporting) — discussed in the Evidence Archive investigation phase

---

### 1.2 James Whitworth — Albion Facility Manager (Phone NPC, Optional)

**Priority:** Medium
**Draft scenario inclusion:** Partial (reachable via phone; opening dialogue functional)

**Functional spec:**

James is the author of Albion's quarterly security posture reports and the incident notification. He can be reached via phone for clarification.

**Available dialogue branches:**
- "Can you walk me through the IT/OT segmentation remediation plan?" → James explains Q4 2024 plan, Q1 2025 delay, Q2 2025 hardware refresh budget
- "Why wasn't the SIS patch applied?" → James explains the 8-week, £180,000 recertification cost and the decision to defer with monitoring
- "What about compensating controls for the patch deferral?" → James admits enhanced monitoring was not implemented ("Budget was tight; we thought the SIS network was isolated enough")
- "Why didn't you conduct a risk assessment of the shared infrastructure with Trent Water?" → James explains operational convenience and that Trent Water is under a different IT team
- "How did you discover the attack?" → James describes the thermometer discrepancy on Bed 4, escalation to Marcus Webb, detection of the historian falsification

**Teaching moment:** James's dialogue reflects the operational pressures that lead to security shortcuts. He wasn't negligent; he was managing competing priorities (cost, time, compliance). This humanizes the warrantybreaches and makes the insurance decision more ethically complex.

---

## 2. Physical Document Props

### 2.1 Policy Binder (Interactive Document)

**Type:** Printed prop (interactive in-game object)
**Location:** Meridian Claims Suite (on conference table)
**Priority:** High
**Draft scenario:** Yes

**Content:**
- Tab 1: Insuring Clause ("We cover cyber-physical incidents affecting safety-critical systems...")
- Tab 2: Warranty Schedule (W-01 through W-15 listed; W-03, W-07, W-09, W-12 are key)
- Tab 3: Exclusions (including the Act of War exclusion: "We do not cover acts of war, invasion, or acts of a hostile foreign state")
- Tab 4: Cooperation Clause (Section 7.1: "The policyholder must preserve forensic evidence prior to restoration")
- Tab 5: Definitions (Key term: "Safety-Instrumented System" is defined; "Cyber-Physical Event" is defined)

**Game mechanic:**
- Player can physically open the binder and read passages
- Specific passages are pre-highlighted (yellow) on the master copy
- Key passages unlock dialogue branches with Eleanor
- The warranty schedule shows remediation deadlines; W-07 deadline is visibly past (December 31, 2024)

**Teaching moment:** Tangible policy language. Players see exactly what the contract says, not a summary. The language of the Act of War exclusion is intentionally vague ("acts of a hostile foreign state"), which is central to the legal ambiguity around state-sponsored cyber attacks in peacetime.

### 2.2 Warranty Compliance Checklist (Interactive Worksheet)

**Type:** Printed form (interactive in-game object)
**Location:** Meridian Claims Suite (on table with claim file)
**Priority:** High
**Draft scenario:** Yes

**Content:**

Four warranty rows:

| Warranty | Title | Compliant | Breached | Arguable | Evidence Found |
|----------|-------|-----------|----------|----------|-----------------|
| W-03 | Patch Management (with safety exception) | ☐ | ☐ | ☐ | |
| W-07 | IT/OT Segmentation | ☐ | ☐ | ☐ | |
| W-09 | ICS Anomaly Detection | ☐ | ☐ | ☐ | |
| W-12 | Shared Infrastructure Risk Assessment | ☐ | ☐ | ☐ | |

**Game mechanic:**
- Player fills in each row as they review evidence
- Checklist is submitted to Eleanor Vance
- Completion of all four rows unlocks access to Evidence Archive (RFID pass issued)
- Each determination feeds into the final Coverage Decision Form

**Teaching moment:** Forced explicit decision-making. Unlike a yes/no binary, the three-option framework (Compliant / Breached / Arguable) allows for nuance. Players must justify their choices with evidence notes.

### 2.3 Coverage Decision Form (Final Deliverable)

**Type:** Printed form (conclusive in-game object)
**Location:** Meridian Claims Suite (presented at final stage)
**Priority:** High
**Draft scenario:** Yes

**Sections:**

**Section A: Coverage Position**
- [ ] A1 — Full Coverage (£8.2M)
- [ ] A2 — Proportional Coverage (reduced by warranty breach count)
- [ ] A3 — Denial

**Section B: Act of War Exclusion**
- [ ] Invoke Exclusion (treat as state-sponsored act of war; coverage denied)
- [ ] Accept Risk (attribution confidence insufficient for legal threshold; coverage maintained)
- Justification notes

**Section C: Regulatory Disclosure**
- [ ] Report to FCA
- [ ] Report to PRA
- [ ] Report to NCSC (if coverage maintained and attribution disclosed)

**Game mechanic:**
- Form is completed by player based on evidence gathered and warranty determinations
- Submission to Eleanor triggers her debrief dialogue
- Different coverage positions result in different outcome narratives

**Teaching moment:** Coverage determination reflects business and ethical choices, not just technical facts. Different insurers might reasonably arrive at different answers.

### 2.4 Policy Binder — Renewal Decision Memo (Document Artifact)

**Type:** Physical document (prop, within Evidence Archive)
**Location:** Meridian Evidence Archive (in Underwriting File Cabinet)
**Priority:** High
**Draft scenario:** Simplified

**Content:**
A memo dated November 2024 from the Meridian underwriting team to the policy renewal board:

"**ALBION ENERGY STORAGE — POLICY RENEWAL DECISION**

Recommendation: **RENEW WITH WARRANTY CONDITIONS**

Known Deficiency: IT/OT segmentation remediation has not been completed. The dual-homed historian and bidirectional jump server remain in place.

Risk Assessment: **MODERATE-TO-HIGH**

Mitigation: We are renewing the policy with a 12-month warranty requiring complete segmentation remediation. If remediation is not completed by December 31, 2024, coverage will be reassessed at renewal.

This is a defensible underwriting decision given Albion's history (zero claims) and their commitment to remediation."

**Teaching moment:** Pre-incident knowledge. The insurance company *knew* about the deficiency and accepted the risk for one more year. This is central to Claim INS-009 (Insurer Knowledge and Deficiency Reporting). Did Meridian act reasonably, or should they have declined coverage?

### 2.5 NCSC Attribution Brief (Sealed Envelope)

**Type:** Physical document (sealed envelope prop)
**Location:** Meridian Claims Suite (on table, initially sealed)
**Priority:** High
**Draft scenario:** Simplified

**Content (revealed only after warranty review):**

A 2-3 page brief from the NCSC:

"**ALBION ENERGY STORAGE INCIDENT — ATTRIBUTION ASSESSMENT**

**Threat Actor:** GREYMANTLE (Russian-speaking threat collective)

**Confidence Level:** 70–80% (Moderate-to-High)

**Indicators:**
- Sysrv-k botnet C2 infrastructure
- Targeting pattern consistent with state-aligned objectives
- Timeline and techniques match previous GREYMANTLE campaigns

**Legal Assessment for Act-of-War Threshold:**
This attribution meets the intelligence community's standard for confidence but **does not meet the legal threshold** for determining an "act of war" under English law. An act of war requires formal assertion or declaration by a hostile state, not retrospective attribution of state-aligned behavior.

**Implications for Meridian:**
Meridian's act-of-war exclusion **cannot be invoked** based on this assessment. Coverage must be maintained."

**Teaching moment:** The gap between intelligence confidence and legal certainty. State-sponsored attacks in peacetime occupy a legal grey zone. Insurance coverage remains available not because the attack isn't state-sponsored, but because "state-sponsored" doesn't meet the legal definition of "act of war."

### 2.6 Physical Network Architecture Diagram (Pinboard Prop)

**Type:** Printed diagram (annotated)
**Location:** Meridian Evidence Archive (on pinboard)
**Priority:** Medium
**Draft scenario:** Simplified

**Content:**
A printed Purdue Model diagram of Albion's network (sourced from `case_3_cyber_insurance/information_pack/system_architecture/network_architecture.md`) annotated with red marker:

- Red box around the dual-homed historian: "HIGH RISK — segmentation exception"
- Red box around the bidirectional jump server: "BIDIRECTIONAL — enables SCADA pivot"
- Red line connecting Enterprise and SCADA: "No firewall isolation"
- Annotation: "Remediation Required Q4 2024" (with a red X through it, indicating the deadline was missed)

**Teaching moment:** Visual representation of the warranty breach. The network diagram is not abstract policy language; it's a concrete depiction of the security gap that the warranty was supposed to close.

---

## 3. Coverage Outcome Scenarios

### Outcome A: Full Coverage (£8.2M)

**Trigger:** Player selects A1 on Coverage Decision Form

**Eleanor's response:**
"You're arguing that the warranty breaches don't rise to material breach level. You're saying the safety-constraint exception for W-03 is legitimate, and the others are breaches but not sufficient to deny coverage."

**Implications:**
- Meridian pays the full £8.2M
- Albion is satisfied but will push back on the warranty assessment in the post-incident arbitration
- Meridian retains counsel for potential litigation

**Teaching moment:** Customer-friendly coverage can coexist with acknowledged deficiencies. Insurance relationships are built on trust and accommodation.

### Outcome B: Proportional Coverage (reduced by ~25–33%)

**Trigger:** Player selects A2 on Coverage Decision Form, identifying 3–4 breaches

**Eleanor's response:**
"By identifying three clear breaches (W-07, W-09, W-12) and one arguable breach (W-03), you're reducing coverage to approximately £6.1M to £6.5M. That's defensible legally, but Albion will dispute it aggressively."

**Implications:**
- Meridian pays reduced coverage
- High likelihood of post-incident arbitration and litigation
- Albion may appeal to regulatory authorities

**Teaching moment:** Strict contractual interpretation. Insurance companies can enforce warranties, but doing so aggressively damages customer relationships and invites regulatory scrutiny.

### Outcome C: Denial (Rare)

**Trigger:** Player selects A3 on Coverage Decision Form, arguing all warranties are materially breached

**Eleanor's response:**
"Denying coverage entirely based on warranty breaches is the highest-risk position. The SIS actually functioned correctly — it protected the facility despite the attack. Albion will argue we're being unreasonable, and frankly, they may be right. A judge could find that we're invoking technical warranty breaches to avoid a business loss we agreed to cover. I'd recommend reconsidering."

**Implications:**
- High-likelihood litigation
- Reputational risk to Meridian
- Regulatory inquiry likely (FCA/PRA)

**Teaching moment:** Insurers have legal rights but also reputational obligations. Using warranties to deny coverage on a technicality can backfire.

---

## 4. Summary Table

| Object | Priority | Draft Scenario | Type | Purpose |
|--------|----------|----------------|------|---------|
| Policy Binder | High | Yes | Interactive document prop | Tangible policy language; warranty schedule review |
| Warranty Compliance Checklist | High | Yes | Interactive form | Explicit compliance determination; feeds into final decision |
| Coverage Decision Form | High | Yes | Final form | Concludes scenario; three coverage positions with outcomes |
| NCSC Attribution Brief | High | Simplified | Sealed envelope prop | Act of War exclusion decision; legal vs. intelligence attribution |
| Physical Network Architecture Diagram | Medium | Simplified | Pinboard prop (annotated) | Visual representation of IT/OT segmentation breach; information pack sourced |
| Renewal Decision Memo | Medium | Simplified | Document artifact | Pre-incident knowledge of deficiency; Evidence Archive artifact |
| Eleanor Vance Dialogue | High | Partial | NPC dialogue | Claims assessment discussion; direct integration of all INS claims |

---

## Information Pack Integration

This scenario integrates claims INS-001 through INS-009 from the information pack directly through:

1. **Warranty Compliance Checklist:** Each warranty row is tied to specific claims
   - W-07 → CLAIM-INS-001, CLAIM-INS-002 (Segmentation and SIS Independence)
   - W-03 → CLAIM-INS-003 (Patch Management with safety constraint)
   - (MSP oversight not directly tested but referenced in CMS/FDP)
   - W-09 → CLAIM-INS-005 (Anomaly Detection)
   - (Evidence preservation → CLAIM-INS-006, discussed in FDP evidence gaps)
   - W-12 → CLAIM-INS-007 (Shared Infrastructure Risk)
   - (Attribution and Act of War → CLAIM-INS-008, discussed in NCSC brief)
   - (Insurer knowledge → CLAIM-INS-009, discussed in Evidence Archive investigation)

2. **Eleanor Vance Dialogue:** Direct reference to claims during warranty discussions

3. **NCSC Attribution Brief:** Direct address of CLAIM-INS-008 and legal threshold for act of war

4. **Physical Network Architecture Diagram:** Visualizes the IT/OT boundary deficiency (CLAIM-INS-001, CLAIM-INS-002)

All elements are sourced from or explicitly reference the cyber insurance information pack.
