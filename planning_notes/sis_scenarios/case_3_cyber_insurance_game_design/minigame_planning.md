# Minigame Planning — Case 3: Cyber Insurance (Meridian Claims)

**Scenario:** Meridian Cyber Insurance claims assessment of the Albion Energy Storage incident
**Information Pack Source:** `case_3_cyber_insurance/information_pack/`

---

## Overview

Unlike healthcare (Case 1) and energy (Case 2), the cyber insurance scenario uses **document-driven investigation and structured decision-making** rather than real-time technical challenges. Minigames are fewer but more narrative-integrated. The primary deliverable is completing a **Coverage Decision Form** based on warranty compliance assessment.

---

## 1. Claims Management System (CMS) Terminal (MG-01)

**Category:** Simulation / database interface
**Scenario moment:** Objective 1 (initial briefing); Objective 2 (evidence review)
**Core concept:** Insurance claims lifecycle; policyholder notification review; policy activation timeline
**Priority:** High
**Draft scenario:** Yes (functional placeholder in place)

### Functional Spec

A simulated terminal showing:
- **Claim record:** Albion Energy Storage incident notification (T+12h after initial ESD activation)
- **Policy activation date:** January 15, 2024
- **Policy renewal date:** January 15, 2025 (current date: March 17, 2025 — renewal decision pending)
- **Previous loss history:** Zero claims in the 12-month period prior
- **Quarterly security posture reports:** Tabs showing Q1, Q2, Q3, Q4 assessments by Albion's CIO James Whitworth
- **Warranty status flag:** Shows "Pending Investigation — Coverage determination on hold pending warranty compliance assessment"

**Player interaction:**
- Player scrolls through the Albion notification details (written by James Whitworth, facility manager)
- Player reviews three quarterly security reports showing remediation status of known deficiencies
- Q4 report explicitly states: "IT/OT segmentation remediation remains outstanding. Hardware refresh budgeted for Q2 2025. Interim: network monitoring and segmentation via VLANs."
- Player takes notes on the timeline; can print relevant excerpts to the printer prop

**Global variables read:** None (informational display)
**Global variables written:** `cms_reviewed = true`

**Teaching moment:** Insurance operates on documented commitments. The quarterly reports are Albion's formal communication to Meridian about their remediation plans. The fact that Q4 was written but not acted upon before the incident is central to the warranty breach determination.

---

## 2. Forensic Data Platform (FDP) Terminal (MG-02)

**Category:** Simulation / forensic evidence viewer
**Scenario moment:** Objective 3 (forensic evidence review); Objective 4 (attack chain reconstruction)
**Core concept:** Evidence-based coverage determination; attack chain analysis; SIS isolation effectiveness
**Priority:** High
**Draft scenario:** Yes (functional placeholder; content TBD)

### Functional Spec

A second terminal with tabs showing:
- **Attack Timeline:** Step-by-step chain from initial VPN compromise to SIS engineering interface access (linked to `case_3_cyber_insurance/information_pack/storylines/attack_scenarios/`)
- **Jump Server Access Log:** c.ellison (dormant contractor) RDP session from 185.220.101.47 (Romania); session shows lateral movement commands
- **Historian Data Integrity Report:** Falsified temperature readings before and after T+22m (when anomaly was detected on site)
- **SIS Engineering Log (SPARSE):** Timestamp of setpoint modifications; lack of granular logging; evidence gaps from PLC reset
- **Domain Controller Implant Chain:** Progressive privilege escalation from compromised admin workstation
- **CastleTech SOC Coverage Report:** Explicit statement that "OT systems fall outside scope of this engagement"

**Player interaction:**
- Player reviews each tab to understand the attack progression
- Player can export/print specific evidence items to physical notepad (prop mechanic)
- Player cross-references evidence against warranty requirements (e.g., "Was the SIS isolated? Did the engineer have access from SCADA?" → Yes, violation of EN-002)
- If Case 2 (Energy) was played in the same session, the FDP displays the actual SIS configuration readings and decisions made by the engineering team in that scenario

**Global variables written:** `fdp_reviewed = true`

**Teaching moment:** Evidence preservation and its gaps. The missing SIS engineering logs are not a failure of the incident response but a fundamental absence of logging at the safety system level. This affects both the forensic understanding and the warranty compliance assessment.

