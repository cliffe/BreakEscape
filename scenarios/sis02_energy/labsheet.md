---
title: "SIS02 Energy - Albion Energy Storage Incident Response"
author: ["Z. Cliffe Schreuders", "Oleg Illiashenko"]
license: "CC BY-SA 4.0"
overview: |
  This scenario explores how cyber security and functional safety meet in critical energy infrastructure. Overnight, an attacker inside the network of Albion Energy Storage, a 200 MWh grid battery site on the River Trent, has fed the control room false temperatures and quietly raised the trip points on its Safety Instrumented System. You arrive with the response team on a Saturday morning to find a SCADA screen that looks perfect and a battery hall heading for thermal runaway. The scenario shows why incident response in operational technology puts safety first: you decide whether to trust an old dial over the screen, when to press a hardwired emergency shutdown that no network can reach, what evidence that shutdown will destroy, how far to cut the attacker off, and what to tell the regulator and a neighbour, while control room engineers, security staff and a managed service provider weigh the same risks differently.
description: |
  Investigate a cyber attack on a grid-scale battery storage site in the East Midlands, where an attacker moved from the corporate IT network into the SCADA system, falsified sensor data and disabled the automatic safety trips. Learn about industrial control systems, Safety Instrumented Systems and hardwired emergency shutdown, IT/OT segmentation and the IEC 62443 zone and conduit model, IEC 61511 and the problem of patching a certified safety system, safety cases (claim, argument and evidence), and UK regulation of energy operators (the NIS Regulations 2018, with Ofgem and DESNZ jointly the competent authority and the NCSC as the CSIRT). Through this game-based learning scenario you will make incident response decisions where containment, evidence and safety pull in different directions, and coordinate engineers, security staff and a managed service provider who see the same incident differently.
cybok:
  - ka: "SIS"
    topic: "Language and Concept Alignment"
    keywords: ["ICS/SCADA terminology", "bridging IT and OT", "Safety Instrumented Systems", "claim, argument and evidence"]
  - ka: "SIS"
    topic: "Incident Response and Resilience"
    keywords: ["OT incident investigation", "emergency shutdown under uncertainty", "evidence preservation versus safety", "safety system integrity verification"]
  - ka: "SIS"
    topic: "Requirements Reconciliation"
    keywords: ["security containment vs operational continuity", "isolation scope", "safety-first prioritisation"]
  - ka: "SIS"
    topic: "Patching of Systems with Safety Cases"
    keywords: ["SIS firmware patch deferral", "IEC 61511 modification management", "compensating controls", "risk acceptance and review"]
  - ka: "SIS"
    topic: "Architecture"
    keywords: ["IEC 62443 zones and conduits", "IT/OT segmentation", "SIS independence", "hardwired emergency shutdown"]
  - ka: "SIS"
    topic: "Organisational Culture"
    keywords: ["control room engineers", "OT security", "managed service provider", "accepted risks nobody reviewed"]
  - ka: "SIS"
    topic: "Tools and Standards"
    keywords: ["IEC 61511", "IEC 62443", "IEC 61508", "NCSC CAF", "Purdue Model"]
  - ka: "CPS"
    topic: "Cyber-Physical Systems Domains"
    keywords: ["industrial control systems", "electric power grids", "battery energy storage"]
  - ka: "RMG"
    topic: "Risk Assessment and Management Principles"
    keywords: ["cyber-physical systems", "risk appetite and residual risk", "incident response and recovery planning"]
  - ka: "LR"
    topic: "Other Regulatory Matters"
    keywords: ["NIS Regulations 2018", "operators of essential services", "incident notification to the competent authority"]
categories: ["security_informed_safety"]
tags: ["security-informed-safety", "energy", "battery-storage", "ics", "scada", "operational-technology", "safety-instrumented-systems", "incident-response", "risk-management", "safety-case", "gsn", "purdue-model", "iec-62443", "iec-61511", "nis-regulations", "break-escape"]
type: ["game-based-learning", "lab-sheet"]
source: "https://github.com/cliffe/BreakEscape/blob/main/scenarios/sis02_energy/labsheet.md"
---

