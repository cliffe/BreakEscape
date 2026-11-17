# Credential keyring plan, review R1: server correctness and cheat resistance

Counts: B 1, M 2, m 2, n 2

Reviewed against main f956f5355 in the worktree. Focus: server correctness and cheat
resistance. No SecGen or exploit material read.

---

## B1. The `held` proof as specified matches by id alone and is forgeable with a client notepad

Plan section 3.5 (the proofs table) and sections 6/7 (every place `held` gates a credential).

The table defines the `held` proof as "An inventory entry with that id that is not
client-forged (`ItemIdentity.client_forged?`) and whose stored copy is the server's canonical
copy." The first clause (id + not client-forged) is defeatable, and the second clause has no
stated way to be computed, so a developer who implements the table literally ships a forgeable
secret-class credential.

Evidence:
- `ItemIdentity.client_forged?` (`lib/break_escape/item_identity.rb:40-42`) returns true only for
  an item carrying the `clientAdded` marker. That marker is stamped by one path only,
  `Game#add_item_to_room!` (comment at `item_identity.rb:35-38`), i.e. room adds with no
  server-known source.
- The inventory-add path for an always-allowed item never goes near that marker.
  `validate_item_collectible` returns nil for an `ALWAYS_ALLOWED_ITEMS` type
  (`games_controller.rb:2591-2594`, and `ALWAYS_ALLOWED_ITEMS = %w[notepad]` at line 2507)
  without setting `@collectible_item`. `canonical_inventory_item`
  (`games_controller.rb:2544-2548`) then takes the no-source branch and stores
  `client_item.except(*CLIENT_ITEM_FORBIDDEN_FIELDS)`. `CLIENT_ITEM_FORBIDDEN_FIELDS`
  (`games_controller.rb:2533-2537`) strips `FORGEABLE_ITEM_FIELDS`, `scenarioData`, `phoneOf`
  and `clientAdded`, but not `id`. So a stored notepad keeps a client-chosen `id` and is not
  client-forged.

Failure scenario: a student POSTs `/inventory` `{ action: add, item: { type: "notepad",
id: "lena_rdp_file" } }`. The server stores a notepad with id `lena_rdp_file`, not client-forged.
The registry entry `lena_rdp` (`proof: { held: "lena_rdp_file" }`, kind `saved_connection`) now
has a held proof that holds. `attempt_credential_login!` step 2 (plan 7.1) accepts the id, and the
student signs in as Lena with no `.rdp` file and no password. A saved connection or assist invite
opens an account without its password, so this is access honest play can never reach: it must be
refused (cheat policy).

Fix: define the `held` proof as "an inventory entry that `ItemIdentity.same_item?`s the scenario
item definition named by the registry's `held` id (so type and identity must both match), is not
`client_forged?`, and (belt and braces) whose stored copy deep-equals the server's
`canonical_inventory_item` for that scenario item." Matching the scenario item's `type` alone
already defeats the notepad (notepad != text_file). Add a `credential_keyring_test` case that
collects an always-allowed item carrying the credential item's id and asserts the proof does not
hold, and a tampered-client live-proof beat (K2 already lists "a forged inventory item with the
.rdp's id"; make it a notepad, not a clientAdded room item, because that is the path that evades
`client_forged?`).

---

## M1. `endedCredentials` inside `merge_global_variables!` forces a scenario load on ordinary syncs

Plan section 7.1 ("`endedCredentials`: when a sync merge (`merge_global_variables!`, reading
`stored_scenario_data`) sees an `endsOnGlobal` true ...").

`merge_global_variables!` (`game.rb:332-369`) runs on every PUT /sync_state that carries globals
(`games_controller.rb:2105`), under the narrow `SYNC_STATE_COLUMNS` load
(`games_controller.rb:2022`, no `scenario_data`). To map "a global that is now true" to "which
credential has `endsOnGlobal` equal to that global" the merge needs the registry, i.e.
`stored_scenario_data`, which on the narrow load does a fresh `pick(:scenario_data)` query
(`game.rb:803-805`). The capture code goes to length (the phish fingerprint, `games_controller.rb:
832-916`) specifically to avoid loading the scenario on the common sync; routing
`endedCredentials` through the globals merge undoes that for every sync that resends globals (the
client resends all globals after each load, `game.rb:354`).

