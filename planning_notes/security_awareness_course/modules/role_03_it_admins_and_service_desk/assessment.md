# role_03 assessment

role_03 is measured by the built **helpdesk pre and post check pair** and by the defend halves of E3 (the role swap) and the new least-privilege episode, scored only in the defend half and in the checks, with no default pass mark (build decision R6). The behaviours and Q items below keep their stable ids and are mapped onto those built forms, with mirror pairs (aw5).

## Which forms measure this module

- **Helpdesk check pair (built):** `awareness_{pre,post}_helpdesk_{ab,ba}`. Ten items each, 4 phish, a mix of emails, calls, a voicemail and a push, Verify on in the scenario files, A and B disjoint on phish slots, counterbalanced AB and BA, `passPercent: 0`, feedback at the end. This is role_03's measured check; **no new check pair is needed** (R7).
- **Defend sets (built and new):** E3's role swap (3 calls, 2 impostor and 1 genuine, plus 1 unrequested push, Verify on, claimed facts shown by label); the new episode's consent, tooling and alert set (mirror pairs). All scored in the defend half.

## Assessed behaviours

Each row is recorded through the measurement store (`systems/awareness-measure.js`): item id, verdict, chips, score, stage and time, ids only, first answer wins, no free text, no learner identity. "Secure, Developing, Not yet" is an authoring rubric for difficulty and feedback, not a shipped grade; the shipped output is the defend score, the per-item verdicts and the pre-to-post change. "How soon" is measured in story events (before the next call, before the alert), never in real minutes.

| Id | Behaviour | Learning outcome | Where it is evidenced (built unless marked new) | Good answer | Weaker answer |
|---|---|---|---|---|---|
| R03-B1 | Handles the locked-out "manager" | LO1, LO2 | **E3 role-swap call items; helpdesk checks** | Call back on the number on record; refuse politely | Acts on the facts the caller knows |
| R03-B2 | Handles the unrequested push | LO2, LO6 | **E3 push item; helpdesk checks** | Deny and report a push nobody started | Approves it |
| R03-B3 | Picks the check that fits the risk | LO2, LO3 | E3 role swap (the claimed facts shown by label); helpdesk checks | The strong check for the account type | A weak, public-fact check |
| R03-B4 | Handles a contractor's admin request | LO3 | **New: the admin-access defend item** | Separate admin account, least rights, approval, an end date, phishing-resistant MFA | Domain admin on the normal account |
| R03-B5 | Handles the app consent request | LO4 | **New: the broad-consent defend item** | Report; send for security review; offer the approved tool | Approves the broad app |
| R03-B6 | Acts on the sign-in alert after a reset | LO5 | **New: the post-reset alert item** | Escalate to security before anything else | Closes it as "probably a VPN" |
| R03-B7 | Supports a colleague's report | LO6 | E3 and new-episode debriefs (no-blame card) | "Let's tell security together, now" | "Fix it quietly" |
| R03-B8 | Handles the supplier's remote tool | LO4 | **New: the remote-tool defend item** | Verify; refuse to whitelist; book the gateway route; remove and report | Whitelists it |
| R03-B9 | Handles the request to switch protection off | LO4 | **New: the disable-security defend item** | Raise a change to tune, not disable | Turns it off |
| R03-B10 | Handles an MFA reset on a privileged account under pressure | LO2, LO6 | **E3 role-swap privileged call; helpdesk checks** | Verify through a route the caller doesn't control; refuse politely; escalate | Resets on what the caller knows |

**Before and after.** The helpdesk post-check against the newest helpdesk pre-check gives the measured change. The comparison panel shows it only when a baseline exists, and says so when there is none. There is no effectiveness claim beyond a cohort's change on matched items. A refusal that turns out to be a genuine caller is never counted against anyone; reporting is never penalised.

## Critical behaviours

Kept as authoring priorities, not hard gates (the build has no loop-back gate; a missed item draws immediate feedback and its mirror-pair twin):

- **R03-CB1** Never change MFA on a privileged or executive account on what the caller knows or on caller ID alone (R03-B10): E3 and the helpdesk checks.
- **R03-CB2** Escalate a suspicious sign-in after a reset (R03-B6): the new episode's alert item.
- **R03-CB3** Don't approve an app with organisation-wide mail and file access (R03-B5): the new episode's consent item.

## Knowledge check bank

