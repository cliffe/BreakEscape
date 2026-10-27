# Assessment and evidence

How the course finds out what each learner can do, how it records that, and how one record serves three people: the learner (feedback), the organisation (insight in aggregate) and the auditor (evidence).

**This file now starts from what is built.** The awareness product on main (Incident Simulations: Critical Cases) already measures learners with role-based pre and post checks, a scored defend half in every episode and awareness-measure records. That model is the base. The plan's outcome tagging, critical behaviours, knowledge checks and certificates are kept as **extensions** and **organisation options** on top of it, not as a second assessment model. Where this file and the build disagree, the build wins (`../04_BUILT_SO_FAR.md`, R6).

Status labels: **Built** (on main today), **Builds on E# / system X** (an extension of something built), **New** (no build yet). Feature ids are from `README.md`; compliance references are the short forms in `../02_COMPLIANCE_MAPPING.md`. The built design is in `../../phishing_and_social_engineering/designs/11_awareness_product_episodes.md` (sections 4 and 5) and `awareness/HANDOVER.md`; where those and the scenario files differ, the scenario files win.

## 1. Principles

1. **Built. Score only where the learner defends.** The attack half of an episode is unscored and never ranked. The defend half and the checks are scored. Nothing the learner writes as an attacker is judged as a test of them.
2. **Built. Measure from the start.** Measurement is part of the core loop: a pre-check before the episodes, a post-check after, and a record of every defend answer.
3. **Built. No default pass mark.** Every check and defend set authors `passPercent: 0`. The learner sees their result and their change, not a pass or a fail. A pass mark is a later organisation option (section 6).
4. **Built. Reporting is never penalised.** Reporting a genuine item scores the same as trusting it on the verdict, so Report is also the "I'm not sure" path. Over-caution is never the wrong answer.
5. **Built. Collect less.** Records hold ids, enums, numbers, booleans and a timestamp. No free text and no learner identity are stored in the record (section 2.5).
6. **Built. Claim only what the design shows.** The product claims a before and after change on matched items for a cohort, and nothing more. It makes no effectiveness claim (section 10).
7. **Nobody is failed and left.** The words "fail" and "failed" appear nowhere a learner or a manager can see them. Built in the copy today; kept as a rule for every extension.
8. **New. Fair to every route.** The text route (BE-03) must produce the same records as the game. It is not built yet, so this is a requirement on BE-03.
9. **Private by default.** What a learner did is for their learning. The organisation sees it only in aggregate, and never uses it for discipline (section 11). Built in the record's shape; the platform side is wish list (HA-09, HA-15).

## 2. What is built: the measurement

### 2.1 Pre and post checks per role (Built)

- **Six check roles:** finance, hr, helpdesk, executive, general and mobile. Each role's check uses the company and channels of that role's episode: finance at Brightwell Foods; hr and mobile at Tarrowby Logistics; helpdesk and general at Quayholt Insurance; executive at Merrin & Sallow Architects.
- **Two parallel forms per role, A and B,** of 10 items each. The forms are matched on the number of phish (4 in 10, 5 for executive), the multiset of red flags and the difficulty mix. A and B share no phish slots, which was audited across all six roles.
- **AB and BA pairs.** Each role has an AB pair (pre uses A, post uses B) and a BA pair (the reverse): `awareness_{pre,post}_<role>_{ab,ba}`, 24 check missions in all. The organiser puts half the cohort on each pair, which counterbalances any difference between the forms without assigning anything at launch.
- **Each check is its own mission**, 4 to 5 minutes, one kiosk, one triage set, feedback at the end (`feedbackMode: "end"`).
- **How pre reaches post.** The pre-check exports its percent, report rate and a done flag. The post-check imports them from the learner's newest concluded run of the paired pre mission. The post screen shows the change only when a baseline exists, and says plainly when there is none.
- **Ordering is the organiser's job.** The organiser places the pre-check first and the post-check last in the course. A second play of the pre-check replaces the baseline, because the newest concluded run counts. Product copy claims nothing stricter.
- **Scope.** A role pair covers the learner's primary role. Episodes from other roles are extras with no check of their own.