## Introduction: Key Concepts {#introduction-key-concepts}

**Industrial Control Systems (ICS)** monitor and control physical processes: power grids, water treatment, manufacturing and, here, a grid-scale battery. At Albion Energy Storage a SCADA (Supervisory Control and Data Acquisition) server coordinates two PLCs (Programmable Logic Controllers): PLC-BMS, the battery management system that controls charging and cell temperatures, and PLC-GRID, which manages the connection to the grid. Operators watch the plant on HMI (Human-Machine Interface) workstations, and a historian server records every reading over time. These systems must run continuously and respond predictably, so the usual IT habits of patching often, rebooting and scanning freely can disrupt the process they control. Most industrial protocols, Modbus/TCP among them, were designed for closed networks and have no authentication: anything that can reach a PLC on the network can write to it.

**Safety Instrumented Systems (SIS)** exist to bring a process to a safe state when something dangerous happens, whatever the control system is doing. Albion's SIS is a separate safety controller, rated SIL 2 under IEC 61511, that trips the battery racks off charge if cells pass 55°C, and sounds the alarm and ventilates a battery hall if hydrogen reaches 1.0% by volume. Its value rests on independence: separate sensors, separate logic and, in theory, a separate network, so that a fault or an attack on the control system cannot also defeat the safety function. Behind it sits a hardwired emergency shutdown (ESD): pushbuttons wired through relays to the battery contactors, with no software and no network in the path. A cyber attack that changes the SIS settings removes the automatic barrier and leaves only the barriers that need a person.

**IT/OT Convergence** connects the corporate IT network to operational technology (OT) so that engineers can work remotely and the business can analyse plant data. The Purdue Reference Model describes the layers, from enterprise IT at the top down to field devices, and IEC 62443 turns them into security zones joined by conduits that should allow only the traffic each connection needs. At Albion a "smart grid upgrade" left three gaps: a jump server that allowed RDP in both directions, a historian with a network interface on both sides, and "temporary" firewall rules from commissioning that were never removed. Each gap is a conduit that does more than the design said.

**Thermal Runaway and Hydrogen** are the physical hazards. Albion holds its cells below about 45°C in service. Somewhere around 80 to 120°C, depending on the chemistry and the state of charge, a cell starts to heat itself, and a runaway in one cell can spread to its neighbours. Overcharging lowers those temperatures. Before a cell catches fire it vents gas, including hydrogen, which burns at 4.0% by volume in air (its lower explosive limit, LEL). Albion's SIS alarms and ventilates at 1.0% (25% LEL), and the hall is evacuated and shut down at 2.0% (50% LEL). Once a hall is in gas alarm, nobody goes in: that is why ESD stations sit outside the hall and in the control room.

**Incident Response in OT** follows a different order from enterprise IT. In IT, the usual priority is to contain, preserve evidence and restore. In a battery hall, people and plant come first, and the safe action can destroy evidence: pressing the ESD makes the battery controller run its shutdown routine, which overwrites the values the attacker wrote into it. Containment has costs too: cutting the network can blind the control room to parts of the plant that are not under attack. An incident responder must decide under uncertainty, with engineers, security staff and a managed service provider who each see a different part of the picture.

**Regulatory Frameworks** for a GB electricity operator start with the NIS Regulations 2018. Albion is a designated operator of essential services (OES). It must notify its competent authority, the Department for Energy Security and Net Zero (DESNZ) and Ofgem acting jointly, with Ofgem handling notifications in practice, of an incident with a significant impact on its essential service, without undue delay and no later than 72 hours after becoming aware of it. An initial notification with what is known, unknowns marked as unknown, meets that duty; updates follow. The NCSC is the UK's computer security incident response team (CSIRT): it is told alongside, and it helps, but it does not regulate or enforce. HSE is the site's health and safety regulator, the fire and rescue service is called as soon as a hall starts to off-gas, and NESO, the system operator, is told about anything that affected the grid. The Cyber Security and Resilience Bill would change these rules, but in March 2026 it was still before Parliament, so the NIS Regulations 2018 applied as written. The safety standards IEC 61508 and IEC 61511 govern the SIS, including what happens when someone wants to change it.

