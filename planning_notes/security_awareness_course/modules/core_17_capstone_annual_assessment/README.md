# core_17: Capstone: the annual assessment

**Working game title:** Year End
**Pitch:** An annual edition that brackets a mixed run of the year's episodes with a before-and-after check, so each learner sees what has become habit and what to practise next. A new edition every year.

| | |
|---|---|
| Audience | All staff, every 12 months (the annual refresher) |
| Mixed edition | about 20 to 30 minutes, in one sitting or two |
| Pre and post check | 4 to 5 minutes each (the learner's role forms, AB or BA) |
| Priority | Phase 2 |
| Build size | M as a mixed edition built from existing shells; L for the proposed single-day and team-event extensions |

## Build status

**An annual mixed edition built from the built defend sets and check forms.** The build already has the pieces this module needs: seven episodes' defend sets (E1 to E7), their defend-only variants, and the six roles' pre and post check forms in AB and BA order (`../../04_BUILT_SO_FAR.md` §1). The post-check already imports the newest pre-check result and shows the change, with no pass mark. Against this module, the built post-checks cover the measured-assessment part of the capstone (`research/built_episodes_vs_plan.md` §2 marks core_17 "Touch").

**New in this module:**

- the **edition**: a yearly selection and ordering of built defend sets (mixed across channels and companies) bracketed by a pre-check and a post-check, with a short "what changed this year" brief and the built debrief;
- the "what changed this year" brief, rewritten and re-checked each year;
- a private year profile and spotlights, and the single-day narrative, chains, and team event, all kept as **proposed, later** extensions, not part of the mixed edition.

**There is no default pass mark** (R6). The checks already author `passPercent` 0; an organisation may set a pass mark on the post-check percent as a later option, through the platform.

The capstone is not yet built as an edition: the awareness product is on hold.

## Why this module

Several frameworks require security awareness training every year (PCI DSS 12.6.3, CIS 14.1, NYDFS 500.14(a)(3), DSPT 3.2.1), and others expect it to be "refreshed at suitable intervals" and evaluated for its effect (NCSC CAF B6.b). PCI DSS 12.6.2 also expects the programme to be reviewed every year and updated for new threats.

A once-a-year course on its own changes little. In an eight-month randomised study of more than 19,500 staff at a US healthcare organisation, Ho and others (2025) found no significant relationship between recent annual training and whether people fell for a simulated phish. In a German field study, improved phishing-spotting still held at four months but had gone by six (Reinheimer and others, 2020). So this module is built to:

1. **Measure habits, not recall,** by bracketing a mixed run of the year's defend sets with a matched before-and-after check.
2. **Refresh what changed this year,** in a few minutes, from that year's threat picture.
3. **Point each learner at the practice they need** for the year ahead (proposed, later).

Real attacks rarely rely on one trick. They chain small moments across channels, and the chain breaks at the first person who pauses and reports.

- **Retool, 2023.** Staff were sent texts pointing to a fake sign-in page; an attacker then rang one of them, using a deepfaked voice of an IT colleague, and obtained an MFA code, going on to take over 27 cloud customers' accounts.
- **Marks and Spencer, 2025.** The chairman told MPs the attackers got in through "sophisticated impersonation" involving a third party; months of disruption followed (see core_00's concepts for sources).

## Target behaviours

1. **Keeps the habit** whenever a threat arrives in the middle of busy work, on any channel.
2. **Breaks the chain early:** reports the first odd thing (a prompt, a call, a message) rather than waiting to see what happens next.
3. **Helps colleagues** do the same, by explaining the habit without blame.

## Learning outcomes

After this module, staff can:

- **C17-LO1** Apply the habit to threats arriving unannounced by email, phone, chat, in person and on screen, during a mixed run drawn from the year's episodes.
- **C17-LO2** Recognise when an event may be one step in a chain (an unexpected prompt, a call, a change request) and break the chain by reporting it at once.
- **C17-LO3** Keep to the organisation's procedures for money, personal data, access and the building under time pressure and in the face of senior names.
- **C17-LO4** Report their own slip promptly with the key facts (what, when, what they did), and pass other people's requests to the person who should handle them.
- **C17-LO5** Explain a security habit to a newer colleague in a sentence, without blame.

Every item also re-tests specific outcomes from the core modules; `assessment.md` maps each one.

## Compliance coverage

Contributes to (short references from `02_COMPLIANCE_MAPPING.md`):

- **PCI DSS 12.6.3** (training at least every 12 months) and **PCI DSS 12.6.3.1** (phishing and social engineering, re-tested in context). The edition's release notes are evidence for **PCI DSS 12.6.2**.
- **ISO 27001 cl. 7.2** (competence evaluated), **cl. 7.3** and **A.6.3** ("regular updates").
- **NIST AT-2**, **AT-2(1)** (practical exercises) and, through each edition's threats, **AT-2(6)**.
- **CIS 14.1** (at least annually, content reviewed each year).
- **NCSC CAF B6.b** (training tracked and refreshed; activities evaluated for effect).
- **DSPT 3.2.1** (categories 3 and 4).
- **NIS2 Art 21(2)(g)** and **NIS2 IR 8.1**; **DORA Art 13(6)**, for EU customers.
- **ICO training toolkit** (refresher training at appropriate intervals, with an assessment).
- **AI Act Art 4**, in editions that include AI tools and deepfakes, for EU customers.
- **NYDFS 500.14(a)(3)**, **CMMC AT.L3-3.2.1e** and **CMMC AT.L3-3.2.2e**, for US customers.

## Module flow

The mixed edition is a sequence of built missions an organiser places in one event. There is no single company; the run draws defend sets from several brand-set companies, so the learner meets the year's channels and brands.

| Stage | What happens | Minutes |
|---|---|---|
| Pre-check (separate mission) | The learner's role pre-check form (A or B, per the AB/BA pairing); the baseline | 4 to 5 |
| Brief: what changed this year | A short "year in three changes" brief, rewritten each year; a neutral proctor hosts | 3 |
| Mixed run | A selection of the year's defend sets (from E1 to E7 and their defend-only variants), mixed across channels and companies; each is the built inbox-triage defender under the `awareness` profile | 10 to 15 |
| Debrief | Per-item reasoning across the run, feedback on the genuine items, the team-protected tally, the habit, the "On Monday" card, the reporting route and the no-blame line | 3 to 4 |
| Post-check (separate mission) | The paired role post-check form; imports the pre-check and shows the change; no pass mark | 4 to 5 |

## Setting and host

- **Companies:** the brand-set companies whose defend sets the edition draws on (Brightwell, Tarrowby, Quayholt, Merrin & Sallow), so the mix is realistic and cross-channel.
- **Host:** a neutral proctor for the brief and debrief; Graham Whitfield (an existing check-mission host) is the default. The proctor says one line of welcome and carries the event mapping that completes the shell once the result has synced.

## Reuse from existing Break Escape content

- the seven episodes' **defend sets** and their defend-only variants, under the `awareness` profile;
- the six roles' **pre and post check forms** (AB and BA), with the platform's carry-over that shows the change;
- the **debrief view** and the **awareness-measure** records;
- the **episode runner** and step strip.

New (for the mixed edition): the edition definition (which defend sets, in which order) and the "what changed this year" brief. The single-day narrative, the chain view, the private year profile and spotlights, and the team event are **proposed, later** extensions on top of this.

## New features needed

See the items marked New in "Build status" above.


## Organisation-specific content

- The year's "what changed here this year": up to three lines (a new tool, a policy change, a new reporting route).
- Which episodes' defend sets to include, and the order.
- The reporting routes and procedures from the other modules (fills `slot:customer_report_route`).
- Policies due for annual re-acknowledgement (the later platform option from core_16).
- The team event's date and facilitator, if the organisation runs one (proposed).

## Open questions

1. **Who sees the (proposed) year profile?** The learner only, by name; the organisation sees areas in aggregate above the privacy threshold, and completion as for any module. Never used for discipline.
2. **Pass mark.** None by default (R6). An organisation may set one on the post-check percent later.
3. **Edition timing.** Release each edition in September, so organisations holding their annual event in October (European Cybersecurity Month) get the new one.
4. **The first edition's year.** "Year End 2027", the first year the core episode set is complete.
5. **The single-day narrative, chains, year profile and team event** are kept as proposed, later extensions; the mixed edition built from existing shells ships first.
