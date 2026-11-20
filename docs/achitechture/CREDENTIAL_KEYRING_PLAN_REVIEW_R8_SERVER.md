Counts: B 0, M 1, m 10, n 3

# Round 8 server and security review

Scope: server, security and the relay, checked against branch plan/keyring (worktree p-keyring-plan, head 6067cae1a). Line numbers below are from that tree; every plan line number cited in section 2 and 3.8 matched within a line or two.

## What I checked

- Every server reader of the session record: `access_sessions` and `player_state['sessions']` in `game.rb` (1952, 1958, 1965-1987, 1991-2009, 2227, 2296, 2341-2360, 2370-2387, 2390-2406, 2758-2789, 2914-2924), `network_access.rb` (392-396, 475-479, 772-840, 911-939, 1015-1033, 1115-1126, 1150-1166, 1183-1203, 1218-1258, 1265-1288, 1330-1348), `npc_frustration.rb:372-387`, `games_controller.rb:425-439, 595-612, 2447-2470, 2744-2770`.
- Every reader of `signedInPcs`: `capture_proofs.rb:69`, `game.rb:2408-2411, 3733-3736`, `games_controller.rb:426`.
- Client readers: `systems/pc-sessions.js` (138-150, 170-200, 383-395, 460-470, 489-497), `systems/unlock-system.js` (260-272, 315-322, 454-500, 615-628, 665-704), `systems/network-links.js` (117, 657-708), `minigames/container/container-minigame.js` (21-27, 55-62, 105-113, 945-965, 1940-1952), `minigames/capture-log/capture-log-model.js:60-115`, `systems/workstation-state.js:215-223`, `systems/objectives-manager.js:255-275, 328-342`, `systems/screen-states.js:83`, `minigames/network-view/network-view-minigame.js:164`.
- Inventory and forgery: `games_controller.rb:2523-2700` (always-allowed, decor cups, start items, declared grants, NPC gives, `canonical_inventory_item`), `find_accessible_item` (2844-2930), `game.rb:464-600` (`add_item_to_room!`, the player-drop and unsourced branches), `lib/break_escape/item_identity.rb:28-42`.
- POST /login dispatch and checks (`games_controller.rb:1320-1342`, `game.rb:2141-2181`), GET /login_accounts (1363-1388), GET /capture_secrets (1568-1580), sync (`games_controller.rb:811-880, 2027, 2098-2200`), bootstrap gate (`game.rb:214-222, 831-850`), server-side global writers (`game.rb:5385-5405`, `npc_frustration.rb:433, 443`, the unrouted `api/games_controller.rb:11-25`), `GamePolicy` and `config/routes.rb`.

## B

None.

## M

### M1. The world click at the holder's PC goes through `interactLoginPc`, not `openLoginPc`

Evidence: plan 3.8 line 229 and 8.3 line 552 ("K3c: `openLoginPc` (`unlock-system.js:260`) treats a relay record as no session"); plan line 66 calls `openLoginPc` "the keyboard screen". In code, a click on a sign-in PC sprite calls `window.interactLoginPc` (`systems/interactions.js:925-928`), and `interactLoginPc` (`unlock-system.js:454-485`) opens the desktop on `sessions?.has?.(pcId)` at line 482 before any workstation or sign-in logic. `openLoginPc` is reached only from `handleUnlock` (`unlock-system.js:700-704`). The keyboard sign-in screen also reads the record directly: `current: sessions?.get?.(pcId)` (line 618) and `onComplete` opens the desktop on `sessions?.has?.(pcId)` (line 624). On the server, an owner or guest claim is refused while any session is held there (`game.rb:2227`, `game.rb:2296`).

Problem: with the plan as written, K3c changes `openLoginPc` and the unit test in `access-remote-signin.test.mjs` passes, while the real click at HB-FIN-03 still finds the relay in `pcSessions`, asks for the desktop with no route, and gets the server's new refusal instead of the sign-in screen. If the record is hidden only in `openLoginPc`, the keyboard screen still shows the relay as "Signed in now" (line 618), and the desk rules' owner claim at an unlocked, unattended screen is refused by `game.rb:2227` while the relay is held. R6's live beat would catch the click, but only after the slice is built against the wrong function.

Fix: put the rule in one place that every keyboard reader uses: for example `pcSessions.has(pcId)` and `get(pcId)` answer as if there were no session for a relay record unless the caller asks for relay records explicitly (Connect, the relay desktop, `endedRelayPcIds`). Name `interactLoginPc` (`unlock-system.js:482`) and the keyboard screen's `current` and `onComplete` (618, 624) in 3.8 and K3c. Say what the claim branch does while a relay is held (refuse as today, so the sign-in screen opens, or end the relay first). The JS test drives `interactLoginPc`, not `openLoginPc`.

