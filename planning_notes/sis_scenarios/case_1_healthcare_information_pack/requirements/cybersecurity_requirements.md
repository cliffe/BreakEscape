# Cybersecurity Requirements — Northgate General Hospital

---

## Enterprise IT Zone

### Identity and Access Management

**REQ-HC-SEC-001: Multi-Factor Authentication for Remote Access**
Description: All remote access connections (VPN, remote desktop) shall require multi-factor authentication combining at least two independent factors (e.g., password plus hardware token or authenticator application).
Rationale: The Northgate incident's initial VPN compromise was enabled by single-factor authentication on contractor accounts. MFA would have prevented the attacker from using harvested credentials alone.
Standard reference: NCSC guidance on multi-factor authentication; NHS DSPT assertion 4.3.

**REQ-HC-SEC-002: Privileged Access Management**
Description: Domain administrator and other privileged accounts shall be managed through a privileged access management (PAM) solution with session recording, just-in-time access provisioning, and automatic credential rotation.
Rationale: The attacker harvested cached domain admin credentials from a workstation where an administrator had recently logged in for routine troubleshooting. PAM controls would limit credential exposure.
Standard reference: NCSC guidance on privileged access workstations; IEC 62443-3-3 SR 1.1.

**REQ-HC-SEC-003: Contractor Account Governance**
Description: Contractor and third-party accounts shall have defined expiry dates, shall be subject to the same MFA requirements as staff accounts, and shall be disabled within 24 hours of contract termination.
Rationale: The contractor whose credentials were compromised had reused passwords across multiple employers. Account governance would limit the exposure window and enforce stronger credential standards.
Standard reference: NHS DSPT assertion 4.2; ISO 27001 A.9.2.

**REQ-HC-SEC-004: Role-Based Access Control**
Description: Access to systems and data shall be controlled through role-based access control (RBAC), granting users the minimum privileges necessary for their role.
Rationale: Broad access permissions enable lateral movement after initial compromise. RBAC limits the scope of any single compromised account.
Standard reference: IEC 62443-3-3 SR 1.3; ISO 27001 A.9.1.

### Network Security

**REQ-HC-SEC-005: Perimeter Firewall and Web Filtering**
Description: All internet-facing traffic shall pass through a next-generation firewall with URL filtering, SSL inspection, and intrusion prevention capabilities.
Rationale: The initial phishing payload was delivered via a redirect through a legitimate cloud service that evaded basic URL reputation checking. Advanced web filtering could detect this pattern.
Standard reference: NCSC guidance on network security; NIS Regulations 2018.

**REQ-HC-SEC-006: Email Security Controls**
Description: Inbound email shall be filtered through a gateway with SPF/DKIM/DMARC validation, attachment sandboxing, and URL rewriting with time-of-click analysis.
Rationale: The spear-phishing email that initiated the attack would be subject to multiple detection opportunities with layered email security controls.
Standard reference: NCSC Phishing guidance; NHS DSPT assertion 8.1.

**REQ-HC-SEC-007: Enterprise-to-Clinical Network Segmentation**
Description: The enterprise IT network and the clinical/medical device network shall be separated by a properly configured firewall with explicit allow-list rules. No legacy exception rules permitting broad bidirectional access shall remain in place.
Rationale: Incomplete segmentation and legacy firewall exceptions allowed the ransomware to propagate from the enterprise zone to clinical device management systems. This is the critical control that prevents the security-to-safety pathway.
Standard reference: IEC 62443-3-3 SR 5.1; NCSC CAF B.4 — Network Security.

**REQ-HC-SEC-008: Elimination of Dual-Homed Workstations**
Description: Clinical workstations shall not be configured with network interfaces on both the enterprise and clinical VLANs. Access to cross-zone applications shall be provided through application-layer gateways, jump servers, or virtualised environments.
Rationale: Dual-homed workstations were the primary mechanism through which the attack crossed from the enterprise zone to the clinical device network.
Standard reference: IEC 62443-3-3 SR 5.2; NIST SP 800-82 Section 5.

**REQ-HC-SEC-009: Internal Network Monitoring**
Description: The internal network shall be monitored for anomalous traffic patterns including port scanning, unusual SMB activity, lateral movement indicators, and cross-zone traffic anomalies.
Rationale: SIEM alerts indicating unusual SMB traffic were generated but dismissed as migration-related noise. Effective internal network monitoring with appropriate baselines would improve detection fidelity.
Standard reference: IEC 62443-3-3 SR 6.1; NCSC CAF C.1 — Security Monitoring.

### Endpoint Security

**REQ-HC-SEC-010: Endpoint Detection and Response (EDR)**
Description: All enterprise and clinical workstations shall run an EDR agent capable of detecting fileless attacks, credential dumping, and ransomware encryption behaviour, with alerts triaged within defined SLAs.
Rationale: The EDR agent on the initially compromised workstation flagged the PowerShell execution but the alert was classified low-severity and not triaged promptly.
Standard reference: NCSC guidance on endpoint security; NHS DSPT assertion 8.3.

