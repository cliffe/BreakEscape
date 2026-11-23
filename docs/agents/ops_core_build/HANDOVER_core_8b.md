# Handover core step 8, part B (S2, N14): tooling and docs. Done

Branch `ops-build`. No engine file touched.

## Leak scanner (`tools/playtest/lib/access_leak_scanner.rb`)
- `collect_ops_findings` and helpers (`collect_ops_finding`, `collect_ops_cli`, `collect_ops_needs`, `collect_ops_globals`, `collect_ops_catalog_never`); constructor takes `catalog_folder:` (tests; wraps lookups in `RealismCatalog.with_folder`). Unlinked entries are listed through `RealismCatalog.send(:state)[:map]` (the loader has no public enumerator; `lib/` was not mine to edit).
- Tags: `check` (summary; id and the author id part; `class`/`severity` only as the value of that key; the linked entry's title, module, script, advisories, output), step `check:<host>.<service>`. `confirm` (decoy `falseBecause`; real finding's `needs.label`, credential label, item name), step `confirm:<finding id>`. `never`: link id, a linked entry's `_` note, unlinked entries' `module`, global names in `needs.global`/`fixedIf` (string values only; keys are never judged, so the bootstrap `globalVariables` key is not a finding).
- Steps are earned only in `note_ops_steps` from a successful `POST /network/check` (body `hostId`+`service`) or `/network/confirm` (body `finding.id`), or `ops_steps:`. A `GET /network` answer never earns either.
- R3-1 structural rule `scan_ops_services`: a hash whose `id` is a known host and that has a `services` key or `scanned: true` is a finding (owner `ops:service:<id>`) before `scan:<id>`.
- Known weakness: class and severity words are shared by many findings, so one check of any service clears the word for all (a string is clear once any owner is earned).

## verify-run
`opsFindings` in `ACCESS_KEYS`; one line `opsFindings N: f1 <finding id> <status word>; ...` in alias order; bad values left out. The id is printed (plan 11.4), so a finding id with a telltale word shows; no summary, class or reason. Line count is now 16 (node test pinned in two places).

## Tests
`test/unit/access_leak_scanner_ops_findings_test.rb` 11; `ops_findings_verify_run_test.rb` 3; node `playtest-verify-run-access` +2 (line count 16). Mutations that fail tests: no structural rule (2 fail), no check earn (4), no never-catalog collection (2), confirm earned without the route (2).

## Flaky `ops_log_test` "production setting"
Cause: `Logger.new(io)`'s default formatter writes a timestamp and `#<pid>`; the test then asserts no registered secret (a PIN) appears in the log text, and a pid or microsecond field can hold the PIN's digits. `ops_log.rb` is not at fault (its warning line holds only event and key path). Fixed in the test (both `Logger.new(io)` uses get a formatter with no time or pid). Passes three times in a row.

## Docs
`docs/ACCESS_AND_NETWORKS.md` N14 index row and section (after N13); `README_scenario_design.md` N14 row. The N13 section's validator paragraph still says N14 is "not built" (`NETWORK_OPS_BUILT`); fix when step 8 flips it.

## Notes
S1_R2.md P3 row corrected. Not done: `grants` strings (S3). No engine bug found.

## S2 server R1 (scanner)

- The scanner lists catalog ids through `RealismCatalog.entry_ids` (no private call).
- A global name used in `needs.global` or `fixedIf` is now judged as a JSON KEY as well as a string value (`scan_ops_global_keys`). Rule: a key that is a direct child of a `globalVariables` hash is exempt (the bootstrap's declared-globals map, which carries every such name as ever, plan section 7); a key anywhere else, at any depth, is a leak (owner `ops:finding:<id>`, path redacted). The earlier note above that keys are never judged is superseded.

## S2 R2 fix (scanner rules changed; see also HANDOVER_S2_R2_fix.md)
- The `globalVariables` exemption (above) now applies ONLY to the top-level map (`$.globalVariables`, path equality in `each_key_path`); a nested one, or one under a finding row, is judged.
- New structural rules, no string test (`scan_ops_finding_rows`, `scan_ops_never_keys`): (1) a hash whose `id` is a known finding id, before `confirm:<id>`, may carry only `OPS_UNCONFIRMED_KEYS` and status `unconfirmed` (`needs`, `fixed`, `falseBecause`, any other key, or a settled status is a leak, owner `ops:finding:<id>`); (2) the keys `fixedIf`, `grants`, `realism`, `weaknesses`, `decoys` anywhere are a leak (owner `ops:key:<name>`); (3) a gating global's name (`@ops_gating_globals`, from `fixedIf` and `needs.global`, public or not) as a value or key anywhere under a finding row is a leak at any stage.
- `usable` still drops a public global from the string and key registries; `ops_notes` records one line per dropped name and `access-leak-check.rb` prints it.
- A non-`never` string is registered unless it equals a whole room-text string (`usable`). The earlier loosening that dropped a string sitting inside a longer room-text string was removed at PT1 (commit f2677efc4), so a string that only appears inside a longer room-text sentence is still registered and judged. (Corrected in step 13b.)
- Real-scenario proof: `test/controllers/break_escape/access_leak_scanner_ops_real_test.rb`. N1 (expired token or ended invite meets a credential need) and N5 (credential label and item name tagged confirm though shown earlier) are noted for S3.
