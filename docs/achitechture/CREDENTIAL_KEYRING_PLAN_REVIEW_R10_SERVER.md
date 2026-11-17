Counts: B 0, M 2, m 6, n 5

# Round 10 server and security review

Plan reviewed: the keyring build plan body (846 lines), cited as "plan line N". Code: worktree `p-keyring-plan` (HEAD 46bdbafb7, which contains 1ce7486c7; the plan's line citations match it). UI slice 6's server side read only through `git diff ac526d218 20a8a83a7`.

## What I checked

- Every server reader of the session record, found by grep for `access_sessions`, `player_state['sessions']`, `signedInPcs` and their helpers:
  - `app/models/break_escape/network_access.rb:280-303` (unplug), `:392-396` (`end_sessions_through!`), `:448-519` (`implant_foothold!`, session shape at `:475-479`), `:772-845` (`network_blocks`, `down_blocks`, `view_session_hosts`, `via_for`), `:899-935` (`desktop_refusal`, `host_row`), `:1015-1033` (`session_route_up?`), `:1055-1126` (`reach_walk`, `reach_cache_key`, `reach_walk_uncached`, `reach_session_hosts`), `:1129-1203` (`networks_reachable_from`, `prune_unreachable_sessions!`, `host_reachable_through?`, `desktop_request_allowed?`, `settle_session_at_keyboard!`), `:1218-1348` (`resource_admits_player?`, `mapped_shares`, `find_mapped_share_item`, `share_mapped_at?`).
  - `app/models/break_escape/game.rb:1952-2060` (`access_sessions`, `session_identity`, `session_admits?`, `scope_admitted_by_session?`, `login_desktop_contents`, `find_login_item`), `:2141-2181` (`attempt_login!`), `:2214-2337` (owner and guest claims, held guards at `:2227`, `:2296`), `:2341-2411` (`logout_session!`, `end_claimed_sessions!`, `claimed_session_ids`, `sessions_for_client`, `session_for_client`, `signed_in_pcs`), `:2758-2790` (`unlock_session_refusal`), `:2914-2938` (`start_login_session!`, `login_session_answer`), `:3730-3736` (task check), `:1773-1790` and `:5844` (`ACCESS_STATE_DEFAULTS`), `:205-222` and `:831-853` (bootstrap writers).
  - `app/models/break_escape/capture_proofs.rb:24-54` (`record_planted_item!`), `:69` (`session` proof on `signedInPcs`).
  - `app/models/break_escape/npc_frustration.rb:252-258` (`end_guest_session_at!`), `:364-381` (`record_borrow_done!`).
- Controller: `app/controllers/break_escape/games_controller.rb:288`, `:418-438` (bootstrap order), `:570-620` (GET /container), `:800-870` and `:2098-2190` (PUT /sync_state, narrow load, stale path, merges), `:1205-1270` (POST /inventory add), `:1320-1392` (POST /login dispatch, logout, login_accounts), `:1568-1577` (capture_secrets), `:2447-2470` (`render_login_desktop`), `:2515-2578` (always-allowed items, `canonical_inventory_item`), `:2742-2770` (desktop add). `app/controllers/break_escape/api/games_controller.rb` (unrouted second sync path, confirmed unrouted).
- `lib/break_escape/item_identity.rb:20-42` (`FORGEABLE_ITEM_FIELDS`, `client_forged?`); `app/models/break_escape/game.rb:464-560` (`add_item_to_room!`).
- Slice 6 (20a8a83a7): `lock_session!`, `session_locked?`, `session_identity` nil when locked, `session_admits?` lock test, `reach_cache_key` lock term, `reach_walk_uncached` lock skip, `host_row` and `via_for` lock marks, `resource_admits_player?` lock skip.
- A grep for an existing `credential` item field in scenarios, engine and server: none, so adding it to `FORGEABLE_ITEM_FIELDS` collides with nothing.

## B

None.

## M

### M1. `from_reach` as written recurses without bound through `session_route_up?`

Evidence: plan line 637 defines `from_reach` as "the pivot walk `reach_walk` already uses ... a link is crossed only from a network on which the player holds a non-relay, unlocked session whose route is up". Plan line 209 makes `session_route_up?` for a `from` session test "the target network is in `from_reach(source network)`", and gives the visited set only to "the `from` walk" (the chain of sources). `reach_walk_uncached` (`network_access.rb:1089-1104`) never calls `session_route_up?` on a pivot: it tests only that the pivot's network is reached and up and that its host is on (slice 6 adds the lock skip). The "whose route is up" test is new in the plan.

Problem: built as written, `session_route_up?(T)` for a `from` session T calls `from_reach`, which tests "route is up" for every session on a reached network. T itself is on a reached network (its target network is in `from_reach` by construction, and on the source's own network it is reached at once), so the walk calls `session_route_up?(T)` again, with a fresh call that does not see the chain's visited set. Two `from` sessions call each other the same way. The result is a stack overflow on every scoped request (`session_admits?` profile scope loops every session, `game.rb:1977-1980`), every desktop request and every reach check once one `from` session exists: R10 cannot work. The plan also does not say whether the route test uses the access walk (outages and power applied) or the structural one, nor how the cache is keyed for a network seed when `reach_cache_key` (`network_access.rb:1061-1073`) is keyed on a foothold id.

Fix: define `from_reach` exactly as `reach_walk_uncached` with the seed set to the source network: a pivot counts when its network is reached and up, its host is on and (with slice 6) it is not locked, and it carries no `relay`; no `session_route_up?` call inside the walk. State that `session_route_up?` for a `from` session uses the access variant and `prune_unreachable_sessions!` the structural variant, and key the cache on `[:from, network, ignore_outages]` plus `reach_cache_key`'s other inputs. Add a test: one `from` session, then two `from` sessions on linked networks, each `session_route_up?` returns without recursion.

### M2. Connect on a desktop file without taking it fails the `held` proof, so R10 breaks

Evidence: plan line 639: "On the desktop where the file sits, the file's click offers Connect beside Take (no need to take it first)". Plan line 674: `lena_rdp` has `proof: { held: lena_rdp_file }`. Plan line 165: `held` holds only for an inventory entry. Plan line 421 (K2 step 2): a credential whose proof does not hold gets the generic refusal. Plan line 709 (R10): "from Sam's keyboard session, Connect on the .rdp signs in from HB-DESK-01"; mock m6 (plan line 745) shows Connect beside Take. The only way an item enters the inventory is POST /inventory (`games_controller.rb:1218-1265`).

Problem: the server refuses that Connect with "Incorrect username or password" (the generic body), because the .rdp is still on Sam's desktop and not in the inventory. A builder either ships a Connect that always fails from the desktop, or loosens the proof to "visible on an open desktop", which the plan's cheat analysis (plan line 412) does not cover.

Fix: make the desktop Connect a Take then Connect: POST /inventory add with `source_pc_id` (the file's own transfer rule; a copy by default if the file allows it), then K3b's Connect order with `from` set to that desktop. Say so in K4's client bullet and in mock m6 ("Connect takes the file"), and add a K4 test that a desktop Connect posts the add before POST /login and that POST /login with the file still on the desktop gets the generic refusal.

## m

### m1. The relay skip is an input to the reach walk, so `reach_cache_key` must carry it

Evidence: plan line 211: "K2 checks that `reach_cache_key` needs no change for a relay (the skip makes it no input to the walk)". `reach_cache_key` (`network_access.rb:1061-1073`) keys on `access_sessions.keys` only, not the records. Slice 6 met the same case and keyed it: "a lock cuts the pivot without changing the session keys, so it must key the cache" (20a8a83a7, `network_access.rb` hunk at `:1075`).

Problem: a relay sign-in at a PC holding a password pivot, or a typed or claim sign-in replacing a relay (plan lines 216, 231), changes the walk's answer while the key set stays the same. Within one request a walk cached before the write is reused after it. No request path in K2 computes the structural walk before the write today, so this is latent, but the plan tells the builder to assert the opposite of what is true, and slice 6's key only covers the access walk.

Fix: K2 adds a per-session route term to the key for both walk variants (for example the sorted `[pc_id, relay?]` pairs; K4 adds `from`), and a test that replaces a pivot with a relay in one request and reads the walk before and after.

### m2. K-lock: `sessionHeld: false` for a locked session is not automatic

Evidence: plan line 359 defines `sessionHeld` as "the server holds a session at `connectsTo` opened with this credential", a test on the record. Plan line 624: "GET /keyring reports `sessionHeld: false` for a locked session (`session_identity` answers nil)". Slice 6 leaves the record in place and only `session_identity` answers nil (20a8a83a7, `game.rb` hunk at `:1964`).

Problem: built from line 359 in K1, `sessionHeld` stays true while the session is locked, so Connect takes step 5 (open the desktop), `render_login_desktop` answers 403 `no_session` (`games_controller.rb:2452-2453`), and the player is stranded in the case K-lock exists to avoid.

Fix: K-lock lists the change to `sessionHeld` (false when `session_locked?`) and its test already named at plan line 625 then tests a real change.

### m3. A locked `from` source: the rule is set only at sign-in, and may land with nobody

Evidence: plan line 197 requires the source session "is not locked (UI slice 6)" at sign-in; plan line 209's `session_route_up?` for a `from` session does not test the source's lock. Slice 6 lets any `via: "password"` session be locked (20a8a83a7, `lock_session!`), so Sam's keyboard session (R10's source) is lockable without K-lock. K4's base is main after K3c (plan line 630) and does not wait for slice 6; K-lock (plan lines 621-623) lists only the widening of the lockable kinds.

Problem: lock HB-DESK-01 after R10's Connect and the HB-FIN-02 `from` session stays usable while a fresh `from` sign-in is refused, which differs from slice 6's rule for a locked pivot (its onward foothold sessions lose their route). If K4 merges before slice 6, no slice adds the lock test to the `from` route, the `from` GET /login_accounts branch or `from_reach`.

Fix: decide the rule (recommended: a locked source cuts the `from` route as a locked pivot cuts reach, and unlocking restores it, never pruned) and assign it: K4 if slice 6 is on main, else K-lock, with a test either way.

### m4. A `from` session whose target falls out of structural reach is never pruned

Evidence: plan line 215 prunes a `from` session only when its source is gone, carries `relay`, or its walk repeats. Plan line 633: "So ... GET /keyring never reports a dead `sessionHeld`." Foothold sessions are pruned when their network leaves every foothold's structural reach (`network_access.rb:1150-1166`).

Problem: with a third network reached from the source's network only through another session P, signing out at P leaves the `from` session held but refused for good by `session_route_up?`. `sessionHeld` stays true, so Connect step 5 opens a desktop the server refuses, every time. No scenario with `credentials` has three networks today, so no beat shows it.

Fix: in the prune pass, also end a `from` session whose target network is not in the structural `from_reach` of its source's network (outages still never prune), and test it with a three-network fixture.

### m5. Reload sends `from` sessions the same request prunes

Evidence: the bootstrap builds `sessions` (`games_controller.rb:425`) before `end_claimed_sessions!` (`:437`), which prunes (`game.rb:2376-2380`). Plan line 224 omits only relay sessions from that answer. Plan line 640 tests "a claimed source ends on reload and the chain with it" on the server only; plan line 633 claims the chain ends "on both sides".

Problem: a `from` session whose source is a claim is in the reload's `sessions` answer and ended on the server in the same request, so the client mirror holds it until a 403. Onward foothold sessions through a claimed pivot already behave this way on main, but K4 adds a new, likely case (a claim at a desk as the `from` source).

Fix: have `sessions_for_client` leave out every session the reload will end (claims are still sent, as today, so the client reports their end): compute the reload's end set first (claims, relays and what the prune would then end) on a copy, and omit the non-claim ones. Test it with a claimed source and a `from` session.

### m6. K1's notepad test passes on today's code, so it does not test the new strip

Evidence: plan line 395: "an always-allowed notepad posted with the .rdp's id, name and `credential` does not prove `held`". The stored notepad's type is `notepad` (`games_controller.rb:2523`), and `held` requires the definition's type, `text_file` (plan line 165).

Problem: the test passes whether or not `credential` joins `FORGEABLE_ITEM_FIELDS` (plan line 323), so dropping that line would go unnoticed.

Fix: also assert that the stored notepad (and an unsourced room add) carries no `credential` key after the add, which fails on today's code.

## n

### n1. The typed sign-in has no held-session guard to relax

Evidence: plan line 231: "the typed `attempt_login!` treat a relay session as not held". `attempt_login!` (`game.rb:2141-2181`) never tests for a held session; only the claims do (`:2227`, `:2296`).

Fix: drop `attempt_login!` from that sentence.

### n2. "Claim first" needs an explicit guard

Evidence: plan line 418: "a body with both `claim` and `credential` gets the claim branch's generic refusal". Today the claim branch (`games_controller.rb:1329-1338`) runs the claim and can succeed. Plan line 449 tests for the refusal.

Fix: say that the claim branch refuses a body that also carries `credential`, before running the claim.

### n3. Both new keys are written to every new game

Evidence: plan line 436: "A scenario with no `endsOnGlobal` never writes the key"; plan line 441 puts both keys in `ACCESS_STATE_DEFAULTS`, which `initialize_player_state` writes on every game (`game.rb:1773`, `:5844`).

Fix: keep them out of the defaults and read them with a fallback, or reword line 436. With the default `{}`, `credential_end_globals_stale?` must compare digests and not test for a missing key.

### n4. A credential session kept remote at the keyboard refuses a session-shape implant there

Evidence: plan line 220 keeps the foothold on a `via: "credential"` session opened at the keyboard; `implant_foothold!` accepts only a session with a blank foothold (`network_access.rb:477-479`).

Fix: note it as intended (the session is still remote), or let the implant accept a credential session whose desktop was last served at the keyboard. No beat needs it.

### n5. K0's check order differs from POST /login's

Evidence: plan line 257-258 answers `remoteBlocked` before `not_responding`; `attempt_login!` checks power before policy (`game.rb:2149-2156`), and `desktop_refusal` reports not responding only when not blocked (`network_access.rb:904`).

Fix: pick one order for a host that is both off and blocked (POST /login's is the shipped one).

## Points confirmed sound

- The plan names every server reader of the session record I found by grep, including the less obvious ones: `implant_foothold!`, `unlock_session_refusal`, `via_for` and `down_blocks` through `view_session_hosts`, `find_mapped_share_item` and `share_mapped_at?` through `mapped_shares`, the task check at `game.rb:3734`, and `capture_proofs.rb:69`. The relay skips in `reach_session_hosts`, `view_session_hosts`, `resource_admits_player?` and `mapped_shares` close the reach, view, share and desktop-add paths; profile scopes through a relay admit only the holder's own profiles, which the shared screen shows anyway.
- Leaving relay sessions out of `signedInPcs` keeps them out of `session` proofs, `account_capture_served?` and `unlock_object` tasks.
- The relay checks at sign-in and on the desktop request are judged against the server's own record; the refusal of a no-route desktop request at a relay session, and the `foothold` branch's new refusal of `relay` and `from` records, close the holder's-keyboard and wrong-param paths. A typed POST /login with `relay` is refused.
- K2's order of checks (proof before any specific answer, nothing counted, one generic body for undeclared, unproven, password and malformed ids) gives a tampered client no registry probe. `held` matched on stored type and id with no name fallback, `client_forged?`, and `credential` stripped from client-built and unsourced items, cannot be forged through any inventory writer I found (`canonical_inventory_item`, the always-allowed path, `add_item_to_room!`); the unrouted `Api::GamesController` stays unrouted.
- No password value reaches the client that GET /capture_secrets would not already serve; registry password entries carry none.
- Ending an invite in the sync merge from the cached map, with no `scenario_data` load and no prune, fits the narrow load (`games_controller.rb:2027`); the stale path skips the global merge, so it ends nothing early; `endedRelayPcIds` is sent once per ended invite. The bootstrap writer needs its `bootstrap_state_needs_write?` term, as the plan says (`game.rb:831-834`).
- Pruning to a fixed point is right for `from` sessions used as pivots (the second pass ends the foothold sessions they carried), and adding the prune after unplug and after a borrow's end closes two gaps that exist on main today.
- `from_reach` seeded from the source network reaches exactly what a foothold on that network with the source session as pivot reaches, so it gives no wider reach than a drop box, as plan line 643 claims. The K4 scope rule keeps the shipped networks scenarios on today's reach.
- Sync size: the session record gains one id and one route field in the existing one slot per PC; no new key is sent on each sync; the keyring is a read with `rev`.
- K-lock's second unlock path (a fresh credential sign-in rebuilds the record with no `locked`) matches slice 6's design, which has no unlock route and rebuilds through `start_login_session!`.
- The code citations I checked in sections 2 and 3.8 match the worktree line for line.