## What You Will Do {#what-you-will-do}

You will play through an interactive game-based learning scenario set at Albion Energy Storage on the morning of Saturday 21 March 2026. You are the response and engineering team, already on site for a 07:00 maintenance window, when the SCADA engineer, Helen Marsh, tells you that every reading on her screen has been normal all night, and that she doesn't believe a word of it. You will read an analogue dial that no network can reach, check the historian, decide when to shut down a battery hall, find out who is on the jump server and what they changed in the safety system, cut the attacker off, and decide what to tell the regulator and a neighbouring company. You will work with Helen in the control room, Marcus Webb (OT Security Manager) and Tom Hadley (CastleTech's SOC analyst) on the site phone, and Priya S. from the NCSC, who goes through the morning with you at the end. Your decisions have visible consequences: a shutdown costs half the site's output, the shutdown wipes evidence, each way of isolating the attacker costs something, and if nobody acts, the hydrogen in Battery Hall 1 keeps rising.

## Security-Informed Safety: Core Concepts {#security-informed-safety-core-concepts}

This scenario explores what happens when a cyber attack reaches the systems that keep a physical process safe. In an energy storage site, an attacker who can change sensor readings and safety settings can create a fire, not just a data breach.

### CyBOK Security-Informed Safety Topics Covered {#cybok-security-informed-safety-topics-covered}

This scenario addresses the following topics from the CyBOK Security-Informed Safety topic guide:

- **Language and Concept Alignment**: control room engineers, OT security and a managed service provider using words like "safe", "isolated" and "contained" differently
- **Incident Response and Resilience**: shutting down under uncertainty, evidence lost to a safety action, containment that costs visibility *(core focus)*
- **Requirements Reconciliation**: security containment against keeping the grid supplied and the rest of the plant monitored
- **Patching of Systems with Safety Cases**: a SIS firmware fix deferred because it meant eight weeks without the automatic trip and recertification under IEC 61511
- **Architecture**: IEC 62443 zones and conduits, the IT/OT boundary, SIS independence and the hardwired ESD
- **Organisational Culture**: accepted risks that nobody reviewed, a monitoring contract that left OT out, and a supplier that checks before it acts
- **Tools and Standards**: IEC 61511, IEC 61508, IEC 62443, the NCSC Cyber Assessment Framework (CAF) and the Purdue Model

### The Security→Safety Hazard Chain {#the-security-safety-hazard-chain}

This scenario demonstrates the chain: **Cyber Attack → Loss of Functional Safety → Emergent Physical Hazard**

1. **Cyber Attack**: Tampered printer firmware gives a criminal group a foothold; a state-sponsored group buys the access, takes the domain and logs in to the jump server with a dormant contractor's account
2. **Crossing into OT**: The attacker reaches the engineering workstation and, through the dual-homed historian, the SCADA network
3. **Loss of Functional Safety**: The screens show a steady 28°C while the cells heat up, and at 03:22 the SIS trip is raised from 55°C to 85°C and the hydrogen alarm from 1.0% to 3.8% by volume
4. **Emergent Physical Hazard**: Racks A1 to A4 are pushed to charge when nearly full, cells start to vent, and without an ESD the hall reaches the evacuation level and is lost to fire

Your investigation and your decisions determine how far along this chain the morning goes.

## Playing the Scenario {#playing-the-scenario}

### Background and Mission {#background-and-mission}

You are part of the response and engineering team at Albion Energy Storage, a 100 MW / 200 MWh lithium-ion battery site on the Trent near Newark, booked for a 07:00 maintenance window on Saturday 21 March 2026. The SCADA engineer, Helen Marsh, got in at 06:15 and doesn't like what she sees: every reading on the control room screens is normal, too normal for a night with the batteries on charge. Nobody has spotted anything else yet; finding out what the screens are hiding is your job. The Safety Instrumented System, the separate safety controller that should trip the battery racks offline if cells overheat or hydrogen builds up in a hall, may not be doing what everyone assumes.

