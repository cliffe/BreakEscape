---
title: "SIS02 Energy - Albion Energy Grid Attack Investigation"
author: ["Dr Chris Lewin", "Break Escape Team"]
license: "CC BY-SA 4.0"
overview: |
  This scenario explores how cybersecurity and functional safety intersect in critical infrastructure. You will investigate a sophisticated cyber attack on an energy storage facility, where attackers have progressed from the corporate IT network into the operational technology (OT) environment. The scenario demonstrates the unique challenges of incident response in systems where cyber security failures directly create physical safety hazards—where disabling a protection system doesn't just mean losing security, it means losing the safeguards that prevent equipment damage or grid instability.
description: |
  Investigate an advanced cyber attack on an energy storage facility that has progressed from IT networks into operational technology systems. Learn about industrial control systems (ICS), safety instrumented systems (SIS), IT/OT convergence risks, and the regulatory frameworks governing critical energy infrastructure. Through this game-based learning scenario, you will experience how incident response decisions in OT environments must balance security containment against safety considerations, and coordinate across organizational cultures where IT and OT teams have fundamentally different priorities.
cybok:
  - ka: "SIS"
    topic: "Language and Concept Alignment"
    keywords: ["ICS/SCADA terminology", "bridging IT and OT", "Safety Instrumented Systems"]
  - ka: "SIS"
    topic: "Incident Response and Resilience"
    keywords: ["OT incident investigation", "SCADA forensics", "safety system integrity verification"]
  - ka: "SIS"
    topic: "Requirements Reconciliation"
    keywords: ["security containment vs operational continuity", "24/7 critical infrastructure", "safety-first prioritization"]
  - ka: "SIS"
    topic: "Patching of Systems with Safety Cases"
    keywords: ["SIL ratings", "safety certification", "OT patch validation"]
  - ka: "SIS"
    topic: "Architecture"
    keywords: ["Industrial DMZ", "IT/OT segmentation", "SIS independence"]
  - ka: "SIS"
    topic: "Organisational Culture"
    keywords: ["IT security teams", "operations staff", "safety engineers", "incident coordination"]
  - ka: "SIS"
    topic: "Tools and Standards"
    keywords: ["IEC 62443", "NERC CIP", "IEC 61508", "Purdue Model"]
  - ka: "CPS"
    topic: "Cyber-Physical Systems Domains"
    keywords: ["industrial control systems", "electric power grids"]
  - ka: "RMG"
    topic: "Risk Assessment and Management Principles"
    keywords: ["cyber-physical systems", "incident response and recovery planning"]
  - ka: "LR"
    topic: "Other Regulatory Matters"
    keywords: ["industry-specific regulations", "grid security standards"]
---

## Introduction: Key Concepts

**Industrial Control Systems (ICS)** are specialized computer systems that monitor and control physical processes in critical infrastructure like power grids, water treatment, manufacturing, and transportation. Unlike typical IT systems focused on processing data, ICS must prioritize continuous availability and predictable, real-time response. Examples include SCADA (Supervisory Control and Data Acquisition) systems that monitor sensor data and PLC (Programmable Logic Controller) devices that execute control logic. The challenge for cybersecurity is that traditional IT security practices like taking systems offline for patching or performing intrusive security monitoring can disrupt critical operations, creating a fundamental tension between security and operational needs.

**Safety Instrumented Systems (SIS)** are specialized control systems designed specifically to bring processes into a safe state when dangerous conditions are detected. In energy systems, an SIS might include emergency shutdown devices, overcurrent protectors, or load-shedding systems that automatically prevent catastrophic failures. These systems are certified to specific Safety Integrity Levels (SIL ratings) through rigorous engineering validation. The critical point is that SIS functions are often *independent* from normal control systems—they have separate networks, separate sensors, and separate logic—specifically to ensure that if regular systems are compromised, the safety system still works. A cyber attack that corrupts an SIS is particularly dangerous because it removes the protective mechanism that prevents physical hazards.

**IT/OT Convergence** refers to the increasingly connected relationship between corporate IT networks (where business systems run) and OT networks (where control systems run). Modern industrial facilities often connect engineering workstations, remote access tools, and data analytics systems that bridge IT and OT. While this enables better monitoring and remote maintenance, it also creates attack pathways—an attacker compromising the corporate network can potentially pivot into the OT environment. The challenge is designing this connectivity in ways that allow necessary data flow while maintaining security and safety isolation.

**Incident Response in OT Environments** follows different principles than enterprise IT incident response. In IT, the typical response to a breach is rapid isolation (take systems offline, block network segments). In OT, this same response can have serious consequences: isolating the OT network might disable real-time monitoring, emergency shutdown systems might require network connectivity, and taking SCADA systems offline could disrupt critical operations or trigger safety hazards. An incident responder must coordinate across IT security teams (who want rapid containment) and operations teams (who prioritize uptime and safety), and make decisions where the traditional security response creates operational and safety consequences.

**Regulatory Frameworks** like IEC 62443 (industrial control system security), NERC CIP (grid security standards), and IEC 61508 (functional safety) provide requirements and standards for OT security. These regulations often conflict with operational realities or create specific compliance obligations that constrain incident response options. Understanding these frameworks is essential for making decisions that satisfy both security and regulatory requirements.

## What You Will Do

