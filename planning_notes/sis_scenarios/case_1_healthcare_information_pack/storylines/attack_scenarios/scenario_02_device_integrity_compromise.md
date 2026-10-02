# Scenario 02: Device Integrity Compromise — Manipulation of Networked Clinical Devices

Healthcare Attack Scenario — Northgate General Hospital

---

## 1. Scenario Summary

A sophisticated attacker who has already established a persistent foothold inside Northgate General Hospital's clinical device network moves beyond simple disruption to manipulate the behaviour of networked medical devices. Rather than encrypting systems for ransom, this attacker targets the integrity of clinical data and device parameters — altering infusion pump dosing configurations, modifying patient monitoring alarm thresholds, and injecting falsified data into the PACS imaging archive. The attack is designed to be subtle and difficult to detect: devices continue to appear operational, but the data they provide to clinicians is unreliable. The resulting safety consequence is insidious — clinical decisions are made on the basis of falsified or manipulated information, and the failure is only discovered after patient harm has occurred.

---

## 2. System Prerequisites

The following configuration and environmental conditions make this attack possible:

- **Established network foothold**: The attacker has already compromised a clinical workstation connected to the medical device VLAN (via the enterprise-to-clinical pivot described in Scenario 01, or via a separate initial access vector such as a compromised biomedical vendor remote-access session).
- **Unencrypted clinical protocols**: Communication between clinical workstations and medical devices uses legacy protocols (e.g., HL7 v2 over TCP, DICOM without TLS) that transmit commands and data in cleartext without message authentication.
- **Lack of device-level authentication**: Infusion pumps accept programming commands from any workstation on the clinical VLAN without per-device mutual authentication or command signing.
- **No integrity verification on stored images**: The PACS stores DICOM images and metadata without cryptographic integrity checks. Image files can be modified at rest or in transit without detection.
- **Limited medical device logging**: Networked medical devices generate minimal audit logs, and those logs are not aggregated into the SIEM. Changes to device configuration are recorded locally on the device but not monitored centrally.
- **Vendor remote-access portal**: The infusion pump manufacturer maintains a VPN-based remote support connection to the clinical network for firmware updates and troubleshooting. This connection uses a shared credential and is active 24/7.
- **Firmware update mechanism lacks code signing**: The infusion pump fleet accepts firmware updates pushed from the management console without cryptographic signature verification.

---

## 3. Step-by-Step Attack Chain

