# Subsystem Descriptions — Meridian Cyber Insurance

## Policy Management System (PMS)

Meridian's Policy Management System is the central repository for all underwriting data. It holds the complete policy lifecycle record for each of Meridian's 500+ active policies — from initial application and risk assessment through to renewal, endorsement, and expiry.

**Key data held:**
- Policy wordings and endorsement schedules
- Warranty schedules (security control obligations accepted by each policyholder)
- Risk assessment reports (site visit records, technical questionnaires, vulnerability assessment summaries)
- Premium calculation models and pricing history
- Renewal history and material change notifications from policyholders
- Quarterly security posture reports submitted by policyholders

**Security considerations:** The PMS contains the most concentrated collection of policyholder security posture data in Meridian's estate. A compromise of the PMS would reveal the security weaknesses of over 500 critical infrastructure organisations — a threat intelligence goldmine. Access is restricted to the underwriting team via role-based access control with multi-factor authentication. The database is encrypted at rest (AES-256) and all access is logged for audit. Policyholder data is logically segregated to prevent cross-client data exposure.

**Role in the Albion incident:** The PMS provides the underwriting file for the Albion policy — including the original risk assessment noting IT/OT boundary deficiencies, the warranty schedule with the twelve-month remediation deadline (Warranty W-07), and Albion's quarterly posture reports showing the remediation remained incomplete.

---

## Claims Management System (CMS)

The Claims Management System is the operational platform for active and historic claims. It functions as the coordination hub during a major incident, providing a shared workspace for the claims team, forensic team, loss adjuster, and legal counsel.

**Key functions:**
- Incident notification intake and triage (severity classification, initial coverage check)
- Claim file management (correspondence, reports, financial records, decision logs)
- Loss adjuster and forensic team task assignment and reporting
- Financial tracking: incurred costs, reserved amounts, paid amounts, reinsurance notifications
- Workflow automation: triggers for evidence preservation notices, regulatory notifications, and reinsurance attachment point alerts
- Audit trail: all coverage decisions, committee minutes, and legal opinions are recorded with timestamps and author attribution

**Security considerations:** The CMS processes live incident data, including forensic artefacts, legal-privileged communications, and financial exposure calculations. Access controls are tiered: claims handlers see their assigned cases; senior managers see portfolio views; legal counsel accesses case files on a per-appointment basis. External parties (loss adjusters, external forensic firms) receive scoped, time-limited access to specific case files through a secure portal.

**Role in the Albion incident:** The CMS is the central record for the entire Albion claim — from Whitworth's initial telephone notification through forensic investigation, coverage committee deliberation, and the eventual settlement or arbitration.

---

## Forensic Data Platform (FDP)

Meridian's in-house forensic team operates a dedicated evidence management and analysis platform, physically and logically separated from Meridian's production corporate network.

**Key capabilities:**
- Secure evidence intake: encrypted transfer protocols for receiving disk images, memory dumps, network captures, and malware samples from policyholder sites
- Isolated analysis environments: sandboxed virtual machines for malware detonation and artefact analysis, preventing contamination of Meridian's production systems
- Chain-of-custody management: cryptographic hashing of all evidence items on intake, with tamper-evident logs tracking every access and modification
- Reporting: structured forensic reports generated within the platform and published to the CMS for the claims team

**Security considerations:** The FDP is the highest-security system in Meridian's estate. It holds potentially live malware, active indicators of compromise, and forensic images that may contain sensitive operational data from policyholders' ICS environments. The platform is air-gapped from Meridian's corporate email and internet-facing systems, with data transfer via approved, logged protocols only.

**Role in the Albion incident:** The FDP receives forensic images from the compromised Albion printers, the domain controller implant, the historian server proxy, and the jump server access logs. It also stores the historian time-series data that recorded the falsified (and actual) process values during the attack.

---

## Policyholder Security Telemetry

For a subset of industrial and critical infrastructure policyholders (approximately 120 of 500+ policies), Meridian receives a limited, automated telemetry feed from the policyholder's enterprise IT security monitoring platform.

**What Meridian receives:**
- Endpoint detection and response (EDR) alert summaries — severity-classified alerts, not raw endpoint logs
- Firewall summary logs — connection counts, blocked traffic summaries, anomaly flags
- Vulnerability scan result summaries — open vulnerabilities by severity, patch compliance percentages
- These feeds are transmitted via API integration, typically pulling data from the policyholder's SIEM or EDR platform on a daily or weekly cadence

**What Meridian does not receive:**
- Raw network traffic or full packet captures
- OT/SCADA system telemetry (explicitly excluded from the monitoring scope)
- Detailed endpoint logs or user activity records
- Any data from ICS protocols, PLC registers, or safety system configurations

**Security considerations:** The telemetry feed creates a potential attack vector — if Meridian's API endpoint were compromised, an attacker could poison the telemetry data to present a false picture of a policyholder's security posture, or use the API channel to pivot into the policyholder's security monitoring platform. Meridian's API integration uses mutual TLS authentication and IP allowlisting.

**Role in the Albion incident:** The telemetry feed from Albion's enterprise IT environment did not detect the attack. This is partially because the initial compromise (printer firmware backdoor) operated below the EDR's visibility, and partially because the SCADA/OT compromise was entirely outside the telemetry scope. Post-incident, the absence of OT telemetry is cited as a contributing factor in the late detection of the attack.

---

## Regulatory Reporting Portal

Meridian maintains interfaces with multiple regulatory bodies, managed through a compliance reporting module integrated with the CMS and PMS.

**Regulatory channels:**
- **FCA**: Meridian submits regular returns on claims handling performance, complaints data, and conduct risk indicators. Major claims that raise treating-customers-fairly concerns are flagged for supervisory review.
- **PRA**: Meridian reports on capital adequacy, reserving levels, and aggregate exposure. Large losses approaching reinsurance attachment points trigger mandatory PRA notifications.
- **Lloyd's**: Meridian reports syndicate-level exposure data, premium income, and compliance with Lloyd's mandates (including the LMA21/22 silent cyber positioning). Lloyd's also conducts periodic reviews of Meridian's underwriting standards and claims handling practices.
- **NCSC / Ofgem / ICO (indirect)**: Meridian does not report directly to these bodies for policyholder incidents. However, the compliance module tracks Albion's regulatory filings (as shared by Albion's solicitor) to ensure consistency with the claims file and to monitor for developments that could affect coverage (e.g., an Ofgem enforcement notice referencing warranty-relevant security failures).

**Role in the Albion incident:** The compliance module generates a PRA large-loss notification when the Albion claim reserve exceeds £5 million. It also records Meridian's internal assessment that the claims handling process complies with FCA treating-customers-fairly requirements — a record that may be relevant if the coverage determination is challenged.
