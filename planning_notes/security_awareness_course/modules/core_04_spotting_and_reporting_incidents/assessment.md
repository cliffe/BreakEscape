# core_04 assessment

The built product measures the incident-reporting outcomes through the **scored defend half of E8** (the signs-that-follow set) and the **pre and post check** forms, plus the reporting furniture that every episode's debrief reinforces. Both use the awareness scoring profile (60 for the verdict, 40 for the flags) and per-item awareness-measure records (item id, form, verdict, chips, score, stage and time; no free text, no identity). There is **no default pass mark**: the check missions set the pass percent to 0 and are scored for completion. A pass mark is a later organisation option on the post-check percent.

The plan's behaviours and question items are kept as **candidate items**: each maps onto an E8 defend card or a check item, and the critical behaviours become **mirror pairs** (a real sign matched with a benign look-alike). The old plan's "how soon, measured in story events" no longer applies: the built defend set is read at the learner's pace and scored on the verdict and the flags, not on timing.

## Assessed behaviours

Ids are unchanged. Each behaviour is now a scored move on an E8 defend card or a check item. "Mirror pair" names the matched benign item that makes it measurable before and after.

| Id | Behaviour (the scored move) | Learning outcome | Where it is scored | Mirror pair |
|---|---|---|---|---|
| C04-B1 | Reports a colleague's compromised account | LO2, LO5 | E8 "sent mail you didn't write" card | A genuine sent item in the same set |
| C04-B2 | Reports files that won't open, and leaves them | LO1, LO2, LO4 | E8 locked-files card | A genuine "file is just large / read-only" item |
| C04-B3 | Reports a lost or odd device sign | LO1, LO2 | E8 and the check: a device sign (an unrequested reset, a missing-device note) | A genuine device notice (a scheduled wipe the learner asked for) |
| C04-B4 | Handles a prompt nobody started | LO1, LO2 | E8 unrequested-push card | A prompt the learner did start (approve) |
| C04-B5 | Helps a colleague report a misdirected document | LO5, LO6 | E8 misdirected-document card | A genuine "sent to the right person" item |
| C04-B6 | Reports a stranger or physical sign (where present) | LO1, LO2 | the check (points to core_10 and E12) | A genuine, badged visitor |
| C04-B7 | Knows what a report should include | LO3 | the five-questions concept card; a check item picking the most useful report | A vague report against a full one |
| C04-B8 | Leaves things as they are, and says what they did | LO4 | E8 locked-files and recovery cards | Retry, restart or delete against leave-it-and-report |
| C04-B9 | Sorts "report it or not" | LO1 | the check: a mix of real incidents and normal problems (a printer jam) | Each normal problem is the mirror of a real incident |

Reporting a genuine item is never scored as wrong: the debrief gives a tip on how a quick check would have told. The attack half (the composed phish) is never scored.

## Critical behaviours

The build gates completion on finishing the defend half and the debrief, not on a behaviour. What the plan called critical behaviours are kept as the **must-include mirror pairs** E8's defend set and the check form carry:

1. **C04-CB1 Reports the signs they meet:** every real sign in the set is matched with a benign look-alike, so Report is tested against calibration.
2. **C04-CB2 Gets a colleague's mistake reported:** the misdirected-document card pairs "help them report it" with "say nothing".
3. **C04-CB3 Keeps the evidence and says what they did:** the locked-files card pairs "leave it and report" with "retry, restart or delete", and the five-questions card asks what was done.

A mishandled card is explained at once, and a similar item follows; the awareness profile locks the first answer. There is no loop-back gate in the built product.

## Knowledge check bank

The question items are the pool the check forms and the E8 defend set draw from, authored as triage cards (a sign to sort), concept cards (the five questions, the first steps) or flag-naming prompts. Built forms are 10 items each (4 phish in 10), matched flag multisets, feedback at the end, `passPercent: 0`, A and B sharing no slots. Ids are kept as authoring notes.

### C04-Q1 (LO1) is the "what should you report" multi-select

Built as the check's "report it or not" mix: a password reset you didn't ask for, a lost badge, a misdirected spreadsheet, locked files, against a printer jam (the mirror). Over-reporting the jam is never wrong.

