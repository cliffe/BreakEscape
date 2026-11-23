# Handover core step 1: unchanged-behaviour fixtures and tests (plan section 10 parts 1, 2, 5)

Done. Tests and fixtures only; no engine file edited. Recorded on main before any ops-core engine edit.

## Part 1: golden answers (shared mechanism)
- Cases: `test/support/ops_unchanged_cases.rb` `core_network_cases` (one case per scenario, name `core_<scenario>`).
  The script is derived from the scenario at capture time and written into the fixture as plain steps with the
  scenario inlined, so a later scenario edit changes nothing recorded. Per scenario: bootstrap, every room,
  GET /network and /keyring plain; per jack a plant, the foothold's /network and /keyring, a remote sign-in and
  GET /container (the desktop) at each login PC with a known account, an unplug; per Wi-Fi AP a join and the
  same views; per declared `grant_foothold` an implant (a keyboard sign-in first for the session shape); bootstrap after.
- Fixtures: `test/fixtures/files/ops_unchanged/core_*.json` (8 files, 1.5 MB).
- Test: `test/controllers/break_escape/network_ops_unchanged_test.rb` (18 tests: fixture guard by the `networks`
  key, structure, one replay per fixture). `bin/ops-golden-compare` also replays them (12 fixtures-tests in all).
- Re-capture (only on code with no ops-core edit): `ONLY=core_<scenario> bin/rails app:ops:unchanged:capture`.
- A new top-level-`networks` scenario (not `test_ops_*`) fails the guard test until its fixture is captured.

## Part 2: validator and graph output
- `test/js/ops-unchanged-validator.test.mjs`, fixture `test/js/fixtures/ops_unchanged/validator_and_graph.json`
  (not in the ops_unchanged Rails folder: that folder's `*.json` are all replayed as route fixtures).
- Runs the validator (`--no-graph --no-known-failures`) and the graph generator on a temp COPY of each folder
  (the generator writes beside the scenario), normalises the repo path and the "Loaded N valid item types" count.
- 16 scenarios: the 8 networks scenarios, the 6 pretext scenarios, m01 and m02 as controls. Each record holds a
  hash of the scenario folder, so a failure says whether the scenario was edited or the code changed its output.
- Re-record: `OPS_UNCHANGED_RECORD=1 [OPS_UNCHANGED_ONLY=name] node test/js/ops-unchanged-validator.test.mjs`,
  only for an intended scenario edit and from a tree with no ops-core edit to the validator, schema or graph code.
- 34 s per run (16 scenarios, 4 at a time).

## Part 5: pretext verdicts
- `test/js/pretext-verdicts-unchanged.test.mjs`, fixture `test/js/fixtures/ops_unchanged/pretext_verdicts.json`.
- The fixture holds each call's merged spec (call plus its character's thresholds and influence) AND the verdict
  rows, so the test replays `pretext-judge.js` over the committed specs: scenario edits cannot break it, only a
  judge change can. Rows: every line over blank fills (right, accepted, wrong, empty) x fresh / all-open /
  all-pending sessions x start and 0 influence; every ask over sessions x min, start, 0, max influence.
  Tell prose is not recorded.
- Re-record (only when the judge changes on purpose, or a pretext line joins the snapshot):
  `OPS_UNCHANGED_RECORD=1 node test/js/pretext-verdicts-unchanged.test.mjs`.

## Gotchas for S1 builders
- Ruby 2.7: no `Array#intersect?`.
- The two ca20_* scenarios have no top-level `networks` (their `networks` is a Wi-Fi list inside a social page);
  they are named by the plan, so they are included by name, with bootstrap, room, network and keyring steps only.
- Checked-in `dungeon_graph.*` files are stale against regeneration for some scenarios (test_access_networks
  differs), so the plan's "no diff after regeneration" is not asserted against them; regenerated output is.
- A login PC with `lockChance` is skipped by the script (a random lock would vary the answers).
- Node tests need no registration (bin/test-js globs `test/js/*.test.mjs`); no engine JS import was added.
