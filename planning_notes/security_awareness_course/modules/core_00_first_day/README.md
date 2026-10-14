# core_00: First day

**Working game title:** First Day
**Pitch:** Your first morning at Larkspur: get your badge, your laptop and your bearings, meet the people who keep the place safe, and learn the three words the whole course runs on: Pause. Check. Report.

| | |
|---|---|
| Audience | All staff, as the first module of the course: new starters in their first week, and existing staff the first time they take the course |
| Prerequisites | None. This is where everyone starts |
| Full module | 10 minutes |
| Micro-drill | none |
| Text route | 7 to 8 minutes |
| Priority | MVP |
| Build size | M, driven by BE-20 (the authorable tutorial, title screen and end screen) and by being the first module to use the shared cast, The Lark (BE-09) and the Report button (MG-01) |

## Why this module

Every later module assumes three things: the learner can use the game, they know the motto, and they know how to report at their own organisation. This module makes sure of all three in ten minutes, and makes the first impression: a course that respects people's time and treats them as the defence, not the problem.

The risk it addresses is silence. Staff who don't know how to report, or who think reporting will get them into trouble, keep quiet, and delay is what turns a small incident into a large one. The NCSC's Cyber Assessment Framework treats exactly this as a failing: an organisation does not achieve B6.a (a positive cyber security culture) if "people believe that reporting issues may get them into trouble" or "do not know how to raise a concern".

Attacks are common and ordinary. In the UK government's Cyber Security Breaches Survey 2025/2026, 43% of businesses and 28% of charities identified a breach or attack in the previous year; phishing was by far the most common kind (38% of businesses). Only 19% of businesses had run staff training or awareness activities in that year.

