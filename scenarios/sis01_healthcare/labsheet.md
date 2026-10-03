---
title: "SIS01 Healthcare - Northgate General Hospital Incident Response"
author: ["Z. Cliffe Schreuders", "Oleg Illiashenko"]
license: "CC BY-SA 4.0"
overview: |
  This scenario explores how cybersecurity and functional safety intersect in healthcare environments. You will respond to a ransomware attack at a hospital that has encrypted systems across the enterprise network, and there's immediate concern about whether medical device networks have been affected. The scenario demonstrates the critical challenge of incident response in healthcare: how to conduct rapid forensic investigation and system restoration while prioritising patient safety, managing 24/7 clinical operations that cannot simply be "shut down," and navigating the tension between IT security and clinical staff who have fundamentally different perspectives on risk and response priorities.
description: |
  Investigate a ransomware attack at Northgate General Hospital where IT systems are encrypted and there are concerns about potential safety implications for connected medical devices. Learn about medical device security, functional safety in healthcare, network segmentation between IT and medical device networks, incident response in clinical environments, safety cases, and the UK regulatory framework (UK GDPR, the NIS Regulations, the MHRA and the NHS Data Security and Protection Toolkit). Through this game-based learning scenario, you will experience how security decisions directly affect patient safety and clinical operations, and coordinate across organisational cultures where IT security, clinical engineering and clinical staff have competing priorities.
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
    keywords: ["medical device regulation", "safety re-validation", "MHRA and UK MDR implications"]
  - ka: "SIS"
    topic: "Architecture"
    keywords: ["IT/medical device network segmentation", "defence in depth", "safety isolation"]
  - ka: "SIS"
    topic: "Organisational Culture"
    keywords: ["IT security teams", "clinical staff", "biomedical engineers", "stakeholder coordination"]
  - ka: "SIS"
    topic: "Tools and Standards"
    keywords: ["IEC 80001-1", "ISO 14971", "IEC 62304", "DCB0129 and DCB0160", "NHS DSPT"]
  - ka: "CPS"
    topic: "Cyber-Physical Systems Domains"
    keywords: ["medical devices", "security and privacy concerns"]
  - ka: "RMG"
    topic: "Risk Assessment and Management Principles"
    keywords: ["cyber-physical systems", "incident response and recovery planning"]
  - ka: "LR"
    topic: "Data Protection"
    keywords: ["personal data breach notification", "UK GDPR Articles 33 and 34"]
  - ka: "LR"
    topic: "Other Regulatory Matters"
    keywords: ["NIS Regulations 2018", "duty of candour", "healthcare security standards"]
categories: ["security_informed_safety"]
tags: ["security-informed-safety", "healthcare", "medical-devices", "incident-response", "risk-management", "safety-case", "gsn", "network-segmentation", "uk-gdpr", "break-escape"]
type: ["game-based-learning", "lab-sheet"]
source: "https://github.com/cliffe/BreakEscape/blob/main/scenarios/sis01_healthcare/labsheet.md"
---

## Introduction: Key Concepts {#introduction-key-concepts}

**Medical Devices and Safety-Critical Systems** in healthcare include devices like infusion pumps, ventilators, cardiac monitors, and other connected equipment that directly affect patient safety. Many modern medical devices have multiple components: the medical software running on the device itself, network connectivity to hospital IT systems for data sharing and remote monitoring, and safety mechanisms like dose limits, alarm systems, and automatic interlocks. The challenge is that these devices need to be networked to provide coordinated patient care and enable remote monitoring, but network connectivity creates cybersecurity risks. A compromised device or network could theoretically deliver incorrect medications, disable patient monitoring, or silence safety alarms.

