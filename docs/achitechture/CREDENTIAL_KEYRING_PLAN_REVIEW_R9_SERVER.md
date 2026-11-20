Counts: B 0, M 2, m 5, n 3

# Round 9 server and security review

Scope: the plan's server, security and relay design, checked against the worktree `p-keyring-plan` (branch plan/keyring, which contains main 48b755b81) and, for the session lock, against 20a8a83a7 read through `git diff`. Plan line numbers are those of the review copy of the plan body.

## What I checked

- Every server reader of the session record: `access_sessions`, `session_identity`, `session_admits?`, `scope_admitted_by_session?` (`game.rb:1951-2010`); `login_desktop_contents`, `find_login_item` (`game.rb:2034-2060`); `attempt_login!`, `claim_login_session!`, `claim_guest_session!`, `logout_session!`, `end_claimed_sessions!`, `claimed_session_ids`, `sessions_for_client`, `session_for_client`, `signed_in_pcs` (`game.rb:2133-2412`); `unlock_scope_refused?`, `unlock_session_refusal` (`game.rb:2740-2792`); `start_login_session!`, `login_session_answer` (`game.rb:2914-2935`); the `unlock_object` task check (`game.rb:3734`).
- `network_access.rb`: `end_sessions_through!` (`:390-396`), `implant_foothold!` (`:452-525`), `network_blocks`, `down_blocks`, `view_session_hosts`, `via_for` (`:765-840`), `desktop_refusal`, `host_row` (`:890-941`), `session_route_up?` (`:1015-1033`), `reach_walk`, `reach_cache_key`, `reach_walk_uncached`, `reach_session_hosts`, `networks_reachable_from` (`:1050-1145`), `prune_unreachable_sessions!` (`:1150-1166`), `host_reachable_through?`, `desktop_request_allowed?`, `settle_session_at_keyboard!` (`:1168-1203`), `resource_admits_player?`, `mapped_shares` (`:1218-1288`), `find_mapped_share_item`, `share_mapped_at?`, `resource_item_for_add` (`:1328-1380`).
- `npc_frustration.rb`: `record_borrow_done!` (`:363-385`), `end_guest_session_at!` (`:253-259`); `capture_proofs.rb:69` (the `session` proof reads `signedInPcs`).
- `games_controller.rb`: bootstrap answer (`:420-440`, `prepare_bootstrap_state!` at `:288`), `container` (`:577-625`), `login` and `logout` (`:1320-1358`), `login_accounts` (`:1363-1380`), `network` (`:1487-1492`), `inventory` add (`:1207-1262`), `sync_state` and `merge_last_write_wins_sections` (`:811-880`, `:2098-2115`), `SYNC_STATE_COLUMNS` (`:2027`), `render_login_desktop` (`:2447-2470`), `canonical_inventory_item` and `validate_item_collectible` (`:2523-2725`), `validate_login_item_collectible` (`:2741-2770`).
- `game.rb` bootstrap writers: `prepare_bootstrap_state!` (`:214-222`), `bootstrap_state_needs_write?`, `run_bootstrap_writers!` (`:831-858`); `add_item_to_room!` and `strip_forgeable_lock_fields` (`:464-625`); `add_inventory_item!` (`:171-185`); server-side global writers (`npc_frustration.rb:432-443`, `game.rb:5383-5404`).
- `lib/break_escape/item_identity.rb:20-80` (`FORGEABLE_ITEM_FIELDS`, `client_forged?`, `same_item?`).
- Slice 6 server diff (20a8a83a7 against HEAD): `session_identity`, `session_locked?`, `lock_session!`, the reach walk skip and cache key, `via_for` and `host_row` marks, `resource_admits_player?` skip; and its client change in `unlock-system.js` (a locked session opens the sign-in screen with the account pre-chosen).
- Client: `pc-sessions.js` (`load`, `displaced` at `:383-393`, `signOut` at `:429-435`, `linkDropped` at `:460`), `state-sync.js:640-662` (sync answer handling).
- Scenarios, networks only: `lab_physical_pentest` (`office_lan` only, LW-DOOR01 headless at `:2303-2310`, the drop box capture at `:858`), `test_access_networks` (`office_lan` linked to `server_net`, `:11-18`).

## B

None.

## M

### M1. The `from` route widens reach in every networks scenario, not only those with credentials