- **Marks and Spencer, 2025.** The chairman told MPs the attackers got in through "sophisticated impersonation" involving a third party; reports describe calls to IT support posing as staff to get passwords reset. M&S estimated the hit to operating profit at about £300m before insurance and other mitigation (check the company's own statement before quoting the figure).
- **British Library, 2023.** The Library's own review found the most likely way in was a compromised account belonging to a third party, on a remote access server that had no multi-factor authentication. The attackers were inside for at least three days before anyone knew.

Neither started with clever technology. Both started with a person, a password or a phone call, which is why this course starts with people.

## Target behaviours

1. **Reports** anything suspicious through the organisation's route straight away, even when unsure, and including their own mistakes.
2. **Pauses and checks** an unexpected request through a channel they already trust (a colleague, the directory, the intranet) before acting on it.

## Learning outcomes

After this module, staff can:

- **C00-LO1** Use the tools the course relies on (moving and talking in the game, the inventory, the phone, the inbox's Report button and The Lark), and choose the route and settings that suit them.
- **C00-LO2** Explain in a sentence or two why criminals would want what they have access to, and how most attacks begin (a message, a call or a stolen password).
- **C00-LO3** Apply *Pause. Check. Report.* to an unexpected request: stop, check through a channel they already trust, and report.
- **C00-LO4** Report a suspicious message through the organisation's route, including when unsure, and find the reporting contacts again on the intranet.
- **C00-LO5** Describe what the security team does with a report, and why reporting a mistake quickly is welcomed rather than punished.

## Compliance coverage

Contributes to (short references from `02_COMPLIANCE_MAPPING.md`):

- **ISO 27001 cl. 7.3** (aware of the policy, their own contribution and the consequences of not following it) and **ISO 27001 A.6.3**.
- **NIST AT-2** (literacy training on joining, including what users do when they suspect an incident).
- **CIS 14.1** (training at hire) and **CIS 14.6** (recognising and reporting incidents).
- **PCI DSS 12.6.1** (a programme that makes everyone aware of the policy and their role). The Induction Essentials pathway, which starts here, is how the course meets the "on hire" part of **PCI DSS 12.6.3**.
- **NCSC CAF B6.a** (people know how to raise a concern; people who report are treated positively) and **NCSC CAF B6.b**.
- **NIS2 Art 21(2)(g)** and **NIS2 IR 8.1** (the programme covers new staff and contact points); **DORA Art 13(6)** and **DORA RTS Art 19** (staff know the channels for reporting), for EU customers.
- **ICO training toolkit** (induction for all staff before they access personal information and within one month of starting; an assessment at the end). core_00 opens the pathway; core_05 carries the data protection content.
- **DSPT 2.1.1** and **DSPT 3.2.1** (categories 3 and 4), with the rest of the induction pathway.
- **FTC 314.4(e)** and **SOC 2 CC2.2** (how to report failures, incidents and concerns), for US customers.

## Module flow

| Beat | What happens | Format | Minutes |
|---|---|---|---|
| Hook | 08:52 at reception. While Maureen finishes a call, a message request pops up on the player's own phone from "Lena Fischer, Operations Manager": their new manager, whom they've never met, asking for their personal mobile and email "for the team group". What they do before Maureen looks up is the baseline | Game (`phone-chat`, `person-chat`) | 1 |
| Learn (on the move) | Maureen prints the badge (one line on badge rules). Precious walks the player to the security office, and the controls tutorial happens inside the walk | Game tutorial (BE-20) | 2 |
| Learn | Ama: why it matters, in a minute; the motto; how to report here; no blame, and the phish she once fell for. Kai: what happens to a report. One check question | NPC explainer (EX-01, BE-08) | 2 |
| Practise | Owain at the service desk: the laptop; the Report button tried on a harmless test email; a three-random-words passphrase in the password manager; the first MFA prompt, and one to refuse; the settings | Game (MG-01, MG-08 and MG-07, light) | 1.5 |
| Apply | At the desk next to Leo: three welcome emails, one of them a fake "confirm your bank details for payroll" | Game (MG-01) | 1.5 |
| Debrief | Kai's thank-you and what the report did; one screen, "Your first morning" | Debrief screen (BE-02) and chat | 0.5 |
| Check | Ama's welcome quiz: five quick questions on the motto, the route and no blame | Quiz (MG-20) | 1 |
| Reference | The Lark: the reference card with the organisation's own routes, who's who, and the learner's course map | Intranet (BE-09) | 0.5 |

## Reuse from existing Break Escape content

- **Rooms:** `room_reception` (reception and the badge gate), `room_office` (the Operations floor and the player's desk), `room_break` (the kitchen and the motto poster), `room_security` (Ama and Kai), `room_IT` (Owain's service desk). No new rooms.
- **Conversation backgrounds:** m01's office set (main office, reception, break room, IT room) suits a generic office until Larkspur's own are made (`room-pov-background` skill).
- **Conversations:** `person-chat` for Maureen, Precious, Ama, Kai, Owain and Leo; `phone-chat` for the fake "Lena" message request and the team chat, using phone NPC `timedMessages` for arrivals.
- **Systems:** `systems/tutorial-manager.js` is the starting point for BE-20 (it already drops its combat step when `disableAttacks` is true); the title screen in `minigames/title-screen/`; objectives and tasks (`systems/objectives-manager.js`) for the morning's list; `gameClock` for the 08:52 start; event mappings with `patrolOverride` and barks so Precious can lead the way (`README_scenario_design.md`, NPC Event Mappings); keycard doors for the badge gate (`scenarios/RFID_SCENARIO_PATTERNS.md`); `validSprites` and the player preferences modal (`app/views/break_escape/player_preferences/_modal.html.erb`) for the name and avatar.
- **Documents:** `notes` for The Lark's pages, and a `lab-workstation` object (`utils/lab-workstation.js`) as the cheap first version of The Lark, until BE-09.
- **Patterns:** the instructor topic hub (`scenarios/lab_intro_linux/ink/instructor.ink`) reshaped into the short EX-01 form; m01's in-ink quiz (`scenarios/m01_first_contact/ink/m01_npc_kevin.ink`) as the fallback for the check before MG-20 exists.
- **Props:** ID badges, keycards, notice board and posters, desks, PCs and phones from `assets/objects/`.

## New features needed

- **BE-20 Authorable tutorial, title screen and end screen** (the dependency that sets this module's date): the course's own title screen with the customer's logo in place of today's Hacktivity logo and terminal-style typing; tutorial steps written into the scenario and tied to the story (walk to the desk, talk to Maureen, open the inventory to see the badge, read a text, open the task list, use The Lark) in place of the fixed "Welcome to Hacktivity Games!" steps; and an end screen that shows the course map.
- **BE-09 Intranet terminal:** The Lark's home page, reference card, contacts, who's who and course map; the knowledge check opens here.
- **BE-05 Organisation profile in game:** the organisation's name and logo on the badge and The Lark, the Report button's name, the reporting contacts and the real payroll process, all on screen.
- **MG-01 Inbox** (minimal use): three messages, the Report button, and a pre-filled form behind the fake payroll link.
- **MG-07 and MG-08** (light previews of core_03): one MFA prompt to approve with number matching, one to refuse; a passphrase built from word tiles.
- **MG-20 Knowledge check:** Ama's check question and the five-item quiz.
- **BE-01 and BE-02:** the record and the debrief.
- **BE-19:** Ama's check question inside her conversation, and the inbox opening at the desk.
- **EX-01, EX-04 and BE-08:** Ama's chunks with visual aids; the motto poster and The Lark's pages.
- **BE-03 and BE-04:** the text route and the settings, both offered in the first minute, because this is where every learner starts.
- **HA-03 and HA-17:** the course map shows the learner's own assigned modules and due dates.
- **proposed:** Workplace avatar set, a diverse set of office-appropriate player avatars (age, ethnicity, disability, religious dress) for the course's `validSprites`; today's 14 choices include hooded hackers and a spy.
- **proposed:** NPC guide behaviour, an NPC who walks ahead to the next waypoint and waits until the player is close; Precious's tour can be built from event mappings without it, but it would be tidier and reusable (core_10's floor walk).

## Organisation-specific content

- Organisation name and logo (title screen, badge, The Lark).
- The Report button's name and where it is, on desktop and mobile.
- The security team's contact, the service desk's number and the out-of-hours route.
- How to report a suspicious text or call about work.
- The DPO's contact.
- How bank details and payroll changes are really made (shown in the debrief of the fake payroll email).
- The badge rule, in one line.
- The intranet's name.
- The learner's assigned modules and due dates (from HA-03).
- What the organisation can see in training records (HA-05, HA-15), shown on The Lark's "About your training record" page.
- Optional: a welcome message from the chief executive, on screen, saying nobody at the organisation will ever message staff for favours, codes, gift cards or personal details.

## Open questions

1. **A scam in the first minute.** Is a fake "new manager" message on the learner's own phone too sharp a start? *Recommendation: keep it. It is a pattern new starters really meet, it is caught by Maureen with warmth, and nobody is marked down for it. Give organisations a setting to move it to later in the morning. (The seed's direction, a chief executive asking a favour on a new number, is core_02's Apply scene, so core_00 uses the manager-impersonation variant instead.)*
2. **Where the name comes from.** *Recommendation: the player sets name and avatar in the existing preferences modal before the title screen; the name appears on the printed badge and in on-screen text, never in a voiced line.*
3. **Existing staff.** Should staff who have worked there for years get a different opening? *Recommendation: yes, one ink branch on an organisation-set cohort flag: "Morning! New badge day" instead of "first day", and Owain swaps the laptop handover for a security check-up. Same assessment.*
4. **The real chief executive.** Should Gillian post a welcome saying nobody will ever message staff for favours, codes or personal details? *Recommendation: yes, as a team chat message on screen, which the organisation can replace with its own leader's words (NCSC culture principles: leaders model the behaviour).*
5. **Order.** Should core_00 be required before other modules? *Recommendation: assign it first (HA-03) but don't lock other modules behind it; every module explains its own controls in one line.*
