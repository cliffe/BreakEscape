# role_06 game design: Who's Calling?

## Concept

role_06 is a new role that reuses the built E3 role-swap pattern. It is designed in the "Incident Simulations: Critical Cases" shape: a training room at Quayholt Insurance with a kiosk and a host, no doors, no combat, no VMs. The learner is a customer adviser in Quayholt's contact centre, which handles calls, chats and emails from policyholders and from commercial customers (schools, councils and care homes Quayholt insures).

- **Attack first.** The learner researches a customer's public details and composes one account-takeover approach: a pretext call or message to the contact centre, on the influence bar. This is the social engineering advisers face, built from the OSINT browser, pretext prep and the influence model, exactly as E3's attack half is.
- **Role swap.** The role swaps and the learner is the adviser, triaging a queue of calls, chats and texts (genuine and impostor), with the claimed facts shown by label so they check the very facts they used as the attacker.

Most contacts are exactly what they seem. A few are not, and they don't sound any different: a charming "new office manager" who needs a payout redirected, a furious "council officer", a policyholder who is being scammed and about to pay a stranger. The lesson is that the adviser can't hear the difference, so the procedure makes it: the same checks, matched to the request, using details already held.

The old Larkspur Customer Hub, its standalone MG-17 desk, the proposed secure-payment keypad overlay and the dedicated call-replay panel are retired; they would redesign beyond the build. The built debrief already labels each item's tactics. The richer desk and keypad overlay are kept in the `features/minigames.md` catalogue (build status "not built").

## Setting and cast

- **Company:** Quayholt Insurance (`quayholt.example`), a commercial insurer in Bristol, room `room_aw_quayholt` redressed for the contact centre. Host: **Shauna Campbell**, contact centre team leader (a Quayholt staff member; name needs the pre-ship web-search and surname-clash check). Patient, quick, protective of customers, always backs an adviser who follows the procedure.
- **Security:** **Anjali Rao**, Quayholt's information security analyst (built E3 cast), takes the reports and shows what each one allowed.
- The old Larkspur cast (Kai Murray, Jo Fairweather) is retired. There is no recurring red-team mentor; the attack half carries "how little a fraudster needs", and the awareness product has no runtime attacker guide.
- **Customers (voice or text only, each a distinct voice):** a genuine commercial customer with a routine query; an impostor "new office manager" seeking a payout change; a genuine individual policyholder being scammed; a genuine locked-out customer; an angry "council officer". All customer organisations are fictional.

## Structure

### Attack-first, role-swap episode

**Brief and scope note.** Shauna welcomes the learner to an authorised exercise; the morning queue is building.

**Attack half (unscored, influence bar).** OSINT on a customer's public details (a commercial customer's website, a staff member's public profile), then compose one account-takeover pretext: a call or message to the contact centre asking to change contact details, reset a login or redirect a payout, with found facts in the blanks. Nothing real happens; the influence bar shows how the pressure lands.

**Flip.** The learner's own approach shown from the adviser's side, its tells named: a recent contact-detail change, urgency, a request that only details-already-held can safely satisfy.

**Defend half (role swap, scored, Verify on, mirror pairs).** The learner is the adviser. A queue of calls, chats and texts, each impostor with a close genuine twin, the claimed facts shown by label:

| # | Phish item | Genuine twin | Flags | Verdict that scores |
|---|---|---|---|---|
| 1 | "New phone, send the reset to this number" (`call`) | A genuine locked-out customer reachable on the number on file | new details, reset | Verify: call back or reset to details on file |
| 2 | "New office manager, change our contact email and send the invoices here" (chat, `sms`/`page`) | A genuine named contact asking for documents to the address on file | blagging, free webmail | Report; send only to details on file |
| 3 | "Redirect our payout to my new account" after a recent email change (`call`) | A genuine change confirmed by call-back on the old number | changed details, money | Verify the change history, call back on the old number |
| 4 | An angry "council officer: read me the bank details you hold" (`call`) | A genuine customer with a normal finance query | authority, pressure, data request | Report; read nothing out; escalate |

Reporting is never penalised, and over-checking a genuine twin draws a calibration note, not a penalty.

**Debrief cards.** Per-item reasoning with the caller's tactics labelled (urgency, authority, anger, new details); genuine-item feedback; the team tally; **the habit to keep**, quoted word for word:

> When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do.

An "On Monday" card for advisers: *"Same checks every time, especially when they're in a hurry. Call-backs and resets go only to details we already hold."* Concept cards on protecting a scammed customer (tell them plainly, 159, Report Fraud) and on the secure payment route (card details never come through your ears). Then the reporting-route box and the no-blame line.

## Decisions and consequences

Every item pairs a threat with a doable action and never shames the player, nor a scammed customer.

