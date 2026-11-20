# Handover: slice 9.3b sub-slice K (links and the pivot)

Branch `build/9-3b-k`, worktree `.claude/worktrees/p-9-3b-k`. From `main` 708b154e8; `main`
(fea96124c, with 9.3b P and 9.2 C) merged in. Plan: `docs/achitechture/ACCESS_MODEL_SLICE_9_3B_PLAN.md`
(sub-slice K). Build log: `docs/achitechture/ACCESS_MODEL_SLICE_9_3B_BUILD_LOG.md` (sub-slice K
section). Section 13 answers taken as recommended (outage keeps sessions; 8-path cap with a validator
warning; sign-out of a pivot ends the onward sessions).

## State: DONE (ready for review)

K is implemented, tested and proven live. Working tree clean. Everything is committed.

### Commits (newest first)
- `eaca60f11` Merge branch 'main' into build/9-3b-k (resolved two conflicts in
  `scenarios/test_access_networks/scenario.json.erb` and `test/support/network_model_scenario.rb`:
  kept both K's and P's tasks/mappings and both support helpers)
- `54ddc6ce6` build log K section
- `ae818ec2b` validator link fixtures, view-block JS tests, N1 no-exposure case
- `1215da623` view blocks client, pivot feature beats N1-N4, model and pivot tests
- `3184e11d9` links, pivot reach, view blocks, session prune (server, model, validator, schema)

### What was built (files)
- `lib/break_escape/network_model.rb`: `network_links`, `linked_networks`,
  `all_reach_paths`/`reach_paths` (cap 8, ceiling 64), `reach_conditions` extended over the link
  graph with path `downIf` globals (nil in K).
- `app/models/break_escape/network_access.rb`: `network_up?` (true in K; O makes it read `downIf`),
  `structural_reach`, `player_reach`, `reach_walk`, `reach_session_hosts`, `networks_reachable_from`,
  `prune_unreachable_sessions!`, the view's `networks` block (`network_blocks`, `down_blocks`,
  `view_session_hosts`, `via_for`); `host_reachable_through?`, `resource_admits_player?`,
  `mapped_shares` now resolve reach through `player_reach`/`networks_reachable_from`.
- `app/models/break_escape/game.rb`: `logout_session!` and `end_claimed_sessions!` run
  `prune_unreachable_sessions!`; `logout_session!` returns the ended ids.
- `app/controllers/break_escape/games_controller.rb`: `POST /logout` answers `endedPcIds`.
- `scripts/validate_network.rb`: un-reserves `networkLinks`, adds the link checks, the pivot-no-host
  and >8-paths warnings, the link-reach info line. `scripts/scenario-schema.json`: `networkLinks`
  real definition.
- `public/break_escape/js/minigames/network-view/network-view-minigame.js`: renders the
  further-network blocks (up/down), wires their rows, emits `network_viewed:<networkId>` per up block.
- `public/break_escape/js/systems/pc-sessions.js`: `signOut` reads `endedPcIds` and closes the onward
  desktops (`linkDropped`).
- `scenarios/test_access_networks/scenario.json.erb`: `server_net` linked to `office_lan`, server
  host `sv_fs02`, `backup_vault` share, server room, tasks n2/n3/n4.
- Tests: `test/unit/network_model_test.rb`, `test/controllers/break_escape/network_pivot_test.rb`
  (new), `test/controllers/break_escape/network_no_exposure_test.rb` (N1 case),
  `test/support/network_model_scenario.rb` (`with_pivot`), `test/js/validator-network-model.test.mjs`,
  `test/js/network-view.test.mjs`.

### Suites (after the main merge, under the shared lock)
- `bin/rails test`: 1707 runs, 25041 assertions, 0 failures, 0 errors, 1 skip.
- `bin/test-js -j 3`: 498 files passed, 0 failed.

### Live browser proof
Port 3027, keyless server, game 1270. All 14 checks passed (N1 segmentation + refused sign-in +
forged-foothold 404; N2 pivot block via lena_pc; N3 sign-in across the link + mapped protected share;
N4 logout prunes the onward session; reload persists foothold + pivot session + no-password desktop;
UI renders the server_net block). Leak scanner over 19 captured responses: no leaks found. Lab check
(game 1271): `lab_physical_pentest` plants and views as before, office_lan only (K inert).
Proof scripts in the scratchpad: `k_pivot_proof.js`, `lab_check.js`; captures
`k-responses-1270.jsonl`; screenshot `k_pivot_3027.png`.

## Left / not done
- Dungeon graph (`scripts/generate_dungeon_graph.rb`): plan 9.3 wants a link edge + pivot edge and
  `dungeon-graph-networks.test.mjs` fixtures. Deferred (as W deferred the Wi-Fi node). Low risk,
  additive. For whoever lands the graph across K/O/W/P/I.
- Review rounds (AGENTS.md: >=2 Opus 5.5 reviewer rounds) not yet done.
- O, I are separate sub-slices (P is on main).

## Servers / games / cleanup
- Keyless server on :3027 was STOPPED (confirmed not listening).
- Shared dev DB playtest leftovers (do not delete without asking the user): test_access_networks
  games 1265-1270 and lab game 1271, mission rows 246 (test_access_networks) and the lab mission.
- Scratchpad lives under the session scratchpad dir; nothing left running.
