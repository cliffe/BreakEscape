# Handover core step 2 (S1, N13): schema, model helpers, validator. Done.

No route, no server behaviour, no client. Branch `ops-core`.

## Helpers (`lib/break_escape/network_model.rb`, appended before `present_string?`)
- `hosts(data)` -> `{ id => entry }` of the top-level `hosts` map: hashes only, `_` notes skipped.
- `discovery?(data, network_id)` -> true only for `discovery: "scan"`.
- `hosts_on(network_id, data)` -> `[{ id:, kind: 'pc'|'device', object:, network:, services: }]` sorted by id. 'pc' = sign-in
  room object (`object` is the room object); 'device' = a `hosts` entry (`object` is the entry hash, it has no `id` key, use `:id`).
  A `hosts` entry whose network is not a `networks` key is left out; unknown/blank network -> `[]`. An id held by both kinds lists the PC.
- `services_of(host)` takes a record, a room object or an entry; at most `SERVICES_PER_HOST` (8); non-hash entries skipped.
- Not built (later steps): weaknesses, decoys, techniques, technique_matches?, technique_items.

## Withheld names (`app/models/break_escape/network_access.rb:17-21`)
`hosts` in `WITHHELD_SCENARIO_KEYS`; `services` in `WITHHELD_OBJECT_FIELDS` (applied in `game.rb` room filter, ~7449).

## Schema (`scripts/scenario-schema.json`)
`networks.<id>.discovery` enum open/scan; top-level `hosts` (after `resources`: `x-id-map`, `x-serverOnly`, `x-servedBy`
GET /network + POST /network/scan, no `propertyNames` and no `patternProperties` on the map (the validator holds the key pattern and the 40 limit), closed entry with the `^_` pattern, `name` and `network` required);
`definitions.service` (closed; name/port/product/version required, caps as plan); `definitions.item.properties.services`
(`x-serverOnly`, `x-servedBy`, maxItems 8, `$ref` service). The schema does not constrain the `hosts` keys; the validator holds the key pattern
(`NETWORK_OPS_ID`) and the 40 limit.

## Validator (`scripts/validate_network_ops.rb`, hooked after `check_log_rows` in `validate_scenario.rb`)
`check_network_ops(json, built: NETWORK_OPS_BUILT, objects_dir:, products:)`; messages start `network ops:`. Errors:
`hosts` key longer than 40 / not matching the id pattern / also a room object id / also a resources key; hosts entry network not a
networks key; sprite names no PNG in assets/objects; `services` on a non-sign-in object; two services of one name on a host;
more than 8 services; more than 64 hosts carrying services; `discovery: "scan"` with a wifi block or a jack and no host;
password inside host name, service product/version/label (never quoted); with `logSources`: network id, sign-in host with
services, or foothold device (room, container, start, NPC, grant homes) id over 40. Warnings: services on an open network
whose services carry no weakness; product holding a name from `scripts/real_product_names.txt` (new file, whole word, any case).

## Not-built-yet table (decision)
The plan (section 3) says each stage flips its own entries "when it lands", and step 5 is "land S1", so the S1 entries
(`hosts`, `services` on an object, and `discovery: "scan"`, which I added: the schema now declares it so nothing else would
catch it) stay **not built (N13) until step 5**, not step 3. They are `NETWORK_OPS_BUILT = { N13 => false, N14 => false, N15 => false }`;
the step 5 builder flips `'N13' => true` (the `test_ops_scan` scenario needs it). Also in the table: `weaknesses`/`decoys` on
a service (N14), weakness `grants` and `needs.session` (N15), top-level `techniques` and item `technique_card` (N15).
The S1 rules run whether or not built; the node test passes a built table to test them apart from the table.

## Tests
- `test/js/validator-network-ops.test.mjs` 22 tests (clean fixture, each error and warning, table cases, hook).
- `test/unit/network_model_test.rb` +6 tests; `network_withholding_test.rb` +1; `validator-declared-top-level.test.mjs` +1.
- Ran: rails 224 runs 0 failures (network_model, scenario_schema, withholding, network_ops_unchanged, access_model_*);
  golden compare 12 runs pass; ops-unchanged-validator, pretext-verdicts-unchanged, validator-log-sources pass without re-record; rubocop clean.

## Gotchas for step 3
- Step 3's scan route needs scenarios with `hosts`: until step 5, any such scenario fails the validator (N13). Tests build the
  scenario in Ruby, as `NetworkModelScenario` does; do not add a scenario folder.
- `hosts_on` records for devices: `object['name']`, `object['sprite']`, `object['offWhen']`; id is `rec[:id]`.
- Not done (not in the brief): plan 9.2's edits inside `validate_network.rb` (the two-hosts-one-label rule at VN:587 via `hosts_on`,
  `carries` gaining devices at VN:361-364). Do these when a scenario with devices first goes through the validator (step 5 at the latest).
