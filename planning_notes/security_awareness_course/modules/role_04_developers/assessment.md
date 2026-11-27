# role_04 assessment

role_04 is a new role, so it needs its **own developer check-form pair**, proposed below. The module is measured by that pair and by the defend half of the attack-first episode, with the secrets, test-data and code-review behaviours evidenced in the consequence-flip episode. Scored recognition sits only in the defend half and the checks, with no default pass mark (build decision R6). The behaviours and Q items keep their stable ids and are mapped onto these built forms, with mirror pairs (aw5). Nothing is rated on reading speed.

## Proposed new check pair

**`awareness_{pre,post}_developer_{ab,ba}`.** A triage set of developer-facing social-engineering messages, built with the existing inbox-triage engine (the build's triage scores messages, not code diffs, so the check measures the message-facing outcomes). Ten items each, 4 phish, matched flag multisets, A and B disjoint on phish slots, counterbalanced AB and BA, `passPercent: 0`, feedback at the end, Verify on. Each phish is mirror-paired with a close genuine twin:

| # | Phish item | Genuine twin | Flags |
|---|---|---|---|
| 1 | A "maintainer" asking you to switch to a fork and grant access | A genuine release announcement on the official channel | trust takeover, access request |
| 2 | A fake CI or registry "token expired, sign in here" notice | A genuine CI email to the known dashboard | look-alike domain, credential lure |
| 3 | An OAuth app-consent page wanting all repositories (`page` kind) | A genuine narrowly scoped approved tool | broad consent, unverified publisher |
| 4 | A recruiter lure with a "coding test" to run locally | A genuine recruiter message with nothing to run | attachment to run, pressure |

(Six genuine items in all, including the four twins, so the pair balances like the built role checks; the authoritative counts live in the scenario files when built.)

## Assessed behaviours

Each row is recorded through the measurement store (`systems/awareness-measure.js`): item id, verdict or decision, chips, score, stage and time, ids only, first answer wins, no free text, no learner identity. "Secure, Developing, Not yet" is an authoring rubric, not a shipped grade; the shipped output is the defend score, the per-item verdicts, the consequence-flip decisions and the pre-to-post change.

| Id | Behaviour | Learning outcome | Where it is evidenced | Good answer | Weaker answer |
|---|---|---|---|---|---|
| R04-B1 | Reviews a risky pull request | LO4, LO1 | **Consequence-flip episode** | Requests changes on the log line and the key | Approves without comment |
| R04-B2 | Checks a package the assistant suggested | LO2, LO3 | Consequence-flip episode; developer check (dependency item) | Checks the registry, uses the approved library, tells security | Adds the invented name |
| R04-B3 | Handles real personal data in test | LO6 | Consequence-flip episode | Stops, reports to the DPO, uses the generator | Uses it, or drops it quietly |
| R04-B4 | Handles a secret that has left their machine | LO1, LO5 | Consequence-flip episode | Rotates, replaces with a reference, tells security | Deletes in a new commit, or bypasses |
| R04-B5 | Reviews a feature change | LO4 | Consequence-flip episode | Flags the missing ownership check and the query built from input | Approves with neither caught |
| R04-B6 | Handles a "maintainer" takeover | LO5, LO2 | **Attack-first defend set; developer check item 1** | Verify officially; don't switch or grant; Report | Switches to the fork, or grants access |
| R04-B7 | Keeps branch protection on under pressure | LO5 | Consequence-flip episode | Uses the emergency change route with a second approval | Switches protection off, or shares a token |
| R04-B8 | Handles an outside vulnerability report | LO6 | Consequence-flip debrief | Thanks, routes through disclosure, keeps them updated | Ignores it, or threatens the researcher |
| R04-B9 | Triages developer-facing messages | LO2, LO5 | **Attack-first defend set; the developer checks** | Reports or deletes the lures; trusts the genuine twins | Trusts a lure, or over-flags a genuine twin |

**Before and after.** The developer post-check against the newest developer pre-check gives the measured change on the message-facing outcomes. The comparison panel shows it only when a baseline exists, and says so when there is none. There is no effectiveness claim beyond a cohort's change on matched items. Over-flagging a genuine twin draws a calibration note, not a penalty; an honest report of a leaked secret is never counted against anyone.

## Critical behaviours

Kept as authoring priorities, not hard gates (the build has no loop-back gate; a missed item draws immediate feedback, its mirror-pair twin, or the consequence flip):

- **R04-CB1** Rotate a leaked secret instead of only deleting it or bypassing the block (R04-B4): the consequence-flip episode.
- **R04-CB2** Don't add a package without checking that it exists and is the one intended (R04-B2): the consequence flip and the developer check.
- **R04-CB3** Report real personal data found in a test system (R04-B3): the consequence-flip episode.

## Knowledge check bank

The twelve Q items keep their ids and become a candidate pool for developer check stems, defend items, consequence-flip choices and concept cards. Delivery is tagged, with mirror pairs noted:

- **R04-Q1 (LO1)** A key pushed to a private repo an hour ago. Consequence-flip choice; concept card (rotate first).
- **R04-Q2 (LO1, LO5)** The secret scan blocks the push. Consequence-flip choice.
- **R04-Q3 (LO2, LO3)** The assistant suggests a package that doesn't exist. Consequence-flip choice; a candidate dependency check item.
- **R04-Q4 (LO2)** The checks before adding a dependency. Concept card.
- **R04-Q5 (LO3)** What to put in a prompt. Concept card.
- **R04-Q6 (LO3)** "Assistant code is probably secure" (false). Concept card.
- **R04-Q7 (LO4)** The missing ownership check. Consequence-flip review item.
- **R04-Q8 (LO4)** Input joined into a query. Consequence-flip review item.
- **R04-Q9 (LO5)** The "maintainer" fork and access request. **Built as developer check item 1 and the attack-first episode**, mirror-paired with a genuine release announcement.
- **R04-Q10 (LO5)** Switching off branch protection at half five. Consequence-flip choice.
- **R04-Q11 (LO6)** Real residents' data in the test database. Consequence-flip choice.
- **R04-Q12 (LO6)** A researcher's report. Consequence-flip debrief choice.

## Reflection prompt

- "Where in our own week do we approve things because the release train is leaving, and what would make a proper review easier?"
- For facilitated sessions: "If a key leaked from our repository tonight, who would rotate it, and how would they know?"

## Completion and pass rules

- **Complete** when the learner has played the episodes (or the defend-only variant and the consequence flip), seen the per-item feedback and the debriefs, and taken the developer post-check. There is no default pass mark (R6); a pass mark is an organisation setting on the developer post-check percent, not a default.
- **No retake gate.** A missed item draws immediate feedback and its mirror-pair twin or the consequence flip; the checks can be replayed; the measurement store keeps the first answer per item per stage.

## Evidence for auditors

The record (in game globals; a server-side record only if productised, build decision R) shows, per role and per stage: item ids, verdicts and consequence-flip decisions, chips, the defend score and the pre-to-post change, with no free text and no learner identity. The organiser also sees the discrimination figure; learners never do. This supports:

- NIST AT-3 and CIS 14.9;
- ISO 27001 cl. 7.2 and A.6.3;
- NCSC CAF B6.b, and DSPT 3.3.1 for NHS customers;
- PCI DSS 6.2.2, in part;
- NIS2 IR 8.2 where the Implementing Regulation applies, and DORA Art 13(6);
- UK GDPR Art 32;
- AI Act Art 4, in part and with core_15;
- CMMC AT.L2-3.2.2 and SOC 2 CC1.4 for US customers.

The record is awareness-level evidence. It does not show the language-specific secure coding training that PCI DSS 6.2.2 requires at least every 12 months; for that, add the records from Hacktivity's Web Security or Software Security courses, or the organisation's own secure coding training. The product makes no effectiveness claim.

## Measuring effect

Outside the course, an organisation can watch: secret-scanning alerts and push-block bypasses (which should fall), and time from a leaked secret to its rotation; new dependencies added outside the approved route and packages blocked at the proxy; the share of merged changes with a security review comment and changes merged without required approvals; real personal data found in non-production systems (aiming for none) and reports of it; time to acknowledge outside vulnerability reports; and the share of developers with phishing-resistant MFA on the code host and the package registry. These come from the code host, the secret scanner, the package proxy and the security team's records, are reported by team, never used to rank individual developers, and an honest report is never counted against the person who made it. The product claims no effectiveness.
