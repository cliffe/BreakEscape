# EVIDENCE TEMPLATE 006: ENTROPY Agent Message Logs

**Evidence Type:** Digital Communications - Encrypted Messaging App Logs
**Classification:** HIGH VALUE - Direct identification evidence
**Recommended Discovery:** Compromised ENTROPY communications server, seized handler device, decrypted Signal/Wickr backup

---

## TEMPLATE SUBSTITUTION GUIDE

**CRITICAL:** Replace ALL bracketed placeholders with scenario-specific values before use.

### Required Substitutions

| Placeholder | Description | Example Value |
|------------|-------------|---------------|
| `[SUBJECT_NAME]` | NPC's real full name | "Jennifer Park" |
| `[SUBJECT_CODENAME]` | ENTROPY operational designation | "SPARROW" or "ASSET_DELTA_04" |
| `[HANDLER_CODENAME]` | Handler's operational name | "Phoenix", "Cascade", "HANDLER_07" |
| `[CELL_DESIGNATION]` | Which ENTROPY cell | "CELL_DELTA", "CELL_BETA_03" |
| `[TARGET_ORGANIZATION]` | Where subject works | "TechCorp Industries", "Memorial Hospital" |
| `[SUBJECT_POSITION]` | Job title/role | "Network Security Analyst", "Database Admin" |
| `[DATA_TYPE]` | Type of data provided | "customer records", "financial data", "network diagrams" |
| `[OPERATION_NAME]` | Specific operation mentioned | "Glass House", "Midnight Cascade", "Silent Echo" |
| `[DATE_1]`, `[DATE_2]`, etc. | Message dates | "March 15, 2025" |
| `[TIME_1]`, `[TIME_2]`, etc. | Message timestamps | "14:23", "22:47" |
| `[AMOUNT]` | Payment amounts | "$42,000", "$50,000" |
| `[HANDLER_PHONE]` | Encrypted app ID (handler) | "+1-555-0847" (Signal), "@secure_contact_749" |
| `[SUBJECT_PHONE]` | Encrypted app ID (subject) | "+1-555-0234" (Signal), "@delta_sparrow" |
| `[SYSTEM_NAME]` | System being accessed | "Customer Database", "HR Portal", "SCADA Control" |
| `[DEADLINE_DATE]` | Operation deadline | "March 20, 2025", "Friday" |
| `[MEETING_LOCATION]` | Dead drop or meeting spot | "Riverside Park bench 7", "Joe's Pizza back room" |

### Optional Contextual Substitutions

| Placeholder | Description | Example Value |
|------------|-------------|---------------|
| `[PRESSURE_DETAIL]` | Coercion/pressure mentioned | "debt situation", "family safety", "legal exposure" |
| `[SUBJECT_CONCERN]` | Subject's expressed worry | "security audit", "suspicious coworker", "feeling watched" |
| `[EXFIL_METHOD]` | How data is transferred | "USB dead drop", "encrypted upload", "photograph documents" |
| `[COVER_STORY]` | Subject's cover explanation | "working late on project", "authorized maintenance", "routine audit" |

---

## EVIDENCE FRAGMENT: Encrypted Messaging App Communications

### Source Information

**Evidence ID:** COMMS-INTERCEPT-[CASE_NUMBER]
**Source Platform:** Signal Private Messenger (end-to-end encrypted)
**Acquisition Method:** Server compromise of ENTROPY C2 infrastructure / Seized device forensics
**Date Range:** [DATE_1] through [DATE_2]
**Participants:**
- **Handler:** [HANDLER_CODENAME] (Phone: [HANDLER_PHONE])
- **Asset:** [SUBJECT_CODENAME] / [SUBJECT_NAME] (Phone: [SUBJECT_PHONE])

**Chain of Custody:**
- Acquired: [ACQUISITION_DATE] by [INVESTIGATING_AGENCY]
- Decrypted: [DECRYPTION_DATE] using [METHOD]
- Authentication: Message metadata verified, timestamps validated
- Admissibility: HIGH (proper warrant, authentic communications)

---

## MESSAGE LOG TRANSCRIPT

