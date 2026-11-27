# D6. Locks and the unlock path (digest)

Worktree: `/home/cliffe/Files/Projects/Code/BreakEscape/BreakEscape/.claude/worktrees/ops-plan`. Paths below are relative to it. Line numbers were read from the files at this commit. Entries marked **(inferred)** are my reading, not something the code states.

Scope note: this covers the lock model, the server unlock route and the client unlock flow. It does not design anything.

## 1. Lock types and their fields

### 1.1 Scenario schema

- Door (room `doors[]` entry) lock fields: `scripts/scenario-schema.json:4170-4173` (`locked`, `doors` description), `:4219` (`lockType` enum: `key, pin, rfid, password, bluetooth, biometric, flag, ransomware_display, network_architecture, alarm_panel, combination, cryptex, ble`), `:4221` (`access`), `:4222` (`acceptsUIDOnly`), `:4223` (`maxAttempts`), `:4224` (`lockoutSeconds`), `:4227-4238` (`requires`, a string or array; `x-serverOnly` with `unlessLockType: [biometric, bluetooth, rfid]` at `:4228`), `:4234` (`combination`), `:4240` (`keyPins`), `:4246` (`lockedHint`), `:4247` (`difficulty`).
- Room-level lock fields (rooms, which are doors): the room schema is at `:4161-4175` region; `locked` is at `:4170`.
- Object lock fields (`rooms.*.objects[]`, containers, NPC `itemsHeld`): `:5161` (`locked`), `:5279-5282` (`lockType` enum: as the door list plus `login`), `:5283-5289` (`requires`, `x-serverOnly` at `:5284`), `:5290` (`combination`), `:5295` (`cryptexConfig`), `:5298` (`keyPins`), `:5302` (`lockedHint`), `:5304` (`difficulty`), `:5313` (`maxAttempts`), `:5314` (`lockoutSeconds`), `:5511` (`owner`, string or array of NPC ids, `x-ref: npc`), `:5521` (`access`, using the `accessList` definition at `:3934`).

### 1.2 Lock types and the fields each uses

Source: `README_scenario_design.md:674-685` (table "Lock Types"), `:688-693` (example). Client and server code cited per row.

| lockType | `requires` | Other fields | Client minigame | Server method accepted |
|---|---|---|---|---|
| `key` | key id, matched to a key's `opens_lock` | `keyPins` (lock and key) | key selection or lockpick (`unlock-system.js:1063`, `:1123`, `:1153`) | `key`, `lockpick` (`game.rb:4491-4492`) |
| `pin` | digits string | `dustable`, `dustHint`, `maxAttempts`? (see §3) | `startPinMinigame` (`unlock-system.js:1205-1208`) | `pin` (`game.rb:4493`) |
| `password` | string | `showKeyboard`, `passwordHint`, `showHint`, `postitNote`, `showPostit`, `maxAttempts`, `lockoutSeconds` | `startPasswordMinigame` (`unlock-system.js:1215-1235`) | `password` (`game.rb:4494`) |
| `rfid` | card ids (string or array) | `access` (access list), `acceptsUIDOnly` | RFID minigame (`unlock-system.js:1388-1494`) | `rfid` (`game.rb:4499`) |
| `bluetooth` | device MAC | needs `bluetooth_scanner` tool | bluetooth path (`unlock-system.js:1305-1357`) | `bluetooth` (`game.rb:4497`) |
| `ble` | device | `startBleScannerMinigame` (`unlock-system.js:1358-1387`) | `ble` (`game.rb:4498`) | |
| `biometric` | owner name | `biometricMatchThreshold` (0 to 1) | `startFingerprintReader` (`unlock-system.js:1295-1299`) | `biometric` (`game.rb:4496`) |
| `flag` | `"vm_name:flag_id"` | `flagRewards` on stations | none in `unlock-system.js` (no case); `interactions.js:1793-1800` opens a `flag-station` minigame in `mode: 'lock'` | `flag` (`game.rb:4495`) |
| `combination` | three dial numbers (string or array) | `combination` on the object (`:5290`) | `startCombinationMinigame` (`unlock-system.js:1194-1201`, `minigame-starters.js:1156`) | `combination` (`game.rb:4500`) |
| `cryptex` | word | `cryptexConfig` (`wheelCount`, `alphabets`) | `startCryptexMinigame` (`unlock-system.js:1182-1191`, `minigame-starters.js:1128`) | `cryptex` (`game.rb:4501`) |
| `ransomware_display` | none | `onRead` and `completesTaskOnOpen` | `unlock-system.js:1242-1278` | not in the method map (`game.rb:4488` comment says it never unlocks through `/unlock`) |
| `infusion_pump`, `backup_recovery` | (minigame) | | `unlock-system.js:1279-1294` | not in the method map (inferred: type-dispatched, see §4) |
| `network_architecture`, `alarm_panel` | (minigame) | | `minigame-starters.js:1026`, `:1045` exist; no `case` in `unlock-system.js` (inferred: type-dispatched) | not in the method map |
| `login` | none (sign-in) | `loginPicker`, `headless`, `policy`, `services` | sign-in screen, never `unlockTarget` (`unlock-system.js:257-283`, `:973-980`) | not `/unlock`; `POST /login` (`config/routes.rb:38`) |

