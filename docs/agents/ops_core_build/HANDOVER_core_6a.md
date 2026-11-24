# Handover core step 6, part A (S2, N14): the server side of findings. Done (A1, A2, A3)

No client, no catalog loader (6b's `lib/break_escape/realism_catalog.rb`). Branch `ops-build`. The validator's
`NETWORK_OPS_BUILT` still has N14 false (step 8 flips it); node tests pass a built table.

## Routes and answers
- `POST /network/check` (`games_controller.rb` `network_check`), params `foothold`, `host_id`, `service`; `POST /network/confirm`
  (`network_confirm`), params `foothold`, `finding_id`. Both in `set_game` and `with_game_lock`; one 400 `bad_request` for a missing,
  non-string, empty or over-200 param (`ops_ids_well_formed?`, private, bottom of the controller). Policy `network_check?` and
  `network_confirm?` (`game_policy.rb`), added to `DEVICE_ACTIONS` in `policy_test.rb`.
- Check (`network_ops.rb` `check_service!`): 404 unless host listed AND scanned AND service on it; 403 `not_responding`; then adds
  `u<n>` entries (weaknesses not fixed, all decoys, only ids not held). Answer `{ success, hostId, service, findings: [...] }`, `already: true`
  only when the service was already checked and nothing was added. First check writes `service_checked` (once) and saves.
- Confirm (`confirm_finding!`): 404 unless the id is held and its host listed through the foothold; 403 `not_responding`; weakness -> `c`,
  decoy -> `f`; first confirm writes `finding_confirmed` (`finding` alias, `status`) and saves; repeat answers `already: true`, no row, no save.
  Answer `{ success, already?, finding }`.

## The finding shape actually sent (one builder, `ops_finding_row`)
- Always, in this order: `id, alias, hostId, service, class, severity, summary, status` (+ `cli` when linked and resolved). `summary` is the
  authored one or the class line in `CLASS_SUMMARIES` (`network_ops.rb` top).
- `status: "confirmed"` adds `needs: [{ kind, label, met }]` (always an array, maybe empty) and `fixed: true` while `fixedIf` holds.
  `status: "false"` adds `falseBecause`. Unconfirmed: nothing more (a fixed unconfirmed finding is byte-identical in keys to a decoy).
- Needs order: credential, item, itemType, global. `label`: credential label (own label, else the foundIn item's name), item name, or
  the authored `label`. `met` recomputed on each read. `session` is S3, not built.
- Findings ride on the host row as `findings: [...]` (finding id order) beside `services`, only when at least one is held
  (`ops_add_host_fields!`). The check answer lists every held finding of that service.
- `cli` (A3, `ops_finding_cli`): only for an entry with `realism`; copies `title module script advisories output` that the catalog entry has
  (non-empty), in that key order, deep-dup'd; never the link id, never `_` keys. An unresolved link logs one `Rails.logger.warn` naming the
  link id per build and sends no `cli`.

## State
- `opsFindings` in `ACCESS_STATE_DEFAULTS` (`game.rb`, after `opsDiscovered`), default `{}`; value `"<u|c|f><n>"`, alias is `f<n>`.
  `opsDiscovered.services` is `["<hostId>.<service>"]`, created by `ops_discover!('services', key)`. Neither is ever in a sync body or sent whole.
- Models: `NetworkModel.weaknesses/decoys(data)`, `findings_of(host_id, service)`, `finding_id`, `hosts_on_all`, `FINDINGS_PER_LIST` (`network_model.rb` end).
- Log: `service_checked`, `finding_confirmed` and the `service` kind in `ops_log_events.rb` (kind lookup = the name if some host declares a service
  of that name; never the label).

## Validator S2 (`scripts/validate_network_ops.rb`, `network_ops_check_findings` and helpers)
Runs only when N14 is built. Errors: id twice in a service, >4 of a kind, >128 total, needs rules (label, itemType+global, item+itemType, technique_card,
unknown credential / item id / itemType / global), fixedIf undeclared or already holding with nothing else mentioning the global, weakness on a network no
foothold reaches (jack, wifi, implantable PC, links). Warnings: telltale id words, client-writable `needs.global`, procedure-like summary, same class and
severity with no summary. Gotcha: "nothing can change it" reads only the scenario JSON (ink files are not seen). Not done: the "fixedIf as only gate before a grant" warning (S3).

## Schema
`definitions.weakness`, `decoy`, `opsNeeds`, `opsGrants` (closed), `service.weaknesses/decoys`, `x-servedBy` on `hosts` and `services` gained check and
confirm. `x-ref: credential` was NOT used (the reference index has no `credential` kind; the validator checks credential ids itself).

## Tests (all pass)
`network_findings_test` 28, `network_ops_free_test` 4, `network_ops_no_exposure_test` 15 (+8 S2), `network_ops_indistinguishable_test` 12 (+4 S2),
`network_cli_fields_test` 20 (+9 S2, own catalog `test/fixtures/ops_findings_catalog/findings.json`), `network_model_test` 32 (+3), `validator-network-ops` 38 node tests
(+12). Full proof run: 303 Rails runs 0 failures; golden compare 12 runs pass (no re-record). Support: `NetworkOpsScenario.findings_scenario` and
`NetworkOpsRequests#ops_check/ops_confirm/sweep_and_scan/findings_game/set_global/row_findings`.

## Edits outside the file list (all one line, flagged)
`test/js/validator-declared-top-level.test.mjs:141` (hosts x-servedBy), `test/models/break_escape/ops_log_test.rb:567` (`OPS_AS_NIL_EVENTS` + the two events),
`test/controllers/break_escape/network_ops_state_delta_test.rb:45` (`opsFindings` is now `{}`, not nil).

## Gotchas for the client and scenario builders
- A `cli` on a finding exists only with a catalog link; `realism` is not in the schema yet (skin plan K3), so scenarios cannot carry it yet.
- Aliases: `f<n>` by discovery order across the whole game, not per host.
- The global's name is never in an answer, but a declared global is in the bootstrap's `globalVariables` as ever.
- `ops_log_test` "production setting" test is flaky when the process id contains the digits of a test PIN ("4179"); unrelated to this step.
- `needs.session`, `grants`, `opsUsed`, techniques: S3, unbuilt.

## S2 server R1 changes (contract updates)

- A `credential` need is met when the keyring would list the credential now (`ops_keyring_serves?` over `registry_keyring_entries`), not by `credential_proof_holds?` alone (m3). S3's `need_unmet` must read the same rule.
- A `technique_card` `itemType` need keeps its row with `met: false` (m11).
- A finding's `cli` copies by type (m2): `title`, `module`, `script` only as non-empty Strings; `advisories`, `output` only as the non-empty Strings of an Array; a key with nothing left is left out.
- An unresolved `realism` link warns once per link id per process (`RealismCatalog.warn_unresolved`), and not at all while the loader's own fault warning stands (m1). `RealismCatalog.entry_ids` lists ids; `reset_warned!` is for tests.
- `NetworkModel.findings_of` keeps one record per finding id, the weakness before a decoy of the same id (m12).
- Graph: need edges into `weak_*` from `cred_<id>` and from an existing item node (`grant_<id>` or `cred_src_<id>`) are drawn after the credential block; an item with no node draws nothing (m9). A finding-id collision on a node id gets a `_2` suffix and a stderr warning (m16).
