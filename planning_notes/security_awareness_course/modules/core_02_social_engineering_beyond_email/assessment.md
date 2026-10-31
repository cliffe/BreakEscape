# core_02 assessment

The built product measures the beyond-email outcomes through the **scored defend half** of E3 and E6 (and the voicemail cards in E4 and E7) and the **helpdesk and mobile pre and post check** forms. Both use the awareness scoring profile (60 for the verdict, 40 for the flags) and per-item awareness-measure records (item id, form, verdict, chips, score, stage and time; no free text, no identity). E3's role swap is scored by its own rules and shown as a percent. There is **no default pass mark**: the check missions set the pass percent to 0 and are scored for completion. A pass mark is a later organisation option on the post-check percent.

The plan's behaviours and question items are kept as **candidate items**: each maps onto a defend item or a check item, and the critical behaviours become **mirror pairs** (an impostor matched with a genuine caller or message of the same shape).

## Assessed behaviours

Ids are unchanged. Each behaviour is now a scored move in a defend set or a check form. "Mirror pair" names the matched genuine item that makes it measurable before and after.

| Id | Behaviour (the scored move) | Learning outcome | Where it is scored | Mirror pair |
|---|---|---|---|---|
| C02-B1 | Refuses to hand over a code on a pretext call | LO2, LO4 | E3 role-swap call cards; helpdesk check calls | The genuine, awkward caller in the same set |
| C02-B2 | Handles the authority "code now" call | LO1, LO4, LO6 | E3 call cards; helpdesk checks | A genuine caller who needs the safe route |
| C02-B3 | Handles the remote-access or tech-support call (new item) | LO2, LO4 | new E3 defend item; helpdesk check | A genuine scheduled-maintenance call |
| C02-B4 | Handles the smishing text | LO1, LO6 | E6 text cards; mobile checks | A genuine delivery or depot text |
| C02-B5 | Handles the chat-app impersonation (new item) | LO2, LO3 | new E6 defend item; mobile check | A genuine message from a known number |
| C02-B6 | Decides on the QR notice before scanning | LO5 | E6 QR cards (`qr`); mobile checks | A genuine posted notice |
| C02-B7 | Serves the genuine caller well (calibration) | LO3 | E3 genuine call; the discrimination figure (organisers only) | The impostor calls are its mirror |
| C02-B8 | Reports the attempt | LO6 | the Report verdict in every defend set, never penalised | (not a pair: Report is the universal safe move) |
| C02-B9 | Picks the check-back or callback route | LO3 | E3 verification script; the Verify verdict | The number or link in the message is the wrong route |
| C02-B10 | Names the levers used (the flag chips) | LO1 | 40 of each item's score; the closed chip list | missed flags named on the reasoning card |

Reporting a genuine message is never scored as wrong. The attack half (the pretext call, the push run, the composed text) is never scored.

## Critical behaviours

The build gates completion on finishing the defend half and the debrief, not on a behaviour. What the plan called critical behaviours are kept as the **must-include mirror pairs** every form and defend set carries:

1. **C02-CB1 Refuse a code or remote access:** every helpdesk set includes an impostor whose right move is to refuse and report, matched with a genuine caller who must still be served safely.
2. **C02-CB2 Check back through a trusted route:** every set includes an item whose only safe move is a callback or a known number, matched with a genuine item from a known number.
3. **C02-CB3 Report the attempt:** the Report verdict is on every card, always available and never penalised.

A mishandled item is explained at once, and a similar item follows; the awareness profile locks the first answer, so the similar item is a fresh chance. There is no loop-back gate in the built product.

## Knowledge check bank

The question items are the pool the helpdesk and mobile forms and the E3 and E6 defend sets draw from, authored as triage cards (a call, text, push, QR or voicemail to sort) or flag-naming prompts. Built forms are 10 items each (4 phish in 10), matched flag multisets, feedback at the end, `passPercent: 0`, A and B sharing no phish slots. Ids are kept as authoring notes.