**REQ-HC-SEC-011: Application Whitelisting on Clinical Workstations**
Description: Clinical workstations in the medical device zone shall enforce application whitelisting, permitting only authorised clinical and management applications to execute.
Rationale: Application whitelisting on clinical workstations would prevent the execution of attacker tools and ransomware payloads even if the workstation is compromised at the network level.
Standard reference: IEC 62443-3-3 SR 3.4; NIST SP 800-82 Section 6.

### Data Protection and Recovery

**REQ-HC-SEC-012: Immutable Backup Architecture**
Description: Critical system backups shall be stored on immutable or air-gapped media that cannot be encrypted or deleted from the production network. The 3-2-1 backup rule (three copies, two media types, one off-site) shall be implemented.
Rationale: The attacker encrypted the on-site NAS and wiped the tape library controller, destroying all on-site backups. Immutable off-site backups would have enabled rapid recovery.
Standard reference: NCSC Ransomware guidance; NHS DSPT assertion 10.3.

**REQ-HC-SEC-013: Backup Testing and Validation**
Description: Backup integrity and restorability shall be tested quarterly through actual restoration exercises, with results documented and deficiencies remediated.
Rationale: The compromised backup infrastructure was not routinely tested. Regular validation would have identified the vulnerability to network-based encryption.
Standard reference: ISO 27001 A.12.3; NHS DSPT assertion 10.3.

---

## Clinical / Medical Device Zone

### Device Network Security

**REQ-HC-SEC-014: Clinical VLAN Isolation**
Description: All networked medical devices shall be connected to a dedicated clinical VLAN that is logically and physically separated from the enterprise network. Cross-zone traffic shall be restricted to explicitly defined and minimal data flows.
Rationale: The incomplete VLAN migration left three wards on a flat segment shared with enterprise systems, providing direct access to medical devices from compromised enterprise workstations.
Standard reference: IEC 62443-3-3 SR 5.1; MHRA medical device cybersecurity guidance.

**REQ-HC-SEC-015: Medical Device Communication Encryption**
Description: Communication between medical devices and management systems shall use encrypted protocols with mutual authentication where device capability permits.
Rationale: Legacy protocols (HL7 v2 over TCP, unencrypted DICOM) transmit clinical data and device commands in cleartext, enabling eavesdropping and command injection by an attacker on the clinical VLAN.
Standard reference: IEC 62443-3-3 SR 4.1; NIST SP 800-82 Section 6.

**REQ-HC-SEC-016: Medical Device Authentication**
Description: Medical devices shall authenticate command sources before accepting configuration changes, firmware updates, or operational parameter modifications.
Rationale: Infusion pumps at Northgate accepted commands from any workstation on the clinical VLAN without verifying the source's identity, enabling an attacker to push malicious drug library updates.
Standard reference: IEC 62443-3-3 SR 1.2; MHRA medical device cybersecurity guidance.

**REQ-HC-SEC-017: Firmware Integrity Verification**
Description: Medical device firmware updates shall be cryptographically signed by the manufacturer and verified by the device before installation. The fleet management console shall reject unsigned or modified firmware images.
Rationale: The infusion pump fleet accepted firmware updates without signature verification, enabling an attacker to push backdoored firmware via the compromised management console.
Standard reference: IEC 62443-3-3 SR 3.3; IEC 62304 Section 6.

**REQ-HC-SEC-018: Vendor Remote Access Controls**
Description: Vendor remote-access connections to the clinical device network shall require multi-factor authentication, shall be activated only during scheduled maintenance windows, and shall be logged and monitored in real time.
Rationale: The infusion pump manufacturer's persistent VPN connection with shared credentials provided an alternative attack vector directly into the clinical zone, bypassing enterprise perimeter defences.
Standard reference: IEC 62443-3-3 SR 1.13; NCSC Supply Chain guidance.

### Device Monitoring and Logging

**REQ-HC-SEC-019: Medical Device Log Aggregation**
Description: Logs from networked medical devices and their management systems shall be forwarded to the central SIEM for correlation with enterprise security events.
Rationale: Medical device logs at Northgate were not aggregated into the SIEM, creating a monitoring blind spot that prevented detection of the cross-zone compromise.
Standard reference: IEC 62443-3-3 SR 6.2; NCSC CAF C.1.

**REQ-HC-SEC-020: Drug Library Change Monitoring**
Description: All changes to infusion pump drug library configurations shall generate alerts to pharmacy governance and information security teams, with changes verified against the authorised drug library version before deployment.
Rationale: The integrity attack scenario (Scenario 02) exploited the absence of automated change monitoring on the drug library, allowing malicious dose limit modifications to go undetected.
Standard reference: MHRA medical device cybersecurity guidance; IEC 62443-3-3 SR 3.4.