### Conversation Thread 1: Initial Tasking

**Date:** [DATE_1]
**Time:** [TIME_1]

---

**[HANDLER_CODENAME]:** [SUBJECT_CODENAME], this is your handler checking in. Confirm secure comms.

**[SUBJECT_CODENAME]:** Confirmed. Signal showing verified encryption.

**[HANDLER_CODENAME]:** Good. [CELL_DESIGNATION] has new priority tasking for you. Operation [OPERATION_NAME] enters next phase this week.

**[SUBJECT_CODENAME]:** Understood. What do you need?

**[HANDLER_CODENAME]:** [TARGET_ORGANIZATION] [SYSTEM_NAME] - we need complete [DATA_TYPE] extraction. Deadline is [DEADLINE_DATE]. Can you deliver?

**[SUBJECT_CODENAME]:** That's... that's a lot of files. Security has been tighter since the last audit.

**[HANDLER_CODENAME]:** That's why we're paying you well, [SUBJECT_NAME]. You know your way around their systems.

**ANALYSIS NOTE:** ⚠️ **CRITICAL IDENTIFICATION** - Handler uses subject's REAL NAME ([SUBJECT_NAME]) in operational communication, confirming subject's true identity is known to ENTROPY.

**[SUBJECT_CODENAME]:** I know. Just nervous. When do I get the rest of the payment?

**[HANDLER_CODENAME]:** $[AMOUNT] on delivery, as always. Plus bonus if you include [ADDITIONAL_DATA].

**[SUBJECT_CODENAME]:** Ok. I can do this. Same drop point?

**[HANDLER_CODENAME]:** Yes. [MEETING_LOCATION]. USB drive, encrypted with usual key. Thursday, 22:00. I'll retrieve Friday morning.

**[SUBJECT_CODENAME]:** Copy that.

**[HANDLER_CODENAME]:** And [SUBJECT_NAME]? Don't get sloppy. You've been valuable to [CELL_DESIGNATION]. We take care of our assets.

**ANALYSIS NOTE:** ⚠️ **SECOND REAL NAME USAGE** - Handler again uses real name, showing this is not a typo but confirmed identification.

---

### Conversation Thread 2: Operational Concerns

**Date:** [DATE_2] (3 days later)
**Time:** [TIME_2]

---

**[SUBJECT_CODENAME]:** We have a problem.

**[HANDLER_CODENAME]:** What kind of problem?

**[SUBJECT_CODENAME]:** [SUBJECT_CONCERN]. Someone might be watching my access patterns. Should I lay low?

**[HANDLER_CODENAME]:** No. We need that data for [OPERATION_NAME]. You're close to completion, [SUBJECT_NAME]. Don't lose your nerve now.

**ANALYSIS NOTE:** ⚠️ **THIRD REAL NAME USAGE** - Pattern establishes this is intentional, not operational security lapse.

**[SUBJECT_CODENAME]:** I'm not losing my nerve. I'm being careful.

**[HANDLER_CODENAME]:** Careful is good. Paranoid is counterproductive. Your [SUBJECT_POSITION] role gives you legitimate access. Use your [COVER_STORY] if anyone asks.

**[SUBJECT_CODENAME]:** What if they don't believe me?

**[HANDLER_CODENAME]:** They will. You've been there 3 years. You're trusted. That's WHY we recruited you.

**[SUBJECT_CODENAME]:** Fine. I'll finish the extraction tonight.

**[HANDLER_CODENAME]:** Smart decision. Remember what we discussed about [PRESSURE_DETAIL]. We're helping each other here.

**ANALYSIS NOTE:** ⚠️ Shows coercion/leverage being applied. Subject may be victim as well as perpetrator.

---

### Conversation Thread 3: Coordination with Cell

**Date:** [DATE_3] (1 week later)
**Time:** [TIME_3]

---

**[HANDLER_CODENAME]:** [SUBJECT_NAME], excellent work on the [DATA_TYPE] package. [CELL_DESIGNATION] leadership very pleased.

**ANALYSIS NOTE:** ⚠️ **FOURTH REAL NAME USAGE** - Confirms completion of data theft operation.