### C04-Q2 (LO2) is the lost-device-out-of-hours item

Built as a check card: report it now to the 24/7 route so it can be locked and wiped. Mirror: a device the learner still holds.

### C04-Q3 (LO3) is the "which report helps most" item

Built as the five-questions concept card and a check item: the full report (what, when, where, who, what's been done) against the vague one. A built-in mirror pair.

### C04-Q4 (LO4) is the ransomware first-moves ordering

Built as the first-steps concept card: leave it, ring the security team, say what you see and what you did, follow instructions. Shown as a card, not scored against other learners.

### C04-Q5 (LO4) is the "should I switch it off" item

Built as the locked-files reasoning: do not switch off unless told; report and follow the service desk. Mirror: a device that genuinely needs a restart for updates (core_07).

### C04-Q6 (LO5) is the "I sent it to the wrong person" item

Built as the misdirected-document card: report it now, even though it was your mistake. Mirror: a correctly addressed send.

### C04-Q7 (LO5) is the "don't tell anyone" colleague item

Built into the debrief and the no-blame line, and as a check item: report it together; if they won't, report it kindly yourself.

### C04-Q8 (LO6) is the "why speed matters" item

Built as the team-protected tally's teaching and a check item: most damage happens between noticing and reporting, and the clock for legal deadlines starts at awareness.

### C04-Q9 (LO1) is the "I'm not sure" item

Built as any card where Report is the safe move: report it anyway; the team decides. Report is also the "not sure" button.

### C04-Q10 (LO6) is the "what happens after a report" item

Built as the first-steps and recovery card and a check item: the team triages, contains, investigates, recovers, notifies where needed and learns, and may ask a few questions.

### C04-Q11 (LO2) is the stranger-by-the-comms-room item

Built into the proposed visitor episode E12 (core_10) and kept here as a check item: report it, with a polite check first if comfortable. Mirror: a badged, escorted visitor.

### C04-Q12 (LO1, LO2) is the "I pressed Deny, anything else" item

Built as an E8 and check card: yes, report it, so the password can be changed. Links to core_03. Mirror: a prompt the learner started and approved.

## Reflection prompt

- "Think of something odd you noticed at work and didn't mention. Who would you tell now, and what would you say?"
- For a facilitated session (the `facilitated` flag, not yet shipped): "What makes people here hesitate before reporting, especially their own mistakes, and what would change that?"

## Completion and pass rules

- **Completion:** E8 is complete when the defend half and the debrief are done; a check when the form is done. Missions are scored for completion.
- **No default pass mark.** The check forms set the pass percent to 0. The post-check shows the change from the newest matched pre-check and says so when there is no baseline. A pass mark is a later organisation option.
- **No loop-back gate.** A mishandled card is explained at once, and a similar item follows.
- **No test-out.** The defend-only variant is the measured defence without the attack.

## Evidence for auditors

The per-item awareness-measure records hold the item id, form, verdict, chips, score, stage, variant and time; the first answer wins. No free text and no learner identity are stored. The discrimination figure (hits on real signs against false alarms on benign items) goes to organisers only; learners get genuine-item feedback. This supports:

- ISO 27001 A.6.8 (the reporting route used, with its records), cl. 7.3 and A.6.3; ISO 27002 6.3;
- NIST AT-2 and AT-2(4); CIS 14.6; PCI DSS 12.6.1;
- NCSC CAF B6.a and B6.b;
- NIS2 Art 21(2)(g) and NIS2 IR 8.1;
- UK GDPR Art 33 and the ICO training toolkit;
- DSPT 2.1.1 and 3.2.1 (categories 3 and 4), for NHS customers;
- SOC 2 CC2.2 and HIPAA 164.308(a)(5)(ii)(B) and (C), for US customers.

See `02_COMPLIANCE_MAPPING.md`.

## Measuring effect

The product's own measure is the before-and-after change on matched items for a cohort, with no effectiveness claim. Beyond the course, an organisation can watch time to report, reports per 100 staff (including near misses and self-reported mistakes), who found an incident first, report quality (how often the team has to call back), and the delay in reporting lost devices, all aggregated by department and never by named individual below a privacy threshold. Reports must never be used to rank or single out the people who made the mistakes they describe.
