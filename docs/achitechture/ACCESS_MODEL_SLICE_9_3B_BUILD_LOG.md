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

Keyless server on :3025 (GEMINI warning confirmed), game 1257, `test_access_networks`, headless
Chromium, driven through the real player path (`window.__test.interact`, the plant confirm clicked
by its "Plug it in" button), not test helpers.

- **Secured port refuses (real path):** take the drop box, enter the comms room, interact
  `secure_port`, confirm. The authored message toast shows, no view opens, no link item arrives,
  the box stays in the inventory, and task `n10_port_security` completes. Client `footholds()` is
  empty.
- **Allowed device works:** interact `comms_port`, confirm. A `jack_comms_port` foothold is gained
  and the box becomes the link item.
- **Tampered-client checks (against the real server):** a direct `ApiClient.networkPlant("secure_port")`
  answers `422 { reason: "port_security", error: <message> }` even with no device in hand (the
  server refuses before taking a device); `GET /network?foothold=jack_secure_port` answers
  `404 Foothold not found` (no foothold was ever forged for the secured port).
- **Reload (`location.href` to the game URL with `?skip_resume=1`):** after the reload the
  `jack_comms_port` foothold persists, there is no `jack_secure_port` foothold, the link item is in
  the inventory, and `n10_port_security` stays complete.
- **Server record (Rails):** `footholds` = `["jack_comms_port"]`, `gainedFootholds` = `["comms_port"]`,
  no `jack_secure_port`.
- **Leak scan** over 26 captured responses: `VERDICT: no leaks found.` (the port-security refusal
  carries only the authored message).

### Review R1 (`ACCESS_MODEL_SLICE_9_3B_P_CODE_REVIEW_R1.md`)

Verdict: approve, no blocker or major. The two minors and the two nits are fixed in this slice;
each fix has a test that fails without it (the nits are pinning tests).

- **Minor 1 (fixed):** the `toast()` wrapper in `network-links.js` now passes `{ plainText: true }`
  to `gameAlert`, so author and server text (port-security refusals, jack hints, network names) is
  shown as plain text, not interpolated into `innerHTML`. This also fixes the pre-existing
  `no_device` hint toast. Every toast in the file goes through this one wrapper, so no other author
  or server text reaches `innerHTML`; the confirm dialogs already passed `plainText`.
- **Minor 2 (fixed):** `validate_network.rb` now warns (not errors) when a `portSecurityMessage` is
  present but blank or whitespace-only, because the runtime quietly falls back to the default line.
- **Nit 1 (fixed):** the Rails port-security test now asserts the 422 body is exactly
  `%w[error reason success]` (the leak guarantee of spec 5.4).
- **Nit 2 (fixed):** a client test now exercises the `b.error` fallback (a `422 port_security` with
  no `error`) and asserts the generic line is shown.

Tests after R1:
- `test/js/network-links.test.mjs`: 38 pass (was 35; +3 for minor 1 and nit 2).
- `test/js/validator-network-model.test.mjs`: 35 pass (was 34; +1 for minor 2).
- `bin/rails test test/controllers/break_escape/network_footholds_test.rb`: 31 runs, 338
  assertions (was 337; +1 for nit 1), 0 failures.
- Validator `scenarios/test_access_networks/scenario.json.erb --no-graph`: exit 0, no errors.

### Handover

Sub-slice P complete. Nothing in progress. Open: the `portSecurity`/`wifiAp` combined validator
error cannot be exercised in isolation until sub-slice W un-reserves `wifiAp`; the node test for it
also trips the reserved-`wifiAp` error (both fire), which is correct. No other sub-slice touched.
