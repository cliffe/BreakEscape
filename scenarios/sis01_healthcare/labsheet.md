---
title: "SIS01 Healthcare - Northgate General Hospital Incident Response"
author: ["Z. Cliffe Schreuders", "Oleg Illiashenko"]
license: "CC BY-SA 4.0"
overview: |
  This scenario explores how cybersecurity and functional safety intersect in healthcare environments. You will respond to a ransomware attack at a hospital that has encrypted systems across the enterprise network, and there's immediate concern about whether medical device networks have been affected. The scenario demonstrates the critical challenge of incident response in healthcare: how to conduct rapid forensic investigation and system restoration while prioritising patient safety, managing 24/7 clinical operations that cannot simply be "shut down," and navigating the tension between IT security and clinical staff who have fundamentally different perspectives on risk and response priorities.

  The game, Northgate General: Code Black, runs in your browser. This sheet gets you started, explains the ideas behind each decision and each console with worked examples you can check by hand, and has a stage-by-stage set of hints for when you are stuck, from a gentle nudge up to the full steps. After that there are questions and exercises on risk management, incident response and security-informed safety.
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
difficulty: "intermediate"
source: "https://github.com/cliffe/BreakEscape/blob/main/scenarios/sis01_healthcare/labsheet.md"
---

## Purpose {#purpose}

By the end of this lab you should be able to:

- explain how a cyber attack can become a hazard to a patient, using the chain: cyber attack, loss of a safety function, physical hazard
- triage security alerts and authentication logs, and tell an attacker's actions from routine noise
- read a safety case claim as claim, argument and evidence, and judge whether its conditions still hold
- weigh a containment action against what it costs the wards, and record the gap as a compensating control or an accepted risk with an owner
- check a medical device's configuration for tampering, using a hash and two independent sources
- choose a recovery source by trading recovery time against how sure you are it is clean
- say who must be told about a hospital cyber incident, when, and under which law

The game teaches by doing. The questions are in this sheet, after the game.

## How to Use This Sheet {#how-to-use}

1. Read the [Information Pack](/HacktivityLabSheets/labs/security_informed_safety/sis01-healthcare-information-pack/) if your tutor has set it, then read **Getting Started** and try the short warm-up. It takes five minutes.
2. Play. Skim **Concepts** as you reach each new idea, or come back to it when a character or a document leaves you wanting more.
3. If you get stuck, go to **Stuck? Hints, Stage by Stage** and find the stage you are on. Each stage has a hint you can read straight away, then a stronger nudge and the full steps hidden behind "Show" buttons. Open one at a time, and go back to the game after each.
4. After the game, work through **Reflection and Exercises**.

> Note: Some stages are decisions, not puzzles. Several things in this game have more than one outcome: whether Mr Ahmed in Bed 4 is escalated in time, whether the drug library tamper is caught, and when the ICO hears from the Trust. The hints for those stages tell you what you know and what each obligation means. They do not tell you what to choose. Every ending gives you something to reflect on, and the debrief and the closing credits show what happened as a result of your choices.

## Getting Started {#getting-started}

### Background and Mission {#background-and-mission}

You are a security incident responder arriving at Northgate General Hospital on the morning after a ransomware attack. Overnight, systems across the hospital's enterprise network have been encrypted, the EHR (Electronic Health Record) is offline, and clinical systems on the ward are beginning to be affected. Nursing staff are concerned about patient safety—they're losing visibility into automated infusion pump settings and can't see real-time patient monitoring data. Management is also concerned about regulatory obligations: UK GDPR requires the Trust to notify the ICO within 72 hours of becoming aware of a personal data breach, and the NIS Regulations require a report to NHS England, creating an urgent timeline.

Your mission is to:
- Investigate how the ransomware initially compromised the hospital's systems
- Determine whether the attack has crossed the boundary into medical device networks
- Verify the integrity and safety of the InfusionGuard smart infusion pump system, including critical drug library parameters
- Make decisions about network isolation and backup restoration that balance security containment with clinical operations
- Meet the 72-hour regulatory notification deadline while conducting a thorough investigation

### What You Will Do {#what-you-will-do}

You will play through an interactive game-based learning scenario set at Northgate General Hospital on the morning after a ransomware attack. The scenario simulates a real-time incident response situation where you must investigate how the ransomware compromised the hospital's systems, determine if medical device networks have been affected, verify the safety of the InfusionGuard smart infusion pump system, and manage the 72-hour regulatory deadline for ICO (Information Commissioner's Office) breach notification. Your investigation will involve talking to nursing staff, the IT security manager, a clinical safety engineer, the CIO, the Caldicott Guardian, a pharmacist and an NCSC investigator. You will examine system logs, make decisions about network isolation and backup restoration, verify drug library integrity, and navigate the tension between conducting a thorough security investigation and restoring clinical operations to protect patients. Throughout the scenario, you will experience how security decisions have visible consequences—isolating the network takes electronic records and allergy checks off the wards, restoring backups could reinfect systems if the isolation isn't complete, and every action creates ripple effects across clinical operations and patient care.

### What You're Aiming For {#what-youre-aiming-for}

