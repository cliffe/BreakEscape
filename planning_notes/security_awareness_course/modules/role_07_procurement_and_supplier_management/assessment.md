# role_07 assessment

role_07 is a new role, so it needs its **own supplier-and-procurement check-form pair**, proposed below. The module is measured by that pair and by the defend half of the attack-first episode, with the tiering, evidence, clause and offboarding behaviours evidenced in the consequence-flip episode. Scored recognition sits only in the defend half and the checks, with no default pass mark (build decision R6). The behaviours and Q items keep their stable ids and are mapped onto these built forms, with mirror pairs (aw5).

## Proposed new check pair

**`awareness_{pre,post}_procurement_{ab,ba}`.** A triage set of supplier-facing messages, built with the existing inbox-triage engine. Ten items each, 4 phish, matched flag multisets, A and B disjoint on phish slots, counterbalanced AB and BA, `passPercent: 0`, feedback at the end, Verify on. Each phish is mirror-paired with a close genuine twin:

| # | Phish item | Genuine twin | Flags |
|---|---|---|---|
| 1 | A fake supplier breach notice asking for credentials | A genuine breach notice asking you to call a held number | breach pretext, credential lure |
| 2 | A fake "grant our engineer access" request | A genuine access request through the IT gateway | access request, no change ticket |
| 3 | A claims-only bid email with a link to "evidence" | A genuine bid with an evidenced certificate for the service | claims only, link credibility |
| 4 | A supplier "new bank details" email, look-alike domain | A genuine change confirmed by call-back | look-alike domain, changed bank details |

(Six genuine items in all, including the four twins, so the pair balances like the built role checks; authoritative counts live in the scenario files when built.)

## Assessed behaviours

Each row is recorded through the measurement store (`systems/awareness-measure.js`): item id, verdict or decision, chips, score, stage and time, ids only, first answer wins, no free text, no learner identity. "Secure, Developing, Not yet" is an authoring rubric, not a shipped grade; the shipped output is the defend score, the per-item verdicts, the consequence-flip decisions and the pre-to-post change.

| Id | Behaviour | Learning outcome | Where it is evidenced | Good answer | Weaker answer |
|---|---|---|---|---|---|
| R07-B1 | Responds to "sign today" on claims | LO2, LO3 | **Consequence-flip episode** | Asks what it holds and reaches, asks for evidence | Signs on the claims |
| R07-B2 | Judges a bid's evidence | LO3 | Consequence-flip episode; procurement check item 3 | Spots the scope trick and the unnamed affiliate | Takes the badges at face value |
| R07-B3 | Recommends a supplier | LO2, LO3 | Consequence-flip episode | An evidenced bidder, with conditions for its gaps | The claims-only bidder |
| R07-B4 | Holds the clauses that matter | LO4 | Consequence-flip episode | Holds notice within hours, named subcontractors, deletion certificate, access rules, yearly assurance | Trades the key ones away |
| R07-B5 | Sets up the supplier's access | LO1, LO5 | Consequence-flip episode | Named accounts, MFA, least privilege, time-limited, logged | One shared account, no MFA, permanent |
| R07-B6 | Responds to a breach notice | LO1, LO6 | **Attack-first defend; procurement check item 1** | Verify, escalate to security and the DPO at once, ask the five questions | Waits for the full report, or hands over credentials |
| R07-B7 | Ends the supplier's access | LO5 | Consequence-flip episode (the exit flip) | Removes every account, key, profile and delegation; rotates secrets; gets the deletion certificate | Closes the contract only |
| R07-B8 | Sorts claims from evidence, and spots impersonation | LO3, LO6 | **Attack-first defend; the procurement checks** | Reports the impostors; asks the claims-only bidder for evidence; trusts the genuine twins | Trusts an impostor, or over-flags a genuine twin |

**Before and after.** The procurement post-check against the newest procurement pre-check gives the measured change on the message-facing outcomes. The comparison panel shows it only when a baseline exists, and says so when there is none. There is no effectiveness claim beyond a cohort's change on matched items. Asking for more evidence than a tier needs draws a calibration note, not a penalty; reporting is never penalised.

## Critical behaviours

Kept as authoring priorities, not hard gates (the build has no loop-back gate; a missed item draws immediate feedback, its mirror-pair twin, or the consequence flip):

