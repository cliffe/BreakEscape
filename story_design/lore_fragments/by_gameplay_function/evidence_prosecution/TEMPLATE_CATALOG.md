# Evidence Template Catalog - ENTROPY Agent Identification

**Purpose:** Reusable evidence templates for identifying NPCs as ENTROPY agents/assets
**Location:** `story_design/lore_fragments/by_gameplay_function/evidence_prosecution/`
**Template Count:** 6 comprehensive evidence types
**Substitution System:** [PLACEHOLDER] format for runtime NPC assignment

---

## Template System Overview

### How Templates Work

Each template is a **complete evidence fragment** with placeholder variables that can be substituted at game runtime with specific NPC names, organizations, dates, and other contextual details.

**Template Format:**
```markdown
[SUBJECT_NAME] → Actual NPC name
[ORGANIZATION] → Company/organization name
[POSITION] → Job title/role
[AMOUNT] → Dollar amounts
[DATE] → Appropriate game timeline dates
```

**Usage in Game:**
1. Select template based on evidence type needed
2. Substitute all [PLACEHOLDER] variables with scenario-specific values
3. Adjust details to match NPC's role and storyline
4. Deploy as discoverable LORE fragment

---

## The Six Evidence Templates

### 1. TEMPLATE_AGENT_ID_001: Encrypted Communications

**File:** `TEMPLATE_AGENT_ID_001_encrypted_comms.md`

**Evidence Type:** Digital - Suspicious encrypted email communications

**What It Provides:**
- Intercepted PGP-encrypted email from corporate account to ProtonMail
- After-hours communication (23:47 timestamp)
- References to "payment arrangement" and "documentation transfer"
- Security policy violations (encryption on corporate email)
- References to bypassing security procedures

**Substitution Variables:**
- [SUBJECT_NAME] - NPC's name
- [ORGANIZATION] - Company name
- [POSITION] - Job title
- [CURRENT_DATE] - Appropriate game date

**Red Flags Documented:**
🚩 Encrypted communication from work email (policy violation)
🚩 ProtonMail recipient (anonymous service)
🚩 After-hours timing (secretive)
🚩 "Payment arrangement confirmed" (financial transaction)
🚩 Security audit bypass offer (insider threat)
🚩 "Documentation transfer via agreed method" (covert exfiltration)

**Evidence Strength:**
- Alone: 40% confidence (circumstantial)
- + Financial records: 75% confidence
- + Access logs: 65% confidence
- + All evidence types: 90% confidence

**Best Used For:**
- Initial suspicion flag
- Corporate infiltration scenarios
- Data exfiltration cases
- Insider threat identification

**Gameplay Integration:**
- Triggers investigation unlock on NPC
- Enables surveillance mission
- Requires corroboration for action
- Multiple approach choices (immediate confrontation vs. continued monitoring)

---

### 2. TEMPLATE_AGENT_ID_002: Financial Records

**File:** `TEMPLATE_AGENT_ID_002_financial_records.md`

**Evidence Type:** Financial - Suspicious bank transactions and cryptocurrency activity

**What It Provides:**
- Complete forensic analysis of NPC's financial records
- Employment verification and salary baseline
- Suspicious cash deposits ($25K-$75K range, ENTROPY payment pattern)
- Cryptocurrency wallet activity linked to ENTROPY master wallet
- Shell company connections
- Offshore account activity
- Lifestyle vs. income discrepancy analysis

**Substitution Variables:**
- [SUBJECT_NAME] - NPC's name
- [ORGANIZATION] - Employer
- [POSITION] - Job title
- [SALARY] - Base salary
- [AMOUNT] - Payment amounts
- [DATE] - Transaction dates

**Red Flags Documented:**
🚩 Unexplained cash deposits (15-30% above salary)
🚩 Cryptocurrency transactions to known ENTROPY wallet
🚩 Shell company payments (obfuscation)
🚩 Offshore transfers (tax evasion, hiding wealth)
🚩 Timing correlation with data breaches
🚩 Lifestyle inflation (new car, debt payoff)

**Financial Timeline Example:**
```
March 15: Cash deposit $42,000 (source unknown)
March 18: Cryptocurrency transfer to ENTROPY master wallet
March 20: Student loan payment $15,000
April 2: Cash deposit $38,000
April 5: New vehicle purchase $45,000 (cash)
```

**Evidence Strength:**
- Alone: 60% confidence (strong suspicion)
- + Encrypted comms: 75% confidence
- + Access logs: 95% confidence (quid pro quo proven)
- + All evidence types: 98% confidence

**Best Used For:**
- Proving payment for services (quid pro quo)
- Asset recruitment scenarios (financial desperation)
- Money laundering investigations
- Connecting to ENTROPY financial network

