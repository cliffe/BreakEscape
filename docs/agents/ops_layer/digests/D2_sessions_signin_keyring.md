# D2 digest: identities, sign-in PCs, sessions, policies, lockouts, keyring, capture proof

Worktree: `.claude/worktrees/ops-plan` (branch `docs/ops-layer-plan`). All paths are relative to that worktree root. Pointers are `file:line` on the state read for this digest.

## 0. How to read this digest

- **Read directly by this agent (code):** `lib/break_escape/access_identities.rb`, `credential_model.rb`, `owner_claim.rb`, `npc_habits.rb`, `npc_habits/clues.rb` (header and definitions only), `capture_model.rb` (key sections), `app/controllers/break_escape/games_controller.rb` (login, logout, lock_session, login_accounts, clone_card, capture_secrets, keyring, route param helpers), `app/models/break_escape/game.rb` (access state, login, claim, logout, lock, sessions, lockouts, tiles, postit, capture secrets gate), `app/models/break_escape/credential_login.rb` (whole), `app/models/break_escape/credential_keyring.rb` (lines 1-160 and a definition skim of the rest).
- **Read from the access doc, not re-checked against code by this agent:** `docs/ACCESS_AND_NETWORKS.md` sections A1 to A9, A15 and A16. Its line numbers are cited as "doc:N" and were taken from the doc.
- **Not read by this agent (unconfirmed):** the client files (`pc-sessions.js`, `workstation-state.js`, `keyring.js`, `captures.js`, `capture-client.js`), the minigame code, `capture_proofs.rb` beyond what the doc cites, `network_access.rb` (only the four helper defs were located), the validator bodies (`check_access_model`, `check_credentials`), the schema blocks, the scenario `PLAYTEST.md` files and the tests. Anything from those sources is marked "unconfirmed" or "doc-only".
- **Line drift:** several doc line numbers no longer match the code. Listed in section 9.

## 1. Data model

### 1.1 Account (NPC `creds`)

- An account is a **room NPC** (`rooms.<id>.npcs[]`) with `creds.username` set to a non-empty string. Code: `AccessIdentities.account?` `lib/break_escape/access_identities.rb:48-52`; `AccessIdentities.room_npcs` `:19-32` (only room NPCs may carry `role` and `creds`).
- Server-side account check: `Game.account_holder?` (called at `app/models/break_escape/game.rb:3170`, `account_for_username`) and `CaptureModel.account_holder?` `lib/break_escape/capture_model.rb:133-136` (present string test).
- Username normalisation: `strip.downcase[0, 64]`. `AccessIdentities.normalise_username` `access_identities.rb:54-56`; `CaptureModel.normalise_username` `capture_model.rb:50-52`; `Game.normalise_username` used in `game.rb:3436-3437` (`attempt_login!`).
- Password: `creds.password` is the only place a password is authored (doc:A1 row `creds.password`). Read by `attempt_login!` at `game.rb:3449-3461` (exact string match, `password.to_s == secret`). Never sent to the browser except via `GET /capture_secrets` (section 2.8).
- Card: `creds.card` (or legacy `rfidCard`). `AccessIdentities.npc_card` `access_identities.rb:34-41`; `card_id_of` `:43-46`; `cards` (card id to holders) `:257-268`.
- Roles: `identity_roles` `access_identities.rb:58-66`. Authored `role` (string or array) plus implicit `staff` when the NPC has `creds` or a card, unless `staff: false`.
- Dungeon-facing reach: `AccessIdentities.reach` `:291-306` returns card reach and account reach (which sign-in PCs each account is admitted to).
- Account-holder NPCs also carry `awareness` and `habits` (section 1.6), both withheld from the browser (section 4.1).
- Schema (doc only, unconfirmed by this agent): `creds.username` schema 4402, `creds.card` 4406, `role` 4394, `staff` 4412, `rfidCard` 4381, `cloneable` 4431 (doc:A1 table).

### 1.2 Sign-in PC

- A sign-in PC is an object with `lockType: "login"`. `AccessIdentities.login_pc?` `access_identities.rb:140-142`. Only objects under `rooms.<id>.objects` (recursing into `contents`) count: `room_objects` `:153-180`; `sign_in_pcs` `:225-227`.
- Also counted as a workstation: `workstation?` `:145-149` (login PC, or `workstation: true`, or the object has `locksScreenOnLeave` or `lockChance`).
- Owner: explicit `owner` (one NPC id string). `owner_id` `access_identities.rb:230-234`. The server reads it as `Game.login_pc_owner` `game.rb:3375-3381` (approx; inside the 3360-3420 block).
- Other PC fields read by the server: `access` (ACL, absent means every account is admitted: `game.rb:3352-3357` `pc_admits_account?`, and `access_identities.rb:285-289` `account_admitted?`), `loginPicker` (`game.rb:3868-3886`), `postitNote`, `showPostit` (`game.rb:3417-3437`), `policy` (name of a policy), `lockChance`, `locksScreenOnLeave`, `autoLockSeconds` (doc:A8 schema 5518), `host`, `remote` and `remoteScreen` (doc:A7, doc:A15).
- Lock fields for a PC: `lockChance` (number), `locksScreenOnLeave` (bool). Used by `AccessIdentities.screen_always_locks?` `:190-206`.
- Validator checks on sign-in PCs are in doc:A4 and doc:A8 (doc-only).

### 1.3 Policy

- Stored at top level `policies.<name>`; PC uses `policy`, else top-level `defaultPolicy`. Resolution: `Game.effective_policy` `game.rb:3360-3367` (`pc['policy'].presence || scenario_data['defaultPolicy']`); credential side `CredentialModel.policy_for` `credential_model.rb:163-168`.
- Policy fields (doc:A7 table; code paths):

| field | meaning | where read |
|---|---|---|
| `autoLockMin` | game minutes after owner leaves before an open screen locks; `0` locks on leave and blocks owner and guest claims; `null` no auto lock | `game.rb:3541` (owner claim refusal "policy autoLockMin is 0"); `game.rb:3607` (guest); client `workstation-state.js:415` (doc) |
| `maxAttempts` | failed sign-ins per PC and username before lockout; `null` no limit | `game.rb:3370-3374` `login_max_attempts`; `game.rb:4333-4357` `record_login_failure!` |
| `accepts` | credential kinds the PC takes; `password` always accepted | `credential_model.rb:30` (`DEFAULT_ACCEPTS`), `:104-117` (`accepts`, `accepts?`); `credential_login.rb:48-50` |
| `remoteScreen` | `tiles` or `typed` (typed: no account tiles on the remote screen until a password is right) | doc:A15 only; not read by this agent |
| `usb`, `social`, `remote` | other sections (doc:A10b, A11, N2) | not read |

- Default `accepts` when a policy names none: `password`, `saved_connection`, `assist_invite`, `token` (`credential_model.rb:30`).
- Unknown policy name: `effective_policy` returns `{}` (`game.rb:3360-3367`), so no `maxAttempts` or `autoLockMin`.
- The validator errors on a `defaultPolicy`/`policy` naming no entry (doc:A7, vs:7769-7776, doc-only).

