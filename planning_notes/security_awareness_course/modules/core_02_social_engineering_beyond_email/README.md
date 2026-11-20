# core_02: Social engineering beyond email

**Working game title:** The Caller
**Pitch:** Run a pretext call against a help desk, then flip to the agent's seat and triage the calls, texts, pushes and QR codes that arrive beside the genuine ones.

| | |
|---|---|
| Audience | All staff. Built as helpdesk (E3, calls and MFA) and mobile (E6, texts and QR) episodes, with voicemails in E4 and E7 |
| Prerequisites | core_00 is the first-play brief in the kiosk frame; pairs with core_01 |
| Full episode | About 15 minutes (E6 and E7 about 16; E3 is about 15, durationTargetMin 15) |
| Defend-only variant | About 8 minutes |
| Pre and post check | about 9 minutes each (helpdesk and mobile forms), no pass mark |
| Text route | A gap in the build (BE-03), still to come |
| Priority | Built (E3, E6; E4 and E7 voicemails); the in-person, chat-app and remote-access additions are new |
| Build size | Built. The new work is extra defend items and the UK personal-scam routes, plus the visitor episode (E12) in the roadmap |

## Build status

**Part built** (`research/built_episodes_vs_plan.md` §2). Beyond-email social engineering is carried by two full episodes and the voicemail cards in two more, all in the "Incident Simulations: Critical Cases" line. The build wins over the old plan.

| Outcome | Covered by | Status |
|---|---|---|
| C02-LO1 channels and levers | E3 (calls), E6 (texts, QR), E4 and E7 (voicemail); concept cards | **Built** for phone, text, QR, voicemail; **New** for in-person and chat apps |
| C02-LO2 pause-worthy requests | E3 call cards; E6 text and QR cards; helpdesk and mobile checks | **Built** |
| C02-LO3 verify through a known number | E3 role swap (callback to the number on file); the habit to keep | **Built** |
| C02-LO4 refuse a code or remote access | E3 MFA-push and reset stages; the "never read out a code" concept card | **Built** |
| C02-LO5 decide on a QR code before scanning | E6 QR cards (`qr` card kind) | **Built** |
| C02-LO6 report at work; 7726, 159 and Report Fraud at home | the report verdict in every defend set | **Built** for the work route; **New** for 7726, 159 and Report Fraud (in no shell yet) |

**What the built episodes are:** E3 help-desk reset by phone then MFA fatigue (Quayholt Insurance, helpdesk), which uses the pretext call on the influence score, an attacker-side MFA push run (the learner chooses how many pushes and when), then the role swap in which the learner is the service-desk agent triaging three calls (two impostor, one genuine) and one unrequested push, Verify on. E6 texts and QR codes (Tarrowby Logistics, mobile), a work-phone inbox of three texts, two QR notices and one email, Verify on. E4 and E7 carry voicemail cards. Item counts are from the scenario files.

**What is new:** in-person approaches, chat-app impersonation, remote-access scams, and the UK personal-scam routes (7726, 159, Report Fraud), which appear in no shell today. The in-person approach is carried by the proposed visitor episode **E12 the visitor and the tailgater** (core_10, with person-chat in the training room; `04_BUILT_SO_FAR.md` §4). Chat-app and remote-access defend items, and the home routes on the reference card, are new items added to the E3 and E6 sets and the helpdesk and mobile checks, in the built shape.

## Why this module

Attacks do not only arrive by email. The same fraud lands as a phone call (vishing), a text (smishing), a message on a chat app ("Hi, it's me, I've got a new number"), a QR code on a poster or sticker (quishing), or a friendly stranger at the door with a story (pretexting). The aim is almost always the same as a phishing email: a password, a one-time code, a payment, information, or remote control of a device. Calls and messages feel more personal and more urgent than email, so people act before they think.

Two recent cases show the pattern. In 2023 the software firm Retool was breached after an employee got a text claiming to be from IT about an HR benefits problem, signed in on a fake page, and was then telephoned by an "IT" caller who talked them into sharing a one-time code. The cybercrime group tracked as Scattered Spider, described in a joint US advisory first published in November 2023 and updated to July 2025, repeatedly phoned or texted staff and help desks posing as IT to collect passwords, get remote-access tools installed, or have staff read out MFA codes. The defence against all of it is one habit: stop, and check through a route you already trust before you act.

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