**Gameplay Integration:**
- Unlocks financial forensics mission
- Enables asset seizure actions
- Shows ENTROPY payment patterns
- Creates leverage opportunity (financial crimes)

---

### 3. TEMPLATE_AGENT_ID_003: Access Logs

**File:** `TEMPLATE_AGENT_ID_003_access_logs.md`

**Evidence Type:** Technical - Unauthorized system access patterns

**What It Provides:**
- Comprehensive IT audit of NPC's system activity
- 5 documented security incidents with technical details
- Pattern analysis showing reconnaissance → access → exfiltration → cover-up
- Behavioral analysis (after-hours access, weekend activity)
- Technical evidence (PowerShell exploitation, USB usage)
- Data exfiltration proof (1.2GB transferred to USB)

**Substitution Variables:**
- [SUBJECT_NAME] - NPC's name
- [POSITION] - Job title/role
- [SYSTEM_NAME] - Accessed systems
- [DATA_TYPE] - Type of data stolen
- [FILE_COUNT] - Number of files accessed
- [DATE], [TIME] - Activity timestamps

**Incidents Documented:**
1. **Sensitive Database Access** (after hours, no business need)
2. **Network Infrastructure Mapping** (weekend, reconnaissance)
3. **HR Database Access** (500+ employee records, PII theft)
4. **Executive Email Access** (PowerShell exploitation, privilege escalation)
5. **USB Device Usage** (data exfiltration, 1.2GB, 847 files)

**Technical Details:**
- PowerShell commands used (Get-MailboxPermission, Add-MailboxPermission)
- Database queries executed (SELECT * FROM sensitive_tables)
- Network mapping tools (Nmap, NetDiscover patterns)
- USB device IDs and transfer volumes
- Deletion attempts (ClearEventLog commands)

**Evidence Strength:**
- Alone: 70% confidence (technical proof)
- + Financial records: 95% confidence (motive + activity)
- + Encrypted comms: 85% confidence (coordination proven)
- + All evidence types: 98% confidence

**Best Used For:**
- Data breach investigations
- Proving unauthorized access
- Technical espionage scenarios
- Demonstrating pattern of malicious activity

**Gameplay Integration:**
- Unlocks technical analysis mission
- Shows what data was compromised
- Creates urgency (active exfiltration)
- Enables immediate access suspension

---

### 4. TEMPLATE_AGENT_ID_004: Surveillance Photos

**File:** `TEMPLATE_AGENT_ID_004_surveillance_photos.md`

**Evidence Type:** Physical - Photographic surveillance and behavioral observation

**What It Provides:**
- Complete 14-day surveillance operation report
- 7 photographic scenarios with detailed descriptions
- Handler identification and profiling
- Pattern analysis (meeting frequency, locations, payment structure)
- Countersurveillance behavior documentation
- Dead drop usage evidence
- Behavioral indicators analysis

**Substitution Variables:**
- [SUBJECT_NAME] - NPC being surveilled
- [POSITION] - Job title
- [CONTACT_DESCRIPTION] - Handler's physical description
- [LOCATION] - Meeting locations
- [DATE], [TIME] - Surveillance timestamps
- [VEHICLE_DESCRIPTION] - Handler's vehicle
- [OPERATION_CODE_NAME] - Surveillance op name

**7 Photo Scenarios:**

**Photo 1-3: Initial Meeting**
- Coffee shop, 42-minute meeting
- Document exchange (manila envelope, 20-30 pages)
- Cash payment ($2K-$5K, visible $100 bills)
- Subject's nervous behavior documented

**Photo 4-5: Dead Drop**
- Subject depositing USB drive at park bench
- Handwritten note: "Files from [SYSTEM] as requested"
- Handler retrieval 2 hours later (same person from meeting)
- Confirms operational tradecraft

**Photo 6: Follow-up Meeting**
- Different location (shopping mall food court)
- Verbal communication (partial audio captured)
- Smaller cash payment
- Security audit discussion overheard

**Photo 7: Countersurveillance**
- Subject taking circuitous route home
- Multiple U-turns and backtracking
- 45 minutes added to commute
- Professional SDR (surveillance detection route)

**Handler Profile Provided:**
- Physical description template
- Vehicle information (license plate, rental rotation)
- Behavioral indicators (experienced operator)
- Threat assessment (likely cell leader)

**Evidence Strength:**
- Alone: 50% confidence (suspicious but explainable)
- + Financial records: 80% confidence (payments match meetings)
- + Access logs: 85% confidence (timing correlates)
- + All evidence types: 95% confidence

**Best Used For:**
- Visual proof of handler contact
- Handler identification missions
- Pattern establishment (regular meetings)
- Demonstrating tradecraft (dead drops, countersurveillance)

