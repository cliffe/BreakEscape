# sector_01: Healthcare staff

**Working game title:** Ward Round
**Pitch:** A morning as the ward clerk on a busy hospital ward, where getting three patients home by two o'clock means sharing the right information with the right people, and keeping it from everyone else, including your own curiosity.

| | |
|---|---|
| Audience | Clinical and administrative staff in hospitals and community services; GP practice and care home staff through later editions |
| Prerequisites | core_00; core_01, core_04 and core_05 recommended |
| Full module | 20 minutes |
| Micro-drill | 4 minutes ("Share or Don't?") |
| Text route | 12 minutes |
| Priority | Phase 3 |
| Build size | M, mostly existing hospital rooms and sprites; driven by the patient record viewer (from the existing `ehr-terminal`) and the ward phone (MG-04) |

## Why this module

Health records hold the most private facts of people's lives, and hospitals run on shared computers, shared phones, shared mailboxes and constant interruptions. Staff have two duties that pull against each other: keep information to the people who need it, and share it quickly when care needs it. The Caldicott Principles state both. When security fails in health and care, care itself stops; and one of the commonest harms is the closest to home: staff looking at records they have no need to see.

- **WannaCry, May 2017.** Ransomware spread through unpatched and unsupported Windows systems. At least 81 of the 236 trusts in England were affected, and 603 primary care and other NHS organisations were infected, including 595 GP practices. NHS England identified 6,912 cancelled appointments and estimated more than 19,000 in all, and five A&E departments had to divert patients (National Audit Office, October 2017).
- **Synnovis, June 2024.** A ransomware attack on 3 June 2024 hit almost all the IT systems of the pathology service for hospitals and GP practices in south east London, disrupting blood tests for months; stolen data was published on 20 June (Synnovis).
- **Worcestershire Acute Hospitals NHS Trust, 2023.** A medical secretary opened the records of 156 patients, among them relatives and neighbours, more than 1,800 times without any business need. She pleaded guilty under section 170 of the Data Protection Act 2018 and was ordered to pay £648; the ICO's message was that curiosity is no excuse (ICO, November 2023).

## Target behaviours

1. **Opens only the records they need** for their work, and keeps smartcards and sessions to themselves.
2. **Checks who is asking, then shares what care needs** through approved routes.
3. **Reports** phishing, strangers in staff areas and their own mistakes, and uses the downtime procedure when systems fail.

## Learning outcomes

After this module, health and care staff can:

- **S01-LO1** Open only the records they need for their work, and explain that looking out of curiosity is logged, is a disciplinary matter and can be a criminal offence.
- **S01-LO2** Keep smartcards and sessions to themselves: remove the card and lock the screen when they step away, and never work in someone else's session.
- **S01-LO3** Check who is asking before saying anything about a patient by phone or in person, and say nothing to people the patient hasn't agreed to.
- **S01-LO4** Share what direct care needs with the right professionals through approved routes (the duty to share), without sharing more than is needed.
- **S01-LO5** Keep care safe and information secure when systems are down: follow the downtime procedure and avoid unsafe workarounds (messaging apps, personal phones, USB sticks, medical devices).
- **S01-LO6** Recognise and report phishing, suspicious visitors and their own mistakes through the organisation's routes.

## Compliance coverage

Contributes to (references in `02_COMPLIANCE_MAPPING.md`):

