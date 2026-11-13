# Handover: slice 9.3b sub-slice O (outages)

Branch `build/9-3b-o`, worktree `.claude/worktrees/p-9-3b-o`, from `main` f9a661a14 (K links/pivot,
W Wi-Fi, P port security, I implants all on main). Plan:
`docs/achitechture/ACCESS_MODEL_SLICE_9_3B_PLAN.md` (sub-slice O, sections 2 item 2, 3 row O, 4.2,
5.2, section 13 answer 4). Build log: `docs/achitechture/ACCESS_MODEL_SLICE_9_3B_BUILD_LOG.md`
(sub-slice O section).

## State: DONE pending the full JS suite confirmation

O is implemented, tested at the unit/Rails level, validator clean, and proven live. Working tree
clean. The only outstanding item is the full `bin/test-js -j 3` run: it was queued behind other
worktrees' runs on the shared test lock when this note was written. The changed JS file
(`test/js/validator-network-model.test.mjs`) passes standalone (61/61), and O touches no engine JS.

### Commits (newest first, all on build/9-3b-o)
- `929483eea` 9.3b O: build log section
- `f7e2d9506` 9.3b O: feature beats N5-N7, no-exposure case, PLAYTEST
- `4f7697559` 9.3b O: outages (server, model, validator, schema, tests)

### What was built (files)
- `lib/break_escape/network_model.rb`: `NetworkModel.truthy?` (globals-relevant falsy set).
- `app/models/break_escape/network_access.rb`: `network_up?` now reads `downIf`; `resource_down?`,
  `outage_global`, `session_route_up?`; down resources withheld from `network_rows`,
  `resource_admits_player?`, `mapped_shares`.
- `app/models/break_escape/game.rb`: `session_admits?` (login_pc, profile) and
  `scope_admitted_by_session?` require `session_route_up?` (the scoped-request route test).
- `scripts/validate_network.rb`: un-reserve network `downIf`; non-string error; undeclared-global
  and start-down-open-share warnings; two outage info lines.
- `scripts/scenario-schema.json`: network `downIf` real definition.
- Tests: `test/unit/network_model_test.rb` (+truthy?, +reach_conditions downIf),
  `test/controllers/break_escape/network_outages_test.rb` (new, 7), `network_no_exposure_test.rb`
  (+down-by-default case), `test/support/network_model_scenario.rb` (`with_outage`,
  `with_resource_outage`), `test/js/validator-network-model.test.mjs` (O fixtures + guard update).
- `scenarios/test_access_networks/scenario.json.erb` + `PLAYTEST.md`: server_net `downIf`, breaker
  and power objects, N5-N7 tasks and the N7 eventMapping, O PLAYTEST section.

### Suites
- `bin/rails test` (under the shared lock): 1758 runs, 25388 assertions, 0 failures, 0 errors, 1 skip.
- `bin/test-js -j 3`: queued on the shared lock at handover; changed JS file alone 61/61.
- Validator `scenarios/test_access_networks/scenario.json.erb --no-graph`: 0 error lines (one new
  outage info line). `lab_physical_pentest`: untouched, 0 errors.

### Live browser proof (keyless server :3031, STOPPED afterwards, game 1304)
13/13 through the real `window.ApiClient`: plant + pivot; N5 down-by-default absent + sign-in 403 +
GET /scenario names no server string; N6 repair fills the block in + host signs in + desktop opens;
N7 held session shown "no route" + desktop 403 while down + foothold survives + desktop reopens with
no password. `verify-run --access` (game 1304): both sessions kept after the down/up cycle. Leak
scanner over the captured responses: VERDICT no leaks found. Proof script
`scratchpad/o_live_proof.mjs`, captures `scratchpad/o-responses-1304.jsonl`.

## Left / not done
- Full `bin/test-js -j 3` final count (queued on the shared lock). Re-run to confirm:
  `flock <tests.lock> bin/test-js -j 3`.
- The 9.2 hand-off "not responding" display of a sign-in host with `affordance.offWhen` (plan 5.2):
  deliberately not built (depends on 9.2's office-life field, not in N5-N7 or the brief's key points).
- Dungeon graph outage node (plan 9.3): deferred across K/O/W/P/I, additive, low risk.
- AGENTS.md review rounds not yet done.

## Servers / games / cleanup
- Keyless server on :3031 was STOPPED (confirmed not listening). Never touched :3000.
- Shared dev DB playtest leftovers (do not delete without asking the user): test_access_networks
  games 1298, 1300-1302, 1304 (mission 246).
