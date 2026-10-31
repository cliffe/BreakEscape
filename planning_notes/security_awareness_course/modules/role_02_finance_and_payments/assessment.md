# role_02 assessment

role_02 is measured by the built **finance pre and post check pair** and by the defend halves of E1, E7 and the new finance episode, scored only in the defend half and in the checks, with no default pass mark (build decision R6). The behaviours and Q items below keep their stable ids and are mapped onto those built forms, with mirror pairs (aw5).

## Which forms measure this module

- **Finance check pair (built):** `awareness_{pre,post}_finance_{ab,ba}`. Ten items each, 4 phish, matched flag multisets, A and B disjoint on phish slots, counterbalanced AB and BA, `passPercent: 0`, feedback at the end, each look-alike bank change paired with the real supplier's invoice (a mirror pair). The scenario files set Verify on (differing from `BRAND_SET.md` §6; the scenario file wins). This is role_02's measured check; **no new check pair is needed** (R7).
- **Defend sets (built and new):** E1 `e1_payments_inbox` (6 emails, 3 phish, Verify on); E7's finance line (3 voicemails and 2 emails, 2 phish); and the new finance episode's payroll and refund set (mirror pairs). All scored in the defend half.

## Assessed behaviours

Each row is recorded through the measurement store (`systems/awareness-measure.js`): item id, verdict, chips, score, stage and time, ids only, first answer wins, no free text, no learner identity. "Secure, Developing, Not yet" is kept as an authoring rubric for difficulty and feedback, not a shipped grade; the shipped output is the defend score, the per-item verdicts and the pre-to-post change.

| Id | Behaviour | Learning outcome | Where it is evidenced (built unless marked new) | Good answer | Weaker answer |
|---|---|---|---|---|---|
| R02-B1 | Verifies an unusual change request | R02-LO1 | E1 defend (look-alike bank change); finance checks | Verify on a held number, or Report | Trusts the change |
| R02-B2 | Reads the data for red flags in a run | R02-LO2 | Finance checks (changed account, no match, reply-to differs) | Holds and verifies the flagged item | Pays it |
| R02-B3 | Resolves a changed-account item | R02-LO1 | E1 defend; finance checks | Verify on the number from the contract | Verify on the new number, or pay |
| R02-B4 | Handles a "confirm our details" approach | R02-LO1 | Finance checks (`pretextRelevant`, `linkCredible` items) | Report; never confirm or read back | Confirms |
| R02-B5 | Handles the "pay today" from the top | R02-LO3 | **E7 defend** (voicemail and email) | Verify the chief executive another way; keep the process | Releases the payment |
| R02-B6 | Keeps dual control under pressure | R02-LO3 | E7 debrief concept card; finance checks (`secrecy_or_bypass`) | Keeps two approvers, says no to a bypass | Bypasses the second check |
| R02-B7 | Leads the first hour after a fraud | R02-LO5 | **New: the first-hour concept card and defend item** | Bank first, then evidence, security, DPO, pay the person, Report Fraud | Tells the person to ring their own bank, or waits |
| R02-B8 | Handles card data by email | R02-LO6 | **New: the card-photo defend item** | Delete by procedure, reply with the link, tell security | Takes the payment from the photo |
| R02-B9 | Verifies payees and changes | R02-LO1 | E1 and finance checks (multiple items) | Verifies each | Trusts them |
| R02-B10 | Handles payroll and refunds | R02-LO4 | **New: the payroll and refund defend items** | HR route and direct confirmation; refund the way the money came | Updates from an email; refunds to a new account |
| R02-B11 | Lets genuine items through | R02-LO2 | E1 genuine items; finance-check genuine items; the mirror twins | Trusts the genuine twin | Over-flags (never scored as "Not yet"; feedback explains why it was fine) |

**Before and after.** The finance post-check against the newest finance pre-check gives the measured change. The comparison panel shows it only when a baseline exists, and says so when there is none. There is no effectiveness claim beyond a cohort's change on matched items. Reporting is never penalised, and over-caution on a genuine item draws feedback, not a penalty.

## Critical behaviours

Kept as authoring priorities, not hard gates (the build has no loop-back gate; a missed item draws immediate feedback and its mirror-pair twin):

- **R02-CB1** Verify a changed account before its first payment, on a number from before the change (R02-B3): E1 and the finance checks.
- **R02-CB2** Keep dual control; say no to a bypass (R02-B6): E7's debrief card and the `secrecy_or_bypass` check items.
- **R02-CB3** Ring the bank first when money has gone (R02-B7): the new first-hour concept card and defend item.

