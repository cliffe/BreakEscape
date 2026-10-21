# Build log: social-engineering systems

Brief: `docs/agents/SE_BUILD_BRIEF.md`. Plan: `IMPLEMENTATION_PLAN.md`. Artefacts: `build_log/`.

## Resume

Status (2026-10-21): Phase 0 wave 1 started (P0-A, P0-A1 to P0-A9, P0-B, P0-P); slice art batch 1 started.

## User instructions for this build (2026-10-21)

- Influence-bar visibility configurable per NPC: done as README decision AA (`835e4cea`).
- Commit at the end of each design-implement-review iteration (standing authority for this build).
- First batch of art may be generated with Gemini and PixelLab without asking per image; ask before any
  later round of improvements. Pixel art is made at its final size, never rescaled.
- Hacktivity changes go to main, but check with the user before making any Hacktivity change. Other
  repos may be changed now.
- Questions: the question tool when no context is needed; otherwise a batched `.md` with images and
  context.

## Decisions taken without asking

| Date | Decision | Reason |
|------|----------|--------|
| 2026-10-21 | lab_scanning and sis01 R3 checks run as their own packet, P0-A9 | keeps each mission packet to one mission |
| 2026-10-21 | First art batch = the new Slice rows of ASSETS (OBJ1, OBJ2, NPC5, UI1 to UI7) | "first batch" read as the first build slice |

## Packet results

- **P0-P** (Haiku): doc edits, verified and committed `c526f89a`.
- **P0-A** (Sonnet): baselines in `build_log/baselines/` at HEAD 1f13ee91, Node 18.19.1. Full suite 748 pass; every file passes alone; `engine-fixes-pass3` (3/3 full runs) and `engine-fixes-round4` (1/3) fail on the Node 18 structured-clone runner error, so both are quarantined (plan 0.7 updated). reopencheck 0 problems; 244 route outputs exit 0 (m03's driver prints no verdict); m01 inkcheck start-path only.
- **P0-A7** (Sonnet): m07 browser baseline, game 2804, verify-run progress; `team_assigned` chain observed in order; phone thread identical after reload (unread badge clears, `timedMessages` empties: compare thread text, not engine fields). 3 unidentified 404s.
- **P0-A6** (Sonnet): m06 baseline, game 2808, verify-run progress; Irina unspaced popups "+ Influence: Dr. Irina Volkova" (trust 0→30, then 35 after reload); `server_passphrase_known` mapping sends one HaX message; zero errors. Ink vars read null outside an open conversation (cache cleared on reload). `irina_trust` (number) not in verify-run's globals list.
- **P0-L** (Sonnet): Source Sans 3 bundled as two variable files plus OFL.txt; SHA-256s re-checked by the orchestrator and match `build_log/P0-L_fonts.md`; fonts.css +41 lines, nothing existing changed. F6: canvas text needs `document.fonts.load` with the real string before create or `setText`.
- **P0-A5** (Sonnet): m05 baseline, game 2810, verify-run progress (6 tasks); 10 unspaced popups across Patricia, Lisa, Owen, Halloran; Patricia pair shares only synced globals; reload keeps values but story positions restart at hubs; no errors. Harness note: `converse` ending at `maxTurns` drops the last choice's popup, so later runs repeat the exact `maxTurns` listed in the report.
- **P0-N** (Sonnet): verify-run task listing (`--tasks` or `social` key counts them), `count-task-posts.sh` (pairs exact-path POSTs with the controller's 200-only "Task completed" log line), `se/check-bridge.mjs` (fails on any non-true eval, and on a file with no evals unless `--allow-empty`). Gate passed: fixture 2816 exits 0 with `--tasks`, 1 without; m05 opening-only 2817 exits 1. The `social`-key path is untested until the slice exists. Opus review in P0-R.

## Review rounds

(none yet)