Evidence: plan line 197 (the `from` row: target "network is in `networks_reachable_from(network of pcId)`"), line 635 ("the typed `attempt_login!` takes a `from:` route recorded on the session", and GET /login_accounts gains a `from` branch), line 641 ("reach is the walk mapped shares already use"), line 716 (9.2: K3a to K4 change "Only scenarios that declare `credentials`"). Code: `networks_reachable_from` (`network_access.rb:1121-1136`) is a plain breadth-first walk over up links with no session needed on any network in between; the foothold route's `host_reachable_through?` (`:1171-1177`) uses `player_reach`, whose walk (`reach_walk_uncached`, `:1081-1112`) crosses a link only from a network on which the player holds a session. `attempt_login!` (`game.rb:2141-2182`) has no gate on the scenario declaring `credentials`.

Problem: two separate effects.
1. Reach: a keyboard session at a PC on network A lets a `from` sign-in reach any host on any network transitively linked from A, with no pivot session on the networks between. A foothold on A reaches only A plus networks linked from networks where a session is held. So a `from` session out-reaches a drop box on the same network, which inverts the lesson of the pivot walk.
2. Scope: the typed `from` branch and the `from` branch of GET /login_accounts are server code that answers in every networks scenario. In `lab_physical_pentest` a tampered client holding a keyboard session at the hot desk or LW-OPEN-07 can POST /login `{ pc_id: <LW-DOOR01's id>, username, password, from: hot_desk_pc }` and sign in to the headless door controller without planting the drop box (the lab's own capture text at `scenario.json.erb:858` says "through the drop box"). In `test_access_networks`, a keyboard session at Sam's PC reaches `server_net` hosts with no drop box and no pivot. Section 9.2 tells the builder that shipped scenarios are unchanged by K4, so nobody would test either.

Fix: in K4, (a) judge the `from` target by a reach walk seeded from the source PC's network that applies the same pivot rule as `reach_walk` (a link is crossed only from a network on which a non-relay session is held), not by `networks_reachable_from`; and (b) answer the typed `from` branch and the `from` branch of GET /login_accounts only in a scenario that declares `credentials` (the generic refusal elsewhere), or say in 9.2 that K4 changes what a tampered client can reach in the two networks scenarios and add a tampered-client check for LW-DOOR01 from the hot desk to K4's live proof. Add a K4 test: a keyboard session on `office_lan` with no session on `server_net` cannot `from`-sign-in to a host on a network two links away.

### M2. K-lock either strands the player at a saved-connection session or contradicts its own "no credential-based unlock" rule

Evidence: plan line 624 ("K-lock widens that rule to a `via: "credential"` session with `foothold` or `from` ... the account's password unlocks it ... No credential-based unlock: a saved connection does not unlock a locked screen"), line 625 (test "the .rdp does not unlock"), line 664 (Lena's account is entered only by `lena_rdp`; the test scenario never gives Lena's password), line 660 (the Finance PIN is in `door_code.txt` on Lena's desktop). Code on 20a8a83a7: `lock_session!` refuses any session that is not `via == 'password'` because "the password re-auth that is the only way back in could never clear it and the player would be stranded" (game.rb in that diff, `lock_session!`); a locked session opens the sign-in screen with the account pre-chosen (`unlock-system.js` in that diff). On main, `start_login_session!` (`game.rb:2914-2924`) overwrites the slot with a fresh record and so drops `locked`; the K2 credential branch (plan lines 418-428) has no check for a locked session at the PC.

Problem: a player who locks the .rdp session on HB-FIN-02 does not have Lena's password, which is the case slice 6 refused for claims. If K-lock holds to "the .rdp does not unlock", the only way back in is a password the scenario never gives, and before R2's `door_code.txt` read the run cannot finish. If it does not, then the K3a sign-in screen (Lena pre-chosen, "Connect with HB-FIN-02.rdp" on her line) posts the credential, K2 accepts it, and `start_login_session!` replaces the locked record. That is a credential-based unlock, and K-lock's named test fails. Either way the builder builds something the plan says it is not.

Fix: pick one and write it down. Recommended: a credential session is unlocked by a fresh sign-in with the same credential (the K2 branch already does this by replacing the record), so drop "No credential-based unlock" and change the test to "the .rdp re-signs in and the new record carries no `locked`". Connect step 5 (`sessionHeld`) must then sign in again rather than open the locked desktop. Otherwise, leave slice 6's 422 for credential sessions and drop K-lock.

## m

### m1. Connect on an assist invite silently replaces a stronger session at the holder's PC

Evidence: plan lines 359 (`sessionHeld` is true only for a session "opened with this credential"), 529 (step 8 posts when no session with this credential is held), 649 ("Typing Jake's password at his own keyboard stays possible"), 216 (a relay replacing a pivot prunes). Code: `start_login_session!` (`game.rb:2914-2924`) replaces whatever is in the slot.

Problem: in honest play the player can type Jake's password at HB-FIN-03's keyboard (a password session, a pivot, in `signedInPcs`) and later press Connect on the code. `sessionHeld` is false, so Connect posts the relay sign-in, which replaces the password session with a sink and prunes every onward session that pivoted through it. Nothing tells the player why `server_lan` vanished.

Fix: in step 2 of 7 (or a new step before 9), when the PC holds a non-relay session for the same account, answer it as `sessionHeld` (open that desktop) or refuse with a short reason; GET /keyring's `sessionHeld` reports a session for the same account at `connectsTo`, not only one opened with this credential. Add a K2 test.

### m2. The claim-guard change is listed under K3c but tested in K2

Evidence: plan line 231 (under "Client readers", prefixed "K3c": "On the server the claim guards that refuse while a session is held (`game.rb:2227`, `:2296`) and the typed `attempt_login!` treat a relay session as not held"); line 445 (7.2's list of K2 server changes does not name the claim guards); line 449 (K2 test: "a claim and a typed sign-in at `jake_pc` while the relay is held succeed and replace it"). Code: `claim_login_session!` and `claim_guest_session!` refuse at `game.rb:2227` and `:2296` whenever any session Hash is held.

Problem: a K2 builder following 7.2 leaves the guards alone and the named K2 test fails; one following 3.8's K3c tag ships K2 with a server where a tampered relay blocks the honest claim at Jake's keyboard until K3c.

Fix: move the server half of that bullet into 3.8's server list and 7.2's list (K2), leaving `heldAtKeyboard` and the click path in K3c.

### m3. `endedRelayPcIds` is sent at most once, so a lost sync answer leaves a zombie relay desktop

Evidence: plan lines 437-438 ("each (PC, credential) pair is sent at most once; the client applies it idempotently"), 558 (the relay desktop closes on `endedRelayPcIds`). Code: `sync_state` (`games_controller.rb:811-880`) commits before answering; `state-sync.js:640-662` resends the same changes when a request fails, and the second merge finds `endedCredentials` already holding the id and the relay session already gone, so the list is empty.

Problem: if the answer to the ending sync is lost after the commit (a dropped connection), the client keeps the relay in its mirror and the desktop stays open. Every later request under it is refused as no session, with no "ended the remote assist" line. Idempotent handling does not help when the ids are never sent again.

Fix: compute the list from state, not from the merge: while the sync body (or a small client flag) says the client holds a relay at a PC and the server holds none there, answer that PC in `endedRelayPcIds`. A simpler alternative is to have `systems/keyring.js` treat a GET /keyring entry with `ended: true` (or `sessionHeld: false` while the mirror holds a relay for it) as the end signal, since K3b already asks GET /keyring after events. Add the lost-answer case to `sync_end_globals_test.rb`.

### m4. A locked session can be a `from` source

Evidence: plan line 197 (source: "carries no `relay` and whose route is up, and `pcId` is on"), line 209 (`from` up-check), line 211 (the slice 6 note covers only the reach walk). Code on 20a8a83a7: `session_identity` answers nil for a locked session and `reach_walk_uncached` skips a locked pivot (`next if !ignore_outages && session_locked_at?(host[:pc_id])`), but `session_route_up?` itself does not test `locked`.

Problem: K4 lands after K3c, and slice 6 will almost certainly be on main by then. A `from` source check written to 3.7's words accepts a locked session at the source PC, and a live `from` session stays up after its source is locked. Slice 6's rule is that a locked session admits nothing and extends no reach.

Fix: add "and not locked (once slice 6 is on main)" to the `from` source check in 3.7, to the `from` branch of `session_route_up?` in 3.8, and to GET /keyring's `from` routes; extend 3.8's "whichever lands second" note to cover these, with a K4 test.

### m5. `settle_session_at_keyboard!` runs on every request without a foothold, including `relay=1` and `from=`

Evidence: plan line 218 (the desktop functions take a route argument), line 220 (settle leaves credential sessions alone), line 635 ("`settle_session_at_keyboard!` strips `from` from a password session as it strips `foothold`"). Code: `render_login_desktop` calls `@game.settle_session_at_keyboard!(pc['id']) if foothold.nil?` (`games_controller.rb:2466`).

Problem: if the guard stays `foothold.nil?`, a typed `from` password session (K4) is settled, and loses `from`, the first time its own `from=` desktop is opened. It then counts as a local session, is never pruned when its source ends and outlives its route, which is exactly what K4's prune work exists to prevent. Credential sessions escape only because 3.8 makes settle a no-op for them.

Fix: say in 3.8 and K4 that settle runs only when the request carries no route param at all (no `foothold`, `from` or `relay`), and add a K4 test: open a typed `from` session's desktop by `from=`, sign out at the source, and the session ends.

## n

### n1. Bodies and requests that carry more than one route field are undefined

Evidence: plan lines 418, 423, 218, 334. POST /login, GET /container and GET /keyring each take `foothold`, `from` and `relay`, and the plan never says what two at once mean. "The session at that PC must carry that same route field" (line 218) also leaves open whether `from=X` must equal the record's `from`.

Fix: one line in 3.8: a request with more than one route field gets the generic refusal (POST /login) or 403 unreachable (desktop); a `from=` request must name the record's own source PC.

### n2. "Keeps claim first ... gets the claim branch's generic refusal" needs new code

Evidence: plan line 418; code `games_controller.rb:1329-1342` and `claim_login_session!` (`game.rb:2213`), which ignore an extra `credential` param and can succeed.

Fix: say that the claim branch gains a check that refuses a body also carrying `credential`, `foothold` aside, before calling the model, so the 7.3 test does not read as already passing.

### n3. What a `relay` param on GET /keyring may open is not defined

Evidence: plan lines 361-362 ("A `pc_id` the player cannot open a screen for (by keyboard, or the named route) is ignored").

Fix: say that `relay=1` counts only when the server holds a relay session at `pc_id`; it never names a screen otherwise (no relay sign-in screen exists).

## Points confirmed sound

- The relay invariant covers every reach and share reader on main: `reach_session_hosts` feeds `structural_reach`, `player_reach`, prune and the view; `view_session_hosts` feeds `network_blocks`, `down_blocks` and `via_for`; `mapped_shares` is the only source for `mapped_share_stubs`, `find_mapped_share_item` and `share_mapped_at?`; `resource_admits_player?` is the only gate for GET /container on a share and for `resource_item_for_add`. The network view takes a foothold only (`games_controller.rb:1487-1492`), so no session-based view exists for a relay to feed.
- `implant_foothold!`'s session shape (`network_access.rb:476-479`) tests only a blank foothold, so refusing `relay` and `from` there is needed and correctly named.
- Profiles opened under a relay identity (`session_admits?` profile scope, `game.rb:1974-1980`) show only what Jake's own desktop shows; they are no network route, so leaving them on the relay desktop does not break the invariant.
- `held` cannot be forged: `canonical_inventory_item` stores the server's own copy for every sourced add (`games_controller.rb:2560-2578`), sync never writes the inventory, an unsourced room add is restamped with a fresh id and `clientAdded` (`game.rb:571-585`), and adding `credential` to `FORGEABLE_ITEM_FIELDS` strips it from notepads and room adds through both lists.
- The NPC give of the assist code needs `encounteredNPCs`, which only GET /room writes (`games_controller.rb:2255-2289`), so the code needs Finance opened; the 7.6 "time saved only" judgement holds.
- POST /login dispatch puts the proof check before every specific answer (wrong PC, policy, lockout, ended), so the browser cannot probe the registry, and a registry or implicit `password` id gets the same generic body.
- `endedCredentials` and `credentialEndGlobals` stay server-only: the bootstrap answer is an allow-list (`games_controller.rb:395-440`) and `player_state` is never sent whole. The sync load includes `player_state` (`SYNC_STATE_COLUMNS`), so the merge can write both keys and delete relay sessions without `scenario_data`.
- The bootstrap needs the new `bootstrap_state_needs_write?` term: without it `run_bootstrap_writers!` (`game.rb:839`) never runs on a game with no other repair.
- Reload ending relays: `sessions_for_client` runs before `end_claimed_sessions!` (`games_controller.rb:425`, `:437`), so leaving relays out of that answer is the right place, and `end_claimed_sessions!` reloads under `with_lock`.
- Sync size: the session record gains bounded fields in the one slot per PC and is sent only at bootstrap and in single-PC answers; `endedRelayPcIds` is an occasional delta; GET /keyring is a read with a `rev` short-circuit. Nothing re-sent on each sync grows.
- K4's prune additions are needed: `end_sessions_through!` (`network_access.rb:390-396`) and `record_borrow_done!` (`npc_frustration.rb:375`) end sessions without pruning today, and `displaced` ignores its POST /logout answer (`pc-sessions.js:392`).
- K0's GET /login_accounts foothold branch keeps the keyboard answer byte-identical and never serves the sticky note through a foothold.
- The plan's line citations match the worktree for every reader I checked (`game.rb:2141`, `:2227`, `:2296`, `:2400`, `:2914`; `network_access.rb:475-479`, `:1015`, `:1150`, `:1185-1188`; `games_controller.rb:1320`, `:2447`).
