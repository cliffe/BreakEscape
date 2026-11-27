# Deduction plan: resume note (2026-11-03)

**Status: the plan is ready to build from wave 0.** `DEDUCTION_IMPLEMENTATION_PLAN.md` (~6,000 lines)
passed nine review rounds (R1–R9), then a resync with main:

- **M1** (8573d3d15): the 23 drift fixes in `DRIFT_2026-11.md`, board launch routes (S24), authoring
  checks (S25, DL24–DL25), Q10–Q13.
- **M2** (dc92d253b): minigame roles and patterns P1–P12 (§3.2, §3.12), authoring rules (§7.11),
  lints DL26–DL29, Phase 10b packets (§10.4), fixture changes A–D, first-mission sketches (§1).
- **Confirmation review (M1+M2)**: no blockers; 2 majors and 10 minors fixed; see §14.

§13.1 holds the user's decisions (Q1–Q13), §14 the review log, `APPROVAL_LOG.md` the two deferred
approvals (AP-1, AP-2).

## Open with the user

- The sign-off page (https://claude.ai/artifact/UnjR854EUjcK1qkGSuGa8k, source `SIGNOFF_PAGE.html`).
  Answers save to the db collection `responses`; read them with ArtifactData `list` once the user says
  they have finished, and fold them into the plan. `q_10b`, `q_money`, `q_handle`, `q_timeline` and
  `q_seal` may change M2's defaults (Phase 10b defaults to after the Phase 10 core passes).
- Engine note for P10-U1b (§14): `skipTask` never asks the ending question; no fixture hits it.

## What exists

- The plan: data contract, engine items S16–S25, lints DL1–DL29, fixtures A–D, packets P10-* in waves
  0–5 plus Phase 10b, tests, risks and spikes.
- `sim/`: the evaluator prototype and fixture models (`node run.js A|B|C|D`, `mutations.js`,
  `m2_osint.js`); P10-A ports it to `test/js/fixtures/social_deduction/atoms.js`.
- `minigames/`: inventories of all 54 minigames and `CATALOGUE.md`.
- `sidecar/`: simulation, player tests, design, learning, copy, mockup and accessibility work, and
  compiled fixture drafts (`sidecar/drafts/A–D/`).
- `integration/`: verified integration items and `FOLD_LEDGER.md`.

## To start building (orchestrator, plan §2 and §10.3)

1. Add the "Phase 10: deduction" block to `docs/agents/SE_BUILD_BRIEF.md`, a resume pointer in
   `SE_BUILD_LOG.md`, and create `DEDUCTION_BUILD_LOG.md`.
2. Run wave 0 (P10-B0 baseline, spikes P10-F1–F4 in the untracked spike scenario), then waves 1–5.
   Packets commit their own files before testing; hand over at ~150k tokens.
3. Phase 10b when `q_10b` says (default: after the core passes).
4. P10-X1 adds the SE README, `IMPLEMENTATION_PLAN.md` and design 00 rows once the code exists.
