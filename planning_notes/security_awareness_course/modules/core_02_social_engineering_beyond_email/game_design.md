> **For the build, this design is superseded by `../../implementation/12_WP15_CORE02_ITEMS.md`.** That implementation brief is checked against the code and the built content and wins wherever the two differ (company, host, stages, items, config). This file stays as design background: the intent, the alternatives and the reasoning.

# core_02 game design: The Caller

core_02 is delivered by two built episodes (E3 helpdesk, E6 mobile), the voicemail cards in E4 and E7, and a small set of new defend items plus the proposed visitor episode (E12) for the in-person approach. The built episodes are described as built, not redesigned. Where a scenario file and this description differ, the scenario file wins.

## Concept

The beyond-email outcomes play out as attack-then-defend episodes in a training room at a client company. The signature case is the help desk (E3): the learner first runs a pretext call against a fictional service desk, watching an influence bar move with each line, then flips to the agent's seat and triages the calls, pushes and voicemails that come in beside the genuine ones. The mobile case (E6) does the same on a work phone with texts and QR codes. The lesson in every channel is one habit: a number, a voice or a familiar name proves nothing, so stop and check back on a route you already trust.

## Setting and cast

The world is the built one: one training room per company, a kiosk and a host, no doors, no combat, no VM. Larkspur Group is retired as a setting, and the old course cast (Ama, Maureen, Owain, Jo Fairweather and the rest) does not appear. The host welcomes; the debrief teaches. The attacker view is the attack half itself, not a sandbox workshop with a tester NPC.

**Built episodes and their companies:**

| Episode | Topic | Company (room) | Role | Host |
|---|---|---|---|---|
| E3 | Help-desk reset by phone, then MFA fatigue, with a role swap | Quayholt Insurance | helpdesk | Darren Price (service-desk team lead); Leila Nassar is the agent seat the learner takes; the learner calls a phone NPC |
| E6 | Texts and QR codes | Tarrowby Logistics | mobile | Chidi Okeke (fleet coordinator) |

Voicemail cards also appear in E4 (Merrin & Sallow, executive) and E7 (Brightwell, everyone).

**Proposed new episode:**

- **E12 the visitor and the tailgater** (core_10, with person-chat in the training room): the in-person pretext approach. Company and host to be chosen from the brand set when E12 is scheduled.

All people and companies are fictional; every domain ends `.example`.

## Structure

### The built episodes (E3, E6): as built, not redesigned

**E3 help-desk reset and MFA fatigue** (`research/built_episodes_vs_plan.md` §1.2):

1. **Brief and scope note.** Darren Price welcomes the learner to the Quayholt training room.
2. **Attack half (unscored).** A pretext call to the service desk as a locked-out manager, on the influence score: the learner picks lines, and the influence bar shows how each one moves it and which verification question the agent skipped. Then a short attacker-side MFA push run in a mock authenticator, where the learner chooses how many pushes to send and when (for example late at night) and the debrief explains why fatigue works.
3. **Flip.** The learner becomes the service-desk agent.
4. **Defend half (scored, role swap).** Three calls (two impostor, one genuine and awkward) plus one unrequested push, as `call` and `push` cards. The taught move is the verification script: call back on the number on file, get manager approval, never read out a reset code, and offer the safe route to the genuine caller too. Verify is on. "Refuse everything" loses points, because the genuine caller also needs the safe route.
5. **Debrief.** Reasoning cards, genuine-item feedback, the tally, the habit to keep, the "On Monday" card, the report route, the no-blame line.

**E6 texts and QR codes:**

1. **Brief and scope note.** Chidi Okeke welcomes the learner to the Tarrowby training room.
2. **Attack half (unscored).** Compose one "scan this code" message to depot staff as Facilities, in the mail client's template mode with the red-flag meter.
3. **Flip.** The message lands on the work phone.
4. **Defend half (scored).** A work phone of three texts, two QR notices and one email (`sms` and `qr` card kinds), Verify on.
5. **Debrief.** As E3, with the QR concept (a QR code is a link you cannot read) on a concept card.

### New defend items (built shape)

Added to the E3 and E6 defend sets and the helpdesk and mobile check forms, keeping the matched-flag balance the social validator checks:

- **Chat-app impersonation** (a `sms` or chat card): "Hi, it's me, I've got a new number, can you do me a quick favour?" The right move is to reach the person on the number you already have and report it. Mirror: a genuine message from a known number.
- **Remote-access scam** (a `call` card): a cold "IT" caller who wants a support tool installed and a small payment. Report; never install anything. Mirror: a genuine scheduled-maintenance call that asks for nothing.
- **The home routes** on the debrief reference card and as a check item: 7726 for scam texts, 159 for calls claiming to be your bank, Report Fraud for the rest (Police Scotland 101 in Scotland). These are the personal-scam half of LO6.