Notes:
- The `README` table lists `requires` for `rfid` as a single keycard id, but the code also accepts arrays (`unlock-system.js:1388`, `game.rb:3997-4005`).
- `maxAttempts` on `pin` appears in the validator (`scripts/validate_scenario.rb:7992-7995` warns on `lockoutSeconds` for non-password locks). Whether `pin` reads `maxAttempts` is not checked here.

### 1.3 Method allowlist (server)

- `UNLOCK_METHODS_BY_LOCK_TYPE` at `app/models/break_escape/game.rb:4491-4502`: `key:[key,lockpick]`, `pin`, `password`, `flag`, `biometric`, `bluetooth`, `ble`, `rfid`, `combination`, `cryptex`. A `lockType` absent from this map is refused for any method (`:4504-4507`, `unlock_method_matches_lock?`; a blank lockType defaults to `key`).
- `game.rb:4488` comment: `ransomware_display` and the type-dispatched minigames never unlock through `/unlock`.

## 2. Server unlock path

### 2.1 Route

- `config/routes.rb:34`: `post 'unlock'` (inside the game resource; the path is `POST /games/:id/unlock`).
- `config/routes.rb:66`: `post 'objectives/unlock'` (`unlock_objective`, an aim or task unlock, not a lock).
- `config/routes.rb:78`: `post 'unlock_vm_console'` (VM console launcher, not a lock).
- Sign-in routes: `config/routes.rb:38` `post 'login'`, `:39` `post 'logout'`, `:40` `post 'lock_session'`, `:41` `get 'login_accounts'`.

### 2.2 Controller: `GamesController#unlock`

- Before-action and locking: `app/controllers/break_escape/games_controller.rb:27` (`set_game` includes `:unlock`), `:103` (`around_action :with_game_lock` includes `:unlock`).
- `def unlock` at `:1211`. Params read at `:1215-1219`: `targetType`, `targetId`, `attempt`, `method`, `card_ids` (an array, mapped to strings).
- `:1224-1225` `already_open`, only for `method == 'rfid'` with `card_ids`.
- `:1226` `is_valid = @game.validate_unlock(target_type, target_id, attempt, method, card_ids: card_ids)`.
- Refusal branch `:1228-1251`:
  - `:1232` `unlock_session_refusal`: when a session refusal applies, `render json: { success: false, reason:, message: }`, status `403 forbidden` (`:1233`).
  - Otherwise `:1238` `body = { success: false, message: 'Invalid attempt' }`, status `422 unprocessable_entity` (`:1250`).
  - Extras on the body: `feedback` for a PIN cracker (`:1243-1246`), `caseMismatch` for a password (`:1247-1249`), `reason: 'uid_only'` for an rfid copy (`:1251-1252`, the second-to-last part, see grep `uid_only`).