Measurement is the helpdesk and mobile pre and post check pair, not a per-module pass mark; see `assessment.md`.

## Module flow

The built episode shape. E3 adds a pretext-call and an MFA stage in the attack half and a role swap in the defend half; E6 uses the phone layout. A full episode is about 15 minutes (E6 and E7 about 16; E3 about 15); the defend-only variant is about 8 minutes.

| Stage | What happens | Scored |
|---|---|---|
| Brief and scope note | The host welcomes the learner and names the exercise as authorised, at a fictional company | no |
| Attack | E3: a pretext call to the service desk as a locked-out manager (an influence bar shows how each line moved it), then an attacker-side MFA push run where the learner chooses how many pushes to send and when (for example late at night). E6: compose one "scan this code" message to depot staff. Unscored, one artefact | no |
| Flip | The learner's own pretext arrives on the receiving end: E3 flips to the agent's seat, E6 to the work phone | no |
| Defend | E3: triage three calls (two impostor, one genuine) plus one unrequested push, Verify on. E6: a work phone of texts, QR notices and an email, Verify on. New chat-app and remote-access items added here | yes |
| Debrief | Reasoning cards, genuine-item feedback, the team-protected tally, the habit to keep, the "On Monday" card, the customer report route, the no-blame line, and (new) the home routes 7726, 159 and Report Fraud | no |
| Pre and post check | Helpdesk and mobile forms bracketing the episodes: matched parallel forms, counterbalanced, no pass mark | the checks are scored, with no pass or fail |

## Reuse from existing Break Escape content

Built on the awareness systems on main:

- the episode runner and step strip, in the Quayholt and Tarrowby training rooms;
- the OSINT browser and intel facts (the attack halves);
- the pretext call on the influence global, with a bar and thresholds (E3);
- the MFA authenticator demo (E3, the attacker push run and the defend push card);
- the role-swap module (E3: the learner becomes the service-desk agent);
- the inbox-triage defender with its non-email card kinds (`call`, `push`, `voicemail`, `sms`, `qr`) and the report button and Verify;
- the mail client in template mode with the red-flag meter (E6's one message);
- one ink story per channel, with synced globals, for the scripted caller and messenger replies;
- the flip view, concept cards, the debrief view and awareness-measure records;
- the look-alike NPC guard and the social validator's strict social job.

## New features needed

The engine is built. The open MVP gaps that the new items and the visitor episode (E12) still need are in `features/README.md`:

- **BE-03** a text route and **BE-04 and BE-26** accessibility beyond the social overlays;
- **BE-30** configurable call labels (for the call and push cards);
- **BE-19** a real `#trigger_minigame`;
- person-chat in the training room, for the E12 visitor approach.

No runtime language model is used: the pretext judge, the caller and messenger replies and the feedback are authored data or ink. No video.

## Organisation-specific content

- The customer reporting route (the `customer_report_route` slot), and the service desk number.
- How the organisation's genuine IT verifies itself to staff (it never asks for a code or remote access by cold call).
- The visitor sign-in and escort rule (shared with core_10 and E12).
- Whether the organisation publishes a "we will never ask you for" list.
- The home reporting lines on the reference card (7726, 159, Report Fraud; Police Scotland 101 in Scotland).

## Open questions

1. **In-person approach.** Carried by the proposed E12 (the visitor and the tailgater), which needs person-chat in the training room. *Recommendation: build E12 for core_10 and share its visitor defend item here; keep core_02's in-person content to the conversation (the story, the jargon, the ask) and point to core_10 for the physical rules.*
2. **Home routes on the card.** 7726, 159 and Report Fraud appear in no shell. *Recommendation: add them to the E3 and E6 debrief reference cards and as a check item, since they are the personal-scam half of LO6.*
3. **Defend-only by default for E6.** Decided (aw7): the full and defend-only versions of E6 and E7 both stay listed, with organiser guidance. Two courses are seeded in Hacktivity, one with the defend-only episodes and one with both versions.
