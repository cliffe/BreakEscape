# role_05: People managers and HR

**Working game title:** Joiners, Movers, Leavers
**Pitch:** A week as a team leader: a new starter, a move to Finance, a retirement, a remote hire that doesn't add up and a frightened colleague at 17:50, where every small decision about access, and every reaction to a mistake, decides how safe the team is.

| | |
|---|---|
| Audience | Line managers, team leaders and HR staff |
| Prerequisites | core_00; core_01 and core_04 recommended (the phishing and reporting basics a manager gets asked about) |
| Full module | 25 minutes |
| Micro-drill | none |
| Text route | 15 minutes |
| Priority | Phase 3 |
| Build size | M, driven by the access review (MG-18, built from the existing `warranty-checklist`) and the candidate file (MG-25) |

## Why this module

Managers decide who gets access and when it goes, and they decide whether people feel safe to admit a mistake. IT can only act on what managers and HR tell it, so accounts, keys and codes outlive the job when nobody says the job has ended. The NCSC's identity and access management guidance recommends a "joiners, movers and leavers" policy "so access can be revoked when no longer needed", and regular reviews for unnecessary privileges.

Recruitment has become a way in as well. In September 2024 the UK's Office of Financial Sanctions Implementation (OFSI) warned that it is "almost certain" UK firms are being targeted by North Korean IT workers posing as remote freelancers under false identities. In the US, the FBI warned in 2022 that applicants for remote IT jobs were using deepfakes and stolen personal details in interviews.

- **KnowBe4, July 2024.** A security company hired a remote software engineer who had passed four video interviews and a background check using a stolen US identity and an AI-altered photo. Malware began loading on the company laptop as soon as it arrived; the company's monitoring flagged it and the laptop was contained within half an hour of the first alert (KnowBe4, 23 July 2024).
- **Leaseline Vehicle Management, September 2024.** A sales consultant took more than 3,600 pieces of customer information shortly before resigning and offered them to competitors. He was fined under section 170 of the Data Protection Act 2018 after the company reported him (ICO, 17 September 2024).

## Target behaviours

1. **Gives the least access** a role needs, and makes sure movers and leavers lose access, devices, keys and codes on the day.
2. **Says "thank you" and acts** when someone reports a mistake: gets it reported at once, supports them, never blames.
3. **Insists on the same checks for every new hire**, and raises concerns about candidates or colleagues through HR and security rather than handling them alone.

## Learning outcomes

After this module, managers and HR staff can:

- **R05-LO1** Request the least access a new starter's role needs, with an end date for temporary staff, instead of copying someone else's access.
- **R05-LO2** Make sure a mover's old access, and a leaver's accounts, devices, keys, codes and data, are dealt with on the day they move or leave.
- **R05-LO3** Review their team's access, remove what is no longer needed, and ask the system owner when unsure.
- **R05-LO4** Recognise the signs of recruitment fraud (borrowed identities, proxies, altered video) and apply the standard identity and right to work checks fairly to every candidate.
- **R05-LO5** Respond to a team member who reports a mistake by thanking them, getting it reported at once and supporting them, and set the team's culture by making time for training.
- **R05-LO6** Handle HR and health information on a need-to-know basis, and raise a concern about a colleague through HR and security instead of investigating it themselves.

## Compliance coverage

Contributes to (references in `02_COMPLIANCE_MAPPING.md`):

- **NCSC CAF B6.a**: a positive culture in which people who report are treated positively. Managers are where that culture is made or lost. For NHS customers, **DSPT B6.a**.
- **ISO 27001 cl. 7.2** and **ISO 27001 A.6.3**: competence and training relevant to the manager's and HR job.
- **NIST AT-3** (role-based training) and **NIST AT-2(2)** (recognising and reporting possible insider threat, through the fair concern beat).
- **CIS 14.9** (role-specific awareness and skills training; IG2 and IG3).
- **NIS2 IR 10.1, IR 10.2** (human resources security: role assignments reviewed, background checks), for entities the Implementing Regulation covers; **NIS2 Art 21(2)(g)** for the rest.
- **DORA RTS Art 19** (the human resources policy: staff know the security policies and the channels for reporting), for EU financial customers.
- **UK GDPR Art 5(1)(f)** and **UK GDPR Art 32(4)** through the HR data beats; the **ICO training toolkit** (specialised training for roles with key data protection duties, which includes HR).
- **CMMC AT.L2-3.2.3** (insider threat awareness), for US defence customers.

The module also supports the organisation's own access, screening and leaver controls. Those are controls, not training requirements, so the compliance mapping doesn't list them (see Open questions).

## Module flow

| Beat | What happens | Format | Minutes |
|---|---|---|---|
| Hook | Monday 08:40. Owain's ticket for the new starter offers "copy access from Des Harker" in one click. The player's choice is the baseline | Game (MG-18 request mode) | 1 to 2 |
| Learn | Ama and Mei Lin: access follows the job; day one, move day and last day; hiring checks; what to say when someone owns up | NPC explainer with visual aids (EX-01, BE-08) | 4 |
| Practise | "Access or Excess?": eight quick requests, then three "What do you say?" cards | Minigame drill (MG-18 practice mode, MG-20 items) | 3 to 4 |
| Apply | The rest of the week: training time, a remote candidate, Leo's move to Finance, the access review, Farida at 17:50, a temp who needs "the same as Des", Des's last day | Game (BE-18 week planner, MG-18, MG-25, BE-16) | 11 to 12 |
| Debrief | The team's access on Monday and on Friday, each decision and where it led, and the team pulse | Debrief screen (BE-02), Ama and Mei Lin | 2 |
| Check | Six scenario questions | Quiz (MG-20) | 2 |
| Reference | The manager's card: joiners, movers, leavers, reviews, hiring checks, "thanks for telling me" | Intranet (BE-09) | under 1 |