**Gameplay Integration:**
- Unlocks surveillance mission type
- Enables simultaneous handler/asset arrest
- Facial recognition on handler
- Creates "show the photos" confrontation option

---

### 5. TEMPLATE_AGENT_ID_005: Physical Evidence

**File:** `TEMPLATE_AGENT_ID_005_physical_evidence.md`

**Evidence Type:** Physical - Handwritten notes and personal documents

**What It Provides:**
- 3-page handwritten note progression
- Forensic handwriting analysis report
- Legal prosecutorial assessment
- Emotional journey documentation
- Complete chain of custody
- Self-incrimination in subject's own words

**Substitution Variables:**
- [SUBJECT_NAME] - NPC's name
- [HANDLER_CODENAME] - Handler's operational designation
- [MEETING_LOCATION] - Where meetings occur
- [SYSTEM_NAME] - Systems accessed
- [AMOUNT] - Payment amounts
- [DEBT_AMOUNT] - Subject's financial pressure
- [ORGANIZATION] - Company name

**3-Page Emotional Progression:**

**Page 1: Initial Instructions (Nervous Rationalization)**
```
Meeting notes with [HANDLER_CODENAME]
- Files to copy: Customer database, Network diagrams, Employee info
- Payment: $[AMOUNT] on completion
- "Feeling sick about this. But what choice do I have?"
- "[HANDLER] says it's just 'competitive intelligence'"
- "Not really hurting anyone... right?"
- "Delete these notes after memorizing!!!"
```

**Page 2: Escalation (Feeling Trapped)**
```
After meeting - THEY WANT MORE
- [NEW_SYSTEM] access (don't have clearance!)
- Told them might be difficult
- [HANDLER] sounded threatening
- "They have me trapped. Can't stop now."
- "If I refuse, they threaten to tell [ORGANIZATION]"
- "What have I done"
```

**Page 3: Desperation (Cry for Help)**
```
THINGS GETTING WORSE
- Security tightening at work
- [HANDLER] mentioned "permanent solutions for loose ends"
- AM I A LOOSE END??
- Overheard [HANDLER] on phone: "ENTROPY cell needs..."
- WHAT IS ENTROPY?? OH GOD WHAT HAVE I GOTTEN INTO
- "If someone finds these notes: please help me."
- [ORGANIZATION] Security Hotline: [NUMBER]
- "Should I call? Too scared. But maybe..."
- "Please let this end somehow"
```

**Forensic Analysis Included:**
- Handwriting verification (99.7% match)
- Pen pressure analysis (stress visible)
- Writing deterioration over time
- Scratch-out attempts (concealment)
- Ink testing (same pen throughout)

**Legal Assessment:**
- Admissibility: VERY HIGH (spontaneous confession)
- No Miranda issues (not custodial interrogation)
- Subject's own words incriminating
- Demonstrates consciousness of guilt
- Shows coercion by ENTROPY (victim characteristics)

**Recommended Use:**
"Use notes as leverage for cooperation, not prosecution.
Subject is scared, remorseful, and wants out."

**Evidence Strength:**
- Alone: 80% confidence (self-incrimination)
- + Financial records: 95% confidence (payment confirmation)
- + Access logs: 95% confidence (activity confirmation)
- + Surveillance: 98% confidence (complete picture)
- + All evidence: 99.9% confidence (overwhelming)

**Best Used For:**
- Devastating confrontation ("Your own handwriting")
- Empathetic approach enabled (subject wants help)
- High cooperation likelihood (95% with compassionate approach)
- Emotional player investment (human story)

**Gameplay Integration:**
- Creates powerful interrogation moment
- Enables multiple approach paths:
  - Show notes immediately (95% cooperation)
  - Use as leverage after lies (90% cooperation)
  - Offer help based on cry for help (98% cooperation)
- Provides moral complexity (victim vs. perpetrator)

---

### 6. TEMPLATE_AGENT_ID_006: Message Logs

**File:** `TEMPLATE_AGENT_ID_006_message_logs.md`

**Evidence Type:** Digital Communications - Encrypted Messaging App Logs (Signal/Wickr)

**What It Provides:**
- Complete Signal/Wickr message thread between handler and asset
- Handler uses subject's REAL NAME **8 times** in operational communications
- Direct confirmation of subject's identity as ENTROPY operative
- Shows coercion and subject's desire to escape
- Reveals handler contact information, cell structure, operations
- Documents specific data theft admissions
- Payment amount discussions corroborating financial evidence
- Dead drop coordination matching surveillance evidence

