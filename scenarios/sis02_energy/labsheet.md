---
title: "SIS02 Energy - Albion Energy Storage Incident Response"
author: ["Z. Cliffe Schreuders", "Oleg Illiashenko"]
license: "CC BY-SA 4.0"
overview: |
  This scenario explores how cyber security and functional safety meet in critical energy infrastructure. Overnight, an attacker inside the network of Albion Energy Storage, a 200 MWh grid battery site on the River Trent, has fed the control room false temperatures and quietly raised the trip points on its Safety Instrumented System. You arrive with the response team on a Saturday morning to find a SCADA screen that looks perfect and a battery hall heading for thermal runaway. The scenario shows why incident response in operational technology puts safety first: you decide whether to trust an old dial over the screen, when to press a hardwired emergency shutdown that no network can reach, what evidence that shutdown will destroy, how far to cut the attacker off, and what to tell the regulator and a neighbour, while control room engineers, security staff and a managed service provider weigh the same risks differently.

  The game, Albion Battery Hall: Code Red, runs in your browser, with no virtual machines. This sheet gets you started, explains the ideas behind each decision and each console with worked examples you can check by hand, and has a stage-by-stage set of hints for when you are stuck, from a gentle nudge up to the full steps. After that there are questions and exercises on risk management, incident response and security-informed safety.
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
difficulty: "intermediate"
source: "https://github.com/cliffe/BreakEscape/blob/main/scenarios/sis02_energy/labsheet.md"
---

## Purpose {#purpose}

By the end of this lab you should be able to:

- explain how a cyber attack on an energy site becomes a physical hazard, using the chain: cyber attack, loss of a safety function, physical hazard
- check a networked display against an independent physical measurement, and spot data that is being written rather than measured
- tell apart the control system, a programmable safety system and a hardwired emergency shutdown, and say which ones an attacker on the network can reach
- read a remote access log for a dormant account and a source address that does not belong
- compare a safety system's live setpoints with its certified baseline, and convert a gas reading between per cent by volume and per cent of the lower explosive limit
- weigh a safety action against the evidence it destroys, and an isolation option against what it costs
- say who must be told about an incident at a GB energy operator, when, and under which law
- read a safety case claim as claim, argument and evidence, and judge whether it held

The game teaches by doing. The questions are in this sheet, after the game.

## How to Use This Sheet {#how-to-use}

1. Read the [Information Pack](/HacktivityLabSheets/labs/security_informed_safety/sis02-energy-information-pack/) if your tutor has set it, then read **Getting Started** and try the short warm-up. It takes five minutes.
2. Play. Skim **Concepts** as you reach each new idea, or come back to it when a character or a document leaves you wanting more.
3. If you get stuck, go to **Stuck? Hints, Stage by Stage** and find the stage you are on. Each stage has a hint you can read straight away, then a stronger hint in a collapsed section labelled **Nudge**, and the full method in one labelled **Steps** or **Recipe**. Open one at a time, and go back to the game after each.
4. After the game, work through **After the Game: Reflection and Exercises**.

> Note: Most stages in this game are decisions, not puzzles. When to press the emergency shutdown, whether to save evidence first, how far to cut the attacker off, when to notify and whether to warn a neighbour all have more than one defensible answer. The hints tell you what you know and what each option costs. They do not tell you what to choose. No ending is a failure: even if nobody shuts the hall down in time, the game carries on to the debrief, and the debrief and the closing credits show what happened as a result of your choices.

## Getting Started {#getting-started}

### Background and Mission {#background-and-mission}

You are part of the response and engineering team at Albion Energy Storage, a 100 MW / 200 MWh lithium-ion battery site on the Trent near Newark, booked for a 07:00 maintenance window on Saturday 21 March 2026. The SCADA engineer, Helen Marsh, got in at 06:15 and doesn't like what she sees: every reading on the control room screens is normal, too normal for a night with the batteries on charge. Nobody has spotted anything else yet; finding out what the screens are hiding is your job. The Safety Instrumented System, the separate safety controller that should trip the battery racks offline if cells overheat or hydrogen builds up in a hall, may not be doing what everyone assumes.

Your mission is to:
- Find out whether the screens are telling the truth about Battery Hall 1
- Decide when to shut the hall down, and what that will cost
- Find out who is in the network, how they got there and what they changed in the safety system
- Cut the attacker off, deciding how far to go
- Notify the competent authority, and decide whether and when to warn a neighbour that shares Albion's IT

### What You Will Do {#what-you-will-do}