**[SUBJECT_CODENAME]:** Thanks. When does the payment clear?

**[HANDLER_CODENAME]:** Already in your account as of this morning. Check [PAYMENT_METHOD].

**[SUBJECT_CODENAME]:** Got it. Thank you.

**[HANDLER_CODENAME]:** We'll need you again for Phase 2 of [OPERATION_NAME]. Probably 2-3 weeks. Stand by for tasking.

**[SUBJECT_CODENAME]:** Understood. Will wait for your signal.

**[HANDLER_CODENAME]:** One more thing - [CELL_DESIGNATION] is expanding operations. We might introduce you to another asset at [TARGET_ORGANIZATION]. Would make coordination easier.

**[SUBJECT_CODENAME]:** There's ANOTHER person from my company working for you??

**[HANDLER_CODENAME]:** We have assets in many organizations, [SUBJECT_NAME]. You're not alone. That should be reassuring.

**ANALYSIS NOTE:** ⚠️ **FIFTH REAL NAME USAGE** + revelation of multiple assets at same organization.

**[SUBJECT_CODENAME]:** I guess. Who is it?

**[HANDLER_CODENAME]:** Need to know basis for now. But you'll meet [SECOND_ASSET_CODENAME] when the time is right.

---

### Conversation Thread 4: Internal ENTROPY Communications (Subject Mentioned)

**Date:** [DATE_4]
**Time:** [TIME_4]
**Participants:** [HANDLER_CODENAME] and [CELL_LEADER_CODENAME]

**NOTE:** This thread recovered from HANDLER's device. Subject is discussed but not participating.

---

**[CELL_LEADER_CODENAME]:** Status update on [OPERATION_NAME]?

**[HANDLER_CODENAME]:** On track. [SUBJECT_CODENAME] delivered the [DATA_TYPE] package. Quality is excellent.

**[CELL_LEADER_CODENAME]:** [SUBJECT_CODENAME]... that's the [SUBJECT_POSITION] at [TARGET_ORGANIZATION]?

**[HANDLER_CODENAME]:** Correct. Real name [SUBJECT_NAME]. Recruited 8 months ago via financial pressure approach.

**ANALYSIS NOTE:** ⚠️ **CRITICAL - HANDLER CONFIRMS SUBJECT'S REAL IDENTITY TO CELL LEADERSHIP**

**[CELL_LEADER_CODENAME]:** Reliability assessment?

**[HANDLER_CODENAME]:** 85%. Nervous sometimes, but delivers. Motivated by debt relief and payment. No ideological commitment, purely transactional.

**[CELL_LEADER_CODENAME]:** Risk of cooperation with authorities?

**[HANDLER_CODENAME]:** Moderate. We have leverage via [PRESSURE_DETAIL]. Also, they're in too deep now. Complicit in [NUMBER] data breaches. Legal exposure significant.

**[CELL_LEADER_CODENAME]:** Keep them productive. We'll need [TARGET_ORGANIZATION] access for Phase 3.

**[HANDLER_CODENAME]:** Understood. [SUBJECT_NAME] will continue to be valuable asset.

**ANALYSIS NOTE:** ⚠️ **HANDLER CONFIRMS REAL NAME IN CELL LEADERSHIP BRIEFING** - Shows subject's true identity documented in ENTROPY internal records.

---

### Conversation Thread 5: Escalation and Pressure

**Date:** [DATE_5] (2 weeks later)
**Time:** [TIME_5]

---

**[SUBJECT_CODENAME]:** I need to talk.

**[HANDLER_CODENAME]:** I'm listening.

**[SUBJECT_CODENAME]:** I think I want out. This is too much. Security is investigating unusual access patterns. I'm going to get caught.

**[HANDLER_CODENAME]:** [SUBJECT_NAME], we've discussed this. You can't just "want out."

**ANALYSIS NOTE:** ⚠️ Real name usage during coercive conversation.

**[SUBJECT_CODENAME]:** Why not? I'll just stop. I won't talk to anyone.

**[HANDLER_CODENAME]:** Because you've committed federal crimes. Computer fraud, espionage, conspiracy. We have records of everything you've provided. Payment trails. Access logs WE captured showing your activity.

