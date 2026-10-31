# core_05: Data protection and privacy

**Working game title:** Personal Effects
**Pitch:** Cover the care laundry desk for a morning, where a lost cardigan, a friendly caller and a wrong email address each turn out to be about a real person, and learn the four things the law needs you to do.

| | |
|---|---|
| Audience | All staff |
| Prerequisites | core_00 recommended. Where staff handle personal data, set this module due on day one: the ICO expects induction training before people access personal information and within one month of starting |
| Full module | 18 minutes |
| Micro-drill | 4 minutes ("Pass It On?") |
| Text route | 12 minutes |
| Priority | MVP |
| Build size | M, driven by the redaction minigame (MG-12) and the casework queue on the inbox (MG-01); the "Down to One" board is small |

## Why this module

Most personal data breaches are not hacks. They happen when ordinary people do ordinary work: an email to the wrong address, a spreadsheet with more in it than the sender knew, a caller who sounded genuine. The ICO's own guidance says that human error is the leading cause of reported data breaches. Data protection law gives everyone rights over their data and sets deadlines that only work if staff spot a request or a breach and pass it on straight away: usually one month to answer a request, and 72 hours to tell the regulator about a breach that poses a risk.

- **Police Service of Northern Ireland, 2023.** A spreadsheet released in answer to a freedom of information request still held a worksheet that staff didn't know was there. It exposed the names, ranks and roles of all 9,483 officers and staff online for more than two hours. Officers described fear for their families' safety, and some had to move house. The ICO fined the force £750,000 in 2024 (£5.6 million before its public sector reduction).
- **56 Dean Street, 2015.** A London HIV clinic's newsletter went to nearly 800 patients with every recipient's name and email address visible to all. The NHS trust was fined £180,000 in 2016.

Neither was malicious. Both started with someone doing their job.

## Target behaviours

1. **Reports** a possible personal data breach straight away, including their own mistake, without waiting to be sure it counts.
2. **Passes on** requests and complaints about personal data to the DPO the same day, whatever words they use and however they arrive.
3. **Shares** personal data only with people who need it, after checking who is asking: callers get a message passed on, not details, and official requests go to the DPO.

## Learning outcomes

After this module, staff can:

- **C05-LO1** Recognise personal data, including details that identify someone without a name, and recognise special category data.
- **C05-LO2** Apply the principles as five everyday habits: use data only for the reason we have it, use only what is needed, keep it right, keep it only as long as needed, keep it safe.
- **C05-LO3** Recognise a request or complaint about someone's personal data in any form and pass it to the DPO the same day.
- **C05-LO4** Share personal data only on a need-to-know basis, check who is asking, and refer requests from the police and other official bodies to the DPO.
- **C05-LO5** Recognise a personal data breach, including one they caused or received, and report it at once through the organisation's route.

## Compliance coverage

Contributes to (short references from `02_COMPLIANCE_MAPPING.md`, section 2):

- UK GDPR Art 5(1)(f), Art 5(2), Art 24, Art 32(4) and Art 33: staff handle personal data securely and only as instructed, the organisation can show training as one of its measures, and internal reporting is what makes the 72-hour duty possible.
- UK GDPR Art 39(1)(b): the completion record supports the DPO's monitoring of staff training.
- ICO training toolkit: the all-staff programme topics (handling requests, data sharing, information security, personal data breaches, records management), induction before access to personal information and within one month of starting, and an end-of-training assessment.
- ISO 27001 A.6.3.
- NIST AT-2.
- CIS 14.4, 14.5 and 14.6 (14.6 for recognising and reporting a breach; the matrix lists 14.4 and 14.5).
- DSPT 2.1.1 and 3.2.1 (categories 3 and 4); DSPT B6.b for large NHS bodies on the CAF-aligned toolkit, where information assurance includes information governance.

EU customers cite "EU GDPR Art ..." with the same numbers. The 2025 and 2026 UK changes described in `concepts.md` (the complaints duty, the Information Commission) don't apply to them.

