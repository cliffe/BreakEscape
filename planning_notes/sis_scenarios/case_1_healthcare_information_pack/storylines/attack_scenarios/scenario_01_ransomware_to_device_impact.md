# Scenario 01: Ransomware Propagation Leading to Clinical Device Availability Loss

Healthcare Attack Scenario — Northgate General Hospital

---

## 1. Scenario Summary

A financially motivated ransomware group gains initial access to Northgate General Hospital's enterprise IT network through a spear-phishing email and a compromised VPN credential. Over forty-eight hours the attackers conduct reconnaissance, harvest domain administrator credentials, compromise backup infrastructure, and deploy ransomware across the enterprise zone. Due to incomplete network segmentation, the encryption payload propagates to dual-homed clinical workstations that bridge the enterprise and clinical device networks. The resulting loss of the infusion pump fleet management console, patient monitoring central stations, and PACS availability directly impairs clinical care processes and creates emergent patient safety hazards — including missed cardiac alarms and a medication dosing error.

---

## 2. System Prerequisites

The following configuration and environmental conditions make this attack possible:

- **Incomplete network segmentation**: The clinical device VLAN migration is only 70% complete. Three inpatient wards remain on a flat Layer-2 segment shared with enterprise workstations.
- **Dual-homed clinical workstations**: Several workstations have interfaces on both the enterprise and clinical VLANs, permitted by legacy firewall exception rules to maintain clinician workflow.
- **No MFA on VPN**: The SSL VPN gateway accepts username/password authentication without a second factor for contractor accounts.
- **Shared/reused contractor credentials**: A network contractor's VPN credentials are identical to those used at a previous employer, and have appeared in a dark web credential dump.
- **Flat backup architecture**: On-site backups (NAS and tape library) are network-accessible from the enterprise zone without air-gapping or immutability controls.
- **EDR alert fatigue**: The endpoint detection and response system generates high volumes of low-severity alerts, many attributable to the ongoing migration project, resulting in slow triage.
- **No integrated IT/Clinical Engineering governance**: No formal process exists for coordinating cyber security incident response with clinical device safety management.

---

## 3. Step-by-Step Attack Chain

