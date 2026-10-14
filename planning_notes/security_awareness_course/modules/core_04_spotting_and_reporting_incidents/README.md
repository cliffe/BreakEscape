# core_04: Spotting and reporting incidents

**Working game title:** The Golden Hour
**Pitch:** On an ordinary Thursday afternoon, small things start going wrong around the office; each one spreads until somebody reports it, and the security team shows you exactly how far it got.

| | |
|---|---|
| Audience | All staff |
| Prerequisites | core_00 recommended (the cast and the reporting route); none required |
| Full module | 15 minutes |
| Micro-drill | 3 minutes ("Report it or not?") |
| Text route | 10 minutes |
| Priority | MVP |
| Build size | M, driven by the incident report form (MG-09) and the incident spread map (MG-26). The spread itself runs on scenario timers and globals that already exist, Kai's board is the existing `command-board`, and MG-26 extends the existing `network-segmentation-map` |

## Why this module

Most of the damage in an incident happens between the moment someone notices something odd and the moment someone tells the people who can stop it. Staff are often first to notice: a colleague's account sending emails nobody wrote, files that won't open, a laptop that isn't where it should be, a spreadsheet sent to the wrong person. Many hold back: they aren't sure, they think it's someone else's job, or they fear the blame. The NCSC warns that where people don't feel safe to speak up, they cover up mistakes.

- **Capita, 2023.** A malicious file was downloaded onto an employee's device on 22 March 2023. A high-priority alert was raised within 10 minutes, but the device was not quarantined for 58 hours, and in that time the attacker gained administrator rights, moved through the network and took nearly a terabyte of data. The personal information of 6.6 million people was stolen. The ICO (since 30 September 2026, the Information Commission) fined Capita £14 million in October 2025. That delay was in the security team, not a missing staff report, but the lesson is the same for everyone: the clock starts at the first sign.
- **23andMe, 2023.** Login attacks ran from April; a claim of data theft in August was dismissed as a hoax; a full investigation began only in October, when an employee found the stolen data advertised for sale.

The law runs on a clock too. An organisation must tell the Information Commission (the ICO) about a reportable personal data breach within 72 hours of becoming aware of it, and a supplier handling data for a client must tell the client without undue delay. Neither is possible if the first person to notice keeps quiet. Reporting only happens where it feels safe: the NCSC's culture principles (June 2025) say incidents should be "investigated with a view to learn and improve, not to blame". Sources are in `concepts.md`.

## Target behaviours

1. **Reports anything that might be an incident straight away**, through the organisation's route, including when unsure, out of hours, and after their own mistake.
2. **Gives the key facts:** what, when, where, who, and what they've done so far.
3. **Leaves things as they are and follows instructions:** doesn't investigate, fix, delete or switch off, and helps colleagues report their own slips.

## Learning outcomes

After this module, staff can:

- **C04-LO1** Recognise what counts as an incident (anything that might put information, systems, money or people at risk, including near misses and mistakes) and its common signs.
- **C04-LO2** Report a suspected incident straight away through the organisation's route, including when unsure, out of hours and away from the office.
- **C04-LO3** Include what, when, where, who and what they've done so far in a report.
- **C04-LO4** Take the right first steps: leave things as they are, keep the evidence, don't switch off unless told, and follow the security team's instructions.
- **C04-LO5** Report their own mistakes, and help a colleague report theirs, kindly and without blame.
- **C04-LO6** Explain why speed matters and what happens after a report.

## Compliance coverage

Contributes to (short references as in `02_COMPLIANCE_MAPPING.md`, section 2):

