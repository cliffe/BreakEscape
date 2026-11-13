# Scenario 02: Insider/Compromised Contractor — Direct ICS Manipulation Leading to Battery Safety Failure

Energy Attack Scenario — Albion Energy Storage Ltd

---

## 1. Scenario Summary

A compromised contractor with legitimate physical and network access to the Albion Energy Storage facility installs a software backdoor on an engineering workstation during a routine maintenance visit. An external attacker subsequently exploits the backdoor to gain direct access to the SCADA environment, bypasses the Battery Management System's safety logic by injecting modified PLC code, and falsifies battery cell temperature and state-of-charge sensor readings. The manipulated readings mask an unsafe charging condition, creating a thermal runaway risk in the lithium-ion battery racks. This scenario assumes enterprise IT access is already established and focuses on the OT exploitation and safety consequence phases.

---

## 2. System Prerequisites

- **Contractor with privileged OT access**: A third-party control systems engineer is granted access to the engineering workstation (HMI-ENG-02) and PLC programming tools as part of a scheduled maintenance contract. Access is time-limited but not technically revoked between visits — the contractor's domain account and PLC programming credentials remain active.
- **Insufficient session monitoring on engineering workstations**: Engineering workstation usage is not continuously monitored. No session recording, no behavioural analytics, and no alerting on out-of-hours activity.
- **PLC programming capability from engineering workstation**: The engineering workstation can download new logic programmes to PLC-BMS using the vendor's programming environment. No code-signing or dual-authorisation is required for PLC programme changes.
- **SIS reachable from SCADA network**: The Safety Instrumented System's engineering port is accessible from the same network segment as the engineering workstation, with no additional access control.
- **No independent safety sensor validation**: The control system trusts PLC register values without cross-referencing against independent physical instrumentation.

---

## 3. Step-by-Step Attack Chain

This scenario begins at the equivalent of Phase 3 in the primary storyline — IT-level access and a foothold on the OT network are assumed to be already established through the compromised contractor.