- **DSPT B6.a** and **DSPT B6.b**, for NHS trusts, integrated care boards, commissioning support units, arm's length bodies and other organisations on the CAF-aligned toolkit. There is no percentage target: the organisation's training needs analysis decides who needs what. This module is one part of a clinical and administrative staff path, and the per-person record (HA-05) supports B6.b's expectation that each person's training is tracked and refreshed.
- **DSPT 3.2.1 (categories 3 and 4)**: with the core modules (core_01, core_03, core_04, core_05), it contributes to the annual training in data security and protection, and cyber security, that at least 95% of staff must complete. **DSPT 2.1.1 (categories 3 and 4)** when it is used at induction. These apply once the GP practice and care home editions exist (see Open questions).
- **NCSC CAF B6.b** (a defined training path for each role).
- **UK GDPR Art 5(1)(f)**, **UK GDPR Art 32(4)** and **UK GDPR Art 33** (staff reporting possible breaches internally at once, so the organisation can decide on notifying the regulator within 72 hours).
- The **ICO training toolkit** (an all-staff programme covering data sharing, information security and personal data breaches).
- **CIS 14.4** (data handling), **CIS 14.5** (unintentional data exposure) and **CIS 14.6** (recognising and reporting incidents).
- **ISO 27001 A.6.3**, for providers and suppliers certified to ISO 27001.
- **HIPAA 164.308(a)(5)**, for US healthcare customers: it contributes to the awareness programme, in particular protection from malicious software and password (here, smartcard) management.

## Module flow

| Beat | What happens | Format | Minutes |
|---|---|---|---|
| Hook | 08:05. The ward phone rings: "I'm Mr Fenwick's nephew. How's he doing?" The player's answer is the baseline | Game (MG-04) | 1 to 2 |
| Learn | Dev Kapoor, the hospital's information governance manager, on his monthly ward walkabout: need to know, your smartcard is you, who's asking, report it; then Dr Mulligan's 60-second video on the duty to share | NPC explainer and video (EX-01, BE-08; EX-02, MG-21) | 4 |
| Practise | "Share or Don't?" (eight requests, with instant feedback), then Dev's 60-second ward sweep before the consultant's round | Minigame drill (MG-20 items, BE-10) | 3 |
| Apply | 10:00 to 14:00: get three patients home while a smartcard is left in, a phish lands in the ward mailbox, a well-known patient arrives, a caller says she's her agent, pathology goes down, a stranger walks into the staff corridor and the care home needs the discharge details | Game (BE-18, patient record viewer, MG-01, MG-04) | 7 to 8 |
| Debrief | "Every look is logged": Dev shows the record access audit for the well-known patient, then each decision and where it led | Debrief screen (BE-02), Dev and Rodel (the ward manager) | 2 |
| Check | Six scenario questions | Quiz (MG-20) | 2 |
| Reference | The ward card: need to know, smartcards, who's asking, share for care, downtime, report | Intranet (BE-09) | under 1 |

## Reuse from existing Break Escape content

