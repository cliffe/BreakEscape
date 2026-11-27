// ===========================================
// Mission 3: Ghost in the Machine
// TERMINAL: Drop-Site (VM Flag Submission)
// Location: Server Room
// ===========================================

// Tracking which flags have been submitted
VAR flag_scan_network_submitted = false
VAR flag_ftp_banner_submitted = false
VAR flag_http_analysis_submitted = false
VAR flag_distcc_exploit_submitted = false
VAR flags_submitted_count = 0

// External variables
EXTERNAL player_name()

// ===========================================
// MAIN TERMINAL INTERFACE
// ===========================================

=== start ===
#speaker:computer

╔═══════════════════════════════════════════╗
║   SAFETYNET DROP-SITE TERMINAL v2.4.1   ║
║   Secure Intelligence Submission System   ║
╚═══════════════════════════════════════════╝

Connection established: SAFETYNET Central
Agent ID: {player_name()}
Mission: M03 - Ghost in the Machine
Status: ACTIVE

Submit intercepted ENTROPY intelligence (VM flags) for analysis.

Flags submitted: {flags_submitted_count}/4

-> hub

// ===========================================
// TERMINAL HUB
// ===========================================

=== hub ===

+ {not flag_scan_network_submitted} [Submit Flag: Network Scan]
    -> submit_scan_network

+ {not flag_ftp_banner_submitted} [Submit Flag: FTP Banner]
    -> submit_ftp_banner

+ {not flag_http_analysis_submitted} [Submit Flag: HTTP Analysis]
    -> submit_http_analysis

+ {not flag_distcc_exploit_submitted} [Submit Flag: distcc Exploitation]
    -> submit_distcc_exploit

+ [View submission history]
    -> view_history

+ [Exit terminal]
    #exit_conversation
    -> DONE

// ===========================================
// FLAG 1: NETWORK SCAN
// ===========================================

=== submit_scan_network ===
#speaker:computer

Enter intercepted intelligence flag:

[> flag\{network_scan_complete\}]

Processing...

✓ FLAG VERIFIED
✓ Intelligence authenticated
✓ Network reconnaissance data decoded

ANALYSIS REPORT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Target Network: 192.168.100.0/24
Services Identified:
- FTP (vsftpd 2.3.4) on port 21
- HTTP (Apache 2.4.18) on port 80
- distcc daemon on port 3632
- SSH on port 22

Assessment: Zero Day training network confirmed active.
Multiple vulnerable services detected for client training.

SAFETYNET Intelligence: This network profile matches
ENTROPY operational training environments. Proceed with
service-level enumeration.

Unlocked: Banner grabbing and HTTP analysis objectives

~ flag_scan_network_submitted = true
~ flags_submitted_count += 1

#complete_task:scan_network
#unlock_task:ftp_banner
#unlock_task:http_analysis

+ [Continue]
    -> hub

// ===========================================
// FLAG 2: FTP BANNER
// ===========================================

=== submit_ftp_banner ===
#speaker:computer

Enter intercepted intelligence flag:

[> flag\{ftp_intel_gathered\}]

Processing...

✓ FLAG VERIFIED
✓ FTP service banner decoded
✓ Client codename extracted

ANALYSIS REPORT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Service: vsftpd 2.3.4 (Backdoor variant)
Banner: "Welcome to GHOST training server"

CRITICAL INTELLIGENCE:
Codename "GHOST" identified in FTP welcome banner.

Cross-reference: GHOST is known alias for Ransomware Inc
operations against healthcare infrastructure.

M2 HOSPITAL ATTACK CONNECTION:
St. Catherine's Regional Medical Center ransomware
deployment used "GHOST" signature in encrypted notes.

ASSESSMENT: Confirms Zero Day provided training/testing
environment for Ransomware Inc hospital attacks.

~ flag_ftp_banner_submitted = true
~ flags_submitted_count += 1

#complete_task:ftp_banner

+ [This proves the M2 connection...]
    You input: This confirms Zero Day trained the M2 attackers.

    System response: Affirmative. Evidence chain strengthening.
                     Continue gathering intelligence.
    -> hub

+ [Continue]
    -> hub

// ===========================================
// FLAG 3: HTTP ANALYSIS
// ===========================================

=== submit_http_analysis ===
#speaker:computer

Enter intercepted intelligence flag:

[> flag\{pricing_intel_decoded\}]

Processing...

✓ FLAG VERIFIED
✓ Base64-encoded pricing data decoded
✓ Commercial intelligence extracted

ANALYSIS REPORT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HTTP Service: Apache 2.4.18
Hidden Data: Base64-encoded comment in HTML

DECODED PRICING STRUCTURE:
---
CVSS 9.0-10.0 (CRITICAL): $35,000 base
CVSS 7.0-8.9 (HIGH): $15,000-$20,000 base
CVSS 4.0-6.9 (MEDIUM): $6,000-$7,500 base

