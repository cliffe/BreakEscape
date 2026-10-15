# core_01: Phishing emails

**Working game title:** Inbox Zero
**Pitch:** Get the week's delivery schedule out by 10:00, while the emails that matter to the job arrive alongside emails that only look like they do.

| | |
|---|---|
| Audience | All staff |
| Prerequisites | core_00 recommended (introduces the cast and the Report button) |
| Full module | 18 minutes |
| Micro-drill | 3 to 4 minutes ("Phish or Fine?") |
| Text route | 12 minutes |
| Priority | MVP |
| Build size | L, driven by the inbox minigame (MG-01), which many other modules reuse |

## Why this module

Phishing is the most common way attacks on organisations begin. In the UK government's Cyber Security Breaches Survey 2025, 85% of businesses that identified a breach or attack in the previous year had experienced phishing. Most of it aims at passwords, which open email, payroll, customer data and the trust of everyone the account can write to. Well-made phishing no longer has spelling mistakes, and it often arrives from real accounts that have been taken over, so the defence has to be a habit (pause, check another way, report) rather than a checklist of cues.

## Target behaviours

1. **Reports** suspicious emails with the Report button, including when unsure and after their own mistake.
2. **Checks another way** before signing in, paying or sending data because an email asked: a bookmark, the app, the directory, a colleague.

## Learning outcomes

After this module, staff can:

- **C01-LO1** Say what a phishing email is trying to get them to do, and recognise the pressures it uses (authority, urgency, fear, curiosity, reward, social proof, secrecy).
- **C01-LO2** Read a web address or email address and pick out the real domain.
- **C01-LO3** Recognise requests that should make them pause (a password, a code, money, data, a file, skipping process), even when the sender looks genuine.
- **C01-LO4** Check a suspicious request through a channel they already trust.
- **C01-LO5** Report a suspicious email through the organisation's route, including when unsure.
- **C01-LO6** Take the right first steps after clicking a link, opening an attachment or typing a password.

## Compliance coverage

Contributes to (references in `02_COMPLIANCE_MAPPING.md`):

- **PCI DSS 12.6.3.1**: training covers phishing and related attacks and social engineering. This module and core_02 together meet it.
- **ISO 27001 cl. 7.3** and **ISO 27001 A.6.3**.
- **NIST AT-2, AT-2(3) and AT-2(4)**: literacy training; social engineering and mining; suspicious communications.
- **CIS 14.2** (recognise social engineering attacks, including business email compromise) and **CIS 14.6** (recognise and report incidents).
- **NIS2 Art 21(2)(g)** (basic cyber hygiene practices and training) and **NIS2 IR 8.1** where the Implementing Regulation applies.
- **NCSC CAF B6.a** (a reporting culture) and **NCSC CAF B6.b** (training).
- **UK GDPR Art 32** (security of processing: staff awareness is the usual organisational measure).
- **NYDFS 500.14(a)(3)** (annual training including social engineering), for US financial services customers.

## Module flow

| Beat | What happens | Format | Minutes |
|---|---|---|---|
| Hook | A "mailbox almost full" phish in the player's second week; their response is the baseline | Game (MG-01) | 1 to 2 |
| Learn | Ama takes the hook email apart: the ask, the feeling, the sender, the link; then Pause, Check another way, Report | NPC explainer with visual aids (EX-01, BE-08) | 3 |
| Practise | "Phish or Fine?": ten emails, getting harder, with instant feedback and the domain drill | Minigame (MG-01 practice, MG-03) | 3 to 4 |
| Apply | Send the delivery schedule by 10:00 while four threats arrive among ordinary work; Leo asks for advice after a slip | Game (MG-01, BE-18) | 6 to 8 |
| Debrief | Each threat, the clue, what you did, what checking would have looked like; Kai's report board | Debrief screen (BE-02) and NPCs | 2 |
| Check | Six scenario questions | Quiz (MG-20) | 2 |
| Reference | Reference card on The Lark, with the organisation's own Report button shown | Intranet (BE-09) | under 1 |

## Reuse from existing Break Escape content

- **Rooms:** `room_office` (Operations), `room_break` (kitchen), `room_security`.
- **Conversations:** `person-chat` for Ama, Leo and Kai; `phone-chat` for the team chat and Lena's messages.
- **Documents:** `notes` and `text-file` for the supplier directory and The Lark's notices.
- **Patterns:** the instructor NPC topic hub from the `lab_*` scenarios and `story_design/ink/lab_sheets/phishing_social_engineering.ink` (rewritten as short, defensive, staff-level explanations); timed messages (`scenarios/timed_messages_example`) for scheduled arrivals; event-triggered conversations for Ama's arrival after a click.
- **Systems:** the game clock and scenario timers for the 10:00 deadline; objectives and tasks for the work task bar.

## New features needed

- **MG-01 Inbox** (the core of the module).
- **MG-03 Link and domain drill** (inline in practice items).
- **MG-20 Knowledge check.**
- **BE-01 Assessed decisions** and **BE-02 Debrief screen**: every row in `assessment.md`.
- **BE-08 Visual aids**: the annotated hook email.
- **BE-09 Intranet terminal**: The Lark, the survey list, the reference card.
- **BE-05 Organisation profile**: the customer's own Report button name and location, service desk number and simulation policy.
- **BE-13 Content banks**: the email bank and per-game domains.
- **BE-16 Time skips**: the account-takeover consequence.
- **BE-18 Work task and interruptions**: the schedule task and timed arrivals.
- **BE-19 Open minigames from conversations and events**: the inbox opening by itself at the hook, and Ama's check question inside her explanation. Today a minigame only opens when the player clicks an object.
- **BE-20 Authorable tutorial and title screen**: the course's own opening rather than the campaign's.
- **BE-07 Micro-drill launcher** for "Phish or Fine?" (P2).
- **MG-30 Pretext workshop** for the optional attacker-view beat 3b (P3; builds on MG-13 and MG-01, so it arrives after both). Optional, sandboxed, pretext-only.
- **MG-04 Voice calls** for the Northbeck call-back (P2; a phone NPC conversation works until then).
- **EX-02 and MG-21** for the optional sixty-second video (P2).

## Organisation-specific content

- The name and location of the Report button, on desktop and mobile.
- The service desk contact for "I clicked".
- What to do after opening a suspicious attachment.
- Whether the organisation runs simulated phishing and how clicks are treated (drops C01-Q11 if not).
- Whether the optional attacker-view beat (3b, MG-30) is on. Off by default; on when the organisation wants it. When off, the beat is simply absent and nothing else changes.
- The external sender banner wording, if any.
- The approved way to reach company systems (bookmarks, an app, a portal).

## Open questions

1. **Inbox look.** Should MG-01 look like a generic mail client in the game's pixel style, or like a modern flat mail client? *Recommendation: generic and flat, legible, with no real brand, because transfer to the learner's own inbox matters more than style.*
2. **Hook when replaying.** Should the hook phish change on a retake? *Recommendation: yes, draw a different hook from the bank so the baseline stays honest.*
3. **Simulation tie-in.** If an organisation uses HA-12 simulated phishing, should a simulated click send the learner the micro-drill? *Recommendation: offer it as an optional link, never as a forced "you failed" page; the research on landing-page training is weak.*