Failure scenario: every poll that carries `globalVariables` loads the full scenario_data column
under the row lock, in missions that declare any `assist_invite` with `endsOnGlobal`. On large
scenarios this is the exact cost the sync delta work removed; worse, it is paid even when no
end-global changed.

Fix: at bootstrap, cache a bounded, server-only map `endsOnGlobalMap` (`{ globalName =>
credentialId }`, at most 64, derived from the registry once) in `player_state`. In the sync merge,
after applying a global, consult only that cached map (no scenario load) to decide whether to add
the id to `endedCredentials` (grow-only, bounded) and end its relay session (the session's
`credential` field is in `access_sessions`, so ending it needs no scenario either). Load the
scenario only if the map must be rebuilt. State in the plan that `endedCredentials` persistence is
what stops a client reviving the invite by clearing the global, and that the end-global detection
must not load scenario_data.

---

## M2. `session_route_up?` returns up before any relay or `from` liveness check runs

Plan sections 3.7, 7.1 (relay in `session_route_up?`) and 8 (`from` route).

`session_route_up?` (`network_access.rb:1015-1033`) returns `true` at line 1023 whenever the
session's `foothold` is blank. Relay sessions and `from` sessions (K4) both have no `foothold`
field, so every reader that consults `session_route_up?` for them short-circuits to up before the
plan's new relay (`endedCredentials`) and `from` (source session up, source PC on, target network
still reachable) checks can run. `prune_unreachable_sessions!` (`network_access.rb:1150-1166`)
cannot be the only guard: it skips any session with a blank foothold (line 1158) and ignores
outages by design (it walks `structural_reach`, line 1155), so a powered-off source pivot never
prunes a `from` session.

Evidence of the readers that trust the short-circuit: `resource_admits_player?`
(`network_access.rb:1241-1257`) iterates every session and gates on `session_route_up?(pc_id)`
(line 1251), then computes reach from the session's own host network
(`networks_reachable_from(host_net)`), never re-checking the source pivot; the profile scope
checks (`game.rb:1972`, `1979`, `1996`) gate the same way.

Failure scenario (K4): the player opens a `from` session at the target PC through a session at
Sam's PC, then Sam's PC is switched off (an outage, not an unplug). `prune_unreachable_sessions!`
ignores the outage, the `from` session has no foothold so it is skipped by prune, and
`session_route_up?` returns true at line 1023. The target desktop keeps mapping Lena's shares and
profiles although the only route to it is down: access honest play has lost but the server still
serves. (The relay case is mostly masked because ending the invite removes the session record, but
the belt-and-braces relay check the plan puts here is dead for the same reason.)

Fix: in `session_route_up?`, before `return true if fid.blank?`, branch on the session kind:
a relay session (`session['relay']`) is up only while `session['credential']` is not in
`endedCredentials`; a `from` session (`session['from']`) is up only when the source session still
exists, its own `session_route_up?` holds, the source PC is on, and the target network is in
`networks_reachable_from(source network)`; otherwise fall through to the existing foothold logic.
Add the `from` source-off case (not just source-gone) to `prune_unreachable_sessions!` as plan 8
says, and add a `credential_from_route_test` case where the source PC is powered off (outage, no
unplug) and the target desktop is refused.

---

## m1. `host_row` hardcodes `via: "password"` and derives `remote` from the foothold only

Plan section 3.8 (change `host_row` `via == "password"` to `via != "claim"`).

After the guard at `network_access.rb:918` is loosened to `via != "claim"`, a credential session
(relay or `from`, `via == "credential"`) becomes eligible to be offered over the network as a held
session. But the held hash built at lines 921-922 hardcodes `'via' => 'password'` and sets
`'remote' => session['foothold'].present?`. A relay or `from` session has no `foothold`, so it is
labelled a non-remote password session. The client's session reader then mislabels it.