### 1.4 Credential (keyring registry entry)

- Top-level `credentials` map, **server-only**. Registry reader `CredentialModel.registry` `credential_model.rb:91-101`: keys sorted, first `MAX_ENTRIES` (64) taken, non-Hash entries dropped.
- ID pattern `^[a-z][a-z0-9_]{0,63}$`: `credential_model.rb:40`.
- Kinds (`credential_model.rb:21-27`):

| kind | built | connects | routes | honours lockout |
|---|---|---|---|---|
| `password` | yes | no | none | no |
| `saved_connection` | yes | yes | `foothold`, `from` | yes |
| `assist_invite` | yes | yes | `relay` | no |
| `token` | yes | yes | `proof_foothold` | no |
| `hash` | no (phase 3) | - | - | - |

- Entry fields (doc:A15 table, schema 281-317 doc-only): `kind`, `account` (NPC id), `proof` (exactly one of `session`, `planted`, `dropped`, `held`, `foothold`: `PROOF_KINDS` `credential_model.rb:36`, `proof_kind` `:62-67`), `connectsTo` (sign-in PC id), `foundIn` (password only), `endsOnGlobal` (assist_invite only), `label` (token), `expiresMin` (token, integer 1-240: `TOKEN_MAX_MIN` `:33`, `token_expires_min` `:71-77`).
- Item carrying a credential: item field `credential` (registry id). Doc:A15 says it must be a tray type that is not notes-family or always-allowed; the restamp rule is `game.rb:749-775` (doc-only).
- Item definition lookup for held proofs: `CredentialModel.item_definition` `:210-251`; `held_item_given?` `:256-286`.
- Limits: 64 entries (`:39`), `endedCredentials` at most 64 (`credential_login.rb:151`), `credentialClock` at most 64, `keyringGained` at most 128 (doc notes in `game.rb:3021-3065` comments).

### 1.5 Capture proof

