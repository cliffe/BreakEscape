# The Albion Incident

A Security-Informed Safety Storyline — Albion Energy Storage Ltd

---

## 1. Scenario Overview

In early spring 2026, Albion Energy Storage Ltd — operator of a grid-scale battery energy storage system (BESS) in the English Midlands — suffered a sophisticated cyber attack that began with a supply-chain compromise of a network-connected maintenance printer and escalated into direct manipulation of industrial control systems governing battery storage and grid distribution. A financially motivated initial access broker established a persistent foothold and sold access to a state-sponsored advanced persistent threat group, which pivoted from the enterprise IT network into the SCADA/ICS environment through an imperfectly segmented IT/OT boundary. The attackers falsified battery state-of-charge and cell temperature readings on the Battery Management System PLCs, bypassed thermal runaway protection thresholds on the Safety Instrumented System, and began issuing unauthorised charge commands to a bank of lithium-ion cells already operating above safe temperature limits. The resulting overcharge condition created an imminent thermal runaway risk — a cascading exothermic failure mode that, if unchecked, could cause cell venting, fire, and toxic gas release in a facility adjacent to occupied buildings. The anomaly was detected by a SCADA engineer who noticed discrepancies between HMI readings and a local analog temperature gauge during a routine walkdown. Emergency shutdown was initiated manually before catastrophic failure occurred, but the facility sustained cell damage, required a controlled evacuation, and remained offline for six weeks during forensic investigation and safety recertification.

---

## 2. Setting

### Albion Energy Storage Ltd

Albion Energy Storage Ltd operates the Albion Storage Facility, a 100 MW / 200 MWh grid-scale battery energy storage system situated on a former industrial estate near Tamworth in the English Midlands. The facility provides frequency response, peak shaving, and grid balancing services to National Grid ESO under a long-term ancillary services contract. The site comprises three main buildings: a control centre housing the SCADA control room, engineering offices, and server infrastructure; two battery halls containing lithium-ion cell racks, inverters, and thermal management systems; and a shared utility block housing the electrical switchyard, transformer compound, and auxiliary services.

### The SCADA/ICS Environment

The facility's industrial control systems are organised broadly in line with the Purdue Reference Model. At the enterprise level (Levels 4–5), the corporate IT network hosts business systems including an ERP platform, corporate email, and a historians data analytics application used for capacity forecasting. A SCADA server at Level 3 coordinates all operational technology functions, communicating with two primary PLC clusters: PLC-BMS (Battery Management System), which governs cell charging, discharging, state-of-charge monitoring, and thermal management; and PLC-GRID (Grid Interface Controller), which manages the bidirectional inverters and the point-of-connection interface with the distribution network. Remote Terminal Units (RTUs) provide telemetry from ancillary systems including the site's weather station, perimeter CCTV, and the electrical switchyard. A pair of HMI/engineering workstations in the control room provide the primary operator interface, and a historian server records time-series process data for regulatory reporting and post-event analysis.

### IT/OT Integration — The Vulnerability

Eighteen months before the incident, Albion undertook a "smart grid upgrade" to improve operational efficiency and enable remote monitoring. As part of this project, a data link was established between the Level 3 SCADA network and the Level 4 enterprise network via a jump server intended to serve as a DMZ. However, budget constraints and schedule pressure led to a series of configuration compromises: the jump server permitted RDP access in both directions rather than enforcing one-way data transfer only; the historian server was given a dual-homed network interface to serve both the SCADA network and the corporate analytics platform; and several legacy firewall rules permitted direct Modbus/TCP traffic between the corporate network's maintenance VLAN and the SCADA server — a "temporary" arrangement introduced during commissioning that was never remediated.

### Shared Infrastructure with Trent Water Services

The Albion Storage Facility shares its physical site with a subsidiary operation, Trent Water Services, which manages a water pumping and treatment station serving the surrounding industrial estate. Trent Water operates its own small SCADA system for pump control and flow monitoring, but shares several infrastructure elements with Albion: a common site network for building management (HVAC, fire suppression, access control), shared multi-function printers in the office areas, and a joint file server used for site-wide administration documents including safety data sheets, contractor induction materials, and shift rotas. The two organisations have separate SCADA systems but a shared IT service desk provided by an external managed service provider, CastleTech Solutions.

### Key Personnel

**Marcus Webb** — OT Security Manager, Albion Energy Storage Ltd. Webb is responsible for the security of the SCADA/ICS environment, including configuration management, access control policy, and vulnerability assessment. He reports to the Head of Operations. Webb has flagged the IT/OT boundary weaknesses in two consecutive quarterly risk reports but has been unable to secure budget for remediation, as the smart grid upgrade consumed available capital.

