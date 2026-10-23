# Evidence Catalogue — Northgate General Hospital Security-Informed Safety Case

This catalogue lists every evidence node referenced in the detailed CAE case ([detailed_cae_case.md](detailed_cae_case.md)). Evidence nodes are numbered sequentially (E1–E25) and grouped by the claim they primarily support. Some evidence nodes support multiple claims.

---

## Medical Device Integrity Evidence (Sub-Goal G2)

---

### E1: Drug Library Change Audit Trail + Pharmacy Sign-Off

- **Type**: Operational
- **Supports**: CLAIM-HC-003 (Drug library change control preserves dose safety)
- **Description**: Automated log of all drug library modifications on the infusion pump fleet management console, including timestamp, user identity, parameter changed, old value, new value. Each change requires countersignature from a registered pharmacist before deployment to the pump fleet. The audit trail is stored in a database on the fleet management console and is retained for a minimum of 12 months.
- **Collection Method**: Automated extraction from fleet management console audit database; pharmacist sign-off recorded in hospital pharmacy system. Monthly summary reports generated for joint review by Clinical Engineering and Pharmacy.
- **Recurrence**: Continuous (every change logged); monthly summary reports reviewed by Clinical Engineering and Pharmacy.
- **Confidence**: Medium — automated and tamper-evident under normal operation. However, Scenario 02 (Step 9) demonstrates that an attacker with workstation-level access can modify the audit log directly. Dual-authority pharmacy sign-off provides an independent check that operates outside the fleet management console.
- **Dependencies**: Requires fleet management console to be operational and network-accessible. If console is offline (as in Scenario 01), audit trail is unavailable until restored. Paper-based fallback audit exists but is lower confidence.
- **Traceability**: REQ-HC-SEC-020, REQ-HC-SAF-001, REQ-HC-SAF-002
- **Scenario Relevance**: In Scenario 02 (Step 5), the attacker modifies drug library maximum dose limits. In Step 9, the attacker clears the audit trail to cover tracks. This evidence would detect the change if the audit system is functioning and the attacker has not tampered with it. The pharmacy sign-off mechanism provides an independent detection layer that the attacker would need to separately compromise.

---

### E2: Automated Version Comparison — Deployed vs. Authorised Drug Library

- **Type**: Operational
- **Supports**: CLAIM-HC-003 (Drug library change control preserves dose safety)
- **Description**: An automated tool that compares the drug library version hash currently deployed on each infusion pump against the pharmacist-approved master version. The comparison uses cryptographic hash matching (SHA-256) to detect any modification to the drug library content, regardless of whether the change was recorded in the audit trail. Discrepancies generate an immediate alert to pharmacy governance and clinical engineering.
- **Collection Method**: Automated comparison triggered on each drug library deployment event. Additionally runs as a scheduled background check every four hours, querying each pump's current drug library hash via the fleet management API.
- **Recurrence**: Event-triggered plus four-hourly scheduled comparison.
- **Confidence**: High — automated, hash-based comparison that is independent of the fleet management console audit trail. Would detect the Scenario 02 manipulation if the comparison runs before the corrupted library propagates to all pumps. The four-hour interval represents the maximum undetected exposure window.
- **Dependencies**: Requires fleet management console to be operational for scheduled checks. Event-triggered comparison requires the deployment event to be routed through the comparison tool (bypass is possible if the attacker deploys the drug library via a mechanism that does not trigger the event).
- **Traceability**: REQ-HC-SEC-020, REQ-HC-SAF-001, REQ-HC-SAF-002
- **Scenario Relevance**: This is the primary detective control against the Scenario 02 drug library manipulation (Step 5). The attacker's drug library modification would be detected at the next scheduled comparison (within 4 hours maximum) as a hash mismatch, even though the audit trail was subsequently cleared (Step 9).

---

### E3: Daily Alarm Configuration Audit Reports

- **Type**: Operational
- **Supports**: CLAIM-HC-004 (Alarm configuration auditing maintains monitoring effectiveness)
- **Description**: Automated script executed daily at 06:00 that queries alarm threshold settings from each connected patient monitor via the ward central station. Settings are compared against the clinical governance-approved default profile for the relevant ward type (medical ward, surgical ward, critical care unit). The report lists any monitor whose alarm thresholds deviate from the approved profile, including the specific parameter, expected value, and current value.
- **Collection Method**: Automated query via the patient monitoring central station management interface; results logged as a structured report and distributed to the ward manager and clinical engineering team lead via secure email.
- **Recurrence**: Daily automated audit at 06:00; results reviewed by the ward manager during morning handover.
- **Confidence**: High — automated, comprehensive (covers all connected monitors), independently verifiable against the clinical governance committee's approved alarm profile document. Does not depend on individual clinician awareness.
- **Dependencies**: Requires the patient monitoring central station to be operational. If the central station is encrypted (Scenario 01) or the attacker has compromised the audit script (more sophisticated variant of Scenario 02), the daily audit would not execute.
- **Traceability**: REQ-HC-SEC-021, REQ-HC-SAF-003, REQ-HC-SAF-004
- **Scenario Relevance**: In Scenario 02 (Step 6), the attacker modifies alarm thresholds on the central station. If the modification occurs after the 06:00 daily audit, it would not be detected until the following day's audit — a window of approximately 24 hours. If the modification occurs before the audit, it would be detected in the morning report.

---

### E4: Automated Deviation Alert Records