You will play through an interactive game-based learning scenario set at Albion Energy Storage, a facility managing lithium-ion batteries for grid energy storage. The scenario simulates a real-time incident response situation where you must investigate how attackers have compromised the facility's SCADA system and potentially tampered with the Safety Instrumented System (SIS). Your investigation will involve talking to operational staff and security teams, examining system logs and configurations, making decisions about network isolation and emergency shutdown procedures, and assessing the risk to grid operations and public safety. Throughout the scenario, you will experience how security decisions have visible consequences—isolating networks disables monitoring, triggering emergency shutdown has timing implications, and every action creates ripple effects across technical systems and organizational responses.

## Security-Informed Safety: Core Concepts

This scenario demonstrates how cyber attacks on energy infrastructure can directly threaten grid stability and public safety. In operational technology (OT) environments, the convergence of IT and OT creates pathways for attacks to compromise safety-critical control systems.

### The Security→Safety Hazard Chain

This scenario demonstrates: **Cyber Attack → Loss of Functional Safety → Emergent Physical Hazard**

1. **Cyber Attack**: Sophisticated intrusion from corporate IT network into operational technology environment
2. **IT/OT Boundary Crossing**: Attackers pivot through Industrial DMZ to reach SCADA systems and potentially PLCs
3. **Safety System Targeting**: Critical question - did attackers access the Safety Instrumented System (SIS)?
4. **Loss of Functional Safety**: If safety trip points, emergency shutdown logic, or protective relays are compromised, the grid loses protective mechanisms
5. **Emergent Physical Hazard**: Equipment damage, grid instability, cascading failures affecting public infrastructure, potential electrical hazards

Your investigation traces this chain to determine how far the attack progressed and what safety margins remain.

## Playing the Scenario

### Background and Mission

You are responding as a security incident responder arriving at Albion Energy Storage, a facility managing lithium-ion batteries that store energy for grid distribution. This morning, control room operators noticed something unusual: the SCADA system's temperature sensors are showing flat-line readings (no variation), which is suspicious. You're being called in to investigate whether the SCADA system has been compromised. Critically, there's also concern about whether the Safety Instrumented System (SIS)—which is supposed to prevent dangerous hydrogen gas buildup in the battery thermal management system—might have been tampered with.

Your mission is to:
- Determine if and how attackers gained access to the OT network
- Verify whether the Safety Instrumented System has been compromised
- Assess the risk to grid operations and the safety of the facility
- Coordinate incident response across IT security and operations teams with different priorities
- Make decisions about network isolation and emergency shutdown that have cascading consequences

### How to Play

The game is a top-down 2D exploration scenario. You navigate through a physical environment (SCADA control room, battery hall, engineering workshop) by moving your character with arrow keys or mouse clicks. You interact with NPCs (non-player characters) by talking to them—they are operators, safety engineers, security managers, and external investigators. You'll examine interactive objects like computer terminals, alarm panels, and control systems. Your conversations and investigations will uncover evidence, trigger system status updates, and lead to decision points where you choose how to respond. The scenario is designed to be open-ended; you can pursue investigation paths in any order, but certain actions have consequences.

### What You're Aiming For

By the end of the scenario, you should have a complete understanding of:
1. **The attack chain**: How attackers moved from the corporate IT network into the OT environment
2. **The safety impact**: Whether the SIS has been compromised and what the physical consequences could be
3. **The security-safety trade-offs**: Which incident response decisions create safety or operational consequences
4. **The organizational challenges**: How different teams (IT security, operations, safety) have different priorities and communication barriers

### Getting Started

1. **Read the Information Pack**: Start by reading `information_pack.md` in this directory to understand the facility's network architecture, SCADA systems, SIS components, and the incident timeline
2. **Launch the Scenario**: Load **SIS02 Energy** from the BreakEscape scenario selection screen
3. **Initial Orientation**: Explore the control room, talk to the available NPCs, and understand the current situation before starting your investigation

## Reflection Questions

After completing the scenario, reflect on these questions to consolidate your learning:

**Understanding the Attack**
1. How did attackers initially compromise the corporate IT network, and what path did they use to reach OT systems?
2. What specific vulnerabilities or architectural weaknesses enabled the IT-to-OT pivot?

**Safety Impact Assessment**
3. Was the Safety Instrumented System compromised? What evidence supports your conclusion?
4. What safety hazards could result if the attack had progressed further or remained undetected?

**Incident Response Decisions**
5. What decisions did you make about network isolation, emergency shutdown, or system restoration? How did each decision affect both security and operational/safety consequences?
6. How did the competing priorities of different teams (IT security wanting rapid containment, operations wanting to maintain monitoring, safety engineers wanting to preserve SIS independence) influence your response?

**System Architecture and Defense**
7. Looking back at the network architecture, where did defense-in-depth layers succeed in limiting the attack, and where did they fail?
8. How well did the Industrial DMZ (IDMZ) perform its role in separating IT and OT networks?

**Regulatory and Standards Context**
9. Review the information pack section on IEC 62443 and NERC CIP standards. How would regulatory requirements have constrained your incident response decisions?

## Additional Resources

- Review the **Information Pack** (`information_pack.md`) for detailed explanations of system architecture, ICS protocols, SIS components, and regulatory frameworks
- Refer to **IEC 62443** documentation for industrial automation security standards
- Review **NERC CIP** standards for grid cybersecurity requirements
- Consult the **Purdue Model** for understanding ICS network segmentation zones
- Research **ICS protocols** (Modbus, DNP3, IEC 61850) to understand the technical foundation of industrial control communications
