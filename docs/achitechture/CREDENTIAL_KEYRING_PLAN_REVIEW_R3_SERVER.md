Counts: B 1, M 2, m 3, n 1

# Credential keyring plan: review round 3 (server and security)

Fresh server and security review of `docs/achitechture/CREDENTIAL_KEYRING_PLAN.md` against the worktree code (main f956f5355 plus plan commits; K0 base c0c274522). Appendix A and the R1/R2 review files were not read. No SecGen or exploit material was opened.

## What I checked

- Proof forgery across all five kinds (`session`, `planted`, `dropped`, `held`, `foothold`): whether any client-written field can make a proof hold, and item identity matching. Traced `canonical_inventory_item` (games_controller.rb:2552), `CLIENT_ITEM_FORBIDDEN_FIELDS` (:2538), `ItemIdentity::FORGEABLE_ITEM_FIELDS` (item_identity.rb:27), `capture_proof_holds?` (capture_proofs.rb:58) and the sync merge sections (games_controller.rb:2093, 2169) to confirm `signedInPcs`, `plantedItems`, `droppedItems`, `gainedFootholds`, `footholds`, `sessions` and `inventory` are never client-writable through PUT /sync_state.
- Registry leak: `filtered_scenario_for_bootstrap` (game.rb:1280), room/container serving, GET /keyring password serving.
- Route forgery on POST /login, GET /login_accounts, GET /container / `desktop_request_allowed?`, and every session reader (grep of `access_sessions`, `player_state['sessions']` and `via` across app/ and lib/).
- The reach walk and pruning with relay and `from` sessions (`reach_session_hosts`, `reach_walk_uncached`, `prune_unreachable_sessions!`, network_access.rb:1115-1210).
- The end-of-invite cache on the sync path (`prepare_bootstrap_state!` game.rb:214, `run_bootstrap_writers!` :839, `bootstrap_state_needs_write?` :831, `merge_global_variables!` :332).
- Check order, the generic refusal, lockout counting, `with_game_lock`, slice boundaries, the validator checks and the named tests and live proofs.

The proof model is sound: every proof reads grow-only, server-written state that PUT /sync_state does not accept, and `credential` joining `FORGEABLE_ITEM_FIELDS` plus the identity-strict `held` match closes item forgery. The registry strip, the generic refusal ordering (steps 3 and 5 to 8 only for a proven credential), and "nothing counted" on the credential branch all hold up. The findings below are where the plan would not build, or would regress, as written.

## B (ships a hole, breaks existing play, or cannot be built)

### B1. The `screen-states.js:83` transformation is inverted and regresses every shipped workstation scenario

Evidence: plan section 3.8, line 185: "Client readers that test `via === "password"` move to `via !== "claim"`: `systems/screen-states.js:83`." The actual line is `const locked = !!w.workstationState.isLocked(objectId) && w.pcSessions?.get?.(objectId)?.via !== 'password';` (screen-states.js:83), and the header rule (screen-states.js:4-9) is "shows `<key>_locked` ... [when] the player holds no password session at that PC". Section 9.2 (line 594) claims K2 "change[s] behaviour only for credential sessions".

Problem: `locked = isLocked && TEST`; `locked` true paints the `_locked` texture. Current `TEST = via !== 'password'` paints the locked texture unless a password session is held (so a signed-in password session shows the base texture). The plan's `TEST = via !== 'claim'` paints the locked texture whenever `via` is not `'claim'`, so a PC the player is signed into with a password, while the owner is away and the screen locked, now shows the `_locked` texture instead of its base. That is a visible regression on every existing scenario with workstation PCs, not a credential-only change, so the slice-safety claim is false. The change also fails its own goal: a `credential` session (`via === 'credential'`) still satisfies `via !== 'claim'` and so still shows the locked texture rather than hiding it as a sign-in should.

Fix: this reader needs "a non-claim sign-in session hides the locked screen", i.e. paint the locked texture only when no such session exists: `const v = w.pcSessions?.get?.(objectId)?.via; const locked = isLocked && v !== 'password' && v !== 'credential';` (or a positive "signed in" helper). Correct line 185 so it does not describe a literal `=== 'password'` to `!== 'claim'` swap, which neither matches this line's operator nor yields the intended logic.

## M (a real gap the builder would hit, or a rule broken)

### M1. `credentialEndGlobals` is never written: the bootstrap writer is gated behind `bootstrap_state_needs_write?`, which the plan does not extend

Evidence: plan section 7.1 (lines 373-374): the cache "is written by a bootstrap writer in `run_bootstrap_writers!` ... when it is missing or the scenario changed. The same writer then runs the end check." `run_bootstrap_writers!` (game.rb:839) is invoked only by `prepare_bootstrap_state!` (game.rb:214), which returns early `unless bootstrap_state_needs_write?`. That gate (game.rb:831) is `cards_need_repair? || legacy_cloned_cards? || legacy_captures? || unrecorded_shared_logins? || stampable_captures?` and nothing else. The plan names `run_bootstrap_writers!` but never `bootstrap_state_needs_write?`.

Problem: for a game that has no card repair, legacy capture or shared-login work pending (a fresh `test_access_keyring` game is exactly this), `bootstrap_state_needs_write?` is false, so `run_bootstrap_writers!` never runs and `credentialEndGlobals` is never written. The sync merge then "does nothing for credentials" (its own rule when the cache is missing), so `endedCredentials` is never populated. GET /keyring computes `ended` from `endedCredentials`, which stays empty, so after Jake ends the invite Connect re-opens the relay session on the next attempt and the "ended" state never sticks. Beat R7 ("Connect says the same [ended]") fails, and the "grow-only `endedCredentials` prevents revival" protection (cheat table, line 414) never engages because the set is always empty. The relay session does still vanish on reload via `reload_ended_session_ids`, so R8 passes, which masks the gap in casual testing.

