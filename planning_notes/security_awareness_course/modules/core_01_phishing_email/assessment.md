# core_01 assessment

The built product measures the phishing-email outcomes two ways: the **scored defend half** of each episode, and the **pre and post check** forms per role. Both use the awareness scoring profile (60 for the verdict, 40 for the flags) and both are recorded as per-item awareness-measure records (item id, form, verdict, chips, score, stage and time to answer; no free text, no learner identity). There is **no default pass mark**: the check missions set the pass percent to 0 and are scored for completion. A pass mark is a later organisation option on the post-check percent, not a default (`04_BUILT_SO_FAR.md` R6).

The plan's original behaviours and question items are kept as **candidate items**: each behaviour maps onto a defend item or a check item, and the critical behaviours become **mirror pairs** (a phish item matched with a genuine look-alike, or an A-form item matched with its B-form twin), so a pre and a post score compare like with like (aw5).

## Assessed behaviours

Each behaviour is now a scored move in a defend set or a check form. Ids are unchanged. "Mirror pair" names the matched item that makes it measurable before and after.

| Id | Behaviour (the scored move) | Learning outcome | Where it is scored | Mirror pair |
|---|---|---|---|---|
| C01-B1 | Reports a credential phish | LO5 | E1, E5 and E8 defend sets; check row for a look-alike sender | Matched with a genuine sign-in notice (the padlock-myth pair, E5) |
| C01-B2 | Handles a look-alike-domain phish | LO2, LO3, LO5 | E1 defend row 2 (`e1_lookalike_bank`); finance check row 2 (`fa_pennine_bank` / `fb_castell_bank`) | The real supplier's invoice in the next row (`fa_pennine_invoice` / `fb_castell_invoice`) |
| C01-B3 | Handles a hijacked or genuine-looking thread | LO3, LO4 | E1 `e1_bank_confirmed`; finance check rows 7 and 8; Verify verdict | A genuine urgent-but-normal item (`fa_run_thursday` / `fb_quarter_end`) |
| C01-B4 | Handles an authority or CEO lure | LO1, LO3, LO5 | E1 `e1_ceo_wire`; finance check row 4 (`fa_ceo_transfer` / `fb_fd_vouchers`); E4 whaling set | A genuine senior-sender item in the same form |
| C01-B5 | Handles a callback or renewal lure | LO3, LO4 | general and finance check items | A genuine supplier statement in the same form |
| C01-B6 | Takes the first steps after a click | LO5, LO6 | E8 defend set (the used-account signs) and its recovery-steps card | A genuine IT maintenance notice in the E8 set |
| C01-B7 | Reports their own click or sign-in | LO6 | E8 defend set; the report verdict, always available and never penalised | (not a pair: Report is the universal safe move) |
| C01-B8 | Reads web addresses and picks the real domain | LO2 | E5 page items; the general check page items; the flag chips `lookalike_domain` and `linkCredible` | A genuine page on the real domain in the same set |
| C01-B9 | Calibrates on genuine mail | LO3 | every defend set (the genuine items); the discrimination figure (hits on phish against false alarms on genuine), organisers only | Each genuine item is the mirror of a phish item with the same flag multiset |

Reporting a genuine message is never scored as wrong: it earns the verdict points, and the debrief gives a tip on how a quick check would have told. The attack half is never scored.

## Critical behaviours

The build does not gate completion on a behaviour; the episode completes when the defend half and the debrief are done, and the checks when the form is done. What the plan called critical behaviours are kept as the **must-include mirror pairs** every form and defend set carries, so the measurement is honest:

1. **C01-CB1 Report a phish:** every defend set and every check form includes at least one phish whose right move is Report (or Verify), matched with a genuine look-alike.
2. **C01-CB2 Judge the request, not the sender:** every form includes a genuine-looking item (a real address, a right-looking domain) whose tell is the request, matched with its genuine twin.
3. **C01-CB3 First steps after a click:** the E8 defend set includes the used-account signs, matched with a benign look-alike (a genuine reset the learner did ask for, an announced maintenance notice).

A learner who mishandles an item sees its reasoning card at once, then meets a similar item next (the awareness profile locks a verdict on the first answer, so the similar item is a fresh chance, not a retry). There is no loop-back gate and no remediation lock in the built product.

## Knowledge check bank

The plan's question items are the **pool the check forms and defend sets draw from**. They are not a separate quiz: each becomes a triage item (a message to sort) or a flag-naming prompt, authored into the role forms. The built forms are 10 items each (4 phish in 10; 5 for executive), with matched flag multisets, paired difficulty, feedback at the end and `passPercent: 0`. The A and B forms share no phish slots (the fix for blocker B1 in the check parity audit), so A-before-B and B-before-A give comparable scores.

