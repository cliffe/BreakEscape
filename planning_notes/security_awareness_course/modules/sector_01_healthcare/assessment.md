# sector_01 assessment

sector_01 is a new sector role, so it needs its **own healthcare check-form pair**, proposed below. The module is measured by that pair and by the defend half of the attack-first episode, with the need-to-know, smartcard and downtime behaviours evidenced in the consequence-flip episode. Scored recognition sits only in the defend half and the checks, with no default pass mark (build decision R6). The behaviours and Q items keep their stable ids and are mapped onto these built forms, with mirror pairs (aw5).

## Proposed new check pair

**`awareness_{pre,post}_healthcare_{ab,ba}`.** A triage set of ward phone enquiries, a ward-mailbox phish and a visitor, built with the existing inbox-triage engine (the `call`, `sms`, `page` and email cards, the Verify verdict, the claimed facts shown by label). Ten items each, 4 phish, matched flag multisets, A and B disjoint on phish slots, counterbalanced AB and BA, `passPercent: 0`, feedback at the end, Verify on. Each phish is mirror-paired with a close genuine twin:

| # | Phish item | Genuine twin | Flags |
|---|---|---|---|
| 1 | The "nephew" asking about a patient | A genuine relative who gives the agreed password | not on the list |
| 2 | The "agent" (a reporter) asking when a patient goes home | A genuine care home needing a discharge summary | press enquiry, pressure |
| 3 | A "smartcard expires today, renew here" email | A genuine IT notice to the known portal | look-alike domain, credential lure |
| 4 | A stranger in hi-vis heading for the office | A genuine contractor who signs in and invites a check | no ID, no booking |

(Six genuine items in all, including the four twins, so the pair balances like the built role checks; authoritative counts live in the scenario files when built.)

## Assessed behaviours

Each row is recorded through the measurement store (`systems/awareness-measure.js`): item id, verdict or decision, chips, score, stage and time, ids only, first answer wins, no free text, no learner identity. "Secure, Developing, Not yet" is an authoring rubric, not a shipped grade; the shipped output is the defend score, the per-item verdicts, the consequence-flip decisions and the pre-to-post change.

| Id | Behaviour | Learning outcome | Where it is evidenced | Good answer | Weaker answer |
|---|---|---|---|---|---|
| S01-B1 | Answers the "nephew" | LO3 | **Attack-first defend; check item 1** | Confirms nothing; takes a name and number, or asks for the password | Says how he is or why he's in |
| S01-B2 | Answers the "agent" | LO3 | **Attack-first defend; check item 2** | Confirms nothing; the press office | Says how she is or when she'll go home |
| S01-B3 | Deals with a colleague's smartcard | LO2 | **Consequence-flip episode** | Card out, lock, own login | Works in the colleague's session |
| S01-B4 | Opens only what's needed in a record | LO1 | Consequence-flip episode (the audit flip) | Admin view only; tells the curious colleague why not | Opens the clinical notes with no care reason |
| S01-B5 | Responds to a colleague's admission of snooping | LO1, LO6 | Consequence-flip debrief | Encourages them to tell IG now, offers to go with them | Keeps it quiet |
| S01-B6 | Handles the mailbox phish | LO6 | **Attack-first defend; check item 3** | Reports and warns the team | Clicks and signs in |
| S01-B7 | Responds to an unsafe downtime request | LO5 | Consequence-flip episode | The downtime form | A messaging app or a whiteboard photo |
| S01-B8 | Answers the phone-charging request | LO5 | Consequence-flip episode | No; the staff-room charger | Plugs into a medical device |
| S01-B9 | Deals with the hi-vis stranger | LO6 | **Attack-first defend; check item 4** | Challenges politely and checks with IT or security | Lets him into the office |
| S01-B10 | Shares with the care home | LO4 | **Attack-first defend (the care-home twin)** | Call back, then the approved secure route | Emails it to a personal address, or refuses outright |
| S01-B11 | Spots the risks on the ward desk | LO1, LO2 | A spot-the-risk defend item (`page` kind) | Finds the unlocked screen, the card left in, the printed list | Misses them |
| S01-B12 | Owns up to their own slip | LO6 | Consequence-flip debrief | Tells IG before the debrief | Doesn't tell anyone |

**Before and after.** The healthcare post-check against the newest healthcare pre-check gives the measured change. The comparison panel shows it only when a baseline exists, and says so when there is none. There is no effectiveness claim beyond a cohort's change on matched items. Refusing to share with the care home is shown as a gap (unsafe for the patient), never a penalty, because over-caution is the slip this module most wants to correct alongside over-sharing; reporting is never penalised.

