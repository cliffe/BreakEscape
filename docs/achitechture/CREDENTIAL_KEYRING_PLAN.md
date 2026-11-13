# Credential keyring: build plan for phases 0 and 1

Status: plan, round 0 draft. Decided by the user on 2026-11-13 (q92, option 3: "remote sign-in model: credential keyring, option 3"). Engine paths are under `public/break_escape/`. Line numbers are on main f956f5355 unless a branch is named.

## 1. What this builds

A **credential** is anything the player holds that a PC accepts as proof that they are a particular account. The player's **keyring** is the list of credentials they have earned, computed on the server from state it already keeps. Each PC's policy says which kinds it accepts, and the server checks every use.

| Phase | Scope | Slices | Size |
|---|---|---|---|
| 0 | Policy `remoteScreen`; the target PC's own account tiles on the remote sign-in screen, passwords only | K0 | S to M |
| 1 | The `credentials` registry, the `held` and `foothold` proofs, policy `accepts`, the POST /login credential branch, the keyring on every sign-in screen, credential items; kinds `password` (found in files), `saved_connection`, `assist_invite` | K1, K2, K3, K4 | L in all (M, M, M to L, M) |
| 2 | `token` | sketch, section 9 | M |
| 3 | `hash`, `acceptedOn`, machine accounts | sketch, section 10 | M |

Each slice is one branch, built, reviewed and live-proved on its own, and merged before the next starts. K4 can be dropped without touching the others.

Out of scope: tokens and hashes (phases 2 and 3), any change to `lab_social_engineering` (decision D5), the option-2 inline item shape (nothing uses it, so the loader does not accept it), and any field tidy that would need a format step (section 11).

## 2. What exists today

- **POST /login** (`games_controller.rb:1320`, `Game#attempt_login!` at `game.rb:2141`): a username and password, or a claim. With `foothold`, the host must be reachable through it (`host_reachable_through?`, `network_access.rb:1171`), on, and not `remote: "blocked"`. Failures count per PC and normalised username (`record_login_failure!`, `game.rb:2836`) up to the policy's `maxAttempts`. The session is written by `start_login_session!` (`game.rb:2883`) as `sessions[pcId] = { id, via, foothold? }`, one slot per PC, and the PC is added to `signedInPcs`.
- **GET /login_accounts** (`games_controller.rb:1363`): the PC's tiles from `login_account_tiles` (`game.rb:2408`, honouring `loginPicker`: `accounts`, `known` or `false`) and the sticky note. It judges reach at the keyboard only. A request carrying `foothold` gets no note but is otherwise judged as if the player stood at the PC.
- **The remote sign-in screen** (`unlock-system.js:627`, `openRemoteSignInScreen`) passes `picker: false` and `tiles: []`, never calls GET /login_accounts, and fills the "Captured sign-ins" from GET /capture_secrets.
- **GET /capture_secrets** (`games_controller.rb:1568`): `secrets` from `capture_secrets_for_client` (`game.rb:1415`) and, in a networks scenario, `accounts` from `account_capture_usernames` (`network_access.rb:1385`). Capture proofs (`capture_proofs.rb:58`, kinds `planted`, `dropped`, `session`) gate when an account's password is served.
- **Policies** ship in the bootstrap as authored. The schema closes each policy (`scenario-schema.json:195-209`: `autoLockMin`, `maxAttempts`, `usb`, `social`, `remote`).
- **UX slice 2b phase 0** (branch `build/ux-slice2b0`, in review): the captured sign-ins are the shared `.signin-tile` tiles with headshots, above the form, inside the PC monitor frame. Its round 1 review asks for a loading state that shows neither form nor tiles until the list arrives (M2) and for the empty state to sit after the form (m1).
- **Granted remote sessions** exist only as hand-written `pc` items: `lab_social_engineering` (`scenario.json.erb:170-200`, `sofia_remote`, a declared-grant timer on `phish_lord_foothold`) and `lab_physical_pentest` (`scenario.json.erb:586`). Neither is tied to an account, a PC or a policy.
- **The capture log** (`minigames/capture-log/`) is an inventory holder device (type `capture_log`). Only `test_capture_log` carries one today.

## 3. The model

### 3.1 Accounts

Unchanged. An account is a room NPC with `creds`. Every account with a password has an implicit credential of kind `password`, earned through today's capture routes and proofs. Authors write nothing new for that case.

### 3.2 Policies

Two optional fields, both shipped in the bootstrap (they are not secret):

```json
"policies": {
  "finance": {
    "remote": "allowed",
    "remoteScreen": "tiles",
    "accepts": ["password", "saved_connection", "assist_invite"],
    "maxAttempts": 5
  },
  "hardened": { "remote": "allowed", "remoteScreen": "typed", "accepts": ["password"] }
}
```

- `remoteScreen`: `"tiles"` shows the PC's own account tiles (by its `loginPicker`) over the network; `"typed"` shows none, as a PC with Network Level Authentication does. The default is decision D1 (recommended: `"tiles"`). It never affects the screen at the keyboard.
- `accepts`: the credential kinds the PC takes. A PC with no policy, or a policy without `accepts`, takes the default list `KindCatalogue::DEFAULT_ACCEPTS`, which is every kind built so far except `hash` (phase 1: `password`, `saved_connection`, `assist_invite`). `password` is always accepted whatever the list says (a PC that refused typed passwords would be unusable), and the validator warns when a list omits it.
- `maxAttempts` keeps its meaning. Only typed passwords count towards it.

