# role_01: Leaders and boards

**Working game title:** Crisis Room
**Pitch:** Ransomware lands at 02:13 with the chief executive on a plane, and over thirty-six compressed hours the board makes the calls only a board can make, then finds out whether its plan, its insurance and its decision log hold up.

| | |
|---|---|
| Audience | Directors (executive and non-executive), senior leaders, trustees and governors, and the people who brief them (company secretary, general counsel, heads of communications, IT and security) |
| Prerequisites | None required. core_04 (reporting incidents) and core_07 (ransomware) are useful background |
| Full module | 30 minutes, played alone |
| Facilitated session | 60 to 90 minutes with the board around one screen: the main way this module is used |
| Micro-drill | None |
| Text route | 15 minutes |
| Priority | Phase 2 |
| Build size | M, driven by the crisis decision board (MG-24, extending the existing `command-board`) and the time skips |

## Why this module

Leaders don't need to know how ransomware works. They do need to make a handful of decisions in the first hours of an attack that shape everything after it: whether to switch systems off and lose service, who to tell and when, whether to deal with criminals, what to restore first and what to say. Those decisions are hard to make well for the first time at two in the morning.

Most UK organisations haven't rehearsed them. In the government's Cyber Security Breaches Survey 2025/2026 (published 30 April 2026), 31% of businesses had a board member responsible for cyber security and 25% had a formal incident response plan. 49% had a rule or policy not to pay ransoms, and 24% didn't know whether they had one. Only 16% had heard of the Cyber Governance Code of Practice.

- **British Library, 2023.** Ransomware encrypted or destroyed much of the Library's server estate, and about 600GB of files, including personal data, were published when no ransom was paid. Its review found the most likely way in was a remote access server used by third parties that had no multi-factor authentication, and that legacy systems made recovery slow. One of its lessons: all senior officers and board members "need to have a clear and holistic understanding of cyber-risk" (*Learning lessons from the cyber-attack*, 8 March 2024).
- **Co-op and M&S, 2025.** Both told MPs (8 July 2025) about attacks that began with someone impersonating staff. Co-op had "war gamed this precise scenario as a leadership team before, so the board itself was very well prepared for who would take what role". M&S estimated a £300 million gross hit to profit, and its general counsel's advice to other boards was to "make sure that you can run your business on pen and paper".

## Target behaviours

1. **Prepares before the crisis.** Knows the incident plan and their own role in it, knows the organisation's ransom stance and what its insurance requires, and takes part in an exercise at least once a year.
2. **Decides on advice, promptly, and writes down why.** Makes the time-critical calls (isolate, notify, communicate, restore) on expert advice, owns the trade-offs, and records each decision and its reasons in the decision log.
3. **Checks before acting on urgent instructions, even from the top.** Puts every request to pay, move money or skip the plan through the agreed checks, including one that seems to come from a fellow director.

## Learning outcomes

After this module, leaders can:

- **R01-LO1** Describe the board's responsibilities for cyber risk using the five principles of the Cyber Governance Code of Practice, and say which incident decisions belong to leaders and which to the technical team.
- **R01-LO2** Ask the questions that test readiness before an incident: critical services, the plan and its last exercise, backups and restore times, supplier access, insurance terms and the ransom stance.
- **R01-LO3** Make and record time-critical incident decisions (isolation, continuity, restoration priorities) on expert advice, and own the trade-offs.
- **R01-LO4** Meet notification duties on time: the ICO's 72-hour clock for personal data breaches, sector regulators, insurers, clients and law enforcement, including a first report when the facts are incomplete.
- **R01-LO5** Weigh a ransom demand lawfully and realistically: legal and sanctions advice, no guarantee of decryption or deletion, no effect on regulatory duties or penalties, the current state of UK policy, and the value of a stance agreed in advance.
- **R01-LO6** Lead the people side of a crisis: honest and timely messages to staff, clients and the public, staff wellbeing, no blame, and verification of urgent instructions that claim to come from leaders.

## Compliance coverage

Training requirements this module contributes to (short names from `02_COMPLIANCE_MAPPING.md`):

