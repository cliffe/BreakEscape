# Cybersecurity Requirements — Meridian Cyber Insurance (Insurer's Own Systems)

These requirements define the security controls Meridian Cyber Insurance must maintain for its own information systems. While less dramatic than the ICS security requirements in Cases 1 and 2, these requirements are critical: Meridian holds detailed security posture information for over 500 critical infrastructure organisations. A compromise of Meridian's systems would constitute a significant threat intelligence breach.

---

## Data Classification and Access Control

**MER-SEC-001: Policyholder Data Classification**
All policyholder data held within the Policy Management System, Claims Management System, and Forensic Data Platform shall be classified according to a three-tier scheme: STANDARD (policy administrative data), SENSITIVE (security posture information, vulnerability assessments, warranty compliance records), and RESTRICTED (forensic evidence, active investigation data, attribution intelligence). Access controls shall be enforced commensurate with classification level.

**MER-SEC-002: Role-Based Access Control**
Access to Meridian's systems shall be governed by role-based access control (RBAC). Underwriting staff shall access the PMS; claims staff shall access the CMS; forensic staff shall access the FDP. Cross-functional access (e.g., a claims manager viewing the underwriting file) shall require explicit per-case authorisation. No user shall have standing access to all three systems simultaneously.

**MER-SEC-003: Multi-Factor Authentication**
All access to Meridian's internal systems shall require multi-factor authentication. This applies to internal staff, external parties (loss adjusters, forensic firms, legal counsel) accessing the CMS portal, and API integrations receiving policyholder telemetry. Single-factor access shall not be permitted for any system containing policyholder data.

**MER-SEC-004: Policyholder Data Segregation**
Policyholder data within the PMS and CMS shall be logically segregated such that queries, reports, and access requests return only data for the authorised policyholder. Cross-policyholder data access (e.g., portfolio-level risk analytics) shall be restricted to senior underwriting and actuarial roles and shall use anonymised or aggregated data where possible.

---

## Secure Data Sharing

**MER-SEC-005: Loss Adjuster and Forensic Firm Access**
External parties appointed to a specific claim (loss adjusters, forensic firms, legal counsel) shall receive time-limited, scoped access to the relevant case file within the CMS. Access shall be revoked upon completion of their engagement. All external access shall be logged and auditable.

**MER-SEC-006: Forensic Evidence Transfer**
Transfer of forensic evidence between Meridian's Forensic Data Platform and external parties (policyholder sites, external forensic firms, law enforcement) shall use encrypted transfer protocols. Physical media (forensic disk images) shall be transported via bonded courier with chain-of-custody documentation. Hash verification shall be performed on receipt.

**MER-SEC-007: Reinsurance Data Sharing**
Data shared with reinsurance partners via the Reinsurance Reporting System shall be limited to claim summary information and aggregate exposure data. Policyholder-identifiable security posture data, forensic evidence, and warranty compliance details shall not be shared with reinsurers without the policyholder's explicit written consent.

**MER-SEC-008: Regulatory Data Handling**
Data submitted to regulators (FCA, PRA, Lloyd's) by Meridian shall be reviewed by the compliance team before transmission. Data received from regulators or intelligence agencies (e.g., NCSC attribution assessments shared under traffic-light protocol) shall be handled in accordance with the classification and dissemination restrictions specified by the originating body.

---

## System Integrity and Availability

**MER-SEC-009: Claims Management System Integrity**
The Claims Management System shall maintain an immutable audit trail of all coverage decisions, financial transactions, and correspondence. Audit records shall include timestamp, user identity, action performed, and data affected. The audit trail shall be protected against modification by any user, including system administrators.

**MER-SEC-010: Forensic Data Platform Isolation**
The Forensic Data Platform shall be logically and, where feasible, physically isolated from Meridian's corporate network (email, internet-facing services, general office systems). Analysis of potentially malicious artefacts (malware samples, compromised firmware) shall be conducted in sandboxed environments. No direct network path shall exist between the FDP analysis environments and the corporate LAN.

**MER-SEC-011: Business Continuity for Claims Systems**
The Claims Management System shall maintain a recovery time objective (RTO) of four hours and a recovery point objective (RPO) of one hour. During a major claim such as the Albion incident, loss of the CMS would disrupt coordination between the claims team, forensic team, loss adjuster, and legal counsel. Backup and disaster recovery provisions shall be tested annually.

**MER-SEC-012: API Security for Telemetry Feeds**
API endpoints receiving policyholder telemetry feeds shall enforce mutual TLS authentication, IP allowlisting, and rate limiting. Input validation shall be applied to all incoming telemetry data to prevent injection of malicious payloads through the data feed. The API gateway shall be monitored for anomalous connection patterns.

---

## Third-Party Risk Management

**MER-SEC-013: Panel Firm Security Assessment**
All external firms on Meridian's panel (loss adjusters, forensic firms, legal counsel) shall undergo a security assessment before appointment. The assessment shall cover: data handling practices, encryption standards, access control mechanisms, incident response capability, and staff security clearance status. Assessments shall be renewed annually.

**MER-SEC-014: Cloud Infrastructure Security**
Meridian's private cloud infrastructure (hosting the PMS, CMS, and RRS) shall comply with a recognised security standard (ISO 27001 or equivalent). The cloud service provider shall provide annual SOC 2 Type II attestation reports. Meridian shall maintain contractual provisions for data residency (UK only), encryption management, and incident notification.

**MER-SEC-015: Supply Chain Monitoring**
Meridian shall maintain a register of critical third-party dependencies (cloud hosting, API integration partners, specialist software vendors) and monitor these for security events that could affect Meridian's operations. Notifications of vendor security incidents shall be assessed within 24 hours for potential impact on policyholder data.

---

## Incident Response

**MER-SEC-016: Meridian's Own Incident Response Plan**
Meridian shall maintain a documented incident response plan for security events affecting its own systems. The plan shall cover: detection and triage, containment and eradication, evidence preservation, regulatory notification (FCA, ICO if personal data affected), and policyholder notification if policyholder data is compromised. The plan shall be tested annually through tabletop exercises.

**MER-SEC-017: Breach Notification to Policyholders**
In the event that a security breach of Meridian's systems results in unauthorised access to policyholder security posture data (risk assessments, vulnerability information, warranty compliance records), Meridian shall notify affected policyholders within 72 hours. The notification shall describe the data potentially compromised and the remedial actions Meridian is taking.

**MER-SEC-018: Attribution Intelligence Handling**
Threat intelligence received from law enforcement or the NCSC (including attribution assessments related to policyholder incidents) shall be handled in accordance with the originator's classification. Such intelligence shall not be used to inform coverage decisions without legal counsel review of the implications, and shall not be shared beyond the authorised recipients within Meridian.
