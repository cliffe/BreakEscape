# Scenario 01: IT-to-OT Pivot Leading to SCADA Compromise and Battery Thermal Runaway Risk

Energy Attack Scenario — Albion Energy Storage Ltd

---

## 1. Scenario Summary

A state-sponsored APT group, operating from initial access purchased from a cybercrime initial access broker, pivots from the Albion Energy Storage enterprise IT network into the SCADA/ICS environment via an imperfectly segmented IT/OT boundary. The attackers traverse through a compromised network printer, a dual-homed historian server, and a misconfigured jump server to reach the SCADA control system. They then falsify battery sensor readings on the Battery Management System PLCs, manipulate Safety Instrumented System alarm thresholds through an unpatched engineering protocol vulnerability, and issue unauthorised charge commands that drive lithium-ion cells toward thermal runaway — creating an imminent risk of fire, toxic gas release, and facility damage.

---

## 2. System Prerequisites

The following configuration and environmental conditions make this attack possible:

- **Unpatched network printer firmware**: Multi-function printers in the shared office area run firmware with a known remote code execution vulnerability in their embedded web management interface. These devices are not included in the enterprise vulnerability management programme.
- **Dual-homed historian server**: The historian server has network interfaces on both the SCADA network (Level 3) and the enterprise IT network (Level 4), intended for the smart grid analytics integration. This creates a direct data path between the IT and OT zones.
- **Misconfigured jump server**: The DMZ jump server permits bidirectional RDP sessions rather than enforcing unidirectional data flow. Dormant accounts with default passwords remain enabled.
- **Legacy Modbus/TCP firewall rules**: Firewall rules permitting direct Modbus/TCP traffic between the enterprise maintenance VLAN and the SCADA server, introduced during commissioning, remain active.
- **SIS engineering protocol vulnerability**: The Safety Instrumented System's engineering protocol interface accepts unauthenticated connections and does not log modifications — a flaw addressed by an available but unapplied firmware update (deferred due to IEC 61511 recertification requirements).
- **No OT-specific SOC monitoring**: The managed SOC contract with CastleTech Solutions covers enterprise IT only. SCADA network traffic, jump server access logs, and ICS protocol anomalies are not monitored in real time.
- **Shared infrastructure with subsidiary**: A common file server and shared network printers connect Albion and Trent Water Services, creating lateral movement pathways between the two organisations.
- **Default credentials on legacy PLCs**: The PLC management interface retains factory-default credentials that have not been changed since commissioning.

---

## 3. Step-by-Step Attack Chain

