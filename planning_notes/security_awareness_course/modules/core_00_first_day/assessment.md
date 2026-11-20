# core_00 assessment

core_00 is the first-play brief inside the kiosk frame, not an episode, so it has **no scored defend half and no quiz of its own**. The built product scores only the episodes' defend halves and the pre and post checks, with per-item awareness-measure records (ids, verdicts, chips, score, stage and time; no free text, no identity). There is **no default pass mark** anywhere: the check missions set the pass percent to 0 and are scored for completion.

The plan's old core_00 behaviours and question items were tied to a "First Day" morning (the fake manager message, the test email, the payroll email) that the build retired. They are kept here as **candidate items mapped onto the episodes' defend sets and the checks**, so the orientation the brief gives is measured where the measurement actually happens, and the critical behaviours become **mirror pairs** in those sets.

## Assessed behaviours

core_00 records only that the first-play brief was shown and acknowledged (the "Got it" button on the "what we record" card). Each learning outcome is then evidenced in the episodes and checks, not in core_00. Ids are kept and remapped.

| Id | Behaviour | Learning outcome | Where it is now evidenced | Mirror pair |
|---|---|---|---|---|
| C00-B1 | Acknowledges the brief | LO1 | the "Got it" button on the "what we record" card (completion only, not scored) | (not a pair) |
| C00-B2 | Finds and uses the report button | LO4 | the Report verdict in every episode's defend half, always available and never penalised | Report against Trust on a genuine item |
| C00-B3 | Handles an unrequested prompt | LO3 | E3 and E9 push cards (deny and report) | A prompt the learner started (approve) |
| C00-B4 | Reports a suspicious message | LO4 | the Report verdict in E1, E5 and E8 defend sets | A genuine look-alike in the same set |
| C00-B5 | Reports their own slip | LO4, LO5 | E8's after-the-click set and the no-blame line | (not a pair: Report is the universal safe move) |
| C00-B6 | Explains why they are targeted, and how attacks begin | LO2 | the "why you" card; the attack half of every episode | (concept, not a scored pair) |
| C00-B7 | Finds the reporting route again | LO4 | the customer report route in every debrief | (not a pair) |
| C00-B8 | Applies the habit to an unexpected request | LO3 | the habit to keep, applied across every defend set | A pressured phish against a genuine routine request |

## Critical behaviours

core_00 gates nothing: the brief completes when it is read and acknowledged. What the plan called critical behaviours are carried by the episodes, as the **must-include mirror pairs** their defend sets and checks hold:

- **C00-CB1 Report a suspicious message:** every defend set includes a phish whose right move is Report, matched with a genuine look-alike.
- **C00-CB2 Find the reporting route:** the customer report route appears in every debrief, from the `customer_report_route` slot.

There is no loop-back gate in the built product. A mishandled item in an episode is explained at once, and a similar item follows.

## Knowledge check bank

core_00 has no quiz. The plan's C00-Q1 to C00-Q12 are retired as a core_00 quiz and their content folds into the episode debriefs and the role check forms, where it is authored as triage items or concept cards. Ids are kept as authoring notes for where each point now lives.

- **C00-Q1 (ordering, the habit)** becomes the habit-to-keep concept card in the brief and every debrief.
- **C00-Q2, C00-Q9 (report when unsure; what the team does)** become the Report verdict and the team-protected tally in every episode.
- **C00-Q3 (after typing a password)** becomes E8's first-steps and recovery card and core_01 LO6.
- **C00-Q4 (where is the report button)** becomes the report button, present on every defend card.
- **C00-Q5, C00-Q8 (a text asking for gift cards; a caller asking for a code)** become core_02's E3 and E6 defend items.
- **C00-Q6, C00-Q7 (why you are targeted; what makes you pause)** become the "why you" card and the attack half of every episode.
- **C00-Q10, C00-Q12 (a false alarm is welcome; encourage a colleague to report)** become the no-blame line in every debrief.
- **C00-Q11 (where to find the number later)** becomes the customer report route card.

## Reflection prompt

- "Think of the last time something at work felt slightly off. Who could you have checked with?"
- For a facilitated session (the `facilitated` flag, not yet shipped): "What would make people here more likely to report a mistake on the day it happens?"

## Completion and pass rules

- **Completion:** the brief is complete when it has been shown and the "what we record" card acknowledged. It is shown once per learner.
- **No pass mark.** core_00 is not scored; it has no check and no pass mark. The measurement lives in the episodes' defend halves and the pre and post checks, which set the pass percent to 0.
- **No loop-back and no test-out:** the brief is a one-time orientation.

## Evidence for auditors

The record shows that the first-play brief was shown and acknowledged, with the date, as the start of the learner's use of the product. Combined with the episodes' per-item awareness-measure records (ids, verdicts, chips, score, stage and time; no free text, no identity), it shows that orientation happened on first use and within any window the organisation sets. This supports:

- PCI DSS 12.6.1 and the "on hire" part of PCI DSS 12.6.3 (with the episodes the learner then plays);
- ISO 27001 cl. 7.3 and A.6.3;
- NCSC CAF B6.a and B6.b;
- CIS 14.1 and 14.6; NIST AT-2;
- the ICO training toolkit (orientation before access to personal information, with the rest of the pathway);
- DSPT 2.1.1 (an induction covering cyber security), for categories 3 and 4.

Who can see results on the hosting platform is a platform question kept out of this repo. See `02_COMPLIANCE_MAPPING.md`.

## Measuring effect

core_00 makes no claim of effect and is not scored. The product's measure of effect is the episodes' before-and-after change on matched items for a cohort. Beyond the course, an organisation can watch time to first report for new starters and their report rate for real suspicious messages, aggregated by department and never by named individual below a privacy threshold. The product makes no effectiveness claim.
