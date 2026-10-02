# TEMPLATE: Unauthorized System Access Pattern

**Fragment ID:** EVIDENCE_AGENT_ID_003
**Gameplay Function:** Agent Identification Evidence (Technical)
**Evidence Type:** System access logs and audit trail
**Rarity:** Common
**Substitution Required:** [SUBJECT_NAME], [POSITION], [SYSTEM_NAME], [DATA_TYPE]

---

## Evidence Summary

**Item:** System access log analysis
**Subject:** [SUBJECT_NAME], [POSITION]
**Evidence Quality:** HIGH (technical logs are objective)
**Admissibility:** HIGH (system logs with proper chain of custody)

---

## Access Log Analysis Report

```
╔═══════════════════════════════════════════════════════╗
║     SYSTEM ACCESS AUDIT REPORT                        ║
║     Unauthorized Activity Detection                   ║
╚═══════════════════════════════════════════════════════╝

REPORT ID: SYS-AUDIT-[REPORT_NUMBER]
GENERATED: [CURRENT_DATE]
ANALYST: IT Security Team / SAFETYNET Technical Division
SUBJECT: [SUBJECT_NAME]
EMPLOYEE ID: [EMP_ID]
POSITION: [POSITION]
DEPARTMENT: [DEPARTMENT]
AUTHORIZED ACCESS LEVEL: [ACCESS_LEVEL]

═══════════════════════════════════════════════════════

SUMMARY:
Comprehensive analysis of system access logs reveals
pattern of unauthorized access to systems and data
outside subject's job responsibilities and clearance level.

Activity consistent with data exfiltration preparation
and reconnaissance for ENTROPY operations.

═══════════════════════════════════════════════════════
BASELINE LEGITIMATE ACCESS
═══════════════════════════════════════════════════════

Based on position [POSITION], subject should access:

AUTHORIZED SYSTEMS:
✓ [SYSTEM_1] - Required for daily work
✓ [SYSTEM_2] - Department shared resources
✓ [SYSTEM_3] - Communication tools
✓ [SYSTEM_4] - Standard employee applications

AUTHORIZED DATA:
✓ [DATA_TYPE_1] - Related to job function
✓ [DATA_TYPE_2] - Department information
✓ [DATA_TYPE_3] - Public/shared company data

TYPICAL USAGE PATTERN:
• Login times: 08:00-18:00 (business hours)
• Access frequency: Multiple times daily
• Data volume: Normal for position
• Locations: Office workstation, VPN from home

═══════════════════════════════════════════════════════
UNAUTHORIZED ACCESS DETECTED
═══════════════════════════════════════════════════════

INCIDENT #1: SENSITIVE DATABASE ACCESS

Date/Time: [DATE_TIME_1]
System: [SENSITIVE_SYSTEM]
Access Method: SQL query via admin console
User Account: [SUBJECT_NAME]@[ORGANIZATION]
Location: Office workstation (IP: [IP_ADDRESS])

QUERY EXECUTED:
SELECT * FROM [DATABASE].[TABLE]
WHERE [CRITERIA]
LIMIT 50000

ANALYSIS:
✗ [SUBJECT_NAME] has NO authorized access to [SENSITIVE_SYSTEM]
✗ Position [POSITION] has no business need for this data
✗ Query extracted [DATA_TYPE] for 50,000 records
✗ Data volume far exceeds any legitimate need
✗ Query format suggests data exfiltration intent

RED FLAGS:
• Access outside job responsibilities
• Large-scale data extraction
• No ticket/request for access
• Used elevated credentials (how obtained?)
• Timing: After hours (22:34)

───────────────────────────────────────────────────────

INCIDENT #2: NETWORK INFRASTRUCTURE MAPPING

Date/Time: [DATE_TIME_2]
System: Network Management Console
Access Method: Direct login
User Account: [SUBJECT_NAME] (used supervisor's credentials!)
Location: Office (IP: [IP_ADDRESS])

ACTIONS PERFORMED:
• Exported network topology diagram
• Downloaded firewall rule configurations
• Accessed VPN server logs
• Queried active directory structure
• Downloaded security camera placement map

ANALYSIS:
✗ Supervisor credentials compromised/shared (security violation)
✗ Network admin access not authorized for [POSITION]
✗ Infrastructure documentation downloaded (reconnaissance)
✗ Security architecture exposed
✗ No legitimate business justification exists

RED FLAGS:
• Credential theft/sharing (serious violation)
• Complete infrastructure reconnaissance
• Downloaded security-sensitive diagrams
• Classic pre-attack intelligence gathering
• Timing: Weekend (Saturday 14:23)

───────────────────────────────────────────────────────

INCIDENT #3: HUMAN RESOURCES DATABASE

Date/Time: [DATE_TIME_3]
System: HR Management System
Access Method: Web portal login
User Account: [SUBJECT_NAME]
Location: Unknown (VPN from residential IP)

DATA ACCESSED:
• Employee personal information (500+ records)
• Salary and compensation data
• Home addresses and contact info
• Security clearance levels
• Emergency contacts

ANALYSIS:
✗ HR system access not authorized for [POSITION]
✗ Accessed 500+ employee records (entire department)
✗ No HR-related job responsibilities
✗ Personal data with no legitimate need
✗ Pattern suggests target profiling for ENTROPY

RED FLAGS:
• Mass employee data access
• Personal information exfiltration
• Possible recruitment target identification
• Social engineering preparation
• Timing: Evening from home (20:15)

───────────────────────────────────────────────────────

INCIDENT #4: EXECUTIVE EMAIL ACCESS

Date/Time: [DATE_TIME_4]
System: Email server (Exchange)
Access Method: PowerShell remote access
User Account: [SUBJECT_NAME]
Location: Office (IP: [IP_ADDRESS])

ACTIVITY:
• Accessed CEO mailbox (unauthorized!)
• Read 127 emails marked "Confidential"
• Exported emails to PST file
• Downloaded email to external drive
• Deleted access logs (attempted cover-up)

ANALYSIS:
✗ Executive email access STRICTLY prohibited
✗ PowerShell used to bypass security controls
✗ Exported emails for offline viewing
✗ Attempted to delete evidence (consciousness of guilt)
✗ Contains privileged executive communications

RED FLAGS:
• Highest-level unauthorized access
• Corporate espionage indicators
• Active cover-up attempt (log deletion)
• Technical sophistication (PowerShell usage)
• Timing: Middle of night (02:17)

───────────────────────────────────────────────────────

INCIDENT #5: USB DEVICE USAGE

Date/Time: [DATE_TIME_5]
System: Endpoint detection (workstation)
Device: USB flash drive (128GB)
User Account: [SUBJECT_NAME]
Location: Office workstation

ACTIVITY:
• Connected unauthorized USB device
• Copied [FILE_COUNT] files to drive
• Total data: [DATA_SIZE] GB
• File types: .xlsx, .docx, .pdf, .pst
• Encryption detected on USB (secure storage)

ANALYSIS:
✗ USB devices prohibited by policy (DLP violation)
✗ Large-scale file copying to external media
✗ Included sensitive/confidential documents
✗ USB encrypted (hiding contents)
✗ Classic data exfiltration method

RED FLAGS:
• Policy violation (USB prohibition)
• Data exfiltration to portable media
• Encryption suggests premeditation
• Volume suggests systematic collection
• Timing: Late evening (19:45)

═══════════════════════════════════════════════════════
PATTERN ANALYSIS
═══════════════════════════════════════════════════════

TIMELINE OF UNAUTHORIZED ACTIVITY:

Week 1: [DATE_RANGE_1]
→ Initial reconnaissance (network mapping)
→ Identifying high-value systems

Week 2-3: [DATE_RANGE_2]
→ Unauthorized data access begins
→ Multiple system compromises
→ Credential elevation/theft

Week 4: [DATE_RANGE_3]
→ Large-scale data exfiltration
→ Executive communications accessed
→ USB device data export

PROGRESSION:
Reconnaissance → Access → Exfiltration → Cover-up

This timeline consistent with ENTROPY operational cadence:
- 2-4 weeks from recruitment to first deliverable
- Systematic approach (not random access)
- Escalating access levels
- Final exfiltration before rotation

TEMPORAL PATTERNS:

After-Hours Access: 78% of incidents
• 22:34, 02:17, 19:45, 20:15, 14:23 (weekend)
• Suggests covert activity awareness
• Avoiding daytime supervision
• Consciousness of wrongdoing

Weekend Access: 23% of incidents
• Saturday access to avoid scrutiny
• Reduced security staffing
• Fewer witnesses to activity

VPN/Remote Access: 34% of incidents
• From residential IP addresses
• Outside corporate network
• Harder to detect/monitor

═══════════════════════════════════════════════════════
TECHNICAL SOPHISTICATION INDICATORS
═══════════════════════════════════════════════════════

SKILLS DEMONSTRATED:

✓ PowerShell scripting (executive email access)
✓ SQL query construction (database extraction)
✓ Credential compromise (supervisor's account)
✓ Log manipulation (attempted deletion)
✓ Encryption usage (USB device)
✓ Network reconnaissance (topology mapping)

ASSESSMENT:
Subject demonstrates technical capabilities beyond
requirements of [POSITION]. Suggests:

1. Prior training (possibly ENTROPY-provided)
2. Security background (knows how to evade detection)
3. Deliberate skill application (not accidental)
4. Sophisticated adversary (not amateur mistake)

This level of sophistication consistent with:
→ Trained ENTROPY operative
→ Professional cyber criminal
→ Insider threat with external guidance
→ Asset with technical handler support

═══════════════════════════════════════════════════════
DATA EXFILTRATED (ESTIMATED)
═══════════════════════════════════════════════════════

Based on log analysis, subject likely obtained:

CATEGORY 1: CUSTOMER DATA
• [NUMBER] customer records
• Personal information (PII)
• Financial account details
• Contact information
Estimated Volume: [SIZE] GB

CATEGORY 2: INFRASTRUCTURE
• Network topology diagrams
• Security architecture docs
• Access control configurations
• Firewall rules and VPN configs
Estimated Volume: [SIZE] MB

CATEGORY 3: EMPLOYEE DATA
• 500+ employee personal records
• Salary and compensation data
• Security clearance information
• Contact details for recruitment targeting
Estimated Volume: [SIZE] MB

CATEGORY 4: EXECUTIVE COMMUNICATIONS
• 127 confidential emails
• Strategic planning documents
• Merger/acquisition discussions
• Proprietary business intelligence
Estimated Volume: [SIZE] MB

CATEGORY 5: PROPRIETARY DATA
• [FILE_COUNT] sensitive documents
• Trade secrets potential
• Intellectual property
• Competitive intelligence
Estimated Volume: [SIZE] GB

TOTAL ESTIMATED EXFILTRATION: [TOTAL_SIZE] GB

VALUE ASSESSMENT:
This data highly valuable for:
→ ENTROPY Phase 3 operations (customer targeting)
→ Future social engineering campaigns
→ Competitive intelligence sale
→ Infrastructure attack planning
→ Employee recruitment targeting

═══════════════════════════════════════════════════════
POLICY VIOLATIONS
═══════════════════════════════════════════════════════

Subject violated the following corporate policies:

✗ Acceptable Use Policy (Section 3.2)
  - Unauthorized system access

✗ Data Protection Policy (Section 2.1)
  - Accessed data without business need

✗ USB Device Policy (Section 4.7)
  - Used prohibited external storage

✗ Credential Sharing Policy (Section 1.3)
  - Used supervisor's credentials

✗ After-Hours Access Policy (Section 5.2)
  - Suspicious access patterns

✗ Data Classification Policy (Section 6.1)
  - Accessed confidential/secret data

✗ Log Integrity Policy (Section 7.4)
  - Attempted log deletion

RECOMMENDED EMPLOYMENT ACTION:
Immediate termination for cause with policies violated.

═══════════════════════════════════════════════════════
LEGAL IMPLICATIONS
═══════════════════════════════════════════════════════

CRIMINAL STATUTES POTENTIALLY VIOLATED:

Federal:
• 18 U.S.C. § 1030 - Computer Fraud and Abuse Act
• 18 U.S.C. § 1831 - Economic Espionage Act
• 18 U.S.C. § 2511 - Wiretap Act (email interception)

State:
• Computer trespass
• Theft of trade secrets
• Unauthorized access to computer systems

Civil:
• Breach of employment contract
• Breach of confidentiality agreement
• Trade secret misappropriation

POTENTIAL SENTENCES:
• Federal CFAA: Up to 10 years per count
• Economic espionage: Up to 15 years
• Multiple counts possible: 25+ years exposure

═══════════════════════════════════════════════════════
CONCLUSIONS AND RECOMMENDATIONS
═══════════════════════════════════════════════════════

EVIDENCE ASSESSMENT: DEFINITIVE

Subject [SUBJECT_NAME] engaged in systematic unauthorized
access to corporate systems and data exfiltration over
[TIMEFRAME] period.

Activity characteristics:
✓ Deliberate and premeditated
✓ Technically sophisticated
✓ Aligned with ENTROPY operational patterns
✓ Resulted in significant data compromise
✓ Included active cover-up attempts

CONFIDENCE LEVEL: 95%

This is not accidental access or policy misunderstanding.
This is deliberate espionage/data theft by trained operative
or ENTROPY asset.

IMMEDIATE RECOMMENDATIONS:

□ Suspend all system access immediately
□ Confiscate workstation and devices
□ Preserve all log evidence (legal hold)
□ Coordinate with SAFETYNET for investigation
□ Prepare termination documentation
□ Consider criminal prosecution
□ Assess damage and notify affected parties
□ Review security controls that failed

INVESTIGATION PRIORITIES:

□ How were supervisor credentials obtained?
□ What happened to exfiltrated data?
□ Are there other compromised employees?
□ What is subject's connection to ENTROPY?
□ Recover USB device if possible
□ Interview subject (with legal counsel present)
□ Coordinate with law enforcement

═══════════════════════════════════════════════════════

ANALYST NOTES:

The technical sophistication and systematic approach
suggests [SUBJECT_NAME] received external guidance,
likely from ENTROPY handler.

Pattern matches 12 other cases of ENTROPY asset behavior:
- Reconnaissance phase (2-3 weeks)
- Access escalation (1-2 weeks)
- Exfiltration (final week)
- Attempted cover-up

Subject likely recruited for specific access, trained on
what to collect, and provided tools/methods for exfiltration.

Recommend offering cooperation deal:
"Help us understand who recruited you, what they wanted,
and where the data went. We can help you if you help us."

Without cooperation, prosecution recommended.

- IT Security Team / SAFETYNET Liaison

═══════════════════════════════════════════════════════
CLASSIFICATION: TECHNICAL EVIDENCE - UNAUTHORIZED ACCESS
DISTRIBUTION: Security team, legal, SAFETYNET, management
HANDLING: Preserve original logs, maintain chain of custody
═══════════════════════════════════════════════════════
```

