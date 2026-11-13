# Module template

Every module folder under `modules/` holds the same four files. Copy this structure for a new module. The headings are fixed so modules can be compared side by side and checked by script; the content under each heading is free.

```
modules/<id>_<short_name>/
  README.md        the module card: what, who, why, outcomes, build status, flow, build notes
  concepts.md      what to teach: the facts the episode, concept cards and "On Monday" card must match
  game_design.md   the episode: concept, stages, decisions, minigames, explainers, variants
  assessment.md    how we measure it: assessed behaviours, mirror pairs, candidate check items, evidence
```

`concepts.md` plays the part the information pack plays for the Security-Informed Safety games: it is the source of truth. If the game and the concepts file disagree, the concepts file wins and the game is fixed.

Every module is now planned as one or more episodes in the built shape of Incident Simulations: Critical Cases (`04_BUILT_SO_FAR.md`, `01_LEARNING_DESIGN.md`): brief, attack (or consequence) half, flip, defend half, debrief, plus a defend-only variant and items for the role's pre and post check forms. Where a module is already covered by E1 to E7 or the checks, say so under "Build status" and plan only what it adds. Mark each item **Built**, **Builds on E# / system X** or **New**.

Ids: core modules are `core_NN`, role modules `role_NN`, sector modules `sector_NN`. Within a module, use the prefix `CNN`, `RNN` or `SNN` (`C01`, `R02`, `S01`) for: learning outcomes (`C01-LO1`), assessed behaviours (`C01-B1`), critical behaviours (`C01-CB1`) and knowledge check items (`C01-Q1`). Q items are now candidate items for check forms and defend sets. Keep these ids stable and never renumber; add new ids at the end of a list. Feature references use the ids in `features/README.md` (`BE-01`, `MG-01`, `EX-01`, `HA-05`). Compliance references use the short names in `02_COMPLIANCE_MAPPING.md`.

---

## README.md

```markdown
# <ID>: <Module title>

**Working game title:** <title>
**Pitch:** <one sentence a buyer and a learner would both understand>

| | |
|---|---|
| Audience | <all staff / role / sector> |
| Prerequisites | <usually core_00; anything else> |
| Company and host | <a brand-set company (Brightwell Foods, Tarrowby Logistics, Quayholt Insurance, Merrin & Sallow Architects) and its host NPC, or a new invented company marked "proposed, to add to BRAND_SET.md" with a `.example` domain> |
| Full module | <full episode minutes, about 15> |
| Micro-drill | <defend-only variant minutes, about 8, or "none"> |
| Text route | <minutes; New until BE-03 is built> |
| Priority | <MVP / Phase 2 / Phase 3> |
| Build size | <S / M / L, with one line on what drives it> |

## Build status
<What is already built for this module, from 04_BUILT_SO_FAR.md §3: the episodes (E1 to E7), defend-only variants and check roles that cover it, and the coverage (None / Touch / Narrow / Part / Large). Then what this module adds, each item marked Built, Builds on E# / system X, or New.>

## Why this module
<The risk in plain words: what goes wrong, how often, what it costs. One or two real cases by name, year and one line each.>

## Target behaviours
<The one to three things we want people to actually do differently. Behaviours, not knowledge: "reports a suspicious email with the Report button", not "knows what phishing is".>

## Learning outcomes
<Three to six, each measurable and starting with a verb. "After this module, staff can ...">
- **<ID>-LO1** ...

## Compliance coverage
<Which framework requirements this module helps meet, using the references in 02_COMPLIANCE_MAPPING.md. Say "contributes to" unless the module alone meets it.>

## Module flow
| Stage | What happens | Format | Minutes |
|---|---|---|---|
| Brief | <the host's welcome and the scope note: an authorised exercise at a fictional company> | Host NPC, kiosk | 1 |
| Attack (or Consequence) | <attack: public sources, then one artefact built from templates whose blanks take only found facts; unscored. Consequence, for topics with no natural attacker: the learner makes the everyday mistake in a safe sandbox> | OSINT browser, template composer, page builder, pretext call / sandbox | 4 to 5 |
| Flip | <the learner's own artefact in a defender's inbox with its tells highlighted, or where the mistake led> | Flip view | 1 |
| Defend | <the triage set: channels, items, phish and genuine counts, Verify on or off; scored, with a mirror pair> | Inbox triage | 4 to 5 |
| Debrief | <reasoning cards, genuine-item feedback, team-protected tally, the habit to keep, the "On Monday" card, the reporting route, the no-blame line> | Debrief view | 2 |
| Checks | <the role check pair this episode sits inside, and the new items it adds to forms A and B> | Pre and post check missions | about 9 each |
| Defend-only variant | <brief, defend, debrief with the same defend set> | Episode runner | about 8 |

## Reuse from existing Break Escape content
<Built episodes, check forms, rooms, hosts, systems, ink patterns, missions: name them with paths.>

## New features needed
<Feature ids from features/README.md, one line each on what this module needs from the feature, with its build status.>

## Organisation-specific content
<What the customer must supply for this module: reporting route, contacts, policy names and so on.>

## Open questions
<Decisions for the user, each with a recommended default.>
```

## concepts.md

