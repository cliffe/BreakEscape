// ===========================================
// Mission 5: Drop-Site Terminal
// VM Flag Submission & Intelligence Processing
// ===========================================

VAR flag1_submitted = false
VAR flag2_submitted = false
VAR flag3_submitted = false
VAR flag4_submitted = false

// External variables
EXTERNAL player_name

// ===========================================
// TERMINAL MAIN HUB
// ===========================================

=== start ===
#speaker:computer

SAFETYNET DROP-SITE TERMINAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Secure intelligence submission channel for Operation Insider Trading.

Submit intercepted ENTROPY communications for analysis and resource unlocking.

Target: David Torres' Bludit CMS Server
Exploit: CVE-2019-16113 (Directory Traversal, Auth Bypass)

FLAGS REQUIRED: 4

-> flag_submission_hub

=== flag_submission_hub ===

+ {not flag1_submitted} [Submit FLAG 1: Reconnaissance]
    -> submit_flag1

+ {not flag2_submitted} [Submit FLAG 2: File System Access]
    -> submit_flag2

+ {not flag3_submitted} [Submit FLAG 3: Privilege Escalation]
    -> submit_flag3

+ {not flag4_submitted} [Submit FLAG 4: Architect Communications]
    -> submit_flag4

+ {flag1_submitted or flag2_submitted or flag3_submitted or flag4_submitted} [View Intelligence Summary]
    -> intelligence_summary

+ [Exit terminal]
    #exit_conversation
    -> DONE

// ===========================================
// FLAG 1: RECONNAISSANCE
// ===========================================

=== submit_flag1 ===
#speaker:computer

FLAG SUBMISSION INTERFACE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Enter flag from Bludit server reconnaissance:

[Player enters: flag{bludit_server_discovered}]

System: Verifying...

System: ✓ FLAG VERIFIED

System: Reconnaissance data extracted:
- Bludit CMS version 3.9.2 (vulnerable to CVE-2019-16113)
- Server hosted on Digital Vanguard infrastructure
- Encrypted database containing ENTROPY communications
- Upload history: 47 encrypted archives

~ flag1_submitted = true
#complete_task:submit_flag1_reconnaissance
#unlock_task:exploit_directory_traversal

+ [Continue]
    System: Intelligence level increased. Unlocking exploit path.
    -> flag_submission_hub

// ===========================================
// FLAG 2: FILE SYSTEM ACCESS
// ===========================================

=== submit_flag2 ===
#speaker:computer

FLAG SUBMISSION INTERFACE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Enter flag from directory traversal:

[Player enters: flag{traversal_files_found}]

System: Verifying...

System: ✓ FLAG VERIFIED

System: File manifest extracted:
- 73 encrypted archives (4.2 TB Project Heisenberg data)
- Payment records: $45,000 transferred to David Torres
- Meeting logs: Torres + "Recruiter" at Café Artemis (monthly)
- Exfiltration timeline: Started 6 weeks ago

~ flag2_submitted = true
#complete_task:submit_flag2_file_access
#unlock_task:escalate_privileges
#give_item:payment_records_document

+ [Continue]
    System: Payment records added to evidence. Digital trail established.
    -> flag_submission_hub

// ===========================================
// FLAG 3: PRIVILEGE ESCALATION
// ===========================================

=== submit_flag3 ===
#speaker:computer

FLAG SUBMISSION INTERFACE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Enter flag from privilege escalation:

[Player enters: flag{root_access_achieved}]

System: Verifying...

System: ✓ FLAG VERIFIED

System: Root access granted. Full database decrypted.

System: Torres recruitment timeline extracted:
- INITIAL CONTACT: 3 months ago (TalentStack "career consultation")
- FINANCIAL PRESSURE: $180K medical debt identified
- IDEOLOGICAL RADICALIZATION: Exposed to "accelerationist" philosophy
- GRADUAL COMPROMISE: Started with "harmless" financial data
- FULL RECRUITMENT: 6 weeks ago (Operation Schrödinger approved)

~ flag3_submitted = true
#complete_task:submit_flag3_privilege_escalation
#unlock_task:extract_architect_comms
#give_item:recruitment_timeline_document

+ [Continue]
    System: Recruitment methodology exposed. ENTROPY pattern confirmed.
    -> flag_submission_hub

// ===========================================
// FLAG 4: ARCHITECT COMMUNICATIONS
// ===========================================

