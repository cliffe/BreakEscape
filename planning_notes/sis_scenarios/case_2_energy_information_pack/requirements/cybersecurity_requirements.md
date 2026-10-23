# Cybersecurity Requirements — Albion Energy Storage Facility

Structured requirements catalogue organised by ICS zone (Purdue Model level). Each requirement is traceable to a relevant standard and grounded in the Albion scenario context.

---

## Enterprise IT Zone (Level 4–5)

**REQ-EN-SEC-001: Peripheral Device Firmware Integrity**
Description: All network-connected peripheral devices (printers, IP cameras, UPS management interfaces) shall have their firmware verified against vendor-published cryptographic hashes before installation and at regular intervals thereafter.
Rationale: The Albion incident began with a manipulated printer firmware update delivered via social engineering. Peripheral devices are frequently excluded from enterprise vulnerability management, creating an overlooked initial access vector.
Standard reference: IEC 62443-2-1 (asset management); NCSC CAF B.2 (Identity & Access Management — asset inventory)

**REQ-EN-SEC-002: Physical Media Controls**
Description: Unsolicited physical media (USB drives, optical discs) shall not be connected to any networked device without prior authorisation from the IT security function, verified provenance from the vendor, and malware scanning.
Rationale: The social engineering attack vector relied on a USB drive delivered by courier and connected by a maintenance technician without verification.
Standard reference: IEC 62443-2-1 (removable media policy); NCSC CAF B.4 (System Security)

**REQ-EN-SEC-003: Managed Service Provider Access Control**
Description: Service accounts used by managed service providers (e.g., CastleTech Solutions) shall be scoped to the minimum privileges required, shall use unique credentials per client site, and shall be subject to privileged access monitoring.
Rationale: A shared CastleTech service account with administrative privileges across both Albion and Trent Water provided the attacker with cross-organisational lateral movement capability.
Standard reference: IEC 62443-2-4 (service provider requirements); NCSC CAF B.2 (Identity & Access Management)

**REQ-EN-SEC-004: Dormant Account Remediation**
Description: User and service accounts that have not been used for 90 days shall be automatically disabled. Accounts belonging to departed staff or expired contractor engagements shall be disabled within 24 hours of departure.
Rationale: A dormant contractor account on the jump server, with an unchanged default password, provided the attacker with authenticated access to the OT environment.
Standard reference: IEC 62443-2-1 (account management); NCSC CAF B.2; NERC CIP-004-6 (personnel risk assessment)

**REQ-EN-SEC-005: Email and Social Engineering Defences**
Description: The enterprise email system shall implement SPF, DKIM, and DMARC validation. Staff shall receive annual security awareness training covering social engineering techniques relevant to supply chain and vendor impersonation.
Rationale: The initial social engineering approach (telephone call impersonating a printer vendor representative) could have been disrupted by staff trained to verify vendor communications through independent channels.
Standard reference: NCSC CAF B.4 (System Security); IEC 62443-2-1 (security awareness training)

**REQ-EN-SEC-006: Outbound Traffic Monitoring**
Description: Outbound network traffic from all enterprise devices shall be monitored for anomalous patterns, including periodic beaconing to external IP addresses, DNS-over-HTTPS to unrecognised domains, and outbound connections from devices not expected to initiate internet traffic (e.g., printers).
Rationale: The compromised printers beaconed to an external C2 server over HTTPS every four hours. The domain controller implant communicated via DNS-over-HTTPS. Both would be detectable with outbound traffic analytics.
Standard reference: NCSC CAF C.1 (Security Monitoring); IEC 62443-3-3 (system security requirements)

**REQ-EN-SEC-007: Cross-Organisational File Sharing Controls**
Description: Shared file servers accessible by multiple organisations (e.g., Albion and Trent Water) shall enforce application-level controls including malware scanning on upload, macro-disabled document policies, and activity logging.
Rationale: The shared file server was identified as a lateral movement pathway between Albion and Trent Water, with infected documents providing a potential cross-sector compromise vector.
Standard reference: IEC 62443-2-1 (zone boundary protection); NCSC CAF B.4

---

## IT/OT Boundary (DMZ / Level 3.5)

**REQ-EN-SEC-008: Unidirectional Data Flow Enforcement**
Description: Data transfer between the enterprise IT network and the SCADA/operations network shall be enforced through a unidirectional security gateway (data diode) or equivalent mechanism that physically prevents network traffic from flowing from IT into OT. Where bidirectional data exchange is operationally required, it shall be mediated through an application-level proxy with strict protocol filtering.
Rationale: The jump server configured for bidirectional RDP was the primary pathway used to access the engineering workstation from the enterprise network. A unidirectional gateway would eliminate this vector entirely.
Standard reference: IEC 62443-3-3 SR 5.2 (zone boundary protection); NCSC CAF B.5 (Resilient Networks)

