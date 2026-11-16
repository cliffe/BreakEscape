# Credential keyring K1: security and correctness review, round 1

Reviewed at commit `179554c12` on branch `build/keyring-k1` (worktree `.claude/worktrees/p-k1`),
diffed against `9a20b4967`. Scope: the server half of K1 only (registry model, per-game proofs,
GET /keyring, the bootstrap strip, `GamePolicy#keyring?`, and `check_credentials`). The client half,
the leak scanner, the golden and sync-size tests, the JS validator fixtures, `test_access_keyring`
and the live proof are listed as deferred in the build log and are out of scope here; they are noted
as gaps at the end, not scored.

READ ONLY review. The three K1 test files were run file by file: 29 runs, 90 assertions, 0 failures.
`check_credentials` was exercised by hand against a crafted networks scenario (10 findings, no crash).

## Verdict

**SHIP.** Blockers 0, Majors 0, minors 5 (plus 1 trivial).

The security core holds. Forged and client-supplied proofs are blocked (the `held` proof is
identity-strict on type + id + the stored `credential`, rejects `client_forged?`, and uses no name
fallback; `credential` is now a `FORGEABLE_ITEM_FIELDS` member so a client cannot set it on an item
it contributes). No value of a non-password kind ever reaches an answer; a password rides only the
implicit (captured) entry, built from the same readers as GET /capture_secrets, and a registry
password entry never carries a value. The top-level `credentials` registry is stripped from the
bootstrap. `GET /keyring` is read-only, off the `with_game_lock` list, writes no `player_state`, sets
`no-store`, and authorises exactly as `capture_secrets` does (route test confirms the other-player
case). Hostile params are safe: an array `pc_id` fails `present_string?` and simply skips scoping; a
non-matching `rev` just returns the full answer. The validator loads `NetworkModel` transitively (via
`validate_network`) and runs without the "could not run" suppression that bit K0.

The three called-out deviations are each sound: the schema (closed entry shape, `^_` comment escape)
in place of a validator key-list matches the project's single-source rule; the foothold-proof set is
a safe superset (see m4); and the broad `item_definition` walk cannot be exploited because the proof
still checks type, id and the unforgeable `credential` (a decoy node only risks a false negative on
duplicate ids, which the format forbids).

## Findings

### m1 (minor) Item-level `credential` ships to the browser
`app/models/break_escape/game.rb` `filter_inventory_for_client!` (the `filter_inventory_for_client!`
body) and `filtered_scenario_for_bootstrap` (only `filtered.delete('credentials')`).

Failure scenario: a held credential item (e.g. `HB-FIN-02.rdp`) keeps its `credential` field through
`client_inventory`, so the bootstrap `playerInventory` and every inventory echo carry
`"credential":"lena_rdp"`; a credential item left loose in a room also carries it in the bootstrap
scenario. This contradicts plan section 15's "`credential` is a server-only item field". It is not
exploitable (plan 3.4 explicitly declares the id "not secret", and forgery is already blocked), and
the client never needs the field (K3 draws Connect from GET /keyring), but the deferred
`access_leak_scanner` as specced (it looks for a top-level `credentials` key, an unheld keyring entry,
and a registry password carrying a value) would not catch it.

Suggested fix: strip `credential` in `filter_inventory_for_client!` and from item nodes in
`filtered_scenario_for_bootstrap` for defence in depth and to match the stated invariant; or, if the
author's intent is that the id may ship, reconcile the wording in section 15 with 3.4 and leave it.

### m2 (minor) `held` proof reads the inventory entry at top level only
`app/models/break_escape/credential_keyring.rb` `credential_held_proof_holds?` (the
`inv['credential'].to_s == cred_id ... && inv['type'] ... && inv['id'] ...` block).