- `:1256-1259` flag released check: `released_flag_refusal(attempt)` returns `422` before any write.
- `:1264` `rfid_card_answer` for an access-list rfid unlock.
- `:1275-1279` route-room refusal: `render json: { success: false, reason: 'room_not_reachable', retryable: true }`, status `403`, before any write.
- `:1281` `ActiveRecord::Base.transaction(requires_new: true)`.
- Door branch `:1282-1313`: gated split (`record_npc_route_room!`, `:1282-1292`), credential path with `serve_opened_room` and `credit_via_credential!` (`:1297-1300`). Response `{ success: true, type: 'door', roomData: }` (`:1305-1309`).
- Object branch `:1314-1332`: `@game.unlock_object!(target_id)` at `:1315`; response `{ success: true, type: 'object' }` (`:1319-1322`); `hasContents` and filtered `contents` when the object has contents (`:1328-1330`).
- Flag branch `:1334-1371`: flag submitted to Hacktivity (`FlagService`), rewards, linked task (`:1334-1366`). Refusal `flag_not_recorded` (`:1377`, status `422`). The rescue at `:1381-1386` undoes the unlock on a Hacktivity error (`:1340` comment) and renders `Failed to save unlock`.
- Success render: `render json: response` at `:1372`.
- The unlock path does not call `save!` in the object branch in the lines read; `player_state` writes happen through the model helpers and the transaction (inferred).

### 2.3 Model: `validate_unlock` and helpers (`app/models/break_escape/game.rb`)

- `def validate_unlock` at `:4597`, signature `(target_type, target_id, attempt, method, card_ids: nil)`.
- Door branch (`target_type == 'door'`, `:4600-4696`, approximate end):
  1. `room_unlocked?(target_id)` returns `true` (`:4602-4605`).
  2. `room = room_data(target_id)`, `return false unless room` (`:4607-4608`).
  3. If `room['locked']` (`:4613`):
     - `method == 'unlocked'` refused (`:4618-4622`).
     - `method == 'npc'`: `npc_mapping_unlocks_door?` or `validate_npc_unlock` (`:4625-4626`; defs `:5041` and `:5051`).
     - `unlock_method_matches_lock?(room['lockType'], method)` else `false` (`:4628-4631`).
     - Case `:4634-4679`: `key` (`has_key_in_inventory?`, `:4637-4640`), `lockpick`, `rfid` (`rfid_lock_passes?(room, card_ids)`, `:4648-4651`), `biometric|bluetooth|ble` (trusted, `true`), `pin|password` (`room['requires'].to_s == attempt.to_s`, `:4658-4661`), `combination|cryptex` (`lock_answer_matches?`, `:4664`). Any other method: `false`.
  4. Not locked: any method returns `true` (`:4680-4690`).
- Object branch (`else`, `:4688-4790`):
  1. `unlock_scope_refused?(target_id)` (`:4689`): refuses a sign-in PC, or an object under one without an admitting session.
  2. `object_unlocked?(target_id)` returns `true` (`:4696-4699`).
  3. `object = find_scenario_object(target_id)` (`:4702`, def `:4867`; recurses into container `contents`, so an archive inside a pc or container resolves).
  4. `method == 'unlocked'`: `true` only if `!object['locked']` (`:4706-4716`).
  5. `method == 'npc'`: `validate_npc_unlock` (`:4719-4722`).
  6. `lock_in_force = object['locked'] ? true : false` (`:4727`).
  7. `method == 'flag_reward'`: `!lock_in_force || flag_reward_unlocks_object?(object)` (`:4732-4736`; def `:4543`).
  8. `lock_in_force && !unlock_method_matches_lock?(object['lockType'], method)` returns `false` (`:4738-4742`).
  9. Case: `key` (`:4745-4749`), `lockpick`, `rfid` (`rfid_lock_passes?`), `biometric|bluetooth|ble` (`true`), `flag` (`resolve_flag_ref(object['requires'])` compared case-insensitively to `attempt`, `:4761-4766`), `pin|password` (`:4767-4771`), `combination|cryptex` (`:4774-4777`).
  10. Anything else falls through to `Object not found` and `false` (`:4786-4789`).