- **Type**: Operational
- **Supports**: CLAIM-HC-004 (Alarm configuration auditing maintains monitoring effectiveness)
- **Description**: Records of alerts generated when any patient monitor alarm threshold deviates from the approved default profile by more than the defined tolerance (±10% for heart rate limits, ±5% for SpO2 limits, ±2°C for temperature limits). Each alert includes the monitor identifier, ward, parameter, expected value, actual value, timestamp, and severity classification. Alerts are generated in near-real-time by the central station's monitoring module.
- **Collection Method**: Automated alerting from the central station audit module; alerts forwarded simultaneously to the ward manager (pager/mobile notification) and clinical engineering (email + dashboard).
- **Recurrence**: Continuous (triggered on detection of any deviation); monthly trend report reviewed by Clinical Governance Committee.
- **Confidence**: Medium — effective when the central station is operational, but the alerting mechanism depends on the central station software running correctly. If the central station is compromised or offline, deviation alerts are not generated. The defined tolerances may not catch small, incremental threshold changes that individually fall within tolerance but cumulatively move the threshold to a dangerous value.
- **Dependencies**: Central station must be operational and connected to the monitors. Alert delivery depends on the paging and email infrastructure.
- **Traceability**: REQ-HC-SEC-021, REQ-HC-SAF-003, REQ-HC-SAF-004
- **Scenario Relevance**: In Scenario 02, the attacker raises the heart rate alarm from 130 to 200 bpm (53% increase) and lowers SpO2 from 90% to 75% (17% decrease). Both changes exceed the defined tolerances and would trigger deviation alerts if the central station's audit module is operational. The attack in Scenario 02 may circumvent this by compromising the central station directly.

---

### E5: Manufacturer Code Signing Attestation

- **Type**: Design
- **Supports**: CLAIM-HC-002 (Firmware integrity prevents device manipulation)
- **Description**: Written attestation from the infusion pump manufacturer confirming that all firmware images are cryptographically signed using RSA-2048 during the secure build process. The signing key is stored in a FIPS 140-2 Level 3 hardware security module (HSM) at the manufacturer's secure development facility. The attestation covers the firmware signing workflow, key management procedures, and the device-side verification process.
- **Collection Method**: Obtained from the manufacturer during the procurement process as part of the supply chain security assessment (REQ-HC-SEC-027). Renewal requested annually as part of the maintenance contract review.
- **Recurrence**: Annual attestation renewal; updated following any change to the manufacturer's signing process or key infrastructure.
- **Confidence**: Medium — the attestation is a manufacturer self-declaration. The Trust does not independently audit the manufacturer's HSM, build pipeline, or key management process. Confidence would increase to High if an independent third-party audit of the manufacturer's signing infrastructure were provided.
- **Dependencies**: Depends on the manufacturer's continued compliance with their own stated processes. A change of manufacturer ownership, build infrastructure, or key management practices would invalidate the attestation until renewed.
- **Traceability**: REQ-HC-SEC-017, REQ-HC-SAF-011
- **Scenario Relevance**: In Scenario 02 (Step 8), the attacker pushes modified firmware to pumps. The firmware update mechanism described in Scenario 02 does not verify code signatures — this evidence describes the target state in which such verification is in place.

---

### E6: Unsigned Firmware Rejection Test Results

- **Type**: Test
- **Supports**: CLAIM-HC-002 (Firmware integrity prevents device manipulation)
- **Description**: Results of controlled testing in which three categories of firmware images were pushed to representative infusion pump units via the fleet management console: (a) unsigned firmware images (no signature attached), (b) tampered firmware images (valid signature preserved but binary content modified post-signing), and (c) firmware signed with an expired or revoked certificate. In all three cases, the devices rejected the update and logged the rejection event with an appropriate error code. The test also verified that the fleet management console prevents unsigned images from being staged for deployment.
- **Collection Method**: Conducted by the clinical engineering team in a dedicated non-production test environment, using manufacturer-provided test images and Trust-generated tampered images. Manufacturer technical support participated in test design and witnessed results.
- **Recurrence**: Annually, and following any firmware update or device hardware revision that changes the signature verification mechanism.
- **Confidence**: High — independently conducted by Trust staff with manufacturer observation; covers multiple rejection scenarios; documented and repeatable; conducted in a controlled environment that mirrors the production configuration.
- **Dependencies**: Test environment must accurately reflect the production fleet management console and pump firmware configuration. Test images must cover the relevant attack scenarios.
- **Traceability**: REQ-HC-SEC-017, REQ-HC-SAF-011
- **Scenario Relevance**: Directly tests the control that would prevent Scenario 02 (Step 8) — the deployment of backdoored firmware. If this control is in place and functioning, the attacker's modified firmware would be rejected by the pumps.

---

### E19: Firmware Version Register and Discrepancy Alerting

- **Type**: Operational
- **Supports**: CLAIM-HC-002 (Firmware integrity prevents device manipulation)
- **Description**: The fleet management console maintains an asset register of expected firmware versions for each pump in the fleet, correlated with the manufacturer's current release and the clinical engineering approved version. A daily automated comparison identifies devices reporting firmware versions that differ from the expected baseline. Discrepancies generate alerts to the clinical engineering team lead, classified by severity: minor (version behind by one patch), major (version not in the approved version list), critical (version not recognised by the manufacturer's release catalogue).
- **Collection Method**: Automated report generated by the fleet management console's asset management module. Critical-severity discrepancies generate immediate alerts; other severities are included in the daily report.
- **Recurrence**: Daily automated check; weekly summary reviewed by clinical engineering during scheduled device fleet review meetings.
- **Confidence**: Medium — effective when the fleet management console is operational. The register depends on pumps accurately reporting their firmware version, which could be subverted by a sufficiently sophisticated firmware backdoor that reports the expected version while running modified code. Paper-based fallback firmware audit (manual checksum comparison at the device) exists but is conducted only quarterly.
- **Dependencies**: Requires fleet management console to be operational and network-connected to all pumps. A pump that is disconnected from the network (e.g., in transit or in a faulty state) would not be checked.
- **Traceability**: REQ-HC-SEC-017, REQ-HC-SEC-020, REQ-HC-SAF-011
- **Scenario Relevance**: In Scenario 02 (Step 8), the attacker pushes modified firmware to 10 pumps. If the modified firmware reports a version identifier not in the approved list, the discrepancy alerting would detect it in the next daily check. However, a sophisticated attacker could instruct the backdoored firmware to report the legitimate version identifier, evading this detection mechanism.