You will play through an interactive game-based learning scenario set at Albion Energy Storage on the morning of Saturday 21 March 2026. You are the response and engineering team, already on site for a 07:00 maintenance window, when the SCADA engineer, Helen Marsh, tells you that every reading on her screen has been normal all night, and that the screen is telling fairy stories. You will read an analogue dial that no network can reach, check the historian, decide when to shut down a battery hall, find out who is on the jump server and what they changed in the safety system, cut the attacker off, and decide what to tell the regulator and a neighbouring company. You will work with Helen in the control room, Marcus Webb (OT Security Manager) and Tom Hadley (CastleTech's SOC analyst) on the site phone, and Priya S. from the NCSC, who goes through the morning with you at the end. Your decisions have visible consequences: a shutdown costs half the site's output, the shutdown wipes evidence, each way of isolating the attacker costs something, and if nobody acts, the hydrogen in Battery Hall 1 keeps rising.

### What You're Aiming For {#what-youre-aiming-for}

By the end of the scenario, you should be able to explain:
1. **The attack chain**: how the attacker got from a printer to the safety controller, and which accepted weaknesses they used on the way
2. **The safety impact**: what the SIS changes did to the automatic protection, and which barrier was left
3. **The security-safety trade-offs**: shutting down before you know the cause, losing evidence to the shutdown, and the cost of each way of isolating the attacker
4. **The organisational picture**: how an engineer, a security manager, a managed service provider and the NCSC each saw the same morning, and who owned which risk

### Starting the Game {#starting-the-game}

You play a member of the response and engineering team, on site early for a maintenance window, when the site's SCADA engineer decides she does not believe her own screens. You do not need an engineering background. Helen explains the plant as you go, Marcus explains the network, and the documents around the site explain the rest. Everything happens in the browser: this game has no virtual machines and no flags to find. The historian, the jump server log and the safety system panel are all consoles inside the game.

1. \==action: Read the [Information Pack](/HacktivityLabSheets/labs/security_informed_safety/sis02-energy-information-pack/)== to understand the site's network architecture, the SCADA system, the SIS and its safety case, the UK regulatory context (the NIS Regulations, IEC 61511 and IEC 62443) and the incident timeline. If your tutor has not set it, skim its timeline after the game instead.
2. \==action: Start the Break Escape mission **Albion Battery Hall: Code Red** (SIS02 Energy)==.
3. \==action: Watch the opening scene and listen to Helen's briefing in the control room==. She gives you her **Battery Hall Access Badge**, which opens the north door into Battery Hall 1.
4. \==action: Read the **Incident Response Folder** on the duty desk before you head for the hall==. It holds the site's rules for the emergency shutdown, the hydrogen levels, the NIS notification and who may instruct CastleTech.
5. \==action: Open the objectives list and keep an eye on it==. Aims open as you find things, and their tasks tell you which room to go to next.

The game takes about 70 minutes, including the debrief. In a 60-minute class, read Getting Started and do the warm-up before the session. If you run out of time, a good place to stop is once the emergency shutdown for Hall 1 is in and you have found who is on the jump server: the hall is safe, and what is left (isolation, the notification and the debrief) can wait for next time. Your progress is saved, and the game's clocks count only the time you spend playing, so they carry on from where they were when you come back.

> Warning: The game models a real hazard. In a gas alarm, nobody goes into a battery hall, in the game or on a real site.

### How to Play {#how-to-play}

The game is a top-down 2D exploration scenario. You move around the SCADA control room, Battery Hall 1 and the engineering workshop with the arrow keys or by clicking. Helen Marsh is in the control room. Marcus Webb, the OT Security Manager, is at home, and Tom Hadley is at CastleTech's security operations centre; you reach both by messaging them on the site phone. Priya S. from the NCSC arrives once Hall 1 is shut down and CastleTech have cut the attacker off. You examine terminals, documents, panels and gauges; your conversations and what you find unlock decisions, and some decisions cannot be taken back. You can pursue the investigation in different orders, but the cells keep heating while you do.

There are three rooms. You start in the **SCADA control room**. **Battery Hall 1** is through the north door (Helen's badge opens it), and the **engineering workshop** is through the east door. The workshop needs the **Engineering Workshop RFID Key**, which is in the **Duty Officer Desk** drawers in the control room.

> Tip: The **Albion Site Phone** is in your inventory from the start. Click it to message Marcus Webb and Tom Hadley. A number on the phone means a new message has come in. Marcus and Tom answer in text, and each conversation is a list of options you click.

> Tip: Helen stays at her desk, but she keeps an eye on the plant and radios you when something changes. Her radio messages pop up on screen as she speaks them. Read them: they often tell you what has just opened up. If you miss one, go and ask her **[What next?]**.

> Tip: Most documents you read are saved to your **notepad**, so you can reread them later without walking back. Things you pick up, such as the badge, the workshop key and the filing cabinet key, go into your inventory.

> Tip: The **Facility Alarm Panel** on the control room wall by the hall door shows the plant at a glance: the hall, the ESD, the safety system, the jump server, the network, the hydrogen and whether the site is in a safe state. Its lamps change as you act. See "What the Tools and Locks Are Telling You".

> Tip: Once the team knows something is wrong, a countdown appears for the **NIS notification clock (game time)**. It stands for the 72 hours the law allows, squeezed into 45 minutes of play. If it runs out, nothing is locked: you can still send the notification, late.

> Warning: Some actions cannot be undone: pressing an emergency shutdown, pulling the jump server cable, and most of the decisions you give Marcus and Tom. Read what a console or a person tells you before you confirm.

### Getting Help Inside the Game {#in-game-help}

The people in the game are your first source of help, and the documents around the site are your second. Options appear in a conversation only when they make sense, so if one listed here is missing, you have not reached that point yet.

| Ask or read | For | When it is there |
| --- | --- | --- |
| Helen: **[What next?]** | The next thing to do. This is the game's own hint | Always |
| Helen: **[What am I looking for in the hall?]** | What the dial is and why it matters | Before anyone has read the dial, and not once the gas alarm has sounded |
| Helen: **[Tell me about the emergency shutdown.]**, then **[What does pressing it cost us?]** and **[Can it be undone?]** | How the ESD works, what pressing it costs, how it is reset | Always. **[More about the ESD.]** brings the follow-ups back if you leave early |
| Helen: **[The historian's flat. What does that tell you?]** | What a flat trend means | After you have checked the historian |
| Helen: **[The SIS trip's at eighty-five. What does that mean?]**, then **[How did they get in to change it?]** and **[How do we know it was three twenty-two?]** | What the setpoint change does, how it was made, and where the 03:22 time comes from | After you report the SIS change. **[More about the SIS.]** brings the follow-ups back if you leave early |
| Helen: **[Why wasn't the SIS patched?]** | The patch and what it would have meant for her team | After you report the SIS change |
| Helen: **[The hydrogen alarm. How bad is it?]** | The gas levels and what to do | Once the hydrogen alarm sounds |
| Marcus: **[Where are we?]** | Where the response stands, from the security side | Always |
| Marcus: **[What am I looking for on the jump server?]** | How to read the jump server log | After your first message, until you find the session |
| Marcus: **[Has anyone ever written up that jump server?]**, then **[About that boundary again.]** | The IT/OT boundary, why it was never fixed, and his view on the safety system's network | After your first message |
| Marcus: **[Why was the SIS patch deferred?]** | His risk assessment and its missing control | After you report the SIS change |
| Tom: **[What exactly do you monitor for us?]** | What CastleTech can and cannot see | Always |
| Tom: **[Now we've found that session. Would OT monitoring have caught it?]** | Whether CastleTech would have seen the intruder | Once the session is found, if you asked about monitoring before that |
| Tom: **[Anything new your side?]** | News from the enterprise network | Always |
| **Incident Response Folder**, duty desk | The ESD rule, hydrogen levels, NIS duties, who may instruct CastleTech | Always |
| **Network Architecture Diagram**, control room wall | The Purdue levels and the weak points. Click a box to read it | Always |
| **IT/OT Boundary Rules Document**, workshop noticeboard | What the jump server and the historian were supposed to allow | Once you are in the workshop |

### Warm-up: Three Sensors, One Dial and a Gas Reading {#warm-up}

Try this before you start, or while the opening scene plays. It uses made-up data from a made-up pumping station, not anything from the game.

**Part 1.** A control room screen shows three temperature sensors on the same pump skid, one reading a minute:

```
MINUTE    SENSOR A   SENSOR B   SENSOR C
  1        41.2       39.0       40.8
  2        41.5       39.0       41.0
  3        41.1       39.0       40.7
  4        41.6       39.0       41.1
  5        41.3       39.0       40.9
```

A technician walks out to the skid. The mechanical dial next to Sensor B, which is not wired to anything, reads 47.

\==action: Decide which reading you would trust for Sensor B's position, and what you would do first==.

<details markdown="1">
<summary>Check your answer</summary>

Sensors A and C wobble by a few tenths of a degree, as real sensors do. Sensor B has not moved at all in five minutes. A real sensor on a running pump never does that, so something is writing 39.0 into it. The dial is on no network, so nothing that can write to the screen can change it. For Sensor B's position, the dial is the reading to trust.

What to do first is a separate judgement, and it depends on what each mistake costs. If the dial is right and you wait to find out why the screen is wrong, the pump keeps running eight degrees hotter than anyone thinks. If the dial has stuck and you stop the pump, you lose output for nothing. The more one mistake costs than the other, the less sure you need to be before you act.

</details>

**Part 2.** A gas detector reads 0.6% hydrogen by volume. Hydrogen can burn once it reaches 4.0% by volume in air, its lower explosive limit (LEL).

> Question: What is 0.6% by volume as a percentage of the LEL? (Divide the reading by the LEL and multiply by 100. "Hydrogen: Per Cent by Volume and Per Cent LEL" in Concepts explains why.)

<details markdown="1">
<summary>Check your answer</summary>

0.6 / 4.0 = 0.15, so 15% LEL. That is below an alarm set at 25% LEL, but a hall that should read zero is reading something: cells are venting.

</details>

You have just practised, in miniature, two skills the first half of the game uses: deciding which reading to trust, and putting a gas reading in context. What to do about them is the judgement the game leaves to you.

## Concepts {#concepts}

You do not need to read all of this before you play. Use it when you reach each idea, and again afterwards when you answer the questions. Each subsection says where in the game you can find more.

### The Big Picture {#introduction-key-concepts}

**Industrial Control Systems (ICS)** monitor and control physical processes: power grids, water treatment, manufacturing and, here, a grid-scale battery. At Albion Energy Storage a SCADA (Supervisory Control and Data Acquisition) server coordinates two PLCs (Programmable Logic Controllers): PLC-BMS, the battery management system that controls charging and cell temperatures, and PLC-GRID, which manages the connection to the grid. Operators watch the plant on HMI (Human-Machine Interface) workstations, and a historian server records every reading over time. These systems must run continuously and respond predictably, so the usual IT habits of patching often, rebooting and scanning freely can disrupt the process they control. Most industrial protocols, Modbus/TCP among them, were designed for closed networks and have no authentication: anything that can reach a PLC on the network can write to it.

**Safety Instrumented Systems (SIS)** exist to bring a process to a safe state when something dangerous happens, whatever the control system is doing. Albion's SIS is a separate safety controller, rated SIL 2 under IEC 61511, that trips the battery racks off charge if cells pass 55°C, and sounds the alarm and ventilates a battery hall if hydrogen reaches 1.0% by volume. Its value rests on independence: separate sensors, separate logic and, in theory, a separate network, so that a fault or an attack on the control system cannot also defeat the safety function. Behind it sits a hardwired emergency shutdown (ESD): pushbuttons wired through relays to the battery contactors, with no software and no network in the path. A cyber attack that changes the SIS settings removes the automatic barrier and leaves only the barriers that need a person.

**IT/OT Convergence** connects the corporate IT network to operational technology (OT) so that engineers can work remotely and the business can analyse plant data. The Purdue Reference Model describes the layers, from enterprise IT at the top down to field devices, and IEC 62443 turns them into security zones joined by conduits that should allow only the traffic each connection needs. At Albion a "smart grid upgrade" left three gaps: a jump server that allowed RDP in both directions, a historian with a network interface on both sides, and "temporary" firewall rules from commissioning that were never removed. Each gap is a conduit that does more than the design said.

**Thermal Runaway and Hydrogen** are the physical hazards. Albion holds its cells below about 45°C in service. Somewhere around 80 to 120°C, depending on the chemistry and the state of charge, a cell starts to heat itself, and a runaway in one cell can spread to its neighbours. Overcharging lowers those temperatures. Before a cell catches fire it vents gas, including hydrogen, which burns at 4.0% by volume in air (its lower explosive limit, LEL). Albion's SIS alarms and ventilates at 1.0% (25% LEL), and the hall is evacuated and shut down at 2.0% (50% LEL). Once a hall is in gas alarm, nobody goes in: that is why ESD stations sit outside the hall and in the control room.

**Incident Response in OT** follows a different order from enterprise IT. In IT, the usual priority is to contain, preserve evidence and restore. In a battery hall, people and plant come first, and the safe action can destroy evidence: pressing the ESD makes the battery controller run its shutdown routine, which overwrites the values the attacker wrote into it. Containment has costs too: cutting the network can blind the control room to parts of the plant that are not under attack. An incident responder must decide under uncertainty, with engineers, security staff and a managed service provider who each see a different part of the picture.

**Regulatory Frameworks** for a GB electricity operator start with the NIS Regulations 2018. Albion is a designated operator of essential services (OES). It must notify its competent authority, the Department for Energy Security and Net Zero (DESNZ) and Ofgem acting jointly, with Ofgem handling notifications in practice, of an incident with a significant impact on its essential service, without undue delay and no later than 72 hours after becoming aware of it. An initial notification with what is known, unknowns marked as unknown, meets that duty; updates follow. The NCSC is the UK's computer security incident response team (CSIRT): it is told alongside, and it helps, but it does not regulate or enforce. HSE is the site's health and safety regulator, the fire and rescue service is called as soon as a hall starts to off-gas, and NESO, the system operator, is told about anything that affected the grid. The Cyber Security and Resilience Bill would change these rules, but in March 2026 it was still before Parliament, so the NIS Regulations 2018 applied as written. The safety standards IEC 61508 and IEC 61511 govern the SIS, including what happens when someone wants to change it.

### Security-Informed Safety: Core Concepts {#security-informed-safety-core-concepts}

This scenario explores what happens when a cyber attack reaches the systems that keep a physical process safe. In an energy storage site, an attacker who can change sensor readings and safety settings can start a fire as well as steal data.

#### CyBOK Security-Informed Safety Topics Covered {#cybok-security-informed-safety-topics-covered}

This scenario addresses the following topics from the CyBOK Security-Informed Safety topic guide:

- **Language and Concept Alignment**: control room engineers, OT security and a managed service provider using words like "safe", "isolated" and "contained" differently
- **Incident Response and Resilience**: shutting down under uncertainty, evidence lost to a safety action, containment that costs visibility *(core focus)*
- **Requirements Reconciliation**: security containment against keeping the grid supplied and the rest of the plant monitored
- **Patching of Systems with Safety Cases**: a SIS firmware fix deferred because it meant eight weeks without the automatic trip and recertification under IEC 61511
- **Architecture**: IEC 62443 zones and conduits, the IT/OT boundary, SIS independence and the hardwired ESD
- **Organisational Culture**: accepted risks that nobody reviewed, a monitoring contract that left OT out, and a supplier that checks before it acts
- **Tools and Standards**: IEC 61511, IEC 61508, IEC 62443, the NCSC Cyber Assessment Framework (CAF) and the Purdue Model

#### The Security→Safety Hazard Chain {#the-security-safety-hazard-chain}

This scenario demonstrates the chain: **Cyber Attack → Loss of Functional Safety → Emergent Physical Hazard**

1. **Cyber Attack**: Tampered printer firmware gives a criminal group a foothold; a state-sponsored group buys the access, takes the domain and logs in to the jump server with a dormant contractor's account
2. **Crossing into OT**: The attacker reaches the engineering workstation and, through the dual-homed historian, the SCADA network
3. **Loss of Functional Safety**: The screens show a steady 28°C while the cells heat up, and at 03:22 the SIS trip is raised from 55°C to 85°C and the hydrogen alarm from 1.0% to 3.8% by volume
4. **Emergent Physical Hazard**: Racks A1 to A4 are pushed to charge when nearly full, cells start to vent, and without an ESD the hall reaches the evacuation level and is lost to fire

Your investigation and your decisions determine how far along this chain the morning goes.

### Trusting a Screen: Independent Measurements {#concept-dial}

A SCADA screen does not measure anything. It shows numbers that a controller holds, and the controller holds whatever was last written into it, by a sensor or by anything else on the network that can talk to it. Industrial protocols such as Modbus/TCP have no authentication, so "anything else" includes an attacker.

An **independent measurement** is one that does not pass through the same path. Ask of any reading: where does this number come from, and could something on the network change it?

| Reading | Where its number comes from | Can something on the network change it? |
| --- | --- | --- |
| An operator screen (HMI) | The controller's registers, via the SCADA server | Yes |
| A wall display that mirrors the HMI | The same registers | Yes, and it will agree with the HMI |
| A digital panel on the equipment, fed by the same controller | The same registers | Yes, and it will agree too |
| A gas detector wired straight to the safety system | Its own sensor | Not through SCADA |
| A mechanical dial on no network | The physical process | No |

Three screens that agree are still only one source. Agreement means something only when the readings could have disagreed.

**A worked example, made up.** A water tank has a level sensor feeding SCADA, a wall display copying SCADA, and a glass sight tube on the side of the tank. The SCADA screen and the wall display both say 2.1 m. The sight tube shows 3.4 m. That is two sources, not three: the two screens are one number shown twice. They disagree with the sight tube by 3.4 − 2.1 = 1.3 m. The sight tube is on no network, so nobody can type a number into it. It can still be wrong (it can be blocked or misread), but it cannot be wrong for the same reason the screen is.

> Question: A dial is independent, but it is not perfect: it can stick, or be misread. What could you check, in two minutes, to rule that out?

At Albion the **Local Dial Gauge: Rack A2** in Battery Hall 1 is the independent reading. **HMI-OPS-01** in the control room, the **Facility Status Board** on the wall and the **Battery Rack Status Panels (Digital)** in the hall all come from the battery controller. To learn more in the game, ask Helen **[What am I looking for in the hall?]** before you go in. CLAIM-EN-007 in the information pack is the safety claim that should have turned this check into an automatic alarm.

### A Flat Line: Data That Is Written, Not Measured {#concept-historian}

A **historian** records every reading over time, so you can look back at the night. It records what the controller held, so falsified values go into it too. It still gives the attacker away, because real measurements and written numbers look different over time.

Real sensors are noisy. Temperature moves with load, airflow and the sensor's own electronics, so consecutive readings differ by a little. A number written by a program and held there does not move at all. The way to put a number on "moves a little" is the **variance**: the average of the squared distances from the mean. Real data has a small variance. Written data has a variance of zero.

**A worked example, made up.** Five readings a minute apart from a real sensor, and five from a sensor that is being overwritten:

```
REAL SENSOR: 30.1  30.4  29.9  30.3  30.0
  mean      = (30.1 + 30.4 + 29.9 + 30.3 + 30.0) / 5 = 150.7 / 5 = 30.14
  deviation = -0.04  +0.26  -0.24  +0.16  -0.14
  squared   = 0.0016 0.0676 0.0576 0.0256 0.0196    sum = 0.172
  variance  = 0.172 / 5 = 0.0344   (standard deviation about 0.19)

WRITTEN:     28.0  28.0  28.0  28.0  28.0
  mean      = 28.0
  deviation = 0      0      0      0      0
  variance  = 0
```

If you divide by 4 instead of 5 (the "sample" variance), the real sensor gives 0.043. Either way it is not zero.

The **rate of change** tells the same story more simply. Subtract each reading from the next. The real sensor gives +0.3, −0.5, +0.4, −0.3. The written one gives 0.0, 0.0, 0.0, 0.0. A run of exact zeros across several readings is not something a real sensor does.

Look also for the **join**: the last real reading, then a step to a new value that never moves again. The time of that step is when someone started writing.

> Question: How long a run of zeros would you want to see before you were sure? Why does it matter how often the historian takes a reading?

At Albion the **Historian Trend Viewer** on HMI-OPS-01 has a rate-of-change overlay (**dZ/dt**) and a **COMPARE RACKS** view that do these sums for you. To learn more in the game, ask Helen **[The historian's flat. What does that tell you?]** once you have checked it.

### Layers of Protection: Control System, SIS and Hardwired ESD {#concept-layers}

A hazardous plant does not rely on one safeguard. It has **layers of protection**, each meant to catch what the layer above it missed. A layer only counts if it can fail independently of the others: two layers that an attacker can switch off with one login are one layer.

| Layer | What it is at Albion | What it relies on | Reachable from the network on 21 March? |
| --- | --- | --- | --- |
| Control system | PLC-BMS, which stops charging at 90% state of charge, run from the SCADA server | The values in its registers | Yes. Modbus/TCP has no authentication |
| Operator | Jay Patel on the night shift, watching HMI-OPS-01 | The screen | Yes, through the screen |
| Safety Instrumented System (SIS) | A separate safety controller, SIL 2 under IEC 61511, with its own sensors. Trips Racks A1 to A4 off charge at 55°C; alarms and ventilates at 1.0% hydrogen by volume | Its configuration (its setpoints) | Its engineering port was reachable from the SCADA network, through HMI-ENG-02 |
| Hardwired emergency shutdown (ESD) | Pushbuttons wired through relays to the battery contactors and the cooling. No software anywhere in the path | The wiring, proved by an annual test with everything digital switched off | No |
| People and procedure | The dial, the gas alarm, evacuation, the fire service | Someone noticing, and acting | No, but they need a person |

The SIS is programmable, so it can be reconfigured. That is useful for engineers, and it means the SIS is only independent of the control system if nothing on the control system can reach its configuration. The hardwired ESD cannot be reconfigured at all. That is its value: no network can stop it, and nobody needs a password or permission to press it.

**A worked example, made up.** A steam boiler has four layers against over-pressure: the control loop that trims the burner, a high-pressure alarm on the operator screen, a programmable safety trip that cuts the fuel, and a spring-loaded relief valve. An attacker controls the network that the control loop, the alarm screen and the safety trip's engineering port all sit on. Count what is left: the relief valve, which is mechanical, and anyone standing next to the boiler. Four layers on paper, one and a half in practice.

> Question: Which of Albion's remaining layers needed a person to act? What does that mean at three in the morning with one junior technician on shift?

To learn more in the game, ask Helen **[Tell me about the emergency shutdown.]**, then **[What does pressing it cost us?]** and **[Can it be undone?]**. The **Network Architecture Diagram** on the control room wall shows the "HARDWIRED SAFETY LAYER (NO NETWORK)" below everything else. CLAIM-EN-008 in the information pack is the ESD's safety claim.

### Reading a Jump Server Log {#concept-jump-log}

A **jump server** is the one place engineers are meant to cross from the office network into the control network. Because everything crossing should pass through it, its log is where an intruder shows up. Read each session with three questions:

- **Who?** Is the account still meant to exist? A **dormant account** belongs to someone who has left or no longer needs access. Leaver processes often disable the main (domain) account and miss **local accounts** created on one server, which keep working, sometimes with their original default password.
- **When?** Does the time fit how the site works? An engineering login in the small hours on a weekend, with nobody on call, needs explaining.
- **Where from?** Does the source address belong to the people who normally log in? Engineers usually connect from one subnet.

Source addresses tell you where the attacker is. The ranges `10.0.0.0/8`, `172.16.0.0/12` (172.16 to 172.31) and `192.168.0.0/16` are **private**: they are used inside organisations and are not reachable from the internet. A session from a private address that is not an engineer's machine means the attacker is already inside the office network and is using one of its machines.

**A worked example, made up.** The engineers at a made-up site connect from `10.9.1.x`:

```
TIMESTAMP          ACCOUNT    SOURCE_IP    STATUS   ACCESS
2026-05-04 09:12   r.osei     10.9.1.15    CLOSED   ENGINEER
2026-05-04 13:40   l.grant    10.9.1.22    CLOSED   ENGINEER
2026-05-05 10:05   r.osei     10.9.1.15    CLOSED   ENGINEER
2026-05-06 02:58   p.vance    10.6.3.40    ACTIVE   CONTRACTOR
```

The HR record says p.vance's contract ended in October 2025. Who: an account that should not exist. When: just before three in the morning. Where from: `10.6.3.40` is a private address, so the session starts inside the organisation, but it is not in the engineers' `10.9.1.x` subnet. Three reasons, any one of which would be worth a question. Together, and still ACTIVE, they are an incident.

| Address | Private or public? |
| --- | --- |
| `10.6.3.40` | Private (`10.x.x.x`) |
| `172.20.3.4` | Private (172.16 to 172.31) |
| `172.32.0.1` | Public: 172.32 is outside the private range |
| `192.168.0.5` | Private (`192.168.x.x`) |

> Question: What is the difference between a domain account and a local account on a server? Why does a leaver process need to know about both?

At Albion the log is on **HMI-ENG-02 Engineering Workstation** in the engineering workshop. Its **[LOOK UP IP]** and **[INVESTIGATE ACCOUNT]** buttons answer "where from" and "who" for any row. To learn more in the game, ask Marcus **[What am I looking for on the jump server?]**.

### Checking Setpoints Against a Certified Baseline {#concept-setpoints}

A **setpoint** is a value a safety system acts on: trip at this temperature, alarm at this gas level. When a safety system is certified, its setpoints are written into its **safety requirements specification** (SRS). That document is the **certified baseline**. Under IEC 61511, any change to a setpoint goes through modification management: an impact analysis, re-verification and sign-off before it goes back into service.

Checking for tampering is a row-by-row comparison of what the controller holds now against the baseline. Any difference without a matching change request is a deviation. Then ask what the new value does: does it still act before the hazard, or after it?

**A worked example, made up.** A refrigeration plant's safety system protects a vessel whose relief valve lifts at 25 bar:

```
PARAMETER            CERTIFIED   LIVE     DIFFERENCE
HIGH_PRESSURE_TRIP   18 bar      26 bar   +8 bar
LOW_LEVEL_TRIP       15 %        15 %     none
AMMONIA_ALARM        25 ppm      25 ppm   none

Certified margin to the relief valve: 25 - 18 = 7 bar before it lifts
Live margin:                          25 - 26 = -1 bar: the trip comes after the valve has lifted
```

One row changed, and the change moved the trip past the point where it could help. The other rows match, which makes the one change look deliberate rather than a slip.

Know where your record of a change comes from. A well-run safety controller keeps a change log, and has a key switch that someone must turn on site before anything can change. Albion's kept no change log at all, and its engineering protocol asked for no password. Anything you learn about when a change happened comes from somewhere else, such as the workstation that made it.

> Question: If the controller keeps no log, and the workstation's own history had been wiped too, how could you find out when a setpoint was changed?

At Albion the live values are on the **SIS Configuration Panel** in the engineering workshop, and the certified values are in the **SIS Safety Requirements Specification (extract)** in the **Filing Cabinet: ICS Documentation**. To learn more in the game, once you have reported the change, ask Helen **[The SIS trip's at eighty-five. What does that mean?]**, then **[How did they get in to change it?]** and **[How do we know it was three twenty-two?]**.

### Hydrogen: Per Cent by Volume and Per Cent LEL {#concept-lel}

When lithium-ion cells overheat they vent gas, including hydrogen. Gas detectors report the gas in two ways:

- **per cent by volume** (% vol): how much of the air is hydrogen
- **per cent of the lower explosive limit** (% LEL): how far the gas is towards the level at which it can burn

The **lower explosive limit** of hydrogen is 4.0% by volume. Below it, the mixture is too lean to burn. To convert:

```
% LEL = (% by volume / LEL) x 100

1.0% by volume:  1.0 / 4.0 = 0.25   x 100 = 25% LEL
and back again:  25% LEL = 0.25 x 4.0 = 1.0% by volume
```

| Hydrogen, % by volume | % LEL | What it means at Albion |
| --- | --- | --- |
| 0.4 | 10 | Not normal: a healthy hall reads close to zero, so cells are venting |
| 1.0 | 25 | The certified alarm: alarm and ventilate; everyone stays out of the hall |
| 2.0 | 50 | Evacuate the hall and shut it down |
| 3.8 | 95 | Where the attacker moved the alarm |
| 4.0 | 100 | The gas can burn |

Alarms are set well below 100% LEL because gas is not evenly mixed: a detector reading 25% LEL may sit next to a pocket that is much richer. That gap is the time people have to get out.

> Question: Methane's LEL is 5.0% by volume. A detector reads 1.5% methane by volume. What is that as a percentage of the LEL, and would an alarm set at 25% LEL have sounded?

At Albion the **H₂ Gas Detector Panel** in Battery Hall 1 shows both units, and the **Incident Response Folder** lists the site's levels. To learn more in the game, ask Helen **[The hydrogen alarm. How bad is it?]** if the alarm sounds.

### Evidence or Safety First: Volatile Registers {#concept-evidence}

Digital evidence does not all last equally long. The usual **order of volatility** (from RFC 3227, the guidelines for evidence collection) runs from what disappears first to what lasts longest: CPU registers and cache, memory, network state, running processes, disk, logs held elsewhere, and archives. You collect the most volatile first, if you can.

In a plant, a controller's registers sit at the top of that list. They hold the values the controller is working with right now, and they are overwritten in normal operation. A safety action can overwrite them deliberately: when a shutdown makes a controller run its own shutdown routine, that routine writes safe values over the registers. A historian elsewhere keeps what the screens showed, which is not the same as what was written into the controller.

So a shutdown can destroy evidence, and saving the evidence first can delay the shutdown. How much it delays it is a number you can estimate.

**A worked example, made up.** Cells are heating at 0.5°C a minute.

```
Export the registers, 10 seconds:   0.5 x 10/60  = about 0.08 C hotter at the shutdown
Wait for the full logs, 10 minutes: 0.5 x 10     = 5 C hotter at the shutdown
```

The first is a rounding error. The second may be the difference between a hall that cools down and one that does not. The judgement depends on how close you are to the hazard, how sure you are of the timings, and who is allowed to make the call. That judgement is yours in the game, and question Q8 comes back to it.

> Question: Name three other things on a control network that a shutdown, a reboot or pulling a cable would lose.

At Albion the export is the **Export PLC-BMS Register Table** file on HMI-OPS-01, next to the live status. It is there whether or not anyone mentions it. Marcus raises it if you tell him you are about to shut down Hall 1.

### How Far to Cut: Isolation Scope {#concept-isolation}

**Isolation** cuts the attacker's paths into the control network. It stops them doing anything new. It does not undo what they have already done, and it cuts things the site still uses. Before you isolate, you need to know which paths there are, and what each cut costs.

At Albion the attacker had two ways in, and each option closes a different set:

| Option | What it closes | What it costs |
| --- | --- | --- |
| Pull the jump server's cable (JS-SCADA-LAN) | The RDP session through the jump server | Nothing else; it does not touch the historian |
| CastleTech block enterprise traffic to SCADA at the firewall | Traffic from the office network into SCADA, and the jump server's enterprise side | Needs Marcus's sign-off, confirmed by phone |
| Cut the historian's enterprise leg as well | The historian's Modbus proxy | The dispatch feed and NESO reporting, for a day; operations go to phone dispatch |
| Leave the historian connected and watch it | Nothing more | If the historian is their second way in, you see it late |
| Shut SCADA down | Everything | Hall 2 runs on its local battery controller, with someone walking it every hour with a gas monitor |

There is no option that costs nothing. A good OT incident response plan chooses between them before the night, with criteria and a compensating control for each. On the night you may be choosing without one.

There is a second lesson in how the firewall change is made. A managed service provider should not change a client's boundary because a voice on the phone says so. It rings an **authorised** person back on a number it already holds. That **out-of-band check** is what stops an attacker talking a supplier into opening a firewall.

**A worked example, made up.** A water works has two paths from the office network into its control network: a remote support VPN and a reporting server with a leg in each network. Cutting the VPN closes one path and costs the supplier's remote support. Cutting the reporting server's office leg closes the other and costs the daily compliance report. Cutting both closes both and costs both. Shutting the control network down closes everything and puts staff on manual checks. Writing that out as a small table before an incident takes ten minutes. Working it out during one takes much longer.

> Question: Which of Albion's options would you want decided in a plan before the night? Who should own that decision?

To learn more in the game, ask Marcus **[How far do we cut them off?]**. It appears once you have told him about the session. Tom's **[What exactly do you monitor for us?]** explains what CastleTech can see. CLAIM-EN-010 in the information pack is the safety claim about isolation.

### Who Must Be Told, and When {#concept-reporting}

Albion is a designated **operator of essential services** (OES) under the **NIS Regulations 2018**. An OES must notify its **competent authority** of any incident that has a significant impact on the continuity of its essential service, **without undue delay**, and in any event **no later than 72 hours after becoming aware** of it.

- For GB electricity the competent authority is **DESNZ** (the Department for Energy Security and Net Zero) and **Ofgem**, acting jointly. In practice **Ofgem** handles the notifications.
- The **NCSC** is the UK's computer security incident response team (CSIRT) under the Regulations. It is told alongside. It helps; it does not regulate, investigate for the regulator or fine.
- An **initial notification** with what you know, unknowns marked as unknown, meets the duty. Updates follow. A complete report is not required within the 72 hours.

"Without undue delay" comes first. The 72 hours is the outer limit, and it runs from when the operator became aware, not from when it is sure.

**A worked example, made up.** An operator becomes aware of an incident at 14:20 on Friday 6 November 2026. The 72-hour limit is 14:20 on Monday 9 November 2026. The weekend counts. If it knows enough to send an initial notification by Friday evening, waiting until Monday is not "without undue delay", even though Monday is inside 72 hours.

Others need telling for other reasons, and none of them replaces the NIS notification:

| Who | Why | When |
| --- | --- | --- |
| Fire and rescue service | A battery hall off-gassing can catch fire | 999 as soon as a hall is off-gassing |
| HSE | Albion's health and safety regulator | After any dangerous occurrence |
| NESO | It buys Albion's grid services, and the overcharge disturbed the local frequency | For anything that affected the grid connection |
| A neighbour sharing your systems | Duty of care, not a NIS duty | As soon as you know they may be affected |

> Question: If the 72 hours ends on a bank holiday, does the limit move?

At Albion the **Incident Response Folder** on the duty desk sets this out, and the **NIS Notification Form** on the clipboard by the workshop door shows what a notification asks for. In the game the countdown is game time: 45 minutes of play stand in for the 72 hours. To learn more in the game, ask Marcus **[About the NIS notification.]**.

### Safety Cases: Claim, Argument, Evidence {#concept-safety-case}

A **safety case** is a structured argument that a system is acceptably safe in a given setting. Each part has three pieces:

- the **claim**: what we say is true
- the **argument**: why we believe it
- the **evidence**: what shows the argument holds, and when it was last checked

Many claims hold only *provided that* something else is true. If that condition stops being true, the claim fails, whatever the evidence once said. Anything that would make a claim false is a **defeater**. Security-informed safety asks one extra question of every claim: what if someone is trying to defeat it? A safety argument written for accidents assumes faults are random. An attacker looks for the condition nobody checks.

| Verdict | What it means | The lesson |
| --- | --- | --- |
| It holds | The conditions are true now, and the evidence is current | Keep checking it |
| It held until something changed | It was true, then the system or the threat changed | Review claims when things change |
| It never held | Its conditions were false before anyone tested them | The case was signed off for a system that did not exist |

**A worked example, made up.** *Claim: the lift's overspeed brake stops the car even if the lift controller is hacked. Argument: the brake is a mechanical governor with no connection to the controller. Evidence: the annual drop test, last done in 2024.* In 2025 a retrofit added an electronic release to the governor, wired to the controller, so engineers could reset it remotely.

<details markdown="1">
<summary>Check your answer: which part failed?</summary>

The argument. "No connection to the controller" stopped being true when the release was wired in. The evidence is from 2024, before the change, so it says nothing about the system as it is now. The claim held until 2025, and has not held since.

</details>

Albion's safety case has a claim like this about its SIS, CLAIM-EN-002: the safety system trips, whatever happens to SCADA. Its argument is that the SIS sits on its own network. The evidence it calls for includes a test showing that the SIS engineering port cannot be reached from the SCADA network.

> Note: Priya S. asks you in the debrief whether CLAIM-EN-002 held, and question Q14 comes back to it. Work it out with the three parts above and what you find in the workshop.

To learn more, read the "Security-Informed Safety Claims" section of the [Information Pack](/HacktivityLabSheets/labs/security_informed_safety/sis02-energy-information-pack/), which has all twelve claims and the case's Goal Structuring Notation (GSN) diagram.

## Stuck? Hints, Stage by Stage {#hints}

Find the stage you are on. Read the hint, then go back and try. If you are still stuck, open **Nudge**. Open **Steps** or **Recipe** last. Stages are in the usual order of play, but you can do several of them in a different order: the game follows what you have found, not a fixed script.

> Tip: Before you open any hint, ask yourself three questions. Who in the game is responsible for this, and have you asked them? Is there a document or a panel nearby that explains it? And does the objectives list name the room you should be in?

### Before the Hall: The Control Room {#hints-start}

**Where:** the SCADA control room, where you start. **To finish "Understand the Facility State":** get Helen's briefing, review the readings on HMI-OPS-01, and read the Incident Response Folder.

> Hint: The briefing has finished and Helen is back at her desk. What did she ask you to do, and what does the objectives list want before you go?

<details markdown="1">
<summary>Nudge</summary>

Helen asked you to read one instrument in Battery Hall 1 and come straight back. Before you go, the objectives list wants you to have seen what the screens say, so you have something to compare the hall against, and to have read the site's own rules. The **HMI-OPS-01 Workstation** is the operator screen. The **Incident Response Folder** is on the duty desk, and its rules on the emergency shutdown and on hydrogen matter later.

If the opening scene was cut short and you have no badge, talk to Helen: she hands it over.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Click **HMI-OPS-01 Workstation** and open **SCADA Live Status**==. Note the temperatures and the state of charge.
2. \==action: Read the **Incident Response Folder** on the duty desk==.
3. \==action: Check that the **Battery Hall Access Badge** is in your inventory==. If not, talk to Helen.
4. Optional: \==action: look at the **Network Architecture Diagram** and the **Facility Alarm Panel**==, both on the control room walls.

</details>

### Battery Hall 1: The Dial at Rack A2 {#hints-dial}

**Where:** Battery Hall 1, through the north door of the control room. **Lock:** an RFID reader on the door. **Lock wants:** Helen's Battery Hall Access Badge. **Clue:** the **Local Dial Gauge: Rack A2**, at the end of the first rack row.

> Hint: Helen asked for one reading from one instrument. Which thing in this hall is on no network?

<details markdown="1">
<summary>Nudge</summary>

The **Battery Rack Status Panels (Digital)** on the racks show the same numbers as HMI-OPS-01: they read the same battery controller. They cannot tell you whether the screen is lying. Helen wants the old mechanical dial at Rack A2. Its reading appears when you click it. See "Trusting a Screen: Independent Measurements" in Concepts.

The **H₂ Gas Detector Panel** on the back wall is worth reading while you are here.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Walk to the north door of the control room== with the badge in your inventory. It opens.
2. \==action: Click the **Local Dial Gauge: Rack A2**== and read it.
3. \==action: Go back to the control room==. Helen radios you about what you found.

</details>

> Warning: If the hydrogen alarm has sounded, do not go into the hall, for the dial or for anything else. Nobody needs the dial any more: the game skips the walkdown and opens the next stages for you.

### Helen's Question: The Dial or the Screen {#hints-gauge}

**Where:** Helen Marsh, in the control room. **Decision:** which reading you believe: the dial or the screen.

Helen puts this question once the dial has been read, and before the hydrogen alarm. If the ESD is already in by then, she asks which one you went on rather than which one you would bet on. If the ESD went in before anyone read the dial, she skips it.

> Hint: Each reading could be wrong. What could make the dial wrong, and what could make the screen wrong?

<details markdown="1">
<summary>Nudge</summary>

Think about what each reading depends on. The screen shows the battery controller's registers. The dial shows the rack's temperature through a mechanism on no network. Which of them could an attacker reach, and which could fail on its own? You can also say you want more evidence first; Helen tells you what she thinks of each answer. See "Trusting a Screen: Independent Measurements" in Concepts.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Talk to Helen== and choose **[That dial in the hall. Which do we believe?]**.
2. \==action: Choose the answer you can defend==: **[The dial. Nothing on a network can reach it.]**, **[The screen. That dial's older than the building.]** or **[Neither yet. I want the historian first.]** (after the ESD this reads **[Neither. The ESD was a precaution. Now I want the historian.]**). Before the ESD, **[Let me think about it.]** leaves the question open.

</details>

### The Historian Trend {#hints-historian}

**Where:** the **Historian Trend Viewer**, on HMI-OPS-01 in the control room. **To finish "Check the Historian":** mark the moment the data stops behaving like a real sensor.

> Hint: Real sensors wobble. Somewhere on this trend, they stop.

<details markdown="1">
<summary>Nudge</summary>

The viewer opens on the last 12 hours for Racks A1 to A4. Follow the lines from left to right. Look for a step to a new value, followed by a line that never moves again. Then point at a reading on that flat part: hover over it for three seconds, or click it. If you click a reading that is still moving, the viewer says "Still moving like a real sensor reading. Keep looking."

The **dZ/dt** button overlays the rate of change, which is exactly zero where the data is being written. **COMPARE RACKS** puts all four racks side by side. **COMPARE RACKS** also finds the moment for you and unlocks **[ANNOTATE FINDING]**. The dZ/dt overlay only shows you where the rate drops to zero, so you still point at a flat reading yourself. See "A Flat Line: Data That Is Written, Not Measured" in Concepts.

**Learn it:** ==action: Hover over five readings in a row, before the flat part, and write them down==. Subtract each from the next. Then do the same for five readings on the flat part, and compare.

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Click **HMI-OPS-01 Workstation** and open **Historian Trend Viewer**==.
2. \==action: Find where the lines step and go flat, and click a reading on the flat part== (or hover for three seconds, or press **COMPARE RACKS**).
3. The hint above the chart changes to "Finding ready: press [ANNOTATE FINDING] on the left." \==action: Press **[ANNOTATE FINDING ►]**==.
4. \==action: Read the **HISTORIAN ANOMALY REPORT**, then press the **[CONFIRM: MARK AS INJECTION EVENT AT ...]** button==.

</details>

When you confirm, Helen radios you, the BATTERY HALL 1 lamp on the alarm panel turns amber, the NIS notification clock starts, and the "Call Marcus Webb and Investigate" aim opens.

### Shutting Down Hall 1: The Emergency Shutdown {#hints-esd}

**Where:** three ESD stations, all wired to the same relays: **ESD Station: Battery Hall 1 (Hall Door)** on the control room wall by the hall door, **ESD Station: Control Room Console** on Helen's console, and **ESD Station: Inside Battery Hall 1** on the hall's west wall. **Decision:** when to press one, and whether to save the battery controller's registers first.

This is a decision, not a puzzle. Every station works from the start of the game. Nobody has to give you permission.

> Hint: The Incident Response Folder says who may press an ESD station, and on what. What do you know about the hall right now, and what would each kind of mistake cost?

<details markdown="1">
<summary>Nudge: when to press it</summary>

You can talk the decision through before you act. Once the dial has been read, ask Helen **[Should we shut Hall 1 down now?]** and she tells you what the site stands to lose either way. Her **[Tell me about the emergency shutdown.]** leads to **[What does pressing it cost us?]** and **[Can it be undone?]**. Marcus, on the phone, takes the other side: choose **[I think Hall 1 should come off now.]** and he says he would want the jump server logs first. You can agree with him or argue back.

Neither of them decides for you. See "Layers of Protection" in Concepts, and Priya's question in the debrief: "When one mistake costs money and the other costs the building, how sure do you need to be?"

</details>

<details markdown="1">
<summary>Nudge: the evidence the shutdown destroys</summary>

Pressing an ESD makes the battery controller run its shutdown routine, which overwrites the values the attacker wrote into its registers. The historian keeps what the screens showed, but not what was in the controller. The **Export PLC-BMS Register Table** file on HMI-OPS-01 saves a copy, but only if you read it before the ESD goes in. Afterwards it shows the reset values.

If you tell Marcus you are about to shut down, he raises this himself and asks what you want to do: **[I'll save the registers, then press it.]** or **[No. We press it now.]**. See "Evidence or Safety First" in Concepts.

</details>

<details markdown="1">
<summary>Steps: pressing a station</summary>

1. Optional, and only before you press: \==action: click **HMI-OPS-01 Workstation** and open **Export PLC-BMS Register Table**==.
2. \==action: Click one of the ESD stations==. The panel says "Flip guard to arm ESD control."
3. \==action: Click the guard==. The panel says "Guard open. Press button to continue."
4. \==action: Press the red button==, read **CONFIRM EMERGENCY SHUTDOWN?**, and press **CONFIRM - INITIATE SHUTDOWN**.
5. The panel shows "ISOLATED - COOLING ACTIVE", and the RACKS ISOLATED lamp on the alarm panel reads ESD ACTIVATED.

</details>

<details markdown="1">
<summary>Spoiler: what happens if nobody presses it</summary>

The cells keep venting. About 25 minutes of play after Helen's briefing, the hydrogen in Hall 1 reaches 1.0% by volume. Helen radios: "Hydrogen alarm in Hall 1. One per cent and rising. Stay out of the hall and use the station by the door. I'm ringing the fire service." You can still press a station outside the hall, and the hall still survives.

About 43 minutes after the briefing, if nobody has pressed one, the hydrogen reaches 2.0% by volume. Helen evacuates everyone, presses the console station on the way out, and Hall 1 is lost to fire. Everyone gets out and is counted. That follows the site's own rule for that gas level (Incident Response Folder), and the game is not over: Priya S. arrives, and you can still isolate the attacker, send the notification and go through the debrief.

</details>

> Warning: In a gas alarm, use the station by the hall door or the one on the console. If you walk into the hall, Helen calls "Out of that hall. Now. Use the station by the door." The station inside is labelled for use outside a gas alarm.

### Messaging Marcus and Getting into the Workshop {#hints-workshop}

**Where:** the **Albion Site Phone** in your inventory, and the **Duty Officer Desk** in the control room. **Lock:** the RFID reader on the engineering workshop's door, east of the control room. **Lock wants:** the **Engineering Workshop RFID Key**.

> Hint: Marcus wants something he can look at. And the night shift's handover sheet says where the workshop key is.

<details markdown="1">
<summary>Nudge</summary>

Marcus's first message asks "What have you got?" The options you see depend on what you have found: the dial, the historian, the ESD, the gas alarm or, if you have nothing yet, **[Nothing solid yet. Helen doesn't like the look of the screens.]**. You can message him at any point. Whatever you tell him, he points you to the workshop and the jump server log.

Jay Patel's handover sheet is on top of the **Duty Officer Desk**. It says where the key is.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Click the **Albion Site Phone**, choose **Marcus Webb**, and pick an option==.
2. \==action: Click the **Duty Officer Desk** and take the **Engineering Workshop RFID Key**==.
3. \==action: Walk through the east door of the control room== with the key in your inventory.

</details>

### The Jump Server Log on HMI-ENG-02 {#hints-jump-log}

**Where:** the **HMI-ENG-02 Engineering Workstation**, in the engineering workshop. **To finish:** flag the session that should not be there, and read the workstation's engineering tool history.

> Hint: Most of this log is engineers doing their jobs. One session fails all three questions: who, when and where from.

<details markdown="1">
<summary>Nudge</summary>

The log covers about ten days. Most sessions are short, in working hours, from the same few machines. Look for the one that does not fit. **[+ ADD FILTER]** narrows the list: try STATUS, TIME or SOURCE_IP. Click a row to see its **SESSION DETAIL**, then use **[LOOK UP IP]** and **[INVESTIGATE ACCOUNT]** to check where it came from and whose account it is. If you flag the wrong row, the terminal says "NOT THIS ONE" and nothing is escalated. See "Reading a Jump Server Log" in Concepts.

Flagging the session is half of it. The workstation also has an **ENG TOOL HISTORY** tab: its own record of what its safety system tool did. The investigation completes when you have flagged the session and opened that tab, in either order.

**Learn it:** ==action: Before you filter anything, run down the SOURCE_IP column and write down each different subnet you see==. Which one appears only once?

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Click **HMI-ENG-02 Engineering Workstation**==. It opens on the **SESSION LOG**.
2. \==action: Add a filter, or scan the list, and click the row that fails the three questions==.
3. \==action: Press **[LOOK UP IP]** and **[INVESTIGATE ACCOUNT]**== and read both.
4. \==action: Press **[FLAG SESSION]**, read **CONFIRM SESSION FLAG**, and press **[CONFIRM: FLAG ACTIVE SESSION]**==.
5. The terminal says "Session flagged. Open the ENG TOOL HISTORY tab to see what that session did to the safety system." \==action: Press **[VIEW ENG TOOL HISTORY →]**== (or the **ENG TOOL HISTORY** tab) and read it.
6. The log shows "✓ INVESTIGATION COMPLETE: Session flagged. Engineering tool history reviewed."

</details>

When it completes, Helen radios you and points you at the SIS panel, the "Investigate the SIS" and "Isolate the Attacker" aims open, and Tom at CastleTech sends you a message about the shared file server.

> Tip: In a 60-minute class, this is a good place to stop if the ESD is already in. Hall 1 is safe, and everything after this point can wait for next time.

### The SIS Panel and the Certified Setpoints {#hints-sis}

**Where:** the **SIS Configuration Panel** and the **Filing Cabinet: ICS Documentation**, both in the engineering workshop. **Lock:** the cabinet is locked. **Lock wants:** the **Filing Cabinet Key**. **To finish "Investigate the SIS":** read the panel, find the certified setpoints, and report the changes.

> Hint: The panel shows what the safety controller holds now. What would you compare it with, and where would a site keep that?

<details markdown="1">
<summary>Nudge</summary>

The cabinet's own description says where its key is: on a keyring labelled ICS Docs, on the desk by the electronics benches. Inside is the **SIS Safety Requirements Specification (extract)**, the certified baseline. Once you have read it, the panel's **Compare with Certification Document** button puts the two side by side. Until then the button is greyed out and the panel says "Retrieve the SIS certification document to unlock side-by-side comparison." Close the panel and open it again after reading the document. The amber rows open to show more detail. See "Checking Setpoints Against a Certified Baseline" in Concepts.

**Learn it:** ==action: Before you press the compare button, write down each parameter's live value and certified value, and the difference==. Then ask of each changed row: does it still act before the hazard?

</details>

<details markdown="1">
<summary>Recipe</summary>

1. \==action: Pick up the **Filing Cabinet Key** from the desk==.
2. \==action: Open the **Filing Cabinet: ICS Documentation** and read the **SIS Safety Requirements Specification (extract)**==. The **Deferred Patch Risk Assessment** is in there too, and worth reading.
3. \==action: Click the **SIS Configuration Panel**==, and click each amber row to read its detail.
4. \==action: Press **Compare with Certification Document**== and compare the two columns.
5. \==action: Press **Confirm SIS Tamper - Report to Security**==, then **Confirm**.

</details>

When you report it, the SIS STATUS lamp on the alarm panel turns red, and Helen and Marcus each have something new to say about the SIS and the patch.

### Isolating the Attacker {#hints-isolate}

**Where:** the **Jump Server Ethernet Cable** in the engineering workshop, and Marcus and Tom on the phone. **To finish "Isolate the Attacker":** pull the jump server's cable, and get CastleTech to shut the enterprise side off from SCADA. **Decision:** how far to cut.

> Hint: There are two halves to this: a cable you can pull yourself, and a firewall that only CastleTech can change. Who is allowed to tell CastleTech to change it?

<details markdown="1">
<summary>Nudge: the cable and the scope</summary>

The **Jump Server Rack (JS-ALBION-01)** says where its cable to the SCADA switch is: the right-hand panel, labelled JS-SCADA-LAN. Pulling it cuts the remote session. It does not touch the historian.

Tell Marcus what you found on HMI-ENG-02 (**[ENG-02 shows c.ellison on the jump server since 01:47.]**). He gives his view on the cable and on CastleTech, and he signs off the firewall change. After that, **[How far do we cut them off?]** asks you to choose a scope: cut the historian's enterprise leg too, leave it connected and watch it, or shut SCADA down. Each option costs something different, and Marcus tells you what before you choose. See "How Far to Cut: Isolation Scope" in Concepts. The NETWORK STATUS lamp on the alarm panel follows what you choose.

</details>

<details markdown="1">
<summary>Nudge: "Tom won't do it"</summary>

Tom will only change Albion's boundary on the word of someone on the authorised list, and he rings them back on a number CastleTech already holds. Your own say-so is not enough, and saying Marcus has agreed when he has not does not work either: Tom rings him and finds out.

Get Marcus's sign-off first. Telling him about the session gives it. If you asked Tom first, Marcus has a new option, **[Tom at CastleTech needs your sign-off to isolate.]**. He will not sign it with no evidence at all ("Isolate on what?"): he signs once you have read the dial, checked the historian or found the session in the jump server log. If the gas alarm has sounded, nobody goes back for the dial, so it is the historian or the jump server log. Then go back to Tom and choose **[About the isolation.]**.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Click the **Jump Server Ethernet Cable**== and confirm **Disconnect cable JS-SCADA-LAN?** when you are ready.
2. \==action: Message Marcus== and tell him what HMI-ENG-02 showed. Then choose **[How far do we cut them off?]** and pick a scope.
3. \==action: Message Tom Hadley== and choose **[I need the enterprise side shut off from SCADA.]** (or **[About the isolation.]** if you have asked before).
4. \==action: Choose **[Marcus has signed it off. Ring him.]**== once he has. Tom rings Marcus, then blocks the enterprise side at the firewall.

</details>

When CastleTech have acted, the NETWORK STATUS lamp turns red. If the ESD is also in, Helen radios that the hall is safe and the attacker is out, the SAFE STATE lamp turns green, and Priya S. arrives.

### The NIS Notification {#hints-nis}

**Where:** the **NIS Notification Form** on the clipboard by the workshop door, in the control room, and Marcus on the phone. **To finish "Send the NIS Notification":** read the form, then message Marcus, who signs it off and sends it. **Decision:** send now with what you know, or wait.

> Hint: Who signs it off, and what does he want you to have done first?

<details markdown="1">
<summary>Nudge</summary>

Marcus's option **[About the NIS notification.]** appears once the team knows there is an incident: after the historian, the jump server session, the SIS change, CastleTech's isolation or an evacuation. If you have not read the form, he explains who it goes to and asks you to read it first. Then he asks whether to send what you have now or wait for the full picture. You decide; he tells you what he thinks of each. See "Who Must Be Told, and When" in Concepts.

The countdown on screen is the NIS clock. If it runs out, nothing locks: Helen tells you, and you can still send it.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Read the **NIS Notification Form**==.
2. \==action: Message Marcus and choose **[About the NIS notification.]**==.
3. \==action: Choose **[Send it now with what we've got. We'll update it as we go.]** or **[Hold it till we know how far they got. Wrong reports are hard to undo.]**==. If you hold it, he asks once more: **[Fine. Send what we know.]** or **[No. We wait.]**.

</details>

### Optional: Warning Trent Water {#hints-trent}

**Where:** Tom Hadley, on the phone, and the **Shared File Server Access Extract (Albion / Trent Water)** on the engineering desk. **Decision:** whether CastleTech should warn Trent Water Services, and when.

Tom messages you once the jump server session has been found. This task is optional, and the credits record what you chose.

> Hint: Trent Water is a separate company that shares one of Albion's servers. Who has to agree before CastleTech can tell them about Albion's incident?

<details markdown="1">
<summary>Nudge</summary>

Tom works for both companies, so he needs Albion's consent to tell Trent Water. Choose **[Your message about the shared server and Trent Water.]** to hear what he has seen. He offers to tell them now, and you can also say you want to see the evidence first: the extract on the workshop desk is that evidence. **[svc.deploy? Isn't that your account?]** asks him about the account that wrote the file. See the table in "Who Must Be Told, and When" in Concepts.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Message Tom and choose **[Your message about the shared server and Trent Water.]**==.
2. \==action: Choose **[Yes. Tell them now, and say what we don't know yet.]** or **[Not yet. I want to see the evidence first.]**==.
3. If you waited: \==action: read the extract, then message Tom and choose **[About Trent Water: send that advisory now.]**== when you are ready.

</details>

### The Finale: Priya S. and the Debrief {#hints-finale}

**Where:** the control room. Priya S. from the NCSC arrives once Hall 1 is shut down and CastleTech have cut the attacker off. She says: "Priya, from the NCSC. I was the nearest when this came in. Finish what you're doing, then come and find me."

> Hint: The debrief ends the game. Is there anything on your objectives list, or any message, that you want to deal with first?

<details markdown="1">
<summary>Nudge</summary>

When you talk to Priya S., she offers **[I'm ready.]** or **[Give me a few minutes.]**. Use the second if you still have things to do, such as the notification, Trent Water or the SIS panel. None of them is required to finish, but the debrief and the credits record whether you did them.

In the debrief she gives her view of what you did and asks you some questions: how sure you need to be before a shutdown, whether CLAIM-EN-002 held, whether to patch the SIS, and, if Tom raised it with you, whether Trent Water needed telling under NIS. Answer from what you saw and did. There is no hidden right answer to find: the questions come back in **After the Game: Reflection and Exercises**.

The closing credits list what you decided at each point. ==action: Note them down before they finish==: you will need them for the exercises.

</details>

<details markdown="1">
<summary>Steps</summary>

1. \==action: Finish anything on the objectives list you still want to do==. None of it is required.
2. \==action: Talk to Priya S. and choose **[I'm ready.]**==, or **[Give me a few minutes.]** if you are not.
3. \==action: Answer her questions from what you saw and did, then choose **[Nothing else from us.]**==.

</details>

## What the Tools and Locks Are Telling You {#error-messages}

| You see | It usually means |
| --- | --- |
| The Battery Hall 1 door will not open | You need Helen's **Battery Hall Access Badge** in your inventory. Talk to her if you do not have it |
| The engineering workshop door will not open | You need the **Engineering Workshop RFID Key** from the **Duty Officer Desk** |
| The filing cabinet is locked | The **Filing Cabinet Key** is on the workshop desk, on a keyring labelled ICS Docs |
| "Flip guard to arm ESD control." | Click the guard over the button first, then press the button |
| "Emergency shutdown already active. Racks A1 to A4 are isolated." | Someone has already pressed a station: you, or Helen during an evacuation. All three stations work the same relays |
| "Still moving like a real sensor reading. Keep looking." | The historian reading you clicked is real. Look further along, where the lines go flat |
| "Inspect the chart to find something to annotate." and **[ANNOTATE FINDING]** greyed out | You have not yet pointed at a flat reading for three seconds, or clicked one |
| "NOT THIS ONE" on HMI-ENG-02 | The row you flagged is a normal session. Use **[LOOK UP IP]** and **[INVESTIGATE ACCOUNT]** |
| "Session flagged. Open the ENG TOOL HISTORY tab to see what that session did to the safety system." | Half done. Open the **ENG TOOL HISTORY** tab |
| "Retrieve the SIS certification document to unlock side-by-side comparison." | Read the **SIS Safety Requirements Specification (extract)** from the filing cabinet, then reopen the panel |
| The register export says "Controller state: SHUTDOWN (ESD trip)." | The ESD went in before anyone read the export, and the shutdown routine has overwritten the registers. The historian still has what the screens showed |
| Marcus: "Isolate on what? I'm not cutting the enterprise side off on a hunch." | You have no evidence yet. He tells you what he needs before he will sign |
| Tom: "Not for a firewall change, sorry. That's exactly how people get talked into opening one. Get Marcus to message me." | Your own say-so is not enough. Tom needs someone on Albion's authorised list |
| Tom: "Rang Marcus. He hasn't heard about it, so I can't act yet. Get him to message me." | Marcus has not signed off yet. Message him, then go back to Tom |
| Marcus: "The form's on the clipboard by the workshop door. Read it, then message me." | Read the **NIS Notification Form** first |
| Marcus has no **[About the NIS notification.]** option | Nobody has found evidence of an incident yet: the historian, the session, the SIS change, CastleTech's isolation or an evacuation |
| "Isolate the Attacker" is not on the objectives list | It opens once you have found the session on the jump server |
| Helen: "Out of that hall. Now. Use the station by the door." | You walked into Hall 1 during the gas alarm |
| Helen: "That's our notification clock run out. Ofgem should have heard from us by now. Get it to Marcus." | The NIS clock ran out. You can still send the notification |
| Marcus: "Who pulled the jump server cable? It needed doing. Tell me next time." | The cable came out before Marcus had agreed to it |
| Priya S. has not arrived | She comes once the ESD is in **and** CastleTech have isolated the enterprise side |

The **Facility Alarm Panel** in the control room shows where things stand. A lamp changes only when the team has found or done something, so a green lamp means "nothing reported yet", not "checked and fine".

| Lamp | What it shows, and when |
| --- | --- |
| BATTERY HALL 1 | NORMAL until you mark the flat line on the historian, then ANOMALY DETECTED |
| RACKS ISOLATED | ESD ACTIVATED once any ESD station has been pressed |
| SIS STATUS | WITHIN SETPOINTS until you report the SIS change, then SETPOINT DEVIATION |
| JUMP SERVER | CONNECTED until the cable is pulled, then ISOLATED |
| NETWORK STATUS | NORMAL; ENTERPRISE CUT OFF once CastleTech have isolated the enterprise side; HISTORIAN ALSO CUT if they did it with the historian's enterprise leg in scope; SCADA MANUAL MODE as soon as you choose to shut SCADA down |
| H₂ GAS | NORMAL below the alarm level; ADVISORY at 1.0% by volume; EVACUATE at 2.0% |
| SAFE STATE | SAFE STATE ACHIEVED once the ESD is in and CastleTech have isolated the enterprise side |

## Optional Side Content {#optional}

None of these are needed to finish. Each one gives you material for the exercises, and the closing credits list which of them you read under "EXTRA EVIDENCE YOU READ".

<details markdown="1">
<summary>The historian's rate-of-change overlay and rack comparison</summary>

In the **Historian Trend Viewer**, press **dZ/dt** to see the rate of change, and **COMPARE RACKS** to see all four racks together. Compare what the four racks did before and after the lines went flat. Useful for question Q6.

</details>

<details markdown="1">
<summary>The network architecture diagram</summary>

The **Network Architecture Diagram** on the control room wall draws Albion's network by Purdue level, with the weak points in amber and five attack paths. Click the boxes to read what each one is and what went wrong with it. You need this for exercise E8.

</details>

<details markdown="1">
<summary>Where the session came from, and whose account it was</summary>

On **HMI-ENG-02 Engineering Workstation**, the **[LOOK UP IP]** and **[INVESTIGATE ACCOUNT]** buttons on the suspicious session tell you what kind of machine it came from and what happened to the account when its owner left. Useful for questions Q1 and Q9.

</details>

<details markdown="1">
<summary>The boundary that was never fixed</summary>

The **IT/OT Boundary Rules Document** on the workshop noticeboard says what the jump server and the historian were supposed to allow, and what they actually allowed. Ask Marcus **[Has anyone ever written up that jump server?]** and then **[About that boundary again.]** for his side of the story, including his view on how the safety system should be networked. Useful for questions Q3 and Q18.

</details>

<details markdown="1">
<summary>The patch nobody applied</summary>

The **Deferred Patch Risk Assessment** in the filing cabinet is the 2024 decision to defer the SIS firmware fix. Once you have reported the SIS change, ask Helen **[Why wasn't the SIS patched?]** and Marcus **[Why was the SIS patch deferred?]**. They see it from different sides. Useful for questions Q2, Q5 and Q19.

</details>

<details markdown="1">
<summary>What CastleTech could see</summary>

Ask Tom **[What exactly do you monitor for us?]**, then **[Should the contract have covered OT?]** or **[What would OT monitoring have caught?]**. Useful for question Q4.

</details>

## After the Game: Reflection and Exercises {#reflection-and-exercises}

Work through these after you have finished the scenario. Use your own run: Priya S.'s debrief and the closing credits record what you decided at each point (the dial, the shutdown, the registers, how far to isolate, the notification, Trent Water, the safety claim and the patch), and your choices will differ from other players'.

> Tip: In a group of four to six, split the questions the way you split the roles in play: SCADA engineers (the dial, the historian, the ESD, the SIS panel), IT/OT security (the jump server, isolation, CastleTech) and one or two incident commanders (the shutdown call, the notification, Trent Water). Compare answers at the end, especially where the tracks disagree.

Each section opens with questions to discuss, then exercises that produce something you can hand in or present.

### 1. Risk Management {#1-risk-management}

Nothing that failed at Albion was new. In her closing, Priya names a commissioning link nobody closed, a dead account nobody removed and a patch nobody rescheduled.

**Questions**

> Question: Q1. Priya says each of those three was written down, accepted and never looked at again. Find where the game records each one: the IT/OT Boundary Rules Document on the workshop noticeboard, the jump server log on HMI-ENG-02, and the Deferred Patch Risk Assessment in the workshop filing cabinet. Who owned each risk, and what should have triggered a review? Is her summary fair to all three? The leaver process missed c.ellison's local account rather than accepting it. Is a risk nobody knew about better or worse than one that was accepted and forgotten?

> Question: Q2. The deferred patch risk assessment from September 2024 names one compensating control: the managed SOC watching for lateral movement. Tom and Marcus both tell you that CastleTech's contract excluded OT. Priya says the deferral fitted the board's risk appetite only on paper, and Marcus calls a risk accepted with a control that isn't there "risk pretence". What residual risk did Albion actually carry between September 2024 and March 2026, compared with what the board thought it carried? What should the March 2025 review have checked?

> Question: Q3. Marcus wrote up the jump server and the historian in two quarterly risk reports, and "both times the board noted it and moved on". Priya says a risk the board only notes hasn't been decided. What should a decision to accept a risk record? Who should have owned the boundary risk: Marcus, who wrote it up, or James Whitworth, the General Manager, who was accountable for the site's risk decisions?

> Question: Q4. Tom says "You can contract out the watching. You can't contract out knowing what we're not watching." Monitoring OT would have caught the 01:47 login, but it would also have put another company's people on Albion's SCADA network. Which risk had Albion transferred to CastleTech, which had it kept, and was the scope of the contract ever decided as a risk decision? The account that wrote the file to the shared server was CastleTech's own. What does that say about a managed service provider's access as a risk (IEC 62443-2-4)?

> Question: Q5. In the debrief Priya asks you, as Albion's risk owner today, whether to patch or to defer with controls that really work. Whichever you chose, what residual risk do you now own? Helen pictured eight weeks of rounds at three in the morning. Priya asked who would walk them and who checks they did, or, if you deferred, who checks in a year that the controls are still real. How would you show the board that your choice reduces the risk as low as reasonably practicable (ALARP)?

**Exercises**

> Action: **E1. Risk register entry.** Write the register entry Albion should have had for the IT/OT boundary: the jump server that allows RDP both ways and the dual-homed historian with its Modbus proxy. Include: the risk as cause, event and consequence; the risk owner; likelihood and impact on a 5×5 scale before and after controls; the existing controls, and whether each really existed; the treatment decision (avoid, reduce, transfer or accept) with a reason; and a review trigger. (SIS03 asks for the entry on the SIS patch deferral, so use the boundary here.)

> Action: **E2. Then and now.** Plot the three accepted risks from Q1 on a 5×5 likelihood × impact matrix twice: as they were probably scored when accepted, and as they turned out on Saturday morning. Explain in a paragraph what changed: the threat, the impact, or the assumptions behind the scores.

> Action: **E3. Bow-tie.** Draw a bow-tie for the top event "thermal runaway in Racks A1 to A4". Put threats on the left (including falsified readings that let an overcharge through, and the raised SIS setpoints) and consequences on the right (venting, hydrogen build-up, fire, loss of grid services, harm to people), with preventive and mitigating barriers between them: the BMS charge cut-off, the operator watching the HMI, the SIS trip, the hydrogen alarm, the analogue dial, the hardwired ESD and evacuation. Mark which barriers the attack defeated, which held in your run, and which depended on a person.

### 2. Incident Response {#2-incident-response}

**Questions**

> Question: Q6. Helen asked you which you believed: 51°C on the dial at Rack A2, or 28°C on her screen. If she never asked (the ESD went in first, or the gas alarm came before anyone read the dial), answer it now. Which would you have bet the hall on, and why? What did the historian's flat 28.0°C since 23:12 tell you that the dial alone could not? Why is an instrument on no network a different kind of evidence from a sensor reading on SCADA?

> Question: Q7. Helen weighed half the site off the grid and a penalty every hour against losing the hall. Marcus wanted the jump server logs before dropping half the site. Which argument did you make, and on what evidence? Priya asked: "When one mistake costs money and the other costs the building, how sure do you need to be?" Answer her in your own words. Albion lets anyone press an ESD station on a credible hazard without asking: what would go wrong if pressing it needed Marcus's authorisation?

> Question: Q8. Pressing the ESD makes the BMS run its shutdown routine, which overwrites what the attacker wrote. If you told Marcus you were about to shut Hall 1 down before the ESD went in, he asked for ten seconds to export the register table on HMI-OPS-01. The export was there whether or not he mentioned it, and if nobody read it in time, Priya told you what was lost. Did anyone save it? What does the historian still hold, and what is lost without the export? Where would you draw the line on delaying a safety action for evidence, and who should make that call on the night? (In SIS03, the missing register image is one of the gaps in the insurer's evidence.)

> Question: Q9. The jump server log on HMI-ENG-02 showed c.ellison logged in since 01:47. Which details told you the session was not legitimate: the account, the source host, the time? The historian had gone flat at 23:12, before that login. What did Marcus conclude from that order of events, and why did it matter when you came to isolate?

> Question: Q10. Pulling the jump server cable cut the RDP session but not the historian. Marcus offered three ways to go further: cut the historian's enterprise leg (losing the dispatch feed and NESO reporting for a day), leave it connected and watch it, or shut SCADA down (putting someone in Hall 2 every hour with a gas monitor). What did you choose? Priya said the plan should have chosen before the night. What criteria should that plan use? If you pulled the jump server cable before Marcus knew about the session, Priya said he should have been told first, because cutting a session mid-write can leave a safety controller half-configured. Was she right, and who should decide on the night? (See CLAIM-EN-010 in the information pack.)

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

> Question: Q16. The SIS configuration panel showed a thermal trip of 85°C and a hydrogen alarm of 3.8% by volume, against the certified 55°C and 1.0% in the safety requirements specification in the filing cabinet. Why might an attacker choose those values rather than switch the SIS off? A safety argument written for accidents assumes faults are random; what changes when the "fault" is an adversary who read the setpoints from the historian weeks before? The SIS kept no record of the change: the 03:22 time survives only in the engineering workstation's own tool history on HMI-ENG-02. What does that do to the evidence for its configuration?

> Question: Q17. Using IEC 62443, name Albion's zones (enterprise, DMZ, SCADA, control, safety) and the conduits between them. Which conduits allowed more than the design said? IEC 61511 requires the SIS to be independent of the control system and, since its 2016 edition, a security risk assessment of the SIS. Where did Albion's architecture fall short of each?

> Question: Q18. Marcus wants the SIS air-gapped: "If it's not plugged in, they can't reach it." Priya answers that air gaps get bridged, usually by a laptop or a USB stick, and would put the SIS in its own zone with one way in, someone watching it, and a key switch that has to be turned on site (in the TRITON attack in 2017 it was left in PROGRAM). Remember how this attack began. Make the best case for each view. Which would you write into the safety case, and what evidence would show it still holds a year later?

> Question: Q19. The patch is where security and safety requirements collide: the NCSC CAF and IEC 62443 say fix a known vulnerability, while IEC 61511's modification management says any change to a certified SIS needs impact analysis, retesting and sign-off, here eight weeks without the automatic trip. Compare CLAIM-EN-005 (patch, with compensating controls during recertification) with CLAIM-EN-006 (defer, with compensating cyber controls). Which is the stronger claim, and what did eighteen months of deferral at Albion show about the weaker one?

> Question: Q20. Helen, Marcus, Tom and Priya each used words like "safe", "isolated", "contained" and "authorised" in their own way. Find one moment in the game where that caused, or nearly caused, a wrong decision. For example, if you left the historian connected, compare Helen's radio, "them out of our network", with what Marcus says.

**Exercises**

> Action: **E7. Rebuild a claim.** Redraw CLAIM-EN-002 as a Goal Structuring Notation (GSN) fragment that would hold up against a deliberate attacker. Add a strategy that argues over attacker capability as well as random hardware failure; sub-claims such as "the engineering port cannot be reached from SCADA" and "no setpoint can change without someone on site turning the key"; evidence for each, with how often it is gathered; and one defeater taken from what happened at Albion.

> Action: **E8. Zones and conduits.** Redraw Albion's network (the network architecture diagram in the control room and in the information pack) as IEC 62443 zones and conduits, with the SIS in its own zone. For each conduit, give what it should allow, what it allowed on 21 March, and one control that would enforce it. Add the shared file server and Trent Water, and explain why the hardwired ESD has no conduit at all.

> Action: **E9. From hazard to requirement.** For the setpoint tamper, write the hazard, its security cause, its effect on the cells and on people, and the controls that existed. Then write one new security requirement and trace it to the safety requirement it protects in the information pack (for example REQ-EN-SAF-002, thermal protection, or REQ-EN-SAF-011, SIS configuration integrity). Say how you would test it without taking the safety function out of service.

---

## Further Reading {#additional-resources}

- Review the [**Information Pack**](/HacktivityLabSheets/labs/security_informed_safety/sis02-energy-information-pack/) for the network architecture, ICS protocols, the SIS, the safety case claims and requirements, and the regulatory frameworks
- Read the **NIS Regulations 2018** (regulations 10 and 11) and **Ofgem's guidance** for operators of essential services in the energy sector
- Use the **NCSC Cyber Assessment Framework (CAF)**, the basis for assessing operators of essential services
- Read **IEC 61511-1:2016**, especially clause 8.2.4 (SIS security risk assessment) and clause 17 (modifying a SIS), with **IEC 61508** for Safety Integrity Levels
- Read **IEC 62443-3-3** and **IEC 62443-4-2** for zones, conduits and component security, and **IEC 62443-2-4** for service providers such as CastleTech
- See **HSE's operational guidance OG86** on cyber security for industrial automation and control systems
- Read a public analysis of the **TRITON (TRISIS)** attack on a safety controller in 2017
- See the **GSN Community Standard** for Goal Structuring Notation, used in exercise E7
- Read the **NFCC guidance** for fire and rescue services on grid-scale battery energy storage sites
- Read **RFC 3227**, Guidelines for Evidence Collection and Archiving, for the order of volatility used in "Evidence or Safety First"
- The Cyber Security Body of Knowledge (CyBOK) **Security-Informed Safety** topic guide covers the ideas in this sheet in more depth
