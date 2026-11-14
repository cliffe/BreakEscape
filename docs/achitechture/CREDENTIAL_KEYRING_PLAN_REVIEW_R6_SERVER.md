Counts: B 0, M 1, m 1, n 2

# Round 6 server and security review

Fresh read of the plan against the code on `plan/keyring` (contains main 1ce7486c7). I did not read Appendix A or the earlier review files; findings below are formed only from the plan body and the code.

## What I checked

- **Proof forgery.** The `held` and `foothold` proofs (section 3.5) against the inventory path: `canonical_inventory_item` and `CLIENT_ITEM_FORBIDDEN_FIELDS` (`games_controller.rb:2549-2578`, `2606-2610`), `ItemIdentity::FORGEABLE_ITEM_FIELDS` and `client_forged?` (`item_identity.rb:28-42`), `FORGEABLE_LOCK_FIELDS` (`game.rb:613-620`). Confirmed a `text_file` with `credential` is stored only from the server copy; a `notepad` (always-allowed) reaches the `except(*CLIENT_ITEM_FORBIDDEN_FIELDS)` branch so a client-set `credential` is stripped once K1 adds it to the list (the comment at `item_identity.rb:21` already anticipates "credential data"). Capture proofs: `capture_proof_holds?` and `account_capture_served?` (`capture_proofs.rb:58-115`) read `plantedItems`, `droppedItems`, `signedInPcs` only.
- **Registry leak.** Bootstrap filter `filtered_scenario_for_bootstrap` (`game.rb:1280-1376`): the top-level strip block (`:1341-1372`, `filtered.delete('flags')`, `'accountProfiles'`, `'roles'`, `withhold_network_keys!`, `strip_capture_secrets!`) is where K1's `filtered.delete('credentials')` must sit; confirmed no answer sends the whole map today. GET /keyring shape (6.2): password value only on implicit entries, served through the existing `capture_secrets_for_client` path.
- **Route forgery and session readers.** Every session iterator: `view_session_hosts`/`via_for` (`network_access.rb:812-839`), `host_row` (`:911-936`), `session_route_up?` (`:1015-1033`), `reach_session_hosts` (`:1115-1125`), `prune_unreachable_sessions!` (`:1150-1166`), `desktop_request_allowed?`/`desktop_refusal` (`:1183-1193`, `:899-909`), `settle_session_at_keyboard!` (`:1197-1203`), `resource_admits_player?`/`mapped_shares` (`:1218-1288`), and in `game.rb`: `session_admits?`/`scope_admitted_by_session?` (`:1965-2004`), `session_for_client`/`sessions_for_client` (`:2390-2406`), `claimed_session_ids`/`end_claimed_sessions!` (`:2370-2387`), `unlock_session_refusal` (`:2758-2790`), `start_login_session!` (`:2914-2924`), and the claim "session already held" guards (`:2227`, `:2296`). POST /login dispatch and lock (`games_controller.rb:97-99`, `1320-1344`), `attempt_login!` (`game.rb:2141-2185`), generic refusal text `LOGIN_INCORRECT` (`game.rb:1810`), `record_login_failure!` (`:2867-2889`), lockout `account_locked_out_at?` (`:2257-2262`).
- **End-of-invite / sync.** `SYNC_STATE_COLUMNS` carries no `scenario_data` (`games_controller.rb:2021-2043`); `merge_global_variables!` (`game.rb:332-343`); the bootstrap gate `bootstrap_state_needs_write?` is a hard AND of predicates and `run_bootstrap_writers!` only runs under it (`game.rb:214-223`, `831-854`). The plan's new `credential_end_globals_stale?` term and the "cache missing on first sync, next bootstrap ends it" path are consistent with these.
- Validator hooks `known_top_level` (`validate_scenario.rb:730`), `known_item_fields` (`:846`), and the `check_*` convention; slice boundaries K0-K4; the implant session-shape reader (`network_access.rb:447-497`).

## M (major)

### M1. The relay invariant's "3.8 names every reader" claim is false: the session-shape implant reader is not listed, and a relay session satisfies it

