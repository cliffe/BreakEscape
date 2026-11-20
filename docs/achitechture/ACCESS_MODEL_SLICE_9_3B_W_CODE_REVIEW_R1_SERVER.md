# Slice 9.3b sub-slice W (Wi-Fi) - server code review, round 1

Scope: server side only. Branch `build/9-3b-w` (head ad807fadc), diff `main...build/9-3b-w`.
Reviewed: `lib/break_escape/network_model.rb`, `app/models/break_escape/network_access.rb`,
routes, `games_controller.rb`, `game_policy.rb`, `scripts/validate_network.rb`,
`validate_scenario.rb`, `scenario-schema.json`, `tools/playtest/lib/access_leak_scanner.rb`,
`verify-run.rb`, Ruby tests, `scenarios/test_access_networks`. Client JS (network-links.js,
password-minigame.js, api-client.js, interactions.js) is out of scope and not assessed.

Tests run (all green):
- `bin/rails test` on network_wifi_test, network_model_test, access_leak_scanner_test: 49 runs,
  359 assertions, 0 failures.
- `node --test` on validator-network-model (34), network-links (40), password-join-mode (5): pass.
- `validate_scenario.rb scenarios/test_access_networks` : 0 failures (❌ count 0).

## Authority assessment

No authority hole found. Specifically:
- Join without the key: refused server-side. `join_network!` compares `key == psk` only when
  `present_string?(psk)`; a wrong/absent key returns 422 `wrong_key` before any state write and is
  not counted (network_access.rb:286-289). Covered by the wrong-key test.
- Reach a network never joined: requires a real reachable `wifiAp` object whose network defines a
  `wifi` block (find_wifi_ap, network_access.rb:253-264); unknown/non-AP ids 404. Covered.
- Segmentation (reach past the joined network): a Wi-Fi foothold carries `network = ap[:network]`,
  and `network_rows`/`host_reachable_through?`/`resource_admits_player?` all gate on
  `foothold['network'] == network`, identical to the jack path. The "own network only" test asserts
  `sam_pc` (office_lan) is absent from the guest_wifi view.
- Learn a key/SSID it should not see: `networks` is in `WITHHELD_SCENARIO_KEYS`, so the whole block
  (ssid, psk) is stripped from the bootstrap; join/view responses never echo the key; the leak
  scanner's `wifi_secret` rule flags an ssid/psk in any response with no route exemption. Covered.
- `link_item_for` wifi branch: branches on `foothold['via'] == 'wifi'` and reads name/sprite from the
  stored record, so the jack branch is untouched and the handle survives a reload with the AP no
  longer in hand. Reload test covers this.
- Save/reload: footholds, gainedFootholds, link item and sprite/observations all persisted at join
  and rebuilt from the record; `footholds_for_client` restore path covered.
- 9.3a effects: jack path, `unplug_device!` (jack-only via find_jack) and existing scanner rules
  unchanged; `wifi`/`wifiAp` un-reserved but `downIf`/`portSecurity` stay refused. test_access_networks
  still validates clean.
- Ruby 2.7.8: `&.`, `.presence`, freeze constants, keyword-free calls all valid; no 3.x-only syntax.

## Findings

### Minor

1. `tools/playtest/lib/access_leak_scanner.rb:736` - the `netlink_` holder exemption in
   `scan_network_strings` is untested. The Wi-Fi link item carries the network *name* in its `name`
   and `observations`, which ship in non-network/non-scenario responses (GET /inventory, /room). That
   line is the only thing stopping those from being reported as `network_string` leaks, yet deleting
   it fails no test (the new unit test only exercises `wifi_secret` for ssid/psk, not the network
   name on a link item). Failure scenario: a later refactor drops or narrows the exemption and the
   scanner starts reporting a legitimate player-held handle, or (inverse risk) the exemption is
   silently too broad and masks a genuine resource-name leak that lands under a `netlink_` holder.
   Fix: add a scanner test that scans a `/inventory` (or ROOM) body containing a `netlink_wifi_x`
   item whose `name`/`observations` include the network name and asserts no finding, plus a negative
   where the same network name under a non-`netlink_` holder in the same response *is* reported.

### Nit

2. `app/models/break_escape/network_access.rb:286` vs `scripts/validate_network.rb:190-199` -
   whitespace-only psk disagreement. The server uses `NetworkModel.present_string?(psk)` (strips),
   so a psk of `"   "` is treated as an **open** network and joins with no key, while the validator
   treats any non-empty string as a real (short) key and only warns. Degenerate authoring case, not
   reachable through the shipped test scenario. Fix: validate psk is non-blank (or have the server
   use the same emptiness predicate the validator does) so the two layers agree.

3. `scenarios/test_access_networks/scenario.json.erb:287-289` (sam eventMappings) - the N9 mapping
   `data.apId === 'guest_ap2'` is not gated on guest_wifi already being joined, so if the player
   joins through `guest_ap2` first, N8 (`networkId === 'guest_wifi'`) and N9 fire from the same join
   and "join again through the second access point" completes on a first join. The validator already
   warns (onceOnly handlers at indices 11/12 can fire together). Server behaviour is correct; this is
   a test-scenario logic nit. Fix: gate N9 on a global set by N8, or accept it as card-guided order.

4. `app/models/break_escape/network_access.rb:273` - `join_network!` requires `object_reachable?(ap)`
   (AP room unlocked, container path unlocked), mirroring the jack plant, while the spec says Wi-Fi
   has "no device and no range" (5.3). This is consistent with the click-to-interact model and is
   almost certainly intended, but if a scenario ever places an AP meant to be joined from a locked-out
   position, the reach gate blocks it. Worth one line confirming the intent; no code change needed.

## Test quality

Tests are specific and would fail without the checks they cover: the wrong-key test asserts no
foothold is recorded; the segmentation test asserts the other network's host is absent; the leak
test asserts psk/ssid are absent from scenario, join and view responses; the reload test asserts the
bootstrap foothold rebuilds sprite/observations. The one gap is finding 1 (the `netlink_` network-name
exemption).

## Verdict

Approve with minor follow-ups. No Blocker or Major issues; authority, segmentation, key handling,
withholding and reload state are sound and well tested. Address finding 1 (scanner test for the
`netlink_` network-name exemption) and, optionally, the three nits.