## Build status

**Company and host:** a **proposed new company, Carrholme Services** (`carrholme.example`), a facilities and care-support services firm (cleaning, grounds and a care-laundry line for care homes), marked **proposed, to add to `BRAND_SET.md`**. The four brand-set companies (food, haulage, insurance, architects) do not fit the care-laundry and facilities-bid world this module shares with core_06, so a new company is proposed rather than forced. Host: the DPO (a Carrholme data protection officer; the retired recurring mentor is dropped).

**None built** (`research/built_episodes_vs_plan.md` §2: core_05 None). This module is delivered as **E11** (new), a **consequence-flip** episode (R3) shared with core_06: the learner makes an everyday data mistake in a safe sandbox and the flip shows where it led, because data protection has no natural attacker.

- **New (whole episode):** E11, with a defend-only variant and new items for the check forms, at Carrholme Services.
- **Builds on built systems:** the inbox-triage defender, the awareness-measure records, the concept cards, the debrief view and the shared "habit to keep". It does not use the OSINT or write systems (the consequence half replaces the attack half).
- **Checks:** the **general** role, or a proposed all-staff data-handling check pair (**New**), with mirror pairs (`assessment.md`).

## Module flow

Recast in the built episode shape, using the **consequence-flip** variant (R3). Pre and post checks are separate missions that bracket the episode; only the defend half and the checks are scored.

