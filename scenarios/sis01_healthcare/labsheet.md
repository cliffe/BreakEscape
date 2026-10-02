---
title: "SIS01 Healthcare - Northgate General Hospital Incident Response"
author: ["Dr Chris Lewin", "Break Escape Team"]
license: "CC BY-SA 4.0"
overview: |
  This scenario explores how cybersecurity and functional safety intersect in healthcare environments. You will respond to a ransomware attack at a hospital that has encrypted systems across the enterprise network, and there's immediate concern about whether medical device networks have been affected. The scenario demonstrates the critical challenge of incident response in healthcare: how to conduct rapid forensic investigation and system restoration while prioritizing patient safety, managing 24/7 clinical operations that cannot simply be "shut down," and navigating the tension between IT security and clinical staff who have fundamentally different perspectives on risk and response priorities.
description: |
  Investigate a ransomware attack at Northgate General Hospital where IT systems are encrypted and there are concerns about potential safety implications for connected medical devices. Learn about medical device security, functional safety in healthcare, network segmentation between IT and medical device networks, incident response in clinical environments, and regulatory frameworks (HIPAA, FDA, NHS). Through this game-based learning scenario, you will experience how security decisions directly impact patient safety and clinical operations, and coordinate across organizational cultures where IT security, biomedical engineering, and clinical staff have competing priorities.
cybok:
  - ka: "SIS"
    topic: "Language and Concept Alignment"
    keywords: ["medical device security", "bridging IT and clinical terminology", "safety-critical systems"]
  - ka: "SIS"
    topic: "Incident Response and Resilience"
    keywords: ["incident investigation", "forensics", "patient safety impact assessment", "recovery in clinical environments"]
  - ka: "SIS"
    topic: "Requirements Reconciliation"
    keywords: ["security vs operational constraints", "clinical workflow preservation", "regulatory compliance"]
  - ka: "SIS"
    topic: "Patching of Systems with Safety Cases"
    keywords: ["medical device certification", "safety re-validation", "FDA approval implications"]
  - ka: "SIS"
    topic: "Architecture"
    keywords: ["IT/medical device network segmentation", "defense-in-depth", "safety isolation"]
  - ka: "SIS"
    topic: "Organisational Culture"
    keywords: ["IT security teams", "clinical staff", "biomedical engineers", "stakeholder coordination"]
  - ka: "SIS"
    topic: "Tools and Standards"
    keywords: ["IEC 61508", "FDA guidance", "HIPAA", "NHS frameworks"]
  - ka: "CPS"
    topic: "Cyber-Physical Systems Domains"
    keywords: ["medical devices", "security and privacy concerns"]
  - ka: "RMG"
    topic: "Risk Assessment and Management Principles"
    keywords: ["cyber-physical systems", "incident response and recovery planning"]
  - ka: "LR"
    topic: "Data Protection"
    keywords: ["personal data breach notification"]
  - ka: "LR"
    topic: "Other Regulatory Matters"
    keywords: ["industry-specific regulations", "healthcare security standards"]
---

## Introduction: Key Concepts

**Medical Devices and Safety-Critical Systems** in healthcare include devices like infusion pumps, ventilators, cardiac monitors, and other connected equipment that directly affect patient safety. Many modern medical devices have multiple components: the medical software running on the device itself, network connectivity to hospital IT systems for data sharing and remote monitoring, and safety mechanisms like dose limits, alarm systems, and automatic interlocks. The challenge is that these devices need to be networked to provide coordinated patient care and enable remote monitoring, but network connectivity creates cybersecurity risks. A compromised device or network could theoretically deliver incorrect medications, disable patient monitoring, or silence safety alarms.

**Safety Instrumented Systems (SIS) in Medical Devices** are the specific safety mechanisms built into devices to protect patients. For example, an infusion pump might have a maximum dose limit that the device will not exceed, regardless of what a clinician tries to program. These safety features are certified and validated during the device's FDA approval process. If a cyber attack could modify these safety parameters (the dose limits, alarm thresholds, or interlock logic), it would compromise the device's certified safety case. This creates a dilemma: the device is medically necessary and cannot be removed from service, but security concerns require investigation and potentially isolation or updates that could invalidate the device's safety certification.

