Counts: B 1, M 1, m 2, n 2

# Credential keyring plan: review round 4 (server and security)

Fresh reviewer, judging `docs/achitechture/CREDENTIAL_KEYRING_PLAN.md` against the worktree code (branch `plan/keyring`, tip 66b998cf5). Appendix A and all `*_REVIEW_*` files were not read. Slice K0 claims were checked against `build/ux-slice2b0` (c0c274522) where the plan marks them; everything else against the worktree.

## What I checked

- Proof forgery (held, foothold, session, planted, dropped) against `ItemIdentity`, `CaptureProofs#capture_proof_holds?`, the controller inventory path (`canonical_inventory_item`, `CLIENT_ITEM_FORBIDDEN_FIELDS`, `validate_item_collectible`), `find_login_item` scope, and `filter_requires_and_contents_recursive`.
- Registry leaks: `filtered_scenario_for_bootstrap` (`game.rb:1280`), the bootstrap strip of top-level keys, GET /keyring shape, the capture password readers.
- Route forgery on POST /login, GET /keyring, GET /container and every server session reader found by grepping `access_sessions`, `session['foothold']`, `session['via']`: `session_route_up?`, `session_admits?`, `scope_admitted_by_session?`, `unlock_session_refusal`, `resource_admits_player?`, `mapped_shares`, `host_row`, `desktop_request_allowed?`, `reach_session_hosts`, `prune_unreachable_sessions!`.
- The reach walk and pruning with relay and `from` sessions.
- The end-of-invite path (bootstrap writer gate, `credentialEndGlobals`, `endedCredentials`, `endedRelayPcIds`) on the sync path (`sync_state`, `merge_global_variables!`, narrow `SYNC_STATE_COLUMNS` load).
- Check order and the generic refusal, lockout counting (`account_locked_out_at?`, `record_login_failure!`), concurrency (`with_game_lock` around_action), slice boundaries, validator hooks, standing rules (sync size, cheat policy, no format step).

The forgery resistance holds. A non-always-allowed type (`text_file`) can only enter the inventory as the server's own copy (`validate_item_collectible` refuses an unmatched one; `canonical_inventory_item` stores `@collectible_item.deep_dup`), so the stored `credential` is always the scenario's; an always-allowed `notepad` and a client room-add both lose `credential` once it joins `FORGEABLE_ITEM_FIELDS`, and a room-add is also stamped `client_forged?`. The registry is stripped from the bootstrap by the planned `filtered.delete('credentials')` and no other path ships `scenario_data` whole. Check order (step 2 proof-holds before steps 3 and 5 to 8) means the browser cannot probe the registry. Lockout counting (typed passwords only; `honours_lockout` reading `account_locked_out_at?`) and `with_game_lock` on `login`, `logout` and `container` are correct.

## Findings

### B1. A relay session extends reach through `mapped_shares`, `resource_admits_player?` and the K4 `from` route; the plan excludes relay only from `reach_session_hosts`

Evidence: plan line 178 states the whole invariant ("A relay session never extends reach") and backs it with one change only, `reach_session_hosts` skipping relay. But session-based reach is computed in three other places that the plan does not touch for relay:
- `network_access.rb:1218` `resource_admits_player?` iterates `access_sessions`, gates on `session_route_up?` (which, after the K2 change, returns true for an up relay), then grants the share when `networks_reachable_from(host_net)` includes the resource network (`network_access.rb:1251-1256`). Plan line 187 itself lists `resource_admits_player?` as going "through" `session_route_up?`, but passing that gate does not drop a relay from the link walk.
- `network_access.rb:1265` `mapped_shares(pc, npc)` walks `networks_reachable_from(object_network(pc))` with no session-kind test, so a relay desktop maps file shares on linked networks.
- Plan line 175 (`from: pcId` route) and line 187 (`session_route_up?` `from` branch) accept any source session that is up; neither excludes a relay source.

Problem: with Jake's relay session open at `jake_pc` (on `office_lan`, which links to `server_lan`), a tampered client can POST /login `{ pc_id: ops_pc, credential: ops_rdp, from: jake_pc }`. The `from` check passes (relay up, `jake_pc` on, `server_lan` is in `networks_reachable_from(office_lan)`), so the server signs the player in to `ops_pc` on `server_lan` with no foothold at all, skipping the intended drop-box pivot. Separately, opening the relay desktop maps any access-listed `server_lan` share that admits Jake. Both are reach the relay is defined never to grant, and the `from` route to `ops_pc` is exercisable in the shipped `test_access_keyring` (section 9.1 puts `ops_rdp` -> `ops_pc` on `server_lan` and gives Jake a relay at `jake_pc` on `office_lan`). Honest play reaches `ops_pc` only with a foothold on `server_lan`, so this is a reach the mechanic forbids. It also breaks the plan's claim (7.1) that the sync-time relay end needs no `prune_unreachable_sessions!`: a `from` session chained off a relay would be orphaned when the relay ends.

