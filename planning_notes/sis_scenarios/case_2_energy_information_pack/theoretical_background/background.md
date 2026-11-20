# Theoretical Background — Energy Sector Security-Informed Safety

A primer for learners and game designers on the concepts underpinning the Albion Energy Storage case study.

---

## 1. IT and OT: A Necessary Distinction

The digital systems that operate a modern energy storage facility fall into two fundamentally different categories, and understanding the distinction is essential to understanding why a cyber attack can create a physical safety hazard.

**Information Technology (IT)** encompasses the systems that process, store, and transmit information for business purposes: email servers, ERP platforms, databases, corporate networks, and user workstations. IT systems are designed around the classic CIA triad, with **confidentiality** typically the highest priority — protecting sensitive data from unauthorised access. IT systems are regularly patched, frequently refreshed (3–5 year lifecycle), and generally designed to tolerate brief outages for maintenance.

**Operational Technology (OT)** encompasses the systems that monitor and control physical processes: SCADA servers, PLCs, RTUs, sensors, and actuators. OT systems directly govern physical equipment — in the energy context, they control battery charge rates, inverter operations, circuit breakers, and cooling systems. For OT, the priority hierarchy is inverted: **availability** is paramount (a control system that goes offline can leave a physical process uncontrolled), followed by **integrity** (a control command must be correct — a falsified sensor reading or an incorrect setpoint can create a physical hazard), with confidentiality typically the lowest priority.

OT systems also operate under constraints that do not apply to IT. They must respond in real time — a safety interlock must activate within milliseconds, not seconds. They have long lifecycles — industrial PLCs may remain in service for 15–25 years, far outlasting the IT equipment that shares their network. And critically, many OT components are **safety-certified**: they have been validated and approved to perform a specific safety function, and any modification — including a security patch — may require formal revalidation.

The **Purdue Reference Model** provides the architectural framework for understanding how IT and OT systems relate to each other. It defines six levels: Level 0 (physical process and field devices), Level 1 (basic control — sensors and actuators), Level 2 (area supervisory control — PLCs), Level 3 (site operations — SCADA, HMI, historian), Level 4 (business planning — ERP, email), and Level 5 (enterprise network — internet, cloud services). The IT/OT boundary traditionally sits between Level 3 and Level 4. The central architectural challenge — and the central security challenge — is managing data exchange across this boundary without allowing threats to traverse it.

---

## 2. The OT Security-to-Safety Pathway

The defining characteristic of OT security risk, and the reason this case study exists within the CyBOK Security-Informed Safety knowledge area, is that a cyber attack on an OT system can produce a **physical safety consequence**. The chain from cyber event to physical hazard follows a characteristic pathway:

**Cyber attack on IT** → **IT/OT boundary crossing** → **Control system manipulation** → **Safety instrumented system failure** → **Physical hazard**

At the Albion facility, this pathway manifested concretely:

1. **Cyber attack on IT**: The Ferryman Collective compromised network printers on the enterprise IT network through a supply chain attack (malicious firmware delivered via social engineering). GREYMANTLE purchased this access and established persistent footholds on the domain controller.

2. **IT/OT boundary crossing**: The attacker traversed the imperfect IT/OT boundary through three weaknesses: the dual-homed historian server (passive reconnaissance), the jump server configured for bidirectional RDP (active access), and legacy Modbus/TCP firewall rules (direct protocol access). None of these pathways should have existed in a properly segmented architecture.

3. **Control system manipulation**: Once on the SCADA network, the attacker issued Modbus/TCP commands to PLC-BMS, falsifying cell temperature and state-of-charge register values and issuing overcharge commands. The SCADA server and HMI accepted the falsified data as ground truth.

4. **Safety instrumented system failure**: The attacker exploited an unpatched vulnerability in the SIS engineering protocol to raise the thermal runaway protection threshold from 55°C to 85°C — effectively disabling the automated emergency shutdown for all credible thermal scenarios. The SIS firmware patch had been available for eighteen months but was deferred because applying it required IEC 61511 safety recertification.

5. **Physical hazard**: The batteries entered an overcharge condition with rising cell temperatures, approaching thermal runaway — a cascading exothermic reaction that can produce fire, toxic gas release (including hydrogen fluoride), and structural damage. Only a manual walkdown by a SCADA engineer, who noticed the discrepancy between the HMI's digital readings and a wall-mounted analog thermometer, prevented catastrophic failure.

This pathway illustrates why OT security cannot be treated as a subset of IT security. The consequence of failure is not data loss or service disruption — it is fire, explosion, toxic release, or grid instability. Security controls in the OT environment are not merely protecting information; they are underpinning physical safety.

---

## 3. Functional Safety and Safety Integrity Levels

### Safety Instrumented Systems

A **Safety Instrumented System (SIS)** is an engineered system designed to detect dangerous process conditions and bring the process to a safe state automatically, independent of the normal control system. In the energy storage context, the SIS monitors battery cell temperatures, hydrogen gas concentrations, and electrical fault conditions, and initiates emergency shutdown if any parameter exceeds a defined safe limit. The SIS is the last automated line of defence between a control system failure and a physical hazard.

