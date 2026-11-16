# Credential keyring K1: security and correctness review, round 2 (delta)

Reviewed at commit `3ba8192a2` on branch `build/keyring-k1` (worktree `.claude/worktrees/p-k1`).
Delta over R1's base `179554c12` (`git diff 179554c12 3ba8192a2 -- . ':!scenarios/m*'`), the K1 commits
being `1bf86150f`, `cb724513c`, `3ba8192a2` plus the R1-minor fixes `5803f3468`, `b3b3574c1`,
`66583ff11`, `415c61407`, `19e19d0f5`, `a45154202`. R1 verdict was SHIP, 5 minors (m1 to m5).

READ ONLY. Tests run one by one (RBENV_VERSION=2.7.8, BUNDLE_PATH=vendor/bundle): the five K1 Ruby
files and the JS fixtures all pass (`credential_item_field_test` 5/10, `credential_keyring_test`
18/43, controllers `sync_payload_size_test` 3/10, `capture_secrets_unchanged_test` 4/14,
`access_leak_scanner_test` 50/277, `validator-credentials.test.mjs` 38/38). The validator on
`test_access_keyring` reports 0 errors and 1 expected warning; its regenerated dungeon graph matched
the tracked files (nothing to restore).

## Verdict

**SHIP.** Blockers 0, Majors 0, minors 3 (plus 1 trivial).

The security core still holds and every R1 minor is resolved:

- R1 m1 (item `credential` ships): fixed. `obj.delete('credential')` now runs in both client filters,
  `filter_inventory_for_client!` (`game.rb:1326`) and `filter_requires_and_contents_recursive`
  (`game.rb:6365`). Between them these cover every item-serving path: the bootstrap `playerInventory`
  and every inventory echo and `give_item`/network delta (through `client_inventory` and
  `item_for_answer`, both calling the first filter), and lazy room loads, GET /container contents, NPC
  `itemsHeld`, `tableItems` and unlocked container `contents` (all through the second filter, which
  recurses into each). The bootstrap drops room contents to metadata anyway, so no loose item rides it.
  `credential` remains a `FORGEABLE_ITEM_FIELDS` member (`item_identity.rb:31`), so a client-contributed
  copy never carries it. `credential_item_field_test` pins the inventory, echo, lazy-room and bootstrap
  cases, and the stored state still proves `held`.
- R1 m2 (held proof top-level only): fixed. `credential_held_proof_holds?` now unwraps
  `data = inv['scenarioData'] || inv` before reading `credential`/`type`/`id`, as the other readers do.
  No forgery is opened: `ItemIdentity.client_forged?(inv)` is still checked first, and `credential` is a
  forgeable field stripped from every client contribution.
- R1 m3 (route/`pc_id` ignored): implemented as 6.2. `keyring_pc_openable?` now gates scoping, and the
  two dead params are gone from `registry_keyring_entries`. See the m3 judgement below: the trust of
  `from`/`relay` leaks nothing.
- R1 m4 (foothold set omits implants): fixed, `implant_<pc>` folded in. See m1 below for the residual.
- R1 m5 (connecting routes untested): `credential_keyring_test` now covers the saved_connection route,
  `targetOff`, `remoteBlocked` and `sessionHeld` (18 runs).

### m3 judgement (from/relay trust): no leak

`keyring_pc_openable?` returns true unconditionally for a `from` or `relay` route (K2/K4 own their reach
checks) and checks `host_reachable_through?` only for a foothold route. When it returns true, scoping adds
just `forThisPc` and `accepted`. `forThisPc` restates the entry's own `connectsTo`, which already ships on
the entry regardless of `pc_id`; `accepted` comes from `CredentialModel.policy_for`, which reads the
top-level `policies`/`defaultPolicy` that ship in the bootstrap as authored. Both are derivable from data
the client already holds, and the proven registry entries are returned whether or not a `pc_id` is given,
so a spoofed `from`/`relay` (or a foothold the player does not hold) buys no secret value. The deliberate
K1 trust is safe to carry until K2/K4 add their checks.

## Findings

### m1 (minor) Validator foothold set accepts bare source ids that can never match a runtime foothold
`scripts/validate_scenario.rb` `check_credentials`, the `foothold_ids` set (lines ~7124 to 7142) consumed
at line 7298.