Fix: derive the held hash's `via` from `session['via']` and `remote` from whether the session
carries any remote route (`foothold`, `from` or `relay`), not from `foothold` alone. Cover a
credential session's `host_row` in `credential_sessions_test`.

## m2. `claimed_session_ids` reuse for relay conflates two meanings

Plan section 7.1 ("`end_claimed_sessions!` ... also ends relay sessions").

`claimed_session_ids` (`game.rb:2377-2379`) selects `via == 'claim'` and is consumed only by
`end_claimed_sessions!` (`game.rb:2362-2375`). Broadening it to include `via == 'credential'`
relay sessions is safe today (single consumer) but names them "claimed", which they are not, and
any future reader of `claimed_session_ids` would then also sweep up relay sessions.

Fix: keep `claimed_session_ids` meaning claims; add a separate `reload_ended_session_ids` (claims
plus relay credential sessions) that `end_claimed_sessions!` uses, and note the two in the build
log's `via` grep.

---

## n1. The credential-login route check precedes the `connectsTo` check

Plan section 7.1, steps 3 and 5.

A holder of any proven credential can POST it against an arbitrary `pc_id`; step 3 answers 403
unreachable / not_responding / off / 422 remoteBlocked for that PC before step 5 rejects it with
"This connection is for another PC". This reveals a PC's on/off and remote-blocked state. It is
not a new leak: the same is learnable through POST /login and the K0 remote GET /login_accounts,
and it needs a held, proven credential. Noted only so a later reviewer does not re-flag it;
reversing steps 5 and 3 (reject wrong-PC before judging the route) would also remove it with no
cost.

## n2. GET /keyring `usable`/`accepts` leak nothing, by design, because policies ship whole

Plan sections 3.2 and 6.2. Confirming, not objecting: `accepts` ships in the bootstrap
(policies are "not secret", plan 3.2), so `usable` discloses nothing the client could not already
compute. No change needed; recorded so the "registry probing via usable" worry is closed.

---

## Checked and clear

- GET /capture_secrets stays byte-identical: K1 adds no edit to `capture_secrets_for_client`
  (`game.rb:1415`), `account_capture_usernames` (`network_access.rb:1385`) or
  `account_capture_served?` (`capture_proofs.rb:104`); the keyring only reads them. The golden
  test in plan section 4 is the right guard.
- Registry stripped from bootstrap: `filtered_scenario_for_bootstrap` (`game.rb:1280-1376`) is the
  right place for `filtered.delete('credentials')`, alongside the existing `flags`/`accountProfiles`
  strips.
- `foothold` proof (`network_footholds.key?`) and `session`/`planted`/`dropped` delegation to
  `capture_proof_holds?` (`capture_proofs.rb:58-73`) read only server-written state; safe. Note the
  `planted` branch also holds on `gainedFootholds` (line 65), which carries over to credentials
  (intended reuse, not a defect).
- `CredentialModel.proof_kind` must enforce exactly-one-key as `CaptureModel.proof_kind`
  (`capture_model.rb:245-250`, `kinds.length == 1`) does, since `CaptureModel::PROOF_KINDS`
  (`capture_model.rb:26`) is only `planted dropped session`; the plan's validator check 6.4
  ("proof not exactly one known kind") covers this if `CredentialModel.proof_kind` is written the
  same way.
- POST /login (`:login`) runs under `with_game_lock` (`games_controller.rb:97-99`), so
  `attempt_credential_login!` inherits the lock; GET /keyring is a side-effect-free read and needs
  none (plan 6.3).
- Inventory cannot be synced wholesale: the only write path is the `/inventory` endpoint through
  `canonical_inventory_item`; sync_state has no `player_state['inventory'] =`. This is why B1 needs
  the always-allowed type and an id collision rather than a bare forged sync entry.