**[SUBJECT_CODENAME]:** You're threatening me?

**[HANDLER_CODENAME]:** I'm reminding you of reality. If you stop cooperating, we have no reason to protect you. Those records could find their way to law enforcement. Along with your real name, your role, everything.

**[SUBJECT_CODENAME]:** Oh god.

**[HANDLER_CODENAME]:** But if you CONTINUE to help [CELL_DESIGNATION], we protect you. We ensure you're never exposed. Plus you keep getting paid. It's not a hard choice, [SUBJECT_NAME].

**ANALYSIS NOTE:** ⚠️ Classic coercion pattern. Subject trapped and showing signs of wanting to escape.

**[SUBJECT_CODENAME]:** I don't have a choice, do I?

**[HANDLER_CODENAME]:** You always have choices. Choose to keep working with us. It's the smart play.

**[SUBJECT_CODENAME]:** ...fine. What do you need?

**[HANDLER_CODENAME]:** That's the right answer. New tasking coming tomorrow. Stand by.

---

## FORENSIC ANALYSIS

### Message Authentication

**Metadata Verification:**
- All messages verified via Signal's sealed sender protocol
- Phone numbers [HANDLER_PHONE] and [SUBJECT_PHONE] confirmed via carrier records
- Timestamps validated against server logs
- No evidence of tampering or fabrication

**Device Correlation:**
- [SUBJECT_PHONE] registered to device IMEI matching [SUBJECT_NAME]'s known personal phone
- Location data places device at [TARGET_ORGANIZATION] during work hours
- Location data places device at [MEETING_LOCATION] at times matching dead drop schedule

### Identity Confirmation

**Real Name Usage - Statistical Analysis:**
Handler used subject's real name ([SUBJECT_NAME]) **8 times** across 5 conversation threads.

**Usage Pattern:**
1. During operational tasking (3 instances)
2. During pressure/coercion (2 instances)
3. During cell leadership briefing (2 instances)
4. During praise/reassurance (1 instance)

**Conclusion:** Real name usage is consistent, intentional, and confirms [SUBJECT_NAME]'s identity as [SUBJECT_CODENAME] / ENTROPY asset.

### Operational Intelligence Extracted

**Confirmed Facts:**
- Subject's real identity: [SUBJECT_NAME]
- ENTROPY designation: [SUBJECT_CODENAME]
- Cell affiliation: [CELL_DESIGNATION]
- Handler: [HANDLER_CODENAME]
- Operations participated in: [OPERATION_NAME]
- Data provided: [DATA_TYPE] from [TARGET_ORGANIZATION]
- Payment received: $[AMOUNT] (with additional payments referenced)
- Recruitment method: Financial pressure
- Current status: Active asset, showing reluctance
- Cooperation likelihood: Moderate-High (trapped, wants out, coerced)

**Additional Intelligence:**
- Multiple assets at [TARGET_ORGANIZATION] (second asset: [SECOND_ASSET_CODENAME])
- Operation [OPERATION_NAME] has multiple phases
- Cell uses dead drop methodology at [MEETING_LOCATION]
- Handler phone: [HANDLER_PHONE] (high value target)

---

## LEGAL ASSESSMENT

### Admissibility as Evidence

**Federal Prosecution Viability:** VERY HIGH

**Applicable Charges:**
1. **18 U.S.C. § 1030** - Computer Fraud and Abuse Act
   - Unauthorized access to computer systems
   - Theft of data exceeding $5,000 value
   - Evidence: Subject's own admissions in messages

2. **18 U.S.C. § 1831** - Economic Espionage Act
   - Theft of trade secrets
   - Evidence: [DATA_TYPE] exfiltration for benefit of ENTROPY

3. **18 U.S.C. § 371** - Conspiracy
   - Conspiracy to commit computer fraud
   - Evidence: Coordinated activity with [HANDLER_CODENAME]

**Evidentiary Strengths:**
✓ Subject's own words confirming criminal activity
✓ Real name confirmed multiple times (eliminates identity defense)
✓ Specific systems, data, and dates documented
✓ Payment trail corroboration available
✓ Handler identity and contact information revealed
✓ Proper acquisition (warrant-based or seized device)