---

## Clinical Data Integrity and Availability Evidence (Sub-Goal G3)

---

### E7: PACS Integrity Verification Testing Results

- **Type**: Test
- **Supports**: CLAIM-HC-008 (PACS integrity controls prevent diagnostic error)
- **Description**: Results of structured testing of the PACS integrity verification mechanism, conducted in a non-production test environment with synthetic patient data. Tests covered three categories: (a) modification of patient identifier fields in stored DICOM headers — detection confirmed with immediate audit alert; (b) modification of study-level metadata (examination date, modality type, body part) — detection confirmed; (c) substitution of image pixel data from a different study — detection confirmed for whole-image substitution through embedded hash comparison, partial detection for localised pixel modification (6 of 10 test modifications detected; 4 subtle modifications in low-contrast tissue regions evaded detection).
- **Collection Method**: Conducted by clinical engineering with radiology department participation, using test images in a non-production PACS environment. Test cases designed with input from a clinical radiologist to ensure realistic modification scenarios.
- **Recurrence**: Annually, and following any PACS software upgrade or infrastructure change.
- **Confidence**: Medium — header-level integrity protection is well-tested and effective; pixel-level integrity protection has known limitations for subtle modifications in low-contrast regions. The 60% detection rate for localised pixel modification represents a genuine gap that cannot be fully addressed with current PACS technology.
- **Dependencies**: Test results are specific to the current PACS software version and configuration. A software upgrade that changes the integrity verification mechanism would require re-testing.
- **Traceability**: REQ-HC-SAF-007
- **Scenario Relevance**: In Scenario 02 (Step 7), the attacker modifies PACS metadata (patient identifier swaps) and image content (obscuring a pulmonary nodule). The metadata modifications would be detected by this integrity mechanism. The image content modification (obscuring a nodule) falls into the category of localised pixel modification with partial detection — this evidence identifies the residual gap.

---

### E8: Metadata Modification Audit Alert Testing

- **Type**: Test
- **Supports**: CLAIM-HC-008 (PACS integrity controls prevent diagnostic error)
- **Description**: Results of testing the alert workflow triggered when DICOM metadata is modified post-commit to the PACS archive. Tests verified: (a) that alerts are generated within 5 minutes of the modification; (b) that alerts are delivered to the radiology department lead and PACS administrator via both email and dashboard notification; (c) that the modified image is flagged in the clinical viewer with a visible integrity warning overlay (amber border with "INTEGRITY ALERT — VERIFY PATIENT IDENTITY" text); (d) that the image cannot be used for clinical reporting until a radiologist acknowledges the alert and confirms or rejects the modification.
- **Collection Method**: Simulated metadata modification in non-production PACS environment; alert delivery timing, content, and clinical viewer behaviour observed and documented. Tested with three radiologist users to verify workflow impact.
- **Recurrence**: Annually.
- **Confidence**: High — alert delivery mechanism is automated and independently verifiable; clinical viewer flagging is a visible, mandatory indicator that cannot be dismissed without explicit clinician action. The workflow interruption (requiring radiologist acknowledgement) provides a hard stop against accidental use of integrity-compromised images.
- **Dependencies**: Alert delivery depends on email infrastructure and PACS dashboard being operational. If both are unavailable (during a wider system outage), alerts would be queued but not delivered until services are restored.
- **Traceability**: REQ-HC-SAF-007
- **Scenario Relevance**: In Scenario 02 (Step 7), the attacker swaps patient identifiers on CT images. This alert mechanism would detect the metadata modification and flag the affected images in the clinical viewer, preventing the wrong-patient diagnostic error described in Step 11 (assuming the PACS integrity system is operational).

---

### E9: Backup Architecture Documentation (Immutability)

- **Type**: Design
- **Supports**: CLAIM-HC-006 (Immutable backups enable safety-preserving recovery)
- **Description**: Technical documentation of the Trust's three-tier backup architecture: (1) on-site NAS with daily snapshots — provides rapid recovery for routine data loss but is vulnerable to network-based encryption (as demonstrated in Scenario 01, Step 7); (2) on-site tape library with weekly full backups — provides media diversity but the controller is network-accessible (also compromised in Scenario 01); (3) off-site immutable cloud storage with WORM (Write Once Read Many) retention policies, separate IAM credentials not accessible from the enterprise Active Directory domain, and 90-day minimum mandatory retention period. The off-site cloud storage uses a separate authentication domain with its own MFA enforcement, and WORM policies are enforced by the cloud storage provider at the infrastructure level — even the storage administrator cannot delete objects within the retention period.
- **Collection Method**: Maintained by the infrastructure team as a controlled document; reviewed and updated quarterly. Architecture independently verified by the information security team during the annual DSPT submission preparation.
- **Recurrence**: Quarterly review; updated following any change to the backup infrastructure.
- **Confidence**: High — the architecture is documented, the immutability mechanism is enforced by a third-party cloud provider (not dependent on Trust-controlled infrastructure), and the separate authentication domain prevents an attacker who compromises the enterprise Active Directory from accessing the off-site backups.
- **Dependencies**: Depends on the cloud storage provider maintaining the WORM enforcement mechanism and the availability of the cloud storage service during a recovery scenario.
- **Traceability**: REQ-HC-SEC-012, REQ-HC-SAF-010, REQ-HC-SAF-012
- **Scenario Relevance**: In Scenario 01 (Step 7), the attacker encrypts the on-site NAS and wipes the tape library controller. The third tier (off-site immutable cloud storage) would survive this attack, enabling recovery of EHR, PACS, and device management data.

