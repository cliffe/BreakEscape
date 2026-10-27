# role_01: Leaders and boards

**Working game title:** Crisis Room
**Pitch:** Leaders rehearse the handful of calls only a board can make in the first hours of an attack, then find out whether their decisions, their insurance and their record hold up.

| | |
|---|---|
| Audience | Directors (executive and non-executive), senior leaders, trustees and governors, and the people who brief them (company secretary, general counsel, heads of communications, IT and security) |
| Built foundation | Episode E4 (executive whaling) and the executive check pair, at Merrin & Sallow Architects |
| Company (built) | Merrin & Sallow Architects (`merrinsallow.example`), host Thandiwe Moyo |
| Company (new episode) | Harbreck Facilities Group (`harbreck.example`), **proposed, to add to `BRAND_SET.md`** |
| Prerequisites | None required. core_04 (reporting incidents) and core_07 (ransomware) are useful background. The executive episode E4 is the built starting point |
| Board crisis episode | About 13 minutes solo; longer as a facilitated group session with pause panels |
| Defend-only variant | About 8 minutes |
| Pre and post check | 4 to 5 minutes each (the executive pair) |
| Priority | Phase 2 |
| Build size | M. The board crisis is a new facilitated episode in the built episode-runner shape; the governance content is carried in pause panels and debrief cards, not a new minigame |

## Build status

- **Built, this module builds on it:** episode E4 *Executive whaling* (`scenarios/awareness_e4_exec_whaling`) and the executive pre and post check pair (`awareness_{pre,post}_executive_{ab,ba}`), both at Merrin & Sallow Architects. E4 puts the learner in the PA's seat against an "about to board, pay this" email and two voicemails in the managing partner's name, with Verify on and a voice concept panel. The executive checks mix emails and voicemails, 5 phish in 10, Verify on, and already carry "Larkspur Travel" as a supplier name (genuine and look-alike) in `ea_larkspur_bank` and `ea_larkspur_invoice`. That supplier name stays; only the old Larkspur Group world is retired.
- **Builds on E4 and the executive checks:** R01-LO6 (verify an urgent instruction that claims to come from a leader) is taught and measured today by E4's PA defend set and the executive checks.
- **New (role extension this plan adds):** a facilitated **board crisis** episode in the built shape, at the proposed Harbreck Facilities Group, covering the board decisions E4 does not touch (R01-LO1 to LO5). It uses the episode runner's `facilitated` flag (BE-15), which exists but no shipped shell sets yet.
- The awareness product is "Incident Simulations: Critical Cases". Development is on hold since 2026-10-23 (`../phishing_and_social_engineering/awareness/HANDOVER.md`). Nothing new here starts while it is on hold unless the user says so.

## Why this module

Leaders don't need to know how ransomware works. They do need to make a handful of decisions in the first hours of an attack that shape everything after it: whether to switch systems off and lose service, who to tell and when, whether to deal with criminals, what to restore first and what to say. Those decisions are hard to make well for the first time at two in the morning.

Most UK organisations haven't rehearsed them. In the government's Cyber Security Breaches Survey 2025/2026 (published 30 April 2026), 31% of businesses had a board member responsible for cyber security and 25% had a formal incident response plan. 49% had a rule or policy not to pay ransoms, and 24% didn't know whether they had one. Only 16% had heard of the Cyber Governance Code of Practice.

- **British Library, 2023.** Ransomware encrypted or destroyed much of the Library's server estate, and about 600GB of files, including personal data, were published when no ransom was paid. Its review found the most likely way in was a remote access server used by third parties that had no multi-factor authentication, and that legacy systems made recovery slow. One of its lessons: all senior officers and board members "need to have a clear and holistic understanding of cyber-risk" (*Learning lessons from the cyber-attack*, 8 March 2024).
- **Co-op and M&S, 2025.** Both told MPs (8 July 2025) about attacks that began with someone impersonating staff. Co-op had "war gamed this precise scenario as a leadership team before, so the board itself was very well prepared for who would take what role". M&S estimated a £300 million gross hit to profit, and its general counsel's advice to other boards was to "make sure that you can run your business on pen and paper".

## Target behaviours

1. **Prepares before the crisis.** Knows the incident plan and their own role in it, knows the organisation's ransom stance and what its insurance requires, and takes part in an exercise at least once a year.
2. **Decides on advice, promptly, and writes down why.** Makes the time-critical calls (isolate, notify, communicate, restore) on expert advice, owns the trade-offs, and records each decision and its reasons.
3. **Checks before acting on urgent instructions, even from the top.** Puts every request to pay, move money or skip the plan through the agreed checks, including one that seems to come from a fellow director. This is the behaviour E4 and the executive checks measure.