**Priya Chandra** — SCADA Engineer, Albion Energy Storage Ltd. Chandra is the senior control systems engineer, responsible for PLC programming, HMI configuration, and SIS maintenance. She holds the engineering workstation credentials and is one of only two people authorised to make changes to PLC logic. Chandra is deeply familiar with the battery management safety parameters and the SIS configuration.

**Tom Hadley** — SOC Analyst, CastleTech Solutions (managed service provider). Hadley monitors the IT environment for both Albion and Trent Water from CastleTech's remote security operations centre. He has visibility into the enterprise IT network but no access to or visibility into the SCADA/OT environment — the SOC monitoring contract explicitly excludes OT systems, a boundary that was never revisited after the smart grid integration connected the two networks.

### Safety Instrumented Systems

The facility's Safety Instrumented System (SIS) operates independently of the main SCADA control system on a separate, hardwired safety PLC (SIL 2 rated per IEC 61511). It monitors critical process parameters including individual cell temperatures, rack-level state-of-charge, hydrogen gas concentration in the battery halls, hall ambient temperature, and electrical fault currents. The SIS is designed to initiate an automatic emergency shutdown (ESD) sequence — disconnecting battery racks from the inverters, activating forced-air cooling, and opening the hall ventilation dampers — if any monitored parameter exceeds its defined safe operating threshold. The SIS also controls the fixed fire suppression system in the battery halls. The SIS was certified at commissioning and has not been modified since — a firmware update released by the SIS vendor eighteen months ago, which addresses a known vulnerability in the SIS engineering protocol, has not been applied because doing so would require the safety function to be taken offline and the SIS to be recertified under IEC 61511 — a process estimated to take eight weeks and cost £180,000.

---

## 3. Threat Actors

### Group 1: "Ferryman Collective" — Initial Access Broker / Cybercrime Group

The Ferryman Collective is a financially motivated cybercrime group operating primarily as an initial access broker (IAB). Based in south-eastern Europe and loosely affiliated with several ransomware-as-a-service operations, the Collective specialises in establishing persistent footholds in mid-tier industrial and infrastructure organisations and auctioning that access on dark web forums. Their operational model avoids direct ransomware deployment — they profit by selling verified, persistent access packages to more capable buyers.

The Collective's technical capabilities centre on supply-chain manipulation and social engineering. They maintain a catalogue of exploits for network-connected peripheral devices — printers, IP cameras, UPS management interfaces — that are frequently overlooked in enterprise vulnerability management programmes. Their preferred initial access technique involves identifying a target organisation's peripheral device inventory through Shodan reconnaissance and open-source intelligence, then crafting a social engineering approach to introduce manipulated firmware or malicious USB devices. The Collective targets energy and utilities organisations because these sectors tend to have complex, multi-vendor device estates with long procurement cycles and inconsistent patching — ideal conditions for peripheral device exploitation. Their operations are patient; a typical engagement runs six to eight weeks from initial reconnaissance to verified access sale, with careful operational security to avoid triggering automated detection.

### Group 2: "GREYMANTLE" — State-Sponsored APT Group

GREYMANTLE is a state-sponsored advanced persistent threat group attributed to a nation-state intelligence service with strategic interest in Western European critical infrastructure. The group's primary missions include intelligence gathering on energy sector operational capabilities, pre-positioning for potential disruptive operations during geopolitical escalation, and developing offensive capabilities against ICS/SCADA environments.

GREYMANTLE maintains a dedicated ICS research capability, including a laboratory environment with representative industrial control hardware for developing and testing attack tooling. They are known to procure initial access from IABs rather than conducting their own initial penetration, allowing them to maintain operational separation between the noisy initial access phase and the stealthy post-exploitation phase. Once inside a target network, GREYMANTLE deploys custom implants with modular capabilities — network reconnaissance, credential harvesting, protocol-specific tools for Modbus and DNP3 interception, and PLC programming utilities that can read, modify, and upload control logic. Their operational tradecraft emphasises stealth and persistence over speed: they may remain dormant in a network for months, mapping the OT environment and developing bespoke attack payloads, before executing their objective. GREYMANTLE's operations against energy infrastructure have previously focused on intelligence collection, but their tooling demonstrates the capability for disruptive and destructive effects — including the ability to manipulate safety parameters on industrial control systems.

---

## 4. Incident Timeline

### Phase 1 — Initial Access and Supply Chain Compromise (Weeks 1–4)