| Stage | What happens | Format | Scored |
|---|---|---|---|
| Pre-check | The role check: one 10-item spot-the-item form, no pass mark | Check mission | Measured, not scored |
| Brief and scope | "Authorised exercise at Carrholme Services (fictional). Scope: this desk, these people." The host welcomes the learner | Episode runner | No |
| Consequence half | The learner makes the everyday mistake in a safe sandbox: gives out a person's whereabouts, misdirects an email, over-shares a record | Sandbox (MG-01, MG-12) | No |
| Flip | The flip shows where the mistake led: the person it reached, the breach clock, the complaint | Flip / consequence view | No |
| Defend half | Route requests, complaints, breaches and disclosures (Handle / Pass to the DPO / Report / Check who's asking) | Inbox triage | Scored |
| Debrief | Per-item reasoning cards, the people board, the shared habit to keep, the "On Monday" card, the reporting route, the no-blame line | Debrief view | Debrief |
| Post-check | The other form; shows the change from the pre-check | Check mission | Measured |

## Reuse from existing Break Escape content

- **Rooms:** `room_office3` redressed as the contact centre floor (headset desks, a "Care Laundry" desk sign); `small_office_room1_1x1gu` as Tomasz's office next door; `room_break` for an optional chat with Shauna.
- **Conversations:** `person-chat` for Tomasz, Shauna and Martin; `phone-chat` for team chat, Martin's messages and, until MG-04 exists, the two phone calls (as core_01 does for its call-back).
- **Documents:** `forensic-data-platform` (the tabbed viewer used in sis03) for "your file after one week"; `notes` and `text-file` for the cleaners' rota, case notes and the holding-reply template; `examine` for a name-taped laundry bag.
- **Patterns:** sis01's credible character voicing a misconception that the player argues down with evidence (`scenarios/sis01_healthcare/ink/npc_helen.ink:104-169`) for Martin's marketing idea; the instructor topic hub from the `lab_*` scenarios for Tomasz's optional topics; m01 Kevin's quiz in ink (`scenarios/m01_first_contact/ink/m01_npc_kevin.ink`) as the precedent for a check question inside a conversation; NPC `timedMessages` for queue arrivals.
- **Systems:** the game clock and `timers[]` for the 12:30 deadline; objectives and tasks (`objectives-manager.js`) for the queue counter; event mappings to bring Tomasz over after a report.
- **Art:** `phone1` to `phone5`, laptop sprites, `office-misc-box1`, `bag1` to `bag25` as laundry bags; m01's office conversation backgrounds.

## New features needed

- **MG-12 Redaction,** configured with the mark and remove tools only: the player decides what to remove, the tool removes it properly, and the score is held back. The "draw a box" trap and the hidden content step are used in core_06, which teaches the technique.
- **MG-01 Inbox:** the casework queue, and compose with recipient autocomplete and an "external recipient" warning.
- **MG-27 Work desktop:** the Care Laundry desk computer, opening the inbox, the rota, the claims notes and the staff intranet, and showing the queue's arrivals as notifications.
- **MG-20 Knowledge check:** Tomasz's two check questions (opened from his conversation with `#trigger_minigame:knowledge_check|<configKey>`, BE-19), "Pass It On?" in practice mode as sort-into-groups items, and the final check.
- **MG-09 Incident report form,** with a "personal data involved?" field that alerts the DPO.
- **BE-01 Assessed decisions** and **BE-02 Debrief screen:** every row in `assessment.md`.
- **BE-08 Visual aids:** "your file", the five habits, the request collage, the 72-hour clock.
- **BE-09 Intranet terminal:** the staff intranet, the reference card and the data protection policy.
- **BE-05 Organisation profile:** the DPO's name and contact, the reporting route, the request route.
- **BE-18 Work task and interruptions:** the queue and its scheduled arrivals.
- **BE-19 Open minigames from conversations and events:** Tomasz's check questions; the redaction opening from a case.
- **BE-16 Time skips:** the consequence scenes.
- **BE-23 Pause and time scale:** the 12:30 queue clock can be paused or slowed, and it can never be failed.
- **BE-13 Content banks:** callers, request wordings, breach-slot variants and redaction documents.
- **EX-01 Mentor explainer,** with Tomasz as the explainer for this module.
- **BE-07 Micro-drill launcher** for "Pass It On?" (P2), and **MG-04 Voice calls** for the calls (P2).
- **proposed:** "Down to One" board, a grid of faces that clues rule out one by one, to show how a few ordinary details single out one person. (`features/minigames.md`, section 6, suggests building it as a variant of MG-13's board or MG-20's sort into groups, S to M.)
- **proposed:** people board, a BE-02 panel that shows the people behind the data the player handled and how each fared.

## Organisation-specific content

- The DPO (or data protection lead): name, contact, and how staff reach them.
- The route for reporting a personal data breach, and whether it is the same as the security reporting route (Carrholme: the same route, which alerts the DPO).
- Where rights requests and complaints go, and the holding reply staff may send.
- How the organisation handles requests from the police and other official bodies.
- Which personal data front-line staff may update directly (a new phone number, say).
- Who approves a new use of personal data, such as marketing.
- Where the retention schedule and the data protection policy live (HA-07).
- The staff support route (such as an employee assistance service) shown with the content note and on the reference card.

## Open questions

1. **A Care Laundry service line.** *Resolved:* Care Laundry is already in `03_WORLD_AND_CAST.md` (service lines): Carrholme collects, washes and returns care home residents' name-taped clothing, and its customer desk handles lost-item claims. It gives the module its people and its title.
2. **Can the player avoid the misdirected email?** *Recommendation: yes. The autocomplete is visible and catchable. A player who catches it is thanked, and the breach slot fills with a different breach (personal data received by mistake), so everyone practises reporting one.*
3. **Who explains?** There is no recurring course mentor in the built product; each episode's host carries the teaching. *Recommendation: the host here is a Carrholme data protection officer. The reporting route must match the one core_04 teaches, so the voices never disagree.*
4. **How much law on screen?** *Recommendation: none beyond "one month" and "72 hours". Article numbers stay in `concepts.md` for writers and auditors.*
5. **Recognising a complaint.** Since 19 June 2026, organisations must acknowledge data protection complaints within 30 days. *Recommendation: teach complaints alongside requests (same route, same day) rather than as a separate topic.*
