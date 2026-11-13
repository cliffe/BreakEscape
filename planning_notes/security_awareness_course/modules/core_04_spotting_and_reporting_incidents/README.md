# core_04: Spotting and reporting incidents

**Working game title:** The Golden Hour
**Pitch:** Send one phish that gets clicked, then flip to the account it hit and triage the signs that follow, reporting each before it spreads.

| | |
|---|---|
| Audience | All staff |
| Prerequisites | core_00 is the first-play brief in the kiosk frame; none required |
| Full episode | About 15 minutes (E8, built shape) |
| Defend-only variant | About 8 minutes |
| Pre and post check | about 9 minutes each, no pass mark |
| Text route | A gap in the build (BE-03), still to come |
| Priority | Built (the reporting furniture in every debrief); E8 after the click is new |
| Build size | The new work is E8, which carries both core_04 and core_01 LO6, in the built shape |

## Build status

**Part built** (`research/built_episodes_vs_plan.md` §2). The reporting culture is already built into every episode; the incident-reporting teaching itself is new, delivered by E8 *after the click*.

| Outcome | Covered by | Status |
|---|---|---|
| C04-LO1 what counts as an incident, and its signs | not yet taught | **New (E8)** |
| C04-LO2 report straight away, including when unsure and out of hours | the report verdict in every defend set; the always-visible report button | **Builds on every episode; the full teaching is New (E8)** |
| C04-LO3 include what, when, where, who and what you've done | not yet taught | **New (E8)** |
| C04-LO4 first steps: leave it, keep evidence, don't switch off | not yet taught | **New (E8)** |
| C04-LO5 report your own and a colleague's mistake, no blame | the no-blame line in every debrief | **Builds on every episode; the full teaching is New (E8)** |
| C04-LO6 why speed matters and what happens after a report | the team-protected tally in every debrief | **Builds on every episode; the full teaching is New (E8)** |

**What is built:** every episode's debrief carries the report verdict (always visible, never penalised), the "team protected" tally, the customer's reporting route (the `customer_report_route` slot) and a no-blame line. That is the reporting culture, in spirit. It does not yet teach what counts as an incident, what a report should contain, the first steps, or what happens next.

**What is new:** E8 *after the click* (built shape, new) teaches core_04 and core_01 LO6 together (`04_BUILT_SO_FAR.md` §4), proposed at **Quayholt Insurance** (general staff), host **Anjali Rao**, the information security analyst who receives reports, both already in `BRAND_SET.md`. The old plan's live-spread "golden hour" afternoon is retired as a room-walk design; its best ideas (a blast radius, a report form, the no-blame framing) are carried in the built shape by E8's flip, defend set and debrief. E8's design is in `game_design.md`.

## Why this module

Most of the damage in an incident happens between the moment someone notices something odd and the moment someone tells the people who can stop it. Staff are often first to notice: a colleague's account sending emails nobody wrote, files that won't open, a laptop that isn't where it should be, a spreadsheet sent to the wrong person. Many hold back: they aren't sure, they think it's someone else's job, or they fear the blame. The NCSC warns that where people don't feel safe to speak up, they cover up mistakes.

- **Capita, 2023.** A malicious file was downloaded onto an employee's device on 22 March 2023. A high-priority alert was raised within 10 minutes, but the device was not quarantined for 58 hours, and in that time the attacker gained administrator rights, moved through the network and took nearly a terabyte of data. The personal information of 6.6 million people was stolen. The ICO (since 30 September 2026, the Information Commission) fined Capita £14 million in October 2025. The delay was in the security team, not a missing staff report, but the lesson is the same for everyone: the clock starts at the first sign.
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
- **NIST AT-2** and **NIST AT-2(4)** (suspicious communications and anomalous system behaviour).
- **CIS 14.6** (recognising and reporting security incidents). It touches **CIS 14.5** (sending data to the wrong person, losing a device); core_05 and core_06 teach those.
- **PCI DSS 12.6.1** and, as good practice, **PCI DSS 12.6.3.1**.
- **NCSC CAF B6.a** (people know how to raise a concern, and those who report are treated positively) and **NCSC CAF B6.b**.
- **NIS2 Art 21(2)(g)** and **NIS2 IR 8.1**.
- **DORA Art 13(6)** and **DORA RTS Art 19**, for EU financial entities.
- **UK GDPR Art 32** and **UK GDPR Art 33** (internal reporting, so the organisation can notify within 72 hours and a processor can tell the controller without undue delay); the **ICO training toolkit**.
- **DSPT 2.1.1, 3.2.1 (categories 3 and 4)**, for NHS customers.
- **HIPAA 164.308(a)(5)(ii)(B) and (C)**, **CMMC AT.L2-3.2.1** and **SOC 2 CC2.2**, for US customers.

