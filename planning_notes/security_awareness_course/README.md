# Security awareness course: plan

A plan for a cyber security awareness course for all staff, built from short Break Escape games and hosted in Hacktivity, designed to meet the training requirements of the common standards and laws while being something people would choose to play.

**Status:** planning, reconciled with the built product (2026-10-27).

The course extends a product line that is already built: **Incident Simulations: Critical Cases** (user decision F2), a line apart from SAFETYNET with a neutral corporate skin, delivered as missions in the Hacktivity `training` collection. Seven episodes (E1 to E7), seven defend-only variants and 24 role-based pre and post checks exist on main. Where this plan and the build disagree, the build wins, and the plan is written to extend it.

## Start here

Hacktivity platform details (courses, seeding, scoring, reporting routes, admin) are stored in the Hacktivity repo at `docs/awareness_course/`, not here. (Owner decision D10, 2026-10-30.)

**To build the next episodes, start at `implementation/00_README.md`.** The briefs there are checked against the code and win over the planning files below wherever they differ.

1. **`04_BUILT_SO_FAR.md`**: what is built, how each conflict between the plan and the build was settled (R1 to R13), coverage by module and what comes next. Read this first.
2. **`00_COURSE_OVERVIEW.md`**: who it's for, the pathways (role check pairs, episodes and defend-only drills), the 26-module catalogue with built coverage, topic boundaries and the roadmap.
3. **`01_LEARNING_DESIGN.md`**: how an episode works (brief, attack, flip, defend, debrief, with pre and post checks), the consequence flip for topics with no natural attacker, and the answer to "should every activity be a game?".
4. **`02_COMPLIANCE_MAPPING.md`**: which requirements in ISO 27001, NIST, CIS, PCI DSS, NIS2, DORA, UK GDPR, the NCSC CAF, the NHS DSPT and US rules the course helps meet, and the course-level features that meet the rest.
5. **`03_WORLD_AND_CAST.md`**: the training-room frame, the brand-set companies and their hosts, and the tone.
6. **`DECISIONS_PENDING.md`**: questions for you, each with a recommendation.

## The build docs

The built product has its own documents, which are the source of truth for anything already built. They live in `../phishing_and_social_engineering/`:

- `README.md`: key decisions A to AA;
- `designs/11_awareness_product_episodes.md`: the episode design;
- `awareness/HANDOVER.md`: status (resumed 2026-10-27; most stages closed, host art after 3 November, one facilitator guide last);
- `awareness/BRAND_SET.md`: the four companies, their domains, look-alikes and casts;
- `FUN_DECISIONS.md`: the aw decisions (debrief, rule of thumb, avatars and so on).

The scenarios are `scenarios/awareness_*`. Where a design doc and a scenario file differ, the scenario file wins.

## The modules

`modules/` has a folder per module, each with four files (see `MODULE_TEMPLATE.md`):

- `README.md`: the module card (pitch, audience, outcomes, build status, flow, reuse, features needed);
- `concepts.md`: what to teach; the source of truth for new episodes and check items;
- `game_design.md`: the episode, its attack (or consequence) and defend halves, the flip, the debrief, the defend-only variant and alternative ideas;
- `assessment.md`: assessed behaviours, mirror pairs, candidate check items and evidence.

`modules/core_01_phishing_email/` was written first as the model for the rest. Each module is now a plan for one or more episodes; `04_BUILT_SO_FAR.md` §3 says which are already covered by E1 to E7 and the checks.

| Path | Modules |
|---|---|
| Core (all staff) | core_00 First Day; core_01 Phishing emails; core_02 Social engineering by phone, text, QR code and in person; core_03 Passwords and MFA; core_04 Spotting and reporting incidents; core_05 Data protection; core_06 Handling information; core_07 Malware, ransomware and updates; core_08 Safe web and downloads; core_09 Remote and mobile working; core_10 Physical security; core_11 Payment fraud and BEC; core_12 Social media; core_13 Removable media, cloud and shadow IT; core_14 Insider risk; core_15 Generative AI and deepfakes; core_16 Acceptable use; core_17 Capstone |
| Role | role_01 Leaders and boards; role_02 Finance; role_03 IT and service desk; role_04 Developers; role_05 Managers and HR; role_06 Customer-facing staff; role_07 Procurement and suppliers |
| Sector | sector_01 Healthcare |

## The features

`features/README.md` is the catalogue, with stable ids that the modules cite. Each item carries a build status: several are now delivered by systems on main (the episode runner, the flip view, the OSINT browser, the mail client in template mode, inbox triage, awareness-measure records).

- **BE**: Break Escape engine features (`features/break_escape_engine.md`), such as the debrief screen, the text route, the organisation profile and accessibility checks.
- **MG**: minigames (`features/minigames.md`), such as the inbox, MFA prompts and the password manager. MG-30, the pretext workshop, is delivered by the built attack half.
- **EX**: explainers (`features/explainers_video_and_npc.md`): hosts, concept cards, feedback strings and in-world documents. No video.
- **HA**: Hacktivity platform features (now in the Hacktivity repo, `docs/awareness_course/hacktivity_features.md`; `features/hacktivity.md` is a pointer). The only change proposed now is the customer reporting-route setting, which waits for the user's go-ahead; the rest is a later wish list.

Two cross-cutting plans: `features/assessment_and_evidence.md` and `features/accessibility_and_inclusion.md`.

## Research behind the plan

`research/` records what exists today, so the plans reuse it and list only real gaps:

- `built_episodes_vs_plan.md`: the 38 awareness scenarios against the 26 planned modules;
- `current_state_social_engineering_build.md`: every catalogue id against the code on main;
- `current_state_break_escape.md`: the engine's minigames, systems, scenario format, gaps and art;
- `current_state_hacktivity.md`: what the platform offers for mandatory training today (feature level);
- `current_state_lab_sheets.md`: what lab sheets and field guides are and can do;
- `existing_content_reuse.md`: which existing missions already touch which topics, and the SIS patterns worth copying.

## How this was made

The orchestrator wrote the course-level documents, the research notes, the feature catalogue and the model module; module and feature writers worked from `docs/agents/AWARENESS_COURSE_BRIEF.md` and `docs/agents/AWARENESS_MODULE_SEEDS.md`; reviewers checked every module for accuracy, the template, topic boundaries, feature ids and style. On 2026-10-27 the plan was reconciled with the built product (`04_BUILT_SO_FAR.md`). Turning a module plan into an episode follows the existing loops in `AGENTS.md`.