| Item | Caught by | Learning outcome |
|---|---|---|
| "New phone, send the reset" | Call back, or reset to details on file | LO1, LO2 |
| Takeover payout redirect | Change history, then call back on the old number | LO2 |
| Blagging chat for documents | Send only to details on file; report | LO4 |
| Angry "council officer" | Read nothing out; escalate; report | LO3, LO4 |
| Scammed policyholder (concept card and defend item) | Tell plainly, 159, Report Fraud, report internally | LO5 |
| Card number read aloud (concept card and defend item) | Stop and use the secure route | LO6 |

## Minigames

| System (built) | Use here |
|---|---|
| Episode runner and role-swap module (`episode-runner/role-swap.js`) | The spine: attacker first, then the adviser's seat |
| OSINT browser, intel facts, pretext prep and the pretext judge, with the influence bar | The attack half's account-takeover pretext |
| Inbox triage with the `call`, `sms` and `page` kinds and the Verify verdict | The defend set, with mirror pairs; the claimed facts shown by label |
| Flip view, debrief view (tactics labelled), concept cards | The flip, the debrief and the scam-protection and payment cards |
| Awareness measurement and the comparison panel | The new customer checks |

No new minigame is built. The standalone MG-17 desk, the secure-payment keypad overlay and the call-replay panel are a later idea in the `features/minigames.md` catalogue (build status "not built").

## Explainers

Concept cards, immediate per-item feedback and the debrief, not a mentor or video (R9):

| Concept card | Shown where | Covers |
|---|---|---|
| Know versus have | Defend half | LO1 |
| The ladder of checks | Defend half | LO1 |
| The takeover timeline | Defend half | LO2 |
| Holding the line | Debrief | LO3 |
| Protecting a scammed customer | Debrief | LO5 |
| The secure payment route | Debrief | LO6 |

No video. If a customer insists on a talking-head, the file marks it optional only and it is not built.

## Debrief

Shown on the built debrief view: per-item reasoning cards with the caller's tactics labelled; genuine-item feedback; the team-protected tally; **the habit to keep** (quoted); the "On Monday" card; the reporting-route box; the no-blame line. The point the learner takes away is seeing the charming impostor and the angry impostor use the same levers with opposite moods, while the genuine callers are brisk and ordinary.

## Variants

- **Defend-only variant:** the role swap as brief, defend, debrief (about 8 minutes), same defend set, for customers who object to the attacker beat.
- **Facilitated session:** the `facilitated` flag on the full episode, played on a shared screen for a team huddle, with pause panels (what our customers know that a stranger could find; what the change history tells you; what you need from your team leader; what you'd say to an embarrassed customer). The flag hides per-learner scores on the shared screen.
- **Text route:** each contact as a transcript, the record as an accessible table, the checks as buttons; a gap in the build (BE-03).
- **Spaced practice:** a short "Verify or Deny?"-style defend-only shell drawn from the pool, monthly; the customer checks repeated each year.
- **Replay:** the takeover's request, the scam story and the angry caller's story are drawn from banks; account numbers, postcodes and amounts are generated per play so colleagues can't pass on answers.

## Alternative concepts

1. **Mystery Caller (attack-first, built shape).** The attack half already is this: the learner builds the pretext from public details, then the role swaps and takes the calls. No separate red-team mentor.
2. **Switchboard (defend-only drill).** A short defend-only shell of call cards routed to the right check, scored on correct verification over speed.
3. **Anatomy of a scam (consequence flip).** One fraud followed end to end as a consequence-flip episode (R3), showing where an adviser, a team leader or a customer could break the chain; suits account managers who rarely take calls.

## Art and audio

- **Rooms:** `room_aw_quayholt` redressed for the contact centre (headset desks, a calls-waiting display); room review and POV backgrounds are later in the build.
- **Characters:** Shauna Campbell (new; needs art and voice, pre-ship checked), Anjali Rao (built E3 cast); generic office sprites with headsets as other advisers; callers are voices only. Host art is held on PixelLab quota and the user's approval.
- **Voice:** text-to-speech only (no runtime language model). The impostor callers must sound clearly different from the genuine ones: this module is about procedure, not voice-matching, which is core_15's ground. No voiced line prints a variable: account numbers, amounts and codes are on screen only, and codes are never spoken, so the voice cache stays keyed on exact text.

## Pitfalls

- **Training suspicion instead of service.** Genuine callers get warm, quick help; the easy genuine twins make that the point. The procedure is explained to callers, never hidden behind.
- **Unreliable cues.** Accent, background noise and nervousness are never clues. The impostors are pleasant or angry; the clues are the request, the change history and the failed step-up.
- **Undermining "never read out a code".** Quayholt's advisers never ask customers for a code, so the course-wide rule (core_02, core_03) stays true. Organisations that use read-back codes get the safeguards, not a contradiction.
- **Mocking the scammed.** The scammed policyholder is dignified; the criminals had real details; telling the adviser was the right thing to do.
- **Too much PCI.** Staff need three rules (the secure route, never write or type card details, never keep the security code), not the standard.
- **Abuse.** Raised voices and threats to complain only, with a content note and a transcript option.
- **Anger as the clue.** The angry caller and the charming caller are both fraudsters; the genuine caller is brisk and genuine; the procedure is the same for all.