### 2.2 The defend half of every episode (Built)

Each of E1 to E7, and each defend-only variant, ends its main play with a triage set under the `awareness` scoring profile. Each item is worth 100: 60 for the verdict (Trust, Report or Delete) and 40 for naming the real red flags from a closed chip list.

| Item is | Report | Delete | Trust |
|---|---:|---:|---:|
| A phish | 60 | 30 | 0 |
| Genuine | 60 | 30 | 60 |

In sets with **Verify** (E1, E3, E4, E6 and E7, and the finance, executive, helpdesk and mobile check forms), Verify scores as Report and is counted separately, and the debrief quotes it. The episode score is the mean of its items. The full episode and its defend-only variant use the same defend set, so their records are comparable; the record says which variant produced it.

### 2.3 Mirror pairs (Built, aw5)

Every defend set holds a **mirror pair**: a genuine item that looks suspicious, and a phish that looks normal. It stops a learner scoring well by distrusting everything, and it gives the debrief its strongest teaching moment. E7 keeps its existing voicemail mirror (`FUN_DECISIONS.md`, e7_mirror). Every new defend set and check form needs one.

### 2.4 First answer wins (Built)

The triage minigame locks a verdict on confirm. The first answer is the one recorded for measurement. A learner who misses an item sees the reasoning and then meets a *similar* item later, never a retry of the same one. A reopened or abandoned round writes no record, and a round already recorded is never overwritten.

### 2.5 The item record (Built)

Each finished triage round writes one block to the awareness-measure records (`se_awareness_records`). The block holds:

| Field | What it holds |
|---|---|
| Key | Stage and set id, unique per game, so a round is recorded once |
| Set and form | The triage set id and the form (A or B) |
| Stage | `pre`, `post` or `episode` |
| Episode and variant | The episode id, and `full` or `defendOnly` |
| Time | When the round was recorded |
| Round results | Percent and report rate |
| Discrimination | The figure in section 2.6 |
| Per item | Item id, verdict, action, the chips ticked, the item score, whether it was a phish, and time to answer in milliseconds |

Time to answer is never shown to the learner and nothing times them, so it judges nothing. The attack half stores only a template id and blank ids, held in the session to feed the flip, then discarded.

**No free text and no identity.** There is no free text anywhere in the scored path. The block holds no name, email or learner id: whoever reads the records supplies the actor. The block is shaped so it maps to xAPI (BE-14), but nothing sends it anywhere yet.

### 2.6 The discrimination figure, for organisers only (Built, aw3)

Per round: hits (phish caught by Report, Delete or Verify) against false alarms (genuine items reported or deleted; Verify on a genuine item is the careful move, not a false alarm). The figure is the hit rate minus the false-alarm rate, from minus 1 to 1. It tells a learner who reports everything apart from a careful one.

- **Organisers see it; learners never do.** It is never shown as blame.
- **Learners get detailed feedback on the genuine items instead:** which they trusted, checked or flagged, and why each was safe (`FUN_DECISIONS.md`, disc_visible).

### 2.7 What the learner sees (Built)

The debrief gives a reasoning card per item, the genuine-item feedback, a "team protected" tally, the habit to keep, an "On Monday" card, the customer's reporting route and a no-blame line. The post-check shows the change from the newest pre-check. No league tables, and no figures beyond the learner's own.

### 2.8 Evidence-centred design, applied to the build

Evidence-centred design (Mislevy, Almond and Lukas, 2003) builds an assessment from three linked models: what we want to claim (the learning outcomes), what we would need to see (observable behaviours and the rules that rate them) and the tasks that draw out that behaviour. Stealth assessment (Shute, 2011) adds that the tasks can be the game itself.

The build already has the task model and the evidence model, at item level: each defend item and check item is a task, its verdict and chips are the evidence, and the scoring profile is the rule. What it lacks is the claim layer: no item is tagged with a learning outcome. That is the first extension.