**REQ-EN-SEC-009: Jump Server Hardening and Multi-Factor Authentication**
Description: The jump server shall enforce multi-factor authentication for all sessions, permit only pre-authorised connections to specific SCADA zone hosts, log all session activity with immutable audit trails, and alert the OT security function in real time for any session outside pre-approved maintenance windows.
Rationale: The jump server was accessed using a dormant contractor account with a default password, outside business hours, with no MFA and no real-time alerting. The access was not detected until manual log review four days later.
Standard reference: IEC 62443-3-3 SR 1.1, SR 1.2 (identification and authentication); NCSC CAF B.2; NERC CIP-005-7 (electronic security perimeter)

**REQ-EN-SEC-010: Historian Network Isolation**
Description: The historian server shall not be dual-homed across the IT and OT networks. If enterprise systems require access to historian data, the data shall be replicated through a unidirectional gateway or a read-only API on a dedicated DMZ segment, with no direct network path between the enterprise IT zone and the SCADA zone.
Rationale: The dual-homed historian was used for passive OT reconnaissance (observing Modbus/TCP traffic) and as an active Modbus/TCP relay (proxying attack commands from the enterprise network to the PLCs).
Standard reference: IEC 62443-3-3 SR 5.2 (zone boundary protection); NCSC CAF B.5

**REQ-EN-SEC-011: Legacy Firewall Rule Remediation**
Description: All firewall rules permitting direct ICS protocol traffic (Modbus/TCP, DNP3, OPC-UA) between the enterprise IT network and the SCADA/operations network shall be identified, risk-assessed, and removed or replaced with properly mediated connections. A firewall rule review shall be conducted quarterly.
Rationale: Legacy Modbus/TCP rules from the commissioning period remained active for eighteen months after they were intended to be temporary, providing an uncontrolled direct protocol pathway from the enterprise network to the SCADA server.
Standard reference: IEC 62443-3-3 SR 5.1 (network segmentation); NCSC CAF B.5; NERC CIP-005-7

---

## SCADA/Operations Zone (Level 3)

**REQ-EN-SEC-012: SCADA Server Access Control**
Description: The SCADA server shall accept operational commands only from authenticated and authorised sources. Network-level access control shall restrict Modbus/TCP and OPC-UA connections to a whitelist of permitted source IP addresses corresponding to known HMI workstations and the historian server.
Rationale: The SCADA server accepted Modbus/TCP commands from any source on the SCADA network, including the attacker-installed proxy on the historian server. Source IP whitelisting would have blocked commands from unauthorised origins.
Standard reference: IEC 62443-3-3 SR 1.1, SR 2.1 (authorisation enforcement); NCSC CAF B.2

**REQ-EN-SEC-013: Engineering Workstation Hardening**
Description: Engineering workstations shall implement application whitelisting (permitting only approved vendor software, PLC programming tools, and operating system components), session recording for all interactive sessions, and automatic session timeout after 15 minutes of inactivity. Workstations shall be powered off when not in scheduled use.
Rationale: HMI-ENG-02 was accessible via RDP, left powered on during unmanned shifts, and had no application whitelisting — allowing installation of a backdoor disguised as a vendor diagnostic tool and remote interactive use by the attacker.
Standard reference: IEC 62443-3-3 SR 7.6 (application whitelisting); NCSC CAF B.4; NERC CIP-007-6 (systems security management)

**REQ-EN-SEC-014: ICS Network Traffic Anomaly Detection**
Description: The SCADA network shall be monitored by a passive ICS anomaly detection system capable of baselining normal Modbus/TCP, DNP3, and OPC-UA traffic patterns and alerting on deviations, including: commands from unexpected source addresses, register writes outside normal operational profiles, PLC programme downloads, and SIS configuration changes.
Rationale: No real-time monitoring existed for the SCADA network. Anomalous Modbus/TCP write commands, the PLC programme download, and the SIS setpoint modifications would all have been detectable by a passive ICS anomaly detection system.
Standard reference: IEC 62443-3-3 SR 6.2 (continuous monitoring); NCSC CAF C.1 (Security Monitoring); NERC CIP-007-6

