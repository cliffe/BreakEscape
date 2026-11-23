# Handover core step 13, part B (S3, N15): tooling and docs. Done

Branch `ops-build`. No engine file touched. No engine bug found.

## Leak scanner (`tools/playtest/lib/access_leak_scanner.rb`, section "ops core S3")
- Tags: `card` (a technique's `name`, `summary`, `worksOn.product`, each `worksOn.versions` entry; step `card:<technique id>`), `grant` (a `grants.credential` id and that credential's label; step `granted:credential`), `never` (a registry id no item carries). `collect_ops_techniques`, `collect_ops_grants`.
- Steps earned only from successful answers of the real routes, or `ops_steps:`: `card:<tid>` from a 200 `POST /inventory` row with `inv.action == "add"` and an `inv.itemId` that is a card item (the recorder's `inv` tag; an untagged row earns nothing), or a card in `startItemsInInventory` (earned at construction); `granted:credential|session`, `through:<foothold id>` (the grant answer's `session.footholdId`) and `admin` from a successful `POST /network/technique` answer. A `GET /network` answer earns none of them. The credential grant is coarse: the answer does not say which credential, so any credential grant clears all granted credential ids.
- Structural rules (no string test): `scan_ops_techniques` (a `techniques` key anywhere but `GET /network`'s `$.techniques`; a map entry for a card not held, with a key outside name/summary/worksOn/itemId, or an `itemId` that is not a card of that technique; a `worksOn` key outside the map), `scan_ops_technique_answer` (key sets of a grant, a credential grant and a refusal; `no_grant` carries nothing but `reason`; `need` has only `kind`, `label`), `scan_ops_session_keys` (`technique` key anywhere; `via: technique` before `granted:session` or in a scan, check or confirm answer; `access` as a scalar other than `"admin"`, or `"admin"` before `admin` earned; an authored `access` map or list is not judged), `scan_ops_foothold_views` (`openHere` outside the view of a `through:` foothold or outside `$.footholds`; a session on a `remoteSignIn: false` row in another foothold's view, owner `ops:host_row`), finding rows (`ops_row_technique?`, `ops_row_shape_bad?`: a technique id or `technique`/`techniques`/`itemId`/`worksOn` key under a finding row, keys outside the finding set, a `needs` row with a key beyond kind/label/met or a kind outside the five).
- N5 fixed: `collect_ops_needs` registers only the authored `needs.label`; a credential label and an item name are no longer confirm strings (the row's `needs` key before the confirm is the structural leak).
- A held card's `worksOn.class` is a class word; `ops_entry_applies?` skips the `class`-key strings under `$.techniques.` (the map is judged structurally).
- Known weaknesses: a product or version a held card shows clears the same `scan` string for rows (the services structural rule still covers a host row); `access: admin` and `via: technique` need the grant answer in the log (give every capture file of a resumed game).

## verify-run
`opsUsed` in `ACCESS_KEYS`; line `opsUsed N: f2 <finding id>; ...` (alias from `opsFindings`, bare id when not held, alias order, ids matching `OPS_ID`, once each). Session line: `, access user|admin` and `, granted by <finding id>` when the record has them and the values are well formed. Line count 17 (node test, three places: first test, feedRevealed, opsFindings).

## Tests
`test/unit/access_leak_scanner_ops_access_test.rb` 16 runs; `ops_used_verify_run_test.rb` 4; node `playtest-verify-run-access` +2 tests (17 lines). Mutations (each fails a test, restored): no techniques-map held check, no openHere-by-foothold, no access rule, no technique answer shape check.

## Docs
`docs/ACCESS_AND_NETWORKS.md` N15 index row and section; `README_scenario_design.md` N15 row; N13 validator sentence and N14 key fields line corrected; this file's sibling `HANDOVER_core_8b.md` stale line corrected.

## For 13a
`test_ops_access`'s `PLAYTEST.md` should say its leak-scan steps: pass every capture file, and the inventory add rows must carry `inv` (the recorder does). Run `access-leak-check.rb` on the real game once; any false leak on a granted credential that the keyring also lists by another route (a `proof` other than the technique one) would show as owner `ops:grant:<finding id>`.
