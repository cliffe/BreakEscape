# role_06 assessment

role_06 is a new role, so it needs its **own customer-verification check-form pair**, proposed below. The module is measured by that pair and by the defend half of the role-swap episode, scored only in the defend half and in the checks, with no default pass mark (build decision R6). The behaviours and Q items keep their stable ids and are mapped onto these built forms, with mirror pairs (aw5). Nothing is rated on speed; the queue has no countdowns.

## Proposed new check pair

**`awareness_{pre,post}_customer_{ab,ba}`.** A triage set of customer calls, chats and texts, built with the existing inbox-triage engine (the `call`, `sms` and `page` kinds, the Verify verdict, the claimed facts shown by label). Ten items each, 4 phish, matched flag multisets, A and B disjoint on phish slots, counterbalanced AB and BA, `passPercent: 0`, feedback at the end, Verify on. Each phish is mirror-paired with a close genuine twin:

| # | Phish item | Genuine twin | Flags |
|---|---|---|---|
| 1 | "New phone, send the reset to this number" | A genuine locked-out customer on the number on file | new details, reset |
| 2 | "New office manager, send the invoices and contact list here" (free webmail) | A genuine named contact, documents to the address on file | blagging, free webmail |
| 3 | "Redirect our payout to my new account" after a recent email change | A genuine change confirmed by call-back on the old number | changed details, money |
| 4 | An angry "council officer: read me the bank details you hold" | A genuine customer with a normal finance query | authority, data request |

(Six genuine items in all, including the four twins, so the pair balances like the built role checks; authoritative counts live in the scenario files when built.)

## Assessed behaviours

Each row is recorded through the measurement store (`systems/awareness-measure.js`): item id, verdict, chips, score, stage and time, ids only, first answer wins, no free text, no learner identity. "Secure, Developing, Not yet" is an authoring rubric, not a shipped grade; the shipped output is the defend score, the per-item verdicts and the pre-to-post change. The role-swap records which checks happened before which actions, in order.

| Id | Behaviour | Learning outcome | Where it is evidenced | Good answer | Weaker answer |
|---|---|---|---|---|---|
| R06-B1 | Handles a "new mobile, send the reset" call | LO1, LO2 | Role-swap defend; customer check item 1 | Call back, or reset to details on file | Sends the reset to the new mobile |
| R06-B2 | Handles a takeover payout redirect | LO2, LO1 | Role-swap defend; customer check item 3 | Change history, then call back on the old number | Sends an approval to the changed email, or makes the change |
| R06-B3 | Handles a chat asking for documents | LO4 | Role-swap defend; customer check item 2 | Offers the address on file, shares no contacts list, reports | Sends anything to the free webmail |
| R06-B4 | Holds the line with an angry caller | LO3, LO4 | Role-swap defend; customer check item 4 | Polite, reads nothing out, escalates, reports | Reads out any details |
| R06-B5 | Protects a scammed customer | LO5 | Role-swap defend (the scam-victim item) and concept card | Tells plainly, 159, Report Fraud, reports internally | Misses it |
| R06-B6 | Takes a card payment safely | LO6 | Role-swap defend (the card item) and concept card | Stops the read-out, uses the secure route | Types the number, or asks for the security code |
| R06-B7 | Checks without leaking data | LO4 | Every role-swap item | Open questions throughout | Reads details out |
| R06-B8 | Calibrates with genuine callers | LO1 | The genuine twins | Standard check, prompt answer | Over-checks (calibration note, not "Not yet") |
| R06-B9 | Reports fraud attempts | LO3 | Role-swap defend; the checks | Reports or flags the impostor items | Reports none |

**Before and after.** The customer post-check against the newest customer pre-check gives the measured change. The comparison panel shows it only when a baseline exists, and says so when there is none. There is no effectiveness claim beyond a cohort's change on matched items. Over-caution on a genuine twin draws a calibration note, not a penalty; reporting is never penalised.

## Critical behaviours

Kept as authoring priorities, not hard gates (the build has no loop-back gate; a missed item draws immediate feedback and its mirror-pair twin):