- Capture writers: any `{type: "add_capture", capture: {...}}` action or any `addCapture` mapping, anywhere in the scenario. `CaptureModel.each_capture_writer` `capture_model.rb:63-86` (walks the whole tree, skipping `_` notes by default).
- Proof kinds: `PROOF_KINDS` `capture_model.rb:32` (`planted`, `dropped`, `session`). Capture kinds: `CAPTURE_KINDS` `:37` (`credential`, `foothold`). Limits: `MAX_CAPTURE_NOTE_CHARS` 2000, `MAX_CAPTURE_FIELD_CHARS` 200, `MAX_CAPTURE_TARGET_CHARS` 100 (`:42-44`).
- Where a proof sits: `captureProof` list on the account-holder NPC (`captureProof` schema 4954, doc:A16) or shorthand `proof` inside an `addCapture` mapping (`shorthand_proofs` `capture_model.rb:139-153`, resolved by `address` username or, with no address, the mapping's owner NPC). `action_proofs` `:155-160` (validator refuses `proof` on `add_capture` actions, doc:A16).
- Proofs per holder: `CaptureModel.proofs_for` `capture_model.rb:163-167`. `declares_proofs?` `:170-173`.
- Proof check at the server: `capture_proof_holds?` in `app/models/break_escape/capture_proofs.rb:166-181` (doc:A16; not re-read); `account_capture_served?` `:210-222` (doc). Server state read: `plantedItems`, `gainedFootholds`, `droppedItems`, `signedInPcs` (doc).
- Recording a plant or drop: `CaptureProofs#record_capture!` `app/models/break_escape/capture_proofs.rb:246` (signature only read). Plant rules at `capture_proofs.rb:26-58` and `hide_device!` `:79` (doc).
- Captured secrets: stored in `player_state['seCaptures']` (server-owned record, `game.rb` `se_captures_record` near `:2530`). Served by `capture_secrets_for_client` (section 2.8).

### 1.6 Awareness and habits (NPC)

- `awareness` (`low`, `medium`, `high`) on room NPCs: `NpcHabits::LEVELS` `npc_habits.rb:18`; `level_with_source` `:60-72` (own level, else first identity role with a level under top-level `roles`).
- Presets (`npc_habits.rb:32-36`): low = `locksScreen never`, `holdsDoors true`; medium = `sometimes`, `true`; high = `always`, `false`. `writesDown` and `password` are in no preset.
- Habits (`npc_habits.rb:21-26`): `locksScreen` (`never`, `sometimes`, `always`; chance 0, 0.5, 1 at `:38`), `writesDown` (bool), `password` (`strong`, `guessable`, `reused`), `holdsDoors` (bool). Parameter: `passwordPattern` (`:29`).
- Folded office-life sub-blocks, not awareness habits: `screen`, `print`, `usb` (`:45`).
- `NpcHabits.expand!` `:127-176` writes presets into the saved scenario at load (called from `Game#prepare_scenario_data!`, doc:A9; `game.rb:2322` is the method start). It never raises (`rescue StandardError` `:171`).
- `habits.screen` filled from `locksScreen` onto the NPC's owned workstations: `fill_screen_habit!` `:195-218`.
- Gates: `holdsDoors` false writes the NPC into a gate's `noHold` (`gate_entries` `:225-243`, `doorway_problem` `:254-271`, `no_hold_for` `:277-283`).
- Password clues (authoring time only, never the server): `lib/break_escape/npc_habits/clues.rb` (524 lines; `module Clues` at `:17`; `pieces` `:29`; `readable_texts` `:83`; `secret_homes` `:323`; `backing` `:432`). Its header (`:1-16`) says it is validator and dungeon graph only.

### 1.7 Ownership of a workstation and the owner claim

- `OwnerClaim.leave_route` `lib/break_escape/owner_claim.rb:52-62`: precise routes first (`precise_route` `:69-127`), then a cautious layer (`might_leave` `:133-169`). Returns a label or nil. `never_leaves?` `:64-66`.
- Labels from `precise_route`: `knock_out` (`:74-75`), `answers_phones`, `prints`, `need:<name>:<id>`, `fails:<need>`, `interest:<tag>`.
- Cautious labels from `might_leave`: `patrol`, `scripted_move`, `ink_patrol`, `story_unread`, `social_media`, `station_hook`, `interest`, `phones`, `prints`, `movable`.
- `open_without_estimate?` `owner_claim.rb:229-240`: whether a leave can leave the PC open with no time estimate.
- Scenario object walk for claims: `scenario_objects` `:327-364` (every hash with a string id, anywhere; `held` flag for NPC records).

## 2. Server

### 2.1 Routes

Source: `config/routes.rb`. Controller: `app/controllers/break_escape/games_controller.rb`. `before_action :set_game` lists the session routes at `games_controller.rb:27-28` and `:104`.

| route | line (routes.rb) | controller | notes |
|---|---|---|---|
| `GET container/:container_id` | 27 | `container` `games_controller.rb:626` | desktop and folder contents; needs a session for profile and PC desktop (doc:A5, `gc:3105`) |
| `POST login` | 38 | `login` `:1516-1560` | section 2.2 |
| `POST logout` | 39 | `logout` `:1562-1573` | no checks; calls `logout_session!` |
| `POST lock_session` | 40 | `lock_session` `:1575-1588` | calls `lock_session!` |
| `GET login_accounts` | 41 | `login_accounts` `:1593-1640` | tiles; `Cache-Control: no-store` |
| `POST clone_card` | 42 | `clone_card` `:1655` | records a card copy |
| `GET capture_secrets` | 59 | `capture_secrets` `:1844-1853` | secrets for earned captures |
| `GET keyring` | 60 | `keyring` `:1862-1893` | earned credentials; `rev` digest |

### 2.2 `POST /login` (controller `games_controller.rb:1516-1560`)

Params read: `pc_id` (required), `claim` (`owner` or `guest`), `credential`, `foothold`, `from`, `relay`, `username`, `password`.

Branch order in the controller:

1. No `pc_id`: 400 `Missing pc_id` (`:1520-1521`).
2. `claim` present:
   - with `credential` or a `from` param: 422, message `Sign in required` (`BreakEscape::Game::LOGIN_CLAIM_REFUSED`, `game.rb:3082`). Code `:1528-1531`.
   - `claim == owner`: `claim_login_session!` (`game.rb:3527`).
   - `claim == guest`: `claim_guest_session!` (`game.rb:3597`).
   - anything else: 422 `Sign in required`.
3. `credential` present (`:1539-1548`):
   - with `username` or `password` too: `credential_login_refusal` (generic, uncounted).
   - else `attempt_credential_login!(pc_id, credential, login_route_params)`.
4. `relay` present: generic refusal, uncounted (`:1549-1551`).
5. Otherwise: `attempt_login!(pc_id, username, password, foothold:, from:, from_given:)` (`:1553-1555`).

Response: `render json: result[:body], status: result[:status]`.

### 2.3 `attempt_login!` check order (typed password)

`app/models/break_escape/game.rb:3444-3525`. In order:

1. `find_login_pc(pc_id)` (`:3208-3213`): unknown or not a sign-in PC in a room: 404 `Sign-in PC not found`.
2. Route branch:
   - `from_given` (K4): refused generically if a `foothold` is also named or the scenario declares no credentials (`:3449`); `from_route_refusal` `:3349` (network_access.rb `:1349`) gives `:generic` (generic refusal) or `:unreachable` (403 `PC not reachable`); host service off gives 403 `reason: not_responding`; `remote_blocked?` gives 422 `remoteBlocked: true`.
   - `foothold` present: `host_reachable_through?` else 403 `PC not reachable`; then off, then remote blocked (same shapes).
   - keyboard (no route): headless, or not reachable (`login_pc_reachable?`, `:3227-3229`), gives 403 `PC not reachable`; `host_service_off?` gives `pc_off_answer` (403, `reason: off`, `game.rb:3401-3403`).
3. Lockout key: `key = "#{pc['id']}|#{normalised}"` (`:3482-3483`). If `login_lockouts` includes the key: `login_locked_out_answer` (422, `lockedOut: true`, `attemptsLeft: 0`, message `This account is locked on this PC`) (`:4317-4320`). **This check runs before the password is compared.**
4. Account lookup: `account_for_username(normalised)` (`:3170-3174`). Secret is `npc['creds']['password']`.
5. Password match: `secret.is_a?(String)`, non-empty, `password.to_s == secret` (`:3485-3486`). **Unknown username and wrong password follow the same failure path** (`record_login_failure!`), with `account: !npc.nil?` as the only difference.
6. On a match: `pc_admits_account?` else 422 `This account can't sign in on this PC` with `notPermitted: true` (`:3488-3493`). Not counted.
7. On success: delete `loginFailures[key]`, `start_login_session!(pc_id, npc, 'password', ...)` (`:3495-3500`), `save!`, answer with `success: true` plus `login_session_answer` fields (section 2.6).
8. On failure: `record_login_failure!` (section 2.7).

### 2.4 `POST /login` with a claim

`claim_login_session!` `game.rb:3527-3585`. Every refusal is 422 `Sign in required` and logs the reason (`Rails.logger.info`). Refusal order:

1. Foothold present: refused ("an unlocked screen is physical"), `:3533`.
2. PC not found (`find_login_pc`).
3. Headless PC.
4. Not reachable (`login_pc_reachable?`).
5. Host service off: `pc_off_answer` (403, `reason: off`). `:3541`-ish (the off check is at `:3538`).
6. `session_held_at_keyboard?(pc)`: a session already held here (a non-relay, non-expired session). Refused.
7. No owner.
8. Owner not tracked by needs (`needs_tracked?`, `access_identities.rb:77-89`).
9. Owner has no account.
10. `pc_admits_account?` for the owner false.
11. `pc_always_locks?` (`game.rb:3394-3396`, delegates to `AccessIdentities.screen_always_locks?` `access_identities.rb:190-206`).
12. Owner locked out at this PC (`account_locked_out_at?`, `game.rb:3556`-area; reads `loginLockouts`).
13. Policy `autoLockMin` is numeric and 0.
14. `OwnerClaim.never_leaves?` true: refused "the owner never leaves the post".

Then `start_login_session!(pc, owner, 'claim')` and `save!`. The client's globals are logged only (`Rails.logger.info`, `:3564`-ish).

Doc:A6 says the owner claim is a "best effort" where honest play can always leave the screen open; the server refuses only when no movement source exists (doc:A6, q78).

### 2.5 Other session routes

- `POST /logout`: no checks. `logout_session!` `game.rb:3660-3675`: deletes the PC's session; if it was a `claim` and `guestSessions[key] == id`, calls `end_guest_session_at!`; `prune_unreachable_sessions!` (in `network_access.rb:1446`); `save!`. Returns ended PC ids. Controller adds `tokenExpiredPcIds` via `with_token_expired_pc_ids` (`games_controller.rb:1569-1571`).
- `POST /lock_session`: `lock_session!` `game.rb:3836-3858`:
  - no held session: 422 `No session is held at this PC`;
  - expired token session: same 422 (no prune);
  - `session_lockable?` false: 422 `Only a signed-in session can be locked`.
  - Otherwise `set_session_locked!(..., true)`, `save!`, answer `{ success: true, pcId:, locked: true }`.
- `session_lockable?` `game.rb:3824-3834`: `via == 'password'` is lockable; `via == 'credential'` is lockable when not a relay and it has a `foothold` or `from`. Claim, guest and relay sessions are not.
- `reload_ended_session_ids` `game.rb:3679`-ish: every `claim` session and every relay session. `end_claimed_sessions!` `game.rb:3689-3702` ends them on bootstrap, under `with_lock`, and prunes.
- `GET login_accounts` (`games_controller.rb:1593-1640`):
  - 400 `Invalid from` if a `from` param is malformed or the scenario declares no credentials (`:1608-1610`);
  - a `foothold` request goes to `remote_login_accounts` (`:1624-1628`);
  - keyboard path: not reachable or headless gives 403 `PC not reachable` (`:1631-1633`); `host_service_off?` gives 403 `{ error: PC_OFF_MESSAGE, reason: 'off' }` (`:1636-1638`);
  - answer `{ pc_id, loginAccounts: login_account_tiles }` plus `postitNote` only at the keyboard (`:1640-1644`).
- `login_account_tiles` `game.rb:3868-3886`: `loginPicker` `false` gives none; `known` filters on `encounteredNPCs`; tile keys are `username`, `displayName`, `portrait`, `avatar` only (`:3881-3886` region).
- `login_postit_for` `game.rb:3417-3437`: `"<username> / <password>"` when the owner is an account holder, `written_down?` (habit `writesDown` true, or a done `writes_down` workaround, `game.rb:3392-3400` region), the PC has no `postitNote`, and `showPostit` is not false.

### 2.6 Session shape and what it carries

- Stored in `player_state['sessions']`, keyed by PC id: `start_login_session!` `game.rb:4388-4418` writes `{ 'id' => npc id, 'via' => via }` plus, when present, `credential` (registry id), `foothold`, `from` (source PC id) and `relay: true`.
- `via` values seen in code: `password`, `claim`, `credential`. A `guest` session is written through `claim_guest_session!` (`game.rb:3597`), which was not read in full; whether it uses `via: 'claim'` is **unconfirmed** (doc:A6 lists `password`, `claim`, `credential` only).
- Identity carried: the NPC id (`id`). Access (what the session can reach) is not stored: it is recomputed on each read from the NPC id plus `access` lists (`session_identity` `game.rb:3243-3251`, `session_admits?` `:3260-3290`, `scope_admitted_by_session?` `:3296`-ish).
- There is no separate "user" or "admin" privilege field in the session. Identity is one NPC id. Privilege is whatever `acl_admits?` (roles or `people`) grants on the object being opened (`access_identities.rb:68-73`).
- `signedInPcs`: grow-only list of PC ids (`game.rb:4404-4408`). Not written for a relay, nor for a token sign-in (`:4399-4402`).
- `start_login_session!` replacing an existing session: `switched` sessions (a different account via `from`) and then `prune_unreachable_sessions!` (`:4415`); returns ended ids.
- Answer shape (`login_session_answer` `game.rb:4433-4460`): `npcId`, `username`, `displayName`, `via`, `portrait`, `avatar`; `kind`, `label`, `expiresInS` for credentials; `relay: true` and `host` for a relay; `remote`, `fromPcId`, `host`, `fromHost` for a `from` session; `footholdId`, `remote`, `host` for a foothold session. `locked: true` added by `session_for_client` (`game.rb:3778-3797` region).
- Scenario bootstrap sends `sessions_for_client` `game.rb:3725-3760` region: relay sessions and `from` sessions with a broken chain are dropped.
- Guest record: `guestSessions` (PC id to NPC id), `guestSessionsAt` (server time) (`ACCESS_STATE_DEFAULTS`, `game.rb:3021-3065`).

### 2.7 Lockout counting

- Key: `"<pcId>|<normalised username>"` (`game.rb:3482-3483`, `:4333` `record_login_failure!`).
- Failures are stored in `player_state['loginFailures'][key] = { 'n' => count, 'seq' => n }` (`game.rb:4333-4343`).
- Counted for every username, account or not (`account:` flag only changes the trim, `:4362-4374`). Non-account entries are capped at `MAX_NON_ACCOUNT_LOGIN_ENTRIES` = 200 (`game.rb:3077`), oldest `seq` dropped (`trim_non_account_failures!` `:4349-4357`).
- Failure answer: 422 `Incorrect username or password` with `attemptsLeft: max - count` or `nil` when no `maxAttempts` (`:4354-4356`).
- Lockout: when `count >= max`, `add_login_lockout!` writes the key into `loginLockouts` (array; `:4360-4372`; non-account cap 200), then the answer is `login_locked_out_answer`.
- `maxAttempts` read from `effective_policy` (`game.rb:3370-3374`). **No `maxAttempts` means no lockout ever.**
- Lockouts never expire (doc:A7, code shows no expiry). The key survives reload (`loginLockouts` in `player_state`; `lockout_pcs_for_client` `game.rb:3587-3594`, PC ids only, for the client's "lockout seen" mark).
- A correct password on a locked key is still refused: the lockout check precedes the password check (`game.rb:3482-3486`).
- Owner claim is refused for a locked-out owner (`account_locked_out_at?` `game.rb:3556`-area).
- Credential routes: a `saved_connection` honours lockouts (`credential_login.rb:59-62`, `credential_model.rb:23`); `assist_invite` and `token` do not (`credential_model.rb:24-25`). Credential refusals are never counted (`credential_login.rb:9-11`, `:76` note).
- Typed sign-in refused for `from` or foothold routes is not counted (`game.rb:3448-3451` and comments).

### 2.8 Withheld from the browser, and capture secrets

- `WITHHELD_NPC_KEYS = %w[creds awareness role workarounds]` `game.rb:7332`; applied at `game.rb:7376` (`npc.delete(key)`). The enclosing method name was not confirmed. Doc:A1 cites `game.rb:7290` (stale; section 9).
- Doc-only (not re-checked): `accountProfiles`, `policies`, `habits` (except `screen`, `print`, `usb`), `awareness`, `workarounds`, `creds`, `credentials` are server-only (doc:A5, A9; `x-serverOnly` in schema).
- Card: not secret. The browser gets `rfidCard` set from `creds.card` (doc:A1, `game.rb:7286-7289`).
- Login PC: the bootstrap carries `loginAccounts` and `hasPostit: true`, never the note text (`attach_login_accounts!` `game.rb:4465`).
- `GET /capture_secrets` (`games_controller.rb:1844-1853`): body `{ secrets: capture_secrets_for_client }`, plus `accounts` when `network_scenario?`.
- `capture_secrets_for_client` `game.rb:2547-2600`:
  1. `{}` unless `reveal_capture_secret?` (`game.rb:2512-2516`: `social.captures.revealSecret == true`).
  2. Reads `se_captures_record` (`player_state['seCaptures']`, with a legacy `globalVariables.se_captures` fallback marked `proven: true`, `game.rb:2521-2540` region). Empty gives `{}`.
  3. Per earned entry: skip unless `kind` is `credential` or absent; skip unless the target id is declared (`declared_capture_target_ids`); skip unless `capture_revealable?` (evidence check, section 6b in comments).
  4. Secret order: landing page secret by address, then account password by username (`account_capture_passwords` `:2692`), then the single landing-page secret for a phish target, then the authored secret for the target id (`authored_capture_secret`).
- Keyring implicit entries: one per captured account, id `<npcId>.password`, password only when `capture_secrets_for_client` serves it (`credential_keyring.rb:263-285`).
- `POST /clone_card`: records a card copy (`record_card_clone!`, `games_controller.rb:1655-1665`; model side not read). Doc:A3: needs a held `rfid_cloner` ("No card copier"), NPC source must have a card and be encountered, `cloneable: false` refuses.

### 2.9 Keyring without a password

- `attempt_credential_login!` `credential_login.rb:22-89`, steps in order:
  1. PC exists (404 `Sign-in PC not found`).
  2. `provable_connecting_credential(cred_id)` (`:174-185`): id pattern, registry entry, built connecting kind, `credential_proof_holds?`. Otherwise `credential_login_refusal` (generic `Incorrect username or password`, `:16-18`), so steps 1 and 2 cannot be used to probe.
  3. `connectsTo` must equal the PC id: else 422 `This connection is for another PC`, `wrongPc: true`.
  4. Route check: `token_route_refusal` for a token, else `credential_route_refusal` (`:191-227`). One route only; allowed by `KINDS[kind][:routes]`; foothold gives 403 `PC not reachable`, then off (`not_responding`), then `remoteBlocked`.
  5. `accepts?(policy, kind)` else 422 `{ kindRefused: kind }`.
  6. `pc_admits_account?` else 422 `LOGIN_NOT_PERMITTED`.
  7. Lockout for kinds that honour it: 422 `LOGIN_LOCKED_OUT` with `lockedOut: true`.
  8. `assist_invite` ended (`endedCredentials`): 422 `{ ended: true }`. Token expired: 422 `{ expired: true }`.
  9. `start_login_session!(..., 'credential', credential:, foothold:, relay:, from:)`, token clock stamped, `save!`, answer with `route` (`relay`, `from` or `foothold`).
- `credential_proof_holds?` `credential_keyring.rb:21-36`: `session`, `planted`, `dropped` go to `capture_proof_holds?`; `held` goes to `credential_held_proof_holds?` `:42-64` (inventory entry with matching `credential`, `type` and `id`, not `client_forged?`); `foothold` checks `player_state['footholds']` key.
- Relay sessions: not a lasting sign-in (not in `signedInPcs`). Relay ends when the invite's global becomes true (`credential_login.rb:139-168`, `apply_credential_end_globals!`).
- Keyring read: `GET /keyring` (`games_controller.rb:1862-1893`):
  - 400 `Invalid from` unless the scenario declares credentials and the `from` param is valid (`:1866-1868`);
  - route from `relay`, `from` or `foothold` (`:1870-1874`);
  - `keyring_for_client(pc_id:, route:, stamp: true)` `credential_keyring.rb:74-85`: stamps `keyringGained` under lock only when entries lack one (`:76`);
  - `rev` digest (`keyring_rev` `:238-240`, MD5 first 6 characters) and `unchanged: true` answer when the client's `rev` matches (`:1880-1890`); `expiresInS` for live tokens rides on the unchanged answer.
  - `Cache-Control: no-store`.
- Token clock: starts when the proof foothold is gained (`start_token_clocks!` `credential_keyring.rb:155-165`); `stamp_token_clock!` for older saves; `token_expired?` `:114-125`; `credential_session_expired?` `:141-145` is the one expiry predicate.
- Lock of a credential session: `session_lockable?` (section 2.5).

### 2.10 Capture proof served only once held

- `capture_proof_holds?` (`capture_proofs.rb:166-181`, doc-only): reads `plantedItems`, `gainedFootholds`, `droppedItems`, `signedInPcs`.
- `account_capture_served?` (`capture_proofs.rb:210-222`, doc-only): strict rule when any proof is declared and the password opens something.
- Plants: recorded only for a held, non-forged item, an object that takes and consumes it, a USB policy that accepts it, an unlocked room (`capture_proofs.rb:26-58`, doc-only).

### 2.11 Server-owned globals and state keys

- `ACCESS_STATE_DEFAULTS` `game.rb:3021-3065`: keys `sessions`, `signedInPcs`, `loginFailures`, `loginLockouts`, `copiedItems`, `serverClones`, `footholds`, `gainedFootholds`, `plantedItems`, `droppedItems`, `seLandingPages`, `sePhishSends`, `npcFrustration`, `guestSessions`, `sharedLogins`, `guestSessionsAt`, `feedRevealed`, `endedCredentials`, `credentialEndGlobals`, `credentialClock`, `keyringGained`, `pinDusted`. Comment says none is on `reset_player_state!`'s preserved list, so a reset drops them all.
- `SERVER_OWNED_GLOBAL_NAMES = %w[se_captures]` (`game.rb`, near `:3093`-ish; exact line **unconfirmed**). The comment says `scripts/validate_scenario.rb` hardcodes the same list and a test (`carry_over_server_owned_globals_test`) keeps them in sync. Add in both places.
- `REVOKED_CARDS_GLOBAL = 'revoked_card_ids'` (`game.rb`, near `:3093`, merged grow-only).
- Sync rule (from comments): server-written keys are never read from a sync body and never sent to the client; `sessions` is written by the server only.

## 3. Client (described from the doc; code not read by this agent unless stated)

- **Sign-in flow.** Clicking a sign-in PC calls `GET login_accounts` (doc:A4). The screen shows tiles, or a username box when `loginPicker: false`. A password is posted to `POST /login`. A good answer opens the desktop. A failure shows `attemptsLeft` when present.
- **Desktop.** `GET container/:id` (doc:A5). Lock and Sign out buttons; the Lock button shows only when `sessionLockingSupported` (doc:A6, `gc:443`).
- **Owner claim.** Client sends `POST /login` with `claim: "owner"` and the workstation globals (logged only). Client decides the owner has left via `workstation-state.js` `decideLocked` `:143-165` (doc:A8).
- **Events** (doc:A4, A8; line numbers from the doc, unconfirmed): `pc_signed_in` `{ pcId, npcId, username, via, previousNpcId, firstAtPc, token, remote fields }` (`pc-sessions.js:788`); `pc_signed_out` with reasons `sign_out`, `displaced`, `switch`, `claim_ended`, `owner_returned`, `auto_locked`, `no_session`, `token_expired`, `link_dropped`, `relay_ended`; `pc_signin_failed` `{ pcId, reason, attemptsLeft, credential }`; `pc_signing_out`; `pc_in_use`; `pc_session_locked`; `pc_signin_shown`; `pc_desktop_opened`. Each also emitted as `<name>:<pcId>` (`pc-sessions.js:340`). Credential sign-ins raise `pc_signed_in` with `via: "credential"` (`:623`).
- **Workstation events** (doc:A8): `workstation_screen_changed:<id>`, `workstation_auto_locked:<id>`, `workstation_owner_left:<id>`, `workstation_owner_returned:<id>`, `workstation_accessed:<id>`, `workstation_locked_attempt:<id>`.
- **Keyring client** (doc:A15): `keyring.js` caches `GET /keyring` answers per PC and route with `rev`; asks only when `credentialsDeclared`. Event `keyring_changed { rev }` (`keyring.js:790`).
- **Captures:** `captures.js` and `capture-client.js` not read. Doc:A16 says the client capture log is in `public/break_escape/js/minigames/capture-log/` (unconfirmed).
- **Authenticator and dual-auth minigames:** present in `public/break_escape/js/minigames/authenticator/` (`authenticator-minigame.js`, `authenticator-model.js`) and `dual-auth/` (`dual-auth-minigame.js`, `dual-auth-text.js`). Purpose, parameters and server talk **unconfirmed** (not read). Scenarios whose files match `authenticator` or `dual-auth` (grep hit, not opened): `scenarios/ca09_passwords`, `ca06_texts_and_qr`, `ca09_passwords_defend`, `ca_pre_general_v2_ab`, `sis01_healthcare`, `ca06_texts_and_qr_defend`, `ca_post_general_v2_ba`. Those hits may be text, not the minigame type; **unconfirmed**.
- **Sign-in screen minigame:** the only file under `public/break_escape/js/minigames` that mentions `loginPicker` is `password/password-minigame.js` (grep). Whether that file is the sign-in screen, and whether the desktop minigame is elsewhere, is **unconfirmed**.

## 4. NPC presence and "work use" at a PC

- **Server knows a session, not presence.** The server records an NPC as signed in at a PC only through `sessions[pcId].id` (`game.rb:4388-4418`), written when the player signs in or claims. A claim requires the owner to be tracked and to pass static checks (section 2.4); the server does not see NPC positions (`owner_claim.rb:9-13` comment: "the server cannot see NPC positions or the seeded screen roll").
- **Leave and lock are client-only.** Whether the owner has left the post, the screen roll and the lock decision run in `workstation-state.js` (doc:A8; `decideLocked` `:143-165`, `_rollScreen` `:408`, `lockAt` `:415`, idle `:433-440`). The server mirrors the lock rule statically (`screen_always_locks?` `access_identities.rb:190-206`) and checks policy separately (`game.rb:3541`).
- **Owner-is-tracked and never-leaves are static.** `OwnerClaim` answers from scenario data (`owner_claim.rb:52-66`).
- **Workarounds and frustration** are server-held: `npcFrustration` (`game.rb:3036-3037`) and `workaround_done_kind?` used by `written_down?` (`game.rb:3392-3400` region). Client workaround logic not read.
- **Work use at a PC** (a judged need using a desk): the server has `AccessWork` (`access_work.rb`, not read) and `OwnerClaim` reads the shipped plan (`owner_claim.rb:309-313`). Whether any work use is recorded on the server (as opposed to client-only) is **unconfirmed**.
- **Conclusion for planners (inferred from the above):** the server's record of a PC occupant is the `sessions` entry plus `signedInPcs` (PC ids only, grow-only). Presence at the desk, leaving, and work use are client-only today unless a later sync writes them.

## 5. Validator, schema, dungeon graph

- **`check_access_model`** `scripts/validate_scenario.rb:7642` (signature read). Doc-only check list (doc:A1 to A9 cite old line numbers, 7518 onward; the body was not read by this agent):
  - `creds.password` required with username (doc: 7564); unique usernames (doc: 7595-ish);
  - `usePayload` and `addCapture` address/secret must match `creds` (doc: 7570-7590);
  - `role` or `creds` off room NPCs is an error (doc: 7550);
  - keycard `identity` must name an NPC with the same `card_id` (doc: 7846-7852);
  - `access` on doors is an error, put it on the room (doc: 7936); `access` on a gate door is an error (doc: 7970);
  - profile with nobody admitted: warning (doc: 7746); profile item ids unique (doc: 7823-7840);
  - rfid lock with neither `requires` nor `access`: error (doc: 7880); `requires` must name a card someone carries (doc: 7886);
  - unknown `people` id error; role no NPC holds, warning (doc: 7757-7762);
  - PC id must not contain `|` (doc: 8031); `triggerOnInteract` on a sign-in PC is an error (doc: 8034); `unlockable` naming a sign-in PC is an error (doc: 8040-8048);
  - owner must be a room NPC (doc: 8057); owner who never leaves: warning (doc: 8061); `lockChance` strictly between 0 and 1: warning (doc: 8063); owner not needs-tracked: warning (doc: 8068); `maxAttempts` at a sign-in PC: warning "a lockout lasts the mission" (doc: 8070); owner placed in a different room: warning (doc: 8106); account whose `needsHome` PC excludes it: warning (doc: 8095);
  - password text must not appear in any ink (doc: 8157); `#clone_keycard:<id>` for another NPC's card: warning (doc: 8167); shared card at an access lock: warning (doc: 8180-8186); identity-reach info lines (doc: 8189-8198).
- **`check_credentials`** `scripts/validate_scenario.rb:7304` (doc:A15 says 7181; the body was not read). Doc-only list: id pattern, kind built, `accepts` kinds, token `label` and `expiresMin`, account is an account holder, password `foundIn` and `connectsTo` rules, `endsOnGlobal` must be a declared global, proof exactly one of five, `session` PC must be a sign-in PC, `held` item rules, foothold names reachable. Warnings for unbacked `accepts`, unused PC, credential not carried, label over 32 characters.
- **Capture log validator** `scripts/validate_capture_log.rb` (doc:A16; called at `validate_scenario.rb:8815`, doc). Not read.
- **Habits validator** `scripts/validate_npc_habits.rb` (called at `validate_scenario.rb:8824`, doc:A9). Errors: habits on a non-room NPC, invalid level or habit values, `passwordPattern` naming no object. Warnings: `locksScreen` with no workstation, `holdsDoors false` with no gate, password claims not backed (doc:A9). Not read.
- **Shared model:** `AccessIdentities`, `CredentialModel`, `CaptureModel`, `NpcHabits` and `OwnerClaim` are plain Ruby so the validator and graph generator can `require_relative` them (`access_identities.rb:6-15`, `credential_model.rb:8-11`, `capture_model.rb:16-22`).
- **Dungeon graph:** `AccessIdentities.reach` (`access_identities.rb:291-306`) is the identity input to the graph. Doc:A2 says the lock-key tools read it (`ai:294`). Not verified beyond that.
- **Schema:** the schema blocks named in the prompt (`policies`, `accountProfiles`, `credentials`, `creds`, `habits`) were **not located** by this agent. Doc-only line references: `accountProfiles` 245; `autoLockMin` 269; `maxAttempts` 270; `defaultPolicy` 280; `credentials` 281-317; `roles.awareness` 376; `access` 3934; `creds.username` 4402; `creds.card` 4406; `staff` 4412; `awareness` 4413; `habits` 4414-4424; `captureProof` 4954; `lockType` 5278; `workstation` 5515-5518; `loginPicker` 5522; `policy` 5523; `transfer` 5654. All unconfirmed.

## 6. Tests, feature scenarios and playtests

- **Feature scenarios** (directories exist): `scenarios/test_access_signin`, `test_access_sessions`, `test_access_keyring` (each with `scenario.json.erb`, `mission.json`, `ink/`, `dungeon_graph.*`, and `PLAYTEST.md`; `test_access_signin` and `test_access_sessions` also have `reports/`). Also `test_access_habits`, `test_access_doors`, `test_access_networks`, `test_access_devices`, `test_access_work`, `test_access_social`, `demo_access_tour` (doc names it), `lab_physical_pentest` (doc names it).
- **Best demos per doc:** `test_access_signin` (accounts, tiles, profiles, `autoLockMin`, `maxAttempts`), `test_access_sessions` (claim, lock, logout), `test_access_keyring` (saved connection, password, assist invite, foothold-proof cookie, `expiresMin`), `test_access_habits` (all habits), `test_access_doors` (cards, `acceptsUIDOnly`), `lab_physical_pentest` (capture proofs, awareness). Doc:A15, A16, A4, A6, A9 (doc-only).
- **PLAYTEST.md contents:** not read; **unconfirmed** how each playtest asserts server state.
- **Tests:** no top-level file in `test/` matched `login`, `session`, `keyring` or `lockout` by filename (grep returned nothing). Doc cites `test/unit/pc_screen_lock_precedence_test.rb` (`access_identities.rb:182-183`) and `carry_over_server_owned_globals_test` (`game.rb` comment). The full test layout (likely under `test/unit/` or `test/`) was **not** surveyed; **unconfirmed**.
- **How scripted playtests assert server state:** not confirmed. The playtest skill and `window.__test` bridge exist (per the project skill list), but the sign-in assertions in these PLAYTEST.md files were not read.

## 7. Extension points and constraints (facts, not recommendations)

- **New field on a session.** Session record is written in one place, `start_login_session!` (`game.rb:4388-4418`), and read by `session_for_client` (`game.rb:3778`), `login_session_answer` (`game.rb:4433`), `session_identity` (`game.rb:3243`), `sessions_for_client` (`game.rb:3725`), `session_lockable?` (`game.rb:3824`) and `credential_session_expired?` (`credential_keyring.rb:141`). A session value that must survive reload goes through `sessions_for_client`. Sync: `sessions` is server-owned (`ACCESS_STATE_DEFAULTS`, `game.rb:3021-3065`); a new key needs an entry there and a decision on reset (not on `reset_player_state!`'s preserved list).
- **New policy field.** Read through `effective_policy` (`game.rb:3360-3367`) or `CredentialModel.policy_for` (`credential_model.rb:163-168`). Validator must accept the key in the schema (doc-only: `policies` schema block, not located). Policies are static at run time (doc:A7).
- **New sign-in step.** Typed path: `attempt_login!` (`game.rb:3444-3525`), order in section 2.3. Claim path: `claim_login_session!` (`game.rb:3527-3585`). Credential path: `attempt_credential_login!` (`credential_login.rb:22-89`), steps 1 to 9. Refusals must stay generic where the doc says so (`credential_login.rb:9-11`). A new step must not count a lockout where route refusals are uncounted (`game.rb:3448-3451`).
- **New keyring credential kind.** Add to `CredentialModel::KINDS` (`credential_model.rb:21-27`), `PROOF_KINDS` if a new proof, `DEFAULT_ACCEPTS` if default-accepted (`:30`), the route in `credential_route_refusal` (`credential_login.rb:191-227`) or `token_route_refusal` (`:232-246`), the entry builder in `registry_keyring_entries` (`credential_keyring.rb:312-330`, with `registry_connecting_entry` `:345` and `registry_token_entry` `:389`), and the validator (`check_credentials`, `validate_scenario.rb:7304`). `KINDS[:built]` gates the validator error "not supported until phase 3" (doc:A15).
- **New capture proof kind.** `PROOF_KINDS` (`capture_model.rb:32`), `proof_satisfiable?` (`capture_model.rb:453`), `capture_proof_holds?` (`capture_proofs.rb:166`, doc-only), and `CredentialModel::PROOF_KINDS` (`credential_model.rb:36`) if a credential can use it.
- **Constraints recorded in code comments:**
  - `held` proof is identity-strict: type, id and stored `credential` must all match the authored definition (`credential_keyring.rb:38-64`; `credential_model.rb:203-209`).
  - Registry capped at 64 entries; non-account lockout and failure entries at 200 (`credential_model.rb:39`, `game.rb:3077`).
  - The client never receives `creds`, `awareness`, `role`, `workarounds` or the registry (`game.rb:7332`; `credential_keyring.rb:12-15`).
  - Lockouts never expire (doc:A7; no expiry code seen).
  - Claims are refused through a foothold, from a `from` param, and with a `credential` param (`games_controller.rb:1528-1531`; `game.rb:3533`).
- **Shared model constraint:** `AccessIdentities`, `CredentialModel`, `CaptureModel`, `NpcHabits`, `OwnerClaim` must stay plain Ruby with no ActiveSupport so the validator can require them (`access_identities.rb:6-15`; `credential_model.rb:8-11`; `capture_model.rb:16-22`). `OwnerClaim` requires `access_work`, `author_notes` and `scenario_schema` (`owner_claim.rb:3-6`).
- **Server-owned globals list is duplicated** (`game.rb` comment; `scripts/validate_scenario.rb`). A new server-owned global must be added in both.
- **Sync delta constraints** (from comments, `game.rb:3021-3065`, `credential_login.rb:106-107`): server-only keys are never read from a sync body and never sent to the browser; bounded in size.
- **Known oddities to keep** (from doc:A8 and A9 and `access_identities.rb:182-202`): a PC's own `lockChance` or `locksScreenOnLeave` beats the owner's habit; a negative `lockIfAwayOverSeconds` never meets the threshold.

## 8. Discrepancies and open items

- **Doc vs code, line drift:** `WITHHELD_NPC_KEYS` doc:A1 says `game.rb:7290`; code `game.rb:7332`. `check_access_model` doc:A1 says `validate_scenario.rb:7518`; code `:7642`. `check_credentials` doc:A15 says `:7181`; code `:7304`. `reset`, `keyring` and other doc line cites were not re-checked.
- **Doc vs code, autoLockMin:** doc:A7 says `autoLockMin` is a policy field and README:1210 mislabels it as an object field (object field is `autoLockSeconds`, doc:A8). Code: `game.rb:3541` reads `effective_policy(pc)['autoLockMin']`, consistent with the policy reading.
- **Doc vs code, token:** doc:A15 says the plan (`CREDENTIAL_KEYRING_PLAN.md:175`) shows token as not built until K5, but `credential_model.rb:25` builds it (doc says so too).
- **Doc vs code, holdsDoors:** doc:A9 says `ACCESS_MODEL_SLICE_9_1_CODE_REVIEW_R1.md:244` calls holdsDoors "not built"; `npc_habits.rb:127-176` builds it. The review file is stale.
- **Doc vs code, sessions "via":** doc:A6 lists `password`, `claim`, `credential`. Guest session `via` is **unconfirmed**.
- **Unconfirmed in full:** client `pc-sessions.js` and `workstation-state.js` bodies; `keyring.js` rendering; `captures.js`, `capture-client.js`; minigames `authenticator`, `dual-auth`; `network_access.rb` beyond four helper lines; `capture_proofs.rb` beyond the doc cites; validator bodies; schema file location and blocks; tests and PLAYTEST.md files.
- **Not built:** `hash` kind and machine accounts (doc:A15, phase 3). No per-entry teaching text override (doc:A15, no backlog entry found). A saved connection is refused for the rest of the game once its PC locks out (doc:A15).
- **Unverified (doc):** README sections 1594 onwards for keyring not compared (doc:A15).

## 9. Quick pointer index

| topic | file:line |
|---|---|
| account test | `lib/break_escape/access_identities.rb:48-52` |
| identity roles | `lib/break_escape/access_identities.rb:58-66` |
| card read | `lib/break_escape/access_identities.rb:34-46`, `:257-268` |
| sign-in PC test | `lib/break_escape/access_identities.rb:140-149`, `:225-227` |
| lock list (rfid and PC) | `lib/break_escape/access_identities.rb:238-255` |
| screen always-locks rule | `lib/break_escape/access_identities.rb:190-206` |
| reach (identity output) | `lib/break_escape/access_identities.rb:291-306` |
| credential kinds | `lib/break_escape/credential_model.rb:21-27`, `:30`, `:36`, `:39-40` |
| registry reader | `lib/break_escape/credential_model.rb:91-101` |
| accepts | `lib/break_escape/credential_model.rb:104-117` |
| item definition (held) | `lib/break_escape/credential_model.rb:210-251` |
| owner claim routes | `lib/break_escape/owner_claim.rb:52-66`, `:69-127`, `:133-169` |
| habit presets | `lib/break_escape/npc_habits.rb:32-36`, `:38`, `:127-176` |
| capture writers and proofs | `lib/break_escape/capture_model.rb:32`, `:37`, `:63-86`, `:139-173` |
| served capture writers | `lib/break_escape/capture_model.rb:511-559` (approx) |
| routes | `config/routes.rb:27`, `:38-42`, `:59-60` |
| login controller | `app/controllers/break_escape/games_controller.rb:1516-1560` |
| logout | `app/controllers/break_escape/games_controller.rb:1562-1573` |
| lock_session | `app/controllers/break_escape/games_controller.rb:1575-1588` |
| login_accounts | `app/controllers/break_escape/games_controller.rb:1593-1644` |
| clone_card | `app/controllers/break_escape/games_controller.rb:1655` |
| capture_secrets | `app/controllers/break_escape/games_controller.rb:1844-1853` |
| keyring route | `app/controllers/break_escape/games_controller.rb:1862-1893` |
| access state keys | `app/models/break_escape/game.rb:3021-3065` |
| login constants | `app/models/break_escape/game.rb:3077-3082` |
| session identity and admits | `app/models/break_escape/game.rb:3243-3290` |
| policy read | `app/models/break_escape/game.rb:3360-3367` |
| pc admits account | `app/models/break_escape/game.rb:3352-3357` |
| pc always locks | `app/models/break_escape/game.rb:3394-3396` |
| postit | `app/models/break_escape/game.rb:3417-3437` |
| attempt_login | `app/models/break_escape/game.rb:3444-3525` |
| claim_login_session | `app/models/break_escape/game.rb:3527-3585` |
| lockout tiles (PC ids) | `app/models/break_escape/game.rb:3587-3594` |
| claim_guest_session | `app/models/break_escape/game.rb:3597-3610` (approx) |
| logout_session | `app/models/break_escape/game.rb:3660-3675` |
| end_claimed_sessions | `app/models/break_escape/game.rb:3689-3702` |
| session_for_client | `app/models/break_escape/game.rb:3778-3797` (approx) |
| lock predicates | `app/models/break_escape/game.rb:3809-3834` |
| lock_session | `app/models/break_escape/game.rb:3836-3858` |
| login account tiles | `app/models/break_escape/game.rb:3868-3886` |
| lockout answer and failure count | `app/models/break_escape/game.rb:4317-4375` |
| start_login_session | `app/models/break_escape/game.rb:4388-4418` |
| login_session_answer | `app/models/break_escape/game.rb:4433-4460` |
| attach_login_accounts | `app/models/break_escape/game.rb:4465` |
| WITHHELD_NPC_KEYS | `app/models/break_escape/game.rb:7332` (use at `:7376`) |
| reveal gate | `app/models/break_escape/game.rb:2512-2516` |
| capture secrets for client | `app/models/break_escape/game.rb:2547-2600` (approx) |
| credential login | `app/models/break_escape/credential_login.rb:22-89` |
| credential refusal and routes | `app/models/break_escape/credential_login.rb:16-18`, `:191-246` |
| end invites | `app/models/break_escape/credential_login.rb:112-168` |
| keyring reader | `app/models/break_escape/credential_keyring.rb:21-85` |
| token clock and expiry | `app/models/break_escape/credential_keyring.rb:97-165` |
| implicit password entries | `app/models/break_escape/credential_keyring.rb:263-285` |
| validator check_access_model | `scripts/validate_scenario.rb:7642` |
| validator check_credentials | `scripts/validate_scenario.rb:7304` |
| validator habits and capture log | `scripts/validate_scenario.rb:8815`, `:8824` (doc) |
| login minigame (grep only) | `public/break_escape/js/minigames/password/password-minigame.js` |
| authenticator minigame | `public/break_escape/js/minigames/authenticator/authenticator-minigame.js` (not read) |
| dual-auth minigame | `public/break_escape/js/minigames/dual-auth/dual-auth-minigame.js` (not read) |
| client pc sessions | `public/break_escape/js/systems/pc-sessions.js` (not read; doc cites `:340`, `:453`, `:623`, `:788`) |
| client workstation | `public/break_escape/js/systems/workstation-state.js` (not read; doc cites `:143-165`, `:408`, `:415`, `:433-440`) |
| client keyring | `public/break_escape/js/systems/keyring.js` (not read; doc cites `:790`) |

## 10. Gaps this digest does not close

- Client bodies (section 3) and the validator bodies (section 5).
- Schema blocks and file (section 5).
- The sign-in screen and desktop minigame code (section 3).
- Test files and PLAYTEST.md assertions (section 6).
- Guest session `via` and `claim_guest_session!` body (section 2.6).
- `network_access.rb` helpers used by the login path (`host_reachable_through?`, `remote_blocked?`, `host_service_off?`, `from_route_refusal`, `prune_unreachable_sessions!`): called but not read.
