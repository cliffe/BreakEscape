# The Northgate Incident

A Security-Informed Safety Storyline — Northgate General Hospital

---

## 1. Scenario Overview

In late autumn 2025, Northgate General Hospital — a mid-sized NHS Trust serving a population of approximately 350,000 — suffered a compound cyber attack that began as a financially motivated ransomware intrusion and escalated into a direct threat to patient safety. An organised crime ransomware group gained initial access through a spear-phishing email targeting the hospital's finance department. Over three days the attackers moved laterally through the enterprise IT network, encrypted core administrative systems, and — critically — crossed an incompletely segmented network boundary into the clinical device zone. The result was not merely operational disruption: infusion pump management consoles became unreachable, patient monitoring dashboards displayed stale data without alerting clinicians, and the Picture Archiving and Communication System (PACS) serving the radiology department went offline during a night shift. Two patients suffered medication dosing errors before clinical staff recognised the extent of the compromise. The incident forced a Major Incident declaration, partial diversion of emergency admissions to neighbouring trusts, and a two-week recovery programme.

---

## 2. Setting

### Northgate General Hospital

Northgate General Hospital sits on the outskirts of the fictional city of Northgate in the English Midlands. The main site comprises a twelve-storey tower block built in the 1970s housing inpatient wards and theatres, a 1990s diagnostic wing with CT, MRI, and X-ray suites, and a recently completed ambulatory care building with its own Wi-Fi infrastructure. The Trust employs approximately 6,500 staff across clinical, administrative, and estates functions.

### ICT Environment

The hospital operates a modern but heterogeneous ICT estate. Core enterprise systems — email, Active Directory, finance, HR, and the Electronic Health Record (EHR) platform — run on a virtualised server farm in an on-site data centre, with disaster recovery replication to a co-located NHS shared-services site. Clinical imaging flows through a PACS integrated with the radiology information system. Approximately 1,200 networked medical devices are in active use across wards and theatres, including smart infusion pumps (fleet of 480), bedside patient monitors (320), and ventilators (60).

### Network Segmentation

A network modernisation programme began eighteen months before the incident. The programme introduced a dedicated clinical VLAN intended to isolate medical devices from the enterprise network. However, at the time of the attack the project was only seventy percent complete: the diagnostic wing and two of five inpatient floors had been migrated to the new VLAN, but the remaining wards still shared flat Layer-2 segments with enterprise workstations. A next-generation firewall separated the clinical VLAN from the enterprise zone, but legacy "exception" rules permitted certain clinical workstations bidirectional access to both zones — a pragmatic decision taken to maintain workflow continuity for clinicians who needed simultaneous access to the EHR and device management interfaces.

### Organisational Context

The IT department is led by Chief Information Officer **Helen Carver**, who reports to the Trust Board. Clinical Engineering, responsible for medical device procurement, commissioning, and maintenance, sits under the Estates Directorate and is managed by **David Osei**. The two teams share no formal governance structure for cyber security of medical devices — a gap identified in an internal audit six months prior but not yet addressed. The Trust's Information Security Manager, **Ravi Anand**, holds a small team of two analysts and reports into the CIO's office. A Caldicott Guardian, **Dr Fiona Hartley** (a consultant anaesthetist), oversees information governance with a focus on patient confidentiality.

---

## 3. Threat Actors

### Primary: "DarkVault" — Organised Crime Ransomware Group

DarkVault is a financially motivated ransomware-as-a-service (RaaS) operation. The group operates a double-extortion model: encrypting victim data while simultaneously exfiltrating sensitive records to a leak site for additional leverage. DarkVault affiliates have historically targeted healthcare organisations because of the sector's low tolerance for downtime and perceived willingness to pay. The group is believed to operate from Eastern Europe with loose affiliate networks worldwide. Their tooling includes custom loaders, commodity remote access trojans (RATs), and a proprietary ransomware encryptor that targets both Windows and Linux file systems. DarkVault does not intentionally target clinical devices or patient safety systems, but their lateral movement techniques are indiscriminate — any reachable host is a target for encryption.

### Secondary: "PharmaLeaks" — Hacktivist Collective

PharmaLeaks is a loosely organised hacktivist group that campaigns against pharmaceutical pricing and NHS privatisation. They have previously defaced Trust websites and leaked procurement documents. In the months prior to the incident, PharmaLeaks conducted open-source intelligence gathering on Northgate's IT estate and published a blog post alleging that the Trust's network segmentation project was behind schedule. While PharmaLeaks did not directly participate in the ransomware attack, their public disclosures may have informed DarkVault's targeting decision. PharmaLeaks represents a lower-capability but persistent threat, operating primarily through social engineering and exploitation of publicly exposed services.

### Tertiary: Insider — Disgruntled IT Contractor

**Craig Ellison** is a contract network engineer brought in to support the segmentation project. Frustrated by repeated scope changes and a contract dispute, Ellison has been careless with credentials — using the same administrative password across multiple systems and sharing VPN credentials with a colleague at a previous employer. Ellison is not a malicious insider in the traditional sense, but his poor security hygiene directly contributed to the attack surface that DarkVault exploited. His shared VPN credentials were harvested from a credential dump on a dark web forum, providing the attackers with an authenticated entry point.