| Step | Action | System/Asset Affected | Protocol/Technique | Detection Opportunity |
|------|--------|----------------------|--------------------|-----------------------|
| **1. Backdoor installation during maintenance visit** | During a legitimate scheduled maintenance visit, the compromised contractor installs a remote access tool on engineering workstation HMI-ENG-02, disguised as a PLC diagnostics utility in the vendor software directory. The tool provides reverse-shell access over an encrypted channel using a non-standard port. | Engineering workstation HMI-ENG-02 | Encrypted reverse shell (TCP, non-standard port) | Host monitoring: new executable in vendor software directory. Application whitelisting: unsigned binary execution. Change control: software installation outside approved change window. **MITRE ATT&CK for ICS: T0862 — Supply Chain Compromise (via trusted contractor)** |
| **2. External attacker activates backdoor** | Days after the contractor's visit, an external attacker activates the backdoor remotely via the reverse shell. The connection routes through the enterprise network and the jump server's permissive NAT configuration. The attacker now has an interactive session on HMI-ENG-02 with the contractor's cached credentials. | Engineering workstation HMI-ENG-02; jump server | Reverse shell; RDP (NAT traversal) | Jump server logs: unexpected outbound connection from OT zone. Network monitoring: encrypted traffic on non-standard port from engineering workstation. **MITRE ATT&CK for ICS: T0886 — Remote Services** |
| **3. PLC reconnaissance** | The attacker uses the PLC vendor's programming environment (already installed on the engineering workstation) to connect to PLC-BMS and read the current programme logic, register map, and configuration. They identify the charge control logic, safety threshold registers, and sensor input mappings. | PLC-BMS; PLC programming environment | Proprietary PLC programming protocol (vendor-specific) | ICS anomaly detection: PLC programme upload/read operation outside scheduled maintenance window. Audit logging: PLC programming tool access log. **MITRE ATT&CK for ICS: T0842 — Network Sniffing (OT recon)** |
| **4. Control logic modification** | The attacker modifies the PLC-BMS programme to include a hidden routine: when a specific coil register is set to a trigger value, the modified logic overrides the charge cutoff threshold (raising it from 90% SoC to 100%) and disables the over-temperature alarm relay output. The modified programme is downloaded to PLC-BMS. | PLC-BMS (programme logic) | PLC programme download (proprietary protocol) | ICS anomaly detection: PLC programme download event. Configuration management: PLC logic hash comparison against certified baseline. Dual-authorisation: PLC changes require approval from two engineers. **MITRE ATT&CK for ICS: T0843 — Program Download** |
| **5. Sensor reading falsification** | The attacker writes falsified values to the PLC-BMS holding registers that report cell temperature and state-of-charge to the SCADA server and HMI. Cell temperatures are reported as 26°C (actual values vary between 33°C and 38°C). State-of-charge reported as 68% (actual: 92%). | PLC-BMS holding registers; SCADA server; HMI displays | Modbus/TCP (register write) | ICS anomaly detection: register values inconsistent with process model. Cross-validation: comparison with independent instrumentation. Trend analysis: sudden flattening of normally variable readings. **MITRE ATT&CK for ICS: T0836 — Modify Parameter** |
| **6. Trigger hidden charge routine** | The attacker sets the trigger coil register, activating the hidden PLC routine. The charge cutoff threshold is raised to 100% SoC and the over-temperature alarm relay is disabled. The PLC now permits charging to continue regardless of actual cell state. | PLC-BMS (control logic — hidden routine activated) | Modbus/TCP (coil write) | ICS anomaly detection: unusual coil state change. PLC logic comparison: runtime logic differs from last known-good version. **MITRE ATT&CK for ICS: T0855 — Unauthorized Command Message** |
| **7. SIS setpoint manipulation** | The attacker connects to the SIS safety PLC via the unpatched engineering protocol (accessible from the SCADA network segment) and raises the thermal runaway protection threshold from 55°C to 80°C. This ensures the SIS will not intervene during the developing thermal excursion. | Safety Instrumented System (safety PLC) | SIS engineering protocol (unauthenticated) | SIS configuration audit: setpoint deviation from certified values. Independent safety review: periodic comparison of SIS configuration against IEC 61511 baseline. **MITRE ATT&CK for ICS: T0836 — Modify Parameter** |
| **8. Overcharge condition develops** | With the charge cutoff overridden and sensor data falsified, the BMS continues charging Battery Racks A1–A4 into overcharge. Cell voltages exceed safe limits. Internal cell heating accelerates. Actual cell temperatures rise through 40°C, 45°C, 50°C over approximately two hours. The HMI displays 26°C. The SIS threshold (now 80°C) is not yet reached. | Battery Racks A1–A4 (physical cells); BMS control loop | Physical electrochemical process | Building management: battery hall ambient temperature rising. Physical observation: elevated temperature felt by any person entering the hall. Grid interface: unexpected power draw reported by PLC-GRID. **MITRE ATT&CK for ICS: T0831 — Manipulation of Control** |
| **9. Safety consequence — approach to thermal runaway** | Cell temperatures in the hottest cells approach 60°C. At this temperature, degradation reactions in the cell electrolyte begin to accelerate. Without intervention, the cells will enter thermal runaway within approximately 30–60 minutes (onset typically 60–80°C). Hydrogen gas generation begins as electrolyte decomposes. The SIS does not trigger. The control room operator sees normal readings. | Battery cells (electrochemical failure onset); SIS (ineffective) | Physical process | Gas sensors (if independent of SIS): hydrogen detection. Physical observation: unusual sounds (cell swelling/venting). Smell: electrolyte vapour has a distinctive sweet chemical odour. **MITRE ATT&CK for ICS: T0814 — Denial of Control (SIS rendered ineffective)** |
| **10. Detection and emergency response** | Detection occurs through an independent pathway — either a physical walkdown by a SCADA engineer (as in the primary scenario), an independent gas detector alarm, or a building management system alert for battery hall ambient temperature. Manual emergency shutdown is initiated via the hardwired ESD pushbutton, bypassing the compromised SIS and PLC. | Hardwired ESD system; independent detection mechanism | Hardwired electrical interlock | N/A — this is the recovery action. The scenario demonstrates that when digital safety systems are compromised, only independent physical mechanisms (hardwired ESD, analog instrumentation, human observation) remain as safety barriers. |

