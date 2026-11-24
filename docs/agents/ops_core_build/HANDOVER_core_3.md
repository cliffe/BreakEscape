# Handover core step 3 (S1, N13): the server side of scan. Done (Parts A and B)

No client code. Branch `ops-core`. The validator's table still says N13 not built (step 5 flips it).

## The route `POST /network/scan` (`games_controller.rb` `network_scan`, route in `config/routes.rb`)
- Params `foothold` plus exactly one of `network_id` / `host_id`; each a non-empty String of at most 200 chars, else
  `400 { success: false, reason: 'bad_request' }` (before the model; no id in it). Both names in `set_game` and `with_game_lock`.
- Model: `app/models/break_escape/network_ops.rb` (concern `NetworkOps`, included in Game after `NetworkAccess`).
  `ops_listed?(foothold_id, { network: id } | { host: id })`, `ops_listed_host` (the host record), `ops_not_found` (the one 404 body
  `{ success: false, reason: 'not_found' }`), `scan_network!` (`:~76`), `scan_host!` (`:~96`). The models save themselves.
- Sweep: 404 unless the network is in `player_reach(foothold)`; 422 `not_needed` unless `discovery: "scan"`; answer
  `{ success, already?, network: { id, swept: true, hosts: [rows] } }` (rows = `network_rows`, so address and held rows follow 5.2).
  Every sweep writes `network_swept`; first sweep saves, a repeat saves only if the helper's result is `stored?`.
- Host scan: 404 unless the host (PC or device) is on a reached network that is open or swept; 403 `not_responding` (before the
  services check); 422 `not_needed` with no services; answer `{ success, already?, host: row }` with `scanned: true` and
  `services`. `host_scanned` once (first time only). A held-session PC on an unswept network is 404 until the sweep.
- Refusal bodies are `{ success: false, reason }` only. The file `test/fixtures/files/ops_refusal_codes.json` (new, all 17 codes of
  the plan) is read by `network_scan_test`.

## State
`opsDiscovered` in `ACCESS_STATE_DEFAULTS` (`game.rb`, last entry), default `{}`; writer `ops_discover!` creates `networks` and `hosts`
lists (S2 adds `services`). Never in a sync body (tested), never sent whole.

## Rows and blocks (what GET /network sends)
- `network_access.rb`: `network_blocks` and `down_blocks` merge `ops_block_fields(net)` (down: `with_ops: false`). `network_rows` returns
  `ops_held_session_rows` for an unswept discovery network (hosts only, PCs with a held session), else PC rows + `ops_device_rows` + shares.
  `host_row` calls `ops_add_host_fields!` (address by the host's own network; `scanned` + `services` once scanned) before its early return.
  `host_reachable_through?`, `from_route_refusal`, `resource_admits_player?` untouched.
- Block keys: `cli: { range }` (when authored), `swept` (discovery networks only), `ops: true` (open or swept network where some host
  has services; never on a down block, a departure: a down block offers nothing).
- Device row: `{ id, kind: 'device', name, sprite?, responding?: false, address?, scanned?, services? }`. `sprite` is left out when not
  authored (no null); `responding` only when off.
- Service row: `name, label?, port, product, version, cli?` (`cli` by key `protocol`, `service`, `banner`, non-empty strings only).
- `address` comes from `networks.<id>.cli.hosts.<hostId>.address` only for PC and device rows; a share row has none.

## Log (`lib/break_escape/ops_log_events.rb`)
EVENTS `network_swept`, `host_scanned` verbatim from 13. KINDS `network` and `host` added (name lookups `network_named`, `device_named`).
`foothold_name` now also resolves `wifi_<network>` and `implant_<pc>` foothold ids (it did not; a sweep through them raised under
the guard). `where` kind for a PC scan is `pc`, a device `host`. `as` is nil. `ops_log_test.rb` ceiling test: the two events are
listed in `OPS_AS_NIL_EVENTS` (their `as` is always nil; the typed-name worst case put 7 bytes over 400).

## Tests (all pass; counts from the final run)
- New: `network_scan_test` 23, `network_discovery_display_test` 8, `network_ops_indistinguishable_test` 8, `network_cli_fields_test` 11,
  `network_ops_no_exposure_test` 7, `network_ops_state_delta_test` 6. Support: `test/support/network_ops_scenario.rb`
  (`NetworkOpsScenario`, `NetworkOpsRequests`), fixture `test/fixtures/files/network_ops_cli.json` (test-only, every cli object with `_note`).
- Proof run: ops_log_test, policy_test, network_model_test and every `network*`, `keyring*`, `access_model_*` controller test: 595 runs,
  0 failures. `bin/ops-golden-compare` 12 runs pass, no re-record. Rubocop clean.

## Gotchas for the client builder
- The unswept block's `hosts` is `[]` (or held-session rows only): Sweep is offered on `swept: false`; Scan only inside a block with `ops`
  and on a row with no `scanned` and a `services`-capable host (the row does not say it has services before the scan; `ops` is block-wide).
- `already: true` rides in the success body next to `host` or `network`.
- A swept network answers `hosts` rows including shares; a device row has `kind: 'device'`.
- Part A and Part B code landed in one commit (the scan test needs the rows); Part B's commit is the other test files.
