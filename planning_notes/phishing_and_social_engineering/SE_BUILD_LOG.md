# Build log: social-engineering systems

Brief: `docs/agents/SE_BUILD_BRIEF.md`. Plan: `IMPLEMENTATION_PLAN.md`. Artefacts: `build_log/`.

## Resume

Status (2026-10-21): baselines, spikes, P0-L, P0-N, P0-P done and committed. Running: P0-J, art batch 1, then P0-C, D, E, H, I, M. Next: P0-F after D, P0-G after F, P0-K after J, then P0-R review and P0-T.

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
- **P0-A2** (Sonnet): m02 baseline, game 2813, verify-run progress (6 tasks); popups `± Influence: <name>` with counts per NPC in the report; no hostile state; HaX phone chat (declares `EXTERNAL player_name()`) and a bark load cleanly; reload keeps all 128 globals. Popup/console hook kept as `build_log/baselines/browser/popup-console-hook.js` for the comparison runs. Seen, not pursued: Mr Pryce (bed 4) interact lands on his ventilator panel.
- **P0-A8** (Sonnet): m08 baseline, game 2805, verify-run progress; mapping chain (badge audit, HaX timed messages, flags 1-4 then `all_flags_submitted`) recorded; five spaced-form popups. Comparison runs must repeat the deliberate Phantom accusation (sets `nightshade_tipped_off` etc.), read ink vars after a conversation closes, and check whether the post-reload `brief` inventory missing the Post-It and Badge Audit Printout is display-only. 3 unidentified 404s (same count as m07).
- **P0-A9** (Sonnet): lab_scanning game 2815 (three `+ Influence: Reconnaissance Specialist` popups) and sis01 game 2807 (Hartley +, David -; popup fires on the line after the tag); both verify-run progress. Existing behaviour, not ours: lab_scanning's timed intro replays after reload and resets `instructor_rapport` to 0, and the rapport has no cap. Filed for the user below, not fixed (a lab, outside this build).
- **P0-A4** (Sonnet): m04 baseline, game 2811, verify-run progress (4/4 tasks, score 25); person chat and five barks from `EXTERNAL` stories pass; Vance pair: each tag gives two popups (person and "(ops desk)"), `vance_trust_level` carries across channels (30 → 113, above the ink's 0-100 comment); 95 globals identical after reload; 32 × 404, mostly `female_hacker_hood_v2_talk.png`.

## Spikes

- **F1** (P0-B, Opus; game 2814 on :3001, console-driven probe stories, so exercised, not earned): a write from outside reaches an open person chat and an open phone chat on the next line, and an `EXTERNAL`'s write shows on the same line. The writer writes gameState, broadcasts, then writes `currentMinigame.inkEngine.story` with `variableChangedEvent` detached. That gave one emit per change, no observer echo and no loop. A broadcast alone does not reach either open story. One hazard: inside `Continue()` an ink assignment has not reached gameState yet, so `se_influence` must read its base value from the calling story (ink set 100, then +1, gave 5). The engine objects, with file:line, are in `build_log/P0-B_spikes.md` for P0-D.
- **F2** (P0-B): `scripts/ink_runtime_check/social-load-all.mjs` ran 79 m01–m08 stories through 214 runs (chat, event, phone preload, bark) with fallbacks off and on. No outcome differs. 2 runs differ in error wording only (m02/m03 HaX bark probe: `player_name` is unbound on the bark path either way). Only those two compiled stories call an `EXTERNAL`, and no m01–m08 mapping reaches the ink bark path. First output: `build_log/P0-B_social-load-all_first-output.txt`. 0.1 can land. The item 8 fixtures should be the m02/m03 HaX stories, not m04.
- **P0-A3** (Sonnet): m03 baseline, game 2809, verify-run progress (4 tasks); Ffion 11 and Victoria 9 popups, bark after the night turn, no ink errors; 76 globals identical after reload. F1 (likely harness-induced): closing Ffion's chat with the cloner open saved an EM4100 card, set no flag, threw `NPC not found: null` and left an empty person-chat overlay; by hand it worked. Comparison runs do that beat by hand.
- **P0-B** (Opus): F1 passes in both chats with no echo; the in-`Continue()` read-modify-write hazard is folded into plan 0.2. F2 `social-load-all.mjs`: 79 stories, 214 runs, 0 outcome differences flag off vs on (two wording-only lines on the m02/m03 HaX bark probe); fixtures for back-compat 8 updated. `getInkEngine` (`npc-manager.js:2079`) is dead code.
- **P0-A1** (Sonnet): m01 baseline, game 2812, verify-run progress. Derek: `#influence:-100` logs `Unknown game action tag: influence` today (so P0-G must keep it a no-op for non-social NPCs), hostility comes from `#hostile`. Kevin `#hostile:kevin_park`: hostile but untinted until reload, tinted `0xFF6666` after; KO about 15 s later. Briefing: check `timedMessages[0].delivered`, not the close event. All ten browser baselines are in; Phase 0 editing packets released.

## Found in shipped content (for the user; not fixed here)

- lab_scanning: reload replays the timed intro and resets `instructor_rapport` (P0-A9).
- m02: interacting with Mr Pryce (bed 4) lands on his ventilator panel (P0-A2).
- `female_hacker_hood_v2_talk.png` 404s in m03 and m04 (and likely every mission using that sprite); the file does not exist (P0-A3, P0-A4).
- m03: closing a chat while the cloner is open can leave an empty person-chat overlay and `NPC not found: null` (P0-A3 F1, seen via the harness only).
- m08: post-reload `brief` inventory may not list the Post-It and Badge Audit Printout (P0-A8, unconfirmed).

## Review rounds

(none yet)