The design, certification, and maintenance of SIS in the process industries is governed by **IEC 61511** (Safety instrumented systems for the process industries), with the parent standard **IEC 61508** (Functional safety of electrical/electronic/programmable electronic safety-related systems) providing the underlying framework.

### Safety Integrity Levels

**Safety Integrity Levels (SIL)** quantify the reliability required of a safety function. IEC 61511 defines four levels (SIL 1 through SIL 4), with SIL 4 being the most demanding. The SIL rating determines the maximum allowable probability of the safety function failing to operate when demanded — for a SIL 2 system (as at the Albion facility), the probability of failure on demand (PFD) must be between $10^{-3}$ and $10^{-2}$, meaning the safety function must operate correctly at least 99% to 99.9% of the time when a dangerous condition occurs.

SIL ratings are determined through a hazard and risk assessment process and are assigned to specific safety functions, not to devices. A SIL 2 rating for the thermal runaway protection function means that the entire chain — from the temperature sensor, through the SIS logic solver, to the DC contactor actuation — must collectively meet the SIL 2 reliability target.

### The Patching Constraint

Here lies the most distinctive security-informed safety tension in ICS environments. When a SIS component is certified to a particular SIL, the certification applies to a specific hardware and software configuration. **Any modification to that configuration — including applying a security patch — may invalidate the certification.** Revalidation under IEC 61511 requires a formal process: impact analysis, regression testing, proof testing of the safety function, and independent assessment. This process takes weeks to months and may require the safety function to be taken offline during testing.

This creates a deliberate conflict: security best practice demands prompt patching of known vulnerabilities, while safety assurance demands stability and validation of the certified configuration. At the Albion facility, this tension was resolved in favour of safety stability — the SIS firmware remained unpatched to preserve its certified state — which directly enabled the attacker to exploit the known engineering protocol vulnerability. The alternative — patching the SIS — would have required eight weeks of recertification during which the automated thermal runaway protection would be unavailable, requiring continuous manual monitoring of the battery halls.

Neither choice is risk-free. This is the defining dilemma of security-informed safety in ICS environments.

---

## 4. The ICS Threat Landscape

Energy sector industrial control systems face threats from multiple actor categories with varying motivations and capabilities:

**Opportunistic ransomware groups** target energy organisations for financial extortion. These groups typically attack enterprise IT systems (encrypting business data and demanding payment) and do not intentionally target OT environments. However, because IT and OT networks are increasingly interconnected, ransomware propagation can reach SCADA servers and control workstations inadvertently — causing operational disruption that may have safety consequences even without deliberate OT targeting. The 2021 Colonial Pipeline incident demonstrated how an IT-focused ransomware attack can force the shutdown of critical infrastructure operations as a precautionary measure.

**State-sponsored APT groups** represent the most sophisticated and dangerous threat to energy ICS. These groups — attributed to nation-state intelligence and military services — develop bespoke ICS attack tooling, conduct long-term reconnaissance of target environments, and maintain the patience and operational security to remain undetected for months or years. Their motivations include intelligence gathering on critical infrastructure capabilities, pre-positioning for potential disruptive operations during geopolitical crises, and demonstrating offensive cyber capability as strategic deterrence. Historical examples include the 2015 and 2016 attacks on the Ukrainian power grid, which demonstrated the capability to remotely operate circuit breakers and cause widespread power outages.

**Insider threats** arise from employees, contractors, or third-party service providers with legitimate access to OT systems. Insiders may act maliciously (motivated by grievance, financial inducement, or ideological conviction) or negligently (poor credential hygiene, bypassing security controls for convenience). In either case, their legitimate access bypasses network-based security controls — an insider with credentials for the engineering workstation can modify PLC logic directly, without needing to cross any IT/OT boundary.

**Hacktivists and terrorist groups** occasionally target energy infrastructure for ideological or political purposes, though their technical capabilities against ICS environments have historically been limited compared to state-sponsored actors.

---

## 5. Concept Alignment Glossary

The following table maps key terms across the ICS security and process safety disciplines, helping learners recognise that both communities are often describing the same phenomena using different language.

| ICS Security Term | Process Safety Term | Explanation |
|---|---|---|
| Intrusion / Unauthorised access | Spurious activation / Inadvertent operation | An external entity gains control over a system or process it should not be able to influence |
| Cyber attack on control system | Demand on safety function | An event that requires the safety system to activate in order to prevent harm |
| Security patch (software update) | Modification to safety-certified system | A change to a software component that may require revalidation of its safety certification |
| Containment / Isolation (incident response) | Emergency Shutdown (ESD) | An action that stops or limits the scope of an ongoing harmful condition |
| Attack surface | Hazardous event pathway | The set of routes through which a harmful condition can be initiated |
| Defence in depth | Layers of protection (LOPA) | Multiple independent barriers, each of which can prevent or mitigate a harmful outcome |
| Indicator of Compromise (IoC) | Process alarm / Safety trip signal | A detectable sign that an abnormal or dangerous condition exists |
| Vulnerability (unpatched software) | Degraded safety function | A weakness that reduces the system's ability to prevent or respond to a harmful condition |
| Lateral movement | Common cause failure pathway | A mechanism by which a single initiating event can compromise multiple independent barriers |
| Command and control (C2) channel | Unauthorised control input | A communication pathway through which an external entity issues instructions to the process |
