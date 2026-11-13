# Credential keyring: build plan for phases 0 and 1

Status: plan. Decided by the user on 2026-11-13 (q92, option 3: "remote sign-in model: credential keyring, option 3"). Engine paths are under `public/break_escape/js/`. Line numbers are on main f956f5355 unless `2b0:` marks branch `build/ux-slice2b0` (tip c0c274522).

## 1. What this builds

A **credential** is anything the player holds that a PC accepts as proof that they are a particular account. The player's **keyring** is the list of credentials they have earned, computed on the server from state it already keeps. Each PC's policy says which kinds it accepts, and the server checks every use.

| Phase | Scope | Slices | Size |
|---|---|---|---|
| 0 | Policy `remoteScreen`; the target PC's own account tiles on the remote sign-in screen, passwords only | K0 | M |
| 1 | The `credentials` registry, the `held` and `foothold` proofs, policy `accepts`, the POST /login credential branch, credentials on sign-in screens, Connect, the relay; kinds `password` (found in files), `saved_connection`, `assist_invite` | K1, K2, K3a, K3b, K3c, K4 | L in all (M each) |
| 2 | `token` | sketch, section 10 | M |
| 3 | `hash`, `acceptedOn`, machine accounts | sketch, section 11 | M |

Each slice is one branch, built, reviewed and live-proved on its own, and merged before the next starts. Main stays playable and safe between slices: K1 changes no sign-in behaviour, K2 adds a server branch that nothing in the client calls until K3a, and K3a works through footholds alone.

Out of scope: tokens and hashes; converting the labs' hand-written granted sessions (decision D5); the inline item shape; any field tidy that would need a format step (section 12).

### 1.1 Changes from the explainer the user decided from

Each is shown on the picks page. The ones marked "default" are behaviour the player meets; the user can overturn them.