**REQ-EN-SEC-015: OT Security Log Aggregation**
Description: All OT security-relevant logs — including jump server access logs, SCADA server command logs, PLC access logs, SIS configuration change logs, and engineering workstation session logs — shall be aggregated to a centralised, tamper-evident log store accessible to the OT security function. Log review shall occur at minimum daily.
Rationale: Jump server access logs were reviewed weekly by manual process. SCADA server and SIS logs were not aggregated or reviewed. The intrusion was active for over four weeks before detection.
Standard reference: IEC 62443-3-3 SR 6.1 (audit log); NCSC CAF C.1; NERC CIP-007-6

**REQ-EN-SEC-016: SCADA Server Operating System Hardening**
Description: The SCADA server operating system shall be hardened to remove unnecessary services, disable unused network ports, and run with minimum required privileges. Security patches for the SCADA server OS shall be assessed and deployed within 30 days of release, following testing in a representative staging environment.
Rationale: The SCADA server ran a standard Windows Server installation with limited hardening. OS-level vulnerabilities could provide an alternative pathway for the attacker.
Standard reference: IEC 62443-3-3 SR 7.1 (least functionality); NCSC CAF B.4

---

## Control Level (Level 1–2)

**REQ-EN-SEC-017: PLC Credential Hardening**
Description: All PLCs, RTUs, and field controllers shall have factory-default credentials replaced with unique, complex passwords at commissioning. Credentials shall be stored in a password vault accessible only to authorised engineering personnel.
Rationale: PLC management interfaces at Albion retained factory-default credentials unchanged since commissioning, enabling the attacker to access PLC programming functions using widely known default username/password combinations.
Standard reference: IEC 62443-4-2 CR 1.1 (human user identification and authentication); NCSC CAF B.2; NERC CIP-007-6

**REQ-EN-SEC-018: PLC Programme Integrity Verification**
Description: PLC programme logic shall be cryptographically hashed at commissioning and after each authorised change. The running programme hash shall be compared against the authorised baseline at regular intervals (at minimum weekly). Any mismatch shall trigger an immediate alert to the OT security function and the SCADA engineer.
Rationale: The insider scenario involved downloading modified PLC logic with a hidden overcharge routine. Without programme integrity checking, the modification was undetectable until forensic analysis post-incident.
Standard reference: IEC 62443-4-2 CR 3.4 (software and information integrity); NCSC CAF B.4

**REQ-EN-SEC-019: Dual Authorisation for PLC Changes**
Description: Any modification to PLC programme logic, setpoints, or configuration shall require authorisation from two independent qualified individuals (dual control). The PLC programming environment shall enforce this requirement technically, not solely through procedure.
Rationale: A single compromised account (or a single compromised contractor) can currently modify PLC logic without any secondary approval. Dual authorisation adds a human-in-the-loop control that an attacker must bypass.
Standard reference: IEC 62443-3-3 SR 2.1 (authorisation enforcement); NCSC CAF B.2

**REQ-EN-SEC-020: Modbus/TCP Command Authentication**
Description: Where technically feasible, Modbus/TCP communications between the SCADA server and PLCs shall be supplemented with an additional authentication mechanism (e.g., Modbus/TCP security extension per Modbus Organisation specification, or network-layer authentication via IPSec). Where native protocol authentication is not available, compensating controls (source IP whitelisting, network micro-segmentation, command rate limiting) shall be applied.
Rationale: Modbus/TCP provides no inherent authentication. Any device on the SCADA network can issue arbitrary read/write commands to PLC registers. Protocol-level or network-level authentication would prevent unauthorised command injection.
Standard reference: IEC 62443-3-3 SR 3.1 (communication integrity); NCSC CAF B.5

**REQ-EN-SEC-021: RTU Firmware Management**
Description: RTU firmware shall be maintained within vendor-supported versions. Legacy RTUs that cannot be updated to support modern security features shall be isolated on a dedicated network segment with monitoring and access controls that compensate for their inherent vulnerabilities.
Rationale: Several RTUs at Albion are legacy devices with outdated firmware and web-based management interfaces with default credentials. These devices cannot be patched but can be isolated and monitored.
Standard reference: IEC 62443-2-3 (patch management); NCSC CAF B.4

---

## Safety Instrumented System

**REQ-EN-SEC-022: SIS Network Isolation**
Description: The Safety Instrumented System shall be on a physically separate network segment from the SCADA/control network, with no direct network connectivity between the SIS and any other system. Where SIS status data is required on the SCADA HMI, it shall be transmitted through a hardware-enforced unidirectional gateway (data from SIS to SCADA only, no commands from SCADA to SIS).
Rationale: The SIS engineering port was accessible from the SCADA network segment, allowing the attacker to modify safety thresholds from the same network they used to attack the control system. Physical network separation would eliminate this pathway.
Standard reference: IEC 62443-3-3 SR 5.2; IEC 61511-1 clause 11.2.4 (independence of SIS from control system); NCSC CAF B.5

