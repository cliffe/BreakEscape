# Game Design Document — Case 3: Cyber Insurance
## "Meridian Claims: The Albion Decision"

Based on: Meridian Cyber Insurance Ltd — Albion Energy Storage coverage determination
Scenario prerequisite: `game_design/story_selection_report.md`
Recommended predecessor: `game_design/energy/` (Case 2: Albion Battery Hall)

---

## Design Premise

This case differs fundamentally from Cases 1 and 2. Players are not the engineers trying to stop the attack — they arrive after the emergency is contained. They are the Meridian Claims Team, and their task is to determine how much of the £8.2 million Albion Energy Storage claim is covered under Meridian's cyber policy.

The physical setting (an insurance office) is inherently weaker than a battery plant room or hospital ward. This GDD compensates through three design choices:

1. **Document-driven investigation**: Physical document props (policy binder, evidence packets, sealed envelopes) replace electrical panels and gauges. Players physically search, read, and annotate paper artifacts.
2. **The Coverage Decision Form**: The primary deliverable is a physical form players complete. Filling it in is the final act of the game, and the choices they make on paper have visible consequences in NPC dialogue.
3. **Cross-case continuity**: If played after Case 2, the Forensic Data Platform terminal shows Albion incident data that reflects the Case 2 players' actual decisions. The insurance team is reviewing what the engineering team did.

---

## Section 1: Physical Room Layout

---

### Room: Meridian Claims Suite

**Setting**: Meridian Cyber Insurance's major incident response room — a Lime Street, London conference suite repurposed as a crisis management centre for the Albion notification. A glass-topped conference table is covered with printed claim files, a policy binder, and two laptop workstations. A large wall screen displays the Albion incident timeline. This is an insurance office, but it is a company that deals with infrastructure disasters — and that tension shows.

**Atmosphere**: Corporate but tense. Pale lighting. A whiteboard at one end with "ALBION ENERGY STORAGE — MAJOR CLAIM" and key dates written. A wall clock showing London time alongside a "Claim Opened: T+0" timestamp. A framed Lloyd's market accreditation on the wall. A sealed envelope marked **NCSC ATTRIBUTION BRIEF — TLP:AMBER — PRIVILEGED AND CONFIDENTIAL** sitting visibly but untouched at one end of the table. Ambient sound: distant city hum through a window, occasional phone notification tones.

**Key systems present**:
- Claims Management System terminal (laptop workstation) — Albion's incident notification, policy history, quarterly security posture reports
- Forensic Data Platform terminal (second laptop workstation) — Albion forensic evidence; attack chain reconstruction; jump server access log; historian data. If Case 2 was played in the same session, this terminal reflects Case 2 outcomes.
- Physical policy binder (printed prop) — Albion's full policy document, including insuring clause, warranty schedule, exclusion clauses, cooperation clause. Tab-indexed. Approximately 40 pages.
- Physical claim file (printed prop) — James Whitworth's formal incident notification, loss estimate, and supporting correspondence. On the table from the start.
- Warranty compliance checklist (printed worksheet) — a one-page pro forma listing warranties W-03, W-07, W-09, W-12 with tick-boxes: Compliant / Breached / Arguable. Players fill this in as they work.
- Physical loss adjustment summary (printed prop, inside sealed evidence packet) — David Osei's £8.2M breakdown. Packet is sealed; opened when players have reviewed policy coverage.
- NCSC Attribution Brief (sealed envelope prop) — contains the TLP:AMBER attribution assessment. Not to be opened until players have completed warranty review.
- Coverage Decision Form (printed form) — the final deliverable. Players complete this to conclude the scenario. Three sections: Coverage Position (A/B/C), Act-of-War Decision, Regulatory Disclosure Recommendation.
- Phone — for calls to James Whitworth (Albion), David Osei (loss adjuster), and Robert Ngata (NCSC)

**Initial state**: Players enter to find Eleanor Vance (Claims Manager NPC) reviewing the claim file. The NCSC Brief is visible but sealed. The evidence archive door is closed and RFID-locked. The CMS terminal shows the initial notification. The policy binder is closed.

**Connections**: Locked door on north wall → Evidence Archive (requires RFID pass issued by Eleanor after initial policy review is complete)

---

### Room: Meridian Evidence Archive

**Setting**: An adjacent secure room — smaller, more utilitarian. Lined with secure filing cabinets, a single analysis workstation, and shelves of case files. The Albion file occupies a dedicated section with printed labels. This is where Meridian keeps the detailed forensic artefacts and the underwriting file for the policy — the historical record of what Meridian knew before the incident.

**Atmosphere**: Fluorescent lighting, no windows. Lockable metal cabinets. A printer / photocopier. A pinboard with the Albion network architecture diagram (physical document: a printed version of the IT/OT boundary schematic, with annotation in red marker highlighting the dual-homed historian and bidirectional jump server). The air is still. If Case 2 has been played, a photo or printout of the battery hall is mounted on the pinboard.

**Key systems present**:
- Forensic evidence packets (physical document props) — sealed packets containing:
  - Packet A: IT forensics summary (domain controller implant, printer firmware, SIEM gaps)
  - Packet B: OT forensics summary (historian falsified data, SIS setpoint modifications, evidence gaps from ESD reset)
  - Packet C: Warranty compliance evidence (the quarterly security posture reports showing IT/OT remediation status; the extension request submitted by James Whitworth)
- Underwriting file cabinet (RFID-locked — different key from suite door; code is embedded in the CMS terminal as a notation in the original risk assessment notes) — contains the original underwriting assessment, the warranty schedule signed by Albion, and the renewal decision memo that acknowledged the known deficiencies
- Physical network architecture diagram (pinboard prop, annotated) — the diagram Meridian received from Albion at policy inception; clearly shows the dual-homed historian server and the bidirectional jump server
- Printer (physical prop) — players can print additional documents from the forensic terminals if needed (prop use: printing allows physical handling of digital evidence)

**Initial state**: Locked — requires RFID pass from Eleanor Vance. Pass is issued after players complete the initial policy review (Aim 1).

**Connections**: South → Meridian Claims Suite

---

## Section 2: Interactive Elements Catalogue

---

### Element: Albion Policy Binder