SECTOR PREMIUMS:
Healthcare: +30% (delayed incident response)
Energy/Infrastructure: +40% (regulatory scrutiny)
Finance: +25% (insurance budgets)
Education: +15% (limited resources)
---

ASSESSMENT: Commercial exploit marketplace confirmed.
Pricing model optimized for targeting vulnerable sectors.

"Healthcare premium" explicitly references victims'
inability to respond quickly. Calculated exploitation
of defensive weaknesses.

RECOMMENDATION: Correlate with physical evidence of
exploit sales. Locate transaction records.

~ flag_http_analysis_submitted = true
~ flags_submitted_count += 1

#complete_task:http_analysis

+ [They charge MORE to attack the vulnerable...]
    You input: Healthcare premium = profiting from victims' weakness

    System response: Correct assessment. Evidence of calculated harm.
                     This strengthens prosecution case significantly.
    -> hub

+ [Continue]
    -> hub

// ===========================================
// FLAG 4: DISTCC EXPLOITATION (CRITICAL)
// ===========================================

=== submit_distcc_exploit ===
#speaker:computer

Enter intercepted intelligence flag:

[> flag\{distcc_legacy_compromised\}]

Processing...

✓ FLAG VERIFIED
✓ distcc service exploitation successful
✓ Operational logs accessed

⚠ CRITICAL INTELLIGENCE ALERT ⚠

ANALYSIS REPORT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Service: distcc daemon (CVE-2004-2687)
Exploitation: Remote code execution achieved
Access Level: Full system compromise

OPERATIONAL LOGS RECOVERED:

> Exploit deployment log (2024-05-15):
  ProFTPD 1.3.5 backdoor CVE-2010-4652
  CLIENT: GHOST (Ransomware Incorporated)
  TARGET: St. Catherine's Regional Medical Center
  PRICE: $12,500 ($9,615 base + $2,885 healthcare premium)
  STATUS: Delivered
  AUTHORIZATION: Victoria Sterling (Cipher)
  ARCHITECT DIRECTIVE: Priority - Healthcare Phase 1

⚠ M2 HOSPITAL ATTACK - DIRECT EVIDENCE ⚠

This is the smoking gun. Zero Day Syndicate sold the
exact exploit used in the St. Catherine's attack that
killed 6 people in critical care.

Payment received. Exploit delivered. Attack executed.

ADDITIONAL INTELLIGENCE:
Reference to "The Architect" - likely ENTROPY leadership.
"Healthcare Phase 1" suggests coordinated multi-phase
attack campaign.

SPAWNING PHYSICAL EVIDENCE:
Check executive office for operational logs document.
May contain Phase 2 targeting information.

~ flag_distcc_exploit_submitted = true
~ flags_submitted_count += 1

#complete_task:distcc_exploit
#unlock_task:find_operational_logs

+ [We have them. We can prove everything.]
    You input: This proves causation. Zero Day → GHOST → St. Catherine's.

    System response: Affirmative. Evidence chain complete.
                     6 fatalities directly attributable to Zero Day sales.
                     Federal prosecution viable with this evidence.
    -> m2_revelation_event

+ [Continue]
    -> m2_revelation_event

// ===========================================
// M2 REVELATION EVENT (After distcc flag)
// ===========================================

=== m2_revelation_event ===
#speaker:computer

TRIGGERING EVENT: M2_REVELATION
Connecting to Agent 0x99...

[Terminal displays: INCOMING SECURE CALL]

#trigger_event:m2_revelation_call

The terminal remains active for further submissions.

-> hub

// ===========================================
// VIEW SUBMISSION HISTORY
// ===========================================

=== view_history ===
#speaker:computer

╔══════════════════════════════════════════╗
║        SUBMISSION HISTORY LOG           ║
╚══════════════════════════════════════════╝

Flags submitted: {flags_submitted_count}/4

{flag_scan_network_submitted:
    [✓ FLAG 1: Network Scan (192.168.100.0/24)]
    [Status: Verified -Services enumerated]
}

{flag_ftp_banner_submitted:
    [✓ FLAG 2: FTP Banner (GHOST codename)]
    [Status: Verified -M2 connection identified]
}

{flag_http_analysis_submitted:
    [✓ FLAG 3: HTTP Pricing Data]
    [Status: Verified -Exploit pricing model decoded]
}

{flag_distcc_exploit_submitted:
    [✓ FLAG 4: distcc Exploitation (CRITICAL)]
    [Status: Verified -Operational logs recovered]
    [⚠ M2 smoking gun evidence confirmed]
}

{flags_submitted_count == 4:
    ═══════════════════════════════════════════
    ALL FLAGS SUBMITTED - MISSION CRITICAL
    Evidence package complete for prosecution.
    ═══════════════════════════════════════════
}

+ [Return to main menu]
    -> hub

// ===========================================
// END
// ===========================================