---

### E10: Quarterly Restoration Test Results

- **Type**: Test
- **Supports**: CLAIM-HC-006 (Immutable backups enable safety-preserving recovery)
- **Description**: Results of quarterly restoration exercises in which the EHR, PACS, and device management console are restored from the off-site immutable backup to an isolated test environment. Each exercise measures three dimensions: (a) restoration time compared against the defined Recovery Time Objective (RTO): EHR — 8 hours, PACS — 12 hours, device management — 6 hours; (b) data integrity verification through hash comparison of restored databases against backup checksums; (c) functional verification by clinical users (a clinician confirms that patient records, imaging, and device configurations are accessible and correct in the restored environment).
- **Collection Method**: Structured exercise conducted by the infrastructure team with participation from clinical engineering, a representative clinician, and a pharmacist. Exercise report approved by the information security manager.
- **Recurrence**: Quarterly.
- **Confidence**: High — independently conducted, covers the full restoration workflow from off-site immutable storage, and includes functional verification by clinical users who are not members of the IT team. Most recent exercise achieved RTO for all three systems and passed data integrity verification with zero discrepancies.
- **Dependencies**: Requires an isolated test environment with sufficient compute and storage resources to restore production-scale systems. Test environment must be isolated from the production network to prevent cross-contamination.
- **Traceability**: REQ-HC-SEC-013, REQ-HC-SAF-010, REQ-HC-SAF-012
- **Scenario Relevance**: Demonstrates that the Trust can recover from the data loss caused by Scenario 01 (Steps 7, 9) within clinically acceptable timeframes, provided the off-site immutable backups are intact.

---

### E11: Fallback Procedure Documentation + Drill Results

- **Type**: Process
- **Supports**: CLAIM-HC-010 (Clinical fallback procedures maintain safe care during outage)
- **Description**: Comprehensive clinical fallback procedure documentation maintained in every ward and clinical area, stored in clearly marked red folders ("Clinical Fallback — Cyber Incident") at the nursing station. The documentation includes: paper-based prescribing templates with mandatory double-check fields, manual infusion pump programming checklists (step-by-step with dose verification prompts), bedside observation charts (NEWS2 scoring), emergency drug dosing reference cards (adult and paediatric), manual allergy verification procedure (requiring verbal verification with patient and pharmacy cross-check), and a transition checklist for returning to electronic systems after restoration.

    Biannual drill results document: staff participation rates (most recent: 78% of ward-based clinical staff), error rates during paper-based prescribing (most recent: 3 simulated dosing discrepancies in 47 simulated prescriptions, all caught by the double-check process), time-to-transition from electronic to manual workflows (most recent: average 22 minutes per ward), and a clinical safety assessment by the drill facilitator.
- **Collection Method**: Procedures authored by the clinical governance team in collaboration with pharmacy, nursing, and clinical engineering. Drills planned and facilitated by the clinical education team using a structured exercise scenario. Results assessed by a multidisciplinary panel including clinical governance lead, pharmacy lead, and information security manager.
- **Recurrence**: Procedures reviewed annually and updated following any system change. Drills conducted biannually (every six months). Post-drill improvement actions tracked by the clinical governance team.
- **Confidence**: Medium — procedure documentation is comprehensive and physically accessible (no electronic system dependency). Drill results consistently show that staff unfamiliar with paper processes make more errors during the transition period. The 78% participation rate indicates that approximately one in five clinical staff has not participated in a recent drill. The 6.4% simulated error rate during paper prescribing (3/47) — though all errors were caught by the built-in double-check — confirms that manual processes are inherently less safe than electronic prescribing with automated guardrails.
- **Dependencies**: Fallback folders must be kept current (annual review). Paper supplies (prescription pads, observation charts) must be maintained in stock. Staff turnover requires ongoing training beyond the biannual drill cycle.
- **Traceability**: REQ-HC-SEC-023, REQ-HC-SAF-008, REQ-HC-SAF-010
- **Scenario Relevance**: Directly relevant to Scenario 01 (Steps 11–13), where the loss of the EHR, fleet management console, and patient monitoring central station forces clinicians to operate on paper-based processes. The medication dosing transcription error in Step 12 is precisely the type of error that the fallback procedure double-check process is designed to catch.

---

## Enterprise-to-Clinical Isolation Evidence (Sub-Goal G4)

---

### E12: Firewall Rule Audit (No Cross-Zone Exceptions)