## Critical behaviours

Kept as authoring priorities, not hard gates (the build has no loop-back gate; a missed item draws immediate feedback, its mirror-pair twin, or the consequence flip):

- **S01-CB1** Don't open a record you don't need (S01-B4), or, if you did, own up (S01-B12): the consequence-flip episode.
- **S01-CB2** Don't work in someone else's session (S01-B3): the consequence-flip episode.
- **S01-CB3** Share patient information only with people entitled to it, through an approved route (S01-B2 and B10): the attack-first defend set.

## Knowledge check bank

The twelve Q items keep their ids and become a candidate pool for healthcare check stems, defend items, consequence-flip choices and concept cards. Delivery is tagged, with mirror pairs noted:

- **S01-Q1 (LO1)** "Just look her up." Consequence-flip choice; concept card (need to know).
- **S01-Q2 (LO1)** "Only a problem if you tell someone" (false). Concept card.
- **S01-Q3 (LO1)** Looking at your own relative's record. Concept card.
- **S01-Q4 (LO2)** A colleague's card left in a reader. Consequence-flip choice.
- **S01-Q5 (LO2)** Which habits keep smartcards safe. Concept card.
- **S01-Q6 (LO3)** The "nephew" call. **Built as check item 1 and the attack-first defend**, mirror-paired with a genuine relative.
- **S01-Q7 (LO3)** The "agent" call. **Built as check item 2.**
- **S01-Q8 (LO4)** The care home's medication request. **Built as the care-home defend twin**, paired with a refusal and an over-share as the weaker answers.
- **S01-Q9 (LO4)** "If in doubt, don't share" (false). Concept card (the duty to share).
- **S01-Q10 (LO5)** The WhatsApp bloods list. Consequence-flip choice.
- **S01-Q11 (LO5)** Charging a phone from a monitor. Consequence-flip choice.
- **S01-Q12 (LO6)** The smartcard-renewal phish. **Built as check item 3 and the attack-first defend.**

## Reflection prompt

- "Think of a time you weren't sure whether to share something about a patient. What would have helped you decide?"
- For facilitated sessions: "What makes it hard to stop a colleague who's curious about a patient, and what could we say to each other?"

## Completion and pass rules

- **Complete** when the learner has played the episodes (or the defend-only variant and the consequence flip), seen the per-item feedback and the debriefs, and taken the healthcare post-check. There is no default pass mark (R6); a pass mark is an organisation setting on the healthcare post-check percent, not a default.
- **No retake gate.** A missed item draws immediate feedback and its mirror-pair twin or the consequence flip; the checks can be replayed; the measurement store keeps the first answer per item per stage.
- **Policies:** if the organisation attaches its confidentiality or information governance policy, acknowledging it can be part of completion (a later platform option, feature-level only).

## Evidence for auditors

The record (in game globals; a server-side record only if productised, build decision R) shows, per role and per stage: item ids, verdicts and consequence-flip decisions, chips, the defend score and the pre-to-post change, with no free text and no learner identity. The organiser also sees the discrimination figure; learners never do. This supports:

- DSPT B6.a and B6.b for organisations on the CAF-aligned toolkit;
- DSPT 3.2.1 (categories 3 and 4) and DSPT 2.1.1 (categories 3 and 4), with the core modules, once the GP practice and care home editions exist;
- NCSC CAF B6.b;
- UK GDPR Art 32(4), and Art 33 through prompt internal reporting;
- the ICO training toolkit;
- CIS 14.4, 14.5 and 14.6;
- ISO 27001 A.6.3 where the organisation is certified;
- HIPAA 164.308(a)(5) for US healthcare customers.

See `02_COMPLIANCE_MAPPING.md` for the full references. The product makes no effectiveness claim.

## Measuring effect

Outside the course, an organisation can watch: inappropriate access flags from the record system's monitoring (which should fall); self-reported breaches (which should rise at first, then the time to report falls); phishing reports from shared mailboxes; smartcards found left in readers during walkabouts; whether wards find and use their downtime pack in exercises; misdirected-information incidents (which should fall); and phone-enquiry spot checks handled by the procedure. These need the record system's audit reports, the IG incident log and walkabout results. Any dashboard shows them by ward or department, never by named individual, and the product claims no effectiveness.
