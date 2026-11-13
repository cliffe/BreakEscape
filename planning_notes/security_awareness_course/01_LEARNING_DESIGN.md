# Learning design

How an episode works, why not every activity is a game, and what lab sheets become in this course. The episode shape below is **Built** in Incident Simulations: Critical Cases (E1 to E7, see `04_BUILT_SO_FAR.md`); this file explains it and says how new modules use it. Labels: **Built**, **Builds on E# / system X**, **New**.

## Short answer: should every activity be a game?

**Every module should be a game, but not every activity inside a module should be gameplay.**

The game is the spine: the learner starts in it, practises in it, is measured in it and finishes in it. But three jobs are done better by something other than free play:

1. **Telling people the rule.** The few facts everyone must know (how to report at this organisation, never share an MFA code, verify payment changes by phone on a known number) should be said plainly, not left for the learner to discover. A player who misses a clue in an escape room has missed a puzzle; a member of staff who misses the reporting route has missed the point of the course. Novices learn new procedures faster from direct explanation and worked examples than from discovery (Kirschner, Sweller and Clark, 2006). **Built:** the flip, the per-item feedback, concept cards and the debrief say the rule plainly, and every debrief shows the customer's reporting route.
2. **Producing clean evidence.** Auditors want a record that each person took part, and organisations want to know whether anything changed. **Built:** short role-based pre and post checks give that record, and double as retrieval practice.
3. **Giving everyone a route through.** Mandatory training has to be completable by every member of staff, including people who can't or won't play a real-time 2D game: screen reader users, people with motor or vestibular conditions, people on a locked-down thin client. That needs an equivalent text route, and it costs little because the dialogue and decisions already live in ink and authored data. **New** (BE-03); the build has a keyboard and plain-text baseline.

So the answer is "game first, not game only". Explanations and checks happen inside the training-room frame (the host welcomes the learner, the kiosk runs the episode, the checks are missions of their own), which keeps the experience whole without pretending that a lecture is a puzzle.

## What lab sheets become

Today a mission's lab sheet is a long HacktivityLabSheets page: concepts, worked examples and staged hints, shown as "Lab Sheet" in courses and "Walkthrough" in game events. Lab sheets are static pages: they can show callouts, collapsible hints, images and diagrams, but they record nothing.

In the awareness episodes the lab sheet is not the main learning activity. Its jobs split as follows, all drawn from the module's `concepts.md`:

| Product | What it is | Where it lives | Status |
|---|---|---|---|
| **"On Monday" card and the habit** | The one or two things to do at work next week, the rule of thumb and the customer's reporting route | The end of every debrief | **Built** |
| **Concept cards** | Short explanations shown during the episode (for example macros in E2, voice in E4 and E7) | Inside the episode runner | **Built**; new modules add their own |
| **Field guide** | The longer explanation behind each key message, with examples | A HacktivityLabSheets page linked from the mission | **New** (the build schedules lab sheets last) |
| **Text route** | The episode as an accessible interactive story with the same decisions and the same measurement | The text-only story player (BE-03) | **New** |
| **Facilitator notes** | Timings, pause points and discussion questions for running an episode with a team | A HacktivityLabSheets page, like the SIS facilitator notes | **New**; builds on the runner's `facilitated` flag. The built product will have one facilitator guide for the whole course, in the lab-sheet system, written last; per-episode notes are at most an extension of it |

Staged hints are not needed: episodes are short, the host and per-item feedback do the hinting, and the attack half is unscored. The intranet terminal (BE-09) is no longer needed for the episode format; it drops to "if a module needs it".

## The episode shape

Every full episode follows the same shape (**Built**). A full episode takes about 15 minutes (E6 and E7 about 16). The stage minutes below are the original per-stage targets; the built episodes now run to about 15 minutes in all.

| Stage | Purpose | Built format | Minutes |
|---|---|---|---|
| **Brief and scope note** | Set the scene at a client company and say plainly that this is an authorised exercise at a fictional company | Host NPC in the training room, then the kiosk opens the episode runner | 1 |
| **Attack half** | Look at public sources, then build one attack from templates whose blanks only take facts the learner has found (or a page, a pretext call or an MFA push run). Unscored, capped at one artefact, with a red-flag meter | OSINT browser, intel facts, mail client in template mode, landing-page builder, pretext call | 4 to 5 |
| **Flip** | The learner's own message arrives in a defender's inbox with its tells highlighted, and a defender line reacts to the learner's choices | Flip view | 1 |
| **Defend half** | Triage a set of messages, calls or pages with Trust, Report, Delete or Verify, with immediate feedback. Scored | Inbox triage | 4 to 5 |
| **Debrief** | A reasoning card per item, feedback on the genuine items, a "team protected" tally, the habit to keep, an "On Monday" card, the customer's reporting route and a no-blame line | Debrief view | 2 |