- **Type**: Design
- **Supports**: CLAIM-HC-001 (Network segmentation protects device integrity)
- **Description**: Results of a comprehensive audit of the internal firewall rule set separating the enterprise IT zone from the clinical/medical device zone. The audit confirms: (a) all legacy exception rules permitting bidirectional access for dual-homed clinical workstations have been removed; (b) the rule set implements an explicit allow-list policy with only three permitted cross-zone data flows — EHR-to-device-management prescription data (outbound, TCP port 5545, application-layer filtered), DICOM image transfer from clinical modalities to PACS (outbound, ports 104/11112, DICOM protocol validation), and SIEM log forwarding from clinical zone to enterprise SIEM (outbound, TLS-encrypted syslog); (c) all other traffic between zones is denied and logged; (d) the firewall is configured to generate alerts for any rule modification, with alerts sent to both the network team and the information security team.
- **Collection Method**: Conducted quarterly by a qualified firewall administrator. The rule set is exported and compared against the approved baseline (maintained as a version-controlled document). A second administrator independently verifies the comparison results. The audit report is signed by both administrators.
- **Recurrence**: Quarterly audit with dual-administrator verification. Continuous change monitoring between audits (real-time alerts for any rule modification).
- **Confidence**: High — dual-verified audit provides strong assurance; continuous change monitoring prevents undetected configuration drift between quarterly audits. The combination of periodic comprehensive audit and continuous change alerting provides both depth and timeliness.
- **Dependencies**: Change monitoring alerts depend on the firewall's alerting function and the email/SIEM infrastructure. If the SIEM is compromised (potentially during a wide-scale attack), change alerts may not be received.
- **Traceability**: REQ-HC-SEC-007, REQ-HC-SEC-008, REQ-HC-SAF-001, REQ-HC-SAF-009
- **Scenario Relevance**: The incomplete segmentation and legacy exception rules that enabled Scenario 01 (Step 8) are precisely what this evidence demonstrates have been remediated. In the post-incident target state, the dual-homed workstation attack vector used by DarkVault would be blocked by the firewall.

---

### E13: Penetration Test — Enterprise to Clinical Zone Blocked

- **Type**: Test
- **Supports**: CLAIM-HC-001 (Network segmentation protects device integrity)
- **Description**: Results of an independent penetration test conducted by a CREST-accredited third-party firm, scoped to assess all enterprise-to-clinical zone traversal vectors. The test included: (a) direct network probing through the firewall from the enterprise zone — 427 ports tested, all blocked with no responses from clinical zone hosts; (b) exploitation of the three permitted cross-zone data flows — each flow tested for injection, tunnelling, and protocol abuse: two informational findings noted (EHR-to-device data flow permits packets up to 64KB, which is larger than typical clinical messages; DICOM flow permits association negotiation without client certificate), neither exploitable to achieve code execution or lateral movement; (c) scanning for residual dual-homed workstations — ARP sweep and multi-interface detection confirmed zero dual-homed devices on the network; (d) attempted pivoting through clinical zone via application-layer attacks — no traversal achieved.
- **Collection Method**: Commissioned by the Trust's information security manager; conducted by an external CREST-accredited penetration testing firm with healthcare sector experience. Testing conducted over a one-week period with clinical engineering coordination to avoid patient impact.
- **Recurrence**: Annually; additionally triggered following any significant network architecture change (e.g., new cross-zone data flow, firewall hardware replacement, VLAN restructuring).
- **Confidence**: High — independently conducted by a qualified, accredited third party with no conflicts of interest. Comprehensive scope covering both network-layer and application-layer vectors. Two informational findings demonstrate thoroughness (findings below exploitability threshold were still reported).
- **Dependencies**: Test results are point-in-time. Ongoing assurance between annual tests depends on the firewall rule audit (E12) and continuous change monitoring.
- **Traceability**: REQ-HC-SEC-007, REQ-HC-SEC-008, REQ-HC-SEC-014, REQ-HC-SAF-001
- **Scenario Relevance**: Directly validates the countermeasure for Scenario 01 (Step 8). The penetration test confirms that the enterprise-to-clinical traversal vector used by DarkVault (via dual-homed workstations and legacy firewall exceptions) is no longer viable in the remediated architecture.

---

### E14: Vendor Access Logs (Scheduled Windows Only)

- **Type**: Operational
- **Supports**: CLAIM-HC-005 (Vendor access controls prevent supply-chain attack path)
- **Description**: Audit logs from the vendor remote-access gateway demonstrating that all vendor VPN sessions over the review period were activated within scheduled maintenance windows only. Each log entry captures: session start and end timestamps, source IP address, vendor engineer identity (individual named account, not a shared credential), devices accessed during the session, actions performed (categorised as firmware update, configuration change, diagnostic activity, or routine check), and the associated maintenance work order reference number. Monthly review confirms zero out-of-window sessions and zero sessions from unrecognised IP addresses.
- **Collection Method**: Automated extraction from the vendor VPN gateway; monthly summary compiled by clinical engineering and reviewed jointly with the information security team. Any anomalous session (unrecognised IP, out-of-window timing, device access outside work order scope) triggers an immediate investigation.
- **Recurrence**: Continuous logging; monthly review; immediate alerting for anomalies.
- **Confidence**: High — automated, comprehensive, and the move from shared credentials to individual named accounts (post-incident remediation) enables attribution of vendor activity to specific engineers. Monthly review by both clinical engineering and information security provides dual oversight.
- **Dependencies**: Depends on the vendor VPN gateway generating complete and accurate logs. Gateway logs are forwarded to the Trust's SIEM for independent retention (not reliant on the gateway's own storage).
- **Traceability**: REQ-HC-SEC-018, REQ-HC-SAF-001, REQ-HC-SAF-009
- **Scenario Relevance**: In Scenario 02 (Step 1), the attacker uses compromised vendor VPN credentials — a shared credential active 24/7. This evidence describes the remediated state: individual credentials, MFA, scheduled-window activation, and monitoring. The Scenario 02 attack vector would generate multiple anomaly alerts (unrecognised IP, out-of-window session, shared credential rejected).