**REQ-EN-SEC-023: SIS Engineering Protocol Authentication**
Description: The SIS engineering protocol shall require strong authentication (at minimum username/password with MFA, preferably hardware token-based) for any configuration or parameter change. All configuration modifications shall be logged with immutable audit trails including timestamp, user identity, and before/after values.
Rationale: The SIS engineering protocol at Albion required no authentication and generated no logs. The attacker modified thermal protection thresholds without detection. This is the specific vulnerability that the deferred firmware update was intended to address.
Standard reference: IEC 62443-4-2 CR 1.1, CR 1.2; IEC 61511-1 clause 5.2.6.1 (cybersecurity management of SIS)

**REQ-EN-SEC-024: SIS Firmware Patching and Recertification Process**
Description: A documented process shall exist for assessing, testing, and applying security patches to SIS components within a timeframe proportionate to the severity of the vulnerability. The process shall include a risk assessment comparing the cyber risk of the unpatched vulnerability against the safety risk of the interim recertification period, with explicit compensating controls defined for the recertification window.
Rationale: The SIS firmware patch was deferred for eighteen months because no process existed to manage the safety-security trade-off. A formal process would have forced explicit risk comparison and compensating control decisions rather than indefinite deferral.
Standard reference: IEC 62443-2-3 (patch management); IEC 61511-1 clause 5.2.6.1; NCSC CAF B.4

---

## Field Devices (Level 0)

**REQ-EN-SEC-025: Independent Safety Sensor Validation**
Description: For safety-critical process parameters (cell temperature, state-of-charge), the control system shall cross-reference PLC register values against at least one independent measurement source (e.g., SIS sensor inputs, analog instrumentation) and alert on discrepancies exceeding a defined tolerance.
Rationale: The attacker falsified PLC-BMS register values, and the control system trusted these values implicitly. An analog thermometer — not connected to the digital system — provided the only independent reading that revealed the discrepancy. Automated cross-validation would enable faster detection.
Standard reference: IEC 61511-1 clause 11.4 (diagnostics); IEC 62443-3-3 SR 3.5 (input validation)

**REQ-EN-SEC-026: Hardwired Emergency Shutdown Independence**
Description: The hardwired ESD pushbutton system and its associated electrical interlocks shall remain completely independent of all programmable and networked systems. No modification to the hardwired ESD system shall be made without formal safety assessment. The ESD system shall be proof-tested at defined intervals.
Rationale: The hardwired ESD pushbutton was the only safety mechanism that functioned correctly during the incident. Its independence from any digital system made it immune to the cyber attack. This independence must be preserved absolutely.
Standard reference: IEC 61511-1 clause 11.2.4 (independence); NCSC CAF D.1 (Response and Recovery Planning)

**REQ-EN-SEC-027: Physical Access Controls for Battery Halls**
Description: Physical access to the battery halls shall be controlled by RFID-based access management, with access limited to authorised operations and engineering personnel. Access logs shall be reviewed daily and correlated with SCADA activity logs.
Rationale: Physical access to the battery halls provides access to local control panels, hardwired ESD switches, and visual observation of physical process conditions (temperature, noise, odour). Physical access control prevents an attacker with on-site presence from interfering with manual safety mechanisms.
Standard reference: IEC 62443-2-1 (physical security); NCSC CAF B.3 (Data Security); NERC CIP-006-6 (physical security)

---

## Cross-Cutting Requirements

**REQ-EN-SEC-028: OT Incident Response Plan**
Description: A documented OT-specific incident response plan shall exist, covering detection, containment, eradication, and recovery for cyber incidents affecting SCADA, PLCs, SIS, and field devices. The plan shall address the specific trade-off between network isolation (stopping the attacker but losing automated control) and continued connectivity (maintaining control but risking further compromise).
Rationale: During the Albion incident, the decision to isolate the network was made in real time without pre-planned guidance, under extreme time pressure. Pre-defined decision criteria would enable faster and more consistent response.
Standard reference: NCSC CAF D.1, D.2 (Response and Recovery); IEC 62443-2-1 (incident management); NERC CIP-008-6 (incident reporting and response planning)