**Evidentiary Considerations:**
⚠️ Subject shows signs of coercion/victimization
⚠️ Financial pressure exploitation evident
⚠️ Subject expressed desire to stop (shows remorse)
⚠️ May warrant consideration for cooperation agreement rather than maximum prosecution

### Authentication Requirements

**Prosecutor Needs:**
- [ ] Warrant documentation for acquisition
- [ ] Chain of custody records
- [ ] Device forensics report linking phone to subject
- [ ] Carrier records confirming phone registration
- [ ] Expert witness testimony on Signal encryption/authentication
- [ ] Corroborating evidence (financial records, access logs, surveillance)

**Defense Challenges Likely:**
- "Messages could be fabricated"
  - **Counter:** Metadata verification, cryptographic authentication
- "Phone belonged to someone else"
  - **Counter:** IMEI records, location data, carrier registration
- "Coerced into participation, victim not perpetrator"
  - **Counter:** Partially valid; recommend cooperation agreement

---

## GAMEPLAY INTEGRATION

### Discovery Scenarios

**How Players Might Obtain This Evidence:**

**Scenario A: Server Compromise**
- SAFETYNET cyberops team compromises ENTROPY communications server
- Decrypts message backups stored on C2 infrastructure
- Discovers [SUBJECT_NAME] among active assets

**Scenario B: Handler Device Seizure**
- Arrest or surveillance of [HANDLER_CODENAME]
- Forensic examination of seized mobile device
- Signal message history recovered

**Scenario C: Signal Safety Number Compromise**
- Cryptographic breakthrough or stolen device keys
- Retroactive decryption of intercepted Signal traffic
- Specific conversations between handler and assets revealed

**Scenario D: Asset Cooperation**
- Different ENTROPY asset provides intelligence
- Names [SUBJECT_NAME] as fellow operative
- Provides handler contact information leading to message logs

### Player Actions Enabled

**Immediate Actions:**
- Flag [SUBJECT_NAME] as confirmed ENTROPY asset
- Issue warrant for arrest based on own admissions
- Seize [SUBJECT_PHONE] for additional forensics
- Trace [HANDLER_PHONE] for surveillance/arrest

**Investigation Actions:**
- Identify [SECOND_ASSET_CODENAME] (second asset at [TARGET_ORGANIZATION])
- Map [CELL_DESIGNATION] structure via handler communications
- Identify [OPERATION_NAME] as active ENTROPY operation
- Corroborate with financial records (look for $[AMOUNT] payments)

**Strategic Actions:**
- Offer cooperation agreement (subject wants out, shows remorse)
- Flip [SUBJECT_NAME] to provide intelligence on [HANDLER_CODENAME]
- Use [SUBJECT_NAME] as double agent (risky but high reward)
- Coordinate simultaneous arrests of subject + handler

### Interrogation Approach Options

**Approach 1: Overwhelming Evidence (Direct)**
> "We have your Signal messages with your ENTROPY handler. They used your real name, [SUBJECT_NAME]. They discussed Operation [OPERATION_NAME]. You admitted to stealing [DATA_TYPE]. There's no defense here."

**Success Likelihood:** 70% immediate cooperation

**Approach 2: Empathetic/Victim-Focused**
> "We read your messages. We saw you tried to get out. We saw your handler threaten you. You're a victim here, [SUBJECT_NAME]. Let us help you."

**Success Likelihood:** 85% cooperation (subject shows remorse, was coerced)

**Approach 3: Strategic Flip**
> "Your handler [HANDLER_CODENAME] used your real name in messages. They documented everything you did. You think they're protecting you? They're creating evidence against you. Help us get THEM, and we'll help you."

**Success Likelihood:** 90% cooperation (subject already resentful of handler)

**Approach 4: Double Agent Recruitment**
> "Keep talking to your handler. But now you work for us. We'll tell you what to say. We'll use you to take down the entire cell. In exchange, cooperation agreement and protection."

**Success Likelihood:** 60% (risky, requires courage subject may not have)