### 3.3 The registry

A top-level `credentials` map, **server-only**: the bootstrap strips it, and no answer sends it whole.

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
| id (the map key) | `^[a-z][a-z0-9_]{0,63}$`. Never contains a dot, so it can never collide with the implicit `<npcId>.password` ids. |
| `kind` | An open string. The engine's `KindCatalogue` (section 3.6) says which kinds are built. |
| `account` | The NPC id of an account holder. |
| `proof` | Exactly one of `session` (a sign-in PC id), `planted` (+ optional `on`), `dropped`, `held` (an item id), `foothold` (a foothold id). |
| `connectsTo` | The sign-in PC the credential opens. Required for `saved_connection` and `assist_invite`; not allowed on `password`. |
| `foundIn` | `password` only, optional: the item whose text holds the password, for the keyring label ("from passwords.txt"). |
| `endsOnGlobal` | `assist_invite` only, optional: a declared global; once true, the invite is over for the rest of the game. |

At most 64 entries (the validator errors above that, and the server reads only the first 64 by sorted id).

### 3.4 Items that carry a credential

An ordinary item gains an optional `credential` field naming a registry id. It keeps an existing item type for its look and its icon (for example `text_file` for `HB-FIN-02.rdp`, `notes` for a written assist code), so no new art is needed.

```json
{ "id": "lena_rdp_file", "type": "text_file", "name": "HB-FIN-02.rdp", "credential": "lena_rdp",
  "takeable": true, "readable": false,
  "observations": "A saved remote desktop shortcut. The password is stored in it." }
```

A held item with a `credential` of a connecting kind gets one action, Connect (section 7.4). The id it names is not secret: holding the item is what the server checks, never knowing the id.

### 3.5 Proofs

All five are read from state the server already writes:

| Proof | Holds when | Server state read |
|---|---|---|
| `session: pcId` | The player has ever held a session at that PC | `signedInPcs` (as for capture proofs) |
| `planted`, `dropped` | As capture proofs today | `plantedItems`, `gainedFootholds`, `droppedItems` |
| `held: itemId` | An inventory entry with that id that is not client-forged (`ItemIdentity.client_forged?`) and whose stored copy is the server's canonical copy | `inventory` |
| `foothold: footholdId` | The foothold is held now | `footholds` |

`held` and `foothold` stop holding when the item leaves the inventory or the foothold is lost; the entry leaves the keyring. A session already opened with the credential is not ended by that (it is ended by its own route and kind rules, section 3.7).

### 3.6 The kind catalogue

One plain-Ruby module, `lib/break_escape/credential_model.rb` (`BreakEscape::CredentialModel`), shared by the server, the validator and the dungeon graph, as `CaptureModel` is. It holds:

```ruby
KINDS = {
  'password'         => { built: true,  connects: false },
  'saved_connection' => { built: true,  connects: true, route: :network, honours_lockout: true,  label: 'saved connection', refused: 'This PC does not allow saved passwords' },
  'assist_invite'    => { built: true,  connects: true, route: :relay,   honours_lockout: false, label: 'remote assist invite', refused: 'This PC does not allow remote assistance', ends_on_reload: true },
  'token'            => { built: false },   # phase 2
  'hash'             => { built: false }    # phase 3
}
DEFAULT_ACCEPTS = %w[password saved_connection assist_invite]
PROOF_KINDS = %w[session planted dropped held foothold]
```

Later kinds add a row and, where they need one, a rule; nothing else in the record changes.

### 3.7 Routes

A credential of a connecting kind signs in at its `connectsTo` PC through one route:

| Route | Who may use it | Check | Session record |
|---|---|---|---|
| keyboard | any kind | the PC is physically reachable and not headless (as today) | no route field |
| `foothold` | `route: :network` kinds | `host_reachable_through?(foothold, pc)` (as today) | `foothold` |
| `from: pcId` (slice K4) | `route: :network` kinds | the player holds a session at `pcId` whose route is up, `pcId` is on, and the target's network is in `networks_reachable_from(network of pcId)` | `from` |
| relay | `route: :relay` kinds | none: the account holder's own vendor relay | `relay: true` |

A relay session does not extend reach: the reach walk counts it only for networks a held foothold already reaches, as any session.

### 3.8 The session record

`sessions[pcId] = { id: npcId, via: "credential", credential: credId, foothold? | from? | relay? }`. Still one slot per PC, replaced on the next sign-in. `signedInPcs` gains the PC as for any sign-in.

Every reader that today tests `via == "password"` to mean "a real sign-in, not a claim" is changed to `via != "claim"`: `network_access.rb:918` (`host_row`), `screen-states.js:83`. The other `via` readers already test for `claim` and are unaffected (`game.rb:2343`, `2378`, `network_access.rb:1188`, `pc-sessions.js:179/353/360`, `container-minigame.js:24/951`, `network-links.js:660`, `network-view-minigame.js:164`, `workstation-state.js:223`, `unlock-system.js:658/667`). The slice that introduces `via: "credential"` (K2) greps for `via` again and lists the result in its build log.

