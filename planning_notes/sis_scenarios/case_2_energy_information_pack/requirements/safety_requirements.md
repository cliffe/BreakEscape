# Functional Safety Requirements — Albion Energy Storage Facility

These requirements express safety properties that must hold regardless of the state of the cyber environment. They are derived from the hazard analysis of the Albion battery storage scenario and are expressed as properties of the physical process and its safety systems, not as IT security controls.

---

## Battery Thermal Safety

**REQ-EN-SAF-001: Thermal Runaway Prevention — Charge Cutoff**
The Battery Management System shall terminate charging of any battery rack when the measured state-of-charge exceeds 90% of rated capacity, independent of any external charge command received from the SCADA server or grid operator dispatch system. This cutoff shall be implemented in hardwired logic or in safety-certified PLC code (SIL 2 minimum) that cannot be modified by a remote command.

**REQ-EN-SAF-002: Thermal Runaway Prevention — Temperature Limit**
The Safety Instrumented System shall initiate an automatic emergency shutdown of any battery rack when the measured cell temperature exceeds 55°C. The temperature measurement shall be taken from hardwired thermocouple inputs to the SIS safety PLC, not from PLC-BMS register values. The shutdown sequence shall disconnect the affected rack from the DC bus, activate forced-air cooling, and open battery hall ventilation dampers.

**REQ-EN-SAF-003: Thermal Runaway Prevention — Rate of Temperature Rise**
The Safety Instrumented System shall initiate an automatic emergency shutdown of any battery rack when the rate of cell temperature rise exceeds 5°C per minute sustained over a 3-minute period. This rate-of-change detection provides an additional protective layer independent of absolute temperature thresholds, enabling earlier detection of incipient thermal runaway.

**REQ-EN-SAF-004: Overcharge Current Limiting**
The Battery Management System shall enforce a maximum charge current limit of 80% of rated capacity under normal operating conditions. Charge rates above 80% shall require explicit operator authorisation from the control room HMI, with a time-limited override that automatically expires after 30 minutes.

**REQ-EN-SAF-005: Cell Voltage Monitoring and Protection**
The Battery Management System shall monitor individual cell voltages and shall disconnect any battery rack from the charge bus when any individual cell voltage exceeds the manufacturer's specified maximum charge voltage (typically 4.2V per cell for lithium-ion). This protection shall be independent of state-of-charge calculations.

---

## Gas Safety

**REQ-EN-SAF-006: Hydrogen Gas Detection and Response**
The Safety Instrumented System shall activate ventilation and alarm systems when hydrogen gas concentration in any battery hall exceeds 1.0% by volume (25% of the lower explosive limit). If concentration exceeds 2.0% by volume (50% LEL), the SIS shall initiate full battery hall evacuation alarm and emergency shutdown of all battery racks in the affected hall.

**REQ-EN-SAF-007: Toxic Gas Detection**
The facility shall maintain independent gas detection for hydrogen fluoride (HF) in the battery halls, with alarm and evacuation triggers at concentrations exceeding 3 ppm (the UK workplace exposure limit). HF gas detection shall be independent of the SIS and shall trigger audible and visual alarms at all battery hall entry points.

---

## Electrical Safety

**REQ-EN-SAF-008: DC Bus Fault Isolation**
The electrical protection system shall automatically disconnect any battery rack from the DC bus within 100 milliseconds of detecting a ground fault, overcurrent condition, or arc fault. Protection relay operation shall be independent of the SCADA system and PLC control logic.

**REQ-EN-SAF-009: Grid Interface Protection**
The point-of-connection protection relays shall automatically disconnect the facility from the distribution network if power flow, frequency, or voltage parameters exceed the limits defined in the connection agreement with the distribution network operator. These relays shall operate independently of PLC-GRID and the SCADA system.

---

## Safety System Independence

**REQ-EN-SAF-010: SIS Independence from Control System**
The Safety Instrumented System shall operate independently of the basic process control system (SCADA/PLC-BMS/PLC-GRID) in accordance with IEC 61511 clause 11.2.4. The SIS shall use separate sensors, separate logic solvers (safety PLCs), and separate final elements (contactors, valves) where practicable. Where common final elements are unavoidable, the SIS output shall take precedence over the control system output.

**REQ-EN-SAF-011: SIS Configuration Integrity**
SIS safety function parameters — including alarm thresholds, trip setpoints, timing parameters, and voting logic — shall be protected against unauthorised modification. Any modification shall require authenticated access, generate an immutable audit log entry, and trigger a formal Management of Change review under IEC 61511 before the modified configuration is accepted as the operational baseline.

**REQ-EN-SAF-012: Hardwired Emergency Shutdown Independence**
The hardwired ESD pushbutton system and its associated electrical interlocks shall be physically and electrically independent of all programmable systems (SCADA, PLCs, SIS safety PLC). The hardwired ESD shall be capable of bringing the entire facility to a safe state — all battery racks disconnected, cooling and ventilation activated — with no dependency on any software-controlled component.

**REQ-EN-SAF-013: SIS Proof Testing**
The SIS safety functions shall be proof-tested at intervals defined by the SIL assessment (typically annually for SIL 2 functions). Proof testing shall verify the complete chain from sensor input through logic solver to final element actuation. Proof test results shall be documented and retained for the life of the safety function.

---

## Operator and Personnel Safety

**REQ-EN-SAF-014: Operator Awareness of Process State**
The control room HMI shall present a clear, unambiguous indication of the actual state of all safety-critical process parameters. Where the displayed value is derived from a PLC register, the display shall include a data quality indicator showing whether the value has been validated against an independent source. Any loss of communication with a safety-critical sensor shall be displayed as a fault condition, not as a normal reading.

**REQ-EN-SAF-015: Manual Override Capability**
The control room operator shall have the capability to manually initiate emergency shutdown of any individual battery rack, all battery racks in a hall, the entire DC bus, or the grid connection, from the control room HMI and from local control panels in the battery halls. Manual shutdown capability shall be independent of SCADA server availability.

**REQ-EN-SAF-016: Evacuation and Emergency Response**
Documented emergency response procedures shall exist for battery thermal runaway, hydrogen gas release, hydrogen fluoride release, and electrical fault conditions. These procedures shall include defined evacuation zones, assembly points, and notification procedures for the local fire and rescue service. Procedures shall be exercised at least annually.

---

## Post-Incident Safety

**REQ-EN-SAF-017: Safe State Definition**
A formal safe state shall be defined for the Albion facility: all battery racks disconnected from the DC bus, all inverters de-energised, forced-air cooling active, battery hall ventilation dampers open, and the facility disconnected from the distribution network. Any automated or manual shutdown sequence shall achieve this safe state.

**REQ-EN-SAF-018: Return-to-Service Safety Assessment**
Following any SIS activation, any modification to safety-certified components, or any suspected cyber compromise of control or safety systems, the facility shall not return to service until a formal safety assessment has confirmed that all safety functions have been restored to their certified configuration, all control system software has been verified against known-good baselines, and the IT/OT environment has been declared free of compromise.
