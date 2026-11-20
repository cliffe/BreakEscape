# Credential keyring K2: code review, round 1

Diff: `8bcfbc85d..080e6777c` on `build/keyring-k2`. Spec: plan 3.7, 3.8, 7 to 7.6; build log K2 runs 2 and 3.

## Verdict: SHIP (B0 M0 m4 t4)

No blocker and no major. The dispatch order, the generic refusal, the relay sink rules, the end check and the server-only keys hold against every row of the 7.6 table I could exercise. The minors are test gaps and one reader that keys the relay rule on the desktop root only. All five K2 test files pass (24, 11, 5, 7, 56 runs, 0 failures).

The review stopped at the context limit before two checks; see "Not checked" at the end.

## Security walk (7.6), what holds

- Registry probe: `provable_connecting_credential` (`credential_login.rb`) answers `credential_login_refusal` for undeclared, unproven, `password`, malformed and non-string ids, and for a missing account NPC; status 422 and one body. Nothing counts: the branch never calls `record_login_failure!`. Step 1 (404) runs before step 2, independent of the id. `credential_proof_holds?` has no side effect, so the only per-id difference is a few in-memory comparisons (t1).
- Forged proof: the `held` proof (K1) refuses `client_forged?` entries and checks type and id against the authored definition. Unchanged here.
- Own keyboard and another PC: no route is the generic refusal (`credential_route_refusal`, `given.length == 1`); another PC is `wrongPc` only after step 2.
- Relay pivot: `reach_session_hosts`, `view_session_hosts`, `resource_admits_player?`, `mapped_shares` (so `share_mapped_at?` and `find_mapped_share_item`), `implant_foothold!` and the `foothold=` desktop branch all skip or refuse a relay. `from` is refused in every reader until K4. `lock_session!` accepts `via == 'password'` only, so a relay can never be locked.
- Revive: `endedCredentials` and `credentialEndGlobals` are not in any named sync section and not in the bootstrap whitelist; grow-only in `apply_credential_end_globals!`.
- Lockout: step 7 runs for `saved_connection` (`honours_lockout`), not for `assist_invite`, as planned.
- `session` proof: `start_login_session!` skips `signedInPcs` for a relay; `capture_proof_holds?` reads `signedInPcs` only.

## Deviations (build log K2 runs 2 and 3)

1. Every replacing sign-in (typed, claim, credential) prunes, and `endedPcIds` appears only when non-empty. **Accept.** 3.8 names all three; typed and claim answers are byte-identical when nothing is pruned (`with_ended_pc_ids`).
2. `reach_cache_key` lists pivoting sessions instead of all session keys. **Accept.** The builder is right that 3.8's "no change" was wrong: a relay replacing a password session at the same PC kept the same key and hit a stale walk. `credential_sessions_test.rb:65` fails on the old key (same game object, same slot).
3. `from` refused everywhere until K4 (generic refusal on login, `false` in `desktop_request_allowed?`, `session_route_up?` false). **Accept.** Fails closed.
4. Step 8 reads `endedCredentials` through `ended_credential?`. **Accept.**
5. Direct map comparison in place of a digest. **Accept.** At most 64 entries; a digest would add a key for nothing.
6. `credentialEndGlobals: {}` in `ACCESS_STATE_DEFAULTS` on every game. **Accept.** The staleness term is false for a scenario with no `endsOnGlobal`, so it never takes the bootstrap lock.
7. The end check runs on a stale sync too. **Accept.** It reads stored globals only, so a stale request that merged nothing ends nothing new.
8. Ending deletes every relay whose credential is ended, not just the newly ended. **Accept.** Only tidies a record step 8 should already have prevented.
9. m3 also checks the password found belongs to the NPC the id names. **Accept.** Stricter than asked, and tested.

## Minors

**m1. The fixed-point test cannot fail, because the loop never runs a second useful round.** `network_access.rb:1260-1282`, `test/models/break_escape/credential_sessions_test.rb:94`.
A pruned session is one whose network is outside `structural_reach`, and `reach_walk_uncached` extends only from session hosts on networks already reached. A session on an unreached network therefore never contributed to the reach, so removing it cannot shrink the reach and the single pass was already a fixed point. The plan's case (a relay replacing a pivot) is handled by the relay skip in `reach_session_hosts`, not by the loop. The test passes on single-pass code. Fix: keep the loop if you like (it costs one extra walk per non-empty prune) but rename the test to what it proves ("a relay is no pivot, so the onward session is pruned and the relay is kept"), or drop the loop and say why in the comment.