Your mission is to:
- Find out whether the screens are telling the truth about Battery Hall 1
- Decide when to shut the hall down, and what that will cost
- Find out who is in the network, how they got there and what they changed in the safety system
- Cut the attacker off, deciding how far to go
- Notify the competent authority, and decide whether and when to warn a neighbour that shares Albion's IT

### How to Play {#how-to-play}

The game is a top-down 2D exploration scenario. You move around the SCADA control room, Battery Hall 1 and the engineering workshop with the arrow keys or by clicking. Helen Marsh is in the control room. Marcus Webb, the OT Security Manager, is at home, and Tom Hadley is at CastleTech's security operations centre; you reach both by messaging them on the site phone. Priya S. from the NCSC arrives once Hall 1 is safe, or once everyone is out of it. You examine terminals, documents, panels and gauges; your conversations and what you find unlock decisions, and some decisions cannot be taken back. You can pursue the investigation in different orders, but the cells keep heating while you do.

### What You're Aiming For {#what-youre-aiming-for}

By the end of the scenario, you should be able to explain:
1. **The attack chain**: how the attacker got from a printer to the safety controller, and which accepted weaknesses they used on the way
2. **The safety impact**: what the SIS changes did to the automatic protection, and which barrier was left
3. **The security-safety trade-offs**: shutting down before you know the cause, losing evidence to the shutdown, and the cost of each way of isolating the attacker
4. **The organisational picture**: how an engineer, a security manager, a managed service provider and the NCSC each saw the same morning, and who owned which risk

### Getting Started {#getting-started}

1. ==action: Read the [Information Pack](/HacktivityLabSheets/labs/security_informed_safety/sis02-energy-information-pack/)== to understand the site's network architecture, the SCADA system, the SIS and its safety case, the UK regulatory context (the NIS Regulations, IEC 61511 and IEC 62443) and the incident timeline
2. ==action: Launch **Albion Battery Hall: Code Red** (SIS02 Energy)== from the BreakEscape scenario selection screen
3. ==action: Listen to Helen's briefing in the control room==, then read the incident response folder on the duty desk before you head for the hall

> Warning: The game models a real hazard. In a gas alarm, nobody goes into a battery hall, in the game or on a real site.

## Reflection and Exercises {#reflection-and-exercises}

Work through these after you have finished the scenario. Use your own run: Priya S.'s debrief and the closing credits record what you decided at each point (the dial, the shutdown, the registers, how far to isolate, the notification, Trent Water, the safety claim and the patch), and your choices will differ from other players'.

> Tip: In a group of four to six, split the questions the way you split the roles in play: SCADA engineers (the dial, the historian, the ESD, the SIS panel), IT/OT security (the jump server, isolation, CastleTech) and one or two incident commanders (the shutdown call, the notification, Trent Water). Compare answers at the end, especially where the tracks disagree.

Each section opens with questions to discuss, then exercises that produce something you can hand in or present.

### 1. Risk Management {#1-risk-management}

Nothing that failed at Albion was new. In her closing, Priya names a commissioning link nobody closed, a dead account nobody removed and a patch nobody rescheduled.

**Questions**

> Question: Q1. Priya says each of those three was written down, accepted and never looked at again. Find where the game records each one: the IT/OT Boundary Rules Document on the workshop noticeboard, the jump server log on HMI-ENG-02, and the Deferred Patch Risk Assessment in the workshop filing cabinet. Who owned each risk, and what should have triggered a review? Is her summary fair to all three? The leaver process missed c.ellison's local account rather than accepting it. Is a risk nobody knew about better or worse than one that was accepted and forgotten?

> Question: Q2. The deferred patch risk assessment from September 2024 names one compensating control: the managed SOC watching for lateral movement. Tom and Marcus both tell you that CastleTech's contract excluded OT. Priya says the deferral fitted the board's risk appetite only on paper, and Marcus calls a risk accepted with a control that isn't there "risk pretence". What residual risk did Albion actually carry between September 2024 and March 2026, compared with what the board thought it carried? What should the March 2025 review have checked?