| Part | In the build today | The extension |
|---|---|---|
| Claim | None; one role-level percent and report rate | **Builds on awareness-measure records.** Each module's learning outcomes (`<module>-LO<n>`) as claims |
| Evidence | Verdict and chips per item | **Builds on the item record.** Assessed behaviours (`<module>-B<n>`) defined as verdict and chip patterns |
| Task | Defend items and check items | **New.** Items authored from each module's question bank and `concepts.md` |
| Rule | The `awareness` scoring profile | **Builds on the scoring profile.** A map from item id to outcome ids, held with the content |

#### Rules for writers (kept, re-pointed)

1. **Every outcome has at least two independent items,** at least one in a defend set and at least one in a check form.
2. **Ratings describe actions, not states of mind.** "Reports the bank-change email and ticks the changed details" can be observed; "understands verification" can't.
3. **Every item is tagged** with its outcome ids when it is written, in the content, so the debrief, the record and any later dashboard come from the same data.
4. **Over-caution is never wrong.** Reporting a genuine item is the "not sure" path (principle 4).
5. **No gotchas.** Every item can be caught with the habit to keep and the tells the episode teaches.
6. **Every set has a mirror pair** (section 2.3).
7. **Ids.** Outcomes `<module>-LO<n>`, behaviours `<module>-B<n>`, critical behaviours `<module>-CB<n>`, check items `<module>-Q<n>`. Kept stable; new ids are added at the end of a list.

#### Checking that it works

Before any figure is shown to an organisation:

- **Form parity.** The A and B forms of each role stay matched on phish count, flag multiset and difficulty (Built: the parity audit). Every new form gets the same audit.
- **Fit between items.** Learners who do well on an outcome's defend items should mostly get its check items right. An item that strong players get wrong is reviewed.
- **Fairness.** Compare results across routes once the text route exists, and across languages if any are added. A gap points to a design problem, not to the learners.
- No pilot is planned (decision A3), so none of this is presented as validation.

## 3. The rating per outcome: an extension (Builds on awareness-measure records)

When items carry outcome ids, a rating per outcome can be worked out from the existing item records, with no new data collected.

| Rating | To the learner | To the organisation |
|---|---|---|
| **Secure** | "You did the safe thing without being prompted, and you know why." | Likely to do it at work. |
| **Developing** | "You were partly there: safe, but not the whole habit yet." | Worth more practice: a defend-only drill. |
| **Not yet** | "This one didn't land this time. Here's what to do, and a chance to practise it." | Needs practice. Never a fail, and never a disciplinary matter. |

The default rule, adapted to triage items:

1. **Score each item** linked to the outcome from its item score: 80 or more is Secure (2), 50 to 79 Developing (1), below 50 Not yet (0).
2. **Weight by where it came from:** the post-check counts 2; in-episode defend items count 1; the **pre-check counts 0**, because it is a baseline taken before any teaching.
3. **Take the weighted average** (0 to 2). Secure at 1.5 or more with no post-check item at Not yet; Not yet below 0.6; Developing otherwise.
4. **Too little evidence:** fewer than two items, or none after the pre-check, gives "not rated", and the content is fixed.

The cut-offs are a starting point, to be reviewed by a small panel (a security lead, a trainer, a learner representative). A module's `assessment.md` can change them for one outcome, with a reason.

**Kept from the plan:** the existing module ratings tables (Secure, Developing, Not yet per behaviour) stay as the writing guide for items. They no longer imply a separate in-game rating engine.

## 4. Critical behaviours as mirror-pair items: an extension (Builds on mirror pairs, aw5)

The plan's critical behaviours (one to three per module, such as reporting a phish, verifying a change of bank details through a known number, never reading out an MFA code) stay as ids (`<module>-CB<n>`). In the built shape a critical behaviour is shown by **a paired item**: the behaviour is tested by a normal-looking phish and by a suspicious-looking genuine item, so it is shown only when the learner gets both right.

- **Built behaviour it replaces:** the plan's remediation loop (a mentor replay and a fresh threat, up to two loops) is replaced by the built rule: the first answer is recorded, the reasoning is shown, and a *similar* item follows later in the set. No loop traps a learner.
- **Record:** shown, not shown, or not applicable, worked out from the paired items' records. "Not shown" schedules a defend-only drill for later (HA-21, wish list), and nobody else is told by name.
- **No gate by default.** A critical behaviour not shown does not stop completion. Making it a completion condition is an organisation option (section 6).