| Step | Action Taken | System/Asset Affected | Detection Opportunity |
|------|-------------|----------------------|----------------------|
| **1. Initial access via vendor remote support** | Attacker compromises the infusion pump manufacturer's remote-access VPN credentials through a supply-chain phishing attack against a field service engineer. Authenticates to the vendor support portal, which provides direct network access to the clinical VLAN. | Vendor VPN gateway → Clinical VLAN | Vendor session logs: login from unusual IP. Clinical network: new VPN session to vendor support portal outside scheduled maintenance windows. |
| **2. Clinical network reconnaissance** | From the vendor VPN session, attacker scans the clinical VLAN to map connected devices. Identifies 480 infusion pumps, 320 patient monitors, 60 ventilators, PACS servers, and clinical workstations. Enumerates device firmware versions and identifies unpatched devices. | Clinical VLAN — all connected devices | IDS (if deployed on clinical VLAN): network scan signatures. Device management console: unexpected device enumeration queries. |
| **3. Clinical workstation compromise** | Attacker exploits a known vulnerability in an unpatched clinical workstation (running an outdated operating system required for compatibility with the infusion pump management software). Gains local administrator access. | Clinical workstation (infusion pump management console) | Vulnerability scanner (if run against clinical zone): known CVE present. Host-based IDS: exploitation artefacts. Event logs: new local administrator session. |
| **4. Credential harvesting on clinical zone** | Attacker extracts cached credentials from the clinical workstation, including the service account used by the infusion pump fleet management application to communicate with individual pumps. | Clinical workstation — credential store | EDR (if deployed): credential access events. Application logs: service account used from unexpected context. |
| **5. Infusion pump configuration manipulation** | Using the harvested service account credentials, attacker connects to infusion pump management interfaces and modifies drug library entries for three commonly used medications. Specifically: the maximum dose rate for morphine is increased from 4 mg/hr to 40 mg/hr, the concentration entry for heparin is altered, and the hard dose limit for a chemotherapy agent is removed. Changes are pushed as a "drug library update." | Infusion pump fleet — drug library configuration | Pharmacy verification: drug library change outside scheduled update cycle. Pump management console audit log: configuration changes not initiated by authorised staff. **Critical gap**: These logs exist but are not actively monitored. |
| **6. Patient monitor alarm threshold modification** | Attacker accesses the patient monitoring central station and modifies default alarm thresholds for several monitored parameters. Heart rate alarm upper limit is raised from 130 bpm to 200 bpm; SpO2 low alarm is lowered from 90% to 75%. Changes are applied to the ward-level default profile, affecting all newly connected patients. | Patient monitoring central station — alarm configuration | Central station audit trail: threshold changes outside clinical governance process. Nursing staff: awareness that alarm defaults have changed (requires proactive checking). |
| **7. PACS image manipulation** | Attacker accesses the PACS archive server (which stores DICOM images over unencrypted connections). Modifies metadata on several stored CT images — altering patient identifiers on two scans so that Patient A's imaging is associated with Patient B's clinical record, and vice versa. Additionally, subtly modifies a chest X-ray image to obscure a small pulmonary nodule. | PACS archive server — DICOM image store | DICOM audit trail: image modification events (if logging is enabled). Radiology workflow: patient identity mismatch detected during reporting (requires manual cross-checking). Image hash verification: absent at Northgate. |
| **8. Persistence via firmware backdoor** | Attacker pushes a modified firmware image to a subset of ten infusion pumps via the fleet management console. The modified firmware includes a backdoor that allows remote command execution and persists across device reboots. The firmware update mechanism does not verify code signatures. | Ten infusion pumps — firmware | Firmware version audit: version mismatch between updated and non-updated pumps. Device behaviour: no immediately observable change (backdoor is dormant). Manufacturer checksum comparison: would detect modification but is not routinely performed. |
| **9. Cover tracks** | Attacker clears relevant log entries on the clinical workstation and modifies the fleet management console's audit log to remove evidence of the unauthorised drug library update. Leaves the vendor VPN session idle to maintain access for future operations. | Clinical workstation logs, fleet management audit log, vendor VPN session | Log integrity monitoring (absent): would detect log truncation. SIEM correlation: gap in expected log sequence from clinical workstation. |
| **10. Safety consequences manifest — medication error** | A nurse programmes an infusion pump with morphine for a post-surgical patient. The drug library, normally displaying a maximum rate of 4 mg/hr with a hard limit, now permits 40 mg/hr. Under time pressure, the nurse enters "40" instead of "4.0" (a common keystroke error). The pump's guardrail, which would normally reject this dose, accepts it. The patient receives a ten-fold morphine overdose before the error is detected through clinical observation of respiratory depression. | Infusion pump (Ward 3) — drug delivery | Smart pump guardrail: **bypassed** by the attacker's drug library modification. Clinical observation: respiratory depression detected, naloxone administered. |
| **11. Safety consequences manifest — missed diagnosis** | A radiologist reports a chest X-ray as showing no abnormality. The image had been subtly modified to obscure a pulmonary nodule. The finding is only discovered three months later on a follow-up scan, by which time the lesion has grown. Separately, a patient undergoes a procedure based on imaging belonging to a different patient due to the PACS metadata swap. The error is caught when the surgeon notes anatomical inconsistencies during the procedure. | Radiology workflow — diagnostic accuracy; Surgical workflow — patient identification | Radiology peer review: may identify the missed finding retrospectively. Surgical safety checklist: anatomical inconsistency detected (near-miss). |
| **12. Safety consequences manifest — delayed alarm response** | A patient on Ward 7 develops hypoxia (SpO2 drops to 82%). The alarm threshold has been lowered to 75%, so no alarm sounds until the patient's condition deteriorates further. A nurse performing routine observations identifies the patient's distress and initiates emergency intervention, but the response is delayed by approximately twelve minutes compared to normal alarm-triggered response. | Patient monitoring system (Ward 7) — alarm function | Clinical observation: staff detect patient distress visually. Post-incident alarm audit: threshold comparison against clinical governance standard. |

---

## 4. Safety Consequence

This scenario demonstrates the **integrity-to-safety pathway** — the most insidious form of cyber-physical attack in healthcare. Unlike the ransomware scenario (Scenario 01), where system unavailability is immediately visible and triggers crisis protocols, integrity attacks are designed to be invisible. Devices continue operating; screens display data; alarms appear to function. The failure is in the trustworthiness of the information, not its availability.

### Drug Library Manipulation

Infusion pumps with configurable drug libraries implement a critical safety function: dose range checking. The drug library acts as an automated pharmacist, rejecting doses outside clinically safe ranges. When this library is corrupted, the safety barrier is silently removed. The pump accepts dangerous doses without alerting the clinician. This recreates a well-documented failure mode from pre-smart-pump era — keystroke and transcription errors in manual pump programming — but does so in a context where clinicians believe they are protected by the smart pump's guardrails.