Fix: add a `credential_end_cache_stale?` term (cache missing or stale, or a cached end-global now true whose ids are not yet in `endedCredentials`) to `bootstrap_state_needs_write?`, and state this in section 7.1 so the writer actually runs. Add a test that a fresh credential game with no other pending bootstrap work still writes the cache and ends the invite.

### M2. `item_definition`'s search scope omits account profiles and mapped shares, where takeable credential files commonly live

Evidence: plan section 3.5 (line 136) and section 6.1 (line 260): `item_definition(scenario, itemId)` searches "room objects, container contents and NPC `itemsHeld`". In `test_access_keyring` (section 9.1, line 547) `ops_rdp_file` (the `ops_rdp` saved-connection proof) sits "on Lena's desktop", and `find_login_item` (game.rb:2052) resolves a takeable desktop file from `pc['contents']`, then `account_profiles[*]['contents']`, then mapped shares. Desktop files conventionally follow an account `profile`, not the PC object (login_desktop_contents, game.rb:2040, concatenates both).

Problem: when a credential's `held` item is authored in an `accountProfiles` profile (or a mapped share), `item_definition` cannot find its definition. The `held` proof then cannot check "whose type equals the definition's" (section 3.5), and the validator check "`held` naming no scenario item" (section 6.3, line 314) errors on a perfectly reachable file, so the `ops_rdp` credential can never hold. The scope also omits `startItemsInInventory`, which the validator's own "in no declared grant, NPC `itemsHeld` or start inventory" text (line 314) assumes is reachable.

Fix: `item_definition` should search the same places `find_login_item` does (PC `contents`, every `accountProfiles` profile's `contents`, mapped shares) plus `startItemsInInventory`, and section 3.5/6.1 should list them. Add a `credential_keyring_test` case for a `held` item authored in a profile.

## m (smaller correctness or clarity issues)

### m1. `settle_session_at_keyboard!` is absent from the K2 reader list and silently relocalises a saved-connection session

Evidence: `render_login_desktop` (games_controller.rb:2450) calls `@game.settle_session_at_keyboard!(pc['id']) if foothold.nil?`; `settle_session_at_keyboard!` (network_access.rb) strips `'foothold'` from the session record. Section 3.8 lists the readers K2 changes but not this one.

Problem: a saved-connection session opened over a foothold carries `{ via: 'credential', credential:, foothold: }`. If the player walks to the target PC's keyboard and opens its desktop (no `foothold` param), `settle_session_at_keyboard!` strips the foothold, converting the credential session to a local one that `prune_unreachable_sessions!` will no longer end on unplug. That contradicts R9 ("Unplug the drop box: the .rdp session ends") for a player who visited the keyboard first. A relay or `from` session is unaffected (no `'foothold'` key), so it is safe, but the behaviour for the foothold case is undocumented.

Fix: state in section 3.8 whether a settled saved-connection session is intended to behave like a settled password session; if not, guard `settle_session_at_keyboard!` to leave a `via == 'credential'` session alone, and cover it in a test.

### m2. The relay/`from` desktop branch is specified on `desktop_request_allowed?` but the callers that must thread the params are not named

Evidence: section 3.8 adds branches to `desktop_request_allowed?` "keyed on the request's `relay=1` or `from=` param", and section 7.2 says "GET /container passes `relay=1` ... through". `desktop_request_allowed?` (network_access.rb:1183) takes only `(info, foothold_id)`, and `render_login_desktop` reaches it through `@game.desktop_refusal(info, foothold)` (games_controller.rb:2440).

Problem: for a relay session the request carries no `foothold`, so `desktop_refusal(info, nil)` falls to the keyboard branch and a relay desktop opened while the player is not at Jake's keyboard would be refused as unreachable. The plan does not name `desktop_refusal` or `render_login_desktop` as needing the new params, so a builder could change only `desktop_request_allowed?` and miss the threading.

Fix: name `desktop_refusal` and `render_login_desktop` (and their signatures) in section 7.2 as part of passing `relay`/`from` through.

### m3. GET /keyring's `foothold`, `from` and `relay` query params have no stated use or trust rule

Evidence: section 6.2 (line 276) defines `GET .../keyring?pc_id=&foothold=&from=&relay=&rev=`, but the `routes` field is "held footholds that reach `connectsTo` now" (computed from server-held state), and only `pc_id`/`rev` have described behaviour.

Problem: it is unclear what the three route params do, and whether they could be read as an assertion of reach. They must only describe which screen context the client is viewing (to decide whether `pc_id` is openable), never be trusted to assert a route the server does not hold.

Fix: state the params' purpose in section 6.2 and that reach is always recomputed from server-held footholds and sessions, never from these params.

## n (nits)

### n1. "each PC once per game" for `endedRelayPcIds` assumes one relay credential per PC

Evidence: section 7.1 (line 375): `endedRelayPcIds` is "at most 64, and each PC once per game, since `endedCredentials` is grow-only".

Problem: the "once per PC" bound holds only if a PC is the `connectsTo` of a single relay credential. Two assist invites to the same PC could each end at different times and list the PC twice. Harmless (the client re-applies idempotently), but the stated invariant is slightly stronger than the data guarantees.

Fix: reword to "each (PC, credential) pair once", or note the bound assumes one relay credential per PC.