- **ISO 27001 cl. 7.3**, **ISO 27001 A.6.3** and **ISO 27001 A.6.8** (a route for staff to report observed or suspected security events quickly). This module is the main staff-facing evidence for A.6.8. **ISO 27002 6.3** names "basic procedures such as reporting security events".
- **NIST AT-2** (what users do to respond to suspected incidents) and **NIST AT-2(4)** (suspicious communications and anomalous system behaviour).
- **CIS 14.6** (recognising and reporting security incidents). It touches **CIS 14.5** (sending data to the wrong person, losing a device) as things to report; core_05 and core_06 teach those.
- **PCI DSS 12.6.1** (all personnel aware of their role) and, as good practice, **PCI DSS 12.6.3.1** (how to spot, react to and report attacks).
- **NCSC CAF B6.a** (people know how to raise a concern, and those who report are treated positively) and **NCSC CAF B6.b**.
- **NIS2 Art 21(2)(g)** and **NIS2 IR 8.1** (the awareness programme covers contact points and resources).
- **DORA Art 13(6)** and **DORA RTS Art 19**, for EU financial entities.
- **UK GDPR Art 32** and **UK GDPR Art 33** (internal reporting, so the organisation can notify within 72 hours and a processor can tell the controller without undue delay); the **ICO training toolkit** (personal data breaches in the all-staff programme).
- **DSPT 2.1.1, 3.2.1 (categories 3 and 4)**, for NHS customers.
- **HIPAA 164.308(a)(5)(ii)(B) and (C)** (reporting malicious software and log-in discrepancies), **CMMC AT.L2-3.2.1** and **SOC 2 CC2.2** (how to report failures, incidents and concerns), for US customers.

## Module flow

| Beat | What happens | Format | Minutes |
|---|---|---|---|
| Hook | 13:50. Leo says a school has rung to ask why he sent them an invoice link he never sent. What the player tells him, and how fast it gets reported, is the baseline. Leo's account keeps sending while they decide | Game (`person-chat`, timers) | 1 to 2 |
| Learn | Ama and Kai at the player's desk: Kai's blast radius for Leo's account, then what counts, the signs, how to report and what to include, what not to do, and no blame | NPC explainer with visual aids (EX-01, EX-05, BE-08) | 3 |
| Practise | "Report it or not?" (eight quick situations), then two practice reports on the form with instant feedback, and one "first moves" ordering item | MG-09 practice mode | 3 |
| Apply | "The golden hour": the council's monthly report is due at 15:00. Four things go wrong around it (files that won't open, a missing laptop, a sign-in prompt, Martin's wrong attachment) and an optional fifth (a stranger by the comms room). Each spreads until it is reported | Game (BE-18, MG-09; the spread runs on timers) | 5 to 6 |
| Debrief | Kai's replay of the afternoon on one map: when each sign appeared, when it was reported, and what the report let the team do. Martin is thanked | Debrief screen (BE-02), MG-26, then Kai and Ama | 2 |
| Check | Six scenario questions | Quiz (MG-20) | 2 |
| Reference | The reference card, with the organisation's own routes and numbers | Intranet (BE-09) | under 1 |

## Reuse from existing Break Escape content

