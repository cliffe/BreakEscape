# sector_01: Healthcare staff

**Working game title:** Ward Round
**Pitch:** A morning as the ward clerk, where getting three patients home by two means sharing the right information with the right people, keeping it from everyone else (including your own curiosity), and spotting the caller, the email and the stranger who shouldn't be trusted.

| | |
|---|---|
| Audience | Clinical and administrative staff in hospitals and community services; GP practice and care home staff through later editions |
| Built foundation | None yet: sector_01 is a new sector role. It reuses the built episode-runner shape, the inbox-triage `call` and email cards (the E3 pattern), and the consequence flip |
| Company | Beckside Hospitals NHS Trust (`beckside.example`), **proposed, to add to `BRAND_SET.md`**; host Dev Kapoor (information governance manager) |
| New check pair | A healthcare check-form pair (`awareness_{pre,post}_healthcare_{ab,ba}`), **new** |
| Prerequisites | core_00; core_01, core_04 and core_05 recommended |
| Full episode | About 13 minutes |
| Defend-only variant | About 8 minutes |
| Pre and post check | 4 to 5 minutes each (the new healthcare pair) |
| Priority | Phase 3 |
| Build size | M. One new attack-first episode (phone enquiries and a ward-mailbox phish) and one consequence-flip episode (snooping, smartcards, downtime), plus a new healthcare check pair |

## Build status

- **Built, this module reuses:** the episode runner, the inbox-triage `call`, `sms`, `page` and email cards with the Verify verdict (the E3 phone-triage pattern), the flip view, the debrief view, concept cards and awareness measurement. sector_01 has **no built episode or check** of its own yet.
- **New (this whole module):** a healthcare sector role at the proposed Beckside Hospitals NHS Trust. It needs its **own healthcare check-form pair** (`awareness_{pre,post}_healthcare_{ab,ba}`), a new attack-first episode (phone enquiries and a ward-mailbox phish) and a consequence-flip episode (need-to-know and snooping, smartcards, downtime workarounds).
- **No video.** The build uses concept cards, feedback strings and text to speech, not video (R9). The old plan's Dr Mulligan "duty to share" video becomes a concept card delivered by the Caldicott Guardian, not an engine-recorded video.
- The awareness product is "Incident Simulations: Critical Cases", on hold since 2026-10-23 (`../phishing_and_social_engineering/awareness/HANDOVER.md`). Nothing new here starts while it is on hold unless the user says so.

## Why this module

Health records hold the most private facts of people's lives, and hospitals run on shared computers, shared phones, shared mailboxes and constant interruptions. Staff have two duties that pull against each other: keep information to the people who need it, and share it quickly when care needs it. The Caldicott Principles state both. When security fails in health and care, care itself stops; and one of the commonest harms is the closest to home: staff looking at records they have no need to see.

- **WannaCry, May 2017.** Ransomware spread through unpatched and unsupported Windows systems. At least 81 of the 236 trusts in England were affected, and 603 primary care and other NHS organisations were infected, including 595 GP practices. NHS England identified 6,912 cancelled appointments and estimated more than 19,000 in all, and five A&E departments had to divert patients (National Audit Office, October 2017).
- **Synnovis, June 2024.** A ransomware attack on 3 June 2024 hit almost all the IT systems of the pathology service for hospitals and GP practices in south east London, disrupting blood tests for months; stolen data was published on 20 June (Synnovis).
- **Worcestershire Acute Hospitals NHS Trust, 2023.** A medical secretary opened the records of 156 patients, among them relatives and neighbours, more than 1,800 times without any business need. She pleaded guilty under section 170 of the Data Protection Act 2018 and was ordered to pay £648; the ICO's message was that curiosity is no excuse (ICO, November 2023).

## Target behaviours

1. **Opens only the records they need** for their work, and keeps smartcards and sessions to themselves. **New (consequence flip).**
2. **Checks who is asking, then shares what care needs** through approved routes. **New (attack-first episode).**
3. **Reports** phishing, strangers in staff areas and their own mistakes, and uses the downtime procedure when systems fail.

## Learning outcomes

After this module, health and care staff can:

- **S01-LO1** Open only the records they need for their work, and explain that looking out of curiosity is logged, is a disciplinary matter and can be a criminal offence. **New (consequence flip).**
- **S01-LO2** Keep smartcards and sessions to themselves: remove the card and lock the screen when they step away, and never work in someone else's session. **New (consequence flip).**
- **S01-LO3** Check who is asking before saying anything about a patient by phone or in person, and say nothing to people the patient hasn't agreed to. **New (attack-first episode).**
- **S01-LO4** Share what direct care needs with the right professionals through approved routes (the duty to share), without sharing more than is needed.
- **S01-LO5** Keep care safe and information secure when systems are down: follow the downtime procedure and avoid unsafe workarounds (messaging apps, personal phones, USB sticks, medical devices). **New (consequence flip).**
- **S01-LO6** Recognise and report phishing, suspicious visitors and their own mistakes through the organisation's routes.