## Learning outcomes

After this module, leaders can:

- **R01-LO1** Describe the board's responsibilities for cyber risk using the five principles of the Cyber Governance Code of Practice, and say which incident decisions belong to leaders and which to the technical team.
- **R01-LO2** Ask the questions that test readiness before an incident: critical services, the plan and its last exercise, backups and restore times, supplier access, insurance terms and the ransom stance.
- **R01-LO3** Make and record time-critical incident decisions (isolation, continuity, restoration priorities) on expert advice, and own the trade-offs.
- **R01-LO4** Meet notification duties on time: the ICO's 72-hour clock for personal data breaches, sector regulators, insurers, clients and law enforcement, including a first report when the facts are incomplete.
- **R01-LO5** Weigh a ransom demand lawfully and realistically: legal and sanctions advice, no guarantee of decryption or deletion, no effect on regulatory duties or penalties, the current state of UK policy, and the value of a stance agreed in advance.
- **R01-LO6** Lead the people side of a crisis: honest and timely messages to staff, clients and the public, staff wellbeing, no blame, and verification of urgent instructions that claim to come from leaders. **Built: taught and measured by E4 and the executive checks.**

## Compliance coverage

Training requirements this module contributes to (short names from `02_COMPLIANCE_MAPPING.md`):

- **Cyber Governance Code C1, C3 and C4**: directors' own training (C3), and the culture and training assurance the board leads (C1, C4).
- **Cyber Governance Code D2**: supported only when the facilitated session is run against the organisation's own incident plan, with its headings, roles and contacts loaded from the organisation profile (BE-05) and an action list recorded (see `game_design.md`, Variants). Played as Harbreck's crisis, the module is training, not the board's exercise of its own plan.
- **NIS2 Art 20(2)**: training for members of management bodies, for EU entities in scope; **NIS2 IR 8.1** and **NIS2 IR 10.1** where the Implementing Regulation applies (management bodies included in awareness, and understanding their roles).
- **DORA Art 5(4)** and **DORA Art 13(6)**: management body knowledge and regular training on ICT risk, and senior management in the training scheme, for EU financial entities. The module also gives the board a view of what it is funding under **DORA Art 5(2)(g)**.
- **ISO 27001 cl. 7.2** (competence for a role with security responsibilities) and **ISO 27001 cl. 7.3**.
- **NIST AT-3** (role-based training), **NIST AT-2** (literacy training for managers and senior executives) and, through the optional "Who's behind it?" concept card, **NIST AT-2(5)** in part.
- **CIS 14.9** (role-specific training).
- **NCSC CAF B6.a** and **NCSC CAF B6.b** (executives on a training path; leaders who treat reporters positively).
- **DSPT 3.4.1**, for NHS customers.
- **UK GDPR Art 24** (the controller's responsibility, exercised by leaders).
- US customers: **NYDFS 500.4(d)(1)** (the board's understanding of cyber risk) and **HIPAA 164.308(a)(5)** (training that includes management).

The content also follows ISO 27001 cl. 5.1 and ISO 27001 A.5.24, A.5.26 and A.5.29 (incident management and security during disruption), NCSC CAF A1 and D1, UK GDPR Art 33 and Art 34, NIS2 Art 23 and the NIST CSF 2.0 Govern function (GV.RR). A facilitated session that tests the organisation's own plan can also count towards PCI DSS 12.10.2 (the incident response plan tested at least once every 12 months); that is a test of the plan, not training.

## Module flow

The module is two built things plus one new episode. The built foundation is E4 and the executive checks, played in the built episode shape:

| Stage | What happens | Scored? | Minutes |
|---|---|---|---|
| Brief and scope note | The host (Thandiwe Moyo) welcomes the learner to an openly authorised exercise; the learner takes the PA's seat at Merrin & Sallow | no | under 1 |
| Attack half | OSINT on the partners' public diaries and travel, then compose one "about to board, pay this" email in the managing partner's name from blanks filled by found facts | no | about 4 |
| Flip | The learner's own email lands in the PA's inbox with its tells named | no | 1 |
| Defend half | The PA inbox: 3 emails and 2 voicemails (3 phish, 2 genuine), Verify on, mirror pairs | yes | about 5 |
| Debrief | Per-item cards, genuine-item feedback, team-protected tally, **the habit to keep**, an "On Monday" card and the reporting route | no | about 2 |

The new **board crisis** episode (role extension, in the built shape, at Harbreck) runs the same stages with the `facilitated` flag set, so a board can play together on one screen with a pause panel between stages for the board decisions (see `game_design.md`). The executive pre and post checks bracket the episodes, sequenced by the organiser.

## Reuse from existing Break Escape content

- **Episode runner** (`public/break_escape/js/minigames/episode-runner/`) for the brief, OSINT, write, flip, defend and debrief stages, with `variant: "full"` or `"defendOnly"`, and the `facilitated: true` flag (BE-15) for the board crisis.
- **OSINT browser** and **intel facts** for the research stage (the partners' public diaries and travel are already E4's material).
- **Mail client in template mode** with the red-flag meter for the write stage; **flip view** for the flip.
- **Inbox triage** with the `voicemail` kind and the Verify verdict for the defend set; **mirror pairs** (aw5) in the defend set and the checks.
- **Debrief view** (`episode-runner/debrief-view.js`): per-item cards, genuine-item feedback, the team-protected tally, the shared rule of thumb, the "On Monday" card, the reporting-route box (`slot:customer_report_route`) and the no-blame line.
- **Concept cards** and the **voice panel** (E4 and E7 already carry one) for "voices can be faked".
- **Awareness measurement** for the executive checks; the comparison panel shows pre against post when a baseline exists.
- **The look-alike NPC guard and player avatar** (the chosen avatar always wins).
- **Rooms:** the awareness training rooms (`room_aw_merrin_sallow` for E4). The board crisis uses a new or redressed Harbreck training room, proposed with the company.

## New features needed

- **A facilitated board-crisis episode** in the runner: a new episode shell at Harbreck with `facilitated: true`, pause panels between stages that carry the board decisions (contain, clocks, ransom process, restoration) as prompts and concept cards, and a defend set of crisis-time messages (genuine crisis-group messages against impostor messages that exploit the chaos), with mirror pairs. No new minigame; the board decisions are facilitated discussion, not scored triage.
- **BE-05 Organisation profile** (partly built as the reporting-route and rule-of-thumb slots): for the facilitated own-plan version, the organisation's own regulators, insurer line, reporting routes and ransom stance shown in the debrief cards, so a board can exercise its own plan (Cyber Governance Code D2). The reporting-route platform setting waits on the user's answer (feature-level only; see `hacktivity.md`).
- **BE-03 Text route** and **BE-04 accessibility beyond the social overlays**: gaps in the build that this audience needs.
- Not pursued (would redesign beyond the build): the MG-24 crisis decision board, BE-16 time skips, and a scored decision log. The governance content is carried as facilitated pause panels and debrief cards instead. These are kept as a larger later idea in the `features/minigames.md` catalogue (build status "not built"), not a dependency of this module.

## Organisation-specific content

- The incident plan's roles: who leads, who may isolate systems on their own authority, the on-call rota, and who deputises when the chief executive can't be reached.
- How the crisis team talks when email can't be trusted (an out-of-band group or phone tree).
- The board's ransom stance, if one has been agreed, and who must be consulted before any exception.
- The insurer, its incident line, its panel firms and the policy's notification conditions.
- Regulators and clocks: the ICO, any sector regulator or NIS competent authority, client contract clauses, and law enforcement routes.
- The lifeline services to keep running or restore first, and the paper fallback for each.
- The board's regular cyber reporting: who reports, how often, and which measures (Code action E2).
- The reporting route shown in the debrief (`slot:customer_report_route`).
- For the facilitated own-plan version: the headings of the organisation's incident plan, its crisis roles and contacts, and where the exercise report and action list should go.

## Open questions

1. **Harbreck Facilities Group as a proposed brand-set company.** The board crisis needs a board-governed organisation with public-sector lifeline services (hospital and care-home cleaning rotas, school deliveries, payroll); none of the four built companies fits. *Recommendation: add Harbreck Facilities Group (`harbreck.example`), North of England, about 600 staff, to `BRAND_SET.md` with a pre-ship web search, and remap the old Larkspur cast to it. Candidate for DECISIONS_PENDING.*
2. **Should "pay" be a real option in the facilitated discussion?** *Recommendation: yes. Paying is not generally unlawful in the UK and some boards choose it. Discuss the process (advice, sanctions check, insurer told, reasons recorded, board agreement), not the verdict, and show realistic consequences without moralising.*
3. **Real organisations in the game.** *Recommendation: name the British Library, Co-op and M&S only in this README, `concepts.md` and the facilitator notes, quoting their own published words. The game uses Harbreck and fictional clients.*
4. **Evidence for individuals in a group session.** *Recommendation: the `facilitated` flag hides any per-learner score on the shared debrief; record the group's discussion outcomes, and have each participant take the executive post-check on their own device.*
5. **Keeping the law current.** UK ransomware payment rules and the Cyber Security and Resilience Bill may change within a year. *Recommendation: tag the affected concept cards and check items for review in every annual edition.*