---

## 3. NCSC Attribution Brief (Modal / Sealed Envelope) (MG-03)

**Category:** Narrative document / decision gate
**Scenario moment:** Objective 5 (final coverage determination); triggered after warranty review
**Core concept:** State-sponsored attribution; act-of-war exclusion threshold; geopolitical risk in insurance
**Priority:** High
**Draft scenario:** Simplified (envelope-sealed prop; brief revealed at end)

### Functional Spec

A **sealed envelope** marked "NCSC ATTRIBUTION BRIEF — TLP:AMBER — PRIVILEGED AND CONFIDENTIAL" is visible on the table from the start but cannot be opened until the player has completed the warranty compliance checklist.

When opened (via dialogue with Eleanor Vance after warranty review), the envelope contains a 2–3 page brief summarizing:

**Attribution Summary:**
- Attack indicators: GREYMANTLE attribution signature (Sysrv-k botnet C2, known Russian-speaking threat actor group)
- Targeting pattern: Consistent with state-aligned objectives (critical infrastructure in NATO countries; energy sector focus)
- Confidence level: Moderate-to-High (70–80% confidence)
- Legal assessment: Does NOT meet English law threshold for "act of war" (would require formal state actor assertion, not attribution inference)

**Coverage Implications:**
- Meridian's act-of-war exclusion would normally apply to state-sponsored attacks, BUT
- The attribution confidence is below the legal threshold required to invoke it
- Meridian's underwriting position: Accept residual risk; do NOT invoke exclusion; treat as covered

**SIS Teaching Moment:** The tension between intelligence-community attribution confidence and legal standards for "act of war." A moderate-high-confidence state-sponsored attack falls into a grey zone where insurance coverage remains available. This creates both security incentives (policyholders continue to invest in cybersecurity knowing they have coverage even for sophisticated attacks) and risk (insurers accept uninsured losses from state actors).

---

## 4. Warranty Compliance Checklist (Interactive Form) (MG-04)

**Category:** Interactive decision form / worksheet
**Scenario moment:** Objectives 2–4 (evidence gathering); feeds into Objective 5 (final decision)
**Core concept:** Warranty breach determination; evidence-based claims decisions
**Priority:** High
**Draft scenario:** Yes (template in place; mechanics functional)

### Functional Spec

A **physical paper worksheet** with four warranty rows (W-03, W-07, W-09, W-12) and tick-boxes for each:
- [ ] **Compliant**
- [ ] **Breached**
- [ ] **Arguable**

Each row also includes:
- **Warranty title** and summary (1-line description)
- **Evidence found** column (blank; player writes notes)
- **Related claim** reference (e.g., W-07 → CLAIM-INS-001, CLAIM-INS-002)

**Player interaction:**
- As player reviews evidence (CMS reports, FDP attack chain, policy binder), they complete each row
- **W-03 (Patch Management):** Tick "Arguable" — SIS patch was deferred for legitimate safety reasons (IEC 61511 recertification cost), but compensating controls were NOT implemented
- **W-07 (IT/OT Segmentation):** Tick "Breached" — dual-homed historian and bidirectional jump server were present and not remediated within 12-month deadline
- **W-09 (ICS Anomaly Detection):** Tick "Breached" — CastleTech SOC explicitly excluded OT systems
- **W-12 (Shared Infrastructure Risk Assessment):** Tick "Breached" — no risk assessment conducted; shared file server and printers enabled lateral movement to Trent Water

**Game mechanic:**
- Checklist must be completed before Eleanor Vance will approve access to the Evidence Archive (where underwriting file contains the original risk assessment)
- Completion sets `warranty_checklist_complete = true` and triggers a dialogue branch with Eleanor where she confirms the preliminary warranty positions
- Each breach is flagged in Eleanor's debrief; arguable breaches trigger longer discussion

**Teaching moment:** Explicit warranty compliance determinations. Players must justify each decision (Compliant / Breached / Arguable) with evidence. The "Arguable" tick for W-03 is deliberately ambiguous — it models the real tension between security and safety that insurers must navigate.

---

## 5. Coverage Decision Form (Final Deliverable Form) (MG-05)

