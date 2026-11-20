Counts: B 0, M 3, m 7, n 3

# Round 7 server and security review

Scope: server, security and the relay, plan body round 7 against the worktree at a6e0dbf54 (no diff from 1ce7486c7 under app/, lib/, public/break_escape/js/ or scripts/, so the plan's line numbers hold).

## What I checked

- Every server reader of the session record, found by grep for `access_sessions`, `player_state['sessions']`, `signedInPcs`, `signed_in_pcs`, `session_identity`, `session_admits?`, `session_route_up?` across app/ and lib/:
  - game.rb:1952 `access_sessions`, :1958 `session_identity`, :1966-1988 `session_admits?` (login_pc, profile, resource), :1991-2009 `scope_admitted_by_session?`, :2039-2061 `login_desktop_contents` and `find_login_item`, :2227 and :2296 the claim checks, :2341-2357 `logout_session!`, :2370-2387 reload, :2390-2406 `sessions_for_client` and `session_for_client`, :2758-2789 `unlock_session_refusal`, :2914-2924 `start_login_session!`, :3733-3736 the `unlock_object` task check.
  - network_access.rb:298 and :392-397 unplug (`end_sessions_through!`), :475-480 implant, :771-844 view blocks and `via_for`, :911-930 `host_row`, :1015-1033 `session_route_up?`, :1061-1073 the reach cache key, :1115-1125 `reach_session_hosts`, :1150-1166 prune, :1183-1202 desktop request and keyboard settle, :1218-1258 `resource_admits_player?`, :1265-1288 `mapped_shares`, :1329-1349 the share helpers.
  - npc_frustration.rb:253-260 `end_guest_session_at!`, :371-387 `record_borrow_done!`; capture_proofs.rb:58-73 and :104-115.
  - games_controller.rb:420-438 bootstrap sessions and the reload end, :577-614 GET /container, :1319-1385 POST /login and GET /login_accounts, :2447-2470 `render_login_desktop`, :2743-2760 desktop adds.
- Item entry paths: games_controller.rb:2523, :2549-2577 `canonical_inventory_item`, :2579-2731 `validate_item_collectible`, :2844-2870 `find_accessible_item`; game.rb:171-185, :464-600 `add_item_to_room!`; item_identity.rb:28-42; the unrouted api/games_controller.rb:1-56.
- Sync and bootstrap: games_controller.rb:811-870, :2027, :2095-2112; game.rb:214-222, :831-853, :1280; state-sync.js:597-640.
- Client readers that consume sign-in events: pc-sessions.js:117-120, :169-205, :402-415; objectives-manager.js:257-273, :331-341; screen-states.js:83; unlock-system.js:260-271, :302-312.
- Routes and policy: config/routes.rb:40, :57; game_policy.rb:53, :89.

## B

None.

## M

### M1. A relay sign-in completes a sign-in objective on the client that the server then refuses

Evidence: plan 3.5 (line 170) and 3.8 (line 204) keep a relay out of `signedInPcs`; K3c (line 543) adds `relay` and `kind` to `pc_signed_in`. objectives-manager.js:332-334 completes an `unlock_object` task on any `pc_signed_in` for that PC, and :268 reconciles it on load from `pcSessions.wasSignedIn`, which pc-sessions.js:410 sets on every sign-in (and :191 on every restored session). The server's task check, game.rb:3733-3736, requires `signed_in_pcs.include?` and answers "Not signed in to this PC". The implant case already has its own exclusion (objectives-manager.js:340, game.rb:3719-3720 comment); the plan names neither reader.

Problem: an author who sets an `unlock_object` task on the invite's `connectsTo` PC gets a task the client marks done and the server refuses, the same split the implant rule was written to avoid. The client's `signedIn` set also drifts from the server's `signedInPcs`, which `firstAtPc` and `pc_in_use.signedInBefore` read.

Fix: add both objective readers and the client `signedIn` mirror to 3.8's list: `_replace` does not add a relay PC to `signedIn`, objectives-manager.js ignores `pc_signed_in` with `relay: true` as it ignores an implant, and the validator warns on an `unlock_object` task whose target is an `assist_invite`'s `connectsTo` (beside the existing `session`-proof warning in 6.3). Test it in K3c's `keyring-client` or objectives test.

### M2. On reload the bootstrap still hands the client the relay session the server is about to end

Evidence: plan 3.8 (line 219) has `session_for_client` report the relay route, and line 221 ends relay sessions in `end_claimed_sessions!`. games_controller.rb:425 builds `sessions` before :437 runs `end_claimed_sessions!`, deliberately, so the client sees each claim and ends it. pc-sessions.js:178-191 `load()` drops only `via === 'claim'`; any other record is kept as held and added to `signedIn`. K3c's client list (8.3) has no load rule for a relay record.

Problem: after a reload with the relay desktop open (R8), the client mirror holds a relay session the server no longer has. K3c's prompt-sync trigger ("while the client holds a relay session") stays armed, the sprite paints locked, and `signedIn` gains the PC (feeding M1's reconcile). R8 would probably still pass, because Connect re-reads `sessionHeld` from GET /keyring and posts again, so the live proof does not catch it.

