# core_16: Acceptable use and your responsibilities

**Working game title:** Small Print
**Pitch:** A lunchtime game show where colleagues buzz in on everyday "can I?" questions, answered from your organisation's own rules, before you read and sign the real policy knowing what it says and why.

| | |
|---|---|
| Audience | All staff |
| Prerequisites | core_00 recommended (introduces the cast, The Lark and the reporting route) |
| Full module | 10 minutes |
| Micro-drill | none |
| Text route | 7 to 8 minutes |
| Priority | MVP |
| Build size | S. The game show is a presentation mode of the knowledge check (MG-20); the real work is the organisation's answer key (HA-11) and the recorded acknowledgement (BE-09, HA-07) |

## Why this module

Most organisations ask staff to sign an acceptable use policy on their first day, and most staff sign it without reading it. That protects nobody: the rules don't change behaviour, and a signature on an unread document is weak evidence when an auditor asks staff what the policy says. ISO 27001 cl. 7.3 expects everyone to be aware of the policy and what follows if they don't follow it, and PCI DSS 12.6.3 expects staff to acknowledge, at least every 12 months, that they have read and understood it.

Most rule-breaking is well-meaning. People reach for a convenient app, a personal account or a shortcut because the right way is unclear, slow or unknown to them. The NCSC's cyber security culture principles ask for rules that are easy to understand and developed with input from across the business; this module does the learner's half of that: what the rules are, why they exist, and who to ask.

- **NHS Lanarkshire, 2023.** The ICO reprimanded the health board after 26 staff shared patient data more than 500 times in a WhatsApp group that had not been approved for it. The ICO found the board had no policies, guidance or processes in place when WhatsApp was made available.
- **RAC, 2023.** A customer solutions specialist was fined £5,000 after pleading guilty to two offences under section 170 of the Data Protection Act 2018, for taking accident victims' details and passing them on. He was the only employee who had accessed all 21 cases that customers complained about.

Rules work both ways. The same law that stops staff misusing data limits what employers may do: in 2024 the ICO ordered Serco Leisure to stop using face and fingerprint scans to monitor staff attendance, because it wasn't necessary or proportionate. Knowing where the lines are protects everyone.

## Target behaviours

1. **Asks first** (the service desk, the security team, the DPO or their manager) when unsure whether something is allowed, rather than guessing or working round the rules.
2. **Uses work systems within the organisation's rules:** approved software, devices and storage; work accounts for work; never sharing logins, codes or badges; looking only at the data their job needs.

## Learning outcomes

After this module, staff can:

- **C16-LO1** Say what the acceptable use policy covers, and find it and the other policies they're asked to follow on the intranet.
- **C16-LO2** Decide whether everyday actions are allowed, not allowed or need asking first under the organisation's policy, and give the reason.
- **C16-LO3** Choose the right person to ask for different kinds of question.
- **C16-LO4** Describe what the organisation monitors on work systems, why, and the limits that protect staff.
- **C16-LO5** State their own security responsibilities, and the difference between an honest mistake reported quickly and deliberate misuse.
- **C16-LO6** Acknowledge the organisation's policies after reading the summary, asking about anything unclear first.

## Compliance coverage

Contributes to (short references from `02_COMPLIANCE_MAPPING.md`):