## 5. Before and after (Built, re-pointed)

The plan's "hook against Apply" pair is replaced by the built **pre-check against post-check** on parallel forms.

### What it shows

- **The learner** sees their post-check result beside their newest pre-check, when one exists.
- **The organiser** can compare a cohort's pre and post percent and report rate, with the discrimination figure beside them, for each role pair.

### What it doesn't show

It is a before and after on matched items for a cohort, not proof that behaviour at work has changed:

- **Short gap.** Pre and post can be minutes or days apart. It says nothing about whether the habit lasts or carries over to the learner's real inbox.
- **Alertness.** In a check, the learner knows suspicious items are coming. The mirror pairs reduce the reward for distrusting everything but don't remove the effect.
- **Form equivalence is designed, not proven.** The forms are matched and audited, and AB and BA pairs counterbalance them, but no pilot has tested their equivalence (A3).
- **Ceiling.** Where most people already do well on the pre-check, the change is small, and that is good news.
- **No comparison group.** Section 10 says how an organisation can get closer to one.

## 6. Knowledge checks, pass marks and other organisation options

None of these is built. Each is an option the organisation turns on, never a default, so the built product's behaviour stays as it is.

| Option | Status | What it adds | Rules |
|---|---|---|---|
| **Pass mark** on the post-check percent | New (R6) | A pass or "not yet" against a mark the organisation sets | Off by default. If set: 60% to 100%, with a warning below 70% that the evidence is weaker. The mark in force is stored with each result. Retakes use the other form pair. "Failed" is never shown |
| **Outcome tagging** | Builds on awareness-measure records | Per-outcome ratings (section 3) | Content work first: every item tagged |
| **Critical behaviours as completion conditions** | Builds on mirror pairs | A module counts as complete only when each critical behaviour is shown, or a drill is scheduled | Never blocks a learner without a route forward |
| **Certificates** (HA-06) | New, wish list | A certificate for a completed path | Shows completion and date, never scores |
| **Knowledge check items** (MG-20) | New | Scenario single-choice items for points triage cannot test (such as what to put in a report) | Kept short; no time limit; feedback for every option. Only where a module needs it |
| **Test-out** (D8) | New | The post-check alone for annual renewals | Off by default; annual renewals only unless widened |
| **Seeded draw from a bank** (BE-13) | Builds on parallel forms | Fresh items per play, about 12 per form | A later request to the triage system (R4) |
| **Assignment of AB or BA by learner** | Builds on AB/BA pairs | Removes the organiser's manual split | A later request (R3) |

### Writing new check items (kept)

- Short workplace situations at a brand-set company, not definitions; plain English, reading age about 11 to 12; no trick wording.
- Each item tagged with one or two outcome ids, a difficulty and its red flags from the shared library.
- Feedback written for every verdict, saying why. Genuine items get feedback too.
- Each module's question bank (`assessment.md`) is now a **pool of candidate items** for check forms and defend sets, not a quiz.

## 7. What a completion record contains (re-pointed)

### What the built product can evidence today (Built)

- **That training content exists and covers named topics:** seven episodes (E1 to E7), seven defend-only variants and 24 check missions, mapped to modules and requirements in `../02_COMPLIANCE_MAPPING.md`.
- **A practical exercise that simulates real events,** in every episode (NIST AT-2(1)).
- **An assessment** before and after training, per role, on matched forms, with no pass mark by default.
- **A per-round record** of every check and defend answer (section 2.5), with no free text and no identity in it.
- **Mission completion and score,** which the platform already shows organisers per course.

### What it cannot evidence yet

A completion record per person per module version, policy acknowledgements, certificates, an audit pack, and figures by department. These need the platform features in section 9, all on the wish list (`hacktivity.md`).

### A completion record (extension, HA-05)

When the platform side exists, a completion record would be written once per learner, per path version, per cycle, from the items below. It is **built on the awareness-measure blocks**, not on a separate event log.

