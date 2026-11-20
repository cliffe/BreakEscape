# core_03 assessment

The built product measures the password and MFA outcomes through the **scored defend halves** (the E3 MFA push card, and E9's prompt and password-practice cards) and the **pre and post check** forms (the helpdesk form carries the push item; E9 adds password items to the general or mobile form). Both use the awareness scoring profile (60 for the verdict, 40 for the flags) and per-item awareness-measure records (item id, form, verdict, chips, score, stage and time; no free text, no identity, and **never a password or passphrase**: the password surface records only the strength band and the choices made, and every word on the tiles is a game word). There is **no default pass mark**: the check missions set the pass percent to 0 and are scored for completion. A pass mark is a later organisation option on the post-check percent.

The plan's behaviours and question items are kept as **candidate items**: each maps onto a defend item or a check item, and the critical behaviours become **mirror pairs** (a prompt you started against one you did not; a strong passphrase against a weak one; a unique password against a reused one).

## Assessed behaviours

Ids are unchanged. Each behaviour is now a scored move in a defend set or a check form. "Mirror pair" names the matched item that makes it measurable before and after.

| Id | Behaviour (the scored move) | Learning outcome | Where it is scored | Mirror pair |
|---|---|---|---|---|
| C03-B1 | Handles the prompt flood and fake "IT" number | LO5 | E9 flip and defend cards; E3 attacker run shows the flood | A prompt the learner did start (approve), in the same set |
| C03-B2 | Chooses a strong passphrase | LO2 | E9 "which is stronger?" card and the builder | The company-plus-year weak option in the same card |
| C03-B3 | Gives each account its own password | LO1, LO3 | E9 sign-up card and vault health | The "use my usual" reused option; the reuse rig from the attack half |
| C03-B4 | Uses a made-up security answer | LO3 | E9 sign-up and practice cards | The true-answer option in the same card |
| C03-B5 | Chooses the strongest sign-in protection | LO4 | E9 enrolment card; the look-alike passkey test | The text-code option where a passkey was offered |
| C03-B6 | Reads prompts in context | LO5 | E9 practice prompt list; the helpdesk check push item | Each unrequested prompt is matched with one the learner started |
| C03-B7 | Handles the shared PC | LO6 | E9 shared-PC card | A proper route (own account or service desk) against using the note |
| C03-B8 | Handles an unrequested prompt during a sign-in | LO5 | E9 defend card (two prompts at once: one yours, one not) | Approve your own; deny and report the other |
| C03-B9 | Advises on a weak password (teach-back) | LO1, LO2, LO3 | E9 defend card (choose the advice) | The weak advice options in the same card |

Reporting a genuine prompt or message is never scored as wrong. The attack half (the guesser, the reuse rig, the attacker push run) is never scored.

## Critical behaviours

The build gates completion on finishing the defend half and the debrief, not on a behaviour. What the plan called critical behaviours are kept as the **must-include mirror pairs** every form and defend set carries:

1. **C03-CB1 Does not approve a prompt they didn't start:** the defend set pairs an unrequested prompt (and the fake "IT" number) with a prompt the learner did start.
2. **C03-CB2 Gives every account its own password:** the sign-up card pairs a unique generated password with the reused "usual", echoing the attack half's reuse rig.
3. **C03-CB3 Does not use someone else's written-down password:** the shared-PC card pairs a proper route with using the note.

A mishandled item is explained at once, and a similar item follows; the awareness profile locks the first answer. There is no loop-back gate in the built product. The passphrase and sign-in method are assessed but never gated: a learner who keeps a pet's name sees why on the meter, and methods are usually set by the organisation.

## Knowledge check bank

The question items are the pool the helpdesk, general and mobile forms and the E3 and E9 defend sets draw from, authored as prompt cards, password-practice cards or flag-naming prompts. Built forms are 10 items each (4 phish in 10), matched flag multisets, feedback at the end, `passPercent: 0`, A and B sharing no slots. Example passwords are game examples only, and the feedback reminds learners never to use an example they have seen. Ids are kept as authoring notes.

### C03-Q1 (LO1) is the reuse item

Built as a card: a breached hobby-site password reused at work. The attack half's reuse rig is its demonstration. Mirror: an account with its own password.

### C03-Q2 (LO2) is the "strongest to remember" item

Built as the "which passphrase is stronger?" card: three random words against company-plus-year, swaps and personal details. Mirror options in the same card.

### C03-Q3 (LO2) is the "change every 90 days" item

Built as a concept-card point and a check item: change when seen, not on a timer.

### C03-Q4 (LO3) is the new-portal password item

Built as the E9 sign-up card: generate and save. Mirror: "use my usual".

### C03-Q5 (LO3) is the security-question item

Built as the made-up-answer card. Mirror: the true answer.

### C03-Q6 (LO4) is the sign-in ladder item

Built as the enrolment card (passkey, app with number matching, text code, password alone). The look-alike passkey test shows why a passkey ranks first.

### C03-Q7 (LO5) is the "third prompt in a minute" item

Built as an E9 and helpdesk `push` card: deny and report. Mirror: a prompt the learner started.

### C03-Q8 (LO5) is the fake "IT, enter 47" item

Built as the flip and a defend card: do not enter it; deny and report. The number came off the attacker's screen.

### C03-Q9 (LO5) is the two-prompts-at-once item

Built as C03-B8's card: approve the portal's, deny and report the finance system's. A built-in mirror pair.

### C03-Q10 (LO6) is the shared-PC sticky-note item

Built as the shared-PC card: ask for your own account or the service desk. Mirror: using the note.

### C03-Q11 (LO6) is the warehouse-desk hotspot

Built as the shared-PC card's visual (the note on the monitor), with the accessible list equivalent for the text route.

### C03-Q12 (LO1, LO3) is the "you were in a breach" multi-select

Built as a check item: change it everywhere reused, make each unique, turn on MFA or a passkey, watch for phishing that uses the breach details.

## Reflection prompt

- "Which of your accounts would you least like to lose? Does it have its own password, and MFA?"
- For a facilitated session (the `facilitated` flag, not yet shipped): "Where do we still have shared logins or passwords on notes, and what would it take to get rid of them?"

## Completion and pass rules

- **Completion:** an episode is complete when the defend half and the debrief are done; a check when the form is done. Missions are scored for completion.
- **No default pass mark.** The check forms set the pass percent to 0. The post-check shows the change from the newest matched pre-check and says so when there is no baseline. A pass mark is a later organisation option.
- **No loop-back gate.** A mishandled item is explained at once, and a similar item follows.
- **No test-out.** The defend-only variant is the measured defence without the attack.
- **Accessibility:** no behaviour depends on speed; the prompts wait for an answer, and the text route (when built) records the same rows.

## Evidence for auditors

The per-item awareness-measure records hold the item id, form, verdict, chips, score, stage, variant and time; the first answer wins. **No record holds a password or a passphrase:** the password surface records only the strength band and the choices. The discrimination figure goes to organisers only; learners get genuine-item feedback. This supports:

- ISO 27001 A.6.3 and ISO 27002 6.3;
- NIST AT-2; CIS 14.3;
- PCI DSS 8.3.8;
- NCSC CAF B6.b;
- NIS2 Art 21(2)(g) and NIS2 IR 8.1; UK GDPR Art 32;
- DSPT 2.1.1 and 3.2.1 (categories 3 and 4), for NHS customers;
- HIPAA 164.308(a)(5)(ii)(C) and (D), FTC 314.4(e) and CMMC AT.L2-3.2.1, for US customers.

It also helps an organisation show it supports users to choose unique passwords, as Cyber Essentials v3.3 asks, without being a Cyber Essentials requirement in itself. See `02_COMPLIANCE_MAPPING.md`.

## Measuring effect

The product's own measure is the before-and-after change on matched items for a cohort, with no effectiveness claim. Beyond the course, an organisation can watch MFA coverage and method mix, reports of unexpected prompts, password-manager adoption, staff accounts found in breach monitoring, and service-desk reset volume, all aggregated by department and never by named individual below a privacy threshold.
