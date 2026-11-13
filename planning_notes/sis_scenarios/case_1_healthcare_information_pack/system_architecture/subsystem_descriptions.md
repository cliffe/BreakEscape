# Subsystem Descriptions — Northgate General Hospital

---

## Electronic Health Records (EHR)

Northgate's EHR platform is the central clinical information repository, holding patient demographics, medical histories, medication records, allergy information, clinical notes, and test results. The system supports electronic prescribing (ePrescribing), enabling clinicians to order medications that are verified by pharmacy and transmitted electronically to the infusion pump fleet management console for bedside administration.

**Patient safety relevance**: The EHR is the authoritative source of truth for clinical decision-making. Drug interaction checking, allergy alerts, and dose range validation all depend on the integrity and availability of EHR data. When the EHR is unavailable, clinicians revert to paper-based processes that lack these automated safety checks — reintroducing error modes (transcription mistakes, missed allergies, drug interactions) that electronic prescribing was specifically designed to eliminate.

**Key security vulnerabilities in the Northgate scenario**: The EHR application server resides in the enterprise IT zone and is therefore within the blast radius of any enterprise-wide ransomware event. Its database files were encrypted during the DarkVault attack, rendering the system completely inaccessible for approximately five days. The disaster recovery copy was hosted off-site by the EHR vendor but required an 18-hour restoration process. During this window, the hospital operated without electronic clinical records.

---

## PACS (Picture Archiving and Communication System)

The PACS manages the storage, retrieval, and distribution of diagnostic medical images. Imaging modalities (CT scanners, MRI machines, X-ray units, ultrasound devices) produce images in DICOM format, which are transmitted to the PACS server for archival and made available to radiologists and clinicians via PACS viewing workstations. The system also integrates with the radiology information system (RIS) for ordering and reporting workflows.

**Patient safety relevance**: Timely access to diagnostic imaging is essential for clinical decision-making in emergency care, surgical planning, and cancer diagnosis. PACS unavailability forces radiologists to read images directly from the scanner console — a slower process that delays diagnosis. More insidiously, if PACS image integrity is compromised (images altered, patient identifiers swapped), clinicians may make treatment decisions based on incorrect diagnostic information.

**Key security vulnerabilities in the Northgate scenario**: PACS uses the DICOM protocol, which was designed without native encryption or message authentication. Images are stored and transmitted in cleartext, and DICOM metadata (including patient identifiers) can be modified without cryptographic detection. The PACS server sits in the clinical zone but is accessed by radiologist workstations in the enterprise zone, making it a cross-zone data flow that depends on the internal firewall's exception rules. The PACS archive has no integrity verification mechanism — files can be modified at rest without generating an alert.

---

## Medical Device Network

### Infusion Pumps (Fleet of 480)

Smart infusion pumps deliver intravenous medications, fluids, and nutrition to patients at precisely controlled rates. The fleet is managed centrally through a fleet management console that distributes drug libraries (containing dose limits and concentration parameters), receives device status and error data, and enables remote firmware updates. Individual pumps connect wirelessly to the clinical VLAN.

**Patient safety relevance**: Infusion pumps are the final link in the medication administration chain. The drug library's dose range checking function is a critical safety barrier — it prevents clinicians from inadvertently programming a dose outside clinically safe limits. If the drug library is corrupted or the fleet management console is unavailable, this safety function is degraded or lost entirely.

**Key security vulnerabilities**: Pumps accept programming commands from any authenticated source on the clinical VLAN without per-device mutual authentication. The firmware update mechanism does not verify cryptographic signatures, meaning a compromised fleet management console could push malicious firmware to the entire fleet. The drug library update process is an administrative function with no pharmacist-in-the-loop verification at the point of distribution.

### Patient Monitors (320 Bedside Units)

Bedside patient monitors continuously measure vital signs — heart rate, blood pressure, SpO2, respiratory rate, and ECG — and alarm when parameters exceed configured thresholds. Monitors are aggregated through ward-level central stations that provide a consolidated view at the nursing station, enabling staff to oversee multiple patients simultaneously.

**Patient safety relevance**: Continuous monitoring and timely alarming are fundamental to the early detection of patient deterioration. The central station is particularly safety-critical on wards with high patient-to-nurse ratios, where individual bedside alarms may not be heard reliably. Loss of the central station degrades ward-level situational awareness.

**Key security vulnerabilities**: Alarm threshold configuration is centrally managed and can be modified from the central station or clinical workstations. There is no cryptographic protection or change-control enforcement on alarm parameter modifications. If an attacker gains access to the central station, they can silently alter alarm thresholds across an entire ward.

### Ventilators (60 Units)

Ventilators provide mechanical respiratory support to critically ill patients, primarily in intensive care and high-dependency units. At Northgate, the ventilator fleet includes a mix of newer networked models and older standalone units.

**Patient safety relevance**: Ventilators are life-sustaining devices. Any loss of function, misconfiguration, or interruption to a ventilator's operation can cause immediate, life-threatening harm. Networked ventilators exchange data with patient monitoring systems and clinical information systems, but their core respiratory function operates independently of network connectivity — a deliberate safety design.

**Key security vulnerabilities**: The networked ventilators transmit patient data and receive configuration updates over the clinical VLAN. While their core life-sustaining function is designed to be network-independent (they fail-safe to the last programmed settings if network connectivity is lost), the data integration interfaces could be exploited to provide misleading information to clinicians about ventilator status or patient respiratory parameters.

---

## Clinical Workstations

Clinical workstations are the primary interface through which nursing, pharmacy, and clinical engineering staff interact with both the EHR and medical device management systems. At Northgate, a subset of these workstations are dual-homed — configured with network interfaces on both the enterprise IT and clinical device VLANs — to provide seamless access to both environments.

**Patient safety relevance**: Clinical workstations are the operational bridge between the information world (EHR, prescriptions) and the physical world (medical devices, drug delivery). Clinicians depend on these machines for prescribing, dose verification, device programming, and monitoring. Their availability and integrity directly affect the reliability of clinical workflows.

**Key security vulnerabilities**: The dual-homed configuration is the most significant vulnerability in the Northgate architecture. These workstations create a direct Layer-3 path between the enterprise and clinical zones, bypassing the internal firewall for any traffic that originates from or is destined to the workstation itself. They are domain-joined enterprise machines, meaning that a domain-wide compromise (such as a malicious GPO) will affect them — and through them, provide access to the clinical device network. They run older operating systems in some cases, to maintain compatibility with medical device management software.

---

## Enterprise IT (Administrative Systems)

The enterprise IT environment comprises Active Directory domain services (authentication, group policy, identity management), email (Microsoft Exchange), finance and HR applications, management reporting, file and print services, and the Trust's backup infrastructure (a network-attached storage appliance and tape library). The SIEM platform, which aggregates logs from enterprise and (partially) clinical systems, also resides here.

**Patient safety relevance**: Enterprise IT systems do not directly deliver patient care, but they are foundational dependencies. Active Directory provides authentication for users across both enterprise and clinical workstations. Email is the primary communication channel for clinicians during normal operations and carries clinical communications (referrals, discharge summaries). The backup infrastructure is the safety net for data recovery following any incident.

**Key security vulnerabilities**: Active Directory is the highest-value target in the enterprise zone — domain admin compromise provides access to every domain-joined system, including the dual-homed clinical workstations. The backup infrastructure at Northgate was network-accessible from the enterprise zone without air-gapping or immutability controls, meaning that a ransomware attack that compromised the enterprise zone could also destroy the backup estate. The SIEM's coverage of the clinical zone was partial — medical device logs were not ingested, creating a monitoring blind spot.