Every other server inventory reader (`has_key?`, the lockpick check, `record_planted_item!`) unwraps
with `data = inv['scenarioData'] || inv`; this one does not. It is correct today because a genuine
take is stored flat by `canonical_inventory_item` (`source.deep_dup`, credential retained by
`filter_requires_and_contents_recursive`) and `sync_state` never writes the inventory. But if any
future path ever stores a credential item in the wrapped `{ scenarioData: {...} }` shape, the proof
silently false-negatives and an honestly-held credential drops off the keyring.

Suggested fix: unwrap once (`data = inv['scenarioData'] || inv`) and read `credential`/`type`/`id`
from `data`, matching the other readers.

### m3 (minor) `route:` ignored and `pc_id` always scoped (deviation from 6.2)
`app/models/break_escape/credential_keyring.rb` `keyring_for_client` and `registry_keyring_entries`.

`keyring_for_client(pc_id:, route:)` never reads `route`, and `registry_keyring_entries(pc_id:)` never
reads its `pc_id`. Plan 6.2 says the server should use the route to decide whether `pc_id` names a
screen the player can open, and "a pc_id the player cannot open a screen for ... is ignored"; the
implementation always attaches `forThisPc`/`accepted` whenever `pc_id` is a present string. Harmless
(both fields derive from the policy, which already ships in the bootstrap), but it diverges from the
spec and leaves two dead parameters.

Suggested fix: either drop `route:` and the unused `pc_id:` on `registry_keyring_entries` with a note
that admission is deliberately not pre-judged (consistent with "the sign-in answers it"), or implement
the 6.2 "ignored" rule. Low priority.

### m4 (minor) Foothold-proof validator set omits implant-created footholds
`scripts/validate_scenario.rb` `check_credentials` (the `foothold_ids` set: jacks, Wi-Fi APs and
`grant_foothold_actions` PCs).

A `saved_connection`/token proof whose `foothold` names a foothold created by a plain implant (id =
PC id), not by a grant action, would draw a false "names no foothold any jack, access point or implant
action can create" error. Validator-only (runtime reads `player_state['footholds']` directly, so play
is unaffected), and no corpus scenario authors such a proof. The builder flagged this.

Suggested fix: fold the PC ids that an implant can foothold into `foothold_ids`, or downgrade the check
to a warning. Revisit when a scenario needs it.

### m5 (minor) Route/power computation for connecting kinds is untested
`app/models/break_escape/credential_keyring.rb` `credential_routes`, `registry_connecting_entry`
(`targetOff`, `remoteBlocked`, `sessionHeld`).

The unit tests cover the assist_invite relay route and the ended case, but no test holds a foothold
that reaches a `saved_connection`'s `connectsTo` and asserts `routes: [{foothold:...}]`, `targetOff`
(sent only when routes are non-empty) or `remoteBlocked`. These branches (`host_reachable_through?`,
`host_service_off?`, `remote_blocked?`) are built but unexercised, so a regression here would pass CI.

Suggested fix: add a credential_keyring_test case with a held foothold reaching the PC, asserting the
route list, `sessionHeld`, and that `targetOff` is present only with a route and `remoteBlocked`
reflects the policy.

### trivial `rev` is a 6-hex (24-bit) digest
`app/models/break_escape/credential_keyring.rb` `keyring_rev` (`Digest::MD5.hexdigest(...)[0,6]`).

A stale client `rev` that collides returns `{ unchanged: true }` and the client misses an update.
Cache-only, negligible probability; noted for completeness.

## Deferred items (gaps, not scored)

Per the build log these are explicitly handed over and do not block main (nothing client-side calls
the route; the validator/schema are inert without a `credentials` key):
`access_leak_scanner.rb`, `capture_secrets_unchanged_test.rb` (the golden pin), `sync_payload_size_test.rb`
(bootstrap-without-credentials and 64-entry-under-16KB), `validator-credentials.test.mjs`,
`test_access_keyring` and its dungeon graph, and the live proof. The "implicit entries equal GET
/capture_secrets" positive test (plan 6.4) is also not present; the current test only covers the
no-capture case. These should land before the slice is considered complete, and the sync-size and
golden tests in particular are the standing guards for the two leak-adjacent invariants this review
could only check by reading.