- **R06-CB1** Don't make a change, or send a reset or approval to new details, for an unverified caller (R06-B2): the takeover items.
- **R06-CB2** Take card details only through the secure route (R06-B6): the card item and concept card.
- **R06-CB3** Report a suspected fraud attempt (R06-B9): across the defend set.

## Knowledge check bank

The twelve Q items keep their ids and become a candidate pool for customer check stems, defend items and concept cards. Delivery is tagged, with mirror pairs noted:

- **R06-Q1 (LO1)** A reset after three knowledge checks. **Built as a check item**, mirror-paired with a genuine reset request.
- **R06-Q2 (LO1)** The strongest check for a delivery/contact change. Concept card (know versus have).
- **R06-Q3 (LO2)** The change-history hotspot. **Built as the takeover check item.**
- **R06-Q4 (LO2)** "Send the code to my new mobile." **Built as check item 1.**
- **R06-Q5 (LO3)** The angry "council" caller. **Built as check item 4**, mirror-paired with a genuine finance query.
- **R06-Q6 (LO3)** "I'll be in trouble for making them wait" (false). Concept card (the team leader backs the procedure).
- **R06-Q7 (LO4)** The chat asking for invoices and contacts. **Built as check item 2.**
- **R06-Q8 (LO4)** Which question checks without leaking. Concept card (ask, don't tell).
- **R06-Q9 (LO5)** The scammed customer. **Built as a defend item**, mirror-paired with a genuine query; concept card (159, Report Fraud).
- **R06-Q10 (LO6)** A card number read aloud. **Built as a defend item**, mirror-paired with a secure-route payment.
- **R06-Q11 (LO6)** "Recordings are encrypted" (false). Concept card.
- **R06-Q12 (LO3)** A failed attempt still worth reporting. Concept card (failed attempts show the pattern).

## Reflection prompt

- "When did a caller last make you want to skip a step? What would have made it easier to hold the line?"
- For facilitated sessions: "What do our customers know that a stranger could find in ten minutes, and which of our checks still rely on it?"

## Completion and pass rules

- **Complete** when the learner has played the episode (or the defend-only variant), seen the per-item feedback and the debrief, and taken the customer post-check. There is no default pass mark (R6); a pass mark is an organisation setting on the customer post-check percent, not a default.
- **No retake gate.** A missed item draws immediate feedback and its mirror-pair twin; the checks can be replayed; the measurement store keeps the first answer per item per stage.
- **Policies:** if the organisation attaches its verification or payment card policy, acknowledging it can be part of completion (a later platform option, feature-level only).

## Evidence for auditors

The record (in game globals; a server-side record only if productised, build decision R) shows, per role and per stage: item ids, verdicts, chips, the defend score and the pre-to-post change, with no free text and no learner identity. The organiser also sees the discrimination figure; learners never do. This supports:

- PCI DSS 12.6.3.1 (with core_01 and core_02 for phishing), PCI DSS 12.6.1, and, where the front desk item is used, PCI DSS 9.5.1.3;
- CIS 14.2 and 14.9;
- NIST AT-2(3) and AT-3;
- ISO 27001 cl. 7.2 and A.6.3;
- UK GDPR Art 32(4);
- NCSC CAF B6.b;
- NYDFS 500.14(a)(3) for US financial services customers.

See `02_COMPLIANCE_MAPPING.md` for the full references. PCI DSS 12.6.3 also asks for training on hire and every twelve months using more than one method; this module is one method, and the platform's records show the timing. The product makes no effectiveness claim.

## Measuring effect

Outside the course, an organisation can watch: account takeover attempts stopped and succeeded; step-up checks on high-risk requests in call quality reviews; reported attempts per month (which should rise at first) and time from attempt to report (which should fall); leading questions in quality reviews (which should fall); card data found in notes, emails, chats or recordings (which should fall to none); and customers protected from scams (interventions logged by advisers). These need fraud and quality-review data and the organisation's own card-data scans. Any dashboard shows them by team, never by named individual, and the product claims no effectiveness.