| Step | Action | System/Asset Affected | Protocol/Technique | Detection Opportunity |
|------|--------|----------------------|--------------------|-----------------------|
| **1. Peripheral device reconnaissance** | Attacker scans for internet-exposed device management interfaces using Shodan. Identifies Albion's multi-function printers by model and firmware version. Cross-references with known CVEs. | Internet-facing printer management interface | HTTP/HTTPS (Shodan scan) | External threat intelligence: Shodan monitoring for organisational assets. Perimeter firewall: block inbound access to printer management ports. |
| **2. Social engineering — firmware USB delivery** | Attacker contacts Albion facilities management posing as the printer vendor's UK service partner. Arranges delivery of a USB drive containing a backdoored firmware update, presented as a critical security patch. | Facilities management staff (human target); printer hardware | Social engineering; USB media | Staff security awareness: verify vendor communications through independent channels. Physical media policy: prohibit unsolicited USB devices. |
| **3. Printer firmware compromise** | Maintenance technician applies the malicious firmware update to two shared office printers. The firmware includes a persistent reverse shell beaconing to a C2 server over HTTPS every four hours. | Multi-function printers (shared office area) | HTTPS (C2 beaconing); firmware-level persistence | Network monitoring: anomalous HTTPS traffic from printer IP addresses. Endpoint inventory: firmware hash verification against vendor-published values. **MITRE ATT&CK for ICS: T0862 — Supply Chain Compromise** |
| **4. Enterprise network reconnaissance** | From the compromised printer, attacker maps the enterprise Active Directory structure, identifies network subnets, the shared file server, the dual-homed historian, and the jump server. | Enterprise IT network — Active Directory, network infrastructure | LDAP enumeration, SMB, NetBIOS | SIEM: unusual LDAP queries originating from a printer IP. IDS: network scanning patterns from non-workstation devices. |
| **5. Credential harvesting via keylogger** | Attacker deploys a keylogger module on the compromised printer, capturing credentials from print jobs, web traffic, and network authentication requests. Harvests a CastleTech domain service account with cross-site administrative privileges. | Compromised printers; domain credentials | Credential interception at firmware level | Credential monitoring: service accounts used from unexpected source IPs. Privileged access management: service account usage alerts. |
| **6. Secondary foothold — domain controller** | Using the CastleTech service account, attacker deploys a custom implant (service DLL) on the Albion domain controller. The implant communicates via DNS-over-HTTPS queries to an attacker-controlled cloud domain. | Domain controller | DNS-over-HTTPS (C2); service DLL injection | SIEM: new service installation on domain controller. DNS monitoring: unusual DoH query volumes. Change control: unscheduled service deployment. **MITRE ATT&CK for ICS: T0817 — Drive-by Compromise (analogous — C2 establishment)** |
| **7. Passive OT reconnaissance via historian** | Attacker analyses traffic on the historian server's dual-homed interface. Maps Modbus/TCP communications to identify PLC-BMS and PLC-GRID by slave address. Catalogues battery parameter register addresses (state-of-charge, cell temperature, charge current). Identifies SIS alarm setpoints from historian time-series data. | Dual-homed historian server; SCADA network traffic (passive interception) | Modbus/TCP (passive monitoring); OPC-UA (data analysis) | Network monitoring: unexpected processes on historian server. ICS anomaly detection: new connections to historian from enterprise interfaces. |
| **8. Jump server access — dormant account exploitation** | Attacker authenticates to the jump server using a dormant contractor account with a default password. Establishes an RDP session to engineering workstation HMI-ENG-02 in the control room (unoccupied during night shift). | Jump server; engineering workstation HMI-ENG-02 | RDP; default credentials | Jump server access logs: login from dormant account outside business hours. Account management: disable dormant/contractor accounts. MFA enforcement on jump server. **MITRE ATT&CK for ICS: T0886 — Remote Services** |
| **9. SCADA network access confirmed** | From HMI-ENG-02, attacker confirms direct network access to the SCADA server, both PLC clusters (PLC-BMS, PLC-GRID), and the SIS engineering port. Issues a test read command for Battery Rack A1 state-of-charge — a routine query indistinguishable from normal historian polling. | SCADA server; PLC-BMS; SIS | Modbus/TCP (read command) | ICS anomaly detection: commands from engineering workstation outside maintenance windows. Behavioural baseline: engineering workstation active during unmanned periods. |
| **10. Historian proxy installation** | Attacker installs a lightweight Modbus/TCP proxy on the dual-homed historian server, providing a secondary command channel from the enterprise network to the SCADA network that does not require the RDP session. | Historian server (dual-homed) | Modbus/TCP proxy; port forwarding | Host monitoring: new listening ports on historian server. Network monitoring: Modbus traffic originating from historian to PLCs (historian normally receives, not sends). |
| **11. SIS threshold manipulation** | Using the unpatched SIS engineering protocol vulnerability, attacker connects to the safety PLC and modifies the thermal runaway protection threshold from 55°C to 85°C. Hydrogen gas alarm threshold raised from 1.0% to 3.8%. No authentication required; no modifications logged. | Safety Instrumented System (safety PLC) | SIS engineering protocol (proprietary, unauthenticated) | **Limited detection opportunity** — the protocol does not log changes. Physical inspection: SIS configuration audit (manual process). Independent safety monitoring: comparison of SIS setpoints against certified baseline. **MITRE ATT&CK for ICS: T0836 — Modify Parameter** |
| **12. Charge current pre-conditioning** | Over twelve hours, attacker subtly increases the charge current to Battery Racks A1–A4 by writing incremental adjustments to PLC-BMS charge rate registers via SCADA. Cell temperatures rise gradually from 28°C to 36°C. | PLC-BMS; Battery Racks A1–A4 | Modbus/TCP (write commands to PLC registers) | ICS anomaly detection: charge rate exceeding normal operational profile. Trend analysis: gradual departure from historical charge patterns. **MITRE ATT&CK for ICS: T0855 — Unauthorized Command Message** |
| **13. Sensor data falsification** | Attacker writes falsified values to PLC-BMS holding registers: cell temperatures reported as 28°C (actual: 36°C and rising); state-of-charge reported as 72% (actual: 94%). HMI displays normal values. | PLC-BMS holding registers; HMI display | Modbus/TCP (register write); HMI data path | ICS anomaly detection: register values inconsistent with physical process models (rate of change analysis). Cross-reference: discrepancy between independent temperature readings and PLC-reported values. **MITRE ATT&CK for ICS: T0836 — Modify Parameter** |
| **14. Overcharge command execution** | Attacker issues a sustained charge command at 95% of rated capacity to Racks A1–A4 via SCADA. The command is accepted because the BMS reads a falsified 72% state-of-charge (actual: 94%). Cells charge into an overcharge condition. | PLC-BMS; SCADA server; Battery Racks A1–A4 | Modbus/TCP (write command via SCADA) | ICS anomaly detection: charge command at near-maximum rate during period of already high SoC (if actual SoC were known). Grid interface: unexpected load increase registered by PLC-GRID. **MITRE ATT&CK for ICS: T0855 — Unauthorized Command Message** |
| **15. Thermal excursion develops** | Cell temperatures climb from 36°C through 45°C toward thermal runaway onset zone (60–80°C). SIS does not trigger (threshold raised to 85°C). HMI displays falsified 28°C. Junior shift technician observes no anomaly. | Battery Racks A1–A4 (physical cells); SIS (ineffective); HMI (displaying false data) | Physical thermal process (no protocol) | Physical observation: elevated ambient temperature in battery hall. Analog instrumentation: local thermometers not connected to digital system. Building management: HVAC anomaly from rising hall temperature. **MITRE ATT&CK for ICS: T0831 — Manipulation of Control** |
| **16. Detection by SCADA engineer** | Priya Chandra arrives for a scheduled maintenance window. During walkdown, she notices elevated hall temperature, checks a wall-mounted analog thermometer (51°C), and identifies the discrepancy with HMI readings. She alerts Marcus Webb. | Human detection (Priya Chandra); analog thermometer; phone to Marcus Webb | Human observation; out-of-band communication | This IS the detection event. The scenario demonstrates the critical role of physical observation and independent instrumentation as a last line of defence when digital monitoring is compromised. |
| **17. Manual emergency shutdown** | Chandra initiates emergency shutdown via the hardwired ESD pushbutton on the local control panel in Battery Hall 1. The hardwired interlock (independent of the programmable SIS) disconnects Racks A1–A4, opens DC contactors, activates cooling and ventilation. Actual cell temperatures at shutdown: approximately 58°C. | Hardwired ESD system; DC contactors; cooling/ventilation systems | Hardwired electrical interlock (no network protocol) | N/A — this is the response action. The hardwired ESD is the ultimate safety boundary that cannot be compromised via network-based attack. **MITRE ATT&CK for ICS: T0816 — Device Restart/Shutdown (defender action)** |
| **18. Network isolation and incident response** | Webb instructs physical disconnection of the jump server. CastleTech SOC isolates all enterprise network connections to the Albion site. NCSC and NIS competent authority notified. Facility evacuation ordered as precaution. | Jump server; enterprise network; all site IT/OT connections | Physical cable removal; firewall rule changes | N/A — response actions. Initiates 72-hour NIS Regulations incident reporting clock. |