---

### E15: MFA Enforcement Records for Vendor Sessions

- **Type**: Operational
- **Supports**: CLAIM-HC-005 (Vendor access controls prevent supply-chain attack path)
- **Description**: Records from the vendor VPN gateway's authentication system confirming that all vendor sessions were authenticated with multi-factor authentication. Each record includes: vendor engineer identity, first factor (password), second factor type (hardware TOTP token — vendor-issued), authentication result, and session identifier. Records confirm that no sessions were established using single-factor authentication during the review period.
- **Collection Method**: Automated extraction from VPN gateway authentication logs; monthly compliance summary generated.
- **Recurrence**: Continuous; monthly compliance summary reviewed by information security team.
- **Confidence**: High — MFA enforcement is a system-level configuration on the VPN gateway. The gateway rejects connection attempts that do not provide a valid second factor, regardless of the correctness of the password. This enforcement cannot be bypassed by the vendor engineer without cooperation from the gateway administrator.
- **Dependencies**: MFA enforcement depends on the VPN gateway configuration remaining unchanged. Configuration changes to the gateway are subject to change management and would be detected by the firewall rule audit process.
- **Traceability**: REQ-HC-SEC-018, REQ-HC-SAF-001
- **Scenario Relevance**: Directly addresses the Scenario 02 (Step 1) attack vector. The compromised vendor credentials (password only) used in Scenario 02 would be rejected by the MFA-enforced gateway, as the attacker would not possess the vendor engineer's hardware TOTP token.

---

### E16: Joint IT/Clinical Engineering Tabletop Exercise Reports

- **Type**: Process
- **Supports**: CLAIM-HC-007 (Integrated incident response prevents containment-induced safety hazards)
- **Description**: Reports from biannual tabletop exercises in which representatives from IT Security (information security manager + one analyst), Clinical Engineering (clinical engineering manager + one biomedical technician), and clinical leadership (a ward sister, a pharmacist, and a consultant physician) rehearse responding to simulated cyber incidents affecting clinical systems. Each exercise presents a scenario derived from Scenarios 01 and 02 with injected decision points (e.g., "the enterprise-clinical network link must be severed — what clinical systems will be affected, and what are your compensating actions?"). Reports document: decisions made at each decision point, clinical impact assessments performed, time-to-decision metrics (target: containment decision within 30 minutes of declaration with clinical impact assessment complete), dissenting views, and identified improvement actions. An independent observer from the Trust's risk management team assesses the exercise and provides a written assessment.
- **Collection Method**: Facilitated by the Trust's risk management team using a structured exercise scenario and injects. Observed by an independent assessor (not a member of the response team).
- **Recurrence**: Biannually (every six months); schedule aligned with incident response plan annual review cycle.
- **Confidence**: Medium — exercises demonstrate capability and identify process gaps, but tabletop exercises are inherently less realistic than live exercises (participants have time to think, reference documents, and discuss options — conditions not available during a genuine crisis). Staff turnover means that some decision-makers participating in a real incident may not have attended a recent exercise.
- **Dependencies**: Effective exercises require participation from senior decision-makers (CIO, clinical engineering manager, clinical lead). Scheduling constraints at a busy hospital mean that full attendance at every exercise is not always achieved.
- **Traceability**: REQ-HC-SEC-022, REQ-HC-SAF-009, REQ-HC-SAF-010
- **Scenario Relevance**: The Scenario 01 decision point at Day 2 (whether to sever the enterprise-clinical network link) is the primary scenario used in these exercises. The exercise process is designed to prevent a repeat of the ad hoc decision-making described in the Northgate incident narrative (Day 2 afternoon).

---

### E17: Incident Response Plan with Clinical Impact Assessment

- **Type**: Process
- **Supports**: CLAIM-HC-007 (Integrated incident response prevents containment-induced safety hazards)
- **Description**: The Trust's integrated cyber incident response plan, maintained as a controlled document (version-controlled, with change history). The plan integrates IT security response procedures with clinical safety assessment procedures. Key sections include: (a) clinical impact assessment checklist — a structured form completed before any containment action that may affect clinical systems, documenting which clinical services will be impacted, which patient safety controls will be degraded, and what compensating clinical actions will be taken; (b) pre-defined decision trees for common containment scenarios — full clinical zone isolation, selective ward isolation, vendor access termination, EHR shutdown; (c) communication templates for clinical staff notification — pre-drafted messages for each containment scenario, adapted at the time of use; (d) escalation matrix showing when the joint IT/Clinical Engineering governance committee must be convened; (e) post-incident clinical review procedure — structured process for assessing whether any patient safety events occurred as a result of the incident or the containment actions.
- **Collection Method**: Authored by the information security manager with structured input from clinical engineering, pharmacy, nursing leadership, and clinical governance. Reviewed and formally approved by the joint IT/Clinical Engineering governance committee (REQ-HC-SEC-024).
- **Recurrence**: Plan reviewed annually; updated following any incident, exercise (E16), or significant system change. Version history maintained to enable audit trail of changes.
- **Confidence**: Medium — the plan is comprehensive, well-structured, and reflects input from all relevant stakeholders. Its real-world effectiveness has not been tested in a live incident (the Northgate scenario occurred before this plan existed, and the plan represents the post-incident remediation). The closest analogue to live testing is the biannual tabletop exercise (E16).
- **Dependencies**: Plan effectiveness depends on (a) decision-makers being aware of the plan and knowing where to find it (printed copies maintained in the incident response pack, independent of electronic systems), (b) decision-makers following the plan under crisis conditions rather than reverting to ad hoc decision-making, and (c) the plan being current (reflecting the actual system architecture, not an outdated version).
- **Traceability**: REQ-HC-SEC-022, REQ-HC-SAF-009, REQ-HC-SAF-010
- **Scenario Relevance**: This plan is the direct remediation for the Northgate incident (Day 2 afternoon), where the decision to sever the enterprise-clinical network link was made without a structured framework for evaluating clinical safety consequences.