- Helper facts:
  - `unlock_room!` `:135-138`, `room_unlocked?` `:141-143` (true also for the start room).
  - `unlock_object!` `:691-694`, `object_unlocked?` `:697-699`. Both write `player_state['unlockedObjects']`.
  - `player_state['unlockedRooms']`, `npcRouteRooms` (`:167-180`), `loginLockouts` (`:4311-4314`).
  - `unlock_scope_refused?` `:4194-4199`; `unlock_session_refusal` `:4214-4245` (returns `reason` `off`, `not_responding`, `unreachable`, `expired`; messages `:4208-4212`).
  - `rfid_lock_passes?` `:3997-4005`; `rfid_requires_held?` `:4015-4032`; `rfid_identity_passes?` `:3983-3989`; `acl_lock?` `:3970-3972`; `normalise_card_ids` `:3975-3979`.
  - `lock_answer_matches?` `:4515-4527`; `strip_lock_answers!` `:4532-4536` (removes `combination` and `cryptexConfig.answer` from payloads).
  - `pin_cracker_feedback` `:4793-4803`; `password_case_mismatch?` `:4808-4818`; `uid_only_refusal?` (called at controller `:1251`).
  - `has_key_in_inventory?` `:853`; `has_lockpick_in_inventory?` (called at `:4641`, def not located).
  - `flag` resolution: `resolve_flag_ref` (called at `:4761`, def not located).

### 2.4 Order of checks (object, summarised)

1. Controller: `already_open` (rfid only) → `validate_unlock` → on false, session refusal, then 422 with extras.
2. `validate_unlock` object branch: scope refusal (`:4689`) → already open (`:4696`) → find object (`:4702`) → `unlocked`/`npc`/`flag_reward` shortcuts → method-to-lockType match (`:4738`) → per-method check.
3. Controller after success: flag released check (`:1256`), route-room refusal (`:1275`), transaction (`:1281`), `unlock_object!` (`:1315`), contents, flag submission (`:1334`).

Note: `validate_unlock` grants access "whatever is sent" when the door or object is already open (`:1220-1224` comment and `:4602-4605`, `:4696-4699`).

### 2.5 Recorded state and responses

- `player_state['unlockedRooms']` (door success, via `unlock_room!` `game.rb:135-138`, or `serve_opened_room` at `games_controller.rb:2927-2931`).
- `player_state['npcRouteRooms']` (gated split, `:176-180`).
- `player_state['unlockedObjects']` (object success, `:691-694`).
- Response shapes listed in §2.2. A failed attempt writes nothing (the refusal branch returns before the transaction).
- No attempt counter for `/unlock` on the server. Attempts are counted only for the sign-in path (§3.3).

## 3. Lockouts and attempt limits

### 3.1 Client-side (door and object password pads)

- Schema: `maxAttempts` `:4223` (door), `:5313` (object); `lockoutSeconds` `:4224` and `:5314`. Both are "client-side" per the descriptions (`:4223-4224`).
- Client default: `maxAttempts` falls back to `3` (`unlock-system.js:1224`); `lockoutSeconds` falls back to `0` (`:1225`).
- The count survives close and reopen but resets on reload (schema `:4224` description).

### 3.2 Server-side PIN cracker and password feedback

- `pin_cracker_feedback` (`game.rb:4793-4803`) returns pips only when the player carries a PIN cracker (comment block just above `:4793`, approx. `:4786-4792`).
- Wrong password case returns `caseMismatch` (`game.rb:4808-4818`).

### 3.3 Server-side sign-in lockouts (`login`, not `/unlock`)

- `LOGIN_INCORRECT = 'Incorrect username or password'` (`game.rb:3079`); `LOGIN_LOCKED_OUT = 'This account is locked on this PC'` (`:3080`).
- `effective_policy(pc)` (`:3360-3367`) reads `scenario_data['policies']` by the PC's `policy` or `defaultPolicy`.
- `login_max_attempts(pc)` (`:3370-3373`) returns `maxAttempts` (a positive integer) or `nil` for no limit. Schema `:270` says `maxAttempts` is "Server-counted failed sign-ins per PC and username before a lockout; null: no limit."
- `login_failures` (`:4306`), `record_login_failure!` (`:4333-4357`): count per key, at `maxAttempts` calls `add_login_lockout!` (`:4366`) and returns `LOGIN_LOCKED_OUT` with `attemptsLeft: 0`. Otherwise `LOGIN_INCORRECT` with `attemptsLeft`.
- `attempt_login!` `:3444`. Controller `login` `games_controller.rb:1516`, `logout` `:1562`, `lock_session` `:1580`.

