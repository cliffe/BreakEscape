# Handover S5a unit 17: docs

Done. Files: `docs/ACCESS_AND_NETWORKS.md`, `README_scenario_design.md`. No code, scenario or test edited; `scenarios/test_ops_access/PLAYTEST.md` not touched (brief section 4 item 3 does not change a beat).

## Added
- `docs/ACCESS_AND_NETWORKS.md`: index row A18; new section "A18 Privilege on a session" (before A24 write side): `creds.admin`, how a level is worked out, the two powers and their limits, the toast, the `remove` check, O1 and O3 stated plainly, the `needs.session` rule, the author's note, the two log rows, the three validator warnings (exact texts) and the S5b/S5c "not built yet" errors, the `admin@<pcId>` graph node, verify-run and leak-check lines, the brief's section 4 list (five items) under "What changes for existing scenarios", shown-in, known limits, plan vs code; one coverage-matrix row for A18; one sentence in N15 ("The technique session") replaced, which said the level was recorded and what it may do belonged to a later feature.
- `README_scenario_design.md`: one A18 row after A17 (index order puts A24 next).

## Checked at file:line before writing
game.rb 3300 (session_access), 3323, 3333, 3350, 3455, 7680; network_access.rb 507-511, 525-538; network_ops.rb 388; capture_proofs.rb 52; games_controller.rb 1457, 3276; ops_log_events.rb 50-51, 136; pc-taskbar.js 55, 247; network-links.js 498; validate_privilege.rb message text (read from the code, not the handover); generate_dungeon_graph.rb 1814-1880; verify-run.rb 83.

## Differences from handovers
- Warning (b) and (c) text uses `<path> (<id>)` from the code. The N15 and A18 text states the fix-round behaviour: `network_implants_test.rb:116` was NOT changed (two assertions changed, not three); a validator check for `accountProfiles` ids exists (F6) but is not documented here (not an author-visible rule I verified).

## Left out (not verified by me)
- The browser wording of an `ADMIN_READ` row (handover 16 says it shows the kind word for the profile); the doc says only "detail `profile`".
- The leak scanner's exact earn rules beyond the handover 16 summary (one summary line only).
- Narrow-width taskbar layout (client review C6-1, not verified in a browser).
- No browser run of any of this; docs only.