## m

### m1. The foothold branch of the desktop check still admits a relay record

Evidence: plan 3.8 line 216 adds `relay=1` and `from=` branches and refuses a no-route request at a relay session. The foothold branch of `desktop_request_allowed?` (`network_access.rb:1185-1188`) checks reach, policy, power and only `via == 'claim'`; it never calls `session_route_up?` and never reads the record's route.

Problem: GET /container `jake_pc?foothold=<drop box>` with a relay held at `jake_pc` is served through the foothold branch, so the relay desktop is reached by a route other than Connect, and the plan's own rule ("a param the record does not carry is refused") is not applied to the foothold param. Content is the same Jake desktop, so this is a rule break and a test gap rather than a pivot.

Fix: in the foothold branch, refuse when the record carries `relay` (and, from K4, decide whether a `from` record may be opened over a foothold). Add the case to 7.3 and to R11.

### m2. A relay sign-in can replace a pivot or a `from` source without pruning

Evidence: `start_login_session!` (`game.rb:2914-2924`) overwrites the slot with no prune, and plan 7.1 says a relay "is never a `from` source, so no session chains off it and no pruning is needed". POST /login with `relay` does not check what the slot held before (plan 7, steps 1-9). `reach_session_hosts` (`network_access.rb:1115`) is what makes a session a pivot, and the plan's change removes relay sessions from it. Plan 3.8 line 214 prunes a `from` session only "whose source session is gone".

Problem: if the player holds a password session at `jake_pc` that pivots to `server_lan`, then Connects the invite, the slot becomes a relay. The onward sessions through that pivot lose their route but are never pruned until some later logout or unplug, so the view lists them, GET /keyring reports `sessionHeld`, and Connect's step 5 opens a desktop the server refuses. A K4 `from` session whose source slot becomes a relay is down but not "gone", so it is never pruned either.

Fix: run `prune_unreachable_sessions!` after every sign-in that replaces an existing session, and return the ended ids in the login answer for `linkDropped`. Have prune also end a `from` session whose source record carries `relay`.

### m3. K4 `from` cycles are stopped in the walk but never ended

Evidence: plan 3.8 line 209 (a visited set returns false on a repeat) and line 214 (prune ends a `from` session only when its source session is gone); plan 9 line 630 ("A `from` source is never the target PC itself").

Problem: the sign-in from B to A, while B is `from: A`, passes the route check (A is up at that moment) and then overwrites A with `from: B`. Both sessions now fail `session_route_up?` for ever, neither is pruned (each source still exists), and GET /keyring keeps reporting `sessionHeld`. The player can recover only by walking to a keyboard where the settle rule applies to a password session; a credential session is not settled (plan line 218), so a credential cycle is stuck. A tampered client can do this with a typed password (K4 line 629 adds `from:` to `attempt_login!`), and honest play can do it with an .rdp for A on B's desktop.

Fix: refuse a `from` sign-in when the target PC appears anywhere on the source's `from` chain, and have prune end any `from` session whose walk hits a repeat. Add both to `credential_from_route_test.rb`.

### m4. K4's borrow prune has no answer field and no client reader

Evidence: plan 9 line 628 says K4 adds the pruned ids "to their `endedPcIds`" for unplug and for `record_borrow_done!`. Only POST /logout (`games_controller.rb:1357`) and unplug (`network_access.rb:303`) answer `endedPcIds`; the `npc_workaround` answer has no such field and `systems/npc-workarounds.js` reads none. The client's displacement (`pc-sessions.js:383-395`) also calls POST /logout and ignores the `endedPcIds` that the server's prune returns.

Problem: a `from` session whose source was borrowed is pruned on the server and stays in the client's mirror, so its desktop and Connect step 5 fail with a server refusal instead of a "has ended" line.

Fix: name the field on the `npc_workaround` answer and its handler in `npc-workarounds.js`, or have `displaced()` pass the logout answer's `endedPcIds` to `linkDropped`. Test it with a borrowed source in K4.

### m5. Client readers of `remote` that the plan does not name

Evidence: plan 8.3 line 550 lists "`openLoginSignIn`, `pc-sessions.js` remote fields, the container's header and params"; line 230 lists the files that test for `claim`. Not named: the capture log's Sessions section (`capture-log-model.js:94-110`, keyed on `remote === true` and `footholdId`), `networkLinks.openSession` (`network-links.js:694-708`, which opens only with a `footholdId` and otherwise toasts and leaves), and `isNetworkScreenContainer` and `networkScreenKind` (`container-minigame.js:55-62, 105-113`), which decide whether a desktop close goes back to the network screens.