**Substitution Variables:**
- [SUBJECT_NAME] - NPC's real name (used 8x by handler!)
- [SUBJECT_CODENAME] - ENTROPY operational designation (e.g., "SPARROW", "ASSET_DELTA_04")
- [HANDLER_CODENAME] - Handler's name (e.g., "Phoenix", "Cascade")
- [CELL_DESIGNATION] - Cell affiliation (e.g., "CELL_DELTA", "CELL_BETA_03")
- [OPERATION_NAME] - Specific operation (e.g., "Glass House", "Silent Echo")
- [HANDLER_PHONE] - Handler's encrypted app ID (e.g., "+1-555-0847")
- [SUBJECT_PHONE] - Subject's encrypted app ID
- [TARGET_ORGANIZATION] - Where subject works
- [DATA_TYPE] - Type of data being stolen
- [SYSTEM_NAME] - Systems being accessed
- [AMOUNT] - Payment amounts
- [MEETING_LOCATION] - Dead drop location
- [DEADLINE_DATE] - Operation deadline
- [DATE_1] through [DATE_5] - Message dates
- [TIME_1] through [TIME_5] - Message timestamps
- [PRESSURE_DETAIL] - Coercion type (e.g., "debt situation", "legal exposure")
- [SUBJECT_CONCERN] - Subject's worry (e.g., "security audit", "feeling watched")
- [SECOND_ASSET_CODENAME] - Another asset at same organization
- [CELL_LEADER_CODENAME] - Cell leadership designation

**Message Threads Included:**
1. **Thread 1: Initial Tasking** - Handler assigns data theft, subject nervous, real name used
2. **Thread 2: Operational Concerns** - Subject worried about being watched, handler reassures
3. **Thread 3: Coordination with Cell** - Payment confirmed, future tasking, another asset mentioned
4. **Thread 4: Internal ENTROPY Comms** - Handler briefs cell leader, confirms subject's real name and recruitment method
5. **Thread 5: Escalation and Pressure** - Subject wants out, handler threatens and coerces

**Real Name Usage Pattern:**
Handler uses [SUBJECT_NAME] **8 times** across 5 conversation threads:
- During operational tasking (3 instances)
- During pressure/coercion (2 instances)
- During cell leadership briefing (2 instances)
- During praise/reassurance (1 instance)

**Conclusion:** Real name usage is consistent, intentional, and confirms [SUBJECT_NAME]'s identity as ENTROPY asset.

**Red Flags Documented:**
🚩 Subject's real name used repeatedly in ENTROPY operations
🚩 Handler admits recruitment via financial pressure
🚩 Subject admits data theft in own words
🚩 Payment amounts discussed ($25K-$75K range)
🚩 Dead drop coordination (matches surveillance timeline)
🚩 Subject expresses wanting out (shows coercion)
🚩 Handler threatens subject with exposure
🚩 Multiple assets at same organization revealed
🚩 Cell structure and operations documented