**Network Segmentation in Healthcare** aims to separate clinical systems (medical devices, EHRs, patient monitoring) from general IT systems (email, business applications). The theory is that if business systems are compromised by ransomware or general malware, the isolation will prevent that malware from reaching medical devices. The reality is that isolation is often incomplete: shared authentication systems, emergency access overrides, wireless networks, and legitimate data-sharing requirements mean that the boundary between IT and medical networks is often porous. An incident responder must assess whether the separation held, and make decisions about isolation that might reduce clinical capabilities.

**Incident Response in Healthcare** follows different priorities than enterprise IT incident response. In enterprise IT, the priority is rapid containment, isolation, and restoration from backups. In healthcare, patient safety is the top priority. If isolating the network means losing patient monitoring capability, clinicians will resist isolation. If restoring from backups means updating medical devices in ways that are not yet validated for safety, biomedical engineers will resist the restore. An incident responder must coordinate across these different professional cultures and make decisions where the traditional security response creates patient safety or operational consequences.

**Regulatory Frameworks** like HIPAA (patient data protection), FDA guidance on medical device cybersecurity, and NHS Data Security and Protection Toolkit (in UK healthcare) provide requirements and expectations. These regulations often create conflicting priorities: HIPAA requires rapid breach notification (72 hours), but thorough investigation takes time; FDA expects security patches on medical devices, but patching requires safety re-validation. Understanding these frameworks is essential for making decisions that satisfy both security, safety, and regulatory requirements.

## What You Will Do

You will play through an interactive game-based learning scenario set at Northgate General Hospital on the morning after a ransomware attack. The scenario simulates a real-time incident response situation where you must investigate how the ransomware compromised the hospital's systems, determine if medical device networks have been affected, verify the safety of the InfusionGuard smart infusion pump system, and manage the 72-hour regulatory deadline for ICO (Information Commissioner's Office) breach notification. Your investigation will involve talking to clinical staff, biomedical engineers, IT security personnel, regulatory inspectors, and nursing teams. You will examine system logs, make decisions about network isolation and backup restoration, verify drug library integrity, and navigate the tension between conducting a thorough security investigation and restoring clinical operations to protect patients. Throughout the scenario, you will experience how security decisions have visible consequences—isolating the medical network disables patient monitoring, restoring backups could reinfect systems if the isolation isn't complete, and every action creates ripple effects across clinical operations and patient care.

## Security-Informed Safety: Core Concepts

This scenario explores the critical intersection between cybersecurity and functional safety in healthcare environments. In safety-critical systems like medical devices, cyber attacks can directly compromise safety functions, creating physical hazards to patients.

### CyBOK Security-Informed Safety Topics Covered

This scenario addresses the following topics from the CyBOK Security-Informed Safety topic guide:

- **Language and Concept Alignment**: Bridging security and safety terminology across IT and clinical engineering teams
- **Incident Response and Resilience**: Healthcare-specific IR challenges balancing forensic investigation with patient safety *(core focus)*
- **Requirements Reconciliation**: Security controls vs. clinical workflow requirements and 24/7 operational constraints
- **Patching of Systems with Safety Cases**: FDA-certified medical devices and safety certification implications
- **Architecture**: Network segmentation between IT and medical device networks, architectural security boundaries
- **Organisational Culture**: Multi-stakeholder coordination across IT security, biomedical engineering, and clinical teams
- **Tools and Standards**: IEC 62443-4-2, FDA guidance, HIPAA, IEC 61508, NHS frameworks

### The Security→Safety Hazard Chain

This scenario demonstrates the chain: **Cyber Attack → Loss of Functional Safety → Emergent Physical Hazard**

1. **Cyber Attack**: Ransomware compromise of hospital IT network
2. **Safety Boundary Crossing**: Investigation reveals potential access to medical device network
3. **Loss of Functional Safety**: Critical question - were InfusionGuard safety functions (dose limits, alarm systems, interlock mechanisms) compromised?
4. **Emergent Physical Hazard**: If safety functions are disabled or parameters altered, patients could receive incorrect medication doses

Your investigation must determine if this chain was completed and what safety consequences may have occurred or could still occur.

## Playing the Scenario

### Background and Mission

