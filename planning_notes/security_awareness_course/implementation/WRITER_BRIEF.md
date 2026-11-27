# Brief for plan writers and reviewers: implementation handover

This folder turns the awareness course plan into **implementation briefs that a Sonnet agent with a fresh context can execute** without asking questions. Sonnet follows a well-written specification very well, but it will not invent missing facts, and it will copy any wrong path or wrong config key it is given. So every brief must be concrete, checked against the code, and self-contained.

## What the user decided (2026-10-27, build review page)

- **Go now:**
  - new episodes E8 to E13, in that order, followed by E14 to E17;
  - WP-12: the core_00 first-play brief and the core_17 annual edition;
  - WP-15: core_02 missing-channel defend items;
  - WP-02: the Hacktivity customer reporting route, as a list of pre-canned options.
- **Dropped:** WP-03, the engine-gaps package. Spy and Hacktivity branding does not matter here. Small engine fixes that a specific episode needs are folded into that episode's engine work. For example:
  - the hard-coded "SECURE VIDEO LINK" label for E13;
  - a real `#trigger_minigame` for E12;
  - Unicode names, only if an episode needs them.
- **Later:**
  - finishing E1 to E7, which waits on PixelLab;
  - accessibility;
  - role extensions and new roles;
  - drills;
  - the kids game.
- **Companies:**

  | Episode | Company |
  |---|---|
  | E8 | Quayholt Insurance |
  | E9 | Tarrowby Logistics |
  | E10 | Quayholt Insurance |
  | E11 | Carrholme Services (new; reuse an existing room map with its branding) |
  | E12 | Merrin & Sallow Architects |
  | E13 | Brightwell Foods |

  Each of E14 to E17 uses the company its module design names.
- **Shape:**
  - The consequence flip is used for E11 and for shadow IT (E15). Acceptable use (E17) is defend-only.
  - There is no tagline. The built rule of thumb is quoted word for word.
  - Every new episode ships a full version and a defend-only version, and joins both seeded Hacktivity courses (the defend-only course and the both-versions course).
- **E12 notes from the user:**
  - In the attack half, the player's avatar is swapped for a hi-vis one to gain influence. It must be a costume, given back afterwards: aw9 says the chosen avatar always wins.
  - Carrying a package can be a PixelLab sprite state.
  - An NPC opening a door is a small addition, because NPCs can already trigger events and unlock doors.
  - E12 breaks the one-room, no-doors frame. It needs a lobby and a door, and an attack half played in the game world.
- **Defaults taken** (the user can overrule):
  - The six built role check forms are left exactly as they are, because they are the measured baseline.
  - New topics get new check forms. Do not edit the existing role forms.
  - Each episode is held to about 15 minutes: one attack artefact and a defend set of about six items, as in E1 and E2.
  - Pilot with E8 first. It is the only episode that nearly fits the existing runner stages. It proves the new-episode pipeline end to end.

## Sources of truth (read before writing; trust code and scenario files over docs)

- Built product docs:
  - `planning_notes/phishing_and_social_engineering/README.md` (decisions A to AA);
  - `designs/00_data_contract.md` (shapes and ids; wins over other docs);
  - `designs/11_awareness_product_episodes.md`;
  - `awareness/HANDOVER.md` (§4, how the files fit together);
  - `awareness/BRAND_SET.md`;
  - `awareness/CHECK_PARITY_AUDIT.md`;
  - `FUN_DECISIONS.md`.
- Built scenarios: `scenarios/awareness_e*` (hand-authored full episodes), `*_defend` and `awareness_{pre,post}_*` (generated).
- Built fragments and generators: `planning_notes/phishing_and_social_engineering/awareness/e*/{attack,defend}.json`, `gen_*_shells.py`, `training_room.py`, `awareness_deploy.py`, `apply_training_room.py`.
- Engine: `public/break_escape/js/minigames/{episode-runner,inbox-triage,mail-client,landing-page-builder,pretext-prep,osint-browser,intel-board,authenticator,person-chat,phone-chat}/` and `public/break_escape/js/systems/{phish-rules,pretext-judge,mail-scheduler,awareness-measure,episode-starter}.js`.
  - The runner's stage list is fixed in `episode-model.js` (`STAGE_IDS`).
- Schema and validators: `scripts/scenario-schema.json`, `scripts/validate_social/`, `scripts/validate_scenario.rb --strict-social`.
- Tests: `test/js/social-*.test.mjs`, `test/js/validator-social-*.test.mjs`, `test/js/social-awareness-fragment-erb-parity.test.mjs`.
- Bridges: `tools/playtest/se/bridge-e*-full.jsonl`, `check-bridge.mjs`, `run-suite.sh`.
- Plan (what to teach): `planning_notes/security_awareness_course/modules/<module>/{concepts,game_design,assessment}.md`, `04_BUILT_SO_FAR.md`, `03_WORLD_AND_CAST.md`. `concepts.md` is the source of truth for teaching content. `game_design.md` is a starting point. Where it conflicts with the code or the data contract, the code wins, and the brief says so.
- Standing rules:
  - `AGENTS.md`, including model choice. Phishing and social-engineering content writing and review go to the `opus48` agent type; engine work goes to general-purpose or Sonnet.
  - Never run a generator into the repo.
  - Never `git stash`.
  - No attribution lines in commits.