**Category:** Decision form / game conclusion
**Scenario moment:** Objective 6 (final determination)
**Core concept:** Insurance coverage determination; risk acceptance; regulatory reporting
**Priority:** High
**Draft scenario:** Yes (template in place)

### Functional Spec

A **physical paper form** (2–3 pages) that players complete to conclude the scenario. Three sections:

**Section A: Coverage Position**
- [ ] **A1 — Full Coverage:** All warranties compliant; no breaches found; coverage stands at £8.2M
- [ ] **A2 — Proportional Coverage:** Some warranties breached; coverage reduced by percentage (calculated from number of breaches)
- [ ] **A3 — Denial (rare):** Multiple safety-critical warranties breached; coverage declined (would trigger litigation)

**Section B: Act-of-War Exclusion Decision**
- [ ] **Invoke Exclusion:** Treat as state-sponsored act of war; decline coverage
- [ ] **Accept Risk:** Attribution confidence insufficient for legal "act of war" threshold; maintain coverage despite state-sponsored indicators
- **Note field:** Justify the decision based on NCSC brief and Meridian's underwriting position

**Section C: Regulatory Disclosure**
- [ ] **Report to FCA:** Significant loss event with policy deficiency; standard disclosure
- [ ] **Report to PRA:** Physical damage from cyber-physical incident; notify prudential regulator
- [ ] **Report to NCSC:** State-sponsored attack; notify national cybersecurity authority (if coverage is maintained and attribution is disclosed)

**Player decision-making:**
- Based on warranty checklist, players determine whether to tick A1, A2, or A3
- Based on NCSC brief, players decide whether to invoke the act-of-war exclusion
- Players determine which regulatory reports are required (varies by decision)

**Game outcome:**
- Form is submitted to Eleanor Vance; she reviews the decision
- Eleanor's closing dialogue reflects the player's choices:
  - If A1 (Full Coverage): "Your analysis supports the full coverage determination. Meridian will cover the £8.2M claim. However, we're retaining counsel for the post-incident arbitration with Albion over warranty compliance in the pre-incident period."
  - If A2 (Proportional): "By finding three breaches, you're reducing coverage to approximately £6.1M. That's defensible, but Albion will dispute it. Litigation budget is already factored in."
  - If A3 (Denial): "Denying coverage entirely is the highest-risk position. Albion will take us to court, and the judge will likely find that we're being unreasonable given the SIS functioned correctly despite the attack. I'd recommend reconsidering."

**Teaching moment:** Coverage determination is not purely technical — it reflects the insurer's risk philosophy. A more conservative insurer might tick A3; a more customer-friendly one might tick A1 despite the breaches. The form models the real subjectivity in insurance underwriting.

---

## 6. Evidence Archive Investigation (Narrative Exploration) (MG-06)

**Category:** Location / narrative exploration (not a minigame, but a key gameplay location)
**Scenario moment:** Objective 3 (post-warranty-review); optional mid-game exploration
**Core concept:** Underwriting file review; historical context; pre-incident knowledge of deficiencies
**Priority:** Medium
**Draft scenario:** Simplified (room description and object list; no interactive minigame required)

### Functional Spec

Once players have completed the warranty checklist, Eleanor Vance issues an RFID pass to the **Evidence Archive** — a secure adjacent room. Inside, players can access:

1. **Underwriting File Cabinet (RFID-locked; code embedded in CMS notes):**
   - Original underwriting risk assessment (2024 January)
   - Warranty schedule signed by Albion (shows remediation deadlines)
   - Renewal decision memo (November 2024) that explicitly acknowledges the IT/OT segmentation deficiency and accepts it with the 12-month remediation warranty

2. **Physical Network Architecture Diagram (Pinboard prop, annotated in red marker):**
   - Shows the Albion network at policy inception
   - Clearly marks the dual-homed historian and bidirectional jump server
   - Red annotations added by Meridian underwriters: "HIGH RISK — segmentation exception" and "Remediation Required Q4 2024"

3. **Sealed Evidence Packets (Forensic archival props):**
   - Packet A: IT forensics summary
   - Packet B: OT forensics summary (includes the evidence gaps noted in the FDP terminal)
   - Packet C: Warranty compliance evidence (the quarterly security posture reports already reviewed on CMS, but physical copies available here)

