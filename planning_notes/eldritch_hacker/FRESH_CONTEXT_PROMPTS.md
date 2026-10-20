# Fresh-context prompts: Eldritch Hacker planning

Paste one prompt into a new Claude Code session in the BreakEscape repo. Each is self-contained.
Run order: **P1 first** (the bible is what the others build on), then **P2, P3 and P5 in parallel**,
then **P4** (needs P3's mission outline).

**Status (2026-10-20): narrative specifics are PROVISIONAL.** The antagonist cell, cast, mission list,
the Architect reveal wording and how real the monsters are (against the bible's "ambiguous
supernatural" rule in `01_universe_overview/setting.md`) wait for a universe-bible pass. P1 is that
pass and is the first open work item; P3 and P4 must not fix final narrative details until P1 has
been signed off by the user. Build order is Licence to Hack m01-m10 first, then the SE systems via
the browser-only student lab, then Eldritch Hacker; the SE VM plan is parked (no VM side operations
planned). Do not retrofit SE into m01-m08.

Common to all: the decisions are in `planning_notes/eldritch_hacker/DIRECTION.md`. Each session
ends by committing its own files and listing anything it changed in DIRECTION.md's "Open" section.

---

## P1 — Universe bible: the eldritch layer

```
Read CLAUDE.md, AGENTS.md and planning_notes/eldritch_hacker/DIRECTION.md first.

Task: update the shared universe bible (story_design/universe_bible/) so it supports the second
game, SAFETYNET: Eldritch Hacker, while staying true for Licence to Hack (m01–m10).

Do:
1. Survey the bible (README and folders 01–10) and list every place that touches the Quantum Cabal,
   the Tesseract Research Institute, The Singularity, eldritch or supernatural elements, the
   Architect, and ENTROPY's future. Note the conflict at
   01_universe_overview/setting.md ~L195–203 (eldritch is "ambiguous, not confirmed reality").
2. Propose how canon reconciles: e.g. ambiguous through Season 1, confirmed real by the m10 reveal,
   with Eldritch Hacker set after it. Give 2–3 workable options with a recommendation; ask the user
   to pick (one AskUserQuestion call, multiSelect checkboxes, batched with any other questions).
3. After the pick, write or update:
   - 03_entropy_cells/quantum_cabal.md: the cult's structure (ranks, how members are recruited and
     vetted — this drives the social engineering missions), the Institute front, rituals, goals,
     and what continues after the Architect falls.
   - A new bestiary (e.g. 05_world_building/bestiary.md): Lovecraftian creatures used in game 2,
     including Star Spawn at room scale, Deep Ones/cultist-adjacent beings, and Cthulhu itself;
     for each, its role in play, tells, and how a player can prevail (pulp, not nihilist).
   - 01_universe_overview/tone_and_atmosphere.md and 04_characters/voice_bible.md: a narrator
     style section for game 2 — Lovecraftian wording, pulpy and readable (Dunwich Horror, Arkham
     Horror), with do/don't examples; clues must never be obscured by the prose.
   - SAFETYNET side: how HaX and the existing cast meet this threat; any new SAFETYNET division.
   - Timeline (05_world_building/timeline.md) placing game 2 after the Season 1 finale.
   Questions P1 must put to the user: (a) is the Quantum Cabal / Tesseract Research Institute the
   antagonist cell for game 2; (b) how real the monsters are against the current ambiguity rule;
   (c) the wording and staging of the Architect's reveal; (d) the game 2 cast and returning
   characters; (e) timeline placement and narrator rules. Mission list and count follow the answers.
4. Keep the cult fictional and techno-occult; it must not resemble any real religion or group.
5. There are two season_1_arc.md files (story_design/universe_bible/07_narrative_structures/ and
   planning_notes/overall_story_plan/). Find which is canonical before citing it; flag the other.

Use Opus for the design writing. UK English, plain prose, follow the writing rules in
~/.claude/CLAUDE.md. Don't open SecGen files or the exploit field guides. Commit when done.
```

---

## P2 — Season 1 finale: m09 and m10

```
Read CLAUDE.md, AGENTS.md, planning_notes/eldritch_hacker/DIRECTION.md and (if P1 has run) the
updated Quantum Cabal and bestiary pages in story_design/universe_bible/.

Task: re-plan m09 and m10 so they close SAFETYNET: Licence to Hack with player success and set up
SAFETYNET: Eldritch Hacker.

Provisional until the P1 bible pass is signed off: keep the reveal wording and the cell named as
options, not fixed canon.

Do:
1. Read the current plans for m09 "Digital Archaeology" and m10 "The Final Cipher" in the season arc
   (find which season_1_arc.md is canonical) and any m09/m10 material under planning_notes/. Check
   what m01–m08 actually set up (threads, characters, the mole, the Architect) from the built
   scenarios and their pass logs, not just the arc.
2. Write a revised outline for each (planning_notes/overall_story_plan/ or alongside the arc):
   - The player stops the ENTROPY Architect and a number of cells (name which).
   - The Architect reveals they don't need him to continue — the eldritch turn. Stage the reveal so
     Season 1 still ends as a win, with dread rather than defeat.
   - One phishing/pretext stage (in m09 or m10) as the Quantum Cabal teaser, using the SE systems
     planned in planning_notes/phishing_and_social_engineering/ (start with the mail client, OSINT
     browser, intel board and rules engine). Keep it small and optional-feeling in pacing but
     part of the story.
   - These are Licence to Hack missions: every mission must still require its VM flags, woven in.
     VM content belongs to SecGen: describe VM stages at story level only and route any SecGen
     reading to a Haiku subagent (high effort). Don't open SecGen XML or exploit field guides.
   - Campaign choices from m01–m08 that should pay off, and the epilogue states.
3. List decisions for the user in one AskUserQuestion call (multiSelect checkboxes).

Use Opus for design. UK English. Commit when done.
```

---

## P3 — Eldritch Hacker: game plan and mission outline

```
Read CLAUDE.md, AGENTS.md, planning_notes/eldritch_hacker/DIRECTION.md, the updated bible pages
from P1, and the summaries in planning_notes/phishing_and_social_engineering/README.md and
planning_notes/phishing_and_social_engineering_secgen/README.md. For the detailed system designs
(designs/00–12) and the VM challenge docs, ask a Haiku subagent to summarise them at design level
rather than reading them yourself.

Task: write the game plan for SAFETYNET: Eldritch Hacker in planning_notes/eldritch_hacker/.

Include:
1. Premise and arc: from the Season 1 reveal to stopping Cthulhu's awakening. Pulp cosmic horror
   where the player prevails.
2. Mission list (propose a count; ~8–10 is the Licence to Hack scale) with, per mission: the
   objective (identify members / investigate the cult / go undercover / disrupt a ritual / face a
   creature), the setting (Institute front vs the cult's own spaces), the SE skill it teaches, which
   returning physical mechanic it uses, and the monster or horror beat.
3. Learning objectives map: real social engineering concepts (OSINT, pretexting, phishing and its
   defences, verification, vishing, physical intrusion) mapped to missions, with a CyBOK
   cross-reference (Human Factors and related KAs). Grounded and accurate; model, don't weaponise.
4. Mechanics schedule: when each SE system debuts and recurs, and when each returning mechanic from
   m01–m08 (lockpicking, PIN cracker, RFID cloning, fingerprint dusting/spoofing, others in
   public/break_escape/js/minigames/) is reintroduced, so the kit escalates across the game.
5. Engine gaps: what the SE plans already cover, what is new for this game (e.g. a forum/DM channel
   variant of the mail client, cult-specific tells replacing email-only ones like sender
   authentication, a disguise/membership-standing state), sized roughly.
6. VM side operations: none planned (decision 2026-10-20). Do not plan any. The SE VM plan is
   parked; if ever revisited, C6 (campaign forensics, existing modules, no victim bot) is the
   cheapest candidate.
7. Steam/browser-only implications (no VM dependency, save model, length per mission).
8. Open questions batched into one AskUserQuestion call (multiSelect checkboxes).

Use Opus for design; run a review cycle with a fresh Opus subagent before finishing (see AGENTS.md
for the review loop). UK English. Commit when done.
```

---

## P4 — Monsters, dread and encounter mechanics

```
Read CLAUDE.md, AGENTS.md, planning_notes/eldritch_hacker/DIRECTION.md, the bestiary from P1 and
the mission outline from P3.

Task: design how Lovecraftian creatures work in play — Star Spawn at room scale, lesser creatures,
cultists, and the final awakening — so the player can prevail through investigation and
cyber-security-grounded actions rather than reflexes.

Do:
1. Check what the engine already supports for hostile NPCs, combat, chases, patrols, hiding and
   timed events (search the minigames, NPC and scenario systems; cite file:line). Note what exists
   and what is new.
2. Propose 2–3 encounter models (e.g. evade-and-investigate, ritual disruption under a timer,
   weaknesses discovered through OSINT and lore), with a recommendation. Each encounter's way to win
   should come from something the player learned or gathered.
3. Decide whether a dread/sanity meter fits, mirroring the NPC suspicion meter; keep it fun, not a
   punishment loop (standing rule: fun and educational, not hard).
4. Art and audio needs, PixelLab-first, at target sizes; don't generate anything yet. Check with the
   user before any image generation.
5. Write planning_notes/eldritch_hacker/ENCOUNTERS.md; batch questions in one AskUserQuestion call.

Use Opus for design. UK English. Commit when done.
```

---

## P5 — Retarget the phishing/SE plans to Eldritch Hacker

```
Read CLAUDE.md, AGENTS.md, planning_notes/eldritch_hacker/DIRECTION.md,
planning_notes/PHISHING_AND_SE_DECISIONS.md and planning_notes/phishing_and_social_engineering/README.md.
For the detailed designs (designs/00–12) and the VM-track docs
(planning_notes/phishing_and_social_engineering_secgen/), use a Haiku subagent (high effort) to read
and summarise, and to draft any edits that touch VM content. Don't open SecGen XML or the exploit
field guides.

Task: update the phishing/SE plans for the new direction.

1. Audiences: the SAFETYNET campaign for these systems is now Eldritch Hacker (primary). Licence to
   Hack gets at most the one m09/m10 teaser stage; the m01 fold-in (doc 12) is superseded — mark it so,
   don't delete it. The awareness product moves under Incident Simulations: Critical Cases, neutral
   corporate skin. The student lab is the browser-only `lab_social_engineering` and is the first
   shippable SE product; it has no VM companion.
2. Add the cult layer: a forum/DM channel variant of the mail client (01) and triage (05), cult-world
   tells to sit beside the email-only ones (sender authentication, header panel), OSINT sources for
   members, and the Tesseract Institute as the corporate layer where the existing email material fits.
3. VM track: parked and out of scope (decision 2026-10-20): no side operations for Eldritch Hacker
   and no student-lab companion. Keep the docs for reference; the README carries a status line.
4. Update PHISHING_AND_SE_DECISIONS.md: mark answered items from DIRECTION.md, revise section H, and
   add any new questions in its "New questions" space.
5. Log what changed in the plan's REVIEW_LOG.md / RESUME.md.

UK English. Commit when done.
```
