# System Overview — Albion Energy Storage Facility

---

## Facility Overview

The Albion Energy Storage Facility is a 100 MW / 200 MWh grid-scale battery energy storage system (BESS) located on a former industrial estate near Tamworth in the English Midlands. Operated by Albion Energy Storage Ltd, the facility provides frequency response, peak shaving, and grid balancing services to National Grid ESO under a long-term ancillary services contract. The site shares physical premises with Trent Water Services, a subsidiary operating a water pumping and treatment station for the surrounding industrial estate.

## ICT/OT Environment — Purdue Model Mapping

The facility's information and operational technology systems are organised across the Purdue Reference Model for industrial control systems:

### Level 4–5: Enterprise IT

The corporate IT network hosts Albion's business systems: an ERP platform for commercial operations and contract management, corporate email, and a data analytics application used for capacity forecasting and market trading decisions. Internet access is provided through a managed firewall. IT services — including endpoint management, patching, and basic security monitoring — are outsourced to CastleTech Solutions, an external managed service provider that also serves Trent Water Services. Enterprise workstations in the office areas, shared multi-function printers, and the site-wide building management system (HVAC, fire suppression, access control) all reside on this network tier.

### Level 3: Operations / SCADA

The SCADA server is the central coordination point for all operational technology functions. It communicates downstream with the PLC clusters and RTUs via Modbus/TCP and upstream with the historian server via OPC-UA. Two HMI/engineering workstations (HMI-OPS-01 and HMI-ENG-02) provide the operator and engineering interfaces respectively. A historian server records time-series process data — cell voltages, temperatures, charge/discharge rates, grid frequency, and power flows — for regulatory reporting, post-event analysis, and the enterprise analytics platform. A jump server was installed as part of the smart grid upgrade to serve as a DMZ between the enterprise IT and SCADA networks; in practice, its configuration permits bidirectional RDP access and has become a de facto bridge between the two zones.

### Level 1–2: Control

Two primary PLC clusters govern the facility's core operational processes. **PLC-BMS** (Battery Management System) manages cell-level charging and discharging, monitors state-of-charge and cell temperatures, controls the thermal management system (forced-air cooling), and enforces charge/discharge rate limits. **PLC-GRID** (Grid Interface Controller) manages the bidirectional inverters that convert between the DC battery bus and the AC grid connection, controls the point-of-connection interface with the distribution network, and manages frequency response logic. **RTUs** (Remote Terminal Units) provide telemetry and basic control for ancillary systems including the site weather station, perimeter CCTV, and the electrical switchyard disconnect switches.

### Level 0: Field Devices

Temperature sensors (thermocouples on individual cell modules), voltage sensors, current transducers, pressure sensors (for sealed cell enclosures), hydrogen gas detectors, ambient environmental sensors, DC contactors, AC circuit breakers, inverter control interfaces, cooling fan actuators, and ventilation damper actuators.

## IT/OT Integration Points

The smart grid upgrade programme, completed eighteen months before the incident, created several integration pathways between the enterprise IT and SCADA environments:

1. **Historian dual-homing**: The historian server has interfaces on both the SCADA network and the enterprise IT network, allowing the analytics platform to query operational data directly.
2. **Jump server (DMZ)**: Intended as a controlled access point, but configured to permit bidirectional RDP rather than enforcing one-way data diode or unidirectional gateway principles.
3. **Legacy firewall rules**: Modbus/TCP traffic between the enterprise maintenance VLAN and the SCADA server, introduced during commissioning, persists as "temporary" rules that were never removed.

These integration points collectively create an imperfect IT/OT boundary — one that provides logical separation on paper but permits authenticated (and in some cases unauthenticated) traffic to traverse between zones.

## Safety Instrumented Systems

The SIS operates on a separate safety PLC, rated SIL 2 per IEC 61511. It is designed to function independently of the main control system, monitoring critical process parameters (cell temperature, state-of-charge, hydrogen gas concentration, ambient temperature, fault currents) and initiating automatic emergency shutdown if thresholds are exceeded. The SIS controls the fixed fire suppression system in the battery halls. A hardwired emergency shutdown (ESD) pushbutton system, electrically interlocked and independent of both the programmable SIS and the SCADA system, provides the ultimate manual safety boundary.

The SIS was certified at facility commissioning. A firmware update addressing a vulnerability in the SIS engineering protocol has been available for eighteen months but has not been applied — doing so would require the SIS to be taken offline and recertified under IEC 61511, at an estimated cost of £180,000 and eight weeks of downtime during which automatic thermal runaway protection would be unavailable.

## Shared Infrastructure with Trent Water Services

Albion and Trent Water share: a site building management system (HVAC, fire suppression, physical access control), multi-function printers in the shared office areas, a joint file server for site administration documents, and a common IT service desk through CastleTech Solutions. The two organisations operate separate SCADA systems for their respective process control, but the shared IT infrastructure creates lateral movement pathways between them — a cross-sector dependency that is architecturally present but not formally risk-assessed.

## Known Security Weaknesses

- **Incomplete IT/OT segmentation**: The jump server, historian dual-homing, and legacy firewall rules collectively undermine the intended boundary between enterprise IT and SCADA operations.
- **Legacy ICS components with default credentials**: The PLC management interface and several RTUs retain factory-default usernames and passwords unchanged since commissioning.
- **Unpatched SIS firmware**: The known vulnerability in the SIS engineering protocol remains unpatched due to the IEC 61511 recertification constraint.
- **No OT-specific monitoring**: The CastleTech SOC contract covers enterprise IT only; SCADA network traffic, ICS protocol anomalies, and jump server access are not monitored in real time.
- **Shared infrastructure with subsidiary**: The common file server and shared printers provide uncontrolled lateral movement pathways between Albion and Trent Water.
- **Dormant accounts**: Accounts belonging to former contractors remain enabled on the jump server and engineering workstations with unchanged default passwords.
