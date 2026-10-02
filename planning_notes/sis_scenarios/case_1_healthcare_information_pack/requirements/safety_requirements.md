# Functional Safety Requirements — Northgate General Hospital

Derived from the scenario hazard analysis. These requirements define the safety behaviours that clinical systems must maintain regardless of the state of the cyber environment.

---

## Medical Device Safety

**REQ-HC-SAF-001: Infusion Pump Dose Integrity**
Description: Infusion pump dosing controls shall maintain prescribed parameters within clinically safe ranges under all network conditions, including network isolation, management console unavailability, and drug library update failure.
Rationale: When the fleet management console was encrypted (Scenario 01) or the drug library was corrupted (Scenario 02), the safety barrier of dose range checking was either lost or subverted. The pump must enforce safe dose limits independently of network-dependent systems.

**REQ-HC-SAF-002: Infusion Pump Fail-Safe on Drug Library Corruption**
Description: If the infusion pump detects that its drug library has been modified outside the authorised update process or fails an integrity check, it shall revert to the last known-good drug library version and alert the operator.
Rationale: The integrity attack in Scenario 02 succeeded because the pump accepted a corrupted drug library without verification. A fail-safe mechanism prevents silently degraded dose checking.

**REQ-HC-SAF-003: Patient Monitor Alarm Functionality Under Network Loss**
Description: Bedside patient monitors shall maintain independent local alarming at the bedside, including audible and visual alarms, when the ward central station is unavailable or when network connectivity to the central station is lost.
Rationale: When the central station was encrypted, alarming depended entirely on bedside audibility. This requirement ensures that the bedside alarm is always the primary safety mechanism, with central station aggregation as an additional layer.

**REQ-HC-SAF-004: Alarm Threshold Integrity**
Description: Patient monitor alarm thresholds shall be protected against unauthorised modification. Changes to alarm thresholds shall require authenticated clinician authorisation and shall be logged with the identity of the authorising clinician.
Rationale: In Scenario 02, alarm thresholds were silently modified via the central station without authentication. Clinician-authorised change control prevents remote manipulation of alarm parameters.

**REQ-HC-SAF-005: Ventilator Autonomous Operation**
Description: Ventilators shall maintain their core life-sustaining respiratory function independently of network connectivity. Loss of network connection shall not alter ventilator operating parameters, trigger a restart, or cause the device to enter a non-operational state.
Rationale: Ventilators are life-sustaining devices. Network-dependent failure modes are unacceptable — the device must operate autonomously in all network conditions.

---

## Clinical Information Safety

**REQ-HC-SAF-006: Clinical Data Integrity for Prescribing**
Description: Medication prescribing systems shall verify the integrity of patient allergy records, drug interaction databases, and dose range data before presenting clinical decision support recommendations to prescribers.
Rationale: If the EHR database is corrupted or restored from a potentially compromised backup, prescribing decisions based on unreliable data could cause harm. Integrity verification ensures that safety-critical clinical data is trustworthy.

**REQ-HC-SAF-007: PACS Image-Patient Identity Binding**
Description: The PACS shall maintain a verifiable binding between diagnostic images and patient identifiers that cannot be modified without generating an audit alert and requiring authorised clinical confirmation.
Rationale: In Scenario 02, PACS metadata was manipulated to swap patient identifiers on diagnostic images, creating a wrong-patient error pathway. Integrity-protected identity binding prevents this attack.

**REQ-HC-SAF-008: Clinical Fallback Availability**
Description: Paper-based clinical fallback resources (medication charts, observation recording sheets, prescribing reference guides, emergency drug dosing tables) shall be maintained in each clinical area and shall be accessible without dependence on any electronic system.
Rationale: When the EHR and device management systems were unavailable, clinicians improvised paper-based workarounds. Pre-positioned, up-to-date fallback resources reduce error in the transition to manual processes.

---

## System-Level Safety

**REQ-HC-SAF-009: Network Isolation Without Harm**
Description: It shall be possible to fully isolate the clinical device network from the enterprise IT network without causing any medical device to enter an unsafe state, lose its current operating parameters, or fail to alarm on monitored patient parameters.
Rationale: The decision to sever the enterprise-clinical network link was complicated by uncertainty about the impact on medical devices. This requirement ensures that the isolation action itself does not create a patient safety hazard.

**REQ-HC-SAF-010: Graceful Degradation of Clinical Systems**
Description: When enterprise systems (EHR, PACS, email) become unavailable, clinical workflows shall degrade gracefully to documented manual procedures within defined time limits, with handover checklists and staff notification protocols.
Rationale: The transition from electronic to paper-based clinical processes during the Northgate incident was uncoordinated, leading to information gaps and increased error risk.

**REQ-HC-SAF-011: Medical Device Firmware Integrity**
Description: Medical devices shall verify the cryptographic integrity of firmware images before installation. Devices shall reject any firmware that does not carry a valid signature from the authorised manufacturer.
Rationale: In Scenario 02, backdoored firmware was pushed to infusion pumps because the update mechanism did not verify signatures. Firmware integrity verification is a foundational safety requirement for networked devices.

**REQ-HC-SAF-012: Safety-Critical System Recovery Priority**
Description: The Trust's disaster recovery plan shall define a recovery prioritisation order that places safety-critical clinical systems (patient monitoring, infusion pump management, ventilator connectivity) ahead of administrative systems.
Rationale: During the Northgate recovery, effort was initially focused on restoring the EHR and email — high-visibility systems — rather than the less visible but more safety-critical monitoring and device management infrastructure.

**REQ-HC-SAF-013: Post-Incident Device Integrity Verification**
Description: Following any cyber incident that may have affected the clinical device network, all networked medical devices shall undergo firmware and configuration verification against manufacturer baselines before being returned to clinical use.
Rationale: After the Northgate ransomware event, uncertainty persisted about whether infusion pump firmware had been tampered with. Systematic post-incident verification provides assurance that devices are safe to use.

**REQ-HC-SAF-014: Dual Authorisation for Safety-Critical Overrides**
Description: Any action that overrides a safety control on a medical device (e.g., bypassing a dose limit, disabling an alarm, modifying a safety interlock) shall require dual authorisation from two independently authenticated clinicians.
Rationale: Safety overrides are sometimes clinically necessary, but they reduce the margin of safety. Dual authorisation ensures that safety barriers are not reduced by a single compromised account or a single clinician error.