**Around the episodes (Built):** role-based pre and post checks, each a mission of its own of 10 items taking about 9 minutes (finance checks about 8 to 10), bracket one or more episodes.

**Defend-only variant (Built):** brief, defend, debrief, about 8 minutes (recommended for sessions under 30 minutes), with the same defend set, company, room and host as the full episode, so the measurement is unchanged. It exists for customers who object to the attack half.

### How the old seven beats map

The plan's seven beats (Hook, Learn, Practise, Apply, Debrief, Check, Reference) are retired. They map onto the built shape as follows (R3):

| Old beat | Now |
|---|---|
| Hook | Brief plus attack half |
| Learn | Flip plus concept cards |
| Practise and Apply | Defend half |
| Debrief | Debrief |
| Reference | The "On Monday" card and the habit to keep |
| Check | The post-check |

The old "hook against apply" before and after is now the pre-check against the post-check, on matched parallel forms.

### The consequence flip

Some topics have no natural attacker: data protection (core_05), handling information (core_06) and acceptable use (core_16). For these the attack half becomes a **consequence half** (**New**, builds on the episode runner and flip view): the learner makes the everyday mistake in a safe sandbox (sends the spreadsheet to the wrong "Sam", shares the folder with "anyone with the link", leaves the screen unlocked) and the flip shows where it led and who it reached. The defend half then asks them to spot and stop the same mistakes in a colleague's work. These modules can also use the defend-only shape instead (D13).

### Why this order

- **Attack before defend.** Building a convincing lure from a few public facts, and seeing it land, is what shifts the belief that "I would never fall for this" (Chothia, Paiu and Oultram, 2018). The defend half then follows while that is fresh. The attack half must never humiliate and is never scored or ranked.
- **Flip before defend.** The flip is the worked example: the learner's own message, with its tells shown, before they meet messages they did not write.
- **Feedback in the defend half.** Feedback is immediate per item, where it helps learning. The checks hold feedback to the end, so the measurement is clean.
- **Debrief after defend.** Debriefing is where a simulation's learning is made explicit; games without it teach less (Crookall, 2010).
- **Checks around the episode.** Recalling the key messages is itself practice (Roediger and Karpicke, 2006), and the pair of checks gives a before and after on matched items. Other Break Escape games avoid quizzes on purpose (the Tesseract lab has a "no quizzes" rule), and that is right for them. Here the checks are written as workplace items to triage, not definitions, and are separate missions, never a mid-game interruption.

## Delivery modes

Each module is designed once and delivered in several ways.

| Mode | Length | When it is used | Status |
|---|---|---|---|
| **Full episode** | About 15 minutes (E6 and E7 about 16) | Induction, annual assignment, role training | **Built** |
| **Defend-only variant** | About 8 minutes; recommended for sessions under 30 minutes | Customers who opt out of the attack half; spaced drills through the year; a "spotlight" when a new scam is in the news | **Built** |
| **Pre and post checks** | About 9 minutes each (finance about 8 to 10) | Around any set of episodes, per role | **Built** |
| **Text route** | About 10 minutes | Accessibility, low-spec devices, personal preference | **New** (BE-03) |
| **Facilitated session** | 30 to 45 minutes | A team plays together on one screen with a facilitator, pausing at marked points to discuss (the sis01 pattern) | **New**; builds on the runner's `facilitated` flag (prompts, no per-learner score on the shared screen) |

The defend-only variant replaces the old test-out idea: it offers the measured defence without the attack.

The episodes need no virtual machines. Like the Security-Informed Safety games they run in the browser alone, which keeps them cheap to host and easy to scale to whole organisations. The browser-only student lab `lab_social_engineering` is the separate technical product, using the same systems.

## Design principles

These apply to every module. Reviews check against them.