- **R07-CB1** Don't choose a supplier on claims (R07-B3): the consequence-flip episode.
- **R07-CB2** Control supplier access from the first day to the last (R07-B5 and B7): the consequence-flip episode.
- **R07-CB3** Escalate a supplier's breach notice at once, and don't hand over credentials to a fake one (R07-B6): the attack-first defend set and the checks.

## Knowledge check bank

The twelve Q items keep their ids and become a candidate pool for procurement check stems, defend items, consequence-flip choices and concept cards. Delivery is tagged, with mirror pairs noted:

- **R07-Q1 (LO1)** The supplier's supplier breach. Concept card (four ways a supplier can hurt you).
- **R07-Q2 (LO1)** A supplier outage with no attacker. Concept card.
- **R07-Q3 (LO2)** Which supplier needs the deepest checks. Consequence-flip tiering choice.
- **R07-Q4 (LO2)** The full questionnaire for a window cleaner. Concept card (proportionate).
- **R07-Q5 (LO3)** The certificate whose scope is the sales office. Consequence-flip evidence choice; a candidate "hard" check stem.
- **R07-Q6 (LO3)** What to check on a Cyber Essentials certificate. Concept card (evidence ladder).
- **R07-Q7 (LO4)** Why push for a number of hours on breach notice. Concept card (clauses).
- **R07-Q8 (LO4)** "Our trusted partners" as subcontractors. Concept card (clauses).
- **R07-Q9 (LO5)** The permanent shared admin account without MFA. Consequence-flip access choice; a candidate check item (the access request).
- **R07-Q10 (LO5)** What still needs doing after the contract ends. Consequence-flip exit choice.
- **R07-Q11 (LO6)** The Friday 17:30 breach notice. **Built as the attack-first breach-notice item and procurement check item 1**, mirror-paired with a genuine notice.
- **R07-Q12 (LO6)** The first questions to put to a breached supplier. Concept card.

## Reflection prompt

- "Pick one supplier you manage. What does it hold, what can it reach, and how would you find out if it had a breach?"
- For facilitated sessions: "Which supplier would hurt us most if it stopped tomorrow, and what do our contracts say about that?"

## Completion and pass rules

- **Complete** when the learner has played the episodes (or the defend-only variant and the consequence flip), seen the per-item feedback and the debriefs, and taken the procurement post-check. There is no default pass mark (R6); a pass mark is an organisation setting on the procurement post-check percent, not a default.
- **No retake gate.** A missed item draws immediate feedback and its mirror-pair twin or the consequence flip; the checks can be replayed; the measurement store keeps the first answer per item per stage.

## Evidence for auditors

The record (in game globals; a server-side record only if productised, build decision R) shows, per role and per stage: item ids, verdicts and consequence-flip decisions, chips, the defend score and the pre-to-post change, with no free text and no learner identity. The organiser also sees the discrimination figure; learners never do. This supports (short references from `02_COMPLIANCE_MAPPING.md`):

- ISO 27001 cl. 7.2;
- NIST AT-3 (which names acquisition and procurement officials);
- CIS 14.9;
- NCSC CAF B6.b; DSPT 10.2.1 (supports, categories 3 and 4);
- NIS2 Art 21(2)(d) and NIS2 IR 5.1.4 where they apply; DORA Art 30(2)(i) for EU financial entities;
- UK GDPR Art 28 (context: staff know what a processor contract must contain);
- FTC 314.4(f) (supports) and CMMC AT.L2-3.2.2 for US customers.

It also shows that the people who buy and manage suppliers were trained in the organisation's supplier security process (ISO 27001 A.5.19 to A.5.23 and NCSC CAF A4, controls rather than training requirements). The product makes no effectiveness claim.

## Measuring effect

Outside the course, an organisation can watch: supplier register coverage (a tier, an owner and a review date per supplier); the share of high-tier contracts with the key clauses; evidence re-checked before it expired; the share of supplier accounts that are named, MFA-protected and time-limited, and the time from contract end to removal; the time from a supplier breach notice to the security team and the DPO; and the hook-to-recommendation change in the course itself. These need the supplier register, contract records, access reviews and the incident log. Any dashboard shows them by team, never by named individual, and the product claims no effectiveness.
