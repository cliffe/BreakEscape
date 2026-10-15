# Security awareness course: plan

A plan for a cyber security awareness course for all staff, built from short Break Escape games and hosted in Hacktivity, designed to meet the training requirements of the common standards and laws while being something people would choose to play.

**Status (October 2026):** planning, reviewed. All 26 module plans and the feature documents have been through a full accuracy and design review and reconciliation (see `TODO.md`); no blockers were found. Nothing here is built yet.

## Start here

1. **`00_COURSE_OVERVIEW.md`**: who it's for, the pathways, the 26-module catalogue, topic boundaries and the build roadmap.
2. **`01_LEARNING_DESIGN.md`**: how a module works (the seven beats), and the answer to "should every activity be a game?" (short version: every module is a game, but not every activity inside it is gameplay; lab sheets become reference cards, the accessible text route and facilitator notes).
3. **`02_COMPLIANCE_MAPPING.md`**: which requirements in ISO 27001, NIST, CIS, PCI DSS, NIS2, DORA, UK GDPR, the NCSC CAF, the NHS DSPT and US rules the course helps meet, and the course-level features that meet the rest.
4. **`03_WORLD_AND_CAST.md`**: Larkspur Group, the recurring cast, the places, the tone and the motto *Pause. Check. Report.*
5. **`DECISIONS_PENDING.md`**: questions for you, each with a recommendation.

## The modules

`modules/` has a folder per module, each with four files (see `MODULE_TEMPLATE.md`):

- `README.md`: the module card (pitch, audience, outcomes, flow, reuse, features needed);
- `concepts.md`: what to teach; the source of truth the game must match;
- `game_design.md`: the game, its decisions and consequences, minigames, explainers, variants and alternative ideas;
- `assessment.md`: assessed behaviours, critical behaviours, a knowledge check bank, pass rules and evidence.

`modules/core_01_phishing_email/` was written first as the model for the rest.

| Path | Modules |
|---|---|
| Core (all staff) | core_00 First Day; core_01 Phishing emails; core_02 Social engineering by phone, text, QR code and in person; core_03 Passwords and MFA; core_04 Spotting and reporting incidents; core_05 Data protection; core_06 Handling information; core_07 Malware, ransomware and updates; core_08 Safe web and downloads; core_09 Remote and mobile working; core_10 Physical security; core_11 Payment fraud and BEC; core_12 Social media; core_13 Removable media, cloud and shadow IT; core_14 Insider risk; core_15 Generative AI and deepfakes; core_16 Acceptable use; core_17 Capstone |
| Role | role_01 Leaders and boards; role_02 Finance; role_03 IT and service desk; role_04 Developers; role_05 Managers and HR; role_06 Customer-facing staff; role_07 Procurement and suppliers |
| Sector | sector_01 Healthcare |

## The features

`features/README.md` is the catalogue, with stable ids that the modules cite:

- **BE**: Break Escape engine features (`features/break_escape_engine.md`), such as assessed decisions, the debrief screen, the text route, the organisation profile, visual aids in conversations and the intranet terminal.
- **MG**: new minigames (`features/minigames.md`), such as the inbox, the knowledge check, MFA prompts, the password manager and the video player, plus the fixes existing minigames need for reuse.
- **EX**: explainers (`features/explainers_video_and_npc.md`): the mentor NPC, engine-recorded and produced video, in-world documents, demonstrations and attacker-view interludes.
- **HA**: Hacktivity platform features (`features/hacktivity.md`), such as organisations and departments, assignments and due dates, completion records, certificates, policy acknowledgement, dashboards and LMS interoperability.

Two cross-cutting plans: `features/assessment_and_evidence.md` and `features/accessibility_and_inclusion.md`.

## Research behind the plan

`research/` records what exists today, so the plans reuse it and list only real gaps:

- `current_state_break_escape.md`: the engine's minigames, systems, scenario format, gaps and art;
- `current_state_hacktivity.md`: what the platform offers for mandatory training today (feature level);
- `current_state_lab_sheets.md`: what lab sheets and field guides are and can do;
- `existing_content_reuse.md`: which existing missions already touch which topics, and the SIS patterns worth copying.

## How this was made

The orchestrator wrote the course-level documents, the research notes, the feature catalogue and the model module; module and feature writers worked from `docs/agents/AWARENESS_COURSE_BRIEF.md` and `docs/agents/AWARENESS_MODULE_SEEDS.md`; reviewers checked every module for accuracy, the template, topic boundaries, feature ids and style. Turning a module plan into a game follows the existing loops in `AGENTS.md`.
