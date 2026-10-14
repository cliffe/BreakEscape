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
| Build size | M, driven by the incident report form (MG-09) and the blast radius. The spread itself runs on scenario timers and globals that already exist; Kai's board is the existing `command-board`; the map extends the existing `network-segmentation-map` |

## Why this module

Most of the damage in an incident happens between the moment someone notices something odd and the moment someone tells the people who can stop it. Staff are often first to notice: a colleague's account sending emails nobody wrote, files that won't open, a laptop that isn't where it should be, a spreadsheet sent to the wrong person. Many don't report, because they aren't sure, think it's someone else's job, or fear the blame.

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