By the end of the scenario, you should have a complete understanding of:
1. **The attack chain**: How ransomware moved from the initial compromise point through the enterprise network
2. **The safety impact**: Whether medical device networks were affected and whether the InfusionGuard's safety functions are still operating correctly
3. **The security-safety trade-offs**: Which incident response decisions create clinical or safety consequences (e.g., network isolation takes the wards' read-only view of the EHR and the pump console, backup restoration timing affects reinfection risk)
4. **The organisational challenges**: How different teams (IT security focused on containment, clinical staff focused on patient care, clinical engineers focused on device safety) have different perspectives and priorities

### Starting the Game {#starting-the-game}

You do not need a clinical background. The people you meet explain their side of things, and the documents lying around the hospital explain the rest. Everything happens in the browser: this game has no virtual machines and no flags to find. The log analysis, the network map and the drug library check are all consoles inside the game.

1. \==action: Start the Break Escape mission **Northgate General: Code Black**==.
2. \==action: Watch the opening briefing from Sarah Mitchell, the charge nurse==. She hands you the **Northgate IT Security — Visitor Access Card**, which opens the IT Security office.
3. \==action: Read the scenario brief that follows==. It stays in your notepad.
4. \==action: Open the objectives list and keep an eye on it==. Each aim opens when you finish the one before, and its tasks tell you which room to go to next.

The game takes about 60 to 75 minutes. In a 60-minute class, read Getting Started and the warm-up before the session, and stop after the network isolation if you run out of time. Your progress is saved, and the game's clocks carry on from where they were when you come back.

### How to Play {#how-to-play}

The game is a top-down 2D exploration scenario. You navigate through a hospital environment (Ward 7, the IT Security office and the Major Incident Room) by moving your character with arrow keys or mouse clicks. You interact with NPCs (nurses, the IT security manager, a clinical safety engineer, the CIO, the Caldicott Guardian, a pharmacist and an NCSC investigator) by talking to them—they provide information, react to your decisions, and help you understand the situation. You'll examine interactive objects like computer terminals, infusion pumps, the incident command board and documents. Your conversations and investigations will uncover evidence, trigger system status updates, and lead to decision points where you choose how to respond. The scenario has a time constraint (the 72-hour ICO notification deadline) that creates urgency and forces prioritisation.

The three rooms are in a line. Ward 7 is where you start. The IT Security office is through the door at the north of the ward, and the Major Incident Room is through the back of the IT office.

> Tip: The countdown at the top right of the screen shows the next timed event. One clock is the ICO deadline, shown in hours left. The game compresses the remaining 63 hours of the 72-hour window into 45 minutes of play, so an hour on that clock passes in well under a minute. Other clocks belong to patients.

> Tip: Signed forms and papers that people hand you go into your **notepad**. If someone says "It's in your notes", look there.

> Tip: Most people have more to say than their first conversation. Talk to them again after something changes: a new option often appears. When a character says something important, it may appear as a short line above their head (a "bark") rather than a conversation. Go and talk to them.

> Warning: Some decisions cannot be undone. Escalating an alert, cutting the network link, starting a restore and confirming a pump rate are all final. Read what a console tells you before you confirm.

> Warning: Two patients can come to harm if nobody acts. Neither is a puzzle with a hidden answer: the information you need is on the ward, in the handover notes, on the monitors and in what the nurses tell you.

### Warm-up: Triage Five Alerts and Test One Claim {#warm-up}

Try this before you start, or while the opening briefing plays. It uses made-up data, not anything from the game.

**Part 1.** A hospital's security console shows these five alerts. ==action: Decide which two you would escalate to the incident team, and why==.

```
SEV   SOURCE        DESCRIPTION
LOW   SWITCH-B2     Spanning-tree topology change after planned maintenance
HIGH  FS-ARCHIVE    1,200 files renamed with a new extension in 2 minutes
MED   BKP-01        Nightly backup job completed
CRIT  PRINT-07      Printer toner below 5%
MED   WKS-113       powershell.exe started with an -enc argument by a Word macro
```

<details markdown="1">
<summary>Check your answer</summary>

Escalate **FS-ARCHIVE** (mass renaming is what ransomware encryption looks like) and **WKS-113** (an encoded PowerShell command started by a document macro is a classic first step of an attack). The printer alert is labelled CRIT but means nothing for security. The severity column is somebody's guess at configuration time. It does not tell you what the event means.

</details>

**Part 2.** A made-up safety case says: *"Claim: the lift cannot move with its doors open, provided the door sensors are working and the controller software has not been changed since certification. Evidence: the certification report from 2023."* A maintenance log shows that the controller was updated last month.

> Question: Does the claim still hold? Which part has stopped being true: the claim, the argument or the evidence?

You have just done, in miniature, the two things the first half of the game asks of you.

## Concepts {#concepts}

You do not need to read all of this before you play. Use it when you reach each idea, and again afterwards when you answer the questions. Each subsection says where in the game you can find more.

### The Big Picture {#introduction-key-concepts}

**Medical Devices and Safety-Critical Systems** in healthcare include devices like infusion pumps, ventilators, cardiac monitors, and other connected equipment that directly affect patient safety. Many modern medical devices have multiple components: the medical software running on the device itself, network connectivity to hospital IT systems for data sharing and remote monitoring, and safety mechanisms like dose limits, alarm systems, and automatic interlocks. The challenge is that these devices need to be networked to provide coordinated patient care and enable remote monitoring, but network connectivity creates cybersecurity risks. A compromised device or network could theoretically deliver incorrect medications, disable patient monitoring, or silence safety alarms.

**Safety Instrumented Systems (SIS) in Medical Devices** are the specific safety mechanisms built into devices to protect patients. For example, an infusion pump might have a maximum dose limit that the device will not exceed, regardless of what a clinician tries to program. These safety features are verified when the device is assessed for UKCA or CE marking, and the MHRA regulates them once the device is in service. If a cyber attack could modify these safety parameters (the dose limits, alarm thresholds, or interlock logic), it would compromise the device's safety case. A changed limit can do more than remove a guardrail: a raised minimum makes the pump challenge a correct dose and invite a wrong one. This creates a dilemma: the device is medically necessary and cannot be removed from service, but security concerns require investigation and potentially isolation or updates that could invalidate the device's safety certification.

**Network Segmentation in Healthcare** aims to separate clinical systems (medical devices, EHRs, patient monitoring) from general IT systems (email, business applications). The theory is that if business systems are compromised by ransomware or general malware, the isolation will prevent that malware from reaching medical devices. The reality is that isolation is often incomplete: shared authentication systems, emergency access overrides, wireless networks, and legitimate data-sharing requirements mean that the boundary between IT and medical networks is often porous. An incident responder must assess whether the separation held, and make decisions about isolation that might reduce clinical capabilities.

**Incident Response in Healthcare** follows different priorities than enterprise IT incident response. In enterprise IT, the priority is rapid containment, isolation, and restoration from backups. In healthcare, patient safety is the top priority. If isolating the network means losing electronic patient records and allergy checks on the wards, clinicians will resist isolation. If restoring from backups means updating medical devices in ways that are not yet validated for safety, biomedical engineers will resist the restore. An incident responder must coordinate across these different professional cultures and make decisions where the traditional security response creates patient safety or operational consequences.

**Regulatory Frameworks** in UK healthcare include UK GDPR (personal data, enforced by the ICO), the NIS Regulations 2018 (NHS trusts report significant incidents to NHS England), MHRA regulation of medical devices, the NHS Data Security and Protection Toolkit, and the NHS clinical risk management standards DCB0129 and DCB0160. They can pull against each other. UK GDPR Article 33 requires the ICO to be told within 72 hours of the Trust becoming aware of a breach, before any thorough investigation is finished; the report can describe measures taken or proposed and be completed in phases. Patching a medical device needs safety re-validation. Understanding these frameworks is essential for making decisions that satisfy security, safety and regulatory requirements at once.

### Security-Informed Safety: Core Concepts {#security-informed-safety-core-concepts}

This scenario explores the critical intersection between cybersecurity and functional safety in healthcare environments. In safety-critical systems like medical devices, cyber attacks can directly compromise safety functions, creating physical hazards to patients.

#### CyBOK Security-Informed Safety Topics Covered {#cybok-security-informed-safety-topics-covered}

This scenario addresses the following topics from the CyBOK Security-Informed Safety topic guide:

- **Language and Concept Alignment**: Bridging security and safety terminology across IT and clinical engineering teams
- **Incident Response and Resilience**: Healthcare-specific IR challenges balancing forensic investigation with patient safety *(core focus)*
- **Requirements Reconciliation**: Security controls vs. clinical workflow requirements and 24/7 operational constraints
- **Patching of Systems with Safety Cases**: regulated medical devices and what a change does to their safety case
- **Architecture**: Network segmentation between IT and medical device networks, architectural security boundaries
- **Organisational Culture**: Multi-stakeholder coordination across IT security, biomedical engineering, and clinical teams
- **Tools and Standards**: IEC 62443-4-2, IEC 80001-1, ISO 14971, DCB0129/DCB0160, NHS DSPT

#### The Security→Safety Hazard Chain {#the-security-safety-hazard-chain}

This scenario demonstrates the chain: **Cyber Attack → Loss of Functional Safety → Emergent Physical Hazard**

1. **Cyber Attack**: Ransomware compromise of hospital IT network
2. **Safety Boundary Crossing**: Investigation reveals potential access to medical device network
3. **Loss of Functional Safety**: Critical question - were InfusionGuard safety functions (dose limits, alarm systems, interlock mechanisms) compromised?
4. **Emergent Physical Hazard**: If safety functions are disabled or parameters altered, patients could receive incorrect medication doses

Your investigation must determine if this chain was completed and what safety consequences may have occurred or could still occur.

### Degraded Wards, Alarms and Honest Estimates {#concept-escalation}

When central monitoring fails, a ward does not stop. It falls back on paper charts, bedside alarms and nurses walking round. That fallback has a cost: the alarm only helps if someone is near enough to hear it, and a nurse sitting with one patient is not checking the other five.

A charge nurse plans staffing on what IT tells her. "Soon" and "hours" lead to different plans, so the most useful thing an IT responder can give a clinician is an honest estimate, including "I don't know".

| What IT says | What a ward hears | What the ward does |
| --- | --- | --- |
| "It'll be back soon" | The gap is short, so carry on as normal | Keeps nurses on the round, watches from the desk |
| "Hours at least" | The gap is long, so plan for it | Moves staff, escalates patients who need watching |
| "I don't know yet" | The gap could be long | Should plan as if it is long |

**Escalation** in a hospital means getting a deteriorating patient more senior or more frequent attention, such as calling the outreach team or giving them one-to-one nursing. It is a clinical decision, but it rests on information about the systems, so a cyber responder is part of it.

> Question: What evidence would you need before you told a charge nurse that her monitoring would be back "soon"? Where in the game could you have found it?

To learn more in the game, ask Sarah **[What happened to the monitoring station?]** and **[Is anything else affected?]**, read the **Nursing Handover Notes** at the nursing station, and listen to the voicemail on the **Ward 7 Desk Phone**.

### Reading a SIEM: Signal and Noise {#concept-siem}

A **SIEM** (Security Information and Event Management system) collects events from servers, network devices and workstations, and raises alerts. Most alerts on a busy network are routine. An analyst's job is to find the few that only make sense if someone is attacking. At Northgate a long network migration has been producing alerts for weeks, which is how the real ones were missed.

Look at what an alert describes, not at its severity label. These are the kinds of behaviour that point to an attacker:

| What the alert describes | What it usually means | Stage of an attack |
| --- | --- | --- |
| PowerShell or a script run with an encoded or obfuscated command, often started by an Office document | Malware running its first commands | Initial execution |
| A process reading the memory of LSASS, the Windows process that holds logged-in users' credentials | Credential dumping, so the attacker can log in as other users | Credential access |
| A remote desktop (RDP) or admin session from one network zone into another that should be separate | The attacker moving towards their target | Lateral movement |
| Hundreds of files written or renamed in minutes on a file server | Encryption in progress | Impact |
| VLAN changes, backup jobs, printer and DHCP events, certificate log rotation | Normal operations | Usually noise |

> Tip: A severity label is set when a rule is written. It can be wrong in both directions: a "LOW" alert can be the start of an attack, and a "CRIT" alert can be a printer. Read the description and the source.

A worked example, with made-up hosts. On its own, `HR-PC-22: powershell.exe -enc SQBFAFgA...` could be an admin script. Ten minutes later, `DC02: lsass.exe memory read by rundll32.exe` and then `FW: RDP HR-PC-22 -> THEATRE-PC-03 (cross-zone)` tell a story: something ran on an HR PC, stole credentials, and used them to reach the theatre network. Each alert is suspicious. Together they are an attack chain.

> Question: Why do attackers often act during a period of change, such as a migration or a system upgrade? What does that mean for when a security team should watch its alerts most closely?

To learn more in the game, ask Ravi **[What am I looking for on the SIEM?]**. After you have triaged the SIEM, ask him **[Did any of this show up before last night?]**. The **Incident Timeline (Draft)** in the IT Security office shows when each step of the attack happened.

### Authentication Logs, MFA and Impossible Travel {#concept-vpn}

A **VPN** (virtual private network) lets staff and contractors connect to the hospital network from outside. Each login leaves a line in a log: when, which user, from which IP address and country, whether **MFA** (multi-factor authentication) was used, and whether the login was accepted.

A stolen password on its own is often enough to get in if MFA is not enforced. Signs that a login is not the real user:

| What you see in the log | What it suggests |
| --- | --- |
| MFA = NO on an account that should need it | The account is exempt, or MFA is not enforced. A weakness, not proof of an attack |
| A country the user has never logged in from | Possible stolen credentials |
| The same user in two places too far apart for the time between logins | **Impossible travel**: two different people are using the account |
| An IP address that threat intelligence lists as a Tor exit node or a known-bad host | The attacker is hiding their location |
| A contractor or service account active outside its usual pattern | Accounts that are rarely reviewed are easy to abuse |

One sign is a reason to look harder. Two or three together on one row are a strong case.

**Impossible travel by hand.** A made-up user, `j.doe`, logs in from Manchester at 09:10 and from Lisbon at 09:50. Manchester to Lisbon is about 1,700 km. The gap is 40 minutes, two thirds of an hour:

```
speed = distance / time
      = 1,723 km / (40 / 60) h
      = about 2,585 km/h
```

A passenger jet cruises at roughly 900 km/h, so one person cannot have made both logins.

> Question: Why might a contractor's account be exempt from MFA in the first place? Who should own that decision, and how often should it be reviewed?

To learn more in the game, ask Ravi **[What's wrong with the VPN login?]**, and read the **VPN Log Printout** in the IT Security office. Once you have found the anomaly, ask him **[Why didn't contractor accounts need MFA?]**.

### Safety Cases: Claim, Argument, Evidence {#concept-safety-case}

A **safety case** is a structured argument that a system is acceptably safe to use in a given setting. Each part has three pieces:

- the **claim**: what we say is true ("a compromise of the enterprise network cannot reach the pumps")
- the **argument**: why we believe it ("a firewall keeps the zones apart")
- the **evidence**: what backs the argument up ("the firewall rule audit, the segmentation project")

Many claims are conditional: they hold *provided that* something else is true. If the condition stops being true, the claim stops being true, whatever the evidence once said. Anything that would make a claim false is called a **defeater**. A good safety case lists its defeaters and checks them.

There are three ways a claim can turn out to be wrong, and they lead to different lessons:

| Verdict | What it means | The lesson |
| --- | --- | --- |
| It holds | The conditions are true now, and the evidence is current | Keep checking it |
| It held until something changed | It was true, then the system or the threat changed | Review claims when things change |
| It never held | Its conditions were false before anyone tested it | The case was signed off for a system that did not exist |

A worked example, made up. *Claim: patient records on the new tablets cannot be read by other apps, provided every tablet is enrolled in device management. Argument: device management blocks unapproved apps. Evidence: the enrolment project, 80% complete.* The evidence itself says 20% of tablets are not enrolled. The condition is false, and was false on the day the claim was signed. The claim never held.

Security-informed safety adds one question to every claim: what if someone is trying to defeat it? A safety case written for accidents assumes faults are random. An attacker is not random. They find the condition nobody checks.

> Question: In the made-up example above, what would you need to see before you would accept the claim?

To learn more in the game, read the **Safety Case Extract (CLAIM-HC-001, HC-003, HC-007)** on the table in the Major Incident Room, and ask David Osei **[Walk me through HC-001.]**. The [Information Pack](/HacktivityLabSheets/labs/security_informed_safety/sis01-healthcare-information-pack/) has the full Northgate safety case, including its Goal Structuring Notation (GSN) diagram and defeaters.

### Segmentation, Isolation and What It Costs {#concept-isolation}

A segmented network keeps zones apart. At Northgate the zones are the external zone (the internet and vendor access), the enterprise IT zone (email, file servers, the EHR, admin workstations), the clinical or device zone (pump fleet manager, monitors, imaging) and a legacy flat segment that never moved to the new design.

Segmentation fails at the places where something crosses the boundary:

| Weak point | Why it matters |
| --- | --- |
| A **dual-homed** workstation, with a connection to both zones | Anyone who controls it can step from one zone to the other |
| A firewall **exception rule** that lets a specific flow through | The firewall lets the attacker through because it was told to |
| A legacy segment that was never migrated | Old devices sit on the same network as office PCs |
| Persistent vendor remote access into the clinical zone | A stolen vendor login lands inside, past the perimeter |

**Isolation** cuts the links between zones. It stops the attacker spreading and stops them pushing anything new. It does not undo what has already happened: an encrypted machine stays encrypted, and a configuration already pushed to a device stays on it. It also cuts things the wards still use. Before you isolate, you need to know what the cut costs.

When a security action creates a new clinical risk, there are two honest ways to handle it:

- a **compensating control**: something put in place to cover the gap, such as printed allergy lists and pharmacy checks by phone. It has its own cost in time and staff.
- an **accepted risk**: the gap is left, written down, and a named person owns it.

The dishonest way is to say neither, and let the gap fall on whoever is on shift.

**Dual authorisation** means two people from different disciplines must both agree before a high-impact action. For isolation at Northgate, that is IT security and clinical engineering. Each can see a cost the other misses. It is a safety control, and skipping it is a deviation that has to be explained afterwards.

> Question: What does a compensating control cost? Who pays that cost on a hospital ward?

To learn more in the game, ask Ravi **[What does isolating actually do?]**, ask David **[How does the dual sign-off work?]**, ask Dr Hartley **[What worries you about isolating the network?]**, and click the orange lines on the **Network Architecture Map** in the IT Security office. The **Vendor Remote Access Exception Register** in the Major Incident Room shows one of the weak points.

### Drug Libraries, Dose Limits and Decimal Points {#concept-drug-library}

A smart infusion pump carries a **drug library**: a table of drugs with the concentration and the dose range the hospital allows for each one. When a nurse enters a rate, the pump checks it against the library. Outside the range, it warns or refuses. That check is the guardrail against the most common serious infusion error, a misplaced decimal point.

**A worked example, made up.** Drug X comes at 2 mg/mL. The prescription is 1.5 mg/hr, and the library allows 0.5 to 3 mg/hr.

```
correct entry:   1.5 mg/hr  ->  1.5 / 2  =  0.75 mL/hr   inside 0.5 to 3, accepted
misread decimal: 15  mg/hr  ->  15 / 2   =  7.5  mL/hr   ten times the dose, outside the range, refused
```

The library catches the slip. Now suppose an attacker changes the library's minimum for Drug X from 0.5 to 10 mg/hr, and raises the maximum so the row still loads:

```
correct entry:   1.5 mg/hr  ->  below the new minimum: the pump says the right dose is too low
misread decimal: 15  mg/hr  ->  inside the new range: accepted without a warning
```

Removing a limit takes away a guardrail. Raising the minimum does worse: it makes the pump argue against the correct dose and wave the wrong one through. On a busy ward, staff clear routine pump warnings many times a shift. Getting used to clearing warnings is a form of **normalisation of deviance**, and this attack turns that habit into the weapon. The safe rule is that the prescription wins. If the pump and the chart disagree, stop and get a pharmacist to check.

**Checking a library for tampering.** A **cryptographic hash** such as SHA-256 turns a file into a fixed-length fingerprint. Change one character and the whole hash changes. Compare the live library's hash with the hash of the signed, authorised copy:

```
$ printf 'DRUGX,0.5,3\n' | sha256sum
b4186c4446a264183437abe90a8ab3d57f7c2162f4097335cd41151662f28571  -
$ printf 'DRUGX,10,30\n' | sha256sum
6cd7d0d8507c63ea0d42d61f91245b130415e61a034e9e69ff30ce56e2027d98  -
```

A mismatch tells you that something changed, not what the right value is. Before you restore, confirm the correct value from sources the attacker could not have changed, such as the paper prescription and the manufacturer's documentation. Two independent sources that agree with the backup are much stronger evidence than the backup alone.

> Question: Why is a backup copy of the library not enough on its own to prove the correct value? What would an attacker who had been inside for weeks have been able to change?

To learn more in the game, ask Sarah **[What about the infusion pumps?]**, read the **MAR Charts — Paper Backup** and the **InfusionGuard GP — Manufacturer Safety Documentation** binder, and once the pharmacist is on the ward ask him **[So if the pump flags it, we just override?]**. David's **[What does HC-003 say?]** explains the claim that should have stopped this.

### Backup and Recovery: RPO, RTO and Reinfection {#concept-backup}

Two numbers describe a recovery, and they are easy to confuse:

- **RPO** (recovery point objective): how much data you lose, measured back from the failure to the last good copy.
- **RTO** (recovery time objective): how long it takes to get the system working again.

**A worked example, made up.** A clinic's system is backed up nightly at 02:00. It fails at 16:30. The restore takes 6 hours.

```
data lost (RPO):     02:00 to 16:30  =  14.5 hours of records, re-entered from paper
time to recover (RTO): 16:30 + 6 h    =  back at 22:30
```

A third question matters as much as either number: **is the copy clean?** If the attacker could reach the backup system, the backup may contain their tools, and restoring it brings them back. Backups the attacker could not reach are more trustworthy: offline tapes, or an **immutable** copy held under separate credentials. A scan for known indicators of compromise helps, but it only finds what you already know about.

Restoring onto a network the attacker can still reach invites **reinfection**. Contain first, then restore.

| Backup type | Typically fast? | Typically clean? | The usual catch |
| --- | --- | --- | --- |
| On-site snapshot on the same network | Yes | Only if the attacker never reached it | Snapshots taken while the attacker had admin rights may carry their backdoor |
| Vendor cloud copy, separate credentials, immutable | Slower | Yes | Covers only what the vendor holds |
| Offline tape | Slow | Yes | Old restore point, and slow to read back |

> Question: In the made-up example, the clinic could back up every hour instead of nightly. What would that change, and what would it cost?

To learn more in the game, ask Helen Carver **[How do we get the EHR back?]**, then **[How much do we lose, and how long does it take?]**. Read the **Backup Status Report** inside the **Backup Recovery Console**, and ask Ravi **[Can we trust the NAS backups?]**.

### Who Must Be Told, and When {#concept-reporting}

A hospital cyber incident brings several separate duties. They have different recipients and different clocks.

| Who | Under what | When | Notes |
| --- | --- | --- | --- |
| The ICO | UK GDPR Article 33 | Without undue delay, and within 72 hours of the Trust **becoming aware** of a personal data breach | The report can describe measures taken *or proposed*, and the rest can follow in phases (Article 33(4)). A late report must give the reasons for the delay |
| Patients | UK GDPR Article 34 | Without undue delay, if the breach is likely to put them at high risk | Health records usually meet that bar |
| NHS England | The NIS Regulations 2018 | Promptly, for a significant incident to an essential service | At Northgate this was done on Monday night |
| The NCSC | Voluntary | As soon as help is wanted | Helps investigate and warns others; does not take over |
| A patient harmed by their care, or their family | The statutory duty of candour | As soon as reasonably practicable, in person | Say what happened, and say sorry |
| The MHRA | Medical device regulation | When a device is involved in serious harm | The device is quarantined as evidence |

**Working out the ICO deadline, made up.** An on-call manager at another trust is told of a ransomware attack at 14:10 on a Wednesday. That is when the trust became aware:

```
aware:     Wednesday 14:10
deadline:  Wednesday 14:10 + 72 hours  =  Saturday 14:10
```

The clock runs over the weekend. It runs from awareness, not from the end of the investigation, and not from containment.

> Question: Why does the law let a first report describe measures that are only *proposed*? What would happen to breach reporting if trusts had to wait until they were sure?

To learn more in the game, read the **IG Briefing — Reporting a Personal Data Breach** and the **ICO Notification Deadline** tablet on the conference table in the Major Incident Room. Ask Dr Hartley **[What do we have to tell the ICO, and when?]**.

### Accepted Risk and Who Owns It {#concept-risk}

A **risk** is something that might happen and would cause harm. It is often scored as **likelihood × impact**, each on a 1 to 5 scale. Once scored, a risk can be avoided, reduced, transferred or accepted. **Accepting** a risk is legitimate, but only if it is written on a risk register with an owner, and reviewed when things change.

**A worked example, made up.** A GP surgery lets its IT supplier log in remotely without MFA, because the supplier's tools do not support it.

```
before controls:  likelihood 2 (unlikely)  x  impact 4 (major)  =  8
with MFA added:   likelihood 1 (rare)      x  impact 4 (major)  =  4
```

If the surgery accepts the score of 8 instead, the register should say who owns it and what would trigger a review: a new supplier, a change in the threat, or simply a date. **ALARP** ("as low as reasonably practicable") asks whether further reduction would cost far more than the benefit. It is not a label for "we did not get round to it".

Most of what failed at Northgate had been accepted by someone. The game lets you find out who.

> Question: What should trigger a review of an accepted risk, apart from a date in a diary?

To learn more in the game, ask Ravi **[Why didn't contractor accounts need MFA?]**, ask David **[Was the gap ever on a risk register?]**, and read the **Internal Audit Follow-Up — Backup and Governance Gaps** in the Major Incident Room.

## Stuck? Hints, Stage by Stage {#hints}

Find the stage you are on. Read the hint, then go back and try. If you are still stuck, open **Nudge**. Open **Recipe** last. Stages are in the usual order of play, though you can do some of them in a different order.

> Tip: Before you open any hint, ask yourself three questions. Who in the game is responsible for this, and have you asked them? Is there a document nearby that explains it? And does the objectives list name the room you should be in?

### Before the First Decision: Ward 7 {#hints-start}

**Where:** Ward 7, where you start. **To finish "Assess Ward 7":** talk to Sarah Mitchell and collect the paper medication charts.

> Hint: The opening briefing has finished and you are standing on the ward. What did Sarah ask you to look at before you go upstairs?

<details markdown="1">
<summary>Nudge</summary>

Sarah asked you to look at Bed 4's monitor and come back to her. The **Ward 7 — Central Monitoring Station** at the nursing station shows what the ward has lost. The **Nursing Handover Notes** at the nursing station tell you about the two patients who need attention: Mr Ahmed in Bed 4 and Ms Okafor in Bed 2.

The **MAR Charts — Paper Backup** are the paper medication charts. Sarah keeps them at her desk. The ward aim completes when you have talked to Sarah and picked up the charts.

If you are not sure where to go, ask Sarah **[What should I do first?]**.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Click the **Ward 7 — Central Monitoring Station**== and read what it shows.
2. \==action: Click **Bed 4 — Bedside Monitor (Cardiac)**== and read its numbers.
3. \==action: Read the **Nursing Handover Notes**==.
4. \==action: Pick up the **MAR Charts — Paper Backup**==.
5. \==action: Talk to Sarah again==. She has a question for you (the next stage).

</details>

### Bed 4: Sarah's Question {#hints-bed4}

**Where:** Sarah Mitchell, at the nursing station. **Decision:** she asks you when the central monitoring will come back.

This is a decision, not a puzzle. The objectives list shows it as "Tell Sarah when the monitors will be back (Bed 4)".

> Hint: Sarah is going to plan her two nurses on your answer. What do you actually know about when that screen will work again?

<details markdown="1">
<summary>Nudge: what you know</summary>

Gather what you have seen before you answer. What does the monitoring station screen show? What did Ravi's voicemail on the **Ward 7 Desk Phone** say about a time to restore? What do the handover notes say? Has anyone told you how the station will be fixed, or by when?

Sarah tells you what each answer means for the ward before you choose. Listen to her. See "Degraded Wards, Alarms and Honest Estimates" in Concepts.

</details>

<details markdown="1">
<summary>Recipe: giving your answer</summary>

1. \==action: Talk to Sarah== and choose **[About Mr Ahmed in Bed 4.]** if she does not raise it herself.
2. Listen to what she says each answer will lead to.
3. \==action: Give the answer that matches what you know==.

</details>

> Warning: The countdown labelled **Patient Deterioration** is Mr Ahmed's. His condition changes as it runs out. If you later learn something that changes your answer, Sarah offers you a way to tell her.

### Bed 2: The Morphine Infusion {#hints-bed2}

**Where:** **Bed 2 — Infusion Pump Terminal**, at the foot of Ms Okafor's bed. **Lock:** the pump will not open until you have collected the paper charts. **Lock wants:** a rate in mg/hr. This task is optional, but Ms Okafor's bag is due to run out at about quarter to eight.

> Hint: Where is the rate written down? And what does the chart warn you about?

<details markdown="1">
<summary>Nudge</summary>

The EHR is down, so the prescription is on the paper chart. Read her entry on the **MAR Charts — Paper Backup** twice. The chart has a warning about the decimal point. Sarah's rule, which she gives you if you ask **[What about Bed 2's infusion?]**, is that if the pump argues with the chart, you do not argue back: you stop and ring pharmacy.

Read the pump's own screen as well. It shows the library range the pump is using. Compare it with the ward range written on the chart. If they disagree, something is wrong with the library, not with the prescription. See "Drug Libraries, Dose Limits and Decimal Points" in Concepts.

**Learn it:** ==action: Before you type anything, write the prescribed rate on paper, with its decimal point, and say it aloud== as a second nurse would hear it.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Pick up the MAR charts first== if you have not already. Without them the pump shows "PAPER MAR CHARTS REQUIRED".
2. \==action: Click the **Bed 2 — Infusion Pump Terminal**==.
3. \==action: Type the prescribed rate exactly as the chart gives it== and press **CONFIRM**.
4. If the pump challenges your entry, read the box carefully: it shows your entry, the library's limit and the paper prescription side by side. Its two buttons are **KEEP THIS RATE — PHONE PHARMACY** (pharmacy checks your entry against the prescription) and **RE-ENTER RATE**. Decide which matches what you know.

</details>

<details markdown="1">
<summary>Nudge: "something is wrong with Ms Okafor"</summary>

If a wrong rate went in, Ms Okafor becomes drowsy and her breathing slows. Mrs Kowalski in Bed 5 will call out. Act quickly: talk to Mrs Kowalski and choose **[I'll get the nurse now.]**, or talk to Sarah, who offers you a way to raise the alarm once you have seen Ms Okafor yourself. Then tell Sarah what went into the pump.

</details>

> Warning: The most common slip here is reading the decimal point wrong. A pump that accepts an entry without complaint is not proof the entry is right.

### Into the IT Security Office {#hints-it-office}

**Where:** the door at the north of Ward 7. **Lock:** an RFID card reader. **Lock wants:** the visitor card Sarah gave you.

> Hint: You were handed something for this door in the opening briefing. Is it in your inventory?

<details markdown="1">
<summary>Nudge</summary>

Sarah gives you the **Northgate IT Security — Visitor Access Card** at the end of her opening briefing. It is Ravi Anand's card, left for the response team. ==action: Click the IT Security door with the card in your inventory==. The "Investigate the Attack" aim appears once "Assess Ward 7" is complete, but you can go up before then.

</details>

### The SIEM Console {#hints-siem}

**Where:** **SIEM Console — Ravi's Laptop**, in the IT Security office. **It wants:** every alert that shows the attack, escalated, before the four-minute timer runs out.

> Hint: Most of these alerts are a network migration. Which ones only make sense if someone is moving through the network on purpose?

<details markdown="1">
<summary>Nudge</summary>

Talk to Ravi first: **[Tell me what you know.]**. He tells you what the noise is.

Ignore the severity column at first. Read each description and ask which stage of an attack it could be: running code, stealing credentials, moving between zones, encrypting files. The table in "Reading a SIEM: Signal and Noise" lists the patterns. Some of the alerts you need are not marked CRIT.

**Learn it:** ==action: Before you click anything, read the first ten alerts and sort them on paper into "routine" and "attack"==. Then check your list against the console.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Open the SIEM console==. The timer starts.
2. \==action: For each alert, read its source and description==.
3. \==action: Click **ESCALATE** on each one that matches an attack pattern in the Concepts table==, and **DISMISS** on routine ones. A dismissed alert can be undone with **UNDO**. An escalated one cannot.
4. When every alert that shows the attack is escalated, the console says **INCIDENT TEAM NOTIFIED** and closes.
5. If the timer runs out first, the console says **CRITICAL ALERTS MISSED**. Open it again for a fresh start.

</details>

> Tip: New alerts keep arriving at the top of the list. They pause while your pointer is over the list, so the row you are reading does not move.

### The VPN Log {#hints-vpn}

**Where:** **VPN Authentication Log Terminal**, in the IT Security office. **It wants:** the one login that is not the real user, flagged.

> Hint: Fifty logins. Which columns would tell you that someone is not who they say they are?

<details markdown="1">
<summary>Nudge</summary>

Ravi's question is "who, from where, and why nothing stopped them". The **VPN Log Printout** on the desk has one line circled in red, and a note about what to check next.

Use the **FILTER BUILDER** to cut the list down. One filter alone will leave you with more than one row: there is more than one login without MFA. Combine what you see. For the row that stands out, use **[LOOK UP IP]** and **[INVESTIGATE ACCOUNT]**: they show the threat intelligence for the address and the account's recent history.

**Learn it:** ==action: Work out the travel speed by hand== from the two logins the account history shows, using the method in "Authentication Logs, MFA and Impossible Travel".

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Click **[+ ADD FILTER]** and add **MFA = NO**==.
2. \==action: Look at the country of each row that is left, and click the one that stands out==.
3. \==action: Click **[LOOK UP IP]**, then **[INVESTIGATE ACCOUNT]**==, and read both.
4. \==action: Click **[FLAG ACCOUNT]**, then **[CONFIRM — FLAG ACTIVE SESSION]**==.

If you flag the wrong row, the terminal says **NOT THIS ONE** and nothing is escalated. Try another.

</details>

### Ravi's Sign-Off {#hints-ravi-signoff}

**Where:** Ravi Anand, in the IT Security office. **Lock:** his signature on the isolation form. **Lock wants:** the SIEM triaged and the VPN anomaly found.

> Hint: Ravi will not sign an isolation off his own triage. What has he asked you to do first?

<details markdown="1">
<summary>Nudge</summary>

Ravi signs when both the SIEM and the VPN log are done. If he says "I'm not signing until the SIEM's been properly triaged" or "We still don't know how they got in. Check the VPN log first", he is telling you which one is missing.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Talk to Ravi and choose **[I need your sign-off.]**==.
2. The **IT Network Change Authorisation Form** goes into your notepad. ==action: Read it==: it lists what isolation takes offline.
3. Ravi sends you to David Osei in the Major Incident Room, through the back of the IT office.

</details>

### David Osei and CLAIM-HC-001 {#hints-hc001}

**Where:** David Osei, in the Major Incident Room. **Lock:** the clinical safety sign-off. **Lock wants:** your judgement of CLAIM-HC-001, the SIEM triaged, and an answer to "what do the wards lose?".

> Hint: David reads you a claim with a "provided that" in it. Is the "provided that" true at Northgate this morning?

<details markdown="1">
<summary>Nudge: judging the claim</summary>

Read the **Safety Case Extract (CLAIM-HC-001, HC-003, HC-007)** on the table. HC-001 says an enterprise compromise cannot reach clinical devices, *provided* two things are true. Check each condition against what you can see. The **Network Architecture Map** in the IT Security office shows the exception rules, and the extract's own evidence line says how far the segmentation project got.

See "Safety Cases: Claim, Argument, Evidence" in Concepts for the three possible verdicts. David tells you whether he agrees, and why.

</details>

<details markdown="1">
<summary>Nudge: "what do the wards lose?"</summary>

David will not sign until you can say what isolation costs the wards. The **Network Architecture Map** answers this. ==action: Click each orange dashed line, or its ! marker,== and read the consequences listed for each rule. Ravi's change form lists them too. Ask yourself what keeps running without the network, and what stops.

Before you see David, you may also want to hear Dr Hartley on the same question: **[What worries you about isolating the network?]**. What you agree with her is recorded, and David reads it.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Read the Safety Case Extract==.
2. \==action: Talk to David and go through HC-001 with him==, giving your verdict.
3. \==action: Open the Network Architecture Map and review its orange risk paths== if you have not already.
4. \==action: Ask David **[I need your clinical sign-off.]**== and answer his question about what the wards lose.
5. The **Clinical Safety Sign-Off — Network Isolation** goes into your notepad.

</details>

> Warning: If David says "Not yet. I need Ravi's team to confirm what we're dealing with. Triage the SIEM first", go back to the SIEM console.

### Isolating at the Network Map {#hints-isolation}

**Where:** **Network Architecture Map**, the touchscreen on the wall of the IT Security office. **Lock:** the SEVER button. **Lock wants:** at least one risk path reviewed. It then checks for both signatures.

> Hint: The SEVER button is greyed out. What does the note beside it ask you to do?

<details markdown="1">
<summary>Nudge</summary>

SEVER unlocks once you have opened at least one orange risk path. When you press it, the confirmation box shows the clinical consequences and the **DUAL AUTHORISATION STATUS**: whether IT Security (Ravi Anand) and Clinical Engineering (David Osei) have each signed.

The map will let you cut the link without both signatures. If you do, the box warns that proceeding violates CLAIM-HC-007, the claim that decisions affecting patients are made by IT and clinical engineering together. What that means is in "Segmentation, Isolation and What It Costs". Ravi and David will both have something to say about it afterwards.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Click an orange dashed line or its ! marker== and read what it carries.
2. \==action: Click **SEVER ENTERPRISE → CLINICAL LINK**==.
3. \==action: Read the confirmation box, including the authorisation status==.
4. \==action: Click **YES — SEVER LINK**== when you are ready, or **NO — CANCEL** to go and get a missing signature.

Several people react once the link is cut. Talk to them: new options appear.

</details>

> Tip: In a 60-minute class, this is a good place to stop. Your progress is saved.

### The ICO Notification {#hints-ico}

**Where:** Helen Carver, in the Major Incident Room. **Decision:** when the Trust reports the breach to the ICO. **Clock:** the ICO deadline countdown, in hours left.

You can do this stage at any time after you reach the Major Incident Room, before or after the isolation.

> Hint: Helen says she will notify the ICO once the network is contained. Is that what the law asks of her?

<details markdown="1">
<summary>Nudge</summary>

Helen's view is that one accurate report after containment is better than an early one. She is a credible professional, and she is under pressure. Her view is also one you can test.

What does Article 33 say about when the clock starts, and what a first report must contain? The **IG Briefing — Reporting a Personal Data Breach** on the conference table sets it out, and so does Dr Hartley if you ask **[What do we have to tell the ICO, and when?]**. If you want to change Helen's mind, she will want to see where it says so, or hear it from someone with standing. "Sure" will not move her.

See "Who Must Be Told, and When" in Concepts.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Ask Helen **[Where are we with the ICO?]**== and hear her position.
2. If you want to argue it, she offers you ways to answer her. The stronger answers only appear once you have read the IG briefing, or once Dr Hartley has offered to back you (talk to her after you have heard Helen's view).
3. Once the network is isolated, Helen offers to send the report herself.

</details>

> Warning: The ICO deadline is 45 minutes of play. If it runs out before the Trust has reported, the NCSC debrief starts as soon as you are in the Major Incident Room, and the game moves to its end.

### The Backup Restore {#hints-backup}

**Where:** **Backup Recovery Console**, a laptop in the Major Incident Room. **Decision:** which source to restore from: the on-site NAS, the vendor's cloud copy or the tape library.

> Hint: Each source has a cost. What is each one's restore time, how much data does it lose, and how sure can you be that it is clean?

<details markdown="1">
<summary>Nudge</summary>

Read the **Backup Status Report** inside the console before you choose. It gives each source's restore time, restore point and how far it can be trusted. Helen will talk you through the trade-off if you ask **[How do we get the EHR back?]**.

The NAS cannot be chosen until it has been scanned. The console says "Ask Ravi Anand in the IT Security office to scan the NAS first." If you want it as an option, ask Ravi **[Can we trust the NAS backups?]**. The scan takes a minute or two, and Ravi tells you when it is done. Note what he says the scan can and cannot promise.

Every source warns that restoring onto a network that is not isolated may bring the attacker back. See "Backup and Recovery: RPO, RTO and Reinfection" in Concepts.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Open the Backup Recovery Console and read the Backup Status Report==.
2. \==action: Click each source== and read its card: restore time, restore point, integrity and reinfection risk.
3. \==action: Choose the source you can defend, and click **CONFIRM RESTORE FROM THIS SOURCE**==. This cannot be undone.
4. \==action: Talk to Helen== and sign the restore record. Be ready to say why you chose it: Priya S. will ask in the debrief.

</details>

### The Drug Library Integrity Check {#hints-drug-library}

**Where:** **Drug Library Integrity Terminal**, a laptop in the Major Incident Room. **Lock:** the restore button. **Lock wants:** the correct value confirmed from two independent sources.

> Hint: The console can tell you that the library has changed. How would you prove what the right value is?

<details markdown="1">
<summary>Nudge: running the check</summary>

The terminal opens on **INTEGRITY CHECK**. Run it. It compares each drug's entry with the signed copy, using SHA-256 hashes. Any row that fails has been changed. **[COMPARE TO BACKUP →]** shows exactly which fields.

David's question, from HC-003, is the one to keep in mind: what would this change make a nurse do by mistake? See "Drug Libraries, Dose Limits and Decimal Points".

</details>

<details markdown="1">
<summary>Nudge: "the restore button won't work"</summary>

The restore button stays disabled until you have confirmed the correct value from two independent sources, each with its **[REFERENCE]** button.

- **Paper MAR Charts** needs the charts from Ward 7. If you have not picked them up, the terminal tells you to go back to the nursing station.
- **Manufacturer Datasheet** needs you to have read the **InfusionGuard GP — Manufacturer Safety Documentation** binder, on the conference table beside the laptops.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Click **[ RUN INTEGRITY VERIFICATION ]**== and wait for the scan.
2. \==action: Open the failing row and click **[COMPARE TO BACKUP →]**==. Note what changed and when.
3. \==action: On **VERIFICATION**, click **[REFERENCE]** for each source== and confirm the value with **CONFIRM — Value noted**.
4. \==action: Click the restore button== once both sources are confirmed.
5. \==action: Read the **FLEET REPORT**==: which pumps loaded the changed library, and when.
6. \==action: Go and tell David, Helen and Sarah==. Each has something to say about it.

</details>

> Warning: The tampered library was pushed to the pumps before anyone knew. Checking the console does not change what is already on a pump at a bedside. That is why the pharmacist goes to the ward.

### The Finale: Priya S. and the Debrief {#hints-finale}

**Where:** the Major Incident Room. Priya S. from the NCSC arrives once the restore has started and the drug library has been verified.

> Hint: The debrief ends the game. Is there anything on your objectives list, or anyone you have not answered, that you want to finish first?

<details markdown="1">
<summary>Nudge</summary>

When you talk to Priya S., she offers **[I'm ready.]** or **[Give me a few minutes.]**. Use the second if you still have things to do: the ICO report, asking the NCSC for help, or telling Sarah about the library.

In the debrief she asks you to explain some of your decisions. Answer from what you saw and did. There is no hidden right answer to find: the questions are there to make you think about why things went the way they did, and they come back in **Reflection and Exercises**.

The closing credits list what happened to each patient, each safety claim, each notification and the restore. ==action: Note them down before they finish==: you will need them for the exercises.

</details>

### What the Consoles and People Are Telling You {#error-messages}

| You see | It usually means |
| --- | --- |
| The IT Security door will not open | You need the visitor card from Sarah's opening briefing, in your inventory |
| "PAPER MAR CHARTS REQUIRED" on the pump | Pick up the MAR charts at the nursing station first |
| "DOSE BELOW LIBRARY MINIMUM" at the pump | The pump's library disagrees with the prescription. Compare the library range on the pump's screen with the ward range on the chart |
| "PHARMACY: NOT PRESCRIBED" | You asked pharmacy to check a rate that is not the prescribed one |
| "ABOVE MAX ... — RE-ENTER" or "OUTSIDE ... — RE-ENTER" | The entry is outside the range the pump is using. Check the decimal point |
| "VERIFY DOSE BEFORE ADMINISTRATION" | The pump wants a second check against the paper prescription. Read the chart again |
| "CRITICAL ALERTS MISSED" on the SIEM | The timer ran out before every attack alert was escalated. Open it again for a fresh start |
| "NOT THIS ONE" on the VPN terminal | The row you flagged is not the anomaly. Use the IP lookup and the account history |
| Ravi: "I'm not signing until the SIEM's been properly triaged." | The SIEM triage is not finished |
| Ravi: "We still don't know how they got in. Check the VPN log first." | The VPN anomaly has not been flagged |
| David: "Before I sign anything, look at HC-001 with me." | You have not given him your verdict on CLAIM-HC-001 |
| David asks you to "Look at the map again" or "find out before I sign" | Your answer about what the wards lose did not match the map. Review the orange risk paths |
| SEVER is greyed out | Open at least one orange risk path on the map first |
| "Proceeding without full authorisation violates CLAIM-HC-007" | One or both signed forms are missing |
| The NAS is unavailable on the backup console | Ask Ravi to scan the NAS, and wait for him to say it is done |
| "WARNING: Network not isolated. Reinfection risk remains elevated." | The restore started before the isolation |
| The drug library restore button is disabled | Confirm the value from both sources with their [REFERENCE] buttons |
| "Manufacturer documentation not yet read" | Read the InfusionGuard binder on the conference table |
| Helen: "Not until the network's isolated." | Helen's position on the ICO. See the ICO stage |
| No new task appears | Talk to the people in the room again, and check the objectives list for the room it names |

## Optional Side Content {#optional}

None of these are needed to finish. Several are decisions that the debrief and the credits record, and some give you material for the exercises.

<details markdown="1">
<summary>The voicemail on the ward desk phone</summary>

The **Ward 7 Desk Phone** has one unheard message, left by Ravi on Monday night. Listen to what it tells the ward to do, and what it does not tell them.

</details>

<details markdown="1">
<summary>The ransom, and what to tell the Board</summary>

Ask Helen **[Is the Board thinking of paying?]**. She asks what the response team would tell the Board. The **Printed Ransom Note** on the conference table shows what DarkVault is asking for. Your answer appears in the credits, and it is the subject of question Q5.

</details>

<details markdown="1">
<summary>When to tell patients</summary>

Ask Dr Hartley **[When do we tell patients?]**. This is the Article 34 decision. Her questions **[What data are we responsible for?]** and **[What do we have to tell the ICO, and when?]** give you the background.

</details>

<details markdown="1">
<summary>Asking the NCSC for help</summary>

The objectives list shows this as optional: "Advise Helen Carver on asking the NCSC for help". Ask Helen or Dr Hartley **[Should we bring in the NCSC?]**. Helen asks again after the restore has started.

</details>

<details markdown="1">
<summary>The pump console: Helen's risk or David's</summary>

After the drug library tamper is found, Helen wants the pump console back as soon as the restore is done, and David does not. Hear Helen first, then ask David **[Helen says every hour on paper is a risk too.]**. He asks what you would tell the executive on call. This trade-off is the subject of question Q4.

</details>

<details markdown="1">
<summary>CLAIM-HC-007 and the rehearsal that lapsed</summary>

Ask Helen **[What does the safety case say about isolating?]**. She explains the claim behind dual sign-off and when the plan was last rehearsed. Useful for question Q8 and exercise E7.

</details>

<details markdown="1">
<summary>The paper trail</summary>

These documents are not needed for any lock, but they explain how Northgate got here, and you will want them for the risk management questions:

- **Incident Timeline (Draft)**, IT Security office: when each step of the attack happened
- **VPN Log Printout**, IT Security office: the circled line and the handwritten notes
- **Vendor Remote Access Exception Register**, Major Incident Room: a "temporary" exception and its overdue review
- **Internal Audit Follow-Up — Backup and Governance Gaps**, Major Incident Room: what the Trust had already been told
- **Major Incident Command Board**, Major Incident Room: a live timeline of your response

</details>

<details markdown="1">
<summary>The patients and the ward team</summary>

Talk to Mrs Kowalski in Bed 5 and to Amy Clarke, the staff nurse on her rounds. Once the drug library tamper is found, Hamza Iqbal, the on-call pharmacist, arrives on the ward. If you find the tamper, the objectives list also offers "Tell Sarah the drug library was tampered with". She has a ward to run, and she wants to hear it from you.

</details>

## Try It on the Command Line (Optional) {#command-line}

Two of the game's checks have simple shell equivalents. Use any current Linux distribution with `sha256sum`, `diff`, `awk` and `grep`. The data below is made up.

### Checking a Configuration File Against a Signed Copy {#cli-hash}

\==action: Make a "signed" library and record its hash==:

```bash
printf 'DRUG,MIN,MAX\nDRUGX,0.5,3\nDRUGY,1,8\n' > library.csv
sha256sum library.csv > library.sha256
sha256sum -c library.sha256
```

The check prints `library.csv: OK`. ==action: Now change one value, as an attacker might, and check again==:

```bash
printf 'DRUG,MIN,MAX\nDRUGX,10,30\nDRUGY,1,8\n' > library.csv
sha256sum -c library.sha256
```

This prints `library.csv: FAILED` and a warning, and exits with a non-zero status. A hash tells you *that* the file changed. ==action: Use `diff` to see *what* changed==:

```bash
printf 'DRUG,MIN,MAX\nDRUGX,0.5,3\nDRUGY,1,8\n' > library_signed.csv
diff library_signed.csv library.csv
```

> Question: The attacker at Northgate had admin rights for hours. If the signed hash were stored on the same server as the library, what could they have done? Where should it be kept instead?

### Filtering an Authentication Log {#cli-log}

\==action: Make a small made-up VPN log==:

```bash
cat > vpn.csv <<'EOF'
time,user,ip,country,mfa,result
09:02,a.khan,81.2.69.10,UK,YES,ACCEPT
09:10,j.doe,81.2.69.44,UK,YES,ACCEPT
09:14,r.ellis,81.2.69.71,UK,NO,ACCEPT
09:31,p.wood,81.2.69.12,UK,YES,REJECT
09:50,j.doe,203.0.113.9,PT,NO,ACCEPT
EOF
```

\==action: Filter by one column at a time==:

```bash
awk -F, 'NR>1 && $5=="NO"' vpn.csv
awk -F, 'NR>1 && $4!="UK"' vpn.csv
```

The first filter returns two rows, so MFA alone does not identify the attacker. The second returns one. ==action: List each user's countries, to spot an account seen in two places==:

```bash
awk -F, 'NR>1 {c[$2]=c[$2] " " $4} END {for (u in c) print u ":" c[u]}' vpn.csv | sort
grep ',j.doe,' vpn.csv
```

> Question: The two `j.doe` logins are 40 minutes apart. Using the worked example in Concepts, could one person have made both?

## Reflection and Exercises {#reflection-and-exercises}

Work through these after you have finished the scenario. Use your own run: the debrief with Priya S. and the closing credits list what happened to each patient, claim and notification, and your choices will differ from other players'.

> Tip: In a group, split the exercises between IT-track and clinical-track players and compare answers at the end.

Each section opens with questions to discuss, then exercises to work through.

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

## Further Reading {#additional-resources}

- Review the [**Information Pack**](/HacktivityLabSheets/labs/security_informed_safety/sis01-healthcare-information-pack/) for detailed explanations of system architecture, medical device systems, safety certification, and regulatory frameworks
- Refer to **MHRA guidance** on the cyber security of medical devices
- Review the **ICO's guidance on personal data breaches** (UK GDPR Articles 33 and 34)
- Consult **NHS Data Security and Protection Toolkit** for UK healthcare security standards
- Research **ISO 14971** and **IEC 80001-1** for medical device risk management on IT networks
- Read NHS England's **Patient Safety Incident Response Framework (PSIRF)** for how incidents are now reviewed
- See the **GSN Community Standard** for Goal Structuring Notation, used in exercise E7
- Read the **NHS clinical risk management standards DCB0129 and DCB0160**, which require hazard logs and clinical safety cases for health IT
- Read the **NCSC's guidance on mitigating malware and ransomware attacks**, including its advice on offline backups
- The Cyber Security Body of Knowledge (CyBOK) **Security-Informed Safety** topic guide covers the ideas in this sheet in more depth