- **Rooms:** `room_office` (the Operations floor), `room_meeting` (Meeting Room 2), `room_security` (Kai's office), `small_office_room3_1x1gu` (the Finance office), `hall_1x2gu` (the corridor to the comms room, with a `room_servers` door), `room_break` (optional).
- **Conversations:** `person-chat` for Leo, Ama, Kai, Martin, Tomasz and Precious (multi-speaker for Ama and Kai); `phone-chat` for the team chat, Lena, Kai's acknowledgements, and the security team's 4444 line as an ink conversation until MG-04 exists.
- **Kai's response board:** `command-board`, configured through its `commandBoard` scenario block: timeline entries and status rows driven by global conditions, stamped with game time from the start of the game by the CommandBoardRecorder even while the board is closed (`public/break_escape/js/minigames/command-board/command-board-timeline.js`; wired in `public/break_escape/js/core/game.js` around line 1041). Only sis01 uses it today, with its built-in entries.
- **The interim spread board:** `alarm-panel`, whose multi-state lamps follow globals live (`public/break_escape/js/minigames/alarm-panel/alarm-panel-minigame.js`).
- **Kai's isolation:** `network-segmentation-map`, relabelled, for cutting off the laptop that is locking files. Its badge, legend and confirm dialog are written for sis01's hospital today; MG-26 makes them scenario data.
- **The report form's starting point:** `coverage-decision-form`, which already shows sections of options, writes globals on submit and reads everything else from scenario data, apart from a hard-coded "Meridian Cyber Insurance" header.
- **Other minigames:** `container` for the shared drive's folder; `text-file` for the note the locked files leave behind; `examine` for the empty laptop dock.
- **Systems:** `timers[]` with `startOnGlobal`, `cancelOnGlobal`, `setGlobal` and `actions` for every spread stage (`public/break_escape/js/ui/scenario-timer-dispatcher.js`). sis02's hydrogen build-up is the precedent: timers that escalate until an action cancels them, with `tint_objects` making the hazard visible in the room (`scenarios/sis02_energy/scenario.json.erb`, lines 442 to 477). Also NPC event mappings with `bark` and `sendTimedMessage` on `global_variable_changed:<name>`, and `gameClock` for the afternoon.
- **Patterns:** sis01's live incident board and its debrief conversation (`scenarios/sis01_healthcare/ink/npc_sharma.ink`); core_01's report board in Kai's office.

## New features needed

- **MG-09 Incident report form** (the core of the module): build spec in `game_design.md`. Reused by core_05, core_07 and core_14.
- **MG-26 Incident spread map** (the blast radius): devices and links whose state (quiet, spreading, contained) follows globals live, every label from scenario data, the dual-authorisation step optional, reveal rules and a step-through replay; shown on Kai's screen after a report and in the debrief. core_04's configuration is in `game_design.md`; core_07 can reuse it for its ransomware spread.
- **MG-27 Work desktop:** the player's PC as one launcher for The Lark's "Report an incident" tile, the inbox, the shared drive and chat.
- **BE-01 Assessed decisions** and **BE-02 Debrief screen:** every row in `assessment.md`, including the time each sign was first seen and the time it was reported.
- **BE-04 Accessibility baseline:** the proposed pause and time scale, which the spread follows (with timers off, stages follow the work task's steps instead), a `timers_off` global the scenario can read, and a map that never relies on colour alone.
- **BE-08 Visual aids:** the blast radius frames in Learn, the two example reports, Kai's screen share after a report.
- **BE-09 Intranet terminal:** The Lark's "Report an incident" page, which hosts MG-09, and the reference card.
- **BE-16 Time skips:** the debrief at 17:30, with each incident's outcome.
- **BE-18 Work task and interruptions:** the council report and the scheduled signs.
- **BE-19 Open minigames from conversations and events:** MG-09 from Leo's and Martin's conversations (`#trigger_minigame:incident_report|report_leo`) and from the phone; MG-26 from Kai's chat message (`open_minigame`).
- **BE-05 Organisation profile:** the reporting routes and numbers, the form's link, the device instruction, the out-of-hours route.
- **BE-13 Content banks** (P2): the incident bank, so order, timing and details change between plays.
- **EX-01** (Ama), **EX-05** (Kai behind the scenes), **MG-20** (the check), and light use of **MG-01** (Leo's odd email) and **MG-07** (the sign-in prompt, from core_03).
- **MG-04 Voice calls** (P2): ringing 4444 as a real call; the `phone-chat` conversation works until then.
- **BE-07 Micro-drill launcher** (P2): "Report it or not?" as a monthly drill.

## Organisation-specific content

- The reporting routes: the Report button for messages; the security team's number and the incident form for anything else; the 24/7 route out of hours; the route for lost or stolen devices, including personal phones with work email.
- Who handles personal data breaches (the DPO) and how they are reached (by default, the same route).
- The instruction for a device that may be infected (by default: don't switch it off; unplug the network cable or turn off Wi-Fi only if asked; wait for instructions).
- How physical security concerns reach facilities or security.
- What reporters hear back, and roughly when.
- Any sector or regulator context the organisation wants on the card (for example NIS2, or a sector regulator).

## Open questions

1. **How visible is the spread during play?** *Recommendation: only in-world signs (colleagues noticing, more emails, more locked folders) until the player reports; the map appears after a report and in the debrief. A live gauge of unreported incidents would test watching, not noticing.*
2. **Minutes or story events?** *Recommendation: the spread runs on game time (about a stage a minute, never shown as a countdown) so it feels real, but ratings count story events, not minutes: whether a report came before the next stage or interruption after the player noticed the sign. BE-04's clock can be paused, slowed or stopped, and with timers off the stages follow the work task's steps, so slow readers are never marked down.*
3. **How many incidents?** *Recommendation: four on the critical path and an optional fifth, staggered, each with a second sign for players who missed the first; order and timing randomised between plays (BE-13).*
4. **The boundary with core_07.** *Recommendation: core_04 shows only the early signs of ransomware (files that won't open, a note) and the first steps. core_07 owns ransomware itself and reuses MG-26 for its own spread.*
5. **Who presses Cut off?** *Recommendation: the player, on Kai's screen and at Kai's invitation, as a small reward for reporting; Kai says straight away that at their own desk the version is "unplug the cable if we ask you to", which the reference card repeats. It is optional, and Kai does it off-screen if the player doesn't visit.*