---

## 4. Incident Timeline

### Day 0 (Monday) — Initial Access

At 08:47 on a Monday morning, a finance officer in Northgate's Accounts Payable team, **Sarah Kelworth**, receives an email that appears to originate from a known medical supplies vendor. The email contains a PDF invoice with an embedded link to a document-signing portal. Kelworth clicks the link, which redirects through a legitimate cloud service to a page hosting a malicious Office document. She downloads and opens the document, enabling macros when prompted — the file displays a convincing but fabricated purchase order.

The macro executes a PowerShell downloader that retrieves a first-stage payload from a DarkVault command-and-control (C2) server. The payload — a fileless loader injected into a legitimate Windows process — establishes persistence via a scheduled task disguised as a software update check. The initial compromise goes undetected; the endpoint detection and response (EDR) agent on Kelworth's workstation flags the PowerShell execution as "suspicious" but the alert is classified as low-severity and queued for review.

Simultaneously, on the same morning, DarkVault affiliates authenticate to the Trust's SSL VPN gateway using credentials belonging to contractor Craig Ellison, harvested three weeks earlier from a credential dump. The VPN session originates from a residential IP address in Romania. The VPN logs record the connection, but no anomaly detection rule triggers — the VPN does not enforce multi-factor authentication for contractor accounts, and geographic restrictions were removed six months earlier to accommodate remote working.

### Day 0 (Monday afternoon) — Reconnaissance and Credential Harvesting

By early afternoon the attackers have two footholds: Kelworth's workstation on the enterprise network and an authenticated VPN session with network-level access. Using the VPN session, they deploy a network scanning tool and identify Active Directory domain controllers, file servers, the EHR application server, and — crucially — several clinical workstations that bridge the enterprise and clinical VLANs through the legacy firewall exception rules.

On Kelworth's workstation, the attacker executes an in-memory credential harvesting tool, extracting cached domain credentials including those of a domain administrator who had recently logged in to troubleshoot a printer issue. With domain admin credentials in hand, the attacker begins querying Active Directory for service accounts, group memberships, and network share mappings.

### Day 1 (Tuesday) — Lateral Movement and Staging

Overnight, DarkVault deploys additional tooling across the enterprise network. They establish persistence on two domain controllers using a malicious Group Policy Object (GPO) that pushes a backdoor to all domain-joined workstations during the next policy refresh cycle. They identify the on-site backup infrastructure — a network-attached storage appliance and a tape library controller — and begin encrypting backup catalogues.

During Tuesday morning, the attackers discover the dual-homed clinical workstations — machines with network interfaces on both the enterprise VLAN and the clinical device VLAN. These workstations run the infusion pump fleet management application and the patient monitor central station software. The attackers use a compromised domain admin account to access one of these workstations remotely. They are now inside the clinical zone.

The Security Information and Event Management (SIEM) system generates several alerts related to unusual SMB traffic volumes and failed authentication attempts against the backup infrastructure. Ravi Anand's team reviews the alerts mid-morning but attributes the SMB anomalies to the ongoing network migration project. The failed backup authentications are logged as a support ticket for the infrastructure team.

### Day 1 (Tuesday evening) — Ransomware Deployment on Enterprise Systems

At 22:15, outside normal working hours, DarkVault triggers its ransomware payload across the enterprise zone. The attack propagates via the malicious GPO and direct SMB connections. Within forty minutes, three hundred and twelve enterprise workstations, four file servers, and the email server are encrypted. The EHR application server's database files are encrypted, rendering the clinical record system inaccessible. The on-site backup NAS is encrypted; the tape library controller is wiped.

The ransom note demands £1.2 million in cryptocurrency within seventy-two hours, with a threat to publish exfiltrated patient records on DarkVault's leak site. The Trust's on-call IT manager receives automated monitoring alerts at 22:38 and escalates to the CIO.

### Day 2 (Wednesday) — Clinical Impact Emerges

By 06:00, the full scale of the enterprise compromise is apparent. Helen Carver declares a Major Incident and convenes the Trust's emergency response team. The immediate focus is on restoring the EHR system, which clinicians rely on for medication prescribing, allergy checking, and clinical notes.

However, the clinical device zone has also been affected. The dual-homed workstations used for infusion pump fleet management are encrypted, meaning that clinicians cannot access the central dosing management console. The pumps themselves continue operating on their last programmed settings, but any new prescriptions or dose adjustments must be entered manually at the bedside — a labour-intensive process that introduces the risk of transcription error. More critically, the patient monitoring central station on Ward 7 (one of the floors still on the legacy flat network) has been encrypted. Bedside monitors continue to function independently, but the central station — which aggregates alarms and provides the nursing station with a consolidated view of all patients — is offline. Alarms are only audible at the individual bedside, and with reduced staffing levels on the night shift, two critical alarms are missed over a ninety-minute window.