---

## Cross-Cutting Evidence (Patching Constraint)

---

### E22: Clinical Monitoring Protocol for Interim-Patched Devices

- **Type**: Process
- **Supports**: Patching Strategy A (Patch Immediately)
- **Description**: A documented clinical protocol specifying enhanced monitoring requirements for medical devices running firmware patches that have not yet completed IEC 62304 safety re-validation. The protocol includes: increased bedside observation frequency (every 15 minutes instead of the standard hourly for patients receiving medication via an interim-patched pump), mandatory independent dose verification by a second clinician for every dose delivered by an interim-patched device, and a treatment response monitoring checklist to detect any subtle anomalies in device behaviour. The protocol also specifies escalation procedures if any device anomaly is observed, including immediate reversion to the pre-patch firmware if the anomaly affects a safety-critical function.
- **Collection Method**: Protocol authored by pharmacy, clinical engineering, and nursing leadership; approved by the clinical governance committee and the joint IT/Clinical Engineering governance committee.
- **Recurrence**: Maintained as a standing protocol; activated on each occasion that Strategy A is adopted. Reviewed annually regardless of usage.
- **Confidence**: Medium — the protocol is well-defined but its effectiveness depends on staff compliance with enhanced monitoring requirements during a period that is already likely to be operationally stressful (the patching event is triggered by a vulnerability, which may be concurrent with an active threat).
- **Dependencies**: Sufficient clinical staffing to implement enhanced monitoring. If the ward is already short-staffed, the 15-minute observation requirement may not be achievable.
- **Traceability**: REQ-HC-SAF-001, REQ-HC-SAF-002, REQ-HC-SAF-014
- **Scenario Relevance**: Would apply if a critical vulnerability were discovered in the infusion pump firmware and the Trust elected to deploy the patch before completing full IEC 62304 safety re-validation.

---

### E23: Manufacturer Interim Safety Guidance

- **Type**: Design
- **Supports**: Patching Strategy A (Patch Immediately)
- **Description**: Manufacturer-provided guidance document accompanying each security patch, describing: the scope of the code change, the safety-critical functions potentially affected, the results of the manufacturer's preliminary safety testing (which may be less comprehensive than full IEC 62304 re-validation), and any known interactions with safety-critical device parameters. This guidance enables the Trust's clinical engineering team and clinical governance committee to make an informed decision about whether to adopt Strategy A (immediate patching with compensating clinical controls) or Strategy B (deferral pending full re-validation).
- **Collection Method**: Provided by the manufacturer as part of the patch release package. Contractually required under REQ-HC-SEC-026.
- **Recurrence**: Provided with each security patch release.
- **Confidence**: Medium — depends on the manufacturer's willingness and ability to provide this guidance promptly. Some manufacturers may provide minimal guidance or delay providing it, reducing the Trust's ability to make a timely informed decision.
- **Dependencies**: Manufacturer cooperation. If the manufacturer does not provide interim safety guidance (or provides inadequate guidance), Strategy A proceeds with higher uncertainty, making Strategy B the preferred default.
- **Traceability**: REQ-HC-SEC-026, REQ-HC-SAF-011
- **Scenario Relevance**: Not directly invoked in either Scenario 01 or 02, but represents a critical input to the ongoing management of the patching constraint that underlies the entire assurance case.

---

### E24: Enhanced Isolation Configuration During Deferral

- **Type**: Design
- **Supports**: Patching Strategy B (Defer Patch)
- **Description**: Firewall rule modification records showing additional restrictions applied to the clinical zone boundary during a vulnerability deferral window. Restrictions include: disabling the EHR-to-device-management data flow (replacing it with a manual, air-gapped transfer process for prescription data), restricting DICOM transfers to a queue-and-review pattern (images transferred but held for integrity verification before clinical use), and disabling all vendor remote access to the clinical zone. These restrictions reduce the clinical zone's connectivity to the minimum required for device operation, limiting the attack surface available to exploit the known vulnerability.
- **Collection Method**: Firewall rule change records maintained under the standard change management process. Clinical impact assessment completed before isolation enhancement is applied (using the incident response plan clinical impact assessment checklist, E17).
- **Recurrence**: Applied during each vulnerability deferral window; reverted when the validated patch is deployed.
- **Confidence**: Medium — the enhanced isolation reduces the attack surface but does not eliminate it entirely (a vulnerability may be exploitable through a remaining permitted data flow or through physical access). The clinical impact of the enhanced restrictions (e.g., manual prescription transfer instead of automated) introduces operational friction and potential for errors.
- **Dependencies**: Requires clinical willingness to accept the operational impact of enhanced isolation (degraded electronic workflows) during the deferral window.
- **Traceability**: REQ-HC-SEC-007, REQ-HC-SEC-014, REQ-HC-SAF-009
- **Scenario Relevance**: Represents the compensating control that would be applied if a critical vulnerability were disclosed in infusion pump firmware and the Trust elected to defer patching until full IEC 62304 re-validation was complete.