---

## 4. Safety Consequence

The insider scenario produces the same ultimate safety hazard as the external APT scenario — lithium-ion cell thermal runaway leading to fire, toxic gas release, and facility damage risk — but through a more direct pathway. The key distinction is the attack on PLC control logic itself (Step 4), rather than solely on register values and SIS setpoints.

**PLC logic compromise** introduces a more persistent and harder-to-detect manipulation than register overwriting. The hidden routine survives PLC power cycles and will reactivate whenever the trigger coil is set — meaning the vulnerability persists until the PLC logic is forensically examined and reloaded from a verified clean baseline. A simple register reset would not remediate this threat.

**Combined SIS and BMS failure** — the simultaneous manipulation of both the control system (PLC-BMS) and the safety system (SIS) eliminates two independent protection layers. The scenario demonstrates why IEC 61511 requires the SIS to be independent of the control system — and what happens when network architecture violations make the SIS reachable from the same environment as the control system.

**Insider vector implications** — the use of a trusted contractor with legitimate physical and logical access highlights the limitation of network-based security controls alone. The attacker did not need to cross any IT/OT boundary because the contractor's access already spanned it. This makes the case for defence-in-depth measures including: application whitelisting on engineering workstations, PLC programme integrity monitoring, dual-authorisation for PLC logic changes, and session recording for privileged OT access.

---

## 5. Indicators of Compromise

### Network-Level IoCs

1. **Encrypted traffic on non-standard port from engineering workstation**: Outbound TCP connection from HMI-ENG-02 on an unusual port, establishing a reverse shell to an external IP via the jump server NAT.
2. **PLC programme download outside maintenance window**: PLC programming protocol traffic from HMI-ENG-02 to PLC-BMS at a time when no maintenance activity is scheduled.
3. **Unusual Modbus/TCP write patterns**: Register write commands to PLC-BMS from the engineering workstation that do not correspond to any operator action or scheduled automatic process.

### Host-Level IoCs

4. **New executable in vendor software directory**: An unsigned binary masquerading as a PLC diagnostics utility, installed during the contractor's maintenance visit.
5. **PLC logic hash mismatch**: The running PLC programme hash does not match the last certified and audited version stored in configuration management.
6. **SIS setpoint deviation**: Safety PLC thermal threshold values differ from the IEC 61511-certified baseline, with no corresponding Management of Change record.

### Behavioural IoCs

7. **Contractor account active outside visit windows**: The contractor's domain credentials are used to authenticate after the scheduled maintenance visit has ended.
8. **Flat sensor readings**: Cell temperature and state-of-charge values report constant values with zero variance over an extended period — physically implausible for an active battery system.
9. **Charge behaviour inconsistent with schedule**: Battery racks charging at high rate during a period when the grid balancing schedule does not call for energy absorption.

---

## 6. MITRE ATT&CK for ICS Mapping

| Attack Step | ATT&CK for ICS Technique | ID |
|-------------|--------------------------|-----|
| Backdoor installation via contractor (Step 1) | Supply Chain Compromise | T0862 |
| Remote access activation (Step 2) | Remote Services | T0886 |
| PLC programme read/recon (Step 3) | Point & Tag Identification | T0861 |
| PLC logic modification (Step 4) | Program Download | T0843 |
| Sensor data falsification (Step 5) | Modify Parameter | T0836 |
| Trigger hidden routine (Step 6) | Unauthorized Command Message | T0855 |
| SIS setpoint manipulation (Step 7) | Modify Parameter | T0836 |
| Process manipulation (Step 8) | Manipulation of Control | T0831 |
| SIS rendered ineffective (Step 9) | Denial of Control | T0814 |
