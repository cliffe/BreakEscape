# Handover S5a unit 14: dungeon graph

Done. Files: `scripts/generate_dungeon_graph.rb` (new block just before the "N14 (S2, plan 9.3, Need row)" comment; the grants comment updated), `test/js/dungeon-graph-admin.test.mjs` (5 tests), `scenarios/test_ops_access/dungeon_graph.{json,md,html}` regenerated.

## Format (for units 15 and 17)
- Node id `admin@<pcId>`, kind `key`, label `<PC name or id><br/>Administrator session`. No password text.
- Edge label `administrator`, from `signin_<npcId>` (each `creds.admin: true` account that `AccessIdentities.reach` says the PC admits) and from each `weak_...` node whose `grants.session.access` is `admin` on a sign-in host. The weakness keeps its `grants session` edge to `lock_<pcId>`.
- No node unless at least one edge exists; no hash-record or collect edges (S5b).

## Open
- `test/js/dungeon-graph-ops.test.mjs:84` (test 5) pins `out('weak_vault01_archive_old_release_admin') == ['lock_vault01']`; it now also has `admin@vault01`. Not edited (not mine). Needs `['admin@vault01', 'lock_vault01']`.
- `ops-unchanged-validator` passes unmodified: its snapshot does not hold the graph, so no re-record is needed.
- Mermaid ids contain `@`; the generator does not quote ids. Not checked in a browser; if Mermaid rejects it, `hide_id` is the place to map it.
- Proof: `dungeon-graph-admin` 5/5; every other `dungeon-graph-*` passes except the pin above (ops test 1, the committed-graph comparison, passes once the regenerated files are in); `ops-unchanged-validator` 17/17; `bin/ops-golden-compare` 16 runs 0 failures; rubocop clean.
