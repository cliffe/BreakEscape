# Security-Informed Safety Claims — Northgate General Hospital

These claims form the bridge between the cybersecurity requirements and the functional safety requirements. Each claim takes the form: "If security control X is maintained, then safety property Y holds."

---

## Claims

**CLAIM-HC-001: Network Segmentation Protects Device Integrity**
Claim: Provided that the medical device network is fully segmented from the enterprise IT network with no dual-homed workstations or legacy exception rules (REQ-HC-SEC-007, REQ-HC-SEC-008, REQ-HC-SEC-014), the risk of an enterprise-zone compromise propagating to infusion pump controllers, patient monitors, or ventilators remains within tolerable bounds (REQ-HC-SAF-001, REQ-HC-SAF-003, REQ-HC-SAF-005).
Evidence required: Firewall rule audit confirming no cross-zone exceptions; network architecture diagram verified against physical configuration; penetration test demonstrating inability to reach clinical devices from enterprise zone.

**CLAIM-HC-002: Firmware Integrity Prevents Device Manipulation**
Claim: Provided that medical device firmware updates are cryptographically signed and verified before installation (REQ-HC-SEC-017), the risk of an attacker deploying backdoored or manipulated firmware to infusion pumps or other clinical devices is effectively mitigated (REQ-HC-SAF-011).
Evidence required: Manufacturer attestation of code signing process; device-side verification testing; fleet management console rejection testing with unsigned firmware images.

**CLAIM-HC-003: Drug Library Change Control Preserves Dose Safety**
Claim: Provided that infusion pump drug library changes are monitored, require pharmacy governance approval, and are verified before deployment (REQ-HC-SEC-020), the drug library dose range checking function remains trustworthy and effective (REQ-HC-SAF-001, REQ-HC-SAF-002).
Evidence required: Drug library change audit trail; pharmacy governance sign-off records; automated comparison of deployed drug library version against authorised version.

**CLAIM-HC-004: Alarm Configuration Auditing Maintains Monitoring Effectiveness**
Claim: Provided that patient monitor alarm thresholds are audited against clinical governance-approved defaults and deviations are alerted upon automatically (REQ-HC-SEC-021), the risk of silently manipulated alarm thresholds causing delayed clinical response is reduced to a tolerable level (REQ-HC-SAF-003, REQ-HC-SAF-004).
Evidence required: Daily alarm configuration audit reports; automated alert records for threshold deviations; clinical governance committee approval of default alarm profiles.

**CLAIM-HC-005: Vendor Access Controls Prevent Supply-Chain Attack Path**
Claim: Provided that vendor remote-access connections to the clinical device network require multi-factor authentication, operate only during scheduled windows, and are continuously monitored (REQ-HC-SEC-018), the risk of a compromised vendor credential being used to access the clinical zone is managed to a tolerable level (REQ-HC-SAF-001, REQ-HC-SAF-009).
Evidence required: Vendor access logs showing session activation only during approved windows; MFA enforcement records; real-time monitoring alerts for vendor session anomalies.

**CLAIM-HC-006: Immutable Backups Enable Safety-Preserving Recovery**
Claim: Provided that critical system backups are stored on immutable or air-gapped media, are regularly tested, and include the EHR, PACS, and device management configurations (REQ-HC-SEC-012, REQ-HC-SEC-013), clinically safe system recovery can be achieved within defined time limits following a ransomware or destructive attack (REQ-HC-SAF-010, REQ-HC-SAF-012).
Evidence required: Backup architecture documentation showing immutability/air-gap; quarterly restoration test results; recovery time objective (RTO) test against safety-critical system recovery priority order.

**CLAIM-HC-007: Integrated Incident Response Prevents Containment-Induced Safety Hazards**
Claim: Provided that the Trust's incident response plan integrates IT security containment decisions with clinical safety impact assessments (REQ-HC-SEC-022), network isolation and other containment actions will not inadvertently create patient safety hazards (REQ-HC-SAF-009, REQ-HC-SAF-010).
Evidence required: Incident response plan documented and rehearsed with joint IT/Clinical Engineering tabletop exercises; exercise reports demonstrating that containment decisions are informed by clinical impact analysis; post-incident review confirming no containment-induced safety events.

**CLAIM-HC-008: PACS Integrity Controls Prevent Diagnostic Error**
Claim: Provided that PACS image-patient identity bindings are cryptographically protected and that image modifications generate audit alerts requiring clinical confirmation (REQ-HC-SAF-007), the risk of wrong-patient diagnostic error or missed diagnoses due to image tampering is managed to a tolerable level.
Evidence required: PACS integrity verification mechanism testing; audit alert generation testing for metadata modification; radiologist workflow verification confirming identity cross-checking is enforced.

**CLAIM-HC-009: Device Authentication Prevents Unauthorised Command Execution**
Claim: Provided that medical devices authenticate the source of configuration commands and reject commands from unauthenticated sources (REQ-HC-SEC-016), the risk of an attacker sending unauthorised commands to infusion pumps, patient monitors, or ventilators from a compromised workstation is reduced to a tolerable level (REQ-HC-SAF-001, REQ-HC-SAF-004).
Evidence required: Device authentication testing (commands from unauthorised sources rejected); clinical workstation access control verification; device management application access audit.

**CLAIM-HC-010: Clinical Fallback Procedures Maintain Safe Care During Outage**
Claim: Provided that documented clinical fallback procedures are maintained, regularly tested, and accessible at the point of care (REQ-HC-SEC-023, REQ-HC-SAF-008), clinicians can deliver safe care during any cyber-induced system outage, with defined process for recognising and correcting errors introduced during the manual phase (REQ-HC-SAF-010).
Evidence required: Fallback procedure documentation in all clinical areas; biannual fallback procedure drill results; post-drill assessment confirming staff competence in paper-based clinical processes.