Measurement is the pre and post check pair, not a per-module pass mark; see `assessment.md`.

## Module flow

The built episode shape, applied to E8. A full episode is about 15 minutes; the defend-only variant is about 8 minutes.

| Stage | What happens | Scored |
|---|---|---|
| Brief and scope note | Anjali Rao welcomes the learner and names the exercise as authorised, at a fictional company | no |
| Attack | Compose one credential phish from a template with blanks filled from facts found in the OSINT browser, as in E1 and E5; unscored, one artefact | no |
| Flip | The message lands and is clicked; the learner becomes the person whose account is now being used | no |
| Defend | Triage the signs that follow (sent mail you didn't write, an unrequested reset, locked files, a misdirected document, a benign look-alike) with Report, Trust, Delete and Verify; the right first move for every real sign is report and leave it | yes |
| Debrief | Reasoning cards, the recovery and first-steps card, genuine-item feedback, the team-protected tally, the habit to keep, the "On Monday" card, the customer report route and the no-blame line | no |
| Pre and post check | Forms bracketing the episode: matched parallel forms, counterbalanced, no pass mark | the checks are scored, with no pass or fail |

## Reuse from existing Break Escape content

Built on the awareness systems on main:

- the episode runner and step strip, in the Quayholt training room;
- the OSINT browser and intel facts (the attack half);
- the mail client in template mode with the red-flag meter (the composed phish);
- the flip view (the click and the used account);
- the inbox-triage defender with its card kinds (email, push, voicemail, page), the report button and Verify, for the signs-that-follow set;
- the debrief view, concept cards (the first-steps and recovery card), awareness-measure records;
- the look-alike NPC guard and the social validator's strict social job.

The old plan's incident spread map, command board and report form are not part of the built shape; the teaching they carried (a blast radius, a structured report, the first steps) moves into E8's flip, its defend set and its debrief cards.

## New features needed

The engine is built. The open MVP gaps E8 and further episodes still need:

- **BE-03** a text route and **BE-04 and BE-26** accessibility beyond the social overlays;
- **BE-19** a real `#trigger_minigame`;
- **BE-30** configurable call labels (for the push and call cards).

A report-form surface (the old MG-09) could be added later to let the learner practise what-when-where-who-what-you've-done as structured input; in the built shape the defend set and the debrief's five-questions card carry it. No runtime language model is used. No video.

## Organisation-specific content

- The customer reporting route (the `customer_report_route` slot), the security team's number and the out-of-hours route.
- Who handles personal data breaches (the DPO) and how they are reached.
- The instruction for a device that may be infected (by default: don't switch it off; unplug the network cable or turn off Wi-Fi only if asked; wait for instructions).
- The route for lost or stolen devices, including personal phones with work email.
- What reporters hear back, and roughly when.

## Open questions

1. **E8 company and host.** Proposed at Quayholt Insurance with host Anjali Rao, the analyst who receives reports. *Recommendation: confirm Quayholt and Anjali Rao, both already in `BRAND_SET.md`; this keeps E8 consistent with core_01's after-the-click design.*
2. **A report-form surface.** The old plan's incident form let the learner practise the five questions as input. *Recommendation: keep the five-questions teaching in the debrief card for now; propose a report-form surface later if playtests show the defend set does not carry LO3 well enough. (Candidate for DECISIONS_PENDING.)*
3. **Reach into core_07.** E8 shows only the early signs of ransomware (files that won't open, a note) and the first steps. *Recommendation: core_07 owns ransomware itself; E8 stops at "report it and leave it".*
