# Assessment and evidence

How the course finds out what each learner can do, how it records that, and how one record serves three people: the learner (feedback), the organisation (insight in aggregate) and the auditor (evidence). It runs across the engine (BE-01, BE-02, BE-14), the minigames (MG-20) and the platform (HA-03, HA-05, HA-09, HA-10, HA-22). `modules/core_01_phishing_email/assessment.md` applies it to one module and is used for the examples here. Feature ids are from `README.md`; compliance references are the short forms in `../02_COMPLIANCE_MAPPING.md`.

## 1. Principles

1. **Assess behaviour in context, not just recall.** The main evidence is what the learner does when a threat arrives in the middle of a work task. The knowledge check adds evidence everyone recognises, and covers what play can't show.
2. **Evidence by design.** Every assessed moment is tagged with its learning outcome when the module is written, so the debrief, the learner's record, the dashboard and the audit pack all come from the same events (`01_LEARNING_DESIGN.md`, principle 11).
3. **Per outcome, not one score.** Results are reported per learning outcome as Secure, Developing or Not yet. The knowledge check score is reported too, because auditors and the ICO training toolkit expect one.
4. **Nobody is failed and left.** A learner who misses a critical behaviour is taken back to practise it. The check can be retaken. The words "fail" and "failed" appear nowhere a learner or a manager can see them.
5. **Fair to every route and every learner.** The text route (BE-03), the game and, where possible, facilitated sessions produce the same evidence. Nothing is rated on speed when a learner has turned timers off (BE-04).
6. **Private by default.** What a learner did in the game is for their learning. The organisation sees it only in aggregate above a privacy threshold, and never uses it for discipline (section 11).
7. **The server decides.** The game reports events; the platform applies the module's rules and writes the record, so a record can't be edited in a browser.

## 2. Evidence-centred design

Evidence-centred design (Mislevy, Almond and Lukas, 2003) builds an assessment from three linked models:

- **What we want to claim** about the learner (the student, or competency, model): here, the learning outcomes.
- **What we would need to see** to support each claim (the evidence model): observable behaviours, and the rules that turn them into ratings.
- **The tasks that draw out that behaviour** (the task model): the hook, the practice items, the threats in the mission, the check items.

Stealth assessment (Shute, 2011) adds that the tasks can be the game itself, so evidence is gathered while the learner plays rather than in a separate test.

### How it maps onto a module

| Part | In the course | Where it is written | Example from core_01 |
|---|---|---|---|
| Claim | Learning outcomes, 3 to 6 per module, each starting with a verb | The module's `README.md`, "Learning outcomes" | **C01-LO4** Check a suspicious request through a channel they already trust |
| Evidence | Assessed behaviours, each with Secure, Developing and Not yet defined as things the player does | `assessment.md`, "Assessed behaviours" | **C01-B3** Handles the hijacked thread. Secure: checks by phone using the directory number, then reports. Developing: reports without checking, or replies to the thread to ask. Not yet: signs in |
| Task | The beats and threats that give the player the chance to show the behaviour | `game_design.md`, "Structure" and "Decisions and consequences"; the check bank in `assessment.md` | The reply from Dawn's real address in the Apply beat; check item Q2 |
| Rule | Which game event sets which rating | The module's scenario data, read by BE-01 (transcribed from the behaviour table) | The phone call to the directory number followed by a report sets C01-B3 to Secure |

### Rules for writers

