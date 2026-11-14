Counts: B 0, M 0, m 3, n 2

## What I checked

Read the plan body (sections 1 to 15), not Appendix A or any review file. Checked claims against the worktree code at 10985677b (branch plan/keyring): `app/models/break_escape/network_access.rb` (the session readers, the reach walk and its cache key, prune, resource/share admission), `game.rb` (`session_identity`, `session_admits?`, `start_login_session!`, `find_login_item`, `account_capture_served?`), `capture_proofs.rb` (`record_capture!`, `pick_capture_candidate`, `store_capture_entry`, `capture_proof_holds?`, `account_capture_served?`), `lib/break_escape/capture_model.rb` (`all_capture_candidates`, `capture_entry_fields`, `capture_candidates`, phish/landing candidate builders, `default_account_address!`), `network_access.rb#account_capture_usernames`, and the POST /login dispatch and PUT /sync_state answer in `games_controller.rb`.

Weighted towards section 10 (K5 tokens: the expiry predicate and its readers, prune, the clock sites, rev/expiresInS), section 8.7 (K3d: the `captures` map, tag/how/account, candidate disambiguation, row keys, leak rules), sections 3.8 and 7, and 9.1.

Findings I set out to test and could NOT fault:
- Every scoped read of a held session routes through `session_route_up?` (`session_admits?` login_pc and profile at game.rb:1999-2007, `scope_admitted_by_session?` at :2024, `resource_admits_player?` at network_access.rb:1269), so wiring the expiry predicate into `session_route_up?` (reader 1) covers shares, profiles and inventory adds. `mapped_shares`/`find_login_item` are only reached behind a desktop guard (`desktop_request_allowed?`, reader 2) or behind a resource-scope check (reader 1), so no ninth unguarded reader was found.
- The new server-only state (`endedCredentials`, `credentialEndGlobals`, `credentialClock`) is bounded at 64 and is not re-sent: the sync answer (games_controller.rb:876-886) is a small delta object, not `player_state`, and the bootstrap filter is an allowlist (`filtered[...]`), so these keys do not leak into the client payload. The "never sent / server-only" claim holds.
- GET /keyring writes nothing (no clock stamp, prune deferred to the next write); POST /login dispatch order (claim first, then credential+typed guard, then credential, then typed) fits the current dispatch at games_controller.rb:1332-1346.
- The four `gainedFootholds` first-write sites the clock hooks (network_access.rb:265-266 jack, :370-371 and :385-386 access point, :510-511 implant) are the only ones in app/lib; `start_token_clocks!` writing only when no clock yet is idempotent against the un-`first`-guarded site at :385.
- The `held` proof is identity-strict and `credential` is in `FORGEABLE_ITEM_FIELDS`, so a forged/notepad item cannot carry it; the tag/how/account in the `captures` map are computed server-side from `player_state['seCaptures']` (store_capture_entry at capture_proofs.rb:509-519) and the stored scenario, not from the client.

No finding touches K0. K0's `/login_accounts` foothold branch is server-enforced (string length, held, reach, blocked, power) and serves no secret, so the K0 cheat analysis stands.

## Minor (m)

### m1. A token session is added to `signedInPcs` permanently, so a `session:` proof and `account_capture_served?` survive token expiry, unlike the relay

Evidence: `start_login_session!` appends the PC to the grow-only `signedInPcs` for any via with a foothold (game.rb:3004-3005); the plan skips this only for a relay ("start_login_session!: ... skips signedInPcs for a relay", section 3.8; rationale in 3.5: "a transient invite never satisfies a session proof or account_capture_served? for good"). A token is a foothold credential session (3.7 `proof_foothold`, record a foothold credential session), so it is NOT skipped. `capture_proof_holds?` reads `signedInPcs` for a `session` proof (capture_proofs.rb:69) and `account_capture_served?` reads the same (capture_proofs.rb:114).

Repro: in a scenario where a credential or an account capture has `proof: { session: X }` and PC X is reachable only through a token, sign in with the token, then let it expire. The `session:` proof and the served capture stay held for the rest of the game, though the token (by design) is dead.

Problem: the relay is deliberately excluded from `signedInPcs` because it is transient; a token is equally transient (it expires), yet it grants a durable `session:` proof. This mildly undercuts the token's own teaching ("short session lifetimes limit it") and widens the cheat surface for the narrow case of a `session:`-proof credential gated behind a token. In `test_access_keyring` it is benign (jake_pw_note's `session: lena_pc` models a password you copied off the desktop, reachable by the .rdp anyway), so no shipped beat is wrong.