## 4. What every slice must keep

- **GET /capture_secrets answers stay identical.** No slice edits `capture_secrets_for_client`, `account_capture_usernames` or `account_capture_served?`. K1 adds a golden test that records the answer for every fixture game in `test/fixtures/files/access_leak/responses.jsonl` and the four test scenarios with captures, before and after.
- **No format step.** Every field is optional and new (section 11).
- **Pixel-art rule and UI language.** 2px borders or the theme skin, pixel fonts only, headshots for every account, X closes, the frame wraps all content at 1400x1000, 390x844, 915x412 and 800x600.
- **Sync size.** Each slice states what it stores and what each request sends.
- **Commit before testing**, explicit paths, no attribution lines. New static imports in engine JS go on each JS test harness copy list.
- **Live proof.** A keyless server on the builder's own port, a headless browser through the real routes, shots at the four sizes with scrollbars shown, `tools/playtest/verify-run.rb` showing progress on the server, and tampered-client checks sent with `fetch` from the page.

## 5. Slice K0: phase 0, the target's own tiles over the network

Base: `build/ux-slice2b0` once its review round fixes (loading state M2, empty state m1, tile loop m2) are in. Size: S to M.

### 5.1 Server

- `scenario-schema.json`: policy gains `remoteScreen` (`enum: ["tiles", "typed"]`, description says it governs the remote screen only).
- `Game#remote_screen(pc)` (in `network_access.rb`, beside `remote_blocked?`): the policy's value, else the default constant `DEFAULT_REMOTE_SCREEN` (decision D1).
- `GamesController#login_accounts` with a `foothold` param takes a new branch, `Game#remote_login_accounts(info, foothold)`:
  1. `foothold` must be held and reach the host (`host_reachable_through?`), else 403 `PC not reachable` (as POST /login answers).
  2. Headless: 403 as today.
  3. `remote_blocked?`: 422 `{ remoteBlocked: true }`, as POST /login.
  4. `host_service_off?`: 403 `{ reason: "not_responding" }`, as POST /login.
  5. Answer `{ pc_id, remoteScreen, loginAccounts }`, where `loginAccounts` is `login_account_tiles(pc)` under `tiles` and `[]` under `typed`. Never `postitNote`.
  Without `foothold` the action is unchanged. `Cache-Control: no-store` stays.
- The param is validated as an id string of at most 64 characters; anything else is refused 400, so a malformed foothold never falls through to the keyboard branch.

### 5.2 Client