### Alarm Threshold Manipulation

Patient monitoring alarms are the primary early-warning system for clinical deterioration. Alert threshold manipulation is particularly dangerous because it creates a "silent failure" — the absence of an alarm is not itself alarming. Clinicians may not realise that alarm settings have been changed because they interact with alarms reactively (when an alarm sounds) rather than proactively (checking that alarm settings are correct). The twelve-minute delay in hypoxia detection in this scenario could be the difference between a successful intervention and a cardiac arrest.

### Imaging Data Integrity

PACS manipulation threatens two distinct dimensions of patient safety. First, modifying image content (obscuring findings) can lead to missed diagnoses — a harm that may not manifest for weeks or months. Second, swapping patient identifiers creates a wrong-patient error pathway, where clinical decisions are made based on another patient's imaging. Both attack modes exploit the inherent trust that clinicians place in digital medical records — a trust that is rarely verified at the point of use.

### Systemic Trust Erosion

The most significant safety consequence of an integrity attack may be the erosion of clinical trust in digital systems following detection. If clinicians learn that device configurations and clinical data may have been tampered with, they may lose confidence in the integrity of all digital clinical data — leading to defensive medicine, unnecessary repeat investigations, delayed treatment decisions, and a potentially prolonged period of degraded clinical effectiveness.

---

## 5. Indicators of Compromise

### Network-Level IoCs

1. **Vendor VPN session anomaly**: Remote support VPN connection from an IP address not associated with the registered manufacturer's support infrastructure, active outside scheduled maintenance windows.
2. **Clinical VLAN scanning activity**: Sequential connection attempts across the clinical device IP range from a single source, consistent with automated device enumeration.
3. **Unscheduled firmware distribution**: Large binary transfers from the fleet management console to multiple infusion pump IP addresses outside the quarterly firmware update window.

### Host-Level IoCs

4. **Clinical workstation exploitation artefacts**: Evidence of known CVE exploitation on the clinical workstation — crash dumps, unexpected child processes spawned by the vulnerable application.
5. **Service account misuse**: The infusion pump fleet management service account authenticating from an interactive session rather than the management application process.
6. **Log file truncation**: Audit log files on the clinical workstation and fleet management console showing discontinuities or unexpected size reduction.

### Clinical / Behavioural IoCs

7. **Drug library configuration change**: Infusion pump drug library entries modified outside the pharmacy governance approval cycle. Mismatch between the pharmacist-approved drug library version and the version deployed to pumps.
8. **Alarm threshold deviation**: Patient monitor alarm thresholds deviating from the clinical governance-approved unit-level defaults. Detected through routine alarm audit or following a clinical incident.
9. **PACS metadata inconsistency**: Patient identifier fields in DICOM headers not matching the originating modality's worklist entry. Detected through radiology workflow cross-checking or surgical safety checklist discrepancy.
10. **Firmware version discrepancy**: A subset of infusion pumps reporting a firmware version that does not match the manufacturer's current release or the clinical engineering asset register.

---

## 6. MITRE ATT&CK Mapping

### Enterprise ATT&CK

| Attack Step | Tactic | Technique | ID |
|-------------|--------|-----------|-----|
| Compromise vendor VPN credentials (supply chain) | Initial Access | Trusted Relationship | T1199 |
| Exploit vulnerable clinical workstation | Initial Access | Exploitation of Public-Facing Application | T1190 |
| Credential harvesting from clinical workstation | Credential Access | OS Credential Dumping | T1003 |
| Clear log entries on workstation | Defence Evasion | Indicator Removal: Clear Windows Event Logs | T1070.001 |

### ATT&CK for ICS (Clinical Device Zone)

| Attack Step | Tactic | Technique | ID |
|-------------|--------|-----------|-----|
| Clinical network device enumeration | Discovery | Remote System Information Discovery | T0888 |
| Modify infusion pump drug library | Impair Process Control | Modify Parameter | T0836 |
| Modify patient monitor alarm thresholds | Impair Process Control | Modify Parameter | T0836 |
| Push backdoored firmware to infusion pumps | Persistence | Module Firmware | T0839 |
| Manipulate PACS DICOM images and metadata | Impair Process Control | Manipulate I/O Image | T0835 |
| Abuse vendor remote access for persistent entry | Lateral Movement | Remote Services | T0886 |
| Modify fleet management audit logs | Evasion | Modify Alarm Settings | T0838 |
