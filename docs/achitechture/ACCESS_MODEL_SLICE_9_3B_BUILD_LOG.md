# Access model slice 9.3b build log

Plan: `docs/achitechture/ACCESS_MODEL_SLICE_9_3B_PLAN.md`. One section per sub-slice. Each
sub-slice is built on its own branch and merged separately; keep sections self-contained.

## Sub-slice P: port security (branch `build/9-3b-p`)

Un-reserves `portSecurity` and `portSecurityMessage` on a jack and makes a secured jack refuse an
unknown device. Refuse-only, no bypass (section 13, decided as recommended). The decisions of
section 13 that bear on P: refuse-only port security, no bypass.

### What it does

A `networkJack` with `portSecurity: true` takes the device in, gives no foothold, keeps the device
in the inventory, and shows a message (the authored `portSecurityMessage`, or a default naming the
fix: disable unused ports). The refusal names nothing about the network behind the port.

### Files changed (this sub-slice)

- `app/models/break_escape/network_access.rb`: `PORT_SECURITY_REFUSAL` default constant; a small
  `port_security_refusal(jack_object)` helper; one guard in `plant_device!`, after "object
  reachable" and before the device is taken, that answers `422 { success: false, reason:
  'port_security', error: <message> }` (section 5.4).
- `scripts/validate_network.rb`: drop `portSecurity`/`portSecurityMessage` from
  `NETWORK_RESERVED_OBJECT_FIELDS` (leaving `wifiAp` reserved for sub-slice W); a port-security
  check block: error on `portSecurity` on a non-jack, `portSecurityMessage` without `portSecurity`,
  and a jack that is both `portSecurity` and `wifiAp` (4.4).
- `scripts/scenario-schema.json`: rewrite the two reserved stubs into real definitions
  (`portSecurity` boolean, `portSecurityMessage` string).
- `public/break_escape/js/systems/network-links.js`: a `422 port_security` branch in `plant()`
  that shows `body.error` and emits `network_device_refused { jackId, reason: 'port_security' }`.
- `test/support/network_model_scenario.rb`: `with_secured_port` helper and `PORT_SECURITY_MESSAGE`.
- `test/controllers/break_escape/network_footholds_test.rb`: three Rails tests (refusal with the
  authored message and the device kept; the default message; an open jack still plants).
- `test/js/validator-network-model.test.mjs`: portSecurity on a jack accepted; the three new
  validator errors; the reserved test trimmed to the fields still reserved.
- `test/js/network-links.test.mjs`: the client port-security refusal test.
- `scenarios/test_access_networks/`: the N10 beat (`secure_port` jack, `sign_n10`, the
  `n10_port_security` task, the `network_device_refused` event mapping) in `scenario.json.erb`,
  with its section in `PLAYTEST.md`.

### Shared files, edits kept small

`network_access.rb` (own method + one guard), `validate_network.rb` (own check block, un-reserve
only P's fields), `scenario-schema.json` (two field defs). No change to `reach_conditions`,
`network_model.rb`, `game.rb`, `games_controller.rb`, `routes.rb` or the leak scanner: port
security sits entirely on the existing plant path.

### Tests

- `test/js/validator-network-model.test.mjs`: 34 pass.
- `test/js/network-links.test.mjs`: 35 pass.
- `bin/rails test test/controllers/break_escape/network_footholds_test.rb`: 31 runs, 337
  assertions, 0 failures.
- Validator `scenarios/test_access_networks/scenario.json.erb --no-graph`: exit 0, no errors.

### Browser proof

(recorded below after the scripted run)

### Handover

(none yet; building)