**REQ-HC-SEC-021: Alarm Configuration Audit**
Description: Patient monitor alarm threshold configurations shall be audited against clinical governance-approved defaults at least daily, with deviations triggering automated alerts to the ward manager and clinical engineering team.
Rationale: Alarm threshold manipulation in Scenario 02 was undetectable without proactive configuration auditing.
Standard reference: IEC 62443-3-3 SR 3.4; IEC 60601-1-8 (alarm systems).

---

## Cross-Zone and Operational

### Incident Response

**REQ-HC-SEC-022: Integrated IT/Clinical Engineering Incident Response Plan**
Description: The Trust shall maintain an incident response plan that coordinates IT security containment actions with clinical engineering patient safety assessments, ensuring that network isolation decisions are informed by clinical impact analysis.
Rationale: The decision to sever the enterprise-clinical network link was made under crisis conditions without a pre-planned framework for evaluating the clinical safety consequences of IT containment actions.
Standard reference: NIS Regulations 2018; NCSC incident management guidance; NHS DSPT assertion 9.5.

**REQ-HC-SEC-023: Clinical Fallback Procedures**
Description: Documented clinical fallback procedures (paper-based prescribing, manual device programming, bedside-only monitoring) shall be maintained, regularly tested, and accessible to all clinical staff without dependence on electronic systems.
Rationale: When the EHR, fleet management console, and monitoring central stations became unavailable, clinicians had to improvise paper-based workarounds. Pre-defined fallback procedures reduce the risk of error during the transition.
Standard reference: NHS DSPT assertion 9.6; CQC fundamental standards.

### Governance

**REQ-HC-SEC-024: Joint IT Security / Clinical Engineering Governance**
Description: The Trust shall establish a formal governance committee with joint membership from IT Security, Clinical Engineering, and clinical leadership, responsible for managing cybersecurity risks to networked medical devices.
Rationale: At the time of the incident, no formal governance structure linked IT Security and Clinical Engineering. Security risks to medical devices fell between the two teams' remits.
Standard reference: NIS Regulations 2018; NHS DSPT assertion 1.1.

**REQ-HC-SEC-025: Medical Device Cyber Risk Register**
Description: The Trust shall maintain a dedicated risk register for cybersecurity risks to networked medical devices, updated at least quarterly and reviewed by the joint governance committee.
Rationale: Cybersecurity risks to medical devices were not systematically tracked, leading to incomplete awareness of the exposure created by the unfinished segmentation project.
Standard reference: ISO 14971 (risk management); NHS DSPT assertion 1.4.

### Supply Chain

**REQ-HC-SEC-026: Manufacturer Patch Cooperation**
Description: Procurement contracts for networked medical devices shall include requirements for the manufacturer to provide timely security patches, validated against the device's safety certification, with defined SLAs for critical vulnerability response.
Rationale: Patching constraints on safety-certified devices are a structural vulnerability. Contractual obligations ensure manufacturers share responsibility for maintaining security throughout the device lifecycle.
Standard reference: MHRA medical device cybersecurity guidance; IEC 62443-2-4.

**REQ-HC-SEC-027: Supply Chain Security Assessment**
Description: Before deployment, networked medical devices and their associated management software shall undergo a cybersecurity assessment covering default credentials, communication protocols, update mechanisms, and logging capabilities.
Rationale: Several of the vulnerabilities exploited in both scenarios (unencrypted protocols, unsigned firmware, shared vendor credentials) could have been identified and mitigated during pre-deployment assessment.
Standard reference: IEC 62443-3-3 SR 1.1; NCSC Supply Chain guidance.

### Security Awareness

**REQ-HC-SEC-028: Phishing Awareness Training**
Description: All staff with access to Trust email shall complete annual phishing awareness training, supplemented by regular simulated phishing exercises with targeted follow-up training for those who interact with simulated phishing messages.
Rationale: The initial access vector was a spear-phishing email. While technical controls should be the primary defence, staff awareness reduces the probability of successful social engineering.
Standard reference: NHS DSPT assertion 3.4; NCSC Phishing guidance.

**REQ-HC-SEC-029: Clinical Staff Cyber-Safety Awareness**
Description: Clinical staff operating networked medical devices shall receive targeted training on the relationship between cybersecurity and patient safety, including recognition of device anomalies that may indicate compromise and the clinical fallback procedures to follow.
Rationale: The patient safety events in the Northgate scenario were exacerbated by clinicians not immediately recognising the cyberattack's impact on medical device functionality.
Standard reference: NHS DSPT assertion 3.5; MHRA medical device guidance.

### Vulnerability Management

**REQ-HC-SEC-030: Clinical Zone Vulnerability Scanning**
Description: The clinical device network shall be included in the Trust's vulnerability scanning programme, with scans conducted at least quarterly using techniques validated not to disrupt medical device operation.
Rationale: The clinical workstation exploited in Scenario 02 ran an unpatched operating system with known vulnerabilities. Regular vulnerability scanning of the clinical zone would have identified this exposure.
Standard reference: IEC 62443-3-3 SR 3.3; NCSC Vulnerability Management guidance.