| Change | Reason |
|---|---|
| The "Use from keyring" button and its list panel become per-kind tags on each account tile ("Captured", "Found in a file", "Saved connection", "Remote assist") and, on the chosen account's line, one button per credential ("Connect with HB-FIN-02.rdp") | One action per way in, no one-item menu; one verb, Connect, on the screen, the tray and the desktop |
| Default: a password found in a file is never filled in. The tile is tagged and the player types it from the file | The server never sends a password it did not capture; reading the file is the lesson |
| Default: the "Found in a file" tag and its toast wait until the player has opened the file (the explainer listed the account as soon as the proof held) | The tag would give the find away |
| The keyring reaches the client by GET /keyring with a `rev` digest, asked after the events that can change it, not as deltas inside other answers | One reader, no change to every answer that could earn a credential; a repeat costs a few bytes |
| A relay session (assist invite) gives no network reach, is not listed in the network view and ends on reload (the explainer said every route after sign-in is unchanged) | The invite is Jake's own session shared through his vendor's relay, not a foothold on his network |
| The assist code comes from Jake through an ink gift (`#give_item` from his `itemsHeld`), not a declared grant | A declared grant can be claimed from the first second, skipping the conversation |
| The policy refusal reads "This PC always asks for the password, so a saved one is ignored. That setting is the fix." in place of "This PC does not allow saved passwords" | Names the control; final wording is D7 |
| Default: a lockout refuses a saved connection too | A saved connection presents the password, so the lockout applies; an assist invite (the person's own session) is not refused |
| Default: keyboard screens show password entries only | Connecting kinds are used from somewhere else (section 3.7) |
| The keyring view ("the capture log grown") is not in phase 1 (D4, recommended (c)) | The capture log is carried by one test scenario; the sign-in screens and Connect are where credentials are used |
| Item type `remote_access` becomes existing types with a tray slot (`text_file`) | No new art or item type; a small connection icon is logged in the backlog |
| `token` leaves the phase 1 default `accepts` | Tokens are phase 2 (D2) |
| The inline item shape (a credential described inside the item) is not accepted | No content uses it; a second shape is a second thing to test |
| New-game conversion of the labs' items moves out of phase 1 (D5) | The honest kind for them is `token` |
| The desktop pivot ("open the .rdp from Sam's desktop") is slice K4 (D6) | It needs its own route and session reader changes |
| Connect signs in directly when the server accepts; the sign-in screen opens only to show a refusal | One meaningful action acts directly |
| The relay desktop says whose session it is and has Disconnect, not Switch user and Sign out | The player did not sign in; they were let in |
| The explainer's later kinds (an RFID card as a credential, a one-time code, a key file) are not planned | Logged in `docs/IDEAS_BACKLOG.md` in K1 |

## 2. What exists today

- **POST /login** (`games_controller.rb:1320`, `Game#attempt_login!` at `game.rb:2141`): a username and password, or a claim, under `with_game_lock`. With `foothold`, the host must be reachable through it (`host_reachable_through?`, `network_access.rb:1171`), on, and not `remote: "blocked"`. Failures count per PC and normalised username (`record_login_failure!`, `game.rb:2836`) up to `maxAttempts`. `start_login_session!` (`game.rb:2883`) writes `sessions[pcId] = { id, via, foothold? }`, one slot per PC, and adds the PC to `signedInPcs`.
- **GET /login_accounts** (`games_controller.rb:1363`): the PC's tiles (`login_account_tiles`, `game.rb:2408`, by `loginPicker`: `accounts`, `known` or `false`) and the sticky note. It judges reach at the keyboard only and answers 403 for a headless PC; a request carrying `foothold` gets no note but is otherwise judged as if the player stood at the PC.
- **The remote sign-in screen** (`systems/unlock-system.js:627`, `openRemoteSignInScreen`) passes `picker: false` and `tiles: []`, never calls GET /login_accounts, and fills the captured sign-ins from GET /capture_secrets. The keyboard screen (`unlock-system.js:553-620`) opens after GET /login_accounts answers and shows no captures.
- **Headless hosts** (no screen: `door_box`, HB-DOOR-01, in `test_access_networks`; LW-DOOR01 in `lab_physical_pentest`, `scenario.json.erb:2304`) are signed in to only over the network, through the remote screen with no tiles.
- **GET /capture_secrets** (`games_controller.rb:1568`): `secrets` (`capture_secrets_for_client`, `game.rb:1415`) and, in a networks scenario, `accounts` (`account_capture_usernames`, `network_access.rb:1385`). Capture proofs (`capture_proofs.rb:58`; `planted`, `dropped`, `session`) gate when an account's password is served.
- **Session lock flag.** UI slice 6 (PC start panel, q93 option C) adds a server-side boolean `locked` to the held-session record, sent in the sessions answer as a delta, unlocked only through the PC's normal server password check with `maxAttempts` counting as for sign-in, and written as one predicate. This plan builds on that flag and does not reshape the record.
- **Session readers.** `session_route_up?` (`network_access.rb:1015`) returns true at once for a session with no foothold (line 1023). `prune_unreachable_sessions!` (`network_access.rb:1150`) skips sessions with no foothold and ignores outages. `reach_session_hosts` (`network_access.rb:1115`) counts every session as a pivot host in the reach walk. `host_row` (`network_access.rb:911-936`) offers only `via == "password"` sessions with `remote` from the foothold. `desktop_request_allowed?` (`network_access.rb:1183`) judges a foothold request by reach and a request without one by the keyboard. `session_for_client` (`game.rb:2392`) answers through `login_session_answer` with the session's foothold only. `render_login_desktop` (`games_controller.rb:2440-2450`) judges a desktop request through `desktop_refusal(info, foothold)` and, with no foothold, calls `settle_session_at_keyboard!`, which strips the session's foothold. `end_claimed_sessions!` (`game.rb:2362`) ends claims on reload. `screen-states.js:83` paints the locked screen when the PC is locked and the player's session there is not `via === 'password'`.
- **Sync.** PUT /sync_state loads `SYNC_STATE_COLUMNS` only, without `scenario_data` (`games_controller.rb:2022`); `merge_global_variables!` (`game.rb:332`) runs there. `prepare_bootstrap_state!` (`game.rb:214`) runs the bootstrap writers (`run_bootstrap_writers!`, `game.rb:839`) with `scenario_data` loaded, but only when `bootstrap_state_needs_write?` (`game.rb:831`) is true. A dropped link reaches the client as `endedPcIds`, which `pc-sessions.js` `linkDropped` (line 460) handles.
- **Inventory.** Items enter only through `/inventory` and `canonical_inventory_item` (`games_controller.rb:2544`). An always-allowed type (`notepad`, `games_controller.rb:2507`) has no server source and keeps the client's fields except `CLIENT_ITEM_FORBIDDEN_FIELDS`, built from `ItemIdentity::FORGEABLE_ITEM_FIELDS` (`item_identity.rb:28`). `ItemIdentity.same_item?` (`item_identity.rb:63`) falls back to a shared name when ids differ. `ItemIdentity.client_forged?` (`item_identity.rb:40`) catches only room adds with no source.
- **Notes items never take a tray slot**: `notes`-family types go to the Notepad (`systems/inventory.js:946`, `systems/interactions.js:1910`).
- **Inventory menu.** `inventoryMenuFor` (`systems/inventory-menu.js:87`) gives an item with more than one thing to do a small menu (an action plus Examine, plus Drop here).
- **NPC gifts.** An ink choice gives an item with the `#give_item:<type>:<id>` tag from the speaking NPC's `itemsHeld`; the server checks the NPC holds it. A declared grant is a separate server-run action with no trigger check.
- **Displacement.** When an NPC sits down at a PC, `pc-sessions.js` ends any player session there (`displaced`).
- **Policies** ship in the bootstrap. The schema closes each policy (`scenario-schema.json:195-209`).
- **UX slice 2b phase 0** (2b0, clean after review, going into merge train 32): captured sign-ins as the shared `.signin-tile` tiles with headshots, under a "Captured sign-ins" heading, above the form, in the PC monitor frame, with a loading state that shows neither form nor tiles until the list arrives.
- **Networks scenarios with sign-in hosts**: `test_access_networks` and `lab_physical_pentest` (LW-OPEN-07 `staff_pc_2`, `access: { people: ["pierce"] }`, the hot desk `hot_desk_pc`, and LW-DOOR01, all on `office_lan`; `revealSecret: true`; no policies block). They are the only scenarios with jacks, access points or implants. m01 to m10, `lab_social_engineering` and the other test scenarios have no foothold, so no remote screen. The `ca20` scenarios' `networks` keys are phone Wi-Fi lists, not this model.
- **Remote screen wording today** (2b0): "Checking..." while loading, a 3 s cap (`REMOTE_CAPTURES_WAIT_MS`, `unlock-system.js:369`) after which the form shows with a "still checking" line that the late answer replaces in place without moving focus; lines "Captured sign-ins: still checking.", "Captured sign-ins could not be loaded.", "Captured sign-ins: none yet." (`password-minigame.js:1712-1720`). The view's strings: `unreachableMessage(host)` "<host> can't be reached over this link.", `notRespondingMessage(host)` "<host> is not responding." (an off host over the network, on purpose), `REMOTE_OFF_TEXT` "Remote sign-in off" (`network-links.js:59-68`).
- **Monitor frame.** The PC screen draws on a 560x350 base at a whole scale: x2 at 1400x1000, where nothing scrolls (`utils/pc-monitor.js:15-37`, `password-minigame.css:1270-1279`). Tiles are 104px wide, 84px compact.
- **Accounts are room NPCs.** `account_npcs` reads only `rooms.*.npcs` (`game.rb:1594-1600, 1896`).
- **Granted remote sessions** are hand-written `pc` items: `lab_social_engineering/scenario.json.erb:170-200` (`sofia_remote`) and `lab_physical_pentest/scenario.json.erb:586`.
- **The capture log** (`minigames/capture-log/`, sections Captures, Sessions, Findings) is carried only by `test_capture_log`.

## 3. The model

### 3.1 Accounts

Unchanged: a room NPC with `creds`. Every account with a password has an implicit credential of kind `password`, earned through today's capture routes and proofs; its id is `<npcId>.password`.

### 3.2 Policies

Two optional fields, shipped in the bootstrap (not secret):

```json
"policies": {
  "finance":  { "remote": "allowed", "remoteScreen": "tiles",
                "accepts": ["password", "saved_connection", "assist_invite"], "maxAttempts": 5 },
  "pw_only":  { "remote": "allowed", "accepts": ["password"] },
  "nla":      { "remote": "allowed", "remoteScreen": "typed" }
}
```

- `remoteScreen`: `"tiles"` shows the PC's own account tiles (by its `loginPicker`) over the network; `"typed"` shows none until a password is right, as Network Level Authentication does. Default: decision D1 (recommended `"tiles"`). Never affects the keyboard screen. A headless host always answers as `"typed"` with no tiles.
- `accepts`: the kinds the PC takes. Absent: `CredentialModel::DEFAULT_ACCEPTS` (phase 1: `password`, `saved_connection`, `assist_invite`; never `hash`). `password` is always accepted (a PC that refused typed passwords would be unusable); a list without it draws a validator warning.
- `maxAttempts` keeps its meaning. Only typed passwords count.

### 3.3 The registry

A top-level `credentials` map, server-only: the bootstrap strips it and no answer sends it whole.

```json
"credentials": {
  "jake_pw_note": { "kind": "password", "account": "jake",
                    "proof": { "session": "lena_pc" }, "foundIn": "lena_passwords_txt" },
  "lena_rdp":     { "kind": "saved_connection", "account": "lena", "connectsTo": "lena_pc",
                    "proof": { "held": "lena_rdp_file" } },
  "jake_assist":  { "kind": "assist_invite", "account": "jake", "connectsTo": "jake_pc",
                    "proof": { "held": "jake_assist_code" }, "endsOnGlobal": "jake_ended_assist" }
}
```

| Field | Meaning |
|---|---|
| id (map key) | `^[a-z][a-z0-9_]{0,63}$`; no dot, so never equal to an implicit `<npcId>.password` id |
| `kind` | An open string; `CredentialModel::KINDS` says which are built |
| `account` | The NPC id of an account holder |
| `proof` | Exactly one of `session` (sign-in PC id), `planted` (+ optional `on`), `dropped`, `held` (scenario item id), `foothold` (foothold id) |
| `connectsTo` | The sign-in PC it opens. Required for connecting kinds; not allowed on `password` |
| `foundIn` | `password` only, optional: the item whose text holds the password |
| `endsOnGlobal` | `assist_invite` only, optional: a declared global; once true, the invite is over for the game |

At most 64 entries; the server reads the first 64 by sorted id.

### 3.4 Items that carry a credential

An ordinary item gains an optional `credential` field naming a registry id. It uses an existing type that takes a tray slot and is not always-allowed: `text_file` for both `HB-FIN-02.rdp` and a written assist code. No new art. A `notes`-family type is refused by the validator (it never reaches the tray, so Connect would have nothing to sit on), and so is an always-allowed type (the client can build one).

```json
{ "id": "lena_rdp_file", "type": "text_file", "name": "HB-FIN-02.rdp", "credential": "lena_rdp",
  "takeable": true, "readable": false,
  "observations": "A saved remote desktop shortcut. The password is stored in it." }
```

```json
{ "id": "jake_assist_code", "type": "text_file", "name": "Remote assist code (Jake)", "credential": "jake_assist",
  "takeable": true, "readable": false,
  "observations": "The code Jake read out. It joins his session while he leaves it open." }
```

`credential` joins `ItemIdentity::FORGEABLE_ITEM_FIELDS`, so no client-built item can carry it: the field on a stored item always comes from the server's own copy of the definition. The id is not secret: what the server checks is that the player holds the scenario's own item.

### 3.5 Proofs

All read from state the server already writes:

| Proof | Holds when | Server state read |
|---|---|---|
| `session: pcId` | The player has ever held a session at that PC | `signedInPcs` |
| `planted`, `dropped` | As capture proofs today (`capture_proof_holds?`) | `plantedItems`, `gainedFootholds`, `droppedItems` |
| `held: itemId` | An inventory entry whose own stored `credential` equals the credential's id, whose type equals the definition's, whose identity (id) matches the definition's id with no name fallback, and that is not `client_forged?`. The definition is found where `find_login_item` (`game.rb:2051`) looks (a PC's contents, its account profiles' contents, mapped shares) plus room objects, container contents, NPC `itemsHeld` and `startItemsInInventory` | `inventory` |
| `foothold: footholdId` | The foothold is held now | `footholds` |

The `held` match is identity-strict: `same_item?`'s name fallback is not used. `held` and `foothold` stop holding when the item leaves the inventory or the foothold is lost, and the entry leaves the keyring. A session already opened is ended by its own route rules (section 3.8), not by that.

### 3.6 The kind catalogue

`lib/break_escape/credential_model.rb` (`BreakEscape::CredentialModel`, plain Ruby, shared by server, validator and dungeon graph, as `CaptureModel` is):

```ruby
KINDS = {
  'password'         => { built: true, connects: false },
  'saved_connection' => { built: true, connects: true, routes: %w[foothold from], honours_lockout: true },
  'assist_invite'    => { built: true, connects: true, routes: %w[relay],        honours_lockout: false },
  'token'            => { built: false },  # phase 2
  'hash'             => { built: false }   # phase 3
}
DEFAULT_ACCEPTS = %w[password saved_connection assist_invite]
PROOF_KINDS     = %w[session planted dropped held foothold]
```

`proof_kind` requires exactly one key, as `CaptureModel.proof_kind` does. The player-facing strings live in the client's text table (section 8.5), keyed by kind.

### 3.7 Routes

A connecting credential signs in only at its `connectsTo` PC, and never at that PC's own keyboard: a saved connection and an assist invite are used from somewhere else, and the game teaches that.

| Route | Kinds | Check | Session record | Pivots in the reach walk |
|---|---|---|---|---|
| `foothold` | `saved_connection` | `host_reachable_through?(foothold, pc)`, not `remote: "blocked"` | `foothold` | yes, as a password session |
| `from: pcId` (K4) | `saved_connection` | the player holds a session at `pcId` whose route is up, `pcId` is on, not `remote: "blocked"`, and the target's network is in `networks_reachable_from(network of pcId)` | `from` | yes: the target was already reachable from the source |
| `relay` | `assist_invite` | none for reach: the account holder's own vendor relay. The PC must be on; `remote: "blocked"` does not apply | `relay: true` | no |

A relay session never extends reach: `reach_session_hosts` skips any session whose record has `relay`, so the walk never pivots from it. A relay session is reached again only by Connect, never from the network view.

### 3.8 The session record and its readers

`sessions[pcId] = { id: npcId, via: "credential", credential: credId, foothold? | from? | relay?, locked? }`, one slot per PC, replaced by the next sign-in. `signedInPcs` gains the PC.

The record is today's held-session record with three added fields; nothing is reshaped. `locked` is UI slice 6's flag, unchanged: a credential session starts unlocked, locks and unlocks through slice 6's one predicate, and unlocking is the PC's normal server password check for the session's account, counted against `maxAttempts`. Phase 1 adds no credential-based unlock (a saved connection does not unlock a locked screen); if one is wanted later it goes into that same predicate. The `locked` delta in the sessions answer covers credential sessions as it covers password sessions.

Server readers changed in K2 (and K4 for `from`):
- `session_route_up?`: before the blank-foothold return, a relay session is up while its credential is not in `endedCredentials` and the PC is on; a `from` session is up while the source session exists, the source's own `session_route_up?` holds, the source PC is on, and the target network is in `networks_reachable_from(source network)`. Otherwise the existing foothold logic. Every scoped reader (`session_admits?`, `resource_admits_player?`, the profile checks) goes through it.
- `reach_session_hosts`: skip a session with `relay`.
- `prune_unreachable_sessions!`: iterate to a fixed point; also end a `from` session whose source session is gone (K4). Outages still never prune; `session_route_up?` refuses while the source is off and allows again when it is back.
- `host_row`: offer any session that is neither a claim nor a relay; the held entry's `via` comes from the session, `remote` is true when it has `foothold` or `from`, and a `from` session carries `route: { from: pcId }` so the view opens it by that route.
- `desktop_request_allowed?`, `desktop_refusal` and `render_login_desktop`: all three take a route argument (`{ foothold: } | { from: } | { relay: true } | nil`) in place of the bare foothold. Two new branches run before the keyboard rule, keyed on the request's `relay=1` or `from=` param and checked against the server's own record: the session at that PC must carry that same route field, and `session_route_up?` must hold. A param the record does not carry is refused; it never falls through to the keyboard rule.
- `settle_session_at_keyboard!`: leaves a `via: "credential"` session unchanged, so a saved-connection session opened over a foothold stays remote (and still ends on unplug) when the player later opens it at the target's keyboard.
- `session_for_client` and `login_session_answer`: pass the session's route field (`foothold`, `from` or `relay`), `kind` and `label`, so a credential session is reported as remote with its route after a reload.
- Reload: `end_claimed_sessions!` uses a new `reload_ended_session_ids` (claims plus relay sessions); `claimed_session_ids` keeps meaning claims only.
- Typed passwords: POST /login with `relay` is refused (a relay is never a typed sign-in).

Client readers: `systems/screen-states.js:83` keeps the screen open for a password session (`via !== 'password'` paints it locked); it changes to paint locked only when `via` is neither `password` nor `credential`, so claims behave as today and a credential session shows its desktop. The others already test for `claim` (`pc-sessions.js:179/353/360`, `container-minigame.js:24/951`, `network-links.js:660`, `network-view-minigame.js:164`, `workstation-state.js:223`, `unlock-system.js:658/667`). K2's build log lists a fresh grep for `via`.

## 4. What every slice must keep

- **GET /capture_secrets answers stay identical.** No slice edits `capture_secrets_for_client`, `account_capture_usernames` or `account_capture_served?`. K1 adds a golden test of the answer for every fixture game in `test/fixtures/files/access_leak/responses.jsonl` and the test scenarios with captures.
- **Shipped scenarios.** K0 changes the remote screens of the two networks scenarios (section 9.2), `lab_physical_pentest` among them, which gets its own answer in D1. From K1 on, every new screen element appears only in a scenario that declares `credentials`.
- **No format step** (section 12).
- **Pixel-art rule and UI language:** 2px borders or the theme skin, pixel fonts only, authored headshots for every account, X closes, one look per concept, the frame wraps all content at 1400x1000, 390x844, 915x412 and 800x600, scrollers keep the frame whole with the pixel scrollbar and a "More below" cue.
- **Sync size:** each slice states what it stores and what each request sends.
- **Process:** commit before testing, explicit paths, no attribution lines; new static imports in engine JS go on each JS test harness copy list.
- **Live proof:** a keyless server on the builder's own port, a headless browser through the real routes, shots at the four sizes with scrollbars shown, `tools/playtest/verify-run.rb` showing progress on the server, and tampered-client checks sent with `fetch` from the page.

## 5. Slice K0: phase 0, the target's own tiles over the network

Base: `build/ux-slice2b0` (c0c274522), or main once merge train 32 lands it. Size: M.

### 5.1 Server

- `scenario-schema.json`: policy `remoteScreen` (`enum: ["tiles", "typed"]`).
- `Game#remote_screen(pc)` (`network_access.rb`, beside `remote_blocked?`): `"typed"` for a headless host; else the policy's value, else `DEFAULT_REMOTE_SCREEN` (D1).
- `GamesController#login_accounts` with `foothold` takes a new branch, `Game#remote_login_accounts(info, foothold)`:
  1. A `foothold` that is not an id string of at most 64 characters: 400 (it never falls through to the keyboard branch).
  2. Not held or not reaching the host: 403 `PC not reachable`.
  3. `remote_blocked?`: 422 `{ remoteBlocked: true }`.
  4. `host_service_off?`: 403 `{ reason: "not_responding" }`.
  5. Answer `{ pc_id, remoteScreen, loginAccounts }`: `login_account_tiles(pc)` under `tiles` (`known` reads `encounteredNPCs`), `[]` under `typed` and for a headless host (200, never 403). Never `postitNote`.
  Without `foothold` the action is unchanged (a headless host stays 403 at the keyboard); `Cache-Control: no-store` stays.

### 5.2 Client

- `api-client.js`: `loginAccounts(pcId, { foothold } = {})`.
- `unlock-system.js` `openRemoteSignInScreen`: fetch `/login_accounts?foothold=` and `/capture_secrets` together, under one 3 s cap for the pair (2b0's `REMOTE_CAPTURES_WAIT_MS`). Until both answer or the cap passes, the screen shows "Checking..." with no form and no focus. If both answer in time, `scene.setRemoteAccounts({ picker, tiles, captured, remoteScreen })` lays it out once. After the cap, the form shows with Other user and a "Still checking for accounts..." line; each late answer redraws the row in place (2b0's quiet redraw), without moving focus or clearing typed text. A 403 or 422 closes the screen with the view's own strings (`unreachableMessage(host)`, `notRespondingMessage(host)`, and the remote-off sentence of 8.5); the view already hides sign-in on a blocked row and an off host, so this covers only a race.
- `minigames/password/password-minigame.js`: one tile row, and one look for a captured account on every remote screen: the account's tile with a "Captured" tag under the name, which fills the password when served. The "Captured sign-ins" heading and its three heading lines go.
  - Under `tiles` with picker `accounts`: the PC's accounts, a listed captured account tagged, then Other user. Captured accounts the PC does not list are left out (the PC does not admit them; Other user still lets the player type any name).
  - Under `tiles` with picker `known` or `false`: the PC's tiles (if any), then captured accounts the PC does not list, tagged, then Other user.
  - Under `typed` (explicit policy only): the captured tiles, tagged, then Other user.
  - A headless host: the captured tiles, tagged, then Other user. No NLA line: it is a device's web sign-in, not a PC with that control.
  - Lines, one string per state, in the message line under the form (section 8.5 has the table): loading "Checking..."; late "Still checking for accounts..."; a `tiles` screen with no captures, none; `typed` with captures, "<host> lists no accounts until you sign in. Your captured sign-ins are above."; `typed` with none, "<host> lists no accounts until you sign in."; a headless host, "Type the account's name and password."; `/login_accounts` failed, "<host>'s account list could not be loaded. Choose Other user to type a name."; `/capture_secrets` failed, "Your captured sign-ins could not be loaded." The host is the PC's `host` label, never "This PC".
  - Tags: Press Start 2P at its 8px grid size, one line each, at most two per tile and then "+1"; text cut to the tile width with an ellipsis, the full text in the tile's title and on the chosen line.
  - Short window (915x412, where the username line is hidden): tags become one 12x12 CSS px corner badge (an 8x8 pixel glyph inside a 2px border), one glyph per group: a key for a password kind, a plug for a connecting kind; tested at DPR 3.
  - The chosen line, Change and the fold rules are the keyboard's.
- Keyboard screens are unchanged: they show no captures. In a scenario that declares `credentials` (K3a on), keyboard screens show password entries with their tags, so captured tags appear at the keyboard only in a scenario that opts in; the README says so.
- `pc-sessions.js` `screenShown(pcId, tiles, ...)` gets the PC tiles shown.

### 5.3 Validator and docs

- `remoteScreen` on a policy whose `remote` is `blocked`: warning.
- `remoteScreen: "tiles"` on a policy used only by PCs with `loginPicker: false` or headless PCs: info line.
- `README_scenario_design.md`, networks section: a host row still names no accounts, but the remote sign-in screen now shows the PC's tiles under `remoteScreen: "tiles"`; document the field, the headless rule, the captured tag and the keyboard rule above.

### 5.4 Tests

- Rails `test/controllers/break_escape/network_remote_tiles_test.rb`: steps 1 to 5; `known` over the network; `typed` gives `[]`; a headless host over a reaching foothold gives 200 `typed` with `[]`; no `postitNote` through a foothold even when the owner writes it down; the keyboard answer byte-identical to the base.
- JS `test/js/password-signin-mode.test.mjs`: one row; the Captured tag, the two-tag limit with "+1", a 32-character tag cut with an ellipsis, and the short-window badge per group; under picker `accounts` no unlisted captured tile; under `known` the unlisted captured tile; no second Other user; every line of 5.2 in its state; the pair cap and the in-place late redraw keeping focus and typed text; a failed `/login_accounts`; a failed `/capture_secrets`. `test/js/access-remote-signin.test.mjs`: "no /login_accounts request" becomes "one with the foothold, and never a post-it"; a headless host opens with the headless line. `test/js/pc-monitor-frame.test.mjs`: the row inside the screen at x1 and x2, with a 32-character tag.
- Scenario `test_access_networks` (on the base):
  - Add policy `"nla": { "remote": "allowed", "remoteScreen": "typed" }`.
  - Add two PCs to `desk_room` on `office_lan`, picker `accounts`: `it_pc` (`HB-IT-01`, `access: { roles: ["it"] }`, default policy, so Ian's captured tile shows as his tagged PC tile) and `ops_pc` (`HB-OPS-02`, `access: { roles: ["staff"] }`, policy `nla`). Positions clear of Sam's desk and the dock, checked in a render.
  - `p3_see`'s condition becomes the six-host list `'door_box,it_pc,kiosk_pc,lena_pc,ops_pc,sam_pc'`.
  - PLAYTEST.md: P3 "all six hosts"; Run 0 step 5's host list (six, in order); the expected validator output (identity reach and "Reachable without a foothold" gain the two desk-room PCs); the captured-tile selector at line 59 becomes `.signin-tile[data-npc-id="lena"] .signin-tag`; the harness note becomes "on a tiles screen, `clickText('Other user')` before typing into field 0"; P5, P8 and the P3 script updated.
  - New beats: P5b (in Run B, where Sam's PC has not been opened at the keyboard: Sam's PC over the network lists Sam, Lena and Ian, as every account holder has the `staff` role; untagged before the lobby capture cards, Lena and Ian tagged after), P5c (HB-IT-01 after Ian's card: one tagged Ian tile, no duplicate), P5d (HB-OPS-02: typed, the NLA line, captured tiles only).

### 5.5 Live proof

New games of `test_access_networks`: plant the drop box; Sam's PC from the view (tiles, headshots, Other user), before and after the cards; HB-OPS-02 (typed, the NLA line); read Ian's card, open HB-IT-01 (tagged tile, no duplicate); HB-DOOR-01 from the view (the headless line, signs in as P8 does today); P3 completes on six hosts. Re-run P5 and P8. On `lab_physical_pentest`, with the drop box planted: LW-OPEN-07, the hot desk and LW-DOOR01 from the view, before K0 and under each D1 lab answer. Shots at the four sizes, including the loading state with `/login_accounts` held back by a route delay, and the late redraw after the cap. Tampered client: a foothold not held (403), a malformed one (400).

### 5.6 Sync size

Nothing stored. One extra GET per remote screen open: at most one tile per admitted account, about 150 bytes each.

### 5.7 Cheat analysis

The tiles name accounts admitted at a PC the player reaches through a foothold the server holds: the enumeration a real exposed screen allows, which the policy can turn off. No password, note or capture state is in the answer; POST /login still checks every password.

## 6. Slice K1: the registry, proofs and keyring (server and validator)

Base: main after K0. Size: M. No sign-in behaviour changes.

### 6.1 Files and functions

- `lib/break_escape/credential_model.rb` (new): section 3.6, plus `registry(scenario)`, `accepts(policy)`, `pcs_accepting(scenario, id)`, `end_globals(scenario)` (`{ global => [credId] }`), `item_definition(scenario, itemId)` (the scope of section 3.5's `held` row).
- `app/models/break_escape/credential_keyring.rb` (new concern in `Game`):
  - `credential_proof_holds?(credential)`: `session`, `planted`, `dropped` through `capture_proof_holds?`; `held` and `foothold` as section 3.5.
  - `keyring_entries(pc: nil, route: nil)`: implicit password entries built by calling `account_capture_usernames` and `capture_secrets_for_client`, plus registry entries of built kinds whose proof holds.
  - `keyring_for_client(...)`: section 6.2.
- `lib/break_escape/item_identity.rb`: `credential` in `FORGEABLE_ITEM_FIELDS`.
- `scenario-schema.json`: top-level `credentials` (closed entry; `x-ref` on `account`, `connectsTo`, `foundIn`, `proof.session`, `proof.held`, `endsOnGlobal`), policy `accepts` (unique strings), item `credential` (`x-ref: credential`).
- `Game#filtered_scenario_for_bootstrap` (`game.rb:1280`): `filtered.delete('credentials')`.
- `tools/playtest/lib/access_leak_scanner.rb`: flag any response with a `credentials` key, a keyring entry whose proof does not hold in the recorded state, or a registry password entry carrying `password`.
- `scripts/validate_scenario.rb`: `credentials` in `known_top_level`, `credential` in `known_item_fields`, new `check_credentials` (6.3).
- Dungeon graph: edges proof source (item, PC, foothold) to a credential node, and credential node to each PC that accepts it.
- `README_scenario_design.md`: a credentials section (registry, kinds, proofs, policy `accepts`, item `credential`, the item type rule, the ink gift path for an invite).
- `docs/IDEAS_BACKLOG.md`: the connection icon; the later kinds (RFID card as a credential, one-time code, key file).

### 6.2 GET /keyring

`GET /games/:id/keyring?pc_id=&foothold=&from=&relay=&rev=`, `no-store`, a read with no side effects.

```json
{ "rev": "9f2c1a",
  "entries": [
    { "id": "lena.password", "kind": "password", "source": "capture",
      "account": { "npcId": "lena", "username": "lfox", "displayName": "Lena Fox" },
      "label": "Captured", "password": "Ledger-Lena-9" },
    { "id": "jake_pw_note", "kind": "password", "source": "registry",
      "account": { "npcId": "jake", "username": "jbrooks", "displayName": "Jake Brooks" },
      "label": "passwords.txt", "foundIn": "lena_passwords_txt" },
    { "id": "lena_rdp", "kind": "saved_connection", "source": "registry",
      "account": { "npcId": "lena", "username": "lfox", "displayName": "Lena Fox" },
      "label": "HB-FIN-02.rdp", "host": "HB-FIN-02", "connectsTo": "lena_pc",
      "routes": [{ "foothold": "jack_comms_port" }], "sessionHeld": false,
      "targetOff": false, "remoteBlocked": false, "forThisPc": true, "accepted": true },
    { "id": "jake_assist", "kind": "assist_invite", "source": "registry", "ended": true,
      "account": { "npcId": "jake", "username": "jbrooks", "displayName": "Jake Brooks" },
      "label": "Remote assist code (Jake)", "host": "HB-FIN-03", "connectsTo": "jake_pc" }
  ] }
```

- `password` appears only on an implicit (captured) entry, by today's rules (`revealSecret` and the capture proofs), through the same readers as GET /capture_secrets. A registry password entry never carries a value: the player reads the file.
- Connecting kinds carry:
  - `routes`: held footholds that reach `connectsTo` now (by seq), then (K4) sessions it can be reached from, then `{ relay: true }` for relay kinds. Empty when nothing reaches it. Power and `remote: "blocked"` are not judged here; they are separate fields.
  - `sessionHeld`: the server holds a session at `connectsTo` opened with this credential.
  - `targetOff`: the target's service is off. `remoteBlocked`: its policy blocks remote sign-in (always false for a relay kind).
- `foothold`, `from` and `relay` name the screen the client is drawing, so the server can decide whether `pc_id` is a screen the player can open; they never assert reach. `routes`, `sessionHeld` and every other field are computed from server-held footholds and sessions only.
- With `pc_id`: `forThisPc` (a password entry, or `connectsTo` is this PC) and `accepted` (the PC's policy takes the kind). Admission is not pre-judged; the sign-in answers it, as for typed passwords. A `pc_id` the player cannot open a screen for (by keyboard, or the named route) is ignored.
- `ended`: an `assist_invite` in `endedCredentials` whose proof still holds is listed with `ended: true` and no routes, so the client can say why it no longer works.
- `rev`: a short digest of the answer; a request whose `rev` matches gets `{ rev, unchanged: true }`.
- Values of non-password kinds never exist in any answer.

### 6.3 Validator checks (`check_credentials`)

Errors:
- unknown kind; a kind not built yet ("not supported until phase 2/3"); `accepts` naming an unknown kind;
- `account` not an account holder; `connectsTo` not a sign-in PC, missing on a connecting kind, or present on `password`; `connectsTo` a headless PC for `assist_invite` (no screen to share);
- `proof` not exactly one known kind; `session` naming no sign-in PC; `held` naming no scenario item; `foothold` naming no foothold id any jack, access point or implant action can create;
- a proof that can never hold: a `held` item that is not takeable and is in no declared grant, NPC `itemsHeld` or start inventory; a `session` PC no account is admitted at and no claim opens; a `planted` or `dropped` proof `CaptureModel` already finds unreachable;
- an item with `credential` whose type is `notes`-family or always-allowed;
- an item `credential` naming no registry id; `endsOnGlobal` naming an undeclared global;
- more than 64 entries; an id outside the pattern.

Warnings:
- a credential no machine accepts: no sign-in PC whose policy accepts the kind, admits the account and is `connectsTo`;
- a `connectsTo` PC whose access list does not admit the account;
- a `saved_connection` whose `connectsTo` no foothold, access point or (K4) linked sign-in PC can reach;
- a `held` item without the matching `credential`, or an item `credential` whose entry's proof is not `held` on that item;
- a `held` item for an `assist_invite` given by a declared grant (claimable at once; use the NPC's `itemsHeld` and the ink gift);
- a `foundIn` item whose text does not contain the account's password (a substring check, never quoted; stays a warning), or that is not inside the proof's session PC (its contents, mapped shares or profiles);
- `accepts` without `password`; `accepts` on a policy no PC uses.

### 6.4 Tests

- `test/unit/credential_model_test.rb`: kinds, default accepts, proof kinds (exactly one key), registry cap and order, `end_globals`, `item_definition` from `itemsHeld`.
- `test/models/break_escape/credential_keyring_test.rb`: each proof holds and stops holding; an always-allowed notepad posted with the .rdp's id, name and `credential` does not prove `held` (the field is stripped, and the type differs); a `text_file` with the .rdp's name but another id does not (no name fallback); a room add with that id does not; implicit entries equal GET /capture_secrets; registry password entries never carry `password`.
- `test/controllers/break_escape/keyring_route_test.rb`: answers, `rev` and `unchanged`, routes, `sessionHeld`, `targetOff`, `remoteBlocked`, `forThisPc` and `accepted`, `ended`, an unreachable `pc_id` ignored.
- `test/controllers/break_escape/capture_secrets_unchanged_test.rb`: the golden check.
- `test/controllers/break_escape/sync_payload_size_test.rb`: bootstrap without `credentials`; GET /keyring at 64 entries under 16 KB.
- `test/js/validator-credentials.test.mjs`: one fixture per error and warning, through the real validator.
- Scenario `test_access_keyring` (section 9.1), created here and validator-clean, with its dungeon graph.

### 6.5 Live proof

GET /keyring from the page on a new game of `test_access_keyring`, before and after each proof (sign in at Sam's PC and take the .rdp, sign in at Lena's PC, plant the drop box); the bootstrap has no `credentials` key; the notepad forgery from the page leaves the keyring unchanged.

### 6.6 Sync size

Nothing stored. GET /keyring is a read: at most 64 registry entries plus one per captured account, about 300 bytes each; a repeat with `rev` is a few bytes.

### 6.7 Cheat analysis

The registry never reaches the browser. Every proof reads server-written state. `held` matches the scenario item by type and id, reads the stored item's own `credential`, and that field can only come from the server, so neither a room add nor an always-allowed item with a chosen id and fields proves it. No value of a non-password kind exists. A password value is served only where GET /capture_secrets already serves it.

## 7. Slice K2: the POST /login credential branch (server)

Base: main after K1. Size: M. Nothing in the client calls it yet.

`POST /login { pc_id, credential, foothold? | from? | relay? }` goes to `Game#attempt_credential_login!`. In order:

1. The PC exists (404 as today).
2. `credential` matches the id pattern, names a registry entry of a built connecting kind, and its proof holds. Otherwise the generic refusal `{ success: false, message: "Incorrect username or password" }`, the same body for an undeclared id, a declared but unproven id, an implicit or registry `password` id (passwords are typed) and a malformed id. Nothing is counted.
3. `connectsTo` is this PC, else 422 `{ message: "This connection is for another PC", wrongPc: true }`.
4. The route is one the kind allows (section 3.7), else the generic refusal; no route at all (the keyboard) is the generic refusal too. Then the route is judged as POST /login judges a foothold today: 403 unreachable, 403 not_responding (off, for every route), 422 remoteBlocked (`foothold` and `from` only; the relay is the holder's own tool).
5. The policy accepts the kind, else 422 `{ kindRefused: "<kind>" }`.
6. The access list admits the account, else 422 `LOGIN_NOT_PERMITTED`.
7. A kind with `honours_lockout` is refused while the account is locked out at this PC (`account_locked_out_at?`), with `LOGIN_LOCKED_OUT` and `lockout: true`.
8. An `assist_invite` in `endedCredentials`: 422 `{ ended: true }`.
9. `start_login_session!(pc, npc, 'credential', credential:, route)` writes section 3.8's record; the answer is `login_session_answer` plus `{ kind, label, route }`.

Steps 3 and 5 to 8 answer only for a held, proven credential, so the browser cannot probe the registry. The client turns `kindRefused`, `wrongPc`, `lockout` and `ended` into the text of section 8.5.

The typed branch (`username` and `password`) refuses a body carrying `relay` with the generic refusal, uncounted.

### 7.1 Ending an invite

- `credentialEndGlobals`, the bounded map `CredentialModel.end_globals` (at most 64 entries), is written by a new bootstrap writer `record_credential_end_globals!` in `run_bootstrap_writers!` (`prepare_bootstrap_state!`, where `scenario_data` is loaded). `bootstrap_state_needs_write?` gains a term `credential_end_globals_stale?`: true when the scenario declares any `endsOnGlobal` and the stored map is missing or its digest differs from the scenario's. Without that term the writer would never run on a game with no other bootstrap work. The writer then runs the end check below once, so a global that turned true before the cache existed is caught on the next bootstrap. A scenario with no `endsOnGlobal` never writes the key.
- In the sync merge, after globals are applied, the server checks only that cached map: for each listed global now true, it adds the credential ids to `player_state['endedCredentials']` (grow-only, at most 64) and deletes relay sessions whose `credential` is one of them. No scenario load on sync. If the cache is missing (a sync before any bootstrap), the merge does nothing for credentials; the global stays true and the next bootstrap ends the invite.
- The sync answer carries `endedRelayPcIds`, the PCs whose relay session this merge ended, only when non-empty (at most 64; each credential ends once per game, since `endedCredentials` is grow-only, so each (PC, credential) pair is sent at most once; the client applies it idempotently).
- A client that clears the global later cannot revive the invite. A client that never lets the NPC end it keeps the invite, which honest play can also reach (the NPC may never become suspicious).
- On reload the relay session ends (`reload_ended_session_ids`), but the invite is still held and not ended, so Connect works again until the NPC ends it.
- Both keys go in `ACCESS_STATE_DEFAULTS`, are written only by the server and are never read from a client body or sent to the client.

### 7.2 Other server changes

Section 3.8's readers (`session_route_up?`, `reach_session_hosts`, `host_row`, `desktop_request_allowed?` with `desktop_refusal` and `render_login_desktop` threading the route, `settle_session_at_keyboard!`, `session_for_client`, reload); `start_login_session!` takes the credential fields; `login_session_answer` adds `kind`, `label` and the route; GET /container passes `relay=1` (and in K4 `from=`) through; POST /logout ends a relay session as any other. `displaced` (client) and its server counterpart skip a relay session when the NPC sitting down is the account holder: it is his own session.

### 7.3 Tests

- `test/controllers/break_escape/credential_login_test.rb`: each step's refusal; the generic body byte-identical across undeclared, unproven, password and malformed ids; nothing counted; no route (the keyboard) refused; a relay param on a saved connection refused; `relay` on the typed branch refused, uncounted; a lockout refuses `saved_connection` (with `lockout: true`) but not `assist_invite`; relay with no reach succeeds and fails on an off PC; the ended invite stays ended after the global is cleared; reload ends a relay session and Connect works again; `host_row` lists a foothold credential session with its own `via` and `remote: true`, and never a relay session; `session_for_client` after reload reports a credential session's route.
- `test/models/break_escape/credential_sessions_test.rb`: `session_route_up?` for relay (ended, off) and foothold credential sessions; a relay session at a host on a reached network does not pivot across its links; pruning on unplug as for password sessions; `reload_ended_session_ids` versus `claimed_session_ids`; `desktop_request_allowed?` refuses `relay=1` when the record has no `relay`, and never falls to the keyboard rule; GET /container with `relay=1` reaches the relay branch through `render_login_desktop` and `desktop_refusal`; a saved-connection session opened at the target's keyboard keeps its foothold and ends on unplug; a credential session locks and unlocks through slice 6's predicate with the account's password, counted.
- `test/models/break_escape/bootstrap_writers_test.rb`: a fresh game of a scenario with `endsOnGlobal` and no other bootstrap work writes `credentialEndGlobals`; a scenario without one never does.
- `test/controllers/break_escape/sync_end_globals_test.rb`: the sync merge records an end with no `scenario_data` query (assert the narrow load); the answer carries `endedRelayPcIds` once; a sync before any bootstrap records nothing and the next bootstrap ends the invite.

### 7.4 Live proof

Tampered-client calls from the page against `test_access_keyring`: an undeclared id, an unheld .rdp, a notepad posted with the .rdp's id and `credential`, the .rdp at its own keyboard, a relay param on the .rdp, `relay` with a typed password, the .rdp at another PC, the ops .rdp at a policy that refuses it, the pivot check (sign out at HB-DESK-01 and HB-FIN-02, check the drop box view lists `office_lan` only, open the relay at Jake's PC, check it still lists `office_lan` only, and that a scoped request to `server_lan` is refused), and, after Jake ends the invite, the global cleared by sync and a retry.

### 7.5 Sync size

The session record gains `via: "credential"`, `credential` (at most 64 characters) and one route field, in the one slot per PC. `endedCredentials` and `credentialEndGlobals` are bounded by the registry (64), server-only, and never sent by or to the client. The sync answer gains `endedRelayPcIds` only in the merge that ends an invite. The POST body gains one id and one route field.

### 7.6 Cheat analysis

Saved connections are secret-class and hard-enforced: one opens an account without its password, and its proof is an item taken from a room or a desktop through the server's own routes. The assist invite's proof is an item an NPC gives through ink (`#give_item` from Jake's `itemsHeld`), so it is best-effort under the cheat policy: the server checks Jake holds the code and can give it, and a tampered client could skip the conversation. That is the same access honest play reaches by choosing the helpdesk line, so it only saves time.

| Attempt | Server answer |
|---|---|
| Post an id without its proof, or a malformed id | generic refusal, nothing counted |
| Forge the item (notepad with the id and `credential`, or a room add) | `credential` stripped, type and id do not match; generic refusal |
| Take the code without the conversation | the NPC give check passes; accepted risk (time saved only) |
| Use it at the target's own keyboard | generic refusal |
| Use it at another PC | "for another PC" (needs a valid proof) |
| A relay route on a saved connection, or a relay on a typed password | generic refusal |
| A foothold not held, or not reaching | 403 as today |
| Pivot onward from a relay session | the reach walk skips relay sessions |
| Open a desktop with `relay=1` without a relay session | refused by the record check |
| A kind the policy refuses | `kindRefused` |
| Revive an ended invite by clearing its global | `endedCredentials` is grow-only on the server |
| Skip a lockout with a saved connection | refused while locked out |
| Read a token or hash value | no value exists in any answer |

## 8. Slices K3a, K3b and K3c: the keyring on screen (client)

### 8.1 K3a: the sign-in screen (shared module)

Base: main after K2. Size: M.

Only in a scenario that declares `credentials` (shipped scenarios are unchanged). On the remote screen, and on the keyboard screen for password entries only:

- **One tile per account, never per entry.** Order and inclusion as K0 (section 5.2), with keyring accounts in place of captured ones. Tags by kind, one casing, with K0's tag rules (two per tile then "+1", ellipsis, badge in the short window): "Captured", "Found in a file", "Saved connection", "Remote assist".
- **A "Found in a file" tag waits** until the client has opened that item in this page. The keyring module keeps the set of opened `foundIn` item ids for the page's life. After a reload the tag shows at once and its toast is skipped: an accepted gap, since the server keeps no record of a file being read.
- **Choosing an account** shows its ways in on the chosen line, in this order: one button per keyring credential for this PC ("Connect with HB-FIN-02.rdp"); for a found password, the line "Password in passwords.txt: type it from the file."; the Password field (filled only for a captured password the server served) and Sign in, always shown, since `password` is always accepted. A credential refused by this PC's policy shows as a greyed button with its refused reason under it and does nothing.
- **The teaching line** under a credential button, from the text table (8.5), and the same line once as a toast after the first successful use of each kind. In the short window the teaching line is not shown on the screen and the toast carries it; a refused reason always shows (it takes the teaching line's place).
- **Sign in** with a credential posts `credential` with the screen's route; refusals show in the screen's error line with 8.5's text, except a policy refusal already shown under its greyed button, where the error line stays empty.
- **Loading:** the remote screen waits for `/login_accounts`, `/capture_secrets` and `/keyring?pc_id=&<route>` together, under K0's pair cap (now three requests) and late redraw; the keyboard screen, in a scenario with `credentials`, waits for `/login_accounts` and `/keyring`. A failed `/keyring` shows the screen without keyring entries and the line "Your saved connections could not be loaded."
- **Worst cases to prove, at all four sizes:**
  - the tile row: six admitted accounts, three with keyring entries (one with two tags and a 32-character file name), with the pixel scrollbar and "More below" cue where the row scrolls;
  - the chosen line: Lena with a captured password, the .rdp and a refused kind, with the first credential button and Sign in in view without scrolling. At 1400x1000 the screen is the x2 560x350 layout where nothing scrolls, so the line must fit there as drawn.
- **Desktop:** the account bar keeps "Signed in as Lena Fox (lfox)" and adds a second line, "with the saved connection HB-FIN-02.rdp" (`container-minigame.js:949-951`); the bezel keeps the PC name. Switch user reuses the session's own route.

K3a uses the foothold route only. After K3a, a player with a planted drop box opens HB-FIN-02 from the network view and signs in with the .rdp.

Files: `minigames/password/password-minigame.js`, `css/password-minigame.css`, `systems/unlock-system.js` (the fetches), `api-client.js` (`keyring`, `loginWithCredential`), `systems/keyring.js` (new: the cache, `rev` and the opened `foundIn` set), `systems/screen-states.js:83`, `minigames/container/container-minigame.js` (account bar line), `systems/pc-sessions.js` (credential sessions).

Tests: `test/js/keyring-signin.test.mjs` (one tile per account, tags by kind, the `foundIn` wait and the reload case, buttons above an always-present Password field, the found-password line, greyed refused credential with its reason in the short window and an empty error line, password-only at the keyboard, error texts including the lockout line, loading, the cap and failure, nothing new in a scenario without `credentials`); `test/js/pc-monitor-frame.test.mjs` (both worst cases inside the screen at x1 and x2); `test/js/screen-states.test.mjs` (a password and a credential session show the desktop, a claim paints locked); harness copy lists for `systems/keyring.js`.

Live proof: beats R2, R4 and R5a of section 9.1 with the drop box planted, shots of every state at the four sizes with scrollbars shown, both worst-case fixture screens, `verify-run.rb`.

Sync: nothing stored; one GET /keyring per screen open, usually `unchanged`.

### 8.2 K3b: Connect and the find toasts

Base: main after K3a. Size: M.

- **Connect from the tray.** `inventoryMenuFor` (`systems/inventory-menu.js:87`): a held item with a connecting `credential` gets `[Connect, Examine]` (plus Drop here when droppable); with no observations, the click is Connect directly. The tray offers Connect only when no minigame is open, as the menu already checks (`inventory-menu.js:184`); otherwise the entry is greyed with "Close this screen first." Connect first flushes any pending sync, then asks GET /keyring and reads the entry, in this order:
  1. the entry is missing: toast "HB-FIN-02.rdp no longer works.";
  2. `ended`: toast "Jake Brooks ended the remote assist.";
  3. `targetOff`: toast `notRespondingMessage(host)` ("HB-FIN-03 is not responding."), as the view says over the network;
  4. `sessionHeld`: open its desktop by the session's route;
  5. `remoteBlocked`: toast the remote-off sentence ("Remote sign-in is off on HB-FIN-02.");
  6. no route: toast `unreachableMessage(host)` with the teaching half (8.5);
  7. a route (K4's `from` first, then footholds, then relay): POST /login with the credential and that route. On success, open the desktop and show the teaching toast the first time for the kind. On a refusal (`kindRefused`, `LOGIN_NOT_PERMITTED`, lockout, `wrongPc`), open the target's remote sign-in screen with the account and credential chosen and the refusal shown as 8.1 says.
  Connect starts no network-view trip, so closing the screen or desktop returns to the world, or to the opener given as `returnTo` (K4: the desktop it was started from).
- **Find toasts.** `systems/keyring.js` fetches a baseline after bootstrap, then asks with `rev` after a successful sign-in (once the desktop has opened), an inventory add or removal of an item with `credential`, a plant, implant or Wi-Fi join, and the opening of a `foundIn` item. Registry entries new since the last answer give one toast, worded by use under D4 (c), with names, hosts and labels from the entry:
  - saved connection: "Saved connection found: {label} signs in as {displayName} on {host}.";
  - assist invite: "{label}: Connect it from your inventory to join {displayName}'s session.";
  - password in a file: "{displayName}'s password is in {label}.";
  - with more than two at once, two then "and N more".
  Captured entries stay silent (the capture has its own notice). A `foundIn` entry waits until the item is opened. Nothing is written to globals or player state. D4 has the wording under its other options.
- **The keyring view** follows D4 (recommended: none in phase 1).
- **Backlog:** the NPC gift toast's emoji (`chat-helpers.js:141`) breaks the pixel-font rule; logged in `docs/IDEAS_BACKLOG.md`.

Files: `systems/inventory-menu.js`, `systems/unlock-system.js`, `systems/keyring.js`, `systems/pc-sessions.js`, `systems/network-links.js` (no trip for Connect; the helpers reused).

Tests: `test/js/keyring-client.test.mjs` (baseline at load, `rev` reuse, toast wording per kind and grouping, silence for captures, `foundIn` wait, Connect's seven outcomes in order, the flush before the GET, direct sign-in and the screen only on a refusal, `returnTo`, Connect greyed while a minigame is open); the inventory-menu test file (`[Connect, Examine]`, direct Connect without observations, the assist code's tray slot).

Live proof: beats R1, R3 and R5b on new games of `test_access_keyring`, shots at the four sizes, `verify-run.rb`.

Sync: nothing stored; one GET per trigger, usually `unchanged`.

### 8.3 K3c: the relay

Base: main after K3b. Size: M.

- **Relay mode.** The lockable's `remote` is `{ relay: true }` beside today's `{ footholdId }`. Connect on an accepted invite signs in and opens the desktop directly (8.2 step 7); the relay sign-in screen opens only to show a refusal, with header "Remote assist ({displayName})", the holder's tile chosen and no Other user, Switch user or Password field.
- **The relay desktop.** The account bar reads "Using {displayName}'s session (remote assist)", with one Disconnect in place of Switch user and Sign out, and no link line; the header reads "Remote assist session". Disconnect is POST /logout. Request params carry `relay=1`. Readers that branch on `remote`: `openLoginSignIn`, `openRemoteSignInScreen`, the sign-in post, `pc-sessions.js` remote fields, the container's header and params. The relay session carries slice 6's `locked` flag like any session and uses its lock and unlock predicate unchanged; the relay adds no unlock of its own.
- **Re-entry.** An open relay session is reached again only by Connect (8.2 step 4); the network view does not list it. At the holder's own keyboard during a relay session the desk rules apply and the relay session is not offered there.
- **Ending.** `pc-sessions.js` handles the sync answer's `endedRelayPcIds` as `linkDropped` handles `endedPcIds`: the mirror drops the session and an open relay desktop closes with "{displayName} ended the remote assist.".
- **Displacement.** The holder sitting down at his own PC does not end the relay session (unit test only; the test scenario's Jake never sits).

Files: `systems/unlock-system.js`, `systems/pc-sessions.js`, `minigames/container/container-minigame.js`, `minigames/password/password-minigame.js` (relay screen), `api-client.js` (sync answer handling).

Tests: `test/js/access-remote-signin.test.mjs` (relay headers and params, the refusal-only screen, re-entry by Connect); `test/js/keyring-client.test.mjs` (`endedRelayPcIds` closes the desktop with the text); `test/js/pc-sessions.test.mjs` (no displacement by the holder).

Live proof: beats R6 to R9 and R11 on new games of `test_access_keyring`, shots of the relay desktop at the four sizes, `verify-run.rb`.

Sync: nothing stored by the client; `endedRelayPcIds` arrives once per ended invite.

### 8.4 Cheat analysis for K3a to K3c

Display only. Every sign-in goes through section 7's checks; the client never holds a non-password value; a registry password is never sent.

### 8.5 Player-facing text (decision D7)

On-screen text only, not spoken, so it lives in the engine's text table keyed by kind and state. Every name, host and label is a template field filled from the entry or the PC (`{displayName}`, `{host}`, `{label}`), never free text; the examples use the test scenario's names. States the view already names reuse its helpers (`unreachableMessage`, `notRespondingMessage`, `REMOTE_OFF_TEXT`), so one state has one phrasing everywhere.

| Key | Text | Alternative for D7 |
|---|---|---|
| password in a file teach | "People save passwords in files. Anyone who reaches the file has the account." | "A password in a file is a password anyone can read." |
| saved_connection teach | "The password is saved inside this file, so opening it signs you in as {displayName}." | "This file remembers {displayName}'s password. Whoever holds it is {displayName}." |
| assist_invite teach | "{displayName} let you into his session because you said you were the helpdesk. Check who is asking before you share access." | "{displayName} let you into his session. Nobody checked who was asking." |
| saved_connection refused | "This PC always asks for the password, so a saved one is ignored. That setting is the fix." | "{host} does not accept saved passwords. That setting stops this attack." |
| assist_invite refused | "{host} does not allow remote assistance." | "Remote assistance is turned off on {host}." |
| saved_connection locked out | "This account is locked on {host}, so the saved password is refused too." | |
| wrong PC | "This connection is for another PC." | |
| ended | "{displayName} ended the remote assist." | |
| off (any remote route) | `notRespondingMessage`: "{host} is not responding." | |
| remote blocked | "Remote sign-in is off on {host}." (built on `REMOTE_OFF_TEXT`, also used by K0's race close) | |
| no route | `unreachableMessage` plus "You need a way onto its network.": "{host} can't be reached over this link. You need a way onto its network." (the helper gains the second sentence, so the view says it too) | |
| no longer works | "{label} no longer works." | |
| K0 lines | as section 5.2 | |
| found password on the chosen line | "Password in {label}: type it from the file." | |
| find toasts | as 8.2 | under D4 |
| relay desktop | "Using {displayName}'s session (remote assist)" | "{displayName}'s screen, shared with you" |
| tray Connect greyed | "Close this screen first." | |

## 9. Slice K4: signing in from a desktop

Base: main after K3c. Size: M. Decision D6 says whether it is in phase 1 (recommended: yes).

- Route `from: pcId` (section 3.7) in POST /login, GET /keyring `routes`, `desktop_request_allowed?` (with `desktop_refusal` and `render_login_desktop`), `session_route_up?` and `host_row` (section 3.8).
- `prune_unreachable_sessions!` ends a `from` session whose source session is gone; `logout_session!` and `end_claimed_sessions!` already call it.
- Client: Connect prefers a `from` route whose source is the desktop the player has open; the remote screen header reads "Remote sign-in from HB-DESK-01". On the desktop where the file sits, the file's click offers Connect beside Take (no need to take it first), and `returnTo` is that desktop, so the X on the target's desktop goes back to it. Switch user on a `from` desktop reuses the `from` route; the view's Open on a `from` session opens it with `from=`.
- Tests: `test/controllers/break_escape/credential_from_route_test.rb` (route checks; source logged out ends the session; source PC switched off refuses the desktop and scoped requests, and allows them when it is back; a claimed source ends on reload and the chain with it; no `from` for a relay kind; a `from` session survives reload and `session_for_client` reports it as remote); JS route choice, the desktop Connect, `returnTo`, Switch user and the view's Open.
- Live proof: beat R10, from Sam's keyboard with no drop box.
- Sync: one route field in the session record.
- Cheat: `from` names a session the server holds; reach is the walk mapped shares already use.

### 9.1 Test scenario `test_access_keyring`

Browser-only, no VM, built in K1 and grown through K4. `social.captures.revealSecret: true`, so a captured password fills when served. Start inventory: the drop box only. Every account holder is a room NPC with a sprite, talk portrait and headshot, with a varied cast.

**Networks:** `office_lan`; `server_lan`, linked from `office_lan`.

**Policies:** `finance` and `pw_only` as section 3.2.

**Rooms:**

| Room | Door from | Lock | Holds |
|---|---|---|---|
| Lobby (start) | | none | signs for the beats; Lena Fox standing at reception (away from her desk, so her PC is free); a capture card for Ian (as `test_access_networks`: reading it fires `addCapture`; Ian's proof is `planted: drop box on comms_port`) |
| Office | Lobby, north | none | Sam's PC `sam_pc` (`HB-DESK-01`, `office_lan`, access `{ people: ["sam"] }`, picker `accounts`, sticky note with Sam's password); Sam's desktop holds `HB-FIN-02.rdp` (`lena_rdp_file`, takeable); Sam Okafor standing by the window, never sitting |
| Comms | Office, east | none | jack `comms_port` on `office_lan`; `SV-OPS-01` `ops_pc` in a rack (`server_lan`, policy `pw_only`, access `{ roles: ["it"] }`); Ian Shaw standing |
| Finance | Office, north | PIN; the code is in `door_code.txt` on Lena's desktop, so the room opens only after R2 | Lena's PC `lena_pc` (`HB-FIN-02`, `office_lan`, policy `finance`, access `{ people: ["lena", "jake"] }`, picker `accounts`); her desktop holds `passwords.txt` (`lena_passwords_txt`, not takeable), `door_code.txt` and `SV-OPS-01.rdp` (`ops_rdp_file`, takeable); Jake's PC `jake_pc` (`HB-FIN-03`, `office_lan`, policy `finance`, access `{ people: ["jake"] }`, picker `accounts`); Jake Brooks standing by his desk, never sitting |

**Cast:**

| NPC | Role | Account | Where | How the player gets in |
|---|---|---|---|---|
| Sam Okafor | staff | `sokafor` | Office, standing | sticky note on HB-DESK-01 |
| Lena Fox | finance | `lfox` | Lobby, standing | `lena_rdp` |
| Jake Brooks | finance | `jbrooks` | Finance, standing | `jake_pw_note` (Switch user on HB-FIN-02), `jake_assist` |
| Ian Shaw | it | `ishaw` | Comms, standing | captured password (card plus drop box), served under `revealSecret` |

**Registry:** `lena_rdp` (saved connection, `held: lena_rdp_file`); `ops_rdp` (saved connection for Ian, `connectsTo: ops_pc`, `held: ops_rdp_file`); `jake_pw_note` (`session: lena_pc`, `foundIn: lena_passwords_txt`); `jake_assist` (`held: jake_assist_code`, `endsOnGlobal: jake_ended_assist`).

**Jake:** `jake_assist_code` (type `text_file`) is in Jake's `itemsHeld`. Posing as the helpdesk, one ink choice gives it with `#give_item:text_file:jake_assist_code`, shown once (gated on a global set by the item's `onPickup`). Two ways end the invite:
- an `eventMappings` entry on Jake for the relay desktop opening at `jake_pc` (`pc_desktop_opened`, condition on the relay route) arms an NPC `timers` entry (as implants use) that, about 40 game seconds later, sets `jake_ended_assist` and plays a bark from Jake's NPC JSON ("Hang on. The helpdesk never calls me back. I'm ending this.");
- a later conversation, after the player has used the invite, lets him grow suspicious and sets the same global.

**Earned secrets:**

| Secret | Where | Unlocks |
|---|---|---|
| Sam's password | sticky note on HB-DESK-01 | Sam's desktop (R1, R10 source) |
| HB-FIN-02.rdp | Sam's desktop | Lena's PC over the drop box (R2) |
| Finance PIN | `door_code.txt` on Lena's desktop | Finance room (R6) |
| Jake's password | `passwords.txt` on Lena's desktop | Switch user to Jake on HB-FIN-02 (R4) |
| SV-OPS-01.rdp | Lena's desktop | refused by `pw_only` (R5) |
| Ian's password | capture card plus drop box, served under `revealSecret` | SV-OPS-01 over the network (R5) |
| Jake's assist code | Jake's ink | HB-FIN-03 by relay (R6) |

| Beat | What it proves | Slice |
|---|---|---|
| R1 | At Sam's keyboard (sticky note), take HB-FIN-02.rdp; toast "Saved connection found" | K1, K3b |
| R2 | Plant the drop box; HB-FIN-02 from the network view; Lena's tile tagged "Saved connection"; "Connect with HB-FIN-02.rdp" signs in; account bar line | K2, K3a |
| R3 | Open passwords.txt; Jake's toast and "Found in a file" tag appear only after it is opened | K1, K3a, K3b |
| R4 | The explainer's pivot: Switch user on HB-FIN-02 (through the drop box): Jake's tile tagged "Found in a file", the chosen line names passwords.txt, the password typed from the file signs in; Jake's shares map; a wrong password counts | K3a |
| R5a | Take SV-OPS-01.rdp; read Ian's card; open SV-OPS-01 from the view: Ian's tile tagged "Captured" and "Saved connection", the greyed "Connect with SV-OPS-01.rdp" with the policy reason, the password filled; Sign in works | K2, K3a |
| R5b | Connect the SV-OPS-01.rdp from the tray: the screen opens with the refusal under the greyed button | K3b |
| R6 | Read door_code.txt, open Finance, talk Jake into the code. Sign out at HB-DESK-01 and HB-FIN-02; the drop box view lists `office_lan` only. Connect the code: his desktop opens directly; "Using Jake Brooks's session"; the teaching toast; the view still lists `office_lan` only | K2, K3c |
| R7a | With the relay desktop open, Jake's timer ends the invite: the desktop closes with "Jake Brooks ended the remote assist." | K2, K3c |
| R7b | Connect again: toast "Jake Brooks ended the remote assist." (and, on a game where the timer was not reached, the ink end gives the same) | K2, K3c |
| R8 | Reload before R7a: the relay session is gone, Connect works again; the .rdp session through the drop box is kept | K2, K3c |
| R9 | Unplug the drop box: the .rdp session ends as a password session would | K2 |
| R10 | No drop box: from Sam's keyboard session, Connect on the .rdp signs in from HB-DESK-01 | K4 |
| R11 | Tampered-client checks of section 7.4 | K2 |

### 9.2 What each slice changes in existing scenarios

| Slice | Changes |
|---|---|
| K0 | Remote screens in the two networks scenarios with sign-in hosts. Every remote screen in both loses the "Captured sign-ins" heading and gains tagged captured tiles and K0's lines. `test_access_networks`: tiles under the default, two new PCs, the `nla` policy, P3's host list and PLAYTEST updates (section 5.4). `lab_physical_pentest`: under D1 lab answer (i), LW-OPEN-07 shows Melanie Pierce's tile with her captured password filled, and the hot desk its three tiles; under (ii), a policy `{ "remote": "allowed", "remoteScreen": "typed" }` on those two PCs keeps them free of PC tiles, with the NLA line; LW-DOOR01 (headless) shows its captured tiles tagged and the headless line under either answer. The build log has before and after shots of all three |
| K0 | No change in m01 to m10, `lab_social_engineering` or the other test scenarios: none has a foothold, so none opens a remote screen |
| K1 | None (validator checks apply only where `credentials` or `accepts` is authored) |
| K2 | None (no client calls the branch); `host_row`, `reach_session_hosts`, `settle_session_at_keyboard!` and `screen-states.js` change behaviour only for credential sessions |
| K3a to K4 | Only scenarios that declare `credentials` (`test_access_keyring`) |

## 10. Phase 2 sketch: tokens

- `KINDS['token'] = { built: true, connects: true, routes: %w[proof_foothold], honours_lockout: false }`; registry fields `connectsTo`, `proof: { foothold }`, `expiresMin`.
- Live while the proof foothold is held and until `expiresMin` game minutes after first use, on the server clock as the guest claim is timed. First use in `player_state['credentialClock'][credId]` (bounded by the registry, server-only).
- The session's `foothold` is the proof foothold, so today's pruning ends it on loss; `session_route_up?` adds the expiry.
- No new endpoint and no new answer shape; the client gains a kind label, a teaching line and "expires in".
- `lab_social_engineering`'s `sofia_remote` maps onto this kind (D5).

## 11. Phase 3 sketch: hashes and machine accounts

- `KINDS['hash'] = { built: true, connects: false, honours_lockout: false }`, never in `DEFAULT_ACCEPTS`; registry field `acceptedOn`; the login check adds "this PC is in `acceptedOn`".
- Used from the account's chosen line on the target's screen through the screen's route, as K3a's credential buttons are.
- Machine accounts (D3): a top-level `machineAccounts` block read through one `account_for_id` that every session reader moves to, or hashes tied to NPC accounts only.
- Same registry, proofs, policy field and POST branch.

## 12. Format version

Phases 0 to 3 add optional fields only (`remoteScreen`, `accepts`, `credentials`, item `credential`) and rename and move nothing, so no `FormatUpgrade` step: each slice runs at whatever format is current when it lands (format 1 on main; steps 8b and 8c hold 2 and 3). Conflicts with 8b and 8c are textual (both edit `known_item_fields` and the schema's item definition); whichever lands second rebases. A step would be needed only for a later tidy of the sign-in fields into one block, or folding `creds.password` into the registry; this plan does neither.

## 13. Decisions for the user

Each decision goes on the picks page with its evidence, before K1 starts. K0's shots are real (from its live proof). Every shot of a K3a to K4 state is a static mock: one HTML file per state, built from the K0 screen's real CSS and the monitor frame, captured at the named sizes, and labelled "mock". Diagrams that need K1's dungeon graph are hand-drawn Mermaid until K1 exists. Sizes are 1400x1000 and 390x844 unless named.

Mocks to build: (m1) the chosen line with each kind's tag and button; (m2) the greyed refused credential with its reason; (m3) the tray's `[Connect, Examine]` menu; (m4) the relay desktop's bar with Disconnect; (m5) R10's "Remote sign-in from HB-DESK-01" header; (m6) a desktop file offering Connect beside Take; (m7) the capture log's Captures section as one Keyring list with kind tags (D4 (d)).

### D1. The default remote screen: tiles or typed

- (a) `"tiles"` by default, missions opt into `"typed"` on hardened PCs. (b) `"typed"` by default, tiles only where a scenario opts in.
- Lab sub-question, `lab_physical_pentest`: (i) take the default; (ii) a `typed` policy on LW-OPEN-07 and the hot desk.
- Trade-off: tiles teach account enumeration on every exposed screen and make typed-username puzzles easier; typed teaches the control but hides the lesson unless a scenario opts in. In the lab under (i), the drop box view offers Melanie Pierce's own tile on LW-OPEN-07 with her captured password filled: a one-click remote sign-in to her PC, which the lab's scope text points away from (her password is for the hot desk, `scenario.json.erb:187, 1905-1908`).
- Recommendation: (a), matching the q92 pick and the keyboard screen; a hardened policy is one line. For the lab, (ii): it is played on Hacktivity and was designed around her password being used at the hot desk; taking the tiles there is a lab design change for its own pass. Under either answer the lab's remote screens change look (tagged captured tiles, no heading, K0's lines).
- Blocks: K0 (one constant; K0 builds with (a) and can flip).
- Evidence:
  - shots (real, K0): Sam's PC over the network before and after the capture cards; HB-OPS-02 (typed, the NLA line); HB-IT-01 (tagged Ian, no duplicate); HB-DOOR-01 (headless line); the 2b0 remote screen of Sam's PC today, for comparison; the short-window badge at 915x412;
  - lab shots: LW-OPEN-07, the hot desk and LW-DOOR01 over the drop box today, under (i) and under (ii);
  - JSON: the `finance` and `nla` policy snippets; the lab's two-PC policy under (ii); a GET /login_accounts answer over a foothold under `tiles`, under `typed` and for a headless host;
  - list: the two networks scenarios with sign-in hosts and the PCs on each whose remote screen changes under (a) and (b); the scenarios K0 leaves alone.

### D2. The phase 1 kinds

- (a) `saved_connection` and `assist_invite`. (b) also `token` now.
- Recommendation: (a). Tokens need the server clock and the foothold binding, and the content that wants them (the labs' items) needs its own yes (D5).
- Blocks: K1 and K2.
- Evidence:
  - JSON: the `sofia_remote` item (`lab_social_engineering/scenario.json.erb:170-200`); the four registry entries of `test_access_keyring` (9.1); the inline item shape that is not accepted, beside the registry form, with the reason;
  - tables: the kind catalogue (3.6) and the route table (3.7); K2's check list with and without the token rules;
  - mocks: m1 (each kind's tag and button) and m4 (relay desktop).

### D3. Machine accounts

- (a) a top-level `machineAccounts` block (not `accounts`, which clashes with `social.mail.accounts` and the `loginPicker` value); (b) hashes tied to NPC accounts only.
- Recommendation: (a), in phase 3, with the reader audit.
- Blocks: phase 3 only.
- Evidence:
  - JSON: both shapes for one service account and one hash;
  - list: the server readers that assume a session id is an NPC (`session_identity`, `session_for_client`, `host_row`, `login_session_answer`, `account_npcs`, the profile and share access checks), with line numbers.

### D4. A keyring view beyond the sign-in screens

- (a) a Keyring section in the capture log, which only `test_capture_log` carries, so elsewhere this is (c); (b) a Keyring inventory item given when a scenario declares `credentials`; (c) the sign-in screens and Connect only; (d) the capture log's Captures section becomes the Keyring (one list with kind tags, no duplicate rows).
- Recommendation: (c) for phase 1. The sign-in screen is where a credential is used, and "what does this machine accept?" is answered there; (a) and (d) reach one test scenario and duplicate the Captures and Sessions rows; (b) is new UI to justify with a mission that needs it.
- Blocks: nothing in K3a; K3b's toast wording.
- Find toasts, side by side:
  - under (c): as 8.2 ("Saved connection found: HB-FIN-02.rdp signs in as Lena Fox on HB-FIN-02.", "Remote assist code (Jake): Connect it from your inventory to join Jake Brooks's session.", "Jake Brooks's password is in passwords.txt.");
  - under (a) or (d): "New in your capture log: HB-FIN-02.rdp (saved connection for Lena Fox).", "New in your capture log: Jake Brooks's password, in passwords.txt.";
  - under (b): "New on your keyring: HB-FIN-02.rdp (saved connection for Lena Fox). Open the Keyring in your inventory.".
- Evidence:
  - shots: `test_capture_log`'s log with a captured password (real);
  - mocks: m1, m3, m7;
  - text: the toasts above;
  - list: the scenarios that carry a capture log.

### D5. The labs' granted sessions, for new games

- (a) not in phase 1; convert `lab_social_engineering`'s `sofia_remote` to a `token` credential in phase 2, for new games only; (b) convert it in phase 1 as an `assist_invite`; (c) leave it. For `lab_physical_pentest`'s item: (a) the same as the social lab; (b) leave it.
- Recommendation: (a) for both. The honest kind for a phished foothold is a token, the social lab is played on Hacktivity, and saved games keep their stored scenario data either way.
- Blocks: nothing in phase 1.
- Evidence:
  - JSON: both items with line numbers; each item now and as a token credential, side by side;
  - diagrams: their dungeon graph nodes today (real) and as credential nodes (Mermaid).

### D6. Signing in from a desktop (K4)

- (a) keep K4 in phase 1; (b) drop it, so a saved connection always needs a foothold.
- Recommendation: (a). The explainer's worked pivot ("open the .rdp from Sam's desktop") is this slice; without it the found-on-a-desktop chain becomes "find the file, plant a box, come back". It is M and touches only the session readers already changed in K2.
- Blocks: K4.
- Evidence:
  - diagrams (Mermaid): the explainer's pivot sequence (Sam's desktop, the .rdp, Lena's PC, Switch user to Jake) beside the K3-only flow (find, plant, return); the `test_access_keyring` beats R1 to R4 and R10 as a graph with and without the `from` edge;
  - table: the `from` row of the route table (3.7);
  - mocks: m5 and m6.

### D7. The on-screen text

- (a) approve section 8.5's table and 8.2's toasts as written; (b) take the alternative column where given; (c) reword named lines.
- Recommendation: (a). The teaching lines name the control as well as the risk, and the assist line fits the in-person pretext of the test scenario.
- Blocks: K3a (sign-in lines), K3b (toasts), K3c (relay lines); the K0 lines are part of D1. Placeholders until approved.
- Evidence: the table with both columns; mocks m1, m2 and m4 carrying the lines in place; the K0 shots for the K0 lines.

## 14. Defaults settled in this plan

- The keyring appears only in scenarios that declare `credentials`; keyboard screens show password entries only, and captured tags appear at a keyboard only in such a scenario.
- One look for a captured account on every remote screen: its tile with a "Captured" tag; tags by kind, at most two per tile.
- Under picker `accounts`, captured accounts the PC does not admit are not listed.
- A headless host answers its remote screen with no tiles and the headless line, never the NLA line.
- One phrasing per state, through the view's helpers; names and hosts are template fields.
- Connecting kinds never sign in at the target's own keyboard.
- `password` is always accepted, and the Password field is always on the chosen line; a list without `password` only warns.
- Admission is not pre-judged; the sign-in teaches it.
- A credential the policy refuses is shown greyed with its reason, so honest play meets the refusal.
- Registry password entries never carry the value: the player reads the file, and the tag waits until the file is opened in this page.
- A lockout refuses a saved connection (it presents the password), not an assist invite (the person's own session).
- A relay session does not extend reach, is not in the network view, ends on reload, and is not displaced by its own account holder; the invite stays usable until the NPC ends it.
- Credential sessions keep UI slice 6's `locked` flag and its one lock and unlock predicate; no credential-based unlock in phase 1.
- Credential items use an existing type with a tray slot (`text_file`), never a notes or always-allowed type, and `credential` is a server-only item field.
- Connect signs in directly when accepted; the screen opens only for a refusal. The tray offers Connect only with no screen open.
- The inline item shape is not accepted.

## Appendix A. Handover (2026-11-13, after review round 3 applied)

For the next agent continuing the plan's review loop. Remove this appendix when the loop ends.

- **Done.** Round 0 draft (8585b394b). Round 1: server B1 M2 m2 n2, UX B1 M11 m12 n5 (60159ca52). Round 2: server B0 M2 m4 n3, UX B2 M8 m12 n5; rewrite 71323e381. Round 3: server B1 M2 m3 n1 (d18976c43), UX B2 M8 m13 n3 (e0b6e123b); rewrite applying every B, M and minor (this commit), plus UI slice 6's session `locked` flag.
- **Next step.** Round 4 reviews (`CREDENTIAL_KEYRING_PLAN_REVIEW_R4_SERVER.md`, `..._R4_UX.md`), each by a fresh reviewer; rewrite; round 5 at the latest; stop at the first round with 0 B and 0 M from both.
- **Files touched:** `docs/achitechture/CREDENTIAL_KEYRING_PLAN.md` and the review files beside it. Branch `plan/keyring` in worktree `.claude/worktrees/p-keyring-plan`.
- **Gotchas:** HB-DOOR-01 and LW-DOOR01 are headless; the capture log is carried only by `test_capture_log`; PUT /sync_state loads no `scenario_data`; bootstrap writers run only when `bootstrap_state_needs_write?`; `notes` items never take a tray slot; accounts must be room NPCs; commit with explicit paths, UK English, no em or en dashes, no model names in repo files.