**Safety Instrumented Systems (SIS) in Medical Devices** are the specific safety mechanisms built into devices to protect patients. For example, an infusion pump might have a maximum dose limit that the device will not exceed, regardless of what a clinician tries to program. These safety features are verified when the device is assessed for UKCA or CE marking, and the MHRA regulates them once the device is in service. If a cyber attack could modify these safety parameters (the dose limits, alarm thresholds, or interlock logic), it would compromise the device's safety case. A changed limit can do more than remove a guardrail: a raised minimum makes the pump challenge a correct dose and invite a wrong one. This creates a dilemma: the device is medically necessary and cannot be removed from service, but security concerns require investigation and potentially isolation or updates that could invalidate the device's safety certification.

**Network Segmentation in Healthcare** aims to separate clinical systems (medical devices, EHRs, patient monitoring) from general IT systems (email, business applications). The theory is that if business systems are compromised by ransomware or general malware, the isolation will prevent that malware from reaching medical devices. The reality is that isolation is often incomplete: shared authentication systems, emergency access overrides, wireless networks, and legitimate data-sharing requirements mean that the boundary between IT and medical networks is often porous. An incident responder must assess whether the separation held, and make decisions about isolation that might reduce clinical capabilities.

**Incident Response in Healthcare** follows different priorities than enterprise IT incident response. In enterprise IT, the priority is rapid containment, isolation, and restoration from backups. In healthcare, patient safety is the top priority. If isolating the network means losing electronic patient records and allergy checks on the wards, clinicians will resist isolation. If restoring from backups means updating medical devices in ways that are not yet validated for safety, biomedical engineers will resist the restore. An incident responder must coordinate across these different professional cultures and make decisions where the traditional security response creates patient safety or operational consequences.

**Regulatory Frameworks** in UK healthcare include UK GDPR (personal data, enforced by the ICO), the NIS Regulations 2018 (NHS trusts report significant incidents to NHS England), MHRA regulation of medical devices, the NHS Data Security and Protection Toolkit, and the NHS clinical risk management standards DCB0129 and DCB0160. They can pull against each other. UK GDPR Article 33 requires the ICO to be told within 72 hours of the Trust becoming aware of a breach, before any thorough investigation is finished; the report can describe measures taken or proposed and be completed in phases. Patching a medical device needs safety re-validation. Understanding these frameworks is essential for making decisions that satisfy security, safety and regulatory requirements at once.

## What You Will Do {#what-you-will-do}

You will play through an interactive game-based learning scenario set at Northgate General Hospital on the morning after a ransomware attack. The scenario simulates a real-time incident response situation where you must investigate how the ransomware compromised the hospital's systems, determine if medical device networks have been affected, verify the safety of the InfusionGuard smart infusion pump system, and manage the 72-hour regulatory deadline for ICO (Information Commissioner's Office) breach notification. Your investigation will involve talking to nursing staff, the IT security manager, a clinical safety engineer, the CIO, the Caldicott Guardian, a pharmacist and an NCSC investigator. You will examine system logs, make decisions about network isolation and backup restoration, verify drug library integrity, and navigate the tension between conducting a thorough security investigation and restoring clinical operations to protect patients. Throughout the scenario, you will experience how security decisions have visible consequences—isolating the network takes electronic records and allergy checks off the wards, restoring backups could reinfect systems if the isolation isn't complete, and every action creates ripple effects across clinical operations and patient care.

## Security-Informed Safety: Core Concepts {#security-informed-safety-core-concepts}

This scenario explores the critical intersection between cybersecurity and functional safety in healthcare environments. In safety-critical systems like medical devices, cyber attacks can directly compromise safety functions, creating physical hazards to patients.

### CyBOK Security-Informed Safety Topics Covered {#cybok-security-informed-safety-topics-covered}

This scenario addresses the following topics from the CyBOK Security-Informed Safety topic guide:

- **Language and Concept Alignment**: Bridging security and safety terminology across IT and clinical engineering teams
- **Incident Response and Resilience**: Healthcare-specific IR challenges balancing forensic investigation with patient safety *(core focus)*
- **Requirements Reconciliation**: Security controls vs. clinical workflow requirements and 24/7 operational constraints
- **Patching of Systems with Safety Cases**: regulated medical devices and what a change does to their safety case
- **Architecture**: Network segmentation between IT and medical device networks, architectural security boundaries
- **Organisational Culture**: Multi-stakeholder coordination across IT security, biomedical engineering, and clinical teams
- **Tools and Standards**: IEC 62443-4-2, IEC 80001-1, ISO 14971, DCB0129/DCB0160, NHS DSPT

### The Security→Safety Hazard Chain {#the-security-safety-hazard-chain}

This scenario demonstrates the chain: **Cyber Attack → Loss of Functional Safety → Emergent Physical Hazard**

1. **Cyber Attack**: Ransomware compromise of hospital IT network
2. **Safety Boundary Crossing**: Investigation reveals potential access to medical device network
3. **Loss of Functional Safety**: Critical question - were InfusionGuard safety functions (dose limits, alarm systems, interlock mechanisms) compromised?
4. **Emergent Physical Hazard**: If safety functions are disabled or parameters altered, patients could receive incorrect medication doses

Your investigation must determine if this chain was completed and what safety consequences may have occurred or could still occur.

## Playing the Scenario {#playing-the-scenario}

### Background and Mission {#background-and-mission}

You are a security incident responder arriving at Northgate General Hospital on the morning after a ransomware attack. Overnight, systems across the hospital's enterprise network have been encrypted, the EHR (Electronic Health Record) is offline, and clinical systems on the ward are beginning to be affected. Nursing staff are concerned about patient safety—they're losing visibility into automated infusion pump settings and can't see real-time patient monitoring data. Management is also concerned about regulatory obligations: UK GDPR requires the Trust to notify the ICO within 72 hours of becoming aware of a personal data breach, and the NIS Regulations require a report to NHS England, creating an urgent timeline.

Your mission is to:
- Investigate how the ransomware initially compromised the hospital's systems
- Determine whether the attack has crossed the boundary into medical device networks
- Verify the integrity and safety of the InfusionGuard smart infusion pump system, including critical drug library parameters
- Make decisions about network isolation and backup restoration that balance security containment with clinical operations
- Meet the 72-hour regulatory notification deadline while conducting a thorough investigation

### How to Play {#how-to-play}

The game is a top-down 2D exploration scenario. You navigate through a hospital environment (ward, IT security office, major incident command room) by moving your character with arrow keys or mouse clicks. You interact with NPCs (nurses, the IT security manager, a clinical safety engineer, the CIO, the Caldicott Guardian, a pharmacist and an NCSC investigator) by talking to them—they provide information, react to your decisions, and help you understand the situation. You'll examine interactive objects like computer terminals, infusion pumps, the incident command board and documents. Your conversations and investigations will uncover evidence, trigger system status updates, and lead to decision points where you choose how to respond. The scenario has a time constraint (the 72-hour ICO notification deadline) that creates urgency and forces prioritisation.

### What You're Aiming For {#what-youre-aiming-for}