You are a security incident responder arriving at Northgate General Hospital on the morning after a ransomware attack. Overnight, systems across the hospital's enterprise network have been encrypted, the EHR (Electronic Health Record) is offline, and clinical systems on the ward are beginning to be affected. Nursing staff are concerned about patient safety—they're losing visibility into automated infusion pump settings and can't see real-time patient monitoring data. Management is also concerned about regulatory obligations: NHS and ICO regulations require breach notification within 72 hours, creating an urgent timeline.

Your mission is to:
- Investigate how the ransomware initially compromised the hospital's systems
- Determine whether the attack has crossed the boundary into medical device networks
- Verify the integrity and safety of the InfusionGuard smart infusion pump system, including critical drug library parameters
- Make decisions about network isolation and backup restoration that balance security containment with clinical operations
- Meet the 72-hour regulatory notification deadline while conducting a thorough investigation

### How to Play

The game is a top-down 2D exploration scenario. You navigate through a hospital environment (ward, IT security office, major incident command room) by moving your character with arrow keys or mouse clicks. You interact with NPCs (nurses, IT security managers, clinical engineers, hospital executives, regulatory inspectors) by talking to them—they provide information, react to your decisions, and help you understand the situation. You'll examine interactive objects like computer terminals, alarm panels, incident command boards, and documents. Your conversations and investigations will uncover evidence, trigger system status updates, and lead to decision points where you choose how to respond. The scenario has a time constraint (the 72-hour ICO notification deadline) that creates urgency and forces prioritization.

### What You're Aiming For

By the end of the scenario, you should have a complete understanding of:
1. **The attack chain**: How ransomware moved from the initial compromise point through the enterprise network
2. **The safety impact**: Whether medical device networks were affected and whether the InfusionGuard's safety functions are still operating correctly
3. **The security-safety trade-offs**: Which incident response decisions create clinical or safety consequences (e.g., network isolation disables monitoring, backup restoration timing affects reinfection risk)
4. **The organizational challenges**: How different teams (IT security focused on containment, clinical staff focused on patient care, biomedical engineers focused on device certification) have different perspectives and priorities

### Getting Started

1. **Read the Information Pack**: Start by reading `information_pack.md` in this directory to understand the hospital's network architecture, medical device systems, InfusionGuard safety requirements, FDA/NHS regulatory context, and the incident timeline
2. **Launch the Scenario**: Load **SIS01 Healthcare** from the BreakEscape scenario selection screen
3. **Initial Orientation**: Explore Ward 7, talk to the available NPCs, and understand the current clinical and operational status before starting your investigation

## Reflection Questions

After completing the scenario, reflect on these questions to consolidate your learning:

**Understanding the Attack**
1. How did the ransomware initially compromise the hospital's systems, and did it successfully cross into medical device networks?
2. What specific vulnerabilities or architectural weaknesses enabled the attack to spread?

**Safety Impact Assessment**
3. Were InfusionGuard safety functions compromised? What evidence supports your conclusion?
4. What patient safety hazards could result if the attack had progressed further or remained undetected?

**Incident Response Decisions**
5. What decisions did you make about network isolation, backup restoration, or device verification? How did each decision affect both security and operational/safety consequences?
6. How did the competing priorities of different teams (IT security wanting rapid containment, clinical staff wanting to maintain patient monitoring, biomedical engineers wanting to preserve device certifications) influence your response?

**System Architecture and Defense**
7. Looking back at the network architecture, where did defense-in-depth layers succeed in limiting the attack, and where did they fail?
8. How well did the segmentation between IT and medical device networks perform its intended role?

**Regulatory and Standards Context**
9. Review the information pack section on HIPAA and FDA medical device cybersecurity guidance. How would regulatory requirements have constrained your incident response decisions?

---

## Additional Resources

- Review the **Information Pack** (`information_pack.md`) for detailed explanations of system architecture, medical device systems, safety certification, and regulatory frameworks
- Refer to **FDA guidance** on medical device cybersecurity for premarket and postmarket considerations
- Review **HIPAA Security Rule** requirements for healthcare data protection
- Consult **NHS Data Security and Protection Toolkit** for UK healthcare security standards
- Research **IEC 61508** functional safety standards and their application to medical device certification