## Reuse from existing Break Escape content

- **Rooms:** `room_office` (the Operations floor), `small_office_room1_1x1gu` (the player's office), `small_office_room3_1x1gu` (Mei Lin's HR office), `room_IT` (Owain's service desk), `room_break` (Des's leaving do), `room_meeting` (the in-person identity check).
- **Conversations:** `person-chat` for Ama, Mei Lin, Owain, Leo, Farida, Marta and Des; `person-chat` video-call mode (`person-chat-ui.js`) for the remote interview; `phone-chat` for Lena, Hassan, the recruitment agency and the team chat.
- **Minigames:** `warranty-checklist` (sis03: rows with three verdict buttons, a gated submit and saved state; `public/break_escape/js/minigames/warranty-checklist/`) as the base for MG-18; `forensic-data-platform` (tabs, tables, a confirm step) as the candidate file until MG-25 exists; `alarm-panel` (lamps bound to globals, with a configurable `panelTitle` and `footer`) reskinned as the team pulse board; `container` for Des's desk drawer; `notes` for the leaver checklist and the access policy.
- **Patterns:** the debrief as a conversation gated on globals (`scenarios/sis01_healthcare/ink/npc_sharma.ink`); timed messages for the week's interruptions; event-triggered conversations for Farida's knock at the door; m05 Insider Trading's recruiter material for ideas only (core_14 owns insider recruitment).
- **Systems:** the game clock (`gameClock`) across a compressed week; objectives and tasks for the week planner; the facilitator stop-points in `scenarios/sis02_energy/mission.json` as the model for the workshop version.

## New features needed

- **MG-18 Access review:** built from `warranty-checklist`, with a configurable title and letterhead (today "Meridian Cyber Insurance" and its globals are hard-coded), verdict labels (Keep, Reduce, Remove, Ask the owner), an expected verdict per row for BE-01, and a **request mode** for joiners and movers (pick from a role template or copy a user; set an end date).
- **MG-25 Document inspector:** the candidate's CV, ID scan, right to work result and references, compared with each other.
- **MG-20 Knowledge check**, **BE-01 Assessed decisions** and **BE-02 Debrief screen**.
- **BE-18 Work task and interruptions:** the Monday to Friday planner, with the clock jumping between scenes.
- **BE-16 Time skips:** the "three months later" consequences.
- **BE-19:** MG-18 opening from Owain's ticket; Ama's check question and the "What do you say?" cards, opened from conversation with `#trigger_minigame:knowledge_check|<configKey>`.
- **MG-27 Work desktop:** the player's computer as one launcher for Owain's tickets, MG-18, the team chat and The Lark.
- **BE-08 Visual aids:** the two access lists side by side, the access lifecycle diagram, the hiring red flags card, the "thank, act, support, learn" card.
- **BE-09 Intranet** and **BE-05 Organisation profile:** the manager's card with the customer's own leaver process, screening policy and reporting routes.
- **proposed:** Video call connection effects (freeze, blur and audio lag) in `person-chat` video-call mode, set by ink tags, plus a configurable label for the call bar (today "SECURE VIDEO LINK" is hard-coded). These are ordinary call-quality dressing that can appear for any caller, not a deepfake tell (core_15 teaches that fakes don't reliably glitch); the candidate is caught by the identity and process checks, never by the video. Likely shared with core_15.
- **MG-04 Voice calls** (P2) for ringing a referee on an independently found number; a `phone-chat` conversation works until then.

## Organisation-specific content

- The joiner, mover and leaver process: who raises each request, in which system, and the deadline for disabling a leaver's accounts.
- Who collects devices, badges and keys, and who changes shared codes.
- How often access is reviewed, and who signs it off.
- The pre-employment screening policy (identity, right to work, references, criminal record checks where the role needs them) and the rules for agencies, freelancers and contractors.
- The organisation's statement on security mistakes, and how it fits the disciplinary policy.
- Where HR and health information is kept, and who can see it.
- Routes: the security team, HR, the DPO and the whistleblowing line.

## Open questions

1. **Micro-drill.** The catalogue gives role_05 none. *Recommendation: none at launch; "Access or Excess?" could become a quarterly drill timed with access reviews later (BE-07).*
2. **How specific to be about recruitment fraud.** The official advisories are about North Korean IT workers. *Recommendation: name them in `concepts.md` and on the reference card, but keep the game's fraudster an unnamed, faceless network, so no candidate's nationality, accent or appearance becomes the clue. The clues are inconsistencies and refusals.*
3. **Control references.** The module supports access, screening and leaver controls (for example ISO/IEC 27001's controls on access rights, screening and responsibilities after employment). *Recommendation: add short references for them to `02_COMPLIANCE_MAPPING.md` only if customers ask; they aren't training requirements.*
4. **An HR-only route.** HR teams may want recruitment and leavers without the team-manager scenes. *Recommendation: an organisation setting that swaps the team huddle and Farida's scene for an HR case queue, keeping the same assessed behaviours.*
