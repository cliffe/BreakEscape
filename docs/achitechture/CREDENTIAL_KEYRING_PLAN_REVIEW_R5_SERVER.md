Counts: B 0, M 2, m 1, n 1

## What I checked

Read the plan (sections 1 to 14; not Appendix A, no other review file). Checked every load-bearing server claim against the worktree on branch plan/keyring (contains main 1ce7486c7).

- Proof forgery: `ItemIdentity::FORGEABLE_ITEM_FIELDS` (item_identity.rb:28), `client_forged?` (item_identity.rb:40), `same_item?` name fallback (item_identity.rb:63), `canonical_inventory_item` and `CLIENT_ITEM_FORBIDDEN_FIELDS`/`ALWAYS_ALLOWED_ITEMS` (games_controller.rb:2523, 2549, 2560), the grant-source path (games_controller.rb:2566), `capture_proof_holds?` (capture_proofs.rb:58), `account_capture_served?` and the `signedInPcs` session proof (capture_proofs.rb:69, 104), `find_login_item` scope (game.rb:2051), declared grants (game.rb:3443).
- Registry leaks: `filtered_scenario_for_bootstrap` strip list (game.rb:1280 to 1370), `capture_secrets_for_client` gating (game.rb:1415), policies shipping as authored.
- Route forgery and the relay invariant: `attempt_login!` (game.rb:2141), the controller `login` dispatch under `with_game_lock` (games_controller.rb:97 to 98, 1320), every reader of `access_sessions` in network_access.rb and game.rb (`session_route_up?` 1015, `reach_session_hosts` 1115, `resource_admits_player?` 1218, `mapped_shares` 1265, `host_row` 911, `view_session_hosts` 812, `via_for` 833, `network_blocks` 781, `down_blocks` 795, `desktop_request_allowed?`/`desktop_refusal` 1183/895, `settle_session_at_keyboard!` 1197, `session_admits?`/`scope_admitted_by_session?` game.rb:1966/2002, `session_for_client`/`sessions_for_client` game.rb:2390/2400, `unlock_session_refusal` game.rb:2758, `start_login_session!` game.rb:2914, `end_claimed_sessions!`/`claimed_session_ids` game.rb:2370, the server displacement in `record_borrow_done!` npc_frustration.rb:374), `render_login_desktop`/`container` threading (games_controller.rb:577, 2447).
- End-of-invite on sync: `SYNC_STATE_COLUMNS` has no `scenario_data` (games_controller.rb:2027), `merge_global_variables!` runs on the narrow load (game.rb:332), bootstrap writer gate `bootstrap_state_needs_write?`/`run_bootstrap_writers!`/`prepare_bootstrap_state!` (game.rb:831, 839, 214).
- Check order, generic refusal, lockout counting and messages (game.rb:1810 to 1813, 2850, 2867, `account_locked_out_at?` 2257).
- Validator hooks: `known_top_level` (validate_scenario.rb:730), `known_item_fields` (846), the `check_*` precedent `check_lock_credentials` (2199).
- Format: `FormatUpgrade.current` is 1 (format_upgrade.rb:48, 59, 76).
- Client contract touch points: `screen-states.js:83`.

Sound as written: the bootstrap strip point, the `held` identity-strict match (server copy stored via `source.deep_dup`, `credential` stripped from always-allowed and room adds through `FORGEABLE_ITEM_FIELDS`), the `session` proof via `signedInPcs` (a relay never recorded there), the registry never shipped, the GET /keyring password gate equal to GET /capture_secrets, the POST /login check order gating registry answers behind the proof, lockout counting (only typed passwords), the `with_game_lock` cover on POST /login, the narrow sync load for the end-invite merge, the bootstrap writer gate, the additive-fields-only format claim, the ink-gift (not declared-grant) route for the assist code. No blocker found.

## B (blocker)

None.

## M (major)

### M1. The relay invariant's reader list in 3.8 misses `view_session_hosts` and the network-view block builders

Evidence: plan line 34 ("A relay session ... is not listed in the network view"), line 188 ("Section 3.8 names every reader that enforces it"), line 198 (3.8 names only `reach_session_hosts` for the reach walk), line 793 (section 14 repeats "not in the network view"). Code: `view_session_hosts` enumerates every session with no relay test (network_access.rb:812 to 824); it feeds `via_for` (network_access.rb:833, `access_sessions[best[:host_id]]` labels the bridge), `network_blocks` (network_access.rb:781, `session_hosts = view_session_hosts`) and `down_blocks` (network_access.rb:795). `reach_session_hosts` (network_access.rb:1115) is a separate near-duplicate function; excluding relay from it alone (the only reach-walk reader 3.8 names) does not touch the view builders.

