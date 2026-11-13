# Credential keyring: build plan for phases 0 and 1

Status: plan. Decided by the user on 2026-11-13 (q92, option 3: "remote sign-in model: credential keyring, option 3"). Engine paths are under `public/break_escape/js/`. Line numbers are on main f956f5355 unless `2b0:` marks branch `build/ux-slice2b0`.

## 1. What this builds

A **credential** is anything the player holds that a PC accepts as proof that they are a particular account. The player's **keyring** is the list of credentials they have earned, computed on the server from state it already keeps. Each PC's policy says which kinds it accepts, and the server checks every use.

| Phase | Scope | Slices | Size |
|---|---|---|---|
| 0 | Policy `remoteScreen`; the target PC's own account tiles on the remote sign-in screen, passwords only | K0 | S to M |
| 1 | The `credentials` registry, the `held` and `foothold` proofs, policy `accepts`, the POST /login credential branch, the keyring on sign-in screens, credential items; kinds `password` (found in files), `saved_connection`, `assist_invite` | K1, K2, K3a, K3b, K4 | L in all (M, M, M, M, M) |
| 2 | `token` | sketch, section 10 | M |
| 3 | `hash`, `acceptedOn`, machine accounts | sketch, section 11 | M |

Each slice is one branch, built, reviewed and live-proved on its own, and merged before the next starts. Main stays playable and safe between slices: K1 changes no sign-in behaviour, K2 adds a server branch that nothing in the client calls until K3a, and K3a works through footholds alone.

Out of scope: tokens and hashes; any change to `lab_social_engineering` or `lab_physical_pentest` (decision D5); the option-2 inline item shape; any field tidy that would need a format step (section 12).

Changes from the explainer the user decided from, each for the user to see:
- The "Use from keyring" button and its list panel become a Keyring tag and button on each account tile (section 8.1): one action, no one-item menu.
- The loader does not accept the option-2 inline item shape: no content uses it, and a second shape is a second thing to test. Listed in D2's evidence.
- New-game conversion of the labs' items moves out of phase 1 into D5.
- The desktop pivot ("open the .rdp from Sam's desktop") is slice K4, with a user decision (D6) on keeping it in phase 1.

## 2. What exists today

- **POST /login** (`games_controller.rb:1320`, `Game#attempt_login!` at `game.rb:2141`): a username and password, or a claim, under `with_game_lock`. With `foothold`, the host must be reachable through it (`host_reachable_through?`, `network_access.rb:1171`), on, and not `remote: "blocked"`. Failures count per PC and normalised username (`record_login_failure!`, `game.rb:2836`) up to `maxAttempts`. `start_login_session!` (`game.rb:2883`) writes `sessions[pcId] = { id, via, foothold? }`, one slot per PC, and adds the PC to `signedInPcs`.
- **GET /login_accounts** (`games_controller.rb:1363`): the PC's tiles (`login_account_tiles`, `game.rb:2408`, by `loginPicker`: `accounts`, `known` or `false`) and the sticky note. It judges reach at the keyboard only; a request carrying `foothold` gets no note but is otherwise judged as if the player stood at the PC.
- **The remote sign-in screen** (`systems/unlock-system.js:627`, `openRemoteSignInScreen`) passes `picker: false` and `tiles: []`, never calls GET /login_accounts, and fills the captured sign-ins from GET /capture_secrets. The keyboard screen (`unlock-system.js:553-620`) opens after GET /login_accounts answers and shows no captures.
- **GET /capture_secrets** (`games_controller.rb:1568`): `secrets` (`capture_secrets_for_client`, `game.rb:1415`) and, in a networks scenario, `accounts` (`account_capture_usernames`, `network_access.rb:1385`). Capture proofs (`capture_proofs.rb:58`; `planted`, `dropped`, `session`) gate when an account's password is served.
- **Session readers.** `session_route_up?` (`network_access.rb:1015`) returns true at once for a session with no foothold (line 1023). `prune_unreachable_sessions!` (`network_access.rb:1150`) skips sessions with no foothold and ignores outages. `host_row` (`network_access.rb:911-935`) offers only `via == "password"` sessions and builds the held entry with `via: "password"` and `remote` from the foothold. `end_claimed_sessions!` (`game.rb:2362`) ends claims on reload.
- **Sync.** PUT /sync_state loads `SYNC_STATE_COLUMNS` only, without `scenario_data` (`games_controller.rb:2022`); `merge_global_variables!` (`game.rb:332`) runs there.
- **Inventory.** Items enter only through `/inventory` and `canonical_inventory_item` (`games_controller.rb:2544`). An always-allowed type (`notepad`, `games_controller.rb:2507`) has no server source and keeps the client's fields except `CLIENT_ITEM_FORBIDDEN_FIELDS`, which does not include `id`. `ItemIdentity.client_forged?` (`item_identity.rb:40`) catches only room adds with no source.
- **Inventory menu.** `inventoryMenuFor` (`systems/inventory-menu.js:87`) gives an item with more than one thing to do a small menu (an action plus Examine, plus Drop here).
- **Policies** ship in the bootstrap. The schema closes each policy (`scenario-schema.json:195-209`).
- **UX slice 2b phase 0** (in review): captured sign-ins as the shared `.signin-tile` tiles with headshots, above the form, in the PC monitor frame. Its review asks for a loading state showing neither form nor tiles until the list arrives, the empty state after the form, and a narrower tile loop.
- **Granted remote sessions** are hand-written `pc` items: `lab_social_engineering/scenario.json.erb:170-200` (`sofia_remote`) and `lab_physical_pentest/scenario.json.erb:586`.
- **The capture log** (`minigames/capture-log/`, sections Captures, Sessions, Findings; new rows write seen globals) is carried only by `test_capture_log`.

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

- `remoteScreen`: `"tiles"` shows the PC's own account tiles (by its `loginPicker`) over the network; `"typed"` shows none until a password is right, as Network Level Authentication does. Default: decision D1 (recommended `"tiles"`). Never affects the keyboard screen.
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