1. **Every outcome has at least two independent pieces of evidence**, at least one of them a behaviour in play (Practise or Apply) and at least one a check item. The module's key behaviour also has a hook baseline (section 5).
2. **Ratings describe actions, not states of mind.** "Calls the number in the directory" can be observed; "understands verification" can't.
3. **Every rating is tied to an event** the engine can see (an ink choice, a minigame result, an object or minigame event), tagged through BE-01 with the behaviour id, the outcome ids and the rating.
4. **Not applicable is not a pass or a fail.** If the situation never arose for this player (core_01's C01-B7 only applies to someone who clicked), the behaviour is recorded as not applicable and left out.
5. **Over-caution is never Not yet.** Reporting a genuine email is Developing at worst (core_01's C01-B9), because people who fear being wrong stop reporting.
6. **No gotchas.** Every threat in the Apply beat can be caught with the procedure taught in Learn and drilled in Practise.
7. **Ids.** Outcomes `<module>-LO<n>` and behaviours `<module>-B<n>` (as core_01 uses: C01-LO4, C01-B3); critical behaviours `<module>-CB<n>` and check items `<module>-Q<n>` (proposed, so records can refer to them; core_01 currently numbers them 1 to 3 and Q1 to Q11).

### Checking that it works

In the first pilot, before ratings are shown to organisations:

- **Agreement.** Two members of the course team rate 30 recorded playthroughs by hand, using the behaviour table; the engine's ratings should match theirs. Where they don't, the rule or the table is wrong.
- **Fit between the parts.** Learners who are Secure on an outcome in the mission should mostly answer its check items correctly. An item that strong players get wrong is reviewed (HA-08).
- **Fairness.** Compare ratings across routes (game, text route) and, where the numbers allow, languages. A gap points to a design problem, not to the learners.
- **Thresholds.** The cut-offs in section 3 are a starting point. A small panel (a security lead, a trainer, a learner representative) reviews borderline cases and adjusts them.

## 3. The rating per outcome: Secure, Developing, Not yet

### What the ratings mean

| Rating | To the learner | To the organisation |
|---|---|---|
| **Secure** | "You did the safe thing without being prompted, and you know why." | Likely to do it at work. |
| **Developing** | "You were partly there: safe, but not the whole habit yet, or right in one place and not another." | Worth more practice: a drill, or a spotlight module next year. |
| **Not yet** | "This one didn't land this time. Here's what to do, and a chance to practise it." | Needs practice. Never a fail, and never a disciplinary matter. |

The rating describes the evidence from this sitting, not the person.

### From behaviours to an outcome (the default rule)

1. **Score each piece of evidence** linked to the outcome: Secure 2, Developing 1, Not yet 0. A check item answered correctly scores 2, incorrectly 0. Not applicable evidence is left out.
2. **Weight it by where it came from:** the Apply beat counts double (2); Practise and the mentor's check question in Learn count 1; each knowledge check item counts 1; the **hook counts 0**, because it is a baseline taken before any teaching. For the check, only the latest attempt counts.
3. **Take the weighted average**, which runs from 0 to 2.
4. **Rate the outcome:**
   - **Secure** if the average is at least 1.5 *and* no Apply behaviour for this outcome is Not yet;
   - **Not yet** if the average is below 0.6;
   - **Developing** otherwise.
5. **Cap after remediation.** If a critical behaviour linked to the outcome was shown only after practice (section 4), the outcome is at most Developing for this sitting.
6. **Too little evidence.** If fewer than two pieces of evidence remain, or none comes from play, the outcome is "not rated" and the debrief says so. A well-designed module never produces this; when it happens, the module design is fixed.

A module's `assessment.md` can change the weights or cut-offs for one outcome, with a reason (for example an outcome shown only by an ordering task).

### Worked examples (core_01, C01-LO4)

C01-LO4 is evidenced by C01-B3 (the hijacked thread, Apply), C01-B5 (the callback phish, Apply) and a check item (Q2 or Q8).

| C01-B3 | C01-B5 | Check item | Weighted average | Rating |
|---|---|---|---|---|
| Secure (2) | Developing (1) | Right (2) | (4 + 2 + 2) / 5 = 1.6 | Secure |
| Not yet (0) | Secure (2) | Right (2) | (0 + 4 + 2) / 5 = 1.2 | Developing (and an Apply Not yet rules out Secure) |
| Not yet (0) | Not yet (0) | Right (2) | 2 / 5 = 0.4 | Not yet |
| Secure (2) | Secure (2) | Wrong (0) | 8 / 5 = 1.6 | Secure |

What the learner does in the mission weighs more than a quiz answer: someone who checked properly twice under pressure but slipped on one question is still Secure, while someone who signed in through the hijacked thread can't be Secure however well they answer the check.

### What each person sees

- **The learner** sees each outcome in the debrief (BE-02) as a sentence tied to what they did ("You rang Northbeck on the directory number before doing anything. That's exactly it."), and, for Developing and Not yet, the one thing to do differently and a link to practise. No numbers except the check score.
- **The organisation** sees distributions per outcome, by department, above the threshold (HA-09).
- **Auditors** see completion and the check score per person, and outcome results in aggregate; per-person outcome ratings only where the organisation has chosen to include them (section 11).

## 4. Critical behaviours and the remediation loop

### What makes a behaviour critical

A critical behaviour is one whose absence at work would cause real harm, and which the module exists to build: reporting a phish, not signing in through an unexpected link without checking, reporting your own mistake, verifying a change of bank details by phone, never sharing an MFA code. Each module names one to three, each linked to rows in its behaviour table. core_01's three are: report a phishing email with the Report button (C01-B1, B2, B4 or B5 at Secure); don't sign in through the hijacked thread without checking (C01-B3 not at Not yet); and report any click or sign-in of your own before the module ends (C01-B7 not at Not yet, where it applies).

### The loop

1. **At the end of the Apply beat**, the engine checks each critical behaviour (BE-01).
2. **If one wasn't shown**, the debrief says what happened without blame, and the mentor offers to go over it: "That one catches a lot of people. Let's try it once more."
3. **The mentor replays the relevant practice items** with the explanation, briefly (one to two minutes).
4. **A fresh threat of the same kind** arrives in a short replay of the Apply beat (one to three minutes), drawn from the bank so it isn't the same email again (BE-13).
5. **Shown:** recorded as "shown after practice", and the learner goes on to the check.
6. **Not shown:** a second loop, with a different threat and a more direct prompt from the mentor.
7. **After two loops**, the learner goes on to the check anyway. The record says "practised, not yet shown"; a private practice drill is scheduled for two to four weeks later (HA-03 "Practice" trigger, HA-21); the learner is offered help from the organisation's training contact. Nobody else is told by name.

Every attempt is kept in the record: the original decision and each loop.

### Why the loop stops at two

Trapping someone in a loop they can't get out of is unkind, unfair to people who find the game hard to play, and eats into work time. Two loops with fresh threats and direct prompting is enough to separate "missed it once" from "needs more than this module can give today", and the spaced practice drill picks it up later. This follows the course-level rule that a module counts as complete when the learner has shown each critical behaviour "or been taken back through the practice for it" (`00_COURSE_OVERVIEW.md`). core_01's `assessment.md` currently says the learner completes "when they show the behaviour"; it should add the two-loop limit.

### Text route and test-out

- The text route runs the same loop as text (BE-03).
- In a test-out (section 6), missing a critical behaviour sends the learner through the full module, with no "failed" label.

## 5. Before and after: the hook and the Apply beat

### The design rule

Each module names one **counterpart pair**: a decision in the hook and a decision in the Apply beat that test the same behaviour in a different situation, at the same difficulty or harder. In core_01 the pair is C01-B1 (the "mailbox almost full" phish in the hook) and C01-B2 (the lookalike Northbeck email in the mission): both are credential phish from a lookalike sender.

- **The hook comes before any teaching and is unannounced.** Whatever the learner does is recorded as a baseline. It never counts towards completion or an outcome rating (its weight is 0).
- **The hook never humiliates.** A click leads straight into the explainer: "That one fooled lots of people; here's how to spot the next one" (`01_LEARNING_DESIGN.md`).
- **Retakes draw a different hook** from the bank (core_01's open question 2), but only a learner's first sitting of a module version gives a true baseline, because by the second they have been taught. Organisation figures use first sittings only.

### What it shows

- **The learner** sees their own pair side by side in the debrief: "Before: you deleted it. After: you reported it, and Kai pulled it from 38 inboxes."
- **The organisation** sees, per module version and above the threshold, the share Secure at the hook and at Apply, and a small table of how people moved (Not yet to Secure, Developing to Secure, and so on).

### What it doesn't show

It is a good sign of learning, not proof that behaviour at work has changed:

- **Same session.** It measures learning within one module, minutes apart. It says nothing yet about whether the habit lasts or carries over to the learner's real inbox.
- **Alertness.** By the Apply beat the learner knows threats are coming. Putting them inside a work task with a deadline (BE-18) reduces this but doesn't remove it.
- **The pair's design.** If the Apply item is easier than the hook, the change is flattered. Pairs are reviewed for difficulty, and figures are compared only within one module version.
- **Ceiling.** Where most people are already Secure at the hook, the change is small, and that is good news, not a weak module.
- **No comparison group.** Section 10 says how to get closer to one.

Later evidence fills the gap: the drill on the same behaviour months later (HA-21), the next year's hook, and the behaviour measures in section 10.

## 6. Knowledge checks

### Purpose and place

The check gives evidence everyone recognises (the ICO training toolkit expects an assessment at the end of training, which could include a minimum pass mark), it is retrieval practice that helps people remember (Roediger and Karpicke, 2006), and it covers points the game can't show well. It comes at the end of the module, inside the world (the security team's "spot check" on the intranet), never as an interruption in the middle of play (`01_LEARNING_DESIGN.md`). MG-20 delivers it; HA-08 manages the items.

### Items

- **Types:** scenario single choice; multiple select; hotspot (with a list alternative for keyboard and screen reader users); ordering; true or false with a reason.
- **Writing:** short workplace situations, not definitions; plain English, reading age about 11 to 12; no trick wording, no double negatives, no "all of the above"; feedback written for every option, saying why.
- **Each item** is tagged with one or two outcome ids and a difficulty.

### Bank sizes

| Stage | Items per module | Per outcome | Why |
|---|---|---|---|
| Written with the module | 8 to 12 | At least 2 | A failed check can be retaken with a fresh set |
| After the first year (HA-08) | 18 to 24 | 3 to 4 | Several retakes without repeats; retire weak items |
| Organisation items | As many as the organisation writes | Mapped to an outcome or a policy | Local policy and procedures |

core_01 has eleven items with at least two for every outcome (Q11 is dropped where the organisation runs no simulations).

### Drawing a sitting

- **Six items** for a core module by default (the capstone, core_17, draws more), with at least one per outcome and at most two organisation items.
- **Stratified by outcome**, then by difficulty, so every sitting is about as hard as any other.
- **Options shuffled**, except in ordering items.
- **Parameters filled per play** (domains, names, amounts) from the content banks (BE-13), so colleagues can't pass on answers.
- **No repeats** within a sitting, and items the learner hasn't seen are preferred across attempts.

### Scoring and feedback

- One point per item. Multiple select and ordering items are right only when complete, unless the item lists accepted alternatives (core_01's Q4 accepts the first two steps in either order). No negative marking.
- **No time limit.** None is set by default, and any an organisation sets can be turned off by the learner (BE-04).
- After each answer the learner sees the feedback for the option they chose and the right answer. At the end, a summary links each missed point to the matching part of the reference card.

### Pass mark

- **Default 80%** (5 of 6), as in `00_COURSE_OVERVIEW.md`.
- An organisation can set it between 60% and 100%. Below 70%, the admin screen warns that the evidence will be weaker.
- The pass mark in force is stored with each result (HA-05), so a later change doesn't rewrite history.

### Retakes

- Unlimited, each drawing a fresh set.
- After two unsuccessful attempts, the mentor replays the Learn beat before the third (as in core_01).
- Every attempt is recorded. The completion record shows the passing attempt's score and the number of attempts; dashboards never show attempt counts by name.

### Test-out

An organisation setting, off by default (`DECISIONS_PENDING.md`, D8). The learner plays the Apply beat and takes the check, without Learn and Practise.

- **Pass:** the check passed and every critical behaviour shown first time. The module is complete, with the route "test-out".
- **Otherwise:** the learner goes through the full module from the start of Learn, with no "failed" label and nothing sent to anyone.
- Recommended scope: annual renewals of modules the learner has completed before, not a first induction. An organisation can widen it.
- A test-out still includes any policy acknowledgement and the reference card.

### Quality

Item statistics (how often an item is answered correctly, how well it separates stronger from weaker learners, how often each option is chosen) appear once an item has 200 responses (HA-08). Items that are too easy, too hard, or that strong learners get wrong are reviewed and, if needed, retired. Learners can report a problem with any item.

## 7. What a module completion record contains

A completion record (HA-05) is written once, when the learner has met the course's completion rules (`00_COURSE_OVERVIEW.md`): played it through (full module, text route, facilitated session, or a passed test-out); passed the knowledge check; shown each critical behaviour, or been taken back through the practice for it; and acknowledged any policy attached to the module. core_01 also requires the reference card to have been opened.

| Field | What it holds | Who needs it |
|---|---|---|
| Record id, type | A unique id; "module completion" | Everyone |
| Organisation | The customer organisation | Separation between customers |
| Learner | Opaque id, plus name and employee id at the time | Auditor, admin, learner |
| Module | Id, title, version and content fingerprint (HA-19) | Auditor: which content, which version |
| Organisation profile version | The profile in force (HA-11): what the learner was told about reporting | Auditor, admin |
| Assignment | The assignment, the rule that created it, the due date, the cycle | Auditor: "on hire" and "every 12 months" |
| Route and language | Game, text route, test-out, facilitated, LMS or imported; the language | Auditor, admin (not managers: see section 11) |
| Times | Started, completed, number of sittings, active minutes, on time or late | Auditor (dates and timeliness); admin (time spent, for planning) |
| Knowledge check | Items right, items drawn, the pass mark in force, passed, attempts | Auditor, admin, learner |
| Outcomes | Secure, Developing or Not yet per outcome id | Learner; organisation in aggregate; auditor only if the organisation includes it |
| Critical behaviours | Per critical behaviour: shown, shown after practice, practised but not yet shown, or not applicable | As outcomes |
| Before and after | The counterpart pair's hook and Apply ratings | Learner; organisation in aggregate |
| Linked evidence | Policy acknowledgements (HA-07), reference card opened, certificate id (HA-06), the attempt id | Auditor |
| Source | Hacktivity, an LMS (HA-10), a facilitated session (HA-13), or imported | Auditor |
| Integrity | When it was written (server time), its fingerprint and the previous record's (HA-05) | Auditor: evidence that it hasn't changed |

**Not in the record:** each decision event by event (kept in the attempt for two years, where the learner can see it, then deleted), anything the learner typed into the game (an incident report form's text stays in the attempt for the debrief and goes with it), accessibility settings, IP addresses and device details.

### A sample record

Robin Tait (a made-up learner) completed core_01 over two sittings. In the hook they deleted the phish rather than reporting it (Developing). In the mission they reported the lookalike Northbeck email (Secure), but signed in through the hijacked thread before checking. They reported their own sign-in at once, and after one practice loop with Ama they checked a fresh hijacked thread by phone, so their second critical behaviour was "shown after practice" and the two outcomes it links to (C01-LO3 and C01-LO4) are capped at Developing for this sitting.

```json
{
  "record_id": "cr_7Q2M9X41",
  "type": "module_completion",
  "organisation_id": "org_4821",
  "learner": { "id": "lrn_5c81e2", "name": "Robin Tait", "employee_id": "E10442" },
  "module": { "id": "core_01", "title": "Phishing emails", "version": "1.2.0", "fingerprint": "sha256:9c1e4b..." },
  "profile_version": 4,
  "assignment": { "id": "asg_55210", "rule": "Induction Essentials, within 14 days of start", "due": "2026-11-17", "cycle": 1 },
  "route": "game",
  "language": "en-GB",
  "started": "2026-11-05T09:12:40Z",
  "completed": "2026-11-06T14:03:12Z",
  "sittings": 2,
  "active_minutes": 21,
  "on_time": true,
  "check": { "correct": 5, "drawn": 6, "pass_mark_percent": 80, "passed": true, "attempts": 1 },
  "outcomes": {
    "C01-LO1": "Secure", "C01-LO2": "Secure", "C01-LO3": "Developing",
    "C01-LO4": "Developing", "C01-LO5": "Secure", "C01-LO6": "Secure"
  },
  "critical_behaviours": {
    "C01-CB1": "shown",
    "C01-CB2": "shown_after_practice",
    "C01-CB3": "shown"
  },
  "before_after": {
    "hook": { "behaviour": "C01-B1", "rating": "Developing" },
    "apply": { "behaviour": "C01-B2", "rating": "Secure" }
  },
  "policy_acknowledgements": [],
  "reference_card_opened": true,
  "certificate_id": "cert_8KQ2M7",
  "attempt_id": "att_90231",
  "source": "hacktivity",
  "recorded_at": "2026-11-06T14:03:15Z",
  "integrity": { "fingerprint": "sha256:51d0aa...", "previous": "sha256:e7730c..." }
}
```

## 8. From the game to the record, and out to an LMS

```
GAME (in the learner's browser)
  BE-01 assessed decisions
  MG-20 check answers              records: behaviour and option only, posted as they happen;
  BE-09 policy acknowledgements    the server rates them, and from P2 turns them into xAPI (BE-14, HA-22)
        |
        v
HACKTIVITY
  attempt (HA-05) --> the module's rules, applied on the server --> completion record (HA-05)
                                                                         |
                                                                         +--> certificate (HA-06)
                                                                         +--> assignment closed, reminders stop (HA-03, HA-04)
                                                                         +--> dashboards, above the threshold (HA-09)
                                                                         +--> audit pack and exports (HA-05)
OUTSIDE                                                                  |
                                                                         +--> the customer's LMS (HA-10): SCORM, LTI or cmi5
                                                                         +--> the customer's learning record store (HA-22, optional)
```

1. **Launch.** Hacktivity creates the attempt, stamps it with the module version (HA-19) and the organisation profile version (HA-11), and gives the game a short-lived token. The game builds the scenario with the organisation's values (BE-05).
2. **During play.** For each assessed moment, the game records which behaviour it was and which option the player took (never a rating), with the beat (hook, practise, apply, remediation), the game time and where it happened (BE-01). Knowledge check answers (MG-20), critical behaviour loops and policy acknowledgements (BE-09) are recorded the same way. Records are queued in the browser and posted within about a second; each has its own id, so sending one twice does no harm, and a dropped connection or a break between sittings (BE-12) loses nothing.
3. **The server rates them.** As each record arrives, the server checks it against the module's assessment map (the behaviour table, transcribed into the scenario data; the rating map never reaches the browser), works out the rating, the outcomes it counts towards and any critical behaviour it settles, and keeps a running summary for the game. Check answers are marked against keys the browser never receives.
4. **The debrief (BE-02)** shows the server's summary, so what the learner sees is exactly what is recorded.
5. **From P2, the statements.** The server also turns the records into xAPI statements (BE-14) and stores them in Hacktivity's learning record store (HA-22). Statements identify the learner by an opaque account, never by name or email, and no store credentials reach the browser.
6. **Completion.** When the rules in section 7 are met, the engine hands its summary to Hacktivity, which writes the completion record (HA-05) with the assignment, the versions and the times, links any policy acknowledgements, issues the certificate, closes the assignment, stops reminders and updates the dashboards.
7. **Out to an LMS** (HA-10), when the learner was launched from one: SCORM 1.2 gets `incomplete` until completion and then `passed` with the check score; SCORM 2004 gets completion and success separately, the scaled score and the session time (and per-outcome objectives only if the organisation turns them on); LTI 1.3 gets a score with activity progress Completed and grading progress FullyGraded through Assignment and Grade Services; cmi5 gets the cmi5 statements (initialized, completed, passed, terminated), and per-outcome statements only if the organisation turns them on.
8. **Out to a customer's own learning record store** (HA-22 forwarding), optional, filtered, with the same privacy caution.

### The statements, in outline

BE-14 defines the course's xAPI statements and publishes them as an xAPI profile. In outline:

| Moment | Verb | Object | Result and context |
|---|---|---|---|
| Session | initialized, suspended, resumed, terminated | The module | Registration per attempt; module version, route, language |
| Assessed decision | interacted | The behaviour (for example C01-B3) | The option chosen; a rating extension; the outcome ids |
| Check item | answered | The item (for example C01-Q2) | Correct or not; the option chosen |
| The knowledge check | passed; an attempt below the pass mark is recorded as failed inside Hacktivity only | The module's check | Scaled score |
| Module complete | completed | The module | Duration |
| Reference card opened, video watched | experienced | The card or video | |

Verbs are from the ADL vocabulary. Statements that leave Hacktivity never use failed: to a customer's LMS or store, an attempt below the pass mark is simply not passed yet (principle 4). For a learner launched through cmi5 (HA-10), the statements cmi5 defines go to the customer's LMS in the order cmi5 requires; per-decision statements go only if the organisation turns them on (BE-14 recommends module-level results by default). The xAPI version is the one BE-14 names: the current base standard, which ADL's [specification repository](https://github.com/adlnet/xAPI-Spec) points to as xAPI 2.0, maintained with IEEE (BE-14 gives the IEEE reference).

## 9. What each framework expects, and how the record meets it

The requirements, how each was checked, and which modules contribute are in `../02_COMPLIANCE_MAPPING.md` (sections 3 to 5). This table is the evidence side: what an auditor or assessor usually asks to see, and where it comes from. The course supports compliance; the customer's auditor decides.

| Requirement | What is usually asked for | Where it comes from |
|---|---|---|
| **ISO 27001 cl. 7.2** (competence, with documented evidence) | Training records per person; evidence that gaps were acted on and the action worked | Completion records and transcripts (HA-05); per-outcome results in aggregate and the hook-to-Apply change as evidence the training worked (HA-09); practice drills for Not yet outcomes (HA-21) |
| **ISO 27001 cl. 7.3, A.6.3** (awareness; training by job function, with regular updates) | The training plan; content covering the policy and each person's contribution; records; regular updates | Paths and assignment rules (HA-03); module outcomes and their mapping; policy acknowledgements (HA-07); release notes (HA-19); monthly drills (HA-21) |
| **PCI DSS 12.6.1 to 12.6.3.2** (a formal programme, reviewed every 12 months; training on hire and every 12 months by more than one method; annual acknowledgement; phishing, social engineering and acceptable use covered) | Programme documents; evidence of the annual review; attendance records for joiners and for the year; written or electronic acknowledgements; training content; staff interviews | The audit pack's PCI DSS view (HA-05): joiners' on-hire completion, annual completions, acknowledgements; core_01 with core_02 for 12.6.3.1, core_16 with the organisation's own policy for 12.6.3.2; release notes as review evidence (HA-19); the game, drills and reference cards as the multiple methods |
| **NIST AT-2, AT-3, AT-4** (literacy training on joining and periodically; role-based training; individual training records kept) | Individual records, kept for the period the organisation sets; role-based assignments | HA-05 records with retention set in HA-15; role paths assigned by job role (HA-03) |
| **CIS 14.1 to 14.9** (a programme with training at hire and at least annually; the named topics; role-specific training) | The programme, its schedule and its content | Paths and rules (HA-03); the coverage matrix in `02_COMPLIANCE_MAPPING.md` section 4 |
| **NCSC CAF B6.a, B6.b** (a positive culture; training for every role; each individual's training tracked and refreshed; complete records; routine evaluation, not just a count of people reached) | Complete individual records; refresh intervals; evidence of evaluation; signs that people report without fear | HA-05 and HA-03; learning insight (HA-09) and evaluation (HA-14); report rates and time to report (HA-12); the culture questions in HA-14 |
| **DSPT 3.2.1, 2.1.1** (categories 3 and 4: 95% of staff, directors, trustees and volunteers trained in the last twelve months; an induction) and **DSPT B6.a, B6.b** (CAF-aligned organisations) | The percentage figure and the induction process; for CAF-aligned organisations, as NCSC CAF | The audit pack's DSPT view: everyone in scope, including directors, trustees and volunteers (HA-01 worker types), with completions in the last twelve months; the Induction Essentials path |
| **ICO training toolkit** (induction before access to personal data and within one month; refreshers; an end-of-training assessment, perhaps with a pass mark; completion monitored and non-completers followed up) | Completion rates; records including senior staff; assessment results; follow-up | Induction rule defaults (HA-03); the check and its pass mark (MG-20); the reminder log (HA-04); dashboards (HA-09) |
| **UK GDPR Art 5(2), Art 24, Art 32(4), Art 39(1)(b)** (being able to show compliance; staff acting only on instructions; the DPO monitoring training) | Evidence of organisational measures; what the DPO reviews | The audit pack; dashboards a DPO can be given (as a compliance viewer, HA-01) |
| **NIS2 Art 20(2), Art 21(2)(g), IR 8.1, IR 8.2** (management bodies trained; cyber hygiene and training; a programme repeated over time and tested for effectiveness) | Board training records; the programme; evidence of effectiveness testing | role_01 completions for board members; per-outcome results and the before and after (HA-09); evaluation (HA-14) |
| **DORA Art 13(6), Art 5(4), RTS Art 19** (compulsory modules for all staff and senior management; the management body's own training; staff knowing the policies and the reporting channels) | Records for all staff and senior management; policy awareness | HA-05 records by worker type and role; acknowledgements (HA-07) |
| **HIPAA 164.308(a)(5), 164.316(b)** (a programme for all workforce members including management; documentation kept six years) | Training documentation for six years | The six-year retention option (HA-15); the transcript and audit pack (HA-05) |
| **NYDFS 500.14(a)(3)** (at least annual training including social engineering) | Annual records; content | The annual refresher path with core_01, core_02 and core_11 (HA-03); records |
| **Cyber Governance Code C3, C4** (directors' own training; assurance through suitable metrics) | Board training records; the metrics the board receives | role_01 records; the quarterly board report (HA-09) |
| **SOC 2 CC1.4, CC2.2** (competence; communicating security responsibilities) | Evidence that the training programme runs as described | Records, release notes, reminder logs |

A common test is the joiner and the anniversary: pick some people who started in the period and show they were trained within the window; pick some others and show training within the last 12 months, with their policy acknowledgement. The audit pack's joiner list and random sample (HA-05) are built for exactly that.

## 10. Measuring effect beyond the course

Completion shows that training happened. Organisations are also asked to show that it works: NCSC CAF B6.b says that measuring only how many people were reached is not enough; NIS2 IR 8.1 asks for effectiveness to be tested; the Cyber Governance Code (C4) asks boards to gain assurance "using suitable metrics"; NIST SP 800-50r1 sets out metrics and evaluation for a learning programme.

### Kirkpatrick's four levels

The Kirkpatrick model, which Donald Kirkpatrick created in the 1950s, is the usual frame. Its current definitions ([Kirkpatrick Partners](https://www.kirkpatrickpartners.com/the-kirkpatrick-model/)): **Reaction** is the degree to which people find the training favourable, engaging and relevant; **Learning** is the degree to which they acquire the intended knowledge, skills, attitude, confidence and commitment; **Behaviour** is the degree to which they perform the critical behaviours in their work; **Results** is the degree to which the targeted outcomes for the organisation occur.

| Level | The question | Measures for this course | Where the data comes from |
|---|---|---|---|
| 1 Reaction | Did people find it relevant and worth their time? | Relevance and confidence ratings; comments; completion without complaint; time taken against the estimate | Post-module questions (HA-14); records (HA-05) |
| 2 Learning | Did they learn the habit? | Per-outcome ratings; check scores; the hook-to-Apply change; the same behaviour in a drill months later | BE-01, MG-20, HA-09, HA-21 |
| 3 Behaviour | Do they do it at work? | **Report rate** for real suspicious emails and for simulations; **time to first report**; reports per click in simulations; "I clicked" calls to the service desk; payment changes verified by call-back (finance); MFA and password manager take-up; the culture questions ("I'd feel safe reporting a mistake") | The customer's mail platform and security team (HA-12); service desk and identity provider figures (HA-14); the annual pulse (HA-14) |
| 4 Results | Is the organisation safer? | Incidents that began with phishing, and their cost; time from first report to containment; fraud attempts stopped; audit findings closed | The customer's incident records, entered by the security team (HA-14) |

### Report rate and time to first report come first

The measures put first in every report are **report rate** (the share of people who received a phishing email, real or simulated, and reported it) and **time to first report** (how long after delivery the first report arrived):

- They measure the behaviour the course rewards most: *Pause. Check. Report.*
- They count successes. The NCSC warns that metrics express what an organisation values, and that valuing an absence of reported problems teaches people to keep quiet; "as well as measuring how many people clicked on a phishing email, focus on how many people reported it" ([NCSC, Phishing attacks: defending your organisation](https://www.ncsc.gov.uk/guidance/phishing)).
- They protect everyone. In a 15-month study of more than 14,000 employees, using employees as a collective detection mechanism was practical in a large organisation: it detected new campaigns fast, the load on the organisation was acceptable, and employees stayed active over long periods ([Lain, Kostiainen and Čapkun, 2022](https://arxiv.org/abs/2112.07498)).

Alongside them: the share of reports that turn out to be real threats, so the security team can see whether it is being swamped; a high level of harmless reports is a price worth paying, and the course never treats over-reporting as failure.

### The caveats

- **Click rates swing with the lure.** How many people click depends heavily on how hard the email is to spot, which is why NIST published a method for rating phishing difficulty, the [NIST Phish Scale](https://csrc.nist.gov/pubs/tn/2276/final) (TN 2276, 2023). Compare click rates only between campaigns of similar difficulty, and never present a falling click rate on its own as proof the course works.
- **"You clicked, here's a training page" doesn't help much.** Lain and others (2022) found that embedded training during simulated phishing, as commonly deployed in industry, didn't make employees more resilient and could make them more susceptible. Ho and others (2025) found little benefit from the usual training approaches in practice (`01_LEARNING_DESIGN.md`). The course offers a learner who clicks a simulation an optional drill, and never sends a "you failed" page (HA-12).
- **Training isn't the only thing that moves the numbers.** New mail filters, an MFA roll-out, a scam in the news or a busy season can all change level 3 and 4 measures. Take a baseline before the course starts, compare like with like (same quarter, similar campaigns), and where possible roll the course out by department over a few months, so departments that start later act as a rough comparison for those that started first.
- **Confidence isn't competence.** Self-reported confidence can rise without behaviour changing; it is an indicator, reported next to behaviour measures, never instead of them.
- **Small numbers mislead.** Rates for small teams jump about from month to month, and can identify people. The HA-09 thresholds apply to every one of these measures.
- **Level 4 is rarely attributable.** An organisation can show trends and stories ("the first report came in four minutes after delivery, and the campaign was pulled before anyone entered a password"), not a clean cause and effect. Say so in the board report.

### A scorecard for the board

Six measures, each per quarter, by department above the threshold, with the caveats printed alongside (HA-09's board report):

1. Training completed on time (induction and annual).
2. Share Secure per outcome, for the modules taken that quarter.
3. The hook-to-Apply change.
4. Report rate (real campaigns, and simulations if the organisation runs them).
5. Median time to first report.
6. Share of staff who say they would feel safe reporting a mistake (annual pulse).

## 11. Ethics and privacy of decision data

The decisions a learner makes in a game say something about how they might act at work. Used well, that helps them learn and helps the organisation aim its effort. Used badly (to rank, single out or discipline people) it would harm individuals, break trust in the course, and undo the reporting culture the course is there to build. The NCSC is blunt that "blaming users for clicking on links doesn't work" and that "employees who are afraid for their jobs will not report mistakes". The ICO's guidance on monitoring workers applies when employers use data about how workers behave: workers must be told about it in a way that is accessible and easy to understand, and the employer must be clear about its purpose ([ICO, monitoring workers](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/employment/monitoring-workers/)).

### The rules

1. **One purpose.** Learning data (decisions, per-outcome ratings, check answers, the hook baseline) is for the learner's feedback and practice, and for improving the programme in aggregate. It is not used for discipline, performance reviews, pay, promotion or dismissal. This is written into the data processing agreement and the order form (HA-15), told to learners before they start, and built into the product (no rankings, no named lists, no manager access to decisions).
2. **Compliance data is different.** Whether someone completed their required training on time is compliance data, seen by name so it can be chased; how the customer handles persistent non-completion is the customer's own HR policy. Even then, *how* someone did (their choices and ratings) stays out of it.
3. **Learners are told first.** Before their first module (core_00 and the privacy notice in HA-15), learners see a short, plain notice. A suggested text:

   > *What we record when you play.* Whether you finish each module and when, your check score, and how you handled each situation in the game.
   > *Who sees it.* Your manager sees whether your training is done and when it's due. They don't see your choices or your scores. Your training team sees results for groups of 10 or more people, never yours by name, unless you ask them for help.
   > *What it's for.* Your choices in the game are practice. They are never used for discipline or performance reviews.
   > *How long we keep it.* The detail of your choices for two years; the record that you completed your training for as long as your organisation needs it (usually some years after you leave).
   > *Your data.* You can see everything held about you on the "My data" page.

4. **Access by role.**

| Data | Learner | Manager | Organisation admin | Compliance viewer, auditor | Operator staff |
|---|---|---|---|---|---|
| Assignments, due dates, completion status | Own | Own team | Everyone | Everyone | In a logged support case |
| Completion dates, module versions, check pass and score | Own | Status only | Everyone | Everyone | In a logged support case |
| Route taken (game, text route, facilitated, test-out) | Own | No | Everyone | Everyone | In a logged support case |
| Per-outcome ratings, critical behaviours, before and after | Own | No | Aggregate only; one person only with "support access" and a recorded reason | Aggregate only, unless the organisation includes them in audit packs | In a logged support case |
| Decision events, check answers | Own | No | No (aggregate statistics only) | No | In a logged support case |
| Survey answers | Own | No | Aggregate only | Aggregate only | Aggregate only |
| Simulation results (HA-12) | Own | No | Aggregate only | Aggregate only | In a logged support case |

   The route isn't shown to managers because choosing the text route can hint at a disability; the text route is offered to everyone as an ordinary choice so it singles nobody out.
5. **Thresholds.** Every aggregate of learning, survey or simulation data follows HA-09: at least 10 people per group by default (never fewer than 5), no working out a small group by subtracting one group from another, filters checked on the final group, periods widened rather than small groups shown, no drill-down to names. The ICO's anonymisation guidance asks whether colleagues' own knowledge could identify someone, and managers know their teams well ([ICO, anonymisation](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-sharing/anonymisation/how-do-we-ensure-anonymisation-is-effective/)).
6. **No significant decisions by machine.** The course makes no decision with a legal or similarly significant effect on a person from their training data, by automated means or otherwise. (UK GDPR Articles 22A to 22D, substituted by the Data (Use and Access) Act 2025 and fully in force from 5 February 2026, govern significant decisions based solely on automated processing: [Article 22A](https://www.legislation.gov.uk/eur/2016/679/article/22A).) Automatically offering a practice drill is not a significant decision.
7. **Fairness.** The text route and the game give the same evidence. Nothing is rated on speed when a learner has turned timers off. Items are reviewed for reading level and cultural assumptions. The ICO's monitoring guidance gives the example of reports that ignore workers' reasonable adjustments being unfair; the same applies here, which is one more reason ratings are never used to judge individuals.
8. **Collect less.** No free text in records, no IP addresses or device details in learning data, no special category data, opaque ids in xAPI statements (HA-22), absence pauses without reasons (HA-03).
9. **Keep it only as long as needed.**

| Data | Kept for (default) |
|---|---|
| Completion records, acknowledgements, exemptions, certificates | While the person is active, then 6 years after they leave (the organisation sets 1 to 10 years) |
| Learning detail (decision events, ratings, check answers) | 2 years from the attempt, or 90 days after the person leaves, whichever is sooner |
| Raw xAPI statements | 12 months |
| Unfinished games | 90 days after last activity |
| Simulation results per person | 12 months |
| Aggregates (with no personal data) | Indefinitely |

   HA-15 sets the full schedule and the reasons.
10. **Simulations have extra rules.** HA-12's checklist, from the NCSC's guidance: HR agreement, staff told in advance, nobody punished or named, reports counted, fair lures, difficulty recorded, and a DPIA.
11. **A DPIA, with the staff's view.** Each customer completes a DPIA for the course using the template in HA-15. The ICO says employers must carry one out before monitoring likely to be high risk, and should seek and document the views of workers or their representatives when introducing monitoring.
12. **Research only in aggregate.** Any research use of course data is anonymised and aggregated, needs the customer's agreement, and goes through the operator's research ethics process.

## 12. Open questions

1. **Two loops, then move on.** This model caps the remediation loop at two and lets the learner continue to the check, matching the course-level completion rule. core_01's `assessment.md` says the learner completes "when they show the behaviour". *Recommendation:* adopt the two-loop cap and update core_01 to match.
2. **Outcome ratings in audit packs.** core_01's "Evidence for auditors" lists each assessed behaviour's rating in the learner's record. They are in the record; the question is who sees them by name. *Recommendation:* auditors see per-person completion and check results, and outcome ratings in aggregate; per-person ratings appear in audit packs only if the organisation turns that on, and the export is logged.
3. **The cut-offs (1.5 and 0.6) and the weights.** *Recommendation:* use them for the pilot, then set them properly with the panel described in section 2.
4. **The lowest pass mark an organisation can set.** *Recommendation:* 60%, with a warning below 70%.
5. **Test-out scope.** *Recommendation:* annual renewals only, unless the organisation widens it.
6. **Time on task.** Active time can under-count screen reader users who listen without pressing keys. *Recommendation:* count time while the module is in focus, with a long idle limit, and never use it as a pass condition (HA-05).
7. **Critical behaviour and check item ids.** *Recommendation:* add `<module>-CB<n>` and `<module>-Q<n>` to `MODULE_TEMPLATE.md` so every module's records can refer to them.

## References

- Kirkpatrick Partners, [The Kirkpatrick Model](https://www.kirkpatrickpartners.com/the-kirkpatrick-model/) (checked 14 October 2026).
- Lain, D., Kostiainen, K. and Čapkun, S. (2022) [Phishing in organizations: findings from a large-scale and long-term study](https://arxiv.org/abs/2112.07498), IEEE Symposium on Security and Privacy.
- Ho, G. and others (2025) "Understanding the efficacy of phishing training in practice", IEEE Symposium on Security and Privacy (as cited in `01_LEARNING_DESIGN.md`).
- Mislevy, R. J., Almond, R. G. and Lukas, J. F. (2003) *A brief introduction to evidence-centered design*, ETS Research Report RR-03-16.
- Shute, V. J. (2011) "Stealth assessment in computer-based games to support learning", in Tobias, S. and Fletcher, J. D. (eds) *Computer Games and Instruction*, Information Age Publishing.
- Roediger, H. L. and Karpicke, J. D. (2006) "Test-enhanced learning", *Psychological Science*, 17(3), 249 to 255.
- NCSC, [Phishing attacks: defending your organisation](https://www.ncsc.gov.uk/guidance/phishing) (published 5 February 2018, reviewed 13 February 2024).
- NIST, [NIST Phish Scale User Guide, TN 2276](https://csrc.nist.gov/pubs/tn/2276/final) (Dawkins and Jacobs, November 2023).
- ICO, [Employment practices and data protection: monitoring workers](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/employment/monitoring-workers/) (under review following the Data (Use and Access) Act 2025); [How do we ensure anonymisation is effective?](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-sharing/anonymisation/how-do-we-ensure-anonymisation-is-effective/).
- [UK GDPR Article 22A](https://www.legislation.gov.uk/eur/2016/679/article/22A), on legislation.gov.uk.
- [cmi5 specification, Quartz edition](https://github.com/AICC/CMI-5_Spec_Current); ADL's [xAPI specification repository](https://github.com/adlnet/xAPI-Spec).
- 1EdTech, [LTI Assignment and Grade Services 2.0](https://www.imsglobal.org/spec/lti-ags/v2p0).
- Compliance references: `../02_COMPLIANCE_MAPPING.md`, which records how each was checked.