### E12 the visitor and the tailgater (proposed, built shape)

The in-person approach, which the build does not yet cover. In a training room with person-chat, a visitor with a believable story and insider jargon asks to be let through to a back room. The attack half lets the learner assemble the pretext (who to claim to be, which real detail to drop, which lever); the flip puts the learner at the door; the defend half triages the approach (sign them in and escort, or report) alongside genuine visitors. It points to core_10 for the physical rules. E12 is scheduled in `04_BUILT_SO_FAR.md` §4; its company and host are chosen from the brand set when it is built.

## Decisions and consequences

The attack half is authored choices judged by the pretext judge, never scored against other learners. The defend half carries the score through the verdict and the flags (60 and 40). Every item shows its reasoning. No option shames the player: sharing a code in the attack beat, or mishandling a card in the defend beat, ends with the debrief framing it as "this is how most of these start, and reporting is what changes the ending".

| Decision | Options | Learning outcome | How the consequence is shown |
|---|---|---|---|
| E3 impostor call (agent seat) | run the verification script / reset without it | LO3, LO4 | Reasoning card; the influence recap from the attack half |
| E3 unrequested push | Deny and report / approve | LO4 | Reasoning card; the push attacker run as the mirror |
| E6 QR notice | report / scan and sign in | LO5 | Reasoning card; a genuine notice as the mirror |
| New chat-app message | check back on the known number and report / act on the new number | LO2, LO3 | Reasoning card; a genuine message as the mirror |
| New remote-access call | hang up and report / install the tool | LO4 | Reasoning card; a genuine maintenance call as the mirror |

## Minigames

All built and reused:

| System | Use here |
|---|---|
| Episode runner and step strip | The wrapper for E3 and E6 |
| OSINT browser and intel facts | The attack halves |
| Pretext call on the influence global | E3's attack call, with the bar and thresholds |
| MFA authenticator demo | E3's attacker push run and the defend push card |
| Role-swap module | E3's agent seat |
| Inbox-triage defender | The defend halves, with `call`, `push`, `voicemail`, `sms` and `qr` cards |
| Mail client (template mode) | E6's one composed message |
| One ink story per channel | The scripted caller and messenger replies, with synced globals |
| Flip view, concept cards, debrief view, awareness-measure records | As across the product |

## Explainers

No mentor NPC and no video. The host welcomes; the debrief teaches. Concept cards carry the short points (the QR card: a QR code is a link you cannot read; a "never read out a code" card). Text to speech provides the caller and voicemail voices. The attacker view is the attack half, not a tester's recording.

## Debrief

The built debrief view: a reasoning card per item, genuine-item feedback, the team-protected tally, the habit to keep (quoted word for word), the "On Monday" card, the customer report route, the no-blame line, and the new home routes (7726, 159, Report Fraud).

**The habit to keep:**

> When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do.

## Variants

- **Defend-only variant:** E3 and E6 each have one (about 8 minutes): brief, defend, debrief, same defend set. The opt-out for customers who object to the attack beat, and the micro-drill.
- **Text route:** not yet built (BE-03), kept as a gap.
- **Facilitated session:** the `facilitated` flag exists; no shipped shell sets it. The built product will have one facilitator guide for the whole course, written last; per-episode notes are at most an extension.
- **Replay and randomisation:** matched items with disjoint phish slots across the A and B check forms; invented, varied numbers and names.

## Alternative concepts

The built shape is settled. The old plan's "switchboard" arcade drill, the "build the pretext with Jo" workshop and the branching "new number" drama are closed: the attack half and the role swap deliver the attacker view and the pressure, and Jo Fairweather is dropped.

## Art and audio

- **Rooms:** the Quayholt and Tarrowby awareness rooms, dressed per company.
- **Hosts:** Darren Price and Leila Nassar (E3), Chidi Okeke (E6); E4 and E7 hosts carry the voicemail episodes.
- **Voice:** text to speech for the calls, voicemails and host lines. No voiced line prints a variable; counts, numbers and the report route are on screen only.
- **No video.**

## Pitfalls

- **Don't redesign what is built.** E3 and E6 are shipped shells; this plan adds items and the E12 visitor episode.
- **Never ask for a real code.** The push demo and the calls use made-up codes; nothing typed is a real credential.
- **Don't make caller ID the lesson.** A right-looking number proves nothing; the taught cue is "check back", not "watch the number".
- **Keep the genuine caller genuinely helpful.** E3's genuine caller must be served the safe way, so "refuse everything" is not the winning move.
- **Mind the boundaries.** Payments and bank changes point to core_11; the physical door to core_10 and E12; MFA setup to core_03 and E9; deepfake voices to core_15.
- **No claims of effectiveness.**