```markdown
# <ID> concepts: <Module title>

## Key messages
<The three to five things every learner must leave with, in the words we want them to remember.>

## Concepts
<Each concept explained in plain English for the writers: what it is, why it matters, what to do. Accurate, current, UK first. Where advice differs by country or organisation, say so.>

## What to do (the procedure)
<The steps we teach, in order, written as the "On Monday" card and field guide will show them.>

## Misconceptions and outdated advice
<What people wrongly believe and what older training wrongly taught, with the current position and its source.>

## Real cases
<Name, year, one line, and where to check it. Use these in the game only as inspiration, with fictional names.>

## Organisation-specific slots
<Each value the customer fills in, with a sensible default.>

## Glossary
<Terms the module uses, one line each, plain English.>

## Sources
<NCSC, ICO, legislation, standards, research. Link to the primary source.>
```

## game_design.md

```markdown
# <ID> game design: <Working game title>

## Concept
<The premise in a paragraph: the company and the training room, the role the learner plays in each half, what they build (or what mistake they make) in the attack or consequence half, and what arrives in the defend half.>

## Setting and cast
<The brand-set company and its training room, the host, the staff from BRAND_SET.md who appear, any new characters or a proposed new company.>

## Structure
<The stages in order (brief, attack or consequence, flip, defend, debrief), each with what the learner does and learns, and what is scored (the defend half only).>

## Decisions and consequences
<Each decision point: the options, what each leads to, which learning outcome it evidences, and how the consequence is shown. Every threat is paired with a doable action. No option shames the player.>

## Minigames
<Existing minigames reused (with folder names) and new ones (with MG ids). For each, what it teaches here and how it is configured.>

## Explainers
<Each host line, concept card and feedback string: what it says and where it appears. No video and no runtime language model.>

## Debrief
<The reasoning card per item, the genuine-item feedback, the team-protected tally, the habit to keep (quoted exactly), this episode's "On Monday" card, the reporting route and the no-blame line.>

## Variants
- **Micro-drill:** <the defend-only variant, about 8 minutes, recommended for sessions under 30 minutes: brief, defend, debrief>
- **Text route:** <how the module plays without the 2D world>
- **Facilitated session:** <how a team would play it together, with pause points>
- **Replay and randomisation:** <what changes between plays and between years>

## Alternative concepts
<Two or three other game ideas for the same outcomes, a paragraph each, so the user can choose.>

## Art and audio
<New rooms, props, characters, voice lines (and the TTS caching rule: no printed variables in voiced lines).>

## Pitfalls
<What would make this module ineffective or harmful: teaching unreliable cues, victim blaming, fear without action, too long, too hard.>
```

## assessment.md

The assessment template now produces **check items and mirror pairs**, not a pass-marked quiz. It follows the built design (`features/assessment_and_evidence.md`): only the defend half and the role's pre and post checks are scored, there is no default pass mark, and records hold ids, verdicts and times, never free text or the learner's identity.

```markdown
# <ID> assessment

## Assessed behaviours
| Id | Behaviour | Where it is evidenced | Secure | Developing | Not yet |
|---|---|---|---|---|---|
<One row per behaviour, tied to a learning outcome. "Where it is evidenced" names the defend items and check items. The before and after comes from the pre-check against the post-check on matched forms. Secure / Developing / Not yet are kept as descriptions only; the build does not report them.>

## Critical behaviours
<The behaviours that matter most. Each becomes a mirror pair (aw5) in the defend set and in the check forms: a genuine item that looks suspicious and a phish (or mistake) that looks normal, so the pair is passed by following the process, not by spotting cues.>

## Knowledge check bank
<Eight to twelve candidate items for the check forms and defend sets. For each: the learning outcome, the role, the channel (email, call, voicemail, push, page, SMS, QR), phish or genuine, the flags it carries, the right verdict (Trust, Report, Delete or Verify), the suggested form (A or B, matched in pairs of equal difficulty) and the feedback. Write items as short workplace messages, not definitions. Keep the Q ids.>

## Reflection prompt
<One or two open questions for the debrief or a facilitated session.>

## Completion and pass rules
<Built: the mission completes when the learner reaches its conclusion. No default pass mark; reporting is never penalised; the attack half is never scored. Any pass mark or certificate is a later organisation option on the post-check percent.>

## Evidence for auditors
<What the completion record and awareness-measure records show for this module (missions completed, the before and after on matched items) and which requirement it supports. No effectiveness claims.>

## Measuring effect
<Behavioural measures beyond the course: report rates, time to report, simulation results, helpdesk data. Say what the organisation would need to collect.>
```

---

## Writing rules for every file

- UK English. "Cyber security" as two words in our own prose (official names such as "NIST Cybersecurity Framework" keep their spelling). No em dashes or en dashes: use commas, colons, brackets, or "to" for ranges.
- Plain writing. No filler, no hype, no "in today's digital landscape".
- Teach behaviours and procedures, not trivia. Pair every threat with a simple action the learner can take.
- No victim blaming. People are not the weakest link; a mistake reported quickly is a good outcome and the game treats it as one.
- Don't teach unreliable cues as rules (spelling mistakes, a padlock in the address bar, "it looked official").
- Use fictional names for people and organisations in game content. Real cases go in `concepts.md` as background.
- Game content uses brand-set companies (`awareness/BRAND_SET.md`) or a new invented company proposed for it, `.example` domains, and invented brands with learnable look-alike shapes only. No real brands.
- Quote the habit to keep exactly, or call it "the habit to keep". Attack content stays at templates, pretexts and psychology: no working payloads and no tooling steps.
- Voiced lines never print a variable (player name, organisation name, counts): the voice cache is keyed on the exact text. Organisation-specific details appear on screen, in documents, in the debrief's reporting-route box and on the "On Monday" card.