An ordinary item gains an optional `credential` field naming a registry id. It keeps an existing item type and icon (`text_file` for `HB-FIN-02.rdp`, `notes` for a written assist code), so no new art is needed. A small connection icon is logged in `docs/IDEAS_BACKLOG.md` for later.

```json
{ "id": "lena_rdp_file", "type": "text_file", "name": "HB-FIN-02.rdp", "credential": "lena_rdp",
  "takeable": true, "readable": false,
  "observations": "A saved remote desktop shortcut. The password is stored in it." }
```

The id is not secret: what the server checks is that the player holds the scenario's own item.

### 3.5 Proofs

All read from state the server already writes:

| Proof | Holds when | Server state read |
|---|---|---|
| `session: pcId` | The player has ever held a session at that PC | `signedInPcs` |
| `planted`, `dropped` | As capture proofs today (`capture_proof_holds?`) | `plantedItems`, `gainedFootholds`, `droppedItems` |
| `held: itemId` | An inventory entry that `ItemIdentity.same_item?` matches the scenario item definition with that id (type and identity both), is not `client_forged?`, and carries the definition's `credential`. An always-allowed item (a notepad) with a chosen id never matches, because its type differs from the definition's | `inventory` |
| `foothold: footholdId` | The foothold is held now | `footholds` |

`held` and `foothold` stop holding when the item leaves the inventory or the foothold is lost, and the entry leaves the keyring. A session already opened is ended by its own route rules (section 3.8), not by that.

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

`proof_kind` requires exactly one key, as `CaptureModel.proof_kind` does. The player-facing strings live in the client's text table (section 8.4), keyed by kind.

### 3.7 Routes

A connecting credential signs in only at its `connectsTo` PC, and never at that PC's own keyboard: a saved connection and an assist invite are used from somewhere else, and the game teaches that.

| Route | Kinds | Check | Session record |
|---|---|---|---|
| `foothold` | `saved_connection` | `host_reachable_through?(foothold, pc)` | `foothold` |
| `from: pcId` (K4) | `saved_connection` | the player holds a session at `pcId` whose route is up, `pcId` is on, and the target's network is in `networks_reachable_from(network of pcId)` | `from` |
| `relay` | `assist_invite` | none for reach: the account holder's own vendor relay. The PC must be on | `relay: true` |

A relay session does not extend reach: the reach walk counts any session only for networks a held foothold already reaches.

### 3.8 The session record and its readers

`sessions[pcId] = { id: npcId, via: "credential", credential: credId, foothold? | from? | relay? }`, one slot per PC, replaced by the next sign-in. `signedInPcs` gains the PC.

Server readers changed in K2 (and K4 for `from`):
- `session_route_up?`: before the blank-foothold return, a relay session is up while its credential is not in `endedCredentials` and the PC is on; a `from` session is up while the source session exists, the source's own `session_route_up?` holds, the source PC is on, and the target network is in `networks_reachable_from(source network)`. Otherwise the existing foothold logic. Every scoped reader (`session_admits?`, `resource_admits_player?`, the profile checks) goes through it.
- `prune_unreachable_sessions!`: iterate to a fixed point; also end a `from` session whose source session is gone (K4). Outages still never prune; `session_route_up?` refuses while the source is off and allows again when it is back.
- `host_row`: offer any session that is not a claim; the held entry's `via` comes from the session and `remote` is true when it has any route field (`foothold`, `from`, `relay`).
- Reload: `end_claimed_sessions!` uses a new `reload_ended_session_ids` (claims plus relay sessions); `claimed_session_ids` keeps meaning claims only.

Client readers that test `via === "password"` move to `via !== "claim"`: `systems/screen-states.js:83`. The others already test for `claim` (`pc-sessions.js:179/353/360`, `container-minigame.js:24/951`, `network-links.js:660`, `network-view-minigame.js:164`, `workstation-state.js:223`, `unlock-system.js:658/667`). K2's build log lists a fresh grep for `via`.

## 4. What every slice must keep

- **GET /capture_secrets answers stay identical.** No slice edits `capture_secrets_for_client`, `account_capture_usernames` or `account_capture_served?`. K1 adds a golden test of the answer for every fixture game in `test/fixtures/files/access_leak/responses.jsonl` and the test scenarios with captures.
- **Shipped scenarios unchanged.** Every new screen element appears only in a scenario that declares `credentials`, or (K0) in a remote screen, which only networks scenarios have. Section 9 lists what each slice changes per scenario.
- **No format step** (section 12).
- **Pixel-art rule and UI language:** 2px borders or the theme skin, pixel fonts only, authored headshots for every account, X closes, the frame wraps all content at 1400x1000, 390x844, 915x412 and 800x600, scrollers keep the frame whole with the pixel scrollbar and a "More below" cue.
- **Sync size:** each slice states what it stores and what each request sends.
- **Process:** commit before testing, explicit paths, no attribution lines; new static imports in engine JS go on each JS test harness copy list.
- **Live proof:** a keyless server on the builder's own port, a headless browser through the real routes, shots at the four sizes with scrollbars shown, `tools/playtest/verify-run.rb` showing progress on the server, and tampered-client checks sent with `fetch` from the page.

## 5. Slice K0: phase 0, the target's own tiles over the network

Base: `build/ux-slice2b0` once its review fixes are in. Size: S to M.

### 5.1 Server

- `scenario-schema.json`: policy `remoteScreen` (`enum: ["tiles", "typed"]`).
- `Game#remote_screen(pc)` (`network_access.rb`, beside `remote_blocked?`): the policy's value, else `DEFAULT_REMOTE_SCREEN` (D1).
- `GamesController#login_accounts` with `foothold` takes a new branch, `Game#remote_login_accounts(info, foothold)`:
  1. A `foothold` that is not an id string of at most 64 characters: 400 (it never falls through to the keyboard branch).
  2. Not held or not reaching the host: 403 `PC not reachable`. Headless: 403.
  3. `remote_blocked?`: 422 `{ remoteBlocked: true }`.
  4. `host_service_off?`: 403 `{ reason: "not_responding" }`.
  5. Answer `{ pc_id, remoteScreen, loginAccounts }`: `login_account_tiles(pc)` under `tiles` (`known` reads `encounteredNPCs`), `[]` under `typed`. Never `postitNote`.
  Without `foothold` the action is unchanged; `Cache-Control: no-store` stays.