## 4. What can be locked

### 4.1 Doors and rooms
- Room `locked`, `lockType`, `requires`, `keyPins` (schema `:4161-4247`).
- Door lock fields live on the room itself (`locked`, `lockType`, `requires` and so on, schema around `:4171`), not on `doors[]` entries; `game.rb:2400-2455` builds the per-room payload. (Corrected by the orchestrator, 2026-11-19.)
- Door entry resolves lockType from its own field, else the connected room (per `docs/achitechture/SCENARIO_FORMAT_HARDENING_PLAN.md:231`, a plan, not checked against code).

### 4.2 Containers and objects
- Any `rooms.*.objects[]` entry or container `contents[]` with `locked` and `lockType` (schema `:5161`, `:5279`).
- `GamesController#container` (`games_controller.rb:617-680`) refuses an unlocked-check miss (`:649-658`, `:678-679`). `check_container_unlocked` at `:3119-3125`.
- Nested containers: `path_unlocked?` `game.rb:3310-3313`; `locked` on each container in the path.

### 4.3 PCs
- Plain locked PC: an object with `type: pc` and `lockType: password` or `pin` (README `:1500-1511`: `pc` supports `lockType: "password"`, `postitNote`, `showPostit`, `maxAttempts`).
- Sign-in PC: `lockType: 'login'` (schema `:5281`; `unlock-system.js:278-283`, `:973-980` sends it to `openLoginPc`). Helper `login_pc?` `game.rb:3090-3092`. Owner: `login_pc_owner` `game.rb:3384-3388` reads `pc['owner']`. Pick-up and sign-in details: `docs/agents/ops_layer/digests/D2_sessions_signin_keyring.md` (not read here).

### 4.4 Phones
- A phone is an item (`type: phone_*`), and an NPC carries `itemsHeld` (schema `:1121`, `:4846`, `:5442`). The authenticator device object type is `authenticator-device` (`minigame-registry.js:28`; `minigame-starters.js:1312-1346`), its stream in `minigameData` (`:1334-1346`); writes `<prefix>approved` and `<prefix>sent` globals (`:1342-1346`).
- NPC phones and the Friendface phone: see `docs/agents/ops_layer/digests/D4_npc_items_phones_helpdesk.md` section 2 (`:77`). Section 8(b) (`:283`) describes a sign-in approval prompt on an NPC phone as not built.

### 4.5 Files and archives
- No encrypted-file or password-protected-file lock type exists in the schema, server or client (`grep -i encrypt` in `app`, `lib`, `public/break_escape/js` hits only crypto-workstation and music titles).
- An "archive" is a container object with `contents` (`game.rb:4701`, `:4866`; `games_controller.rb:3050`). Its lock is an ordinary `lockType` on the container.

### 4.6 Owner fields
- `owner` on objects: schema `:5511` (string or array of NPC ids, `x-ref: npc`). Validator `scripts/validate_scenario.rb:639-660` (`check_owner_fields`) warns when a workstation has no owner of its own.
- `owner` on `mailboxes[]` items: schema `:705`.
- `belongsTo`: not found (see Not found).
- NPC `itemsHeld`: schema `:1121` (npc record), `:1427-1431` (headless NPC), `:4846` and `:5442` (item lists). Server: `game.rb:2984` matches a Friendface phone to its `owner` NPC id.
- Access lists: `accessList` def `:3934`; used on rfid (`game.rb:3983-3989`, `:3997-4005`), and on sign-in PCs (`README_scenario_design.md:1013`).

## 5. Client unlock flow