| Field | What it holds | Source |
|---|---|---|
| Record id, type | A unique id; "path completion" | New |
| Organisation | The customer organisation | Platform |
| Learner | Opaque id, plus name and employee id at the time, held by the platform, never in the game record | Platform |
| Path and versions | The role pair, the episodes taken, their versions and content fingerprints (HA-19) | Builds on mission ids |
| Reporting route in force | The route the learner was shown (HA-11) | Builds on the reporting-route setting |
| Assignment | The rule, the due date, the cycle | New (HA-03) |
| Times | Started, completed, on time or late | Platform |
| Pre and post | Percent and report rate for each, and the form pair | Built (section 2.1) |
| Outcomes, critical behaviours | Only if the organisation turns on outcome tagging | Extension (sections 3, 4) |
| Pass mark | Only if the organisation set one, with the mark in force | Option (section 6) |
| Linked evidence | Policy acknowledgements (HA-07), certificate id (HA-06) | New |
| Integrity | When it was written, and a fingerprint | New (HA-05) |

**Never in the record:** the attack half (unscored, discarded), free text, time to answer per item, accessibility settings, IP addresses and device details.

## 8. From the game to the record

**Built today:** the episode runner plays the stages; the triage minigame scores the defend half or the check; the awareness-measure system writes one block per round into the learner's game (section 2.5); the post-check reads the pre-check's percent, report rate and done flag through the platform's carry-over; the debrief shows the learner their own result. Nothing leaves the learner's game except the mission's completion and score, which the platform already records.

**Extension (wish list):** the blocks, mapped to xAPI statements (BE-14, already shaped for it), would feed a completion record (HA-05), aggregate views (HA-09), a learning record store (HA-22) and a customer's LMS (HA-10). Any result reported to someone other than the learner is worked out on a server path, never taken from the browser as final. Statements identify the learner by an opaque account, never by name or email, and an attempt below an organisation's pass mark is "not passed yet", never "failed".

## 9. What each framework expects, and where it would come from

The requirements and how each was checked are in `../02_COMPLIANCE_MAPPING.md` (sections 3 to 5). This is the evidence side. The course supports compliance; the customer's auditor decides.

| Requirement | What is usually asked for | Built today | Extension |
|---|---|---|---|
| **ISO 27001 cl. 7.2** (competence, with documented evidence) | Training records per person; evidence that gaps were acted on | Pre and post checks per role; episode records | Completion records and transcripts (HA-05); drills for weak outcomes (HA-21) |
| **ISO 27001 cl. 7.3, A.6.3** (awareness; training by job function) | The training plan; records; regular updates | Role check pairs; episodes by role (E1 finance, E2 hr, E3 helpdesk, E4 executive, E5 general, E6 mobile, E7 everyone) | Paths and rules (HA-03); release notes (HA-19); acknowledgements (HA-07) |
| **PCI DSS 12.6.1 to 12.6.3.2** | Attendance records on hire and every 12 months; more than one method; acknowledgements; phishing and social engineering covered | E1 to E7 cover phishing and social engineering by email, phone, voicemail, text and QR code; defend-only variants as a second format | The audit pack's PCI DSS view (HA-05); acknowledgements (HA-07) |
| **NIST AT-2, AT-2(1), AT-3, AT-4** | Literacy and role training; practical exercises; individual records | Every episode is a practical exercise; role check pairs | Individual records with retention (HA-05, HA-15) |
| **CIS 14.1 to 14.9** | The programme, its schedule and its content | The built episodes and checks; the coverage in `02_COMPLIANCE_MAPPING.md` section 4 | Schedules (HA-03) |
| **NCSC CAF B6.a, B6.b** | Complete records; evaluation beyond a count of people reached; people reporting without fear | Pre and post change per role; report rate; discrimination figure for organisers; no-blame line and reporting route in every debrief | Records (HA-05); aggregate views (HA-09); evaluation (HA-14) |
| **DSPT 3.2.1, 2.1.1; DSPT B6.a, B6.b** | Share of staff trained in twelve months; an induction | Mission completion per course | The DSPT view (HA-05); worker types (HA-01) |
| **ICO training toolkit** (induction timing; an assessment, perhaps with a pass mark; completion monitored) | Completion rates; assessment results; follow-up | Pre and post checks, with a pass mark available as an option | Due dates and reminders (HA-03, HA-04) |
| **UK GDPR Art 5(2), Art 24, Art 32(4)** | Evidence of organisational measures | The episodes and checks as measures; a record that holds no free text or identity | The audit pack (HA-05) |
| **NIS2 Art 20(2), Art 21(2)(g), IR 8.1, IR 8.2** | Board training; a programme repeated over time and tested for effectiveness | E4 and the executive checks for leaders (touch only); pre and post change as a test, without an effectiveness claim | role_01 episodes; evaluation (HA-14) |
| **DORA Art 13(6), RTS Art 19** | Records for all staff; staff knowing the reporting channels | The reporting route in every debrief | Records by role (HA-05) |
| **HIPAA 164.308(a)(5), 164.316(b)** | Documentation kept six years | | Retention (HA-15) |
| **NYDFS 500.14(a)(3)** | At least annual training including social engineering | E1 to E7 | Annual cycle (HA-03) |
| **Cyber Governance Code C3, C4** | Directors' training; suitable metrics | Pre and post change and discrimination figure as candidate metrics | Board report (HA-09) |
| **SOC 2 CC1.4, CC2.2** | Evidence the programme runs as described | Mission completion | Records and release notes |