### 5.2 Client

- `api-client.js`: `loginAccounts(pcId, { foothold } = {})`.
- `unlock-system.js` `openRemoteSignInScreen`: fetch `/login_accounts?foothold=` and `/capture_secrets` together; the screen stays in 2b0's loading state ("Checking...", no form, no focus) until both answer, then `scene.setRemoteAccounts({ picker, tiles, captured, remoteScreen })` lays it out once. A failed `/login_accounts` leaves the loading state with no PC tiles, as a failed `/capture_secrets` does today. A 403 or 422 closes the screen with the view's own strings (`network-links.js` not-responding and unreachable texts, and "Remote sign-in is off on this PC"); the view already hides sign-in on a blocked row, so this covers only a race.
- `minigames/password/password-minigame.js`: one tile row. Under `tiles`: the PC's accounts (by its picker), then captured accounts the PC does not list, then one Other user tile. A captured account the PC lists shows once, as its PC tile with a "Captured" tag (pixel font, under the name; in the short window, where the username line is hidden, a 2px corner badge) that fills the password when served. Under `typed`: the captured tiles and Other user, as 2b0, plus one line under the form: "This PC asks who you are before it shows any accounts." The chosen line, Change and the fold rules are the keyboard's.
- `pc-sessions.js` `screenShown(pcId, tiles, ...)` gets the PC tiles shown.

### 5.3 Validator

- `remoteScreen` on a policy whose `remote` is `blocked`: warning.
- `remoteScreen: "tiles"` on a policy used only by PCs with `loginPicker: false`: info line.

### 5.4 Tests

