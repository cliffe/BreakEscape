# role_01 assessment

role_01 is measured by the built **executive pre and post check pair** and by the new **board crisis** defend set, both scored only in the defend half and in the checks, with no default pass mark (build decision R6, `04_BUILT_SO_FAR.md`). The facilitated board decisions are evidenced in the group record, not scored per learner. The behaviours and Q items below keep their stable ids and are mapped onto those built forms.

## Which forms measure this module

- **Executive check pair (built):** `awareness_{pre,post}_executive_{ab,ba}`. Ten items each, 5 phish, Verify on, emails and voicemails, `passPercent: 0`, feedback at the end, A and B disjoint on phish slots, counterbalanced AB and BA. This is role_01's measured check; **no new check pair is needed** (R7).
- **Board crisis defend set (new):** a crisis-time inbox with mirror pairs (aw5), Verify on, scored in the defend half of the new episode. It adds items but reuses the executive checks for before-and-after measurement.

## Assessed behaviours

Each row is recorded through the measurement store (`systems/awareness-measure.js`): the item id, verdict, chips, score, stage and time, ids only, first answer wins. There is no free text and no learner identity in the record. "Secure, Developing, Not yet" is kept here as an authoring rubric for difficulty and feedback, not as a shipped grade; the shipped output is the defend score, the per-item verdicts and the pre-to-post change.

| Id | Behaviour | Learning outcome | Where it is evidenced (built) | Good answer | Weaker answer |
|---|---|---|---|---|---|
| R01-B1 | Contains the attack on advice | LO3 | Facilitated pause panel 1 (group record) | Backs the technical lead, owns the cost | Waits for the chief executive |
| R01-B2 | Convenes the right people | LO3, LO6 | Facilitated pause panel 1 (group record) | The crisis team on the out-of-band channel | An all-staff email in the night |
| R01-B3 | Records decisions with reasons | LO3 | Facilitated debrief (group record) | A reason for each key decision | Decisions with no recorded reason |
| R01-B4 | Keeps the lifeline services going | LO3 | Facilitated pause panel 5 (group record) | Paper fallbacks, named | Holds services until systems return |
| R01-B5 | Answers the insurer honestly | LO2, LO5 | Facilitated pause panel 4 (group record) | Honest, with the risk entry | "All covered" |
| R01-B6 | Notifies the regulator on time with incomplete facts | LO4 | Facilitated pause panel 3; board crisis defend item (fake "insurer release funds" pair) | Notify on the day, in phases | Wait for certainty |
| R01-B7 | Puts the ransom demand through a proper process | LO5 | Facilitated pause panel 4 (group record) | No direct contact, advice, insurer and NCSC told, board agreement, reasons recorded | Pays now without checks |
| R01-B8 | Communicates honestly and in time | LO6 | Facilitated pause panel 5 (group record) | Plain, timely, staff first or at the same time | "Fully under control" |
| R01-B9 | Checks an urgent instruction from a leader | LO6 | **Built: E4 defend set and executive checks; board crisis voice-note item** | Verify through a number already held; deny and report a push you did not start | Replies to the note, or approves |
| R01-B10 | Restores clean, lifeline first | LO3 | Facilitated pause panel 5 (group record) | Clean rebuild, lifeline first | Fast restore from snapshots taken while the attackers were inside |
| R01-B11 | Looks after the people affected and the team | LO4, LO6 | Facilitated debrief (group record) | Tells affected people directly; shifts and thanks for the team | Neither |
| R01-B12 | Knows whose call it is and which clock applies | LO1, LO4 | Facilitated pause panels 1 and 3; check items R01-Q1, Q3, Q4 as candidate stems | Sorts decisions and clocks correctly | Mixes them up |

**Before and after.** The executive post-check against the newest executive pre-check gives the measured change for R01-B9 (verifying an urgent instruction from a leader). The build's comparison panel shows this only when a baseline exists, and says so when there is none. There is no effectiveness claim beyond a cohort's change on matched items.

R01-B7 and the other facilitated behaviours rate the process in discussion, not a verdict, and are kept in the group record. The `facilitated` flag hides any per-learner score on the shared screen.

## Critical behaviours

Kept as authoring priorities, not hard gates (the build has no loop-back gate; a missed critical behaviour draws immediate feedback and a mirror-pair twin to practise the difference):

- **R01-CB1** Check an urgent instruction through a known channel (R01-B9): the built behaviour, measured by E4, the board crisis voice-note item and the executive checks.
- **R01-CB2** Notify on time with incomplete facts (R01-B6): the fake "insurer release funds" defend item, and pause panel 3.
- **R01-CB3** Put the ransom decision through a proper process (R01-B7): facilitated pause panel 4, evidenced in the group record.

## Knowledge check bank

The twelve Q items keep their ids and become a candidate pool for executive check stems, board crisis defend items and the concept cards. The build scores recognition in the defend half and the checks, not a separate quiz, so each item below is tagged with how it is delivered. Mirror pairs (aw5) are noted where an item has a close genuine twin.

