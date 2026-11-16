Counts: B 0, M 0, m 3, n 1

# R12 server, cheat-resistance and state-sync review

Scope: server correctness of the credential keyring plan (docs/achitechture/CREDENTIAL_KEYRING_PLAN.md), weighted to the parts written last: section 10 (K5 tokens), 8.7 (K3d captures), 3.8 and 7 (session readers and the POST /login credential branch), and 9.1's test scenario. Plan body only (no Appendix A, no prior review files). Read-only; nothing run, nothing committed. Worktree base is 372600713, so section 8.7 and 10 line numbers match the tree; sections on 1ce7486c7 (2, 3.8, 7) I checked by function, not by line.

## What I checked

- Every expiry reader K5 names, against the live session readers. `session_route_up?` (network_access.rb:1023) is the gate for `session_admits?` (game.rb:1991, both the login_pc and profile branches, :1999/:2007), `scope_admitted_by_session?` (:2019, :2024), `resource_admits_player?` (network_access.rb:1234, :1269) and so for shares, and `find_login_item`'s located scope (game.rb:2079, gated downstream by `session_admits?` at :2827 and games_controller :599/:612). So adding the expiry predicate to `session_route_up?` alone does cover shares, profiles and the login-pc scope, as the plan claims.
- The four token-clock call sites: the four `gainedFootholds <<` writes are at network_access.rb:265/266 (jack), :370/:371 and :385/:386 (access point), :510/:511 (implant). They match the plan's :265/:370/:385/:510. `record_gained_ap!` (:382) is the :385 site and runs on a second AP of an already-joined network.
- `server_now` (npc_frustration.rb:60), `credentialClock` placement in `ACCESS_STATE_DEFAULTS` (game.rb:1773), and that the bootstrap allow-list (`filtered`, games_controller.rb:312-499) copies only named player_state keys to the client, so `credentialClock`, `endedCredentials` and `credentialEndGlobals` are not sent. Confirmed none is a client-syncable section: PUT /sync_state merges named sections and the server-owned `se_captures` through `record_capture!` (games_controller.rb:815-930; `SERVER_OWNED_GLOBAL_NAMES`, game.rb:1798), so the client cannot write any of the three.
- No GET writes: GET /keyring stays off `with_game_lock`; the no-clock token case reports full `expiresMin` and defers stamping to the next write (section 10), which is consistent with `start_token_clocks!` living only on the foothold-gain writes and POST /login.
- `reach_cache_key` (network_access.rb:1069) today keys on session ids, outages, host-off and lock state (:1071-1083) but nothing clock-derived, so K5's added "expired token ids" term is necessary; `reach_session_hosts` (:1131) is the right skip point to cut an expired token from both the access and structural walks (so prune, which uses `structural_reach`, ends onward sessions).
- `view_session_hosts` (:813), `via_for` (:829), `host_row` (:916), `desktop_request_allowed?` (:1199), `desktop_refusal` (:904), `session_for_client`/`sessions_for_client` (game.rb:2430/:2418), `prune_unreachable_sessions!` (:1166): all present as cited and all read `access_sessions` the way K5 needs.
- K3d join and tag against real data: `account_capture_usernames` join line is network_access.rb:1424 as cited; `account_capture_passwords` (game.rb:1560) is not networks-gated (it reads room NPCs with `creds` and a capture route), so test_capture_log's four captures (addresses c.hampshire/s.lord/m.pierce/n.okafor, non-numeric secrets) join their accounts and tag `password`, giving a Sign-ins-only list as the plan states. `record_capture!` (capture_proofs.rb:138-177) stores only scenario-derived fields via `capture_entry_fields`, so `rowTag` and any client-sent tag are display-only. lab_physical_pentest's `len` PIN (secret 4471, address not an account) tags `pin` under the rule.

The recently-written server design holds up: the one-predicate expiry model is correctly placed, the three new player_state keys are genuinely server-owned and bounded (<=64), no GET writes state, and the capture tag/account join read the server's own record and scenario rather than any client field. Findings below are minor and sit in unbuilt slices.

## Minor