- **Cyber Governance Code C1, C3 and C4**: directors' own training (C3), and the culture and training assurance the board leads (C1, C4).
- **Cyber Governance Code D2**: supported only when the facilitated session is run against the organisation's own incident plan, with its headings, roles and contacts loaded from the organisation profile (BE-05, HA-11) and an action list recorded (see `game_design.md`, Variants). Played as Larkspur's crisis, the module is training, not the board's exercise of its own plan.
- **NIS2 Art 20(2)**: training for members of management bodies, for EU entities in scope; **NIS2 IR 8.1** and **NIS2 IR 10.1** where the Implementing Regulation applies (management bodies included in awareness, and understanding their roles).
- **DORA Art 5(4)** and **DORA Art 13(6)**: management body knowledge and regular training on ICT risk, and senior management in the training scheme, for EU financial entities. The module also gives the board a view of what it is funding under **DORA Art 5(2)(g)**.
- **ISO 27001 cl. 7.2** (competence for a role with security responsibilities) and **ISO 27001 cl. 7.3**.
- **NIST AT-3** (role-based training), **NIST AT-2** (literacy training for managers and senior executives) and, through the optional "Who's behind it?" explainer, **NIST AT-2(5)** in part.
- **CIS 14.9** (role-specific training).
- **NCSC CAF B6.a** and **NCSC CAF B6.b** (executives on a training path; leaders who treat reporters positively).
- **DSPT 3.4.1**, for NHS customers.
- **UK GDPR Art 24** (the controller's responsibility, exercised by leaders).
- US customers: **NYDFS 500.4(d)(1)** (the board's understanding of cyber risk) and **HIPAA 164.308(a)(5)** (training that includes management).

The content also follows ISO 27001 cl. 5.1 and ISO 27001 A.5.24, A.5.26 and A.5.29 (incident management and security during disruption), NCSC CAF A1 and D1, UK GDPR Art 33 and Art 34, NIS2 Art 23 and the NIST CSF 2.0 Govern function (GV.RR). A facilitated session that tests the organisation's own plan can also count towards PCI DSS 12.10.2 (the incident response plan tested at least once every 12 months); that is a test of the plan, not training.

## Module flow

| Beat | What happens | Format | Minutes |
|---|---|---|---|
| Hook | 02:13: Ama rings the on-call director. Ransomware is spreading on the file servers, she wants to take the network offline, and the chief executive is in the air. What the player authorises, who they wake and whether they write it down is the baseline | Game (MG-04 call, MG-24 board) | 2 |
| Learn | 06:00 in the board room: Faisal's crisis primer in five short chunks: their job and ours, the clocks, write it down, the ransom facts, say what you know | NPC explainer with visual aids (EX-01, BE-08) | 4 |
| Practise | "Whose call? Which clock?": deal ten decisions to leaders, the technical team or outside bodies, then match four notifications to their clocks | Minigame (MG-24 practice mode) | 3 |
| Apply | Thirty-six hours on the crisis board: eight injects, from paper rotas for hospital sites to the insurer's questions, the ICO clock, the ransom demand, a worried client, a voice note "from Gillian", restoration and the leak deadline | Game (MG-24, BE-16) | 14 |
| Debrief | Anne-Marie asks the regulator's questions using the player's own decision log; Faisal maps each decision to the Code's principles; three weeks later | Debrief screen (BE-02) and NPCs | 4 |
| Check | Six scenario questions | Quiz (MG-20) | 2 |
| Reference | The board's crisis card and "ten questions before the next one" on The Lark, with links to the NCSC's Cyber Governance Training and Board Toolkit | Intranet (BE-09) | under 1 |

The facilitated session runs the same beats with the board as one team, discussion at seven pause points, and the knowledge check taken individually at the end (see `game_design.md`, Variants).

## Reuse from existing Break Escape content

- **Rooms:** `room_zds_conference` redressed as Larkspur's board room, with the crisis board on its `conference_screen` slot (as sis01's major incident room does in `room_hospital_meeting`); `room_security` as Ama's incident room; `room_ceo` for Gillian's empty office.
- **Minigames:**
  - `command-board` (`public/break_escape/js/minigames/command-board/`): the base for MG-24. It already takes a scenario's own title, pre-seeded entries, timeline entries that stamp themselves when globals change, status rows and typed log entries (config format in `command-board-timeline.js`).
  - `esd-pushbutton`: a guarded button that a global arms, with a confirm step. Here it is "Isolate the network" in Ama's incident room, armed when the director authorises it.
  - `backup-recovery`: option cards with restore times and trade-offs and a locked choice, for the restoration decision. sis01's config in `scenarios/sis01_healthcare/scenario.json.erb` is the model.
  - `coverage-decision-form`: radio sections and a Submit that writes globals, for the board's ransom resolution. Its "Meridian Cyber Insurance" header is hard-coded.
  - `warranty-checklist`: "compliant, arguable or breached" verdicts against policy conditions, for the insurer's questions. Its Meridian letterhead is hard-coded.
  - `ncsc-brief`: a sealed document that opens when a global is set, for the legal and sanctions advice note. Its "TLP:AMBER" bar is hard-coded.
  - `ransomware-display` (the ransom screen, seen not played), `phone-chat` (the crisis group, the attackers' message, the voice note), `person-chat` (board scenes, and video-call mode for Gillian), `notes` (the incident plan, last year's board minute, the risk register entry).
- **Patterns:**
  - A credible colleague voices a misconception and the player argues it down with evidence: sis01's Helen and "contain first, then notify" (`scenarios/sis01_healthcare/ink/npc_helen.ink:104-169`).
  - A debrief with verdicts drawn from globals and one question per section: sis01's `ink/npc_sharma.ink` (knots `isolation_review`, `regulatory`, `ransom_review`, `risk_review`).
  - Facilitator stop-points in `scenarios/sis02_energy/mission.json` and sis01's `facilitator_notes`.
  - `creditsTheme: "cyber"` for an "INCIDENT REVIEW" ending instead of the campaign's (`README_scenario_design.md`).
- **Systems:** scenario timers and `gameClock` for the injects; event mappings to bring people into the board room; objectives for the crisis aims.

## New features needed

- **MG-24 Crisis decision board** (the core; M, or L with the facilitated group vote): extends `command-board` with injects, decision cards (options, advisers' views, and whose call it is), status rows, and the optional timer left off. This module also needs: a reason prompt on every decision that writes the decision log (the board already takes typed entries); a pressure strip (press, client and staff queries); countdowns for the ICO clock and the leak deadline that move with crisis time, never real time; and a practice mode for "Whose call? Which clock?". MG-24's "Go to 06:00" must move the in-game clock forward for good, so the board's stamps and phone messages show crisis time. `systems/game-clock.js` runs on wall time with no way to set it today, which ties this to the proposed pause and time scale feature in `features/break_escape_engine.md`.
- **BE-16 Time skips** for the two flash-forwards: the reinfection scene on day three (if the fast restore was chosen) and "three weeks later", each returning to the board afterwards.
- **BE-15 Facilitated group mode** and **HA-13 Facilitated sessions**: the main way the module is used, including the facilitator's console to pause, swap or skip injects and enter the room's choice.
- **BE-05 and HA-11 Organisation profile:** the organisation's own regulators, insurer hotline, reporting routes and ransom stance on screen and on the crisis card; and, for the facilitated version, the headings, roles and contacts of the customer's own incident plan, so a board exercises its own plan (Cyber Governance Code D2).
- **BE-01**, **BE-02** (with the decision log on the debrief screen), **BE-08**, **BE-09**, **BE-19** (the board, forms and check opened from conversations with `#trigger_minigame:<minigame>|<configKey>`), **BE-20**, **MG-20**, **EX-01**.
- **MG-04 Voice calls** for the 02:13 call, the insurer and the client; `phone-chat` calls work until then.
- **Reuse fixes** listed in `features/minigames.md`, section 4: `coverage-decision-form`, `warranty-checklist` and `claims-management-system` (Meridian titles, sis03 globals and gates), `ncsc-brief` (agency labels must come from data, never presented as a real agency's document), `backup-recovery` (fixed global names, sis01's default sources), `ransomware-display` (opens only when `ransomware_deployed` is true; check the art suits the calm tone), `esd-pushbutton` (a plain office look) and the video-call bar in `person-chat-ui.js` ("Larkspur Meet").

## Organisation-specific content

- The incident plan's roles: who leads, who may isolate systems on their own authority, the on-call rota, and who deputises when the chief executive can't be reached.
- How the crisis team talks when email can't be trusted (an out-of-band group or phone tree).
- The board's ransom stance, if one has been agreed, and who must be consulted before any exception.
- The insurer, its incident line, its panel firms and the policy's notification conditions.
- Regulators and clocks: the ICO, any sector regulator or NIS competent authority, client contract clauses, and law enforcement routes.
- The lifeline services to keep running or restore first, and the paper fallback for each.
- The board's regular cyber reporting: who reports, how often, and which measures (Code action E2).
- For the facilitated version run as the board's own exercise: the headings of the organisation's incident plan, its crisis roles and contacts, and where the exercise report and action list should go.

## Open questions

1. **The player's role when playing alone.** On-call executive director, or a non-executive? *Recommendation: the on-call director, because most first-day decisions are executive. The board scenes give the non-executive view, and boards with many non-executives use the facilitated session.*
2. **Should "pay" be a real option?** *Recommendation: yes. Paying is not generally unlawful in the UK and some boards choose it. Assess the process (advice, sanctions check, insurer told, reasons recorded, board agreement), not the verdict, and show realistic consequences without moralising.*
3. **Real organisations in the game.** *Recommendation: name the British Library, Co-op and M&S only in `concepts.md` and the facilitator notes, quoting their own published words. The game uses Larkspur and fictional clients.*
4. **Evidence for individuals in a group session.** *Recommendation: record the group's decisions per session, and have each participant take the six-question check and write a one-line reflection on their own device (HA-13).*
5. **Keeping the law current.** UK ransomware payment rules and the Cyber Security and Resilience Bill may change within a year. *Recommendation: tag the affected lines and check items for review in every annual edition (BE-13, HA-19).*