- `api-client.js`: `loginAccounts(pcId, { foothold } = {})` adds `&foothold=`.
- `unlock-system.js` `openRemoteSignInScreen`: fetch `/login_accounts?foothold=` and `/capture_secrets` together. The screen opens in the loading state (2b0's fix), and `scene.setRemoteAccounts({ picker, tiles, captured })` sets both once both answers are in. A 403 or 422 closes the screen with the same toast as a refused sign-in would give (`PC not reachable`, `PC not responding`, `Remote sign-in is off on this PC`) and returns to the view.
- `password-minigame.js` (the shared sign-in module): on a remote screen with PC tiles, the screen is the keyboard screen: the PC's tiles row, then Other user. A captured account that is also one of the PC's tiles is not shown twice: its PC tile gains a small "Captured" tag (pixel font, under the username) and fills the password when the server served it. Captured accounts the PC does not list stay under the "Captured sign-ins" heading as in 2b0, after the PC's row. Under `typed` the screen is 2b0's (captured tiles only, or the typed form). The chosen line, Change and the fold rules are the keyboard's.
- `pc-sessions.js` `screenShown(pcId, tiles, ...)` is called with the PC tiles shown, so the workstation state sees the same thing as at the keyboard.
- PC monitor frame: unchanged. The remote header line ("Remote session through Drop box") stays.

### 5.3 Validator

- `remoteScreen` on a policy whose `remote` is `blocked`: warning (no effect).
- `remoteScreen: "tiles"` on a policy used only by PCs with `loginPicker: false`: info line (no tiles to show).

### 5.4 Tests

- Rails `test/controllers/break_escape/network_remote_tiles_test.rb`: the five refusal and answer cases above; `known` picker over the network uses `encounteredNPCs`; `typed` gives `[]`; no `postitNote` with a foothold even when the owner writes it down; a foothold the player does not hold is 403; a malformed foothold is 400; the keyboard answer is byte-identical to main for the same PC.
- JS `test/js/password-signin-mode.test.mjs`: PC tiles on the remote screen, the Captured tag and dedupe, the typed screen, the loading state with both requests pending. `test/js/access-remote-signin.test.mjs`: its assertion "no /login_accounts request" changes to "a /login_accounts request with the foothold, and never a post-it". `test/js/pc-monitor-frame.test.mjs`: the PC row inside the screen.
- Scenario: `test_access_networks` gains policy `nla` (`remote: "allowed"`, `remoteScreen: "typed"`) on one PC whose picker is `accounts` (so the policy, not the picker, hides the tiles), Sam's PC (`HB-DESK-01`, picker `accounts`) keeps the default and shows tiles over the network, and Lena's PC keeps `loginPicker: false`. PLAYTEST.md gains beat P5b (tiles over the network) and P5c (typed).

### 5.5 Live proof

New games of `test_access_networks`. Plant the drop box, open Sam's PC from the view: Sam's tiles with headshots, then Other user. Open the `nla` PC: no tiles, typed form. Read a capture card, reopen Sam's PC: the Captured tag on the matching tile. Shots at the four sizes, including the loading state with GET /login_accounts held back by a route delay. Tampered client: GET /login_accounts with a foothold not held (403) and with a malformed one (400).

### 5.6 Sync size

Nothing stored. One extra GET per remote screen open, answered with at most one tile per admitted account (about 150 bytes each).

### 5.7 Cheat analysis

The tiles name accounts admitted at a PC the player reaches through a foothold the server holds; that is the enumeration a real exposed screen allows, and the policy can turn it off. No password, no note and no capture state is in the answer. Passwords are still checked by POST /login.

## 6. Slice K1: the registry, proofs and keyring (server and validator)

Base: main after K0. Size: M. No sign-in behaviour changes in this slice.

### 6.1 Files and functions

- `lib/break_escape/credential_model.rb` (new, plain Ruby): `KINDS`, `DEFAULT_ACCEPTS`, `PROOF_KINDS`, `registry(scenario)` (the first 64 valid entries by sorted id), `proof_kind(proof)`, `accepts(policy)`, `connects?(kind)`, `pcs_accepting(scenario, credential)` (for the validator and graph).
- `app/models/break_escape/credential_keyring.rb` (new concern, included in `Game`):
  - `credential_proof_holds?(proof)`: delegates `session`, `planted` and `dropped` to `capture_proof_holds?`; adds `held` (section 3.5) and `foothold` (`network_footholds.key?`).
  - `keyring_entries(pc: nil, route: nil)`: implicit password entries built by calling `account_capture_usernames` and `capture_secrets_for_client` (so they can never disagree with GET /capture_secrets), plus every registry entry whose kind is built and whose proof holds.
  - `keyring_for_client(...)`: the answer of section 6.2.
- `scenario-schema.json`: top-level `credentials` (closed entry shape, `x-ref` on `account`, `connectsTo`, `foundIn`, `proof.session`, `proof.held`, `endsOnGlobal`), policy `accepts` (array of strings, unique), item `credential` (string, `x-ref: credential`).
- `Game#filtered_scenario_for_bootstrap` (`game.rb:1280`): `filtered.delete('credentials')`.
- `tools/playtest/lib/access_leak_scanner.rb`: flags any response that carries a `credentials` key, or a keyring entry whose proof does not hold in the recorded state.
- `scripts/validate_scenario.rb`: `credentials` in `known_top_level`; `credential` in `known_item_fields`; a new `check_credentials` (section 6.4).
- The dungeon graph generator: an edge from the proof's source (item, PC, foothold) to a credential node, and from the credential node to each PC that accepts it.

### 6.2 GET /keyring

`GET /games/:id/keyring?pc_id=&foothold=&from=&rev=`, `no-store`.

```json
{ "rev": "9f2c1a",
  "entries": [
    { "id": "lena.password", "kind": "password", "source": "capture",
      "account": { "npcId": "lena", "username": "lfox", "displayName": "Lena Fox" },
      "label": "captured", "password": "Ledger-Lena-9" },
    { "id": "jake_pw_note", "kind": "password", "source": "registry",
      "account": { "npcId": "jake", "username": "jbrooks", "displayName": "Jake Brooks" },
      "label": "from passwords.txt" },
    { "id": "lena_rdp", "kind": "saved_connection", "source": "registry",
      "account": { "npcId": "lena", "username": "lfox", "displayName": "Lena Fox" },
      "label": "HB-FIN-02.rdp", "host": "HB-FIN-02", "connectsTo": "lena_pc",
      "routes": [{ "foothold": "jack_comms_port" }], "usable": true }
  ] }
```

- `password` appears only on a password entry, only when `social.captures.revealSecret` is true, and only from the readers that gate it today (implicit entries) or from the account's `creds` once the registry proof holds (registry entries).
- `routes` (connecting kinds): the held footholds that reach `connectsTo` now, by seq, then (K4) the sessions it can be reached from, then `{ relay: true }` for relay kinds. Empty when nothing reaches it.
- `usable` (with `pc_id`): the entry's kind is accepted by that PC's policy and, for connecting kinds, `connectsTo` is that PC. Account admission is not pre-judged: the sign-in answers it, as it does for typed passwords.
- `rev`: a short digest of the entry ids, kinds, routes and `usable` flags. A request whose `rev` matches gets `{ rev, unchanged: true }`.
- Values of non-password kinds are never in any answer.

### 6.3 Server checks

GET /keyring has no side effects and reads only server state. A `pc_id` the player cannot reach (by keyboard or the named foothold) is ignored rather than refused, so `usable` is never computed for a PC the player could not open a screen for.

### 6.4 Validator checks (`check_credentials`)

Errors:
- unknown kind (not in `KINDS`); a kind not built yet (`token`, `hash`: "not supported until phase 2/3");
- `accepts` naming an unknown kind;
- `account` not an account holder; `connectsTo` not a sign-in PC; missing `connectsTo` on a connecting kind, or `connectsTo` on `password`;
- `proof` not exactly one known kind; a `session` proof naming no sign-in PC; a `held` proof naming no scenario item; a `foothold` proof naming no foothold that any jack, access point or implant action can create;
- a proof that can never hold: a `held` item that is not takeable and is given by no declared grant, NPC `itemsHeld` or start inventory; a `session` PC that no account can sign in at and no claim can open; a `planted` or `dropped` proof that `CaptureModel` already finds unreachable;
- an item `credential` naming no registry id; `endsOnGlobal` naming an undeclared global;
- more than 64 entries; an id outside `^[a-z][a-z0-9_]{0,63}$`.

Warnings:
- a credential no machine accepts: no sign-in PC whose policy accepts the kind, admits the account and (for connecting kinds) is `connectsTo`;
- `connectsTo` PC whose access list does not admit the account (always refused);
- a `held` proof item that does not carry the matching `credential`, or an item `credential` whose entry's proof is not `held` on that item;
- a `foundIn` item whose text does not contain the account's password (the message never quotes it);
- a policy `accepts` without `password`; `accepts` on a policy no PC uses.

### 6.5 Tests

- `test/unit/credential_model_test.rb`: kinds, default accepts, proof kinds, registry cap and ordering.
- `test/models/break_escape/credential_keyring_test.rb`: each proof kind holds and stops holding; a forged inventory item with the right id does not prove `held`; implicit entries equal the GET /capture_secrets accounts and secrets; `password` only under `revealSecret`.
- `test/controllers/break_escape/keyring_route_test.rb`: answers, `rev` and `unchanged`, routes, `usable`, unreachable `pc_id` ignored.
- `test/controllers/break_escape/capture_secrets_unchanged_test.rb`: the golden check of section 4.
- `test/controllers/break_escape/sync_payload_size_test.rb`: bootstrap without `credentials`; GET /keyring at 64 entries under 16 KB.
- JS validator tests `test/js/validator-credentials.test.mjs`: one fixture per error and warning above, run through the real validator.
- Scenario `test_access_keyring` (new, section 8) created in this slice with its registry and items, validator-clean.

### 6.6 Live proof

GET /keyring from the page through the real route on a new game of `test_access_keyring`, before and after each proof (take the .rdp, sign in at Lena's PC, plant the drop box). The bootstrap has no `credentials` key.

### 6.7 Sync size

Nothing stored: every proof reads existing state. GET /keyring is a read, sent when the client asks (section 7.5), at most 64 registry entries plus one per captured account; `rev` makes a repeat ask a few bytes.

### 6.8 Cheat analysis

The registry never reaches the browser. Every proof is server-written state; a client-added item is excluded by `client_forged?`. No value of a non-password kind exists to leak. A password is served only where today's rules already serve the same account's password, or once the player holds the session where the file that holds it is served.

## 7. Slice K2 and K3: using a credential

### 7.1 Slice K2: the POST /login credential branch (server)

Base: main after K1. Size: M.

`POST /login { pc_id, credential, foothold? | relay? }` goes to `Game#attempt_credential_login!(pc_id, credential_id, route)`. Checks in this order:

1. The PC exists (404 as today).
2. The id is a string matching the registry pattern, names a registry entry of a built, connecting kind, and its proof holds. Otherwise the generic refusal `{ success: false, message: "Incorrect username or password" }`, identical for an undeclared id, a declared but unproven id, and a `password` kind (which must be typed). Nothing is counted.
3. The route suits the kind (section 3.7): a `relay` param on a `network` kind, or a `foothold` on a `relay` kind, is the generic refusal. The route check then answers as POST /login does today (403 unreachable, 403 not_responding, 403 off at the keyboard, 422 remoteBlocked). A relay route skips reach but not off: an off PC answers 403 not_responding.
4. The policy accepts the kind, else 422 `{ message: <kind's refused text>, kindRefused: true }`.
5. `connectsTo` is this PC, else 422 `{ message: "This connection is for another PC" }`.
6. The PC's access list admits the account, else 422 `LOGIN_NOT_PERMITTED`.
7. A kind with `honours_lockout` is refused while the account is locked out at this PC (`account_locked_out_at?`), with `LOGIN_LOCKED_OUT`.
8. An `assist_invite` in `endedCredentials` answers 422 `{ message: "This invite has ended" }`.
9. `start_login_session!(pc, npc, 'credential', ...)` writes the record of section 3.8; the answer is `login_session_answer` plus `{ kind, label }`.

Only steps 4 to 8 tell the player anything beyond the generic refusal, and each needs a held, proven credential, so the browser cannot probe the registry.

Other server changes:
- `start_login_session!` takes the credential fields; `login_session_answer` adds `kind`, `label` and, for relay, `relay: true`.
- `session_route_up?` (`network_access.rb:1015`): a relay session is up while its credential is not in `endedCredentials`.
- `desktop_request_allowed?` (`network_access.rb:1183`): a request with `relay=1` is allowed when the session at that PC is a relay session, the PC is on, and the session's route is up.
- `end_claimed_sessions!` (`game.rb:2365`): also ends relay sessions (an invite does not survive a reload, as `ends_on_reload` says).
- `endedCredentials`: when a sync merge (`merge_global_variables!`, reading `stored_scenario_data`) sees an `endsOnGlobal` true, the server adds that credential id to `player_state['endedCredentials']` (grow-only, never read from the client, at most 64 ids) and ends its relay sessions. A client that later clears the global cannot revive the invite.
- `ACCESS_STATE_DEFAULTS` gains `endedCredentials: []`; it is not in the client's synced state.
- The `via` readers of section 3.8.

Tests: `test/controllers/break_escape/credential_login_test.rb`: each step's refusal; the generic refusal is byte-identical for undeclared, unproven and password-kind ids; no failure counted; a lockout refuses `saved_connection` but not `assist_invite`; relay without reach succeeds, relay on an off PC is refused; the ended invite stays ended after the global is cleared; reload ends a relay session; `host_row` lists a credential session as held. `test/models/break_escape/credential_sessions_test.rb`: pruning of foothold credential sessions on unplug is as for password sessions.

Live proof: tampered-client calls from the page against `test_access_keyring`: an undeclared id, an unheld .rdp, a forged inventory item with the .rdp's id, a relay param on the .rdp, the .rdp at Jake's PC (policy refuses), and after Jake ends the invite, clearing the global by sync and retrying.

Sync: the session record gains `via: "credential"`, `credential` (at most 64 characters) and one route field, in the one slot per PC. `endedCredentials` is bounded by the registry and server-only. The POST body gains one id.

### 7.2 Slice K3: the keyring on screen (client)

Base: main after K2. Size: M to L.

#### 7.2.1 The sign-in screen (shared module, keyboard and remote)

The "Captured sign-ins" row of 2b0 becomes the **Keyring** row, on every sign-in screen (keyboard, remote, Switch user). It holds one tile per keyring entry usable at this PC, grouped by account (headshot, name, and a kind line in the pixel font: "password, captured", "password, from passwords.txt", "saved connection, HB-FIN-02.rdp", "remote assist invite"). Entries not usable here are not shown on the screen.

- A password tile chooses the account as a captured tile does today: the Password field, filled only when the server sent the password.
- A credential tile chooses the account and replaces the Password field with one line, "Signs in with the saved connection HB-FIN-02.rdp", and the Sign in button. Sign in posts `credential` with the screen's own route (keyboard, its foothold, or relay). The answer's refusal text shows in the screen's usual error line.
- A PC tile whose account also has a keyring entry gets the small tag ("Captured", or the kind word) as in K0; choosing it uses the PC tile, and the keyring entry stays available in the row.
- Loading: the screen asks `/login_accounts`, `/capture_secrets` (unchanged) and `/keyring?pc_id=&foothold=` together, and stays in the loading state until all three answer.

#### 7.2.2 Credential items

A held item whose `credential` is of a connecting kind: its tray click is Connect. The client asks GET /keyring (with `rev`) and reads the entry's `routes`:
- first foothold route: open the target's remote sign-in screen through it, with the entry chosen;
- relay: open the remote screen in relay mode (header "Remote assist", no network view trip), with the entry chosen;
- no route: toast "HB-FIN-02 can't be reached from here." and nothing else;
- the entry is missing (proof no longer holds, for example an ended invite): toast "This no longer works."

The item's observations still show on hover. One click is one action (UI rule: act directly).

#### 7.2.3 The desktop

A credential session's desktop header shows "Lena Fox (lfox), saved connection" in the monitor bezel, and for relay "Jake Brooks (jbrooks), remote assist". Switch user from it opens the same screen with the same route.

#### 7.2.4 The keyring view

Per decision D4 (recommended: the capture log grows a Keyring section where the scenario has one, and no new inventory item in phase 1): a "Keyring" section in the capture log lists every entry grouped by account, with the same tile look; a connecting entry's row runs Connect. Values follow the Captures section's rule.

#### 7.2.5 "New on your keyring"

The client keeps the last answer's entry ids in memory. It asks GET /keyring with `rev` after: a successful sign-in, an inventory add or removal of an item with `credential`, a plant, implant or Wi-Fi join, and a recorded capture. Ids new since the last answer give one toast ("New on your keyring: Jake Brooks, password (from passwords.txt)"). The first answer after a page load is the baseline and toasts nothing. Nothing is written to globals or player state.

#### 7.2.6 Files

`minigames/password/password-minigame.js` (Keyring row, credential choice, Sign in branch), `css/password-minigame.css`, `systems/unlock-system.js` (three-way fetch, relay mode, Connect), `api-client.js` (`keyring`, `loginWithCredential`), `systems/keyring.js` (new: the cache, `rev`, the toast diff), `systems/pc-sessions.js` (credential and relay sessions, `via != "claim"`), `systems/screen-states.js:83`, `minigames/container/container-minigame.js` (header line, relay desktop requests), `minigames/capture-log/` (Keyring section), `systems/interactions.js` or the inventory click registry (Connect).

#### 7.2.7 Tests

- JS `test/js/keyring-signin.test.mjs`: the Keyring row on keyboard and remote screens; grouping; a credential tile hides the Password field and posts `credential` with the screen's route; refusal texts; loading with three pending requests.
- JS `test/js/keyring-client.test.mjs`: `rev` reuse, the toast diff, baseline after load, Connect route choice and the two toasts.
- JS `test/js/capture-log-keyring.test.mjs`: the section, values hidden, Connect from a row.
- `test/js/pc-monitor-frame.test.mjs`: the Keyring row and the credential line inside the screen at both scales.
- Harness copy lists updated for `systems/keyring.js`.

#### 7.2.8 Live proof

The beats of section 8 on new games of `test_access_keyring`, shots of every screen state at the four sizes with scrollbars shown, and `verify-run.rb` showing the sessions and tasks.

#### 7.2.9 Sync size

Nothing stored. Requests: one GET /keyring per trigger, usually `{ rev, unchanged: true }`.

### 7.3 Cheat analysis for K2 and K3

All kinds are secret-class and hard-enforced: a saved connection or an invite opens an account without its password, so each is treated as a password is.

| Attempt | Server answer |
|---|---|
| Post an id from the page without holding its proof | generic refusal, nothing counted |
| Forge the item into the inventory | `client_forged?` excludes it; generic refusal |
| Use a credential at another PC | "This connection is for another PC" (only after a valid proof) |
| Use a relay route on a saved connection | generic refusal |
| Use a foothold not held, or one that does not reach | 403 as today |
| Use a kind the policy refuses | the kind's refused text |
| Keep an invite after the NPC ended it, by clearing the global | `endedCredentials` is grow-only on the server |
| Never let the NPC end the invite | allowed: honest play can reach it (the NPC may never grow suspicious), and a reload ends it |
| Skip a lockout with a saved connection | refused while locked out |
| Read a token or hash value | no value exists in any answer |

## 8. Slice K4: signing in from a desktop

Base: main after K3. Size: M. Droppable: without it, network kinds need a foothold or the keyboard.

- Route `from: pcId` (section 3.7) on POST /login, GET /keyring `routes`, and GET /container (`desktop_request_allowed?`) and scoped requests (`session_route_up?`): a `from` session is up while the session at `pcId` exists, its own route is up, `pcId` is on, and the target's network is still in `networks_reachable_from(network of pcId)`.
- `prune_unreachable_sessions!` (`network_access.rb:1150`): iterate to a fixed point, ending a `from` session whose source session is gone or whose network is no longer reachable from it. `logout_session!` and `end_claimed_sessions!` already call it.
- Client: Connect prefers a `from` route whose source is the desktop the player has open (the PC whose desktop the item was taken from or is used on), then footholds, as section 7.2.2. The remote screen's header reads "Remote session from HB-DESK-01".
- Tests: `test/controllers/break_escape/credential_from_route_test.rb` (route checks, chained prune on logout and on reload of a claimed source, no `from` route for a relay kind); JS route choice.
- Live proof: the worked pivot below, from Sam's keyboard with no foothold.
- Sync: one route field in the session record.
- Cheat: `from` names a session the server holds; its reach is the same walk shares already use (`mapped_shares`).

### 8.1 Test scenario `test_access_keyring`

Browser-only, no VM, built in K1 and grown in K2 to K4. Rooms: a lobby (start), an office with Sam's PC (`HB-DESK-01`, `office_lan`), a finance room with Lena's PC (`HB-FIN-02`, policy `finance`) and Jake's PC (`HB-FIN-03`, policy `no_saved`: `accepts: ["password", "assist_invite"]`), a comms room with a jack (drop box foothold), and a server room with `SV-OPS-01` (policy `pw_only`: `accepts: ["password"]`). Credentials: `lena_rdp` (held, on Sam's desktop), `jake_pw_note` (session at Lena's PC, `foundIn` passwords.txt), `jake_assist` (held, given by a lobby "Helpdesk phone" object's `triggerOnInteract` declared grant; a second object "Jake hangs up" sets `jake_ended_assist`). PLAYTEST.md beats:

| Beat | What it proves | Slice |
|---|---|---|
| R1 | Sam's desktop: take HB-FIN-02.rdp; toast "New on your keyring" | K1, K3 |
| R2 | Connect from the tray with the drop box planted: Lena's desktop, header "saved connection" | K2, K3 |
| R3 | passwords.txt on Lena's desktop; keyring gains Jake's password | K1, K3 |
| R4 | Switch user at Lena's PC: Jake's keyring tile, password typed from the file; a wrong one counts | K3 |
| R5 | The .rdp at SV-OPS-01 refused: "This PC does not allow saved passwords" | K2 |
| R6 | Helpdesk phone: assist code; Connect with no foothold: Jake's desktop over the relay | K2, K3 |
| R7 | Jake hangs up: the relay session ends; Connect says "This no longer works." | K2 |
| R8 | Reload: relay sessions gone, the .rdp session through the foothold kept | K2 |
| R9 | Unplug the drop box: the .rdp session ends as a password session would | K2 |
| R10 | No drop box: Connect from Sam's keyboard session (from route) | K4 |
| R11 | Tampered-client checks of section 7.3 | K2 |

## 9. Phase 2 sketch: tokens

- `KINDS['token'] = { built: true, connects: true, route: :foothold_bound, honours_lockout: false, label: 'session token' }`. Registry fields `connectsTo`, `proof: { foothold }`, `expiresMin`.
- The token is live while its proof foothold is held and until `expiresMin` game minutes after it was first used, timed on the server clock as the guest claim already is. First use time lives in `player_state['credentialClock'][credId]` (bounded by the registry, server-only).
- Route: the proof foothold itself; the session record's `foothold` is that foothold, so today's pruning ends it on loss; `session_route_up?` adds the expiry.
- No new endpoint, no change to the keyring answer shape, no change to the client beyond a kind label and an "expires in" line.
- `lab_social_engineering`'s `sofia_remote` maps onto this kind (decision D5).

## 10. Phase 3 sketch: hashes and machine accounts

- `KINDS['hash'] = { built: true, connects: false, honours_lockout: false, label: 'stored hash' }`, never in `DEFAULT_ACCEPTS`. Registry field `acceptedOn` (sign-in PC ids). The login check adds "this PC is in `acceptedOn`".
- A hash is used from the keyring tile on the target's screen through the screen's route, as K3's credential tiles are.
- Machine accounts (decision D3): either a top-level `accounts` block (`{ local_admin: { displayName, username } }`) read through one `account_for_id` that every session reader moves to, or hashes tied to NPC accounts only.
- Same registry, same proofs, same policy field, same POST branch.

## 11. Format version

Phases 0 to 3 add optional fields only (`remoteScreen`, `accepts`, `credentials`, item `credential`), rename nothing and move nothing. No `FormatUpgrade` step is needed; each slice runs at whatever format is current when it lands (format 1 on main; steps 8b and 8c hold 2 and 3). Conflicts with 8b and 8c are textual only: both edit `known_item_fields` and the schema's item definition, so whichever lands second rebases. A step would be needed only if the sign-in fields were later tidied into one block or `creds.password` folded into the registry; this plan does neither.

## 12. Decisions for the user

### D1. The default remote screen: tiles or typed

- Options: (a) `"tiles"` by default, with missions opting into `"typed"` on hardened PCs; (b) `"typed"` by default, tiles only where a scenario opts in to teach enumeration.
- Recommendation: (a). It matches the q92 pick and the keyboard screen, and a hardened policy is one line.
- Blocks: K0 (one constant; K0 can build with (a) and flip it).
- Evidence to show: K0's shots of Sam's PC over the network in both modes at 1400x1000 and 390x844; the two policy JSON snippets; the list of current scenarios with networks and remote-allowed PCs that would change under each default.

### D2. The phase 1 kinds

- Options: (a) `saved_connection` and `assist_invite`; (b) bring `token` forward into phase 1.
- Recommendation: (a). Tokens need the server clock and a foothold binding, and the only content that wants them (the labs' items) needs a separate yes (D5).
- Blocks: K1 (the built kinds) and K2.
- Evidence: the lab's `sofia_remote` JSON (`lab_social_engineering/scenario.json.erb:170-200`); the kind table of section 3.6; a side-by-side of the K2 check list with and without the token rules; the keyring mock with each kind.

### D3. Machine accounts

- Options: (a) a top-level `accounts` block for accounts with no person; (b) hashes tied to NPC accounts only.
- Recommendation: (a), in phase 3, with the reader audit listed there.
- Blocks: phase 3 only.
- Evidence: both JSON shapes; the list of server readers that assume a session id is an NPC (`session_identity`, `session_for_client`, `host_row`, `login_session_answer`, the profile and share access checks).

### D4. The keyring view

- Options: (a) the capture log grows a Keyring section, plus the Keyring row on every sign-in screen; (b) a separate Keyring item in the inventory, given when the scenario declares credentials; (c) the sign-in screens only.
- Recommendation: (a). Only `test_capture_log` carries a capture log today, so in most scenarios the sign-in screen is the keyring; that suits the "what does this machine accept" model, and no new item or art is needed.
- Blocks: K3 (section 7.2.4 only; the rest of K3 is the same under all three).
- Evidence: a shot of the capture log in `test_capture_log`; a mock of its Keyring section; the sign-in screen mock with the Keyring row; the list of scenarios with a capture log.

### D5. Converting lab_social_engineering's item for new games

- Options: (a) not in phase 1; convert `sofia_remote` to a `token` credential in phase 2, for new games only; (b) convert it in phase 1 as an `assist_invite`; (c) leave it as is.
- Recommendation: (a). The honest kind for a phished foothold is a token, the lab is played on Hacktivity, and saved games keep their stored scenario data either way.
- Blocks: nothing in phase 1.
- Evidence: the timer and item JSON with line numbers, the dungeon graph node, a side-by-side of the item now and as a token credential, and the same for `lab_physical_pentest/scenario.json.erb:586`.

## 13. Defaults settled in this plan

- The option-2 inline item shape is not accepted by the loader: no content uses it.
- `password` is always accepted; a list without it only draws a warning.
- Account admission is not pre-judged in `usable`, so the refusal teaches it as for typed passwords.
- A lockout refuses a saved connection (it presents the password) but not an assist invite (the person's own live session).
- A relay session does not extend reach and ends on reload.
- Signing in from a desktop (K4) is its own droppable slice.
- Credential items keep an existing item type and icon.

## Appendix A. Handover

Not needed yet.