- `public/break_escape/js/systems/unlock-system.js`:
  - `notifyServerUnlock(lockable, type, method)` `:25-51` posts via `unlockWithRouteRoomRetry` (`:39`). Target id from `unlockTargetId` `:55-59` (door: `doorProperties.connectedRoom` or `roomId`; object: `scenarioData.id`, `name` or `objectId`).
  - RFID access helpers `:79-260`: `requestRfidAccessUnlock` `:167-196` posts `method: 'rfid'` with `card_ids`.
  - `handleUnlock(lockable, type)` `:973`:
    - Sign-in PC early return `:977-981`.
    - `window.DISABLE_LOCKS` bypass `:986-989` (`unlockTarget` without a server call).
    - No requirements → server verify with `method 'unlocked'` `:1003-1010`.
    - `locked !== false` check `:1015-1017`; unlocked client view also verified with `'unlocked'` `:1018-1030`.
    - `door_unlock_attempt` emitted `:1034-1040` (door only).
    - `switch (lockRequirements.lockType)` at `:1062`. Cases listed in §1.2.
    - Default `:1589-1591`: "This ... requires X to unlock."
  - `getLockRequirementsForDoor` `:1594-1672`; `getLockRequirementsForItem` `:1679-1690` (reads `locked`, `lockType` default `key`, `requires`, `keyPins`, `difficulty`, `access`, `acceptsUIDOnly`).
  - `unlockTarget(lockable, type, layer, serverResponse, { autoOpen })` `:1696`. This is where a success is applied to the sprite (door opens, container opens, minigame auto-open); `serverResponse` is passed in by each case.
- Client learns success by: the `success: true` response resolved through each case's callback calling `unlockTarget` (e.g. `:1121`, `:1162`, `:1189`, `:1237`, `:1300`, `:1340`, `:1377`, `:1447`, `:1481`, `:1528`).
- Interactions routing: `public/break_escape/js/systems/interactions.js:459-464` (door minigame kind by lockType), `:479-485` (object kind; `flag` maps to `password`), `:963` (`login`), `:1438-1446` (object `minigameData.requiresGlobal` stage gate, client only, `lockedMessage`), `:1770-1776` (same gate in the sprite-click path), `:1793-1800` (flag lock opens `flag-station`), `:1823`, `:1830`, `:968`, `:1007`, `:1192` (`handleUnlock(sprite, 'item')`).

### 5.1 Dual-authorisation minigame (defined, not launched)

- `public/break_escape/js/minigames/dual-auth/dual-auth-minigame.js`:
  - Class `DualAuthMinigame` (`:1-20`); PINs from `minigameData.itsec_pin` and `minigameData.clinical_pin` (`:17-18`); a 300 second timer (`:20`).
  - On success it sets `network_isolation_authorised` and `network_isolated` globals (around `:253-256`) and calls `notifyServerUnlock(this.params.lockable, this.params.type || 'object', 'dual_auth')` (`:260-263`).
- A search of `public/break_escape/js` for `dual-auth`, `DualAuth`, `dual_auth` found no import or registry entry outside its own folder. Not launched by any code found.
- If it were launched with `dual_auth`, `validate_unlock` would refuse it: `dual_auth` is not in `UNLOCK_METHODS_BY_LOCK_TYPE` (`game.rb:4491-4502`), so an object with `locked` true returns `false` at `:4738-4742`, and a door falls to `unlock_method_matches_lock?` at `:4628` (inferred from the code read).

### 5.2 Authenticator (push-approval mock, not a lock)

- `public/break_escape/js/minigames/authenticator/authenticator-minigame.js` and `authenticator-model.js` (not read in detail).
- `startAuthenticator` `minigame-starters.js:1312-1331`; `startAuthenticatorDevice` `:1334-1346`.
- The device writes globals (`setGlobalPrefix`), it never calls `/unlock`.
- Validator: `scripts/validate_social/authenticator_device.rb` (not read).

## 6. Validator and graph treatment

- `scripts/validate_scenario.rb`:
  - Minigame data schema dispatch on `lockType`: `:902-928` (`minigame-data-schemas.json`, `_dispatch: "lockType"`).
  - `unlock_object` tasks: `lockType` must emit `item_unlocked`; known set checked at `:1717-1740`.
  - Locks opened by carrying an item (`key`, `rfid` credential sets): `:2296-2320`. "Every other lockType ('password', 'pin', 'biometric', 'flag', ...) puts a secret in 'requires'" (`:2296-2298`).
  - PIN rules (digits only, dustable): `:2529-2557`.
  - Grant with a locked object missing `requires`: `:2934-2935`.
  - Object lock checks: `:3606-3626` (key lock needs `keyPins`, `:3622`).
  - Room lock checks: `:3722-3740` (key lock needs `keyPins`, `:3738`).
  - `flag` `requires` format: `:6538`.
  - rfid access list: `:7071`. Combination/cryptex/key/rfid node list: `:7193`.
  - `lockoutSeconds` only on password: `:7992-7995`. rfid nodes: `:7999-8000`.
  - Owner fields: `check_owner_fields` `:639-660`.
  - Door entry lock fields (`DOOR_ENTRY_LOCK_FIELDS`): `:6944`.
