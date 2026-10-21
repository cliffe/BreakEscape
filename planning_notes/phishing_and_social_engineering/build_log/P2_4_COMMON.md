# Phases 2 to 4: shared notes (read after SE_BUILD_BRIEF.md and P1_COMMON.md)

- Phase 1 is closed at commit 391b7dd7. SE_BUILD_LOG.md "Packet results" describes every module that
  exists: mail client, composer, bridge, scheduler, runner, rules engine, intel, influence service and
  bar, board (recon mode), accounts, the slice `scenarios/test_social_slice` (targets `hampshire` and
  `teague`).
- Phases 2 (OSINT browser), 3 (inbox triage, board defender mode) and 4 (pretext calls) run at the same
  time. Each owns its own minigame folder and its own `scripts/validate_social/<area>.rb`. Shared files
  (`minigames/index.js`, `systems/minigame-starters.js`, `systems/interactions.js`, `core/game.js`,
  `show.html.erb`, `scripts/minigame-data-schemas.json`, the slice scenario, the board) are edited only
  by the packet named for it; re-read before each edit and add only your block.
- Browser runs on this machine: Playwright needs `/home/cliffe/.cache/ms-playwright-go/1.57.0/node`
  and a wrapper for the cached chromium; `build_log/P1-T0.md` and `P1-T0b.md` explain both, and how to
  reload past the Resume overlay (`?skip_resume=1`). Seed the dev DB with
  `bin/rails runner 'load Rails.root.join("db/seeds.rb")'` (a pending migration blocks `db:seed`).
- Tests that copy `mail-reader.js` or `intel-board-minigame.js` must also copy
  `systems/social-influence.js` and `ui/influence-bar.js`. Run the social glob with
  `--test-concurrency=1` when checking for flakes.
- Bridge scripts: one per phase, `tools/playtest/se/bridge-<n>.jsonl`, boolean `eval` rows checked by
  `tools/playtest/se/check-bridge.mjs`. bridge-1a and bridge-1b must keep passing.