- Rails `test/controllers/break_escape/network_remote_tiles_test.rb`: steps 1 to 5; `known` over the network; `typed` gives `[]`; no `postitNote` through a foothold even when the owner writes it down; the keyboard answer byte-identical to main.
- JS `test/js/password-signin-mode.test.mjs`: one row, the Captured tag and its short-window badge, no second Other user, the typed line, the loading state with both requests pending, a failed `/login_accounts`. `test/js/access-remote-signin.test.mjs`: "no /login_accounts request" becomes "one with the foothold, and never a post-it". `test/js/pc-monitor-frame.test.mjs`: the row inside the screen.
- Scenario `test_access_networks`: add two small PCs in the IT room on `office_lan`, both with picker `accounts`: `it_pc` (`HB-IT-01`, `access: { roles: ["it"] }`, default policy, so Ian's captured tile shows as a tagged PC tile) and `ops_pc` (`HB-OPS-02`, `access: { roles: ["staff"] }`, policy `nla`). Sam's PC (`HB-DESK-01`) shows its tiles over the network with no tag. Lena's PC keeps `loginPicker: false`. PLAYTEST.md: beats P5b (tiles over the network, Sam's PC), P5c (Captured tag, HB-IT-01 after Ian's card), P5d (typed, HB-OPS-02); the harness note becomes "on a tiles screen, `clickText('Other user')` before typing into field 0"; P5 and P8 scripts updated.

### 5.5 Live proof

New games of `test_access_networks`: plant the drop box; Sam's PC from the view (tiles, headshots, Other user); HB-OPS-02 (typed, the NLA line); read Ian's card, open HB-IT-01 (tagged tile, no duplicate). Re-run P5 and P8. Shots at the four sizes, including the loading state with `/login_accounts` held back by a route delay. Tampered client: a foothold not held (403), a malformed one (400).

### 5.6 Sync size

Nothing stored. One extra GET per remote screen open: at most one tile per admitted account, about 150 bytes each.

### 5.7 Cheat analysis

The tiles name accounts admitted at a PC the player reaches through a foothold the server holds: the enumeration a real exposed screen allows, which the policy can turn off. No password, note or capture state is in the answer; POST /login still checks every password.

## 6. Slice K1: the registry, proofs and keyring (server and validator)

Base: main after K0. Size: M. No sign-in behaviour changes.

### 6.1 Files and functions

- `lib/break_escape/credential_model.rb` (new): section 3.6, plus `registry(scenario)`, `accepts(policy)`, `pcs_accepting(scenario, id)`, `end_globals(scenario)` (`{ global => [credId] }`).
- `app/models/break_escape/credential_keyring.rb` (new concern in `Game`):
  - `credential_proof_holds?(credential)`: `session`, `planted`, `dropped` through `capture_proof_holds?`; `held` and `foothold` as section 3.5.
  - `keyring_entries(pc: nil, route: nil)`: implicit password entries built by calling `account_capture_usernames` and `capture_secrets_for_client`, plus registry entries of built kinds whose proof holds.
  - `keyring_for_client(...)`: section 6.2.
- `scenario-schema.json`: top-level `credentials` (closed entry; `x-ref` on `account`, `connectsTo`, `foundIn`, `proof.session`, `proof.held`, `endsOnGlobal`), policy `accepts` (unique strings), item `credential` (`x-ref: credential`).
- `Game#filtered_scenario_for_bootstrap` (`game.rb:1280`): `filtered.delete('credentials')`.
- `tools/playtest/lib/access_leak_scanner.rb`: flag any response with a `credentials` key, a keyring entry whose proof does not hold in the recorded state, or a registry password entry carrying `password`.
- `scripts/validate_scenario.rb`: `credentials` in `known_top_level`, `credential` in `known_item_fields`, new `check_credentials` (6.4).
- Dungeon graph: edges proof source (item, PC, foothold) to a credential node, and credential node to each PC that accepts it.

### 6.2 GET /keyring

`GET /games/:id/keyring?pc_id=&foothold=&from=&relay=&rev=`, `no-store`, a read with no side effects.

```json
{ "rev": "9f2c1a",
  "entries": [
    { "id": "lena.password", "kind": "password", "source": "capture",
      "account": { "npcId": "lena", "username": "lfox", "displayName": "Lena Fox" },
      "label": "captured", "password": "Ledger-Lena-9" },
    { "id": "jake_pw_note", "kind": "password", "source": "registry",
      "account": { "npcId": "jake", "username": "jbrooks", "displayName": "Jake Brooks" },
      "label": "passwords.txt", "foundIn": "lena_passwords_txt" },
    { "id": "lena_rdp", "kind": "saved_connection", "source": "registry",
      "account": { "npcId": "lena", "username": "lfox", "displayName": "Lena Fox" },
      "label": "HB-FIN-02.rdp", "host": "HB-FIN-02", "connectsTo": "lena_pc",
      "routes": [{ "foothold": "jack_comms_port" }], "forThisPc": true, "accepted": true },
    { "id": "jake_assist", "kind": "assist_invite", "source": "registry", "ended": true,
      "account": { "npcId": "jake", "username": "jbrooks", "displayName": "Jake Brooks" },
      "label": "Remote assist code (Jake)" }
  ] }
```

- `password` appears only on an implicit (captured) entry, by today's rules (`revealSecret` and the capture proofs), through the same readers as GET /capture_secrets. A registry password entry never carries a value: the player reads the file.
- `routes` (connecting kinds): held footholds that reach `connectsTo` now (by seq), then (K4) sessions it can be reached from, then `{ relay: true }` for relay kinds. Empty when nothing reaches it.
- With `pc_id`: `forThisPc` (a password entry, or `connectsTo` is this PC) and `accepted` (the PC's policy takes the kind). Admission is not pre-judged; the sign-in answers it, as for typed passwords. A `pc_id` the player cannot open a screen for (by keyboard, or the named route) is ignored.
- `ended`: an `assist_invite` in `endedCredentials` whose proof still holds is listed with `ended: true` and no routes, so the client can say why it no longer works.
- `rev`: a short digest of the answer; a request whose `rev` matches gets `{ rev, unchanged: true }`.
- Values of non-password kinds never exist in any answer.

### 6.3 Validator checks (`check_credentials`)

Errors:
- unknown kind; a kind not built yet ("not supported until phase 2/3"); `accepts` naming an unknown kind;
- `account` not an account holder; `connectsTo` not a sign-in PC, missing on a connecting kind, or present on `password`; `connectsTo` a headless PC for `assist_invite` (no screen to share);
- `proof` not exactly one known kind; `session` naming no sign-in PC; `held` naming no scenario item; `foothold` naming no foothold id any jack, access point or implant action can create;
- a proof that can never hold: a `held` item that is not takeable and is given by no declared grant, NPC `itemsHeld`, ink `give_item` or start inventory; a `session` PC no account is admitted at and no claim opens; a `planted` or `dropped` proof `CaptureModel` already finds unreachable;
- an item `credential` naming no registry id; `endsOnGlobal` naming an undeclared global;
- more than 64 entries; an id outside the pattern.

Warnings:
- a credential no machine accepts: no sign-in PC whose policy accepts the kind, admits the account and is `connectsTo`;
- a `connectsTo` PC whose access list does not admit the account;
- a `saved_connection` whose `connectsTo` no foothold, access point or (K4) linked sign-in PC can reach;
- a `held` item without the matching `credential`, or an item `credential` whose entry's proof is not `held` on that item;
- a `foundIn` item whose text does not contain the account's password (never quoted), or that is not inside the proof's session PC (its contents, mapped shares or profiles);
- `accepts` without `password`; `accepts` on a policy no PC uses.

### 6.4 Tests

- `test/unit/credential_model_test.rb`: kinds, default accepts, proof kinds (exactly one key), registry cap and order, `end_globals`.
- `test/models/break_escape/credential_keyring_test.rb`: each proof holds and stops holding; an always-allowed notepad posted with the .rdp's id does not prove `held`; a room add with that id does not; implicit entries equal GET /capture_secrets; registry password entries never carry `password`.
- `test/controllers/break_escape/keyring_route_test.rb`: answers, `rev` and `unchanged`, routes, `forThisPc` and `accepted`, `ended`, an unreachable `pc_id` ignored.
- `test/controllers/break_escape/capture_secrets_unchanged_test.rb`: the golden check.
- `test/controllers/break_escape/sync_payload_size_test.rb`: bootstrap without `credentials`; GET /keyring at 64 entries under 16 KB.
- `test/js/validator-credentials.test.mjs`: one fixture per error and warning, through the real validator.
- Scenario `test_access_keyring` (section 9.1), created here and validator-clean, with its dungeon graph.

### 6.5 Live proof

GET /keyring from the page on a new game of `test_access_keyring`, before and after each proof (take the .rdp, sign in at Lena's PC, plant the drop box); the bootstrap has no `credentials` key; the notepad forgery from the page leaves the keyring unchanged.

### 6.6 Sync size

Nothing stored. GET /keyring is a read: at most 64 registry entries plus one per captured account, about 250 bytes each; a repeat with `rev` is a few bytes.

### 6.7 Cheat analysis

The registry never reaches the browser. Every proof reads server-written state, and `held` matches the scenario item by type and identity, so neither a room add nor an always-allowed item with a chosen id proves it. No value of a non-password kind exists. A password value is served only where GET /capture_secrets already serves it.

## 7. Slice K2: the POST /login credential branch (server)

Base: main after K1. Size: M. Nothing in the client calls it yet.

`POST /login { pc_id, credential, foothold? | from? | relay? }` goes to `Game#attempt_credential_login!`. In order:

1. The PC exists (404 as today).
2. `credential` matches the id pattern, names a registry entry of a built connecting kind, and its proof holds. Otherwise the generic refusal `{ success: false, message: "Incorrect username or password" }`, the same body for an undeclared id, a declared but unproven id, an implicit or registry `password` id (passwords are typed) and a malformed id. Nothing is counted.
3. `connectsTo` is this PC, else 422 `{ message: "This connection is for another PC", wrongPc: true }`.
4. The route is one the kind allows (section 3.7), else the generic refusal; no route at all (the keyboard) is the generic refusal too. Then the route is judged as POST /login judges a foothold today: 403 unreachable, 403 not_responding (off, for every route), 422 remoteBlocked (`foothold` and `from` only; the relay is the holder's own tool).
5. The policy accepts the kind, else 422 `{ kindRefused: "<kind>" }`.
6. The access list admits the account, else 422 `LOGIN_NOT_PERMITTED`.
7. A kind with `honours_lockout` is refused while the account is locked out at this PC (`account_locked_out_at?`), with `LOGIN_LOCKED_OUT`.
8. An `assist_invite` in `endedCredentials`: 422 `{ ended: true }`.
9. `start_login_session!(pc, npc, 'credential', credential:, route)` writes section 3.8's record; the answer is `login_session_answer` plus `{ kind, label, route }`.

Steps 3 and 5 to 8 answer only for a held, proven credential, so the browser cannot probe the registry. The client turns `kindRefused`, `wrongPc` and `ended` into the text of section 8.4.

### 7.1 Ending an invite

- At bootstrap (where `scenario_data` is loaded), the server writes `player_state['credentialEndGlobals']`, the bounded map `CredentialModel.end_globals` (at most 64 entries), when it is missing or the scenario changed.
- In the sync merge, after globals are applied, the server checks only that cached map: for each listed global now true, it adds the credential ids to `player_state['endedCredentials']` (grow-only, at most 64) and deletes relay sessions whose `credential` is one of them. No scenario load on sync.
- A client that clears the global later cannot revive the invite. A client that never lets the NPC end it keeps the invite, which honest play can also reach (the NPC may never become suspicious).
- On reload the relay session ends (`reload_ended_session_ids`), but the invite is still held and not ended, so Connect works again until the NPC ends it.
- Both keys go in `ACCESS_STATE_DEFAULTS`, are written only by the server and are never read from a client body.

### 7.2 Other server changes

Section 3.8's readers; `start_login_session!` takes the credential fields; `login_session_answer` adds `kind`, `label` and the route; `desktop_request_allowed?` accepts `relay=1` (and in K4 `from=`) when the session at that PC carries that route and `session_route_up?` holds; GET /container passes the param through.

### 7.3 Tests

- `test/controllers/break_escape/credential_login_test.rb`: each step's refusal; the generic body byte-identical across undeclared, unproven, password and malformed ids; nothing counted; no route (the keyboard) refused; a relay param on a saved connection refused; a lockout refuses `saved_connection` but not `assist_invite`; relay with no reach succeeds and fails on an off PC; the ended invite stays ended after the global is cleared; reload ends a relay session and Connect works again; `host_row` lists a credential session with its own `via` and `remote: true`.
- `test/models/break_escape/credential_sessions_test.rb`: `session_route_up?` for relay (ended, off) and foothold credential sessions; pruning on unplug as for password sessions; `reload_ended_session_ids` versus `claimed_session_ids`.
- `test/controllers/break_escape/sync_end_globals_test.rb`: the sync merge records an end with no `scenario_data` query (assert the narrow load).

### 7.4 Live proof

Tampered-client calls from the page against `test_access_keyring`: an undeclared id, an unheld .rdp, a notepad posted with the .rdp's id, the .rdp at its own keyboard, a relay param on the .rdp, the .rdp at another PC, the ops .rdp at a policy that refuses it, and, after Jake ends the invite, the global cleared by sync and a retry.

### 7.5 Sync size

The session record gains `via: "credential"`, `credential` (at most 64 characters) and one route field, in the one slot per PC. `endedCredentials` and `credentialEndGlobals` are bounded by the registry (64), server-only, and never sent by the client. The POST body gains one id and one route field.

### 7.6 Cheat analysis

All kinds are secret-class and hard-enforced: a saved connection or an invite opens an account without its password.

| Attempt | Server answer |
|---|---|
| Post an id without its proof, or a malformed id | generic refusal, nothing counted |
| Forge the item (notepad with the id, or a room add) | `held` does not match; generic refusal |
| Use it at the target's own keyboard | generic refusal |
| Use it at another PC | "for another PC" (needs a valid proof) |
| A relay route on a saved connection | generic refusal |
| A foothold not held, or not reaching | 403 as today |
| A kind the policy refuses | `kindRefused` |
| Revive an ended invite by clearing its global | `endedCredentials` is grow-only on the server |
| Skip a lockout with a saved connection | refused while locked out |
| Read a token or hash value | no value exists in any answer |

## 8. Slices K3a and K3b: the keyring on screen (client)

### 8.1 K3a: the sign-in screen (shared module)

Base: main after K2. Size: M.

Only in a scenario that declares `credentials` (shipped scenarios are unchanged). On the remote screen, and on the keyboard screen for password entries only:

- **One tile per account, never per entry.** Order: the PC's accounts (by picker and `remoteScreen`), then keyring accounts the PC does not list, then one Other user. An account with keyring entries gets small kind tags (pixel font under the name: "captured", "passwords.txt", "saved connection", "remote assist"; in the short window a 2px corner badge).
- **Choosing an account** shows its ways in on the chosen line: the Password field (filled only for a captured password the server served), and one button per keyring credential for this PC ("Use HB-FIN-02.rdp"). With one way in, that way is the only control. A credential refused by this PC's policy shows as a greyed button with the refused text under it and does nothing.
- **The teaching line** under a credential button, from the text table (8.4), and the same line once as a toast after the first successful use of each kind.
- **Sign in** with a credential posts `credential` with the screen's route; refusals show in the screen's error line with 8.4's text.
- **Loading:** the remote screen waits for `/login_accounts`, `/capture_secrets` and `/keyring?pc_id=&<route>` together; the keyboard screen, in a scenario with `credentials`, waits for `/login_accounts` and `/keyring` (it already waits for the first). A failed `/keyring` leaves the loading state with no keyring entries.
- **Worst case to prove:** six admitted accounts, three with keyring entries, at the four sizes, with the pixel scrollbar and "More below" cue where the row scrolls.
- **Desktop:** the account bar keeps "Signed in as Lena Fox (lfox)" and adds a second line, "with the saved connection HB-FIN-02.rdp" (`container-minigame.js:949-951`); the bezel keeps the PC name.

K3a uses the foothold route only. After K3a, a player with a planted drop box opens HB-FIN-02 from the network view and signs in with the .rdp.

Files: `minigames/password/password-minigame.js`, `css/password-minigame.css`, `systems/unlock-system.js` (the fetches), `api-client.js` (`keyring`, `loginWithCredential`), `systems/keyring.js` (new: the cache and `rev`), `systems/screen-states.js:83`, `minigames/container/container-minigame.js` (account bar line), `systems/pc-sessions.js` (credential sessions).

Tests: `test/js/keyring-signin.test.mjs` (one tile per account, tags, chosen-line buttons, greyed refused credential, password-only at the keyboard, error texts, loading and failure, nothing new in a scenario without `credentials`); `test/js/pc-monitor-frame.test.mjs` (the worst case inside the screen at both scales); harness copy lists for `systems/keyring.js`.

Live proof: beats R1 to R5 of section 9.1 with the drop box planted, shots of every state at the four sizes with scrollbars shown, the worst-case fixture screen, `verify-run.rb`.

Sync: nothing stored; one GET /keyring per screen open, usually `unchanged`.

### 8.2 K3b: Connect, relay, toasts

Base: main after K3a. Size: M.

- **Connect from the tray.** `inventoryMenuFor` (`systems/inventory-menu.js:87`): a held item with a connecting `credential` gets `[Connect, Examine]` (plus Drop here when droppable); with no observations, the click is Connect directly. Connect asks GET /keyring and reads the entry:
  - a session is already held at `connectsTo` through a credential: open its desktop;
  - `ended`: toast "Jake ended the remote assist.";
  - first route (K4's `from` first, then footholds, then relay): open the target's remote sign-in screen with the account and the credential chosen;
  - no route: toast "HB-FIN-02 can't be reached from here. You need a way onto its network.";
  - the entry is missing: toast "This no longer works."
  Connect starts no network-view trip, so closing the screen or desktop returns to the world, or to the opener given as `returnTo`.
- **Relay mode.** The lockable's `remote` is `{ relay: true }` beside today's `{ footholdId }`. Readers that branch on it: `openLoginSignIn` (choose the remote screen), `openRemoteSignInScreen` (no foothold, header "Remote assist (Jake Brooks)"), the sign-in post (`relay: 1`), `pc-sessions.js` remote fields, the container's header ("Remote assist session") and request params (`relay=1`). An open relay session is reached again by Connect (which opens its desktop). At Jake's own keyboard during a relay session the desk rules apply and the relay session is not offered there.
- **"New on your keyring."** `systems/keyring.js` fetches a baseline after bootstrap, then asks with `rev` after a successful sign-in (once the desktop has opened), an inventory add or removal of an item with `credential`, a plant, implant or Wi-Fi join. Registry entries new since the last answer give one toast ("New on your keyring: Jake Brooks, passwords.txt"; with more, two names then "and N more"). Captured entries stay silent (the capture has its own notice). A `foundIn` entry waits until the client has opened that item, so the toast follows the find. Nothing is written to globals or player state.
- **The keyring view** follows decision D4 (recommended: the sign-in screens and Connect only in phase 1).

Files: `systems/inventory-menu.js`, `systems/unlock-system.js`, `systems/keyring.js`, `systems/pc-sessions.js`, `minigames/container/container-minigame.js`, `systems/network-links.js` (no trip for Connect).

Tests: `test/js/keyring-client.test.mjs` (baseline at load, `rev` reuse, toast diff and grouping, silence for captures, `foundIn` wait, Connect's five outcomes, `returnTo`); the inventory-menu test file (`[Connect, Examine]`, direct Connect without observations); `test/js/access-remote-signin.test.mjs` (relay mode headers and params, re-entry by Connect).

Live proof: beats R6 to R9 and R11 on new games of `test_access_keyring`, shots at the four sizes, `verify-run.rb`.

Sync: nothing stored; one GET per trigger, usually `unchanged`.

### 8.3 Cheat analysis for K3a and K3b

Display only. Every sign-in goes through section 7's checks; the client never holds a non-password value; a registry password is never sent.

### 8.4 Player-facing text (for the user to approve)

On-screen text only, not spoken, so it lives in the engine's text table keyed by kind.

| Key | Text |
|---|---|
| saved_connection teach | "The password is saved inside this file, so opening it signs you in as Lena." |
| assist_invite teach | "Jake let you into his session. Nobody checked who was asking." |
| saved_connection refused | "This PC's policy forbids saved passwords. That is the fix for this risk." |
| assist_invite refused | "This PC's policy does not allow remote assistance." |
| wrong PC | "This connection is for another PC." |
| ended | "Jake ended the remote assist." |
| no route | "HB-FIN-02 can't be reached from here. You need a way onto its network." |
| typed screen | "This PC asks who you are before it shows any accounts." |

Names and hosts come from the entry, never from free text.

## 9. Slice K4: signing in from a desktop

Base: main after K3b. Size: M. Decision D6 says whether it is in phase 1 (recommended: yes).

- Route `from: pcId` (section 3.7) in POST /login, GET /keyring `routes`, `desktop_request_allowed?` and `session_route_up?` (section 3.8).
- `prune_unreachable_sessions!` ends a `from` session whose source session is gone; `logout_session!` and `end_claimed_sessions!` already call it.
- Client: Connect prefers a `from` route whose source is the desktop the player has open; the remote screen header reads "Remote sign-in from HB-DESK-01". On the desktop where the file sits, the file's click offers Connect beside Take (no need to take it first).
- Tests: `test/controllers/break_escape/credential_from_route_test.rb` (route checks; source logged out ends the session; source PC switched off refuses the desktop and scoped requests, and allows them when it is back; a claimed source ends on reload and the chain with it; no `from` for a relay kind); JS route choice and the desktop Connect.
- Live proof: beat R10, from Sam's keyboard with no drop box.
- Sync: one route field in the session record.
- Cheat: `from` names a session the server holds; reach is the walk mapped shares already use.

### 9.1 Test scenario `test_access_keyring`

Browser-only, no VM, built in K1 and grown through K4. `revealSecret` off. Start inventory empty.

- **Lobby** (start, unlocked): signs for the beats.
- **Office** (unlocked from the lobby): Sam's PC (`HB-DESK-01`, `office_lan`, access `staff`, picker `accounts`). Sam's desktop holds `HB-FIN-02.rdp` (`lena_rdp`, takeable).
- **Finance** (locked with a key found in the comms room, so Lena's keyboard is reachable only after R2): Lena's PC (`HB-FIN-02`, `office_lan`, policy `finance`, access `{ roles: ["finance"], people: ["jake"] }` so Jake is admitted for R4); her desktop holds `passwords.txt` (`jake_pw_note`, not takeable) and `SV-OPS-01.rdp` (`ops_rdp`, `saved_connection` to `SV-OPS-01`, takeable). Jake's PC (`HB-FIN-03`, policy `finance`). Jake at his desk, with a short ink conversation: posing as the helpdesk, one choice gets the code (declared `give_item` of `jake_assist_code`); a later visit lets him grow suspicious and sets `jake_ended_assist`.
- **Comms** (unlocked): a jack on `office_lan` and the drop box.
- **Server room** (locked): `SV-OPS-01` (`server_lan`, linked from `office_lan`, policy `pw_only`, access `it`).

| Beat | What it proves | Slice |
|---|---|---|
| R1 | Take HB-FIN-02.rdp from Sam's desktop; toast "New on your keyring" | K1, K3b |
| R2 | Plant the drop box; HB-FIN-02 from the network view; Lena's tile tagged; "Use HB-FIN-02.rdp" signs in; account bar line | K2, K3a |
| R3 | Open passwords.txt; toast for Jake's password only after it is opened | K1, K3b |
| R4 | Switch user at Lena's PC: Jake's tile tagged "passwords.txt", password typed from the file; a wrong one counts | K3a |
| R5 | Connect the SV-OPS-01.rdp: its screen shows the greyed "Use" with the policy text; Ian's password, if captured, still works | K2, K3a |
| R6 | Talk Jake into the code; Connect with no route: his desktop over the relay; the teaching toast | K2, K3b |
| R7 | Jake grows suspicious: the relay session ends; Connect says "Jake ended the remote assist." | K2, K3b |
| R8 | Reload before R7: the relay session is gone, Connect works again; the .rdp session through the drop box is kept | K2, K3b |
| R9 | Unplug the drop box: the .rdp session ends as a password session would | K2 |
| R10 | No drop box: from Sam's keyboard session, Connect on the .rdp signs in from HB-DESK-01 | K4 |
| R11 | Tampered-client checks of section 7.4 | K2 |

### 9.2 What each slice changes in existing scenarios

| Slice | Changes |
|---|---|
| K0 | Remote screens in every networks scenario show the PC's own tiles under the default (D1). Networks scenarios on main: the test scenarios with `networks`; the build log lists them with before and after shots |
| K1 | None (validator checks apply only where `credentials` or `accepts` is authored) |
| K2 | None (no client calls the branch); `host_row` and `screen-states.js` change behaviour only for credential sessions |
| K3a, K3b, K4 | Only scenarios that declare `credentials` (`test_access_keyring`) |

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

Each decision goes on the picks page with its evidence. Proposed evidence is listed per decision.

### D1. The default remote screen: tiles or typed

- (a) `"tiles"` by default, missions opt into `"typed"` on hardened PCs. (b) `"typed"` by default, tiles only where a scenario opts in.
- Trade-off: tiles teach account enumeration on every exposed screen and make typed-username puzzles easier; typed teaches the control but hides the lesson unless a scenario opts in.
- Recommendation: (a), matching the q92 pick and the keyboard screen; a hardened policy is one line.
- Blocks: K0 (one constant; K0 builds with (a) and can flip).
- Evidence: K0's shots of Sam's PC and HB-OPS-02 over the network at 1400x1000 and 390x844; the two policy snippets; the list of networks scenarios whose remote screens change under each default.

### D2. The phase 1 kinds

- (a) `saved_connection` and `assist_invite`. (b) also `token` now.
- Recommendation: (a). Tokens need the server clock and the foothold binding, and the content that wants them (the labs' items) needs its own yes (D5).
- Blocks: K1 and K2.
- Evidence: the `sofia_remote` JSON (`lab_social_engineering/scenario.json.erb:170-200`); the kind table (3.6); K2's check list with and without the token rules; the keyring screen mock per kind; the dropped option-2 inline shape, with the reason.

### D3. Machine accounts

- (a) a top-level `machineAccounts` block (not `accounts`, which clashes with `social.mail.accounts` and the `loginPicker` value); (b) hashes tied to NPC accounts only.
- Recommendation: (a), in phase 3, with the reader audit.
- Blocks: phase 3 only.
- Evidence: both JSON shapes; the server readers that assume a session id is an NPC (`session_identity`, `session_for_client`, `host_row`, `login_session_answer`, the profile and share access checks).

### D4. A keyring view beyond the sign-in screens

- (a) a Keyring section in the capture log, which only `test_capture_log` carries, so elsewhere this is (c); (b) a Keyring inventory item given when a scenario declares `credentials`; (c) the sign-in screens and Connect only; (d) the capture log's Captures section becomes the Keyring (one list with kind tags, no duplicate rows).
- Recommendation: (c) for phase 1. The sign-in screen is where a credential is used, and the question "what does this machine accept?" is answered there; (a) and (d) reach one test scenario and duplicate the Captures and Sessions rows; (b) is new UI to justify with a mission that needs it.
- Blocks: nothing in K3a; K3b's last bullet.
- Evidence: a shot of `test_capture_log`'s log with a captured password; a mock of (d); the sign-in screen with the tag and buttons; the list of scenarios that carry a capture log.

### D5. The labs' granted sessions, for new games

- (a) not in phase 1; convert `lab_social_engineering`'s `sofia_remote` to a `token` credential in phase 2, for new games only; (b) convert it in phase 1 as an `assist_invite`; (c) leave it. For `lab_physical_pentest`'s item: (a) the same as the social lab; (b) leave it.
- Recommendation: (a) for both. The honest kind for a phished foothold is a token, the social lab is played on Hacktivity, and saved games keep their stored scenario data either way.
- Blocks: nothing in phase 1.
- Evidence: both items' JSON with line numbers, their dungeon graph nodes, a side-by-side of each item now and as a token credential.

### D6. Signing in from a desktop (K4)

- (a) keep K4 in phase 1; (b) drop it, so a saved connection always needs a foothold.
- Recommendation: (a). The explainer's worked pivot ("open the .rdp from Sam's desktop") is this slice; without it the found-on-a-desktop chain becomes "find the file, plant a box, come back". It is M and touches only the session readers already changed in K2.
- Blocks: K4.
- Evidence: the explainer's pivot sequence diagram beside the K3-only flow; the `from` row of the route table; R10.

## 14. Defaults settled in this plan

- The keyring appears only in scenarios that declare `credentials`; keyboard screens show password entries only.
- Connecting kinds never sign in at the target's own keyboard.
- `password` is always accepted; a list without it only warns.
- Admission is not pre-judged; the sign-in teaches it.
- A credential the policy refuses is shown greyed with its reason, so honest play meets the refusal.
- Registry password entries never carry the value: the player reads the file.
- A lockout refuses a saved connection (it presents the password), not an assist invite (the person's own session).
- A relay session does not extend reach and ends on reload; the invite stays usable until the NPC ends it.
- Credential items keep an existing type and icon.
- The option-2 inline item shape is not accepted.

## Appendix A. Handover (2026-11-13, after review round 2)

For the next agent continuing the plan's review loop. Remove this appendix when the loop ends.

- **Done.** Round 0 draft (commit 8585b394b). Round 1: server B1 M2 m2 n2, UX B1 M11 m12 n5; plan rewritten as a standalone document (commit 60159ca52). Round 2 reviews written: `CREDENTIAL_KEYRING_PLAN_REVIEW_R2_SERVER.md` (B0 M2 m4 n3) and `CREDENTIAL_KEYRING_PLAN_REVIEW_R2_UX.md` (B2 M8 m12 n5), committed with this note. The plan text above is still the round 1 rewrite: no round 2 finding is applied yet.
- **Next step.** Read both round 2 reviews, check each finding in code (withdraw any that the code disproves, with a one-line reason in your report), then rewrite the plan as a standalone document with no references to reviews, and commit. Then run round 3 (server review on the opus48 agent type, UX review on opus55, both fresh, as in rounds 1 and 2), rewrite, and continue to at most round 5, stopping at the first round from 3 on with 0 B and 0 M.
- **Round 2 points to settle** (the review files have the evidence):
  - Server M1: relay sessions do extend reach today (`reach_session_hosts`, `network_access.rb:1115`, counts every session). Either exclude relay sessions from the walk or drop the claim and redo the cheat table.
  - Server M2: `credential` is client-writable on an always-allowed item; add it to `ItemIdentity::FORGEABLE_ITEM_FIELDS` and a validator error for a `held` credential item of an always-allowed type.
  - Server minors: `session_for_client` must carry the route fields; `credentialEndGlobals` also needs filling when a sync arrives before the bootstrap; `host_row` must not offer a relay session the view cannot open; `desktop_request_allowed?` needs explicit relay and `from` branches.
  - UX B1: K0's "headless: 403" plus close-on-403 breaks remote sign-in to headless hosts (P8 HB-DOOR-01, `lab_physical_pentest` LW-DOOR01). Headless hosts must keep today's typed remote screen with no tiles request, or the answer must be `loginAccounts: []` rather than 403.
  - UX B2: a `notes` item never gets a tray slot (`inventory.js:946`); choose a type that does for the assist code.
  - UX M1 to M8: K0's added PCs need a real room, the `nla` policy declared, P3's host list updated and P5b's tag claim fixed (implicit `staff` role); K0 does change `lab_physical_pentest` remote screens (correct section 9.2 and give D1 that evidence); `test_access_keyring` lacks accounts and reach for R1, R5 and R10; ink cannot fire a declared grant, so the code comes from Jake's `itemsHeld` by `#give_item` and the invite is best-effort; relay mode needs its sign-in screen, Switch user, Sign out and displacement defined; an invite ended on the server must reach the client (end the open desktop); the toast must not name a view D4 (c) never builds; list every change from the explainer in section 1.
- **Files touched:** `docs/achitechture/CREDENTIAL_KEYRING_PLAN.md` and the four review files beside it. Branch `plan/keyring` in worktree `.claude/worktrees/p-keyring-plan`.
- **Gotchas:** HB-DOOR-01 in `test_access_networks` is headless (no screen); the capture log is carried only by `test_capture_log`; PUT /sync_state loads no `scenario_data`; commit with explicit paths, UK English, no em or en dashes, no model names in repo files.
