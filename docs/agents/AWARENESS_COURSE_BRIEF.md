# Awareness course planning brief

Shared brief for every agent writing or reviewing the security awareness course plans in `planning_notes/security_awareness_course/`. Read it in full before you start.

## The kind of game

This is a **fourth kind of Break Escape game**, alongside the SAFETYNET campaign, the Security-Informed Safety (SIS) games and the labs:

- **Security awareness modules:** short (15 to 20 minute) games for ordinary staff in any organisation, bought for compliance (ISO 27001, PCI DSS, NIS2, UK GDPR and others) and meant to change behaviour.
- **The aim** is realistic workplace situations, where threats arrive inside normal work; clear, correct, current advice in plain English; decisions that are fair and teach a habit; warmth and light humour; and evidence an auditor would accept.
- **No spy framing, no combat** (`"disableAttacks": true`), **no VMs**. One fictional organisation (Larkspur Group) and a recurring cast.
- **Teaching is explicit where it must be.** A mentor character explains the key messages in short chunks with visual aids; the game is for practice and application. See `01_LEARNING_DESIGN.md`.

Don't drift into the campaign's voice (thriller, handler, ENTROPY) or the SIS voice (professional crisis governance), except role_01 (leaders), which can borrow SIS decision patterns.

## Read first

In `planning_notes/security_awareness_course/`:

1. `README.md` (if present) and `00_COURSE_OVERVIEW.md`: the catalogue, pathways, topic boundaries, roadmap.
2. `01_LEARNING_DESIGN.md`: the seven-beat module pattern, delivery modes and design principles. Every module follows it.
3. `03_WORLD_AND_CAST.md`: Larkspur, the cast, places, tone, the motto *Pause. Check. Report.*
4. `MODULE_TEMPLATE.md`: the four files and their fixed headings.
5. `features/README.md`: the feature catalogue. Refer to features by id (BE-, MG-, EX-, HA-). If a module needs something that isn't in the catalogue, say so in its "New features needed" section as "**proposed:** <name>, <one line>" so the orchestrator can add it; don't invent ids.
6. `modules/core_01_phishing_email/`: **the model module.** Match its depth, specificity and tone. It's the quality bar.
7. `research/`: what exists today in Break Escape, Hacktivity and the lab sheets, and which existing missions touch which topics. Reuse what exists and cite paths.
8. `02_COMPLIANCE_MAPPING.md` (when present): use its short references in "Compliance coverage".

Also useful: `README_scenario_design.md` (authoring rules, objectives, debriefs), `README_ink_best_practices.md`, `docs/NPC_INFLUENCE.md`, `docs/OBJECTIVES_AND_TASKS_GUIDE.md`, `docs/TIMED_CONVERSATIONS.md`, and the minigame folders in `public/break_escape/js/minigames/`.

## What to produce

For each module assigned to you, create `planning_notes/security_awareness_course/modules/<folder>/` with the four files from `MODULE_TEMPLATE.md`: `README.md`, `concepts.md`, `game_design.md`, `assessment.md`. Use the template's headings exactly.

Rough lengths (the model module is a guide): README 80 to 120 lines; concepts 120 to 220; game design 150 to 250; assessment 100 to 170. Role and sector modules can be a little shorter. Length is not the goal: specificity is.

### Quality bar

- **Concepts are correct, current and sourced.** UK first (NCSC, ICO, legislation.gov.uk, GOV.UK, Report Fraud), with notes where other countries differ. Check anything time-sensitive with a web search (law changes, service names, figures, real cases), and give the source. If you can't verify something, leave it out or mark it "to verify". Never invent statistics, cases, quotes or legal references.
- **Game design is specific.** Name the rooms, the cast, the work task, each threat, each decision and its consequence, each minigame and how it is configured. Write a few sample lines of dialogue for key moments (short, spoken-length lines). A reader should be able to picture playing it.
- **It's fun.** Each module needs a hook a player would talk about at lunch: a mechanic, a twist, an attacker-view interlude, a game show, a detective board. Give two or three genuinely different alternative concepts.
- **Assessment is concrete.** A behaviour table tied to learning outcomes, critical behaviours with a remediation loop, and a knowledge check bank of 8 to 12 items with answers and per-option feedback, written as workplace situations.
- **Reuse is real.** Cite existing minigames by folder name (`public/break_escape/js/minigames/<name>/`), rooms by type (`room_office`), systems by file, and missions by path. Only claim reuse that the research notes or the code support.
- **Respect the topic boundaries** in `00_COURSE_OVERVIEW.md`. If your module touches another module's topic, keep it light and point to that module.

### Rules that apply to every file

- **UK English.** "Cyber security" as two words in our prose (official names like "NIST Cybersecurity Framework" keep their spelling). Organise, behaviour, licence (noun), programme (except computer program), defence, centre, colour, judgement, enrol.
- **No em dashes or en dashes anywhere.** Use commas, colons, brackets, full stops, or "to" for ranges ("15 to 20 minutes", "2023 to 2025"). Check before you finish: `grep -nP '[\x{2014}\x{2013}]' <file>` must print nothing.
- **Plain writing.** Short sentences, everyday words. No filler, no hype, no "in today's digital landscape", "robust", "seamless", "leverage", "delve", "crucial".
- **No victim blaming, no fear without action, no gotchas** (see the design principles in `01_LEARNING_DESIGN.md`).
- **Never ask a learner for real credentials** in a design. Fake sign-in pages are pre-filled.
- **Fictional names** for people, organisations and domains in game content. Real cases go in `concepts.md` as background, with fictional equivalents in the game.
- **Voiced lines never print a variable** (player name, organisation name, counts). Customer-specific details appear on screen, in documents and on the reference card (BE-05).
- **Keep security detail at awareness level.** Describe attacks by what the victim sees and what stops them, not how to carry them out. Attacker-view interludes show how little an attacker needs, never a how-to.
- **Keep the cast diverse** and use the recurring cast from `03_WORLD_AND_CAST.md`. New characters: give a name, role, age and look (vary ethnicity, age, gender, disability), and avoid names already used in `public/break_escape/assets/characters/`.

## How to work

- **Write each file section by section with Write then Edit.** A whole-file rewrite once got truncated and lost a plan.
- **Edit only your assigned module folders.** Don't edit the course-level files, other modules, `features/`, the template, this brief, or anything outside `planning_notes/security_awareness_course/modules/<your folders>/`. If a course-level file needs a change (a new cast member, a new feature, a boundary clash), put it in your report.
- **Don't commit.** The orchestrator commits.
- **Use your own scratch folder** under the session scratchpad if you need one (the orchestrator gives the path); never create a scratch folder in the repo.

## What to return

A short report:

1. The files written, with line counts.
2. For each module: the working game title and a two-line summary of the game.
3. Proposed new features (name and one line each), and which existing features you used most.
4. Requests for course-level changes: new cast members, boundary clashes, open questions for the user.
5. Facts you could not verify and left out or marked "to verify".
6. Confirmation that `grep -nP '[\x{2014}\x{2013}]'` finds nothing in your files and that the four template headings are present.