The Ferryman Collective identifies Albion Energy Storage Ltd during a broad reconnaissance sweep of UK energy infrastructure operators. Using Shodan and publicly available procurement records, they identify that the Albion site operates several Konica-pattern multi-function printers with a known firmware vulnerability (a remote code execution flaw in the embedded web management interface, disclosed but unpatched on Albion's devices). Cross-referencing with LinkedIn profiles, they identify CastleTech Solutions as the IT managed service provider and note that CastleTech uses a standardised endpoint management platform across its client base.

In week two, a Collective operative telephones Albion's facilities management desk posing as a representative from the printer vendor's UK service partner. The caller references a legitimate recent service contract renewal (details obtained from a Companies House filing) and explains that a "critical firmware security update" must be applied urgently to the office printers to address a widely reported vulnerability. The caller offers to send a USB drive containing the firmware package by courier, or alternatively to email a download link. The facilities coordinator, following what appears to be a reasonable request from a known vendor, accepts the USB delivery.

Three days later, a courier delivers a professionally packaged USB drive to the Albion reception desk. The USB contains what appears to be a legitimate firmware update utility, but the firmware image has been modified to include a persistent backdoor — a lightweight reverse shell that beacons to a Collective command-and-control server every four hours over HTTPS, blending with normal web traffic. A maintenance technician applies the firmware update to two printers in the shared office area during a routine visit. The printers now host a persistent backdoor accessible from the enterprise IT network.

Over the following two weeks, the Collective uses the printer backdoor to conduct careful reconnaissance of the enterprise network. They identify the Active Directory domain structure, map network subnets, and discover the shared file server used by both Albion and Trent Water. They also identify the historian server's dual-homed network interface and the jump server connecting the enterprise network to the SCADA zone. They deploy a keylogger module on the compromised printer, capturing credentials from print jobs and web traffic passing through the device. Among the credentials harvested is a domain service account used by the CastleTech endpoint management platform — an account with administrative privileges across both Albion and Trent Water endpoints.

Satisfied that they have established persistent, verified access with a clear pathway toward the OT environment, the Collective packages the access credentials, network maps, and pivot point details and lists them for sale on a curated dark web marketplace, pricing the package at twenty-five bitcoin — a premium reflecting the critical infrastructure target and the identified OT pathway.

### Phase 2 — Persistence and Reconnaissance (Weeks 5–8)

GREYMANTLE purchases the access package from the Ferryman Collective within seventy-two hours of its listing. Their operational protocol involves independently verifying the access before deploying their own tooling — they do not trust the IAB's backdoor to remain undetected or exclusive.

In week five, a GREYMANTLE operator activates the printer backdoor and uses the harvested CastleTech service account to establish a secondary foothold on the Albion domain controller. They deploy a custom implant — a service DLL masquerading as a Windows performance monitoring component — that provides encrypted command-and-control communications through DNS-over-HTTPS queries to a legitimate-appearing cloud analytics domain. This implant replaces the Collective's noisier beaconing backdoor as the primary access channel.

Over weeks six and seven, GREYMANTLE conducts methodical reconnaissance of the Albion network. They map the SCADA network topology by analysing traffic patterns on the historian server's dual-homed interface, which provides a passive view of Modbus/TCP and OPC-UA communications between the SCADA server and the PLCs. They identify PLC-BMS and PLC-GRID by their Modbus slave addresses and the register addresses corresponding to battery state-of-charge, cell temperature, charge/discharge current, and grid frequency readings. They catalogue the safety thresholds configured on the SIS by monitoring the historian's time-series data for alarm setpoints. They also discover that the jump server's RDP service is configured to permit bidirectional sessions and that several dormant accounts — including one belonging to a former contractor — remain enabled with default passwords.

In week eight, GREYMANTLE tests its access by issuing a single, innocuous read command to the SCADA server via the jump server, using the dormant contractor account. The command requests the current state-of-charge value for Battery Rack A1 — a read-only query that generates no alarm and is indistinguishable from a routine historian poll. The test confirms live, authenticated access to the SCADA environment.

### Phase 3 — IT to OT Pivot (Week 9)

With the SCADA environment mapped and access verified, GREYMANTLE prepares its operational tooling. They develop a custom Modbus/TCP injection module capable of issuing write commands to PLC registers, and a separate tool for modifying SIS alarm setpoints via the SIS engineering protocol — the same protocol for which the unpatched firmware vulnerability exists.

The pivot into the OT environment proceeds through two pathways simultaneously. First, the operator uses the dormant contractor account to establish an RDP session through the jump server to an engineering workstation in the control room (HMI-ENG-02), which is powered on but unoccupied during the night shift. From this workstation, they have direct network access to the SCADA server, the PLCs, and — because the SIS engineering port is reachable from the SCADA network segment — the Safety Instrumented System.

Second, the dual-homed historian server is used as a passive relay for Modbus/TCP traffic. GREYMANTLE installs a lightweight proxy on the historian that forwards crafted Modbus packets from the enterprise network to the SCADA network, providing a secondary communication channel that does not require the RDP session to remain active.

The jump server logs the RDP session, but Tom Hadley at CastleTech's SOC does not receive these logs — OT-zone jump server logs are outside the SOC monitoring scope. Marcus Webb's OT security monitoring is limited to a weekly manual review of jump server access logs, last performed four days earlier.

### Phase 4 — ICS Targeting and Safety Consequence (Week 9, continued)

The attack is executed during the early hours of a Saturday morning, when the facility operates with a single control room operator (a junior shift technician monitoring HMI-OPS-01) and no engineering staff on site.

**Step 1 — Sensor data falsification.** GREYMANTLE's Modbus injection tool begins writing falsified values to the PLC-BMS holding registers that report cell temperature and state-of-charge for Battery Racks A1 through A4. The falsified readings show cell temperatures at 28°C (actual: 36°C and rising due to a genuine minor thermal imbalance that GREYMANTLE has allowed to develop by subtly increasing the charge current over the preceding twelve hours) and state-of-charge at 72% (actual: 94%, approaching full charge). The HMI display in the control room now shows normal, healthy values.

**Step 2 — SIS threshold manipulation.** Using the known vulnerability in the SIS engineering protocol, the operator connects to the SIS safety PLC and modifies the thermal runaway protection threshold from 55°C to 85°C — effectively disabling the automatic emergency shutdown for all credible thermal excursion scenarios. The SIS alarm setpoint for hydrogen gas concentration is similarly raised from 1.0% to 3.8% (the lower explosive limit for hydrogen in air is 4.0%). These changes are made through the engineering protocol interface, which does not log modifications or require authentication — the precise weakness that the unpatched firmware update was intended to address.

**Step 3 — Charge command manipulation.** The operator issues a sustained charge command to Battery Racks A1 through A4 via the SCADA server, setting the charge rate to 95% of maximum rated capacity. Under normal conditions, the Battery Management System would refuse this command because the actual state-of-charge (94%) exceeds the configurable charge cutoff threshold (90%). However, because the PLC-BMS registers now report a falsified state-of-charge of 72%, the charge command is accepted. The batteries begin charging at high rate into an already near-full state — a condition that drives cell voltage above the safe upper limit and generates significant heat.

**Step 4 — Thermal excursion develops.** Over the next ninety minutes, cell temperatures in Racks A1 through A4 climb from 36°C through 45°C toward the onset of thermal runaway (typically 60–80°C depending on cell chemistry). The HMI continues to display the falsified 28°C reading. The SIS, with its threshold raised to 85°C, does not trigger. The junior shift technician monitoring HMI-OPS-01 sees nothing abnormal.

**Step 5 — Ancillary effects.** The increased power draw from the aggressive charging triggers an anomalous reading on the grid interface — PLC-GRID reports an unexpected load imbalance that briefly causes a frequency deviation on the local distribution feeder. This is logged by National Grid ESO's automatic frequency response monitoring but is within the tolerance band and does not trigger an immediate investigation. The shared site building management system registers a gradual rise in Battery Hall 1 ambient temperature, but the HVAC system responds automatically and no alarm is generated at the BMS level.

### Phase 5 — Detection and Response (Week 9, Saturday morning)

At 06:15, SCADA engineer Priya Chandra arrives at the facility for a scheduled maintenance window — a pre-planned firmware review on PLC-GRID unrelated to the attack. As part of her pre-work walkdown, Chandra enters Battery Hall 1 to conduct a visual inspection. She immediately notices that the ambient temperature in the hall feels elevated — inconsistent with the HMI's display of normal operating temperatures. She checks an analog thermometer mounted on the wall near Rack A2 — a legacy instrument not connected to the digital monitoring system — and reads 51°C.

Chandra returns to the control room and compares the HMI's reported cell temperature (28°C) with the historian's trend data for the same sensors. She notices that the historian trend shows a smooth, unchanging 28°C reading for the past three hours — an unnatural pattern for a system that typically fluctuates by 1–2°C with ambient conditions and load cycles. She suspects sensor failure or data corruption.

At 06:28, Chandra contacts Marcus Webb by telephone. Webb remotely reviews the jump server access logs from his home and discovers the RDP session from the dormant contractor account — active since 01:47. He instructs Chandra to initiate an immediate manual emergency shutdown of Battery Racks A1 through A4 using the hardwired ESD pushbutton on the local control panel in Battery Hall 1 — bypassing the SCADA system and the compromised SIS entirely.

At 06:34, Chandra presses the hardwired ESD button. The local control panel — which is electrically interlocked and independent of the programmable safety PLC — disconnects Racks A1 through A4 from the inverters, opens the DC contactors, and activates the forced-air cooling system and ventilation dampers. Actual cell temperatures at the point of shutdown are estimated at 58°C on the hottest cells — within the thermal pre-cursor zone but below the point of irreversible thermal runaway for the cell chemistry in use.

At 06:41, Webb instructs the junior shift technician to physically disconnect the jump server from the network by removing its Ethernet cables. He then contacts CastleTech SOC to report a suspected cyber intrusion and requests immediate isolation of all enterprise network connections to the Albion site. Tom Hadley, now alerted to the OT dimension of the incident for the first time, initiates the CastleTech major incident protocol.

At 07:00, Webb contacts the NCSC and the facility's designated competent authority under the NIS Regulations 2018 to file an initial incident notification. An evacuation of the battery halls is ordered as a precaution pending confirmation that thermal conditions are stabilising.

The facility remains offline for six weeks while forensic investigation, SIS recertification (including application of the deferred firmware update), and network architecture remediation are conducted. National Grid ESO temporarily reallocates Albion's grid balancing commitments to alternative providers. Trent Water Services discovers that the shared file server contained infected documents that had been opened on a Trent Water workstation, prompting a parallel investigation of potential compromise of the water pumping control system.

---

## 5. Learner Decision Points

The following decision moments present clear trade-offs between security, safety, and operational objectives. Each is designed to generate discussion about the tensions inherent in security-informed safety management.

**Decision 1 — The SIS Firmware Patch (Pre-Incident)**
A firmware update is available that closes the vulnerability in the SIS engineering protocol. Applying it requires taking the SIS offline for recertification under IEC 61511 — a process estimated at eight weeks and £180,000. During recertification, the thermal runaway automatic shutdown protection would be unavailable, requiring manual monitoring (continuous human presence in the battery halls). Do you apply the patch and accept the interim safety degradation, or defer the patch and accept the ongoing cyber vulnerability?

**Decision 2 — SOC Monitoring Scope**
The managed SOC contract with CastleTech excludes OT/SCADA systems. Extending monitoring to include OT would require CastleTech engineers to have network access to the SCADA zone and familiarity with ICS protocols — introducing new access pathways into the OT environment. Do you extend the SOC scope (improving detection but increasing attack surface) or maintain the boundary (preserving OT isolation but accepting a detection blind spot)?

**Decision 3 — The Anomalous HMI Reading**
You are the shift technician on duty when Priya Chandra reports a discrepancy between the HMI temperature reading and a local analog gauge. The HMI shows normal values; the analog gauge shows dangerously elevated temperatures. Do you trust the digital system (which has been reliable for years) or the analog gauge (which could be miscalibrated)? If you act on the analog reading, you must initiate an emergency shutdown that will take the facility offline for hours, with financial penalties under the grid services contract.

**Decision 4 — Network Isolation During the Incident**
You are Marcus Webb, and you have confirmed an active intrusion on the SCADA network. Isolating the entire site network will cut off the SCADA server from the PLCs, meaning that if any battery racks other than A1–A4 develop thermal issues, the control system will not be able to respond automatically. Do you isolate immediately (stopping the attacker but losing automated control) or maintain connectivity while attempting to contain the intrusion surgically?

**Decision 5 — Shared Infrastructure with Trent Water**
After the incident, forensic evidence confirms that the shared file server was used as a lateral movement pathway. Trent Water's water pumping SCADA system may be compromised. Do you notify Trent Water immediately (risking public disclosure and regulatory escalation before the investigation is complete) or complete your own investigation first (risking continued compromise of a water supply system)?

**Decision 6 — Post-Incident Disclosure to National Grid ESO**
The incident caused a brief frequency deviation on the local distribution feeder. National Grid ESO has not flagged this as an issue. Are you obligated to report the cyber-induced frequency event, and if so, does the NIS Regulations 72-hour notification to the competent authority also require parallel notification to the grid operator?
