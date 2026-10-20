# Resume note — phishing & social engineering planning

Last updated: 2026-10-20.

## Status and priorities (2026-10-20)

Planning is unchanged; priorities and audiences have moved. Full list in `README.md` of this folder
and `../eldritch_hacker/DIRECTION.md`.
- Ship Licence to Hack m01-m10 first. No retrofit of these systems into m01-m08; `designs/12` (m01
  "Soft Entry") is superseded.
- Next build for this strand: the systems 00-07 via the browser-only student lab (`designs/10`),
  which takes the module's one technical-lab slot. No VM companion.
- Then the same systems become Eldritch Hacker's core and the awareness product (the latter under
  Incident Simulations: Critical Cases, corporate skin, not SAFETYNET).
- VM track parked (no side operations planned). Eldritch Hacker narrative is provisional pending a
  universe-bible pass.
- Open spike in the "Open spikes" list about 12 C3 is now moot unless the fold-in is revived.

## Goal
Detailed design plan for phishing/social-engineering minigames, systems and scenarios in Break
Escape (no VM strand). Three audiences: Cyber students (lab), awareness product, SAFETYNET fold-in.
Then run up to 5 design-review-improve cycles per component, logging blocker/major/minor each round.
Batch user questions into QUESTIONS_FOR_USER.md (user unavailable during the run).

## State
- Scaffolding written: README.md, BRIEF.md, REVIEW_LOG.md, QUESTIONS_FOR_USER.md.
- Core designs authored by orchestrator: designs/01_mail_client, 02_osint_browser, 03_intel_board,
  04_phish_rules_engine.
- Planner subagents (Sonnet) launched for: 05_inbox_triage_defender, 06_pretext_dialogue_system,
  07_landing_page_builder, 10_lab_social_engineering, 11_awareness_product_episodes,
  12_safetynet_integration. (Running in background.)
- Review cycles: Round 1 reviewers (Opus, read-only) launched for 01–04. Findings → REVIEW_*_R1.md.
  Orchestrator is the fixer for 01–04.

## Cross-doc fixes owned by orchestrator (from planner reports)
- From 05: add to 04 a scenario-level `redFlagLibrary` + per-target `redFlagStrings` as optional
  overrides, and an `authentication_fail` defender-side factor (concept-level mirror). Make 01 and
  05 share a read-only `mail-reader` component. Fold these when fixing 01/04 after their reviews.

## State update (2026-10-20, later)
- All 6 planner docs drafted (05,06,07,10,11,12). All 4 core R1 reviews done.
- Core R1: 0 blockers, 13 majors, 18 minors — ALL fixed. Root-cause fix = new `designs/00_data_contract.md`
  (canonical dataset, factor library incl. senderAuth, EvalResult, intel→factor map, persistence/gating,
  ink constraints, schema). 01–04 patched to reference it. R1 logged in REVIEW_LOG.md.
- Launched: core R2 consistency review (→ REVIEW_CORE_R2.md) + R1 reviews of 05,06,07,10,11,12
  (→ REVIEW_0X_R1.md / REVIEW_1X_R1.md). 07 has an explicit weaponisation re-check. 11 fact-checks
  the macro/Ho-et-al/Chothia claims.

## State update 2 (2026-10-20, later still)
- ALL R1 fixes applied to 05,06,07,10,11,12 (planners resumed as fixers). Core R2 fixes + my owned
  contract fixes done. Verified by grep: 05 scoringProfile present + divergent ids gone; 07 clean of
  Pierce/PayStream + denylist added; 01 no pretextScore; lord seeded in 02; lord target in 04;
  bindExternalFunction corrected in 00. Q8 marked resolved (senderAuth is shared).
- Cross-fixer decision applied: triage scoringProfile analyst|awareness (05 owns both, 11 selects awareness).
- Added to 04 lord target: boostIfGlobal lord_payslip_date_known→pretextRelevant (so 06 call matters).
- Launched CONFIRMATION round (round 3 / closure): REVIEW_CONFIRM_SYSTEMS.md (00–07) +
  REVIEW_CONFIRM_SCENARIOS.md (10–12). Checking closure + cross-doc consistency + security accuracy +
  07 weaponisation-still-PASS + NCSC/Chothia fact-checks.

## Next
1. Read the 2 confirmation reviews. If CLEAN (≤minor) → stop (meets the stop rule), write final report.
2. If majors/minors remain → one more targeted fix pass on the named docs, then stop at round limit.
3. Final report to user: blockers/majors/minors per review level; point at QUESTIONS_FOR_USER.md
   (~24 items, all with defaults). Nothing committed (user commits).

## Open spikes to flag to user (implementation-time, not design blockers)
- 12 C3: does complete_task work on a locked aim incl. server rejection; check nothing keys on numeric aim order.
- 06: external-function wrapper drops 3rd arg (keep side-effecting fns ≤2 args — 06 chose 1 arg + idempotence).
- 05: SPF/DKIM/DMARC literals confirmed accurate at concept level by R1 reviewers; RFC-exact wording is impl detail.

## Fixer assignment
- 00–04 + README/logs: orchestrator (holds context).
- 05: agent a91cff16263cff8c4 · 06: a7d8cae9f3c7d94f8 · 07: ae5ba6356a4051420 ·
  10: acc7ed44038a4396d · 11: a82e9b6c27702d576 · 12: a55c5fbfb5bf50eaf (resume as fixers).

## Engine facts (verified)
registerScene (minigame-manager.js:229); startMinigame(type,container,params)+onComplete; complete()
emits minigame_completed/_failed {minigameName,success,result} (base-minigame.js:84-108); globals via
set_global (apply-actions.js:33-40) & objectives onComplete.setGlobal (objectives-manager.js:754);
flags server-side POST /games/:id/flags. Examples: person-chat/, phone-chat/, notes/, text-file/,
examine/, flag-station/. Template: scenarios/FINGERPRINT_MINIGAME_PLAN.md.

## Constraints
No VM. Model-don't-weaponise (no real attack tooling — blocker if violated). Deterministic legible
feedback (the SecGen fix). Fun not hard. UK English, plain. Don't commit unless asked.
Opus 4.8 handles this material directly; if session is Opus 5.5, route VM-ish content to Haiku
(not relevant here — no VM).