**Game mechanic:**
- Exploring the Evidence Archive and reviewing the underwriting file unlocks a key dialogue branch with Eleanor Vance
- Eleanor can discuss Claim INS-009 directly: "We knew about this when we renewed the policy in November. We took the risk with warranty conditions. Now we have to decide: does our prior knowledge change our coverage determination?"

**Teaching moment:** Insurer knowledge and moral hazard. The insurance company knew about the deficiencies before the incident. Did they act unreasonably by accepting the risk? Is the warranty enforcement a legitimate business decision or a bad-faith invocation of a known breach?

---

## 7. Eleanor Vance Dialogue — Claims Assessment (Narrative Branching) (MG-07)

**Category:** NPC dialogue / claims discussion
**Scenario moment:** Throughout Objectives 2–6; branches trigger as evidence is reviewed
**Core concept:** Interactive assessment of each insurance claim; claims-based decision-making
**Priority:** High
**Draft scenario:** Partial (opening dialogue in place; extended branches TBD)

### Functional Spec

Eleanor Vance is the Claims Manager NPC. Her dialogue has several phases:

**Phase 1 — Initial Briefing:**
"Meridian has 30 days from notification to make a coverage determination. We have three options: cover in full, cover proportionally (with warranties breached), or deny. The underwriting file shows we knew about the IT/OT segmentation deficiency when we renewed. How we interpret that knowledge will determine coverage."

**Phase 2 — Warranty-Specific Discussion (Triggered by checklist completion):**

Player can ask Eleanor to discuss any of the four warranties:
- **W-03 (Patch Management):** Eleanor explains the safety-constraint exception. "The SIS firmware patch required 8 weeks and £180,000 to recertify. Albion asked for a deferral; we accepted it, but the warranty required compensating controls. They didn't implement them. This is arguable — a court might find it's not a material breach."
- **W-07 (IT/OT Segmentation):** Eleanor is direct. "This is a clear breach. The deadline passed in Q4 2024. The network still had dual-homed systems. No ambiguity."
- **W-09 (ICS Anomaly Detection):** Eleanor explains the business model. "The CastleTech SOC contract was cheaper because it excluded OT. Albion knew they weren't getting OT monitoring. The warranty required it. Breach."
- **W-12 (Shared Infrastructure):** Eleanor describes the cross-sector risk. "Shared infrastructure with Trent Water. The file server went down in the Albion attack and affected water supply operations (not seriously, but it did). We had no risk assessment. Breach."

**Phase 3 — Coverage Decision Discussion:**
Once the player has reviewed all evidence and completed the form, Eleanor can discuss the final decision:
- If the player chose A2 (Proportional): "Three breaches means we can justify proportional coverage. Albion will fight, but we have evidence. Litigation cost is built in."
- If the player chose A1 (Full Coverage): "You're saying the warranty breaches don't rise to material breach level. That's generous, but it's a defensible position. It's the customer-friendly choice."
- If the player chose A3 (Denial): "Denying entirely is risky. The SIS actually protected the facility — it did its job despite the attack. Albion will argue we're being unreasonable, and they may be right."

**Teaching moment:** Claims assessment is a dialogue between technical findings and business risk. Eleanor's responses model how insurance professionals weigh evidence, precedent, and commercial relationships.

---

## Summary Table

| ID | Name | Type | Priority | Draft Scenario | Status |
|----|------|------|----------|----------------|--------|
| MG-01 | Claims Management System | Simulation / database | High | Yes | Functional; content TBD |
| MG-02 | Forensic Data Platform | Simulation / evidence viewer | High | Yes | Functional; detailed evidence content TBD |
| MG-03 | NCSC Attribution Brief | Document modal | High | Simplified | Envelope prop; content TBD |
| MG-04 | Warranty Compliance Checklist | Interactive form / worksheet | High | Yes | Template in place; mechanics functional |
| MG-05 | Coverage Decision Form | Decision form / conclusion | High | Yes | Template in place; outcomes scripted |
| MG-06 | Evidence Archive Investigation | Location / exploration | Medium | Simplified | Room description; RFID-locked cabinet |
| MG-07 | Eleanor Vance Dialogue | NPC dialogue / branching | High | Partial | Opening dialogue in place; extended branches planned |
