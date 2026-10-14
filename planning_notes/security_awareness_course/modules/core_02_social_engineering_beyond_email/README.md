# core_02: Social engineering beyond email

**Working game title:** The Caller
**Pitch:** Cover the Operations phone line for one busy morning, where most callers want a simple answer and a few want your code, your help, or a quick favour.

| | |
|---|---|
| Audience | All staff |
| Prerequisites | core_00 recommended (introduces the cast and the Report button); pairs with core_01 |
| Full module | 18 minutes |
| Micro-drill | 4 minutes ("Caller or Con?") |
| Text route | 12 minutes |
| Priority | Phase 2 |
| Build size | M, driven by the voice-call minigame (MG-04) and the messaging and QR skins (MG-05, MG-06) |

## Why this module

Attacks do not only arrive by email. The same fraud lands as a phone call (vishing), a text (smishing), a message on a chat app ("Hi, it's me, I've got a new number"), a QR code on a poster or sticker (quishing), or a friendly stranger at the door with a story (pretexting). The aim is almost always the same as a phishing email: a password, a one-time code, a payment, information, or remote control of a device. Calls and messages feel more personal and more urgent than email, so people act before they think. Criminals know this, and they have learned to ask a human to do the one thing a computer cannot be tricked into: read out a code, or install a tool, or hold a door.

Two recent cases show the pattern. In 2023 the software firm Retool was breached after an employee got a text claiming to be from IT about a payroll account, signed in on a fake page, and was then telephoned by an "IT" caller who talked them into sharing a one-time code. The cybercrime group tracked as Scattered Spider, described in a joint US advisory first published in November 2023 and updated to July 2025, repeatedly phoned or texted staff and help desks posing as IT to collect passwords, get remote-access tools installed, or have staff read out MFA codes. The defence against all of it is one habit: stop, and check through a route you already trust before you act.

## Target behaviours

1. **Ends the call or chat and checks back through a route they already have** (a directory number, the number on a card or statement, the colleague in the building) before acting on a request for money, codes, access, information or a favour.
2. **Never reads out an MFA or one-time code, and never installs remote-access software or runs commands because a caller asked.**
3. **Reports the attempt** through the organisation's route, including after they have shared something; and at home, uses 7726 for scam texts and 159 for calls claiming to be their bank.

## Learning outcomes

After this module, staff can:

- **C02-LO1** Name the main channels social engineering uses beyond email (phone, text, chat apps, QR codes, in person) and the levers behind them (authority, urgency, fear, helpfulness, flattery, insider jargon).
- **C02-LO2** Recognise the requests that should always make them pause (a code, remote access, a payment, a change of details, information, an urgent favour), even from a familiar name or number.
- **C02-LO3** Verify a caller, texter or messenger through a channel they already trust, rather than the number or link in the message.
- **C02-LO4** Refuse to share one-time codes or grant remote access, and end the contact without being talked round.
- **C02-LO5** Decide what to do with a QR code before scanning it, and check where it really goes.
- **C02-LO6** Report the attempt at work, and use 7726, 159 and Report Fraud for personal scams.

## Compliance coverage

Contributes to (with core_01, meets the social-engineering training expectation):

- **PCI DSS v4.0.1** 12.6.3.1: awareness training on phishing and related attacks and social engineering.
- **ISO/IEC 27001** clause 7.3 and Annex A 6.3 (awareness).
- **NIST SP 800-53 Rev 5** AT-2(3) (social engineering and mining: names phishing, pretexting, impersonation, baiting, quid pro quo).
- **CIS Controls v8.1** 14.2 (recognise social engineering attacks, including pretexting) and 14.6 (recognise and report incidents).
- **NIS2** Article 21(2)(g) (basic cyber hygiene and training).
- **NCSC CAF** B6 (staff awareness and training).

## Module flow