The healthcare check pair measures the message-facing outcomes (phone enquiries, the mailbox phish, who's asking, the duty to share); the need-to-know, smartcard and downtime outcomes are taught by the consequence-flip episode and concept cards.

## Compliance coverage

Contributes to (references in `02_COMPLIANCE_MAPPING.md`):

- **DSPT B6.a** and **DSPT B6.b**, for NHS trusts, integrated care boards, commissioning support units, arm's length bodies and other organisations on the CAF-aligned toolkit. There is no percentage target: the organisation's training needs analysis decides who needs what. This module is one part of a clinical and administrative staff path, and the per-person record supports B6.b's expectation that each person's training is tracked and refreshed.
- **DSPT 3.2.1 (categories 3 and 4)**: with the core modules (core_01, core_03, core_04, core_05), it contributes to the annual training in data security and protection, and cyber security, that at least 95% of staff must complete. **DSPT 2.1.1 (categories 3 and 4)** when it is used at induction. These apply once the GP practice and care home editions exist (see Open questions).
- **NCSC CAF B6.b** (a defined training path for each role).
- **UK GDPR Art 5(1)(f)**, **UK GDPR Art 32(4)** and **UK GDPR Art 33** (staff reporting possible breaches internally at once, so the organisation can decide on notifying the regulator within 72 hours).
- The **ICO training toolkit** (an all-staff programme covering data sharing, information security and personal data breaches).
- **CIS 14.4** (data handling), **CIS 14.5** (unintentional data exposure) and **CIS 14.6** (recognising and reporting incidents).
- **ISO 27001 A.6.3**, for providers and suppliers certified to ISO 27001.
- **HIPAA 164.308(a)(5)**, for US healthcare customers: it contributes to the awareness programme, in particular protection from malicious software and password (here, smartcard) management.

## Module flow

The new attack-first episode, in the built shape at Beckside:

| Stage | What happens | Scored? | Minutes |
|---|---|---|---|
| Brief and scope note | Dev Kapoor welcomes the learner to an authorised exercise; the learner is the ward clerk on Ward 12 | no | under 1 |
| Attack half | Research what a caller could learn about a patient from public sources, then compose one pretext call or ward-mailbox phish from found facts | no | about 4 |
| Flip | The learner's own approach shown from the ward clerk's side, its tells named | no | 1 |
| Defend half | The ward phone and shared mailbox: enquiry calls, a mailbox phish and a visitor, genuine and impostor, with mirror pairs, Verify on | yes | about 6 |
| Debrief | Per-item cards, genuine-item feedback, the team tally, **the habit to keep**, an "On Monday" card, the reporting route, no blame | no | about 2 |

The **consequence-flip** episode (R3) covers need-to-know and snooping, smartcards and downtime (topics with no live attacker): the learner opens a record out of curiosity, works in a colleague's session, or takes an unsafe workaround in a safe sandbox, and the flip shows the access audit. The new healthcare pre and post checks bracket the episodes.

## Reuse from existing Break Escape content

- **Episode runner** for all stages; `variant: "full"`, `"defendOnly"` and the consequence flip (R3); the `facilitated` flag for a ward-team huddle.
- **OSINT browser** and **intel facts** (what a caller can learn about a patient from public sources); **mail client in template mode** and the **flip view**.
- **Inbox triage** with the `call`, `sms`, `page` and email cards, the Verify verdict and the claimed facts shown by label; **mirror pairs** (aw5) in the defend set and the healthcare checks.
- **Debrief view**, **concept cards** (the duty to share, need-to-know, smartcards, downtime), **awareness measurement** and the comparison panel.
- **Rooms:** a new or redressed Beckside training room (the hospital set is in the main game; the awareness product uses the training-room frame).

## New features needed

- **A new healthcare check-form pair** (`awareness_{pre,post}_healthcare_{ab,ba}`): a triage set of ward phone enquiries, a ward-mailbox phish and a visitor, each phish mirror-paired with its genuine twin (an impostor "relative" against a genuine relative with the agreed password; a reporter "agent" against the press office route; a smartcard-renewal phish against a genuine IT notice; a genuine care home needing a discharge summary). 10 items, 4 phish, matched flag multisets, counterbalanced AB and BA.
- **A new attack-first episode** (phone enquiries and the mailbox phish) and a **consequence-flip episode** (snooping, smartcards, downtime), as above.
- **Concept cards:** need to know, every look is logged; your smartcard is you; who's asking; the duty to share (the Caldicott Guardian's card, replacing the old video); the downtime procedure; report it.
- **BE-05 Organisation profile** (partly built): the phone enquiry rules, the reporting route, the downtime procedure and the contacts in the debrief cards; the reporting-route slot (feature-level only; see `hacktivity.md`).
- **BE-03 Text route** and **BE-04 accessibility** beyond the social overlays: important in a clinical setting.
- Not pursued (would redesign beyond the build): the generalised patient record viewer (from `ehr-terminal`), MG-27, the BE-10 ward sweep and the EX-02 video. The snooping audit is shown as a debrief and concept card, not a full record-viewer minigame; the ward sweep becomes a `page`-style spot-the-risk defend item. The record-viewer generalisation is a later idea in the `features/minigames.md` catalogue (build status "not built").

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
- The organisation's DSPT category, which decides the compliance references; and the reporting route shown in the debrief (`slot:customer_report_route`).

## Open questions

1. **Beckside Hospitals NHS Trust as a proposed brand-set company.** None of the four built companies is a healthcare organisation. *Recommendation: add Beckside Hospitals NHS Trust (`beckside.example`) to `BRAND_SET.md` with a pre-ship web search; the facilities contractor on site is the proposed Harbreck Facilities Group (role_01). Candidate for DECISIONS_PENDING.*
2. **Hospital only, or wider health and care?** *Recommendation: the hospital ward for version 1; add GP practice and care home editions later, because DSPT categories 3 and 4 still require 95% of staff to be trained every year.*
3. **Showing the consequences of snooping.** *Recommendation: show the access audit in the consequence flip and say plainly it is a disciplinary matter and can be a crime, with the real case in `concepts.md`. Don't stage a dismissal.*
4. **Details that change every year.** NHSmail's reporting route, smartcard terms and the DSPT all change. *Recommendation: keep them as organisation slots, check them at build time, and review the module with each DSPT release.*
5. **Clinical accuracy.** *Recommendation: a ward nurse and a ward clerk review the script before the build, so routines such as results by phone and discharge paperwork match real practice.*
