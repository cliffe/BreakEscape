# role_05 assessment

role_05 is measured by the built **hr pre and post check pair** and by the defend halves of E2 and the new recruitment-fraud episode, with the access and culture behaviours evidenced in the consequence-flip episode's choices and debrief. Scored recognition sits only in the defend halves and the checks, with no default pass mark (build decision R6). The behaviours and Q items below keep their stable ids and are mapped onto those built forms, with mirror pairs (aw5).

## Which forms measure this module

- **hr check pair (built):** `awareness_{pre,post}_hr_{ab,ba}`. Ten items each, 4 phish, A and B disjoint on phish slots, counterbalanced AB and BA, `passPercent: 0`, feedback at the end, mirror pairs. This is role_05's measured check; **no new check pair is needed** (R7).
- **Defend sets (built and new):** E2's recruitment inbox (6 emails, 2 phish, no Verify, a macro concept panel); the recruitment-fraud episode's candidate set (mirror pairs). Both scored in the defend half.
- **Consequence-flip episode (new, R3):** access that outlives the job. No triage score; the learner's choices and the flip are recorded as decisions and shown in the debrief, and the culture behaviours are evidenced there.

## Assessed behaviours

Each row is recorded through the measurement store (`systems/awareness-measure.js`): item id, verdict or decision, chips, score, stage and time, ids only, first answer wins, no free text, no learner identity. "Secure, Developing, Not yet" is an authoring rubric for difficulty and feedback, not a shipped grade; the shipped output is the defend score, the per-item verdicts, the consequence-flip decisions and the pre-to-post change.

| Id | Behaviour | Learning outcome | Where it is evidenced | Good answer | Weaker answer |
|---|---|---|---|---|---|
| R05-B1 | Requests access for a new starter | LO1 | **Consequence-flip episode** (the "copy a leaver" choice) | Builds from the role template | Copies the leaver |
| R05-B2 | Requests access for a temp | LO1 | Consequence-flip episode | Role template with an end date | Copies the leaver, no end date |
| R05-B3 | Handles a mover | LO2 | Consequence-flip episode | Removes old access on move day, sets forwarding | Leaves the mailbox open |
| R05-B4 | Reviews the team's access | LO3 | Consequence-flip episode (the ghost-accounts flip) | Spots the ghosts, shared login and toxic combination; asks the owner about the service account | Misses them, or removes the service account without asking |
| R05-B5 | Decides how to hire a remote candidate | LO4 | **Recruitment-fraud defend set** | Verify through the standard checks; pass doubts to HR and security | Offers without the checks |
| R05-B6 | Reads the candidate signals | LO4 | **Recruitment-fraud defend set** (the mismatch items) | Flags the refused ID, third-party pay and unverifiable references | Misses them, or flags the accent or the broadband (calibration note, not a fail) |
| R05-B7 | Responds to a reported mistake | LO5 | Consequence-flip debrief (the "What do you say?" prompts) | Thanks, reports together, supports | Blames, or turns it into a disciplinary matter |
| R05-B8 | Makes time for training | LO5 | Consequence-flip episode | Books the time and covers | "Just click through it" |
| R05-B9 | Answers a question about a colleague's health | LO6 | Consequence-flip episode | Points to HR or the person | Shares health details |
| R05-B10 | Raises a concern about an odd export | LO6 | Consequence-flip episode | Notes the facts, tells HR and security | Searches the mailbox, or lets it go |
| R05-B11 | Completes a leaver checklist | LO2 | Consequence-flip episode (the flip shows what was missed) | Accounts, devices, keys, changed codes, call lists, auto-reply | Leaves email on, or lets the laptop go |

**Before and after.** The hr post-check against the newest hr pre-check gives the measured change for recognising recruitment lures and fraud. The comparison panel shows it only when a baseline exists, and says so when there is none. There is no effectiveness claim beyond a cohort's change on matched items. On the genuine-candidate mirror twin, flagging the accent or the broadband is shown as a calibration note, never a penalty; reporting is never penalised.

## Critical behaviours

Kept as authoring priorities, not hard gates (the build has no loop-back gate; a missed item draws immediate feedback, its mirror-pair twin, or the consequence flip):

