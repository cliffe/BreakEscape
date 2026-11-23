# Ops core build: resume note

Task (user, 2026-11-23): orchestrate the implementation of `docs/achitechture/OPS_CORE_PLAN.md`
per AGENTS.md, with the `fable52L` agent type in place of Opus.

Brief: `docs/agents/OPS_CORE_BUILD_BRIEF.md`. Worktree `/data/be-ops-core`, branch `ops-core`
(cut from main `24755a3c9`). Handover notes and reviews: `docs/agents/ops_core_build/`.

## Order

1. L1a (log plan section 12, items 1 to 8), split into three builders: item 1 (golden
   mechanism, captured before any engine edit); items 2 to 4; items 5 to 8.
2. L1b (items 1 to 3). Then review L1a+L1b (fable52L, 2 to 5 rounds), train check, land, push.
3. Core step 1 (unchanged-behaviour fixtures, section 10 parts 1, 2 and 5).
4. S1 steps 2 to 5; review; scripted playtest and live proof (Haiku); train check; land.
5. S2 steps 6 to 8; same.
6. S3 steps 9 to 13 (step 11 its own commit and a security review); same.
7. Screenshot review page for the user; raise the card art task.

Landing: `tools/playtest/train-check.sh /data/be-ops-core <outdir> <port>` must end GREEN at the
hash merged; merge (not rebase) into main, push, then merge main back into `ops-core`.

## State (update after every step)

- 2026-11-23: worktree, brief and this note created.
- L1a item 1 DONE: `12cdea6b2`, `7121aa04e` (golden mechanism, two fixtures; note
  `ops_core_build/HANDOVER_L1a_1.md`). Orchestrator replay check was queued on the test lock.
- L1a items 2 to 4 DONE: `54c076858`, `5c5e64648` (events file, helper, secret registry; 42
  unit tests, golden replay 3 runs, access_model 125 runs, per its note `HANDOVER_L1a_2-4.md`;
  six small departures listed there for the reviewer to judge).
- Gotcha: never wrap `bin/ops-golden-compare` in `flock` (it self-locks; this deadlocked the
  shared lock for 50 minutes). Builders go over 150k if a wait is long: keep steps small.
- L1a items 5 to 8 DONE: `ecbbe549b`, `996f1cd51`, `e9be86ba4`, note `87f9e4208`
  (`HANDOVER_L1a_5-8.md`). L1a is built. Node tests need
  `PATH=/home/deploy/.local/node-v22.11.0-linux-x64/bin:$PATH`.
- RUNNING: L1b items 1 and 2 builder (Sonnet; note `HANDOVER_L1b_1-2.md`); L1a review R1
  (fable52L, of `31c406dcb..87f9e4208`, findings `ops_core_build/reviews/L1a_R1.md`, does not
  commit: commit the file by path when it reports).
- Next: L1b item 3 builder (`test_ops_logs`, PLAYTEST.md, docs A24 write side); a Sonnet
  fixer for L1a R1 findings (after the L1b builder is out of `game.rb`); L1b review; delta
  review; Haiku scripted playtest of `test_ops_logs`; train check; land; push.

- 2026-11-23: the user pasted the planning session's build handover (whole ops layer, twelve
  steps). Its rules are folded into the brief. Scope here stays the core plan plus L1a and L1b;
  the later stages (S5a, S6, S8a, S7, S5b, S5c, L2a to L3, S8b, S8c, outline section 5) are not
  started and need the user's word. Start point for those: `docs/agents/OPS_LAYER_HANDOVER.md`
  section 0. That file's "Fable is no longer used" is overridden by the user's routing above.

- 2026-11-23: USER: "carry on into the later stages after S3, work through the whole build".
  Scope is now the whole ops layer, in the order of `OPS_LAYER_PLAN_OUTLINE.md` section 5:
  S5a; S6 (K1 to K4); S8a (M1a, M1b, M2, M3); S7 (C1, C2); S5b; S5c; L2a, L2b, L3; S8b (H1,
  H2); S8c (G1 to G4). Each from its own plan's stage table and section 12, same loop as the
  core stages (Sonnet builds, fable52L reviews, Haiku proofs, green train check, land, push).
  Before each plan: read its sections 3, 12, 14 and 15 only. Parked and out of scope: S0, S4,
  S10 to S12. Cracking (S7) drafting was stopped by safeguards during planning: if a builder
  is stopped, follow AGENTS.md (report to the user, offer one retry, never rerun unasked).

## Waiting on the user

- Nothing yet. Later: card art for `technique_card.png`; the final screenshot review.