1. **Teach behaviours, not trivia.** Each module names one to three target behaviours (report it, verify through a known channel, lock your screen). Every stage serves them.
2. **Pair every threat with a doable action.** Fear without a clear, easy response makes people avoid the topic rather than act (Witte and Allen, 2000; protection motivation theory, Rogers, 1975). Each threat in the episode is followed at once by "and this is all you need to do", and every debrief ends on the habit to keep and the "On Monday" card.
3. **No blame.** People are the organisation's best detection system, not its weakest link (Adams and Sasse, 1999). A learner who falls for something and reports it quickly is shown as having done well. Reporting is never penalised, and every debrief carries a no-blame line (**Built**).
4. **Threats arrive inside real work.** In real life a phishing email arrives while you are busy with something else. The defend half is a role's own inbox, phone or call queue with genuine items mixed in (**Built**). A fuller work task around the defend half is **New** where a module needs it.
5. **Process over cues.** Spotting errors and odd addresses helps, but well-made attacks have none. Each module teaches the cues as hints and the process as the defence: the habit to keep, *"When a message pressures you to move money, grant access, sign in or read back a code, stop and check it yourself through a route you already trust, not the link, number or page the message gives you. Taking a minute to confirm is always a fair thing to do."*, then report. Large studies of phishing in organisations found that simulated phishing with click-through training pages barely changed behaviour, while easy reporting worked well (Lain, Kostiainen and Čapkun, 2022; Ho and others, 2025). We build for reporting.
6. **Short and respectful of time.** About 15 minutes per episode, about 8 minutes defend-only (recommended for sessions under 30 minutes) and about 9 minutes per check, with a clear core path and optional depth.
7. **Spaced, not crammed.** One annual sitting is forgotten quickly. Defend-only drills through the year use spaced practice (Cepeda and others, 2006).
8. **Realistic, current and local.** Threats look like the ones staff actually receive this year, at invented companies on `.example` domains with no real brands. UK first (NCSC, ICO, Report Fraud, which replaced Action Fraud in December 2025, and 7726 for scam texts), with organisation details filled in and other countries handled as localisations. Scotland differs in places (fraud is reported to Police Scotland on 101), so modules say "in England, Wales and Northern Ireland" where it matters.
9. **Plain English.** Short sentences, everyday words, technical terms explained the first time. Aim for a reading age of about 11 to 12 in the core modules.
10. **Accessible and inclusive by design.** WCAG 2.2 AA for every interface, an equivalent text route, text for every spoken line, no required fast reactions, a diverse cast that avoids stereotypes, and the learner's chosen avatar always wins. See `features/accessibility_and_inclusion.md`.
11. **Evidence by design.** Every scored item carries an id, so the debrief, the awareness-measure records and the organiser's discrimination figure all come from the same data (evidence-centred design: Mislevy, Almond and Lukas, 2003; stealth assessment: Shute, 2011). Records hold ids, verdicts and times, never free text and never the learner's identity.
12. **Three lenses on the same threat: understand the attacker, see it land, defend.** Most awareness training shows learners finished examples of attacks, which teaches that attacks are easy to spot and that people who fall for them are careless. The built episode gives three lenses in turn: the **attack** half (the learner builds the pretext from public details and sees a convincing one come together), the **flip** (their own message in a defender's inbox, tells highlighted) and the **defend** half (the process, principle 5). Having learners craft a believable lure, rather than only critique one, is what shifts the belief that "I would never fall for this" (Chothia, Paiu and Oultram, 2018). Attack-first is the default and defend-only is the opt-out. The attack stays at the level of templates, pretext and psychology: blanks only take facts the learner has found, sends reach fictional characters who reply through ink, links, pages and attachments are abstract models, never working ones, and there is no language model at runtime. The technical, hands-on version belongs in the browser-only student lab and Hacktivity's technical labs, not in all-staff awareness (D12).

## Why games, given all that

The case for building this as games rather than slides:

- **Practice in context transfers.** Recognising a payment fraud attempt while juggling a deadline is a different skill from answering a quiz question about it. Simulation games give that practice. Meta-analyses find well-designed games and simulations beat conventional instruction on learning and retention, especially with scaffolding, several sessions and supporting instruction (Sitzmann, 2011; Wouters and others, 2013; Clark, Tanner-Smith and Killingsworth, 2016).
- **There is a precedent for this exact topic.** The Anti-Phishing Phil game taught people to judge web addresses better than reading the same material (Sheng and others, 2007). A later university exercise had learners build spear-phishing lures themselves against a simulated company in an isolated environment; learners said it raised their understanding more than being shown examples, because they had to write something they themselves might fall for (Chothia, Paiu and Oultram, 2018). The built attack half borrows that idea at awareness level and in a sandbox, without its technical payload work.
- **Consequences can be shown safely.** A game can show what happens after a fraudulent payment, or where a misdirected file ends up. Slides can only describe it.
- **People finish it.** Compliance training is widely resented as a box-ticking chore. A course people talk about at lunch is a course whose messages get repeated.
- **Richer evidence.** Decisions on realistic items tell an organisation more about its risk than recall questions. The product makes no effectiveness claims; it reports a before and after on matched items.

## Explaining things: hosts, cards and feedback

Explanations are delivered in the world. The full design is in `features/explainers_video_and_npc.md`; in short:

- **The host introduces** (**Built**). Each training room has a host NPC from the client company who welcomes the learner and frames the episode. There is no recurring mentor across the course.
- **Concept cards and feedback strings explain** (**Built**). Short panels during the episode and a reasoning card per item in the debrief carry the teaching. New modules add their own.
- **Voices are text to speech** (**Built**), with the text always on screen. There is no video; EX-02 and EX-03 drop to P3 or "if a module needs it".
- **The attack half is the attacker view** (**Built**). EX-06 and MG-30 are delivered by the OSINT browser, the template composer, the landing-page builder and the pretext call.
- **The world teaches too** (**Builds on** the training rooms). Each room has a "REPORT IT" poster; in-world documents (EX-04) are **New** where a module needs them.

## Assessment in brief

Full design in `features/assessment_and_evidence.md`. In short (**Built**):

- Six roles (finance, hr, helpdesk, executive, general, mobile) each have two parallel 10-item check forms, played in AB or BA order as pre and post checks. The post-check shows the change from the newest pre-check, or says there is no baseline.
- Only the defend half of an episode and the checks are scored. There is **no default pass mark**. A pass mark or certificate on the post-check percent is a later organisation option, not a default.
- Every defend set holds a **mirror pair** (aw5): a genuine item that looks suspicious and a phish that looks normal. Each module's critical behaviours become mirror pairs, so the item is passed by following the process, not by spotting cues.
- Each module's old question bank becomes a pool of candidate items for check forms and defend sets.
- Awareness-measure records hold ids, verdicts and times. A discrimination figure goes to organisers only; learners get detailed feedback on the genuine items instead.
- The record shows who completed which mission and when, which supports what ISO 27001, PCI DSS, the NCSC Cyber Assessment Framework and the ICO's data protection audit framework expect to see. (On 30 September 2026 the Information Commission replaced the Information Commissioner; it keeps the ICO name.)

## References

- Adams, A. and Sasse, M. A. (1999) "Users are not the enemy", *Communications of the ACM*, 42(12), 40 to 46.
- Cepeda, N. J. and others (2006) "Distributed practice in verbal recall tasks: a review and quantitative synthesis", *Psychological Bulletin*, 132(3), 354 to 380.
- Chothia, T., Paiu, S.-I. and Oultram, M. (2018) "Phishing attacks: learning by doing", *USENIX Workshop on Advances in Security Education (ASE '18)*.
- Clark, D. B., Tanner-Smith, E. E. and Killingsworth, S. S. (2016) "Digital games, design, and learning: a systematic review and meta-analysis", *Review of Educational Research*, 86(1), 79 to 122.
- Crookall, D. (2010) "Serious games, debriefing, and simulation/gaming as a discipline", *Simulation and Gaming*, 41(6), 898 to 920.
- Ho, G. and others (2025) "Understanding the efficacy of phishing training in practice", *IEEE Symposium on Security and Privacy*.
- Kirschner, P. A., Sweller, J. and Clark, R. E. (2006) "Why minimal guidance during instruction does not work", *Educational Psychologist*, 41(2), 75 to 86.
- Lain, D., Kostiainen, K. and Čapkun, S. (2022) "Phishing in organizations: findings from a large-scale and long-term study", *IEEE Symposium on Security and Privacy*.
- Mayer, R. E. (2020) *Multimedia Learning*, 3rd edition, Cambridge University Press.
- Mislevy, R. J., Almond, R. G. and Lukas, J. F. (2003) *A brief introduction to evidence-centered design*, ETS Research Report RR-03-16.
- Roediger, H. L. and Karpicke, J. D. (2006) "Test-enhanced learning", *Psychological Science*, 17(3), 249 to 255.
- Rogers, R. W. (1975) "A protection motivation theory of fear appeals and attitude change", *Journal of Psychology*, 91(1), 93 to 114.
- Sheng, S. and others (2007) "Anti-Phishing Phil: the design and evaluation of a game that teaches people not to fall for phish", *Symposium on Usable Privacy and Security (SOUPS)*.
- Shute, V. J. (2011) "Stealth assessment in computer-based games to support learning", in Tobias, S. and Fletcher, J. D. (eds) *Computer Games and Instruction*, Information Age Publishing.
- Sitzmann, T. (2011) "A meta-analytic examination of the instructional effectiveness of computer-based simulation games", *Personnel Psychology*, 64(2), 489 to 528.
- Witte, K. and Allen, M. (2000) "A meta-analysis of fear appeals: implications for effective public health campaigns", *Health Education and Behavior*, 27(5), 591 to 615.
- Wouters, P. and others (2013) "A meta-analysis of the cognitive and motivational effects of serious games", *Journal of Educational Psychology*, 105(2), 249 to 265.