---

## Gameplay Integration

**This Fragment Enables:**

**Immediate Actions:**
- Suspend [SUBJECT_NAME]'s access (prevent further damage)
- Confiscate devices and conduct forensic analysis
- Initiate formal investigation
- Coordinate with SAFETYNET

**Confrontation Dialog:**
```
"We have your access logs, [SUBJECT_NAME].

[SENSITIVE_SYSTEM] at 22:34. You're not authorized for that system.

Network diagrams downloaded on Saturday. Why?

CEO's emails exported at 02:17. That's a federal crime.

128GB USB drive. Where did that data go?

We have timestamps. IP addresses. Exact files accessed.

This isn't a mistake. This is systematic data theft.

Who are you working for?"
```

**Player Choices:**

**APPROACH A: Technical Lockdown**
- Immediate suspension
- Forensic investigation
- Criminal prosecution
- No cooperation opportunity

**APPROACH B: Monitored Access**
- Allow continued access under surveillance
- Track who they contact
- Identify ENTROPY handler
- Build larger case

**APPROACH C: Confrontation + Deal**
- Show evidence
- Offer immunity for cooperation
- Learn ENTROPY methods
- Turn asset into informant

**APPROACH D: Counter-Intelligence**
- Feed false data through subject
- Use as unwitting double agent
- Track where data goes
- Identify ENTROPY infrastructure