The twelve Q items keep their ids and become a candidate pool for helpdesk check stems, defend items and concept cards. Delivery is tagged, with mirror pairs noted:

- **R03-Q1 (LO1)** What the right facts prove. Concept card; a candidate "easy" check stem.
- **R03-Q2 (LO2)** The caller's new call-back number. **Built as an E3 call item**, mirror-paired with a genuine caller reachable on the number on record.
- **R03-Q3 (LO2)** The order of steps to move the chief executive's authenticator. Concept card (the ladder).
- **R03-Q4 (LO1, LO6)** Which are pressure tactics. Concept card on the lever cards.
- **R03-Q5 (LO3)** The contractor's admin account. **New defend item**, mirror-paired with a correctly scoped admin account.
- **R03-Q6 (LO3)** Reading email as an admin. Concept card on least privilege.
- **R03-Q7 (LO4)** The broad-consent app. **New defend item**, mirror-paired with the approved narrow tool.
- **R03-Q8 (LO4)** The supplier's remote tool. **New defend item**, mirror-paired with a genuine gateway session.
- **R03-Q9 (LO5)** The sign-in a minute after a reset. **New defend item**, mirror-paired with a genuine travelling user.
- **R03-Q10 (LO5)** Which signals go to security. Concept card on the alerts after a reset.
- **R03-Q11 (LO6)** Supporting a colleague who slipped. Concept card (no blame); the debrief line.
- **R03-Q12 (LO6, LO2)** The real chief executive on the office line. **Candidate helpdesk-check call item** (caller ID can be faked), mirror-paired with a genuine in-person verification.

**New episode defend set (mirror pairs).** The four pairs in the structure table (broad consent vs approved tool; remote-tool whitelist vs gateway session; post-reset anomaly vs travelling user; disable security vs tune it). Item counts and matched flag multisets follow the helpdesk forms so a role_03 defend set passes the validator's balance lint; the authoritative counts live in the scenario file if and when the shell is built.

## Reflection prompt

- "Which part of our own reset procedure would be hardest to follow with a senior person shouting on the line, and what would make it easier?"
- For facilitated sessions: "What makes people on our desk skip checks: targets, queues, fear of senior callers? What one change would help?"

## Completion and pass rules

- **Complete** when the learner has played the episodes (or the defend-only variants), seen the per-item feedback and the debriefs, and taken the helpdesk post-check. There is no default pass mark (R6); a pass mark is an organisation setting on the helpdesk post-check percent, not a default.
- **No retake gate.** A missed item draws immediate feedback and its mirror-pair twin; the checks can be replayed; the measurement store keeps the first answer per item per stage.

## Evidence for auditors

The record (in game globals; a server-side record only if productised, build decision R) shows, per role and per stage: item ids, verdicts, chips, the defend score and the pre-to-post change, with no free text and no learner identity in the block. The organiser also sees the discrimination figure; learners never do. This supports:

- NIST AT-3 and AT-2(3);
- CIS 14.9;
- ISO 27001 cl. 7.2 and A.6.3;
- NCSC CAF B6.b, and DSPT 3.3.1 for NHS customers;
- PCI DSS 12.6.3.1, and PCI DSS 12.10.4 in part;
- NIS2 IR 8.2 and IR 10.1 where the Implementing Regulation applies; DORA Art 13(6);
- UK GDPR Art 32;
- NYDFS 500.10(a)(2), FTC 314.4(e)(3), CMMC AT.L2-3.2.2 and SOC 2 CC1.4 for US customers.

The record is awareness-level evidence for IT and service desk roles. It is not evidence of technical competence or of full incident response team training (PCI DSS 12.10.4); pair it with Hacktivity's technical labs for those staff. The product makes no effectiveness claim.

## Measuring effect

Outside the course, an organisation can watch: resets with a recorded strong check; privileged and executive resets with a second analyst; time from a suspicious sign-in after a reset to escalation; self-reported slips (which should rise at first, a sign of trust); unapproved remote tools found in audits and consent requests sent for review; the share of administrators with separate admin accounts and phishing-resistant MFA; and, if the organisation commissions social engineering tests of its desk, the share of test calls refused or verified. These come from the service desk tool, the identity platform and the security team's records, are reported by team, never used to rank individual analysts, and a refusal that turns out to be genuine is never counted against anyone. The product claims no effectiveness.