- **R01-Q1 (LO4)** When the ICO's 72 hours start. Delivered as a concept card in pause panel 3 and as feedback on the "insurer release funds" defend item.
- **R01-Q2 (LO5, LO4)** What paying does and does not buy. Concept card in pause panel 4.
- **R01-Q3 (LO3)** Contain at 03:00 when the chief executive is away. Concept card in pause panel 1.
- **R01-Q4 (LO1)** Which decisions are for leaders. Concept card in pause panel 1.
- **R01-Q5 (LO2)** The most useful backup question. Concept card in pause panel 5.
- **R01-Q6 (LO6)** The best first message to a client. Concept card in pause panel 5.
- **R01-Q7 (LO6)** The voice note in the chief executive's voice. **Built as the board crisis voice-note defend item**, mirror-paired with a genuine crisis-group voicemail from the chair.
- **R01-Q8 (LO5, LO2)** Answering the insurer honestly. Concept card in pause panel 4.
- **R01-Q9 (LO1, LO2)** Exercising the plan at least annually (Code D2). Concept card.
- **R01-Q10 (LO3)** Clean backup against snapshots taken while attackers were inside. Concept card in pause panel 5.
- **R01-Q11 (LO5, true or false)** "Paying a ransom is banned for all UK organisations" (false). Concept card; carries a "checked on" date, reviewed each edition.
- **R01-Q12 (LO1)** What is expected of a new trustee personally. Concept card.

**Defend items for the board crisis (mirror pairs).** Each phish has a close genuine twin, so the learner practises the difference, not a surface cue:

| # | Phish item | Genuine twin | Flags | Verdict that scores |
|---|---|---|---|---|
| 1 | Fake "chief executive" voice note asking for a quiet payment | Genuine crisis-group voicemail from the chair | borrowed authority, urgency, secrecy | Verify (call back on a number held), or Report |
| 2 | "Approve this sign-in" push during the outage | A push the learner started | unrequested push | Deny and report |
| 3 | "Insurer: confirm bank details to release funds", look-alike link | The genuine breach coach's email asking you to call a held number | look-alike domain, changed bank details | Verify, then Report |
| 4 | "IT: reset your password here while systems are down" page | The genuine status page | look-alike domain, link credibility | Delete or Report |

Item counts and matched flag multisets follow the executive forms' pattern so a role_01 defend set would pass the validator's balance lint; the authoritative counts live in the scenario file if and when the shell is built.

## Reflection prompt

- "Which decision in a real incident would our board find hardest, and what could we agree now so we don't have to decide it at 2am?"
- For facilitated sessions: "What one thing will we have in place before our next exercise, and who owns it?" The answers become the session's action list.

## Completion and pass rules

- **Complete (solo):** the learner has played the episode (or the defend-only variant), seen the per-item feedback and the debrief, and taken the executive post-check. There is no default pass mark (R6). If a compliance buyer needs one, it is an organisation setting on the executive post-check percent, not a default.
- **Complete (facilitated):** the group has played the episode on the shared screen, the facilitator has saved the group record and action list, and each participant has taken the executive post-check on their own device.
- **No retake gate.** A missed item draws immediate feedback and its mirror-pair twin. The checks can be replayed; the measurement store keeps the first answer per item per stage.

## Evidence for auditors

The record (held in game globals; a server-side record only if productised, build decision R) shows, per role and per stage: item ids, verdicts, chips, the defend score and the pre-to-post change, with no free text and no learner identity in the block. The organiser also sees the discrimination figure (hits on phish against false alarms on genuine items); learners never do. For a facilitated session, the group record and action list carry the board decisions. This supports:

- Cyber Governance Code C3 (each director's training) and C1 and C4 (the board's lead on culture and training);
- Cyber Governance Code D2, only for the own-plan facilitated version, with the action list and exercise report attached;
- NIS2 Art 20(2), and NIS2 IR 8.1 and IR 10.1 where the Implementing Regulation applies;
- DORA Art 5(4) and DORA Art 13(6), for EU financial entities;
- ISO 27001 cl. 7.2 and cl. 7.3;
- NIST AT-3 and NIST AT-2 (managers and senior executives), and NIST AT-2(5) in part where the optional concept card was opened;
- CIS 14.9; NCSC CAF B6.a and B6.b; DSPT 3.4.1 for NHS customers;
- NYDFS 500.4(d)(1) and HIPAA 164.308(a)(5) for US customers.

The record shows that leaders were trained and took part. It is not evidence that the organisation's plan is adequate, and a session played with Harbreck's plan is not the board's exercise of its own; that comes from the own-plan version's report and actions (and, where the plan is tested that way, it can also count towards PCI DSS 12.10.2). The product makes no effectiveness claim.

## Measuring effect

Outside the course, an organisation can watch: a written ransom stance reviewed yearly; annual exercises with leaders in the room and the share of actions closed; time to convene the crisis team; notifications on time; quarterly cyber reporting to the board (Code E2); directors trained; supplier remote access with MFA; and the board's answers to the readiness questions, repeated each year. These come from the governance team's records, are reported to the board as a whole, and are never used to rank individual directors.