By the end of the scenario, you should have a complete understanding of:
1. **The attack chain**: How ransomware moved from the initial compromise point through the enterprise network
2. **The safety impact**: Whether medical device networks were affected and whether the InfusionGuard's safety functions are still operating correctly
3. **The security-safety trade-offs**: Which incident response decisions create clinical or safety consequences (e.g., network isolation takes the wards' read-only view of the EHR and the pump console, backup restoration timing affects reinfection risk)
4. **The organisational challenges**: How different teams (IT security focused on containment, clinical staff focused on patient care, clinical engineers focused on device safety) have different perspectives and priorities

### Getting Started {#getting-started}

1. ==action: Read the [Information Pack](/HacktivityLabSheets/labs/security_informed_safety/sis01-healthcare-information-pack/)== to understand the hospital's network architecture, medical device systems, InfusionGuard safety requirements, the UK regulatory context (UK GDPR, NIS, MHRA, DSPT), and the incident timeline
2. ==action: Launch **SIS01 Healthcare**== from the BreakEscape scenario selection screen
3. ==action: Explore Ward 7 and talk to the staff==, then take stock of the current clinical and operational status before starting your investigation

## Reflection and Exercises {#reflection-and-exercises}

Work through these after you have finished the scenario. Use your own run: the debrief with Priya S. and the closing credits list what happened to each patient, claim and notification, and your choices will differ from other players'.

> Tip: In a group, split the exercises between IT-track and clinical-track players and compare answers at the end.

Each section opens with questions to discuss, then exercises that produce something you can hand in or present.

### 1. Risk Management {#1-risk-management}

Nothing that failed at Northgate was new. Each failure had been known about, and in most cases someone had decided to live with it.

**Questions**

> Question: Q1. Three risks had been accepted long before the attack: the contractors' MFA exemption on the VPN, the vendor's persistent VPN into the clinical zone, and the Ward 7 segment that was never migrated. For one of them, who owned it, what likelihood and impact were assumed when it was accepted, and what should have triggered a review?

> Question: Q2. The internal audit found the Trust had no register of medical device risks. What difference would one have made to the drug library change made at quarter to seven on Monday evening?

> Question: Q3. Isolating the network removed one risk and created another: wards lost electronic records and allergy checks. Which risk did you accept, which compensating controls reduced it, and what residual risk was left? Who should own that residual risk?

> Question: Q4. Helen Carver pressed to bring systems back for the Trust; David Osei said the safety case did not hold until the drug library was verified. How would you put that trade-off to the Board? What does "as low as reasonably practicable" (ALARP) ask of each of them?

> Question: Q5. The ransom was never a serious option, but someone always asks. Using likelihood and impact, explain why paying would not have reduced the patient safety risk on Ward 7.

**Exercises**

> Action: **E1. Risk register entry.** Write the register entry the Trust should have had for the contractor VPN account (`m.blake`). Include: the risk as cause, event and consequence; the risk owner; likelihood and impact on a 5×5 scale before and after controls; the existing controls; the treatment decision (avoid, reduce, transfer or accept) with a reason; and a review trigger.

> Action: **E2. Then and now.** Plot the three accepted risks from question 1 on a 5×5 likelihood × impact matrix twice: as they were probably scored when accepted, and as they turned out on Monday. Explain in a paragraph what changed: the threat, the impact, or the assumptions behind the scores.

> Action: **E3. Bow-tie.** Draw a bow-tie for the top event "a patient's infusion pump runs at the wrong morphine rate". Put threats on the left (including the tampered drug library) and consequences on the right, with preventive and mitigating barriers between them. Mark which barriers the attack defeated, which held in your run, and which depended on a person (the second check, querying pharmacy).

### 2. Incident Response {#2-incident-response}

**Questions**

> Question: Q6. How did the attacker get in, and how did the ransomware spread? Which evidence in the game (SIEM alerts, VPN logs, printouts) told you, and what would you still want to know?

> Question: Q7. List the decisions you made in order: isolation, backup source, the Bed 2 pump, escalating Bed 4, notifications. Which did you make on evidence, and which under time pressure on assumption?

> Question: Q8. Network isolation needed sign-off from both IT security and clinical engineering. Did dual authorisation slow you down? What hazard does it guard against, and when, if ever, should a responder act without it?

> Question: Q9. Restoring from backup before the network was isolated risked reinfection. How did you choose a backup source, and what did you trade off between recovery time and confidence the backup was clean?

> Question: Q10. Helen wanted containment before telling the ICO. Under UK GDPR Article 33, when did the Trust's 72 hours start, what could the first notification say while the investigation was still running, and who else had to be told (NHS England under the NIS Regulations, the NCSC, patients under Article 34, and anyone harmed by their care under the duty of candour)?

> Question: Q11. Mr Ahmed in Bed 4 was deteriorating while nobody was watching his monitor. Why is escalating a clinical concern part of a cyber incident response, and whose job was it?

**Exercises**

> Action: **E4. Incident timeline.** Build a timeline from the Monday morning VPN login to the end of your run. Mark the initial access, the drug library change, encryption, the point the Trust became aware, each notification and deadline, and each of your decisions. Highlight any gap where nobody owned a task.

> Action: **E5. Initial ICO notification.** Draft the first notification to the ICO in no more than 250 words, written as the Trust would have sent it on Tuesday morning. Cover what Article 33(3) asks for (the nature of the breach, the categories and approximate numbers of people and records affected, a contact point, likely consequences, and measures taken or proposed), and say plainly which parts are not yet known and will follow.

> Action: **E6. Learning response.** England's NHS now reviews patient safety incidents under PSIRF, which looks for system causes rather than individual blame. Write three improvement actions for Northgate in that style: each names a system weakness the incident exposed, the action, an owner and how the Trust would know it worked.

### 3. Security-Informed Safety {#3-security-informed-safety}

The hazard chain at Northgate was: **cyber attack → loss of a safety function → physical hazard to a patient**. Security-informed safety asks how a safety case must change once you accept that someone may be trying to defeat it.

**Questions**

> Question: Q12. Pick one safety case claim from the scenario (CLAIM-HC-001 segmentation, CLAIM-HC-003 drug library change control, or CLAIM-HC-007 integrated incident response). Was it valid before the attack began? Which part failed: the claim, the argument or the evidence?

> Question: Q13. The tampered drug library raised the morphine minimum, so the pump challenged a correct dose as too low. Why is that more dangerous than simply removing a limit? How does it turn the habit of clearing pump warnings, a form of normalisation of deviance, into the attacker's tool?

> Question: Q14. A safety case written for accidents assumes faults are random. What changes in the argument when the "fault" is an adversary who knows where the checks are? Give one example from the game.

> Question: Q15. Isolating the network was a security action that created a safety hazard (lost allergy checks). Which claim was meant to catch that kind of hazard, and did the Trust's process honour it in your run?

> Question: Q16. IT security, clinical engineering and nursing each used words like "safe", "contained", "incident" and "restored" differently. Find one moment in the game where that caused, or nearly caused, a wrong decision.

> Question: Q17. Where did defence in depth work, and where did it fail? Was the segmentation between the IT network and the medical device network doing the job the safety case said it did?

**Exercises**

> Action: **E7. Rebuild a claim.** Redraw CLAIM-HC-003 as a Goal Structuring Notation (GSN) fragment that would hold up against a deliberate attacker. Add a strategy that argues over attacker capability as well as random error, evidence such as an integrity check on the drug library and an independent second check at the pump, and one defeater taken from what happened at Northgate.

> Action: **E8. From hazard to requirement.** For the raised-minimum tamper, write the hazard, its security cause, its effect on the patient and the controls that existed. Then write one new security requirement and trace it to the safety requirement it protects.

> Action: **E9. Language alignment.** Write a one-page glossary for the Trust's incident response plan that defines "hazard", "risk", "incident", "contained" and "safe to restore" so that IT security, clinical engineering and ward staff mean the same thing by each.

---

## Additional Resources {#additional-resources}

- Review the [**Information Pack**](/HacktivityLabSheets/labs/security_informed_safety/sis01-healthcare-information-pack/) for detailed explanations of system architecture, medical device systems, safety certification, and regulatory frameworks
- Refer to **MHRA guidance** on the cyber security of medical devices
- Review the **ICO's guidance on personal data breaches** (UK GDPR Articles 33 and 34)
- Consult **NHS Data Security and Protection Toolkit** for UK healthcare security standards
- Research **ISO 14971** and **IEC 80001-1** for medical device risk management on IT networks
- Read NHS England's **Patient Safety Incident Response Framework (PSIRF)** for how incidents are now reviewed
- See the **GSN Community Standard** for Goal Structuring Notation, used in exercise E7
- Read the **NHS clinical risk management standards DCB0129 and DCB0160**, which require hazard logs and clinical safety cases for health IT