| Step | Action Taken | System/Asset Affected | Detection Opportunity |
|------|-------------|----------------------|----------------------|
| **1. Spear-phishing delivery** | Attacker sends a targeted email impersonating a medical supplies vendor, containing a link to a malicious document-signing portal. | Finance workstation (Sarah Kelworth's PC) | Email gateway: URL reputation check could flag the redirect chain. SPF/DKIM/DMARC validation of sender domain. |
| **2. Macro execution and initial payload** | Victim opens Word document and enables macros. A PowerShell downloader retrieves a fileless first-stage loader from a DarkVault C2 server, injected into a legitimate process. Persistence established via a disguised scheduled task. | Finance workstation — process memory, Task Scheduler | EDR: PowerShell execution with encoded commands flagged as suspicious (alert generated but classified low-severity). AMSI logging of script content. |
| **3. VPN credential abuse** | Attacker authenticates to the Trust's SSL VPN using contractor credentials (Craig Ellison) harvested from a dark web credential dump. Session originates from a Romanian residential IP. | SSL VPN gateway | VPN logs: login from unusual geographic location. Impossible travel detection (if credential monitoring is in place). Absence of MFA is the enabling gap. |
| **4. Internal reconnaissance** | From the VPN session, attacker deploys a network scanning tool. Maps Active Directory structure, identifies domain controllers, file servers, EHR application server, PACS, and dual-homed clinical workstations. | Enterprise network — Active Directory, network infrastructure | SIEM: port scanning activity, LDAP enumeration queries. IDS: signatures for common scanning tools (e.g., Nmap SYN scan patterns). |
| **5. Credential harvesting** | On the compromised finance workstation, attacker executes an in-memory credential dumping tool. Extracts cached domain admin credentials from a recent troubleshooting session. | Finance workstation — LSASS process memory | EDR: access to LSASS process. Windows Event Log 4624/4672: privileged logon events. Credential Guard (if enabled) would prevent extraction. |
| **6. Lateral movement and domain persistence** | Using domain admin credentials, attacker deploys a backdoor via a malicious Group Policy Object (GPO) pushed to all domain-joined workstations on next policy refresh. Establishes persistence on two domain controllers. | Domain controllers, all domain-joined workstations | SIEM: new GPO creation event. Windows Event Log: GPO modification (Event ID 5136). Change control: unscheduled GPO deployment. |
| **7. Backup infrastructure compromise** | Attacker identifies the NAS appliance and tape library controller on the backup network. Encrypts backup catalogues on the NAS; wipes the tape library controller's index. | Backup NAS, tape library controller | Failed authentication alerts on backup systems (generated but misattributed). Network monitoring: unusual write volumes to backup storage. |
| **8. Reconnaissance of clinical zone** | Attacker discovers dual-homed clinical workstations (interfaces on both enterprise and clinical VLANs). Accesses one workstation remotely using the compromised domain admin account. The attacker is now inside the clinical device network. | Dual-homed clinical workstations, clinical VLAN | Firewall logs: cross-zone traffic from enterprise to clinical VLAN via exception rules. Network flow analysis: new RDP/SMB sessions to clinical workstation IPs. |
| **9. Enterprise ransomware deployment** | At 22:15 (outside working hours), attacker triggers ransomware across the enterprise zone via GPO propagation and direct SMB connections. 312 workstations, 4 file servers, and the email server encrypted within 40 minutes. EHR application server database encrypted. | Enterprise workstations, file servers, email server, EHR server | EDR: mass file encryption events, known ransomware file extensions. SIEM: volume of SMB write operations. SOC (if 24/7): cascade of endpoint alerts. On-call monitoring: automated service-down alerts at 22:38. |
| **10. Clinical workstation encryption** | Ransomware propagates to dual-homed clinical workstations via the same GPO/SMB mechanism. The infusion pump fleet management console and the Ward 7 patient monitoring central station are encrypted. | Infusion pump management console, patient monitoring central station, PACS workstations | Clinical staff: management console becomes unresponsive. Central station displays ransom note instead of patient data. Medical device alerts: loss of connectivity to management server. |
| **11. Loss of clinical monitoring capability** | Patient monitoring central station on Ward 7 goes offline. Bedside monitors continue functioning independently, but aggregated alarming at the nursing station is lost. During the night shift, two critical alarms are missed over a 90-minute window. | Ward 7 patient monitoring system (central station) | **No technical detection** — this is a safety consequence, not a technical event. Detection relies on clinical staff recognising the absence of central alarming. Clinical escalation protocols (if exercised). |
| **12. Medication dosing error** | With the infusion pump fleet management console unavailable, a dose adjustment for a post-operative patient must be manually transcribed from a paper prescription. A ten-fold transcription error occurs. The error is partially administered before being caught by a second nurse during bedside verification. | Infusion pump (Ward 5), prescribing workflow | Bedside double-check protocol (partial detection — caught the error late). Barcode medication administration (unavailable — depends on EHR which is down). |
| **13. Network isolation decision** | Trust emergency response team decides to sever the remaining enterprise-to-clinical network links at 14:30 Wednesday. All electronic clinical record access in affected wards is lost. Paper-based fallback procedures initiated. | Enterprise/clinical network boundary, all cross-zone data flows | N/A — this is a response action, not an attack step. |

---

## 4. Safety Consequence

The functional safety failures in this scenario are emergent — they arise not from direct attacker intent to harm patients, but from the indiscriminate propagation of ransomware into a clinical environment with incomplete segmentation.

### Loss of Centralised Patient Monitoring

The patient monitoring central station aggregates alarm data from all bedside monitors on a ward and presents it at the nursing station. When the central station is encrypted, individual bedside monitors continue to function and alarm locally, but the nursing station loses its consolidated view. In a ward with twenty beds and two nightshift nurses, the probability of a critical alarm being heard and responded to in a timely manner drops significantly. In this scenario, a post-cardiac-surgery patient's sustained arrhythmia alarm went undetected for seventeen minutes — exceeding the clinical response window for safe intervention.

### Loss of Electronic Prescribing and Dose Management

The infusion pump fleet management console provides a critical safety function: it enables pharmacists and nurses to programme infusion pumps electronically, with built-in dose range checking, drug interaction alerts, and dose limit guardrails. When this console is lost, dose adjustments must be entered manually at the bedside from paper prescriptions. This reintroduces transcription error as a hazard — a risk that the electronic prescribing system was specifically designed to mitigate. The ten-fold dosing error in this scenario is a well-documented failure mode in paper-based prescribing.

### PACS Unavailability

The loss of PACS access prevents radiologists from viewing diagnostic images electronically. During the overnight period, a trauma patient's CT scan results are delayed by four hours because the images must be read from the scanner console rather than the radiologist's remote workstation. While no direct harm results, the diagnostic delay represents a degradation of the standard of care.

### Compounding Effect

Critically, the safety consequences are compounded by the loss of the EHR system. Clinicians cannot electronically verify patient allergies, current medications, or clinical history. The combination of monitoring loss, prescribing system loss, and clinical record loss creates a multi-layered degradation of safety defences — a scenario in which individual compensating controls (paper charts, bedside checks) may be individually adequate but are collectively fragile under the stress of a Major Incident.

---

## 5. Indicators of Compromise

### Network-Level IoCs

1. **Unusual VPN session**: Authentication from a Romanian residential IP address to the Trust's SSL VPN gateway, using contractor credentials, outside normal working hours.
2. **Internal port scanning**: Sequential SYN packets across large IP ranges from a single internal host (the compromised finance workstation), consistent with automated network discovery.
3. **High-volume SMB writes**: Anomalous volume of SMB write operations originating from domain controllers and propagating across the enterprise zone during the encryption phase (22:15–23:00).
4. **Cross-zone traffic anomaly**: New RDP and SMB sessions traversing the enterprise-to-clinical firewall exception rules from previously unseen source IPs.

### Host-Level IoCs

5. **PowerShell encoded command execution**: Execution of `powershell.exe` with `-EncodedCommand` parameter on the finance workstation, spawned from `WINWORD.EXE`.
6. **LSASS memory access**: Process access events targeting `lsass.exe` from a non-system process, consistent with credential harvesting.
7. **Rogue scheduled task**: A new scheduled task named to mimic a legitimate software updater, executing a payload from `%APPDATA%\Local\Temp\`.
8. **Malicious GPO creation**: A new Group Policy Object created outside change control windows, distributing an executable to all domain-joined workstations.

### Behavioural IoCs

9. **Backup system anomaly**: Bulk write operations to the backup NAS during non-backup windows, followed by the tape library controller becoming unresponsive.
10. **Mass file extension change**: Hundreds of files across multiple systems simultaneously renamed with an unusual extension (e.g., `.dvault`), accompanied by the creation of ransom note files (`README_RESTORE.txt`) in every directory.

---

## 6. MITRE ATT&CK Mapping

### Enterprise ATT&CK

| Attack Step | Tactic | Technique | ID |
|-------------|--------|-----------|-----|
| Spear-phishing email with malicious link | Initial Access | Phishing: Spearphishing Link | T1566.002 |
| VPN credential abuse | Initial Access | Valid Accounts: Domain Accounts | T1078.002 |
| Macro executes PowerShell downloader | Execution | Command and Scripting Interpreter: PowerShell | T1059.001 |
| Fileless loader injected into legitimate process | Defence Evasion | Process Injection | T1055 |
| Scheduled task persistence | Persistence | Scheduled Task/Job: Scheduled Task | T1053.005 |
| In-memory credential dumping (LSASS) | Credential Access | OS Credential Dumping: LSASS Memory | T1003.001 |
| Malicious GPO for lateral deployment | Lateral Movement | Group Policy Modification | T1484.001 |
| Network scanning and AD enumeration | Discovery | Network Service Discovery / Remote System Discovery | T1046 / T1018 |
| Backup encryption and destruction | Impact | Data Encrypted for Impact / Inhibit System Recovery | T1486 / T1490 |
| Enterprise-wide ransomware deployment | Impact | Data Encrypted for Impact | T1486 |

### ATT&CK for ICS (Clinical Device Zone)

| Attack Step | Tactic | Technique | ID |
|-------------|--------|-----------|-----|
| Pivot to dual-homed clinical workstation via enterprise credentials | Lateral Movement | Remote Services | T0886 |
| Encryption of infusion pump fleet management console | Inhibit Response Function | Denial of Service | T0814 |
| Encryption of patient monitoring central station | Impair Process Control | Denial of View | T0815 |
| Loss of PACS availability | Inhibit Response Function | Data Destruction | T0809 |