A common audit test is the joiner and the anniversary: pick people who started in the period and show they were trained within the window; pick others and show training within the last 12 months. The built product shows completion per course; the joiner list and sample need HA-05.

## 10. Measuring effect beyond the course

Completion shows that training happened. Organisations are also asked to show that it works: NCSC CAF B6.b says measuring only how many people were reached is not enough; NIS2 IR 8.1 asks for effectiveness to be tested; Cyber Governance Code C4 asks boards for "suitable metrics"; NIST SP 800-50r1 sets out metrics and evaluation.

**The product makes no effectiveness claim** (A3). The research is mixed. Ho and others (2025), a randomised trial with about 19,500 employees, found no significant relationship between recent annual training and failing a simulation, and a very small effect (an average absolute difference of 1.7%) for embedded training after a click. Lain, Kostiainen and Čapkun (2022) found embedded training as commonly deployed could make employees more susceptible. Neither study tested an attack-then-defend game, so neither answers whether this format works. Chothia and others (2018) report that students said such an exercise raised their awareness, but give no measured effect. Do not quote an effectiveness figure from any of them.

### Kirkpatrick's four levels

The Kirkpatrick model ([Kirkpatrick Partners](https://www.kirkpatrickpartners.com/the-kirkpatrick-model/)): **Reaction** (people find the training favourable and relevant), **Learning** (they acquire the intended knowledge and skills), **Behaviour** (they do it at work), **Results** (the targeted outcomes for the organisation occur).

| Level | Measures | Status |
|---|---|---|
| 1 Reaction | The platform's existing rating and comments after a mission; time taken against the estimate | Built (platform feedback) |
| 2 Learning | Pre and post change per role; report rate; discrimination figure | **Built** |
| 2 Learning, later | Per-outcome ratings; a drill on the same behaviour months later | Extension (sections 3, 4; HA-21) |
| 3 Behaviour | Report rate for real suspicious emails and for simulations; time to first report; payment changes verified by call-back; MFA and password manager take-up | New: the customer's own systems (HA-12, HA-14) |
| 4 Results | Incidents that began with phishing; time from first report to containment; fraud attempts stopped | New: the customer's incident records (HA-14) |

### Report rate and time to first report come first

For level 3, the measures put first are **report rate** (the share of people who received a phishing email, real or simulated, and reported it) and **time to first report**:

- They measure the behaviour every debrief rewards: the habit to keep, and reporting through the customer's route.
- They count successes. The NCSC warns that metrics express what an organisation values; "as well as measuring how many people clicked on a phishing email, focus on how many people reported it" ([NCSC, Phishing attacks: defending your organisation](https://www.ncsc.gov.uk/guidance/phishing)).
- They protect everyone. Lain, Kostiainen and Čapkun (2022) found employees reporting as a collective detection mechanism practical in a large organisation.

The built report rate in the checks is the in-game counterpart. It is not a substitute for the real one.

### The caveats (kept)

- **Click rates swing with the lure.** Compare only between campaigns of similar difficulty ([NIST Phish Scale](https://csrc.nist.gov/pubs/tn/2276/final), TN 2276), and never present a falling click rate on its own as proof.
- **"You clicked, here's a training page" doesn't help much** (Lain and others, 2022). A learner who clicks a simulation is offered a defend-only drill, never a "you failed" page (HA-12).
- **Training isn't the only thing that moves the numbers.** New filters, an MFA roll-out or a scam in the news all change level 3 and 4. Take a baseline, compare like with like, and where possible roll out by department so later departments act as a rough comparison.
- **Confidence isn't competence.** Self-report is an indicator, never a replacement for behaviour measures.
- **Small numbers mislead,** and can identify people. Aggregate thresholds apply (section 11).
- **Level 4 is rarely attributable.** Trends and stories, not cause and effect. Say so.

### A scorecard for the board (extension)

Each per quarter, by group above the threshold, with the caveats printed alongside: training completed on time; pre and post change per role; report rate in the checks; real report rate (and simulations, if run); median time to first report; share who say they would feel safe reporting a mistake (HA-14 pulse).

## 11. Ethics and privacy of decision data

The decisions a learner makes in a game say something about how they might act at work. Used badly (to rank, single out or discipline people), that would harm individuals and undo the reporting culture the course is there to build. The NCSC is blunt that "blaming users for clicking on links doesn't work" and that "employees who are afraid for their jobs will not report mistakes". The ICO's guidance on monitoring workers says workers must be told about monitoring in an accessible way and the employer must be clear about its purpose ([ICO, monitoring workers](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/employment/monitoring-workers/)).

### Already true in the build (Built)

- The attack half is never scored or ranked.
- No individual league tables.
- No free text and no identity in the record.
- The discrimination figure is for organisers only and never shown as blame.
- Reporting a genuine item is never penalised.
- Every debrief ends with a no-blame line and the customer's reporting route.

### Rules for every extension (kept)

1. **One purpose.** Learning data (item answers, ratings, the pre-check baseline) is for the learner's feedback and practice, and for improving the programme in aggregate. It is never used for discipline, performance reviews, pay, promotion or dismissal. This goes into the customer terms (HA-15) and is told to learners before they start.
2. **Compliance data is different.** Whether someone completed required training on time is seen by name so it can be chased. *How* they did stays out of it.
3. **Learners are told first.** A short plain notice before the first check. Suggested text:

   > *What we record when you play.* Whether you finish each episode and check, your result, and how you answered each message, call or page. Nothing you type is kept, and the record doesn't hold your name.
   > *Who sees it.* Your manager sees whether your training is done. They don't see your answers or your scores. Your training team sees results for groups, never yours by name.
   > *What it's for.* Your answers are practice. They are never used for discipline or performance reviews.

4. **Access by role** (for the platform extensions):

| Data | Learner | Manager | Organisation admin | Auditor |
|---|---|---|---|---|
| Assignments and completion | Own | Own team | Everyone | Everyone |
| Pre and post percent, report rate | Own | No | Aggregate; one person only with a recorded reason | Aggregate, unless the organisation includes it |
| Discrimination figure | No | No | Aggregate | Aggregate |
| Item answers | Own (in the debrief) | No | No (aggregate statistics only) | No |
| Route taken (game or text route) | Own | No | Everyone | Everyone |

   The route is not shown to managers because choosing the text route can hint at a disability.
5. **Thresholds.** Every aggregate follows HA-09: at least 10 people per group by default (never fewer than 5), no working out a small group by subtraction, no drill-down to names. The ICO's anonymisation guidance asks whether colleagues' own knowledge could identify someone ([ICO, anonymisation](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-sharing/anonymisation/how-do-we-ensure-anonymisation-is-effective/)). The aggregate size for an organiser view (A4) and hosting and learner privacy (A7) are open questions for the user, out of scope for now.
6. **No significant decisions by machine.** The course makes no decision with a legal or similarly significant effect on a person from training data ([UK GDPR Article 22A](https://www.legislation.gov.uk/eur/2016/679/article/22A)). Offering a drill is not a significant decision.
7. **Fairness.** The text route and the game must give the same records. Nothing is rated on speed. Items are reviewed for reading level and cultural assumptions.
8. **Results that leave the learner's own game are worked out on a server path,** never taken from the browser as final (the social build's conventions).
9. **Keep it only as long as needed.** Defaults for the platform extension: completion records while the person is active and 6 years after they leave (organisation sets 1 to 10); learning detail 2 years or 90 days after leaving, whichever is sooner; aggregates indefinitely. HA-15 sets the schedule.
10. **Simulations have extra rules** (HA-12, from the NCSC's guidance): HR agreement, staff told in advance, nobody punished or named, reports counted, fair lures, difficulty recorded, a DPIA.
11. **A DPIA, with the staff's view,** using the template in HA-15.
12. **Research only in aggregate,** anonymised, with the customer's agreement.

## 12. Open questions

1. **Outcome tagging first, or new episodes first?** *Recommendation:* tag items as each new episode (E8 onward) is written, and back-fill E1 to E7 in one content pass.
2. **Score bands for outcome ratings** (section 3). *Recommendation:* use 80 and 50 for the first cohort, then review with the panel.
3. **Pass mark as an option.** *Recommendation:* off by default; 60% at the lowest, with a warning below 70%.
4. **Outcome ratings in audit packs.** *Recommendation:* aggregate only; per person only if the organisation turns it on, and the export is logged.
5. **Verify in check forms.** The finance, executive, helpdesk and mobile forms set Verify on, where `BRAND_SET.md` §6 says it is off. The scenario files win; the brand set note needs updating (a candidate for `DECISIONS_PENDING.md`).
6. **Critical behaviour and check item ids.** *Recommendation:* add `<module>-CB<n>` and `<module>-Q<n>` to `MODULE_TEMPLATE.md`.

## References

- Kirkpatrick Partners, [The Kirkpatrick Model](https://www.kirkpatrickpartners.com/the-kirkpatrick-model/) (checked 14 October 2026).
- Lain, D., Kostiainen, K. and Čapkun, S. (2022) [Phishing in organizations: findings from a large-scale and long-term study](https://arxiv.org/abs/2112.07498), IEEE Symposium on Security and Privacy.
- Ho, G. and others (2025) "Understanding the efficacy of phishing training in practice", IEEE Symposium on Security and Privacy (as checked in `designs/11_awareness_product_episodes.md` section 5.2).
- Chothia, T. and others (2018), ASE '18 (as cited in `designs/11_awareness_product_episodes.md` section 5.2).
- Mislevy, R. J., Almond, R. G. and Lukas, J. F. (2003) *A brief introduction to evidence-centered design*, ETS Research Report RR-03-16.
- Shute, V. J. (2011) "Stealth assessment in computer-based games to support learning", in Tobias, S. and Fletcher, J. D. (eds) *Computer Games and Instruction*, Information Age Publishing.
- NCSC, [Phishing attacks: defending your organisation](https://www.ncsc.gov.uk/guidance/phishing) (published 5 February 2018, reviewed 13 February 2024).
- NIST, [NIST Phish Scale User Guide, TN 2276](https://csrc.nist.gov/pubs/tn/2276/final) (Dawkins and Jacobs, November 2023).
- ICO, [Employment practices and data protection: monitoring workers](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/employment/monitoring-workers/); [How do we ensure anonymisation is effective?](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-sharing/anonymisation/how-do-we-ensure-anonymisation-is-effective/).
- [UK GDPR Article 22A](https://www.legislation.gov.uk/eur/2016/679/article/22A), on legislation.gov.uk.
- Compliance references: `../02_COMPLIANCE_MAPPING.md`, which records how each was checked.