---

## 4. Safety Consequence

### How Functional Safety Was Compromised

The attack compromised functional safety through a deliberate, multi-layered subversion of the facility's safety defences:

**Safety Instrumented System bypass.** The SIS — the primary automated safety barrier — was rendered ineffective by manipulation of its alarm thresholds through the unpatched engineering protocol. The thermal runaway protection threshold was raised from 55°C to 85°C, meaning the SIS would not trigger until cells were well into irreversible thermal decomposition. This attack was possible because (a) the SIS engineering port was accessible from the SCADA network without traversing any additional security boundary, (b) the engineering protocol required no authentication, and (c) the protocol did not log modifications. The vulnerability was known, a patch was available, and the patch had been deferred because applying it would require SIS recertification under IEC 61511.

**Sensor data falsification.** The PLC-BMS registers reporting cell temperature and state-of-charge were overwritten with false values, blinding the control room operator to the actual physical conditions. The control system's decision logic — which relies on these register values to enforce charge limits — was effectively bypassed because it trusted the data in its own registers implicitly. No independent sensor validation or physical-model cross-check existed.

**Overcharge condition.** With sensor data falsified and safety thresholds raised, the attacker was able to command the BMS to charge cells that were already near-full at near-maximum rate. This forced the cells into overcharge, driving cell voltages above safe limits and generating heat through internal resistance and electrochemical degradation.

### The Physical Hazard

