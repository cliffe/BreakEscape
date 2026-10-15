# Learning design

How a module works, why not every activity is a game, and what lab sheets become in this course.

## Short answer: should every activity be a game?

**Every module should be a game, but not every activity inside a module should be gameplay.**

The game is the spine: the learner starts in it, practises in it, is assessed in it and finishes in it. But three jobs are done better by something other than free play:

1. **Telling people the rule.** The few facts everyone must know (how to report at this organisation, never share an MFA code, verify payment changes by phone on a known number) should be said plainly by a character or a short video, not left for the learner to discover. A player who misses a clue in an escape room has missed a puzzle; a member of staff who misses the reporting route has missed the point of the course. Novices learn new procedures faster from direct explanation and worked examples than from discovery (Kirschner, Sweller and Clark, 2006).
2. **Producing clean evidence.** Auditors want a record that each person met each requirement. Assessed decisions inside the game give rich evidence, but a short knowledge check gives evidence everyone recognises, and it doubles as retrieval practice.
3. **Giving everyone a route through.** Mandatory training has to be completable by every member of staff, including people who can't or won't play a real-time 2D game: screen reader users, people with motor or vestibular conditions, people on a locked-down thin client. That needs an equivalent text route, and it costs little because the dialogue and decisions already live in ink.

So the answer is "game first, not game only". Explanations and checks happen inside the game world (a colleague explains, a screen in the meeting room plays a video, the quiz is the security team's "spot check" on the intranet), which keeps the experience whole without pretending that a lecture is a puzzle.

## What lab sheets become

Today a mission's lab sheet is a long HacktivityLabSheets page: concepts, worked examples and staged hints, shown as "Lab Sheet" in courses and "Walkthrough" in game events, and openable inside the game through a `lab-workstation` object. Lab sheets are static Jekyll pages: they can show callouts, collapsible hints, images, YouTube embeds and Mermaid diagrams, but they record nothing (no quiz scoring, no completion tracking, no forms).

In the awareness course the lab sheet is no longer the main learning activity. It splits into four things, all generated from the module's `concepts.md`:

| Product | What it is | Where it lives | Who uses it |
|---|---|---|---|
| **Reference card** | One page: the key messages and the procedure, with the organisation's own reporting details filled in | In game on the company intranet terminal (a reskinned `lab-workstation`), in Hacktivity, printable | Every learner, during and after the module |
| **Field guide** | The longer explanation behind each key message, with examples | HacktivityLabSheets page, linked from the reference card | Learners who want more; managers; champions |
| **Text route** | The module as an accessible interactive story with the same decisions and the same assessment | The text-only story player (BE-03) | Anyone who needs or prefers it |
| **Facilitator notes** | Timings, pause points and discussion questions for running the module with a team | HacktivityLabSheets page, like the SIS facilitator notes in `mission.json` | Trainers, security champions |

The staged hints of a mission lab sheet are mostly not needed: awareness modules are short, and the mentor character gives hints in the game. The intranet terminal replaces the "Lab Sheet" popup for this course, and is where the organisation's own policies sit (see `features/break_escape_engine.md`, BE-09).

## The module pattern

Every full module follows the same seven beats. A typical full module takes 15 to 20 minutes.

| Beat | Purpose | Usual format | Minutes |
|---|---|---|---|
| **Hook** | Drop the learner into a normal working moment where the threat arrives unannounced. Whatever they do is recorded as a baseline and becomes the reason to learn. | Game scene | 1 to 2 |
| **Learn** | State the key messages and the procedure, with one worked example. | NPC explainer with visual aids, or a short video on an in-world screen | 2 to 4 |
| **Practise** | Short, focused repetition with immediate feedback, getting gradually harder. | Minigame drill | 3 to 4 |
| **Apply** | A realistic work task in which the threats appear without warning, with consequences that play out. | The mission | 5 to 8 |
| **Debrief** | Show what happened, what the learner did, what good looks like and why. | Debrief screen, then the mentor | 2 |
| **Check** | Five or six scenario questions drawn from the module's bank. | Knowledge check minigame | 2 |
| **Reference** | Leave the learner with the card and the reporting route. | Intranet terminal and Hacktivity | under 1 |

The Hook and the Apply beat test the same behaviour in different contexts. Comparing them gives a before and after for each learner and each organisation, which is both good feedback and good evidence that the course works.

### Why this order

- **Hook before Learn.** Meeting the problem first, and sometimes getting it wrong, makes the explanation that follows matter. The hook must never humiliate: a click in the hook leads straight into the explainer with "that one fooled lots of people; here's how to spot the next one".
- **Practise before Apply.** Feedback is immediate in the drill, where it helps learning, and held back in the mission, where immediate correction would break the realism the mission is testing.
- **Debrief after Apply.** Debriefing is where a simulation's learning is made explicit; games without it teach less (Crookall, 2010).
- **Check last.** Recalling the key messages at the end is itself practice (Roediger and Karpicke, 2006), and it produces the record. Other Break Escape games avoid quizzes on purpose (the Tesseract lab has a "no quizzes" rule), and that is right for them. Here a short check is needed for evidence, so it is kept to the end of the module, written as workplace situations rather than definitions, and delivered in the world (a colleague's spot check on the intranet), never as a mid-game interruption.

## Delivery modes

Each module is designed once and delivered in several ways.

| Mode | Length | When it is used |
|---|---|---|
| **Full module** | 15 to 20 minutes (capstone 30 to 45) | Induction, annual assignment, role training |
| **Micro-drill** | 3 to 5 minutes | Monthly practice through the year; reminders after an incident; a "spotlight" when a new scam is in the news |
| **Text route** | 10 to 15 minutes | Accessibility, low-spec devices, personal preference |
| **Facilitated session** | 45 to 60 minutes | A team plays together on one screen with a facilitator, pausing at marked points to discuss (the sis01 pattern) |
| **Test-out** (optional, set by the organisation) | 10 minutes | Experienced staff take the Apply beat and the Check without the teaching; a pass records the module as complete, a fail sends them through the full module |

The awareness course needs no virtual machines. Like the Security-Informed Safety games it runs in the browser alone, which keeps it cheap to host and easy to scale to whole organisations. Role modules for technical staff link out to existing Hacktivity VM labs as optional depth.

## Design principles

These apply to every module. Reviews check against them.

1. **Teach behaviours, not trivia.** Each module names one to three target behaviours (report it, verify through a known channel, lock your screen). Every beat serves them.
2. **Pair every threat with a doable action.** Fear without a clear, easy response makes people avoid the topic rather than act (Witte and Allen, 2000; protection motivation theory, Rogers, 1975). Each scare in the game is followed at once by "and this is all you need to do".
3. **No blame.** People are the organisation's best detection system, not its weakest link (Adams and Sasse, 1999). A learner who falls for something and reports it quickly is shown as having done well. Characters who report mistakes are thanked in the story.
4. **Threats arrive inside real work.** In real life a phishing email arrives while you are busy with something else. The Apply beat always gives the learner a work task to finish, and the security tests appear inside it, unannounced.
5. **Process over cues.** Spotting errors and odd addresses helps, but well-made attacks have none. Each module teaches the cues as hints and the process (pause, verify another way, report) as the defence. Large studies of phishing in organisations found that simulated phishing with click-through training pages barely changed behaviour, while easy reporting worked well (Lain, Kostiainen and Čapkun, 2022; Ho and others, 2025). We build for reporting.
6. **Short and respectful of time.** Fifteen to twenty minutes per module, a clear core path, optional depth, and test-out where the organisation allows it.
7. **Spaced, not crammed.** One annual sitting is forgotten quickly. Micro-drills through the year use spaced practice (Cepeda and others, 2006).
8. **Realistic, current and local.** Threats look like the ones staff actually receive this year. UK first (NCSC, ICO, Report Fraud, which replaced Action Fraud in December 2025, and 7726 for scam texts), with organisation details filled in and other countries handled as localisations. Scotland differs in places (fraud is reported to Police Scotland on 101), so modules say "in England, Wales and Northern Ireland" where it matters.
9. **Plain English.** Short sentences, everyday words, technical terms explained the first time. Aim for a reading age of about 11 to 12 in the core modules.
10. **Accessible and inclusive by design.** WCAG 2.2 AA for every interface, an equivalent text route, captions and transcripts for every spoken line and video, no required fast reactions, a diverse cast that avoids stereotypes. See `features/accessibility_and_inclusion.md`.
11. **Evidence by design.** Every assessed decision is tagged with the learning outcome it shows, so the debrief, the learner's record and the organisation's dashboard all come from the same data (evidence-centred design: Mislevy, Almond and Lukas, 2003; stealth assessment: Shute, 2011).
12. **Three lenses on the same threat: detect, behave, understand the attacker.** Most awareness training shows learners finished examples of attacks, which teaches that attacks are easy to spot and that people who fall for them are careless. Two things counter that. First, we teach the *process* (principle 5), not spotting. Second, where a module can carry it, we let the learner briefly take the attacker's side in a safe, sandboxed exercise: building the pretext themselves, from public details, and seeing a convincing one come together. Having learners craft a believable lure, rather than only critique one, is what shifts the belief that "I would never fall for this" (Chothia, Paiu and Oultram, 2018). We keep this at the level of pretext and psychology, never the technical delivery of an attack: no payloads, no real sending, everything fictional and in a sandbox that cannot reach the outside, and the attacker view always hands back to the defence. The technical, hands-on-keyboard version of "learning by doing the attack" belongs in Hacktivity's technical labs for specialist and developer audiences, not in all-staff awareness (see `DECISIONS_PENDING.md`, D12).

## Why games, given all that

The case for building this as games rather than slides:

- **Practice in context transfers.** Recognising a payment fraud attempt while juggling a deadline is a different skill from answering a quiz question about it. Simulation games give that practice. Meta-analyses find well-designed games and simulations beat conventional instruction on learning and retention, especially with scaffolding, several sessions and supporting instruction (Sitzmann, 2011; Wouters and others, 2013; Clark, Tanner-Smith and Killingsworth, 2016).
- **There is a precedent for this exact topic.** The Anti-Phishing Phil game taught people to judge web addresses better than reading the same material (Sheng and others, 2007). A later university exercise took the opposite tack and had learners build spear-phishing lures themselves against a simulated company in an isolated environment; learners said it raised their understanding more than being shown examples, because they had to write something they themselves might fall for (Chothia, Paiu and Oultram, 2018). Our optional attacker-view activity (MG-30) borrows that idea at awareness level and in a sandbox, without its technical payload work.
- **Consequences can be shown safely.** A game can show what happens three weeks after a fraudulent payment, or how far ransomware spreads in the hours before someone reports it. Slides can only describe it.
- **People finish it.** Compliance training is widely resented as a box-ticking chore. A course people talk about at lunch is a course whose messages get repeated.
- **Richer evidence.** Decisions under realistic pressure tell an organisation more about its risk than quiz scores.

## Explaining things: NPCs and video

Explanations are delivered in the world. The full design is in `features/explainers_video_and_npc.md`; in short:

- **The mentor explains** (EX-01). A recurring security colleague (see `03_WORLD_AND_CAST.md`) explains in short chunks, with visual aids shown in the conversation panel (an annotated email, a diagram), then asks one check question. Players who already know the material can say so and skip, but the check question still runs. This builds on the instructor NPC pattern already used by the `lab_*` scenarios and the ink conversions in `story_design/ink/lab_sheets/`.
- **Videos play on screens in the world** (EX-02, EX-03, MG-21). A meeting room screen or a laptop plays a 60 to 120 second explainer with captions and a transcript. The cheapest consistent source is video recorded from the engine itself, using the existing characters and voices.
- **Demonstrations show an attack happening** (EX-05). A short cutscene shows a colleague receiving a call and being talked into something, then the mentor unpicks what happened.
- **Attacker-view interludes** (EX-06). In some modules the learner briefly plays the attacker (an authorised tester building a pretext from social media, a physical tester tailgating in) to see how easy it is. This reuses the campaign's lockpicking, RFID and social engineering mechanics, and stays at the level of "this is how little they need", never a how-to.
- **The world teaches too** (EX-04). Posters, intranet pages, emails from the security team and notices on desks carry the same messages, the way a real office does.

## Assessment in brief

Full design in `features/assessment_and_evidence.md`. In short:

- Each learning outcome is evidenced by in-game behaviour (the hook, practice and mission decisions) and by knowledge check items.
- Results are reported per outcome as Secure, Developing or Not yet, not as one score.
- A module is complete when the learner has played it through, passed the knowledge check (default 80%, set by the organisation) and either shown each critical behaviour or been taken back through it. Nobody is failed and left; they are looped back to practise.
- The record shows who completed what, when, which version and with what result, which is what ISO 27001, PCI DSS, the NCSC Cyber Assessment Framework and the ICO's data protection audit framework expect to see. Time on task is kept too, for the organisation's own use. (On 30 September 2026 the Information Commission replaced the Information Commissioner; it keeps the ICO name.)

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