## How each brief must read

- Open with: **Goal**, **Read first** (exact paths), **Depends on**, **Owner model** (which agent type implements it), **Files to create or change** (exact paths), **Steps** (numbered and concrete), **Acceptance checks** (exact commands and expected results), **Do not**, and **Stop and ask if**.
- Use real config keys, stage ids, item fields and function names, taken from the code and the existing scenario files. Quote a real built example (file and key path) for every shape a Sonnet agent must reproduce. Do not invent keys. A brief that needs a key that does not exist yet must point to the engine packet in `02_ENGINE_WORK.md` that adds it.
- Give content in enough detail to author without guessing:
  - the brief and scope line, and the host's lines (as a draft; the dialogue reviewer polishes them);
  - the OSINT facts;
  - templates and slots;
  - each defend item: kind, from, subject or line, the tells and flags, the correct verdict, `whyFine` or the reason text, and the mirror pairs;
  - debrief cards;
  - the "On Monday" card;
  - the timing budget per stage.
- Keep the attack content at the build's level: templates, pretexts and psychology. No working payloads, no tooling steps, no real brands, `.example` domains only.
- Public repo: describe Hacktivity at feature level only. Do not include its internal file paths, endpoints, credentials or weaknesses. The implementer reads the Hacktivity code directly.
- Style:
  - UK spelling.
  - Write "cyber security" as two words.
  - No em or en dashes.
  - Plain, concise English.
  - No effectiveness claims.

## Writers

Edit only the files you are assigned. Never run git; the orchestrator commits.

## Reviewers

Be adversarial. Open the code and the scenario files and check every path, key, stage id, function and shape the briefs cite.

Read each brief as a fresh Sonnet implementer would. Where would you have to guess? Where would you break something that already exists, such as parity tests, check-form baselines, generators, the brand set, validators, the shared rule-of-thumb test, or other games that share the engine?

Also check alignment with the existing content:
- topic boundaries;
- the brand set and cast clashes;
- tone and the no-blame rules;
- the user's decisions above.

Write findings as **B** (blocker: the implementer would fail or break something), **M** (major: likely wrong or ambiguous), **m** (minor) or **t** (trivial). Each finding gives the file, the line or section, the evidence (with a path) and a concrete fix.

## Engine packet ids (being written in parallel in `02_ENGINE_WORK.md`)

| Id | Packet | Episodes |
|---|---|---|
| ENG-01 | Flip variant: the learner sits in the seat of the victim whose account is now in use | E8 |
| ENG-02 | Passphrase and guessing stage | E9 |
| ENG-02b | Organisation-scale guessing modes (spray, stuff) | E18 |
| ENG-03 | Download and warning states, and a fake check page | E10 |
| ENG-04 | Consequence-flip "mistake" stage: an attack half with no target to judge | E11, E14 to E16 |
| ENG-05 | World-play attack stage | E12 |
| ENG-06 | Authored AI assistant chat stage | E13 |
| ENG-07 | Configurable video-call label | E13 |
| ENG-08 | Schema and validator changes | any |
| ENG-09 | Check-form needs | check forms |

ENG-05 also covers:
- an avatar costume that respects aw9;
- a package-carry sprite state;
- an NPC opening a door;
- a lobby room and door;
- `#trigger_minigame`.

Episode specs name the packet ids they depend on and state the config they need from each packet. If a need has no packet, write it as "needs a new ENG packet: ...".

## Episode spec layout (episodes/Enn_*.md)

Each spec uses these sections, in this order:

1. Goal and module(s)
2. Read first
3. Depends on
4. Owner models
5. Company, room and host
6. Timing budget per stage, totalling about 15 minutes
7. Stages, using the runner stage ids
8. Brief and scope note (the host's draft lines)
9. Attack half, or the consequence stage. Give the OSINT facts with ids, the templates and slots, the red-flag meter factors, and the one consequential choice quoted in the flip (aw2)
10. Flip
11. Defend set. Give a table of about 6 items, with id, kind, from or caller, subject or line, the tells and flags, the correct verdict, Verify on or off, and the reason text. Include a mirror pair (aw5)
12. Debrief cards. Include the concept panel, the "On Monday" card and the no-blame line. The habit to keep is shared; do not rewrite it
13. Defend-only variant
14. Check-form items it feeds (see `10_CHECK_FORMS.md`)
15. Files to create or change
16. Bridge script outline
17. Acceptance checks
18. Do not
19. Stop and ask if
20. Open questions
