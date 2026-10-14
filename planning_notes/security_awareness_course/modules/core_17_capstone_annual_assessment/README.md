# core_17: Capstone: the annual assessment

**Working game title:** Year End
**Pitch:** One busy last day before the year-end close, with the year's threats arriving inside real work and a new starter shadowing you, then a private profile that shows what has become habit and what to practise next. A new edition every year.

| | |
|---|---|
| Audience | All staff, every 12 months (the annual refresher pathway) |
| Prerequisites | core_00. Ideally the Induction Essentials pathway. Anyone who hasn't taken the module behind one of the day's threats is still assessed fairly on the motto-level habit, and their profile marks that area "new to you" |
| Full module | 35 minutes, in one sitting or two (a lunchtime checkpoint, BE-12) |
| Micro-drill | none (its warm-up draws on the other modules' drills) |
| Text route | 20 to 25 minutes |
| Priority | Phase 2 |
| Build size | L: a full working day across five rooms, twelve threat slots with chains between them, a timeline debrief and year profile, a team event, and a new edition every year (BE-13) |

## Why this module

Several frameworks require security awareness training every year (PCI DSS 12.6.3, CIS 14.1, NYDFS 500.14(a)(3), DSPT 3.2.1), and others expect it to be "refreshed at suitable intervals" and evaluated for its effect (NCSC CAF B6.b; the ICO training toolkit's refresher training). PCI DSS 12.6.2 also expects the programme to be reviewed every year and updated for new threats.

A once-a-year course on its own, though, changes little. In an eight-month randomised study of more than 19,500 staff at a US healthcare organisation, Ho and others (2025) found no significant relationship between whether people had recently completed annual awareness training and whether they fell for a simulated phish. In a German field study, people's improved ability to spot phishing still held at four months but had gone by six (Reinheimer and others, 2020). So this module is built to do three things a yearly lecture can't:

1. **Assess habits, not recall,** by putting a year's worth of threats into one realistic day, unannounced, and watching what the learner does (stealth assessment).
2. **Refresh what changed this year,** in three minutes, from that year's threat picture.
3. **Point each learner at the practice they need** for the year ahead (spotlight modules and monthly drills), privately.

Real attacks rarely rely on one trick. They chain small moments across channels, and the chain breaks at the first person who pauses and reports.

- **Retool, 2023.** Staff were sent text messages pointing to a fake sign-in page; an attacker then rang one of them, using a deepfaked voice of a colleague in IT, and obtained an MFA code. The attacker went on to take over the accounts of 27 of the company's cloud customers.
- **Marks and Spencer, 2025.** The chairman told MPs the attackers got in through "sophisticated impersonation" involving a third party; months of disruption followed, with an estimated £300m hit to operating profit before mitigation (see core_00's concepts for sources).

## Target behaviours

1. **Uses Pause. Check. Report.** whenever a threat arrives in the middle of busy work, on any channel.
2. **Breaks the chain early:** reports the first odd thing (a prompt, a call, a message) rather than waiting to see what happens next.
3. **Helps colleagues** do the same, by explaining the habit without blame.

## Learning outcomes

After this module, staff can:

- **C17-LO1** Apply *Pause. Check. Report.* to threats arriving unannounced by email, phone, chat, in person and on screen, during a day of ordinary work.
- **C17-LO2** Recognise when an event may be one step in a chain (an unexpected prompt, a call, a change request) and break the chain by reporting it at once.
- **C17-LO3** Keep to the organisation's procedures for money, personal data, access and the building under time pressure and in the face of senior names.
- **C17-LO4** Report their own slip promptly with the key facts (what, when, what they did), and pass other people's requests to the person who should handle them.
- **C17-LO5** Explain a security habit to a newer colleague in a sentence, without blame.

Every assessed moment also re-tests specific outcomes from the core modules (for example C03-LO5 for an unexpected MFA prompt). `assessment.md` maps each one; the year profile is built from that mapping.

## Compliance coverage

Contributes to (short references from `02_COMPLIANCE_MAPPING.md`):

- **PCI DSS 12.6.3** (training at least every 12 months; with HA-07, the annual acknowledgement offered at the end of the day) and **PCI DSS 12.6.3.1** (phishing and social engineering, re-tested in context). The edition's release notes are evidence for **PCI DSS 12.6.2** (the programme reviewed every year and updated for new threats).
- **ISO 27001 cl. 7.2** (competence evaluated and documented), **ISO 27001 cl. 7.3** and **ISO 27001 A.6.3** ("regular updates").
- **NIST AT-2** (periodic literacy training), **NIST AT-2(1)** (practical exercises that simulate events) and, through each edition's threats, **NIST AT-2(6)** (the current threat environment).
- **CIS 14.1** (at least annually, with content reviewed every year).
- **NCSC CAF B6.b** (each individual's training tracked and refreshed at suitable intervals; activities evaluated for effect, not just reach).
- **DSPT 3.2.1** (categories 3 and 4: training in the last twelve months).
- **NIS2 Art 21(2)(g)** and **NIS2 IR 8.1** (a programme repeated over time and tested for effectiveness); **DORA Art 13(6)**, for EU customers.
- **ICO training toolkit** (refresher training at appropriate intervals, with an assessment and a pass mark).
- **Cyber Governance Code C4** (supports, through the results the board receives).
- **AI Act Art 4**, in editions that include AI tools and deepfakes, for EU customers.
- **NYDFS 500.14(a)(3)** (at least annual, including social engineering), **CMMC AT.L3-3.2.1e** and **CMMC AT.L3-3.2.2e**, for US customers.

## Module flow

| Beat | What happens | Format | Minutes |
|---|---|---|---|
| Hook | 08:58, the player's desk, the last working day before the year-end close. The laptop is still starting up when the phone asks them to approve a sign-in they didn't start. What they do is this year's baseline | Game (MG-07) | 1 |
| Learn | Ama's year-end huddle in the meeting room: three things that changed this year, the organisation's own year in numbers (on screen), and the motto | NPC explainer (EX-01, BE-08) | 3 |
| Practise | Kai's warm-up on the meeting room screen: five quick items, drawn from the learner's weakest areas last year and this year's new threats, with instant feedback | Minigame (MG-20 drill, BE-07 items) | 2 |
| Apply | The day, with Ellie, a new apprentice, shadowing: finish the council report, cover reception for twenty minutes, approve the cost centre's invoices before the 14:00 cut-off, hand over to Leo, clear the desk and leave. Twelve threats arrive inside the work, and consequences chain from one task to the next. A checkpoint at lunch | Game (BE-18, most MGs) | 20 |
| Debrief | "Your Year End": the day as a timeline with its chains, Jo Fairweather's reveal of her authorised test, the private year profile and up to two spotlights; then "Tuesday", after the long weekend | Debrief screen (BE-02), Ama, Kai, Jo; one time skip (BE-16) | 4 |
| Check | Ten scenario questions across the year's topics, with feedback at the end | Quiz (MG-20) | 4 |
| Reference | The Lark: the Year End card (the whole course on one page), the annual policy re-acknowledgement where due, and the learner's profile in the learner home | Intranet (BE-09, HA-07, HA-17) | 1 |

## Reuse from existing Break Escape content

- **Rooms:** `room_office` (the Operations floor and the player's desk), `room_reception` (the twenty-minute cover), `room_meeting` (Ama's huddle and Kai's warm-up on the wall screen), `room_break` (the kitchen, decorated for the year-end party), `room_security` (the debrief). The car park and smoking shelter (a new room planned for core_10 and core_13) is used for one moment if it exists; otherwise that moment happens at the reception door.
- **Conversations:** `person-chat` for the cast and the walk-in visitor; `phone-chat` for the team chat, the "printer company" and the voice note; `voice.fx` phone filtering for callers (`README_scenario_design.md`, "Voice FX").
- **The day's timeline:** `command-board` (`minigames/command-board/`, used in sis01 and m07) already stamps timeline entries as globals change, against the game clock. It is the base for Kai's live report board during the day and for the debrief's timeline (the chain view proposed below).
- **Other minigames:** `examine` (the courier's USB stick, the badge in the car park); `container` (the desk at the end of the day: the printer tray and the desk drawer); `notes` (the visitor list and the supplier record); `forensic-data-platform` (the invoice, the letter and the supplier record in tabs with a gated "hold and report" button, as core_11 uses it until MG-15 exists).
- **Systems:** `gameClock` and scenario timers for the day; objectives and tasks for the task list (BE-18 builds the work task bar on them); event mappings for the chains; conditional credits as a fallback debrief (sis01's pattern).
- **Patterns:** sis02's facilitator stop-points (`scenarios/sis02_energy/mission.json`, `facilitator_notes`) for the team event's pause points; sis01's debrief conversation that revisits each decision from the globals (`scenarios/sis01_healthcare/ink/npc_sharma.ink`).
- **Content:** the core modules' banks (BE-13) supply most of each edition's variants, and the core modules' check banks supply six of the ten check items.

## New features needed

- **BE-13 Content banks and randomisation:** editions (`mission.json` `edition`), slot recipes for twelve threats, a personal slot per learner, and organisation weighting.
- **BE-18 Work task and interruptions:** five tasks in one day, with the busy gate so two threats never collide.
- **BE-01 and BE-02:** the record and the debrief; **BE-12:** the lunchtime checkpoint; **BE-16:** the single "Tuesday" scene; **BE-17** (optional): two or three callbacks to the learner's earlier modules.
- **BE-15 and HA-13:** the team event (below), with group decisions and individual checks.
- **Minigames:** MG-01 (inbox), MG-04 (calls), MG-05 (messages and the voice note), MG-07 (MFA prompts), MG-15 or MG-25 (the invoice and letter), MG-20 (the warm-up and the ten-item check, feedback at the end) and MG-24 (the team event's "Tuesday huddle").
- **HA-03:** the annual recurrence, organisation spotlight slots in the refresher path, and private practice for personal spotlights; **HA-07:** the annual re-acknowledgement; **HA-09:** profiles in aggregate only; **HA-19:** editions as major versions with release notes; **HA-17:** the profile's home.
- **proposed:** Year profile, a private per-learner view of the year across modules (ratings by area from the capstone, with last year's beside them, and the modules and drills taken), in the learner home (HA-17), aggregate only for the organisation (HA-09).
- **proposed:** Spotlight recommender, the rules that turn a year profile into up to two private recommendations (HA-03's practice trigger) and that offer organisation-wide spotlights from aggregate results.
- **proposed:** Chain view in the debrief, a BE-02 timeline of the day that links related moments and marks where a report broke a chain, built on `command-board`.
- **proposed:** Event leaderboard, a facilitator console view for HA-13 that ranks teams, never people, across tables in a live event, by reports made, chains broken and game time to report.

## Organisation-specific content

- The year's own numbers for Ama's huddle, on screen only (reports made, median time to first report), from HA-12 or entered by the security team; optional.
- "What changed here this year": up to three lines (a new tool, a policy change, a new reporting route).
- The organisation's spotlight choices and whether personal spotlights are only recommended (the default) or count towards completion.
- Policies due for annual re-acknowledgement (HA-07).
- The usual contacts and procedures from the other modules (BE-05): reporting routes, the payment change procedure, the visitor procedure, the DPO, how to request delegated mailbox access.
- The team event's date, prize and facilitator, if the organisation runs one.

## Open questions

1. **Who sees the year profile?** *Recommendation: the learner only, by name; the organisation sees areas in aggregate above the HA-09 threshold, and completion, the check and critical behaviours as for any module (`features/assessment_and_evidence.md`, section 11). Never used for discipline.*
2. **Personal spotlights: recommended or required?** *Recommendation: recommended and private (HA-03's practice trigger, never overdue). Organisations that want a requirement choose organisation-wide spotlights instead, which are visible and the same for a whole group.*
3. **The seed's "approve a payment as second approver".** *Recommendation: change it to approving your own cost centre's invoices, because second approval of payments is a Finance job (role_02) and core_11 teaches staff to pass bank detail changes to Finance without vouching for them.*
4. **Jo's authorised test inside the game.** Is it fair to reveal that some of the day's threats were an authorised test? *Recommendation: yes; it mirrors real practice, the reveal is warm, and nothing about it is rated differently.*
5. **Edition timing.** *Recommendation: release each edition in September, so organisations that hold their annual event in October (European Cybersecurity Month) get the new one; everyone else meets it at their own renewal date.*
6. **The first edition's year.** *Recommendation: "Year End 2027", the first year the core library is complete.*