- `scripts/lock_key_diff.rb`: `REQ_KEYS` `:58` (`lockType, requires, keyPins, key_id, targetFlags, difficulty, requiresGlobal, requireGlobal`). Its header `:30-42` says a changed `lockType` or `requires` on a critical-path lock is a finding.
- `scripts/generate_dungeon_graph.rb`: `LOCK_TYPE_LABELS` `:34-38` onwards; lock nodes built at `:100`, `:149`, `:292`, `:351`, `:913`, `:1658`; nested contents walked at `:903`. The `break-escape-dungeon-graph` skill runs it.

## 7. Existing multi-requirement chains on one lock

- **rfid access list plus requires (a mixed lock):** `rfid_lock_passes?` `game.rb:3997-4005` and `rfid_requires_held?` `:4015-4032`. An access list admits a card by the holder's identity (`rfid_identity_passes?` `:3983`). A card in `requires` always passes; a clone passes only when `acceptsUIDOnly` allows it (`:4029-4030`).
- **Multiple accepted ids:** `requires` array on rfid (`unlock-system.js:1388`; `game.rb:4016`).
- **Combination with three numbers:** `requires` array `[12, 30, 5]` compared as numbers (`game.rb:4509-4527`; `README_scenario_design.md:674-685`).
- **Flag lock plus flag rewards:** `flag_reward_unlocks_object?` `game.rb:4543-4570+` (a station's `unlock_object` reward plus a claimed flag, `player_state['flag_rewards_claimed']`); `unlock_objective` route `routes.rb:66`.
- **Door gate and NPC route (split gate):** `game.rb:267-330` (split gated door, `npcRouteRooms`, `gated_route_room?` `:304`), `games_controller.rb:1282-1292`. Schema `:4173` (`gate` on a doors entry). README `:167-206`.
- **NPC unlock mapping:** `npc_mapping_unlocks_door?` `game.rb:5041`, `validate_npc_unlock` `:5051`; called from door (`:4625-4626`) and object (`:4719-4722`) branches.
- **Object `requiresGlobal` gate:** client only, `interactions.js:1438-1446` and `:1770-1776`. Not checked by `/unlock`.
- **`requiresItem` on an interaction:** `interactions.js:1040-1046` (a carried item gates the trigger; `consumesItem` removes it). Not a lock check on the server (inferred).
- **Dual-auth minigame:** defined, not launched (§5.1).

## Not found

- An approval step from the owner's phone (a push prompt accepted or refused by the owner): not found as an unlock step. The only push-style device is the authenticator minigame, which writes globals (§5.2). D4 section 8(b) (`docs/agents/ops_layer/digests/D4_npc_items_phones_helpdesk.md:283`) also records it as not built.
- A typed authenticator code (TOTP-style, per owner) as an unlock method: not found. `UNLOCK_METHODS_BY_LOCK_TYPE` (`game.rb:4491-4502`) has no such method.
- An encrypted file, password-protected archive or zip lock type: not found in schema, server or client.
- A `belongsTo` field on objects: not found in schema or code.
- A second-factor or two-person approval field on any object: not found. The only dual-auth code is the unlaunched minigame (§5.1).
- A server-side attempt counter for `/unlock` door or object pads: not found (only client `maxAttempts` and sign-in counters, §3).
- A lock type `keycard` in the scenario schema: not found (it appears only in the graph label map, `scripts/generate_dungeon_graph.rb:34-38`).
- The `has_lockpick_in_inventory?` and `resolve_flag_ref` definitions: not located in this read (called at `game.rb:4641` and `:4761`).