- **PCI DSS 12.6.3.2** (training covers acceptable use of end-user technologies, in line with the organisation's own policies): **meets** it when the organisation's acceptable use policy is loaded through HA-07 and its answer key is set (HA-11).
- **PCI DSS 12.6.3** (the acknowledgement, at least every 12 months, that the policy and procedures have been read and understood), with HA-07 re-requesting it each year; and **PCI DSS 12.6.1**.
- **ISO 27001 cl. 7.3** (aware of the policy, their contribution and the consequences of not following it) and **ISO 27001 A.6.3**.
- **UK GDPR Art 24** and **UK GDPR Art 32(4)** (people with access to personal data use it only on the organisation's instructions); the **ICO training toolkit** (induction).
- **NCSC CAF B6.b**; **NIST AT-2**; **CIS 14.1**.
- **NIS2 Art 21(2)(g)** and **NIS2 IR 10.1** (everyone understands and follows the cyber hygiene rules); **DORA RTS Art 19** (staff know and follow the ICT security policies), for EU customers.
- **DSPT 2.1.1** and **DSPT 3.2.1** (categories 3 and 4), with the rest of the induction pathway.
- **CMMC AT.L2-3.2.1** (aware of the policies and procedures that apply), **FTC 314.4(e)** and **SOC 2 CC2.2**, for US customers.

Not yet in the mapping, and requested in the writer's report: ISO 27001 A.5.10 (rules for acceptable use) and NIST PL-4 (rules of behaviour, with a documented acknowledgement before access and again when the rules change) also fit this module.

## Module flow

| Beat | What happens | Format | Minutes |
|---|---|---|---|
| Hook | 12:25 at the desk. Leo: "There's a match on at one. Can I stream it on my work laptop?" The player answers (it's fine, it's not, or let's check) before anyone has told them the rules: the baseline | Game (`person-chat`) | 1 |
| Learn | In the kitchen, Owain warms up the audience: the small print on one card, the three answers, and why "Ask first" is never wrong | NPC explainer (EX-01, BE-08) | 1 |
| Practise | The game show, **Allowed, Not Allowed, or Ask First?**, hosted by Ama and Owain: three rounds (Buzz, Why?, Who do you ask?) and Tomasz's "Fact or myth?" on monitoring. Contestants: the player, Leo, Martin and Kev. Every answer comes from the organisation's own policy | Minigame (MG-20, game show mode) | 4 |
| Apply | Back at the desk, two things the show didn't cover arrive without warning: a client's meeting invitation that wants an app installed, and Martin asking the player to look up a school contact's mobile number "for a personal thing" | Game (MG-01, `person-chat`) | 1.5 |
| Debrief | The scoreboard, the reasons, and the player's five responsibilities | Debrief screen (BE-02) and Ama | 0.5 |
| Check | Five scenario questions, answered from the organisation's policy | Quiz (MG-20) | 1 |
| Reference | The Lark: the policy page with the five-point summary, the full policy, "I have a question first", and the acknowledgement the platform records | Intranet (BE-09, HA-07) | 1 |

## Reuse from existing Break Escape content

- **Rooms:** `room_break` (the kitchen, dressed as a lunchtime quiz) and `room_office` (the player's desk). No new rooms.
- **Conversations:** `person-chat` multi-speaker scenes for two hosts, three contestants and an audience, using inline `Name:` prefixes and `Narrator:` lines (`README_ink_best_practices.md`); audience barks through event mappings; `phone-chat` for Lena and the client's message.
- **A three-verdict pattern:** `warranty-checklist` (sis03, `minigames/warranty-checklist/`) already lays out one row per item with three verdict buttons and a submit. Its labels, globals and alert text are hard-coded for sis03 (Compliant, Arguable, Breached; `warranty_checklist_complete`), so it would need generalising, but it is a working fallback for the Buzz round before MG-20's game show mode exists.
- **Scoring in ink:** m01's five-question quiz with score variables (`scenarios/m01_first_contact/ink/m01_npc_kevin.ink`) as the fallback scoring pattern.
- **Documents:** `notes` and a `lab-workstation` object for The Lark's policy page until BE-09.
- **Props:** kitchen tables and kettle, a whiteboard for the scoreboard, a notice board. Three novelty buzzers are new small props.

## New features needed

- **MG-20 Knowledge check:** the show's items and the final check, from one bank keyed to the organisation's answers.
- **proposed:** Game show mode for MG-20, a presentation skin with two hosts' reactions, contestants whose answers are revealed after the player locks in, three coloured buzzers, a whiteboard scoreboard and rounds, with no speed scoring. core_17's annual team event reuses it.
- **HA-11 Organisation profile:** an answer key for this module's bank (for each item: the answer, a one-line reason, the policy section, who to ask), with Larkspur defaults the organisation confirms or edits, and a small set of locked items it can't change (see `game_design.md`, Pitfalls).
- **HA-07 Policy library and acknowledgement** and **BE-09 Intranet terminal:** the organisation's policies shown in the game, the acknowledgement recorded with the policy version, re-requested when the policy changes and every 12 months.
- **proposed:** Policy questions, an "I have a question first" button beside the acknowledgement that sends the learner's question to the policy's owner, holds the acknowledgement open and keeps the answer with the policy record (an extension of HA-07).
- **BE-05:** contacts for each kind of question, the policy names, the monitoring statement.
- **BE-01, BE-02, BE-19, EX-01, BE-08:** the record, the debrief, the show opened from a conversation, and Owain's warm-up card.
- **HA-04 and HA-17:** reminders for an acknowledgement left pending, and re-acknowledging from the learner home without replaying the module.

## Organisation-specific content

- The acceptable use policy, versioned, with an accessible HTML version (HA-07), and any other policies the organisation wants acknowledged here (for example its information security policy).
- A five-point summary of the policy (HA-11; Larkspur's default is in `concepts.md`).
- The answer key: confirm or edit the Larkspur default for each item in the bank; at least 12 confirmed items before the module can be assigned.
- Personal use rules; the monitoring statement (what is monitored, why, and how staff are told); the route for requesting software; the rules for personal devices; social media guidance; what happens if the rules are broken.
- Who to ask about what: service desk, security team, DPO, HR, and a named owner for each policy.
- The acknowledgement wording and how often it is re-requested (default: every 12 months and whenever the policy changes).
- A route for saying a rule doesn't work (default: the policy owner, through "I have a question first").

## Open questions

1. **Acknowledgement wording.** *Recommendation: "I have read and understood this policy and I will follow it." It matches PCI DSS 12.6.3's "read and understood", avoids legalese, and the organisation can edit it.*
2. **Completion and pending questions.** Should the module count as complete before the policy is acknowledged? *Recommendation: no, in line with the course rule that a module isn't complete until any attached policy is acknowledged, but "I have a question first" holds it open without a fail, with reminders (HA-04) until the question is answered.*
3. **Locked answers.** Which answers can an organisation not change? *Recommendation: six: never share passwords or MFA codes; never use someone else's login; never lend a badge; never look at data you don't need for your job; never switch off security software; always report a suspected incident.*
4. **A live version.** Should organisations be able to run the show as a real lunchtime quiz for teams, on a presenter screen (BE-15, HA-13)? *Recommendation: yes. It costs little, uses the same bank and answer key, and is the friendliest way to launch a new or changed policy.*
5. **A policy that is only a long PDF.** *Recommendation: require an accessible version (HTML or a tagged PDF) and the five-point summary before the module can be assigned; flag it in the organisation's setup checklist.*