- **R05-CB1** Remove access that is no longer needed (R05-B3, B4 or B11): the consequence-flip episode.
- **R05-CB2** Respond to a reported mistake without blame (R05-B7): the culture card and the "What do you say?" prompts.
- **R05-CB3** Don't hire without the standard checks (R05-B5): the recruitment-fraud defend set.

## Knowledge check bank

The twelve Q items keep their ids and become a candidate pool for hr check stems, defend items, consequence-flip choices and concept cards. Delivery is tagged, with mirror pairs noted:

- **R05-Q1 (LO1)** "Copy access from the leaver". Consequence-flip choice and concept card.
- **R05-Q2 (LO1)** What a temp should get. Consequence-flip choice.
- **R05-Q3 (LO2)** A mover keeping the old mailbox. Consequence-flip choice.
- **R05-Q4 (LO2)** The leaver checklist. Consequence-flip choice; the flip shows what was missed.
- **R05-Q5 (LO3)** An unrecognised service account. Consequence-flip choice (ask the owner).
- **R05-Q6 (LO3)** Why the review matters. Concept card.
- **R05-Q7 (LO4)** The warning signs to pass to HR. **Recruitment-fraud defend items**, mirror-paired with innocent twins (accent, broadband).
- **R05-Q8 (LO4)** "The agency has checked." **Recruitment-fraud defend item**, mirror-paired with a genuine agency candidate.
- **R05-Q9 (LO5)** The 17:50 confession. The culture card; the "What do you say?" prompt.
- **R05-Q10 (LO5)** Thank, Act, Support, Learn. Concept card.
- **R05-Q11 (LO6)** A question about a colleague's health. Consequence-flip choice.
- **R05-Q12 (LO6)** An odd export by a leaver. Consequence-flip choice.

**Recruitment-fraud defend set (mirror pairs).** The four pairs in the structure table (refused ID vs poor broadband; third-party pay vs own named account; unverifiable references vs checkable ones; fabricated history vs an unusual but checkable one). Item counts and matched flag multisets follow the hr forms so a role_05 defend set passes the validator's balance lint; the authoritative counts live in the scenario file if and when the shell is built.

## Reflection prompt

- "Think of the last time someone told you about a mistake. What did your first sentence tell them?"
- For facilitated sessions: "Which access in our teams would nobody notice if it outlived the person who had it, and whose job is it to notice?"

## Completion and pass rules

- **Complete** when the learner has played the episodes (or the defend-only variants and the consequence flip), seen the per-item feedback and the debriefs, and taken the hr post-check. There is no default pass mark (R6); a pass mark is an organisation setting on the hr post-check percent, not a default.
- **No retake gate.** A missed item draws immediate feedback and its mirror-pair twin or the consequence flip; the checks can be replayed; the measurement store keeps the first answer per item per stage.
- **Policies:** if the organisation attaches its leaver or screening policy, acknowledging it can be part of completion (a later platform option, feature-level only).

## Evidence for auditors

The record (in game globals; a server-side record only if productised, build decision R) shows, per role and per stage: item ids, verdicts and consequence-flip decisions, chips, the defend score and the pre-to-post change, with no free text and no learner identity in the block. The organiser also sees the discrimination figure; learners never do. This supports:

- NCSC CAF B6.a and B6.b; DSPT B6.a and B6.b for NHS customers;
- ISO 27001 cl. 7.2 and A.6.3;
- NIST AT-3 and AT-2(2);
- CIS 14.9;
- NIS2 IR 10.1 and IR 10.2 where the Implementing Regulation applies;
- DORA RTS Art 19;
- the ICO training toolkit;
- CMMC AT.L2-3.2.3 for US defence customers.

See `02_COMPLIANCE_MAPPING.md` for the full references. The product makes no effectiveness claim.

## Measuring effect

Outside the course, an organisation can watch: leaver accounts disabled on time; access review completion and removals per review; mover tickets that include removals; hiring checks completed before the start date (including for agency and contract workers); self-reported incidents by team (a rise is good) and time to report (a fall is good); a pulse question ("I'd tell my manager if I made a security mistake", by team); and training completed on time by team. These need service desk and HR data and a short survey. Any dashboard shows them by team or department, never by named individual, and the product claims no effectiveness.