The items below keep their ids as authoring notes for the form slots.

### C01-Q1 (LO2) is a page or address item

Built as a page item in the general check and E5: a link whose real domain is at the right-hand end (`...secure-login.info/mail`). Scored as Report or Delete for the phish; the mirror is a genuine page on the real domain.

### C01-Q2 (LO3, LO4) is the genuine-looking-thread item

Built as E1 `e1_bank_confirmed` and the finance check's genuine supplier invoice: the sender is right, the tell is the request. Verify is the best move where it is on. Mirror: the look-alike bank-change item two rows up.

### C01-Q3 (LO1) is the authority-survey phish

Built as a check item: the flags are `senderTrust`, `urgencyCalibrated` and a social-proof line. Scored on Report plus the flag chips. Mirror: a genuine all-staff notice.

### C01-Q4 (LO6) is the E8 recovery-steps card

Built as the ordering card in the E8 debrief: report, change on the real site, change where reused, follow the service desk. Not a triage item; shown as a concept card, not scored against other learners.

### C01-Q5 (LO5) is the "not sure" item

Built as any defend item where Report is the safe move: the verdict earns full points, and the debrief says reporting is never wrong. This is the item that teaches that Report is also the "I am not sure" button.

### C01-Q6 (LO3) is the "no typos, looks right" item

Built as a genuine-looking phish in every form (a right-looking domain, clean copy): the tell is the request. Mirror: a genuine item that also looks clean.

### C01-Q7 (LO6) is the colleague-slip item

Built into the E8 debrief and the no-blame line, not as a triage item.

### C01-Q8 (LO3, LO4) is the callback or renewal item

Built as a check item: a renewal invoice with a number to call. Report; the flag is `linkCredible` or `pretextRelevant`. Mirror: a genuine renewal reminder.

### C01-Q9 (LO2) is the display-name item

Built as a header detail in the hard check rows (`fa_remittance_spoof` / `fb_creditors_spoof`): the From looks right, the reply-to differs. Flags `senderAuth`, `reply_to_differs`. Mirror: a genuine item whose SPF fails but is fine.

### C01-Q10 (LO1) is the "what is it trying to make me do" framing

Carried by the attack half (the learner builds the ask) and the debrief, not a scored item.

### C01-Q11 (LO5) is the simulated-phishing note

Dropped as a scored item: the built product makes no simulated-phishing tie-in and no effectiveness claim. The point (treat a test like a real phish) sits in the debrief where the customer runs simulations. It stays an organisation option only.

## Reflection prompt

- "Think of the last email that made you hurry. What would checking another way have looked like?"
- For a facilitated session (the `facilitated` flag, not yet shipped): "What makes people here hesitate to report a mistake, and what would change that?"

## Completion and pass rules

- **Completion:** an episode is complete when the defend half and the debrief are done; a check is complete when the form is done. Missions are scored for completion.
- **No default pass mark.** The check forms set the pass percent to 0. The post-check shows the change from the newest matched pre-check, and says so when there is no baseline. A pass mark or certificate is a later organisation option on the post-check percent, not a default.
- **No loop-back gate.** A mishandled item is explained at once, and a similar item follows; there is no remediation lock in the built product.
- **No test-out.** The defend-only variant (about 8 minutes) is the nearest thing: the measured defence without the attack.

## Evidence for auditors

The per-item awareness-measure records hold the item id, form, verdict, chips, score, stage (pre, post or episode), the variant and the time to answer; the first answer wins. No free text is stored and no learner identity is held in the block (the actor is added by the caller, and the block is shaped for xAPI). A discrimination figure (hits on phish against false alarms on genuine items) goes to organisers only; learners never see it, and get detailed feedback on the genuine items instead. There are no individual league tables, and the attack half is never scored or ranked. This supports:

- PCI DSS 12.6.3.1 (training covering phishing and related attacks and social engineering);
- ISO 27001 cl. 7.2, cl. 7.3 and A.6.3;
- NIST AT-2, AT-2(3) and AT-2(4);
- CIS 14.2 and CIS 14.6;
- NCSC CAF B6.b (the pre-to-post change is the evaluation of effect).

Who can see results on the hosting platform is a platform question kept out of this repo. See `02_COMPLIANCE_MAPPING.md`.

## Measuring effect

The product's own measure is the before-and-after change on matched items for a cohort: the post-check against the newest matched pre-check, per role, with no effectiveness claim. Beyond the course, an organisation can watch report rate and time to first report for real suspicious emails from its own mail system. The dashboard shows these by department, never by named individual below a privacy threshold. The product claims no equivalence between the real world and the in-game items, and no effectiveness.