- **Evidence.** Plan 3.7 (line 189): "A relay session is a sink ... Section 3.8 names every reader that enforces it." Plan 3.5 (line 159) and 1.1 (line 35): a relay "gives no network reach". The relay session record (3.8, line 193) carries `relay?` and no `foothold` key. Code: `implant_foothold!` session shape, `network_access.rb:476-480`: `session = access_sessions[pc_id]` then `return implant_not_ready unless session.is_a?(Hash) && session['foothold'].blank?`. The action "gives a foothold on the PC's own network" (`:449`). The comment at `:478-479` says it allows "a claim or a keyboard sign-in, never a live remote-through-foothold session" and never contemplates a relay session, which is also blank-foothold. A grep for every blank-foothold capability check returns this one line only.
- **Problem.** A relay session (blank `foothold`) qualifies as the plant-anchor for a `shape: "session"` implant. If any scenario places a session-shape implant action on a PC that is also relay-accessible (an account holder's PC reached by an assist invite), a player holding that relay could plant the implant and mint a persistent foothold, i.e. real, pivoting network reach from a session the plan guarantees gives none. Section 3.8 does not list `implant_foothold!` among the readers it changes, so a builder implementing K2 strictly from 3.8 leaves it unguarded, and the stated invariant guarantee is incomplete. It is not exploitable in `test_access_keyring` (no session-shape implant targets `jake_pc`), so no hole ships in phase 1; it would become a shipped hole the moment a scenario pairs the two.
- **Fix.** Name `implant_foothold!` (`network_access.rb:476-480`) in section 3.8 as a session reader changed in K2, and have the session-shape branch refuse a session carrying `relay` (require a non-relay, blank-foothold session). Add a unit test to `credential_sessions_test.rb` asserting a session-shape implant is refused while only a relay session is held at that PC.

## m (minor)

### m1. GET /keyring needs the row set and a read path, but is not in any before_action list the plan names

- **Evidence.** Plan 6.2 adds `GET /games/:id/keyring`. The controller resolves the game only for actions listed in `before_action :set_game` (`games_controller.rb:27-28`) and takes the lock for those in the `around_action :with_game_lock` list (`:97-99`). GET /keyring appears in neither list in the plan.
- **Problem.** A builder could ship the action without wiring `set_game`, giving a nil-game crash rather than a clean read; the plan says GET /keyring is "a read with no side effects" but does not state where in the before_action set it belongs (it should be in `set_game` but not in `with_game_lock`).
- **Fix.** State in K1 (6.1/6.2) that `keyring` joins the `set_game` `only:` list and stays off `with_game_lock`.

## n (nit)

### n1. Ruby file references in sections 2 and 3 use bare filenames

- **Evidence.** Section 2 and 3.5 cite `network_access.rb`, `capture_proofs.rb`, `game.rb` with line numbers; the header (line 3) only says engine paths are under `public/break_escape/js/`. The files live under `app/models/break_escape/` (section 6.1 does give the full path for the new concern).
- **Problem.** A builder may briefly hunt for the Ruby files. Line numbers are accurate.
- **Fix.** One line noting the Ruby readers are under `app/models/break_escape/`.

### n2. `start_login_session!` ends a guest session at the PC for every non-claim sign-in, including a relay

- **Evidence.** `game.rb:2914-2917`: `end_guest_session_at!(pc_id) unless via == 'claim'`. A relay sign-in (`via: "credential"`) would run this against the holder's own PC.
- **Problem.** Harmless in the test scenario (Jake has no guest session), but the plan's 3.8/7.2 do not mention that a relay sign-in also clears a guest record at the target PC; worth a note so the behaviour is intentional.
- **Fix.** Note in 7.2 that `start_login_session!` for a relay still runs the guest-end (one screen, one session) or guard it if that is not wanted.

## Points confirmed sound (no finding)

- `credential` added to `FORGEABLE_ITEM_FIELDS` strips it from client-built and always-allowed items; a scenario credential item is stored from the server copy (`canonical_inventory_item`), so neither a notepad nor a room add proves `held`.
- The generic refusal body matches `LOGIN_INCORRECT` ("Incorrect username or password") without `attemptsLeft`; the typed path counts, the credential path counts nothing.
- The bootstrap gate truly blocks the end-globals writer unless a new predicate is ORed in; the plan correctly requires `credential_end_globals_stale?`.
- The sync merge can end an invite from the cached `credentialEndGlobals` map with no `scenario_data` load (`SYNC_STATE_COLUMNS`), and the "cache missing then next bootstrap ends it" fallback is consistent.
- `resource_admits_player?` and `mapped_shares` would otherwise admit `finance_share` through Jake's relay (acl admits Jake, `server_lan` is linked); both are named in 3.8 for the relay skip, so the share path is covered.
- `signedInPcs` is grow-only and `start_login_session!` must skip it for a relay (named in 3.8), so a relay never satisfies a `session` proof or `account_capture_served?`.
- POST /login is under `with_game_lock`, so the K2 credential branch inherits the lock; GET /keyring is a side-effect-free read.