Fix: either leave relay sessions out of `sessions_for_client` in the bootstrap (the server ends them in the same request), or have `load()` drop a relay record without a POST /logout and without touching `signedIn`. Add a JS test in K3c: `load()` with a relay record leaves no session, no `signedIn` entry and no armed sync trigger.

### M3. K4's `from` route has no server path for the sign-in screen it opens, and unplug never ends an orphaned `from` session

Evidence (screen): plan K4 (line 619) lists `from` for POST /login's credential branch, GET /keyring, the desktop readers, `session_route_up?` and `host_row`. Line 621 has Switch user on a `from` desktop reuse the `from` route and 8.2 step 8 opens the target's sign-in screen on a policy or lockout refusal. K0 gives GET /login_accounts a `foothold` branch only (5.1); without it the action judges by keyboard reach (games_controller.rb:1369-1371). `attempt_login!` reads only `foothold` (game.rb:2141-2161), so a typed password on a `from` screen is judged at the keyboard. 5.2 closes the screen on any 403.

Problem: in Run D the target is HB-FIN-02 in the PIN-locked Finance room, so the `from` screen's GET /login_accounts gets 403 and the screen closes; a typed password there gets 403 too. Where the player does stand in the target's room, the typed sign-in succeeds as a keyboard session with no `from`, a wrong route record.

Evidence (ending): line 620 says prune ends a `from` session whose source is gone, and that "`logout_session!` and `end_claimed_sessions!` already call it". The unplug path, network_access.rb:298 `end_sessions_through!`, ends only sessions carrying that foothold and never prunes; `record_borrow_done!` (npc_frustration.rb:375) deletes a session without pruning too.

Problem: a `from` session whose source was a foothold session survives an unplug. Its route is down, so its desktop is refused, but GET /keyring reports `sessionHeld: true`, so Connect step 5 tries the dead session every time and never reaches step 8. `host_row` still offers it and `reach_session_hosts` still counts it as a pivot.