**Evidence Strength:**
- Alone: 75% confidence (very strong - subject's own admissions + real name confirmation)
- + Financial records: 90% confidence (payments match message discussions)
- + Access logs: 95% confidence (activity matches tasking timeline)
- + Surveillance: 98% confidence (dead drops match message coordination)
- + Handwritten notes: 99% confidence (emotional state corroborated)
- + All evidence: 99.9% confidence (overwhelming, complete picture)

**Best Used For:**
- Confirming suspected asset's real identity (definitive proof)
- Revealing handler-asset relationships
- Documenting specific operations and data theft
- Showing coercion and victimization (subject wants out)
- Mapping cell structure (handler, cell leader, other assets)
- Creating high-cooperation scenarios (85% base cooperation)
- Handler identification and arrest opportunity

**Gameplay Integration:**
- **Discovery:** Rare, high-value - requires server compromise or handler device seizure
- **Player Actions Enabled:**
  - Confirm [SUBJECT_NAME] as ENTROPY asset (definitive)
  - Issue arrest warrant (subject's own admissions)
  - Trace [HANDLER_PHONE] for surveillance/arrest
  - Identify [SECOND_ASSET_CODENAME] (second asset at organization)
  - Map [CELL_DESIGNATION] structure
  - Corroborate with financial records (payment amounts match)
  - Coordinate simultaneous subject + handler arrests
- **Interrogation Approaches:**
  - Overwhelming Evidence: "Your handler used your real name. You admitted everything." (85% cooperation)
  - Empathetic/Victim: "We saw you tried to quit. Your handler threatened you. You're a victim." (90% cooperation)
  - Strategic Flip: "Your handler documented everything against you. Help us get THEM." (90% cooperation)
  - Double Agent: "Keep talking to your handler. But now you work for us." (60% cooperation, risky)
- **Intelligence Yield:**
  - Complete cell operational details
  - Handler identity and contact info
  - Second asset at organization
  - Operation phases and timeline
  - Dead drop locations
  - Payment methods
  - ENTROPY communication infrastructure

**Cooperation Likelihood:**
- Base: 75% (subject already wanted out based on messages)
- With empathetic approach: 85%
- With protection offer: 90%
- With family safety assurances: 95%

**Why This Template Is Unique:**
- **Only template** that directly confirms subject's real name via ENTROPY internal communications
- Shows subject is KNOWN ENTITY within ENTROPY (not anonymous)
- Reveals handler's operational security failure (using real names)
- Demonstrates subject's victimization (wanted out, was coerced)
- Provides actionable intelligence beyond subject (handler, cell, operations)
- Highest cooperation potential due to documented coercion
- Creates moral complexity (perpetrator who is also victim)

**Forensic Analysis Included:**
- Message metadata verification (Signal sealed sender protocol)
- Phone number carrier verification
- Device IMEI correlation to subject
- Location data (device at organization, dead drop sites)
- No evidence of tampering
- Cryptographic authentication
- Chain of custody documentation

**Legal Assessment:**
- Admissibility: VERY HIGH
- Subject's own admissions to federal crimes
- Real name confirmed (eliminates identity defense)
- Specific systems, data, and dates documented
- Payment trail corroboration available
- Handler identity revealed (bonus intelligence)
- **Consideration:** Subject shows coercion/victimization - recommend cooperation agreement

**Educational Value (CyBOK):**
- Encrypted messaging security (Signal protocol)
- OPSEC failures (using real names in operational comms)
- Mobile device forensics
- Digital evidence authentication
- Insider threat psychology (coercion tactics)
- Counterintelligence (flipping assets)
- Legal process (admissibility, cooperation agreements)

**Cross-References:**
- **TEMPLATE_002 (Financial):** Payment amounts should match message discussions
- **TEMPLATE_003 (Access Logs):** Data extraction dates should align with tasking
- **TEMPLATE_004 (Surveillance):** Dead drop timing/location should match messages
- **TEMPLATE_005 (Handwritten Notes):** Emotional arc (trapped, wants out) corroborates
- **RECRUITMENT_001:** Financial pressure methodology matches
- **TACTICAL_001:** If operation mentioned is infrastructure attack
- **LEVERAGE_001:** Subject's pressure detail could be leverage point

**Recommended Rarity:** RARE (Very Hard Discovery)

**Discovery Scenarios:**
- SAFETYNET compromises ENTROPY communications server
- Handler's device seized during arrest
- Cryptographic breakthrough on intercepted Signal traffic
- Different ENTROPY asset provides handler contact info

**Discovery Timing:**
- Early Game: Too powerful, skip
- Mid Game: Possible reward for major operation success
- Late Game: Appropriate for strategic Phase 3 intelligence

---

## Evidence Combination Strategies

### Optimal Evidence Chain

The templates are designed to work together in a **progressive revelation** pattern:

```
SEQUENCE 1: Discovery Path
├─ Encrypted Comms (Initial Suspicion)
│  └─ Triggers investigation unlock
├─ Financial Records (Motive Proven)
│  └─ Shows payments for services
├─ Access Logs (Activity Confirmed)
│  └─ Proves what they did
├─ Surveillance Photos (Handler Identified)
│  └─ Shows who they work for
├─ Handwritten Notes (Confession)
│  └─ Subject's own words, emotional state
└─ Message Logs (Real Name Confirmation)
   └─ Handler uses real name, definitive proof
```

### Confidence Thresholds

**Evidence Count → Confidence Level:**

| Evidence Pieces | Confidence | Prosecution Viable | Cooperation Likely |
|----------------|------------|-------------------|-------------------|
| 1 template | 40-80% | No (insufficient) | 50% |
| 2 templates | 65-85% | Maybe (circumstantial) | 70% |
| 3 templates | 85-95% | Yes (strong case) | 85% |
| 4 templates | 95-98% | Yes (very strong) | 90% |
| 5 templates | 99% | Yes (overwhelming) | 93% |
| 6 templates | 99.9% | Yes (overwhelming) | 95% |

### Best Combinations by Scenario Type

**Corporate Infiltration:**
1. Encrypted Comms (coordination)
2. Access Logs (what they accessed)
3. Financial Records (payment proof)
- Confidence: 95%

**Data Exfiltration:**
1. Access Logs (theft proof)
2. Surveillance (handler delivery)
3. Handwritten Notes (confession)
- Confidence: 98%

**Asset Recruitment:**
1. Financial Records (financial desperation)
2. Handwritten Notes (emotional state)
3. Surveillance (handler contact)
- Confidence: 95%

**Handler Takedown:**
1. Surveillance (handler identification)
2. Financial Records (money trail to cell)
3. Encrypted Comms (coordination proof)
- Confidence: 90%

**Real Name Confirmation + High Cooperation:**
1. Message Logs (real name used 8x, wants out)
2. Handwritten Notes (emotional confession)
3. Financial Records (payment corroboration)
- Confidence: 99%
- Cooperation: 95% (both show victimization)

**Complete Cell Mapping:**
1. Message Logs (handler contact, cell structure)
2. Surveillance (handler photos, vehicle)
3. Financial Records (payment network)
4. Access Logs (what data compromised)
- Confidence: 99.9%
- Enables: Simultaneous handler + asset arrest, second asset identification

---

## Gameplay Integration Guide

### Investigation Progression

**Phase 1: Initial Suspicion**
- Player discovers 1 evidence template
- NPC flagged as "Person of Interest"
- Unlocks investigation missions
- Confidence: Insufficient for action

**Phase 2: Building the Case**
- Player collects 2-3 evidence templates
- Pattern emerges (payments, access, meetings)
- NPC upgraded to "Suspected ENTROPY Asset"
- Confidence: Sufficient for confrontation

**Phase 3: Overwhelming Evidence**
- Player has 4-5 evidence templates
- Complete picture of recruitment, activity, handler
- NPC confirmed as "ENTROPY Asset - Confirmed"
- Confidence: Multiple approach options unlocked

### Player Choice Branching

Each evidence combination enables **different interrogation approaches:**

**With Financial Evidence:**
→ Offer: "We can help with your debt, but you need to cooperate"

**With Handwritten Notes:**
→ Empathy: "We read your notes. We know you want out. We can help."

**With Surveillance Photos:**
→ Confrontation: "You can't deny this. We have photos of everything."

**With Access Logs:**
→ Technical: "We have every keystroke. Every file. Every system you touched."

**With All Evidence:**
→ Overwhelming: "Your own handwriting. Photos of meetings. Financial transactions. Access logs. There's no defense. But we can still help you."

### Success Metrics

Each template contributes to multiple success outcomes:

**Cooperation Likelihood:**
- Base (no evidence): 20%
- + Encrypted Comms: +15%
- + Financial Records: +20%
- + Access Logs: +15%
- + Surveillance: +20%
- + Handwritten Notes: +30%
- Maximum: 95% (with all evidence + compassionate approach)

**Prosecution Probability:**
- Base: 30%
- + Each evidence template: +15%
- All 5 templates: 95% conviction probability

**Intelligence Value:**
- Handwritten notes → Handler codename revealed
- Surveillance → Handler facial ID + vehicle
- Financial → ENTROPY payment wallet address
- Access logs → What data was compromised
- Encrypted comms → Communication methods

---

## Substitution Guide - Best Practices

### Creating Consistent NPCs

When substituting template variables, maintain consistency across all evidence types for the same NPC:

**Example: Jennifer Park (Network Security Analyst)**

**Across all 5 templates, use:**
- [SUBJECT_NAME] → "Jennifer Park"
- [ORGANIZATION] → "TechCorp Industries"
- [POSITION] → "Network Security Analyst"
- [SALARY] → "$85,000/year"
- [HANDLER_CODENAME] → "Phoenix"

**Keep timeline consistent:**
- First contact: March 1, 2025
- Payment received: March 15, 2025
- Data exfiltration: March 18, 2025
- Surveillance begins: March 20, 2025
- Notes discovered: April 3, 2025

**Keep amounts consistent:**
- First payment: $42,000
- Second payment: $38,000
- Total debt: $127,000 (student loans)

### Variable Formatting Standards

**Names:**
- Use realistic full names: "Jennifer Park" not "Agent_007"
- Consistent across all templates

**Organizations:**
- Use plausible company names: "TechCorp Industries"
- Match to scenario setting (tech company, hospital, government agency)

**Amounts:**
- ENTROPY payment range: $25,000-$75,000 per operation
- Keep amounts realistic for job role
- Student debt: $80K-$150K typical
- Medical debt: $50K-$200K typical

**Dates:**
- Use absolute dates: "March 15, 2025" not "[DATE_1]"
- Maintain chronological order across templates
- Account for investigation timeline (2-4 weeks typical)

**Codenames:**
- Handler codenames follow ENTROPY patterns:
  - Thermodynamic terms: "Entropy", "Cascade", "Equilibrium"
  - Phoenix imagery: "Phoenix", "Ash", "Ember"
  - Greek letters: "Alpha-07", "Beta-3", "Omega"

### Scenario-Specific Customization

**Corporate Infiltration:**
- Focus on customer data, trade secrets, network diagrams
- Handler wants: "Customer database", "Email backups"
- Access systems: "Finance Server", "Customer CRM"

**Healthcare Breach:**
- Focus on patient records, medical research
- Handler wants: "Patient database", "Clinical trial data"
- Access systems: "EMR System", "Research Database"

**Infrastructure Attack:**
- Focus on SCADA, control systems, facility access
- Handler wants: "Network diagrams", "SCADA access"
- Access systems: "Control Systems", "Facility Management"

**Research Theft:**
- Focus on IP, proprietary research, formulas
- Handler wants: "Research files", "Product designs"
- Access systems: "Lab Database", "Patent Filing System"

---

## Cross-References

### Related Gameplay Fragments

These templates complement other gameplay-function fragments:

**RECRUITMENT_001** (Financial Exploitation Playbook)
- Shows HOW NPCs are recruited
- Templates show RESULT of recruitment
- Combined: Complete recruitment → operation → capture arc

**LEVERAGE_001** (Cascade Family Intel)
- Shows leverage used TO turn operatives
- Templates provide evidence ENABLING leverage
- Combined: Evidence → leverage → defection

**TACTICAL_001** (Active Operation Clock)
- Shows ONGOING operation
- Templates show PAST operations (evidence)
- Combined: Historical pattern → predict current op

**VICTIM_001** (Hospital Administrator)
- Shows IMPACT of ENTROPY operations
- Templates show WHO enabled the attack
- Combined: Perpetrator → consequence emotional arc

### Related Content Fragments

**ENTROPY_PERSONNEL_001** (Cascade Profile)
- Could BE the [SUBJECT_NAME] in these templates
- Templates provide evidence supporting profile
- Combined: Profile → evidence → confirmed identity

**CHAR_SARAH_001** (Sarah Martinez Confession)
- Similar emotional arc to handwritten notes template
- Both show recruited asset's regret and fear
- Combined: Multiple sympathetic insider threats

**ARCHITECT_STRATEGIC_001** (Phase 3 Directive)
- Shows ENTROPY's master plan
- Templates show individual assets executing plan
- Combined: Strategic directive → tactical execution

---

## Technical Implementation Notes

### For Game Developers

**Substitution System:**
```python
# Example pseudocode
template = load_template("TEMPLATE_AGENT_ID_001_encrypted_comms.md")
npc = get_npc("jennifer_park")

substitutions = {
    "[SUBJECT_NAME]": npc.full_name,
    "[ORGANIZATION]": npc.employer,
    "[POSITION]": npc.job_title,
    "[CURRENT_DATE]": game_date - timedelta(days=3)
}

evidence_fragment = template.substitute(substitutions)
game.add_discoverable_lore(evidence_fragment, location=npc.desk_drawer)
```

**Evidence Collection Tracking:**
```python
class NPCInvestigation:
    def __init__(self, npc_id):
        self.npc_id = npc_id
        self.evidence_collected = []
        self.confidence_level = 0

    def add_evidence(self, template_type):
        self.evidence_collected.append(template_type)
        self.confidence_level = calculate_confidence(self.evidence_collected)

        if self.confidence_level >= 85:
            unlock_interrogation_mission(self.npc_id)
```

**Branching Logic:**
```python
def get_interrogation_options(evidence_list):
    options = ["Standard Questioning"]

    if "TEMPLATE_002" in evidence_list:  # Financial
        options.append("Offer Financial Help")

    if "TEMPLATE_005" in evidence_list:  # Handwritten notes
        options.append("Empathetic Approach - Reference Their Notes")

    if "TEMPLATE_004" in evidence_list:  # Surveillance
        options.append("Show Photos - Visual Confrontation")

    if len(evidence_list) >= 4:
        options.append("Overwhelming Evidence - All Cards on Table")

    return options
```

### Discovery Placement Recommendations

**TEMPLATE_001 (Encrypted Comms):**
- Location: Email server logs, IT security alerts
- Timing: Early investigation (triggers suspicion)
- Difficulty: Medium (requires email access or IT cooperation)

**TEMPLATE_002 (Financial Records):**
- Location: Subpoenaed bank records, financial audit
- Timing: Mid investigation (requires legal authority)
- Difficulty: Hard (requires warrant/subpoena)

**TEMPLATE_003 (Access Logs):**
- Location: IT audit reports, SIEM alerts
- Timing: Mid investigation (requires IT forensics)
- Difficulty: Medium (technical analysis needed)

**TEMPLATE_004 (Surveillance Photos):**
- Location: Surveillance team reports
- Timing: Late investigation (requires active surveillance op)
- Difficulty: Very Hard (expensive, time-consuming)

**TEMPLATE_005 (Handwritten Notes):**
- Location: Desk drawer, personal effects, home search
- Timing: Variable (lucky find or late-game search warrant)
- Difficulty: Medium-Hard (requires physical access)

**TEMPLATE_006 (Message Logs):**
- Location: Compromised ENTROPY server, seized handler device
- Timing: Late investigation (major breakthrough)
- Difficulty: Very Hard (requires server compromise or handler arrest)
- **HIGH VALUE:** Real name confirmation, handler intel, cell mapping

---

## Educational Value (CyBOK Alignment)

### Security Concepts Demonstrated

**Digital Forensics:**
- Email header analysis (TEMPLATE_001)
- Financial transaction tracing (TEMPLATE_002)
- System log correlation (TEMPLATE_003)
- Chain of custody (all templates)

**Insider Threat Detection:**
- Behavioral indicators (after-hours access)
- Financial pressure recognition
- Access pattern anomalies
- Communication analysis

**Investigation Methodology:**
- Evidence corroboration (multiple sources)
- Confidence level progression
- Legal admissibility considerations
- Forensic analysis procedures

**Human Factors:**
- Recruitment vulnerability factors
- Psychological pressure and coercion
- Empathetic interrogation techniques
- Ethical evidence usage

### Learning Outcomes

Players using these templates will learn:

1. **Evidence Collection**: How multiple evidence types build a case
2. **Pattern Recognition**: Identifying suspicious behavior across domains
3. **Legal Process**: Warrants, subpoenas, chain of custody
4. **Psychology**: Understanding why people become insider threats
5. **Ethics**: Balancing effective investigation with humane treatment

---

## Expansion Opportunities

### Additional Template Ideas

**TEMPLATE_007: Phone Records**
- Call logs to burner phones
- Timing correlation with operations
- Location data (cell tower triangulation)

**TEMPLATE_008: Social Media OSINT**
- Lifestyle changes visible on social media
- Travel patterns (meetings with handler)
- Unusual purchases or activities

**TEMPLATE_009: Witness Testimony**
- Coworker observations
- "They've been acting strange lately"
- Suspicious conversations overheard

**TEMPLATE_010: Digital Forensics**
- Deleted file recovery
- Browser history analysis
- VPN usage and encrypted tools

**TEMPLATE_011: Physical Surveillance (Extended)**
- Safe house identification
- Handler's vehicle tracking
- Dead drop location mapping

---

## Version History

**v1.0** - Initial template system creation
- 5 core evidence templates
- Complete substitution system
- Gameplay integration framework
- Cross-reference structure

**v2.0** - Message Logs template and documentation expansion
- Added TEMPLATE_006: Message Logs (Signal/Wickr communications)
- Added comprehensive README.md for template system
- Enhanced documentation with complete substitution variable reference
- Real name confirmation via handler communications
- 6 total evidence templates with 99.9% confidence when combined

---

**CLASSIFICATION:** TEMPLATE SYSTEM - EVIDENCE GENERATION
**PRIORITY:** HIGH (Core gameplay mechanic)
**REUSABILITY:** Extremely High (designed for infinite NPC generation)
**DISTRIBUTION:** Game developers, scenario designers, mission creators
**MAINTENANCE:** Templates should remain stable; customize through substitution

---

## Quick Reference Card

```
╔═══════════════════════════════════════════════════════════╗
║  EVIDENCE TEMPLATE QUICK REFERENCE                        ║
╚═══════════════════════════════════════════════════════════╝

TEMPLATE_001: Encrypted Comms
→ Alone: 40% | Best With: Financial Records
→ Use For: Initial suspicion, policy violations

TEMPLATE_002: Financial Records
→ Alone: 60% | Best With: Access Logs
→ Use For: Payment proof, motive establishment

TEMPLATE_003: Access Logs
→ Alone: 70% | Best With: Financial Records
→ Use For: Activity proof, technical evidence

TEMPLATE_004: Surveillance Photos
→ Alone: 50% | Best With: Financial + Access
→ Use For: Handler ID, visual confirmation

TEMPLATE_005: Handwritten Notes
→ Alone: 80% | Best With: Everything
→ Use For: Confession, empathetic approach

TEMPLATE_006: Message Logs ⭐ NEW
→ Alone: 75% | Best With: Notes + Financial
→ Use For: Real name confirmation, handler intel, cell mapping
→ RARE - Requires server compromise or handler device seizure

OPTIMAL COMBINATION: All 6 templates = 99.9% confidence

MINIMUM FOR ACTION: 3 templates = 85% confidence

COOPERATION PROBABILITY:
- Empathetic + Message Logs: 90%
- Compassionate + Notes: 98%
- Overwhelming + All Evidence: 95%
- Standard + Some Evidence: 70%
```

---

**End of Template Catalog**

**For implementation questions, refer to:**
- Individual template files for detailed content
- GAMEPLAY_CATALOG.md for mission integration
- ../README.md for overall LORE system philosophy