**m2. The sync test cannot see a client-writable `endedCredentials`.** `test/controllers/break_escape/sync_end_globals_test.rb:102-116`.
The body sends `endedCredentials: []` together with the end global set true, so even if the merge took the client's empty list, the end check in the same request would add `jake_assist` back and the assertion would still pass. Fix: end the invite first, then sync `{ endedCredentials: [], globalVariables: { END_GLOBAL => false } }` and assert the list still holds `jake_assist` and the relay sign-in still answers `ended`.

**m3. The scenario-load counter misses a whole-row load.** `sync_end_globals_test.rb:34-44` (borrowed from `capture_proofs_test.rb:50`).
It counts only SELECTs that name `"scenario_data"` and skips any with `*`, so a regression that reloaded the full row (`Game.find(id)`, `reload`) inside the end check would read `scenario_data` and count zero. Today a direct `scenario_data` call on the narrow row raises `MissingAttributeError`, which would fail the test, so the realistic regression is caught; the `reload` path is not. Fix: also count `SELECT "break_escape_games".*` queries against the games table inside the block, or assert the request runs exactly the expected number of game-row selects.

**m4. The relay's "never at the holder's keyboard" rule applies to the desktop root only.** `games_controller.rb:629-633` with `game.rb:3094-3098`.
`render_login_desktop` refuses a no-route or `foothold=` request at a relay session, but a folder under `jake_pc` (scope `login_pc`) goes through `session_admits?`, which checks the session, the lock and `session_route_up?` and never the route param. A tampered client at Jake's keyboard (or anywhere) can open a known folder id on the relay desktop with no `relay=1`. It gains no data the relay does not already show and no pivot, so this is consistency, not a leak; the same gap exists today for foothold sessions. Fix: note it in 3.8 as accepted, or pass the request's route into the folder branch and run `desktop_request_allowed?` on the folder's PC first.

## Trivial

**t1.** Step 2 does slightly different in-memory work per id class (pattern, registry lookup, kind, proof). No query and no count differs, so no timing channel worth closing. No action.

**t2.** A typed body carrying `relay: false` is refused (`games_controller.rb:1468`, `params.key?(:relay)`), as the plan words it. K3 client code must omit `relay` rather than send false. Note it in the K3a handover.

**t3.** `desktop_route_params` answers `:conflict` (unreachable) for `relay=0`. Same note for K3c.

**t4.** `session_for_client` reports a credential session's route as `footholdId` or `relay: true`, not the `route` hash the POST answer carries. Both shapes reach the client; K3a should read one. Pick one in the K3a brief.

## Tests against plan 7.3

Present and able to fail on broken code: the byte-identical generic body and nothing counted; each step's refusal; no route; relay on a saved connection; relay on the typed branch; lockout on `saved_connection` but not `assist_invite`; claim and typed replacing a relay; relay replacing a pivot with `endedPcIds`; `credential` with `username` or `claim`; `foothold=` and no-route desktop requests at a relay; GET /keyring with empty routes; relay off; `signedInPcs` unchanged; ended invite stays ended; reload ends a relay and the bootstrap omits it; `host_row`; `session_for_client` after reload; the relay invariant (pivot, share, mapped drives); `reload_ended_session_ids`; `unlock_session_refusal`; settled credential session ends on unplug; bootstrap writer cases; sync end once; sync before bootstrap.

Weak: the fixed-point prune (m1), the client-written `endedCredentials` (m2), the narrow-load count (m3).

Missing: a typed or claim sign-in that replaces a pivot and answers `endedPcIds` (deviation 1 is tested only for the relay). Add one typed case to `credential_login_test.rb`.

## Not checked (context limit)

- Whether `login` is in the `with_game_lock` around-action list (`games_controller.rb:103`); if it is not, a credential sign-in races a concurrent sync as the typed sign-in already does. Worth one grep in round 2.
- The full Rails suite was not rerun; the builder reports 2988 runs, 0 failures at `93e7797fa`.