### C02-Q1 (LO1, LO4) is the "read me the code" call

Built as a helpdesk `call` card: refuse, end, report. Flags for authority and the code request. Mirror: a genuine caller who needs the safe route.

### C02-Q2 (LO3) is the "move your money to a safe account" bank call

Built as a check `call` card: hang up and call 159 or the number on the card. Mirror: a genuine bank message that asks nothing.

### C02-Q3 (LO1) is the pressure-tactics item

Built as the flag-chip naming on any pushy call: urgency, secrecy, helpfulness. Not a standalone quiz item.

### C02-Q4 (LO2, LO3) is the new-number gift-card chat

Built as the new chat-app `sms` card (C02-B5): reach the person on the known number; report. Mirror: a genuine message from a known number.

### C02-Q5 (LO5) is the QR sticker

Built as an E6 `qr` card: do not scan to sign in; report. Mirror: a genuine posted notice.

### C02-Q6 (LO4) is the tech-support remote-access call

Built as the new remote-access `call` card (C02-B3): hang up and report; never install. Mirror: a genuine maintenance call.

### C02-Q7 (LO6) is the "I shared a code" item

Built into the debrief and the no-blame line, not a scored card; the Report verdict is the move.

### C02-Q8 (LO1) is the spoofed-number item

Built as the framing on the bank-call card: a number proves nothing; check back. Carried by the flag chips.

### C02-Q9 (LO3) is the supplier bank-change call

Built as a check `call` card that points to core_11: change nothing on the call, find the supplier's own number, call back. Mirror: a genuine supplier call that goes through process.

### C02-Q10 (LO6) is the 7726 home-route item (new)

Built as a new check item and a debrief reference-card line: forward scam texts to 7726, use 159 for bank calls, Report Fraud for the rest. The personal-scam half of LO6, in no shell today.

### C02-Q11 (LO2) is the in-person visitor item

Built into the proposed visitor episode E12 (core_10): sign them in and escort, report if pushy. Kept here as the "conversation" version and pointed to core_10.

## Reflection prompt

- "Think of the last call or message that made you want to act quickly. What would checking back on a number you already had have looked like?"
- For a facilitated session (the `facilitated` flag, not yet shipped): "What is our team's version of 'I will ring you back on the number I have'?"

## Completion and pass rules

- **Completion:** an episode is complete when the defend half and the debrief are done; a check when the form is done. Missions are scored for completion.
- **No default pass mark.** The check forms set the pass percent to 0. The post-check shows the change from the newest matched pre-check, per role, and says so when there is no baseline. A pass mark is a later organisation option.
- **No loop-back gate.** A mishandled item is explained at once, and a similar item follows.
- **No test-out.** The defend-only variant is the measured defence without the attack.

## Evidence for auditors

The per-item awareness-measure records hold the item id, form, verdict, chips, score, stage, variant and time to answer; the first answer wins. E3's role swap is recorded as a percent. No free text and no learner identity are stored. The discrimination figure (hits on impostor cards against false alarms on genuine callers) goes to organisers only; learners get genuine-item feedback instead. This supports:

- PCI DSS v4.0.1 12.6.3.1 (phishing and related attacks and social engineering);
- ISO/IEC 27001 Annex A 6.3 and clause 7.3;
- NIST SP 800-53 Rev 5 AT-2(3);
- CIS Controls v8.1 14.2 and 14.6;
- NCSC CAF B6.

See `02_COMPLIANCE_MAPPING.md`.

## Measuring effect

The product's own measure is the before-and-after change on matched helpdesk and mobile items for a cohort, with no effectiveness claim. Beyond the course, an organisation can watch reports of suspicious calls, texts and visitors, help-desk refusals to share a code or grant access, and time to report, all aggregated by department and never by named individual below a privacy threshold. Any authorised test calls the organisation runs must be kind, policy-backed and framed as practice.