---

### E25: Vulnerability-Specific Monitoring Rules

- **Type**: Operational
- **Supports**: Patching Strategy B (Defer Patch)
- **Description**: IDS/IPS signatures and SIEM correlation rules deployed specifically to detect exploitation attempts for a disclosed vulnerability during the deferral window. When a critical vulnerability is disclosed and patching is deferred, the information security team obtains or develops detection signatures (from the manufacturer's security advisory, NCSC advisories, or open-source threat intelligence) and deploys them to the clinical zone monitoring infrastructure. These rules generate high-priority alerts for any network activity matching known exploitation patterns, enabling rapid containment if an exploitation attempt is detected.
- **Collection Method**: Signatures obtained from manufacturer security advisory, NCSC, or developed in-house based on vulnerability technical details. Deployed to clinical zone IDS/IPS and SIEM. Alert triage SLA: 15 minutes for critical-severity alerts during a deferral window.
- **Recurrence**: Deployed for each vulnerability deferral; maintained until the validated patch is deployed and confirmed across the fleet.
- **Confidence**: Medium — detection rules are effective against known exploitation techniques for the disclosed vulnerability, but may not detect novel exploitation methods. Zero-day variants of the vulnerability (exploiting the same underlying flaw via a different technique) may evade the specific detection rules.
- **Dependencies**: Requires timely availability of exploitation signatures or sufficient technical detail in the vulnerability disclosure to develop custom rules. Also requires the clinical zone monitoring infrastructure (REQ-HC-SEC-019) to be deployed and operational.
- **Traceability**: REQ-HC-SEC-009, REQ-HC-SEC-019, REQ-HC-SEC-030
- **Scenario Relevance**: Would provide early warning of exploitation attempts during a vulnerability deferral window, enabling the Trust to escalate from Strategy B (defer) to Strategy A (emergency patch) if active exploitation is detected.

---

### E20: Device Authentication Testing

- **Type**: Test
- **Supports**: CLAIM-HC-009 (Device authentication prevents unauthorised command execution)
- **Description**: Results of controlled testing in which configuration commands were sent to representative infusion pumps and patient monitors from unauthorised sources. Three test categories were executed: (a) commands sent from a workstation not registered in the fleet management application's allow list — all commands rejected with "unauthorised source" error logged on the device; (b) raw HL7 and proprietary protocol commands crafted using protocol analysis tools and sent directly on the clinical VLAN from a non-registered network address — all commands rejected; (c) commands sent from a registered workstation but using an incorrect or expired authentication token — all commands rejected. Testing also verified that successful commands (from authenticated, registered sources) are fully logged including the source workstation identity and user session identifier.
- **Collection Method**: Conducted by clinical engineering in a dedicated test environment, with manufacturer technical support participating in test design. Test cases included both positive (legitimate commands accepted) and negative (illegitimate commands rejected) scenarios.
- **Recurrence**: Annually, and following any device firmware update or management console upgrade.
- **Confidence**: Medium — tests comprehensively cover the documented authentication mechanisms but cannot guarantee the absence of undocumented command interfaces, vendor debugging modes, or backdoor access channels that might accept commands without authentication. Pre-deployment security assessment (REQ-HC-SEC-027) addresses this partially but cannot verify proprietary firmware exhaustively.
- **Dependencies**: Test environment must accurately mirror production configuration. Test results are firmware-version-specific.
- **Traceability**: REQ-HC-SEC-016, REQ-HC-SAF-001, REQ-HC-SAF-004
- **Scenario Relevance**: Tests the countermeasure that would prevent Scenario 02 (Steps 3–5), where the attacker sends commands from a compromised clinical workstation. However, Scenario 02 succeeds because the attacker uses the legitimate service account credentials — device authentication verifies the credentials, not the human behind them, making this control necessary but not solely sufficient.

---

### E21: Clinical Workstation Access Control Verification

- **Type**: Operational
- **Supports**: CLAIM-HC-009 (Device authentication prevents unauthorised command execution)
- **Description**: Quarterly verification that clinical workstations registered for device management access are correctly configured with role-based access controls. The audit checks: (a) that the management console's registered workstation list matches the approved clinical asset register (no unauthorised workstations added); (b) that each registered workstation has RBAC configured with appropriate role assignments (nurse, pharmacist, clinical engineer, administrator); (c) that no generic or shared user accounts exist on the clinical workstations (post-incident remediation replaced all shared accounts with individual named accounts); (d) that the fleet management service account is configured for application-only use (cannot be used for interactive login).
- **Collection Method**: Manual audit conducted by clinical engineering, comparing the management console's configuration against the approved asset register and RBAC policy. Results documented and reviewed by the information security manager.
- **Recurrence**: Quarterly.
- **Confidence**: Medium — point-in-time verification that provides assurance at the time of the audit but does not monitor for changes between audits. An unauthorised workstation added to the allow list between quarterly audits would not be detected until the next audit (maximum 90-day window). Continuous monitoring of the allow list would increase confidence.
- **Dependencies**: Requires the approved asset register and RBAC policy to be current and accurate.
- **Traceability**: REQ-HC-SEC-016, REQ-HC-SEC-004
- **Scenario Relevance**: Addresses the access control environment in which Scenario 02 operates. The move from shared credentials to individual named accounts and the restriction of the service account to application-only use are direct remediations for the Scenario 02 attack vector (Step 4 — harvesting the shared service account credential).