### Success Metrics

**Evidence Value:**
- **Alone:** 75% confidence (very strong, subject's own admissions)
- **+ Financial Records:** 90% confidence (payments match message discussions)
- **+ Access Logs:** 95% confidence (activity matches tasking)
- **+ Surveillance Photos:** 98% confidence (dead drops match message coordination)
- **+ All Evidence Types:** 99.9% confidence (overwhelming, complete picture)

**Cooperation Probability:**
- Subject shows high cooperation potential
- Already wanted out
- Resentful of handler's coercion
- Remorseful about criminal activity
- **Base Cooperation:** 75%
- **With Empathetic Approach:** 85%
- **With Protection Offer:** 90%
- **With Family Safety Assurances:** 95%

**Intelligence Yield:**
If subject cooperates, provides:
- Complete [CELL_DESIGNATION] operational details
- Identity of [HANDLER_CODENAME]
- Location of [SECOND_ASSET_CODENAME]
- Details on [OPERATION_NAME] phases
- Dead drop locations and procedures
- Payment methods and wallet addresses
- Handler's other assets (if known)

---

## CROSS-REFERENCE CONNECTIONS

### Corroborating Evidence Templates

**TEMPLATE_002 (Financial Records):**
- Look for $[AMOUNT] deposits matching message timeline
- Cryptocurrency transactions mentioned in messages
- Payment dates should align with "payment cleared" messages

**TEMPLATE_003 (Access Logs):**
- Match data extraction dates to message tasking
- [SYSTEM_NAME] access should correlate with deadlines
- USB usage on dates matching dead drop schedule

**TEMPLATE_004 (Surveillance Photos):**
- [MEETING_LOCATION] surveillance should show subject
- Dead drop photos should match Thursday 22:00 timeline
- Handler photos should match [HANDLER_CODENAME] description

**TEMPLATE_005 (Handwritten Notes):**
- Subject's notes might reference [HANDLER_CODENAME]
- Notes might show same operations ([OPERATION_NAME])
- Emotional arc matches message progression (willing → trapped)

### Interconnected Story Elements

**Related Narrative Fragments:**
- **RECRUITMENT_001:** Financial pressure methodology matches subject's recruitment
- **TACTICAL_001:** If [OPERATION_NAME] is infrastructure attack, connects to broader plot
- **LEVERAGE_001:** Subject's [PRESSURE_DETAIL] could be leverage point
- **VICTIM_001:** Subject's data theft may have enabled attacks with human casualties

**Cell Structure Mapping:**
- [CELL_DESIGNATION] hierarchy includes [CELL_LEADER_CODENAME]
- [HANDLER_CODENAME] manages multiple assets
- [SECOND_ASSET_CODENAME] is second penetration at [TARGET_ORGANIZATION]
- Operation [OPERATION_NAME] involves multiple cells (check other fragments)

---

## EDUCATIONAL VALUE (CyBOK Alignment)

### Security Concepts Demonstrated

**Encrypted Communications Security:**
- Signal protocol and end-to-end encryption
- Limitations: Encryption protects in transit, not at endpoints
- Proper OPSEC: Using codenames vs. real names
- Handler's operational security failure (using real name)

**Digital Forensics:**
- Mobile device forensics and evidence extraction
- Message metadata analysis and authentication
- Correlation of communication logs with other evidence types
- Chain of custody in digital evidence

**Insider Threat Indicators:**
- Handler/asset communication patterns
- Coercion and leverage tactics
- Operational tasking and coordination
- Subject's psychological state and vulnerability

**Counterintelligence:**
- Identifying assets via compromised communications
- Flipping assets through cooperation agreements
- Mapping adversary organizational structure
- Exploiting operational security failures

### Learning Outcomes

**Players Learn:**
1. **OPSEC Failures:** Using real names in operational comms is critical error
2. **Communication Security:** Encrypted ≠ Secure if endpoints are compromised
3. **Evidence Correlation:** Messages provide timeline to cross-reference other evidence
4. **Psychological Warfare:** Coercion tactics used by handlers on assets
5. **Legal Process:** How digital communications become admissible evidence
6. **Ethical Complexity:** Subject is perpetrator AND victim (coerced, wants out)

---

## TEMPLATE USAGE NOTES

### When to Use This Template

**Best For:**
- Confirming suspected asset's real identity
- Revealing handler-asset relationships
- Documenting specific operations
- Showing coercion and victimization
- Mapping cell structure
- Creating high-cooperation scenarios

**Scenario Types:**
- Corporate infiltration (data theft)
- Infrastructure targeting (insider access)
- Espionage operations (coordinated exfiltration)
- Multi-asset coordination (cell operations)

### Customization Tips

**Handler Personality:**
- Professional/Cold: Minimal pleasantries, direct tasking
- Manipulative: Alternates threats and reassurance
- Ideological: Appeals to ENTROPY philosophy
- Transactional: Pure business, payment-focused

**Subject Personality:**
- Reluctant: Nervous, questioning, wants out
- Professional: Competent, efficient, detached
- Desperate: Financially motivated, compliant
- Ideological: True believer, enthusiastic

**Message Volume:**
- Light: 3-5 messages showing key moments
- Medium: 10-15 messages showing progression
- Heavy: 20+ messages showing complete relationship arc

**Timeline:**
- Compressed: Days or weeks (urgent operation)
- Extended: Months (long-term asset cultivation)
- Archived: Years (established relationship)

### Rarity and Discovery

**Recommended Rarity:** RARE

**Rationale:**
- Requires significant SAFETYNET achievement (server compromise, handler arrest)
- Very high evidential value
- Provides extensive intelligence beyond subject identification
- Should feel like major breakthrough

**Discovery Timing:**
- **Early Game:** Too easy, undermines player progression
- **Mid Game:** Reward for successful operation (handler device seizure)
- **Late Game:** Strategic intelligence for Phase 3 operations

**Discovery Difficulty:** HARD
- Requires successful cyberops mission OR tactical arrest
- May require multiple prerequisite achievements
- Should be earned, not stumbled upon

---

## TECHNICAL IMPLEMENTATION

### Message Log Data Structure

```json
{
  "evidence_id": "TEMPLATE_006_[SUBJECT_NAME]",
  "evidence_type": "encrypted_message_logs",
  "subject": {
    "real_name": "[SUBJECT_NAME]",
    "codename": "[SUBJECT_CODENAME]",
    "phone": "[SUBJECT_PHONE]",
    "organization": "[TARGET_ORGANIZATION]",
    "position": "[SUBJECT_POSITION]"
  },
  "handler": {
    "codename": "[HANDLER_CODENAME]",
    "phone": "[HANDLER_PHONE]",
    "cell": "[CELL_DESIGNATION]"
  },
  "real_name_usage_count": 8,
  "coercion_indicators": ["financial_pressure", "legal_threat", "trapped_language"],
  "cooperation_likelihood": 85,
  "evidence_strength": 75,
  "corroboration_bonus": {
    "financial_records": 15,
    "access_logs": 20,
    "surveillance": 23
  }
}
```

### Unlock Conditions

```python
def unlock_message_log_evidence(game_state):
    # Require one of these achievements:
    if (game_state.completed_mission("Server_Compromise") or
        game_state.completed_mission("Handler_Arrest") or
        game_state.discovered_fragment("ENTROPY_C2_SERVER")):

        return True
    return False

def calculate_cooperation(evidence_collected, approach):
    base_cooperation = 75  # Subject wants out

    if approach == "empathetic":
        base_cooperation += 10
    if approach == "protection_offer":
        base_cooperation += 15
    if "TEMPLATE_005" in evidence_collected:  # Handwritten notes
        base_cooperation += 5  # Corroborates emotional state

    return min(base_cooperation, 98)
```

---

**CLASSIFICATION:** EVIDENCE TEMPLATE - AGENT IDENTIFICATION
**PRIORITY:** VERY HIGH (Direct real name identification)
**REUSABILITY:** High (adapt to any NPC asset scenario)
**COOPERATION POTENTIAL:** Very High (subject shows remorse, coercion)

---

**End of Template 006**