Fix: K4 adds a `from` branch to GET /login_accounts (the checks of 3.7's `from` row, no post-it) and a `from:` route to `attempt_login!` (recorded on the session; `settle_session_at_keyboard!` must strip it as it strips `foothold`). Unplug and borrow-done call `prune_unreachable_sessions!` and return the pruned ids with `endedPcIds`. Add a K4 test: plant, sign in to HB-FIN-02 with the .rdp, sign in to a third PC `from: lena_pc`, unplug, and both sessions end.

## m

### m1. A `foothold=` desktop request opens a relay session

Evidence: plan 3.8 (line 216) adds record checks for `relay=1` and `from=` and refuses a no-route request at a relay session. The foothold branch of `desktop_request_allowed?` (network_access.rb:1185-1188) refuses only a claim and never compares the param with the session's route.

Problem: GET /container?foothold=<drop box> at `jake_pc` serves the relay desktop. That breaks the invariant that a relay is reached only by Connect, and K2's tests check only the other two params.

Fix: the foothold branch refuses a session carrying `relay`. Add it to 7.3's `desktop_request_allowed?` tests and to the R11 tampered calls.

### m2. A relay Connect replaces the player's own session at that PC without pruning

Evidence: plan 3.8 (line 204) says one slot per PC, replaced by the next sign-in. `start_login_session!` (game.rb:2914-2924) never prunes. Every session, including a password session at `jake_pc`, is a pivot in `reach_session_hosts` (network_access.rb:1115-1125); the relay will not be.

Problem: a player who signed in as Jake at HB-FIN-03 by password and pivoted onward, then Connects the invite, loses the pivot. The onward sessions stay recorded with their routes down until some later logout, and no `endedPcIds` reaches the client.

Fix: refuse a relay sign-in at a PC where the player holds a non-relay session (Connect step 5 then opens that session), or prune after the replacement and return the ended ids.

### m3. The claim checks are relay readers the plan does not name

Evidence: `claim_login_session!` (game.rb:2227) and the guest claim (game.rb:2296) refuse when any session is held at the PC. K3c (line 544) has `openLoginPc` treat a relay record as no session, so the desk rules run.

Problem: at the holder's own keyboard, an owner-away or guest claim is refused while the relay is open, and the player gets the sign-in screen instead of the unlocked desktop the desk rules promise.

Fix: name both checks in 3.8 and decide the rule. Either a claim ends the relay (one screen, one session), or the claim is refused and the client does not offer it while the mirror holds a relay. Test whichever is chosen.

### m4. No test for the implant refusal through a relay

Evidence: plan 3.8 (line 212) changes `implant_foothold!`, whose session shape today accepts any session with a blank foothold (network_access.rb:477-480), and a relay has one. Neither 7.3's tests nor the 7.6 cheat table lists an implant through the relay.

Problem: this is the one reader whose miss would give a real foothold (a lasting pivot) from a shared screen, and nothing would catch a regression.

Fix: add to `credential_sessions_test.rb` an implant at `jake_pc` during the relay, refused with `implant_not_ready`; add a `from` session too, and add a row to 7.6.

### m5. A saved connection delivered by a declared grant or an NPC gift is claimable without the trigger, but 7.6 calls saved connections hard-enforced

Evidence: plan 3.5 (line 165) and 14 (line 823) let a credential item sit in a declared grant or an NPC's `itemsHeld`. games_controller.rb:2634-2643 accepts a declared grant at any time ("no trigger check"); an NPC give checks only that the NPC was encountered (:2694-2706). 6.3's warning (line 376) covers only an `assist_invite` given by a grant.

Problem: 7.6 (line 453) says a saved connection is secret-class with its proof "taken from a room or a desktop through the server's own routes". A saved connection placed in a grant or an NPC's items is claimable from the first second, or as soon as the NPC is met, with no validator line.

Fix: extend the 6.3 warning to every `held` credential delivered by a declared grant, and to a `saved_connection` held by an NPC, or make it an error for `saved_connection`. Reword 7.6 to say the hard enforcement holds only for room and desktop placement.

### m6. A `from` cycle leaves two zombie sessions that prune never ends

Evidence: plan 3.8 (lines 209 and 214) has `session_route_up?` stop a cycle with a visited set and has prune end a `from` session only when its source session is gone. Signing in at A `from: B`, where B's session is itself `from: A`, passes the K2 check (B's route is up through A's old session at that moment), then replaces A's session.

Problem: A and B each have a source session, so prune keeps both, and both routes answer false forever. `host_row` offers them, Connect step 5 sees `sessionHeld` and cannot open them, and reload keeps them (`from` sessions survive reload).

Fix: refuse a `from` sign-in whose source chain passes through the target PC, and have prune end a `from` session whose chain repeats. Add the cycle case to `credential_from_route_test.rb`.

### m7. K3b ships an invite Connect that only K3c can complete

Evidence: K3b's step 8 (line 517) posts relay routes and K3b's find toast tells the player to Connect the code (line 521). The relay desktop mode, `relay=1` params and the relay reader rules arrive only in K3c (8.3). K2's server refuses a no-route desktop request at a relay session (line 216). Jake's gift exists from K1 (9.1).

Problem: between K3b and K3c, in `test_access_keyring`, Connect on the assist code signs in a relay session and then fails to open its desktop. Main is safe, but the scenario is not playable at that beat, and section 1 says it stays playable between slices.

Fix: K3b excludes relay kinds from the tray Connect and the find toast (or does not post relay routes) until K3c.

## n

### n1. The server counterpart of displacement is not cited

Evidence: plan 7.2 (line 434) says "the server counterpart of `displaced` skips a relay session when the NPC sitting down is the account holder". Sitting down ends the player's session through the client (pc-sessions.js:383-392, POST /logout). The only server code that ends a session for an NPC is `record_borrow_done!` (npc_frustration.rb:375), which ends any session at the borrowed PC whoever the borrower is.

Fix: name `record_borrow_done!` and say whether a borrow by the holder keeps the relay, or drop the sentence if there is no server counterpart.

### n2. GET /keyring needs a route and a policy method the file list omits

Evidence: plan 6.2 (line 327) names only the `before_action` list. Each action has an explicit route (config/routes.rb:40, :57) and Pundit method (game_policy.rb:53, :89), and `authorize @game` runs because Pundit is a gem dependency (break_escape.gemspec:17).

Fix: add `get 'keyring'` to config/routes.rb and `keyring?` to game_policy.rb in K1's file list, with the role test Hacktivity expects for a new action.

### n3. The "In file" wait is client-side only

Evidence: plan 8.1 (line 482) holds the "In file" tag until the file is opened, but the K1 answer (6.2, line 335-337) carries the found-password entry with `label` and `foundIn` as soon as the `session: lena_pc` proof holds.

Problem: the find shows in the network panel before the file is opened. That is harmless (no password value is sent) but not stated, while the plan does state the reload gap.

Fix: note it beside the reload gap as accepted.

## Points confirmed sound

- `held` cannot be forged through the paths I traced. An always-allowed `notepad` keeps the client's fields minus `CLIENT_ITEM_FORBIDDEN_FIELDS` (games_controller.rb:2549-2563), so with `credential` in `FORGEABLE_ITEM_FIELDS` it carries none and its type never equals `text_file`. A room add with no source gets a fresh `_cadd_` id and `clientAdded` (game.rb:578-590). NPC drops and player drops store the server's own copy (game.rb:527-529, :545-547). Start items, declared grants, desktop adds and share adds store the server's source object (games_controller.rb:2623-2643, :2565-2577). The unrouted api/games_controller.rb, which stores client hashes, stays unrouted.
- `FORGEABLE_ITEM_FIELDS` is applied only to inbound client hashes (game.rb:613-620, games_controller.rb:2549-2563), so adding `credential` does not strip it from room or desktop answers the client needs.
- The registry does not leak through any answer I found: the bootstrap is built from `filtered_scenario_for_bootstrap` (game.rb:1280) and named player_state keys (games_controller.rb:420-438); `scenario_map` sends room metadata only; no controller renders player_state whole.
- K2's probing rule holds: the proof check (step 2) precedes every specific answer, and nothing in the credential branch touches `loginFailures`. The lockout read (`account_locked_out_at?`, game.rb:2257-2262) has no side effects.
- `capture_secrets_for_client` and `account_capture_usernames` are pure reads (game.rb:1415-1468, network_access.rb:1385), so GET /keyring can stay off `with_game_lock`.
- The relay readers the plan names are the right ones and the cited lines match: `session_route_up?` (network_access.rb:1015), `reach_session_hosts` (:1115) and `view_session_hosts` (:812), `resource_admits_player?` (:1218), `mapped_shares` (:1265, which also covers `share_mapped_at?` and `find_mapped_share_item`), `host_row` (:911), `desktop_request_allowed?` (:1183), `settle_session_at_keyboard!` (:1197), `implant_foothold!` (:475-480), `unlock_session_refusal` (game.rb:2758), `session_for_client` (:2400), `end_claimed_sessions!` (:2370). The profile scope of `session_admits?` (game.rb:1974-1980) admits through a relay, but only what the relay desktop already shows through `admitted_profiles`.
- The sync merge has `player_state` loaded under the row lock (games_controller.rb:819, :2027), so a cached `credentialEndGlobals` check needs no scenario load. Globals merge only on a non-stale request (:2108-2111), and an end global that is already true is caught by the next non-stale sync or bootstrap. state-sync.js:597-620 coalesces forced syncs, so K3c's prompt sync cannot pile up requests.
- Growth is bounded: one session slot per PC, `endedCredentials` and `credentialEndGlobals` capped by the 64-entry registry, server-only, and `endedRelayPcIds` sent once per ended invite.
- `bootstrap_state_needs_write?` (game.rb:831-834) needs the new term exactly as 7.1 says; without it the writer would never run on a game with no other bootstrap work.