**Type**: Physical document prop
**Location**: Meridian Claims Suite (on conference table from start)
**Initial state**: Closed, tab-indexed
**How players interact**: Physically search the binder for specific clauses. Tabs marked: Insuring Clause / Warranty Schedule / Exclusions / Cooperation Clause / Definitions. Players read and mark relevant passages.
**State changes**: No electronic state change — reading the insuring clause (tab 1) allows Eleanor Vance's dialogue to advance; finding Warranty W-07 (tab 2) and the act-of-war exclusion (tab 3) unlock corresponding discussion topics
**Teaching purpose**: Makes the insurance contract tangible. Players physically hold the warranty conditions and can see exactly how Warranty W-07 is worded vs. what Albion actually had in place. The act-of-war exclusion clause, when read in the original policy language, reveals how imprecise the legal threshold is.
**Physical implementation note**: A professionally printed and bound A4 document with tab dividers. Approximately 40 pages. Key passages pre-highlighted in yellow on the master copy; clean copies for player use. The warranty schedule lists each warranty with its compliance deadline — Warranty W-07 shows "12-month remediation deadline: [DATE]" which is visibly past.

---

### Element: Warranty Compliance Checklist

**Type**: Physical worksheet (paper form)
**Location**: Meridian Claims Suite (on table with claim file)
**Initial state**: Blank — tick-boxes empty for all four warranty rows (W-03, W-07, W-09, W-12)
**How players interact**: Players fill in each row as they review evidence. When all four rows are completed, the checklist feeds into the Coverage Decision Form.
**State changes**: Sets `warranty_checklist_complete = true` when players submit it to Eleanor Vance; she scans it and confirms the preliminary warranty position before players access the Evidence Archive for the underwriting file
**Teaching purpose**: Forces players to make an explicit warranty compliance determination for each control. The W-03 (patch management) row is deliberately ambiguous — the warranty has a safety-constraint exception clause, but Albion's compensating controls were not implemented. Players must decide: Compliant / Breached / Arguable.
**Physical implementation note**: Printed single-sided A4 with pre-filled warranty descriptions. Space for "Evidence found" notes per row. Provides a physical record of player decisions throughout the game.

---

### Element: Claims Management System Terminal (CMS)

**Type**: PC terminal (interactive simulation)
**Location**: Meridian Claims Suite
**Initial state**: Showing James Whitworth's initial incident notification (T+75 minutes post-ESD). Notification fields: event description, systems affected, containment actions, regulatory contacts.
**How players interact**: Browse Albion's policy history, quarterly security posture reports (Q1–Q4 before incident), the extension request submitted by James Whitworth, and the CMS correspondence log
**State changes**:
- Viewing quarterly security posture reports confirms the IT/OT remediation status (W-07 breach evidence) → sets `quarterly_reports_reviewed = true`
- Finding the extension request note confirms that Whitworth submitted it before the incident → relevant to Albion's warranty defence argument
- Viewing the original policy history surfaces the original risk assessment summary and Meridian's renewal decision noting the known deficiencies

**Technical challenge**: In the policy history record, a notations field contains the numeric code for the underwriting file cabinet (a four-digit reference number formatted as a policy annotation). Players must notice this to unlock the underwriting cabinet in the Evidence Archive.

**Teaching purpose**: Shows the insurer's information position — Meridian had detailed knowledge of Albion's security posture through quarterly reporting. This grounds the CLAIM-INS-009 tension: Meridian knew, set a warranty, and renewed the policy anyway.
**Physical implementation note**: Laptop with a custom HTML/CSS simulation. Three main sections: Notifications | Policy History | Correspondence. Key quarterly reports are formatted as structured compliance summaries with traffic-light indicators per warranty.

---

### Element: Forensic Data Platform Terminal (FDP)

**Type**: PC terminal (interactive simulation / VM challenge)
**Location**: Meridian Claims Suite (second workstation) and a duplicate view in Evidence Archive
**Initial state**: Showing the Albion forensic case summary (Section A of `albion_insurance_response_chain.md` rendered as a case management interface)
**How players interact**: Navigate the forensic timeline; access the jump server access log (showing the c.ellison RDP session at 01:47); access the historian time-series data (showing falsified temperatures at 28°C vs. physical thermometer readings in the incident report); review the SIS configuration inspection findings.

**CTF-style challenge — Forensic Evidence Verification**: Players must locate three specific forensic findings that establish causal chain from cyber event to physical damage:
  1. The jump server access log entry (RDP session from dormant account at 01:47)
  2. The historian trend data showing the flat-line anomaly (sensor data falsification)
  3. The SIS post-incident inspection record showing modified thresholds (85°C thermal protection, 3.8% H₂ gas alarm)

  Finding all three and correctly linking them to the policy's "cyber event → physical damage" coverage definition unlocks the Evidence Archive (provides the RFID code or Eleanor Vance issues the RFID pass).