An organisation that takes card payments can treat R02-B8 as a fourth priority.

## Knowledge check bank

The twelve Q items keep their ids and become a candidate pool for finance check stems, defend items and concept cards. Delivery is tagged, with mirror pairs noted:

- **R02-Q1 (LO1)** Portal change, first payment, no match. **Built as E1 and finance-check items**, mirror-paired with a genuine change.
- **R02-Q2 (LO1)** The poisoned record (the record's own phone number was changed). A concept card and a candidate "hard" check stem (the tell in the change history).
- **R02-Q3 (LO2)** Which rows to hold. A concept card listing the run red flags.
- **R02-Q4 (LO2)** The hotspot on a suspect set-up. Candidate check stem; the odd time, no order and amount under the limit.
- **R02-Q5 (LO3)** Leftover approver access at the cut-off. Concept card on dual control.
- **R02-Q6 (LO3)** The chief executive voicemail. **Built as the E7 voicemail defend item**, mirror-paired with a genuine finance voicemail.
- **R02-Q7 (LO4)** Payroll "new bank before payday". **New defend item**, mirror-paired with the genuine HR-system change.
- **R02-Q8 (LO4)** Refund to a new account. **New defend item**, mirror-paired with a refund the way the money came.
- **R02-Q9 (LO5)** The first-hour order. Concept card: bank's fraud line first.
- **R02-Q10 (LO5)** Whose bank recalls the money. Concept card: the paying organisation's bank.
- **R02-Q11 (LO6)** Card photo by email. **New defend item**, mirror-paired with a secure-link payment.
- **R02-Q12 (LO6)** Which card handling is fine. Concept card: masking, the secure link, never the security code.

**New finance episode defend set (mirror pairs).** The four pairs in the structure table (payroll "new bank" vs HR notification; refund to a changed account vs refund the way it came; supplier change with no match vs a match confirmed by phone; card photo by email vs the secure link). Item counts and matched flag multisets follow the finance forms so a role_02 defend set passes the validator's balance lint; the authoritative counts live in the scenario file if and when the shell is built.

## Reflection prompt

- "Look at your own last payment run. Which of today's red flags would our system have shown you, and which would you only have spotted by looking?"
- For facilitated sessions: "What would make it easy for anyone on this team to say 'I did that' the moment they realise?"

## Completion and pass rules

- **Complete** when the learner has played the episodes (or the defend-only variants), seen the per-item feedback and the debriefs, and taken the finance post-check. There is no default pass mark (R6); a pass mark is an organisation setting on the finance post-check percent, not a default.
- **No retake gate.** A missed item draws immediate feedback and its mirror-pair twin; the checks can be replayed; the measurement store keeps the first answer per item per stage.
- **Prerequisite:** core_11 is recommended, not required.

## Evidence for auditors

The record (in game globals; a server-side record only if productised, build decision R) shows, per role and per stage: item ids, verdicts, chips, the defend score and the pre-to-post change, with no free text and no learner identity in the block. The organiser also sees the discrimination figure (hits on phish against false alarms); learners never do. This supports (short references from `02_COMPLIANCE_MAPPING.md`):

- ISO 27001 cl. 7.2 and A.6.3;
- NIST AT-3 and AT-2(3);
- CIS 14.9;
- PCI DSS 12.6.1 and 12.6.3.1, and PCI DSS 9.5.1.3 in part where staff use card terminals;
- NCSC CAF B6.b;
- NIS2 IR 8.2 and DORA Art 13(6) where they apply; NYDFS 500.14(a)(3) and SOC 2 CC1.4 for US customers.

It also shows finance staff were trained in the organisation's own payment controls and card data rules, which assessors, insurers and banks ask about after a payment fraud. The product makes no effectiveness claim.

## Measuring effect

Outside the course, an organisation can watch: the share of bank detail changes with a recorded call-back to a number held before the request; holds per run and what they turned out to be; name-check overrides released without a recorded check; approvals by the right people; time from discovery to the bank's fraud line; payroll changes made outside the HR system; card data found where it shouldn't be; and losses and recoveries each year. These need the finance system's change log and payment data, the incident log and access reviews. Any dashboard shows them by team, never by named individual, and the product claims no effectiveness.