**Patient Safety Event 1**: A 72-year-old patient recovering from cardiac surgery experiences a sustained arrhythmia. The bedside monitor alarms, but the alarm is not heard at the nursing station because the central station is down. The arrhythmia is detected seventeen minutes later when a nurse conducts a routine bedside check. The patient requires emergency intervention.

**Patient Safety Event 2**: An infusion pump delivering post-operative analgesia to a patient on Ward 5 reaches the end of its programmed volume. Under normal conditions, a dose adjustment would be entered via the fleet management console following the electronic prescription. With the console unavailable, the ward pharmacist hand-writes a new prescription, but a transcription error results in a ten-fold dosing discrepancy. The error is caught by a second nurse during bedside verification, but only after the incorrect dose has been partially administered. The patient experiences respiratory depression requiring naloxone administration.

### Day 2 (Wednesday afternoon) — Crisis Response and Difficult Decisions

The Trust's emergency response team faces a critical decision: **should the remaining network links between the enterprise and clinical zones be severed immediately?**

Severing the connection would protect clinical devices from further compromise — but it would also disconnect the EHR from those clinical workstations that bridged both networks, eliminating clinicians' last remaining electronic access to patient records and prescriptions in the affected wards. It would also prevent the infusion pump fleet management system from receiving any commands, forcing all pump programming to manual bedside operation for potentially several days.

David Osei, the Clinical Engineering Manager, argues for immediate disconnection, citing the patient safety events. Ravi Anand supports this position. Dr Fiona Hartley, the Caldicott Guardian, raises concerns about the loss of clinical information access — without the EHR, there is no reliable way to verify patient allergies or current medications, creating a different category of safety risk. Helen Carver must balance both positions under intense time pressure.

The decision is made to sever the connection at 14:30 on Wednesday, with a compensating control: paper-based medication charts are retrieved from archive storage and distributed to all wards, and additional pharmacy staff are redeployed to provide manual medication verification.

### Days 3–7 — Recovery

NCSC (National Cyber Security Centre) incident responders arrive on Wednesday evening. A parallel forensic investigation and recovery operation begins. Clean builds of domain controllers are deployed from offline media. The EHR vendor provides a recovery image from their hosted backup (the on-site backups being compromised). The clinical device network is rebuilt as a fully isolated zone — the segmentation project, previously seventy percent complete, is accelerated to one hundred percent as a condition of reconnection. Infusion pump firmware is verified against manufacturer checksums before devices are returned to service.

Full enterprise IT services are restored by Day 7. The clinical device network is reconnected through the new, properly segmented architecture on Day 10. The Trust does not pay the ransom.

### Days 8–14 — Post-Incident Review

An external review identifies the following root causes:
1. Lack of multi-factor authentication on the VPN gateway
2. Incomplete network segmentation leaving dual-homed workstations as crossing points
3. Inadequate monitoring — SIEM alerts were dismissed as migration-related noise
4. Compromised backup infrastructure — no immutable or air-gapped backup copy existed
5. No formal governance structure linking IT security and clinical engineering

---

## 5. Learner Decision Points

The following moments in the Northgate Incident present meaningful choices for learners acting as incident responders or safety engineers:

1. **Alert Triage (Day 1, Tuesday morning)**: The SIEM flags unusual SMB traffic. Do you escalate immediately and begin containment, or attribute it to the known migration project and continue monitoring? *Trade-off*: aggressive containment may disrupt the migration and create clinical downtime; delayed response allows the attacker more time.

2. **Network Isolation Decision (Day 2, Wednesday afternoon)**: Do you sever the enterprise-to-clinical network link immediately? *Trade-off*: isolation protects medical devices from further compromise but removes clinicians' electronic access to patient records, introducing a different safety risk (medication errors from loss of allergy/drug interaction checking).

3. **Backup Integrity Assessment (Day 2)**: On-site backups are encrypted. Do you attempt to restore from the potentially compromised tape library, or wait for the EHR vendor's hosted recovery image (estimated 18-hour delay)? *Trade-off*: faster restoration may reintroduce malware; waiting extends the period of manual clinical operations.

4. **Infusion Pump Verification (Day 3)**: Clinical Engineering must decide whether to continue using infusion pumps that were on the compromised network segment, or take them out of service for firmware verification. *Trade-off*: removing pumps from service creates immediate clinical risk (fewer pumps available); leaving them in service carries integrity risk (firmware may have been tampered with, however unlikely).

5. **Ransom Payment Deliberation (Day 2-3)**: The Trust Board must decide whether to pay the £1.2M ransom. *Trade-off*: payment might accelerate data recovery but funds criminal activity, provides no guarantee of decryption, and may violate NHS policy and UK counter-terrorism guidance.

6. **Disclosure Timing (Day 2 onwards)**: When and how should the Trust disclose the incident to patients, the ICO, NHS England, and the media? *Trade-off*: early disclosure supports transparency and regulatory compliance but may cause panic; delayed disclosure allows time for clearer messaging but risks regulatory sanction and loss of public trust.