| Beat | What happens | Format | Minutes |
|---|---|---|---|
| Hook | "Owain from IT" rings about a security alert and asks the player to read back a code and install a support tool; the response is the baseline | Game (MG-04) | 1 to 2 |
| Learn | Ama explains the channels and the levers, and hands over a social engineer bingo card; the defence is Pause, Check back, Report | NPC explainer with visual aids (EX-01, BE-08) | 3 |
| Practise | "Caller or Con?": eight short calls, texts and messages, getting harder, with instant feedback | Minigame (MG-04, MG-05 practice) | 3 to 4 |
| Apply | Cover the Operations phone line while logging school delivery queries; genuine and fake contacts arrive by call, text, chat and QR, plus a visitor at the door | Game (MG-04, MG-05, MG-06, BE-18) | 6 to 8 |
| Debrief | The bingo card becomes the score; each attempt replayed with the clue and what checking back would have looked like; Jo's recorded test call | Debrief screen (BE-02), NPCs, demonstration (EX-05, EX-06) | 2 |
| Check | Six scenario questions | Quiz (MG-20) | 2 |
| Reference | Reference card on The Lark: Pause, Check back, Report; 7726, 159 and Report Fraud for home | Intranet (BE-09) | under 1 |

## Reuse from existing Break Escape content

- **Rooms:** `room_office` (the Operations phone desk), `room_break` (the kitchen, where Owain actually is), `room_reception` (Maureen and the side-door visitor), `room_security` (Ama and Jo's debrief). No new rooms.
- **Conversations:** `person-chat` for Ama, Maureen, Owain, Jo and the visitor; `phone-chat` for calls, texts and the chat app. The phone minigame already supports `timedMessages`, a terminal theme and TTS voice messages.
- **Patterns:** the call-back verification in `scenarios/sis02_energy/ink/npc_tom_hadley.ink` (the SOC refuses an unverified change and rings back on the number it holds) is the model for "check back on a number you already have". `scenarios/test-phone-terminal` shows two phones (a trusted contact and an unknown sender) running side by side. `docs/NPC_INFLUENCE.md` for the pressure popups during a pushy call.
- **Voicemail:** the `phone` object with `voice` and `ttsVoice` (see `README_scenario_design.md`) for Jo's recorded test call.

## New features needed

- **MG-04 Voice calls** (the core of the module): incoming and outgoing calls, a ringing phone, a directory to call back on a known number, hold and transfer, events for every action. Until it exists, calls can run as `phone-chat` NPC conversations.
- **MG-05 Messaging apps**: SMS and chat-app skins on the phone chat, with unknown numbers and links.
- **MG-06 QR code scanner**: scan a code in the world, see where it really goes, choose to open it or not.
- **BE-18 Work task and interruptions**: the delivery-query log, with calls and messages arriving as scheduled interruptions.
- **BE-19 Open minigames from conversations and events**: the first call ringing by itself at the hook; Ama's check question.
- **EX-06 Attacker-view interlude** and **EX-05 Demonstration**: Jo's recorded authorised test call, unpicked by Maureen.
- **BE-08 Visual aids**: the levers diagram and the bingo card in the conversation panel.
- **BE-02 Debrief**, **BE-01 Assessed decisions**, **MG-20 Knowledge check**, **BE-09 Intranet terminal**, **BE-05 Organisation profile** (reporting routes and service desk number), **BE-13 Content banks** (the caller and message bank).
- **proposed: BE-22 Tactic bingo/spotter card**, a light overlay listing social engineering tactics that the player ticks off as they hear them in play, and which becomes the debrief score. (A simpler build could reuse the knowledge-check tally; flagged for the orchestrator.)

## Organisation-specific content

- The reporting route for a suspicious call, text or visitor, and the service desk number.
- How the organisation's genuine IT verifies itself to staff (it never asks for a code or remote access by cold call).
- The visitor sign-in and escort rule (shared with core_10).
- Whether the organisation publishes a "we will never ask you for" list.
- The home reporting lines on the reference card (7726, 159, Report Fraud; Police Scotland 101 in Scotland).

## Open questions

1. **Live voice or text calls.** Should MG-04 play recorded TTS voice for callers, or run as on-screen text with an optional voice? *Recommendation: text first with optional TTS, so the module works with sound off and on low-spec devices, and so no voiced line prints a variable.*
2. **The bingo card.** Build BE-22 as a dedicated overlay, or render it with the existing notes or knowledge-check UI? *Recommendation: start with the existing UI to prove the idea, then propose BE-22 if playtests show it needs its own card.*
3. **Side-door visitor overlap with core_10.** How much of the door scene belongs here? *Recommendation: keep it to the conversation (the story, the jargon, the ask) and point to core_10 for the physical access rules.*