Problem: the plan asserts the invariant and asserts that 3.8 names every reader that enforces it, but `view_session_hosts` is a reader of `access_sessions` that includes a relay session and drives the network view. A relay session at a host on a network that is linked to a network the player genuinely reaches is eligible to be chosen as that network's bridge label (`via_for` picks by lowest `seq` then host id), so the view can read "via {displayName}" sourced from the relay host, and a relay-session network that falls out of `player_reach` is eligible for a `down_blocks` row. A builder following the 3.8 list would leave both paths naming the relay session in the view, contradicting the stated invariant. (The actual reach set is still correct, since `player_reach` is built from `reach_session_hosts` with relay excluded, so this is a display and invariant-truth defect, not a reach escalation.)

Fix: add `view_session_hosts` to the K2 relay-exclusion set (skip a session carrying `relay`), matching `reach_session_hosts`, and name it in 3.8 alongside the others; or state why the view labels may name a relay.

### M2. The UI slice 6 `locked` session flag is treated as a settled prerequisite, but it is neither built nor decided in this tree

Evidence: plan line 57 (section 2: "UI slice 6 (PC start panel, q93 option C) adds a server-side boolean `locked` to the held-session record ... This plan builds on that flag"), line 192 (3.8 session record lists `locked?`), line 194 ("`locked` is UI slice 6's flag ... locks and unlocks through slice 6's one predicate ... The `locked` delta in the sessions answer covers credential sessions"), line 425 (7.3 test "a credential session locks and unlocks through slice 6's predicate with the account's password, counted"). Code: no session-level `locked` flag or lock/unlock predicate exists anywhere on main 1ce7486c7. The session record is written as `{ 'id', 'via', 'foothold'? }` only (game.rb:2918 to 2919); `start_login_session!` writes no `locked`. A grep for a session lock predicate, a `locked` delta, or the slice-6 "start panel"/q93 work finds nothing in app/, lib/ or public/break_escape/js/. UX_FEEDBACK_ROUND_PLAN.md:334 shows q93 is still an open decision that itself asks "If C, do you want Lock (new server state)?", and line 224 lists slice 6 as "Can start now: nothing."

Problem: K2's base is "main after K1" (plan line 390) and nothing gates K2 on slice 6, yet K2's session-record shape, its "locked delta covers credential sessions" claim, and the 7.3 lock/unlock test all depend on a field and a predicate that do not exist and are not yet decided to exist. A builder taking K2 at face value would either find no `locked` to carry or invent a flag the plan says it must not reshape, and the 7.3 test is unbuildable on main after K1.

Fix: list slice 6 (and the q93 option C plus Lock decision) as an explicit merge prerequisite for the `locked` parts of K2, or make the `locked` field and the 7.3 lock/unlock test conditional and drop them when slice 6 does not ship a session Lock. The credential flow itself does not need `locked`, so only the lock-related lines need the gate.

## m (minor)

### m1. The K4 `from` route's `session_route_up?` recursion has no cycle or depth guard

Evidence: plan line 185 (3.7 `from` row), line 197 (3.8: a `from` session is up only if "the source's own `session_route_up?` holds"), line 201 (prune "iterate to a fixed point"). Code: `session_route_up?` (network_access.rb:1015) currently has no recursion; the plan adds a branch that calls `session_route_up?` on the source PC.

Problem: two mutually-`from` sessions (session at P1 with `from: P2`, session at P2 with `from: P1`) make the added branch recurse P1 to P2 to P1 without bound, and `prune_unreachable_sessions!`'s new fixpoint can revisit the same pair. The pair is constructible once both sessions exist: open a foothold session at P1, Connect a saved connection to P2 with `from: P1`, then from P2 Connect a saved connection back to P1 with `from: P2` (which replaces P1's record). It is not reachable in `test_access_keyring` (the only second connecting PC, `ops_pc`, is `pw_only` and refuses a saved connection, plan line 615), so no test would catch it, but the engine change ships for every scenario.

Fix: carry a visited-set or a small depth cap through the `from` branch of `session_route_up?` (and the prune fixpoint) and treat a cycle as off-route.

## n (nit)

### n1. The credential refusal bodies diverge from the established login refusal shapes

Evidence: plan line 396 (step 2 generic refusal `{ success: false, message: "Incorrect username or password" }`), line 401 (step 7 lockout `LOGIN_LOCKED_OUT and lockout: true`). Code: the typed-password refusal is `{ success: false, message: LOGIN_INCORRECT, attemptsLeft: ... }` (game.rb:2888) and the lockout answer is `{ success: false, message: LOGIN_LOCKED_OUT, lockedOut: true, attemptsLeft: 0 }` (game.rb:2850 to 2852).

Problem: the plan's generic credential refusal omits `attemptsLeft`, and its lockout answer invents `lockout: true` where the existing answer uses `lockedOut: true`. The registry-probe property is not affected (all registry-refusal cases share one body), but a parallel field name and shape for the same concept risks the K3 client being wired to `lockout` while the password path uses `lockedOut`.

Fix: reuse `lockedOut` and the existing refusal shape for the credential branch, or note in 7 why a distinct field is intended so K3 reads the right one.