> Question: Q3. Marcus wrote up the jump server and the historian in two quarterly risk reports, and "both times the board noted it and moved on". Priya says a risk the board only notes hasn't been decided. What should a decision to accept a risk record? Who should have owned the boundary risk: Marcus, who wrote it up, or James Whitworth, who held the budget to fix it?

> Question: Q4. Tom says "You can contract out the watching. You can't contract out knowing what we're not watching." Monitoring OT would have caught the 01:47 login, but it would also have put another company's people on Albion's SCADA network. Which risk had Albion transferred to CastleTech, which had it kept, and was the scope of the contract ever decided as a risk decision?

> Question: Q5. In the debrief Priya asks you, as Albion's risk owner today, whether to patch or to defer with controls that really work. Whichever you chose, what residual risk do you now own? Helen pictured eight weeks of rounds at three in the morning. Priya asked who would walk them and who checks they did, or, if you deferred, who checks in a year that the controls are still real. How would you show the board that your choice reduces the risk as low as reasonably practicable (ALARP)?

**Exercises**

> Action: **E1. Risk register entry.** Write the register entry Albion should have had for the IT/OT boundary: the jump server that allows RDP both ways and the dual-homed historian with its Modbus proxy. Include: the risk as cause, event and consequence; the risk owner; likelihood and impact on a 5×5 scale before and after controls; the existing controls, and whether each really existed; the treatment decision (avoid, reduce, transfer or accept) with a reason; and a review trigger. (SIS03 asks for the entry on the SIS patch deferral, so use the boundary here.)

> Action: **E2. Then and now.** Plot the three accepted risks from Q1 on a 5×5 likelihood × impact matrix twice: as they were probably scored when accepted, and as they turned out on Saturday morning. Explain in a paragraph what changed: the threat, the impact, or the assumptions behind the scores.

> Action: **E3. Bow-tie.** Draw a bow-tie for the top event "thermal runaway in Racks A1 to A4". Put threats on the left (including falsified readings that let an overcharge through, and the raised SIS setpoints) and consequences on the right (venting, hydrogen build-up, fire, loss of grid services, harm to people), with preventive and mitigating barriers between them: the BMS charge cut-off, the operator watching the HMI, the SIS trip, the hydrogen alarm, the analogue dial, the hardwired ESD and evacuation. Mark which barriers the attack defeated, which held in your run, and which depended on a person.

### 2. Incident Response {#2-incident-response}

**Questions**

> Question: Q6. Helen asked you which you would bet the hall on: 51°C on the dial at Rack A2, or 28°C on her screen. What did you answer, and why? What did the historian's flat 28.0°C since 23:12 tell you that the dial alone could not? Why is an instrument on no network a different kind of evidence from a sensor reading on SCADA?

> Question: Q7. Helen weighed half the site off the grid and a penalty every hour against losing the hall. Marcus wanted the jump server logs before dropping half the site. Which argument did you make, and on what evidence? Priya asked: "When one mistake costs money and the other costs the building, how sure do you need to be?" Answer her in your own words. Albion lets anyone press an ESD station on a credible hazard without asking: what would go wrong if pressing it needed Marcus's authorisation?