The runtime only ever keys `player_state['footholds']` by the prefixed forms `jack_<jackId>`,
`wifi_<network>` and `implant_<pc>` (`network_access.rb` `foothold_id_for`, `wifi_foothold_id`,
`implant_foothold_id_for`), and the `foothold` proof holds by `held.key?(proof['foothold'])`. Commit
`1bf86150f` correctly added those prefixed forms (fixing the real false positive, since plan 9.1 authors
`jack_comms_port`), but it also kept the bare source ids (jack object id, Wi-Fi AP object id, PC id) in the
set. A proof authored with a bare id, e.g. `proof: { foothold: "comms_port" }` instead of
`"jack_comms_port"`, therefore passes validation while it can never be satisfied live. No built K1 kind uses
a `foothold` proof (it is K5's token proof), so this is forward-looking and validator-only, but the
superset hides exactly the authoring slip the check exists to catch.

Fix: accept only the prefixed runtime forms, or emit a warning when a `foothold` proof names a bare source
id, so an unsolvable proof is flagged rather than passed.

### m2 (minor) Two test files define the same class `BreakEscape::SyncPayloadSizeTest`
`test/controllers/break_escape/sync_payload_size_test.rb` (new, K1) and
`test/integration/sync_payload_size_test.rb` (pre-existing) both declare
`module BreakEscape; class SyncPayloadSizeTest < ActionDispatch::IntegrationTest`.

Each file passes alone (3 and 6 runs), but when a full `rails test` loads both, Ruby reopens one class and
merges them (confirmed: both required together gives 9 runs, all green). It works today only because no
method or constant name collides (`build_game`/`MAX_ENTRIES`/`SIZE_LIMIT` versus
`build_real_game`/`BASE_BOOTSTRAP_BYTES`/`FIXTURES`), and the new file's `include Engine.routes.url_helpers`
leaks into the shared class. The next helper or constant either side adds under a shared name would silently
override the other.

Fix: rename the new class (e.g. `KeyringSyncSizeTest`), keeping one class per fully-qualified name.

### m3 (minor) The leak scanner guards the registry key, not the item-level `credential` field
`tools/playtest/lib/access_leak_scanner.rb` `scan_credentials` (line ~1181).

The new checks catch a plural `credentials` key, an unheld registry entry, and a registry password carrying
its value, and their tests are solid. None checks for the singular item-level `credential` field, the exact
leak R1 m1 flagged and the two filters now strip. A regression in either `obj.delete('credential')` would
pass the playtest leak scan; only the unit test `credential_item_field_test` would catch it. Defence in
depth only (the strip and its unit test are the primary guards).

Fix: in `scan_credentials`, also flag an object carrying a `credential` string field in any client response,
so the scanner stands as a second guard on the server-only field.

Note on the unheld check: `credential_proof_held_ids` reads `@game` once at scan time, so a credential that
was legitimately held when the keyring answer was captured but released before the scan would false-positive
`credential_unheld`. This mirrors the lockout records' own scan-time read and is an accepted playtest-tool
limitation, not a finding.

### trivial Plan 9.1 registry table still names `ops_rdp` (held) where the scenario ships `ops_cookie` (foothold)
`docs/achitechture/CREDENTIAL_KEYRING_PLAN.md` section 9.1 (line 738) lists `ops_rdp` as a held
saved_connection; `scenarios/test_access_keyring/scenario.json.erb` implements `ops_cookie`, a
foothold-proof saved_connection, so K1 exercises all four proof kinds. The scenario and its `PLAYTEST.md`
agree and the PLAYTEST explicitly notes it mirrors "plan 9.1's `ops_rdp` expected warning", so this is a
deliberate, documented deviation that makes the test floor better, not a defect. The only residue is the
stale id in the 9.1 registry table; update it when 9.1 is next touched.

## Scope checks requested

- Item-level `credential` stripped on every client path: yes (m1 above lists each path and its filter).
- `keyring_pc_openable?` through `from`/`relay`: no leak (m3 judgement above).
- Validator foothold superset passing a never-fires scenario: yes, via a bare-id `foothold` proof (finding
  m1).
- `test_access_keyring` early-secret check: clean. The only plaintext password in readable text
  (`lena_passwords_txt`) sits inside `lena_pc`, a `login` PC whose `contents` are stripped and served only by
  GET /container against a session; registry password entries carry no value. Validator 0 errors.
- Registry consistency with plan 9.1: consistent in substance (documented `ops_cookie` deviation; trivial
  doc nit above).
- Run-2 additions guard their claims: yes. The leak scanner's three credential checks, the sync-size test
  (no `credentials` in the bootstrap; 64-entry keyring well under 16 KB; matching-`rev` reply tiny) and the
  golden `capture_secrets_unchanged` test (byte-identical with and without a registry, pinned to the exact
  secrets JSON) each pass and each exercise what they assert.