Suggested fix: either accept and document that a token sign-in is a real session that durably satisfies `session:` proofs (state it in the K5 cheat note), or add a validator info line warning when a `session:`-proof credential or a `session:`-proof account capture is reachable only through a token, so an author does not make an expired token the thing that still unlocks something.

### m2. The expired-token pivot skip must be structural (both reach variants) and the cache-key term must sit in the common key, not the outage-only block

Evidence: the plan skips an expired token "as a relay or a locked session is" (section 10, reader 3), but those are two different placements with different consequences: a relay is skipped in `reach_session_hosts` (affects both `structural_reach` and `player_reach`), while a lock is skipped inside `reach_walk_uncached` under `!ignore_outages` only (network_access.rb:1115), so `structural_reach` still counts a locked pivot. `prune_unreachable_sessions!` and the network view both read `structural_reach` (network_access.rb:1171; the walk comment at :1112-1114 says "the network view ... draws structural_reach"). R12 expects "the drop box view no longer lists server_lan" and onward sessions to end once the token expires, which only holds if the expired token is dropped from `structural_reach`. Separately, `reach_cache_key` carries `hosts_off`, `source_off` and `sessions_locked` only inside the `unless ignore_outages` block (network_access.rb:1074-1082), so a term added there would not key the structural variant.

Repro: implement the skip the "locked" way (access-only) or add the cache term in the outage-only block, and either the drop box view keeps showing `server_lan` after expiry, or an onward session beyond the expired token is not pruned (a wrong held `sessionHeld`).

Problem: the plan names `reach_session_hosts` and names the cache term, so a precise reader gets it right, but "as a relay or a locked session is" conflates the two placements and the cache-key wording does not say the term goes in the common portion. The build could land the wrong variant and produce the R12 failure.

Suggested fix: state that the expired-token skip is in `reach_session_hosts` (both variants, like the relay), not access-only, and that the `reach_cache_key` expired-token term sits outside the `unless ignore_outages` block so both the structural and access caches invalidate on expiry.

### m3. The read-time capture-candidate disambiguation inverts the record-time preference

Evidence: at record time `pick_capture_candidate` sorts plain before overlaid and takes the first match, so a PLAIN candidate wins when both match (capture_proofs.rb:495-497). The K3d read-time rule for the row tag says "when both match, the overlaid one" (section 8.7), the opposite preference.

Repro: a credential/foothold target whose plain `addCapture` and payload-overlaid candidates produce identical stored fields (the payload adds no `host`/`note`/`roleLabel`/`address`): the record stored the plain candidate, but the keyring row is tagged from the overlaid one (e.g. "Foothold" where the stored capture was the plain "Finding").

Problem: harmless in practice, because when the fields are identical the record keeps no trace of which was chosen, so there is no stored truth to contradict and the overlaid default is defensible. But the plan presents the read-time match "as `pick_capture_candidate` chose them", which is not what `pick_capture_candidate` does for the both-match case.

Suggested fix: reword to say the overlaid preference is a deliberate default for the genuinely ambiguous (identical-fields) case, not a reconstruction of the record-time choice; or align the tiebreak with record time (plain) if "Finding" is the safer default for an authored `addCapture` with no distinguishing payload field.

## Nit (n)

### n1. Two distinct fields are both named `how`

The `captures` map entry carries `how` in {phished, recorded} (section 8.7), while a GET /keyring registry entry carries `how` in {found, given, recorded} (plan line 695). They overlap only on "recorded" and drive different source tags. Risk of implementation and test confusion and of the access-leak scanner's `captures`-key allowlist ("tag", "how", "account") being read against the wrong `how`. Consider renaming the entry field (e.g. `origin`) so the two do not collide.

### n2. `expiresInS` on an `unchanged` GET /keyring answer

The plan keeps `expiresInS` out of the `rev` digest and still sends it on an `unchanged` answer (section 10). Worth stating that the client must read `expiresInS` from an `unchanged` body and not treat `unchanged: true` as "ignore the body", or a live token's countdown will stall between GETs that return `unchanged`.

## Could not check / out of scope

- I did not run a server or any suite (a plan review; RULES.md port 3087 unused).
- The exact per-row bounds of `__capture_log_seen:<key>` New-mark globals under the account/cred/capture key split I confirmed as bounded by rows, but did not enumerate against a saved game.
- The capture-writer counts the plan cites for `lab_physical_pentest` (20 writers; 16 foothold vs 4 credential) I did not re-count from the scenario file; the body's arithmetic (16+4=20) is self-consistent.
- I accidentally read Appendix A before noticing it was the excluded review history; I did not use it to source any finding above, which come from my own reading of the plan body and the code.