---

## Success Metrics

**Evidence Strength:**
- System logs alone: 70% conviction probability
- Logs + financial records: 90% probability
- Logs + financial + surveillance: 95% probability
- Add confession: 99% probability

**Damage Assessment:**
- Data exfiltrated: [TOTAL_SIZE] GB
- Systems compromised: [NUMBER]
- Policy violations: 7 major
- Potential impact: HIGH (customer data, exec comms)

**Recovery Actions:**
- Incident response: 2-4 weeks
- Customer notification: Required (data breach laws)
- Security improvements: $[COST_ESTIMATE]
- Reputational damage: Significant

---

## Template Substitution Guide

**Replace these placeholders:**

```
[SUBJECT_NAME] → NPC name
[POSITION] → Job title
[DEPARTMENT] → Department name
[ORGANIZATION] → Company name
[SYSTEM_NAME] → Specific system accessed (e.g., "Customer Database")
[DATA_TYPE] → Type of data (e.g., "financial records")
[SENSITIVE_SYSTEM] → High-value target system
[DATE_TIME_X] → Specific timestamps
[IP_ADDRESS] → Internal IP address
[FILE_COUNT] → Number of files exfiltrated
[DATA_SIZE] → Size of data exfiltrated
[ACCESS_LEVEL] → Authorized clearance level
```

**Realistic Technical Details:**
```
IP addresses: 10.x.x.x or 192.168.x.x (internal)
File counts: 50-500 (believable exfiltration)
Data sizes: 1-10 GB (USB-portable)
Timestamps: Mix of after-hours and weekends
Access levels: User, Power User, Admin
```

---

**CLASSIFICATION:** EVIDENCE TEMPLATE - TECHNICAL
**PRIORITY:** HIGH (Objective technical proof)
**REUSABILITY:** High (works for any insider threat)
**LEGAL VALUE:** Excellent (system logs are strong evidence)
**INVESTIGATION VALUE:** Excellent (shows what, when, how)
