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

- 2026-11-23: worktree, brief and this note created. L1a item 1 builder launched (Sonnet).

- 2026-11-23: the user pasted the planning session's build handover (whole ops layer, twelve
  steps). Its rules are folded into the brief. Scope here stays the core plan plus L1a and L1b;
  the later stages (S5a, S6, S8a, S7, S5b, S5c, L2a to L3, S8b, S8c, outline section 5) are not
  started and need the user's word. Start point for those: `docs/agents/OPS_LAYER_HANDOVER.md`
  section 0. That file's "Fable is no longer used" is overridden by the user's routing above.

## Waiting on the user

- Nothing yet. Later: card art for `technique_card.png`; the final screenshot review.