**Cross-case continuity feature**: If Case 2 was played in the same session, the FDP terminal displays an additional "Player Session Data" panel showing the outcomes from Case 2:
  - Was ESD activated before or after the H₂ advisory? (affects outage duration claim)
  - Was NCSC notification filed on time? (affects Albion's regulatory standing)
  - Was Trent Water notified? (affects third-party liability scope)
  - What was the SIS patch recommendation in the Dr Bashir debrief? (affects how Albion characterises its pre-incident decision-making)

  If Case 2 was not played, the FDP displays scenario-default values consistent with the described incident timeline.

**Teaching purpose**: Illustrates the evidence gap problem — the PLC register data was overwritten by the emergency shutdown, so forensic attribution of the SIS manipulation is based on circumstantial reconstruction rather than direct logging. The safety action (pressing ESD) destroyed forensic evidence. This is CLAIM-INS-006 in action.
**Physical implementation note**: A more complex terminal than the CMS — requires players to navigate a multi-tab interface. If full VM is not available, can be implemented as a static HTML file with interactive document navigation.

---

### Element: NCSC Attribution Brief (Sealed Envelope)

**Type**: Physical document prop (sealed envelope)
**Location**: Meridian Claims Suite (on conference table, visibly placed but not to be opened early)
**Initial state**: Sealed with a TLP:AMBER sticker. Labelled "NCSC ATTRIBUTION BRIEF — TO BE OPENED BY CLAIMS MANAGER ONLY — NOT BEFORE WARRANTY REVIEW COMPLETE"
**How players interact**: Players should not open this until warranted by progress — Eleanor Vance will prompt them when the time is appropriate (after `warranty_checklist_complete = true`). Contains a two-page printed NCSC technical assessment: GREYMANTLE attribution at moderate-to-high confidence, Ferryman Collective initial access attribution at high confidence, the two-actor model, and the act-of-war legal analysis.
**State changes**: Opening the brief (with Eleanor Vance's guidance) sets `attribution_brief_reviewed = true` and unlocks the act-of-war discussion in Eleanor's dialogue tree. Players must then decide the act-of-war position on the Coverage Decision Form.
**Teaching purpose**: The sealed format creates a sense that this is genuinely classified and consequential. The two-actor model (IAB + state sponsor) illustrates the attribution complexity that makes the act-of-war exclusion so difficult to apply. Players who expect a clear answer will find the brief frustrating — that frustration is the lesson.
**Physical implementation note**: A4 paper folded in a brown envelope sealed with a red wax-effect sticker (or a "CONFIDENTIAL" seal). Content printed on paper headed with "NATIONAL CYBER SECURITY CENTRE — PROTECTED — TRAFFIC LIGHT PROTOCOL: AMBER."

---

### Element: Underwriting File Cabinet

**Type**: Physical filing cabinet (RFID or combination lock)
**Location**: Meridian Evidence Archive
**Initial state**: Locked — combination is a four-digit policy reference found in the CMS terminal
**How players interact**: Players retrieve the combination from CMS notes, then open the cabinet. Inside: (1) the original underwriting assessment for the Albion policy (including the site visit report noting IT/OT deficiencies), (2) the warranty schedule signed by James Whitworth, (3) the renewal decision memo explicitly acknowledging the known IT/OT boundary weaknesses and the SIS patch deferral, and (4) the extension request letter from Whitworth, dated four months post-deadline.
**State changes**: Accessing the underwriting file sets `underwriting_file_reviewed = true` and enables Eleanor Vance's CLAIM-INS-009 dialogue — the "insurer knowledge of deficiencies" argument. This is the strongest piece of evidence for Albion's defence against the warranty deduction.
**Teaching purpose**: The renewal memo is the scenario's most uncomfortable document. It shows Meridian explicitly acknowledged the risk, set a warranty it knew would be difficult to meet, and renewed the policy anyway. Players who want to invoke the warranty against Albion must confront this document. It makes CLAIM-INS-009 feel real.
**Physical implementation note**: A standard grey filing cabinet. The Albion documents in a tabbed manila folder. Documents are printed A4 with Meridian corporate letterhead (fictional). The renewal memo should be clearly dated and clearly show the underwriting team's awareness of the deficiencies.

---

### Element: Forensic Evidence Packets A, B, C

**Type**: Physical document props (sealed packets)
**Location**: Meridian Evidence Archive (accessible after Evidence Archive unlocked)
**Initial state**: Three sealed A4 padded envelopes marked "EXHIBIT A — IT FORENSICS", "EXHIBIT B — OT FORENSICS", "EXHIBIT C — WARRANTY COMPLIANCE EVIDENCE"
**How players interact**: Players open each packet and read the forensic summaries. Each packet is designed to be read in 5-10 minutes and contains the key findings relevant to that evidence category.
**State changes**:
- Opening Packet A (IT forensics) sets `it_forensics_reviewed = true`
- Opening Packet B (OT forensics) sets `ot_forensics_reviewed = true` — this packet contains the "evidence lost during ESD reset" note, which triggers the CLAIM-INS-006 discussion
- Opening Packet C (warranty compliance evidence) sets `warranty_evidence_reviewed = true` — this provides the specific quarterly reports and remediation status data needed to complete the warranty checklist
**Teaching purpose**: The three-packet structure mirrors a real forensic evidence review. Packet B's "evidence lost" finding is the key SIS trade-off moment: the emergency safety action (pressing ESD) overwrote the forensic evidence needed to prove the insurance claim. Safety restoration and evidence preservation are genuinely competing needs.
**Physical implementation note**: Small padded A4 envelopes. Each contains 4-6 printed pages. Evidence from Packet B should include a specific callout box: "NOTE: PLC-BMS registers containing falsified sensor values were overwritten during emergency shutdown sequence. Forensic reconstruction of exact pre-shutdown sensor values relies on historian data only."

---

### Element: Loss Adjustment Summary (Osei Report)

**Type**: Physical document prop
**Location**: Meridian Claims Suite (in sealed packet on table, to be opened after Aim 2)
**Initial state**: Sealed envelope marked "FAIRBRIDGE ASSOCIATES — INDEPENDENT LOSS ADJUSTMENT — CONFIDENTIAL"
**How players interact**: Players open and review the report. It contains the four-category quantum breakdown: (a) IR costs £1.4M, (b) business interruption £4.8M, (c) physical damage £1.6M, (d) third-party (Trent Water) £0.4M. It also identifies the contested deduction argument — Meridian's position that some of the outage duration represents pre-existing SIS maintenance obligation (the deferred patch recertification).
**State changes**: Reviewing the report sets `loss_quantum_reviewed = true` and unlocks the business interruption calculation discussion with David Osei (phone NPC). Players can call Osei to understand the contested portion of the business interruption claim before making their coverage decision.
**Teaching purpose**: The contested business interruption portion (the SIS recertification period) creates a genuine SIS-informed debate: is the six-week outage entirely caused by the attack, or was some of it inevitable given the deferred patch? This connects directly to the Case 2 decision — if the patch had been applied earlier, recertification would have been shorter.
**Physical implementation note**: A professional-looking 6-page report with Fairbridge Associates letterhead. Table of loss categories, narrative explanation of calculation methodology, and a specific section on "Contested Items" flagging the SIS recertification duration argument.

---

### Element: Coverage Decision Form

**Type**: Physical form (paper prop)
**Location**: Meridian Claims Suite (in a tray on Eleanor's desk, given to players at the start of Aim 7)
**Initial state**: Blank
**How players interact**: Players complete the form after working through all evidence. Three sections:
  - Section 1: **Coverage Position** — tick A (full: ~£8.2M), B (partial: tick and write % deduction and basis), or C (decline: cite grounds)
  - Section 2: **Act-of-War Exclusion** — tick: Invoke / Preserve Right Without Invoking / Expressly Waive. Provide brief justification.
  - Section 3: **Regulatory Disclosure** — tick: Support Full NCSC Disclosure / Advise Restricted Disclosure. Brief rationale.

  Players sign and date the form. Eleanor Vance reviews it and enters the decision into the CMS. The form is the physical culmination of the scenario.
**State changes**: Form submission sets `coverage_decision_made = true` and `coverage_decision = [A/B/C]` and `war_exclusion_invoked = [true/false]`. These drive Eleanor Vance's closing debrief dialogue.
**Teaching purpose**: Making a written decision on paper creates accountability that screen interactions do not. Players are committing to a position. Eleanor's debrief then explores whether their reasoning is consistent with the evidence they found. If players chose Position C (decline) without having read the underwriting file, Eleanor can ask how they square that with Meridian's own renewal memo.
**Physical implementation note**: A single-sided A4 form with clear tick-box layout. Meridian letterhead. Space for written justifications (3-4 lines per section). Designed to be completed in 5-10 minutes.

---

### Element: Wall Timeline Display

**Type**: Physical or digital wall display
**Location**: Meridian Claims Suite (whiteboard or screen)
**Initial state**: Shows key dates: Incident occurred / ESD activated / NCSC notified / Meridian notification received / Evidence preservation notice sent / Evidence Archive access granted / Current time (T+48 hours in scenario)
**How players interact**: Passive reference — updates visually as scenario milestones are reached. Not interactive.
**State changes**: Timeline updates when: claim received, evidence archive accessed, NCSC attribution brief opened, coverage decision submitted.
**Teaching purpose**: Keeps players anchored in the insurance response timeline. The 72-hour NIS notification window, the evidence preservation notice timing, and the claims response SLA are all visible, reinforcing the regulatory time-pressure dimension without requiring a countdown mechanic.
**Physical implementation note**: A whiteboard with dates pre-written, with sticky-note additions as the game progresses, OR a wall-mounted display updated by the game server. Low effort; high atmosphere.

---

## Section 3: State Machine

---

### Global Variables

```
claim_received: boolean
Initial: false
Represents: Players have acknowledged Whitworth's notification and confirmed Meridian has received a major claim.

policy_reviewed: boolean
Initial: false
Represents: Players have located the insuring clause, warranty schedule, and act-of-war exclusion in the policy binder.

evidence_archive_unlocked: boolean
Initial: false
Represents: Eleanor Vance has issued the RFID pass to the Evidence Archive. Triggered when policy_reviewed = true AND FDP forensic challenge complete.

quarterly_reports_reviewed: boolean
Initial: false
Represents: Players have reviewed Albion's quarterly security posture reports in the CMS, confirming IT/OT remediation status at time of incident.

warranty_checklist_complete: boolean
Initial: false
Represents: Players have completed the Warranty Compliance Checklist covering W-03, W-07, W-09, W-12.

it_forensics_reviewed: boolean
Initial: false
Represents: Players have reviewed Packet A (IT forensics summary) in the Evidence Archive.

ot_forensics_reviewed: boolean
Initial: false
Represents: Players have reviewed Packet B (OT forensics summary). Key moment: the evidence-lost-during-ESD-reset finding.

warranty_evidence_reviewed: boolean
Initial: false
Represents: Players have reviewed Packet C (warranty compliance evidence).

underwriting_file_reviewed: boolean
Initial: false
Represents: Players have opened the underwriting file cabinet and reviewed the renewal memo acknowledging known deficiencies.

loss_quantum_reviewed: boolean
Initial: false
Represents: Players have reviewed David Osei's loss adjustment summary.

attribution_brief_reviewed: boolean
Initial: false
Represents: Players have opened and read the NCSC Attribution Brief (TLP:AMBER).

trent_water_assessed: boolean
Initial: false
Represents: Players have decided whether to include the Trent Water third-party exposure in the initial coverage scope or refer it out pending further investigation.

coverage_decision_made: boolean
Initial: false
Represents: Players have completed and submitted the Coverage Decision Form.

coverage_decision: enum { not_yet, full, partial, decline }
Initial: not_yet
Represents: Players' chosen coverage position (A = full, B = partial, C = decline).

war_exclusion_invoked: boolean
Initial: false
Represents: Players chose to invoke the act-of-war exclusion on the Coverage Decision Form.

disclosure_position: enum { not_yet, full, restricted }
Initial: not_yet
Represents: Players' regulatory disclosure recommendation.

debrief_complete: boolean
Initial: false
Represents: Eleanor Vance's post-decision debrief has concluded.
```

---

### Event Triggers

```
TRIGGER: Players find the insuring clause and warranty schedule in the policy binder (Aim 1)
CAUSES: policy_reviewed = true
PHYSICAL: Eleanor Vance advances dialogue to issue Evidence Archive RFID pass
NPC: Eleanor: "Good — you've confirmed the event falls within coverage as defined. Now we need to establish whether any exclusions apply and whether the warranties were met. The Evidence Archive has the forensic packets."
TEACHES: The insuring clause establishes what type of event is covered; warranties are the conditions on that coverage

TRIGGER: FDP forensic challenge completed (three forensic findings verified: RDP session, historian anomaly, SIS threshold inspection)
CAUSES: evidence_archive_unlocked = true; Eleanor issues RFID pass
PHYSICAL: Evidence Archive door releases
NPC: Eleanor: "You've traced the causal chain. That's sufficient to confirm this is a covered event. The question now is warranty compliance."
TEACHES: Establishing causal chain from cyber event to physical damage is essential for coverage confirmation

TRIGGER: Players open Packet B (OT forensics) and reach the evidence-lost-during-ESD-reset finding
CAUSES: ot_forensics_reviewed = true
PHYSICAL: No lamp change — this is a document discovery
NPC: Eleanor Vance becomes available to discuss CLAIM-INS-006 (evidence preservation vs. safety restoration)
TEACHES: The hardwired ESD that saved the facility destroyed the forensic evidence that proves the claim. Safety action and evidence preservation are in direct conflict.

TRIGGER: Players review the underwriting file (renewal memo)
CAUSES: underwriting_file_reviewed = true
PHYSICAL: No lamp change
NPC: Eleanor Vance's dialogue unlocks a new debrief topic: CLAIM-INS-009 (insurer knowledge of deficiencies)
TEACHES: Meridian knew about the IT/OT boundary weakness and the deferred SIS patch. It set a warranty, renewed the policy, and accepted the risk. This complicates invoking the warranty against Albion.

TRIGGER: Players open the NCSC Attribution Brief
CAUSES: attribution_brief_reviewed = true
PHYSICAL: Wall timeline display updates: "Attribution Assessment: Received"
NPC: Robert Ngata can now be called for discussion; Eleanor's act-of-war dialogue unlocks
TEACHES: Attribution confidence and the legal threshold for "act of war" are different standards. State attribution at intelligence confidence does not mean legal standard for exclusion is met.

TRIGGER: Coverage Decision Form submitted (coverage_decision_made = true)
CAUSES: coverage_decision and war_exclusion_invoked and disclosure_position set
PHYSICAL: Wall display updates: "Coverage Position: [POSITION A/B/C]"; Eleanor Vance transitions to debrief mode
NPC: Eleanor Vance begins the closing debrief. Her dialogue branches based on coverage_decision and whether underwriting_file_reviewed = true.
TEACHES: The coverage decision has safety policy implications beyond this single claim

TRIGGER: war_exclusion_invoked = true
CAUSES: (no state change — this is noted in Eleanor's debrief)
PHYSICAL: No immediate physical change; consequence discussed in Eleanor debrief
NPC: Eleanor: "Invoking the exclusion based on current attribution confidence will almost certainly result in litigation and Lloyd's scrutiny. And think about the precedent: if insurers routinely decline critical infrastructure claims citing state attribution, what happens to the financial incentive for security investment at these organisations?"
TEACHES: CLAIM-INS-008 — invoking act-of-war exclusion for state-sponsored peacetime cyber operations undermines the safety value of critical infrastructure cyber insurance
```

---

### Degraded/Suboptimal States

There is no "losing" state in the traditional sense. However, players can reach notably weak coverage positions:

**Position C (decline) without reading the underwriting file**: Eleanor Vance will challenge the decision directly during debrief — the renewal memo shows Meridian's own knowledge of the deficiencies makes declining coverage legally and reputationally very risky.

**Invoking act-of-war exclusion**: Eleanor Vance explains the legal and commercial risk in debrief. Robert Ngata (if called) notes that this approach would leave Albion — a critical infrastructure operator that nearly suffered a thermal runaway — without insurance recovery for a state-sponsored attack.

**Trent Water excluded without assessment**: If players have not made a Trent Water determination and submit the coverage form, Eleanor flags it as an outstanding item — the form cannot be considered complete without a position on the third-party liability scope.

---

### Completing/Best States

**Best outcome**: Position B (partial coverage, proportionate deduction for W-07 breach) + Act-of-war expressly waived + Full NCSC disclosure + Trent Water included in initial scope. Eleanor Vance's debrief affirms this as the most legally defensible and commercially sustainable position.

**Acceptable outcomes**: Full coverage (Position A) with awareness of the warranty deduction argument is defensible if players found and engaged with the underwriting renewal memo. Eleanor does not penalise this choice — she notes it is commercially generous but legally exposed.

---

## Section 4: NPC Design

---

### NPC: Eleanor Vance — Claims Manager, Meridian Cyber Insurance

**Appearance location**: Meridian Claims Suite; present throughout scenario. Person NPC at a designated desk/chair position.
**Background**: Eleanor Vance leads Meridian's claims function. Fifteen years in the Lloyd's market, two hundred cyber claims handled, fewer than a dozen involving operational technology. She is methodical and commercially astute. She is the player's guide throughout but is not neutral — she has her own instincts about the right coverage position, and those instincts are shaped by Meridian's reputation and her professional experience. She is not there to tell players what to do, but she knows what the consequences of each decision look like.
**Initial stance**: Focused on getting the facts right before making any coverage determination. Cautious about jumping to conclusions. She is already aware that the IT/OT remediation warranty was breached.
**Key information she holds**:
- The policy structure and what each exclusion means in plain terms
- Meridian's internal deliberations on the act-of-war exclusion (she has legal counsel's advice)
- The underwriting renewal context (she was not the underwriter, but she has read the file)
- Her own professional view on each decision point — which she will share if asked
**Dialogue branches**:
1. **Aim 1 — Initial briefing**: Explains the three coverage issues (warranty, act-of-war, cyber-physical classification). Issues the Evidence Archive pass once policy is reviewed.
2. **Warranty review**: Discusses each warranty in turn. For W-03 (SIS patch), she articulates the dilemma: "The warranty has a safety-constraint exception. Albion documented the risk. But the compensating controls were never implemented. Is that compliance, partial compliance, or breach?"
3. **Underwriting file discussion** (only after `underwriting_file_reviewed = true`): "That renewal memo is the uncomfortable document in this file. We knew about the IT/OT boundary. We set a warranty we believed would incentivise remediation. Albion didn't remediate. The question now is whether our knowledge of the risk waives our contractual remedy — and it doesn't, under the Insurance Act. But the court of reputation is not the Court of Appeal."
4. **Act-of-war discussion** (only after `attribution_brief_reviewed = true`): "The brief says moderate-to-high confidence. The court standard for 'act of war' is substantially higher. Counsel's advice is not to invoke. But our syndicates are going to ask why we're paying a claim where the NCSC is pointing at a state intelligence service."
5. **Coverage debrief** (after form submission): Branches based on `coverage_decision`, `war_exclusion_invoked`, and `underwriting_file_reviewed`. Synthesises the SIS implications of the coverage decision.
**How she reacts to state changes**:
- `underwriting_file_reviewed = true`: her dialogue shifts from professional to slightly uncomfortable — she is more candid about Meridian's own role
- `war_exclusion_invoked = true` on the form: she challenges the decision before accepting the form
- `coverage_decision = decline`: she refuses to log the decision until players have engaged with at least the warranty evidence and the underwriting file
**SIS teaching purpose**: Eleanor represents the insurer's perspective on safety-informed security. She embodies CLAIM-INS-009 — she understands that Meridian's warranty conditions are indirect safety controls, and that Meridian's knowledge of deficiencies creates a moral position that the contract alone does not resolve. She is the vehicle for the scenario's final synthesis: insurance as a safety governance mechanism.

---

### NPC: James Whitworth — Risk Manager, Albion Energy Storage (Phone NPC)

**Appearance location**: Accessible via phone in Meridian Claims Suite throughout scenario
**Background**: Albion's Risk Manager, who filed the incident notification. He is anxious, defensive about the warranty breach, and commercially driven to restore the facility as quickly as possible. He knows about the IT/OT remediation deadline breach. He knows about the deferred SIS patch. He does not volunteer this information — he answers direct questions, but his answers are carefully worded.
**Initial stance**: Cooperative but guarded. His priority is minimising the coverage deduction and resuming operations.
**Key information he holds**:
- The operational reason the IT/OT remediation was delayed (resource constraints, vendor scheduling, a competing priority from the National Grid ESO ancillary services upgrade)
- The extension request history (submitted four months after the deadline, under review at incident time)
- Albion's argument that the SIS patch deferral was a legitimate safety decision under IEC 61511, not a security failure
- The business interruption quantum (frustrated by Meridian's contested deduction on the SIS recertification period)
**Dialogue branches**:
1. **Initial call — why was W-07 not remediated in time?**: "The historian migration and jump server reconfiguration were on the work plan. Vendor scheduling pushed us back. We filed an extension request before the incident — that should be on file."
2. **On the SIS patch deferral**: "The patch would have required eight weeks offline and £180,000 in recertification. We documented the risk. We accepted it with a compensating control commitment. The compensating controls were — look, they were in progress. The SOC scope was under review."
3. **On the business interruption deduction**: "The six-week outage is entirely attributable to the incident. Without the attack, the SIS recertification would have happened in a planned maintenance window, not as an emergency rebuild. You can't charge us for a pre-existing maintenance obligation we never missed."
4. **On NCSC disclosure**: "Our solicitor is managing the regulatory filings. We're complying with NIS requirements. I'd appreciate it if Meridian isn't complicating our regulatory relationships by pressing for disclosures that haven't been legally reviewed."
**SIS teaching purpose**: Whitworth represents the policyholder's perspective on the security-safety patching dilemma. He is not dishonest — the SIS patch deferral genuinely did involve a safety trade-off. But his compensating controls were never implemented. He embodies the "risk accepted but never actually mitigated" pattern that the scenario is built around.

---

### NPC: David Osei — Loss Adjuster, Fairbridge Associates (Phone NPC)

**Appearance location**: Accessible via phone in Meridian Claims Suite; becomes available after `loss_quantum_reviewed = true`
**Background**: Senior loss adjuster at Fairbridge Associates, on Meridian's panel. He is professionally impartial and technically methodical. He has extensive experience quantifying cyber claims but limited familiarity with ICS environments — he needed Marcus Webb to explain the SIS configuration findings to him. His report is his professional opinion, and he stands by it, but he is honest about the areas of uncertainty.
**Initial stance**: Impartial, matter-of-fact. Provides financial analysis. Does not advocate for either side.
**Key information he holds**:
- The detailed breakdown behind each loss category
- The contested business interruption argument (he has assessed both Meridian's and Albion's positions; he provides his view on the most defensible position)
- The evidence gaps he encountered (the PLC register overwrite; the SIS audit log absence) and how they affected his findings
- The Trent Water third-party exposure estimate (£400,000 is his provisional figure pending further investigation)
**Dialogue branches**:
1. **On the business interruption calculation**: "I've quantified the six-week outage against Albion's National Grid ESO contract revenue baseline. Meridian's deduction argument — that the SIS recertification period was pre-existing maintenance — is legally arguable, but I've not found evidence that Albion had scheduled that work independently of the incident. In my assessment, the full six weeks is attributable."
2. **On the evidence gaps**: "The PLC registers that would have given us the exact falsified sensor values at time of attack were reset by the ESD. I understand why — it was a safety emergency. But it means I'm relying on the historian's recorded values, which were themselves falsified. There's a layer of circular reasoning in there that the forensic team has tried to address."
3. **On the Trent Water exposure**: "Trent Water's investigation is ongoing. My £400,000 figure is provisional — it's based on Trent Water's own initial estimate of investigation costs. Whether that escalates to include remediation, and whether Albion's third-party coverage limit is sufficient, depends on what the Trent Water forensics find."
**SIS teaching purpose**: Osei represents the financial quantification dimension of cyber-physical incidents. He brings CLAIM-INS-006 to life — the evidence preservation vs. safety restoration conflict has a direct financial consequence: reduced claim quantum because evidence was lost.

---

### NPC: Robert Ngata — Incident Liaison, NCSC (Phone NPC)

**Appearance location**: Accessible via phone after `attribution_brief_reviewed = true`
**Background**: The NCSC officer assigned to the Albion incident. His interest is in full and immediate technical disclosure to protect other critical infrastructure operators from the same threat actor. He is cooperative but firm about the public interest rationale for disclosure.
**Initial stance**: Collegial but direct. He understands Meridian's commercial interests but does not defer to them.
**Key information he holds**:
- The GREYMANTLE attribution assessment (in more depth than the TLP:AMBER brief; he can provide context off the record)
- The two-actor model (Ferryman Collective + GREYMANTLE) and why it complicates the act-of-war question
- The Trent Water cross-sector risk status (Trent Water's own investigation has not found active ICS compromise, but a suspicious workstation artefact suggests possible lateral movement)
- The NCSC's position on insurer invocation of act-of-war exclusions for state-sponsored attacks
**Dialogue branches**:
1. **On the attribution brief**: "We're comfortable with the GREYMANTLE attribution at the confidence level in the brief. That said, I want to be direct: I've seen insurers use attribution briefs to invoke war exclusions, and it never ends well — for the policyholder, for the market, or for the security ecosystem. State-sponsored attacks on critical infrastructure should not become uninsurable."
2. **On the act-of-war exclusion**: "I understand the commercial logic. But think about what you're creating: if every critical infrastructure operator knows that a nation-state attack may result in a declined insurance claim, the financial incentive to invest in security against nation-state threats disappears. That's exactly the investment category that matters most."
3. **On NCSC disclosure**: "We need the indicators of compromise. Not for enforcement purposes — that's Ofgem's job, not ours. We need them to protect other operators. The Ferryman Collective is active. They sold access at least twice last year. If we can share the technical profile quickly, we may be able to prevent the next incident."
4. **On Trent Water**: "The Trent Water situation is under active investigation. I can tell you there's no confirmed ICS intrusion at this point. But I'd encourage Meridian to be generous with the third-party coverage scope here — if Trent Water's water supply had been affected, you'd be looking at a very different claim."
**SIS teaching purpose**: Ngata represents the public interest dimension of insurance coverage decisions. He makes the connection between the act-of-war exclusion (a commercial insurance mechanism) and its systemic effect on security investment at safety-critical infrastructure. He embodies CLAIM-INS-008.

---

## Section 5: Objectives and Task Flow

---

### Aim 1: Confirm Coverage — Is Albion's Claim Within Policy Scope?

**Unlocks when**: Scenario starts (Eleanor Vance introduces the case)
**Player task**: Review the policy binder to confirm the Albion incident is a covered event; identify the insuring clause, the cyber-physical damage coverage, and the three potential coverage issues (warranty, act-of-war, non-contribution)
**Location**: Meridian Claims Suite
**Interactions required**: Policy binder (find tabs 1–3); Eleanor Vance (initial briefing); CMS terminal (review incident notification)
**Completion condition**: Players tell Eleanor they have confirmed coverage prima facie, identified the three issues, and are ready to begin the evidence review
**Consequence on completion**: Eleanor issues Evidence Archive RFID pass (pending FDP forensic challenge); `policy_reviewed = true`
**Time pressure?**: Mild — Eleanor notes that the 48-hour evidence preservation window is running. Not a countdown mechanic, but referenced in NPC dialogue.
**SIS concept illustrated**: Insurance policy as the contractual interface between security obligations and financial protection; insuring clause explicitly covers cyber-physical loss (IEC 61511 SIS context)

*This is a mandatory opening objective — all players must complete.*

---

### Aim 2: Trace the Forensic Chain

**Unlocks when**: Aim 1 complete
**Player task**: Use the Forensic Data Platform terminal to locate and link three specific forensic findings that establish the causal chain from cyber event to physical safety consequence
**Location**: Meridian Claims Suite
**Interactions required**: FDP terminal (locate: RDP session log at 01:47, historian flat-line anomaly, SIS post-incident threshold inspection record); Eleanor Vance (confirms when all three found)
**Completion condition**: All three forensic findings identified and linked to the coverage confirmation — "cyber event → physical damage" causal chain established
**Consequence on completion**: Evidence Archive unlocked; `evidence_archive_unlocked = true`; Eleanor issues RFID pass
**Time pressure?**: No
**SIS concept illustrated**: Establishing causal chain from cyber event to physical consequence; evidence gaps from the ESD reset (forensic evidence destroyed by safety action); CLAIM-INS-006

*Mandatory.*

---

### Aim 3: Assess Warranty Compliance

**Unlocks when**: Evidence Archive unlocked (Aim 2 complete)
**Player task**: Review the forensic evidence packets (A, B, C) and CMS quarterly reports; fill in the Warranty Compliance Checklist (W-03, W-07, W-09, W-12)
**Location**: Meridian Claims Suite and Evidence Archive
**Interactions required**: Evidence Packets A, B, C; CMS terminal (quarterly reports); Warranty Compliance Checklist (physical form); Eleanor Vance (discussion of W-03 SIS patch arguability)
**Completion condition**: Warranty checklist completed and submitted to Eleanor. All four warranties assessed.
**Consequence on completion**: `warranty_checklist_complete = true`; Eleanor provides preliminary warranty position and notes that the underwriting file in the Evidence Archive is now relevant; NCSC Attribution Brief can be opened
**Time pressure?**: No
**SIS concept illustrated**: CLAIM-INS-001 (IT/OT segmentation as coverage condition), CLAIM-INS-003 (patch management with safety constraint), the SIS patching dilemma viewed from insurer's perspective

*Mandatory.*

---

### Aim 4: Review the Underwriting File

**Unlocks when**: Aim 3 complete (Eleanor directs players to the underwriting cabinet)
**Player task**: Locate the four-digit cabinet code in the CMS policy notes; open the underwriting file cabinet; review the renewal memo and the signed warranty schedule
**Location**: Evidence Archive
**Interactions required**: CMS terminal (find the code); underwriting file cabinet (combination lock); underwriting file (read renewal memo)
**Completion condition**: `underwriting_file_reviewed = true`; players report the renewal memo content to Eleanor
**Consequence on completion**: Eleanor unlocks the CLAIM-INS-009 dialogue thread; Albion's warranty defence argument now fully available; players may call James Whitworth to discuss the extension request
**Time pressure?**: No
**SIS concept illustrated**: CLAIM-INS-009 (insurer knowledge of safety-relevant deficiencies); the insurer's moral position when it has accepted a known safety-relevant risk and set a warranty it knew would be difficult to meet

*Mandatory — this is the scenario's most important single discovery.*

---

### Aim 5: Open the NCSC Attribution Brief

**Unlocks when**: Aims 3 and 4 both complete (Eleanor signals the moment is right)
**Player task**: Open the sealed NCSC Attribution Brief; read the two-actor model assessment; make an initial act-of-war determination in discussion with Eleanor
**Location**: Meridian Claims Suite
**Interactions required**: NCSC Attribution Brief (sealed envelope); Eleanor Vance (act-of-war discussion); optionally, Robert Ngata (call for NCSC perspective)
**Completion condition**: `attribution_brief_reviewed = true`; players have discussed act-of-war position with Eleanor and are ready to formalise on the Coverage Decision Form
**Consequence on completion**: Robert Ngata can now be called for NCSC perspective; act-of-war section on Coverage Decision Form now available to complete
**Time pressure?**: No
**SIS concept illustrated**: CLAIM-INS-008 (act-of-war exclusion and attribution confidence standards); the systemic effect of invoking state-sponsored attack exclusions on critical infrastructure security investment incentives

*Mandatory.*

---

### Aim 6: Quantify the Claim and Assess Trent Water

**Unlocks when**: Aim 3 complete
**Player task**: Review David Osei's loss adjustment summary; call Osei to discuss the contested business interruption deduction; make a Trent Water scope determination
**Location**: Meridian Claims Suite
**Interactions required**: Loss Adjustment Summary (document prop); David Osei (phone); Eleanor Vance (Trent Water discussion); optionally, Robert Ngata (Trent Water safety status)
**Completion condition**: `loss_quantum_reviewed = true` and `trent_water_assessed = true`; players have confirmed the quantum and Trent Water position
**Consequence on completion**: Players now have all the information needed to complete the Coverage Decision Form
**Time pressure?**: No
**SIS concept illustrated**: CLAIM-INS-007 (shared infrastructure risk as coverage boundary); evidence gaps affecting loss quantum; business interruption and the SIS recertification period as contested territory

*Mandatory.*

---

### Aim 7: Make the Coverage Decision

**Unlocks when**: Aims 4, 5, and 6 all complete
**Player task**: Complete and submit the Coverage Decision Form. Choose: Position A/B/C; act-of-war position; regulatory disclosure recommendation.
**Location**: Meridian Claims Suite
**Interactions required**: Coverage Decision Form (physical form); Eleanor Vance (reviews and challenges if Position C without underwriting file review)
**Completion condition**: `coverage_decision_made = true`; form submitted to Eleanor
**Consequence on completion**: Eleanor enters the decision into CMS (narrative moment — she types, wall display updates); Eleanor transitions to closing debrief
**Time pressure?**: No
**SIS concept illustrated**: The coverage decision as the insurance mechanism's output — the financial consequence that determines whether insurance functions as an incentive for safety-critical security investment

*Mandatory.*

---

### Aim 8 (Optional): Regulatory Disclosure Coordination

**Unlocks when**: Robert Ngata becomes available (Aim 5) or players call him proactively
**Player task**: Call Robert Ngata; discuss the tension between full NCSC disclosure, Albion's legal position, and Meridian's claims interest; make a disclosure recommendation (recorded on the Coverage Decision Form Section 3)
**Location**: Meridian Claims Suite
**Interactions required**: Robert Ngata (phone); Eleanor Vance (Meridian's commercial interest in disclosure)
**Completion condition**: `disclosure_position` set to full or restricted on the Coverage Decision Form
**Consequence on completion**: If disclosure_position = full → Eleanor notes this creates short-term friction with Albion's solicitor but supports the NCSC's protection mission; if restricted → Eleanor notes this may result in NCSC criticism of Meridian's role in managing the policyholder's disclosure obligations
**Time pressure?**: No
**SIS concept illustrated**: Multi-organisational information asymmetry; the insurer's interest in regulatory disclosure vs. policyholder and public interest; CLAIM-INS-006

*Optional but encouraged.*

---

### Aim 9: Closing Debrief — Insurance as Safety Governance

**Unlocks when**: Aim 7 complete (coverage_decision_made = true)
**Player task**: Engage with Eleanor Vance's post-decision debrief. Discuss the coverage decision's implications. She will address up to three debrief topics depending on what players did:
  - **Always**: The role of insurance warranties as indirect safety controls — how CLAIM-INS-001 and CLAIM-INS-003 function as financial enforcement mechanisms for IEC 61511 requirements
  - **If war_exclusion_invoked = true**: The systemic risk of declining critical infrastructure claims on state attribution grounds
  - **If underwriting_file_reviewed = true**: CLAIM-INS-009 — what Meridian's renewal decision implies about the insurer's moral position when warranted safety controls remain unimplemented
  - **Always if sequential play**: The meta-reflection — if players played Case 2, Eleanor draws the direct connection: "The team who were in this building's Battery Hall last year made decisions about that SIS patch. Those decisions are the subject of this claim."
**Location**: Meridian Claims Suite
**Interactions required**: Eleanor Vance
**Completion condition**: `debrief_complete = true`; Eleanor concludes
**SIS concept illustrated**: Full synthesis of insurance as safety governance mechanism; Meridian's warranty conditions as the financial incentive layer on top of IEC 61511's technical requirements

*Mandatory closing segment.*

---

## Section 6: SIS Teaching Moment Mapping

| Game Event | SIS Concept | CyBOK SIS TG Topic | Learning Outcome |
|------------|-------------|---------------------|------------------|
| Player finds insuring clause covering "physical loss or damage arising from cyber event" | Cyber-physical loss as insurable event | Language and Concepts | Learner understands that safety consequences of cyber attacks can be quantified as financial losses — insurance connects cybersecurity to safety economics |
| Player reviews W-07 (IT/OT segmentation warranty) and confirms breach | Security control as coverage condition | Architecture | Learner sees how an insurance warranty operationalises the IEC 61511 SIS independence requirement with a financial enforcement mechanism |
| Player reviews W-03 (SIS patch management with safety constraint exception) | Security-safety patching dilemma | Patching and Security Updates | Learner sees how an insurance product can explicitly acknowledge the SIS recertification constraint — and how Albion failed to implement the required compensating controls |
| Player opens underwriting renewal memo (Meridian knew about the deficiencies and renewed anyway) | Insurer knowledge and moral position | Organisational Culture | Learner understands that acceptance of known risks by an insurer does not create a legal duty — but creates a reputational and moral complication when that risk materialises as a safety event |
| Player finds "evidence lost during ESD reset" in OT forensics packet | Evidence preservation vs. safety restoration | Incident Response in OT Environments | Learner experiences the direct conflict: the safety action (ESD) that prevented thermal runaway also destroyed the forensic evidence needed to prove the insurance claim |
| Player reads NCSC Attribution Brief and works through the two-actor model | Attribution complexity and insurance exclusions | Incident Response in OT Environments | Learner understands that intelligence attribution confidence and legal standard for "act of war" are different thresholds — and that state-sponsored cyber operations in peacetime do not automatically trigger war exclusions |
| Player decides whether to invoke act-of-war exclusion | Systemic effect of exclusions on security investment incentives | Organisational Culture / Requirements and Reconciliation | Learner sees how an insurer's exclusion decision affects the financial incentive for security investment at safety-critical organisations — invocation undermines the insurance mechanism as a safety governance tool |
| Player assesses Trent Water third-party exposure | Cross-sector safety dependency and insurance scope | Requirements and Reconciliation | Learner understands that shared infrastructure between an energy operator and a water utility creates third-party liability exposure with safety implications for water supply |
| Player reviews contested business interruption calculation (SIS recertification period) | Deferred maintenance and causal attribution | Patching and Security Updates | Learner grapples with: is the recertification period part of the attack's consequences, or a pre-existing maintenance obligation that would have happened anyway? The answer depends on whether the patch deferral was reasonable — connecting back to Case 2's SIS patch dilemma |
| Eleanor Vance's closing debrief on insurance as safety governance | Insurance warranties as indirect safety controls | Organisational Culture | Learner synthesises: cyber insurance is not just financial protection — it is a governance mechanism that shapes security behaviour at safety-critical organisations through financial incentives. Its failure to enforce its own conditions is a safety governance failure. |

---

### SIS Learning Journey — Narrative Summary

A player who completes this scenario will understand a perspective on security-informed safety that neither Case 1 nor Case 2 provides: the view from the financial institution that sits behind the safety-critical operator.

They will enter as someone who probably expects insurance to be a financial transaction — policy premium exchanged for financial recovery when something goes wrong. By the end, they will understand that Meridian's warranty conditions on Albion's policy were not just commercial risk management. Warranty W-07 (IT/OT segmentation) and W-03 (SIS patch management) are, in effect, a financial expression of the same requirements that IEC 61511 demands on technical grounds. The insurer is — or should be — an enforcer of the safety architecture, at one remove, through the threat of coverage reduction.

The scenario's central uncomfortable insight is that this mechanism failed. Not because it was badly designed — CLAIM-INS-003's explicit acknowledgement of the SIS recertification constraint shows sophisticated safety-aware underwriting — but because the insurer accepted a known risk, set a warranty it knew would be difficult to enforce, and then did not enforce it when the deadline passed. Albion's compensating controls were never implemented. Meridian knew. Nobody acted.

By the time Eleanor Vance's debrief connects this to the Battery Hall that was three degrees from thermal runaway, learners should feel the weight of that institutional inaction. Insurance as safety governance is only as effective as the willingness to enforce the conditions that make it so.

---

## Design Checklist

- [x] At least one RFID/physical lock mechanic — Evidence Archive door (RFID pass from Eleanor); Underwriting File Cabinet (combination from CMS)
- [x] At least one PC/VM terminal challenge — FDP forensic chain verification challenge
- [x] At least one physical alarm or gauge that changes state — Wall Timeline Display (updates on milestones)
- [x] At least one NPC dialogue tree with genuine branching based on player choice — Eleanor Vance (branches on coverage_decision, war_exclusion_invoked, underwriting_file_reviewed)
- [x] At least two distinct SIS trade-off decisions — (1) Warranty W-03: enforce vs. acknowledge safety-legitimate deferral; (2) act-of-war exclusion vs. critical infrastructure insurability
- [x] Patching constraint tension explicitly represented — CLAIM-INS-003 / Warranty W-03; the contested business interruption calculation (SIS recertification period)
- [x] Scenario completable in 45-75 minutes — 9 aims, most document-driven; target 60 minutes for a four-player team
- [x] SIS teaching moment map covers at least 8 distinct learning outcomes — 10 rows in the table above