=== submit_flag4 ===
#speaker:computer

FLAG SUBMISSION INTERFACE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Enter flag from Architect's encrypted communications:

[Player enters: flag{architect_approval_confirmed}]

System: Verifying...

System: ✓ FLAG VERIFIED - CRITICAL INTELLIGENCE

System: The Architect's Operation Schrödinger approval decoded:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FROM: The Architect
TO: Insider Threat Initiative - "Recruiter"
RE: Operation Schrödinger Authorization

STATUS: APPROVED

ASSET: QD-001 (David Torres)
VULNERABILITY SCORE: 94/100
    - Financial: 35/35 (Medical debt, insurance denial)
    - Access: 40/40 (TS/SCI, Project Heisenberg lead)
    - Psychological: 19/25 (Moral flexibility moderate)

TARGET DATA: Project Heisenberg (4.2 TB)
EXFILTRATION TIMELINE: 6 weeks
PAYMENT: $200,000 USD (cryptocurrency)

BUYERS CONFIRMED:
    - Chinese MSS: $28M
    - Russian GRU: $22M
    - Iranian IRGC: $18M
    TOTAL REVENUE: $68M

CASUALTY PROJECTION: 12-40 intelligence officers
    - Operational exposure: 60-90 days post-sale
    - Asset expendable if compromised

The Architect approves Operation Schrödinger.
Proceed with radicalization and exfiltration.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

~ flag4_submitted = true
#complete_task:submit_flag4_architect_comms
#unlock_aim:correlate_evidence
#give_item:architect_approval_document

+ [This is damning evidence]
    -> architect_analysis

=== architect_analysis ===
#speaker:computer

System: CRITICAL INTELLIGENCE ACQUIRED

Analysis:
- The Architect personally approved this operation
- Casualty projections KNOWN and ACCEPTED by ENTROPY leadership
- Asset classified as "expendable" (Torres considered disposable)
- Proves premeditated espionage at organizational level

Recommendation: Evidence sufficient for confrontation and prosecution.

#speaker:agent_0x99

[Agent 0x99 contacts you immediately]

Agent 0x99: {player_name}, I just saw the Architect comm. This is huge.

Agent 0x99: Torres knew about the casualties. ENTROPY told him explicitly.

Agent 0x99: But he's also "expendable" to them. They're using him.

Agent 0x99: Both things can be true. He's complicit AND he's a victim.

Agent 0x99: How you handle the confrontation - that's your call. Good luck.

+ [Understood]
    #exit_conversation
    -> flag_submission_hub

// ===========================================
// INTELLIGENCE SUMMARY
// ===========================================

=== intelligence_summary ===
#speaker:computer

INTELLIGENCE SUMMARY - OPERATION INSIDER TRADING
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FLAGS SUBMITTED: {flag1_submitted:1|0} + {flag2_submitted:1|0} + {flag3_submitted:1|0} + {flag4_submitted:1|0} = Total

{flag1_submitted:
    ✓ FLAG 1: Server reconnaissance complete
       - Bludit CMS vulnerable server identified
       - Digital Vanguard infrastructure confirmed
}

{flag2_submitted:
    ✓ FLAG 2: File system access achieved
       - Payment records: $45K to Torres
       - Meeting logs with "Recruiter"
}

{flag3_submitted:
    ✓ FLAG 3: Privilege escalation successful
       - Full recruitment timeline extracted
       - 3-month radicalization process exposed
}

{flag4_submitted:
    ✓ FLAG 4: Architect communications decoded
       - Operation approval confirmed
       - Casualty projections: 12-40 officers
       - Revenue projections: $68M total
       - Torres classified as "expendable asset"
}

{flag1_submitted and flag2_submitted and flag3_submitted and flag4_submitted:
    STATUS: FULL INTELLIGENCE PACKAGE ACQUIRED
    RECOMMENDATION: Proceed to evidence correlation and confrontation
}

+ [Return to main menu]
    -> flag_submission_hub

// ===========================================
// EXTERNAL EVENT: All Flags Submitted
// ===========================================

=== on_all_flags_complete ===
#speaker:agent_0x99

Agent 0x99: All four flags submitted. Outstanding work, {player_name}.

Agent 0x99: You have the full digital evidence chain.

Agent 0x99: Correlate this with physical evidence and you'll be ready to confront the insider.

#exit_conversation
-> END