> Question: Q8. Before the ESD, Marcus asked for ten seconds to export the PLC-BMS register table on HMI-OPS-01, because the ESD makes the BMS run its shutdown routine, which overwrites what the attacker wrote. Did you save it? What does the historian still hold, and what is lost without the export? Where would you draw the line on delaying a safety action for evidence, and who should make that call on the night? (In SIS03, the missing register image is one of the gaps in the insurer's evidence.)

> Question: Q9. The jump server log on HMI-ENG-02 showed c.ellison logged in since 01:47. Which details told you the session was not legitimate: the account, the source host, the time? The historian had gone flat at 23:12, before that login. What did Marcus conclude from that order of events, and why did it matter when you came to isolate?

> Question: Q10. Pulling the jump server cable cut the RDP session but not the historian. Marcus offered three ways to go further: cut the historian's enterprise leg (losing the dispatch feed and NESO reporting for a day), leave it connected and watch it, or shut SCADA down (putting someone in Hall 2 every hour with a gas monitor). What did you choose? Priya said the plan should have chosen before the night. What criteria should that plan use? (See CLAIM-EN-010 in the information pack.)

> Question: Q11. Tom would not block enterprise traffic to SCADA until he had rung Marcus back on the number CastleTech holds. If you tried your own say-so, or told him Marcus had signed it off before he had, what happened? Why is this out-of-band check right even in a real emergency, and what kind of attack does it stop?

> Question: Q12. Marcus asked whether to send the NIS notification with what you had or to wait for the full picture. When did Albion become aware of the incident, for the 72-hour limit? What could an initial notification say at 07:00, when nobody yet knew how far the attacker had got? Why does it go to Ofgem, for the competent authority, rather than to the NCSC, and who else needed telling separately (the NCSC, HSE, the fire and rescue service, NESO), and why?

> Question: Q13. CastleTech's svc.deploy account wrote a package to the shared file server at 02:31, and a Trent Water workstation opened it at 05:52. Trent Water runs a small pumping station and is not an operator of essential services. Did Albion owe Trent Water a warning, and under what duty? Why did Tom need Albion's consent to tell them? Did you warn them straight away or check the evidence first, and what did each choice risk?

**Exercises**

> Action: **E4. Incident timeline.** Build a timeline from the tampered printer firmware weeks before to the end of your run. Mark the initial access, the falsified readings from 23:12, the 01:47 login, the 02:31 file, the 03:22 SIS change, the 05:52 file opening at Trent Water, the moment Albion became aware, each of your decisions and each notification. Highlight any gap where nobody was watching or nobody owned a task.

> Action: **E5. Initial NIS notification.** Complete the NIS notification form (on the clipboard by the workshop door) as Albion would have sent it at 07:00, in no more than 250 words. Fill in every field, and say plainly which parts are not yet known and will follow in an update. Then write the advisory Tom sends to Trent Water, in no more than three sentences: what is known, what isn't, and what they should do now.

> Action: **E6. OT incident decision guide.** Write a one-page guide for Albion's control room for "a credible thermal hazard with a suspected intrusion". Cover: who may press the ESD and when; what evidence may be captured first, and the time limit; the isolation options, each with the compensating control it needs; who may instruct CastleTech and how they verify it; and who is told, by when. This is the kind of evidence CLAIM-EN-010 asks for.

### 3. Security-Informed Safety {#3-security-informed-safety}

The hazard chain at Albion was: **cyber attack → loss of a safety function → physical hazard**. Security-informed safety asks what a safety case must claim, and what evidence it needs, once you accept that someone may be trying to defeat it.

**Questions**

> Question: Q14. Priya put one claim to you. Albion's safety case claimed that the safety system trips whatever happens to SCADA (CLAIM-EN-002). The argument was that the SIS sat on its own network. The evidence would have been a test showing its engineering port could not be reached from SCADA, and there had not been one since commissioning. Did you say the claim held or broke? Which part failed, the claim, the argument or the evidence, and when did it fail?

> Question: Q15. Priya says the ESD claim (CLAIM-EN-008) held "and the reason is evidence": a proof test every year with everything digital switched off, last in October 2025. The dial claim (CLAIM-EN-007) only half held: it promised an automatic comparison and an alarm, and it took a person walking into the hall. What turns a test into evidence for a claim? What does it say about Albion's defences that the barrier that found the attack depended on Helen not trusting a perfect screen?

> Question: Q16. The SIS configuration panel showed a thermal trip of 85°C and a hydrogen alarm of 3.8% by volume, against the certified 55°C and 1.0% in the safety requirements specification in the filing cabinet. Why might an attacker choose those values rather than switch the SIS off? A safety argument written for accidents assumes faults are random; what changes when the "fault" is an adversary who read the setpoints from the historian weeks before? The SIS kept no record of the change: what does that do to the evidence for its configuration?

> Question: Q17. Using IEC 62443, name Albion's zones (enterprise, DMZ, SCADA, control, safety) and the conduits between them. Which conduits allowed more than the design said? IEC 61511 requires the SIS to be independent of the control system and, since its 2016 edition, a security risk assessment of the SIS. Where did Albion's architecture fall short of each?

> Question: Q18. Marcus wants the SIS air-gapped: "If it's not plugged in, they can't reach it." Priya answers that air gaps get bridged, usually by a laptop or a USB stick, and would put the SIS in its own zone with one way in, someone watching it, and a key switch that has to be turned on site (in the TRITON attack in 2017 it was left in PROGRAM). Remember how this attack began. Make the best case for each view. Which would you write into the safety case, and what evidence would show it still holds a year later?

> Question: Q19. The patch is where security and safety requirements collide: the NCSC CAF and IEC 62443 say fix a known vulnerability, while IEC 61511's modification management says any change to a certified SIS needs impact analysis, retesting and sign-off, here eight weeks without the automatic trip. Compare CLAIM-EN-005 (patch, with compensating controls during recertification) with CLAIM-EN-006 (defer, with compensating cyber controls). Which is the stronger claim, and what did eighteen months of deferral at Albion show about the weaker one?

> Question: Q20. Helen, Marcus, Tom and Priya each used words like "safe", "isolated", "contained" and "authorised" in their own way. Find one moment in the game where that caused, or nearly caused, a wrong decision.

**Exercises**

> Action: **E7. Rebuild a claim.** Redraw CLAIM-EN-002 as a Goal Structuring Notation (GSN) fragment that would hold up against a deliberate attacker. Add a strategy that argues over attacker capability as well as random hardware failure; sub-claims such as "the engineering port cannot be reached from SCADA" and "no setpoint can change without someone on site turning the key"; evidence for each, with how often it is gathered; and one defeater taken from what happened at Albion.

> Action: **E8. Zones and conduits.** Redraw Albion's network (the network architecture diagram in the control room and in the information pack) as IEC 62443 zones and conduits, with the SIS in its own zone. For each conduit, give what it should allow, what it allowed on 21 March, and one control that would enforce it. Add the shared file server and Trent Water, and explain why the hardwired ESD has no conduit at all.

> Action: **E9. From hazard to requirement.** For the setpoint tamper, write the hazard, its security cause, its effect on the cells and on people, and the controls that existed. Then write one new security requirement and trace it to the safety requirement it protects in the information pack (for example REQ-EN-SAF-002, thermal protection, or REQ-EN-SAF-011, SIS configuration integrity). Say how you would test it without taking the safety function out of service.

---

## Additional Resources {#additional-resources}

- Review the [**Information Pack**](/HacktivityLabSheets/labs/security_informed_safety/sis02-energy-information-pack/) for the network architecture, ICS protocols, the SIS, the safety case claims and requirements, and the regulatory frameworks
- Read the **NIS Regulations 2018** (regulations 10 and 11) and **Ofgem's guidance** for operators of essential services in the energy sector
- Use the **NCSC Cyber Assessment Framework (CAF)**, the basis for assessing operators of essential services
- Read **IEC 61511-1:2016**, especially clause 8.2.4 (SIS security risk assessment) and clause 17 (modifying a SIS), with **IEC 61508** for Safety Integrity Levels
- Read **IEC 62443-3-3** and **IEC 62443-4-2** for zones, conduits and component security, and **IEC 62443-2-4** for service providers such as CastleTech
- See **HSE's operational guidance OG86** on cyber security for industrial automation and control systems
- Read a public analysis of the **TRITON (TRISIS)** attack on a safety controller in 2017
- See the **GSN Community Standard** for Goal Structuring Notation, used in exercise E7
- Read the **NFCC guidance** for fire and rescue services on grid-scale battery energy storage sites