Lithium-ion cell thermal runaway is a self-sustaining exothermic decomposition reaction. Once a cell enters thermal runaway, it releases flammable electrolyte vapour, generates intense heat (peak temperatures can exceed 600°C), and can propagate to adjacent cells — triggering a cascading failure across an entire rack. In a grid-scale BESS with thousands of cells, a thermal runaway event can cause sustained fire, toxic gas release (hydrogen fluoride from fluorinated electrolyte salts), and structural damage. At the Albion facility, the battery halls are within 50 metres of occupied offices and the Trent Water pumping station. An uncontrolled thermal runaway event would require fire and rescue service intervention, pose an inhalation hazard to site personnel and neighbouring facilities, and potentially cause grid instability if the fault propagated to the switchyard.

In this scenario, the detection and manual shutdown at 58°C prevented catastrophic failure, but cell damage occurred and the facility required complete safety recertification before returning to service.

---

## 5. Indicators of Compromise

### Network-Level IoCs

1. **Anomalous HTTPS traffic from printer IP addresses**: Periodic outbound HTTPS connections from multi-function printers to external IP addresses, consistent with C2 beaconing. Printers do not normally initiate outbound web connections outside of vendor cloud-print services.
2. **DNS-over-HTTPS queries from domain controller**: Unusual volume of DNS-over-HTTPS traffic from the domain controller to a previously unseen cloud analytics domain — the custom implant's C2 channel.
3. **Modbus/TCP traffic from historian to PLCs**: The historian server normally receives data from PLCs via the SCADA server. Direct Modbus/TCP traffic originating from the historian to PLC addresses indicates the installed proxy.
4. **RDP session to jump server from dormant account**: RDP authentication to the jump server using a contractor account that has not been active for over twelve months, originating during non-business hours.

### Host-Level IoCs

5. **New service DLL on domain controller**: An unscheduled Windows service installation on the domain controller, masquerading as a performance monitoring component.
6. **Modified firmware hashes on network printers**: Firmware image checksums on the affected printers do not match vendor-published values for the installed firmware version.
7. **Unexpected processes on historian server**: A Modbus/TCP proxy process running on the historian server — not part of the standard historian software installation.
8. **Engineering workstation active during unmanned hours**: Process activity and user session logs on HMI-ENG-02 indicating interactive use during overnight shifts when no engineering staff are scheduled.

### Behavioural IoCs

9. **SIS setpoint modification without change request**: The SIS thermal protection threshold was changed from 55°C to 85°C without any corresponding change request, risk assessment, or IEC 61511 modification management record. Under normal operations, any SIS setpoint change requires a formal Management of Change process.
10. **Charge rate outside normal operational profile**: Sustained charge commands at 95% of rated capacity to multiple battery racks simultaneously, outside the normal operational pattern established by historical data. Normal operations rarely exceed 80% charge rate.
11. **Flat sensor reading over extended period**: Cell temperature readings remaining at exactly 28.0°C with zero variance for over three hours — physically implausible for an active electrochemical system that typically fluctuates by 1–2°C.
12. **Grid interface load anomaly**: An unexpected step change in load reported by PLC-GRID, inconsistent with the grid balancing schedule and the reported (falsified) state-of-charge.

---

## 6. MITRE ATT&CK for ICS Mapping

| Attack Step | ATT&CK for ICS Technique | ID |
|-------------|--------------------------|-----|
| Printer firmware compromise (Step 3) | Supply Chain Compromise | T0862 |
| Enterprise reconnaissance from printer (Step 4) | Remote System Discovery | T0846 |
| Credential harvesting via keylogger (Step 5) | Screen Capture / Input Capture | T0852 |
| Domain controller implant (Step 6) | Commonly Used Port (C2 over DNS/HTTPS) | T0885 |
| Passive OT recon via historian (Step 7) | Remote System Information Discovery | T0888 |
| Jump server access (Step 8) | Remote Services | T0886 |
| SCADA access and test read (Step 9) | Point & Tag Identification | T0861 |
| SIS threshold manipulation (Step 11) | Modify Parameter | T0836 |
| Sensor data falsification (Step 13) | Modify Parameter | T0836 |
| Overcharge command (Step 14) | Unauthorized Command Message | T0855 |
| Thermal excursion / process manipulation (Step 15) | Manipulation of Control | T0831 |
| Program download to SIS (Step 11, alternate) | Program Download | T0843 |
| Denial of safe shutdown (SIS bypass) | Denial of Control | T0814 |
