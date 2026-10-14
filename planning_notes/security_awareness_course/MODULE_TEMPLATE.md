# Module template

Every module folder under `modules/` holds the same four files. Copy this structure for a new module. The headings are fixed so modules can be compared side by side and checked by script; the content under each heading is free.

```
modules/<id>_<short_name>/
  README.md        the module card: what, who, why, outcomes, flow, build notes
  concepts.md      what to teach: the facts the game, explainers and reference card must match
  game_design.md   the game: concept, structure, decisions, minigames, explainers, variants
  assessment.md    how we know it worked: assessed behaviours, question bank, pass rules, evidence
```

`concepts.md` plays the part the information pack plays for the Security-Informed Safety games: it is the source of truth. If the game and the concepts file disagree, the concepts file wins and the game is fixed.

Ids: core modules are `core_NN`, role modules `role_NN`, sector modules `sector_NN`. Learning outcomes are numbered within the module (`C01-LO1`, `R02-LO3`, `S01-LO2`). Feature references use the ids in `features/README.md` (`BE-01`, `MG-01`, `EX-01`, `HA-05`). Compliance references use the short names in `02_COMPLIANCE_MAPPING.md`.

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
| Full module | <minutes> |
| Micro-drill | <minutes, or "none"> |
| Text route | <minutes> |
| Priority | <MVP / Phase 2 / Phase 3> |
| Build size | <S / M / L, with one line on what drives it> |

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
| Beat | What happens | Format | Minutes |
|---|---|---|---|
| Hook | <the cold open, usually an unannounced baseline decision> | Game | |
| Learn | <what is explained, by whom> | NPC explainer / video | |
| Practise | <the drill> | Minigame | |
| Apply | <the mission> | Game | |
| Debrief | <what the player sees> | Debrief screen + NPC | |
| Check | <the knowledge check> | Quiz | |
| Reference | <what stays available afterwards> | Reference card / intranet | |

## Reuse from existing Break Escape content
<Rooms, characters, minigames, systems, ink patterns, missions: name them with paths.>

## New features needed
<Feature ids from features/README.md, one line each on what this module needs from the feature.>

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
<The steps we teach, in order, written as the reference card will show them.>

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
<The premise in a paragraph: who the player is, where, what the work task is, and how the security tests arrive inside that task.>

## Setting and cast
<Rooms (existing types or new), the cast from 03_WORLD_AND_CAST.md who appear, any new characters.>

## Structure
<The beats in order, each with what the player does, what they learn, what is assessed. Mark the critical path.>

## Decisions and consequences
<Each decision point: the options, what each leads to, which learning outcome it evidences, and how the consequence is shown. Every threat is paired with a doable action. No option shames the player.>

## Minigames
<Existing minigames reused (with folder names) and new ones (with MG ids). For each, what it teaches here and how it is configured.>

## Explainers
<Each NPC explainer or video: who, what, how long, which visual aids, which check question follows.>

## Debrief
<What the debrief shows: decisions, consequences, what good looks like, the one line to remember.>

## Variants
- **Micro-drill:** <the 3 to 5 minute version>
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

```markdown
# <ID> assessment

## Assessed behaviours
| Id | Behaviour | Where it is evidenced | Secure | Developing | Not yet |
|---|---|---|---|---|---|
<One row per behaviour, tied to a learning outcome. The baseline decision in the Hook and its counterpart in Apply give a before and after.>

## Critical behaviours
<The behaviours a learner must show, or be taken back through, to complete the module.>

## Knowledge check bank
<Eight to twelve items. For each: the learning outcome, the type (scenario choice, multi-select, hotspot, ordering, true or false with reason), the stem, the options, the answer, and the feedback for each option. Write stems as short workplace situations, not definitions.>

## Reflection prompt
<One or two open questions for the debrief or a facilitated session.>

## Completion and pass rules
<What counts as complete, the pass mark, retakes, and the remediation loop.>

## Evidence for auditors
<What the record shows for this module and which requirement it supports.>

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
- Voiced lines never print a variable (player name, organisation name, counts): the voice cache is keyed on the exact text. Organisation-specific details appear on screen, in documents and on the reference card.