Fix: treat a relay session as a reach sink everywhere, not just in `reach_session_hosts`. Skip sessions carrying `relay` in `mapped_shares` and in the `resource_admits_player?` session loop, and reject a relay source in the POST /login `from` route check and in the `session_route_up?` `from` branch (require the source session to carry `foothold` or `from`, never `relay`). State the invariant as "a relay session is reachable only by Connect and is never a pivot, a share source or a `from` source" and add a test that a relay at a host on a linked network maps no share and admits no `from` login onto that network.

### M1. The runtime `held` item-definition scope and the validator disagree on declared grants, so a credential item in a grant passes validation but its proof never holds

Evidence: plan line 145 fixes the `held` definition search to "where `find_login_item` (`game.rb:2051`) looks (a PC's contents, its account profiles' contents, mapped shares) plus room objects, container contents, NPC `itemsHeld` and `startItemsInInventory`" (no declared grants). `find_login_item` (`game.rb:2051`) confirms that scope. But the validator error at plan line 331 spares a `held` item that "is not takeable and is in no declared grant, NPC `itemsHeld` or start inventory", so it treats a declared grant as a valid home for the item.

Problem: an author places a credential item only inside a declared grant (a legitimate, documented delivery, `canonical_inventory_item` serves it from the held grant). The validator passes it, but at runtime `CredentialModel.item_definition` searches a scope that excludes grants, fails to find the definition, so the `held` proof can never match the stored item and the credential is unreachable. The mission is silently unsolvable through that route.

Fix: align the two. Either add declared-grant contents to `item_definition`'s search scope, or make `check_credentials` error when a credential item's only placement is a declared grant and document that credential items come from rooms, PCs, profiles, shares, `itemsHeld` or start inventory. Add a validator fixture and a model test for a grant-placed credential item either way.

### m1. A relay sign-in writes grow-only `signedInPcs`, so a `session` proof keyed on the relay PC holds permanently after the invite ends

Evidence: `start_login_session!` (`game.rb:2883`) adds the PC to `signedInPcs` for every `via`, relay included, and `signedInPcs` is never pruned; `CaptureProofs#capture_proof_holds?` reads the `session` proof straight from `signedInPcs`.

Problem: a relay is framed as transient (ends on reload, endable by the NPC), yet one relay sign-in at `jake_pc` marks `jake_pc` signed-in for the rest of the game. Any `session: jake_pc` credential proof, and `account_capture_served?` for an account admitted at `jake_pc`, then holds forever, even after the invite is ended and the page reloaded. An author gating a secret on "ever held a session at this PC" gets it unlocked permanently by a transient invite.

Fix: this is consistent with the documented "ever held a session" meaning, so at least call it out in section 3.5 (a relay sign-in satisfies a `session` proof permanently) and add a test; if that is not wanted, do not add a relay PC to `signedInPcs`, or record it under a key the `session` proof ignores.

### m2. `unlock_session_refusal` picks its reason from foothold presence, so a `from` or relay session shows the keyboard "This PC is off" text when the host is off remotely

Evidence: `unlock_session_refusal` (`game.rb:2727`) chooses the message with `access_sessions[pc_id]['foothold'].present? ? 'not_responding' : 'off'` (`game.rb:2752`). The plan threads a route argument through `desktop_request_allowed?`, `desktop_refusal` and `render_login_desktop` (7.2) but does not name `unlock_session_refusal`.

Problem: a `from` session carries `from`, a relay session carries `relay`, neither carries `foothold`. When the host goes off, `session_route_up?` correctly refuses the unlock (so there is no security gap), but the player sees the local keyboard wording ("This PC is off") for a PC they reached remotely, where "This PC is not responding." is the right line.

Fix: have `unlock_session_refusal` pick `not_responding` when the session carries any remote route field (`foothold`, `from` or `relay`), and add it to the route-aware reader list in 7.2.

### n1. The schema `x-ref` annotation the plan calls for does not exist in the validator

Evidence: plan line 282 asks for `x-ref` on `account`, `connectsTo`, `foundIn`, `proof.session`, `proof.held`, `endsOnGlobal`. `scripts/scenario-schema.json` and `lib/break_escape/scenario_schema.rb` have no `x-ref` facility (only `x-id-map`); a grep for `x-ref` returns nothing.

Problem: an `x-ref` keyword would be inert, so a builder might think the schema enforces these references when it does not. All the cross-reference checks are in fact specified in `check_credentials` (6.3), which is the real enforcement.

Fix: drop the `x-ref` note or say plainly that cross-references are enforced only by `check_credentials`, not the schema.

### n2. `systems/screen-states.js:83` is listed as changed in both K2 and K3a

Evidence: section 3.8 (line 197) describes the `screen-states.js:83` change under the K2 server slice ("it changes to paint locked only when `via` is neither `password` nor `credential`"), and the K3a file list (line 456) lists `systems/screen-states.js:83` again.

Problem: the slice that owns this client edit is ambiguous. It is harmless either way (no credential session exists until K3a content ships), but a builder cannot tell which slice makes the change.

Fix: name one owning slice for the `screen-states.js` edit and remove it from the other list.