**REQ-EN-SEC-029: Cross-Sector Dependency Risk Assessment**
Description: All shared infrastructure, shared services, and cross-organisational network connections (e.g., the Albion/Trent Water shared file server, managed IT service provider) shall be subject to formal risk assessment considering the potential for lateral movement between organisations and between sectors.
Rationale: The shared infrastructure between Albion (energy) and Trent Water (water) created an unassessed cross-sector dependency. Compromise of Albion's enterprise network led to potential compromise of Trent Water's systems.
Standard reference: NCSC CAF A.1 (Governance); IEC 62443-2-1 (risk assessment); NIS Regulations 2018 (inter-sector dependencies)

**REQ-EN-SEC-030: Security Awareness Training for OT Personnel**
Description: All personnel with access to OT systems (SCADA operators, engineers, maintenance technicians, contractors) shall receive role-specific security awareness training covering: social engineering techniques, physical media risks, credential management, recognition of anomalous process behaviour, and procedures for reporting suspected cyber incidents.
Rationale: The facilities management coordinator accepted an unsolicited USB drive from an unverified caller. Additionally, Priya Chandra's ability to recognise the discrepancy between digital and analog readings was the critical detection mechanism — training in recognising anomalous process behaviour can strengthen this human safety barrier.
Standard reference: IEC 62443-2-1 (security awareness); NCSC CAF A.3 (Asset Management — training); NERC CIP-004-6

**REQ-EN-SEC-031: Vendor and Contractor Access Management**
Description: Third-party vendor and contractor access to OT systems shall be time-limited (automatically expiring at end of contracted engagement), require MFA, be restricted to specific assets via least-privilege access policies, and be logged with session recording. Contractor credentials shall be revoked within 24 hours of engagement completion.
Rationale: A dormant contractor account with default credentials provided the attacker with direct access to the OT environment. In the insider scenario, a contractor with legitimate but insufficiently managed access installed the backdoor.
Standard reference: IEC 62443-2-4 (service provider requirements); NCSC CAF B.2; NERC CIP-004-6

**REQ-EN-SEC-032: Supply Chain Security Assessment**
Description: Critical ICS components (PLCs, SIS, RTUs, network infrastructure) shall be sourced from vendors with demonstrated supply chain security practices. Firmware integrity shall be verified at delivery against vendor-published cryptographic hashes. A hardware and software bill of materials shall be maintained for all safety-critical components.
Rationale: The attack began with a supply chain compromise (backdoored printer firmware). Extending supply chain verification to all ICS components reduces the risk of similar attacks on more safety-critical devices.
Standard reference: IEC 62443-2-4 (supply chain); NCSC CAF B.4; NERC CIP-013-2 (supply chain risk management)

**REQ-EN-SEC-033: Regular Penetration Testing of IT/OT Boundary**
Description: The IT/OT boundary shall be subject to penetration testing at least annually, conducted by assessors with ICS security expertise. The scope shall include attempts to traverse from the enterprise IT network to the SCADA/operations network through all known and potential pathways (jump server, historian, firewall rules, shared infrastructure).
Rationale: The three IT/OT boundary weaknesses exploited in the Albion incident (dual-homed historian, bidirectional jump server, legacy firewall rules) would have been identified by a competent penetration test.
Standard reference: NCSC CAF B.5 (Resilient Networks and Systems); IEC 62443-2-1 (security verification and validation)

**REQ-EN-SEC-034: Backup and Recovery for OT Systems**
Description: Verified, regularly tested backups shall be maintained for SCADA server configurations, PLC programme logic, SIS configurations, historian databases, and HMI display configurations. Backups shall be stored on immutable or air-gapped media inaccessible from the SCADA or enterprise networks.
Rationale: Post-incident recovery required restoring PLC logic, SIS configuration, and SCADA server configurations from known-good baselines. Without verified backups, the recovery and recertification process would have been significantly longer.
Standard reference: NCSC CAF D.2 (Recovery); IEC 62443-2-1 (backup and recovery); NERC CIP-009-6 (recovery plans)

**REQ-EN-SEC-035: NIS Regulations Incident Notification Readiness**
Description: A documented incident notification procedure shall exist, covering the 72-hour notification obligation under the NIS Regulations 2018 to the designated competent authority, parallel notification to National Grid ESO and OFGEM, and information-sharing with NCSC and cross-sector partners (including Trent Water).
Rationale: The NIS Regulations 2018 impose specific incident reporting obligations on operators of essential services. Pre-documented notification procedures ensure compliance under the time pressure of an active incident.
Standard reference: NIS Regulations 2018 Regulation 11; NCSC CAF D.1