Problem: if K3c or K4 mark relay or `from` sessions `remote: true` in the mirror, a relay is listed in the capture log's Sessions (against the invariant's "not listed"), a `from` session's Open there toasts instead of opening, and a relay desktop opened by Connect (no trip) reports its close to `networkLinks.landed`.

Fix: state the mirror's shape for relay and `from` sessions (whether `remote` is true and which route fields it carries), and add these three readers to 3.8's client list with the behaviour each needs.

### m6. K3b offers Connect on the assist code before K3c builds the relay desktop

Evidence: plan 8.2 line 525 (Connect's step 8 includes "then relay"; "for an assist invite's `kindRefused` or `ended`, the toast"); `jake_assist` is in `test_access_keyring`'s registry from K1 (9.1 line 665); the relay desktop mode, `relay=1` on desktop requests, `load()` and the `signedIn` exclusion arrive only in K3c (8.3, lines 549-555); K2 already refuses a no-route desktop request at a relay session (line 216).

Problem: between K3b and K3c on main, Connect on Jake's code signs in by relay, then the client asks for the desktop with no route and is refused; `pc-sessions` adds the PC to `signedIn` and emits `pc_signed_in` without `relay`, so the objectives manager meets an `unlock_object` task the server refuses. That contradicts "Main stays playable and safe between slices" (line 17).

Fix: in K3b, Connect treats an `assist_invite` entry as not yet supported (or leave `jake_assist` out of the test scenario until K3c), and move the relay step of Connect into K3c.

### m7. `item_definition`'s scope is session-dependent as written and misses two placements

Evidence: plan 3.5 line 165 and 6.1 line 315 define the scope as where `find_login_item` looks "(a PC's contents, its account profiles' contents, mapped shares)" plus room objects, containers, `itemsHeld`, start items and grants. `find_login_item` reaches shares only through the session's `mapped_shares` (`game.rb:2060`, `network_access.rb:1330-1340`). Items are also taken from a share opened in the network view (`resource_item_for_add`, `network_access.rb:1354`) and from flag-station rewards (`find_accessible_item`, `games_controller.rb:2913-2919`).

Problem: `item_definition(scenario, itemId)` has no session, so "mapped shares" cannot be computed there; read literally, an .rdp placed in a share or as a flag reward is outside the scope, the validator errors ("`held` naming no item in `item_definition`'s scope") and the server never proves `held`.

Fix: define the scope statically: every sign-in PC's and profile's contents, every resource's contents, room objects and containers, NPC and flag-station `itemsHeld`, start items and declared-grant items. Add a share-placed and a flag-reward fixture to `credential_model_test.rb`.

### m8. A saved connection delivered by a declared grant is accepted as valid

Evidence: plan 6.3 line 381 warns only for an `assist_invite` given by a declared grant; 6.4 line 395 tests "a grant-placed credential item (valid)"; line 833 makes grant placement a default. Declared grants have no trigger check (`games_controller.rb:2627-2644`, "a declared grant can be claimed at any time"). Plan 7.6 line 460 calls saved connections "secret-class and hard-enforced".

Problem: a saved connection opens an account without its password. Placed by a grant, its `held` proof can be claimed by a tampered client from the first second, which the cheat policy for secrets does not accept, and nothing warns the author.

Fix: extend the 6.3 warning to every connecting kind given only by a declared grant (or make it an error for `saved_connection`), and change the 6.4 fixture's expectation to the warning.

### m9. GET /keyring needs a route, a policy method and an access test

Evidence: plan 6.2 line 331 adds the action to `set_game` only. Routes are listed explicitly (`config/routes.rb:40, 57` for `login_accounts` and `capture_secrets`), and each action has its own `GamePolicy` predicate (`game_policy.rb:53-55` `capture_secrets?`). No test in 6.4 checks who may call it.

Problem: without `keyring?` the `authorize @game` call raises; a builder who adds it by copy may pick the wrong predicate. The answer carries captured passwords, so its access rule matters as much as GET /capture_secrets'.

Fix: name the route and `GamePolicy#keyring?` (as `show?`), and add a controller test that another player's game is refused, beside `keyring_route_test.rb`.

### m10. The `from` row's remote-blocked check names the wrong PC

Evidence: plan 3.7 line 197: "the player holds a session at `pcId` ..., `pcId` is on, not `remote: "blocked"`, and the target's network is in ...". Plan 7 step 4 (line 419) applies `remoteBlocked` to the target for `foothold` and `from`. `remote_blocked?` (`network_access.rb:856-858`) is the target's inbound policy.

Problem: read as written, the source PC's policy blocks outbound connections from it, and nothing in the row blocks a target whose policy is `remote: "blocked"`. A builder working from the route table would get both wrong; the test scenario's HB-DESK-01 uses the default policy, so no test would notice.

Fix: reword the row: source session up and source PC on; target not `remote: "blocked"`; target network in `networks_reachable_from(source network)`.

## n

### n1. There is no server counterpart of `displaced` to change

Evidence: plan 7.2 line 441 ("The server counterpart of `displaced` skips a relay session when the NPC sitting down is the account holder"). An NPC sitting down is handled on the client (`pc-sessions.js:146-148`), which sends POST /logout; `record_borrow_done!` (`npc_frustration.rb:372-375`) is a borrower's end, not the holder's.

Fix: drop the sentence or point it at the client rule in 8.3, so the builder does not search for a server path.

### n2. `targetOff` tells power where the PC cannot be reached

Evidence: plan 6.2 line 357 (`targetOff` and `remoteBlocked` regardless of `routes`); `desktop_refusal`'s rule "The power state is told only where the PC itself could be reached" (`network_access.rb:896-899`).

Fix: send `targetOff` only when `routes` is non-empty (or for a relay kind), matching the existing rule.

### n3. POST /login dispatch order for a body carrying `credential`

Evidence: `games_controller.rb:1329-1342` branches on `claim` first, then the typed branch. Plan 7 line 414 does not say where the credential branch sits or what a body with both `credential` and `username`/`password` (or `claim`) gets.

Fix: state it, for example: `claim` with `credential` is the generic claim refusal; `credential` with `username` or `password` is the generic refusal, uncounted.

## Points confirmed sound

- Proof forgery. A client-built item cannot carry `credential` once it is in `FORGEABLE_ITEM_FIELDS`: the always-allowed and decor branches store the client hash minus those fields (`games_controller.rb:2560-2563`) and have the wrong type; an unsourced room add is stripped, renamed with a server id and marked `clientAdded` (`game.rb:574-590`), and Priority 0 of `find_accessible_item` (2852-2860) hands that marked copy back, which `client_forged?` catches. A player drop persists the server's own held copy (`game.rb:537-554`). Start items and grants store the scenario copy. The identity-strict `held` match (type, id, stored `credential`, not forged) closes the name fallback.
- `foothold` proofs read `footholds`, written only by plant, join and implant; the implant session shape refuses a foothold session (`network_access.rb:475-479`) and the plan extends that to relay and `from`.
- Registry leak. `credentials` is top-level, so `filtered_scenario_for_bootstrap` (`game.rb:1280`) is the one place to strip it; room, container and scenario_map answers carry room data only (`games_controller.rb:458-490`), and no view or other action serialises `scenario_data` whole. The item `credential` id is not secret by design.
- Probing. Steps 3 and 5 to 8 answer only after the proof holds; step 1 (PC exists) is as today; nothing on the credential branch is counted, and the lockout check reads `account_locked_out_at?` (`game.rb:2256-2261`) without writing.
- The relay invariant on the server: the plan names every reader I found (`session_route_up?`, `reach_session_hosts`, `view_session_hosts`/`via_for`/`down_blocks`, `resource_admits_player?`, `mapped_shares` and so `share_mapped_at?` and `find_mapped_share_item`, `implant_foothold!`, `host_row`, the desktop check, `unlock_session_refusal`, `settle_session_at_keyboard!`, `session_for_client`, `start_login_session!`, reload, bootstrap, the `unlock_object` task check, `capture_proof_holds?` through `signedInPcs`). The profile scope in `session_admits?` (`game.rb:1976-1980`) admits Jake's profile through the relay, which is his own desktop and grants nothing onward.
- Ending an invite: the sync load has no `scenario_data` (`games_controller.rb:2027`), so the cached map is needed; the bootstrap gate (`game.rb:831-834`) would otherwise never run the writer; `endedCredentials` is grow-only and never read from a client body; a stale sync merges no globals, so the end check correctly waits. Server-side global writers (`game.rb:5404`, `npc_frustration.rb:433, 443`) are caught at the next sync because the check reads current state, not the delta; the unrouted API controller is not a path.
- Sync size: the session record gains three bounded fields in its one slot per PC; `endedCredentials` and `credentialEndGlobals` are bounded by the 64-entry registry and server-only; `endedRelayPcIds` is sent once per ended invite.
- Tests: the `finance_share` and `server_lan` relay checks in 7.3 and R6 would fail on today's code (`resource_admits_player?` and `reach_session_hosts` count every session), so they test the real change.