- **Rooms:** the hospital set: `room_hospital_ward` (Ward 12), `room_hospital_reception` (redressed as the ward's front desk), `room_hospital_hall_ward` (the ward corridor, with its trolley bed), `room_hospital_hall` (the staff-only corridor), `room_hospital_staff` (the staff room, with the screen for the video), `room_hospital_office` (Rodel's office), `room_hospital_cto_office` (the small information governance office), `room_hospital_waiting_1x1gu` (the relatives' room). No new rooms.
- **Sprites:** the generic nurse sprites `female_nurse1_v2` and `female_nurse2_v2` with their talk and viseme sheets (m02 gives them display names in the same way); the `female_hospital_staff` talk and viseme sheets for a portrait-only speaker; `male_telecom_v2` for the man in hi-vis; the patient bed sprites `bed1` to `bed6` and `bed_empty`. None of sis01's named characters (Sarah Mitchell, Amy Clarke, Dr Hartley and the rest) and none of m02's.
- **Props:** `ehr-terminal` (object art), `hospital_chart_board1` (the bed board), `nurse_call_display1`, `clipboard_chart1`, `drug_trolley1`, `monitor_stand1`, `bp_monitor1`, `infusion_pump`, `health_poster1` to `health_poster6`, `handwash_poster1`, `phone1`, `id_badge`.
- **Minigames:** `ehr-terminal` (`public/break_escape/js/minigames/ehr-terminal/`): a patient list and record panel, with an offline mode driven by the `ehr_status` global and a configurable `customMessage`, as the base for the patient record viewer; `forensic-data-platform` (tabs and tables) for the record access audit; `phone-chat` for ward calls and bleep messages until MG-04 exists; `person-chat`; `notes` for the downtime pack and the phone enquiry sheet; `examine` for the smartcard in the reader and a USB stick.
- **Backgrounds:** m02's hospital ward conversation backgrounds (`assets/backgrounds/rooms/m02_hospital_ward*.png`) may be reusable if they carry no m02 signage; otherwise new ones through the `room-pov-background` skill once the ward is dressed.
- **Patterns:** sis01's `ehr_terminal` object configuration (patients in `minigameData`) as a model only; the debrief as a conversation gated on globals (`scenarios/sis01_healthcare/ink/npc_sharma.ink`), in this course's voice.

## New features needed

- **proposed:** Patient record viewer, `ehr-terminal` generalised: a configurable title (today "NORTHGATE TRUST EHR - PRESCRIBING MODULE" is hard-coded, which also ties it to sis01's canon); an event for each record opened (which record, which view, when) for BE-01 and the audit; a search box across the hospital; an admin view and a clinical notes view; a restricted-record warning that asks for a reason; and a banner naming whose smartcard is in the reader.
- **MG-01 Inbox:** the ward's shared mailbox, showing how many colleagues have seen a message.
- **MG-04 Voice calls:** the ward phone, the switchboard and the directory for call-backs.
- **MG-20 Knowledge check**, **BE-01 Assessed decisions** and **BE-02 Debrief screen**.
- **BE-10 Spot-the-risk mode:** the ward sweep.
- **BE-18 Work task and interruptions:** "Get them home by 14:00".
- **BE-16 Time skips:** the afternoon after, and a week later.
- **BE-08 Visual aids**, **BE-09 Intranet**, **BE-05 Organisation profile**, and **BE-19** (the phone ringing on its own at the hook; Dev's check question through `#trigger_minigame:knowledge_check|<configKey>`).
- **MG-27 Work desktop:** the ward computer as one launcher for the record viewer, the shared mailbox and the intranet, with the name of whoever is logged in across the top.
- **EX-02 and MG-21:** Dr Mulligan's video on the staff room screen.
- **BE-07 Micro-drill launcher:** "Share or Don't?".
- **MG-17** (optional): a single-call mode with a "Who's asking?" checklist for ward phone enquiries, if the desk is built for role_03 and role_06.
- **EX-08 Printable poster and briefing pack:** an "Every look is logged" poster for staff areas, the ward card for the desk beside the phone, and a five-minute huddle briefing.

## Organisation-specific content

- The organisation's name and logo (on screen only) and its ward names.
- The phone enquiry procedure: how patients choose who may be told (a password or named people), what may be said, the switchboard, and the press office.
- Smartcard rules, and any other login tokens in use.
- The route for reporting phishing (NHSmail's or the organisation's own).
- The downtime procedures and where the packs are kept.
- Rules for medical devices and for clinical photography.
- Visitor and staff ID rules; the security team's number.
- Contacts: the information governance team, the Caldicott Guardian and the press office.
- The disciplinary policy's wording on inappropriate access to records.
- The organisation's DSPT category, which decides the compliance references.

## Open questions

1. **Hospital only, or wider health and care?** *Recommendation: the hospital ward for version 1. Add a GP practice reception edition and a care home edition later (BE-13), because DSPT categories 3 and 4 still require 95% of staff to be trained every year and those settings need their own scenes.*
2. **Showing the consequences of snooping.** *Recommendation: show the audit and say plainly that it is a disciplinary matter and can be a crime, with the real case in `concepts.md`. Don't stage a dismissal in the game.*
3. **Details that change every year.** NHSmail's reporting route, smartcard terms and the DSPT all change. *Recommendation: keep them as organisation slots, check them at build time, and review the module with each DSPT release (version 9 was released on 2 October 2026).*
4. **Clinical accuracy.** *Recommendation: a ward nurse and a ward clerk review the script before the build, so routines such as results by phone and discharge paperwork match real practice.*
5. **The hospital's name.** "Beckside General Hospital" and "Beckside Hospitals NHS Trust" are working names. *Recommendation: run the same real-name check as for Larkspur (`DECISIONS_PENDING.md`, D2) before anything is published.*