### m1. An unlock refused by an expired token session reports "unreachable", not "expired"
Evidence: `unlock_session_refusal` (game.rb:2840-2871) is not in K5's expiry-reader list (section 10, "one predicate, every reader"). For an expired token session, `session_route_up?` returns false, so line 2861's `pcs.any? { session_route_up? }` does not short-circuit; the token's PC is powered on, so `host_service_off?` at :2866 is false and the branch falls to `reason = 'unreachable'` (:2869).
Repro: a scenario with an `unlock_object` whose scope is a token-session PC; after the token expires, the unlock answers `unreachable` ("...can't be reached over this link") rather than K5's new `expired` reason.
Problem: the access guarantee holds (the unlock is still refused), but the refusal word is wrong, so the stated "every reader of a held session treats an expired token session as gone" is only true for access, not for this message. Not reachable in test_access_keyring (no unlock is gated by the token session there).
Suggested fix: add `unlock_session_refusal` to K5's reader list and return the `expired` reason when `credential_session_expired?` holds for the session at `pc_id`, before the off/unreachable branches.

### m2. The claim guards do not treat an expired token session as not-held
Evidence: the "a session is already held at this PC" guards in `claim_login_session!` and `claim_guest_session!` (game.rb:2255, :2324) test `access_sessions[pc].is_a?(Hash)`. Section 3.8 updates these guards for K2 to treat a *relay* session as not held, but K5 does not extend them to an expired token session, whose record persists until the next write prunes it.
Repro: at a PC where a token session has expired but not yet been pruned, a claim ("owner"/"guest") is refused "a session is already held". A typed sign-in is unaffected (`attempt_login!` has no such guard and `start_login_session!` replaces the slot, :2206), and a fresh credential sign-in replaces it too, so only a claim is blocked.
Problem: the guard's view of liveness diverges from every other reader for an expired token. Not reachable in test_access_keyring (no claimable owner/guest session sits at the token PC), so edge-only, but worth a line in K5.
Suggested fix: have these two guards treat a session that is a relay or an expired token as not-held (the same predicate K5 adds), so a fresh claim replaces the dead record.

### m3. linkDropped carries one batch reason, but a single prune can end sessions for mixed reasons
Evidence: section 8.3 defines `linkDropped(endedPcIds, reason)` with one `reason` for the whole array; section 10 says "a prune that ends one [expired token] answers its PC id in endedPcIds with the reason token_expired". But `prune_unreachable_sessions!` (network_access.rb:1166-1182) returns a flat pc-id list with no per-id reason, and one prune can end a lost-pivot session (`route_ended`) and an expired token session (`token_expired`) in the same call.
Repro: an expired token session that is itself a pivot for an onward session; when the next write prunes, both end in one `endedPcIds`, and the client shows one reason for both.
Problem: the "why your session ended" line would be wrong for one of the two in a mixed prune. Rare, and the plan does not say how the single reason is chosen.
Suggested fix: either return per-id reasons from prune (token_expired vs route_ended) or let the client re-derive the reason per pc from its own keyring/token state; state which in K4/K5.

## Nit

### n1. K3d tag re-derivation needs a field the record drops and a rule for multiple candidates
Evidence: section 8.7 derives the capture tag from `CaptureModel.capture_candidates(scenario, targetId, kind)` at GET /keyring time. Two gaps: the `pin` rule needs the authored `secret` (3-8 digits), but `capture_entry_fields` (capture_model.rb:314) drops `secret`, so the tag code must read the raw writer, not the stored entry or the candidate fields; and a foothold target with both a plain `addCapture` candidate and an overlaid `usePayload` candidate (capture_candidates, :400-446) yields two candidates whose source implies different tags (`finding` vs `foothold`), with no stated rule for which one decides the stored capture's tag.
Problem: implementation ambiguity only; not wrong in the plan's prose, and K3d is unbuilt. Under the recommended D8=D, labs do not reach this in phase 1.
Suggested fix: in K3d, state that the tag reads the raw authored writer for the secret and that when several candidates match a stored capture the one `pick_capture_candidate` would have chosen decides the tag.

## Could not check
- Sections 2, 3.8 and 7 line numbers are on 1ce7486c7; I verified those methods by name/behaviour on 372600713, not by the cited lines. The 8.7 and 10 lines I did confirm against the tree.
- No live run (per scope this is a plan review); the K5 clock/expiry behaviour is argued from the readers, not exercised.
